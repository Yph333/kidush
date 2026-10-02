import { BAHRAD, EX, LEAP_POS, P_MONTH, fmtMolad, moladTotal, monthsBeforeSteps, yearHeb } from '../../engines/calendar';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Num, Sig } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM } from '../../lib/format';

const LEAPS: readonly number[] = LEAP_POS;

export function Bahrad() {
  const yr = useSlideYear();
  const y = yr.y, m = monthsBeforeSteps(y);
  return (
    <Slide
      kicker="הלוח הקבוע · 1"
      title="בהר״ד: מולד האפס"
      text={<>
        <p>השנים נספרות <strong>לבריאת העולם</strong>. שנה א׳ מתחילה בתשרי שלפני בריאת האדם.</p>
        <p>מולד תשרי של שנה א׳ חושב לאחור, ונקרא גם ״מולד תוהו״: <strong>יום ב׳, <Num>5</Num> שעות, <Num>204</Num> חלקים</strong>. בסימן: <Sig>בהר״ד</Sig>. בשעון: יום ראשון בערב, <Num>23:11</Num> ו־<Num>6</Num> חלקים.</p>
        <p>מכאן כל החשבון: <strong>כמה חודשים עברו מבהר״ד</strong> עד המולד שמעניין אותנו? זה המספר היחיד שצריך.</p>
      </>}
      more={<p>שנה פשוטה אחריו מגיע מולד <Sig>ויה״ד</Sig>: יום ו׳, <Num>14</Num> שעות, <Num>0</Num> חלקים (<Num>8:00</Num> בבוקר), היום שבו נברא אדם.</p>}
      stage={<>
        <Viz>
          <WeekWheel
            markers={[{ x: BAHRAD, cls: 'moon', label: 'בהר״ד' }, { x: BAHRAD + 12 * P_MONTH, cls: 'leap', label: 'ויה״ד' }]}
            arcs={[{ from: BAHRAD, to: BAHRAD + EX.pashut, cls: 'leap' }]}
            center={['שנה פשוטה', 'ד׳ ח׳ תתע״ו', 'מבהר״ד לויה״ד']} aria="בהר״ד וויה״ד על גלגל השבוע" />
        </Viz>
        <Engine title="כמה חודשים עברו" sub="מבהר״ד עד תשרי של השנה">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <Viz plain className="explore-only">
            <p className="vt">המחזור הנוכחי (מספר <Num>{NUM(m.cycles + 1)}</Num>)</p>
            <div className="boxes">
              {Array.from({ length: 19 }, (_, k) => k + 1).map(i => (
                <div key={i} className={`${i <= m.rem ? 'done' : ''} ${LEAPS.includes(i) ? 'lp' : ''} ${i === m.rem + 1 ? 'cur' : ''}`}><span className="num">{i}</span></div>
              ))}
            </div>
            <p className="note">אפור: שנים שעברו · כחול: מעוברות שעברו · מסגרת: השנה</p>
          </Viz>
          <Steps rows={[
            { l: 'שנים שלמות שעברו', v: <><Num>{NUM(m.years)}</Num> שנים</>, s: <>השנה {yearHeb(y)} עדיין לא עברה, לכן <Num>{NUM(y)}</Num> − <Num>1</Num></> },
            { l: 'מחלקים למחזורים של 19', v: <><Num>{`${NUM(m.years)} ÷ 19 = ${NUM(m.cycles)}`}</Num> מחזורים, שארית <Num>{m.rem}</Num> שנים</> },
            { l: 'חודשים במחזורים השלמים', v: <Num>{`${NUM(m.cycles)} × 235 = ${NUM(m.cycles * 235)}`}</Num> },
            { l: <>חודשים ב־<Num>{m.rem}</Num> השנים שבמחזור הנוכחי</>, v: <><Num>{m.common}</Num> פשוטות × <Num>12</Num> + <Num>{m.leap}</Num> מעוברות × <Num>13</Num> = <Num>{m.common * 12 + m.leap * 13}</Num></> },
            { l: 'סך הכול חודשים מבהר״ד', v: <Num>{NUM(m.total)}</Num>, s: <>מולד תשרי {yearHeb(y)} = בהר״ד + <Num>{NUM(m.total)}</Num> חודשים = <Sig>{fmtMolad(moladTotal(y))}</Sig></>, c: 'final' },
          ]} />
        </Engine>
      </>}
    />
  );
}
