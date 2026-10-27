// Scene: eclipses. Sun far away, the Earth with its shadow (umbra and penumbra), the moon on its inclined orbit
// with the node line. Lunar eclipse: the moon enters the Earth's shadow. Solar eclipse: the moon's shadow reaches
// the Earth. Schematic sizes and distances; the moon's latitude is exaggerated so the "miss" is visible.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, moonBody, onTextureLoad, orientEarth, sunBody } from './bodies';
import { COLORS, THREE, clearGroup, createStage, dirOf, disc, line, lineLoop } from './common';

export type EclipsePhase = 'none' | 'lunar-penumbral' | 'lunar-umbral' | 'solar';

export interface EclipseSceneProps {
  sunLon: number;
  moonLon: number;
  moonLat: number;
  node: number;
  exaggerate: number;
  phase: EclipsePhase;
  /** the moment shown: turns the Earth to its true orientation (day side, the countries under the shadow) */
  ms?: number;
}

const R = 8, EARTH = 1.1, MOON = 0.42, INC = 5.145;

/** A cone from `from` along unit `dir`, base radius r0 at `from`, radius r1 at length L. */
function frustum(from: THREE.Vector3, dir: THREE.Vector3, L: number, r0: number, r1: number, color: number, opacity: number) {
  const g = new THREE.CylinderGeometry(r1, r0, L, 48, 1, true);
  const m = new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  m.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), dir.clone().normalize());
  m.position.copy(from.clone().add(dir.clone().normalize().multiplyScalar(L / 2)));
  return m;
}

const create = (host: HTMLElement, p0: EclipseSceneProps): SceneHandle<EclipseSceneProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.15));
  const light = new THREE.DirectionalLight(0xffffff, 2.4);
  scene.add(light);

  const earthB = earthBody(EARTH), earth = earthB.object;
  scene.add(earth);
  const earthL = label('ארץ', 'small');
  scene.add(earthL);
  const sunB = sunBody(2.2), sun = sunB.object;
  scene.add(sun);
  const sunL = label('שמש', 'moon');
  scene.add(sunL);
  const moonB = moonBody(MOON), moon = moonB.object;
  scene.add(moon);
  const moonL = label('ירח', 'moon');
  scene.add(moonL);
  scene.add(disc(R * 1.05, 0x88c5d8, 0.05));
  scene.add(lineLoop(Array.from({ length: 128 }, (_, i) => dirOf(i * 360 / 128, 0, R)), COLORS.leap, { opacity: 0.5 }));

  const dyn = new THREE.Group();
  scene.add(dyn);
  const shadowL = label('צל הארץ', 'small');
  const head = label('ראש', 'shift'), tail = label('זנב', 'shift');
  scene.add(shadowL, head, tail);

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(dyn);
    const toSun = dirOf(p.sunLon), away = toSun.clone().negate();
    sun.position.copy(toSun.clone().multiplyScalar(26));
    sunL.position.copy(sun.position.clone().add(new THREE.Vector3(0, 3, 0)));
    light.position.copy(toSun.clone().multiplyScalar(30));
    earthB.setSun!(sun.position);
    if (p.ms != null) orientEarth(earth, p.ms);
    earthL.position.set(0, -EARTH - 0.6, 0);

    // the Earth's shadow: dark umbra narrowing, faint penumbra widening (schematic)
    dyn.add(frustum(new THREE.Vector3(), away, R * 1.5, EARTH, EARTH * 0.45, 0x000000, 0.55));
    dyn.add(frustum(new THREE.Vector3(), away, R * 1.5, EARTH * 1.02, EARTH * 1.9, 0x334466, 0.18));
    shadowL.position.copy(away.clone().multiplyScalar(R * 1.25).add(new THREE.Vector3(0, 1.6, 0)));

    // the moon's orbit, tilted about the node line
    const inc = INC * p.exaggerate, n = dirOf(p.node);
    const q = new THREE.Quaternion().setFromAxisAngle(n, (inc * Math.PI) / 180);
    dyn.add(lineLoop(Array.from({ length: 180 }, (_, i) => dirOf(i * 2, 0, R).applyQuaternion(q)), COLORS.moon));
    dyn.add(line([dirOf(p.node, 0, R * 1.15), dirOf(p.node + 180, 0, R * 1.15)], COLORS.shift, { dashed: true }));
    head.position.copy(dirOf(p.node, 0, R * 1.25));
    tail.position.copy(dirOf(p.node + 180, 0, R * 1.25));

    const mpos = dirOf(p.moonLon, p.moonLat * p.exaggerate, R);
    moon.position.copy(mpos);
    moonL.position.copy(mpos.clone().add(new THREE.Vector3(0, 0.8, 0)));
    moon.lookAt(0, 0, 0);
    moonB.setTint!(p.phase === 'lunar-umbral' ? 0xb4552e : p.phase === 'lunar-penumbral' ? 0x9a9a9a : 0xdddddd, p.phase === 'lunar-umbral' ? 0x3a1206 : 0x000000);

    // solar eclipse: the moon's shadow reaches the Earth
    if (p.phase === 'solar') {
      const toEarth = mpos.clone().negate().normalize();
      const L = Math.max(0.1, mpos.length() - EARTH * 0.9);
      dyn.add(frustum(mpos, toEarth, L, MOON, 0.05, 0x000000, 0.6));
      dyn.add(frustum(mpos, toEarth, L, MOON * 1.05, EARTH * 0.8, 0x334466, 0.22));
    }
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 26, 0.01]);
      else if (id === 'side') { const v = dirOf(p.sunLon + 90, 0, 22); st.look([v.x, 2.5, v.z]); }
      else { const v = dirOf(p.sunLon + 150, 0, 18); st.look([v.x, 9, v.z]); }
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [sunB, earthB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<EclipseSceneProps> = { create };
export default mod;
