import { useEffect, useMemo } from 'react';
import { dayOfCivil, hebDate } from '../../engines/calendar';
import { CITIES, type City } from '../../engines/astro';
import { type MonthModel, monthModel } from '../../lib/month';
import { type AstroState, setAstro, useStore } from '../../state/store';

/** Month shown by default: the current month if the demo year is this year, otherwise Tishrei. */
export function defaultMonth(demo: number, now = new Date()): number {
  const h = hebDate(dayOfCivil(now.getFullYear(), now.getMonth(), now.getDate()));
  return h.y === demo ? h.mi : 0;
}

export interface AstroView {
  M: MonthModel;
  /** current instant, clamped to the month's range */
  t: number;
  a: AstroState;
  c: City;
  demo: number;
}

/** The shared sky timeline, kept in step with the demo year and the global place. */
export function useAstro(): AstroView {
  const demo = useStore(s => s.demoYear);
  const c = CITIES[useStore(s => s.city)] ?? CITIES[0];
  const a = useStore(s => s.astro);
  const synced = a.base === demo;

  useEffect(() => {
    if (!synced) setAstro({ base: demo, y: demo, mi: defaultMonth(demo), t: null, playing: false, dSel: null });
  }, [synced, demo]);

  const y = synced ? a.y : demo;
  const mi = synced ? a.mi : defaultMonth(demo);
  const M = useMemo(() => monthModel(y, mi, c), [y, mi, c]);
  const t = Math.max(M.A, Math.min(M.B, a.t ?? M.conj));
  return { M, t, a, c, demo };
}
