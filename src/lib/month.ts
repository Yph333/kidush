// The data the sky slides need for one Hebrew month at one place (ported from legacy astroapp.js computeMonth).
// Pure: built only from engine calls; cached per (year, month, place).

import { monthStart, monthsOf, moladTotal } from '../engines/calendar';
import {
  DAYMS, HOUR, type OdehResult, type Place, civOf, localMidnight, localParts, moladMs, odeh, phaseNear, sky, sunsetOn,
} from '../engines/astro';

export interface StripDay { d: number; ss: number; k: number; wax: boolean }

export interface MonthModel {
  c: Place & { name: string };
  y: number;
  mi: number;
  name: string;
  /** day index of the 1st of the month */
  start: number;
  len: number;
  /** mean molad (calendar) */
  mean: number;
  /** true conjunction */
  conj: number;
  full: number;
  next: number;
  fq: number;
  lq: number;
  /** evenings around the new moon (Odeh) */
  ev: OdehResult[];
  first: OdehResult | undefined;
  /** mornings before the next new moon */
  mo: OdehResult[];
  last: OdehResult | undefined;
  /** the moon at sunset of each evening of the month */
  strip: StripDay[];
  /** timeline range */
  A: number;
  B: number;
}

const cache = new Map<string, MonthModel>();

export function monthModel(y: number, mi: number, c: Place & { name: string }): MonthModel {
  const key = `${y}|${mi}|${c.name}|${c.lat}|${c.lon}`;
  const hit = cache.get(key);
  if (hit) return hit;

  const start = monthStart(y, mi), len = monthsOf(y)[mi][1];
  const mean = moladMs(moladTotal(y, mi)), conj = phaseNear(mean, 0);
  const full = phaseNear(conj + 14.77 * DAYMS, 180), next = phaseNear(conj + 29.53 * DAYMS, 0);
  const fq = phaseNear(conj + 7.38 * DAYMS, 90), lq = phaseNear(conj + 22.1 * DAYMS, 270);

  const ev: OdehResult[] = [], cp = localParts(conj);
  for (let k = -1; k <= 3; k++) {
    const g = new Date(Date.UTC(cp.y, cp.m, cp.d + k));
    const o = odeh(true, g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), c);
    if (o) ev.push(o);
  }
  const first = ev.find(o => o.zone === 'A' || o.zone === 'B');

  const mo: OdehResult[] = [], np = localParts(next);
  for (let k = -3; k <= 0; k++) {
    const g = new Date(Date.UTC(np.y, np.m, np.d + k));
    const o = odeh(false, g.getUTCFullYear(), g.getUTCMonth(), g.getUTCDate(), c);
    if (o) mo.push(o);
  }
  const last = [...mo].reverse().find(o => o.zone === 'A' || o.zone === 'B');

  const strip: StripDay[] = [];
  for (let d = 1; d <= len; d++) {
    // evening that begins Hebrew day d = civil date of day d-1
    const [a, b, cc] = civOf(start + d - 2);
    const ss = sunsetOn(a, b, cc, c) ?? localMidnight(a, b, cc) + 18 * HOUR;
    const s = sky(ss, c);
    strip.push({ d, ss, k: s.k, wax: s.waxing });
  }

  const A = Math.min(strip[0].ss, mean, conj) - 12 * HOUR;
  const B = Math.max(strip[len - 1].ss + DAYMS, next) + 12 * HOUR;
  const m: MonthModel = { c, y, mi, name: monthsOf(y)[mi][0], start, len, mean, conj, full, next, fq, lq, ev, first, mo, last, strip, A, B };
  cache.set(key, m);
  return m;
}
