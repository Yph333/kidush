// Hash routing: #/<chapter>/<slide>?y=<demo year>&city=<i>&mode=<present|explore>

import { SLIDES, slideByPath, trackSlides } from '../chapters';
import { type State, buildHash, getState, parseHash, setState, subscribe } from './store';

export function currentIndex(): number {
  return slideByPath(getState().slide)?.index ?? 0;
}

export function go(pathOrIndex: string | number): void {
  const i = typeof pathOrIndex === 'number'
    ? Math.max(0, Math.min(SLIDES.length - 1, pathOrIndex))
    : slideByPath(pathOrIndex)?.index ?? 0;
  const slide = SLIDES[i].path;
  if (slide === getState().slide) return;
  setState({ slide, mapOpen: false, glossaryOpen: null });
  history.pushState(null, '', buildHash(getState()));
}

/** Step inside the current track (topics or Rambam). */
function step(d: 1 | -1): void {
  const cur = slideByPath(getState().slide) ?? SLIDES[0];
  const list = trackSlides(cur.track), k = list.indexOf(cur) + d;
  if (k >= 0 && k < list.length) go(list[k].path);
}
export const next = () => step(1);
export const prev = () => step(-1);

/** Keep the URL in step with y / city / mode (replaceState), and follow back/forward. */
export function startUrlSync(): () => void {
  if (!slideByPath(getState().slide)) setState({ slide: SLIDES[0].path });
  let last = buildHash(getState());
  history.replaceState(null, '', last);

  const onPop = () => {
    const h = parseHash(location.hash);
    const patch: Partial<State> = { slide: slideByPath(h.slide) ? h.slide : SLIDES[0].path };
    if (h.y) patch.demoYear = h.y;
    if (h.city != null) patch.city = h.city;
    if (h.mode) patch.mode = h.mode;
    last = location.hash;
    setState(patch);
  };
  window.addEventListener('popstate', onPop);
  window.addEventListener('hashchange', onPop);

  const unsub = subscribe(() => {
    const h = buildHash(getState());
    if (h !== last) { history.replaceState(null, '', h); last = h; }
  });
  return () => {
    window.removeEventListener('popstate', onPop);
    window.removeEventListener('hashchange', onPop);
    unsub();
  };
}
