/**
 * Advanced Scheduling API Routes - Phase 2B
 * Recurring shifts, shift swapping, and schedule management
 */

import { Router, Request, Response } from 'express';
import { requireAuth } from '../auth';
import { requireWorkspaceRole, requireManager } from '../rbac';
import { emitGamificationEvent } from '../services/gamification/eventTracker';
import { isFeatureEnabled as isGamificationEnabled } from '@shared/platformConfig';
import { 
  generateRecurringShifts,
  createRecurringPattern,
  getRecurringPatterns,
  getRecurringPatternById,
  deleteRecurringPattern,
  updateRecurringPattern,
  requestShiftSwap,
  approveShiftSwap,
  rejectShiftSwap,
  cancelSwapRequest,
  getSwapRequests,
  getSwapRequestById,
  getAvailableEmployeesForSwap,
  getAISuggestedSwapEmployees,
  updateSwapRequestWithAISuggestions,
  duplicateShift,
  duplicateWeekSchedule,
  copyWeekSchedule,
  detectRecurringConflicts,
  RecurrencePattern,
  DayOfWeek
} from '../services/advancedSchedulingService';
import { isFeatureEnabled } from '@shared/platformConfig';
import '../types';
import { db } from '../db';
import { employees, shifts } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export const advancedSchedulingRouter = Router();

async function getEmployeeId(userId: string, workspaceId: string): Promise<string | null> {
  const employee = await db.query.employees.findFirst({
    where: and(
      eq(employees.userId, userId),
      eq(employees.workspaceId, workspaceId)
    ),
  });
  return employee?.id || null;
}

// ============================================================================
// RECURRING SHIFT PATTERNS
// ============================================================================

advancedSchedulingRouter.post('/recurring', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const {
      employeeId,
      clientId,
      title,
      description,
      category,
      startTimeOfDay,
      endTimeOfDay,
      daysOfWeek,
      recurrencePattern,
      startDate,
      endDate,
      skipDates,
      billableToClient,
      hourlyRateOverride,
      generateShifts,
    } = req.body;

    if (!title || !startTimeOfDay || !endTimeOfDay || !daysOfWeek || !startDate) {
      return res.status(400).json({ error: 'Missing required fields: title, startTimeOfDay, endTimeOfDay, daysOfWeek, startDate' });
    }

    const pattern = await createRecurringPattern({
      workspaceId,
      employeeId: employeeId || null,
      clientId: clientId || null,
      title,
      description: description || null,
      category: category || 'general',
      startTimeOfDay,
      endTimeOfDay,
      daysOfWeek: daysOfWeek as DayOfWeek[],
      recurrencePattern: (recurrencePattern as RecurrencePattern) || 'weekly',
      startDate: new Date(startDate),
      endDate: endDate ? new Date(endDate) : null,
      skipDates: skipDates ? skipDates.map((d: string) => new Date(d)) : null,
      billableToClient: billableToClient ?? true,
      hourlyRateOverride: hourlyRateOverride ? hourlyRateOverride.toString() : null,
      createdBy: user?.id,
      isActive: true,
    });

    let generatedShifts = null;
    if (generateShifts !== false) {
      const generateEndDate = endDate ? new Date(endDate) : new Date();
      if (!endDate) {
        generateEndDate.setMonth(generateEndDate.getMonth() + 1);
      }
      
      generatedShifts = await generateRecurringShifts({
        template: {
          workspaceId,
          employeeId,
          clientId,
          title,
          description,
          category,
          startTimeOfDay,
          endTimeOfDay,
          daysOfWeek: daysOfWeek as DayOfWeek[],
          recurrencePattern: (recurrencePattern as RecurrencePattern) || 'weekly',
          billableToClient,
          hourlyRateOverride: hourlyRateOverride ? Number(hourlyRateOverride) : undefined,
        },
        startDate: new Date(startDate),
        endDate: generateEndDate,
        skipDates: skipDates ? skipDates.map((d: string) => new Date(d)) : undefined,
        patternId: pattern.id,
      });
    }

    res.json({
      success: true,
      pattern,
      generatedShifts,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Create recurring pattern error:', error);
    res.status(500).json({ error: error.message || 'Failed to create recurring pattern' });
  }
});

advancedSchedulingRouter.get('/recurring', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const activeOnly = req.query.activeOnly !== 'false';
    const employeeId = req.query.employeeId as string | undefined;

    const patterns = await getRecurringPatterns(workspaceId, { activeOnly, employeeId });

    res.json({
      success: true,
      patterns,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get recurring patterns error:', error);
    res.status(500).json({ error: error.message || 'Failed to get patterns' });
  }
});

advancedSchedulingRouter.get('/recurring/:patternId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { patternId } = req.params;
    const pattern = await getRecurringPatternById(patternId, workspaceId);

    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    res.json({
      success: true,
      pattern,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get recurring pattern error:', error);
    res.status(500).json({ error: error.message || 'Failed to get pattern' });
  }
});

advancedSchedulingRouter.patch('/recurring/:patternId', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { patternId } = req.params;
    const updates = req.body;

    const pattern = await updateRecurringPattern(patternId, workspaceId, updates);

    res.json({
      success: true,
      pattern,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Update recurring pattern error:', error);
    res.status(500).json({ error: error.message || 'Failed to update pattern' });
  }
});

advancedSchedulingRouter.delete('/recurring/:patternId', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { patternId } = req.params;
    const deleteFutureShifts = req.query.deleteFutureShifts === 'true';

    const result = await deleteRecurringPattern(patternId, workspaceId, { deleteFutureShifts });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Delete recurring pattern error:', error);
    res.status(500).json({ error: error.message || 'Failed to delete pattern' });
  }
});

advancedSchedulingRouter.post('/recurring/:patternId/generate', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { patternId } = req.params;
    const { startDate, endDate, skipDates } = req.body;

    const pattern = await getRecurringPatternById(patternId, workspaceId);
    if (!pattern) {
      return res.status(404).json({ error: 'Pattern not found' });
    }

    const result = await generateRecurringShifts({
      template: {
        workspaceId,
        employeeId: pattern.employeeId || undefined,
        clientId: pattern.clientId || undefined,
        title: pattern.title,
        description: pattern.description || undefined,
        category: pattern.category || 'general',
        startTimeOfDay: pattern.startTimeOfDay,
        endTimeOfDay: pattern.endTimeOfDay,
        daysOfWeek: pattern.daysOfWeek as DayOfWeek[],
        recurrencePattern: pattern.recurrencePattern as RecurrencePattern,
        billableToClient: pattern.billableToClient ?? true,
        hourlyRateOverride: pattern.hourlyRateOverride ? Number(pattern.hourlyRateOverride) : undefined,
      },
      startDate: new Date(startDate || pattern.startDate),
      endDate: new Date(endDate || pattern.endDate || new Date(Date.now() + 30 * 24 * 60 * 60 * 1000)),
      skipDates: skipDates ? skipDates.map((d: string) => new Date(d)) : undefined,
      patternId,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Generate shifts from pattern error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate shifts' });
  }
});

advancedSchedulingRouter.get('/recurring/:patternId/conflicts', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { patternId } = req.params;
    const startDate = req.query.startDate ? new Date(req.query.startDate as string) : undefined;
    const endDate = req.query.endDate ? new Date(req.query.endDate as string) : undefined;

    const conflicts = await detectRecurringConflicts(
      workspaceId,
      patternId,
      startDate && endDate ? { start: startDate, end: endDate } : undefined
    );

    res.json({
      success: true,
      conflicts,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Detect conflicts error:', error);
    res.status(500).json({ error: error.message || 'Failed to detect conflicts' });
  }
});

// Legacy route for backwards compatibility
advancedSchedulingRouter.post('/recurring/generate', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const {
      employeeId,
      clientId,
      title,
      description,
      category,
      startTimeOfDay,
      endTimeOfDay,
      daysOfWeek,
      recurrencePattern,
      startDate,
      endDate,
      skipDates,
      billableToClient,
      hourlyRateOverride,
    } = req.body;

    if (!title || !startTimeOfDay || !endTimeOfDay || !daysOfWeek || !startDate || !endDate) {
      return res.status(400).json({ error: 'Missing required fields' });
    }

    const result = await generateRecurringShifts({
      template: {
        workspaceId,
        employeeId,
        clientId,
        title,
        description,
        category,
        startTimeOfDay,
        endTimeOfDay,
        daysOfWeek: daysOfWeek as DayOfWeek[],
        recurrencePattern: recurrencePattern as RecurrencePattern || 'weekly',
        billableToClient,
        hourlyRateOverride: hourlyRateOverride ? Number(hourlyRateOverride) : undefined,
      },
      startDate: new Date(startDate),
      endDate: new Date(endDate),
      skipDates: skipDates ? skipDates.map((d: string) => new Date(d)) : undefined,
    });

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Generate recurring error:', error);
    res.status(500).json({ error: error.message || 'Failed to generate shifts' });
  }
});

// ============================================================================
// SHIFT SWAP REQUESTS
// ============================================================================

advancedSchedulingRouter.post('/shifts/:shiftId/swap-request', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const employeeId = await getEmployeeId(userId, workspaceId);
    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile linked' });
    }

    const { shiftId } = req.params;
    const { targetEmployeeId, reason } = req.body;

    const swapRequest = await requestShiftSwap(
      workspaceId,
      shiftId,
      employeeId,
      targetEmployeeId,
      reason
    );

    const suggestionsUpdated = await updateSwapRequestWithAISuggestions(swapRequest.id, workspaceId);

    res.json({
      success: true,
      swapRequest: suggestionsUpdated,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Request swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/swap-requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | undefined;
    const employeeIdFilter = req.query.employeeId as string | undefined;
    
    const employeeId = await getEmployeeId(userId, workspaceId);

    const requests = await getSwapRequests(workspaceId, {
      employeeId: employeeIdFilter || undefined,
      status,
    });

    res.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get swap requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/swap-requests/:swapId', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { swapId } = req.params;
    const swapRequest = await getSwapRequestById(swapId, workspaceId);

    if (!swapRequest) {
      return res.status(404).json({ error: 'Swap request not found' });
    }

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get swap request error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/swap-requests/:swapId/approve', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { swapId } = req.params;
    const { targetEmployeeId, responseMessage } = req.body;

    const swapRequest = await approveShiftSwap(
      workspaceId,
      swapId,
      userId,
      targetEmployeeId,
      responseMessage
    );

    // Gamification: Award points for shift swap participation
    if (isGamificationEnabled('enableGamification') && swapRequest) {
      try {
        // Award points to both employees involved in the swap
        const requesterId = swapRequest.requestingEmployeeId;
        const accepterId = swapRequest.targetEmployeeId;
        
        if (requesterId) {
          emitGamificationEvent('shift_swapped', {
            workspaceId,
            employeeId: requesterId,
            swapId,
            swappedWith: accepterId || undefined,
          });
        }
      } catch (gamError) {
        console.error('[AdvancedScheduling] Gamification shift_swapped failed (non-blocking):', gamError);
      }
    }

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Approve swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/swap-requests/:swapId/reject', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { swapId } = req.params;
    const { responseMessage } = req.body;

    const swapRequest = await rejectShiftSwap(
      workspaceId,
      swapId,
      userId,
      responseMessage
    );

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Reject swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/swap-requests/:swapId/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const employeeId = await getEmployeeId(userId, workspaceId);
    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile linked' });
    }

    const { swapId } = req.params;

    const swapRequest = await cancelSwapRequest(workspaceId, swapId, employeeId);

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Cancel swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/shifts/:shiftId/available-employees', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { shiftId } = req.params;

    const availableEmployees = await getAvailableEmployeesForSwap(workspaceId, shiftId);

    res.json({
      success: true,
      employees: availableEmployees,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get available employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/shifts/:shiftId/ai-suggestions', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { shiftId } = req.params;

    const suggestions = await getAISuggestedSwapEmployees(workspaceId, shiftId);

    res.json({
      success: true,
      suggestions,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get AI suggestions error:', error);
    res.status(500).json({ error: error.message });
  }
});

// Legacy swap routes for backwards compatibility
advancedSchedulingRouter.post('/swap/request', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const employeeId = await getEmployeeId(userId, workspaceId);
    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile linked' });
    }

    const { shiftId, targetEmployeeId, reason } = req.body;

    if (!shiftId) {
      return res.status(400).json({ error: 'Shift ID is required' });
    }

    const swapRequest = await requestShiftSwap(
      workspaceId,
      shiftId,
      employeeId,
      targetEmployeeId,
      reason
    );

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Request swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/swap/:swapId/respond', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { swapId } = req.params;
    const { approved, responseMessage, targetEmployeeId } = req.body;

    if (typeof approved !== 'boolean') {
      return res.status(400).json({ error: 'Approved status is required' });
    }

    let swapRequest;
    if (approved) {
      swapRequest = await approveShiftSwap(workspaceId, swapId, userId, targetEmployeeId, responseMessage);
    } else {
      swapRequest = await rejectShiftSwap(workspaceId, swapId, userId, responseMessage);
    }

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Respond swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/swap/requests', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const employeeId = await getEmployeeId(userId, workspaceId);
    const status = req.query.status as 'pending' | 'approved' | 'rejected' | 'cancelled' | 'expired' | undefined;

    const requests = await getSwapRequests(workspaceId, {
      employeeId: employeeId || undefined,
      status,
    });

    res.json({
      success: true,
      requests,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get swap requests error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/swap/:swapId/cancel', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    const userId = user?.id;
    
    if (!workspaceId || !userId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const employeeId = await getEmployeeId(userId, workspaceId);
    if (!employeeId) {
      return res.status(400).json({ error: 'No employee profile linked' });
    }

    const { swapId } = req.params;

    const swapRequest = await cancelSwapRequest(workspaceId, swapId, employeeId);

    res.json({
      success: true,
      swapRequest,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Cancel swap error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.get('/swap/:shiftId/available-employees', requireAuth, async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { shiftId } = req.params;

    const availableEmployees = await getAvailableEmployeesForSwap(workspaceId, shiftId);

    res.json({
      success: true,
      employees: availableEmployees,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Get available employees error:', error);
    res.status(500).json({ error: error.message });
  }
});

// ============================================================================
// SHIFT DUPLICATION
// ============================================================================

advancedSchedulingRouter.post('/shifts/:shiftId/duplicate', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { shiftId } = req.params;
    const { targetDate, targetEmployeeId, copyNotes } = req.body;

    if (!targetDate) {
      return res.status(400).json({ error: 'Target date is required' });
    }

    const newShift = await duplicateShift(workspaceId, shiftId, {
      targetDate: new Date(targetDate),
      targetEmployeeId,
      copyNotes: copyNotes !== false,
    });

    res.json({
      success: true,
      shift: newShift,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Duplicate shift error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/duplicate-week', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin', 'manager']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { sourceWeekStart, targetWeekStart, employeeId, skipExisting } = req.body;

    if (!sourceWeekStart || !targetWeekStart) {
      return res.status(400).json({ error: 'Source and target week dates are required' });
    }

    const result = await duplicateWeekSchedule(
      workspaceId,
      new Date(sourceWeekStart),
      new Date(targetWeekStart),
      { employeeId, skipExisting: skipExisting !== false }
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Duplicate week error:', error);
    res.status(500).json({ error: error.message });
  }
});

advancedSchedulingRouter.post('/copy-week', requireAuth, requireWorkspaceRole(['org_owner', 'org_admin']), async (req: Request, res: Response) => {
  try {
    const user = req.user;
    const workspaceId = user?.currentWorkspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'No workspace selected' });
    }

    const { sourceWeekStart, targetWeekStart, employeeId } = req.body;

    if (!sourceWeekStart || !targetWeekStart) {
      return res.status(400).json({ error: 'Source and target week dates are required' });
    }

    const result = await copyWeekSchedule(
      workspaceId,
      new Date(sourceWeekStart),
      new Date(targetWeekStart),
      employeeId
    );

    res.json({
      success: true,
      ...result,
    });
  } catch (error: any) {
    console.error('[AdvancedScheduling] Copy week error:', error);
    res.status(500).json({ error: error.message });
  }
});
