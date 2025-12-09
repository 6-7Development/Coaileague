/**
 * ONBOARDING ORCHESTRATOR
 * ========================
 * Coordinates parallel execution of onboarding subagents for new organizations.
 * 
 * When a new org is created, invited, or subscribes, this orchestrator:
 * 1. Triggers DataMigrationAgent for data extraction (PDF/Excel/manual)
 * 2. Triggers GamificationActivationAgent in parallel
 * 3. Coordinates completion and reports results
 * 
 * This enables orgs to work out-of-box with migrated data and unlocked automation.
 */

import { dataMigrationAgent, type ExtractedData, type MigrationResult } from './dataMigrationAgent';
import { gamificationActivationAgent, type ActivationResult, AUTOMATION_GATES } from './gamificationActivationAgent';
import { db } from '../../../db';
import { workspaces } from '@shared/schema';
import { eq } from 'drizzle-orm';

export interface OnboardingSource {
  type: 'pdf' | 'excel' | 'csv' | 'manual' | 'bulk_text';
  fileContent?: string; // base64 for PDF
  fileName?: string;
  data?: Record<string, any>[]; // For spreadsheet data
  headers?: string[]; // For spreadsheet columns
  formData?: Record<string, any>; // For manual entry
  extractionType?: 'employees' | 'teams' | 'schedules' | 'auto';
}

export interface OnboardingRequest {
  workspaceId: string;
  userId: string;
  sources?: OnboardingSource[];
  options?: {
    skipGamification?: boolean;
    skipDataMigration?: boolean;
    validateOnly?: boolean;
    unlockBasicAutomation?: boolean;
  };
}

export interface OnboardingResult {
  success: boolean;
  workspaceId: string;
  duration: number;
  dataExtraction?: {
    success: boolean;
    extracted: ExtractedData;
    validation: { valid: boolean; issues: string[] };
  };
  dataMigration?: MigrationResult;
  gamificationActivation?: ActivationResult;
  summary: {
    employeesImported: number;
    achievementsCreated: number;
    automationGatesUnlocked: string[];
    readyToWork: boolean;
  };
  errors: string[];
  warnings: string[];
}

class OnboardingOrchestrator {
  private static instance: OnboardingOrchestrator;

  static getInstance(): OnboardingOrchestrator {
    if (!OnboardingOrchestrator.instance) {
      OnboardingOrchestrator.instance = new OnboardingOrchestrator();
    }
    return OnboardingOrchestrator.instance;
  }

  /**
   * Run full onboarding flow for a new organization
   * Executes data migration and gamification activation in parallel
   */
  async runOnboarding(request: OnboardingRequest): Promise<OnboardingResult> {
    const startTime = Date.now();
    const { workspaceId, userId, sources = [], options = {} } = request;
    const { 
      skipGamification = false, 
      skipDataMigration = false,
      validateOnly = false,
      unlockBasicAutomation = true,
    } = options;

    console.log(`[OnboardingOrchestrator] Starting onboarding for workspace ${workspaceId}`);

    const result: OnboardingResult = {
      success: true,
      workspaceId,
      duration: 0,
      summary: {
        employeesImported: 0,
        achievementsCreated: 0,
        automationGatesUnlocked: [],
        readyToWork: false,
      },
      errors: [],
      warnings: [],
    };

    try {
      // Verify workspace exists
      const [workspace] = await db.select()
        .from(workspaces)
        .where(eq(workspaces.id, workspaceId))
        .limit(1);

      if (!workspace) {
        throw new Error(`Workspace ${workspaceId} not found`);
      }

      // Create parallel tasks
      const parallelTasks: Promise<void>[] = [];

      // Task 1: Data Migration (if sources provided)
      if (!skipDataMigration && sources.length > 0) {
        parallelTasks.push(
          this.runDataMigration(workspaceId, userId, sources, validateOnly).then(migrationResult => {
            result.dataExtraction = migrationResult.extraction;
            result.dataMigration = migrationResult.migration;
            result.summary.employeesImported = migrationResult.migration?.importedCounts.employees || 0;
            if (migrationResult.errors.length > 0) {
              result.errors.push(...migrationResult.errors);
            }
            if (migrationResult.warnings.length > 0) {
              result.warnings.push(...migrationResult.warnings);
            }
          })
        );
      }

      // Task 2: Gamification Activation (always runs unless skipped)
      if (!skipGamification) {
        parallelTasks.push(
          gamificationActivationAgent.activateForOrg({
            workspaceId,
            userId,
            options: {
              includeStarterBadges: true,
              initializeAllEmployees: true,
              unlockBasicAutomation,
            },
          }).then(gamificationResult => {
            result.gamificationActivation = gamificationResult;
            result.summary.achievementsCreated = gamificationResult.achievementsCreated;
            result.summary.automationGatesUnlocked = gamificationResult.automationGatesUnlocked;
            if (gamificationResult.errors.length > 0) {
              result.errors.push(...gamificationResult.errors);
            }
          })
        );
      }

      // Execute all tasks in parallel
      await Promise.all(parallelTasks);

      // Determine if org is ready to work
      result.summary.readyToWork = result.errors.length === 0 && (
        result.summary.employeesImported > 0 || 
        result.gamificationActivation?.success === true
      );

      result.success = result.errors.length === 0;

    } catch (error: any) {
      console.error('[OnboardingOrchestrator] Onboarding failed:', error);
      result.success = false;
      result.errors.push(error.message);
    }

    result.duration = Date.now() - startTime;
    console.log(`[OnboardingOrchestrator] Onboarding completed in ${result.duration}ms:`, result.summary);

    return result;
  }

  /**
   * Run data extraction and migration from provided sources
   */
  private async runDataMigration(
    workspaceId: string,
    userId: string,
    sources: OnboardingSource[],
    validateOnly: boolean
  ): Promise<{
    extraction?: { success: boolean; extracted: ExtractedData; validation: { valid: boolean; issues: string[] } };
    migration?: MigrationResult;
    errors: string[];
    warnings: string[];
  }> {
    const errors: string[] = [];
    const warnings: string[] = [];
    let combinedData: ExtractedData = {
      employees: [],
      teams: [],
      schedules: [],
      confidence: 0,
      warnings: [],
      errors: [],
    };

    // Extract data from all sources
    for (const source of sources) {
      try {
        let extracted: ExtractedData;

        switch (source.type) {
          case 'pdf':
            if (!source.fileContent || !source.fileName) {
              warnings.push('PDF source missing file content or name');
              continue;
            }
            extracted = await dataMigrationAgent.extractFromPdf({
              workspaceId,
              fileContent: source.fileContent,
              fileName: source.fileName,
              extractionType: source.extractionType || 'auto',
            });
            break;

          case 'excel':
          case 'csv':
            if (!source.data || !source.headers) {
              warnings.push(`${source.type.toUpperCase()} source missing data or headers`);
              continue;
            }
            extracted = await dataMigrationAgent.extractFromSpreadsheet({
              workspaceId,
              data: source.data,
              headers: source.headers,
              extractionType: source.extractionType || 'auto',
            });
            break;

          case 'manual':
          case 'bulk_text':
            if (!source.formData) {
              warnings.push('Manual entry missing form data');
              continue;
            }
            extracted = await dataMigrationAgent.parseManualEntry({
              workspaceId,
              formData: source.formData,
              entryType: source.type === 'bulk_text' ? 'bulk_text' : 
                (source.extractionType as 'employee' | 'team' | 'schedule') || 'bulk_text',
            });
            break;

          default:
            warnings.push(`Unknown source type: ${source.type}`);
            continue;
        }

        // Merge extracted data
        if (extracted.employees) combinedData.employees!.push(...extracted.employees);
        if (extracted.teams) combinedData.teams!.push(...extracted.teams);
        if (extracted.schedules) combinedData.schedules!.push(...extracted.schedules);
        combinedData.warnings.push(...extracted.warnings);
        combinedData.errors.push(...extracted.errors);
        combinedData.confidence = Math.max(combinedData.confidence, extracted.confidence);

      } catch (error: any) {
        errors.push(`Source extraction failed: ${error.message}`);
      }
    }

    // Validate combined data
    const validation = await dataMigrationAgent.validateData({
      workspaceId,
      data: combinedData,
    });

    const extractionResult = {
      success: combinedData.errors.length === 0,
      extracted: combinedData,
      validation,
    };

    // If validate only, return without importing
    if (validateOnly) {
      return {
        extraction: extractionResult,
        errors,
        warnings: [...warnings, ...combinedData.warnings],
      };
    }

    // Import validated data
    if (validation.valid || combinedData.employees!.length > 0) {
      const migrationResult = await dataMigrationAgent.importData({
        workspaceId,
        userId,
        data: combinedData,
        skipDuplicates: true,
      });

      return {
        extraction: extractionResult,
        migration: migrationResult,
        errors: [...errors, ...migrationResult.errors],
        warnings: [...warnings, ...combinedData.warnings, ...migrationResult.warnings],
      };
    }

    return {
      extraction: extractionResult,
      errors,
      warnings: [...warnings, ...combinedData.warnings, ...validation.issues],
    };
  }

  /**
   * Get onboarding status for a workspace
   */
  async getOnboardingStatus(workspaceId: string): Promise<{
    gamificationEnabled: boolean;
    automationGates: { id: string; name: string; unlocked: boolean; requiredLevel: number }[];
    currentLevel: number;
    readyForAutomation: boolean;
  }> {
    const gamificationEnabled = gamificationActivationAgent.isGamificationEnabled(workspaceId);
    const gateStatus = await gamificationActivationAgent.getAutomationGateStatus(workspaceId);

    return {
      gamificationEnabled,
      automationGates: gateStatus.gates.map(g => ({
        id: g.id,
        name: g.name,
        unlocked: g.unlocked,
        requiredLevel: g.requiredLevel,
      })),
      currentLevel: gateStatus.currentLevel,
      readyForAutomation: gateStatus.gates.some(g => g.unlocked),
    };
  }

  /**
   * Trigger onboarding for a newly invited user/org
   */
  async triggerForNewOrg(params: {
    workspaceId: string;
    ownerId: string;
    inviteSource?: 'signup' | 'invite' | 'subscription';
  }): Promise<OnboardingResult> {
    console.log(`[OnboardingOrchestrator] New org trigger: ${params.workspaceId} (${params.inviteSource})`);

    return this.runOnboarding({
      workspaceId: params.workspaceId,
      userId: params.ownerId,
      options: {
        skipDataMigration: true, // No data sources yet
        unlockBasicAutomation: true,
      },
    });
  }

  /**
   * Continue onboarding with data import
   */
  async continueWithDataImport(params: {
    workspaceId: string;
    userId: string;
    sources: OnboardingSource[];
  }): Promise<OnboardingResult> {
    return this.runOnboarding({
      workspaceId: params.workspaceId,
      userId: params.userId,
      sources: params.sources,
      options: {
        skipGamification: true, // Already activated
      },
    });
  }
}

export const onboardingOrchestrator = OnboardingOrchestrator.getInstance();
