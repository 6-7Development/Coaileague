/**
 * Centralized request validation middleware
 * ==========================================
 * Provides type-safe Express middleware for validating req.body, req.query, and req.params
 * using Zod schemas. Errors are returned in the standard platform 400 format.
 *
 * Usage:
 *   import { validateBody, validateQuery, validateParams } from '../middleware/validateRequest';
 *
 *   router.post('/route', requireAuth, validateBody(mySchema), async (req, res) => {
 *     const data = req.validatedBody; // fully typed
 *   });
 */

import type { RequestHandler } from 'express';
import type { ZodSchema, ZodError } from 'zod';

declare global {
  namespace Express {
    interface Request {
      /** Validated + parsed request body (set by validateBody middleware) */
      validatedBody?: unknown;
      /** Validated + parsed query params (set by validateQuery middleware) */
      validatedQuery?: unknown;
      /** Validated + parsed route params (set by validateParams middleware) */
      validatedParams?: unknown;
    }
  }
}

/**
 * Format ZodError issues into a client-safe array of { field, message } objects.
 * Does NOT expose internal Zod internals or stack traces.
 * Exported for use in route handlers that call safeParse() directly.
 */
export function formatZodIssues(err: ZodError): Array<{ field: string; message: string }> {
  return err.issues.map((issue) => ({
    field: issue.path.join('.') || '(root)',
    message: issue.message,
  }));
}

/**
 * Middleware that validates req.body against the given Zod schema.
 * On success: sets req.validatedBody to the parsed data and calls next().
 * On failure: returns 400 with { error, details } — does NOT call next().
 */
export function validateBody<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.body);
    if (!result.success) {
      return res.status(400).json({
        error: 'Validation failed',
        details: formatZodIssues(result.error),
      });
    }
    req.validatedBody = result.data;
    next();
  };
}

/**
 * Middleware that validates req.query against the given Zod schema.
 * On success: sets req.validatedQuery to the parsed data and calls next().
 * On failure: returns 400 with { error, details }.
 */
export function validateQuery<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.query);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid query parameters',
        details: formatZodIssues(result.error),
      });
    }
    req.validatedQuery = result.data;
    next();
  };
}

/**
 * Middleware that validates req.params against the given Zod schema.
 * On success: sets req.validatedParams to the parsed data and calls next().
 * On failure: returns 400 with { error, details }.
 */
export function validateParams<T>(schema: ZodSchema<T>): RequestHandler {
  return (req, res, next) => {
    const result = schema.safeParse(req.params);
    if (!result.success) {
      return res.status(400).json({
        error: 'Invalid path parameters',
        details: formatZodIssues(result.error),
      });
    }
    req.validatedParams = result.data;
    next();
  };
}
