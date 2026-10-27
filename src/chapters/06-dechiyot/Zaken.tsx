import { useEffect, useMemo, useState } from 'react';
import { fmtMolad, rh, rhFrom, yearHeb } from '../../engines/calendar';
import { DayBand } from '../../components/DayBand';
import { Guide, useGuide } from '../../components/Guide';
import { Term } from '../../components/Glossary';
import { MoladControl, moladParts } from '../../components/MoladControl';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Chips, Civil, Num, Sig } from '../../components/text';
import { ZAKEN as GUIDE, type ZakenFocus } from '../../content/guides/dechiyot';
import { dayWord } from '../../lib/format';
import { useStore } from '../../state/store';
import { OurYear } from './OurYear';
import { findYears, moladOf } from './shared';

const ADU = [0, 3, 5];

/** guide steps that load a molad into the checker, and which row they point at */
const DEMO: Partial<Record<ZakenFocus, { m: { d: number; h: number; p: number }; row?: 'check' | 'adu' | 'rh' }>> = {
  clock: { m: { d: 2, h: 12, p: 0 } },
  rule: { m: { d: 1, h: 20, p: 0 }, row: 'check' },
  reason: { m: { d: 1, h: 20, p: 0 }, row: 'check' },
  adu: { m: { d: 2, h: 19, p: 0 }, row: 'adu' },
  zih: { m: { d: 6, h: 18, p: 0 }, row: 'rh' },
};

export function Zaken() {
  const [m, setM] = useState({ d: 1, h: 18, p: 187 });
  const demo = useStore(s => s.demoYear);
  const examples = useMemo(() => findYears(y => rh(y).rules[0] === 'zaken', demo + 1, demo + 40, 6), [demo]);
  const g = useGuide(GUIDE);
  const demoStep = g.focus && DEMO[g.focus];
  useEffect(() => { if (demoStep) setM(demoStep.m); }, [demoStep]);
  const f = (on: boolean) => (on ? 'guide-focus' : '');
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
      guide={<Guide g={g} />}
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
        <Viz className={f(g.focus === 'clock' || g.focus === 'rule')}>
          <p className="vt">{dayWord(m.d)}: מ־<Num>18:00</Num> בערב שלפניו עד <Num>18:00</Num></p>
          <DayBand at={m.h + m.p / 1080} label="המולד" th={18} thLabel="18 שעות = 12:00 בצהריים" next={z} />
        </Viz>
        <Engine title="בודק מולד זקן" sub="הכניסו מולד" className={f(!!demoStep?.row || g.focus === 'try')}>
          <MoladControl value={m} onChange={setM} />
          <Steps rows={rows} focus={demoStep?.row === 'check' ? 1 : demoStep?.row === 'adu' ? rows.length - 2 : demoStep?.row === 'rh' ? rows.length - 1 : undefined} />
          <Chips label="שנים עם מולד זקן:" items={examples} onPick={y => setM(moladOf(y))} render={yearHeb} />
        </Engine>
        <OurYear which="zaken" />
      </>}
    />
  );
}
