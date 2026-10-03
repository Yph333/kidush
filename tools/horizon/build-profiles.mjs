// Build-time: horizon profiles (skyline altitude by azimuth) for the site's cities, from SRTM 1″ elevation
// tiles (public, AWS Terrain Tiles "skadi" mirror). Writes src/content/horizons.json (small). Raw tiles are
// cached in tools/horizon/cache/ and not committed.  Run: npm run horizons
//
// For each city: observer = the DEM ground at the city's coordinates + 1.7 m (eye height). For every azimuth
// (step 2°) march outward to 50 km and take the largest apparent altitude of the terrain:
//   alt = atan((h − h₀) / d) − d / (2·R_eff),   R_eff = R / (1 − k), k = 0.13 (standard terrestrial refraction)
// The profile describes that one point; a street or valley a few hundred metres away can see a different skyline.

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { gunzipSync } from 'node:zlib';

const CITIES = [
  ['ירושלים', 31.778, 35.235], ['חיפה', 32.794, 34.990], ['תל אביב', 32.085, 34.782],
  ['צפת', 32.965, 35.496], ['באר שבע', 31.252, 34.791], ['אילת', 29.558, 34.952],
];
const RADIUS_KM = 50, AZ_STEP = 2, EYE = 1.7, R = 6371000, K = 0.13, REFF = R / (1 - K);
const CACHE = 'tools/horizon/cache';
const N = 3601;                                   // SRTM 1″ tile: 3601 × 3601 int16 big-endian

const tileName = (lat, lon) => `${lat >= 0 ? 'N' : 'S'}${String(Math.abs(lat)).padStart(2, '0')}${lon >= 0 ? 'E' : 'W'}${String(Math.abs(lon)).padStart(3, '0')}`;
const tiles = new Map();

async function loadTile(lat, lon) {
  const name = tileName(lat, lon);
  if (tiles.has(name)) return tiles.get(name);
  mkdirSync(CACHE, { recursive: true });
  const file = `${CACHE}/${name}.hgt`;
  if (!existsSync(file)) {
    const url = `https://s3.amazonaws.com/elevation-tiles-prod/skadi/${name.slice(0, 3)}/${name}.hgt.gz`;
    process.stdout.write(`downloading ${name} … `);
    const res = await fetch(url);
    if (res.status === 404 || res.status === 403) { console.log('no tile (sea)'); tiles.set(name, null); return null; }
    if (!res.ok) throw new Error(`${url}: HTTP ${res.status}`);
    writeFileSync(file, gunzipSync(Buffer.from(await res.arrayBuffer())));
    console.log('ok');
  }
  const buf = readFileSync(file);
  if (buf.length !== N * N * 2) throw new Error(`${file}: unexpected size ${buf.length}`);
  tiles.set(name, buf);
  return buf;
}

/** Bilinear elevation (m); sea / voids → 0. Tiles must be loaded already. */
function elev(lat, lon) {
  const la = Math.floor(lat), lo = Math.floor(lon), t = tiles.get(tileName(la, lo));
  if (!t) return 0;
  const y = (la + 1 - lat) * (N - 1), x = (lon - lo) * (N - 1);
  const r = Math.min(N - 2, Math.floor(y)), c = Math.min(N - 2, Math.floor(x)), fy = y - r, fx = x - c;
  const v = (rr, cc) => { const h = t.readInt16BE((rr * N + cc) * 2); return h < -500 ? 0 : h; };
  return v(r, c) * (1 - fx) * (1 - fy) + v(r, c + 1) * fx * (1 - fy) + v(r + 1, c) * (1 - fx) * fy + v(r + 1, c + 1) * fx * fy;
}

/** Point at distance d (m) and azimuth az (deg) from (lat, lon), spherical. */
function dest(lat, lon, az, d) {
  const φ = lat * Math.PI / 180, λ = lon * Math.PI / 180, θ = az * Math.PI / 180, δ = d / R;
  const φ2 = Math.asin(Math.sin(φ) * Math.cos(δ) + Math.cos(φ) * Math.sin(δ) * Math.cos(θ));
  const λ2 = λ + Math.atan2(Math.sin(θ) * Math.sin(δ) * Math.cos(φ), Math.cos(δ) - Math.sin(φ) * Math.sin(φ2));
  return [φ2 * 180 / Math.PI, λ2 * 180 / Math.PI];
}

const out = {
  source: 'SRTM 1″ (NASA/USGS), דרך AWS Terrain Tiles',
  method: `גובה האופק מחושב עד ${RADIUS_KM} ק״מ, בכל ${AZ_STEP}°, מגובה הקרקע בנקודה + ${EYE} מ׳, עם עקמומיות כדור הארץ ושבירת אור (k=${K}).`,
  built: new Date().toISOString().slice(0, 10),
  cities: {},
};

for (const [name, lat, lon] of CITIES) {
  const dLat = RADIUS_KM / 111, dLon = RADIUS_KM / (111 * Math.cos(lat * Math.PI / 180));
  for (let la = Math.floor(lat - dLat); la <= Math.floor(lat + dLat); la++)
    for (let lo = Math.floor(lon - dLon); lo <= Math.floor(lon + dLon); lo++) await loadTile(la, lo);
  const ground = elev(lat, lon), h0 = ground + EYE;
  const profile = [];
  for (let az = 0; az < 360; az += AZ_STEP) {
    let best = -90;
    for (let d = 100; d <= RADIUS_KM * 1000; d += Math.max(30, d * 0.004)) {
      const [pl, pn] = dest(lat, lon, az, d);
      const a = Math.atan((elev(pl, pn) - h0) / d) - d / (2 * REFF);
      if (a > best) best = a;
    }
    profile.push([az, Math.round(best * 1800 / Math.PI) / 10]);   // degrees, 0.1° resolution
  }
  out.cities[name] = { lat, lon, ground: Math.round(ground), profile };
  const hi = profile.reduce((m, p) => (p[1] > m[1] ? p : m));
  console.log(`${name}: ground ${Math.round(ground)} m, highest skyline ${hi[1]}° at ${hi[0]}°`);
}

writeFileSync('src/content/horizons.json', JSON.stringify(out) + '\n');
