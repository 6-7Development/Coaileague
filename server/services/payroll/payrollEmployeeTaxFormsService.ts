import { and, desc, eq } from 'drizzle-orm';
import { db } from 'server/db';
import { employees, employeeTaxForms } from '@shared/schema';

export interface EmployeeTaxFormSummary {
  id: string;
  formType: string;
  taxYear: number;
  wages: string | null;
  federalTaxWithheld: string | null;
  generatedAt: Date | null;
  isActive: boolean | null;
}

export interface EmployeeTaxFormsResult {
  employeeId: string;
  employeeName: string;
  forms: EmployeeTaxFormSummary[];
}

export interface EmployeeTaxFormAccessResult {
  employeeId: string;
  employeeName: string;
  form: EmployeeTaxFormSummary;
}

async function resolveEmployeeForUser(userId: string, workspaceId: string) {
  if (!userId) throw Object.assign(new Error('userId is required'), { status: 401 });
  if (!workspaceId) throw Object.assign(new Error('workspaceId is required'), { status: 400 });

  const [employee] = await db.select({
    id: employees.id,
    firstName: employees.firstName,
    lastName: employees.lastName,
  })
    .from(employees)
    .where(and(
      eq(employees.workspaceId, workspaceId),
      eq(employees.userId, userId),
    ))
    .limit(1);

  if (!employee) {
    throw Object.assign(new Error('Employee profile not found for current user'), { status: 404 });
  }

  return {
    id: employee.id,
    name: `${employee.firstName || ''} ${employee.lastName || ''}`.trim() || employee.id,
  };
}

function mapTaxForm(row: typeof employeeTaxForms.$inferSelect): EmployeeTaxFormSummary {
  return {
    id: row.id,
    formType: row.formType,
    taxYear: row.taxYear,
    wages: row.wages ?? null,
    federalTaxWithheld: row.federalTaxWithheld ?? null,
    generatedAt: row.generatedAt ?? null,
    isActive: row.isActive ?? null,
  };
}

/**
 * List active tax forms visible to the signed-in employee.
 *
 * This is intentionally read-only and ownership-scoped. It does not generate or
 * mutate tax forms; generation remains owned by TaxFormGeneratorService.
 */
export async function getMyEmployeeTaxForms(params: {
  userId: string;
  workspaceId: string;
}): Promise<EmployeeTaxFormsResult> {
  const employee = await resolveEmployeeForUser(params.userId, params.workspaceId);

  const forms = await db.select()
    .from(employeeTaxForms)
    .where(and(
      eq(employeeTaxForms.workspaceId, params.workspaceId),
      eq(employeeTaxForms.employeeId, employee.id),
      eq(employeeTaxForms.isActive, true),
    ))
    .orderBy(desc(employeeTaxForms.taxYear), desc(employeeTaxForms.generatedAt));

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    forms: forms.map(mapTaxForm),
  };
}

/**
 * Resolve a single active tax form with employee ownership guard.
 *
 * Route/download handlers can use this before streaming/regenerating a PDF so
 * tax documents cannot be fetched across employees or workspaces.
 */
export async function getMyEmployeeTaxForm(params: {
  userId: string;
  workspaceId: string;
  formId: string;
}): Promise<EmployeeTaxFormAccessResult> {
  if (!params.formId) throw Object.assign(new Error('formId is required'), { status: 400 });

  const employee = await resolveEmployeeForUser(params.userId, params.workspaceId);

  const [form] = await db.select()
    .from(employeeTaxForms)
    .where(and(
      eq(employeeTaxForms.id, params.formId),
      eq(employeeTaxForms.workspaceId, params.workspaceId),
      eq(employeeTaxForms.employeeId, employee.id),
      eq(employeeTaxForms.isActive, true),
    ))
    .limit(1);

  if (!form) {
    throw Object.assign(new Error('Tax form not found'), { status: 404 });
  }

  return {
    employeeId: employee.id,
    employeeName: employee.name,
    form: mapTaxForm(form),
  };
}
