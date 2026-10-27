import { useMemo, useState } from 'react';
import { gDate, moladTotal, rh } from '../../engines/calendar';
import { D2R, HOUR, R2D, TofMs, localParts, moladMs, moonEcl, moonNode, nrm, sunEcl } from '../../engines/astro';
import { ECLIPSE_SEASON_DAYS, type Eclipse, SAROS_DAYS, eclipsesBetween, sarosOf, shadowAxis, visibilityAt } from '../../engines/eclipses';
import { centralPath, pathRegions, regionsOf, visibilityGrid } from '../../lib/eclipseMap';
import { FamilyTable, Panorama, SeasonsStrip, WorldMap, sarosFamily } from './eclipseViz';
import { EclipseObserver } from './EclipseObserver';
import { Term } from '../../components/Glossary';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num, Tag } from '../../components/text';
import { CityControl, useZDay } from '../02-yom/shared';
import { hrs } from '../../lib/format';
import type { EclipsePhase, EclipseSceneProps } from '../../scenes/eclipse';
import { useStore } from '../../state/store';

const load = () => import('../../scenes/eclipse').then(m => m.default);
const DAY = 86400000;
const TYPE: Record<string, string> = {
  'solar-total': 'ליקוי חמה מלא', 'solar-annular': 'ליקוי חמה טבעתי', 'solar-hybrid': 'ליקוי חמה משולב', 'solar-partial': 'ליקוי חמה חלקי',
  'lunar-total': 'ליקוי לבנה מלא', 'lunar-partial': 'ליקוי לבנה חלקי', 'lunar-penumbral': 'ליקוי לבנה בפלג הצל',
};
const name = (e: Eclipse) => TYPE[`${e.kind}-${e.type}`];
const civ = (ms: number) => { const p = localParts(ms); return `${String(p.d).padStart(2, '0')}.${String(p.m + 1).padStart(2, '0')}.${p.y}`; };
const hm = (ms: number) => { const p = localParts(ms); return `${String(p.h).padStart(2, '0')}:${String(p.mi).padStart(2, '0')}`; };

/** Sun, moon and node at an instant, and whether (roughly) an eclipse is in progress — for the picture only. */
function positions(t: number): Omit<EclipseSceneProps, 'exaggerate'> {
  const { T } = TofMs(t), s = sunEcl(T), m = moonEcl(T);
  const psi = Math.acos(Math.cos(m.beta * D2R) * Math.cos((m.lam - s.lam) * D2R)) * R2D;   // sun–moon elongation
  const anti = 180 - psi;
  const phase: EclipsePhase = psi < 1.5 ? 'solar' : anti < 0.98 ? 'lunar-umbral' : anti < 1.54 ? 'lunar-penumbral' : 'none';
  return { sunLon: s.lam, moonLon: m.lam, moonLat: m.beta, node: moonNode(t), phase };
}

/** 2D: the classic diagram — the moon's track near the sun (solar) or near the Earth's shadow (lunar). */
function Track({ e, t }: { e: Eclipse; t: number }) {
  const W = 760, H = 260, cx = W / 2, cy = H / 2, k = 60;               // px per degree
  const ref = (ms: number) => { const p = positions(ms); return e.kind === 'solar' ? p.sunLon : nrm(p.sunLon + 180); };
  const rel = (ms: number) => { const p = positions(ms); return [((p.moonLon - ref(ms) + 540) % 360) - 180, p.moonLat]; };
  const pts: string[] = [];
  for (let dt = -8 * HOUR; dt <= 8 * HOUR; dt += 20 * 60000) { const [x, y] = rel(e.ms + dt); pts.push(`${(cx - x * k).toFixed(1)},${(cy - y * k).toFixed(1)}`); }
  const [mx, my] = rel(t);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="מסלול הירח ליד השמש או ליד צל הארץ">
      <rect width={W} height={H} fill="var(--space)" />
      <line x1="0" x2={W} y1={cy} y2={cy} stroke="#88c5d8" strokeOpacity=".4" />
      {e.kind === 'solar'
        ? <circle cx={cx} cy={cy} r={0.266 * k} className="sunf" />
        : <><circle cx={cx} cy={cy} r={1.28 * k} fill="#334466" opacity=".5" /><circle cx={cx} cy={cy} r={0.72 * k} fill="#000" opacity=".8" /></>}
      <polyline points={pts.join(' ')} fill="none" stroke="#e7c76f" strokeDasharray="5 4" />
      <circle cx={cx - mx * k} cy={cy - my * k} r={0.26 * k} fill={e.kind === 'lunar' ? '#c9c9c9' : '#222a44'} stroke="#e7c76f" opacity=".9" />
      <text x={10} y={20} fill="#c9d8c4" fontSize="13">{e.kind === 'solar' ? 'השמש, ומסלול הירח לידה' : 'צל הארץ (כהה) ופלג הצל, ומסלול הירח דרכם'}</text>
      <text x={10} y={H - 10} fill="#9ba4bf" fontSize="12">קו אופקי: מסלול השמש · מבט גאוצנטרי, לא בקנה מידה של מקום מסוים</text>
    </svg>
  );
}

export function Eclipses() {
  const demo = useStore(s => s.demoYear);
  const { city, p } = useZDay();
  const from = gDate(rh(demo).day).getTime(), to = from + 4 * 365.25 * DAY;
  const list = useMemo(() => eclipsesBetween(from, to), [from, to]);
  const views = useMemo(() => list.map(e => visibilityAt(e, { ...p, name: city.name })), [list, p.lat, p.lon]);
  const [sel, setSel] = useState(0);
  const e = list[Math.min(sel, list.length - 1)];
  const [dt, setDt] = useState(-36 * HOUR);
  const t = e.ms + dt;
  const [ex, setEx] = useState(3);
  const player = usePlay(s => setDt(v => (v + s * 4 * HOUR > 36 * HOUR ? -36 * HOUR : v + s * 4 * HOUR)));
  const pos = positions(t);
  const props = useMemo<EclipseSceneProps>(() => ({ ...pos, exaggerate: ex }), [pos.sunLon, pos.moonLon, pos.moonLat, pos.node, pos.phase, ex]);

  // a century of eclipses, for "how often"
  const stats = useMemo(() => {
    const all = eclipsesBetween(Date.UTC(2001, 0, 1), Date.UTC(2101, 0, 1));
    const s = all.filter(x => x.kind === 'solar'), l = all.filter(x => x.kind === 'lunar');
    return { s: s.length, total: s.filter(x => x.type === 'total').length, l: l.length, lTotal: l.filter(x => x.type === 'total').length };
  }, []);
  // the calendar's molad of that month vs. the eclipse (true conjunction / opposition)
  const molad = useMemo(() => {
    let best = Infinity, ms = 0;
    for (let y = demo - 1; y <= demo + 5; y++) for (let mi = 0; mi < 13; mi++) {
      const m = moladMs(moladTotal(y, mi)) + (e.kind === 'lunar' ? 14.765 * DAY : 0);
      if (Math.abs(m - e.ms) < best) { best = Math.abs(m - e.ms); ms = m; }
    }
    return ms;
  }, [e, demo]);
  const v = views[Math.min(sel, views.length - 1)];
  // where on Earth, and the Saros family
  const cells = useMemo(() => visibilityGrid(e), [e]);
  const central = useMemo(() => centralPath(e), [e]);
  const where = useMemo(() => regionsOf(cells), [cells]);
  const along = useMemo(() => pathRegions(central), [central]);
  const fam = useMemo(() => sarosFamily(e), [e]);
  const [showFam, setShowFam] = useState(false);
  const S = sarosOf(e);
  const famDots = showFam && e.kind === 'solar'
    ? fam.map(x => { const g = shadowAxis(x.ms); return { lat: g.lat, lon: g.lon, label: String(new Date(x.ms).getUTCFullYear()), current: x.k === e.k }; })
    : undefined;
  const join = (xs: string[]) => (xs.length <= 1 ? xs.join('') : `${xs.slice(0, -1).join(', ')} ו${xs[xs.length - 1]}`);

  return (
    <Slide
      wide
      kicker="החודש · 5"
      title="ליקויי חמה ולבנה"
      text={<>
        <p><strong>מתי?</strong> ליקוי חמה יכול לקרות רק במולד, וליקוי לבנה רק במילוא. אבל לא בכל חודש: מסלול הירח נוטה, ולרוב הירח עובר מעל השמש (או מעל צל הארץ) או מתחתיה. ליקוי קורה רק כשהמולד או המילוא חלים ליד <Term k="rosh">הראש או הזנב</Term>.</p>
        <p><strong>איפה?</strong> בליקוי חמה צל הירח קטן, ונופל על פס צר על פני כדור הארץ. רק שם הליקוי מלא, ובאזור רחב סביבו הוא חלקי. ליקוי לבנה נראה מכל חצי כדור הארץ שבו לילה באותה שעה.</p>
        <p><strong>כל כמה זמן?</strong> השמש עוברת ליד צומת פעמיים בשנה, כל כ־<Num>{ECLIPSE_SEASON_DAYS.toFixed(1)}</Num> ימים (״עונת ליקויים״). בכל שנה יש <Num>2–5</Num> ליקויי חמה. אחרי <Num>18</Num> שנה ו־<Num>11</Num> ימים (מחזור ״סרוס״, <Num>{SAROS_DAYS.toFixed(1)}</Num> ימים) הליקויים חוזרים בסדר דומה.</p>
        <p><strong>הסדר.</strong> הליקויים מסודרים בשתי דרכים:</p>
        <ul className="order-list">
          <li><strong>עונות:</strong> הליקויים באים בקבוצות. בכל עונה יש ליקוי חמה וליקוי לבנה, שבועיים זה מזה (ולפעמים שלושה ליקויים), והעונה הבאה מגיעה כחצי שנה אחרי.</li>
          <li><strong>משפחות סרוס:</strong> כל ליקוי שייך למשפחה ממוספרת. כל <Num>18</Num> שנה ו־<Num>11</Num> ימים בא הבן הבא במשפחה. הוא דומה מאוד לקודמו, אבל הצל זז מעט צפונה או דרומה, ומשפחה שלמה נמשכת כ־<Num>1200–1400</Num> שנה.</li>
        </ul>
        <Engine title="הליקוי שנבחר">
          <div className="ctl">
            <CityControl />
            <label className="fld">הגדלת הנטייה בציור
              <select value={ex} onChange={x => setEx(+x.target.value)}>{[1, 2, 3, 5].map(n => <option key={n} value={n}>{n === 1 ? 'בלי' : `×${n}`}</option>)}</select>
            </label>
          </div>
          <Facts items={[
            ['סוג', name(e)],
            ['שיא הליקוי (שעון ישראל)', <><Num>{civ(e.ms)}</Num> <Num>{hm(e.ms)}</Num></>],
            [e.kind === 'solar' ? 'נראה מ' + city.name : 'נראה מ' + city.name,
              v.visible ? <Tag tone="ok">{e.kind === 'solar' ? <>כן, כ־<Num>{Math.round(v.value * 100)}%</Num> מקוטר השמש</> : 'כן'}</Tag> : <Tag tone="bad">לא</Tag>],
            [e.kind === 'solar' ? 'המולד הממוצע של החודש' : 'המולד ועוד חצי חודש', <><Num>{hrs(Math.abs(molad - e.ms))}</Num> שעות {molad > e.ms ? 'אחרי' : 'לפני'} הליקוי</>],
            ['γ (מרחק ציר הצל ממרכז הארץ)', <Num>{e.gamma.toFixed(3)}</Num>],
            ['משפחת סרוס', <>מספר <Num>{S.saros}</Num></>],
          ]} />
          <div className="where">
            <b>איפה רואים אותו?</b>
            {e.kind === 'solar' && central.length > 0 && <p className="m0">ליקוי {e.type === 'total' ? 'מלא' : e.type === 'annular' ? 'טבעתי' : 'משולב'} בפס צר שעובר ב{join(along)}.</p>}
            <p className="m0">{e.kind === 'solar' ? (central.length ? 'ליקוי חלקי' : 'נראה כליקוי חלקי') : 'נראה'} מ{join(where.land) || 'אזורים מעטים בלבד'}{where.sea.length ? <>, ומעל {join(where.sea)}</> : ''}.</p>
            <p className="note">בערך, לפי רשת של <Num>4°</Num>.</p>
          </div>
          <div className="tline">
            <input type="range" min={-36} max={36} step={0.25} value={dt / HOUR} onChange={x => setDt(+x.target.value * HOUR)} aria-label="זמן ביחס לשיא הליקוי" />
            <div className="tread"><Num>{`${dt >= 0 ? '+' : '−'}${Math.abs(dt / HOUR).toFixed(1)}`}</Num> שעות משיא הליקוי{pos.phase !== 'none' && <> · <Tag tone="moon">{pos.phase === 'solar' ? 'צל הירח על הארץ' : pos.phase === 'lunar-umbral' ? 'הירח בצל הארץ' : 'הירח בפלג הצל'}</Tag></>}</div>
          </div>
        </Engine>
      </>}
      more={<>
        <p>במאה ה־<Num>21</Num> (<Num>2001–2100</Num>) יש <Num>{stats.s}</Num> ליקויי חמה, מהם <Num>{stats.total}</Num> מלאים, ו־<Num>{stats.l}</Num> ליקויי לבנה (כולל ליקויים בפלג הצל), מהם <Num>{stats.lTotal}</Num> מלאים.</p>
        <p>הליקוי קורה במולד ה<strong>אמיתי</strong>, ולא במולד הממוצע של הלוח. לכן ההפרש ביניהם (בעובדות למעלה) הוא בדיוק הפער שראינו בשקף ״מולד ממוצע ומולד אמיתי״.</p>
        <p className="note">החישוב לפי Meeus, פרק 54. הנראות ממקום מסוים מקורבת. לליקויים שתלמידים מתכננים לצפות בהם, כדאי לבדוק גם במקור ייעודי.</p>
      </>}
      stage={<>
        <Viz>
          <Scene3D load={load} props={props} label="השמש, כדור הארץ וצילו, והירח במסלולו הנטוי"
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'side', label: 'מהצד' }, { id: 'top', label: 'מלמעלה' }]}
            play={{ ...player, label: 'הפעל: הירח עובר ליד הצומת' }}
            fallback={<Track e={e} t={t} />} />
        </Viz>
        {e.kind === 'solar' && (
          <Viz>
            <p className="chart-title">מה רואים מהקרקע</p>
            <EclipseObserver key={e.k} e={e} home={{ lat: p.lat, lon: p.lon, name: city.name }} />
          </Viz>
        )}
        <Viz>
          <p className="chart-title">איפה רואים את {name(e)} של <Num>{civ(e.ms)}</Num></p>
          <WorldMap e={e} cells={cells} central={central} home={{ lat: p.lat, lon: p.lon, name: city.name }} family={famDots} />
          <p className="note">
            {e.kind === 'solar'
              ? <>צהוב: האזור שבו הליקוי נראה כחלקי (ככל שכהה יותר, השמש מכוסה יותר) · קו אדום: פס הליקוי המלא או הטבעתי · כוכב: שיא הליקוי.</>
              : <>תכלת: האזור שבו הירח מעל האופק בזמן הליקוי.</>}
          </p>
          {e.kind === 'solar' && <label className="chk"><input type="checkbox" checked={showFam} onChange={x => setShowFam(x.target.checked)} />הצגת בני משפחת הסרוס על המפה (שיא הליקוי של כל אחד)</label>}
        </Viz>
        <Viz>
          <p className="chart-title">הסדר: עונות הליקויים</p>
          <SeasonsStrip list={list} sel={Math.min(sel, list.length - 1)} onPick={i => { setSel(i); setDt(-36 * HOUR); }} />
        </Viz>
        <Viz className="table-wrap">
          <p className="chart-title">הסדר: משפחת סרוס <Num>{S.saros}</Num>, כל <Num>18</Num> שנה ו־<Num>11</Num> ימים</p>
          <FamilyTable fam={fam} e={e} />
          <p className="note">{e.kind === 'solar' ? 'שימו לב: γ ורוחב שיא הליקוי משתנים בהדרגה מבן לבן. הצל נודד לאט מקוטב אחד לקוטב השני לאורך חיי המשפחה.' : 'γ משתנה בהדרגה מבן לבן, וכך גם גודל הליקוי.'}</p>
        </Viz>
        <Viz className="explore-only">
          <p className="chart-title">כל ה{e.kind === 'solar' ? 'ליקויי חמה' : 'ליקויי לבנה'} בשנים <Num>1000–3000</Num>, לפי משפחות</p>
          <Panorama e={e} />
          <p className="note">כל שורה היא משפחה אחת: היא מתחילה בליקויים חלקיים (תכלת), עוברת לליקויים מלאים או טבעתיים, ומסתיימת שוב בחלקיים. המשפחות חופפות זו את זו, וכך נוצר הפס המשופע. הקו האנכי הוא הליקוי שנבחר.</p>
        </Viz>
        <Viz className="table-wrap">
          <table className="evt">
            <caption className="note">הליקויים בארבע השנים מראש השנה {demo}. לחצו על שורה.</caption>
            <thead><tr><th>תאריך</th><th>סוג</th><th>שעה (שעון ישראל)</th><th>ב{city.name}</th></tr></thead>
            <tbody>
              {list.map((x, i) => (
                <tr key={x.k} className={i === sel ? 'sel' : ''} tabIndex={0} onClick={() => { setSel(i); setDt(-36 * HOUR); }}
                  onKeyDown={k => { if (k.key === 'Enter') { setSel(i); setDt(-36 * HOUR); } }}>
                  <td><Num>{civ(x.ms)}</Num></td>
                  <td>{name(x)}</td>
                  <td><Num>{hm(x.ms)}</Num></td>
                  <td>{views[i].visible ? <Tag tone="ok">{x.kind === 'solar' ? <>נראה, <Num>{Math.round(views[i].value * 100)}%</Num></> : 'נראה'}</Tag> : <Tag tone="bad">לא נראה</Tag>}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </Viz>
      </>}
    />
  );
}
