// The week as a ring: 7 days, each split into night (first half) and day. Moladot and dechiyot drawn on it.

import { useId } from 'react';
import { P_DAY, P_HOUR, P_WEEK } from '../engines/calendar';
import { wk } from '../lib/format';

export type Tone = 'moon' | 'shift' | 'leap' | 'ok';

export interface WheelProps {
  markers?: { x: number; cls: Tone; label?: string }[];
  arcs?: { from: number; to: number; cls: Tone }[];
  ticks?: { x: number; cls: Tone }[];
  /** per-weekday highlight: '' | 'bad' | 'ok' */
  days?: ('' | 'bad' | 'ok' | undefined)[];
  center?: [string?, string?, string?];
  aria?: string;
}

const R = 150, r0 = 95;
const A = (x: number) => (x / P_WEEK) * 2 * Math.PI - Math.PI / 2;
const P = (x: number, r: number): [number, number] => [+(r * Math.cos(A(x))).toFixed(1), +(r * Math.sin(A(x))).toFixed(1)];
function sect(x1: number, x2: number, ra: number, rb: number): string {
  const lg = x2 - x1 > P_WEEK / 2 ? 1 : 0;
  const [a, b] = P(x1, rb), [c, d] = P(x2, rb), [e, f] = P(x2, ra), [g, h] = P(x1, ra);
  return `M${a} ${b}A${rb} ${rb} 0 ${lg} 1 ${c} ${d}L${e} ${f}A${ra} ${ra} 0 ${lg} 0 ${g} ${h}Z`;
}
const TONES: Tone[] = ['moon', 'shift', 'leap', 'ok'];

/** Helper: highlight one weekday. */
export const dayMark = (i: number, cls: 'ok' | 'bad' = 'ok') => { const a: WheelProps['days'] = []; a[((i % 7) + 7) % 7] = cls; return a; };

export function WeekWheel({ markers = [], arcs = [], ticks = [], days = [], center = [], aria = 'גלגל השבוע' }: WheelProps) {
  const id = 'w' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg className="wheel" viewBox="-240 -212 480 424" role="img" aria-label={aria}>
      <defs>
        {TONES.map(c => (
          <marker key={c} id={id + c} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse">
            <path d="M0 0L10 5L0 10z" className={`mk-${c}`} />
          </marker>
        ))}
      </defs>
      {Array.from({ length: 7 }, (_, i) => {
        const x = i * P_DAY, c = days[i] ?? '';
        return (
          <g key={i}>
            <path d={sect(x, x + P_DAY / 2, r0, R)} className={`wn ${c}`} />
            <path d={sect(x + P_DAY / 2, x + P_DAY, r0, R)} className={`wd ${c}`} />
          </g>
        );
      })}
      {Array.from({ length: 7 }, (_, i) => {
        const x = i * P_DAY;
        const [a, b] = P(x, r0 - 3), [c, d] = P(x, R + 3), [lx, ly] = P(x + P_DAY / 2, (R + r0) / 2);
        return (
          <g key={i}>
            <line x1={a} y1={b} x2={c} y2={d} className="wsep" />
            {[6, 12, 18].map(hh => {
              const [e, f] = P(x + hh * P_HOUR, R - 7), [g, h] = P(x + hh * P_HOUR, R);
              return <line key={hh} x1={e} y1={f} x2={g} y2={h} className="wtick" />;
            })}
            <text x={lx} y={ly} className="wl">{'אבגדהוש'[i]}</text>
          </g>
        );
      })}
      {ticks.map((t, i) => {
        const x = wk(t.x), [a, b] = P(x, r0), [c, d] = P(x, R + 6);
        return <line key={i} x1={a} y1={b} x2={c} y2={d} className={`st-${t.cls}`} strokeWidth="2.5" strokeDasharray="5 3" />;
      })}
      {arcs.map((a, i) => {
        const r = r0 - 11, x1 = wk(a.from);
        let x2 = x1 + (a.to - a.from);
        if (x2 - x1 < P_WEEK * 0.006) return null;
        if (x2 - x1 >= P_WEEK) x2 = x1 + P_WEEK * 0.999;
        const lg = x2 - x1 > P_WEEK / 2 ? 1 : 0, [p, q] = P(x1, r), [u, v] = P(x2, r);
        return <path key={i} d={`M${p} ${q}A${r} ${r} 0 ${lg} 1 ${u} ${v}`} fill="none" className={`st-${a.cls}`} strokeWidth="3.5" markerEnd={`url(#${id}${a.cls})`} />;
      })}
      {markers.map((m, i) => {
        const x = wk(m.x), [a, b] = P(x, r0), [c, d] = P(x, R + 9), [e, f] = P(x, R + 16), [g, h] = P(x, R + 42);
        return (
          <g key={i}>
            <line x1={a} y1={b} x2={c} y2={d} className={`st-${m.cls}`} strokeWidth="3" />
            <circle cx={e} cy={f} r="8" className={`mk-${m.cls}`} />
            {m.label && <text x={g} y={h} className={`mlab tx-${m.cls}`}>{m.label}</text>}
          </g>
        );
      })}
      {center[0] && <text y="-24" className="wc1">{center[0]}</text>}
      {center[1] && <text y="6" className="wc2">{center[1]}</text>}
      {center[2] && <text y="32" className="wc3">{center[2]}</text>}
    </svg>
  );
}
