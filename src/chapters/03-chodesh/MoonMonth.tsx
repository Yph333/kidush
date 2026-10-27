import { useMemo } from 'react';
import { TofMs, nrm, sky, sunEcl } from '../../engines/astro';
import { AstroControls } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { EarthMoonZoom, OrbitTopDown, PhaseStrip } from '../../components/astro/visuals';
import { Term } from '../../components/Glossary';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';
import { NUM, hrs } from '../../lib/format';
import type { MonthProps } from '../../scenes/monthSystem';
import type { MoonFaceProps } from '../../scenes/moonFace';

const loadMonth = () => import('../../scenes/monthSystem').then(m => m.default);
const loadFace = () => import('../../scenes/moonFace').then(m => m.default);

export function MoonMonth() {
  const v = useAstro();
  const { M, t } = v;
  const sk = sky(t, M.c);
  const a0 = nrm(sunEcl(TofMs(M.strip[0].ss).T).lam + 180), a1 = nrm(sunEcl(TofMs(M.strip[M.len - 1].ss).T).lam + 180);
  const month = useMemo<MonthProps>(() => ({ sunLam: sk.sunLam, moonLam: sk.moonLam, moonBeta: sk.moonBeta, arc: [a0, a1], ms: t }), [sk.sunLam, sk.moonLam, sk.moonBeta, a0, a1, t]);
  const face = useMemo<MoonFaceProps>(() => ({ sunLam: sk.sunLam, moonLam: sk.moonLam, moonBeta: sk.moonBeta }), [sk.sunLam, sk.moonLam, sk.moonBeta]);
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
        <div className="month3d">
          <Viz>
            <Scene3D load={loadMonth} props={month} label="השמש, כדור הארץ והירח בתלת־ממד; הצד המואר של הירח פונה לשמש"
              views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'earth', label: 'קרוב לכדור הארץ' }]}
              fallback={<OrbitTopDown M={M} sk={sk} />} />
            <p className="note">לא בקנה מידה: מסלול הירח מוגדל כ־<Num>130</Num> פעם. אור השמש מאיר תמיד את חצי הירח שפונה אליה.</p>
          </Viz>
          <Viz className="month-face">
            <p className="vt">כך הירח נראה מכדור הארץ</p>
            <Scene3D load={loadFace} props={face} label="הירח כפי שהוא נראה מכדור הארץ ברגע הזה" views={[]} height={230}
              fallback={<EarthMoonZoom sk={sk} />} />
            <p className="note"><Num>{(sk.k * 100).toFixed(1)}%</Num> מואר · {sk.waxing ? 'הולך וגדל' : 'הולך וקטן'}</p>
          </Viz>
        </div>
      </>}
    />
  );
}
