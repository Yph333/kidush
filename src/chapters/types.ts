import type { ComponentType } from 'react';

/** The site has two equal ways in: by topic, and the Rambam halacha by halacha. */
export type Track = 'topics' | 'rambam';

export interface SlideDef {
  /** unique within the chapter */
  id: string;
  title: string;
  Component: ComponentType;
}

export interface ChapterDef {
  /** for the Rambam track: "rambam/<chapter number>" */
  id: string;
  /** default: topics */
  track?: Track;
  num: number;
  title: string;
  slides: SlideDef[];
}

export interface FlatSlide extends SlideDef {
  /** "chapter/slide" */
  path: string;
  chapter: ChapterDef;
  track: Track;
  /** 0-based global index */
  index: number;
}
