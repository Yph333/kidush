// Visuals for chapters 9–10: the tekufot of Shmuel and of Rav Adda. All arithmetic comes from engines/calendar.

import { type ReactNode, useMemo, useState } from 'react';
import {
  CYCLE_EXCESS, DAY_LETTER, DAY_NAME, P_DAY, P_HOUR, P_MONTH, RAV_ADDA_YEAR, SHMUEL_YEAR, TEKUFA_LEAD, YEAR_EXCESS,
  hebDate, isLeap, tekufaDay, tekufaSteps, tekufotShmuel, yearHeb,
} from '../../engines/calendar';
import { Orbit2D, seasonProps, seasonRows } from '../../chapters/04-shana/Seasons';
import { Ring } from '../../components/Ring';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Civil, Num, Tag } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { YearControl } from '../../components/YearControl';
import { NUM } from '../../lib/format';
import type { TekufaKind } from '../../scenes/shared';

const fx = (on: boolean) => (on ? 'guide-focus' : '');
const loadSeasons = () => import('../../scenes/earthSeasons').then(m => m.default);
/** The Rambam's examples: year 4930 (9:5, 9:7). */
export const EXAMPLE_YEAR = 4930;
export type Who = 'shmuel' | 'ravAdda';
const WHO: Record<Who, string> = { shmuel: 'שמואל', ravAdda: 'רב אדא' };

/** Parts (possibly with rega'im) as days, hours, parts and rega'im. Display only. */
export function Span({ t }: { t: number }) {
  const neg = t < 0, a = Math.abs(t), whole = Math.floor(a + 1e-6), rg = Math.round((a - whole) * 76);
  const d = Math.floor(whole / P_DAY), h = Math.floor((whole % P_DAY) / P_HOUR), p = whole % P_HOUR;
  const bits: ReactNode[] = [];
  if (d) bits.push(<><Num>{NUM(d)}</Num> ימים</>);
  if (h || !d) bits.push(<><Num>{h}</Num> שעות</>);
  bits.push(<><Num>{p}</Num> חלקים</>);
  if (rg) bits.push(<><Num>{rg}</Num> רגעים</>);
  return <>{neg && '−'}{bits.map((b, i) => <span key={i}>{i ? ', ' : ''}{b}</span>)}</>;
}

/** A year picker local to the halacha, starting at the Rambam's example year. */
export function useYear(y0 = EXAMPLE_YEAR) {
  const [st, setSt] = useState({ base: y0, y: y0 });
  const y = st.base === y0 ? st.y : y0, setY = (v: number) => setSt({ base: y0, y: v });
  return { y, setY, control: <div className="ctl">
    <YearControl value={y} onChange={setY} label="שנה" />
    {y !== y0 && <button type="button" className="back-demo" onClick={() => setY(y0)}>חזרה ל{yearHeb(y0)}</button>}
  </div> };
}

const dayTxt = (day: number) => { const h = hebDate(day); return <>{h.d} ב{h.name} {yearHeb(h.y)}</>; };

// ---------------------------------------------------------------------------------------------------- years

/** The solar year of Shmuel and of Rav Adda against twelve and 235 lunar months (9:1–2, 10:1). */
export function YearCompare({ hl }: { hl?: 'year' | 'excess' | 'cycle' | 'quarter' }) {
  const rows: StepRow[] = (['shmuel', 'ravAdda'] as const).flatMap(w => [
    { l: <>שנת החמה לפי {WHO[w]}</>, v: <Span t={w === 'shmuel' ? SHMUEL_YEAR : RAV_ADDA_YEAR} /> },
    { l: <>יותר משנים עשר חודשים</>, v: <Span t={YEAR_EXCESS[w]} />, s: w === 'shmuel' ? 'סימן: י׳ כ״א ר״ד' : 'סימן: יכ״א קכ״א מ״ח' },
    { l: <><Num>19</Num> שנות חמה יותר מ־<Num>235</Num> חודשים</>, v: CYCLE_EXCESS[w] > 1e-6 ? <Span t={CYCLE_EXCESS[w]} /> : <strong>כלום: שווים בדיוק</strong> },
    { l: <>בין תקופה לתקופה (רבע שנה)</>, v: <Span t={(w === 'shmuel' ? SHMUEL_YEAR : RAV_ADDA_YEAR) / 4} />, c: w === 'ravAdda' ? 'final' : undefined },
  ]);
  const at = { year: [0, 4], excess: [1, 5], cycle: [2, 6], quarter: [3, 7] } as const;
  return (
    <Engine title="שנת החמה: שמואל ורב אדא" sub="רגע = 1/76 של חלק" className={fx(!!hl)}>
      <Steps rows={rows} focus={hl ? at[hl][0] : undefined} />
      {hl && <p className="note">וגם אצל רב אדא: שורה <Num>{at[hl][1] + 1}</Num>.</p>}
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- the 3D seasons

/** The earth around the sun with the tekufot of one year: Shmuel, Rav Adda and the true ones. */
export function SeasonsScene({ y, kinds = ['true', 'shmuel', 'ravAdda'], at = 2, note }: { y: number; kinds?: TekufaKind[]; at?: number; note?: ReactNode }) {
  const rows = useMemo(() => seasonRows(y), [y]);
  const [k, setK] = useState(at);
  const now = kinds.includes('true') && kinds.length === 1 ? rows[k].tru : kinds[0] === 'ravAdda' ? rows[k].ra : rows[k].sh;
  const props = useMemo(() => seasonProps(rows, now, kinds), [rows, now, kinds]);
  return (
    <Viz>
      <Scene3D load={loadSeasons} props={props} label="כדור הארץ במסלולו סביב השמש, עם ציר נוטה והתקופות"
        views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'earth', label: 'קרוב לכדור הארץ' }]}
        fallback={<Orbit2D p={props} />} />
      <div className="seg" role="group" aria-label="איזו תקופה">
        {rows.map((r, i) => <button key={r.name} type="button" aria-pressed={k === i} onClick={() => setK(i)}>{r.name}</button>)}
      </div>
      <p className="note">{note ?? <>ירוק: התקופה האמיתית. אדום: שמואל. תכלת: רב אדא. השנה: {yearHeb(y)}. המרחקים לא בקנה מידה.</>}</p>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- 9:4, 10:5

export type CalcStep = 'cycles' | 'years' | 'lead' | 'months' | 'molad' | 'result';

/** Tekufat Nisan by the excess: cycles, years, less the lead of year one, drop months, add to molad Nisan. */
export function TekufaCalc({ who, focus, y: y0 }: { who: Who; focus?: CalcStep; y?: number }) {
  const yr = useYear(y0), S = tekufaSteps(yr.y, who), first = S.years === 0;
  const rows: StepRow[] = [
    { l: <>מחזורים שלמים: <Num>{NUM(S.cycles)}</Num> × <Span t={CYCLE_EXCESS[who]} /></>, v: who === 'ravAdda' ? 'אין תוספת' : <Span t={S.cycles * CYCLE_EXCESS[who]} />, s: <>שנה <Num>{S.years + 1}</Num> במחזור <Num>{NUM(S.cycles + 1)}</Num></> },
    { l: <>שנים גמורות במחזור: <Num>{S.years}</Num> × <Span t={YEAR_EXCESS[who]} /></>, v: <Span t={S.years * YEAR_EXCESS[who]} />, s: <>יחד: <Span t={S.sum} /></> },
    { l: <>גורעים את התקופה הראשונה: <Span t={TEKUFA_LEAD[who]} /></>, v: <Span t={S.less} />, s: S.less < 0 ? 'פחות מאפס: התקופה לפני המולד' : undefined },
    { l: 'משליכים חודשי לבנה', v: <><Num>{S.months}</Num> חודשים</>, s: <>נשאר: <Span t={S.rem} /></> },
    { l: <>מולד ניסן {yearHeb(yr.y)}</>, v: <Civil t={S.moladNisan} />, s: dayTxt(Math.floor(S.moladNisan / P_DAY)) },
    { l: <>תקופת ניסן לפי {WHO[who]}</>, v: <Civil t={Math.floor(S.tekufa)} />, s: <>{dayTxt(Math.floor(S.tekufa / P_DAY))}{S.before && <> · השארית קרובה לחודש שלם: התקופה <strong>לפני</strong> מולד ניסן, ב־<Span t={P_MONTH - S.rem} /></>}</>, c: 'final' },
  ];
  const at: Record<CalcStep, number> = { cycles: 0, years: 1, lead: 2, months: 3, molad: 4, result: 5 };
  return (
    <Engine title={<>תקופת ניסן לפי {WHO[who]}</>} sub={who === 'shmuel' ? 'רמב״ם ט, ד' : 'רמב״ם י, ה'} className={fx(!!focus)}>
      {yr.control}
      {first && who === 'ravAdda' && <p className="note">שנה ראשונה של מחזור: התקופה <Span t={TEKUFA_LEAD.ravAdda} /> לפני מולד ניסן (י, ג).</p>}
      <Steps rows={rows} focus={focus ? at[focus] : undefined} />
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 9:4–5 (weekday)

export type WeekStep = 'great' | 'rem' | 'add3' | 'four';

/** Shmuel's tekufot on the week: 28-year cycle, a day and six hours a year, from the start of Wednesday night. */
export function TekufaWeek({ focus, y: y0 }: { focus?: WeekStep; y?: number }) {
  const yr = useYear(y0), T = tekufotShmuel(yr.y), n = T.year;
  const hTxt = (H: number) => { const d = Math.floor(H / 24) % 7, h = H - Math.floor(H / 24) * 24, night = h < 12; return <>{night ? 'ליל' : 'יום'} {DAY_LETTER[d]}׳, <Num>{`${Math.floor(h % 12)}${h % 1 ? '½' : ''}`}</Num> שעות {night ? 'בלילה' : 'ביום'}</>; };
  const four = [['ניסן', T.nisan], ['תמוז', T.nisan + 7.5], ['תשרי', T.nisan + 15], ['טבת', T.nisan + 22.5]] as const;
  const rows: StepRow[] = [
    { l: <>שנים גמורות: <Num>{NUM(yr.y - 1)}</Num>, משליכים <Num>28</Num></>, v: <>נשארו <Num>{n - 1}</Num></>, s: <>מחזור גדול <Num>{NUM(T.cycle)}</Num></> },
    { l: <>לכל שנה יום ו־<Num>6</Num> שעות</>, v: <><Num>{n - 1}</Num> × <Num>1</Num> יום <Num>6</Num> שעות = <Num>{((n - 1) * 30) / 24 | 0}</Num> ימים <Num>{((n - 1) * 30) % 24}</Num> שעות</> },
    { l: <>מוסיפים <Num>3</Num> (התקופה הראשונה בתחילת ליל רביעי), משליכים <Num>7</Num></>, v: <Num>{`${Math.floor(T.nisan / 24)} ימים ${T.nisan % 24} שעות`}</Num>, s: 'מונים מתחילת ליל ראשון' },
    ...four.map(([m, H], i) => ({ l: `תקופת ${m}${i ? ' (+ 7½ שעות)' : ''}`, v: hTxt(H), c: i === 0 ? 'final' as const : undefined })),
  ];
  const at: Record<WeekStep, number> = { great: 0, rem: 1, add3: 2, four: 3 };
  return <>
    <Viz>
      <div className="pair">
        <Ring n={28} cls={i => (i === 1 ? 'rm' : 'rp')} cur={n} center={['מחזור גדול ' + NUM(T.cycle), `שנה ${n}`, n === 1 ? 'תחילת ליל רביעי' : '']} aria="מחזור של 28 שנה" />
        <WeekWheel markers={four.map(([m, H], i) => ({ x: Math.round(H * P_HOUR) % (7 * P_DAY), cls: i === 0 ? 'moon' as const : 'leap' as const, label: m }))} center={['תקופות', yearHeb(yr.y), '']} aria="ארבע התקופות על גלגל השבוע" />
      </div>
    </Viz>
    <Engine title="באיזה יום ובאיזו שעה" sub="רמב״ם ט, ד–ה (שמואל)" className={fx(!!focus)}>
      {yr.control}
      <Steps rows={rows} focus={focus ? at[focus] : undefined} />
    </Engine>
  </>;
}

/** The only hours a tekufa can fall on (9:4), on a 24-hour dial per tekufa. */
export function TekufaHours({ hl }: { hl?: number }) {
  const list = [['ניסן', [0, 6]], ['תמוז', [1.5, 7.5]], ['תשרי', [3, 9]], ['טבת', [4.5, 10.5]]] as const;
  const W = 120, c = 60, R = 46;
  const dot = (h: number) => { const a = (h / 24) * 2 * Math.PI - Math.PI / 2; return [c + R * Math.cos(a), c + R * Math.sin(a)]; };
  return (
    <Viz className={fx(hl !== undefined)}>
      <div className="hours4">
        {list.map(([m, hs], i) => (
          <figure key={m} className={hl === i ? 'hl' : ''}>
            <svg viewBox={`-26 0 ${W + 52} ${W}`} direction="ltr" role="img" aria-label={`תקופת ${m}: ${hs.join(' או ')} שעות, ביום או בלילה`}>
              <circle cx={c} cy={c} r={R} fill="none" stroke="var(--c-text-3)" />
              <path d={`M ${c} ${c - R} A ${R} ${R} 0 0 1 ${c} ${c + R}`} fill="none" stroke="var(--c-text-2)" strokeWidth="6" opacity=".35" />
              <text x={c + R + 4} y={c - 2} fontSize="8" fill="var(--c-text-3)">לילה</text>
              <text x={c - R - 4} y={c - 2} textAnchor="end" fontSize="8" fill="var(--c-text-3)">יום</text>
              {[...hs, hs[0] + 12, hs[1] + 12].map(h => { const [x, y] = dot(h); return <circle key={h} cx={x} cy={y} r="5" fill={i === 0 ? 'var(--c-moon)' : 'var(--c-leap)'} />; })}
              <text x={c} y={c + 4} fontSize="12" textAnchor="middle" fill="var(--c-text)">{m}</text>
            </svg>
            <figcaption><Num>{hs[0]}</Num> או <Num>{hs[1]}</Num> שעות</figcaption>
          </figure>
        ))}
      </div>
      <p className="note">כל עיגול הוא יממה: למעלה שש בערב (תחילת הלילה), מימין הלילה, למטה שש בבוקר, משמאל היום. לכל תקופה ארבע נקודות אפשריות, שתיים בלילה ושתיים ביום.</p>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- 9:6–8 (day of the month)

export type DayStep = 'years' | 'mod' | 'land' | 'add' | 'result';

/** The day of the month of tekufat Nisan, the short way (9:6–8). */
export function TekufaDay({ focus, y: y0 }: { focus?: DayStep; y?: number }) {
  const yr = useYear(y0), D = tekufaDay(yr.y);
  const leap = isLeap(yr.y), ok = D.actual.name === D.from && D.actual.d === D.day;
  const rows: StepRow[] = [
    { l: <>שנים גמורות במחזור: <Num>{D.years}</Num>, לכל שנה <Num>11</Num> יום, ועוד <Num>7</Num></>, v: <Num>{`${D.years} × 11 + 7 = ${D.days}`}</Num> },
    { l: <>משליכים <Num>30</Num></>, v: <>נשארו <Num>{D.rem}</Num></> },
    { l: <>מונים <Num>{D.rem}</Num> ימים מראש חודש {D.from} (יום {DAY_NAME[D.startWd]})</>, v: <>יום {DAY_NAME[D.landWd]}</> },
    { l: <>התקופה ביום {DAY_NAME[D.tekWd]} (ט, ד); מוסיפים יום אחר יום</>, v: <>+<Num>{D.added}</Num></>, s: D.added > 3 ? <Tag tone="bad">יותר משלושה: ״פלא גדול״ (ט, ח)</Tag> : undefined },
    { l: 'תקופת ניסן, לפי הרמב״ם', v: <>{D.day > 29 && D.from === 'אדר ב׳' ? <>{D.day} ב{D.from} (כלומר {D.day - 29} בניסן)</> : <>{D.day} ב{D.from}</>}</>, s: ok ? <Tag tone="ok">כמו החשבון המדויק</Tag> : <>בחשבון המדויק (ט, ג): {D.actual.d} ב{D.actual.name}</>, c: D.leap ? undefined : 'final' },
    ...(D.leap ? [{
      l: <><Tag tone="leap">תוספת: חשבון לשנה מעוברת</Tag> {D.leap.shifted ? <>החשבון יצא בחציו הראשון של אדר שני: התקופה ארבעה שבועות אחר כך, באותו יום בשבוע</> : <>ממשיכים למנות מאדר שני אל ניסן</>}</>,
      v: <>{D.leap.d} ב{D.leap.name}</>,
      s: D.leap.name === D.actual.name && D.leap.d === D.actual.d ? <Tag tone="ok">כמו החשבון המדויק</Tag> : <>בחשבון המדויק: {D.actual.d} ב{D.actual.name}</>,
      c: 'final' as const,
    }] : []),
  ];
  const at: Record<DayStep, number> = { years: 0, mod: 1, land: 2, add: 3, result: 4 };
  return (
    <Engine title="בכמה בחודש" sub="רמב״ם ט, ו–ח (שמואל)" className={fx(!!focus)}>
      {yr.control}
      <Steps rows={rows} focus={focus ? at[focus] : undefined} />
      {leap && <p className="note">שנה מעוברת: הרמב״ם כותב למנות מראש חודש אדר שני. כשהתקופה נופלת בסוף אדר שני, החשבון שלו יוצא בדיוק. כשהיא נופלת בתחילת ניסן, החשבון נופל על אותו יום בשבוע, ארבעה שבועות לפניה. התוספת שבשורה האחרונה היא שלנו, לא לשון הרמב״ם: בשנה מעוברת התקופה בין אמצע אדר שני לאמצע ניסן (ראו ד, ב), ולכן תוצאה בחציו הראשון של אדר שני פירושה ניסן. השוואה לחשבון המדויק: ט, ג. פירוט: docs/VERIFICATION.md.</p>}
    </Engine>
  );
}
