import type { User } from '@shared/schema/auth';
import type { WorkspaceRole, PlatformRole } from '@shared/lib/rbac/roleDefinitions';

declare global {
  namespace Express {
    interface Request {
      user?: User;
      workspaceId?: string;
      currentWorkspaceId?: string;
      activeWorkspaceId?: string;
      workspaceRole?: WorkspaceRole;
      platformRole?: PlatformRole;
      employeeId?: string;
      userEmail?: string;
      claims?: Record<string, unknown>;
      isTestMode?: boolean;
      assertOwnsResource?: (resourceWorkspaceId: string | null | undefined, resourceType?: string) => void;
      getWorkspaceId?: () => string;
    }
  }
}

export {};
