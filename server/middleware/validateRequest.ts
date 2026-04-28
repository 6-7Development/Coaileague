/**
 * validateRequest — Centralized Zod validation middleware
 * 
 * Usage:
 *   router.post('/endpoint', requireAuth, validateBody(mySchema), handler)
 *   router.get('/endpoint', validateQuery(querySchema), handler)
 *   router.get('/endpoint/:id', validateParams(paramsSchema), handler)
 * 
 * On validation failure: returns 400 with fromZodError() human-readable message.
 * On success: populates req.validatedBody / req.validatedQuery / req.validatedParams
 */
import { Request, Response, NextFunction } from 'express';
import { ZodSchema } from 'zod';
import { fromZodError } from 'zod-validation-error';

declare global {
  namespace Express {
    interface Request {
      validatedBody?: unknown;
      validatedQuery?: unknown;
      validatedParams?: unknown;
    }
  }
}

export function validateBody<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      const message = fromZodError(result.error).toString();
      return res.status(400).json({ error: 'Validation failed', message });
    }
    req.validatedBody = result.data;
    next();
  };
}

export function validateQuery<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      const message = fromZodError(result.error).toString();
      return res.status(400).json({ error: 'Invalid query parameters', message });
    }
    req.validatedQuery = result.data;
    next();
  };
}

export function validateParams<T>(schema: ZodSchema<T>) {
  return (req: Request, res: Response, next: NextFunction) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      const message = fromZodError(result.error).toString();
      return res.status(400).json({ error: 'Invalid path parameters', message });
    }
    req.validatedParams = result.data;
    next();
  };
}
