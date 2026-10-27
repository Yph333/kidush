// The month in 3D: the Sun at the centre, the Earth on its orbit, the Moon around the Earth (not to scale).
// The Sun is the light: the Moon's lit half always faces it, so its phase can be seen from any angle.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, moonBody, onTextureLoad, orientEarth, sunBody } from './bodies';
import { COLORS, THREE, clearGroup, createStage, dirOf, line, ring } from './common';

export interface MonthProps {
  /** geocentric ecliptic longitudes (deg) */
  sunLam: number;
  moonLam: number;
  moonBeta: number;
  /** the Earth's heliocentric longitude at the first and last evening of the month (deg): the arc it travels */
  arc: [number, number];
  /** the moment shown: turns the Earth to its true orientation */
  ms?: number;
}

/** drawing radii: the Earth's orbit, the Moon's orbit (enlarged ~40×), and the bodies */
const RE = 9, RM = 3;

const create = (host: HTMLElement, p0: MonthProps): SceneHandle<MonthProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.07));
  const light = new THREE.PointLight(0xffffff, 3.2, 0, 0);
  scene.add(light);

  const sunB = sunBody(1.25), sun = sunB.object;
  scene.add(sun);
  const sunL = label('שמש', 'moon');
  sunL.position.set(0, -2.4, 0);
  scene.add(sunL);

  scene.add(ring(RE, COLORS.leap, { opacity: 0.35, dashed: true }));
  const earthB = earthBody(0.72), earth = earthB.object;
  scene.add(earth);
  const earthL = label('כדור הארץ', 'small');
  scene.add(earthL);
  const moonB = moonBody(0.32), moon = moonB.object;
  scene.add(moon);
  const moonL = label('ירח', 'moon small');
  scene.add(moonL);
  const dyn = new THREE.Group();
  scene.add(dyn);

  const offTex = onTextureLoad(st.render);
  let p = p0, view = 'oblique';
  const E = new THREE.Vector3();

  const build = () => {
    clearGroup(dyn);
    E.copy(dirOf(p.sunLam + 180, 0, RE));
    earth.position.copy(E);
    if (p.ms !== undefined) orientEarth(earth, p.ms);
    earthB.setSun?.(new THREE.Vector3().sub(E).normalize().multiplyScalar(100));
    const M = E.clone().add(dirOf(p.moonLam, p.moonBeta * 3, RM));
    moon.position.copy(M);
    moon.lookAt(E);
    // the moon's orbit around the Earth, and this month's arc of the Earth's orbit
    const mo = ring(RM, COLORS.moon, { opacity: 0.45 });
    mo.position.copy(E);
    dyn.add(mo);
    const [a0, a1] = p.arc, span = ((a1 - a0) % 360 + 360) % 360, pts: THREE.Vector3[] = [];
    for (let i = 0; i <= 40; i++) pts.push(dirOf(a0 + (span * i) / 40, 0, RE));
    dyn.add(line(pts, COLORS.leap, { opacity: 0.9 }));
    // the line to the Sun from the Earth, so the elongation reads at a glance
    dyn.add(line([E, E.clone().multiplyScalar(0.62)], COLORS.sun, { dashed: true, opacity: 0.6 }));
    dyn.add(line([E, M], COLORS.moon, { opacity: 0.7 }));
    earthL.position.copy(E.clone().add(new THREE.Vector3(0, -1.4, 0)));
    moonL.position.copy(M.clone().add(new THREE.Vector3(0, 0.65, 0)));
    if (view === 'earth') frameEarth();
    else st.render();
  };
  const frameEarth = () => {
    const out = E.clone().normalize();
    st.look([E.x + out.x * 4 + 2, 6.5, E.z + out.z * 4 + 2], [E.x, 0, E.z]);
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      view = id;
      if (id === 'top') st.look([0, 25, 0.01]);
      else if (id === 'earth') frameEarth();
      else st.look([9, 10.5, 14.5]);
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [sunB, earthB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<MonthProps> = { create };
export default mod;
