import { DAY_LETTER, DAY_NAME, P_HOUR, gDate, nextBirkatHachama, pesachDay, tekufotShmuel, yearHeb } from '../../engines/calendar';
import { Term } from '../../components/Glossary';
import { Ring } from '../../components/Ring';
import { Engine, Slide, Src, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Num } from '../../components/text';
import { WeekWheel } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM } from '../../lib/format';

/** Hour of the week (from the start of Sunday night) → weekday / hour / civil text. Display only. */
function hTxt(H: number) {
  const d = Math.floor(H / 24), h = H - d * 24, wh = Math.floor(h), half = h !== wh;
  const ch = (18 + wh) % 24, cd = wh < 6 ? (d + 6) % 7 : d;
  return {
    txt: <>יום {DAY_LETTER[d]}׳, <Num>{`${wh}${half ? '½' : ''}`}</Num> שעות</>,
    civ: <>{cd === 6 ? 'שבת' : 'יום ' + DAY_NAME[cd]} <Num>{String(ch).padStart(2, '0') + (half ? ':30' : ':00')}</Num></>,
    parts: Math.round(H * P_HOUR),
  };
}

export function GreatCycle() {
  const yr = useSlideYear();
  const y = yr.y, T = tekufotShmuel(y), G = T.cycle, n = T.year;
  const tk = ([['תשרי', T.tishrei], ['טבת', T.tevet], ['ניסן', T.nisan], ['תמוז', T.tammuz]] as const).map(([m, H]) => [m, hTxt(H)] as const);
  const nb = nextBirkatHachama(y);
  const nbG = gDate(pesachDay(nb)).getUTCFullYear();
  return (
    <Slide
      kicker="השנה · 2"
      title="המחזור הגדול"
      text={<>
        <p>לפי שמואל שנת החמה היא <Num>365</Num> ימים ורבע: <Num>52</Num> שבועות ועוד <strong>יום ושש שעות</strong>.</p>
        <p><Term k="tekufa">תקופה</Term> היא רבע שנה: <Num>91</Num> ימים ו־<Num>7½</Num> שעות. <Num>91</Num> ימים הם <Num>13</Num> שבועות בדיוק, לכן כל תקופה זזה רק ב־<Num>7½</Num> שעות ביחס לקודמת.</p>
        <Src cite="קיצור שלחן ערוך, סדר לעשות לוח בקצרה">תקופה נמשכת מחברתה תשעים ואחד ימים, שבע שעות ומחצה</Src>
        <p>אחרי <Num>28</Num> שנה התקופה חוזרת לאותו יום ולאותה שעה: <strong>תחילת ליל רביעי</strong>. זה <Term k="gadol" />, ובתחילתו מברכים ברכת החמה.</p>
      </>}
      more={<p>המחזור הגדול <strong>לא משפיע</strong> על ראש השנה ועל הדחיות. הוא קובע את התקופות, למשל את שאלת ״טל ומטר״ בחוץ לארץ: <Num>60</Num> יום אחרי תקופת תשרי.</p>}
      stage={<>
        <Viz>
          <Ring n={28} cls={i => (i === 1 ? 'rm' : 'rp')} cur={n} center={['מחזור גדול ' + NUM(G), `שנה ${n}`, n === 1 ? 'ברכת החמה' : '']} aria="מחזור של 28 שנה" />
          <div className="explore-only">
            <WeekWheel markers={tk.map(([m, o], i) => ({ x: o.parts, cls: i === 2 ? 'moon' : 'leap', label: m }))} center={['תקופות', yearHeb(y), '']} aria="ארבע התקופות על גלגל השבוע" />
          </div>
        </Viz>
        <Engine title="מנוע התקופות" sub="לפי חשבון שמואל">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <Steps rows={[
            { l: 'מחלקים ב־28', v: <><Num>{`(${NUM(y)} − 1) ÷ 28 = ${NUM(G - 1)}`}</Num>, שארית <Num>{n - 1}</Num></>, s: <>מחזור גדול <Num>{NUM(G)}</Num>, שנה <Num>{n}</Num></> },
            { l: 'תקופת ניסן', v: <>ליל ד׳ (<Num>0</Num> שעות) + <Num>{n - 1}</Num> × יום ו־<Num>6</Num> שעות</>, s: <>= {tk[2][1].txt}</> },
            ...tk.map(([m, o]) => ({ l: `תקופת ${m}`, v: o.txt, s: <>בשעון: {o.civ}</> })),
            { l: 'ברכת החמה הבאה', v: nb === y ? <>השנה, בניסן {yearHeb(y)} (<Num>{nbG}</Num>)</> : <>ניסן {yearHeb(nb)} (<Num>{nbG}</Num>), בעוד <Num>{nb - y}</Num> שנים</>, c: 'final' },
          ]} />
        </Engine>
      </>}
    />
  );
}
