import { describe, expect, it } from 'vitest';
import { TofMs, sunEcl } from '../engines/astro';
import { earthBasis, geoUnder, gmst } from './earthFrame';

const dirOf = (lam: number): [number, number, number] => [Math.cos(lam * Math.PI / 180), 0, -Math.sin(lam * Math.PI / 180)];
const sunDir = (ms: number) => dirOf(sunEcl(TofMs(ms).T).lam);

describe('the Earth turned to the right moment', () => {
  it('GMST at J2000.0 noon is 280.46°', () => expect(gmst(Date.UTC(2000, 0, 1, 12))).toBeCloseTo(280.46, 1));
  it('the basis is orthonormal', () => {
    const [a, b, c] = earthBasis(Date.UTC(2026, 4, 1, 7, 30));
    const dot = (u: number[], v: number[]) => u[0] * v[0] + u[1] * v[1] + u[2] * v[2];
    for (const v of [a, b, c]) expect(dot(v, v)).toBeCloseTo(1, 9);
    expect(dot(a, b)).toBeCloseTo(0, 9);
    expect(dot(b, c)).toBeCloseTo(0, 9);
    expect(dot(a, c)).toBeCloseTo(0, 9);
  });
  it('the north pole leans 23.4° from ecliptic north', () => {
    const [, n] = earthBasis(Date.UTC(2026, 0, 1));
    expect(Math.acos(n[1]) * 180 / Math.PI).toBeCloseTo(23.44, 1);
  });
  it('June solstice, 12:00 UTC: the Sun is overhead near 23.4°N, close to Greenwich', () => {
    const t = Date.UTC(2026, 5, 21, 12), p = geoUnder(sunDir(t), t);
    expect(p.lat).toBeCloseTo(23.4, 0);
    expect(Math.abs(p.lon)).toBeLessThan(3);          // equation of time ≈ −2 min → ~0.5°
  });
  it('December solstice, 06:00 UTC: overhead near 23.4°S, around 90°E (noon in the Bay of Bengal)', () => {
    const t = Date.UTC(2026, 11, 21, 6), p = geoUnder(sunDir(t), t);
    expect(p.lat).toBeCloseTo(-23.4, 0);
    expect(Math.abs(p.lon - 90)).toBeLessThan(4);
  });
});
