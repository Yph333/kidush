// Scene 5.2 — the sky dome over the chosen place: horizon, the sun's path for the chosen day (and for
// the equinox / solstices to compare), and circles of equal altitude for the zmanim (below the horizon too).

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { onTextureLoad, sunBody } from './bodies';
import { COLORS, THREE, createStage, disc, line, lineLoop, clearGroup } from './common';

export interface SkyPath { key: string; label: string; color: number; points: { alt: number; az: number }[] }
export interface SkyDomeProps {
  paths: SkyPath[];
  sun: { alt: number; az: number };
  circles: { alt: number; label: string }[];
  /** the real stars above the horizon now, as many as the twilight allows (lib/starSky) */
  stars?: { alt: number; az: number; mag: number; bv: number; vis: number }[];
}

const R = 10;

// stars: round, soft points of fixed pixel size by magnitude, coloured by temperature
const STAR_VERT = /* glsl */`
attribute float size; attribute vec3 tint; attribute float alpha;
varying vec3 vTint; varying float vAlpha;
void main() { vTint = tint; vAlpha = alpha; gl_PointSize = size; gl_Position = projectionMatrix * modelViewMatrix * vec4(position, 1.0); }`;
const STAR_FRAG = /* glsl */`
varying vec3 vTint; varying float vAlpha;
void main() { float d = length(gl_PointCoord - 0.5); if (d > 0.5) discard; gl_FragColor = vec4(vTint, vAlpha * smoothstep(0.5, 0.1, d)); }`;

/** sky colour of the dome by the Sun's altitude: daylight blue, twilight violet, night almost nothing */
function skyTint(alt: number): [number, number] {
  if (alt > 4) return [0x4f8fd6, 0.16];
  if (alt > -6) return [0x5b5fa8, 0.05 + 0.11 * (alt + 6) / 10];
  if (alt > -16) return [0x1c2552, 0.02 + 0.03 * (alt + 16) / 10];
  return [0x0b1029, 0.02];
}
/** horizontal coordinates → scene: north = −z, east = +x, up = +y */
export const hor = (alt: number, az: number, r = R) => {
  const a = (alt * Math.PI) / 180, z = (az * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(a) * Math.sin(z), r * Math.sin(a), -r * Math.cos(a) * Math.cos(z));
};

const create = (host: HTMLElement, p0: SkyDomeProps): SceneHandle<SkyDomeProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.6));

  // ground & horizon
  scene.add(disc(R, 0x1e2a1f, 0.85));
  scene.add(lineLoop(Array.from({ length: 128 }, (_, i) => hor(0, (i / 128) * 360)), COLORS.ink, { opacity: 0.8 }));
  // the dome (wireframe meridians, faint)
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x88c5d8, wireframe: true, transparent: true, opacity: 0.06 }));
  scene.add(dome);
  // a faint fill inside the wireframe: the colour of the sky now
  const fill = new THREE.Mesh(new THREE.SphereGeometry(R * 0.995, 48, 24, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x4f8fd6, transparent: true, opacity: 0.12, side: THREE.DoubleSide, depthWrite: false }));
  scene.add(fill);
  for (const [az, t] of [[0, 'צפון'], [90, 'מזרח'], [180, 'דרום'], [270, 'מערב']] as const) {
    const l = label(t, 'small');
    l.position.copy(hor(0, az, R * 1.1));
    scene.add(l);
  }
  // observer
  const me = new THREE.Mesh(new THREE.ConeGeometry(0.25, 0.8, 16), new THREE.MeshBasicMaterial({ color: COLORS.ink }));
  me.position.y = 0.4;
  scene.add(me);

  const dyn = new THREE.Group();
  scene.add(dyn);
  const sunB = sunBody(0.45, { glow: 5 }), sun = sunB.object;
  scene.add(sun);
  const sunL = label('שמש', 'moon');
  scene.add(sunL);

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(dyn);
    // altitude circles
    p.circles.forEach((c, i) => {
      const pts = Array.from({ length: 128 }, (_, i) => hor(c.alt, (i / 128) * 360));
      dyn.add(lineLoop(pts, c.alt < 0 ? COLORS.leap : COLORS.ok, { dashed: c.alt < 0, opacity: 0.7 }));
      const l = label(c.label, `small ${c.alt < 0 ? 'leap' : 'ok'}`);
      l.position.copy(hor(c.alt, 100 + 30 * i));   // spread on the side facing the default camera (south-east) so labels don't overlap
      dyn.add(l);
    });
    // sun paths
    for (const s of p.paths) {
      dyn.add(line(s.points.map(q => hor(q.alt, q.az)), s.color, { dashed: s.key !== 'today', opacity: s.key === 'today' ? 1 : 0.75 }));
      const top = s.points.reduce((a, b) => (b.alt > a.alt ? b : a), s.points[0]);
      if (top) { const l = label(s.label, 'small'); l.position.copy(hor(top.alt + 3, top.az)); dyn.add(l); }
    }
    // the sky's colour and the stars that can be seen now
    const [tc, ta] = skyTint(p.sun.alt);
    (fill.material as THREE.MeshBasicMaterial).color.set(tc);
    (fill.material as THREE.MeshBasicMaterial).opacity = ta;
    if (p.stars?.length) {
      const n = p.stars.length, pos = new Float32Array(n * 3), tint = new Float32Array(n * 3), size = new Float32Array(n), alpha = new Float32Array(n);
      const c = new THREE.Color(), dpr = Math.min(2, window.devicePixelRatio || 1);
      p.stars.forEach((st, i) => {
        const v = hor(st.alt, st.az, R * 0.99);
        pos.set([v.x, v.y, v.z], i * 3);
        const b = Math.max(0, Math.min(1, (st.bv + 0.3) / 1.9));
        c.setRGB(0.78 + 0.22 * b, 0.84 - 0.06 * b, 1 - 0.41 * b, THREE.SRGBColorSpace);
        tint.set([c.r, c.g, c.b], i * 3);
        size[i] = Math.max(1.6, 5.2 - 0.7 * st.mag) * dpr;
        alpha[i] = st.vis;
      });
      const g = new THREE.BufferGeometry();
      g.setAttribute('position', new THREE.BufferAttribute(pos, 3));
      g.setAttribute('tint', new THREE.BufferAttribute(tint, 3));
      g.setAttribute('size', new THREE.BufferAttribute(size, 1));
      g.setAttribute('alpha', new THREE.BufferAttribute(alpha, 1));
      dyn.add(new THREE.Points(g, new THREE.ShaderMaterial({ vertexShader: STAR_VERT, fragmentShader: STAR_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending })));
    }
    sun.position.copy(hor(p.sun.alt, p.sun.az));
    sunL.position.copy(hor(p.sun.alt + 5, p.sun.az));
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 30, 0.01]);
      else if (id === 'south') st.look([0, 4, -26], [0, 3, 0]);  // camera to the north (−z), looking south
      else st.look([18, 14, 18], [0, 2, 0]);
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [sunB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<SkyDomeProps> = { create };
export default mod;
