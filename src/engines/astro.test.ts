import { describe, expect, it } from 'vitest';
import vectors from '../../tests/vectors.json';
import { moladTotal } from './calendar';
import { CITIES, HOUR, hm, moladMs, odeh, phaseNear, sunriseOn, sunsetOn } from './astro';

const A = vectors.astro;
const MIN = 60000;
const J = CITIES[0];
const toMin = (s: string) => { const [h, m] = s.split(':').map(Number); return h * 60 + m; };
const near = (got: number, want: string, tolMin = 2) =>
  expect(Math.abs(got - Date.parse(want)) / MIN).toBeLessThanOrEqual(tolMin);

describe('phases (±2 min)', () => {
  it('new moon 2024-04-08', () => near(phaseNear(Date.UTC(2024, 3, 8, 12), 0), A.newMoon_2024_04_08));
  it('full moon 2024-04-23', () => near(phaseNear(Date.UTC(2024, 3, 23, 12), 180), A.fullMoon_2024_04_23));
  it('new moon 2026-09-11', () => near(phaseNear(Date.UTC(2026, 8, 11, 12), 0), A.newMoon_2026_09_11));
  it('molad Tishrei 5787 instant', () => near(moladMs(moladTotal(5787)), A.moladTishrei5787_UTC));
  it('mean molad is ~15h late in Tishrei 5787', () => {
    const mean = moladMs(moladTotal(5787));
    const lag = (mean - phaseNear(mean, 0)) / HOUR;
    expect(lag).toBeGreaterThan(14.5);
    expect(lag).toBeLessThan(15.5);
  });
});

describe('sunrise / sunset Jerusalem (±2 min)', () => {
  const cmp = (ms: number | null, want: string) => {
    expect(ms).not.toBeNull();
    expect(Math.abs(toMin(hm(ms!)) - toMin(want))).toBeLessThanOrEqual(2);
  };
  it('sunset 2024-04-08', () => cmp(sunsetOn(2024, 3, 8, J), A.sunsetJerusalem_2024_04_08_local));
  it('sunrise 2024-04-08', () => cmp(sunriseOn(2024, 3, 8, J), A.sunriseJerusalem_2024_04_08_local));
  it('sunset 2024-12-21', () => cmp(sunsetOn(2024, 11, 21, J), A.sunsetJerusalem_2024_12_21_local));
});

describe('Odeh, Jerusalem', () => {
  for (const v of A.odehJerusalem) {
    it(v.date, () => {
      const [y, m, d] = v.date.split('-').map(Number);
      const r = odeh(true, y, m - 1, d, J)!;
      expect(r.zone).toBe(v.zone);
      expect(Math.abs(r.V - v.V)).toBeLessThanOrEqual(0.3);
      expect(Math.abs(r.lag! / MIN - v.lagMin)).toBeLessThanOrEqual(2);
    });
  }
});
