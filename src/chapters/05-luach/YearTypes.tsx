import { TYPE_NAME, isLeap, monthsOf, rh, yearHeb, yearLen, yearType } from '../../engines/calendar';
import { GuessGate, Hidden, useGateDone } from '../../components/GuessGate';
import { MonthStrip } from '../../components/Ring';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { GDate, Legend, Num, Tag } from '../../components/text';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { gateKey } from '../../content/gates';
import { dayWord } from '../../lib/format';

export function YearTypes() {
  const yr = useSlideYear();
  const y = yr.y, a = rh(y), b = rh(y + 1), len = yearLen(y), t = yearType(len)!, L = isLeap(y), ms = monthsOf(y);
  const kLen = gateKey('length', y), kType = gateKey('type', y);
  const typeDone = useGateDone(kType);
  return (
    <Slide
      kicker="הלוח הקבוע · 3"
      title="חסרה, כסדרה, שלמה"
      text={<>
        <p>החודשים מתחלפים מלא וחסר. רק שניים גמישים: <strong>חשוון</strong> ו<strong>כסלו</strong>.</p>
        <table className="xt">
          <tbody>
            <tr><td><Tag tone="bad">חסרה</Tag></td><td>חשוון <Num>29</Num>, כסלו <Num>29</Num></td><td><Num>353 / 383</Num></td></tr>
            <tr><td><Tag tone="moon">כסדרה</Tag></td><td>חשוון <Num>29</Num>, כסלו <Num>30</Num></td><td><Num>354 / 384</Num></td></tr>
            <tr><td><Tag tone="ok">שלמה</Tag></td><td>חשוון <Num>30</Num>, כסלו <Num>30</Num></td><td><Num>355 / 385</Num></td></tr>
          </tbody>
        </table>
        <p>את סוג השנה לא בוחרים. סופרים את הימים מראש השנה הזה עד ראש השנה הבא, והמספר קובע.</p>
      </>}
      more={<p>השנה הממוצעת היא <Num>354</Num> ימים ו־<Num>8</Num> שעות. הדחיות מזיזות את ראש השנה ביום או ביומיים, ולכן האורך תמיד יוצא באחד משישה ערכים בלבד. <strong>כל אורך אחר אסור</strong>, ושתי הדחיות האחרונות קיימות בדיוק כדי למנוע אותו.</p>}
      stage={<>
        <Viz>
          {typeDone ? <MonthStrip months={ms} title={`החודשים של ${yearHeb(y)}`} /> : <Hidden label="החודשים של השנה יתגלו אחרי הניחוש" />}
          <Legend items={[['var(--moon-soft)', 'החודשים הגמישים'], ['var(--leap-soft)', 'חודש העיבור']]} />
        </Viz>
        <Engine title="אורך השנה" sub="מראש השנה עד ראש השנה">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <GuessGate gateKey={kLen} kind={{ type: 'number', min: 350, max: 390, unit: 'ימים' }} answer={len}
            question={<>ראש השנה {yearHeb(y)}: {dayWord(a.day)} <GDate day={a.day} />. ראש השנה {yearHeb(y + 1)}: {dayWord(b.day)} <GDate day={b.day} />. כמה ימים יש בשנה?</>}
            explain={L ? <>שנה מעוברת: <Num>383–385</Num> ימים.</> : <>שנה פשוטה: <Num>353–355</Num> ימים.</>}>
            <GuessGate gateKey={kType} kind={{ type: 'choice', options: (['ח', 'כ', 'ש'] as const).map(v => ({ value: v, label: TYPE_NAME[v] })) }} answer={t}
              question={<>אם כך, איזו שנה היא {yearHeb(y)}?</>}
              explain={<>חשוון <Num>{ms[1][1]}</Num>, כסלו <Num>{ms[2][1]}</Num>.</>}>
              <Steps rows={[
                { l: `ראש השנה ${yearHeb(y)}`, v: <>{dayWord(a.day)} <GDate day={a.day} /></> },
                { l: `ראש השנה ${yearHeb(y + 1)}`, v: <>{dayWord(b.day)} <GDate day={b.day} /></> },
                { l: 'מחסירים', v: <><Num>{len}</Num> ימים</>, s: L ? <>שנה מעוברת: <Num>383, 384</Num> או <Num>385</Num></> : <>שנה פשוטה: <Num>353, 354</Num> או <Num>355</Num></> },
                { l: 'חשוון וכסלו', v: <>חשוון <Num>{ms[1][1]}</Num>, כסלו <Num>{ms[2][1]}</Num></> },
                { l: 'סוג השנה', v: <><Tag tone={t === 'ח' ? 'bad' : t === 'ש' ? 'ok' : 'moon'}>{TYPE_NAME[t]}</Tag> {L ? 'מעוברת' : 'פשוטה'}</>, c: 'final' },
              ]} />
            </GuessGate>
          </GuessGate>
        </Engine>
      </>}
    />
  );
}
