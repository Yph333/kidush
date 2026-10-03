import { useMemo, useState } from 'react';
import { seasons } from '../../engines/astro';
import { H0_STANDARD, localHM, solarNoon, sunAltAz, sunAt } from '../../engines/zmanim';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num } from '../../components/text';
import type { SkyDomeProps, SkyPath } from '../../scenes/skyDome';
import { CityControl, DateControl, NotARuling, usePick, useZDay } from './shared';

const load = () => import('../../scenes/skyDome').then(m => m.default);
const MIN = 60000;
const SEASON_COLOR = { eq: 0x88c5d8, summer: 0xef8f76, winter: 0x7fce9c };

/** Sun path from 3 h before sunrise to 3 h after sunset, every 10 minutes. */
function pathFor(y: number, m: number, d: number, p: { lat: number; lon: number }) {
  const rise = sunAt(y, m, d, p, H0_STANDARD, true).ms ?? solarNoon(y, m, d, p) - 6 * 3600000;
  const set = sunAt(y, m, d, p, H0_STANDARD, false).ms ?? solarNoon(y, m, d, p) + 6 * 3600000;
  const pts: { alt: number; az: number }[] = [];
  for (let t = rise - 180 * MIN; t <= set + 180 * MIN; t += 10 * MIN) pts.push(sunAltAz(t, p));
  return { pts, rise, set };
}

/** 2D: altitude against azimuth, looking south (east on the left, west on the right). */
function Flat({ p }: { p: SkyDomeProps }) {
  const W = 760, H = 300, y0 = 190, sc = 2.2, X = (az: number) => 20 + ((az - 30) / 300) * (W - 40), Y = (alt: number) => y0 - alt * sc;
  const col = (c: number) => `#${c.toString(16).padStart(6, '0')}`;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="מסלול השמש: גובה מול כיוון, במבט דרומה">
      <rect x="0" y={y0} width={W} height={H - y0} fill="#1E2A1F" />
      <rect x="0" y="0" width={W} height={y0} fill="#0b1226" />
      {p.circles.map(c => (
        <g key={c.label}>
          <line x1="0" x2={W} y1={Y(c.alt)} y2={Y(c.alt)} stroke={c.alt < 0 ? '#88c5d8' : '#7fce9c'} strokeDasharray={c.alt < 0 ? '5 4' : undefined} opacity=".8" />
          <text x="6" y={Y(c.alt) - 3} fill="#c9d8c4" fontSize="11">{c.label}</text>
        </g>
      ))}
      {p.paths.map(s => (
        <polyline key={s.key} fill="none" stroke={col(s.color)} strokeWidth={s.key === 'today' ? 3 : 2} strokeDasharray={s.key === 'today' ? undefined : '6 4'}
          points={s.points.filter(q => q.az > 30 && q.az < 330).map(q => `${X(q.az).toFixed(1)},${Y(q.alt).toFixed(1)}`).join(' ')} />
      ))}
      <circle cx={X(p.sun.az)} cy={Y(p.sun.alt)} r="8" className="sunf" />
      {([[90, 'מזרח'], [180, 'דרום'], [270, 'מערב']] as const).map(([a, t]) => <text key={a} x={X(a)} y={y0 + 22} fill="#c9d8c4" fontSize="14" textAnchor="middle" fontWeight="700">{t}</text>)}
    </svg>
  );
}

export function Dome() {
  const { y, m, d, p, city } = useZDay();
  const pick = usePick();
  const [show, setShow] = useState({ eq: true, summer: true, winter: true });
  const today = useMemo(() => pathFor(y, m, d, p), [y, m, d, p.lat, p.lon]);
  const [k, setK] = useState<number | null>(null);
  const span = Math.round((today.set - today.rise) / MIN) + 120;
  const kk = k === null ? Math.round(span / 2) : Math.min(span, k);
  const t = today.rise - 60 * MIN + kk * MIN;
  const player = usePlay(dt => setK(prev => { const v = (prev ?? Math.round(span / 2)) + dt * 90; return v > span ? 0 : v; }));

  const seasonPaths = useMemo(() => {
    const [eq, summer, , winter] = seasons(y).map(ms => new Date(ms));
    const at = (dt: Date) => pathFor(dt.getUTCFullYear(), dt.getUTCMonth(), dt.getUTCDate(), p).pts;
    return { eq: at(eq), summer: at(summer), winter: at(winter) };
  }, [y, p.lat, p.lon]);

  const degOf = (g: 'alot' | 'tzeit') => { const def = pick(g).def; return def.kind === 'degrees' ? def.deg : g === 'alot' ? 16.1 : 8.5; };
  const props = useMemo<SkyDomeProps>(() => {
    const paths: SkyPath[] = [{ key: 'today', label: 'היום', color: 0xf4c33f, points: today.pts }];
    if (show.summer) paths.push({ key: 'summer', label: 'היום הארוך', color: SEASON_COLOR.summer, points: seasonPaths.summer });
    if (show.eq) paths.push({ key: 'eq', label: 'השוויון', color: SEASON_COLOR.eq, points: seasonPaths.eq });
    if (show.winter) paths.push({ key: 'winter', label: 'היום הקצר', color: SEASON_COLOR.winter, points: seasonPaths.winter });
    return {
      paths, sun: sunAltAz(t, p),
      circles: [
        { alt: 0, label: 'האופק' },
        { alt: H0_STANDARD, label: 'זריחה ושקיעה (−0.83°)' },
        { alt: -degOf('tzeit'), label: `צאת הכוכבים (−${degOf('tzeit')}°)` },
        { alt: -degOf('alot'), label: `עלות השחר (−${degOf('alot')}°)` },
      ],
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [today, seasonPaths, show, t]);
  const s = sunAltAz(t, p);

  return (
    <Slide
      wide
      kicker="היום · 6"
      title="כיפת השמיים"
      text={<>
        <p>עומדים במרכז הכיפה. השמש עולה במזרח, מטפסת בקשת לכיוון דרום, ושוקעת במערב.</p>
        <p>בקיץ הקשת ארוכה וגבוהה, ובחורף קצרה ונמוכה. המעגלים שמתחת לאופק הם ״קווי הגובה״ של עלות השחר ושל צאת הכוכבים: כשהשמש חוצה אותם, הזמן הגיע.</p>
        <Engine>
          <div className="ctl"><DateControl /><CityControl /></div>
          <div className="colpick">
            {([['summer', 'היום הארוך'], ['eq', 'יום השוויון'], ['winter', 'היום הקצר']] as const).map(([key, t2]) => (
              <label key={key} className="chk"><input type="checkbox" checked={show[key]} onChange={e => setShow({ ...show, [key]: e.target.checked })} />{t2}</label>
            ))}
          </div>
          <div className="tline">
            <input type="range" min={0} max={span} value={Math.round(kk)} onChange={e => setK(+e.target.value)} aria-label="השעה" />
            <div className="tread"><Num>{localHM(t)}</Num>: השמש בגובה <Num>{s.alt.toFixed(1)}°</Num>, כיוון <Num>{Math.round(s.az)}°</Num><small>{city.name}</small></div>
          </div>
        </Engine>
        <NotARuling />
      </>}
      stage={
        <Viz>
          <Scene3D load={load} props={props} label={`כיפת השמיים מעל ${city.name} ומסלולי השמש`}
            play={{ ...player, label: 'הפעל: השמש במהלך היום' }}
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'south', label: 'מבט דרומה' }, { id: 'top', label: 'מלמעלה' }]}
            fallback={<Flat p={props} />} />
        </Viz>
      }
    />
  );
}
