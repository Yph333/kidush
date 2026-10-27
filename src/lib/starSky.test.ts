import { describe, expect, it } from 'vitest';
import { CITIES } from '../engines/astro';
import { limitingMag, starColor, visibleStars } from './starSky';

const J = CITIES[0];

describe('limiting magnitude by twilight', () => {
  it('daylight and early civil twilight: no stars', () => {
    expect(visibleStars(Date.UTC(2026, 0, 1, 10), J, 30)).toHaveLength(0);
    expect(limitingMag(-3)).toBeLessThan(-1);
  });
  it('grows as the Sun sinks, reaching ~5.5 by astronomical night', () => {
    const m = [-5, -7, -8.5, -10, -12, -15, -18, -25].map(limitingMag);
    for (let i = 1; i < m.length; i++) expect(m[i]).toBeGreaterThanOrEqual(m[i - 1]);
    expect(limitingMag(-8.5)).toBeCloseTo(2.2, 5);
    expect(limitingMag(-25)).toBe(5.5);
  });
});

describe('the real sky over Jerusalem', () => {
  const night = Date.UTC(2026, 0, 15, 20);   // 22:00 local, mid-January
  it('a dark sky shows many stars, a twilight sky only a few bright ones', () => {
    const dark = visibleStars(night, J, -30), dusk = visibleStars(night, J, -8.5);
    expect(dark.length).toBeGreaterThan(700);
    expect(dusk.length).toBeGreaterThan(5);
    expect(dusk.length).toBeLessThan(dark.length / 5);
    expect(Math.max(...dusk.map(s => s.mag))).toBeLessThanOrEqual(2.2);
  });
  it('every star returned is above the horizon', () => {
    for (const s of visibleStars(night, J, -30)) expect(s.alt).toBeGreaterThan(0);
  });
  it('Sirius (mag −1.5) is up in the south on a January evening', () => {
    const sirius = visibleStars(night, J, -30).find(s => s.mag < -1.3)!;
    expect(sirius).toBeDefined();
    expect(sirius.az).toBeGreaterThan(150);
    expect(sirius.az).toBeLessThan(230);
  });
});

describe('star colour', () => {
  it('blue for hot stars, orange for cool ones', () => {
    expect(starColor(-0.3)).toBe('rgb(200,215,255)');
    expect(starColor(1.6)).toBe('rgb(255,200,150)');
  });
});
