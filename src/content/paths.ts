// Every slide path in the site, in order. Content files are keyed by these.
export const SLIDE_PATHS = [
  'yesodot/petiha',
  'yesodot/yehidot',
  'yom/bekarov',
  'chodesh/levana',
  'chodesh/maslul',
  'chodesh/shamayim',
  'shana/katan',
  'shana/gadol',
  'luach/bahrad',
  'luach/odfim',
  'luach/sugim',
  'luach/keviut',
  'dechiyot/adu',
  'dechiyot/zaken',
  'dechiyot/gatrad',
  'dechiyot/betu',
  'reiya/memutza',
  'reiya/reiya',
  'kelim/machshevon',
] as const;

export type SlidePath = (typeof SLIDE_PATHS)[number];
