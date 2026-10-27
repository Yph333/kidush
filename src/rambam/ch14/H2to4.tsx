// Kiddush HaChodesh 14:2–4 — the tables of the two mean motions, the epoch, and the calculation for any night.

import { useCallback, useState } from 'react';
import { Engine } from '../../components/Slide';
import { Num, Sig } from '../../components/text';
import type { Block } from '../../engines/rambam';
import type { GuideDef } from '../../content/guides/types';
import { HalachaSlide } from '../HalachaSlide';
import { type CalcFocus, Decompose, FullCalc, MotionTable } from './Blocks';
import { Wheels14 } from './Wheels14';

// ---------------------------------------------------------------------------------------------- 14:2
type F2 = 'ten' | 'shearit' | 'precise' | 'monthYear' | 'how';

const GUIDE2: GuideDef<F2> = {
  draft: true,
  steps: [
    {
      title: 'עשרה ימים',
      focus: 'ten',
      mark: ['נמצא מהלכו בעשרה ימים קל״א מעלות ומ״ה חלקים וחמשים שניות', 'סימנם קל״א מה״נ'],
      body: <>
        <p>עשרה ימים הם פי עשרה מהמהלך היומי: <Num>10</Num> × <Num>13° 10′ 35″</Num> = <strong><Num>131° 45′ 50″</Num></strong>.</p>
        <p>הסימן באותיות: <Sig>קל״א</Sig> = <Num>131</Num>, <Sig>מ״ה</Sig> = <Num>45</Num>, <Sig>נ׳</Sig> = <Num>50</Num>.</p>
      </>,
    },
    {
      title: '״שארית מהלכו״',
      focus: 'shearit',
      mark: ['ונמצא שארית מהלכו בק׳ יום רל״ז מעלות ול״ח חלקים וכ״ג שניות'],
      body: <>
        <p>ב־<Num>100</Num> יום אמצע הירח עובר יותר מ־<Num>3</Num> סיבובים שלמים, כ־<Num>1317</Num> מעלות. סיבוב שלם מחזיר אותו לאותו מקום, ולכן משמיטים את הסיבובים השלמים.</p>
        <p>מה שנשאר אחריהם הוא ״שארית מהלכו״: <Num>237° 38′ 23″</Num>. בשעון הסיבובים שבכלי ״כמה ימים שתרצו״ רואים את שני החלקים.</p>
      </>,
    },
    {
      title: 'למה לא פשוט לכפול',
      focus: 'precise',
      mark: ['ונמצאת שארית מהלכו באלף יום רי״ו מעלות וכ״ג חלקים ונ׳ שניות', 'ונמצא שארית מהלכו בי׳ אלפים יום ג׳ מעלות ונ״ח חלקים וכ׳ שניות'],
      body: <>
        <p>אם כופלים את המהלך היומי ב־<Num>100</Num> יוצא <Num>237° 38′ 20″</Num>, ובטבלה <Num>23″</Num>: <Num>3</Num> שניות יותר. ב־<Num>10,000</Num> יום ההפרש כבר <Num>5</Num> חלקים.</p>
        <p>הסיבה: המהלך היומי מעוגל לשנייה שלמה. לפי הטבלה, המהלך המדויק ליום גדול ממנו בכ־<Num>0.03</Num> שנייה. לכן מחשבים לפי שורות הטבלה, ולא כופלים את המהלך היומי.</p>
      </>,
    },
    {
      title: 'חודש ושנה',
      focus: 'monthYear',
      mark: ['ונמצא שארית מהלכו בכ״ט יום כ״ב מעלות וששה חלקים ונ״ו שניות', 'ונמצא שארית מהלכו בשנה סדורה שמ״ד מעלות וכ״ו חלקים ומ״ג שניות'],
      body: <>
        <p>שתי שורות נוספות לנוחות: <Num>29</Num> ימים, חודש חסר, ו״שנה סדורה״ של <Num>354</Num> ימים. כך אפשר לחבר חודשים ושנים שלמים בבת אחת.</p>
      </>,
    },
    {
      title: '״ועל דרך זו תכפול״',
      focus: 'how',
      mark: ['ועל דרך זו תכפול לכל מנין ימים או שנים שתרצה'],
      body: <>
        <p>כל מספר ימים מפרקים לשורות הטבלה, מהגדולה לקטנה. למשל <Num>2,357</Num> ימים = <Num>2</Num> × <Num>1,000</Num> + <Num>354</Num> + <Num>3</Num> × יום אחד.</p>
        <p>מחברים את השורות ומשמיטים את הסיבובים השלמים. נסו בכלי ״כמה ימים שתרצו״ מספרים אחרים.</p>
      </>,
    },
  ],
};

const HL2: Record<F2, Block[]> = { ten: [10], shearit: [100], precise: [1000, 10000], monthYear: [29, 354], how: [] };

export function H14_2() {
  return (
    <HalachaSlide ch={14} h="ב" title="הטבלה של אמצע הירח" guide={GUIDE2}
      takeaway={<p>לאמצע הירח יש טבלה: <Num>10</Num>, <Num>100</Num>, <Num>1,000</Num> ו־<Num>10,000</Num> ימים, <Num>29</Num> ימים ושנה של <Num>354</Num>. כל מספר ימים מפרקים לשורותיה, ומשמיטים סיבובים שלמים.</p>}
      stage={focus => <>
        <Engine title="טבלת אמצע הירח" sub="רמב״ם י״ד, א–ב" className={focus && focus !== 'how' ? 'guide-focus' : ''}>
          <MotionTable which="moon" hl={focus ? HL2[focus] : []} />
        </Engine>
        <Decompose which="moon" className={focus === 'how' || focus === 'shearit' ? 'guide-focus' : ''} />
      </>}
    />
  );
}

// ---------------------------------------------------------------------------------------------- 14:3
type F3 = 'daily' | 'ten' | 'long' | 'month' | 'compare';

const GUIDE3: GuideDef<F3> = {
  draft: true,
  steps: [
    {
      title: 'מהלך אמצע המסלול ביום',
      focus: 'daily',
      mark: ['ומהלך אמצע המסלול ביום אחד י״ג מעלות ושלשה חלקים ונ״ד שניות', 'סימנם י״ג גנ״ד'],
      body: <>
        <p>ביום אחד הירח מתקדם על הגלגל הקטן <strong><Num>13</Num> מעלות, <Num>3</Num> חלקים ו־<Num>54</Num> שניות</strong>. בסימן: <Sig>י״ג</Sig> = <Num>13</Num>, <Sig>ג׳</Sig> = <Num>3</Num>, <Sig>נ״ד</Sig> = <Num>54</Num>.</p>
        <p>זה קרוב מאוד לאמצע הירח (<Num>13° 10′ 35″</Num>), אבל פחות ממנו ב־<Num>6′ 41″</Num> בכל יום.</p>
      </>,
    },
    {
      title: '״בלא שניות״',
      focus: 'ten',
      mark: ['נמצא מהלכו בעשרה ימים ק״ל מעלות ל״ט חלקים בלא שניות'],
      body: <>
        <p>עשרה ימים: <Num>10</Num> × <Num>54″</Num> = <Num>540″</Num>, שהם <Num>9′</Num> בדיוק. לכן השניות מתאפסות, והרמב״ם מציין: ״בלא שניות״. סך הכול <Num>130° 39′</Num>.</p>
      </>,
    },
    {
      title: 'מאה, אלף ועשרת אלפים',
      focus: 'long',
      mark: ['ונמצא שארית מהלכו במאה יום רכ״ו מעלות וכ״ט חלקים ונ״ג שניות', 'ונמצא שארית מהלכו באלף יום ק״ד מעלות ונ״ח חלקים וחמשים שניות', 'ונמצא שארית מהלכו בעשרת אלפים יום שכ״ט מעלות ומ״ח חלקים ועשרים שניות'],
      body: <>
        <p>כמו באמצע הירח, השורות הארוכות מדויקות יותר מכפל המהלך היומי. כאן ההפרש בכיוון השני: ב־<Num>100</Num> יום הטבלה <Num>7″</Num> פחות מהכפל, וב־<Num>10,000</Num> יום <Num>11′ 40″</Num> פחות.</p>
      </>,
    },
    {
      title: 'עשרים ותשעה ימים',
      focus: 'month',
      mark: ['ונמצא שארית מהלכו בכ״ט יום י״ח מעלות ונ״ג חלקים וד׳ שניות'],
      body: <>
        <p>שורת החודש: <Num>18° 53′ 4″</Num>. שורת השנה של אמצע המסלול מופיעה בתחילת ההלכה הבאה.</p>
      </>,
    },
    {
      title: 'שני המהלכים זה לצד זה',
      focus: 'compare',
      body: <>
        <p>אמצע הירח משלים סיבוב בכ־<Num>27.32</Num> ימים, ואמצע המסלול בכ־<Num>27.55</Num> ימים. ההפרש הקטן הזה, <Num>6′ 41″</Num> ביום, הוא שקובע איפה הירח על הגלגל הקטן בכל ערב.</p>
        <p>ובגלל זה הירח נראה פעם לפני אמצעו ופעם אחריו. איך מחשבים את זה יבוא בפרק ט״ו.</p>
      </>,
    },
  ],
};

const HL3: Record<F3, Block[]> = { daily: [1], ten: [10], long: [100, 1000, 10000], month: [29], compare: [] };

export function H14_3() {
  return (
    <HalachaSlide ch={14} h="ג" title="הטבלה של אמצע המסלול" guide={GUIDE3}
      takeaway={<p>לאמצע המסלול טבלה באותו מבנה. הוא מתקדם <Num>13° 3′ 54″</Num> ביום, מעט פחות מאמצע הירח.</p>}
      stage={focus => focus === 'compare'
        ? <div className="vpair">
            <Engine title="אמצע הירח" className="guide-focus"><MotionTable which="moon" /></Engine>
            <Engine title="אמצע המסלול" className="guide-focus"><MotionTable which="crs" /></Engine>
          </div>
        : <>
            <Engine title="טבלת אמצע המסלול" sub="רמב״ם י״ד, ג–ד" className={focus ? 'guide-focus' : ''}>
              <MotionTable which="crs" hl={focus ? HL3[focus] : []} />
            </Engine>
            <Decompose which="crs" />
          </>}
    />
  );
}

// ---------------------------------------------------------------------------------------------- 14:4
type F4 = 'year' | 'root' | 'rootCrs' | 'method' | 'example' | 'sun' | 'try';

const GUIDE4: GuideDef<F4> = {
  draft: true,
  steps: [
    {
      title: 'שנה סדורה של אמצע המסלול',
      focus: 'year',
      mark: ['ונמצא שארית מהלכו בשנה סדורה ש״ה מעלות וי״ג שניות בלא חלקים', 'סימנם ש״ה י״ג'],
      body: <>
        <p>השורה האחרונה בטבלת אמצע המסלול: <Num>354</Num> ימים, <Num>305° 0′ 13″</Num>. ״בלא חלקים״: אין דקות, רק מעלות ושניות.</p>
      </>,
    },
    {
      title: 'העיקר: נקודת ההתחלה',
      focus: 'root',
      mark: ['מקום אמצע הירח היה בתחלת ליל חמישי שהוא העיקר לחשבונות אלו במזל שור מעלה אחת וי״ד חלקים ומ״ג שניות', 'סימנם א׳ י״ד מ״ג'],
      body: <>
        <p>טבלה נותנת רק כמה הירח <strong>התקדם</strong>. צריך גם לדעת מאיפה התחיל. הרמב״ם קבע ״עיקר״: תחילת ליל ה׳, ג׳ בניסן שנת ד׳תתקל״ח (י״א, ט״ז).</p>
        <p>באותו רגע אמצע הירח היה מעלה אחת, <Num>14</Num> חלקים ו־<Num>43</Num> שניות במזל שור. מזל שור מתחיל ב־<Num>30°</Num>, ולכן מתחילת טלה זה <Num>31° 14′ 43″</Num>.</p>
      </>,
    },
    {
      title: 'ואמצע המסלול בעיקר',
      focus: 'rootCrs',
      mark: ['ואמצע המסלול היה בעיקר זה פ״ד מעלות וכ״ח חלקים ומ״ב שניות'],
      body: <>
        <p>ובאותו רגע אמצע המסלול היה <Num>84° 28′ 42″</Num>. אמצע המסלול נמדד על הגלגל הקטן, ולכן אין לו מזל.</p>
      </>,
    },
    {
      title: 'החשבון לכל ליל',
      focus: 'method',
      mark: ['מאחר שתדע מהלך אמצע הירח והאמצע שהוא העיקר שעליו תוסיף', 'תדע מקום אמצע הירח בכל יום שתרצה על דרך שעשית באמצע השמש'],
      body: <>
        <p>שלושה צעדים, כמו בשמש (פרק י״ב):</p>
        <ol>
          <li>סופרים ימים שלמים מתחילת ליל העיקר עד תחילת הליל שרוצים.</li>
          <li>מוצאים בטבלאות כמה התקדם בימים האלה.</li>
          <li>מוסיפים על העיקר, ומשמיטים סיבובים שלמים.</li>
        </ol>
      </>,
    },
    {
      title: 'הדוגמה של הרמב״ם',
      focus: 'example',
      body: <>
        <p>בפרק ט״ו (הלכה ח) הרמב״ם מחשב את ליל שבת, ב׳ באייר שנת העיקר: <Num>29</Num> ימים מהעיקר.</p>
        <ul>
          <li>אמצע הירח: <Num>31° 14′ 43″</Num> + <Num>22° 6′ 56″</Num> = <strong><Num>53° 21′ 39″</Num></strong>.</li>
          <li>אמצע המסלול: <Num>84° 28′ 42″</Num> + <Num>18° 53′ 4″</Num> = <strong><Num>103° 21′ 46″</Num></strong>, בדיוק כמו שכתוב שם.</li>
        </ul>
        <p>שם כתוב אמצע הירח <Num>53° 36′ 39″</Num>: <Num>15</Num> חלקים יותר. זה התיקון של ההלכה הבאה.</p>
      </>,
    },
    {
      title: '״התבונן בשמש״',
      focus: 'sun',
      mark: ['ואחר שתוציא אמצע הירח לתחלת הלילה שתרצה התבונן בשמש ודע באי זה מזל הוא'],
      body: <>
        <p>מה שחישבנו הוא אמצע הירח ל<strong>תחילת הליל</strong>. לפני שממשיכים, צריך לדעת באיזה מזל השמש. לפיה מתקנים את אמצע הירח, וזו ההלכה הבאה.</p>
      </>,
    },
    {
      title: 'נסו בעצמכם',
      focus: 'try',
      body: <>
        <p>בחרו בכלי ״החשבון המלא״ כל ליל אחרי העיקר, למשל ליל ראש השנה של השנה הזו, וראו את מספר הימים, את השורות ואת התוצאה. הגלגלים בהדמיה זזים בהתאם.</p>
      </>,
    },
  ],
};

const CALC: Partial<Record<F4, CalcFocus>> = { root: 'root', rootCrs: 'root', method: 'blocks', example: 'result', try: 'days' };

export function H14_4() {
  const [N, setN] = useState(29);
  const onN = useCallback((n: number) => setN(n), []);
  return (
    <HalachaSlide ch={14} h="ד" title="העיקר, והחשבון לכל ליל" guide={GUIDE4}
      takeaway={<p>אמצע הירח ואמצע המסלול לכל ליל = העיקר + המהלך בימים שעברו מאז (לפי הטבלאות), בלי סיבובים שלמים.</p>}
      stage={focus => <>
        {focus === 'year' && <Engine title="טבלת אמצע המסלול" className="guide-focus"><MotionTable which="crs" hl={[354]} /></Engine>}
        <FullCalc focus={focus ? CALC[focus] : undefined} onN={onN} />
        <Wheels14 hl={focus === 'root' || focus === 'example' ? 'mean' : focus === 'rootCrs' ? 'course' : null} at={N} />
      </>}
    />
  );
}

export { GUIDE2 as GUIDE_14_2, GUIDE3 as GUIDE_14_3, GUIDE4 as GUIDE_14_4 };
