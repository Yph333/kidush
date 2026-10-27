// A solar eclipse as seen from the ground: the Moon's disc crossing the Sun's (positions, sizes and timing from the
// engine), the sky darkening with the hidden fraction, and — only at totality — the corona and prominences, with
// the "diamond ring" just before and after. Seen from the point of greatest eclipse, or from the chosen city.

import { useEffect, useMemo, useRef, useState } from 'react';
import { type Eclipse, contacts, observerView, shadowAxis } from '../../engines/eclipses';
import { hm } from '../../engines/astro';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Num, Tag } from '../../components/text';

const MIN = 60000;

/** A fixed pseudo-random sequence, so the corona keeps its shape from frame to frame. */
function seeded(seed: number) { let s = seed; return () => ((s = (s * 16807) % 2147483647) / 2147483647); }

function draw(cv: HTMLCanvasElement, v: ReturnType<typeof observerView>, seed: number) {
  const dpr = Math.min(2, window.devicePixelRatio || 1), W = cv.clientWidth, H = cv.clientHeight;
  if (cv.width !== Math.round(W * dpr)) { cv.width = Math.round(W * dpr); cv.height = Math.round(H * dpr); }
  const g = cv.getContext('2d')!;
  g.setTransform(dpr, 0, 0, dpr, 0, 0);
  const cx = W / 2, cy = H / 2, R = Math.min(W, H) * 0.17, k = R / v.rs;
  const mx = cx + v.dx * k, my = cy - v.dy * k, Rm = v.rm * k;
  const total = v.phase === 'total';
  const sliver = v.phase !== 'none' && !total && v.obsc > 0.975 && v.rm >= v.rs * 0.995;   // just before / after totality

  // sky: daylight blue, darkening steeply only in the last few percent, deep blue at totality with a horizon glow
  const light = total ? 0 : Math.pow(1 - v.obsc, 0.42);
  const mix = (a: number[], b: number[], t: number) => a.map((x, i) => Math.round(x + (b[i] - x) * t));
  const top = mix([10, 16, 38], [52, 108, 182], light), bot = mix([60, 46, 70], [150, 190, 228], light);
  const sky = g.createLinearGradient(0, 0, 0, H);
  sky.addColorStop(0, `rgb(${top})`);
  sky.addColorStop(1, `rgb(${bot})`);
  g.fillStyle = sky;
  g.fillRect(0, 0, W, H);

  const rnd = seeded(seed);
  if (total || sliver) {
    // the corona: a soft inner glow and long, uneven streamers (drawn with blur), stronger at totality
    const a = total ? 1 : 0.35;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const inner = g.createRadialGradient(cx, cy, R * 0.95, cx, cy, R * 2.6);
    inner.addColorStop(0, `rgba(255,250,238,${0.85 * a})`);
    inner.addColorStop(0.25, `rgba(235,240,255,${0.35 * a})`);
    inner.addColorStop(1, 'rgba(200,215,255,0)');
    g.fillStyle = inner;
    g.beginPath(); g.arc(cx, cy, R * 2.6, 0, Math.PI * 2); g.fill();
    g.filter = 'blur(6px)';
    for (let i = 0; i < 48; i++) {
      const ang = rnd() * Math.PI * 2;
      // streamers are longer near the solar "equator" (a horizontal band here), short near the poles
      const eq = Math.abs(Math.cos(ang));
      const len = R * (0.4 + (0.5 + 2.6 * eq * eq) * rnd());
      const wid = 0.07 + 0.16 * rnd();
      const x0 = cx + Math.cos(ang) * R * 0.98, y0 = cy + Math.sin(ang) * R * 0.98;
      const x1 = cx + Math.cos(ang) * (R + len), y1 = cy + Math.sin(ang) * (R + len);
      const gr = g.createLinearGradient(x0, y0, x1, y1);
      gr.addColorStop(0, `rgba(255,252,245,${(0.16 + 0.22 * rnd()) * a})`);
      gr.addColorStop(1, 'rgba(255,252,245,0)');
      g.fillStyle = gr;
      g.beginPath();
      g.moveTo(cx + Math.cos(ang - wid) * R, cy + Math.sin(ang - wid) * R);
      g.lineTo(x1, y1);
      g.lineTo(cx + Math.cos(ang + wid) * R, cy + Math.sin(ang + wid) * R);
      g.closePath();
      g.fill();
    }
    g.restore();
  }

  // the Sun: limb-darkened disc
  if (!total) {
    const sun = g.createRadialGradient(cx, cy, 0, cx, cy, R);
    sun.addColorStop(0, '#FFFDF2');
    sun.addColorStop(0.7, '#FFF1C8');
    sun.addColorStop(0.93, '#FFD58A');
    sun.addColorStop(1, '#F5A653');
    g.fillStyle = sun;
    g.beginPath(); g.arc(cx, cy, R, 0, Math.PI * 2); g.fill();
  }

  // prominences: small pink flames at the limb, seen only while the Moon covers the photosphere
  if (total) {
    const pr = seeded(seed + 7);
    for (let i = 0; i < 6; i++) {
      const ang = pr() * Math.PI * 2, h = R * (0.05 + 0.08 * pr());
      g.fillStyle = `rgba(255,${80 + Math.round(60 * pr())},120,0.85)`;
      g.beginPath();
      g.ellipse(cx + Math.cos(ang) * (R + h * 0.4), cy + Math.sin(ang) * (R + h * 0.4), h, h * 0.45, ang, 0, Math.PI * 2);
      g.fill();
    }
  }

  // the Moon
  if (v.phase !== 'none' || Math.hypot(mx - cx, my - cy) < R + Rm + 40) {
    g.fillStyle = '#06070B';
    g.beginPath(); g.arc(mx, my, Rm, 0, Math.PI * 2); g.fill();
  }

  // the diamond ring: the last bead of sunlight, on the Sun's limb away from the Moon's centre
  if (sliver) {
    const ang = Math.atan2(cy - my, cx - mx), bx = cx + Math.cos(ang) * R, by = cy + Math.sin(ang) * R;
    g.save();
    g.globalCompositeOperation = 'lighter';
    const d = g.createRadialGradient(bx, by, 0, bx, by, R * 0.9);
    d.addColorStop(0, 'rgba(255,255,255,1)');
    d.addColorStop(0.12, 'rgba(255,250,230,0.8)');
    d.addColorStop(1, 'rgba(255,240,210,0)');
    g.fillStyle = d;
    g.beginPath(); g.arc(bx, by, R * 0.9, 0, Math.PI * 2); g.fill();
    g.fillStyle = '#FFFFFF';
    g.beginPath(); g.arc(bx, by, R * 0.06, 0, Math.PI * 2); g.fill();
    g.restore();
  }
}

export function EclipseObserver({ e, home }: { e: Eclipse; home: { lat: number; lon: number; name: string } }) {
  const centre = useMemo(() => shadowAxis(e.ms), [e.ms]);
  const [where, setWhere] = useState<'centre' | 'home'>('centre');
  const place = where === 'centre' ? centre : home;
  const C = useMemo(() => contacts(e, place), [e, place.lat, place.lon]);   // eslint-disable-line react-hooks/exhaustive-deps
  const [t, setT] = useState(C ? (C.c2 ?? C.max) - 3 * MIN : e.ms);
  useEffect(() => { if (C) setT((C.c2 ?? C.max) - 3 * MIN); }, [C]);
  const span: [number, number] = C ? [C.c1 - 10 * MIN, C.c4 + 10 * MIN] : [e.ms - 3 * 60 * MIN, e.ms + 3 * 60 * MIN];
  // play: four minutes per second, slowed to twenty seconds per second around totality
  const player = usePlay(dt => setT(x => {
    const nearCentral = C?.c2 != null && x > C.c2 - 2 * MIN && x < C.c3! + 2 * MIN;
    const n = x + dt * (nearCentral ? 20000 : 4 * MIN);
    return n > span[1] ? span[0] : n;
  }));
  const v = observerView(t, place);
  const cv = useRef<HTMLCanvasElement>(null);
  useEffect(() => { if (cv.current) draw(cv.current, v, e.k); });
  useEffect(() => {
    const el = cv.current;
    if (!el) return;
    const ro = new ResizeObserver(() => draw(el, observerView(t, place), e.k));
    ro.observe(el);
    return () => ro.disconnect();
  }, [t, place, e.k]);   // eslint-disable-line react-hooks/exhaustive-deps

  // never round a sliver of sunlight up to 100%
  const pct = v.phase === 'total' ? '100' : v.obsc > 0.99 ? (Math.floor(v.obsc * 1000) / 10).toFixed(1) : String(Math.round(v.obsc * 100));
  const label = v.sunAlt < -0.83 ? 'השמש מתחת לאופק' : v.phase === 'total' ? 'ליקוי מלא: הקורונה נראית' : v.phase === 'annular' ? 'טבעת של אור' : v.phase === 'partial' ? (v.obsc > 0.975 && v.rm >= v.rs * 0.995 ? 'טבעת היהלום' : 'ליקוי חלקי') : 'לפני הליקוי או אחריו';
  const rel = C?.c2 != null ? t - C.c2 : C ? t - C.max : 0;
  const placeName = where === 'centre' ? 'נקודת השיא' : home.name;

  return (
    <div className="eclipse-obs">
      <div className="seg" role="group" aria-label="מאיפה מסתכלים">
        <button type="button" aria-pressed={where === 'centre'} onClick={() => setWhere('centre')}>בנקודת השיא</button>
        <button type="button" aria-pressed={where === 'home'} onClick={() => setWhere('home')}>מ{home.name}</button>
      </div>
      {!C ? (
        <p className="note">מ{placeName} לא רואים את הליקוי הזה{where === 'home' ? ' (השמש מתחת לאופק, או שהירח לא מגיע אליה משם).' : '.'}</p>
      ) : <>
        <canvas ref={cv} className="eclipse-sky" role="img"
          aria-label={`הליקוי כפי שנראה מ${placeName}, ${hm(t)}: ${label}, ${pct}% מהשמש מוסתר`} />
        <div className="eclipse-read">
          <Tag tone={v.phase === 'total' ? 'moon' : v.phase === 'none' ? 'leap' : 'ok'}>{label}</Tag>
          <span><Num>{pct}%</Num> מהשמש מוסתר</span>
          <span>גובה השמש <Num>{v.sunAlt.toFixed(0)}°</Num></span>
          <span><Num>{hm(t)}</Num> (שעון ישראל){C.c2 != null && <> · <Num>{`${rel < 0 ? '−' : '+'}${Math.floor(Math.abs(rel) / MIN)}:${String(Math.floor(Math.abs(rel) / 1000) % 60).padStart(2, '0')}`}</Num> {rel < 0 ? 'עד' : 'מתחילת'} {C.central === 'total' ? 'המלאות' : 'הטבעת'}</>}</span>
        </div>
        <div className="ctl eclipse-ctl">
          <button type="button" className="btn pri" aria-pressed={player.playing} onClick={player.toggle}>{player.playing ? '❚❚ עצור' : '▶ הפעל'}</button>
          {C.c2 != null && <button type="button" className="btn" onClick={() => { player.stop(); setT(C.c2! - 20000); }}>לרגע לפני {C.central === 'total' ? 'המלאות' : 'הטבעת'}</button>}
          <input type="range" min={span[0]} max={span[1]} step={5000} value={t} onChange={x => { player.stop(); setT(+x.target.value); }} aria-label="הזמן במהלך הליקוי" />
        </div>
        <p className="note">
          מגע ראשון <Num>{hm(C.c1)}</Num>
          {C.c2 != null && <> · {C.central === 'total' ? 'מלאות' : 'טבעת'} <Num>{hm(C.c2)}–{hm(C.c3!)}</Num> (<Num>{Math.floor((C.c3! - C.c2) / MIN)}:{String(Math.round((C.c3! - C.c2) / 1000) % 60).padStart(2, '0')}</Num> דקות)</>}
          {' · '}מגע אחרון <Num>{hm(C.c4)}</Num>. אסור להביט בשמש בלי מסננים מיוחדים, גם כשרובה מכוסה. רק ברגעי המלאות עצמם הקורונה נראית לעין.
        </p>
      </>}
    </div>
  );
}
