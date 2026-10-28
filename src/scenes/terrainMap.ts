// A 3D relief map of the Land of Israel (or of the region from Egypt to Babylon) from the bundled elevation grids,
// shaded by a low sun and coloured by height, with the places a halacha names, a route, and a ring of distance.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { type TerrainGrid, decodeTerrain, elevationAt, hypsometric } from '../lib/terrain';
import IL from '../assets/terrain/israel.json';
import RG from '../assets/terrain/region.json';
import BORDERS from '../assets/terrain/borders.json';
import { MODERN_PLACES } from '../content/modernPlaces';
import { THREE, clearGroup, createStage, line } from './common';

export interface MapPin { name: string; lat: number; lon: number; color: number; hl?: boolean; approx?: boolean; area?: boolean }
export interface TerrainProps {
  map: 'israel' | 'region';
  pins: MapPin[];
  route?: [number, number][];
  /** a circle around Jerusalem, km */
  ring?: { km: number; label: string };
  /** beacons lit one after another along `stops`: `t` stops lit so far (fractional: the next is catching) */
  fires?: { stops: [number, number][]; t: number };
  /** messengers walking out of Jerusalem toward each place, `km` walked so far */
  walkers?: { to: [number, number][]; km: number };
  /** today's borders and cities, faint, for orientation (default on) */
  modern?: boolean;
  /** the area to frame (lon0, lat0, lon1, lat1); the whole map if absent */
  frame?: [number, number, number, number];
}

const SIZE = 20;
const grids: Partial<Record<TerrainProps['map'], TerrainGrid>> = {};
const grid = (m: TerrainProps['map']) => (grids[m] ??= decodeTerrain(m === 'israel' ? IL : RG));

const create = (host: HTMLElement, p0: TerrainProps): SceneHandle<TerrainProps> => {
  const st = createStage(host, { fov: 40 });
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.45));
  const sun = new THREE.DirectionalLight(0xffffff, 2.2);
  sun.position.set(-12, 9, -8);                        // from the north-west, low: hills cast light and shade
  scene.add(sun);
  const land = new THREE.Group(), dyn = new THREE.Group();
  scene.add(land, dyn);

  let p = p0, built = '', xy = (lon: number, lat: number) => new THREE.Vector3(lon, 0, -lat), Y = (m: number) => m;
  const buildLand = () => {
    if (built === p.map) return;
    built = p.map;
    clearGroup(land);
    const g = grid(p.map), [x0, y0, x1, y1] = g.box, lc = Math.cos((((y0 + y1) / 2) * Math.PI) / 180);
    const S = SIZE / Math.max((x1 - x0) * lc, y1 - y0), ex = p.map === 'israel' ? 7 : 12;   // vertical exaggeration
    const cx = (x0 + x1) / 2, cy = (y0 + y1) / 2;
    xy = (lon, lat) => new THREE.Vector3((lon - cx) * lc * S, 0, -(lat - cy) * S);
    Y = m => (Math.max(m, -60) / 111000) * S * ex;     // the sea floor is flattened: only the coast and the land matter
    const geo = new THREE.PlaneGeometry((x1 - x0) * lc * S, (y1 - y0) * S, g.w - 1, g.h - 1);
    geo.rotateX(-Math.PI / 2);
    const pos = geo.attributes.position as THREE.BufferAttribute, col = new Float32Array(pos.count * 3);
    for (let j = 0; j < g.h; j++) for (let i = 0; i < g.w; i++) {
      const k = j * g.w + i, m = g.z[k];
      pos.setY(k, Y(m));
      const c = hypsometric(m);
      col.set(c, k * 3);
    }
    geo.setAttribute('color', new THREE.BufferAttribute(col, 3));
    geo.computeVertexNormals();
    land.add(new THREE.Mesh(geo, new THREE.MeshStandardMaterial({ vertexColors: true, roughness: 1, metalness: 0 })));
  };

  const at = (lon: number, lat: number, lift = 0) => { const v = xy(lon, lat); v.y = Y(Math.max(0, elevationAt(grid(p.map), lon, lat))) + lift; return v; };
  /** how much of the map the frame takes (1 = all): pins and rings shrink with it, to keep their size on screen */
  const frameK = () => {
    const f = p.frame;
    return f ? Math.min(1, Math.max(0.25, Math.max(xy(f[2], f[1]).x - xy(f[0], f[1]).x, xy(f[0], f[1]).z - xy(f[0], f[3]).z) / SIZE)) : 1;
  };
  const build = () => {
    buildLand();
    clearGroup(dyn);
    const K = frameK();
    for (const q of p.pins) {
      const base = at(q.lon, q.lat), top = base.clone(); top.y += (q.hl ? 1.6 : 1.1) * K;
      if (q.area) {
        const r = new THREE.Mesh(new THREE.RingGeometry(0.9 * K, 1.05 * K, 48), new THREE.MeshBasicMaterial({ color: q.color, transparent: true, opacity: q.hl ? 0.95 : 0.45, side: THREE.DoubleSide }));
        r.rotation.x = -Math.PI / 2; r.position.copy(base); r.position.y += 0.25; dyn.add(r);
      } else {
        dyn.add(line([base, top], q.color, {}));
        const b = new THREE.Mesh(new THREE.SphereGeometry((q.hl ? 0.2 : 0.14) * K, 16, 12), new THREE.MeshBasicMaterial({ color: q.color }));
        b.position.copy(top); dyn.add(b);
      }
      const l = label(q.name + (q.approx ? ' (?)' : ''), q.hl ? 'strong' : 'small');
      l.position.copy(top); l.position.y += 0.45 * K; dyn.add(l);
    }
    if (p.modern !== false) {
      // today's borders, draped on the ground, and today's cities (grey), unless a place of the halacha is there
      const [bx0, by0, bx1, by1] = grid(p.map).box, inside = (x: number, y: number) => x > bx0 && x < bx1 && y > by0 && y < by1;
      for (const l of BORDERS.lines as [number, number][][]) {
        const pts: THREE.Vector3[] = [];
        for (let i = 0; i < l.length; i++) {
          const [a, b] = [l[i], l[i + 1] ?? l[i]], n = i + 1 < l.length ? Math.max(1, Math.ceil(Math.hypot(b[0] - a[0], b[1] - a[1]) / grid(p.map).step / 2)) : 1;
          for (let k = 0; k < n; k++) { const x = a[0] + ((b[0] - a[0]) * k) / n, y = a[1] + ((b[1] - a[1]) * k) / n; if (inside(x, y)) pts.push(at(x, y, 0.06 * K)); else if (pts.length) { dyn.add(line(pts.splice(0), 0xd9d2c5, { opacity: 0.75 })); } }
        }
        if (pts.length > 1) dyn.add(line(pts, 0xd9d2c5, { opacity: 0.75 }));
      }
      for (const c of MODERN_PLACES) {
        if (!(c.map === 'both' || c.map === p.map) || !inside(c.lon, c.lat)) continue;
        if (p.pins.some(q => Math.hypot(q.lon - c.lon, q.lat - c.lat) < 0.15)) continue;
        const v = at(c.lon, c.lat, 0.08 * K);
        const d = new THREE.Mesh(new THREE.SphereGeometry(0.07 * K, 10, 8), new THREE.MeshBasicMaterial({ color: 0xb8bcc8 }));
        d.position.copy(v); dyn.add(d);
        const l = label(c.name, 'modern'); l.position.copy(v); l.position.y += 0.3 * K; dyn.add(l);
      }
    }
    if (p.fires) {
      const { stops, t } = p.fires;
      stops.forEach(([lon, lat], i) => {
        if (i >= t) return;
        const base = at(lon, lat), f = new THREE.Mesh(new THREE.ConeGeometry(0.22 * K, 0.7 * K, 16), new THREE.MeshBasicMaterial({ color: 0xffa040 }));
        f.position.copy(base); f.position.y += 0.45 * K; dyn.add(f);
        const glow = new THREE.Mesh(new THREE.SphereGeometry(0.5 * K, 16, 12), new THREE.MeshBasicMaterial({ color: 0xffc070, transparent: true, opacity: 0.35, depthWrite: false }));
        glow.position.copy(f.position); dyn.add(glow);
        // the light travelling to the next hill
        if (i + 1 < stops.length) {
          const q = Math.min(1, t - i - 1 + 1e-9 < 0 ? Math.max(0, t - i) : 1), [lon2, lat2] = stops[i + 1];
          if (q > 0) dyn.add(line([at(lon, lat, 0.8 * K), at(lon + (lon2 - lon) * Math.min(1, t - i), lat + (lat2 - lat) * Math.min(1, t - i), 0.8 * K)], 0xffc070, {}));
        }
      });
    }
    if (p.walkers) {
      const J = [35.23, 31.78];
      for (const [lon, lat] of p.walkers.to) {
        const dKm = Math.hypot((lon - J[0]) * 111 * Math.cos((J[1] * Math.PI) / 180), (lat - J[1]) * 111), f = Math.min(1, p.walkers.km / dKm);
        const w = at(J[0] + (lon - J[0]) * f, J[1] + (lat - J[1]) * f, 0.25 * K);
        const m = new THREE.Mesh(new THREE.SphereGeometry(0.16 * K, 12, 10), new THREE.MeshBasicMaterial({ color: f >= 1 ? 0x7fce9c : 0xffffff }));
        m.position.copy(w); dyn.add(m);
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 30; k++) { const g = (f * k) / 30; pts.push(at(J[0] + (lon - J[0]) * g, J[1] + (lat - J[1]) * g, 0.12 * K)); }
        dyn.add(line(pts, 0xffffff, { opacity: 0.7 }));
      }
    }
    if (p.route && p.route.length > 1) {
      // the route draped on the ground: sampled along each leg
      const pts: THREE.Vector3[] = [];
      for (let i = 1; i < p.route.length; i++) {
        const [a, b] = [p.route[i - 1], p.route[i]];
        for (let k = 0; k <= 40; k++) { const t = k / 40; pts.push(at(a[0] + (b[0] - a[0]) * t, a[1] + (b[1] - a[1]) * t, 0.15)); }
      }
      dyn.add(line(pts, 0xffb36b, { dashed: true }));
    }
    if (p.ring) {
      const J = [35.23, 31.78], pts: THREE.Vector3[] = [];
      for (let k = 0; k <= 120; k++) {
        const a = (k / 120) * 2 * Math.PI, dlat = (p.ring.km / 111) * Math.cos(a), dlon = (p.ring.km / (111 * Math.cos((J[1] * Math.PI) / 180))) * Math.sin(a);
        const v = xy(J[0] + dlon, J[1] + dlat); v.y = 0.3; pts.push(v);
      }
      dyn.add(line(pts, 0x88c5d8, { dashed: true }));
      const l = label(p.ring.label, 'small'); l.position.copy(pts[0]); l.position.y += 0.6; dyn.add(l);
    }
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      // frame the area the halacha is about: centre on it, and come as close as its size allows
      const f = p.frame, c = f ? xy((f[0] + f[2]) / 2, (f[1] + f[3]) / 2) : new THREE.Vector3(), k = frameK() * 1.15;
      if (id === 'top') st.look([c.x, 26 * k, c.z + 0.01], [c.x, 0, c.z]);
      else if (id === 'low') st.look([c.x - 14 * k, 5 * k, c.z + 12 * k], [c.x, 0, c.z]);
      else st.look([c.x - 6 * k, 16 * k, c.z + 17 * k], [c.x, 0, c.z]);
    },
    setAutoRotate: st.setAutoRotate,
    dispose() { st.dispose(); },
  };
};

const mod: SceneModule<TerrainProps> = { create };
export default mod;
