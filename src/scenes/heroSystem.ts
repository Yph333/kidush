// The home screen's hero: the Earth, the Moon on its orbit and the Sun's light, drawn on a transparent canvas so
// it sits directly on the page's space background. The Moon is placed at tonight's real elongation from the Sun
// (from the astro engine), so the phase you see is today's. Not interactive; drifts slowly unless reduced motion.
// Schematic materials for now; photographic textures come in the realism pass.

import { THREE } from './common';

export interface HeroProps {
  /** Moon − Sun ecliptic longitude, degrees (0 = new moon, 180 = full) */
  elongation: number;
  /** animate (false = a single still frame) */
  motion: boolean;
}

export interface HeroHandle { update(p: HeroProps): void; dispose(): void }

const ATMOS_VERT = `
varying vec3 vN; varying vec3 vV;
void main() {
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const ATMOS_FRAG = `
uniform vec3 uColor; uniform vec3 uSun;
varying vec3 vN; varying vec3 vV;
void main() {
  float rim = pow(1.0 - max(dot(vN, vV), 0.0), 3.0);
  float lit = smoothstep(-0.35, 0.6, dot(vN, uSun));
  gl_FragColor = vec4(uColor, rim * (0.25 + 0.75 * lit));
}`;

function glowTexture(inner: string, outer: string): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, inner);
  grd.addColorStop(0.18, inner);
  grd.addColorStop(0.35, outer);
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}

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

  // the Sun: far to the side, a bright core with a soft glow; it is the only light
  const sunDir = new THREE.Vector3(-1, 0.12, 0.28).normalize();   // to the left: the text is on the right (RTL)
  const sun = new THREE.Sprite(new THREE.SpriteMaterial({ map: glowTexture('rgba(255,247,225,1)', 'rgba(255,190,90,0.28)'), depthWrite: false, blending: THREE.AdditiveBlending }));
  sun.position.copy(sunDir.clone().multiplyScalar(7.6));   // at the frame's edge: its glow lights the scene
  sun.scale.setScalar(7);
  scene.add(sun);
  const light = new THREE.DirectionalLight(0xfff4e0, 3.1);
  light.position.copy(sunDir.clone().multiplyScalar(40));
  scene.add(light);
  scene.add(new THREE.AmbientLight(0x9fb4ff, 0.06));

  // the Earth with its axis tilt and a thin atmosphere
  const earthTilt = new THREE.Group();
  earthTilt.rotation.z = THREE.MathUtils.degToRad(23.44);
  scene.add(earthTilt);
  const earth = new THREE.Mesh(
    new THREE.SphereGeometry(1.7, 96, 64),
    new THREE.MeshStandardMaterial({ color: 0x2a5d9c, roughness: 0.85, metalness: 0, emissive: 0x050b18, emissiveIntensity: 1 }),
  );
  earthTilt.add(earth);
  // atmosphere: a rim glow, brighter on the day side
  const atmos = new THREE.Mesh(
    new THREE.SphereGeometry(1.8, 96, 64),
    new THREE.ShaderMaterial({
      vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending,
      uniforms: { uColor: { value: new THREE.Color(0x6fb6ff) }, uSun: { value: new THREE.Vector3() } },
    }),
  );
  scene.add(atmos);

  // the Moon's orbit and the Moon
  const R = 5.2;
  const orbit = new THREE.Group();
  orbit.rotation.x = THREE.MathUtils.degToRad(5.1);
  scene.add(orbit);
  const ringPts: THREE.Vector3[] = [];
  for (let i = 0; i <= 256; i++) { const a = (i / 256) * Math.PI * 2; ringPts.push(new THREE.Vector3(R * Math.cos(a), 0, -R * Math.sin(a))); }
  orbit.add(new THREE.Line(new THREE.BufferGeometry().setFromPoints(ringPts), new THREE.LineBasicMaterial({ color: 0xffffff, transparent: true, opacity: 0.16 })));
  const moon = new THREE.Mesh(new THREE.SphereGeometry(0.45, 64, 48), new THREE.MeshStandardMaterial({ color: 0xc9c6bf, roughness: 0.95, metalness: 0 }));
  orbit.add(moon);

  let p = p0, raf = 0, t0 = performance.now();
  const sunAngle = Math.atan2(-sunDir.z, sunDir.x);   // the Sun's direction as an orbit angle
  const place = (drift: number) => {
    const a = sunAngle + THREE.MathUtils.degToRad(p.elongation) + drift;
    moon.position.set(R * Math.cos(a), 0, -R * Math.sin(a));
    const viewSun = sunDir.clone().transformDirection(camera.matrixWorldInverse);
    (atmos.material as THREE.ShaderMaterial).uniforms.uSun.value.copy(viewSun);
  };
  const frame = (now: number) => {
    const s = (now - t0) / 1000;
    earth.rotation.y = s * 0.05;
    place(s * 0.004);
    renderer.render(scene, camera);
    raf = requestAnimationFrame(frame);
  };
  const still = () => { place(0); renderer.render(scene, camera); };
  const start = () => { cancelAnimationFrame(raf); if (p.motion) raf = requestAnimationFrame(frame); else still(); };
  camera.updateMatrixWorld();
  start();

  // pause when the canvas is off screen or the tab is hidden
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
    camera.updateMatrixWorld();
    if (!p.motion) still();
  });
  ro.observe(host);

  return {
    update(np) { p = np; t0 = performance.now(); start(); },
    dispose() {
      cancelAnimationFrame(raf);
      io.disconnect();
      ro.disconnect();
      scene.traverse(o => {
        const m = o as THREE.Mesh;
        m.geometry?.dispose?.();
        const mat = m.material as THREE.Material & { map?: THREE.Texture };
        mat?.map?.dispose?.();
        mat?.dispose?.();
      });
      renderer.dispose();
      renderer.domElement.remove();
    },
  };
}
