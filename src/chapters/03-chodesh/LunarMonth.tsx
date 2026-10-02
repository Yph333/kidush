import { useState } from 'react';
import { EX, P_MONTH, P_WEEK, fmtDur, fmtMolad, monthsOf, moladTotal, yearHeb } from '../../engines/calendar';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DHP, Civil, Num, Sig } from '../../components/text';
import { WeekWheel, type WheelProps } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';


function MonthBar() {
  const W = 640, c = 20, Rt = 620, pw = (c - 2) * (12 * 1080 + 793) / 25920;
  return (
    <svg viewBox={`0 0 ${W} 120`} className="full" role="img" aria-label="חודש לבנה: ארבעה שבועות ועודף">
      <text x="320" y="18" textAnchor="middle" className="svgt" fontWeight="700">חודש אחד: 29 ימים, 12 שעות, 793 חלקים</text>
      {Array.from({ length: 29 }, (_, k) => {
        const i = k + 1, x = Rt - i * c, w = Math.floor((i - 1) / 7);
        return <rect key={i} x={x + 1} y="32" width={c - 2} height="34" rx="3" className={i === 29 ? 'fl-moonsoft' : w % 2 ? 'wn' : 'wd'}
          style={i === 29 ? { stroke: 'var(--moon)', strokeWidth: 1.5 } : undefined} />;
      })}
      <rect x={Rt - 29 * c - pw + 1} y="32" width={pw} height="34" rx="3" className="fl-moon" />
      {[0, 1, 2, 3].map(w => <text key={w} x={Rt - (w * 7 + 3.5) * c} y="88" textAnchor="middle" className="svgt tx-muted">שבוע {w + 1}</text>)}
      <text x={Rt - 29.3 * c} y="88" textAnchor="middle" className="svgt tx-moon" fontWeight="800">העודף</text>
      <text x={Rt - 29.3 * c} y="108" textAnchor="middle" className="svgs tx-moon" fontSize="15">א׳ י״ב תשצ״ג</text>
      <text x={Rt - 14 * c} y="108" textAnchor="middle" className="svgt tx-muted">28 ימים = 4 שבועות: לא מזיזים את היום בשבוע</text>
    </svg>
  );
}

export function LunarMonth() {
  const yr = useSlideYear();
  const y = yr.y;
  const [n, setN] = useState(3);
  const names = [...monthsOf(y), ...monthsOf(y + 1)].map(m => m[0]);
  const t0 = moladTotal(y);
  const rows: StepRow[] = [{ l: `מולד ${names[0]} ${yearHeb(y)}`, v: <Sig>{fmtMolad(t0)}</Sig>, s: <Civil t={t0} /> }];
  const markers: WheelProps['markers'] = [{ x: t0, cls: 'moon', label: names[0] }];
  const arcs: WheelProps['arcs'] = [];
  for (let k = 1; k <= n; k++) {
    const t = t0 + k * P_MONTH;
    rows.push({ l: <>+ <Sig>{fmtDur(EX.month)}</Sig> ← מולד {names[k]}</>, v: <Sig>{fmtMolad(t)}</Sig>, s: <Civil t={t} /> });
    arcs.push({ from: t - P_MONTH, to: t - P_MONTH + EX.month, cls: 'leap' });
    markers.push({ x: t, cls: k === n ? 'shift' : 'leap', label: k === n ? names[k] : '' });
  }
  rows.push({
    l: <><Num>{n}</Num> חודשים בסך הכול</>, v: <DHP t={n * P_MONTH} />,
    s: <><Num>{Math.floor(n * P_MONTH / P_WEEK)}</Num> שבועות שלמים, ונשאר <Sig>{fmtDur(n * EX.month % P_WEEK)}</Sig></>, c: 'final',
  });

  return (
    <Slide
      kicker="החודש · 1"
      title="חודש הלבנה"
      text={<>
        <p><Term k="molad">מולד</Term> ממוצע אחד רחוק מהבא <Sig>כ״ט י״ב תשצ״ג</Sig>: <Num>29</Num> ימים, <Num>12</Num> שעות ו־<Num>793</Num> חלקים. בסך הכול <Num>765,433</Num> חלקים.</p>
        <Src cite="קיצור שלחן ערוך, סדר לעשות לוח בקצרה">דע, שחדש הלבנה כ״ט ימים, י״ב שעות, תשצ״ג חלקים</Src>
        <p>כדי לדעת <strong>באיזה יום בשבוע</strong> יחול המולד הבא, לא צריך את כל החודש. <Num>28</Num> ימים הם <Num>4</Num> שבועות שלמים, אז נשאר רק <Term k="odef">העודף</Term>: <Sig>א׳ י״ב תשצ״ג</Sig>.</p>
      </>}
      more={<p>לוח לא יכול להכיל חצי יום, לכן החודשים מתחלפים: <strong>מלא</strong> (<Num>30</Num>) ו<strong>חסר</strong> (<Num>29</Num>). שני חודשים יחד הם <Num>59</Num> ימים, שעה ו־<Num>506</Num> חלקים, כלומר כמעט בדיוק <Num>59</Num>.</p>}
      stage={<>
        <Viz><MonthBar /></Viz>
        <Engine title="מולד אחרי מולד" sub="מתחילים ממולד ומוסיפים עודף של חודש">
          <div className="ctl">
            <SlideYear yr={yr} label="מולד התחלה: תשרי של שנה" />
            <label className="fld">כמה חודשים קדימה
              <input type="number" min={1} max={13} value={n} onChange={e => setN(Math.max(1, Math.min(13, +e.target.value || 1)))} />
            </label>
          </div>
          <Viz plain>
            <WeekWheel markers={markers} arcs={arcs} center={['אחרי', `${n} חודשים`, names[n]]} aria="מולדות עוקבים על גלגל השבוע" />
          </Viz>
          <Steps rows={rows} />
        </Engine>
      </>}
    />
  );
}
