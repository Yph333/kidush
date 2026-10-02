import { describe, expect, it } from 'vitest';
import vectors from '../../tests/vectors.json';
import { monthStart, monthsOf } from './calendar';
import { RB, type RambamResult, moonEquation, rambam, rambamD0, rMotion } from './rambam';

const V = vectors.rambamExample;
// Night of Friday, 2 Iyar 4938
const iyar = monthsOf(4938).findIndex(m => m[0] === 'אייר');
const dayIdx = monthStart(4938, iyar) + 1;
const S = rambam(dayIdx);

describe('Rambam worked example (exact)', () => {
  it('evening is Friday, N = 29', () => {
    expect(dayIdx % 7).toBe(5);
    expect(S.N).toBe(V.N);
    expect(dayIdx - rambamD0()).toBe(29);
  });
  const cases: [string, keyof RambamResult, number | boolean][] = [
    ['mean sun', 'sunMean', V.sunMean_sec],
    ['sun apogee', 'apo', V.apogee_sec],
    ['sun course (rounded)', 'sunMaslulR', V.sunMaslulRounded],
    ['sun equation', 'sunEq', V.sunEq_min],
    ['true sun', 'sunTrue', V.sunTrue_min],
    ['mean moon', 'moonMean', V.moonMean_sec],
    ['mean moon + season', 'moonAdj', V.moonAdj_sec],
    ['mean course', 'crs', V.course_sec],
    ['doubled distance', 'dbl', V.doubledDistance_sec],
    ['doubled-distance addition', 'dblAdd', V.dblAdd_deg],
    ['corrected course (rounded)', 'crsR', V.correctedCourseRounded],
    ['moon equation', 'moonEq', V.moonEq_min],
    ['true moon', 'moonTrue', V.moonTrue_min],
    ['mean head', 'headMean', V.headMean_sec],
    ['head', 'head', V.head_min],
    ['latitude course (rounded)', 'latCourseR', V.latCourseRounded],
    ['first latitude', 'lat1', V.lat1_min],
    ['north', 'north', V.north],
    ['first longitude', 'long1', V.long1_min],
    ['second longitude', 'long2', V.long2_min],
    ['second latitude', 'lat2', V.lat2_min],
    ['circle of the moon', 'circle', V.circle_min],
    ['third longitude', 'long3', V.long3_min],
    ['fourth longitude', 'long4', V.long4_min],
    ['altitude-of-country portion', 'geo', V.geo_min],
    ['arc of sighting', 'arc', V.arc_min],
    ['visible', 'visible', V.visible],
  ];
  for (const [name, key, want] of cases) it(name, () => expect(S[key]).toBe(want));
  it('verdict comes from the limits of sighting', () => {
    expect(S.reason).toEqual({ kind: 'limits', arc: 671, need: 11, long1: 687 });
  });
});

describe('mean motion', () => {
  it('29 days is a single block', () => {
    expect(rMotion(RB.sun, 29).parts).toEqual([[29, 1]]);
  });
  it('greedy decomposition', () => {
    expect(rMotion(RB.sun, 11397).parts).toEqual([[10000, 1], [1000, 1], [354, 1], [29, 1], [10, 1], [1, 4]]);
  });
});

describe('moonEquation (teaching helper)', () => {
  it('matches rambam() for the worked example: course 108 → 5° 1′, subtract', () => {
    const e = moonEquation(S.crsR);
    expect(e.eq).toBe(S.moonEq);
    expect(e.sign).toBe(S.moonSignOp);
    expect(e.row).toBe(10);
  });
  it('matches rambam() over many evenings', () => {
    for (let k = 0; k < 400; k++) {
      const r = rambam(dayIdx + k * 7);
      const e = moonEquation(r.crsR);
      expect(e.eq).toBe(r.moonEq);
      expect(e.sign).toBe(r.moonSignOp);
    }
  });
  it('is symmetric around 180°', () => {
    for (const c of [10, 95, 108, 170]) expect(moonEquation(360 - c).eq).toBe(moonEquation(c).eq);
  });
});
