import { describe, expect, it } from 'vitest';
import { luminance, skyCols, skyTone } from './skyColor';

describe('sky colour by the Sun\'s altitude', () => {
  it('is fixed above 12° and below −14°', () => {
    expect(skyCols(40)).toEqual(skyCols(12));
    expect(skyCols(-30)).toEqual(skyCols(-14));
  });
  it('darkens steadily as the Sun goes down', () => {
    const alts = [12, 6, 0, -3, -6, -9, -12, -14];
    const L = alts.map(a => luminance(skyTone(a)));
    for (let i = 1; i < L.length; i++) expect(L[i]).toBeLessThan(L[i - 1]);
  });
  it('the horizon is warm at sunset (red above blue)', () => {
    const [, h] = skyCols(-2);
    expect(parseInt(h.substr(1, 2), 16)).toBeGreaterThan(parseInt(h.substr(5, 2), 16));
  });
  it('night is nearly black', () => expect(luminance(skyTone(-20))).toBeLessThan(0.02));
});
