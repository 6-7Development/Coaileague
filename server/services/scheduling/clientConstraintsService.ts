import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../db';
import { clients, shifts } from '@shared/schema';
import type { ClientWithExtras } from '@shared/types/domainExtensions';

export async function getClientConstraints(params: {
  workspaceId: string;
  clientId: string;
  shiftStart?: Date;
  shiftEnd?: Date;
}) {
  const [client] = await db
    .select()
    .from(clients)
    .where(and(
      eq(clients.workspaceId, params.workspaceId),
      eq(clients.id, params.clientId),
      isNull(clients.deletedAt),
    ))
    .limit(1);

  if (!client) return null;

  let currentlyScheduledGuards = 0;
  if (params.shiftStart && params.shiftEnd) {
    const overlappingShifts = await db
      .select({ id: shifts.id })
      .from(shifts)
      .where(and(
        eq(shifts.workspaceId, params.workspaceId),
        eq(shifts.clientId, params.clientId),
        lte(shifts.startTime, params.shiftEnd),
        gte(shifts.endTime, params.shiftStart),
        sql`${shifts.status} NOT IN ('cancelled')`,
      ));

    currentlyScheduledGuards = overlappingShifts.length;
  }

  return {
    numberOfGuards: (client as ClientWithExtras).numberOfGuards ?? null,
    armedGuards: (client as ClientWithExtras).armedGuards ?? null,
    unarmedGuards: (client as ClientWithExtras).unarmedGuards ?? null,
    daysOfService: (client as ClientWithExtras).daysOfService ?? null,
    hoursPerDay: (client as ClientWithExtras).hoursPerDay ?? null,
    minimumHours: (client as ClientWithExtras).minimumHoursPerDay ?? null,
    currentlyScheduledGuards,
  };
}
