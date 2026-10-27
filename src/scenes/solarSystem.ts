// The solar system: the Sun, the eight planets at their true positions for the date (JPL elements), the Earth's
// Moon at its true position, and the major moons of Mars, Jupiter, Saturn, Uranus and Neptune on their real orbits.
// Three scales: everything true; true distances with enlarged bodies; and a comfortable view.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { moonEcl, TofMs } from '../engines/astro';
import { AU_KM, LUNA, MOONS, PHYS, PLANETS, type PlanetId, SUN, eqToEcl, helio, moonAngle, orbitPath } from '../engines/planets';
import { earthBody, moonBody, onTextureLoad, orientEarth, sunBody } from './bodies';
import { THREE, createStage, line } from './common';
import { planetTexture, saturnRings } from './planetLooks';

export type Scale = 'true' | 'bodies' | 'comfort';
export type Focus = 'sun' | PlanetId;

export interface SolarProps {
  ms: number;
  scale: Scale;
  focus: Focus;
}

/** J2000 ecliptic (x, y, z) → scene (x, z, −y): y is up, longitude λ → (cos λ, 0, −sin λ) as in every scene. */
const S = (x: number, y: number, z: number) => new THREE.Vector3(x, z, -y);

const ENLARGE = 800, SUN_ENLARGE = 20;
/** distance from the Sun (AU) → scene units */
const dist = (r: number, sc: Scale) => (sc === 'comfort' ? 4 * Math.sqrt(r) : r);
/** body radius (km) → scene units */
function radius(km: number, sc: Scale, isSun = false): number {
  if (sc === 'true') return km / AU_KM;
  if (sc === 'bodies') return (km / AU_KM) * (isSun ? SUN_ENLARGE : ENLARGE);
  return isSun ? 1.1 : 0.08 + 0.1 * Math.log2(Math.max(1, km / 1500));
}
/** a moon's orbital radius around an (enlarged) planet: real when true, otherwise spread so it stays outside */
function moonDist(aKm: number, planetKm: number, planetDraw: number, sc: Scale): number {
  if (sc === 'true') return aKm / AU_KM;
  return planetDraw * (1.6 + 0.75 * Math.log2(aKm / planetKm));
}

interface Planet { id: PlanetId; group: THREE.Group; spin: THREE.Object3D; pole: THREE.Vector3; u: THREE.Vector3; v: THREE.Vector3; label: ReturnType<ReturnType<typeof createStage>['label']>; orbit: THREE.Line | null }

const create = (host: HTMLElement, p0: SolarProps): SceneHandle<SolarProps> => {
  const st = createStage(host, { near: 1e-7, far: 5000, logDepth: true });
  st.controls.minDistance = 1e-6;
  st.controls.maxDistance = 400;
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.06));
  const light = new THREE.PointLight(0xffffff, 3.4, 0, 0);
  scene.add(light);

  const sunB = sunBody(1), sun = sunB.object;
  scene.add(sun);
  const sunL = label(SUN.name, 'moon');
  scene.add(sunL);

  const orbits = new THREE.Group();
  scene.add(orbits);

  const planets: Planet[] = PLANETS.map(id => {
    const group = new THREE.Group(), spin = new THREE.Group();
    group.add(spin);
    if (id === 'earth') {
      const b = earthBody(1);
      spin.add(b.object);
      (spin as THREE.Group & { body?: typeof b }).body = b;
    } else {
      spin.add(new THREE.Mesh(new THREE.SphereGeometry(1, 64, 48), new THREE.MeshStandardMaterial({ map: planetTexture(id), roughness: 1, metalness: 0 })));
      if (id === 'saturn') group.add(saturnRings(1));
    }
    // the pole: tilt the planet (and its rings and moons' plane) to its true axis
    const [px, py, pz] = eqToEcl(...PHYS[id].pole), pole = S(px, py, pz).normalize();
    if (id !== 'earth') group.quaternion.setFromUnitVectors(new THREE.Vector3(0, 1, 0), pole);
    const u = new THREE.Vector3().crossVectors(pole, new THREE.Vector3(0, 0, 1)).normalize(), v = new THREE.Vector3().crossVectors(pole, u).normalize();
    const lab = label(PHYS[id].name, 'small');
    scene.add(group, lab);
    return { id, group, spin, pole, u, v, label: lab, orbit: null };
  });
  const byId = new Map(planets.map(p => [p.id, p]));

  const luna = moonBody(1), lunaObj = luna.object;
  scene.add(lunaObj);
  const lunaL = label(LUNA.name, 'small');
  scene.add(lunaL);
  const moons = MOONS.map(m => {
    const mesh = new THREE.Mesh(new THREE.SphereGeometry(1, 24, 16), new THREE.MeshStandardMaterial({ color: m.color, roughness: 1 }));
    const l = label(m.name, 'small');
    const ring = new THREE.Group();
    scene.add(mesh, l, ring);
    return { m, mesh, l, ring };
  });

  const offTex = onTextureLoad(st.render);
  let p = p0, builtScale: Scale | null = null, lastTarget = new THREE.Vector3(), view = 'oblique';

  /** orbits depend only on the scale (and slowly on the date): rebuild when the scale changes */
  const buildOrbits = () => {
    orbits.clear();
    for (const pl of planets) {
      const pts = orbitPath(pl.id, p.ms, 240).map(h => S(h.x, h.y, h.z).multiplyScalar(dist(h.r, p.scale) / h.r));
      orbits.add(line(pts, pl.id === 'earth' ? 0x5cb8ff : 0x8c98ae, { opacity: pl.id === 'earth' ? 0.7 : 0.35 }));
    }
    builtScale = p.scale;
  };

  const place = () => {
    if (builtScale !== p.scale) buildOrbits();
    const sc = p.scale, rs = radius(SUN.radius, sc, true);
    sun.scale.setScalar(rs);
    sunL.position.set(0, -rs * 1.6 - (sc === 'true' ? 0 : 0.15), 0);
    const pos = new Map<PlanetId, THREE.Vector3>(), draw = new Map<PlanetId, number>();
    for (const pl of planets) {
      const h = helio(pl.id, p.ms), P = S(h.x, h.y, h.z).multiplyScalar(dist(h.r, sc) / h.r), R = radius(PHYS[pl.id].radius, sc);
      pos.set(pl.id, P); draw.set(pl.id, R);
      pl.group.position.copy(P);
      pl.group.scale.setScalar(R);
      // rotation about the axis: the Earth turned to its true orientation, the others by their day length
      if (pl.id === 'earth') {
        orientEarth(pl.spin, p.ms);
        const b = (pl.spin as THREE.Group & { body?: { setSun?(w: THREE.Vector3): void } }).body;
        b?.setSun?.(new THREE.Vector3(0, 0, 0));   // the Sun is at the centre
      } else pl.spin.rotation.y = ((p.ms / 3600000) / PHYS[pl.id].day) * 2 * Math.PI;
      pl.label.position.copy(P.clone().add(new THREE.Vector3(0, -R * (sc === 'true' ? 2.2 : 1.5) - (sc === 'true' ? 0 : 0.12), 0)));
    }
    // the Earth's Moon: its true geocentric position
    const E = pos.get('earth')!, eR = draw.get('earth')!, mE = moonEcl(TofMs(p.ms).T);
    const md = moonDist(mE.dist, 6371, eR, sc), lam = (mE.lam * Math.PI) / 180, bet = (mE.beta * Math.PI) / 180;
    const M = E.clone().add(S(Math.cos(bet) * Math.cos(lam), Math.cos(bet) * Math.sin(lam), Math.sin(bet)).multiplyScalar(md));
    lunaObj.position.copy(M);
    lunaObj.scale.setScalar(radius(LUNA.radius, sc) || 1e-9);
    lunaObj.lookAt(E);
    lunaL.position.copy(M.clone().add(new THREE.Vector3(0, radius(LUNA.radius, sc) * (sc === 'true' ? 3 : 2) + (sc === 'true' ? 0 : 0.05), 0)));
    lunaL.visible = p.focus === 'earth';
    // the other moons, in their planet's equatorial plane
    for (const { m, mesh, l, ring } of moons) {
      const pl = byId.get(m.planet)!, P = pos.get(m.planet)!, R = draw.get(m.planet)!;
      const a = moonDist(m.a, PHYS[m.planet].radius, R, sc), th = moonAngle(m, p.ms);
      const off = pl.u.clone().multiplyScalar(Math.cos(th) * a).add(pl.v.clone().multiplyScalar(Math.sin(th) * a));
      mesh.position.copy(P).add(off);
      mesh.scale.setScalar(sc === 'comfort' ? Math.max(R * 0.12, R * (m.radius / PHYS[m.planet].radius) * 1.5) : radius(m.radius, sc));
      l.position.copy(mesh.position).add(new THREE.Vector3(0, mesh.scale.x * 2.5, 0));
      l.visible = p.focus === m.planet;
      ring.clear();
      if (p.focus === m.planet) {
        const pts: THREE.Vector3[] = [];
        for (let k = 0; k <= 96; k++) { const t = (2 * Math.PI * k) / 96; pts.push(P.clone().add(pl.u.clone().multiplyScalar(Math.cos(t) * a)).add(pl.v.clone().multiplyScalar(Math.sin(t) * a))); }
        ring.add(line(pts, m.color, { opacity: 0.35 }));
      }
    }
    // follow the focused body: move the camera with it
    const target = p.focus === 'sun' ? new THREE.Vector3() : pos.get(p.focus)!.clone();
    st.camera.position.add(target.clone().sub(lastTarget));
    st.controls.target.copy(target);
    lastTarget = target;
    st.controls.update();
    st.render();
  };

  /** frame the focused body (or the whole system) for the current scale */
  const frame = () => {
    const sc = p.scale;
    let R: number;
    if (p.focus === 'sun') R = sc === 'comfort' ? 26 : 34;
    else {
      const r = radius(PHYS[p.focus].radius, sc), farMoon = Math.max(0, ...MOONS.filter(m => m.planet === p.focus).map(m => moonDist(m.a, PHYS[m.planet].radius, r, sc)));
      R = Math.max(r * 8, (p.focus === 'earth' ? moonDist(LUNA.a, 6371, r, sc) * 0.75 : farMoon) * 2.2);
    }
    const T = lastTarget;
    if (view === 'top') st.look([T.x, T.y + R * 1.1, T.z + R * 0.001], [T.x, T.y, T.z]);
    else st.look([T.x + R * 0.55, T.y + R * 0.5, T.z + R * 0.85], [T.x, T.y, T.z]);
  };

  let lastFocus = p.focus, lastScale = p.scale;
  place();
  frame();

  return {
    update(np) {
      p = np;
      place();
      if (np.focus !== lastFocus || np.scale !== lastScale) { lastFocus = np.focus; lastScale = np.scale; frame(); }
    },
    setView(id) { view = id; frame(); },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { sunB.setRealism(on); luna.setRealism(on); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<SolarProps> = { create };
export default mod;
