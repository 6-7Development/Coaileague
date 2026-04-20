/**
 * Employee Document Onboarding Routes
 * 
 * API endpoints for managing employee document requirements and work eligibility.
 * Security guards must complete critical documents before being assigned to shifts.
 */

import { Router, Response } from 'express';
import { AuthenticatedRequest } from '../rbac';
import { storage } from '../storage';
import { db } from '../db';
import { employeeDocumentOnboardingService, SecurityPosition } from '../services/employeeDocumentOnboardingService';
import { createLogger } from '../lib/logger';
const log = createLogger('EmployeeOnboardingRoutes');


export const employeeOnboardingRoutes = Router();

// Get employee's own onboarding status (required documents, work eligibility)
employeeOnboardingRoutes.get('/me', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // @ts-expect-error — TS migration: fix in refactoring sprint
    const userId = req.user?.id || (req.user)?.claims?.sub;
    const employee = await storage.getEmployeeByUserId(userId);
    
    if (!employee) {
      return res.status(404).json({ message: "Employee profile not found" });
    }
    
    const status = await employeeDocumentOnboardingService.getEmployeeOnboardingStatus(employee.id);
    
    if (!status) {
      return res.status(404).json({ message: "Unable to fetch onboarding status" });
    }
    
    res.json(status);
  } catch (error: unknown) {
    log.error("Error fetching employee onboarding status:", error);
    res.status(500).json({ message: "Failed to fetch onboarding status" });
  }
});

// GET /api/employee-onboarding/required-documents — employee portal checklist
// Returns all required documents with completion status for the authenticated employee
employeeOnboardingRoutes.get('/required-documents', async (req: AuthenticatedRequest, res: Response) => {
  try {
    // @ts-expect-error — TS migration: fix in refactoring sprint
    const userId = req.user?.id || (req.user)?.claims?.sub;
    if (!userId) return res.status(401).json({ message: 'Unauthorized' });

    const workspaceId = (req as any).workspaceId || (req as any).session?.workspaceId;
    if (!workspaceId) return res.json([]);

    const progResult = await (db.$client as any).query(
      `SELECT e.id as employee_id, e.position, p.steps_completed, p.steps_remaining
       FROM employees e
       LEFT JOIN employee_onboarding_progress p ON p.employee_id = e.id AND p.workspace_id = $2
       WHERE e.user_id = $1 AND e.workspace_id = $2
       LIMIT 1`,
      [userId, workspaceId]
    );

    const row = progResult.rows?.[0];
    if (!row) return res.json([]);

    const completed = new Set<string>(row.steps_completed || []);
    const remaining: string[] = row.steps_remaining || [];
    const allKeys = [...new Set([...Array.from(completed), ...remaining])];

    const stepResult = await (db.$client as any).query(
      `SELECT step_key, title, document_type FROM employee_onboarding_steps ORDER BY step_number`
    );

    const result = (stepResult.rows || [])
      .filter((s: any) => allKeys.includes(s.step_key))
      .map((s: any) => ({
        id: s.step_key,
        displayName: s.title,
        category: s.document_type || 'compliance',
        required: true,
        status: completed.has(s.step_key) ? 'approved' : 'pending',
        uploadRoute: `/onboarding-forms?step=${s.step_key}`,
      }));

    res.json(result);
  } catch (error: unknown) {
    log.error('Error fetching required documents:', error);
    res.status(500).json({ message: 'Failed to fetch required documents' });
  }
});

// Get required documents list by position (before :employeeId route to avoid conflict)
employeeOnboardingRoutes.get('/requirements/:position', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { position } = req.params;
    const requirements = employeeDocumentOnboardingService.getRequiredDocuments(position as SecurityPosition);
    res.json(requirements);
  } catch (error: unknown) {
    log.error("Error fetching document requirements:", error);
    res.status(500).json({ message: "Failed to fetch requirements" });
  }
});

// Get specific employee's onboarding status (Manager view)
employeeOnboardingRoutes.get('/:employeeId', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const status = await employeeDocumentOnboardingService.getEmployeeOnboardingStatus(employeeId);
    
    if (!status) {
      return res.status(404).json({ message: "Employee not found" });
    }
    
    res.json(status);
  } catch (error: unknown) {
    log.error("Error fetching employee onboarding status:", error);
    res.status(500).json({ message: "Failed to fetch onboarding status" });
  }
});

// Check employee work eligibility (Used by scheduling)
employeeOnboardingRoutes.get('/:employeeId/work-eligibility', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    const eligibility = await employeeDocumentOnboardingService.checkWorkEligibility(employeeId);
    res.json(eligibility);
  } catch (error: unknown) {
    log.error("Error checking work eligibility:", error);
    res.status(500).json({ message: "Failed to check work eligibility" });
  }
});

// Get workspace-wide onboarding overview (Manager dashboard)
employeeOnboardingRoutes.get('/workspace/:workspaceId/overview', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { workspaceId } = req.params;
    const overview = await employeeDocumentOnboardingService.getWorkspaceOnboardingOverview(workspaceId);
    res.json(overview);
  } catch (error: unknown) {
    log.error("Error fetching workspace onboarding overview:", error);
    res.status(500).json({ message: "Failed to fetch onboarding overview" });
  }
});

// Trigger document requirement notifications for employee
employeeOnboardingRoutes.post('/:employeeId/notify', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    await employeeDocumentOnboardingService.notifyDocumentRequired(employeeId);
    res.json({ success: true, message: "Notification sent" });
  } catch (error: unknown) {
    log.error("Error sending document notification:", error);
    res.status(500).json({ message: "Failed to send notification" });
  }
});

// Create onboarding tasks for employee
employeeOnboardingRoutes.post('/:employeeId/create-tasks', async (req: AuthenticatedRequest, res: Response) => {
  try {
    const { employeeId } = req.params;
    await employeeDocumentOnboardingService.createOnboardingTasksForEmployee(employeeId);
    res.json({ success: true, message: "Onboarding tasks created" });
  } catch (error: unknown) {
    log.error("Error creating onboarding tasks:", error);
    res.status(500).json({ message: "Failed to create tasks" });
  }
});
