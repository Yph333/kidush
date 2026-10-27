// Prepare the photographic textures and the star catalogue that ship inside the app (offline).
// Scales the source images down with Chromium's canvas and writes JPEGs to src/assets/space/.
//
//   node tools/textures/prepare.mjs <source-dir>
//
// <source-dir> holds the original files (see src/assets/space/SOURCES.md for where each one comes from):
//   moon/color.jpg      NASA SVS CGI Moon Kit, LROC WAC color mosaic (8K)
//   moon/height.png     NASA SVS CGI Moon Kit, LOLA elevation (8-bit)
//   earth.jpg           NASA Blue Marble (land, ocean, ice), 4K
//   earth-night.jpg     NASA Earth at night (Black Marble composite), 4K
//   earth-water.png     water mask (ocean = white), 4K
//   clouds.png          NASA cloud cover (alpha), 4K
//   stars.json          HYG 4.1 subset (CC BY-SA 4.0)

import { chromium } from 'playwright';
import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { join, resolve } from 'node:path';

const src = resolve(process.argv[2] ?? '');
const out = resolve('src/assets/space');
mkdirSync(out, { recursive: true });

// [source, output, width, height, mode, quality]  mode: rgb | gray | alpha (alpha channel → grayscale)
const JOBS = [
  ['moon/color.jpg', 'moon-color.jpg', 2048, 1024, 'rgb', 0.86],
  ['moon/height.png', 'moon-bump.jpg', 1024, 512, 'gray', 0.9],
  ['earth.jpg', 'earth-day.jpg', 2048, 1024, 'rgb', 0.84],
  ['earth-night.jpg', 'earth-night.jpg', 2048, 1024, 'rgb', 0.82],
  ['earth-water.png', 'earth-water.jpg', 1024, 512, 'gray', 0.8],
  ['clouds.png', 'earth-clouds.jpg', 1024, 512, 'alpha', 0.8],
];

const browser = await chromium.launch();
const page = await browser.newPage();
for (const [from, to, w, h, mode, q] of JOBS) {
  const mime = from.endsWith('.png') ? 'image/png' : 'image/jpeg';
  const url = `data:${mime};base64,${readFileSync(join(src, from)).toString('base64')}`;   // pages can't read file:// images
  const dataUrl = await page.evaluate(async ({ url, w, h, mode, q }) => {
    const img = new Image();
    img.src = url;
    await img.decode();
    const c = document.createElement('canvas');
    c.width = w; c.height = h;
    const g = c.getContext('2d');
    g.imageSmoothingQuality = 'high';
    g.drawImage(img, 0, 0, w, h);
    if (mode !== 'rgb') {
      const d = g.getImageData(0, 0, w, h);
      for (let i = 0; i < d.data.length; i += 4) {
        const v = mode === 'alpha' ? d.data[i + 3] : 0.299 * d.data[i] + 0.587 * d.data[i + 1] + 0.114 * d.data[i + 2];
        d.data[i] = d.data[i + 1] = d.data[i + 2] = v; d.data[i + 3] = 255;
      }
      g.putImageData(d, 0, 0);
    }
    return c.toDataURL('image/jpeg', q);
  }, { url, w, h, mode, q });
  const buf = Buffer.from(dataUrl.split(',')[1], 'base64');
  writeFileSync(join(out, to), buf);
  console.log(`${to.padEnd(18)} ${w}x${h}  ${(buf.length / 1024).toFixed(0)} KB`);
}
await browser.close();

// stars: naked-eye stars (mag ≤ 5.5) as compact rows [ra°, dec°, mag, B−V]. Source fields:
// hyg_id, ra_hours, dec_degrees, apparent_magnitude, bv_color_index (HYG 4.1, J2000, CC BY-SA 4.0)
const cat = JSON.parse(readFileSync(join(src, 'stars.json'), 'utf8'));
const F = cat.fields, iRa = F.indexOf('ra_hours'), iDec = F.indexOf('dec_degrees'), iMag = F.indexOf('apparent_magnitude'), iBv = F.indexOf('bv_color_index');
const rows = cat.stars
  .filter(s => s[iMag] <= 5.5)
  .map(s => [+(s[iRa] * 15).toFixed(2), +s[iDec].toFixed(2), +s[iMag].toFixed(2), +(Number.isFinite(s[iBv]) ? s[iBv] : 0.6).toFixed(2)]);
const source = `${cat.catalog}, ${cat.author}, ${cat.source} (${cat.license}); mag <= 5.5, rounded`;
writeFileSync(join(out, 'stars.json'), JSON.stringify({ source, fields: ['ra_deg', 'dec_deg', 'mag', 'bv'], stars: rows }));
console.log(`stars.json         ${rows.length} stars`);
