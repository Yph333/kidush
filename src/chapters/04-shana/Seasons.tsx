import { useMemo, useState } from 'react';
import { gDate, tekufotAbsolute, yearHeb } from '../../engines/calendar';
import { HOUR, TofMs, localParts, moladMs, seasons, sunEcl } from '../../engines/astro';
import { Term } from '../../components/Glossary';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num, Tag } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import type { EarthSeasonsProps, SeasonMarker } from '../../scenes/earthSeasons';
import { KIND_COLOR, type TekufaKind } from '../../scenes/shared';

const load = () => import('../../scenes/earthSeasons').then(m => m.default);
const NAMES = ['תשרי', 'טבת', 'ניסן', 'תמוז'] as const;
const sunLonAt = (ms: number) => sunEcl(TofMs(ms).T).lam;
const fmt = (ms: number) => { const p = localParts(ms); return `${String(p.d).padStart(2, '0')}.${String(p.m + 1).padStart(2, '0')}.${p.y}`; };
const days = (a: number, b: number) => (a - b) / (24 * HOUR);
const hex = (c: number) => `#${c.toString(16).padStart(6, '0')}`;

/** 2D: the orbit from above with the three sets of markers. */
function Orbit2D({ p }: { p: EarthSeasonsProps }) {
  const c = 200, R = 150;
  const P = (sunLon: number, r = R) => { const a = ((sunLon + 180) * Math.PI) / 180; return [c + r * Math.cos(a), c - r * Math.sin(a)]; };
  const [ex, ey] = P(p.sunLon);
  return (
    <svg viewBox="0 0 400 400" direction="ltr" role="img" aria-label="מסלול כדור הארץ מלמעלה, עם התקופות">
      <rect width="400" height="400" fill="#0b1226" />
      <circle cx={c} cy={c} r={R} fill="none" stroke="#7d88a8" />
      <circle cx={c} cy={c} r="16" fill="#f4c33f" />
      {p.markers.map((m, i) => { const [x, y] = P(m.sunLon); const [lx, ly] = P(m.sunLon, R + (m.kind === 'true' ? 20 : m.kind === 'shmuel' ? 34 : 48)); return (
        <g key={i}><circle cx={x} cy={y} r="5" fill={hex(KIND_COLOR[m.kind])} /><text x={lx} y={ly} fill={hex(KIND_COLOR[m.kind])} fontSize="10" textAnchor="middle">{m.label}</text></g>
      ); })}
      <circle cx={ex} cy={ey} r="10" fill="#3e7cb8" stroke="#fff" />
    </svg>
  );
}

export function Seasons() {
  const yr = useSlideYear();
  const y = yr.y;
  // civil year in which Nisan of Hebrew year y falls
  const gy = gDate(Math.floor(tekufotAbsolute(y, 'shmuel')[2] / 25920)).getUTCFullYear();
  const rows = useMemo(() => {
    const tru = seasons(gy);                                    // Mar, Jun, Sep, Dec of gy
    const trueByName = [seasons(gy - 1)[2], seasons(gy - 1)[3], tru[0], tru[1]];   // Tishrei, Tevet (previous civil year), Nisan, Tammuz
    const sh = tekufotAbsolute(y, 'shmuel').map(moladMs), ra = tekufotAbsolute(y, 'ravAdda').map(moladMs);
    return NAMES.map((n, i) => ({ name: n, tru: trueByName[i], sh: sh[i], ra: ra[i] }));
  }, [y, gy]);

  const [k, setK] = useState(2);   // which tekufa the earth sits at (index), or slider
  const [t, setT] = useState<number | null>(null);
  const now = t ?? rows[k].tru;

  const props = useMemo<EarthSeasonsProps>(() => {
    const markers: SeasonMarker[] = [];
    const lab: Record<TekufaKind, string> = { true: 'אמיתית', shmuel: 'שמואל', ravAdda: 'רב אדא' };
    rows.forEach(r => {
      markers.push({ sunLon: sunLonAt(r.tru), kind: 'true', label: r.name });
      markers.push({ sunLon: sunLonAt(r.sh), kind: 'shmuel', label: lab.shmuel });
      markers.push({ sunLon: sunLonAt(r.ra), kind: 'ravAdda', label: lab.ravAdda });
    });
    return { sunLon: sunLonAt(now), markers };
  }, [rows, now]);

  const tlo = rows[0].tru - 20 * 24 * HOUR, thi = rows[3].ra + 40 * 24 * HOUR;

  return (
    <Slide
      wide
      kicker="השנה · 3"
      title="כדור הארץ, העונות והתקופות"
      text={<>
        <p>ציר כדור הארץ נוטה ב־<Num>23.44°</Num>. בחצי שנה הקוטב הצפוני פונה אל השמש (קיץ אצלנו), ובחצי השני ממנה (חורף). ארבע הנקודות שביניהן הן ארבע <Term k="tekufa">התקופות</Term>.</p>
        <p>בגמרא יש שני חשבונות לתקופות: של <strong>שמואל</strong> (שנה של <Num>365¼</Num> ימים) ושל <strong>רב אדא</strong> (קצרה מעט יותר). שניהם מאחרים היום אחרי התקופה האמיתית: שמואל בכשבועיים וחצי, ורב אדא בכשבוע.</p>
        <Engine><div className="ctl"><SlideYear yr={yr} /></div></Engine>
      </>}
      more={<p>״טל ומטר״ בחוץ לארץ מתחילים לפי תקופת תשרי של שמואל (ששים יום אחריה). מכיוון שתקופת שמואל מאחרת יותר ויותר, השאלה זזה כיום לתחילת דצמבר. המניין המדויק של הימים: TODO: verify.</p>}
      stage={<>
        <Viz>
          <Scene3D load={load} props={props} label="כדור הארץ במסלולו סביב השמש, עם ציר נוטה והתקופות"
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'earth', label: 'קרוב לכדור הארץ' }]}
            fallback={<Orbit2D p={props} />} />
          <p className="note">ירוק: התקופה האמיתית. אדום: שמואל. תכלת: רב אדא. המרחקים לא בקנה מידה.</p>
        </Viz>
        <Engine title="התקופות של השנה">
          <div className="table-wrap">
            <table className="kt">
              <thead><tr><th>תקופה</th><th><Tag tone="ok">אמיתית</Tag></th><th><Tag tone="bad">שמואל</Tag></th><th><Tag tone="leap">רב אדא</Tag></th></tr></thead>
              <tbody>
                {rows.map((r, i) => (
                  <tr key={r.name} className={t === null && k === i ? 'hl' : ''} onClick={() => { setK(i); setT(null); }} style={{ cursor: 'pointer' }}>
                    <td>{r.name}</td>
                    <td><Num>{fmt(r.tru)}</Num></td>
                    <td><Num>{fmt(r.sh)}</Num> <small className="note">(<Num>{`+${days(r.sh, r.tru).toFixed(1)}`}</Num>)</small></td>
                    <td><Num>{fmt(r.ra)}</Num> <small className="note">(<Num>{`+${days(r.ra, r.tru).toFixed(1)}`}</Num>)</small></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <p className="note">בסוגריים: כמה ימים אחרי התקופה האמיתית. תקופת תשרי היא זו שלפני ניסן של {yearHeb(y)}. זמני התקופות בשעון ישראל.</p>
          <div className="tline">
            <input type="range" min={0} max={1000} value={Math.round(((now - tlo) / (thi - tlo)) * 1000)} aria-label="מקום כדור הארץ במסלול"
              onChange={e => setT(tlo + ((thi - tlo) * +e.target.value) / 1000)} />
            <div className="tread"><Num>{fmt(now)}</Num></div>
          </div>
        </Engine>
      </>}
    />
  );
}
