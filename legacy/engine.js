// ===== מנוע הלוח =====
const P_HOUR=1080, P_DAY=25920, P_WEEK=181440, P_MONTH=765433;
const BAHRAD = 1*P_DAY + 5*P_HOUR + 204;
const LEAP_POS=[3,6,8,11,14,17,19];
const EX = {
  month: P_MONTH % P_WEEK,
  pashut: (12*P_MONTH) % P_WEEK,
  meubar: (13*P_MONTH) % P_WEEK,
  cycle: (235*P_MONTH) % P_WEEK
};
const isLeap = y => ((7*y+1)%19) < 7;
const cyclePos = y => ((y-1)%19)+1;
function monthsBefore(y){ const c=Math.floor((y-1)/19), r=(y-1)%19; return 235*c + 12*r + Math.floor((7*r+1)/19); }
function splitParts(t){ // t>=0 total parts
  const d=Math.floor(t/P_DAY), r=t%P_DAY; return {d, h:Math.floor(r/P_HOUR), p:r%P_HOUR};
}
function moladTotal(y, mIdx=0){ return BAHRAD + (monthsBefore(y)+mIdx)*P_MONTH; }
// generic: RH from a molad (absolute parts), with flags
function rhFrom(t, curLeap, prevLeap, skip){
  skip = skip||{};
  let d=Math.floor(t/P_DAY); const p=t%P_DAY, wd=d%7; const rules=[];
  if(p>=18*P_HOUR && !skip.zaken){ d++; rules.push('zaken'); }
  else if(wd===2 && p>=9*P_HOUR+204 && !curLeap && !skip.gatrad){ d++; rules.push('gatrad'); }
  else if(wd===1 && p>=15*P_HOUR+589 && prevLeap && !skip.betu){ d++; rules.push('betu'); }
  if([0,3,5].includes(d%7) && !skip.adu){ d++; rules.push('adu'); }
  return {day:d, rules, moladDay:Math.floor(t/P_DAY), wd, p};
}
function rh(y){ const t=moladTotal(y); const r=rhFrom(t, isLeap(y), isLeap(y-1)); r.t=t; r.y=y; return r; }
function yearLen(y){ return rh(y+1).day - rh(y).day; }
function yearType(len){ const b=len%30; // 353/383 ->ח 354/384 ->כ 355/385 ->ש
  const k = {353:'ח',354:'כ',355:'ש',383:'ח',384:'כ',385:'ש'}[len]; return k; }
const TYPE_NAME={'ח':'חסרה','כ':'כסדרה','ש':'שלמה'};
function pesachDay(y){ return rh(y+1).day - 163; }
const DAY_LETTER=['א','ב','ג','ד','ה','ו','ז'];
const DAY_NAME=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function keviut(y){ const r=rh(y); return DAY_LETTER[r.day%7]+yearType(yearLen(y))+DAY_LETTER[pesachDay(y)%7]; }
function monthsOf(y){
  const len=yearLen(y), t=yearType(len), L=isLeap(y);
  const ch = t==='ש'?30:29, ki = t==='ח'?29:30;
  const arr=[['תשרי',30],['חשוון',ch],['כסלו',ki],['טבת',29],['שבט',30]];
  if(L) arr.push(['אדר א׳',30],['אדר ב׳',29]); else arr.push(['אדר',29]);
  arr.push(['ניסן',30],['אייר',29],['סיוון',30],['תמוז',29],['אב',30],['אלול',29]);
  return arr;
}
// gregorian anchor: 1 Tishrei 5787 = 2026-09-12
let _anchor=null;
function gDate(day){ if(_anchor===null) _anchor=rh(5787).day; return new Date(Date.UTC(2026,8,12)+(day-_anchor)*86400000); }
function currentYear(now){ now=now||new Date(); const today=Date.UTC(now.getFullYear(),now.getMonth(),now.getDate());
  let y=5787; while(gDate(rh(y).day).getTime()>today) y--; while(gDate(rh(y+1).day).getTime()<=today) y++; return y; }
// gematria
function gem(n){ if(n<=0) return ''; const H=['','ק','ר','ש','ת','תק','תר','תש','תת','תתק','תתר'];
  const T=['','י','כ','ל','מ','נ','ס','ע','פ','צ'], O=['','א','ב','ג','ד','ה','ו','ז','ח','ט'];
  const r=n%100; let s=H[Math.floor(n/100)];
  s += r===15?'טו': r===16?'טז' : T[Math.floor(r/10)]+O[r%10]; return s; }
function gq(n){ if(n===0) return '0'; const s=gem(n); return s.length===1? s+'׳' : s.slice(0,-1)+'״'+s.slice(-1); }
function yearHeb(y){ const th=Math.floor(y/1000), rest=y%1000; return (th? gem(th)+'׳':'')+(rest?gq(rest):''); }
const LV={'א':1,'ב':2,'ג':3,'ד':4,'ה':5,'ו':6,'ז':7,'ח':8,'ט':9,'י':10,'כ':20,'ך':20,'ל':30,'מ':40,'ם':40,'נ':50,'ן':50,'ס':60,'ע':70,'פ':80,'ף':80,'צ':90,'ץ':90,'ק':100,'ר':200,'ש':300,'ת':400};
function parseYear(s){ s=(s||'').trim(); if(!s) return NaN;
  if(/^\d+$/.test(s)){ let n=+s; if(n<1000) n+=5000; return n; }
  s=s.replace(/["״]/g,'').replace(/\s/g,'');
  let th=null; const m=s.match(/^([א-ת])['׳](.*)$/); if(m){ th=LV[m[1]]; s=m[2]; }
  s=s.replace(/['׳]/g,''); let v=0; for(const c of s){ if(!(c in LV)) return NaN; v+=LV[c]; }
  return (th===null?5000:th*1000)+v; }
function fmtMolad(t){ const {d,h,p}=splitParts(((t%P_WEEK)+P_WEEK)%P_WEEK); return `${DAY_LETTER[d]}׳ ${gq(h)} ${gq(p)}`; }
function fmtDHP(t){ const {d,h,p}=splitParts(t); return {d,h,p}; }
function civil(t){ // returns description in civil time
  const {d,h,p}=splitParts(((t%P_WEEK)+P_WEEK)%P_WEEK);
  const ch=(18+h)%24, mi=Math.floor(p/18), rem=p%18; const cd = h<6 ? (d+6)%7 : d;
  return {day:DAY_NAME[cd], time:`${String(ch).padStart(2,'0')}:${String(mi).padStart(2,'0')}`, rem, night:h<12, wd:d};
}
if(typeof module!=='undefined') module.exports={P_HOUR,P_DAY,P_WEEK,P_MONTH,BAHRAD,EX,isLeap,monthsBefore,splitParts,moladTotal,rhFrom,rh,yearLen,yearType,keviut,monthsOf,gDate,currentYear,gq,yearHeb,parseYear,fmtMolad,civil,pesachDay};
