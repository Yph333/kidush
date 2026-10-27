// SVG pictures for the sky slides: moon glyph, phase strip, top-down orbit, Earth–Moon zoom, sky panorama.

import { type ReactNode, useId } from 'react';
import { gem, hebDate, yearHeb } from '../../engines/calendar';
import { D2R, R2D, type Place, type Sky, TofMs, dayOfMs, hm, nrm, sky, sunEcl } from '../../engines/astro';
import type { MonthModel } from '../../lib/month';

/** Moon disc with lit fraction k, rotated so the lit limb points at `rot` degrees. */
export function MoonGlyph({ cx, cy, r, k, rot, dash }: { cx: number; cy: number; r: number; k: number; rot: number; dash?: boolean }) {
  const rx = Math.abs(1 - 2 * k) * r, sw = k < 0.5 ? 0 : 1;
  return (
    <g transform={`translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(1)})`} opacity={dash ? 0.45 : undefined}>
      <circle r={r} className="mdark" stroke={dash ? '#fff' : undefined} strokeDasharray={dash ? '3 3' : undefined} />
      {k > 0.004 && <path d={`M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${sw} 0 ${-r}Z`} className="mlit" />}
    </g>
  );
}

/** The moon at sunset of every evening of the month, right to left. */
export function PhaseStrip({ M, t }: { M: MonthModel; t: number }) {
  const W = 760, n = M.len, cw = W / n;
  const cur = hebDate(dayOfMs(t, M.c));
  return (
    <>
      <p className="vt">{M.name} {yearHeb(M.y)}: הירח בשקיעה של כל ערב</p>
      <svg viewBox={`0 0 ${W} 86`} role="img" aria-label="מופעי הירח בכל ערב בחודש" className="full">
        {M.strip.map((o, i) => {
          const x = W - (i + 0.5) * cw, isCur = cur.y === M.y && cur.mi === M.mi && cur.d === o.d;
          return (
            <g key={o.d}>
              {isCur && <rect x={x - cw / 2 + 1} y="2" width={cw - 2} height="82" rx="6" className="fl-moonsoft" style={{ stroke: 'var(--moon)', strokeWidth: 2 }} />}
              <MoonGlyph cx={x} cy={30} r={Math.min(11, cw * 0.4)} k={o.k} rot={o.wax ? 0 : 180} />
              <text x={x} y="62" textAnchor="middle" className="svgt" fontSize="12" fontWeight="700">{gem(o.d)}</text>
              <text x={x} y="78" textAnchor="middle" className="svgt tx-muted" fontSize="9">{Math.round(o.k * 100)}%</text>
            </g>
          );
        })}
      </svg>
    </>
  );
}

const L = (a: number): [number, number] => [Math.cos(a * D2R), -Math.sin(a * D2R)];

/** Sun at the centre, Earth on its orbit, Moon around the Earth (not to scale). */
export function OrbitTopDown({ M, sk }: { M: MonthModel; sk: Sky }) {
  const R = 135, re = 26;
  const le = nrm(sk.sunLam + 180);
  const [ex, ey] = L(le).map(v => v * R), [mx, my] = L(sk.moonLam).map(v => v * re);
  const a0 = nrm(sunEcl(TofMs(M.strip[0].ss).T).lam + 180), a1 = nrm(sunEcl(TofMs(M.strip[M.len - 1].ss).T).lam + 180);
  const [p0x, p0y] = L(a0).map(v => v * R), [p1x, p1y] = L(a1).map(v => v * R);
  return (
    <svg viewBox="-170 -170 340 340" role="img" aria-label="מבט על: שמש, כדור הארץ וירח">
      <circle r={R} fill="none" className="wtick" strokeDasharray="3 4" />
      <path d={`M${p0x.toFixed(1)} ${p0y.toFixed(1)}A${R} ${R} 0 0 0 ${p1x.toFixed(1)} ${p1y.toFixed(1)}`} fill="none" className="st-leap" strokeWidth="5" opacity=".5" />
      <circle r="20" className="sunf" /><text y="38" className="wc3">שמש</text>
      <circle cx={ex} cy={ey} r={re} fill="none" className="wtick" strokeDasharray="2 3" />
      <g transform={`translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${(-le).toFixed(1)})`}>
        <circle r="9" fill="#3E7CB8" /><path d="M0 -9A9 9 0 0 1 0 9Z" fill="#0E1A33" opacity=".8" />
      </g>
      <circle cx={ex + mx} cy={ey + my} r="5" className="mlit" stroke="#555" strokeWidth=".5" />
      <text x={ex} y={ey + (ey > 60 ? -34 : 44)} className="wc3">כדור הארץ</text>
      <text y="-150" className="wc1">מבט על, מלמעלה (לא בקנה מידה)</text>
      <text y="160" className="wc1">כחול: הדרך של כדור הארץ בחודש הזה</text>
    </svg>
  );
}

/** Earth at the centre, sunlight from the right, the moon at its elongation. */
export function EarthMoonZoom({ sk }: { sk: Sky }) {
  const R = 112, e = sk.dlam, mx = R * Math.cos(e * D2R), my = -R * Math.sin(e * D2R), lg = e > 180 ? 1 : 0;
  return (
    <svg viewBox="-170 -170 340 340" role="img" aria-label="מערכת ארץ־ירח, השמש מימין">
      {[-120, -60, 0, 60, 120].map(y => (
        <g key={y}><line x1="168" y1={y} x2="140" y2={y} stroke="#F4C33F" strokeWidth="2" /><path d={`M140 ${y}l6 -4v8z`} fill="#F4C33F" /></g>
      ))}
      <text x="118" y="-140" className="wc1">אור השמש</text>
      <circle r={R} fill="none" className="wtick" strokeDasharray="3 4" />
      {([[0, 'מולד'], [90, 'רבע ראשון'], [180, 'מילוא'], [270, 'רבע אחרון']] as const).map(([a, t]) => (
        <text key={a} x={(R - 40) * Math.cos(a * D2R)} y={-(R - 22) * Math.sin(a * D2R) + 4} className="wc1">{t}</text>
      ))}
      <path d={`M48 0A48 48 0 ${lg} 0 ${(48 * Math.cos(e * D2R)).toFixed(1)} ${(-48 * Math.sin(e * D2R)).toFixed(1)}`} fill="none" className="st-moon" strokeWidth="3" />
      <circle r="24" fill="#3E7CB8" /><path d="M0 -24A24 24 0 0 0 0 24Z" fill="#0E1A33" opacity=".75" />
      <g transform={`translate(${mx.toFixed(1)} ${my.toFixed(1)})`}><circle r="13" className="mdark" /><path d="M0 -13A13 13 0 0 1 0 13Z" className="mlit" /></g>
      <text x={(70 * Math.cos(e / 2 * D2R)).toFixed(1)} y={(-70 * Math.sin(e / 2 * D2R) + 4).toFixed(1)} className="wc3 tx-moon" direction="ltr">{Math.round(e)}°</text>
      <g transform="translate(-128 -128)"><MoonGlyph cx={0} cy={0} r={20} k={sk.k} rot={sk.waxing ? 0 : 180} /><text y="36" className="wc1">כך נראה מכאן</text></g>
      <text y="160" className="wc1">השמש תמיד מימין · הירח נע נגד כיוון השעון</text>
    </svg>
  );
}

// ---- sky panorama (looking south: east on the left, west on the right)
function lerpHex(a: string, b: string, t: number): string {
  const p = (h: string) => [1, 3, 5].map(i => parseInt(h.substr(i, 2), 16));
  const x = p(a), y = p(b);
  return '#' + x.map((v, i) => Math.round(v + (y[i] - v) * t).toString(16).padStart(2, '0')).join('');
}
function skyCols(h: number): [string, string] {
  const st: [number, string, string][] = [[12, '#4A8FCB', '#B9DCF2'], [0, '#5D8FC6', '#F2C58C'], [-4, '#344F88', '#E58A5C'], [-8, '#1A2655', '#58497A'], [-14, '#070C20', '#121A38']];
  if (h >= st[0][0]) return [st[0][1], st[0][2]];
  const z = st[st.length - 1];
  if (h <= z[0]) return [z[1], z[2]];
  for (let i = 0; i < st.length - 1; i++) {
    const [a, t1, b1] = st[i], [c, t2, b2] = st[i + 1];
    if (h <= a && h >= c) { const t = (a - h) / (a - c); return [lerpHex(t1, t2, t), lerpHex(b1, b2, t)]; }
  }
  return [z[1], z[2]];
}
const STARS = Array.from({ length: 70 }, (_, i) => [((Math.sin(i * 12.9898) * 43758.5453) % 1 + 1) % 1, ((Math.sin(i * 78.233) * 12345.678) % 1 + 1) % 1, (i % 3) + 1]);
const sn = (a: number) => Math.sin(a * D2R), cs = (a: number) => Math.cos(a * D2R);
const FONT = "'IBM Plex Sans Hebrew',Arial";

export function SkyPanorama({ ms, c }: { ms: number; c: Place & { name: string } }) {
  const id = 's' + useId().replace(/[^a-zA-Z0-9]/g, '');
  const W = 900, H = 380, y0 = 300, sc = 270 / 70, X = (az: number) => (az - 30) / 300 * W, Y = (al: number) => y0 - Math.min(al, 72) * sc;
  const sk = sky(ms, c), [top, bot] = skyCols(sk.sun.alt), sa = sk.sun.alt;
  const light = sa > -3, tc = light ? '#1A2240' : '#E8ECF6';
  const body = (az: number, al: number, draw: (x: number, y: number) => ReactNode, label: string, dy = -24) => {
    if (az < 30 || az > 330) {
      return <text x={az > 180 ? W - 10 : 10} y={Y(Math.max(al, 2))} fill={tc} fontSize="13" fontWeight="700" textAnchor={az > 180 ? 'end' : 'start'} fontFamily={FONT}>{label} (בצפון)</text>;
    }
    const x = X(az), y = Y(al);
    return <>{draw(x, y)}<text x={x} y={y + dy} fill={al < 0 ? '#ddd' : tc} fontSize="14" fontWeight="800" textAnchor="middle" fontFamily={FONT}>{label} <tspan direction="ltr" unicodeBidi="isolate">{al.toFixed(1)}°</tspan></text></>;
  };
  const Z = sk.chi - sk.moon.q, rot = Math.atan2(-cs(Z), -sn(Z)) * R2D;
  const near = Math.hypot(X(sk.moon.az) - X(sk.sun.az), Y(sk.moon.alt) - Y(sk.sun.alt)) < 70;
  let ground = `M0 ${y0}`;
  for (let x = 0; x <= W; x += 30) ground += `L${x} ${y0 - 4 - 3 * Math.sin(x / 37) - 2 * Math.sin(x / 11)}`;
  ground += `L${W} ${y0}Z`;
  const ph = sa > 0 ? 'יום' : sa > -6 ? 'דמדומים אזרחיים' : sa > -12 ? 'דמדומים ימיים' : 'לילה';
  return (
    <svg viewBox={`0 0 ${W} ${H}`} role="img" aria-label={`השמיים מעל ${c.name}, מבט דרומה`}>
      <defs>
        <linearGradient id={id} x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor={top} /><stop offset="1" stopColor={bot} /></linearGradient>
        <radialGradient id={id + 'g'}><stop offset="0" stopColor="#FFE9A0" stopOpacity=".9" /><stop offset="1" stopColor="#FFE9A0" stopOpacity="0" /></radialGradient>
      </defs>
      <rect width={W} height={y0} fill={`url(#${id})`} />
      {sa < -7 && STARS.map(([a, b, r], i) => (
        <circle key={i} cx={(a * W).toFixed(0)} cy={(b * (y0 - 20)).toFixed(0)} r={r * 0.6} fill="#fff" opacity={(Math.min(1, (-7 - sa) / 7) * 0.8).toFixed(2)} />
      ))}
      {[10, 20, 30, 45, 60].map(a => (
        <g key={a}>
          <line x1="0" y1={Y(a)} x2={W} y2={Y(a)} stroke={tc} strokeOpacity=".15" />
          <text x={W - 8} y={Y(a) - 4} fill={tc} opacity=".6" fontSize="12" textAnchor="end" direction="ltr" fontFamily={FONT}>{a}°</text>
        </g>
      ))}
      <rect y={y0} width={W} height={H - y0} fill="#1E2A1F" />
      <path d={ground} fill="#1E2A1F" />
      {body(sk.sun.az, sk.sun.alt, (x, y) => <>
        <circle cx={x} cy={y} r="40" fill={`url(#${id}g)`} opacity={sa < 0 ? 0.3 : undefined} />
        <circle cx={x} cy={y} r="12" className="sunf" opacity={sa < 0 ? 0.45 : undefined} stroke={sa < 0 ? '#fff' : undefined} strokeDasharray={sa < 0 ? '3 3' : undefined} />
      </>, 'שמש')}
      {body(sk.moon.az, sk.moon.alt, (x, y) => <MoonGlyph cx={x} cy={y} r={14} k={sk.k} rot={rot} dash={sk.moon.alt < 0} />, 'ירח', near ? 36 : -24)}
      {([[60, 'צפון־מזרח'], [90, 'מזרח'], [135, 'דרום־מזרח'], [180, 'דרום'], [225, 'דרום־מערב'], [270, 'מערב'], [300, 'צפון־מערב']] as const).map(([a, t]) => (
        <g key={a}>
          <line x1={X(a)} y1={y0} x2={X(a)} y2={y0 + 8} stroke="#9fb59a" />
          <text x={X(a)} y={y0 + 26} fill="#C9D8C4" fontSize="14" fontWeight="700" textAnchor="middle" fontFamily={FONT}>{t}</text>
        </g>
      ))}
      <text x={W / 2} y={H - 14} fill="#C9D8C4" fontSize="14" textAnchor="middle" fontFamily={FONT}>{c.name} · <tspan direction="ltr" unicodeBidi="isolate">{hm(ms)}</tspan> · {ph}</text>
    </svg>
  );
}
