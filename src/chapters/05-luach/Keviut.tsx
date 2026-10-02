import { useMemo } from 'react';
import { TYPE_NAME, type YearType, keviut, pesachDay, rh, yearHeb, yearLen } from '../../engines/calendar';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Chips, GDate, Num, Sig } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { dayWord } from '../../lib/format';

const ORDER = ['בחג', 'בשה', 'גכה', 'הכז', 'השא', 'זחא', 'זשג', 'בחה', 'בשז', 'גכז', 'החא', 'השג', 'זחג', 'זשה'];
const LET: Record<string, number> = { 'א': 0, 'ב': 1, 'ג': 2, 'ד': 3, 'ה': 4, 'ו': 5, 'ז': 6 };
const FROM = 5000, TO = 5999;

export function Keviut() {
  const yr = useSlideYear();
  const y = yr.y;
  const freq = useMemo(() => {
    const f: Record<string, number> = {};
    for (let i = FROM; i <= TO; i++) { const k = keviut(i); f[k] = (f[k] ?? 0) + 1; }
    return f;
  }, []);
  const k = keviut(y), a = rh(y), len = yearLen(y), pd = pesachDay(y), b = rh(y + 1);
  return (
    <Slide
      kicker="הלוח הקבוע · 4"
      title="קביעות השנה"
      text={<>
        <p>כל שנה מקבלת סימן של שלוש אותיות, <Term k="keviut">הקביעות</Term>: <strong>יום ראש השנה</strong>, <strong>סוג השנה</strong> (ח, כ, ש) ו<strong>יום פסח</strong>.</p>
        <p>יום פסח נגזר מראש השנה הבא: בין ט״ו ניסן לראש השנה שאחריו יש <Num>163</Num> ימים, <Num>23</Num> שבועות ועוד יומיים. לכן פסח חל תמיד יומיים לפני היום בשבוע של ראש השנה הבא.</p>
        <p>מכל הצירופים האפשריים נשארות בדיוק <strong><Num>14</Num> קביעויות</strong>: <Num>7</Num> לשנה פשוטה ו־<Num>7</Num> למעוברת.</p>
      </>}
      more={<p>מכאן גם הכלל ״לא בד״ו פסח״: מכיוון שר״ה לא חל באד״ו, פסח לא חל בב׳, ד׳ או ו׳.</p>}
      stage={<>
        <Viz>
          <table className="kt">
            <thead><tr><th>סימן</th><th>ראש השנה</th><th>סוג</th><th>פסח</th><th>שנה</th><th className="explore-only">שכיחות</th></tr></thead>
            <tbody>
              {ORDER.map((s, i) => (
                <tr key={s} className={s === k ? 'hl' : ''}>
                  <td className="sig">{s}</td><td>{dayWord(LET[s[0]])}</td><td>{TYPE_NAME[s[1] as YearType]}</td>
                  <td>{dayWord(LET[s[2]])}</td><td>{i < 7 ? 'פשוטה' : 'מעוברת'}</td>
                  <td className="explore-only"><Num>{(((freq[s] ?? 0) / (TO - FROM + 1)) * 100).toFixed(1)}%</Num></td>
                </tr>
              ))}
            </tbody>
          </table>
          <p className="note explore-only">השכיחות נספרה על השנים ה׳–ה׳תתקצ״ט</p>
        </Viz>
        <Engine title="הסימן של השנה">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <Steps rows={[
            { l: 'ראש השנה', v: <>{dayWord(a.day)} ← <Sig>{k[0]}</Sig></> },
            { l: 'אורך השנה', v: <><Num>{len}</Num> ימים ← {TYPE_NAME[k[1] as YearType]} ← <Sig>{k[1]}</Sig></> },
            { l: `ראש השנה ${yearHeb(y + 1)}`, v: dayWord(b.day) },
            { l: 'פסח = ראש השנה הבא פחות 163 ימים', v: <>{dayWord(pd)} <GDate day={pd} /> ← <Sig>{k[2]}</Sig></> },
            { l: `הקביעות של ${yearHeb(y)}`, v: <Sig>{k}</Sig>, c: 'final' },
          ]} />
          <Chips label="השנים הבאות:" items={Array.from({ length: 8 }, (_, i) => y + 1 + i)} onPick={yr.setY}
            render={v => `${yearHeb(v).replace(/^ה׳/, '')} ${keviut(v)}`} />
        </Engine>
      </>}
    />
  );
}
