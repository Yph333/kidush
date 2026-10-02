import { rh, yearHeb } from '../../engines/calendar';
import { CITIES, hm, sunriseOn, sunsetOn } from '../../engines/astro';
import { Term } from '../../components/Glossary';
import { Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';
import { civOf } from '../../engines/astro';
import { useStore } from '../../state/store';

/** Placeholder until milestone 3 (zmanim engine). Shows only sunrise/sunset from the existing astro engine. */
export function DayComingSoon() {
  const y = useStore(s => s.demoYear);
  const city = CITIES[useStore(s => s.city)] ?? CITIES[0];
  const [a, b, c] = civOf(rh(y).day);
  const sr = sunriseOn(a, b, c, city), ss = sunsetOn(a, b, c, city);
  return (
    <Slide
      kicker="פרק 2 · בקרוב"
      title="השמש וזמני היום"
      text={<>
        <p>בלוח הקבוע היממה מתחילה ב־<Num>18:00</Num>. במציאות היום מתחיל בשקיעה, והשקיעה זזה לאורך השנה ומשתנה ממקום למקום.</p>
        <p>הפרק הזה ייבנה בהמשך: <Term k="alot" />, זריחה, <Term k="shaaZmanit">שעות זמניות</Term>, שקיעה ו<Term k="tzeit" />, כל זמן כשיטה עם הגדרה ומקור.</p>
      </>}
      stage={
        <Viz>
          <p className="vt">ראש השנה {yearHeb(y)} ב{city.name}</p>
          <Facts items={[
            ['זריחה (מישורית)', sr ? <Num>{hm(sr)}</Num> : '—'],
            ['שקיעה (מישורית)', ss ? <Num>{hm(ss)}</Num> : '—'],
          ]} />
          <p className="note">זריחה ושקיעה כשמרכז השמש <Num>0.833°</Num> מתחת לאופק, בלי תיקון גובה. זה מידע בלבד ולא פסק הלכה.</p>
        </Viz>
      }
    />
  );
}
