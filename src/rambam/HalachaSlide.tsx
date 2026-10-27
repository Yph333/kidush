// One halacha of the Rambam track: the guided explanation and the text (right), the visual (left).
// Each guide step lights up the words it explains in the text, and the part of the visual they describe.

import { Fragment, type ReactNode } from 'react';
import { Guide, useGuide } from '../components/Guide';
import type { GuideDef } from '../content/guides/types';
import { chapterHeb, chapterUrl, halachaText, markRanges } from './text';

function RambamText({ text, marks, cite }: { text: string; marks: readonly string[]; cite: ReactNode }) {
  const ranges = markRanges(text, marks), parts: ReactNode[] = [];
  let at = 0;
  ranges.forEach(([a, b], k) => {
    if (a > at) parts.push(<Fragment key={`t${k}`}>{text.slice(at, a)}</Fragment>);
    parts.push(<mark key={`m${k}`} className="rt-mark">{text.slice(a, b)}</mark>);
    at = b;
  });
  if (at < text.length) parts.push(<Fragment key="end">{text.slice(at)}</Fragment>);
  return <blockquote className="src rambam-text">{parts}<cite>{cite}</cite></blockquote>;
}

export function HalachaSlide<F extends string>({ ch, h, title, guide, before, takeaway, stage }: {
  ch: number;
  /** halacha letter, as in the source: 'א' */
  h: string;
  title: ReactNode;
  guide: GuideDef<F>;
  /** what to know before the chapter (first halacha only) */
  before?: ReactNode;
  /** one or two lines: what to take from this halacha */
  takeaway: ReactNode;
  stage: (focus: F | undefined) => ReactNode;
}) {
  const g = useGuide(guide);
  const marks = g.open ? g.def.steps[g.i]?.mark ?? [] : [];
  const url = chapterUrl(ch);
  return (
    <section className="slide halacha-slide" aria-labelledby="slide-title">
      <div className="text">
        <p className="kicker">הלכות קידוש החודש · פרק {chapterHeb(ch)}, הלכה {h}׳</p>
        <h2 id="slide-title">{title}</h2>
        {before && <details className="before"><summary>לפני שמתחילים: מה צריך לדעת</summary>{before}</details>}
        {/* the guide comes first and (on desktop) stays at the top: the text below can be long, and each step quotes its words */}
        <Guide g={g} />
        <RambamText text={halachaText(ch, h)} marks={marks}
          cite={<>רמב״ם, הלכות קידוש החודש {chapterHeb(ch)}, {h}׳ · דפוס וורשא־ווילנא{url && <> (<a href={url} target="_blank" rel="noreferrer">ויקיטקסט</a>)</>}</>} />
        <div className="takeaway"><b>מה לקחת מההלכה</b>{takeaway}</div>
      </div>
      <div className="stage">{stage(g.focus)}</div>
    </section>
  );
}
