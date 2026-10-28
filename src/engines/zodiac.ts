// The zodiac in the sky: the twelve 30° signs the Rambam counts from the head of Aries (the spring equinox of the
// time), and the star groups that gave them their names. The signs move with the equinox (precession), the stars
// do not; so the two drift apart: about 11½° in the Rambam's day, about 28° by now (start of Aries to Pisces).

import CAT from '../assets/space/zodiac.json';
import { eqToEcl } from './planets';

const R2D = 180 / Math.PI;
export const ZODIAC_IDS = CAT.ids as readonly string[];

/** General precession in longitude since J2000 (degrees), IAU 2006 to second order. year: Gregorian, fractional. */
export function precessionLon(year: number): number {
  const T = (year - 2000) / 100;
  return (5028.796195 * T + 1.1054348 * T * T) / 3600;
}

/** J2000 RA/Dec (degrees) → J2000 ecliptic longitude, latitude (degrees). */
export function raDecToEcl(ra: number, dec: number): [number, number] {
  const [x, y, z] = eqToEcl(ra, dec);
  return [((Math.atan2(y, x) * R2D) % 360 + 360) % 360, Math.asin(Math.max(-1, Math.min(1, z))) * R2D];
}

type Pt = [number, number];

/** Stick figures of the zodiac constellations in ecliptic coordinates of `year` (longitudes shifted by precession). */
export function zodiacFigures(year: number): { id: string; lines: Pt[][] }[] {
  const p = precessionLon(year);
  return ZODIAC_IDS.map(id => ({
    id,
    lines: (CAT.lines as Record<string, number[][][]>)[id].map(l => l.map(([a, d]) => { const [lo, la] = raDecToEcl(a, d); return [(lo + p + 360) % 360, la] as Pt; })),
  }));
}

/** J2000 ecliptic longitude, latitude → RA (0…360), Dec (degrees). */
export function eclToRaDec(lon: number, lat: number): [number, number] {
  const e = 23.4392911 / R2D, l = lon / R2D, b = lat / R2D;
  const x = Math.cos(b) * Math.cos(l), y = Math.cos(b) * Math.sin(l), z = Math.sin(b);
  const y2 = y * Math.cos(e) - z * Math.sin(e), z2 = y * Math.sin(e) + z * Math.cos(e);
  return [((Math.atan2(y2, x) * R2D) % 360 + 360) % 360, Math.asin(z2) * R2D];
}

/**
 * Point in polygon in the RA/Dec plane, where the IAU boundaries run along lines of constant RA or Dec (so straight
 * edges are exact). The ring is unwrapped into one continuous run of RA, and the probe tried at RA, RA ± 360.
 */
export function inside(ra: number, dec: number, ring: Pt[]): boolean {
  const xs: number[] = [];
  ring.forEach(([a], i) => { let x = a; if (i) { while (x - xs[i - 1] > 180) x -= 360; while (x - xs[i - 1] < -180) x += 360; } xs.push(x); });
  const test = (px: number) => {
    let c = false;
    for (let i = 0, j = ring.length - 1; i < ring.length; j = i++) {
      const yi = ring[i][1], yj = ring[j][1];
      if ((yi > dec) !== (yj > dec) && px < ((xs[j] - xs[i]) * (dec - yi)) / (yj - yi) + xs[i]) c = !c;
    }
    return c;
  };
  return [ra, ra - 360, ra + 360, ra - 720, ra + 720].some(test);
}

/**
 * Where each zodiac constellation's IAU boundary crosses the ecliptic, as [from, to] longitudes (J2000 + precession
 * to `year`). Ophiuchus is not listed: between Scorpius and Sagittarius the ecliptic runs through it.
 */
export function zodiacSpans(year: number, step = 0.1): { id: string; from: number; to: number }[] {
  const p = precessionLon(year);
  const rings = CAT.bounds as unknown as Record<string, Pt[][]>;
  const n = Math.round(360 / step), at: (string | null)[] = [];
  for (let k = 0; k < n; k++) {
    const [ra, dec] = eclToRaDec(k * step + step / 2, 0);
    at.push(ZODIAC_IDS.find(id => rings[id].some(r => inside(ra, dec, r))) ?? null);
  }
  const out: { id: string; from: number; to: number }[] = [];
  for (const id of ZODIAC_IDS) {
    const ks = at.map((v, k) => (v === id ? k : -1)).filter(k => k >= 0);
    if (!ks.length) continue;
    // the run may wrap past 0°: start where the previous slot is not this constellation
    const start = ks.find(k => at[(k - 1 + n) % n] !== id)!;
    let end = start;
    while (at[(end + 1) % n] === id) end = (end + 1) % n;
    out.push({ id, from: (start * step + p + 360) % 360, to: ((end + 1) * step + p + 360) % 360 });
  }
  return out;
}
