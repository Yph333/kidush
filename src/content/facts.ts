// "What we've computed so far" for the demo year: each fact is revealed by the slide that computes it.

import { TYPE_NAME, fmtMolad, isLeap, keviut, monthsBefore, pesachDay, rh, yearLen, yearType } from '../engines/calendar';
import { NUM, RULE_NAME, dayWord, gStr } from '../lib/format';
import type { SlidePath } from './paths';

export interface Fact {
  key: string;
  label: string;
  slide: SlidePath;
  value: (y: number) => string;
}

export const FACTS: Fact[] = [
  { key: 'months', label: 'חודשים מבהר״ד', slide: 'luach/bahrad', value: y => NUM(monthsBefore(y)) },
  { key: 'leap', label: 'פשוטה או מעוברת', slide: 'shana/katan', value: y => (isLeap(y) ? 'מעוברת' : 'פשוטה') },
  { key: 'molad', label: 'מולד תשרי', slide: 'luach/odfim', value: y => fmtMolad(rh(y).t) },
  { key: 'dechiyot', label: 'דחיות', slide: 'kelim/machshevon', value: y => rh(y).rules.map(k => RULE_NAME[k]).join(', ') || 'אין' },
  { key: 'rh', label: 'ראש השנה', slide: 'kelim/machshevon', value: y => `${dayWord(rh(y).day)} ${gStr(rh(y).day)}`.trim() },
  { key: 'length', label: 'אורך השנה', slide: 'luach/sugim', value: y => `${yearLen(y)} ימים, ${TYPE_NAME[yearType(yearLen(y))!]}` },
  { key: 'keviut', label: 'קביעות', slide: 'luach/keviut', value: y => keviut(y) },
  { key: 'pesach', label: 'פסח', slide: 'luach/keviut', value: y => `${dayWord(pesachDay(y))} ${gStr(pesachDay(y))}`.trim() },
];
