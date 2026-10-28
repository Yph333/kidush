import { describe, expect, it } from 'vitest';
import { cycleSeries, movingAverage, talUmatarEvening, yearPoint, yearSeries } from './longTimeline';

const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('the calendar against the seasons', () => {
  it('5785: Pesach (13 Apr 2025) is ~24 days after the equinox (20 Mar 2025)', () => {
    const p = yearPoint(5785);
    expect(p.gy).toBe(2025);
    expect(p.pesach).toBeGreaterThan(23);
    expect(p.pesach).toBeLessThan(25);
  });
  it('5787: Shmuel ~19 days, Rav Adda ~7 days after the true equinox', () => {
    const p = yearPoint(5787);
    expect(p.shmuel).toBeGreaterThan(18);
    expect(p.shmuel).toBeLessThan(20);
    expect(p.ravAdda).toBeGreaterThan(6);
    expect(p.ravAdda).toBeLessThan(8);
  });
  it('drift: Shmuel gains ~1 day per 128 years, Rav Adda ~1 per 216', () => {
    const a = yearPoint(5000), b = yearPoint(5700);
    expect((b.shmuel - a.shmuel) / 700 * 128).toBeCloseTo(1, 0);
    expect((b.ravAdda - a.ravAdda) / 700 * 216).toBeCloseTo(1, 0);
  });
  it('a series has one point per year', () => {
    const s = yearSeries(5700, 50);
    expect(s).toHaveLength(50);
    expect(s[49].y).toBe(5749);
  });
});

describe('tal u-matar outside Israel', () => {
  it('starts the evening of 4 December, or 5 December before a civil leap year', () => {
    expect(iso(talUmatarEvening(5786))).toBe('2025-12-04');  // 2026 is not a leap year
    expect(iso(talUmatarEvening(5784))).toBe('2023-12-05');  // 2024 is a leap year
    expect(iso(talUmatarEvening(5785))).toBe('2024-12-04');
  });
  it('was about a day earlier in the 19th century (Shmuel drifts 1 day per 128 years)', () => {
    const d = talUmatarEvening(5640);                          // 1879
    expect(d.getUTCMonth()).toBe(11);
    expect(d.getUTCDate()).toBeGreaterThanOrEqual(2);
    expect(d.getUTCDate()).toBeLessThanOrEqual(4);
  });
});

describe('movingAverage', () => {
  it('smooths over the window and keeps length', () => {
    expect(movingAverage([1, 2, 3, 4, 5], 3)).toEqual([1.5, 2, 3, 4, 4.5]);
  });
  it('the 19-year average of Pesach drifts like Rav Adda (~1 day per 216 years)', () => {
    const s = yearSeries(5000, 760).map(p => p.pesach), m = movingAverage(s);
    expect((m[750] - m[10]) / 740 * 216).toBeCloseTo(1, 0);
  });
  it('cycles from Sinai: each starts a 19-year cycle; Rav Adda keeps Pesach within its cycle, Shmuel runs ahead', () => {
    const c = cycleSeries(2448, 5787);
    expect(c[0].y).toBe(2433);                       // 2433 = 128 × 19 + 1
    expect(c.every(p => (p.y - 1) % 19 === 0)).toBe(true);
    expect(c[c.length - 1].y).toBe(5777);
    const last = c[c.length - 1];
    expect(last.pesachMin).toBeLessThan(last.pesach);
    expect(last.pesachMax).toBeGreaterThan(last.pesach);
    expect(last.pesachMax - last.pesachMin).toBeGreaterThan(25);   // Pesach jumps by about a month inside a cycle
    // over ~3300 years: Shmuel drifts ~26 days later, Rav Adda ~15
    expect(last.shmuel - c[0].shmuel).toBeGreaterThan(24);
    expect(last.shmuel - c[0].shmuel).toBeLessThan(28);
    expect(last.ravAdda - c[0].ravAdda).toBeGreaterThan(13);
    expect(last.ravAdda - c[0].ravAdda).toBeLessThan(17);
  });
});
