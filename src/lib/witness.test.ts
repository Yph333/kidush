import { describe, expect, it } from 'vitest';
import { CITIES, sky } from '../engines/astro';
import { monthModel } from './month';
import { crescentAt } from './witness';

describe('the crescent a witness saw', () => {
  it('agrees with the sky: side by azimuth, height by altitude, width by the lit part', () => {
    for (const mi of [0, 3, 6, 9]) {
      const M = monthModel(5787, mi, CITIES[0]), t = M.first!.tb, s = sky(t, CITIES[0]), c = crescentAt(t, CITIES[0]);
      expect(c.side).toBe(s.moon.az > s.sun.az ? 'north' : 'south');
      expect(c.alt).toBeCloseTo(s.moon.alt, 6);
      expect(c.k).toBeLessThan(0.15);
    }
  });
});
