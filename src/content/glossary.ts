// Glossary. Definitions are written for this site (not copied from modern works).
// Sources are chapter-level; anything not checked is marked "TODO: verify".

import type { SlidePath } from './paths';

export interface GlossaryEntry {
  term: string;
  def: string;
  source: string;
  /** slide that explains it */
  slide: SlidePath;
}

const KH = 'רמב״ם, הלכות קידוש החודש';

export const GLOSSARY = {
  chelek: { term: 'חלק', def: 'יחידת הזמן הקטנה של הלוח: 1/1080 של שעה, כלומר 3⅓ שניות. 18 חלקים הם דקה.', source: `${KH}, פרק ו`, slide: 'yesodot/yehidot' },
  molad: { term: 'מולד', def: 'הרגע שבו הלבנה ״נולדת מחדש״. בלוח הקבוע זהו המולד הממוצע: כל מולד רחוק מקודמו בדיוק כ״ט י״ב תשצ״ג.', source: `${KH}, פרק ו`, slide: 'chodesh/levana' },
  zaken: { term: 'מולד זקן', def: 'מולד תשרי שחל ב־18 שעות או אחריהן (מ־12:00 בצהריים). ראש השנה נדחה ליום שאחריו.', source: `${KH}, פרק ז`, slide: 'dechiyot/zaken' },
  odef: { term: 'עודף', def: 'מה שנשאר מפרק זמן אחרי שמורידים ממנו שבועות שלמים. העודף לבדו קובע באיזה יום בשבוע ייפול המולד.', source: `${KH}, פרק ו`, slide: 'luach/odfim' },
  katan: { term: 'מחזור קטן', def: 'מחזור של 19 שנה, שבו 7 שנים מעוברות (גו״ח אדז״ט). 235 חודשי לבנה שווים כמעט בדיוק ל־19 שנות חמה.', source: `${KH}, פרק ו`, slide: 'shana/katan' },
  gadol: { term: 'מחזור גדול', def: 'מחזור של 28 שנה, שאחריו תקופת ניסן לפי שמואל חוזרת לאותו יום ולאותה שעה. בתחילתו מברכים ברכת החמה.', source: `${KH}, פרק ט`, slide: 'shana/gadol' },
  tekufa: { term: 'תקופה', def: 'רבע משנת החמה, מנקודת שוויון או היפוך אחת לבאה. לפי שמואל: 91 ימים ו־7½ שעות.', source: `${KH}, פרקים ט–י`, slide: 'shana/gadol' },
  keviut: { term: 'קביעות', def: 'סימן של שלוש אותיות לכל שנה: יום ראש השנה, סוג השנה (ח, כ, ש) ויום פסח. יש בדיוק 14 קביעויות.', source: 'טור, אורח חיים, סימן תכח. TODO: verify', slide: 'luach/keviut' },
  emtza: { term: 'אמצע', def: 'המקום הממוצע של השמש או הירח: איפה היו אילו נעו במהירות קבועה.', source: `${KH}, פרקים יב, יד`, slide: 'reiya/reiya' },
  gova: { term: 'גובה', def: 'אצל הרמב״ם: הנקודה במסלול השמש שבה היא הכי רחוקה מהארץ (אפוגיאום). נעה לאט מאוד.', source: `${KH}, פרק יב`, slide: 'reiya/reiya' },
  maslul: { term: 'מסלול', def: 'המרחק בין מקום האמצע לגובה (בשמש) או המקום על הגלגל הקטן (בירח). לפיו נקבע התיקון.', source: `${KH}, פרקים יג, טו`, slide: 'reiya/reiya' },
  menat: { term: 'מנת המסלול', def: 'התיקון שמוסיפים או גורעים מהאמצע כדי לקבל את המקום האמיתי. נלקח מטבלה לפי המסלול.', source: `${KH}, פרקים יג, טו`, slide: 'reiya/reiya' },
  rosh: { term: 'ראש ותלי', def: 'שתי הנקודות שבהן מסלול הירח חוצה את מסלול השמש. ״הראש״ נע לאחור, סיבוב שלם בכ־18.6 שנה.', source: `${KH}, פרק טז`, slide: 'reiya/reiya' },
  rochav: { term: 'רוחב', def: 'כמה הירח צפונה או דרומה ממסלול השמש. לכל היותר כ־5 מעלות.', source: `${KH}, פרק טז`, slide: 'reiya/reiya' },
  shinui: { term: 'שינוי מראה', def: 'ההבדל בין מקום הירח כפי שהוא נראה מפני הארץ לבין מקומו כפי שהיה נראה ממרכז הארץ (פרלקסה).', source: `${KH}, פרק יז`, slide: 'reiya/reiya' },
  keshet: { term: 'קשת הראייה', def: 'התוצאה הסופית בחשבון הרמב״ם: כמה הירח רחוק מהשמש לעניין הראייה, אחרי כל התיקונים.', source: `${KH}, פרק יז`, slide: 'reiya/reiya' },
  kitzei: { term: 'קיצי הראייה', def: 'הגבולות שבהם מכריעים אם הסהר ייראה: השוואה בין קשת הראייה לאורך הראשון.', source: `${KH}, פרק יז`, slide: 'reiya/reiya' },
  shaaZmanit: { term: 'שעה זמנית', def: 'חלק אחד משנים עשר של היום. אורכה משתנה לפי עונת השנה ולפי השיטה שבה מגדירים את תחילת היום וסופו.', source: 'TODO: verify', slide: 'yom/bekarov' },
  alot: { term: 'עלות השחר', def: 'תחילת האור לפני הזריחה. מחושב לפי זווית השמש מתחת לאופק או לפי מספר דקות קבוע, לפי השיטות השונות.', source: 'TODO: verify', slide: 'yom/bekarov' },
  tzeit: { term: 'צאת הכוכבים', def: 'הזמן שבו רואים שלושה כוכבים בינוניים. מחושב לפי זווית השמש מתחת לאופק או לפי דקות קבועות, לפי השיטות השונות.', source: 'TODO: verify', slide: 'yom/bekarov' },
} satisfies Record<string, GlossaryEntry>;

export type GlossaryKey = keyof typeof GLOSSARY;
