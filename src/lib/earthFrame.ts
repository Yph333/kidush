// Where the Earth's own (geographic) axes point at a given moment, in the scenes' ecliptic frame.
// The scenes use: ecliptic longitude λ → (cos λ, 0, −sin λ), ecliptic north = +y (see scenes/common dirOf).
// A globe textured with longitude 0 at its +x and the north pole at +y is turned by these three columns,
// so the sunlit hemisphere, the night side and an eclipse shadow fall on the right countries. Pure.

import { TofMs } from '../engines/astro';

type V3 = [number, number, number];

const D2R = Math.PI / 180;

/** Greenwich mean sidereal angle, degrees (Meeus 12.4, UT). */
export function gmst(ms: number): number {
  const { jd } = TofMs(ms), T = (jd - 2451545) / 36525;
  return (((280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T) % 360) + 360) % 360;
}

/** Equatorial (x to the equinox, z to the celestial pole) → scene coordinates, through the ecliptic. */
function eqToScene([x, y, z]: V3, eps: number): V3 {
  const X = x, Y = y * Math.cos(eps) + z * Math.sin(eps), Z = -y * Math.sin(eps) + z * Math.cos(eps);
  return [X, Z, -Y];
}

/**
 * The scene directions of the globe's +x (longitude 0 on the equator), +y (north pole) and +z (longitude 90° W)
 * at `ms` — use them as the columns of the globe's rotation.
 */
export function earthBasis(ms: number): [V3, V3, V3] {
  const g = gmst(ms) * D2R, T = TofMs(ms).T, eps = (23.439291 - 0.0130042 * T) * D2R;
  return [
    eqToScene([Math.cos(g), Math.sin(g), 0], eps),
    eqToScene([0, 0, 1], eps),
    eqToScene([Math.sin(g), -Math.cos(g), 0], eps),
  ];
}

/** The geographic point under a scene direction (unit vector) at `ms`: inverse of earthBasis. */
export function geoUnder(dir: V3, ms: number): { lat: number; lon: number } {
  const [bx, by, bz] = earthBasis(ms);
  const dot = (a: V3) => a[0] * dir[0] + a[1] * dir[1] + a[2] * dir[2];
  const ox = dot(bx), oy = dot(by), oz = dot(bz);   // object-space coordinates (orthonormal basis)
  return { lat: Math.asin(Math.max(-1, Math.min(1, oy))) / D2R, lon: Math.atan2(-oz, ox) / D2R };
}
