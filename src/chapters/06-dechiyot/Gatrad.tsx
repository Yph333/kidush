import { useMemo, useState } from 'react';
import { EX, P_DAY, P_HOUR, P_MONTH, fmtDur, fmtMolad, isLeap, rh, rhFrom, yearHeb } from '../../engines/calendar';
import { MoladControl, moladParts } from '../../components/MoladControl';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Chips, Civil, Legend, Num, Sig, Tag } from '../../components/text';
import { WeekWheel, dayMark } from '../../components/WeekWheel';
import { RULE_NAME, dayWord } from '../../lib/format';
import { OurYear } from './OurYear';
import { useStore } from '../../state/store';
import { findYears, moladOf } from './shared';

const okLen = (n: number, L: boolean) => (L ? n >= 383 && n <= 385 : n >= 353 && n <= 355);
const LenTag = ({ n, L }: { n: number; L: boolean }) => (okLen(n, L) ? <Tag tone="ok">תקין</Tag> : <Tag tone="bad">אסור</Tag>);
const ck = (b: boolean) => (b ? '✓' : '✗');

export function Gatrad() {
  const [m, setM] = useState({ d: 2, h: 9, p: 204 });
  const [L, setL] = useState(false);
  const demo = useStore(s => s.demoYear);
  const examples = useMemo(() => findYears(y => y !== demo && rh(y).rules.includes('gatrad'), 5600, 6100, 6), [demo]);
  const t = moladParts(m), PP = m.h * P_HOUR + m.p;
  const ap = m.d === 2 && !L && PP >= 9 * P_HOUR + 204 && m.h < 18;
  const no = rhFrom(t, L, false, { gatrad: true }), yes = rhFrom(t, L, false);
  const ex = L ? EX.meubar : EX.pashut, t2 = t + (L ? 13 : 12) * P_MONTH, n2 = rhFrom(t2, false, L);
  const lenNo = n2.day - no.day, lenYes = n2.day - yes.day;

  return (
    <Slide
      kicker="הדחיות · 3 מתוך 4"
      title="ג״ט ר״ד בשנה פשוטה"
      text={<>
        <p>בשנה <strong>פשוטה</strong>, אם המולד ביום <strong>ג׳</strong> ב־<strong><Num>9</Num> שעות ו־<Num>204</Num> חלקים</strong> או אחרי, ראש השנה נדחה. יום ד׳ הוא אד״ו, ולכן בפועל ליום ה׳.</p>
        <h3>למה? כי השנה הייתה יוצאת ארוכה מדי</h3>
        <p>מוסיפים שנה פשוטה: <Sig>ט׳ ר״ד</Sig> + <Sig>ח׳ תתע״ו</Sig> = <strong><Num>18</Num> שעות בדיוק</strong>. מולד השנה הבאה ייפול בשבת, <Num>18</Num> שעות ומעלה.</p>
      </>}
      more={<>
        <p>זה מולד זקן ← ראשון. ראשון הוא אד״ו ← שני. משלישי עד שני: <strong><Num>356</Num> ימים</strong>. שנה פשוטה מוגבלת ל־<Num>355</Num>.</p>
        <p>דוחים כבר עכשיו, ליום ה׳, והשנה יוצאת <Num>354</Num>.</p>
      </>}
      stage={<>
        <Viz>
          <WeekWheel
            markers={[{ x: t, cls: 'moon', label: 'השנה' }, { x: t2, cls: 'leap', label: 'הבאה' }]}
            arcs={[{ from: t, to: t + ex, cls: 'leap' }]}
            ticks={[{ x: 2 * P_DAY + 9 * P_HOUR + 204, cls: 'shift' }, { x: 6 * P_DAY + 18 * P_HOUR, cls: 'shift' }]}
            days={dayMark(yes.day)}
            center={['+ שנה', fmtDur(ex), ap ? 'גטר״ד חלה' : 'גטר״ד לא חלה']} aria="גטר״ד על גלגל השבוע" />
          <Legend items={[['var(--moon)', 'מולד השנה'], ['var(--leap)', 'מולד השנה הבאה'], ['var(--shift)', 'הקווים: ג׳ ט׳ ר״ד ושבת 18 שעות']]} />
        </Viz>
        <Engine title="בודק גטר״ד" sub="עם ובלי הדחייה">
          <MoladControl value={m} onChange={setM}
            extras={<label className="chk"><input type="checkbox" checked={L} onChange={e => setL(e.target.checked)} />השנה מעוברת</label>} />
          <Steps rows={[
            { l: 'מולד השנה', v: <Sig>{fmtMolad(t)}</Sig>, s: <Civil t={t} /> },
            { l: 'תנאי גטר״ד', v: <>יום ג׳ {ck(m.d === 2)} · שנה פשוטה {ck(!L)} · ט׳ ר״ד ומעלה {ck(PP >= 9 * P_HOUR + 204)} · לא מולד זקן {ck(m.h < 18)}</>, c: ap ? 'bad' : '' },
            { l: 'בלי הדחייה: ראש השנה', v: dayWord(no.day), s: no.rules.length ? 'אחרי ' + no.rules.map(k => RULE_NAME[k]).join(', ') : '' },
            { l: <>מולד השנה הבאה: + <Sig>{fmtDur(ex)}</Sig></>, v: <Sig>{fmtMolad(t2)}</Sig>, s: <Civil t={t2} /> },
            { l: 'ראש השנה הבא', v: dayWord(n2.day), s: n2.rules.length ? n2.rules.map(k => RULE_NAME[k]).join(' ← ') : 'בלי דחייה' },
            { l: 'אורך השנה בלי הדחייה', v: <><Num>{lenNo}</Num> ימים <LenTag n={lenNo} L={L} /></>, c: okLen(lenNo, L) ? '' : 'bad' },
            { l: ap ? 'עם הדחייה: ראש השנה' : 'הדחייה לא חלה: ראש השנה', v: <>{dayWord(yes.day)} · השנה <Num>{lenYes}</Num> ימים <LenTag n={lenYes} L={L} /></>, c: 'final' },
          ]} />
          <Chips label="שנים שבהן חלה גטר״ד:" items={examples} onPick={y => { setM(moladOf(y)); setL(isLeap(y)); }} render={yearHeb} />
        </Engine>
        <OurYear which="gatrad" />
      </>}
    />
  );
}
