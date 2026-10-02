import { useMemo, useState } from 'react';
import { yearHeb } from '../../engines/calendar';
import { LineChart } from '../../components/charts/LineChart';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';
import { YearControl } from '../../components/YearControl';
import { movingAverage, talUmatarEvening, yearPoint, yearSeries } from '../../lib/longTimeline';
import { useStore } from '../../state/store';

const SPANS = [100, 300, 1000, 2000];

export function Timeline() {
  const demo = useStore(s => s.demoYear);
  const [span, setSpan] = useState(1000);
  const [from, setFrom] = useState(Math.max(2, demo - 700));
  const step = span > 1000 ? 2 : 1;
  const pts = useMemo(() => yearSeries(from, span, step), [from, span, step]);
  const pesachAvg = useMemo(() => movingAverage(pts.map(p => p.pesach), Math.max(3, Math.round(19 / step))), [pts, step]);
  const tal = useMemo(() => pts.map(p => { const d = talUmatarEvening(p.y); return (d.getTime() - Date.UTC(d.getUTCFullYear(), 11, 1)) / 86400000 + 1; }), [pts]);
  const now = yearPoint(demo), nowTal = talUmatarEvening(demo + 1);

  const every = Math.max(1, Math.round(pts.length / 6));
  const xLabels: [number, string][] = pts.map((p, i) => [i, `${p.gy}`] as [number, string]).filter((_, i) => i % every === 0);
  const tip = (i: number) => `${yearHeb(pts[i].y)} · ${pts[i].gy}`;
  const marker = pts.findIndex(p => p.y === demo);

  return (
    <Slide
      wide
      kicker="השנה · 4"
      title="הלוח מול העונות, לאורך מאות שנים"
      text={<>
        <p>הלוח העברי צריך לשמור את פסח באביב. העיבור (<Num>7</Num> חודשים ב־<Num>19</Num> שנה) מחזיר אותו אחורה, אבל השנה הממוצעת של הלוח ארוכה מעט משנת החמה. לכן הלוח זז לאט קדימה ביחס לעונות: יום בערך כל <Num>216</Num> שנה.</p>
        <p>תקופת שמואל (<Num>365¼</Num> ימים) ארוכה עוד יותר, ומאחרת ביום כל <Num>128</Num> שנה. ממנה נגזר מועד ״טל ומטר״ בחוץ לארץ, ולכן הוא זז מסוף נובמבר לתחילת דצמבר, ומשם יזוז הלאה.</p>
        <Engine>
          <div className="ctl">
            <YearControl value={from} onChange={setFrom} label="משנה" />
            <label className="fld">כמה שנים
              <select value={span} onChange={e => setSpan(+e.target.value)}>
                {SPANS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
            </label>
          </div>
          <Facts items={[
            [<>פסח {yearHeb(demo)}</>, <><Num>{now.pesach.toFixed(1)}</Num> ימים אחרי השוויון</>],
            ['תקופת ניסן, שמואל', <><Num>{now.shmuel.toFixed(1)}</Num> ימים אחרי</>],
            ['תקופת ניסן, רב אדא', <><Num>{now.ravAdda.toFixed(1)}</Num> ימים אחרי</>],
            ['טל ומטר בחו״ל, השנה', <>בערב <Num>{`${nowTal.getUTCDate()}.${nowTal.getUTCMonth() + 1}.${nowTal.getUTCFullYear()}`}</Num></>],
          ]} />
        </Engine>
      </>}
      more={<p>השוויון מחושב במודל אסטרונומי מקוצר; לאורך מאות שנים הדיוק שלו הוא שעות בודדות. תאריכים לפני <Num>1582</Num> מוצגים בלוח הגרגוריאני (פרולפטי). מניין ששים הימים לטל ומטר: TODO: verify.</p>}
      stage={<>
        <Viz>
          <p className="chart-title">כמה ימים אחרי יום השוויון באביב</p>
          <LineChart aria="פסח, תקופת שמואל ותקופת רב אדא, בימים אחרי יום השוויון, לאורך השנים"
            series={[
              { key: 'pesachRaw', label: 'פסח', color: 'var(--s1)', values: pts.map(p => p.pesach), faint: true },
              { key: 'pesach', label: 'פסח (ממוצע 19 שנה)', color: 'var(--s1)', values: pesachAvg },
              { key: 'shmuel', label: 'שמואל', color: 'var(--s2)', values: pts.map(p => p.shmuel) },
              { key: 'ravAdda', label: 'רב אדא', color: 'var(--s3)', values: pts.map(p => p.ravAdda) },
            ]}
            xLabels={xLabels} yTicks={[-10, 0, 10, 20, 30, 40]} yFmt={v => `${v}`} tipX={tip} height={300}
            refY={[{ y: 0, label: 'יום השוויון' }]} marker={marker >= 0 ? marker : null} />
          <p className="note">הקו הדק: פסח בכל שנה (קופץ בתוך מחזור של <Num>19</Num> שנה). הקו העבה: הממוצע על פני <Num>19</Num> שנה, שזז לאט כמו רב אדא.</p>
        </Viz>
        <Viz>
          <p className="chart-title">טל ומטר בחוץ לארץ: הערב שבו מתחילים (ימים בדצמבר)</p>
          <LineChart aria="תאריך תחילת שאלת טל ומטר בחוץ לארץ לאורך השנים"
            series={[{ key: 'tal', label: 'טל ומטר', color: 'var(--s2)', values: tal }]}
            xLabels={xLabels} yTicks={[-15, -10, -5, 0, 5, 10, 15]} yFmt={v => (v >= 1 ? `${v}.12` : `${30 + v}.11`)} tipX={tip} height={200}
            refY={[{ y: 1, label: '1 בדצמבר' }]} marker={marker >= 0 ? marker : null} />
        </Viz>
      </>}
    />
  );
}
