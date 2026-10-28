// Visuals for the halachic chapters (1–5, 18–19): the beit din, the witnesses, the messengers, the leap year, and the
// Rambam's notes on sighting. Arithmetic comes from engines (calendar, astro, rambam, beitdin); this file lays it out.

import { type ReactNode, useMemo, useState } from 'react';
import { geoEquirectangular, geoPath } from 'd3-geo';
import { CITIES, type OdehZone, TofMs, ZONE, civOf, localParts, nrm, odeh, sky, sunEcl, sunsetOn } from '../../engines/astro';
import { allFullDrift, avivRule, fullMonths, heightsJoin, leapCourt, messengerDays, tekufaInNisan } from '../../engines/beitdin';
import { DAY_NAME, P_DAY, P_MONTH, dayOfCivil, gem, monthStart, monthsOf, yearHeb } from '../../engines/calendar';
import { R_DECL, SIGNS, moonFromEquator, rambam, rambamDecl } from '../../engines/rambam';
import { LAND } from '../../lib/eclipseMap';
import BORDERS from '../../assets/terrain/borders.json';
import { monthModel } from '../../lib/month';
import { EarthMoonZoom, OrbitTopDown, PhaseStrip, SkyPanorama } from '../../components/astro/visuals';
import type { MonthProps } from '../../scenes/monthSystem';
import type { MoonFaceProps } from '../../scenes/moonFace';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DM, Num, Tag } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import type { EarthPinProps } from '../../scenes/earthPin';
import type { TerrainProps } from '../../scenes/terrainMap';
import { NightPicker, useNight } from '../ch14/Blocks';
import { SignPos } from '../ch14/Wheels14';
import { EqTable, SightSky3D, eveningMs } from './moon';
import { ZodiacScene } from './zodiac';

const fx = (on: boolean) => (on ? 'guide-focus' : '');
const JLM = CITIES[0];

// ---------------------------------------------------------------------------------------------------- generic

/** A card of short points, some highlighted: for halachot that are rules rather than calculations. */
export function Points({ title, sub, items, hl = [] }: { title: ReactNode; sub?: ReactNode; items: ReactNode[]; hl?: number[] }) {
  return (
    <Engine title={title} sub={sub} className={fx(hl.length > 0)}>
      <ol className="points">{items.map((it, i) => <li key={i} className={hl.includes(i) ? 'hl' : ''}>{it}</li>)}</ol>
    </Engine>
  );
}

/** Two ways a thing can go, side by side. */
export function TwoWays({ title, a, b, hl }: { title: ReactNode; a: [ReactNode, ReactNode]; b: [ReactNode, ReactNode]; hl?: 'a' | 'b' }) {
  return (
    <Engine title={title} className={fx(!!hl)}>
      <div className="twoways">
        {([['a', a], ['b', b]] as const).map(([k, [h, body]]) => <div key={k} className={hl === k ? 'hl' : ''}><h4>{h}</h4>{body}</div>)}
      </div>
    </Engine>
  );
}

/** A strip of times (right to left), with spans and marks: the day of the thirtieth, the witnesses, the court. */
export function TimeStrip({ title, from, to, spans = [], marks = [], hl }: {
  title: ReactNode; from: number; to: number;
  spans?: { a: number; b: number; label: string; tone?: 'ok' | 'bad' | 'moon' | 'leap'; k?: string }[];
  marks?: { t: number; label: string; k?: string }[];
  hl?: string;
}) {
  const W = 760, X = (t: number) => W - ((t - from) / (to - from)) * W;
  const night = [];
  for (let h = Math.ceil(from / 24) * 24; h < to; h += 24) night.push(h);   // hours from the start of a night (18:00)
  return (
    <Viz className={fx(!!hl)}>
      <p className="vt">{title}</p>
      <svg viewBox={`0 0 ${W} 130`} className="full" role="img" aria-label="ציר זמן">
        {night.map(h => <rect key={h} x={X(Math.min(h + 12, to))} y="30" width={X(h) - X(Math.min(h + 12, to))} height="44" fill="#141c33" />)}
        {night.map(h => h + 12 < to && <rect key={'d' + h} x={X(Math.min(h + 24, to))} y="30" width={X(h + 12) - X(Math.min(h + 24, to))} height="44" fill="#2b3a5c" />)}
        {spans.map((s, i) => <rect key={i} x={X(s.b)} y="38" width={X(s.a) - X(s.b)} height="28" rx="5" fill={`var(--c-${s.tone ?? 'moon'}-soft, #e7c76f55)`} stroke={hl && s.k === hl ? 'var(--c-accent, #6cb6ff)' : 'none'} strokeWidth="3" />)}
        {spans.map((s, i) => <text key={'t' + i} x={(X(s.a) + X(s.b)) / 2} y="57" textAnchor="middle" fontSize="12" fill="var(--c-text)">{s.label}</text>)}
        {marks.map((m, i) => <g key={i}><line x1={X(m.t)} x2={X(m.t)} y1="22" y2="82" stroke={hl && m.k === hl ? 'var(--c-accent, #6cb6ff)' : 'var(--c-text-2)'} strokeWidth={hl && m.k === hl ? 3 : 1.5} />
          <text x={X(m.t)} y={i % 2 ? 100 : 16} textAnchor="middle" fontSize="11" fill="var(--c-text-2)">{m.label}</text></g>)}
      </svg>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- maps

const MW = 520, MH = 420;
const loadTerrain = () => import('../../scenes/terrainMap').then(m => m.default);
type Box = [number, number, number, number];   // lon0, lat0, lon1, lat1
function useProj(box: Box) {
  return useMemo(() => {
    const [a, b, c, d] = box;
    const proj = geoEquirectangular().fitExtent([[0, 0], [MW, MH]], { type: 'MultiPoint', coordinates: [[a, b], [c, d]] });
    return { proj, land: geoPath(proj)(LAND) ?? '', xy: (lon: number, lat: number) => proj([lon, lat]) ?? [0, 0] };
  }, [box]);
}

export interface MapPlace { name: string; lat: number; lon: number; kind?: 'il' | 'syria' | 'abroad' | 'beacon' | 'land' | 'city'; approx?: boolean }

/** A map of the region (coastlines approximate), with places, an optional ring around Jerusalem and a route. */
export function RegionMap({ places, box: box0, ring, route, hl, note }: {
  places: MapPlace[]; box?: Box; ring?: { km: number; label: string }; route?: string[]; hl?: string[]; note?: ReactNode;
}) {
  const box: Box = box0 ?? [28, 27.5, 46, 37.5];
  const { land, xy } = useProj(box);
  const [jx, jy] = xy(JLM.lon, JLM.lat);
  // a ring of `km` around Jerusalem: one degree of latitude ≈ 111 km
  const rr = ring ? Math.abs(xy(JLM.lon, JLM.lat + ring.km / 111)[1] - jy) : 0;
  const col = (k?: MapPlace['kind']) => k === 'il' ? 'var(--c-ok, #7fce9c)' : k === 'syria' ? 'var(--c-leap, #e7c76f)' : k === 'abroad' ? 'var(--c-shift, #ef8f76)' : k === 'beacon' ? '#ffb36b' : '#e8ecf6';
  const pts = route?.map(n => places.find(p => p.name === n)).filter((p): p is MapPlace => !!p) ?? [];
  // the 3D relief: Israel in detail when the map stays inside it, otherwise the region from Egypt to Babylon
  const inIsrael = box[0] >= 33.8 && box[1] >= 29.3 && box[2] <= 36.4 && box[3] <= 33.6;
  const COLS: Record<string, number> = { il: 0x7fce9c, syria: 0xe7c76f, abroad: 0xef8f76, beacon: 0xffb36b, land: 0x7fce9c, city: 0xffffff };
  const props3d = useMemo<TerrainProps>(() => ({
    map: inIsrael || places.every(q => q.lon < 36.6 && q.lat < 33.6 && q.lon > 33.8) ? 'israel' : 'region',
    pins: places.map(q => ({ name: q.name, lat: q.lat, lon: q.lon, color: COLS[q.kind ?? 'city'], hl: hl?.includes(q.name), approx: q.approx, area: q.kind === 'land' })),
    route: pts.length > 1 ? pts.map(q => [q.lon, q.lat] as [number, number]) : undefined,
    ring,
    frame: box0,
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }), [JSON.stringify([places, hl, route, ring, inIsrael])]);
  return (
    <Viz className={fx(!!hl?.length)}>
      <Scene3D load={loadTerrain} props={props3d} label="מפת תבליט בתלת־ממד" views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'low', label: 'מבט נמוך' }, { id: 'top', label: 'מלמעלה' }]} fallback={
      <svg viewBox={`0 0 ${MW} ${MH}`} direction="ltr" role="img" aria-label="מפת ארץ ישראל וסביבתה">
        <rect width={MW} height={MH} fill="#16243f" />
        <path d={land} fill="#3a4a3a" stroke="#6b7d6b" strokeWidth="0.6" />
        {(BORDERS.lines as [number, number][][]).map((l, i) => <polyline key={i} points={l.map(([x, y]) => xy(x, y).join(',')).join(' ')} fill="none" stroke="#d9d2c5" strokeOpacity=".6" strokeWidth="0.8" />)}
        {ring && <><circle cx={jx} cy={jy} r={rr} fill="#88c5d822" stroke="#88c5d8" strokeDasharray="5 4" />
          <text x={jx} y={jy - rr - 6} textAnchor="middle" fontSize="12" fill="#88c5d8">{ring.label}</text></>}
        {pts.length > 1 && <polyline points={pts.map(p => xy(p.lon, p.lat).join(',')).join(' ')} fill="none" stroke="#ffb36b" strokeWidth="2.5" strokeDasharray="7 5" />}
        {places.map(p => { const [x, y] = xy(p.lon, p.lat), on = hl?.includes(p.name); return (
          <g key={p.name}>
            {p.kind === 'land'
              ? <circle cx={x} cy={y} r="26" fill={on ? '#7fce9c55' : '#7fce9c22'} stroke="#7fce9c" />
              : <circle cx={x} cy={y} r={on ? 6 : 4} fill={col(p.kind)} stroke="#000" />}
            <text x={x + (p.kind === 'land' ? 0 : 7)} y={y + (p.kind === 'land' ? 4 : -6)} textAnchor={p.kind === 'land' ? 'middle' : 'start'} fontSize={on ? 13 : 11} fontWeight={on ? 700 : 400} fill="#e8ecf6">{p.name}{p.approx ? ' (?)' : ''}</text>
          </g>
        ); })}
        <circle cx={jx} cy={jy} r="5" fill="#fff" stroke="#000" />
      </svg>} />
      <p className="note">{note ?? 'קווי החוף בקירוב.'} קווים ונקודות באפור: גבולות וערים של היום, להתמצאות. תבליט: גובה מוגדל{props3d.map === 'israel' ? ' פי 7' : ' פי 12'}, לפי נתוני SRTM ו־ETOPO. {places.some(p => p.approx) && 'סימן שאלה: מקום משוער.'}</p>
    </Viz>
  );
}

/** Places of chapter 5:11 and around: coordinates of the known sites; ancient sites by their usual identification, `approx` where it is uncertain. */
export const PLACES: Record<string, MapPlace> = {
  ירושלים: { name: 'ירושלים', lat: 31.78, lon: 35.23, kind: 'city' },
  אושא: { name: 'אושא', lat: 32.79, lon: 35.11, kind: 'il' },
  שפרעם: { name: 'שפרעם', lat: 32.81, lon: 35.17, kind: 'il' },
  יבנה: { name: 'יבנה', lat: 31.88, lon: 34.74, kind: 'il' },
  טבריא: { name: 'טבריא', lat: 32.79, lon: 35.53, kind: 'il' },
  צור: { name: 'צור', lat: 33.27, lon: 35.2, kind: 'syria' },
  דמשק: { name: 'דמשק', lat: 33.51, lon: 36.29, kind: 'syria' },
  אשקלון: { name: 'אשקלון', lat: 31.67, lon: 34.57, kind: 'syria' },
  מצרים: { name: 'מצרים', lat: 30.04, lon: 31.24, kind: 'abroad' },
  עמון: { name: 'עמון', lat: 31.95, lon: 35.93, kind: 'abroad' },
  // Moab by its capital, Kir Moab (al-Karak)
  מואב: { name: 'מואב (קיר מואב)', lat: 31.18, lon: 35.7, kind: 'abroad' },
  // Luz = Beit El, at Beitin; Nov: north-east of Jerusalem, by the usual identification near Mount Scopus (uncertain)
  לוז: { name: 'לוז (בית אל)', lat: 31.93, lon: 35.24, kind: 'il' },
  נוב: { name: 'נוב', lat: 31.8, lon: 35.25, kind: 'il', approx: true },
  בבל: { name: 'בבל', lat: 32.54, lon: 44.42, kind: 'abroad' },
};

/** The three lands of the aviv (4:4), toggles, the fruit, and the verdict. */
export function ThreeLands({ hl }: { hl?: boolean }) {
  const [on, setOn] = useState([true, false, false]), [fruit, setFruit] = useState(false);
  const names = ['יהודה', 'עבר הירדן', 'הגליל'];
  const pos: [number, number][] = [[31.55, 35.05], [32.0, 35.85], [32.95, 35.4]];
  const r = avivRule(on, fruit);
  return <>
    <RegionMap box={[33.8, 30.6, 36.8, 33.6]} places={names.map((n, i) => ({ name: n, lat: pos[i][0], lon: pos[i][1], kind: 'land' }))} hl={names.filter((_, i) => on[i])} note="בעיגול מודגש: ארץ שהגיע בה האביב. קווי החוף בקירוב." />
    <Engine title="על שלוש ארצות" sub="רמב״ם ד, ד" className={fx(!!hl)}>
      <div className="seg" role="group" aria-label="איפה הגיע האביב">
        {names.map((n, i) => <button key={n} type="button" aria-pressed={on[i]} onClick={() => setOn(o => o.map((v, j) => (j === i ? !v : v)))}>{n}</button>)}
      </div>
      <label className="fld"><input type="checkbox" checked={fruit} onChange={e => setFruit(e.target.checked)} /> פירות האילן כבר צמחו</label>
      <p>האביב הגיע ב־<Num>{r.count}</Num> מתוך <Num>3</Num>: {r.leap ? <Tag tone="leap">מעברין</Tag> : <Tag tone="ok">אין מעברין</Tag>}</p>
    </Engine>
  </>;
}

// ---------------------------------------------------------------------------------------------------- the sky on the thirtieth

const zoneTag = (z: OdehZone) => <Tag tone={ZONE[z].tone}>{ZONE[z].label}</Tag>;

/** Night thirty of a month: is the new moon seen in Jerusalem (modern criterion)? And what that makes the month. */
export function NightThirty({ focus }: { focus?: 'sky' | 'seen' | 'not' }) {
  const yr = useSlideYear(), months = monthsOf(yr.y), [mi, setMi] = useState(0);
  const start = monthStart(yr.y, mi), d30 = start + 29;
  const [a, b, c] = civOf(d30 - 1);
  const o = odeh(true, a, b, c, JLM), ss = sunsetOn(a, b, c, JLM);
  const seen = !!o && (o.zone === 'A' || o.zone === 'B');
  return <>
    {ss && <div className="month3d">
      <Viz><SkyPanorama ms={o?.tb ?? ss + 20 * 60000} c={JLM} /></Viz>
      <MoonFace3D ms={o?.tb ?? ss + 20 * 60000} title="הסהר באותו ערב" />
    </div>}
    <Engine title={<>ליל שלושים של {months[mi][0]} {yearHeb(yr.y)}</>} sub="בירושלים, לפי קריטריון מודרני (Odeh)" className={fx(!!focus)}>
      <div className="ctl"><SlideYear yr={yr} />
        <label className="fld">חודש <select value={mi} onChange={e => setMi(+e.target.value)}>{months.map(([n], i) => <option key={i} value={i}>{n}</option>)}</select></label>
      </div>
      <Steps rows={[
        { l: 'הערב', v: <>הערב שלפני {gem(30)} ב{months[mi][0]}</>, s: <Num>{`${c}.${b + 1}.${a}`}</Num> },
        { l: 'הסהר', v: o ? zoneTag(o.zone) : 'הירח שוקע לפני השמש' },
        { l: seen ? 'נראה בליל שלושים' : 'לא נראה בליל שלושים', v: seen ? <>החודש <strong>חסר</strong>, ויום ל׳ ראש חודש</> : <>החודש <strong>מלא</strong>, ויום ל״א ראש חודש</>, c: 'final' },
        { l: 'ובלוח הקבוע של היום', v: <>{months[mi][0]}: <Num>{months[mi][1]}</Num> ימים</> },
      ]} focus={focus === 'sky' ? 1 : focus ? 2 : undefined} />
    </Engine>
  </>;
}

const loadMonth = () => import('../../scenes/monthSystem').then(m => m.default);
const loadFace = () => import('../../scenes/moonFace').then(m => m.default);

/** The moon as seen from the Earth at one moment (3D), its lit part and whether it grows. */
export function MoonFace3D({ ms, height = 230, title = 'כך הירח נראה מכדור הארץ' }: { ms: number; height?: number; title?: ReactNode }) {
  const sk = sky(ms, JLM);
  const face = useMemo<MoonFaceProps>(() => ({ sunLam: sk.sunLam, moonLam: sk.moonLam, moonBeta: sk.moonBeta }), [sk.sunLam, sk.moonLam, sk.moonBeta]);
  return (
    <Viz className="month-face">
      <p className="vt">{title}</p>
      <Scene3D load={loadFace} props={face} label="הירח כפי שהוא נראה מכדור הארץ" views={[]} height={height} fallback={<EarthMoonZoom sk={sk} />} />
      <p className="note"><Num>{(sk.k * 100).toFixed(1)}%</Num> מואר · {sk.waxing ? 'הולך וגדל' : 'הולך וקטן'}</p>
    </Viz>
  );
}

/** A month of the moon in 3D: the sun, the earth and the moon at sunset of the evening chosen, and how it looks. */
export function MonthMoons({ day: d0 = 1 }: { day?: number }) {
  const yr = useSlideYear(), months = monthsOf(yr.y), [mi, setMi] = useState(0), [day, setDay] = useState(d0);
  const M = useMemo(() => monthModel(yr.y, mi, JLM), [yr.y, mi]);
  const d = Math.min(day, M.len), t = M.strip[d - 1].ss, sk = sky(t, JLM);
  const a0 = nrm(sunEcl(TofMs(M.strip[0].ss).T).lam + 180), a1 = nrm(sunEcl(TofMs(M.strip[M.len - 1].ss).T).lam + 180);
  const month = useMemo<MonthProps>(() => ({ sunLam: sk.sunLam, moonLam: sk.moonLam, moonBeta: sk.moonBeta, arc: [a0, a1], ms: t }), [sk.sunLam, sk.moonLam, sk.moonBeta, a0, a1, t]);
  return <>
    <Viz><PhaseStrip M={M} t={t} /></Viz>
    <div className="ctl">
      <SlideYear yr={yr} />
      <label className="fld">חודש <select value={mi} onChange={e => setMi(+e.target.value)}>{months.map(([n], i) => <option key={i} value={i}>{n}</option>)}</select></label>
      <label className="fld">ערב <Num>{gem(d)}</Num> בחודש
        <input type="range" min={1} max={M.len} value={d} onChange={e => setDay(+e.target.value)} aria-label="איזה ערב בחודש" />
      </label>
    </div>
    <div className="month3d">
      <Viz>
        <Scene3D load={loadMonth} props={month} label="השמש, כדור הארץ והירח בתלת־ממד; הצד המואר של הירח פונה לשמש"
          views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'earth', label: 'קרוב לכדור הארץ' }]}
          fallback={<OrbitTopDown M={M} sk={sk} />} />
        <p className="note">בשקיעה של ערב {gem(d)} ב{months[mi][0]}. לא בקנה מידה.</p>
      </Viz>
      <MoonFace3D ms={t} />
    </div>
  </>;
}

// ---------------------------------------------------------------------------------------------------- 2:5

/** Two witnesses' heights of the moon, in "קומות": do they join? */
export function Heights({ hl }: { hl?: boolean }) {
  const [a, setA] = useState(2), [b, setB] = useState(3), ok = heightsJoin(a, b);
  const bar = (v: number, x: number) => <g>{Array.from({ length: v }, (_, i) => <rect key={i} x={x} y={150 - (i + 1) * 22} width="40" height="20" rx="3" fill="#2b3a5c" stroke="#88c5d8" />)}
    <circle cx={x + 20} cy={150 - v * 22 - 14} r="10" fill="#f6e7a6" /></g>;
  return (
    <Engine title="כמה קומות" sub="רמב״ם ב, ה" className={fx(!!hl)}>
      <svg viewBox="0 0 240 170" role="img" aria-label="גובה הירח כפי שאמר כל עד">{bar(a, 50)}{bar(b, 150)}
        <text x="70" y="166" textAnchor="middle" fontSize="11" fill="var(--c-text-2)">עד א׳</text><text x="170" y="166" textAnchor="middle" fontSize="11" fill="var(--c-text-2)">עד ב׳</text></svg>
      <div className="ctl">
        <label className="fld">עד א׳ <Num>{a}</Num><input type="range" min={1} max={6} value={a} onChange={e => setA(+e.target.value)} aria-label="קומות, עד א׳" /></label>
        <label className="fld">עד ב׳ <Num>{b}</Num><input type="range" min={1} max={6} value={b} onChange={e => setB(+e.target.value)} aria-label="קומות, עד ב׳" /></label>
      </div>
      <p>{ok ? <Tag tone="ok">מצטרפין</Tag> : <Tag tone="bad">אין מצטרפין</Tag>} הפרש של <Num>{Math.abs(a - b)}</Num> קומות.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 3: messengers

/** The twelve months, and the six on which messengers went out (3:9). */
export function SixMonths({ hl }: { hl?: string }) {
  const list: [string, string | null][] = [['תשרי', 'תקנת המועדות'], ['חשוון', null], ['כסלו', 'חנוכה'], ['טבת', null], ['שבט', null], ['אדר', 'פורים'],
    ['ניסן', 'פסח'], ['אייר', 'פסח שני (בזמן המקדש)'], ['סיוון', null], ['תמוז', null], ['אב', 'התענית'], ['אלול', 'ראש השנה']];
  const R = 120;
  return (
    <Viz className={fx(!!hl)}>
      <svg viewBox="-170 -160 340 320" role="img" aria-label="החודשים שהשלוחים יוצאים עליהם">
        {list.map(([m, why], i) => { const t = (i / 12) * 2 * Math.PI - Math.PI / 2, x = -R * Math.cos(t + Math.PI), y = R * Math.sin(t); const on = !!why, h = hl === m;
          return <g key={m}><circle cx={x} cy={y} r={h ? 30 : 26} fill={on ? (m === 'אייר' ? '#e7c76f33' : '#7fce9c33') : '#ffffff0a'} stroke={h ? 'var(--c-accent, #6cb6ff)' : on ? '#7fce9c' : '#55607a'} strokeWidth={h ? 3 : 1} />
            <text x={x} y={y + 4} textAnchor="middle" fontSize="12" fill="var(--c-text)">{m}</text></g>; })}
        <text y="-4" textAnchor="middle" fontSize="14" fill="var(--c-text)">שישה חודשים</text>
        <text y="16" textAnchor="middle" fontSize="11" fill="var(--c-text-2)">ובזמן המקדש: גם אייר</text>
      </svg>
      <ul className="legend-list">{list.filter(([, w]) => w).map(([m, w]) => <li key={m} className={hl === m ? 'hl' : ''}><strong>{m}</strong>: {w}</li>)}</ul>
    </Viz>
  );
}

/** The days the messengers of Nisan and Tishrei walk before the festival (3:8–13, 5:11). */
export function Messengers({ hl }: { hl?: 'nisan' | 'tishrei' | 'both' }) {
  const [wd, setWd] = useState<number | null>(null);
  const row = (m: 'nisan' | 'tishrei') => {
    const days = messengerDays(m, wd), n = days.filter(d => d.walk).length;
    return <div className={`walk ${hl === m || hl === 'both' ? 'hl' : ''}`}>
      <h4>שלוחי {m === 'nisan' ? 'ניסן' : 'תשרי'}: <Num>{n}</Num> ימי הליכה</h4>
      <div className="walk-days">{days.map(d => <span key={d.d} className={d.walk ? 'w' : 'x'} title={d.why}>{gem(d.d)}<small>{d.why === 'yt' ? 'יו״ט' : d.why === 'yk' ? 'יוה״כ' : d.why === 'shabbat' ? 'שבת' : ''}</small></span>)}<span className="fest">ט״ו: החג</span></div>
    </div>;
  };
  return (
    <Engine title="כמה ימים הולכים השלוחים" sub="יוצאים בראש חודש, וצריכים להגיע לפני ט״ו" className={fx(!!hl)}>
      <label className="fld">ראש החודש ביום <select value={wd ?? -1} onChange={e => setWd(+e.target.value < 0 ? null : +e.target.value)}>
        <option value={-1}>בלי שבת (כמו בהלכה י״ג)</option>{DAY_NAME.map((n, i) => <option key={i} value={i}>{n}</option>)}</select></label>
      {row('nisan')}{row('tishrei')}
      <p className="note">ההפרש בלי שבת: שני ימים, א׳ בתשרי (יום טוב) וי׳ בתשרי (יום כיפור). עם שבת יוצא לשלוחי תשרי כעשרה ימים, כמו שכתוב בה׳, י״א.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 4

/** Where tekufat Nisan falls in Nisan of a year, against the sixteenth (4:2). */
export function TekufaSixteen({ hl }: { hl?: boolean }) {
  const yr = useSlideYear(), sh = tekufaInNisan(yr.y, 'shmuel'), ra = tekufaInNisan(yr.y, 'ravAdda');
  const W = 700, X = (d: number) => W - ((d + 30) / 75) * W;   // −30 … 45 days of Nisan
  const mark = (d: number, c: string, l: string, y: number) => <g><circle cx={X(d)} cy={y} r="7" fill={c} /><text x={X(d)} y={y - 12} textAnchor="middle" fontSize="11" fill={c}>{l}</text></g>;
  return (
    <Engine title={<>תקופת ניסן ב{yearHeb(yr.y)}</>} sub="ביחס לניסן; קו: ט״ז בניסן" className={fx(!!hl)}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <svg viewBox={`0 0 ${W} 120`} className="full" role="img" aria-label="תקופת ניסן ביחס לט״ז בניסן">
        <rect x={X(30)} y="60" width={X(0) - X(30)} height="20" fill="#7fce9c33" /><text x={(X(0) + X(30)) / 2} y="95" textAnchor="middle" fontSize="11" fill="var(--c-text-2)">ניסן</text>
        <rect x={X(0)} y="60" width={X(-29) - X(0)} height="20" fill="#e7c76f22" /><text x={(X(0) + X(-29)) / 2} y="95" textAnchor="middle" fontSize="11" fill="var(--c-text-2)">{sh.leap ? 'אדר ב׳' : 'אדר'}</text>
        <line x1={X(16)} x2={X(16)} y1="40" y2="100" stroke="var(--c-shift, #ef8f76)" strokeWidth="2" /><text x={X(16)} y="114" textAnchor="middle" fontSize="11" fill="var(--c-shift, #ef8f76)">ט״ז</text>
        {mark(sh.day, '#ef8f76', 'שמואל', 50)}{mark(ra.day, '#88c5d8', 'רב אדא', 30)}
      </svg>
      <Steps rows={[
        { l: 'רב אדא', v: ra.day >= 1 ? <>{gem(ra.day)} בניסן</> : <>לפני ניסן</> },
        { l: 'שמואל', v: sh.day >= 1 ? <>{gem(sh.day)} בניסן</> : <>לפני ניסן</> },
        sh.leap
          ? { l: 'השנה מעוברת. בלי אדר השני, ניסן היה מתחיל בראש חודש אדר ב׳, והתקופה (רב אדא) הייתה ב', v: <>{gem(ra.withoutLeap ?? 0)} בו</>, s: (ra.withoutLeap ?? 0) >= 16 ? 'ט״ז או אחריו: לכן מעברין' : 'לפני ט״ז', c: 'final' }
          : { l: 'השנה פשוטה', v: ra.day >= 16 ? 'התקופה אחרי ט״ו בניסן' : 'התקופה לפני ט״ז בניסן', c: 'final' },
      ]} />
      <p className="note">הלוח הקבוע של היום מעבר לפי מחזור של <Num>19</Num> שנה, שבממוצע שומר על הכלל הזה, אבל לא בכל שנה.</p>
    </Engine>
  );
}

/** The court for a leap year: three, five, seven (4:9–10). */
export function LeapCourt({ hl }: { hl?: 3 | 5 | 7 }) {
  const [s3, setS3] = useState(2), [n5, setN5] = useState(3), [n7, setN7] = useState(4);
  const stages = leapCourt(s3, n5, n7);
  const res = (st: (typeof stages)[number]) => st.result === 'cancel' ? 'בטל יחיד במיעוטו: אין יושבים' : st.result === 'five' ? 'מוסיפים שניים: חמישה' : st.result === 'seven' ? 'מוסיפים שניים: שבעה' : st.result === 'leap' ? 'הרוב: מעברין' : 'אין מעברין';
  const people = (n: number, yes: number) => <span className="judges">{Array.from({ length: n }, (_, i) => <i key={i} className={i < yes ? 'y' : 'n'} />)}</span>;
  return (
    <Engine title="שלושה, חמישה, שבעה" sub="רמב״ם ד, ט–י" className={fx(!!hl)}>
      <div className="ctl">
        <label className="fld">שלושה: כמה אומרים ״נשב״ <input type="range" min={0} max={3} value={s3} onChange={e => setS3(+e.target.value)} aria-label="מתוך שלושה, כמה אומרים נשב" /> <Num>{s3}</Num></label>
        <label className="fld">חמישה: כמה אומרים ״צריכה עיבור״ <input type="range" min={0} max={5} value={n5} onChange={e => setN5(+e.target.value)} aria-label="מתוך חמישה, כמה אומרים צריכה" /> <Num>{n5}</Num></label>
        <label className="fld">שבעה: כמה אומרים ״צריכה עיבור״ <input type="range" min={0} max={7} value={n7} onChange={e => setN7(+e.target.value)} aria-label="מתוך שבעה, כמה אומרים צריכה" /> <Num>{n7}</Num></label>
      </div>
      <Steps rows={stages.map((st, i) => ({
        l: <><Num>{st.n}</Num> דיינים {people(st.n, 'sit' in st ? st.sit : st.need)}</>, v: res(st), c: i === stages.length - 1 ? 'final' as const : undefined,
      }))} focus={hl ? stages.findIndex(s => s.n === hl) : undefined} />
      <p className="note">הרמב״ם מפרט את המקרים שבהם המיעוט אחד או שניים. כשכולם מסכימים בשלב הראשון, הכלי ממשיך באותה דרך.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 5:2

/** Rosh Chodesh by the fixed calendar against the first evening the new moon is seen in Jerusalem (Odeh A/B). */
export function FixedVsSighting({ hl }: { hl?: boolean }) {
  const yr = useSlideYear(), months = monthsOf(yr.y);
  const rows = useMemo(() => months.map((_, mi) => {
    const M = monthModel(yr.y, mi, JLM), start = monthStart(yr.y, mi);
    if (!M.first) return { mi, diff: null as number | null };
    // the evening of first sighting begins the Hebrew day after its civil date
    const p = localParts(M.first.ss), dSeen = dayOfCivil(p.y, p.m, p.d) + 1;
    return { mi, diff: start - dSeen };
  }), [yr.y, months]);
  return (
    <Engine title={<>ראש חודש בחשבון מול הראייה, {yearHeb(yr.y)}</>} sub="בירושלים, לפי קריטריון מודרני" className={fx(!!hl)}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="table-wrap"><table className="kt"><thead><tr><th>חודש</th><th>ראש חודש בחשבון, ביחס לראייה</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.mi} className={r.diff !== null && Math.abs(r.diff) > 1 ? 'hl' : ''}><td>{months[r.mi][0]}</td>
          <td>{r.diff === null ? '—' : r.diff === 0 ? <Tag tone="ok">ביום הראייה</Tag> : r.diff < 0 ? <><Num>{-r.diff}</Num> יום לפני</> : <Tag tone="bad">{r.diff} יום אחרי</Tag>}</td></tr>)}</tbody></table></div>
      <p className="note">החשבון של היום הוא לפי המולד האמצעי, והראייה לפי הירח האמיתי. הרמב״ם: יום הראייה, או יום לפניו, או יום אחריו; ואחריו ״פלא הוא״.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 18

/** If every month were made thirty days (18:6): how far ahead of the moon the count runs. */
export function AllFull({ hl }: { hl?: boolean }) {
  const n = [1, 2, 3, 4, 6, 8, 10, 12];
  return (
    <Engine title="אם כל חודש שלושים" sub="ומשווים לחודש הלבנה האמצעי" className={fx(!!hl)}>
      <Steps rows={n.map(k => ({ l: <><Num>{k}</Num> חודשים</>, v: <><Num>{allFullDrift(k).toFixed(1)}</Num> ימים לפני הירח</>, s: k === 12 ? <>הירח נראה בערך בליל {gem(Math.round(30 - allFullDrift(12)))} או {gem(Math.round(30 - allFullDrift(12)) + 1)}</> : undefined, c: k === 12 ? 'final' as const : undefined }))} />
      <p className="note">חודש לבנה אמצעי: <Num>{(P_MONTH / P_DAY).toFixed(3)}</Num> ימים.</p>
    </Engine>
  );
}

/** Full months per year in the fixed calendar (18:9: never fewer than four nor more than eight). */
export function FullMonthsBars({ hl }: { hl?: boolean }) {
  const yr = useSlideYear(), ys = Array.from({ length: 19 }, (_, i) => yr.y - 9 + i);
  return (
    <Engine title="חודשים מלאים בכל שנה" sub="בלוח הקבוע" className={fx(!!hl)}>
      <div className="ctl"><SlideYear yr={yr} /></div>
      <svg viewBox="0 0 760 180" className="full" role="img" aria-label="מספר החודשים המלאים בכל שנה">
        {[4, 8].map(v => <g key={v}><line x1="0" x2="760" y1={160 - v * 16} y2={160 - v * 16} stroke="var(--c-shift, #ef8f76)" strokeDasharray="4 4" /><text x="4" y={156 - v * 16} fontSize="10" fill="var(--c-shift, #ef8f76)">{v}</text></g>)}
        {ys.map((y, i) => { const n = fullMonths(y), x = 760 - (i + 1) * 40; return <g key={y}><rect x={x + 6} y={160 - n * 16} width="28" height={n * 16} fill={y === yr.y ? '#e7c76f' : '#88c5d8'} /><text x={x + 20} y="174" textAnchor="middle" fontSize="9" fill="var(--c-text-2)">{y % 100}</text><text x={x + 20} y={154 - n * 16} textAnchor="middle" fontSize="10" fill="var(--c-text)">{n}</text></g>; })}
      </svg>
    </Engine>
  );
}

const loadPin = () => import('../../scenes/earthPin').then(m => m.default);

/** The globe with the band 30°–35° north (18:16): east and west of the Land of Israel "מכוונות כנגדה". */
export function BandGlobe() {
  const props = useMemo<EarthPinProps>(() => ({ lat: 31.78, lon: 35.23, areaKm: 0, band: [30, 35] }), []);
  return (
    <Viz>
      <Scene3D load={loadPin} props={props} label="כדור הארץ, ארץ ישראל ורצועת הרוחב 30–35" views={[]} fallback={<p className="note">רצועת הרוחב <Num>30°–35°</Num> צפון.</p>} />
      <p className="note">הרצועה: <Num>30°</Num> עד <Num>35°</Num> צפון. מערבה מארץ ישראל השמש שוקעת מאוחר יותר, והירח רחוק יותר ממנה: אם נראה כאן, נראה שם.</p>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- 19

/** The declination table (19:7–9), with the folds. */
export const DeclTable = ({ deg }: { deg: number }) => <EqTable tab={R_DECL} title="נטיית המזלות מהקו השווה" deg={deg} fold={90} hl />;

/** The ecliptic's slant against the equator along the zodiac (19:2–6): north from Aries, south from Libra. */
export function EclipticWave({ at, hl }: { at?: number; hl?: boolean }) {
  const W = 720, H = 220, X = (d: number) => W - 20 - (d / 360) * (W - 40), Y = (m: number) => H / 2 - (m / 1410) * 80;
  let path = '';
  for (let d = 0; d <= 360; d += 2) path += `${d ? 'L' : 'M'}${X(d).toFixed(1)} ${Y(rambamDecl(d).decl).toFixed(1)}`;
  return (
    <Viz className={fx(!!hl)}>
      <svg viewBox={`0 0 ${W} ${H}`} className="full" role="img" aria-label="נטיית מסלול השמש מהקו השווה לאורך המזלות">
        <line x1="20" x2={W - 20} y1={H / 2} y2={H / 2} stroke="#88c5d8" /><text x="24" y={H / 2 - 6} fontSize="11" fill="#88c5d8">הקו השווה</text>
        <path d={path} fill="none" stroke="#f4c33f" strokeWidth="2.5" />
        {SIGNS.map((s, i) => <text key={s} x={X(i * 30 + 15)} y={H - 8} textAnchor="middle" fontSize="10" fill="var(--c-text-2)">{s}</text>)}
        {[0, 90, 180, 270].map(d => <circle key={d} cx={X(d)} cy={Y(rambamDecl(d).decl)} r="5" fill="#ef8f76" />)}
        <text x={X(90)} y={Y(1410) - 10} textAnchor="middle" fontSize="11" fill="var(--c-text)">ראש סרטן: <tspan direction="ltr" unicodeBidi="isolate">23½°</tspan> צפון</text>
        <text x={X(270)} y={Y(-1410) + 20} textAnchor="middle" fontSize="11" fill="var(--c-text)">ראש גדי: <tspan direction="ltr" unicodeBidi="isolate">23½°</tspan> דרום</text>
        {at !== undefined && <circle cx={X(at)} cy={Y(rambamDecl(at).decl)} r="7" fill="#e8ecf6" stroke="#000" />}
      </svg>
      <p className="note">ימין לשמאל: מטלה עד דגים. הקו הצהוב: כמה כל מעלה במזלות רחוקה מהקו השווה, לפי הטבלה של הרמב״ם.</p>
    </Viz>
  );
}

export type LeanStep = 'decl' | 'lat' | 'sum' | 'dir' | 'height';

/** Which way the moon leans and how high it stands, for any night (19:10–15), and the real sky that evening. */
export function MoonLean({ focus }: { focus?: LeanStep }) {
  const night = useNight(), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  if (!R) return <Engine title="לאן הירח נוטה"><NightPicker night={night} /><p className="note">התאריך לפני העיקר.</p></Engine>;
  const m = moonFromEquator(R.moonTrue, R.lat1, R.north);
  const deg = (v: number) => <><Num>{Math.abs(Math.round(v / 60))}°</Num> {v >= 0 ? 'צפון' : 'דרום'}</>;
  const rows: StepRow[] = [
    { l: <>נטיית מעלת הירח (<SignPos sec={R.moonTrue * 60} />)</>, v: deg(m.decl) },
    { l: 'רוחב הירח הראשון', v: deg(m.lat) },
    { l: m.decl * m.lat >= 0 ? 'באותה רוח: מקבצים' : 'בשתי רוחות: גורעים המעט מן הרב', v: deg(m.dist), s: 'מרחק הירח מהקו השווה' },
    { l: 'לאן נוטה', v: m.dir === 'west' ? 'כנגד אמצע מערב' : m.dir === 'north' ? 'בין מערב לצפון' : 'בין מערב לדרום', s: m.dir === 'west' ? 'הפגימה כנגד מזרח' : m.dir === 'north' ? 'הפגימה נוטה ממזרח לדרום' : 'הפגימה נוטה ממזרח לצפון', c: 'final' },
    { l: 'הגובה: לפי קשת הראייה', v: <DM min={R.arc} /> },
  ];
  const at: Record<LeanStep, number> = { decl: 0, lat: 1, sum: 2, dir: 3, height: 4 };
  const lat = (R.north ? 1 : -1) * R.lat1 / 60, show = (v: number) => `${Math.abs(Math.round(v / 60))}° ${v >= 0 ? 'צפון' : 'דרום'}`;
  return <>
    {focus === 'decl' || focus === 'lat' || focus === 'sum'
      ? <ZodiacScene view="decl" equator stars={false} moonLon={R.moonTrue / 60} moonLat={lat} hlSign={Math.floor(R.moonTrue / 1800)}
          decl={{ lon: R.moonTrue / 60, lat, hl: focus, labels: { decl: `נטיית המעלה: ${show(m.decl)}`, lat: `הרוחב: ${show(m.lat)}`, sum: `מהקו השווה: ${show(m.dist)}` } }}
          note="המקווקו התכלת: הקו השווה, נוטה ממסלול השמש. הקשת הצהובה: נטיית המעלה של הירח; הסגולה: רוחב הירח; הירוקה: מרחקו מהקו השווה." />
      : <SightSky3D dayIdx={night.dayIdx} step={focus === 'height' ? 'height' : 'dir'} />}
    <Engine title="לאן הירח נוטה" sub="רמב״ם י״ט, י–ט״ו, בקירוב" className={fx(!!focus)}>
      <NightPicker night={night} />
      <Steps rows={rows} focus={focus ? at[focus] : undefined} />
    </Engine>
  </>;
}

/** The real western sky on the evening that begins a Hebrew day (modern astronomy), for comparison. */
export function RealSky({ dayIdx }: { dayIdx: number }) {
  return <Viz><SkyPanorama ms={eveningMs(dayIdx)} c={JLM} /><p className="note">השמיים בירושלים באותו ערב, לפי החשבון האסטרונומי של היום.</p></Viz>;
}
