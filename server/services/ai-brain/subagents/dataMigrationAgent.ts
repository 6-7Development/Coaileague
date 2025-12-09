/**
 * DATA MIGRATION AGENT
 * ====================
 * Specialized subagent for extracting and migrating data from various sources
 * during new organization onboarding.
 * 
 * Capabilities:
 * - PDF extraction (employee rosters, schedules, payroll docs)
 * - Excel/CSV parsing (bulk employee data, schedules)
 * - Manual entry parsing (structured form data)
 * - Schema mapping and validation
 * - Import into platform tables
 */

import { db } from '../../../db';
import { 
  employees, 
  workspaces,
  users,
} from '@shared/schema';
import { eq, and } from 'drizzle-orm';
import { geminiClient } from '../providers/geminiClient';

export interface ExtractedData {
  employees?: ExtractedEmployee[];
  teams?: ExtractedTeam[];
  schedules?: ExtractedSchedule[];
  rawText?: string;
  confidence: number;
  warnings: string[];
  errors: string[];
}

export interface ExtractedEmployee {
  firstName: string;
  lastName: string;
  email?: string;
  phone?: string;
  position?: string;
  team?: string;
  hourlyRate?: number;
  hireDate?: string;
  employeeId?: string;
}

export interface ExtractedTeam {
  name: string;
  code?: string;
  description?: string;
  managerId?: string;
}

export interface ExtractedSchedule {
  employeeId?: string;
  employeeName?: string;
  date: string;
  startTime: string;
  endTime: string;
  shiftType?: string;
}

export interface MigrationResult {
  success: boolean;
  importedCounts: {
    employees: number;
    teams: number;
    schedules: number;
  };
  skippedCounts: {
    employees: number;
    teams: number;
    schedules: number;
  };
  errors: string[];
  warnings: string[];
}

class DataMigrationAgent {
  private static instance: DataMigrationAgent;

  static getInstance(): DataMigrationAgent {
    if (!DataMigrationAgent.instance) {
      DataMigrationAgent.instance = new DataMigrationAgent();
    }
    return DataMigrationAgent.instance;
  }

  /**
   * Extract data from PDF using Gemini Vision
   */
  async extractFromPdf(params: {
    workspaceId: string;
    fileContent: string; // base64 encoded
    fileName: string;
    extractionType: 'employees' | 'teams' | 'schedules' | 'auto';
  }): Promise<ExtractedData> {
    const { workspaceId, fileContent, fileName, extractionType } = params;

    const prompt = this.buildExtractionPrompt(extractionType, 'pdf');
    
    try {
      const response = await geminiClient.generateVision({
        systemPrompt: prompt,
        userMessage: `Please analyze this ${fileName} document and extract the structured data.`,
        imageData: fileContent,
        workspaceId,
        featureKey: 'ai_onboarding',
      });

      return this.parseExtractionResponse(response.text, extractionType);
    } catch (error: any) {
      console.error('[DataMigrationAgent] PDF extraction failed:', error);
      return {
        confidence: 0,
        warnings: [],
        errors: [`PDF extraction failed: ${error.message}`],
      };
    }
  }

  /**
   * Extract data from Excel/CSV content
   */
  async extractFromSpreadsheet(params: {
    workspaceId: string;
    data: Record<string, any>[];
    headers: string[];
    extractionType: 'employees' | 'teams' | 'schedules' | 'auto';
  }): Promise<ExtractedData> {
    const { workspaceId, data, headers, extractionType } = params;

    const mappingPrompt = `
You are a data migration specialist. Analyze these spreadsheet columns and map them to our workforce management schema.

Columns: ${headers.join(', ')}

Sample data (first 3 rows):
${JSON.stringify(data.slice(0, 3), null, 2)}

Target schema for ${extractionType === 'auto' ? 'employees, teams, or schedules' : extractionType}:

For EMPLOYEES:
- firstName (required)
- lastName (required)
- email (optional)
- phone (optional)
- position (optional)
- team (optional)
- hourlyRate (optional, number)
- hireDate (optional, YYYY-MM-DD)
- employeeId (optional, external ID)

For TEAMS:
- name (required)
- code (optional)
- description (optional)

For SCHEDULES:
- employeeName or employeeId (required)
- date (required, YYYY-MM-DD)
- startTime (required, HH:MM)
- endTime (required, HH:MM)
- shiftType (optional)

Respond with JSON only:
{
  "detectedType": "employees" | "teams" | "schedules",
  "columnMapping": { "sourceColumn": "targetField", ... },
  "confidence": 0.0-1.0,
  "warnings": ["..."]
}`;

    try {
      const response = await geminiClient.generate({
        systemPrompt: 'You are a data migration specialist that maps spreadsheet columns to database schemas.',
        userMessage: mappingPrompt,
        workspaceId,
        featureKey: 'ai_onboarding',
      });

      const mappingText = response.text;
      const jsonMatch = mappingText.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        throw new Error('Failed to parse column mapping');
      }

      const mapping = JSON.parse(jsonMatch[0]);
      const detectedType = extractionType === 'auto' ? mapping.detectedType : extractionType;
      
      const transformedData = this.applyColumnMapping(data, mapping.columnMapping, detectedType);
      
      return {
        ...transformedData,
        confidence: mapping.confidence,
        warnings: mapping.warnings || [],
        errors: [],
      };
    } catch (error: any) {
      console.error('[DataMigrationAgent] Spreadsheet extraction failed:', error);
      return {
        confidence: 0,
        warnings: [],
        errors: [`Spreadsheet extraction failed: ${error.message}`],
      };
    }
  }

  /**
   * Parse manual entry data (structured form submission)
   */
  async parseManualEntry(params: {
    workspaceId: string;
    formData: Record<string, any>;
    entryType: 'employee' | 'team' | 'schedule' | 'bulk_text';
  }): Promise<ExtractedData> {
    const { workspaceId, formData, entryType } = params;

    if (entryType === 'bulk_text') {
      const prompt = `
Extract structured workforce data from this text. The user is trying to add employees, teams, or schedules.

Text input:
${formData.text}

Extract any identifiable:
1. Employee information (names, emails, phones, positions, teams, rates)
2. Team/department names and codes
3. Schedule information (who works when)

Respond with JSON:
{
  "employees": [{ "firstName": "", "lastName": "", "email": "", "phone": "", "position": "", "team": "", "hourlyRate": null }],
  "teams": [{ "name": "", "code": "", "description": "" }],
  "schedules": [{ "employeeName": "", "date": "", "startTime": "", "endTime": "" }],
  "confidence": 0.0-1.0,
  "warnings": ["unclear items or assumptions made"]
}`;

      try {
        const response = await geminiClient.generate({
          systemPrompt: 'You are a data extraction specialist for workforce management systems.',
          userMessage: prompt,
          workspaceId,
          featureKey: 'ai_onboarding',
        });

        const text = response.text;
        const jsonMatch = text.match(/\{[\s\S]*\}/);
        if (!jsonMatch) {
          throw new Error('Failed to parse extracted data');
        }

        const parsed = JSON.parse(jsonMatch[0]);
        return {
          employees: parsed.employees?.filter((e: any) => e.firstName || e.lastName) || [],
          teams: parsed.teams?.filter((d: any) => d.name) || [],
          schedules: parsed.schedules?.filter((s: any) => s.date && s.employeeName) || [],
          rawText: formData.text,
          confidence: parsed.confidence || 0.5,
          warnings: parsed.warnings || [],
          errors: [],
        };
      } catch (error: any) {
        return {
          confidence: 0,
          warnings: [],
          errors: [`Failed to parse bulk text: ${error.message}`],
        };
      }
    }

    if (entryType === 'employee') {
      return {
        employees: [{
          firstName: formData.firstName || '',
          lastName: formData.lastName || '',
          email: formData.email,
          phone: formData.phone,
          position: formData.position,
          team: formData.team,
          hourlyRate: formData.hourlyRate ? parseFloat(formData.hourlyRate) : undefined,
          hireDate: formData.hireDate,
          employeeId: formData.employeeId,
        }],
        confidence: 1.0,
        warnings: [],
        errors: [],
      };
    }

    if (entryType === 'team') {
      return {
        teams: [{
          name: formData.name || '',
          code: formData.code,
          description: formData.description,
        }],
        confidence: 1.0,
        warnings: [],
        errors: [],
      };
    }

    if (entryType === 'schedule') {
      return {
        schedules: [{
          employeeName: formData.employeeName,
          employeeId: formData.employeeId,
          date: formData.date,
          startTime: formData.startTime,
          endTime: formData.endTime,
          shiftType: formData.shiftType,
        }],
        confidence: 1.0,
        warnings: [],
        errors: [],
      };
    }

    return { confidence: 0, warnings: [], errors: ['Unknown entry type'] };
  }

  /**
   * Validate extracted data against platform schema
   */
  async validateData(params: {
    workspaceId: string;
    data: ExtractedData;
  }): Promise<{ valid: boolean; issues: string[] }> {
    const { workspaceId, data } = params;
    const issues: string[] = [];

    if (data.employees) {
      for (let i = 0; i < data.employees.length; i++) {
        const emp = data.employees[i];
        if (!emp.firstName && !emp.lastName) {
          issues.push(`Employee ${i + 1}: Missing both first and last name`);
        }
        if (emp.email && !this.isValidEmail(emp.email)) {
          issues.push(`Employee ${i + 1}: Invalid email format`);
        }
        if (emp.hourlyRate !== undefined && (isNaN(emp.hourlyRate) || emp.hourlyRate < 0)) {
          issues.push(`Employee ${i + 1}: Invalid hourly rate`);
        }
      }
    }

    if (data.teams) {
      for (let i = 0; i < data.teams.length; i++) {
        const team = data.teams[i];
        if (!team.name) {
          issues.push(`Team ${i + 1}: Missing name`);
        }
      }
    }

    if (data.schedules) {
      for (let i = 0; i < data.schedules.length; i++) {
        const sched = data.schedules[i];
        if (!sched.date) {
          issues.push(`Schedule ${i + 1}: Missing date`);
        }
        if (!sched.startTime || !sched.endTime) {
          issues.push(`Schedule ${i + 1}: Missing start or end time`);
        }
        if (!sched.employeeId && !sched.employeeName) {
          issues.push(`Schedule ${i + 1}: Missing employee reference`);
        }
      }
    }

    return { valid: issues.length === 0, issues };
  }

  /**
   * Import validated data into the platform
   */
  async importData(params: {
    workspaceId: string;
    userId: string;
    data: ExtractedData;
    skipDuplicates?: boolean;
  }): Promise<MigrationResult> {
    const { workspaceId, userId, data, skipDuplicates = true } = params;
    
    const result: MigrationResult = {
      success: true,
      importedCounts: { employees: 0, teams: 0, schedules: 0 },
      skippedCounts: { employees: 0, teams: 0, schedules: 0 },
      errors: [],
      warnings: [],
    };

    // Import employees
    if (data.employees?.length) {
      for (const emp of data.employees) {
        try {
          if (emp.email && skipDuplicates) {
            const existing = await db.select()
              .from(employees)
              .where(and(
                eq(employees.workspaceId, workspaceId),
                eq(employees.email, emp.email)
              ))
              .limit(1);

            if (existing.length > 0) {
              result.skippedCounts.employees++;
              result.warnings.push(`Employee "${emp.email}" already exists, skipped`);
              continue;
            }
          }

          await db.insert(employees).values({
            workspaceId,
            firstName: emp.firstName || 'Unknown',
            lastName: emp.lastName || '',
            email: emp.email || null,
            phone: emp.phone || null,
            role: emp.position || null,
            hourlyRate: emp.hourlyRate?.toString() || null,
            isActive: true,
          });
          result.importedCounts.employees++;
        } catch (error: any) {
          result.errors.push(`Failed to import employee "${emp.firstName} ${emp.lastName}": ${error.message}`);
        }
      }
    }

    // Teams would be stored differently (workspace metadata or separate service)
    if (data.teams?.length) {
      result.warnings.push(`${data.teams.length} teams detected - team import requires additional configuration`);
    }

    result.success = result.errors.length === 0;
    return result;
  }

  // ============================================================================
  // PRIVATE HELPERS
  // ============================================================================

  private buildExtractionPrompt(extractionType: string, sourceType: string): string {
    const typeInstructions = {
      employees: 'Focus on extracting employee information: names, contact details, positions, teams, pay rates, hire dates.',
      teams: 'Focus on extracting team/department information: names, codes, descriptions, managers.',
      schedules: 'Focus on extracting schedule information: who works when, dates, times, shift types.',
      auto: 'Analyze the document and extract all workforce-related data: employees, teams, and schedules.',
    };

    return `
You are a document extraction specialist for workforce management systems.
Analyze this ${sourceType} and extract structured data.

${typeInstructions[extractionType as keyof typeof typeInstructions] || typeInstructions.auto}

Respond with valid JSON only (no markdown, no explanation):
{
  "employees": [
    { "firstName": "", "lastName": "", "email": "", "phone": "", "position": "", "team": "", "hourlyRate": null, "hireDate": "", "employeeId": "" }
  ],
  "teams": [
    { "name": "", "code": "", "description": "" }
  ],
  "schedules": [
    { "employeeName": "", "date": "YYYY-MM-DD", "startTime": "HH:MM", "endTime": "HH:MM", "shiftType": "" }
  ],
  "confidence": 0.0-1.0,
  "warnings": ["list any unclear data or assumptions"]
}

Only include arrays that have data. If no data found for a category, omit that array.`;
  }

  private parseExtractionResponse(text: string, extractionType: string): ExtractedData {
    try {
      const jsonMatch = text.match(/\{[\s\S]*\}/);
      if (!jsonMatch) {
        return { confidence: 0, warnings: [], errors: ['No valid JSON found in response'] };
      }

      const parsed = JSON.parse(jsonMatch[0]);
      return {
        employees: parsed.employees || [],
        teams: parsed.teams || [],
        schedules: parsed.schedules || [],
        confidence: parsed.confidence || 0.5,
        warnings: parsed.warnings || [],
        errors: [],
      };
    } catch (error: any) {
      return { confidence: 0, warnings: [], errors: [`Parse error: ${error.message}`] };
    }
  }

  private applyColumnMapping(
    data: Record<string, any>[],
    mapping: Record<string, string>,
    dataType: string
  ): Partial<ExtractedData> {
    const result: Partial<ExtractedData> = {};

    const transformedRows = data.map(row => {
      const transformed: Record<string, any> = {};
      for (const [source, target] of Object.entries(mapping)) {
        if (row[source] !== undefined) {
          transformed[target] = row[source];
        }
      }
      return transformed;
    });

    if (dataType === 'employees') {
      result.employees = transformedRows.map(r => ({
        firstName: r.firstName || '',
        lastName: r.lastName || '',
        email: r.email,
        phone: r.phone,
        position: r.position,
        team: r.team,
        hourlyRate: r.hourlyRate ? parseFloat(r.hourlyRate) : undefined,
        hireDate: r.hireDate,
        employeeId: r.employeeId,
      }));
    } else if (dataType === 'teams') {
      result.teams = transformedRows.map(r => ({
        name: r.name || '',
        code: r.code,
        description: r.description,
      }));
    } else if (dataType === 'schedules') {
      result.schedules = transformedRows.map(r => ({
        employeeId: r.employeeId,
        employeeName: r.employeeName,
        date: r.date || '',
        startTime: r.startTime || '',
        endTime: r.endTime || '',
        shiftType: r.shiftType,
      }));
    }

    return result;
  }

  private isValidEmail(email: string): boolean {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);
  }
}

export const dataMigrationAgent = DataMigrationAgent.getInstance();
