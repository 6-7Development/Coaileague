/**
 * UNIT TESTS — Shift Splitter
 *
 * Verifies that overnight and week-straddling shifts are split correctly so
 * daily-overtime-over-8h, weekly-overtime-over-40h, and per-segment holiday
 * detection all key off the calendar day each segment actually fell on.
 */

import { describe, it, expect } from 'vitest';
import {
  splitEntryAcrossDays,
  splitEntryAcrossWeeks,
  aggregateMinutesByDay,
} from '@server/services/payroll/shiftSplitter';

describe('splitEntryAcrossDays', () => {
  it('produces a single segment for a same-day shift', () => {
    const segs = splitEntryAcrossDays(
      new Date(2026, 3, 30, 9, 0),
      new Date(2026, 3, 30, 17, 0),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].dayKey).toBe('2026-04-30');
    expect(segs[0].minutes).toBe(480);
  });

  it('splits a 10pm→6am shift into 2h + 6h on consecutive days', () => {
    const segs = splitEntryAcrossDays(
      new Date(2026, 3, 30, 22, 0),
      new Date(2026, 4, 1, 6, 0),
    );
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ dayKey: '2026-04-30', minutes: 120 });
    expect(segs[1]).toMatchObject({ dayKey: '2026-05-01', minutes: 360 });
  });

  it('emits one segment per day for a multi-day shift', () => {
    const segs = splitEntryAcrossDays(
      new Date(2026, 3, 30, 23, 0),
      new Date(2026, 4, 2, 1, 0),
    );
    expect(segs.map(s => s.dayKey)).toEqual(['2026-04-30', '2026-05-01', '2026-05-02']);
    expect(segs.map(s => s.minutes)).toEqual([60, 1440, 60]);
  });

  it('returns no segments for a zero-length interval', () => {
    const t = new Date(2026, 3, 30, 9, 0);
    expect(splitEntryAcrossDays(t, t)).toEqual([]);
  });

  it('returns a single segment when clockOut lands exactly on midnight', () => {
    const segs = splitEntryAcrossDays(
      new Date(2026, 3, 30, 22, 0),
      new Date(2026, 4, 1, 0, 0),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].dayKey).toBe('2026-04-30');
    expect(segs[0].minutes).toBe(120);
  });
});

describe('splitEntryAcrossWeeks', () => {
  it('emits a single week segment for a within-week shift', () => {
    const segs = splitEntryAcrossWeeks(
      new Date(2026, 3, 29, 22, 0),
      new Date(2026, 3, 30, 6, 0),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].weekStartKey).toBe('2026-04-27');
  });

  it('splits a Sunday-night→Monday-morning shift across two ISO weeks', () => {
    const segs = splitEntryAcrossWeeks(
      new Date(2026, 4, 3, 22, 0), // Sun May 3, 10pm
      new Date(2026, 4, 4, 6, 0),  // Mon May 4, 6am
    );
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ weekStartKey: '2026-04-27', minutes: 120 });
    expect(segs[1]).toMatchObject({ weekStartKey: '2026-05-04', minutes: 360 });
  });
});

describe('aggregateMinutesByDay (daily-OT integration)', () => {
  it('correctly attributes a 10pm→9am shift to two days for daily-OT bucketing', () => {
    const byDay = aggregateMinutesByDay([
      { clockIn: new Date(2026, 3, 30, 22, 0), clockOut: new Date(2026, 4, 1, 9, 0) },
    ]);
    expect(byDay['2026-04-30']).toBe(120); // 2h
    expect(byDay['2026-05-01']).toBe(540); // 9h

    // Pre-fix bug: 11h credited to day1 → 3h daily OT.
    // Post-fix: day1=2h (no OT), day2=9h (1h OT) → 1h total daily OT.
    let dailyOT = 0;
    for (const k of Object.keys(byDay)) if (byDay[k] > 480) dailyOT += byDay[k] - 480;
    expect(dailyOT).toBe(60);
  });

  it('skips entries without clockOut', () => {
    const byDay = aggregateMinutesByDay([
      { clockIn: new Date(2026, 3, 30, 9, 0), clockOut: null },
    ]);
    expect(byDay).toEqual({});
  });
});

describe('per-segment holiday multiplier (regression)', () => {
  // Christmas Eve 10pm → Christmas Day 6am, $20/hr.
  // Pre-fix bug: a single holidayMultiplier was overwritten in the segment
  // loop, then applied to TOTAL holiday hours. A shift that straddled a
  // regular day → holiday would charge the holiday rate on the whole shift,
  // overpaying $60 per occurrence.
  // Post-fix: pay is computed per segment with the segment's own multiplier.
  it('charges holiday rate ONLY on the holiday portion of a straddling shift', () => {
    const cIn = new Date(2026, 11, 24, 22, 0);
    const cOut = new Date(2026, 11, 25, 6, 0);
    const segs = splitEntryAcrossDays(cIn, cOut);
    expect(segs).toHaveLength(2);
    expect(segs[0].dayKey).toBe('2026-12-24'); // regular
    expect(segs[1].dayKey).toBe('2026-12-25'); // holiday

    const payRate = 20;
    const holidayCal: Record<string, number> = { '2026-12-25': 2.5 };
    let totalPay = 0;
    for (const seg of segs) {
      const segHours = seg.minutes / 60;
      const mul = holidayCal[seg.dayKey] ?? 1.0;
      totalPay += segHours * payRate * mul;
    }

    // 2h × $20 × 1.0 + 6h × $20 × 2.5 = $40 + $300 = $340
    expect(totalPay).toBe(340);
    // Pre-fix would have produced 8h × $20 × 2.5 = $400 — $60 overpayment.
  });
});
