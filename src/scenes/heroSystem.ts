// The home screen's hero: the Earth, the Moon on its orbit and the Sun, drawn on a transparent canvas so they sit
// directly on the page's space background. The Moon is placed at tonight's real elongation from the Sun (from the
// astro engine), so the phase you see is today's. Photographic bodies (NASA imagery, see bodies.ts).
// Not interactive; drifts slowly unless reduced motion.

import { THREE } from './common';
import { earthBody, moonBody, onTextureLoad, sunBody } from './bodies';

export interface HeroProps {
  /** Moon − Sun ecliptic longitude, degrees (0 = new moon, 180 = full) */
  elongation: number;
  /** animate (false = a single still frame) */
  motion: boolean;
}

export interface HeroHandle { update(p: HeroProps): void; dispose(): void }

export function createHero(host: HTMLElement, p0: HeroProps): HeroHandle {
  const w = host.clientWidth || 600, h = host.clientHeight || 600;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);
  renderer.outputColorSpace = THREE.SRGBColorSpace;
  renderer.toneMapping = THREE.ACESFilmicToneMapping;
  host.appendChild(renderer.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(32, w / h, 0.1, 500);
  camera.position.set(1.2, 4.2, 19);
  camera.lookAt(0.5, 0, 0);

  // the Sun at the frame's left edge (the text is on the right, RTL); it is the only light
  const sunDir = new THREE.Vector3(-1, 0.12, 0.28).normalize();
  const sun = sunBody(0.75, { glow: 11 });
  sun.object.position.copy(sunDir.clone().multiplyScalar(7.6));
  scene.add(sun.object);
  const light = new THREE.DirectionalLight(0xfff4e0, 3.2);
  light.position.copy(sunDir.clone().multiplyScalar(40));
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x9fb4ff, 0.04));
  const farSun = sunDir.clone().multiplyScalar(1000);   // sunlight is parallel at this scale

  // the Earth with its axis tilt
  const earthTilt = new THREE.Group();
  earthTilt.rotation.z = THREE.MathUtils.degToRad(23.44);
  scene.add(earthTilt);
  const earth = earthBody(1.7);
  earth.setSun!(farSun);
  const spin0 = THREE.MathUtils.degToRad(150);   // Africa and the Middle East toward the viewer at first
  earth.object.rotation.y = spin0;
  earthTilt.add(earth.object);

  // the Moon's orbit and the Moon, its near side turned to the Earth
  const R = 5.2;
  const orbit = new THREE.Group();
  orbit.rotation.x = THREE.MathUtils.degToRad(5.1);
  scene.add(orbit);
  const ringPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; ringPts.push(new THREE.Vector3(R * Math.cos(a), 0, -R * Math.sin(a))); }
  orbit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })));
  const moon = moonBody(0.45);
  orbit.add(moon.object);

  let p = p0, raf = 0, t0 = performance.now();
  const sunAngle = Math.atan2(-sunDir.z, sunDir.x);   // the Sun's direction as an orbit angle
  const centre = new THREE.Vector3();
  const place = (drift: number) => {
    const a = sunAngle + THREE.MathUtils.degToRad(p.elongation) + drift;
    moon.object.position.set(R * Math.cos(a), 0, -R * Math.sin(a));
    moon.object.lookAt(orbit.localToWorld(centre.set(0, 0, 0)));
  };
  const draw = () => renderer.render(scene, camera);
  const frame = (now: number) => {
    const s = (now - t0) / 1000;
    earth.object.rotation.y = spin0 + s * 0.05;
    place(s * 0.004);
    draw();
    raf = requestAnimationFrame(frame);
  };
  const still = () => { place(0); draw(); };
  const start = () => { cancelAnimationFrame(raf); if (p.motion) raf = requestAnimationFrame(frame); else still(); };
  start();
  const offTex = onTextureLoad(() => { if (!p.motion) still(); });

  // pause when the canvas is off screen
  const io = new IntersectionObserver(([e]) => { if (e.isIntersecting) start(); else cancelAnimationFrame(raf); });
  io.observe(host);
  const ro = new ResizeObserver(() => {
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H);
    camera.aspect = W / H;
    // keep the whole system in frame on tall, narrow hosts
    camera.position.setLength(W / H < 1 ? 19.5 / (W / H) ** 0.6 : 19.5);
    camera.updateProjectionMatrix();
    if (!p.motion) still();
  });
  ro.observe(host);

  return {
    update(np) { p = np; t0 = performance.now(); start(); },
    dispose() {
      cancelAnimationFrame(raf);
      offTex();
      io.disconnect();
      ro.disconnect();
      // geometries and materials belong to this scene; the shared textures stay cached for the next one
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        (m.material as THREE.Material | undefined)?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
