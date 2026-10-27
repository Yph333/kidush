// Load the slide list first, as the app does (the track's slides import components that import it).
import '../chapters';
import { describe, expect, it } from 'vitest';
import KH from '../content/rambamKH.json';
import { GUIDE_MAX_STEPS, GUIDE_MIN_STEPS } from '../content/guides/types';
import { RAMBAM_PATHS } from '../content/paths';
import { RAMBAM_CHAPTERS, RAMBAM_GUIDES } from '.';
import { chapterHeb, halachaText, markRanges, toDisplay } from './text';

describe('Rambam text', () => {
  it('has all 19 chapters with the halacha counts of the Vilna text', () => {
    expect(KH.chapters.map(c => c.halachot.length)).toEqual([8, 10, 19, 17, 13, 15, 8, 10, 8, 7, 17, 2, 11, 6, 9, 19, 24, 16, 16]);
  });
  it('display form uses geresh and gershayim', () => {
    expect(toDisplay(`י"ג ג'`)).toBe('י״ג ג׳');
    expect(halachaText(14, 'א')).toContain('סימנם י״ג יל״ה');
  });
  it('a missing halacha fails loudly', () => expect(() => halachaText(14, 'ט')).toThrow());
  it('chapter numerals', () => {
    expect(chapterHeb(14)).toBe('י״ד');
    expect(chapterHeb(6)).toBe('ו׳');
    expect(chapterHeb(15)).toBe('ט״ו');
  });
});

describe('markRanges', () => {
  it('finds every occurrence and merges overlaps', () => {
    expect(markRanges('אבג אבג', ['אב'])).toEqual([[0, 2], [4, 6]]);
    expect(markRanges('אבגד', ['אבג', 'בגד'])).toEqual([[0, 4]]);
    expect(markRanges('אבגד', ['זה לא כאן', ''])).toEqual([]);
  });
});

describe('Rambam track', () => {
  it('RAMBAM_PATHS lists the track in order', () => {
    expect(RAMBAM_CHAPTERS.flatMap(ch => ch.slides.map(s => `${ch.id}/${s.id}`))).toEqual([...RAMBAM_PATHS]);
  });
  it('chapter ids and slides', () => {
    for (const ch of RAMBAM_CHAPTERS) {
      expect(ch.id).toBe(`rambam/${ch.num}`);
      expect(ch.track).toBe('rambam');
    }
  });
  for (const { ch, h, guide } of RAMBAM_GUIDES) {
    describe(`${ch}:${h}`, () => {
      const text = halachaText(ch, h);
      it(`has ${GUIDE_MIN_STEPS}–${GUIDE_MAX_STEPS} steps`, () => {
        expect(guide.steps.length).toBeGreaterThanOrEqual(GUIDE_MIN_STEPS);
        expect(guide.steps.length).toBeLessThanOrEqual(GUIDE_MAX_STEPS);
      });
      it('every marked phrase is in the text', () => {
        for (const s of guide.steps) for (const m of s.mark ?? []) expect(text, `${s.title}: "${m}"`).toContain(m);
      });
    });
  }
});
