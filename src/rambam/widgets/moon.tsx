// Visuals for chapters 15–17: from the mean moon to the true moon, its latitude, and the sighting.
// Everything comes from engines/rambam (the chain of rambam(day)); this file only lays it out.

import { type ReactNode, useMemo, useState } from 'react';
import { CITIES, TofMs, moonEcl, moonNode, sunEcl } from '../../engines/astro';
import { sightSky } from '../../lib/sightSky';
import type { WestSkyProps } from '../../scenes/westSky';
import type { MoonFaceProps } from '../../scenes/moonFace';
import { gDate } from '../../engines/calendar';
import { CIRCLE_TABLE, R_DBL, R_FOURTH, R_LAT, R_MOON, R_PLAT, R_PLON, SIGHTING_LIMITS, SIGNS, interp, rambam } from '../../engines/rambam';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DM, DMS, Num, Tag } from '../../components/text';
import type { MoonOrbitProps } from '../../scenes/moonOrbit';
import type { WheelsProps } from '../../scenes/rambamWheels';
import { NightPicker, useNight } from '../ch14/Blocks';
import { SignPos } from '../ch14/Wheels14';
import { Magnifier, ZodiacScene } from './zodiac';

const fx = (on: boolean) => (on ? 'guide-focus' : '');
const loadWheels = () => import('../../scenes/rambamWheels').then(m => m.default);
const loadOrbit = () => import('../../scenes/moonOrbit').then(m => m.default);
const pos = (min: number) => <SignPos sec={min * 60} />;
const signed = (min: number) => <>{min < 0 ? '−' : ''}<DM min={Math.abs(min)} /></>;

/** A generic correction table (every 10°), with interpolation for a chosen value (13:7, 15:7, 16:12). */
export function EqTable({ tab, title, deg: d0, fold = 180, step = 10, hl }: { tab: readonly number[]; title: ReactNode; deg: number; fold?: 90 | 180; step?: number; hl?: boolean }) {
  const [deg, setDeg] = useState(d0);
  const f = fold === 180 ? (deg > 180 ? 360 - deg : deg) : (deg <= 90 ? deg : deg <= 180 ? 180 - deg : deg <= 270 ? deg - 180 : 360 - deg);
  const r = Math.min(tab.length - 2, Math.floor(f / step)), rem = f - r * step;
  return (
    <Engine title={title} sub={`כל ${step} מעלות; בין השורות לפי החשבון`} className={fx(!!hl)}>
      <label className="fld">המסלול <Num>{deg}°</Num>
        <input type="range" min={0} max={359} value={deg} onChange={e => setDeg(+e.target.value)} aria-label="המסלול במעלות" />
      </label>
      <div className="table-wrap"><table className="kt rtable"><thead><tr><th>מסלול</th><th>מנה</th></tr></thead>
        <tbody>{tab.map((v, i) => <tr key={i} className={i === r || (i === r + 1 && rem > 0) ? 'hl' : ''}><td><Num>{i * step}°</Num></td><td><DM min={v} /></td></tr>)}</tbody>
      </table></div>
      <p className="m0">
        {f !== deg && <><Num>{deg}°</Num> → <Num>{f}°</Num> · </>}
        <DM min={tab[r]} /> + (<DM min={tab[r + 1] - tab[r]} />) × <Num>{rem}/{step}</Num> = <strong><DM min={Math.round(interp(tab, f))} /></strong>{' '}
        <Magnifier from={0} to={Math.round(interp(tab, f)) / 60} title={<>מנת המסלול: <DM min={Math.round(interp(tab, f))} /></>}>🔍 בתלת־ממד</Magnifier>
      </p>
    </Engine>
  );
}

/** The doubled distance and what it adds to the course (15:1–3). */
export function DoubleTable({ hl }: { hl?: number }) {
  return (
    <Engine title="המרחק הכפול ומה מוסיפים לאמצע המסלול" sub="רמב״ם ט״ו, ג">
      <div className="table-wrap"><table className="kt"><thead><tr><th>המרחק הכפול</th><th>מוסיפים</th></tr></thead>
        <tbody>{R_DBL.map(([a, b, v]) => <tr key={a} className={hl !== undefined && hl >= a && hl <= b ? 'hl' : ''}><td><Num>{a === 0 ? 'עד 5' : `${a}–${b}`}°</Num></td><td><Num>{v}°</Num></td></tr>)}</tbody>
      </table></div>
    </Engine>
  );
}

export type MoonStep = 'mean' | 'dist' | 'dbl' | 'add' | 'course' | 'round' | 'eq' | 'true';

/** Chapter 15: the mean moon at the time of sighting → the true moon, for any night. With the wheels in 3D. */
export function TrueMoon({ focus }: { focus?: MoonStep }) {
  const night = useNight(), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  const rows: StepRow[] = R ? [
    { l: 'אמצע הירח לשעת הראייה (פרק י״ד)', v: <SignPos sec={R.moonAdj} />, s: <>אמצע השמש: <SignPos sec={R.sunMean} /></> },
    { l: 'המרחק = אמצע הירח − אמצע השמש', v: <DMS sec={R.dist} /> },
    { l: 'המרחק הכפול', v: <DMS sec={R.dbl} />, s: <>מעוגל: <Num>{R.dblR}°</Num></> },
    { l: 'מוסיפים על אמצע המסלול (הטבלה)', v: <Num>{R.dblAdd}°</Num>, s: R.dblOut ? 'מחוץ לתחום הראייה (5–62)' : undefined },
    { l: 'המסלול הנכון', v: <DMS sec={R.crsCorr} />, s: <>אמצע המסלול <DMS sec={R.crs} /> + <Num>{R.dblAdd}°</Num></> },
    { l: 'מעוגל למעלה שלמה', v: <Num>{R.crsR}°</Num>, s: R.crsR > 180 ? <Num>{`360 − ${R.crsR} = ${360 - R.crsR}`}</Num> : undefined },
    { l: 'מנת המסלול', v: <DM min={R.moonEq} />, s: R.moonSignOp < 0 ? 'פחות מ־180: גורעים' : R.moonSignOp > 0 ? 'יותר מ־180: מוסיפים' : 'אין מנה' },
    { l: 'מקום הירח האמיתי', v: pos(R.moonTrue), c: 'final' },
  ] : [];
  const f = { mean: 0, dist: 1, dbl: 2, add: 3, course: 4, round: 5, eq: 6, true: 7 } as const;
  const props = useMemo<WheelsProps>(() => ({ meanLon: (R?.moonAdj ?? 0) / 3600, course: R?.crsR ?? 0, eqMin: R?.moonEq ?? 0, subtract: (R?.moonSignOp ?? -1) < 0, hl: focus === 'course' || focus === 'round' ? 'course' : focus === 'mean' ? 'mean' : null }), [R, focus]);
  return <>
    <Viz>
      <Scene3D load={loadWheels} props={props} label="גלגלי הירח: מאמצע הירח למקום האמיתי" views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'close', label: 'קרוב לגלגל הקטן' }]} fallback={<p className="note">הירח על הגלגל הקטן.</p>} />
      <p className="note">ציור סכמטי; המספר בתווית הוא ערך הטבלה של הרמב״ם.</p>
    </Viz>
    <Engine title="מקום הירח האמיתי" sub={night.label} className={fx(!!focus)}>
      <NightPicker night={night} />
      {R ? <Steps rows={rows} focus={focus ? f[focus] : undefined} /> : <p className="note">התאריך לפני העיקר.</p>}
    </Engine>
    {R && <ZodiacScene sunLon={R.sunTrue / 60} moonLon={R.moonTrue / 60} pointer={{ lon: R.moonTrue / 60 }} hlSign={Math.floor(R.moonTrue / 1800)} note={<>הירח והשמש על גלגל המזלות באותו ערב. <Magnifier from={R.moonAdj / 3600} to={R.moonTrue / 60} title="מאמצע הירח למקומו האמיתי">🔍 הגדלה</Magnifier></>} />}
  </>;
}

export type HeadStep = 'mean' | 'head' | 'tail';

/** Chapter 16:2–6: the head and the tail for any night. With the inclined orbit in 3D. */
export function HeadCalc({ focus }: { focus?: HeadStep }) {
  const night = useNight(), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  const rows: StepRow[] = R ? [
    { l: 'אמצע הראש (העיקר + הטבלה)', v: <DMS sec={R.headMean} /> },
    { l: 'מקום הראש = 360 − האמצע', v: pos(R.head), s: <DM min={R.head} /> },
    { l: 'מקום הזנב: כנגדו', v: pos((R.head + 10800) % 21600), c: 'final' },
  ] : [];
  const f = { mean: 0, head: 1, tail: 2 } as const;
  return (
    <Engine title="הראש והזנב" sub={night.label} className={fx(!!focus)}>
      <NightPicker night={night} />
      {R ? <Steps rows={rows} focus={focus ? f[focus] : undefined} /> : <p className="note">התאריך לפני העיקר.</p>}
    </Engine>
  );
}

/** The moon's inclined orbit for the evening that begins a Hebrew day: real sky positions, the Rambam's head. */
export function OrbitScene({ dayIdx, hl }: { dayIdx: number; hl?: boolean }) {
  const props = useMemo<MoonOrbitProps>(() => {
    const R = rambam(dayIdx), t = eveningMs(dayIdx);
    const { T } = TofMs(t), s = sunEcl(T), m = moonEcl(T);
    return { sunLon: s.lam, moonLon: m.lam, moonLat: m.beta, node: moonNode(t), rambamHead: R.head / 60, exaggerate: 3, ms: t };
  }, [dayIdx]);
  return (
    <Viz className={fx(!!hl)}>
      <Scene3D load={loadOrbit} props={props} label="מסלול הירח הנטוי, הראש והזנב" views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'side', label: 'מהצד, לאורך המישור' }, { id: 'top', label: 'מלמעלה' }]} fallback={<p className="note">מסלול הירח נוטה כ־5° ממסלול השמש.</p>} />
      <p className="note">ההדמיה לפי החשבון המודרני של אותו ערב; המשולש הירוק: הראש לפי הרמב״ם. הנטייה מוגדלת פי <Num>3</Num>.</p>
    </Viz>
  );
}

/** About the time of sighting on the evening that begins Hebrew day `dayIdx`: the civil day before, 16:30 UTC
 *  (in Jerusalem about a third of an hour after sunset in spring; close enough to place the bodies). */
export function eveningMs(dayIdx: number): number {
  return gDate(dayIdx).getTime() - 86400000 + 16.5 * 3600000;
}

export type LatStep = 'course' | 'dir' | 'fold' | 'eq';

/** Chapter 16:10–19: the latitude for any night. */
export function LatCalc({ focus }: { focus?: LatStep }) {
  const night = useNight(), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  const rows: StepRow[] = R ? [
    { l: 'מקום הירח האמיתי', v: pos(R.moonTrue) },
    { l: 'מקום הראש', v: pos(R.head) },
    { l: 'מסלול הרוחב = הירח − הראש', v: <DM min={R.latCourse} />, s: <>מעוגל: <Num>{R.latCourseR}°</Num></> },
    { l: 'צפוני או דרומי', v: R.north ? <Tag tone="ok">צפוני</Tag> : <Tag tone="leap">דרומי</Tag>, s: R.north ? 'המסלול בין 0 ל־180' : 'המסלול מעל 180' },
    { l: 'אל הטבלה (0–90)', v: <Num>{R.latCourseR <= 90 ? R.latCourseR : R.latCourseR <= 180 ? 180 - R.latCourseR : R.latCourseR <= 270 ? R.latCourseR - 180 : 360 - R.latCourseR}°</Num> },
    { l: 'רוחב הירח (הראשון)', v: <><DM min={R.lat1} /> {R.north ? 'צפוני' : 'דרומי'}</>, c: 'final' },
  ] : [];
  const f = { course: 2, dir: 3, fold: 4, eq: 5 } as const;
  return (
    <Engine title="רוחב הירח" sub={night.label} className={fx(!!focus)}>
      <NightPicker night={night} />
      {R ? <Steps rows={rows} focus={focus ? f[focus] : undefined} /> : <p className="note">התאריך לפני העיקר.</p>}
    </Engine>
  );
}

export type SightStep = 'long1' | 'pre' | 'long2' | 'lat2' | 'circle' | 'long3' | 'long4' | 'geo' | 'arc' | 'verdict';

/** Chapter 17: from the first longitude to the arc of sighting and the verdict, for any night. */
export function Sighting({ focus }: { focus?: SightStep }) {
  const night = useNight(), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  if (!R) return <Engine title="קשת הראייה"><NightPicker night={night} /><p className="note">התאריך לפני העיקר.</p></Engine>;
  const sg = SIGNS[R.sign], [lo, hi] = R.preLim;
  const rows: StepRow[] = [
    { l: 'האורך הראשון = הירח − השמש', v: signed(R.long1), s: <>השמש {pos(R.sunTrue)}, הירח {pos(R.moonTrue)}</> },
    { l: 'בדיקה ראשונה', v: R.pre === 'no' ? <Tag tone="bad">לא ייראה</Tag> : R.pre === 'yes' ? <Tag tone="ok">ייראה</Tag> : 'צריך לחשב', s: <>הירח ב{sg}: עד <Num>{lo}°</Num> לא ייראה, מעל <Num>{hi}°</Num> ייראה</> },
    { l: 'האורך השני: פחות שינוי מראה האורך', v: signed(R.long2), s: <>ב{sg}: <DM min={R.plon} /></> },
    { l: 'הרוחב השני', v: <>{signed(Math.abs(R.lat2))} {R.lat2 < 0 ? '(הפך כיוון)' : ''}</>, s: <>הרוחב הראשון <DM min={R.lat1} /> {R.north ? 'צפוני: גורעים' : 'דרומי: מוסיפים'} <DM min={R.plat} /></> },
    { l: 'מעגל הירח', v: <DM min={R.circle} />, s: <>{R.circFrac} מהרוחב השני</> },
    { l: 'האורך השלישי', v: signed(R.long3), s: R.circAdd ? 'מוסיפים את המעגל' : 'גורעים את המעגל' },
    { l: 'האורך הרביעי', v: signed(R.long4), s: <>ב{sg}: {R.fourthTxt}</> },
    { l: 'מנת גובה המדינה: שני שלישי הרוחב הראשון', v: <DM min={R.geo} />, s: R.north ? 'צפוני: מוסיפים' : 'דרומי: גורעים' },
    { l: 'קשת הראייה', v: signed(R.arc) },
    { l: 'ההכרעה', v: R.visible ? <Tag tone="ok">ייראה</Tag> : <Tag tone="bad">לא ייראה</Tag>, s: verdictText(R), c: 'final' },
  ];
  const f = { long1: 0, pre: 1, long2: 2, lat2: 3, circle: 4, long3: 5, long4: 6, geo: 7, arc: 8, verdict: 9 } as const;
  return <>
    <SightSky3D dayIdx={night.dayIdx} step={focus} verdict={R.visible ? 'ייראה' : 'לא ייראה'} />
    {(focus === 'long1' || focus === 'pre') && <ZodiacScene sunLon={R.sunTrue / 60} moonLon={R.moonTrue / 60} hlSign={R.sign} arc={{ from: R.sunTrue / 60, to: R.moonTrue / 60, label: 'האורך הראשון' }} note="הקשת הצהובה: האורך הראשון, מהשמש עד הירח לאורך המזלות." />}
    <Limits arc={R.arc / 60} long1={R.long1 / 60} hl={focus === 'verdict'} />
    <Engine title="חשבון הראייה" sub={night.label} className={fx(!!focus)}>
      <NightPicker night={night} />
      <Steps rows={rows} focus={focus ? f[focus] : undefined} />
    </Engine>
  </>;
}

function verdictText(R: ReturnType<typeof rambam>): ReactNode {
  const r = R.reason;
  if (r.kind === 'firstLongAbove') return <>האורך הראשון מעל <Num>{r.hi}°</Num></>;
  if (r.kind === 'firstLongAtMost') return <>האורך הראשון עד <Num>{r.lo}°</Num></>;
  if (r.kind === 'arcAtMost9') return <>קשת הראייה <Num>9°</Num> או פחות</>;
  if (r.kind === 'arcAbove14') return <>קשת הראייה יותר מ־<Num>14°</Num></>;
  return <>קשת <DM min={r.arc} />: צריך אורך ראשון <Num>{r.need}°</Num> לפחות; יש <DM min={r.long1} /></>;
}

const loadFace = () => import('../../scenes/moonFace').then(m => m.default);
const loadWest = () => import('../../scenes/westSky').then(m => m.default);
const GOLD = 0xe7c76f, VIOLET = 0xb0a2ff, CYAN = 0x88c5d8;

/** The evening sky in 3D with the piece each step of ch. 17 talks about (from lib/sightSky). */
export function SightSky3D({ dayIdx, step, verdict }: { dayIdx: number; step?: SightStep | 'dir' | 'height'; verdict?: string }) {
  const S = useMemo(() => sightSky(dayIdx, CITIES[0]), [dayIdx]);
  const face = useMemo<MoonFaceProps>(() => ({ sunLam: S.R.sunTrue / 60, moonLam: S.lam, moonBeta: S.beta }), [S]);
  const props = useMemo<WestSkyProps>(() => {
    const p: WestSkyProps = { sun: S.sun, moon: S.moon, ecliptic: S.ecliptic, equator: S.equator, paths: [] };
    const add = (pts: { alt: number; az: number }[], color: number, label?: string, dashed?: boolean) => p.paths.push({ pts, color, label, dashed });
    if (!step || step === 'long1' || step === 'pre') add(S.long1, GOLD, 'האורך הראשון');
    if (step === 'long2' || step === 'lat2') { p.ghost = S.moon; p.moon = S.seen; add([S.moon, S.seen], GOLD, `שינוי המראה (מוגדל פי ${S.K})`); }
    if (step === 'circle') { add(S.latLine, VIOLET, 'הרוחב', true); add(S.footToLevel, GOLD, 'מעגל הירח'); }
    if (step === 'long3') { add(S.long1, CYAN, 'האורך', true); add(S.footToLevel, GOLD, 'מעגל הירח'); }
    if (step === 'long4') { add(S.hourSun, CYAN, undefined, true); add(S.hourMoon, CYAN, undefined, true); add(S.eqArc, GOLD, 'האורך הרביעי: לאורך הקו השווה'); }
    if (step === 'geo') { add(S.latLine, VIOLET, 'הרוחב', true); add(S.drop, GOLD, 'גובה הירח'); }
    if (step === 'arc' || step === 'height') add(S.drop, GOLD, 'קשת הראייה: גובה הירח מעל האופק');
    if (step === 'verdict') p.moonLabel = verdict;
    if (step === 'dir') add([{ alt: 0, az: 270 }, { alt: 0, az: S.moon.az }], GOLD, S.moon.az > 272 ? 'נוטה לצפון' : S.moon.az < 268 ? 'נוטה לדרום' : 'אמצע מערב');
    return p;
  }, [S, step, verdict]);
  return (
    <Viz>
      <Scene3D load={loadWest} props={props} height={500} label="השמיים במערב בשעת הראייה, בתלת־ממד" views={[{ id: 'west', label: 'מבט מערבה' }, { id: 'out', label: 'מבחוץ' }]}
        fallback={<p className="note">הירח <Num>{S.moon.alt.toFixed(1)}°</Num> מעל האופק המערבי.</p>} />
      <p className="note">ירושלים, כעשרים דקות אחרי השקיעה. השמש והירח במקומות שהרמב״ם מחשב; הקו הצבעוני: המזלות בשמיים; המקווקו התכלת: הקו השווה. הירח מוגדל פי שלושה, ועיגול סביבו.</p>
      <div className="month-face sight-face">
        <p className="vt">הסהר באותו ערב, מוגדל</p>
        <Scene3D load={loadFace} props={face} label="הסהר באותו ערב, מוגדל" views={[]} height={200} fallback={<p className="note">הסהר.</p>} />
      </div>
    </Viz>
  );
}

/** The limits of sighting (17:15–21): arc against first longitude, the staircase, and tonight's point. */
export function Limits({ arc, long1, hl }: { arc?: number; long1?: number; hl?: boolean }) {
  const W = 340, H = 240, x = (a: number) => 40 + ((a - 8) / 8) * (W - 60), y = (l: number) => H - 30 - ((l - 7) / 9) * (H - 50);
  const steps = SIGHTING_LIMITS.map(([a, need], i) => ({ a0: i === 0 ? 9 : SIGHTING_LIMITS[i - 1][0], a1: a, need }));
  return (
    <Viz className={fx(!!hl)}>
      <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="קיצי הראייה: קשת הראייה מול האורך הראשון">
        <rect x={x(8)} y={y(16)} width={x(9) - x(8)} height={y(7) - y(16)} fill="var(--c-shift-soft)" />
        <rect x={x(14)} y={y(16)} width={x(16) - x(14)} height={y(7) - y(16)} fill="var(--c-ok-soft)" />
        {steps.map(s => <g key={s.a1}>
          <rect x={x(s.a0)} y={y(16)} width={x(s.a1) - x(s.a0)} height={y(s.need) - y(16)} fill="var(--c-ok-soft)" />
          <rect x={x(s.a0)} y={y(s.need)} width={x(s.a1) - x(s.a0)} height={y(7) - y(s.need)} fill="var(--c-shift-soft)" />
          <line x1={x(s.a0)} y1={y(s.need)} x2={x(s.a1)} y2={y(s.need)} stroke="var(--c-text-2)" strokeWidth="2" />
        </g>)}
        {[8, 9, 10, 11, 12, 13, 14, 15, 16].map(a => <text key={a} x={x(a)} y={H - 12} fontSize="10" textAnchor="middle" fill="var(--c-text-3)">{a}°</text>)}
        {[8, 10, 12, 14, 16].map(l => <text key={l} x={30} y={y(l) + 3} fontSize="10" textAnchor="end" fill="var(--c-text-3)">{l}°</text>)}
        <text x={W / 2} y={14} fontSize="11" textAnchor="middle" fill="var(--c-text-2)">ירוק: ייראה · אדום: לא ייראה</text>
        {arc !== undefined && long1 !== undefined && arc >= 8 && arc <= 16 && long1 >= 7 && long1 <= 16 && <circle cx={x(arc)} cy={y(long1)} r="6" fill="var(--c-moon)" stroke="#000" />}
      </svg>
      <p className="note">ציר אופקי: קשת הראייה. ציר אנכי: האורך הראשון. הנקודה: הערב שבחרתם.</p>
    </Viz>
  );
}

export { CIRCLE_TABLE, R_FOURTH, R_LAT, R_MOON, R_PLAT, R_PLON };

/** A per-sign table (17:5, 17:8, 17:12): one value per zodiac sign, the chosen sign marked. */
export function SignTable({ title, vals, hl }: { title: ReactNode; vals: readonly ReactNode[]; hl?: number }) {
  return (
    <Engine title={title} className={fx(hl !== undefined)}>
      <div className="table-wrap"><table className="kt"><thead><tr><th>מזל</th><th>ערך</th></tr></thead>
        <tbody>{SIGNS.map((s, i) => <tr key={s} className={i === hl ? 'hl' : ''}><td>{s}</td><td>{vals[i]}</td></tr>)}</tbody>
      </table></div>
    </Engine>
  );
}

export const PlonTable = ({ hl }: { hl?: number }) => <SignTable title="שינוי מראה האורך" vals={R_PLON.map((m, i) => <DM key={i} min={m} />)} hl={hl} />;
export const PlatTable = ({ hl }: { hl?: number }) => <SignTable title="שינוי מראה הרוחב" vals={R_PLAT.map((m, i) => <DM key={i} min={m} />)} hl={hl} />;
export const FourthTable = ({ hl }: { hl?: number }) => <SignTable title="מהאורך השלישי לרביעי (לפי מזל האורך)" vals={R_FOURTH.map(([, t]) => t)} hl={hl} />;

/** The circle of the moon (17:10): the fraction of the second latitude taken, by the moon's place. */
export function CircleTable({ hlDeg }: { hlDeg?: number }) {
  const rows = CIRCLE_TABLE.map(([lim, , name], i) => ({ from: i ? CIRCLE_TABLE[i - 1][0] : 0, lim, name }));
  const k = hlDeg === undefined ? -1 : rows.findIndex(r => hlDeg % 180 < r.lim);
  const at = (d: number) => <>{SIGNS[Math.floor(d / 30) % 12]} <Num>{d % 30}°</Num></>;
  return (
    <Engine title="מעגל הירח: כמה לוקחים מהרוחב השני" sub="ומול כל טווח: אותו טווח בחצי הגלגל השני" className={fx(k >= 0)}>
      <div className="table-wrap"><table className="kt"><thead><tr><th>הירח</th><th>או</th><th>לוקחים</th></tr></thead>
        <tbody>{rows.map((r, i) => <tr key={r.lim} className={i === k ? 'hl' : ''}><td>{at(r.from)} – {at(r.lim)}</td><td>{at(r.from + 180)} – {at(r.lim + 180)}</td><td>{r.name}</td></tr>)}</tbody>
      </table></div>
    </Engine>
  );
}
