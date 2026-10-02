import { describe, expect, it } from 'vitest';
import vectors from '../../tests/vectors.json';
import {
  ALLOWED_LENGTHS, BAHRAD, EX, P_MONTH, currentYear, dayOfCivil, dechiyotDetail, fmtDur, fmtMolad, gDate, gq, hebDate, isLeap,
  keviut, moladByExcess, moladTotal, monthStart, monthsBefore, monthsBeforeSteps, monthsOf, nextBirkatHachama, parseYear,
  pesachDay, rh, tekufotShmuel, weekParts, yearHeb, yearLen,
} from './calendar';
import { rambamD0 } from './rambam';

const V = vectors.calendar;
const iso = (d: Date) => d.toISOString().slice(0, 10);

describe('fixed calendar — year vectors', () => {
  for (const v of V.years) {
    describe(`${v.year}`, () => {
      const r = rh(v.year);
      it('hebrew year', () => expect(yearHeb(v.year)).toBe(v.heb));
      it('rosh hashana date', () => expect(iso(gDate(r.day))).toBe(v.roshHashana));
      it('rosh hashana weekday', () => expect(r.day % 7).toBe(v.weekday));
      it('molad tishrei', () => expect(fmtMolad(r.t)).toBe(v.moladTishrei));
      it('dechiyot', () => expect(r.rules).toEqual(v.dechiyot));
      it('length', () => expect(yearLen(v.year)).toBe(v.length));
      it('keviut', () => expect(keviut(v.year)).toBe(v.keviut));
      it('leap', () => expect(isLeap(v.year)).toBe(v.leap));
      it('pesach', () => expect(iso(gDate(pesachDay(v.year)))).toBe(v.pesach));
    });
  }
});

describe('fixed calendar — constants', () => {
  it('excesses', () => {
    expect(fmtDur(EX.month)).toBe(V.excess.month);
    expect(fmtDur(EX.pashut)).toBe(V.excess.pashut);
    expect(fmtDur(EX.meubar)).toBe(V.excess.meubar);
    expect(fmtDur(EX.cycle)).toBe(V.excess.cycle);
  });
  it('molad Bahrad', () => expect(fmtMolad(BAHRAD)).toBe(V.bahrad));
  it('Bahrad + one common year = ויה״ד', () => {
    expect(fmtMolad(BAHRAD + 12 * P_MONTH)).toBe(V.vayehad);
    expect(fmtMolad(moladTotal(2))).toBe(V.vayehad);
  });
  it('month length in parts', () => expect(P_MONTH).toBe(V.monthParts));
});

describe('fixed calendar — invariants', () => {
  it(`exactly ${V.keviotCount} keviot and only allowed lengths over 5000–6500`, () => {
    const k = new Set<string>();
    for (let y = 5000; y <= 6500; y++) {
      expect(ALLOWED_LENGTHS).toContain(yearLen(y));
      k.add(keviut(y));
    }
    expect(k.size).toBe(V.keviotCount);
  });
  it('months sum to the year length', () => {
    for (const y of [5784, 5785, 5786, 5787]) {
      expect(monthsOf(y).reduce((s, m) => s + m[1], 0)).toBe(yearLen(y));
    }
  });
});

describe('gematria', () => {
  it('parts 1000–1079 render as תתר…', () => {
    expect(gq(1063)).toBe('תתרס״ג');
    expect(gq(1000)).toBe('תת״ר');
  });
  it('15 and 16', () => { expect(gq(15)).toBe('ט״ו'); expect(gq(16)).toBe('ט״ז'); });
  it('single letter gets geresh; zero', () => { expect(gq(5)).toBe('ה׳'); expect(gq(0)).toBe('0'); });
  it('parseYear', () => {
    expect(parseYear('5787')).toBe(5787);
    expect(parseYear('787')).toBe(5787);
    expect(parseYear('תשפ״ז')).toBe(5787);
    expect(parseYear('ה׳תשפ״ז')).toBe(5787);
    expect(parseYear('ד׳תתקל״ח')).toBe(4938);
    expect(parseYear('xyz')).toBeNaN();
  });
});

describe('dates', () => {
  it('Rambam epoch: 3 Nisan 4938, Thursday', () => {
    const d0 = rambamD0();
    const h = hebDate(d0);
    expect(`${h.d} ${h.name === 'ניסן' ? 'Nisan' : h.name} ${h.y}`).toBe(V.epochRambam.day);
    expect(d0 % 7).toBe(V.epochRambam.weekday);
    expect(iso(gDate(d0))).toBe(V.epochRambam.gregorianProleptic);
  });
  it('hebDate for 2026-10-02', () => {
    expect(hebDate(dayOfCivil(2026, 9, 2))).toEqual(vectors.astro.hebDate_2026_10_02);
  });
  it('monthStart(Tishrei) is Rosh Hashana', () => expect(monthStart(5787, 0)).toBe(rh(5787).day));
  it('currentYear', () => {
    expect(currentYear(new Date(2026, 9, 2))).toBe(5787);
    expect(currentYear(new Date(2026, 8, 11))).toBe(5786);
    expect(currentYear(new Date(2026, 8, 12))).toBe(5787);
  });
});

describe('tekufot (Shmuel) and the great cycle', () => {
  it('5769 opens a great cycle: tekufat Nisan at the start of Wednesday night', () => {
    const t = tekufotShmuel(5769);
    expect(t.year).toBe(1);
    expect(t.nisan).toBe(72);
    expect(nextBirkatHachama(5769)).toBe(5769);
    expect(gDate(pesachDay(5769)).getUTCFullYear()).toBe(2009);
  });
  it('next Birkat HaChama after 5769 is 5797', () => {
    expect(nextBirkatHachama(5770)).toBe(5797);
    expect(nextBirkatHachama(5787)).toBe(5797);
  });
  it('each year moves the tekufa by one day and six hours', () => {
    for (const y of [5770, 5787, 5796]) {
      expect((tekufotShmuel(y).nisan - tekufotShmuel(y - 1).nisan + 168) % 168).toBe(30);
    }
  });
  it('tekufot are 91 days 7½ hours apart (7½ hours on the week)', () => {
    const t = tekufotShmuel(5787);
    expect((t.tevet - t.tishrei + 168) % 168).toBe(7.5);
    expect((t.nisan - t.tevet + 168) % 168).toBe(7.5);
    expect((t.tammuz - t.nisan + 168) % 168).toBe(7.5);
  });
});

describe('teaching decompositions', () => {
  it('monthsBeforeSteps adds up to monthsBefore', () => {
    for (let y = 2; y <= 6000; y += 37) expect(monthsBeforeSteps(y).total).toBe(monthsBefore(y));
  });
  it('moladByExcess equals the direct molad for every month', () => {
    for (const y of [4938, 5600, 5784, 5785, 5787, 5800]) {
      monthsOf(y).forEach((_, mi) => {
        expect(moladByExcess(y, mi).molad).toBe(weekParts(moladTotal(y, mi)));
      });
    }
  });
  it('Tishrei 5787 by excess', () => expect(fmtMolad(moladByExcess(5787).molad)).toBe('ז׳ ב׳ תתרס״ג'));
});

describe('dechiyotDetail', () => {
  it('agrees with rh().rules for every year 5000–6500', () => {
    for (let y = 5000; y <= 6500; y++) {
      const d = dechiyotDetail(y), rules = rh(y).rules;
      expect(d.zaken).toBe(rules.includes('zaken'));
      expect(d.gatrad.applies).toBe(rules.includes('gatrad'));
      expect(d.betu.applies).toBe(rules.includes('betu'));
      expect(d.adu.applies).toBe(rules.includes('adu'));
    }
  });
  it('vector years', () => {
    for (const v of V.years) {
      const d = dechiyotDetail(v.year);
      const got = [d.zaken && 'zaken', d.gatrad.applies && 'gatrad', d.betu.applies && 'betu', d.adu.applies && 'adu'].filter(Boolean);
      expect(got).toEqual(v.dechiyot);
    }
  });
});
