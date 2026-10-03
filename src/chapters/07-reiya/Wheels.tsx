import { useMemo, useState } from 'react';
import { gq, hebDate, monthStart, monthsOf } from '../../engines/calendar';
import { CITIES, dayOfMs } from '../../engines/astro';
import { R_MOON, interp, moonEquation, rambam, rambamD0 } from '../../engines/rambam';
import { useAstro } from '../../components/astro/useAstro';
import { Term } from '../../components/Glossary';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Slide, Viz } from '../../components/Slide';
import { DM, DMS, Num, Pos } from '../../components/text';
import type { WheelsProps } from '../../scenes/rambamWheels';
import { BIG, SMALL, moonOnWheel } from '../../scenes/shared';
import { setAstro, setState } from '../../state/store';
import { monthModel } from '../../lib/month';

const load = () => import('../../scenes/rambamWheels').then(m => m.default);

/** 2D: the same picture from above. */
function TopView({ p }: { p: WheelsProps }) {
  const S = 16, c = 200, g = moonOnWheel(p.meanLon, p.course);
  // scene x → svg x, scene z → svg y (north/λ90 up)
  const X = (x: number) => c + x * S, Y = (z: number) => c + z * S;
  return (
    <svg viewBox="0 0 400 400" direction="ltr" role="img" aria-label="הגלגל הגדול והגלגל הקטן, מלמעלה">
      <rect width="400" height="400" fill="#0b1226" />
      <circle cx={c} cy={c} r={BIG * S} fill="none" stroke="#88c5d8" />
      <circle cx={X(g.cx)} cy={Y(g.cz)} r={SMALL * S} fill="none" stroke="#e7c76f" />
      <line x1={c} y1={c} x2={X(g.cx * 1.3)} y2={Y(g.cz * 1.3)} stroke="#88c5d8" strokeDasharray="5 4" />
      <line x1={c} y1={c} x2={X(g.mx * 1.3)} y2={Y(g.mz * 1.3)} stroke="#e7c76f" />
      <circle cx={c} cy={c} r="9" fill="#3e7cb8" />
      <circle cx={X(g.mx)} cy={Y(g.mz)} r="7" fill="#ddd" />
      <text x={X(g.cx * 1.38)} y={Y(g.cz * 1.38)} fill="#88c5d8" fontSize="12" textAnchor="middle">אמצע</text>
      <text x={X(g.mx * 1.42)} y={Y(g.mz * 1.42)} fill="#e7c76f" fontSize="12" textAnchor="middle">אמיתי</text>
    </svg>
  );
}

export function Wheels() {
  const v = useAstro();
  const { M, a, c } = v;
  const [manual, setManual] = useState<number | null>(null);
  const sel = a.dSel != null && M.ev[a.dSel] ? a.dSel : Math.max(0, M.first ? M.ev.indexOf(M.first) : 0);
  const o = M.ev[sel];
  const R = useMemo(() => (o ? rambam(dayOfMs(o.ss + 60000, c)) : null), [o, c]);
  const course = manual ?? R?.crsR ?? 0;
  const player = usePlay(dt => setManual(prev => ((prev ?? course) + dt * 30) % 360));
  const E = moonEquation(course);
  const props = useMemo<WheelsProps>(() => ({ meanLon: (R?.moonAdj ?? 0) / 3600, course, eqMin: E.eq, subtract: E.sign < 0 }), [R, course, E.eq, E.sign]);
  const hd = R ? hebDate(R.N + rambamD0()) : null;
  const r0 = E.row, rem = E.folded - r0 * 10;

  const loadExample = () => {
    const mi = monthsOf(4938).findIndex(m => m[0] === 'אייר');
    const J = CITIES[0], EM = monthModel(4938, mi, J), target = monthStart(4938, mi) + 1;
    const i = EM.ev.findIndex(e => dayOfMs(e.ss + 60000, J) === target);
    setState({ city: 0 });
    setManual(null);
    setAstro({ y: 4938, mi, playing: false, dSel: i < 0 ? null : i, t: i < 0 ? null : EM.ev[i].tb });
  };

  return (
    <Slide
      wide
      kicker="ראייה מול חשבון · 3"
      title="גלגלי הרמב״ם"
      text={<>
        <p>הרמב״ם מתאר את תנועת הירח כ״גלגל קטן בתוך גלגל גדול״: מרכז הגלגל הקטן מקיף את הארץ בקצב קבוע (זה <Term k="emtza">אמצע הירח</Term>), והירח עצמו מסתובב על הגלגל הקטן.</p>
        <p>הזווית על הגלגל הקטן היא <Term k="maslul">המסלול</Term>. ממנה נקבעת <Term k="menat" />: כמה לגרוע מהאמצע או להוסיף עליו כדי להגיע למקום האמיתי.</p>
        <Engine title="מאיזה ערב?">
          <div className="ctl">
            <button type="button" className="btn" onClick={loadExample}>הדוגמה של הרמב״ם: ב׳ אייר ד׳תתקל״ח</button>
          </div>
          {hd && <p className="m0">הערב הנבחר (משקף ״נראות הירח״): ליל {gq(hd.d)} {hd.name}. המסלול הנכון: <Num>{R!.crsR}°</Num>.</p>}
          <label className="fld">או סובבו בעצמכם: המסלול <Num>{course}°</Num>
            <input type="range" min={0} max={359} value={Math.round(course)} onChange={e => setManual(+e.target.value)} aria-label="המסלול במעלות" />
          </label>
          {manual !== null && <button type="button" className="linkbtn" onClick={() => setManual(null)}>חזרה לערב הנבחר</button>}
        </Engine>
        <Engine title="לוח מנת המסלול של הירח" sub="כל 10 מעלות; בין השורות מחלקים לפי היחס">
          <div className="table-wrap">
            <table className="kt rtable">
              <thead><tr><th>מסלול</th><th>מנה</th></tr></thead>
              <tbody>
                {R_MOON.map((val, i) => (
                  <tr key={i} className={i === r0 || (i === r0 + 1 && rem > 0) ? 'hl' : ''}>
                    <td><Num>{i * 10}°</Num></td><td><DM min={val} /></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="m0">
            מסלול <Num>{course}°</Num>{course > 180 && <> ← <Num>{`360 − ${course} = ${E.folded}°`}</Num></>} · בין <Num>{r0 * 10}°</Num> ל־<Num>{r0 * 10 + 10}°</Num>:
            {' '}<DM min={R_MOON[r0]} /> + (<DM min={R_MOON[Math.min(18, r0 + 1)] - R_MOON[r0]} />) × <Num>{rem}/10</Num> ≈ <DM min={interp(R_MOON, E.folded)} /> ← <strong><DM min={E.eq} /></strong>, {E.sign < 0 ? 'גורעים' : E.sign > 0 ? 'מוסיפים' : 'אין תיקון'}
          </p>
        </Engine>
      </>}
      more={R ? <p>באותו ערב: אמצע הירח לשעת הראייה <DMS sec={R.moonAdj} />, ומקומו האמיתי <Pos min={R.moonTrue} />.</p> : undefined}
      stage={
        <Viz>
          <Scene3D load={load} props={props} label="הגלגל הגדול והגלגל הקטן של הירח לפי הרמב״ם"
            play={{ ...player, label: 'הפעל: הירח על הגלגל הקטן' }}
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'close', label: 'קרוב לגלגל הקטן' }]}
            fallback={<TopView p={props} />} />
          <p className="note">ציור סכמטי: הגלגל הקטן מוגדל כדי שייראה. הזווית שבציור גדולה מהאמיתית; המספר שבתווית הוא ערך הטבלה של הרמב״ם.</p>
        </Viz>
      }
    />
  );
}
