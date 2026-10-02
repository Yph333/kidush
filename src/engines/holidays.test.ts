import { describe, expect, it } from 'vitest';
import { gDate, pesachDay, rh } from './calendar';
import { holidays } from './holidays';

const iso = (day: number) => gDate(day).toISOString().slice(0, 10);
const find = (y: number, name: string, dia = false) => holidays(y, { diaspora: dia }).filter(h => h.name === name);
const one = (y: number, name: string, dia = false) => { const h = find(y, name, dia); expect(h, name).toHaveLength(1); return h[0]; };

describe('holiday dates (Israel)', () => {
  it('Rosh Hashana agrees with rh()', () => {
    for (const y of [5784, 5785, 5786, 5787]) expect(one(y, 'ראש השנה א׳').day).toBe(rh(y).day);
  });
  it('Pesach agrees with pesachDay()', () => {
    for (const y of [5784, 5785, 5786, 5787]) expect(one(y, 'פסח').day).toBe(pesachDay(y));
  });
  it('5785: Chanukah, Asara BeTevet, Purim', () => {
    expect(iso(one(5785, 'חנוכה, נר א׳').day)).toBe('2024-12-26');
    expect(iso(one(5785, 'עשרה בטבת').day)).toBe('2025-01-10');
    expect(iso(one(5785, 'פורים').day)).toBe('2025-03-14');
    expect(iso(one(5785, 'תענית אסתר').day)).toBe('2025-03-13');
  });
  it('Tzom Gedalia 5785 moves to Sunday; 17 Tammuz and 9 Av 5785 fall on Sunday anyway', () => {
    const g = one(5785, 'צום גדליה');
    expect(iso(g.day)).toBe('2024-10-06');
    expect(g.movedFrom).toBe(g.day - 1);
    expect(iso(one(5785, 'י״ז בתמוז').day)).toBe('2025-07-13');
    expect(iso(one(5785, 'תשעה באב').day)).toBe('2025-08-03');
    expect(one(5785, 'תשעה באב').movedFrom).toBeUndefined();
  });
  it('Tisha BeAv 5782 (Shabbat 6 Aug 2022) is postponed to Sunday', () => {
    const t = one(5782, 'תשעה באב');
    expect(iso(t.day)).toBe('2022-08-07');
    expect(iso(t.movedFrom!)).toBe('2022-08-06');
  });
  it('Taanit Esther 5784 (13 Adar II on Shabbat) moves back to Thursday', () => {
    const t = one(5784, 'תענית אסתר');
    expect(iso(t.day)).toBe('2024-03-21');
    expect(t.day % 7).toBe(4);
    expect(iso(one(5784, 'פורים').day)).toBe('2024-03-24');
    expect(find(5784, 'פורים קטן')).toHaveLength(1);
  });
  it('no fast ever lands on Shabbat; Yom Kippur may', () => {
    for (let y = 5700; y <= 5900; y++) {
      for (const h of holidays(y)) if (h.kind === 'fast') expect(h.day % 7, `${y} ${h.name}`).not.toBe(6);
    }
  });
  it('Rosh Chodesh: two days after a full month, Cheshvan always two', () => {
    for (const y of [5785, 5786, 5787]) expect(find(y, 'ראש חודש חשוון')).toHaveLength(2);
  });
  it('Chanukah is 8 consecutive days', () => {
    const c = holidays(5786).filter(h => h.kind === 'chanukah').map(h => h.day);
    expect(c).toHaveLength(8);
    c.forEach((d, i) => expect(d).toBe(c[0] + i));
  });
});

describe('diaspora', () => {
  it('adds second days', () => {
    expect(find(5786, 'פסח ב׳', true)).toHaveLength(1);
    expect(find(5786, 'שמחת תורה', true)).toHaveLength(1);
    expect(find(5786, 'שבועות ב׳')).toHaveLength(0);
    expect(one(5786, 'שמיני עצרת ושמחת תורה').day).toBe(one(5786, 'שמיני עצרת', true).day);
  });
});
