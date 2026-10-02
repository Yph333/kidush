import { useMemo, useState } from 'react';
import { H0_STANDARD, localHM, sunAltAz, sunAt, zman } from '../../engines/zmanim';
import { ZMANIM, type ZmanOpinion } from '../../content/zmanimOpinions';
import { LineChart, type RefLine, type RefX } from '../../components/charts/LineChart';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num, Tag } from '../../components/text';
import { CityControl, DateControl, NotARuling, useZDay } from './shared';

const MIN = 60000;
type Part = 'evening' | 'morning';

export function Gauge() {
  const { y, m, d, p, city } = useZDay();
  const [part, setPart] = useState<Part>('evening');
  const evening = part === 'evening';
  const anchor = sunAt(y, m, d, p, H0_STANDARD, !evening).ms ?? Date.UTC(y, m, d, evening ? 15 : 3);
  // evening: sunset − 40 … sunset + 100 min; morning: sunrise − 110 … sunrise + 30 min
  const from = anchor + (evening ? -40 : -110) * MIN, span = 140;
  const [k, setK] = useState(evening ? 40 : 110);
  const idx = Math.max(0, Math.min(span, k));
  const t = from + idx * MIN;

  const alts = useMemo(() => Array.from({ length: span + 1 }, (_, i) => sunAltAz(from + i * MIN, p).alt), [from, p.lat, p.lon]);
  const ops = ZMANIM.filter(z => (evening ? ['sunset', 'tzeit'] : ['alot', 'misheyakir', 'sunrise']).includes(z.group));
  const deg = ops.filter((o): o is ZmanOpinion & { def: { kind: 'degrees'; deg: number } } => o.def.kind === 'degrees');
  const fixed = ops.filter(o => o.def.kind === 'offset');
  const refY: RefLine[] = [{ y: H0_STANDARD, label: evening ? 'שקיעה' : 'זריחה' }, ...deg.map(o => ({ y: -o.def.deg, label: `${o.def.deg}°` }))];
  const refX: RefX[] = fixed.map(o => ({ i: Math.round(((zman(o.def, { y, m, d, p }) ?? 0) - from) / MIN), label: o.name.replace(' דקות', '′').replace('רבנו תם, ', 'ר״ת ') }))
    .filter(r => r.i >= 0 && r.i <= span);

  const alt = sunAltAz(t, p).alt;
  const passed = ops.map(o => ({ o, ms: zman(o.def, { y, m, d, p }) }))
    .filter(x => x.ms !== null).sort((a, b) => a.ms! - b.ms!);

  return (
    <Slide
      wide
      kicker="היום · 3"
      title="מד שקיעה"
      text={<>
        <p>אחרי השקיעה השמש ממשיכה לרדת מתחת לאופק. שיטות ״המעלות״ קובעות את <Term k="tzeit" /> לפי <strong>כמה עמוק</strong> השמש, ושיטות ״הדקות״ לפי <strong>כמה זמן עבר</strong>.</p>
        <p>הקווים האופקיים הם המעלות. הקווים האנכיים הם הדקות הקבועות. גררו את הסמן ותראו מתי כל שיטה ״נדלקת״.</p>
        <Engine>
          <div className="ctl">
            <DateControl /><CityControl />
            <div className="fld">חלק היום
              <div className="seg">
                <button type="button" aria-pressed={evening} onClick={() => { setPart('evening'); setK(40); }}>ערב</button>
                <button type="button" aria-pressed={!evening} onClick={() => { setPart('morning'); setK(110); }}>בוקר</button>
              </div>
            </div>
          </div>
          <div className="tline">
            <input type="range" min={0} max={span} value={idx} onChange={e => setK(+e.target.value)} aria-label="הרגע" />
            <div className="tread">
              <Num>{localHM(t)}</Num>: השמש {alt >= 0 ? <>בגובה <Num>{alt.toFixed(2)}°</Num></> : <><Num>{(-alt).toFixed(2)}°</Num> מתחת לאופק</>}
              <small>{city.name}</small>
            </div>
          </div>
          <ul className="passed">
            {passed.map(({ o, ms }) => (
              <li key={o.id} className={ms! <= t ? 'on' : ''}>
                {ms! <= t ? <Tag tone="ok">✓</Tag> : <Tag tone="moon">…</Tag>} {o.group === 'sunset' || o.group === 'sunrise' ? o.name : `${o.name}`} <Num>{localHM(ms!)}</Num>
              </li>
            ))}
          </ul>
        </Engine>
        <NotARuling />
      </>}
      more={<p>שיטת מעלות ושיטת דקות שוות רק בתאריך ובמקום מסוימים. למשל, בירושלים, בניסן ובתשרי, <Num>16.1°</Num> מתחת לאופק הן כ־<Num>72</Num> דקות. בקיץ ובחורף, או בעיר אחרת, הן כבר לא שוות.</p>}
      stage={<>
        <Viz>
          <p className="chart-title">גובה השמש ב{city.name} ({evening ? 'ערב' : 'בוקר'})</p>
          <LineChart aria="גובה השמש לאורך הזמן, עם קווי המעלות והדקות של השיטות"
            series={[{ key: 'alt', label: 'גובה השמש', color: 'var(--s1)', values: alts }]}
            xLabels={Array.from({ length: 8 }, (_, j) => j * 20).map(i => [i, localHM(from + i * MIN)] as [number, string])}
            yTicks={evening ? [-20, -15, -10, -5, 0, 5] : [-24, -20, -15, -10, -5, 0, 5]} yFmt={v => `${v}°`}
            tipX={i => localHM(from + i * MIN)} refY={refY} refX={refX} marker={idx} onPick={setK} height={320} />
        </Viz>
      </>}
    />
  );
}
