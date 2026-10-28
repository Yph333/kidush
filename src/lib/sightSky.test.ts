import { describe, expect, it } from 'vitest';
import { CITIES } from '../engines/astro';
import { rambamD0 } from '../engines/rambam';
import { sightSky } from './sightSky';

describe('the Rambam example in the evening sky', () => {
  it('2 Iyar 4938: the sun just below the western horizon, the moon above it in the west, the first longitude 11° 27′', () => {
    const s = sightSky(rambamD0() + 29, CITIES[0]);
    expect(s.sun.alt).toBeLessThan(0); expect(s.sun.alt).toBeGreaterThan(-8);
    expect(s.moon.alt).toBeGreaterThan(3);
    expect(s.moon.az).toBeGreaterThan(240); expect(s.moon.az).toBeLessThan(300);
    expect(s.R.long1).toBe(11 * 60 + 27);
    expect(s.fromEq.dir).toBe('north');
    // the moon leans north of west (19:13)
    expect(s.moon.az).toBeGreaterThan(270);
  });
});
