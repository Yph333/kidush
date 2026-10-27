import { describe, expect, it } from 'vitest';
import IL from '../assets/terrain/israel.json';
import RG from '../assets/terrain/region.json';
import { decodeTerrain, elevationAt } from './terrain';

describe('bundled elevation', () => {
  it('Israel: Jerusalem ~750 m, the Dead Sea ~−420 m, Hermon ~2,700 m, the sea below zero', () => {
    const g = decodeTerrain(IL);
    expect(elevationAt(g, 35.23, 31.78)).toBeGreaterThan(650); expect(elevationAt(g, 35.23, 31.78)).toBeLessThan(850);
    expect(elevationAt(g, 35.5, 31.5)).toBeLessThan(-380);
    expect(elevationAt(g, 35.857, 33.416)).toBeGreaterThan(2400);
    expect(elevationAt(g, 34.3, 32.5)).toBeLessThan(0);
  });
  it('region: the Nile delta low, the Zagros high', () => {
    const g = decodeTerrain(RG);
    expect(elevationAt(g, 31.2, 30.5)).toBeLessThan(60);
    expect(elevationAt(g, 46.5, 34.5)).toBeGreaterThan(800);
  });
});
