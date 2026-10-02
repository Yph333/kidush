// Year input (numbers or Hebrew letters) + the per-slide "temporary detour" from the demo year.

import { useEffect, useState } from 'react';
import { parseYear, yearHeb } from '../engines/calendar';
import { clampYear, useStore } from '../state/store';

/** Slide-local year that starts at the demo year and can temporarily deviate from it. */
export function useSlideYear(): { y: number; setY: (y: number) => void; detour: boolean; reset: () => void } {
  const demo = useStore(s => s.demoYear);
  const [st, setSt] = useState({ base: demo, y: demo });
  const y = st.base === demo ? st.y : demo;
  return {
    y,
    setY: v => setSt({ base: demo, y: clampYear(v) }),
    detour: y !== demo,
    reset: () => setSt({ base: demo, y: demo }),
  };
}

export function YearControl({ value, onChange, detour, onReset, label = 'שנה' }: {
  value: number; onChange: (y: number) => void; detour?: boolean; onReset?: () => void; label?: string;
}) {
  const [text, setText] = useState(yearHeb(value));
  const [bad, setBad] = useState(false);
  const demo = useStore(s => s.demoYear);
  useEffect(() => { setText(yearHeb(value)); setBad(false); }, [value]);

  const commit = () => {
    const v = parseYear(text);
    if (Number.isNaN(v) || v < 2 || v > 9998) { setBad(true); return; }
    setBad(false);
    onChange(clampYear(v));
  };

  return (
    <div className="fld">
      {label}
      <div className="yc">
        <button type="button" aria-label="שנה קודמת" onClick={() => onChange(clampYear(value - 1))}>−</button>
        <input
          type="text" aria-label={label} value={text} aria-invalid={bad || undefined}
          className={bad ? 'invalid' : ''}
          onChange={e => setText(e.target.value)} onBlur={commit}
          onKeyDown={e => { if (e.key === 'Enter') commit(); }}
        />
        <button type="button" aria-label="שנה הבאה" onClick={() => onChange(clampYear(value + 1))}>+</button>
        <em className="num">{value}</em>
        {detour && onReset && (
          <button type="button" className="back-demo" onClick={onReset}>חזרה לשנת ההדגמה ({yearHeb(demo)})</button>
        )}
      </div>
    </div>
  );
}

/** Convenience: slide year + control in one. */
export function SlideYear({ yr, label }: { yr: ReturnType<typeof useSlideYear>; label?: string }) {
  return <YearControl value={yr.y} onChange={yr.setY} detour={yr.detour} onReset={yr.reset} label={label} />;
}
