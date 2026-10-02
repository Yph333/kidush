// Scene 5.3 — "a small wheel inside a large wheel" (Kiddush HaChodesh 14:1, exact halacha TODO: verify):
// the moon rides on a small circle whose centre goes round the large one. The angle between the line to the
// centre of the small circle (mean moon) and the line to the moon (true moon) is the correction.
// The drawing is schematic (small circle enlarged); the correction shown is the Rambam's table value.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { COLORS, THREE, createStage, dirOf, line, ring, sphere } from './common';

export interface WheelsProps {
  /** mean moon longitude (deg) */
  meanLon: number;
  /** corrected course on the small circle (deg, 0 = far point) */
  course: number;
  /** the table correction, arc-minutes, and whether it is subtracted */
  eqMin: number;
  subtract: boolean;
}

export const BIG = 10, SMALL = 2.6;

/** Moon position for a course angle: from the far point of the small circle, moving against the big circle's motion. */
export function moonOnWheel(meanLon: number, course: number): { cx: number; cz: number; mx: number; mz: number } {
  const c = dirOf(meanLon, 0, BIG), u = c.clone().normalize(), v = dirOf(meanLon + 90);
  const a = (course * Math.PI) / 180;
  const m = c.clone().add(u.multiplyScalar(SMALL * Math.cos(a))).add(v.multiplyScalar(-SMALL * Math.sin(a)));
  return { cx: c.x, cz: c.z, mx: m.x, mz: m.z };
}

const create = (host: HTMLElement, p0: WheelsProps): SceneHandle<WheelsProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  scene.add(ring(BIG, COLORS.leap, { opacity: 0.9 }));
  const bigL = label('הגלגל הגדול', 'leap small');
  scene.add(bigL);
  const earth = sphere(0.7, COLORS.earth);
  scene.add(earth);
  const eL = label('ארץ', 'small');
  eL.position.set(0, -1.2, 0);
  scene.add(eL);

  const dyn = new THREE.Group();
  scene.add(dyn);
  const moon = sphere(0.4, 0xdddddd);
  scene.add(moon);
  const labels = { small: label('הגלגל הקטן', 'moon small'), mean: label('אמצע הירח', 'leap small'), tru: label('מקום הירח האמיתי', 'moon small'), eq: label('', 'shift') };
  Object.values(labels).forEach(l => scene.add(l));

  let p = p0;
  const build = () => {
    dyn.clear();
    const g = moonOnWheel(p.meanLon, p.course);
    const C = new THREE.Vector3(g.cx, 0, g.cz), Mv = new THREE.Vector3(g.mx, 0, g.mz);
    const small = ring(SMALL, COLORS.moon, { opacity: 0.95 });
    small.position.copy(C);
    dyn.add(small);
    const far = C.clone().add(C.clone().normalize().multiplyScalar(SMALL));
    dyn.add(line([C, far], COLORS.moon, { dashed: true, opacity: 0.6 }));
    const centre = sphere(0.15, COLORS.moon, true);
    centre.position.copy(C);
    dyn.add(centre);
    // rays from earth
    dyn.add(line([new THREE.Vector3(), C.clone().multiplyScalar(1.35)], COLORS.leap, { dashed: true }));
    dyn.add(line([new THREE.Vector3(), Mv.clone().multiplyScalar(1.35 * BIG / Mv.length())], COLORS.moon));
    moon.position.copy(Mv);
    // labels
    bigL.position.copy(dirOf(p.meanLon + 180, 0, BIG * 1.08));
    labels.small.position.copy(C.clone().add(dirOf(p.meanLon - 90, 0, SMALL + 0.9)));
    labels.mean.position.copy(C.clone().multiplyScalar(1.42));
    labels.tru.position.copy(Mv.clone().multiplyScalar(1.42 * BIG / Mv.length()).add(new THREE.Vector3(0, 0.6, 0)));
    const d = Math.floor(p.eqMin / 60), mnt = p.eqMin % 60;
    labels.eq.element.textContent = `מנת המסלול ${d}° ${mnt}′ (${p.subtract ? 'גורעים' : 'מוסיפים'})`;
    labels.eq.position.copy(C.clone().multiplyScalar(0.55).add(new THREE.Vector3(0, 0.8, 0)));
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 32, 0.01]);
      else if (id === 'close') { const c = dirOf(p.meanLon, 0, BIG); st.look([c.x * 1.1, 9, c.z * 1.1], [c.x, 0, c.z]); }
      else st.look([14, 18, 20]);
    },
    dispose: st.dispose,
  };
};

const mod: SceneModule<WheelsProps> = { create };
export default mod;
