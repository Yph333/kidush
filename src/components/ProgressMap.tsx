// Side map: chapters and slides, "you are here", and what we've already computed for the demo year.

import { yearHeb } from '../engines/calendar';
import { CHAPTERS } from '../chapters';
import { FACTS } from '../content/facts';
import { YEAR_GATES, gateKey } from '../content/gates';
import { go } from '../state/nav';
import { setState, useStore } from '../state/store';
import { Num } from './text';

export function ProgressMap() {
  const cur = useStore(s => s.slide);
  const demo = useStore(s => s.demoYear);
  const seenAll = useStore(s => s.seen);
  const open = useStore(s => s.mapOpen);
  const seen = seenAll[demo] ?? [];
  const guesses = useStore(s => s.guesses);
  const answered = (id: string) => gateKey(id, demo) in guesses;
  const facts = FACTS.filter(f => (f.gate ? answered(f.gate) : seen.includes(f.slide)));
  const recs = YEAR_GATES.map(g => guesses[gateKey(g.id, demo)]);
  const right = recs.filter(r => r?.correct === true).length, done = recs.filter(Boolean).length;

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
            <p className="note">עוד <Num>{FACTS.length - facts.length}</Num> נתונים יתגלו בהמשך המסלול.</p>
          )}
        </section>
        <section className="guess-path" aria-label="מסלול הניחושים">
          <b>מסלול הניחושים</b>
          <p className="note">ענינו על <Num>{done}</Num> מתוך <Num>{YEAR_GATES.length}</Num>{done > 0 && <>, מהם <Num>{right}</Num> נכון</>}</p>
          <ol>
            {YEAR_GATES.map((g, i) => {
              const r = recs[i], mark = !r ? '○' : r.correct === true ? '✓' : r.correct === false ? '✗' : '–';
              return (
                <li key={g.id}>
                  <button type="button" className={`linkbtn ${r?.correct === true ? 'ok' : r?.correct === false ? 'bad' : ''}`} onClick={() => go(g.slide)}>
                    <span className="mk" aria-hidden="true">{mark}</span> {g.label}
                  </button>
                </li>
              );
            })}
          </ol>
        </section>
      </nav>
    </>
  );
}
