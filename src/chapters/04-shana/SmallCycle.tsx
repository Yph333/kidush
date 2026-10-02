import { LEAP_POS, isLeap, yearHeb } from '../../engines/calendar';
import { Term } from '../../components/Glossary';
import { Ring } from '../../components/Ring';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Legend, Num, Sig, Tag } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM } from '../../lib/format';

const LEAPS: readonly number[] = LEAP_POS;

// Accumulated lunar-vs-solar drift over the 19 years (display only).
const ML = 29.530594, SY = 235 * ML / 19;
const DRIFT = (() => { let acc = 0; return Array.from({ length: 19 }, (_, i) => (acc += (LEAPS.includes(i + 1) ? 13 : 12) * ML - SY)); })();
const HI = Math.max(0, ...DRIFT), LO = Math.min(0, ...DRIFT);

function Drift({ cur }: { cur: number }) {
  const W = 640, H = 190, Rt = 610, bw = 28, sc = 130 / (HI - LO), Z = 30 + HI * sc;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="full" role="img" aria-label="הפער המצטבר בין לבנה לחמה לאורך המחזור">
      <text x="320" y="16" textAnchor="middle" className="svgt" fontWeight="700">הפער המצטבר בימים: הלבנה מול החמה</text>
      <line x1="40" y1={Z} x2={Rt + 10} y2={Z} className="wtick" />
      {DRIFT.map((v, i) => {
        const x = Rt - (i + 1) * bw, h = Math.abs(v) * sc, y = v < 0 ? Z : Z - h, L = LEAPS.includes(i + 1);
        return (
          <g key={i}>
            <rect x={x + 3} y={y} width={bw - 6} height={Math.max(1, h)} rx="2" className={L ? 'fl-leap' : 'fl-moonsoft'}
              style={i + 1 === cur ? { stroke: 'var(--ink)', strokeWidth: 2.5 } : undefined} />
            <text x={x + bw / 2} y={H - 6} textAnchor="middle" className={`svgt ${L ? 'tx-leap' : 'tx-muted'}`} fontWeight="700">{i + 1}</text>
          </g>
        );
      })}
      <text x="26" y={Z + 4} className="svgt tx-muted" textAnchor="middle">0</text>
      <text x="26" y={Z - LO * sc + 4} className="svgt tx-muted" textAnchor="middle" direction="ltr">{Math.round(LO)}</text>
    </svg>
  );
}

export function SmallCycle() {
  const yr = useSlideYear();
  const y = yr.y, c = Math.floor((y - 1) / 19), r = (y - 1) % 19, pos = r + 1, L = isLeap(y), v = (7 * y + 1) % 19;
  return (
    <Slide
      kicker="השנה · 1"
      title="המחזור הקטן"
      text={<>
        <p><Num>12</Num> חודשי לבנה הם כ־<Num>354</Num> ימים. שנת החמה היא כ־<Num>365¼</Num>. כל שנה הלבנה ״מקדימה״ את החמה בכ־<Num>11</Num> יום.</p>
        <p>בלי תיקון, פסח היה נודד לחורף. לכן מדי פעם מוסיפים חודש שלם, <strong>אדר א׳</strong>, והשנה נעשית <strong>מעוברת</strong>.</p>
        <p><Num>19</Num> שנות חמה שוות כמעט בדיוק ל־<Num>235</Num> חודשי לבנה: זה <Term k="katan" />. <Num>19×12 = 228</Num>, ועוד <strong><Num>7</Num> חודשים</strong>: בכל מחזור <Num>7</Num> שנים מעוברות.</p>
        <p>הסימן: <Sig>גו״ח אדז״ט</Sig>, השנים <Num>3, 6, 8, 11, 14, 17, 19</Num> במחזור.</p>
      </>}
      stage={<>
        <Viz>
          <Ring n={19} cls={i => (LEAPS.includes(i) ? 'rl' : 'rp')} cur={pos}
            center={['מחזור ' + NUM(c + 1), `שנה ${pos}`, L ? 'מעוברת' : 'פשוטה']} aria="מחזור של 19 שנה" />
          <div className="explore-only full"><Drift cur={pos} /></div>
          <Legend items={[['var(--leap-soft)', 'שנה מעוברת: מוסיפים חודש והפער מתאפס'], ['var(--moon-soft)', 'שנה פשוטה: הלבנה מקדימה כ־11 יום']]} />
        </Viz>
        <Engine title="איפה השנה במחזור" sub="ומעוברת או פשוטה">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <Steps rows={[
            { l: 'מחלקים ב־19', v: <><Num>{`(${NUM(y)} − 1) ÷ 19 = ${NUM(c)}`}</Num>, שארית <Num>{r}</Num></> },
            { l: 'המקום במחזור', v: <>מחזור <Num>{NUM(c + 1)}</Num>, שנה <Num>{pos}</Num></> },
            { l: 'האם השנה בגו״ח אדז״ט?', v: L ? <>כן: <Num>{pos}</Num> ברשימה</> : <>לא: <Num>{pos}</Num> לא ברשימה</> },
            { l: 'בדיקה מהירה בנוסחה', v: <Num>{`(7 × ${y} + 1) mod 19 = ${v}`}</Num>, s: <><Num>{v}</Num> {v < 7 ? 'קטן מ־7 ← מעוברת' : 'לא קטן מ־7 ← פשוטה'}</> },
            { l: yearHeb(y), v: L ? <Tag tone="leap">שנה מעוברת: 13 חודשים</Tag> : <Tag tone="moon">שנה פשוטה: 12 חודשים</Tag>, c: 'final' },
          ]} />
        </Engine>
      </>}
    />
  );
}
