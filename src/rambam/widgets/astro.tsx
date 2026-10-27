// Visuals for chapters 11–13 (and shared with 15–17): the eccentric circle, the signs, degrees arithmetic,
// Jerusalem on the globe, and the sun's calculation. Arithmetic from engines/dms, engines/rambam, engines/astro.

import { type ReactNode, useEffect, useMemo, useState } from 'react';
import { CITIES, dayOfMs } from '../../engines/astro';
import { cyclePos, gDate, hebDate, tekufotAbsolute, yearHeb, P_DAY } from '../../engines/calendar';
import { type Dms, addDms, inSign, subDms, toSec } from '../../engines/dms';
import { RB, R_SUN, SIGNS, interp, rambam, rambamD0, secOf } from '../../engines/rambam';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DM, DMS, Facts, Num, Sig } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM } from '../../lib/format';
import { monthModel } from '../../lib/month';
import type { EccentricProps } from '../../scenes/eccentric';
import type { EarthPinProps } from '../../scenes/earthPin';
import { NightPicker, useNight } from '../ch14/Blocks';
import { SignPos } from '../ch14/Wheels14';

const fx = (on: boolean) => (on ? 'guide-focus' : '');
const loadEcc = () => import('../../scenes/eccentric').then(m => m.default);
const loadPin = () => import('../../scenes/earthPin').then(m => m.default);

// ---------------------------------------------------------------------------------------------------- 11:13–15, 12:2, 13
/** The eccentric circle in 3D: mean vs true, the apogee. Animates the mean motion; 2D fallback from above. */
export function Eccentric({ hl, apogee = 86.75, ecc = 0.18, meanLon: m0, eqMin = null, play = true, note }: {
  hl?: EccentricProps['hl']; apogee?: number; ecc?: number; meanLon?: number; eqMin?: number | null; play?: boolean; note?: ReactNode;
}) {
  const [lon, setLon] = useState(m0 ?? 30);
  const [playing, setPlaying] = useState(false);
  const meanLon = m0 ?? lon;
  useEffect(() => {
    if (!playing) return;
    let raf = 0, last = 0;
    const f = (ts: number) => { if (last) setLon(l => (l + (ts - last) * 0.02) % 360); last = ts; raf = requestAnimationFrame(f); };
    raf = requestAnimationFrame(f);
    return () => cancelAnimationFrame(raf);
  }, [playing]);
  const props = useMemo<EccentricProps>(() => ({ meanLon, apogee, ecc, hl, eqMin }), [meanLon, apogee, ecc, hl, eqMin]);
  const top = (() => {
    const S = 13, c = 170, C = [Math.cos(apogee * Math.PI / 180) * ecc * S * 9, -Math.sin(apogee * Math.PI / 180) * ecc * S * 9];
    const B = [C[0] + Math.cos(meanLon * Math.PI / 180) * S * 9, C[1] - Math.sin(meanLon * Math.PI / 180) * S * 9];
    return (
      <svg viewBox="0 0 340 340" direction="ltr" role="img" aria-label="גלגל יוצא מרכז, מלמעלה">
        <circle cx={c + C[0]} cy={c + C[1]} r={S * 9} fill="none" stroke="var(--c-sun)" />
        <line x1={c + C[0]} y1={c + C[1]} x2={c + B[0]} y2={c + B[1]} stroke="var(--c-leap)" strokeDasharray="5 4" />
        <line x1={c} y1={c} x2={c + B[0]} y2={c + B[1]} stroke="var(--c-moon)" />
        <circle cx={c} cy={c} r="7" fill="#3e7cb8" /><circle cx={c + B[0]} cy={c + B[1]} r="8" fill="var(--c-sun)" />
      </svg>
    );
  })();
  return (
    <Viz>
      <Scene3D load={loadEcc} props={props} label="גלגל שאין הארץ באמצעו: המקום האמצעי והמקום האמיתי"
        play={play && m0 === undefined ? { playing, toggle: () => setPlaying(x => !x), label: 'הפעל' } : undefined}
        views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }]} fallback={top} />
      <p className="note">{note ?? 'ציור סכמטי: המרחק בין מרכז הגלגל לארץ מוגדל כדי שייראה.'}</p>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- 11:1
/** The evening sky with the young moon: the question the chapter answers. */
export function TonightsQuestion() {
  const yr = useSlideYear(), M = monthModel(yr.y, 0, CITIES[0]), first = M.first ?? M.ev[0];
  return (
    <Engine title={<>הערב הראשון אחרי מולד תשרי {yearHeb(yr.y)}</>} sub="האם הירח ייראה?">
      <div className="ctl"><SlideYear yr={yr} /></div>
      {first && <Facts items={[
        ['השקיעה', new Date(first.ss).toLocaleString('he-IL', { timeZone: 'Asia/Jerusalem', weekday: 'long', day: 'numeric', month: 'numeric', hour: '2-digit', minute: '2-digit' })],
        ['הירח רחוק מהשמש', <><Num>{first.s.elong.toFixed(1)}°</Num></>],
        ['גובה הירח בשקיעה', <><Num>{first.s.moon.alt.toFixed(1)}°</Num></>],
        ['לפי החשבון המודרני (Odeh)', first.zone === 'A' ? 'נראה בעין' : first.zone === 'B' ? 'אולי בעין' : first.zone === 'C' ? 'במשקפת' : 'לא נראה'],
      ]} />}
      <p className="note">בפרקים י״א–י״ז הרמב״ם בונה חשבון שעונה על השאלה הזו בלי מחשב.</p>
    </Engine>
  );
}

/** How close the Rambam's "first longitude" is to the modern elongation, for the evenings around a new moon (11:5–6). */
export function RambamVsModern() {
  const yr = useSlideYear(), c = CITIES[0], M = monthModel(yr.y, 0, c);
  const rows = M.ev.slice(0, 4).map(e => { const d = dayOfMs(e.ss + 60000, c), R = d > rambamD0() ? rambam(d) : null; return { e, d, R }; });
  return (
    <Engine title="הרמב״ם מול החשבון המודרני" sub="המרחק בין הירח לשמש (״אורך ראשון״)">
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="table-wrap"><table className="kt">
        <thead><tr><th>ערב</th><th>הרמב״ם</th><th>מודרני</th><th>הפרש</th></tr></thead>
        <tbody>{rows.map(({ e, d, R }) => { const hd = hebDate(d); const mod = e.s.dlam > 180 ? e.s.dlam - 360 : e.s.dlam; return (
          <tr key={d}><td>{hd.d} {hd.name}</td><td>{R ? <DM min={R.long1} /> : '—'}</td><td><Num>{mod.toFixed(2)}°</Num></td><td>{R ? <Num>{(R.long1 / 60 - mod).toFixed(2)}°</Num> : '—'}</td></tr>
        ); })}</tbody>
      </table></div>
      <p className="note">ההפרש מעטים מחלקי מעלה: הקירובים שהרמב״ם בחר בכוונה לא משנים את ההכרעה אם הירח ייראה.</p>
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 11:7–9
/** A longitude on the circle of the signs (11:7–9). */
export function SignFinder({ start = { d: 70, m: 30, s: 40 } }: { start?: Dms }) {
  const [v, setV] = useState<Dms>(start);
  const sec = toSec(v), { sign, within } = inSign(sec), deg = sec / 3600;
  const c = 150, R = 130, r = 96, P = (a: number, rad: number) => [c + rad * Math.cos(a * Math.PI / 180), c - rad * Math.sin(a * Math.PI / 180)];
  const num = (k: keyof Dms, max: number) => (
    <label className="fld">{k === 'd' ? 'מעלות' : k === 'm' ? 'חלקים' : 'שניות'}
      <input type="number" min={0} max={max} value={v[k]} onChange={e => setV({ ...v, [k]: Math.max(0, Math.min(max, Math.round(+e.target.value || 0))) })} />
    </label>
  );
  return (
    <>
      <Viz>
        <svg viewBox="0 0 300 300" className="season-wheel" direction="ltr" role="img" aria-label="גלגל המזלות">
          {SIGNS.map((n, k) => { const [x1, y1] = P(k * 30, r), [x2, y2] = P(k * 30, R), [tx, ty] = P(k * 30 + 15, (R + r) / 2); return (
            <g key={n}><line x1={x1} y1={y1} x2={x2} y2={y2} stroke="var(--c-line-strong)" /><text x={tx} y={ty + 4} textAnchor="middle" className="sw-s" fill={k === sign ? 'var(--c-moon)' : undefined} fontWeight={k === sign ? 700 : 400}>{n}</text></g>
          ); })}
          <circle cx={c} cy={c} r={R} fill="none" stroke="var(--c-line-strong)" /><circle cx={c} cy={c} r={r} fill="none" stroke="var(--c-line-strong)" />
          {(() => { const [x, y] = P(deg, R + 4), [x0, y0] = P(deg, 20); return <><line x1={x0} y1={y0} x2={x} y2={y} stroke="var(--c-moon)" strokeWidth="2" /><circle cx={x} cy={y} r="6" fill="var(--c-moon)" /></>; })()}
          <text x={c} y={c + 4} textAnchor="middle" className="sw-c">מתחילת טלה</text>
        </svg>
      </Viz>
      <Engine title="איפה בגלגל" sub="ש״ס מעלות, כל מזל שלושים">
        <div className="ctl">{num('d', 359)}{num('m', 59)}{num('s', 59)}</div>
        <Steps rows={[
          { l: 'המקום בגלגל', v: <DMS sec={sec} />, s: 'מתחילת מזל טלה' },
          { l: <>מזלות שלמים: <Num>{sign}</Num> × <Num>30°</Num></>, v: <Num>{sign * 30}°</Num>, s: SIGNS.slice(0, sign).join(', ') || 'אף אחד' },
          { l: 'המקום', v: <><DMS sec={toSec(within)} /> במזל {SIGNS[sign]}</>, s: <>כלומר בתוך המעלה ה־<Num>{within.d + 1}</Num> שלו</>, c: 'final' },
        ]} />
      </Engine>
    </>
  );
}

// ---------------------------------------------------------------------------------------------------- 11:10–12
/** Add or subtract degrees, minutes and seconds with the carrying of 11:10–12. */
export function DmsCalc({ op: op0 = 'add', a: a0 = { d: 100, m: 20, s: 30 }, b: b0 = { d: 200, m: 50, s: 40 }, focus }: {
  op?: 'add' | 'sub'; a?: Dms; b?: Dms; focus?: 's' | 'm' | 'd' | '360';
}) {
  const [op, setOp] = useState(op0), [a, setA] = useState(a0), [b, setB] = useState(b0);
  const field = (x: Dms, set: (v: Dms) => void, k: keyof Dms, max: number) => (
    <input type="number" min={0} max={max} value={x[k]} aria-label={k} onChange={e => set({ ...x, [k]: Math.max(0, Math.min(max, Math.round(+e.target.value || 0))) })} />
  );
  const line = (x: Dms, set: (v: Dms) => void, label: string) => (
    <div className="dms-in"><span>{label}</span>{field(x, set, 'd', 359)}°{field(x, set, 'm', 59)}′{field(x, set, 's', 59)}″</div>
  );
  let rows: StepRow[];
  if (op === 'add') {
    const r = addDms(a, b);
    rows = [
      { l: 'שניות', v: <><Num>{a.s} + {b.s} = {r.sRaw}</Num>{r.sCarry > 0 && <> ← <Num>60</Num> שניות הן חלק, נשארות <Num>{r.s}</Num></>}</> },
      { l: 'חלקים', v: <><Num>{a.m} + {b.m}{r.sCarry ? ' + 1' : ''} = {r.mRaw}</Num>{r.mCarry > 0 && <> ← <Num>60</Num> חלקים הם מעלה, נשארים <Num>{r.m}</Num></>}</> },
      { l: 'מעלות', v: <><Num>{a.d} + {b.d}{r.mCarry ? ' + 1' : ''} = {r.dRaw}</Num>{r.circles > 0 && <> ← משליכים <Num>360</Num>, נשארות <Num>{r.d}</Num></>}</> },
      { l: 'התוצאה', v: <Num>{`${r.d}° ${r.m}′ ${r.s}″`}</Num>, c: 'final' },
    ];
  } else {
    const r = subDms(a, b);
    rows = [
      { l: 'גורעים גדול מקטן?', v: r.added360 ? <>כן: מוסיפים <Num>360</Num> מעלות, <Num>{a.d} + 360 = {a.d + 360}</Num></> : 'לא' },
      { l: 'שניות', v: r.sBorrow ? <>אי אפשר <Num>{a.s} − {b.s}</Num>: מרימים חלק אחד, <Num>{a.s + 60} − {b.s} = {r.s}</Num></> : <Num>{a.s} − {b.s} = {r.s}</Num> },
      { l: 'חלקים', v: (() => { const am = a.m - (r.sBorrow ? 1 : 0); return r.mBorrow ? <>אי אפשר <Num>{am} − {b.m}</Num>: מרימים מעלה, <Num>{am + 60} − {b.m} = {r.m}</Num></> : <Num>{am} − {b.m} = {r.m}</Num>; })() },
      { l: 'מעלות', v: <Num>{`${a.d + (r.added360 ? 360 : 0) - (r.mBorrow ? 1 : 0)} − ${b.d} = ${r.d}`}</Num> },
      { l: 'התוצאה', v: <Num>{`${r.d}° ${r.m}′ ${r.s}″`}</Num>, c: 'final' },
    ];
  }
  const fRow = op === 'add' ? { s: 0, m: 1, d: 2, '360': 2 } : { '360': 0, s: 1, m: 2, d: 3 };
  return (
    <Engine title={op === 'add' ? 'מחברים מין עם מינו' : 'גורעים מנין ממנין'} sub="מעלות, חלקים ושניות" className={fx(!!focus)}>
      <div className="seg" role="radiogroup">
        <button type="button" role="radio" aria-checked={op === 'add'} onClick={() => setOp('add')}>חיבור</button>
        <button type="button" role="radio" aria-checked={op === 'sub'} onClick={() => setOp('sub')}>חיסור</button>
      </div>
      {line(a, setA, op === 'add' ? 'מוסיפים על' : 'גורעים מ־')}
      {line(b, setB, op === 'add' ? 'את' : 'את')}
      <Steps rows={rows} focus={focus ? fRow[focus] : undefined} />
    </Engine>
  );
}

// ---------------------------------------------------------------------------------------------------- 11:16–17
/** The epoch, with the Rambam's four ways of naming its year (11:16), checked. */
export function EpochFacts() {
  const D0 = rambamD0(), g = gDate(D0);
  return (
    <Engine title="העיקר" sub="תחילת ליל חמישי, ג׳ ניסן">
      <Facts items={[
        ['שנה ליצירה', <><Sig>ד׳תתקל״ח</Sig> (<Num>4938</Num>)</>],
        ['במחזור הקטן', <>שנה <Num>{cyclePos(4938)}</Num> במחזור <Num>{Math.floor(4937 / 19) + 1}</Num> (<Sig>ר״ס</Sig>)</>],
        ['לשטרות', <><Num>1489</Num></>],
        ['לחורבן הבית השני', <><Num>1109</Num></>],
        ['בלוח הנוצרי', <><Num>{`${g.getUTCDate()}.${g.getUTCMonth() + 1}.${g.getUTCFullYear()}`}</Num> (לוח גרגוריאני; ערב היום שלפני)</>],
      ]} />
    </Engine>
  );
}

/** Jerusalem on the globe: its latitude band and the area around it (11:17). */
export function JerusalemGlobe({ focus }: { focus?: 'lat' | 'area' }) {
  const props = useMemo<EarthPinProps>(() => ({ lat: 31.78, lon: 35.23, areaKm: 6.5 * 40, band: focus === 'lat' ? [29, 35] : undefined }), [focus]);
  return (
    <Viz>
      <Scene3D load={loadPin} props={props} label="כדור הארץ, ירושלים והאזור שסביבה" views={[]} fallback={<p className="note">ירושלים: כ־<Num>32°</Num> צפון.</p>} />
      <p className="note">ירושלים: <Num>31.8°</Num> צפון. העיגול: כ־<Num>260</Num> ק״מ, הליכה של כשישה ימים (כ־<Num>40</Num> ק״מ ביום, הערכה שלנו).</p>
    </Viz>
  );
}

// ---------------------------------------------------------------------------------------------------- 12–13: the sun
const TAMMUZ = { month: 'תמוז', day: 14 };

/** The mean sun, the apogee, the course, the table and the true sun, for any night (12:2, 13:1–10). */
export function SunCalc({ focus }: { focus?: 'mean' | 'apo' | 'course' | 'round' | 'eq' | 'true' }) {
  const night = useNight(TAMMUZ), R = night.N >= 0 ? rambam(night.dayIdx) : null;
  const rows: StepRow[] = R ? [
    { l: 'ימים מהעיקר', v: <Num>{NUM(R.N)}</Num> },
    { l: 'אמצע השמש', v: <SignPos sec={R.sunMean} />, s: <>העיקר <DMS sec={secOf(RB.root.sun)} /> + הטבלה = <DMS sec={R.sunMean} /></> },
    { l: 'גובה השמש', v: <SignPos sec={Math.round(R.apo)} />, s: <>העיקר <DMS sec={secOf(RB.root.apo)} /> + הטבלה</> },
    { l: 'מסלול השמש = האמצע פחות הגובה', v: <DMS sec={Math.round(R.sunMaslul)} /> },
    { l: 'מעגלים למעלה שלמה (שלושים חלקים ומעלה: מעלה)', v: <Num>{R.sunMaslulR}°</Num>, s: R.sunMaslulR > 180 ? <>יותר מ־<Num>180</Num>: <Num>{`360 − ${R.sunMaslulR} = ${360 - R.sunMaslulR}`}</Num></> : undefined },
    { l: 'מנת המסלול (מהטבלה)', v: <DM min={R.sunEq} />, s: R.sunSign < 0 ? 'המסלול פחות מ־180: גורעים' : R.sunSign > 0 ? 'יותר מ־180: מוסיפים' : 'אין מנה' },
    { l: 'מקום השמש האמיתי', v: <SignPos sec={R.sunTrue * 60} />, s: 'בלי שניות', c: 'final' },
  ] : [];
  const f = { mean: 1, apo: 2, course: 3, round: 4, eq: 5, true: 6 } as const;
  return <>
    <Eccentric hl={focus === 'apo' ? 'apogee' : focus === 'course' || focus === 'round' ? 'course' : focus === 'true' || focus === 'eq' ? 'both' : focus === 'mean' ? 'mean' : null}
      apogee={R ? R.apo / 3600 : 86.75} meanLon={R ? R.sunMean / 3600 : 105.6} eqMin={R && (focus === 'eq' || focus === 'true') ? R.sunEq : null} ecc={0.17} />
    <Engine title="מקום השמש" sub={night.label} className={fx(!!focus)}>
      <NightPicker night={night} />
      {R ? <Steps rows={rows} focus={focus ? f[focus] : undefined} /> : <p className="note">התאריך לפני העיקר.</p>}
    </Engine>
  </>;
}

/** The table of the sun's correction (13:4), with interpolation between rows (13:7–8). */
export function SunTable({ deg: d0 = 65, hl }: { deg?: number; hl?: boolean }) {
  const [deg, setDeg] = useState(d0);
  const f = deg > 180 ? 360 - deg : deg, r = Math.min(17, Math.floor(f / 10)), rem = f - r * 10;
  return (
    <Engine title="לוח מנת מסלול השמש" sub="כל עשר מעלות; בין השורות לפי החשבון" className={fx(!!hl)}>
      <label className="fld">המסלול <Num>{deg}°</Num>
        <input type="range" min={0} max={359} value={deg} onChange={e => setDeg(+e.target.value)} aria-label="המסלול במעלות" />
      </label>
      <div className="table-wrap"><table className="kt rtable"><thead><tr><th>מסלול</th><th>מנה</th></tr></thead>
        <tbody>{R_SUN.map((v, i) => <tr key={i} className={i === r || (i === r + 1 && rem > 0) ? 'hl' : ''}><td><Num>{i * 10}°</Num></td><td><DM min={v} /></td></tr>)}</tbody>
      </table></div>
      <p className="m0">
        {deg > 180 && <><Num>{`360 − ${deg} = ${f}`}</Num> · </>}
        בין <Num>{r * 10}°</Num> ל־<Num>{r * 10 + 10}°</Num>: <DM min={R_SUN[r]} /> + (<DM min={R_SUN[Math.min(18, r + 1)] - R_SUN[r]} />) × <Num>{rem}/10</Num> = <strong><DM min={Math.round(interp(R_SUN, f))} /></strong>
      </p>
    </Engine>
  );
}

/** The true tekufot of a year by the Rambam's sun (13:11), against Shmuel's (ch. 9). */
export function TrueTekufot() {
  const yr = useSlideYear(), sh = tekufotAbsolute(yr.y, 'shmuel'), names = ['תשרי', 'טבת', 'ניסן', 'תמוז'], target = [180, 270, 0, 90];
  const rows = useMemo(() => sh.map((t, k) => {
    const d0 = Math.floor(t / P_DAY);
    // the first evening, near Shmuel's day, on which the Rambam's true sun has passed the point
    let day: number | null = null;
    for (let d = d0 - 45; d <= d0 + 45; d++) {   // Shmuel's tekufa drifts from the true one by weeks over the centuries
      if (d <= rambamD0()) continue;
      const a = rambam(d - 1).sunTrue / 60, b = rambam(d).sunTrue / 60, x = target[k];
      const crossed = ((b - x + 540) % 360) - 180 >= 0 && ((a - x + 540) % 360) - 180 < 0;
      if (crossed) { day = d; break; }
    }
    return { name: names[k], shmuel: d0, rambam: day };
  }), [yr.y]);
  const fmt = (d: number) => { const h = hebDate(d); return <>{h.d} {h.name}</>; };
  return (
    <Engine title={<>התקופות של {yearHeb(yr.y)}</>} sub="לפי שמואל, ולפי מקום השמש האמיתי של הרמב״ם">
      <div className="ctl"><SlideYear yr={yr} /></div>
      <div className="table-wrap"><table className="kt"><thead><tr><th>תקופה</th><th>שמואל (פרק ט)</th><th>האמיתית (י״ג, י״א)</th></tr></thead>
        <tbody>{rows.map(r => <tr key={r.name}><td>{r.name}</td><td>{fmt(r.shmuel)}</td><td>{r.rambam ? fmt(r.rambam) : '—'}</td></tr>)}</tbody></table></div>
      <p className="note">התקופה האמיתית: הערב הראשון שבו מקום השמש האמיתי עבר את תחילת המזל (טלה, סרטן, מאזנים, גדי).</p>
    </Engine>
  );
}
