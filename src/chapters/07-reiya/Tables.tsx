import { type ReactNode, useMemo } from 'react';
import { gq, hebDate, monthStart, monthsOf } from '../../engines/calendar';
import { CITIES, dayOfMs } from '../../engines/astro';
import {
  CIRCLE_TABLE, R_DBL, R_FOURTH, R_LAT, R_MOON, R_PLAT, R_PLON, R_SUN, RB, SEASON_TABLE, SIGHTING_LIMITS, SIGNS,
  type Block, foldLatCourse, interp, rambam, rambamD0, rMotion, secOf,
} from '../../engines/rambam';
import { useAstro } from '../../components/astro/useAstro';
import { Term } from '../../components/Glossary';
import { Engine, Slide } from '../../components/Slide';
import { DM, DMS, Num, Tag } from '../../components/text';
import { monthModel } from '../../lib/month';
import { setAstro, setState } from '../../state/store';

function Card({ title, sub, head, rows, hl, children }: {
  title: ReactNode; sub?: ReactNode; head: ReactNode[]; rows: ReactNode[][]; hl: (i: number) => boolean; children?: ReactNode;
}) {
  return (
    <Engine title={title} sub={sub} className="tcard">
      <div className="table-wrap">
        <table className="kt rtable">
          <thead><tr>{head.map((h, i) => <th key={i}>{h}</th>)}</tr></thead>
          <tbody>{rows.map((r, i) => <tr key={i} className={hl(i) ? 'hl' : ''}>{r.map((c, j) => <td key={j}>{c}</td>)}</tr>)}</tbody>
        </table>
      </div>
      {children && <div className="tcard-x">{children}</div>}
    </Engine>
  );
}

const fold = (c: number) => (c > 180 ? 360 - c : c);
const tens = (tab: readonly number[]) => tab.map((v, i) => [<Num key="d">{i * 10}°</Num>, <DM key="v" min={v} />]);
const bracket = (folded: number) => [Math.floor(folded / 10), Math.floor(folded / 10) + (folded % 10 ? 1 : 0)];

export function Tables() {
  const v = useAstro();
  const { M, a, c } = v;
  const sel = a.dSel != null && M.ev[a.dSel] ? a.dSel : Math.max(0, M.first ? M.ev.indexOf(M.first) : 0);
  const o = M.ev[sel];
  const R = useMemo(() => (o ? rambam(dayOfMs(o.ss + 60000, c)) : null), [o, c]);
  if (!R) return null;
  const hd = hebDate(R.N + rambamD0());

  const sunFold = fold(R.sunMaslulR), [s0, s1] = bracket(sunFold);
  const moonFold = fold(R.crsR), [m0, m1] = bracket(moonFold);
  const latFold = foldLatCourse(R.latCourseR), [l0, l1] = bracket(latFold);
  const meanSunDeg = R.sunMean / 3600;
  const seasonRow = SEASON_TABLE.findIndex(([x, y]) => (x < y ? meanSunDeg >= x && meanSunDeg < y : meanSunDeg >= x || meanSunDeg < y));
  const dblRow = R_DBL.findIndex(([x, y]) => R.dblR >= x && R.dblR <= y);
  const circPos = (R.moonTrue / 60) % 180, circRow = CIRCLE_TABLE.findIndex(([lim]) => circPos < lim);
  const limitRow = R.reason.kind === 'limits' ? SIGHTING_LIMITS.findIndex(([, need]) => need === (R.reason as { need: number }).need) : -1;
  const QS = [['sun', 'אמצע השמש'], ['apo', 'גובה השמש'], ['moon', 'אמצע הירח'], ['crs', 'אמצע המסלול'], ['head', 'הראש']] as const;
  const motions = QS.map(([k]) => rMotion(RB[k], R.N));
  const blocks = motions[0].parts;

  const loadExample = () => {
    const mi = monthsOf(4938).findIndex(m => m[0] === 'אייר');
    const J = CITIES[0], EM = monthModel(4938, mi, J), target = monthStart(4938, mi) + 1;
    const i = EM.ev.findIndex(e => dayOfMs(e.ss + 60000, J) === target);
    setState({ city: 0 });
    setAstro({ y: 4938, mi, playing: false, dSel: i < 0 ? null : i, t: i < 0 ? null : EM.ev[i].tb });
  };

  return (
    <Slide
      wide
      kicker="ראייה מול חשבון · 4"
      title="הטבלאות של הרמב״ם, חיות"
      text={<>
        <p>כל שלב בחשבון הראייה לוקח מספר מטבלה. כאן כל הטבלאות יחד, לערב שנבחר בשקף ״נראות הירח״: השורה שבשימוש מודגשת, ולצידה מה שנלקח ממנה.</p>
        <p>הערב: <strong>ליל {gq(hd.d)} {hd.name}</strong> · <Num>{R.N}</Num> ימים מהעיקר.</p>
        <button type="button" className="btn" onClick={loadExample}>הדוגמה של הרמב״ם: ב׳ אייר ד׳תתקל״ח</button>
        <p className="note">בין שורות הטבלה מחלקים לפי היחס (כל מעלה היא עשירית מההפרש).</p>
      </>}
      stage={
        <div className="tgrid">
          <Card title="1. מהלך אמצעי" sub="סכום הגושים (חמדני)" head={['ימים', ...QS.map(q => q[1])]}
            rows={blocks.map(([b, n]) => [<><Num>{n}</Num> × <Num>{b}</Num></>, ...QS.map(([k]) => <DMS key={k} sec={(secOf(RB[k][b as Block]) * n) % 1296000} />)])}
            hl={() => true}>
            עיקר + סכום: אמצע השמש <DMS sec={R.sunMean} />, אמצע הירח <DMS sec={R.moonMean} />
          </Card>
          <Card title={<>2. <Term k="menat" /> של השמש</>} sub="לפי מסלול השמש" head={['מסלול', 'מנה']} rows={tens(R_SUN)} hl={i => i === s0 || i === s1}>
            מסלול <Num>{R.sunMaslulR}°</Num>{R.sunMaslulR > 180 && <> ← <Num>{sunFold}°</Num></>} ← <DM min={interp(R_SUN, sunFold)} /> ≈ <strong><DM min={R.sunEq} /></strong>, {R.sunSign < 0 ? 'גורעים' : R.sunSign > 0 ? 'מוסיפים' : 'אין'}
          </Card>
          <Card title="3. תיקון אמצע הירח לשעת הראייה" sub="לפי מזל השמש" head={['אמצע השמש', 'תיקון']}
            rows={SEASON_TABLE.map(([x, y, val]) => [<Num key="r">{x}°–{y}°</Num>, val ? <>{val > 0 ? 'מוסיפים' : 'גורעים'} <Num>{Math.abs(val)}′</Num></> : 'כלום'])}
            hl={i => i === seasonRow}>
            אמצע השמש <Num>{meanSunDeg.toFixed(1)}°</Num> ← {R.season ? <><Num>{Math.abs(R.season)}′</Num> {R.season > 0 ? 'מוסיפים' : 'גורעים'}</> : 'בלי תיקון'}
          </Card>
          <Card title="4. המרחק הכפול" sub="כמה להוסיף למסלול" head={['מרחק כפול', 'מוסיפים']}
            rows={R_DBL.map(([x, y, val]) => [<Num key="r">{x}°–{y}°</Num>, <Num key="v">{val}°</Num>])} hl={i => i === dblRow}>
            מרחק כפול <DMS sec={R.dbl} /> ← <Num>{R.dblR}°</Num> ← מוסיפים <Num>{R.dblAdd}°</Num>{R.dblOut && <> <Tag tone="bad">מחוץ לטווח</Tag></>}
          </Card>
          <Card title="5. מנת המסלול של הירח" head={['מסלול', 'מנה']} rows={tens(R_MOON)} hl={i => i === m0 || i === m1}>
            המסלול הנכון <Num>{R.crsR}°</Num>{R.crsR > 180 && <> ← <Num>{moonFold}°</Num></>} ← <strong><DM min={R.moonEq} /></strong>, {R.moonSignOp < 0 ? 'גורעים' : R.moonSignOp > 0 ? 'מוסיפים' : 'אין'}
          </Card>
          <Card title={<>6. <Term k="rochav" /> הירח</>} sub="לפי מסלול הרוחב" head={['מסלול הרוחב', 'רוחב']} rows={tens(R_LAT)} hl={i => i === l0 || i === l1}>
            מסלול הרוחב <Num>{R.latCourseR}°</Num> ← <Num>{latFold}°</Num> ← <strong><DM min={R.lat1} /></strong> {R.north ? 'צפוני' : 'דרומי'}
          </Card>
          <Card title={<>7. <Term k="shinui" /></>} sub="לפי המזל שהירח בו" head={['מזל', 'באורך', 'ברוחב']}
            rows={SIGNS.map((s, i) => [s, <Num key="a">{R_PLON[i]}′</Num>, <Num key="b">{R_PLAT[i]}′</Num>])} hl={i => i === R.sign}>
            הירח ב{SIGNS[R.sign]}: אורך שני <DM min={R.long2} />, רוחב שני <DM min={R.lat2} />
          </Card>
          <Card title="8. מעגל הירח" sub="לפי מקום הירח" head={['עד', 'מהרוחב השני']}
            rows={CIRCLE_TABLE.map(([lim, , n]) => [<Num key="l">{lim}°</Num>, n])} hl={i => i === circRow}>
            הירח ב־<Num>{circPos.toFixed(1)}°</Num> (מקופל ל־180) ← {R.circFrac} ← <DM min={R.circle} />
          </Card>
          <Card title="9. האורך הרביעי" sub="לפי המזל" head={['מזל', 'תיקון']}
            rows={SIGNS.map((s, i) => [s, R_FOURTH[i][1]])} hl={i => i === R.sign}>
            {R.fourthTxt}: <DM min={R.fourthDelta} /> ← אורך רביעי <DM min={R.long4} />
          </Card>
          <Card title={<>10. <Term k="kitzei" /></>} sub="קשת הראייה מול האורך הראשון" head={['קשת עד', 'צריך אורך ראשון']}
            rows={SIGHTING_LIMITS.map(([arc, need]) => [<Num key="a">{arc}°</Num>, <Num key="n">{need}°</Num>])} hl={i => i === limitRow}>
            קשת הראייה <DM min={R.arc} />, אורך ראשון <DM min={R.long1} /> ← {R.visible ? <Tag tone="ok">נראה</Tag> : <Tag tone="bad">לא נראה</Tag>}
            {limitRow < 0 && <> (ההכרעה לא מהטבלה הזו: {R.reason.kind === 'arcAtMost9' ? 'קשת 9° או פחות' : R.reason.kind === 'arcAbove14' ? 'קשת מעל 14°' : 'בדיקה מקדימה לפי האורך הראשון'})</>}
          </Card>
        </div>
      }
    />
  );
}
