// Visuals for chapters 7–8: a molad checked against all four dechiyot, the alternating days of 7:7, and the
// month lengths and year types of chapter 8. Arithmetic from engines/calendar.

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import {
  DAY_LETTER, DAY_NAME, P_DAY, P_HOUR, P_WEEK, TYPE_NAME, fmtMolad, gem, isLeap, keviut, moladTotal, monthStart, monthsOf, rh, rhFrom, yearHeb, yearLen, yearType,
} from '../../engines/calendar';
import { MoladControl, type MoladValue, moladParts } from '../../components/MoladControl';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Civil, Legend, Num, Sig, Tag } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { holidays } from '../../engines/holidays';
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
  // the molad as a position in the week, so it can be dragged on the wheel or run forward
  const setX = (x: number) => { const w = ((Math.round(x) % P_WEEK) + P_WEEK) % P_WEEK, d = Math.floor(w / P_DAY), q = w - d * P_DAY; setM({ d, h: Math.floor(q / P_HOUR), p: q % P_HOUR }); };
  const wx = m.d * P_DAY + PP;
  const run = usePlay(dt => setX(wx + dt * P_DAY * 0.6));
  const G = 2 * P_DAY + 9 * P_HOUR + 204, B = 1 * P_DAY + 15 * P_HOUR + 589;
  const zones = [
    ...Array.from({ length: 7 }, (_, i) => ({ from: i * P_DAY + 18 * P_HOUR, to: (i + 1) * P_DAY, cls: 'shift' as const })),
    ...(!L ? [{ from: G, to: 2 * P_DAY + 18 * P_HOUR, cls: 'leap' as const }] : []),
    ...(PL ? [{ from: B, to: 1 * P_DAY + 18 * P_HOUR, cls: 'leap' as const }] : []),
  ];
  const rd = r.day % 7;
  const days: ('' | 'bad' | 'ok')[] = Array.from({ length: 7 }, (_, i) => (i === rd ? 'ok' : [0, 3, 5].includes(i) ? 'bad' : ''));
  // the push: from the molad to the start (the evening) of the day Rosh Hashanah is fixed on
  const arcs = rd !== m.d ? [{ from: wx, to: wx + (((rd * P_DAY - wx) % P_WEEK) + P_WEEK) % P_WEEK, cls: 'shift' as const }] : [];
  return <>
    <Viz>
      <WeekWheel markers={[{ x: t, cls: 'moon', label: 'המולד' }]} days={days} zones={zones} arcs={arcs} onPick={setX}
        ticks={[{ x: G, cls: 'shift' }, { x: B, cls: 'shift' }]}
        center={['ראש השנה', dayWord(r.day), r.rules.length ? 'נדחה' : 'ביום המולד']} aria="המולד וראש השנה על גלגל השבוע; אפשר לגרור את המולד" />
      <Legend items={[['var(--moon)', 'המולד: גוררים אותו על הגלגל'], ['var(--ok-soft)', 'יום ראש השנה'], ['var(--shift-soft)', 'אד״ו'], ['var(--shift)', 'פס פנימי: זקן (18 שעות ומעלה)'], ['var(--leap)', 'פס פנימי: גטר״ד / בטו תקפט']]} />
      <div className="ctl">
        <button type="button" className="btn pri play-btn" aria-pressed={run.playing} onClick={run.toggle}>{run.playing ? '❚❚ עצור' : '▶ המולד זז בשבוע'}</button>
        <input type="range" min={0} max={P_WEEK - 18} step={18} value={wx - (wx % 18)} onChange={e => setX(+e.target.value)} aria-label="מקום המולד בשבוע" />
      </div>
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

/**
 * The whole year built from two moladot (chapters 6–8 together): molad Tishrei of this year and of the next give the
 * two Rosh Hashanas (with their dechiyot); the days between them give the year's length and so its months; and
 * from there every day of the year falls into place. Each month shows its molad, its Rosh Chodesh and the festivals.
 */
export function YearFromMolad() {
  const yr = useSlideYear(), y = yr.y;
  const a = rh(y), b = rh(y + 1), len = b.day - a.day, t = yearType(len), L = isLeap(y), ms = monthsOf(y);
  const gap = ((len % 7) + 6) % 7;
  // build the year month by month (or show it all at once)
  const [shown, setShown] = useState(Infinity), building = shown < ms.length;
  useEffect(() => {
    if (!building) return;
    const id = setTimeout(() => setShown(shown + 1), 650);
    return () => clearTimeout(id);
  }, [building, shown]);
  useEffect(() => setShown(Infinity), [y]);
  const hol = useMemo(() => {
    const m = new Map<number, string[]>();
    for (const h of holidays(y)) if (h.kind === 'yomtov' || h.name.startsWith('פורים') || h.name.startsWith('חנוכה')) m.set(h.day, [...(m.get(h.day) ?? []), h.name]);
    return m;
  }, [y]);
  // the day of each month's molad: often the last day of the month before, so it is marked wherever it falls
  const moladOn = useMemo(() => new Map(monthsOf(y).map(([n], mi) => [Math.floor(moladTotal(y, mi) / P_DAY), n])), [y]);
  const rules = (r: typeof a) => (r.rules.length ? r.rules.map(k => RULE_NAME[k]).join(' ← ') : 'ביום המולד');
  const rows: StepRow[] = [
    { l: <>מולד תשרי {yearHeb(y)}</>, v: <Sig>{fmtMolad(a.t)}</Sig>, s: <>ראש השנה: {dayWord(a.day)} ({rules(a)})</> },
    { l: <>מולד תשרי {yearHeb(y + 1)}</>, v: <Sig>{fmtMolad(b.t)}</Sig>, s: <>ראש השנה: {dayWord(b.day)} ({rules(b)})</> },
    { l: 'הימים שבין שני ראשי השנה', v: <Num>{gap}</Num>, s: <>השנה: <Num>{len}</Num> ימים, {L ? 'מעוברת' : 'פשוטה'}</> },
    { l: 'ומכאן החודשים', v: t ? <>{TYPE_NAME[t]}: חשוון <Num>{ms[1][1]}</Num>, כסלו <Num>{ms[2][1]}</Num></> : '?', s: <>קביעות <Sig>{keviut(y)}</Sig></>, c: 'final' },
  ];
  return <>
    <Engine title={<>בונים את שנת {yearHeb(y)} מהמולד</>} sub="שני מולדות תשרי, ומהם כל השנה">
      <div className="ctl">
        <SlideYear yr={yr} />
        <button type="button" className="btn pri" onClick={() => setShown(building ? Infinity : 0)}>{building ? 'הצג הכול' : '▶ בונים חודש אחרי חודש'}</button>
      </div>
      <Steps rows={rows} />
    </Engine>
    <Viz>
      <div className="ycal" aria-label={`לוח שנת ${yearHeb(y)}`}>
        {ms.map(([name, n], mi) => {
          const start = monthStart(y, mi), lead = start % 7;
          const cells = [...Array<null>(lead).fill(null), ...Array.from({ length: n }, (_, i) => start + i)];
          const on = mi < shown;
          return (
            <section key={name} className={`ym${on ? '' : ' off'}`} aria-label={name}>
              <h4>{name} <Tag tone={n === 30 ? 'ok' : 'leap'}>{n === 30 ? 'מלא' : 'חסר'}</Tag></h4>
              <p className="ym-molad">מולד: <Sig>{fmtMolad(moladTotal(y, mi))}</Sig></p>
              <div className="ym-grid">
                {DAY_LETTER.map(l => <b key={l}>{l}׳</b>)}
                {on && cells.map((d, i) => d === null ? <span key={i} /> : (
                  <span key={i} title={[...(hol.get(d) ?? []), ...(moladOn.has(d) ? [`מולד ${moladOn.get(d)}`] : [])].join(', ') || undefined}
                    className={[d % 7 === 6 ? 'sh' : '', d - start === 0 || d - start === 29 ? 'rc' : '', hol.has(d) ? 'hg' : '', moladOn.has(d) ? 'mo' : ''].join(' ')}>
                    {gem(d - start + 1)}
                  </span>
                ))}
              </div>
            </section>
          );
        })}
      </div>
      <Legend items={[['var(--c-accent)', 'ראש חודש'], ['var(--c-moon)', 'יום המולד'], ['var(--c-moon-soft)', 'חג'], ['var(--c-leap-soft)', 'שבת']]} />
      <p className="note">ראש חודש: יום א׳ של החודש, ואחרי חודש מלא גם יום ל׳ שלפניו. הנקודה: יום המולד. הוא קרוב לראש החודש, לפעמים יום או יומיים לפניו או אחריו (ואז הנקודה בחודש שלפניו), בגלל החודשים המלאים והחסרים ובגלל הדחיות. מעבר עם העכבר מראה של איזה חודש המולד.</p>
    </Viz>
  </>;
}
