// Chapter 14, halachot 2–4: the Rambam's motion tables, breaking a number of days into his blocks, dropping whole
// circles ("שארית מהלכו"), and the full calculation from the epoch for any evening.

import { type ReactNode, useEffect, useState } from 'react';
import { monthStart, monthsOf, yearHeb } from '../../engines/calendar';
import { type Block, RB, rMotion, rambamD0, secOf } from '../../engines/rambam';
import { Engine } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DMS, Num } from '../../components/text';
import { YearControl } from '../../components/YearControl';
import { NUM } from '../../lib/format';
import { SignPos } from './Wheels14';

export type Which = 'moon' | 'crs' | 'sun' | 'apo' | 'head';
export const FULL = 1296000;
const norm = (s: number) => ((s % FULL) + FULL) % FULL;
export const WHICH_NAME: Record<Which, string> = { moon: 'אמצע הירח', crs: 'אמצע המסלול', sun: 'אמצע השמש', apo: 'גובה השמש', head: 'אמצע הראש' };
/** The rows in the order the Rambam lists them. */
const ORDER: Block[] = [1, 10, 100, 1000, 10000, 29, 354];
const BLOCK_NAME: Record<Block, ReactNode> = { 1: 'יום אחד', 10: <><Num>10</Num> ימים</>, 100: <><Num>100</Num> ימים</>, 1000: <><Num>1,000</Num> ימים</>, 10000: <><Num>10,000</Num> ימים</>, 29: <><Num>29</Num> ימים</>, 354: <>שנה סדורה (<Num>354</Num>)</> };

/** The Rambam's table for one mean motion; `hl` lights rows, `used` marks the rows a decomposition uses. */
export function MotionTable({ which, hl = [], used }: { which: Which; hl?: Block[]; used?: Map<Block, number> }) {
  return (
    <div className="table-wrap">
      <table className="kt rtable">
        <thead><tr><th>זמן</th><th>{WHICH_NAME[which]}: שארית המהלך</th>{used && <th>פעמים</th>}</tr></thead>
        <tbody>
          {ORDER.map(k => (
            <tr key={k} className={hl.includes(k) || used?.has(k) ? 'hl' : ''}>
              <td>{BLOCK_NAME[k]}</td>
              <td><DMS sec={secOf(RB[which][k])} /></td>
              {used && <td>{used.has(k) ? <Num>{used.get(k)}</Num> : ''}</td>}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}

/** A dial: a total motion as whole turns plus the remainder (the Rambam's "שארית"). */
export function TurnsDial({ total, label }: { total: number; label: ReactNode }) {
  const turns = Math.floor(total / FULL), rem = total - turns * FULL, a = (rem / FULL) * 2 * Math.PI;
  const R = 80, x = 100 + R * Math.sin(a), y = 100 - R * Math.cos(a), big = rem > FULL / 2 ? 1 : 0;
  return (
    <figure className="turns">
      <svg viewBox="0 0 200 200" role="img" aria-label={`${turns} סיבובים שלמים ועוד שארית`}>
        <circle cx="100" cy="100" r={R} fill="none" stroke="var(--c-line-strong)" strokeWidth="10" />
        {turns > 0 && <circle cx="100" cy="100" r={R} fill="none" stroke="var(--c-leap)" strokeOpacity=".35" strokeWidth="10" />}
        {rem > 0 && <path d={`M100 ${100 - R} A${R} ${R} 0 ${big} 1 ${x.toFixed(1)} ${y.toFixed(1)}`} fill="none" stroke="var(--c-moon)" strokeWidth="10" strokeLinecap="round" />}
        <text x="100" y="96" textAnchor="middle" className="turns-n">{NUM(turns)}</text>
        <text x="100" y="118" textAnchor="middle" className="turns-t">סיבובים שלמים</text>
      </svg>
      <figcaption>{label}: <DMS sec={total} /> = <Num>{NUM(turns)}</Num> × <Num>360°</Num> + <strong><DMS sec={rem} /></strong></figcaption>
    </figure>
  );
}

/** Rows for N days of one motion: the blocks, the raw sum, and what is left after whole circles. */
export function blockRows(which: Which, N: number): { rows: StepRow[]; total: number; parts: [Block, number][] } {
  const m = rMotion(RB[which], N);
  const rows: StepRow[] = m.parts.map(([k, c]) => ({
    l: <><Num>{c}</Num> × {BLOCK_NAME[k]}</>,
    v: <DMS sec={c * secOf(RB[which][k])} />,
    s: c > 1 ? <>כל אחד: <DMS sec={secOf(RB[which][k])} /></> : undefined,
  }));
  rows.push({ l: 'מחברים', v: <DMS sec={m.v} /> });
  rows.push({ l: 'משמיטים סיבובים שלמים', v: <DMS sec={norm(m.v)} />, s: <><Num>{Math.floor(m.v / FULL)}</Num> × <Num>360°</Num></>, c: 'final' });
  return { rows, total: m.v, parts: m.parts };
}

/** Break any number of days into the Rambam's blocks (halacha 2: "ועל דרך זו תכפול"). */
export function Decompose({ which, className = '' }: { which: Which; className?: string }) {
  const [N, setN] = useState(100);
  const { rows, total, parts } = blockRows(which, N);
  return (
    <Engine title="כמה ימים שתרצו" sub={`${WHICH_NAME[which]}, לפי הטבלה`} className={className}>
      <div className="ctl">
        <label className="fld">ימים
          <input type="number" min={1} max={99999} value={N} onChange={e => setN(Math.max(1, Math.min(99999, Math.round(+e.target.value || 1))))} />
        </label>
        {[29, 100, 354, 1000, 2357].map(v => <button key={v} type="button" className="btn" aria-pressed={N === v} onClick={() => setN(v)}><Num>{NUM(v)}</Num></button>)}
      </div>
      <p className="m0"><Num>{NUM(N)}</Num> = {parts.map(([k, c], i) => <span key={k}>{i > 0 && ' + '}<Num>{c > 1 ? `${c}×${NUM(k)}` : NUM(k)}</Num></span>)}</p>
      <Steps rows={rows} />
      <TurnsDial total={total} label={<>{WHICH_NAME[which]} ב־<Num>{NUM(N)}</Num> ימים</>} />
    </Engine>
  );
}

/** Day index of a Hebrew date (the evening that begins it). */
const dayOf = (y: number, mi: number, d: number) => monthStart(y, mi) + d - 1;
const ROOT_NAME: Record<Which, ReactNode> = {
  moon: <>מעלה אחת, <Num>14</Num> חלקים, <Num>43</Num> שניות במזל שור</>,
  crs: <><Num>84</Num> מעלות, <Num>28</Num> חלקים, <Num>42</Num> שניות</>,
  sun: <><Num>7</Num> מעלות, <Num>3</Num> חלקים, <Num>32</Num> שניות במזל טלה</>,
  apo: <><Num>26</Num> מעלות, <Num>45</Num> חלקים, <Num>8</Num> שניות במזל תאומים</>,
  head: <><Num>180</Num> מעלות, <Num>57</Num> חלקים, <Num>28</Num> שניות</>,
};

/** A night to calculate for (the evening that begins a Hebrew date). Default: the Rambam's example, 2 Iyar 4938
 *  (15:8); chapter 12–13 pass their own, 14 Tammuz 4938. */
export function useNight(ex: { month: string; day: number } = { month: 'אייר', day: 2 }) {
  const exMonth = () => monthsOf(4938).findIndex(x => x[0] === ex.month);
  const [y, setY] = useState(4938);
  const months = monthsOf(y);
  const [mi, setMi] = useState(exMonth);
  const [d, setD] = useState(ex.day);
  const m = Math.min(mi, months.length - 1), day = Math.min(d, months[m][1]);
  const dayIdx = dayOf(y, m, day);
  return {
    y, setY, months, m, setMi, day, setD, dayIdx, N: dayIdx - rambamD0(),
    isExample: y === 4938 && months[m][0] === ex.month && day === ex.day,
    reset: () => { setY(4938); setMi(exMonth()); setD(ex.day); },
    label: <>ליל {day} {months[m][0]} {yearHeb(y)}</>,
  };
}
export type Night = ReturnType<typeof useNight>;

export function NightPicker({ night }: { night: Night }) {
  const { y, setY, months, m, setMi, day, setD, isExample, reset } = night;
  return (
    <div className="ctl">
      <YearControl value={y} onChange={setY} label="שנה" />
      <label className="fld">חודש
        <select value={m} onChange={e => setMi(+e.target.value)}>{months.map(([name], k) => <option key={k} value={k}>{name}</option>)}</select>
      </label>
      <label className="fld">יום
        <input type="number" min={1} max={months[m][1]} value={day} onChange={e => setD(Math.max(1, Math.min(30, Math.round(+e.target.value || 1))))} />
      </label>
      {!isExample && <button type="button" className="btn" onClick={reset}>הדוגמה של הרמב״ם</button>}
    </div>
  );
}

export type CalcFocus = 'days' | 'blocks' | 'root' | 'result';

/** Halacha 4: the mean moon and the mean course at the start of any night, from the epoch. Default: the Rambam's example. */
export function FullCalc({ focus, onN, which = ['moon', 'crs'], example = { month: 'אייר', day: 2 } }: {
  focus?: CalcFocus; onN?: (N: number) => void; which?: Which[]; example?: { month: string; day: number };
}) {
  const night = useNight(example), { N, isExample, months, m, day, y } = night;
  useEffect(() => { if (N >= 0) onN?.(N); }, [N, onN]);

  const calc = (which: Which) => {
    const b = rMotion(RB[which], N), root = secOf(RB.root[which]), res = norm(root + b.v);
    const rows: StepRow[] = [
      { l: <>{WHICH_NAME[which]} ב־<Num>{NUM(N)}</Num> ימים (לפי הטבלאות)</>, v: <DMS sec={norm(b.v)} />, s: b.parts.map(([k, c]) => `${c}×${NUM(k)}`).join(' + ') },
      { l: 'ועוד העיקר', v: <DMS sec={root} />, s: ROOT_NAME[which] },
      { l: <>{WHICH_NAME[which]} בתחילת הליל</>, v: which !== 'crs' && which !== 'head' ? <SignPos sec={res} /> : <DMS sec={res} />, s: which !== 'crs' && which !== 'head' ? <>מתחילת טלה: <DMS sec={res} /></> : undefined, c: 'final' },
    ];
    return rows;
  };
  const rowFocus = focus === 'blocks' ? 0 : focus === 'root' ? 1 : focus === 'result' ? 2 : undefined;

  return (
    <Engine title="החשבון המלא" sub="לתחילת כל ליל שתרצו" className={focus ? 'guide-focus' : ''}>
      <NightPicker night={night} />
      {N < 0 ? <p className="note">התאריך לפני העיקר (ג׳ ניסן {yearHeb(4938)}). החשבון של הרמב״ם מתחיל מהעיקר והלאה.</p> : <>
        <Steps focus={focus === 'days' ? 0 : undefined} rows={[{ l: <>ימים שלמים מתחילת ליל העיקר עד תחילת ליל {day} {months[m][0]} {yearHeb(y)}</>, v: <Num>{NUM(N)}</Num>, s: isExample ? 'הדוגמה של הרמב״ם' : undefined }]} />
        <div className={which.length > 1 ? 'vpair' : ''}>
          {which.map(w => <div key={w}><p className="vt">{WHICH_NAME[w]}</p><Steps rows={calc(w)} focus={rowFocus} /></div>)}
        </div>
      </>}
    </Engine>
  );
}

