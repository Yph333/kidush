// Build-time: the twelve zodiac constellations (stick figures and IAU boundaries) from d3-celestial
// (Olaf Frohn, BSD-3-Clause, https://github.com/ofrohn/d3-celestial), trimmed to what the zodiac scene needs.
// Usage: node tools/sources/zodiac-constellations.mjs <path to the unpacked d3-celestial package/data>
// Writes src/assets/space/zodiac.json. Coordinates: J2000 right ascension (−180…180°) and declination.

import { readFileSync, writeFileSync } from 'node:fs';

const dir = process.argv[2];
if (!dir) { console.error('usage: node tools/sources/zodiac-constellations.mjs <d3-celestial/data>'); process.exit(1); }
const IDS = ['Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc'];
const r2 = v => Math.round(v * 100) / 100;
const pick = file => Object.fromEntries(JSON.parse(readFileSync(`${dir}/${file}`, 'utf8')).features
  .filter(f => IDS.includes(f.id)).map(f => [f.id, f.geometry]));

const lines = pick('constellations.lines.json'), bounds = pick('constellations.bounds.json');
const out = {
  source: 'd3-celestial 0.7.35, Olaf Frohn, BSD-3-Clause (https://github.com/ofrohn/d3-celestial); J2000 RA/Dec in degrees',
  ids: IDS,
  lines: Object.fromEntries(IDS.map(id => [id, lines[id].coordinates.map(l => l.map(([a, d]) => [r2(a), r2(d)]))])),
  bounds: Object.fromEntries(IDS.map(id => {
    const g = bounds[id];
    const rings = g.type === 'Polygon' ? g.coordinates : g.coordinates.flat();
    return [id, rings.map(r => r.map(([a, d]) => [r2(a), r2(d)]))];
  })),
};
writeFileSync('src/assets/space/zodiac.json', JSON.stringify(out));
console.log('wrote src/assets/space/zodiac.json', JSON.stringify(out).length, 'bytes');
