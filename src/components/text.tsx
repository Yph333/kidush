// Inline text atoms. Every number, time or degree value goes through <Num> (LTR-isolated).

import type { ReactNode } from 'react';
import { civil, splitParts } from '../engines/calendar';
import { NUM, civilText, fmtDM, fmtDMS, fmtPos, gStr } from '../lib/format';

export function Num({ children }: { children: ReactNode }) {
  return <span className="num">{children}</span>;
}

/** Hebrew-letter numerals / signs (בהר״ד), serif. */
export function Sig({ children }: { children: ReactNode }) {
  return <span className="sig">{children}</span>;
}

export type Tone = 'ok' | 'bad' | 'leap' | 'moon';

export function Tag({ tone, children }: { tone: Tone; children: ReactNode }) {
  return <span className={`tag ${tone}`}>{children}</span>;
}

/** Molad (parts) as civil time: "יום ראשון בשעה 23:11 ו־6 חלקים". */
export function Civil({ t }: { t: number }) {
  const c = civilText(t), rem = civil(t).rem;
  return <>{c.day} בשעה <Num>{c.time}</Num>{rem === 1 ? <> וחלק אחד</> : rem ? <> ו־<Num>{rem}</Num> חלקים</> : null}</>;
}

/** Day index → civil date, or nothing for very early years. */
export function GDate({ day }: { day: number }) {
  const s = gStr(day);
  return s ? <Num>{s}</Num> : null;
}

export const DM = ({ min }: { min: number }) => <Num>{fmtDM(min)}</Num>;
export const DMS = ({ sec }: { sec: number }) => <Num>{fmtDMS(sec)}</Num>;
export function Pos({ min }: { min: number }) {
  const p = fmtPos(min);
  return <><Num>{p.dm}</Num> ב{p.sign}</>;
}

export function Legend({ items }: { items: [color: string, label: ReactNode][] }) {
  return (
    <div className="legend">
      {items.map(([c, t], i) => <span key={i}><i style={{ background: c }} />{t}</span>)}
    </div>
  );
}

export function Facts({ items }: { items: [label: ReactNode, value: ReactNode][] }) {
  return (
    <div className="facts">
      {items.map(([l, v], i) => <div key={i}><small>{l}</small><b>{v}</b></div>)}
    </div>
  );
}

export function Chips<T>({ label, items, onPick, render }: {
  label: ReactNode; items: T[]; onPick: (v: T) => void; render: (v: T) => ReactNode;
}) {
  return (
    <div className="chips">
      <span>{label}</span>
      {items.map((v, i) => <button type="button" key={i} onClick={() => onPick(v)}>{render(v)}</button>)}
    </div>
  );
}

/** Parts as "1,234 ימים, 5 שעות, 204 חלקים" with only the numbers LTR-isolated. */
export function DHP({ t }: { t: number }) {
  const { d, h, p } = splitParts(t);
  return <><Num>{NUM(d)}</Num> ימים, <Num>{h}</Num> שעות, <Num>{p}</Num> חלקים</>;
}
