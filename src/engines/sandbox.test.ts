import { describe, expect, it } from 'vitest';
import { ALLOWED_LENGTHS, pesachDay, rh } from './calendar';
import { runSandbox } from './sandbox';

const FROM = 5300, N = 1000;

describe('sandbox with every dechiya on = the real calendar', () => {
  const S = runSandbox(FROM, N, {});
  it('matches rh() for every year', () => {
    S.rhDays.forEach((d, i) => expect(d).toBe(rh(FROM + i).day));
  });
  it('no forbidden lengths and no anomalies', () => {
    expect(S.forbidden).toEqual([]);
    for (const len of S.lengths.keys()) expect(ALLOWED_LENGTHS).toContain(len);
    expect(S.ykNextToShabbat.count).toBe(0);
    expect(S.hrOnShabbat.count).toBe(0);
    expect(S.pesachBDU.count).toBe(0);
  });
  it('Rosh Hashana never on Sunday, Wednesday or Friday', () => {
    expect(S.rhWeekday[0].count + S.rhWeekday[3].count + S.rhWeekday[5].count).toBe(0);
  });
  it('counts add up', () => {
    expect([...S.lengths.values()].reduce((s, t) => s + t.count, 0)).toBe(N);
    expect(S.rhWeekday.reduce((s, t) => s + t.count, 0)).toBe(N);
  });
  it('pesach rule agrees with pesachDay()', () => {
    for (let y = FROM; y < FROM + 50; y++) expect(rh(y + 1).day - 163).toBe(pesachDay(y));
  });
});

describe('switching dechiyot off', () => {
  it('without לא אד״ו: Yom Kippur next to Shabbat, Hoshana Rabba on Shabbat, Pesach on ב/ד/ו', () => {
    const S = runSandbox(FROM, N, { adu: true });
    expect(S.ykNextToShabbat.count).toBeGreaterThan(0);
    expect(S.hrOnShabbat.count).toBeGreaterThan(0);
    expect(S.pesachBDU.count).toBeGreaterThan(0);
    expect(S.applied.adu).toBe(0);
    const ex = S.ykNextToShabbat.example!;
    expect([5, 0]).toContain((S.rhDays[ex - FROM] + 9) % 7);
  });
  it('without גטר״ד: a common year of 356 days appears', () => {
    const S = runSandbox(FROM, N, { gatrad: true });
    expect(S.forbidden.map(f => f.len)).toContain(356);
  });
  it('without בטו תקפט: a leap year of 382 days appears', () => {
    const S = runSandbox(FROM, N, { betu: true });
    expect(S.forbidden.map(f => f.len)).toContain(382);
  });
  it('examples point at a year that really has that length', () => {
    const S = runSandbox(FROM, N, { gatrad: true, betu: true });
    for (const f of S.forbidden) {
      const i = f.example - FROM;
      expect(S.rhDays[i + 1] - S.rhDays[i]).toBe(f.len);
    }
  });
  it('1000 years (all four combinations) in well under a second', () => {
    const t0 = performance.now();
    for (const skip of [{}, { adu: true }, { zaken: true }, { gatrad: true, betu: true }]) runSandbox(FROM, N, skip);
    expect(performance.now() - t0).toBeLessThan(1000);
  });
});
