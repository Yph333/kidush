import { useState } from 'react';
import {
  H0_STANDARD, type HorizonPoint, type ZPlace, dip, horizonAlt, localHMS, refraction, sunAltAz, sunAt, visibleSun,
} from '../../engines/zmanim';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Num, Tag } from '../../components/text';
import HORIZONS from '../../content/horizons.json';
import { CityControl, DateControl, NotARuling, useZDay } from './shared';

const MIN = 60000;
const EAST = [60, 75, 90, 105, 120], WEST = [240, 255, 270, 285, 300];
type Vals = (number | null)[];
const OPEN: Vals = [null, null, null, null, null];
/** null = open horizon in that direction (nothing above the sea horizon) */
const PRESETS: { name: string; east: Vals; west: Vals }[] = [
  { name: 'אופק פתוח', east: OPEN, west: OPEN },
  { name: 'הרים במזרח', east: [1.5, 2, 2.5, 2, 1.5], west: OPEN },
  { name: 'עיר בעמק', east: [2, 3, 3.5, 3, 2], west: [1.5, 2, 2.5, 2, 1.5] },
];

/** Skyline seen facing east (north on the left) or west (south on the left), with the sun's path near the horizon. */
function Skyline({ azs, prof, p, y, m, d, rising }: { azs: number[]; prof: HorizonPoint[]; p: ZPlace; y: number; m: number; d: number; rising: boolean }) {
  const W = 360, H = 170, pad = 24;
  const a0 = azs[0] - 10, a1 = azs[azs.length - 1] + 10, lo = -2;
  const hi = Math.max(6, Math.ceil(Math.max(0, ...prof.filter(q => q.az >= a0 && q.az <= a1).map(q => q.alt)) + 1));
  // facing east: north (smaller az) on the left; facing west: south (smaller az) on the left
  const X = (az: number) => pad + ((az - a0) / (a1 - a0)) * (W - 2 * pad);
  const Y = (alt: number) => H - pad - ((alt - lo) / (hi - lo)) * (H - 2 * pad);
  const sea = -dip(p.elevation ?? 0);
  const sky = Array.from({ length: 41 }, (_, i) => a0 + (i / 40) * (a1 - a0)).map(az => `${X(az).toFixed(1)},${Y(Math.max(lo, Math.max(sea, horizonAlt(prof, az) ?? sea))).toFixed(1)}`);
  const ev = sunAt(y, m, d, p, H0_STANDARD, rising).ms;
  const path: string[] = [];
  if (ev) for (let k = -40; k <= 40; k += 2) {
    const s = sunAltAz(ev + k * MIN, p);
    if (s.az >= a0 && s.az <= a1) path.push(`${X(s.az).toFixed(1)},${Y(Math.min(hi, Math.max(lo, s.alt))).toFixed(1)}`);
  }
  const vis = visibleSun(y, m, d, { ...p, horizon: prof.length ? prof : undefined }, rising).ms;
  const vs = vis ? sunAltAz(vis, p) : null;
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label={rising ? 'האופק במזרח ומסלול השמש בזריחה' : 'האופק במערב ומסלול השמש בשקיעה'}>
      <rect x={pad} y={pad} width={W - 2 * pad} height={H - 2 * pad} className="wd" />
      <line x1={pad} x2={W - pad} y1={Y(0)} y2={Y(0)} className="refline" />
      <text x={W - pad - 2} y={Y(0) - 3} className="reflabel" textAnchor="end">אופק מתמטי 0°</text>
      <polygon points={`${pad},${H - pad} ${sky.join(' ')} ${W - pad},${H - pad}`} className="skyline" />
      {path.length > 1 && <polyline points={path.join(' ')} fill="none" stroke="var(--s4)" strokeWidth="2" strokeDasharray="5 4" />}
      {vs && <circle cx={X(vs.az)} cy={Y(vs.alt)} r="6" className="sunf" stroke="var(--panel)" strokeWidth="2" />}
      {[a0 + 10, (a0 + a1) / 2, a1 - 10].map(az => <text key={az} x={X(az)} y={H - 6} className="reflabel" textAnchor="middle" direction="ltr">{Math.round(az)}°</text>)}
      <text x={pad} y={14} className="reflabel">{rising ? 'צפון־מזרח' : 'דרום־מערב'}</text>
      <text x={W - pad} y={14} className="reflabel" textAnchor="end">{rising ? 'דרום־מזרח' : 'צפון־מערב'}</text>
    </svg>
  );
}

const toProfile = (azs: number[], vals: Vals): HorizonPoint[] =>
  azs.flatMap((az, i) => (vals[i] === null ? [] : [{ az, alt: vals[i]! }]));

function ProfileInputs({ label, azs, vals, onChange }: { label: string; azs: number[]; vals: Vals; onChange: (v: Vals) => void }) {
  return (
    <fieldset className="profile">
      <legend>{label}: גובה קו האופק (מעלות) לפי כיוון. ריק = אופק פתוח</legend>
      {azs.map((az, i) => (
        <label key={az} className="fld">
          <span className="num">{az}°</span>
          <input type="number" step={0.1} min={-2} max={10} value={vals[i] ?? ''} placeholder="פתוח"
            onChange={e => { const v = [...vals]; v[i] = e.target.value === '' ? null : Math.max(-2, Math.min(10, +e.target.value)); onChange(v); }} />
        </label>
      ))}
    </fieldset>
  );
}

type HorizonCity = { lat: number; lon: number; ground: number; profile: number[][] };
const SRTM = HORIZONS.cities as Record<string, HorizonCity>;

export function Horizon() {
  const { y, m, d, p: base, city } = useZDay();
  const srtmCity = SRTM[city.name];
  const [mode, setMode] = useState<'manual' | 'srtm'>('manual');
  const useSrtm = mode === 'srtm' && !!srtmCity;
  const [elev, setElev] = useState<number | null>(null);
  const h = elev ?? (useSrtm ? srtmCity.ground : base.elevation ?? 0);
  const [east, setEast] = useState(PRESETS[0].east);
  const [west, setWest] = useState(PRESETS[0].west);
  const p: ZPlace = { ...base, elevation: h };
  const profile: HorizonPoint[] = useSrtm
    ? srtmCity.profile.map(([az, alt]) => ({ az, alt }))
    : [...toProfile(EAST, east), ...toProfile(WEST, west)];

  const dp = dip(h);
  const ev = (rising: boolean) => ({
    mishor: sunAt(y, m, d, p, H0_STANDARD, rising).ms,
    elev: sunAt(y, m, d, p, H0_STANDARD - dp, rising).ms,
    vis: visibleSun(y, m, d, { ...p, horizon: profile.length ? profile : undefined }, rising),
  });
  const R = ev(true), S = ev(false);
  const diff = (a: number | null, b: number | null) => (a === null || b === null ? '—' : `${((a - b) / MIN).toFixed(1)}`);

  return (
    <Slide
      wide
      kicker="היום · 5"
      title="גובה ואופק"
      text={<>
        <p>״זריחה מישורית״ היא הזריחה מעל אופק שטוח בגובה פני הים. במציאות עומדים על הר או בעמק, ולכן הלוחות נבדלים זה מזה בכמה דקות.</p>
        <p><strong>גובה המקום:</strong> מגובה רב רואים רחוק יותר, והאופק ״יורד״ מתחת לאופק המתמטי. השמש נראית מוקדם יותר בבוקר ומאוחר יותר בערב.</p>
        <p><strong>הרים ומבנים:</strong> קו אופק גבוה מסתיר את השמש. הזריחה הנראית מאוחרת יותר, והשקיעה הנראית מוקדמת יותר.</p>
        <Engine title="החישוב">
          <div className="ctl">
            <DateControl /><CityControl />
            <label className="fld">גובה המקום (מטרים)
              <input type="number" min={0} max={3000} step={10} value={h} onChange={e => setElev(Math.max(0, Math.min(3000, +e.target.value || 0)))} />
            </label>
          </div>
          <Steps rows={[
            { l: 'שקיעת האופק לגובה המקום', v: <Num>{`dip ≈ 1.76′·√${h} = ${(dp * 60).toFixed(1)}′`}</Num> },
            { l: 'גובה מרכז השמש ברגע הזריחה', v: <Num>{`h₀ = −50′ − ${(dp * 60).toFixed(1)}′ = ${(-(50 + dp * 60)).toFixed(1)}′`}</Num>, s: <>שבירת אור <Num>34′</Num> וחצי קוטר <Num>16′</Num>, ועוד שקיעת האופק</> },
            { l: 'זריחה: מישורית · לפי גובה', v: <><Num>{R.mishor ? localHMS(R.mishor) : '—'}</Num> · <Num>{R.elev ? localHMS(R.elev) : '—'}</Num></>, s: <>הגובה מקדים ב־<Num>{diff(R.mishor, R.elev)}</Num> דקות</> },
            { l: 'שקיעה: מישורית · לפי גובה', v: <><Num>{S.mishor ? localHMS(S.mishor) : '—'}</Num> · <Num>{S.elev ? localHMS(S.elev) : '—'}</Num></>, s: <>הגובה מאחר ב־<Num>{diff(S.elev, S.mishor)}</Num> דקות</> },
            { l: 'קו אופק בגובה a: מרכז השמש ב־', v: <Num>{`h₀ = a − R(a) − 16′`}</Num>, s: <>R היא שבירת האור בגובה a (בגובה <Num>0°</Num>: <Num>{(refraction(0) * 60).toFixed(1)}′</Num>; בגובה <Num>2°</Num>: <Num>{(refraction(2) * 60).toFixed(1)}′</Num>)</> },
            { l: 'זריחה נראית · שקיעה נראית', v: <><Num>{R.vis.ms ? localHMS(R.vis.ms) : '—'}</Num> · <Num>{S.vis.ms ? localHMS(S.vis.ms) : '—'}</Num></>, s: <>לעומת מישורית: זריחה <Num>{diff(R.vis.ms, R.mishor)}</Num>, שקיעה <Num>{diff(S.vis.ms, S.mishor)}</Num> דקות</>, c: 'final' },
          ]} />
        </Engine>
        <NotARuling />
      </>}
      more={<p>שלב א׳: מזינים ביד את גובה קו האופק בכמה כיוונים, והמנוע משלים ביניהם. שלב ב׳: פרופיל שחושב מראש מנתוני גובה פתוחים (SRTM), לנקודת מרכז העיר. {HORIZONS.method} נתוני SRTM כוללים בחלקם גם בניינים גבוהים, ולכן בערים צפופות הפרופיל משוער בלבד.</p>}
      stage={<>
        <Engine title="פרופיל האופק">
          <div className="seg" role="group" aria-label="מקור הפרופיל">
            <button type="button" aria-pressed={!useSrtm} onClick={() => { setMode('manual'); setElev(null); }}>שלב א׳: הזנה ידנית</button>
            <button type="button" aria-pressed={useSrtm} disabled={!srtmCity} onClick={() => { setMode('srtm'); setElev(null); }}>שלב ב׳: מחושב מנתוני גובה</button>
          </div>
          {useSrtm ? (
            <p className="note">
              {city.name}: גובה הקרקע בנקודה <Num>{srtmCity.ground}</Num> מ׳; קו האופק הגבוה ביותר
              {' '}<Num>{Math.max(...srtmCity.profile.map(q => q[1])).toFixed(1)}°</Num>. מקור: {HORIZONS.source}, נבנה {HORIZONS.built}.
            </p>
          ) : <>
            <div className="chips">
              <span>מוכנים:</span>
              {PRESETS.map(pr => <button key={pr.name} type="button" onClick={() => { setEast(pr.east); setWest(pr.west); }}>{pr.name}</button>)}
            </div>
            <ProfileInputs label="מזרח" azs={EAST} vals={east} onChange={setEast} />
            <ProfileInputs label="מערב" azs={WEST} vals={west} onChange={setWest} />
          </>}
        </Engine>
        <div className="vpair">
          <Viz><p className="chart-title">מבט מזרחה: זריחה ב{city.name}</p><Skyline azs={EAST} prof={profile} p={p} y={y} m={m} d={d} rising /></Viz>
          <Viz><p className="chart-title">מבט מערבה: שקיעה</p><Skyline azs={WEST} prof={profile} p={p} y={y} m={m} d={d} rising={false} /></Viz>
        </div>
        <p className="note">הקו המקווקו: מסלול מרכז השמש. העיגול: הרגע שבו שפת השמש נוגעת בקו האופק. {profile.length === 0 && <Tag tone="moon">באופק פתוח הזריחה הנראית שווה לזריחה לפי הגובה</Tag>}</p>
      </>}
    />
  );
}
