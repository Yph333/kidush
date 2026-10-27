import { useState } from 'react';
import KH from '../../content/rambamKH.json';
import { KITZUR_EXCERPTS, RAMBAM_TO_SLIDES } from '../../content/sourceMap';
import { slideByPath } from '..';
import { Engine, Slide } from '../../components/Slide';
import { go } from '../../state/nav';
import type { SlidePath } from '../../content/paths';

const CH_NAME: Record<number, string> = { 6: 'פרק ששי', 7: 'פרק שביעי', 8: 'פרק שמיני' };

function SlideLinks({ paths }: { paths: SlidePath[] }) {
  return (
    <div className="src-links">
      {paths.map(p => { const s = slideByPath(p); return s && <button key={p} type="button" className="chip-link" onClick={() => go(p)}>← {s.title}</button>; })}
    </div>
  );
}

export function SourcePage() {
  const [tab, setTab] = useState<'rambam' | 'kitzur'>('rambam');
  return (
    <Slide
      wide
      kicker="כלים"
      title="הדף מהמקור"
      text={<>
        <p>הטקסט עצמו, וליד כל קטע הקישור לשקף שמסביר אותו. אפשר ללמוד מהדף אל השקפים, או לחזור מהשקפים אל הדף.</p>
        <Engine>
          <div className="seg" role="tablist" aria-label="מקור">
            <button type="button" role="tab" aria-selected={tab === 'rambam'} aria-pressed={tab === 'rambam'} onClick={() => setTab('rambam')}>רמב״ם, קידוש החודש ו–ח</button>
            <button type="button" role="tab" aria-selected={tab === 'kitzur'} aria-pressed={tab === 'kitzur'} onClick={() => setTab('kitzur')}>סדר לעשות לוח בקצרה</button>
          </div>
          {tab === 'rambam'
            ? <p className="note">מקור: {KH.source}, נשלף {KH.fetched}. ההלכות כפי שהן בדפוס; הניקוד והפיסוק במקור.</p>
            : <p className="note">כרגע רק הקטעים שהיו באב־הטיפוס. את הטקסט המלא לא מצאתי במקור פתוח: TODO.</p>}
        </Engine>
      </>}
      stage={
        <div className="srcpage">
          {tab === 'rambam' ? KH.chapters.filter(c => c.n >= 6 && c.n <= 8).map(c => (
            <section key={c.n} aria-label={`הלכות קידוש החודש ${CH_NAME[c.n]}`}>
              <h3>הלכות קידוש החודש, {CH_NAME[c.n]} <a className="note" href={c.url} target="_blank" rel="noreferrer">(ויקיטקסט)</a></h3>
              {c.halachot.map(h => (
                <article key={h.h} className="halacha" id={`kh-${c.n}-${h.h}`}>
                  <span className="hnum">{h.h}</span>
                  <p className="rashi">{h.text}</p>
                  <SlideLinks paths={RAMBAM_TO_SLIDES[`${c.n}:${h.h}`] ?? []} />
                </article>
              ))}
            </section>
          )) : (
            <section aria-label="קטעים">
              {KITZUR_EXCERPTS.map((k, i) => (
                <article key={i} className="halacha">
                  <span className="hnum">{i + 1}</span>
                  <p className="rashi">{k.text}</p>
                  <SlideLinks paths={k.slides} />
                </article>
              ))}
            </section>
          )}
        </div>
      }
    />
  );
}
