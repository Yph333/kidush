// Zmanim as opinions. Each one: a name, its exact definition (degrees or fixed minutes, as data the engine
// computes), a source, and a note. Shown as opinions with sources, never as a ruling.
// Attributions not checked against the original texts are marked "TODO: verify" (CLAUDE.md rule 4).
// Ids match tests/zmanim-oracle.json (KosherJava) where an identical definition exists there.

import type { ZmanDef } from '../engines/zmanim';

export type ZmanGroup =
  | 'alot' | 'misheyakir' | 'sunrise' | 'shma' | 'tefila' | 'chatzot'
  | 'mincha_gedola' | 'mincha_ketana' | 'plag' | 'sunset' | 'tzeit';

export interface ZmanOpinion {
  id: string;
  group: ZmanGroup;
  /** short label for tables */
  name: string;
  def: ZmanDef;
  /** the definition in words */
  definition: string;
  source: string;
  note?: string;
}

export const GROUP_NAME: Record<ZmanGroup, string> = {
  alot: 'עלות השחר', misheyakir: 'משיכיר', sunrise: 'זריחה', shma: 'סוף זמן ק״ש', tefila: 'סוף זמן תפילה',
  chatzot: 'חצות היום', mincha_gedola: 'מנחה גדולה', mincha_ketana: 'מנחה קטנה', plag: 'פלג המנחה',
  sunset: 'שקיעה', tzeit: 'צאת הכוכבים',
};

// ---- building blocks
const rise = (horizon: 'mishor' | 'elevation' | 'visible' = 'mishor'): ZmanDef => ({ kind: 'sun', event: 'rise', horizon });
const set = (horizon: 'mishor' | 'elevation' | 'visible' = 'mishor'): ZmanDef => ({ kind: 'sun', event: 'set', horizon });
const below = (event: 'rise' | 'set', deg: number): ZmanDef => ({ kind: 'degrees', event, deg });
const off = (from: ZmanDef, minutes: number): ZmanDef => ({ kind: 'offset', from, minutes });
const hours = (start: ZmanDef, end: ZmanDef, h: number): ZmanDef => ({ kind: 'hours', start, end, hours: h });

/** The two standard "days" for temporal hours. */
export const DAY_GRA = { start: rise(), end: set(), label: 'מהזריחה עד השקיעה (גר״א)' };
export const DAY_MGA_72 = { start: off(rise(), -72), end: off(set(), 72), label: 'מעלות השחר עד צאת הכוכבים, 72 דקות (מג״א)' };
export const DAY_MGA_16_1 = { start: below('rise', 16.1), end: below('set', 16.1), label: 'מעלות השחר עד צאת הכוכבים, 16.1° (מג״א)' };

const TODO = 'TODO: verify';

export const ZMANIM: ZmanOpinion[] = [
  // עלות השחר
  { id: 'alot_16_1', group: 'alot', name: '16.1°', def: below('rise', 16.1), definition: 'השמש 16.1° מתחת לאופק לפני הזריחה.', source: TODO, note: 'בירושלים, בניסן ובתשרי, זה כ־72 דקות לפני הזריחה.' },
  { id: 'alot_19_75', group: 'alot', name: '19.75°', def: below('rise', 19.75), definition: 'השמש 19.75° מתחת לאופק לפני הזריחה.', source: TODO, note: 'בירושלים, בניסן ובתשרי, זה כ־90 דקות לפני הזריחה.' },
  { id: 'alot_72', group: 'alot', name: '72 דקות', def: off(rise(), -72), definition: '72 דקות קבועות לפני הזריחה המישורית.', source: 'פסחים צד ע״א: ד׳ מילין (ר׳ יהודה); 72 דקות לפי מיל של 18 דקות' },
  { id: 'alot_90', group: 'alot', name: '90 דקות', def: off(rise(), -90), definition: '90 דקות קבועות לפני הזריחה המישורית.', source: 'פסחים צג ע״ב: ה׳ מילין (ר׳ יוחנן); 90 דקות לפי מיל של 18 דקות' },
  // משיכיר
  { id: 'misheyakir_10_2', group: 'misheyakir', name: '10.2°', def: below('rise', 10.2), definition: 'השמש 10.2° מתחת לאופק לפני הזריחה.', source: TODO },
  { id: 'misheyakir_11', group: 'misheyakir', name: '11°', def: below('rise', 11), definition: 'השמש 11° מתחת לאופק לפני הזריחה.', source: TODO },
  // זריחה
  { id: 'sunrise_mishor', group: 'sunrise', name: 'מישורית', def: rise('mishor'), definition: 'מרכז השמש 0.833° מתחת לאופק המתמטי (34′ שבירת אור ו־16′ חצי קוטר השמש), בגובה פני הים.', source: 'הגדרה אסטרונומית מקובלת' },
  { id: 'sunrise_elevation', group: 'sunrise', name: 'לפי גובה המקום', def: rise('elevation'), definition: 'כמו מישורית, ועוד שקיעת האופק לגובה המקום: ≈ 1.76′·√h.', source: 'הגדרה אסטרונומית מקובלת' },
  { id: 'sunrise_visible', group: 'sunrise', name: 'נראית', def: rise('visible'), definition: 'הרגע שבו שפת השמש העליונה עולה מעל קו האופק בפועל (הרים ומבנים), לפי פרופיל האופק שהוזן.', source: TODO, note: 'בלי פרופיל אופק: זהה לזריחה לפי גובה המקום.' },
  // סוף זמן ק״ש
  { id: 'shma_gra', group: 'shma', name: 'גר״א', def: hours(DAY_GRA.start, DAY_GRA.end, 3), definition: '3 שעות זמניות, כשהיום נמדד מהזריחה עד השקיעה.', source: TODO },
  { id: 'shma_mga_72', group: 'shma', name: 'מג״א, 72 דקות', def: hours(DAY_MGA_72.start, DAY_MGA_72.end, 3), definition: '3 שעות זמניות, כשהיום נמדד מעלות השחר (72 דקות) עד צאת הכוכבים (72 דקות).', source: TODO },
  { id: 'shma_mga_16_1', group: 'shma', name: 'מג״א, 16.1°', def: hours(DAY_MGA_16_1.start, DAY_MGA_16_1.end, 3), definition: '3 שעות זמניות, כשהיום נמדד מ־16.1° לפני הזריחה עד 16.1° אחרי השקיעה.', source: TODO },
  // סוף זמן תפילה
  { id: 'tefila_gra', group: 'tefila', name: 'גר״א', def: hours(DAY_GRA.start, DAY_GRA.end, 4), definition: '4 שעות זמניות מהזריחה (יום: זריחה עד שקיעה).', source: TODO },
  { id: 'tefila_mga_72', group: 'tefila', name: 'מג״א, 72 דקות', def: hours(DAY_MGA_72.start, DAY_MGA_72.end, 4), definition: '4 שעות זמניות (יום: עלות השחר עד צאת הכוכבים, 72 דקות).', source: TODO },
  { id: 'tefila_mga_16_1', group: 'tefila', name: 'מג״א, 16.1°', def: hours(DAY_MGA_16_1.start, DAY_MGA_16_1.end, 4), definition: '4 שעות זמניות (יום: 16.1° עד 16.1°).', source: TODO },
  // חצות
  { id: 'chatzot', group: 'chatzot', name: 'צהרי השמש', def: { kind: 'noon' }, definition: 'הרגע שבו השמש עוברת את קו הצהריים של המקום (צהרי השמש האמיתיים).', source: 'הגדרה אסטרונומית' },
  // מנחה גדולה / קטנה / פלג
  { id: 'mincha_gedola_gra', group: 'mincha_gedola', name: 'גר״א', def: hours(DAY_GRA.start, DAY_GRA.end, 6.5), definition: '6½ שעות זמניות (יום: זריחה עד שקיעה).', source: TODO },
  { id: 'mincha_gedola_mga_72', group: 'mincha_gedola', name: 'מג״א, 72 דקות', def: hours(DAY_MGA_72.start, DAY_MGA_72.end, 6.5), definition: '6½ שעות זמניות (יום: 72 דקות לפני הזריחה עד 72 דקות אחרי השקיעה).', source: TODO },
  { id: 'mincha_gedola_mga_16_1', group: 'mincha_gedola', name: 'מג״א, 16.1°', def: hours(DAY_MGA_16_1.start, DAY_MGA_16_1.end, 6.5), definition: '6½ שעות זמניות (יום: 16.1° עד 16.1°).', source: TODO },
  { id: 'mincha_ketana_gra', group: 'mincha_ketana', name: 'גר״א', def: hours(DAY_GRA.start, DAY_GRA.end, 9.5), definition: '9½ שעות זמניות (יום: זריחה עד שקיעה).', source: TODO },
  { id: 'mincha_ketana_mga_72', group: 'mincha_ketana', name: 'מג״א, 72 דקות', def: hours(DAY_MGA_72.start, DAY_MGA_72.end, 9.5), definition: '9½ שעות זמניות (יום: 72 דקות לפני הזריחה עד 72 דקות אחרי השקיעה).', source: TODO },
  { id: 'mincha_ketana_mga_16_1', group: 'mincha_ketana', name: 'מג״א, 16.1°', def: hours(DAY_MGA_16_1.start, DAY_MGA_16_1.end, 9.5), definition: '9½ שעות זמניות (יום: 16.1° עד 16.1°).', source: TODO },
  { id: 'plag_gra', group: 'plag', name: 'גר״א', def: hours(DAY_GRA.start, DAY_GRA.end, 10.75), definition: '10¾ שעות זמניות (יום: זריחה עד שקיעה).', source: TODO },
  { id: 'plag_mga_72', group: 'plag', name: 'מג״א, 72 דקות', def: hours(DAY_MGA_72.start, DAY_MGA_72.end, 10.75), definition: '10¾ שעות זמניות (יום: 72 דקות לפני הזריחה עד 72 דקות אחרי השקיעה).', source: TODO },
  { id: 'plag_mga_16_1', group: 'plag', name: 'מג״א, 16.1°', def: hours(DAY_MGA_16_1.start, DAY_MGA_16_1.end, 10.75), definition: '10¾ שעות זמניות (יום: 16.1° עד 16.1°).', source: TODO },
  // שקיעה
  { id: 'sunset_mishor', group: 'sunset', name: 'מישורית', def: set('mishor'), definition: 'מרכז השמש 0.833° מתחת לאופק המתמטי, בגובה פני הים.', source: 'הגדרה אסטרונומית מקובלת' },
  { id: 'sunset_elevation', group: 'sunset', name: 'לפי גובה המקום', def: set('elevation'), definition: 'כמו מישורית, ועוד שקיעת האופק לגובה המקום: ≈ 1.76′·√h.', source: 'הגדרה אסטרונומית מקובלת' },
  { id: 'sunset_visible', group: 'sunset', name: 'נראית', def: set('visible'), definition: 'הרגע שבו שפת השמש העליונה נעלמת מאחורי קו האופק בפועל, לפי פרופיל האופק שהוזן.', source: TODO, note: 'בלי פרופיל אופק: זהה לשקיעה לפי גובה המקום.' },
  // צאת הכוכבים
  { id: 'tzeit_8_5', group: 'tzeit', name: '8.5°', def: below('set', 8.5), definition: 'השמש 8.5° מתחת לאופק אחרי השקיעה.', source: TODO },
  { id: 'tzeit_7_083', group: 'tzeit', name: '7.083°', def: below('set', 7.083), definition: 'השמש 7.083° (7° ו־5′) מתחת לאופק אחרי השקיעה.', source: TODO },
  { id: 'tzeit_6_45', group: 'tzeit', name: '6.45°', def: below('set', 6.45), definition: 'השמש 6.45° מתחת לאופק אחרי השקיעה.', source: TODO },
  { id: 'tzeit_13_5_min', group: 'tzeit', name: '13.5 דקות', def: off(set(), 13.5), definition: '13½ דקות קבועות אחרי השקיעה המישורית.', source: TODO },
  { id: 'tzeit_18_min', group: 'tzeit', name: '18 דקות', def: off(set(), 18), definition: '18 דקות קבועות אחרי השקיעה המישורית.', source: TODO },
  { id: 'tzeit_20_min', group: 'tzeit', name: '20 דקות', def: off(set(), 20), definition: '20 דקות קבועות אחרי השקיעה המישורית.', source: TODO },
  { id: 'tzeit_24_min', group: 'tzeit', name: '24 דקות', def: off(set(), 24), definition: '24 דקות קבועות אחרי השקיעה המישורית.', source: TODO },
  { id: 'tzeit_rt_72', group: 'tzeit', name: 'רבנו תם, 72 דקות', def: off(set(), 72), definition: '72 דקות קבועות אחרי השקיעה המישורית.', source: 'תוספות שבת לה ע״א ד״ה תרי: משקיעת החמה עד צאת הכוכבים ד׳ מילין, ור״ת: מסוף השקיעה. 72 דקות לפי מיל של 18 דקות' },
  { id: 'tzeit_rt_16_1', group: 'tzeit', name: 'רבנו תם, 16.1°', def: below('set', 16.1), definition: 'השמש 16.1° מתחת לאופק אחרי השקיעה.', source: TODO },
];

export const ZMAN_BY_ID = new Map(ZMANIM.map(z => [z.id, z]));

/** A sensible default set for a one-line-per-zman table (one opinion per group). */
export const DEFAULT_PICK: Record<ZmanGroup, string> = {
  alot: 'alot_16_1', misheyakir: 'misheyakir_11', sunrise: 'sunrise_mishor', shma: 'shma_gra', tefila: 'tefila_gra',
  chatzot: 'chatzot', mincha_gedola: 'mincha_gedola_gra', mincha_ketana: 'mincha_ketana_gra', plag: 'plag_gra',
  sunset: 'sunset_mishor', tzeit: 'tzeit_8_5',
};
