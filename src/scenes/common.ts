// Shared three.js setup for the scenes: renderer + HTML labels + orbit controls, rendered on demand.

import * as THREE from 'three';
import { OrbitControls } from 'three/addons/controls/OrbitControls.js';
import { CSS2DObject, CSS2DRenderer } from 'three/addons/renderers/CSS2DRenderer.js';

export { THREE };

export const COLORS = {
  bg: 0x070a14,
  ink: 0xe8ecf6,
  muted: 0x7d88a8,
  moon: 0xe7c76f,
  shift: 0xef8f76,
  leap: 0xb0a2ff,
  ok: 0x7fce9c,
  sun: 0xf4c33f,
  earth: 0x3e7cb8,
};

export interface Stage {
  scene: THREE.Scene;
  camera: THREE.PerspectiveCamera;
  controls: OrbitControls;
  render: () => void;
  label: (text: string, cls?: string) => CSS2DObject;
  /** set camera position (and target) and re-render */
  look: (pos: [number, number, number], target?: [number, number, number]) => void;
  /** slowly orbit the camera around the target */
  setAutoRotate: (on: boolean) => void;
  dispose: () => void;
}

export function createStage(host: HTMLElement, opts: { fov?: number; near?: number; far?: number } = {}): Stage {
  const w = host.clientWidth || 600, h = host.clientHeight || 400;
  const renderer = new THREE.WebGLRenderer({ antialias: true, alpha: true });
  renderer.setPixelRatio(Math.min(2, window.devicePixelRatio || 1));
  renderer.setSize(w, h);
  renderer.setClearColor(0x000000, 0);   // transparent: the scene sits on the page background
  host.appendChild(renderer.domElement);

  const labels = new CSS2DRenderer();
  labels.setSize(w, h);
  labels.domElement.className = 'scene-labels';
  host.appendChild(labels.domElement);

  const scene = new THREE.Scene();
  const camera = new THREE.PerspectiveCamera(opts.fov ?? 45, w / h, opts.near ?? 0.1, opts.far ?? 1000);
  // Drag/zoom must reach the canvas: the label layer above it ignores pointer events (see .scene-labels).
  const controls = new OrbitControls(camera, renderer.domElement);
  controls.enableDamping = false;
  controls.enablePan = false;
  controls.autoRotateSpeed = 1.2;

  const render = () => { renderer.render(scene, camera); labels.render(scene, camera); };
  controls.addEventListener('change', render);

  const ro = new ResizeObserver(() => {
    const W = host.clientWidth, H = host.clientHeight;
    if (!W || !H) return;
    renderer.setSize(W, H);
    labels.setSize(W, H);
    const narrowBefore = camera.aspect < 1.4, narrowNow = W / H < 1.4;
    camera.aspect = W / H;
    camera.updateProjectionMatrix();
    if (last && (narrowBefore || narrowNow)) look(last.pos, last.target); else render();
  });
  ro.observe(host);

  const label = (text: string, cls = '') => {
    const el = document.createElement('div');
    el.className = `s-label ${cls}`;
    el.dir = 'rtl';
    el.textContent = text;
    return new CSS2DObject(el);
  };

  // Views are framed for a wide panel; on a narrow (portrait) panel pull the camera back so the scene still fits.
  let last: { pos: [number, number, number]; target: [number, number, number] } | null = null;
  const look = (pos: [number, number, number], target: [number, number, number] = [0, 0, 0]) => {
    last = { pos, target };
    const k = camera.aspect < 1.4 ? 1.4 / camera.aspect : 1;
    camera.position.set(target[0] + (pos[0] - target[0]) * k, target[1] + (pos[1] - target[1]) * k, target[2] + (pos[2] - target[2]) * k);
    controls.target.set(...target);
    controls.update();
    render();
  };

  // A render loop runs only while the camera auto-rotates; otherwise frames are drawn on demand.
  let raf = 0;
  const tick = () => { controls.update(); render(); raf = requestAnimationFrame(tick); };
  const setAutoRotate = (on: boolean) => {
    controls.autoRotate = on;
    cancelAnimationFrame(raf);
    if (on) raf = requestAnimationFrame(tick);
  };

  const dispose = () => {
    cancelAnimationFrame(raf);
    ro.disconnect();
    controls.dispose();
    scene.traverse(o => {
      const m = o as THREE.Mesh;
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose?.();
      if (o instanceof CSS2DObject) o.element.remove();
    });
    renderer.dispose();
    renderer.domElement.remove();
    labels.domElement.remove();
  };

  return { scene, camera, controls, render, label, look, setAutoRotate, dispose };
}

/** Ecliptic / horizontal convention used by all scenes: y is up; longitude λ → (cos λ, 0, −sin λ). */
export const dirOf = (lonDeg: number, latDeg = 0, r = 1): THREE.Vector3 => {
  const l = (lonDeg * Math.PI) / 180, b = (latDeg * Math.PI) / 180;
  return new THREE.Vector3(r * Math.cos(b) * Math.cos(l), r * Math.sin(b), -r * Math.cos(b) * Math.sin(l));
};

/** A circle as a line loop in the XZ plane (or along given points). */
export function ring(radius: number, color: number, opts: { dashed?: boolean; opacity?: number; segments?: number } = {}): THREE.LineLoop {
  const pts: THREE.Vector3[] = [];
  const n = opts.segments ?? 128;
  for (let i = 0; i < n; i++) { const a = (i / n) * Math.PI * 2; pts.push(new THREE.Vector3(radius * Math.cos(a), 0, -radius * Math.sin(a))); }
  return lineLoop(pts, color, opts);
}

export function lineLoop(pts: THREE.Vector3[], color: number, opts: { dashed?: boolean; opacity?: number } = {}): THREE.LineLoop {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = opts.dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.4, gapSize: 0.3, transparent: true, opacity: opts.opacity ?? 1 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: opts.opacity ?? 1 });
  const l = new THREE.LineLoop(g, m);
  if (opts.dashed) l.computeLineDistances();
  return l;
}

export function line(pts: THREE.Vector3[], color: number, opts: { dashed?: boolean; opacity?: number } = {}): THREE.Line {
  const g = new THREE.BufferGeometry().setFromPoints(pts);
  const m = opts.dashed
    ? new THREE.LineDashedMaterial({ color, dashSize: 0.3, gapSize: 0.25, transparent: true, opacity: opts.opacity ?? 1 })
    : new THREE.LineBasicMaterial({ color, transparent: true, opacity: opts.opacity ?? 1 });
  const l = new THREE.Line(g, m);
  if (opts.dashed) l.computeLineDistances();
  return l;
}

export function sphere(r: number, color: number, emissive = false): THREE.Mesh {
  const mat = emissive
    ? new THREE.MeshBasicMaterial({ color })
    : new THREE.MeshStandardMaterial({ color, roughness: 0.9, metalness: 0 });
  return new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), mat);
}

export function disc(r: number, color: number, opacity: number): THREE.Mesh {
  const m = new THREE.Mesh(new THREE.CircleGeometry(r, 96), new THREE.MeshBasicMaterial({ color, transparent: true, opacity, side: THREE.DoubleSide, depthWrite: false }));
  m.rotation.x = -Math.PI / 2;
  return m;
}

/** Empty a group that is rebuilt on every update, freeing its GPU buffers and HTML labels. */
export function clearGroup(g: THREE.Object3D): void {
  g.traverse(o => {
    const m = o as THREE.Mesh;
    if (o !== g) {
      m.geometry?.dispose?.();
      const mat = m.material as THREE.Material | THREE.Material[] | undefined;
      if (Array.isArray(mat)) mat.forEach(x => x.dispose()); else mat?.dispose?.();
      if (o instanceof CSS2DObject) o.element.remove();
    }
  });
  g.clear();
}
