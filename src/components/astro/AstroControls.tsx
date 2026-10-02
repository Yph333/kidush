// Timeline controls shared by the sky slides: year, month, place, a time slider, play, jumps.

import { useEffect, useRef } from 'react';
import { gq, hebDate, monthsOf, yearHeb } from '../../engines/calendar';
import { CITIES, DAYMS, HOUR, dayOfMs, hm, localParts, sunsetOn } from '../../engines/astro';
import { setAstro, setState } from '../../state/store';
import { YearControl } from '../YearControl';
import { Num } from '../text';
import type { AstroView } from './useAstro';

const SPEEDS: [number, string][] = [[10 * 60000, '10 דקות לשנייה'], [HOUR, 'שעה לשנייה'], [6 * HOUR, '6 שעות לשנייה'], [DAYMS, 'יום לשנייה']];
const JUMPS = [['mean', 'מולד ממוצע'], ['conj', 'מולד אמיתי'], ['first', 'ראייה ראשונה'], ['fq', 'רבע ראשון'], ['full', 'מילוא'], ['lq', 'רבע אחרון'], ['last', 'ראייה אחרונה'], ['sunset', 'שקיעה']] as const;
const WD = ['ראשון', 'שני', 'שלישי', 'רביעי', 'חמישי', 'שישי', 'שבת'];

/** "יום שני 08.04.2024 19:03" in Israel time. */
export function CivStr({ ms }: { ms: number }) {
  const p = localParts(ms);
  return <>{p.wd === 6 ? 'שבת' : 'יום ' + WD[p.wd]} <Num>{`${String(p.d).padStart(2, '0')}.${String(p.m + 1).padStart(2, '0')}.${p.y}`}</Num> <Num>{hm(ms)}</Num></>;
}

export function AstroControls({ v, cityPicker = true }: { v: AstroView; cityPicker?: boolean }) {
  const { M, t, a, c, demo } = v;
  const months = monthsOf(M.y);
  const playing = a.playing;
  const tRef = useRef(t);
  tRef.current = t;

  useEffect(() => {
    if (!playing) return;
    let last = 0, raf = 0;
    const step = (ts: number) => {
      if (last) {
        const nt = tRef.current + a.speed * (ts - last) / 1000;
        if (nt >= M.B) { setAstro({ t: M.B, playing: false }); return; }
        setAstro({ t: nt });
      }
      last = ts;
      raf = requestAnimationFrame(step);
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [playing, a.speed, M.B]);

  const setT = (nt: number) => setAstro({ t: Math.max(M.A, Math.min(M.B, nt)), playing: false });
  const jump = (k: (typeof JUMPS)[number][0]) => {
    let nt: number | null | undefined;
    if (k === 'first') nt = M.first?.tb;
    else if (k === 'last') nt = M.last?.tb;
    else if (k === 'sunset') { const p = localParts(t); nt = sunsetOn(p.y, p.m, p.d, c); }
    else nt = M[k];
    if (nt != null) setT(nt);
  };
  const h = hebDate(dayOfMs(t, c));

  return (
    <div className="actl">
      <div className="ctl">
        <YearControl value={M.y} detour={M.y !== demo}
          onChange={y => setAstro({ y, mi: Math.min(M.mi, monthsOf(y).length - 1), t: null, playing: false, dSel: null })}
          onReset={() => setAstro({ base: null })} />
        <label className="fld">חודש
          <select value={M.mi} onChange={e => setAstro({ mi: +e.target.value, t: null, playing: false, dSel: null })}>
            {months.map((m, i) => <option key={m[0]} value={i}>{m[0]}</option>)}
          </select>
        </label>
        {cityPicker && (
          <label className="fld">מקום
            <select value={CITIES.indexOf(c)} onChange={e => setState({ city: +e.target.value })}>
              {CITIES.map((cc, i) => <option key={cc.name} value={i}>{cc.name}</option>)}
            </select>
          </label>
        )}
      </div>
      <div className="tline">
        <input type="range" min={0} max={2000} step={1} aria-label="ציר הזמן"
          value={Math.round((t - M.A) / (M.B - M.A) * 2000)}
          onChange={e => setT(M.A + (M.B - M.A) * +e.target.value / 2000)} />
        <div className="tread" aria-live="polite">
          <CivStr ms={t} />
          <small>{gq(h.d)} {h.name} {yearHeb(h.y)} · {c.name}</small>
        </div>
      </div>
      <div className="ctl tbtn">
        <button type="button" className="btn pri" onClick={() => {
          if (playing) setAstro({ playing: false });
          else setAstro({ playing: true, t: t >= M.B - HOUR ? M.A : t });
        }}>{playing ? 'עצור' : 'הפעל'}</button>
        <select aria-label="מהירות" value={a.speed} onChange={e => setAstro({ speed: +e.target.value })}>
          {SPEEDS.map(([s, l]) => <option key={s} value={s}>{l}</option>)}
        </select>
        {[-24, -1, 1, 24].map(d => (
          <button key={d} type="button" className="btn" onClick={() => setT(t + d * HOUR)}>
            {d < 0 ? '−' : '+'} {Math.abs(d) === 24 ? 'יום' : 'שעה'}
          </button>
        ))}
      </div>
      <div className="chips explore-only">
        <span>קפיצה:</span>
        {JUMPS.map(([k, l]) => <button key={k} type="button" onClick={() => jump(k)}>{l}</button>)}
      </div>
    </div>
  );
}
