// Scene 5.1 — the moon's inclined orbit: ecliptic plane, the moon's plane tilted ~5.1°, the node line
// (head and tail) regressing over ~18.6 years, the sun's direction, the moon and its latitude.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, moonBody, onTextureLoad, sunBody } from './bodies';
import { COLORS, THREE, createStage, dirOf, disc, line, lineLoop, ring, sphere, clearGroup } from './common';

export interface MoonOrbitProps {
  sunLon: number;
  moonLon: number;
  moonLat: number;
  /** ascending node longitude (deg) */
  node: number;
  /** the Rambam's head for the same evening (deg), if computed */
  rambamHead: number | null;
  /** visual exaggeration of the 5.1° tilt */
  exaggerate: number;
}

const R = 10, INC = 5.145;

const create = (host: HTMLElement, p0: MoonOrbitProps): SceneHandle<MoonOrbitProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.25));
  const sunLight = new THREE.DirectionalLight(0xffffff, 2.2);
  scene.add(sunLight);

  // ecliptic plane and ring
  scene.add(disc(R * 1.08, 0x88c5d8, 0.07));
  scene.add(ring(R, COLORS.leap, { opacity: 0.8 }));
  const ecl = label('מסלול השמש (המזלות)', 'leap small');
  ecl.position.set(0, 0, R * 1.12);
  scene.add(ecl);

  // earth
  const earthB = earthBody(0.9), earth = earthB.object;
  scene.add(earth);
  const earthL = label('ארץ', 'small');
  earthL.position.set(0, -1.5, 0);
  scene.add(earthL);

  // the moon's plane (rebuilt on update)
  const moonGroup = new THREE.Group();
  scene.add(moonGroup);
  const moonB = moonBody(0.45), moon = moonB.object;
  scene.add(moon);
  const moonL = label('ירח', 'moon');
  scene.add(moonL);
  const latLine = new THREE.Group();
  scene.add(latLine);

  // sun far away
  const sunB = sunBody(1.2), sun = sunB.object;
  scene.add(sun);
  const sunL = label('שמש', 'moon');
  scene.add(sunL);
  const sunRay = new THREE.Group();
  scene.add(sunRay);

  // node labels & eclipse zones
  const head = label('ראש', 'shift'), tail = label('זנב', 'shift');
  scene.add(head, tail);
  const rHead = label('ראש לפי הרמב״ם', 'ok small');
  const rHeadDot = sphere(0.18, COLORS.ok, true);
  scene.add(rHead, rHeadDot);

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(moonGroup);
    clearGroup(latLine);
    clearGroup(sunRay);
    const inc = INC * p.exaggerate;
    const n = dirOf(p.node);
    // moon orbit: rotate the ecliptic circle about the node axis
    const q = new THREE.Quaternion().setFromAxisAngle(n, (inc * Math.PI) / 180);
    const pts: THREE.Vector3[] = [];
    for (let i = 0; i < 180; i++) pts.push(dirOf(i * 2, 0, R).applyQuaternion(q));
    moonGroup.add(lineLoop(pts, COLORS.moon));
    const plane = disc(R * 1.02, COLORS.moon, 0.08);
    plane.quaternion.premultiply(q);
    moonGroup.add(plane);
    // node line
    moonGroup.add(line([dirOf(p.node, 0, R * 1.15), dirOf(p.node + 180, 0, R * 1.15)], COLORS.shift, { dashed: true }));
    head.position.copy(dirOf(p.node, 0, R * 1.25));
    tail.position.copy(dirOf(p.node + 180, 0, R * 1.25));
    // eclipse zones: ±~12° of each node on the ecliptic
    for (const c of [p.node, p.node + 180]) {
      const arc: THREE.Vector3[] = [];
      for (let a = -12; a <= 12; a += 1) arc.push(dirOf(c + a, 0, R));
      moonGroup.add(line(arc, COLORS.shift, { opacity: 0.9 }));
    }
    // moon
    const mpos = dirOf(p.moonLon, p.moonLat * p.exaggerate, R);
    moon.position.copy(mpos);
    moon.lookAt(earth.position);
    moonL.position.copy(mpos.clone().add(new THREE.Vector3(0, 0.9, 0)));
    latLine.add(line([dirOf(p.moonLon, 0, R), mpos], COLORS.moon, { dashed: true }));
    // sun direction
    const sd = dirOf(p.sunLon, 0, 26);
    sun.position.copy(sd);
    sunL.position.copy(sd.clone().add(new THREE.Vector3(0, 1.8, 0)));
    sunLight.position.copy(sd);
    earthB.setSun!(sd);
    sunRay.add(line([new THREE.Vector3(), dirOf(p.sunLon, 0, R)], COLORS.sun, { dashed: true, opacity: 0.6 }));
    // Rambam's head
    const show = p.rambamHead !== null;
    rHead.visible = rHeadDot.visible = show;
    if (show) {
      rHeadDot.position.copy(dirOf(p.rambamHead!, 0, R));
      rHead.position.copy(dirOf(p.rambamHead!, 0, R * 1.25).add(new THREE.Vector3(0, -0.8, 0)));
    }
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      if (id === 'top') st.look([0, 30, 0.01]);
      else if (id === 'edge') { const v = dirOf(p.node + 90, 0, 30); st.look([v.x, 1.5, v.z]); }
      else st.look([16, 12, 20]);
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [sunB, earthB, moonB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<MoonOrbitProps> = { create };
export default mod;
