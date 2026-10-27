// The Rambam's text (Hilchot Kiddush HaChodesh, Vilna printing via Wikisource; see tools/sources/fetch-rambam.mjs).
// Display form: ASCII quotes become Hebrew geresh / gershayim. Guide steps mark phrases of this form.

import KH from '../content/rambamKH.json';

export const HEB_NUM = ['', 'א', 'ב', 'ג', 'ד', 'ה', 'ו', 'ז', 'ח', 'ט', 'י', 'יא', 'יב', 'יג', 'יד', 'טו', 'טז', 'יז', 'יח', 'יט'] as const;

/** Chapter number as written: 14 → י״ד. */
export const chapterHeb = (n: number): string => {
  const h = HEB_NUM[n];
  return h.length > 1 ? `${h[0]}״${h[1]}` : `${h}׳`;
};

export const toDisplay = (t: string): string => t.replace(/"/g, '״').replace(/'/g, '׳');

/** Text of one halacha, display form. Throws if missing, so a typo fails loudly in tests. */
export function halachaText(ch: number, h: string): string {
  const c = KH.chapters.find(x => x.n === ch);
  const found = c?.halachot.find(x => x.h === h);
  if (!found) throw new Error(`Rambam KH ${ch}:${h} not in rambamKH.json`);
  return toDisplay(found.text);
}

/** Wikisource page of a chapter. */
export const chapterUrl = (ch: number): string | undefined => KH.chapters.find(x => x.n === ch)?.url;

/** [start, end) ranges of every occurrence of every phrase, merged. */
export function markRanges(text: string, phrases: readonly string[]): [number, number][] {
  const r: [number, number][] = [];
  for (const p of phrases) {
    if (!p) continue;
    for (let i = text.indexOf(p); i >= 0; i = text.indexOf(p, i + p.length)) r.push([i, i + p.length]);
  }
  r.sort((a, b) => a[0] - b[0]);
  const out: [number, number][] = [];
  for (const x of r) {
    const last = out[out.length - 1];
    if (last && x[0] <= last[1]) last[1] = Math.max(last[1], x[1]); else out.push([...x]);
  }
  return out;
}
