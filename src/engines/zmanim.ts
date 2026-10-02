// Zmanim engine. Pure functions; no rulings — it computes whatever definition it is given.
// Sun position: NOAA solar calculator (Meeus, "Astronomical Algorithms", ch. 25 & 28), the same model
// KosherJava uses by default, so identical definitions agree to well under a minute.
//
// Steps (as taught in chapter 2):
//  1. Julian day → declination δ and equation of time
//  2. hour angle for the wanted altitude h₀:  cos H = (sin h₀ − sin φ·sin δ) / (cos φ·cos δ)
//  3. UTC = solar noon ∓ H (4 minutes per degree), then local time (Israel time zone, DST)
//  4. fixed-minute opinions: plain offsets;  5. temporal hours: the chosen day ÷ 12

import { ilOffset } from './astro';

const D2R = Math.PI / 180, R2D = 180 / Math.PI;
const sn = (a: number) => Math.sin(a * D2R), cs = (a: number) => Math.cos(a * D2R);
const MIN = 60000, DAYMS = 86400000;

export interface ZPlace {
  lat: number;
  /** east positive */
  lon: number;
  /** metres above sea level (for the elevation-adjusted horizon) */
  elevation?: number;
  /** optional horizon profile: apparent altitude (deg) of the skyline by azimuth (deg) */
  horizon?: HorizonPoint[];
}

export interface HorizonPoint { az: number; alt: number }

// ---- 1. sun position

export const julianDay = (ms: number): number => ms / DAYMS + 2440587.5;

export interface SunPos {
  jd: number;
  /** Julian centuries from J2000 */
  T: number;
  /** declination, degrees */
  decl: number;
  /** equation of time, minutes (apparent − mean solar time) */
  eot: number;
}

export function sunPosition(ms: number): SunPos {
  const jd = julianDay(ms), T = (jd - 2451545) / 36525;
  const L0 = (((280.46646 + T * (36000.76983 + T * 0.0003032)) % 360) + 360) % 360;
  const M = 357.52911 + T * (35999.05029 - 0.0001537 * T);
  const e = 0.016708634 - T * (0.000042037 + 0.0000001267 * T);
  const C = sn(M) * (1.914602 - T * (0.004817 + 0.000014 * T)) + sn(2 * M) * (0.019993 - 0.000101 * T) + sn(3 * M) * 0.000289;
  const omega = 125.04 - 1934.136 * T;
  const lambda = L0 + C - 0.00569 - 0.00478 * sn(omega);
  const eps0 = 23 + (26 + (21.448 - T * (46.815 + T * (0.00059 - T * 0.001813))) / 60) / 60;
  const eps = eps0 + 0.00256 * cs(omega);
  const decl = Math.asin(sn(eps) * sn(lambda)) * R2D;
  const y = Math.tan((eps / 2) * D2R) ** 2;
  const eot = 4 * R2D * (y * sn(2 * L0) - 2 * e * sn(M) + 4 * e * y * sn(M) * cs(2 * L0) - 0.5 * y * y * sn(4 * L0) - 1.25 * e * e * sn(2 * M));
  return { jd, T, decl, eot };
}

// ---- 2. hour angle

/** Hour angle (deg) at which the sun's centre reaches altitude h0; null if it never does that day. */
export function hourAngle(lat: number, decl: number, h0: number): { cosH: number; H: number | null } {
  const cosH = (sn(h0) - sn(lat) * sn(decl)) / (cs(lat) * cs(decl));
  return { cosH, H: cosH < -1 || cosH > 1 ? null : Math.acos(cosH) * R2D };
}

// ---- 3. times

/** Midnight UTC of a civil date. */
const utcDay = (y: number, m: number, d: number) => Date.UTC(y, m, d);

/** Solar noon (true transit), refined once with the equation of time at noon. */
export function solarNoon(y: number, m: number, d: number, p: ZPlace): number {
  let t = utcDay(y, m, d) + (720 - 4 * p.lon) * MIN;
  for (let i = 0; i < 2; i++) t = utcDay(y, m, d) + (720 - 4 * p.lon - sunPosition(t).eot) * MIN;
  return t;
}

export interface EventSteps {
  /** values at the final iteration */
  pos: SunPos;
  h0: number;
  cosH: number;
  H: number | null;
  noon: number;
}

/** Time the sun's centre crosses altitude h0 (deg) rising (morning) or setting (evening), iterated to the event time. */
export function sunAt(y: number, m: number, d: number, p: ZPlace, h0: number, rising: boolean): { ms: number | null; steps: EventSteps } {
  const base = utcDay(y, m, d);
  let t = base + (720 - 4 * p.lon) * MIN;
  let steps: EventSteps | null = null;
  for (let i = 0; i < 4; i++) {
    const pos = sunPosition(t);
    const noon = base + (720 - 4 * p.lon - pos.eot) * MIN;
    const { cosH, H } = hourAngle(p.lat, pos.decl, h0);
    steps = { pos, h0, cosH, H, noon };
    if (H === null) return { ms: null, steps };
    t = noon + (rising ? -1 : 1) * 4 * H * MIN;
  }
  return { ms: t, steps: steps! };
}

/** Sun altitude (deg, geometric, centre) and azimuth (deg from north) at an instant. */
export function sunAltAz(ms: number, p: ZPlace): { alt: number; az: number } {
  const pos = sunPosition(ms);
  const d = new Date(ms);
  const utcMin = d.getUTCHours() * 60 + d.getUTCMinutes() + d.getUTCSeconds() / 60 + d.getUTCMilliseconds() / 60000;
  const tst = utcMin + pos.eot + 4 * p.lon;          // true solar time, minutes
  const H = tst / 4 - 180;                            // hour angle, degrees
  const alt = Math.asin(sn(p.lat) * sn(pos.decl) + cs(p.lat) * cs(pos.decl) * cs(H)) * R2D;
  const az = (Math.atan2(sn(H), cs(H) * sn(p.lat) - Math.tan(pos.decl * D2R) * cs(p.lat)) * R2D + 180 + 360) % 360;
  return { alt, az };
}

// ---- horizon: elevation and skyline

/** Standard sunrise/sunset altitude of the sun's centre: 34′ refraction + 16′ semidiameter. */
export const H0_STANDARD = -(34 + 16) / 60;

/** Dip of the sea-level horizon seen from height h metres: ≈ 1.76′·√h, in degrees. */
export const dip = (h: number): number => (1.76 * Math.sqrt(Math.max(0, h))) / 60;

/** Refraction (deg) for an apparent altitude a (deg) — Bennett (Meeus 16.4). */
export function refraction(a: number): number {
  return 1 / Math.tan((a + 7.31 / (a + 4.4)) * D2R) / 60;
}

/** Profile points further apart than this are not joined: the directions between them are open horizon. */
export const MAX_GAP = 45;

/**
 * Skyline altitude (deg) at azimuth az, linearly interpolated between neighbouring profile points that are
 * at most MAX_GAP apart (a single point covers ±MAX_GAP/2). null = no skyline given there (open horizon).
 */
export function horizonAlt(profile: HorizonPoint[] | undefined, az: number): number | null {
  if (!profile?.length) return null;
  const pts = [...profile].sort((a, b) => a.az - b.az);
  const dist = (x: number, y: number) => Math.abs(((x - y + 540) % 360) - 180);
  if (pts.length === 1) return dist(az, pts[0].az) <= MAX_GAP / 2 ? pts[0].alt : null;
  for (let i = 0; i < pts.length; i++) {
    const a = pts[i], b = pts[(i + 1) % pts.length];
    const span = ((b.az - a.az + 360) % 360) || 360, off = ((az - a.az + 360) % 360);
    if (off <= span) return span <= MAX_GAP ? a.alt + (b.alt - a.alt) * (off / span) : null;
  }
  return null;
}

/**
 * Visible sunrise / sunset: the sun's upper limb on the skyline.
 * With a profile, h₀ = a − R(a) − 16′ at the sun's azimuth (iterated, since the azimuth depends on the time).
 * Without one, the sea-level horizon lowered by the dip for the place's elevation.
 */
export function visibleSun(y: number, m: number, d: number, p: ZPlace, rising: boolean): { ms: number | null; h0: number; skyline: number } {
  if (!p.horizon?.length) {
    const h0 = H0_STANDARD - dip(p.elevation ?? 0);
    return { ms: sunAt(y, m, d, p, h0, rising).ms, h0, skyline: -dip(p.elevation ?? 0) };
  }
  // A skyline below the sea horizon cannot hide the sun: the effective skyline is max(a, −dip).
  // At or below 0° keep the standard 34′ refraction (so an open horizon equals the elevation-adjusted time);
  // above it, use Bennett's refraction for that altitude.
  const sea = -dip(p.elevation ?? 0);
  const h0For = (a: number) => (a <= 0 ? H0_STANDARD + a : a - refraction(a) - 16 / 60);
  let h0 = h0For(sea), a = sea, ms: number | null = null;
  for (let i = 0; i < 4; i++) {
    ms = sunAt(y, m, d, p, h0, rising).ms;
    if (ms === null) break;
    a = Math.max(sea, horizonAlt(p.horizon, sunAltAz(ms, p).az) ?? sea);
    h0 = h0For(a);
  }
  return { ms, h0, skyline: a };
}

// ---- zman definitions

/** A zman, defined as data (see content/zmanimOpinions.ts for names and sources). */
export type ZmanDef =
  | { kind: 'sun'; event: 'rise' | 'set'; horizon: 'mishor' | 'elevation' | 'visible' }
  | { kind: 'degrees'; event: 'rise' | 'set'; deg: number }
  | { kind: 'offset'; from: ZmanDef; minutes: number }
  | { kind: 'noon' }
  | { kind: 'hours'; start: ZmanDef; end: ZmanDef; hours: number };

export interface DayCtx { y: number; m: number; d: number; p: ZPlace }

/** UTC ms of a zman, or null when the sun never reaches the needed depression (e.g. far north in summer). */
export function zman(def: ZmanDef, c: DayCtx): number | null {
  const { y, m, d, p } = c;
  switch (def.kind) {
    case 'sun':
      if (def.horizon === 'visible') return visibleSun(y, m, d, p, def.event === 'rise').ms;
      return sunAt(y, m, d, p, H0_STANDARD - (def.horizon === 'elevation' ? dip(p.elevation ?? 0) : 0), def.event === 'rise').ms;
    case 'degrees':
      return sunAt(y, m, d, p, -def.deg, def.event === 'rise').ms;
    case 'offset': {
      const t = zman(def.from, c);
      return t === null ? null : t + def.minutes * MIN;
    }
    case 'noon':
      return solarNoon(y, m, d, p);
    case 'hours': {
      const a = zman(def.start, c), b = zman(def.end, c);
      return a === null || b === null ? null : a + (b - a) / 12 * def.hours;
    }
  }
}

/** Length of one temporal hour (ms) for a day running from `start` to `end`. */
export function shaahZmanit(start: ZmanDef, end: ZmanDef, c: DayCtx): number | null {
  const a = zman(start, c), b = zman(end, c);
  return a === null || b === null ? null : (b - a) / 12;
}

// ---- local time

/** Israel local "HH:MM" (rounded to the nearest minute, as luchot print). */
export function localHM(ms: number, roundSeconds = true): string {
  const t = roundSeconds ? Math.round(ms / MIN) * MIN : Math.floor(ms / MIN) * MIN;
  const d = new Date(t + ilOffset(t) * 3600000);
  return `${String(d.getUTCHours()).padStart(2, '0')}:${String(d.getUTCMinutes()).padStart(2, '0')}`;
}

/** Israel local "HH:MM:SS". */
export function localHMS(ms: number): string {
  const t = Math.round(ms / 1000) * 1000, d = new Date(t + ilOffset(t) * 3600000);
  return [d.getUTCHours(), d.getUTCMinutes(), d.getUTCSeconds()].map(v => String(v).padStart(2, '0')).join(':');
}

export { ilOffset };
