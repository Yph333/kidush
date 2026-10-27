// The Moon as seen from the Earth: the camera sits at the Earth's centre and looks at the Moon, the light comes
// from the Sun's true direction, so the phase (and the craters on the terminator) are drawn, not painted.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { moonBody, onTextureLoad } from './bodies';
import { THREE, createStage, dirOf } from './common';

export interface MoonFaceProps {
  sunLam: number;
  moonLam: number;
  moonBeta: number;
}

const D = 10;

const create = (host: HTMLElement, p0: MoonFaceProps): SceneHandle<MoonFaceProps> => {
  const st = createStage(host, { fov: 7 });
  st.controls.enabled = false;
  const { scene } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.035));
  const sunLight = new THREE.DirectionalLight(0xffffff, 3);
  scene.add(sunLight, sunLight.target);
  const moonB = moonBody(0.42), moon = moonB.object;
  scene.add(moon);
  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    const M = dirOf(p.moonLam, p.moonBeta, D);
    moon.position.copy(M);
    moon.lookAt(0, 0, 0);
    sunLight.target.position.copy(M);
    sunLight.position.copy(M.clone().add(dirOf(p.sunLam, 0, 50)));
    st.camera.up.set(0, 1, 0);       // ecliptic north up
    st.look([0, 0, 0.0001], [M.x, M.y, M.z]);
    st.camera.position.set(0, 0, 0);
    st.camera.lookAt(M);
    st.render();
  };
  build();
  return {
    update(np) { p = np; build(); },
    setView() { build(); },
    setAutoRotate() { /* fixed view */ },
    setRealism(on) { moonB.setRealism(on); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<MoonFaceProps> = { create };
export default mod;
