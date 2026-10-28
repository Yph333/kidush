// Hilchot Kiddush HaChodesh ch. 11–13: the worked examples, checked against the engines.
import { describe, expect, it } from 'vitest';
import { cyclePos, monthStart, monthsOf } from './calendar';
import { addDms, fromSec, inSign, subDms, toSec } from './dms';
import { RB, R_SUN, interp, rMotion, rambam, rambamD0, secOf } from './rambam';

const dms = (d: number, m: number, s: number) => ({ d, m, s });

describe('Kiddush HaChodesh 11', () => {
  it('11:8 70° 30′ 40″ is in Gemini, in the middle of its eleventh degree', () => {
    const r = inSign(toSec(dms(70, 30, 40)));
    expect(r.sign).toBe(2);
    expect(r.within).toEqual(dms(10, 30, 40));
  });
  it('11:9 302° is 2° in Aquarius', () => expect(inSign(toSec(dms(302, 0, 0)))).toEqual({ sign: 10, within: dms(2, 0, 0) }));
  it('11:10 adding carries seconds → minutes → degrees and drops 360', () => {
    const r = addDms(dms(350, 50, 40), dms(20, 30, 30));
    expect([r.s, r.sCarry, r.m, r.mCarry, r.d, r.circles]).toEqual([10, 1, 21, 1, 11, 1]);
  });
  it("11:12 the Rambam's example: 100° 20′ 30″ − 200° 50′ 40″ = 259° 29′ 50″ (רנ״ט כ״ט נ׳)", () => {
    const r = subDms(dms(100, 20, 30), dms(200, 50, 40));
    expect(r.added360).toBe(true);
    expect([r.sBorrow, r.mBorrow]).toEqual([true, true]);
    expect([r.d, r.m, r.s]).toEqual([259, 29, 50]);
  });
  it('11:16 the epoch: Thursday night, 3 Nisan 4938, year 17 of cycle 260', () => {
    expect(rambamD0() % 7).toBe(4);
    const ni = monthsOf(4938).findIndex(m => m[0] === 'ניסן');
    expect(rambamD0() - monthStart(4938, ni)).toBe(2);
    expect(cyclePos(4938)).toBe(17);
    expect(Math.floor((4938 - 1) / 19) + 1).toBe(260);
  });
});

describe('Kiddush HaChodesh 12–13', () => {
  it('12:1 the sun tables', () => {
    expect(RB.sun[1]).toEqual([0, 59, 8]); expect(RB.sun[29]).toEqual([28, 35, 1]); expect(RB.sun[354]).toEqual([348, 55, 15]);
  });
  it("12:2 the Rambam's example: 14 Tammuz, 100 days: mean sun 105° 37′ 25″ (ק״ה ל״ז כ״ה), 15° 37′ in Cancer", () => {
    const R = rambam(rambamD0() + 100);
    expect(R.sunMean).toBe(toSec(dms(105, 37, 25)));
    expect(inSign(R.sunMean)).toEqual({ sign: 3, within: dms(15, 37, 25) });
    expect(rMotion(RB.sun, 100).v).toBe(secOf(RB.sun[100]));
  });
  it("13:9 the same night: apogee 86° 45′ 23″, course 18° 52′ 2″ → 19° → 38′", () => {
    const R = rambam(rambamD0() + 100);
    expect(R.apo).toBe(toSec(dms(86, 45, 23)));
    expect(fromSec(R.sunMaslul)).toEqual(dms(18, 52, 2));
    expect(R.sunMaslulR).toBe(19);
    expect(R.sunEq).toBe(38);
  });
  it('13:10 the true sun 104° 59′ (ק״ד נ״ט כ״ה, seconds dropped), in Cancer at 15° less 35″', () => {
    const R = rambam(rambamD0() + 100);
    expect(R.sunTrue).toBe(104 * 60 + 59);
    expect(toSec(dms(105, 37, 25)) - 38 * 60).toBe(toSec(dms(104, 59, 25)));
  });
  it('13:4 the table rows, and 13:7 interpolation: 65° → 1° 46′', () => {
    expect(R_SUN.slice(0, 4)).toEqual([0, 20, 40, 58]);
    expect(Math.round(interp(R_SUN, 65))).toBe(106);
    expect(Math.round(interp(R_SUN, 67))).toBe(108);
  });
});

import { sunEquation } from './rambam';
describe('sunEquation (for the visuals) = the chain', () => {
  it('matches rambam() over two years of evenings', async () => {
    const { rambam, rambamD0 } = await import('./rambam');
    for (let d = rambamD0(); d < rambamD0() + 730; d += 7) {
      const R = rambam(d), e = sunEquation(R.sunMaslul);
      expect([e.round, e.eq, e.sign]).toEqual([R.sunMaslulR, R.sunEq, R.sunSign]);
    }
  });
});
