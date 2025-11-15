// Reusable pagination validation schemas
// Pattern: Base schema extended with module-specific filters

import { z } from 'zod';

// ============================================================================
// BASE PAGINATION SCHEMA
// ============================================================================

export const paginationParamsSchema = z.object({
  page: z.coerce.number().int().positive().default(1),
  limit: z.coerce.number().int().min(10).max(100).default(50),
  order: z.enum(['asc', 'desc']).default('desc'),
});

// ============================================================================
// CLIENT PAGINATION SCHEMA
// ============================================================================

export const clientsSortSchema = z.enum([
  'createdAt',
  'firstName',
  'lastName',
  'companyName',
]);

export const clientsQuerySchema = paginationParamsSchema.extend({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  sort: clientsSortSchema.default('createdAt'),
});

export type ClientsQueryParams = z.infer<typeof clientsQuerySchema>;

// ============================================================================
// EMPLOYEE PAGINATION SCHEMA (for future use)
// ============================================================================

export const employeesSortSchema = z.enum([
  'createdAt',
  'firstName',
  'lastName',
  'role',
  'hireDate',
]);

export const employeesQuerySchema = paginationParamsSchema.extend({
  search: z.string().optional(),
  status: z.enum(['active', 'inactive', 'all']).default('all'),
  role: z.string().optional(),
  sort: employeesSortSchema.default('createdAt'),
});

export type EmployeesQueryParams = z.infer<typeof employeesQuerySchema>;

// ============================================================================
// INVOICE PAGINATION SCHEMA (for future use)
// ============================================================================

export const invoicesSortSchema = z.enum([
  'createdAt',
  'invoiceNumber',
  'totalAmount',
  'dueDate',
  'status',
]);

export const invoicesQuerySchema = paginationParamsSchema.extend({
  search: z.string().optional(),
  status: z.enum(['draft', 'sent', 'paid', 'overdue', 'all']).default('all'),
  clientId: z.string().optional(),
  sort: invoicesSortSchema.default('createdAt'),
});

export type InvoicesQueryParams = z.infer<typeof invoicesQuerySchema>;
