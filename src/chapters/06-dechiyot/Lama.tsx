// Opening slide of the chapter: why Rosh Hashana is not always on the day of the molad, and the order of the checks.

import { fmtMolad, rh, yearHeb } from '../../engines/calendar';
import { Guide, useGuide } from '../../components/Guide';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { Civil, Legend, Num, Sig } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { LAMA } from '../../content/guides/dechiyot';
import { RULE_NAME, dayWord } from '../../lib/format';
import { go } from '../../state/nav';
import { useStore } from '../../state/store';

const RULES = [
  { k: 'adu', when: <>היום יוצא א׳, ד׳ או ו׳</>, to: 'ליום שאחריו', path: 'dechiyot/adu' },
  { k: 'zaken', when: <>המולד ב־<Num>18</Num> שעות (חצות היום) או אחריהן</>, to: 'ליום שאחריו', path: 'dechiyot/zaken' },
  { k: 'gatrad', when: <>שנה פשוטה, מולד ביום ג׳ מ־<Num>9</Num> שעות ו־<Num>204</Num> חלקים</>, to: 'ליום ה׳', path: 'dechiyot/gatrad' },
  { k: 'betu', when: <>אחרי שנה מעוברת, מולד ביום ב׳ מ־<Num>15</Num> שעות ו־<Num>589</Num> חלקים</>, to: 'ליום ג׳', path: 'dechiyot/betu' },
] as const;

export function Lama() {
  const g = useGuide(LAMA);
  const y = useStore(s => s.demoYear);
  const years = Array.from({ length: 7 }, (_, k) => rh(y + k));
  const r = years[0];
  const f = (on: boolean) => (on ? 'guide-focus' : '');

  const rows: StepRow[] = [
    { l: 'מולד תשרי', v: <Sig>{fmtMolad(r.t)}</Sig>, s: <Civil t={r.t} /> },
    { l: 'יום המולד', v: dayWord(r.moladDay) },
  ];
  let d = r.moladDay;
  for (const k of r.rules) { d++; rows.push({ l: <>{RULE_NAME[k]}: דוחים</>, v: dayWord(d), c: 'bad' }); }
  if (!r.rules.length) rows.push({ l: 'אף דחייה לא חלה', v: 'קובעים ביום המולד' });
  rows.push({ l: 'ראש השנה', v: dayWord(r.day), s: r.day > r.moladDay ? <><Num>{r.day - r.moladDay}</Num> {r.day - r.moladDay === 1 ? 'יום' : 'ימים'} אחרי יום המולד</> : '', c: 'final' });

  return (
    <Slide
      kicker="הדחיות · פתיחה"
      title="למה דוחים את ראש השנה"
      guide={<Guide g={g} />}
      text={<>
        <p>ראש השנה נקבע ביום של מולד תשרי. אבל בארבעה מקרים <strong>דוחים</strong> אותו ליום שאחרי, ולפעמים ביומיים.</p>
        <Src cite="רמב״ם, הלכות קידוש החודש ז, ו">ויום המולד הוא יום הקביעה לעולם. אלא אם כן היה באחד בשבת או ברביעי או בערב שבת…</Src>
      </>}
      stage={<>
        <Viz className={f(g.focus === 'wheel')}>
          <p className="vt">מולד תשרי, {yearHeb(y)} ושש השנים שאחריה</p>
          <WeekWheel
            markers={years.map((x, k) => ({ x: x.t, cls: k === 0 ? 'moon' : 'leap', label: k === 0 ? 'השנה' : undefined }))}
            center={['מולד תשרי', 'שבע שנים', 'בכל ימי השבוע']} aria="מולדות תשרי של שבע שנים על גלגל השבוע" />
          <Legend items={[['var(--moon)', 'מולד השנה'], ['var(--leap)', 'השנים הבאות']]} />
        </Viz>
        <Engine title="ארבע הדחיות" sub="מתי דוחים ולאן" className={f(g.focus === 'rules')}>
          <div className="table-wrap"><table className="kt">
            <thead><tr><th>דחייה</th><th>מתי</th><th>דוחים</th></tr></thead>
            <tbody>
              {RULES.map(x => (
                <tr key={x.k}>
                  <td><button type="button" className="linkbtn" onClick={() => go(x.path)}>{RULE_NAME[x.k]}</button></td>
                  <td>{x.when}</td>
                  <td>{x.to}</td>
                </tr>
              ))}
            </tbody>
          </table></div>
        </Engine>
        <Engine title={<>השנה שלנו: {yearHeb(y)}</>} sub="מהמולד לראש השנה" className={f(g.focus === 'ours')}>
          <Steps rows={rows} />
        </Engine>
      </>}
    />
  );
}
