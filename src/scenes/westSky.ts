// The western sky over Jerusalem at the time of sighting: the horizon, the path of the zodiac across the sky
// (coloured by sign), the celestial equator, the sun under the horizon and the moon above it, lit from the sun's
// side so its crescent faces the right way. Each step of ch. 17 / 19 adds its piece as a highlighted path.

import type { SceneHandle, SceneModule } from '../components/Scene3D/types';
import { SIGNS } from '../engines/rambam';
import { moonBody, onTextureLoad, sunBody } from './bodies';
import { COLORS, THREE, clearGroup, createStage, disc, line, lineLoop } from './common';
import { hor } from './skyDome';
import { SIGN_COLORS } from './zodiacWheel';

export interface AltAz { alt: number; az: number }
export interface SkyPath { pts: AltAz[]; color: number; label?: string; dashed?: boolean; width?: number }
export interface WestSkyProps {
  sun: AltAz;
  moon: AltAz;
  ecliptic: (AltAz & { lon: number })[];
  equator: AltAz[];
  paths: SkyPath[];
  /** a faint second moon (e.g. where it is without parallax) */
  ghost?: AltAz | null;
  /** a word above the moon (e.g. the verdict) */
  moonLabel?: string;
}

const R = 10;

const create = (host: HTMLElement, p0: WestSkyProps): SceneHandle<WestSkyProps> => {
  const st = createStage(host, { fov: 28 });
  const { scene, label } = st;
  scene.add(new THREE.AmbientLight(0xffffff, 0.14));   // a little "earthshine", so the dark disc shows
  const sunLight = new THREE.DirectionalLight(0xffffff, 3.2);
  scene.add(sunLight, sunLight.target);

  // ground (a little see-through, so the sun under the horizon still shows) and the horizon
  const ground = disc(R * 1.6, 0x16211a, 0.78);
  scene.add(ground);
  scene.add(lineLoop(Array.from({ length: 180 }, (_, i) => hor(0, (i / 180) * 360)), COLORS.ink, { opacity: 0.85 }));
  const dome = new THREE.Mesh(new THREE.SphereGeometry(R, 36, 18, 0, Math.PI * 2, 0, Math.PI / 2),
    new THREE.MeshBasicMaterial({ color: 0x88c5d8, wireframe: true, transparent: true, opacity: 0.05 }));
  scene.add(dome);
  for (const [az, t] of [[0, 'צפון'], [180, 'דרום'], [270, 'מערב'], [240, 'דרום־מערב'], [300, 'צפון־מערב']] as const) {
    const l = label(t, 'small');
    l.position.copy(hor(-2.5, az, R * 1.02));
    scene.add(l);
  }
  const fixed = new THREE.Group(), dyn = new THREE.Group();
  scene.add(fixed, dyn);
  const sunB = sunBody(0.35, { glow: 4 }), moonB = moonBody(0.13), ghostB = moonBody(0.13);   // about three times its true size: big enough to find, small enough to leave the arcs in view
  ghostB.setTint?.(0x88c5d8);
  scene.add(sunB.object, moonB.object, ghostB.object);
  // a ring around the moon, so the small disc is easy to find
  const halo = new THREE.Mesh(new THREE.RingGeometry(0.3, 0.34, 48), new THREE.MeshBasicMaterial({ color: 0xe7c76f, transparent: true, opacity: 0.8, side: THREE.DoubleSide }));
  scene.add(halo);
  const L = { sun: label('השמש', 'small'), moon: label('הירח', 'moon'), ghost: label('בלי שינוי המראה', 'small') };
  Object.values(L).forEach(l => scene.add(l));

  const offTex = onTextureLoad(st.render);
  let p = p0;
  const build = () => {
    clearGroup(fixed);
    // the zodiac across the sky, each sign in its colour; names where it is above the horizon
    for (let i = 1; i < p.ecliptic.length; i++) {
      const a = p.ecliptic[i - 1], b = p.ecliptic[i];
      if (a.alt < -12 && b.alt < -12) continue;
      fixed.add(line([hor(a.alt, a.az), hor(b.alt, b.az)], SIGN_COLORS[Math.floor(a.lon / 30) % 12], { opacity: a.alt < 0 ? 0.35 : 1 }));
    }
    for (let s = 0; s < 12 && p.ecliptic.length; s++) {
      const m = p.ecliptic.reduce((x, y) => (Math.abs(y.lon - (s * 30 + 15)) < Math.abs(x.lon - (s * 30 + 15)) ? y : x));
      if (m.alt < 1) continue;
      const l = label(SIGNS[s], 'sign');
      l.element.style.color = `#${SIGN_COLORS[s].toString(16)}`;
      l.position.copy(hor(m.alt + 2.2, m.az));
      fixed.add(l);
    }
    fixed.add(line(p.equator.map(q => hor(q.alt, q.az)), 0x88c5d8, { dashed: true, opacity: 0.8 }));
    const eqTop = p.equator.filter(q => q.alt > 5 && q.az > 200 && q.az < 340)[0];
    if (eqTop) { const l = label('הקו השווה', 'small'); l.position.copy(hor(eqTop.alt + 2, eqTop.az)); fixed.add(l); }

    clearGroup(dyn);
    p.paths.filter(s => s.label).forEach((s, i) => {
      // labels to the south (left, looking west) of their path, one under the other, clear of the moon's own label
      const m = s.pts[Math.floor(s.pts.length / 2)], l = label(s.label!, 'small strong');
      l.element.style.color = `#${s.color.toString(16).padStart(6, '0')}`;
      l.position.copy(hor(m.alt + 0.5 - 2.4 * i, m.az - 7));
      dyn.add(l);
      dyn.add(line([hor(m.alt + 0.5 - 2.4 * i, m.az - 4.5, R * 0.995), hor(m.alt, m.az, R * 0.995)], s.color, { opacity: 0.5 }));
    });
    for (const s of p.paths) dyn.add(line(s.pts.map(q => hor(q.alt, q.az, R * 0.995)), s.color, { dashed: s.dashed }));
    const S = hor(p.sun.alt, p.sun.az), M = hor(p.moon.alt, p.moon.az);
    sunB.object.position.copy(S);
    L.sun.position.copy(hor(p.sun.alt + 2.5, p.sun.az));
    if (p.sun.alt < 0) dyn.add(line([S, hor(0, p.sun.az)], 0xf4c33f, { dashed: true, opacity: 0.6 }));
    moonB.object.position.copy(M);
    moonB.object.lookAt(0, 0, 0);
    halo.position.copy(M);
    halo.lookAt(0, 0, 0);
    // the moon is lit from the sun's direction (the sun is far: the same direction from the moon as from us)
    sunLight.target.position.copy(M);
    sunLight.position.copy(M.clone().add(S.clone().normalize().multiplyScalar(40)));
    L.moon.element.textContent = p.moonLabel ?? 'הירח';
    L.moon.position.copy(hor(p.moon.alt + 2.6, p.moon.az));
    ghostB.object.visible = L.ghost.visible = !!p.ghost;
    if (p.ghost) {
      const G = hor(p.ghost.alt, p.ghost.az);
      ghostB.object.position.copy(G);
      ghostB.object.lookAt(0, 0, 0);
      L.ghost.position.copy(hor(p.ghost.alt + 2.2, p.ghost.az + 3));
    }
    st.render();
  };
  build();

  return {
    update(np) { p = np; build(); },
    setView(id) {
      // aim between the sun and the moon, so both (and the arcs between them) fill the view
      const m = hor((p.moon.alt + Math.max(p.sun.alt, -6)) / 2 + 1, (p.moon.az + p.sun.az) / 2);
      if (id === 'out') st.look([16, 13, 15], [0, 1, 0]);
      else {
        // standing in the middle, looking at the moon in the west (set directly: st.look would pull a narrow view
        // back, out of the dome)
        st.camera.position.set(-m.x * 0.05, 0.3, -m.z * 0.05);
        st.controls.target.set(m.x, m.y, m.z);
        st.controls.update();
        st.render();
      }
    },
    setAutoRotate: st.setAutoRotate,
    setRealism(on) { [sunB, moonB, ghostB].forEach(b => b.setRealism(on)); st.render(); },
    dispose() { offTex(); st.dispose(); },
  };
};

const mod: SceneModule<WestSkyProps> = { create };
export default mod;
