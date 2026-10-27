// Chapter 14, halacha 5: the correction of the mean moon by where the sun is, drawn on the circle of the signs.

import { SEASON_TABLE, SIGNS } from '../../engines/rambam';
import { Num } from '../../components/text';

/** The table rows in the Rambam's words (14:5); same order as SEASON_TABLE. */
export const SEASON_WORDS = [
  'מחצי דגים עד חצי טלה', 'מחצי טלה עד תחילת תאומים', 'מתחילת תאומים עד תחילת אריה', 'מתחילת אריה עד חצי בתולה',
  'מחצי בתולה עד חצי מאזנים', 'מחצי מאזנים עד תחילת קשת', 'מתחילת קשת עד תחילת דלי', 'מתחילת דלי עד חצי דגים',
] as const;

/** Row of SEASON_TABLE for a sun longitude (degrees). */
export const seasonRow = (deg: number): number =>
  SEASON_TABLE.findIndex(([a, b]) => (a < b ? deg >= a && deg < b : deg >= a || deg < b));

const tone = (v: number) => (v > 0 ? 'var(--c-moon)' : v < 0 ? 'var(--c-shift)' : 'var(--c-text-3)');
export const signed = (v: number) => (v > 0 ? `+${v}′` : v < 0 ? `−${-v}′` : '0');

/** Circle of the signs, Aries 0° on the right, counter-clockwise (as the wheels seen from above). */
export function SeasonWheel({ sunDeg, hl }: { sunDeg?: number; hl?: number[] }) {
  const c = 170, R = 150, r = 104;
  const P = (deg: number, rad: number): [number, number] => [c + rad * Math.cos((deg * Math.PI) / 180), c - rad * Math.sin((deg * Math.PI) / 180)];
  const sector = (a: number, b: number) => {
    const span = ((b - a) % 360 + 360) % 360, big = span > 180 ? 1 : 0;
    const [x1, y1] = P(a, R), [x2, y2] = P(b, R), [x3, y3] = P(b, r), [x4, y4] = P(a, r);
    return `M${x1} ${y1}A${R} ${R} 0 ${big} 0 ${x2} ${y2}L${x3} ${y3}A${r} ${r} 0 ${big} 1 ${x4} ${y4}Z`;
  };
  return (
    <svg className="season-wheel" viewBox="0 0 340 340" direction="ltr" role="img" aria-label="גלגל המזלות והתיקון לאמצע הירח לפי מקום השמש">
      {SEASON_TABLE.map(([a, b, v], k) => {
        const mid = a < b ? (a + b) / 2 : ((a + b + 360) / 2) % 360, [tx, ty] = P(mid, (R + r) / 2);
        const on = !hl || hl.includes(k);
        return (
          <g key={k} opacity={on ? 1 : 0.28}>
            <path d={sector(a, b)} fill={tone(v)} fillOpacity={Math.abs(v) === 30 ? 0.55 : v ? 0.28 : 0.1} stroke="var(--c-bg)" strokeWidth="2" />
            <text x={tx} y={ty + 5} textAnchor="middle" className="sw-v">{signed(v)}</text>
          </g>
        );
      })}
      {SIGNS.map((name, k) => {
        const [x1, y1] = P(k * 30, r - 2), [x2, y2] = P(k * 30, r - 12), [tx, ty] = P(k * 30 + 15, r - 22);
        return <g key={name}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--c-line-strong)" /><text x={tx} y={ty + 4} textAnchor="middle" className="sw-s">{name}</text></g>;
      })}
      <text x={c} y={c - 4} textAnchor="middle" className="sw-c">מקום השמש</text>
      <text x={c} y={c + 14} textAnchor="middle" className="sw-c2">והתיקון לאמצע הירח</text>
      {sunDeg !== undefined && (() => {
        const [sx, sy] = P(sunDeg, R + 10), [lx, ly] = P(sunDeg, 58);
        return <g><line x1={lx} y1={ly} x2={sx} y2={sy} stroke="var(--c-sun)" strokeWidth="2" /><circle cx={sx} cy={sy} r="8" fill="var(--c-sun)" /></g>;
      })()}
    </svg>
  );
}

export function SeasonTable({ hl, cur }: { hl?: number[]; cur?: number }) {
  return (
    <div className="table-wrap">
      <table className="kt rtable">
        <thead><tr><th>השמש</th><th>אמצע הירח</th></tr></thead>
        <tbody>
          {SEASON_TABLE.map(([, , v], k) => (
            <tr key={k} className={(hl ? hl.includes(k) : k === cur) ? 'hl' : ''}>
              <td>{SEASON_WORDS[k]}</td>
              <td><Num>{signed(v)}</Num> {v > 0 ? 'מוסיפים' : v < 0 ? 'גורעים' : 'כמות שהוא'}</td>
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
