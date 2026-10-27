// Painted surfaces for the planets and Saturn's rings, drawn on canvases at run time (nothing to download):
// bands for the giants, the Great Red Spot, Mars's dark regions and ice caps, cratered Mercury, Venus's clouds.
// They are impressions, not maps.

import type { PlanetId } from '../engines/planets';
import { THREE } from './common';

/** small deterministic random numbers, so a planet looks the same every time */
function rng(seed: number): () => number {
  let s = seed >>> 0;
  return () => { s = (s * 1664525 + 1013904223) >>> 0; return s / 4294967296; };
}

function canvas(w = 1024, h = 512): [HTMLCanvasElement, CanvasRenderingContext2D] {
  const c = document.createElement('canvas');
  c.width = w; c.height = h;
  return [c, c.getContext('2d')!];
}

function bands(ctx: CanvasRenderingContext2D, w: number, h: number, cols: string[], r: () => number, wobble = 0.004) {
  let y = 0;
  while (y < h) {
    const bh = h * (0.025 + r() * 0.07), col = cols[Math.floor(r() * cols.length)];
    ctx.fillStyle = col;
    ctx.beginPath();
    ctx.moveTo(0, y);
    for (let x = 0; x <= w; x += 16) ctx.lineTo(x, y + Math.sin(x * 0.02 + r() * 0.5) * h * wobble);
    ctx.lineTo(w, y + bh); ctx.lineTo(0, y + bh); ctx.closePath(); ctx.fill();
    y += bh * 0.92;
  }
}

function speckle(ctx: CanvasRenderingContext2D, w: number, h: number, r: () => number, n: number, cols: string[], size: [number, number]) {
  for (let i = 0; i < n; i++) {
    ctx.fillStyle = cols[Math.floor(r() * cols.length)];
    ctx.globalAlpha = 0.15 + r() * 0.35;
    ctx.beginPath();
    ctx.ellipse(r() * w, r() * h, size[0] + r() * size[1], (size[0] + r() * size[1]) * (0.6 + r() * 0.4), r() * Math.PI, 0, 2 * Math.PI);
    ctx.fill();
  }
  ctx.globalAlpha = 1;
}

const cache = new Map<string, THREE.Texture>();

export function planetTexture(id: Exclude<PlanetId, 'earth'>): THREE.Texture {
  const hit = cache.get(id);
  if (hit) return hit;
  const [c, ctx] = canvas(), w = c.width, h = c.height, r = rng(id.length * 7919 + id.charCodeAt(0));
  switch (id) {
    case 'mercury':
      ctx.fillStyle = '#8f8a84'; ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, r, 900, ['#6d6964', '#a7a29b', '#57534f'], [2, 9]);
      for (let i = 0; i < 160; i++) {           // craters: a dark floor and a bright rim
        const x = r() * w, y = r() * h, s = 2 + r() * 14;
        ctx.strokeStyle = 'rgba(220,215,205,.35)'; ctx.lineWidth = 1.5; ctx.beginPath(); ctx.arc(x, y, s, 0, 7); ctx.stroke();
        ctx.fillStyle = 'rgba(60,57,53,.35)'; ctx.beginPath(); ctx.arc(x + 1, y + 1, s * 0.8, 0, 7); ctx.fill();
      }
      break;
    case 'venus':
      ctx.fillStyle = '#e3c98f'; ctx.fillRect(0, 0, w, h);
      bands(ctx, w, h, ['#e9d3a0', '#d9bd82', '#f0dcae', '#cfae72'], r, 0.03);
      ctx.filter = 'blur(6px)'; ctx.drawImage(c, 0, 0); ctx.filter = 'none';
      break;
    case 'mars': {
      ctx.fillStyle = '#b8603a'; ctx.fillRect(0, 0, w, h);
      speckle(ctx, w, h, r, 500, ['#8e4426', '#c97a4f', '#6f3a24', '#a35532'], [6, 40]);
      ctx.fillStyle = 'rgba(80,40,25,.55)';     // a long dark band near the equator, like Valles Marineris and the dark plains
      ctx.beginPath(); ctx.ellipse(w * 0.35, h * 0.55, w * 0.18, h * 0.05, 0.05, 0, 7); ctx.fill();
      const cap = (y: number) => { const g = ctx.createLinearGradient(0, y, 0, y + (y ? -1 : 1) * h * 0.09); g.addColorStop(0, '#f4f1ec'); g.addColorStop(1, 'rgba(244,241,236,0)'); ctx.fillStyle = g; ctx.fillRect(0, y ? y - h * 0.09 : 0, w, h * 0.09); };
      cap(0); cap(h);
      break;
    }
    case 'jupiter':
      bands(ctx, w, h, ['#d8c3a5', '#c49a6c', '#e8dcc8', '#b07d52', '#d9b38c', '#f1e7d6', '#9c6b45'], r, 0.006);
      ctx.fillStyle = '#b5523b';               // the Great Red Spot, about 22° south
      ctx.beginPath(); ctx.ellipse(w * 0.62, h * 0.62, w * 0.035, h * 0.03, 0, 0, 7); ctx.fill();
      ctx.strokeStyle = 'rgba(240,225,205,.6)'; ctx.lineWidth = 3; ctx.stroke();
      break;
    case 'saturn':
      bands(ctx, w, h, ['#e3d2a6', '#d6bf8a', '#ead9b1', '#c9ae78', '#efe2c0'], r, 0.003);
      break;
    case 'uranus':
      bands(ctx, w, h, ['#a6dde4', '#9cd3dc', '#afe2e8'], r, 0.002);
      break;
    case 'neptune':
      bands(ctx, w, h, ['#4a6fd4', '#3f63c7', '#5a7fe0', '#3556b5'], r, 0.004);
      ctx.fillStyle = 'rgba(20,30,90,.7)'; ctx.beginPath(); ctx.ellipse(w * 0.4, h * 0.62, w * 0.03, h * 0.025, 0, 0, 7); ctx.fill();
      break;
  }
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  t.anisotropy = 4;
  cache.set(id, t);
  return t;
}

/** Saturn's rings (C, B, the Cassini division, A), as a flat ring with radial texture coordinates. */
export function saturnRings(planetR: number): THREE.Mesh {
  const inner = planetR * 1.24, outer = planetR * 2.27, seg = 160;
  const g = new THREE.RingGeometry(inner, outer, seg, 1);
  const pos = g.attributes.position, uv = g.attributes.uv, v = new THREE.Vector3();
  for (let i = 0; i < pos.count; i++) { v.fromBufferAttribute(pos, i); uv.setXY(i, (v.length() - inner) / (outer - inner), 0.5); }
  const [c, ctx] = canvas(512, 4), grad = ctx.createLinearGradient(0, 0, 512, 0);
  // fractions of (inner → outer): C ring faint, B ring bright, Cassini division dark, A ring medium, Encke gap
  const stops: [number, string][] = [[0, 'rgba(160,140,110,.10)'], [0.2, 'rgba(170,150,120,.30)'], [0.25, 'rgba(225,205,165,.85)'], [0.56, 'rgba(235,215,175,.95)'],
    [0.58, 'rgba(20,20,20,.05)'], [0.63, 'rgba(20,20,20,.05)'], [0.65, 'rgba(205,185,150,.75)'], [0.9, 'rgba(195,175,140,.65)'], [0.91, 'rgba(30,30,30,.1)'], [0.92, 'rgba(190,170,135,.6)'], [1, 'rgba(180,160,125,.3)']];
  for (const [o, col] of stops) grad.addColorStop(o, col);
  ctx.fillStyle = grad; ctx.fillRect(0, 0, 512, 4);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  const m = new THREE.Mesh(g, new THREE.MeshStandardMaterial({ map: t, transparent: true, side: THREE.DoubleSide, depthWrite: false, roughness: 1 }));
  m.rotation.x = -Math.PI / 2;             // RingGeometry lies in x/y; the planet's equator is the x/z plane of its group
  return m;
}
