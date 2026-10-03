// Scene 5.4 — the Earth on its orbit with its tilted axis, lit by the sun; the true equinoxes and solstices,
// and Shmuel's and Rav Adda's tekufot for the chosen year, marked where the Earth is at each moment.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { COLORS, THREE, createStage, dirOf, ring, sphere, clearGroup } from './common';
import { KIND_COLOR, type TekufaKind } from './shared';
export type { TekufaKind };

export interface SeasonMarker { sunLon: number; label: string; kind: TekufaKind }
export interface EarthSeasonsProps {
  /** the sun's longitude now; the Earth is opposite (sunLon + 180) */
  sunLon: number;
  markers: SeasonMarker[];
}

const R = 12, TILT = 23.44;

const create = (host: HTMLElement, p0: EarthSeasonsProps): SceneHandle<EarthSeasonsProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.12));
  const light = new THREE.PointLight(0xffffff, 900, 0, 2);
  scene.add(light);
  const sun = sphere(1.6, COLORS.sun, true);
  scene.add(sun);
  const sunL = label('שמש', 'moon');
  sunL.position.set(0, 2.4, 0);
  scene.add(sunL);
  scene.add(ring(R, COLORS.muted, { opacity: 0.7 }));

  // earth with tilted axis: the north pole leans toward ecliptic longitude 90° (toward the sun at the June solstice)
  const earthGroup = new THREE.Group();
  scene.add(earthGroup);
  const tiltQ = new THREE.Quaternion().setFromAxisAngle(dirOf(0), (-TILT * Math.PI) / 180);  // +y → toward −z (λ 90°)
  const body = new THREE.Group();
  body.quaternion.copy(tiltQ);
  earthGroup.add(body);
  const earth = sphere(0.9, COLORS.earth);
  body.add(earth);
  const axis = new THREE.Mesh(new THREE.CylinderGeometry(0.03, 0.03, 2.8, 8), new THREE.MeshBasicMaterial({ color: COLORS.ink }));
  body.add(axis);
  const equator = ring(0.95, COLORS.moon, { opacity: 0.9, segments: 64 });
  body.add(equator);
  const earthL = label('ארץ', 'small');
  scene.add(earthL);

  const dyn = new THREE.Group();
  scene.add(dyn);

  let p = p0;
  const build = () => {
    clearGroup(dyn);
    const e = dirOf(p.sunLon + 180, 0, R);
    earthGroup.position.copy(e);
    earthL.position.copy(e.clone().add(new THREE.Vector3(0, 1.8, 0)));
    p.markers.forEach((m, i) => {
      const pos = dirOf(m.sunLon + 180, 0, R);
      const dot = sphere(m.kind === 'true' ? 0.28 : 0.22, KIND_COLOR[m.kind], true);
      dot.position.copy(pos);
      dyn.add(dot);
      if (m.kind !== 'true') return;             // only the true tekufot get a name; colours are in the legend
      const l = label(m.label, 'small ok');
      l.position.copy(pos.clone().add(dirOf(m.sunLon + 180, 0, 2.2)).add(new THREE.Vector3(0, (i % 2) * 0.4, 0)));
      dyn.add(l);
    });
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 34, 0.01]);
      else if (id === 'earth') { const e = dirOf(p.sunLon + 180, 0, R); st.look([e.x * 1.55, 3, e.z * 1.55], [e.x, 0, e.z]); }
      else st.look([20, 16, 22]);
    },
    setAutoRotate: st.setAutoRotate,
    dispose: st.dispose,
  };
};

const mod: SceneModule<EarthSeasonsProps> = { create };
export default mod;
