// The 3D zodiac wheel as a panel, and the magnifier: a window that opens the wheel on one value of a table and lets
// the viewer go down from degrees to parts to seconds.

import { type ReactNode, useEffect, useMemo, useRef, useState } from 'react';
import { createPortal } from 'react-dom';
import { SIGNS } from '../../engines/rambam';
import { zodiacSpans } from '../../engines/zodiac';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Viz } from '../../components/Slide';
import { Num } from '../../components/text';
import type { ZodiacProps } from '../../scenes/zodiacWheel';

const load = () => import('../../scenes/zodiacWheel').then(m => m.default);
/** the Rambam's epoch (Nisan 4938 = 1178) and ours */
export const RAMBAM_YEAR = 1178, NOW_YEAR = 2026;
const WHEEL_VIEWS = [{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'earth', label: 'מכדור הארץ' }];
/** the wheel, one sign, one degree (its parts), one part (its seconds) */
export const DMS_VIEWS = [{ id: 'top', label: 'הגלגל' }, { id: 'sign', label: 'מזל' }, { id: 'deg', label: 'מעלה' }, { id: 'min', label: 'חלק' }];
const ZOOM_VIEWS = [{ id: 'degs', label: 'מעלות' }, { id: 'deg', label: 'חלקים' }, { id: 'min', label: 'שניות' }, { id: 'top', label: 'כל הגלגל' }];

/** 2D fallback: the wheel from above, the signs coloured, a pointer. */
function Wheel2D({ p }: { p: ZodiacProps }) {
  const c = 160, R = 120, pt = (lon: number, r: number) => { const a = (lon * Math.PI) / 180; return [c + r * Math.cos(a), c - r * Math.sin(a)]; };
  const COL = ['#e0675a', '#d9894a', '#d8b44a', '#b3c752', '#7cc45c', '#52b98a', '#4fb3b8', '#4f93cf', '#6a78d6', '#8f6ad6', '#b565c8', '#cf5f98'];
  return (
    <svg viewBox="0 0 320 320" direction="ltr" role="img" aria-label="גלגל המזלות מלמעלה">
      {SIGNS.map((s, i) => { const [x0, y0] = pt(i * 30, R), [x1, y1] = pt(i * 30 + 30, R), [tx, ty] = pt(i * 30 + 15, R - 18);
        return <g key={s}><path d={`M${c} ${c}L${x0} ${y0}A${R} ${R} 0 0 0 ${x1} ${y1}Z`} fill={COL[i]} opacity={p.hlSign == null || p.hlSign === i ? 0.55 : 0.18} stroke="#0b1020" />
          <text x={tx} y={ty} fontSize="11" textAnchor="middle" fill="#fff">{s}</text></g>; })}
      <circle cx={c} cy={c} r="12" fill="#3e7cb8" />
      {p.sunLon != null && (() => { const [x, y] = pt(p.sunLon, R * 0.7); return <circle cx={x} cy={y} r="8" fill="#f4c33f" />; })()}
      {p.moonLon != null && (() => { const [x, y] = pt(p.moonLon, R * 0.45); return <circle cx={x} cy={y} r="6" fill="#ddd" />; })()}
      {p.pointer && (() => { const [x, y] = pt(p.pointer.lon, R + 8); return <line x1={c} y1={c} x2={x} y2={y} stroke="#b0a2ff" strokeWidth="2" />; })()}
    </svg>
  );
}

/** The zodiac wheel in 3D, with the choices: the stars of the Rambam's day or ours, and where the stars really lie. */
export function ZodiacScene({ note, view, height, zoom, ...rest }: Omit<ZodiacProps, 'year'> & { note?: ReactNode; view?: string; height?: number; zoom?: boolean }) {
  const [epoch, setEpoch] = useState<'rambam' | 'now'>('rambam');
  const [spans, setSpans] = useState(false);
  const year = epoch === 'rambam' ? RAMBAM_YEAR : NOW_YEAR;
  const key = JSON.stringify(rest);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  const props = useMemo<ZodiacProps>(() => ({ ...rest, year, spans, stars: rest.stars ?? true }), [key, year, spans]);
  // how far the star group of Aries has moved past the head of the sign of Aries, by the IAU boundaries
  const gap = useMemo(() => zodiacSpans(year, 0.5).find(z => z.id === 'Ari')!.from, [year]);
  return (
    <Viz>
      <Scene3D load={load} props={props} views={zoom ? DMS_VIEWS : WHEEL_VIEWS} view={view} height={height} label="גלגל המזלות סביב כדור הארץ" fallback={<Wheel2D p={props} />} />
      <div className="ctl zodiac-ctl">
        <div className="seg" role="group" aria-label="הכוכבים של איזו תקופה">
          <button type="button" aria-pressed={epoch === 'rambam'} onClick={() => setEpoch('rambam')}>הכוכבים בזמן הרמב״ם</button>
          <button type="button" aria-pressed={epoch === 'now'} onClick={() => setEpoch('now')}>הכוכבים היום</button>
        </div>
        <label className="fld"><input type="checkbox" checked={spans} onChange={e => setSpans(e.target.checked)} /> איפה קבוצות הכוכבים חוצות את המסלול</label>
      </div>
      <p className="note">{note ?? <>הגלגל: שנים עשר מזלות של <Num>30°</Num>, מתחילת טלה (נקודת האביב). מאחוריו הכוכבים שעל שמם נקראו. נקודת האביב זזה לאט בין הכוכבים, ולכן הכוכבים של טלה מתחילים {epoch === 'rambam' ? 'בזמן הרמב״ם' : 'היום'} כ־<Num>{Math.round(gap)}°</Num> אחרי תחילת מזל טלה.</>}</p>
    </Viz>
  );
}

/** A button that opens the wheel on one motion (from → to) in a window, for degrees, parts and seconds. */
export function Magnifier({ from, to, title, children }: { from: number; to: number; title: ReactNode; children?: ReactNode }) {
  const [open, setOpen] = useState(false);
  return <>
    <button type="button" className="btn mag-btn" onClick={() => setOpen(true)} aria-haspopup="dialog" aria-label="הגדלה בתלת־ממד: מעלות, חלקים ושניות">{children ?? 'הגדלה בתלת־ממד'}</button>
    {open && <MagnifierWindow from={from} to={to} title={title} onClose={() => setOpen(false)} />}
  </>;
}

function MagnifierWindow({ from, to, title, onClose }: { from: number; to: number; title: ReactNode; onClose: () => void }) {
  const [view, setView] = useState('degs');
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => {
    ref.current?.focus();
    const k = (e: KeyboardEvent) => { if (e.key === 'Escape') onClose(); };
    window.addEventListener('keydown', k);
    return () => window.removeEventListener('keydown', k);
  }, [onClose]);
  const props = useMemo<ZodiacProps>(() => ({ year: RAMBAM_YEAR, arc: { from, to }, pointer: { lon: to }, stars: false }), [from, to]);
  const s = Math.round(to * 3600), d = Math.floor(s / 3600), m = Math.floor((s % 3600) / 60), sec = s % 60;
  const text: Record<string, ReactNode> = {
    degs: <>כל קו קטן: מעלה אחת מתוך <Num>360</Num>. הקשת הצהובה: המהלך.</>,
    deg: <>המעלה <Num>{d % 30}</Num> מוגדלת: <Num>60</Num> חלקים. הסימן נמצא בחלק <Num>{m}</Num>.</>,
    min: <>החלק <Num>{m}</Num> מוגדל: <Num>60</Num> שניות. הסימן בשנייה <Num>{sec}</Num>.</>,
    top: <>כל הגלגל: <Num>12</Num> מזלות של <Num>30°</Num>.</>,
  };
  return createPortal(
    <div className="overlay" onClick={onClose}>
      <div className="panel magnifier" role="dialog" aria-modal="true" aria-label="הגדלה" tabIndex={-1} ref={ref} onClick={e => e.stopPropagation()}>
        <div className="panel-h"><b>{title}</b><button type="button" className="iconbtn" onClick={onClose} aria-label="סגירה">✕</button></div>
        <div className="seg" role="group" aria-label="רמת הגדלה">
          {ZOOM_VIEWS.map(v => <button key={v.id} type="button" aria-pressed={view === v.id} onClick={() => setView(v.id)}>{v.label}</button>)}
        </div>
        <Scene3D load={load} props={props} views={[]} view={view} height={480} label="הגדלה על גלגל המזלות" fallback={<Wheel2D p={props} />} />
        <p className="note">{text[view]} <Num>{`${d % 30}° ${m}′ ${sec}″`}</Num> במזל {SIGNS[Math.floor(d / 30) % 12]}. אפשר גם לגלול כדי להתקרב.</p>
      </div>
    </div>, document.body);
}
