import type { User } from '@shared/schema/auth';
import type { WorkspaceRole, PlatformRole } from '@shared/lib/rbac/roleDefinitions';
import type { AuditContext } from '../middleware/audit';

/**
 * CANONICAL Express Request augmentation — server/types/express.d.ts
 *
 * This is the single source of truth for all req.* fields added by middleware.
 * server/types.ts is for express-session augmentation ONLY.
 *
 * Codex fix: Stopped duplicated Request augmentation drift across multiple files.
 */
interface AuthMiddlewareUserExtensions {
  userId?: string | null;
  workspaceId?: string | null;
  currentWorkspaceId?: string | null;
  activeWorkspaceId?: string | null;
  workspaceRole?: WorkspaceRole | string | null;
  platformRole?: PlatformRole | string | null;
  role?: string | null;
  employeeId?: string | null;
  claims?: Record<string, unknown> & {
    sub?: string;
    email?: string;
    first_name?: string;
    last_name?: string;
  };
  auditorWorkspaceId?: string | null;
  auditorAccountId?: string | null;
  preferredLanguage?: string | null;
  username?: string | null;
  fullName?: string | null;
  name?: string | null;
  isPlatformAdmin?: boolean;
}

declare global {
  namespace Express {
    interface Request {
      // Auth & user
      user?: User & AuthMiddlewareUserExtensions;

      // Request identity
      requestId: string;
      auditContext?: AuditContext;

      // Workspace context
      workspaceId?: string;
      currentWorkspaceId?: string;
      activeWorkspaceId?: string;

      // Roles
      workspaceRole?: WorkspaceRole | string;
      platformRole?: PlatformRole | string;

      // Employee / claims
      employeeId?: string;
      userEmail?: string;
      claims?: Record<string, unknown>;

      // Feature flags / mode
      isTestMode?: boolean;
      isTrinityBot?: boolean;

      // Support / auditor portal
      supportExecutorId?: string;
      supportActorId?: string;
      supportSessionId?: string;
      auditorId?: string;
      auditorWorkspaceId?: string;

      // Billing / subscription
      subscriptionTier?: string;

      // Lifecycle guards
      terminatedEmployeeId?: string;
      documentAccessExpiresAt?: Date;

      // Voice session
      _voiceSessionLang?: string;

      // Raw body (webhook signature verification)
      rawBody?: Buffer;

      // Helper methods (legacy compat)
      assertOwnsResource?: (resourceWorkspaceId: string | null | undefined, resourceType?: string) => void;
      getWorkspaceId?: () => string;
    }
  }
}

export type { AuthMiddlewareUserExtensions };
