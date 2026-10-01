// ===== חשבון הרמב״ם: קידוש החודש פרקים יא–יז =====
const RB={
  sun:{1:[0,59,8],10:[9,51,23],100:[98,33,53],1000:[265,38,50],10000:[136,28,20],29:[28,35,1],354:[348,55,15]},
  apo:{1:[0,0,0.15],10:[0,0,1.5],100:[0,0,15],1000:[0,2,30],10000:[0,25,0],29:[0,0,4],354:[0,0,53]},
  moon:{1:[13,10,35],10:[131,45,50],100:[237,38,23],1000:[216,23,50],10000:[3,58,20],29:[22,6,56],354:[344,26,43]},
  crs:{1:[13,3,54],10:[130,39,0],100:[226,29,53],1000:[104,58,50],10000:[329,48,20],29:[18,53,4],354:[305,0,13]},
  head:{1:[0,3,11],10:[0,31,47],100:[5,17,43],1000:[52,57,10],10000:[169,31,40],29:[1,32,9],354:[18,44,42]},
  root:{sun:[7,3,32],apo:[86,45,8],moon:[31,14,43],crs:[84,28,42],head:[180,57,28]}
};
const R_SUN=[0,20,40,58,75,89,101,111,117,119,118,113,105,93,79,61,42,21,0];
const R_MOON=[0,50,98,144,186,224,256,281,300,305,308,299,280,251,213,168,116,59,0];
const R_LAT=[0,52,103,150,193,230,260,282,295,300];
const R_PLON=[59,60,58,52,43,37,34,34,36,44,53,58];
const R_PLAT=[9,10,16,27,38,44,46,45,44,36,27,12];
const R_DBL=[[0,5,0],[6,11,1],[12,18,2],[19,24,3],[25,31,4],[32,38,5],[39,45,6],[46,51,7],[52,59,8],[60,63,9]];
const SIGNS=['טלה','שור','תאומים','סרטן','אריה','בתולה','מאזנים','עקרב','קשת','גדי','דלי','דגים'];
const FULL=1296000;
const secOf=([d,m,s])=>d*3600+m*60+s;
const nS=x=>((x%FULL)+FULL)%FULL, nM=x=>((x%21600)+21600)%21600;
function rMotion(tab,N){const sg=N<0?-1:1;let n=Math.abs(N),t=0;const parts=[];for(const k of [10000,1000,354,100,29,10,1]){let c=0;while(n>=k){t+=secOf(tab[k]);n-=k;c++;}if(c)parts.push([k,c]);}return {v:sg*t,parts};}
function interp(tab,deg){const i=Math.floor(deg/10),r=deg-i*10;if(i>=tab.length-1)return tab[tab.length-1];return tab[i]+(tab[i+1]-tab[i])*r/10;}
function circleFrac(posMin){const x=(posMin/60)%180;const T=[[20,2/5,'שני חומשים'],[40,1/3,'שליש'],[50,1/4,'רביע'],[60,1/5,'חומש'],[70,1/6,'שתות'],[80,1/12,'חצי שתות'],[85,1/24,'רביע שתות'],[95,0,'כלום'],[100,1/24,'רביע שתות'],[110,1/12,'חצי שתות'],[120,1/6,'שתות'],[130,1/5,'חומש'],[140,1/4,'רביע'],[160,1/3,'שליש'],[180,2/5,'שני חומשים']];for(const [lim,f,n] of T)if(x<lim)return [f,n];return [2/5,'שני חומשים'];}
const R_FOURTH=[[1/6,'מוסיפים שתותו'],[1/5,'מוסיפים חומשו'],[1/6,'מוסיפים שתותו'],[0,'משאירים כמו שהוא'],[-1/5,'גורעים חומשו'],[-1/3,'גורעים שלישיתו'],[-1/3,'גורעים שלישיתו'],[-1/5,'גורעים חומשו'],[0,'משאירים כמו שהוא'],[1/6,'מוסיפים שתותו'],[1/5,'מוסיפים חומשו'],[1/6,'מוסיפים שתותו']];
function season(sunDeg){if(sunDeg>=345||sunDeg<15)return 0;if(sunDeg<60)return 15;if(sunDeg<120)return 30;if(sunDeg<165)return 15;if(sunDeg<195)return 0;if(sunDeg<240)return -15;if(sunDeg<300)return -30;return -15;}
let _D0=null;
function rambamD0(){if(_D0===null){const y=4938,ni=monthsOf(y).findIndex(m=>m[0]==='ניסן');_D0=monthStart(y,ni)+2;}return _D0;}
// N = ימים שלמים מתחילת ליל ה׳ ג׳ ניסן ד׳תתקל״ח עד תחילת הלילה של היום העברי dayIdx
function rambam(dayIdx){
  const N=dayIdx-rambamD0(),S={};
  const mo=k=>rMotion(RB[k],N);
  const ms=mo('sun'),ma=mo('apo'),mm=mo('moon'),mc=mo('crs'),mh=mo('head');
  S.N=N;S.parts=ms.parts;
  S.sunMean=nS(secOf(RB.root.sun)+ms.v);S.apo=nS(secOf(RB.root.apo)+ma.v);
  S.sunMaslul=nS(S.sunMean-S.apo);let m=Math.round(S.sunMaslul/3600)%360;S.sunMaslulR=m;const m2=m>180?360-m:m;
  S.sunEq=Math.round(interp(R_SUN,m2));S.sunSign=m<180?-1:m>180?1:0;
  S.sunTrue=nM(Math.round((S.sunMean+S.sunSign*S.sunEq*60)/60));
  S.moonMean=nS(secOf(RB.root.moon)+mm.v);S.season=season(S.sunMean/3600);S.moonAdj=nS(S.moonMean+S.season*60);
  S.crs=nS(secOf(RB.root.crs)+mc.v);
  let dist=nS(S.moonAdj-S.sunMean);if(dist>FULL/2)dist-=FULL;S.dist=dist;S.dbl=2*dist;const dR=Math.round(S.dbl/3600);S.dblR=dR;
  S.dblAdd=0;S.dblOut=false;if(dR<0||dR>63)S.dblOut=true;for(const [a,b,v] of R_DBL)if(dR>=a&&dR<=b)S.dblAdd=v;if(dR>63)S.dblAdd=9;
  S.crsCorr=nS(S.crs+S.dblAdd*3600);let c=Math.round(S.crsCorr/3600)%360;S.crsR=c;const c2=c>180?360-c:c;
  S.moonEq=Math.round(interp(R_MOON,c2));S.moonSignOp=c<180?-1:c>180?1:0;
  S.moonTrue=nM(Math.round((S.moonAdj+S.moonSignOp*S.moonEq*60)/60));
  S.headMean=nS(secOf(RB.root.head)+mh.v);S.head=nM(Math.round(nS(FULL-S.headMean)/60));
  S.latCourse=nM(S.moonTrue-S.head);let lc=Math.round(S.latCourse/60)%360;S.latCourseR=lc;
  const l2=lc<=90?lc:lc<=180?180-lc:lc<=270?lc-180:360-lc;S.lat1=Math.round(interp(R_LAT,l2));S.north=lc>0&&lc<180;
  let L1=S.moonTrue-S.sunTrue;if(L1>10800)L1-=21600;if(L1<-10800)L1+=21600;S.long1=L1;
  const sign=Math.floor(S.moonTrue/1800);S.sign=sign;const capGem=(sign>=9||sign<=2);S.capGem=capGem;
  const [lo,hi]=capGem?[9,15]:[10,24];S.pre=L1<=lo*60?'no':L1>hi*60?'yes':'calc';S.preLim=[lo,hi];
  S.plon=R_PLON[sign];S.long2=L1-S.plon;
  S.plat=R_PLAT[sign];S.lat2=S.north?S.lat1-S.plat:S.lat1+S.plat;
  const [cf,cn]=circleFrac(S.moonTrue);S.circFrac=cn;S.circle=Math.round(Math.abs(S.lat2)*cf);
  const addCirc=capGem?!S.north:S.north;S.circAdd=addCirc;S.long3=S.long2+(addCirc?S.circle:-S.circle);
  const [ff,fn]=R_FOURTH[sign];S.fourthTxt=fn;S.fourthDelta=Math.round(S.long3*ff);S.long4=S.long3+S.fourthDelta;
  S.geo=Math.round(S.lat1*2/3);S.arc=S.long4+(S.north?S.geo:-S.geo);
  const A=S.arc/60,L=L1/60;let vis,why;
  if(S.pre!=='calc'){vis=S.pre==='yes';why=S.pre==='yes'?`אורך ראשון גדול מ־${hi}°: נראה בוודאי, בלי חשבון נוסף`:`אורך ראשון ${lo}° או פחות: לא ייראה, בלי חשבון נוסף`;}
  else if(A<=9){vis=false;why='קשת הראייה 9° או פחות';}
  else if(A>14){vis=true;why='קשת הראייה יותר מ־14°';}
  else{const need=A<=10?13:A<=11?12:A<=12?11:A<=13?10:9;vis=L>=need;why=`קשת ${fDM(S.arc)}: לפי קיצי הראייה צריך אורך ראשון ${need}° ומעלה, ויש ${fDM(L1)}`;}
  S.visible=vis;S.why=why;return S;
}
function fDM(min){const s=min<0?'−':'',a=Math.abs(Math.round(min)),d=Math.floor(a/60),m=a%60;return `<span class="num">${s}${d}° ${m}′</span>`;}
function fDMS(sec){const a=Math.abs(sec),d=Math.floor(a/3600),m=Math.floor((a%3600)/60),s=Math.round(a%60*10)/10;return `<span class="num">${sec<0?'−':''}${d}° ${m}′ ${s}″</span>`;}
function fPos(min){const s=Math.floor(min/1800);return `${fDM(min-s*1800)} ב${SIGNS[s]}`;}
