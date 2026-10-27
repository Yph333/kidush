// Visuals for the fixed-calendar chapters of the Rambam (6–8). All arithmetic comes from engines/calendar.

import { type ReactNode, useMemo, useState } from 'react';
import {
  BAHRAD, DAY_NAME, EX, LEAP_POS, P_DAY, P_HOUR, P_MONTH, P_WEEK, addDHP, cyclePos, dhpOf, fmtDur, fmtMolad, isLeap,
  monthsOf, moladByExcess, moladTotal, yearHeb,
} from '../../engines/calendar';
import { moladMs, sky, CITIES } from '../../engines/astro';
import { MoladControl, type MoladValue } from '../../components/MoladControl';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Civil, DHP, Facts, Legend, Num, Sig } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM, hrs } from '../../lib/format';
import { monthModel } from '../../lib/month';
import type { MonthProps } from '../../scenes/monthSystem';

const fx = (on: boolean) => (on ? 'guide-focus' : '');

/** A duration as "29 ימים, 12 שעות, 793 חלקים" plus its sign in letters. */
export function Dur({ t, sign = true }: { t: number; sign?: boolean }) {
  return <><DHP t={t} />{sign && <> (<Sig>{fmtDur(t)}</Sig>)</>}</>;
}

// ---------------------------------------------------------------------------------------------------- 6:1
const loadMonth = () => import('../../scenes/monthSystem').then(m => m.default);

/** The mean molad (the calendar) and the true conjunction (astronomy) of one month, side by side, and in 3D. */
export function MeanVsTrue({ focus }: { focus?: boolean }) {
  const yr = useSlideYear();
  const M = monthModel(yr.y, 0, CITIES[0]);
  const mean = moladMs(moladTotal(yr.y)), conj = M.conj, sk = sky(conj, CITIES[0]);
  const props = useMemo<MonthProps>(() => ({ sunLam: sk.sunLam, moonLam: sk.moonLam, moonBeta: sk.moonBeta, arc: [sk.sunLam + 180, sk.sunLam + 181], ms: conj }), [sk.sunLam, sk.moonLam, sk.moonBeta, conj]);
  const fmt = (ms: number) => new Date(ms).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' });
  return <>
    <Viz>
      <Scene3D load={loadMonth} props={props} label="השמש, כדור הארץ והירח ברגע הקיבוץ האמיתי" views={[{ id: 'earth', label: 'קרוב לכדור הארץ' }, { id: 'oblique', label: 'מבט אלכסוני' }]}
        fallback={<p className="note">הירח בין כדור הארץ לשמש.</p>} />
      <p className="note">הירח עובר בין כדור הארץ לשמש: זה ״קיבוץ הירח עם החמה״.</p>
    </Viz>
    <Engine title={<>מולד תשרי {yearHeb(yr.y)}</>} sub="החשבון מול השמיים" className={fx(!!focus)}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <Facts items={[
        ['המולד (מהלך אמצעי)', <>{fmt(mean)}</>],
        ['הקיבוץ האמיתי', <>{fmt(conj)}</>],
        ['ההפרש', <><Num>{hrs(Math.abs(conj - mean))}</Num> שעות {conj > mean ? '(האמיתי מאוחר)' : '(האמיתי מוקדם)'}</>],
      ]} />
    </Engine>
  </>;
}

// ---------------------------------------------------------------------------------------------------- 6:2
/** 1080 and the fractions it divides into evenly (6:2). */
export function Divisors({ hl }: { hl?: number[] }) {
  const ds: [number, string][] = [[2, 'חצי'], [4, 'רביע'], [8, 'שמינית'], [3, 'שליש'], [6, 'שתות'], [9, 'תשיעית'], [5, 'חומש'], [10, 'עישור']];
  return (
    <Engine title="שעה = 1080 חלקים" sub="ומה מתחלק בה בלי שארית">
      <div className="divisors">
        {ds.map(([n, name]) => (
          <div key={n} className={hl?.includes(n) ? 'on' : ''}>
            <b>{name}</b>
            <span><Num>1080 ÷ {n} = {1080 / n}</Num></span>
          </div>
        ))}
        <div className="bad"><b>שביעית</b><span><Num>1080 ÷ 7 ≈ 154.3</Num></span></div>
      </div>
      <p className="note">חלק אחד = <Num>3⅓</Num> שניות. <Num>18</Num> חלקים = דקה.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 6:3–6:4
/** The month, and the years built from it, against the solar year. */
export function YearBars({ hl }: { hl?: 'month' | 'pashut' | 'meubar' | 'sun' | 'diff' }) {
  const rows: [string, number, ReactNode, string][] = [
    ['month', P_MONTH, 'חודש הלבנה', 'var(--c-moon)'],
    ['pashut', 12 * P_MONTH, 'שנה פשוטה (12 חודשים)', 'var(--c-moon)'],
    ['meubar', 13 * P_MONTH, 'שנה מעוברת (13 חודשים)', 'var(--c-leap)'],
    ['sun', 365 * P_DAY + 6 * P_HOUR, 'שנת החמה (לשמואל)', 'var(--c-sun)'],
  ];
  const max = 13 * P_MONTH;
  return (
    <Engine title="חודשים ושנים" sub="בימים, שעות וחלקים">
      <div className="ybars">
        {rows.map(([k, t, name, col]) => (
          <div key={k} className={hl === k ? 'on' : ''}>
            <span className="ybl">{name}</span>
            <span className="ybar"><i style={{ inlineSize: `${(100 * t) / max}%`, background: col }} /></span>
            <span className="ybv"><DHP t={t} /></span>
          </div>
        ))}
      </div>
      <p className={`m0 ${hl === 'diff' ? 'hlp' : ''}`}>שנת החמה ארוכה משנה פשוטה של לבנה ב־<DHP t={365 * P_DAY + 6 * P_HOUR - 12 * P_MONTH} />.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 6:5
export type ExKind = 'month' | 'pashut' | 'meubar' | 'cycle';
export const EX_NAME: Record<ExKind, string> = { month: 'חודש', pashut: 'שנה פשוטה', meubar: 'שנה מעוברת', cycle: 'מחזור (19 שנים)' };
const EX_LEN: Record<ExKind, number> = { month: P_MONTH, pashut: 12 * P_MONTH, meubar: 13 * P_MONTH, cycle: 235 * P_MONTH };

/** A length of time with whole weeks dropped: what is left moves the weekday (6:5). */
export function Remainder({ kind: k0, choose = true }: { kind: ExKind; choose?: boolean }) {
  const [kind, setKind] = useState<ExKind>(k0);
  const k = choose ? kind : k0, L = EX_LEN[k], weeks = Math.floor(L / P_WEEK);
  return (
    <>
      <Viz>
        <WeekWheel arcs={[{ from: BAHRAD, to: BAHRAD + EX[k], cls: k === 'meubar' ? 'leap' : 'moon' }]}
          center={['השארית', fmtDur(EX[k]), EX_NAME[k]]} aria={`שארית ${EX_NAME[k]} על גלגל השבוע`} />
      </Viz>
      <Engine title="משליכים שבעה שבעה" sub={EX_NAME[k]}>
        {choose && <div className="seg" role="radiogroup">{(Object.keys(EX_NAME) as ExKind[]).map(x => <button key={x} type="button" role="radio" aria-checked={k === x} onClick={() => setKind(x)}>{EX_NAME[x]}</button>)}</div>}
        <Steps rows={[
          { l: EX_NAME[k], v: <DHP t={L} /> },
          { l: 'שבועות שלמים', v: <><Num>{NUM(weeks)}</Num> × <Num>7</Num> = <Num>{NUM(weeks * 7)}</Num> ימים</>, s: 'לא משנים באיזה יום בשבוע' },
          { l: 'השארית', v: <Dur t={EX[k]} />, c: 'final' },
        ]} />
      </Engine>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------- 6:6–6:9, 6:13
const val = (m: MoladValue) => m.d * P_DAY + m.h * P_HOUR + m.p;

/** Add a remainder to a molad, carrying parts → hours → days and dropping weeks (6:6–6:9). */
export function AddRemainder({ start, kind: k0, focus, title = 'מוסיפים שארית', choose = true }: {
  start: MoladValue; kind: ExKind; focus?: 'parts' | 'hours' | 'days' | 'result'; title?: ReactNode; choose?: boolean;
}) {
  const [m, setM] = useState<MoladValue>(start);
  const [kind, setKind] = useState<ExKind>(k0);
  const k = choose ? kind : k0, ex = dhpOf(EX[k]), s = addDHP(m, ex);
  const res = s.d * P_DAY + s.h * P_HOUR + s.p;
  const rows: StepRow[] = [
    { l: 'המולד', v: <Sig>{fmtMolad(val(m))}</Sig>, s: <>{DAY_NAME[m.d]}, <Civil t={val(m)} /></> },
    { l: <>ועוד שארית {EX_NAME[k]}</>, v: <Sig>{fmtDur(EX[k])}</Sig> },
    { l: 'חלקים', v: <><Num>{m.p} + {ex.p} = {s.pRaw}</Num>{s.pCarry > 0 && <> ← משליכים <Num>1080</Num>: שעה אחת, נשארים <Num>{s.p}</Num></>}</> },
    { l: 'שעות', v: <><Num>{m.h} + {ex.h}{s.pCarry ? ' + 1' : ''} = {s.hRaw}</Num>{s.hCarry > 0 && <> ← משליכים <Num>24</Num>: יום אחד, נשארות <Num>{s.h}</Num></>}</> },
    { l: 'ימים', v: <><Num>{m.d + 1} + {ex.d}{s.hCarry ? ' + 1' : ''} = {s.dRaw + 1}</Num>{s.weeks > 0 && <> ← משליכים <Num>7</Num>, נשאר <Num>{s.d + 1}</Num></>}</>, s: 'ימי השבוע נספרים מ־א׳ (ראשון)' },
    { l: 'המולד הבא', v: <Sig>{fmtMolad(res)}</Sig>, s: <>{DAY_NAME[s.d]}, <Civil t={res} /></>, c: 'final' },
  ];
  const fRow = focus === 'parts' ? 2 : focus === 'hours' ? 3 : focus === 'days' ? 4 : focus === 'result' ? 5 : undefined;
  return (
    <>
      <Viz>
        <WeekWheel markers={[{ x: val(m), cls: 'moon', label: 'המולד' }, { x: res, cls: 'leap', label: 'הבא' }]} arcs={[{ from: val(m), to: val(m) + EX[k], cls: 'leap' }]}
          center={['+', fmtDur(EX[k]), EX_NAME[k]]} aria="המולד והמולד הבא על גלגל השבוע" />
        <Legend items={[['var(--moon)', 'המולד'], ['var(--leap)', 'אחרי השארית']]} />
      </Viz>
      <Engine title={title} sub="חלקים לשעות, שעות לימים, שבועות משליכים" className={fx(!!focus)}>
        <MoladControl value={m} onChange={setM} />
        {choose && <div className="seg" role="radiogroup" aria-label="איזו שארית">{(Object.keys(EX_NAME) as ExKind[]).map(x => <button key={x} type="button" role="radio" aria-checked={k === x} onClick={() => setKind(x)}>{EX_NAME[x]}</button>)}</div>}
        <Steps rows={rows} focus={fRow} />
      </Engine>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------- 6:10–6:12
/** Nineteen lunar years against nineteen solar years (6:10). */
export function CycleCompare() {
  const lunar = 235 * P_MONTH, solar = 19 * (365 * P_DAY + 6 * P_HOUR);
  return (
    <Engine title="מחזור של 19 שנה" sub="12 פשוטות ו־7 מעוברות, מול 19 שנות חמה">
      <Steps rows={[
        { l: <><Num>12</Num> × שנה פשוטה</>, v: <DHP t={12 * 12 * P_MONTH} /> },
        { l: <><Num>7</Num> × שנה מעוברת</>, v: <DHP t={7 * 13 * P_MONTH} /> },
        { l: <>יחד: <Num>235</Num> חודשים</>, v: <DHP t={lunar} /> },
        { l: <><Num>19</Num> שנות חמה של <Num>365¼</Num> ימים</>, v: <DHP t={solar} /> },
        { l: 'ההפרש', v: <><DHP t={solar - lunar} /> (<Sig>אתפ״ה</Sig>)</>, s: 'כמעט שוות: רק שעה ומעט', c: 'final' },
      ]} />
    </Engine>
  );
}

/** The 19 years of a cycle, leap years marked; the demo year framed (6:11). */
export function CycleBoxes() {
  const yr = useSlideYear(), pos = cyclePos(yr.y);
  return (
    <Engine title="המחזור הקטן" sub="השנים המעוברות: גו״ח י״א י״ד י״ז י״ט">
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="boxes big">
        {Array.from({ length: 19 }, (_, k) => k + 1).map(i => (
          <div key={i} className={`${(LEAP_POS as readonly number[]).includes(i) ? 'lp' : ''} ${i === pos ? 'cur' : ''}`}><span className="num">{i}</span></div>
        ))}
      </div>
      <p className="m0">{yearHeb(yr.y)} היא שנה <Num>{pos}</Num> במחזור <Num>{NUM(Math.floor((yr.y - 1) / 19) + 1)}</Num>: {isLeap(yr.y) ? <strong>מעוברת</strong> : 'פשוטה'}.</p>
    </Engine>
  );
}

/** The cycle's remainder: 12 common + 7 leap remainders, weeks dropped (6:12). */
export function CycleRemainder() {
  return (
    <Engine title="שארית המחזור" sub="מחברים את שאריות 19 השנים">
      <Steps rows={[
        { l: <><Num>12</Num> × <Sig>ד״ח תתע״ו</Sig></>, v: <DHP t={12 * EX.pashut} /> },
        { l: <><Num>7</Num> × <Sig>הכ״א תקפ״ט</Sig></>, v: <DHP t={7 * EX.meubar} /> },
        { l: 'יחד', v: <DHP t={12 * EX.pashut + 7 * EX.meubar} /> },
        { l: 'משליכים שבעה שבעה', v: <Dur t={EX.cycle} />, c: 'final' },
      ]} />
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 6:14–6:15
/** The molad of any year from בהר״ד: cycles, common years, leap years, each by its remainder (6:14). */
export function YearMolad({ focus }: { focus?: 'cycles' | 'years' | 'result' }) {
  const yr = useSlideYear(), { steps, molad } = moladByExcess(yr.y);
  const name = { cycle: 'מחזורים שלמים', pashut: 'שנים פשוטות במחזור שלא נשלם', meubar: 'שנים מעוברות במחזור שלא נשלם', month: 'חודשים' };
  const rows: StepRow[] = [
    { l: 'מתחילים מבהר״ד', v: <Sig>{fmtMolad(BAHRAD)}</Sig> },
    ...steps.map(st => ({ l: <><Num>{NUM(st.count)}</Num> {name[st.kind]} × <Sig>{fmtDur(st.ex)}</Sig></>, v: <Sig>{fmtMolad(st.run)}</Sig>, s: 'אחרי השלכת שבועות' })),
  ];
  rows[rows.length - 1] = { ...rows[rows.length - 1], c: 'final', l: <>{rows[rows.length - 1].l}: מולד תשרי {yearHeb(yr.y)}</> };
  return (
    <>
      <Viz>
        <WeekWheel markers={[{ x: BAHRAD, cls: 'leap', label: 'בהר״ד' }, { x: molad, cls: 'moon', label: 'המולד' }]} center={['מולד תשרי', yearHeb(yr.y), fmtMolad(molad)]} aria="בהר״ד ומולד השנה על גלגל השבוע" />
      </Viz>
      <Engine title="מולד כל שנה" sub="בשאריות, מבהר״ד" className={fx(!!focus)}>
        <div className="ctl"><SlideYear yr={yr} /></div>
        <Steps rows={rows} focus={focus === 'cycles' ? 1 : focus === 'years' ? 2 : focus === 'result' ? rows.length - 1 : undefined} />
        <p className="note">בדיקה: <Sig>{fmtMolad(moladTotal(yr.y))}</Sig> לפי מניין החודשים מבהר״ד.</p>
      </Engine>
    </>
  );
}

/** Every month's molad in a year, from Tishrei on (6:15). */
export function MonthMolads() {
  const yr = useSlideYear(), months = monthsOf(yr.y);
  return (
    <Engine title={<>מולדות {yearHeb(yr.y)}</>} sub="כל חודש: הקודם + אי״ב תשצ״ג">
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="table-wrap">
        <table className="kt">
          <thead><tr><th>חודש</th><th>המולד</th><th>בשעון</th></tr></thead>
          <tbody>
            {months.map(([name], i) => { const t = moladTotal(yr.y, i); return (
              <tr key={i}><td>{name}</td><td><Sig>{fmtMolad(t)}</Sig></td><td><Civil t={t} /></td></tr>
            ); })}
          </tbody>
        </table>
      </div>
    </Engine>
  );
}

