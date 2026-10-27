// The Earth with Jerusalem marked (Kiddush HaChodesh 11:17): its latitude, the band 29°–35°, and the area around it
// "six or seven days" away where the new moon is watched for. The globe is turned so Jerusalem faces the viewer.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { earthBody, onTextureLoad } from './bodies';
import { COLORS, THREE, createStage, line } from './common';

export interface EarthPinProps {
  lat: number;
  lon: number;
  /** radius of the area around the city, km */
  areaKm: number;
  /** show the latitude band */
  band?: [number, number];
}

const RE = 3;
/** a point on the globe (longitude 0 at +x, north at +y, as earthBody's textures) */
const P = (lat: number, lon: number, r = RE) => {
  const f = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(f) * Math.cos(l), r * Math.sin(f), -r * Math.cos(f) * Math.sin(l));
};

const create = (host: HTMLElement, p0: EarthPinProps): SceneHandle<EarthPinProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.35));
  const light = new THREE.DirectionalLight(0xffffff, 2);
  scene.add(light);
  const earthB = earthBody(RE);
  scene.add(earthB.object);
  const marks = new THREE.Group();
  scene.add(marks);
  const city = label('ירושלים', 'moon');
  scene.add(city);
  const bandL = label('', 'small');
  scene.add(bandL);
  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    marks.clear();
    const C = P(p.lat, p.lon, RE * 1.002), out = C.clone().normalize();
    const dot = new THREE.Mesh(new THREE.SphereGeometry(0.05, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.moon }));
    dot.position.copy(C);
    marks.add(dot);
    city.position.copy(out.clone().multiplyScalar(RE * 1.12));
    // the area around the city
    const ang = p.areaKm / 6371, pts: THREE.Vector3[] = [];
    const e = new THREE.Vector3(0, 1, 0).cross(out).normalize(), n = out.clone().cross(e).normalize();
    for (let k = 0; k <= 72; k++) { const t = (2 * Math.PI * k) / 72; pts.push(out.clone().multiplyScalar(Math.cos(ang)).add(e.clone().multiplyScalar(Math.sin(ang) * Math.cos(t))).add(n.clone().multiplyScalar(Math.sin(ang) * Math.sin(t))).multiplyScalar(RE * 1.004)); }
    marks.add(line(pts, COLORS.moon, { opacity: 0.95 }));
    // the latitude circles
    for (const lat of p.band ?? []) {
      const q: THREE.Vector3[] = [];
      for (let k = 0; k <= 180; k++) q.push(P(lat, k * 2, RE * 1.003));
      marks.add(line(q, COLORS.leap, { opacity: 0.8 }));
    }
    const eq: THREE.Vector3[] = [];
    for (let k = 0; k <= 180; k++) eq.push(P(0, k * 2, RE * 1.003));
    marks.add(line(eq, 0x88c5d8, { opacity: 0.6, dashed: true }));
    bandL.visible = !!p.band;
    if (p.band) { bandL.element.textContent = `${p.band[0]}°–${p.band[1]}° צפון`; bandL.position.copy(P(p.band[1] + 4, p.lon - 25, RE * 1.05)); }
    light.position.copy(out.clone().multiplyScalar(10).add(new THREE.Vector3(3, 4, 0)));
    earthB.setSun?.(light.position.clone().multiplyScalar(10));
    st.look(out.clone().multiplyScalar(RE * 3.1).add(new THREE.Vector3(0, 1.2, 0)).toArray() as [number, number, number], [0, 0, 0]);
  };
  build();
  return {
    update(np) { p = np; build(); },
    setView() { build(); },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { earthB.setRealism(on); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<EarthPinProps> = { create };
export default mod;
