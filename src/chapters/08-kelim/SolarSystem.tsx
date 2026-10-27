// The solar system: true positions for any date, with three scales. A tool page, outside the lessons' sequence.

import { useMemo, useState } from 'react';
import { moonEcl, TofMs } from '../../engines/astro';
import { AU_KM, LUNA, MOONS, PHYS, PLANETS, SUN, helio, periodDays } from '../../engines/planets';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';
import { NUM } from '../../lib/format';
import type { Focus, Scale, SolarProps } from '../../scenes/solarSystem';

const load = () => import('../../scenes/solarSystem').then(m => m.default);
const DAY = 86400000;
const SPEEDS: [number, string][] = [[1, 'יום בשנייה'], [10, '10 ימים בשנייה'], [60, 'חודשיים בשנייה'], [365, 'שנה בשנייה']];
const SCALES: [Scale, string][] = [['comfort', 'תצוגה נוחה'], ['bodies', 'מרחקים אמיתיים, גופים מוגדלים'], ['true', 'הכול בקנה מידה אמיתי']];
const iso = (ms: number) => new Date(ms).toISOString().slice(0, 10);
const fmtKm = (km: number) => (km >= 1e6 ? <><Num>{(km / 1e6).toFixed(km >= 1e8 ? 0 : 1)}</Num> מיליון ק״מ</> : <><Num>{NUM(Math.round(km))}</Num> ק״מ</>);

/** 2D: the planets from above, on the comfortable scale. */
function TopView({ ms, focus }: { ms: number; focus: Focus }) {
  const c = 200, k = 8.6;
  return (
    <svg viewBox="0 0 400 400" direction="ltr" role="img" aria-label="מערכת השמש מלמעלה">
      <circle cx={c} cy={c} r="7" fill="var(--c-sun)" />
      {PLANETS.map(id => {
        const h = helio(id, ms), d = 4 * Math.sqrt(h.r) * k, a = Math.atan2(h.y, h.x);
        return (
          <g key={id}>
            <circle cx={c} cy={c} r={4 * Math.sqrt(helio(id, ms).r) * k} fill="none" stroke="var(--c-line-strong)" />
            <circle cx={c + d * Math.cos(a)} cy={c - d * Math.sin(a)} r={id === focus ? 6 : 4} fill={`#${PHYS[id].color.toString(16).padStart(6, '0')}`} />
            <text x={c + d * Math.cos(a)} y={c - d * Math.sin(a) - 9} textAnchor="middle" fontSize="10" fill="var(--c-text-2)">{PHYS[id].name.split(' ')[0]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function SolarSystem() {
  const [ms, setMs] = useState(() => Date.now());
  const [speed, setSpeed] = useState(10);
  const [scale, setScale] = useState<Scale>('comfort');
  const [focus, setFocus] = useState<Focus>('sun');
  const player = usePlay(dt => setMs(t => t + dt * speed * DAY));
  const props = useMemo<SolarProps>(() => ({ ms, scale, focus }), [ms, scale, focus]);

  const earth = helio('earth', ms);
  const info = focus === 'sun' ? null : (() => {
    const h = helio(focus, ms), dx = h.x - earth.x, dy = h.y - earth.y, dz = h.z - earth.z;
    return { h, fromEarth: Math.hypot(dx, dy, dz) * AU_KM };
  })();
  const moonsOf = focus === 'sun' ? [] : MOONS.filter(m => m.planet === focus);

  return (
    <Slide
      wide
      className="sticky-stage"
      kicker="כלים"
      title="מערכת השמש"
      text={<>
        <p>השמש, שמונת כוכבי הלכת והירחים הגדולים שלהם, <strong>במקום האמיתי</strong> שלהם בכל תאריך. החשבון לפי האיברים של JPL (נאס״א), ומדויק בתוך דקות קשת בין השנים <Num>1800</Num> ל־<Num>2050</Num>.</p>
        <Engine title="זמן">
          <div className="ctl">
            <label className="fld">תאריך
              <input type="date" value={iso(ms)} min="1800-01-01" max="2050-12-31" onChange={e => { const v = Date.parse(e.target.value); if (Number.isFinite(v)) { player.stop(); setMs(v); } }} />
            </label>
            <button type="button" className="btn" onClick={() => { player.stop(); setMs(Date.now()); }}>היום</button>
          </div>
          <div className="seg" role="group" aria-label="מהירות">
            {SPEEDS.map(([v, l]) => <button key={v} type="button" aria-pressed={speed === v} onClick={() => setSpeed(v)}>{l}</button>)}
          </div>
        </Engine>
        <Engine title="קנה מידה">
          <div className="seg" role="radiogroup" aria-label="קנה מידה">
            {SCALES.map(([v, l]) => <button key={v} type="button" role="radio" aria-checked={scale === v} onClick={() => setScale(v)}>{l}</button>)}
          </div>
          <p className="note">
            {scale === 'true' && <>הכול אמיתי: השמש קטנה פי <Num>100</Num> מהמרחק לכדור הארץ, וכוכבי הלכת הם פחות מפיקסל. בחרו כוכב והתקרבו בגלגלת כדי לראות אותו ואת ירחיו בגודלם האמיתי.</>}
            {scale === 'bodies' && <>המרחקים מהשמש אמיתיים. כוכבי הלכת מוגדלים פי <Num>800</Num> והשמש פי <Num>20</Num>, כדי שייראו. מרחקי הירחים מכוכב הלכת מוגדלים גם הם.</>}
            {scale === 'comfort' && <>המרחקים מכווצים (לפי שורש המרחק) והגופים מוגדלים, כדי שהכול ייכנס במסך. המקומות והכיוונים אמיתיים.</>}
          </p>
        </Engine>
        <Engine title="להתמקד ב">
          <div className="seg wrap" role="radiogroup" aria-label="גוף">
            <button type="button" role="radio" aria-checked={focus === 'sun'} onClick={() => setFocus('sun')}>{SUN.name}</button>
            {PLANETS.map(id => <button key={id} type="button" role="radio" aria-checked={focus === id} onClick={() => setFocus(id)}>{PHYS[id].name}</button>)}
          </div>
          {info && focus !== 'sun' && (
            <Facts items={[
              ['מרחק מהשמש', <><Num>{info.h.r.toFixed(3)}</Num> יח״א · {fmtKm(info.h.r * AU_KM)}</>],
              ['מרחק מכדור הארץ', fmtKm(info.fromEarth)],
              ['האור מגיע מהשמש תוך', <><Num>{((info.h.r * AU_KM) / 299792.458 / 60).toFixed(1)}</Num> דקות</>],
              ['רדיוס', fmtKm(PHYS[focus].radius)],
              ['שנה (סיבוב סביב השמש)', periodDays(focus) < 1000 ? <><Num>{periodDays(focus).toFixed(1)}</Num> ימים</> : <><Num>{(periodDays(focus) / 365.25).toFixed(1)}</Num> שנים</>],
              ['יום (סיבוב על הציר)', <><Num>{Math.abs(PHYS[focus].day) < 48 ? Math.abs(PHYS[focus].day).toFixed(1) + ' שעות' : (Math.abs(PHYS[focus].day) / 24).toFixed(1) + ' ימים'}</Num>{PHYS[focus].day < 0 && ' (הפוך)'}</>],
            ]} />
          )}
          {focus === 'earth' && <p className="note">הירח: <Num>{NUM(Math.round(moonEcl(TofMs(ms).T).dist))}</Num> ק״מ מכדור הארץ עכשיו (בממוצע <Num>{NUM(LUNA.a)}</Num>), במקומו האמיתי.</p>}
          {moonsOf.length > 0 && <p className="note">ירחים: {moonsOf.map(m => m.name).join(', ')}. המרחקים, הגדלים וזמני ההקפה אמיתיים; המקום שלהם לאורך המסלול סכמטי.</p>}
        </Engine>
      </>}
      stage={
        <Viz>
          <Scene3D load={load} props={props} label="מערכת השמש בתלת־ממד" height={640}
            play={{ ...player, label: 'הפעל' }}
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }]}
            fallback={<TopView ms={ms} focus={focus} />} />
          <p className="note">{new Date(ms).toLocaleDateString('he-IL', { day: 'numeric', month: 'long', year: 'numeric' })} · גוררים כדי לסובב, גלגלת כדי להתקרב.</p>
        </Viz>
      }
    />
  );
}
