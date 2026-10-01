// ===== שקפי הירח =====
const AS={y:CUR,mi:0,t:0,city:0,speed:6*HOUR,playing:false,dSel:null};
let MI=null;const ACT={},AREN={};
const cityObj=()=>{const c=CITIES[AS.city];return {name:c[0],lat:c[1],lon:c[2]};};
const WD=['ראשון','שני','שלישי','רביעי','חמישי','שישי','שבת'];
function civStr(ms){const p=localParts(ms);return `${p.wd===6?'שבת':'יום '+WD[p.wd]} ${nm(`${String(p.d).padStart(2,'0')}.${String(p.m+1).padStart(2,'0')}.${p.y}`)} ${nm(hm(ms))}`;}
function dateShort(ms){const p=localParts(ms);return nm(`${p.d}.${p.m+1}`);}
function hebStr(ms){const h=hebDate(dayOfMs(ms,MI.c));return `${gq(h.d)} ${h.name} ${yearHeb(h.y)}`;}
function hrs(ms){const s=ms<0?'−':'',a=Math.abs(ms)/HOUR,h=Math.floor(a),m=Math.round((a-h)*60);return `${s}${h}:${String(m===60?0:m).padStart(2,'0')}`;}
const RT=R=>R.visible?'<span class="tag ok">נראה</span>':'<span class="tag bad">לא נראה</span>';
const ZT=z=>`<span class="tag ${ZONE[z][1]}">${z} · ${ZONE[z][0]}</span>`;

function computeMonth(){
  const c=cityObj(),y=AS.y,mi=AS.mi,start=monthStart(y,mi),len=monthsOf(y)[mi][1];
  const mean=moladMs(moladTotal(y,mi)),conj=phaseNear(mean,0),full=phaseNear(conj+14.77*DAYMS,180),next=phaseNear(conj+29.53*DAYMS,0),fq=phaseNear(conj+7.38*DAYMS,90),lq=phaseNear(conj+22.1*DAYMS,270);
  const ev=[],cp=localParts(conj);
  for(let k=-1;k<=3;k++){const g=new Date(Date.UTC(cp.y,cp.m,cp.d+k));const o=odeh(true,g.getUTCFullYear(),g.getUTCMonth(),g.getUTCDate(),c);if(o)ev.push(o);}
  const first=ev.find(o=>o.zone==='A'||o.zone==='B');
  const mo=[],np=localParts(next);
  for(let k=-3;k<=0;k++){const g=new Date(Date.UTC(np.y,np.m,np.d+k));const o=odeh(false,g.getUTCFullYear(),g.getUTCMonth(),g.getUTCDate(),c);if(o)mo.push(o);}
  const last=[...mo].reverse().find(o=>o.zone==='A'||o.zone==='B');
  const strip=[];for(let d=1;d<=len;d++){const [a,b,cc]=civOf(start+d-2);const ss=sunsetOn(a,b,cc,c)||localMidnight(a,b,cc)+18*HOUR;const s=sky(ss,c);strip.push({d,ss,k:s.k,wax:s.waxing});}
  const A=Math.min(strip[0].ss,mean,conj)-12*HOUR,B=Math.max(strip[len-1].ss+DAYMS,next)+12*HOUR;
  MI={c,y,mi,start,len,mean,conj,full,next,fq,lq,ev,first,mo,last,strip,A,B,name:monthsOf(y)[mi][0]};
  AS.dSel=Math.max(0,ev.indexOf(first));
}
function setMonth(keep){stopPlay();computeMonth();if(!keep)AS.t=MI.conj;AS.t=Math.max(MI.A,Math.min(MI.B,AS.t));renderAstro();}
function stopPlay(){AS.playing=false;}
let _last=0;
function loop(ts){if(!AS.playing){_last=0;return;}if(_last){AS.t+=AS.speed*(ts-_last)/1000;if(AS.t>=MI.B){AS.t=MI.B;AS.playing=false;}}_last=ts;renderAstro();requestAnimationFrame(loop);}

function astroCtl(host,key){
  const SP=[[10*60000,'10 דקות לשנייה'],[HOUR,'שעה לשנייה'],[6*HOUR,'6 שעות לשנייה'],[DAYMS,'יום לשנייה']];
  const JU=[['mean','מולד ממוצע'],['conj','מולד אמיתי'],['first','ראייה ראשונה'],['fq','רבע ראשון'],['full','מילוא'],['lq','רבע אחרון'],['last','ראייה אחרונה'],['sunset','שקיעה']];
  host.innerHTML=`<div class="actl"><div class="ctl"><div class="fld">שנה<div class="ay"></div></div><label class="fld">חודש<select class="am"></select></label><label class="fld">מקום<select class="ac">${CITIES.map((c,i)=>`<option value="${i}">${c[0]}</option>`).join('')}</select></label></div>
  <div class="tline"><input type="range" class="ar" min="0" max="2000" step="1" aria-label="ציר הזמן"><div class="tread"></div></div>
  <div class="ctl tbtn"><button type="button" class="btn pri ap">הפעל</button><select class="as" aria-label="מהירות">${SP.map(([v,t])=>`<option value="${v}">${t}</option>`).join('')}</select>
  <button type="button" class="btn" data-s="-24">− יום</button><button type="button" class="btn" data-s="-1">− שעה</button><button type="button" class="btn" data-s="1">+ שעה</button><button type="button" class="btn" data-s="24">+ יום</button></div>
  <div class="chips"><span>קפיצה:</span>${JU.map(([k,t])=>`<button type="button" data-j="${k}">${t}</button>`).join('')}</div></div>`;
  const q=s=>host.querySelector(s),am=q('.am'),ac=q('.ac'),ar=q('.ar'),ap=q('.ap'),as=q('.as'),tr=q('.tread');
  const yc=yearCtl(q('.ay'),AS.y,v=>{if(v===AS.y)return;AS.y=v;AS.mi=Math.min(AS.mi,monthsOf(v).length-1);setMonth();});
  am.onchange=()=>{AS.mi=+am.value;setMonth();};
  ac.onchange=()=>{AS.city=+ac.value;setMonth(true);};
  ar.oninput=()=>{stopPlay();AS.t=MI.A+(MI.B-MI.A)*ar.value/2000;renderAstro();};
  ap.onclick=()=>{if(AS.playing){stopPlay();renderAstro();}else{if(AS.t>=MI.B-HOUR)AS.t=MI.A;AS.playing=true;_last=0;requestAnimationFrame(loop);renderAstro();}};
  as.onchange=()=>{AS.speed=+as.value;};
  host.querySelectorAll('[data-s]').forEach(b=>b.onclick=()=>{stopPlay();AS.t=Math.max(MI.A,Math.min(MI.B,AS.t+(+b.dataset.s)*HOUR));renderAstro();});
  host.querySelectorAll('[data-j]').forEach(b=>b.onclick=()=>{stopPlay();const k=b.dataset.j;let t=null;
    if(k==='first')t=MI.first&&MI.first.tb;else if(k==='last')t=MI.last&&MI.last.tb;else if(k==='sunset'){const p=localParts(AS.t);t=sunsetOn(p.y,p.m,p.d,MI.c);}else t=MI[k];
    if(t!=null){AS.t=t;renderAstro();}});
  return {sync(){yc.set(AS.y,true);const ms=monthsOf(AS.y);if(am.options.length!==ms.length||am.dataset.y!=AS.y){am.innerHTML=ms.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');am.dataset.y=AS.y;}
    am.value=AS.mi;ac.value=AS.city;as.value=AS.speed;ar.value=Math.round((AS.t-MI.A)/(MI.B-MI.A)*2000);ap.textContent=AS.playing?'עצור':'הפעל';
    tr.innerHTML=`${civStr(AS.t)}<small>${hebStr(AS.t)} · ${MI.c.name}</small>`;}};
}
function moonG(cx,cy,r,k,rot,dash){const rx=Math.abs(1-2*k)*r,sw=k<0.5?0:1;
  return `<g transform="translate(${cx.toFixed(1)} ${cy.toFixed(1)}) rotate(${rot.toFixed(1)})" ${dash?'opacity=".45"':''}><circle r="${r}" class="mdark" ${dash?'stroke="#fff" stroke-dasharray="3 3"':''}/>${k>0.004?`<path d="M0 ${-r}A${r} ${r} 0 0 1 0 ${r}A${rx.toFixed(2)} ${r} 0 0 ${sw} 0 ${-r}Z" class="mlit"/>`:''}</g>`;}
const facts=items=>items.map(([l,v])=>`<div><small>${l}</small><b>${v}</b></div>`).join('');

// --- A
function stripSVG(){const W=760,n=MI.len,cw=W/n,Rt=W,cur=hebDate(dayOfMs(AS.t,MI.c));let s=`<svg viewBox="0 0 ${W} 86" role="img" aria-label="מופעי הירח בכל ערב בחודש" style="width:100%">`;
  MI.strip.forEach((o,i)=>{const x=Rt-(i+.5)*cw,isCur=cur.y===MI.y&&cur.mi===MI.mi&&cur.d===o.d;
    if(isCur)s+=`<rect x="${x-cw/2+1}" y="2" width="${cw-2}" height="82" rx="6" class="fl-moonsoft" style="stroke:var(--moon);stroke-width:2"/>`;
    s+=moonG(x,30,Math.min(11,cw*0.4),o.k,o.wax?0:180)+`<text x="${x}" y="62" text-anchor="middle" class="svgt" font-size="12" font-weight="700">${gem(o.d)}</text><text x="${x}" y="78" text-anchor="middle" class="svgt tx-muted" font-size="9">${Math.round(o.k*100)}%</text>`;});
  return `<p class="vt">${MI.name} ${yearHeb(MI.y)}: הירח בשקיעה של כל ערב</p>`+s+'</svg>';}
function orbitSVG(sk){const R=135,re=26,L=a=>[Math.cos(a*D2R),-Math.sin(a*D2R)];const le=nrm(sk.sunLam+180),[ex,ey]=L(le).map(v=>v*R),[mx,my]=L(sk.moonLam).map(v=>v*re);
  const a0=nrm(sunEcl(TofMs(MI.strip[0].ss).T).lam+180),a1=nrm(sunEcl(TofMs(MI.strip[MI.len-1].ss).T).lam+180);
  const [p0x,p0y]=L(a0).map(v=>v*R),[p1x,p1y]=L(a1).map(v=>v*R);
  let s=`<svg viewBox="-170 -170 340 340" role="img" aria-label="מבט על: שמש, כדור הארץ וירח"><circle r="${R}" fill="none" class="wtick" stroke-dasharray="3 4"/>
  <path d="M${p0x.toFixed(1)} ${p0y.toFixed(1)}A${R} ${R} 0 0 0 ${p1x.toFixed(1)} ${p1y.toFixed(1)}" fill="none" class="st-leap" stroke-width="5" opacity=".5"/>
  <circle r="20" class="sunf"/><text y="38" class="wc3">שמש</text>
  <circle cx="${ex}" cy="${ey}" r="${re}" fill="none" class="wtick" stroke-dasharray="2 3"/>
  <g transform="translate(${ex.toFixed(1)} ${ey.toFixed(1)}) rotate(${(-le).toFixed(1)})"><circle r="9" fill="#3E7CB8"/><path d="M0 -9A9 9 0 0 1 0 9Z" fill="#0E1A33" opacity=".8"/></g>
  <circle cx="${ex+mx}" cy="${ey+my}" r="5" class="mlit" stroke="#555" stroke-width=".5"/>
  <text x="${ex}" y="${ey+(ey>60?-34:44)}" class="wc3">כדור הארץ</text>
  <text y="-150" class="wc1">מבט על, מלמעלה (לא בקנה מידה)</text><text y="160" class="wc1">כחול: הדרך של כדור הארץ בחודש הזה</text></svg>`;return s;}
function zoomSVG(sk){const R=112,e=sk.dlam,mx=R*Math.cos(e*D2R),my=-R*Math.sin(e*D2R);
  let s=`<svg viewBox="-170 -170 340 340" role="img" aria-label="מערכת ארץ־ירח, השמש מימין">`;
  for(const y of [-120,-60,0,60,120])s+=`<line x1="168" y1="${y}" x2="140" y2="${y}" stroke="#F4C33F" stroke-width="2"/><path d="M140 ${y}l6 -4v8z" fill="#F4C33F"/>`;
  s+=`<text x="118" y="-140" class="wc1">אור השמש</text><circle r="${R}" fill="none" class="wtick" stroke-dasharray="3 4"/>`;
  [[0,'מולד'],[90,'רבע ראשון'],[180,'מילוא'],[270,'רבע אחרון']].forEach(([a,t])=>{const x=(R-40)*Math.cos(a*D2R),y=-(R-22)*Math.sin(a*D2R);s+=`<text x="${x}" y="${y+4}" class="wc1">${t}</text>`;});
  const lg=e>180?1:0;s+=`<path d="M48 0A48 48 0 ${lg} 0 ${(48*Math.cos(e*D2R)).toFixed(1)} ${(-48*Math.sin(e*D2R)).toFixed(1)}" fill="none" class="st-moon" stroke-width="3"/>`;
  s+=`<circle r="24" fill="#3E7CB8"/><path d="M0 -24A24 24 0 0 0 0 24Z" fill="#0E1A33" opacity=".75"/>`;
  s+=`<g transform="translate(${mx.toFixed(1)} ${my.toFixed(1)})"><circle r="13" class="mdark"/><path d="M0 -13A13 13 0 0 1 0 13Z" class="mlit"/></g>`;
  s+=`<text x="${(70*Math.cos(e/2*D2R)).toFixed(1)}" y="${(-70*Math.sin(e/2*D2R)+4).toFixed(1)}" class="wc3 tx-moon">${Math.round(e)}°</text>`;
  s+=`<g transform="translate(-128 -128)">${moonG(0,0,20,sk.k,sk.waxing?0:180)}<text y="36" class="wc1">כך נראה מכאן</text></g>`;
  return s+`<text y="160" class="wc1">השמש תמיד מימין · הירח נע נגד כיוון השעון</text></svg>`;}
AREN.A=()=>{const sk=sky(AS.t,MI.c);$('#vaS').innerHTML=stripSVG();$('#vaO').innerHTML=orbitSVG(sk);$('#vaZ').innerHTML=zoomSVG(sk);
  $('#faA').innerHTML=facts([['גיל הירח מהמולד האמיתי',nm(hrs(AS.t-MI.conj))+' שעות'],['התרחקות מהשמש',`${Math.round(sk.dlam)}°`],['חלק מואר',`${(sk.k*100).toFixed(1)}%`],['כיוון',sk.waxing?'הולך וגדל':'הולך וקטן'],['מרחק הירח',`${NUM(Math.round(sk.dist))} ק״מ`]]);};

// --- sky panorama
function lerpHex(a,b,t){const p=h=>[1,3,5].map(i=>parseInt(h.substr(i,2),16));const x=p(a),y=p(b);return '#'+x.map((v,i)=>Math.round(v+(y[i]-v)*t).toString(16).padStart(2,'0')).join('');}
function skyCols(h){const st=[[12,'#4A8FCB','#B9DCF2'],[0,'#5D8FC6','#F2C58C'],[-4,'#344F88','#E58A5C'],[-8,'#1A2655','#58497A'],[-14,'#070C20','#121A38']];
  if(h>=st[0][0])return [st[0][1],st[0][2]];if(h<=st[st.length-1][0])return [st[st.length-1][1],st[st.length-1][2]];
  for(let i=0;i<st.length-1;i++){const [a,t1,b1]=st[i],[c,t2,b2]=st[i+1];if(h<=a&&h>=c){const t=(a-h)/(a-c);return [lerpHex(t1,t2,t),lerpHex(b1,b2,t)];}}}
const STARS=Array.from({length:70},(_,i)=>[(Math.sin(i*12.9898)*43758.5453%1+1)%1,(Math.sin(i*78.233)*12345.678%1+1)%1,(i%3)+1]);
function skySVG(ms,c,opt){opt=opt||{};const W=900,H=380,y0=300,sc=270/70,X=az=>(az-30)/300*W,Y=al=>y0-Math.min(al,72)*sc,id='s'+(++_uid);
  const sk=sky(ms,c),[top,bot]=skyCols(sk.sun.alt),sa=sk.sun.alt;
  let s=`<svg viewBox="0 0 ${W} ${H}" role="img" aria-label="השמיים מעל ${c.name}"><defs><linearGradient id="${id}" x1="0" y1="0" x2="0" y2="1"><stop offset="0" stop-color="${top}"/><stop offset="1" stop-color="${bot}"/></linearGradient>
  <radialGradient id="${id}g"><stop offset="0" stop-color="#FFE9A0" stop-opacity=".9"/><stop offset="1" stop-color="#FFE9A0" stop-opacity="0"/></radialGradient></defs>
  <rect width="${W}" height="${y0}" fill="url(#${id})"/>`;
  if(sa<-7){const op=Math.min(1,(-7-sa)/7);STARS.forEach(([a,b,r])=>{s+=`<circle cx="${(a*W).toFixed(0)}" cy="${(b*(y0-20)).toFixed(0)}" r="${r*.6}" fill="#fff" opacity="${(op*0.8).toFixed(2)}"/>`;});}
  const light=sa>-3;const tc=light?'#1A2240':'#E8ECF6';
  for(const a of [10,20,30,45,60]){s+=`<line x1="0" y1="${Y(a)}" x2="${W}" y2="${Y(a)}" stroke="${tc}" stroke-opacity=".15"/><text x="${W-8}" y="${Y(a)-4}" fill="${tc}" opacity=".6" font-size="12" text-anchor="end" direction="ltr" font-family="Assistant,Arial">${a}°</text>`;}
  const body=(az,al,draw,label,dy)=>{dy=dy||-24;if(az<30||az>330){const left=az>330||az<0?false:true;return `<text x="${az>180?W-10:10}" y="${Y(Math.max(al,2))}" fill="${tc}" font-size="13" font-weight="700" text-anchor="${az>180?'end':'start'}" font-family="Assistant,Arial">${label} (בצפון)</text>`;}
    const x=X(az),y=Y(al);return draw(x,y)+`<text x="${x}" y="${y+dy}" fill="${al<0?'#ddd':tc}" font-size="14" font-weight="800" text-anchor="middle" font-family="Assistant,Arial">${label} ${al.toFixed(1)}°</text>`;};
  // ground
  s+=`<rect y="${y0}" width="${W}" height="${H-y0}" fill="#1E2A1F"/><path d="M0 ${y0}`;for(let x=0;x<=W;x+=30)s+=`L${x} ${y0-4-3*Math.sin(x/37)-2*Math.sin(x/11)}`;s+=`L${W} ${y0}Z" fill="#1E2A1F"/>`;
  const Z=sk.chi-sk.moon.q,rot=Math.atan2(-cs(Z),-sn(Z))*R2D;
  s+=body(sk.sun.az,sk.sun.alt,(x,y)=>`<circle cx="${x}" cy="${y}" r="40" fill="url(#${id}g)" ${sa<0?'opacity=".3"':''}/><circle cx="${x}" cy="${y}" r="12" class="sunf" ${sa<0?'opacity=".45" stroke="#fff" stroke-dasharray="3 3"':''}/>`,'שמש');
  const near=Math.hypot(X(sk.moon.az)-X(sk.sun.az),Y(sk.moon.alt)-Y(sk.sun.alt))<70;s+=body(sk.moon.az,sk.moon.alt,(x,y)=>moonG(x,y,14,sk.k,rot,sk.moon.alt<0),'ירח',near?36:-24);
  [[60,'צפון־מזרח'],[90,'מזרח'],[135,'דרום־מזרח'],[180,'דרום'],[225,'דרום־מערב'],[270,'מערב'],[300,'צפון־מערב']].forEach(([a,t])=>{s+=`<line x1="${X(a)}" y1="${y0}" x2="${X(a)}" y2="${y0+8}" stroke="#9fb59a"/><text x="${X(a)}" y="${y0+26}" fill="#C9D8C4" font-size="14" font-weight="700" text-anchor="middle" font-family="Assistant,Arial">${t}</text>`;});
  const ph=sa>0?'יום':sa>-6?'דמדומים אזרחיים':sa>-12?'דמדומים ימיים':'לילה';
  s+=`<text x="${W/2}" y="${H-14}" fill="#C9D8C4" font-size="14" text-anchor="middle" font-family="Assistant,Arial">${c.name} · ${hm(ms)} · ${ph}</text>`;
  return {svg:s+'</svg>',sk};}
const _dayCache={};
function dayEvents(ms,c){const p=localParts(ms),k=`${p.y}-${p.m}-${p.d}-${c.name}`;if(!_dayCache[k]){const ss=sunsetOn(p.y,p.m,p.d,c),sr=sunriseOn(p.y,p.m,p.d,c);_dayCache[k]={ss,sr,mset:ss?moonsetNear(ss,c):null};}return _dayCache[k];}
AREN.B=()=>{const r=skySVG(AS.t,MI.c),sk=r.sk;$('#vbK').innerHTML=r.svg;const e=dayEvents(AS.t,MI.c);
  $('#fbB').innerHTML=facts([['זריחה',e.sr?nm(hm(e.sr)):'—'],['שקיעה',e.ss?nm(hm(e.ss)):'—'],['שקיעת הירח (סביב הערב)',e.mset?nm(hm(e.mset)):'—'],['השמש',`גובה ${sk.sun.alt.toFixed(1)}°, כיוון ${Math.round(sk.sun.az)}°`],['הירח',`גובה ${sk.moon.alt.toFixed(1)}°, כיוון ${Math.round(sk.moon.az)}°`],['חלק מואר',`${(sk.k*100).toFixed(1)}%`],['התרחקות',`${sk.elong.toFixed(1)}°`]]);};

// --- C
const _yearGap={};
function yearGaps(y){if(!_yearGap[y]){_yearGap[y]=monthsOf(y).map((m,i)=>{const mean=moladMs(moladTotal(y,i));return {name:m[0],gap:mean-phaseNear(mean,0)};});}return _yearGap[y];}
AREN.C=()=>{const S=ACT.Csteps;const gap=MI.mean-MI.conj;
  const W=760,A=Math.min(MI.mean,MI.conj)-18*HOUR,B=Math.max(MI.mean,MI.conj)+18*HOUR,X=t=>W-20-(t-A)/(B-A)*(W-40);
  let s=`<svg viewBox="0 0 ${W} 130" role="img" aria-label="מולד ממוצע ומולד אמיתי על ציר זמן" style="width:100%"><line x1="20" y1="70" x2="${W-20}" y2="70" class="wtick" stroke-width="2"/>`;
  for(let t=Math.ceil(A/(6*HOUR))*6*HOUR;t<B;t+=6*HOUR){s+=`<line x1="${X(t)}" y1="64" x2="${X(t)}" y2="76" class="wtick"/><text x="${X(t)}" y="94" text-anchor="middle" class="svgt tx-muted" font-size="11">${hm(t)}</text>`;}
  s+=`<line x1="${X(MI.mean)}" y1="70" x2="${X(MI.conj)}" y2="70" class="st-shift" stroke-width="6" opacity=".6"/>`;
  s+=`<circle cx="${X(MI.mean)}" cy="70" r="9" class="mk-moon"/><text x="${X(MI.mean)}" y="44" text-anchor="middle" class="svgt tx-moon" font-weight="800">מולד ממוצע ${hm(MI.mean)}</text>`;
  s+=`<circle cx="${X(MI.conj)}" cy="70" r="9" class="mk-leap"/><text x="${X(MI.conj)}" y="${Math.abs(X(MI.conj)-X(MI.mean))<180?22:44}" text-anchor="middle" class="svgt tx-leap" font-weight="800">מולד אמיתי ${hm(MI.conj)}</text>`;
  if(AS.t>A&&AS.t<B)s+=`<line x1="${X(AS.t)}" y1="56" x2="${X(AS.t)}" y2="84" class="st-shift" stroke-width="2"/>`;
  s+=`<text x="${W/2}" y="120" text-anchor="middle" class="svgt" font-weight="700">הפער: ${hrs(Math.abs(gap))} שעות · הממוצע ${gap>0?'מאחר':'מקדים'}</text></svg>`;
  $('#vcT').innerHTML=`<p class="vt">${MI.name} ${yearHeb(MI.y)}</p>`+s;
  const G=yearGaps(MI.y),n=G.length,bw=(W-60)/n,Z=110,sc=90/16;
  let g=`<svg viewBox="0 0 ${W} 230" role="img" aria-label="הפער לכל חודש בשנה" style="width:100%"><text x="${W/2}" y="16" text-anchor="middle" class="svgt" font-weight="700">הפער בכל חודש של ${yearHeb(MI.y)} (בשעות; למעלה: הממוצע מאחר)</text><line x1="40" y1="${Z}" x2="${W-10}" y2="${Z}" class="wtick"/>`;
  for(const v of [-12,-6,6,12])g+=`<line x1="40" y1="${Z-v*sc}" x2="${W-10}" y2="${Z-v*sc}" class="wtick" opacity=".35"/><text x="32" y="${Z-v*sc+4}" class="svgt tx-muted" font-size="11" text-anchor="end" direction="ltr">${v>0?'+':''}${v}</text>`;
  G.forEach((m,i)=>{const h=m.gap/HOUR,x=W-10-(i+1)*bw,hh=Math.abs(h)*sc;g+=`<rect x="${x+4}" y="${h>0?Z-hh:Z}" width="${bw-8}" height="${Math.max(1,hh)}" rx="2" class="${i===MI.mi?'fl-moon':'fl-moonsoft'}"/><text x="${x+bw/2}" y="214" text-anchor="middle" class="svgt" font-size="11" font-weight="${i===MI.mi?800:400}">${m.name}</text>`;});
  $('#vcY').innerHTML=g+'</svg>';
  const {d,h,p}=splitParts(moladTotal(MI.y,MI.mi)%P_WEEK);
  S.render([{l:'המולד הממוצע לפי הלוח',v:sg(fmtMolad(moladTotal(MI.y,MI.mi))),s:`${moladLong(moladTotal(MI.y,MI.mi))}`},
    {l:'ממירים לשעון',v:civStr(MI.mean),s:'שעה מקומית ממוצעת בירושלים, מומרת לשעון ישראל'},
    {l:'המולד האמיתי (התקבצות)',v:civStr(MI.conj),s:'הרגע שבו לירח ולשמש אותו אורך אקליפטי'},
    {l:'הפער',v:`${hrs(Math.abs(gap))} שעות`,s:gap>0?'המולד הממוצע מאוחר מהאמיתי':'המולד הממוצע מוקדם מהאמיתי',c:'final'},
    {l:'אורך החודש האמיתי',v:`${dhp(Math.round((MI.next-MI.conj)/3600000*1080))}`,s:`לעומת הממוצע: כ״ט י״ב תשצ״ג`}]);};

// --- D
AREN.D=()=>{const S=ACT.Dsteps,c=MI.c;
  const rows=MI.ev.map((o,i)=>{const age=(o.ss-MI.conj)/HOUR;const di=dayOfMs(o.ss+60000,c),hd=Object.assign(hebDate(di),{di});
    return `<tr data-i="${i}" class="${i===AS.dSel?'sel':''}"><td>ערב ${dateShort(o.ss)}<br><small class="note">ליל ${gq(hd.d)} ${hd.name}</small></td><td class="num">${age>0?hrs(age*HOUR):'לפני המולד'}</td><td>${o.lag!=null&&o.lag>0?Math.round(o.lag/60000)+' דק׳':'שוקע לפני השמש'}</td><td class="num">${o.arcv.toFixed(1)}°</td><td class="num">${o.W.toFixed(2)}′</td><td class="num">${o.V.toFixed(2)}</td><td>${ZT(o.zone)}</td><td>${RT(rambam(hd.di))}</td></tr>`;}).join('');
  const rc=monthStart(MI.y,MI.mi);
  $('#vdT').innerHTML=`<table class="evt"><thead><tr><th>ערב</th><th>גיל הירח</th><th>שהייה</th><th>ARCV</th><th>W</th><th>V</th><th>Odeh</th><th>רמב״ם</th></tr></thead><tbody>${rows}</tbody></table>
   <p class="note" style="width:100%">ראש חודש ${MI.name} לפי הלוח: ${dayWord(rc)} ${gStr(rc)} (מתחיל בערב שלפניו). ראייה ראשונה בעין או במשקפת לפי Odeh ב${c.name}: ${MI.first?'ערב '+dateShort(MI.first.ss):'לא בטווח'}. לחצו על שורה.</p>`;
  $('#vdT').querySelectorAll('tr[data-i]').forEach(tr=>tr.onclick=()=>{AS.dSel=+tr.dataset.i;AS.t=MI.ev[AS.dSel].tb;renderAstro();});
  const o=MI.ev[AS.dSel];if(!o){S.render([]);return;}
  $('#vdK').innerHTML=skySVG(o.tb,c).svg;AREN.D2(o);
  const mz=splitParts(moladTotal(MI.y,MI.mi)%P_DAY).h;
  S.render([{l:'שקיעה',v:nm(hm(o.ss)),s:civStr(o.ss)},
    {l:'שקיעת הירח',v:o.ms2?nm(hm(o.ms2)):'—'},
    {l:'זמן שהייה (Lag)',v:o.lag!=null?`${Math.round(o.lag/60000)} דקות`:'—',s:o.lag!=null&&o.lag<=0?'הירח שוקע לפני השמש: אין מה לראות':'',c:o.lag!=null&&o.lag<=0?'bad':''},
    {l:'הזמן הטוב ביותר: שקיעה + 4/9 מהשהייה',v:nm(hm(o.tb))},
    {l:'גבהים באותו רגע',v:`ירח ${o.s.moon.alt.toFixed(2)}° · שמש ${o.s.sun.alt.toFixed(2)}°`,s:'גובה טופוצנטרי, בלי שבירת אור'},
    {l:'ARCV: הפרש הגבהים',v:`${o.arcv.toFixed(2)}°`},
    {l:'ARCL: המרחק הזוויתי שמש־ירח',v:`${o.arcl.toFixed(2)}°`},
    {l:'W: רוחב הסהר = SD × (1 − cos ARCL)',v:`${o.W.toFixed(3)} דקות קשת`,s:`SD (חצי קוטר הירח) = ${o.s.SD.toFixed(2)}′`},
    {l:'V = ARCV − (−0.1018W³ + 0.7319W² − 6.3226W + 7.1651)',v:nm(o.V.toFixed(2))},
    {l:'ההכרעה',v:ZT(o.zone),c:'final'},
    {l:'ומה עם מולד זקן?',v:`המולד הממוצע של ${MI.name} ב־${mz} שעות`,s:mz>=18?'מולד זקן: לפי הכלל לא תיראה הלבנה בערב שאחרי המולד, וזה מה שרואים בשורה הראשונה של הטבלה':'לפני 18 שעות: לפי הכלל הלבנה יכולה להיראות סמוך לשקיעה הקרובה'}]);};
AREN.D2=(o)=>{const R=rambam(dayOfMs(o.ss+60000,MI.c)),RS=ACT.Rsteps,hd=hebDate(R.N+rambamD0());const sg2=x=>x<0?'גורעים':'מוסיפים';
  const ok=(R.visible&&(o.zone==='A'||o.zone==='B'))||(!R.visible&&(o.zone==='C'||o.zone==='D'));
  $('#vdR').className='result '+(ok?'ok':'bad');$('#vdR').innerHTML=`ליל ${gq(hd.d)} ${hd.name} ${yearHeb(hd.y)} · Odeh: ${ZT(o.zone)} · הרמב״ם: ${RT(R)} · ${ok?'השיטות מסכימות':'השיטות חלוקות'}${o.zone==='B'?' (Odeh גבולי)':''}`;
  const pre=R.pre==='calc'?`בין ${R.preLim[0]}° ל־${R.preLim[1]}°: צריך חשבון`:R.pre==='yes'?`יותר מ־${R.preLim[1]}°: נראה בוודאי`:`${R.preLim[0]}° או פחות: לא ייראה`;
  RS.render([
    {l:'ימים שלמים מהעיקר (ליל ה׳, ג׳ ניסן ד׳תתקל״ח)',v:NUM(R.N),s:R.parts.map(([k,c])=>`${c}×${k}`).join(' + ')||'0'},
    {l:'אמצע השמש',v:fDMS(R.sunMean),s:`גובה השמש: ${fDMS(R.apo)}`},
    {l:'מסלול השמש = אמצע − גובה',v:`${fDMS(R.sunMaslul)} ← ${R.sunMaslulR}°`,s:`מנת המסלול: ${fDM(R.sunEq)}, ${R.sunSign<0?'גורעים':R.sunSign>0?'מוסיפים':'אין'}`},
    {l:'מקום השמש האמיתי',v:fPos(R.sunTrue)},
    {l:'אמצע הירח לשעת הראייה',v:fDMS(R.moonAdj),s:`אמצע ${fDMS(R.moonMean)}, ${R.season?sg2(R.season)+' '+Math.abs(R.season)+' חלקים לפי מזל השמש':'בלי תיקון לפי מזל השמש'}`},
    {l:'מרחק כפול',v:`${fDMS(R.dbl)} ← ${sg2(1)} ${R.dblAdd}° למסלול`,s:R.dblOut?'מחוץ לטווח שהרמב״ם מגדיר (5°–63°)':''},
    {l:'המסלול הנכון',v:`${R.crsR}°`,s:`אמצע המסלול ${fDMS(R.crs)}`},
    {l:'מקום הירח האמיתי',v:fPos(R.moonTrue),s:`מנת המסלול ${fDM(R.moonEq)}, ${R.moonSignOp<0?'גורעים':R.moonSignOp>0?'מוסיפים':'אין'}`},
    {l:'מקום הראש',v:fPos(R.head),s:`מסלול הרוחב: ${R.latCourseR}°`},
    {l:'רוחב ראשון',v:`${fDM(R.lat1)} ${R.north?'צפוני':'דרומי'}`},
    {l:'אורך ראשון = ירח − שמש',v:fDM(R.long1),s:`הירח ב${SIGNS[R.sign]}. בדיקה מקדימה: ${pre}`,c:R.pre==='calc'?'':R.pre==='yes'?'good':'bad'},
    {l:'שינוי מראה האורך ← אורך שני',v:`${nm('−'+R.plon+'′')} ← ${fDM(R.long2)}`},
    {l:'שינוי מראה הרוחב ← רוחב שני',v:`${nm((R.north?'−':'+')+R.plat+'′')} ← ${fDM(R.lat2)}`},
    {l:'מעגל הירח',v:`${R.circFrac} מהרוחב השני = ${fDM(R.circle)}`},
    {l:'אורך שלישי',v:fDM(R.long3),s:`${R.circAdd?'מוסיפים':'גורעים'} את מעגל הירח`},
    {l:'אורך רביעי',v:fDM(R.long4),s:`${R.fourthTxt} (${fDM(R.fourthDelta)})`},
    {l:'מנת גובה המדינה = ⅔ מהרוחב הראשון',v:fDM(R.geo),s:R.north?'רוחב צפוני: מוסיפים':'רוחב דרומי: גורעים'},
    {l:'קשת הראייה',v:fDM(R.arc)},
    {l:'ההכרעה',v:RT(R),s:R.why,c:'final'}]);};

// ---- הרכבה
document.querySelectorAll('[data-astro]').forEach(sl=>{const k=sl.dataset.astro;ACT[k]=astroCtl($('#ca'+k),k);});
ACT.Csteps=stepsBox($('#scC'));ACT.Dsteps=stepsBox($('#sdD'));ACT.Rsteps=stepsBox($('#sdR'));
$('#rbEx').onclick=()=>{stopPlay();AS.y=4938;AS.mi=monthsOf(4938).findIndex(m=>m[0]==='אייר');AS.city=0;computeMonth();const tgt=monthStart(4938,AS.mi)+1;const i=MI.ev.findIndex(o=>dayOfMs(o.ss+60000,MI.c)===tgt);AS.dSel=i<0?AS.dSel:i;AS.t=MI.ev[AS.dSel].tb;renderAstro();};
function renderAstro(){const sl=slides[cur];if(!sl||!sl.dataset.astro)return;const k=sl.dataset.astro;if(!MI)computeMonth();ACT[k].sync();AREN[k]();}
window.onSlideShown=sl=>{if(!sl.dataset.astro){stopPlay();return;}renderAstro();};
AS.mi=hebDate(dayOfMs(Date.now(),cityObj())).mi;AS.y=hebDate(dayOfMs(Date.now(),cityObj())).y;computeMonth();AS.t=MI.conj;
go(cur);
