// Small RTL line chart: x runs right → left (time flows RTL), one y axis, thin 2px lines,
// direct labels at the line ends, recessive grid, crosshair + tooltip on hover/touch.

import { type ReactNode, useId, useRef, useState } from 'react';

export interface Series {
  key: string;
  label: string;
  /** CSS colour, e.g. var(--s1) */
  color: string;
  /** one y per x index; null = gap */
  values: (number | null)[];
  /** thin, translucent, no direct label (e.g. the raw data behind a smoothed line of the same entity) */
  faint?: boolean;
}

export interface RefLine { y: number; label: string }
export interface RefX { i: number; label: string }

export function LineChart({
  series, xLabels, yTicks, yFmt, tipX, height = 220, refY = [], refX = [], marker, onPick, aria, yInvert = false,
}: {
  series: Series[];
  /** sparse labels: [index, text] */
  xLabels: [number, string][];
  yTicks: number[];
  yFmt: (v: number) => string;
  /** tooltip title for an x index */
  tipX: (i: number) => ReactNode;
  height?: number;
  refY?: RefLine[];
  refX?: RefX[];
  /** highlighted x index (e.g. the selected date) */
  marker?: number | null;
  onPick?: (i: number) => void;
  aria: string;
  /** draw larger y values lower (e.g. depression below the horizon) */
  yInvert?: boolean;
}) {
  const W = 760, H = height, padT = 14, padB = 30, padL = 46, padR = 104;
  const n = Math.max(...series.map(s => s.values.length));
  const lo = Math.min(...yTicks), hi = Math.max(...yTicks);
  const X = (i: number) => W - padR - (i / Math.max(1, n - 1)) * (W - padR - padL);   // RTL
  const Y = (v: number) => {
    const f = (v - lo) / (hi - lo || 1);
    return yInvert ? padT + f * (H - padT - padB) : H - padB - f * (H - padT - padB);
  };
  const [hover, setHover] = useState<number | null>(null);
  const ref = useRef<SVGSVGElement>(null);
  const id = 'c' + useId().replace(/[^a-zA-Z0-9]/g, '');

  const idxAt = (clientX: number) => {
    const r = ref.current!.getBoundingClientRect();
    const x = ((clientX - r.left) / r.width) * W;
    const f = (W - padR - x) / (W - padR - padL);
    return Math.max(0, Math.min(n - 1, Math.round(f * (n - 1))));
  };
  const path = (vals: (number | null)[]) => {
    let d = '', pen = false;
    vals.forEach((v, i) => {
      if (v === null || !Number.isFinite(v)) { pen = false; return; }
      d += `${pen ? 'L' : 'M'}${X(i).toFixed(1)} ${Y(v).toFixed(1)}`;
      pen = true;
    });
    return d;
  };
  const h = hover ?? null;

  return (
    <div className="lchart">
      <svg ref={ref} viewBox={`0 0 ${W} ${H}`} role="img" aria-label={aria} direction="ltr"
        onPointerMove={e => setHover(idxAt(e.clientX))} onPointerLeave={() => setHover(null)}
        onClick={e => onPick?.(idxAt(e.clientX))}>
        <defs><clipPath id={id}><rect x={padL} y={padT - 2} width={W - padL - padR} height={H - padT - padB + 4} /></clipPath></defs>
        {yTicks.map(t => (
          <g key={t}>
            <line x1={padL} x2={W - padR} y1={Y(t)} y2={Y(t)} className="grid" />
            <text x={padL - 6} y={Y(t) + 4} className="axis" textAnchor="end" direction="ltr">{yFmt(t)}</text>
          </g>
        ))}
        {xLabels.map(([i, t]) => <text key={i} x={X(i)} y={H - 10} className="axis" textAnchor="middle">{t}</text>)}
        {refY.map((r, k) => (
          <g key={r.label + k}>
            <line x1={padL} x2={W - padR} y1={Y(r.y)} y2={Y(r.y)} className="refline" />
            {/* stagger labels so neighbouring lines stay readable */}
            <text x={padL + 4 + (k % 4) * 64} y={Y(r.y) - 4} className="reflabel">{r.label}</text>
          </g>
        ))}
        {refX.map((r, k) => (
          <g key={r.label + k}>
            <line x1={X(r.i)} x2={X(r.i)} y1={padT} y2={H - padB} className="refline" />
            <text x={X(r.i)} y={padT + 10 + (k % 2) * 13} className="reflabel" textAnchor="middle">{r.label}</text>
          </g>
        ))}
        {marker != null && <line x1={X(marker)} x2={X(marker)} y1={padT} y2={H - padB} className="marker" />}
        <g clipPath={`url(#${id})`}>
          {series.map(s => <path key={s.key} d={path(s.values)} fill="none" stroke={s.color} strokeWidth={s.faint ? 1 : 2} strokeOpacity={s.faint ? 0.3 : 1} strokeLinejoin="round" />)}
        </g>
        {(() => {
          // direct labels at the right (first) end of each line, in the right margin, pushed apart when lines end close together
          const ls = series.filter(s => !s.faint).map(s => {
            let i = 0;
            while (i < s.values.length - 1 && (s.values[i] === null || !Number.isFinite(s.values[i]!))) i++;
            const v = s.values[i];
            return v == null ? null : { key: s.key, label: s.label, x: X(i) + 6, y: Y(v) + 4 };
          }).filter(l => l !== null).sort((a, b) => a.y - b.y);
          for (let k = 1; k < ls.length; k++) if (ls[k].y - ls[k - 1].y < 13) ls[k].y = ls[k - 1].y + 13;
          return ls.map(l => <text key={l.key} x={l.x} y={l.y} className="dlabel">{l.label}</text>);
        })()}
        {h !== null && <>
          <line x1={X(h)} x2={X(h)} y1={padT} y2={H - padB} className="crosshair" />
          {series.map(s => s.values[h] != null && <circle key={s.key} cx={X(h)} cy={Y(s.values[h]!)} r="4" fill={s.color} stroke="var(--panel)" strokeWidth="2" />)}
        </>}
        <rect x={padL} y={padT} width={W - padL - padR} height={H - padT - padB} fill="transparent" />
      </svg>
      {h !== null && (
        <div className="tip" style={{ insetInlineEnd: `${Math.min(80, Math.max(2, ((X(h)) / W) * 100 - 10))}%` }} role="status">
          <b>{tipX(h)}</b>
          {series.map(s => s.values[h] != null && (
            <div key={s.key}><i style={{ background: s.color }} />{s.label}: <span className="num">{yFmt(s.values[h]!)}</span></div>
          ))}
        </div>
      )}
      {series.filter(s => !s.faint).length > 1 && (
        <div className="legend">
          {series.filter(s => !s.faint).map(s => <span key={s.key}><i style={{ background: s.color }} />{s.label}</span>)}
        </div>
      )}
    </div>
  );
}
