// Chapter 14 visual: the big wheel and the small one, driven by the Rambam's own mean motions from his epoch
// (no correction yet: that is chapter 15). Days since the epoch can be stepped or played.

import { useMemo, useState } from 'react';
import { RB, SIGNS, rMotion, secOf } from '../../engines/rambam';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { usePlay } from '../../components/Scene3D/usePlay';
import { Engine, Viz } from '../../components/Slide';
import { DMS, Num } from '../../components/text';
import { NUM } from '../../lib/format';
import type { WheelsProps } from '../../scenes/rambamWheels';
import { BIG, SMALL, moonOnWheel } from '../../scenes/shared';

const load = () => import('../../scenes/rambamWheels').then(m => m.default);
const FULL = 1296000;
const norm = (s: number) => ((s % FULL) + FULL) % FULL;

/** Mean moon and mean course (arc-seconds) N days after the epoch; fractional days only for smooth playing. */
export function meanAt(N: number): { moon: number; course: number } {
  const d = Math.floor(N), f = N - d;
  return {
    moon: norm(secOf(RB.root.moon) + rMotion(RB.moon, d).v + f * secOf(RB.moon[1])),
    course: norm(secOf(RB.root.crs) + rMotion(RB.crs, d).v + f * secOf(RB.crs[1])),
  };
}

/** "1° 14′ 43″ במזל שור" from arc-seconds of longitude. */
export function SignPos({ sec }: { sec: number }) {
  const s = Math.floor(sec / 108000);
  return <><DMS sec={Math.round(sec - s * 108000)} /> במזל {SIGNS[s]}</>;
}

export type WheelsHl = WheelsProps['hl'];

/** 2D: the same picture from above. */
function TopView({ meanLon, course, hl }: { meanLon: number; course: number; hl: WheelsHl }) {
  const S = 16, c = 200, g = moonOnWheel(meanLon, course);
  const X = (x: number) => c + x * S, Y = (z: number) => c + z * S;
  const dim = (on: boolean) => (hl == null || on ? 1 : 0.3);
  return (
    <svg viewBox="0 0 400 400" direction="ltr" role="img" aria-label="הגלגל הגדול והגלגל הקטן, מלמעלה">
      <circle cx={c} cy={c} r={BIG * S} fill="none" stroke="#b0a2ff" opacity={dim(hl === 'big' || hl === 'mean')} />
      <circle cx={X(g.cx)} cy={Y(g.cz)} r={SMALL * S} fill="none" stroke="#e7c76f" opacity={dim(hl === 'small' || hl === 'course')} />
      <line x1={c} y1={c} x2={X(g.cx * 1.3)} y2={Y(g.cz * 1.3)} stroke="#b0a2ff" strokeDasharray="5 4" />
      <line x1={X(g.cx)} y1={Y(g.cz)} x2={X(g.mx)} y2={Y(g.mz)} stroke="#e7c76f" opacity={dim(hl === 'course')} />
      <circle cx={c} cy={c} r="9" fill="#3e7cb8" />
      <circle cx={X(g.cx)} cy={Y(g.cz)} r="3" fill="#e7c76f" />
      <circle cx={X(g.mx)} cy={Y(g.mz)} r="7" fill="#ddd" />
      <text x={X(g.cx * 1.42)} y={Y(g.cz * 1.42)} fill="#b0a2ff" fontSize="12" textAnchor="middle">אמצע הירח</text>
      <text x={X(g.mx) + 10} y={Y(g.mz) - 10} fill="#e7c76f" fontSize="12">הירח</text>
      <text x={c} y={c + 24} fill="#B6C0D2" fontSize="12" textAnchor="middle">ארץ</text>
    </svg>
  );
}

/** `at`: days from the epoch, set by the page (halacha 4); without it the reader steps the days here. */
export function Wheels14({ hl, emphasis, at }: { hl: WheelsHl; emphasis?: 'days'; at?: number }) {
  const [own, setN] = useState(0);
  const N = at ?? own;
  const player = usePlay(dt => setN(n => n + dt * 2));          // two days a second
  const day = Math.floor(N), m = meanAt(N);
  const meanLon = m.moon / 3600, course = m.course / 3600;
  const props = useMemo<WheelsProps>(() => ({ meanLon, course, eqMin: 0, subtract: false, meanOnly: true, hl }), [meanLon, course, hl]);
  const exact = meanAt(day);
  const go = (d: number) => { player.stop(); setN(Math.max(0, d)); };
  return (
    <>
      <Viz>
        <Scene3D load={load} props={props} label="הגלגל הגדול והגלגל הקטן של הירח לפי הרמב״ם, פרק י״ד"
          play={at === undefined ? { ...player, label: 'הפעל: יום אחר יום' } : undefined}
          views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'close', label: 'קרוב לגלגל הקטן' }]}
          fallback={<TopView meanLon={meanLon} course={course} hl={hl} />} />
        <p className="note">ציור סכמטי: הגלגל הקטן מוגדל כדי שייראה.</p>
      </Viz>
      {at === undefined && <Engine title="יום אחר יום מהעיקר" sub="ליל ה׳, ג׳ ניסן ד׳תתקל״ח" className={emphasis === 'days' ? 'guide-focus' : ''}>
        <div className="ctl">
          <button type="button" className="btn" onClick={() => go(day - 1)} disabled={day === 0}>יום אחורה</button>
          <button type="button" className="btn pri" onClick={() => go(day + 1)}>יום קדימה</button>
          <button type="button" className="btn" onClick={() => go(day + 29)}>+ <Num>29</Num> ימים</button>
          <button type="button" className="btn" onClick={() => go(0)} disabled={N === 0}>חזרה לעיקר</button>
          <label className="fld">ימים מהעיקר <Num>{NUM(day)}</Num>
            <input type="range" min={0} max={400} value={Math.min(400, day)} onChange={e => go(+e.target.value)} aria-label="ימים מהעיקר" />
          </label>
        </div>
        <div className="facts">
          <div><small>ימים מהעיקר</small><b><Num>{NUM(day)}</Num></b></div>
          <div><small>אמצע הירח</small><b><SignPos sec={exact.moon} /></b></div>
          <div><small>אמצע המסלול</small><b><DMS sec={exact.course} /></b></div>
        </div>
      </Engine>}
    </>
  );
}
