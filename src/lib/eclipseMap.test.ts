import { describe, expect, it } from 'vitest';
import { eclipsesBetween } from '../engines/eclipses';
import { centralPath, isLand, pathRegions, regionOf, regionsOf, visibilityGrid } from './eclipseMap';

const find = (iso: string, kind: 'solar' | 'lunar') => {
  const t = Date.parse(iso);
  return eclipsesBetween(t - 3 * 86400000, t + 3 * 86400000).find(x => x.kind === kind)!;
};

describe('land mask and regions', () => {
  it('about 30% of grid cells are land', () => {
    const m = isLand(), share = m.filter(Boolean).length / m.length;
    expect(share).toBeGreaterThan(0.2);
    expect(share).toBeLessThan(0.4);
  });
  it('places land in the right region', () => {
    expect(regionOf(31.8, 35.2, true)).toBe('המזרח התיכון');
    expect(regionOf(48.5, 4.3, true)).toBe('אירופה');
    expect(regionOf(40, -100, true)).toBe('צפון אמריקה');
    expect(regionOf(0, -30, false)).toBe('האוקיינוס האטלנטי');
  });
});

describe('where eclipses are seen', () => {
  it('2027-08-02 total: the path crosses North Africa and the Middle East; partial over Europe too', () => {
    const e = find('2027-08-02', 'solar');
    const path = pathRegions(centralPath(e));
    expect(path).toContain('צפון אפריקה');
    expect(path).toContain('המזרח התיכון');
    const r = regionsOf(visibilityGrid(e));
    expect(r.land).toContain('אירופה');
  });
  it('2024-04-08 total: North America, not the Middle East', () => {
    const e = find('2024-04-08', 'solar');
    expect(pathRegions(centralPath(e)).some(x => x === 'צפון אמריקה' || x === 'מרכז אמריקה והקריביים')).toBe(true);
    const r = regionsOf(visibilityGrid(e));
    expect(r.land).toContain('צפון אמריקה');
    expect(r.land).not.toContain('המזרח התיכון');
  });
  it('2025-03-14 lunar: the Americas, not the Middle East', () => {
    const r = regionsOf(visibilityGrid(find('2025-03-14', 'lunar')));
    expect(r.land).toContain('צפון אמריקה');
    expect(r.land).toContain('דרום אמריקה');
    expect(r.land).not.toContain('המזרח התיכון');
  });
  it('2025-09-07 lunar: the Middle East, Asia and Australia', () => {
    const r = regionsOf(visibilityGrid(find('2025-09-07', 'lunar')));
    expect(r.land).toContain('המזרח התיכון');
    expect(r.land).toContain('הודו ומרכז אסיה');
    expect(r.land).toContain('אוסטרליה וניו זילנד');
  });
  it('a partial solar eclipse has no central path', () => expect(centralPath(find('2025-03-29', 'solar'))).toEqual([]));
});
