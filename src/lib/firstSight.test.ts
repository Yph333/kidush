import { describe, expect, it } from 'vitest';
import { limitsVerdict, rambam, rambamD0 } from '../engines/rambam';
import { firstSightings } from './firstSight';

describe('ch. 17: limits and the first sighting of each month', () => {
  it('limitsVerdict is the rule inside rambam()', () => {
    for (let d = rambamD0() + 1; d < rambamD0() + 2000; d += 3) {
      const R = rambam(d);
      if (R.pre !== 'calc') continue;
      expect(limitsVerdict(R.arc / 60, R.long1 / 60).visible).toBe(R.visible);
    }
    expect(limitsVerdict(11 + 11 / 60, 11 + 27 / 60).visible).toBe(true);   // 17:22
  });
  it('5787: both find a first evening for nearly every month, mostly the same evening or a day apart', () => {
    const rows = firstSightings(5787);
    const both = rows.filter(r => r.rambam !== null && r.modern !== null);
    expect(both.length).toBeGreaterThanOrEqual(11);
    for (const r of both) expect(Math.abs(r.rambam! - r.modern!)).toBeLessThanOrEqual(2);
  });
});
