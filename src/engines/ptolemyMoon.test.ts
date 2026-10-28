import { describe, expect, it } from 'vitest';
import { crank } from './ptolemyMoon';
import { R_DBL } from './rambam';

describe('the doubled distance: the geometry behind 15:3', () => {
  it('nothing to add at conjunction; the moon at its distance on its wheel', () => {
    expect(crank(0).add).toBeCloseTo(0, 9);
    const c = crank(40), d = Math.hypot(c.M[0] - c.C[0], c.M[1] - c.C[1]);
    expect(d).toBeCloseTo(49 + 41 / 60, 9);
  });
  it('the Rambam\'s table is this angle, rounded: within a degree over 5–62 (and exact at the middle of most rows)', () => {
    for (let D = 5; D <= 62; D++) {
      const row = R_DBL.find(([a, b]) => D >= a && D <= b)!;
      expect(Math.abs(crank(D).add - row[2])).toBeLessThan(1.05);
    }
    expect(Math.round(crank(30).add)).toBe(4);
    expect(Math.round(crank(60).add)).toBe(9);
  });
});
