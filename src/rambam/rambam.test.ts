// Load the slide list first, as the app does (the track's slides import components that import it).
import '../chapters';
import { describe, expect, it } from 'vitest';
import { RB, rMotion, rambam, rambamD0, secOf } from '../engines/rambam';
import KH from '../content/rambamKH.json';
import { GUIDE_MAX_STEPS, HALACHA_MIN_STEPS } from '../content/guides/types';
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
      it(`has ${HALACHA_MIN_STEPS}–${GUIDE_MAX_STEPS} steps`, () => {
        expect(guide.steps.length).toBeGreaterThanOrEqual(HALACHA_MIN_STEPS);
        expect(guide.steps.length).toBeLessThanOrEqual(GUIDE_MAX_STEPS);
      });
      it('every marked phrase is in the text', () => {
        for (const s of guide.steps) for (const m of s.mark ?? []) expect(text, `${s.title}: "${m}"`).toContain(m);
      });
    });
  }
});

describe('chapter 14 numbers quoted in the guides', () => {
  const FULL = 1296000, norm = (s: number) => ((s % FULL) + FULL) % FULL;
  const dms = (d: number, m: number, s: number) => d * 3600 + m * 60 + s;
  it('halacha 4 = the engine: root + table motion, for many nights', () => {
    for (let N = 0; N < 40000; N += 997) {
      const R = rambam(rambamD0() + N);
      expect(norm(secOf(RB.root.moon) + rMotion(RB.moon, N).v)).toBe(R.moonMean);
      expect(norm(secOf(RB.root.crs) + rMotion(RB.crs, N).v)).toBe(R.crs);
    }
  });
  it("the Rambam's example (15:8), 29 days: mean moon 53° 21′ 39″, mean course 103° 21′ 46″", () => {
    const R = rambam(rambamD0() + 29);
    expect(R.moonMean).toBe(dms(53, 21, 39));
    expect(R.crs).toBe(dms(103, 21, 46));
    expect(R.moonAdj).toBe(dms(53, 36, 39));      // + 15′ (14:5), as written in 15:8
  });
  it('one day after the epoch: 14° 25′ 18″ in Taurus', () => expect(norm(secOf(RB.root.moon) + secOf(RB.moon[1]))).toBe(dms(30 + 14, 25, 18)));
  it('tables vs multiplying the daily motion', () => {
    const daily = (k: number, w: 'moon' | 'crs') => norm(k * secOf(RB[w][1]));
    expect(daily(10, 'moon')).toBe(secOf(RB.moon[10]));
    expect(secOf(RB.moon[100]) - daily(100, 'moon')).toBe(3);
    expect(secOf(RB.moon[10000]) - daily(10000, 'moon')).toBe(5 * 60);
    expect(daily(10, 'crs')).toBe(dms(130, 39, 0));                  // "בלא שניות"
    expect(secOf(RB.crs[100]) - daily(100, 'crs')).toBe(-7);
    expect(secOf(RB.crs[10000]) - daily(10000, 'crs')).toBe(-(11 * 60 + 40));
    expect(secOf(RB.moon[1]) - secOf(RB.crs[1])).toBe(6 * 60 + 41);
  });
  it('2357 days = 2 × 1000 + 354 + 3', () => expect(rMotion(RB.moon, 2357).parts).toEqual([[1000, 2], [354, 1], [1, 3]]));
});

describe('chapter 14:5–6', () => {
  it('seasonRow agrees with season() for every degree, and the words follow the table', async () => {
    const { seasonRow, SEASON_WORDS } = await import('./ch14/Seasons14');
    const { SEASON_TABLE, season } = await import('../engines/rambam');
    for (let d = 0; d < 360; d += 0.5) expect(SEASON_TABLE[seasonRow(d)][2], `${d}°`).toBe(season(d));
    expect(SEASON_WORDS).toHaveLength(SEASON_TABLE.length);
  });
  it("the example's sun, 35° 38′ 33″ (15:8), is in the +15 row", () => {
    const R = rambam(rambamD0() + 29);
    expect(R.sunMean).toBe(35 * 3600 + 38 * 60 + 33);
    expect(R.season).toBe(15);
  });
  it('Gemini to Leo is +30 (owner decision, see VERIFICATION 14:5)', async () => {
    const { season } = await import('../engines/rambam');
    expect(season(60)).toBe(30);
    expect(season(119.9)).toBe(30);
  });
});
