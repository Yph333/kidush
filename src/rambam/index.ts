// The Rambam track: Hilchot Kiddush HaChodesh, halacha by halacha. Chapters appear here as they are built.

import type { ChapterDef } from '../chapters/types';
import type { GuideDef } from '../content/guides/types';
import { GUIDE_14_1, H14_1 } from './ch14/H1';
import { GUIDE_14_2, GUIDE_14_3, GUIDE_14_4, H14_2, H14_3, H14_4 } from './ch14/H2to4';
import { GUIDE_14_5, GUIDE_14_6, H14_5, H14_6 } from './ch14/H5to6';
import { CH1 } from './ch1';
import { CH2 } from './ch2';
import { CH3 } from './ch3';
import { CH4 } from './ch4';
import { CH5 } from './ch5';
import { CH6 } from './ch6';
import { CH7 } from './ch7';
import { CH8 } from './ch8';
import { CH9 } from './ch9';
import { CH10 } from './ch10';
import { CH11 } from './ch11';
import { CH12 } from './ch12';
import { CH13 } from './ch13';
import { CH15 } from './ch15';
import { CH16 } from './ch16';
import { CH17 } from './ch17';
import { CH18 } from './ch18';
import { CH19 } from './ch19';

export const RAMBAM_CHAPTERS: ChapterDef[] = [
  CH1.chapter,
  CH2.chapter,
  CH3.chapter,
  CH4.chapter,
  CH5.chapter,
  CH6.chapter,
  CH7.chapter,
  CH8.chapter,
  CH9.chapter,
  CH10.chapter,
  CH11.chapter,
  CH12.chapter,
  CH13.chapter,
  { id: 'rambam/14', track: 'rambam', num: 14, title: 'פרק י״ד: מהלך הירח האמצעי', slides: [
    { id: '1', title: 'הלכה א: שני גלגלים', Component: H14_1 },
    { id: '2', title: 'הלכה ב: הטבלה של אמצע הירח', Component: H14_2 },
    { id: '3', title: 'הלכה ג: הטבלה של אמצע המסלול', Component: H14_3 },
    { id: '4', title: 'הלכה ד: העיקר והחשבון', Component: H14_4 },
    { id: '5', title: 'הלכה ה: התיקון לפי השמש', Component: H14_5 },
    { id: '6', title: 'הלכה ו: לשעת הראייה', Component: H14_6 },
  ] },
  CH15.chapter,
  CH16.chapter,
  CH17.chapter,
  CH18.chapter,
  CH19.chapter,
];

/** Every halacha's guide, for checks (marks must be phrases of the text). */
export const RAMBAM_GUIDES: { ch: number; h: string; guide: GuideDef }[] = [
  ...CH1.guides,
  ...CH2.guides,
  ...CH3.guides,
  ...CH4.guides,
  ...CH5.guides,
  ...CH6.guides,
  ...CH7.guides,
  ...CH8.guides,
  ...CH9.guides,
  ...CH10.guides,
  ...CH11.guides,
  ...CH12.guides,
  ...CH13.guides,
  { ch: 14, h: 'א', guide: GUIDE_14_1 },
  { ch: 14, h: 'ב', guide: GUIDE_14_2 },
  { ch: 14, h: 'ג', guide: GUIDE_14_3 },
  { ch: 14, h: 'ד', guide: GUIDE_14_4 },
  { ch: 14, h: 'ה', guide: GUIDE_14_5 },
  { ch: 14, h: 'ו', guide: GUIDE_14_6 },
  ...CH15.guides,
  ...CH16.guides,
  ...CH17.guides,
  ...CH18.guides,
  ...CH19.guides,
];
