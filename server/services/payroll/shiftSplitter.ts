/**
 * Shift Splitter — splits a single [clockIn, clockOut] interval into
 * per-calendar-day and per-ISO-week segments.
 *
 * Why this exists:
 *   A 10:00 PM → 6:00 AM shift crosses midnight. For billing, payroll,
 *   daily-overtime-over-8h, and weekly-overtime-over-40h calculations, the
 *   minutes worked must be attributed to the day (and week) they actually
 *   occurred — not bucketed wholesale into the clock-in date.
 *
 * Contract:
 *   - Pure function. No DB, no clocks, no side effects.
 *   - Input dates are interpreted in the LOCAL TIMEZONE of the host process
 *     (matches how upstream code creates Date objects from timestamps stored
 *     in UTC). Callers that need timezone-aware splitting should pre-shift
 *     the inputs before calling.
 *   - Returns segments sorted ascending. Sum of segment minutes equals the
 *     total interval length (within rounding tolerance).
 */

export interface DaySegment {
  /** Local-date key in YYYY-MM-DD form. */
  dayKey: string;
  /** Whole minutes attributed to this day. */
  minutes: number;
  /** Inclusive lower bound of the segment (Date). */
  segmentStart: Date;
  /** Exclusive upper bound of the segment (Date). */
  segmentEnd: Date;
}

export interface WeekSegment {
  /** Local-date key (YYYY-MM-DD) for the Monday that starts the ISO week. */
  weekStartKey: string;
  /** Whole minutes attributed to this week. */
  minutes: number;
}

/** Format a Date as YYYY-MM-DD in local time. */
function localDayKey(d: Date): string {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

/** Local midnight at the start of the day after `d`. */
function nextLocalMidnight(d: Date): Date {
  const next = new Date(d);
  next.setHours(24, 0, 0, 0);
  return next;
}

/** ISO week start (Monday 00:00:00 local) for the given date. */
function isoWeekStart(d: Date): Date {
  const ws = new Date(d);
  const day = ws.getDay(); // Sun=0..Sat=6
  const diff = ws.getDate() - day + (day === 0 ? -6 : 1);
  ws.setDate(diff);
  ws.setHours(0, 0, 0, 0);
  return ws;
}

/**
 * Split [clockIn, clockOut] into one segment per calendar day.
 * Returns an empty array if the interval is non-positive.
 */
export function splitEntryAcrossDays(clockIn: Date, clockOut: Date): DaySegment[] {
  if (!(clockIn instanceof Date) || !(clockOut instanceof Date)) return [];
  if (clockOut.getTime() <= clockIn.getTime()) return [];

  const segments: DaySegment[] = [];
  let cursor = new Date(clockIn);
  while (cursor.getTime() < clockOut.getTime()) {
    const nextMidnight = nextLocalMidnight(cursor);
    const segEnd = nextMidnight.getTime() < clockOut.getTime() ? nextMidnight : clockOut;
    const minutes = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);
    if (minutes > 0) {
      segments.push({
        dayKey: localDayKey(cursor),
        minutes,
        segmentStart: new Date(cursor),
        segmentEnd: new Date(segEnd),
      });
    }
    cursor = segEnd;
  }
  return segments;
}

/**
 * Split [clockIn, clockOut] into one segment per ISO week (Mon-Sun).
 * Used for FLSA weekly-OT bucketing of shifts that straddle a week boundary
 * (e.g. a Sunday-night → Monday-morning shift).
 */
export function splitEntryAcrossWeeks(clockIn: Date, clockOut: Date): WeekSegment[] {
  if (!(clockIn instanceof Date) || !(clockOut instanceof Date)) return [];
  if (clockOut.getTime() <= clockIn.getTime()) return [];

  const segments: WeekSegment[] = [];
  let cursor = new Date(clockIn);
  while (cursor.getTime() < clockOut.getTime()) {
    const nextWeek = isoWeekStart(cursor);
    nextWeek.setDate(nextWeek.getDate() + 7); // Monday of the *following* week
    const segEnd = nextWeek.getTime() < clockOut.getTime() ? nextWeek : clockOut;
    const minutes = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);
    if (minutes > 0) {
      segments.push({
        weekStartKey: localDayKey(isoWeekStart(cursor)),
        minutes,
      });
    }
    cursor = segEnd;
  }
  return segments;
}

/**
 * Aggregate per-day minutes across a list of entries, splitting overnight
 * shifts so each calendar day receives only the minutes that fell on it.
 */
export function aggregateMinutesByDay(
  entries: Array<{ clockIn: Date; clockOut: Date | null }>,
): Record<string, number> {
  const byDay: Record<string, number> = {};
  for (const e of entries) {
    if (!e.clockOut) continue;
    for (const seg of splitEntryAcrossDays(e.clockIn, e.clockOut)) {
      byDay[seg.dayKey] = (byDay[seg.dayKey] || 0) + seg.minutes;
    }
  }
  return byDay;
}
