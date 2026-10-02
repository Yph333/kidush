import { P_WEEK, rh, splitParts } from '../../engines/calendar';
import type { MoladValue } from '../../components/MoladControl';

export function findYears(pred: (y: number) => boolean, from: number, to: number, lim: number): number[] {
  const out: number[] = [];
  for (let y = from; y <= to && out.length < lim; y++) if (pred(y)) out.push(y);
  return out;
}

/** Molad Tishrei of year y as weekday / hours / parts. */
export function moladOf(y: number): MoladValue {
  const { d, h, p } = splitParts(rh(y).t % P_WEEK);
  return { d, h, p };
}
