// The Hebrew day as a band, 18:00 → 18:00, flowing right to left.

import { useId } from 'react';

export function DayBand({ at, label, th, thLabel, next }: {
  /** Hebrew hour (0–24, fractional) of the marker */
  at?: number; label?: string;
  /** threshold line (Hebrew hour) */
  th?: number; thLabel?: string;
  /** draw "moves to the next day" arrow */
  next?: boolean;
}) {
  const W = 640, H = 150, Rt = 616, IW = 592, X = (hr: number) => Rt - hr / 24 * IW;
  const id = 'b' + useId().replace(/[^a-zA-Z0-9]/g, '');
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="full" role="img" aria-label="ציר היממה מ־18:00 עד 18:00">
      <defs>
        <marker id={id} viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto">
          <path d="M0 0L10 5L0 10z" className="mk-shift" />
        </marker>
      </defs>
      <rect x={X(12)} y="44" width={IW / 2} height="40" className="wn" />
      <rect x={X(24)} y="44" width={IW / 2} height="40" className="wd" />
      <text x={X(6)} y="69" className="svgt tx-muted" textAnchor="middle">לילה</text>
      <text x={X(18)} y="69" className="svgt tx-muted" textAnchor="middle">יום</text>
      {Array.from({ length: 25 }, (_, h) => {
        const x = X(h);
        return (
          <g key={h}>
            <line x1={x} y1={h % 3 ? 78 : 44} x2={x} y2="84" className="wtick" />
            {h % 3 === 0 && <>
              <text x={x} y="102" textAnchor="middle" className="svgt" fontWeight="700">{h}</text>
              <text x={x} y="119" textAnchor="middle" className="svgt tx-muted">{String((18 + h) % 24).padStart(2, '0')}:00</text>
            </>}
          </g>
        );
      })}
      {th != null && <>
        <line x1={X(th)} y1="38" x2={X(th)} y2="90" className="st-shift" strokeWidth="3" strokeDasharray="5 3" />
        <text x={X(th)} y="140" textAnchor="middle" className="svgt tx-shift" fontWeight="700">{thLabel}</text>
      </>}
      {at != null && <>
        {next && <path d={`M${X(at)} 30 L${X(24) - 14} 30`} className="st-shift" strokeWidth="3" fill="none" markerEnd={`url(#${id})`} />}
        <line x1={X(at)} y1="38" x2={X(at)} y2="90" className="st-moon" strokeWidth="3" />
        <circle cx={X(at)} cy="64" r="9" className="mk-moon" />
        <text x={Math.max(70, Math.min(570, X(at)))} y="18" textAnchor="middle" className="svgt tx-moon" fontWeight="800">{label}</text>
      </>}
    </svg>
  );
}
