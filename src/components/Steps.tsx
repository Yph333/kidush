// A calculation shown as numbered steps, with a "step by step" reveal for class.

import { type ReactNode, useEffect, useRef, useState } from 'react';

export interface StepRow {
  l: ReactNode;
  v: ReactNode;
  s?: ReactNode;
  c?: 'final' | 'bad' | 'good' | '';
}

export function Steps({ rows, label }: { rows: StepRow[]; label?: string }) {
  // Infinity = everything shown
  const [shown, setShown] = useState(Infinity);
  const nextRef = useRef<HTMLButtonElement>(null);
  const startRef = useRef<HTMLButtonElement>(null);
  const stepping = shown !== Infinity;

  useEffect(() => { if (stepping && shown > rows.length) setShown(rows.length); }, [rows.length, shown, stepping]);

  const next = () => {
    const n = shown + 1;
    if (n >= rows.length) { setShown(Infinity); startRef.current?.focus(); } else setShown(n);
  };

  return (
    <div className="steps" aria-label={label}>
      <div className="stepbar">
        <button ref={startRef} type="button" onClick={() => { setShown(0); setTimeout(() => nextRef.current?.focus()); }}>שלב־שלב</button>
        <button ref={nextRef} type="button" disabled={!stepping} onClick={next}>שלב הבא</button>
        <button type="button" disabled={!stepping} onClick={() => setShown(Infinity)}>הצג הכל</button>
      </div>
      <ol>
        {rows.map((r, i) => (
          <li key={i} className={`step ${r.c ?? ''} ${i >= shown ? 'hid' : ''}`} aria-hidden={i >= shown || undefined}>
            <span className="sn"><span className="num">{i + 1}</span></span>
            <div className="sl">{r.l}</div>
            <div><div className="sv">{r.v}</div>{r.s && <div className="ss">{r.s}</div>}</div>
          </li>
        ))}
      </ol>
    </div>
  );
}
