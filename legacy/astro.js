// ===== מנוע אסטרונומי (Meeus, מקוצר) =====
const D2R=Math.PI/180,R2D=180/Math.PI;
const nrm=a=>((a%360)+360)%360, w180=a=>{a=nrm(a);return a>180?a-360:a;};
const sn=a=>Math.sin(a*D2R), cs=a=>Math.cos(a*D2R);
const HOUR=3600000, DAYMS=86400000;
function deltaT(y){
  if(y>=2005&&y<=2150){const t=y-2000;return 62.92+0.32217*t+0.005589*t*t;}
  const tb=[[1900,-2.8],[1920,21.2],[1940,24.3],[1960,33.2],[1980,50.5],[2000,63.8],[2005,64.7]];
  if(y>=1900&&y<2005){for(let i=0;i<tb.length-1;i++){if(y<=tb[i+1][0]){const [a,b]=tb[i],[c,d]=tb[i+1];return b+(d-b)*(y-a)/(c-a);}}}
  const u=(y-1820)/100;return -20+32*u*u;
}
const ML=[[0,0,1,0,6288774,-20905355],[2,0,-1,0,1274027,-3699111],[2,0,0,0,658314,-2955968],[0,0,2,0,213618,-569925],[0,1,0,0,-185116,48888],[0,0,0,2,-114332,-3149],[2,0,-2,0,58793,246158],[2,-1,-1,0,57066,-152138],[2,0,1,0,53322,-170733],[2,-1,0,0,45758,-204586],[0,1,-1,0,-40923,-129620],[1,0,0,0,-34720,108743],[0,1,1,0,-30383,104755],[2,0,0,-2,15327,10321],[0,0,1,2,-12528,0],[0,0,1,-2,10980,79661],[4,0,-1,0,10675,-34782],[0,0,3,0,10034,-23210],[4,0,-2,0,8548,-21636],[2,1,-1,0,-7888,24208],[2,1,0,0,-6766,30824],[1,0,-1,0,-5163,-8379],[1,1,0,0,4987,-16675],[2,-1,1,0,4036,-12831],[2,0,2,0,3994,-10445],[4,0,0,0,3861,-11650],[2,0,-3,0,3665,14403],[0,1,-2,0,-2689,-7003],[2,0,-1,2,-2602,0],[2,-1,-2,0,2390,10056],[1,0,1,0,-2348,6322],[2,-2,0,0,2236,-9884],[0,1,2,0,-2120,5751],[0,2,0,0,-2069,0],[2,-2,-1,0,2048,-4950],[2,0,1,-2,-1773,4130],[2,0,0,2,-1595,0],[4,-1,-1,0,1215,-3958],[0,0,2,2,-1110,0],[3,0,-1,0,-892,3258],[2,1,1,0,-810,2616],[4,-1,-2,0,759,-1897],[0,2,-1,0,-713,-2117],[2,2,-1,0,-700,2354],[2,1,-2,0,691,0],[2,-1,0,-2,596,0],[4,0,1,0,549,-1423],[0,0,4,0,537,-1117],[4,-1,0,0,520,-1571],[1,0,-2,0,-487,-1739],[2,1,0,-2,-399,0],[0,0,2,-2,-381,-4421],[1,1,1,0,351,0],[3,0,-2,0,-340,0],[4,0,-3,0,330,0],[2,-1,2,0,327,0],[0,2,1,0,-323,1165],[1,1,-1,0,299,0],[2,0,3,0,294,0],[2,0,-1,-2,0,8752]];
const MB=[[0,0,0,1,5128122],[0,0,1,1,280602],[0,0,1,-1,277693],[2,0,0,-1,173237],[2,0,-1,1,55413],[2,0,-1,-1,46271],[2,0,0,1,32573],[0,0,2,1,17198],[2,0,1,-1,9266],[0,0,2,-1,8822],[2,-1,0,-1,8216],[2,0,-2,-1,4324],[2,0,1,1,4200],[2,1,0,-1,-3359],[2,-1,-1,1,2463],[2,-1,0,1,2211],[2,-1,-1,-1,2065],[0,1,-1,-1,-1870],[4,0,-1,-1,1828],[0,1,0,1,-1794],[0,0,0,3,-1749],[0,1,-1,1,-1565],[1,0,0,1,-1491],[0,1,1,1,-1475],[0,1,1,-1,-1410],[0,1,0,-1,-1344],[1,0,0,-1,-1335],[0,0,3,1,1107],[4,0,0,-1,1021],[4,0,-1,1,833]];
function sunEcl(T){const L0=280.46646+36000.76983*T,M=357.52911+35999.05029*T,e=0.016708634-0.000042037*T;
  const C=(1.914602-0.004817*T)*sn(M)+(0.019993-0.000101*T)*sn(2*M)+0.000289*sn(3*M);const v=M+C,O=125.04-1934.136*T;
  return {lam:nrm(L0+C-0.00569-0.00478*sn(O)),R:1.000001018*(1-e*e)/(1+e*cs(v))};}
function moonEcl(T){const T2=T*T,T3=T2*T,T4=T3*T;
  const Lp=218.3164477+481267.88123421*T-0.0015786*T2+T3/538841-T4/65194000,D=297.8501921+445267.1114034*T-0.0018819*T2+T3/545868-T4/113065000,
  M=357.5291092+35999.0502909*T-0.0001536*T2+T3/24490000,Mp=134.9633964+477198.8675055*T+0.0087414*T2+T3/69699-T4/14712000,F=93.2720950+483202.0175233*T-0.0036539*T2-T3/3526000+T4/863310000;
  const E=1-0.002516*T-0.0000074*T2,A1=119.75+131.849*T,A2=53.09+479264.290*T,A3=313.45+481266.484*T;
  let l=0,r=0,b=0;
  for(const [d,m,mp,f,cl,cr] of ML){const a=d*D+m*M+mp*Mp+f*F,e=Math.abs(m)===1?E:Math.abs(m)===2?E*E:1;l+=cl*e*sn(a);r+=cr*e*cs(a);}
  for(const [d,m,mp,f,cb] of MB){const a=d*D+m*M+mp*Mp+f*F,e=Math.abs(m)===1?E:Math.abs(m)===2?E*E:1;b+=cb*e*sn(a);}
  l+=3958*sn(A1)+1962*sn(Lp-F)+318*sn(A2);b+=-2235*sn(Lp)+382*sn(A3)+175*sn(A1-F)+175*sn(A1+F)+127*sn(Lp-Mp)-115*sn(Lp+Mp);
  const O=125.04452-1934.136261*T,dpsi=(-17.2*sn(O)-1.32*sn(2*(280.4665+36000.7698*T))-0.23*sn(2*Lp))/3600;
  return {lam:nrm(Lp+l/1e6+dpsi),beta:b/1e6,dist:385000.56+r/1000};}
function toEq(lam,beta,eps){const a=Math.atan2(sn(lam)*cs(eps)-Math.tan(beta*D2R)*sn(eps),cs(lam))*R2D,d=Math.asin(sn(beta)*cs(eps)+cs(beta)*sn(eps)*sn(lam))*R2D;return {ra:nrm(a),dec:d};}
function altAz(ra,dec,lat,lon,jd){const T=(jd-2451545)/36525,g=nrm(280.46061837+360.98564736629*(jd-2451545)+0.000387933*T*T),H=nrm(g+lon-ra);
  const alt=Math.asin(sn(lat)*sn(dec)+cs(lat)*cs(dec)*cs(H))*R2D,az=nrm(Math.atan2(sn(H),cs(H)*sn(lat)-Math.tan(dec*D2R)*cs(lat))*R2D+180);
  const q=Math.atan2(sn(H),Math.tan(lat*D2R)*cs(dec)-sn(dec)*cs(H))*R2D;return {alt,az,H,q};}
function refr(h){return h<-1.5?0:1.02/Math.tan((h+10.3/(h+5.11))*D2R)/60;}
const _yr=ms=>new Date(ms).getUTCFullYear();
function TofMs(ms){const jd=ms/DAYMS+2440587.5;return {jd,T:(jd+deltaT(_yr(ms))/86400-2451545)/36525};}
function sunOnly(ms,c){const {jd,T}=TofMs(ms),s=sunEcl(T),eps=23.439291-0.0130042*T,q=toEq(s.lam,0,eps);return altAz(q.ra,q.dec,c.lat,c.lon,jd).alt;}
function moonTopoAlt(ms,c){const {jd,T}=TofMs(ms),m=moonEcl(T),eps=23.439291-0.0130042*T,q=toEq(m.lam,m.beta,eps),h=altAz(q.ra,q.dec,c.lat,c.lon,jd).alt,par=Math.asin(6378.14/m.dist)*R2D;return h-Math.asin(sn(par)*cs(h))*R2D;}
function sky(ms,c){const {jd,T}=TofMs(ms),eps=23.439291-0.0130042*T,s=sunEcl(T),m=moonEcl(T);
  const se=toEq(s.lam,0,eps),me=toEq(m.lam,m.beta,eps),sh=altAz(se.ra,se.dec,c.lat,c.lon,jd),mh=altAz(me.ra,me.dec,c.lat,c.lon,jd);
  const par=Math.asin(6378.14/m.dist)*R2D,mtop=mh.alt-Math.asin(sn(par)*cs(mh.alt))*R2D;
  const psi=Math.acos(cs(m.beta)*cs(m.lam-s.lam))*R2D,Rkm=s.R*149597870.7,i=Math.atan2(Rkm*sn(psi),m.dist-Rkm*cs(psi))*R2D,k=(1+cs(i))/2;
  const chi=nrm(Math.atan2(cs(se.dec)*sn(se.ra-me.ra),sn(se.dec)*cs(me.dec)-cs(se.dec)*sn(me.dec)*cs(se.ra-me.ra))*R2D);
  const SD=0.27245*par*60*(1+sn(Math.max(mtop,0))*sn(par));
  return {sunLam:s.lam,moonLam:m.lam,moonBeta:m.beta,dist:m.dist,par,SD,
    sun:{alt:sh.alt,az:sh.az},moon:{alt:mtop,az:mh.az,q:mh.q},elong:psi,dlam:nrm(m.lam-s.lam),k,waxing:nrm(m.lam-s.lam)<180,chi};}
// ---- זמן ישראל
function lastSun(y,m){const d=new Date(Date.UTC(y,m+1,0));return d.getUTCDate()-d.getUTCDay();}
function ilOffset(ms){const d=new Date(ms),y=d.getUTCFullYear();if(y<1948)return 2;
  const st=Date.UTC(y,2,lastSun(y,2)-2,0),en=Date.UTC(y,9,lastSun(y,9),-1);return (ms>=st&&ms<en)?3:2;}
function localParts(ms){const o=ilOffset(ms),d=new Date(ms+o*HOUR);return {y:d.getUTCFullYear(),m:d.getUTCMonth(),d:d.getUTCDate(),h:d.getUTCHours(),mi:d.getUTCMinutes(),wd:d.getUTCDay(),o};}
function hm(ms){const p=localParts(ms);return `${String(p.h).padStart(2,'0')}:${String(p.mi).padStart(2,'0')}`;}
function localMidnight(y,m,d){const g=Date.UTC(y,m,d,12);return Date.UTC(y,m,d)-ilOffset(g)*HOUR;}
// ---- אירועים
function crossing(f,t0,t1,step,target,dir){let a=t0,fa=f(a)-target;for(let t=t0+step;t<=t1;t+=step){const ft=f(t)-target;if((dir<0&&fa>0&&ft<=0)||(dir>0&&fa<0&&ft>=0)){let lo=t-step,hi=t;for(let i=0;i<22;i++){const mid=(lo+hi)/2,fm=f(mid)-target;if((dir<0&&fm>0)||(dir>0&&fm<0))lo=mid;else hi=mid;}return (lo+hi)/2;}fa=ft;}return null;}
function sunsetOn(y,m,d,c){const L=localMidnight(y,m,d);return crossing(t=>sunOnly(t,c),L+12*HOUR,L+22*HOUR,15*60000,-0.833,-1);}
function sunriseOn(y,m,d,c){const L=localMidnight(y,m,d);return crossing(t=>sunOnly(t,c),L+2*HOUR,L+11*HOUR,15*60000,-0.833,1);}
function moonsetNear(t,c){return crossing(t2=>moonTopoAlt(t2,c),t-4*HOUR,t+9*HOUR,10*60000,-0.833,-1);}
function moonriseNear(t,c){return crossing(t2=>moonTopoAlt(t2,c),t-9*HOUR,t+4*HOUR,10*60000,-0.833,1);}
function phaseNear(ms,target){let t=ms;for(let i=0;i<10;i++){const {T}=TofMs(t),d=w180(moonEcl(T).lam-sunEcl(T).lam-target);t-=d/12.19*DAYMS;if(Math.abs(d)<1e-5)break;}return t;}
// ---- Odeh
function odeh(evening,y,m,d,c){
  const ss=evening?sunsetOn(y,m,d,c):sunriseOn(y,m,d,c);if(ss==null)return null;
  const ms2=evening?moonsetNear(ss,c):moonriseNear(ss,c);const lag=ms2==null?null:(evening?ms2-ss:ss-ms2);
  const tb=lag!=null&&lag>0?(evening?ss+lag*4/9:ss-lag*4/9):ss;const s=sky(tb,c);
  const arcv=s.moon.alt-s.sun.alt,arcl=Math.acos(sn(s.sun.alt)*sn(s.moon.alt)+cs(s.sun.alt)*cs(s.moon.alt)*cs(s.moon.az-s.sun.az))*R2D;
  const W=s.SD*(1-cs(arcl)),V=arcv-(-0.1018*W**3+0.7319*W*W-6.3226*W+7.1651);
  let zone;if(lag==null||lag<=0)zone='D';else if(V>=5.65)zone='A';else if(V>=2)zone='B';else if(V>=-0.96)zone='C';else zone='D';
  return {ss,ms2,lag,tb,s,arcv,arcl,W,V,zone};}
const ZONE={A:['נראה בעין','ok'],B:['אולי בעין, בטוח במשקפת','moon'],C:['רק במשקפת','leap'],D:['לא נראה','bad']};
const CITIES=[['ירושלים',31.778,35.235],['חיפה',32.794,34.990],['תל אביב',32.085,34.782],['צפת',32.965,35.496],['באר שבע',31.252,34.791],['אילת',29.558,34.952]];
// ---- חיבור ללוח
function moladMs(total){const d=Math.floor(total/P_DAY),r=total%P_DAY;return gDate(d).getTime()-6*HOUR+r/P_HOUR*HOUR-(140.94*60000);}
function monthStart(y,mi){const ms=monthsOf(y);let d=rh(y).day;for(let i=0;i<mi;i++)d+=ms[i][1];return d;}
function dayOfMs(ms,c){const p=localParts(ms),base=Math.round((Date.UTC(p.y,p.m,p.d)-Date.UTC(2026,8,12))/DAYMS)+rh(5787).day;
  const ss=sunsetOn(p.y,p.m,p.d,c);return (ss!=null&&ms>=ss)?base+1:base;}
function hebDate(day){let y=5787;while(rh(y).day>day)y--;while(rh(y+1).day<=day)y++;const ms=monthsOf(y);let s=rh(y).day;
  for(let i=0;i<ms.length;i++){if(day<s+ms[i][1])return {y,mi:i,d:day-s+1,name:ms[i][0]};s+=ms[i][1];}}
function civOf(day){const g=gDate(day);return [g.getUTCFullYear(),g.getUTCMonth(),g.getUTCDate()];}
