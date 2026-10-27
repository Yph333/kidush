import { useEffect, useRef } from 'react';
import { CITIES } from './engines/astro';
import { SLIDES, slideByPath } from './chapters';
import { GlossaryPanel } from './components/Glossary';
import { ProgressMap } from './components/ProgressMap';
import { TeacherNotesPanel } from './components/TeacherNotes';
import { YearControl } from './components/YearControl';
import { go, next, prev, startUrlSync } from './state/nav';
import { getState, markSeen, setState, useStore } from './state/store';


function toggleFullscreen() {
  try {
    if (document.fullscreenElement) void document.exitFullscreen();
    else void document.documentElement.requestFullscreen();
  } catch { /* not supported */ }
}

function isTyping(el: EventTarget | null): boolean {
  const t = el as HTMLElement | null;
  return !!t && (['INPUT', 'SELECT', 'TEXTAREA'].includes(t.tagName) || t.isContentEditable);
}

export function App() {
  const slidePath = useStore(s => s.slide);
  const mode = useStore(s => s.mode);
  const demo = useStore(s => s.demoYear);
  const city = useStore(s => s.city);
  const notesOpen = useStore(s => s.notesOpen);
  const mainRef = useRef<HTMLElement>(null);
  const appRef = useRef<HTMLDivElement>(null);

  useEffect(() => startUrlSync(), []);

  const cur = slideByPath(slidePath) ?? SLIDES[0];

  useEffect(() => {
    markSeen(cur.path);
    mainRef.current?.scrollTo?.({ top: 0 });
    document.title = `${cur.title} · בונים לוח עברי`;
  }, [cur.path, cur.title, demo]);

  // moonlight that follows the cursor: --mx/--my drive a faint glow behind the page
  useEffect(() => {
    if (window.matchMedia?.('(prefers-reduced-motion: reduce)').matches) return;
    const root = appRef.current;
    let raf = 0, ev: PointerEvent | null = null;
    const paint = () => {
      raf = 0;
      if (!root || !ev) return;
      root.style.setProperty('--mx', `${ev.clientX}px`);
      root.style.setProperty('--my', `${ev.clientY}px`);
    };
    const onMove = (e: PointerEvent) => { if (e.pointerType !== 'mouse') return; ev = e; if (!raf) raf = requestAnimationFrame(paint); };
    window.addEventListener('pointermove', onMove, { passive: true });
    return () => { window.removeEventListener('pointermove', onMove); cancelAnimationFrame(raf); };
  }, []);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.altKey || e.ctrlKey || e.metaKey || isTyping(e.target)) return;
      const s = getState();
      switch (e.key) {
        case 'ArrowLeft': case 'PageDown': e.preventDefault(); next(); break;
        case 'ArrowRight': case 'PageUp': e.preventDefault(); prev(); break;
        case 'Home': e.preventDefault(); go(0); break;
        case 'End': e.preventDefault(); go(SLIDES.length - 1); break;
        case 'n': case 'N': case 'מ': setState({ notesOpen: !s.notesOpen }); break;
        case 'p': case 'P': case 'פ': setState({ mode: s.mode === 'present' ? 'explore' : 'present' }); break;
        case 'f': case 'F': case 'כ': toggleFullscreen(); break;
        case 'Escape': setState({ notesOpen: false, mapOpen: false, glossaryOpen: null }); break;
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, []);

  const Current = cur.Component;
  const i = cur.index;

  return (
    <div className="app" data-mode={mode} data-home={i === 0 ? '' : undefined} ref={appRef}>
      <a className="skip" href="#deck">דילוג לתוכן</a>
      <header className="top">
        <button type="button" className="iconbtn map-btn" onClick={() => setState({ mapOpen: true })} aria-label="מפת השיעור">☰</button>
        <button type="button" className="brand" onClick={() => go(0)} aria-label="בונים לוח עברי: למסך הראשי">בונים לוח עברי{i > 0 && <small>פרק <span className="num">{cur.chapter.num}</span>: {cur.chapter.title}</small>}</button>
        <div className="sp" />
        <div className="top-ctl">
          <YearControl value={demo} onChange={v => setState({ demoYear: v })} label="שנת הדגמה" />
          <label className="fld city">מקום
            <select aria-label="מקום" value={city} onChange={e => setState({ city: +e.target.value })}>
              {CITIES.map((c, k) => <option key={c.name} value={k}>{c.name}</option>)}
            </select>
          </label>
        </div>
        <div className="top-btns">
          <button type="button" className="iconbtn" aria-pressed={mode === 'present'} title="מקש P"
            onClick={() => setState({ mode: mode === 'present' ? 'explore' : 'present' })}>
            {mode === 'present' ? 'מצב חקירה' : 'מצב מצגת'}
          </button>
          <button type="button" className="iconbtn" aria-pressed={notesOpen} title="מקש N" onClick={() => setState({ notesOpen: !notesOpen })}>הערות למורה</button>
          <button type="button" className="iconbtn" onClick={() => setState({ glossaryOpen: '*' })}>מילון</button>
          <button type="button" className="iconbtn fs-btn" onClick={toggleFullscreen} title="מקש F">מסך מלא</button>
        </div>
      </header>
      <div className="body">
        <ProgressMap />
        <main id="deck" ref={mainRef} tabIndex={-1}>
          <Current key={cur.path} />
        </main>
      </div>
      <footer className="bot">
        <button type="button" className="nb" onClick={prev} disabled={i === 0}>הקודם</button>
        <div className="prog" role="group" aria-label="התקדמות">
          {SLIDES.map((s, k) => (
            <button key={s.path} type="button" aria-label={s.title} aria-current={k === i ? 'page' : undefined}
              className={k < i ? 'on' : k === i ? 'cur' : ''} onClick={() => go(k)} />
          ))}
        </div>
        <span className="pos"><span className="num">{i + 1}/{SLIDES.length}</span></span>
        <button type="button" className="nb next" onClick={next} disabled={i === SLIDES.length - 1}>הבא</button>
      </footer>
      <TeacherNotesPanel />
      <GlossaryPanel />
    </div>
  );
}
