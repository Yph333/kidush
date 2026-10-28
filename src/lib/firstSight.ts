// For each month of a year: the first evening the new moon is seen, by the Rambam's calculation (ch. 17) and by a
// modern criterion (Odeh, Jerusalem). Pure: engine calls only. For the comparison table of ch. 17.

import { CITIES, localParts } from '../engines/astro';
import { dayOfCivil, monthStart, monthsOf } from '../engines/calendar';
import { rambam, rambamD0 } from '../engines/rambam';
import { monthModel } from './month';

export interface FirstSight { mi: number; name: string; start: number; rambam: number | null; modern: number | null }

/** Day indices (the Hebrew day whose evening it is) of the first sighting, searched from 3 days before the 1st. */
export function firstSightings(y: number): FirstSight[] {
  return monthsOf(y).map(([name], mi) => {
    const start = monthStart(y, mi);
    let rb: number | null = null;
    for (let d = start - 3; d <= start + 3 && start - 3 > rambamD0(); d++) if (rambam(d).visible) { rb = d; break; }
    const M = monthModel(y, mi, CITIES[0]);
    let md: number | null = null;
    if (M.first) { const p = localParts(M.first.ss); md = dayOfCivil(p.y, p.m, p.d) + 1; }
    return { mi, name, start, rambam: rb, modern: md };
  });
}
