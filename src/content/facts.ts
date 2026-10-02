// "What we've computed so far" for the demo year: each fact is revealed by the slide that computes it.

import { TYPE_NAME, fmtMolad, isLeap, keviut, monthsBefore, pesachDay, rh, yearLen, yearType } from '../engines/calendar';
import { NUM, RULE_NAME, dayWord, gStr } from '../lib/format';
import type { SlidePath } from './paths';

export interface Fact {
  key: string;
  label: string;
  slide: SlidePath;
  /** if set, the fact appears only after this year gate is answered (see content/gates.ts) */
  gate?: string;
  value: (y: number) => string;
}

export const FACTS: Fact[] = [
  { key: 'months', label: 'חודשים מבהר״ד', slide: 'luach/bahrad', value: y => NUM(monthsBefore(y)) },
  { key: 'leap', label: 'פשוטה או מעוברת', slide: 'shana/katan', gate: 'leap', value: y => (isLeap(y) ? 'מעוברת' : 'פשוטה') },
  { key: 'molad', label: 'מולד תשרי', slide: 'luach/odfim', gate: 'molad-day', value: y => fmtMolad(rh(y).t) },
  { key: 'dechiyot', label: 'דחיות', slide: 'kelim/machshevon', gate: 'rh-day', value: y => rh(y).rules.map(k => RULE_NAME[k]).join(', ') || 'אין' },
  { key: 'rh', label: 'ראש השנה', slide: 'kelim/machshevon', gate: 'rh-day', value: y => `${dayWord(rh(y).day)} ${gStr(rh(y).day)}`.trim() },
  { key: 'length', label: 'אורך השנה', slide: 'luach/sugim', gate: 'type', value: y => `${yearLen(y)} ימים, ${TYPE_NAME[yearType(yearLen(y))!]}` },
  { key: 'keviut', label: 'קביעות', slide: 'luach/keviut', gate: 'keviut', value: y => keviut(y) },
  { key: 'pesach', label: 'פסח', slide: 'luach/keviut', gate: 'keviut', value: y => `${dayWord(pesachDay(y))} ${gStr(pesachDay(y))}`.trim() },
];
