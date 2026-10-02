import { useMemo, useState } from 'react';
import { gem, isLeap, monthStart, monthsOf, yearHeb } from '../../engines/calendar';
import { civOf } from '../../engines/astro';
import { type Holiday, holidays } from '../../engines/holidays';
import { localHM, zman } from '../../engines/zmanim';
import { Engine, Slide } from '../../components/Slide';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { CityControl, usePick, useZDay } from '../02-yom/shared';
import { useStore } from '../../state/store';

const WEEKDAYS = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];
const CIV_MONTHS = ['ינואר', 'פברואר', 'מרץ', 'אפריל', 'מאי', 'יוני', 'יולי', 'אוגוסט', 'ספטמבר', 'אוקטובר', 'נובמבר', 'דצמבר'];

function Month({ y, mi, hol, zmanim }: { y: number; mi: number; hol: Map<number, Holiday[]>; zmanim: ((day: number) => { label: string; t: string } | null) | null }) {
  const [name, len] = monthsOf(y)[mi];
  const start = monthStart(y, mi);
  const lead = start % 7;                              // blank cells before day 1 (Sunday first, on the right)
  const cells = [...Array(lead).fill(null), ...Array.from({ length: len }, (_, i) => start + i)];
  while (cells.length % 7) cells.push(null);
  const [y1, m1] = civOf(start), [y2, m2] = civOf(start + len - 1);
  const civTitle = m1 === m2 ? `${CIV_MONTHS[m1]} ${y1}` : `${CIV_MONTHS[m1]}${y1 !== y2 ? ` ${y1}` : ''} – ${CIV_MONTHS[m2]} ${y2}`;
  return (
    <section className="cal-month" aria-label={`${name} ${yearHeb(y)}`}>
      <h3>{name} {yearHeb(y)} <small>· {civTitle}</small></h3>
      <table className="cal">
        <thead><tr>{WEEKDAYS.map(w => <th key={w} scope="col">{w}</th>)}</tr></thead>
        <tbody>
          {Array.from({ length: cells.length / 7 }, (_, r) => (
            <tr key={r}>
              {cells.slice(r * 7, r * 7 + 7).map((day, c) => {
                if (day === null) return <td key={c} className="empty" />;
                const hs = hol.get(day) ?? [], [, cm, cd] = civOf(day);
                const kinds = new Set(hs.map(h => h.kind));
                const cls = [day % 7 === 6 ? 'shabbat' : '', kinds.has('yomtov') ? 'yomtov' : '', kinds.has('fast') ? 'fast' : ''].join(' ');
                const z = zmanim?.(day);
                return (
                  <td key={c} className={cls}>
                    <div className="cal-d"><b>{gem(day - start + 1)}</b><span className="num">{cd}/{cm + 1}</span></div>
                    {hs.map(h => <div key={h.name} className={`cal-h ${h.kind}`}>{h.name}{h.movedFrom !== undefined && ' (נדחה)'}</div>)}
                    {z && <div className="cal-z">{z.label} <span className="num">{z.t}</span></div>}
                  </td>
                );
              })}
            </tr>
          ))}
        </tbody>
      </table>
    </section>
  );
}

export function MonthCalendar() {
  const yr = useSlideYear();
  const y = yr.y;
  const months = monthsOf(y);
  const [miRaw, setMi] = useState(0);
  const mi = Math.min(miRaw, months.length - 1);
  const [dia, setDia] = useState(false);
  const [showZ, setShowZ] = useState(true);
  const [all, setAll] = useState(false);
  const { p, city } = useZDay();
  const pick = usePick();
  const mode = useStore(s => s.mode);

  const hol = useMemo(() => {
    const m = new Map<number, Holiday[]>();
    for (const h of holidays(y, { diaspora: dia })) m.set(h.day, [...(m.get(h.day) ?? []), h]);
    return m;
  }, [y, dia]);

  const zmanim = showZ ? (day: number) => {
    const wd = day % 7;
    if (wd !== 5 && wd !== 6) return null;
    const [cy, cm, cd] = civOf(day);
    const op = wd === 5 ? pick('sunset') : pick('tzeit');
    const t = zman(op.def, { y: cy, m: cm, d: cd, p });
    return t === null ? null : { label: wd === 5 ? 'שקיעה' : 'צאת', t: localHM(t) };
  } : null;

  const print = (whole: boolean) => { setAll(whole); setTimeout(() => window.print(), 50); };

  return (
    <Slide
      wide
      className="has-print cal-slide"
      kicker="כלים"
      title="לוח שנה חודשי"
      text={<>
        <p>החודשים של השנה, עם החגים, הצומות (כולל דחייתם כשהם חלים בשבת) וראשי החודשים. בשבתות ובערבי שבת אפשר להציג את זמן השקיעה ואת צאת השבת לפי השיטות שנבחרו בפרק ״היום״.</p>
        <Engine>
          <div className="ctl">
            <SlideYear yr={yr} />
            <label className="fld">חודש
              <select value={mi} onChange={e => { setMi(+e.target.value); setAll(false); }}>
                {months.map((m, i) => <option key={m[0]} value={i}>{m[0]}</option>)}
              </select>
            </label>
            <CityControl />
          </div>
          <div className="colpick">
            <label className="chk"><input type="checkbox" checked={dia} onChange={e => setDia(e.target.checked)} />חוץ לארץ (יום טוב שני)</label>
            <label className="chk"><input type="checkbox" checked={showZ} onChange={e => setShowZ(e.target.checked)} />שקיעה ביום שישי וצאת השבת ({city.name})</label>
            <label className="chk"><input type="checkbox" checked={all} onChange={e => setAll(e.target.checked)} />כל השנה</label>
          </div>
          <div className="ctl">
            <button type="button" className="btn pri" onClick={() => print(false)}>הדפסת החודש</button>
            <button type="button" className="btn" onClick={() => print(true)}>הדפסת כל השנה</button>
          </div>
          <p className="note">{isLeap(y) ? 'שנה מעוברת: פורים באדר ב׳.' : 'שנה פשוטה.'} {showZ && <>שקיעה: {pick('sunset').name}; צאת: {pick('tzeit').name}. מידע לימודי, לא פסק הלכה.</>} ימי זיכרון ועצמאות לא כלולים עדיין.</p>
        </Engine>
      </>}
      stage={
        <div className="print-table cal-wrap" data-mode={mode}>
          {(all ? months.map((_, i) => i) : [mi]).map(i => <Month key={i} y={y} mi={i} hol={hol} zmanim={zmanim} />)}
        </div>
      }
    />
  );
}


