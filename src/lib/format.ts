// Plain-string formatters shared by the UI. No math beyond presentation; numbers stay numbers.
// Components wrap the returned numeric strings in <Num> for LTR isolation.

import { DAY_LETTER, DAY_NAME, P_WEEK, civil, gDate, splitParts } from '../engines/calendar';
import { SIGNS } from '../engines/rambam';

export const NUM = (n: number): string => n.toLocaleString('en-US');

export const wk = (t: number): number => ((t % P_WEEK) + P_WEEK) % P_WEEK;

/** Weekday index (0 = Sunday) → "יום שני" / "שבת". */
export function dayWord(i: number): string {
  i = ((i % 7) + 7) % 7;
  return i === 6 ? 'שבת' : 'יום ' + DAY_NAME[i];
}

/** "1,234 ימים, 5 שעות, 204 חלקים" */
export function dhp(t: number): string {
  const { d, h, p } = splitParts(t);
  return `${NUM(d)} ימים, ${h} שעות, ${p} חלקים`;
}

/** "יום ב׳, 5 שעות, 204 חלקים" */
export function moladLong(t: number): string {
  const { d, h, p } = splitParts(wk(t));
  return `יום ${DAY_LETTER[d]}׳, ${h} שעות, ${p} חלקים`;
}

export interface CivilText { day: string; time: string; remText: string }

/** Molad → civil clock pieces: "יום ראשון", "23:11", "ו־6 חלקים". */
export function civilText(t: number): CivilText {
  const c = civil(t);
  return {
    day: c.day === 'שבת' ? 'שבת' : 'יום ' + c.day,
    time: c.time,
    remText: c.rem ? (c.rem === 1 ? 'חלק אחד' : `${c.rem} חלקים`) : '',
  };
}

/** Day index → "16.09.2023", or '' for years before 100. */
export function gStr(day: number): string {
  const d = gDate(day);
  if (d.getUTCFullYear() < 100) return '';
  return `${String(d.getUTCDate()).padStart(2, '0')}.${String(d.getUTCMonth() + 1).padStart(2, '0')}.${d.getUTCFullYear()}`;
}

/** Arc-minutes → "11° 11′" (with "−" for negatives). */
export function fmtDM(min: number): string {
  const s = min < 0 ? '−' : '';
  const a = Math.abs(Math.round(min)), d = Math.floor(a / 60), m = a % 60;
  return `${s}${d}° ${m}′`;
}

/** Arc-seconds → "35° 38′ 33″". */
export function fmtDMS(sec: number): string {
  const a = Math.abs(sec), d = Math.floor(a / 3600), m = Math.floor((a % 3600) / 60), s = Math.round((a % 60) * 10) / 10;
  return `${sec < 0 ? '−' : ''}${d}° ${m}′ ${s}″`;
}

/** Ecliptic position in arc-minutes → { dm: "7° 9′", sign: "שור" }. */
export function fmtPos(min: number): { dm: string; sign: string } {
  const s = Math.floor(min / 1800);
  return { dm: fmtDM(min - s * 1800), sign: SIGNS[s] };
}

/** Duration in ms → "15:02" (hours:minutes), signed. */
export function hrs(ms: number): string {
  const s = ms < 0 ? '−' : '', a = Math.abs(ms) / 3600000, h = Math.floor(a), m = Math.round((a - h) * 60);
  return m === 60 ? `${s}${h + 1}:00` : `${s}${h}:${String(m).padStart(2, '0')}`;
}

export const RULE_NAME = { zaken: 'מולד זקן', gatrad: 'גטר״ד', betu: 'בטו תקפט', adu: 'לא אד״ו' } as const;
