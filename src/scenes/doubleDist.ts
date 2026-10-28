// The reason for the doubled distance (15:1–3), from above: the moon's big wheel turns its centre around the Earth
// opposite the moon; the far point of the small wheel is aimed from the point opposite that centre, not from the
// Earth. The angle between the two lines at the moon is the addition to the course. Geometry: engines/ptolemyMoon.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { PTOLEMY_MOON, crank } from '../engines/ptolemyMoon';
import { earthBody, moonBody, onTextureLoad, sunBody } from './bodies';
import { COLORS, THREE, clearGroup, createStage, dragAround, line, ring, sphere } from './common';

export interface DoubleProps {
  /** the doubled distance (deg) */
  D: number;
  /** the Rambam's table value for it (deg), shown beside the angle */
  table: number;
  onDrag?: (D: number) => void;
}

const K = 9 / 60;                                    // drawing units per part of the model
const V = (p: [number, number], y = 0) => new THREE.Vector3(p[0] * K, y, -p[1] * K);

const create = (host: HTMLElement, p0: DoubleProps): SceneHandle<DoubleProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.9));
  const earthB = earthBody(0.55);
  scene.add(earthB.object);
  const sunB = sunBody(0.6);
  sunB.object.position.set(15, 0, 0);
  scene.add(sunB.object, line([new THREE.Vector3(), new THREE.Vector3(14.4, 0, 0)], COLORS.sun, { dashed: true, opacity: 0.7 }));
  const sunL = label('כנגד השמש (האמצעית)', 'small'); sunL.position.set(15, 1, 0); scene.add(sunL);
  const path = ring(PTOLEMY_MOON.e * K, COLORS.muted, { dashed: true, opacity: 0.8 });
  scene.add(path);
  const moonB = moonBody(0.32);
  scene.add(moonB.object);
  const dyn = new THREE.Group();
  scene.add(dyn);
  const L = { c: label('מרכז הגלגל הגדול', 'small'), n: label('הנקודה שכנגדו', 'leap small'), m: label('הירח', 'moon small'), add: label('', 'shift'), e: label('', 'small') };
  Object.values(L).forEach(l => scene.add(l));
  const offTex = onTextureLoad(st.render);
  let p = p0;
  const offDrag = dragAround(st, host, () => (p.onDrag ? moonB.object : null), () => new THREE.Vector3(), a => p.onDrag?.((2 * a) % 360));

  const build = () => {
    clearGroup(dyn);
    const c = crank(p.D), C = V(c.C), M = V(c.M), N = V(c.N), O = new THREE.Vector3();
    const big = ring(PTOLEMY_MOON.R * K, COLORS.leap, { opacity: 0.7 }); big.position.copy(C); dyn.add(big);
    const small = ring(PTOLEMY_MOON.r * K * 1.8, COLORS.moon, { opacity: 0.9 }); small.position.copy(M); dyn.add(small);
    for (const [q, col] of [[C, COLORS.ink], [N, COLORS.leap]] as const) { const s = sphere(0.14, col, true); s.position.copy(q); dyn.add(s); }
    dyn.add(line([O, C], COLORS.muted, { opacity: 0.7 }), line([O, N], COLORS.leap, { dashed: true, opacity: 0.8 }));
    // the two lines through the moon to the far side of its small wheel
    const far = (from: THREE.Vector3) => M.clone().add(M.clone().sub(from).normalize().multiplyScalar(PTOLEMY_MOON.r * K * 1.8 + 0.6));
    dyn.add(line([O, far(O)], COLORS.moon, {}), line([N, far(N)], COLORS.leap, {}));
    // the angle between them, at the moon
    const a1 = Math.atan2(-(M.z - O.z), M.x - O.x), a2 = Math.atan2(-(M.z - N.z), M.x - N.x), pts: number[] = [];
    for (let k = 0; k < 24; k++) {
      const t0 = a2 + ((a1 - a2) * k) / 24, t1 = a2 + ((a1 - a2) * (k + 1)) / 24, r = PTOLEMY_MOON.r * K * 1.8;
      pts.push(M.x, 0.02, M.z, M.x + r * Math.cos(t0), 0.02, M.z - r * Math.sin(t0), M.x + r * Math.cos(t1), 0.02, M.z - r * Math.sin(t1));
    }
    const g = new THREE.BufferGeometry(); g.setAttribute('position', new THREE.Float32BufferAttribute(pts, 3));
    dyn.add(new THREE.Mesh(g, new THREE.MeshBasicMaterial({ color: COLORS.shift, transparent: true, opacity: 0.45, side: THREE.DoubleSide })));
    // the moon's distance from the sun, at the Earth
    const ePts: THREE.Vector3[] = [];
    for (let k = 0; k <= 30; k++) { const t = ((c.E * k) / 30) * Math.PI / 180; ePts.push(new THREE.Vector3(2.2 * Math.cos(t), 0, -2.2 * Math.sin(t))); }
    dyn.add(line(ePts, COLORS.sun, {}));
    moonB.object.position.copy(M);
    L.c.position.copy(C.clone().add(new THREE.Vector3(0, -0.5, 0.4)));
    L.n.position.copy(N.clone().add(new THREE.Vector3(0, -0.5, 0.4)));
    L.m.position.copy(M.clone().add(new THREE.Vector3(0, 0.7, 0)));
    L.add.element.textContent = `מוסיפים למסלול: ${c.add.toFixed(1)}° (בטבלה: ${p.table}°)`;
    L.add.position.copy(far(N).add(new THREE.Vector3(0, 0.8, 0)));
    L.e.element.textContent = `המרחק ${c.E.toFixed(0)}° · הכפול ${p.D.toFixed(0)}°`;
    L.e.position.set(2.6, 0.6, -0.8);
    st.render();
  };
  build();
  return {
    update(np) { p = np; build(); },
    setView(id) { if (id === 'top') st.look([2, 26, 0.01], [2, 0, 0]); else st.look([-2, 17, 17], [3.5, 0, -1.5]); },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [earthB, sunB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); offDrag(); st.dispose(); },
  };
};

const mod: SceneModule<DoubleProps> = { create };
export default mod;
