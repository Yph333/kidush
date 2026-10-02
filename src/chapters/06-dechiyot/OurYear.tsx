// "Our year": does this dechiya move Rosh Hashana of the demo year? A guess point on each dechiya slide.

import { type Dechiya, DAY_LETTER, dechiyotDetail, fmtMolad, rh, yearHeb } from '../../engines/calendar';
import { GuessGate } from '../../components/GuessGate';
import { Engine } from '../../components/Slide';
import { Civil, Num, Sig } from '../../components/text';
import { gateKey } from '../../content/gates';
import { RULE_NAME, dayWord } from '../../lib/format';
import { useStore } from '../../state/store';

const ck = (b: boolean) => (b ? '✓' : '✗');

export function OurYear({ which }: { which: Dechiya }) {
  const y = useStore(s => s.demoYear);
  const r = rh(y), D = dechiyotDetail(y);
  const L = D.leap ? 'מעוברת' : 'פשוטה', PL = D.prevLeap ? 'מעוברת' : 'פשוטה';
  const applies = which === 'zaken' ? D.zaken : D[which].applies;

  const explain = {
    zaken: <>המולד ב־<Num>{D.hours}</Num> שעות: {D.zaken ? '18 ומעלה, דוחים' : 'לפני 18, לא דוחים'}.</>,
    gatrad: !D.gatrad.checked ? <>המולד כבר זקן, אז גטר״ד לא נבדקת.</>
      : <>יום {DAY_LETTER[D.wd]}׳ {ck(D.gatrad.tuesday)} · שנה פשוטה {ck(D.gatrad.common)} · ט׳ ר״ד ומעלה {ck(D.gatrad.late)}</>,
    betu: !D.betu.checked ? <>דחייה אחרת כבר חלה, אז בטו תקפט לא נבדקת.</>
      : <>יום {DAY_LETTER[D.wd]}׳ {ck(D.betu.monday)} · שעברה מעוברת {ck(D.betu.afterLeap)} · ט״ו תקפ״ט ומעלה {ck(D.betu.late)}</>,
    adu: <>היום המועמד {dayWord(D.adu.candidate)}{D.adu.applies ? <>: אד״ו, דוחים ל{dayWord(r.day)}.</> : ': לא אד״ו.'}</>,
  }[which];

  return (
    <Engine title={<>השנה שלנו: {yearHeb(y)}</>} sub="האם הדחייה הזו חלה?">
      <p className="m0">
        מולד תשרי <Sig>{fmtMolad(r.t)}</Sig> (<Civil t={r.t} />). השנה {L}, השנה שעברה {PL}.
        {which === 'adu' && <> אחרי שאר הדחיות, היום המועמד לראש השנה: <strong>{dayWord(D.adu.candidate)}</strong>.</>}
      </p>
      <GuessGate gateKey={gateKey(which, y)} kind={{ type: 'yesno' }} answer={applies}
        question={<>האם {RULE_NAME[which]} דוחה את ראש השנה {yearHeb(y)}?</>} explain={explain} />
    </Engine>
  );
}
