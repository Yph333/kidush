// Global store: a tiny external store consumed with useSyncExternalStore.
// Persistence: URL (y, city, mode + slide path) wins over localStorage on load.

import { useSyncExternalStore } from 'react';
import { currentYear } from '../engines/calendar';

export type Mode = 'present' | 'explore';

/** Shared timeline for the sky slides (chapters 3 and 7). */
export interface AstroState {
  /** demo year this timeline was set up for (null = not yet) */
  base: number | null;
  y: number;
  mi: number;
  /** current instant, ms */
  t: number | null;
  /** ms of sky time per second of real time */
  speed: number;
  playing: boolean;
  /** selected evening in the visibility table */
  dSel: number | null;
}

/** A stored answer to a GuessGate. value null = "I don't know" or the teacher revealed it. */
export interface GuessRecord {
  value: string | number | boolean | null;
  how: 'guess' | 'idk' | 'skip';
  correct: boolean | null;
}

export interface State {
  demoYear: number;
  city: number;
  mode: Mode;
  /** current slide path, "chapter/slide" */
  slide: string;
  /** slides seen, per demo year */
  seen: Record<number, string[]>;
  /** chapter 2: the civil date the zmanim slides look at (YYYY-MM-DD) */
  zDate: string;
  /** chapter 2: chosen opinion per zman group (ids from content/zmanimOpinions.ts) */
  zPick: Record<string, string>;
  /** GuessGate answers, keyed "<gate>@<year>" */
  guesses: Record<string, GuessRecord>;
  notesOpen: boolean;
  mapOpen: boolean;
  glossaryOpen: string | null;
  astro: AstroState;
}

const LS_KEY = 'luach.v1';
const MIN_YEAR = 2, MAX_YEAR = 9998;
export const clampYear = (y: number): number => Math.max(MIN_YEAR, Math.min(MAX_YEAR, Math.round(y)));

type Persisted = Pick<State, 'demoYear' | 'city' | 'mode' | 'seen' | 'guesses' | 'zPick'>;

function readLS(): Partial<Persisted> {
  try {
    const raw = localStorage.getItem(LS_KEY);
    return raw ? (JSON.parse(raw) as Partial<Persisted>) : {};
  } catch { return {}; }
}

function writeLS(s: State): void {
  try {
    const p: Persisted = { demoYear: s.demoYear, city: s.city, mode: s.mode, seen: s.seen, guesses: s.guesses, zPick: s.zPick };
    localStorage.setItem(LS_KEY, JSON.stringify(p));
  } catch { /* storage unavailable: state still works for this session */ }
}

export interface HashState { slide: string; y?: number; city?: number; mode?: Mode }

export function parseHash(hash: string): HashState {
  const h = hash.replace(/^#\/?/, '');
  const [path, qs = ''] = h.split('?');
  const q = new URLSearchParams(qs);
  const out: HashState = { slide: path };
  const y = Number(q.get('y'));
  if (q.has('y') && Number.isFinite(y) && y >= MIN_YEAR && y <= MAX_YEAR) out.y = Math.round(y);
  const c = Number(q.get('city'));
  if (q.has('city') && Number.isInteger(c) && c >= 0) out.city = c;
  const m = q.get('mode');
  if (m === 'present' || m === 'explore') out.mode = m;
  return out;
}

export function buildHash(s: Pick<State, 'slide' | 'demoYear' | 'city' | 'mode'>): string {
  const q = new URLSearchParams({ y: String(s.demoYear), city: String(s.city), mode: s.mode });
  return `#/${s.slide}?${q.toString()}`;
}

function initial(): State {
  const ls = readLS();
  const hs = typeof location !== 'undefined' ? parseHash(location.hash) : { slide: '' };
  const now = new Date();
  const demoYear = hs.y ?? (ls.demoYear ? clampYear(ls.demoYear) : currentYear(now));
  return {
    demoYear,
    city: hs.city ?? ls.city ?? 0,
    mode: hs.mode ?? ls.mode ?? 'explore',
    slide: hs.slide,
    seen: ls.seen && typeof ls.seen === 'object' ? ls.seen : {},
    guesses: ls.guesses && typeof ls.guesses === 'object' ? ls.guesses : {},
    zDate: `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, '0')}-${String(now.getDate()).padStart(2, '0')}`,
    zPick: ls.zPick && typeof ls.zPick === 'object' ? ls.zPick : {},
    notesOpen: false,
    mapOpen: false,
    glossaryOpen: null,
    astro: { base: null, y: demoYear, mi: 0, t: null, speed: 6 * 3600000, playing: false, dSel: null },
  };
}

let state: State = initial();
const listeners = new Set<() => void>();

export function getState(): State { return state; }

export function setState(patch: Partial<State> | ((s: State) => Partial<State>)): void {
  const p = typeof patch === 'function' ? patch(state) : patch;
  state = { ...state, ...p };
  writeLS(state);
  listeners.forEach(l => l());
}

export function setAstro(patch: Partial<AstroState> | ((a: AstroState) => Partial<AstroState>)): void {
  setState(s => ({ astro: { ...s.astro, ...(typeof patch === 'function' ? patch(s.astro) : patch) } }));
}

export function subscribe(l: () => void): () => void {
  listeners.add(l);
  return () => listeners.delete(l);
}

export function useStore<T>(sel: (s: State) => T): T {
  return useSyncExternalStore(subscribe, () => sel(state), () => sel(state));
}

/** Mark a slide as seen for the current demo year. */
export function markSeen(path: string): void {
  const cur = state.seen[state.demoYear] ?? [];
  if (cur.includes(path)) return;
  setState(s => ({ seen: { ...s.seen, [s.demoYear]: [...cur, path] } }));
}

export function setGuess(key: string, rec: GuessRecord | null): void {
  setState(s => {
    const g = { ...s.guesses };
    if (rec) g[key] = rec; else delete g[key];
    return { guesses: g };
  });
}

/** Test hook: reset to a known state. */
export function __resetStore(s: Partial<State> = {}): void {
  state = { ...initial(), ...s };
  listeners.forEach(l => l());
}
