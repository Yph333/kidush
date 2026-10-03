// A play/pause animation clock for the scenes: calls step(dt) every frame while playing (dt in seconds).

import { useEffect, useRef, useState } from 'react';

export function usePlay(step: (dt: number) => void): { playing: boolean; toggle: () => void; stop: () => void } {
  const [playing, setPlaying] = useState(false);
  const ref = useRef(step);
  ref.current = step;

  useEffect(() => {
    if (!playing) return;
    let last = 0, raf = 0;
    const frame = (ts: number) => {
      if (last) ref.current(Math.min(0.1, (ts - last) / 1000));   // clamp after a background tab
      last = ts;
      raf = requestAnimationFrame(frame);
    };
    raf = requestAnimationFrame(frame);
    return () => cancelAnimationFrame(raf);
  }, [playing]);

  return { playing, toggle: () => setPlaying(p => !p), stop: () => setPlaying(false) };
}
