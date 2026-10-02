import {
  DAY_LETTER, P_DAY, TYPE_NAME, dechiyotDetail, fmtMolad, gDate, keviut, monthsBeforeSteps, monthsOf, pesachDay, rh,
  tekufotShmuel, yearHeb, yearLen, yearType,
} from '../../engines/calendar';
import { GuessGate, Hidden, useGateDone } from '../../components/GuessGate';
import { MonthStrip } from '../../components/Ring';
import { gateKey } from '../../content/gates';
import { Engine, Slide, Viz } from '../../components/Slide';
import { Steps } from '../../components/Steps';
import { Civil, GDate, Num, Sig, Tag } from '../../components/text';
import { WeekWheel, dayMark } from '../../components/WeekWheel';
import { SlideYear, useSlideYear } from '../../components/YearControl';
import { NUM, dayWord } from '../../lib/format';

const ck = (b: boolean) => (b ? '✓' : '✗');
const Yes = () => <Tag tone="bad">חלה</Tag>;
const No = () => <Tag tone="ok">לא חלה</Tag>;

export function Calculator() {
  const yr = useSlideYear();
  const y = yr.y, r = rh(y), D = dechiyotDetail(y), m = monthsBeforeSteps(y), T = tekufotShmuel(y);
  const len = yearLen(y), t = yearType(len)!, k = keviut(y), pd = pesachDay(y), next = rh(y + 1);
  const key = gateKey('rh-day', y), done = useGateDone(key);
  const g1 = gDate(r.day).getUTCFullYear(), g2 = gDate(next.day - 1).getUTCFullYear();
  return (
    <Slide
      kicker="כלים"
      title="המחשבון המלא"
      text={<>
        <p>מכניסים שנה, ומקבלים את כל השרשרת: חודשים מבהר״ד, מקום במחזורים, המולד, כל אחת מארבע הדחיות, היום שנקבע, אורך השנה, החודשים והקביעות.</p>
        <p>אפשר להקליד מספר (<Num>5787</Num> או <Num>787</Num>) או אותיות (תשפ״ז, ה׳תשפ״ז).</p>
        <p className="explore-only">טיפ לכיתה: לחצו ״שלב־שלב״ ותנו לתלמידים לנחש כל שלב לפני שהוא נחשף.</p>
        <Viz>
          {done ? <WeekWheel markers={[{ x: r.t, cls: 'moon', label: 'מולד' }]}
            arcs={r.rules.length ? [{ from: r.t, to: r.t + (r.day * P_DAY + P_DAY / 2 - r.t), cls: 'shift' }] : []}
            days={dayMark(r.day)} center={[yearHeb(y), k, dayWord(r.day)]} aria="מולד וראש השנה על גלגל השבוע" /> : <Hidden />}
        </Viz>
      </>}
      stage={
        <Engine title="מחשבון הלוח">
          <div className="ctl"><SlideYear yr={yr} /></div>
          <GuessGate gateKey={key} kind={{ type: 'day' }} answer={r.day % 7}
            question={<>באיזה יום בשבוע יחול ראש השנה {yearHeb(y)}?</>}
            explain={<>מולד תשרי <Sig>{fmtMolad(r.t)}</Sig>{r.rules.length ? ', ואחריו דחייה' : ', בלי דחייה'}.</>}>
          <Steps rows={[
            { l: 'השנה', v: <><Sig>{yearHeb(y)}</Sig> (<Num>{y}</Num>)</>, s: g1 > 99 ? <>בערך <Num>{`${g1}–${g2}`}</Num></> : '' },
            { l: 'מחזור קטן', v: <>מחזור <Num>{NUM(m.cycles + 1)}</Num>, שנה <Num>{m.rem + 1}</Num> · {D.leap ? <Tag tone="leap">מעוברת</Tag> : 'פשוטה'}</>, s: `השנה שעברה ${D.prevLeap ? 'מעוברת' : 'פשוטה'}` },
            { l: 'מחזור גדול', v: <>מחזור <Num>{NUM(T.cycle)}</Num>, שנה <Num>{T.year}</Num></>, s: T.year === 1 ? 'שנת ברכת החמה' : '' },
            { l: 'חודשים מבהר״ד', v: <Num>{NUM(m.total)}</Num>, s: <><Num>{`${NUM(m.cycles)} × 235`}</Num> + <Num>{m.rem}</Num> שנים במחזור</> },
            { l: 'מולד תשרי', v: <Sig>{fmtMolad(r.t)}</Sig>, s: <Civil t={r.t} /> },
            { l: 'מולד זקן', v: D.zaken ? <Yes /> : <No />, s: <><Num>{D.hours}</Num> שעות: {D.zaken ? '18 ומעלה' : 'לפני 18'}</>, c: D.zaken ? 'bad' : '' },
            {
              l: 'גטר״ד', v: D.gatrad.applies ? <Yes /> : <No />, c: D.gatrad.applies ? 'bad' : '',
              s: !D.gatrad.checked ? 'לא נבדקת: מולד זקן כבר דחה' : `יום ${DAY_LETTER[D.wd]}׳ ${ck(D.gatrad.tuesday)} · פשוטה ${ck(D.gatrad.common)} · ט׳ ר״ד ומעלה ${ck(D.gatrad.late)}`,
            },
            {
              l: 'בטו תקפט', v: D.betu.applies ? <Yes /> : <No />, c: D.betu.applies ? 'bad' : '',
              s: !D.betu.checked ? 'לא נבדקת: דחייה אחרת כבר חלה' : `יום ${DAY_LETTER[D.wd]}׳ ${ck(D.betu.monday)} · שעברה מעוברת ${ck(D.betu.afterLeap)} · ט״ו תקפ״ט ומעלה ${ck(D.betu.late)}`,
            },
            { l: 'לא אד״ו', v: D.adu.applies ? <Yes /> : <No />, s: <>היום המועמד: {dayWord(D.adu.candidate)}{D.adu.applies && <> ← {dayWord(r.day)}</>}</>, c: D.adu.applies ? 'bad' : '' },
            { l: 'ראש השנה', v: <>{dayWord(r.day)} <GDate day={r.day} /></>, c: 'final' },
            { l: 'אורך השנה', v: <><Num>{len}</Num> ימים · {TYPE_NAME[t]}</>, s: <>ראש השנה הבא: {dayWord(next.day)} <GDate day={next.day} /></> },
            { l: 'קביעות', v: <Sig>{k}</Sig>, s: <>פסח: {dayWord(pd)} <GDate day={pd} /></>, c: 'final' },
          ]} />
          <Viz plain><MonthStrip months={monthsOf(y)} /></Viz>
          </GuessGate>
        </Engine>
      }
    />
  );
}
