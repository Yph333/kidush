import { P_DAY, fmtMolad, rh, yearHeb } from '../../engines/calendar';
import { CITIES } from '../../engines/astro';
import { CHAPTERS } from '..';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Civil, GDate, Legend, Sig, Tag } from '../../components/text';
import { WeekWheel, dayMark } from '../../components/WeekWheel';
import { YearControl } from '../../components/YearControl';
import { RULE_NAME, dayWord } from '../../lib/format';
import { go } from '../../state/nav';
import { setState, useStore } from '../../state/store';

export function Opening() {
  const y = useStore(s => s.demoYear);
  const city = useStore(s => s.city);
  const r = rh(y);
  return (
    <Slide
      hero
      kicker="סדר לעשות לוח"
      title="איך בונים לוח עברי"
      text={<>
        <p>מחלק אחד של שעה, דרך מולד הלבנה ושני המחזורים, ועד היום שבו חל ראש השנה בכל שנה שתבחרו. בכל שקף יש מנוע חישוב משלו.</p>
        <p>בוחרים <strong>שנת הדגמה</strong> ו<strong>מקום</strong>. כל השקפים יחשבו עליהם, ואפשר לשנות אותם בכל רגע מהסרגל העליון.</p>
        <ol className="road">
          {CHAPTERS.map(ch => (
            <li key={ch.id}>
              <span className="road-ch"><span className="num">{ch.num}</span> {ch.title}</span>
              <ul>
                {ch.slides.filter(s => !(ch.id === 'yesodot' && s.id === 'petiha')).map(s => (
                  <li key={s.id}><button type="button" onClick={() => go(`${ch.id}/${s.id}`)}>{s.title}</button></li>
                ))}
              </ul>
            </li>
          ))}
        </ol>
      </>}
      stage={<>
        <Engine title="שנת ההדגמה ומקום" sub="נשמרים בכתובת ובדפדפן">
          <div className="ctl">
            <YearControl value={y} onChange={v => setState({ demoYear: v })} label="שנת הדגמה" />
            <label className="fld">מקום
              <select value={city} onChange={e => setState({ city: +e.target.value })}>
                {CITIES.map((c, i) => <option key={c.name} value={i}>{c.name}</option>)}
              </select>
            </label>
          </div>
        </Engine>
        <Viz>
          <WeekWheel
            markers={[{ x: r.t, cls: 'moon', label: 'מולד' }]}
            arcs={r.rules.length ? [{ from: r.t, to: r.t + (r.day * P_DAY + P_DAY / 2 - r.t), cls: 'shift' }] : []}
            days={dayMark(r.day)}
            center={['ראש השנה', yearHeb(y), dayWord(r.day)]}
            aria="מולד תשרי וראש השנה על גלגל השבוע"
          />
          <Legend items={[['var(--moon)', 'מולד תשרי'], ['var(--shift)', 'דחייה'], ['var(--ok-soft)', 'היום שנקבע']]} />
        </Viz>
        <div className="result">
          <p>מולד תשרי <Sig>{fmtMolad(r.t)}</Sig>: <Civil t={r.t} />.</p>
          <p className="m0">
            {r.rules.length
              ? <>דחיות שחלו: {r.rules.map(k => <Tag key={k} tone="bad">{RULE_NAME[k]}</Tag>)}</>
              : <Tag tone="ok">בלי דחייה</Tag>}
            {' · '}ראש השנה: <strong>{dayWord(r.day)}</strong> <GDate day={r.day} />
          </p>
        </div>
      </>}
    />
  );
}
