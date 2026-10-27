// The Rambam track: Hilchot Kiddush HaChodesh, halacha by halacha. Chapters appear here as they are built.

import type { ChapterDef } from '../chapters/types';
import type { GuideDef } from '../content/guides/types';
import { GUIDE_14_1, H14_1 } from './ch14/H1';
import { GUIDE_14_2, GUIDE_14_3, GUIDE_14_4, H14_2, H14_3, H14_4 } from './ch14/H2to4';
import { GUIDE_14_5, GUIDE_14_6, H14_5, H14_6 } from './ch14/H5to6';

export const RAMBAM_CHAPTERS: ChapterDef[] = [
  { id: 'rambam/14', track: 'rambam', num: 14, title: 'פרק י״ד: מהלך הירח האמצעי', slides: [
    { id: '1', title: 'הלכה א: שני גלגלים', Component: H14_1 },
    { id: '2', title: 'הלכה ב: הטבלה של אמצע הירח', Component: H14_2 },
    { id: '3', title: 'הלכה ג: הטבלה של אמצע המסלול', Component: H14_3 },
    { id: '4', title: 'הלכה ד: העיקר והחשבון', Component: H14_4 },
    { id: '5', title: 'הלכה ה: התיקון לפי השמש', Component: H14_5 },
    { id: '6', title: 'הלכה ו: לשעת הראייה', Component: H14_6 },
  ] },
];

/** Every halacha's guide, for checks (marks must be phrases of the text). */
export const RAMBAM_GUIDES: { ch: number; h: string; guide: GuideDef }[] = [
  { ch: 14, h: 'א', guide: GUIDE_14_1 },
  { ch: 14, h: 'ב', guide: GUIDE_14_2 },
  { ch: 14, h: 'ג', guide: GUIDE_14_3 },
  { ch: 14, h: 'ד', guide: GUIDE_14_4 },
  { ch: 14, h: 'ה', guide: GUIDE_14_5 },
  { ch: 14, h: 'ו', guide: GUIDE_14_6 },
];
