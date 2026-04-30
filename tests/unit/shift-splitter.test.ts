/**
 * UNIT TESTS — Shift Splitter (timezone-aware)
 *
 * All tests use ISO-with-Z instants and pass an explicit IANA timezone so the
 * suite runs identically on every CI host.
 */

import { describe, it, expect } from 'vitest';
import {
  splitEntryAcrossDays,
  splitEntryAcrossWeeks,
  aggregateMinutesByDay,
} from '@server/services/payroll/shiftSplitter';

describe('splitEntryAcrossDays (UTC default)', () => {
  it('produces a single segment for a same-day shift', () => {
    const segs = splitEntryAcrossDays(
      new Date('2026-04-30T09:00:00Z'),
      new Date('2026-04-30T17:00:00Z'),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].dayKey).toBe('2026-04-30');
    expect(segs[0].minutes).toBe(480);
  });

  it('splits a 10pm→6am UTC shift into 2h + 6h on consecutive days', () => {
    const segs = splitEntryAcrossDays(
      new Date('2026-04-30T22:00:00Z'),
      new Date('2026-05-01T06:00:00Z'),
    );
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ dayKey: '2026-04-30', minutes: 120 });
    expect(segs[1]).toMatchObject({ dayKey: '2026-05-01', minutes: 360 });
  });

  it('emits one segment per day for a multi-day shift', () => {
    const segs = splitEntryAcrossDays(
      new Date('2026-04-30T23:00:00Z'),
      new Date('2026-05-02T01:00:00Z'),
    );
    expect(segs.map(s => s.dayKey)).toEqual(['2026-04-30', '2026-05-01', '2026-05-02']);
    expect(segs.map(s => s.minutes)).toEqual([60, 1440, 60]);
  });

  it('returns no segments for a zero-length interval', () => {
    const t = new Date('2026-04-30T09:00:00Z');
    expect(splitEntryAcrossDays(t, t)).toEqual([]);
  });

  it('returns a single segment when clockOut lands exactly on midnight', () => {
    const segs = splitEntryAcrossDays(
      new Date('2026-04-30T22:00:00Z'),
      new Date('2026-05-01T00:00:00Z'),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].dayKey).toBe('2026-04-30');
    expect(segs[0].minutes).toBe(120);
  });
});

describe('splitEntryAcrossDays — timezone-awareness (root-fix coverage)', () => {
  // 22:00 PDT Apr 30 = 05:00 UTC May 1; 06:00 PDT May 1 = 13:00 UTC May 1
  const cIn = new Date('2026-05-01T05:00:00Z');
  const cOut = new Date('2026-05-01T13:00:00Z');

  it('PDT workspace splits at PDT midnight (07:00 UTC), not UTC midnight', () => {
    const segs = splitEntryAcrossDays(cIn, cOut, 'America/Los_Angeles');
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ dayKey: '2026-04-30', minutes: 120 }); // 22:00→24:00 PDT = 2h
    expect(segs[1]).toMatchObject({ dayKey: '2026-05-01', minutes: 360 }); // 00:00→06:00 PDT = 6h
  });

  it('UTC default sees the same instants as a single same-day segment', () => {
    const segs = splitEntryAcrossDays(cIn, cOut, 'UTC');
    expect(segs).toHaveLength(1);
    expect(segs[0]).toMatchObject({ dayKey: '2026-05-01', minutes: 480 });
  });

  it('NYC DST spring-forward — total minutes equal real elapsed time, not wall-clock', () => {
    // 22:00 EST Mar 7 → 06:00 EDT Mar 8 = 7 real hours (clocks jump 2am→3am)
    const i = new Date('2026-03-08T03:00:00Z');
    const o = new Date('2026-03-08T10:00:00Z');
    const segs = splitEntryAcrossDays(i, o, 'America/New_York');
    const total = segs.reduce((s, x) => s + x.minutes, 0);
    expect(total).toBe(420); // 7h, not 8h
  });

  it('IST sub-hour offset (+5:30) splits at IST midnight', () => {
    const i = new Date('2026-04-30T16:30:00Z'); // 22:00 IST Apr 30
    const o = new Date('2026-05-01T00:30:00Z'); // 06:00 IST May 1
    const segs = splitEntryAcrossDays(i, o, 'Asia/Kolkata');
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ dayKey: '2026-04-30', minutes: 120 });
    expect(segs[1]).toMatchObject({ dayKey: '2026-05-01', minutes: 360 });
  });
});

describe('splitEntryAcrossWeeks', () => {
  it('emits a single week segment for a within-week shift', () => {
    const segs = splitEntryAcrossWeeks(
      new Date('2026-04-29T22:00:00Z'),
      new Date('2026-04-30T06:00:00Z'),
    );
    expect(segs).toHaveLength(1);
    expect(segs[0].weekStartKey).toBe('2026-04-27');
  });

  it('splits a Sunday-night→Monday-morning shift across two ISO weeks', () => {
    // Sun May 3 22:00 UTC → Mon May 4 06:00 UTC
    const segs = splitEntryAcrossWeeks(
      new Date('2026-05-03T22:00:00Z'),
      new Date('2026-05-04T06:00:00Z'),
    );
    expect(segs).toHaveLength(2);
    expect(segs[0]).toMatchObject({ weekStartKey: '2026-04-27', minutes: 120 });
    expect(segs[1]).toMatchObject({ weekStartKey: '2026-05-04', minutes: 360 });
  });
});

describe('DaySegment.weekStartKey integration', () => {
  it('week-key is exposed on every day segment for accumulator bucketing', () => {
    const segs = splitEntryAcrossDays(
      new Date('2026-05-03T22:00:00Z'), // Sun
      new Date('2026-05-04T06:00:00Z'), // Mon
    );
    expect(segs).toHaveLength(2);
    // Sun May 3 is in the week starting Mon Apr 27; Mon May 4 starts the next.
    expect(segs[0].weekStartKey).toBe('2026-04-27');
    expect(segs[1].weekStartKey).toBe('2026-05-04');
  });
});

describe('aggregateMinutesByDay (daily-OT integration)', () => {
  it('correctly attributes a 10pm→9am shift to two days for daily-OT bucketing', () => {
    const byDay = aggregateMinutesByDay([
      { clockIn: new Date('2026-04-30T22:00:00Z'), clockOut: new Date('2026-05-01T09:00:00Z') },
    ]);
    expect(byDay['2026-04-30']).toBe(120);
    expect(byDay['2026-05-01']).toBe(540);

    // Pre-fix bug: 11h credited to day1 → 3h daily OT.
    // Post-fix: day1=2h (no OT), day2=9h (1h OT) → 1h total daily OT.
    let dailyOT = 0;
    for (const k of Object.keys(byDay)) if (byDay[k] > 480) dailyOT += byDay[k] - 480;
    expect(dailyOT).toBe(60);
  });

  it('skips entries without clockOut', () => {
    const byDay = aggregateMinutesByDay([
      { clockIn: new Date('2026-04-30T09:00:00Z'), clockOut: null },
    ]);
    expect(byDay).toEqual({});
  });
});

describe('per-segment holiday multiplier (regression)', () => {
  it('charges holiday rate ONLY on the holiday portion of a straddling shift', () => {
    // Christmas Eve 22:00 UTC → Christmas Day 06:00 UTC
    const segs = splitEntryAcrossDays(
      new Date('2026-12-24T22:00:00Z'),
      new Date('2026-12-25T06:00:00Z'),
    );
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
