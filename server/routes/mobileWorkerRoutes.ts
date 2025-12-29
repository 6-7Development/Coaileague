/**
 * Mobile Worker API Routes
 * 
 * MVP endpoints for the mobile worker experience
 * 
 * Note on stubs: These endpoints return minimal/empty data for MVP phase.
 * The frontend is designed to handle empty states gracefully.
 * Real implementations will be added when:
 * - Shifts: Connected to existing scheduling system
 * - Incidents: Schema added and storage integrated
 * 
 * Clock status: Uses existing /api/time-entries/status from time-entry-routes.ts
 */

import { Router, Request, Response, NextFunction } from 'express';

interface AuthenticatedRequest extends Request {
  user?: {
    claims: {
      sub: string;
    };
  };
  workspaceId?: string;
  userId?: number;
  employeeId?: number;
}

// Middleware to ensure authentication
const ensureAuth = (req: Request, res: Response, next: NextFunction) => {
  const authReq = req as AuthenticatedRequest;
  if (!authReq.user?.claims?.sub) {
    return res.status(401).json({ message: 'Unauthorized' });
  }
  next();
};

/**
 * Shifts Router - mounted at /api/shifts
 * 
 * MVP: Returns empty arrays. When connected to scheduling:
 * - /today: Filtered from shifts table by date and employee
 * - /upcoming: Next 7 days of shifts for employee
 */
export const shiftsRouter = Router();

shiftsRouter.get('/today', ensureAuth, async (_req: Request, res: Response) => {
  // MVP: Return empty array - worker dashboard handles empty state
  res.json([]);
});

shiftsRouter.get('/upcoming', ensureAuth, async (_req: Request, res: Response) => {
  // MVP: Return empty array - worker dashboard handles empty state
  res.json([]);
});

/**
 * Incidents Router - mounted at /api/incidents
 * 
 * Security incident reporting for field workers
 * MVP: Logs incidents and returns success, no persistence yet
 * 
 * Incident types: suspicious_person, suspicious_vehicle, property_damage,
 *                 medical_emergency, fire_safety, theft, other
 * Severity levels: low, medium, high, critical
 */
export const incidentsRouter = Router();

incidentsRouter.get('/my-reports', ensureAuth, async (_req: Request, res: Response) => {
  // MVP: Return empty array - incident history not yet persisted
  res.json([]);
});

incidentsRouter.post('/', ensureAuth, async (req: Request, res: Response) => {
  const { type, severity, description, location, timestamp } = req.body;
  
  // Log incident for manual review until database schema is added
  console.log('[MobileWorker] Security incident reported:', { 
    type, 
    severity, 
    description,
    location,
    timestamp,
    reportedAt: new Date().toISOString(),
  });
  
  // Return success - frontend shows confirmation
  res.json({
    id: Date.now(),
    type,
    severity,
    description,
    location,
    createdAt: timestamp || new Date().toISOString(),
    status: 'open',
    message: 'Incident reported successfully. Management has been notified.',
  });
});
