// An eccentric circle (Kiddush HaChodesh 11:13–15, 12:2, 13): the body moves uniformly on a circle whose centre
// is not the Earth. Seen from the centre its motion is even (the "mean"); seen from the Earth it is faster or
// slower (the "true"). The far point from the Earth is the apogee (גובה). Schematic: the offset is enlarged.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, onTextureLoad, sunBody } from './bodies';
import { COLORS, THREE, clearGroup, createStage, dirOf, dragAround, line, ring, sphere } from './common';

export interface EccentricProps {
  /** mean longitude (deg): the angle at the centre */
  meanLon: number;
  /** apogee longitude (deg) */
  apogee: number;
  /** centre offset as a fraction of the radius (already enlarged for the drawing) */
  ecc: number;
  /** what the step is about */
  hl?: 'mean' | 'true' | 'apogee' | 'course' | 'both' | null;
  /** the correction to show on the label, arc-minutes (the Rambam's table value), or null */
  eqMin?: number | null;
  /** the viewer drags the body: its new mean longitude (deg) */
  onDrag?: (meanLon: number) => void;
}

const R = 9;
const SIGN_NAMES = ['טלה', 'שור', 'תאומים', 'סרטן', 'אריה', 'בתולה', 'מאזנים', 'עקרב', 'קשת', 'גדי', 'דלי', 'דגים'];

const create = (host: HTMLElement, p0: EccentricProps): SceneHandle<EccentricProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const earthB = earthBody(0.8);
  scene.add(earthB.object);
  earthB.setSun?.(new THREE.Vector3(100, 20, 0));
  const eL = label('ארץ', 'small');
  eL.position.set(0, -1.3, 0);
  scene.add(eL);
  // the circle of the signs around the Earth (the zodiac), with the twelve names
  scene.add(ring(R * 1.45, COLORS.leap, { opacity: 0.35 }));
  SIGN_NAMES.forEach((n, k) => {
    const l = label(n, 'small');
    l.position.copy(dirOf(k * 30 + 15, 0, R * 1.58));
    scene.add(l);
    scene.add(line([dirOf(k * 30, 0, R * 1.4), dirOf(k * 30, 0, R * 1.5)], COLORS.leap, { opacity: 0.6 }));
  });
  const sunB = sunBody(0.7), sun = sunB.object;
  scene.add(sun);
  const dyn = new THREE.Group();
  scene.add(dyn);
  const L = { centre: label('מרכז הגלגל', 'small'), apo: label('גובה', 'shift small'), mean: label('המקום האמצעי', 'leap small'), tru: label('המקום האמיתי', 'moon small'), eq: label('', 'shift') };
  Object.values(L).forEach(l => scene.add(l));
  const offTex = onTextureLoad(st.render);
  let p = p0;
  const offDrag = dragAround(st, host, () => (p.onDrag ? sun : null), () => dirOf(p.apogee, 0, p.ecc * R), a => p.onDrag?.(a));

  const build = () => {
    clearGroup(dyn);
    const hl = p.hl ?? null, C = dirOf(p.apogee, 0, p.ecc * R), body = C.clone().add(dirOf(p.meanLon, 0, R));
    const op = (on: boolean) => (hl === null || on ? 0.95 : 0.3);
    const circle = ring(R, COLORS.sun, { opacity: 0.75 });
    circle.position.copy(C);
    dyn.add(circle);
    const c = sphere(0.14, COLORS.sun, true);
    c.position.copy(C);
    dyn.add(c);
    // apogee: the far point of the circle from the Earth, on the line Earth → centre
    const A = C.clone().add(dirOf(p.apogee, 0, R));
    const a = sphere(0.22, COLORS.shift, true);
    a.position.copy(A);
    dyn.add(a, line([new THREE.Vector3(), A], COLORS.shift, { dashed: true, opacity: op(hl === 'apogee' || hl === 'course') }));
    sun.position.copy(body);
    // the mean place: the direction from the centre, carried to the zodiac (parallel line from the Earth)
    dyn.add(line([C, body], COLORS.leap, { dashed: true, opacity: op(hl === 'mean' || hl === 'both' || hl === 'course') }));
    dyn.add(line([new THREE.Vector3(), dirOf(p.meanLon, 0, R * 1.45)], COLORS.leap, { opacity: op(hl === 'mean' || hl === 'both') }));
    // the true place: the direction from the Earth
    const trueLon = (Math.atan2(-body.z, body.x) * 180) / Math.PI;
    dyn.add(line([new THREE.Vector3(), body.clone().normalize().multiplyScalar(R * 1.45)], COLORS.moon, { opacity: op(hl === 'true' || hl === 'both') }));
    // the course: from the apogee to the mean place, around the centre
    if (hl === 'course') {
      const pts: THREE.Vector3[] = [], span = ((p.meanLon - p.apogee) % 360 + 360) % 360;
      for (let k = 0; k <= 48; k++) pts.push(C.clone().add(dirOf(p.apogee + (span * k) / 48, 0, R * 0.45)));
      dyn.add(line(pts, COLORS.shift, { opacity: 0.9 }));
    }
    L.centre.position.copy(C.clone().add(new THREE.Vector3(0, -0.7, 0)));
    L.apo.position.copy(A.clone().add(new THREE.Vector3(0, 0.6, 0)));
    L.mean.position.copy(dirOf(p.meanLon, 0, R * 1.32).add(new THREE.Vector3(0, 0.5, 0)));
    L.tru.position.copy(dirOf(trueLon, 0, R * 1.32).add(new THREE.Vector3(0, -0.5, 0)));
    L.eq.visible = p.eqMin != null;
    if (p.eqMin != null) {
      L.eq.element.textContent = `מנת המסלול ${Math.floor(Math.abs(p.eqMin) / 60)}° ${Math.abs(p.eqMin) % 60}′`;
      L.eq.position.copy(dirOf(p.meanLon, 0, R * 0.7).add(new THREE.Vector3(0, 0.9, 0)));
    }
    st.render();
  };
  build();
  return {
    update(np) { p = np; build(); },
    setView(id) { if (id === 'top') st.look([0, 30, 0.01]); else st.look([10, 16, 20]); },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { sunB.setRealism(on); earthB.setRealism(on); st.render(); },
    dispose() { offTex(); offDrag(); st.dispose(); },
  };
};

const mod: SceneModule<EccentricProps> = { create };
export default mod;
