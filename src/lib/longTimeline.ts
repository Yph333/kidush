// The calendar against the seasons over centuries: Pesach vs. the March equinox, Shmuel's and Rav Adda's
// tekufot vs. the true equinox, and the start of "tal u-matar" outside Israel. Pure; engine calls only.

import { P_DAY, gDate, pesachDay, tekufaNisanRavAdda, tekufaNisanShmuel, tekufotAbsolute } from '../engines/calendar';
import { moladMs, seasons } from '../engines/astro';

const DAY = 86400000;

export interface YearPoint {
  y: number;
  /** civil (Gregorian, proleptic) year of Nisan */
  gy: number;
  /** days from the true March equinox to … */
  pesach: number;
  shmuel: number;
  ravAdda: number;
}

/** Days after the March equinox of the same civil year (Pesach measured at noon of its civil day). */
export function yearPoint(y: number): YearPoint {
  const pd = gDate(pesachDay(y)), gy = pd.getUTCFullYear();
  const eq = seasons(gy)[0];
  return {
    y, gy,
    pesach: (pd.getTime() + DAY / 2 - eq) / DAY,
    shmuel: (moladMs(tekufaNisanShmuel(y)) - eq) / DAY,
    ravAdda: (moladMs(tekufaNisanRavAdda(y)) - eq) / DAY,
  };
}

export function yearSeries(from: number, count: number, step = 1): YearPoint[] {
  const out: YearPoint[] = [];
  for (let y = from; y < from + count; y += step) out.push(yearPoint(y));
  return out;
}

/**
 * Outside Israel, the request for rain starts at Maariv of the 60th day from Shmuel's tekufat Tishrei,
 * counting the Hebrew day of the tekufa (days begin in the evening) as day 1 — i.e. the evening that begins
 * Hebrew day (tekufa day + 59).
 * (Shulchan Aruch OC 117:1: "בתפלת ערבית של יום ס׳ אחרי תקופת תשרי". The counting gives 4 Dec, or 5 Dec
 * before a civil leap year — the dates in use today; see longTimeline.test.ts.)
 * Returns the civil date of that evening for Hebrew year y (tekufat Tishrei before Nisan of y).
 */
export function talUmatarEvening(y: number): Date {
  const day = Math.floor(tekufotAbsolute(y, 'shmuel')[0] / P_DAY);   // Hebrew day containing the tekufa
  return new Date(gDate(day + 59).getTime() - DAY);                  // its evening falls on the previous civil date
}

/** Centered moving average (window w, shrinking at the ends). */
export function movingAverage(v: number[], w = 19): number[] {
  const h = Math.floor(w / 2);
  return v.map((_, i) => {
    const a = Math.max(0, i - h), b = Math.min(v.length, i + h + 1);
    let sum = 0;
    for (let k = a; k < b; k++) sum += v[k];
    return sum / (b - a);
  });
}
