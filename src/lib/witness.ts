// What a witness should have seen on an evening (Kiddush HaChodesh 2:4): north or south of the sun, how wide, which
// way the horns, how high. From the real sky of that moment (engines/astro). Pure. For the witness game.

import { type Place, sky } from '../engines/astro';

export type Side = 'north' | 'south';
export type Width = 'thin' | 'medium' | 'thick';
export type Horns = 'up' | 'left' | 'right';
export type Height = 'low' | 'mid' | 'high';
export interface Crescent { side: Side; width: Width; horns: Horns; height: Height; k: number; alt: number; tilt: number }

/**
 * Facing west: north is to the right. The lit edge faces the sun (below the horizon); the horns point away from it.
 * `tilt`: the angle of the sun from straight below the moon (deg, + = to the right/north); the horns lean the other way.
 */
export function crescentAt(ms: number, c: Place): Crescent {
  const s = sky(ms, c);
  const dAz = ((s.sun.az - s.moon.az + 540) % 360) - 180, dAlt = s.sun.alt - s.moon.alt;
  const tilt = (Math.atan2(dAz, -dAlt) * 180) / Math.PI;
  return {
    side: s.moon.az > s.sun.az ? 'north' : 'south',
    width: s.k < 0.02 ? 'thin' : s.k < 0.06 ? 'medium' : 'thick',
    horns: Math.abs(tilt) < 15 ? 'up' : tilt > 0 ? 'left' : 'right',
    height: s.moon.alt < 5 ? 'low' : s.moon.alt < 12 ? 'mid' : 'high',
    k: s.k, alt: s.moon.alt, tilt,
  };
}
