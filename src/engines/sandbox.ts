// "What if there were no dechiya?" — run the fixed calendar over a range of years with any of the
// four dechiyot switched off, and count what goes wrong. Pure; built only on calendar.rhFrom.

import { ALLOWED_LENGTHS, type Dechiya, type DechiyaSkip, isLeap, moladTotal, rhFrom } from './calendar';

export interface Tally {
  count: number;
  /** first year in the range where it happens */
  example: number | null;
}

export interface SandboxResult {
  from: number;
  /** inclusive */
  to: number;
  skip: DechiyaSkip;
  /** Rosh Hashana day index for each year from..to+1 */
  rhDays: number[];
  /** year length → tally */
  lengths: Map<number, Tally>;
  /** lengths outside {353,354,355,383,384,385} */
  forbidden: { len: number; count: number; example: number }[];
  /** Rosh Hashana weekday (0 = Sunday) → tally */
  rhWeekday: Tally[];
  /** Yom Kippur on Friday or Sunday (next to Shabbat) */
  ykNextToShabbat: Tally;
  /** Hoshana Rabba on Shabbat */
  hrOnShabbat: Tally;
  /** Pesach (15 Nisan) on Monday, Wednesday or Friday */
  pesachBDU: Tally;
  /** how often each dechiya actually moved Rosh Hashana */
  applied: Record<Dechiya, number>;
}

const tally = (): Tally => ({ count: 0, example: null });
const hit = (t: Tally, y: number) => { t.count++; if (t.example === null) t.example = y; };

/** Rosh Hashana of year y with some dechiyot switched off. */
export function rhWithout(y: number, skip: DechiyaSkip) {
  return rhFrom(moladTotal(y), isLeap(y), isLeap(y - 1), skip);
}

export function runSandbox(from: number, count: number, skip: DechiyaSkip): SandboxResult {
  const to = from + count - 1;
  const rhDays: number[] = [];
  const applied: Record<Dechiya, number> = { zaken: 0, gatrad: 0, betu: 0, adu: 0 };
  for (let y = from; y <= to + 1; y++) {
    const r = rhWithout(y, skip);
    rhDays.push(r.day);
    if (y <= to) for (const k of r.rules) applied[k]++;
  }

  const lengths = new Map<number, Tally>();
  const rhWeekday = Array.from({ length: 7 }, tally);
  const ykNextToShabbat = tally(), hrOnShabbat = tally(), pesachBDU = tally();

  for (let i = 0; i < count; i++) {
    const y = from + i, d = rhDays[i], next = rhDays[i + 1];
    const len = next - d;
    if (!lengths.has(len)) lengths.set(len, tally());
    hit(lengths.get(len)!, y);
    hit(rhWeekday[d % 7], y);
    const yk = (d + 9) % 7;          // 10 Tishrei
    if (yk === 5 || yk === 0) hit(ykNextToShabbat, y);
    if ((d + 20) % 7 === 6) hit(hrOnShabbat, y);   // 21 Tishrei
    const pesach = (next - 163) % 7; // 15 Nisan is 163 days before the next Rosh Hashana
    if (pesach === 1 || pesach === 3 || pesach === 5) hit(pesachBDU, y);
  }

  const allowed: readonly number[] = ALLOWED_LENGTHS;
  const forbidden = [...lengths.entries()]
    .filter(([len]) => !allowed.includes(len))
    .map(([len, t]) => ({ len, count: t.count, example: t.example! }))
    .sort((a, b) => a.len - b.len);

  return { from, to, skip, rhDays, lengths, forbidden, rhWeekday, ykNextToShabbat, hrOnShabbat, pesachBDU, applied };
}
