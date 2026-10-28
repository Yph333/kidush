// Why the doubled distance (Kiddush HaChodesh 15:1–3): the geometry behind the Rambam's table, from the Greek
// astronomers he names as the source of the reasons (17:24). The big wheel of the moon does not keep its centre:
// the centre turns around the Earth opposite the moon, as far from the sun's line as the moon is on the other side.
// The far point of the small wheel is measured not from the Earth but from a point opposite that centre; the
// angle between the two directions is what the Rambam adds to the course. An illustration of the reason only: the
// Rambam's chain (rambam.ts) uses his own table, and nothing here feeds it.

const D2R = Math.PI / 180;
/** Ptolemy's lunar model (Almagest V): deferent radius 49;41 and eccentricity 10;19 (parts of 60). */
export const PTOLEMY_MOON = { R: 49 + 41 / 60, e: 10 + 19 / 60, r: 5 + 15 / 60 } as const;

export interface Crank {
  /** mean elongation of the moon from the mean sun (deg) = half the doubled distance */
  E: number;
  /** centre of the big wheel, the moon's mean place (centre of the small wheel), the point opposite the centre */
  C: [number, number]; M: [number, number]; N: [number, number];
  /** the angle between Earth→moon and point→moon (deg): what is added to the course */
  add: number;
}

/** The crank for a doubled distance D (deg). Sun's mean direction along +x; angles counter-clockwise. */
export function crank(D: number): Crank {
  const { R, e } = PTOLEMY_MOON, E = D / 2;
  const C: [number, number] = [e * Math.cos(-E * D2R), e * Math.sin(-E * D2R)];
  const u = [Math.cos(E * D2R), Math.sin(E * D2R)], b = u[0] * C[0] + u[1] * C[1], c = C[0] ** 2 + C[1] ** 2 - R * R;
  const t = b + Math.sqrt(b * b - c), M: [number, number] = [u[0] * t, u[1] * t], N: [number, number] = [-C[0], -C[1]];
  const add = (Math.atan2(M[1], M[0]) - Math.atan2(M[1] - N[1], M[0] - N[0])) / D2R;
  return { E, C, M, N, add };
}
