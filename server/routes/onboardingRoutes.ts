/**
 * Onboarding Pipeline API Routes - Sales & Gamification System
 * 
 * Endpoints:
 * - GET /api/onboarding/progress - Get full onboarding progress
 * - GET /api/onboarding/tasks - Get all onboarding tasks
 * - POST /api/onboarding/tasks/:taskId/complete - Mark task as complete
 * - POST /api/onboarding/tasks/:taskId/progress - Update task progress
 * - POST /api/onboarding/tasks/:taskId/skip - Skip a task
 * - POST /api/onboarding/pipeline/status - Update pipeline status
 * - POST /api/onboarding/trial/start - Start trial
 * - GET /api/onboarding/rewards - Get available rewards
 * - POST /api/onboarding/rewards/:rewardId/apply - Apply reward
 * - POST /api/onboarding/events - Process system event
 */

import { Router } from 'express';
import { onboardingPipelineService, type PipelineStatus } from '../services/onboardingPipelineService';
import { isFeatureEnabled } from '@shared/platformConfig';
import { z } from 'zod';

export const onboardingRouter = Router();

const ensureOnboardingEnabled = (req: any, res: any, next: any) => {
  if (!isFeatureEnabled('enableOnboardingPipeline')) {
    return res.status(403).json({ 
      error: 'Onboarding pipeline feature is not enabled',
      enabled: false 
    });
  }
  next();
};

const requireWorkspace = (req: any, res: any, next: any) => {
  const workspaceId = req.session?.workspaceId;
  if (!workspaceId) {
    return res.status(401).json({ error: 'No workspace selected' });
  }
  req.workspaceId = workspaceId;
  next();
};

onboardingRouter.get('/progress', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const progress = await onboardingPipelineService.getProgress(req.workspaceId);
    
    res.json({
      success: true,
      data: progress,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error getting progress:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.get('/tasks', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const tasks = await onboardingPipelineService.getTasks(req.workspaceId);
    
    res.json({
      success: true,
      tasks,
      count: tasks.length,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error getting tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

const completeTaskSchema = z.object({
  userId: z.string().optional(),
});

onboardingRouter.post('/tasks/:taskId/complete', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { userId } = completeTaskSchema.parse(req.body);
    
    const progress = await onboardingPipelineService.completeTask(
      req.workspaceId,
      taskId,
      userId || req.session?.userId
    );
    
    res.json({
      success: true,
      message: 'Task completed successfully',
      data: progress,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error completing task:', error);
    res.status(500).json({ error: error.message });
  }
});

const updateProgressSchema = z.object({
  progress: z.number().min(0),
});

onboardingRouter.post('/tasks/:taskId/progress', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    const { progress } = updateProgressSchema.parse(req.body);
    
    const task = await onboardingPipelineService.updateTaskProgress(
      req.workspaceId,
      taskId,
      progress
    );
    
    res.json({
      success: true,
      message: 'Task progress updated',
      task,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error updating progress:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.post('/tasks/:taskId/skip', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { taskId } = req.params;
    
    const task = await onboardingPipelineService.skipTask(req.workspaceId, taskId);
    
    res.json({
      success: true,
      message: 'Task skipped',
      task,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error skipping task:', error);
    res.status(500).json({ error: error.message });
  }
});

const pipelineStatusSchema = z.object({
  status: z.enum([
    'invited', 
    'email_opened', 
    'trial_started', 
    'trial_active', 
    'trial_expired', 
    'accepted', 
    'rejected',
    'churned'
  ]),
  reason: z.string().optional(),
});

onboardingRouter.post('/pipeline/status', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { status, reason } = pipelineStatusSchema.parse(req.body);
    
    const workspace = await onboardingPipelineService.updatePipelineStatus(
      req.workspaceId,
      status as PipelineStatus,
      reason
    );
    
    res.json({
      success: true,
      message: `Pipeline status updated to ${status}`,
      pipelineStatus: workspace.pipelineStatus,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error updating pipeline status:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.post('/trial/start', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const workspace = await onboardingPipelineService.startTrial(req.workspaceId);
    
    res.json({
      success: true,
      message: 'Trial started successfully',
      trialStartedAt: workspace.trialStartedAt,
      trialEndsAt: workspace.trialEndsAt,
      trialDays: workspace.trialDays,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error starting trial:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.post('/initialize', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const progress = await onboardingPipelineService.initializeOnboarding(req.workspaceId);
    
    res.json({
      success: true,
      message: 'Onboarding initialized',
      data: progress,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error initializing:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.get('/rewards', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const rewards = await onboardingPipelineService.getAvailableRewards(req.workspaceId);
    
    res.json({
      success: true,
      rewards,
      count: rewards.length,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error getting rewards:', error);
    res.status(500).json({ error: error.message });
  }
});

const applyRewardSchema = z.object({
  invoiceId: z.string().optional(),
});

onboardingRouter.post('/rewards/:rewardId/apply', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { invoiceId } = applyRewardSchema.parse(req.body);
    
    const reward = await onboardingPipelineService.applyReward(req.workspaceId, invoiceId);
    
    res.json({
      success: true,
      message: 'Reward applied successfully',
      reward,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error applying reward:', error);
    
    if (error.message.includes('expired')) {
      return res.status(400).json({ error: error.message });
    }
    if (error.message.includes('not found')) {
      return res.status(404).json({ error: error.message });
    }
    
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.post('/ai-tasks/generate', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const tasks = await onboardingPipelineService.generateDynamicTasks(req.workspaceId);
    
    res.json({
      success: true,
      message: `Generated ${tasks.length} personalized tasks`,
      tasks,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error generating AI tasks:', error);
    res.status(500).json({ error: error.message });
  }
});

const systemEventSchema = z.object({
  eventType: z.string(),
  eventData: z.record(z.any()).optional(),
});

onboardingRouter.post('/events', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { eventType, eventData } = systemEventSchema.parse(req.body);
    
    await onboardingPipelineService.processSystemEvent(
      req.workspaceId,
      eventType,
      eventData
    );
    
    res.json({
      success: true,
      message: `Event ${eventType} processed`,
    });
  } catch (error: any) {
    console.error('[Onboarding] Error processing event:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// AI DATA MIGRATION ENDPOINTS
// ============================================================================

import { onboardingOrchestrator, type OnboardingSource } from '../services/ai-brain/subagents/onboardingOrchestrator';
import { dataMigrationAgent } from '../services/ai-brain/subagents/dataMigrationAgent';
import { gamificationActivationAgent } from '../services/ai-brain/subagents/gamificationActivationAgent';

const dataImportSourceSchema = z.object({
  type: z.enum(['pdf', 'excel', 'csv', 'manual', 'bulk_text']),
  fileContent: z.string().optional(),
  fileName: z.string().optional(),
  data: z.array(z.record(z.any())).optional(),
  headers: z.array(z.string()).optional(),
  formData: z.record(z.any()).optional(),
  extractionType: z.enum(['employees', 'teams', 'schedules', 'auto']).optional(),
});

const aiOnboardingSchema = z.object({
  sources: z.array(dataImportSourceSchema).optional(),
  options: z.object({
    skipGamification: z.boolean().optional(),
    skipDataMigration: z.boolean().optional(),
    validateOnly: z.boolean().optional(),
    unlockBasicAutomation: z.boolean().optional(),
  }).optional(),
});

onboardingRouter.post('/ai/start', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { sources, options } = aiOnboardingSchema.parse(req.body);
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await onboardingOrchestrator.runOnboarding({
      workspaceId: req.workspaceId,
      userId,
      sources: sources as OnboardingSource[],
      options,
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('[Onboarding] AI onboarding error:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.get('/ai/status', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const status = await onboardingOrchestrator.getOnboardingStatus(req.workspaceId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('[Onboarding] Status error:', error);
    res.status(500).json({ error: error.message });
  }
});

const extractDataSchema = z.object({
  source: dataImportSourceSchema,
});

onboardingRouter.post('/ai/extract', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { source } = extractDataSchema.parse(req.body);
    
    let extracted;
    switch (source.type) {
      case 'pdf':
        if (!source.fileContent || !source.fileName) {
          return res.status(400).json({ error: 'PDF requires fileContent and fileName' });
        }
        extracted = await dataMigrationAgent.extractFromPdf({
          workspaceId: req.workspaceId,
          fileContent: source.fileContent,
          fileName: source.fileName,
          extractionType: source.extractionType || 'auto',
        });
        break;
      case 'excel':
      case 'csv':
        if (!source.data || !source.headers) {
          return res.status(400).json({ error: 'Spreadsheet requires data and headers' });
        }
        extracted = await dataMigrationAgent.extractFromSpreadsheet({
          workspaceId: req.workspaceId,
          data: source.data,
          headers: source.headers,
          extractionType: source.extractionType || 'auto',
        });
        break;
      case 'manual':
      case 'bulk_text':
        if (!source.formData) {
          return res.status(400).json({ error: 'Manual entry requires formData' });
        }
        extracted = await dataMigrationAgent.parseManualEntry({
          workspaceId: req.workspaceId,
          formData: source.formData,
          entryType: source.type === 'bulk_text' ? 'bulk_text' : 'employee',
        });
        break;
      default:
        return res.status(400).json({ error: 'Invalid source type' });
    }

    const validation = await dataMigrationAgent.validateData({
      workspaceId: req.workspaceId,
      data: extracted,
    });

    res.json({
      success: true,
      data: {
        extracted,
        validation,
      },
    });
  } catch (error: any) {
    console.error('[Onboarding] Extract error:', error);
    res.status(500).json({ error: error.message });
  }
});

const importDataSchema = z.object({
  data: z.object({
    employees: z.array(z.any()).optional(),
    teams: z.array(z.any()).optional(),
    schedules: z.array(z.any()).optional(),
  }),
  skipDuplicates: z.boolean().optional(),
});

onboardingRouter.post('/ai/import', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const { data, skipDuplicates } = importDataSchema.parse(req.body);
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await dataMigrationAgent.importData({
      workspaceId: req.workspaceId,
      userId,
      data: {
        employees: data.employees || [],
        teams: data.teams || [],
        schedules: data.schedules || [],
        confidence: 1,
        warnings: [],
        errors: [],
      },
      skipDuplicates: skipDuplicates ?? true,
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('[Onboarding] Import error:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.post('/ai/gamification/activate', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const userId = req.session?.userId;
    
    if (!userId) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const result = await gamificationActivationAgent.activateForOrg({
      workspaceId: req.workspaceId,
      userId,
      options: {
        includeStarterBadges: true,
        initializeAllEmployees: true,
        unlockBasicAutomation: true,
      },
    });

    res.json({
      success: result.success,
      data: result,
    });
  } catch (error: any) {
    console.error('[Onboarding] Gamification activation error:', error);
    res.status(500).json({ error: error.message });
  }
});

onboardingRouter.get('/ai/automation-gates', ensureOnboardingEnabled, requireWorkspace, async (req: any, res) => {
  try {
    const status = await gamificationActivationAgent.getAutomationGateStatus(req.workspaceId);

    res.json({
      success: true,
      data: status,
    });
  } catch (error: any) {
    console.error('[Onboarding] Automation gates error:', error);
    res.status(500).json({ error: error.message });
  }
});
