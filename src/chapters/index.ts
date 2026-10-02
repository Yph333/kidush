import type { ChapterDef, FlatSlide } from './types';
import { Opening } from './01-yesodot/Opening';
import { Units } from './01-yesodot/Units';
import { Sun } from './02-yom/Sun';
import { Zmanim } from './02-yom/Zmanim';
import { Gauge } from './02-yom/Gauge';
import { Horizon } from './02-yom/Horizon';
import { Annual } from './02-yom/Annual';
import { LunarMonth } from './03-chodesh/LunarMonth';
import { MoonMonth } from './03-chodesh/MoonMonth';
import { SkyAbove } from './03-chodesh/SkyAbove';
import { SmallCycle } from './04-shana/SmallCycle';
import { GreatCycle } from './04-shana/GreatCycle';
import { Bahrad } from './05-luach/Bahrad';
import { Excess } from './05-luach/Excess';
import { YearTypes } from './05-luach/YearTypes';
import { Keviut } from './05-luach/Keviut';
import { Adu } from './06-dechiyot/Adu';
import { Zaken } from './06-dechiyot/Zaken';
import { Gatrad } from './06-dechiyot/Gatrad';
import { Betu } from './06-dechiyot/Betu';
import { Sandbox } from './06-dechiyot/Sandbox';
import { MeanTrue } from './07-reiya/MeanTrue';
import { Visibility } from './07-reiya/Visibility';
import { Calculator } from './08-kelim/Calculator';

export const CHAPTERS: ChapterDef[] = [
  { id: 'yesodot', num: 1, title: 'יסודות', slides: [
    { id: 'petiha', title: 'פתיחה', Component: Opening },
    { id: 'yehidot', title: 'יום, שעה וחלק', Component: Units },
  ] },
  { id: 'yom', num: 2, title: 'היום', slides: [
    { id: 'shemesh', title: 'למה השמש זורחת בזמנים שונים', Component: Sun },
    { id: 'zmanim', title: 'זמני היום כשיטות', Component: Zmanim },
    { id: 'mad', title: 'מד שקיעה', Component: Gauge },
    { id: 'gova', title: 'גובה ואופק', Component: Horizon },
    { id: 'shnati', title: 'לוח זמנים שנתי', Component: Annual },
  ] },
  { id: 'chodesh', num: 3, title: 'החודש', slides: [
    { id: 'levana', title: 'חודש הלבנה', Component: LunarMonth },
    { id: 'maslul', title: 'הירח במשך החודש', Component: MoonMonth },
    { id: 'shamayim', title: 'השמיים מעל הארץ', Component: SkyAbove },
  ] },
  { id: 'shana', num: 4, title: 'השנה', slides: [
    { id: 'katan', title: 'המחזור הקטן', Component: SmallCycle },
    { id: 'gadol', title: 'המחזור הגדול', Component: GreatCycle },
  ] },
  { id: 'luach', num: 5, title: 'הלוח הקבוע', slides: [
    { id: 'bahrad', title: 'בהר״ד: נקודת ההתחלה', Component: Bahrad },
    { id: 'odfim', title: 'חישוב המולד בעודפים', Component: Excess },
    { id: 'sugim', title: 'סוגי השנים', Component: YearTypes },
    { id: 'keviut', title: 'קביעות השנה', Component: Keviut },
  ] },
  { id: 'dechiyot', num: 6, title: 'הדחיות', slides: [
    { id: 'adu', title: 'לא אד״ו', Component: Adu },
    { id: 'zaken', title: 'מולד זקן', Component: Zaken },
    { id: 'gatrad', title: 'גטר״ד', Component: Gatrad },
    { id: 'betu', title: 'בטו תקפט', Component: Betu },
    { id: 'argaz', title: 'ארגז חול: בלי הדחיות', Component: Sandbox },
  ] },
  { id: 'reiya', num: 7, title: 'ראייה מול חשבון', slides: [
    { id: 'memutza', title: 'מולד ממוצע ומולד אמיתי', Component: MeanTrue },
    { id: 'reiya', title: 'נראות הירח', Component: Visibility },
  ] },
  { id: 'kelim', num: 8, title: 'כלים', slides: [
    { id: 'machshevon', title: 'המחשבון המלא', Component: Calculator },
  ] },
];

export const SLIDES: FlatSlide[] = CHAPTERS.flatMap(ch => ch.slides.map(s => ({ ...s, chapter: ch, path: `${ch.id}/${s.id}` })))
  .map((s, index) => ({ ...s, index }));

const BY_PATH = new Map(SLIDES.map(s => [s.path, s]));
export const slideByPath = (p: string): FlatSlide | undefined => BY_PATH.get(p);
