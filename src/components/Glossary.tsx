// Glossary: <Term k="molad">מולד</Term> marks a word in the text; tapping it opens the definition panel.

import { type ReactNode, useEffect, useRef } from 'react';
import { GLOSSARY, type GlossaryKey } from '../content/glossary';
import { slideByPath } from '../chapters';
import { go } from '../state/nav';
import { setState, useStore } from '../state/store';

export function Term({ k, children }: { k: GlossaryKey; children?: ReactNode }) {
  return (
    <button type="button" className="term" aria-haspopup="dialog"
      onClick={() => setState({ glossaryOpen: k })}>
      {children ?? GLOSSARY[k].term}
    </button>
  );
}

/** Panel: one entry (glossaryOpen = key) or the full list (glossaryOpen = '*'). */
export function GlossaryPanel() {
  const open = useStore(s => s.glossaryOpen);
  const ref = useRef<HTMLDivElement>(null);
  useEffect(() => { if (open) ref.current?.focus(); }, [open]);
  if (!open) return null;
  const close = () => setState({ glossaryOpen: null });
  const keys = open === '*' ? (Object.keys(GLOSSARY) as GlossaryKey[]) : [open as GlossaryKey];
  return (
    <div className="overlay" onClick={close}>
      <div ref={ref} className="panel glossary" role="dialog" aria-modal="true" aria-label="מילון מושגים" tabIndex={-1}
        onClick={e => e.stopPropagation()} onKeyDown={e => { if (e.key === 'Escape') close(); }}>
        <div className="panel-h">
          <b>{open === '*' ? 'מילון מושגים' : 'מושג'}</b>
          {open !== '*' && <button type="button" className="linkbtn" onClick={() => setState({ glossaryOpen: '*' })}>כל המושגים</button>}
          <button type="button" className="iconbtn" onClick={close} aria-label="סגירה">✕</button>
        </div>
        <dl>
          {keys.map(k => {
            const e = GLOSSARY[k], sl = slideByPath(e.slide);
            return (
              <div key={k} className="gl-entry">
                <dt>{e.term}</dt>
                <dd>
                  <p>{e.def}</p>
                  <p className="note">מקור: {e.source}</p>
                  {sl && <button type="button" className="linkbtn" onClick={() => { close(); go(sl.path); }}>לשקף: {sl.title}</button>}
                </dd>
              </div>
            );
          })}
        </dl>
      </div>
    </div>
  );
}
