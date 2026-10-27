// Elevation grids bundled with the site (tools/terrain/build-terrain.mjs): decode and sample. Pure.

export interface TerrainGrid { box: [number, number, number, number]; w: number; h: number; step: number; z: Int16Array }

export function decodeTerrain(j: { box: number[]; w: number; h: number; step: number; data: string }): TerrainGrid {
  const bin = atob(j.data), u8 = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) u8[i] = bin.charCodeAt(i);
  return { box: j.box as TerrainGrid['box'], w: j.w, h: j.h, step: j.step, z: new Int16Array(u8.buffer) };
}

/** Elevation (m) at a place, bilinear between grid points; row 0 is the north edge. */
export function elevationAt(g: TerrainGrid, lon: number, lat: number): number {
  const fx = (lon - g.box[0]) / g.step, fy = (g.box[3] - lat) / g.step;
  const x = Math.max(0, Math.min(g.w - 2, Math.floor(fx))), y = Math.max(0, Math.min(g.h - 2, Math.floor(fy)));
  const tx = Math.min(1, Math.max(0, fx - x)), ty = Math.min(1, Math.max(0, fy - y)), at = (i: number, j: number) => g.z[j * g.w + i];
  return (at(x, y) * (1 - tx) + at(x + 1, y) * tx) * (1 - ty) + (at(x, y + 1) * (1 - tx) + at(x + 1, y + 1) * tx) * ty;
}

/** Colour for an elevation (m): sea by depth, then green lowlands, tan hills, brown mountains, pale peaks. */
export function hypsometric(m: number): [number, number, number] {
  const stops: [number, [number, number, number]][] = m < 0
    ? [[-3000, [0.05, 0.12, 0.3]], [-200, [0.12, 0.3, 0.52]], [-1, [0.22, 0.45, 0.62]]]
    : [[0, [0.36, 0.52, 0.32]], [300, [0.56, 0.6, 0.38]], [800, [0.7, 0.6, 0.42]], [1500, [0.58, 0.45, 0.33]], [2500, [0.85, 0.83, 0.8]]];
  if (m <= stops[0][0]) return stops[0][1];
  for (let i = 1; i < stops.length; i++) if (m <= stops[i][0]) {
    const [a, ca] = stops[i - 1], [b, cb] = stops[i], t = (m - a) / (b - a);
    return [ca[0] + (cb[0] - ca[0]) * t, ca[1] + (cb[1] - ca[1]) * t, ca[2] + (cb[2] - ca[2]) * t];
  }
  return stops[stops.length - 1][1];
}
