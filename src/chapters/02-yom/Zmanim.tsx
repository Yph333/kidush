import { Fragment } from 'react';
import { localHM, shaahZmanit, zman } from '../../engines/zmanim';
import { GROUP_NAME, DAY_GRA, DAY_MGA_16_1, DAY_MGA_72, ZMANIM, type ZmanGroup } from '../../content/zmanimOpinions';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Num } from '../../components/text';
import { localHours } from '../../lib/zmanimYear';
import { CityControl, DateControl, NotARuling, T, setPick, usePick, useZDay } from './shared';

const GROUPS = Object.keys(GROUP_NAME) as ZmanGroup[];

/** The day as a right-to-left band with the picked zmanim marked; labels alternate above/below. */
function DayLine({ marks }: { marks: { g: ZmanGroup; ms: number | null }[] }) {
  const W = 760, H = 150, R = 740, L = 20, h0 = 3, h1 = 22;
  const X = (h: number) => R - ((h - h0) / (h1 - h0)) * (R - L);
  const pts = marks.filter(m => m.ms !== null).map(m => ({ ...m, h: localHours(m.ms!) })).sort((a, b) => a.h - b.h);
  return (
    <svg viewBox={`0 0 ${W} ${H}`} className="full" role="img" aria-label="זמני היום על ציר היום">
      <rect x={L} y="62" width={R - L} height="22" rx="4" className="wn" />
      {pts.length > 1 && (() => {
        const rise = pts.find(p => p.g === 'sunrise'), set = pts.find(p => p.g === 'sunset');
        return rise && set ? <rect x={X(set.h)} y="62" width={X(rise.h) - X(set.h)} height="22" className="wd" /> : null;
      })()}
      {Array.from({ length: h1 - h0 + 1 }, (_, i) => h0 + i).map(h => (
        <g key={h}>
          <line x1={X(h)} x2={X(h)} y1="84" y2={h % 3 ? 88 : 92} className="wtick" />
          {h % 3 === 0 && <text x={X(h)} y="106" textAnchor="middle" className="svgt tx-muted" direction="ltr">{String(h).padStart(2, '0')}:00</text>}
        </g>
      ))}
      {pts.map((p, i) => {
        const up = i % 2 === 0, x = X(p.h);
        return (
          <g key={p.g}>
            <line x1={x} x2={x} y1={up ? 40 : 62} y2={up ? 84 : 120} className="st-moon" strokeWidth="2" />
            <text x={x} y={up ? 34 - (i % 4 === 0 ? 14 : 0) : 134 + (i % 4 === 1 ? 14 : 0)} textAnchor="middle" className="svgt" fontWeight="700" fontSize="12">{GROUP_NAME[p.g]}</text>
          </g>
        );
      })}
    </svg>
  );
}

export function Zmanim() {
  const { y, m, d, p, city } = useZDay();
  const pick = usePick();
  const ctx = { y, m, d, p };
  const marks = GROUPS.map(g => ({ g, ms: zman(pick(g).def, ctx) }));
  const sh = (start: typeof DAY_GRA.start, end: typeof DAY_GRA.end) => shaahZmanit(start, end, ctx);
  const fmtMin = (ms: number | null) => (ms === null ? '—' : `${Math.floor(ms / 60000)}:${String(Math.round((ms / 1000) % 60)).padStart(2, '0')}`);

  return (
    <Slide
      wide
      kicker="היום · 2"
      title="זמני היום: כל זמן הוא שיטה"
      text={<>
        <p>לכל זמן יש כמה דרכים לחשב אותו. יש שיטות לפי <strong>זווית השמש</strong> מתחת לאופק, ויש לפי <strong>דקות קבועות</strong> מהזריחה או מהשקיעה.</p>
        <p>זמני הבוקר והצהריים נמדדים ב<Term k="shaaZmanit">שעות זמניות</Term>: מחלקים את היום ל־<Num>12</Num>. השאלה היא מאיפה עד איפה סופרים את היום.</p>
        <Engine title="אורך שעה זמנית" sub="דקות:שניות">
          <div className="ctl"><DateControl /><CityControl /></div>
          <table className="xt"><tbody>
            <tr><td>{DAY_GRA.label}</td><td><Num>{fmtMin(sh(DAY_GRA.start, DAY_GRA.end))}</Num></td></tr>
            <tr><td>{DAY_MGA_72.label}</td><td><Num>{fmtMin(sh(DAY_MGA_72.start, DAY_MGA_72.end))}</Num></td></tr>
            <tr><td>{DAY_MGA_16_1.label}</td><td><Num>{fmtMin(sh(DAY_MGA_16_1.start, DAY_MGA_16_1.end))}</Num></td></tr>
          </tbody></table>
        </Engine>
        <NotARuling />
      </>}
      more={<p>שיטה לפי זווית ״נודדת״ במשך השנה ביחס לזריחה: בחורף ובקיץ הזווית מתאימה למספר דקות אחר מאשר בניסן ובתשרי. שיטה לפי דקות קבועות לא תלויה בעונה ולא בקו הרוחב.</p>}
      stage={<>
        <Viz><DayLine marks={marks} /></Viz>
        <Viz className="table-wrap">
          <table className="zt">
            <caption>זמני היום ב{city.name}, <Num>{`${d}.${m + 1}.${y}`}</Num>. לחצו על שיטה כדי לבחור בה.</caption>
            <thead><tr><th scope="col">זמן</th><th scope="col">שיטות</th><th scope="col">השעה</th></tr></thead>
            <tbody>
              {GROUPS.map(g => {
                const ops = ZMANIM.filter(z => z.group === g), cur = pick(g), ms = zman(cur.def, ctx);
                return (
                  <Fragment key={g}>
                    <tr>
                      <th scope="row">{GROUP_NAME[g]}</th>
                      <td>
                        <div className="seg zops" role="radiogroup" aria-label={GROUP_NAME[g]}>
                          {ops.map(o => (
                            <button key={o.id} type="button" role="radio" aria-checked={o.id === cur.id} onClick={() => setPick(g, o.id)}>
                              {o.name} <small className="num">{(() => { const t = zman(o.def, ctx); return t === null ? '—' : localHM(t); })()}</small>
                            </button>
                          ))}
                        </div>
                        <div className="zdef">{cur.definition} <span className="src-ref">מקור: {cur.source}</span>{cur.note && <span className="note"> · {cur.note}</span>}</div>
                      </td>
                      <td className="ztime"><T ms={ms} /></td>
                    </tr>
                  </Fragment>
                );
              })}
            </tbody>
          </table>
        </Viz>
      </>}
    />
  );
}
