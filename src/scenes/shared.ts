// Plain (three.js-free) pieces shared by the scenes and their slides, so importing them does not pull
// three.js into the main bundle. Scene modules themselves are loaded lazily.

export type TekufaKind = 'true' | 'shmuel' | 'ravAdda';
export const KIND_COLOR: Record<TekufaKind, number> = { true: 0x7fce9c, shmuel: 0xef8f76, ravAdda: 0x88c5d8 };

/** Rambam's wheels: radii used in the drawing (the small one is enlarged to be visible). */
export const BIG = 10, SMALL = 2.6;

/** Same axis convention as the scenes: longitude λ → (cos λ, −sin λ) in the x/z plane. */
const xz = (lon: number, r: number) => { const l = (lon * Math.PI) / 180; return [r * Math.cos(l), -r * Math.sin(l)] as const; };

/** Moon position for a course angle: from the far point of the small circle, moving against the big circle's motion. */
export function moonOnWheel(meanLon: number, course: number): { cx: number; cz: number; mx: number; mz: number } {
  const [cx, cz] = xz(meanLon, BIG), [ux, uz] = xz(meanLon, 1), [vx, vz] = xz(meanLon + 90, 1);
  const a = (course * Math.PI) / 180;
  return {
    cx, cz,
    mx: cx + ux * SMALL * Math.cos(a) - vx * SMALL * Math.sin(a),
    mz: cz + uz * SMALL * Math.cos(a) - vz * SMALL * Math.sin(a),
  };
}
