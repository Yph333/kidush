// Modern astronomy engine — ported 1:1 from legacy/astro.js (Meeus, low precision).
// Pure functions. Times are epoch milliseconds (UTC). Israel civil time via ilOffset().
// Independent of the Rambam engine; links to the fixed calendar only for molad → instant.

import { P_DAY, P_HOUR, gDate, moladTotal, monthsOf, rh } from './calendar';

export const D2R = Math.PI / 180;
export const R2D = 180 / Math.PI;
export const nrm = (a: number): number => ((a % 360) + 360) % 360;
export const w180 = (a: number): number => { a = nrm(a); return a > 180 ? a - 360 : a; };
const sn = (a: number): number => Math.sin(a * D2R);
const cs = (a: number): number => Math.cos(a * D2R);
export const HOUR = 3600000;
export const DAYMS = 86400000;

export interface Place { lat: number; lon: number; name?: string }

export function deltaT(y: number): number {
  if (y >= 2005 && y <= 2150) { const t = y - 2000; return 62.92 + 0.32217 * t + 0.005589 * t * t; }
  const tb: [number, number][] = [[1900, -2.8], [1920, 21.2], [1940, 24.3], [1960, 33.2], [1980, 50.5], [2000, 63.8], [2005, 64.7]];
  if (y >= 1900 && y < 2005) {
    for (let i = 0; i < tb.length - 1; i++) {
      if (y <= tb[i + 1][0]) { const [a, b] = tb[i], [c, d] = tb[i + 1]; return b + (d - b) * (y - a) / (c - a); }
    }
  }
  const u = (y - 1820) / 100;
  return -20 + 32 * u * u;
}

// Meeus ch. 47 periodic terms: [D, M, M', F, Σl, Σr] and [D, M, M', F, Σb]
const ML: readonly (readonly number[])[] = [[0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],[2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
const MB: readonly (readonly number[])[] = [[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],[0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833]];

export function sunEcl(T: number): { lam: number; R: number } {
  const L0 = 280.46646 + 36000.76983 * T, M = 357.52911 + 35999.05029 * T, e = 0.016708634 - 0.000042037 * T;
  const C = (1.914602 - 0.004817 * T) * sn(M) + (0.019993 - 0.000101 * T) * sn(2 * M) + 0.000289 * sn(3 * M);
  const v = M + C, O = 125.04 - 1934.136 * T;
  return { lam: nrm(L0 + C - 0.00569 - 0.00478 * sn(O)), R: 1.000001018 * (1 - e * e) / (1 + e * cs(v)) };
}

export function moonEcl(T: number): { lam: number; beta: number; dist: number } {
  const T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const Lp = 218.3164477 + 481267.88123421 * T - 0.0015786 * T2 + T3 / 538841 - T4 / 65194000;
  const D = 297.8501921 + 445267.1114034 * T - 0.0018819 * T2 + T3 / 545868 - T4 / 113065000;
  const M = 357.5291092 + 35999.0502909 * T - 0.0001536 * T2 + T3 / 24490000;
  const Mp = 134.9633964 + 477198.8675055 * T + 0.0087414 * T2 + T3 / 69699 - T4 / 14712000;
  const F = 93.2720950 + 483202.0175233 * T - 0.0036539 * T2 - T3 / 3526000 + T4 / 863310000;
  const E = 1 - 0.002516 * T - 0.0000074 * T2, A1 = 119.75 + 131.849 * T, A2 = 53.09 + 479264.290 * T, A3 = 313.45 + 481266.484 * T;
  let l = 0, r = 0, b = 0;
  for (const [d, m, mp, f, cl, cr] of ML) {
    const a = d * D + m * M + mp * Mp + f * F, e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    l += cl * e * sn(a); r += cr * e * cs(a);
  }
  for (const [d, m, mp, f, cb] of MB) {
    const a = d * D + m * M + mp * Mp + f * F, e = Math.abs(m) === 1 ? E : Math.abs(m) === 2 ? E * E : 1;
    b += cb * e * sn(a);
  }
  l += 3958 * sn(A1) + 1962 * sn(Lp - F) + 318 * sn(A2);
  b += -2235 * sn(Lp) + 382 * sn(A3) + 175 * sn(A1 - F) + 175 * sn(A1 + F) + 127 * sn(Lp - Mp) - 115 * sn(Lp + Mp);
  const O = 125.04452 - 1934.136261 * T;
  const dpsi = (-17.2 * sn(O) - 1.32 * sn(2 * (280.4665 + 36000.7698 * T)) - 0.23 * sn(2 * Lp)) / 3600;
  return { lam: nrm(Lp + l / 1e6 + dpsi), beta: b / 1e6, dist: 385000.56 + r / 1000 };
}

export function toEq(lam: number, beta: number, eps: number): { ra: number; dec: number } {
  const a = Math.atan2(sn(lam) * cs(eps) - Math.tan(beta * D2R) * sn(eps), cs(lam)) * R2D;
  const d = Math.asin(sn(beta) * cs(eps) + cs(beta) * sn(eps) * sn(lam)) * R2D;
  return { ra: nrm(a), dec: d };
}

export function altAz(ra: number, dec: number, lat: number, lon: number, jd: number) {
  const T = (jd - 2451545) / 36525;
  const g = nrm(280.46061837 + 360.98564736629 * (jd - 2451545) + 0.000387933 * T * T);
  const H = nrm(g + lon - ra);
  const alt = Math.asin(sn(lat) * sn(dec) + cs(lat) * cs(dec) * cs(H)) * R2D;
  const az = nrm(Math.atan2(sn(H), cs(H) * sn(lat) - Math.tan(dec * D2R) * cs(lat)) * R2D + 180);
  const q = Math.atan2(sn(H), Math.tan(lat * D2R) * cs(dec) - sn(dec) * cs(H)) * R2D;
  return { alt, az, H, q };
}

/**
 * Where a point given in ecliptic coordinates (of date) stands in the sky of a place at a moment: altitude and
 * azimuth (geocentric, no refraction). Used to place the Rambam's computed sun and moon in the real evening sky.
 */
export function eclToHorizon(lam: number, beta: number, ms: number, c: Place): { alt: number; az: number } {
  const { jd, T } = TofMs(ms), q = toEq(lam, beta, 23.439291 - 0.0130042 * T), h = altAz(q.ra, q.dec, c.lat, c.lon, jd);
  return { alt: h.alt, az: h.az };
}

/** The same for equatorial coordinates of date (right ascension, declination). */
export function eqToHorizon(ra: number, dec: number, ms: number, c: Place): { alt: number; az: number } {
  const h = altAz(ra, dec, c.lat, c.lon, TofMs(ms).jd);
  return { alt: h.alt, az: h.az };
}

export function refr(h: number): number {
  return h < -1.5 ? 0 : 1.02 / Math.tan((h + 10.3 / (h + 5.11)) * D2R) / 60;
}

const _yr = (ms: number): number => new Date(ms).getUTCFullYear();

/** Julian day (UT) and Julian centuries (TT). */
export function TofMs(ms: number): { jd: number; T: number } {
  const jd = ms / DAYMS + 2440587.5;
  return { jd, T: (jd + deltaT(_yr(ms)) / 86400 - 2451545) / 36525 };
}

export function sunOnly(ms: number, c: Place): number {
  const { jd, T } = TofMs(ms), s = sunEcl(T), eps = 23.439291 - 0.0130042 * T, q = toEq(s.lam, 0, eps);
  return altAz(q.ra, q.dec, c.lat, c.lon, jd).alt;
}

export function moonTopoAlt(ms: number, c: Place): number {
  const { jd, T } = TofMs(ms), m = moonEcl(T), eps = 23.439291 - 0.0130042 * T, q = toEq(m.lam, m.beta, eps);
  const h = altAz(q.ra, q.dec, c.lat, c.lon, jd).alt, par = Math.asin(6378.14 / m.dist) * R2D;
  return h - Math.asin(sn(par) * cs(h)) * R2D;
}

export interface Sky {
  sunLam: number; moonLam: number; moonBeta: number; dist: number; par: number; SD: number;
  sun: { alt: number; az: number };
  moon: { alt: number; az: number; q: number };
  /** sun–moon elongation (deg) */
  elong: number;
  /** moon − sun ecliptic longitude, 0..360 */
  dlam: number;
  /** illuminated fraction */
  k: number;
  waxing: boolean;
  /** position angle of the bright limb */
  chi: number;
}

export function sky(ms: number, c: Place): Sky {
  const { jd, T } = TofMs(ms), eps = 23.439291 - 0.0130042 * T, s = sunEcl(T), m = moonEcl(T);
  const se = toEq(s.lam, 0, eps), me = toEq(m.lam, m.beta, eps);
  const sh = altAz(se.ra, se.dec, c.lat, c.lon, jd), mh = altAz(me.ra, me.dec, c.lat, c.lon, jd);
  const par = Math.asin(6378.14 / m.dist) * R2D, mtop = mh.alt - Math.asin(sn(par) * cs(mh.alt)) * R2D;
  const psi = Math.acos(cs(m.beta) * cs(m.lam - s.lam)) * R2D, Rkm = s.R * 149597870.7;
  const i = Math.atan2(Rkm * sn(psi), m.dist - Rkm * cs(psi)) * R2D, k = (1 + cs(i)) / 2;
  const chi = nrm(Math.atan2(cs(se.dec) * sn(se.ra - me.ra), sn(se.dec) * cs(me.dec) - cs(se.dec) * sn(me.dec) * cs(se.ra - me.ra)) * R2D);
  const SD = 0.27245 * par * 60 * (1 + sn(Math.max(mtop, 0)) * sn(par));
  return {
    sunLam: s.lam, moonLam: m.lam, moonBeta: m.beta, dist: m.dist, par, SD,
    sun: { alt: sh.alt, az: sh.az }, moon: { alt: mtop, az: mh.az, q: mh.q },
    elong: psi, dlam: nrm(m.lam - s.lam), k, waxing: nrm(m.lam - s.lam) < 180, chi,
  };
}

// ---- Israel time
function lastSun(y: number, m: number): number {
  const d = new Date(Date.UTC(y, m + 1, 0));
  return d.getUTCDate() - d.getUTCDay();
}

/** Israel UTC offset in hours (current DST rules; 2 before 1948). */
export function ilOffset(ms: number): number {
  const y = new Date(ms).getUTCFullYear();
  if (y < 1948) return 2;
  const st = Date.UTC(y, 2, lastSun(y, 2) - 2, 0), en = Date.UTC(y, 9, lastSun(y, 9), -1);
  return ms >= st && ms < en ? 3 : 2;
}

export interface LocalParts { y: number; m: number; d: number; h: number; mi: number; wd: number; o: number }

export function localParts(ms: number): LocalParts {
  const o = ilOffset(ms), d = new Date(ms + o * HOUR);
  return { y: d.getUTCFullYear(), m: d.getUTCMonth(), d: d.getUTCDate(), h: d.getUTCHours(), mi: d.getUTCMinutes(), wd: d.getUTCDay(), o };
}

/** "HH:MM" in Israel time. */
export function hm(ms: number): string {
  const p = localParts(ms);
  return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`;
}

export function localMidnight(y: number, m: number, d: number): number {
  const g = Date.UTC(y, m, d, 12);
  return Date.UTC(y, m, d) - ilOffset(g) * HOUR;
}

// ---- events
/** First time f crosses `target` in direction dir (−1 falling, +1 rising) in [t0, t1]; bisection refined. */
export function crossing(f: (t: number) => number, t0: number, t1: number, step: number, target: number, dir: -1 | 1): number | null {
  let fa = f(t0) - target;
  for (let t = t0 + step; t <= t1; t += step) {
    const ft = f(t) - target;
    if ((dir < 0 && fa > 0 && ft <= 0) || (dir > 0 && fa < 0 && ft >= 0)) {
      let lo = t - step, hi = t;
      for (let i = 0; i < 22; i++) {
        const mid = (lo + hi) / 2, fm = f(mid) - target;
        if ((dir < 0 && fm > 0) || (dir > 0 && fm < 0)) lo = mid; else hi = mid;
      }
      return (lo + hi) / 2;
    }
    fa = ft;
  }
  return null;
}

export const sunsetOn = (y: number, m: number, d: number, c: Place): number | null => {
  const L = localMidnight(y, m, d);
  return crossing(t => sunOnly(t, c), L + 12 * HOUR, L + 22 * HOUR, 15 * 60000, -0.833, -1);
};
export const sunriseOn = (y: number, m: number, d: number, c: Place): number | null => {
  const L = localMidnight(y, m, d);
  return crossing(t => sunOnly(t, c), L + 2 * HOUR, L + 11 * HOUR, 15 * 60000, -0.833, 1);
};
export const moonsetNear = (t: number, c: Place): number | null =>
  crossing(t2 => moonTopoAlt(t2, c), t - 4 * HOUR, t + 9 * HOUR, 10 * 60000, -0.833, -1);
export const moonriseNear = (t: number, c: Place): number | null =>
  crossing(t2 => moonTopoAlt(t2, c), t - 9 * HOUR, t + 4 * HOUR, 10 * 60000, -0.833, 1);

/** Instant near ms when moon − sun longitude = target (0 new, 180 full). */
export function phaseNear(ms: number, target: number): number {
  let t = ms;
  for (let i = 0; i < 10; i++) {
    const { T } = TofMs(t), d = w180(moonEcl(T).lam - sunEcl(T).lam - target);
    t -= d / 12.19 * DAYMS;
    if (Math.abs(d) < 1e-5) break;
  }
  return t;
}

// ---- Odeh (2004) crescent visibility
export type OdehZone = 'A' | 'B' | 'C' | 'D';

export interface OdehResult {
  /** sunset (evening) / sunrise (morning) */
  ss: number;
  /** moonset (evening) / moonrise (morning) */
  ms2: number | null;
  lag: number | null;
  /** best time */
  tb: number;
  s: Sky;
  arcv: number;
  arcl: number;
  W: number;
  V: number;
  zone: OdehZone;
}

export function odeh(evening: boolean, y: number, m: number, d: number, c: Place): OdehResult | null {
  const ss = evening ? sunsetOn(y, m, d, c) : sunriseOn(y, m, d, c);
  if (ss == null) return null;
  const ms2 = evening ? moonsetNear(ss, c) : moonriseNear(ss, c);
  const lag = ms2 == null ? null : (evening ? ms2 - ss : ss - ms2);
  const tb = lag != null && lag > 0 ? (evening ? ss + lag * 4 / 9 : ss - lag * 4 / 9) : ss;
  const s = sky(tb, c);
  const arcv = s.moon.alt - s.sun.alt;
  const arcl = Math.acos(sn(s.sun.alt) * sn(s.moon.alt) + cs(s.sun.alt) * cs(s.moon.alt) * cs(s.moon.az - s.sun.az)) * R2D;
  const W = s.SD * (1 - cs(arcl));
  const V = arcv - (-0.1018 * W ** 3 + 0.7319 * W * W - 6.3226 * W + 7.1651);
  let zone: OdehZone;
  if (lag == null || lag <= 0) zone = 'D';
  else if (V >= 5.65) zone = 'A';
  else if (V >= 2) zone = 'B';
  else if (V >= -0.96) zone = 'C';
  else zone = 'D';
  return { ss, ms2, lag, tb, s, arcv, arcl, W, V, zone };
}

export const ZONE: Record<OdehZone, { label: string; tone: 'ok' | 'moon' | 'leap' | 'bad' }> = {
  A: { label: 'נראה בעין', tone: 'ok' },
  B: { label: 'אולי בעין, בטוח במשקפת', tone: 'moon' },
  C: { label: 'רק במשקפת', tone: 'leap' },
  D: { label: 'לא נראה', tone: 'bad' },
};

export interface City extends Place { name: string; elevation?: number }
export const CITIES: readonly City[] = [
  { name: 'ירושלים', lat: 31.778, lon: 35.235, elevation: 750 },
  { name: 'חיפה', lat: 32.794, lon: 34.990 },
  { name: 'תל אביב', lat: 32.085, lon: 34.782 },
  { name: 'צפת', lat: 32.965, lon: 35.496 },
  { name: 'באר שבע', lat: 31.252, lon: 34.791 },
  { name: 'אילת', lat: 29.558, lon: 34.952 },
];

// ---- link to the fixed calendar
/** Molad (absolute parts) → UTC instant. Molad time is Jerusalem mean local time (UTC+2:20:56). */
export function moladMs(total: number): number {
  const d = Math.floor(total / P_DAY), r = total % P_DAY;
  return gDate(d).getTime() - 6 * HOUR + r / P_HOUR * HOUR - 140.94 * 60000;
}

/** Hebrew day index for an instant at a place (day turns at sunset). */
export function dayOfMs(ms: number, c: Place): number {
  const p = localParts(ms);
  const base = Math.round((Date.UTC(p.y, p.m, p.d) - Date.UTC(2026, 8, 12)) / DAYMS) + rh(5787).day;
  const ss = sunsetOn(p.y, p.m, p.d, c);
  return ss != null && ms >= ss ? base + 1 : base;
}

/** Day index → [year, month0, day] civil. */
export function civOf(day: number): [number, number, number] {
  const g = gDate(day);
  return [g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate()];
}

/** Mean molad minus true conjunction (ms) for every month of year y. */
export function yearGaps(y: number): { name: string; gap: number }[] {
  return monthsOf(y).map((m, i) => {
    const mean = moladMs(moladTotal(y, i));
    return { name: m[0], gap: mean - phaseNear(mean, 0) };
  });
}


// ---- for the 3D scenes

/** Longitude (deg) of the moon's mean ascending node ("the head"), Meeus 47.7. Moves backwards ~19.35°/year. */
export function moonNode(ms: number): number {
  const { T } = TofMs(ms);
  return nrm(125.0445479 - 1934.1362891 * T + 0.0020754 * T * T + T ** 3 / 467441 - T ** 4 / 60616000);
}

/** Instant near `ms` when the sun's apparent longitude equals `target` (0 = March equinox, 90, 180, 270). */
export function sunLongitudeTime(ms: number, target: number): number {
  let t = ms;
  for (let i = 0; i < 12; i++) {
    const d = w180(sunEcl(TofMs(t).T).lam - target);
    t -= (d / 0.98565) * DAYMS;
    if (Math.abs(d) < 1e-6) break;
  }
  return t;
}

/** The four seasons of a Gregorian year: [March equinox, June solstice, September equinox, December solstice]. */
export function seasons(year: number): [number, number, number, number] {
  return [0, 90, 180, 270].map((lon, i) => sunLongitudeTime(Date.UTC(year, 2 + 3 * i, 21), lon)) as [number, number, number, number];
}
