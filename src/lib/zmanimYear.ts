// Series of zmanim over many days (for the charts and the annual table). Pure; engine calls only.

import { type ZPlace, zman } from '../engines/zmanim';
import { ilOffset } from '../engines/astro';
import { ZMAN_BY_ID } from '../content/zmanimOpinions';

export interface CivilDay { y: number; m: number; d: number }

/** Every civil day from (y, m, d) for `count` days. */
export function daysFrom(start: CivilDay, count: number): CivilDay[] {
  const out: CivilDay[] = [];
  const t0 = Date.UTC(start.y, start.m, start.d);
  for (let i = 0; i < count; i++) {
    const g = new Date(t0 + i * 86400000);
    out.push({ y: g.getUTCFullYear(), m: g.getUTCMonth(), d: g.getUTCDate() });
  }
  return out;
}

/** Local clock time in hours (e.g. 5.75 = 05:45), Israel time zone. */
export function localHours(ms: number): number {
  const d = new Date(ms + ilOffset(ms) * 3600000);
  return d.getUTCHours() + d.getUTCMinutes() / 60 + d.getUTCSeconds() / 3600;
}

/** For each day, the UTC ms of each opinion id (null when undefined that day). */
export function zmanimSeries(days: CivilDay[], p: ZPlace, ids: string[]): Record<string, (number | null)[]> {
  const out: Record<string, (number | null)[]> = {};
  for (const id of ids) {
    const def = ZMAN_BY_ID.get(id)?.def;
    out[id] = days.map(c => (def ? zman(def, { ...c, p }) : null));
  }
  return out;
}

/** CSV text (UTF-8 with BOM so spreadsheet apps read Hebrew), comma separated, quoted where needed. */
export function toCsv(header: string[], rows: string[][]): string {
  const q = (s: string) => (/[",\n]/.test(s) ? `"${s.replace(/"/g, '""')}"` : s);
  return '﻿' + [header, ...rows].map(r => r.map(q).join(',')).join('\r\n') + '\r\n';
}
