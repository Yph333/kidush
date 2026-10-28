// The Earth coloured by where the new crescent can be seen on one evening (18:13–16): a coarse grid of the Odeh
// criterion (lib/visibilityMap) painted on a shell over the globe, the band 30°–35° north and Jerusalem.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import type { VisCell } from '../lib/visibilityMap';
import { earthBody, onTextureLoad } from './bodies';
import { COLORS, THREE, createStage, line } from './common';

export interface VisGlobeProps { cells: VisCell[]; step: number; band?: [number, number] }

const RE = 3;
const P = (lat: number, lon: number, r = RE) => {
  const f = (lat * Math.PI) / 180, l = (lon * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(f) * Math.cos(l), r * Math.sin(f), -r * Math.cos(f) * Math.sin(l));
};
export const ZONE_RGBA: Record<string, string> = { A: 'rgba(70,200,110,0.5)', B: 'rgba(200,225,80,0.5)', C: 'rgba(245,150,60,0.5)', D: 'rgba(0,0,0,0)' };

const create = (host: HTMLElement, p0: VisGlobeProps): SceneHandle<VisGlobeProps> => {
  const st = createStage(host);
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 1.0));
  const earthB = earthBody(RE);
  earthB.setSun?.(new THREE.Vector3(0, 0, 0).add(P(0, 20, 100)));
  scene.add(earthB.object);
  const canvas = document.createElement('canvas');
  canvas.width = 720; canvas.height = 360;
  const tex = new THREE.CanvasTexture(canvas);
  tex.colorSpace = THREE.SRGBColorSpace;
  const shell = new THREE.Mesh(new THREE.SphereGeometry(RE * 1.006, 96, 48), new THREE.MeshBasicMaterial({ map: tex, transparent: true, depthWrite: false }));
  scene.add(shell);
  const marks = new THREE.Group();
  scene.add(marks);
  const J = P(31.78, 35.23, RE * 1.01), dot = new THREE.Mesh(new THREE.SphereGeometry(0.045, 16, 12), new THREE.MeshBasicMaterial({ color: COLORS.moon }));
  dot.position.copy(J);
  scene.add(dot);
  const city = label('ירושלים', 'moon');
  city.position.copy(J.clone().normalize().multiplyScalar(RE * 1.12));
  scene.add(city);
  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    const g = canvas.getContext('2d')!;
    g.clearRect(0, 0, 720, 360);
    const s = p.step * 2;
    for (const c of p.cells) {
      if (!c.zone || c.zone === 'D') continue;
      g.fillStyle = ZONE_RGBA[c.zone];
      g.fillRect((c.lon - p.step / 2 + 180) * 2, (90 - c.lat - p.step / 2) * 2, s + 0.5, s + 0.5);
    }
    tex.needsUpdate = true;
    marks.clear();
    for (const lat of p.band ?? []) marks.add(line(Array.from({ length: 181 }, (_, k) => P(lat, k * 2, RE * 1.012)), COLORS.leap, { opacity: 0.9 }));
    st.render();
  };
  build();
  const face = (lat: number, lon: number, d = 3.1) => {
    earthB.setSun?.(P(lat + 10, lon + 20, 100));     // daylight where we look: this is a map, not a picture of that evening
    st.look(P(lat, lon, RE * d).toArray() as [number, number, number], [0, 0, 0]);
  };
  return {
    update(np) { p = np; build(); },
    setView(id) { if (id === 'west') face(25, -45); else if (id === 'whole') face(15, -10, 3.8); else face(28, 25); },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { earthB.setRealism(on); st.render(); },
    dispose() { offTex(); tex.dispose(); st.dispose(); },
  };
};

const mod: SceneModule<VisGlobeProps> = { create };
export default mod;
