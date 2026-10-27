// The halachic rules of chapters 2–5 and 18 that can be stated as small pure functions, for the teaching slides.
// Each one carries its source; none decides halacha, they only lay out the Rambam's words.

import { P_DAY, P_MONTH, isLeap, monthStart, monthsOf, tekufaNisanRavAdda, tekufaNisanShmuel } from './calendar';

/** 2:5: two witnesses' estimates of the moon's height (in "קומות") join if they differ by one at most. */
export const heightsJoin = (a: number, b: number): boolean => Math.abs(a - b) <= 1;

/** 4:4: the aviv in Judea, Transjordan and the Galilee. Arrived in two: no leap; in one or none: leap if the fruit has not grown. */
export function avivRule(arrived: readonly boolean[], fruitGrown: boolean): { count: number; leap: boolean } {
  const count = arrived.filter(Boolean).length;
  return { count, leap: count < 2 && !fruitGrown };
}

export type CourtStage =
  | { n: 3; sit: number; result: 'cancel' | 'five' }
  | { n: 5; need: number; result: 'noLeap' | 'seven' }
  | { n: 7; need: number; result: 'leap' | 'noLeap' };

/**
 * 4:9–10: deciding a leap year. Three judges: sit or not (one against two is void); five: needed or not
 * (two against three is void); seven: the majority decides. Counts are of judges saying "sit" / "needed".
 */
export function leapCourt(sit3: number, need5: number, need7: number): CourtStage[] {
  const out: CourtStage[] = [];
  if (sit3 < 2) { out.push({ n: 3, sit: sit3, result: 'cancel' }); return out; }
  out.push({ n: 3, sit: sit3, result: 'five' });
  if (need5 < 3) { out.push({ n: 5, need: need5, result: 'noLeap' }); return out; }
  out.push({ n: 5, need: need5, result: 'seven' });
  out.push({ n: 7, need: need7, result: need7 >= 4 ? 'leap' : 'noLeap' });
  return out;
}

/** 4:2: where tekufat Nisan falls relative to Nisan of year y (day of Nisan, may be ≤ 0 = in Adar), and where it would fall without the leap month. */
export function tekufaInNisan(y: number, which: 'shmuel' | 'ravAdda'): { day: number; leap: boolean; withoutLeap: number | null } {
  const L = isLeap(y), nisan = monthStart(y, L ? 7 : 6);
  const t = which === 'shmuel' ? tekufaNisanShmuel(y) : tekufaNisanRavAdda(y);
  const day = Math.floor(t / P_DAY) - nisan + 1;
  // without the added month, "Nisan" would begin where Adar II begins
  return { day, leap: L, withoutLeap: L ? Math.floor(t / P_DAY) - monthStart(y, 6) + 1 : null };
}

/** 18:6: months made thirty days each, while the moon is not seen: how far ahead of the moon after n months (days). */
export const allFullDrift = (n: number): number => n * 30 - (n * P_MONTH) / P_DAY;

/** 18:9: full (30-day) months in year y of the fixed calendar; the Rambam: never fewer than four, never more than eight. */
export const fullMonths = (y: number): number => monthsOf(y).filter(([, d]) => d === 30).length;

export type WalkDay = { d: number; wd: number; walk: boolean; why?: 'rc' | 'yt' | 'yk' | 'shabbat' };

/**
 * 3:8–13: the days the messengers of Nisan or Tishrei can walk before the festival on the 15th: they leave on the
 * first of the month after sunrise (3:10), and do not walk on Shabbat, Yom Tov or Yom Kippur (3:8). Day 1 counts as a
 * walking day for Nisan; 1 Tishrei is Yom Tov. `rcWd` is the weekday (0 = Sunday) of the first of the month.
 */
export function messengerDays(month: 'nisan' | 'tishrei', rcWd: number | null): WalkDay[] {
  const out: WalkDay[] = [];
  for (let d = 1; d <= 14; d++) {
    const wd = rcWd === null ? -1 : (rcWd + d - 1) % 7;
    let why: WalkDay['why'];
    if (month === 'tishrei' && d === 1) why = 'yt';
    else if (month === 'tishrei' && d === 10) why = 'yk';
    else if (wd === 6) why = 'shabbat';
    out.push({ d, wd, walk: !why, why });
  }
  return out;
}
