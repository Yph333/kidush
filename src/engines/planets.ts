// Planets: heliocentric positions from Keplerian elements, "Approximate Positions of the Planets"
// (E. M. Standish, JPL/SSD), Table 1, valid 1800–2050 (error ≲ 1′ for the inner planets, a few ′ for the outer).
// Pure functions, J2000 ecliptic frame, AU. Physical data: NASA planetary fact sheets (mean radii, km).

export type PlanetId = 'mercury' | 'venus' | 'earth' | 'mars' | 'jupiter' | 'saturn' | 'uranus' | 'neptune';

/** a (AU), e, I, L, ϖ (long. of perihelion), Ω (long. of node), all deg; then the rates per Julian century. */
type Elements = readonly [number, number, number, number, number, number];
const EL: Record<PlanetId, [Elements, Elements]> = {
  mercury: [[0.38709927, 0.20563593, 7.00497902, 252.2503235, 77.45779628, 48.33076593], [0.00000037, 0.00001906, -0.00594749, 149472.67411175, 0.16047689, -0.12534081]],
  venus: [[0.72333566, 0.00677672, 3.39467605, 181.9790995, 131.60246718, 76.67984255], [0.0000039, -0.00004107, -0.0007889, 58517.81538729, 0.00268329, -0.27769418]],
  earth: [[1.00000261, 0.01671123, -0.00001531, 100.46457166, 102.93768193, 0], [0.00000562, -0.00004392, -0.01294668, 35999.37244981, 0.32327364, 0]],
  mars: [[1.52371034, 0.0933941, 1.84969142, -4.55343205, -23.94362959, 49.55953891], [0.00001847, 0.00007882, -0.00813131, 19140.30268499, 0.44441088, -0.29257343]],
  jupiter: [[5.202887, 0.04838624, 1.30439695, 34.39644051, 14.72847983, 100.47390909], [-0.00011607, -0.00013253, -0.00183714, 3034.74612775, 0.21252668, 0.20469106]],
  saturn: [[9.53667594, 0.05386179, 2.48599187, 49.95424423, 92.59887831, 113.66242448], [-0.0012506, -0.00050991, 0.00193609, 1222.49362201, -0.41897216, -0.28867794]],
  uranus: [[19.18916464, 0.04725744, 0.77263783, 313.23810451, 170.9542763, 74.01692503], [-0.00196176, -0.00004397, -0.00242939, 428.48202785, 0.40805281, 0.04240589]],
  neptune: [[30.06992276, 0.00859048, 1.77004347, -55.12002969, 44.96476227, 131.78422574], [0.00026291, 0.00005105, 0.00035372, 218.45945325, -0.32241464, -0.01262724]],
};

export const PLANETS: readonly PlanetId[] = ['mercury', 'venus', 'earth', 'mars', 'jupiter', 'saturn', 'uranus', 'neptune'];

export const AU_KM = 149597870.7;
const D2R = Math.PI / 180;

/** Julian centuries from J2000.0 (TT ≈ UT here; the difference is far below this model's accuracy). */
export const centuries = (ms: number): number => (ms / 86400000 + 2440587.5 - 2451545.0) / 36525;

export interface Helio {
  /** J2000 ecliptic, AU */
  x: number; y: number; z: number;
  /** distance from the Sun, AU */
  r: number;
  /** ecliptic longitude and latitude, deg */
  lon: number; lat: number;
}

/** Solve Kepler's equation E − e sin E = M (radians). */
export function kepler(M: number, e: number): number {
  let E = M + e * Math.sin(M);
  for (let i = 0; i < 12; i++) {
    const d = (E - e * Math.sin(E) - M) / (1 - e * Math.cos(E));
    E -= d;
    if (Math.abs(d) < 1e-12) break;
  }
  return E;
}

const nrm = (d: number) => ((d % 360) + 360) % 360;

/** Orbital elements at time T (centuries), deg / AU. */
export function elements(id: PlanetId, T: number) {
  const [e0, r] = EL[id];
  const [a, e, I, L, w, O] = e0.map((v, k) => v + r[k] * T);
  return { a, e, I, L, peri: w, node: O, M: nrm(L - w), argPeri: w - O };
}

/** Position in the orbital plane at eccentric anomaly E → J2000 ecliptic. */
function toEcliptic(a: number, e: number, I: number, node: number, argPeri: number, E: number): Helio {
  const xp = a * (Math.cos(E) - e), yp = a * Math.sqrt(1 - e * e) * Math.sin(E);
  const cw = Math.cos(argPeri * D2R), sw = Math.sin(argPeri * D2R), cO = Math.cos(node * D2R), sO = Math.sin(node * D2R);
  const cI = Math.cos(I * D2R), sI = Math.sin(I * D2R);
  const x = (cw * cO - sw * sO * cI) * xp + (-sw * cO - cw * sO * cI) * yp;
  const y = (cw * sO + sw * cO * cI) * xp + (-sw * sO + cw * cO * cI) * yp;
  const z = sw * sI * xp + cw * sI * yp;
  const r = Math.hypot(x, y, z);
  return { x, y, z, r, lon: nrm(Math.atan2(y, x) / D2R), lat: Math.asin(z / r) / D2R };
}

/** Heliocentric position of a planet (for the Earth: the Earth–Moon barycentre) at ms. */
export function helio(id: PlanetId, ms: number): Helio {
  const el = elements(id, centuries(ms));
  return toEcliptic(el.a, el.e, el.I, el.node, el.argPeri, kepler(el.M * D2R, el.e));
}

/** The whole orbit as n points (J2000 ecliptic, AU), for drawing. */
export function orbitPath(id: PlanetId, ms: number, n = 180): Helio[] {
  const el = elements(id, centuries(ms)), out: Helio[] = [];
  for (let k = 0; k <= n; k++) out.push(toEcliptic(el.a, el.e, el.I, el.node, el.argPeri, (2 * Math.PI * k) / n));
  return out;
}

/** Sidereal period, days (Kepler's third law from the mean motion of L). */
export const periodDays = (id: PlanetId): number => 36525 * 360 / EL[id][1][3];

export interface Physical {
  name: string;
  /** mean radius, km */
  radius: number;
  /** sidereal rotation, hours (negative = retrograde) */
  day: number;
  /** north pole of rotation, J2000 equatorial RA / Dec (deg), IAU */
  pole: [number, number];
  color: number;
}

export const SUN = { name: 'השמש', radius: 695700 } as const;

export const PHYS: Record<PlanetId, Physical> = {
  mercury: { name: 'כוכב (מרקורי)', radius: 2439.7, day: 1407.6, pole: [281.01, 61.42], color: 0x9a9590 },
  venus: { name: 'נוגה', radius: 6051.8, day: -5832.6, pole: [272.76, 67.16], color: 0xe6cf98 },
  earth: { name: 'כדור הארץ', radius: 6371.0, day: 23.934, pole: [0, 90], color: 0x3e7cb8 },
  mars: { name: 'מאדים', radius: 3389.5, day: 24.623, pole: [317.68, 52.89], color: 0xc1663f },
  jupiter: { name: 'צדק', radius: 69911, day: 9.925, pole: [268.06, 64.5], color: 0xd2b48c },
  saturn: { name: 'שבתאי', radius: 58232, day: 10.656, pole: [40.59, 83.54], color: 0xe3cf98 },
  uranus: { name: 'אורנוס', radius: 25362, day: -17.24, pole: [257.31, -15.18], color: 0x9fd8e0 },
  neptune: { name: 'נפטון', radius: 24622, day: 16.11, pole: [299.36, 43.46], color: 0x4f73d6 },
};

/** A J2000 equatorial direction (RA, Dec in deg) as a J2000 ecliptic unit vector [x, y, z]. */
export function eqToEcl(ra: number, dec: number): [number, number, number] {
  const eps = 23.4392911 * D2R, cd = Math.cos(dec * D2R);
  const x = cd * Math.cos(ra * D2R), y = cd * Math.sin(ra * D2R), z = Math.sin(dec * D2R);
  return [x, y * Math.cos(eps) + z * Math.sin(eps), -y * Math.sin(eps) + z * Math.cos(eps)];
}

export interface MoonDef {
  name: string;
  planet: PlanetId;
  /** km */
  radius: number;
  /** orbital radius, km */
  a: number;
  /** sidereal period, days (negative = retrograde) */
  period: number;
  color: number;
}

/** The major moons: real sizes, distances and periods (NASA/JPL). Their phase along the orbit is schematic. */
export const MOONS: readonly MoonDef[] = [
  { name: 'פובוס', planet: 'mars', radius: 11.1, a: 9376, period: 0.31891, color: 0x8c7b6b },
  { name: 'דימוס', planet: 'mars', radius: 6.2, a: 23463, period: 1.26244, color: 0x9a8a78 },
  { name: 'איו', planet: 'jupiter', radius: 1821.6, a: 421700, period: 1.769138, color: 0xe8d25a },
  { name: 'אירופה', planet: 'jupiter', radius: 1560.8, a: 671034, period: 3.551181, color: 0xd9cdb2 },
  { name: 'גנימד', planet: 'jupiter', radius: 2634.1, a: 1070412, period: 7.154553, color: 0xa79e92 },
  { name: 'קליסטו', planet: 'jupiter', radius: 2410.3, a: 1882709, period: 16.689017, color: 0x6e6559 },
  { name: 'מימאס', planet: 'saturn', radius: 198.2, a: 185539, period: 0.942422, color: 0xbdbdbd },
  { name: 'אנקלדוס', planet: 'saturn', radius: 252.1, a: 237948, period: 1.370218, color: 0xf2f2f2 },
  { name: 'טתיס', planet: 'saturn', radius: 531.1, a: 294619, period: 1.887802, color: 0xd8d8d8 },
  { name: 'דיונה', planet: 'saturn', radius: 561.4, a: 377396, period: 2.736915, color: 0xcfcfcf },
  { name: 'ריאה', planet: 'saturn', radius: 763.8, a: 527108, period: 4.518212, color: 0xc8c8c8 },
  { name: 'טיטאן', planet: 'saturn', radius: 2574.7, a: 1221870, period: 15.945421, color: 0xd9a24e },
  { name: 'יאפטוס', planet: 'saturn', radius: 734.5, a: 3560820, period: 79.3215, color: 0x8e8270 },
  { name: 'מירנדה', planet: 'uranus', radius: 235.8, a: 129390, period: 1.413479, color: 0xbab3a8 },
  { name: 'אריאל', planet: 'uranus', radius: 578.9, a: 191020, period: 2.520379, color: 0xc4bdb3 },
  { name: 'אומבריאל', planet: 'uranus', radius: 584.7, a: 266300, period: 4.144177, color: 0x857e76 },
  { name: 'טיטניה', planet: 'uranus', radius: 788.9, a: 435910, period: 8.705872, color: 0xb2a99c },
  { name: 'אוברון', planet: 'uranus', radius: 761.4, a: 583520, period: 13.463239, color: 0xa39a8e },
  { name: 'טריטון', planet: 'neptune', radius: 1353.4, a: 354759, period: -5.876854, color: 0xc9b9a8 },
];

/** The Earth's Moon, for the same tables. */
export const LUNA = { name: 'הירח', radius: 1737.4, a: 384400, period: 27.321661 } as const;

/** Position angle (rad) of a moon along its orbit at ms: mean motion from J2000 (schematic phase). */
export const moonAngle = (m: MoonDef, ms: number): number => {
  const d = ms / 86400000 + 2440587.5 - 2451545.0;
  const seed = [...m.name].reduce((s, c) => s + c.charCodeAt(0), 0) % 360;   // a fixed, arbitrary starting angle per moon
  return ((seed + (360 * d) / m.period) % 360) * D2R;
};
