// The Rambam track: Hilchot Kiddush HaChodesh, halacha by halacha. Chapters appear here as they are built.

import type { ChapterDef } from '../chapters/types';
import type { GuideDef } from '../content/guides/types';
import { GUIDE_14_1, H14_1 } from './ch14/H1';

export const RAMBAM_CHAPTERS: ChapterDef[] = [
  { id: 'rambam/14', track: 'rambam', num: 14, title: 'פרק י״ד: מהלך הירח האמצעי', slides: [
    { id: '1', title: 'הלכה א: שני גלגלים', Component: H14_1 },
  ] },
];

/** Every halacha's guide, for checks (marks must be phrases of the text). */
export const RAMBAM_GUIDES: { ch: number; h: string; guide: GuideDef }[] = [
  { ch: 14, h: 'א', guide: GUIDE_14_1 },
];
