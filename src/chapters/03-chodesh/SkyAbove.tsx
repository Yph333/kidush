import { useMemo } from 'react';
import { hm, localParts, moonsetNear, sky, sunriseOn, sunsetOn } from '../../engines/astro';
import { AstroControls } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { SkyPanorama } from '../../components/astro/visuals';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num } from '../../components/text';

export function SkyAbove() {
  const v = useAstro();
  const { M, t, c } = v;
  const sk = sky(t, c);
  const p = localParts(t);
  const ev = useMemo(() => {
    const ss = sunsetOn(p.y, p.m, p.d, c), sr = sunriseOn(p.y, p.m, p.d, c);
    return { ss, sr, mset: ss ? moonsetNear(ss, c) : null };
  }, [p.y, p.m, p.d, c]);
  const T = (ms: number | null) => (ms ? <Num>{hm(ms)}</Num> : '—');
  return (
    <Slide
      wide
      kicker="החודש · 3"
      title="מה רואים מכאן"
      text={<>
        <p>הפנורמה מראה את השמיים כשעומדים ומביטים <strong>דרומה</strong>: מזרח משמאל, מערב מימין.</p>
        <Engine><AstroControls v={v} /></Engine>
      </>}
      more={<>
        <p>אחרי המולד הסהר החדש מופיע <strong>נמוך במערב, מעט אחרי השקיעה</strong>, ושוקע זמן קצר אחרי השמש. כל ערב הוא גבוה יותר ושוקע בערך <Num>50</Num> דקות מאוחר יותר.</p>
        <p>הצד המואר של הסהר תמיד פונה <strong>אל השמש</strong>, גם כשהיא כבר מתחת לאופק. בארץ הסהר בערב נראה כמו ״סירה״, כמעט שוכב.</p>
        <p>באמצע החודש הירח המלא זורח במזרח בדיוק כשהשמש שוקעת במערב.</p>
        <p className="note">מתחת לאופק הגופים מצוירים בקו מקווקו. השמש והירח מוגדלים בציור.</p>
      </>}
      stage={<>
        <Viz className="sky"><SkyPanorama ms={t} c={M.c} /></Viz>
        <Facts items={[
          ['זריחה', T(ev.sr)],
          ['שקיעה', T(ev.ss)],
          ['שקיעת הירח (סביב הערב)', T(ev.mset)],
          ['השמש', <>גובה <Num>{sk.sun.alt.toFixed(1)}°</Num>, כיוון <Num>{Math.round(sk.sun.az)}°</Num></>],
          ['הירח', <>גובה <Num>{sk.moon.alt.toFixed(1)}°</Num>, כיוון <Num>{Math.round(sk.moon.az)}°</Num></>],
          ['חלק מואר', <Num>{(sk.k * 100).toFixed(1)}%</Num>],
          ['התרחקות', <Num>{sk.elong.toFixed(1)}°</Num>],
        ]} />
      </>}
    />
  );
}
