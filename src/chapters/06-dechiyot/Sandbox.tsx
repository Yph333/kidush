// Sandbox: switch dechiyot off and run the calendar over a range of years.

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { type Dechiya, type DechiyaSkip, fmtMolad, isLeap, moladTotal, yearHeb } from '../../engines/calendar';
import { type SandboxResult, type Tally, rhWithout, runSandbox } from '../../engines/sandbox';
import { Guide, useGuide } from '../../components/Guide';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num, Sig, Tag } from '../../components/text';
import { YearControl } from '../../components/YearControl';
import { ARGAZ as GUIDE, type ArgazFocus } from '../../content/guides/dechiyot';
import { NUM, RULE_NAME, dayWord } from '../../lib/format';
import { useStore } from '../../state/store';

const ALL: Dechiya[] = ['adu', 'zaken', 'gatrad', 'betu'];
const ALLOWED = [353, 354, 355, 383, 384, 385];

interface Row { key: string; label: ReactNode; a: number; b: number; bad?: boolean; example?: number | null }

/** Horizontal bars, "real calendar" next to "your switches", on one shared scale. */
function Bars({ title, rows, onExample }: { title: string; rows: Row[]; onExample: (y: number) => void }) {
  const max = Math.max(1, ...rows.flatMap(r => [r.a, r.b]));
  return (
    <figure className="bars">
      <figcaption>{title}</figcaption>
      <table>
        <thead><tr><th scope="col" /><th scope="col">כל הדחיות</th><th scope="col">המתגים שלכם</th></tr></thead>
        <tbody>
          {rows.map(r => (
            <tr key={r.key} className={r.bad ? 'bad' : ''}>
              <th scope="row">{r.label}{r.bad && <> <Tag tone="bad">אסור</Tag></>}</th>
              {[r.a, r.b].map((v, i) => (
                <td key={i}>
                  <span className="bar" title={`${v}`}>{v > 0 && <i style={{ width: `${(v / max) * 100}%` }} />}</span>
                  <Num>{NUM(v)}</Num>
                  {i === 1 && r.bad && r.example != null && v > 0 && (
                    <button type="button" className="linkbtn ex" onClick={() => onExample(r.example!)}>לדוגמה: {yearHeb(r.example)}</button>
                  )}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </figure>
  );
}

function Count({ label, a, b, onExample }: { label: ReactNode; a: Tally; b: Tally; onExample: (y: number) => void }) {
  const worse = b.count > a.count;
  return (
    <div className={`count ${worse ? 'bad' : ''}`}>
      <small>{label}</small>
      <div><span className="cmp-a">כל הדחיות: <Num>{NUM(a.count)}</Num></span> · <b>המתגים שלכם: <Num>{NUM(b.count)}</Num></b></div>
      {b.example != null && b.count > 0 && <button type="button" className="linkbtn" onClick={() => onExample(b.example!)}>שנה לדוגמה: {yearHeb(b.example)}</button>}
    </div>
  );
}

/** One example year, computed with the current switches. */
function Example({ y, skip, onClose }: { y: number; skip: DechiyaSkip; onClose: () => void }) {
  const r = rhWithout(y, skip), n = rhWithout(y + 1, skip), len = n.day - r.day;
  const yk = r.day + 9, hr = r.day + 20, pesach = n.day - 163;
  const off = ALL.filter(k => skip[k]);
  return (
    <Engine title={<>שנה לדוגמה: {yearHeb(y)}</>} sub={off.length ? `בלי ${off.map(k => RULE_NAME[k]).join(', ')}` : 'כל הדחיות פעילות'}>
      <ul className="ex-list">
        <li>מולד תשרי <Sig>{fmtMolad(moladTotal(y))}</Sig> · השנה {isLeap(y) ? 'מעוברת' : 'פשוטה'}</li>
        <li>ראש השנה: <strong>{dayWord(r.day)}</strong>{r.rules.length ? <> (אחרי {r.rules.map(k => RULE_NAME[k]).join(', ')})</> : ' (בלי דחייה)'}</li>
        <li>יום כיפור: {dayWord(yk)}{(yk % 7 === 5 || yk % 7 === 0) && <> <Tag tone="bad">צמוד לשבת</Tag></>}</li>
        <li>הושענא רבה: {dayWord(hr)}{hr % 7 === 6 && <> <Tag tone="bad">בשבת</Tag></>}</li>
        <li>ראש השנה הבא: {dayWord(n.day)} · אורך השנה <Num>{len}</Num> ימים{!ALLOWED.includes(len) && <> <Tag tone="bad">אסור</Tag></>}</li>
        <li>פסח: {dayWord(pesach)}{[1, 3, 5].includes(pesach % 7) && <> <Tag tone="bad">בד״ו</Tag></>}</li>
      </ul>
      <button type="button" className="btn" onClick={onClose}>סגירה</button>
    </Engine>
  );
}

/** guide steps that switch exactly one dechiya off */
const ONLY_OFF: Partial<Record<ArgazFocus, Dechiya>> = { adu: 'adu', gatrad: 'gatrad', betu: 'betu', zaken: 'zaken' };

export function Sandbox() {
  const demo = useStore(s => s.demoYear);
  const [on, setOn] = useState<Record<Dechiya, boolean>>({ adu: false, zaken: true, gatrad: true, betu: true });
  const [from, setFrom] = useState(Math.max(2, demo - 500));
  const [count, setCount] = useState(1000);
  const [example, setExample] = useState<number | null>(null);
  const g = useGuide(GUIDE);
  const off = g.focus && ONLY_OFF[g.focus];
  useEffect(() => {
    if (!off) return;
    setOn({ adu: off !== 'adu', zaken: off !== 'zaken', gatrad: off !== 'gatrad', betu: off !== 'betu' });
    setExample(null);
  }, [off]);
  const f = (on: boolean) => (on ? 'guide-focus' : '');
  const skip: DechiyaSkip = { adu: !on.adu, zaken: !on.zaken, gatrad: !on.gatrad, betu: !on.betu };

  const { real, mine, ms } = useMemo(() => {
    const t0 = performance.now();
    const real = runSandbox(from, count, {});
    const mine = runSandbox(from, count, skip);
    return { real, mine, ms: performance.now() - t0 };
  }, [from, count, skip.adu, skip.zaken, skip.gatrad, skip.betu]);

  const lengthRows = (A: SandboxResult, B: SandboxResult): Row[] => {
    const lens = [...new Set([...A.lengths.keys(), ...B.lengths.keys(), ...ALLOWED])].sort((x, y) => x - y);
    return lens.map(len => ({
      key: String(len), label: <><Num>{len}</Num> ימים</>,
      a: A.lengths.get(len)?.count ?? 0, b: B.lengths.get(len)?.count ?? 0,
      bad: !ALLOWED.includes(len), example: B.lengths.get(len)?.example,
    }));
  };
  const dayRows: Row[] = Array.from({ length: 7 }, (_, d) => ({
    key: String(d), label: dayWord(d), a: real.rhWeekday[d].count, b: mine.rhWeekday[d].count,
    bad: [0, 3, 5].includes(d), example: mine.rhWeekday[d].example,
  }));

  return (
    <Slide
      wide
      kicker="הדחיות · ארגז חול"
      title="מה היה קורה בלי הדחייה?"
      guide={<Guide g={g} />}
      text={<>
        <p>כבו דחייה אחת או יותר, והלוח יחושב מחדש לאורך <Num>{NUM(count)}</Num> שנה. משמאל רואים מה יוצא, לעומת הלוח האמיתי.</p>
        <p>שימו לב: <strong>בלי לא אד״ו</strong> יום כיפור נצמד לשבת וההושענא רבה נופלת בשבת. <strong>בלי גטר״ד או בטו תקפט</strong> מופיעים אורכי שנה אסורים.</p>
        <Engine title="המתגים" className={f(g.focus === 'intro' || g.focus === 'sum')}>
          <div className="switches" role="group" aria-label="הדחיות">
            {ALL.map(k => (
              <label key={k} className="switch">
                <input type="checkbox" role="switch" checked={on[k]} onChange={e => setOn({ ...on, [k]: e.target.checked })} />
                <span>{RULE_NAME[k]}</span>
                <em>{on[k] ? 'פעילה' : 'כבויה'}</em>
              </label>
            ))}
          </div>
          <div className="ctl">
            <YearControl value={from} onChange={setFrom} label="משנה" />
            <label className="fld">כמה שנים
              <input type="number" min={10} max={10000} step={100} value={count}
                onChange={e => setCount(Math.max(10, Math.min(10000, Math.round(+e.target.value || 10))))} />
            </label>
          </div>
          <p className="note">שנים {yearHeb(real.from)}–{yearHeb(real.to)} · חושב ב־<Num>{ms.toFixed(0)}</Num> מילישניות</p>
        </Engine>
        {example != null && <Example y={example} skip={skip} onClose={() => setExample(null)} />}
      </>}
      stage={<>
        <div className={`counts ${f(g.focus === 'adu')}`}>
          <Count label="יום כיפור צמוד לשבת (ביום ו׳ או א׳)" a={real.ykNextToShabbat} b={mine.ykNextToShabbat} onExample={setExample} />
          <Count label="הושענא רבה בשבת" a={real.hrOnShabbat} b={mine.hrOnShabbat} onExample={setExample} />
          <Count label="פסח ביום ב׳, ד׳ או ו׳" a={real.pesachBDU} b={mine.pesachBDU} onExample={setExample} />
          <Count label="אורך שנה אסור" a={{ count: real.forbidden.reduce((s, f) => s + f.count, 0), example: null }}
            b={{ count: mine.forbidden.reduce((s, f) => s + f.count, 0), example: mine.forbidden[0]?.example ?? null }} onExample={setExample} />
        </div>
        <Viz className={f(g.focus === 'gatrad' || g.focus === 'betu' || g.focus === 'zaken')}><Bars title="אורכי השנים" rows={lengthRows(real, mine)} onExample={setExample} /></Viz>
        <Viz className="explore-only"><Bars title="יום ראש השנה" rows={dayRows} onExample={setExample} /></Viz>
        <p className="note explore-only">
          כמה פעמים כל דחייה הזיזה את ראש השנה בטווח: {ALL.map(k => <span key={k}>{RULE_NAME[k]} <Num>{NUM(real.applied[k])}</Num>{' '}</span>)}
          (בלוח האמיתי).
        </p>
      </>}
    />
  );
}
