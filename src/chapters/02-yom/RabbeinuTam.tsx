import { useMemo } from 'react';
import { type ZPlace, localHMin, sunAltAz, sunsetStages } from '../../engines/zmanim';
import { LineChart } from '../../components/charts/LineChart';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { Num } from '../../components/text';
import { daysFrom } from '../../lib/zmanimYear';
import { setState } from '../../state/store';
import { CityControl, DateControl, MONTHS_HE, NotARuling, useZDay } from './shared';

const MIN = 60000;
/** Ramerupt (Aube, France), Rabbeinu Tam's town: 48.519°N 4.293°E. */
const RAMERUPT: ZPlace & { name: string; tz: string } = { name: 'רמרו (רבנו תם)', lat: 48.5193, lon: 4.2927, elevation: 0, tz: 'Europe/Paris' };
const DEPTHS = [8.5, 16.1];

interface Place { name: string; p: ZPlace; tz?: string }

function stats(y: number, m: number, d: number, pl: Place) {
  const s = sunsetStages(y, m, d, pl.p, DEPTHS);
  const after72 = s.set === null ? null : -sunAltAz(s.set + 72 * MIN, pl.p).alt;
  const mins = (t: number | null) => (t === null || s.set === null ? null : (t - s.set) / MIN);
  return { s, disk: s.touch && s.set ? (s.set - s.touch) / MIN : null, d85: mins(s.depth[8.5]), d161: mins(s.depth[16.1]), after72 };
}

/** The sun's path below the horizon after sunset at both places, on the same axes (azimuth relative to sunset). */
function Paths({ places, y, m, d }: { places: Place[]; y: number; m: number; d: number }) {
  const W = 760, H = 300, padL = 50, padR = 20, top = 20, x0 = W - padR;
  const X = (daz: number) => x0 - (daz / 40) * (W - padL - padR);          // RTL: later (further along) to the left
  const Y = (dep: number) => top + (dep / 20) * (H - top - 30);
  const colors = ['var(--s1)', 'var(--s2)'];
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="מסלול השמש מתחת לאופק אחרי השקיעה, בשני המקומות">
      {[0, 8.5, 16.1].map(dep => (
        <g key={dep}>
          <line x1={padL} x2={x0} y1={Y(dep)} y2={Y(dep)} className={dep ? 'wtick' : 'st-ink'} stroke="var(--muted)" strokeDasharray={dep ? '4 4' : undefined} />
          <text x={padL - 6} y={Y(dep) + 4} className="svgt tx-muted" textAnchor="end" fontSize="11">{dep ? `−${dep}°` : 'אופק'}</text>
        </g>
      ))}
      {places.map((pl, i) => {
        const s = sunsetStages(y, m, d, pl.p, []).set;
        if (s === null) return null;
        const az0 = sunAltAz(s, pl.p).az, pts: [number, number][] = [];
        for (let k = 0; k <= 110; k += 2) { const q = sunAltAz(s + k * MIN, pl.p); pts.push([q.az - az0, -q.alt]); }
        const dots = pts.filter((_, j) => j % 5 === 0);
        const at72 = pts[36];
        return (
          <g key={pl.name}>
            <polyline points={pts.map(([a, b]) => `${X(a).toFixed(1)},${Y(b).toFixed(1)}`).join(' ')} fill="none" stroke={colors[i]} strokeWidth="2" />
            {dots.map(([a, b], j) => <circle key={j} cx={X(a)} cy={Y(b)} r="3" fill={colors[i]} />)}
            <circle cx={X(at72[0])} cy={Y(at72[1])} r="7" fill="none" stroke={colors[i]} strokeWidth="2" />
            <text x={X(pts[pts.length - 1][0]) + 6} y={Y(pts[pts.length - 1][1]) + 4} className="svgt" fontSize="12" fontWeight="700">{pl.name}</text>
          </g>
        );
      })}
      <text x={x0} y={H - 8} className="svgt tx-muted" textAnchor="end" fontSize="11">נקודה כל 10 דקות מהשקיעה; עיגול: 72 דקות אחרי השקיעה</text>
    </svg>
  );
}

export function RabbeinuTam() {
  const { y, m, d, p, city } = useZDay();
  const places: Place[] = [{ name: city.name, p }, { name: RAMERUPT.name, p: RAMERUPT, tz: RAMERUPT.tz }];
  const rows = places.map(pl => ({ pl, ...stats(y, m, d, pl) }));
  const days = useMemo(() => daysFrom({ y, m: 0, d: 1 }, 365), [y]);
  const year = useMemo(() => places.map(pl => days.map(c => stats(c.y, c.m, c.d, pl))), [days, p.lat, p.lon]);
  const sel = Math.round((Date.UTC(y, m, d) - Date.UTC(y, 0, 1)) / 86400000);
  const xLabels: [number, string][] = MONTHS_HE.map((t, i) => [Math.round((Date.UTC(y, i, 15) - Date.UTC(y, 0, 1)) / 86400000), t]);
  const tip = (i: number) => `${days[i].d}.${days[i].m + 1}`;
  const pick = (i: number) => { const c = days[i]; setState({ zDate: `${c.y}-${String(c.m + 1).padStart(2, '0')}-${String(c.d).padStart(2, '0')}` }); };
  const f1 = (v: number | null) => (v === null ? '—' : v.toFixed(1));

  return (
    <Slide
      wide
      kicker="היום · 4"
      title="השקיעה במקומו של רבנו תם"
      text={<>
        <p>רבנו תם חי ברמרו שבצפון צרפת, בקו רוחב <Num>48.5°</Num>, צפונית לירושלים ב־<Num>17°</Num>. בתוספות מובא שבין השקיעה לצאת הכוכבים יש ארבעה מילין, ורבנו תם מחלק בין ״תחילת שקיעה״ ל״סוף שקיעה״.</p>
        <Src cite="תוספות, שבת לה ע״א, ד״ה תרי">ואומר ר״ת דהתם מיירי בתחילת שקיעה והכא משתשקע מסוף שקיעה</Src>
        <p>ככל שמצפינים, השמש יורדת אל מתחת לאופק בזווית שטוחה יותר. לכן גם השקיעה עצמה וגם הדמדומים שאחריה נמשכים יותר זמן.</p>
        <Engine title="השוואה" sub="באותו תאריך">
          <div className="ctl"><DateControl /><CityControl /></div>
          <div className="table-wrap">
            <table className="kt">
              <thead><tr><th /><th>{rows[0].pl.name}</th><th>{rows[1].pl.name}</th></tr></thead>
              <tbody>
                <tr><td>שקיעה (שעון מקומי)</td>{rows.map(r => <td key={r.pl.name}><Num>{r.s.set ? localHMin(r.s.set, r.pl.tz) : '—'}</Num></td>)}</tr>
                <tr><td>השמש שוקעת (מהנגיעה באופק עד ההיעלמות)</td>{rows.map(r => <td key={r.pl.name}><Num>{f1(r.disk)}</Num> דק׳</td>)}</tr>
                <tr><td>מהשקיעה עד <Num>8.5°</Num> מתחת לאופק</td>{rows.map(r => <td key={r.pl.name}><Num>{f1(r.d85)}</Num> דק׳</td>)}</tr>
                <tr><td>מהשקיעה עד <Num>16.1°</Num> מתחת לאופק</td>{rows.map(r => <td key={r.pl.name}>{r.d161 === null ? 'השמש לא יורדת כל כך' : <><Num>{f1(r.d161)}</Num> דק׳</>}</td>)}</tr>
                <tr><td>עומק השמש <Num>72</Num> דקות אחרי השקיעה</td>{rows.map(r => <td key={r.pl.name}><Num>{f1(r.after72)}°</Num></td>)}</tr>
              </tbody>
            </table>
          </div>
          <p className="note">רמרו: <Num>48.519°N 4.293°E</Num>, בגובה פני הים; השעה בשעון צרפת של היום. החישוב אסטרונומי בלבד.</p>
        </Engine>
        <NotARuling />
      </>}
      more={<p>ארבעה מילין הם <Num>72</Num> דקות אם מיל הוא <Num>18</Num> דקות. בירושלים, בניסן ובתשרי, <Num>72</Num> דקות אחרי השקיעה השמש כ־<Num>16°</Num> מתחת לאופק. ברמרו באותם ימים היא עדיין רדודה יותר, ובקיץ היא לא מגיעה לעומק כזה כלל. מכאן הוויכוח אם לשער את צאת הכוכבים בדקות או במעלות.</p>}
      stage={<>
        <Viz><p className="chart-title">מסלול השמש מתחת לאופק אחרי השקיעה</p><Paths places={places} y={y} m={m} d={d} /></Viz>
        <Viz>
          <p className="chart-title">דקות מהשקיעה עד שהשמש <Num>16.1°</Num> מתחת לאופק, לאורך השנה</p>
          <LineChart aria="משך הדמדומים עד 16.1 מעלות בשני המקומות לאורך השנה" height={230}
            series={places.map((pl, i) => ({ key: pl.name, label: pl.name, color: i ? 'var(--s2)' : 'var(--s1)', values: year[i].map(s => s.d161) }))}
            xLabels={xLabels} yTicks={[60, 80, 100, 120, 140, 160]} yFmt={v => `${v}`} tipX={tip} marker={sel} onPick={pick}
            refY={[{ y: 72, label: '72 דקות' }]} />
          <p className="note">רווח בקו: ימים שבהם השמש לא יורדת <Num>16.1°</Num> מתחת לאופק.</p>
        </Viz>
        <Viz className="explore-only">
          <p className="chart-title">כמה דקות השמש שוקעת (מהנגיעה באופק עד ההיעלמות)</p>
          <LineChart aria="משך שקיעת גוף השמש לאורך השנה בשני המקומות" height={190}
            series={places.map((pl, i) => ({ key: pl.name, label: pl.name, color: i ? 'var(--s2)' : 'var(--s1)', values: year[i].map(s => s.disk) }))}
            xLabels={xLabels} yTicks={[2, 3, 4, 5]} yFmt={v => `${v}`} tipX={tip} marker={sel} onPick={pick} />
        </Viz>
      </>}
    />
  );
}
