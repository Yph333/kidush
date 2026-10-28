// Where on Earth the new crescent can be seen on one evening (Kiddush HaChodesh 18:13–16): the Odeh criterion at the
// sunset of each place, on a coarse grid. Pure: engine calls only. Modern astronomy, for illustration.

import { type OdehZone, odehAt, sunsetLocal } from '../engines/astro';

export interface VisCell { lat: number; lon: number; zone: OdehZone | null }

/** The civil evening (y, m 0-based, d) at each cell's own sunset; `step` in degrees; latitudes −60…60. */
export function visibilityGrid(y: number, m: number, d: number, step = 6): VisCell[] {
  const out: VisCell[] = [];
  for (let lat = -60 + step / 2; lat < 60; lat += step) for (let lon = -180 + step / 2; lon < 180; lon += step) {
    const c = { lat, lon }, ss = sunsetLocal(y, m, d, c);
    out.push({ lat, lon, zone: ss == null ? null : odehAt(true, ss, c).zone });
  }
  return out;
}
