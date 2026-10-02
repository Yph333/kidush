// Rambam, Hilchot Kiddush HaChodesh ch. 11–17 — ported 1:1 from legacy/rambam.js.
// Pure functions. Uses only the fixed calendar (for the day count from the epoch); never the modern model.
// Units: mean positions in arc-seconds (0..1296000); true positions and corrections in arc-minutes.

import { monthStart, monthsOf } from './calendar';

type DMS = readonly [number, number, number];
type MotionTable = Readonly<Record<1 | 10 | 100 | 1000 | 10000 | 29 | 354, DMS>>;

/** Mean motions per block of days and roots at the epoch. */
export const RB: {
  sun: MotionTable; apo: MotionTable; moon: MotionTable; crs: MotionTable; head: MotionTable;
  root: Readonly<Record<'sun' | 'apo' | 'moon' | 'crs' | 'head', DMS>>;
} = {
  sun: { 1: [0, 59, 8], 10: [9, 51, 23], 100: [98, 33, 53], 1000: [265, 38, 50], 10000: [136, 28, 20], 29: [28, 35, 1], 354: [348, 55, 15] },
  apo: { 1: [0, 0, 0.15], 10: [0, 0, 1.5], 100: [0, 0, 15], 1000: [0, 2, 30], 10000: [0, 25, 0], 29: [0, 0, 4], 354: [0, 0, 53] },
  moon: { 1: [13, 10, 35], 10: [131, 45, 50], 100: [237, 38, 23], 1000: [216, 23, 50], 10000: [3, 58, 20], 29: [22, 6, 56], 354: [344, 26, 43] },
  crs: { 1: [13, 3, 54], 10: [130, 39, 0], 100: [226, 29, 53], 1000: [104, 58, 50], 10000: [329, 48, 20], 29: [18, 53, 4], 354: [305, 0, 13] },
  head: { 1: [0, 3, 11], 10: [0, 31, 47], 100: [5, 17, 43], 1000: [52, 57, 10], 10000: [169, 31, 40], 29: [1, 32, 9], 354: [18, 44, 42] },
  root: { sun: [7, 3, 32], apo: [86, 45, 8], moon: [31, 14, 43], crs: [84, 28, 42], head: [180, 57, 28] },
};

/** Sun equation by course, every 10°, arc-minutes. */
export const R_SUN = [0, 20, 40, 58, 75, 89, 101, 111, 117, 119, 118, 113, 105, 93, 79, 61, 42, 21, 0] as const;
/** Moon equation by corrected course, every 10°, arc-minutes. */
export const R_MOON = [0, 50, 98, 144, 186, 224, 256, 281, 300, 305, 308, 299, 280, 251, 213, 168, 116, 59, 0] as const;
/** Moon latitude by latitude course, every 10°, arc-minutes. */
export const R_LAT = [0, 52, 103, 150, 193, 230, 260, 282, 295, 300] as const;
/** Parallax in longitude by sign, arc-minutes. */
export const R_PLON = [59, 60, 58, 52, 43, 37, 34, 34, 36, 44, 53, 58] as const;
/** Parallax in latitude by sign, arc-minutes. */
export const R_PLAT = [9, 10, 16, 27, 38, 44, 46, 45, 44, 36, 27, 12] as const;
/** Doubled-distance ranges → degrees added to the course (15:3): [from, to, add]. */
export const R_DBL = [[0, 5, 0], [6, 11, 1], [12, 18, 2], [19, 24, 3], [25, 31, 4], [32, 38, 5], [39, 45, 6], [46, 51, 7], [52, 59, 8], [60, 63, 9]] as const;
export const SIGNS = ['טלה', 'שור', 'תאומים', 'סרטן', 'אריה', 'בתולה', 'מאזנים', 'עקרב', 'קשת', 'גדי', 'דלי', 'דגים'] as const;

const FULL = 1296000;
export const secOf = ([d, m, s]: DMS): number => d * 3600 + m * 60 + s;
const nS = (x: number): number => ((x % FULL) + FULL) % FULL;
const nM = (x: number): number => ((x % 21600) + 21600) % 21600;

export type Block = 10000 | 1000 | 354 | 100 | 29 | 10 | 1;

/** Mean motion over N days, greedy decomposition into the Rambam's own blocks. */
export function rMotion(tab: MotionTable, N: number): { v: number; parts: [Block, number][] } {
  const sg = N < 0 ? -1 : 1;
  let n = Math.abs(N), t = 0;
  const parts: [Block, number][] = [];
  for (const k of [10000, 1000, 354, 100, 29, 10, 1] as Block[]) {
    let c = 0;
    while (n >= k) { t += secOf(tab[k]); n -= k; c++; }
    if (c) parts.push([k, c]);
  }
  return { v: sg * t, parts };
}

/** Linear interpolation in a 10°-step table (13:7). */
export function interp(tab: readonly number[], deg: number): number {
  const i = Math.floor(deg / 10), r = deg - i * 10;
  if (i >= tab.length - 1) return tab[tab.length - 1];
  return tab[i] + (tab[i + 1] - tab[i]) * r / 10;
}

/** Circle-of-the-moon fraction by the moon's position. */
/** [up to (deg of the moon's position, folded to 0–180), fraction, name] */
export const CIRCLE_TABLE: readonly (readonly [number, number, string])[] = [[20, 2 / 5, 'שני חומשים'], [40, 1 / 3, 'שליש'], [50, 1 / 4, 'רביע'], [60, 1 / 5, 'חומש'], [70, 1 / 6, 'שתות'], [80, 1 / 12, 'חצי שתות'], [85, 1 / 24, 'רביע שתות'], [95, 0, 'כלום'], [100, 1 / 24, 'רביע שתות'], [110, 1 / 12, 'חצי שתות'], [120, 1 / 6, 'שתות'], [130, 1 / 5, 'חומש'], [140, 1 / 4, 'רביע'], [160, 1 / 3, 'שליש'], [180, 2 / 5, 'שני חומשים']];

export function circleFrac(posMin: number): [number, string] {
  const x = (posMin / 60) % 180;
  for (const [lim, f, n] of CIRCLE_TABLE) if (x < lim) return [f, n];
  return [2 / 5, 'שני חומשים'];
}

/** Fourth-longitude correction by sign (17:12). As written in the translation — see VERIFICATION.md open points. */
export const R_FOURTH: readonly (readonly [number, string])[] = [[1 / 6, 'מוסיפים שתותו'], [1 / 5, 'מוסיפים חומשו'], [1 / 6, 'מוסיפים שתותו'], [0, 'משאירים כמו שהוא'], [-1 / 5, 'גורעים חומשו'], [-1 / 3, 'גורעים שלישיתו'], [-1 / 3, 'גורעים שלישיתו'], [-1 / 5, 'גורעים חומשו'], [0, 'משאירים כמו שהוא'], [1 / 6, 'מוסיפים שתותו'], [1 / 5, 'מוסיפים חומשו'], [1 / 6, 'מוסיפים שתותו']];

/** The same ranges as season(), for display: [from deg, to deg, arc-minutes]. Kept in step by a test. */
export const SEASON_TABLE: readonly (readonly [number, number, number])[] = [
  [345, 15, 0], [15, 60, 15], [60, 120, 30], [120, 165, 15], [165, 195, 0], [195, 240, -15], [240, 300, -30], [300, 345, -15],
];

/** Limits of sighting: [arc of sighting up to (deg), first longitude needed (deg)]. */
export const SIGHTING_LIMITS: readonly (readonly [number, number])[] = [[10, 13], [11, 12], [12, 11], [13, 10], [14, 9]];

/** First longitude (deg) needed for an arc of sighting A (deg), 9 < A ≤ 14. */
export function limitNeed(A: number): number {
  return A <= 10 ? 13 : A <= 11 ? 12 : A <= 12 ? 11 : A <= 13 ? 10 : 9;
}

/** Latitude course (whole degrees, 0–359) folded into 0–90 for the latitude table. */
export function foldLatCourse(lc: number): number {
  return lc <= 90 ? lc : lc <= 180 ? 180 - lc : lc <= 270 ? lc - 180 : 360 - lc;
}

/** Seasonal adjustment to the mean moon at sunset by the mean sun, arc-minutes. */
export function season(sunDeg: number): number {
  if (sunDeg >= 345 || sunDeg < 15) return 0;
  if (sunDeg < 60) return 15;
  if (sunDeg < 120) return 30;
  if (sunDeg < 165) return 15;
  if (sunDeg < 195) return 0;
  if (sunDeg < 240) return -15;
  if (sunDeg < 300) return -30;
  return -15;
}

let _D0: number | null = null;
/** Day index of the epoch: start of Thursday night, 3 Nisan 4938. */
export function rambamD0(): number {
  if (_D0 === null) {
    const y = 4938, ni = monthsOf(y).findIndex(m => m[0] === 'ניסן');
    _D0 = monthStart(y, ni) + 2;
  }
  return _D0;
}

/** Why the verdict came out as it did. UI turns this into text. */
export type VisibilityReason =
  | { kind: 'firstLongAbove'; hi: number }
  | { kind: 'firstLongAtMost'; lo: number }
  | { kind: 'arcAtMost9' }
  | { kind: 'arcAbove14' }
  | { kind: 'limits'; arc: number; need: number; long1: number };

export interface RambamResult {
  N: number;
  parts: [Block, number][];
  sunMean: number; apo: number; sunMaslul: number; sunMaslulR: number;
  sunEq: number; sunSign: -1 | 0 | 1; sunTrue: number;
  moonMean: number; season: number; moonAdj: number; crs: number;
  dist: number; dbl: number; dblR: number; dblAdd: number; dblOut: boolean;
  crsCorr: number; crsR: number; moonEq: number; moonSignOp: -1 | 0 | 1; moonTrue: number;
  headMean: number; head: number; latCourse: number; latCourseR: number; lat1: number; north: boolean;
  long1: number; sign: number; capGem: boolean; pre: 'no' | 'yes' | 'calc'; preLim: [number, number];
  plon: number; long2: number; plat: number; lat2: number;
  circFrac: string; circle: number; circAdd: boolean; long3: number;
  fourthTxt: string; fourthDelta: number; long4: number;
  geo: number; arc: number;
  visible: boolean; reason: VisibilityReason;
}

/**
 * Full chain for the evening that begins Hebrew day `dayIdx`.
 * N = whole days from the start of Thursday night 3 Nisan 4938 to the start of that night.
 */
export function rambam(dayIdx: number): RambamResult {
  const N = dayIdx - rambamD0();
  const mo = (k: 'sun' | 'apo' | 'moon' | 'crs' | 'head') => rMotion(RB[k], N);
  const ms = mo('sun'), ma = mo('apo'), mm = mo('moon'), mc = mo('crs'), mh = mo('head');

  const sunMean = nS(secOf(RB.root.sun) + ms.v);
  const apo = nS(secOf(RB.root.apo) + ma.v);
  const sunMaslul = nS(sunMean - apo);
  const sunMaslulR = Math.round(sunMaslul / 3600) % 360;
  const m2 = sunMaslulR > 180 ? 360 - sunMaslulR : sunMaslulR;
  const sunEq = Math.round(interp(R_SUN, m2));
  const sunSign = sunMaslulR < 180 ? -1 : sunMaslulR > 180 ? 1 : 0;
  const sunTrue = nM(Math.round((sunMean + sunSign * sunEq * 60) / 60));

  const moonMean = nS(secOf(RB.root.moon) + mm.v);
  const seasonAdj = season(sunMean / 3600);
  const moonAdj = nS(moonMean + seasonAdj * 60);
  const crs = nS(secOf(RB.root.crs) + mc.v);
  let dist = nS(moonAdj - sunMean);
  if (dist > FULL / 2) dist -= FULL;
  const dbl = 2 * dist;
  const dblR = Math.round(dbl / 3600);
  let dblAdd = 0;
  const dblOut = dblR < 0 || dblR > 63;
  for (const [a, b, v] of R_DBL) if (dblR >= a && dblR <= b) dblAdd = v;
  if (dblR > 63) dblAdd = 9;
  const crsCorr = nS(crs + dblAdd * 3600);
  const crsR = Math.round(crsCorr / 3600) % 360;
  const c2 = crsR > 180 ? 360 - crsR : crsR;
  const moonEq = Math.round(interp(R_MOON, c2));
  const moonSignOp = crsR < 180 ? -1 : crsR > 180 ? 1 : 0;
  const moonTrue = nM(Math.round((moonAdj + moonSignOp * moonEq * 60) / 60));

  const headMean = nS(secOf(RB.root.head) + mh.v);
  const head = nM(Math.round(nS(FULL - headMean) / 60));
  const latCourse = nM(moonTrue - head);
  const latCourseR = Math.round(latCourse / 60) % 360;
  const lc = latCourseR;
  const l2 = foldLatCourse(lc);
  const lat1 = Math.round(interp(R_LAT, l2));
  const north = lc > 0 && lc < 180;

  let long1 = moonTrue - sunTrue;
  if (long1 > 10800) long1 -= 21600;
  if (long1 < -10800) long1 += 21600;
  const sign = Math.floor(moonTrue / 1800);
  const capGem = sign >= 9 || sign <= 2;
  const [lo, hi]: [number, number] = capGem ? [9, 15] : [10, 24];
  const pre = long1 <= lo * 60 ? 'no' : long1 > hi * 60 ? 'yes' : 'calc';

  const plon = R_PLON[sign];
  const long2 = long1 - plon;
  const plat = R_PLAT[sign];
  const lat2 = north ? lat1 - plat : lat1 + plat;
  const [cf, circFrac] = circleFrac(moonTrue);
  const circle = Math.round(Math.abs(lat2) * cf);
  const circAdd = capGem ? !north : north;
  const long3 = long2 + (circAdd ? circle : -circle);
  const [ff, fourthTxt] = R_FOURTH[sign];
  const fourthDelta = Math.round(long3 * ff);
  const long4 = long3 + fourthDelta;
  const geo = Math.round(lat1 * 2 / 3);
  const arc = long4 + (north ? geo : -geo);

  const A = arc / 60, L = long1 / 60;
  let visible: boolean, reason: VisibilityReason;
  if (pre !== 'calc') {
    visible = pre === 'yes';
    reason = pre === 'yes' ? { kind: 'firstLongAbove', hi } : { kind: 'firstLongAtMost', lo };
  } else if (A <= 9) { visible = false; reason = { kind: 'arcAtMost9' }; }
  else if (A > 14) { visible = true; reason = { kind: 'arcAbove14' }; }
  else {
    const need = limitNeed(A);
    visible = L >= need;
    reason = { kind: 'limits', arc, need, long1 };
  }

  return {
    N, parts: ms.parts,
    sunMean, apo, sunMaslul, sunMaslulR, sunEq, sunSign, sunTrue,
    moonMean, season: seasonAdj, moonAdj, crs, dist, dbl, dblR, dblAdd, dblOut,
    crsCorr, crsR, moonEq, moonSignOp, moonTrue,
    headMean, head, latCourse, latCourseR, lat1, north,
    long1, sign, capGem, pre, preLim: [lo, hi],
    plon, long2, plat, lat2, circFrac, circle, circAdd, long3, fourthTxt, fourthDelta, long4,
    geo, arc, visible, reason,
  };
}

/** Split arc-minutes into sign index and minutes within the sign. */
export function signPos(min: number): { sign: number; within: number } {
  const s = Math.floor(min / 1800);
  return { sign: s, within: min - s * 1800 };
}

/**
 * The moon's equation for a corrected course (whole degrees), exactly as inside rambam(): fold to 0–180,
 * interpolate the table, round to the minute; subtract below 180°, add above. For the teaching slides.
 */
export function moonEquation(course: number): { eq: number; sign: -1 | 0 | 1; folded: number; row: number } {
  const c = ((Math.round(course) % 360) + 360) % 360;
  const c2 = c > 180 ? 360 - c : c;
  return { eq: Math.round(interp(R_MOON, c2)), sign: c < 180 ? -1 : c > 180 ? 1 : 0, folded: c2, row: Math.min(17, Math.floor(c2 / 10)) };
}
