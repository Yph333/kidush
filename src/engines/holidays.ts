// Holidays and fasts of a Hebrew year, from the fixed calendar. Pure.
// Covers the biblical and rabbinic days (with the standard postponements of fasts that fall on Shabbat).
// Modern Israeli days (Yom HaShoah, HaZikaron, HaAtzmaut, Yerushalayim) are not included yet.

import { isLeap, monthStart, monthsOf } from './calendar';

export type HolidayKind = 'yomtov' | 'cholhamoed' | 'fast' | 'minor' | 'roshchodesh' | 'chanukah';

export interface Holiday {
  /** day index (weekday = day % 7, 0 = Sunday) */
  day: number;
  name: string;
  kind: HolidayKind;
  /** for postponed fasts: the original date's day index */
  movedFrom?: number;
}

/** Day index of Hebrew date (month name, day) in year y; Adar resolves to Adar II in a leap year. */
export function dayOf(y: number, month: string, d: number): number {
  const ms = monthsOf(y);
  let name = month;
  if (month === 'אדר' && isLeap(y)) name = 'אדר ב׳';
  const mi = ms.findIndex(m => m[0] === name);
  if (mi < 0) throw new Error(`no month ${month} in ${y}`);
  return monthStart(y, mi) + d - 1;
}

export function holidays(y: number, opts: { diaspora?: boolean } = {}): Holiday[] {
  const out: Holiday[] = [];
  const dia = !!opts.diaspora;
  const add = (month: string, d: number, name: string, kind: HolidayKind) => out.push({ day: dayOf(y, month, d), name, kind });
  /** A fast that falls on Shabbat moves: forward to Sunday, or (Taanit Esther) back to Thursday. */
  const fast = (month: string, d: number, name: string, back = false) => {
    const day = dayOf(y, month, d);
    if (day % 7 === 6) out.push({ day: back ? day - 2 : day + 1, name, kind: 'fast', movedFrom: day });
    else out.push({ day, name, kind: 'fast' });
  };

  add('תשרי', 1, 'ראש השנה א׳', 'yomtov');
  add('תשרי', 2, 'ראש השנה ב׳', 'yomtov');
  fast('תשרי', 3, 'צום גדליה');
  add('תשרי', 10, 'יום כיפור', 'yomtov');
  add('תשרי', 15, 'סוכות', 'yomtov');
  if (dia) add('תשרי', 16, 'סוכות ב׳', 'yomtov');
  for (let d = dia ? 17 : 16; d <= 20; d++) add('תשרי', d, 'חול המועד סוכות', 'cholhamoed');
  add('תשרי', 21, 'הושענא רבה', 'cholhamoed');
  add('תשרי', 22, dia ? 'שמיני עצרת' : 'שמיני עצרת ושמחת תורה', 'yomtov');
  if (dia) add('תשרי', 23, 'שמחת תורה', 'yomtov');

  // Chanukah: 25 Kislev for 8 days (into Tevet)
  const ch = dayOf(y, 'כסלו', 25);
  for (let i = 0; i < 8; i++) out.push({ day: ch + i, name: `חנוכה, נר ${['א׳', 'ב׳', 'ג׳', 'ד׳', 'ה׳', 'ו׳', 'ז׳', 'ח׳'][i]}`, kind: 'chanukah' });
  fast('טבת', 10, 'עשרה בטבת');   // can fall on Friday, never on Shabbat
  add('שבט', 15, 'ט״ו בשבט', 'minor');

  if (isLeap(y)) add('אדר א׳', 14, 'פורים קטן', 'minor');
  fast('אדר', 13, 'תענית אסתר', true);
  add('אדר', 14, 'פורים', 'minor');
  add('אדר', 15, 'שושן פורים', 'minor');

  add('ניסן', 15, 'פסח', 'yomtov');
  if (dia) add('ניסן', 16, 'פסח ב׳', 'yomtov');
  for (let d = dia ? 17 : 16; d <= 20; d++) add('ניסן', d, 'חול המועד פסח', 'cholhamoed');
  add('ניסן', 21, 'שביעי של פסח', 'yomtov');
  if (dia) add('ניסן', 22, 'אחרון של פסח', 'yomtov');
  add('אייר', 18, 'ל״ג בעומר', 'minor');
  add('סיוון', 6, 'שבועות', 'yomtov');
  if (dia) add('סיוון', 7, 'שבועות ב׳', 'yomtov');
  fast('תמוז', 17, 'י״ז בתמוז');
  fast('אב', 9, 'תשעה באב');
  add('אב', 15, 'ט״ו באב', 'minor');

  // Rosh Chodesh: the 30th of a full month and the 1st of the next (not Tishrei)
  const ms = monthsOf(y);
  for (let mi = 1; mi < ms.length; mi++) {
    const first = monthStart(y, mi), name = `ראש חודש ${ms[mi][0]}`;
    if (ms[mi - 1][1] === 30) out.push({ day: first - 1, name, kind: 'roshchodesh' });
    out.push({ day: first, name, kind: 'roshchodesh' });
  }

  return out.sort((a, b) => a.day - b.day);
}

/** All holidays on a given day index (looks in the Hebrew year containing it and the next, for Elul/Tishrei edges). */
export function holidaysOn(day: number, y: number, opts: { diaspora?: boolean } = {}): Holiday[] {
  return holidays(y, opts).filter(h => h.day === day);
}
