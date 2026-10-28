import { describe, expect, it } from 'vitest';
import { CITIES, localParts, odeh, odehAt, sunsetLocal } from '../engines/astro';
import { monthModel } from './month';
import { visibilityGrid } from './visibilityMap';

describe('the crescent across the world', () => {
  it('sunsetLocal agrees with sunsetOn in Jerusalem, and odehAt with odeh', () => {
    const o = odeh(true, 2026, 9, 11, CITIES[0])!, ss = sunsetLocal(2026, 9, 11, CITIES[0])!;
    expect(Math.abs(ss - o.ss)).toBeLessThan(60000);
    expect(odehAt(true, ss, CITIES[0]).zone).toBe(o.zone);
  });
  it('18:13: on the evening it is first seen in Jerusalem, it is seen at least as well far to the west on the same latitude', () => {
    const M = monthModel(5787, 1, CITIES[0]), p = localParts(M.first!.ss);
    const g = visibilityGrid(p.y, p.m, p.d, 6), rank = { A: 3, B: 2, C: 1, D: 0 } as const;
    const near = (lat: number, lon: number) => g.reduce((a, b) => (Math.hypot(b.lat - lat, b.lon - lon) < Math.hypot(a.lat - lat, a.lon - lon) ? b : a));
    const il = near(31.8, 35.2), west = near(31.8, -100);
    expect(rank[west.zone!]).toBeGreaterThanOrEqual(rank[il.zone!]);
  });
});
