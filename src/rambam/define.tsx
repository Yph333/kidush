// A chapter of the Rambam track from a list of halachot: each becomes a slide (HalachaSlide) and its guide is
// registered for the checks (marked phrases must be in the text).

import type { ReactNode } from 'react';
import type { ChapterDef } from '../chapters/types';
import type { GuideDef } from '../content/guides/types';
import { HalachaSlide } from './HalachaSlide';
import { chapterHeb } from './text';

export interface HalachaDef<F extends string = string> {
  h: string;
  title: string;
  guide: GuideDef<F>;
  takeaway: ReactNode;
  before?: ReactNode;
  /** render the visual for the current guide step (a component, so it may hold state) */
  stage: (focus: F | undefined) => ReactNode;
}

/** Keep each halacha's focus type when listing them together. */
export const halacha = <F extends string>(d: HalachaDef<F>): HalachaDef => d as unknown as HalachaDef;

export const HEB_ORDER = ['א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט', 'כ', 'כא', 'כב', 'כג', 'כד'];

export function defineChapter(num: number, title: string, list: HalachaDef[]): { chapter: ChapterDef; guides: { ch: number; h: string; guide: GuideDef }[] } {
  const slides = list.map(d => {
    const n = HEB_ORDER.indexOf(d.h) + 1;
    const Component = () => <HalachaSlide ch={num} h={d.h} title={d.title} guide={d.guide} before={d.before} takeaway={d.takeaway} stage={d.stage} />;
    Component.displayName = `Halacha_${num}_${n}`;
    return { id: String(n), title: `הלכה ${d.h}: ${d.title}`, Component };
  });
  return {
    chapter: { id: `rambam/${num}`, track: 'rambam', num, title: `פרק ${chapterHeb(num)}: ${title}`, slides },
    guides: list.map(d => ({ ch: num, h: d.h, guide: d.guide })),
  };
}
