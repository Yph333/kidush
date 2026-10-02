// Side map: chapters and slides, "you are here", and what we've already computed for the demo year.

import { yearHeb } from '../engines/calendar';
import { CHAPTERS, slideByPath } from '../chapters';
import { FACTS } from '../content/facts';
import { go } from '../state/nav';
import { setState, useStore } from '../state/store';
import { Num } from './text';

export function ProgressMap() {
  const cur = useStore(s => s.slide);
  const demo = useStore(s => s.demoYear);
  const seenAll = useStore(s => s.seen);
  const open = useStore(s => s.mapOpen);
  const seen = seenAll[demo] ?? [];
  const facts = FACTS.filter(f => seen.includes(f.slide));

  return (
    <>
      {open && <div className="scrim" onClick={() => setState({ mapOpen: false })} />}
      <nav className={`map ${open ? 'open' : ''}`} aria-label="מפת התקדמות">
        <div className="map-h">
          <b>מפת השיעור</b>
          <button type="button" className="iconbtn map-close" onClick={() => setState({ mapOpen: false })} aria-label="סגירת המפה">✕</button>
        </div>
        <ol className="map-ch">
          {CHAPTERS.map(ch => (
            <li key={ch.id}>
              <span className="map-ch-t"><span className="num">{ch.num}</span> {ch.title}</span>
              <ol>
                {ch.slides.map(s => {
                  const path = `${ch.id}/${s.id}`, here = path === cur, done = seen.includes(path);
                  return (
                    <li key={s.id}>
                      <button type="button" className={`${here ? 'here' : ''} ${done ? 'done' : ''}`} aria-current={here ? 'page' : undefined}
                        onClick={() => go(path)}>
                        <span className="mk" aria-hidden="true">{here ? '●' : done ? '✓' : '○'}</span>
                        {s.title}
                        {here && <span className="here-tag">אתה כאן</span>}
                      </button>
                    </li>
                  );
                })}
              </ol>
            </li>
          ))}
        </ol>
        <section className="computed" aria-label="מה כבר חישבנו">
          <b>מה כבר חישבנו ל{yearHeb(demo)}</b>
          {facts.length === 0 ? <p className="note">עדיין כלום. כל שקף שעוברים מוסיף כאן את מה שחישב.</p> : (
            <dl>
              {facts.map(f => (
                <div key={f.key}>
                  <dt><button type="button" className="linkbtn" onClick={() => go(f.slide)}>{f.label}</button></dt>
                  <dd><bdi>{f.value(demo)}</bdi></dd>
                </div>
              ))}
            </dl>
          )}
          {facts.length > 0 && facts.length < FACTS.length && (
            <p className="note">עוד <Num>{FACTS.length - facts.length}</Num> נתונים יתגלו בשקפים: {FACTS.filter(f => !seen.includes(f.slide)).map(f => slideByPath(f.slide)?.title).filter((v, i, a) => a.indexOf(v) === i).join(', ')}</p>
          )}
        </section>
      </nav>
    </>
  );
}
