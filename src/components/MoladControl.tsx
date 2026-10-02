// Enter a molad as weekday / hours / parts.

import type { ReactNode } from 'react';
import { DAY_NAME, P_DAY, P_HOUR, P_WEEK } from '../engines/calendar';

export interface MoladValue { d: number; h: number; p: number }

/** Absolute parts for a hand-entered molad (placed far from the epoch so day arithmetic stays positive). */
export const moladParts = (m: MoladValue): number => 200 * P_WEEK + m.d * P_DAY + m.h * P_HOUR + m.p;

const clamp = (v: number, lo: number, hi: number) => Math.max(lo, Math.min(hi, Number.isFinite(v) ? Math.round(v) : lo));

export function MoladControl({ value, onChange, extras }: {
  value: MoladValue; onChange: (m: MoladValue) => void; extras?: ReactNode;
}) {
  return (
    <div className="ctl">
      <div className="fld">יום
        <div className="seg" role="group" aria-label="יום המולד">
          {'אבגדהוז'.split('').map((l, i) => (
            <button key={i} type="button" aria-label={DAY_NAME[i]} aria-pressed={value.d === i}
              onClick={() => onChange({ ...value, d: i })}>{l}</button>
          ))}
        </div>
      </div>
      <label className="fld">שעות
        <input type="number" min={0} max={23} value={value.h}
          onChange={e => onChange({ ...value, h: clamp(+e.target.value, 0, 23) })} />
      </label>
      <label className="fld">חלקים
        <input type="number" min={0} max={1079} value={value.p}
          onChange={e => onChange({ ...value, p: clamp(+e.target.value, 0, 1079) })} />
      </label>
      {extras}
    </div>
  );
}
