// Build-time: today's country borders around the Land of Israel, for orientation on the maps of the halachot.
// From world-atlas countries-50m (Natural Earth 1:50m admin-0, public domain), the shared borders only (not the
// coasts), clipped to the region and rounded. Writes src/assets/terrain/borders.json. Run: node tools/terrain/build-borders.mjs

import { readFileSync, writeFileSync } from 'node:fs';
import { mesh } from 'topojson-client';

const BOX = [27, 26, 49, 39];
const topo = JSON.parse(readFileSync('node_modules/world-atlas/countries-50m.json', 'utf8'));
const m = mesh(topo, topo.objects.countries, (a, b) => a !== b);   // borders between two countries
const inBox = ([x, y]) => x >= BOX[0] && x <= BOX[2] && y >= BOX[1] && y <= BOX[3];
const r = v => Math.round(v * 100) / 100;
const lines = [];
for (const l of m.coordinates) {
  let cur = [];
  for (const p of l) {
    if (inBox(p)) cur.push([r(p[0]), r(p[1])]);
    else if (cur.length) { if (cur.length > 1) lines.push(cur); cur = []; }
  }
  if (cur.length > 1) lines.push(cur);
}
const out = { source: 'Natural Earth 1:50m admin-0 via world-atlas (public domain); shared borders only, de facto lines as in the data', box: BOX, lines };
writeFileSync('src/assets/terrain/borders.json', JSON.stringify(out));
console.log('borders', lines.length, 'lines', JSON.stringify(out).length, 'bytes');
