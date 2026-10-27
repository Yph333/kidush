// Solar and lunar eclipses — Meeus, Astronomical Algorithms (2nd ed.), ch. 54 (with the mean phases of ch. 49).
// Modern astronomy only; independent of the Rambam engine. Pure.
//
// For each new / full moon near a node: instant of greatest eclipse, γ (least distance of the shadow axis from
// the Earth's centre, in Earth radii), u (umbral cone radius), type and magnitude. Visibility from a place is
// approximated separately (see visibilityAt).

import { DAYMS, D2R, R2D, type Place, TofMs, deltaT, moonEcl, moonTopoAlt, sky, sunEcl, toEq } from './astro';

export type SolarType = 'total' | 'annular' | 'hybrid' | 'partial';
export type LunarType = 'total' | 'partial' | 'penumbral';

export interface Eclipse {
  kind: 'solar' | 'lunar';
  type: SolarType | LunarType;
  /** greatest eclipse, UTC ms */
  ms: number;
  gamma: number;
  u: number;
  /** solar: magnitude (partial eclipses); lunar: umbral magnitude */
  magnitude: number;
  /** lunar only */
  penumbralMagnitude?: number;
  /** lunar only: semi-durations, minutes */
  semi?: { penumbral: number; partial: number; total: number };
  /** lunation number k (Meeus) */
  k: number;
}

const sn = (a: number) => Math.sin(a * D2R), cs = (a: number) => Math.cos(a * D2R);
const jdToMs = (jd: number) => (jd - 2440587.5) * DAYMS;

/** The eclipse (if any) at lunation k: integer k = new moon (solar), k + 0.5 = full moon (lunar). */
export function eclipseAt(k: number): Eclipse | null {
  const T = k / 1236.85, T2 = T * T, T3 = T2 * T, T4 = T3 * T;
  const F = 160.7108 + 390.67050284 * k - 0.0016118 * T2 - 0.00000227 * T3 + 0.000000011 * T4;
  if (Math.abs(sn(F)) > 0.36) return null;
  const solar = Math.abs(k - Math.round(k)) < 1e-9;
  let jde = 2451550.09766 + 29.530588861 * k + 0.00015437 * T2 - 0.00000015 * T3 + 0.00000000073 * T4;
  const M = 2.5534 + 29.1053567 * k - 0.0000014 * T2 - 0.00000011 * T3;
  const Mp = 201.5643 + 385.81693528 * k + 0.0107582 * T2 + 0.00001238 * T3 - 0.000000058 * T4;
  const Om = 124.7746 - 1.56375588 * k + 0.0020672 * T2 + 0.00000215 * T3;
  const E = 1 - 0.002516 * T - 0.0000074 * T2;
  const F1 = F - 0.02665 * sn(Om);
  const A1 = 299.77 + 0.107408 * k - 0.009173 * T2;

  jde += solar ? -0.4075 * sn(Mp) + 0.1721 * E * sn(M) : -0.4065 * sn(Mp) + 0.1727 * E * sn(M);
  jde += 0.0161 * sn(2 * Mp) - 0.0097 * sn(2 * F1) + 0.0073 * E * sn(Mp - M) - 0.005 * E * sn(Mp + M)
    - 0.0023 * sn(Mp - 2 * F1) + 0.0021 * E * sn(2 * M) + 0.0012 * sn(Mp + 2 * F1) + 0.0006 * E * sn(2 * Mp + M)
    - 0.0004 * sn(3 * Mp) - 0.0003 * E * sn(M + 2 * F1) + 0.0003 * sn(A1) - 0.0002 * E * sn(M - 2 * F1)
    - 0.0002 * E * sn(2 * Mp - M) - 0.0002 * sn(Om);

  const P = 0.207 * E * sn(M) + 0.0024 * E * sn(2 * M) - 0.0392 * sn(Mp) + 0.0116 * sn(2 * Mp)
    - 0.0073 * E * sn(Mp + M) + 0.0067 * E * sn(Mp - M) + 0.0118 * sn(2 * F1);
  const Q = 5.2207 - 0.0048 * E * cs(M) + 0.002 * E * cs(2 * M) - 0.3299 * cs(Mp)
    - 0.006 * E * cs(Mp + M) + 0.0041 * E * cs(Mp - M);
  const W = Math.abs(cs(F1));
  const gamma = (P * cs(F1) + Q * sn(F1)) * (1 - 0.0048 * W);
  const u = 0.0059 + 0.0046 * E * cs(M) - 0.0182 * cs(Mp) + 0.0004 * cs(2 * Mp) - 0.0005 * cs(M + Mp);

  // TT → UT
  const year = 2000 + k / 12.3685;
  const ms = jdToMs(jde) - deltaT(Math.floor(year)) * 1000;
  const g = Math.abs(gamma);

  if (solar) {
    if (g > 1.5433 + u) return null;
    let type: SolarType, magnitude: number;
    if (g < 0.9972) {
      type = u < 0 ? 'total' : u > 0.0047 ? 'annular' : u < 0.00464 * Math.sqrt(1 - gamma * gamma) ? 'hybrid' : 'annular';
      magnitude = 1;
    } else {
      type = 'partial';
      magnitude = (1.5433 + u - g) / (0.5461 + 2 * u);
    }
    return { kind: 'solar', type, ms, gamma, u, magnitude, k };
  }

  const pen = (1.5573 + u - g) / 0.545, umb = (1.0128 - u - g) / 0.545;
  if (pen <= 0) return null;
  const n = 0.5458 + 0.04 * cs(Mp);
  const semi = (r: number) => (r > g ? (60 / n) * Math.sqrt(r * r - gamma * gamma) : 0);
  const type: LunarType = umb >= 1 ? 'total' : umb > 0 ? 'partial' : 'penumbral';
  return {
    kind: 'lunar', type, ms, gamma, u, magnitude: Math.max(0, umb), penumbralMagnitude: pen, k,
    semi: { penumbral: semi(1.5573 + u), partial: semi(1.0128 - u), total: semi(0.4678 - u) },
  };
}

/** All eclipses with greatest eclipse between two instants (UTC ms). */
export function eclipsesBetween(fromMs: number, toMs: number): Eclipse[] {
  const yearOf = (ms: number) => 1970 + ms / (365.2425 * DAYMS);
  const k0 = Math.floor((yearOf(fromMs) - 2000) * 12.3685) - 2, k1 = Math.ceil((yearOf(toMs) - 2000) * 12.3685) + 2;
  const out: Eclipse[] = [];
  for (let k = k0; k <= k1; k++) {
    for (const kk of [k, k + 0.5]) {
      const e = eclipseAt(kk);
      if (e && e.ms >= fromMs && e.ms <= toMs) out.push(e);
    }
  }
  return out.sort((a, b) => a.ms - b.ms);
}

export interface LocalView {
  visible: boolean;
  /** lunar: moon altitude (deg) at greatest eclipse; solar: best coverage time */
  at: number;
  /** solar: fraction of the sun's diameter covered at best (approx.); lunar: moon altitude */
  value: number;
}

/**
 * Seen from a place? Lunar: the moon is above the horizon at some moment of the umbral (or penumbral) phase.
 * Solar: approximate local circumstances from topocentric sun and moon positions (parallax in altitude only),
 * scanning ±3 h around greatest eclipse. Good enough to say "visible / not visible, about how much".
 */
export function visibilityAt(e: Eclipse, c: Place): LocalView {
  if (e.kind === 'lunar') {
    const half = (e.semi!.partial || e.semi!.penumbral) * 60000;
    let best = -90, at = e.ms;
    for (let t = e.ms - half; t <= e.ms + half; t += 5 * 60000) { const a = moonTopoAlt(t, c); if (a > best) { best = a; at = t; } }
    return { visible: best > 0, at, value: best };
  }
  let best = 0, at = e.ms;
  for (let t = e.ms - 3 * 3600000; t <= e.ms + 3 * 3600000; t += 2 * 60000) {
    const s = sky(t, c);
    if (s.sun.alt < -0.8) continue;
    const sep = Math.acos(Math.min(1, sn(s.sun.alt) * sn(s.moon.alt) + cs(s.sun.alt) * cs(s.moon.alt) * cs(s.moon.az - s.sun.az))) * R2D;
    const rs = 0.2666, rm = s.SD / 60;
    const cover = (rs + rm - sep) / (2 * rs);
    if (cover > best) { best = cover; at = t; }
  }
  return { visible: best > 0.005, at, value: Math.min(1, best) };
}

/** Saros: 223 synodic months ≈ 18 years 11 days 8 hours. */
export const SAROS_DAYS = 223 * 29.530588861;
/** Eclipse season: half the draconic year (the sun returns to the same node). */
export const ECLIPSE_SEASON_DAYS = 346.620075883 / 2;

// ---- the order of eclipses: Saros and Inex

/** Inex: 358 synodic months ≈ 29 years less 20 days. One inex later is the next Saros series (number + 1). */
export const INEX_LUNATIONS = 358;
export const SAROS_LUNATIONS = 223;

function modInverse(a: number, m: number): number {
  let [r0, r1, s0, s1] = [a % m, m, 1, 0];
  while (r1) { const q = Math.floor(r0 / r1); [r0, r1] = [r1, r0 - q * r1]; [s0, s1] = [s1, s0 - q * s1]; }
  return ((s0 % m) + m) % m;
}
const INV = modInverse(INEX_LUNATIONS % SAROS_LUNATIONS, SAROS_LUNATIONS);

/** Anchors (NASA numbering): solar 2024-04-08 = Saros 139 (k = 300); lunar 2025-03-14 = Saros 123 (k = 311.5). */
const ANCHOR = { solar: { k: 300, saros: 139 }, lunar: { k: 311.5, saros: 123 } };

/**
 * Saros series number and Inex offset of an eclipse: k − k₀ = 223·a + 358·b, with b taken in (−111, 112];
 * Saros = Saros₀ + b. (Each Inex step moves to the next series; each Saros step stays in the series.)
 */
export function sarosOf(e: Pick<Eclipse, 'kind' | 'k'>): { saros: number; member: number; inex: number } {
  const A = ANCHOR[e.kind], d = Math.round(e.k - A.k);
  let b = (((d % SAROS_LUNATIONS) + SAROS_LUNATIONS) % SAROS_LUNATIONS) * INV % SAROS_LUNATIONS;
  if (b > 111) b -= SAROS_LUNATIONS;
  const a = (d - INEX_LUNATIONS * b) / SAROS_LUNATIONS;
  return { saros: A.saros + b, member: a, inex: b };
}

// ---- where on Earth

export interface GeoPoint { lat: number; lon: number }

const RE = 6378.14, AU = 149597870.7;

/** Geocentric equatorial position (km) and Greenwich sidereal angle at an instant. */
function bodies(ms: number) {
  const { jd, T } = TofMs(ms), eps = 23.439291 - 0.0130042 * T;
  const s = sunEcl(T), m = moonEcl(T);
  const v = (lam: number, beta: number, r: number) => {
    const q = toEq(lam, beta, eps);
    return [r * cs(q.dec) * cs(q.ra), r * cs(q.dec) * sn(q.ra), r * sn(q.dec)] as const;
  };
  const gmst = ((280.46061837 + 360.98564736629 * (jd - 2451545)) % 360 + 360) % 360;
  return { sun: v(s.lam, 0, s.R * AU), moon: v(m.lam, m.beta, m.dist), gmst };
}

const toGeo = (x: number, y: number, z: number, gmst: number): GeoPoint => {
  const r = Math.hypot(x, y, z), lon = ((Math.atan2(y, x) * R2D - gmst + 540) % 360) - 180;
  return { lat: Math.asin(z / r) * R2D, lon };
};

/**
 * Where the shadow axis (sun → moon, continued) meets the Earth (spherical Earth). `hit` is false when the axis
 * misses (partial eclipse): then the point is on the Earth's limb nearest the axis.
 */
export function shadowAxis(ms: number): GeoPoint & { hit: boolean } {
  const { sun, moon, gmst } = bodies(ms);
  let d = [moon[0] - sun[0], moon[1] - sun[1], moon[2] - sun[2]];
  const L = Math.hypot(...d); d = d.map(x => x / L);
  const b = moon[0] * d[0] + moon[1] * d[1] + moon[2] * d[2], c = moon[0] ** 2 + moon[1] ** 2 + moon[2] ** 2 - RE * RE;
  const disc = b * b - c;
  if (disc >= 0) {
    const t = -b - Math.sqrt(disc);
    return { ...toGeo(moon[0] + d[0] * t, moon[1] + d[1] * t, moon[2] + d[2] * t, gmst), hit: true };
  }
  const t = -b;
  return { ...toGeo(moon[0] + d[0] * t, moon[1] + d[1] * t, moon[2] + d[2] * t, gmst), hit: false };
}

// ---- what an observer sees: the Moon's disc against the Sun's (topocentric, spherical Earth)

const R_SUN = 695700, R_MOON = 1737.4;

export interface ObserverView {
  /** the Moon's centre relative to the Sun's, degrees on the sky: x along the horizon (west +), y toward the zenith */
  dx: number;
  dy: number;
  /** apparent radii, degrees */
  rs: number;
  rm: number;
  /** centre separation, degrees */
  sep: number;
  /** the Sun's altitude, degrees (no refraction) */
  sunAlt: number;
  /** fraction of the Sun's diameter covered (the eclipse "magnitude" at this moment); 0 when the discs don't touch */
  mag: number;
  /** fraction of the Sun's disc area hidden */
  obsc: number;
  phase: 'none' | 'partial' | 'total' | 'annular';
}

/** The Sun and Moon as seen from `c` at `ms`. */
export function observerView(ms: number, c: Place): ObserverView {
  const { sun, moon, gmst } = bodies(ms);
  const th = gmst + c.lon;
  const up = [cs(c.lat) * cs(th), cs(c.lat) * sn(th), sn(c.lat)];          // local zenith (unit)
  const o = up.map(x => x * RE);
  const S = sun.map((x, i) => x - o[i]), M = moon.map((x, i) => x - o[i]);
  const ls = Math.hypot(...S), lm = Math.hypot(...M);
  const s = S.map(x => x / ls), m = M.map(x => x / lm);
  const dot = (a: number[], b: number[]) => a[0] * b[0] + a[1] * b[1] + a[2] * b[2];
  const sep = Math.acos(Math.min(1, dot(s, m))) * R2D;
  // tangent plane at the Sun: y toward the zenith, x = y × s (west, as you face the Sun)
  const yv = up.map((u, i) => u - dot(up, s) * s[i]), ly = Math.hypot(...yv) || 1;
  const Y = yv.map(v => v / ly);
  const X = [Y[1] * s[2] - Y[2] * s[1], Y[2] * s[0] - Y[0] * s[2], Y[0] * s[1] - Y[1] * s[0]];
  const k = R2D / dot(m, s);                                                // gnomonic projection, degrees
  const dx = dot(m, X) * k, dy = dot(m, Y) * k;
  const rs = Math.asin(R_SUN / ls) * R2D, rm = Math.asin(R_MOON / lm) * R2D;
  const mag = sep >= rs + rm ? 0 : (rs + rm - sep) / (2 * rs);
  return { dx, dy, rs, rm, sep, sunAlt: Math.asin(dot(s, up)) * R2D, mag, obsc: overlap(rs, rm, sep), phase: phaseOf(rs, rm, sep) };
}

function phaseOf(rs: number, rm: number, d: number): ObserverView['phase'] {
  if (d >= rs + rm) return 'none';
  if (d <= rm - rs) return 'total';
  if (d <= rs - rm) return 'annular';
  return 'partial';
}

/** Area of the Sun's disc (radius a) hidden by the Moon's (radius b) at centre distance d, as a fraction. */
function overlap(a: number, b: number, d: number): number {
  if (d >= a + b) return 0;
  if (d <= Math.abs(a - b)) return b >= a ? 1 : (b * b) / (a * a);
  const p = (d * d + a * a - b * b) / (2 * d * a), q = (d * d + b * b - a * a) / (2 * d * b);
  const A = a * a * Math.acos(p) + b * b * Math.acos(q) - 0.5 * Math.sqrt((-d + a + b) * (d + a - b) * (d - a + b) * (d + a + b));
  return A / (Math.PI * a * a);
}

export interface Contacts {
  /** first and last contact (partial phase begins / ends) */
  c1: number; c4: number;
  /** second and third contact: totality or annularity, when the observer is in the path */
  c2?: number; c3?: number;
  /** greatest eclipse for this observer */
  max: number;
  central?: 'total' | 'annular';
}

/** Contact times of a solar eclipse for an observer (UTC ms), or null if the discs never touch there or the Sun is
 *  below the horizon (−0.83°, the visible limb) for the whole eclipse. */
export function contacts(e: Eclipse, c: Place): Contacts | null {
  if (e.kind !== 'solar') return null;
  const at = (t: number) => observerView(t, c);
  // scan ±3 h for the closest approach, then refine
  let best = Infinity, tm = e.ms;
  for (let t = e.ms - 3 * 3600000; t <= e.ms + 3 * 3600000; t += 60000) { const v = at(t); if (v.sep - v.rs - v.rm < best) { best = v.sep - v.rs - v.rm; tm = t; } }
  for (let step = 30000; step >= 250; step /= 2) {
    const a = at(tm - step), b = at(tm + step), m0 = at(tm);
    if (a.sep < m0.sep) tm -= step; else if (b.sep < m0.sep) tm += step;
  }
  if (at(tm).phase === 'none') return null;
  // the moment f(t) changes sign between t0 (inside) and t1 (outside), by bisection
  const edge = (f: (v: ObserverView) => boolean, inside: number, dir: 1 | -1) => {
    let t1 = inside;
    while (f(at(t1)) && Math.abs(t1 - inside) < 4 * 3600000) t1 += dir * 60000;
    let a = inside, b = t1;
    for (let i = 0; i < 30; i++) { const mid = (a + b) / 2; if (f(at(mid))) a = mid; else b = mid; }
    return Math.round((a + b) / 2);
  };
  const touching = (v: ObserverView) => v.phase !== 'none';
  const out: Contacts = { c1: edge(touching, tm, -1), c4: edge(touching, tm, 1), max: tm };
  let up = false;
  for (let t = out.c1; t <= out.c4 && !up; t += 5 * 60000) up = at(t).sunAlt > -0.83;
  if (!up && at(out.c4).sunAlt <= -0.83) return null;
  const ph = at(tm).phase;
  if (ph === 'total' || ph === 'annular') {
    const central = (v: ObserverView) => v.phase === ph;
    out.c2 = edge(central, tm, -1); out.c3 = edge(central, tm, 1); out.central = ph;
  }
  return out;
}

/** The point on Earth with the moon at the zenith (lunar eclipses are seen from the hemisphere around it). */
export function subLunar(ms: number): GeoPoint {
  const { moon, gmst } = bodies(ms);
  return toGeo(moon[0], moon[1], moon[2], gmst);
}
