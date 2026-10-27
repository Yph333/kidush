// Degrees, minutes (חלקים) and seconds, added and subtracted the Rambam's way (Kiddush HaChodesh 11:10–12):
// kind with kind, sixty seconds make a minute, sixty minutes a degree, whole circles (360°) dropped; to subtract a
// larger number, add 360° first, and borrow from the next unit up. Every step is returned for the slides.

export interface Dms { d: number; m: number; s: number }

export const toSec = (x: Dms): number => x.d * 3600 + x.m * 60 + x.s;
export function fromSec(sec: number): Dms {
  const a = Math.round(sec);
  return { d: Math.floor(a / 3600), m: Math.floor((a % 3600) / 60), s: a % 60 };
}

export interface DmsAdd {
  a: Dms; b: Dms;
  sRaw: number; sCarry: number; s: number;
  mRaw: number; mCarry: number; m: number;
  dRaw: number; circles: number; d: number;
}

export function addDms(a: Dms, b: Dms): DmsAdd {
  const sRaw = a.s + b.s, sCarry = Math.floor(sRaw / 60), s = sRaw % 60;
  const mRaw = a.m + b.m + sCarry, mCarry = Math.floor(mRaw / 60), m = mRaw % 60;
  const dRaw = a.d + b.d + mCarry, circles = Math.floor(dRaw / 360), d = dRaw % 360;
  return { a, b, sRaw, sCarry, s, mRaw, mCarry, m, dRaw, circles, d };
}

export interface DmsSub {
  /** a − b */
  a: Dms; b: Dms;
  /** 360° added to a because b is larger (11:11) */
  added360: boolean;
  /** seconds: borrowed a minute? then a.s + 60 − b.s */
  sBorrow: boolean; s: number;
  mBorrow: boolean; m: number;
  d: number;
}

export function subDms(a: Dms, b: Dms): DmsSub {
  const added360 = toSec(b) > toSec(a);
  let ad = a.d + (added360 ? 360 : 0), am = a.m;
  const sBorrow = a.s < b.s, s = (sBorrow ? a.s + 60 : a.s) - b.s;
  if (sBorrow) am -= 1;
  const mBorrow = am < b.m;
  const m = (mBorrow ? am + 60 : am) - b.m;
  if (mBorrow) ad -= 1;
  return { a, b, added360, sBorrow, s, mBorrow, m, d: ad - b.d };
}

/** A longitude (deg from the start of Aries) as sign index and position within the sign (11:8–9). */
export function inSign(sec: number): { sign: number; within: Dms } {
  const n = ((Math.round(sec) % 1296000) + 1296000) % 1296000, sign = Math.floor(n / 108000);
  return { sign, within: fromSec(n - sign * 108000) };
}
