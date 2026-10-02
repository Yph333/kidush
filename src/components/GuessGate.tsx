// "Guess before you see": a question that hides its answer (and the content after it) until the
// class has guessed. Explore mode: must guess or say "I don't know". Presentation mode: the teacher
// may also reveal directly. Answers are stored per gate key, so the same gate on two slides agrees.

import { type ReactNode, useState } from 'react';
import { DAY_NAME } from '../engines/calendar';
import { dayWord } from '../lib/format';
import { type GuessRecord, setGuess, useStore } from '../state/store';
import { Num } from './text';

export type GuessKind =
  | { type: 'day' }
  | { type: 'yesno' }
  | { type: 'number'; min?: number; max?: number; unit?: string }
  | { type: 'choice'; options: { value: string; label: ReactNode }[] };

type Answer = number | boolean | string;

export interface GuessGateProps {
  /** storage key, e.g. gateKey('leap', 5787) */
  gateKey: string;
  question: ReactNode;
  kind: GuessKind;
  answer: Answer;
  /** short explanation shown with the answer */
  explain?: ReactNode;
  /** revealed after the guess */
  children?: ReactNode;
}

function label(kind: GuessKind, v: Answer): ReactNode {
  switch (kind.type) {
    case 'day': return dayWord(v as number);
    case 'yesno': return v ? 'כן' : 'לא';
    case 'number': return <><Num>{v as number}</Num>{kind.unit && ` ${kind.unit}`}</>;
    case 'choice': return kind.options.find(o => o.value === v)?.label ?? String(v);
  }
}

export function GuessGate(props: GuessGateProps) {
  return <Gate key={props.gateKey} {...props} />;
}

function Gate({ gateKey, question, kind, answer, explain, children }: GuessGateProps) {
  const rec = useStore(s => s.guesses[gateKey]);
  const mode = useStore(s => s.mode);
  const [num, setNum] = useState('');
  const [pick, setPick] = useState<Answer | null>(null);

  const submit = (v: Answer) => setGuess(gateKey, { value: v, how: 'guess', correct: v === answer });
  const giveUp = (how: GuessRecord['how']) => setGuess(gateKey, { value: null, how, correct: null });

  if (rec) {
    const tone = rec.correct === true ? 'ok' : rec.correct === false ? 'bad' : 'moon';
    return (
      <>
        <div className={`gate done ${tone}`} role="status">
          <div className="gate-q">{question}</div>
          <div className="gate-a">
            {rec.correct === true && <><b>נכון!</b> {label(kind, answer)}</>}
            {rec.correct === false && <><b>לא בדיוק.</b> ניחשתם {label(kind, rec.value as Answer)}; התשובה: <b>{label(kind, answer)}</b></>}
            {rec.correct === null && <>התשובה: <b>{label(kind, answer)}</b></>}
          </div>
          {explain && <div className="gate-x">{explain}</div>}
          <button type="button" className="linkbtn gate-reset" onClick={() => setGuess(gateKey, null)}>להסתיר שוב</button>
        </div>
        {children}
      </>
    );
  }

  return (
    <div className="gate open" role="group" aria-label="נחשו לפני שרואים">
      <div className="gate-tag">נחשו לפני שרואים</div>
      <div className="gate-q">{question}</div>
      <div className="gate-in">
        {kind.type === 'day' && (
          <div className="seg" role="group" aria-label="יום בשבוע">
            {'אבגדהוז'.split('').map((l, i) => (
              <button key={i} type="button" aria-label={DAY_NAME[i]} onClick={() => submit(i)}>{l}</button>
            ))}
          </div>
        )}
        {kind.type === 'yesno' && (
          <div className="seg">
            <button type="button" onClick={() => submit(true)}>כן</button>
            <button type="button" onClick={() => submit(false)}>לא</button>
          </div>
        )}
        {kind.type === 'number' && (
          <form className="gate-num" onSubmit={e => { e.preventDefault(); const v = Number(num); if (num.trim() !== '' && Number.isFinite(v)) submit(v); }}>
            <input type="number" inputMode="numeric" aria-label="הניחוש" min={kind.min} max={kind.max} value={num} onChange={e => setNum(e.target.value)} />
            {kind.unit && <span>{kind.unit}</span>}
            <button type="submit" className="btn pri" disabled={num.trim() === ''}>ניחוש</button>
          </form>
        )}
        {kind.type === 'choice' && (
          <>
            <div className="seg choice" role="radiogroup" aria-label="אפשרויות">
              {kind.options.map(o => (
                <button key={o.value} type="button" role="radio" aria-checked={pick === o.value} onClick={() => setPick(o.value)}>{o.label}</button>
              ))}
            </div>
            <button type="button" className="btn pri" disabled={pick === null} onClick={() => pick !== null && submit(pick)}>ניחוש</button>
          </>
        )}
      </div>
      <div className="gate-alt">
        <button type="button" className="linkbtn" onClick={() => giveUp('idk')}>אני לא יודע/ת</button>
        {mode === 'present' && <button type="button" className="btn" onClick={() => giveUp('skip')}>חשוף</button>}
      </div>
    </div>
  );
}

/** True once the gate has been answered (guessed, "don't know" or revealed). */
export function useGateDone(key: string): boolean {
  return useStore(s => key in s.guesses);
}

/** Placeholder for content that would give away a gate's answer. */
export function Hidden({ children, label = 'יתגלה אחרי הניחוש' }: { children?: ReactNode; label?: string }) {
  return <div className="hidden-ans" aria-label={label}>{children ?? <span>?</span>}<small>{label}</small></div>;
}
