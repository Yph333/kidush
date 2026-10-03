import { useMemo, useState } from 'react';
import { gq, hebDate, monthsOf, rh, yearHeb } from '../../engines/calendar';
import { civOf } from '../../engines/astro';
import { localHM } from '../../engines/zmanim';
import { GROUP_NAME, type ZmanGroup } from '../../content/zmanimOpinions';
import { LineChart } from '../../components/charts/LineChart';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num } from '../../components/text';
import { dayWord } from '../../lib/format';
import { localHours, toCsv, zmanimSeries } from '../../lib/zmanimYear';
import { useStore } from '../../state/store';
import { CityControl, NotARuling, hhmm, usePick, useZDay } from './shared';

const ALL_GROUPS = Object.keys(GROUP_NAME) as ZmanGroup[];
const DEFAULT_COLS: ZmanGroup[] = ['alot', 'sunrise', 'shma', 'tefila', 'chatzot', 'plag', 'sunset', 'tzeit'];

export function Annual() {
  const demo = useStore(s => s.demoYear);
  const { p, city } = useZDay();
  const pick = usePick();
  const [cols, setCols] = useState<ZmanGroup[]>(DEFAULT_COLS);

  const start = rh(demo).day, end = rh(demo + 1).day;
  const days = useMemo(() => Array.from({ length: end - start }, (_, i) => start + i), [start, end]);
  const civil = useMemo(() => days.map(di => { const [y, m, d] = civOf(di); return { y, m, d }; }), [days]);
  const ids = ALL_GROUPS.map(g => pick(g).id);
  const data = useMemo(() => zmanimSeries(civil, p, ids), [civil, p.lat, p.lon, p.elevation, ids.join()]);
  const col = (g: ZmanGroup) => data[pick(g).id];

  // charts: morning and evening, two series each
  const hrs = (g: ZmanGroup) => col(g).map(t => (t === null ? null : localHours(t)));
  const monthTicks: [number, string][] = [];
  { let s = 0; monthsOf(demo).forEach(([name, len]) => { monthTicks.push([s + 14, name]); s += len; }); }
  const tip = (i: number) => { const h = hebDate(days[i]); return `${gq(h.d)} ${h.name} · ${civil[i].d}.${civil[i].m + 1}`; };
  const ticks = (gs: ZmanGroup[]) => {
    const v = gs.flatMap(g => hrs(g)).filter((x): x is number => x !== null);
    const lo = Math.floor(Math.min(...v)), hi = Math.ceil(Math.max(...v));
    return Array.from({ length: hi - lo + 1 }, (_, i) => lo + i);
  };

  const header = ['תאריך עברי', 'תאריך לועזי', 'יום', ...cols.map(g => `${GROUP_NAME[g]} (${pick(g).name})`)];
  const rows = days.map((di, i) => {
    const h = hebDate(di), c = civil[i];
    return [`${gq(h.d)} ${h.name}`, `${String(c.d).padStart(2, '0')}.${String(c.m + 1).padStart(2, '0')}.${c.y}`, dayWord(di % 7),
      ...cols.map(g => { const t = col(g)[i]; return t === null ? '' : localHM(t); })];
  });
  const download = () => {
    const blob = new Blob([toCsv(header, rows)], { type: 'text/csv;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `zmanim-${city.name}-${demo}.csv`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 1000);
  };

  return (
    <Slide
      wide
      className="has-print"
      kicker="היום · 6"
      title={<>לוח זמנים שנתי · {yearHeb(demo)}</>}
      text={<>
        <p>כל השנה בטבלה אחת, לפי השיטות שבחרתם בשקף ״זמני היום״ ולפי המקום שנבחר. אפשר להוריד כקובץ CSV או להדפיס.</p>
        <Engine title="עמודות">
          <div className="ctl"><CityControl /></div>
          <div className="colpick" role="group" aria-label="אילו זמנים להציג">
            {ALL_GROUPS.map(g => (
              <label key={g} className="chk">
                <input type="checkbox" checked={cols.includes(g)}
                  onChange={e => setCols(e.target.checked ? ALL_GROUPS.filter(x => x === g || cols.includes(x)) : cols.filter(x => x !== g))} />
                {GROUP_NAME[g]} <small>({pick(g).name})</small>
              </label>
            ))}
          </div>
          <div className="ctl">
            <button type="button" className="btn pri" onClick={download}>הורדה כ־CSV</button>
            <button type="button" className="btn" onClick={() => window.print()}>הדפסה</button>
          </div>
        </Engine>
        <NotARuling />
      </>}
      stage={<>
        <Viz className="explore-only">
          <p className="chart-title">בוקר: {GROUP_NAME.alot} ו{GROUP_NAME.sunrise}</p>
          <LineChart aria="עלות השחר והזריחה לאורך השנה" xLabels={monthTicks} yTicks={ticks(['alot', 'sunrise'])} yFmt={hhmm} tipX={tip} height={200}
            series={[
              { key: 'alot', label: `${GROUP_NAME.alot} ${pick('alot').name}`, color: 'var(--s1)', values: hrs('alot') },
              { key: 'sunrise', label: GROUP_NAME.sunrise, color: 'var(--s2)', values: hrs('sunrise') },
            ]} />
          <p className="chart-title">ערב: {GROUP_NAME.sunset} ו{GROUP_NAME.tzeit}</p>
          <LineChart aria="השקיעה וצאת הכוכבים לאורך השנה" xLabels={monthTicks} yTicks={ticks(['sunset', 'tzeit'])} yFmt={hhmm} tipX={tip} height={200}
            series={[
              { key: 'sunset', label: GROUP_NAME.sunset, color: 'var(--s3)', values: hrs('sunset') },
              { key: 'tzeit', label: `צאת ${pick('tzeit').name}`, color: 'var(--s4)', values: hrs('tzeit') },
            ]} />
        </Viz>
        <div className="viz table-wrap print-table">
          <table className="annual">
            <caption>זמני היום ב{city.name}, שנת {yearHeb(demo)}. מידע לימודי, לא פסק הלכה.</caption>
            <thead><tr>{header.map(h => <th key={h} scope="col">{h}</th>)}</tr></thead>
            <tbody>
              {rows.map((r, i) => (
                <tr key={days[i]} className={days[i] % 7 === 6 ? 'shabbat' : ''}>
                  <th scope="row">{r[0]}</th>
                  <td><Num>{r[1]}</Num></td>
                  <td>{r[2]}</td>
                  {r.slice(3).map((v, k) => <td key={k}><Num>{v || '—'}</Num></td>)}
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </>}
    />
  );
}
