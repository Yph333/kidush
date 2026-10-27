// Every guided explanation, by slide. Slides import their own guide directly; this list is for checks.

import type { SlidePath } from '../paths';
import { ADU, ARGAZ, BETU, GATRAD, LAMA, ZAKEN } from './dechiyot';
import type { GuideDef } from './types';

export const GUIDES: Partial<Record<SlidePath, GuideDef>> = {
  'dechiyot/lama': LAMA,
  'dechiyot/adu': ADU,
  'dechiyot/zaken': ZAKEN,
  'dechiyot/gatrad': GATRAD,
  'dechiyot/betu': BETU,
  'dechiyot/argaz': ARGAZ,
};
