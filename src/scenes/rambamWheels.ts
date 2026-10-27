// Scene 5.3 — "a small wheel inside a large wheel" (Kiddush HaChodesh 14:1):
// the moon rides on a small circle whose centre goes round the large one. The angle between the line to the
// centre of the small circle (mean moon) and the line to the moon (true moon) is the correction.
// The drawing is schematic (small circle enlarged); the correction shown is the Rambam's table value.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, moonBody, onTextureLoad } from './bodies';
import { COLORS, THREE, createStage, dirOf, line, ring, sphere, clearGroup } from './common';
import { BIG, SMALL, moonOnWheel } from './shared';

export interface WheelsProps {
  /** mean moon longitude (deg) */
  meanLon: number;
  /** corrected course on the small circle (deg, 0 = far point) */
  course: number;
  /** the table correction, arc-minutes, and whether it is subtracted */
  eqMin: number;
  subtract: boolean;
}


const create = (host: HTMLElement, p0: WheelsProps): SceneHandle<WheelsProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  scene.add(ring(BIG, COLORS.leap, { opacity: 0.9 }));
  const bigL = label('הגלגל הגדול', 'leap small');
  scene.add(bigL);
  const earthB = earthBody(0.7), earth = earthB.object;
  scene.add(earth);
  const eL = label('ארץ', 'small');
  eL.position.set(0, -1.2, 0);
  scene.add(eL);

  const dyn = new THREE.Group();
  scene.add(dyn);
  const moonB = moonBody(0.4), moon = moonB.object;
  scene.add(moon);
  const labels = { small: label('הגלגל הקטן', 'moon small'), mean: label('אמצע הירח', 'leap small'), tru: label('מקום הירח האמיתי', 'moon small'), eq: label('', 'shift') };
  Object.values(labels).forEach(l => scene.add(l));

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(dyn);
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
    moon.lookAt(earth.position);
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
      else { const c = dirOf(p.meanLon, 0, BIG * 0.3); st.look([c.x + 11.5, 14.5, c.z + 16.5], [c.x, 0, c.z]); }   // aim between the Earth and the small wheel, so both fill the frame
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [earthB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<WheelsProps> = { create };
export default mod;
