import { describe, expect, it } from 'vitest';
import vectors from '../../tests/vectors.json';
import { moladTotal } from './calendar';
import { CITIES, HOUR, hm, moladMs, moonNode, odeh, phaseNear, seasons, sunriseOn, sunsetOn } from './astro';

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

describe('moon node and seasons', () => {
  it('seasons in the years 0–99 and before year 1 are in that year (not 1900–1999)', () => {
    for (const y of [-1312, 0, 50, 99, 100]) {
      const d = new Date(seasons(y)[0]);
      expect(d.getUTCFullYear()).toBe(y);
      expect(d.getUTCMonth()).toBe(2);   // March, proleptic Gregorian
    }
  });
  it('mean ascending node, Meeus example 47.a (1992-04-12 0h TD): 274.400656°', () => {
    // TD − UT ≈ 59 s in 1992; Meeus uses JDE 2448724.5
    const ms = Date.UTC(1992, 3, 12) - 59000;
    expect(moonNode(ms)).toBeCloseTo(274.400656, 2);
  });
  it('the node regresses about 19.35° a year', () => {
    const a = moonNode(Date.UTC(2026, 0, 1)), b = moonNode(Date.UTC(2027, 0, 1));
    expect(((a - b + 360) % 360)).toBeCloseTo(19.35, 1);
  });
  it('2026 equinoxes and solstices (±10 min)', () => {
    const want = ['2026-03-20T14:46Z', '2026-06-21T08:24Z', '2026-09-23T00:05Z', '2026-12-21T20:50Z'];
    seasons(2026).forEach((t, i) => expect(Math.abs(t - Date.parse(want[i])) / 60000, want[i]).toBeLessThanOrEqual(10));
  });
});

import { eclToHorizon, eqToHorizon } from './astro';
describe('ecliptic → horizon', () => {
  it('the sun from its ecliptic longitude stands where sky() puts it', async () => {
    const { sky, sunEcl, TofMs, CITIES } = await import('./astro');
    const ms = Date.UTC(2026, 3, 20, 16, 30), s = sky(ms, CITIES[0]), lam = sunEcl(TofMs(ms).T).lam;
    const h = eclToHorizon(lam, 0, ms, CITIES[0]);
    expect(h.alt).toBeCloseTo(s.sun.alt, 1);
    expect(h.az).toBeCloseTo(s.sun.az, 1);
    // the celestial pole stands at the latitude, due north
    const p = eqToHorizon(0, 90, ms, CITIES[0]);
    expect(p.alt).toBeCloseTo(CITIES[0].lat, 6);
  });
});
