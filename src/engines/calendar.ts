// Fixed Hebrew calendar engine — ported 1:1 from legacy/engine.js (+ monthStart/hebDate from legacy/astro.js).
// Pure functions only. Time is counted in chalakim (parts) from the epoch; day index d has weekday d % 7
// (0 = Sunday … 6 = Shabbat). Day 1 is the day of molad Bahrad (Monday).

export const P_HOUR = 1080;
export const P_DAY = 25920;
export const P_WEEK = 181440;
export const P_MONTH = 765433;
export const BAHRAD = 1 * P_DAY + 5 * P_HOUR + 204;
export const LEAP_POS = [3, 6, 8, 11, 14, 17, 19] as const;

export const EX = {
  month: P_MONTH % P_WEEK,
  pashut: (12 * P_MONTH) % P_WEEK,
  meubar: (13 * P_MONTH) % P_WEEK,
  cycle: (235 * P_MONTH) % P_WEEK,
} as const;

export type Dechiya = 'zaken' | 'gatrad' | 'betu' | 'adu';
export type DechiyaSkip = Partial<Record<Dechiya, boolean>>;
export type YearType = 'ח' | 'כ' | 'ש';

export const isLeap = (y: number): boolean => (7 * y + 1) % 19 < 7;
export const cyclePos = (y: number): number => ((y - 1) % 19) + 1;

export function monthsBefore(y: number): number {
  const c = Math.floor((y - 1) / 19);
  const r = (y - 1) % 19;
  return 235 * c + 12 * r + Math.floor((7 * r + 1) / 19);
}

export interface DHP { d: number; h: number; p: number }

/** t >= 0 total parts → days, hours, parts. */
export function splitParts(t: number): DHP {
  const d = Math.floor(t / P_DAY);
  const r = t % P_DAY;
  return { d, h: Math.floor(r / P_HOUR), p: r % P_HOUR };
}

/** Absolute molad (parts from epoch) of month mIdx (0 = Tishrei) of year y. */
export function moladTotal(y: number, mIdx = 0): number {
  return BAHRAD + (monthsBefore(y) + mIdx) * P_MONTH;
}

export interface RhResult {
  /** day index of Rosh Hashana */
  day: number;
  /** dechiyot applied, in order */
  rules: Dechiya[];
  /** day index of the molad */
  moladDay: number;
  /** weekday of the molad (0 = Sunday) */
  wd: number;
  /** parts into the molad day */
  p: number;
}

/** Generic: Rosh Hashana from a molad (absolute parts), with optional dechiyot switched off. */
export function rhFrom(t: number, curLeap: boolean, prevLeap: boolean, skip: DechiyaSkip = {}): RhResult {
  let d = Math.floor(t / P_DAY);
  const p = t % P_DAY;
  const wd = d % 7;
  const rules: Dechiya[] = [];
  if (p >= 18 * P_HOUR && !skip.zaken) { d++; rules.push('zaken'); }
  else if (wd === 2 && p >= 9 * P_HOUR + 204 && !curLeap && !skip.gatrad) { d++; rules.push('gatrad'); }
  else if (wd === 1 && p >= 15 * P_HOUR + 589 && prevLeap && !skip.betu) { d++; rules.push('betu'); }
  if ([0, 3, 5].includes(d % 7) && !skip.adu) { d++; rules.push('adu'); }
  return { day: d, rules, moladDay: Math.floor(t / P_DAY), wd, p };
}

export interface YearRh extends RhResult { t: number; y: number }

export function rh(y: number): YearRh {
  const t = moladTotal(y);
  const r = rhFrom(t, isLeap(y), isLeap(y - 1));
  return { ...r, t, y };
}

export const yearLen = (y: number): number => rh(y + 1).day - rh(y).day;

const TYPE_BY_LEN: Record<number, YearType> = { 353: 'ח', 354: 'כ', 355: 'ש', 383: 'ח', 384: 'כ', 385: 'ש' };
/** Year type letter for a length; undefined for a forbidden length. */
export const yearType = (len: number): YearType | undefined => TYPE_BY_LEN[len];
export const TYPE_NAME: Record<YearType, string> = { 'ח': 'חסרה', 'כ': 'כסדרה', 'ש': 'שלמה' };
export const ALLOWED_LENGTHS = [353, 354, 355, 383, 384, 385] as const;

export const pesachDay = (y: number): number => rh(y + 1).day - 163;

export const DAY_LETTER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז'] as const;
export const DAY_NAME = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'] as const;

export function keviut(y: number): string {
  const r = rh(y);
  return DAY_LETTER[r.day % 7] + (yearType(yearLen(y)) ?? '?') + DAY_LETTER[pesachDay(y) % 7];
}

export type MonthEntry = readonly [name: string, days: number];

export function monthsOf(y: number): MonthEntry[] {
  const len = yearLen(y), t = yearType(len), L = isLeap(y);
  const ch = t === 'ש' ? 30 : 29, ki = t === 'ח' ? 29 : 30;
  const arr: MonthEntry[] = [['תשרי', 30], ['חשוון', ch], ['כסלו', ki], ['טבת', 29], ['שבט', 30]];
  if (L) arr.push(['אדר א׳', 30], ['אדר ב׳', 29]); else arr.push(['אדר', 29]);
  arr.push(['ניסן', 30], ['אייר', 29], ['סיוון', 30], ['תמוז', 29], ['אב', 30], ['אלול', 29]);
  return arr;
}

/** Day index of the 1st of month mi (0 = Tishrei) of year y. */
export function monthStart(y: number, mi: number): number {
  const ms = monthsOf(y);
  let d = rh(y).day;
  for (let i = 0; i < mi; i++) d += ms[i][1];
  return d;
}

// Gregorian anchor: 1 Tishrei 5787 = 2026-09-12 (proleptic Gregorian, UTC midnight).
const ANCHOR_MS = Date.UTC(2026, 8, 12);
let _anchor: number | null = null;
const anchorDay = (): number => (_anchor ??= rh(5787).day);

/** Day index → civil date (UTC midnight). The Hebrew day begins the evening before. */
export function gDate(day: number): Date {
  return new Date(ANCHOR_MS + (day - anchorDay()) * 86400000);
}

/** Civil date (y, m 0-based, d) → day index. */
export function dayOfCivil(y: number, m: number, d: number): number {
  return Math.round((Date.UTC(y, m, d) - ANCHOR_MS) / 86400000) + anchorDay();
}

/** Hebrew year containing civil date `now` (date part only, local calendar of `now`). */
export function currentYear(now: Date): number {
  const today = Date.UTC(now.getFullYear(), now.getMonth(), now.getDate());
  let y = 5787;
  while (gDate(rh(y).day).getTime() > today) y--;
  while (gDate(rh(y + 1).day).getTime() <= today) y++;
  return y;
}

export interface HebDate { y: number; mi: number; d: number; name: string }

export function hebDate(day: number): HebDate {
  let y = 5787;
  while (rh(y).day > day) y--;
  while (rh(y + 1).day <= day) y++;
  const ms = monthsOf(y);
  let s = rh(y).day;
  for (let i = 0; i < ms.length; i++) {
    if (day < s + ms[i][1]) return { y, mi: i, d: day - s + 1, name: ms[i][0] };
    s += ms[i][1];
  }
  throw new Error(`hebDate: day ${day} out of range`);
}

// ---- gematria
export function gem(n: number): string {
  if (n <= 0) return '';
  const H = ['', 'ק', 'ר', 'ש', 'ת', 'תק', 'תר', 'תש', 'תת', 'תתק', 'תתר'];
  const T = ['', 'י', 'כ', 'ל', 'מ', 'נ', 'ס', 'ע', 'פ', 'צ'];
  const O = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט'];
  const r = n % 100;
  let s = H[Math.floor(n / 100)];
  s += r === 15 ? 'טו' : r === 16 ? 'טז' : T[Math.floor(r / 10)] + O[r % 10];
  return s;
}

/** Gematria with geresh / gershayim. 0 → "0". */
export function gq(n: number): string {
  if (n === 0) return '0';
  const s = gem(n);
  return s.length === 1 ? s + '׳' : s.slice(0, -1) + '״' + s.slice(-1);
}

export function yearHeb(y: number): string {
  const th = Math.floor(y / 1000), rest = y % 1000;
  return (th ? gem(th) + '׳' : '') + (rest ? gq(rest) : '');
}

const LV: Record<string, number> = {
  'א': 1, 'ב': 2, 'ג': 3, 'ד': 4, 'ה': 5, 'ו': 6, 'ז': 7, 'ח': 8, 'ט': 9, 'י': 10, 'כ': 20, 'ך': 20, 'ל': 30,
  'מ': 40, 'ם': 40, 'נ': 50, 'ן': 50, 'ס': 60, 'ע': 70, 'פ': 80, 'ף': 80, 'צ': 90, 'ץ': 90, 'ק': 100, 'ר': 200,
  'ש': 300, 'ת': 400,
};

/** "5787", "787", "תשפ״ז", "ה׳תשפ״ז" → 5787. NaN when unparseable. */
export function parseYear(input: string): number {
  let s = (input || '').trim();
  if (!s) return NaN;
  if (/^\d+$/.test(s)) { let n = +s; if (n < 1000) n += 5000; return n; }
  s = s.replace(/["״]/g, '').replace(/\s/g, '');
  let th: number | null = null;
  const m = s.match(/^([א-ת])['׳](.*)$/);
  if (m) { th = LV[m[1]]; s = m[2]; }
  s = s.replace(/['׳]/g, '');
  let v = 0;
  for (const c of s) { if (!(c in LV)) return NaN; v += LV[c]; }
  return (th === null ? 5000 : th * 1000) + v;
}

const wk = (t: number): number => ((t % P_WEEK) + P_WEEK) % P_WEEK;

/** Molad as "ד׳ ט׳ שצ״א" (weekday, hours, parts) — weekday letter is 1-based (א = Sunday). */
export function fmtMolad(t: number): string {
  const { d, h, p } = splitParts(wk(t));
  return `${DAY_LETTER[d]}׳ ${gq(h)} ${gq(p)}`;
}

export interface CivilTime {
  /** civil weekday name (the Hebrew night hours belong to the previous civil day) */
  day: string;
  /** "HH:MM" on a 6pm-based clock */
  time: string;
  /** leftover parts after whole minutes (0–17) */
  rem: number;
  night: boolean;
  /** Hebrew weekday index */
  wd: number;
}

/** Molad time (Hebrew hours counted from 18:00) → civil clock description. */
export function civil(t: number): CivilTime {
  const { d, h, p } = splitParts(wk(t));
  const ch = (18 + h) % 24, mi = Math.floor(p / 18), rem = p % 18;
  const cd = h < 6 ? (d + 6) % 7 : d;
  return {
    day: DAY_NAME[cd],
    time: `${String(ch).padStart(2, '0')}:${String(mi).padStart(2, '0')}`,
    rem,
    night: h < 12,
    wd: d,
  };
}

/** A duration (excess) as "א׳ י״ב תשצ״ג": days, hours, parts, each in gematria. */
export function fmtDur(t: number): string {
  const { d, h, p } = splitParts(t);
  return `${gq(d)} ${gq(h)} ${gq(p)}`;
}

/** Normalise parts to within one week (for excess arithmetic). */
export const weekParts = wk;
