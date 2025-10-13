import { Request, Response, NextFunction } from 'express';
import { db } from './db';
import { employees } from '@shared/schema';
import { eq, and } from 'drizzle-orm';

export type WorkspaceRole = 'owner' | 'manager' | 'employee';

export interface AuthenticatedRequest extends Request {
  user?: {
    id: string;
    email?: string;
    firstName?: string;
    lastName?: string;
  };
  workspaceRole?: WorkspaceRole;
  employeeId?: string;
}

export async function getUserWorkspaceRole(
  userId: string,
  workspaceId: string
): Promise<{ role: WorkspaceRole | null; employeeId: string | null }> {
  const employee = await db.query.employees.findFirst({
    where: and(
      eq(employees.userId, userId),
      eq(employees.workspaceId, workspaceId)
    ),
  });

  if (!employee) {
    return { role: null, employeeId: null };
  }

  return {
    role: (employee.workspaceRole as WorkspaceRole) || 'employee',
    employeeId: employee.id,
  };
}

export function requireWorkspaceRole(allowedRoles: WorkspaceRole[]) {
  return async (req: AuthenticatedRequest, res: Response, next: NextFunction) => {
    const workspaceId = req.body.workspaceId || req.query.workspaceId || req.params.workspaceId;
    
    if (!workspaceId) {
      return res.status(400).json({ error: 'Workspace ID is required' });
    }

    if (!req.user?.id) {
      return res.status(401).json({ error: 'Authentication required' });
    }

    const { role, employeeId } = await getUserWorkspaceRole(req.user.id, workspaceId as string);

    if (!role) {
      return res.status(403).json({ error: 'You do not have access to this workspace' });
    }

    if (!allowedRoles.includes(role)) {
      return res.status(403).json({ 
        error: `This action requires one of the following roles: ${allowedRoles.join(', ')}`,
        currentRole: role
      });
    }

    req.workspaceRole = role;
    req.employeeId = employeeId || undefined;
    next();
  };
}

export const requireOwner = requireWorkspaceRole(['owner']);
export const requireManager = requireWorkspaceRole(['owner', 'manager']);
export const requireEmployee = requireWorkspaceRole(['owner', 'manager', 'employee']);

export async function validateManagerAssignment(
  managerId: string,
  employeeId: string,
  workspaceId: string
): Promise<{ valid: boolean; error?: string }> {
  const [manager, employee] = await Promise.all([
    db.query.employees.findFirst({
      where: eq(employees.id, managerId),
    }),
    db.query.employees.findFirst({
      where: eq(employees.id, employeeId),
    }),
  ]);

  if (!manager) {
    return { valid: false, error: 'Manager not found' };
  }

  if (!employee) {
    return { valid: false, error: 'Employee not found' };
  }

  if (manager.workspaceId !== workspaceId || employee.workspaceId !== workspaceId) {
    return { valid: false, error: 'Manager and employee must belong to the same workspace' };
  }

  if (manager.workspaceRole !== 'manager' && manager.workspaceRole !== 'owner') {
    return { valid: false, error: 'Manager must have manager or owner role' };
  }

  if (manager.id === employee.id) {
    return { valid: false, error: 'Cannot assign manager to themselves' };
  }

  return { valid: true };
}
