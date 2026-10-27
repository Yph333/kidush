// Chapters 2–5, 18–19: the rules laid out as functions.

import { describe, expect, it } from 'vitest';
import { allFullDrift, avivRule, fullMonths, heightsJoin, leapCourt, messengerDays, tekufaInNisan } from './beitdin';
import { isLeap } from './calendar';
import { R_DECL, moonFromEquator, rambam, rambamD0, rambamDecl } from './rambam';

describe('ch. 2–4', () => {
  it('2:5: two and three join; three and five do not', () => {
    expect(heightsJoin(2, 3)).toBe(true);
    expect(heightsJoin(3, 5)).toBe(false);
    expect(heightsJoin(3, 4)).toBe(true);
  });
  it('4:4: two of three lands decide', () => {
    expect(avivRule([true, true, false], false).leap).toBe(false);
    expect(avivRule([true, false, false], false).leap).toBe(true);
    expect(avivRule([true, false, false], true).leap).toBe(false);
  });
  it('4:9–10: the court of three, five and seven', () => {
    expect(leapCourt(1, 0, 0).at(-1)).toMatchObject({ n: 3, result: 'cancel' });
    expect(leapCourt(2, 2, 0).at(-1)).toMatchObject({ n: 5, result: 'noLeap' });
    expect(leapCourt(2, 3, 4).at(-1)).toMatchObject({ n: 7, result: 'leap' });
    expect(leapCourt(2, 3, 3).at(-1)).toMatchObject({ n: 7, result: 'noLeap' });
  });
  it('4:2: in the fixed calendar, a leap year is one whose tekufa would otherwise fall late in Nisan', () => {
    let late = 0, n = 0;
    for (let y = 5700; y < 5800; y++) {
      const t = tekufaInNisan(y, 'ravAdda');
      expect(t.leap).toBe(isLeap(y));
      if (!t.leap) continue;
      n++; if ((t.withoutLeap ?? 0) >= 16) late++;
    }
    expect(late / n).toBeGreaterThan(0.6);   // a rule of thumb, not exact: the fixed cycle only follows it on average
  });
});

describe('ch. 3: messengers', () => {
  it('3:13: without Shabbat, Nisan messengers have two days more than Tishrei', () => {
    const w = (m: 'nisan' | 'tishrei') => messengerDays(m, null).filter(d => d.walk).length;
    expect(w('nisan') - w('tishrei')).toBe(2);
  });
  it('5:11: with Shabbat, the Tishrei messengers walk about ten days', () => {
    for (let wd = 0; wd < 7; wd++) {
      const n = messengerDays('tishrei', wd).filter(d => d.walk).length;
      expect(n).toBeGreaterThanOrEqual(10); expect(n).toBeLessThanOrEqual(11);
    }
  });
});

describe('ch. 18', () => {
  it('18:6: a year of thirty-day months runs about five and a half days ahead', () => {
    expect(allFullDrift(12)).toBeCloseTo(5.63, 2);
  });
  it('18:9: the fixed calendar always has four to eight full months', () => {
    for (let y = 5600; y < 5900; y++) { const n = fullMonths(y); expect(n).toBeGreaterThanOrEqual(4); expect(n).toBeLessThanOrEqual(8); }
  });
});

describe('ch. 19', () => {
  it('19:7–8: the table, 5° → 2°, 23° → 9°', () => {
    expect(R_DECL.at(-1)).toBe(1410);
    expect(rambamDecl(5).decl).toBe(120);
    expect(Math.round(rambamDecl(23).decl / 60)).toBe(9);
  });
  it('19:9: folds', () => {
    expect(rambamDecl(150).decl).toBe(rambamDecl(30).decl);
    expect(rambamDecl(200).decl).toBe(-rambamDecl(20).decl);
    expect(rambamDecl(300).decl).toBe(-rambamDecl(60).decl);
  });
  it('19:11: 2 Iyar 4938: about 18° north, latitude about 4° south, 14° north', () => {
    const R = rambam(rambamD0() + 29), m = moonFromEquator(R.moonTrue, R.lat1, R.north);
    expect(Math.round(m.decl / 60)).toBe(18);
    expect(Math.round(-m.lat / 60)).toBe(4);
    expect(Math.round(m.dist / 60)).toBe(14);
    expect(m.dir).toBe('north');
  });
});
