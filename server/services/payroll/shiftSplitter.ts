/**
 * Shift Splitter — splits a single [clockIn, clockOut] interval into
 * per-calendar-day and per-ISO-week segments, in a specified IANA timezone.
 *
 * Why this exists:
 *   A 10:00 PM → 6:00 AM shift crosses midnight. For billing, payroll,
 *   daily-overtime-over-8h, and weekly-overtime-over-40h calculations, the
 *   minutes worked must be attributed to the day (and week) they actually
 *   occurred — not bucketed wholesale into the clock-in date.
 *
 *   Day boundaries are computed in the WORKSPACE TIMEZONE, not the host
 *   process timezone. A workspace in PST whose server runs in UTC must split
 *   at PST midnight (08:00 UTC), not UTC midnight (16:00 PST).
 *
 * Contract:
 *   - Pure function. No DB, no clocks, no side effects.
 *   - The `timeZone` parameter is an IANA zone (e.g. "America/Los_Angeles").
 *     If omitted, falls back to UTC for deterministic behaviour. Callers
 *     MUST pass workspace.timezone for correct day boundaries.
 *   - Returns segments sorted ascending. Sum of segment minutes equals the
 *     total interval length (within rounding tolerance).
 */

export interface DaySegment {
  /** Local-date key in YYYY-MM-DD form, in the requested timezone. */
  dayKey: string;
  /** YYYY-MM-DD key of the Monday that starts the ISO week the segment belongs to. */
  weekStartKey: string;
  /** Whole minutes attributed to this day. */
  minutes: number;
  /** Inclusive lower bound of the segment (Date / wall-clock instant). */
  segmentStart: Date;
  /** Exclusive upper bound of the segment (Date / wall-clock instant). */
  segmentEnd: Date;
}

export interface WeekSegment {
  /** YYYY-MM-DD key for the Monday that starts the ISO week, in tz. */
  weekStartKey: string;
  /** Whole minutes attributed to this week. */
  minutes: number;
}

/**
 * Format a Date as YYYY-MM-DD in the requested IANA timezone.
 * Uses Intl.DateTimeFormat 'en-CA' which always emits ISO-8601 form.
 */
function dayKeyInZone(d: Date, timeZone: string): string {
  return new Intl.DateTimeFormat('en-CA', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
  }).format(d);
}

/**
 * Get the wall-clock components of `d` AS SEEN IN `timeZone`. Returns the
 * year/month/day/hour/minute/second the local clock in that zone is showing
 * at the instant `d`.
 */
function partsInZone(d: Date, timeZone: string) {
  const fmt = new Intl.DateTimeFormat('en-US', {
    timeZone,
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit',
    second: '2-digit',
    hourCycle: 'h23',
  });
  const parts = fmt.formatToParts(d);
  const get = (t: string) => Number(parts.find(p => p.type === t)?.value);
  return {
    year: get('year'),
    month: get('month'),
    day: get('day'),
    hour: get('hour'),
    minute: get('minute'),
    second: get('second'),
  };
}

/**
 * Find the UTC instant at which the wall clock in `timeZone` reads exactly
 * `target` (a YYYY-MM-DD date at 00:00 local).
 *
 * Iterative refinement: start from the same wall-clock value as if it were
 * UTC, then adjust by the timezone's offset at that instant. One pass is
 * sufficient for non-DST-transition days; we run two passes to handle the
 * sub-hour offsets (e.g. India +5:30) and DST edges robustly.
 */
function instantForLocalMidnight(year: number, month: number, day: number, timeZone: string): Date {
  // Start with a guess as if "midnight in zone" were UTC midnight.
  let guess = new Date(Date.UTC(year, month - 1, day, 0, 0, 0));
  for (let i = 0; i < 3; i++) {
    const parts = partsInZone(guess, timeZone);
    const drift = (
      ((parts.year - year) * 12 * 31 + (parts.month - month) * 31 + (parts.day - day)) * 86400
      + parts.hour * 3600
      + parts.minute * 60
      + parts.second
    );
    if (drift === 0) return guess;
    guess = new Date(guess.getTime() - drift * 1000);
  }
  return guess;
}

/** Local midnight at the START of the day after `d`, in `timeZone`. */
function nextLocalMidnight(d: Date, timeZone: string): Date {
  const p = partsInZone(d, timeZone);
  // Compute (year, month, day) of "the day after p"
  const sameDayMidnight = instantForLocalMidnight(p.year, p.month, p.day, timeZone);
  // Add ~25 hours to land deep inside the next local day, then re-anchor to
  // the start of THAT day. ~25h covers DST "spring forward" gaps cleanly.
  const probe = new Date(sameDayMidnight.getTime() + 25 * 3600 * 1000);
  const np = partsInZone(probe, timeZone);
  return instantForLocalMidnight(np.year, np.month, np.day, timeZone);
}

/** ISO week start (Monday 00:00 in `timeZone`) for the given instant. */
function isoWeekStart(d: Date, timeZone: string): Date {
  const p = partsInZone(d, timeZone);
  const localMidnight = instantForLocalMidnight(p.year, p.month, p.day, timeZone);
  // Use a Date representing local midnight to derive day-of-week
  const dow = new Date(localMidnight).getUTCDay(); // 0=Sun..6=Sat in UTC, but localMidnight IS that wall-clock time at UTC offset
  // We need day-of-week as observed in the zone. Re-derive from local parts.
  const tmp = new Date(Date.UTC(p.year, p.month - 1, p.day));
  const localDow = tmp.getUTCDay(); // Sunday=0
  const diff = -((localDow + 6) % 7); // Days back to Monday
  if (diff === 0) return localMidnight;
  // Add diff days (negative) by re-anchoring through a probe day.
  const probe = new Date(localMidnight.getTime() + diff * 86400 * 1000);
  const pp = partsInZone(probe, timeZone);
  return instantForLocalMidnight(pp.year, pp.month, pp.day, timeZone);
}

/**
 * Split [clockIn, clockOut] into one segment per calendar day in `timeZone`.
 * Returns an empty array if the interval is non-positive.
 */
export function splitEntryAcrossDays(
  clockIn: Date,
  clockOut: Date,
  timeZone: string = 'UTC',
): DaySegment[] {
  if (!(clockIn instanceof Date) || !(clockOut instanceof Date)) return [];
  if (clockOut.getTime() <= clockIn.getTime()) return [];

  const segments: DaySegment[] = [];
  let cursor = new Date(clockIn);
  // Hard ceiling — a single shift over a year long is bogus and would loop.
  let safety = 400;
  while (cursor.getTime() < clockOut.getTime() && safety-- > 0) {
    const nextMidnight = nextLocalMidnight(cursor, timeZone);
    const segEnd = nextMidnight.getTime() < clockOut.getTime() ? nextMidnight : clockOut;
    const minutes = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);
    if (minutes > 0) {
      segments.push({
        dayKey: dayKeyInZone(cursor, timeZone),
        weekStartKey: dayKeyInZone(isoWeekStart(cursor, timeZone), timeZone),
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
 * Split [clockIn, clockOut] into one segment per ISO week (Mon-Sun in tz).
 */
export function splitEntryAcrossWeeks(
  clockIn: Date,
  clockOut: Date,
  timeZone: string = 'UTC',
): WeekSegment[] {
  if (!(clockIn instanceof Date) || !(clockOut instanceof Date)) return [];
  if (clockOut.getTime() <= clockIn.getTime()) return [];

  const segments: WeekSegment[] = [];
  let cursor = new Date(clockIn);
  let safety = 200;
  while (cursor.getTime() < clockOut.getTime() && safety-- > 0) {
    const cursorWeekStart = isoWeekStart(cursor, timeZone);
    const nextWeekStart = new Date(cursorWeekStart.getTime() + 7 * 86400 * 1000);
    // Re-anchor next week to local midnight to absorb DST drift.
    const np = partsInZone(nextWeekStart, timeZone);
    const nextWeekStartAnchored = instantForLocalMidnight(np.year, np.month, np.day, timeZone);
    const segEnd = nextWeekStartAnchored.getTime() < clockOut.getTime() ? nextWeekStartAnchored : clockOut;
    const minutes = Math.round((segEnd.getTime() - cursor.getTime()) / 60000);
    if (minutes > 0) {
      segments.push({
        weekStartKey: dayKeyInZone(cursorWeekStart, timeZone),
        minutes,
      });
    }
    cursor = segEnd;
  }
  return segments;
}

/**
 * Aggregate per-day minutes across a list of entries, splitting overnight
 * shifts so each calendar day in `timeZone` receives only the minutes that
 * fell on it.
 */
export function aggregateMinutesByDay(
  entries: Array<{ clockIn: Date; clockOut: Date | null }>,
  timeZone: string = 'UTC',
): Record<string, number> {
  const byDay: Record<string, number> = {};
  for (const e of entries) {
    if (!e.clockOut) continue;
    for (const seg of splitEntryAcrossDays(e.clockIn, e.clockOut, timeZone)) {
      byDay[seg.dayKey] = (byDay[seg.dayKey] || 0) + seg.minutes;
    }
  }
  return byDay;
}
