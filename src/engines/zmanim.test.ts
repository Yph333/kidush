import { describe, expect, it } from 'vitest';
import oracle from '../../tests/zmanim-oracle.json';
import horizons from '../content/horizons.json';
import { ZMANIM, ZMAN_BY_ID } from '../content/zmanimOpinions';
import {
  H0_STANDARD, dip, horizonAlt, hourAngle, ilOffset, localHM, localHMin, refraction, solarNoon, sunAltAz, sunAt, sunPosition, sunsetStages,
  tzOffsetHours, visibleSun, zman,
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
  it('interpolates between close points; far gaps and missing directions are open', () => {
    const prof = [{ az: 90, alt: 2 }, { az: 120, alt: 0 }];
    expect(horizonAlt(prof, 90)).toBe(2);
    expect(horizonAlt(prof, 105)).toBeCloseTo(1, 6);
    expect(horizonAlt(prof, 270)).toBeNull();            // the west was never entered
    expect(horizonAlt([{ az: 350, alt: 1 }, { az: 10, alt: 3 }], 0)).toBeCloseTo(2, 6); // wraps through north
    expect(horizonAlt([{ az: 90, alt: 1 }], 100)).toBe(1);
    expect(horizonAlt([{ az: 90, alt: 1 }], 120)).toBeNull();
    expect(horizonAlt(undefined, 123)).toBeNull();
  });
  it('an eastern-only profile does not touch sunset', () => {
    const east = [60, 75, 90, 105, 120].map(az => ({ az, alt: 3 }));
    expect(visibleSun(2026, 2, 20, { ...p, horizon: east }, false).ms).toBe(sunAt(2026, 2, 20, p, H0_STANDARD, false).ms);
  });
  it('a 2° eastern ridge delays sunrise by several minutes; a flat profile matches the mishor', () => {
    const flat = visibleSun(2026, 2, 20, { ...p, horizon: [{ az: 0, alt: 0 }] }, true).ms!;
    const mishor = sunAt(2026, 2, 20, p, H0_STANDARD, true).ms!;
    expect(Math.abs(flat - mishor) / MIN).toBeLessThan(0.6);
    const ridge = visibleSun(2026, 2, 20, { ...p, horizon: [60, 90, 120].map(az => ({ az, alt: 2 })) }, true).ms!;
    expect((ridge - mishor) / MIN).toBeGreaterThan(8);
    expect((ridge - mishor) / MIN).toBeLessThan(14);
  });
  it('a skyline at exactly 0° seen from 750 m hides the dipped horizon: equals the mishor time', () => {
    const q = { lat: 31.778, lon: 35.235, elevation: 750, horizon: [60, 90, 120].map(az => ({ az, alt: 0 })) };
    const mishor = sunAt(2026, 2, 20, q, H0_STANDARD, true).ms!;
    expect(Math.abs(visibleSun(2026, 2, 20, q, true).ms! - mishor) / MIN).toBeLessThan(0.05);
  });
  it('ridges lower than the sea-horizon dip (−0.8° at 750 m) change nothing', () => {
    const q = { lat: 31.778, lon: 35.235, elevation: 750 };
    const a = visibleSun(2026, 2, 20, { ...q, horizon: [{ az: 90, alt: -0.9 }] }, true).ms!;
    const b = visibleSun(2026, 2, 20, { ...q, horizon: [{ az: 90, alt: -1.5 }] }, true).ms!;
    expect(a).toBe(b);
    expect(Math.abs(a - sunAt(2026, 2, 20, q, H0_STANDARD - dip(750), true).ms!) / MIN).toBeLessThan(0.05);
  });
  it('without a profile, visible = elevation-adjusted', () => {
    const q = { lat: 31.778, lon: 35.235, elevation: 750 };
    expect(visibleSun(2026, 2, 20, q, false).ms).toBe(sunAt(2026, 2, 20, q, H0_STANDARD - dip(750), false).ms);
  });
});

describe('SRTM horizon profiles (src/content/horizons.json)', () => {
  const H = horizons.cities as Record<string, { lat: number; lon: number; ground: number; profile: number[][] }>;
  const prof = (name: string) => H[name].profile.map(([az, alt]) => ({ az, alt }));
  it('every city has a full 360° profile at 2° steps', () => {
    for (const c of Object.values(H)) expect(c.profile).toHaveLength(180);
  });
  it('Jerusalem ground is about 750 m (VERIFICATION.md)', () => {
    expect(Math.abs(H['ירושלים'].ground - 750)).toBeLessThan(25);
  });
  it('Eilat: the western mountains make the visible sunset much earlier than the mishor', () => {
    const c = H['אילת'], p = { lat: c.lat, lon: c.lon, elevation: c.ground, horizon: prof('אילת') };
    const mishor = sunAt(2026, 2, 20, p, H0_STANDARD, false).ms!;
    expect((mishor - visibleSun(2026, 2, 20, p, false).ms!) / MIN).toBeGreaterThan(15);
  });
  it('Jerusalem: the Mount of Olives delays the visible sunrise', () => {
    const c = H['ירושלים'], p = { lat: c.lat, lon: c.lon, elevation: c.ground, horizon: prof('ירושלים') };
    const elev = sunAt(2026, 2, 20, p, H0_STANDARD - dip(c.ground), true).ms!;
    expect((visibleSun(2026, 2, 20, p, true).ms! - elev) / MIN).toBeGreaterThan(5);
  });
});

describe('time zones and sunset stages', () => {
  it('tzOffsetHours: Paris +1 in winter, +2 in summer; Jerusalem agrees with ilOffset in 2026', () => {
    expect(tzOffsetHours(Date.UTC(2026, 0, 15, 12), 'Europe/Paris')).toBe(1);
    expect(tzOffsetHours(Date.UTC(2026, 6, 15, 12), 'Europe/Paris')).toBe(2);
    for (const m of [0, 3, 6, 9, 11]) {
      const t = Date.UTC(2026, m, 10, 12);
      expect(tzOffsetHours(t, 'Asia/Jerusalem')).toBe(ilOffset(t));
    }
    expect(localHMin(Date.UTC(2026, 6, 15, 19, 0), 'Europe/Paris')).toBe('21:00');
  });
  it('the sun sets more slowly in northern France than in Jerusalem', () => {
    const J = { lat: 31.778, lon: 35.235 }, R = { lat: 48.5193, lon: 4.2927 };
    const dur = (p: { lat: number; lon: number }) => { const s = sunsetStages(2026, 2, 20, p, [8.5, 16.1]); return { disk: (s.set! - s.touch!) / MIN, d16: (s.depth[16.1]! - s.set!) / MIN }; };
    const j = dur(J), r = dur(R);
    expect(j.disk).toBeGreaterThan(2); expect(j.disk).toBeLessThan(3);           // ~2.4 min
    expect(r.disk).toBeGreaterThan(3); expect(r.disk).toBeLessThan(4);           // ~3.4 min
    expect(r.d16).toBeGreaterThan(j.d16 + 20);                                    // much longer twilight
  });
  it('around the June solstice the sun never reaches 18° below the horizon at Ramerupt', () => {
    expect(sunsetStages(2026, 5, 21, { lat: 48.5193, lon: 4.2927 }, [18.5]).depth[18.5]).toBeNull();
  });
});
