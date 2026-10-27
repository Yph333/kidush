import { useMemo, useState } from 'react';
import { HOUR, TofMs, dayOfMs, moonEcl, moonNode, nrm, sunEcl } from '../../engines/astro';
import { setAstro } from '../../state/store';
import { rambam } from '../../engines/rambam';
import { AstroControls } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { Term } from '../../components/Glossary';
import { Scene3D } from '../../components/Scene3D/Scene3D';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Facts, Num, Tag } from '../../components/text';
import type { MoonOrbitProps } from '../../scenes/moonOrbit';

const load = () => import('../../scenes/moonOrbit').then(m => m.default);

/** 2D: the moon's path unrolled — latitude against ecliptic longitude (right to left). */
function Unrolled({ p }: { p: MoonOrbitProps }) {
  const W = 760, H = 230, padX = 40, mid = 115, k = 14; // px per degree of latitude
  const X = (lon: number) => W - padX - (nrm(lon) / 360) * (W - 2 * padX);
  const lat = (lon: number) => 5.145 * Math.sin(((lon - p.node) * Math.PI) / 180);
  let d = '';
  for (let l = 0; l <= 360; l += 3) d += `${l ? 'L' : 'M'}${X(l).toFixed(1)} ${(mid - lat(l) * k).toFixed(1)}`;
  const nodes = [p.node, p.node + 180].map(nrm);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} direction="ltr" role="img" aria-label="מסלול הירח פרוש: רוחב מול אורך">
      <line x1={padX} x2={W - padX} y1={mid} y2={mid} className="st-leap" strokeWidth="2" />
      <text x={W - padX} y={mid - 6} className="svgt tx-leap" textAnchor="end">מסלול השמש</text>
      {nodes.map(n => <rect key={n} x={X(n + 12)} y={mid - 8} width={X(n - 12) - X(n + 12)} height="16" fill="var(--shift-soft)" opacity=".8" />)}
      <path d={d} fill="none" className="st-moon" strokeWidth="2" />
      {nodes.map((n, i) => <text key={n} x={X(n)} y={mid + 30} className="svgt tx-shift" textAnchor="middle" fontWeight="700">{i ? 'זנב' : 'ראש'}</text>)}
      <circle cx={X(p.sunLon)} cy={mid} r="9" className="sunf" />
      <circle cx={X(p.moonLon)} cy={mid - p.moonLat * k} r="7" fill="#ddd" stroke="#555" />
      <text x={X(p.moonLon)} y={mid - p.moonLat * k - 12} className="svgt" textAnchor="middle" fontWeight="700">ירח</text>
      {p.rambamHead !== null && <path d={`M${X(p.rambamHead)} ${mid + 40}l-5 9h10z`} className="mk-ok" />}
      {[0, 90, 180, 270].map(l => <text key={l} x={X(l)} y={H - 6} className="svgt tx-muted" textAnchor="middle">{l}°</text>)}
      <text x={padX} y={20} className="svgt tx-muted">הרוחב מוגדל בציור</text>
    </svg>
  );
}

export function InclinedOrbit() {
  const v = useAstro();
  const { M, t, c, a } = v;
  const [ex, setEx] = useState(3);
  const { T } = TofMs(t);
  const sun = sunEcl(T), moon = moonEcl(T);
  const node = moonNode(t);
  const R = useMemo(() => rambam(dayOfMs(t, c)), [t, c]);
  const props = useMemo<MoonOrbitProps>(() => ({
    sunLon: sun.lam, moonLon: moon.lam, moonLat: moon.beta, node, rambamHead: R.head / 60, exaggerate: ex, ms: t,
  }), [sun.lam, moon.lam, moon.beta, node, R.head, ex, t]);
  const distNode = Math.min(Math.abs(((sun.lam - node + 540) % 360) - 180), Math.abs(((sun.lam - node - 180 + 540) % 360) - 180));

  return (
    <Slide
      wide
      kicker="החודש · 4"
      title="מסלול הירח הנטוי"
      text={<>
        <p>מסלול הירח לא שוכב במישור של מסלול השמש. הוא נוטה בכ־<Num>5°</Num>. לכן לירח יש <Term k="rochav" />: לפעמים הוא צפונה ממסלול השמש ולפעמים דרומה.</p>
        <p>שתי הנקודות שבהן המסלולים נחתכים הן <Term k="rosh" />. הן נעות לאחור, וסיבוב שלם לוקח כ־<Num>18.6</Num> שנים.</p>
        <p><strong>ליקוי</strong> קורה רק כשהמולד (או המילוא) קרוב לאחד הצמתים. בשאר החודשים הירח עובר מעל השמש או מתחתיה.</p>
        <Engine>
          <AstroControls v={v} />
          <label className="fld">הגדלת הנטייה בציור
            <select aria-label="הגדלת הנטייה בציור" value={ex} onChange={e => setEx(+e.target.value)}>
              {[1, 2, 3, 5].map(k => <option key={k} value={k}>{k === 1 ? 'בלי הגדלה' : `×${k}`}</option>)}
            </select>
          </label>
          <Facts items={[
            ['רוחב הירח', <Num>{moon.beta.toFixed(2)}°</Num>],
            ['מקום הראש (ממוצע)', <Num>{node.toFixed(1)}°</Num>],
            ['הראש לפי הרמב״ם, באותו ערב', <Num>{(R.head / 60).toFixed(1)}°</Num>],
            ['השמש רחוקה מהצומת הקרוב', <><Num>{distNode.toFixed(1)}°</Num> {distNode < 12 && <Tag tone="bad">עונת ליקויים</Tag>}</>],
          ]} />
        </Engine>
      </>}
      more={<p>הרמב״ם (פרק טז) מחשב את ״מקום הראש״ במהלך אמצעי, ואת רוחב הירח לפי המרחק שלו מהראש. הנקודה הירוקה בסצנה היא הראש לפי חשבונו לאותו ערב, לצד הראש לפי האסטרונומיה המודרנית.</p>}
      stage={
        <Viz>
          <Scene3D load={load} props={props} label="מסלול הירח הנטוי ביחס למסלול השמש, עם קו הצמתים"
            play={{ playing: a.playing, label: 'הפעל: הירח במסלולו', toggle: () => setAstro(a.playing ? { playing: false } : { playing: true, t: t >= M.B - HOUR ? M.A : t }) }}
            views={[{ id: 'oblique', label: 'מבט אלכסוני' }, { id: 'top', label: 'מלמעלה' }, { id: 'edge', label: 'מהצד, לאורך המישור' }]}
            fallback={<Unrolled p={props} />} />
          <p className="note">{M.name}: אדום, הקטעים ליד הצמתים שבהם מולד יכול להיות ליקוי. הנטייה מוגדלת בציור כדי שתיראה.</p>
        </Viz>
      }
    />
  );
}
