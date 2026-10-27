// The figures of Hilchot Kiddush HaChodesh ch. 6, checked against the fixed-calendar engine.
import { describe, expect, it } from 'vitest';
import { BAHRAD, EX, P_DAY, P_HOUR, P_MONTH, addDHP, dhpOf, splitParts } from './calendar';

const dhp = (d: number, h: number, p: number) => ({ d, h, p });
const parts = (d: number, h: number, p: number) => d * P_DAY + h * P_HOUR + p;

describe('Kiddush HaChodesh 6', () => {
  it('6:3 the month is 29 days, 12 hours, 793 parts', () => expect(splitParts(P_MONTH)).toEqual(dhp(29, 12, 793)));
  it('6:4 lunar years and the solar year', () => {
    expect(splitParts(12 * P_MONTH)).toEqual(dhp(354, 8, 876));
    expect(splitParts(13 * P_MONTH)).toEqual(dhp(383, 21, 589));
    expect(splitParts(parts(365, 6, 0) - 12 * P_MONTH)).toEqual(dhp(10, 21, 204));
  });
  it('6:5 the remainders', () => {
    expect(dhpOf(EX.month)).toEqual(dhp(1, 12, 793));
    expect(dhpOf(EX.pashut)).toEqual(dhp(4, 8, 876));
    expect(dhpOf(EX.meubar)).toEqual(dhp(5, 21, 589));
  });
  it("6:7 the Rambam's example: Nisan אהק״ז (day 1, 5 hours of the day = 17, 107 parts) + אי״ב תשצ״ג = ג״ה תת״ק", () => {
    const s = addDHP(dhp(1, 17, 107), dhp(1, 12, 793));
    expect([s.d, s.h, s.p]).toEqual([3, 5, 900]);          // the third day, 5 hours of the night, 900 parts
    expect([s.pCarry, s.hCarry, s.weeks]).toEqual([0, 1, 0]);
  });
  it('6:8 בהר״ד: the night of day 2, 5 hours, 204 parts', () => expect(dhpOf(BAHRAD)).toEqual(dhp(1, 5, 204)));
  it('6:10 nineteen solar years exceed 235 months by 1 hour 485 parts (אתפ״ה)', () => {
    expect(splitParts(19 * parts(365, 6, 0) - 235 * P_MONTH)).toEqual(dhp(0, 1, 485));
  });
  it('6:12 the cycle remainder: 12 × ד״ח תתע״ו + 7 × הכ״א תקפ״ט = בי״ו תקצ״ה', () => {
    expect(dhpOf(12 * EX.pashut + 7 * EX.meubar)).toEqual(dhp(2, 16, 595));
    expect(dhpOf(EX.cycle)).toEqual(dhp(2, 16, 595));
  });
  it('addDHP carries parts → hours → days and drops weeks', () => {
    const s = addDHP(dhp(6, 23, 1000), dhp(4, 8, 876));
    expect([s.pRaw, s.pCarry, s.p, s.hRaw, s.hCarry, s.h, s.dRaw, s.weeks, s.d]).toEqual([1876, 1, 796, 32, 1, 8, 11, 1, 4]);
  });
});
