// ===== ממשק =====
const $=s=>document.querySelector(s);
const nm=s=>`<span class="num">${s}</span>`;
const sg=s=>`<span class="sig">${s}</span>`;
const NUM=n=>n.toLocaleString('en-US');
const RULE_NAME={zaken:'מולד זקן',gatrad:'גטר״ד',betu:'בטו תקפט',adu:'לא אד״ו'};
const ALLOWED=[353,354,355,383,384,385];
const wk=t=>((t%P_WEEK)+P_WEEK)%P_WEEK;
function fmtDur(t){const {d,h,p}=splitParts(t);return `${gq(d)} ${gq(h)} ${gq(p)}`;}
function dhp(t){const {d,h,p}=splitParts(t);return `${NUM(d)} ימים, ${h} שעות, ${p} חלקים`;}
function moladLong(t){const {d,h,p}=splitParts(wk(t));return `יום ${DAY_LETTER[d]}׳, ${h} שעות, ${p} חלקים`;}
function dayWord(i){i=((i%7)+7)%7;return i===6?'שבת':'יום '+DAY_NAME[i];}
function civilTxt(t){const c=civil(t);return `${c.day==='שבת'?'שבת':'יום '+c.day} בשעה ${nm(c.time)}${c.rem?` ו־${c.rem===1?'חלק אחד':c.rem+' חלקים'}`:''}`;}
function gStr(day){const d=gDate(day);if(d.getUTCFullYear()<100)return '';return nm(`${String(d.getUTCDate()).padStart(2,'0')}.${String(d.getUTCMonth()+1).padStart(2,'0')}.${d.getUTCFullYear()}`);}
const CUR=currentYear();

// ---- year control
function yearCtl(host,init,onChange){
  host.innerHTML=`<div class="yc"><button type="button" aria-label="שנה קודמת">−</button><input type="text" aria-label="שנה"><button type="button" aria-label="שנה הבאה">+</button><em class="num"></em></div>`;
  const b=host.querySelectorAll('button'),inp=host.querySelector('input'),em=host.querySelector('em');let y=init;
  function set(v,silent){v=Math.max(2,Math.min(9998,v));y=v;inp.value=yearHeb(v);em.textContent=v;inp.removeAttribute('aria-invalid');inp.style.borderColor='';if(!silent)onChange(v);}
  b[0].onclick=()=>set(y-1);b[1].onclick=()=>set(y+1);
  const go=()=>{const v=parseYear(inp.value);if(isNaN(v)||v<2||v>9998){inp.setAttribute('aria-invalid','true');inp.style.borderColor='var(--shift)';return;}set(v);};
  inp.addEventListener('change',go);inp.addEventListener('keydown',e=>{if(e.key==='Enter')go();});
  set(init);return {set,get:()=>y};
}
// ---- steps
function stepsBox(host){
  host.innerHTML=`<div class="stepbar"><button type="button">שלב־שלב</button><button type="button" disabled>שלב הבא</button><button type="button" disabled>הצג הכל</button></div><ol></ol>`;
  const [br,bn,ba]=host.querySelectorAll('.stepbar button'),ol=host.querySelector('ol');let shown=Infinity;
  function apply(){const it=[...ol.children];it.forEach((li,i)=>li.classList.toggle('hid',i>=shown));const st=shown!==Infinity;bn.disabled=!st;ba.disabled=!st;}
  br.onclick=()=>{shown=0;apply();bn.focus();};bn.onclick=()=>{shown++;if(shown>=ol.children.length)shown=Infinity;apply();if(shown===Infinity)br.focus();};ba.onclick=()=>{shown=Infinity;apply();};
  return {render(rows){ol.innerHTML=rows.map((r,i)=>`<li class="step ${r.c||''}"><span class="sn">${i+1}</span><div class="sl">${r.l}</div><div><div class="sv">${r.v}</div>${r.s?`<div class="ss">${r.s}</div>`:''}</div></li>`).join('');if(shown!==Infinity)shown=Math.min(shown,rows.length);apply();}};
}
// ---- molad control (day/hour/parts + extras)
function moladCtl(host,def,extras,onChange){
  host.innerHTML=`<div class="fld">יום<div class="seg">${'אבגדהוז'.split('').map((l,i)=>`<button type="button" data-d="${i}" aria-label="${DAY_NAME[i]}">${l}</button>`).join('')}</div></div>
  <label class="fld">שעות<input type="number" min="0" max="23" value="${def.h}"></label><label class="fld">חלקים<input type="number" min="0" max="1079" value="${def.p}"></label>${extras||''}`;
  let d=def.d;const btns=host.querySelectorAll('.seg button'),[ih,ip]=host.querySelectorAll('input[type=number]');
  const mark=()=>btns.forEach(b=>b.setAttribute('aria-pressed',+b.dataset.d===d));
  btns.forEach(b=>b.onclick=()=>{d=+b.dataset.d;mark();onChange();});
  host.querySelectorAll('input').forEach(i=>i.addEventListener('input',onChange));mark();
  return {get(){const h=Math.max(0,Math.min(23,+ih.value||0)),p=Math.max(0,Math.min(1079,+ip.value||0));return {d,h,p,t:200*P_WEEK+d*P_DAY+h*P_HOUR+p};},
    set(v){d=v.d;ih.value=v.h;ip.value=v.p;mark();},host};
}
function findYears(pred,from,to,lim){const out=[];for(let y=from;y<=to&&out.length<lim;y++){if(pred(y))out.push(y);}return out;}
function chips(host,label,years,onPick,fmt){host.innerHTML=`<span>${label}</span>`+years.map(y=>`<button type="button" data-y="${y}">${fmt?fmt(y):yearHeb(y)}</button>`).join('');host.querySelectorAll('button').forEach(b=>b.onclick=()=>onPick(+b.dataset.y));}

// ---- SVG: week wheel
let _uid=0;
function wheel(o){
  const R=150,r0=95,id='w'+(++_uid);
  const A=x=>(x/P_WEEK)*2*Math.PI-Math.PI/2;
  const P=(x,r)=>[(r*Math.cos(A(x))).toFixed(1),(r*Math.sin(A(x))).toFixed(1)];
  const sect=(x1,x2,ra,rb)=>{const lg=(x2-x1)>P_WEEK/2?1:0;const [a,b]=P(x1,rb),[c,d]=P(x2,rb),[e,f]=P(x2,ra),[g,h]=P(x1,ra);return `M${a} ${b}A${rb} ${rb} 0 ${lg} 1 ${c} ${d}L${e} ${f}A${ra} ${ra} 0 ${lg} 0 ${g} ${h}Z`;};
  let s=`<svg class="wheel" viewBox="-240 -212 480 424" role="img" aria-label="${o.aria||'גלגל השבוע'}"><defs>`;
  for(const c of ['moon','shift','leap','ok'])s+=`<marker id="${id}${c}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto-start-reverse"><path d="M0 0L10 5L0 10z" class="mk-${c}"/></marker>`;
  s+='</defs>';const days=o.days||[];
  for(let i=0;i<7;i++){const x=i*P_DAY,c=days[i]||'';s+=`<path d="${sect(x,x+P_DAY/2,r0,R)}" class="wn ${c}"/><path d="${sect(x+P_DAY/2,x+P_DAY,r0,R)}" class="wd ${c}"/>`;}
  for(let i=0;i<7;i++){const x=i*P_DAY;const [a,b]=P(x,r0-3),[c,d]=P(x,R+3);s+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="wsep"/>`;
    for(const hh of [6,12,18]){const [e,f]=P(x+hh*P_HOUR,R-7),[g,h]=P(x+hh*P_HOUR,R);s+=`<line x1="${e}" y1="${f}" x2="${g}" y2="${h}" class="wtick"/>`;}
    const [lx,ly]=P(x+P_DAY/2,(R+r0)/2);s+=`<text x="${lx}" y="${ly}" class="wl">${'אבגדהוש'[i]}</text>`;}
  (o.ticks||[]).forEach(t=>{const x=wk(t.x);const [a,b]=P(x,r0),[c,d]=P(x,R+6);s+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="st-${t.cls}" stroke-width="2.5" stroke-dasharray="5 3"/>`;});
  (o.arcs||[]).forEach(a=>{const r=r0-11;let x1=wk(a.from),x2=x1+(a.to-a.from);if(x2-x1<P_WEEK*0.006)return;if(x2-x1>=P_WEEK)x2=x1+P_WEEK*0.999;const lg=(x2-x1)>P_WEEK/2?1:0;const [p,q]=P(x1,r),[u,v]=P(x2,r);
    s+=`<path d="M${p} ${q}A${r} ${r} 0 ${lg} 1 ${u} ${v}" fill="none" class="st-${a.cls}" stroke-width="3.5" marker-end="url(#${id}${a.cls})"/>`;});
  (o.markers||[]).forEach(m=>{const x=wk(m.x);const [a,b]=P(x,r0),[c,d]=P(x,R+9),[e,f]=P(x,R+16),[g,h]=P(x,R+42);
    s+=`<line x1="${a}" y1="${b}" x2="${c}" y2="${d}" class="st-${m.cls}" stroke-width="3"/><circle cx="${e}" cy="${f}" r="8" class="mk-${m.cls}"/>`;
    if(m.label)s+=`<text x="${g}" y="${h}" class="mlab tx-${m.cls}">${m.label}</text>`;});
  const c=o.center||[];if(c[0])s+=`<text y="-24" class="wc1">${c[0]}</text>`;if(c[1])s+=`<text y="6" class="wc2">${c[1]}</text>`;if(c[2])s+=`<text y="32" class="wc3">${c[2]}</text>`;
  return s+'</svg>';
}
const legend=items=>`<div class="legend">${items.map(([c,t])=>`<span><i style="background:${c}"></i>${t}</span>`).join('')}</div>`;

// ---- SVG: day band (RTL)
function dayBand(o){
  const W=640,H=150,Rt=616,IW=592,X=hr=>Rt-hr/24*IW,id='b'+(++_uid);
  let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%" role="img" aria-label="ציר היממה מ־18:00 עד 18:00"><defs><marker id="${id}" viewBox="0 0 10 10" refX="7" refY="5" markerWidth="6" markerHeight="6" orient="auto"><path d="M0 0L10 5L0 10z" class="mk-shift"/></marker></defs>`;
  s+=`<rect x="${X(12)}" y="44" width="${IW/2}" height="40" class="wn"/><rect x="${X(24)}" y="44" width="${IW/2}" height="40" class="wd"/>`;
  s+=`<text x="${X(6)}" y="69" class="svgt tx-muted" text-anchor="middle">לילה</text><text x="${X(18)}" y="69" class="svgt tx-muted" text-anchor="middle">יום</text>`;
  for(let h=0;h<=24;h++){const x=X(h);s+=`<line x1="${x}" y1="${h%3?78:44}" x2="${x}" y2="84" class="wtick"/>`;
    if(h%3===0)s+=`<text x="${x}" y="102" text-anchor="middle" class="svgt" font-weight="700">${h}</text><text x="${x}" y="119" text-anchor="middle" class="svgt tx-muted">${String((18+h)%24).padStart(2,'0')}:00</text>`;}
  if(o.th!=null){const x=X(o.th);s+=`<line x1="${x}" y1="38" x2="${x}" y2="90" class="st-shift" stroke-width="3" stroke-dasharray="5 3"/><text x="${x}" y="140" text-anchor="middle" class="svgt tx-shift" font-weight="700">${o.thLabel||''}</text>`;}
  if(o.at!=null){const x=X(o.at);
    if(o.next)s+=`<path d="M${x} 30 L${X(24)-14} 30" class="st-shift" stroke-width="3" fill="none" marker-end="url(#${id})"/>`;
    s+=`<line x1="${x}" y1="38" x2="${x}" y2="90" class="st-moon" stroke-width="3"/><circle cx="${x}" cy="64" r="9" class="mk-moon"/><text x="${Math.max(70,Math.min(570,x))}" y="18" text-anchor="middle" class="svgt tx-moon" font-weight="800">${o.label||''}</text>`;}
  return s+'</svg>';
}
// ---- ring of N
function ring(n,o){
  const R=122,rr=n>20?12:16;let s=`<svg viewBox="-160 -160 320 320" style="width:min(100%,18rem)" role="img" aria-label="${o.aria||''}">`;
  for(let i=1;i<=n;i++){const a=(i-1)/n*2*Math.PI-Math.PI/2,x=(R*Math.cos(a)).toFixed(1),y=(R*Math.sin(a)).toFixed(1);
    s+=`<circle cx="${x}" cy="${y}" r="${rr}" class="${o.cls(i)}" ${i===o.cur?'style="stroke:var(--ink);stroke-width:4"':''}/><text x="${x}" y="${y}" class="svgt" text-anchor="middle" dominant-baseline="central" font-weight="700" font-size="${n>20?11:14}">${i}</text>`;}
  const c=o.center||[];if(c[0])s+=`<text y="-20" class="wc1">${c[0]}</text>`;if(c[1])s+=`<text y="10" class="wc2">${c[1]}</text>`;if(c[2])s+=`<text y="36" class="wc3">${c[2]}</text>`;
  return s+'</svg>';
}

// ===== שקפים =====
const slides=[...document.querySelectorAll('.slide')];
let calcCtl=null;
function goCalc(y){go(slides.length-1);calcCtl.set(y);}

// 0 hero
(function(){
  const st=document.createElement('div');$('#r0').appendChild(st);
  yearCtl($('#c0'),CUR,y=>{const r=rh(y);
    $('#v0').innerHTML=wheel({markers:[{x:r.t,cls:'moon',label:'מולד'}],arcs:r.rules.length?[{from:r.t,to:r.t+(r.day*P_DAY+P_DAY/2-r.t),cls:'shift'}]:[],days:Object.assign([], {[r.day%7]:'ok'}),center:['ראש השנה',yearHeb(y),dayWord(r.day)],aria:'מולד תשרי וראש השנה על גלגל השבוע'})+legend([['var(--moon)','מולד תשרי'],['var(--shift)','דחייה'],['var(--ok-soft)','היום שנקבע']]);
    st.innerHTML=`<p>מולד תשרי ${sg(fmtMolad(r.t))}: ${civilTxt(r.t)}.</p><p>${r.rules.length?'דחיות שחלו: '+r.rules.map(k=>`<span class="tag bad">${RULE_NAME[k]}</span>`).join(' '):'<span class="tag ok">בלי דחייה</span>'} · ראש השנה: <strong>${dayWord(r.day)}</strong> ${gStr(r.day)}</p>`;});
  $('#road').innerHTML=slides.slice(1).map((s,i)=>`<li><button type="button" data-i="${i+1}"><span>${i+1}</span>${s.dataset.title}</button></li>`).join('');
  $('#road').querySelectorAll('button').forEach(b=>b.onclick=()=>go(+b.dataset.i));
})();

// 1 units
(function(){
  const S=stepsBox($('#s1')),ih=$('#c1h'),ip=$('#c1p'),it=$('#c1t');
  $('#v1b').innerHTML=`<p class="vt">1080 מתחלק ב…</p><div class="mstrip">${Array.from({length:12},(_,i)=>i+1).map(k=>`<div class="${1080%k?'':'flex'}"><b>${k}</b><small>${1080%k?'לא':'= '+1080/k}</small></div>`).join('')}</div>`;
  function draw(){const h=Math.max(0,Math.min(23,+ih.value||0)),p=Math.max(0,Math.min(1079,+ip.value||0));
    const ch=(18+h)%24,mi=Math.floor(p/18),r=p%18,sec=Math.round(r*10/3);
    it.value=`${String(ch).padStart(2,'0')}:${String(mi).padStart(2,'0')}`;
    $('#v1').innerHTML=dayBand({at:h+p/1080,label:`${h} שעות ${p} חלקים`});
    S.render([{l:'שעה עברית',v:`${h} שעות ו־${p} חלקים`,s:`מתחילת היממה: ${NUM(h*1080+p)} חלקים`},
      {l:'מוסיפים לשש בערב',v:`18 + ${h} = ${18+h}${18+h>=24?` → ${ch} (אחרי חצות)`:''}`,s:h<6?'עדיין ערב של היום הקודם בשעון':''},
      {l:'חלקים לדקות: מחלקים ב־18',v:`${p} ÷ 18 = ${mi} דקות, שארית ${r} חלקים`},
      {l:'שארית לשניות: כפול 3⅓',v:`${r} × 3⅓ ≈ ${sec} שניות`},
      {l:'בשעון',v:nm(`${String(ch).padStart(2,'0')}:${String(mi).padStart(2,'0')}:${String(sec).padStart(2,'0')}`),c:'final'}]);}
  ih.oninput=draw;ip.oninput=draw;
  it.oninput=()=>{const [H,M]=(it.value||'0:0').split(':').map(Number);ih.value=(H+6)%24;ip.value=M*18;draw();};
  draw();
})();

// 2 month
(function(){
  const S=stepsBox($('#s2'));let y=CUR;
  // month bar
  (function(){const W=640,c=20,Rt=620;let s=`<svg viewBox="0 0 ${W} 120" style="width:100%" role="img" aria-label="חודש לבנה: ארבעה שבועות ועודף">`;
    s+=`<text x="320" y="18" text-anchor="middle" class="svgt" font-weight="700">חודש אחד: 29 ימים, 12 שעות, 793 חלקים</text>`;
    for(let i=1;i<=29;i++){const x=Rt-i*c,w=Math.floor((i-1)/7);const cls=i===29?'fl-moonsoft':(w%2?'wn':'wd');s+=`<rect x="${x+1}" y="32" width="${c-2}" height="34" rx="3" class="${cls}" ${i===29?'style="stroke:var(--moon);stroke-width:1.5"':''}/>`;}
    const pw=(c-2)*(12*1080+793)/25920;s+=`<rect x="${Rt-29*c-pw+1}" y="32" width="${pw}" height="34" rx="3" class="fl-moon"/>`;
    for(let w=0;w<4;w++){const x=Rt-(w*7+3.5)*c;s+=`<text x="${x}" y="88" text-anchor="middle" class="svgt tx-muted">שבוע ${w+1}</text>`;}
    s+=`<text x="${Rt-29.3*c}" y="88" text-anchor="middle" class="svgt tx-moon" font-weight="800">העודף</text><text x="${Rt-29.3*c}" y="108" text-anchor="middle" class="svgs tx-moon" font-size="15">א׳ י״ב תשצ״ג</text>`;
    s+=`<text x="${Rt-14*c}" y="108" text-anchor="middle" class="svgt tx-muted">28 ימים = 4 שבועות: לא מזיזים את היום בשבוע</text>`;
    $('#v2').innerHTML=s+'</svg>';})();
  function draw(){const n=Math.max(1,Math.min(13,+$('#c2n').value||1));const names=[...monthsOf(y),...monthsOf(y+1)].map(m=>m[0]);
    const t0=moladTotal(y);const rows=[{l:`מולד ${names[0]} ${yearHeb(y)}`,v:sg(fmtMolad(t0)),s:civilTxt(t0)}];const mk=[{x:t0,cls:'moon',label:names[0]}],arcs=[];
    for(let k=1;k<=n;k++){const t=t0+k*P_MONTH;rows.push({l:`+ ${fmtDur(EX.month)} ← מולד ${names[k]}`,v:sg(fmtMolad(t)),s:civilTxt(t)});arcs.push({from:t-P_MONTH,to:t-P_MONTH+EX.month,cls:'leap'});mk.push({x:t,cls:k===n?'shift':'leap',label:k===n?names[k]:''});}
    rows.push({l:`${n} חודשים בסך הכול`,v:dhp(n*P_MONTH),s:`${Math.floor(n*P_MONTH/P_WEEK)} שבועות שלמים, ונשאר ${sg(fmtDur(n*EX.month%P_WEEK))}`,c:'final'});
    S.render(rows);$('#v2w').innerHTML=wheel({markers:mk,arcs,center:['אחרי',`${n} חודשים`,names[n]],aria:'מולדות עוקבים'});}
  yearCtl($('#c2y'),CUR,v=>{y=v;draw();});$('#c2n').oninput=draw;
})();

// 3 epoch
(function(){
  const S=stepsBox($('#s3'));const V=BAHRAD+12*P_MONTH;
  $('#v3').innerHTML=wheel({markers:[{x:BAHRAD,cls:'moon',label:'בהר״ד'},{x:V,cls:'leap',label:'ויה״ד'}],arcs:[{from:BAHRAD,to:BAHRAD+EX.pashut,cls:'leap'}],center:['שנה פשוטה','ד׳ ח׳ תתע״ו','מבהר״ד לויה״ד'],aria:'בהר״ד וויה״ד'});
  yearCtl($('#c3y'),CUR,y=>{const Y=y-1,c=Math.floor(Y/19),r=Y%19,b=Math.floor((7*r+1)/19),a=r-b,m=monthsBefore(y);
    S.render([{l:'שנים שלמות שעברו',v:`${NUM(Y)} שנים`,s:`השנה ${yearHeb(y)} עדיין לא עברה, לכן ${NUM(y)} − 1`},
      {l:'מחלקים למחזורים של 19',v:`${NUM(Y)} ÷ 19 = ${NUM(c)} מחזורים, שארית ${r} שנים`},
      {l:'חודשים במחזורים השלמים',v:`${NUM(c)} × 235 = ${NUM(c*235)}`},
      {l:`חודשים ב־${r} השנים שבמחזור הנוכחי`,v:`${a} פשוטות × 12 + ${b} מעוברות × 13 = ${a*12+b*13}`},
      {l:'סך הכול חודשים מבהר״ד',v:NUM(m),s:`מולד תשרי ${yearHeb(y)} = בהר״ד + ${NUM(m)} חודשים = ${sg(fmtMolad(moladTotal(y)))}`,c:'final'}]);
    $('#v3b').innerHTML=`<p class="vt">המחזור הנוכחי (מספר ${NUM(c+1)})</p><div class="boxes">${Array.from({length:19},(_,i)=>i+1).map(i=>`<div class="${i<=r?'done':''} ${LEAP_POS.includes(i)?'lp':''} ${i===r+1?'cur':''}">${i}</div>`).join('')}</div><p class="note">אפור: שנים שעברו · כחול: מעוברות שעברו · מסגרת: השנה</p>`;});
})();

// 4 small cycle
(function(){
  const S=stepsBox($('#s4'));
  const ML=29.530594,SY=235*ML/19;let acc=0;const dr=[];for(let k=1;k<=19;k++){acc+=(LEAP_POS.includes(k)?13:12)*ML-SY;dr.push(acc);}
  const mx=Math.max(...dr.map(Math.abs)),hi=Math.max(0,...dr),lo=Math.min(0,...dr);
  function drift(cur){const W=640,H=190,Rt=610,bw=28,sc=130/(hi-lo),Z=30+hi*sc;let s=`<svg viewBox="0 0 ${W} ${H}" style="width:100%" role="img" aria-label="הפער המצטבר בין לבנה לחמה לאורך המחזור">`;
    s+=`<text x="320" y="16" text-anchor="middle" class="svgt" font-weight="700">הפער המצטבר בימים: הלבנה מול החמה</text><line x1="40" y1="${Z}" x2="${Rt+10}" y2="${Z}" class="wtick"/>`;
    dr.forEach((v,i)=>{const x=Rt-(i+1)*bw,h=Math.abs(v)*sc,y=v<0?Z:Z-h;const L=LEAP_POS.includes(i+1);
      s+=`<rect x="${x+3}" y="${y}" width="${bw-6}" height="${Math.max(1,h)}" rx="2" class="${L?'fl-leap':'fl-moonsoft'}" ${i+1===cur?'style="stroke:var(--ink);stroke-width:2.5"':''}/><text x="${x+bw/2}" y="${H-6}" text-anchor="middle" class="svgt ${L?'tx-leap':'tx-muted'}" font-weight="700">${i+1}</text>`;});
    s+=`<text x="26" y="${Z+4}" class="svgt tx-muted" text-anchor="middle">0</text><text x="26" y="${Z-lo*sc+4}" class="svgt tx-muted" text-anchor="middle">${Math.round(lo)}</text>`;
    return s+'</svg>';}
  yearCtl($('#c4y'),CUR,y=>{const c=Math.floor((y-1)/19),r=(y-1)%19,pos=r+1,L=isLeap(y),v=(7*y+1)%19;
    $('#v4').innerHTML=ring(19,{cls:i=>LEAP_POS.includes(i)?'rl':'rp',cur:pos,center:['מחזור '+NUM(c+1),`שנה ${pos}`,L?'מעוברת':'פשוטה'],aria:'מחזור של 19 שנה'})+drift(pos)+legend([['var(--leap-soft)','שנה מעוברת: מוסיפים חודש והפער מתאפס'],['var(--moon-soft)','שנה פשוטה: הלבנה מקדימה כ־11 יום']]);
    S.render([{l:'מחלקים ב־19',v:`(${NUM(y)} − 1) ÷ 19 = ${NUM(c)}, שארית ${r}`},
      {l:'המקום במחזור',v:`מחזור ${NUM(c+1)}, שנה ${pos}`},
      {l:'האם השנה בגו״ח אדז״ט?',v:L?`כן: ${pos} ברשימה`:`לא: ${pos} לא ברשימה`},
      {l:'בדיקה מהירה בנוסחה',v:nm(`(7 × ${y} + 1) mod 19 = ${v}`),s:`${v} ${v<7?'קטן מ־7 → מעוברת':'לא קטן מ־7 → פשוטה'}`},
      {l:yearHeb(y),v:L?'<span class="tag leap">שנה מעוברת: 13 חודשים</span>':'<span class="tag moon">שנה פשוטה: 12 חודשים</span>',c:'final'}]);});
})();

// 5 molad engine
(function(){
  const S=stepsBox($('#s5')),sel=$('#c5m');let y=CUR;
  function fill(){const keep=sel.selectedIndex<0?0:sel.selectedIndex;const ms=monthsOf(y);sel.innerHTML=ms.map((m,i)=>`<option value="${i}">${m[0]}</option>`).join('');sel.selectedIndex=Math.min(keep,ms.length-1);}
  function draw(){const mi=+sel.value||0,Y=y-1,c=Math.floor(Y/19),r=Y%19,b=Math.floor((7*r+1)/19),a=r-b,name=monthsOf(y)[mi][0];
    let run=BAHRAD;const rows=[{l:'מתחילים מבהר״ד',v:sg(fmtMolad(run))}];
    const add=(cnt,ex,lab)=>{const prod=cnt*ex;run=wk(run+prod);rows.push({l:`${lab}: ${NUM(cnt)} × ${fmtDur(ex)}`,v:`= ${dhp(prod)} → בלי שבועות: ${sg(fmtDur(prod%P_WEEK))}`,s:`סכום עד כאן: ${sg(fmtMolad(run))}`});};
    add(c,EX.cycle,'מחזורים קטנים');add(a,EX.pashut,'שנים פשוטות');add(b,EX.meubar,'שנים מעוברות');if(mi>0)add(mi,EX.month,`חודשים מתשרי עד ${name}`);
    const direct=moladTotal(y,mi);
    rows.push({l:`מולד ${name} ${yearHeb(y)}`,v:sg(fmtMolad(run)),s:`${civilTxt(run)} · בדיקה ישירה: ${NUM(monthsBefore(y)+mi)} חודשים × ${NUM(P_MONTH)} חלקים ${wk(direct)===run?'✓ זהה':'✗'}`,c:'final'});
    S.render(rows);
    $('#v5').innerHTML=wheel({markers:[{x:BAHRAD,cls:'leap',label:'בהר״ד'},{x:run,cls:'moon',label:'מולד'}],center:['מולד '+name,fmtMolad(run),yearHeb(y)],aria:'מולד החודש'});}
  yearCtl($('#c5y'),CUR,v=>{y=v;fill();draw();});sel.onchange=draw;
})();

// 6 great cycle
(function(){
  const S=stepsBox($('#s6'));
  const hTxt=H=>{H=((H%168)+168)%168;const d=Math.floor(H/24),h=H-d*24,wh=Math.floor(h),half=h!==wh;const ch=(18+wh)%24,cd=wh<6?(d+6)%7:d;
    return {d,txt:`יום ${DAY_LETTER[d]}׳, ${wh}${half?'½':''} שעות`,civ:`${cd===6?'שבת':'יום '+DAY_NAME[cd]} ${nm(String(ch).padStart(2,'0')+(half?':30':':00'))}`,parts:Math.round(H*P_HOUR)};};
  yearCtl($('#c6y'),CUR,y=>{const G=Math.floor((y-1)/28)+1,n=(y-1)%28+1,N=72+30*(n-1);
    const tk=[['תשרי',N-15],['טבת',N-7.5],['ניסן',N],['תמוז',N+7.5]].map(([m,H])=>[m,hTxt(H)]);
    const nb=n===1?y:y+(29-n);const nbG=gDate(pesachDay(nb)).getUTCFullYear();
    $('#v6').innerHTML=ring(28,{cls:i=>i===1?'rm':'rp',cur:n,center:['מחזור גדול '+NUM(G),`שנה ${n}`,n===1?'ברכת החמה':''],aria:'מחזור של 28 שנה'})+
      wheel({markers:tk.map(([m,o],i)=>({x:o.parts,cls:i===2?'moon':'leap',label:m})),center:['תקופות',yearHeb(y),''],aria:'ארבע התקופות על גלגל השבוע'});
    S.render([{l:'מחלקים ב־28',v:`(${NUM(y)} − 1) ÷ 28 = ${NUM(G-1)}, שארית ${n-1}`,s:`מחזור גדול ${NUM(G)}, שנה ${n}`},
      {l:'תקופת ניסן',v:`ליל ד׳ (0 שעות) + ${n-1} × יום ו־6 שעות`,s:`= ${tk[2][1].txt}`},
      ...tk.map(([m,o])=>({l:`תקופת ${m}`,v:o.txt,s:`בשעון: ${o.civ}`})),
      {l:'ברכת החמה הבאה',v:nb===y?`השנה, בניסן ${yearHeb(y)} (${nm(nbG)})`:`ניסן ${yearHeb(nb)} (${nm(nbG)}), בעוד ${nb-y} שנים`,c:'final'}]);});
})();

// 7 year types
(function(){
  const S=stepsBox($('#s7'));
  yearCtl($('#c7y'),CUR,y=>{const a=rh(y),b=rh(y+1),len=b.day-a.day,t=yearType(len),L=isLeap(y),ms=monthsOf(y);
    $('#v7').innerHTML=`<p class="vt">החודשים של ${yearHeb(y)}</p><div class="mstrip">${ms.map(([m,d])=>`<div class="${m==='חשוון'||m==='כסלו'?'flex':''} ${m==='אדר א׳'?'lp':''}"><small>${m}</small><b>${d}</b></div>`).join('')}</div>`+legend([['var(--moon-soft)','החודשים הגמישים'],['var(--leap-soft)','חודש העיבור']]);
    S.render([{l:`ראש השנה ${yearHeb(y)}`,v:`${dayWord(a.day)} ${gStr(a.day)}`},{l:`ראש השנה ${yearHeb(y+1)}`,v:`${dayWord(b.day)} ${gStr(b.day)}`},
      {l:'מחסירים',v:`${len} ימים`,s:L?'שנה מעוברת: 383, 384 או 385':'שנה פשוטה: 353, 354 או 355'},
      {l:'חשוון וכסלו',v:`חשוון ${ms[1][1]}, כסלו ${ms[2][1]}`},
      {l:'סוג השנה',v:`<span class="tag ${t==='ח'?'bad':t==='ש'?'ok':'moon'}">${TYPE_NAME[t]}</span> ${L?'מעוברת':'פשוטה'}`,c:'final'}]);});
})();

// 8 ADU
(function(){
  const S=stepsBox($('#s8')),host=$('#c8');let d=3;
  host.innerHTML='אבגדהוז'.split('').map((l,i)=>`<button type="button" data-d="${i}" class="${[0,3,5].includes(i)?'bad':''}"><b>${l}</b><small>${DAY_NAME[i]}</small></button>`).join('');
  const bs=host.querySelectorAll('button');
  function draw(){bs.forEach(b=>b.setAttribute('aria-pressed',+b.dataset.d===d));const yk=(d+9)%7,hr=(d+20)%7,bad=[0,3,5].includes(d);
    const ykBad=yk===5||yk===0,hrBad=hr===6;
    $('#v8').innerHTML=wheel({days:[ 'bad','','','bad','','bad',''],markers:[{x:d*P_DAY+P_DAY/2,cls:bad?'shift':'ok',label:'ר״ה'},{x:yk*P_DAY+P_DAY/2,cls:ykBad?'shift':'leap',label:'יוה״כ'},{x:hr*P_DAY+P_DAY*0.62,cls:hrBad?'shift':'leap',label:'הוש״ר'}],center:['ראש השנה ב',dayWord(d),bad?'אסור':'מותר'],aria:'ימי אד״ו'})+legend([['var(--shift-soft)','א, ד, ו: ראש השנה לא חל בהם']]);
    S.render([{l:'ראש השנה',v:dayWord(d)},
      {l:'יום כיפור (י׳ תשרי): 9 ימים אחרי',v:dayWord(yk),s:ykBad?(yk===5?'יום שישי: צמוד לשבת שאחריו':'יום ראשון: צמוד לשבת שלפניו'):'לא צמוד לשבת',c:ykBad?'bad':''},
      {l:'הושענא רבה (כ״א תשרי): 20 ימים אחרי',v:dayWord(hr),s:hrBad?'שבת: חביטת הערבה מתבטלת':'',c:hrBad?'bad':''},
      {l:'המסקנה',v:bad?`<span class="tag bad">אסור</span> דוחים ל${dayWord(d+1)}`:'<span class="tag ok">מותר</span>',c:bad?'bad':'good'}]);}
  bs.forEach(b=>b.onclick=()=>{d=+b.dataset.d;draw();});draw();
  chips($('#f8'),'שנים שבהן רק לא אד״ו דחה:',findYears(y=>{const r=rh(y);return r.rules.length===1&&r.rules[0]==='adu';},CUR,CUR+60,6),y=>{d=rh(y).moladDay%7;draw();});
})();

// 9 zaken
(function(){
  const S=stepsBox($('#s9'));let C;
  function draw(){const m=C.get(),z=m.h>=18;const r=rhFrom(m.t,false,false,{gatrad:true,betu:true});
    $('#v9').innerHTML=`<p class="vt">${dayWord(m.d)}: מ־18:00 בערב שלפניו עד 18:00</p>`+dayBand({at:m.h+m.p/1080,label:'המולד',th:18,thLabel:'18 שעות = 12:00 בצהריים',next:z});
    const rows=[{l:'המולד',v:sg(fmtMolad(m.t)),s:civilTxt(m.t)},{l:'18 שעות ומעלה?',v:z?`כן: ${m.h} שעות`:`לא: ${m.h} שעות`,s:z?'אחרי חצות היום: הלבנה לא תיראה הערב':'לפני חצות היום: הלבנה תיראה סמוך לשקיעה',c:z?'bad':''}];
    if(z)rows.push({l:'דוחים ליום הבא',v:dayWord(m.d+1)});
    const cand=z?(m.d+1)%7:m.d;
    rows.push({l:'האם היום הזה אד״ו?',v:[0,3,5].includes(cand)?`כן: ${dayWord(cand)} ← דוחים ל${dayWord(cand+1)}`:'לא',c:[0,3,5].includes(cand)?'bad':''});
    rows.push({l:'ראש השנה',v:dayWord(r.day),c:'final'});S.render(rows);}
  C=moladCtl($('#c9'),{d:1,h:18,p:187},'',draw);draw();
  chips($('#f9'),'שנים עם מולד זקן:',findYears(y=>rh(y).rules[0]==='zaken',CUR,CUR+40,6),y=>{const r=rh(y),s=splitParts(r.t%P_WEEK);C.set({d:s.d,h:s.h,p:s.p});draw();});
})();

// 10 gatrad
(function(){
  const S=stepsBox($('#s10'));let C;
  const okLen=(n,L)=>L?n>=383&&n<=385:n>=353&&n<=355;
  function draw(){const m=C.get(),L=C.host.querySelector('#g10l').checked;
    const ap=m.d===2&&!L&&(m.h*P_HOUR+m.p)>=9*P_HOUR+204&&m.h<18;
    const no=rhFrom(m.t,L,false,{gatrad:true}),yes=rhFrom(m.t,L,false);
    const t2=m.t+(L?13:12)*P_MONTH,n2=rhFrom(t2,false,L);
    const lenNo=n2.day-no.day,lenYes=n2.day-yes.day;
    $('#v10').innerHTML=wheel({markers:[{x:m.t,cls:'moon',label:'השנה'},{x:t2,cls:'leap',label:'הבאה'}],arcs:[{from:m.t,to:m.t+(L?EX.meubar:EX.pashut),cls:'leap'}],ticks:[{x:2*P_DAY+9*P_HOUR+204,cls:'shift'},{x:6*P_DAY+18*P_HOUR,cls:'shift'}],days:Object.assign([],{[yes.day%7]:'ok'}),center:['+ שנה',L?'ה׳ כ״א תקפ״ט':'ד׳ ח׳ תתע״ו',ap?'גטר״ד חלה':'גטר״ד לא חלה'],aria:'גטר״ד על גלגל השבוע'})+legend([['var(--moon)','מולד השנה'],['var(--leap)','מולד השנה הבאה'],['var(--shift)','הקווים: ג׳ ט׳ ר״ד ושבת 18 שעות']]);
    const conds=[`יום ג׳ ${m.d===2?'✓':'✗'}`,`שנה פשוטה ${!L?'✓':'✗'}`,`ט׳ ר״ד ומעלה ${(m.h*P_HOUR+m.p)>=9*P_HOUR+204?'✓':'✗'}`,`לא מולד זקן ${m.h<18?'✓':'✗'}`];
    S.render([{l:'מולד השנה',v:sg(fmtMolad(m.t)),s:civilTxt(m.t)},
      {l:'תנאי גטר״ד',v:conds.join(' · '),c:ap?'bad':''},
      {l:'בלי הדחייה: ראש השנה',v:dayWord(no.day),s:no.rules.length?'אחרי '+no.rules.map(k=>RULE_NAME[k]).join(', '):''},
      {l:`מולד השנה הבאה: + ${L?'ה׳ כ״א תקפ״ט':'ד׳ ח׳ תתע״ו'}`,v:sg(fmtMolad(t2)),s:civilTxt(t2)},
      {l:'ראש השנה הבא',v:dayWord(n2.day),s:n2.rules.length?n2.rules.map(k=>RULE_NAME[k]).join(' ← '):'בלי דחייה'},
      {l:'אורך השנה בלי הדחייה',v:`${lenNo} ימים ${okLen(lenNo,L)?'<span class="tag ok">תקין</span>':'<span class="tag bad">אסור</span>'}`,c:okLen(lenNo,L)?'':'bad'},
      {l:ap?'עם הדחייה: ראש השנה':'הדחייה לא חלה: ראש השנה',v:`${dayWord(yes.day)} · השנה ${lenYes} ימים ${okLen(lenYes,L)?'<span class="tag ok">תקין</span>':'<span class="tag bad">אסור</span>'}`,c:'final'}]);}
  C=moladCtl($('#c10'),{d:2,h:9,p:204},'<label class="chk"><input type="checkbox" id="g10l">השנה מעוברת</label>',draw);draw();
  chips($('#f10'),'שנים שבהן חלה גטר״ד:',findYears(y=>rh(y).rules.includes('gatrad'),5600,6100,6),y=>{const r=rh(y),s=splitParts(r.t%P_WEEK);C.set({d:s.d,h:s.h,p:s.p});$('#g10l').checked=isLeap(y);draw();});
})();

// 11 betu
(function(){
  const S=stepsBox($('#s11'));let C;
  function draw(){const m=C.get(),PL=C.host.querySelector('#g11p').checked;
    const ap=m.d===1&&PL&&(m.h*P_HOUR+m.p)>=15*P_HOUR+589&&m.h<18;
    const t0=m.t-(PL?13:12)*P_MONTH,p0=rhFrom(t0,PL,false);
    const no=rhFrom(m.t,false,PL,{betu:true}),yes=rhFrom(m.t,false,PL);
    const lenNo=no.day-p0.day,lenYes=yes.day-p0.day,ok=n=>PL?n>=383&&n<=385:n>=353&&n<=355;
    $('#v11').innerHTML=wheel({markers:[{x:t0,cls:'leap',label:'שעברה'},{x:m.t,cls:'moon',label:'השנה'}],arcs:[{from:t0,to:t0+(PL?EX.meubar:EX.pashut),cls:'leap'}],ticks:[{x:1*P_DAY+15*P_HOUR+589,cls:'shift'},{x:2*P_DAY+18*P_HOUR,cls:'shift'}],days:Object.assign([],{[yes.day%7]:'ok'}),center:['− שנה',PL?'ה׳ כ״א תקפ״ט':'ד׳ ח׳ תתע״ו',ap?'בטו תקפט חלה':'בטו תקפט לא חלה'],aria:'בטו תקפט על גלגל השבוע'})+legend([['var(--leap)','מולד השנה שעברה'],['var(--moon)','מולד השנה'],['var(--shift)','הקווים: ב׳ ט״ו תקפ״ט וג׳ 18 שעות']]);
    const conds=[`יום ב׳ ${m.d===1?'✓':'✗'}`,`שעברה מעוברת ${PL?'✓':'✗'}`,`ט״ו תקפ״ט ומעלה ${(m.h*P_HOUR+m.p)>=15*P_HOUR+589?'✓':'✗'}`,`לא מולד זקן ${m.h<18?'✓':'✗'}`];
    S.render([{l:'מולד השנה',v:sg(fmtMolad(m.t)),s:civilTxt(m.t)},
      {l:'תנאי בטו תקפט',v:conds.join(' · '),c:ap?'bad':''},
      {l:`מולד השנה שעברה: − ${PL?'ה׳ כ״א תקפ״ט':'ד׳ ח׳ תתע״ו'}`,v:sg(fmtMolad(t0)),s:civilTxt(t0)},
      {l:'ראש השנה שעבר',v:dayWord(p0.day),s:p0.rules.length?p0.rules.map(k=>RULE_NAME[k]).join(' ← '):'בלי דחייה'},
      {l:'בלי הדחייה: ראש השנה',v:dayWord(no.day)},
      {l:'אורך השנה שעברה בלי הדחייה',v:`${lenNo} ימים ${ok(lenNo)?'<span class="tag ok">תקין</span>':'<span class="tag bad">אסור</span>'}`,c:ok(lenNo)?'':'bad'},
      {l:ap?'עם הדחייה: ראש השנה':'הדחייה לא חלה: ראש השנה',v:`${dayWord(yes.day)} · השנה שעברה ${lenYes} ימים ${ok(lenYes)?'<span class="tag ok">תקין</span>':'<span class="tag bad">אסור</span>'}`,c:'final'}]);}
  C=moladCtl($('#c11'),{d:1,h:15,p:589},'<label class="chk"><input type="checkbox" id="g11p" checked>השנה שעברה מעוברת</label>',draw);draw();
  chips($('#f11'),'שנים שבהן חלה בטו תקפט:',findYears(y=>rh(y).rules.includes('betu'),5400,6400,6),y=>{const r=rh(y),s=splitParts(r.t%P_WEEK);C.set({d:s.d,h:s.h,p:s.p});$('#g11p').checked=isLeap(y-1);draw();});
})();

// 12 keviut
(function(){
  const S=stepsBox($('#s12'));const freq={},from=5000,to=5999;
  for(let y=from;y<=to;y++){const k=keviut(y);freq[k]=(freq[k]||0)+1;}
  const ORDER=['בחג','בשה','גכה','הכז','השא','זחא','זשג','בחה','בשז','גכז','החא','השג','זחג','זשה'];
  const LET={'א':0,'ב':1,'ג':2,'ד':3,'ה':4,'ו':5,'ז':6};
  let ctl;
  function draw(y){const k=keviut(y),a=rh(y),len=yearLen(y),pd=pesachDay(y),b=rh(y+1);
    $('#v12').innerHTML=`<table class="kt"><thead><tr><th>סימן</th><th>ראש השנה</th><th>סוג</th><th>פסח</th><th>שנה</th><th>שכיחות</th></tr></thead><tbody>${ORDER.map((s,i)=>`<tr class="${s===k?'hl':''}"><td class="sig">${s}</td><td>${dayWord(LET[s[0]])}</td><td>${TYPE_NAME[s[1]]}</td><td>${dayWord(LET[s[2]])}</td><td>${i<7?'פשוטה':'מעוברת'}</td><td class="num">${((freq[s]||0)/(to-from+1)*100).toFixed(1)}%</td></tr>`).join('')}</tbody></table><p class="note">השכיחות נספרה על השנים ה׳–ה׳תתקצ״ט</p>`;
    S.render([{l:'ראש השנה',v:`${dayWord(a.day)} ← ${sg(k[0])}`},{l:'אורך השנה',v:`${len} ימים ← ${TYPE_NAME[k[1]]} ← ${sg(k[1])}`},
      {l:`ראש השנה ${yearHeb(y+1)}`,v:dayWord(b.day)},{l:'פסח = ראש השנה הבא פחות 163 ימים',v:`${dayWord(pd)} ${gStr(pd)} ← ${sg(k[2])}`},
      {l:`הקביעות של ${yearHeb(y)}`,v:sg(k),c:'final'}]);
    chips($('#f12'),'השנים הבאות:',Array.from({length:8},(_,i)=>y+1+i),v=>ctl.set(v),v=>`${yearHeb(v).replace(/^ה׳/,'')} ${keviut(v)}`);}
  ctl=yearCtl($('#c12y'),CUR,draw);
})();

// 13 full calculator
(function(){
  const S=stepsBox($('#s13'));
  calcCtl=yearCtl($('#c13y'),CUR,y=>{const r=rh(y),L=isLeap(y),PL=isLeap(y-1),m=monthsBefore(y),c=Math.floor((y-1)/19),pos=(y-1)%19+1,G=Math.floor((y-1)/28)+1,n=(y-1)%28+1;
    const {h,p}=splitParts(r.t%P_DAY),wd=r.wd,PP=h*P_HOUR+p;const len=yearLen(y),t=yearType(len),k=keviut(y),pd=pesachDay(y);
    const z=PP>=18*P_HOUR,g=!z&&wd===2&&!L&&PP>=9*P_HOUR+204,bt=!z&&!g&&wd===1&&PL&&PP>=15*P_HOUR+589;const cand=r.day-(r.rules.includes('adu')?1:0);
    const yes='<span class="tag bad">חלה</span>',no='<span class="tag ok">לא חלה</span>';
    const g1=gDate(r.day).getUTCFullYear(),g2=gDate(rh(y+1).day-1).getUTCFullYear();
    S.render([
      {l:'השנה',v:`${sg(yearHeb(y))} (${nm(y)})`,s:g1>99?`בערך ${nm(g1+'–'+g2)}`:''},
      {l:'מחזור קטן',v:`מחזור ${NUM(c+1)}, שנה ${pos} · ${L?'<span class="tag leap">מעוברת</span>':'פשוטה'}`,s:`השנה שעברה ${PL?'מעוברת':'פשוטה'}`},
      {l:'מחזור גדול',v:`מחזור ${NUM(G)}, שנה ${n}`,s:n===1?'שנת ברכת החמה':''},
      {l:'חודשים מבהר״ד',v:NUM(m),s:`${NUM(c)} × 235 + ${pos-1} שנים במחזור`},
      {l:'מולד תשרי',v:sg(fmtMolad(r.t)),s:civilTxt(r.t)},
      {l:'מולד זקן',v:z?yes:no,s:z?`${h} שעות: 18 ומעלה`:`${h} שעות: לפני 18`,c:z?'bad':''},
      {l:'גטר״ד',v:g?yes:no,s:z?'לא נבדקת: מולד זקן כבר דחה':`יום ${DAY_LETTER[wd]}׳ ${wd===2?'✓':'✗'} · פשוטה ${!L?'✓':'✗'} · ט׳ ר״ד ומעלה ${PP>=9*P_HOUR+204?'✓':'✗'}`,c:g?'bad':''},
      {l:'בטו תקפט',v:bt?yes:no,s:(z||g)?'לא נבדקת: דחייה אחרת כבר חלה':`יום ${DAY_LETTER[wd]}׳ ${wd===1?'✓':'✗'} · שעברה מעוברת ${PL?'✓':'✗'} · ט״ו תקפ״ט ומעלה ${PP>=15*P_HOUR+589?'✓':'✗'}`,c:bt?'bad':''},
      {l:'לא אד״ו',v:r.rules.includes('adu')?yes:no,s:`היום המועמד: ${dayWord(cand)}${r.rules.includes('adu')?` ← ${dayWord(r.day)}`:''}`,c:r.rules.includes('adu')?'bad':''},
      {l:'ראש השנה',v:`${dayWord(r.day)} ${gStr(r.day)}`,c:'final'},
      {l:'אורך השנה',v:`${len} ימים · ${TYPE_NAME[t]}`,s:`ראש השנה הבא: ${dayWord(rh(y+1).day)} ${gStr(rh(y+1).day)}`},
      {l:'קביעות',v:sg(k),s:`פסח: ${dayWord(pd)} ${gStr(pd)}`,c:'final'}]);
    $('#v13m').innerHTML=`<div class="mstrip">${monthsOf(y).map(([mm,d])=>`<div class="${mm==='חשוון'||mm==='כסלו'?'flex':''} ${mm==='אדר א׳'?'lp':''}"><small>${mm}</small><b>${d}</b></div>`).join('')}</div>`;
    $('#v13w').innerHTML=wheel({markers:[{x:r.t,cls:'moon',label:'מולד'}],arcs:r.rules.length?[{from:r.t,to:r.t+(r.day*P_DAY+P_DAY/2-r.t),cls:'shift'}]:[],days:Object.assign([],{[r.day%7]:'ok'}),center:[yearHeb(y),k,dayWord(r.day)],aria:'מולד וראש השנה'});});
})();

// ===== ניווט =====
let cur=0;const toc=$('#toc'),prog=$('#prog');
toc.innerHTML=slides.map((s,i)=>`<option value="${i}">${i}. ${s.dataset.title}</option>`).join('');
prog.innerHTML=slides.map((s,i)=>`<button type="button" aria-label="${s.dataset.title}"></button>`).join('');
prog.querySelectorAll('button').forEach((b,i)=>b.onclick=()=>go(i));
function go(i){i=Math.max(0,Math.min(slides.length-1,i));slides[cur].classList.remove('active');cur=i;slides[cur].classList.add('active');slides[cur].scrollTop=0;toc.value=i;
  prog.querySelectorAll('button').forEach((b,j)=>{b.className=j<i?'on':j===i?'cur':'';});
  $('#prevBtn').disabled=i===0;if(window.onSlideShown)window.onSlideShown(slides[cur]);$('#nextBtn').disabled=i===slides.length-1;try{history.replaceState(null,'','#'+i);}catch(e){}}
toc.onchange=()=>go(+toc.value);$('#prevBtn').onclick=()=>go(cur-1);$('#nextBtn').onclick=()=>go(cur+1);
document.addEventListener('keydown',e=>{const tg=e.target.tagName;if(['INPUT','SELECT','TEXTAREA'].includes(tg))return;
  if(e.key==='ArrowLeft'||e.key==='PageDown'){e.preventDefault();go(cur+1);}else if(e.key==='ArrowRight'||e.key==='PageUp'){e.preventDefault();go(cur-1);}});
$('#themeBtn').onclick=()=>{const r=document.documentElement,dark=r.dataset.theme?r.dataset.theme==='dark':matchMedia('(prefers-color-scheme: dark)').matches;r.dataset.theme=dark?'light':'dark';};
$('#fsBtn').onclick=()=>{try{document.fullscreenElement?document.exitFullscreen():document.documentElement.requestFullscreen();}catch(e){}};
go(Math.max(0,Math.min(slides.length-1,parseInt((location.hash||'#0').slice(1))||0)));
