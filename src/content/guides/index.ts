// Every guided explanation, by slide. Slides import their own guide directly; this list is for checks.

import type { SlidePath } from '../paths';
import { ADU, LAMA } from './dechiyot';
import type { GuideDef } from './types';

export const GUIDES: Partial<Record<SlidePath, GuideDef>> = {
  'dechiyot/lama': LAMA,
  'dechiyot/adu': ADU,
};
