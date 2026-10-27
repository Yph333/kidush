import { useState } from 'react';
import {
  BAHRAD, EX, P_MONTH, P_WEEK, civil, fmtDur, fmtMolad, moladByExcess, moladTotal, monthsBefore, monthsOf, weekParts, yearHeb,
} from '../../engines/calendar';
import { Term } from '../../components/Glossary';
import { GuessGate, useGateDone } from '../../components/GuessGate';
import { gateKey } from '../../content/gates';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DHP, Civil, Num, Sig } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM } from '../../lib/format';

const KIND = { cycle: 'מחזורים קטנים', pashut: 'שנים פשוטות', meubar: 'שנים מעוברות', month: 'חודשים' } as const;

export function Excess() {
  const yr = useSlideYear();
  const y = yr.y;
  const months = monthsOf(y);
  const [miRaw, setMi] = useState(0);
  const mi = Math.min(miRaw, months.length - 1);
  const name = months[mi][0];
  const { steps, molad } = moladByExcess(y, mi);
  const direct = moladTotal(y, mi);
  // Tishrei is a step on the year path; other months get their own gate
  const key = gateKey(mi === 0 ? 'molad-day' : `molad-day-${mi}`, y), done = useGateDone(key);

  const rows: StepRow[] = [
    { l: 'מתחילים מבהר״ד', v: <Sig>{fmtMolad(BAHRAD)}</Sig> },
    ...steps.map(s => ({
      l: <>{s.kind === 'month' ? `חודשים מתשרי עד ${name}` : KIND[s.kind]}: <Num>{NUM(s.count)}</Num> × <Sig>{fmtDur(s.ex)}</Sig></>,
      v: <>= <DHP t={s.prod} /> ← בלי שבועות: <Sig>{fmtDur(s.prod % P_WEEK)}</Sig></>,
      s: <>סכום עד כאן: <Sig>{fmtMolad(s.run)}</Sig></>,
    })),
    {
      l: `מולד ${name} ${yearHeb(y)}`, v: <Sig>{fmtMolad(molad)}</Sig>, c: 'final',
      s: <><Civil t={molad} /> · בדיקה ישירה: <Num>{NUM(monthsBefore(y) + mi)}</Num> חודשים × <Num>{NUM(P_MONTH)}</Num> חלקים {weekParts(direct) === molad ? '✓ זהה' : '✗'}</>,
    },
  ];

  return (
    <Slide
      kicker="הלוח הקבוע · 2"
      title="חישוב בעודפים"
      text={<>
        <p>במקום לכפול עשרות אלפי חודשים, מחברים רק את <Term k="odef">מה שנשאר</Term> אחרי שבועות שלמים:</p>
        <table className="xt">
          <tbody>
            <tr><td>חודש</td><td className="sig">{fmtDur(EX.month)}</td></tr>
            <tr><td>שנה פשוטה (<Num>12</Num> חודשים)</td><td className="sig">{fmtDur(EX.pashut)}</td></tr>
            <tr><td>שנה מעוברת (<Num>13</Num> חודשים)</td><td className="sig">{fmtDur(EX.meubar)}</td></tr>
            <tr><td>מחזור קטן (<Num>235</Num> חודשים)</td><td className="sig">{fmtDur(EX.cycle)}</td></tr>
          </tbody>
        </table>
        <p>מתחילים מבהר״ד, מוסיפים מחזורים, שנים וחודשים, וכל פעם שהסכום עובר <Num>7</Num> ימים מורידים שבוע.</p>
      </>}
      more={<Src cite="קיצור שלחן ערוך, סדר לעשות לוח בקצרה">אם כן הרי שמונה ימים; צא מהן שבעה שכלים בשבוע, אם כן הרי המולד א׳ י״א שי״ד</Src>}
      stage={<>
        <Viz>
          <WeekWheel markers={done ? [{ x: BAHRAD, cls: 'leap', label: 'בהר״ד' }, { x: molad, cls: 'moon', label: 'מולד' }] : [{ x: BAHRAD, cls: 'leap', label: 'בהר״ד' }]}
            center={['מולד ' + name, done ? fmtMolad(molad) : '?', yearHeb(y)]} aria="מולד החודש על גלגל השבוע" />
        </Viz>
        <Engine title="מנוע המולד" sub="לכל חודש בכל שנה">
          <div className="ctl">
            <SlideYear yr={yr} />
            <label className="fld">חודש
              <select aria-label="חודש" value={mi} onChange={e => setMi(+e.target.value)}>
                {months.map((m, i) => <option key={m[0]} value={i}>{m[0]}</option>)}
              </select>
            </label>
          </div>
          <GuessGate gateKey={key} kind={{ type: 'day' }} answer={civil(molad).wd}
            question={<>באיזה יום בשבוע יחול מולד {name} {yearHeb(y)}?</>}
            explain={<>המולד: <Sig>{fmtMolad(molad)}</Sig>, <Civil t={molad} />.</>}>
            <Steps rows={rows} />
          </GuessGate>
        </Engine>
      </>}
    />
  );
}
