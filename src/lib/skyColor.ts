// The colour of the sky by the Sun's altitude: zenith and horizon colours from day through civil and nautical
// twilight to night. An illustration tuned by eye to twilight photographs, not a radiative model. Pure.

function lerpHex(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}

// [sun altitude°, zenith colour, horizon colour], from high Sun to night
const STOPS: [number, string, string][] = [
  [12, '#4A8FCB', '#B9DCF2'],
  [0, '#5D8FC6', '#F2C58C'],
  [-4, '#344F88', '#E58A5C'],
  [-8, '#1A2655', '#58497A'],
  [-14, '#070C20', '#121A38'],
];

/** [zenith, horizon] colours for the Sun at `alt` degrees. */
export function skyCols(alt: number): [string, string] {
  if (alt >= STOPS[0][0]) return [STOPS[0][1], STOPS[0][2]];
  const last = STOPS[STOPS.length - 1];
  if (alt <= last[0]) return [last[1], last[2]];
  for (let i = 0; i < STOPS.length - 1; i++) {
    const [a, t1, b1] = STOPS[i], [c, t2, b2] = STOPS[i + 1];
    if (alt <= a && alt >= c) { const t = (a - alt) / (a - c); return [lerpHex(t1, t2, t), lerpHex(b1, b2, t)]; }
  }
  return [last[1], last[2]];
}

/** One colour for the sky as a whole (between zenith and horizon), for strips and swatches. */
export function skyTone(alt: number): string {
  const [z, h] = skyCols(alt);
  return lerpHex(z, h, 0.45);
}

/** Relative luminance (0 black … 1 white) of a #rrggbb colour. */
export function luminance(hex: string): number {
  const c = [1, 3, 5].map(i => parseInt(hex.substr(i, 2), 16) / 255).map(v => (v <= 0.03928 ? v / 12.92 : ((v + 0.055) / 1.055) ** 2.4));
  return 0.2126 * c[0] + 0.7152 * c[1] + 0.0722 * c[2];
}
