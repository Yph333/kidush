// The real night sky over a place: which naked-eye stars are above the horizon at a moment, and which of them
// can be seen given how dark the sky is (the Sun's depression). Display only — not a ruling on tzeit hakochavim.
// Star data: HYG 4.1 subset (src/assets/space/stars.json, CC BY-SA 4.0), J2000 coordinates (precession over a
// few centuries moves stars by well under a degree on these pictures; ignored).

import { type Place, TofMs, altAz } from '../engines/astro';
import CAT from '../assets/space/stars.json';

/** [ra°, dec°, magnitude, B−V colour index] */
type Row = [number, number, number, number];
const STARS = CAT.stars as Row[];

/**
 * Faintest star visible to the naked eye against the twilight sky, by the Sun's altitude (degrees).
 * A smooth approximation of the usual description: the brightest stars appear around the end of civil twilight,
 * second-magnitude stars at ~8°, the full sky by astronomical night. Approximate on purpose.
 */
export function limitingMag(sunAlt: number): number {
  const K: [number, number][] = [[-4, -1.5], [-6, 0.6], [-8.5, 2.2], [-12, 4], [-18, 5.5]];
  if (sunAlt >= K[0][0]) return K[0][1];
  if (sunAlt <= K[K.length - 1][0]) return K[K.length - 1][1];
  for (let i = 0; i < K.length - 1; i++) {
    const [a, ma] = K[i], [b, mb] = K[i + 1];
    if (sunAlt <= a && sunAlt >= b) return ma + ((a - sunAlt) / (a - b)) * (mb - ma);
  }
  return K[K.length - 1][1];
}

export interface SeenStar { alt: number; az: number; mag: number; bv: number; /** 0..1, how plainly it shows */ vis: number }

/** Stars above the horizon at `ms` over `c` that are visible when the Sun is at `sunAlt`. */
export function visibleStars(ms: number, c: Place, sunAlt: number): SeenStar[] {
  const lim = limitingMag(sunAlt);
  if (lim < -1) return [];
  const { jd } = TofMs(ms);
  const out: SeenStar[] = [];
  for (const [ra, dec, mag, bv] of STARS) {
    if (mag > lim) continue;
    const h = altAz(ra, dec, c.lat, c.lon, jd);
    if (h.alt <= 0) continue;
    out.push({ alt: h.alt, az: h.az, mag, bv, vis: Math.min(1, (lim - mag) / 1.2 + 0.15) });
  }
  return out;
}

/** Star colour from its B−V index: hot stars bluish white, cool stars orange. */
export function starColor(bv: number): string {
  const t = Math.max(0, Math.min(1, (bv + 0.3) / 1.9));
  const lerp = (a: number, b: number) => Math.round(a + (b - a) * t);
  return `rgb(${lerp(200, 255)},${lerp(215, 200)},${lerp(255, 150)})`;
}
