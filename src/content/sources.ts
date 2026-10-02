// Sources shown at the foot of each slide. Only public-domain texts are quoted on slides
// (Rambam, Kitzur Shulchan Aruch, Tur, Gemara). References are given at chapter level unless
// the exact halacha was checked; anything unchecked is marked "TODO: verify".

import type { SlidePath } from './paths';

export interface SourceRef { ref: string; note?: string }

const KITZUR = 'קיצור שלחן ערוך, סדר לעשות לוח בקצרה';
const KH = 'רמב״ם, הלכות קידוש החודש';

export const SOURCES: Record<SlidePath, SourceRef[]> = {
  'yesodot/petiha': [{ ref: KITZUR }, { ref: `${KH}, פרקים ו–ח` }],
  'yesodot/yehidot': [{ ref: `${KH}, פרק ו`, note: 'השעה מחולקת ל־1080 חלקים' }],
  'yom/shemesh': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 25, 28', note: 'נטיית השמש ומשוואת הזמן' }, { ref: 'NOAA Solar Calculator', note: 'אותו מודל משמש את KosherJava' }],
  'yom/zmanim': [{ ref: 'src/content/zmanimOpinions.ts', note: 'מקור לכל שיטה בנפרד; ייחוסים שלא אומתו מסומנים TODO: verify' }],
  'yom/mad': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 13', note: 'גובה השמש' }],
  'yom/gova': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 16', note: 'שבירת אור (Bennett)' }, { ref: 'שקיעת האופק ≈ 1.76′·√h', note: 'נוסחה ניווטית מקובלת' }],
  'yom/kipa': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 13' }],
  'yom/shnati': [{ ref: 'src/content/zmanimOpinions.ts' }],
  'chodesh/levana': [{ ref: KITZUR, note: 'אורך חודש הלבנה' }, { ref: `${KH}, פרק ו` }],
  'chodesh/maslul': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 25, 47', note: 'המודל האסטרונומי המקוצר' }],
  'chodesh/shamayim': [{ ref: 'J. Meeus, Astronomical Algorithms, פרקים 13, 15', note: 'גובה ואזימוט, זריחה ושקיעה' }],
  'chodesh/natui': [{ ref: 'J. Meeus, Astronomical Algorithms, פרק 47', note: 'מקום הראש הממוצע' }, { ref: `${KH}, פרק טז`, note: 'מקום הראש ורוחב הירח' }],
  'shana/katan': [{ ref: `${KH}, פרק ו`, note: 'מחזור של 19 שנה וסימן גו״ח אדז״ט' }],
  'shana/gadol': [{ ref: KITZUR, note: 'אורך התקופה' }, { ref: `${KH}, פרק ט`, note: 'תקופת שמואל' }, { ref: 'ברכות נט ע״ב', note: 'ברכת החמה. TODO: verify' }],
  'shana/tekufot': [{ ref: `${KH}, פרקים ט–י`, note: 'תקופות שמואל ורב אדא; מספרי ההלכות: TODO: verify' }, { ref: 'J. Meeus, Astronomical Algorithms, פרק 27', note: 'שוויון ויפוך' }],
  'shana/tsir': [{ ref: `${KH}, פרקים ט–י` }, { ref: 'שולחן ערוך, אורח חיים, סימן קיז', note: 'טל ומטר בחוץ לארץ. TODO: verify' }],
  'luach/bahrad': [{ ref: `${KH}, פרק ו`, note: 'מולד בהר״ד' }],
  'luach/odfim': [{ ref: KITZUR, note: 'חישוב בעודפים' }, { ref: `${KH}, פרק ו` }],
  'luach/sugim': [{ ref: `${KH}, פרק ח`, note: 'חודשים מלאים וחסרים' }],
  'luach/keviut': [{ ref: 'טור, אורח חיים, סימן תכח', note: 'סימני הקביעות. TODO: verify' }],
  'dechiyot/adu': [{ ref: 'ראש השנה כ ע״א; סוכה מג ע״ב', note: 'הטעם המעשי. TODO: verify' }, { ref: `${KH}, פרק ז`, note: 'הטעם האסטרונומי' }],
  'dechiyot/zaken': [{ ref: KITZUR, note: 'מולד זקן' }, { ref: 'ראש השנה כ ע״ב' }, { ref: `${KH}, פרק ז` }],
  'dechiyot/gatrad': [{ ref: `${KH}, פרק ז` }],
  'dechiyot/betu': [{ ref: `${KH}, פרק ז` }],
  'dechiyot/argaz': [{ ref: `${KH}, פרק ז`, note: 'ארבע הדחיות' }],
  'reiya/memutza': [{ ref: `${KH}, פרקים ו–ז` }, { ref: 'J. Meeus, Astronomical Algorithms, פרק 49' }],
  'reiya/reiya': [
    { ref: `${KH}, פרקים יא–יז`, note: 'חשבון הראייה' },
    { ref: 'M. Sh. Odeh, “New Criterion for Lunar Crescent Visibility”, Experimental Astronomy 18', note: 'TODO: verify year' },
  ],
  'reiya/galgalim': [{ ref: `${KH}, פרקים יד–טו`, note: 'גלגל קטן בתוך גלגל גדול; לוח מנת המסלול' }],
  'kelim/luach': [{ ref: 'שולחן ערוך, אורח חיים, סימנים תקמט–תקנ, תרפו', note: 'דחיית הצומות. TODO: verify' }],
  'reiya/tavlaot': [{ ref: `${KH}, פרקים יב–יז`, note: 'הטבלאות; מספרי ההלכות לכל טבלה: TODO: verify' }],
  'kelim/makor': [{ ref: 'ויקיטקסט: רמב״ם הלכות קידוש החודש ו–ח (דפוס וורשא־ווילנא)' }],
  'kelim/machshevon': [{ ref: KITZUR }, { ref: `${KH}, פרקים ו–ח` }],
};
