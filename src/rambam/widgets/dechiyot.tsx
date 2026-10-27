// Visuals for chapters 7–8: a molad checked against all four dechiyot, the alternating days of 7:7, and the
// month lengths and year types of chapter 8. Arithmetic from engines/calendar.

import { type ReactNode, useMemo, useState } from 'react';
import {
  DAY_LETTER, DAY_NAME, P_DAY, P_HOUR, TYPE_NAME, fmtMolad, isLeap, keviut, monthsOf, rh, rhFrom, yearHeb, yearLen, yearType,
} from '../../engines/calendar';
import { MoladControl, type MoladValue, moladParts } from '../../components/MoladControl';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Civil, Legend, Num, Sig, Tag } from '../../components/text';
import { WeekWheel, dayMark } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { RULE_NAME, dayWord } from '../../lib/format';

const fx = (on: boolean) => (on ? 'guide-focus' : '');
const ck = (b: boolean) => (b ? '✓' : '✗');
export type Rule = 'adu' | 'zaken' | 'gatrad' | 'betu';

/** A molad (with "this year leap" / "last year leap"), checked against the four dechiyot in the Rambam's order (7:6). */
export function DechiyaCheck({ start, leap = false, prevLeap = false, focus, title = 'בודקים את המולד' }: {
  start: MoladValue; leap?: boolean; prevLeap?: boolean; focus?: Rule | 'result'; title?: ReactNode;
}) {
  const [m, setM] = useState(start), [L, setL] = useState(leap), [PL, setPL] = useState(prevLeap);
  const t = moladParts(m), PP = m.h * P_HOUR + m.p, r = rhFrom(t, L, PL);
  const zaken = m.h >= 18, gat = !zaken && m.d === 2 && !L && PP >= 9 * P_HOUR + 204, betu = !zaken && !gat && m.d === 1 && PL && PP >= 15 * P_HOUR + 589;
  const cand = (m.d + (zaken || gat || betu ? 1 : 0)) % 7, adu = [0, 3, 5].includes(cand);
  const rows: StepRow[] = [
    { l: 'המולד', v: <Sig>{fmtMolad(t)}</Sig>, s: <>{DAY_NAME[m.d]}, <Civil t={t} /></> },
    { l: 'מולד זקן: 18 שעות ומעלה?', v: zaken ? <Tag tone="bad">כן</Tag> : 'לא', c: zaken ? 'bad' : '' },
    { l: 'גטר״ד: ג׳, ט׳ ר״ד ומעלה, פשוטה?', v: <>{ck(m.d === 2)} {ck(PP >= 9 * P_HOUR + 204)} {ck(!L)}{gat && <> <Tag tone="bad">חלה</Tag></>}</>, c: gat ? 'bad' : '' },
    { l: 'בטו תקפט: ב׳, ט״ו תקפ״ט ומעלה, אחרי מעוברת?', v: <>{ck(m.d === 1)} {ck(PP >= 15 * P_HOUR + 589)} {ck(PL)}{betu && <> <Tag tone="bad">חלה</Tag></>}</>, c: betu ? 'bad' : '' },
    { l: 'לא אד״ו: היום שהתקבל', v: <>{dayWord(cand)}{adu && <> <Tag tone="bad">אד״ו, עוד יום</Tag></>}</>, c: adu ? 'bad' : '' },
    { l: 'ראש השנה', v: dayWord(r.day), s: r.rules.length ? r.rules.map(k => RULE_NAME[k]).join(' ← ') : 'ביום המולד', c: 'final' },
  ];
  const row = { zaken: 1, gatrad: 2, betu: 3, adu: 4, result: 5 } as const;
  return <>
    <Viz>
      <WeekWheel markers={[{ x: t, cls: 'moon', label: 'המולד' }]} days={dayMark(r.day)}
        ticks={[{ x: 2 * P_DAY + 9 * P_HOUR + 204, cls: 'shift' }, { x: 1 * P_DAY + 15 * P_HOUR + 589, cls: 'shift' }]}
        center={['ראש השנה', dayWord(r.day), r.rules.length ? 'נדחה' : 'ביום המולד']} aria="המולד וראש השנה על גלגל השבוע" />
      <Legend items={[['var(--moon)', 'המולד'], ['var(--ok-soft)', 'יום ראש השנה'], ['var(--shift)', 'הקווים: ג׳ ט׳ ר״ד וב׳ ט״ו תקפ״ט']]} />
    </Viz>
    <Engine title={title} sub="בסדר של הרמב״ם" className={fx(!!focus)}>
      <MoladControl value={m} onChange={setM} extras={<>
        <label className="chk"><input type="checkbox" checked={L} onChange={e => setL(e.target.checked)} />השנה מעוברת</label>
        <label className="chk"><input type="checkbox" checked={PL} onChange={e => setPL(e.target.checked)} />השנה שעברה מעוברת</label>
      </>} />
      <Steps rows={rows} focus={focus ? row[focus] : undefined} />
    </Engine>
  </>;
}

/** 7:7: from Tuesday on, a day to fix and a day to push, alternately. */
export function FixPush() {
  const kind = ['push', 'fix', 'fix', 'push', 'fix', 'push', 'fix'] as const;   // Sunday … Shabbat
  return <>
    <Viz>
      <WeekWheel days={kind.map(k => (k === 'push' ? 'bad' : 'ok'))} center={['יום קביעה', 'ויום דחייה', 'לסירוגין']} aria="ימי קביעה וימי דחייה על גלגל השבוע" />
      <Legend items={[['var(--ok-soft)', 'קובעין'], ['var(--shift-soft)', 'דוחין']]} />
    </Viz>
    <Engine title="קובעין, דוחין">
      <p className="m0">{(['ג', 'ד', 'ה', 'ו', 'ז', 'א', 'ב'] as const).map((l, k) => { const i = DAY_LETTER.indexOf(l); return <span key={l}>{k > 0 && ' · '}{l}׳ {kind[i] === 'fix' ? <Tag tone="ok">קובעין</Tag> : <Tag tone="bad">דוחין</Tag>}</span>; })}</p>
    </Engine>
  </>;
}

/** Months of a year with their lengths, in the Rambam's order; the variable months marked (8:5–8:6). */
export function MonthLengths({ hl }: { hl?: 'fixed' | 'var' | 'adar' }) {
  const yr = useSlideYear(), ms = monthsOf(yr.y), t = yearType(yearLen(yr.y));
  const isVar = (n: string) => n === 'חשוון' || n === 'כסלו', isAdar = (n: string) => n.startsWith('אדר');
  return (
    <Engine title={<>חודשי {yearHeb(yr.y)}</>} sub={<>שנה {isLeap(yr.y) ? 'מעוברת' : 'פשוטה'}, חדשיה {t ? TYPE_NAME[t] === 'כסדרה' ? 'כסדרן' : TYPE_NAME[t] === 'שלמה' ? 'שלמים' : 'חסרים' : ''}</>}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="mlen">
        {ms.map(([n, d]) => (
          <div key={n} className={`${d === 30 ? 'full' : 'short'} ${(hl === 'var' && isVar(n)) || (hl === 'adar' && isAdar(n)) || (hl === 'fixed' && !isVar(n)) ? 'on' : ''}`}>
            <b>{n}</b><span><Num>{d}</Num></span><small>{d === 30 ? 'מלא' : 'חסר'}</small>
          </div>
        ))}
      </div>
      <p className="note">מלא: <Num>30</Num> ימים. חסר: <Num>29</Num>. סך הכול <Num>{yearLen(yr.y)}</Num> ימים.</p>
    </Engine>
  );
}

/** Rosh Chodesh: day 30 of a full month is the first day of the next one's Rosh Chodesh (8:4). */
export function RoshChodesh() {
  const yr = useSlideYear(), ms = monthsOf(yr.y);
  return (
    <Engine title={<>ראשי חודשים {yearHeb(yr.y)}</>} sub="אחרי חודש מלא: שני ימים">
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="table-wrap">
        <table className="kt">
          <thead><tr><th>ראש חודש</th><th>ימים</th><th>כי החודש שעבר</th></tr></thead>
          <tbody>
            {ms.slice(1).map(([n], i) => { const prev = ms[i]; return (
              <tr key={n} className={prev[1] === 30 ? 'hl' : ''}><td>{n}</td><td>{prev[1] === 30 ? <>ל׳ {prev[0]} וא׳ {n}</> : <>א׳ {n}</>}</td><td>{prev[0]} {prev[1] === 30 ? 'מלא' : 'חסר'}</td></tr>
            ); })}
          </tbody>
        </table>
      </div>
    </Engine>
  );
}

/** Half days and the parts above them: why some years have more full months (8:1–8:3). */
export function HalfDays({ focus }: { focus?: 'half' | 'parts' }) {
  return (
    <Engine title="חודש של 29½ ימים ועוד" sub="ימים שלמים בלבד" className={fx(!!focus)}>
      <Steps focus={focus === 'half' ? 1 : focus === 'parts' ? 3 : undefined} rows={[
        { l: 'חודש הלבנה', v: <><Num>29</Num> ימים ומחצה ו־<Num>793</Num> חלקים</> },
        { l: 'שני חודשים: אחד חסר ואחד מלא', v: <><Num>29 + 30 = 59</Num> ימים</>, s: 'בלי לחשב שעות' },
        { l: <>שנה: <Num>6</Num> חסרים ו־<Num>6</Num> מלאים</>, v: <><Num>354</Num> ימים</> },
        { l: 'אבל בכל חודש עוד 793 חלקים', v: <><Num>12</Num> × <Num>793</Num> = <Num>9516</Num> חלקים</>, s: <>כ־<Num>8</Num> שעות ו־<Num>876</Num> חלקים בשנה: מצטברים לימים</> },
        { l: 'ולכן', v: 'יש שנים עם חסרים יותר, ויש עם מלאים יותר', c: 'final' },
      ]} />
    </Engine>
  );
}

/** The year type from the gap between this Rosh Hashana and the next (8:7–8:9). */
export function YearTypeByGap({ focus }: { focus?: 'gap' | 'type' }) {
  const yr = useSlideYear(), a = rh(yr.y).day, b = rh(yr.y + 1).day, L = isLeap(yr.y);
  const gap = ((b - a) % 7 + 6) % 7, t = yearType(b - a)!;
  const table = L ? [[4, 'חסרים'], [5, 'כסדרן'], [6, 'שלמים']] : [[2, 'חסרים'], [3, 'כסדרן'], [4, 'שלמים']];
  return (
    <Engine title="מניין הימים שבין ראש השנה לראש השנה" sub="חוץ מיום הקביעה של זו ושל זו" className={fx(!!focus)}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <Steps focus={focus === 'gap' ? 2 : focus === 'type' ? 3 : undefined} rows={[
        { l: <>ראש השנה {yearHeb(yr.y)}</>, v: dayWord(a), s: L ? 'שנה מעוברת' : 'שנה פשוטה' },
        { l: <>ראש השנה {yearHeb(yr.y + 1)}</>, v: dayWord(b) },
        { l: 'הימים שביניהם', v: <Num>{gap}</Num> },
        { l: 'חדשי השנה', v: <>{table.find(([g]) => g === gap)?.[1]} · <Num>{b - a}</Num> ימים · קביעות <Sig>{keviut(yr.y)}</Sig></>, s: TYPE_NAME[t], c: 'final' },
      ]} />
      <div className="table-wrap"><table className="kt"><thead><tr><th>ימים ביניהם ({L ? 'מעוברת' : 'פשוטה'})</th><th>חדשיה</th></tr></thead>
        <tbody>{table.map(([g, n]) => <tr key={g} className={g === gap ? 'hl' : ''}><td><Num>{g}</Num></td><td>{n}</td></tr>)}</tbody></table></div>
    </Engine>
  );
}

/** The signs of 8:10: which year types each Rosh Hashana weekday allows, counted over 1500 years. */
export function TypeSigns({ hl }: { hl?: number }) {
  const days = [1, 2, 4, 6], types = ['ח', 'כ', 'ש'] as const;
  const counts = useMemo(() => {
    const m = new Map<string, number>();
    for (let y = 5000; y < 6500; y++) { const k = `${rh(y).day % 7}|${isLeap(y)}|${yearType(yearLen(y))}`; m.set(k, (m.get(k) ?? 0) + 1); }
    return m;
  }, []);
  const count = (d: number, L: boolean, t: string) => counts.get(`${d}|${L}|${t}`) ?? 0;
  return (
    <Engine title="ראש השנה ביום… וחדשי השנה" sub="כמה פעמים כל אפשרות קורית ב־1500 שנה">
      <div className="table-wrap">
        <table className="kt">
          <thead><tr><th>ראש השנה</th><th>שנה</th>{types.map(t => <th key={t}>{TYPE_NAME[t]}</th>)}</tr></thead>
          <tbody>
            {days.flatMap(d => [false, true].map(L => (
              <tr key={`${d}${L}`} className={hl === d ? 'hl' : ''}>
                <td>{DAY_NAME[d]}</td><td>{L ? 'מעוברת' : 'פשוטה'}</td>
                {types.map(t => { const n = count(d, L, t); return <td key={t}>{n ? <Num>{n}</Num> : <Tag tone="bad">אי אפשר</Tag>}</td>; })}
              </tr>
            )))}
          </tbody>
        </table>
      </div>
    </Engine>
  );
}
