// The home screen (it takes the place of the opening slide, path yesodot/petiha): what this is, where to go next,
// the topics with your progress, and — as before — the demo year, the place and the first guess.

import { useEffect, useRef, useState, type ReactNode } from 'react';
import { P_DAY, fmtMolad, rh, yearHeb } from '../../engines/calendar';
import { CITIES, TofMs, moonEcl, sunEcl } from '../../engines/astro';
import { CHAPTERS, SLIDES, slideByPath, trackSlides } from '..';
import { RAMBAM_CHAPTERS } from '../../rambam';
import { HEB_NUM, chapterHeb } from '../../rambam/text';
import { Engine, Viz } from '../../components/Slide';
import { Civil, GDate, Legend, Num, Sig, Tag } from '../../components/text';
import { WeekWheel, dayMark } from '../../components/WeekWheel';
import { YearControl } from '../../components/YearControl';
import { GuessGate } from '../../components/GuessGate';
import { SlideSources } from '../../components/Sources';
import { gateKey } from '../../content/gates';
import { RULE_NAME, dayWord } from '../../lib/format';
import { go } from '../../state/nav';
import { setState, useStore } from '../../state/store';
import type { HeroHandle } from '../../scenes/heroSystem';

const HOME = 'yesodot/petiha';
const TOOLS = 'kelim';

/** Simple line icons, one per chapter (24×24, stroke = currentColor). */
const ICON: Record<string, ReactNode> = {
  yesodot: <><circle cx="12" cy="12" r="8.5" /><path d="M12 7v5l3.5 2" /></>,
  yom: <><circle cx="12" cy="12" r="4" /><path d="M12 2.5v2.5M12 19v2.5M2.5 12H5M19 12h2.5M5.3 5.3l1.8 1.8M16.9 16.9l1.8 1.8M5.3 18.7l1.8-1.8M16.9 7.1l1.8-1.8" /></>,
  chodesh: <path d="M15.5 3.5a8.5 8.5 0 1 0 5 13.6A7 7 0 0 1 15.5 3.5z" />,
  shana: <><path d="M20 12a8 8 0 0 1-13.7 5.6M4 12a8 8 0 0 1 13.7-5.6" /><path d="M17.7 2.8v3.8h-3.8M6.3 21.2v-3.8h3.8" /></>,
  luach: <><rect x="3.5" y="5" width="17" height="15" rx="2" /><path d="M3.5 9.5h17M8 3v4M16 3v4M8 13h2M12 13h2M16 13h0M8 16.5h2M12 16.5h2" /></>,
  dechiyot: <><path d="M4 12h12" /><path d="M12 7l5 5-5 5" /><path d="M20 5v14" /></>,
  reiya: <><path d="M2.5 12S6 5.5 12 5.5 21.5 12 21.5 12 18 18.5 12 18.5 2.5 12 2.5 12z" /><circle cx="12" cy="12" r="3" /></>,
  kelim: <><path d="M14.5 6.5a4 4 0 0 0-5.3 5.3L3.5 17.5l3 3 5.7-5.7a4 4 0 0 0 5.3-5.3l-2.5 2.5-2.5-.5-.5-2.5z" /></>,
};
const Icon = ({ id }: { id: string }) => (
  <svg className="ico" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round" aria-hidden="true">{ICON[id]}</svg>
);

function webgl(): boolean {
  try { const c = document.createElement('canvas'); return !!(c.getContext('webgl2') || c.getContext('webgl')); } catch { return false; }
}

/** Tonight's sky as a picture: Earth, Moon and Sun, the Moon at its real elongation. */
function HeroVisual() {
  const host = useRef<HTMLDivElement>(null);
  const [gl] = useState(webgl);
  const { T } = TofMs(Date.now());
  const elong = (((moonEcl(T).lam - sunEcl(T).lam) % 360) + 360) % 360;
  useEffect(() => {
    if (!gl || !host.current) return;
    let h: HeroHandle | null = null, dead = false;
    const motion = !window.matchMedia?.('(prefers-reduced-motion: reduce)').matches;
    import('../../scenes/heroSystem').then(m => { if (!dead && host.current) h = m.createHero(host.current, { elongation: elong, motion }); }).catch(() => {});
    return () => { dead = true; h?.dispose(); };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [gl]);
  const phase = elong < 10 || elong > 350 ? 'סמוך למולד' : elong < 170 ? 'הירח במילואו הולך וגדל' : elong < 190 ? 'סמוך למילוי' : 'הירח הולך וחסר';
  return (
    <div className="home-visual" ref={host} role="img" aria-label={`כדור הארץ, הירח והשמש. הירח במקומו של הלילה: ${phase}`}>
      {!gl && <div className="hero-orb" aria-hidden="true" />}
    </div>
  );
}

export function Home() {
  const y = useStore(s => s.demoYear);
  const city = useStore(s => s.city);
  const seen = useStore(s => s.seen)[y] ?? [];
  const r = rh(y);

  const lessons = CHAPTERS.filter(ch => ch.id !== TOOLS);
  const tools = CHAPTERS.find(ch => ch.id === TOOLS);
  const lastPath = [...seen].reverse().find(p => p !== HOME && slideByPath(p));
  const last = lastPath ? slideByPath(lastPath) : undefined;
  const first = SLIDES[1];
  const firstHalacha = trackSlides('rambam')[0];

  return (
    <div className="home">
      <section className="home-hero" aria-labelledby="slide-title">
        <div className="home-intro">
          <p className="kicker">סדר לעשות לוח</p>
          <h1 id="slide-title">איך בונים לוח עברי</h1>
          <p className="home-lead">מחלק אחד של שעה, דרך מולד הלבנה ושני המחזורים, ועד היום שבו חל ראש השנה בכל שנה שתבחרו. בכל שקף יש מנוע חישוב משלו.</p>
          <div className="home-cta">
            {last ? <>
              <button type="button" className="btn pri" onClick={() => go(last.path)}>להמשיך: {last.title}</button>
              <button type="button" className="btn" onClick={() => go(first.path)}>מההתחלה</button>
            </> : <button type="button" className="btn pri" onClick={() => go(first.path)}>להתחיל: {first.title}</button>}
          </div>
        </div>
        <HeroVisual />
      </section>

      <section className="home-sec" aria-labelledby="tracks-h">
        <h2 id="tracks-h">שתי דרכים ללמוד</h2>
        <div className="tracks">
          <button type="button" className="topic track-card" onClick={() => go(first.path)}>
            <span className="topic-t">לפי נושאים</span>
            <span className="track-d">מהשעה והחלק, דרך המולד והדחיות, ועד הראייה. כל נושא בשקף, עם מנוע חישוב משלו.</span>
            <span className="track-go">להתחיל: {first.title}</span>
          </button>
          {firstHalacha && (
            <button type="button" className="topic track-card" onClick={() => go(firstHalacha.path)}>
              <span className="topic-t">הלכה הלכה ברמב״ם</span>
              <span className="track-d">הלכות קידוש החודש: הטקסט של הרמב״ם, ההסבר וההדמיה יחד. בכל צעד נדלקות המילים שמוסברות.</span>
              <span className="track-go">להתחיל: פרק {chapterHeb(firstHalacha.chapter.num)}, {firstHalacha.title}</span>
            </button>
          )}
        </div>
      </section>

      <section className="home-sec" aria-labelledby="topics-h">
        <h2 id="topics-h">הנושאים</h2>
        <ol className="topics">
          {lessons.map(ch => {
            const slides = ch.slides.filter(s => `${ch.id}/${s.id}` !== HOME);
            const done = slides.filter(s => seen.includes(`${ch.id}/${s.id}`)).length;
            return (
              <li key={ch.id}>
                <button type="button" className="topic" onClick={() => go(`${ch.id}/${slides[0].id}`)}>
                  <span className="topic-top">
                    <Icon id={ch.id} />
                    <span className="topic-n"><Num>{ch.num}</Num></span>
                  </span>
                  <span className="topic-t">{ch.title}</span>
                  <span className="topic-list">{slides.map(s => s.title).join(' · ')}</span>
                  <span className="topic-prog" aria-label={`נצפו ${done} מתוך ${slides.length}`}>
                    <span className="topic-bar"><i style={{ inlineSize: `${(100 * done) / slides.length}%` }} /></span>
                    <span className="num">{done}/{slides.length}</span>
                  </span>
                </button>
              </li>
            );
          })}
        </ol>
      </section>

      <section className="home-sec" aria-labelledby="rambam-h">
        <h2 id="rambam-h">הלכות קידוש החודש</h2>
        <ol className="rambam-chs">
          {HEB_NUM.slice(1).map((_, k) => {
            const n = k + 1, ch = RAMBAM_CHAPTERS.find(c => c.num === n);
            return (
              <li key={n}>
                {ch
                  ? <button type="button" className="tool" onClick={() => go(`${ch.id}/${ch.slides[0].id}`)}>פרק {chapterHeb(n)}<small><Num>{ch.slides.length}</Num> {ch.slides.length === 1 ? 'הלכה' : 'הלכות'}</small></button>
                  : <span className="tool soon" aria-disabled="true">פרק {chapterHeb(n)}<small>בקרוב</small></span>}
              </li>
            );
          })}
        </ol>
      </section>

      {tools && (
        <section className="home-sec" aria-labelledby="tools-h">
          <h2 id="tools-h">{tools.title}</h2>
          <ul className="tools">
            {tools.slides.map(s => (
              <li key={s.id}>
                <button type="button" className="tool" onClick={() => go(`${tools.id}/${s.id}`)}>
                  <Icon id={tools.id} />
                  <span>{s.title}</span>
                </button>
              </li>
            ))}
          </ul>
        </section>
      )}

      <section className="home-sec home-start" aria-labelledby="start-h">
        <div className="home-start-text">
          <h2 id="start-h">לפני שמתחילים</h2>
          <p>בוחרים <strong>שנת הדגמה</strong> ו<strong>מקום</strong>. כל השקפים יחשבו עליהם, ואפשר לשנות אותם בכל רגע מהסרגל העליון.</p>
          <Engine title="שנת ההדגמה ומקום" sub="נשמרים בכתובת ובדפדפן">
            <div className="ctl">
              <YearControl value={y} onChange={v => setState({ demoYear: v })} label="שנת הדגמה" />
              <label className="fld">מקום
                <select aria-label="מקום" value={city} onChange={e => setState({ city: +e.target.value })}>
                  {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
                </select>
              </label>
            </div>
          </Engine>
        </div>
        <div className="home-start-gate">
          <GuessGate gateKey={gateKey('rh-day-start', y)} kind={{ type: 'day' }} answer={r.day % 7}
            question={<>לפני שמתחילים: באיזה יום בשבוע יחול ראש השנה {yearHeb(y)}?</>}
            explain="בסוף המסלול נדע לחשב את זה לבד, לכל שנה.">
            <Viz>
              <WeekWheel
                markers={[{ x: r.t, cls: 'moon', label: 'מולד' }]}
                arcs={r.rules.length ? [{ from: r.t, to: r.t + (r.day * P_DAY + P_DAY / 2 - r.t), cls: 'shift' }] : []}
                days={dayMark(r.day)}
                center={['ראש השנה', yearHeb(y), dayWord(r.day)]}
                aria="מולד תשרי וראש השנה על גלגל השבוע"
              />
              <Legend items={[['var(--moon)', 'מולד תשרי'], ['var(--shift)', 'דחייה'], ['var(--ok-soft)', 'היום שנקבע']]} />
            </Viz>
            <div className="result">
              <p>מולד תשרי <Sig>{fmtMolad(r.t)}</Sig>: <Civil t={r.t} />.</p>
              <p className="m0">
                {r.rules.length
                  ? <>דחיות שחלו: {r.rules.map(k => <Tag key={k} tone="bad">{RULE_NAME[k]}</Tag>)}</>
                  : <Tag tone="ok">בלי דחייה</Tag>}
                {' · '}ראש השנה: <strong>{dayWord(r.day)}</strong> <GDate day={r.day} />
              </p>
            </div>
          </GuessGate>
        </div>
      </section>

      <div className="home-sources"><SlideSources path={HOME} /></div>
    </div>
  );
}
