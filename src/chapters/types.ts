import type { ComponentType } from 'react';

export interface SlideDef {
  /** unique within the chapter */
  id: string;
  title: string;
  Component: ComponentType;
}

export interface ChapterDef {
  id: string;
  num: number;
  title: string;
  slides: SlideDef[];
}

export interface FlatSlide extends SlideDef {
  /** "chapter/slide" */
  path: string;
  chapter: ChapterDef;
  /** 0-based global index */
  index: number;
}
