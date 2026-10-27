import { describe, expect, it } from 'vitest';
import { SLIDE_PATHS } from '../paths';
import { GUIDES } from '.';
import { GUIDE_MAX_STEPS, GUIDE_MIN_STEPS } from './types';

describe('guided explanations', () => {
  const entries = Object.entries(GUIDES);

  it('exist for the chapter 6 pilot', () => {
    expect(Object.keys(GUIDES)).toEqual(expect.arrayContaining(['dechiyot/lama', 'dechiyot/adu']));
  });

  for (const [path, g] of entries) {
    describe(path, () => {
      it('belongs to a real slide', () => expect(SLIDE_PATHS).toContain(path));
      it(`has ${GUIDE_MIN_STEPS}–${GUIDE_MAX_STEPS} steps`, () => {
        expect(g!.steps.length).toBeGreaterThanOrEqual(GUIDE_MIN_STEPS);
        expect(g!.steps.length).toBeLessThanOrEqual(GUIDE_MAX_STEPS);
      });
      it('every step has a title and a body', () => {
        for (const s of g!.steps) {
          expect(s.title.trim()).not.toBe('');
          expect(s.body).toBeTruthy();
        }
      });
      it('step titles are distinct', () => {
        const t = g!.steps.map(s => s.title);
        expect(new Set(t).size).toBe(t.length);
      });
    });
  }
});
