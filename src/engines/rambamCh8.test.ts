// Hilchot Kiddush HaChodesh ch. 7–8, checked over many years against the fixed-calendar engine.
import { describe, expect, it } from 'vitest';
import { P_DAY, P_HOUR, isLeap, monthsOf, rh, rhFrom, yearLen, yearType } from './calendar';

const YEARS = Array.from({ length: 1500 }, (_, k) => 5000 + k);
const between = (y: number) => ((rh(y + 1).day - rh(y).day) % 7 + 6) % 7;   // days between, excluding both (a whole week → 6)

describe('Kiddush HaChodesh 7–8', () => {
  it('7:3 Shabbat at noon (זי״ח) → Monday; Tuesday at noon → Thursday', () => {
    const base = 200 * 7 * P_DAY;
    expect(rhFrom(base + 6 * P_DAY + 18 * P_HOUR, false, false).day % 7).toBe(1);
    expect(rhFrom(base + 2 * P_DAY + 18 * P_HOUR, false, false).day % 7).toBe(4);
  });
  it('7:6 one part less: ג״ט ר״ג stays on Tuesday, בט״ו תקפ״ח stays on Monday', () => {
    const base = 200 * 7 * P_DAY;
    expect(rhFrom(base + 2 * P_DAY + 9 * P_HOUR + 203, false, false).day % 7).toBe(2);
    expect(rhFrom(base + 2 * P_DAY + 9 * P_HOUR + 204, false, false).day % 7).toBe(4);
    expect(rhFrom(base + 1 * P_DAY + 15 * P_HOUR + 588, false, true).day % 7).toBe(1);
    expect(rhFrom(base + 1 * P_DAY + 15 * P_HOUR + 589, false, true).day % 7).toBe(2);
  });
  it('8:5 the fixed months', () => {
    for (const y of YEARS) {
      const m = Object.fromEntries(monthsOf(y));
      expect(m['תשרי']).toBe(30); expect(m['טבת']).toBe(29); expect(m['שבט']).toBe(30);
      expect(m['ניסן']).toBe(30); expect(m['אייר']).toBe(29); expect(m['סיוון']).toBe(30);
      expect(m['תמוז']).toBe(29); expect(m['אב']).toBe(30); expect(m['אלול']).toBe(29);
      if (isLeap(y)) { expect(m['אדר א׳']).toBe(30); expect(m['אדר ב׳']).toBe(29); } else expect(m['אדר']).toBe(29);
    }
  });
  it('8:7–8 the days between one Rosh Hashana and the next give the year type', () => {
    for (const y of YEARS) {
      const t = yearType(yearLen(y)), b = between(y);
      const want: Record<number, string> = isLeap(y) ? { 4: 'ח', 5: 'כ', 6: 'ש' } : { 2: 'ח', 3: 'כ', 4: 'ש' };
      expect(t, `${y}`).toBe(want[b]);
    }
  });
  it('8:9 the examples: Thursday → Monday = כסדרן; Thursday → Tuesday = שלמים; Shabbat → Tuesday = חסרין', () => {
    const gap = (a: number, b: number) => ((b - a) % 7 + 6) % 7;
    expect(gap(4, 1)).toBe(3); expect(gap(4, 2)).toBe(4); expect(gap(6, 2)).toBe(2);
  });
  it('8:10 the signs', () => {
    for (const y of YEARS) {
      const d = rh(y).day % 7, t = yearType(yearLen(y)), L = isLeap(y);
      if (d === 2) expect(t, `${y}`).toBe('כ');
      if (d === 6 || d === 1) expect(t, `${y}`).not.toBe('כ');
      if (d === 4 && !L) expect(t, `${y}`).not.toBe('ח');
      if (d === 4 && L) expect(t, `${y}`).not.toBe('כ');
    }
  });
});
