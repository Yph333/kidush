// Guided explanations: a short series of steps per slide, for a learner working alone.
// Each step may name a `focus`: the slide reads it to highlight part of its visual or load an example.

import type { ReactNode } from 'react';

export interface GuideStep<F extends string = string> {
  title: string;
  body: ReactNode;
  focus?: F;
}

export interface GuideDef<F extends string = string> {
  /** not yet approved by the content owner: shown with a "draft" tag */
  draft: boolean;
  steps: GuideStep<F>[];
}

export const GUIDE_MIN_STEPS = 4;
export const GUIDE_MAX_STEPS = 8;
