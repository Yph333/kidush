import { useMemo } from 'react';
import { H0_STANDARD, hourAngle, ilOffset, localHMS, solarNoon, sunAt, sunPosition } from '../../engines/zmanim';
import { LineChart } from '../../components/charts/LineChart';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Num } from '../../components/text';
import { daysFrom, localHours } from '../../lib/zmanimYear';
import { setState } from '../../state/store';
import { CityControl, DateControl, MONTHS_HE, NotARuling, hhmm, useZDay } from './shared';

const f2 = (v: number, n = 4) => v.toFixed(n);
const utcHMS = (ms: number) => new Date(Math.round(ms / 1000) * 1000).toISOString().slice(11, 19);

export function Sun() {
  const { y, m, d, p, city } = useZDay();
  const days = useMemo(() => daysFrom({ y, m: 0, d: 1 }, 365), [y]);
  const series = useMemo(() => {
    const rise = days.map(c => { const t = sunAt(c.y, c.m, c.d, p, H0_STANDARD, true).ms; return t === null ? null : localHours(t); });
    const set = days.map(c => { const t = sunAt(c.y, c.m, c.d, p, H0_STANDARD, false).ms; return t === null ? null : localHours(t); });
    const eot = days.map(c => sunPosition(Date.UTC(c.y, c.m, c.d, 12)).eot);
    const decl = days.map(c => sunPosition(Date.UTC(c.y, c.m, c.d, 12)).decl);
    return { rise, set, eot, decl };
  }, [days, p.lat, p.lon]);
  const sel = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86400000);
  const xLabels: [number, string][] = MONTHS_HE.map((t, i) => [Math.round((Date.UTC(y, i, 15) - Date.UTC(y, 0, 1)) / 86400000), t]);
  const tip = (i: number) => `${days[i].d}.${days[i].m + 1}`;
  const pickDay = (i: number) => { const c = days[i]; setState({ zDate: `${c.y}-${String(c.m + 1).padStart(2, '0')}-${String(c.d).padStart(2, '0')}` }); };

  // the worked example for the chosen date
  const r = sunAt(y, m, d, p, H0_STANDARD, true), s = sunAt(y, m, d, p, H0_STANDARD, false);
  const pos = r.steps.pos, noon = solarNoon(y, m, d, p), ha = hourAngle(p.lat, pos.decl, H0_STANDARD);
  const off = r.ms !== null ? ilOffset(r.ms) : 2;

  const range = (vals: (number | null)[]) => {
    const v = vals.filter((x): x is number => x !== null);
    const lo = Math.floor(Math.min(...v)), hi = Math.ceil(Math.max(...v));
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  };

  return (
    <Slide
      kicker="היום · 1"
      title="למה השמש זורחת בזמנים שונים"
      text={<>
        <p>שלושה דברים קובעים מתי השמש זורחת ושוקעת: <strong>נטיית השמש</strong> (כמה היא צפונה או דרומה מקו המשווה, עד <Num>23.44°</Num>), <strong>קו הרוחב</strong> של המקום, ו<strong>משוואת הזמן</strong>.</p>
        <p>בקיץ השמש צפונית, הקשת שלה בשמיים ארוכה, והיום ארוך. בחורף להפך. ככל שמתרחקים מקו המשווה, ההבדל גדל.</p>
        <p>משוואת הזמן מזיזה את צהרי השמש עד כ־<Num>16</Num> דקות לכאן או לכאן. לכן השקיעה המוקדמת ביותר אינה ביום הקצר ביותר.</p>
        <Engine title="החישוב, שלב אחר שלב" sub={`זריחה מישורית ב${city.name}`}>
          <div className="ctl"><DateControl /><CityControl /></div>
          <Steps rows={[
            { l: 'יום יוליאני ומאות שנים מ־2000', v: <><Num>{`JD = ${f2(pos.jd, 3)}`}</Num></>, s: <Num>{`T = ${f2(pos.T, 6)}`}</Num> },
            { l: 'נטיית השמש δ ומשוואת הזמן', v: <><Num>{`δ = ${f2(pos.decl, 3)}°`}</Num> · <Num>{`EoT = ${f2(pos.eot, 2)}`}</Num> דק׳</> },
            { l: <>גובה מבוקש: <Num>−0.833°</Num> (שבירת אור <Num>34′</Num> + חצי קוטר <Num>16′</Num>)</>, v: <Num>{`cos H = (sin h₀ − sin φ·sin δ) / (cos φ·cos δ) = ${f2(ha.cosH)}`}</Num>, s: <><Num>{`φ = ${p.lat}°`}</Num></> },
            { l: 'זווית השעה', v: ha.H === null ? 'השמש לא מגיעה לגובה הזה היום' : <Num>{`H = ${f2(ha.H, 3)}° = ${f2(ha.H * 4, 1)} min`}</Num> },
            { l: 'צהרי השמש (UTC)', v: <Num>{`12:00 − 4·${p.lon}′ − ${f2(pos.eot, 2)}′ = ${utcHMS(noon)}`}</Num>, s: 'כל מעלת אורך מזרחה מקדימה ב־4 דקות' },
            { l: 'זריחה ושקיעה (UTC)', v: <><Num>{r.ms ? utcHMS(r.ms) : '—'}</Num> · <Num>{s.ms ? utcHMS(s.ms) : '—'}</Num></>, s: 'צהריים ∓ 4H, ומחשבים שוב ברגע עצמו (הנטייה משתנה מעט במשך היום)' },
            { l: <>שעון ישראל (UTC+<Num>{off}</Num>{off === 3 ? ', שעון קיץ' : ''})</>, v: <>זריחה <Num>{r.ms ? localHMS(r.ms) : '—'}</Num> · שקיעה <Num>{s.ms ? localHMS(s.ms) : '—'}</Num></>, c: 'final' },
          ]} />
        </Engine>
        <NotARuling />
      </>}
      wide
      stage={<>
        <Viz>
          <p className="chart-title">זריחה ב{city.name}, לאורך <Num>{y}</Num></p>
          <LineChart aria={`שעת הזריחה לאורך השנה ב${city.name}`} series={[{ key: 'rise', label: 'זריחה', color: 'var(--s2)', values: series.rise }]}
            xLabels={xLabels} yTicks={range(series.rise)} yFmt={hhmm} tipX={tip} marker={sel} onPick={pickDay} height={190} />
          <p className="chart-title">שקיעה ב{city.name}</p>
          <LineChart aria={`שעת השקיעה לאורך השנה ב${city.name}`} series={[{ key: 'set', label: 'שקיעה', color: 'var(--s3)', values: series.set }]}
            xLabels={xLabels} yTicks={range(series.set)} yFmt={hhmm} tipX={tip} marker={sel} onPick={pickDay} height={190} />
          <p className="note">הקפיצות באביב ובסתיו הן שעון הקיץ. לחיצה על הגרף בוחרת תאריך.</p>
        </Viz>
        <Viz className="explore-only">
          <p className="chart-title">משוואת הזמן (דקות)</p>
          <LineChart aria="משוואת הזמן לאורך השנה" series={[{ key: 'eot', label: 'משוואת הזמן', color: 'var(--s1)', values: series.eot }]}
            xLabels={xLabels} yTicks={[-15, -10, -5, 0, 5, 10, 15]} yFmt={v => (v > 0 ? '+' : '') + v} tipX={tip} marker={sel} onPick={pickDay} height={170} refY={[{ y: 0, label: '' }]} />
          <p className="chart-title">נטיית השמש (מעלות)</p>
          <LineChart aria="נטיית השמש לאורך השנה" series={[{ key: 'decl', label: 'נטייה', color: 'var(--s4)', values: series.decl }]}
            xLabels={xLabels} yTicks={[-20, -10, 0, 10, 20]} yFmt={v => `${v}°`} tipX={tip} marker={sel} onPick={pickDay} height={170} refY={[{ y: 0, label: 'קו המשווה' }]} />
        </Viz>
      </>}
    />
  );
}
