// Where on Earth an eclipse is seen: a coarse world grid of visibility, the central path of a total/annular
// solar eclipse, and the regions involved. Built from engine positions; approximate by design (4° grid,
// spherical Earth, parallax applied in altitude only).

import { geoContains } from 'd3-geo';
import { feature } from 'topojson-client';
import type { FeatureCollection, MultiPolygon, Polygon } from 'geojson';
import type { Topology, GeometryCollection } from 'topojson-specification';
import landTopo from 'world-atlas/land-110m.json';
import { D2R, R2D, TofMs, altAz, moonEcl, sunEcl, toEq } from '../engines/astro';
import { type Eclipse, shadowAxis } from '../engines/eclipses';

export const STEP = 4;
const LATS = Array.from({ length: 180 / STEP }, (_, i) => -90 + STEP / 2 + i * STEP);
const LONS = Array.from({ length: 360 / STEP }, (_, i) => -180 + STEP / 2 + i * STEP);

const topo = landTopo as unknown as Topology<{ land: GeometryCollection }>;
export const LAND = feature(topo, topo.objects.land) as unknown as FeatureCollection<Polygon | MultiPolygon>;

let landMask: boolean[] | null = null;
/** true for grid cells whose centre is on land. */
export function isLand(): boolean[] {
  if (!landMask) landMask = LATS.flatMap(lat => LONS.map(lon => LAND.features.some(f => geoContains(f, [lon, lat]))));
  return landMask;
}

export interface Cell { lat: number; lon: number; value: number }

const sn = (a: number) => Math.sin(a * D2R), cs = (a: number) => Math.cos(a * D2R);

/**
 * Visibility grid. Solar: the largest fraction of the sun's diameter covered at any time (sun above the horizon).
 * Lunar: 1 where the moon is above the horizon at some moment of the eclipse (umbral phase, or penumbral).
 */
export function visibilityGrid(e: Eclipse): Cell[] {
  const half = e.kind === 'solar' ? 3 * 3600000 : ((e.semi!.partial || e.semi!.penumbral) * 60000);
  const step = 15 * 60000;
  const times: number[] = [];
  for (let t = e.ms - half; t <= e.ms + half; t += step) times.push(t);
  const frames = times.map(t => {
    const { jd, T } = TofMs(t), eps = 23.439291 - 0.0130042 * T, s = sunEcl(T), m = moonEcl(T);
    const se = toEq(s.lam, 0, eps), me = toEq(m.lam, m.beta, eps);
    const par = Math.asin(6378.14 / m.dist) * R2D;
    return { jd, se, me, par, sd: 0.27245 * par };
  });
  const out: Cell[] = [];
  for (const lat of LATS) for (const lon of LONS) {
    let best = 0;
    for (const f of frames) {
      if (e.kind === 'solar') {
        const sh = altAz(f.se.ra, f.se.dec, lat, lon, f.jd);
        if (sh.alt < -0.8) continue;
        const mh = altAz(f.me.ra, f.me.dec, lat, lon, f.jd);
        const malt = mh.alt - Math.asin(sn(f.par) * cs(mh.alt)) * R2D;
        const sep = Math.acos(Math.min(1, sn(sh.alt) * sn(malt) + cs(sh.alt) * cs(malt) * cs(mh.az - sh.az))) * R2D;
        const c = (0.2666 + f.sd - sep) / (2 * 0.2666);
        if (c > best) best = c;
      } else {
        const mh = altAz(f.me.ra, f.me.dec, lat, lon, f.jd);
        if (mh.alt - f.par > -0.5) { best = 1; break; }
      }
    }
    if (best > 0.01) out.push({ lat, lon, value: Math.min(1, best) });
  }
  return out;
}

/** The central line of a total / annular solar eclipse: where the shadow axis hits the Earth, every 3 minutes. */
export function centralPath(e: Eclipse): [number, number][][] {
  if (e.kind !== 'solar' || e.type === 'partial') return [];
  const segs: [number, number][][] = [];
  let cur: [number, number][] = [];
  for (let t = e.ms - 3 * 3600000; t <= e.ms + 3 * 3600000; t += 3 * 60000) {
    const p = shadowAxis(t);
    if (p.hit) {
      const last = cur[cur.length - 1];
      if (last && Math.abs(last[0] - p.lon) > 180) { segs.push(cur); cur = []; }   // crossed the date line
      cur.push([p.lon, p.lat]);
    } else if (cur.length) { segs.push(cur); cur = []; }
  }
  if (cur.length) segs.push(cur);
  return segs;
}

// ---- regions (coarse, for a sentence like "seen from Europe, North Africa and the Middle East")

interface Box { name: string; lat: [number, number]; lon: [number, number] }
const LAND_REGIONS: Box[] = [
  { name: 'המזרח התיכון', lat: [12, 42], lon: [34, 63] },
  { name: 'צפון אפריקה', lat: [15, 38], lon: [-18, 34] },
  { name: 'אפריקה שמדרום לסהרה', lat: [-36, 15], lon: [-18, 52] },
  { name: 'אירופה', lat: [35, 72], lon: [-25, 45] },
  { name: 'מרכז אמריקה והקריביים', lat: [7, 24], lon: [-118, -59] },
  { name: 'צפון אמריקה', lat: [15, 84], lon: [-170, -50] },
  { name: 'דרום אמריקה', lat: [-56, 13], lon: [-82, -34] },
  { name: 'רוסיה וצפון אסיה', lat: [45, 78], lon: [45, 180] },
  { name: 'הודו ומרכז אסיה', lat: [5, 45], lon: [63, 100] },
  { name: 'מזרח אסיה', lat: [18, 50], lon: [100, 150] },
  { name: 'דרום מזרח אסיה', lat: [-11, 18], lon: [92, 141] },
  { name: 'אוסטרליה וניו זילנד', lat: [-48, -10], lon: [110, 180] },
  { name: 'גרינלנד', lat: [59, 84], lon: [-75, -10] },
  { name: 'אנטארקטיקה', lat: [-90, -60], lon: [-180, 180] },
];
function oceanOf(lat: number, lon: number): string {
  if (lat > 66) return 'הקוטב הצפוני';
  if (lat < -60) return 'האוקיינוס הדרומי';
  if (lon > -70 && lon < 20) return 'האוקיינוס האטלנטי';
  if (lon >= 20 && lon < 120 && lat < 25) return 'האוקיינוס ההודי';
  return 'האוקיינוס השקט';
}
export function regionOf(lat: number, lon: number, land: boolean): string {
  if (land) {
    // Greenland before North America, Central America before North America (order of the list)
    const ordered = [LAND_REGIONS[12], ...LAND_REGIONS.slice(0, 12), LAND_REGIONS[13]];
    for (const b of ordered) if (lat >= b.lat[0] && lat <= b.lat[1] && lon >= b.lon[0] && lon <= b.lon[1]) return b.name;
    return 'איים';
  }
  return oceanOf(lat, lon);
}

/** Regions in a set of cells, most cells first; land regions before oceans. */
export function regionsOf(cells: Cell[]): { land: string[]; sea: string[] } {
  const mask = isLand(), idx = (c: Cell) => Math.round((c.lat + 90 - STEP / 2) / STEP) * LONS.length + Math.round((c.lon + 180 - STEP / 2) / STEP);
  const land = new Map<string, number>(), sea = new Map<string, number>();
  for (const c of cells) {
    const l = mask[idx(c)], r = regionOf(c.lat, c.lon, l), m = l ? land : sea;
    m.set(r, (m.get(r) ?? 0) + 1);
  }
  const sort = (m: Map<string, number>) => [...m.entries()].filter(([, n]) => n >= 2).sort((a, b) => b[1] - a[1]).map(([r]) => r);
  return { land: sort(land), sea: sort(sea) };
}

/** Regions crossed by the central path (land first). */
export function pathRegions(segs: [number, number][][]): string[] {
  const out: string[] = [];
  for (const s of segs) for (const [lon, lat] of s) {
    const land = LAND.features.some(f => geoContains(f, [lon, lat]));
    const r = regionOf(lat, lon, land);
    if (!out.includes(r)) out.push(r);
  }
  return out;
}
