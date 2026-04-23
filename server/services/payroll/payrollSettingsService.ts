import { eq } from 'drizzle-orm';
import { db } from '../../db';
import { payrollSettings } from '@shared/schema';
import { createLogger } from '../../lib/logger';

const log = createLogger('PayrollSettingsService');

const settingsCache = new Map<string, { value: any; expiresAt: number }>();
const CACHE_TTL_MS = 60_000;

const IMMUTABLE_KEYS = new Set(['id', 'workspaceId', 'createdAt']);

function setCache(workspaceId: string, value: any) {
  settingsCache.set(workspaceId, { value, expiresAt: Date.now() + CACHE_TTL_MS });
}

function getCache(workspaceId: string) {
  const cached = settingsCache.get(workspaceId);
  if (!cached) return null;
  if (cached.expiresAt < Date.now()) {
    settingsCache.delete(workspaceId);
    return null;
  }
  return cached.value;
}

export async function getPayrollSettings(workspaceId: string) {
  const cached = getCache(workspaceId);
  if (cached) return cached;

  const [settings] = await db.select().from(payrollSettings).where(eq(payrollSettings.workspaceId, workspaceId)).limit(1);
  if (settings) setCache(workspaceId, settings);
  return settings ?? null;
}

export async function setPayrollSettings(workspaceId: string, patch: Record<string, unknown>, actorId?: string | null) {
  if (!workspaceId) throw new Error('workspaceId is required');

  for (const key of Object.keys(patch)) {
    if (IMMUTABLE_KEYS.has(key)) {
      throw new Error(`${key} is immutable and cannot be changed`);
    }
  }

  if ((patch.payrollFrequency !== undefined && patch.payrollFrequency === null) ||
      (patch.payrollCycle !== undefined && patch.payrollCycle === null)) {
    throw new Error('payrollFrequency/payrollCycle cannot be null');
  }

  return db.transaction(async (tx) => {
    const [existing] = await tx.select().from(payrollSettings).where(eq(payrollSettings.workspaceId, workspaceId)).limit(1);

    const payload = {
      workspaceId,
      payrollFrequency: String(patch.payrollFrequency ?? patch.payrollCycle ?? existing?.payrollFrequency ?? 'biweekly'),
      payrollDayOfWeek: patch.payrollDayOfWeek !== undefined ? Number(patch.payrollDayOfWeek) : existing?.payrollDayOfWeek,
      payrollDayOfMonth: patch.payrollDayOfMonth !== undefined ? Number(patch.payrollDayOfMonth) : existing?.payrollDayOfMonth,
      payrollSecondDayOfMonth: patch.payrollSecondDayOfMonth !== undefined ? Number(patch.payrollSecondDayOfMonth) : existing?.payrollSecondDayOfMonth,
      payrollCutoffDays: patch.payrollCutoffDays !== undefined ? Number(patch.payrollCutoffDays) : existing?.payrollCutoffDays,
      payrollFirstPeriodStart: patch.payrollFirstPeriodStart !== undefined ? patch.payrollFirstPeriodStart as any : existing?.payrollFirstPeriodStart,
      payrollFirstPeriodEnd: patch.payrollFirstPeriodEnd !== undefined ? patch.payrollFirstPeriodEnd as any : existing?.payrollFirstPeriodEnd,
      updatedAt: new Date(),
    };

    let persisted;
    if (existing) {
      [persisted] = await tx.update(payrollSettings).set(payload).where(eq(payrollSettings.id, existing.id)).returning();
    } else {
      [persisted] = await tx.insert(payrollSettings).values(payload as any).returning();
    }

    setCache(workspaceId, persisted);

    try {
      const { universalAudit, AUDIT_ACTIONS } = await import('../universalAuditService');
      await universalAudit.log({
        workspaceId,
        actorId: actorId ?? null,
        actorType: actorId ? 'user' : 'system',
        action: AUDIT_ACTIONS.SETTINGS_UPDATED,
        entityType: 'payroll_settings',
        entityId: persisted.id,
        changeType: existing ? 'update' : 'create',
        changes: existing ? {
          payrollFrequency: { old: existing.payrollFrequency, new: persisted.payrollFrequency },
          payrollDayOfWeek: { old: existing.payrollDayOfWeek, new: persisted.payrollDayOfWeek },
          payrollDayOfMonth: { old: existing.payrollDayOfMonth, new: persisted.payrollDayOfMonth },
        } : null,
      });
    } catch (error) {
      log.warn('[PayrollSettingsService] Audit logging failed (non-blocking):', error);
    }

    return persisted;
  });
}

export async function ensurePayrollSettingsExist(workspaceId: string) {
  const existing = await getPayrollSettings(workspaceId);
  if (existing) return existing;
  return setPayrollSettings(workspaceId, { payrollFrequency: 'biweekly' });
}
