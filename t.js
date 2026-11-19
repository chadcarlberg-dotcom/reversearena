/* Reverse Arena visit log: who opened the site, what they pressed, how long they stayed. First-party, no cookies, no third parties. */
(()=>{ 'use strict';
if(/claude\.ai|claudeusercontent|localhost|127\.0\.0\.1/.test(location.hostname)||location.protocol==='file:') return;
const EP='https://success.dance/ra/t.php';
const LS=(k,v)=>{ try{ if(v===undefined) return localStorage.getItem(k); localStorage.setItem(k,v); }catch(e){ return null; } };
const rnd=()=>Math.random().toString(36).slice(2,10)+Date.now().toString(36);
const q=new URLSearchParams(location.search);
if(q.get('me')) LS('ra_me','1'); if(q.get('for')) LS('ra_for',q.get('for').slice(0,40));
let vid=LS('ra_vid'); if(!vid){ vid=rnd(); LS('ra_vid',vid); }
let sid; try{ sid=sessionStorage.getItem('ra_sid'); if(!sid){ sid=rnd(); sessionStorage.setItem('ra_sid',sid); } }catch(e){ sid=rnd(); }
const PAGE=document.querySelector('.pg')?'dossier':'site'; const t0=Date.now();
const send=(e,d)=>{ const body=JSON.stringify({s:sid,v:vid,w:LS('ra_for')||'',me:LS('ra_me')?1:0,p:PAGE,e:e,d:d===undefined?null:d,t:Math.round((Date.now()-t0)/1000)});
  try{ if(navigator.sendBeacon&&navigator.sendBeacon(EP,new Blob([body],{type:'text/plain'}))) return; }catch(_){}
  try{ fetch(EP,{method:'POST',mode:'no-cors',keepalive:true,body:body}); }catch(_){} };
window.__raTrack=send;
send('open',{ref:(document.referrer||'').slice(0,120),w:innerWidth,h:innerHeight,lang:navigator.language||'',tz:(()=>{ try{ return Intl.DateTimeFormat().resolvedOptions().timeZone||''; }catch(e){ return ''; } })()});
let vis=!document.hidden, act=0, last=Date.now();
const tick=()=>{ const n=Date.now(); if(vis) act+=n-last; last=n; };
document.addEventListener('visibilitychange',()=>{ tick(); vis=!document.hidden; send(vis?'back':'away',{on:Math.round(act/1000)}); });
setInterval(()=>{ tick(); if(vis) send('hb',{on:Math.round(act/1000)}); },30000);
addEventListener('pagehide',()=>{ tick(); send('leave',{on:Math.round(act/1000)}); });
const on=(sel,ev,fn)=>{ document.addEventListener(ev,x=>{ const el=x.target&&x.target.closest?x.target.closest(sel):null; if(el) fn(el,x); },true); };
const film=(v,name)=>{ if(!v||v.__ra) return; v.__ra=1; let mark=0;
  v.addEventListener('play',()=>send(name+'_play',{at:Math.round(v.currentTime)}));
  v.addEventListener('pause',()=>{ if(!v.ended) send(name+'_pause',{at:Math.round(v.currentTime)}); });
  v.addEventListener('ended',()=>send(name+'_end',{at:Math.round(v.currentTime)}));
  v.addEventListener('timeupdate',()=>{ const m=Math.floor(v.currentTime/15); if(m>mark&&!v.paused){ mark=m; send(name+'_at',{at:m*15}); } });
  v.addEventListener('seeked',()=>{ mark=Math.floor(v.currentTime/15); }); };
if(PAGE==='site'){
  const hook=()=>film(document.getElementById('introVid'),'film'); hook(); setTimeout(hook,1500); setTimeout(hook,5000);
  on('#introPlay','click',()=>send('press_play'));
  on('#introSkip','click',()=>{ const v=document.getElementById('introVid'); send('skip',{at:v?Math.round(v.currentTime):0}); });
  on('#chConsorci','click',()=>send('btn_consorci')); on('#chTour','click',()=>send('btn_tour')); on('#chDesign','click',()=>send('btn_design')); on('#chAgain','click',()=>send('btn_replay'));
  on('#filmBtn','click',()=>send('btn_film'));
  const tt=()=>{ const el=document.getElementById('tTitle'); if(!el||el.__ra) return; el.__ra=1; let lastT='';
    new MutationObserver(()=>{ const s=(el.textContent||'').trim().slice(0,60); if(s&&s!==lastT){ lastT=s; send('tour_step',{title:s}); } }).observe(el,{childList:true,characterData:true,subtree:true}); };
  tt(); setTimeout(tt,4000);

  // Look around the room + the tour + the show: which controls, how far the tour got. Tiny payloads, first-party only.
  const cnt={}; const lim=(k,n)=>{ cnt[k]=(cnt[k]||0)+1; return cnt[k]<=n; };
  on('[data-view]','click',b=>send('look_view',{what:(b.dataset.view||'').slice(0,10)}));
  document.addEventListener('change',x=>{ if(x.target&&x.target.id==='roomSel') send('look_room',{what:String(x.target.value||'').slice(0,30)}); if(x.target&&x.target.id==='footage') send('look_footage',{what:String(x.target.value||'').slice(0,30)}); },true);
  on('#scenes button','click',b=>send('look_footage',{what:(b.textContent||'').trim().slice(0,30)}));
  let gt=0; document.addEventListener('input',x=>{ if(x.target&&x.target.id==='gap'){ clearTimeout(gt); const val=x.target.value; gt=setTimeout(()=>send('look_screens',{what:'gap '+val}),900); } },true);
  on('#djScr,#ezScr','click',()=>send('look_screens',{what:'open/close'})); on('#djL,#ezL','click',()=>{ if(lim('turn',30)) send('look_turn',{what:'left'}); }); on('#djR,#ezR','click',()=>{ if(lim('turn',30)) send('look_turn',{what:'right'}); });
  on('#dial','click',()=>{ if(lim('turn',30)) send('look_turn',{what:'dial'}); });
  on('#djFloor','click',()=>send('look_btn',{what:'floor'})); on('#lift','click',()=>send('look_btn',{what:'lifts'})); on('#fx','click',()=>send('look_btn',{what:'effects'})); on('#ctlBtn','click',()=>send('look_btn',{what:'show control'}));
  on('#aud','click',()=>send('look_btn',{what:'audience'})); on('#house','click',()=>send('look_btn',{what:'house lights'})); on('#snd','click',()=>send('look_btn',{what:'sound'})); on('#ctlTog','click',()=>send('look_btn',{what:'controls'}));
  on('#ezMode','click',()=>send('look_btn',{what:'mode'})); on('#ezShowL,#ezHouseL','click',el=>send('look_btn',{what:el.id==='ezHouseL'?'house lights':'show lights'})); on('#ezAll','click',()=>send('look_btn',{what:'all controls'}));
  on('#menuBtn,#djX','click',()=>send('look_btn',{what:'back to menu'}));
  // a tap (not a drag) on the room picture = trying a seat
  const gl=document.getElementById('gl'); if(gl){ let dn=null; gl.addEventListener('pointerdown',x=>{ dn={x:x.clientX,y:x.clientY,t:Date.now()}; },true); gl.addEventListener('pointerup',x=>{ if(dn&&Math.abs(x.clientX-dn.x)<8&&Math.abs(x.clientY-dn.y)<8&&Date.now()-dn.t<500&&lim('seat',40)) send('look_seat',{what:'tap'}); dn=null; },true); }
  // the tour: how far it got ("Step 3 of 9"), and its buttons
  const ts=()=>{ const el=document.getElementById('tStep'); if(!el||el.__ra2) return; el.__ra2=1; let lastS='';
    new MutationObserver(()=>{ const s=(el.textContent||'').trim(); const m=s.match(/(\d+)\D+(\d+)/); if(s&&s!==lastS&&m){ lastS=s; send('tour_n',{n:+m[1],of:+m[2]}); } }).observe(el,{childList:true,characterData:true,subtree:true}); };
  ts(); setTimeout(ts,4000);
  on('#tNext','click',()=>send('tour_go',{what:'next'})); on('#tBack','click',()=>send('tour_go',{what:'back'})); on('#tExit','click',()=>send('tour_go',{what:'left tour'})); on('#tDots','click',()=>send('tour_go',{what:'dot'}));
  on('#tourBtn','click',()=>send('tour_go',{what:'tour button'}));
  // the show (sStep/sTitle): which part
  const ss=()=>{ const el=document.getElementById('sTitle'); if(!el||el.__ra2) return; el.__ra2=1; let lastS='';
    new MutationObserver(()=>{ const s=(el.textContent||'').trim().slice(0,40); if(s&&s!==lastS){ lastS=s; send('show_step',{what:s}); } }).observe(el,{childList:true,characterData:true,subtree:true}); };
  ss(); setTimeout(ss,4000); on('#showBtn','click',()=>send('show_step',{what:'show button'})); on('#sNext,#sPause,#sAgain','click',el=>send('show_step',{what:el.id==='sNext'?'next':el.id==='sPause'?'pause':'again'}));
} else {
  film(document.getElementById('filmv'),'dfilm'); document.querySelectorAll('video').forEach(v=>{ if(v.id!=='filmv') film(v,'clip'); });
  on('a.pdf[data-es-href]','click',a=>send('pdf',{file:(a.getAttribute('href')||'').split('/').pop()}));
  on('a.pdf.back','click',()=>send('btn_back')); on('.lang button','click',b=>send('lang',{l:b.dataset.l||''}));
  on('a.btn,button.btn,.playbig','click',b=>send('btn',{label:(b.textContent||b.getAttribute('aria-label')||'').trim().slice(0,50)}));
  const dwell={}, seen=[]; let cur=null, since=Date.now(), tm=0;
  const idx=id=>[...document.querySelectorAll('.pg')].findIndex(s=>s.id===id)+1;
  const flip=id=>{ const n=Date.now(); if(cur&&vis) dwell[cur]=(dwell[cur]||0)+(n-since); since=n; if(id!==cur){ cur=id; clearTimeout(tm); if(id) tm=setTimeout(()=>{ if(cur===id){ if(!seen.includes(id)) seen.push(id); send('page',{id:id,n:idx(id)}); } },1200); } };
  const look=()=>{ let best=null; for(const s of document.querySelectorAll('.pg')){ const r=s.getBoundingClientRect(); const v=Math.max(0,Math.min(innerHeight,r.bottom)-Math.max(0,r.top)); if(!best||v>best.v) best={v:v,id:s.id}; } if(best&&best.v>innerHeight*.35) flip(best.id); };
  let st=0; addEventListener('scroll',()=>{ clearTimeout(st); st=setTimeout(look,150); },{passive:true,capture:true}); setTimeout(look,800);
  addEventListener('pagehide',()=>{ flip(cur); const o={}; for(const k in dwell) o[k]=Math.round(dwell[k]/1000); send('pages',{seen:seen.length,dwell:o}); });
}
})();
