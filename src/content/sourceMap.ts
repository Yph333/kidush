// Reverse map for the "page from the source": each halacha of Hilchot Kiddush HaChodesh 6–8 → the slides that
// explain it. Halacha numbers were checked against the fetched text (src/content/rambamKH.json).

import type { SlidePath } from './paths';

export const RAMBAM_TO_SLIDES: Record<string, SlidePath[]> = {
  '6:א': ['reiya/memutza'],
  '6:ב': ['yesodot/yehidot'],
  '6:ג': ['chodesh/levana'],
  '6:ד': ['shana/katan'],
  '6:ה': ['chodesh/levana', 'luach/odfim'],
  '6:ו': ['chodesh/levana'],
  '6:ז': ['chodesh/levana'],
  '6:ח': ['luach/bahrad', 'luach/odfim'],
  '6:ט': ['luach/odfim'],
  '6:י': ['shana/katan'],
  '6:יא': ['shana/katan'],
  '6:יב': ['luach/odfim'],
  '6:יג': ['luach/odfim', 'luach/bahrad'],
  '6:יד': ['luach/bahrad', 'luach/odfim'],
  '6:טו': ['luach/odfim'],
  '7:א': ['dechiyot/adu'],
  '7:ב': ['dechiyot/zaken'],
  '7:ג': ['dechiyot/zaken'],
  '7:ד': ['dechiyot/gatrad'],
  '7:ה': ['dechiyot/betu'],
  '7:ו': ['dechiyot/gatrad', 'dechiyot/betu'],
  '7:ז': ['dechiyot/adu', 'reiya/memutza'],
  '7:ח': ['dechiyot/zaken', 'dechiyot/argaz'],
  '8:א': ['chodesh/levana'],
  '8:ב': ['chodesh/levana'],
  '8:ג': ['luach/sugim'],
  '8:ד': ['kelim/luach'],
  '8:ה': ['luach/sugim'],
  '8:ו': ['luach/sugim'],
  '8:ז': ['luach/sugim'],
  '8:ח': ['luach/sugim'],
  '8:ט': ['luach/sugim'],
  '8:י': ['luach/keviut'],
};

/** Prototype excerpts attributed to "סדר לעשות לוח בקצרה" (Kitzur). Full text not yet available: TODO. */
export const KITZUR_EXCERPTS: { text: string; slides: SlidePath[] }[] = [
  { text: 'דע, שחדש הלבנה כ״ט ימים, י״ב שעות, תשצ״ג חלקים', slides: ['chodesh/levana'] },
  { text: 'אם כן הרי שמונה ימים; צא מהן שבעה שכלים בשבוע, אם כן הרי המולד א׳ י״א שי״ד', slides: ['luach/odfim'] },
  { text: 'תקופה נמשכת מחברתה תשעים ואחד ימים, שבע שעות ומחצה', slides: ['shana/gadol'] },
  { text: 'והשנית, מולד זקן בל תדרש, כגון אם חל המולד בי״ח שעות או אחר י״ח שעות, אין קובעין ראש השנה באותו יום', slides: ['dechiyot/zaken'] },
];
