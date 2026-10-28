// Build-time: elevation grids for the 3D maps of the halachot (Israel in detail, the region from Egypt to Babylon
// coarsely), from the AWS Terrain Tiles ("terrarium" PNG encoding; Tilezen joerd: NASA SRTM and NOAA ETOPO1 in
// this area, both public domain). Raw tiles are cached in tools/terrain/cache/ and not committed.
// Writes src/assets/terrain/<name>.json: { box, w, h, step, data: base64 Int16 little-endian, row 0 = north }.
// Run: node tools/terrain/build-terrain.mjs

import { existsSync, mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { inflateSync } from 'node:zlib';

const CACHE = 'tools/terrain/cache';
const MAPS = [
  { name: 'israel', box: [33.9, 29.4, 36.3, 33.5], step: 0.008, z: 9 },
  { name: 'region', box: [28, 27, 48, 38], step: 0.05, z: 6 },
];

// ---- a minimal PNG decoder: 8-bit RGB / RGBA, non-interlaced (what the terrarium tiles are)
function decodePng(buf) {
  let p = 8, w = 0, h = 0, ct = 0;
  const idat = [];
  while (p < buf.length) {
    const len = buf.readUInt32BE(p), type = buf.toString('latin1', p + 4, p + 8), d = buf.subarray(p + 8, p + 8 + len);
    if (type === 'IHDR') { w = d.readUInt32BE(0); h = d.readUInt32BE(4); ct = d[9]; if (d[8] !== 8 || d[12] !== 0) throw new Error('unsupported PNG'); }
    else if (type === 'IDAT') idat.push(d);
    else if (type === 'IEND') break;
    p += 12 + len;
  }
  const bpp = ct === 6 ? 4 : ct === 2 ? 3 : (() => { throw new Error(`colour type ${ct}`); })();
  const raw = inflateSync(Buffer.concat(idat)), out = Buffer.alloc(w * h * bpp), stride = w * bpp;
  for (let y = 0; y < h; y++) {
    const f = raw[y * (stride + 1)], src = raw.subarray(y * (stride + 1) + 1, (y + 1) * (stride + 1)), row = y * stride;
    for (let x = 0; x < stride; x++) {
      const a = x >= bpp ? out[row + x - bpp] : 0, b = y ? out[row - stride + x] : 0, c = x >= bpp && y ? out[row - stride + x - bpp] : 0;
      let v = src[x];
      if (f === 1) v += a; else if (f === 2) v += b; else if (f === 3) v += (a + b) >> 1;
      else if (f === 4) { const pp = a + b - c, pa = Math.abs(pp - a), pb = Math.abs(pp - b), pc = Math.abs(pp - c); v += pa <= pb && pa <= pc ? a : pb <= pc ? b : c; }
      out[row + x] = v & 255;
    }
  }
  return { w, h, bpp, px: out };
}

const tileXY = (lon, lat, z) => {
  const n = 2 ** z, x = ((lon + 180) / 360) * n, r = (lat * Math.PI) / 180;
  return [x, ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n];
};
const tiles = new Map();
async function tile(z, x, y) {
  const key = `${z}/${x}/${y}`;
  if (tiles.has(key)) return tiles.get(key);
  mkdirSync(CACHE, { recursive: true });
  const file = `${CACHE}/${z}-${x}-${y}.png`;
  if (!existsSync(file)) {
    const res = await fetch(`https://s3.amazonaws.com/elevation-tiles-prod/terrarium/${key}.png`);
    if (!res.ok) throw new Error(`${key}: ${res.status}`);
    writeFileSync(file, Buffer.from(await res.arrayBuffer()));
  }
  const t = decodePng(readFileSync(file));
  tiles.set(key, t);
  return t;
}
async function elevation(lon, lat, z) {
  const [fx, fy] = tileXY(lon, lat, z), tx = Math.floor(fx), ty = Math.floor(fy), t = await tile(z, tx, ty);
  const px = Math.min(255, Math.floor((fx - tx) * 256)), py = Math.min(255, Math.floor((fy - ty) * 256)), i = (py * t.w + px) * t.bpp;
  return Math.round(t.px[i] * 256 + t.px[i + 1] + t.px[i + 2] / 256 - 32768);
}

for (const m of MAPS) {
  const [x0, y0, x1, y1] = m.box, w = Math.round((x1 - x0) / m.step) + 1, h = Math.round((y1 - y0) / m.step) + 1;
  const data = new Int16Array(w * h);
  for (let j = 0; j < h; j++) for (let i = 0; i < w; i++) data[j * w + i] = await elevation(x0 + i * m.step, y1 - j * m.step, m.z);
  const json = { source: 'AWS Terrain Tiles (Tilezen joerd, terrarium): NASA SRTM and NOAA ETOPO1 (public domain) in this area', box: m.box, w, h, step: m.step, data: Buffer.from(data.buffer).toString('base64') };
  writeFileSync(`src/assets/terrain/${m.name}.json`, JSON.stringify(json));
  console.log(m.name, w, 'x', h, JSON.stringify(json).length, 'bytes');
}
