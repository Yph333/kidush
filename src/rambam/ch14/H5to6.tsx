// Kiddush HaChodesh 14:5–6 — the correction of the mean moon by the sun's sign, and "the mean moon at the time of sighting".

import { RB, rambam, secOf } from '../../engines/rambam';
import { Engine, Viz } from '../../components/Slide';
import { type StepRow, Steps } from '../../components/Steps';
import { DMS, Num } from '../../components/text';
import type { GuideDef } from '../../content/guides/types';
import { NUM } from '../../lib/format';
import { HalachaSlide } from '../HalachaSlide';
import { type Night, NightPicker, useNight } from './Blocks';
import { SeasonTable, SeasonWheel, SEASON_WORDS, seasonRow, signed } from './Seasons14';
import { SignPos } from './Wheels14';

// ---------------------------------------------------------------------------------------------- 14:5
type F5 = 'idea' | 'zero' | 'plus' | 'thirty' | 'autumn' | 'minus' | 'example' | 'try';

const GUIDE5: GuideDef<F5> = {
  draft: true,
  steps: [
    {
      title: 'תיקון לפי השמש',
      focus: 'idea',
      body: <>
        <p>אמצע הירח שחישבנו הוא ל<strong>תחילת הליל</strong>. הירח נראה מעט אחרי השקיעה (הלכה ו), ובזמן הזה הוא ממשיך לנוע.</p>
        <p>הרמב״ם לא מפרש כאן את הטעם. הסבר פשוט: השקיעה מקדימה ומאחרת לפי עונות השנה, והשמש במזלות היא סימן לעונה. בקיץ השקיעה מאוחרת, והירח מספיק להתקדם יותר: מוסיפים. בחורף להפך: גורעים.</p>
      </>,
    },
    {
      title: 'סביב תקופת ניסן: כמות שהוא',
      focus: 'zero',
      mark: ['אם היתה השמש מחצי מזל דגים עד חצי מזל טלה. תניח אמצע הירח כמות שהוא'],
      body: <>
        <p>כשהשמש סביב תחילת טלה, בתקופת ניסן, לא מתקנים כלום. בגלגל: הגזרה האפורה מימין.</p>
      </>,
    },
    {
      title: 'מוסיפים ט״ו חלקים',
      focus: 'plus',
      mark: ['ואם תהיה השמש מחצי מזל טלה עד תחלת מזל תאומים. תוסיף על אמצע הירח ט״ו חלקים', 'ואם תהיה השמש מתחלת מזל אריה עד חצי מזל בתולה תוסיף על אמצע הירח ט״ו חלקים'],
      body: <>
        <p>באביב ובסוף הקיץ מוסיפים <Num>15</Num> חלקים, רבע מעלה. שתי הגזרות האלה עומדות משני צדי הקיץ, באותו מרחק מתקופת תמוז.</p>
      </>,
    },
    {
      title: 'בלב הקיץ: שלושים חלקים',
      focus: 'thirty',
      mark: ['ואם תהיה השמש מתחלת מזל תאומים עד תחלת מזל אריה. תוסיף על אמצע הירח ט״ו חלקים'],
      body: <>
        <p>מתחילת תאומים עד תחילת אריה, סביב תקופת תמוז, מוסיפים <strong><Num>30</Num> חלקים</strong>, חצי מעלה.</p>
        <p>שימו לב: בדפוס כפי שהוא לפנינו כתוב כאן ״ט״ו״. החשבון באתר מוסיף <Num>30</Num>, בסימטריה לחורף, שבו כתוב במפורש ״תגרע… ל׳ חלקים״ מתחילת קשת עד תחילת דלי.</p>
      </>,
    },
    {
      title: 'סביב תקופת תשרי: כמות שהוא',
      focus: 'autumn',
      mark: ['ואם תהיה השמש מחצי מזל בתולה עד חצי מזל מאזנים. הנח אמצע הירח כמות שהוא'],
      body: <>
        <p>כשהשמש סביב תחילת מאזנים, בתקופת תשרי, שוב לא מתקנים.</p>
      </>,
    },
    {
      title: 'בחורף גורעים',
      focus: 'minus',
      mark: ['ואם תהיה השמש מחצי מזל מאזנים עד תחלת מזל קשת. תגרע מאמצע הירח ט״ו חלקים', 'ואם תהיה השמש מתחלת מזל קשת עד תחלת מזל דלי. תגרע מאמצע הירח ל׳ חלקים', 'ואם תהיה השמש מתחלת מזל דלי עד חצי מזל דגים. תגרע מאמצע הירח ט״ו חלקים'],
      body: <>
        <p>בחצי השני של הגלגל אותו הדבר בהיפוך: גורעים <Num>15</Num>, ובלב החורף, סביב תקופת טבת, <Num>30</Num>.</p>
        <p>בגלגל רואים את הסימטריה: כל גזרה בקיץ מול גזרה בחורף.</p>
      </>,
    },
    {
      title: 'הדוגמה של הרמב״ם',
      focus: 'example',
      body: <>
        <p>בליל ב׳ אייר שנת העיקר אמצע השמש <Num>35° 38′ 33″</Num> (ט״ו, ח), כלומר <Num>5°</Num> במזל שור: בין חצי טלה לתחילת תאומים. מוסיפים <Num>15</Num> חלקים.</p>
        <p><Num>53° 21′ 39″</Num> + <Num>15′</Num> = <strong><Num>53° 36′ 39″</Num></strong>, בדיוק מה שכתוב שם: ״אמצע הירח לשעת הראייה״.</p>
      </>,
    },
    {
      title: 'נסו בעצמכם',
      focus: 'try',
      body: <>
        <p>בחרו לילות בעונות שונות, למשל באב, בתשרי ובטבת, וראו את השמש עוברת בין הגזרות ואת התיקון משתנה.</p>
      </>,
    },
  ],
};

const HL5: Partial<Record<F5, number[]>> = { zero: [0], plus: [1, 3], thirty: [2], autumn: [4], minus: [5, 6, 7] };

/** The sun's sign, the row, and the corrected mean moon, for one night. */
function seasonCalc({ night, focus }: { night: Night; focus?: boolean }) {
  const R = night.N >= 0 ? rambam(night.dayIdx) : null;
  const sunDeg = R ? R.sunMean / 3600 : undefined, row = sunDeg !== undefined ? seasonRow(sunDeg) : -1;
  const rows: StepRow[] = R ? [
    { l: 'אמצע השמש בתחילת הליל', v: <SignPos sec={R.sunMean} /> },
    { l: 'בגזרה', v: SEASON_WORDS[row], s: <>התיקון: <Num>{signed(R.season)}</Num></> },
    { l: 'אמצע הירח בתחילת הליל', v: <SignPos sec={R.moonMean} />, s: 'הלכה ד' },
    { l: 'אמצע הירח לשעת הראייה', v: <SignPos sec={R.moonAdj} />, s: <>מתחילת טלה: <DMS sec={R.moonAdj} /></>, c: 'final' },
  ] : [];
  return { sunDeg, row, R, el: (
    <Engine title="לאיזה ליל" sub={night.label} className={focus ? 'guide-focus' : ''}>
      <NightPicker night={night} />
      {R ? <Steps rows={rows} /> : <p className="note">התאריך לפני העיקר. החשבון מתחיל מהעיקר והלאה.</p>}
    </Engine>
  ) };
}

function Stage5({ focus }: { focus?: F5 }) {
  const night = useNight();
  const calc = seasonCalc({ night, focus: focus === 'example' || focus === 'try' });
  const hl = focus && HL5[focus];
  return <>
    <Viz className={hl ? 'guide-focus' : ''}>
      <SeasonWheel sunDeg={calc.sunDeg} hl={hl} />
      <SeasonTable hl={hl} cur={calc.row} />
    </Viz>
    {calc.el}
  </>;
}

export function H14_5() {
  return (
    <HalachaSlide ch={14} h="ה" title="תיקון אמצע הירח לפי השמש" guide={GUIDE5}
      takeaway={<p>לפי המזל שבו השמש, מוסיפים לאמצע הירח <Num>15</Num> או <Num>30</Num> חלקים (באביב ובקיץ), גורעים <Num>15</Num> או <Num>30</Num> (בסתיו ובחורף), או משאירים כמות שהוא (סביב ניסן ותשרי).</p>}
      stage={focus => <Stage5 focus={focus} />}
    />
  );
}

// ---------------------------------------------------------------------------------------------- 14:6
type F6 = 'result' | 'third' | 'name' | 'chain';

const GUIDE6: GuideDef<F6> = {
  draft: true,
  steps: [
    {
      title: 'אחרי התיקון',
      focus: 'result',
      mark: ['ומה שיהיה האמצע אחר שתוסיף עליו או תגרע ממנו או תניח אותו כמות שהוא'],
      body: <>
        <p>ההלכה הזו אומרת מה קיבלנו אחרי התיקון של הלכה ה, בין אם הוספנו, גרענו או השארנו כמות שהוא.</p>
      </>,
    },
    {
      title: 'כשליש שעה אחרי השקיעה',
      focus: 'third',
      mark: ['הוא אמצע הירח לאחר שקיעת החמה בכמו שליש שעה באותו הזמן שתוציא האמצע לו'],
      body: <>
        <p>התוצאה היא מקום אמצע הירח <strong>כשליש שעה אחרי השקיעה</strong>, כ־<Num>20</Num> דקות, באותו ערב. זה בערך הזמן שבו אפשר לראשונה לחפש את הסהר, כשהשמיים מתחילים להחשיך.</p>
      </>,
    },
    {
      title: '״אמצע הירח לשעת הראייה״',
      focus: 'name',
      mark: ['וזה הוא הנקרא אמצע הירח לשעת הראיה'],
      body: <>
        <p>לזה קוראים <strong>אמצע הירח לשעת הראייה</strong>. מכאן מתחיל פרק ט״ו: בדוגמה (ט״ו, ח) הרמב״ם יוצא בדיוק מהמספר הזה, <Num>53° 36′ 39″</Num>.</p>
      </>,
    },
    {
      title: 'כל הדרך של פרק י״ד',
      focus: 'chain',
      body: <>
        <p>מהעיקר ועד שעת הראייה: מקום העיקר, ועוד המהלך בימים שעברו לפי הטבלאות, ועוד התיקון לפי השמש. כך מוצאים את אמצע הירח ואת אמצע המסלול לכל ערב.</p>
        <p>בפרק ט״ו: איך מגיעים מהם למקום הירח <strong>האמיתי</strong>.</p>
      </>,
    },
  ],
};

/** A sketch of the evening: sunset, and the time of sighting about a third of an hour later. */
function Evening() {
  return (
    <svg className="evening" viewBox="0 0 400 200" role="img" aria-label="השקיעה, ושליש שעה אחריה: שעת הראייה">
      <defs>
        <linearGradient id="ev-sky" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stopColor="#0d1a33" /><stop offset="1" stopColor="#3a3150" /></linearGradient>
      </defs>
      <rect width="400" height="150" fill="url(#ev-sky)" />
      <rect y="150" width="400" height="50" fill="#0a0f1c" />
      <line x1="0" y1="150" x2="400" y2="150" stroke="var(--c-line-strong)" />
      <circle cx="120" cy="166" r="14" fill="var(--c-sun)" opacity=".85" />
      <path d="M215 92 a14 14 0 1 0 0 22 a10 11 0 1 1 0 -22z" fill="#e9e3cf" />
      <text x="120" y="194" textAnchor="middle" className="ev-t">השמש מתחת לאופק</text>
      <text x="230" y="80" textAnchor="middle" className="ev-t">הסהר</text>
      <text x="200" y="28" textAnchor="middle" className="ev-h">שקיעה ← כשליש שעה ← שעת הראייה</text>
    </svg>
  );
}

function Stage6({ focus }: { focus?: F6 }) {
  const night = useNight();
  const R = night.N >= 0 ? rambam(night.dayIdx) : null;
  return <>
    <Viz className={focus === 'third' ? 'guide-focus' : ''}><Evening /></Viz>
    <Engine title="מהעיקר עד שעת הראייה" sub={night.label} className={focus === 'name' || focus === 'chain' ? 'guide-focus' : ''}>
      <NightPicker night={night} />
      {R ? <Steps focus={focus === 'name' ? 4 : undefined} rows={[
        { l: 'ימים מהעיקר', v: <Num>{NUM(R.N)}</Num> },
        { l: 'העיקר (הלכה ד)', v: <SignPos sec={secOf(RB.root.moon)} /> },
        { l: 'ועוד המהלך בטבלאות (הלכות ב, ד)', v: <SignPos sec={R.moonMean} />, s: 'אמצע הירח בתחילת הליל' },
        { l: 'ועוד התיקון לפי השמש (הלכה ה)', v: <Num>{signed(R.season)}</Num> },
        { l: 'אמצע הירח לשעת הראייה (הלכה ו)', v: <SignPos sec={R.moonAdj} />, c: 'final' },
        { l: 'ואמצע המסלול', v: <DMS sec={R.crs} />, s: 'בלי תיקון: הוא נכנס לחשבון בפרק ט״ו' },
      ]} /> : <p className="note">התאריך לפני העיקר.</p>}
    </Engine>
  </>;
}

export function H14_6() {
  return (
    <HalachaSlide ch={14} h="ו" title="אמצע הירח לשעת הראייה" guide={GUIDE6}
      takeaway={<p>אחרי התיקון יש לנו את אמצע הירח כשליש שעה אחרי השקיעה: ״אמצע הירח לשעת הראייה״. ממנו מתחיל החשבון של פרק ט״ו.</p>}
      stage={focus => <Stage6 focus={focus} />}
    />
  );
}

export { GUIDE5 as GUIDE_14_5, GUIDE6 as GUIDE_14_6 };
