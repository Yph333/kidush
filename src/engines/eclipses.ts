// Solar and lunar eclipses — Meeus, Astronomical Algorithms (2nd ed.), ch. 54 (with the mean phases of ch. 49).
// Modern astronomy only; independent of the Rambam engine. Pure.
//
// For each new / full moon near a node: instant of greatest eclipse, γ (least distance of the shadow axis from
// the Earth's centre, in Earth radii), u (umbral cone radius), type and magnitude. Visibility from a place is
// approximated separately (see visibilityAt).

import { DAYMS, D2R, R2D, type Place, deltaT, moonTopoAlt, sky } from './astro';

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
