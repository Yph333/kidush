import { useMemo, useState } from 'react';
import { fmtMolad, rh, rhFrom, yearHeb } from '../../engines/calendar';
import { DayBand } from '../../components/DayBand';
import { Term } from '../../components/Glossary';
import { MoladControl, moladParts } from '../../components/MoladControl';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Chips, Civil, Num, Sig } from '../../components/text';
import { dayWord } from '../../lib/format';
import { useStore } from '../../state/store';
import { findYears, moladOf } from './shared';

const ADU = [0, 3, 5];

export function Zaken() {
  const [m, setM] = useState({ d: 1, h: 18, p: 187 });
  const demo = useStore(s => s.demoYear);
  const examples = useMemo(() => findYears(y => rh(y).rules[0] === 'zaken', demo, demo + 40, 6), [demo]);
  const t = moladParts(m), z = m.h >= 18;
  const r = rhFrom(t, false, false, { gatrad: true, betu: true });
  const cand = z ? (m.d + 1) % 7 : m.d;
  const rows: StepRow[] = [
    { l: 'המולד', v: <Sig>{fmtMolad(t)}</Sig>, s: <Civil t={t} /> },
    { l: '18 שעות ומעלה?', v: z ? <>כן: <Num>{m.h}</Num> שעות</> : <>לא: <Num>{m.h}</Num> שעות</>, s: z ? 'אחרי חצות היום: הלבנה לא תיראה הערב' : 'לפני חצות היום: הלבנה תיראה סמוך לשקיעה', c: z ? 'bad' : '' },
  ];
  if (z) rows.push({ l: 'דוחים ליום הבא', v: dayWord(m.d + 1) });
  rows.push({ l: 'האם היום הזה אד״ו?', v: ADU.includes(cand) ? <>כן: {dayWord(cand)} ← דוחים ל{dayWord(cand + 1)}</> : 'לא', c: ADU.includes(cand) ? 'bad' : '' });
  rows.push({ l: 'ראש השנה', v: dayWord(r.day), c: 'final' });

  return (
    <Slide
      kicker="הדחיות · 2 מתוך 4"
      title="מולד זקן"
      text={<>
        <p>אם המולד חל ב־<strong><Num>18</Num> שעות</strong> או אחרי, כלומר מ־<Num>12:00</Num> בצהריים, ראש השנה נדחה ליום הבא. זה <Term k="zaken" />. אם היום הבא הוא אד״ו, נדחה עוד יום.</p>
        <Src cite="קיצור שלחן ערוך, סדר לעשות לוח בקצרה">והשנית, מולד זקן בל תדרש, כגון אם חל המולד בי״ח שעות או אחר י״ח שעות, אין קובעין ראש השנה באותו יום</Src>
      </>}
      more={<>
        <h3>למה?</h3>
        <p>זה שריד מהתקופה שבה קידשו חודש על פי ראייה. הגמרא (ראש השנה כ:) אומרת: מולד לפני חצות היום, הלבנה תיראה סמוך לשקיעה. מולד אחרי חצות, לא תיראה באותו ערב.</p>
        <p>היום הראשון שבו העדים יכלו לראות את הלבנה הוא מחר, והלוח הקבוע שמר על העיקרון הזה.</p>
      </>}
      stage={<>
        <Viz>
          <p className="vt">{dayWord(m.d)}: מ־<Num>18:00</Num> בערב שלפניו עד <Num>18:00</Num></p>
          <DayBand at={m.h + m.p / 1080} label="המולד" th={18} thLabel="18 שעות = 12:00 בצהריים" next={z} />
        </Viz>
        <Engine title="בודק מולד זקן" sub="הכניסו מולד">
          <MoladControl value={m} onChange={setM} />
          <Steps rows={rows} />
          <Chips label="שנים עם מולד זקן:" items={examples} onPick={y => setM(moladOf(y))} render={yearHeb} />
        </Engine>
      </>}
    />
  );
}
