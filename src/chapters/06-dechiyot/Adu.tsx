import { useMemo, useState } from 'react';
import { DAY_NAME, P_DAY, rh, yearHeb } from '../../engines/calendar';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Chips, Legend, Tag } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { dayWord } from '../../lib/format';
import { useStore } from '../../state/store';
import { findYears } from './shared';

const ADU = [0, 3, 5];

export function Adu() {
  const [d, setD] = useState(3);
  const demo = useStore(s => s.demoYear);
  const examples = useMemo(() => findYears(y => { const r = rh(y); return r.rules.length === 1 && r.rules[0] === 'adu'; }, demo, demo + 60, 6), [demo]);
  // Yom Kippur is 10 Tishrei (9 days later), Hoshana Rabba 21 Tishrei (20 days later)
  const yk = (d + 9) % 7, hr = (d + 20) % 7, bad = ADU.includes(d);
  const ykBad = yk === 5 || yk === 0, hrBad = hr === 6;
  return (
    <Slide
      kicker="הדחיות · 1 מתוך 4"
      title="לא אד״ו ראש"
      text={<>
        <p>ראש השנה לא חל ביום <strong>א׳</strong>, <strong>ד׳</strong> או <strong>ו׳</strong>. אם יצא באחד מהם, דוחים ליום שאחריו.</p>
        <h3>הטעם המעשי</h3>
        <p>ר״ה ביום ד׳ ← יום כיפור ביום ו׳. ר״ה ביום ו׳ ← יום כיפור ביום א׳. בשני המקרים יום כיפור צמוד לשבת: שני ימים רצופים בלי מלאכה, בעיה לקבורת מת ולירקות שנובלים.</p>
        <p>ר״ה ביום א׳ ← הושענא רבה בשבת, וחביטת הערבה מתבטלת.</p>
      </>}
      more={<>
        <h3>הטעם האסטרונומי (רמב״ם, קידוש החודש ז)</h3>
        <p>החשבון לפי מולד ממוצע, לא אמיתי. הדחייה מקרבת את הלוח למולד האמיתי.</p>
      </>}
      stage={<>
        <Viz>
          <WeekWheel days={['bad', '', '', 'bad', '', 'bad', '']}
            markers={[
              { x: d * P_DAY + P_DAY / 2, cls: bad ? 'shift' : 'ok', label: 'ר״ה' },
              { x: yk * P_DAY + P_DAY / 2, cls: ykBad ? 'shift' : 'leap', label: 'יוה״כ' },
              { x: hr * P_DAY + P_DAY * 0.62, cls: hrBad ? 'shift' : 'leap', label: 'הוש״ר' },
            ]}
            center={['ראש השנה ב', dayWord(d), bad ? 'אסור' : 'מותר']} aria="ימי אד״ו על גלגל השבוע" />
          <Legend items={[['var(--shift-soft)', 'א, ד, ו: ראש השנה לא חל בהם']]} />
        </Viz>
        <Engine title="מה היה קורה" sub="בחרו יום לראש השנה">
          <div className="week" role="group" aria-label="יום ראש השנה">
            {'אבגדהוז'.split('').map((l, i) => (
              <button key={i} type="button" className={ADU.includes(i) ? 'bad' : ''} aria-pressed={d === i} onClick={() => setD(i)}>
                <b>{l}</b><small>{DAY_NAME[i]}</small>
              </button>
            ))}
          </div>
          <Steps rows={[
            { l: 'ראש השנה', v: dayWord(d) },
            { l: 'יום כיפור (י׳ תשרי): 9 ימים אחרי', v: dayWord(yk), s: ykBad ? (yk === 5 ? 'יום שישי: צמוד לשבת שאחריו' : 'יום ראשון: צמוד לשבת שלפניו') : 'לא צמוד לשבת', c: ykBad ? 'bad' : '' },
            { l: 'הושענא רבה (כ״א תשרי): 20 ימים אחרי', v: dayWord(hr), s: hrBad ? 'שבת: חביטת הערבה מתבטלת' : '', c: hrBad ? 'bad' : '' },
            { l: 'המסקנה', v: bad ? <><Tag tone="bad">אסור</Tag> דוחים ל{dayWord(d + 1)}</> : <Tag tone="ok">מותר</Tag>, c: bad ? 'bad' : 'good' },
          ]} />
          <Chips label="שנים שבהן רק לא אד״ו דחה:" items={examples} onPick={y => setD(rh(y).moladDay % 7)} render={yearHeb} />
        </Engine>
      </>}
    />
  );
}
