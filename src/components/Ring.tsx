// A ring of N numbered years (19-year and 28-year cycles).

import type { ReactNode } from 'react';

export function Ring({ n, cls, cur, center = [], aria }: {
  n: number; cls: (i: number) => string; cur: number; center?: [string?, string?, string?]; aria: string;
}) {
  const R = 122, rr = n > 20 ? 12 : 16;
  return (
    <svg viewBox="-160 -160 320 320" className="ring" role="img" aria-label={aria}>
      {Array.from({ length: n }, (_, k) => {
        const i = k + 1, a = (i - 1) / n * 2 * Math.PI - Math.PI / 2;
        const x = +(R * Math.cos(a)).toFixed(1), y = +(R * Math.sin(a)).toFixed(1);
        return (
          <g key={i}>
            <circle cx={x} cy={y} r={rr} className={cls(i)} style={i === cur ? { stroke: 'var(--ink)', strokeWidth: 4 } : undefined} />
            <text x={x} y={y} className="svgt" textAnchor="middle" dominantBaseline="central" fontWeight="700" fontSize={n > 20 ? 11 : 14}>{i}</text>
          </g>
        );
      })}
      {center[0] && <text y="-20" className="wc1">{center[0]}</text>}
      {center[1] && <text y="10" className="wc2">{center[1]}</text>}
      {center[2] && <text y="36" className="wc3">{center[2]}</text>}
    </svg>
  );
}

/** Months of a year as tiles; the flexible months and Adar I highlighted. */
export function MonthStrip({ months, title }: { months: readonly (readonly [string, number])[]; title?: ReactNode }) {
  return (
    <>
      {title && <p className="vt">{title}</p>}
      <div className="mstrip">
        {months.map(([m, d]) => (
          <div key={m} className={`${m === 'חשוון' || m === 'כסלו' ? 'flex' : ''} ${m === 'אדר א׳' ? 'lp' : ''}`}>
            <small>{m}</small><b className="num">{d}</b>
          </div>
        ))}
      </div>
    </>
  );
}
