// The Rambam's sighting calculation laid on the real evening sky: his sun and moon (ch. 12–16) placed in the sky of
// Jerusalem at the time of sighting, and the pieces each step of ch. 17 and 19 talks about, as paths in the sky.
// Pure: built from engine calls only. The 3D scene draws what this returns.

import { type Place, eclToHorizon, eqToHorizon, sunsetOn, toEq, TofMs } from '../engines/astro';
import { gDate } from '../engines/calendar';
import { type RambamResult, moonFromEquator, rambam } from '../engines/rambam';

export interface AltAz { alt: number; az: number }

export interface SightSky {
  R: RambamResult;
  /** the moment: sunset of that evening + 20 minutes ("שעת הראייה", 14:6) */
  t: number;
  sun: AltAz;
  moon: AltAz;
  /** the moon's ecliptic place (degrees, latitude signed north +) */
  lam: number; beta: number;
  ecliptic: (AltAz & { lon: number })[];
  equator: AltAz[];
  /** the first longitude: along the ecliptic from the sun to the moon */
  long1: AltAz[];
  /** parallax, enlarged K times so it can be seen: where the moon is seen */
  K: number;
  seen: AltAz;
  /** the moon's foot on the ecliptic (same longitude), and the ecliptic point at the moon's altitude */
  foot: AltAz; level: AltAz; footToLevel: AltAz[]; latLine: AltAz[];
  /** hour circles from the sun and the moon down to the equator, and the equator between them */
  hourSun: AltAz[]; hourMoon: AltAz[]; eqArc: AltAz[];
  /** straight down from the moon to the horizon */
  drop: AltAz[];
  /** ch. 19: distance from the equator (minutes, north +) and the side it leans to */
  fromEq: ReturnType<typeof moonFromEquator>;
}

const range = (a: number, b: number, n: number) => Array.from({ length: n + 1 }, (_, k) => a + ((b - a) * k) / n);

export function sightSky(dayIdx: number, c: Place): SightSky {
  const R = rambam(dayIdx);
  const g = gDate(dayIdx - 1);                       // the evening that begins day `dayIdx` is the civil day before
  const ss = sunsetOn(g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), c) ?? g.getTime() + 16 * 3600000;
  const t = ss + 20 * 60000;
  const at = (l: number, b = 0) => eclToHorizon(l, b, t, c);
  const sLam = R.sunTrue / 60, lam = R.moonTrue / 60, beta = (R.north ? 1 : -1) * R.lat1 / 60;
  const sun = at(sLam), moon = at(lam, beta);
  const ecliptic = range(0, 360, 180).map(l => ({ ...at(l), lon: l % 360 }));
  const equator = range(0, 360, 180).map(ra => eqToHorizon(ra, 0, t, c));
  const d1 = ((lam - sLam + 540) % 360) - 180;
  const long1 = range(0, d1, 40).map(x => at(sLam + x));
  const K = 4;
  const seen = at(lam - (K * R.plon) / 60, beta - (K * R.plat) / 60);
  const foot = at(lam);
  // along the ecliptic, the point as high as the moon (searched within 25° either side)
  let best = lam, err = Infinity;
  for (let x = -25; x <= 25; x += 0.05) { const e = Math.abs(at(lam + x).alt - moon.alt); if (e < err) { err = e; best = lam + x; } }
  const level = at(best), footToLevel = range(lam, best, 30).map(l => at(l)), latLine = range(0, beta, 20).map(b => at(lam, b));
  const eps = 23.439291 - 0.0130042 * TofMs(t).T, qs = toEq(sLam, 0, eps), qm = toEq(lam, beta, eps);
  const hourSun = range(qs.dec, 0, 20).map(d => eqToHorizon(qs.ra, d, t, c)), hourMoon = range(qm.dec, 0, 20).map(d => eqToHorizon(qm.ra, d, t, c));
  const dra = ((qm.ra - qs.ra + 540) % 360) - 180, eqArc = range(0, dra, 30).map(x => eqToHorizon(qs.ra + x, 0, t, c));
  const drop = range(moon.alt, 0, 10).map(a => ({ alt: a, az: moon.az }));
  return { R, t, sun, moon, lam, beta, ecliptic, equator, long1, K, seen, foot, level, footToLevel, latLine, hourSun, hourMoon, eqArc, drop, fromEq: moonFromEquator(R.moonTrue, R.lat1, R.north) };
}
