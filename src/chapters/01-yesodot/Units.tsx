import { useState } from 'react';
import { DayBand } from '../../components/DayBand';
import { Term } from '../../components/Glossary';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Num } from '../../components/text';
import { NUM } from '../../lib/format';

const pad = (n: number) => String(n).padStart(2, '0');

export function Units() {
  const [h, setH] = useState(5);
  const [p, setP] = useState(204);
  const ch = (18 + h) % 24, mi = Math.floor(p / 18), r = p % 18, sec = Math.round(r * 10 / 3);
  const clock = `${pad(ch)}:${pad(mi)}`;

  return (
    <Slide
      kicker="יסודות · 1"
      title="יום, שעה וחלק"
      text={<>
        <p>היממה בלוח מתחילה <strong>בשש בערב</strong>, כמו ״ויהי ערב ויהי בוקר״. שעה <Num>0</Num> היא <Num>18:00</Num>, שעה <Num>12</Num> היא <Num>6:00</Num> בבוקר, ושעה <Num>18</Num> היא <Num>12:00</Num> בצהריים.</p>
        <p>כל שעה מחולקת ל־<strong><Num>1080</Num> <Term k="chelek">חלקים</Term></strong>. חלק אחד הוא <Num>3⅓</Num> שניות, ו־<Num>18</Num> חלקים הם דקה.</p>
      </>}
      more={<>
        <h3>למה דווקא 1080?</h3>
        <p>כי הוא מתחלק בלי שארית בכל המספרים מ־<Num>1</Num> עד <Num>10</Num> חוץ מ־<Num>7</Num>. אפשר לכתוב חצי, שליש, רביע, חמישית, שישית, שמינית, תשיעית ועשירית של שעה כמספר שלם של חלקים. לחשבון בלי שברים זה חיוני.</p>
      </>}
      stage={<>
        <Viz><DayBand at={h + p / 1080} label={`${h} שעות ${p} חלקים`} /></Viz>
        <Viz className="explore-only">
          <p className="vt"><Num>1080</Num> מתחלק ב…</p>
          <div className="mstrip">
            {Array.from({ length: 12 }, (_, i) => i + 1).map(k => (
              <div key={k} className={1080 % k ? '' : 'flex'}>
                <b className="num">{k}</b><small>{1080 % k ? 'לא' : <Num>= {1080 / k}</Num>}</small>
              </div>
            ))}
          </div>
        </Viz>
        <Engine title="ממיר זמנים" sub="שעה עברית וחלקים ⇄ שעון רגיל">
          <div className="ctl">
            <label className="fld">שעה עברית (0–23)
              <input type="number" min={0} max={23} value={h} onChange={e => setH(Math.max(0, Math.min(23, +e.target.value || 0)))} />
            </label>
            <label className="fld">חלקים (0–1079)
              <input type="number" min={0} max={1079} value={p} onChange={e => setP(Math.max(0, Math.min(1079, +e.target.value || 0)))} />
            </label>
            <span className="or">או</span>
            <label className="fld">שעון
              <input type="time" value={clock} onChange={e => {
                const [H, M] = (e.target.value || '0:0').split(':').map(Number);
                setH((H + 6) % 24); setP(M * 18);
              }} />
            </label>
          </div>
          <Steps rows={[
            { l: 'שעה עברית', v: <><Num>{h}</Num> שעות ו־<Num>{p}</Num> חלקים</>, s: <>מתחילת היממה: <Num>{NUM(h * 1080 + p)}</Num> חלקים</> },
            { l: 'מוסיפים לשש בערב', v: <><Num>{`18 + ${h} = ${18 + h}`}</Num>{18 + h >= 24 && <> ← <Num>{ch}</Num> (אחרי חצות)</>}</>, s: h < 6 ? 'עדיין ערב של היום הקודם בשעון' : '' },
            { l: 'חלקים לדקות: מחלקים ב־18', v: <><Num>{`${p} ÷ 18 = ${mi}`}</Num> דקות, שארית <Num>{r}</Num> חלקים</> },
            { l: 'שארית לשניות: כפול 3⅓', v: <><Num>{`${r} × 3⅓ ≈ ${sec}`}</Num> שניות</> },
            { l: 'בשעון', v: <Num>{`${clock}:${pad(sec)}`}</Num>, c: 'final' },
          ]} />
        </Engine>
      </>}
    />
  );
}
