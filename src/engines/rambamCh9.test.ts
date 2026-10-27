// Hilchot Kiddush HaChodesh ch. 9–10: the tekufot of Shmuel and of Rav Adda, the Rambam's ways.

import { describe, expect, it } from 'vitest';
import {
  CYCLE_EXCESS, P_DAY, P_HOUR, P_MONTH, RAV_ADDA_YEAR, SHMUEL_YEAR, TEKUFA_LEAD, YEAR_EXCESS,
  hebDate, monthStart, tekufaDay, tekufaNisanRavAdda, tekufaNisanShmuel, tekufaSteps, tekufotShmuel,
} from './calendar';

const dhp = (d: number, h: number, p: number) => d * P_DAY + h * P_HOUR + p;

describe('ch. 9: Shmuel', () => {
  it('9:2: 19 years leave 1h 485p; a tekufa is 91d 7½h', () => {
    expect(CYCLE_EXCESS.shmuel).toBe(dhp(0, 1, 485));
    expect(SHMUEL_YEAR / 4).toBe(dhp(91, 7, 540));
  });
  it('9:3–4: year excess 10d 21h 204p; lead 7d 9h 642p', () => {
    expect(YEAR_EXCESS.shmuel).toBe(dhp(10, 21, 204));
    expect(TEKUFA_LEAD.shmuel).toBe(dhp(7, 9, 642));
  });
  it('9:4: the way by cycles agrees with the absolute tekufa for 6000 years', () => {
    for (let y = 1; y <= 6000; y++) {
      const s = tekufaSteps(y, 'shmuel');
      expect(s.tekufa).toBe(tekufaNisanShmuel(y));
      expect(s.rem).toBeLessThan(P_MONTH);
    }
  });
  it('9:4: Nisan only at 0, 6, 12 or 18 hours; Tammuz 1½/7½; Tishrei 3/9; Tevet 4½/10½', () => {
    for (let y = 1; y <= 28; y++) {
      const T = tekufotShmuel(y);
      expect([0, 6]).toContain(T.nisan % 12);
      expect([1.5, 7.5]).toContain(T.tammuz % 12);
      expect([3, 9]).toContain(T.tishrei % 12);
      expect([4.5, 10.5]).toContain(T.tevet % 12);
    }
    expect(tekufotShmuel(1).nisan).toBe(72);   // the start of Wednesday night ("מוסיפין שלשה")
  });
  it('9:5: 4930: Nisan Thursday night 6h; Tammuz Thu 1½ (day); Tishrei Thu 9h; Tevet Fri night 4½; next Nisan Fri start of day', () => {
    const T = tekufotShmuel(4930);
    expect(T.nisan).toBe(4 * 24 + 6);
    expect(T.nisan + 7.5).toBe(4 * 24 + 13.5);
    expect(T.nisan + 15).toBe(4 * 24 + 21);
    expect(T.nisan + 22.5).toBe(5 * 24 + 4.5);
    expect(T.nisan + 30).toBe(5 * 24 + 12);
  });
  it('9:7: 4930, ninth year of cycle 260: 88 + 7 = 95, 5 left, Monday → add 3 → 8 Nisan, and that is the true day', () => {
    const d = tekufaDay(4930);
    expect(Math.floor((4930 - 1) / 19) + 1).toBe(260);
    expect(d).toMatchObject({ years: 8, days: 95, rem: 5, from: 'ניסן', startWd: 4, landWd: 1, tekWd: 4, added: 3, day: 8 });
    const t = hebDate(Math.floor(tekufaNisanShmuel(4930) / P_DAY));
    expect([t.name, t.d]).toEqual(['ניסן', 8]);
    expect(monthStart(4930, 6) % 7).toBe(4);
  });
  it('9:6–8: in his era, common years: the count gives the true day; four days added is rare', () => {
    let four = 0, n = 0;
    for (let y = 4850; y <= 5050; y++) {
      const t = tekufaDay(y);
      if (t.added > 3) four++;
      expect(t.added).toBeLessThanOrEqual(4);
      if (t.from !== 'ניסן') continue;
      n++;
      expect([t.actual.name, t.actual.d]).toEqual(['ניסן', t.day]);
    }
    expect(n).toBeGreaterThan(100);
    expect(four / 201).toBeLessThan(0.1);
  });
  it('9:6: in a leap year, the count from Adar II lands on the right weekday, four weeks before the tekufa', () => {
    // Flagged for the content owner: read literally, "מראש חדש אדר שני" gives a day of Adar II;
    // the tekufa itself is 28 days later (in Nisan). Counting from Nisan gives it directly.
    for (const y of [4900, 4908, 4916, 4927, 4935, 4946, 4957]) {
      const t = tekufaDay(y);
      expect(t.from).toBe('אדר ב׳');
      expect(t.actual).toEqual({ name: 'ניסן', d: t.day - 1 });
    }
  });
});

describe('ch. 10: Rav Adda', () => {
  it('10:1: year 365d 5h 997p 48r; excess 10d 21h 121p 48r; 19 years exactly 235 months', () => {
    expect(RAV_ADDA_YEAR).toBeCloseTo(dhp(365, 5, 997) + 48 / 76, 9);
    expect(YEAR_EXCESS.ravAdda).toBeCloseTo(dhp(10, 21, 121) + 48 / 76, 9);
    expect(CYCLE_EXCESS.ravAdda).toBeCloseTo(0, 6);
  });
  it('10:2: a tekufa is 91d 7h 519p 31r', () => {
    expect(RAV_ADDA_YEAR / 4).toBeCloseTo(dhp(91, 7, 519) + 31 / 76, 9);
  });
  it('10:3: every first year of a cycle, 9h 642p before molad Nisan', () => {
    for (const y of [1, 20, 5701, 5777]) if ((y - 1) % 19 === 0) expect(tekufaSteps(y, 'ravAdda').less).toBeCloseTo(-TEKUFA_LEAD.ravAdda, 6);
  });
  it('10:5: the way by years agrees with the absolute tekufa', () => {
    for (let y = 1; y <= 6000; y++) {
      const d = tekufaSteps(y, 'ravAdda').tekufa - tekufaNisanRavAdda(y);
      expect(Math.abs(d)).toBeLessThan(1e-4);
    }
  });
});
