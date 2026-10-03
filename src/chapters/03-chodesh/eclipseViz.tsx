// Pictures for the eclipses slide: a world map of where an eclipse is seen, the eclipse seasons on a timeline,
// a Saros family, and the Saros panorama.

import { useMemo } from 'react';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { localParts } from '../../engines/astro';
import { type Eclipse, eclipseAt, eclipsesBetween, sarosOf, shadowAxis } from '../../engines/eclipses';
import { LAND, STEP, type Cell } from '../../lib/eclipseMap';
import { Num } from '../../components/text';

const W = 720, H = 360;
const proj = geoEquirectangular().scale(W / (2 * Math.PI)).translate([W / 2, H / 2]);
const path = geoPath(proj);
const landD = path(LAND) ?? '';
const xy = (lon: number, lat: number) => proj([lon, lat]) ?? [0, 0];

export function WorldMap({ e, cells, central, home, family }: {
  e: Eclipse; cells: Cell[]; central: [number, number][][];
  home: { lat: number; lon: number; name: string };
  family?: { lat: number; lon: number; label: string; current: boolean }[];
}) {
  const solar = e.kind === 'solar';
  const g = solar ? shadowAxis(e.ms) : null;
  const [hx, hy] = xy(home.lon, home.lat);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="מפת העולם: איפה רואים את הליקוי">
      <rect width={W} height={H} fill="#0e1a33" />
      {[-60, -30, 0, 30, 60].map(lat => { const [, y] = xy(0, lat); return <line key={lat} x1="0" x2={W} y1={y} y2={y} stroke="#33405f" strokeWidth={lat ? 0.5 : 1} />; })}
      <path d={landD} fill="#3a4a3a" stroke="#6b7d6b" strokeWidth="0.5" />
      {cells.map(c => {
        const [x, y] = xy(c.lon - STEP / 2, c.lat + STEP / 2), [x2, y2] = xy(c.lon + STEP / 2, c.lat - STEP / 2);
        return <rect key={`${c.lat},${c.lon}`} x={x} y={y} width={x2 - x} height={y2 - y}
          fill={solar ? '#f4c33f' : '#88c5d8'} opacity={solar ? 0.15 + 0.6 * c.value : 0.42} />;
      })}
      {central.map((s, i) => <polyline key={i} points={s.map(([lo, la]) => xy(lo, la).join(',')).join(' ')} fill="none" stroke="#ef8f76" strokeWidth="3" />)}
      {family?.map(f => { const [x, y] = xy(f.lon, f.lat); return (
        <g key={f.label}><circle cx={x} cy={y} r={f.current ? 6 : 4} fill={f.current ? '#ef8f76' : '#e7c76f'} stroke="#0e1a33" />
          <text x={x + 7} y={y + 4} fill="#e8ecf6" fontSize="10">{f.label}</text></g>
      ); })}
      {g && !family && (() => { const [x, y] = xy(g.lon, g.lat); return <path d={`M${x} ${y - 8}l2.4 5.6 6 .4-4.6 3.8 1.5 5.8-5.3-3.2-5.3 3.2 1.5-5.8-4.6-3.8 6-.4z`} fill="#ef8f76" stroke="#fff" strokeWidth=".8" />; })()}
      <circle cx={hx} cy={hy} r="4" fill="#fff" stroke="#0e1a33" /><text x={hx + 6} y={hy - 6} fill="#fff" fontSize="11" fontWeight="700">{home.name}</text>
    </svg>
  );
}

const DAY = 86400000;
const civ = (ms: number) => { const p = localParts(ms); return `${p.d}.${p.m + 1}.${p.y}`; };

/** Eclipses on a timeline (right → left), grouped into seasons. */
export function SeasonsStrip({ list, sel, onPick }: { list: Eclipse[]; sel: number; onPick: (i: number) => void }) {
  const W2 = 760, H2 = 150, pad = 30;
  const t0 = list[0].ms - 30 * DAY, t1 = list[list.length - 1].ms + 30 * DAY;
  const X = (t: number) => W2 - pad - ((t - t0) / (t1 - t0)) * (W2 - 2 * pad);
  const seasons: Eclipse[][] = [];
  for (const e of list) { const last = seasons[seasons.length - 1]; if (last && e.ms - last[last.length - 1].ms < 40 * DAY) last.push(e); else seasons.push([e]); }
  return (
    <svg viewBox={`0 0 ${W2} ${H2}`} direction="ltr" role="img" aria-label="הליקויים על ציר הזמן, בקבוצות של עונות ליקויים">
      <line x1={pad} x2={W2 - pad} y1="70" y2="70" stroke="var(--line)" strokeWidth="2" />
      {seasons.map((s, i) => {
        const a = X(s[0].ms), b = X(s[s.length - 1].ms), mid = (a + b) / 2;
        const next = seasons[i + 1];
        const gap = next ? (next[0].ms + next[next.length - 1].ms) / 2 - (s[0].ms + s[s.length - 1].ms) / 2 : 0;
        return (
          <g key={i}>
            <rect x={Math.min(a, b) - 9} y="52" width={Math.abs(a - b) + 18} height="36" rx="8" fill="var(--moon-soft)" stroke="var(--moon)" />
            {next && <text x={(mid + (X(next[0].ms) + X(next[next.length - 1].ms)) / 2) / 2} y="110" textAnchor="middle" className="svgt tx-muted" fontSize="10" direction="ltr">{Math.round(gap / DAY)} d</text>}
          </g>
        );
      })}
      {list.map((e, i) => (
        <g key={e.k} onClick={() => onPick(i)} style={{ cursor: 'pointer' }}>
          <circle cx={X(e.ms)} cy="70" r={i === sel ? 9 : 7} fill={e.kind === 'solar' ? '#f4c33f' : '#88c5d8'} stroke={i === sel ? 'var(--ink)' : 'var(--panel)'} strokeWidth="2" />
          <text x={X(e.ms)} y={[44, 31, 18][i % 3]} textAnchor="middle" className="svgt" fontSize="10" direction="ltr">{civ(e.ms)}</text>
        </g>
      ))}
      <text x={W2 - pad} y={H2 - 8} textAnchor="end" className="svgt tx-muted" fontSize="11">צהוב: ליקוי חמה · תכלת: ליקוי לבנה · מסגרת: עונת ליקויים · המספרים: ימים בין מרכזי העונות</text>
    </svg>
  );
}

/** Members of the selected eclipse's Saros series, n before and after. */
export function sarosFamily(e: Eclipse, n = 4): Eclipse[] {
  const out: Eclipse[] = [];
  for (let j = -n; j <= n; j++) { const x = eclipseAt(e.k + 223 * j); if (x) out.push(x); }
  return out;
}

/** Saros panorama: every solar (or lunar) eclipse 1000–3000 as a dot at (year, Saros number). */
export function Panorama({ e }: { e: Eclipse }) {
  const all = useMemo(() => eclipsesBetween(Date.UTC(1000, 0, 1), Date.UTC(3000, 0, 1)).filter(x => x.kind === e.kind)
    .map(x => ({ y: 1970 + x.ms / (365.2425 * DAY), s: sarosOf(x).saros, t: x.type })), [e.kind]);
  const W2 = 760, H2 = 330, pad = 40;
  const smin = Math.min(...all.map(a => a.s)), smax = Math.max(...all.map(a => a.s));
  const X = (y: number) => W2 - pad - ((y - 1000) / 2000) * (W2 - 2 * pad);
  const Y = (s: number) => pad / 2 + ((s - smin) / (smax - smin)) * (H2 - pad * 1.5);
  const cur = sarosOf(e).saros, now = 1970 + e.ms / (365.2425 * DAY);
  const col = (t: string) => (t === 'total' ? '#ef8f76' : t === 'annular' || t === 'hybrid' ? '#e7c76f' : t === 'partial' ? '#88c5d8' : '#7d88a8');
  return (
    <svg viewBox={`0 0 ${W2} ${H2}`} direction="ltr" role="img" aria-label="כל הליקויים בשנים 1000–3000 לפי משפחות הסרוס">
      <rect width={W2} height={H2} fill="var(--panel)" />
      <line x1={pad} x2={W2 - pad} y1={Y(cur)} y2={Y(cur)} stroke="var(--ink)" strokeOpacity=".25" strokeWidth="5" />
      <line x1={X(now)} x2={X(now)} y1="0" y2={H2 - pad} stroke="var(--ink)" strokeOpacity=".4" />
      {all.map((a, i) => <rect key={i} x={X(a.y) - 1} y={Y(a.s) - 1} width="2.2" height="2.2" fill={col(a.t)} />)}
      {[1000, 1500, 2000, 2500, 3000].map(y => <text key={y} x={X(y)} y={H2 - 8} textAnchor="middle" className="svgt tx-muted" fontSize="11">{y}</text>)}
      {[smin, Math.round((smin + smax) / 2), smax].map(s => <text key={s} x={pad - 6} y={Y(s) + 4} textAnchor="end" className="svgt tx-muted" fontSize="10">{s}</text>)}
      <text x={W2 - pad} y="12" textAnchor="end" className="svgt tx-muted" fontSize="11">שורה = משפחת סרוס (מספר משמאל) · כל נקודה ליקוי · הפס המודגש: המשפחה של הליקוי הנבחר</text>
    </svg>
  );
}

export function FamilyTable({ fam, e }: { fam: Eclipse[]; e: Eclipse }) {
  const type = (x: Eclipse) => ({ total: 'מלא', annular: 'טבעתי', hybrid: 'משולב', partial: 'חלקי', penumbral: 'בפלג הצל' } as Record<string, string>)[x.type];
  return (
    <table className="kt">
      <thead><tr><th>תאריך</th><th>סוג</th><th>γ</th><th>{e.kind === 'solar' ? 'שיא הליקוי (רוחב)' : 'גודל'}</th></tr></thead>
      <tbody>
        {fam.map(x => (
          <tr key={x.k} className={x.k === e.k ? 'hl' : ''}>
            <td><Num>{civ(x.ms)}</Num></td><td>{type(x)}</td><td><Num>{x.gamma.toFixed(3)}</Num></td>
            <td><Num>{e.kind === 'solar' ? `${shadowAxis(x.ms).lat.toFixed(0)}°` : x.magnitude.toFixed(2)}</Num></td>
          </tr>
        ))}
      </tbody>
    </table>
  );
}
