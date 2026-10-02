import { sky } from '../../engines/astro';
import { AstroControls } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { EarthMoonZoom, OrbitTopDown, PhaseStrip } from '../../components/astro/visuals';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';
import { NUM, hrs } from '../../lib/format';

export function MoonMonth() {
  const v = useAstro();
  const { M, t } = v;
  const sk = sky(t, M.c);
  return (
    <Slide
      wide
      kicker="החודש · 2"
      title="מסלול של חודש"
      text={<>
        <p>הירח מקיף את כדור הארץ, ושניהם יחד מקיפים את השמש. <Term k="molad">מולד</Term> הוא הרגע שבו הירח עובר <strong>בין</strong> כדור הארץ לשמש: הצד המואר שלו פונה הלאה מאיתנו, ואנחנו לא רואים כלום.</p>
        <Engine>
          <AstroControls v={v} />
          <Facts items={[
            ['גיל הירח מהמולד האמיתי', <><Num>{hrs(t - M.conj)}</Num> שעות</>],
            ['התרחקות מהשמש', <Num>{Math.round(sk.dlam)}°</Num>],
            ['חלק מואר', <Num>{(sk.k * 100).toFixed(1)}%</Num>],
            ['כיוון', sk.waxing ? 'הולך וגדל' : 'הולך וקטן'],
            ['מרחק הירח', <><Num>{NUM(Math.round(sk.dist))}</Num> ק״מ</>],
          ]} />
        </Engine>
      </>}
      more={<>
        <p>מכאן הירח מתרחק מהשמש בכ־<Num>12</Num> מעלות ביום. ב־<Num>90</Num> מעלות רואים חצי ירח בערב (רבע ראשון), ב־<Num>180</Num> מעלות ירח מלא, ב־<Num>270</Num> שוב חצי, ובחזרה ל־<Num>0</Num> מולד חדש.</p>
        <p>סיבוב אחד ביחס לכוכבים לוקח <Num>27⅓</Num> ימים, אבל בינתיים כדור הארץ התקדם במסלולו. כדי לחזור לאותו מקום <strong>ביחס לשמש</strong> הירח צריך עוד יומיים: <Num>29½</Num> ימים, החודש שלנו.</p>
        <p className="note">המרחקים במבט על לא בקנה מידה: במציאות מסלול הירח קטן פי <Num>390</Num> ממסלול כדור הארץ.</p>
      </>}
      stage={<>
        <Viz><PhaseStrip M={M} t={t} /></Viz>
        <div className="vpair">
          <Viz className="explore-only"><OrbitTopDown M={M} sk={sk} /></Viz>
          <Viz><EarthMoonZoom sk={sk} /></Viz>
        </div>
      </>}
    />
  );
}
