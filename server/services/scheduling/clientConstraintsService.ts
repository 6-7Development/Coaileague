import { and, eq, gte, isNull, lte, sql } from 'drizzle-orm';
import { db } from '../../db';
import { clients, shifts } from '@shared/schema';

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
    numberOfGuards: (client as any).numberOfGuards ?? null,
    armedGuards: (client as any).armedGuards ?? null,
    unarmedGuards: (client as any).unarmedGuards ?? null,
    daysOfService: (client as any).daysOfService ?? null,
    hoursPerDay: (client as any).hoursPerDay ?? null,
    minimumHours: (client as any).minimumHoursPerDay ?? null,
    currentlyScheduledGuards,
  };
}
