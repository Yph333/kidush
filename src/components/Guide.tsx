// Guided explanation: one step at a time, with "next" / "previous". The slide owns the step index (useGuide)
// so it can highlight its visual for the current step. Arrow keys inside the card move between steps
// (and are kept from the global slide navigation); the last step leads to the next slide.

import { type KeyboardEvent, useEffect, useRef, useState } from 'react';
import type { GuideDef } from '../content/guides/types';
import { SLIDES, slideByPath } from '../chapters';
import { next as nextSlide } from '../state/nav';
import { markGuideDone, useStore } from '../state/store';
import { Num, Tag } from './text';

export interface GuideState<F extends string> {
  def: GuideDef<F>;
  i: number;
  set: (i: number) => void;
  /** focus of the current step (undefined when the card is closed) */
  focus: F | undefined;
  open: boolean;
  setOpen: (o: boolean) => void;
}

export function useGuide<F extends string>(def: GuideDef<F>): GuideState<F> {
  const mode = useStore(s => s.mode);
  const [i, setI] = useState(0);
  const [open, setOpen] = useState(mode === 'explore');
  useEffect(() => { setOpen(mode === 'explore'); }, [mode]);
  const n = def.steps.length;
  const set = (k: number) => setI(Math.max(0, Math.min(n - 1, k)));
  return { def, i, set, focus: open ? def.steps[i]?.focus : undefined, open, setOpen };
}

export function Guide<F extends string>({ g }: { g: GuideState<F> }) {
  const path = useStore(s => s.slide);
  const nextRef = useRef<HTMLButtonElement>(null);
  const { def, i, set, open, setOpen } = g;
  const n = def.steps.length, step = def.steps[i], last = i === n - 1;
  const cur = slideByPath(path), after = cur ? SLIDES[cur.index + 1] : undefined;

  useEffect(() => { if (open && last) markGuideDone(path); }, [open, last, path]);

  // two columns (desktop): the card stays at the top of its column, so bring the highlighted visual into view.
  // One column (phone): the visual is below the text; scrolling to it would hide the card, so leave the page.
  const moved = useRef(false);
  useEffect(() => {
    if (!moved.current) { moved.current = true; return; }
    if (!window.matchMedia?.('(min-width: 921px)').matches) return;
    const el = document.querySelector('.slide .stage .guide-focus');
    if (!el) return;
    const r = el.getBoundingClientRect(), top = document.querySelector('.top')?.getBoundingClientRect().bottom ?? 0;
    const bottom = document.querySelector('.bot')?.getBoundingClientRect().top ?? window.innerHeight;
    if (r.top >= top && r.bottom <= bottom) return;
    const smooth = !window.matchMedia('(prefers-reduced-motion: reduce)').matches;
    el.scrollIntoView({ block: r.height > bottom - top ? 'start' : 'nearest', behavior: smooth ? 'smooth' : 'auto' });
  }, [i]);

  if (!open) {
    return (
      <button type="button" className="btn guide-open" onClick={() => setOpen(true)}>
        הסבר מודרך <small>(<Num>{n}</Num> צעדים)</small>
      </button>
    );
  }

  const onKey = (e: KeyboardEvent) => {
    // RTL: left = forward
    if (e.key === 'ArrowLeft') { e.preventDefault(); e.stopPropagation(); set(i + 1); }
    else if (e.key === 'ArrowRight') { e.preventDefault(); e.stopPropagation(); set(i - 1); }
  };

  return (
    <section className="guide" aria-label="הסבר מודרך" onKeyDown={onKey}>
      <div className="guide-h">
        <b>הסבר מודרך</b>
        {def.draft && <Tag tone="moon">טיוטה, ממתין לאישור</Tag>}
        <button type="button" className="iconbtn guide-x" onClick={() => setOpen(false)} aria-label="סגירת ההסבר המודרך">✕</button>
      </div>
      <div className="guide-dots" role="group" aria-label="צעדי ההסבר">
        <span className="guide-count">צעד <Num>{i + 1}</Num> מתוך <Num>{n}</Num></span>
        {def.steps.map((s, k) => (
          <button key={k} type="button" className={k === i ? 'cur' : k < i ? 'past' : ''}
            aria-label={`צעד ${k + 1}: ${s.title}`} aria-current={k === i ? 'step' : undefined} onClick={() => set(k)} />
        ))}
      </div>
      <div className="guide-body" aria-live="polite">
        <h3>{step.title}</h3>
        {step.body}
      </div>
      <div className="guide-nav">
        <button type="button" className="btn" disabled={i === 0} onClick={() => set(i - 1)}>הצעד הקודם</button>
        {/* one ref for both: after the last "next", focus lands on "to the next slide" */}
        {last
          ? after && <button ref={nextRef} type="button" className="btn pri" onClick={nextSlide}>לשקף הבא: {after.title}</button>
          : <button ref={nextRef} type="button" className="btn pri" onClick={() => { set(i + 1); requestAnimationFrame(() => nextRef.current?.focus()); }}>הצעד הבא</button>}
      </div>
    </section>
  );
}
