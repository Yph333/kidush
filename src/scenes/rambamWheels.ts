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
  /** chapter 14 only (the mean motions): no true moon and no correction, the moon labelled on its wheel */
  meanOnly?: boolean;
  /** what a guided step is talking about: that part is drawn strong and the rest dimmed */
  hl?: 'small' | 'big' | 'course' | 'mean' | null;
}

/** A filled angle, for highlighting: points on a circle from t = 0 to t = to (radians), fanned from `c`. */
function fan(c: THREE.Vector3, at: (t: number) => THREE.Vector3, to: number, color: number): THREE.Mesh {
  const n = Math.max(2, Math.ceil(Math.abs(to) / 0.05)), pos: number[] = [];
  for (let i = 0; i < n; i++) {
    const a = at((to * i) / n), b = at((to * (i + 1)) / n);
    pos.push(c.x, c.y, c.z, a.x, a.y, a.z, b.x, b.y, b.z);
  }
  const g = new THREE.BufferGeometry();
  g.setAttribute('position', new THREE.Float32BufferAttribute(pos, 3));
  return new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color, transparent: true, opacity: 0.22, side: THREE.DoubleSide, depthWrite: false }));
}


const create = (host: HTMLElement, p0: WheelsProps): SceneHandle<WheelsProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const bigRing = ring(BIG, COLORS.leap, { opacity: 0.9 });
  scene.add(bigRing);
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
  const labels = {
    small: label('הגלגל הקטן', 'moon small'), mean: label('אמצע הירח', 'leap small'), tru: label('מקום הירח האמיתי', 'moon small'), eq: label('', 'shift'),
    moon: label('הירח', 'moon small'), course: label('אמצע המסלול', 'moon small'), aries: label('תחילת טלה', 'small'),
  };
  Object.values(labels).forEach(l => scene.add(l));

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(dyn);
    const g = moonOnWheel(p.meanLon, p.course);
    const C = new THREE.Vector3(g.cx, 0, g.cz), Mv = new THREE.Vector3(g.mx, 0, g.mz);
    const hl = p.hl ?? null, dim = (on: boolean) => (hl === null || on ? 0.95 : 0.25);
    (bigRing.material as THREE.LineBasicMaterial).opacity = dim(hl === 'big' || hl === 'mean');
    const small = ring(SMALL, COLORS.moon, { opacity: dim(hl === 'small' || hl === 'course') });
    small.position.copy(C);
    dyn.add(small);
    // the angle a guided step is about: the course on the small circle, or the mean moon on the big one (from the start of Aries)
    const u = dirOf(p.meanLon, 0, 1), v = dirOf(p.meanLon + 90, 0, 1);
    if (hl === 'course' || hl === 'small') {
      dyn.add(fan(C, t => C.clone().add(u.clone().multiplyScalar(SMALL * Math.cos(t))).sub(v.clone().multiplyScalar(SMALL * Math.sin(t))), (p.course * Math.PI) / 180, COLORS.moon));
    }
    if (hl === 'mean' || hl === 'big') {
      dyn.add(fan(new THREE.Vector3(), t => dirOf((t * 180) / Math.PI, 0, BIG), (p.meanLon * Math.PI) / 180, COLORS.leap));
      dyn.add(line([new THREE.Vector3(), dirOf(0, 0, BIG * 1.12)], COLORS.leap, { opacity: 0.8 }));
    }
    const far = C.clone().add(C.clone().normalize().multiplyScalar(SMALL));
    dyn.add(line([C, far], COLORS.moon, { dashed: true, opacity: 0.6 }));
    const centre = sphere(0.15, COLORS.moon, true);
    centre.position.copy(C);
    dyn.add(centre);
    // rays from earth
    dyn.add(line([new THREE.Vector3(), C.clone().multiplyScalar(1.35)], COLORS.leap, { dashed: true }));
    if (!p.meanOnly) dyn.add(line([new THREE.Vector3(), Mv.clone().multiplyScalar(1.35 * BIG / Mv.length())], COLORS.moon));
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
    labels.tru.visible = labels.eq.visible = !p.meanOnly;
    labels.moon.visible = !!p.meanOnly;
    labels.moon.position.copy(Mv.clone().add(new THREE.Vector3(0, 0.75, 0)));
    labels.course.visible = hl === 'course';
    labels.course.position.copy(C.clone().add(u.clone().multiplyScalar(SMALL * 0.45)).add(new THREE.Vector3(0, 0.5, 0)));
    labels.aries.visible = hl === 'mean' || hl === 'big';
    labels.aries.position.copy(dirOf(0, 0, BIG * 1.2));
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
