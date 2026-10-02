import { describe, expect, it } from 'vitest';
import vectors from '../../tests/vectors.json';
import { BAHRAD, monthStart, monthsOf, rh } from '../engines/calendar';
import { rambam } from '../engines/rambam';
import { civilText, dayWord, fmtDM, fmtPos, gStr, hrs } from './format';

const H = vectors.rambamExample.humanReadable;
const S = rambam(monthStart(4938, monthsOf(4938).findIndex(m => m[0] === 'אייר')) + 1);
const pos = (min: number) => { const p = fmtPos(min); return `${p.dm} ב${p.sign}`; };

describe('Rambam human-readable values', () => {
  it('true sun', () => expect(pos(S.sunTrue)).toBe(H.sunTrue));
  it('true moon', () => expect(pos(S.moonTrue)).toBe(H.moonTrue));
  it('head', () => expect(pos(S.head)).toBe(H.head));
  it('first latitude', () => expect(`${fmtDM(S.lat1)} ${S.north ? 'north' : 'south'}`).toBe(H.lat1));
  const dm: [keyof typeof H, number][] = [
    ['long1', S.long1], ['long2', S.long2], ['lat2', S.lat2], ['circle', S.circle],
    ['long3', S.long3], ['long4', S.long4], ['geo', S.geo], ['arc', S.arc],
  ];
  for (const [k, v] of dm) it(k, () => expect(fmtDM(v)).toBe(H[k]));
});

describe('civil formatting', () => {
  it('Bahrad is Sunday evening 23:11 and 6 parts', () => {
    expect(civilText(BAHRAD)).toEqual({ day: 'יום ראשון', time: '23:11', remText: '6 חלקים' });
  });
  it('dayWord', () => { expect(dayWord(6)).toBe('שבת'); expect(dayWord(-1)).toBe('שבת'); expect(dayWord(1)).toBe('יום שני'); });
  it('gStr', () => expect(gStr(rh(5784).day)).toBe('16.09.2023'));
  it('hrs', () => { expect(hrs(15 * 3600000 + 2 * 60000)).toBe('15:02'); expect(hrs(-90 * 60000)).toBe('−1:30'); });
});
