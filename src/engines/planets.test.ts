import { describe, expect, it } from 'vitest';
import { sunEcl, TofMs } from './astro';
import { PLANETS, helio, kepler, periodDays, eqToEcl } from './planets';

const at = (y: number, m: number, d: number, h = 0) => Date.UTC(y, m - 1, d, h);
const diff = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);

describe('planets (JPL approximate elements)', () => {
  it('Kepler solver', () => {
    for (const e of [0, 0.2, 0.6]) for (let M = 0; M < 6.3; M += 0.7) {
      const E = kepler(M, e);
      expect(E - e * Math.sin(E)).toBeCloseTo(M, 10);
    }
  });
  it('the Earth is opposite the Sun of the Meeus model (after J2000 → of-date precession)', () => {
    for (const ms of [at(1950, 3, 1), at(2000, 1, 1, 12), at(2026, 10, 27), at(2045, 6, 1)]) {
      const T = TofMs(ms).T, prec = 1.3969713 * T;            // general precession in longitude, deg/century
      expect(diff(helio('earth', ms).lon + prec, sunEcl(T).lam + 180)).toBeLessThan(0.03);
    }
  });
  it('known oppositions: the planet and the Earth line up', () => {
    const cases: [typeof PLANETS[number], number][] = [
      ['mars', at(2025, 1, 16)], ['jupiter', at(2026, 1, 10)], ['saturn', at(2025, 9, 21)], ['mars', at(2020, 10, 13)],
    ];
    for (const [id, ms] of cases) expect(diff(helio(id, ms).lon, helio('earth', ms).lon), id).toBeLessThan(1.2);
  });
  it('distances and periods', () => {
    expect(helio('earth', at(2026, 1, 3)).r).toBeCloseTo(0.9833, 2);         // perihelion in early January
    expect(helio('earth', at(2026, 7, 4)).r).toBeCloseTo(1.0167, 2);         // aphelion in early July
    expect(periodDays('earth')).toBeCloseTo(365.256, 1);
    expect(periodDays('jupiter') / 365.25).toBeCloseTo(11.86, 1);
    expect(periodDays('neptune') / 365.25).toBeCloseTo(164.8, 0);
  });
  it('the ecliptic pole is at RA 270°, Dec 66.56°', () => {
    const [x, y, z] = eqToEcl(270, 90 - 23.4392911);
    expect(x).toBeCloseTo(0, 6); expect(y).toBeCloseTo(0, 6); expect(z).toBeCloseTo(1, 6);
  });
});
