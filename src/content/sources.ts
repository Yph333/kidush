// Sources shown at the foot of each slide. Only public-domain texts are quoted on slides
// (Rambam, Kitzur Shulchan Aruch, Tur, Gemara). References are given at chapter level unless
// the exact halacha was checked; anything unchecked is marked "TODO: verify".

import type { SlidePath } from './paths';

export interface SourceRef { ref: string; note?: string }

const KITZUR = 'קיצור שלחן ערוך, סדר לעשות לוח בקצרה';
const KH = 'רמב״ם, הלכות קידוש החודש';
// Exact halachot in chapters ו–ח were checked against the fetched text (content/rambamKH.json).

export const SOURCES: Record<SlidePath, SourceRef[]> = {
  'yesodot/petiha': [{ ref: KITZUR }, { ref: `${KH}, פרקים ו–ח` }],
  'yesodot/yehidot': [{ ref: `${KH} ו, ב`, note: 'השעה מחולקת לאלף ושמנים חלקים' }],
  'yom/shemesh': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 25, 28', note: 'נטיית השמש ומשוואת הזמן' }, { ref: 'NOAA Solar Calculator', note: 'אותו מודל משמש את KosherJava' }],
  'yom/zmanim': [{ ref: 'src/content/zmanimOpinions.ts', note: 'מקור לכל שיטה בנפרד; ייחוסים שלא אומתו מסומנים TODO: verify' }],
  'yom/mad': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 13', note: 'גובה השמש' }],
  'yom/rabenutam': [{ ref: 'תוספות, שבת לה ע״א, ד״ה תרי', note: 'ד׳ מילין משקיעה עד צאת הכוכבים; תחילת שקיעה וסוף שקיעה' }, { ref: 'פסחים צד ע״א', note: 'ד׳ מילין לר׳ יהודה' }],
  'yom/gova': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 16', note: 'שבירת אור (Bennett)' }, { ref: 'שקיעת האופק ≈ 1.76′·√h', note: 'נוסחה ניווטית מקובלת' }],
  'yom/kipa': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 13' }],
  'yom/shnati': [{ ref: 'src/content/zmanimOpinions.ts' }],
  'chodesh/levana': [{ ref: KITZUR, note: 'אורך חודש הלבנה' }, { ref: `${KH} ו, ג; ו, ה–ז` }],
  'chodesh/maslul': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 25, 47', note: 'המודל האסטרונומי המקוצר' }],
  'chodesh/shamayim': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 13, 15', note: 'גובה ואזימוט, זריחה ושקיעה' }],
  'chodesh/natui': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 47', note: 'מקום הראש הממוצע' }, { ref: `${KH}, פרק טז`, note: 'מקום הראש ורוחב הירח' }],
  'chodesh/likuyim': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 54', note: 'ליקויים: זמן, γ, סוג וגודל' }, { ref: 'NASA Five Millennium Canon', note: 'נבדק מול רשימת הליקויים' }],
  'shana/katan': [{ ref: `${KH} ו, י–יא`, note: 'מחזור של 19 שנה; השנים המעוברות' }],
  'shana/gadol': [{ ref: KITZUR, note: 'אורך התקופה' }, { ref: `${KH} ט, א–ג`, note: 'תקופת שמואל' }, { ref: 'ברכות נט ע״ב', note: 'ברכת החמה: כל כ״ח שנים, באורתא דתלת נגהי ארבע' }],
  'shana/tekufot': [{ ref: `${KH} ט, ג`, note: 'שמואל: ז׳ ימים ט׳ שעות תרמ״ב חלקים לפני מולד ניסן' }, { ref: `${KH} י, א; י, ג`, note: 'רב אדא: שנתו, וט׳ שעות תרמ״ב לפני מולד ניסן' }, { ref: 'J. Meeus, Astronomical Algorithms, פרק 27', note: 'שוויון והיפוך' }],
  'shana/tsir': [{ ref: `${KH} ט–י` }, { ref: 'שולחן ערוך, אורח חיים קיז, א', note: 'שאלת מטר בחוץ לארץ: בערבית של יום ס׳ אחרי תקופת תשרי' }],
  'luach/bahrad': [{ ref: `${KH} ו, ח; ו, יג–יד`, note: 'מולד בהר״ד' }],
  'luach/odfim': [{ ref: KITZUR, note: 'חישוב בעודפים' }, { ref: `${KH} ו, ה–ט; ו, יב–טו` }],
  'luach/sugim': [{ ref: `${KH} ח, ה–ט`, note: 'חודשים מלאים וחסרים, סדר החודשים' }],
  'luach/keviut': [{ ref: 'טור, אורח חיים תכח', note: 'קביעות ראש השנה וסוג השנה, וכללים קצרים' }, { ref: `${KH} ח, י`, note: 'סימנים לסדר החודשים' }, { ref: 'סימון בשלוש אותיות', note: 'מקובל בלוחות; מקור הסימון: TODO: verify' }],
  'dechiyot/adu': [{ ref: 'ראש השנה כ ע״א', note: 'עולא: משום ירקיא; ר׳ אחא בר חנינא: משום מתיא' }, { ref: 'סוכה מג ע״ב', note: 'ערבה בשבת' }, { ref: `${KH} ז, א; ז, ז`, note: 'הדין והטעם האסטרונומי' }, { ref: 'טור, אורח חיים תכח', note: 'לא אד״ו ראש; מולד זקן' }],
  'dechiyot/zaken': [{ ref: KITZUR, note: 'מולד זקן' }, { ref: 'ראש השנה כ ע״ב', note: 'נולד קודם חצות, בידוע שנראה סמוך לשקיעת החמה' }, { ref: `${KH} ז, ב–ג` }],
  'dechiyot/gatrad': [{ ref: `${KH} ז, ד; ז, ו` }],
  'dechiyot/betu': [{ ref: `${KH} ז, ה–ו` }],
  'dechiyot/argaz': [{ ref: `${KH} ז, א–ח`, note: 'ארבע הדחיות וטעמן' }],
  'reiya/memutza': [{ ref: `${KH} ו, א; ז, ז` }, { ref: 'J. Meeus, Astronomical Algorithms, פרק 49' }],
  'reiya/reiya': [
    { ref: `${KH}, פרקים יא–יז`, note: 'חשבון הראייה' },
    { ref: 'M. Sh. Odeh, “New Criterion for Lunar Crescent Visibility”, Experimental Astronomy 18 (2004) 39–64', note: 'doi:10.1007/s10686-005-9002-5' },
  ],
  'reiya/galgalim': [{ ref: `${KH} יד, א`, note: 'גלגל קטן שמסבב בגלגל גדול' }, { ref: `${KH} טו, ו`, note: 'לוח מנת המסלול' }],
  'kelim/luach': [{ ref: 'שולחן ערוך, אורח חיים תקנ, ג', note: 'ארבעה צומות שחלו בשבת נדחים לאחר השבת' }, { ref: 'שולחן ערוך, אורח חיים תרפו, ב', note: 'תענית אסתר מוקדמת ליום חמישי' }],
  'reiya/tavlaot': [{ ref: `${KH} יג, ד; יג, ז`, note: 'מנת מסלול השמש, וחלוקה בין השורות' }, { ref: `${KH} יד, ה`, note: 'תיקון לפי מזל השמש' }, { ref: `${KH} טו, ג; טו, ו`, note: 'המרחק הכפול; מנת המסלול של הירח' }, { ref: `${KH} טז, יא–יג`, note: 'רוחב הירח' }, { ref: `${KH} יז, ו–ז; יז, י–יב; יז, טז–כא`, note: 'שינוי המראה, מעגל הירח, האורך הרביעי, קיצי הראייה' }],
  'kelim/makor': [{ ref: 'ויקיטקסט: רמב״ם הלכות קידוש החודש ו–ח (דפוס וורשא־ווילנא)' }],
  'kelim/machshevon': [{ ref: KITZUR }, { ref: `${KH}, פרקים ו–ח` }],
};
