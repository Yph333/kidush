import { gq, hebDate, moladTotal, monthStart, monthsOf, splitParts, yearHeb, P_DAY } from '../../engines/calendar';
import { CITIES, HOUR, type OdehResult, ZONE, type OdehZone, dayOfMs, hm, localParts } from '../../engines/astro';
import { monthModel } from '../../lib/month';
import { type RambamResult, SIGNS, type VisibilityReason, rambam, rambamD0 } from '../../engines/rambam';
import { AstroControls, CivStr } from '../../components/astro/AstroControls';
import { useAstro } from '../../components/astro/useAstro';
import { SkyPanorama } from '../../components/astro/visuals';
import { Term } from '../../components/Glossary';
import { GuessGate } from '../../components/GuessGate';
import { gateKey } from '../../content/gates';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { DM, DMS, GDate, Num, Pos, Tag } from '../../components/text';
import { NUM, dayWord, hrs } from '../../lib/format';
import { setAstro, setState, useStore } from '../../state/store';

const ZoneTag = ({ z }: { z: OdehZone }) => <Tag tone={ZONE[z].tone}>{z} · {ZONE[z].label}</Tag>;
const RTag = ({ R }: { R: RambamResult }) => (R.visible ? <Tag tone="ok">נראה</Tag> : <Tag tone="bad">לא נראה</Tag>);
const dateShort = (ms: number) => { const p = localParts(ms); return `${p.d}.${p.m + 1}`; };
function Reason({ r }: { r: VisibilityReason }) {
  switch (r.kind) {
    case 'firstLongAbove': return <>אורך ראשון גדול מ־<Num>{r.hi}°</Num>: נראה בוודאי, בלי חשבון נוסף</>;
    case 'firstLongAtMost': return <>אורך ראשון <Num>{r.lo}°</Num> או פחות: לא ייראה, בלי חשבון נוסף</>;
    case 'arcAtMost9': return <>קשת הראייה <Num>9°</Num> או פחות</>;
    case 'arcAbove14': return <>קשת הראייה יותר מ־<Num>14°</Num></>;
    case 'limits': return <>קשת <DM min={r.arc} />: צריך אורך ראשון <Num>{r.need}°</Num> ומעלה, ויש <DM min={r.long1} /></>;
  }
}

const addSub = (x: number) => (x < 0 ? 'גורעים' : 'מוסיפים');

function OdehSteps({ o, mz, name }: { o: OdehResult; mz: number; name: string }) {
  return (
    <Steps label="Odeh" rows={[
      { l: 'שקיעה', v: <Num>{hm(o.ss)}</Num>, s: <CivStr ms={o.ss} /> },
      { l: 'שקיעת הירח', v: o.ms2 ? <Num>{hm(o.ms2)}</Num> : '—' },
      { l: 'זמן שהייה (Lag)', v: o.lag != null ? <><Num>{Math.round(o.lag / 60000)}</Num> דקות</> : '—', s: o.lag != null && o.lag <= 0 ? 'הירח שוקע לפני השמש: אין מה לראות' : '', c: o.lag != null && o.lag <= 0 ? 'bad' : '' },
      { l: 'הזמן הטוב ביותר: שקיעה + 4/9 מהשהייה', v: <Num>{hm(o.tb)}</Num> },
      { l: 'גבהים באותו רגע', v: <>ירח <Num>{o.s.moon.alt.toFixed(2)}°</Num> · שמש <Num>{o.s.sun.alt.toFixed(2)}°</Num></>, s: 'גובה טופוצנטרי, בלי שבירת אור' },
      { l: 'ARCV: הפרש הגבהים', v: <Num>{o.arcv.toFixed(2)}°</Num> },
      { l: 'ARCL: המרחק הזוויתי שמש־ירח', v: <Num>{o.arcl.toFixed(2)}°</Num> },
      { l: <>W: רוחב הסהר = <Num>SD × (1 − cos ARCL)</Num></>, v: <><Num>{o.W.toFixed(3)}</Num> דקות קשת</>, s: <>SD (חצי קוטר הירח) = <Num>{o.s.SD.toFixed(2)}′</Num></> },
      { l: <Num>V = ARCV − (−0.1018W³ + 0.7319W² − 6.3226W + 7.1651)</Num>, v: <Num>{o.V.toFixed(2)}</Num> },
      { l: 'ההכרעה', v: <ZoneTag z={o.zone} />, c: 'final' },
      { l: 'ומה עם מולד זקן?', v: <>המולד הממוצע של {name} ב־<Num>{mz}</Num> שעות</>, s: mz >= 18 ? 'מולד זקן: לפי הכלל לא תיראה הלבנה בערב שאחרי המולד' : 'לפני 18 שעות: לפי הכלל הלבנה יכולה להיראות סמוך לשקיעה הקרובה' },
    ]} />
  );
}

function RambamSteps({ R }: { R: RambamResult }) {
  const [lo, hi] = R.preLim;
  const pre = R.pre === 'calc' ? <>בין <Num>{lo}°</Num> ל־<Num>{hi}°</Num>: צריך חשבון</> : R.pre === 'yes' ? <>יותר מ־<Num>{hi}°</Num>: נראה בוודאי</> : <><Num>{lo}°</Num> או פחות: לא ייראה</>;
  return (
    <Steps label="חשבון הרמב״ם" rows={[
      { l: 'ימים שלמים מהעיקר (ליל ה׳, ג׳ ניסן ד׳תתקל״ח)', v: <Num>{NUM(R.N)}</Num>, s: <Num>{R.parts.map(([k, c]) => `${c}×${k}`).join(' + ') || '0'}</Num> },
      { l: <><Term k="emtza">אמצע</Term> השמש</>, v: <DMS sec={R.sunMean} />, s: <><Term k="gova">גובה</Term> השמש: <DMS sec={R.apo} /></> },
      { l: <><Term k="maslul">מסלול</Term> השמש = אמצע − גובה</>, v: <><DMS sec={R.sunMaslul} /> ← <Num>{R.sunMaslulR}°</Num></>, s: <><Term k="menat" />: <DM min={R.sunEq} />, {R.sunSign < 0 ? 'גורעים' : R.sunSign > 0 ? 'מוסיפים' : 'אין'}</> },
      { l: 'מקום השמש האמיתי', v: <Pos min={R.sunTrue} /> },
      { l: 'אמצע הירח לשעת הראייה', v: <DMS sec={R.moonAdj} />, s: <>אמצע <DMS sec={R.moonMean} />, {R.season ? <>{addSub(R.season)} <Num>{Math.abs(R.season)}</Num> חלקים לפי מזל השמש</> : 'בלי תיקון לפי מזל השמש'}</> },
      { l: 'מרחק כפול', v: <><DMS sec={R.dbl} /> ← מוסיפים <Num>{R.dblAdd}°</Num> למסלול</>, s: R.dblOut ? 'מחוץ לטווח שהרמב״ם מגדיר (5°–63°)' : '' },
      { l: 'המסלול הנכון', v: <Num>{R.crsR}°</Num>, s: <>אמצע המסלול <DMS sec={R.crs} /></> },
      { l: 'מקום הירח האמיתי', v: <Pos min={R.moonTrue} />, s: <>מנת המסלול <DM min={R.moonEq} />, {R.moonSignOp < 0 ? 'גורעים' : R.moonSignOp > 0 ? 'מוסיפים' : 'אין'}</> },
      { l: <>מקום <Term k="rosh">הראש</Term></>, v: <Pos min={R.head} />, s: <>מסלול הרוחב: <Num>{R.latCourseR}°</Num></> },
      { l: <><Term k="rochav">רוחב</Term> ראשון</>, v: <><DM min={R.lat1} /> {R.north ? 'צפוני' : 'דרומי'}</> },
      { l: 'אורך ראשון = ירח − שמש', v: <DM min={R.long1} />, s: <>הירח ב{SIGNS[R.sign]}. בדיקה מקדימה: {pre}</>, c: R.pre === 'calc' ? '' : R.pre === 'yes' ? 'good' : 'bad' },
      { l: <><Term k="shinui">שינוי מראה</Term> האורך ← אורך שני</>, v: <><Num>{`−${R.plon}′`}</Num> ← <DM min={R.long2} /></> },
      { l: 'שינוי מראה הרוחב ← רוחב שני', v: <><Num>{`${R.north ? '−' : '+'}${R.plat}′`}</Num> ← <DM min={R.lat2} /></> },
      { l: 'מעגל הירח', v: <>{R.circFrac} מהרוחב השני = <DM min={R.circle} /></> },
      { l: 'אורך שלישי', v: <DM min={R.long3} />, s: `${R.circAdd ? 'מוסיפים' : 'גורעים'} את מעגל הירח` },
      { l: 'אורך רביעי', v: <DM min={R.long4} />, s: <>{R.fourthTxt} (<DM min={R.fourthDelta} />)</> },
      { l: 'מנת גובה המדינה = ⅔ מהרוחב הראשון', v: <DM min={R.geo} />, s: R.north ? 'רוחב צפוני: מוסיפים' : 'רוחב דרומי: גורעים' },
      { l: <Term k="keshet" />, v: <DM min={R.arc} /> },
      { l: 'ההכרעה', v: <RTag R={R} />, s: <>לפי <Term k="kitzei" />: <Reason r={R.reason} /></>, c: 'final' },
    ]} />
  );
}

export function Visibility() {
  const v = useAstro();
  const { M, a, c } = v;
  const sel = a.dSel != null && M.ev[a.dSel] ? a.dSel : Math.max(0, M.first ? M.ev.indexOf(M.first) : 0);
  const o = M.ev[sel];
  const rc = monthStart(M.y, M.mi);
  const mz = splitParts(moladTotal(M.y, M.mi) % P_DAY).h;
  const R = o ? rambam(dayOfMs(o.ss + 60000, c)) : null;
  const hd = R ? hebDate(R.N + rambamD0()) : null;
  const guesses = useStore(st => st.guesses);
  const visKey = (di: number) => gateKey('vis', `${di}-${c.name}`);
  const selKey = o ? visKey(dayOfMs(o.ss + 60000, c)) : '';
  const agree = R && o ? (R.visible && (o.zone === 'A' || o.zone === 'B')) || (!R.visible && (o.zone === 'C' || o.zone === 'D')) : false;

  // The Rambam's worked example is computed for Jerusalem.
  const loadRambamExample = () => {
    const mi = monthsOf(4938).findIndex(m => m[0] === 'אייר');
    const J = CITIES[0], EM = monthModel(4938, mi, J), target = monthStart(4938, mi) + 1;
    const i = EM.ev.findIndex(e => dayOfMs(e.ss + 60000, J) === target);
    setState({ city: 0 });
    setAstro({ y: 4938, mi, playing: false, dSel: i < 0 ? null : i, t: i < 0 ? null : EM.ev[i].tb });
  };

  return (
    <Slide
      wide
      kicker="ראייה מול חשבון · 2"
      title="מתי רואים את הסהר"
      text={<>
        <p>בזמן קידוש החודש על פי ראייה, השאלה הייתה אחת: האם העדים יכולים לראות את הסהר בערב הזה?</p>
        <button type="button" className="btn" onClick={loadRambamExample}>טען את הדוגמה של הרמב״ם: ליל ערב שבת, ב׳ אייר ד׳תתקל״ח</button>
        <Engine><AstroControls v={v} /></Engine>
      </>}
      more={<>
        <p>זה תלוי בכמה דברים: כמה זמן הירח נשאר מעל האופק אחרי השקיעה, כמה הוא גבוה מעל השמש (<strong>ARCV</strong>), וכמה רחב הסהר (<strong>W</strong>).</p>
        <p>הקריטריון של <strong>Odeh</strong> נבנה על מאות תצפיות. הוא מחשב מספר אחד, V, בזמן התצפית הטוב ביותר: שקיעה ועוד <Num>4/9</Num> מזמן השהייה של הירח.</p>
        <p><strong>הרמב״ם</strong> (פרקים יא–יז) נותן שיטה שלמה לחשב את זה ביד: מקום השמש והירח כשליש שעה אחרי השקיעה בירושלים, רוחב הירח, תיקוני ״שינוי המראה״, ומכולם <Term k="keshet" />. ההכרעה היא לפי <Term k="kitzei" />: השוואה בין קשת הראייה לאורך הראשון.</p>
        <table className="xt"><tbody>
          <tr><td><Tag tone="ok">A</Tag></td><td><Num>V ≥ 5.65</Num>: נראה בעין</td></tr>
          <tr><td><Tag tone="moon">B</Tag></td><td><Num>2 ≤ V</Num>: אולי בעין, בטוח במשקפת</td></tr>
          <tr><td><Tag tone="leap">C</Tag></td><td><Num>−0.96 ≤ V</Num>: רק במשקפת</td></tr>
          <tr><td><Tag tone="bad">D</Tag></td><td>לא נראה</td></tr>
        </tbody></table>
        <p className="note">תאריכים לפני <Num>1582</Num> מוצגים בלוח הגרגוריאני, לא ביוליאני.</p>
      </>}
      stage={<>
        <Viz className="table-wrap">
          <table className="evt">
            <thead><tr><th>ערב</th><th>גיל הירח</th><th>שהייה</th><th>ARCV</th><th className="explore-only">W</th><th>V</th><th>Odeh</th><th>רמב״ם</th></tr></thead>
            <tbody>
              {M.ev.map((e, i) => {
                const age = (e.ss - M.conj) / HOUR, di = dayOfMs(e.ss + 60000, c), h = hebDate(di), shown = visKey(di) in guesses;
                return (
                  <tr key={i} className={i === sel ? 'sel' : ''} tabIndex={0} aria-selected={i === sel}
                    onClick={() => setAstro({ dSel: i, t: e.tb, playing: false })}
                    onKeyDown={ev => { if (ev.key === 'Enter' || ev.key === ' ') { ev.preventDefault(); setAstro({ dSel: i, t: e.tb, playing: false }); } }}>
                    <td>ערב <Num>{dateShort(e.ss)}</Num><br /><small className="note">ליל {gq(h.d)} {h.name}</small></td>
                    <td>{age > 0 ? <Num>{hrs(age * HOUR)}</Num> : 'לפני המולד'}</td>
                    <td>{e.lag != null && e.lag > 0 ? <><Num>{Math.round(e.lag / 60000)}</Num> דק׳</> : 'שוקע לפני השמש'}</td>
                    <td><Num>{e.arcv.toFixed(1)}°</Num></td>
                    <td className="explore-only"><Num>{e.W.toFixed(2)}′</Num></td>
                    <td>{shown ? <Num>{e.V.toFixed(2)}</Num> : '?'}</td>
                    <td>{shown ? <ZoneTag z={e.zone} /> : '?'}</td>
                    <td>{shown ? <RTag R={rambam(di)} /> : '?'}</td>
                  </tr>
                );
              })}
            </tbody>
          </table>
          <p className="note">ראש חודש {M.name} לפי הלוח: {dayWord(rc)} <GDate day={rc} /> (מתחיל בערב שלפניו). ראייה ראשונה בעין או במשקפת לפי Odeh ב{c.name}: {M.first ? <>ערב <Num>{dateShort(M.first.ss)}</Num></> : 'לא בטווח'}. לחצו על שורה.</p>
        </Viz>
        {o && <Viz className="sky"><SkyPanorama ms={o.tb} c={c} /></Viz>}
        {o && R && hd && (
          <GuessGate gateKey={selKey} kind={{ type: 'yesno' }} answer={R.visible}
            question={<>ערב <Num>{dateShort(o.ss)}</Num>, ליל {gq(hd.d)} {hd.name}: לפי חשבון הרמב״ם, האם הסהר ייראה הערב?</>}
            explain={<>קשת הראייה <DM min={R.arc} />, אורך ראשון <DM min={R.long1} />.</>}>
          <div className={`result ${agree ? 'ok' : 'bad'}`}>
            ליל {gq(hd.d)} {hd.name} {yearHeb(hd.y)} · Odeh: <ZoneTag z={o.zone} /> · הרמב״ם: <RTag R={R} /> · {agree ? 'השיטות מסכימות' : 'השיטות חלוקות'}{o.zone === 'B' ? ' (Odeh גבולי)' : ''}
          </div>
          <div className="vpair">
            <Engine title="Odeh" sub="אסטרונומיה מודרנית"><OdehSteps o={o} mz={mz} name={M.name} /></Engine>
            <Engine title="הרמב״ם" sub="קידוש החודש יא–יז"><RambamSteps R={R} /></Engine>
          </div>
          </GuessGate>
        )}
      </>}
    />
  );
}
