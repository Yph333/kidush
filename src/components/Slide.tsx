// Slide layout. Same content in both modes:
//  - present: text + the main visual, big type; `more` and `.explore-only` parts hidden
//  - explore: everything, including the "more" explanation and secondary visuals/controls

import type { ReactNode } from 'react';
import { useStore } from '../state/store';
import { SlideSources } from './Sources';

export function Slide({ kicker, title, text, more, stage, wide, hero, className = '' }: {
  kicker: ReactNode;
  title: ReactNode;
  text: ReactNode;
  /** longer explanation, explore mode only */
  more?: ReactNode;
  stage: ReactNode;
  wide?: boolean;
  hero?: boolean;
  className?: string;
}) {
  const mode = useStore(s => s.mode);
  const path = useStore(s => s.slide);
  return (
    <section className={`slide ${wide ? 'wide' : ''} ${hero ? 'hero' : ''} ${className}`} aria-labelledby="slide-title">
      <div className="text">
        <p className="kicker">{kicker}</p>
        {hero ? <h1 id="slide-title">{title}</h1> : <h2 id="slide-title">{title}</h2>}
        {text}
        {more && mode === 'explore' && (
          <details><summary>עוד הסבר</summary>{more}</details>
        )}
        <SlideSources path={path} />
      </div>
      <div className="stage">{stage}</div>
    </section>
  );
}

/** Panel holding a calculation engine (controls + steps). */
export function Engine({ title, sub, children, className = '' }: { title?: ReactNode; sub?: ReactNode; children: ReactNode; className?: string }) {
  return (
    <div className={`engine ${className}`}>
      {title && <div className="engine-h"><b>{title}</b>{sub && <span>{sub}</span>}</div>}
      {children}
    </div>
  );
}

export function Viz({ children, className = '', plain }: { children: ReactNode; className?: string; plain?: boolean }) {
  return <div className={`viz ${plain ? 'plain' : ''} ${className}`}>{children}</div>;
}

/** Quote from a public-domain source. */
export function Src({ children, cite }: { children: ReactNode; cite: ReactNode }) {
  return <blockquote className="src">{children}<cite>{cite}</cite></blockquote>;
}
