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

const ck = (b: boolean) => (b ? '✓' : '✗');

export function Betu() {
  const [m, setM] = useState({ d: 1, h: 15, p: 589 });
  const [PL, setPL] = useState(true);
  const demo = useStore(s => s.demoYear);
  const examples = useMemo(() => findYears(y => y !== demo && rh(y).rules.includes('betu'), 5400, 6400, 6), [demo]);
  const t = moladParts(m), PP = m.h * P_HOUR + m.p;
  const ap = m.d === 1 && PL && PP >= 15 * P_HOUR + 589 && m.h < 18;
  const ex = PL ? EX.meubar : EX.pashut, t0 = t - (PL ? 13 : 12) * P_MONTH, p0 = rhFrom(t0, PL, false);
  const no = rhFrom(t, false, PL, { betu: true }), yes = rhFrom(t, false, PL);
  const lenNo = no.day - p0.day, lenYes = yes.day - p0.day;
  const ok = (n: number) => (PL ? n >= 383 && n <= 385 : n >= 353 && n <= 355);
  const LenTag = ({ n }: { n: number }) => (ok(n) ? <Tag tone="ok">תקין</Tag> : <Tag tone="bad">אסור</Tag>);

  return (
    <Slide
      kicker="הדחיות · 4 מתוך 4"
      title="בט״ו תקפ״ט אחרי מעוברת"
      text={<>
        <p>אם השנה <strong>שעברה הייתה מעוברת</strong>, והמולד ביום <strong>ב׳</strong> ב־<strong><Num>15</Num> שעות ו־<Num>589</Num> חלקים</strong> או אחרי, ראש השנה נדחה ליום ג׳.</p>
        <h3>למה? כי השנה שעברה הייתה יוצאת קצרה מדי</h3>
        <p>חוזרים <Num>13</Num> חודשים אחורה: <Sig>ט״ו תקפ״ט</Sig> פחות <Sig>ה׳ כ״א תקפ״ט</Sig> = יום ג׳, <strong><Num>18</Num> שעות בדיוק</strong>.</p>
      </>}
      more={<>
        <p>מולד השנה שעברה היה זקן ← רביעי. רביעי אד״ו ← חמישי. מחמישי עד שני: <strong><Num>382</Num> ימים</strong>. שנה מעוברת לא יכולה להיות קצרה מ־<Num>383</Num>.</p>
        <p>דוחים לשלישי, והשנה המעוברת שעברה יוצאת <Num>383</Num>.</p>
      </>}
      stage={<>
        <Viz>
          <WeekWheel
            markers={[{ x: t0, cls: 'leap', label: 'שעברה' }, { x: t, cls: 'moon', label: 'השנה' }]}
            arcs={[{ from: t0, to: t0 + ex, cls: 'leap' }]}
            ticks={[{ x: 1 * P_DAY + 15 * P_HOUR + 589, cls: 'shift' }, { x: 2 * P_DAY + 18 * P_HOUR, cls: 'shift' }]}
            days={dayMark(yes.day)}
            center={['− שנה', fmtDur(ex), ap ? 'בטו תקפט חלה' : 'בטו תקפט לא חלה']} aria="בטו תקפט על גלגל השבוע" />
          <Legend items={[['var(--leap)', 'מולד השנה שעברה'], ['var(--moon)', 'מולד השנה'], ['var(--shift)', 'הקווים: ב׳ ט״ו תקפ״ט וג׳ 18 שעות']]} />
        </Viz>
        <Engine title="בודק בטו תקפט" sub="עם ובלי הדחייה">
          <MoladControl value={m} onChange={setM}
            extras={<label className="chk"><input type="checkbox" checked={PL} onChange={e => setPL(e.target.checked)} />השנה שעברה מעוברת</label>} />
          <Steps rows={[
            { l: 'מולד השנה', v: <Sig>{fmtMolad(t)}</Sig>, s: <Civil t={t} /> },
            { l: 'תנאי בטו תקפט', v: <>יום ב׳ {ck(m.d === 1)} · שעברה מעוברת {ck(PL)} · ט״ו תקפ״ט ומעלה {ck(PP >= 15 * P_HOUR + 589)} · לא מולד זקן {ck(m.h < 18)}</>, c: ap ? 'bad' : '' },
            { l: <>מולד השנה שעברה: − <Sig>{fmtDur(ex)}</Sig></>, v: <Sig>{fmtMolad(t0)}</Sig>, s: <Civil t={t0} /> },
            { l: 'ראש השנה שעבר', v: dayWord(p0.day), s: p0.rules.length ? p0.rules.map(k => RULE_NAME[k]).join(' ← ') : 'בלי דחייה' },
            { l: 'בלי הדחייה: ראש השנה', v: dayWord(no.day) },
            { l: 'אורך השנה שעברה בלי הדחייה', v: <><Num>{lenNo}</Num> ימים <LenTag n={lenNo} /></>, c: ok(lenNo) ? '' : 'bad' },
            { l: ap ? 'עם הדחייה: ראש השנה' : 'הדחייה לא חלה: ראש השנה', v: <>{dayWord(yes.day)} · השנה שעברה <Num>{lenYes}</Num> ימים <LenTag n={lenYes} /></>, c: 'final' },
          ]} />
          <Chips label="שנים שבהן חלה בטו תקפט:" items={examples} onPick={y => { setM(moladOf(y)); setPL(isLeap(y - 1)); }} render={yearHeb} />
        </Engine>
        <OurYear which="betu" />
      </>}
    />
  );
}
