// The guess points along the path for one year, in teaching order. Each is a GuessGate on that slide;
// its stored key is "<id>@<year>". The opening slide has its own "before we start" guess (rh-day-start).

import type { SlidePath } from './paths';

export interface GatePoint { id: string; slide: SlidePath; label: string }

export const YEAR_GATES: GatePoint[] = [
  { id: 'leap', slide: 'shana/katan', label: 'פשוטה או מעוברת' },
  { id: 'molad-day', slide: 'luach/odfim', label: 'יום מולד תשרי' },
  { id: 'length', slide: 'luach/sugim', label: 'אורך השנה' },
  { id: 'type', slide: 'luach/sugim', label: 'סוג השנה' },
  { id: 'adu', slide: 'dechiyot/adu', label: 'האם חלה לא אד״ו' },
  { id: 'zaken', slide: 'dechiyot/zaken', label: 'האם חלה מולד זקן' },
  { id: 'gatrad', slide: 'dechiyot/gatrad', label: 'האם חלה גטר״ד' },
  { id: 'betu', slide: 'dechiyot/betu', label: 'האם חלה בטו תקפט' },
  { id: 'keviut', slide: 'luach/keviut', label: 'הקביעות' },
  { id: 'rh-day', slide: 'kelim/machshevon', label: 'יום ראש השנה' },
];

export const gateKey = (id: string, year: number | string): string => `${id}@${year}`;
