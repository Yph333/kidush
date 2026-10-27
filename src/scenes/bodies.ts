// Photographic Sun, Moon and Earth for the 3D scenes. Each body carries two looks — "real" (NASA imagery,
// lit by the Sun) and "schematic" (the flat colours the lessons used before) — and can switch between them.
// Textures ship inside the app (src/assets/space, see SOURCES.md); nothing is fetched at run time.
// Position and orientation always come from the engines; these only paint.

import { COLORS, THREE } from './common';
import moonColorUrl from '../assets/space/moon-color.jpg';
import moonBumpUrl from '../assets/space/moon-bump.jpg';
import earthDayUrl from '../assets/space/earth-day.jpg';
import earthNightUrl from '../assets/space/earth-night.jpg';
import earthWaterUrl from '../assets/space/earth-water.jpg';
import earthCloudsUrl from '../assets/space/earth-clouds.jpg';
import { earthBasis } from '../lib/earthFrame';

export interface Body {
  /** add this to the scene and position it like any object */
  object: THREE.Group;
  /** photographic (true) or schematic (false) */
  setRealism(on: boolean): void;
  /** where the Sun is (world space) — only bodies with a day/night side use it */
  setSun?(world: THREE.Vector3): void;
  /** tint the surface (the Moon in the Earth's shadow turns copper) */
  setTint?(color: number, emissive?: number): void;
}

/* ---------- textures: loaded once, shared by every scene, never disposed (small, reused) ---------- */
const cache = new Map<string, THREE.Texture>();
const listeners = new Set<() => void>();
/** call fn whenever a texture finishes loading (scenes that draw on demand redraw); returns an unsubscribe */
export function onTextureLoad(fn: () => void): () => void { listeners.add(fn); return () => { listeners.delete(fn); }; }
function tex(url: string, color = true): THREE.Texture {
  let t = cache.get(url);
  if (!t) {
    t = new THREE.TextureLoader().load(url, () => listeners.forEach(f => f()));
    t.colorSpace = color ? THREE.SRGBColorSpace : THREE.NoColorSpace;
    t.anisotropy = 4;
    cache.set(url, t);
  }
  return t;
}

function twoLooks(real: THREE.Object3D, flat: THREE.Object3D): Pick<Body, 'object' | 'setRealism'> {
  const object = new THREE.Group();
  object.add(real, flat);
  const setRealism = (on: boolean) => { real.visible = on; flat.visible = !on; };
  setRealism(true);
  return { object, setRealism };
}

/* ---------- the Moon: LROC colour + LOLA relief, lit by the scene's lights ---------- */
export function moonBody(r: number): Body {
  const real = new THREE.Mesh(
    new THREE.SphereGeometry(r, 96, 64),
    new THREE.MeshStandardMaterial({ map: tex(moonColorUrl), bumpMap: tex(moonBumpUrl, false), bumpScale: 2.2, roughness: 1, metalness: 0 }),
  );
  real.rotation.y = -Math.PI / 2;   // the near side (longitude 0, the map's centre) now faces +z: object.lookAt(earth) turns it to the Earth
  const flat = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ color: 0xdddddd, roughness: 0.9 }));
  const mats = [real.material, flat.material];
  return {
    ...twoLooks(real, flat),
    // the photographic map is multiplied by the colour, so white = untinted
    setTint: (color, emissive = 0) => mats.forEach((m, i) => { m.color.set(i === 0 && color === 0xdddddd ? 0xffffff : color); m.emissive.set(emissive); }),
  };
}

/* ---------- the Earth: day map where the Sun shines, city lights on the night side, oceans glint,
   clouds above, a thin atmosphere at the rim ---------- */
const EARTH_VERT = /* glsl */`
varying vec2 vUv; varying vec3 vNw; varying vec3 vPw;
void main() {
  vUv = uv;
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPw = w.xyz; vNw = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const EARTH_FRAG = /* glsl */`
uniform sampler2D uDay; uniform sampler2D uNight; uniform sampler2D uWater; uniform vec3 uSun;
varying vec2 vUv; varying vec3 vNw; varying vec3 vPw;
void main() {
  vec3 n = normalize(vNw), l = normalize(uSun - vPw), v = normalize(cameraPosition - vPw);
  float d = dot(n, l);
  float day = smoothstep(-0.12, 0.22, d);                       // soft terminator (twilight band)
  vec3 dayCol = texture2D(uDay, vUv).rgb * (0.08 + 1.05 * max(d, 0.0));
  float water = texture2D(uWater, vUv).r;
  float spec = pow(max(dot(reflect(-l, n), v), 0.0), 40.0) * water * 0.55 * step(0.0, d);
  vec3 nightCol = texture2D(uNight, vUv).rgb;
  nightCol = nightCol * nightCol * 2.4;                         // keep the city lights, drop the moonlit land
  vec3 col = mix(nightCol, dayCol + vec3(1.0, 0.95, 0.85) * spec, day);
  gl_FragColor = vec4(col, 1.0);
  #include <colorspace_fragment>
}`;
const ATMOS_VERT = /* glsl */`
varying vec3 vNw; varying vec3 vPw;
void main() {
  vec4 w = modelMatrix * vec4(position, 1.0);
  vPw = w.xyz; vNw = normalize(mat3(modelMatrix) * normal);
  gl_Position = projectionMatrix * viewMatrix * w;
}`;
const ATMOS_FRAG = /* glsl */`
uniform vec3 uSun; varying vec3 vNw; varying vec3 vPw;
void main() {
  vec3 n = normalize(vNw), v = normalize(cameraPosition - vPw), l = normalize(uSun - vPw);
  float rim = pow(1.0 - max(dot(n, v), 0.0), 2.6);
  float lit = smoothstep(-0.25, 0.45, dot(n, l));
  gl_FragColor = vec4(vec3(0.42, 0.68, 1.0), rim * (0.12 + 0.88 * lit) * 0.9);
}`;

export function earthBody(r: number): Body {
  const sun = new THREE.Vector3(100, 0, 0);
  const surface = new THREE.Mesh(
    new THREE.SphereGeometry(r, 128, 96),
    new THREE.ShaderMaterial({
      vertexShader: EARTH_VERT, fragmentShader: EARTH_FRAG,
      uniforms: { uDay: { value: tex(earthDayUrl) }, uNight: { value: tex(earthNightUrl) }, uWater: { value: tex(earthWaterUrl, false) }, uSun: { value: sun } },
    }),
  );
  const clouds = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.008, 96, 64),
    new THREE.MeshStandardMaterial({ color: 0xffffff, alphaMap: tex(earthCloudsUrl, false), transparent: true, depthWrite: false, roughness: 1, opacity: 0.9 }),
  );
  const atmos = new THREE.Mesh(
    new THREE.SphereGeometry(r * 1.06, 96, 64),
    new THREE.ShaderMaterial({ vertexShader: ATMOS_VERT, fragmentShader: ATMOS_FRAG, uniforms: { uSun: { value: sun } }, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending, side: THREE.FrontSide }),
  );
  const real = new THREE.Group();
  real.add(surface, clouds, atmos);
  const flat = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshStandardMaterial({ color: COLORS.earth, roughness: 0.9 }));
  return { ...twoLooks(real, flat), setSun: w => { sun.copy(w); } };
}

/** Turn a globe (longitude 0 at +x, north pole at +y) to its true orientation at the moment ms (sidereal time + axial tilt). */
export function orientEarth(globe: THREE.Object3D, ms: number): void {
  const [x, y, z] = earthBasis(ms);
  globe.quaternion.setFromRotationMatrix(new THREE.Matrix4().makeBasis(new THREE.Vector3(...x), new THREE.Vector3(...y), new THREE.Vector3(...z)));
}

/* ---------- the Sun: limb darkening and granulation on the disc, a soft glow around it ---------- */
const SUN_VERT = /* glsl */`
varying vec3 vN; varying vec3 vV; varying vec3 vP;
void main() {
  vP = position;
  vec4 mv = modelViewMatrix * vec4(position, 1.0);
  vN = normalize(normalMatrix * normal); vV = normalize(-mv.xyz);
  gl_Position = projectionMatrix * mv;
}`;
const SUN_FRAG = /* glsl */`
uniform float uR;
varying vec3 vN; varying vec3 vV; varying vec3 vP;
float hash(vec3 p) { p = fract(p * 0.3183099 + 0.1); p *= 17.0; return fract(p.x * p.y * p.z * (p.x + p.y + p.z)); }
float noise(vec3 x) {
  vec3 i = floor(x), f = fract(x); f = f * f * (3.0 - 2.0 * f);
  return mix(mix(mix(hash(i), hash(i + vec3(1,0,0)), f.x), mix(hash(i + vec3(0,1,0)), hash(i + vec3(1,1,0)), f.x), f.y),
             mix(mix(hash(i + vec3(0,0,1)), hash(i + vec3(1,0,1)), f.x), mix(hash(i + vec3(0,1,1)), hash(i + vec3(1,1,1)), f.x), f.y), f.z);
}
void main() {
  float mu = clamp(dot(normalize(vN), normalize(vV)), 0.0, 1.0);
  float limb = 1.0 - 0.6 * (1.0 - pow(mu, 0.8));               // brighter centre, darker, redder edge
  vec3 p = vP / uR;
  float g = noise(p * 22.0) * 0.6 + noise(p * 55.0) * 0.4;      // granulation
  vec3 core = vec3(1.0, 0.97, 0.88), edge = vec3(1.0, 0.62, 0.22);
  vec3 col = mix(edge, core, pow(mu, 0.55)) * limb * (0.9 + 0.18 * g);
  gl_FragColor = vec4(col * 1.25, 1.0);
}`;

function glowTexture(): THREE.CanvasTexture {
  const c = document.createElement('canvas');
  c.width = c.height = 256;
  const g = c.getContext('2d')!;
  const grd = g.createRadialGradient(128, 128, 0, 128, 128, 128);
  grd.addColorStop(0, 'rgba(255,240,205,0.95)');
  grd.addColorStop(0.22, 'rgba(255,214,140,0.55)');
  grd.addColorStop(0.45, 'rgba(255,170,80,0.16)');
  grd.addColorStop(1, 'rgba(0,0,0,0)');
  g.fillStyle = grd;
  g.fillRect(0, 0, 256, 256);
  const t = new THREE.CanvasTexture(c);
  t.colorSpace = THREE.SRGBColorSpace;
  return t;
}
let glow: THREE.CanvasTexture | null = null;

export function sunBody(r: number, opts: { glow?: number } = {}): Body {
  const disc = new THREE.Mesh(new THREE.SphereGeometry(r, 64, 48), new THREE.ShaderMaterial({ vertexShader: SUN_VERT, fragmentShader: SUN_FRAG, uniforms: { uR: { value: r } } }));
  glow ??= glowTexture();
  const halo = new THREE.Sprite(new THREE.SpriteMaterial({ map: glow, transparent: true, depthWrite: false, blending: THREE.AdditiveBlending }));
  halo.scale.setScalar(r * (opts.glow ?? 4.5));
  const real = new THREE.Group();
  real.add(halo, disc);
  const flat = new THREE.Mesh(new THREE.SphereGeometry(r, 48, 32), new THREE.MeshBasicMaterial({ color: COLORS.sun }));
  return twoLooks(real, flat);
}
