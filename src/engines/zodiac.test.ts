import { describe, expect, it } from 'vitest';
import { precessionLon, raDecToEcl, zodiacFigures, zodiacSpans } from './zodiac';

describe('zodiac', () => {
  it('precession: 50.3″ a year; about 11½° back to the Rambam (1178)', () => {
    expect(precessionLon(2100)).toBeCloseTo(1.397, 2);
    expect(precessionLon(1178)).toBeCloseTo(-11.48, 1);
  });
  it('ecliptic: Regulus near λ 150°, β 0.5°', () => {
    const [l, b] = raDecToEcl(152.09, 11.97);
    expect(l).toBeCloseTo(149.83, 0); expect(b).toBeCloseTo(0.46, 0);
  });
  it('IAU boundaries along the ecliptic (J2000), within a degree', () => {
    const want: Record<string, [number, number]> = {
      Ari: [28.7, 53.4], Tau: [53.4, 90.1], Gem: [90.1, 118.0], Cnc: [118.0, 138.0], Leo: [138.0, 174.0], Vir: [174.0, 218.0],
      Lib: [218.0, 241.0], Sco: [241.0, 248.0], Sgr: [266.3, 299.7], Cap: [299.7, 327.6], Aqr: [327.6, 351.6], Psc: [351.6, 28.7],
    };
    const s = zodiacSpans(2000);
    expect(s).toHaveLength(12);
    for (const { id, from, to } of s) {
      const d = (a: number, b: number) => Math.abs(((a - b + 540) % 360) - 180);
      expect(d(from, want[id][0])).toBeLessThan(1);
      expect(d(to, want[id][1])).toBeLessThan(1);
    }
  });
  it('figures move with precession', () => {
    const a = zodiacFigures(2000)[0].lines[0][0], b = zodiacFigures(1178)[0].lines[0][0];
    expect(((a[0] - b[0] + 360) % 360)).toBeCloseTo(11.48, 1);
  });
});
