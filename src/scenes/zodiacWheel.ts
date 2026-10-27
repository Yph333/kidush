// The zodiac wheel around the Earth: the plane of the sun's path, the twelve signs of 30° each (coloured, divided
// into degrees), the real star figures behind them (at the epoch chosen: the Rambam's day or ours), the sun and the
// moon with lines to the degree they stand at, and an optional arc. For the magnifier, the camera can go down to one
// degree (its 60 parts) and one part (its 60 seconds): finer ticks are built only around the point looked at.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { SIGNS } from '../engines/rambam';
import { raDecToEcl, precessionLon, zodiacFigures, zodiacSpans } from '../engines/zodiac';
import CAT from '../assets/space/stars.json';
import { earthBody, moonBody, onTextureLoad, sunBody } from './bodies';
import { THREE, clearGroup, createStage, dirOf, line } from './common';

export interface ZodiacProps {
  /** epoch of the stars against the signs (Gregorian year): the signs follow the equinox, the stars drift */
  year: number;
  sunLon?: number;
  moonLon?: number;
  moonLat?: number;
  /** the place a step talks about: an arrow from the Earth to that degree */
  pointer?: { lon: number; label?: string };
  /** an arc along the wheel (degrees), e.g. how far the sun moved */
  arc?: { from: number; to: number; label?: string };
  hlSign?: number | null;
  /** the real star figures, and where their IAU boundaries cross the ecliptic */
  stars?: boolean;
  spans?: boolean;
  /** the celestial equator, tilted to the plane of the sun's path (ch. 19) */
  equator?: boolean;
}

export const SIGN_COLORS = [0xe0675a, 0xd9894a, 0xd8b44a, 0xb3c752, 0x7cc45c, 0x52b98a, 0x4fb3b8, 0x4f93cf, 0x6a78d6, 0x8f6ad6, 0xb565c8, 0xcf5f98];
const R = 10, W = 1.3, RS = 15;                        // wheel radius and width; the stars' sphere

/** a flat ring segment in the plane of the sun's path, between longitudes a and b (degrees) */
function band(r0: number, r1: number, a: number, b: number, color: number, opacity: number): THREE.Mesh {
  const g = new THREE.RingGeometry(r0, r1, Math.max(4, Math.round(b - a)), 1, (a * Math.PI) / 180, ((b - a) * Math.PI) / 180);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;                         // RingGeometry lies in XY; the wheel lies in XZ with λ → (cos, 0, −sin)
  return m;
}

/** tick marks along the outer edge: every `step` degrees between a and b, of length len */
function ticks(a: number, b: number, step: number, len: (k: number) => number, color: number, opacity: number): THREE.LineSegments {
  const pos: number[] = [];
  for (let k = 0, x = a; x <= b + 1e-9; k++, x = a + k * step) {
    const p0 = dirOf(x, 0, R + W), p1 = dirOf(x, 0, R + W + len(k));
    pos.push(p0.x, p0.y, p0.z, p1.x, p1.y, p1.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.LineSegments(g, new THREE.LineBasicMaterial({ color, transparent: true, opacity }));
}

const fmt = (deg: number) => {
  const s = Math.round(deg * 3600), d = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60, sg = Math.floor(d / 30) % 12;
  return `${d % 30}° ${m}′ ${sec}″ במזל ${SIGNS[sg]}`;
};

const create = (host: HTMLElement, p0: ZodiacProps): SceneHandle<ZodiacProps> => {
  const st = createStage(host, { near: 1e-6, far: 400, logDepth: true });
  const { scene, label, controls } = st;
  controls.minDistance = 2e-5;
  scene.add(new THREE.AmbientLight(0xffffff, 0.55));
  const sunLight = new THREE.PointLight(0xffffff, 2.2, 0, 0);
  scene.add(sunLight);

  // the plane of the sun's path, faintly
  const plane = new THREE.Mesh(new THREE.CircleGeometry(R + W + 0.6, 128), new THREE.MeshBasicMaterial({ color: 0xf4c33f, transparent: true, opacity: 0.06, side: THREE.DoubleSide, depthWrite: false }));
  plane.rotation.x = -Math.PI / 2;
  scene.add(plane);
  const planeL = label('מישור מסלול השמש', 'small');
  planeL.position.copy(dirOf(225, 0, R * 0.62));
  scene.add(planeL);

  const earthB = earthBody(0.8), earth = earthB.object;
  scene.add(earth);
  const sunB = sunBody(0.7, { glow: 1.6 }), moonB = moonBody(0.35);
  scene.add(sunB.object, moonB.object);
  const L = { sun: label('השמש', 'small'), moon: label('הירח', 'moon small'), ptr: label('', 'leap'), arc: label('', 'moon') };
  Object.values(L).forEach(l => scene.add(l));

  // the fixed wheel: degree ticks (5° and 10° longer), sign boundaries and names
  scene.add(ticks(0, 359, 1, k => (k % 10 === 0 ? 0.55 : k % 5 === 0 ? 0.35 : 0.18), 0xe8ecf6, 0.55));
  for (let s = 0; s < 12; s++) {
    scene.add(line([dirOf(s * 30, 0, R - 0.2), dirOf(s * 30, 0, R + W + 0.9)], 0xe8ecf6, { opacity: 0.9 }));
    const n = label(SIGNS[s], 'sign');
    n.element.style.color = `#${SIGN_COLORS[s].toString(16)}`;
    n.position.copy(dirOf(s * 30 + 15, 0, R + W / 2));
    scene.add(n);
  }
  const bands = new THREE.Group();
  scene.add(bands);
  const dyn = new THREE.Group(), sky = new THREE.Group(), fine = new THREE.Group();
  scene.add(dyn, sky, fine);

  const offTex = onTextureLoad(st.render);
  let p = p0, skyKey = '';
  let cone: THREE.Mesh | null = null, arcBand: THREE.Mesh | null = null;

  const buildSky = () => {
    const key = `${p.year}|${p.stars}|${p.spans}`;
    if (key === skyKey) return;
    skyKey = key;
    clearGroup(sky);
    if (p.stars !== false) {
      const prec = precessionLon(p.year);
      // background stars near the zodiac (HYG, to magnitude 4.5)
      const pos: number[] = [], col: number[] = [];
      for (const [ra, dec, mag] of CAT.stars as number[][]) {
        if (mag > 4.5) continue;
        const [lo, la] = raDecToEcl(ra, dec);
        if (Math.abs(la) > 25) continue;
        const v = dirOf(lo + prec, la, RS);
        pos.push(v.x, v.y, v.z);
        const b = Math.max(0.35, Math.min(1, 1.2 - mag / 5));
        col.push(b, b, b * 1.05);
      }
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
      g.setAttribute('color', new THREE.Float32BufferAttribute(col, 3));
      sky.add(new THREE.Points(g, new THREE.PointsMaterial({ size: 2.2, sizeAttenuation: false, vertexColors: true })));
      // the figures, in the colour of the sign they are named for
      zodiacFigures(p.year).forEach((f, i) => {
        f.lines.forEach(l => sky.add(line(l.map(([lo, la]) => dirOf(lo, la, RS)), SIGN_COLORS[i], { opacity: 0.85 })));
        const mid = f.lines.flat(), m = mid[Math.floor(mid.length / 2)];
        const t = label(`כוכבי ${SIGNS[i]}`, 'small');
        t.element.style.color = `#${SIGN_COLORS[i].toString(16)}`;
        t.position.copy(dirOf(m[0], m[1] + 4, RS));
        sky.add(t);
      });
    }
    if (p.spans) {
      zodiacSpans(p.year, 0.25).forEach(s => {
        const i = ['Ari', 'Tau', 'Gem', 'Cnc', 'Leo', 'Vir', 'Lib', 'Sco', 'Sgr', 'Cap', 'Aqr', 'Psc'].indexOf(s.id);
        const to = s.to < s.from ? s.to + 360 : s.to;
        sky.add(band(R - 1.1, R - 0.45, s.from, to, SIGN_COLORS[i], 0.75));
      });
      const t = label('איפה הכוכבים עצמם חוצים את המסלול', 'small');
      t.position.copy(dirOf(300, 0, R - 2));
      sky.add(t);
    }
  };

  const build = () => {
    clearGroup(bands);
    for (let s = 0; s < 12; s++) {
      const op = p.hlSign == null ? 0.42 : s === p.hlSign ? 0.8 : 0.16, b = band(R, R + W, s * 30, s * 30 + 30, SIGN_COLORS[s], op);
      b.userData.op = op;
      bands.add(b);
    }
    buildSky();
    clearGroup(dyn);
    cone = null;
    arcBand = null;
    const has = (v?: number) => typeof v === 'number';
    sunB.object.visible = L.sun.visible = has(p.sunLon);
    if (has(p.sunLon)) {
      const at = dirOf(p.sunLon!, 0, 6.5);
      sunB.object.position.copy(at);
      sunLight.position.copy(at);
      dyn.add(line([new THREE.Vector3(), dirOf(p.sunLon!, 0, R + W)], 0xf4c33f, { opacity: 0.9 }));
      L.sun.position.copy(at.clone().add(new THREE.Vector3(0, 1, 0)));
    }
    moonB.object.visible = L.moon.visible = has(p.moonLon);
    if (has(p.moonLon)) {
      const at = dirOf(p.moonLon!, (p.moonLat ?? 0) * 2, 3.6);   // latitude doubled, to be seen
      moonB.object.position.copy(at);
      moonB.object.lookAt(sunB.object.position);
      dyn.add(line([new THREE.Vector3(), dirOf(p.moonLon!, 0, R + W)], 0xe7c76f, { opacity: 0.9 }));
      L.moon.position.copy(at.clone().add(new THREE.Vector3(0, 0.6, 0)));
    }
    L.ptr.visible = !!p.pointer;
    if (p.pointer) {
      const tip = dirOf(p.pointer.lon, 0, R + W + 0.05);
      dyn.add(line([new THREE.Vector3(), tip], 0xb0a2ff, {}));
      cone = new THREE.Mesh(new THREE.ConeGeometry(0.22, 0.6, 16), new THREE.MeshBasicMaterial({ color: 0xb0a2ff }));
      cone.position.copy(dirOf(p.pointer.lon, 0, R + W + 0.35));
      cone.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dirOf(p.pointer.lon, 0, 1));
      dyn.add(cone);
      L.ptr.element.textContent = p.pointer.label ?? fmt(p.pointer.lon);
      L.ptr.position.copy(dirOf(p.pointer.lon, 0, R + W + 1.6));
    }
    L.arc.visible = !!p.arc;
    if (p.arc) {
      const { from, to } = p.arc, n = Math.max(8, Math.ceil(Math.abs(to - from) * 2));
      const pts = Array.from({ length: n + 1 }, (_, k) => dirOf(from + ((to - from) * k) / n, 0, R + W + 0.12));
      dyn.add(line(pts, 0xe7c76f, {}));
      const ab = band(R + W, R + W + 0.25, Math.min(from, to), Math.max(from, to), 0xe7c76f, 0.85);
      ab.userData.op = 0.85;
      arcBand = ab;
      dyn.add(ab);
      L.arc.element.textContent = p.arc.label ?? '';
      L.arc.position.copy(dirOf((from + to) / 2, 0, R + W + 2.2));
    }
    buildFine();
    st.render();
  };

  // fine ticks around the point the magnifier looks at: the 60 parts of its degree, the 60 seconds of its part
  const focusLon = () => p.arc?.to ?? p.pointer?.lon ?? p.sunLon ?? 0;
  const fineL: { o: THREE.Object3D; level: 0 | 1 | 2 }[] = [];
  const buildFine = () => {
    clearGroup(fine);
    fineL.length = 0;
    const f = focusLon(), d0 = Math.floor(f), m0 = Math.floor((f - d0) * 60), sg = Math.floor(f / 30) * 30;
    for (let k = 5; k < 30; k += 5) { const a = label(`${k}°`, 'small fine'); a.position.copy(dirOf(sg + k, 0, R + W + 0.85)); fine.add(a); fineL.push({ o: a, level: 0 }); }
    // the exact place, thin enough to stay exact at every magnification
    fine.add(line([dirOf(f, 0, R + W - 0.03), dirOf(f, 0, R + W + 0.12)], 0xb0a2ff, {}));
    fine.add(ticks(d0, d0 + 1, 1 / 60, k => (k % 10 === 0 ? 0.06 : k % 5 === 0 ? 0.035 : 0.018), 0x88c5d8, 0.9));
    fine.add(ticks(d0 + m0 / 60, d0 + (m0 + 1) / 60, 1 / 3600, k => (k % 10 === 0 ? 0.001 : k % 5 === 0 ? 0.0006 : 0.0003), 0xf6e7a6, 0.95));
    for (let k = 10; k < 60; k += 10) {
      const a = label(`${k}′`, 'small fine'); a.position.copy(dirOf(d0 + k / 60, 0, R + W + 0.09)); fine.add(a); fineL.push({ o: a, level: 1 });
      const b = label(`${k}″`, 'small fine'); b.position.copy(dirOf(d0 + m0 / 60 + k / 3600, 0, R + W + 0.0015)); fine.add(b); fineL.push({ o: b, level: 2 });
    }
    const dl = label(`${d0 % 30}° ← מעלה אחת: 60 חלקים`, 'small fine'); dl.position.copy(dirOf(d0 + 0.5, 0, R + W + 0.14)); fine.add(dl); fineL.push({ o: dl, level: 1 });
    const ml = label(`${m0}′ ← חלק אחד: 60 שניות`, 'small fine'); ml.position.copy(dirOf(d0 + (m0 + 0.5) / 60, 0, R + W + 0.0024)); fine.add(ml); fineL.push({ o: ml, level: 2 });
    lod();
  };
  // show each layer only when the camera is close enough for it to make sense
  const lod = () => {
    const d = st.camera.position.distanceTo(dirOf(focusLon(), 0, R + W));
    for (const { o, level } of fineL) o.visible = level === 0 ? d < 9 && d > 1.2 : level === 1 ? d < 1.2 && d > 0.004 : d < 0.012;
    // close in, the arrow head and the coloured band would cover the ticks
    const close = d < 1.2;
    if (cone) cone.visible = d > 3.5;
    if (arcBand) (arcBand.material as THREE.MeshBasicMaterial).opacity = close ? 0.1 : 0.85;
    bands.children.forEach(b => (((b as THREE.Mesh).material as THREE.MeshBasicMaterial).opacity = close ? 0.12 : (b.userData.op as number)));
  };
  controls.addEventListener('change', lod);

  build();
  const zoomTo = (dist: number) => {
    // the camera a little inside the ring: outward is up on the screen, and the degrees grow to the left (as Hebrew reads)
    const c = dirOf(focusLon(), 0, R + W + dist * 0.05), out = dirOf(focusLon(), 0, 1);
    st.look([c.x - out.x * dist * 0.2, dist, c.z - out.z * dist * 0.2], [c.x, c.y, c.z]);
    lod();
  };

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 34, 0.01]);
      else if (id === 'earth') { const s = dirOf(focusLon(), 0, 1); st.look([-s.x * 2.5, 1.4, -s.z * 2.5], [s.x * 6, 0, s.z * 6]); }
      else if (id === 'sign') {
        const sg = p.hlSign ?? Math.floor(focusLon() / 30), c = dirOf(sg * 30 + 15, 0, R + W / 2), o = dirOf(sg * 30 + 15, 0, 1);
        st.look([c.x - o.x * 3, 5.5, c.z - o.z * 3], [c.x, 0, c.z]);
      }
      else if (id === 'degs') zoomTo(2.6);
      else if (id === 'deg') zoomTo(0.32);
      else if (id === 'min') zoomTo(0.0055);
      else st.look([14, 15, 22]);
      lod();
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [earthB, sunB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); controls.removeEventListener('change', lod); st.dispose(); },
  };
};

const mod: SceneModule<ZodiacProps> = { create };
export default mod;
