import { describe, expect, it } from 'vitest';
import { CITIES } from './astro';
import { ECLIPSE_SEASON_DAYS, SAROS_DAYS, contacts, eclipseAt, eclipsesBetween, observerView, sarosOf, shadowAxis, subLunar, visibilityAt } from './eclipses';

const J = CITIES[0];
const day = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const find = (iso: string, kind: 'solar' | 'lunar') => {
  const t = Date.parse(iso);
  const e = eclipsesBetween(t - 3 * 86400000, t + 3 * 86400000).find(x => x.kind === kind);
  expect(e, `${kind} eclipse near ${iso}`).toBeDefined();
  return e!;
};

describe('Meeus example 54.a: partial solar eclipse of 1993 May 21', () => {
  it('γ = 1.1348, magnitude 0.740, greatest eclipse JDE 2449129.0979', () => {
    const e = find('1993-05-21', 'solar');
    expect(e.type).toBe('partial');
    expect(e.gamma).toBeCloseTo(1.1348, 3);
    expect(e.magnitude).toBeCloseTo(0.74, 2);
    // JDE 2449129.0979 TT, ΔT ≈ 59 s
    expect(Math.abs(e.ms - ((2449129.0979 - 2440587.5) * 86400000 - 59000)) / 60000).toBeLessThan(2);
  });
});

describe('known eclipses (type and date)', () => {
  const solar: [string, string][] = [
    ['2023-10-14', 'annular'], ['2024-04-08', 'total'], ['2024-10-02', 'annular'], ['2025-03-29', 'partial'],
    ['2025-09-21', 'partial'], ['2026-02-17', 'annular'], ['2026-08-12', 'total'], ['2027-08-02', 'total'],
  ];
  for (const [d, type] of solar) it(`solar ${d}: ${type}`, () => { const e = find(d, 'solar'); expect(e.type).toBe(type); expect(day(e.ms)).toBe(d); });
  const lunar: [string, string][] = [
    ['2025-03-14', 'total'], ['2025-09-07', 'total'], ['2026-03-03', 'total'], ['2026-08-28', 'partial'], ['2024-09-18', 'partial'],
  ];
  for (const [d, type] of lunar) it(`lunar ${d}: ${type}`, () => { const e = find(d, 'lunar'); expect(e.type).toBe(type); expect(day(e.ms)).toBe(d); });
  it('2024-04-08: greatest eclipse about 18:17 UTC, γ ≈ 0.343', () => {
    const e = find('2024-04-08', 'solar');
    expect(Math.abs(e.ms - Date.parse('2024-04-08T18:17Z')) / 60000).toBeLessThan(5);
    expect(e.gamma).toBeCloseTo(0.343, 2);
  });
});

describe('how often', () => {
  const all = eclipsesBetween(Date.UTC(2001, 0, 1), Date.UTC(2101, 0, 1));
  const perYear = new Map<number, { s: number; l: number }>();
  for (const e of all) {
    const y = new Date(e.ms).getUTCFullYear(), r = perYear.get(y) ?? { s: 0, l: 0 };
    if (e.kind === 'solar') r.s++; else r.l++;
    perYear.set(y, r);
  }
  it('every year has 2–5 solar eclipses and 0–5 lunar (incl. penumbral)', () => {
    for (const [y, r] of perYear) {
      expect(r.s, `${y}`).toBeGreaterThanOrEqual(2);
      expect(r.s, `${y}`).toBeLessThanOrEqual(5);
      expect(r.l, `${y}`).toBeLessThanOrEqual(5);
    }
  });
  it('the 21st century has 224 solar eclipses (NASA catalogue)', () => {
    expect(all.filter(e => e.kind === 'solar')).toHaveLength(224);
  });
  it('Saros ≈ 6585.32 days; eclipse season ≈ 173.31 days', () => {
    expect(SAROS_DAYS).toBeCloseTo(6585.32, 1);
    expect(ECLIPSE_SEASON_DAYS).toBeCloseTo(173.31, 1);
  });
  it('a Saros later there is a similar eclipse', () => {
    const e = eclipseAt(find('2024-04-08', 'solar').k + 223)!;
    expect(e).not.toBeNull();
    expect(day(e.ms)).toBe('2042-04-20');
    expect(e.type).toBe('total');
  });
});

describe('seen from Jerusalem', () => {
  it('2024-04-08 total solar: not visible (night in Israel)', () => expect(visibilityAt(find('2024-04-08', 'solar'), J).visible).toBe(false));
  it('2027-08-02 total solar: a deep partial eclipse in Jerusalem', () => {
    const v = visibilityAt(find('2027-08-02', 'solar'), J);
    expect(v.visible).toBe(true);
    expect(v.value).toBeGreaterThan(0.6);
  });
  it('2022-10-25 partial solar: visible in Jerusalem', () => expect(visibilityAt(find('2022-10-25', 'solar'), J).visible).toBe(true));
  it('2025-09-07 total lunar: visible in Jerusalem (evening)', () => expect(visibilityAt(find('2025-09-07', 'lunar'), J).visible).toBe(true));
  it('2025-03-14 total lunar: not visible in Jerusalem (daytime)', () => expect(visibilityAt(find('2025-03-14', 'lunar'), J).visible).toBe(false));
});

describe('Saros numbers (NASA)', () => {
  const solar: [string, number][] = [
    ['2023-10-14', 134], ['2024-04-08', 139], ['2024-10-02', 144], ['2025-03-29', 149], ['2025-09-21', 154],
    ['2026-02-17', 121], ['2026-08-12', 126], ['2027-08-02', 136],
  ];
  for (const [d, s] of solar) it(`solar ${d}: Saros ${s}`, () => expect(sarosOf(find(d, 'solar')).saros).toBe(s));
  const lunar: [string, number][] = [['2024-09-18', 118], ['2025-03-14', 123], ['2025-09-07', 128], ['2026-03-03', 133], ['2026-08-28', 138]];
  for (const [d, s] of lunar) it(`lunar ${d}: Saros ${s}`, () => expect(sarosOf(find(d, 'lunar')).saros).toBe(s));
  it('one Saros later: same series, next member', () => {
    const e = find('2024-04-08', 'solar'), f = eclipseAt(e.k + 223)!;
    expect(sarosOf(f).saros).toBe(139);
    expect(sarosOf(f).member).toBe(sarosOf(e).member + 1);
  });
});

describe('where on Earth', () => {
  it('2024-04-08: greatest eclipse in northern Mexico (≈ 25.3°N 104.1°W)', () => {
    const e = find('2024-04-08', 'solar'), p = shadowAxis(e.ms);
    expect(p.hit).toBe(true);
    expect(Math.abs(p.lat - 25.3)).toBeLessThan(1.5);
    expect(Math.abs(p.lon + 104.1)).toBeLessThan(1.5);
  });
  it('2027-08-02: greatest eclipse in Egypt near Luxor (≈ 25.5°N 33.2°E)', () => {
    const p = shadowAxis(find('2027-08-02', 'solar').ms);
    expect(Math.abs(p.lat - 25.5)).toBeLessThan(1.5);
    expect(Math.abs(p.lon - 33.2)).toBeLessThan(1.5);
  });
  it('2026-08-12: greatest eclipse near Iceland (≈ 65.2°N 25.2°W)', () => {
    const p = shadowAxis(find('2026-08-12', 'solar').ms);
    expect(Math.abs(p.lat - 65.2)).toBeLessThan(2);
    expect(Math.abs(p.lon + 25.2)).toBeLessThan(2);
  });
  it('a partial eclipse: the axis misses the Earth', () => expect(shadowAxis(find('2025-03-29', 'solar').ms).hit).toBe(false));
  it('2025-03-14 lunar: the moon was over the Pacific / the Americas (night side)', () => {
    const p = subLunar(find('2025-03-14', 'lunar').ms);
    expect(p.lon).toBeLessThan(-60);
    expect(p.lon).toBeGreaterThan(-140);
  });
});

describe('anchors', () => {
  it('the Saros anchors are the eclipses they name', () => {
    expect(find('2024-04-08', 'solar').k).toBe(300);
    expect(find('2025-03-14', 'lunar').k).toBe(311.5);
  });
});

describe('what an observer sees (contacts, totality)', () => {
  // NASA Five Millennium Canon: duration of totality / annularity at greatest eclipse
  const cases: [string, number, number, 'total' | 'annular', number, number][] = [
    ['2024-04-08', 25.3, -104.1, 'total', 268, 25],      // 4m28s
    ['2026-08-12', 65.2, -25.2, 'total', 138, 25],       // 2m18s
    ['2027-08-02', 25.5, 33.2, 'total', 383, 30],        // 6m23s
    ['2024-10-02', -22.0, -114.5, 'annular', 445, 40],   // 7m25s
  ];
  for (const [d, lat, lon, ph, secs, tol] of cases) {
    it(`${d}: ${ph} at greatest eclipse, lasting ≈ ${secs} s`, () => {
      const c = contacts(find(d, 'solar'), { lat, lon })!;
      expect(c).not.toBeNull();
      expect(c.central).toBe(ph);
      expect(Math.abs((c.c3! - c.c2!) / 1000 - secs)).toBeLessThan(tol);
      expect(c.c1).toBeLessThan(c.c2!);
      expect(c.c4).toBeGreaterThan(c.c3!);
      expect(c.c4 - c.c1).toBeGreaterThan(2 * 3600000);   // the partial phases take over two hours
    });
  }
  it('during totality the Sun is fully hidden; at mid-annularity a ring remains', () => {
    const t = contacts(find('2027-08-02', 'solar'), { lat: 25.5, lon: 33.2 })!;
    const v = observerView(t.max, { lat: 25.5, lon: 33.2 });
    expect(v.phase).toBe('total');
    expect(v.obsc).toBe(1);
    expect(v.sunAlt).toBeGreaterThan(70);                // near noon, high in the sky
    const a = contacts(find('2024-10-02', 'solar'), { lat: -22.0, lon: -114.5 })!;
    const w = observerView(a.max, { lat: -22.0, lon: -114.5 });
    expect(w.phase).toBe('annular');
    expect(w.obsc).toBeGreaterThan(0.8);
    expect(w.obsc).toBeLessThan(1);
  });
  it('Jerusalem, 2027-08-02: a deep partial eclipse, no totality', () => {
    const c = contacts(find('2027-08-02', 'solar'), J)!;
    expect(c.central).toBeUndefined();
    const v = observerView(c.max, J);
    expect(v.phase).toBe('partial');
    expect(v.mag).toBeGreaterThan(0.6);
    expect(v.mag).toBeLessThan(1);
  });
  it('an eclipse not seen from a place has no contacts there', () => {
    expect(contacts(find('2024-04-08', 'solar'), J)).toBeNull();   // North America only
  });
});
