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

// ---- Shmuel's tekufot and the great (28-year) cycle (from legacy app.js, slide 6)

export interface Tekufot {
  /** great cycle number (1-based) */
  cycle: number;
  /** year within the great cycle (1–28) */
  year: number;
  /** hours from the start of Sunday night (0–168), Shmuel. Tishrei is the one before Nisan of the same year. */
  tishrei: number;
  tevet: number;
  nisan: number;
  tammuz: number;
}

const wkH = (H: number): number => ((H % 168) + 168) % 168;

export function tekufotShmuel(y: number): Tekufot {
  const cycle = Math.floor((y - 1) / 28) + 1, n = (y - 1) % 28 + 1, N = 72 + 30 * (n - 1);
  return { cycle, year: n, tishrei: wkH(N - 15), tevet: wkH(N - 7.5), nisan: wkH(N), tammuz: wkH(N + 7.5) };
}

/** First year ≥ y that begins a great cycle (Birkat HaChama in its Nisan). */
export function nextBirkatHachama(y: number): number {
  const n = (y - 1) % 28 + 1;
  return n === 1 ? y : y + (29 - n);
}

// ---- step-by-step decompositions used by the teaching slides

export interface MonthsBeforeSteps {
  /** whole years elapsed (y − 1) */
  years: number;
  /** whole 19-year cycles */
  cycles: number;
  /** years into the current cycle */
  rem: number;
  /** common / leap years among `rem` */
  common: number;
  leap: number;
  /** = monthsBefore(y) */
  total: number;
}

export function monthsBeforeSteps(y: number): MonthsBeforeSteps {
  const years = y - 1, cycles = Math.floor(years / 19), rem = years % 19;
  const leap = Math.floor((7 * rem + 1) / 19), common = rem - leap;
  return { years, cycles, rem, common, leap, total: 235 * cycles + 12 * common + 13 * leap };
}

export interface ExcessStep {
  kind: 'cycle' | 'pashut' | 'meubar' | 'month';
  count: number;
  /** excess per unit (parts, < one week) */
  ex: number;
  /** count × ex */
  prod: number;
  /** running molad, reduced to one week */
  run: number;
}

/** The Kitzur method: Bahrad + cycles, common years, leap years and months, each reduced by whole weeks. */
export function moladByExcess(y: number, mi = 0): { steps: ExcessStep[]; molad: number } {
  const m = monthsBeforeSteps(y);
  let run = BAHRAD;
  const steps: ExcessStep[] = [];
  const add = (kind: ExcessStep['kind'], count: number, ex: number) => {
    const prod = count * ex;
    run = wk(run + prod);
    steps.push({ kind, count, ex, prod, run });
  };
  add('cycle', m.cycles, EX.cycle);
  add('pashut', m.common, EX.pashut);
  add('meubar', m.leap, EX.meubar);
  if (mi > 0) add('month', mi, EX.month);
  return { steps, molad: run };
}

/** Each dechiya's conditions for year y, in the order they are checked (mirrors rhFrom). */
export interface DechiyotDetail {
  wd: number;
  hours: number;
  /** parts into the molad day */
  pp: number;
  leap: boolean;
  prevLeap: boolean;
  zaken: boolean;
  gatrad: { applies: boolean; checked: boolean; tuesday: boolean; common: boolean; late: boolean };
  betu: { applies: boolean; checked: boolean; monday: boolean; afterLeap: boolean; late: boolean };
  adu: { applies: boolean; candidate: number };
}

export function dechiyotDetail(y: number): DechiyotDetail {
  const r = rh(y), L = isLeap(y), PL = isLeap(y - 1), pp = r.p, wd = r.wd;
  const zaken = pp >= 18 * P_HOUR;
  const gLate = pp >= 9 * P_HOUR + 204, bLate = pp >= 15 * P_HOUR + 589;
  const gatrad = !zaken && wd === 2 && !L && gLate;
  const betu = !zaken && !gatrad && wd === 1 && PL && bLate;
  const adu = r.rules.includes('adu');
  return {
    wd, hours: Math.floor(pp / P_HOUR), pp, leap: L, prevLeap: PL, zaken,
    gatrad: { applies: gatrad, checked: !zaken, tuesday: wd === 2, common: !L, late: gLate },
    betu: { applies: betu, checked: !zaken && !gatrad, monday: wd === 1, afterLeap: PL, late: bLate },
    adu: { applies: adu, candidate: r.day - (adu ? 1 : 0) },
  };
}

// ---- absolute tekufot (Shmuel and Rav Adda), in parts from the epoch (same clock as moladTotal)

/** Shmuel's year: 365 days 6 hours. */
export const SHMUEL_YEAR = 365 * P_DAY + 6 * P_HOUR;
/** Rav Adda's year: 365 days 5 hours 997 parts 48 rega'im (76 rega'im = 1 part). Fractional parts. */
export const RAV_ADDA_YEAR = 365 * P_DAY + 5 * P_HOUR + 997 + 48 / 76;

/** Molad Nisan of year 1 (the 7th month of a common year). */
const MOLAD_NISAN_1 = moladTotal(1, 6);

/**
 * Tekufat Nisan, Shmuel: 7 days 9 hours 642 parts before molad Nisan of year 1, then + Shmuel's year each year.
 * (Hilchot Kiddush HaChodesh 9:3, "ז״ט תרמ״ב". Also checked against Birkat HaChama 5769.)
 */
export const tekufaNisanShmuel = (y: number): number => MOLAD_NISAN_1 - (7 * P_DAY + 9 * P_HOUR + 642) + (y - 1) * SHMUEL_YEAR;

/**
 * Tekufat Nisan, Rav Adda: 9 hours 642 parts before molad Nisan of year 1, then + Rav Adda's year each year.
 * (Hilchot Kiddush HaChodesh 10:1 for the year, 10:3 "ט׳ תרמ״ב" for the start, every first year of a cycle.)
 */
export const tekufaNisanRavAdda = (y: number): number => MOLAD_NISAN_1 - (9 * P_HOUR + 642) + (y - 1) * RAV_ADDA_YEAR;

/** The four tekufot of Hebrew year y: [Tishrei (before Nisan), Tevet, Nisan, Tammuz], each a quarter year apart. */
export function tekufotAbsolute(y: number, which: 'shmuel' | 'ravAdda'): [number, number, number, number] {
  const n = which === 'shmuel' ? tekufaNisanShmuel(y) : tekufaNisanRavAdda(y);
  const q = (which === 'shmuel' ? SHMUEL_YEAR : RAV_ADDA_YEAR) / 4;
  return [n - 2 * q, n - q, n, n + q];
}

// ---- adding remainders the Rambam's way (Kiddush HaChodesh 6:9): parts carry into hours, hours into days,
//      and whole weeks are dropped. Returns every intermediate, for the slides that show the carrying.

export interface DhpSum {
  /** the two summands */
  a: DHP; b: DHP;
  /** parts: raw sum, carried hours, what is left */
  pRaw: number; pCarry: number; p: number;
  /** hours: raw sum (with the carry), carried days, what is left */
  hRaw: number; hCarry: number; h: number;
  /** days: raw sum (with the carry), whole weeks dropped, what is left (0–6) */
  dRaw: number; weeks: number; d: number;
}

export function addDHP(a: DHP, b: DHP): DhpSum {
  const pRaw = a.p + b.p, pCarry = Math.floor(pRaw / P_HOUR), p = pRaw % P_HOUR;
  const hRaw = a.h + b.h + pCarry, hCarry = Math.floor(hRaw / 24), h = hRaw % 24;
  const dRaw = a.d + b.d + hCarry, weeks = Math.floor(dRaw / 7), d = dRaw % 7;
  return { a, b, pRaw, pCarry, p, hRaw, hCarry, h, dRaw, weeks, d };
}

/** The Rambam counts weekdays from 1 (א = Sunday); this module from 0. A molad "on day 1" is { d: 0 }. */
export const dhpOf = (t: number): DHP => splitParts(wk(t));

// ---- the Rambam's ways to the tekufa (Kiddush HaChodesh 9:4–7, 10:5): by the excess of the solar year over
//      the lunar year, reduced by lunar months and added to molad Nisan; and the day of the month (9:6).

// Rav Adda's year has 48/76 of a part: these constants are computed in rega'im (76 to a part) to stay exact.
const RAV_ADDA_REGAIM = (365 * P_DAY + 5 * P_HOUR + 997) * 76 + 48;

/** Excess of the solar year over 12 lunar months, in parts (Shmuel 10d 21h 204p, 9:4; Rav Adda 10d 21h 121p 48r, 10:1). */
export const YEAR_EXCESS = { shmuel: SHMUEL_YEAR - 12 * P_MONTH, ravAdda: (RAV_ADDA_REGAIM - 12 * 76 * P_MONTH) / 76 } as const;
/** Excess of 19 solar years over 235 months: Shmuel 1h 485p (9:2), Rav Adda none (10:1). */
export const CYCLE_EXCESS = { shmuel: 19 * SHMUEL_YEAR - 235 * P_MONTH, ravAdda: (19 * RAV_ADDA_REGAIM - 235 * 76 * P_MONTH) / 76 } as const;
/** How far tekufat Nisan of year 1 falls before molad Nisan: 7d 9h 642p (9:3) or 9h 642p (10:3). */
export const TEKUFA_LEAD = { shmuel: 7 * P_DAY + 9 * P_HOUR + 642, ravAdda: 9 * P_HOUR + 642 } as const;

/** Molad Nisan of year y (absolute parts). */
export const moladNisan = (y: number): number => moladTotal(y, isLeap(y) ? 7 : 6);

export interface TekufaSteps {
  which: 'shmuel' | 'ravAdda';
  /** whole 19-year cycles before y, and whole years elapsed in the current one */
  cycles: number; years: number;
  /** cycles × cycle excess + years × year excess (parts, may be fractional for Rav Adda) */
  sum: number;
  /** sum − the lead of year 1 */
  less: number;
  /** whole lunar months dropped, and what is left (< one month; negative only in a first year of a cycle, 10:3) */
  months: number; rem: number;
  moladNisan: number;
  /** the tekufa: moladNisan + rem, or one month less when it falls before molad Nisan (then `before` is set) */
  tekufa: number;
  before: boolean;
}

/** Tekufat Nisan of year y the Rambam's way (9:4 for Shmuel, 10:5 for Rav Adda). */
export function tekufaSteps(y: number, which: 'shmuel' | 'ravAdda'): TekufaSteps {
  const cycles = Math.floor((y - 1) / 19), years = (y - 1) % 19;
  const sum = cycles * CYCLE_EXCESS[which] + years * YEAR_EXCESS[which];
  const less = sum - TEKUFA_LEAD[which];
  const months = less < 0 ? 0 : Math.floor(less / P_MONTH), rem = less - months * P_MONTH;
  const mn = moladNisan(y), abs = which === 'shmuel' ? tekufaNisanShmuel(y) : tekufaNisanRavAdda(y);
  // The remainder fixes the moment within the lunar month; whether that is after molad Nisan or a month earlier
  // (the tekufa can precede the molad by up to about two weeks) is read from the absolute tekufa.
  const before = mn + rem - abs > P_MONTH / 2;
  return { which, cycles, years, sum, less, months, rem, moladNisan: mn, tekufa: before ? mn + rem - P_MONTH : mn + rem, before };
}

export interface TekufaDay {
  /** whole years elapsed in the 19-year cycle */
  years: number;
  /** 11 × years + 7, and its remainder after dropping 30s */
  days: number; rem: number;
  /** month counted from: Nisan, or Adar II in a leap year (as the Rambam writes) */
  from: string;
  /** weekday (0 = Sunday) of the 1st of that month, of the day the count reaches, and of the tekufa (Shmuel, 9:4) */
  startWd: number; landWd: number; tekWd: number;
  /** days added to reach the tekufa's weekday (9:8: one, two or three) */
  added: number;
  /** day of that month on which the count puts the tekufa */
  day: number;
  /** the tekufa's actual date (from the absolute tekufa, 9:3), for comparison */
  actual: { name: string; d: number };
  /**
   * Leap years only, an addition of this site (not the Rambam's words): the count from Adar II carried on into Nisan
   * when it passes the 29 days of Adar II; and when it falls in the first half of Adar II, four weeks later (the same
   * weekday) in Nisan, because in a leap year tekufat Nisan falls between the middle of Adar II and the middle of
   * Nisan (4:2). In his era this is the actual date every year. Null in a common year.
   */
  leap: { name: string; d: number; shifted: boolean } | null;
}

/**
 * The day of the month of tekufat Nisan (Shmuel), by the Rambam's short way (9:6–8).
 * The constant 7 fits his era ("בזמנים אלו"): the tekufa gains 1h 485p on the molad every cycle, so far from it the count drifts.
 */
export function tekufaDay(y: number): TekufaDay {
  const years = (y - 1) % 19, days = 11 * years + 7, rem = days % 30;
  const L = isLeap(y), mi = 6;   // Nisan in a common year, Adar II in a leap year: both index 6
  const start = monthStart(y, mi), startWd = start % 7;
  const landWd = (start + rem - 1) % 7, tekWd = Math.floor(tekufotShmuel(y).nisan / 24) % 7;
  const added = (tekWd - landWd + 7) % 7;
  const act = hebDate(Math.floor(tekufaNisanShmuel(y) / P_DAY));
  let leap: TekufaDay['leap'] = null;
  if (L) {
    const at = start + rem + added - 1, h = hebDate(at), shifted = h.name === 'אדר ב׳' && h.d < 15, f = shifted ? hebDate(at + 28) : h;
    leap = { name: f.name, d: f.d, shifted };
  }
  return { years, days, rem, from: L ? 'אדר ב׳' : 'ניסן', startWd, landWd, tekWd, added, day: rem + added, actual: { name: act.name, d: act.d }, leap };
}
