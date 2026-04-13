/**
 * Trinity Token Tracking Middleware — Phase 16A
 * ===============================================
 * Attaches a unique trinityOperationId to every incoming request so that
 * callers can pass it to trinityTokenMeteringService.trackTokenUsage()
 * without generating a UUID themselves.
 */

import { Request, Response, NextFunction } from 'express';
import { randomUUID } from 'crypto';

export function trinityTokenTracking(req: Request, _res: Response, next: NextFunction): void {
  req.trinityOperationId = randomUUID();
  next();
}

declare global {
  namespace Express {
    interface Request {
      trinityOperationId?: string;
    }
  }
}
