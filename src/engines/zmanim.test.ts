import { describe, expect, it } from 'vitest';
import oracle from '../../tests/zmanim-oracle.json';
import { ZMANIM, ZMAN_BY_ID } from '../content/zmanimOpinions';
import {
  H0_STANDARD, dip, horizonAlt, hourAngle, localHM, refraction, solarNoon, sunAltAz, sunAt, sunPosition, visibleSun, zman,
} from './zmanim';

const MIN = 60000;
type Case = (typeof oracle.cases)[number];
const ctxOf = (c: Case) => {
  const [y, m, d] = c.date.split('-').map(Number);
  return { y, m: m - 1, d, p: { lat: c.lat, lon: c.lon, elevation: c.elevation } };
};

describe('KosherJava agreement (±1 minute, identical definitions)', () => {
  let compared = 0, worst = 0, worstWhat = '';
  for (const c of oracle.cases as Case[]) {
    describe(`${c.city} ${c.date}`, () => {
      for (const [id, iso] of Object.entries(c.zmanim)) {
        const op = ZMAN_BY_ID.get(id);
        it(id, () => {
          expect(op, `opinion ${id} exists`).toBeDefined();
          const got = zman(op!.def, ctxOf(c));
          expect(got).not.toBeNull();
          const diff = Math.abs(got! - Date.parse(iso as string)) / 1000;
          compared++;
          if (diff > worst) { worst = diff; worstWhat = `${c.city} ${c.date} ${id}`; }
          expect(diff, `${id}: ${diff.toFixed(1)}s`).toBeLessThanOrEqual(60);
        });
      }
    });
  }
  it('summary', () => {
    expect(compared).toBeGreaterThan(700);
    console.info(`zmanim vs KosherJava: ${compared} values, worst ${worst.toFixed(1)} s (${worstWhat})`);
  });
});

describe('every opinion is computable and ordered sensibly', () => {
  const ctx = { y: 2026, m: 2, d: 20, p: { lat: 31.778, lon: 35.235, elevation: 750 } };
  it('all opinions give a time', () => {
    for (const z of ZMANIM) expect(zman(z.def, ctx), z.id).not.toBeNull();
  });
  it('alot < misheyakir < sunrise < shma < tefila < chatzot < mincha gedola < ketana < plag < sunset < tzeit (GRA, 16.1°, 8.5°)', () => {
    const ids = ['alot_16_1', 'misheyakir_11', 'sunrise_mishor', 'shma_gra', 'tefila_gra', 'chatzot', 'mincha_gedola_gra', 'mincha_ketana_gra', 'plag_gra', 'sunset_mishor', 'tzeit_8_5'];
    const t = ids.map(id => zman(ZMAN_BY_ID.get(id)!.def, ctx)!);
    for (let i = 1; i < t.length; i++) expect(t[i], ids[i]).toBeGreaterThan(t[i - 1]);
  });
  it('every source is either given or marked TODO: verify', () => {
    for (const z of ZMANIM) expect(z.source.length, z.id).toBeGreaterThan(0);
  });
});

describe('building blocks', () => {
  it('dip ≈ 1.76′·√h', () => {
    expect(dip(0)).toBe(0);
    expect(dip(750) * 60).toBeCloseTo(48.2, 1);
  });
  it('standard horizon is −50′', () => expect(H0_STANDARD).toBeCloseTo(-0.8333, 4));
  it('Bennett refraction is about 34′ at the horizon and shrinks with altitude', () => {
    expect(refraction(0) * 60).toBeGreaterThan(33);
    expect(refraction(0) * 60).toBeLessThan(36);
    expect(refraction(5)).toBeLessThan(refraction(1));
  });
  it('declination at the solstices ≈ ±23.44°, equation of time in range', () => {
    expect(sunPosition(Date.UTC(2026, 5, 21, 12)).decl).toBeCloseTo(23.44, 1);
    expect(sunPosition(Date.UTC(2026, 11, 21, 12)).decl).toBeCloseTo(-23.44, 1);
    expect(sunPosition(Date.UTC(2026, 10, 3, 12)).eot).toBeGreaterThan(16);   // early November max ≈ +16.4 min
    expect(sunPosition(Date.UTC(2026, 1, 11, 12)).eot).toBeLessThan(-14);   // mid-February min ≈ −14.2 min
  });
  it('hour angle: equinox at the equator is 90°', () => {
    expect(hourAngle(0, 0, 0).H).toBeCloseTo(90, 6);
    expect(hourAngle(80, 23, -0.833).H).toBeNull(); // polar day
  });
  it('the sun is at the requested altitude at the computed time', () => {
    const p = { lat: 31.778, lon: 35.235 };
    const t = sunAt(2026, 2, 20, p, -16.1, true).ms!;
    expect(sunAltAz(t, p).alt).toBeCloseTo(-16.1, 2);
    const n = solarNoon(2026, 2, 20, p);
    expect(sunAltAz(n, p).alt).toBeGreaterThan(sunAltAz(n - 20 * MIN, p).alt);
    expect(sunAltAz(n, p).alt).toBeGreaterThan(sunAltAz(n + 20 * MIN, p).alt);
  });
  it('local time in Israel follows DST', () => {
    expect(localHM(Date.UTC(2026, 6, 1, 9, 0))).toBe('12:00');  // IDT +3
    expect(localHM(Date.UTC(2026, 0, 1, 9, 0))).toBe('11:00');  // IST +2
  });
});

describe('horizon profile', () => {
  const p = { lat: 31.778, lon: 35.235, elevation: 0 };
  it('interpolates around the circle', () => {
    const prof = [{ az: 90, alt: 2 }, { az: 270, alt: 0 }];
    expect(horizonAlt(prof, 90)).toBe(2);
    expect(horizonAlt(prof, 180)).toBeCloseTo(1, 6);
    expect(horizonAlt(prof, 0)).toBeCloseTo(1, 6);
    expect(horizonAlt(undefined, 123)).toBe(0);
  });
  it('a 2° eastern ridge delays sunrise by several minutes; a flat profile matches the mishor', () => {
    const flat = visibleSun(2026, 2, 20, { ...p, horizon: [{ az: 0, alt: 0 }] }, true).ms!;
    const mishor = sunAt(2026, 2, 20, p, H0_STANDARD, true).ms!;
    expect(Math.abs(flat - mishor) / MIN).toBeLessThan(0.6);
    const ridge = visibleSun(2026, 2, 20, { ...p, horizon: [{ az: 0, alt: 2 }, { az: 180, alt: 2 }] }, true).ms!;
    expect((ridge - mishor) / MIN).toBeGreaterThan(8);
    expect((ridge - mishor) / MIN).toBeLessThan(14);
  });
  it('without a profile, visible = elevation-adjusted', () => {
    const q = { lat: 31.778, lon: 35.235, elevation: 750 };
    expect(visibleSun(2026, 2, 20, q, false).ms).toBe(sunAt(2026, 2, 20, q, H0_STANDARD - dip(750), false).ms);
  });
});
