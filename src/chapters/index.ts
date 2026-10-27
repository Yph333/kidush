import type { ChapterDef, FlatSlide, Track } from './types';
import { RAMBAM_CHAPTERS } from '../rambam';
import { Home } from './01-yesodot/Home';
import { Units } from './01-yesodot/Units';
import { Sun } from './02-yom/Sun';
import { Zmanim } from './02-yom/Zmanim';
import { Gauge } from './02-yom/Gauge';
import { RabbeinuTam } from './02-yom/RabbeinuTam';
import { Horizon } from './02-yom/Horizon';
import { Annual } from './02-yom/Annual';
import { Dome } from './02-yom/Dome';
import { InclinedOrbit } from './03-chodesh/InclinedOrbit';
import { Eclipses } from './03-chodesh/Eclipses';
import { Seasons } from './04-shana/Seasons';
import { Timeline } from './04-shana/Timeline';
import { Wheels } from './07-reiya/Wheels';
import { Tables } from './07-reiya/Tables';
import { LunarMonth } from './03-chodesh/LunarMonth';
import { MoonMonth } from './03-chodesh/MoonMonth';
import { SkyAbove } from './03-chodesh/SkyAbove';
import { SmallCycle } from './04-shana/SmallCycle';
import { GreatCycle } from './04-shana/GreatCycle';
import { Bahrad } from './05-luach/Bahrad';
import { Excess } from './05-luach/Excess';
import { YearTypes } from './05-luach/YearTypes';
import { Keviut } from './05-luach/Keviut';
import { Lama } from './06-dechiyot/Lama';
import { Adu } from './06-dechiyot/Adu';
import { Zaken } from './06-dechiyot/Zaken';
import { Gatrad } from './06-dechiyot/Gatrad';
import { Betu } from './06-dechiyot/Betu';
import { Sandbox } from './06-dechiyot/Sandbox';
import { MeanTrue } from './07-reiya/MeanTrue';
import { Visibility } from './07-reiya/Visibility';
import { Calculator } from './08-kelim/Calculator';
import { MonthCalendar } from './08-kelim/MonthCalendar';
import { SourcePage } from './08-kelim/SourcePage';
import { SolarSystem } from './08-kelim/SolarSystem';

export const CHAPTERS: ChapterDef[] = [
  { id: 'yesodot', num: 1, title: 'יסודות', slides: [
    { id: 'petiha', title: 'מסך ראשי', Component: Home },
    { id: 'yehidot', title: 'יום, שעה וחלק', Component: Units },
  ] },
  { id: 'yom', num: 2, title: 'היום', slides: [
    { id: 'shemesh', title: 'למה השמש זורחת בזמנים שונים', Component: Sun },
    { id: 'zmanim', title: 'זמני היום כשיטות', Component: Zmanim },
    { id: 'mad', title: 'מד שקיעה', Component: Gauge },
    { id: 'rabenutam', title: 'השקיעה במקומו של רבנו תם', Component: RabbeinuTam },
    { id: 'gova', title: 'גובה ואופק', Component: Horizon },
    { id: 'shnati', title: 'לוח זמנים שנתי', Component: Annual },
    { id: 'kipa', title: 'כיפת השמיים', Component: Dome },
  ] },
  { id: 'chodesh', num: 3, title: 'החודש', slides: [
    { id: 'levana', title: 'חודש הלבנה', Component: LunarMonth },
    { id: 'maslul', title: 'הירח במשך החודש', Component: MoonMonth },
    { id: 'shamayim', title: 'השמיים מעל הארץ', Component: SkyAbove },
    { id: 'natui', title: 'מסלול הירח הנטוי', Component: InclinedOrbit },
    { id: 'likuyim', title: 'ליקויי חמה ולבנה', Component: Eclipses },
  ] },
  { id: 'shana', num: 4, title: 'השנה', slides: [
    { id: 'katan', title: 'המחזור הקטן', Component: SmallCycle },
    { id: 'gadol', title: 'המחזור הגדול', Component: GreatCycle },
    { id: 'tekufot', title: 'העונות והתקופות', Component: Seasons },
    { id: 'tsir', title: 'הלוח מול העונות לאורך הדורות', Component: Timeline },
  ] },
  { id: 'luach', num: 5, title: 'הלוח הקבוע', slides: [
    { id: 'bahrad', title: 'בהר״ד: נקודת ההתחלה', Component: Bahrad },
    { id: 'odfim', title: 'חישוב המולד בעודפים', Component: Excess },
    { id: 'sugim', title: 'סוגי השנים', Component: YearTypes },
    { id: 'keviut', title: 'קביעות השנה', Component: Keviut },
  ] },
  { id: 'dechiyot', num: 6, title: 'הדחיות', slides: [
    { id: 'lama', title: 'למה דוחים את ראש השנה', Component: Lama },
    { id: 'adu', title: 'לא אד״ו', Component: Adu },
    { id: 'zaken', title: 'מולד זקן', Component: Zaken },
    { id: 'gatrad', title: 'גטר״ד', Component: Gatrad },
    { id: 'betu', title: 'בטו תקפט', Component: Betu },
    { id: 'argaz', title: 'ארגז חול: בלי הדחיות', Component: Sandbox },
  ] },
  { id: 'reiya', num: 7, title: 'ראייה מול חשבון', slides: [
    { id: 'memutza', title: 'מולד ממוצע ומולד אמיתי', Component: MeanTrue },
    { id: 'reiya', title: 'נראות הירח', Component: Visibility },
    { id: 'galgalim', title: 'גלגלי הרמב״ם', Component: Wheels },
    { id: 'tavlaot', title: 'הטבלאות של הרמב״ם', Component: Tables },
  ] },
  { id: 'kelim', num: 8, title: 'כלים', slides: [
    { id: 'machshevon', title: 'המחשבון המלא', Component: Calculator },
    { id: 'luach', title: 'לוח שנה חודשי', Component: MonthCalendar },
    { id: 'makor', title: 'הדף מהמקור', Component: SourcePage },
    { id: 'shemesh', title: 'מערכת השמש', Component: SolarSystem },
  ] },
];

export const SLIDES: FlatSlide[] = [...CHAPTERS, ...RAMBAM_CHAPTERS]
  .flatMap(ch => ch.slides.map(s => ({ ...s, chapter: ch, track: ch.track ?? 'topics', path: `${ch.id}/${s.id}` })))
  .map((s, index) => ({ ...s, index }));

/** The slides of one track, in order: "previous" and "next" stay inside the track. */
export const trackSlides = (t: Track): FlatSlide[] => SLIDES.filter(s => s.track === t);
export const trackChapters = (t: Track): ChapterDef[] => (t === 'rambam' ? RAMBAM_CHAPTERS : CHAPTERS);

const BY_PATH = new Map(SLIDES.map(s => [s.path, s]));
export const slideByPath = (p: string): FlatSlide | undefined => BY_PATH.get(p);
