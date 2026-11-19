(async function(){
"use strict";
const __tick=()=>new Promise(r=>setTimeout(r,0));
const T=THREE, TAU=Math.PI*2, D2R=Math.PI/180, YAX=new T.Vector3(0,1,0);
window.__riseB=true; window.__riseB2=true;   /* v19: Stage 3 rise Option B2 is the show: the floor dancers' lightning lifts and holds her */
const $=s=>document.querySelector(s), $$=s=>[...document.querySelectorAll(s)];
const clamp=(v,a,b)=>Math.max(a,Math.min(b,v)), lerp=(a,b,t)=>a+(b-a)*t;
const ease=t=>t<.5?4*t*t*t:1-Math.pow(-2*t+2,3)/2;
const smooth=t=>t*t*(3-2*t);
const REDUCED=matchMedia('(prefers-reduced-motion: reduce)').matches;

// ---- venue dimensions, metres (Chad's locked figures: 27 m disc, stage ring 10 m deep and 1.0 m high, LED screens 7 m, rig about 8 m)
const R_DISC=13.5, STAGE_H=1.0, R_OUT=23.5, WALL_H=7, WALL_TOP=STAGE_H+WALL_H;
const R_SCREEN=15.5;                     // the two LED screens ride a track 2 m behind the stage lip, so a row of dancers performs in front of them
const SCREEN_ARC=Math.PI/2;              // each screen covers a quarter of the ring; closed, the pair gives the audience 180 degrees of picture
const PHI=(1+Math.sqrt(5))/2;            // the golden ratio: the rings overhead, the portals, the risers and the mapped set are all proportioned by it
const RING_A={r:11.4,y:10.2}, RING_B={r:11.4/PHI,y:10.9}, RING_C={r:11.4/PHI/PHI,y:11.5}, STAGE_TRUSS={r:18.4,y:11.6}, ROOM=25, ROOM_H=14.2, SEATS=600;
const JOINT=k=>stageAngle(k)+TAU/8;   // the four places where two stages meet; a presentation tunnel stands on each
const pol=(a,r,y)=>new T.Vector3(Math.sin(a)*r,y||0,-Math.cos(a)*r);
const stageAngle=k=>k*TAU/4;
const TEAMS_OLD=[
  {key:'A',name:'Gold',  hex:'#f2b544',hex2:'#ff7a2a'},
  {key:'B',name:'Blue',  hex:'#4aa8ff',hex2:'#35e0ff'},
  {key:'C',name:'Violet',hex:'#a66bff',hex2:'#ff5fd2'},
  {key:'D',name:'Red',   hex:'#ff5a4d',hex2:'#ffb347'}];
const TEAMS=[
  {key:'1',name:'Video',     hex:'#f2b544',hex2:'#ff7a2a'},
  {key:'2',name:'Light',     hex:'#3d6bff',hex2:'#ff3fa8'},
  {key:'3',name:'Motion',    hex:'#35e0ff',hex2:'#c8ff3d'},
  {key:'4',name:'Mapping',   hex:'#ff8a3d',hex2:'#27d3c2'}];
TEAMS.forEach(t=>{t.c=new T.Color(t.hex);t.c2=new T.Color(t.hex2);});

// ---- renderer
const canvas=$('#gl');
let renderer;
try{ renderer=new T.WebGLRenderer({canvas,antialias:true,powerPreference:'high-performance'}); }
catch(e){ $('#room').insertAdjacentHTML('beforeend','<div id="err">This model needs WebGL, which this browser or device has switched off.</div>'); throw e; }
renderer.setClearColor(0x04040a); renderer.shadowMap.enabled=true; renderer.shadowMap.type=T.PCFSoftShadowMap; renderer.shadowMap.autoUpdate=false;
const scene=new T.Scene();
// every object added to the room carries the part of the build it belongs to, so the tour can show the room piece by piece
const CAT={cur:'room'}; { const add=scene.add.bind(scene); scene.add=function(...o){ for(const x of o) if(x&&x.userData&&!x.userData.cat) x.userData.cat=CAT.cur; return add(...o); }; } scene.fog=new T.FogExp2(0x0a0812,.008);
const camera=new T.PerspectiveCamera(60,1,0.15,400);
let composer=null, bloom=null, grade=null;
const GRADE={uniforms:{tDiffuse:{value:null},uT:{value:0},uExp:{value:1.0}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:`precision highp float; uniform sampler2D tDiffuse; uniform float uT,uExp; varying vec2 vUv;
    void main(){ vec3 c=texture2D(tDiffuse,vUv).rgb*uExp;
      c=c/(1.+max(max(c.r,c.g),c.b)*.22)*1.2;                      // soft shoulder keeps hot LEDs from clipping to white
      c=mix(c,c*c*(3.-2.*c),.28);                                   // gentle contrast
      vec2 q=vUv-.5; c*=1.-dot(q,q)*.62;                            // vignette
      float g=fract(sin(dot(vUv*vec2(1733.,941.)+fract(uT)*61.,vec2(12.9898,78.233)))*43758.5453); c+=(g-.5)*.014;
      gl_FragColor=vec4(c,1.); }`};
if(T.EffectComposer&&T.RenderPass&&T.UnrealBloomPass){
  try{ let rt; if(renderer.capabilities.isWebGL2&&T.WebGLMultisampleRenderTarget){ rt=new T.WebGLMultisampleRenderTarget(4,4,{format:T.RGBAFormat}); rt.samples=4; }
    composer=new T.EffectComposer(renderer,rt); composer.addPass(new T.RenderPass(scene,camera));
    bloom=window.LX_OFF?new T.UnrealBloomPass(new T.Vector2(256,256),0.5,0.6,0.82):new T.UnrealBloomPass(new T.Vector2(256,256),0.55,0.6,0.78);   /* v23 lights: the lenses and pools glow hot */ composer.addPass(bloom);
    if(T.ShaderPass){ grade=new T.ShaderPass(GRADE); composer.addPass(grade); } }catch(e){ composer=null; }
}
function resize(){
  const r=$('#room'), w=Math.max(2,r.clientWidth), h=Math.max(2,r.clientHeight);
  const pr0=Math.min(window.devicePixelRatio||1, w<700?1.5:2), pr=Math.max(Math.min(pr0,.8),pr0*(window.__QS||1));   /* 16 Nov, his report: "the look around was really laggy" (7 frames a second at full sharpness on his Mac). The picture now gives up sharpness to stay smooth: __QS is lowered by the frame-time watch in u-ui.js loop() */
  renderer.setPixelRatio(pr); renderer.setSize(w,h,false);
  if(composer){ composer.setPixelRatio(pr); composer.setSize(w,h); }
  camera.aspect=w/h; camera.updateProjectionMatrix();
}
window.addEventListener('resize',resize);
if(window.ResizeObserver) new ResizeObserver(resize).observe($('#room'));

// ---- tweens
const tweens=[];
function tween(o,to,dur,opt){ opt=opt||{};
  for(const tw of tweens){ if(tw.o===o) for(const k in to) delete tw.to[k]; }
  const from={}; for(const k in to) from[k]=o[k];
  const tw={o,from,to:Object.assign({},to),t:0,dur:Math.max(.001,dur),e:opt.ease||ease,done:opt.done,upd:opt.upd}; tweens.push(tw); return tw; }
function runTweens(dt){ for(let i=tweens.length-1;i>=0;i--){ const tw=tweens[i]; tw.t+=dt; const u=Math.min(1,tw.t/tw.dur), e=tw.e(u);
  for(const k in tw.to) tw.o[k]=lerp(tw.from[k],tw.to[k],e); if(tw.upd) tw.upd(e); if(u>=1){ tweens.splice(i,1); if(tw.done) tw.done(); } } }

// ---- geometry builders. Angle a: 0 faces -Z (stage 1), growing clockwise seen from above.
function arcPanel(r,a0,a1,y0,y1,o){ o=o||{}; const inward=o.inward!==false, u0=o.u0||0, u1=o.u1===undefined?1:o.u1, v0=o.v0||0, v1=o.v1===undefined?1:o.v1;
  const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/(2.5*D2R))), P=[],N=[],U=[],A=[];
  const push=(a,y,u,v)=>{ P.push(Math.sin(a)*r,y,-Math.cos(a)*r); const s=inward?-1:1; N.push(s*Math.sin(a),0,-s*Math.cos(a)); U.push(u,v); A.push(a/TAU); };
  for(let i=0;i<n;i++){ const aa=lerp(a0,a1,i/n), ab=lerp(a0,a1,(i+1)/n), ua=lerp(u0,u1,i/n), ub=lerp(u0,u1,(i+1)/n);
    if(inward){ push(aa,y0,ua,v0);push(ab,y0,ub,v0);push(aa,y1,ua,v1); push(ab,y0,ub,v0);push(ab,y1,ub,v1);push(aa,y1,ua,v1); }
    else{ push(aa,y0,ua,v0);push(aa,y1,ua,v1);push(ab,y0,ub,v0); push(ab,y0,ub,v0);push(aa,y1,ua,v1);push(ab,y1,ub,v1); } }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('normal',new T.Float32BufferAttribute(N,3));
  g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); g.setAttribute('aAng',new T.Float32BufferAttribute(A,1)); return g; }
function ringSector(r0,r1,a0,a1,y){ const n=Math.max(1,Math.ceil(Math.abs(a1-a0)/(3*D2R))), P=[],N=[],U=[];
  const push=(a,r)=>{ P.push(Math.sin(a)*r,y,-Math.cos(a)*r); N.push(0,1,0); U.push((a-a0)/(a1-a0),(r-r0)/(r1-r0)); };
  for(let i=0;i<n;i++){ const aa=lerp(a0,a1,i/n), ab=lerp(a0,a1,(i+1)/n); push(aa,r0);push(ab,r0);push(aa,r1); push(ab,r0);push(ab,r1);push(aa,r1); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('normal',new T.Float32BufferAttribute(N,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); return g; }
function mergeGeos(list){ let n=0; const gs=list.map(g=>{ const q=g.index?g.toNonIndexed():g; n+=q.attributes.position.count; return q; });
  const P=new Float32Array(n*3), N=new Float32Array(n*3); let o=0;
  for(const g of gs){ P.set(g.attributes.position.array,o*3); N.set(g.attributes.normal.array,o*3); o+=g.attributes.position.count; }
  const out=new T.BufferGeometry(); out.setAttribute('position',new T.BufferAttribute(P,3)); out.setAttribute('normal',new T.BufferAttribute(N,3)); return out; }
function capsule(r0,r1,len,seg){ const pts=[], n=5;
  for(let i=0;i<=n;i++){ const a=Math.PI/2*(i/n); pts.push(new T.Vector2(Math.sin(a)*r1,-len-Math.cos(a)*r1)); }
  for(let i=0;i<=n;i++){ const a=Math.PI/2*(i/n); pts.push(new T.Vector2(Math.cos(a)*r0,Math.sin(a)*r0)); }
  return new T.LatheGeometry(pts,seg||10); }
function addAng(g){ const uv=g.attributes.uv, a=new Float32Array(uv.count); for(let i=0;i<uv.count;i++) a[i]=uv.getX(i); g.setAttribute('aAng',new T.BufferAttribute(a,1)); return g; }
function normUV(g){ g.computeBoundingBox(); const b=g.boundingBox, p=g.attributes.position, uv=g.attributes.uv; const w=b.max.x-b.min.x||1, h=b.max.y-b.min.y||1;
  for(let i=0;i<p.count;i++) uv.setXY(i,(p.getX(i)-b.min.x)/w,(p.getY(i)-b.min.y)/h); uv.needsUpdate=true; return g; }

// ---- materials
const M={
  black:new T.MeshStandardMaterial({color:0x08080c,roughness:.95,metalness:0}),
  blackDS:new T.MeshStandardMaterial({color:0x08080c,roughness:.95,metalness:0,side:T.DoubleSide}),
  room:new T.MeshStandardMaterial({color:0x0b0b12,roughness:1,metalness:0,side:T.BackSide}),
  floor:new T.MeshStandardMaterial({color:0x14141c,roughness:.55,metalness:.25}),
  stage:new T.MeshStandardMaterial({color:0x24242f,roughness:.62,metalness:.2}),
  tier:new T.MeshStandardMaterial({color:0x15151d,roughness:.8,metalness:.1}),
  truss:new T.MeshStandardMaterial({color:0x33333d,roughness:.5,metalness:.8}),
  steel:new T.MeshStandardMaterial({color:0x1d1d25,roughness:.5,metalness:.7}),
  seat:new T.MeshStandardMaterial({color:0x2a1218,roughness:.75,metalness:.05}),
  cab:new T.MeshStandardMaterial({color:0x0d0d11,roughness:.6,metalness:.4}),
  gold:new T.MeshStandardMaterial({color:0xd9a441,roughness:.3,metalness:.9,emissive:0x9a6412,emissiveIntensity:.75}),
  mirror:new T.MeshStandardMaterial({color:0xe7eefb,roughness:.12,metalness:1,emissive:0x5a6c8f,emissiveIntensity:.55}),
};
const glow=(hex,op)=>new T.MeshBasicMaterial({color:hex,transparent:op!==undefined,opacity:op===undefined?1:op});

// ---- LED video surfaces: procedural "footage" plus canvas / camera / video textures
const LED_VS='attribute float aAng; varying vec2 vUv; varying float vAng; void main(){ vUv=uv; vAng=aAng; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
const ZAP={u:{value:0},c:{value:new T.Color(1,.2,.13)},a:{value:0}};   /* electricity over every LED surface: 0 = none */
const LED_FS=`precision highp float;
uniform float uZap,uZapA; uniform vec3 uZapC;
uniform float uT,uGain,uAspect,uPan,uFlash,uRep,uHL; uniform int uMode; uniform sampler2D uMap; uniform vec3 uC1,uC2,uHLc; vec3 gC1,gC2;
varying vec2 vUv; varying float vAng;
float h1(float n){return fract(sin(n*127.1)*43758.5453);}
float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);}
float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);}
float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}
vec3 zapC(vec2 p){ if(uZap<.004) return vec3(0.); float t=floor(uT*26.)*.71, s=0.;
  for(int i=0;i<3;i++){ float fi=float(i); vec2 q=p*(1.1+fi*1.25)+vec2(t*(1.+fi*.6),fi*7.3-t*.8); float d=abs(fbm(q)-.5); s+=(.0075+.003*fi)/(d+.0055)*(.62-.16*fi); }
  s=min(s,3.2)*uZap; return uZapC*s+vec3(1.,.92,.88)*max(0.,s-.9)*.8; }
float cx(vec2 p,float per){ return uPan>.5 ? (fract(p.x/per)-.5)*per : p.x-uAspect*.5; }
float spire(float dx,float y,float w,float h){ float u=clamp(1.-y/h,0.,1.); return step(abs(dx),w*u*(.35+.65*u))*step(0.,y); }
vec3 sBcn(vec2 p,float t){
  float hz=.17; bool wtr=p.y<hz; float y=wtr?hz+(hz-p.y)*1.55:p.y; float x=p.x+(wtr?sin(p.y*120.+t*1.3)*.01+sin(p.y*47.-t)*.006:0.);
  float sx=cx(vec2(x,0.),6.), e=y-hz;
  vec3 col=mix(vec3(1.,.5,.17),vec3(.42,.12,.5),smoothstep(0.,.62,e)); col=mix(col,vec3(.06,.04,.22),smoothstep(.42,1.,e));
  col+=vec3(1.,.62,.25)*exp(-5.*length(vec2(sx*.45,e-.07)))*.9;
  col+=step(.9965,h2(floor(vec2(x,y)*46.)))*smoothstep(.5,.85,y)*(.55+.45*sin(t*3.+x*23.));
  float hill=.1+.075*vn(vec2(x*.9,3.))+.03*vn(vec2(x*3.7,9.)); if(e<hill) col=mix(col,vec3(.33,.12,.42),.8);          // the hills behind the city
  float x1=x*13., c1=floor(x1), f1=fract(x1), b1=.035+.1*h1(c1)*h1(c1+7.3);
  if(e<b1&&f1<.9){ col=vec3(.16,.06,.26); col+=vec3(1.,.74,.38)*step(.8,h2(floor(vec2(x1*5.,y*150.))))*.5; }
  float lm=0.;                                                                                                       // landmarks in silhouette
  lm=max(lm,spire(sx+1.42,e,.05,.3)); lm=max(lm,spire(sx+1.3,e,.055,.36)); lm=max(lm,spire(sx+1.18,e,.06,.42)); lm=max(lm,spire(sx+1.06,e,.055,.35)); lm=max(lm,spire(sx+.94,e,.05,.29));
  lm=max(lm,step(abs(sx+1.18),.3)*step(e,.12));
  { float dx=sx-.95; lm=max(lm,step(abs(dx),.085*sqrt(clamp(1.-pow(max(e-.12,0.)/.22,2.),0.,1.)))*step(e,.34)); }
  lm=max(lm,step(abs(sx-2.05),.035)*step(e,.3)); lm=max(lm,step(abs(sx-2.2),.035)*step(e,.3));
  { float dx=sx+2.45; lm=max(lm,step(0.,dx)*step(dx,.16*sqrt(clamp(1.-e/.26,0.,1.)))*step(e,.26)); }
  if(lm>.5&&e>0.){ col=vec3(.07,.03,.14); col+=vec3(1.,.78,.45)*step(.84,h2(floor(vec2(x*90.,y*130.))))*.5; }
  float x2=x*6.5+3.3, c2=floor(x2), f2=fract(x2), b2=.03+.085*h1(c2+2.)+.05*step(.8,h1(c2+5.));
  if(e<b2&&f2<.93){ col=vec3(.035,.02,.09); col+=vec3(1.,.72,.35)*step(.83,h2(floor(vec2(x2*9.,y*110.))))*.6; }
  if(wtr){ col=col*.55+vec3(.05,.02,.1); col+=vec3(1.,.6,.3)*.14*smoothstep(.5,0.,abs(sx))*(.5+.5*sin(p.y*260.+t*2.)); }  // the harbour, mirroring the skyline
  return col; }
vec3 sArch(vec2 p,float t){
  vec3 sky=mix(vec3(1.,.74,.26),vec3(.86,.2,.14),smoothstep(0.,1.,p.y)); float sx=cx(p,4.);
  sky+=vec3(1.,.9,.6)*smoothstep(.34,.3,length(vec2(sx*.8,p.y-.42)))*.55; sky*=.88+.12*sin(p.y*40.-t*.6);
  float u=fract(p.x*1.36)-.5; float open=p.y<.52?step(abs(u),.31):step(length(vec2(u,(p.y-.52)*.86)),.31);
  float rim=p.y<.52?smoothstep(.05,.0,abs(abs(u)-.31)):smoothstep(.05,.0,abs(length(vec2(u,(p.y-.52)*.86))-.31));
  vec3 wall=vec3(.3,.06,.05)*(.6+.5*p.y)+vec3(1.,.55,.2)*rim*.8; return mix(wall,sky,open); }
vec3 sStorm(vec2 p,float t){
  float n=fbm(p*vec2(1.1,2.6)+vec2(t*.05,0.)); vec3 col=mix(vec3(.02,.04,.18),vec3(.1,.36,.85),n*(.35+p.y)*.9);
  vec2 m=vec2(cx(p,6.),p.y-.68); float d=length(m*vec2(.6,1.));
  col+=vec3(.75,.92,1.)*smoothstep(.19,.165,d)*(.72+.28*vn(m*13.)); col+=vec3(.2,.5,1.)*exp(-5.*d)*.6;
  float tk=floor(t*1.2), fr=fract(t*1.2); float on=step(.7,h1(tk))*uFlash*(1.-fr);
  float lx=m.x-(h1(tk+.3)-.5)*4.+(vn(vec2(p.y*9.,tk))-.5)*.55; col+=vec3(.85,.93,1.)*smoothstep(.04,.0,abs(lx))*step(.12,p.y)*on*2.2+vec3(.12,.2,.45)*on*.5;
  float x=p.x*4.; float hh=.1+.14*h1(floor(x))+.2*step(.75,h1(floor(x)+.4))*max(0.,1.-abs(fract(x)-.5)*6.); if(p.y<hh) col=vec3(.02,.03,.1);
  return col; }
vec3 sGold(vec2 p,float t){
  float x=cx(p,3.2); vec3 col=vec3(.06,.024,.008)+vec3(.36,.15,.03)*pow(p.y,1.4)*.55; float bars=0.;
  for(int i=0;i<4;i++){ float k=float(i)*.21; float d=abs(abs(x)*1.2+p.y-(1.06-k)); bars+=smoothstep(.035,.0,d)*(.55+.45*sin(t*2.-float(i)*1.3)); }
  col+=vec3(1.,.74,.32)*bars; col+=vec3(1.,.6,.2)*exp(-2.2*length(vec2(x*.7,p.y-.2)))*.22;
  float u=p.x*2.6, cl=pow(.5+.5*cos(u*6.2831853),10.)*smoothstep(1.1,1.7,abs(x));                                   // slim columns of light out to the portals
  return col+vec3(1.,.66,.26)*cl*(.16+.5*vn(vec2(floor(u+.5)*3.1,t*.9)))*(.35+.65*p.y); }
vec3 sOcean(vec2 p,float t){
  vec2 q=p*vec2(1.5,3.); float w=0.; for(int i=0;i<3;i++){ float fi=float(i+1); q+=vec2(sin(q.y*1.7+t*.5*fi),cos(q.x*1.3-t*.35*fi))*.35; w+=sin(q.x*2.+q.y*3.)*.5+.5; } w/=3.;
  vec3 col=mix(vec3(0.,.07,.3),vec3(.1,.74,.92),w*w); col+=vec3(.75,1.,1.)*pow(w,8.)*.8; return col*(.45+.7*p.y); }
vec3 sViolet(vec2 p,float t){
  float x=cx(p,4.); float an=atan(x,p.y+.15), r=length(vec2(x,p.y+.15)); float f=pow(.5+.5*sin(an*9.+sin(t*.7)*2.),6.);
  vec3 col=mix(vec3(.11,.02,.24),vec3(.78,.32,1.),f*smoothstep(1.7,.1,r)); return col+vec3(1.,.4,.82)*exp(-3.*r)*.6; }
vec3 sTeam(vec2 p,float t){
  float n=fbm(p*2.+t*.15); vec3 col=mix(gC1,gC2,n)*(.5+.5*p.y);
  return col+gC1*smoothstep(.09,.0,abs(fract(p.x*.33-t*.22+p.y*.3)-.5)-.03)*.7; }
float sdBox(vec2 p,vec2 b,float r){ vec2 d=abs(p)-b+r; return length(max(d,0.))+min(max(d.x,d.y),0.)-r; }
// a humanoid machine far larger than the screen: head and shoulders fill the picture, the hands come up from below and press on the glass
vec3 sRobot(vec2 p,float t){
  float x=cx(p,200.); vec2 q=vec2(x*.5,p.y*.5+.41); float sway=sin(t*.31)*.1, nod=sin(t*.23)*.035, br=sin(t*1.05)*.012, look=sin(t*.47)*.07;
  vec3 col=vec3(.008,.01,.03)+vec3(.09,.02,.2)*exp(-1.3*length(q-vec2(0.,.6)))+vec3(0.,.06,.1)*exp(-3.*abs(q.y-.1));
  col+=vec3(.25,.05,.5)*smoothstep(.03,0.,abs(fract(q.x*1.5+t*.05)-.5)-.47)*.25*(1.-q.y);                              // light bars far behind
  vec2 hc=q-vec2(sway,.67+nod);
  float sh=sdBox(q-vec2(sway*.35,.1+br),vec2(2.7,.22),.2), chest=sdBox(q-vec2(sway*.35,-.22+br),vec2(1.45,.5),.12), neck=sdBox(q-vec2(sway*.7,.36),vec2(.19,.16),.04), head=sdBox(hc,vec2(.37,.3),.19);
  float jaw=sdBox(hc-vec2(0.,-.2),vec2(.25,.12),.08), d=min(min(sh,chest),min(neck,min(head,jaw)));
  float reach=smoothstep(-.3,.9,sin(t*.19)), hands=1e3;
  for(int s=0;s<2;s++){ float sx=s==0?-1.:1.; vec2 hp=q-vec2(sx*(1.25+.05*sin(t*.4+float(s))),.2+.22*reach); float palm=sdBox(hp,vec2(.3,.26),.1);
    for(int f=0;f<4;f++){ float fx=(float(f)-1.5)*.15; palm=min(palm,sdBox(hp-vec2(fx,.36+.05*sin(t*1.3+float(f)+float(s)*2.)),vec2(.055,.2),.05)); } palm=min(palm,sdBox(hp-vec2(-sx*.36,.08),vec2(.06,.16),.05)); hands=min(hands,palm); }
  float dd=min(d,hands);
  if(dd<0.){ float pn=smoothstep(.02,0.,abs(fract(q.y*9.+q.x*1.2)-.5)-.46)+smoothstep(.02,0.,abs(fract((q.x-sway*.35)*3.)-.5)-.47);
    vec3 metal=mix(vec3(.1,.115,.17),vec3(.4,.44,.58),smoothstep(.3,1.,q.y+.2*vn(q*5.)))*(.75+.25*vn(q*40.)); metal-=pn*.07; metal+=vec3(.5,.6,.8)*smoothstep(.12,0.,abs(q.x-sway+.5*(q.y-.6)-1.4*sin(t*.17)))*.22; { vec2 hq=q-vec2(sway,.67+nod); metal-=.09*smoothstep(.012,0.,abs(abs(hq.x)-.2-.25*max(0.,-hq.y+.02)))*step(hq.y,.0)*step(-.3,hq.y); metal-=.08*smoothstep(.01,0.,abs(hq.y-.17))*step(abs(hq.x),.3); }
    metal+=vec3(.1,.7,1.)*smoothstep(-.05,0.,dd)*.9*smoothstep(0.,1.4,x*sign(x)+.6)+vec3(1.,.2,.8)*smoothstep(-.09,0.,dd)*.35;                // rim light, cyan and magenta
    if(hands<0.) metal=metal*1.25+vec3(.08,.3,.5)*smoothstep(-.03,0.,hands);
    float visor=sdBox(hc-vec2(0.,.05),vec2(.29,.07),.06); if(visor<0.){ metal=vec3(.01,.02,.04)+gC2*.25; for(int e=0;e<2;e++){ float ex=(e==0?-1.:1.)*.13+look; metal+=gC2*exp(-900.*dot(hc-vec2(ex,.05),hc-vec2(ex,.05)))*3.+vec3(1.)*exp(-4000.*dot(hc-vec2(ex,.05),hc-vec2(ex,.05)))*2.; } metal+=gC2*.5*smoothstep(.03,0.,abs(hc.y-.05-.05*sin(t*2.+hc.x*8.))); }
    float core=length((q-vec2(sway*.35,-.12+br))*vec2(1.,1.2)); metal+=gC1*exp(-30.*core*core)*(1.4+.6*sin(t*2.1))+gC1*smoothstep(.012,0.,abs(core-.22))*.8;
    float gr=sdBox(hc-vec2(0.,-.2),vec2(.15,.045),.02); if(gr<0.) metal=mix(metal,vec3(.01),step(.5,fract(hc.x*40.)));
    col=metal; }
  col+=vec3(.2,.75,1.)*exp(-28.*max(dd,0.))*.28;
  return col*(.86+.14*sin(p.y*420.))+vec3(.5,.1,.9)*.03; }
// club walls: a wall of level meters riding the beat
vec3 sClub(vec2 p,float t){
  float n=p.x*9., id=floor(n), f=fract(n), beat=t*2.1; float h=.12+.7*pow(vn(vec2(id*.37,floor(beat)))*(1.-fract(beat))+vn(vec2(id*.37,floor(beat)+1.))*fract(beat),1.6);
  float seg=step(.18,fract(p.y*26.))*step(.1,f)*step(f,.9), on=step(p.y,h);
  vec3 c=mix(gC1,gC2,p.y*1.3)*seg*on*(.5+.6*p.y)+gC2*seg*smoothstep(.02,0.,abs(p.y-h-.03))*1.4; return c+vec3(.01,.004,.03); }
// the lighting stage keeps its wall dark so the beams read: a black cloth with a few pixels alive in it
vec3 sDark(vec2 p,float t){ vec2 g=p*vec2(9.,30.), id=floor(g); float d=smoothstep(.3,.1,length(fract(g)-.5)); float on=step(.985,h2(id+floor(t*1.5)*.37)); return (mix(gC1,gC2,h2(id))*on*.9+vec3(.012,.012,.02))*d+vec3(.004); }
vec3 sCyc(vec2 p,float t){ float tt=t/15., ph=fract(tt), fade=smoothstep(0.,.08,ph)*smoothstep(1.,.92,ph); int lk=int(mod(floor(tt),6.)); vec2 q=vec2((p.x-uAspect*.5)*10.2,p.y*10.2); vec3 c=vec3(0.);
  if(lk==0||lk==4){ float g=smoothstep(.47,.5,max(abs(fract(q.x/1.618)-.5),abs(fract(q.y/1.618)-.5))), scan=smoothstep(.9,0.,abs(q.y-mod(t*1.3,11.))); c=gC2*g*(.16+.9*scan)+gC2*.025; if(lk==4) c=c.grb*.8+gC1*smoothstep(.6,0.,abs(q.x-11.*sin(t*.4)))*.25; }
  else if(lk==1){ float b=floor(t*118./120.), h=h2(floor(q/vec2(3.236,1.618))+b); c=(h<.3?gC1:(h<.58?gC2:(h<.78?vec3(1.,.97,.92):vec3(.02))))*.4; }
  else if(lk==2){ vec2 w=q*vec2(.16,.3); float n=fbm(w+vec2(t*.12,-t*.07)+fbm(w*1.7-t*.05)*1.4); c=mix(vec3(.02,.09,.24),gC2,smoothstep(.22,.6,n))*(.35+1.1*n)+gC1*smoothstep(.6,.82,n)*.9+vec3(1.,.95,.9)*pow(n,6.)*1.5; }
  else if(lk==3){ vec2 s=vec2(q.x,q.y-4.); float r=length(s)+.001, sp=log(r)/log(1.618)*1.5707963-atan(s.y,s.x)-t*.25, l=abs(fract(sp/6.2831853)-.5); c=vec3(1.,.85,.6)*smoothstep(.465,.5,l)*smoothstep(15.,2.,r)*1.2+vec3(1.,.8,.55)*.07; }
  else { float fall=fract(h1(floor(q.x*2.))*7.+t*(.25+.5*h1(floor(q.x*2.)+3.))); float y=1.-fall; c=mix(gC2,vec3(1.),.4)*smoothstep(.12,0.,abs(p.y-y))*step(.3,fract(q.x*2.))*1.1+gC2*.03*step(p.y,y); }
  return (c*fade+vec3(.03,.031,.036)); }
// ambience: near-black with a few slow motes and one faint horizon line, so the screens hold the room without stealing the stage
vec3 sAmb(vec2 p,float t){ vec3 col=vec3(.004,.004,.009)+gC2*.012*smoothstep(.0,1.,p.y);
  vec2 g=p*vec2(7.,10.)+vec2(0.,-t*.05); vec2 id=floor(g), f=fract(g)-.5; vec2 o=vec2(h2(id)-.5,h2(id+3.1)-.5)*.6; float on=step(.9,h2(id+7.7));
  float tw=.55+.45*sin(t*.8+h2(id)*30.); col+=mix(gC1,vec3(1.,.92,.8),.35)*on*tw*smoothstep(.09,.0,length(f-o))*.55;
  float ln=smoothstep(.006,.0,abs(p.y-.2-.015*sin(p.x*.9+t*.25)))*(.5+.5*sin(p.x*1.7-t*.4)); col+=gC1*ln*.22;
  return col; }
vec3 sFoot(vec2 p){ return texture2D(uMap,vec2(fract(p.x/uAspect),clamp(p.y,0.,1.))).rgb; }
vec3 sOff(vec2 p){ vec2 g=fract(p*vec2(46.,46.))-.5; return vec3(.035,.036,.045)*smoothstep(.48,.2,length(g))+vec3(.012,.012,.016); }
vec3 pickM(int m,vec2 p,float t){ if(m==13) return sOff(p); if(m==14) return sAmb(p,t); if(m==15) return sFoot(p); if(m==16) return sFoot(p)*.42+sGold(p,t)*.55;
  if(m==0) return sBcn(p,t); if(m==1) return sArch(p,t); if(m==2) return sStorm(p,t);
  if(m==3) return sGold(p,t); if(m==4) return sOcean(p,t); if(m==5) return sViolet(p,t); if(m==7) return sRobot(p,t); if(m==8) return sClub(p,t); if(m==9) return sDark(p,t); if(m==12) return sCyc(p,t); return sTeam(p,t); }
vec3 pick(vec2 p,float t){ return pickM(uMode,p,t); }
void main(){ gC1=uC1; gC2=uC2;
  vec3 col;
  if(uMode>=10&&uMode<=13){ vec2 uv=vUv; if(uPan>.5){ float f=vAng*uRep, fr=fract(f); if(mod(floor(f),2.)>.5) fr=1.-fr; uv=vec2(fr,vUv.y); } col=texture2D(uMap,uv).rgb; }      // footage tiles round the screens, every other tile mirrored so there is no seam
  else if(uPan>.5){ vec2 p=vec2(fract(vAng-.125)*12.,vUv.y); col=pick(p,uT); if(p.x>10.5) col=mix(col,pick(p-vec2(12.,0.),uT),smoothstep(10.5,12.,p.x)); }
  else col=pick(vec2(vUv.x*uAspect,vUv.y),uT);
  col*=uGain; col=mix(col,col*.35+uHLc*.75,uHL); col+=zapC(vUv*vec2(uAspect,1.)*2.1);
  gl_FragColor=vec4(col,1.); }`;
const LEDS=[];
// lens flare for every fixture: a soft core with a four-point star
const flareTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const g=c.getContext('2d'), rg=g.createRadialGradient(64,64,0,64,64,64);
  rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.12,'rgba(255,255,255,.8)'); rg.addColorStop(.35,'rgba(255,255,255,.16)'); rg.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=rg; g.fillRect(0,0,128,128);
  g.globalCompositeOperation='lighter'; for(const [w,h] of [[128,3],[3,128]]){ const lg=w>h?g.createLinearGradient(0,0,128,0):g.createLinearGradient(0,0,0,128); lg.addColorStop(0,'rgba(255,255,255,0)'); lg.addColorStop(.5,'rgba(255,255,255,.7)'); lg.addColorStop(1,'rgba(255,255,255,0)'); g.fillStyle=lg; g.fillRect((128-w)/2,(128-h)/2,w,h); }
  return new T.CanvasTexture(c); })();
function flare(hex,size){ const m=new T.SpriteMaterial({map:flareTex,color:hex,blending:T.AdditiveBlending,depthWrite:false,transparent:true}); m.userData.own=true; const sp=new T.Sprite(m); sp.scale.setScalar(size); return sp; }
function ledMat(o){ o=o||{}; const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uGain:{value:o.gain||1},uAspect:{value:o.aspect||2},uPan:{value:o.pan?1:0},uFlash:{value:REDUCED?0:1},uRep:{value:1},
  uMode:{value:0},uMap:{value:null},uC1:{value:new T.Color(1,1,1)},uC2:{value:new T.Color(1,1,1)},uHL:{value:0},uHLc:{value:new T.Color(1,1,1)},uZap:ZAP.u,uZapC:ZAP.c,uZapA:ZAP.a},vertexShader:LED_VS,fragmentShader:LED_FS,side:o.side===undefined?T.FrontSide:o.side});
  LEDS.push(m); return m; }
const CONTENT=[
  {id:'bcn',name:'Barcelona dusk',mode:0},{id:'arches',name:'Sunset arches',mode:1},{id:'storm',name:'Storm moon',mode:2},
  {id:'gold',name:'Gold beams',mode:3},{id:'ocean',name:'Deep water',mode:4},{id:'violet',name:'Violet fans',mode:5},
  {id:'team',name:'Team colours',mode:6},{id:'vote',name:'Live vote',mode:10},{id:'holocam',name:'Giant on camera',mode:10},{id:'off',name:'Off',mode:13},{id:'ambient',name:'Ambient (dark)',mode:14},{id:'house',name:'House look',mode:10},{id:'robot',name:'Machine',mode:7},{id:'title',name:'Show title',mode:10},{id:'live',name:'Live camera',mode:10},{id:'yours',name:'Your video',mode:10}];
const TEX={title:null,live:null,yours:null};
// real footage for the two LED screens: stock loops from Envato, cut to 720p
const VIDEOS=[{id:'off',name:'Screens off'},{id:'house',name:'House look'},{id:'ambient',name:'Ambient (dark)'},{id:'bcn',name:'Barcelona dusk (animated)'},{id:'v-gold',name:'Gold particles',file:'vid-gold.mp4'},{id:'v-ocean',name:'Ocean',file:'vid-ocean.mp4'},{id:'v-fire',name:'Fire',file:'vid-fire.mp4'},{id:'v-led',name:'LED light show',file:'vid-led.mp4'}];
const VID={};
function videoTex(v){ if(VID[v.id]) return VID[v.id]; const el=document.createElement('video'); el.src=v.file; el.muted=true; el.loop=true; el.playsInline=true; el.setAttribute('playsinline',''); el.crossOrigin='anonymous'; el.preload='auto';
  const tx=new T.VideoTexture(el); tx.encoding=T.LinearEncoding; tx.minFilter=T.LinearFilter; tx.magFilter=T.LinearFilter; tx.generateMipmaps=false; TEX[v.id]=tx; if(!CONTENT.find(c=>c.id===v.id)) CONTENT.push({id:v.id,name:v.name,mode:10}); return VID[v.id]={el,tx}; }
const WALLVID={}; function wallVideo(id,file){ if(WALLVID[id]) return WALLVID[id].tx; const el=document.createElement('video'); el.src=file; el.muted=true; el.loop=true; el.playsInline=true; el.setAttribute('playsinline',''); el.crossOrigin='anonymous'; el.preload='auto';
  const tx=new T.VideoTexture(el); tx.encoding=T.LinearEncoding; tx.minFilter=T.LinearFilter; tx.magFilter=T.LinearFilter; tx.generateMipmaps=false; WALLVID[id]={el,tx}; const go=()=>{ const p=el.play(); if(p&&p.catch) p.catch(()=>{}); }; go(); window.addEventListener('pointerdown',go,{once:true}); return tx; }
/* v28: a stage video is copied into the picture at most as often as it really changes (about 24 times a second), and in the look-around at most 15 times a second: on his Mac five videos were copied every frame */
{ const VT=T.VideoTexture.prototype; VT.update=function(){ const v=this.image; if(!v||v.readyState<v.HAVE_CURRENT_DATA) return; const now=performance.now(), gap=window.__VIDGAP||40; if(now-(this._lu||0)>=gap){ this._lu=now; this.needsUpdate=true; } }; }
function playOnly(id){ for(const k in VID){ const e=VID[k].el; if(k===id){ const p=e.play(); if(p&&p.catch) p.catch(()=>{}); } else e.pause(); } }
function applyContent(mat,id,k,pan){ const c=CONTENT.find(c=>c.id===id)||CONTENT[0]; const u=mat.uniforms;
  u.uMode.value=c.mode; const t=TEAMS[k===undefined?0:k]; u.uC1.value.copy(t.c); u.uC2.value.copy(t.c2);
  if(pan!==undefined) u.uPan.value=pan?1:0;
  mat.userData.live=c.id==='live';
  if(c.mode>=10){ u.uMap.value=TEX[c.id]||TEX.title; u.uRep.value=c.id.startsWith('v-')?8:4; } }
// title card drawn to a canvas so the walls can carry type
const titleCv=document.createElement('canvas'); titleCv.width=2048; titleCv.height=512;
function drawTitle(main,sub,hex){ const g=titleCv.getContext('2d'); const w=2048,h=512;
  const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#05040c'); gr.addColorStop(.6,'#1a0f24'); gr.addColorStop(1,hex||'#6b3a12'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,220,150,.9)'; for(let i=0;i<70;i++){ g.globalAlpha=.25+.6*((i*37)%10)/10; g.fillRect((i*211)%w,(i*97)%(h*.55),2,2); } g.globalAlpha=1;
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#f6ecd6'; g.font='400 150px Marcellus, "Times New Roman", serif';
  let fs=150; while(g.measureText(main).width>w*.9&&fs>60){ fs-=8; g.font='400 '+fs+'px Marcellus, "Times New Roman", serif'; }
  g.fillText(main,w/2,h*.44); g.fillStyle=hex||'#f0c35a'; g.font='400 58px Outfit, Arial, sans-serif'; g.fillText(sub.split('').join(' '),w/2,h*.74);
  if(TEX.title) TEX.title.needsUpdate=true; }
TEX.title=new T.CanvasTexture(titleCv); TEX.title.wrapS=T.RepeatWrapping;
drawTitle('REVERSE ARENA THEATER','B A R C E L O N A');
// the house look: what the closed screens show while the audience comes in, the city's name across the wall
const houseCv=document.createElement('canvas'); houseCv.width=2048; houseCv.height=512;
function drawHouse(sw,tw){ const g=houseCv.getContext('2d'), w=2048, h=512; tw=tw||0;   /* v22: sw = where a sweep of light is crossing the letters (0..1, none if undefined); tw = time, for the shimmer */ const gr=g.createLinearGradient(0,0,0,h); gr.addColorStop(0,'#07060d'); gr.addColorStop(.55,'#120c1c'); gr.addColorStop(1,'#3a210c'); g.fillStyle=gr; g.fillRect(0,0,w,h);
  const rg=g.createRadialGradient(w/2,h*.62,20,w/2,h*.62,w*.42); rg.addColorStop(0,'rgba(240,180,90,.28)'); rg.addColorStop(1,'rgba(240,180,90,0)'); g.fillStyle=rg; g.fillRect(0,0,w,h);
  g.fillStyle='rgba(255,220,150,.9)'; for(let i=0;i<120;i++){ g.globalAlpha=Math.min(1,(.15+.55*((i*37)%10)/10)*(tw?(.6+.6*Math.max(0,Math.sin(tw*3.1+i*1.7))):1)); g.fillRect((i*211)%w,(i*97)%(h*.4),2,2); } g.globalAlpha=1;
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#f0c35a'; g.font='400 40px Outfit, Arial, sans-serif'; g.fillText('R E V E R S E   A R E N A   T H E A T E R',w/2,h*.26);
  g.fillStyle='#f6ecd6'; let fs=230; g.font='400 '+fs+'px Marcellus, "Times New Roman", serif'; const word='B\u200aA\u200aR\u200aC\u200aE\u200aL\u200aO\u200aN\u200aA'; while(g.measureText(word).width>w*.5&&fs>60){ fs-=8; g.font='400 '+fs+'px Marcellus, "Times New Roman", serif'; }
  g.shadowColor='rgba(240,180,90,.55)'; g.shadowBlur=30; g.fillText(word,w/2,h*.6); g.shadowBlur=0; g.fillStyle='rgba(240,195,90,.8)'; g.fillRect(w*.42,h*.84,w*.16,3);
  if(sw!==undefined&&sw>-.2&&sw<1.2){ const x=w*(.18+.64*sw), bw=w*.07; g.save(); g.globalCompositeOperation='lighter';   /* a moving light catching the letters: a soft band on the wall and a hard glint in the metal */
    const band=g.createLinearGradient(x-bw*2.2,0,x+bw*2.2,0); band.addColorStop(0,'rgba(255,214,150,0)'); band.addColorStop(.5,'rgba(255,214,150,.16)'); band.addColorStop(1,'rgba(255,214,150,0)'); g.fillStyle=band; g.fillRect(x-bw*2.2,0,bw*4.4,h);
    const gl=g.createLinearGradient(x-bw,0,x+bw,0); gl.addColorStop(0,'rgba(255,240,210,0)'); gl.addColorStop(.5,'rgba(255,248,230,.95)'); gl.addColorStop(1,'rgba(255,240,210,0)'); g.fillStyle=gl; g.fillText(word,w/2,h*.6); g.restore(); }
  if(TEX.house) TEX.house.needsUpdate=true; }
TEX.off=new T.DataTexture(new Uint8Array([0,0,0,255]),1,1,T.RGBAFormat); TEX.off.needsUpdate=true;          // screens off: black, never the title card
TEX.house=new T.CanvasTexture(houseCv); TEX.house.wrapS=T.RepeatWrapping; drawHouse();
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(drawHouse);
if(document.fonts&&document.fonts.ready) document.fonts.ready.then(()=>drawTitle('REVERSE ARENA THEATER','B A R C E L O N A'));

// light-beam material: soft additive cone
const BEAM_VS='varying vec3 vN; varying vec3 vV; varying float vL; void main(){ vec4 mv=modelViewMatrix*vec4(position,1.0); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); vL=uv.y; gl_Position=projectionMatrix*mv; }';
const BEAM_FS=(window.LX_OFF?'':'#define LXSOFT\n')+'precision highp float; uniform vec3 uC; uniform float uI; varying vec3 vN; varying vec3 vV; varying float vL; void main(){ float e=pow(abs(dot(normalize(vN),normalize(vV))),\n#ifdef LXSOFT\n1.15\n#else\n1.6\n#endif\n); float a=e*pow(vL,1.35)*uI; gl_FragColor=vec4(uC*a,a); }';
function beamMat(hex){ return new T.ShaderMaterial({uniforms:{uC:{value:new T.Color(hex)},uI:{value:.5}},vertexShader:BEAM_VS,fragmentShader:BEAM_FS,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}); }
function beamGeo(len,r1){ const g=new T.CylinderGeometry(.05,r1,len,14,1,true); g.translate(0,-len/2,0); return g; } // apex at origin, pointing -Y; uv.y is 1 at the apex

// ---- lights
const ambL=new T.AmbientLight(0x8088aa,.36), hemiL=new T.HemisphereLight(0x6672a6,0x1a120c,.3); scene.add(ambL); scene.add(hemiL);
const houseKey=new T.SpotLight(0xffd9ae,1.15,40,.82,.7,1.2); houseKey.position.set(0,12.6,3); houseKey.target.position.set(0,0,1); scene.add(houseKey); scene.add(houseKey.target);
houseKey.castShadow=true; houseKey.shadow.mapSize.set(2048,2048); houseKey.shadow.camera.near=4; houseKey.shadow.camera.far=22; houseKey.shadow.bias=-.0012; houseKey.shadow.radius=3;
function shadowsDirty(){ renderer.shadowMap.needsUpdate=true; }

// ---- assets published beside the page: models as .glb, their colour maps as plain .jpg
const texLoader=new T.TextureLoader();
function tex(url,rep,aniso){ const t=texLoader.load(url); t.wrapS=t.wrapT=T.RepeatWrapping; if(rep) t.repeat.set(rep,rep); t.anisotropy=aniso||8; t.encoding=T.LinearEncoding; return t; }
function texP(url){ return new Promise((ok,no)=>texLoader.load(url,t=>{ t.flipY=false; t.encoding=T.LinearEncoding; t.anisotropy=4; ok(t); },undefined,()=>no(new Error('texture '+url)))); }
async function loadGLB(url){ if(!T.GLTFLoader) throw new Error('no loader'); const res=await fetch(url.replace('.glb','.json')); if(!res.ok) throw new Error(url+' '+res.status); const txt=await res.text();   // glTF as JSON, its buffer embedded
  return new Promise((ok,no)=>new T.GLTFLoader().parse(txt,'',ok,no)); }
function firstMesh(root){ let m=null; root.traverse(o=>{ if(!m&&o.isMesh) m=o; }); return m; }

await __tick();
// ================= ROOM =================
const WING_H=12.7;
CAT.cur='room';
const roomBox=new T.Mesh(new T.BoxGeometry(ROOM*2,ROOM_H+.4,ROOM*2),M.room); roomBox.position.y=(ROOM_H-.4)/2; scene.add(roomBox);
// a small lit studio for the reflections on metal, velvet and polished floor
try{ const pm=new T.PMREMGenerator(renderer), es=new T.Scene(); es.add(new T.Mesh(new T.SphereGeometry(40,24,12),new T.MeshBasicMaterial({color:0x06060a,side:T.BackSide})));
  const pan=(hex,w,h,x,y,z)=>{ const m=new T.Mesh(new T.PlaneGeometry(w,h),new T.MeshBasicMaterial({color:hex,side:T.DoubleSide})); m.position.set(x,y,z); m.lookAt(0,0,0); es.add(m); };
  pan(0xffe6c4,16,6,0,22,0); pan(0xffa257,12,7,-24,7,-10); pan(0x4d82ff,12,7,24,7,-10); pan(0xb46bff,10,6,0,6,26); pan(0xfff0dd,5,3,8,14,12); pan(0xfff0dd,5,3,-8,14,12);
  scene.environment=pm.fromScene(es,.035).texture; pm.dispose(); }catch(e){}

// ---- the stage: one continuous ring around the turntable, 10 m deep, 1.0 m high. Polished dark timber that mirrors the show.
CAT.cur='deck';
const woodMap=tex('tex-wood.jpg'), woodRough=tex('tex-wood-rough.jpg');
const MIRROR={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uK:{value:.62},tWood:{value:woodMap},tRough:{value:woodRough}},
  vertexShader:'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv=textureMatrix*vec4(position,1.0); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
  fragmentShader:`precision highp float; uniform vec3 color; uniform sampler2D tDiffuse,tWood,tRough; uniform float uK; varying vec4 vUv; varying vec3 vW;
    void main(){ vec2 uv=vUv.xy/vUv.w; float ang=atan(vW.x,-vW.z), rr=length(vW.xz); vec2 wuv=vec2(ang*3.0,rr*.34);          // boards run around the ring
      vec3 wood=texture2D(tWood,wuv).rgb; float ro=texture2D(tRough,wuv).g; float b=.0025+ro*.006;
      vec3 r=texture2D(tDiffuse,uv).rgb*.32; r+=texture2D(tDiffuse,uv+vec2(b,0.)).rgb*.17; r+=texture2D(tDiffuse,uv-vec2(b,0.)).rgb*.17; r+=texture2D(tDiffuse,uv+vec2(0.,b*1.7)).rgb*.17; r+=texture2D(tDiffuse,uv-vec2(0.,b*1.7)).rgb*.17;
      vec3 v=normalize(cameraPosition-vW); float f=mix(.28,1.,pow(1.-abs(v.y),2.5));
      vec3 base=color+wood*vec3(.34,.27,.24);
      gl_FragColor=vec4(base+r*uK*f*(1.25-ro),1.); }`};
const deckPlain=new T.Mesh(ringSector(R_DISC,R_OUT,0,TAU,STAGE_H),new T.MeshStandardMaterial({color:0x2a211d,roughness:.35,metalness:.1})); scene.add(deckPlain);
scene.add(new T.Mesh(ringSector(R_OUT,36,0,TAU,STAGE_H),M.black));
let deckMirror=null;
if(T.Reflector){ try{ deckMirror=new T.Reflector(new T.RingGeometry(R_DISC,R_OUT,128,1),{textureWidth:1024,textureHeight:1024,color:0x050507,shader:MIRROR,clipBias:.003});
    deckMirror.rotation.x=-Math.PI/2; deckMirror.position.y=STAGE_H+.002; scene.add(deckMirror); deckPlain.visible=false; }catch(e){ deckMirror=null; } }
if(deckMirror){ const ob=deckMirror.onBeforeRender; deckMirror.onBeforeRender=function(a,b,c){ const sg=typeof seating!=='undefined'?seating:null, was=sg&&sg.visible; if(sg) sg.visible=false; ob.call(this,a,b,c); if(sg) sg.visible=was; }; }   // the seating bowl sits below the deck and is left out of the reflection
function setReflect(on){ if(deckMirror){ deckMirror.visible=on; deckPlain.visible=!on; } }
scene.add(new T.Mesh(arcPanel(R_DISC+.01,0,TAU,-1.7,STAGE_H),M.black));               // stage front fascia
for(let k=0;k<4;k++) scene.add(new T.Mesh(arcPanel(R_OUT,JOINT(k)+4.4*D2R,JOINT(k)+TAU/4-4.4*D2R,STAGE_H,WING_H),M.black));   // upstage wall, open at the four joins where the portals run through
scene.add(new T.Mesh(arcPanel(R_DISC+.005,0,TAU,STAGE_H-.06,STAGE_H-.008),glow(0xffe7c4)));                       // pixel battens along the whole lip: one stage, all the way round

// ---- the two LED screens. Each is a quarter of the ring, 7 m tall, on one circular track 2 m behind the stage lip.
// Closed, they meet in front of the audience: 180 degrees of picture. Sliding apart they reveal the stage; fully open they park behind the audience.
CAT.cur='screens';
const screenMat=ledMat({aspect:(Math.PI*R_SCREEN)/WALL_H});
const screens=[-1,1].map(s=>{ const g=new T.Group(), a0=s<0?-SCREEN_ARC:0, a1=s<0?0:SCREEN_ARC, RB=R_SCREEN+.38;
  g.add(new T.Mesh(arcPanel(R_SCREEN,a0,a1,STAGE_H+.14,WALL_TOP,{u0:s<0?0:.5,u1:s<0?.5:1}),screenMat));
  g.add(new T.Mesh(arcPanel(RB,a0,a1,STAGE_H+.04,WALL_TOP+.28,{inward:false}),M.cab));                               // back of the panel
  g.add(new T.Mesh(arcPanel(R_SCREEN-.01,a0,a1,STAGE_H+.02,STAGE_H+.14),M.steel));                                    // carriage skirt
  g.add(new T.Mesh(arcPanel(R_SCREEN-.01,a0,a1,WALL_TOP,WALL_TOP+.28),M.steel));
  g.add(new T.Mesh(ringSector(R_SCREEN-.01,RB,a0,a1,WALL_TOP+.28),M.steel));
  for(const a of [a0,a1]){ const p0=pol(a,R_SCREEN-.01,0), p1=pol(a,RB,0), cap=new T.Mesh(new T.PlaneGeometry(.39,WALL_H+.26),new T.MeshStandardMaterial({color:0x101016,roughness:.5,metalness:.6,side:T.DoubleSide}));
    cap.position.set((p0.x+p1.x)/2,STAGE_H+.02+(WALL_H+.26)/2,(p0.z+p1.z)/2); cap.rotation.y=-a+Math.PI/2; g.add(cap); }
  // structure on the back: ribs and two walkway rails, so it reads as a machine from behind and above
  const n=16, ribs=new T.InstancedMesh(new T.BoxGeometry(.12,WALL_H+.1,.3),M.truss,n), mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), one=new T.Vector3(1,1,1);
  for(let i=0;i<n;i++){ const a=lerp(a0,a1,(i+.5)/n), p=pol(a,RB+.16,STAGE_H+.1+WALL_H/2); q.setFromEuler(e.set(0,-a,0)); mt.compose(p,q,one); ribs.setMatrixAt(i,mt); } ribs.frustumCulled=false; g.add(ribs);
  for(const y of [STAGE_H+2.6,STAGE_H+5.1]) g.add(new T.Mesh(arcPanel(RB+.32,a0,a1,y,y+.09,{inward:false}),M.truss));
  scene.add(g); return g; });
function setScreens(face,gap){ screens[0].rotation.y=-(face-gap/2); screens[1].rotation.y=-(face+gap/2); }
// the track: a rail overhead and a guide in the deck, all the way round
{ const rail=new T.Mesh(new T.TorusGeometry(R_SCREEN+.19,.11,8,160),M.truss); rail.rotation.x=Math.PI/2; rail.position.y=WALL_TOP+.5; scene.add(rail);
  scene.add(new T.Mesh(ringSector(R_SCREEN-.04,R_SCREEN+.42,0,TAU,STAGE_H+.006),new T.MeshStandardMaterial({color:0x17171d,roughness:.4,metalness:.8})));
  const n=24, rods=new T.InstancedMesh(new T.CylinderGeometry(.03,.03,ROOM_H-WALL_TOP-.5,6),M.truss,n), mt=new T.Matrix4();
  for(let i=0;i<n;i++){ const p=pol(i/n*TAU,R_SCREEN+.19,(ROOM_H+WALL_TOP+.5)/2); mt.makeTranslation(p.x,p.y,p.z); rods.setMatrixAt(i,mt); } rods.frustumCulled=false; rods.userData.hangRod=true; scene.add(rods); }

// ---- sockets: every place a real model goes. The models load afterwards and are instanced onto these.
CAT.cur='rig';
const SOCK={};
function sock(type,parent,x,y,z,ry,flip,scale,rx){ const q=new T.Quaternion().setFromEuler(new T.Euler(rx||0,ry||0,flip?Math.PI:0,'YXZ')), s=scale||1;
  (SOCK[type]=SOCK[type]||[]).push({cat:CAT.cur,parent:parent||scene,m:new T.Matrix4().compose(new T.Vector3(x,y,z),q,new T.Vector3(s,s,s))}); }
function ringDots(r,y,n,size,hex){ const im=new T.InstancedMesh(new T.SphereGeometry(size,8,6),glow(hex),n); im.userData.dotR=r; (window.RDOTS=window.RDOTS||[]).push(im); const mt=new T.Matrix4();
  for(let i=0;i<n;i++){ const p=pol(i/n*TAU,r,y); mt.makeTranslation(p.x,p.y,p.z); im.setMatrixAt(i,mt); } im.frustumCulled=false; return im; }
function trussRing(g,r,y,h,w){ h=h||.42; w=w||.2;
  for(const [dr,dy] of [[-w,0],[w,0],[-w,h],[w,h]]){ const t=new T.Mesh(new T.TorusGeometry(r+dr,.03,6,140),M.truss); t.rotation.x=Math.PI/2; t.position.y=y+dy; g.add(t); }
  const n=Math.round(TAU*r/.5), im=new T.InstancedMesh(new T.CylinderGeometry(.014,.014,1,5),M.truss,n*4), mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), sc=new T.Vector3();
  for(let i=0;i<n;i++){ const a=(i+.5)/n*TAU, d=(i%2?1:-1);
    for(const [j,dr] of [[0,-w],[1,w]]){ q.setFromEuler(e.set(0,-a,d*.72,'YXZ')); mt.compose(pol(a,r+dr,y+h/2),q,sc.set(1,h*1.33,1)); im.setMatrixAt(i*4+j,mt); }       // side lacing
    for(const [j,dy] of [[2,0],[3,h]]){ q.setFromEuler(e.set(Math.PI/2,-a+d*.75,0,'YXZ')); mt.compose(pol(a,r,y+dy),q,sc.set(1,w*2.75,1)); im.setMatrixAt(i*4+j,mt); } }   // top and bottom lacing
  im.frustumCulled=false; g.add(im); }

// ================= OVERHEAD: the fixed grid, and three rings that turn =================
// Ring A is the big one: two decks of truss and an outer throw ring. It turns with the audience, so its front light, sound, blinders and strobes
// always face the stage that is open. Rings B and C hang inside it at golden-ratio radii and turn on their own: B carries the flying bridge, C the centre cluster.
CAT.cur='rig';
const grid=new T.Group(); scene.add(grid);
const THROW={r:RING_A.r+1.1,y:RING_A.y-.3};
{ const yG=ROOM_H-1.5; for(const r of [RING_A.r,RING_B.r,RING_C.r]){ const t=new T.Mesh(new T.TorusGeometry(r,.09,6,120),M.steel); t.rotation.x=Math.PI/2; t.position.y=yG; grid.add(t); }
  for(let i=0;i<8;i++){ const a=i/8*TAU+TAU/16, p0=pol(a,2,yG), p1=pol(a,ROOM-1,yG), b=new T.Mesh(new T.BoxGeometry(.14,.22,p0.distanceTo(p1)),M.steel); b.position.copy(p0).add(p1).multiplyScalar(.5); b.lookAt(p1); grid.add(b);
    for(const R of [RING_A,RING_B,RING_C]){ const p=pol(a,R.r,yG-.55); sock('hoist',grid,p.x,p.y,p.z,-a,false,1); } }
  const halo=new T.Mesh(new T.CircleGeometry(ROOM,48),new T.MeshBasicMaterial({color:0x020204})); halo.rotation.x=Math.PI/2; halo.position.y=ROOM_H-.2; grid.add(halo); }
const ringA=new T.Group(), ringB=new T.Group(), ringC=new T.Group(); scene.add(ringA); scene.add(ringB); scene.add(ringC);
const ringBeams=[], pools=[], keys=[];
const TEAMC=[]; function teamCol(k){ if(!TEAMC.length) for(const t of TEAMS4) TEAMC.push(new T.Color(t.hex)); return TEAMC[((k%4)+4)%4]; }
const _tw=new T.Vector3(), _tq=new T.Quaternion(), _tt=new T.Vector3();
// house lights: warm downlight cans in the grid over the seats, dark during the show
const houseCans=(()=>{ const pts=[]; for(const [r,n] of [[3.2,6],[6.2,12],[9.0,18],[11.8,24]]) for(let i=0;i<n;i++) pts.push(pol((i+.5)/n*TAU,r,ROOM_H-1.62)); const g=new T.CircleGeometry(.2,20); g.rotateX(Math.PI/2);
  const im=new T.InstancedMesh(g,glow(0xffdcaa),pts.length), mt=new T.Matrix4(); pts.forEach((p,i)=>{ mt.makeTranslation(p.x,p.y,p.z); im.setMatrixAt(i,mt); }); im.frustumCulled=false; grid.add(im); return im; })();
function hang(g,R,n,top){ const y1=ROOM_H-1.5, y0=R.y+(top||.42), im=new T.InstancedMesh(new T.CylinderGeometry(.018,.018,y1-y0,5),M.truss,n); im.userData.hangRod=true; const _hr=im, mt=new T.Matrix4(); for(let i=0;i<n;i++){ const p=pol(i/n*TAU,R.r,(y1+y0)/2); mt.makeTranslation(p.x,p.y,p.z); im.setMatrixAt(i,mt); } im.frustumCulled=false; g.add(im); }
function ringBeam(g,a,r,y,hex,len,w,stage){ const piv=new T.Group(); piv.position.copy(pol(a,r,y)); g.add(piv); const m=beamMat(hex); piv.add(new T.Mesh(beamGeo(len,w*(window.LX_OFF?1:1.5)),m)); const fl=flare(hex,(stage?1.15:1.0)*(window.LX_OFF?1:1.35)); fl.position.y=-.15; piv.add(fl);
  const b={piv,m,fl,a,r,y,ph:ringBeams.length*1.37,ca:Math.cos(a),sa:Math.sin(a),stage:!!stage,col:new T.Color(hex),i:ringBeams.length}; ringBeams.push(b); return b; }
{ // ---- ring A
  trussRing(ringA,RING_A.r,RING_A.y); trussRing(ringA,RING_A.r,RING_A.y+1.05); hang(ringA,RING_A,16,1.47);
  { const n=48, im=new T.InstancedMesh(new T.BoxGeometry(.05,.63,.05),M.truss,n*2), mt=new T.Matrix4(); for(let i=0;i<n;i++) for(const [j,dr] of [[0,-.2],[1,.2]]){ const p=pol(i/n*TAU,RING_A.r+dr,RING_A.y+.735); mt.makeTranslation(p.x,p.y,p.z); im.setMatrixAt(i*2+j,mt); } im.frustumCulled=false; ringA.add(im); }   // ladders between the two decks
  trussRing(ringA,THROW.r,THROW.y,.36,.17);
  { const n=24, im=new T.InstancedMesh(new T.BoxGeometry(.05,.05,1.0),M.truss,n), mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), one=new T.Vector3(1,1,1); for(let i=0;i<n;i++){ const a=(i+.5)/n*TAU; q.setFromEuler(e.set(.28,-a,0,'YXZ')); mt.compose(pol(a,RING_A.r+.62,RING_A.y-.02),q,one); im.setMatrixAt(i,mt); } im.frustumCulled=false; ringA.add(im); }   // outriggers that carry the throw ring
  for(const [a,s] of [[-40,1],[40,1],[-140,.8],[140,.8]]){ const aa=a*D2R, p=pol(aa,RING_A.r-.15,RING_A.y-.05); sock('linearray',ringA,p.x,p.y,p.z,-aa+Math.PI,true,s); }        // main left and right, two rear fills
  // the throw ring: forty moving heads. The front half lights the open stage or stages; the rest sweep the house.
  for(let i=0;i<40;i++){ let a=(i+.5)/40*TAU; if(a>Math.PI) a-=TAU; const p=pol(a,THROW.r,THROW.y); sock('mhead',ringA,p.x,p.y,p.z,-a,true,1.08);
    if(Math.abs(a)<Math.PI/2) ringBeam(ringA,a,THROW.r,THROW.y-.5,0xfff0dc,13.2,1.25,true); else if(i%3===0) ringBeam(ringA,a,THROW.r,THROW.y-.5,i%2?0xffd9a8:0x9fb8ff,12,1.5); }
  for(let i=0;i<24;i++){ const a=(i+.5)/24*TAU, p=pol(a,RING_A.r+.2,RING_A.y); if([-40,40,-140,140].some(d=>Math.abs(((a/D2R-d+540)%360)-180)<7)) continue; sock('mwash',ringA,p.x,p.y,p.z,-a,true,1); }
  for(let i=0;i<6;i++){ const a=(-50+i*20)*D2R, p=pol(a,RING_A.r-.2,RING_A.y+1.47); sock('blinder',ringA,p.x,p.y+.02,p.z,-a+Math.PI,false,1,.5); }                                     // audience blinders, facing the house
  for(let i=0;i<12;i++){ const a=(i+.5)/12*TAU, p=pol(a,RING_A.r-.2,RING_A.y); sock('strobe',ringA,p.x,p.y-.02,p.z,-a,true,1); }
  ringA.add(ringDots(RING_A.r,RING_A.y-.06,72,.045,0xffe3bd)); ringA.add(ringDots(THROW.r,THROW.y-.06,96,.035,0xffe3bd));
  // the key light for the stage is real light, thrown from the front of ring A
  for(const a of [-62,-21,21,62]){ const sp=new T.SpotLight(0xfff1dd,0,34,.5,.85,1.1); sp.position.copy(pol(a*D2R,THROW.r,THROW.y-.4)); ringA.add(sp); ringA.add(sp.target); keys.push({sp,a:a*D2R}); } }
const fly={trolleys:[],hoops:[]};
{ // ---- ring B, with the flying bridge across it
  trussRing(ringB,RING_B.r,RING_B.y); hang(ringB,RING_B,12);
  for(let i=0;i<16;i++){ const a=(i+.5)/16*TAU, p=pol(a,RING_B.r-.2,RING_B.y); sock(i%2?'mhead':'mwash',ringB,p.x,p.y,p.z,-a,true,1); if(i%2) ringBeam(ringB,a,RING_B.r-.2,RING_B.y-.45,i%4===1?0xff6fb5:0x6fd0ff,10,1.3); }
  for(let i=0;i<4;i++){ const a=i/4*TAU, p=pol(a,RING_B.r+.2,RING_B.y); sock('strobe',ringB,p.x,p.y-.02,p.z,-a,true,1); }
  ringB.add(ringDots(RING_B.r,RING_B.y-.06,48,.04,0xffe3bd));
  const L=RING_B.r*2-.2, by=RING_B.y+.5, chords=[]; for(const [dx,dy] of [[-.2,0],[.2,0],[-.2,.42],[.2,.42]]){ const c=new T.BoxGeometry(.06,.06,L); c.translate(dx,by+dy,0); chords.push(c); }
  for(let i=0;i<28;i++){ const z=-L/2+(i+.5)*L/28; for(const sx of [-.2,.2]){ const d=new T.BoxGeometry(.03,.6,.03); d.rotateX((i%2?1:-1)*.62); d.translate(sx,by+.21,z); chords.push(d); } }
  ringB.add(new T.Mesh(mergeGeos(chords),M.truss));
  { const n=34, im=new T.InstancedMesh(new T.SphereGeometry(.035,6,5),glow(0xffe3bd),n), mt=new T.Matrix4(); for(let i=0;i<n;i++){ mt.makeTranslation(i%2?.2:-.2,by-.05,-L/2+(i+.5)*L/n); im.setMatrixAt(i,mt); } im.frustumCulled=false; ringB.add(im); }   // marker lights, so the bridge reads from below                                                                                                // the bridge: a truss across the ring that the winch trolleys run along
  for(const s of [-1,1]){ const tr=new T.Group(); tr.position.set(0,by-.1,s*2.6); ringB.add(tr); tr.add(new T.Mesh(new T.BoxGeometry(.7,.18,.5),M.cab)); sock('hoist',tr,0,-.1,0,0,false,.8);
    const hoop=new T.Mesh(new T.TorusGeometry(.48,.022,8,40),new T.MeshStandardMaterial({color:0xd9d9e2,roughness:.25,metalness:1})); hoop.position.y=-3.2; tr.add(hoop);
    const lg=new T.BufferGeometry(); lg.setAttribute('position',new T.Float32BufferAttribute([-.12,-.2,0,-.3,-2.75,0, .12,-.2,0,.3,-2.75,0],3)); const ln=new T.LineSegments(lg,new T.LineBasicMaterial({color:0xb8b8c4,transparent:true,opacity:.8})); ln.frustumCulled=false; tr.add(ln);
    fly.trolleys.push({g:tr,s,hoop,ln}); } }
{ // ---- ring C: the centre cluster, turning the other way
  trussRing(ringC,RING_C.r,RING_C.y,.36,.17); hang(ringC,RING_C,8,.36);
  for(let i=0;i<10;i++){ const a=(i+.5)/10*TAU, p=pol(a,RING_C.r-.17,RING_C.y); sock(i%2?'mhead':'mwash',ringC,p.x,p.y,p.z,-a,true,.95); if(i%2) ringBeam(ringC,a,RING_C.r-.17,RING_C.y-.45,i%4===1?0xffd9a8:0xb9a2ff,9.5,1.2); }
  ringC.add(ringDots(RING_C.r,RING_C.y-.06,30,.04,0xffe3bd));
  let r=RING_C.r, y=RING_C.y+.2; for(let i=0;i<3;i++){ r/=PHI; y+=.42; const gm=glow(0xffe7c4); (window.CHAND=window.CHAND||[]).push(gm); const h=new T.Mesh(new T.TorusGeometry(r,.032-.004*i,6,80),gm); h.rotation.x=Math.PI/2; h.position.y=y; ringC.add(h);
    /* v23k: his go, in the closing overhead each ring becomes a soft gold LED strip with a warm glow spilling off it, instead of going dark */
    const GU={uR:{value:r},uW:{value:.32},uC:{value:new T.Color(0xffc46a)},uOp:{value:0}}; const gl_=new T.Mesh(new T.RingGeometry(Math.max(.05,r-1.1),r+1.1,128,1).rotateX(-Math.PI/2),new T.ShaderMaterial({uniforms:GU,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,
      vertexShader:'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:'precision highp float; uniform float uR,uW,uOp; uniform vec3 uC; varying vec3 vP; void main(){ float d=abs(length(vP.xz)-uR); float a=exp(-d*d/(uW*uW))*.75+exp(-d/(uW*2.2))*.25; gl_FragColor=vec4(uC*a*uOp,1.); }'})); gl_.position.y=y; gl_.renderOrder=6; gl_.frustumCulled=false; gl_.visible=false; ringC.add(gl_); (window.CHANDG=window.CHANDG||[]).push(GU); gl_.userData.gu=GU; (window.CHANDGM=window.CHANDGM||[]).push(gl_); } }   // a chandelier of halo rings, each the golden section of the last
/* v23k: his note, every ring up there is a light that goes out, not just the three halo rings. Each truss ring (the throw ring, both decks of ring A,
   ring B, ring C) gets an LED strip on its outer face with the same soft warm-white glow; they show lit on the cut into the closing overhead and then
   switch off one by one, outer to inner, with the three halo rings last (updateRig). Before the overhead nothing changes. */
const RINGL=[]; { const FS='precision highp float; uniform float uR,uW,uOp; uniform vec3 uC; varying vec3 vP; void main(){ float d=abs(length(vP.xz)-uR); float a=exp(-d*d/(uW*uW))*.75+exp(-d/(uW*2.2))*.25; gl_FragColor=vec4(uC*a*uOp,1.); }';
  const add=(g,r,y,dr)=>{ const sm=glow(0xffe7c4), st=new T.Mesh(new T.TorusGeometry(r,.03,6,240),sm); st.rotation.x=Math.PI/2; st.position.y=y; st.visible=false; st.frustumCulled=false; g.add(st);
    const GU={uR:{value:r},uW:{value:.38},uC:{value:new T.Color(0xffe7c4)},uOp:{value:0}}, gl_=new T.Mesh(new T.RingGeometry(Math.max(.05,r-1.4),r+1.4,256,1).rotateX(-Math.PI/2),new T.ShaderMaterial({uniforms:GU,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,
      vertexShader:'varying vec3 vP; void main(){ vP=position; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',fragmentShader:FS}));
    gl_.position.y=y; gl_.renderOrder=6; gl_.frustumCulled=false; gl_.visible=false; g.add(gl_); RINGL.push({st,sm,gl_,GU,dots:dr===null?[]:(window.RDOTS||[]).filter(d=>d.parent===g&&Math.abs(d.userData.dotR-(r-dr))<.05)}); };
  add(ringA,THROW.r+.2,THROW.y+.18,.2); add(ringA,RING_A.r+.23,RING_A.y+1.05+.21,null); add(ringA,RING_A.r+.23,RING_A.y+.21,.23); add(ringB,RING_B.r+.23,RING_B.y+.21,.23); add(ringC,RING_C.r+.2,RING_C.y+.18,.2);
  for(const R of [RING_A,RING_B,RING_C]) add(grid,R.r,ROOM_H-1.5+.11,null);   /* the fixed grid's three steel rings, nearest the overhead camera, are lights too */
  RINGL.sort((a,b)=>b.GU.uR.value-a.GU.uR.value);   /* they go out from the outside in */
  window.RINGL=RINGL; }
// light that actually lands on the seats: three slow pools from ring A
for(let i=0;i<3;i++){ const sp=new T.SpotLight([0xffc890,0x9db4ff,0xffa8d0][i],.9,26,.34,.8,1.4); sp.position.copy(pol(i/3*TAU+.6,RING_A.r,RING_A.y-.3)); scene.add(sp); scene.add(sp.target); pools.push(sp); }
const _rd=new T.Vector3(), _rdn=new T.Vector3(0,-1,0), _rs=new T.Vector3(), _rc=new T.Color(), WARM=new T.Color(0xfff0dc);
const _gold=new T.Color(0xffb54a);
function updateRig(t,dt){ { const ft=FILM.on?FILM.t:0, ov=FILM.on&&ft>=76.5, OFF=window.RINGS_OFF||{t:79,gap:.19,fall:.14}, LV=window.RINGS_LV||{strip:.3,halo:.4,glow:.035};   /* v23k: his note, way more subtle: a faint warm line and a whisper of glow */   /* v23k: his note (third time), the overhead rings are lights that are ON and get turned OFF, never the other way round: through the film they stay lit as before; on the cut into the overhead they show as lit strip lights with a soft warm-white glow, then from 79.0 they switch off one by one, outer to inner, a quarter second apart, and stay dark, well before the title comes up at 81.3; the aisle marks go down with them */ const offK=i=>FILM.on?smooth(clamp((ft-(OFF.t+OFF.gap*i))/OFF.fall,0,1)):0, NL=RINGL.length; RINGL.forEach((L,i)=>{ const on=1-offK(i), k=ov?on:0; L.st.visible=k>.003; L.sm.color.setHex(0xffe7c4).multiplyScalar(k*LV.strip); L.gl_.visible=k>.003; L.GU.uOp.value=LV.glow*k; for(const d of L.dots) d.material.color.setHex(0xffe3bd).multiplyScalar(.1+.9*on); }); if(window.CHAND) CHAND.forEach((m,i)=>{ const on=1-offK(NL+i); m.color.setHex(0xffe7c4).multiplyScalar((.08+.92*on)*(ov?LV.halo:1)); }); if(window.MARKM) MARKM.color.setHex(0xfff1dc).multiplyScalar(1-.85*(FILM.on?smooth(clamp((ft-OFF.t)/.6,0,1)):0)); if(window.CHANDGM) CHANDGM.forEach((g,i)=>{ const k=ov?1-offK(NL+i):0; g.visible=k>.003; g.userData.gu.uOp.value=LV.glow*k; g.userData.gu.uC.value.setHex(0xffe7c4); }); }   ringA.rotation.y=-S.discA; if(!REDUCED) S.ringB+=dt*.05; ringB.rotation.y=-S.ringB; ringC.rotation.y=S.ringB*PHI;
  S.houseK+=clamp((S.house?1:0)-S.houseK,-dt*.9,dt*.9); const hk=smooth(S.houseK), show=1-.82*hk;
  const dk=.25+.75*SHOW.dim; ambL.intensity=lerp(.36,2.4,hk)*dk+(FILM.on?hitPulse()*.55*SHOW.dim+pushK()*1.3:0);   /* a white flash on the big hits */ hemiL.intensity=lerp(.3,2.2,hk)*dk+(FILM.on?pushK()*.9:0); houseKey.intensity=lerp(1.15,5.5,hk); houseCans.material.color.setRGB(1,.86,.66).multiplyScalar(.08+.92*hk);
  scene.fog.density=S.haze*.042*(1-.75*hk); scene.fog.color.setRGB(.03,.028,.042).lerp(SHOW.c,.12*SHOW.dim*(1-hk));
  const pulse=.5+.5*Math.sin(t*2.1), half=S.gap/2, hp=hitPulse(), bp=FILM.on?Math.min(1,musicPulse()*(.4+.6*musicEnergy())+hp):Math.pow(1-((t*118/60)%1),2);
  for(const b of ringBeams){
    if(FILM.on&&FILM.team){ // the closing overhead: each slice of the rig aims at the stage it hangs over, in that team's colour
      b.piv.getWorldPosition(_tw); const wa=Math.atan2(_tw.x,-_tw.z), k=Math.round(wa/(TAU/4)), sa=k*TAU/4;
      _tt.copy(pol(sa+Math.sin(t*.4+b.ph)*.32,17.5+2.2*Math.sin(t*.3+b.ph*2),STAGE_H)).sub(_tw).normalize(); b.piv.parent.getWorldQuaternion(_tq); _tt.applyQuaternion(_tq.invert());
      b.piv.quaternion.setFromUnitVectors(_rdn,_tt); b.col.lerp(teamCol(k),.08); b.m.uniforms.uC.value.copy(b.col); b.fl.material.color.copy(b.col);
      b.m.uniforms.uI.value=(.5+.25*bp)*HZ()*Math.max(show,.7); b.fl.material.opacity=1; continue; }
    if(b.stage&&S.club){ const a=b.a+t*.35*(b.i%2?1:-1), r=4+3.5*Math.sin(t*.5+b.ph); _rd.set(Math.sin(a)*r,(FOLD.k>.9?STAGE_H:0)+.1,-Math.cos(a)*r).applyAxisAngle(YAX,-S.discA).sub(b.piv.position).normalize(); b.piv.quaternion.setFromUnitVectors(_rdn,_rd.applyAxisAngle(YAX,S.discA));
      b.col.copy(b.i%2?SHOW.c2:SHOW.c); b.m.uniforms.uC.value.copy(b.col); b.fl.material.color.copy(b.col); b.m.uniforms.uI.value=(.12+.3*bp)*HZ()*show; b.fl.material.opacity=.4+.6*bp; continue; }
    if(b.stage){ // swing between the house and the stage as the screens open in front of this fixture
      const at=clamp(b.a*.94+(REDUCED?0:Math.sin(t*.31+b.ph)*.1),-1.52,1.52), w=smooth(clamp((half-Math.abs(at))/.12,0,1));
      _rs.copy(pol(at,18.3+(REDUCED?0:1.7*Math.sin(t*.23+b.ph*2)),STAGE_H)).sub(b.piv.position).normalize(); _rd.copy(pol(b.a,6.5,1.4)).sub(b.piv.position).normalize().lerp(_rs,w).normalize();
      b.piv.quaternion.setFromUnitVectors(_rdn,_rd);
      const wa=S.discA+at, k=((Math.round(wa/(TAU/4))%4)+4)%4; _rc.copy(((b.i%2)^(FILM.swap?1:0))?SHOW.c2:SHOW.c).lerp(WARM,FILM.on?.25:.42); b.col.lerp(w>.02?_rc:WARM,.06); b.m.uniforms.uC.value.copy(b.col); b.fl.material.color.copy(b.col);
      b.m.uniforms.uI.value=lerp(.06,.3+.16*bp,w)*show*HZ()*SHOW.dim; b.fl.material.opacity=(.55+.35*pulse)*(.45+.55*show); }
    else{ const cs=S.club?2.6:1, x=Math.sin(t*.23*cs+b.ph)*(S.club?.8:.5), z=-.35+Math.cos(t*.17*cs+b.ph)*(S.club?.5:.25); _rd.set(x*b.ca-z*b.sa,-1,x*b.sa+z*b.ca).normalize(); b.piv.quaternion.setFromUnitVectors(_rdn,_rd); b.m.uniforms.uI.value=(REDUCED?.1:.085+.05*Math.sin(t*.6+b.ph))*show*HZ()*(S.club?3:1)*SHOW.dim; b.fl.material.opacity=.55+.3*pulse; } }
  { const pk=FILM.on?pushK():0; if(pk>.002) for(const b of ringBeams){ b.m.uniforms.uI.value*=1+2.2*pk; b.fl.material.opacity=Math.min(1,b.fl.material.opacity*(1+pk)); } }   /* t23: every beam in the rig surges on the push and settles back */
  for(const kq of keys){ const lim=Math.max(0,half-.14), at=clamp(kq.a,-lim,lim), w=smooth(clamp(half/.25,0,1)); kq.sp.target.position.copy(pol(at,19.6,STAGE_H+1.2)); kq.sp.intensity=1.25*w*(1-.5*hk)*SHOW.dim; }
  pools.forEach((sp,i)=>{ const a=t*.11+i*2.1, r=5+3*Math.sin(t*.07+i); sp.target.position.set(Math.sin(a)*r,1.5,Math.cos(a)*r); });
  for(const tr of fly.trolleys){ tr.g.position.z=tr.s*(2.9+(REDUCED?0:Math.sin(t*.12+tr.s)*1.6)); const drop=3.2+(REDUCED?0:Math.sin(t*.19+tr.s*2)*.9); tr.hoop.position.y=-drop; tr.hoop.rotation.y=t*.4*tr.s; const p=tr.ln.geometry.attributes.position; p.setY(1,-drop+.45); p.setY(3,-drop+.45); p.needsUpdate=true; } }

// ================= SEATING: exactly 600 on the turntable =================
// Three plush rows in front with more legroom and a drinks table between each pair. The aisles are sized as runways for the performers:
// a 2.2 m centre aisle, two 1.6 m side aisles running straight front to back, a 2 m cross-aisle half way up and an open apron at the foot of the stairs.
// The rake is worked out row by row so every seat sees the stage floor over the row in front (C value 90 mm), and no steeper.
const FRONT={keep:-9.75};
const SP={fz:30,first:9.0,R:13.05,vipRows:3,vipPitch:1.3,pitch:.9,crossAfter:7,cross:2.0,eye:1.2,focusR:15.0,C:.09,w:.54,vipW:.76,table:.44,aisle:2.2,side:1.6,sideX:5.0};
const camPads=[[-8.6,9.3,1.5],[8.6,9.3,1.5],[-12.0,-1.0,.9],[12.0,-1.0,.9],[0,12.3,.9]];
function seatLayout(){ const rows=[], seats=[], tables=[], P=SP; let rho=P.fz-P.first, cross=null;
  for(let i=0;i<P.vipRows;i++){ rows.push({rho,vip:true,pitch:P.vipPitch}); rho+=P.vipPitch; }
  let n=0; while(rho<P.fz+P.R){ rows.push({rho,vip:false,pitch:P.pitch}); n++; rho+=P.pitch; if(n===P.crossAfter){ rows[rows.length-1].crossBehind=true; cross={rho:rho-P.pitch/2+P.cross/2,row:rows.length-1}; rho+=P.cross; } }
  const D=r=>r.rho-P.fz+P.focusR; rows[0].y=0; rows[0].E=P.eye-STAGE_H;
  for(let i=1;i<rows.length;i++){ rows[i].E=(rows[i-1].E+P.C)*D(rows[i])/D(rows[i-1]); rows[i].y=Math.max(0,rows[i].E+STAGE_H-P.eye); }
  const at=(r,d,s)=>{ const psi=s*d/r.rho; return {x:r.rho*Math.sin(psi),z:-P.fz+r.rho*Math.cos(psi),y:r.y,psi}; }, ok=p=>Math.hypot(p.x,p.z)<=P.R&&p.z>=FRONT.keep&&!camPads.some(k=>Math.hypot(p.x-k[0],p.z-k[1])<k[2]);
  rows.forEach((r,ri)=>{ const w=r.vip?P.vipW:P.w, unit=r.vip?2*P.vipW+P.table:w;
    for(const s of [-1,1]){ let c=P.aisle/2;                                                      // c: distance along the row from the centre line
      while(c<17){ if(c<P.sideX+P.side&&c+(r.vip?2*P.vipW:w)>P.sideX+.001) c=P.sideX+P.side;      // step over the side aisle
        const put=d=>{ const p=at(r,d,s); if(!ok(p)) return false; p.vip=r.vip; p.row=ri; seats.push(p); return true; };
        if(r.vip){ const a=put(c+.5*P.vipW), b=put(c+1.5*P.vipW), d=c+2*P.vipW+P.table/2; if(a&&b&&!(d+P.table/2>P.sideX&&d-P.table/2<P.sideX+P.side)){ const p=at(r,d,s); if(Math.hypot(p.x,p.z)<P.R-.3) tables.push(p); } }
        else put(c+w/2);
        c+=unit; } } });
  seats.sort((a,b)=>b.row-a.row||Math.abs(b.psi)-Math.abs(a.psi)); const cut=seats.length-SEATS; if(cut<0) console.error('seat layout under 600:',seats.length);
  const sideC=P.sideX+P.side/2; cross.y=rows[cross.row].y;
  return {rows,seats:seats.slice(Math.max(0,cut)),tables,sideC,sideA:sideC/(P.fz-P.first),cross}; }
const LAY=seatLayout(); window.__LAY=LAY; window.__SP=SP;
const rowStart=i=>LAY.rows[i].rho-LAY.rows[i].pitch/2;
function yAt(x,z){ const rho=Math.hypot(x,z+SP.fz); let y=0; for(let i=0;i<LAY.rows.length;i++){ if(rho>=rowStart(i)) y=LAY.rows[i].y; else break; } return y; }
const AISLES=[[0,SP.aisle],[LAY.sideC,SP.side],[-LAY.sideC,SP.side]];      // [distance from the centre line, width]

// ================= TURNTABLE =================
CAT.cur='disc';
const disc=new T.Group(); scene.add(disc);
const carpetMat=(rep)=>new T.MeshStandardMaterial({map:tex('tex-carpet-grey.jpg',rep),normalMap:tex('tex-carpet-n.jpg',rep),color:0xffffff,roughness:.95,metalness:0,envMapIntensity:.25});   /* v23c (his note): with the black thrust, the carpet is one grey throughout (was lavender 0xb9a6cc on tex-carpet.jpg) */
{ const top=new T.Mesh(new T.CircleGeometry(R_DISC,96),carpetMat(16)); top.rotation.x=-Math.PI/2; top.receiveShadow=true; disc.add(top);
  const edge=new T.Mesh(new T.TorusGeometry(R_DISC-.14,.028,6,160),glow(0xff9a3c)); edge.rotation.x=Math.PI/2; edge.position.y=.03; disc.add(edge); edge.userData.edge=true;
  disc.add(new T.Mesh(arcPanel(R_DISC-.01,0,TAU,-.4,0,{inward:false}),M.steel)); }
const seating=new T.Group(); disc.add(seating);
const aisleKit=new T.Group(); seating.add(aisleKit);          // step lights, runway edges and performer marks: they go down with the floor
const TIERS=[];
/* t22 test (?tiers2): the tiers as real raked seating would be finished: dark carpet treads, black riser faces with a gold light on each step edge, brushed steel at the open ends */
const TIER2=/[?&]tiers2/.test(location.search)||window.__tiers2===true;
const TIERM=TIER2?[(()=>{ const m=carpetMat(1); m.color.setHex(0x3b3344); return m; })(),new T.MeshStandardMaterial({color:0x0e0d12,roughness:.62,metalness:.1}),new T.MeshStandardMaterial({color:0x8e9198,roughness:.32,metalness:.9,envMapIntensity:1.1})]:null;
/* t23 test (?under=1 open frame, ?under=2 closed skirt with a control booth): what the space under the raked seating would really look like. Off by default. */
const UNDER=+((/[?&]under=(\d)/.exec(location.search)||/under(\d)/.exec(location.hash)||[])[1]||window.__under||0), SLAB=.26;   /* v23b: his note, the under-bleachers office, curved stairs and window are out of the tour for now (?under=4 brings them back; Enric's bar tour comes next) */   /* v23 his note: the control room (option 1), the curved stairs and the one tinted window are in by default */
const UM=UNDER?(()=>{ const cv=document.createElement('canvas'); cv.width=32; cv.height=128; const c=cv.getContext('2d'); c.fillStyle='#9a9ea6'; c.fillRect(0,0,32,128); for(let y=0;y<128;y+=2){ c.fillStyle='rgba(255,255,255,'+(.04+.05*Math.random())+')'; c.fillRect(0,y,32,1); } c.strokeStyle='#5a5e66'; c.lineWidth=1.5; for(let k=-4;k<20;k++){ c.beginPath(); c.moveTo(0,k*8); c.lineTo(32,k*8+6); c.stroke(); }
  const st=new T.CanvasTexture(cv); st.wrapS=st.wrapT=T.RepeatWrapping; st.repeat.set(1,3);
  return { deck:new T.MeshStandardMaterial({color:0x2b2c31,roughness:.55,metalness:.75,side:T.DoubleSide}), steel:new T.MeshStandardMaterial({color:0x55585f,roughness:.4,metalness:.85}),
    spiral:new T.MeshStandardMaterial({color:0xffffff,map:st,roughness:.35,metalness:.8}), pit:new T.MeshStandardMaterial({color:0x18181b,roughness:.92,metalness:0}), work:glow(0x5f8dff),
    skirt:new T.MeshStandardMaterial({color:0x101013,roughness:.55,metalness:.55,side:T.DoubleSide}), glass:new T.MeshStandardMaterial({color:0x8fa6bb,roughness:.05,metalness:.2,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false}) }; })():null;
function underGeo(ra,rb,y,yp){ const Rr=12.98, fz=SP.fz, pmOf=r=>{ const c=(r*r+fz*fz-Rr*Rr)/(2*fz*r); return c>=1?0:Math.acos(clamp(c,-1,1)); }, pm=Math.max(pmOf(ra),pmOf(rb)); if(pm<.01) return null;
  const n=Math.max(4,Math.ceil(pm*2/(.5*D2R))), GP=[[],[],[]], GU=[[],[],[]]; let gk=0; const ys=y-SLAB, yb=Math.min(yp,ys);
  const pt=(r,p,yy)=>{ let x=r*Math.sin(p), z=-fz+r*Math.cos(p); const h=Math.hypot(x,z); if(h>Rr){ x*=Rr/h; z*=Rr/h; } return [x,yy,z]; };
  const quad=(a,b,c,d,side)=>{ for(const v of [a,b,c,a,c,d]){ GP[gk].push(...v); if(side) GU[gk].push((v[0]+v[2])*.6,v[1]*.6); else GU[gk].push(v[0]*.6,v[2]*.6); } };
  for(let i=0;i<n;i++){ const p0=lerp(-pm,pm,i/n), p1=lerp(-pm,pm,(i+1)/n);
    gk=0; quad(pt(ra,p0,y),pt(rb,p0,y),pt(rb,p1,y),pt(ra,p1,y));
    gk=1; quad(pt(ra,p0,yb),pt(ra,p0,y),pt(ra,p1,y),pt(ra,p1,yb),1); quad(pt(rb,p1,ys),pt(rb,p1,y),pt(rb,p0,y),pt(rb,p0,ys),1);
    gk=2; quad(pt(ra,p0,ys),pt(ra,p1,ys),pt(rb,p1,ys),pt(rb,p0,ys)); quad(pt(ra,p0,ys),pt(ra,p0,y),pt(rb,p0,y),pt(rb,p0,ys),1); quad(pt(ra,p1,ys),pt(rb,p1,ys),pt(rb,p1,y),pt(ra,p1,y),1); }   // underside of the deck, and its edge where the circle cuts it
  const g=new T.BufferGeometry(), P=[], U=[]; let o=0; for(let k=0;k<3;k++){ P.push(...GP[k]); U.push(...GU[k]); g.addGroup(o,GP[k].length/3,k); o+=GP[k].length/3; }
  g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); g.computeVertexNormals(); return g; }
const BOOTH={x:3.0,z0:6.4,h:2.55};
const inBooth=(x,z)=>UNDER===2&&Math.abs(x)<BOOTH.x+.35&&z>BOOTH.z0-.3||UNDER===4&&Math.hypot(x,z+SP.fz)>CTRL.r0-.4;
const CTRL={r0:36.35};   /* t23 option 1: rows from here back never lower; the control room lives under them */
function underRow(i,ra,rb,y,yp,tm){ const g=underGeo(ra,rb,y,yp); if(!g) return; const m=new T.Mesh(g,[tm,tm,UM.deck]); m.receiveShadow=true; m.castShadow=true; seating.add(m); TIERS.push({m,row:i});
  const ys=y-SLAB, fz=SP.fz, Rr=12.98, rm=(ra+rb)/2; if(ys<.3) return; if(UNDER===3){ scissorRow(m,ra,rb,ys); return; } if(UNDER===5){ scissorReal(m,ra,rb,ys,i); return; }
  const cMax=(()=>{ const c=(rm*rm+fz*fz-(Rr-.45)*(Rr-.45))/(2*fz*rm); return c>=1?0:Math.acos(clamp(c,-1,1)); })(); if(cMax<.01) return;
  const nC=Math.max(2,Math.floor(2*cMax*rm/3.2)+1), cols=[]; for(let k=0;k<nC;k++){ const ps=lerp(-cMax,cMax,k/(nC-1)), x=rm*Math.sin(ps), z=-fz+rm*Math.cos(ps); if(!inBooth(x,z)) cols.push([x,z,ps]); }
  const mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), v=new T.Vector3(), sc=new T.Vector3(), up=new T.Vector3(0,1,0), d=new T.Vector3();
  const ci=new T.InstancedMesh(new T.CylinderGeometry(.13,.13,1,16),UM.spiral,cols.length); cols.forEach((c,k)=>{ mt.compose(v.set(c[0],ys/2,c[1]),q.identity(),sc.set(1,ys,1)); ci.setMatrixAt(k,mt); }); ci.frustumCulled=false; ci.castShadow=true; m.add(ci);
  const base=new T.InstancedMesh(new T.BoxGeometry(.6,.12,.6),UM.steel,cols.length); cols.forEach((c,k)=>{ q.setFromEuler(e.set(0,c[2],0)); mt.compose(v.set(c[0],.06,c[1]),q,sc.set(1,1,1)); base.setMatrixAt(k,mt); }); base.frustumCulled=false; m.add(base);
  const wl=new T.InstancedMesh(new T.SphereGeometry(.025,6,5),UM.work,cols.length); cols.forEach((c,k)=>{ mt.makeTranslation(c[0]+.3*Math.cos(c[2]),ys-.06,c[1]-.3*Math.sin(c[2])); wl.setMatrixAt(k,mt); }); wl.frustumCulled=false; m.add(wl);
  if(false&&ys>1.0&&cols.length>1){ const br=[]; for(let k=0;k+1<cols.length;k++){ const a=cols[k], b=cols[k+1]; if(Math.hypot(a[0]-b[0],a[1]-b[1])>3) continue; for(const [y0,y1] of [[.2,ys-.12],[ys-.12,.2]]) br.push([a[0],y0,a[1],b[0],y1,b[1]]); }
    const bi=new T.InstancedMesh(new T.BoxGeometry(.045,1,.045),UM.steel,Math.max(1,br.length)); br.forEach((b,k)=>{ d.set(b[3]-b[0],b[4]-b[1],b[5]-b[2]); const L=d.length(); q.setFromUnitVectors(up,d.normalize()); mt.compose(v.set((b[0]+b[3])/2,(b[1]+b[4])/2,(b[2]+b[5])/2),q,sc.set(1,L,1)); bi.setMatrixAt(k,mt); }); bi.count=br.length; bi.frustumCulled=false; m.add(bi); }
  const bm=[]; for(const rr of [ra+.1,rb-.1]){ const cm=(()=>{ const c=(rr*rr+fz*fz-(Rr-.1)*(Rr-.1))/(2*fz*rr); return c>=1?0:Math.acos(clamp(c,-1,1)); })(), nS=Math.max(1,Math.ceil(2*cm*rr/1.0)); for(let k=0;k<nS;k++){ const ps=lerp(-cm,cm,(k+.5)/nS); bm.push([rr*Math.sin(ps),-fz+rr*Math.cos(ps),ps,2*cm*rr/nS]); } }
  const be=new T.InstancedMesh(new T.BoxGeometry(1,.22,.12),UM.steel,bm.length); bm.forEach((b,k)=>{ q.setFromEuler(e.set(0,b[2],0)); mt.compose(v.set(b[0],ys-.11,b[1]),q,sc.set(b[3]*1.02,1,1)); be.setMatrixAt(k,mt); }); be.frustumCulled=false; m.add(be);
  const pg=tierGeo(ra,rb,.004); if(pg){ const pm_=new T.Mesh(pg,UM.pit); pm_.receiveShadow=true; m.add(pm_); } }
/* t23 test (?under=3): every row is its own scissor lift, seen through a glass wall like a watch movement. Gunmetal arms, brass pivots, chrome rams, warm light inside. */
const SM=(UNDER===3||UNDER===5)?{ arm:new T.MeshStandardMaterial({color:0x2e3238,roughness:.32,metalness:.9,envMapIntensity:1.4}), brass:new T.MeshStandardMaterial({color:0xc9973f,roughness:.22,metalness:1,envMapIntensity:1.6}),
  chrome:new T.MeshStandardMaterial({color:0xe8ecf0,roughness:.08,metalness:1,envMapIntensity:2}), rail:new T.MeshStandardMaterial({color:0x1d2025,roughness:.4,metalness:.85}),
  floor:new T.MeshStandardMaterial({color:0x0c0c0e,roughness:.18,metalness:.2,envMapIntensity:1.2}), led:glow(0xffb866) }:null;
function scissorRow(m,ra,rb,ys){ const fz=SP.fz, Rr=12.6, rm=(ra+rb)/2, n=Math.max(1,Math.round(ys/1.05)), hs=ys/n, DP=.118, sp=Math.min(3.4,rm*DP*.78);   /* v2: one scissor bay per 6.8 degrees of turntable, the same angles on every row, so the stacks line up in ranks like a movement */
  const cm=(()=>{ const c=(rm*rm+fz*fz-Rr*Rr)/(2*fz*rm); return c>=1?0:Math.acos(clamp(c,-1,1)); })(); if(cm<.02) return;
  const planes=[ra+.14,rb-.14], arms=[], hubs=[], axles=[], rams=[], rails=[], leds=[], bays=[]; for(let k=-40;k<=40;k++){ const ps=(k+.5)*DP; if(Math.abs(ps)+(sp/2+.2)/rm<cm) bays.push(ps); }
  for(const ps of bays){ const tx=Math.cos(ps), tz=-Math.sin(ps);                          // tangent along the row
    for(const pr of planes){ const cx=pr*Math.sin(ps), cz=-fz+pr*Math.cos(ps), P=(du,yy)=>[cx+tx*du,yy,cz+tz*du];
      for(let k=0;k<n;k++){ const y0=k*hs, y1=(k+1)*hs; arms.push([P(-sp/2,y0),P(sp/2,y1)],[P(sp/2,y0),P(-sp/2,y1)]); hubs.push(P(0,(y0+y1)/2)); }
      for(let k=0;k<=n;k++){ hubs.push(P(-sp/2,k*hs)); hubs.push(P(sp/2,k*hs)); }
      rails.push([P(-sp/2-.12,.05),P(sp/2+.12,.05)],[P(-sp/2-.12,ys-.05),P(sp/2+.12,ys-.05)]); }
    const a=planes[0], b=planes[1], Q=(r,du,yy)=>[r*Math.sin(ps)+tx*du,yy,-fz+r*Math.cos(ps)+tz*du];
    for(let k=0;k<=n;k++) for(const du of [-sp/2,sp/2]) axles.push([Q(a,du,k*hs),Q(b,du,k*hs)]);
    for(let k=0;k<n;k++) axles.push([Q(a,0,(k+.5)*hs),Q(b,0,(k+.5)*hs)]);
    const rm2=(a+b)/2; rams.push([Q(rm2,-sp/2+.15,.12),Q(rm2,0,hs*.5)]);                                                    // the hydraulic ram that opens the bottom stage
    leds.push(Q(planes[0]-.1,0,.02)); }
  const mt=new T.Matrix4(), q=new T.Quaternion(), v=new T.Vector3(), sc=new T.Vector3(), up=new T.Vector3(0,1,0), d=new T.Vector3();
  const seg=(list,geo,mat,thick)=>{ const im=new T.InstancedMesh(geo,mat,Math.max(1,list.length)); list.forEach(([p0,p1],i)=>{ d.set(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]); const Ln=d.length(); q.setFromUnitVectors(up,d.normalize()); mt.compose(v.set((p0[0]+p1[0])/2,(p0[1]+p1[1])/2,(p0[2]+p1[2])/2),q,sc.set(thick,Ln,thick)); im.setMatrixAt(i,mt); }); im.count=list.length; im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; m.add(im); return im; };
  seg(arms,new T.BoxGeometry(1,1,1),SM.arm,.06);
  seg(axles,new T.CylinderGeometry(.5,.5,1,10),SM.rail,.05);
  seg(rails,new T.BoxGeometry(1,1,1),SM.rail,.1);
  seg(rams,new T.CylinderGeometry(.5,.5,1,12),SM.chrome,.07);
  { const im=new T.InstancedMesh(new T.CylinderGeometry(.055,.055,.16,16).rotateX(Math.PI/2),SM.brass,hubs.length); hubs.forEach((p,i)=>{ mt.makeTranslation(p[0],p[1],p[2]); im.setMatrixAt(i,mt); }); im.frustumCulled=false; m.add(im); }   // brass pivot hubs at every joint
  { const im=new T.InstancedMesh(new T.BoxGeometry(sp*.9,.02,.04),SM.led,leds.length); leds.forEach((p,i)=>{ const ps=Math.atan2(p[0],p[2]+fz); q.setFromEuler(new T.Euler(0,ps,0)); mt.compose(v.set(p[0],p[1],p[2]),q,sc.set(1,1,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; m.add(im); }   // a warm LED line along the base of each row
  const pg=tierGeo(ra,rb,.004); if(pg){ const pm_=new T.Mesh(pg,SM.floor); pm_.receiveShadow=true; m.add(pm_); } }
/* t23 (?under=5): the scissor rows as real seating lifts are built. 1 to 3 tall stages per row, box-section arms, one end pinned and the other rolling in a
   track, a ram in every stage, telescoping guide columns at both ends of the row, a cable chain carrying power up, heavy base and top frames. */
const SCIS=[];
function scissorReal(m,ra,rb,ys,row){ const fz=SP.fz, Rr=12.55, rm=(ra+rb)/2, n=Math.max(1,Math.min(3,Math.round(ys/1.35))), hs0=ys/n, DP=.2, sp0=Math.min(3.8,rm*DP*.62), L=Math.hypot(sp0,hs0-.12);
  const cm=(()=>{ const c=(rm*rm+fz*fz-Rr*Rr)/(2*fz*rm); return c>=1?0:Math.acos(clamp(c,-1,1)); })(); if(cm<.03) return;
  const bays=[]; for(let k=-20;k<=20;k++){ const ps=(k+.5)*DP; if(Math.abs(ps)+(L/2+.3)/rm<cm) bays.push(ps); }   /* room for the arms at their longest, folded flat */
  const planes=[ra+.16,rb-.16], mid=(ra+rb)/2;
  const Q=(r,ps,du,yy)=>{ const tx=Math.cos(ps), tz=-Math.sin(ps); return [r*Math.sin(ps)+tx*du,yy,-fz+r*Math.cos(ps)+tz*du]; };
  const lists=h=>{ const hs=Math.max(.13,h/n), span=Math.sqrt(Math.max(.01,L*L-(hs-.12)*(hs-.12))), x0=-sp0/2;   /* the pinned side stays put; the rolling side runs out along its track as the stage closes */
    const o={arms:[],pins:[],rolls:[],tracks:[],barrels:[],rods:[],axles:[],frames:[],gO:[],gI:[],chains:[]}, top=Math.max(hs*n,.26);
    for(const ps of bays){
      for(const pr of planes){
        for(let k=0;k<n;k++){ const y0=k*hs, y1=(k+1)*hs;
          o.arms.push([Q(pr,ps,x0,y0+.06),Q(pr,ps,x0+span,y1-.06)],[Q(pr,ps,x0+span,y0+.06),Q(pr,ps,x0,y1-.06)]);
          o.pins.push(Q(pr,ps,x0+span/2,(y0+y1)/2),Q(pr,ps,x0,y0+.06),Q(pr,ps,x0,y1-.06)); o.rolls.push(Q(pr,ps,x0+span,y0+.06),Q(pr,ps,x0+span,y1-.06)); }
        o.tracks.push([Q(pr,ps,x0+sp0-.5,.06),Q(pr,ps,x0+L+.12,.06)],[Q(pr,ps,x0+sp0-.5,top-.06),Q(pr,ps,x0+L+.12,top-.06)]);
        o.frames.push([Q(pr,ps,x0-.2,.06),Q(pr,ps,x0+L+.2,.06)],[Q(pr,ps,x0-.2,top-.06),Q(pr,ps,x0+L+.2,top-.06)]); }
      for(let k=0;k<n;k++){ const y0=k*hs, a=Q(mid,ps,x0+.25,y0+.12), b=Q(mid,ps,x0+span*.55,y0+hs*.62), c=[(a[0]+b[0])/2,(a[1]+b[1])/2,(a[2]+b[2])/2]; o.barrels.push([a,c]); o.rods.push([c,b]); }
      for(let k=0;k<=n;k++) for(const du of [x0,x0+span]){ const yy=k===0?.06:k===n?top-.06:k*hs; o.axles.push([Q(planes[0],ps,du,yy),Q(planes[1],ps,du,yy)]); }
      for(let k=0;k<n;k++) o.axles.push([Q(planes[0],ps,x0+span/2,(k+.5)*hs),Q(planes[1],ps,x0+span/2,(k+.5)*hs)]); }
    for(const sg of [-1,1]){ const ps=sg*(cm-.35/rm); o.gO.push([Q(mid,ps,0,0),Q(mid,ps,0,Math.max(.2,top*.55))]); o.gI.push([Q(mid,ps,0,top*.45),Q(mid,ps,0,Math.max(.25,top-.02))]); if(sg>0) o.chains.push([Q(mid,ps,-.35,0),Q(mid,ps,-.35,Math.max(.2,top-.02))]); }
    return o; };
  const box=new T.BoxGeometry(1,1,1), cyl=new T.CylinderGeometry(.5,.5,1,14), chainM=new T.MeshStandardMaterial({color:0x0d0d0f,roughness:.7});
  const spec={arms:[box,SM.arm,.09,.16],tracks:[box,SM.rail,.08,.12],frames:[box,SM.rail,.14,.18],axles:[cyl,SM.rail,.06],barrels:[cyl,SM.rail,.11],rods:[cyl,SM.chrome,.055],gO:[box,SM.arm,.2],gI:[box,SM.chrome,.13],chains:[box,chainM,.09,.16]};
  const L0=lists(ys), IM={};
  const grp=new T.Group(); seating.add(grp);
  for(const k in spec){ const [g,mat]=spec[k]; const im=new T.InstancedMesh(g,mat,Math.max(1,L0[k].length)); im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; grp.add(im); IM[k]=im; }
  IM.pins=new T.InstancedMesh(new T.CylinderGeometry(.06,.06,.22,16).rotateX(Math.PI/2),SM.brass,L0.pins.length); IM.rolls=new T.InstancedMesh(new T.CylinderGeometry(.075,.075,.12,18).rotateX(Math.PI/2),SM.chrome,L0.rolls.length); for(const k of ['pins','rolls']){ IM[k].frustumCulled=false; grp.add(IM[k]); }
  const mt=new T.Matrix4(), q=new T.Quaternion(), v=new T.Vector3(), sc=new T.Vector3(), up=new T.Vector3(0,1,0), d=new T.Vector3();
  const fill=h=>{ const o=lists(h);
    for(const k in spec){ const [,,sx,sz]=spec[k], im=IM[k]; o[k].forEach(([p0,p1],i)=>{ d.set(p1[0]-p0[0],p1[1]-p0[1],p1[2]-p0[2]); const Ln=Math.max(.001,d.length()); q.setFromUnitVectors(up,d.normalize()); mt.compose(v.set((p0[0]+p1[0])/2,(p0[1]+p1[1])/2,(p0[2]+p1[2])/2),q,sc.set(sx,Ln,sz||sx)); im.setMatrixAt(i,mt); }); im.count=o[k].length; im.instanceMatrix.needsUpdate=true; }
    for(const k of ['pins','rolls']){ o[k].forEach((p,i)=>{ q.setFromEuler(new T.Euler(0,Math.atan2(p[0],p[2]+fz),0)); mt.compose(v.set(p[0],p[1],p[2]),q,sc.set(1,1,1)); IM[k].setMatrixAt(i,mt); }); IM[k].instanceMatrix.needsUpdate=true; } };
  let last=-1; SCIS.push({row,update(){ const h=Math.max(0,(typeof rowY==='function'?rowY(row):ys+SLAB)-SLAB); grp.visible=h>.25; if(Math.abs(h-last)<.002||!grp.visible) return; last=h; fill(h); }});   /* folded flat, the stack sits down in the pit under the floor */
  fill(ys); last=ys;
  const pg=tierGeo(ra,rb,.004); if(pg){ const pm_=new T.Mesh(pg,SM.floor); pm_.receiveShadow=true; m.add(pm_); }
  { const im=new T.InstancedMesh(new T.BoxGeometry(sp0*.9,.02,.04),SM.led,bays.length); bays.forEach((ps,i)=>{ const p=Q(planes[0]-.12,ps,0,.02); q.setFromEuler(new T.Euler(0,ps,0)); mt.compose(v.set(p[0],p[1],p[2]),q,sc.set(1,1,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; grp.add(im); } }
/* t23 (mode 5): the glass in panels, one run per row; each run rides its row and slides down into the ring slot in the pit floor as the row lowers */
function glassRows(){ const Rr=12.99, fz=SP.fz, steps=1440, byRow={}, fr=new T.MeshStandardMaterial({color:0x6b5232,roughness:.35,metalness:.9});
  const glass=new T.MeshPhysicalMaterial({color:0xdfe8ee,roughness:.04,metalness:0,transparent:true,opacity:.14,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:2.2,side:T.DoubleSide,depthWrite:false});
  const rowAt=rho=>{ let r=-1; for(let i=0;i<LAY.rows.length;i++){ if(rho>=rowStart(i)) r=i; else break; } return r; };
  for(let k=0;k<steps;k++){ const t0=k/steps*TAU-Math.PI, t1=(k+1)/steps*TAU-Math.PI, tm_=(t0+t1)/2, x=Rr*Math.sin(tm_), z=Rr*Math.cos(tm_), r=rowAt(Math.hypot(x,z+fz)); if(r<0) continue; const H=LAY.rows[r].y-SLAB; if(H<=.03) continue;
    (byRow[r]=byRow[r]||{H,q:[],t:[]}); const P=(t,yy)=>[Rr*Math.sin(t),yy,Rr*Math.cos(t)]; byRow[r].q.push(...P(t0,0),...P(t1,0),...P(t1,H),...P(t0,0),...P(t1,H),...P(t0,H)); byRow[r].t.push(tm_); }
  for(const r in byRow){ const R=byRow[r], g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(R.q,3)); g.computeVertexNormals(); const grp=new T.Group(); seating.add(grp);
    const gm=new T.Mesh(g,glass); gm.renderOrder=5; grp.add(gm);
    const ms=[]; let last=-99; for(const a of R.t){ if(a*Rr-last>=1.5){ ms.push(a); last=a*Rr; } }
    const mt=new T.Matrix4(), v=new T.Vector3(), q=new T.Quaternion(), sc=new T.Vector3(); const im=new T.InstancedMesh(new T.BoxGeometry(.05,1,.07),fr,Math.max(1,ms.length)); ms.forEach((a,i)=>{ q.setFromEuler(new T.Euler(0,a,0)); mt.compose(v.set(Rr*Math.sin(a),R.H/2,Rr*Math.cos(a)),q,sc.set(1,R.H,1)); im.setMatrixAt(i,mt); }); im.count=ms.length; im.frustumCulled=false; grp.add(im);
    const row=+r; SCIS.push({row,update(){ const h=Math.max(0,(typeof rowY==='function'?rowY(row):R.H+SLAB)-SLAB); grp.position.y=h-R.H; grp.visible=h>.01; }}); }
  // the ring slot in the pit floor that takes the glass, a dark line just inside the edge
  { const sl=new T.Mesh(new T.RingGeometry(Rr-.05,Rr+.05,256),new T.MeshBasicMaterial({color:0x030304})); sl.rotation.x=-Math.PI/2; sl.position.y=.006; seating.add(sl); }
  for(const a of [-1.2,-.6,0,.6,1.2,2.0,-2.0]){ const pl=new T.PointLight(0xffb870,2.2,6.5,1.8); pl.position.set(11.6*Math.sin(a),.35,11.6*Math.cos(a)); seating.add(pl); } }
function glassSkirt(){ const Rr=12.99, steps=1440, G=[], fr=new T.MeshStandardMaterial({color:0x6b5232,roughness:.35,metalness:.9}), zc=x=>Math.sqrt(Rr*Rr-x*x);
  const glass=new T.MeshPhysicalMaterial({color:0xdfe8ee,roughness:.04,metalness:0,transparent:true,opacity:.14,reflectivity:.9,clearcoat:1,clearcoatRoughness:.03,envMapIntensity:2.2,side:T.DoubleSide,depthWrite:false});
  const tops=[];
  for(let k=0;k<steps;k++){ const t0=k/steps*TAU-Math.PI, t1=(k+1)/steps*TAU-Math.PI, tm_=(t0+t1)/2, x=Rr*Math.sin(tm_), z=Rr*Math.cos(tm_), h=yAt(x*.999,z*.999)-SLAB; if(h<=.03) continue;
    const P=(t,yy)=>[Rr*Math.sin(t),yy,Rr*Math.cos(t)]; G.push(...P(t0,0),...P(t1,0),...P(t1,h),...P(t0,0),...P(t1,h),...P(t0,h)); tops.push([tm_,h]); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(G,3)); g.computeVertexNormals(); const gm=new T.Mesh(g,glass); gm.renderOrder=5; seating.add(gm);
  // bronze mullions every 1.5 m along the wall, and a sill line at the floor
  const mt=new T.Matrix4(), v=new T.Vector3(), q=new T.Quaternion(), sc=new T.Vector3(); const ms=[]; let last=-99;
  for(const [a,h] of tops){ const arc=a*Rr; if(arc-last>=1.5){ ms.push([a,h]); last=arc; } }
  const im=new T.InstancedMesh(new T.BoxGeometry(.05,1,.07),fr,ms.length); ms.forEach(([a,h],i)=>{ q.setFromEuler(new T.Euler(0,a,0)); mt.compose(v.set(Rr*Math.sin(a),h/2,Rr*Math.cos(a)),q,sc.set(1,h,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; seating.add(im);
  { const pts=tops.filter((_,i)=>i%4===0).map(([a])=>new T.Vector3(Rr*Math.sin(a)*1.001,.03,Rr*Math.cos(a)*1.001)); if(pts.length>2) seating.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),400,.04,6),fr)); }
  // warm light inside the machine room
  for(const a of [-1.2,-.6,0,.6,1.2,2.0,-2.0]){ const pl=new T.PointLight(0xffb870,2.2,6.5,1.8); pl.position.set(11.6*Math.sin(a),.35,11.6*Math.cos(a)); seating.add(pl); } }   /* v2: warm uplights just inside the glass, so the near stacks glow and the depth falls away into dark */
/* v23 his note: fewer windows. The back of the control room is solid, dark panel, with one 10 ft (3.05 m) high, 20 ft wide window in the middle,
   facing the way the club audience comes in: a look into the backstage. It has a privacy tint (window.ctrlTint(on)): black by default, glossy,
   showing a dim reflection of whatever is happening on the stage it faces. */
const WIN={hw:3.05,sill:.4,top:.4+3.05};
function controlRoom(){ const Rr=12.99, fz=SP.fz, steps=1440, SK=[], GL=[], tops=[];
  const skirt=new T.MeshStandardMaterial({color:0x101013,roughness:.55,metalness:.55,side:T.DoubleSide});
  const glass=new T.MeshPhysicalMaterial({color:0xe6eef4,roughness:.03,metalness:0,transparent:true,opacity:.12,clearcoat:1,clearcoatRoughness:.02,envMapIntensity:2.4,side:T.DoubleSide,depthWrite:false});
  const fr=new T.MeshStandardMaterial({color:0x0b0b0d,roughness:.35,metalness:.85});
  for(let k=0;k<steps;k++){ const t0=k/steps*TAU-Math.PI, t1=(k+1)/steps*TAU-Math.PI, tm_=(t0+t1)/2, x=Rr*Math.sin(tm_), z=Rr*Math.cos(tm_), h=yAt(x*.999,z*.999)-SLAB; if(h<=.03) continue;
    const P=(t,yy)=>[Rr*Math.sin(t),yy,Rr*Math.cos(t)], q=[...P(t0,0),...P(t1,0),...P(t1,h),...P(t0,0),...P(t1,h),...P(t0,h)];
    if(Math.hypot(x,z+fz)>CTRL.r0){ if(Math.abs(tm_)*Rr<WIN.hw&&h>WIN.top+.05){ const Q=(y0,y1)=>[...P(t0,y0),...P(t1,y0),...P(t1,y1),...P(t0,y0),...P(t1,y1),...P(t0,y1)]; SK.push(...Q(0,WIN.sill),...Q(WIN.top,h)); } else SK.push(...q); tops.push([tm_,h]); } else SK.push(...q); }
  const mk=(arr,mat,ro)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(arr,3)); g.computeVertexNormals(); const m=new T.Mesh(g,mat); if(ro) m.renderOrder=ro; seating.add(m); return m; };
  mk(SK,skirt); mk(GL,glass,5);
  const mt=new T.Matrix4(), v=new T.Vector3(), q=new T.Quaternion(), sc=new T.Vector3(); const ms=[]; let last=-99;
  for(const [a,h] of tops){ const arc=a*Rr; if(Math.abs(arc)<WIN.hw+.2) continue; if(arc-last>=1.4){ ms.push([a,h]); last=arc; } }
  // the window: a flat pane on the chord, set into the curve, with a dark metal frame and reveals; tinted (a dim real-time reflection) or clear
  { const al=WIN.hw/Rr, zc=Rr*Math.cos(al)-.03, w=2*Rr*Math.sin(al), Hh=WIN.top-WIN.sill, yc=WIN.sill+Hh/2;
    const clear=new T.Mesh(new T.PlaneGeometry(w,Hh),glass); clear.position.set(0,yc,zc); clear.renderOrder=5; seating.add(clear);
    let tint=null; if(T.Reflector&&window.CTRL_GLARE){ try{ const TINT={uniforms:{color:{value:null},tDiffuse:{value:null},textureMatrix:{value:null},uK:{value:.2}},
        vertexShader:'uniform mat4 textureMatrix; varying vec4 vUv; varying vec3 vW; void main(){ vUv=textureMatrix*vec4(position,1.0); vW=(modelMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',
        fragmentShader:'precision highp float; uniform vec3 color; uniform sampler2D tDiffuse; uniform float uK; varying vec4 vUv; varying vec3 vW; void main(){ vec2 uv=vUv.xy/vUv.w; vec3 r=texture2D(tDiffuse,uv).rgb; float l=dot(r,vec3(.3,.59,.11)); gl_FragColor=vec4(color+r*uK*(.75+.25*l),1.); }'};
      tint=new T.Reflector(new T.PlaneGeometry(w,Hh),{textureWidth:768,textureHeight:512,color:0x040406,shader:TINT,clipBias:.003}); tint.position.set(0,yc,zc+.005); seating.add(tint); }catch(e){ tint=null; } }
    if(!tint){ tint=new T.Mesh(new T.PlaneGeometry(w,Hh),new T.MeshStandardMaterial({color:0x040405,roughness:.85,metalness:0,envMapIntensity:0})); tint.position.set(0,yc,zc+.005); seating.add(tint); }
    CTRL.tint=tint; CTRL.clear=clear; window.ctrlTint=on=>{ CTRL.tint.visible=!!on; }; window.ctrlTint(window.CTRL_TINT===undefined?1:window.CTRL_TINT);
    const fm=new T.MeshStandardMaterial({color:0x0c0c0e,roughness:.4,metalness:.8});
    for(const [bw,bh,x,y] of [[w+.16,.08,0,WIN.sill-.04],[w+.16,.08,0,WIN.top+.04],[.08,Hh,-w/2-.04,yc],[.08,Hh,w/2+.04,yc],[.05,Hh,-w/6,yc],[.05,Hh,w/6,yc]]){ const b_=new T.Mesh(new T.BoxGeometry(bw,bh,.1),fm); b_.position.set(x,y,zc+.02); seating.add(b_); }
    const RV=[]; const N_=40; for(let k=0;k<N_;k++){ const a0=lerp(-al,al,k/N_), a1=lerp(-al,al,(k+1)/N_), x0=Rr*Math.sin(a0), x1=Rr*Math.sin(a1), z0=Rr*Math.cos(a0), z1=Rr*Math.cos(a1); for(const y of [WIN.sill,WIN.top]) RV.push(x0,y,z0, x1,y,z1, x1,y,zc, x0,y,z0, x1,y,zc, x0,y,zc); }
    { const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(RV,3)); g.computeVertexNormals(); seating.add(new T.Mesh(g,new T.MeshStandardMaterial({color:0x0c0c0e,roughness:.5,metalness:.7,side:T.DoubleSide}))); }
  }   /* v23 his note: no light line across the window, and no glare: the tint is a flat dark glass */
  { const im=new T.InstancedMesh(new T.BoxGeometry(.045,1,.07),fr,ms.length); ms.forEach(([a,h],i)=>{ q.setFromEuler(new T.Euler(0,a,0)); mt.compose(v.set(Rr*Math.sin(a),h/2,Rr*Math.cos(a)),q,sc.set(1,h,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; seating.add(im); }
  // the end walls where the fixed block meets the lifting rows: glass too, so the room looks out onto the lifts
  const ends=[]; { const c=(CTRL.r0*CTRL.r0+fz*fz-Rr*Rr)/(2*fz*CTRL.r0), pe=Math.acos(clamp(c,-1,1)); ends.push(pe,-pe); CTRL.pe=pe; }
  const arcPt=(r,ps,yy)=>new T.Vector3(r*Math.sin(ps),yy,-fz+r*Math.cos(ps));
  // the inner wall (toward the front of the house), on the row-14 arc: solid, dark acoustic panel, with the screens and the racks on it
  const H=2.55, wallM=new T.MeshStandardMaterial({color:0x0f1013,roughness:.95,side:T.DoubleSide});
  { const pe=CTRL.pe, n=60, P=[]; for(let i=0;i<n;i++){ const a0=lerp(-pe,pe,i/n), a1=lerp(-pe,pe,(i+1)/n), A=arcPt(CTRL.r0,a0,0), B=arcPt(CTRL.r0,a1,0); P.push(A.x,0,A.z,B.x,0,B.z,B.x,H,B.z,A.x,0,A.z,B.x,H,B.z,A.x,H,A.z); } mk(P,wallM); }
  // floor: charcoal carpet tiles over the block's footprint
  { const fl=new T.MeshStandardMaterial({color:0x141417,roughness:.9}); for(let r=CTRL.r0;r<44;r+=.9){ const g=tierGeo(r,r+.9,.012); if(g){ const m=new T.Mesh(g,fl); m.receiveShadow=true; seating.add(m); } } }
  // light: warm downlights in the ceiling, a cool wash from the screens
  for(const a of [-.22,-.11,0,.11,.22]){ const p=arcPt(39.5,a,2.5); const pl=new T.PointLight(0xffd9b0,.55,6,1.8); pl.position.copy(p); seating.add(pl); const dl=new T.Mesh(new T.CircleGeometry(.08,16),glow(0xfff0dc)); dl.rotation.x=Math.PI/2; dl.position.set(p.x,2.58,p.z); seating.add(dl); }
  const feeds=[0,1,2,3,4,5].map(i=>{ const t=tex('tex-feed'+i+'.jpg'); t.wrapS=t.wrapT=T.ClampToEdgeWrapping; t.repeat.set(1,1); t.encoding=T.sRGBEncoding; return new T.MeshBasicMaterial({map:t,color:0xdedede}); });
  const scr=(a,y,w,h,mat,rr)=>{ const p=arcPt((rr||CTRL.r0)+.03,a,y); const m=new T.Mesh(new T.PlaneGeometry(w,h),mat); m.position.copy(p); m.rotation.y=a; seating.add(m); const b=new T.Mesh(new T.PlaneGeometry(w+.06,h+.06),new T.MeshBasicMaterial({color:0x040405})); b.position.copy(arcPt((rr||CTRL.r0)+.025,a,y)); b.rotation.y=a; seating.add(b); return m; };
  const panel=(kind)=>{ const cv=document.createElement('canvas'); cv.width=512; cv.height=160; const c=cv.getContext('2d'); c.fillStyle='#0b0b0f'; c.fillRect(0,0,512,160);
    if(kind==='sound'){ for(let k=0;k<44;k++){ const x=8+k*11.3; c.fillStyle='#23242b'; c.fillRect(x,40,6,112); c.fillStyle='#e2e2e8'; c.fillRect(x-1,70+((k*37)%60),8,8); for(let j=0;j<6;j++){ c.fillStyle=['#43e07a','#43e07a','#43e07a','#e8d24a','#ff7a3c','#ff3c3c'][j]; if((k*13+j*7)%9<7-j) c.fillRect(x,4+j*5,6,3); } } }
    else if(kind==='light'){ c.fillStyle='#16233a'; c.fillRect(6,6,240,148); c.fillRect(266,6,240,148); for(let k=0;k<70;k++){ c.fillStyle=['#ff4fa0','#4fc3ff','#ffd24f','#9b6bff','#59e08a'][k%5]; c.fillRect(12+(k%10)*23,12+Math.floor(k/10)*20,18,14); } c.fillStyle='#ffb45a'; for(let k=0;k<9;k++) c.fillRect(274,14+k*15,90+((k*53)%130),8); }
    else { for(let r=0;r<4;r++) for(let k=0;k<20;k++){ const on=(r===0&&k===3)||(r===1&&k===7); c.fillStyle=on?(r?'#ff3b3b':'#3bff6b'):'#2c2e36'; c.fillRect(10+k*25,16+r*36,20,26); } c.fillStyle='#3a3d47'; c.fillRect(440,16,60,130); }
    const t=new T.CanvasTexture(cv); t.encoding=T.sRGBEncoding; return t; };
  const desk=(a,rr,kind,w)=>{ const p=arcPt(rr,a,0), body=new T.Mesh(new T.BoxGeometry(w,.76,.85),new T.MeshStandardMaterial({color:0x151519,roughness:.5,metalness:.4})); body.position.set(p.x,.38,p.z); body.rotation.y=a; seating.add(body);
    const top=new T.Mesh(new T.PlaneGeometry(w-.1,.8),new T.MeshBasicMaterial({map:panel(kind)})); top.rotation.order='YXZ'; top.rotation.set(-Math.PI/2+.3,a,0); const pt=arcPt(rr,a,.79); top.position.copy(pt); seating.add(top);
    for(const dx of [-w*.3,w*.3]){ const sp=arcPt(rr-.32,a+dx/rr,1.12); const sm=new T.Mesh(new T.PlaneGeometry(.66,.4),new T.MeshBasicMaterial({map:panel(kind==='video'?'light':kind)})); sm.position.copy(sp); sm.rotation.y=a; seating.add(sm); }
    for(const dx of [-w*.3,0,w*.3]){ const cp=arcPt(rr+.75,a+dx/rr,0); const seat=new T.Mesh(new T.CylinderGeometry(.27,.27,.09,16),new T.MeshStandardMaterial({color:0x111114,roughness:.6})); seat.position.set(cp.x,.48,cp.z); seating.add(seat); const back=new T.Mesh(new T.BoxGeometry(.5,.55,.06),seat.material); const bp=arcPt(rr+1.0,a+dx/rr,.8); back.position.copy(bp); back.rotation.y=a; seating.add(back); const post=new T.Mesh(new T.CylinderGeometry(.03,.03,.44,8),fr); post.position.set(cp.x,.24,cp.z); seating.add(post); } };
  // three stations along the room, each facing its own wall of screens: sound (left), lighting (centre), video switching (right)
  const st=[[-.15,'sound',4.2],[0,'light',4.2],[.15,'video',4.2]];
  for(const [a,kind,w] of st){ desk(a,CTRL.r0+1.7,kind,w);
    for(let i=0;i<4;i++) for(let j=0;j<2;j++) scr(a+(i-1.5)*.026,1.25+j*.62,.98,.56,feeds[(i+j*3+(kind==='video'?2:kind==='light'?1:0))%6]); }
  // equipment racks between the screen walls, LEDs blinking
  { const cv=document.createElement('canvas'); cv.width=64; cv.height=256; const c=cv.getContext('2d'); c.fillStyle='#0d0d10'; c.fillRect(0,0,64,256); for(let y=4;y<256;y+=10){ c.fillStyle='#1e1f25'; c.fillRect(3,y,58,8); for(let k=0;k<6;k++){ c.fillStyle=['#3bff6b','#3bff6b','#5fa8ff','#ffb84a'][(y+k*7)%4]; if((y*k+3)%5<3) c.fillRect(8+k*8,y+3,3,2); } }
    const rt=new T.CanvasTexture(cv); rt.encoding=T.sRGBEncoding; const rm=[new T.MeshStandardMaterial({color:0x101013}),new T.MeshStandardMaterial({color:0x101013}),new T.MeshStandardMaterial({color:0x101013}),new T.MeshStandardMaterial({color:0x101013}),new T.MeshBasicMaterial({map:rt}),new T.MeshStandardMaterial({color:0x101013})];
    for(const a of [-.235,-.2,-.075,.075,.2,.235]){ const p=arcPt(CTRL.r0+.35,a,1.05); const r=new T.Mesh(new T.BoxGeometry(.6,2.1,.62),rm); r.position.copy(p); r.rotation.y=a; seating.add(r); } }
  // a strip of light along every step of the ceiling, so the stepped underside of the seats reads as the room's ceiling
  { const lines=[]; for(let i=0;i<LAY.rows.length;i++){ const rs=rowStart(i); if(rs<CTRL.r0) continue; const c=(rs*rs+fz*fz-(Rr-.3)*(Rr-.3))/(2*fz*rs), pm=c>=1?0:Math.acos(clamp(c,-1,1)); if(pm<.02) continue; const pts=[]; for(let k=0;k<=24;k++){ const a=lerp(-pm,pm,k/24); pts.push(arcPt(rs+.05,a,LAY.rows[i].y-SLAB-.01)); } seating.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.012,4),glow(0xffe6c6,.8))); } } }
/* v23k test (?under=4 / ?under=5): his notes, two curved staircases from the walkway behind the last row (the overhang behind the centre camera):
   one leaves each end of the walkway, at its height, and they run in opposite directions round the outside of the seating, hugging the curve of
   the platform, down to the floor, with a landing halfway. Dark like the thrust stairs, a warm light on every nosing, a glass balustrade with a
   brass rail like the walkway's and a soft light under it; the side glass of the rake stays between the stair and the seats. This is the way up
   to the VIP walkway in club mode. */
function curvedStairs(){ const fz=SP.fz, ri=13.5, W=1.1, ro=ri+W, rw=ri+W*.55, RISE=.177, TREAD=.30, LAND=1.3, TH=.34;
  const body=new T.MeshStandardMaterial({color:0x1d1b27,roughness:.5,metalness:.3}), side=new T.MeshStandardMaterial({color:0x16151c,roughness:.35,metalness:.75,envMapIntensity:1.1});
  const brass=new T.MeshStandardMaterial({color:0xd9a441,roughness:.25,metalness:1,envMapIntensity:1.3}), nose=glow(0xffb060,.75), led=glow(0xffd29a,.55);
  const glass=new T.MeshStandardMaterial({color:0xbfe6ff,roughness:.05,metalness:.1,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.6,emissive:0x1a2a36,emissiveIntensity:.6});
  const th=Math.asin(clamp((LAY.sideC+SP.side/2+1.0)/12.96,-1,1)), Ht=LAY.rows[LAY.rows.length-1].y, n=Math.round(Ht/RISE), rise=Ht/n, kL=Math.round(n/2);   // the walkway's ends and height (r9-walk.js)
  for(const s of [-1,1]){ const t0=s*th, P=(r,t,y)=>[r*Math.sin(t),y,r*Math.cos(t)], at=u=>t0+s*u/rw, B=[], S=[], N=[], quad=(arr,a,b,c,d)=>arr.push(...a,...b,...c,...a,...c,...d);
    const T_=[]; let u=0; for(let i=1;i<n;i++){ const len=i===kL?LAND:TREAD; T_.push({ua:u,ub:u+len,y:Ht-i*rise,land:i===kL}); u+=len; }   // treads, the landing halfway
    const uEnd=u, top0={ua:-.6,ub:0,y:Ht};   // a short lip that meets the walkway's deck
    const block=(ua,ub,top,b0,b1)=>{ const k=Math.max(2,Math.ceil((ub-ua)/.12)); for(let j=0;j<k;j++){ const u0=lerp(ua,ub,j/k), u1=lerp(ua,ub,(j+1)/k), a0=at(u0), a1=at(u1), y0=Math.max(0,lerp(b0,b1,j/k)), y1=Math.max(0,lerp(b0,b1,(j+1)/k));
        quad(B,P(ri,a0,top),P(ri,a1,top),P(ro,a1,top),P(ro,a0,top)); quad(S,P(ro,a0,y0),P(ro,a0,top),P(ro,a1,top),P(ro,a1,y1)); quad(S,P(ri,a1,y1),P(ri,a1,top),P(ri,a0,top),P(ri,a0,y0)); quad(S,P(ri,a0,y0),P(ro,a0,y0),P(ro,a1,y1),P(ri,a1,y1)); }
      const a0=at(ua), a1=at(ub), y0=Math.max(0,b0), y1=Math.max(0,b1); quad(S,P(ri,a0,y0),P(ri,a0,top),P(ro,a0,top),P(ro,a0,y0)); quad(S,P(ro,a1,y1),P(ro,a1,top),P(ri,a1,top),P(ri,a1,y1)); };
    block(top0.ua,top0.ub,Ht,Ht-.22,Ht-TH);
    for(const R of T_){ block(R.ua,R.ub,R.y,R.y+rise-TH,R.y-TH);
      const nb=new T.BoxGeometry(W-.1,.018,.03), a=at(R.ua), m=new T.Matrix4().makeRotationY(a), pp=P(ri+W/2,at(R.ua+.012),R.y+.01); nb.applyMatrix4(m); nb.translate(pp[0],pp[1],pp[2]); N.push(nb); }   // a warm light on each nosing
    const mk=(arr,mat,ro_)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(arr,3)); g.computeVertexNormals(); const m=new T.Mesh(g,mat); m.castShadow=true; m.receiveShadow=true; if(ro_) m.renderOrder=ro_; seating.add(m); return m; };
    mk(B,body); mk(S,side); seating.add(new T.Mesh(mergeGeos(N),nose));
    // the line the rail follows: through every nosing, level across the landing
    const K=[[top0.ua,Ht]]; for(const R of T_){ K.push([R.ua,R.y]); if(R.land) K.push([R.ub-.35,R.y]); } K.push([uEnd,0]);
    const nos=u=>{ if(u<=K[0][0]) return K[0][1]; for(let i=0;i<K.length-1;i++) if(u<=K[i+1][0]) return lerp(K[i][1],K[i+1][1],(u-K[i][0])/Math.max(1e-6,K[i+1][0]-K[i][0])); return 0; };
    const us=[]; for(let k=0;k<=160;k++) us.push(lerp(top0.ua,uEnd-.2,k/160));
    const G=[]; for(let k=0;k<160;k++){ const u0=us[k], u1=us[k+1]; quad(G,P(ro-.03,at(u0),nos(u0)+.03),P(ro-.03,at(u1),nos(u1)+.03),P(ro-.03,at(u1),nos(u1)+1.04),P(ro-.03,at(u0),nos(u0)+1.04)); }
    mk(G,glass,3);
    const helix=(r,dy)=>new T.CatmullRomCurve3(us.filter((_,k)=>k%2===0).map(u=>new T.Vector3(...P(r,at(u),nos(u)+dy))));
    seating.add(new T.Mesh(new T.TubeGeometry(helix(ro-.03,1.1),320,.028,8),brass));
    seating.add(new T.Mesh(new T.TubeGeometry(helix(ro-.06,1.04),320,.009,5),led));
    seating.add(new T.Mesh(new T.TubeGeometry(helix(ri+.06,.92),320,.02,8),brass));
    { const pts=us.map(u=>new T.Vector3(...P(ro+.004,at(u),Math.max(.02,nos(u)-TH*.55)))); seating.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),240,.007,5),led)); }
    for(let k=0;k<=160;k+=16){ const u=us[k], pm=new T.Mesh(new T.CylinderGeometry(.022,.022,1.1,8),brass), pp=P(ro-.03,at(u),nos(u)+.55); pm.position.set(pp[0],pp[1],pp[2]); seating.add(pm); } } }
function underExtras(){ if(UNDER===4||UNDER===5) curvedStairs(); if(UNDER===3){ glassSkirt(); return; } if(UNDER===5){ glassRows(); return; } if(UNDER===4){ controlRoom(); return; } if(UNDER!==2) return; const Rr=12.99, sill=.85, head=2.3, steps=1440, A=[], W=[];   // a black metal skirt round the outside, with the booth window cut into the back
  for(let k=0;k<steps;k++){ const t0=k/steps*TAU-Math.PI, t1=(k+1)/steps*TAU-Math.PI, tm_=(t0+t1)/2, x=Rr*Math.sin(tm_), z=Rr*Math.cos(tm_), h=yAt(x*.999,z*.999)-SLAB; if(h<=.03) continue;
    const P=(t,yy)=>[Rr*Math.sin(t),yy,Rr*Math.cos(t)], seg=(a,b,arr)=>{ arr.push(...P(t0,a),...P(t1,a),...P(t1,b),...P(t0,a),...P(t1,b),...P(t0,b)); };
    if(Math.abs(x)<BOOTH.x&&z>0&&h>head){ seg(0,sill,A); seg(sill,head,W); seg(head,h,A); } else seg(0,h,A); }
  const mk=(arr,mat)=>{ const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(arr,3)); g.computeVertexNormals(); const mm=new T.Mesh(g,mat); mm.receiveShadow=true; seating.add(mm); return mm; };
  mk(A,UM.skirt); mk(W,UM.glass);
  const fr=new T.MeshStandardMaterial({color:0x08080a,roughness:.4,metalness:.6}), zc=x=>Math.sqrt(Rr*Rr-x*x);
  for(let x=-BOOTH.x;x<=BOOTH.x+.01;x+=1.2){ const b=new T.Mesh(new T.BoxGeometry(.06,head-sill,.06),fr); b.position.set(x,(sill+head)/2,zc(x)); seating.add(b); }
  for(const yy of [sill,head]){ const pts=[]; for(let x=-BOOTH.x;x<=BOOTH.x+.01;x+=.25) pts.push(new T.Vector3(x,yy,zc(x)+.01)); seating.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),40,.035,6),fr)); }
  // the booth itself: charcoal walls, a low ceiling, a video wall of the stage on the front wall, two desks facing it
  const wall=new T.MeshStandardMaterial({color:0x2a2a31,roughness:.9,metalness:0,side:T.DoubleSide}), H=BOOTH.h, z0=BOOTH.z0;
  for(const s of [-1,1]){ const L=zc(BOOTH.x)-z0, w=new T.Mesh(new T.PlaneGeometry(L,H),wall); w.rotation.y=Math.PI/2; w.position.set(s*BOOTH.x,H/2,z0+L/2); seating.add(w); }
  { const w=new T.Mesh(new T.PlaneGeometry(2*BOOTH.x,H),wall); w.position.set(0,H/2,z0); seating.add(w);
    const c=new T.Mesh(new T.PlaneGeometry(2*BOOTH.x,zc(0)-z0),new T.MeshStandardMaterial({color:0x1d1d22,roughness:.95,side:T.DoubleSide})); c.rotation.x=Math.PI/2; c.position.set(0,H,(z0+zc(0))/2); seating.add(c);
    const f=new T.Mesh(new T.PlaneGeometry(2*BOOTH.x,zc(0)-z0),new T.MeshStandardMaterial({color:0x232028,roughness:.95})); f.rotation.x=-Math.PI/2; f.position.set(0,.012,(z0+zc(0))/2); seating.add(f);
    const vt=tex('tex-booth-wall.jpg'); vt.wrapS=vt.wrapT=T.ClampToEdgeWrapping; vt.repeat.set(1,1); vt.encoding=T.sRGBEncoding;
    const vw=new T.Mesh(new T.PlaneGeometry(4.6,1.81),new T.MeshBasicMaterial({map:vt,color:0xd8d8d8})); vw.position.set(0,1.4,z0+.03); seating.add(vw);
    const bez=new T.Mesh(new T.PlaneGeometry(4.8,1.98),new T.MeshBasicMaterial({color:0x050506})); bez.position.set(0,1.4,z0+.02); seating.add(bez);
    for(const x of [-1.6,0,1.6]){ const dl=new T.Mesh(new T.CircleGeometry(.09,16),glow(0xffe6c4)); dl.rotation.x=Math.PI/2; dl.position.set(x,H-.01,9.9); seating.add(dl); }
    const pl=new T.PointLight(0xffdcb4,1.6,9,1.4); pl.position.set(0,H-.25,9.8); seating.add(pl); const pl2=new T.PointLight(0x9fb6ff,.9,6,1.6); pl2.position.set(0,1.2,z0+.6); seating.add(pl2); }
  const panel=(kind)=>{ const cv=document.createElement('canvas'); cv.width=512; cv.height=128; const c=cv.getContext('2d'); c.fillStyle='#0c0c10'; c.fillRect(0,0,512,128);
    if(kind==='sound'){ for(let k=0;k<48;k++){ const x=6+k*10.4; c.fillStyle='#22232a'; c.fillRect(x,20,6,100); c.fillStyle='#d9d9df'; c.fillRect(x-1,40+((k*37)%50),8,7); for(let j=0;j<5;j++){ c.fillStyle=['#43e07a','#43e07a','#e8d24a','#ff7a3c','#ff3c3c'][j]; if((k*13+j*7)%9<6-j) c.fillRect(x,4+j*3,6,2); } } }
    else { c.fillStyle='#1b2a44'; c.fillRect(8,8,236,112); c.fillRect(268,8,236,112); for(let k=0;k<60;k++){ c.fillStyle=['#ff4fa0','#4fc3ff','#ffd24f','#9b6bff','#59e08a'][k%5]; c.fillRect(14+(k%10)*23,14+Math.floor(k/10)*17,18,12); } c.fillStyle='#ffb45a'; for(let k=0;k<8;k++) c.fillRect(276,16+k*13,90+((k*53)%130),7); }
    const t=new T.CanvasTexture(cv); t.encoding=T.sRGBEncoding; return t; };
  for(const [z,kind] of [[8.6,'light'],[10.6,'sound']]){ const body=new T.Mesh(new T.BoxGeometry(4.4,.78,.8),new T.MeshStandardMaterial({color:0x141418,roughness:.5,metalness:.4})); body.position.set(0,.39,z); seating.add(body);
    const top=new T.Mesh(new T.PlaneGeometry(4.3,.78),new T.MeshBasicMaterial({map:panel(kind),color:0xffffff})); top.rotation.set(-Math.PI/2+.32,0,0); top.position.set(0,.8,z+.02); seating.add(top);
    for(const x of [-1.2,1.2]){ const sc_=new T.Mesh(new T.PlaneGeometry(.62,.38),new T.MeshBasicMaterial({map:panel(kind==='sound'?'light':'sound'),color:0xcfd8ff})); sc_.position.set(x,1.12,z-.3); seating.add(sc_); const bk=new T.Mesh(new T.BoxGeometry(.66,.42,.04),new T.MeshStandardMaterial({color:0x111114,roughness:.5})); bk.position.set(x,1.12,z-.33); seating.add(bk); } } }
function tierGeo(ra,rb,y){ const Rr=12.98, fz=SP.fz, pmOf=r=>{ const c=(r*r+fz*fz-Rr*Rr)/(2*fz*r); return c>=1?0:Math.acos(clamp(c,-1,1)); }, pa=pmOf(ra), pb=pmOf(rb), pm=Math.max(pa,pb); if(pm<.01) return null;
  const n=Math.max(4,Math.ceil(pm*2/(.5*D2R))), P=[], U=[], GP=[[],[],[]], GU=[[],[],[]]; let gk=0; const pt=(r,p,yy)=>{ let x=r*Math.sin(p), z=-fz+r*Math.cos(p); const h=Math.hypot(x,z); if(h>Rr){ x*=Rr/h; z*=Rr/h; } return [x,yy,z]; };
  const quad=(a,b,c,d,side)=>{ for(const v of [a,b,c,a,c,d]){ GP[gk].push(...v); if(side) GU[gk].push((v[0]+v[2])*.6,v[1]*.6); else GU[gk].push(v[0]*.6,v[2]*.6); } };   /* t22: faces sorted into tread (0), risers (1), end caps (2) */
  for(let i=0;i<n;i++){ const p0=lerp(-pm,pm,i/n), p1=lerp(-pm,pm,(i+1)/n);
    gk=0; quad(pt(ra,p0,y),pt(rb,p0,y),pt(rb,p1,y),pt(ra,p1,y)); gk=1; quad(pt(ra,p0,0),pt(ra,p0,y),pt(ra,p1,y),pt(ra,p1,0),1); quad(pt(rb,p1,0),pt(rb,p1,y),pt(rb,p0,y),pt(rb,p0,0),1); }
  gk=2; quad(pt(ra,-pm,0),pt(rb,-pm,0),pt(rb,-pm,y),pt(ra,-pm,y),1); quad(pt(rb,pm,0),pt(ra,pm,0),pt(ra,pm,y),pt(rb,pm,y),1);
  const g=new T.BufferGeometry(); let o=0; for(let k=0;k<3;k++){ P.push(...GP[k]); U.push(...GU[k]); g.addGroup(o,GP[k].length/3,k); o+=GP[k].length/3; }
  g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); g.computeVertexNormals(); g.userData.front=[ra,pm,y]; return g; }
{ const tm=carpetMat(1); tm.side=T.DoubleSide; const steps=[], strips=[], edges=[], mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), sc=new T.Vector3(), p=new T.Vector3();
  const place=(rho,d,y)=>{ const psi=d/rho; q.setFromEuler(e.set(0,psi,0)); return p.set(rho*Math.sin(psi),y,-SP.fz+rho*Math.cos(psi)); };
  LAY.rows.forEach((r,i)=>{ const ra=rowStart(i), rb=i+1<LAY.rows.length?rowStart(i+1):ra+r.pitch+.3;
    for(const [d,w] of AISLES) for(const s of [-1,1]) edges.push({rho:(ra+rb)/2,d:d+s*(w/2-.05),y:r.y,len:rb-ra});
    if(r.y<.01) return; if(UNDER){ underRow(i,ra,rb,r.y,i>0?LAY.rows[i-1].y:0,tm); return; } const g=tierGeo(ra,rb,r.y); if(g){ const m=new T.Mesh(g,TIER2?TIERM:[tm,tm,tm]); m.receiveShadow=true; m.castShadow=true; seating.add(m); TIERS.push({m,row:i});
      if(TIER2){ const pts=[], Rr=12.98, fz=SP.fz, pm=g.userData.front[1], nn=Math.max(8,Math.ceil(pm*2/(.6*D2R))); for(let k=0;k<=nn;k++){ const ph=lerp(-pm,pm,k/nn); let x=(ra-.012)*Math.sin(ph), z=-fz+(ra-.012)*Math.cos(ph); const h=Math.hypot(x,z); if(h>Rr){ x*=Rr/h; z*=Rr/h; } pts.push(new T.Vector3(x,r.y-.012,z)); }
        const nose=new T.Line(new T.BufferGeometry().setFromPoints(pts),new T.LineBasicMaterial({color:0xffb45a,transparent:true,opacity:.9})); m.add(nose); } }   /* t22 test: a thin gold light along each step edge */
    const dy=r.y-LAY.rows[i-1].y; if(dy>.2) for(const [d,w] of AISLES) steps.push({rho:ra-.24,d,w,y:LAY.rows[i-1].y,h:dy/2});       // a half step in each aisle where the rise is more than one comfortable step
    for(const [d,w] of AISLES) strips.push({rho:ra+.02,d,w,y:r.y}); });
  const im=new T.InstancedMesh(new T.BoxGeometry(1,1,.46),tm,steps.length); steps.forEach((s,i)=>{ place(s.rho,s.d,s.y+s.h/2); mt.compose(p,q,sc.set(s.w,s.h,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; im.receiveShadow=true; aisleKit.add(im);
  const all=strips.concat(steps.map(s=>({rho:s.rho-.21,d:s.d,w:s.w,y:s.y+s.h}))), li=new T.InstancedMesh(new T.BoxGeometry(1,.016,.03),glow(0xffb45e,.75),all.length);
  all.forEach((s,i)=>{ place(s.rho,s.d,s.y+.012); mt.compose(p,q,sc.set(s.w-.2,1,1)); li.setMatrixAt(i,mt); }); li.frustumCulled=false; aisleKit.add(li);   // step lights
  // the aisles read as runways: a line of light down both edges of each one
  const ei=new T.InstancedMesh(new T.BoxGeometry(.035,.014,1),glow(0xf0c35a,.7),edges.length); edges.forEach((s,i)=>{ place(s.rho,s.d,s.y+.011); mt.compose(p,q,sc.set(1,1,s.len)); ei.setMatrixAt(i,mt); }); ei.frustumCulled=false; aisleKit.add(ei);
  // and a lit mark for a performer wherever an aisle meets the cross-aisle or the front apron
  const marks=[]; for(const [d] of AISLES){ marks.push([LAY.cross.rho,d,LAY.cross.y]); marks.push([SP.fz-SP.first-1.25,d,0]); }
  const ring=new T.InstancedMesh(new T.TorusGeometry(.6,.022,6,48).rotateX(Math.PI/2),window.MARKM=glow(0xfff1dc,.9),marks.length), dot=new T.InstancedMesh(new T.CircleGeometry(.56,32).rotateX(-Math.PI/2),glow(0xf0c35a,.13),marks.length);
  marks.forEach(([rho,d,y],i)=>{ place(rho,d,y+.02); mt.compose(p,q,sc.set(1,1,1)); ring.setMatrixAt(i,mt); dot.setMatrixAt(i,mt); }); ring.frustumCulled=dot.frustumCulled=false; aisleKit.add(ring); aisleKit.add(dot); }
if(UNDER) underExtras();
// place one instanced model on a set of seats (or tables); fix turns the model to face the stage
const seatMeshes=[];
function onSeats(geo,mat,list,fix){ const im=new T.InstancedMesh(geo,mat,list.length), mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), p=new T.Vector3(), one=new T.Vector3(1,1,1);
  list.forEach((s,n)=>{ q.setFromEuler(e.set(0,s.psi,0)); mt.compose(p.set(s.x,s.y,s.z),q,one); if(fix) mt.multiply(fix); im.setMatrixAt(n,mt); });
  im.frustumCulled=false; im.castShadow=true; im.receiveShadow=true; im.userData.list=list; im.userData.fix=fix; seating.add(im); return im; }

await __tick();
// ================= FRONT PIECE: the thrust =================
// Rides on the turntable and docks against whichever stage is featured. It squares off the curved stage front and carries the stage
// 2.2 m further downstage. Stairs are cut into it only where the three aisles arrive, so performers walk straight off the stage into the house.
const THRUST={zf:-11.3,n:6,stairs:[{x:-LAY.sideC,w:SP.side,top:-11.7,tread:.28},{x:0,w:SP.aisle,top:-12.5,tread:.34},{x:LAY.sideC,w:SP.side,top:-11.7,tread:.28}]};
const front=new T.Group(); disc.add(front);
{ const GAP=window.THRUST_GAP!=null?window.THRUST_GAP:.055, R=R_DISC-GAP, c0=-THRUST.zf, a=Math.acos(c0/R), hw=R*Math.sin(a), sh=new T.Shape(), rise=STAGE_H/THRUST.n, steps=[], lines=[], box=(w,h,d,x,y,z)=>{ const b=new T.BoxGeometry(w,h,d); b.translate(x,y,z); return b; };
  /* v23: his note, the waist-high corners where the flat thrust floor meets the stair walls stuck out beside the stairs: each one is cut back at 45° (CH m each way) */
  const CH=window.THRUST_CH!=null?window.THRUST_CH:.3;
  sh.moveTo(-hw,c0); for(const st of THRUST.stairs){ const xl=st.x-st.w/2, xr=st.x+st.w/2, ch=Math.min(CH,(-st.top-c0)-.05); sh.lineTo(xl-ch,c0); sh.lineTo(xl,c0+ch); sh.lineTo(xl,-st.top); sh.lineTo(xr,-st.top); sh.lineTo(xr,c0+ch); sh.lineTo(xr+ch,c0); } sh.lineTo(hw,c0);
  for(let i=1;i<48;i++){ const p=a-2*a*i/48; sh.lineTo(R*Math.sin(p),R*Math.cos(p)); } sh.closePath();
  const g=new T.ExtrudeGeometry(sh,{depth:STAGE_H,bevelEnabled:false,curveSegments:1}); g.rotateX(-Math.PI/2);
  { const uv=g.attributes.uv, ps=g.attributes.position; for(let i=0;i<uv.count;i++) uv.setXY(i,ps.getX(i)*.34,ps.getZ(i)*.34); }
  /* v23: his pick, the thrust deck is black gloss (it reads apart from the wooden stages and mirrors the light), and a 5 cm lit slot runs round its back edge where it meets the stage */
  const top=new T.MeshStandardMaterial({color:0x060608,roughness:.18,metalness:.35,envMapIntensity:.28})   /* low env reflection: at full metal it mirrored the room's timber ring and read as wood again */, m=new T.Mesh(g,[top,M.black]); m.receiveShadow=true; front.add(m);
  { const sl=new T.Mesh(new T.RingGeometry(R+.004,R_DISC-.006,96,1,Math.PI/2-a,2*a),glow(0xffc27a)); sl.rotation.x=-Math.PI/2; sl.position.y=STAGE_H-.06; front.add(sl); }
  let x0=-hw; for(const st of THRUST.stairs.concat([{x:hw,w:0,end:true}])){ const ch=st.end?0:Math.min(CH,(-st.top-c0)-.05), x1=st.x-st.w/2-ch; if(x1-x0>.3){ lines.push(box(x1-x0-.16,.03,.03,(x0+x1)/2,STAGE_H-.03,THRUST.zf+.02)); lines.push(box(x1-x0-.16,.02,.03,(x0+x1)/2,.05,THRUST.zf+.02)); }
    if(!st.end){ const L=ch*Math.SQRT2-.08; for(const [cx,cz,ry,nx] of [[st.x-st.w/2-ch/2,THRUST.zf-ch/2,Math.PI/4,1],[st.x+st.w/2+ch/2,THRUST.zf-ch/2,-Math.PI/4,-1]]) for(const [hh,yy] of [[.03,STAGE_H-.03],[.02,.05]]){ const b=new T.BoxGeometry(L,hh,.03); b.rotateY(ry); b.translate(cx+nx*.014,yy,cz+.014); lines.push(b); } }   // the gold edge line follows each cut
    x0=st.x+st.w/2+ch; }
  /* v23: his note, the square corners either side of each stair stuck out into the floor: the two front corners of every stair are cut off at 45°
     (CHAMF metres in from each side at the bottom step), the steps are built from that cut outline, and the gold nosing line bends round the cut */
  const CHAMF=window.STAIR_CHAMF!=null?window.STAIR_CHAMF:.35;
  const clipHP=(P,f)=>{ const out=[]; for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], fa=f(a), fb=f(b); if(fa>=0) out.push(a); if((fa>=0)!==(fb>=0)){ const t=fa/(fa-fb); out.push([a[0]+(b[0]-a[0])*t,a[1]+(b[1]-a[1])*t]); } } return out; };
  const prism=(P,h)=>{ const s=new T.Shape(); P.forEach(([x,z],i)=>i?s.lineTo(x,-z):s.moveTo(x,-z)); s.closePath(); const g=new T.ExtrudeGeometry(s,{depth:h,bevelEnabled:false,curveSegments:1}); g.rotateX(-Math.PI/2); g.deleteAttribute('uv'); return g; };
  for(const st of THRUST.stairs){ const zf=st.top+(THRUST.n-1)*st.tread, xl=st.x-st.w/2, xr=st.x+st.w/2, c=Math.min(CHAMF,st.w*.3);
    for(let j=1;j<THRUST.n;j++){ const h=(THRUST.n-j)*rise, z0=st.top+(j-1)*st.tread, z1=z0+st.tread;
      let P=[[xl,z0],[xl,z1],[xr,z1],[xr,z0]];
      if(c>0){ P=clipHP(P,([x,z])=>(x-xl)-(z-(zf-c))); P=clipHP(P,([x,z])=>(xr-x)-(z-(zf-c))); }
      steps.push(prism(P,h));
      const cx=P.reduce((s,p)=>s+p[0],0)/P.length, cz=P.reduce((s,p)=>s+p[1],0)/P.length;
      for(let i=0;i<P.length;i++){ const a=P[i], b=P[(i+1)%P.length], dx=b[0]-a[0], dz=b[1]-a[1], L=Math.hypot(dx,dz); if(L<.08) continue; let nx=dz/L, nz=-dx/L; const mx=(a[0]+b[0])/2, mz=(a[1]+b[1])/2; if(nx*(mx-cx)+nz*(mz-cz)<0){ nx=-nx; nz=-nz; }
        if(nz<.3) continue;   // only the edges that face the house: the tread front and the cut corners
        const shrink=Math.abs(nx)>.1?.02:.06, l=new T.BoxGeometry(L-shrink,.016,.03); l.rotateY(Math.atan2(-dz,dx)); l.translate(mx-nx*.02,h+.009,mz-nz*.02); lines.push(l); } } }
  const sm=new T.Mesh(mergeGeos(steps),new T.MeshStandardMaterial({color:0x424242,roughness:.9,metalness:0,envMapIntensity:.25})   /* v23c (his note): the stairs down to the carpet in the carpet's grey */); sm.receiveShadow=true; front.add(sm); front.add(new T.Mesh(mergeGeos(lines),glow(0xffb060,.7))); }
// club night: the seating folds into the floor (see THE FLOOR THAT FOLDS AWAY), the dance-floor covers close over it and the booth stands on the thrust
const clubKit=new T.Group(); clubKit.visible=false; disc.add(clubKit);
const CLUBH={booth:null,stairs:new T.Group()}; clubKit.add(CLUBH.stairs);
{ const n=13, run=.3, w=4.4, H=2.2, parts=[], lines=[]; for(let i=0;i<n;i++){ const hh=(i+1)*H/n, z=13.4-(n-1-i)*run-run/2; const b=new T.BoxGeometry(w,hh,run); b.translate(0,hh/2,z); parts.push(b); const l=new T.BoxGeometry(w-.1,.016,.03); l.translate(0,hh+.009,z-run/2+.02); lines.push(l); }
  CLUBH.stairs.add(new T.Mesh(mergeGeos(parts),new T.MeshStandardMaterial({color:0x424242,roughness:.9,metalness:0,envMapIntensity:.25})   /* v23c (his note): the stairs down to the carpet in the carpet's grey */)); CLUBH.stairs.add(new T.Mesh(mergeGeos(lines),glow(0xffb060,.7)));
  for(const sx of [-1,1]){ const rail=new T.Mesh(new T.BoxGeometry(.05,.05,n*run+.6),M.steel); rail.position.set(sx*(w/2-.05),H*.55+.9,13.4-n*run/2); rail.rotation.x=Math.atan2(H,n*run); CLUBH.stairs.add(rail); } }   // stairs up to the entrance level, facing reception
{ const floor=new T.Mesh(new T.CircleGeometry(R_DISC-.05,96),new T.MeshStandardMaterial({map:tex('tex-wood.jpg',9),color:0x2a2622,roughness:.42,metalness:.05,envMapIntensity:.6})); floor.rotation.x=-Math.PI/2; floor.position.y=.012; floor.receiveShadow=true; clubKit.add(floor);   // a plain dark sprung dance floor
  // the booth: a platform over the centre stairwell, an LED-fronted desk, decks and monitors
  const bg=new T.Group(); bg.position.set(0,0,-12.25); clubKit.add(bg); CLUBH.booth=bg; const cab=new T.MeshStandardMaterial({color:0x0b0b10,roughness:.35,metalness:.7});
  const pf=new T.Mesh(new T.BoxGeometry(5.2,.3,1.9),cab); pf.position.y=.15; bg.add(pf);
  sock('djbooth',bg,0,.3,.2,0,false,1);                                       // the booth: decks, mixer, monitors and its own small truss
  /* t22: the DJ reads from the floor: a key light on him from the front, and the booth's backdrop glows behind him, pulsing with the music */
  const key=new T.SpotLight(0xffe8d6,0,14,.4,.6,1.3); key.position.set(0,4.8,4.4); key.target.position.set(0,1.8,-.55); bg.add(key); bg.add(key.target); CLUBH.key=key;
  { const c=document.createElement('canvas'); c.width=256; c.height=128; const x=c.getContext('2d'), gr=x.createRadialGradient(128,70,6,128,64,140); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.45,'rgba(255,255,255,.55)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,256,128);
    const back=new T.Mesh(new T.PlaneGeometry(4.0,1.9),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),color:0xb050ff,transparent:true,opacity:.7,blending:T.AdditiveBlending,depthWrite:false,fog:false})); back.position.set(0,2.2,-.98); back.renderOrder=2; bg.add(back); CLUBH.back=back; }
}

await __tick();
// ================= STATE =================
// discA: where the audience faces, radians round the ring (0 = centre of stage 1). gap: how far the two screens have slid apart, 0 (closed) to PI (fully open).
const FXFIRE={t:-99};
const TOUR={on:false,show:{},step:-1};          // the guided tour stages the room piece by piece          // the effects button: fire the featured stage's effects now
const S={room:'theatre',fxAuto:true,ledOn:true,ledK:1,look:'mid',lookK:1,liftT:0,discA:0,faceT:0,gap:Math.PI/2,gapT:Math.PI/2,ringB:0,lift:false,glow:true,reflect:true,footage:'v-gold',sound:false,house:false,houseK:0,people:true,club:false,haze:.55};
const ST=[], SPOTS=[], _d=new T.Vector3(), _dn=new T.Vector3(0,-1,0), CW=new T.Color('#ffffff');
const wrapA=a=>((a+Math.PI)%TAU+TAU)%TAU-Math.PI, HZ=()=>(.12+1.9*S.haze)*S.lookK;
// how much of stage k the audience can see: the share of its quarter that lies inside the opening between the screens
function stageOpen(k){ const d=wrapA(stageAngle(k)-S.discA), h=S.gap/2, lo=Math.max(d-TAU/8,-h), hi=Math.min(d+TAU/8,h); return clamp((hi-lo)/(TAU/4),0,1); }
// whether a point at world angle wa lies inside the opening
function winVis(wa){ return smooth(clamp((S.gap/2-Math.abs(wrapA(wa-S.discA)))/.1+.5,0,1)); }

// ================= ONE LOOK FOR WHATEVER IS OPEN =================
// The stage the audience faces is the featured one, and its look runs across everything the screens reveal: the neighbours' walls, light and
// sets take its picture and its colours. Facing a join, the corner has a look of its own. Whatever the screens hide goes dark.
const LOOKS=[
  {name:'Video',  c:'#f2b544',c2:'#ff7a2a',mode:20},
  {name:'Light',  c:'#3d6bff',c2:'#ff3fa8',mode:21},
  {name:'Awards', c:'#ff2b3a',c2:'#ffc400',mode:22},   /* v23k: his note, the show opens in Spain's (and Barcelona's) red and gold, not red, white and blue */
  {name:'Holograms',c:'#9a4dff',c2:'#3fd8ff',mode:23},
  {name:'Sunset arches',c:'#ffb14a',c2:'#ff4d5e',mode:1},   // corner between stages 1 and 2
  {name:'Storm moon',   c:'#6fa8ff',c2:'#e8f2ff',mode:2},   // 2 and 3
  {name:'Deep water',   c:'#22d3c5',c2:'#3d7bff',mode:4},   // 3 and 4
  {name:'Violet fans',  c:'#b46bff',c2:'#ff5fd2',mode:5},   // 4 and 1
  {name:'Club night',   c:'#8a5cff',c2:'#35e0ff',mode:8}];
LOOKS.forEach(l=>{ l.C=new T.Color(l.c); l.C2=new T.Color(l.c2); });
const SHOW={cur:0,prev:0,mix:1,cen:0,cenPrev:0,c:LOOKS[0].C.clone(),c2:LOOKS[0].C2.clone(),t0:0,t:0,dim:1,dimT:1};
const feat=k=>window.__team&&k<4?1:(SHOW.cur===k?SHOW.mix:0)+(SHOW.prev===k?1-SHOW.mix:0);   // the closing overhead: all four stages play at once          // how strongly look k is playing, 0 to 1
function cue(durs){ let total=0; for(const d of durs) total+=d; let u=SHOW.t%total; for(let i=0;i<durs.length;i++){ if(u<durs[i]) return {i,ph:u/durs[i],s:u,dur:durs[i]}; u-=durs[i]; } return {i:0,ph:0,s:0,dur:durs[0]}; }
const WALL_VS='varying vec2 vUv; varying float vAng; varying vec2 vXZ; void main(){ vUv=uv; vAng=0.; vec4 w=modelMatrix*vec4(position,1.0); vXZ=w.xz; gl_Position=projectionMatrix*viewMatrix*w; }';
const WALL_FS=LED_FS.slice(0,LED_FS.indexOf('void main(){'))+`
uniform sampler2D uV1,uV2,uV3,uV4; uniform int uMA,uMB,uOwn; uniform float uMix,uCenA,uCenB,uWinC,uWinH,uHouse,uDim,uOwnCen,uLed; uniform vec3 uA1,uA2,uB1,uB2; varying vec2 vXZ;
float wrp(float a){ return mod(a+3.14159265,6.2831853)-3.14159265; }
vec3 vidM(int m,vec2 p){ float mx=abs(fract(p.x/1.7778*.5)*2.-1.); vec2 uv=vec2(mx,p.y); vec3 c=m==20?texture2D(uV1,uv).rgb:m==21?texture2D(uV2,uv).rgb:m==22?texture2D(uV3,uv).rgb:texture2D(uV4,uv).rgb;
  float l=dot(c,vec3(.3,.59,.11)); c*=smoothstep(.05,.32,l);            /* the dark parts of the footage go to black: negative space */
  return c*.9*(.55+.45*smoothstep(0.,.3,p.y)); }
vec3 lookAtCen(int m,float cen,float ang){ float d=wrp(ang-cen); vec2 p=vec2((d/1.5707963+.5)*uAspect,vUv.y); return m>=20?vidM(m,p):pickM(m,p,uT); }
void main(){ float ang=atan(vXZ.x,-vXZ.y); vec3 col;
  if(uMix<.002){ gC1=uA1; gC2=uA2; col=lookAtCen(uMA,uCenA,ang); } else if(uMix>.998){ gC1=uB1; gC2=uB2; col=lookAtCen(uMB,uCenB,ang); }
  else{ gC1=uA1; gC2=uA2; vec3 a=lookAtCen(uMA,uCenA,ang); gC1=uB1; gC2=uB2; col=mix(a,lookAtCen(uMB,uCenB,ang),uMix); }
  if(uOwn>=0){ float a2=mod(ang-.7853982,1.5707963), dj=min(a2,1.5707963-a2), w=smoothstep(.3,.19,dj);          // a stage keeps its own kind of wall; only the portal swell at each join carries the shared video
    gC1=mix(uA1,uB1,uMix); gC2=mix(uA2,uB2,uMix); col=mix(lookAtCen(uOwn,uOwnCen,ang),col,w); }
  float vis=smoothstep(uWinH+.025,uWinH-.025,abs(wrp(ang-uWinC)));
  vec2 pg=fract(vec2(ang*240.,vUv.y*110.))-.5; vec3 offc=vec3(.035,.036,.045)*smoothstep(.48,.2,length(pg))+vec3(.012,.012,.016);      // switched off: dark LED tiles, so you can see it is a screen
  gl_FragColor=vec4(mix(offc*(1.+2.*uHouse),col*uGain*vis*uDim*(1.-.4*uHouse)+vec3(.03)*uHouse,uLed)+zapC(vec2(ang*9.,vUv.y*2.6))*smoothstep(.95,.6,abs(wrp(ang-uZapA))),1.); }`;
const wallMat=new T.ShaderMaterial({uniforms:{uT:{value:0},uGain:{value:1.15},uAspect:{value:3.55},uPan:{value:0},uFlash:{value:REDUCED?0:1},uRep:{value:1},uMode:{value:0},uMap:{value:null},uC1:{value:new T.Color()},uC2:{value:new T.Color()},uHL:{value:0},uHLc:{value:new T.Color()},uZap:ZAP.u,uZapC:ZAP.c,uZapA:ZAP.a,
  uV1:{value:null},uV2:{value:null},uV3:{value:null},uV4:{value:null},uMA:{value:3},uMB:{value:3},uMix:{value:1},uCenA:{value:0},uCenB:{value:0},uWinC:{value:0},uWinH:{value:.8},uHouse:{value:0},uDim:{value:1},uOwn:{value:-1},uOwnCen:{value:0},uLed:{value:1},uA1:{value:new T.Color()},uA2:{value:new T.Color()},uB1:{value:new T.Color()},uB2:{value:new T.Color()}},vertexShader:WALL_VS,fragmentShader:WALL_FS,side:T.DoubleSide});
LEDS.push(wallMat); wallMat.uniforms.uMap.value=wallVideo('w-gold','vid-gold.mp4'); for(let i=1;i<=4;i++) wallMat.uniforms['uV'+i].value=wallVideo('w-s'+i,'vid-s'+i+'.mp4');   // each stage's own footage, in its team colour
function updateShow(t,dt){ const n=Math.round(S.discA/(TAU/8)), fi=((n%8)+8)%8, want=S.club?8:(fi%2?4+(fi-1)/2:fi/2), cen=S.club?S.discA:n*(TAU/8);
  if(want!==SHOW.cur){ if(SHOW.mix>=1){ SHOW.prev=SHOW.cur; SHOW.cenPrev=SHOW.cen; SHOW.cur=want; SHOW.cen=cen; SHOW.mix=0; SHOW.t0=t; } } else SHOW.cen=cen;
  SHOW.mix=Math.min(1,SHOW.mix+dt/2.2); SHOW.t=t-SHOW.t0+(window.__tOff||0); const m=smooth(SHOW.mix), A=LOOKS[SHOW.prev], B=LOOKS[SHOW.cur];
  SHOW.c.copy(A.C).lerp(B.C,m); SHOW.c2.copy(A.C2).lerp(B.C2,m); if(SHOW.cur!==2) SHOW.dimT=1; const TD=window.__trippDim!==false&&typeof FILM!=='undefined'&&FILM.on, tdt=TD?FILM.t:0; if(TD&&tdt>36.8&&tdt<46.45) SHOW.dimT=Math.min(SHOW.dimT,.22); { const pa=SHOW._pa??S.discA, w=Math.abs(wrapA(S.discA-pa))/Math.max(dt,1e-4); SHOW._pa=S.discA; SHOW.turnK=(SHOW.turnK||0)+clamp(((FILM.on&&window.__turnDark!==false&&w>.12)?1:0)-(SHOW.turnK||0),-dt*2.2,dt*5); }   /* v23h: his note, while the room turns the stage lights on Stages 1, 2 and 4 go out (Stage 3 already does); they come back as it settles */ SHOW.dim+=clamp(SHOW.dimT-SHOW.dim,-dt*1.5,dt*(TD&&tdt>=46.45&&tdt<47.3?9:1.5)); { const dT0=SHOW.cur!==2?1:SHOW.dimT, vk=TD&&tdt>36.8&&tdt<46.45&&window.__vidKeep!==false; SHOW.vdim=(SHOW.vdim??SHOW.dim)+clamp((vk?Math.max(Math.min(dT0,window.__vidLvl??.5),SHOW.dimT):SHOW.dimT)-(SHOW.vdim??SHOW.dim),-dt*1.5,dt*(TD&&tdt>=46.45&&tdt<47.3?9:1.5)); }   /* v23: his note, the stage video stays on through the angel's landing and Tripp's entrance (36.8-46.45) so she has something to stand out against, at half brightness (window.__vidLvl) so it doesn't kill Tripp's spotlight; the room lights still drop */   /* t23 test (window.__trippDim): the room drops for Tripp's entrance so the follow-spots find him, and slams back as NOCHE lands */
  const u=wallMat.uniforms; u.uMA.value=A.mode; u.uMB.value=B.mode; u.uMix.value=m; u.uCenA.value=SHOW.cenPrev; u.uCenB.value=SHOW.cen; u.uWinC.value=S.discA; u.uWinH.value=S.gap/2; u.uHouse.value=smooth(S.houseK); u.uDim.value=SHOW.vdim??SHOW.dim; S.ledK+=clamp((S.ledOn?1:0)-S.ledK,-dt*1.5,dt*1.5); u.uLed.value=S.ledK; const lk={bright:1.55,mid:1,dark:.42}[S.look]||1; S.lookK+=clamp(lk-S.lookK,-dt*1.2,dt*1.2);
  if(S.look==='bright'){ SHOW.c.lerp(CW,.3); SHOW.c2.lerp(CW,.3); }
  u.uA1.value.copy(A.C); u.uA2.value.copy(A.C2); u.uB1.value.copy(B.C); u.uB2.value.copy(B.C2); }

const gloss=new T.MeshStandardMaterial({color:0x0b0b10,roughness:.16,metalness:.85});
const ply=new T.MeshStandardMaterial({map:tex('tex-wood.jpg',1),color:0xd9c7a8,roughness:.6,metalness:0});
// a beam of light. own: the look it belongs to (it only plays while that look is featured); otherwise it follows the featured palette wherever the screens are open
function beam(st,par,x,y,z,alt,len,w,top,wa){ const piv=new T.Group(); piv.position.set(x,y,z); par.add(piv); const m=beamMat(0xffffff); piv.add(new T.Mesh(beamGeo(len,w*(window.LX_OFF?1:1.6)),m)); const fl=flare(0xffffff,(top?1.2:.9)*(window.LX_OFF?1:1.35)); fl.position.y=top?-.2:.2; piv.add(fl);
  const b={piv,m,fl,top,i:st.beams.length,alt:!!alt,col:new T.Color(),ca:1,sa:0,wa:wa===undefined?stageAngle(st.k)+Math.atan2(x,-z):wa}; st.beams.push(b); if(top) SPOTS.push(b); return b; }
for(const b of ringBeams) if(b.stage) SPOTS.push(b);            // the front light from ring A lands on the stage floor too

// ================= EFFECTS =================
const NOISE_GL='float h2(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float vn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(h2(i),h2(i+vec2(1,0)),f.x),mix(h2(i+vec2(0,1)),h2(i+vec2(1,1)),f.x),f.y);} float fbm(vec2 p){float a=.5,s=0.;for(int i=0;i<4;i++){s+=a*vn(p);p*=2.03;a*=.5;}return s;}';
const UVV='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
// a jet: cryo (white, fast, tall) or flame (orange, short). Two crossed sheets, so it reads from every seat.
const FX={jets:[],fans:[],t:0};
function jet(par,x,y,z,h,w,hex,kind){ const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uB:{value:0},uC:{value:new T.Color(hex)},uK:{value:kind==='flame'?1:0},uG:{value:1}},vertexShader:UVV,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,
    fragmentShader:'precision highp float; uniform float uT,uB,uK,uG; uniform vec3 uC; varying vec2 vUv; '+NOISE_GL+' void main(){ float y=vUv.y, wd=mix(.05+.30*y,.16+.20*sin(y*3.1),uK), x=(vUv.x-.5)/wd; float n=fbm(vec2(vUv.x*5.,y*4.-uT*mix(6.,3.4,uK))), n2=fbm(vec2(vUv.x*11.+7.,y*9.-uT*mix(9.,6.,uK))); float body=smoothstep(1.,.1,abs(x)+(n2-.5)*mix(.5,.7,uK)); float top=smoothstep(uB*1.2,uB*1.2-.35,y+(n-.5)*.25*uK); float dens=mix(.14+1.2*n*n2,.3+1.1*n,uK); float a=body*dens*top*(1.-y*mix(.75,.55,uK))*smoothstep(0.,.15,uB); vec3 fl=mix(vec3(1.,.96,.72),mix(uC,vec3(.9,.16,.02),smoothstep(.3,1.,y)),smoothstep(0.,.55,y+abs(x)*.35)); vec3 c=mix(uC,fl,uK); gl_FragColor=vec4(c*a*uG,min(a*uG,1.)); }'});   /* v18b: the cold jets are wispy and broken instead of a solid white bar; the flames have a hot core, torn tongues and a red top */
  const g=new T.Group(); g.position.set(x,y,z); for(const r of [0,Math.PI/3,2*Math.PI/3]){ const pl=new T.PlaneGeometry(w,h); pl.translate(0,h/2,0); const me=new T.Mesh(pl,m); me.rotation.y=r; me.frustumCulled=false; g.add(me); } par.add(g); const j={m,b:0,tgt:0,g,pm:kind==='flame'?null:plume(par,x,y,z,h*.9)}; FX.jets.push(j); return j; }
// sparks and confetti: every particle flies a ballistic path worked out in the shader from its own seed, so thousands cost nothing
function particles(par,emit,o){ o=o||{}; const n=emit.length, P=new Float32Array(n*3), V=new Float32Array(n*3), Sd=new Float32Array(n*2), C=new Float32Array(n*3), col=new T.Color();
  emit.forEach((e,i)=>{ P.set(e.p,i*3); V.set(e.v,i*3); Sd[i*2]=Math.random(); Sd[i*2+1]=.6+.8*Math.random(); col.set(e.c||'#ffd9a0'); C.set([col.r,col.g,col.b],i*3); });
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('aV',new T.BufferAttribute(V,3)); g.setAttribute('aS',new T.BufferAttribute(Sd,2)); g.setAttribute('aC',new T.BufferAttribute(C,3));
  const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:0},uLife:{value:o.life||1.3},uG:{value:o.g===undefined?9.8:o.g},uSize:{value:o.size||60},uBurst:{value:o.burst?1:0},uDrag:{value:o.drag||0}},transparent:true,blending:T.AdditiveBlending,depthWrite:false,
    vertexShader:'attribute vec3 aV,aC; attribute vec2 aS; uniform float uT,uOn,uLife,uG,uSize,uBurst,uDrag; varying float vL; varying vec3 vC; void main(){ float tau=uBurst>.5?uT-aS.x*.35:fract(uT/uLife+aS.x)*uLife; float k=tau/uLife; float e=uDrag>0.?(1.-exp(-uDrag*tau))/uDrag:tau; vec3 p=position+aV*aS.y*e+vec3(sin(tau*5.+aS.x*40.)*uDrag*.12,-.5*uG*tau*tau*(uDrag>0.?.18:1.),cos(tau*4.+aS.x*31.)*uDrag*.12); vL=(tau<0.||k>1.)?0.:(1.-k*k)*uOn; vC=aC; vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=uSize*(1.-.4*k)/max(.5,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'precision highp float; varying float vL; varying vec3 vC; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.05,d)*vL; gl_FragColor=vec4(vC*a*1.7,a); }'});
  const pts=new T.Points(g,m); pts.frustumCulled=false; par.add(pts); return m; }
// a laser fan: one flat sheet with rays drawn in it, so a fan of sixty beams is a single draw
// a laser: a fan of separate beams, each a thin rod of light that is brightest at the head and fades into the haze. Patterns switch beams on and off.
// ---- THE ANGEL MATTE (16 Nov, his note): the lines of the video wall and the lasers must not run through the angel hologram. She stays see-through;
// whatever line-like light lies on her silhouette, seen from the camera in use, is cut out (soft edge, a little glow left). Worked out exactly per pixel:
// the ray from the camera through the pixel is met with her picture plane, and her own moving picture there says how much of her covers it. It holds
// in the floor mirror too, since that pass has its own camera. r8-holo.js fills in her three clips (main, arrival, look-around) and how much of each shows.
const AMASK={piv:null,u:{uAInv:{value:new T.Matrix4()},uAM0:{value:null},uAM1:{value:null},uAM2:{value:null},uAP:{value:new T.Vector3()},uAR0:{value:new T.Vector4(0,0,1,1)},uAR1:{value:new T.Vector4(0,0,1,1)},uAR2:{value:new T.Vector4(0,0,1,1)},uAK:{value:window.AMASK_K??.93}}}; window.AMASK=AMASK;
const AMASK_GL='uniform mat4 uAInv; uniform sampler2D uAM0,uAM1,uAM2; uniform vec3 uAP; uniform vec4 uAR0,uAR1,uAR2; uniform float uAK; varying vec3 vAW; float aAl(sampler2D m,vec2 q){ if(q.x<0.||q.x>1.||q.y<0.||q.y>1.) return 0.; vec3 c=texture2D(m,q).rgb; return smoothstep(.05,.3,max(c.r,max(c.g,c.b))); } float aSoft(sampler2D m,vec4 R,vec2 h){ vec2 q=(h-R.xy)/R.zw; vec2 d=vec2(.085)/R.zw; float s=aAl(m,q)*2.; for(int k=0;k<6;k++){ float th=float(k)*1.0471976; s+=aAl(m,q+vec2(cos(th),sin(th))*d)+.6*aAl(m,q+vec2(cos(th+.52),sin(th+.52))*d*2.1); } return smoothstep(.12,.55,s/11.6); } float aMask(float behindOnly){ vec3 o=(uAInv*vec4(cameraPosition,1.)).xyz, p=(uAInv*vec4(vAW,1.)).xyz; float dz=o.z-p.z; if(abs(dz)<1e-4) return 0.; float s=o.z/dz; if(s<=0.||(behindOnly>.5&&s>=1.)) return 0.; vec2 h=o.xy+(p.xy-o.xy)*s; float m=0.; if(uAP.x>.003) m=max(m,uAP.x*aSoft(uAM0,uAR0,h)); if(uAP.y>.003) m=max(m,uAP.y*aSoft(uAM1,uAR1,h)); if(uAP.z>.003) m=max(m,uAP.z*aSoft(uAM2,uAR2,h)); return m*uAK; }';
const amaskHook=m=>{ m.onBeforeRender=()=>{ if(AMASK.piv) AMASK.u.uAInv.value.copy(AMASK.piv.matrixWorld).invert(); }; return m; };
function laserFan(par,x,y,z,hex,len,spread,rays){ rays=rays||32; const g=new T.BoxGeometry(.006,len,.006); g.translate(0,-len/2,0);
  const m=new T.ShaderMaterial({uniforms:Object.assign({uT:{value:0},uI:{value:0},uC:{value:new T.Color(hex)},uN:{value:rays},uP:{value:0},uLen:{value:len}},AMASK.u),transparent:true,blending:T.AdditiveBlending,depthWrite:false,
    vertexShader:'attribute float aId; uniform float uT,uN,uP,uLen; varying float vL,vOn; varying vec3 vAW; float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} void main(){ vL=clamp(-position.y/uLen,0.,1.); float id=aId; vOn=uP<.5?1.:(uP<1.5?step(.5,fract(id*.5+floor(uT*4.)*.5)):(uP<2.5?step(.55,h(vec2(id,floor(uT*6.)))):smoothstep(2.5,0.,abs(id-mod(uT*18.,uN))))); vAW=(modelMatrix*instanceMatrix*vec4(position,1.0)).xyz; gl_Position=projectionMatrix*modelViewMatrix*instanceMatrix*vec4(position,1.0); }',
    fragmentShader:'precision highp float; uniform float uI; uniform vec3 uC; varying float vL,vOn; '+AMASK_GL+' void main(){ float a=(1.-vL*.8)*vOn*uI; a*=1.-aMask(0.); gl_FragColor=vec4(uC*a*1.3+vec3(a*.12),a); }'});
  const im=new T.InstancedMesh(g,m,rays), mt=new T.Matrix4(), ids=new Float32Array(rays); for(let i=0;i<rays;i++){ mt.makeRotationZ((i/(rays-1)-.5)*spread); im.setMatrixAt(i,mt); ids[i]=i; }
  g.setAttribute('aId',new T.InstancedBufferAttribute(ids,1)); im.frustumCulled=false; amaskHook(im);
  const piv=new T.Group(); piv.position.set(x,y,z); piv.add(im); sock('laserhead',piv,0,.16,0,0,false,1); par.add(piv); const f={piv,m,ph:FX.fans.length*1.9}; FX.fans.push(f); return f; }
// a CO2 plume: hundreds of soft white puffs that shoot up, slow, spread and thin out
function plume(par,x,y,z,h,n){ n=n||160; const P=new Float32Array(n*3), Sd=new Float32Array(n*3); for(let i=0;i<n;i++){ Sd[i*3]=Math.random(); Sd[i*3+1]=Math.random()*TAU; Sd[i*3+2]=.6+.8*Math.random(); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(P,3)); g.setAttribute('aS',new T.BufferAttribute(Sd,3));
  const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uOn:{value:0},uH:{value:h}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,
    vertexShader:'attribute vec3 aS; uniform float uT,uOn,uH; varying float vA; void main(){ float life=1.5, tau=fract(uT/life+aS.x)*life, k=tau/life; float up=uH*(1.-exp(-3.2*tau))*aS.z*.95; float r=(.08+k*1.4)*aS.z; vec3 p=position+vec3(cos(aS.y)*r,up,sin(aS.y)*r); vA=uOn*pow(1.-k,1.6)*smoothstep(0.,.06,k); vec4 mv=modelViewMatrix*vec4(p,1.0); gl_PointSize=(90.+520.*k)/max(1.,-mv.z); gl_Position=projectionMatrix*mv; }',
    fragmentShader:'precision highp float; varying float vA; void main(){ float d=length(gl_PointCoord-.5); float a=smoothstep(.5,.0,d)*vA*.1; gl_FragColor=vec4(vec3(.92,.96,1.)*a,a); }'});
  const pts=new T.Points(g,m); pts.position.set(x,y,z); pts.frustumCulled=false; par.add(pts); return m; }
// low fog: a sheet of drifting smoke that hugs a floor
function lowFog(geo,hex){ const m=new T.ShaderMaterial({uniforms:{uT:{value:0},uI:{value:0},uC:{value:new T.Color(hex)}},vertexShader:'varying vec2 vUv; varying vec3 vW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',transparent:true,depthWrite:false,
    fragmentShader:'precision highp float; uniform float uT,uI; uniform vec3 uC; varying vec2 vUv; varying vec3 vW; '+NOISE_GL+' void main(){ vec2 p=vW.xz*.22; float n=fbm(p+vec2(uT*.05,uT*.03)+fbm(p*2.-uT*.04)); float e=smoothstep(0.,.1,vUv.x)*smoothstep(1.,.9,vUv.x)*smoothstep(0.,.25,vUv.y)*smoothstep(1.,.8,vUv.y); float a=smoothstep(.25,.75,n)*e*uI; gl_FragColor=vec4(uC*(.35+.65*n),a*.8); }'}); const me=new T.Mesh(geo,m); me.renderOrder=4; return {mesh:me,m}; }

CAT.cur='stages';
// ================= THE SHELL: one wall of picture all the way round =================
// Every stage owns its whole quarter. Where two stages meet, the wall swells forward in one soft curve and opens into an arched portal.
// Proportions are golden: arch 3.9 m wide by 3.9 x PHI high, the wall PHI times the arch (10.2 m), and the swell takes the golden section of each quarter.
const SH={R0:23.05,AW:3.9}; SH.AH=SH.AW*PHI; SH.AS=SH.AW; SH.H=SH.AH*PHI; SH.B=9*D2R; SH.D=1.5;
function shellR(a,y){ const d=Math.max(0,TAU/8-Math.abs(a)); if(d>=SH.B) return SH.R0; const c=Math.cos(Math.PI/2*d/SH.B); return SH.R0-SH.D*c*c*lerp(1,1/PHI,smooth(clamp((y||0)/SH.H,0,1))); }
function inArch(a,y){ const d=TAU/8-Math.abs(a), s=d*shellR(a,0)/(SH.AW/2); if(s>=1) return false; if(y<SH.AS) return true; const e=(y-SH.AS)/(SH.AH-SH.AS); return s*s+e*e<1; }
// rects: openings cut through the wall, each [a0,a1,y0,y1]
function shellGeo(rects){ rects=rects||[]; const A=[], Y=[], add=(L,v)=>{ if(!L.some(x=>Math.abs(x-v)<1e-4)) L.push(v); };
  for(let i=0;i<=300;i++){ const a=-TAU/8+i*.3*D2R; if(i%5===0||TAU/8-Math.abs(a)<SH.B+.6*D2R) add(A,a); }
  for(let j=0;j<=64;j++) add(Y,SH.H*j/64);
  for(const r of rects){ add(A,r[0]); add(A,r[1]); add(Y,r[2]); add(Y,r[3]); } A.sort((p,q)=>p-q); Y.sort((p,q)=>p-q);
  const P=[], U=[], I=[], ny=Y.length;
  for(const a of A) for(const y of Y){ const p=pol(a,shellR(a,y),STAGE_H+y); P.push(p.x,p.y,p.z); U.push((a+TAU/8)/(TAU/4),y/SH.H); }
  for(let i=0;i<A.length-1;i++) for(let j=0;j<ny-1;j++){ const ac=(A[i]+A[i+1])/2, yc=(Y[j]+Y[j+1])/2; if(inArch(ac,yc)||rects.some(r=>ac>r[0]&&ac<r[1]&&yc>r[2]&&yc<r[3])) continue;
    const v00=i*ny+j, v10=(i+1)*ny+j, v01=v00+1, v11=v10+1; I.push(v00,v10,v01,v10,v11,v01); }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setAttribute('uv',new T.Float32BufferAttribute(U,2)); g.setIndex(I); g.computeVertexNormals(); return g; }
const shellBack=new T.MeshStandardMaterial({color:0x0d0d11,roughness:.6,metalness:.4,side:T.BackSide});
const wallFront=wallMat.clone(); wallFront.uniforms=wallMat.uniforms; wallFront.side=T.FrontSide;                 // the same picture, front faces only, for the shells
function surfTube(pts,rad,mat,closed,off){ const v=pts.map(([a,y])=>pol(a,shellR(a,y)-(off||.04),STAGE_H+y)); return new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(v,!!closed,'catmullrom',.02),Math.max(40,pts.length*4),rad,6,!!closed),mat); }
function dark2K(){ return false; }   /* v16: the red scene stays; no return to the dark (was 33.26 to 36.75) */   /* "bring the energy one more time": back to the dark */
function elecK(){ if(!FILM.on) return 0; const ft=FILM.t; return ft>=30.45&&ft<44.2&&!dark2K()?Math.min(1,(44.2-ft)/.5):0; }   /* night 7: it drains out just before the dark */   /* Stage 3 after the burst: the set is lit by the electricity running through it, nothing else */
const trimMat=glow(0xffffff,.9), trimLine=new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:.8});
// own: the kind of wall this stage has when it is not a video wall (9 a black cloth for the lighting stage, 6 the stadium wall, 12 the projection cyc)
function addShell(st,rects,own){ const geo=shellGeo(rects); let mat=wallFront; if(own!==undefined){ mat=wallMat.clone(); mat.uniforms=Object.assign({},wallMat.uniforms,{uOwn:{value:own},uOwnCen:{value:stageAngle(st.k)}}); mat.side=T.FrontSide; } st.group.add(new T.Mesh(geo,mat)); st.group.add(new T.Mesh(geo,shellBack)); const top=[]; for(let i=0;i<=90;i++) top.push([-TAU/8+i/90*TAU/4,SH.H+.05]); st.group.add(surfTube(top,.035,trimMat)); }

CAT.cur='rig';
// ================= WHAT RUNS ALL THE WAY ROUND: one truss, four matching portals =================
{ const g=new T.Group(); scene.add(g); trussRing(g,STAGE_TRUSS.r,STAGE_TRUSS.y,.5,.24);
  const n=40, rods=new T.InstancedMesh(new T.CylinderGeometry(.02,.02,ROOM_H-STAGE_TRUSS.y-.5,5),M.truss,n), mt=new T.Matrix4(); for(let i=0;i<n;i++){ const p=pol(i/n*TAU,STAGE_TRUSS.r,(ROOM_H+STAGE_TRUSS.y+.5)/2); mt.makeTranslation(p.x,p.y,p.z); rods.setMatrixAt(i,mt); } rods.frustumCulled=false; g.add(rods);
  for(let i=0;i<32;i++){ const a=(i+.5)/32*TAU, p=pol(a,STAGE_TRUSS.r+.3,STAGE_TRUSS.y); sock(i%2?'strobe':'mwash',scene,p.x,p.y-.02,p.z,-a,true,1); } }
CAT.cur='portals';
const PORTALS=[];
{ const w2=SH.AW/2, O=[]; for(let i=0;i<=8;i++) O.push([-w2,SH.AS*i/8]); for(let i=1;i<24;i++){ const th=Math.PI*(1-i/24); O.push([w2*Math.cos(th),SH.AS+(SH.AH-SH.AS)*Math.sin(th)]); } for(let i=8;i>=0;i--) O.push([w2,SH.AS*i/8]);
  const onWall=(s,y)=>{ let d=Math.abs(s)/20.5; for(let i=0;i<3;i++) d=Math.abs(s)/shellR(TAU/8-d,0); return {d:s<0?-d:d,R:shellR(TAU/8-d,y)}; };
  const rimGeo=new T.TubeGeometry(new T.CatmullRomCurve3(O.map(([s,y])=>{ const q=onWall(s,y); return pol(q.d,q.R-.05,STAGE_H+y); }),false,'catmullrom',.02),200,.085,8,false);
  // a second arch, PHI times the first: it rises exactly to the top of the wall, and its line shows the curve of the swell
  const outerGeo=new T.TubeGeometry(new T.CatmullRomCurve3(O.map(([s,y])=>{ const yy=Math.min(y*PHI,SH.H), q=onWall(s*PHI,yy); return pol(q.d,q.R-.04,STAGE_H+yy); }),false,'catmullrom',.02),200,.032,6,false);
  // the tunnel behind: a horn that narrows as it runs back, lined with ribs of light that chase outward
  const K0=1.1, K1=.8, ZA=-21.95, ZB=-29.6, NS=7, hornK=t=>K1+(K0-K1)*(1-t)*(1-t), TP=[], TI=[], no=O.length;
  for(const [s,y] of O){ const q=onWall(s*K0,y*K0); TP.push(s*K0,STAGE_H+y*K0,-q.R*Math.cos(q.d)-.16); }
  for(let j=0;j<NS;j++){ const t=j/(NS-1), k=hornK(t), z=lerp(ZA,ZB,t); for(const [s,y] of O) TP.push(s*k,STAGE_H+y*k,z); }
  for(let j=0;j<NS;j++) for(let i=0;i<no-1;i++){ const a=j*no+i, b=a+no; TI.push(a,b,a+1,b,b+1,a+1); }
  const tunGeo=new T.BufferGeometry(); tunGeo.setAttribute('position',new T.Float32BufferAttribute(TP,3)); tunGeo.setIndex(TI); tunGeo.computeVertexNormals();
  const tunMat=new T.MeshStandardMaterial({color:0x0c0c13,roughness:.22,metalness:.9,side:T.DoubleSide,envMapIntensity:.6});
  const ribGeo=new T.TubeGeometry(new T.CatmullRomCurve3(O.map(([s,y])=>new T.Vector3(s,y,0)),false,'catmullrom',.02),120,.03,6,false);
  const endGeo=new T.ShapeGeometry(new T.Shape(O.map(([s,y])=>new T.Vector2(s*K1,y*K1)))), NR=9;
  const ec=document.createElement('canvas'); ec.width=ec.height=128; { const x=ec.getContext('2d'), rg=x.createRadialGradient(64,84,4,64,74,84); rg.addColorStop(0,'#ffffff'); rg.addColorStop(.35,'#c8c8c8'); rg.addColorStop(1,'#242424'); x.fillStyle=rg; x.fillRect(0,0,128,128); }
  /* v19: the tunnel goes on for ever. Past the old end wall a forced-perspective sleeve keeps the tunnel running back, ring after ring, each smaller,
     dimmer and higher, toward a vanishing point at eye height in the tunnel, like an infinity mirror. It is only three metres deep, so nothing leaves the building. */
  const NX=36, XDZ=.08, YV=1.35, XS=Array.from({length:NX+1},(_,n)=>n?1/(1+.04*Math.pow(n,1.25)):1), XF=XS.map((v,n)=>n?.12+.88*Math.pow(.925,n):1), ZC=ZB-NX*XDZ;
  const xsec=(i,sx,sy)=>{ const k=K1*XS[i]; return [sx*k, STAGE_H+YV*(1-XS[i])+sy*k, ZB-i*XDZ]; };
  const SP_=[], SI=[]; for(let i=0;i<=NX;i++){ for(const [x,y] of O) SP_.push(...xsec(i,x,y)); }
  for(let i=0;i<NX;i++){ for(let j=0;j<no-1;j++){ const a=i*no+j, b=a+no; SI.push(a,b,a+1,b,b+1,a+1); } const l=i*no, r=i*no+no-1; SI.push(l,r,l+no,r,r+no,l+no); }   // the walls and the rising floor
  const sleeveGeo=new T.BufferGeometry(); sleeveGeo.setAttribute('position',new T.Float32BufferAttribute(SP_,3)); sleeveGeo.setIndex(SI); sleeveGeo.computeVertexNormals();
  const runGeo=(()=>{ const P_=[], I_=[]; for(const sd of [-1,1]){ const b=P_.length/3; for(let i=0;i<=NX;i++){ const k=XS[i], y=STAGE_H+YV*(1-k)+.016; for(const e of [-.025,.025]) P_.push((sd*1.1+e)*k*K1/.8,y,ZB-i*XDZ); if(i<NX){ const v=b+i*2; I_.push(v,v+2,v+1,v+1,v+2,v+3); } } }
    const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P_,3)); g.setIndex(I_); return g; })();
  const endTex=new T.CanvasTexture(ec); { const uv=endGeo.attributes.uv, ps=endGeo.attributes.position; for(let i=0;i<uv.count;i++) uv.setXY(i,ps.getX(i)/(SH.AW*K1)+.5,ps.getY(i)/(SH.AH*K1)); }
  for(let k=0;k<4;k++){ const g=new T.Group(); g.rotation.y=-JOINT(k); scene.add(g); const rim=glow(0xffe6c4), outer=glow(0xffd9a8,.75), endMat=new T.MeshBasicMaterial({map:endTex,color:0xffd9a8}), runM=glow(0xffdcae,.9);
    g.add(new T.Mesh(rimGeo,rim)); g.add(new T.Mesh(outerGeo,outer)); g.add(new T.Mesh(tunGeo,tunMat));
    const ribs=new T.InstancedMesh(ribGeo,glow(0xffffff),NR+NX), mt=new T.Matrix4(), q=new T.Quaternion(), p=new T.Vector3(), sc=new T.Vector3();
    for(let j=0;j<NR;j++){ const t=(j+.5)/NR, kk=hornK(t)*.985; mt.compose(p.set(0,STAGE_H,lerp(ZA,ZB,t)),q,sc.set(kk,kk,1)); ribs.setMatrixAt(j,mt); ribs.setColorAt(j,CW); }
    for(let n=1;n<=NX;n++){ const kk=K1*.985*XS[n]; mt.compose(p.set(0,STAGE_H+YV*(1-XS[n]),ZB-n*XDZ),q,sc.set(kk,kk,1)); ribs.setMatrixAt(NR+n-1,mt); ribs.setColorAt(NR+n-1,CW); } ribs.frustumCulled=false; g.add(ribs);
    g.add(new T.Mesh(sleeveGeo,tunMat)); g.add(new T.Mesh(runGeo,runM));
    const end=new T.Mesh(endGeo,endMat), sL=XS[NX]; end.position.set(0,STAGE_H+YV*(1-sL),ZC+.01); end.scale.set(sL,sL,1); g.add(end);
    for(const s of [-1,1]){ const e=new T.Mesh(new T.BoxGeometry(.05,.02,ZA-ZB+4.6),runM); e.position.set(s*1.1,STAGE_H+.014,(ZA+ZB)/2+2.3); g.add(e); }
    PORTALS.push({ribs,n:NR+NX,nr:NR,xf:XF,rim,outer,endMat,runM,wa:JOINT(k)}); } }
const _pc=new T.Color(), _pw=new T.Color(0xffe6c4);
function updatePortals(t){ _pc.copy(SHOW.c).lerp(_pw,.55); const tk=(window.__trippDim!==false&&typeof FILM!=='undefined'&&FILM.on&&FILM.t>36&&FILM.t<47.4)?1:SHOW.dim;   /* v23k: his note, the tunnel effect stays on for Tripp: the tunnels keep their full light and their chasing rings while the room dims for his entrance */ for(let k=0;k<4;k++){ const P=PORTALS[k], v=(.12+.88*winVis(P.wa))*tk; P.rim.color.copy(_pc).multiplyScalar(v); P.outer.color.copy(_pc).multiplyScalar(v*.9); P.endMat.color.copy(_pc).multiplyScalar(v); P.runM.color.copy(_pc).multiplyScalar(v);
    for(let j=0;j<P.n;j++){ const c=(REDUCED?.6:.22+.78*Math.pow(Math.max(0,Math.sin(t*2.3+j*.7+k)),2))*v*(j<P.nr?1:P.xf[j-P.nr+1]); P.ribs.setColorAt(j,_d.set(_pc.r*c,_pc.g*c,_pc.b*c)); } P.ribs.instanceColor.needsUpdate=true; } }
// a flat deck between a front radius and a back edge that may follow the wall
function deckGeo(r0,r1,a0,a1,y){ const n=Math.max(2,Math.ceil(Math.abs(a1-a0)/(1*D2R))), P=[], I=[]; for(let i=0;i<=n;i++){ const a=lerp(a0,a1,i/n), p0=pol(a,r0,y), p1=pol(a,typeof r1==='function'?r1(a):r1,y); P.push(p0.x,y,p0.z,p1.x,y,p1.z); if(i<n){ const v=i*2; I.push(v,v+2,v+1,v+2,v+3,v+1); } }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.Float32BufferAttribute(P,3)); g.setIndex(I); g.computeVertexNormals(); return g; }

await __tick();
/* v23k: his note, the dancers on Stage 1's wide stair danced across two steps and their feet sank in; his pick after seeing small platforms: a landing.
   One full-width flat landing across the stair at mid-height (after the 12th riser), 1 m deep; the treads above and below are a little shallower so the
   stair keeps its footprint and its top; the three stair dancers dance on it side by side (r3-dance.js reads STAIR_LAND.spots). */
window.STAIR_PADS=[];
window.STAIR_LAND=(()=>{ const top=PHI*PHI*PHI, n=24, len=4.6, r0=21.9-len, L=1.0, k=11, tr=(len-L)/(n-1), rise=top/n, rc=r0+k*tr+L/2, y=(k+1)*rise;
  const spots=[[-1.1,rc-.12],[0,rc+.2],[1.1,rc-.12]].map(([x,zc])=>({a:Math.atan2(x,zc)/D2R,r:Math.hypot(x,zc),y})); return {n,len,r0,L,k,tr,rise,rc,y,spots}; })();
const SND={kin:0,sparks:0,boom:0,cryo:0};          // what the sound engine listens to
CAT.cur='stages';
// ================= THE FOUR STAGES =================
// Sets go up, not back: the ring is 10 m deep, so every stage builds to the full height of the 10.2 m wall.
const BEAT=60/118;
// v18b. The lift fronts on Stage 4 and Stage 1 are screens, not black boxes: mostly dark, with thrust running down from under each platform and a
// few slow stars, so the platforms read as hovering under power. Violet for NOCHE, gold for ORO.
const HOVER={u:{uT:{value:0},uOn:{value:1},uC:{value:new T.Color(0x8f6bff)}},ug:{uT:{value:0},uOn:{value:1},uC:{value:new T.Color(0xffb040)}}};
{ const VS='varying vec2 vUv; varying vec3 vO; void main(){ vUv=uv; vO=normal; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
    FS='precision highp float; uniform float uT,uOn; uniform vec3 uC; varying vec2 vUv; varying vec3 vO; float h(vec2 p){ return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453); } void main(){ if(abs(vO.y)>.5){ gl_FragColor=vec4(.004,.004,.008,1.); return; } float v=1.-vUv.y; float n=7.; float cx=vUv.x*n, id=floor(cx), fx=fract(cx)-.5; float w=.07+.3*v; float jet=exp(-fx*fx/(w*w)); float flow=.55+.45*sin(v*20.-uT*(8.+2.*h(vec2(id,1.)))+id*1.7); float fl=.8+.2*sin(uT*31.+id*5.); float plume=jet*exp(-v*3.4)*flow*fl; float edge=exp(-v*30.); vec2 sg=floor(vUv*vec2(46.,26.)); float st=step(.985,h(sg))*(.4+.6*sin(uT*(1.+3.*h(sg+3.))+h(sg)*40.))*smoothstep(.15,.6,v); vec3 c=uC*(plume*1.5+edge*1.3)+vec3(1.,.95,1.)*(plume*plume*.9+edge*.7)+mix(vec3(.7,.8,1.),uC,.4)*st*.5; gl_FragColor=vec4(vec3(.004,.004,.008)+c*uOn,1.); }';
  HOVER.mat=new T.ShaderMaterial({uniforms:HOVER.u,vertexShader:VS,fragmentShader:FS}); HOVER.gold=new T.ShaderMaterial({uniforms:HOVER.ug,vertexShader:VS,fragmentShader:FS}); }
for(let k=0;k<4;k++){ const group=new T.Group(); group.rotation.y=-stageAngle(k); scene.add(group);
  const inner=new T.PointLight(0xffffff,1.2,28,1.6); inner.position.copy(pol(stageAngle(k),19.5,8)); scene.add(inner);
  const st={k,group,inner,beams:[],anim:[],lift:null}; ST.push(st);
  // back light from the stage truss, the same hang over every stage. The front light comes from ring A, over the audience.
  for(let i=0;i<9;i++){ const a=(i-4)*9.4*D2R, p=pol(a,STAGE_TRUSS.r-.3,STAGE_TRUSS.y), w=pol(stageAngle(k)+a,STAGE_TRUSS.r-.3,STAGE_TRUSS.y); sock('mhead',scene,w.x,w.y,w.z,-(stageAngle(k)+a),true,1);
    if(i%2===0){ const b=beam(st,group,p.x,p.y-.3,p.z,i%4,11.8,1.0,true); b.ca=Math.cos(a); b.sa=Math.sin(a); b.u=(i-4)/8; b.back=true; } }
  // three lifts across the front of every stage: a 4.2 m presenter lift in the middle and a 2.6 m lift either side (4.2 / PHI), rising 2.4 m and 1.5 m
  st.lifts=[]; st.lift={moving:false};
  for(const [a,w,top,delay] of [[0,4.2,2.4,0],[-(k===2?30:15)*D2R,2.6,1.5,.9],[(k===2?30:15)*D2R,2.6,1.5,.9]]){ const d=1.9, r=16.9, Y0=STAGE_H, base=new T.Group(); base.rotation.y=-a; group.add(base);
    const lg=new T.Group(); lg.position.set(0,Y0,-r); base.add(lg); const pl=new T.Mesh(new T.BoxGeometry(w,.16,d),gloss); pl.position.y=-.078; lg.add(pl);
    for(const [ex,ez,ew,ed] of [[0,d/2,w,.05],[0,-d/2,w,.05],[w/2,0,.05,d],[-w/2,0,.05,d]]){ const e=new T.Mesh(new T.BoxGeometry(ew,.04,ed),trimMat); e.position.set(ex,.012,ez); lg.add(e); }
    const legs=[]; for(const sx of [-1,1]) for(const sz of [-1,1]){ const c=new T.Mesh(new T.CylinderGeometry(.09,.11,1,10),M.steel); c.position.set(sx*(w/2-.4),Y0,-r+sz*(d/2-.35)); base.add(c); legs.push(c); }
    const sc=new T.Mesh(new T.BoxGeometry(w-.3,1,d-.4),k===3?HOVER.mat:k===0?HOVER.gold:new T.MeshStandardMaterial({color:0x15151b,roughness:.4,metalness:.8})); sc.position.set(0,Y0,-r); base.add(sc);   // the scissor housing that rises with it
    st.lifts.push({g:lg,legs,sc,h:0,top,delay}); } }

// ---- stage 1: video. Four tiers of LED-faced risers climb to 4.2 m, seven doors open onto them, video panels fly and travel overhead, and cryo jets line the front.
{ const st=ST[0], g=st.group, Y0=STAGE_H, H=SH.H, U=a=>(a+TAU/8)/(TAU/4);
  const TI=[{r:17.9,h:1.0,A:39*D2R},{r:19.5,h:PHI,A:31*D2R},{r:20.8,h:PHI*PHI,A:22*D2R},{r:21.9,h:PHI*PHI*PHI,A:13*D2R}];                 // each tier PHI times the height of the one below
  const DW=2.1, DH=DW*PHI, doors=[[0,3,0],[-17.5,2,1],[17.5,2,1],[-26.5,1,2],[26.5,1,2],[-35,0,3],[35,0,3]].map(([a,ti,ord])=>{ a*=D2R; const y=TI[ti].h, hw=DW/2/shellR(a,y); return {a0:a-hw,a1:a+hw,y0:y,y1:y+DH,ord}; });
  addShell(st,doors.map(d=>[d.a0,d.a1,d.y0,d.y1]));
  const dc=document.createElement('canvas'); dc.width=8; dc.height=128; { const x=dc.getContext('2d'), lg=x.createLinearGradient(0,0,0,128); lg.addColorStop(0,'#0d0703'); lg.addColorStop(.55,'#2c1a08'); lg.addColorStop(1,'#8a5519'); x.fillStyle=lg; x.fillRect(0,0,8,128); } const doorMat=new T.MeshBasicMaterial({map:new T.CanvasTexture(dc)});
  for(const d of doors){ g.add(surfTube([[d.a0,d.y0],[d.a0,d.y1],[d.a1,d.y1],[d.a1,d.y0]],.045,trimMat,false,.03)); const am=(d.a0+d.a1)/2, R=shellR(am,d.y0);
    g.add(new T.Mesh(arcPanel(R+.32,d.a0-.01,d.a1+.01,Y0+d.y0,Y0+d.y1),doorMat));                                                          // warm glow from backstage through the opening
    const sg=new T.Group(); sg.position.y=Y0+d.y1; sg.add(new T.Mesh(arcPanel(R-.06,d.a0,d.a1,-DH,0,{u0:0,u1:1,v0:d.y0/H,v1:d.y1/H}),wallMat)); g.add(sg); d.sh=sg; }   // a shutter of the same picture that rolls up
  const stairHalf=DW*PHI/2;
  TI.forEach((t,i)=>{ const yb=i?TI[i-1].h:0, nx=TI[i+1], back=a=>shellR(a,t.h)+.03;
    for(const s of [-1,1]){ const aS=stairHalf/t.r, a0=s<0?-t.A:aS, a1=s<0?-aS:t.A;
      g.add(new T.Mesh(arcPanel(t.r,a0,a1,Y0+yb,Y0+t.h,{inward:true,v0:yb/H,v1:t.h/H}),wallMat)); g.add(new T.Mesh(arcPanel(t.r-.012,a0,a1,Y0+t.h-.05,Y0+t.h),trimMat));
      const ae=s*t.A, r1=back(ae), p0=pol(ae,t.r,0), p1=pol(ae,r1,0), cap=new T.Mesh(new T.PlaneGeometry(r1-t.r,t.h-yb),M.blackDS); cap.position.set((p0.x+p1.x)/2,Y0+(yb+t.h)/2,(p0.z+p1.z)/2); cap.rotation.y=-ae+Math.PI/2; g.add(cap); }
    if(nx){ g.add(new T.Mesh(deckGeo(t.r,nx.r,-nx.A,nx.A,Y0+t.h),gloss)); for(const s of [-1,1]) g.add(new T.Mesh(deckGeo(t.r,back,s<0?-t.A:nx.A,s<0?-nx.A:t.A,Y0+t.h),gloss)); }
    else g.add(new T.Mesh(deckGeo(t.r,back,-t.A,t.A,Y0+t.h),gloss)); });
  // one wide stair up the middle, from the deck to the top door
  { const top=TI[3], SL=window.STAIR_LAND, n=24, len=4.6, r0=top.r-len, sw=DW*PHI, parts=[], lines=[]; let z0=r0; for(let i=0;i<n;i++){ const run=i===SL.k?SL.L:SL.tr, hgt=(i+1)*top.h/n, s=new T.BoxGeometry(sw,hgt,run); s.translate(0,Y0+hgt/2,-(z0+run/2)); parts.push(s);
      const e=new T.BoxGeometry(sw,.02,.03); e.translate(0,Y0+hgt+.012,-(z0+.02)); lines.push(e); z0+=run; }   /* v23k: the landing is step 12 */ g.add(new T.Mesh(mergeGeos(parts),M.stage)); g.add(new T.Mesh(mergeGeos(lines),trimMat));
    /* v23k: a small flat platform set into the stair under each dancer on it (r3-dance.js STAIR_PADS), lit nosing on its front edge like the steps */
    for(const P of (window.STAIR_PADS||[])){ const x=P.r*Math.sin(P.a*D2R), rc=P.r*Math.cos(P.a*D2R), d=P.front+P.back, zc=-(rc+(P.back-P.front)/2), b=new T.BoxGeometry(P.w,P.y,d); b.translate(x,Y0+P.y/2,zc);
      const pm=new T.Mesh(b,M.stage); g.add(pm); const e=new T.Mesh(new T.BoxGeometry(P.w,.02,.03),trimMat); e.position.set(x,Y0+P.y+.012,-(rc-P.front)-.02); g.add(e);
      for(const sx of [-1,1]){ const se=new T.Mesh(new T.BoxGeometry(.03,.02,d),trimMat); se.position.set(x+sx*(P.w/2-.015),Y0+P.y+.012,zc); g.add(se); } } }
  // four flown video panels on tracks: they travel along the arc and fly in and out
  const panelMat=ledMat({gain:1.25,aspect:1}); panelMat.uniforms.uMode.value=15; panelMat.uniforms.uMap.value=wallVideo('w-led','vid-led.mp4');
  const wings=[]; for(const [side,r,a0,a1,w] of [[-1,19.3,40,15,2.6],[1,19.3,40,15,2.6],[-1,18.6,33,7,1.9],[1,18.6,33,7,1.9]]){ const wg=new T.Group(), hw=w/2/r, hh=5.6; g.add(wg);
    wg.add(new T.Mesh(arcPanel(r,-hw,hw,0,hh,{u0:wings.length%2?1:0,u1:wings.length%2?0:1}),panelMat)); for(const y of [0,hh]){ const e=new T.Mesh(new T.BoxGeometry(w+.1,.06,.06),trimMat); e.position.copy(pol(0,r-.03,y)); e.rotation.y=0; wg.add(e); } for(const s of [-1,1]){ const p=pol(s*hw,r-.02,hh/2), e=new T.Mesh(new T.BoxGeometry(.05,hh,.05),trimMat); e.position.copy(p); wg.add(e); }
    const cb=new T.Mesh(new T.BoxGeometry(.02,6,.02),M.truss); cb.position.copy(pol(0,r,hh+3)); wg.add(cb); wings.push({g:wg,side,a0:a0*D2R,a1:a1*D2R,x:0,ph:wings.length}); }
  // cryo: eight CO2 jets across the front of the stage
  const cryo=[]; for(let i=0;i<8;i++){ const p=pol((i-3.5)*9*D2R,16.5,Y0); cryo.push(jet(g,p.x,p.y+.42,p.z,8.5,2.4,0xe6f3ff)); sock('cryojet',g,p.x,Y0,p.z,i*.7,false,1); }
  // v18b: six flame fountains along the very front of the stage, either side of the centre stair: real fire a few metres behind the singer on his mark
  const oroF=[], oroL=new T.PointLight(0xff9a40,0,26,1.5); oroL.position.set(0,Y0+2.2,-14.4); g.add(oroL);
  for(const a of [-20,-14,-8,8,14,20]){ const p=pol(a*D2R,15.0,Y0); oroF.push(jet(g,p.x,p.y+.32,p.z,4.8,1.8,0xff8420,'flame')); sock('flameunit',g,p.x,Y0,p.z,Math.atan2(-p.x,-p.z),false,1); }   /* v20: back to the six stationary fountains of Version 18: pyro never rides a track */
  for(let i=0;i<9;i++){ const a=(i-4)*9.6*D2R, p=pol(a,shellR(a,H)-.35,Y0+H+.2), b=beam(st,g,p.x,p.y,p.z,i%2,7.5,.8,false); b.u=(i-4)/8; b.ca=Math.cos(a); b.sa=Math.sin(a); b.own=0; }
  // ---- depth and life for Stage 1 ----
  // every door plays the flown panels' light video, held low and veiled, as if seen through a lot of haze: the stage reads deep, not flat
  const doorVid=ledMat({gain:.3,aspect:1}); doorVid.uniforms.uMode.value=15; doorVid.uniforms.uMap.value=panelMat.uniforms.uMap.value;
  const veilMat=new T.MeshBasicMaterial({color:0x9a8468,transparent:true,opacity:.14,blending:T.AdditiveBlending,depthWrite:false});
  for(const d of doors){ const am=(d.a0+d.a1)/2, R=shellR(am,d.y0); g.add(new T.Mesh(arcPanel(R+.3,d.a0-.01,d.a1+.01,Y0+d.y0,Y0+d.y1,{u0:.15+d.ord*.12,u1:.4+d.ord*.12}),doorVid)); const v=new T.Mesh(arcPanel(R+.1,d.a0,d.a1,Y0+d.y0,Y0+d.y1),veilMat); v.renderOrder=2; g.add(v); }
  // the back wall plays in canon: twelve columns of light between the doors that fire from the wings to the centre on the beat, then all on, all off
  const canon=[]; for(const a of [5.5,9,12.5,22,30.7,39.5]) for(const sgn of [-1,1]){ const am=sgn*a*D2R, hw=.38/shellR(am,3), m=new T.MeshBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false});
      const bar=new T.Mesh(arcPanel(shellR(am,3)-.07,am-hw,am+hw,Y0+.15,Y0+H-.1),m); bar.renderOrder=2; g.add(bar); canon.push({m,rank:[39.5,30.7,22,12.5,9,5.5].indexOf(a)}); }
  // each tier of risers carries its own slow colour, washed up its face from the floor, so the four levels separate
  const rg=document.createElement('canvas'); rg.width=4; rg.height=64; { const x=rg.getContext('2d'), lg=x.createLinearGradient(0,64,0,0); lg.addColorStop(0,'rgba(255,255,255,1)'); lg.addColorStop(.6,'rgba(255,255,255,.25)'); lg.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=lg; x.fillRect(0,0,4,64); }
  const rgT=new T.CanvasTexture(rg), riserMats=TI.map(()=>new T.MeshBasicMaterial({map:rgT,color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false}));
  TI.forEach((t,i)=>{ const yb=i?TI[i-1].h:0; for(const sgn of [-1,1]){ const aS=stairHalf/t.r, a0=sgn<0?-t.A:aS, a1=sgn<0?-aS:t.A; const w=new T.Mesh(arcPanel(t.r-.03,a0,a1,Y0+yb,Y0+t.h),riserMats[i]); w.renderOrder=2; g.add(w); } });
  // v18b: and every riser face plays the gold footage, each tier its own slice of the picture, so the four levels are video and not a flat wash
  const riserVid=new T.ShaderMaterial({uniforms:{map:{value:wallVideo('w-gold','vid-gold.mp4')},uOp:{value:0}},vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }',fragmentShader:'precision highp float; uniform sampler2D map; uniform float uOp; varying vec2 vUv; void main(){ vec3 c=texture2D(map,vUv).rgb; c=pow(c,vec3(2.6))*1.9; gl_FragColor=vec4(c*uOp,1.); }',transparent:true,blending:T.AdditiveBlending,depthWrite:false});   /* the smoke goes dark, only the bright gold wisps stay: video, not a flat orange */
  TI.forEach((t,i)=>{ const yb=i?TI[i-1].h:0; for(const sgn of [-1,1]){ const aS=stairHalf/t.r, a0=sgn<0?-t.A:aS, a1=sgn<0?-aS:t.A, u0=.5+a0/(80*D2R), u1=.5+a1/(80*D2R); const w=new T.Mesh(arcPanel(t.r-.05,a0,a1,Y0+yb,Y0+t.h,{u0,u1,v0:.08+i*.2,v1:.08+i*.2+.26}),riserVid); w.renderOrder=3; g.add(w); } });
  const _rc=new T.Color();
  st.anim.push((t,dt,F)=>{ const b=musicBeat(), stp=Math.floor(b*2), k=((stp%8)+8)%8, hit=FILM.on?hitPulse():0, lvl=F*(SHOW.vdim??SHOW.dim); doorVid.uniforms.uGain.value=.3*lvl; veilMat.opacity=.14*lvl;
    for(const c of canon){ const on=k===7?1:k===6?0:(c.rank===k||c.rank===k-1)?1:.06; c.m.opacity+=((Math.max(on,hit)*.5*lvl)-c.m.opacity)*Math.min(1,dt*18); c.m.color.copy(c.rank%2?SHOW.c2:SHOW.c).lerp(WARM,.25); }
    riserMats.forEach((m,i)=>{ _rc.setHSL(((t*.035+i*.13)%1+1)%1,.85,.55); m.color.copy(_rc); m.opacity=(.42+.12*Math.sin(t*.8+i))*lvl; }); riserVid.uniforms.uOp.value=0;   /* v21: no video on the tier fronts */   /* v18b: the wash under the video stays in ORO's golds */ });
  // an ornate brass balustrade down both sides of the wide stair, open where each tier of risers meets it so the company can step off
  st.railJob=(async()=>{ let BAL, NEW; try{ BAL=await loadProp('baluster',.92,{rough:.28,metal:.9,env:1.3}); NEW=await loadProp('newel',1.32,{rough:.28,metal:.9,env:1.3,emissive:'#ffd9a0',emI:.25}); }catch(e){ return; }
    for(const P of [BAL,NEW]){ const m=P.mat; m.metalnessMap=null; m.roughnessMap=null; m.metalness=.55; m.roughness=.38; m.emissive=new T.Color(0xffe2b0); m.emissiveMap=m.map; m.emissiveIntensity=.42; m.needsUpdate=true; }   // brass that still reads as brass in a dark stage
    const top=TI[3], len=4.6, r0=top.r-len, hAt=r=>clamp((r-r0)/len,0,1)*top.h, sw=DW*PHI, segs=[[17.34,18.06],[19.38,19.82],[20.46,21.86]], bal=[], nw=[], rails=[], brass=new T.MeshStandardMaterial({color:0xd9a441,roughness:.25,metalness:1,envMapIntensity:1.3});
    for(const sgn of [-1,1]){ const x=sgn*(sw/2-.07); for(const [a,b] of segs){ nw.push([x,a],[x,b]); for(let r=a+.19;r<b-.1;r+=.38) bal.push([x,r]);
        const p0=new T.Vector3(x,Y0+hAt(a)+.98,-a), p1=new T.Vector3(x,Y0+hAt(b)+.98,-b), tube=new T.TubeGeometry(new T.LineCurve3(p0,p1),8,.035,8,false); rails.push(tube); } }
    g.add(new T.Mesh(mergeGeos(rails),brass)); const mt=new T.Matrix4(), q=new T.Quaternion(), one=new T.Vector3(1,1,1);
    const put=(P,list,ry)=>{ const im=new T.InstancedMesh(P.geo,P.mat,list.length); list.forEach(([x,r],i)=>{ q.setFromAxisAngle(YAX,ry); mt.compose(new T.Vector3(x,Y0+hAt(r),-r),q,one); im.setMatrixAt(i,mt); }); im.frustumCulled=false; g.add(im); };
    put(BAL,bal,Math.PI/2); put(NEW,nw,0); });
  st.look='fan';
  st.anim.push((t,dt,F)=>{ const q=cue([16,16,16,16,16,16]), mv=REDUCED?0:1; panelMat.uniforms.uGain.value=1.25*F*(SHOW.vdim??SHOW.dim);
    for(const d of doors){ let o=0; if(q.i===2) o=smooth(clamp(q.ph*3-(3-d.ord)*.45,0,1)); else if(q.i===3||q.i===5) o=1; else if(q.i===4) o=1-smooth(clamp(q.ph*3-d.ord*.45,0,1)); d.sh.scale.y=Math.max(.02,1-o*F); }
    const wt=q.i===1?smooth(q.ph):(q.i===2||q.i===3)?1:q.i===4?1-smooth(q.ph):q.i===5?.5+.5*Math.sin(q.ph*TAU*2):0;
    for(const w of wings){ w.x+=clamp(wt*mv-w.x,-dt*.25,dt*.25); w.g.rotation.y=-w.side*lerp(w.a0,w.a1,w.x); w.g.position.y=Y0+4.6+(REDUCED?0:Math.sin(t*.17+w.ph*1.3)*.5)+(q.i===5?-1.2*Math.sin(q.ph*Math.PI):0); }
    const fire=t-FXFIRE.t<2.6&&F>.5, hit=(q.s<.9)||((q.i===3||q.i===5)&&(q.s%(6*BEAT))<.8); cryo.forEach((j,i)=>{ j.tgt=fire||(hit&&F>.6&&!REDUCED&&S.fxAuto&&(q.i!==3||i%2===Math.floor(q.s/(6*BEAT))%2))?1:0; });
    { const ft=FILM.on?FILM.t:-1, on=ft>=54.4&&ft<62.4; let sum=0; oroF.forEach((j,i)=>{ let k=0; if(on){ const ph=(((ft-54.4)*2.1-i*.45)%3.3+3.3)%3.3; k=ph<.95?1:0; for(const h of [57.02,58.04,59.04,59.52,61.03]) if(ft>=h&&ft<h+.55) k=1; } j.tgt=k; sum+=j.b; }); oroL.intensity=sum*.26*(.75+.25*Math.sin(t*31.)*Math.sin(t*17.)); if(FILM.on&&ft>=50) cryo.forEach(j=>{ if(ft<62.4) j.tgt=0; }); }   /* the fire runs across the front in a chase and all six go on the hits; the cold jets wait until he is up on the lift */
  }); }

// ---- stage 2: light. The whole back of the stage is one kinetic rig: eleven ladders of moving heads and wash bars that hang as a wall of light,
// and swing up on their hinges into a wave, a chevron, a crown or a canopy over the stage. Every shape throws a different pattern. Sparks, flame and cannons finish it.
await __tick();
{ const st=ST[1], g=st.group, Y0=STAGE_H, H=SH.H, NL=13, LL=8.6, yH=Y0+H-.35; addShell(st,null,ST.indexOf(st)===1?21:23);
  const ladders=[], barOn=glow(0xffffff), barMats=[glow(0xffffff),glow(0xffffff)];
  const lgeo=(()=>{ const parts=[]; for(const [dx,dz] of [[-.16,-.12],[.16,-.12],[-.16,.12],[.16,.12]]){ const c=new T.BoxGeometry(.045,LL,.045); c.translate(dx,-LL/2,dz); parts.push(c); } for(let j=0;j<17;j++){ const d=new T.BoxGeometry(.03,.6,.03); d.rotateZ((j%2?1:-1)*.62); d.translate(0,-.25-j*.5,-.12); parts.push(d); const e=new T.BoxGeometry(.03,.6,.03); e.rotateZ((j%2?-1:1)*.62); e.translate(0,-.25-j*.5,.12); parts.push(e); } return mergeGeos(parts); })();
  for(let i=0;i<NL;i++){ const a=(i-(NL-1)/2)*6.9*D2R, hg=new T.Group(), tilt=new T.Group(); hg.position.copy(pol(a,shellR(a,H)-1.0,yH)); hg.rotation.y=-a; g.add(hg); hg.add(tilt); tilt.add(new T.Mesh(lgeo,M.truss));
    const hinge=new T.Mesh(new T.CylinderGeometry(.14,.14,.7,12).rotateZ(Math.PI/2),M.steel); hg.add(hinge); const post=new T.Mesh(new T.BoxGeometry(.1,ROOM_H-1.5-yH,.1),M.truss); post.position.y=(ROOM_H-1.5-yH)/2; hg.add(post);
    const L={tilt,a,i,th:0,beams:[]}; for(let j=0;j<5;j++){ const y=-1.1-j*1.75, b=beam(st,tilt,0,y,.3,(i+j)%2,10.5,.75,true,stageAngle(1)+a); b.own=1; b.kin=L; b.j=j; L.beams.push(b); sock('mhead',tilt,0,y,.2,0,false,.95,Math.PI/2); }
    for(const sx of [-1,1]){ const strip=new T.Mesh(new T.BoxGeometry(.045,LL-.3,.03),barMats[i%2]); strip.position.set(sx*.2,-LL/2,.16); tilt.add(strip); }     // linear LED down both faces of every ladder
    ladders.push(L); }
  // an LED floor (the Black Marble type used on Latin awards stages) and a 9 m circle of LED overhead that tilts with the rig
  const FL={uT:{value:0},uC1:{value:new T.Color()},uC2:{value:new T.Color()},uOn:{value:1},uMode:{value:0}};
  const lf=new T.Mesh(ringSector(15.9,22.4,-44*D2R,44*D2R,Y0+.006),new T.ShaderMaterial({uniforms:FL,vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:'precision highp float; uniform float uT,uOn,uMode; uniform vec3 uC1,uC2; varying vec3 vW; float h(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} void main(){ vec2 c=vW.xz*2.; vec2 id=floor(c), f=fract(c)-.5; float tile=smoothstep(.5,.42,max(abs(f.x),abs(f.y))); float r=length(vW.xz-vec2(18.9,0.)*0.); float b=uT*118./60.; float v;'+
    'if(uMode<.5) v=pow(.5+.5*sin(length(vW.xz)*1.6-b*3.14159),6.); else if(uMode<1.5) v=step(.6,h(id+floor(b))); else v=pow(.5+.5*sin(atan(vW.x,-vW.z)*40.-b*3.14159),4.); vec3 col=mix(uC1,uC2,h(id))*(.08+1.1*v)*tile; gl_FragColor=vec4(col*uOn+vec3(.012)*tile,1.); }'}));
  g.add(lf);
  const halo=new T.Group(); halo.position.copy(pol(0,19.4,Y0+8.6)); g.add(halo); const hc=document.createElement('canvas'); hc.width=512; hc.height=16; { const x=hc.getContext('2d'); x.fillStyle='#000'; x.fillRect(0,0,512,16); x.fillStyle='#fff'; for(let i=0;i<128;i++) for(let j=0;j<4;j++) x.fillRect(i*4+1,j*4+1,2,2); }
  const haloTex=new T.CanvasTexture(hc); haloTex.wrapS=T.RepeatWrapping; haloTex.repeat.set(4,1); const haloMat=new T.MeshBasicMaterial({map:haloTex,color:0xffffff,side:T.DoubleSide});
  const hb=new T.Mesh(new T.CylinderGeometry(4.5,4.5,.8,96,1,true),haloMat); halo.add(hb); for(const y of [-.42,.42]){ const t=new T.Mesh(new T.TorusGeometry(4.5,.06,6,96),M.truss); t.rotation.x=Math.PI/2; t.position.y=y; halo.add(t); }
  for(const sx of [-1,1]){ const w=new T.Mesh(new T.CylinderGeometry(.012,.012,ROOM_H-1.5-(Y0+8.6),5),new T.MeshBasicMaterial({color:0x6a6a74})); w.position.set(sx*3.2,(ROOM_H-1.5-(Y0+8.6))/2,0); halo.add(w); }
  // spark fountains along the front, flame units between the ladders, and two confetti cannons
  const sp=[], cf=[]; for(let i=0;i<7;i++){ const p=pol((i-3)*11*D2R,16.6,Y0+.1); for(let n=0;n<90;n++){ const an=Math.random()*TAU, sr=Math.random()*1.1; sp.push({p:[p.x,p.y,p.z],v:[Math.cos(an)*sr,7.5+Math.random()*3.5,Math.sin(an)*sr],c:n%3?'#ffd28a':'#fff6e0'}); } }
  const sparks=particles(g,sp,{life:1.25,size:70});
  const flames=[]; for(const a of [-33,-11,11,33]){ const p=pol(a*D2R,20.6,Y0); flames.push(jet(g,p.x,p.y+.55,p.z,5.5,2.2,0xff7a1a,'flame')); sock('flameunit',g,p.x,Y0,p.z,Math.atan2(-p.x,-p.z),false,1); }
  const pal=['#ff3fa8','#3d6bff','#fff2c8','#35e0ff','#ffd24a']; for(const s of [-1,1]){ const p=pol(s*38*D2R,16.4,Y0+.6); for(let n=0;n<420;n++){ const an=Math.random()*TAU, sr=Math.random()*3; cf.push({p:[p.x,p.y,p.z],v:[-s*4.5+Math.cos(an)*sr,11+Math.random()*7,1.5+Math.sin(an)*sr],c:pal[n%5]}); }
    sock('cannon',g,p.x,Y0,p.z,Math.atan2(-p.x,-p.z)-s*.5,false,1); }
  const confetti=particles(g,cf,{life:6.5,g:9.8,size:95,burst:true,drag:1.5});
  const DUR=[13,13,13,13,13,13,13,13,13], MID=(NL-1)/2, _q=new T.Quaternion();
  const shape=(c,i,ph,t)=>{ const d=Math.abs(i-MID)/MID; switch(c){ case 0: return 0; case 1: return .5+.45*Math.sin(i*.7-t*.9); case 2: return 1.5*(1-d); case 3: return 1.6; case 4: return (i%2?1.5:.1); case 5: return 1.5*smooth(clamp(ph*3-d*1.4,0,1)); case 6: return .8+.7*Math.sin(t*.5+i*.3); case 7: return 1.1-.5*Math.cos(i*Math.PI/5); default: return 1.5*(1-smooth(clamp(ph*2.2-i*.11,0,1))); } };
  st.anim.push((t,dt,F)=>{ const q=cue(DUR), c=F>.5?q.i:0, mv=REDUCED?0:1, bt=t/BEAT, pulse=Math.pow(1-(bt%1),2), s2k=FILM.on?smooth(clamp((FILM.t-30.5)/.8,0,1)):1, show=(1-.8*smooth(S.houseK))*HZ()*SHOW.dim*s2k; let kin=0;   /* v23k: his note, Stage 2's vertical lights are off at the top of the show: the LED down the ladders and their moving heads stay dark until the hit at 30.5 */   // not featured: the rig hangs as a wall of light in the featured colours
    const white=(c===3||c===7)?.75:c===5?.4:0, dots=c===6;
    barMats[0].color.copy(SHOW.c2).multiplyScalar(s2k*(1-(SHOW.turnK||0))*SHOW.dim*S.ledK*(c===1||c===4||c===8?.25+.75*pulse:c===0?.9:.35)); barMats[1].color.copy(SHOW.c).multiplyScalar(s2k*(1-(SHOW.turnK||0))*SHOW.dim*S.ledK*(c===2||c===4?.25+.75*(1-pulse):c===0?.9:.3));
    FL.uT.value=t; FL.uC1.value.copy(SHOW.c); FL.uC2.value.copy(SHOW.c2); FL.uOn.value=TOUR.on?0:SHOW.dim*S.ledK*(.25+.75*F); FL.uMode.value=c%3; haloMat.color.copy(SHOW.c).lerp(CW,.3).multiplyScalar(TOUR.on?0:SHOW.dim*S.ledK*(.3+.7*pulse)); haloTex.offset.x=-t*.03*mv;
    halo.rotation.x=(REDUCED?0:Math.sin(t*.21)*.35)*(c===3||c===7?1.6:1); halo.rotation.z=REDUCED?0:Math.cos(t*.17)*.25; halo.position.y=Y0+8.6-(c===3?1.6:0)*smooth(q.ph<.5?q.ph*2:2-q.ph*2);
    for(const L of ladders){ const tg=REDUCED?.6:shape(c,L.i,q.ph,t); { const dth=clamp(tg-L.th,-dt*.55,dt*.55); L.th+=dth; kin+=Math.abs(dth); } L.tilt.rotation.x=-L.th; const vis=winVis(stageAngle(1)+L.a); const side=Math.sign(L.i-MID)||0, d=Math.abs(L.i-MID)/MID;
      for(const b of L.beams){ let x=0,y=0,z=.45,I=1; switch(c){
          case 0: x=Math.sin(t*.6+b.j*.5)*.7; y=.55+(b.j-2)*.1; break;                                                // a flat wall of light, fanning upward
          case 1: x=side*.3; y=Math.sin(t*.9+L.i*.6)*.6; z=.5; I=.5+.6*Math.pow(Math.max(0,Math.sin(bt*Math.PI/2-L.i*.5)),2); break;
          case 2: x=-side*(.4+.6*d); y=.5+(b.j-2)*.08; z=.3; break;                                                   // every beam crosses to the far side
          case 3: x=Math.sin(t*.35+L.i)*.25; y=(b.j-2)*.22+Math.sin(t*.5)*.2; z=1; break;                             // canopy: a ceiling of white shafts
          case 4: x=(L.i%2?1:-1)*.8*Math.sin(t*.8); y=.3+(b.j-2)*.12; z=.5; I=(Math.floor(bt)+L.i)%2?1:.12; break;
          case 5: x=-side*d; y=.6; z=.4; I=.3+.9*pulse; break;
          case 6: x=Math.sin(t*1.1+b.j+L.i*.4)*.9; y=Math.cos(t*.9+b.j*1.3)*.6; z=.6; break;
          case 7: x=side*.7; y=.5+b.j*.1; z=.4; I=.7+.5*Math.sin(t*2+L.i); break;
          default: x=Math.sin(bt*Math.PI/4+L.i*.5)*.8; y=.4; z=.5; I=h01(Math.floor(bt*2)+L.i*7+b.j*13)>.45?1:.08; }
        _d.set(x,y,z).normalize(); b.piv.quaternion.setFromUnitVectors(_dn,_d);
        b.col.copy(b.alt?SHOW.c2:SHOW.c).lerp(CW,white); b.m.uniforms.uC.value.copy(b.col); b.fl.material.color.copy(b.col);
        b.m.uniforms.uI.value=(dots?.03:.5+.25*pulse)*I*show*vis*(1-(SHOW.turnK||0)); b.fl.material.opacity=clamp((.6+.4*pulse)*I,0,1)*vis*s2k*(1-(SHOW.turnK||0)); } }
    SND.kin=kin/Math.max(dt,.001)/NL; SND.sparks=sparks.uniforms.uOn.value; if(c===7&&F>.6&&S.fxAuto&&q.s<.3) SND.boom=1;
    const pyro=F>.6&&!REDUCED&&S.fxAuto, fe=t-FXFIRE.t, fire=fe<3.5&&F>.5; sparks.uniforms.uT.value=t; sparks.uniforms.uOn.value+=clamp(((fire||pyro&&(c===3||c===7||q.s<1.2))?1:0)-sparks.uniforms.uOn.value,-dt*2,dt*4);
    flames.forEach((j,i)=>{ j.tgt=(fire&&fe>.3&&((fe*2+i*.25)%1)<.45)||(pyro&&(c===4||c===8)&&((bt/2)%1)<.3&&(Math.floor(bt/2)+i)%2===0)?1:0; });
    confetti.uniforms.uT.value=fire?fe-1.2:(c===7||c===8)?(c===7?q.s:q.s+13):99; confetti.uniforms.uOn.value=pyro||fire?1:0; if(fire&&fe>1.2&&fe<1.3) SND.boom=1; });
  st.look='rig'; }
function h01(n){ const x=Math.sin(n*127.1)*43758.5453; return x-Math.floor(x); }

// ---- stage 3: Awards. A great LED arch, LED columns, an LED ring flown overhead, travelling platforms and a landscape of LED-faced levels: an athletic show.
// One cue of its programme is a blackout act: dancers in suits of light.
const SUITS={ready:false,grp:null,chars:[],meshes:[]};
await __tick();
{ const st=ST[2], g=st.group, Y0=STAGE_H; addShell(st,null,22);
  // every trim line, rail, nosing and ring of this set is one electric circuit: in the show it follows the look like any other trim; after the burst
  // the current runs out through it from where the five stand, and that current is the only light on the stage
  const E3U={uT:{value:0},uE:{value:0},uFront:{value:0},uC:{value:new T.Color()},uCe:{value:new T.Color(1,.36,.28)},uO:{value:new T.Vector3()},uP:{value:0},uPf:{value:0},uH:{value:0}};
  const eMat=new T.ShaderMaterial({uniforms:E3U,vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:'precision highp float; uniform float uT,uE,uFront,uP,uPf,uH; uniform vec3 uC,uCe,uO; varying vec3 vW; void main(){ float d=distance(vW,uO), s=vW.x*.9+vW.y*1.7+vW.z*.6; float rev=smoothstep(uFront,uFront-1.2,d), head=smoothstep(1.5,0.,abs(d-uFront))*step(uFront,60.); float p=pow(.5+.5*sin(s*2.4-uT*13.),8.), fl=.72+.28*sin(uT*53.+s*7.)*sin(uT*17.+s*3.); vec3 e=uCe*(.55+1.6*p)*fl*rev+vec3(1.,.95,.9)*head*2.2; vec3 ring=vec3(.75,.88,1.)*(uP*2.4*smoothstep(2.6,0.,abs(d-uPf))+uH)*(.7+.3*fl); gl_FragColor=vec4(uC+e*uE+ring,1.); }'});
  const eL=[[0,3.4,-20.4,0xff6a58],[-8.5,1.6,-16.2,0xffd8d0],[8.5,1.6,-16.2,0xffd8d0]].map(([x,y,z,c])=>{ const L=new T.PointLight(c,0,30,1.3); L.position.set(x,Y0+y,z); g.add(L); return L; });
  const archCvE=document.createElement('canvas'), archCvW=document.createElement('canvas'); archCvE.width=archCvW.width=1024; archCvE.height=archCvW.height=512; let archPr=-1;
  // the awards look: a great LED arch at the back, LED columns either side of it, and an LED ring flown overhead with the show's name running round it
  const ledV=new T.Color(), glowW=new T.MeshBasicMaterial({color:0xffffff}), glowR=new T.MeshBasicMaterial({color:0xff2b3a});
  const archCv=document.createElement('canvas'); archCv.width=1024; archCv.height=512;
  { const c=archCv.getContext('2d'), w=1024, h=512; const gr=c.createLinearGradient(0,0,0,h*.5); gr.addColorStop(0,'#c0101e'); gr.addColorStop(1,'#ff3b3b'); c.fillStyle=gr; c.fillRect(0,0,w,h);
    c.strokeStyle='rgba(90,0,8,.55)'; c.lineWidth=18; for(let x=-h;x<w+h;x+=56){ c.beginPath(); c.moveTo(x,0); c.lineTo(x+h*.5,h*.5); c.stroke(); }
    c.strokeStyle='rgba(255,255,255,.22)'; c.lineWidth=6; for(const rr of [300,380,460]){ c.beginPath(); c.arc(w/2,h/2,rr,Math.PI,TAU); c.stroke(); }
    c.textAlign='center'; c.textBaseline='middle'; c.fillStyle='#fff'; c.font='600 34px Outfit, Arial, sans-serif'; c.fillText('T E A M',w/2,128);
    c.font='900 132px Outfit, "Arial Black", Arial, sans-serif'; c.fillText('FUEGO',w/2,200); c.font='500 26px Outfit, Arial, sans-serif'; c.fillText('I M P E R I O   S C H O O L',w/2,262); }
  { const c=archCvE.getContext('2d'), w=1024, h=512; c.fillStyle='#050203'; c.fillRect(0,0,w,h); c.lineJoin='round'; c.textAlign='center'; c.textBaseline='middle';
    for(const [lw,col,bl] of [[10,'#ff2a1c',34],[4,'#ffd9d0',10]]){ c.shadowColor='#ff2010'; c.shadowBlur=bl; c.strokeStyle=col; c.lineWidth=lw*.6; for(const rr of [300,380,460]){ c.beginPath(); c.arc(w/2,h/2,rr,Math.PI,TAU); c.stroke(); }
      c.lineWidth=lw; c.font='900 132px Outfit, "Arial Black", Arial, sans-serif'; c.strokeText('FUEGO',w/2,200); c.lineWidth=lw*.35; c.font='600 34px Outfit, Arial, sans-serif'; c.strokeText('T E A M',w/2,128); c.font='500 26px Outfit, Arial, sans-serif'; c.strokeText('I M P E R I O   S C H O O L',w/2,262); } }
  const archTex=new T.CanvasTexture(archCv), archTexW=new T.CanvasTexture(archCvW), archMat=new T.MeshBasicMaterial({map:archTex,color:0xffffff});
  const AR=21.8, archR=3.9; { const arch=new T.Group(); arch.position.set(0,Y0,-AR); g.add(arch);
    const disc=new T.Mesh(new T.CircleGeometry(archR-.55,64,0,Math.PI),archMat); disc.position.z=-.05; arch.add(disc);
    for(const [r,tb,m] of [[archR,.16,glowW],[archR-.5,.07,glowW],[archR+.42,.05,glowR]]){ const tor=new T.Mesh(new T.TorusGeometry(r,tb,8,96,Math.PI),m); arch.add(tor); }
    const shell=new T.Mesh(new T.RingGeometry(archR-.5,archR+.5,64,1,0,Math.PI),new T.MeshStandardMaterial({color:0x121218,roughness:.35,metalness:.8,side:T.DoubleSide})); shell.position.z=-.08; arch.add(shell); }
  const cols=[]; for(const a of [-14,14]){ const p=pol(a*D2R,21.6,Y0); for(const [dx,hh] of [[-.55,6.2],[.55,5.2]]){ const cg=new T.Group(); cg.position.set(p.x,Y0,p.z); cg.rotation.y=-a*D2R; g.add(cg);
      const cy=new T.Mesh(new T.CylinderGeometry(.42,.42,hh,24,1)); cols.push(cy); cy.position.set(dx,hh/2,0); cg.add(cy); for(let k=0;k<Math.floor(hh/.5);k++){ const bnd=new T.Mesh(new T.CylinderGeometry(.43,.43,.05,24,1,true),glowW); bnd.position.set(dx,.25+k*.5,0); cg.add(bnd); } } }
  /* 16 Nov, his idea: in the opening the football look makes this hanging ring a bright feature, and back in our own room it was dark. It now lights in its red and gold on the snap back (RINGCUE.t0), holds a second and fades, gone before the screens open at 14.5 */
  const RINGCUE=window.RINGCUE||{t0:9.15,hold:1.0,fade:3.6,lv:1.2}, ringCueK=()=>{ if(!FILM.on) return 0; const ft=FILM.t, R=RINGCUE; if(ft<R.t0-.06) return 0; const u=(ft-R.t0-R.hold)/R.fade; return clamp((ft-R.t0+.06)/.09,0,1)*(u<=0?1:1-smooth(clamp(u,0,1))); };
  const ringCv=document.createElement('canvas'); ringCv.width=2048; ringCv.height=128;
  { let c=ringCv.getContext('2d'); const F_='800 76px Outfit, "Arial Narrow", Arial, sans-serif', s='REVERSE ARENA'; c.font=F_; const unit=Math.ceil(c.measureText(s).width)+132; ringCv.width=unit*3; c=ringCv.getContext('2d');   // three whole names, so the loop has no seam
    c.fillStyle='#050507'; c.fillRect(0,0,ringCv.width,128); c.font=F_; c.textBaseline='middle';
    for(let i=0;i<3;i++){ const x=i*unit+20; c.fillStyle='#ffc400'; c.fillText(s,x,66); c.fillStyle='#ff2b3a'; c.beginPath(); c.arc(x+unit-66,64,12,0,TAU); c.fill(); } }
  const ringTex=new T.CanvasTexture(ringCv); ringTex.wrapS=T.RepeatWrapping; ringTex.repeat.set(-3,1); const ringMat=new T.MeshBasicMaterial({map:ringTex,color:0xffffff,side:T.DoubleSide});
  const ovr=new T.Group(); ovr.position.set(0,Y0+8.4,-19.4); ovr.rotation.x=-.22; g.add(ovr);
  for(const [r,y] of [[4.4,0],[3.6,-.95]]){ const cyl=new T.Mesh(new T.CylinderGeometry(r,r,.8,120,1,true),ringMat); cyl.position.y=y; ovr.add(cyl);
    for(const dy of [-.43,.43]){ const tor=new T.Mesh(new T.TorusGeometry(r+.02,.025,6,120),glowR); tor.rotation.x=Math.PI/2; tor.position.y=y+dy; ovr.add(tor); } }
  { const n=72, im=new T.InstancedMesh(new T.SphereGeometry(.07,8,6),glowR,n), mt=new T.Matrix4(); for(let i=0;i<n;i++){ const an=i/n*TAU; mt.makeTranslation(Math.cos(an)*5.2,-.2,Math.sin(an)*5.2); im.setMatrixAt(i,mt); } ovr.add(im); }
  for(const sx of [-1,1]){ const w=new T.Mesh(new T.CylinderGeometry(.012,.012,ROOM_H-1.5-(Y0+8.8),5),new T.MeshBasicMaterial({color:0x5a5a64})); w.position.set(sx*3.2,(ROOM_H-1.5-(Y0+8.8))/2+.4,0); ovr.add(w); }
  // levels: a landscape of platforms in different shapes, every face an LED video facing, stepping up to a 6.8 m tower each side.
  // Heights run in the golden ratio (1.0, 1.6, 2.6, 4.2, 6.8 m) so every level is a jump, a climb or an aerial height apart.
  // LED facings: a pixel skin on every side of every level, running chases that climb the levels on the beat
  const FACE={uT:{value:0},uC1:{value:new T.Color()},uC2:{value:new T.Color()},uOn:{value:1},uZap:{value:0},uZapC:ZAP.c,uP:E3U.uP,uPf:E3U.uPf,uPo:E3U.uO,uH:E3U.uH};
  const faceMat=new T.ShaderMaterial({uniforms:FACE,vertexShader:'varying vec3 vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:'precision highp float; uniform float uT,uOn,uZap,uP,uPf,uH; uniform vec3 uC1,uC2,uZapC,uPo; varying vec3 vW; float zh(vec2 p){return fract(sin(dot(p,vec2(127.1,311.7)))*43758.5453);} float zn(vec2 p){vec2 i=floor(p),f=fract(p);f=f*f*(3.-2.*f);return mix(mix(zh(i),zh(i+vec2(1,0)),f.x),mix(zh(i+vec2(0,1)),zh(i+vec2(1,1)),f.x),f.y);} float zf(vec2 p){return .5*zn(p)+.25*zn(p*2.03)+.125*zn(p*4.1)+.0625*zn(p*8.3);} void main(){ float a=atan(vW.x,-vW.z)*21.; vec2 g=vec2(a,vW.y)*14.; vec2 f=fract(g)-.5; float px=smoothstep(.48,.25,length(f)); float b=uT*118./60.; float band=pow(.5+.5*sin(vW.y*2.2-b*3.14159+a*.15),5.); float scan=smoothstep(.15,0.,abs(fract(a*.08-uT*.15)-.5)-.38); vec2 cell=floor(g); float sp=step(.86,fract(sin(dot(cell,vec2(12.9898,78.233)))*43758.5453)); vec3 col=(mix(uC1,uC2,band)*(.05+.7*band)*(.3+.7*sp)+uC2*scan*.25)*.55; vec2 og=fract(g)-.5; vec3 off=vec3(.035,.036,.045)*smoothstep(.48,.2,length(og)); vec3 zc=vec3(0.); if(uZap>.004){ float zt=floor(uT*26.)*.71, zs=0.; vec2 zp=vec2(a*.22,vW.y*.9); for(int i=0;i<2;i++){ float fi=float(i); float d=abs(zf(zp*(1.2+fi*1.3)+vec2(zt*(1.+fi*.6),fi*7.3-zt*.8))-.47); zs+=(.009+.003*fi)/(d+.006)*(.6-.15*fi); } zs=min(zs,3.2)*uZap; zc=uZapC*zs+vec3(1.,.92,.88)*max(0.,zs-.9)*.8; } float rg=(uP*1.1*smoothstep(2.6,0.,abs(distance(vW,uPo)-uPf))+uH*.45)*px; gl_FragColor=vec4(mix(off,col*px,uOn)+zc+vec3(.5,.7,1.)*rg,1.); }'});
  for(const cy of cols) cy.material=faceMat;
  const lev=(shape,a,r,w,d,h,rot)=>{ const sh=new T.Shape(); if(shape==='hex'){ for(let i=0;i<6;i++){ const an=i/6*TAU; const x=Math.cos(an)*w/2, y=Math.sin(an)*d/2; i?sh.lineTo(x,y):sh.moveTo(x,y); } }
      else if(shape==='round'){ sh.absellipse(0,0,w/2,d/2,0,TAU,false,0); } else if(shape==='wedge'){ sh.moveTo(-w/2,-d/2); sh.lineTo(w/2,-d/2); sh.lineTo(w*.18,d/2); sh.lineTo(-w*.18,d/2); sh.closePath(); }
      else { const r0=Math.min(w,d)*.18; sh.moveTo(-w/2+r0,-d/2); sh.lineTo(w/2-r0,-d/2); sh.quadraticCurveTo(w/2,-d/2,w/2,-d/2+r0); sh.lineTo(w/2,d/2-r0); sh.quadraticCurveTo(w/2,d/2,w/2-r0,d/2); sh.lineTo(-w/2+r0,d/2); sh.quadraticCurveTo(-w/2,d/2,-w/2,d/2-r0); sh.lineTo(-w/2,-d/2+r0); sh.quadraticCurveTo(-w/2,-d/2,-w/2+r0,-d/2); }
    const geo=new T.ExtrudeGeometry(sh,{depth:h,bevelEnabled:false,curveSegments:24}); geo.rotateX(-Math.PI/2); const m=new T.Mesh(geo,[gloss,faceMat]); const p=pol(a*D2R,r,Y0); m.position.copy(p); m.rotation.y=-a*D2R+(rot||0); g.add(m);
    const edge=new T.LineSegments(new T.EdgesGeometry(geo,30),eMat); edge.position.copy(p); edge.rotation.copy(m.rotation); g.add(edge); return m; };
  for(const s of [-1,1]){
    lev('hex',s*31,19.6,2.6,2.6,1.0); lev('round',s*35,21.0,2.8,2.4,PHI); lev('wedge',s*28,21.4,3.0,2.2,PHI*PHI,s*.3); lev('rounded',s*38,22.2,2.4,1.8,PHI*PHI*PHI);
    const tw=lev('round',s*24,22.4,2.2,2.2,PHI*PHI*PHI*PHI); const ring=new T.Mesh(new T.TorusGeometry(1.35,.05,8,48),eMat); ring.rotation.x=Math.PI/2; ring.position.copy(pol(s*24*D2R,22.4,Y0+6.85)); g.add(ring);   // the 6.8 m tower, an aerial launch point
    lev('rounded',s*6,18.9,1.7,1.3,.6);   // a low riser either side of centre, in front of the arch
    const br=new T.Mesh(new T.BoxGeometry(.9,.12,3.6),gloss); br.position.copy(pol(s*29.5*D2R,22.0,Y0+PHI*PHI*PHI)); br.rotation.y=-s*29.5*D2R+s*1.2; g.add(br); }   // a bridge between the 4.2 m level and the tower
  // stairs, a balcony walkway and more risers: every level has a real way up, so the stage reads as a playground the company can run, climb and jump.
  // Every stair has LED risers like the levels and a lit nosing on each tread.
  const stair=(a,r0,r1,h,w)=>{ const n=Math.max(2,Math.round(h/.19)), dr=(r1-r0)/n, rise=h/n;
    for(let i=0;i<n;i++){ const hh=rise*(i+1), m=new T.Mesh(new T.BoxGeometry(w,hh,Math.abs(dr)+.002),[faceMat,faceMat,gloss,gloss,faceMat,faceMat]); m.position.copy(pol(a*D2R,r0+dr*(i+.5),Y0+hh/2)); m.rotation.y=-a*D2R; g.add(m);
      const ns=new T.Mesh(new T.BoxGeometry(w,.03,.035),eMat); ns.position.copy(pol(a*D2R,r0+dr*i+Math.sign(dr)*.02,Y0+hh)); ns.rotation.y=-a*D2R; g.add(ns); } };
  const balcony=(a0,a1,rI,rO,h)=>{ const sh=new T.Shape(), N=24; for(let i=0;i<=N;i++){ const an=(a0+(a1-a0)*i/N)*D2R; i?sh.lineTo(Math.sin(an)*rO,Math.cos(an)*rO):sh.moveTo(Math.sin(an)*rO,Math.cos(an)*rO); }
    for(let i=N;i>=0;i--){ const an=(a0+(a1-a0)*i/N)*D2R; sh.lineTo(Math.sin(an)*rI,Math.cos(an)*rI); }
    const geo=new T.ExtrudeGeometry(sh,{depth:.22,bevelEnabled:false,curveSegments:4}); geo.rotateX(-Math.PI/2); const m=new T.Mesh(geo,[gloss,faceMat]); m.position.y=Y0+h-.22; g.add(m);
    const ed=new T.LineSegments(new T.EdgesGeometry(geo,30),eMat); ed.position.y=m.position.y; g.add(ed);
    const pts=[]; for(let i=0;i<=N;i++) pts.push(pol((a0+(a1-a0)*i/N)*D2R,rI+.06,Y0+h+1.0)); g.add(new T.Mesh(new T.TubeGeometry(new T.CatmullRomCurve3(pts),48,.025,6,false),eMat));
    const np=Math.max(2,Math.round((a1-a0)*D2R*rI/1.2)); for(let i=0;i<=np;i++){ const an=(a0+(a1-a0)*i/np)*D2R, pp=new T.Mesh(new T.CylinderGeometry(.02,.02,1.0,6),eMat); pp.position.copy(pol(an,rI+.06,Y0+h+.5)); g.add(pp);
      const leg=new T.Mesh(new T.CylinderGeometry(.06,.06,h-.22,8),M.steel); leg.position.copy(pol(an,(rI+rO)/2,Y0+(h-.22)/2)); g.add(leg); } };
  for(const s of [-1,1]){
    stair(s*31,17.15,18.55,1.0,1.5);              // up from the deck onto the 1.0 m hex
    stair(s*19,17.3,20.45,PHI*PHI,1.3);           // a long run to the 2.6 m balcony
    balcony(s<0?-25.5:16.5,s<0?-16.5:25.5,20.4,21.25,PHI*PHI);   // the walkway crosses in front of the tower to the 2.6 m wedge
    if(s<0){ lev('hex',s*42,19.2,1.8,1.8,.6); lev('wedge',s*42.5,21.0,2.0,1.6,PHI,s*-.2); stair(s*42,17.75,18.4,.6,1.1); }   /* v18: struck on the tunnel side (222 degrees): they stood a metre off the line Tripp walks in on and hid his entrance */   // a low hex and a wedge on the far wing, with their own steps
    lev('round',s*15.5,18.6,1.1,1.1,.3); }      // stepping stones in front of the columns
  const movers=[]; for(const s of [-1,1]){ const p=pol(s*9.5*D2R,20.0,Y0), pg=new T.Group(); pg.position.set(p.x,Y0,p.z); g.add(pg); const pl=new T.Mesh(new T.BoxGeometry(2.3,.16,2.3),gloss); pl.position.y=-.08; pg.add(pl);
    const e=new T.Mesh(new T.BoxGeometry(2.36,.04,2.36),eMat); e.position.y=-.17; pg.add(e); const col=new T.Mesh(new T.BoxGeometry(.9,1,.9),M.steel); col.position.set(p.x,Y0,p.z); g.add(col); movers.push({g:pg,col,s}); } st.movers=movers;
  const co2=[]; for(const a of [-30,-10,10,30]){ const p=pol(a*D2R,16.5,Y0); co2.push(jet(g,p.x,p.y+.42,p.z,7,2.2,0xe6f3ff)); sock('cryojet',g,p.x,Y0,p.z,a,false,1); }
  const cf=[], pal=['#ffc400','#ff2b3a','#ffd23f','#c8102e']; for(const s of [-1,1]){ const p=pol(s*40*D2R,16.4,Y0+.6); for(let n=0;n<420;n++){ const an=Math.random()*TAU, sr=Math.random()*3; cf.push({p:[p.x,p.y,p.z],v:[-s*5+Math.cos(an)*sr,12+Math.random()*7,1.5+Math.sin(an)*sr],c:pal[n%4]}); } if(s<0) sock('cannon',g,p.x,Y0,p.z,Math.atan2(-p.x,-p.z)-s*.5,false,1); }   /* v18b: the cannon on the tunnel side is struck: it stood on Tripp's line in and in front of his camera */
  const confetti=particles(g,cf,{life:6.5,size:95,burst:true,drag:1.5});
  for(let i=0;i<8;i++){ const a=(i-3.5)*10*D2R, p=pol(a,shellR(a,0)-.3,Y0+.25), b=beam(st,g,p.x,p.y,p.z,i%2,9.5,.8,false); b.u=(i-3.5)/7; b.ca=Math.cos(a); b.sa=Math.sin(a); b.own=2; }
  SUITS.grp=new T.Group(); SUITS.grp.visible=false; g.add(SUITS.grp);
  st.look='chase';
  st.anim.push((t,dt,F)=>{ const q=cue([22,26,20,16]), mv=REDUCED?0:1, suits=q.i===1&&SUITS.ready&&F>.5; FACE.uT.value=t; FACE.uC1.value.copy(SHOW.c); FACE.uC2.value.copy(SHOW.c2); FACE.uOn.value=S.ledK*(SHOW.vdim??SHOW.dim)*(.25+.75*F);
    const lk=S.ledK*(SHOW.vdim??SHOW.dim)*(.25+.75*F); ledV.setScalar(lk); archMat.color.copy(ledV); if(FILM.on){ const ft=FILM.t; if(ft<30.5) archMat.color.multiplyScalar(ft>22?0:1); else archMat.color.multiplyScalar((1+2.2*Math.exp(-(ft-30.5)*2.2))*(ft<32.6?(.55+.75*h01(Math.floor(ft*30)+3)):1)); }   /* the name stays dark through the dark act; the lightning lights it on the drop */ ringMat.color.copy(ledV); const _rk=ringCueK(); if(_rk>0) ringMat.color.setScalar(Math.max(lk,_rk*RINGCUE.lv)); glowW.color.setRGB(1,.77,.05).multiplyScalar(.15+.85*lk);   /* v23k: the FUEGO arcs in gold */ glowR.color.setRGB(1,.17,.23).multiplyScalar(Math.max(.15+.85*lk,_rk*1.5)); { const bt=musicBeat(), pb=1+.22*Math.pow(1-(((bt%1)+1)%1),2.5); archMat.color.multiplyScalar(pb); glowR.color.multiplyScalar(pb); glowW.color.multiplyScalar(pb); }   /* v23h: his note, FUEGO breathes on the beat, about 20%, never a flash */
    { const ek=elecK(), eft=FILM.on?FILM.t-30.48:0, fk=.78+.22*h01(Math.floor(t*30)+5), up=ek*smooth(clamp((eft-.3)/.5,0,1));
      E3U.uT.value=t; E3U.uC.value.copy(trimMat.color); E3U.uE.value=ek*1.2*(1+.7*(FILM.on?hitPulse():0));   /* night 8: the lit set surges on the hits */
      { const ft=FILM.on?FILM.t:0, on=FILM.on&&ft>=16.1&&ft<30.45, ss=on?stemState(ft):null; E3U.uP.value=0; E3U.uPf.value=on?ss.since*26:0; E3U.uH.value=false&&FILM.on&&ft>=28.9&&ft<30.45?(.2+.75*ss.rate)*.9*hitPulse():0; }   /* night 14: nothing runs through the set until the vocals; the flashes scale up toward the drop */   /* night 9: on the three big hits of the dark act the whole set flashes in outline */   /* night 3: each strike of the stems runs out through the set as a ring of current */ E3U.uFront.value=ek>0?(eft*15>32?99:eft*15):0; E3U.uO.value.copy(pol(stageAngle(2),16.6,STAGE_H+1));
      FACE.uZap.value=Math.max(ZAP.u.value,up*.4);
      if(ek>0){ glowW.color.setScalar(Math.max(.15+.85*lk,up*fk)); glowR.color.setRGB(1,.13,.1).multiplyScalar(Math.max(.15+.85*lk,up*1.5*fk)); ringMat.color.setScalar(up*.9*fk);
        const pr=clamp((eft-.35)/1.0,0,1); if(pr!==archPr){ archPr=pr; const c=archCvW.getContext('2d'); c.fillStyle='#050203'; c.fillRect(0,0,1024,512); if(pr>0){ c.drawImage(archCvE,0,0,1024*pr,512,0,0,1024*pr,512); if(pr<1){ const gx=1024*pr, gr=c.createLinearGradient(gx-46,0,gx+6,0); gr.addColorStop(0,'rgba(255,255,255,0)'); gr.addColorStop(1,'rgba(255,255,255,.95)'); c.fillStyle=gr; c.fillRect(gx-46,0,52,512); } } archTexW.needsUpdate=true; }   /* the current writes the name, left to right */
        if(archMat.map!==archTexW){ archMat.map=archTexW; } archMat.color.setScalar(ek*(.9+.5*h01(Math.floor(t*30)+3))); }
      else if(archMat.map!==archTex){ archMat.map=archTex; archPr=-1; }
      eL.forEach((L,i)=>{ L.intensity=up*(i?1.5:2.6)*(.7+.6*h01(Math.floor(t*24)+i*9)); }); }
    ringTex.offset.x=(t*.025*mv)%1; ovr.rotation.y=Math.sin(t*.12)*.15*mv;
    for(const m of movers){ const h=1.6+1.6*Math.sin(t*.35+m.s*1.6)*mv; m.g.position.y=Y0+h; m.col.scale.y=Math.max(.001,h); m.col.position.y=Y0+h/2-.08; }
    const fe=t-FXFIRE.t, fire=fe<3&&F>.5; co2.forEach((j,i)=>{ j.tgt=dark2K()?0:fire||(F>.6&&!REDUCED&&S.fxAuto&&q.i===2&&(q.s%(8*BEAT))<.8&&i%2===Math.floor(q.s/(8*BEAT))%2)?1:0; });
    confetti.uniforms.uT.value=fire?fe-1:q.i===3?q.s:99; confetti.uniforms.uOn.value=FILM.on&&FILM.t<44.2?0:(F>.6&&!REDUCED&&S.fxAuto)||fire?1:0;   /* night 6: no confetti in the electric act */ if(fire&&fe>1&&fe<1.1) SND.boom=1; if(q.i===3&&F>.6&&S.fxAuto&&q.s<.3) SND.boom=1;
    const dark2=dark2K(), xf=FILM.on&&FILM.t>=30.5&&FILM.t<31.45, sv=suits||dark2||xf; if(SHOW.cur===2) SHOW.dimT=sv||elecK()>0?.03:1; window.__sd={suits,qi:q.i,qs:q.s,F,ready:SUITS.ready,n:SUITS.meshes.length};
    SUITS.grp.visible=sv; if(sv){ const bt=FILM.on?(musicBeat()<0?musicBeat()/2:musicBeat()):q.s/BEAT, fade=dark2||xf?1:smooth(clamp((q.dur-q.s)*1.5,0,1)), N=SUITS.meshes.length, full=FILM.on?FILM.t>=29.2:q.s>SUITS.meshes[N-1].join+1.5;
      // it starts with one dancer on the beat and grows across the deck and up the levels; the flashes are the moves, caught on the beat
      SUITS.meshes.forEach((S_,i)=>{ const m=S_.m, p=dSpotPos(S_.d,_dsp); m.position.copy(p); m.rotation.y=Math.atan2(-p.x,-p.z)+(S_.lv<0&&S_.d.dx===0&&FILM.on?leadYawOff(FILM.t):0); const u=m.userData.u, ft=FILM.on?FILM.t:999, pulse=Math.pow(1-(((bt%1)+1)%1),2);
        let on=0, white=0;
        if(!FILM.on){ on=.5+.3*pulse; }
        else if(xf){ const k=1-(ft-30.5)/.95; on=.95*k*k; white=.5*k; }   /* night 15: the light bodies fade into the dancers over a second instead of switching */
        else if(dark2){ const k=Math.max(0,1-(ft-(S_.hit===undefined?-9:S_.hit))/.42); on=k*k; white=k*.8; if(S_.lv<0&&S_.d.dx===0){ const sq=((ft*15)%1)<.5?1:0; on=Math.max(on,.25+.75*sq); white=Math.max(white,sq*.7); } }   /* back in the dark: a body shows only when the energy hits it */
        else if(S_.lv<0){ const j=S_.d.dx, A=actState(j,ft), Bn=j>0?bounceLit(j,ft):null;                                    // the lead and the six: lit only inside their windows
          if(window.__riseB&&Bn&&Bn.lit&&Bn.since>.3) Bn.lit=false; if(window.__riseB&&!Bn&&A.lit&&A.wi!==ACT.last&&A.since>.55) A.lit=false;   /* option B: the others power up for a moment only */
          if(Bn){ if(Bn.lit){ const f=Math.max(0,1-Bn.since/.12); on=Math.max(.7+.2*pulse,.6+.4*f); white=Math.max(.12,f); if(Bn.left<.05){ on=1; white=1; } } }   /* v18b: in the wings and the towers each is lit only for its turn of the bounce */
          else if(window.__riseB&&j===0&&ft>=22.4&&ft<30.45){ const st_=stemState(ft), sn=window.__riseB2?st_.since-.22:st_.since, e=sn<0?0:Math.exp(-sn*6), vx=voxAt(ft+.06), fl=.9+.1*Math.sin(ft*37.)*Math.sin(ft*11.); on=window.__riseB2?Math.max(b2Pulse(ft,Math.max(vx,ft>=29.4&&ft<30.5?.9:0)),e):Math.max(.1+.9*vx*fl,.55*e); white=Math.max(vx*.45,e*.8); }   /* option B: she is the singer: brightest while the lyric is sung, dim in the gaps; each strike that lifts her still flashes */
          else if(A.lit){ const f=Math.max(0,1-A.since/.3); on=Math.max(.62+.22*pulse,.6+.4*f); white=Math.max(.12,f);
            if(window.__riseB&&j===0&&ft>=22.4){ const st_=stemState(ft), sn=window.__riseB2?st_.since-.22:st_.since, e=sn<0?0:Math.exp(-sn*6), vx=voxAt(ft+.06), fl=.9+.1*Math.sin(ft*37.)*Math.sin(ft*11.); on=window.__riseB2?Math.max(b2Pulse(ft,Math.max(vx,ft>=29.4&&ft<30.5?.9:0)),e):Math.max(.1+.9*vx*fl,.55*e); white=Math.max(vx*.45,e*.8); }   /* option B: she is lit by each strike that lifts her, and dims as the charge drains */
            else if(A.wi===ACT.last){ if(j===0){ const tb=ft-A.s, ph=2.4*tb+2.7*tb*tb, sq=(ph%1)<.55?1:0; on=.1+.9*sq; white=Math.max(f,sq*.7); }   /* the last charge: the strikes on her come faster and faster */ on=Math.max(on,.9*smooth(clamp((ft-29.8)/.6,0,1))); }
            else if(A.left<.09){ on=1; white=1; } } }                                                // a white flash, then gone
        else { const M_=S_.mom||(S_.mom=companyMoments(S_,i)); let k=-1, left=0; for(const [s_,dd] of M_){ if(ft>=s_&&ft<s_+dd){ k=ft-s_; left=s_+dd-ft; } }      /* v18b: the company on the levels is lit for moments, never held: one turn of the bounce each, then the build into the hit */
          if(window.__riseB&&k>.3) k=-1;
          if(k>=0){ const f=Math.max(0,1-k/.12); on=.62+.14*pulse+f*.38; white=f*.8; if(left<.05){ on=1; white=1; } }
          on=Math.max(on,.8*smooth(clamp((ft-29.6)/.8,0,1))); }
        if(window.__riseB2&&S_.feed!==undefined&&ft>=S_.feed&&ft<S_.feed+.6){ const kf=Math.exp(-(ft-S_.feed)*5); on=Math.max(on,.9*kf); white=Math.max(white,.7*kf); }   /* option B2: a dancer on the floor lights as its charge goes into the deck */
        u.uOn.value=on*fade; u.uCol.value.copy(teamCol(S_.lv<0?S_.d.dx%4:(i+1)%4)).lerp(CW,Math.max(.15,white)); S_.lit=on>.05; });
      if(dark2) dark2Update(dt); else if(!xf||suits) sparksUpdate(t,dt,bt); } }); }
// B2: on a sung line she is caught in bursts on the eighth notes (lit for the first half of each, dark for the rest); the louder the line, the brighter
function b2Pulse(ft,vx){ const u=((ft-22.35)/(60/117.45/2))%1; return vx>.28?(u<.5?.75+.25*Math.min(1,vx*1.3):.03):.03; }
// the suits of light: built from Stage 3's company once it has loaded (see buildSuits)
async function loadSuits(){ for(let i=0;i<900&&!DANCE.ready;i++) await new Promise(r=>setTimeout(r,100)); buildSuits(); }

// ---- stage 4: holograms. A holo-gauze (a near-invisible sharkstooth mesh) spans the stage; projectors on the fixed grid throw onto it, so figures and
// objects seem to float in mid-air against a black void. Two transparent LED layers behind give depth. Lasers and low fog finish it.
const HOLO={ready:false,mixer:null,u:{uT:{value:0},uOn:{value:1},uC:{value:new T.Color('#5ff4ff')},uC2:{value:new T.Color('#ff5fd2')}}};
const HOLO_FS='precision highp float; uniform float uT,uOn; uniform vec3 uC,uC2; varying vec3 vN,vV,vW; void main(){ float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.6); float sl=.55+.45*sin(vW.y*42.-uT*6.); float fl=.85+.15*sin(uT*31.+vW.y*3.)*sin(uT*7.); float a=(fr*1.4+.12)*sl*fl*uOn; vec3 c=mix(uC,uC2,smoothstep(1.,7.,vW.y))*a; gl_FragColor=vec4(c,a); }';
const HOLO_VS='varying vec3 vN,vV,vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=cameraPosition-w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }';
const holoMat=()=>new T.ShaderMaterial({uniforms:HOLO.u,vertexShader:HOLO_VS,fragmentShader:HOLO_FS,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
await __tick();
{ const st=ST[3], g=st.group, Y0=STAGE_H, H=SH.H; addShell(st,null,ST.indexOf(st)===1?21:23);
  // the gauze: you see it only as a faint sheen until something is projected on it
  const GZ={uT:{value:0},uOn:{value:1}}; const gz=new T.Mesh(arcPanel(17.4,-41*D2R,41*D2R,Y0,Y0+7.6,{inward:true}),new T.ShaderMaterial({uniforms:GZ,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:UVV,
    fragmentShader:'precision highp float; uniform float uT,uOn; varying vec2 vUv; void main(){ vec2 m=fract(vUv*vec2(900.,160.)); float mesh=step(.82,max(m.x,m.y)); float sheen=.012+.02*smoothstep(.0,.4,vUv.y)*smoothstep(1.,.6,vUv.y); float a=(sheen+mesh*.01)*uOn; gl_FragColor=vec4(vec3(.75,.85,1.)*a,a); }'}));
  gz.renderOrder=5; g.add(gz); const pipe=new T.Mesh(new T.TorusGeometry(17.4,.04,6,200,82*D2R),M.truss); pipe.rotation.x=Math.PI/2; pipe.rotation.z=(-90-41)*D2R; pipe.position.y=Y0+7.65; g.add(pipe);
  // two transparent LED layers behind the gauze, pixels with nothing between them
  const TL={uT:{value:0},uOn:{value:1},uC:{value:new T.Color()}}; for(const [r,ph] of [[20.4,0],[22.0,1.7]]){ const m=new T.Mesh(arcPanel(r,-40*D2R,40*D2R,Y0+.3,Y0+7.4,{inward:true}),new T.ShaderMaterial({uniforms:Object.assign({uPh:{value:ph}},TL,AMASK.u),transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.DoubleSide,vertexShader:'varying vec2 vUv; varying vec3 vAW; void main(){ vUv=uv; vec4 w=modelMatrix*vec4(position,1.0); vAW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',   /* 16 Nov: the rain is cut out behind the angel (AMASK in s-show.js) */
      fragmentShader:'precision highp float; uniform float uT,uOn,uPh; uniform vec3 uC; varying vec2 vUv; '+AMASK_GL+' float h(float n){return fract(sin(n*127.1)*43758.5453);} void main(){ vec2 g=vUv*vec2(220.,48.); vec2 id=floor(g), f=fract(g)-.5; float dot_=smoothstep(.32,.1,length(f)); float col=id.x; float fall=fract(h(col+uPh*13.)*5.+uT*(.08+.18*h(col+3.))); float y=1.-vUv.y; float stream=smoothstep(.25,0.,y-fall)*step(y,fall)*step(.55,h(col*1.7+uPh)); float a=dot_*(stream*.9+.04)*uOn; a*=1.-aMask(1.); gl_FragColor=vec4(uC*a,a); }'})); m.renderOrder=4; amaskHook(m); g.add(m); }
  // the holograms: a globe with orbit rings, cubes that drift, and (when the model is loaded) a dancer three times life size
  const holo=new T.Group(); g.add(holo); const hm=holoMat();
  const globe=new T.Group(); globe.position.copy(pol(-11*D2R,21.2,Y0+6.0));   /* v23: lifted and moved up and back, out of the angel's beam as she comes down (his note) */ holo.add(globe); globe.add(new T.Mesh(new T.SphereGeometry(2.0,48,32),hm)); globe.add(new T.LineSegments(new T.EdgesGeometry(new T.IcosahedronGeometry(2.05,2)),new T.LineBasicMaterial({color:0x7ff6ff,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false})));
  for(let i=0;i<3;i++){ const o=new T.Mesh(new T.TorusGeometry(2.6+i*.35,.02,6,120),hm); o.rotation.set(1.2+i*.4,i*.9,0); globe.add(o); }
  const cubes=[]; for(let i=0;i<6;i++){ const c=new T.LineSegments(new T.EdgesGeometry(new T.BoxGeometry(.8,.8,.8)),new T.LineBasicMaterial({color:i%2?0xff7fe0:0x7ff6ff,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false})); holo.add(c); cubes.push({c,ph:i*1.3,a:(-34+i*13)*D2R}); }
  st.holo=holo;
  // light shafts: thin vertical beams rising out of the deck behind the gauze, for the giant
  /* 16 Nov: the teal shafts stand behind the angel, so they are cut out behind her too (AMASK in s-show.js) */ const SHAFT=new T.ShaderMaterial({uniforms:Object.assign({uCol:{value:new T.Color(0x40d8ff)},uOp:{value:.55}},AMASK.u),transparent:true,blending:T.AdditiveBlending,depthWrite:false,vertexShader:'varying vec3 vAW; void main(){ vec4 w=modelMatrix*instanceMatrix*vec4(position,1.0); vAW=w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',fragmentShader:'precision highp float; uniform vec3 uCol; uniform float uOp; '+AMASK_GL+' void main(){ float a=uOp*(1.-aMask(1.)); gl_FragColor=vec4(uCol,a); }'}); SHAFT.color=SHAFT.uniforms.uCol.value; const shafts=new T.InstancedMesh(new T.CylinderGeometry(.035,.035,9,6,1,true),SHAFT,26); amaskHook(shafts); { const mt=new T.Matrix4(); for(let i=0;i<26;i++){ const a=(-38+i*3.04)*D2R, r=(i%2?19.6:21.9)+((i*7)%3)*.25; if(Math.abs(a)<6*D2R&&r<21){ mt.makeTranslation(0,-99,0); } else { const p=pol(a,r,Y0+4.5); mt.makeTranslation(p.x,p.y,p.z); } shafts.setMatrixAt(i,mt); } } shafts.frustumCulled=false; shafts.visible=false; g.add(shafts);
  // the projector bank on the fixed grid, aimed at the gauze. Their throw shows in the haze.
  const cones=[], cg=new T.CylinderGeometry(.12,1,1,4,1,true); cg.translate(0,-.5,0); cg.rotateY(Math.PI/4);
  const bank=[]; for(let i=-2;i<=2;i++) bank.push([pol(i*14*D2R,14.3,10.6),pol(i*13*D2R,17.4,Y0+3.8),5.6]);
  for(const [p,q,sz] of bank){ const dir=q.clone().sub(p), len=dir.length(); dir.normalize(); const piv=new T.Group(); piv.position.copy(p); piv.quaternion.setFromUnitVectors(_dn,dir); g.add(piv);
    const m=beamMat(0xdfe8ff), cone=new T.Mesh(cg,m); cone.scale.set(sz,len,sz*.6); piv.add(cone); const f=flare(0xdfe8ff,.8); piv.add(f); cones.push({m,f});
    const hold=new T.Group(); hold.position.copy(p); hold.quaternion.setFromRotationMatrix(new T.Matrix4().lookAt(q,p,YAX)); g.add(hold); sock('projector',hold,0,0,0,Math.PI,false,1); const yoke=new T.Mesh(new T.BoxGeometry(.08,ROOM_H-1.5-p.y,.08),M.truss); yoke.position.set(p.x,(ROOM_H-1.5+p.y)/2,p.z); g.add(yoke); }
  const fog=lowFog(ringSector(14.2,23,-44*D2R,44*D2R,Y0+.45),0xcfe6ff); g.add(fog.mesh); const fog2=lowFog(ringSector(14.6,22,-42*D2R,42*D2R,Y0+.95),0xcfe6ff); g.add(fog2.mesh);
  const fans=[]; for(const a of [-36,-22,-8,8,22,36]){ const p=pol(a*D2R,shellR(a*D2R,H)-.6,Y0+H-.2), f=laserFan(g,p.x,p.y,p.z,'#27d3c2',34,.9,40); f.a=a*D2R; fans.push(f); }
  const _r=new T.Quaternion();
  st.anim.push((t,dt,F)=>{ const mv=REDUCED?0:1, q=cue([18,18,18,18]), open=smooth(stageOpen(3)), fire=t-FXFIRE.t<5&&F>.5, k=SHOW.dim*(.2+.8*F)*open;
    HOLO.u.uT.value=t; HOLO.u.uOn.value=k*(q.i===3?.5:1); HOLO.u.uC.value.copy(SHOW.c2).lerp(CW,.35); HOLO.u.uC2.value.copy(SHOW.c).lerp(CW,.2); GZ.uT.value=t; GZ.uOn.value=open; TL.uT.value=t; TL.uOn.value=k*S.ledK; TL.uC.value.copy(SHOW.c).lerp(CW,.25);
    globe.rotation.y+=dt*.3*mv; { const BL=window.BALL||{on:true,a:-11,r:22.3,y:6.0,s:.9};   /* v23i: his note, back where he liked it, by NOCHE; NOCHE now sits 1.5 m in front of it, so the ball shows behind the letters */   /* v23h: off NOCHE's line, over the angel's side and higher: front to back, angel, ball, wall */ globe.position.copy(pol((BL.a??-11)*D2R,BL.r??21.2,Y0+(BL.y??6.0)+Math.sin(t*.4)*.3*mv)); const gk=FILM.on?smooth(clamp((FILM.t-35.7)/1.2,0,1))*(1-smooth(clamp((FILM.t-74.4)/1.0,0,1))):1;   /* v23i: and off again at the end, with NOCHE (74.4-75.4) */ globe.scale.setScalar((BL.s??1)*Math.max(.001,gk)); globe.visible=!!BL.on&&gk>.002; }   /* v23g: his note, the globe is off for the start of the show; it grows in with the angel's beam (35.7-36.9) */   /* v23d: his note, the ball comes back, moved upstage (r 22.3, was 21.2) and a touch smaller so its rings clear the back wall; window.BALL overrides for previews */   /* v23: his call, the angel's arrival replaces the wire ball */ shafts.visible=!!window.__holoGiant; SHAFT.color.setRGB(.25,.85,1).multiplyScalar(k*(.55+.45*Math.pow(Math.max(0,Math.sin(t*1.7)),6)));
    cubes.forEach((c,i)=>{ const a=c.a+Math.sin(t*.2+c.ph)*.05*mv; c.c.position.copy(pol(a,19.2+Math.sin(t*.3+c.ph)*.6,Y0+2.2+i*.6+Math.sin(t*.5+c.ph)*.5*mv)); c.c.rotation.x+=dt*.5*mv; c.c.rotation.y+=dt*.7*mv; c.c.material.opacity=.8*k; c.c.visible=q.i!==0&&!window.__holoGiant; });
    if(HOLO.mixer){ if(HOLO.seq) HOLO.seq(dt*mv); HOLO.mixer.update(dt*mv); HOLO.fig.visible=q.i!==2||!!window.__holoGiant; if(HOLO.rig) HOLO.rig(t,HOLO.u.uOn.value,HOLO.fig.visible&&k>.01); }
    const fk=REDUCED?1:.82+.18*Math.sin(t*9.)*Math.sin(t*3.7); for(const c of cones){ c.m.uniforms.uI.value=.05*open*F*fk*(1-.8*S.houseK)*HZ()*(1-(SHOW.turnK||0)); c.f.material.opacity=.75*open*F*(1-(SHOW.turnK||0)); }
    fog.m.uniforms.uT.value=t; fog.m.uniforms.uI.value=open*F*Math.min(1,(.25+.75*S.haze)*(fire?1.6:1)); fog2.m.uniforms.uT.value=t+40; fog2.m.uniforms.uI.value=open*F*S.haze*.5;
    const on=(fire||(window.LX_OFF||window.LX_LASERS)&&(q.i===1||q.i===3))?1:0;   /* v23 lights: lasers only on the big hits (his note: everything looked like a laser) */ fans.forEach((f,i)=>{ f.tgtI=on*F*open*(fire?1.5:1); f.m.uniforms.uP.value=fire?3:q.i===3?2:0; f.m.uniforms.uC.value.copy(i%2?SHOW.c2:SHOW.c).lerp(CW,.15);
      _d.set(Math.sin(t*.23+f.ph)*.55-Math.sin(f.a)*.4,.08+.2*Math.sin(t*.31+f.ph*2),1).normalize(); f.piv.quaternion.setFromUnitVectors(_dn,_d).multiply(_r.setFromAxisAngle(YAX,t*.2*mv+f.ph)); }); });
  st.look='wash'; }
// the giant hologram: a robot performer 7.5 m tall, worked like a marionette. Five strings of glowing tubing run from a flown control bar to its head,
// hands and knees, with light pulsing up them, and a cage of laser beams frames it from the deck to the bar.
async function loadHoloDancer(){ if(!T.SkeletonUtils||!window.__creature) return;   // the marionette robot is out; the creature replaces it once approved
 const [gltf,tx]=await Promise.all([loadGLB('robot.glb'),texP('robot.jpg')]);
  const mat=new T.MeshBasicMaterial({skinning:true,map:tx,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
  mat.onBeforeCompile=sh=>{ sh.uniforms.uT=HOLO.u.uT; sh.uniforms.uOn=HOLO.u.uOn; sh.uniforms.uC=HOLO.u.uC; sh.uniforms.uC2=HOLO.u.uC2;
    sh.vertexShader='varying vec3 vWp;\n'+sh.vertexShader.replace('#include <project_vertex>','#include <project_vertex>\n vWp=(modelMatrix*vec4(transformed,1.0)).xyz;');
    sh.fragmentShader='uniform float uT,uOn; uniform vec3 uC,uC2; varying vec3 vWp;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{ vec3 V=normalize(cameraPosition-vWp); vec3 Nn=normalize(cross(dFdx(vWp),dFdy(vWp))); float fr=pow(1.-abs(dot(Nn,V)),1.4); float lum=dot(diffuseColor.rgb,vec3(.3,.59,.11)); float seam=smoothstep(.55,.95,diffuseColor.b-diffuseColor.g+.5); float sl=.6+.4*sin(vWp.y*34.-uT*5.); float gl=.9+.1*sin(uT*23.+vWp.y*2.)*sin(uT*5.3); float a=(fr*1.35+.06+lum*.32+seam*.5)*sl*gl*uOn*2.0; gl_FragColor=vec4(mix(uC,uC2,fr*.7+seam*.4)*a+vec3(seam*.35*a),a); }'); };
  const fig=gltf.scene; fig.traverse(o=>{ if(o.isSkinnedMesh){ o.material=mat; o.frustumCulled=false; } });
  const g=ST[3].group, k=3.6, p=pol(0,21.6,STAGE_H+1.0); fig.scale.multiplyScalar(k); fig.position.copy(p); g.add(fig);
  const mixer=new T.AnimationMixer(fig), acts=[]; for(const n of ['a77','a82','a66','a63']){ const a=mixer.clipAction(await animClip(fig,n)); acts.push(a); }
  acts[0].play(); let cur=0, left=acts[0].getClip().duration*2;
  HOLO.seq=dt=>{ left-=dt; if(left>0) return; const nx=(cur+1)%acts.length; acts[nx].reset().play(); acts[cur].crossFadeTo(acts[nx],.6,false); cur=nx; left=acts[nx].getClip().duration*(nx===0?2:1); };
  // the strings: tubes of light from the control bar to the head, hands and knees
  const STR={uT:HOLO.u.uT,uOn:HOLO.u.uOn,uC:HOLO.u.uC,uC2:HOLO.u.uC2};
  const tubeM=new T.ShaderMaterial({uniforms:STR,transparent:true,blending:T.AdditiveBlending,depthWrite:false,vertexShader:UVV,
    fragmentShader:'precision highp float; uniform float uT,uOn; uniform vec3 uC,uC2; varying vec2 vUv; void main(){ float rim=pow(abs(vUv.x*2.-1.),.0001); float core=.35+.65*pow(abs(sin(vUv.x*3.14159)),3.); float p=pow(fract(vUv.y*2.5-uT*.9),8.); float a=(core*.85+p*1.8)*uOn; gl_FragColor=vec4(mix(uC,vec3(1.),.25+p*.5)*a,a); }'});
  const tg=new T.CylinderGeometry(.09,.09,1,10,1,true); tg.translate(0,.5,0);
  const bar=new T.Group(); g.add(bar); const barM=new T.MeshBasicMaterial({color:0xcff8ff,transparent:true,blending:T.AdditiveBlending,depthWrite:false});
  const b1=new T.Mesh(new T.BoxGeometry(4.6,.14,.14),barM), b2=new T.Mesh(new T.BoxGeometry(.14,.14,2.6),barM); bar.add(b1,b2);
  const hook={Head:[0,0,0],LeftHand:[2.3,0,0],RightHand:[-2.3,0,0],LeftLeg:[.9,0,1.3],RightLeg:[-.9,0,1.3]};
  const B={}; fig.traverse(o=>{ if(o.isBone&&hook[o.name]) B[o.name]=o; });
  const strings=Object.keys(hook).filter(n=>B[n]).map(n=>{ const m=new T.Mesh(tg,tubeM); m.frustumCulled=false; g.add(m); const knot=new T.Mesh(new T.SphereGeometry(.13,12,8),barM); g.add(knot); return {n,m,knot,h:new T.Vector3(...hook[n])}; });
  // the laser cage: beams from emitters in the deck converge on the bar, and a line of light crosses the deck in front of the robot
  const LZ=new T.MeshBasicMaterial({color:0x7a5cff,transparent:true,opacity:.8,blending:T.AdditiveBlending,depthWrite:false}); const lg=new T.CylinderGeometry(.018,.018,1,6,1,true); lg.translate(0,.5,0);
  const lasers=[]; for(const [a,r] of [[-17,18.6],[17,18.6],[-11,23.0],[11,23.0],[-24,21.2],[24,21.2],[-6,18.2],[6,18.2]]){ const m=new T.Mesh(lg,LZ); m.frustumCulled=false; g.add(m); lasers.push({m,o:pol(a*D2R,r,STAGE_H+.05)}); }
  for(const z of [18.4,18.9]){ const a=pol(-20*D2R,z,STAGE_H+.08), b=pol(20*D2R,z,STAGE_H+.08); const m=new T.Mesh(lg,LZ); m.position.copy(a); const d=b.clone().sub(a); m.quaternion.setFromUnitVectors(YAX,d.clone().normalize()); m.scale.set(1.4,d.length(),1.4); g.add(m); lasers.push({m,fix:true}); }
  const extra=[bar,...strings.flatMap(s=>[s.m,s.knot]),...lasers.map(l=>l.m)]; for(const o of [fig,...extra]) o.traverse(c=>c.layers.enable(2));
  const _w=new T.Vector3(), _b=new T.Vector3(), _q=new T.Quaternion(), hb=fig.getObjectByName('Hips');
  HOLO.rig=(t,on,vis)=>{ for(const o of extra) o.visible=vis; if(!vis) return; fig.updateMatrixWorld(true); g.updateMatrixWorld(true);
    const hx=hb?g.worldToLocal(hb.getWorldPosition(_w)).x:0; bar.position.set(hx*.6+Math.sin(t*.7)*.25,STAGE_H+10.9+Math.sin(t*1.1)*.15,-21.6); bar.rotation.set(Math.sin(t*.9)*.08,Math.sin(t*.4)*.12,Math.sin(t*1.3)*.1); bar.updateMatrixWorld(true);
    for(const s of strings){ const a=bar.localToWorld(_b.copy(s.h)); g.worldToLocal(a); const e=g.worldToLocal(B[s.n].getWorldPosition(_w)); const d=a.clone().sub(e), L=d.length(); s.m.position.copy(e); s.m.quaternion.setFromUnitVectors(YAX,d.multiplyScalar(1/L)); s.m.scale.set(1,L,1); s.knot.position.copy(a); }
    const bw=bar.position, pulse=FILM.on?Math.min(1,musicPulse()*.8+hitPulse()):.6+.4*Math.pow(Math.max(0,Math.sin(t*3.1)),4);
    LZ.color.copy(HOLO.u.uC2.value).lerp(CW,.15).multiplyScalar(on*(.35+.65*pulse)); barM.color.copy(HOLO.u.uC.value).lerp(CW,.5).multiplyScalar(on);
    for(const l of lasers){ if(l.fix) continue; const d=bw.clone().sub(l.o), L=d.length(); l.m.position.copy(l.o); l.m.quaternion.setFromUnitVectors(YAX,d.multiplyScalar(1/L)); l.m.scale.set(1,L,1); } };
  HOLO.mixer=mixer; HOLO.fig=fig; HOLO.ready=true; }

CAT.cur='rig';
// ================= CLUB NIGHT =================
// The seating wagons roll out, the turntable is a dance floor and the booth stands on the thrust. The screens carry a machine far larger than
// the picture can hold; lasers hang from the two inner rings and turn with them.
const CLUB={fans:[],crowd:[],loading:null};
for(let i=0;i<6;i++){ const a=i/6*TAU, p=pol(a,RING_B.r-.3,RING_B.y-.3), f=laserFan(ringB,p.x,p.y,p.z,'#8a5cff',22,1.1,40); f.a=a; CLUB.fans.push(f); }
for(let i=0;i<4;i++){ const a=(i+.5)/4*TAU, p=pol(a,RING_C.r-.25,RING_C.y-.3), f=laserFan(ringC,p.x,p.y,p.z,'#35e0ff',20,1.3,34); f.a=a; CLUB.fans.push(f); }
// a ring of twelve cryo jets round the edge of the dance floor, fired on the drop
CLUB.cryo=[]; for(let i=0;i<12;i++){ const a=(i+.5)/12*TAU, p=pol(a,12.9,0); if(Math.abs(p.x)<3&&p.z<-11) continue; CLUB.cryo.push(jet(clubKit,p.x,.42,p.z,7.5,2.2,0xe6f3ff)); sock('cryojet',clubKit,p.x,0,p.z,a,false,1); }
function bakeAt(root,sm,clip,time){ const tmp=new T.Scene(); tmp.add(root); const mixer=new T.AnimationMixer(root), act=mixer.clipAction(clip); act.play(); mixer.setTime(time); tmp.updateMatrixWorld(true); sm.skeleton.update();
  const hips=sm.skeleton.bones.find(b=>b.name==='Hips'), hp=new T.Vector3().setFromMatrixPosition(hips.matrixWorld), src=sm.geometry, cnt=src.attributes.position.count, out=new Float32Array(cnt*3), v=new T.Vector3(); let lo=1e9;
  for(let i=0;i<cnt;i++){ sm.boneTransform(i,v); v.applyMatrix4(sm.matrixWorld); out[i*3]=v.x-hp.x; out[i*3+1]=v.y; out[i*3+2]=v.z-hp.z; lo=Math.min(lo,v.y); } for(let i=0;i<cnt;i++) out[i*3+1]-=lo;
  act.stop(); mixer.uncacheRoot(root); tmp.remove(root); const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(out,3)); geo.setAttribute('uv',src.attributes.uv); geo.setIndex(src.index); geo.computeVertexNormals(); return geo; }
// The club crowd dances. Six routines are baked off the dancer rigs as short flip-books of the whole body (24 poses a loop); each group of the
// crowd plays one, blended pose to pose, at its own point in the loop, so the floor moves instead of standing in a pose. Clothes take a colour each.
function crowdMat(tx,noMorph){ const m=new T.MeshStandardMaterial({map:tx,roughness:.8,metalness:0,envMapIntensity:.4,emissive:0x16141c,morphTargets:!noMorph,morphNormals:!noMorph});
  m.onBeforeCompile=sh=>{ sh.fragmentShader=sh.fragmentShader.replace('#include <color_fragment>','').replace('#include <map_fragment>',`#ifdef USE_MAP
  vec4 texelColor=texture2D(map,vUv); texelColor=mapTexelToLinear(texelColor);
  float mxc=max(texelColor.r,max(texelColor.g,texelColor.b)), mnc=min(texelColor.r,min(texelColor.g,texelColor.b)), sat=(mxc-mnc)/max(mxc,.001), lum=dot(texelColor.rgb,vec3(.299,.587,.114));
  float cloth=smoothstep(.5,.66,lum)*(1.-smoothstep(.1,.24,sat));
  #ifdef USE_COLOR
  texelColor.rgb=mix(texelColor.rgb,vColor*(.2+.85*lum),cloth);
  #endif
  diffuseColor*=texelColor;
#endif`); }; m.customProgramCacheKey=()=>'crowd'; return m; }
function bakeLoop(root,sm,clip,F){ const tmp=new T.Scene(); tmp.add(root); const mixer=new T.AnimationMixer(root), act=mixer.clipAction(clip); act.play(); const src=sm.geometry, cnt=src.attributes.position.count, v=new T.Vector3(), hips=sm.skeleton.bones.find(b=>b.name==='Hips'), hp=new T.Vector3(), P=[], N=[];
  const g=new T.BufferGeometry(); g.setIndex(src.index); g.setAttribute('uv',src.attributes.uv); let lo0=null;
  for(let f=0;f<F;f++){ mixer.setTime(clip.duration*f/F); tmp.updateMatrixWorld(true); sm.skeleton.update(); hp.setFromMatrixPosition(hips.matrixWorld); const out=new Float32Array(cnt*3); let lo=1e9;
    for(let i=0;i<cnt;i++){ sm.boneTransform(i,v); v.applyMatrix4(sm.matrixWorld); out[i*3]=v.x-hp.x*.6; out[i*3+1]=v.y; out[i*3+2]=v.z-hp.z*.6; lo=Math.min(lo,v.y); } if(lo0===null) lo0=lo; for(let i=0;i<cnt;i++) out[i*3+1]-=Math.min(lo,lo0+.25);   // feet stay on the floor; a jump still leaves it
    const pa=new T.BufferAttribute(out,3); g.setAttribute('position',pa); g.computeVertexNormals(); P.push(pa); N.push(g.attributes.normal.clone()); }
  act.stop(); mixer.uncacheRoot(root); tmp.remove(root); return {P,N,index:src.index,uv:src.attributes.uv,dur:clip.duration,F}; }
// t22. The crowd now moves at full frame rate: each routine runs on a few real skeletons (at different points in the loop), their bone
// matrices go into one small texture a frame, and every dancer on the floor is an instance that skins itself from its skeleton's row in
// the GPU. Same bought models, same library moves, no flip-book; about 190 people, a clear place for the tour on the centre line.
function crowdSkinMat(tx,btex,nb,rows){ const m=crowdMat(tx,true), pre=m.onBeforeCompile;
  m.onBeforeCompile=sh=>{ pre(sh); sh.uniforms.uBones={value:btex}; sh.uniforms.uBW={value:nb*4}; sh.uniforms.uBH={value:rows};
    sh.vertexShader='uniform highp sampler2D uBones; uniform float uBW; uniform float uBH; attribute vec4 skinIndex; attribute vec4 skinWeight; attribute float aSkel;\nmat4 cBone(float i){ float x=i*4., y=(aSkel+.5)/uBH; return mat4(texture2D(uBones,vec2((x+.5)/uBW,y)),texture2D(uBones,vec2((x+1.5)/uBW,y)),texture2D(uBones,vec2((x+2.5)/uBW,y)),texture2D(uBones,vec2((x+3.5)/uBW,y))); }\n'+sh.vertexShader
      .replace('#include <skinbase_vertex>','mat4 cSk=skinWeight.x*cBone(skinIndex.x)+skinWeight.y*cBone(skinIndex.y)+skinWeight.z*cBone(skinIndex.z)+skinWeight.w*cBone(skinIndex.w);')
      .replace('#include <skinnormal_vertex>','objectNormal=normalize((cSk*vec4(objectNormal,0.)).xyz);')
      .replace('#include <skinning_vertex>','transformed=(cSk*vec4(transformed,1.)).xyz;'); };
  m.customProgramCacheKey=()=>'crowdskin'; return m; }
const CROWD_MOVES=[['dancer-f2',['a64','a66','a65']],['dancer-m2',['a84','a65','a405']]];   /* Meshy library: All Night Dance, Boom Dance, Bass Beats / You Groove, Bass Beats, Joyful Dance with Hand Sway */
function loadCrowd(){ if(CLUB.loading) return CLUB.loading; return CLUB.loading=(async()=>{ const spots=[], rnd=n=>h01(n*1.37+3.1); CLUB.groups=[]; CLUB.players=[];
  for(let i=0;i<900&&spots.length<190;i++){ const r=Math.sqrt(rnd(i))*12.2, a=rnd(i+2000)*TAU, x=Math.sin(a)*r, z=Math.cos(a)*r; if(z<-9.6||Math.hypot(x,z-(-12))<3.4) continue; if(Math.hypot(x,z-4.2)<1.7) continue; if(spots.some(s=>Math.hypot(s.x-x,s.z-z)<.75)) continue; spots.push({x,z}); }
  const tint=new T.Color(), mt=new T.Matrix4(), q=new T.Quaternion(), e=new T.Euler(), p=new T.Vector3(), sc=new T.Vector3(), PAL=[0x18181c,0xe8e4dc,0xc22a3a,0x2a4fc2,0xd9a441,0x7a3fd0,0x1f8a6a,0xd0508a,0x3a3a44,0xf2efe8];
  for(const [mi,[name,clips]] of CROWD_MOVES.entries()){ const [gltf,tx]=await Promise.all([loadGLB(name+'.glb'),texP(name+'.jpg')]); let sm0=null; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) sm0=o; }); if(!sm0) continue;
    const nb=sm0.skeleton.bones.length, PH=3, dj=name==='dancer-m2', rows=clips.length*PH+(dj?1:0), data=new Float32Array(nb*16*rows);
    const btex=new T.DataTexture(data,nb*4,rows,T.RGBAFormat,T.FloatType); btex.minFilter=btex.magFilter=T.NearestFilter; btex.generateMipmaps=false; btex.needsUpdate=true;
    const mat=crowdSkinMat(tx,btex,nb,rows), G=sm0.geometry;
    const geoFor=sk=>{ const g=new T.BufferGeometry(); for(const k of ['position','normal','uv','skinIndex','skinWeight']) g.setAttribute(k,G.attributes[k]); g.setIndex(G.index); g.setAttribute('aSkel',new T.InstancedBufferAttribute(new Float32Array(sk),1)); return g; };
    const player=async(cn,row,ph,rate)=>{ const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const clip=await motionClip(root,cn), mixer=new T.AnimationMixer(root), act=mixer.clipAction(clip); act.play(); mixer.update(ph*clip.duration);
      CLUB.players.push({root,sm,mixer,row,rate,data,btex,nb}); };
    const live=[]; let row=0; for(const cn of clips) for(let k=0;k<PH;k++,row++){ try{ await player(cn,row,(k+h01(row*3.7+mi))/PH,.95+.1*h01(row*5.1+mi)); live.push(row); }catch(er){} await new Promise(r=>setTimeout(r,0)); }
    if(live.length){ const mine=spots.filter((s,i)=>i%2===mi), im=new T.InstancedMesh(geoFor(mine.map((s,i)=>live[Math.floor(rnd(i*11+mi*7)*live.length)])),mat,mine.length);
      mine.forEach((s,i)=>{ const k=.94+.1*rnd(i+mi*50); q.setFromEuler(e.set(0,Math.atan2(-s.x,-12.3-s.z)+(rnd(i*7+mi)-.5)*1.1,0)); mt.compose(p.set(s.x,.02,s.z),q,sc.set(k,k,k)); im.setMatrixAt(i,mt); im.setColorAt(i,tint.setHex(PAL[Math.floor(rnd(i*13+mi*7)*PAL.length)])); });
      im.frustumCulled=false; clubKit.add(im); CLUB.crowd.push(im); }
    if(dj){ try{ await player('a415',row,0,1); const d=new T.InstancedMesh(geoFor([row]),mat,1); d.setMatrixAt(0,new T.Matrix4()); d.setColorAt(0,tint.setHex(0x18181c)); d.frustumCulled=false; d.position.set(0,.3,-.5); CLUBH.booth.add(d); CLUB.dj=d; }catch(er){} }   /* the DJ in black: Happy Sway Standing (Meshy library) until the bought DJ moves are in */ }
  for(const im of CLUB.crowd) im.visible=S.people; FOLD.dirty=true; })(); }
// every frame the club is up: run the skeletons and write their bones into the textures
function crowdUpdate(t){ if(CLUBH.key){ const on=clubKit.visible; CLUBH.key.intensity=on?4.2:0; if(on){ const bt=t/BEAT, pl=Math.pow(1-(bt%1),2); CLUBH.back.material.opacity=.45+.4*pl; CLUBH.back.material.color.setHSL((.78+.12*Math.sin(t*.21))%1,.85,.55); } }
  if(!CLUB.players||!clubKit.visible){ CLUB.lt=t; return; } const dt=clamp(t-(CLUB.lt===undefined?t:CLUB.lt),0,.1); CLUB.lt=t; if(CLUB.dj) CLUB.dj.visible=!(typeof HOST!=='undefined'&&HOST.dj);
  const up=new Set(); for(const P of CLUB.players){ P.mixer.update(REDUCED?0:dt*P.rate); P.root.updateMatrixWorld(true); P.sm.skeleton.update(); P.data.set(P.sm.skeleton.boneMatrices,P.row*P.nb*16); up.add(P.btex); }
  for(const b of up) b.needsUpdate=true; }

// ================= ROOM SETUPS: the house folds away =================
// One room, five setups: the raked theatre; a club on a flat floor raised to stage level; a club in a sunken pit with the DJ on a raised stage and
// stairs up to the entrance; a dinner theatre; a trade show. The seats hide the way an automated system does it (Figueras Mutasub): row by row,
// each seat's back folds onto its cushion, then the whole seat turns over into the floor and the panel on its underside closes flush as floor.
// Then the tiers lower, back rows first. Last, the audience lift sets the floor height.
const ROOMS={theatre:{name:'Theatre, 600 seats',lift:0},club:{name:'Club, flat floor',lift:STAGE_H},pit:{name:'Club, pit',lift:-1.2},dinner:{name:'Dinner theatre',lift:0},trade:{name:'Trade show',lift:STAGE_H}};
const FOLD={k:0,h:0,moving:false,after:null,dirty:true,rake:1,reveal:1,drop:null}, FOLD_T=18, LIFT_V=.14;
LAY.seats.forEach((s,i)=>{ s.idx=i; });
const DROPF=1.5;   /* v21: each seat takes a second and a half to fold up out of the floor, so the mechanism reads */
const DROPD=LAY.seats.map((s,i)=>(s.row||0)*.2+Math.abs(s.x)*.035+(s.vip?0:.25));   // row by row from the front, opening out from the centre aisle          // when each seat lands in the tour, spread over about six seconds
const bounceOut=x=>{ const n=7.5625, d=2.75; if(x<1/d) return n*x*x; if(x<2/d) return n*(x-=1.5/d)*x+.75; if(x<2.5/d) return n*(x-=2.25/d)*x+.9375; return n*(x-=2.625/d)*x+.984375; };
const _fm=new T.Matrix4(), _fq=new T.Quaternion(), _fe=new T.Euler(), _fp=new T.Vector3(), _f1=new T.Vector3(1,1,1), _fx=new T.Matrix4(), _fs=new T.Matrix4();
const FIXR=row=>typeof UNDER!=='undefined'&&UNDER===4&&rowStart(row)>=CTRL.r0-.01;   /* t23 option 1: the back rows never fold or lower */
const foldOf=row=>{ if(FIXR(row)) return 0; const n=LAY.rows.length; return clamp((FOLD.k-row/n*.42)/.3,0,1); };
const lowerOf=row=>{ if(FIXR(row)) return 0; const n=LAY.rows.length; return smooth(clamp((FOLD.k-.74-(n-1-row)/n*.12)/.14,0,1)); };
const rowY=row=>LAY.rows[row].y*(1-lowerOf(row))*FOLD.rake;
const coverGeo=new T.BoxGeometry(1,.03,1), coverMat=carpetMat(1);
function applyFold(){ const k=FOLD.k, h=FOLD.h, N=LAY.seats.length;
  for(const im of seating.children.slice()){ const U=im.userData; if(!im.isInstancedMesh||!U.list||U.aud||U.isCover) continue;
    if(!U.cover&&U.list[0]&&U.list[0].row!==undefined&&!U.off){ const cv=new T.InstancedMesh(coverGeo,coverMat,U.list.length); cv.frustumCulled=false; cv.userData.isCover=true; cv.receiveShadow=true; seating.add(cv); U.cover=cv; }
    U.list.forEach((s,n)=>{ const row=s.row===undefined?0:s.row, f=foldOf(row), a=smooth(clamp(f/.4,0,1)), b=smooth(clamp((f-.4)/.6,0,1)), y=rowY(row);
      let shown=!(FOLD.drop!==null&&s.idx===undefined), yd=0, a2=a, b2=b; if(FOLD.drop!==null&&s.idx!==undefined){ if(TOUR.step!==2) shown=false; else { const p=clamp((FOLD.drop-DROPD[s.idx])/DROPF,0,1), f2=1-p; a2=smooth(clamp(f2/.4,0,1)); b2=smooth(clamp((f2-.4)/.6,0,1)); } }   /* in the tour they fold out of the floor, seat by seat */
      _fq.setFromEuler(_fe.set(0,s.psi,0)); _fm.compose(_fp.set(s.x,y+yd+(U.off||0)*(1-b),s.z),_fq,_f1); if(!shown) _fm.compose(_fp.set(s.x,y,s.z),_fq,new T.Vector3(1e-4,1e-4,1e-4));
      if(b2>0) _fm.multiply(_fx.makeRotationX(Math.PI*b2)); if(a2>0) _fm.multiply(_fs.makeScale(1,1-.48*a2,1)); if(U.fix) _fm.multiply(U.fix); im.setMatrixAt(n,_fm);
      if(U.cover){ const w=s.vip?.8:.56, d=s.vip?1.15:.84; _fm.compose(_fp.set(s.x,y,s.z),_fq,_f1); _fm.multiply(_fx.makeRotationX(Math.PI*b2)); _fm.multiply(_fs.makeTranslation(0,-.026,0)); _fm.multiply(_fx.makeScale(w,1,d)); U.cover.setMatrixAt(n,_fm); } });
    im.instanceMatrix.needsUpdate=true; if(U.cover){ U.cover.instanceMatrix.needsUpdate=true; U.cover.visible=k>.001||(FOLD.drop!==null&&TOUR.step===2); } }
  for(const T_ of TIERS){ const sc=Math.max(.001,(1-lowerOf(T_.row))*FOLD.rake); T_.m.scale.y=sc; T_.m.visible=sc>.002; }
  disc.position.y=h; const th=STAGE_H-h; front.scale.y=Math.max(.001,th/STAGE_H); front.visible=th>.002&&TOUR.show.front!==false; for(const c of disc.children) if(c.userData.edge) c.visible=k<.01;
  aisleKit.visible=k<.01&&FOLD.rake>.99; for(const c of seating.children) if(c.userData.cam) c.visible=k<.01&&(!TOUR.on||!!TOUR.cams); marker.visible=marker.visible&&k<.01;
  if(typeof SCIS!=='undefined') for(const s_ of SCIS) s_.update();   /* t23: the scissor lifts and their glass follow each row up and down */
  const done=k>.999, club=S.room==='club'||S.room==='pit';
  for(const im of AUD.meshes) im.visible=S.people&&k<.01&&!TOUR.on; clubKit.visible=done&&club; for(const im of CLUB.crowd) im.visible=S.people&&done&&club; if(CLUBH.booth) CLUBH.booth.position.y=th; CLUBH.stairs.visible=done&&S.room==='pit'; CLUBH.stairs.scale.y=Math.max(.001,th/2.2);
  KITS.dinner.visible=done&&S.room==='dinner'; KITS.trade.visible=done&&S.room==='trade'; KITS.floor.visible=done&&S.room!=='theatre'&&!club;
  if(typeof AUD!=='undefined') audSync(); shadowsDirty(); }
function updateFold(dt){ const R=ROOMS[S.room]||ROOMS.theatre, kT=S.room==='theatre'?0:1, pk=FOLD.k, ph=FOLD.h, dk=dt/FOLD_T*(REDUCED?50:TOUR.on||TOUR.fast?4.6:1), dh=dt*LIFT_V*(REDUCED?50:TOUR.on||TOUR.fast?2.5:1);
  const moveK=to=>{ FOLD.k=clamp(FOLD.k+clamp(to-FOLD.k,-dk,dk),0,1); }, moveH=to=>{ FOLD.h+=clamp(to-FOLD.h,-dh,dh); };
  if(kT===0){ if(Math.abs(FOLD.h)>.0005) moveH(0); else { FOLD.h=0; moveK(0); } } else if(FOLD.k<1){ if(Math.abs(FOLD.h)>.0005) moveH(0); else { FOLD.h=0; moveK(1); } } else moveH(R.lift);
  FOLD.moving=FOLD.k!==pk||FOLD.h!==ph; if(FOLD.moving||FOLD.dirty){ FOLD.dirty=false; applyFold(); } if(!FOLD.moving&&FOLD.after){ const f=FOLD.after; FOLD.after=null; f(); } }
// the kits each setup brings in, on the turntable
const KITS={dinner:new T.Group(),trade:new T.Group(),floor:null}; disc.add(KITS.dinner); disc.add(KITS.trade); KITS.dinner.visible=KITS.trade.visible=false;
{ const fl=new T.Mesh(new T.CircleGeometry(R_DISC-.05,96),new T.MeshStandardMaterial({map:tex('tex-wood.jpg',9),color:0x3a322a,roughness:.45,metalness:.05,envMapIntensity:.6})); fl.rotation.x=-Math.PI/2; fl.position.y=.012; fl.receiveShadow=true; fl.visible=false; disc.add(fl); KITS.floor=fl; }
KITS.tables=[]; for(const [r,n,o] of [[3.4,6,.5],[7.0,12,0],[10.6,17,.3]]) for(let i=0;i<n;i++){ const a=(i+o)/n*TAU, x=Math.sin(a)*r, z=-Math.cos(a)*r; if(Math.abs(x)<2.2&&z<-5) continue; KITS.tables.push([x,z]); }
KITS.booths=[]; for(const [x,ry] of [[-10.5,-Math.PI/2],[-7.5,Math.PI/2],[-1.5,-Math.PI/2],[1.5,Math.PI/2],[7.5,-Math.PI/2],[10.5,Math.PI/2]]) for(let z=-9;z<=9.1;z+=3){ if(Math.hypot(Math.abs(x)+1.5,Math.abs(z)+1.5)>13.1) continue; if(Math.abs(x)<3&&z<-7) continue; KITS.booths.push([x,z,ry]); }
const KITLOAD={};
function loadKit(name){ if(KITLOAD[name]) return KITLOAD[name]; return KITLOAD[name]=(async()=>{ if(name==='dinner'){ const P=await loadProp('banquet',3.0,{axis:'x',rough:.6,metal:.2}); const im=new T.InstancedMesh(P.geo,P.mat,KITS.tables.length), mt=new T.Matrix4(); KITS.tables.forEach(([x,z],i)=>{ mt.compose(new T.Vector3(x,.012,z),new T.Quaternion().setFromEuler(new T.Euler(0,i*.7,0)),new T.Vector3(1,1,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; im.castShadow=true; KITS.dinner.add(im); }
  else { const P=await loadProp('boothshow',3.0,{axis:'x',pre:new T.Matrix4().makeScale(1,3.23,1.96),rough:.6,metal:.2}); const im=new T.InstancedMesh(P.geo,P.mat,KITS.booths.length), mt=new T.Matrix4(); KITS.booths.forEach(([x,z,ry],i)=>{ mt.compose(new T.Vector3(x,.012,z),new T.Quaternion().setFromEuler(new T.Euler(0,ry,0)),new T.Vector3(1,1,1)); im.setMatrixAt(i,mt); }); im.frustumCulled=false; im.castShadow=true; KITS.trade.add(im); } shadowsDirty(); })(); }
let seatBefore=null;
function fromStageView(){ V.r=12.6; V.ph=1.33; V.th=Math.PI-S.discA; V.tgt.set(0,1.2,0); V.fov=56; setView('room'); }       // stand on the stage and look back at the house
function setRoom(id){ const was=S.room; if(id===was) return; S.room=id; S.club=id==='club'||id==='pit';
  if(S.club){ S.footage='v-led'; if(S.people) loadCrowd().catch(()=>{}); } else if(was==='club'||was==='pit') S.footage='v-gold'; const sel=$('#footage'); if(sel) sel.value=S.footage; setFootage();
  if(id==='dinner'||id==='trade') loadKit(id).catch(()=>{});
  if(typeof V!=='undefined'&&!TOUR.on){ if(was==='theatre'&&V.mode==='seat') seatBefore=V.seat; fromStageView();
    FOLD.after=S.club?()=>sit({x:0,y:.45,z:5.2,psi:0}):id==='theatre'?()=>{ if(seatBefore) sit(seatBefore); }:()=>{ V.r=36; V.ph=.85; V.th=Math.PI-S.discA+.4; V.tgt.set(0,0,0); setView('room'); }; }
  FOLD.dirty=true; }
function setClub(on){ setRoom(on?'club':'theatre'); }
function updateFx(t,dt){ for(const j of FX.jets){ j.b+=clamp(j.tgt-j.b,-dt*2.2,dt*5); j.m.uniforms.uB.value=j.b*(j.pm?.55:1); j.m.uniforms.uT.value=t; if(j.pm){ j.pm.uniforms.uOn.value=j.b; j.pm.uniforms.uT.value=t; } }
  const F=Math.max(feat(8)*(clubKit.visible?1:0),S.ringLz||0), _r=updateFx.q||(updateFx.q=new T.Quaternion()); const fire=t-FXFIRE.t<4, bt=t/BEAT, drop=S.club&&S.fxAuto&&FOLD.k>.97&&!REDUCED&&(bt%32)<2; CLUB.cryo.forEach((j,i)=>{ j.tgt=S.club&&FOLD.k>.97&&(fire&&t-FXFIRE.t<2.6||drop)?1:0; }); CLUB.fans.forEach((f,i)=>{ f.tgtI=F*(fire?1.6:1); f.m.uniforms.uP.value=fire?3:(Math.floor(t/8)+i)%4; f.m.uniforms.uC.value.copy(i%2?SHOW.c2:SHOW.c);
    _d.set(Math.sin(f.a)*.5+Math.sin(t*.37+f.ph)*.5,-1,-Math.cos(f.a)*.5+Math.cos(t*.29+f.ph)*.5).normalize(); f.piv.quaternion.setFromUnitVectors(_dn,_d).multiply(_r.setFromAxisAngle(YAX,t*.3+f.ph)); });
  for(const f of FX.fans){ f.I=(f.I||0)+clamp((f.tgtI||0)-(f.I||0),-dt*2,dt*2); f.m.uniforms.uI.value=f.I*(.25+1.6*S.haze)*(1-.7*S.houseK)*.9; f.m.uniforms.uT.value=t; f.piv.visible=f.I>.01; } }

CAT.cur='stages';
// ================= LIGHT ON THE FLOOR: every overhead beam lands as a pool on the stage =================
const gobo=(()=>{ const c=document.createElement('canvas'); c.width=c.height=64; const x=c.getContext('2d'), rg=x.createRadialGradient(32,32,2,32,32,32); rg.addColorStop(0,'rgba(255,255,255,.9)'); rg.addColorStop(.55,'rgba(255,255,255,.5)'); rg.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=rg; x.fillRect(0,0,64,64);
  const g=new T.CircleGeometry(1,24); g.rotateX(-Math.PI/2); const im=new T.InstancedMesh(g,new T.MeshBasicMaterial({map:new T.CanvasTexture(c),blending:T.AdditiveBlending,transparent:true,depthWrite:false}),SPOTS.length);
  im.instanceColor=new T.BufferAttribute(new Float32Array(SPOTS.length*3),3); im.frustumCulled=false; im.renderOrder=3; scene.add(im); return im; })();
const _gp=new T.Vector3(), _gq=new T.Quaternion(), _gm=new T.Matrix4(), _gs=new T.Vector3(), _gi=new T.Quaternion(), _gc=new T.Color();
function updateGobos(){ const hz=1/HZ(); SPOTS.forEach((b,i)=>{ b.piv.getWorldPosition(_gp); b.piv.getWorldQuaternion(_gq); _d.set(0,-1,0).applyQuaternion(_gq); let s=0;
    if(_d.y<-.2){ const t=(_gp.y-STAGE_H-.02)/-_d.y; _gp.addScaledVector(_d,t); const r=Math.hypot(_gp.x,_gp.z); if(r>R_DISC+.3&&r<R_OUT-.3) s=.5+t*.085; }
    _gm.compose(_gp,_gi,_gs.set(s,1,s)); gobo.setMatrixAt(i,_gm); const I=Math.min(1,b.m.uniforms.uI.value*hz*(b.stage?2.6:1.5)); gobo.setColorAt(i,_gc.copy(b.col).multiplyScalar(I)); });
  gobo.instanceMatrix.needsUpdate=true; gobo.instanceColor.needsUpdate=true; }

function updateStage(k,dt,t,beat){ const st=ST[k], F=feat(k), q=beat*Math.PI, pulse=Math.pow(1-(beat%1),2), show=(1-.8*smooth(S.houseK))*HZ()*SHOW.dim, look=SHOW.cur<4?ST[SHOW.cur].look:'wash';
  for(const b of st.beams){ if(b.kin) continue; let x=0,z=0,I=1; const u=b.u||0, i=b.i, vis=winVis(b.wa);
    switch(look){
      case 'fan':  x=b.top?Math.sin(q/4+u*3)*.75:u*1.7*(.65+.35*Math.sin(q/2)); z=b.top?.5:.3; break;
      case 'chase':x=u*(b.top?.8:.95); z=b.top?.36:.16; I=.15+1.1*Math.pow(Math.max(0,Math.sin(q-i*.95)),2); break;
      case 'rig':  x=Math.sin(q/3+u*5)*.6; z=.3+.2*Math.cos(q/5+i); break;
      default:     x=u*(b.top?.8:.95)+Math.sin(t*.2+i)*.12; z=b.top?.36:.16; }
    if(REDUCED){ x=u*(b.top?.8:.95); z=b.top?.36:.16; I=1; }
    if(b.back) I*=SHOW.cur===3?.25:.7;
    _d.set(x*b.ca-z*b.sa,b.top?-1:1,x*b.sa+z*b.ca).normalize(); b.piv.quaternion.setFromUnitVectors(_dn,_d);
    b.col.copy(FILM.on&&FILM.team?teamCol(st.k):b.alt?SHOW.c2:SHOW.c); b.m.uniforms.uC.value.copy(b.col); b.fl.material.color.copy(b.col);
    const tk=k===2?1:1-(SHOW.turnK||0); b.m.uniforms.uI.value=(.42+.3*pulse)*I*vis*show*tk; b.fl.material.opacity=clamp((.5+.5*pulse)*I,0,1)*vis*tk; }
  st.inner.color.copy(SHOW.c); st.inner.intensity=(1.1+.3*pulse)*(.1+.9*smooth(stageOpen(k)))*SHOW.dim*(SHOW.cur===3?.3:1);
  if(FILM.on&&FILM.team){ st.inner.color.copy(teamCol(st.k)); st.inner.intensity=3.2+.8*pulse; }
  for(const f of st.anim) f(t,dt,F);
  HOVER.u.uT.value=HOVER.ug.uT.value=t; HOVER.u.uOn.value=HOVER.ug.uOn.value=.3+.7*SHOW.dim;
  st.lift.moving=false; const fl=window.__filmLifts, on=fl?!!fl[k]:(S.lift&&S.liftK===k), el=fl?99:t-S.liftT;   // the film raises lifts on any stage it features
  for(const L of st.lifts){ const only=fl&&Array.isArray(fl[k])?fl[k]:null; const tgt=(on&&el>L.delay&&(!only||only.includes(st.lifts.indexOf(L))))||(!on&&el<L.delay&&L.h>0&&S.liftK===k&&false)?L.top:0; if(Math.abs(L.h-tgt)>.001){ L.h+=clamp(tgt-L.h,-dt*.45,dt*.45); st.lift.moving=true; }
    L.g.position.y=STAGE_H+L.h; for(const c of L.legs){ c.scale.y=Math.max(.001,L.h); c.position.y=STAGE_H+L.h/2-.08; c.visible=L.h>.02; } L.sc.scale.y=Math.max(.001,L.h*.92); L.sc.position.y=STAGE_H+L.h*.46-.1; L.sc.visible=L.h>.02; } }

// v20: two cryo jets on the thrust deck, one either side of the centre stair, right behind Tripp on the turntable floor. They fire as he lands
// his hop (film 53.78, the landing of the a417 jump) so the landing sets them off and they frame him.
const TRIPCRYO=[]; for(const sd of [-1,1]){ TRIPCRYO.push(jet(front,sd*1.5,.01,-10.95,6.6,3.9,0xffffff)); TRIPCRYO.push(jet(front,sd*2.05,.01,-10.75,5.6,3.3,0xffffff)); }   /* v23: his note, the burst was thin: two fuller columns a side, wider and denser */   /* v22: one clean column per side, straight out of the floor either side of the foot of the stairs */ for(const j of TRIPCRYO) j.m.uniforms.uG.value=2.1;
const CRYOC={a:new T.Color(0xb48cff),b:new T.Color(0xffc45a),c:new T.Color(),fired:false};   /* v22: lit in the colour of what is behind them as the room comes round: Noche violet into ORO gold */
function tripCryoUpdate(){ const ft=FILM.on?FILM.t:-1, on=ft>=55.02&&ft<56.72; for(const j of TRIPCRYO){ j.tgt=on?1:0; CRYOC.c.copy(CRYOC.a).lerp(CRYOC.b,smooth(clamp((ft-54.87)/2.2,0,1))); j.m.uniforms.uC.value.copy(CRYOC.c).lerp(new T.Color(1,1,1),.25); }
  if(on&&!CRYOC.fired){ CRYOC.fired=true; }   /* the blast and the crack are in the film's music track */ if(!on&&(ft<54.92||ft>57.2)) CRYOC.fired=false; }   /* the blast has its own sound */

await __tick();
// ================= THE REAL MODELS =================
// Every fixture, seat and set piece is a 3D model (made in Meshy, cut and sized in Blender). They load after the room and are instanced onto its sockets.
async function loadProp(name,size,o){ o=o||{}; const opt=u=>texP(u).catch(()=>null), [g,tx,nm,mr]=await Promise.all([loadGLB(name+'.glb'),texP(name+'.jpg'),opt(name+'-n.jpg'),opt(name+'-m.jpg')]); const m=firstMesh(g.scene); m.updateWorldMatrix(true,false);
  const geo=m.geometry.clone().applyMatrix4(m.matrixWorld); if(o.pre) geo.applyMatrix4(o.pre);
  if(size){ geo.computeBoundingBox(); const b=geo.boundingBox, c=b.getCenter(new T.Vector3()), ax=o.axis||'y', s=size/(b.max[ax]-b.min[ax]); geo.translate(-c.x,o.centre?-c.y:-b.min.y,-c.z); geo.scale(s,s,s); }
  const P={map:tx,roughness:o.rough===undefined?.55:o.rough,metalness:o.metal===undefined?.35:o.metal,envMapIntensity:o.env===undefined?1:o.env};
  if(nm){ P.normalMap=nm; P.normalScale=new T.Vector2(o.bump||1,o.bump||1); } if(mr&&!o.velvet){ P.roughnessMap=mr; P.metalnessMap=mr; P.roughness=1; P.metalness=1; }      // the model's own surface: every dent, seam and change of finish
  let mat; if(o.velvet){ try{ mat=new T.MeshPhysicalMaterial(Object.assign(P,{sheen:new T.Color(o.velvet),clearcoat:0})); }catch(e){ mat=new T.MeshStandardMaterial(P); } } else mat=new T.MeshStandardMaterial(P);
  if(o.emissive){ mat.emissive=new T.Color(o.emissive); mat.emissiveMap=tx; mat.emissiveIntensity=o.emI||.5; }
  return {geo,mat}; }
// put one model on every socket of its type; sockets that share a parent share one instanced mesh
function fill(type,P,shadow){ const by=new Map(); for(const s of SOCK[type]||[]){ const key=s.parent===scene?'scene:'+s.cat:s.parent; if(!by.has(key)) by.set(key,{par:s.parent,cat:s.cat,list:[]}); by.get(key).list.push(s.m); }
  for(const {par,cat,list} of by.values()){ const im=new T.InstancedMesh(P.geo,P.mat,list.length); list.forEach((m,i)=>im.setMatrixAt(i,m)); im.frustumCulled=false; if(shadow) im.castShadow=true; im.userData.cat=cat; par.add(im); } }
const ROT_Y=a=>new T.Matrix4().makeRotationY(a);
const FIX={seat:ROT_Y(Math.PI),vip:ROT_Y(Math.PI)};
const JOBS=[
  async()=>{ const P=await loadProp('seat',0,{rough:.8,metal:.05,env:.5,velvet:'#7a1626'}); P.mat.color=new T.Color(0xcfc6c6); seatMeshes.push(onSeats(P.geo,P.mat,LAY.seats.filter(s=>!s.vip),FIX.seat)); shadowsDirty(); },
  async()=>{ const P=await loadProp('vipseat',0,{rough:.75,metal:.05,env:.5,velvet:'#8a1a2c'}); seatMeshes.push(onSeats(P.geo,P.mat,LAY.seats.filter(s=>s.vip),FIX.vip)); shadowsDirty(); },
  async()=>{ const P=await loadProp('sidetable',.6,{rough:.25,metal:.8}); onSeats(P.geo,P.mat,LAY.tables,null);
    const lamp=new T.InstancedMesh(new T.CylinderGeometry(.035,.045,.11,10),glow(0xffd9a0),LAY.tables.length), mt=new T.Matrix4(); LAY.tables.forEach((s,i)=>{ mt.makeTranslation(s.x,s.y+.66,s.z); lamp.setMatrixAt(i,mt); }); lamp.frustumCulled=false; lamp.userData.list=LAY.tables; lamp.userData.off=.66; seating.add(lamp); shadowsDirty(); },   // a small table lamp on each
  async()=>fill('mhead',await loadProp('mhead',.62,{rough:.45,metal:.5})),
  async()=>fill('mwash',await loadProp('mwash',.6,{rough:.45,metal:.5,emissive:'#ffffff',emI:.35})),
  async()=>fill('strobe',await loadProp('strobe',1.0,{axis:'x',rough:.5,metal:.5,emissive:'#ffffff',emI:.3})),
  async()=>fill('blinder',await loadProp('blinder',.6,{rough:.4,metal:.6,emissive:'#ffd9a8',emI:.55})),
  async()=>fill('linearray',await loadProp('linearray',2.7,{rough:.6,metal:.3})),
  async()=>fill('hoist',await loadProp('hoist',.62,{rough:.5,metal:.5})),
  async()=>fill('projector',await loadProp('projector',1.5,{axis:'x',centre:true,rough:.5,metal:.5})),
  async()=>fill('treadmill',await loadProp('treadmill',5.2,{axis:'x',pre:new T.Matrix4().makeScale(1,.45,.8),rough:.6,metal:.4})),
  async()=>fill('djbooth',await loadProp('djbooth',4.2,{axis:'x',rough:.45,metal:.45})),
  async()=>fill('laserhead',await loadProp('laserhead',.42,{axis:'x',centre:true,pre:new T.Matrix4().makeRotationX(Math.PI/2),rough:.4,metal:.6})),
  async()=>fill('cannon',await loadProp('cannon',1.15,{rough:.4,metal:.7})),
  async()=>fill('flameunit',await loadProp('flameunit',.6,{rough:.5,metal:.5})),
  async()=>fill('cryojet',await loadProp('cryojet',.45,{rough:.4,metal:.7})),
  async()=>fill('trampoline',await loadProp('trampoline',3.5,{axis:'x',rough:.6,metal:.3})),
  async()=>fill('climbwall',await loadProp('climbwall',9.0,{rough:.75,metal:.1})),
  // cameras stay out of the audience's way: two cranes at the back corners reaching forward over the side seats, pedestals at the sides and the back
  async()=>{ const P=await loadProp('studiocam',1.75,{rough:.5,metal:.4}); for(const [x,z] of [[-12.0,-1.0],[12.0,-1.0],[0,12.3]]){ const aisle=x===0, mt=aisle?P.mat.clone():P.mat; if(aisle){ mt.emissive=new T.Color(0x8a9098); mt.emissiveMap=P.mat.map||null; mt.emissiveIntensity=.42; } const m=new T.Mesh(P.geo,mt); m.position.set(x,yAt(x,z),z); m.rotation.y=Math.atan2(-x,-17-z); m.castShadow=true; m.userData.cam=true; if(aisle) m.userData.aisleCam=true; seating.add(m);
      if(aisle){ const tl=new T.Mesh(new T.SphereGeometry(.025,8,6),new T.MeshBasicMaterial({color:0xff2a1a})); tl.position.set(0,1.62,.12); m.add(tl); } }   /* v18b: the camera in the centre aisle carries its own low light and a tally lamp, so in the dark it reads as a camera and not as a black lump */ shadowsDirty(); },
  async()=>{ const P=await loadProp('crane',6.4,{axis:'x',rough:.45,metal:.6});
    for(const sx of [-1,1]){ const piv=new T.Group(); piv.position.set(sx*8.6,yAt(sx*8.6,9.3),9.3); piv.userData.cam=true; seating.add(piv); const m=new T.Mesh(P.geo,P.mat); m.position.x=-2.8; piv.add(m); CAMS.push({m:piv,sx,base:-Math.PI/2-sx*.2,ph:sx>0?0:1.7}); } }];
const CAMS=[];
function updateCams(t){ for(const c of CAMS) c.m.rotation.y=c.base+(REDUCED?0:Math.sin(t*.21+c.ph)*.12); }

await __tick();
// ================= THE AUDIENCE: four seated figures modelled and rigged in Meshy =================
// Each figure is posed once into its seat, baked to a plain mesh, and that mesh is instanced across the house. The seat you are sitting in is left empty.
const AUD={meshes:[],loaded:false,loading:null,hid:[]};
function bakeSeated(g,alt){ const tmp=new T.Scene(); tmp.add(g.scene); const mixer=new T.AnimationMixer(g.scene), clip=g.animations[0]; mixer.clipAction(clip).play();
  let sm=null; g.scene.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const bone=n=>sm.skeleton.bones.find(b=>b.name===n), head=bone('Head'), hips=bone('Hips'), hp=new T.Vector3(), hd=new T.Vector3();
  let best=0, score=-1e9, bi=0; const SC=[]; for(let i=0;i<20;i++){ const t=clip.duration*i/20; mixer.setTime(t); tmp.updateMatrixWorld(true); hp.setFromMatrixPosition(hips.matrixWorld); hd.setFromMatrixPosition(head.matrixWorld);
    const sc=(hd.y-hp.y)-1.2*Math.abs(hd.z-hp.z)-.6*Math.abs(hd.x-hp.x); SC.push(sc); if(sc>score){ score=sc; best=t; bi=i; } }                 // the most upright moment of the idle
  if(alt){ let ai=-1, as=-1e9; for(let i=0;i<20;i++){ const d=Math.min(Math.abs(i-bi),20-Math.abs(i-bi)); if(d>=5&&SC[i]>as){ as=SC[i]; ai=i; } } if(ai<0||as<score-.05) return null; best=clip.duration*ai/20; }   // a second pose only if it sits as upright as the first: no one caught bent double
  mixer.setTime(best); tmp.updateMatrixWorld(true); sm.skeleton.update(); hp.setFromMatrixPosition(hips.matrixWorld);
  const src=sm.geometry, cnt=src.attributes.position.count, v=new T.Vector3(); let lo=1e9;
  const grab=()=>{ tmp.updateMatrixWorld(true); sm.skeleton.update(); const o=new Float32Array(cnt*3); for(let i=0;i<cnt;i++){ sm.boneTransform(i,v); v.applyMatrix4(sm.matrixWorld); o[i*3]=v.x-hp.x; o[i*3+1]=v.y; o[i*3+2]=v.z-hp.z; } return o; };
  const out=grab(); for(let i=0;i<cnt;i++) lo=Math.min(lo,out[i*3+1]); for(let i=0;i<cnt;i++) out[i*3+1]-=lo;                // hips over the seat, feet on the floor
  const geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(out,3)); geo.setAttribute('uv',src.attributes.uv); geo.setIndex(src.index); geo.computeVertexNormals();
  // applause: the same figure with the hands brought up in front of the chest, apart (cA) and together (cB)
  let cA=out, cB=out, sA=null, sB=null; try{ const LA=bone('LeftArm'), LF=bone('LeftForeArm'), LH=bone('LeftHand'), RA=bone('RightArm'), RF=bone('RightForeArm'), RH=bone('RightHand'), foot=bone('LeftFoot');
    if(LA&&LF&&LH&&RA&&RF&&RH){ const pl=LA.getWorldPosition(new T.Vector3()), pr=RA.getWorldPosition(new T.Vector3()), left=pl.clone().sub(pr).normalize(), up=new T.Vector3(0,1,0), fwd=new T.Vector3().crossVectors(left,up).normalize();
      if(foot){ const f=foot.getWorldPosition(new T.Vector3()).sub(hp); f.y=0; if(f.dot(fwd)<0) fwd.negate(); }
      const C=pl.clone().add(pr).multiplyScalar(.5).addScaledVector(fwd,.3).addScaledVector(up,-.13), a_=new T.Vector3(), b_=new T.Vector3(), c_=new T.Vector3(), q_=new T.Quaternion(), p_=new T.Quaternion();
      const reach=(fore,arm,hand,tg)=>{ for(let it=0;it<14;it++) for(const bn of [fore,arm]){ bn.getWorldPosition(c_); hand.getWorldPosition(a_); a_.sub(c_).normalize(); b_.copy(tg).sub(c_).normalize(); q_.setFromUnitVectors(a_,b_); bn.parent.getWorldQuaternion(p_); const inv=p_.clone().invert(); bn.quaternion.premultiply(inv.multiply(q_).multiply(p_)); bn.updateMatrixWorld(true); } };
      const pose=w=>{ reach(LF,LA,LH,C.clone().addScaledVector(left,w)); reach(RF,RA,RH,C.clone().addScaledVector(left,-w)); const o=grab(); for(let i=0;i<cnt;i++) o[i*3+1]-=lo; return o; };
      cA=pose(.15); cB=pose(.035);
      // on their feet: the rig's own standing rest pose, hands clapping, feet where the seated feet were
      try{ let fo=new T.Vector3(0,0,.28); if(foot){ fo=foot.getWorldPosition(new T.Vector3()).sub(hp); fo.y=0; fo.multiplyScalar(.75); } sm.skeleton.pose(); tmp.updateMatrixWorld(true);
        const hs=new T.Vector3().setFromMatrixPosition(hips.matrixWorld), pl2=LA.getWorldPosition(new T.Vector3()), pr2=RA.getWorldPosition(new T.Vector3()), C2=pl2.clone().add(pr2).multiplyScalar(.5).addScaledVector(fwd,.3).addScaledVector(up,-.1);
        const spose=w=>{ reach(LF,LA,LH,C2.clone().addScaledVector(left,w)); reach(RF,RA,RH,C2.clone().addScaledVector(left,-w)); tmp.updateMatrixWorld(true); sm.skeleton.update(); const o=new Float32Array(cnt*3); let lo2=1e9; for(let i=0;i<cnt;i++){ sm.boneTransform(i,v); v.applyMatrix4(sm.matrixWorld); o[i*3]=v.x-hs.x+fo.x; o[i*3+1]=v.y; o[i*3+2]=v.z-hs.z+fo.z; lo2=Math.min(lo2,v.y); } for(let i=0;i<cnt;i++) o[i*3+1]-=lo2; return o; };
        sA=spose(.16); sB=spose(.04); }catch(e){ sA=sB=null; } } }catch(e){ cA=cB=out; }
  geo.setAttribute('cA',new T.BufferAttribute(cA,3)); geo.setAttribute('cB',new T.BufferAttribute(cB,3)); geo.setAttribute('sA',new T.BufferAttribute(sA||cA,3)); geo.setAttribute('sB',new T.BufferAttribute(sB||cB,3)); return geo; }
// the applause: how hard the house is clapping (0..1), by film time. Each person joins and stops in their own time, at their own speed.
const AUDU={uClap:{value:0},uCt:{value:0},uStand:{value:0}};
function clapMat(m){ m.onBeforeCompile=sh=>{ sh.uniforms.uClap=AUDU.uClap; sh.uniforms.uCt=AUDU.uCt; sh.uniforms.uStand=AUDU.uStand;
    sh.vertexShader='attribute vec3 cA; attribute vec3 cB; attribute vec3 sA; attribute vec3 sB; attribute float aPh; uniform float uClap,uCt,uStand;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n{ float on=step(.1,fract(aPh*7.31))*smoothstep(0.,1.,clamp(uClap*1.7-fract(aPh*5.3)*.7,0.,1.)); float kk=.5+.5*sin(uCt*(18.+8.*fract(aPh*3.7))+aPh*6.2832); transformed=mix(transformed,mix(cA,cB,kk*kk),on); float up=step(.07,fract(aPh*9.7))*smoothstep(0.,1.,clamp(uStand*1.9-fract(aPh*4.1)*.9,0.,1.)); transformed=mix(transformed,mix(sA,sB,kk*kk),up); }'); };
  m.customProgramCacheKey=()=>'audclap2'; return m; }
function audClapUpdate(){ const t=typeof FILM!=='undefined'&&FILM.on?FILM.t:-1; const env=(a,b)=>t<a?0:t<b?smooth(clamp((t-a)/.7,0,1)):1-smooth(clamp((t-b)/2.6,0,1));
  AUDU.uClap.value=t<0?0:Math.max(.8*env(3.6,9.2),env(13.0,22.5),.7*env(30.7,34.5),.6*env(47.2,50.5),.5*env(58.7,61.5),env(76.9,999)); AUDU.uStand.value=0;   /* v20: no standing at the finish: the standing pose left the house looking empty from the overhead shot */ AUDU.uCt.value=performance.now()/1000; }   /* v18: they clap at the big moments and stand for the finish */
function loadAudience(){ if(AUD.loading) return AUD.loading; return AUD.loading=(async()=>{
  const fix=new T.Matrix4().compose(new T.Vector3(0,-.06,-.02),new T.Quaternion().setFromEuler(new T.Euler(0,Math.PI,0)),new T.Vector3(.93,.93,.93)), tint=new T.Color();   // seated head height 1.27 m, under the 1.29 m the rake is drawn for
  const taken=LAY.seats,   /* v19: every seat filled */ near=s=>window.__audHi===true&&Math.hypot(s.x,s.z-4.5)<3.4,   /* v23k: his note, a clump of empty-looking chairs by the centre aisle: the close-up figures there are off; those seats take the regular figures */ who=i=>((i*7+(i>>3))%4);
  for(let n=1;n<=4;n++){ const mine=taken.filter((s,i)=>who(i)===n-1); let hi=null, hmat=null;
    const [g,tx]=await Promise.all([loadGLB('aud'+n+'.glb'),texP('aud'+n+'.jpg')]), mat=clapMat(new T.MeshStandardMaterial({map:tx,roughness:.85,metalness:0,envMapIntensity:.3}));
    try{ const [hg,ht]=await Promise.all([loadGLB('aud'+n+'-hi.glb'),texP('aud'+n+'-hi.jpg')]); hi=bakeSeated(hg); { hi.computeBoundingBox(); if(hi.boundingBox.max.y-hi.boundingBox.min.y<.5){ console.warn('aud hi flat',n); hi=null; } }   /* v23k: his note, a clump of empty chairs near the centre aisle: a close-up figure that bakes flat leaves its seats looking empty, so those seats take the regular figure */ hmat=clapMat(new T.MeshStandardMaterial({map:ht,roughness:.85,metalness:0,envMapIntensity:.3})); }catch(e){}
    // a mixed house: two poses of each figure, ten clothing tints, and every one a little different in build and in how they sit
    const far=mine.filter(s=>!(hi&&near(s))), PAL=[[1,1,1],[.92,.82,.78],[.78,.86,.98],[.86,.95,.84],[1,.9,.72],[.72,.72,.78],[.98,.8,.9],[.62,.64,.7],[1,.96,.9],[.8,.74,.92]], vm=new T.Matrix4(), vq2=new T.Matrix4(), vq=new T.Quaternion(), ve=new T.Euler(), vs=new T.Vector3(), vz=new T.Vector3(), vi=new T.Matrix4();
    let geoB=null; try{ geoB=bakeSeated(g,true); }catch(e){}
    let geoA=null; try{ geoA=bakeSeated(g); }catch(e){} const tall=q=>{ if(!q) return false; q.computeBoundingBox(); return q.boundingBox.max.y-q.boundingBox.min.y>.5; }; if(!tall(geoA)) geoA=tall(geoB)?geoB.clone():null;   /* v21: on two of the four figures the first seated pose baked flat (1 cm tall), which left a quarter of their seats looking empty: use the second pose there */
    for(const [geo,m,list,tag] of [[geoA,mat,geoB?far.filter((s,i)=>i%2===0):far,0],[geoB,mat,geoB?far.filter((s,i)=>i%2===1):[],1],[hi,hmat,mine.filter(near),2]]){ if(!geo||!list.length) continue; { const ph=new Float32Array(list.length); for(let i=0;i<ph.length;i++) ph[i]=h01(i*13+n*71+tag*29); geo.setAttribute('aPh',new T.InstancedBufferAttribute(ph,1)); } const im=onSeats(geo,m,list,fix); im.castShadow=false; im.visible=S.people; im.userData.aud=true;
      list.forEach((s,i)=>{ const h=((s.idx===undefined?i:s.idx)*2654435761+n*40503+tag*977)>>>0, r1=(h%1000)/1000, r2=((h>>>10)%1000)/1000, r3=((h>>>20)%1000)/1000, c=PAL[h%PAL.length], v=.8+.28*r1; im.setColorAt(i,tint.setRGB(v*c[0],v*c[1],v*c[2]));
        im.getMatrixAt(i,vi); vm.compose(vz,vq.setFromEuler(ve.set(-.085+(r3-.5)*.05,(r2-.5)*.18,0)),vs.set(.95+.1*r1,.95+.09*r3,.95+.1*r2));   /* settled back into the seat: a lean of about five degrees from the feet, and only a slight turn */ vi.multiply(vm); im.setMatrixAt(i,vi); }); im.instanceColor.needsUpdate=true; im.instanceMatrix.needsUpdate=true; AUD.meshes.push(im); } }
  AUD.loaded=true; audSync(); })(); }
const _am=new T.Matrix4(), _az=new T.Matrix4().makeScale(0,0,0);
function audSync(){ for(const h of AUD.hid){ h.im.setMatrixAt(h.i,h.m); h.im.instanceMatrix.needsUpdate=true; } AUD.hid.length=0; const seat=typeof V!=='undefined'&&!AUD.noHide?V.seat:null; if(!seat) return;
  for(const im of AUD.meshes){ const i=im.userData.list.indexOf(seat); if(i<0) continue; im.getMatrixAt(i,_am); AUD.hid.push({im,i,m:_am.clone()}); im.setMatrixAt(i,_az); im.instanceMatrix.needsUpdate=true; } }
function setPeople(on){ S.people=on; if(on&&!AUD.loading){ $('#loading').hidden=false; loadAudience().catch(()=>{}).then(()=>{ $('#loading').hidden=true; }); } FOLD.dirty=true; if(on&&S.club) loadCrowd().catch(()=>{}); }
window.__AUD=AUD;

await __tick();
// ================= THE COMPANY: dancers on the stages, moving to motion tracked from real dance video =================
// Each routine is body landmarks tracked from a video (33 points a frame). They are solved onto the dancer rig bone by bone:
// the hips and the chest take their turn from the hip and shoulder lines, every limb bone aims at the next joint. One skeleton
// per routine drives a whole line of dancers, so a line moves in unison, the way a company number does.
const DANCE={ready:false,lines:[],on:true,off:{}};
const _v1=new T.Vector3(), _v2=new T.Vector3(), _q1=new T.Quaternion(), _q2=new T.Quaternion(), _m1=new T.Matrix4(), _m2=new T.Matrix4();
function basis(x,y){ const X=x.clone().normalize(), Z=new T.Vector3().crossVectors(X,y).normalize(), Y=new T.Vector3().crossVectors(Z,X).normalize(); return new T.Matrix4().makeBasis(X,Y,Z); }
function solveClip(root,data,name){
  const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; });
  const order=['Hips','Spine02','Spine01','Spine','neck','Head','LeftShoulder','LeftArm','LeftForeArm','LeftHand','RightShoulder','RightArm','RightForeArm','RightHand','LeftUpLeg','LeftLeg','LeftFoot','RightUpLeg','RightLeg','RightFoot'].filter(n=>B[n]);
  const rest=new Map(order.map(n=>[n,B[n].quaternion.clone()])), hipP=B.Hips.position.clone();
  root.updateMatrixWorld(true);
  const wp=n=>B[n].getWorldPosition(new T.Vector3());
  // rest frames for the hips and the chest
  const rHips=basis(wp('LeftUpLeg').sub(wp('RightUpLeg')),wp('Spine').sub(wp('Hips')));
  const rChest=basis(wp('LeftArm').sub(wp('RightArm')),wp('neck').sub(wp('Spine')));
  const tall=wp('Head').distanceTo(wp('Hips'));
  const setWorldRot=(b,qWorld)=>{ b.parent.getWorldQuaternion(_q2); b.quaternion.copy(_q2.invert().multiply(qWorld)); b.updateMatrixWorld(true); };
  const alignBasis=(b,restM,tgtM)=>{ const R=_m1.copy(tgtM).multiply(_m2.copy(restM).invert()); _q1.setFromRotationMatrix(R); b.getWorldQuaternion(_q2); setWorldRot(b,_q1.multiply(_q2)); };
  const aim=(n,child,dir)=>{ const b=B[n], c=B[child]; if(!b||!c) return; const from=wp(child).sub(wp(n)).normalize(); _q1.setFromUnitVectors(from,_v1.copy(dir).normalize()); b.getWorldQuaternion(_q2); setWorldRot(b,_q1.clone().multiply(_q2)); };
  const nF=data.n, times=new Float32Array(nF), Q=Object.fromEntries(order.map(n=>[n,new Float32Array(nF*4)])), P=new Float32Array(nF*3);
  const L=(f,i)=>new T.Vector3(data.p[f][i*3],data.p[f][i*3+1],data.p[f][i*3+2]);
  const sc=tall/0.62;                         // tracked torso-plus-head length is about 0.62 m
  for(let f=0;f<nF;f++){ times[f]=f/data.fps;
    for(const n of order) B[n].quaternion.copy(rest.get(n)); B.Hips.position.copy(hipP); root.updateMatrixWorld(true);
    const lh=L(f,23), rh=L(f,24), ls=L(f,11), rs=L(f,12), hm=lh.clone().add(rh).multiplyScalar(.5), sm2=ls.clone().add(rs).multiplyScalar(.5), em=L(f,7).add(L(f,8)).multiplyScalar(.5);
    alignBasis(B.Hips,rHips,basis(lh.clone().sub(rh),sm2.clone().sub(hm)));
    aim('Spine02','neck',sm2.clone().sub(hm));
    if(B.Spine) alignBasis(B.Spine,rChest.clone().premultiply(new T.Matrix4()),basis(ls.clone().sub(rs),sm2.clone().sub(hm)));
    aim('neck','Head',em.clone().sub(sm2));
    aim('LeftArm','LeftForeArm',L(f,13).sub(ls)); aim('LeftForeArm','LeftHand',L(f,15).sub(L(f,13)));
    aim('RightArm','RightForeArm',L(f,14).sub(rs)); aim('RightForeArm','RightHand',L(f,16).sub(L(f,14)));
    aim('LeftUpLeg','LeftLeg',L(f,25).sub(lh)); aim('LeftLeg','LeftFoot',L(f,27).sub(L(f,25))); aim('LeftFoot','LeftToeBase',L(f,31).sub(L(f,27)));
    aim('RightUpLeg','RightLeg',L(f,26).sub(rh)); aim('RightLeg','RightFoot',L(f,28).sub(L(f,26))); aim('RightFoot','RightToeBase',L(f,32).sub(L(f,28)));
    for(const n of order) B[n].quaternion.toArray(Q[n],f*4);
    // a little travel and the bounce, in the hips' parent space
    _v2.set(data.x[f]*.5*sc,data.y[f]*sc,0); const par=B.Hips.parent; par.getWorldQuaternion(_q2); _v2.applyQuaternion(_q2.invert()); const ps=par.getWorldScale(new T.Vector3());
    P[f*3]=hipP.x+_v2.x/ps.x; P[f*3+1]=hipP.y+_v2.y/ps.y; P[f*3+2]=hipP.z+_v2.z/ps.z; }
  for(const n of order) B[n].quaternion.copy(rest.get(n)); B.Hips.position.copy(hipP);
  const tracks=order.map(n=>new T.QuaternionKeyframeTrack(n+'.quaternion',times,Q[n])); tracks.push(new T.VectorKeyframeTrack('Hips.position',times,P));
  return new T.AnimationClip(name,nF/data.fps,tracks); }


// clean library motion (Meshy's dance and action catalogue, made on the same rig template): each bone's rotation is carried over
// relative to the source rig's rest pose, and the hips' travel is scaled to the target's height
const ANIMC={};
const ANIMPIN={a460:1};   /* clips whose travel is taken out entirely: the jump goes straight up on the spot */
async function animClip(root,name){ const d=ANIMC[name]||(ANIMC[name]=await (await fetch('anim/'+name+'.json')).json()); const B={}, order=[]; root.traverse(o=>{ if(o.isBone){ B[o.name]=o; order.push(o); } });   // parents come before children
  // Retargeted in the body's own space, not bone by bone: each bone turns from its rest by the same amount, measured in the body's frame, as the
  // source bone turned from its own rest. That holds when the two rigs rest differently (arms lower, feet pointed), where a bone-local copy leaves
  // the feet on point and the arms stiff.
  const n=d.n, times=new Float32Array(n); for(let i=0;i<n;i++) times[i]=i/d.fps; const tracks=[], trk={}, Qn=()=>new T.Quaternion();
  for(const tr of d.tracks) if(tr.p==='q'&&B[tr.b]) trk[tr.b]=tr.v;
  const par=b=>b.parent&&b.parent.isBone?b.parent.name:null, sRest={}, sRestWi={}, tRestW={}, out={}, sw={}, tw={}, q=Qn(), w=Qn(), tmp=Qn();
  for(const b of order){ const nm=b.name, pn=par(b); sRest[nm]=d.rest[nm]?Qn().fromArray(d.rest[nm]):b.quaternion.clone();
    const sW=pn?Qn().copy(sw[pn]).multiply(sRest[nm]):sRest[nm].clone(); sw[nm]=sW; sRestWi[nm]=sW.clone().invert(); tRestW[nm]=pn?Qn().copy(tRestW[pn]).multiply(b.quaternion):b.quaternion.clone();
    if(trk[nm]) out[nm]=new Float32Array(n*4); tw[nm]=Qn(); }
  for(const nm in sw) sw[nm]=Qn();
  for(let i=0;i<n;i++) for(const b of order){ const nm=b.name, pn=par(b); if(trk[nm]) q.fromArray(trk[nm],i*4); else q.copy(sRest[nm]);
    if(pn) sw[nm].copy(sw[pn]).multiply(q); else sw[nm].copy(q);
    if(!out[nm]){ if(pn) tw[nm].copy(tw[pn]).multiply(b.quaternion); else tw[nm].copy(b.quaternion); continue; }
    w.copy(sw[nm]).multiply(sRestWi[nm]).multiply(tRestW[nm]); tw[nm].copy(w);
    if(pn) w.premultiply(tmp.copy(tw[pn]).invert()); w.toArray(out[nm],i*4); }
  for(const nm in out) tracks.push(new T.QuaternionKeyframeTrack(nm+'.quaternion',times,out[nm]));
  for(const tr of d.tracks){ const b=B[tr.b]; if(!b||tr.p==='q') continue;
    const k=Math.abs(d.hip[1])>1e-4?b.position.y/d.hip[1]:1, v=new Float32Array(tr.v.length), dx=tr.v[(n-1)*3]-tr.v[0], dz=tr.v[(n-1)*3+2]-tr.v[2], pin=ANIMPIN[name];   // travel taken out: they dance on their spot
    for(let i=0;i<n;i++){ const u=n>1?i/(n-1):0; v[i*3]=pin?d.hip[0]*k:(tr.v[i*3]-tr.v[0]-dx*u+d.hip[0])*k; v[i*3+1]=tr.v[i*3+1]*k; v[i*3+2]=pin?d.hip[2]*k:(tr.v[i*3+2]-tr.v[2]-dz*u+d.hip[2])*k; } tracks.push(new T.VectorKeyframeTrack(tr.b+'.position',times,v)); }
  return new T.AnimationClip(name,d.dur,tracks); }
const motionClip=async(root,name)=>name[0]==='a'&&/^a\d+$/.test(name)?animClip(root,name):solveClip(root,await (await fetch('mocap-'+name+'.json')).json(),name);
// the four teams of the school: one per stage, fifteen dancers each, in its colour. Each company is staged on every level its stage has:
// tiers, the stair, platforms, the tower tops, the travelling platforms and the lifts, so the picture builds in height, not in lines.
// The lead on each stage's centre lift dances a solo routine against the company.
const TEAMS4=[{name:'Oro',hex:'#f2b544',routine:'a593'},{name:'Mar',hex:'#3d7bff',routine:'a594'},{name:'Fuego',hex:'#e8302e',routine:'a71'},{name:'Noche',hex:'#9a4dff',routine:'a78'}];
// spot: [stage, angle deg (stage frame), radius m, height m above the deck, ride] ride: 'L0'/'L1'/'L2' a front lift (offset along it in m), 'M0'/'M1' a travelling platform
const dStairY=r=>{ const top=PHI*PHI*PHI, r0=21.9-4.6, run=4.6/24; return Math.min(top,Math.ceil(Math.max(0,r-r0)/run)*top/24); };
/* v23k: his note, the dancers on the wide stair danced across two steps and their feet sank in. Each one now has a small flat platform set into the
   stair (his pick, option B), as high as the step under its back edge, so the whole routine stays on a flat top; t-stages.js builds them from this list. */
/* the stair dancers stand on Stage 1's landing (t-stages.js STAIR_LAND, built before this file runs) */
const DSPOTS=[
  // stage 1: the centre lift, the side lifts, four tiers of risers to 4.2 m and the wide stair
  [0,-21,18.7,1.0,null,0,'solo'],[0,21,18.7,1.0],[0,window.STAIR_LAND.spots[1].a,window.STAIR_LAND.spots[1].r,window.STAIR_LAND.y],
  [0,-30,18.7,1.0],[0,-13,18.7,1.0],[0,13,18.7,1.0],[0,30,18.7,1.0],
  [0,-21,20.15,PHI],[0,21,20.15,PHI],[0,-10,21.35,PHI*PHI],[0,10,21.35,PHI*PHI],[0,-9,22.35,PHI*PHI*PHI],[0,9,22.35,PHI*PHI*PHI],
  [0,window.STAIR_LAND.spots[0].a,window.STAIR_LAND.spots[0].r,window.STAIR_LAND.y],[0,window.STAIR_LAND.spots[2].a,window.STAIR_LAND.spots[2].r,window.STAIR_LAND.y],[0,-36,18.7,1.0],[0,36,18.7,1.0],[0,-27,20.15,PHI],[0,27,20.15,PHI],[0,0,22.6,PHI*PHI*PHI],
  // stage 2: the lifts, then a wedge on the LED floor under the light rig
  [1,0,0,0,'L0',-1.0,'solo'],[1,0,0,0,'L0',1.0],[1,0,0,0,'L1',0],[1,0,0,0,'L2',0],
  [1,-28,17.0,0],[1,-21,17.0,0],[1,21,17.0,0],[1,28,17.0,0],[1,-10,18.4,0],[1,0,18.6,0],[1,10,18.4,0],[1,-18,19.6,0],[1,18,19.6,0],[1,-6,20.4,0],[1,6,20.4,0],[1,-35,17.0,0],[1,35,17.0,0],[1,-25,20.6,0],[1,25,20.6,0],[1,0,21.0,0],
  // stage 3: the centre lift before the arch, the side lifts, the travelling platforms, and every level up to the two 6.8 m towers
  [2,0,0,0,'F',0,'solo'],[2,0,0,0,'F',1],[2,0,0,0,'F',2],[2,0,0,0,'F',3],[2,0,0,0,'F',4],[2,0,0,0,'F',5],[2,0,0,0,'F',6],[2,0,0,0,'L1',0],[2,0,0,0,'L2',0],[2,0,0,0,'M0',0],[2,0,0,0,'M1',0],
  [2,-35,21.0,PHI],[2,35,21.0,PHI],[2,-28,21.4,PHI*PHI],[2,28,21.4,PHI*PHI],[2,-38,22.2,PHI*PHI*PHI],[2,38,22.2,PHI*PHI*PHI],[2,-24,22.4,PHI*PHI*PHI*PHI],[2,24,22.4,PHI*PHI*PHI*PHI],[2,-36,16.6,0],[2,36,16.6,0],
  // stage 4: the lifts and the front of the deck before the holo-gauze, and a line behind it among the holograms
  [3,0,0,0,'L0',-1.0,'solo'],[3,0,0,0,'L0',1.0],[3,0,0,0,'L1',0],[3,0,0,0,'L2',0],
  [3,-36,18.8,0],[3,-29,18.8,0],[3,-22,18.8,0],[3,-15,18.8,0],[3,-8,18.8,0],[3,-1,18.8,0],[3,6,18.8,0],[3,13,18.8,0],[3,20,18.8,0],[3,27,18.8,0],[3,34,18.8,0],[3,-30,20.3,0],[3,-15,20.3,0],[3,0,20.3,0],[3,15,20.3,0],[3,30,20.3,0]];   // the front of the deck is the singer's path
const FORM=DSPOTS.map((sp,n)=>({k:sp[0],a:sp[1],r:sp[2],y:sp[3],ride:sp[4]||null,dx:sp[5]||0,model:n%2?'dancer-m2':'dancer-f2',routine:sp[6]==='solo'?'a76':TEAMS4[sp[0]].routine}));   /* the leads face the house (the old solo, a73, danced side-on) */
function teamMat(tx,hex,gain){ gain=gain||.85; const m=new T.MeshStandardMaterial({map:tx,skinning:true,roughness:.5,metalness:.05}); const col=new T.Color(hex);
  m.onBeforeCompile=sh=>{ sh.uniforms.uTeam={value:col}; sh.fragmentShader='uniform vec3 uTeam;\n'+sh.fragmentShader.replace('#include <map_fragment>',`#ifdef USE_MAP
  vec4 texelColor=texture2D(map,vUv); texelColor=mapTexelToLinear(texelColor);
  float mxc=max(texelColor.r,max(texelColor.g,texelColor.b)), mnc=min(texelColor.r,min(texelColor.g,texelColor.b)), sat=(mxc-mnc)/max(mxc,.001), lum=dot(texelColor.rgb,vec3(.299,.587,.114));
  float cloth=smoothstep(.5,.66,lum)*(1.-smoothstep(.1,.24,sat));
  texelColor.rgb=mix(texelColor.rgb,uTeam*(.25+.9*lum),cloth);
  diffuseColor*=texelColor;
  teamGlow=uTeam*cloth*(.35+.65*lum);
#endif`).replace('#include <emissivemap_fragment>','#include <emissivemap_fragment>\n  totalEmissiveRadiance+=teamGlow*'+gain.toFixed(2)+';').replace('void main() {','vec3 teamGlow=vec3(0.);\nvoid main() {'); }; m.customProgramCacheKey=()=>'team3'+hex+gain; return m; }   // the white panels and trim of the show gear take the team's colour and glow in it
const _dsp=new T.Vector3();
// t22. In the tour (everywhere but the club) the company shows as holograms: the same bought models and moves, drawn as light. Their own
// picture is kept faintly inside, edged in their team colour, with fine scan lines and a band of light that climbs through them now and then.
const HOLOD={u:{uT:{value:0}},mats:{}};
function holoDancerMat(tx,hex){ const key=hex+tx.uuid; if(HOLOD.mats[key]) return HOLOD.mats[key]; const col=new T.Color(hex).lerp(new T.Color(0x7fe8ff),.42);
  const m=new T.ShaderMaterial({skinning:true,transparent:true,depthWrite:false,blending:T.AdditiveBlending,uniforms:{map:{value:tx},uCol:{value:col},uT:HOLOD.u.uT},
    vertexShader:`#include <common>
#include <skinning_pars_vertex>
varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY;
void main(){ vUv=uv;
#include <skinbase_vertex>
#include <beginnormal_vertex>
#include <skinnormal_vertex>
#include <begin_vertex>
#include <skinning_vertex>
  vec4 wp=modelMatrix*vec4(transformed,1.); vY=wp.y; vec4 mv=viewMatrix*wp; vN=normalize(mat3(modelViewMatrix)*objectNormal); vV=-mv.xyz; gl_Position=projectionMatrix*mv; }`,
    fragmentShader:`uniform sampler2D map; uniform vec3 uCol; uniform float uT; varying vec3 vN; varying vec3 vV; varying vec2 vUv; varying float vY;
void main(){ vec3 tx=texture2D(map,vUv).rgb; float lum=dot(tx,vec3(.299,.587,.114));
  float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),1.5);
  float scan=.7+.3*sin(vY*190.-uT*7.);
  float band=smoothstep(.9,1.,fract(vY*.32-uT*.38))*.8;
  float flick=.93+.07*sin(uT*29.+vY*2.);
  vec3 c=uCol*(.16+.8*lum)+uCol*fr*1.35+vec3(.85,.95,1.)*fr*fr*.45+uCol*band;
  float a=clamp((.3+.45*lum+.85*fr+band*.5)*scan*flick,0.,1.)*.92;
  gl_FragColor=vec4(c*a,1.); }`});
  m.userData.holo=true; return HOLOD.mats[key]=m; }
// Stage 3's dark act: a tight wedge of five. On the music they flash, vanish and land further apart, then snap back to the wedge; each time
// they go out they land further away: across the deck, out to the wings, up onto the platforms, up to the towers. On the drop they are back in
// the wedge, the lights come up on them and they charge the edge. The rest of the company stands through the whole set, on every level.
const TELE={t0:22.35,at:[],dest:[1,3,-1],stag:60/117.45/2,n:3,grp:[0,1,1,2,2,3,3],born:[16.1,18.26,20.31,22.35]};   /* v17: three clean moves, four beats apart, each held: wedge to the wings, wings up to the towers, back to the wedge */   /* v16: the wedge grows 1, 2, 2, 2, four beats apart, complete on the first hit; then it feeds the lead and she starts to rise; the jumps begin four beats later and close up to one beat */
{ const b=60/117.45; for(const k of [4,8,12]) TELE.at.push(22.35+k*b); }   /* the canon: the centre one, then two, then two, an eighth note apart */
const WEDGE={start:31.0,charge:2.2};
const TW_IN=[[0,16.4],[-1.7,17.45],[1.7,17.45],[-3.4,18.5],[3.4,18.5],[-5.1,19.55],[5.1,19.55]].map(([x,r])=>[x/r/D2R,r,0]);
const P2=PHI*PHI, P3=P2*PHI, P4=P3*PHI;
const TW_OUT=[[[0,15.0,0],[-9,16.6,0],[9,16.6,0],[-17,17.4,0],[17,17.4,0],[-25,18.2,0],[25,18.2,0]],[[0,14.6,0],[-21,16.0,0],[21,16.0,0],[-33,16.9,0],[33,16.9,0],[-27,18.7,0],[27,18.7,0]],
  [[0,15.0,0],[-33.4,21.0,PHI],[33.4,21.0,PHI],[-26.4,21.4,P2],[26.4,21.4,P2],[-29.6,21.4,P2],[29.6,21.4,P2]],[[0,14.6,0],[-36.4,22.2,P3],[36.4,22.2,P3],[-22.3,22.4,P4],[22.3,22.4,P4],[-25.7,22.4,P4],[25.7,22.4,P4]]];
// where dancer j is in the pattern at film time t: n counts the jumps made so far (-1 before the first); even n is out, odd n is back in the wedge
function teleInfo(j,t){ const tj=t-TELE.grp[j]*TELE.stag, A=TELE.at; let n=-1; while(n+1<A.length&&A[n+1]<=tj) n++;
  return {n,since:n<0?99:tj-A[n],until:n+1<A.length?A[n+1]-tj:1e9,out:n>=0&&n<TELE.n&&TELE.dest[n]>=0,level:n>=0&&n<TELE.n&&TELE.dest[n]>=0?TELE.dest[n]:0}; }
// v17. The dark act as the light-suit illusion it started from: everyone is black until lightning hits them. A strike lights a dancer for about
// three beats (a real move), then they are gone; the next strike finds them somewhere else. Each entry: when, how long lit, where (-1 the wedge,
// 1 the wings, 3 the towers), which groups (0 the lead, 1 to 3 the pairs), and the ripple between groups.
const ACT={wins:[]};
{ const b=60/117.45, t0=22.35; ACT.wins=[{t:16.1,d:3.5*b,dest:-1,grp:[0],rip:0},{t:t0-8*b-.22,d:.55,dest:-1,grp:[0],rip:0},{t:t0-8*b,d:3*b,dest:-1,grp:[1],rip:0},{t:t0-4*b-.22,d:.55,dest:-1,grp:[0],rip:0},{t:t0-4*b,d:3*b,dest:-1,grp:[2],rip:0},
    {t:t0,d:3.25*b,dest:-1,grp:[0,1,2,3],rip:b/4},{t:t0+4*b,d:3*b,dest:1,grp:[0,1,2,3],rip:0},{t:t0+8*b,d:3*b,dest:3,grp:[0,1,2,3],rip:0},{t:t0+12*b,d:99,dest:-1,grp:[0,1,2,3],rip:b/4}]; ACT.last=ACT.wins.length-1; }
function actState(j,t){ const g=TELE.grp[j]; let W=null, wi=-1, s=0; for(let i=0;i<ACT.wins.length;i++){ const w=ACT.wins[i]; if(w.grp.indexOf(g)<0) continue; const si=w.t+g*w.rip; if(t>=si-.14){ W=w; wi=i; s=si; } }
  if(!W) return {wi:-1,lit:false,since:-9,left:0,dest:-1,s:0}; return {wi,lit:t>=s&&t<s+W.d,since:t-s,left:s+W.d-t,dest:W.dest,s}; }
// v18b. Out in the wings and up in the towers nobody is simply on. The bolt goes to one of three, bounces between them a few times, and each is
// lit only for its turn (two thirds of a beat): they are up there, gone, up there again, until the next chain hit brings them back to the wedge.
const BNC={H:2*(60/117.45)/3,seq:{6:[[1,3,5],[2,4,6]],7:[[3,'C',5],[4,'C',6]]}};
function bounceTurn(wi,side,ft){ const u=ft-ACT.wins[wi].t-side*BNC.H/2, k=Math.floor(u/BNC.H); return u<0||k>=6?null:{k,since:u-k*BNC.H,who:BNC.seq[wi][side][k%3]}; }
function bounceLit(j,ft){ for(const wi of [6,7]){ const W=ACT.wins[wi], W1=ACT.wins[wi+1]; if(ft<W.t-.14||ft>=W1.t-.14) continue; const side=j%2?0:1, T_=bounceTurn(wi,side,ft);
    if(T_&&(T_.who===j||(wi===7&&j<=2&&T_.k===2))) return {lit:true,since:T_.since,left:BNC.H-T_.since}; return {lit:false,since:-9,left:0}; } return null; }
function companyMoments(S_,i){ const W=ACT.wins, H=BNC.H, d=S_.d, side=d.ride?i%2:(d.a<0?0:1), off=side*H/2, out=[];
  if(!d.ride&&d.y>P4-.2) out.push([W[7].t+off+H,H,1],[W[7].t+off+4*H,H,1]);       // on the tower top: the middle one of the three the bolt bounces between
  else if(!d.ride&&d.y>P3-.2) out.push([W[7].t+off+5*H,H,0]);                      // the high platform: one turn, late
  else if(S_.lv===2) out.push([W[7].t+off+((i*5)%6)*H,H,0]);                       // the middle levels and the lifts: one moment while the bolt is up in the towers
  else out.push([W[6].t+off+((i*5)%6)*H,H,0]);                                     // the deck: one moment while it is out in the wings
  out.push([W[8].t+.3+((i*7)%10)*.1,.3,0]); return out; }
function teleSpot(j,n){ return n>=0&&n<TELE.n&&TELE.dest[n]>=0?TW_OUT[TELE.dest[n]][j]:TW_IN[j]; }
// the lead of the five stands on a single stem lift at the point of the wedge and rises through the dark act: a levitation
function leadY(){ if(!FILM.on) return 0; const t=FILM.t; return t<16.1||t>=44.6?0:stemState(t).h; }
function leadWorld(out){ const [a,r]=TW_IN[0]; return out.copy(pol(stageAngle(2)+a*D2R,r,STAGE_H+leadY()+1.25)); }
function wedgeAt(i){ const j=Math.min(i,6), t=FILM.on?FILM.t:999; if(j===0&&FILM.on) return [TW_IN[0][0],TW_IN[0][1],leadY()];
  if(t<30.9&&FILM.on){ const A=actState(j,t); return A.dest>=0?TW_OUT[A.dest][j]:TW_IN[j]; }
  const [a0,r0]=TW_IN[j], r1=r0-2.3, u=smooth(clamp((t-WEDGE.start)/WEDGE.charge,0,1)); return [lerp(a0,a0*r0/r1,u),lerp(r0,r1,u),0]; }
function dSpotPos(d,out){ const st=ST[d.k];
  if(d.ride==='F'){ const [a,r,y]=wedgeAt(d.dx); return out.copy(pol(stageAngle(d.k)+a*D2R,r,STAGE_H+(y||0))); }
  if(d.ride&&d.ride[0]==='L'){ const L=st.lifts[+d.ride[1]]; L.g.updateMatrixWorld(true); return L.g.localToWorld(out.set(d.dx,0,0)); }
  if(d.ride&&d.ride[0]==='M'&&st.movers){ const M_=st.movers[+d.ride[1]]; M_.g.updateMatrixWorld(true); return M_.g.localToWorld(out.set(d.dx,0,0)); }
  return out.copy(pol(stageAngle(d.k)+d.a*D2R,d.r,STAGE_H+d.y)); }
// v23: the wedge pairs mirror each other: the one on the right of each pair (Fuego red, then gold, then the last) dances the mirror image of the one on the left
const MIRR=d=>d.k===2&&d.ride==='F'&&d.dx>0&&d.dx%2===0&&!window.NO_MIRR;
async function loadCompany(){ if(!T.SkeletonUtils) return; const IDENT=new T.Matrix4(); const cache={};
  const motion=async k=>cache['m'+k]||(cache['m'+k]=await (await fetch('mocap-'+k+'.json')).json());
  for(const model of ['dancer-f2','dancer-m2']){ const [gltf,tx]=await Promise.all([loadGLB(model+'.glb'),texP(model+'.jpg')]);
    for(let k=0;k<4;k++){ const mat=teamMat(tx,k===2?'#ff2010':TEAMS4[k].hex,k===2?1.7:.85);
      for(const routine of [...new Set(FORM.filter(d=>d.k===k&&d.model===model).map(d=>d.routine))]){ const rows=FORM.filter(d=>d.k===k&&d.model===model&&d.routine===routine);
        const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm);
        scene.add(root); root.updateMatrixWorld(true);
        const key=model+'/'+routine; const clip=cache[key]||(cache[key]=await motionClip(root,routine)); const mixer=new T.AnimationMixer(root), base=mixer.clipAction(clip); base.play(); mixer.update(model==='dancer-m2'?.06:0);
        let lev=null; if(k===2&&routine==='a76'){ try{ lev=mixer.clipAction(await motionClip(root,'a308')); lev.play(); lev.setEffectiveWeight(0); lev.paused=true; lev.time=3.0; }catch(e){ lev=null; } }   /* v18: while she rises she holds one open pose (arms wide, chest up): she is lifting herself, not dancing */
        const hmat=holoDancerMat(tx,k===2?'#ff2010':TEAMS4[k].hex);
        const meshes=rows.map(d=>{ const m=new T.SkinnedMesh(geo,mat); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; m.castShadow=false; if(MIRR(d)) m.scale.x=-1; scene.add(m); return {m,k:d.k,d,mat,hmat}; });
        DANCE.lines.push({root,mixer,meshes,skel,geo,base,lev,k2:meshes.some(e=>e.k===2)}); } } }
  DANCE.ready=true; }
JOBS.push(loadCompany);
function updateDance(dt){ if(!DANCE.ready) return; const tourCast=TOUR.on&&TOUR.step===14&&typeof TS!=='undefined'&&TS.cast, holo=TOUR.on&&!tourCast&&!FILM.on; HOLOD.u.uT.value+=dt;   /* t22: holograms in the tour; the real company in the club */
  for(const L of DANCE.lines){ let any=false;
    for(const e of L.meshes){ const want=holo?e.hmat:e.mat; if(e.m.material!==want) e.m.material=want;
      const vis=DANCE.on&&!DANCE.off[e.k]&&(!S.club&&S.room==='theatre'||tourCast)&&(window.__team||stageOpen(e.k)>.15)&&(e.k!==2||SHOW.dim>.5||elecK()>0); e.m.visible=vis&&(!TOUR.on||TS.stUp>.9); any=any||vis;
      if(vis){ const p=dSpotPos(e.d,_dsp); e.m.position.copy(p); e.m.rotation.y=Math.atan2(-p.x,-p.z)+(e.k===2&&e.d.ride==='F'&&e.d.dx===0&&FILM.on?leadYawOff(FILM.t):0); } }
    if(L.lev){ const ft=FILM.on?FILM.t:-1; let w=ft<0?0:smooth(clamp((ft-23.7)/.7,0,1))*(1-smooth(clamp((ft-31.2)/.9,0,1))); if(window.__lev==='dance') w=0; if(b2On(ft)){ const k=b2Slot(ft), A=k%2===0, PA=[1.7,3.6,2.4,4.5,6.3,3.0,5.1,3.9,6.6,2.7], PB=[.6,1.9,3.2,4.4,5.6,6.9,8.1,2.6,7.4,9.2]; L.lev.setEffectiveWeight(A?1:0); L.base.setEffectiveWeight(A?0:1); L.lev.paused=true; L.base.paused=true; L.lev.time=PA[(k>>1)%PA.length]; L.base.time=PB[(k>>1)%PB.length]; L.b2=true; }   /* B2: a new frozen moment every slot: the lift pose and a frozen frame of her solo, alternating */
      else { if(L.b2){ L.base.paused=false; L.b2=false; } L.lev.setEffectiveWeight(w); L.base.setEffectiveWeight(1-w); L.lev.paused=true; L.lev.time=window.__lev==='hold'?3.0+.1*Math.sin(Math.max(0,ft)*1.2):lerp(1.0,4.25,smooth(clamp((ft-24.39)/6.06,0,1)))+.06*Math.sin(Math.max(0,ft)*1.2); } }   /* v18b: her arms sweep up from her sides as she lifts, one slow gesture across the whole rise; __lev='dance' or 'hold' gives the other two looks for comparison */
    if(any||(L.k2&&SUITS.grp&&SUITS.grp.visible)) L.mixer.update(dt*(REDUCED?0:1)); } singerUpdate(dt); aisleUpdate(dt); }

// the suits of light are Stage 3's own company: the same dancers on the same skeletons, drawn only as lines of light.
// When the lights come up on the hit, the company is standing exactly where the suits were, mid-move.
function buildSuits(){ if(!DANCE.ready||!SUITS.grp) return; const IDENT=new T.Matrix4(); SUITS.meshes=[];
  if(SUITS.grp.parent!==scene){ SUITS.grp.parent.remove(SUITS.grp); scene.add(SUITS.grp); SUITS.grp.position.set(0,0,0); SUITS.grp.rotation.set(0,0,0); }   // the spots are in room coordinates
  for(const L of DANCE.lines) for(const e of L.meshes){ if(e.k!==2) continue;
    const u={uOn:{value:0},uCol:{value:new T.Color(0x35e0ff)}}, mat=new T.MeshStandardMaterial({map:e.m.material.map,skinning:true,color:0x000000,roughness:1,metalness:0});
    mat.onBeforeCompile=sh=>{ sh.uniforms.uOn=u.uOn; sh.uniforms.uCol=u.uCol; sh.fragmentShader='uniform float uOn; uniform vec3 uCol;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n{ float fr=pow(1.-abs(dot(normalize(vNormal),normalize(vViewPosition))),1.25); float ln=smoothstep(.4,.5,abs(fract(vUv.y*20.)-.5))*.55+smoothstep(.43,.5,abs(fract(vUv.x*14.)-.5))*.35; gl_FragColor=vec4(uCol*(fr*1.9+ln)*uOn,1.); }'); };
    mat.customProgramCacheKey=()=>'suit';
    const m=new T.SkinnedMesh(L.geo,mat); m.bindMode='detached'; m.bind(L.skel,IDENT); m.frustumCulled=false; m.userData.u=u; if(MIRR(e.d)) m.scale.x=-1; SUITS.grp.add(m);
    SUITS.meshes.push({m,d:e.d,lv:e.d.ride==='F'?-1:e.d.ride?2:e.d.y<.1?1:e.d.y<P2+.1?2:3,rank:e.d.ride==='F'?e.d.dx*.3:10+e.d.y*3+Math.abs(e.d.ride?0:e.d.a)/12+(e.d.ride?2.2:0)}); }
  SUITS.meshes.sort((a,b)=>a.rank-b.rank); SUITS.meshes.forEach((s,i)=>{ s.join=2.6+i*.42; s.jf=i===0?16.0:i<3?18.4+i*1.4:22.35+(i-3)*.38; });   /* film: one dancer in the intro, two more, then the build from the first big hit */ SUITS.ready=SUITS.meshes.length>0; }

await __tick();
// ================= THE SINGER: Tripp, mid-song, for the film =================
// He comes out of the presentation tunnel between Stages 3 and 4 with two dancers, crosses Stage 4, takes the thrust and walks down
// the centre stairs onto the lit mark at the head of the aisle. The mark is on the turntable, so when the audience turns to Stage 1
// he turns with them. Then he climbs back up, crosses to Stage 1's centre lift and rides it up. Two follow-spots stay on him.
const SING={ready:false,on:false,pos:new T.Vector3(),yaw:0,parts:[],spots:[]};
const _sv=new T.Vector3(), _sw=new T.Vector3(), _sq=new T.Vector3();
const discW=(x,y,z,out)=>out.set(x,y,z).applyAxisAngle(YAX,-S.discA);                       // a point on the turntable, in the room
const liftW=(k,i,dx,out)=>{ const L=ST[k].lifts[i]; L.g.updateMatrixWorld(true); return L.g.localToWorld(out.set(dx||0,0,0)); };
// the route, by film time. kind w: a point in the room (angle deg, radius, height); d: a point on the turntable; L: on a lift
const SROUTE=[
  /* v23 his note: "take his time to get there ... about 1/2 way down from upstage he should start strutting ... all the way to the stairs and stair walk down those":
     one steady pace (about 1 m/s, 1.1 on the steps) from a start 5.8 m further forward (no speed change anywhere on the way), Swagger Walk to the tunnel mouth, Strut Walking from there
     to the stair head, then the same strut down the six steps with each foot landing on its own step (Mixamo 'Descending Stairs' is loaded as 'stairs' but its 23 cm risers and 21 cm treads knelt him on our 17 cm / 34 cm steps), landing on the mark as NOCHE comes in */
  [33.8,{w:[225,23.0,STAGE_H],gl:.5,gr:.6},'walk'],   /* v21: the girls start tucked in behind him, clear of the tunnel's side boxes */   /* v19: he starts well back in the tunnel, the two girls close behind him in its narrow end */   // he starts inside the tunnel as the room turns to face it, so he walks out into the middle of the picture
  [36.87,{w:[225,19.93,STAGE_H],gl:.72},'walk'],
  [38.85,{w:[225,17.95,STAGE_H],gl:.9},'strut'],   /* v21: the girls stay tucked in until they are clear of the cube beside the tunnel mouth (the point is on his own straight line, so his walk is unchanged) */   /* at the mouth as the turn ends and the spot finds him; one steady pace all the way to the stair */   // at the tunnel mouth as the screens open on it; an easy 1.3 m a second from here
  [43.9,{w:[225,12.9,STAGE_H],gr:-.372,gl:1.763},'strut'],   /* v23h: the girls fan out to their marks either side of the stair (outside the cryo jets) over the whole walk; they used to jump the last 70 cm sideways in 0.15 s */   /* v18: he walks the tunnel's own line in the room (the turntable's stair head arrives under him) */
  [44.05,{d:[0,STAGE_H,-12.75]},'strut'],   /* v23h: his note, Tripp twisted and stumbled at the stair head: the room point and the turntable point were the same spot, so for 0.15 s he had no direction of travel. One steady 1 m/s now, onto the turntable and down the steps */
  [44.3,{d:[0,STAGE_H,-12.5]},'strut'],   /* v21: no stop and no jump: he struts across the stair head and straight down as the room turns to Stage 4 */
  [46.0,{d:[0,0,-10.8]},'strut'],
  [46.45,{d:[0,0,-10.25]},'sing'],         // down the six steps onto the lit mark on the turntable floor, a beat before NOCHE lands
  [57.7,{d:[0,0,-10.25]},'walk'],
  [59.7,{d:[0,STAGE_H,-12.9]},'walk'],
  [62.1,{L:[0,0]},'sing']];
const stairY=z=>STAGE_H*clamp((-10.8-z)/1.7,0,1);   /* v23: the body rides the stair's own slope, top edge -12.5 to bottom step -10.8 (b2-front.js) */                     // the centre stair: six steps from z -12.5 down to -10.46
// the two dancers stay at the head of the stair, either side of it; he goes down alone
function sRoutePt(p,out,lat){ if(p.w){ const rr=p.w[1]+(lat?(p.gr!==undefined?p.gr:1.0):0); out.copy(pol(p.w[0]*D2R+(lat||0)*(p.gl||1)/rr,rr,p.w[2])); } else if(p.d){ if(lat) discW(lat*1.75,STAGE_H,-12.25,out);   /* v22: the girls stand wider than the cryo jets, so the plumes go up beside them, not in front */ else discW(p.d[0],p.d[1],p.d[2],out); } else { liftW(p.L[0],lat?(lat<0?1:2):p.L[1],0,out); } return out; }
function sAt(t,lat,out){ const R=SROUTE; if(t<=R[0][0]) return {p:sRoutePt(R[0][1],out,lat),mode:R[0][2],dir:null};
  for(let i=0;i<R.length-1;i++){ const [t0,a,m]=R[i], [t1,b]=R[i+1]; if(t<t1){ const u=(t-t0)/(t1-t0); sRoutePt(a,_sv,lat); sRoutePt(b,_sw,lat); out.copy(_sv).lerp(_sw,u);
      if(!lat&&a.d&&b.d&&a.d[1]!==b.d[1]) out.y=stairY(lerp(a.d[2],b.d[2],u));                            // the stairs: height follows the steps
      return {p:out,mode:m,dir:_sq.copy(_sw).sub(_sv),speed:_sv.distanceTo(_sw)/(t1-t0)}; } }
  const last=R[R.length-1]; return {p:sRoutePt(last[1],out,lat),mode:last[2],dir:null}; }
function gaitSpeed(root,clip){ const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; }); if(!B.LeftFoot||!B.RightFoot) return 1; const mx=new T.AnimationMixer(root), a=mx.clipAction(clip); a.play();
  const n=Math.max(8,Math.round(clip.duration*30)), L=[], R=[]; for(let f=0;f<=n;f++){ mx.setTime(f/30); root.updateMatrixWorld(true); L.push(B.LeftFoot.getWorldPosition(new T.Vector3())); R.push(B.RightFoot.getWorldPosition(new T.Vector3())); }
  let sum=0, cnt=0; for(let f=0;f<n;f++){ const l0=L[f].y<R[f].y, l1=L[f+1].y<R[f+1].y; if(l0!==l1) continue; const A=l0?L:R, v=-(A[f+1].z-A[f].z)*30; if(v>0){ sum+=v; cnt++; } } a.stop(); mx.uncacheRoot(root);
  return cnt>n*.3?sum/cnt:0; }
async function loadSinger(){ if(!T.SkeletonUtils) return; const IDENT=new T.Matrix4();
  const clip=(root,name)=>motionClip(root,name);
  const make=async(file,tex,mat)=>{ const [gltf,tx]=await Promise.all([loadGLB(file+'.glb'),texP(tex)]); const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; });
    const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm); scene.add(root); root.updateMatrixWorld(true);
    const m=new T.SkinnedMesh(geo,mat?mat(tx):new T.MeshStandardMaterial({map:tx,skinning:true,roughness:.62,metalness:.05})); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; m.visible=false; scene.add(m);
    return {root,m,mixer:new T.AnimationMixer(root)}; };
  const tr=await make('tripp2','tripp2.jpg'); try{ const nm=await texP('tripp2-n.jpg'); nm.encoding=T.LinearEncoding; tr.m.material.normalMap=nm; tr.m.material.needsUpdate=true; }catch(e){}
  try{ await handGrip(tr); }catch(e){ console.warn('hand',e); window.__handErr=String(e&&e.stack||e).slice(0,400); try{ fistGrip(tr); }catch(e2){ console.warn('fist',e2); window.__fistErr=String(e2&&e2.stack||e2).slice(0,400); } }   /* v23k: his note, a real rigged hand on the mic */
  try{ coatSetup(tr); }catch(e){ console.warn('coat',e); }   /* v23k: his go, the coat swings with real physics */   /* v23: his note, the mic is in his grip */
  let best=null; window.__gait={}; for(const nm of [window.TRIPP_WALK||'a9003','a114']){   /* v23 his note: real captured motion. His walk is the Mixamo Swagger Walk (a9003); the 'Singing While Walking' take (a9002/a9005) is a crouched ballad walk and read as hunched; a9003 Swagger Walk and a9004 Strut Walking are on file (window.TRIPP_WALK) */   /* v17: the proud strut (the old pick, the 'confident strut', threw an arm across his face) */ try{ const c=await clip(tr.root,nm), v=gaitSpeed(tr.root,c); window.__gait[nm]=v; if(!best) best={c,v:v>.2?v:1.2,nm}; }catch(e){} }
  if(!best) best={c:await clip(tr.root,'a55'),v:1,nm:'a55'}; window.__gait.pick=best.nm; tr.gait=best.v;
  let SG=null; try{ SG=await clip(tr.root,window.TRIPP_SING||'a9006'); }catch(e){ window.__mxErr=String(e); } const A={walk:best.c,sing:SG||await clip(tr.root,'a405')};   /* v23 his note, 'get him moving right': between the big moments he performs to the mic with real captured motion (Mixamo 'Rapping', MC on the microphone), retargeted onto his rig; a9006 is the same take stood up (crouch, spine and knee bend eased toward his rest) after his note that his body broke on the forward hits */   /* v20: between the big moments he grooves (Joyful Dance with Hand Sway), not the old slow arms-out placeholder */
  try{ A.strut=await clip(tr.root,window.TRIPP_STRUT||'a9004'); tr.gaitS=gaitSpeed(tr.root,A.strut)||1.2; window.__gait.strut=tr.gaitS; }catch(e){ window.__strutErr=String(e); }   /* v23: Mixamo Strut Walking */
  try{ A.stairs=await clip(tr.root,'a9007'); }catch(e){ window.__stairErr=String(e); }   /* v23: Mixamo Descending Stairs, in place (the route carries him down) */
  for(const nm of ['a298','a460','a412','a417','a403','a576','a586']){ try{ A[nm]=await clip(tr.root,nm); }catch(e){} }
  // the mic: a hand-held wireless mic, kept at his mouth by a small arm solver after the animation each frame
  { const B={}; tr.root.traverse(o=>{ if(o.isBone) B[o.name]=o; }); if(B.RightArm&&B.RightForeArm&&B.RightHand&&B.Head) tr.ik={arm:B.RightArm,fore:B.RightForeArm,hand:B.RightHand,head:B.Head,neck:B.neck||B.Head,la:B.LeftArm};
    const mic=new T.Group(), body=new T.Mesh(new T.CylinderGeometry(.019,.013,.25,16),new T.MeshStandardMaterial({color:0xd4d7e0,roughness:.16,metalness:.95,emissive:0x2a2b30}));   /* v21: a chrome mic that reads against his black coat */ body.position.y=-.125; mic.add(body);
    const head=new T.Mesh(new T.SphereGeometry(.031,18,14),new T.MeshStandardMaterial({color:0xe6e8ee,roughness:.3,metalness:.9,emissive:0x3a3b42})); mic.add(head); tr.m.add(mic); tr.mic=mic; }
  tr.act={}; for(const k in A){ tr.act[k]=tr.mixer.clipAction(A[k]); tr.act[k].play(); tr.act[k].setEffectiveWeight(k==='walk'?1:0); if(k[0]==='a') tr.act[k].paused=true; } tr.lat=0; tr.m.visible=false;   /* 16 Nov: hidden until the film calls him (his glove showed in the aisle while the room was still loading) */ SING.parts.push(tr);
  // one action per clip: two entries on the same clip fought each other and left the dancer half in the rest pose
  for(const [lat,model] of [[-1.5,'dancer-f2'],[1.5,'dancer-f2']]){   /* v17: two girls, the same walk and the same routine, in step */   /* v21: mirror images of each other; one is blonde */ const d=await make(model,model+'.jpg',tx=>lat<0?blondeMat(teamMat(tx,'#9a4dff')):teamMat(tx,'#9a4dff')); if(lat>0) d.m.scale.x=-1; if(lat<0) blondeFit(d.m); const W=await clip(d.root,'a108'), D=await clip(d.root,'a80');
    d.gait=gaitSpeed(d.root,W)||1; d.act={walk:d.mixer.clipAction(W),sing:d.mixer.clipAction(D)}; for(const k in d.act){ d.act[k].play(); d.act[k].setEffectiveWeight(k==='walk'?1:0); } d.lat=lat; d.m.visible=false; SING.parts.push(d); }
  // follow-spots from the grid: a real light on him and two visible beams through the haze
  const sp=new T.SpotLight(0xfff4e6,0,45,.07,.6,1); scene.add(sp); scene.add(sp.target); SING.light=sp;
  { const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'), g=x.createRadialGradient(64,64,4,64,64,64); g.addColorStop(0,'rgba(255,246,230,1)'); g.addColorStop(.55,'rgba(255,240,215,.55)'); g.addColorStop(1,'rgba(255,240,215,0)'); x.fillStyle=g; x.fillRect(0,0,128,128);
    const pool=new T.Mesh(new T.CircleGeometry(1.5,40),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,opacity:.26,blending:T.AdditiveBlending,depthWrite:false,fog:false})); pool.rotation.x=-Math.PI/2; pool.renderOrder=3; pool.visible=false; scene.add(pool); SING.pool=pool; }   /* the follow-spot's pool on the floor: wherever he goes, he is the one in the light */
  for(let i=0;i<2;i++){ const piv=new T.Group(); scene.add(piv); const m=beamMat(0xfff1dc); const c=new T.Mesh(new T.CylinderGeometry(.06,.5,1,16,1,true).translate(0,-.5,0),m); piv.add(c); SING.spots.push({piv,c,m}); }
  SING.ready=true; }
JOBS.push(loadSinger); window.__SING=SING;
/* v23. His note: the mic was never quite in his grip. The model's hand has no finger bones, so the fingers are closed into a fist in the mesh
   itself (in the bind pose: everything past the knuckle line rolls in towards the palm, more towards the tips), and the mic runs across the
   fist and out of the thumb side, the way a singer holds one. FIST.k0: knuckle line along the hand; FIST.ang: how far the tips roll in. */
const _gcA=(a,i,k)=>k===0?a.getX(i):k===1?a.getY(i):k===2?a.getZ(i):a.getW(i);   /* r128 attributes have no getComponent: the fist never closed in the page */
const FIST={k0:.44,ang:1.95,palm:.028,head:.15,low:.05};   /* head: from the middle of the fist to the mic's head, so the handle shows between his thumb and the head, and below his little finger */
function fistGrip(tr){ const sm=tr.m, sk=sm.skeleton, hi=sk.bones.findIndex(b=>b.name==='RightHand'); if(hi<0) return;
  const geo=sm.geometry, pos=geo.attributes.position, nor=geo.attributes.normal, si=geo.attributes.skinIndex, sw=geo.attributes.skinWeight;
  const Bi=sk.boneInverses[hi], wrist=new T.Vector3().setFromMatrixPosition(Bi.clone().invert()), v=new T.Vector3(), n=new T.Vector3();
  const idx=[], wts=[]; for(let i=0;i<pos.count;i++){ let w=0; for(let k=0;k<4;k++) if(_gcA(si,i,k)===hi) w+=_gcA(sw,i,k); if(w>.25){ idx.push(i); wts.push(w); } }
  if(idx.length<20) return;
  const far=idx.map(i=>[v.fromBufferAttribute(pos,i).distanceTo(wrist),i]).sort((a,b)=>b[0]-a[0]), nf=Math.max(5,Math.floor(far.length*.06)), tip=new T.Vector3();
  for(let j=0;j<nf;j++) tip.add(v.fromBufferAttribute(pos,far[j][1])); tip.multiplyScalar(1/nf);
  const hd=tip.clone().sub(wrist), L=hd.length(); hd.normalize();
  const pn=new T.Vector3(0,-1,0); pn.addScaledVector(hd,-pn.dot(hd)).normalize();   // the palm faces down in the bind pose
  const ca=new T.Vector3().crossVectors(hd,pn).normalize();                           // rolls the fingers towards the palm; points out of the thumb side
  const k0=FIST.k0*L, P0=wrist.clone().addScaledVector(hd,k0), q=new T.Quaternion();
  for(let j=0;j<idx.length;j++){ const i=idx[j]; v.fromBufferAttribute(pos,i); const sd=v.clone().sub(wrist).dot(hd); if(sd<=k0) continue;
    const t=Math.min(1,(sd-k0)/(L-k0)); q.setFromAxisAngle(ca,FIST.ang*t*Math.min(1,wts[j]/.8));
    v.sub(P0).applyQuaternion(q).add(P0); pos.setXYZ(i,v.x,v.y,v.z); if(nor){ n.fromBufferAttribute(nor,i).applyQuaternion(q); nor.setXYZ(i,n.x,n.y,n.z); } }
  pos.needsUpdate=true; if(nor) nor.needsUpdate=true; geo.computeBoundingSphere();
  const c=P0.clone().addScaledVector(pn,FIST.palm);   // the middle of the closed fingers
  tr.fist={c:c.applyMatrix4(Bi), a:ca.clone().transformDirection(Bi)}; window.__fist={L:+L.toFixed(3),n:idx.length,hd:hd.toArray().map(x=>+x.toFixed(2)),ca:ca.toArray().map(x=>+x.toFixed(2))}; }
/* v23k. His note: "thats not how someone holds a mic, find a rigged hand". Tripp's model has no finger bones, so his right hand is now a real
   rigged hand: Genesis 9's own right hand (Daz), closed round the mic by Daz's authored Grasp controls (fingers .74, thumb .9), taken out of
   Blender in the wrist's frame (daz/s7_hand.py -> tripp-hand.json: u along the hand, v towards the palm, w out of the thumb side). It rides his
   hand bone, scaled to his hand, in a black leather glove; his own hand past the cuff folds away inside it. The mic's handle runs through the
   grip the fingers make: its axis is fitted through the four fingers' curl circles, and the handle is as thick as that grip. */
async function handGrip(tr){ const H=await (await fetch('tripp-hand.json')).json();
  const sm=tr.m, sk=sm.skeleton, hi=sk.bones.findIndex(b=>b.name==='RightHand'); if(hi<0) throw new Error('no RightHand');
  const geo=sm.geometry, pos=geo.attributes.position, si=geo.attributes.skinIndex, sw=geo.attributes.skinWeight;
  const Bi=sk.boneInverses[hi], wrist=new T.Vector3().setFromMatrixPosition(Bi.clone().invert()), v=new T.Vector3();
  const idx=[]; for(let i=0;i<pos.count;i++){ let w=0; for(let k=0;k<4;k++) if(_gcA(si,i,k)===hi) w+=_gcA(sw,i,k); if(w>.25) idx.push(i); }
  if(idx.length<20) throw new Error('hand verts');
  const far=idx.map(i=>[v.fromBufferAttribute(pos,i).distanceTo(wrist),i]).sort((a,b)=>b[0]-a[0]), nf=Math.max(5,Math.floor(far.length*.06)), tip=new T.Vector3();
  for(let j=0;j<nf;j++) tip.add(v.fromBufferAttribute(pos,far[j][1])); tip.multiplyScalar(1/nf);
  const hd=tip.clone().sub(wrist), L=hd.length(); hd.normalize();
  const pn=new T.Vector3(0,-1,0); pn.addScaledVector(hd,-pn.dot(hd)).normalize(); const ca=new T.Vector3().crossVectors(hd,pn).normalize();
  const s=L/H.Lopen*(window.HAND_S||1), cuff=(window.HAND_CUFF||.22)*L, P0=wrist.clone().addScaledVector(hd,cuff*.5);
  for(const i of idx){ v.fromBufferAttribute(pos,i); if(v.clone().sub(wrist).dot(hd)>cuff) pos.setXYZ(i,P0.x,P0.y,P0.z); }   // his own hand folds away inside the glove
  pos.needsUpdate=true; geo.computeBoundingSphere();
  const f=(u,vv,w,out)=>out.copy(wrist).addScaledVector(hd,u*s).addScaledVector(pn,vv*s).addScaledVector(ca,w*s);
  const n=H.pos.length/3, PA=new Float32Array(n*3), NA=new Float32Array(n*3), q=new T.Vector3(), d=new T.Vector3();
  for(let i=0;i<n;i++){ f(H.pos[i*3],H.pos[i*3+1],H.pos[i*3+2],q).applyMatrix4(Bi); PA[i*3]=q.x; PA[i*3+1]=q.y; PA[i*3+2]=q.z;
    d.set(0,0,0).addScaledVector(hd,H.nor[i*3]).addScaledVector(pn,H.nor[i*3+1]).addScaledVector(ca,H.nor[i*3+2]).transformDirection(Bi); NA[i*3]=d.x; NA[i*3+1]=d.y; NA[i*3+2]=d.z; }
  const g=new T.BufferGeometry(); g.setAttribute('position',new T.BufferAttribute(PA,3)); g.setAttribute('normal',new T.BufferAttribute(NA,3)); g.setIndex(H.idx);
  const hm=new T.Mesh(g,new T.MeshStandardMaterial({color:0x17171a,roughness:.4,metalness:.2})); hm.matrixAutoUpdate=false; hm.frustumCulled=false; sm.add(hm); tr.hand=hm;   // rides with his body's visibility; placed on the hand bone every frame
  const c=f(H.grip[0],H.grip[1],H.grip[2],new T.Vector3()).applyMatrix4(Bi), a=new T.Vector3().addScaledVector(hd,H.axis[0]).addScaledVector(pn,H.axis[1]).addScaledVector(ca,H.axis[2]).normalize().transformDirection(Bi);
  tr.fist={c,a}; FIST.head=window.HAND_HEAD||.13;
  if(tr.mic){ const body=tr.mic.children[0], rAt=.019-.006*(FIST.head/.25), rr=H.r*s*.97; body.scale.set(rr/rAt,1,rr/rAt); }   // the handle as thick as his grip
  window.__hand={L:+L.toFixed(3),s:+s.toFixed(3),r:+(H.r*s).toFixed(4),n,cuffVerts:idx.length}; }
const _ka=new T.Vector3(), _kb=new T.Vector3(), _kc=new T.Vector3(), _kq=new T.Quaternion(), _kp=new T.Quaternion(), _km=new T.Vector3();
/* v23 his note: when he raises an arm the shoulder looked out of place and twisted. The rig's collarbone never moved, so an arm above about
   75 degrees bent the shoulder mesh at the armpit. Now the collarbone lifts with the arm (45% of the raise past 75 degrees), and the arm is
   counter-turned so it keeps the captured direction: the shoulder joint rises the way a real shoulder does. */
const _sa=new T.Vector3(), _sb=new T.Vector3(), _sc=new T.Vector3(), _sd=new T.Vector3(), _sqa=new T.Quaternion(), _sqb=new T.Quaternion(), _sqc=new T.Quaternion();
function shoulderAssist(P){ if(!P.__sb){ const B={}; P.root.traverse(o=>{ if(o.isBone) B[o.name]=o; }); P.__sb=B; } const B=P.__sb; if(!B.Spine02||!B.neck) return; P.root.updateMatrixWorld(true);
  B.Spine02.getWorldPosition(_sa); B.neck.getWorldPosition(_sb); const up=_sc.copy(_sb).sub(_sa).normalize();
  for(const s of ['Left','Right']){ const sh=B[s+'Shoulder'], ar=B[s+'Arm'], fo=B[s+'ForeArm']; if(!sh||!ar||!fo) continue;
    ar.getWorldPosition(_sa); fo.getWorldPosition(_sb); const dir=_sb.sub(_sa).normalize(); const el=Math.acos(clamp(-dir.dot(up),-1,1)), thr=1.31; if(el<=thr) continue;
    const k=Math.min(window.SH_MAX===undefined?.35:window.SH_MAX,(el-thr)*(window.SH_K===undefined?.45:window.SH_K));   /* v23: capped near 30°, the most a real collarbone lifts */ sh.getWorldPosition(_sd); const cl=_sa.clone().sub(_sd).normalize(); const ax=_sd.crossVectors(cl,up); if(ax.lengthSq()<1e-8) continue; ax.normalize();
    const qW=_sqa.setFromAxisAngle(ax,k); sh.getWorldQuaternion(_sqb); const Pw=_sqb.clone();
    sh.parent.getWorldQuaternion(_sqc); const pinv=_sqc.clone().invert(); sh.quaternion.premultiply(pinv.multiply(qW).multiply(_sqc));
    const qi=qW.clone().invert(); ar.quaternion.premultiply(Pw.clone().invert().multiply(qi).multiply(Pw)); sh.updateMatrixWorld(true); } }
function micArm(P){ const K=P.ik; P.root.updateMatrixWorld(true); const w=P.ikW===undefined?1:P.ikW, qa=K.arm.quaternion.clone(), qf=K.fore.quaternion.clone();
  K.head.getWorldPosition(_km); K.neck.getWorldPosition(_kc); const up=_ka.copy(_km).sub(_kc).normalize();
  /* v20: the mouth is found from the way his head and shoulders face, so when he leans or lands a hop the mic stays at his mouth instead of his eyes */
  const sR=new T.Vector3(), sL=new T.Vector3(); K.arm.getWorldPosition(sR); (K.la||K.arm).getWorldPosition(sL); const right=sR.sub(sL); right.addScaledVector(up,-right.dot(up)); if(right.lengthSq()<1e-6) right.set(-1,0,0); right.normalize();
  const fwd=new T.Vector3().crossVectors(up,right).normalize();   // up x his right = the way he faces (+z at rest)
  const mouth=new T.Vector3().copy(_km).addScaledVector(up,.07).addScaledVector(fwd,.12);   /* v19: the head bone sits at the base of the skull: the mouth is above and in front of it, so the mic was landing on his chest */                       // bones live in the body's own frame: +z is forward
  const tgt=_kb.copy(mouth).addScaledVector(up,-.24).addScaledVector(fwd,.1).addScaledVector(right,.06);
  if(P.fist) tgt.addScaledVector(up,-FIST.low);   /* v23: the hand a little lower now the mic stands up out of the fist */   /* v21: the hand at the chest-collar line, the mic angled up to his lips, so his face stays clear */                        // the hand: under the chin, a little to his right
  { /* v20: a two-bone arm solve with the elbow held down and out to his right, so the arm can never fold the wrong way (the old step-by-step solve broke it in the close-up) */
    const S=new T.Vector3(), E=new T.Vector3(), W=new T.Vector3(); K.arm.getWorldPosition(S); K.fore.getWorldPosition(E); K.hand.getWorldPosition(W);
    const l1=S.distanceTo(E), l2=E.distanceTo(W), D=new T.Vector3().copy(tgt).sub(S); let d=D.length(); D.normalize(); d=clamp(d,Math.abs(l1-l2)+.01,l1+l2-.01);
    const pole=new T.Vector3(-.45,-1,.15).normalize(); pole.addScaledVector(D,-pole.dot(D)).normalize();
    const al=(l1*l1-l2*l2+d*d)/(2*d), hh=Math.sqrt(Math.max(0,l1*l1-al*al)), E2=new T.Vector3().copy(S).addScaledVector(D,al).addScaledVector(pole,hh), T2=new T.Vector3().copy(S).addScaledVector(D,d);
    const turn=(bone,from,to,piv)=>{ const a1=from.clone().sub(piv).normalize(), b1=to.clone().sub(piv).normalize(); _kq.setFromUnitVectors(a1,b1); bone.parent.getWorldQuaternion(_kp); const inv=_kp.clone().invert(); bone.quaternion.premultiply(inv.multiply(_kq).multiply(_kp)); bone.updateMatrixWorld(true); };
    turn(K.arm,E,E2,S); K.fore.getWorldPosition(E); K.hand.getWorldPosition(W); turn(K.fore,W,T2,E); }
  if(w<1){ K.arm.quaternion.copy(qa.slerp(K.arm.quaternion,w)); K.fore.quaternion.copy(qf.slerp(K.fore.quaternion,w)); K.arm.updateMatrixWorld(true); }   /* v20: on the jump the mic arm goes out wide with the move */
  /* v22: the mic lives in his hand. The hand is turned to point the way the mic points (up to his lips when he sings, along the arm when the arm
     goes up on a big move, blended in between, never snapping), and the mic's grip sits in his palm, just past the wrist. */
  if(P.fist){ const F=P.fist, fw=new T.Vector3().copy(F.c).applyMatrix4(K.hand.matrixWorld), aw=new T.Vector3().copy(F.a).transformDirection(K.hand.matrixWorld);
    const md=new T.Vector3().copy(mouth).sub(fw).normalize(), q=new T.Quaternion().slerp(new T.Quaternion().setFromUnitVectors(aw,md),w);
    K.hand.parent.getWorldQuaternion(_kp); const inv=_kp.clone().invert(); K.hand.quaternion.premultiply(inv.multiply(q).multiply(_kp)); K.hand.updateMatrixWorld(true);
    fw.copy(F.c).applyMatrix4(K.hand.matrixWorld); aw.copy(F.a).transformDirection(K.hand.matrixWorld);
    P.mic.position.copy(fw).addScaledVector(aw,FIST.head); P.mic.quaternion.setFromUnitVectors(YAX,aw); return; }
  K.hand.getWorldPosition(_ka); K.fore.getWorldPosition(_kc); const fd=_kc.sub(_ka).negate().normalize(), md=new T.Vector3().copy(mouth).sub(_ka).normalize(), dir=fd.lerp(md,w).normalize();
  { const hy=new T.Vector3(0,1,0).applyQuaternion(K.hand.getWorldQuaternion(_kq)); const q=new T.Quaternion().setFromUnitVectors(hy,dir); K.hand.parent.getWorldQuaternion(_kp); const inv=_kp.clone().invert(); K.hand.quaternion.premultiply(inv.multiply(q).multiply(_kp)); K.hand.updateMatrixWorld(true); }
  P.mic.position.copy(_ka).addScaledVector(dir,.085+.11); P.mic.quaternion.setFromUnitVectors(YAX,dir); }
// v21. Blonde: on one girl, the dark texels of the hair (the crown, the back of the head and the ponytail; never the face) turn honey blonde.
function blondeMat(m){ const prev=m.onBeforeCompile, HU={uHY:{value:9},uHZ:{value:0},uFace:{value:9},uBrow:{value:9},uTail:{value:9}}; m.userData.HU=HU;
  m.onBeforeCompile=sh=>{ prev(sh); Object.assign(sh.uniforms,HU);
    sh.vertexShader='varying vec3 vP0;\n'+sh.vertexShader.replace('#include <begin_vertex>','#include <begin_vertex>\n  vP0=position;');
    sh.fragmentShader='varying vec3 vP0; uniform float uHY,uHZ,uFace,uBrow,uTail;\n'+sh.fragmentShader.replace('diffuseColor*=texelColor;',`float hz=step(uHY,vP0.y)*(1.-step(uFace,vP0.z)*(1.-step(uBrow,vP0.y)))+step(uTail,vP0.y)*(1.-step(uHY,vP0.y))*(1.-step(uHZ-.07,vP0.z));
  float dk=(1.-smoothstep(.1,.24,lum))*(1.-smoothstep(.12,.3,sat)), hb=clamp(hz,0.,1.)*dk;
  texelColor.rgb=mix(texelColor.rgb,vec3(.86,.66,.36)*(.45+2.2*lum),hb);
  diffuseColor*=texelColor;`); };
  const k=m.customProgramCacheKey; m.customProgramCacheKey=()=>k()+'blonde'; return m; }
function blondeFit(sm){ const pa=sm.geometry.attributes.position; let top=-1e9, bot=1e9; for(let i=0;i<pa.count;i++){ const y=pa.getY(i); if(y>top) top=y; if(y<bot) bot=y; }
  const H=top-bot, hy=top-.115*H; let zs=0, n=0, zmax=-1e9; for(let i=0;i<pa.count;i++){ if(pa.getY(i)>hy){ zs+=pa.getZ(i); n++; if(pa.getZ(i)>zmax) zmax=pa.getZ(i); } } const hz=n?zs/n:0;
  const U=sm.material.userData.HU; U.uHY.value=hy; U.uHZ.value=hz; U.uFace.value=hz+(zmax-hz)*.35; U.uBrow.value=top-.045*H; U.uTail.value=top-.2*H; }
// v20. Tripp performs: the big moves land on the hits and the words. [from, to, clip, clip time at 'from', speed, how much the mic arm stays at his mouth]
const TPERF=[[46.45,48.4,'a298',.2,1,1],          // v23: lands on the mark off the last step and throws both hands up as NOCHE lands                      // and throws both hands up as NOCHE lands
  [48.4,53.57,'a412',1.0,1,1],                      // victory: the free arm up to the room, through his close-up
  [53.57,55.97,'a417',.03,1,1],   /* t23: lands on the drop at 55.02 (his note: the hit came early); was [52.6,55.0] landing 54.05 */
  /* (v22 note kept for history) */                      // hops with the arm raised as the room turns to ORO   /* v22: lands on the beat at 54.05 (was 53.78, between beats), so the crack, the cryo and the music all hit with his feet */
  [55.97,57.65,'a412',4.87,1,1]];                    // and both arms high again into the ORO hit
function tperfAt(t){ for(const e of TPERF) if(t>=e[0]&&t<e[1]) return e; return null; }
// v20. The body stays on its route: whatever a move does, the hips are held over the point the route puts him on (height and turn come from the
// move), and when he is standing a foot that is down stays planted where it landed until it lifts again, so nothing slides or drifts off his line.
/* v23k. His notes: "the turn is not natural ... the turn when he gets there is not realistic" and "his feet have a floppy unplanted feeling".
   Turns: two real step-turns from the Meshy mocap library (576 Idle Turn Left, 586 Idle Turn Right) on his rig. Their own hip turn was taken out of
   the clip (meshy/anim -> anim/a576.json, a586.json) and is given to his whole body instead, along the clip's own turning curve, scaled to the turn he
   needs, so his feet step him round. Feet: when a foot is down it locks where it landed and stays flat, riding with the turntable while he is on it,
   easing in and out over a tenth of a second; on the six turntable stairs each foot lands on its own step. */
const TURN_CURVE={a576:[0.0, 0.0, 0.032, 0.066, 0.099, 0.132, 0.16, 0.184, 0.206, 0.228, 0.25, 0.272, 0.289, 0.306, 0.323, 0.344, 0.371, 0.404, 0.44, 0.479, 0.519, 0.563, 0.61, 0.66, 0.712, 0.768, 0.827, 0.887, 0.945, 1.0],a586:[-0.0, -0.0, 0.021, 0.047, 0.073, 0.098, 0.126, 0.153, 0.179, 0.205, 0.229, 0.254, 0.281, 0.31, 0.34, 0.369, 0.398, 0.424, 0.452, 0.481, 0.513, 0.546, 0.578, 0.61, 0.642, 0.674, 0.707, 0.741, 0.776, 0.813, 0.853, 0.895, 0.937, 0.975, 1.0]}, TURNS=[{t0:56.9,t1:57.7,dur:.967,first:true},{t0:62.1,t1:63.25,dur:1.133}];
function curveAt(c,u){ const x=clamp(u,0,1)*(c.length-1), i=Math.min(c.length-2,Math.floor(x)); return lerp(c[i],c[i+1],x-i); }
function trippTurn(P,t,yawTgt){ let W=null; for(const w of TURNS) if(t>=w.t0&&t<w.t1){ W=w; break; } if(!W){ P.turnW=null; return null; }
  if(P.turnW!==W){ P.turnW=W; P.turnY0=P.yaw; P.turnD=W.first?Math.PI:wrapA(yawTgt-P.yaw); if(Math.abs(P.turnD)<.2) P.turnD=0; }
  const clip=P.turnD>=0?'a576':'a586', u=(t-W.t0)/(W.t1-W.t0), f=curveAt(TURN_CURVE[clip],u), y0=W.first?-S.discA:P.turnY0;   // the first turn starts from facing the house, which turns with the turntable
  P.yaw=y0+P.turnD*f; if(P.act[clip]) P.act[clip].time=u*W.dur; return {clip}; }
const _fF=new T.Vector3(), _fQ=new T.Quaternion(), _fQ2=new T.Quaternion(), _fP=new T.Quaternion(), _fV=new T.Vector3();
const stairTop=z=>z<=-12.5?STAGE_H:z>=-10.8?0:(6-Math.ceil((z+12.5)/.34))/6*STAGE_H;   // the six steps of the centre stair on the turntable (b2-front.js)
function trippFeet(P,t,dt){ const B=P.B; if(!B||!B.LeftFoot||typeof aerReach!=='function') return; P.root.updateMatrixWorld(true);
  const onDisc=t>=44.0&&t<59.75, base=P.m.position.y, F=P.feet||(P.feet={});
  for(const [up,lo,ft] of [['LeftUpLeg','LeftLeg','LeftFoot'],['RightUpLeg','RightLeg','RightFoot']]){ const Fb=B[ft]; if(!Fb||!B[up]||!B[lo]) continue; const st=F[ft]||(F[ft]={w:0,pin:null,q:null});
    Fb.getWorldPosition(_fF); const rel=_fF.y-base; st.lo=st.lo===undefined?rel:Math.min(st.lo+dt*.02,rel);   // the ankle's height when the foot is flat on its own floor
    // the floor under this foot: a step of the turntable stair, or the level the body is carried at
    let ground=base; if(onDisc){ _fV.copy(_fF).applyAxisAngle(YAX,S.discA); if(_fV.z<-10.45&&_fV.z>-12.95&&Math.abs(_fV.x)<1.4) ground=stairTop(_fV.z); }
    const tgt=_fV.copy(_fF); tgt.y+=ground-base;
    const down=rel<st.lo+.045; st.w=clamp(st.w+(down?1:-1)*dt/.1,0,1);
    if(down&&!st.pin){ st.pin=tgt.clone(); if(onDisc) st.pin.applyAxisAngle(YAX,S.discA); st.disc=onDisc; Fb.getWorldQuaternion(st.q||(st.q=new T.Quaternion())); if(onDisc) st.q.premultiply(_fQ.setFromAxisAngle(YAX,S.discA)); }
    if(!down&&st.w<=0) st.pin=null;
    if(st.pin){ const pw=_fF.copy(st.pin); if(st.disc) pw.applyAxisAngle(YAX,-S.discA); if(pw.distanceTo(tgt)>.5){ st.pin=null; } else tgt.lerp(pw,st.w); }
    Fb.getWorldPosition(_fF); if(_fF.distanceTo(tgt)>.003) aerReach(B[up],B[lo],Fb,tgt,6);
    if(st.pin&&st.q&&st.w>0){ _fQ2.copy(st.q); if(st.disc) _fQ2.premultiply(_fQ.setFromAxisAngle(YAX,-S.discA)); Fb.getWorldQuaternion(_fQ); _fQ.slerp(_fQ2,st.w); Fb.parent.getWorldQuaternion(_fP); Fb.quaternion.copy(_fP.invert().multiply(_fQ)); Fb.updateMatrixWorld(true); } } }

/* v23: his notes, "notice his legs going down stairs, there's something off" and "on his way back up he just walks straight instead of up stairs".
   The foot code above works in his body's own frame, so it never saw the steps: his feet slid through them on the body's slope. On the centre stair
   each foot is now put on its own tread, one foot per step, step over step: the planted foot holds its tread while his body passes over it and the
   other foot swings to the next-but-one tread on an arc that clears the step edge (higher going up), then they swap. The strut/walk clip still
   drives his hips, spine and arms; only the legs are placed. */
const STAIR_PL=[-12.95,-12.68,-12.33,-11.99,-11.65,-11.31,-10.97,-10.63,-10.3], FOOT_H=.165, _ts1=new T.Vector3(), _ts2=new T.Vector3(), _ts3=new T.Vector3(), _tsM=new T.Matrix4(), _tsQ=new T.Quaternion(), _tsQ2=new T.Quaternion();
const treadH=z=>z<=-12.5?STAGE_H:z>=-10.8?0:stairTop(z);
function trippStairs(P,t){ const B=P.B; if(!B||!B.LeftFoot||!B.RightFoot||typeof aerReach!=='function') return;
  if(!((t>=44.0&&t<46.7)||(t>=57.6&&t<60.0))) return;
  const L=_ts1.copy(P.m.position).applyAxisAngle(YAX,S.discA); if(Math.abs(L.x)>1.1) return;          // his body, on the turntable
  const up=t>=50, s=up?-1:1, Z=up?STAIR_PL.slice().reverse():STAIR_PL, lead=.12, db=s*L.z, dc=Z.map(z=>s*z-lead), n=Z.length;
  if(db<=dc[0]||db>=dc[n-1]) return;
  let j=0; while(j<n-2&&db>=dc[j+1]) j++;
  const u=clamp((db-dc[j])/(dc[j+1]-dc[j]),0,1), w=smooth(clamp((db-dc[0])/.35,0,1))*smooth(clamp((dc[n-1]-db)/.35,0,1));
  if(!P.__fq){ P.__fq={}; const sk=P.m.skeleton; for(const nm of ['LeftFoot','RightFoot']){ const i=sk.bones.indexOf(B[nm]); const M=new T.Matrix4().copy(sk.boneInverses[i]).invert(), q=new T.Quaternion(); M.decompose(new T.Vector3(),q,new T.Vector3()); P.__fq[nm]=q; } }
  const yaw=P.m.rotation.y+S.discA, lx=Math.cos(yaw), lz=-Math.sin(yaw);                                 // his left, on the turntable
  P.m.updateMatrixWorld(true); _tsM.copy(P.m.matrixWorld).invert();
  const foot=(k,side)=>{ const z=k<0?Z[0]-s*.3:Z[k]; return _ts2.set(L.x+side*.1*lx, treadH(z)+FOOT_H, z+side*.1*lz*.2).clone(); };
  // plant j is held by one foot; the other foot travels from plant j-1 to plant j+1. Even plants are the right foot.
  for(const [nm,side,up_,lo_] of [['RightFoot',-1,'RightUpLeg','RightLeg'],['LeftFoot',1,'LeftUpLeg','LeftLeg']]){
    const mine=(j%2===0)===(nm==='RightFoot'); let tg, plant;
    if(mine){ tg=foot(j,side); plant=1; }
    else { const a=foot(j-1,side), c=foot(j+1,side), e=u*u*(3-2*u); tg=a.lerp(c,e); tg.y+=(up?.2:.08)*Math.sin(Math.PI*u); plant=.35; }
    tg.applyAxisAngle(YAX,-S.discA).applyMatrix4(_tsM);                                                // turntable -> room -> his body's frame
    const Fb=B[nm]; Fb.getWorldPosition(_ts3); _ts3.lerp(tg,w); aerReach(B[up_],B[lo_],Fb,_ts3,8);
    Fb.parent.getWorldQuaternion(_tsQ); Fb.getWorldQuaternion(_tsQ2); _tsQ2.slerp(P.__fq[nm],w*plant*.85); Fb.quaternion.copy(_tsQ.invert().multiply(_tsQ2)); Fb.updateMatrixWorld(true); } }

/* v23: his note, the fist pump "makes his chest cave in": the Meshy hit clips (a412 most of all) swing his hips round as much as 80° while his feet
   stay planted, so his body corkscrews over his legs and his chest folds away from the house. His hips may turn at most 20° from his rest facing. */
const _hq1=new T.Quaternion(), _hq2=new T.Quaternion(), _hv=new T.Vector3();
function hipTwistCap(P,maxA){ const H=P.B&&P.B.Hips; if(!H) return; if(!P.__hq0) P.__hq0=H.quaternion.clone().set(...(P.__hqRest||[0,0,0,1]));
  if(!P.__hqRest){ const sk=P.m.skeleton, i=sk.bones.indexOf(H); const M=new T.Matrix4().copy(sk.boneInverses[i]).invert(); const q=new T.Quaternion(); M.decompose(new T.Vector3(),q,new T.Vector3()); H.parent.updateMatrixWorld(true); const pq=new T.Quaternion(); H.parent.getWorldQuaternion(pq); P.__hqRest=pq.invert().multiply(q).toArray(); P.__hq0=new T.Quaternion().fromArray(P.__hqRest); }
  H.parent.getWorldQuaternion(_hq1); const up=_hv.set(0,1,0).applyQuaternion(_hq1.invert()).normalize();      // straight up, in the hips' parent space
  const d=_hq2.copy(H.quaternion).multiply(_hq1.copy(P.__hq0).invert());                                      // the clip's turn of the hips away from rest
  const dot=d.x*up.x+d.y*up.y+d.z*up.z, tw=new T.Quaternion(up.x*dot,up.y*dot,up.z*dot,d.w).normalize(), ang=2*Math.atan2(Math.hypot(tw.x,tw.y,tw.z),tw.w);
  if(ang<=maxA) return; const sw=d.clone().multiply(tw.clone().invert()), keep=new T.Quaternion().slerp(tw,maxA/ang);   // swing stays, twist is cut back
  H.quaternion.copy(sw.multiply(keep).multiply(P.__hq0)); H.updateMatrixWorld(true); }
const _bl1=new T.Vector3();
function bodyLock(P,mode){ if(!P.B){ P.B={}; P.root.traverse(o=>{ if(o.isBone) P.B[o.name]=o; }); if(P.B.Hips) P.hip0=P.B.Hips.position.clone(); P.pin={}; }
  const B=P.B; if(!B.Hips) return; B.Hips.position.x=P.hip0.x; B.Hips.position.z=P.hip0.z; P.root.updateMatrixWorld(true);
  if(mode!=='sing'||typeof aerReach!=='function'){ P.pin={}; return; }
  for(const [up,lo,ft] of [['LeftUpLeg','LeftLeg','LeftFoot'],['RightUpLeg','RightLeg','RightFoot']]){ const F=B[ft]; if(!F||!B[up]||!B[lo]) continue; F.getWorldPosition(_bl1);
    P.floorY=P.floorY===undefined?_bl1.y:Math.min(P.floorY,_bl1.y); const down=_bl1.y<P.floorY+.06, pin=P.pin[ft];
    if(!down){ P.pin[ft]=null; continue; } if(!pin){ P.pin[ft]=_bl1.clone(); continue; }
    if(pin.distanceTo(_bl1)>.004){ _bl1.set(pin.x,Math.min(_bl1.y,pin.y+.02),pin.z); aerReach(B[up],B[lo],F,_bl1,4); } } }
function singerUpdate(dt){ if(!SING.ready) return; const t=FILM.on?FILM.t:-1, on=FILM.on&&t>=33.8&&S.room==='theatre', sk=smooth(clamp((t-37.9)/.45,0,1)), sw=1-smooth(clamp((t-37.8)/.6,0,1));   /* the spot lands on him with his line at 38.35 */   /* v19: no spot while he is in the tunnel; at the mouth it swings across and finds him */
  SING.on=on; for(const P of SING.parts) P.m.visible=on; for(const s of SING.spots) s.piv.visible=on&&t<76.5&&sk>0; SING.light.intensity=on&&t<76.5?(t<48?(window.TRIPP_SPOT_FAR||3.2):3.4)*sk*(window.__trippDim!==false?1+1.2*(1-SHOW.dim):1):0;   /* stronger while he is far away coming out of the tunnel, softer in his close-ups */ if(SING.pool){ SING.pool.visible=on&&t<76.5&&sk>0; SING.pool.material.opacity=.26*sk; }
  if(!on) return;
  for(const P of SING.parts){ const r=sAt(t,P.lat,_sv), p=r.p; P.m.position.copy(p); if(P.lat&&t>=43.9&&t<59.7){ r.mode='sing'; r.dir=null; }
    let yaw; if(r.mode==='sing'||!r.dir||r.dir.lengthSq()<1e-4){ yaw=Math.atan2(-p.x,-p.z)+Math.PI; if(t>=62.1) yaw=Math.atan2(-p.x,-p.z); }      // standing: face the house
    else yaw=Math.atan2(r.dir.x,r.dir.z);
    if((t>=46.0&&t<56.9)||(P.lat&&t>=43.9&&t<59.6)) yaw=-S.discA; if(!P.lat&&t>=56.9&&t<57.7) yaw=-S.discA+Math.PI;   // he turns to the stair before he climbs it                                                   // on the mark he faces the audience, and turns with them
    P.yaw=P.yaw===undefined?yaw:P.yaw+clamp(wrapA(yaw-P.yaw)*Math.min(1,dt*6),-dt*3.8,dt*3.8);
    const TN=P.lat===0&&P.act.a576&&P.act.a586?trippTurn(P,t,yaw):null; P.m.rotation.y=P.yaw;   /* v23k: real step-turns */
    const pf=P.lat===0&&r.mode==='sing'&&!TN?tperfAt(t):null; if(pf&&P.act[pf[2]]){ P.act[pf[2]].time=pf[3]+(t-pf[0])*pf[4]; } P.ikW=pf?pf[5]:1;
    { const mode=TN?TN.clip:pf&&P.act[pf[2]]?pf[2]:(P.act[r.mode]?r.mode:'walk'); let sum=0; for(const k in P.act){ const w=P.act[k].getEffectiveWeight(), tgt=k===mode?1:0, nw=w+(tgt-w)*Math.min(1,dt*5); P.act[k]._w=nw; sum+=nw; } for(const k in P.act) P.act[k].setEffectiveWeight(P.act[k]._w/Math.max(sum,1e-4)); }
    if(r.speed){ const sp=Math.min(r.speed,2.2); P._sp=P._sp===undefined?sp:P._sp+(sp-P._sp)*Math.min(1,dt*2.5);   /* v23: smoothed, so a change of segment never jolts his stride */
      if(P.act.walk&&P.gait) P.act.walk.setEffectiveTimeScale(clamp(P._sp/P.gait,.55,1.9)); if(P.act.strut&&P.gaitS) P.act.strut.setEffectiveTimeScale(clamp(P._sp/P.gaitS,.55,1.9)); }
    if(P.act.stairs){ const STS=window.STAIR_TS||(3*.9333/1.85); P.act.stairs.time=Math.max(0,t-44.35)*STS; }   /* three cycles, two steps each, from the top step to the bottom one */
    P.mixer.update(dt*(REDUCED?0:1)); bodyLock(P,P.lat===0?'free':r.mode); if(P.lat===0&&!TN){ try{ hipTwistCap(P,(window.HIP_TWIST||20)*D2R); }catch(e){ window.__htErr=String(e).slice(0,200); } } if(P.lat===0){ trippFeet(P,t,dt); try{ trippStairs(P,t); }catch(e){ window.__stErr=String(e&&e.stack||e).slice(0,300); } } if(P.lat===0){ SING.pos.copy(p); try{ trippLook(P,dt,t); coatStep(P,dt); }catch(e){} try{ shoulderAssist(P); }catch(e){ window.__shErr=String(e); } if(P.ik) micArm(P); if(P.hand&&P.ik){ P.hand.matrix.copy(P.ik.hand.matrixWorld); P.hand.matrixWorldNeedsUpdate=true; } } }
  // the spots: from the grid on the far side, above the house, onto his chest
  if(SING.pool) SING.pool.position.set(SING.pos.x,SING.pos.y+.04,SING.pos.z);
  const tgt=_sw.copy(SING.pos); tgt.y+=1.3; if(sw>0){ const rr=Math.max(1,Math.hypot(tgt.x,tgt.z)), ox=-tgt.z/rr, oz=tgt.x/rr; tgt.x+=ox*3.2*sw; tgt.z+=oz*3.2*sw; } SING.light.position.copy(pol(Math.atan2(SING.pos.x,-SING.pos.z)+Math.PI,9,ROOM_H-1.8)); SING.light.target.position.copy(tgt);
  SING.spots.forEach((s,i)=>{ const a=Math.atan2(SING.pos.x,-SING.pos.z)+Math.PI+(i?.38:-.38), src=pol(a,10.5,ROOM_H-1.8); s.piv.position.copy(src); const d=_sq.copy(tgt).sub(src), L=d.length(); s.piv.quaternion.setFromUnitVectors(_dn,d.normalize()); s.c.scale.set(1,L,1); s.m.uniforms.uI.value=.9*(.4+.6*S.haze)*sk*(window.__trippDim!==false?1+1.6*(1-SHOW.dim):1); }); if(SING.pool&&sw>0) SING.pool.position.set(tgt.x,SING.pos.y+.04,tgt.z); }
// ---- casting call (a working tool, not part of the show): one model in a row, each playing a different clip, drawn alone. window.__cast({model,tex,clips}) then window.__castDraw(t)
window.__cast=async o=>{ const sc=new T.Scene(); sc.background=new T.Color(0x1c1e26); sc.add(new T.HemisphereLight(0xffffff,0x505060,1.15)); const dl=new T.DirectionalLight(0xffffff,1.1); dl.position.set(2,5,6); sc.add(dl); sc.add(new T.GridHelper(40,40,0x556070,0x30343c));
  const [gltf,tx]=await Promise.all([loadGLB(o.model+'.glb'),texP(o.tex)]), rows=[], n=o.clips.length;
  for(let i=0;i<n;i++){ const root=T.SkeletonUtils.clone(gltf.scene); root.traverse(q=>{ if(q.isSkinnedMesh){ q.material=new T.MeshStandardMaterial({map:tx,skinning:true,roughness:.7}); q.frustumCulled=false; } }); root.position.x=(i-(n-1)/2)*1.6; root.rotation.y=o.yaw||0; sc.add(root); root.updateMatrixWorld(true);
    let c=null; try{ c=await motionClip(root,o.clips[i]); }catch(e){} const mixer=new T.AnimationMixer(root); if(c) mixer.clipAction(c).play(); rows.push({mixer,dur:c?c.duration:0}); }
  const cam=new T.PerspectiveCamera(30,innerWidth/innerHeight,.1,100), d=Math.max(5,n*1.6/(2*Math.tan(15*D2R)*innerWidth/innerHeight)+1.2); cam.position.set(0,1.25,d); cam.lookAt(0,.95,0);
  window.__castDraw=t=>{ for(const r of rows) r.mixer.setTime(t); renderer.setRenderTarget(null); renderer.render(sc,cam); }; return rows.map(r=>+r.dur.toFixed(2)); };

// ================= v23k: his go. Tripp's coat swings with real physics, and his head and eyes play to the camera =================
// The coat tails are found from the model itself: below the hips and well clear of the legs (the trousers hug the leg bones, the coat
// flares away from them). Those points get a weight (more toward the hem). In the shader they follow the hips more than the legs (so the
// tails don't scissor with each stride) and take a sway from a damped spring driven by how his hips actually move in the room.
function coatSetup(P){ const m=P.m, g=m.geometry, sk=m.skeleton, pos=g.attributes.position, si=g.attributes.skinIndex, sw=g.attributes.skinWeight; if(!pos||!si) return;
  const idx={}; sk.bones.forEach((b,i)=>{ idx[b.name]=i; }); const bp=n=>new T.Vector3().setFromMatrixPosition(new T.Matrix4().copy(sk.boneInverses[idx[n]]).invert());
  if(idx.Hips===undefined||idx.LeftUpLeg===undefined) return; const H=bp('Hips'), segs=[['LeftUpLeg','LeftLeg'],['LeftLeg','LeftFoot'],['RightUpLeg','RightLeg'],['RightLeg','RightFoot']].map(([a,b])=>[bp(a),bp(b)]);
  const armB=new Set(Object.keys(idx).filter(n=>/Arm|Hand|Shoulder|Foot|Toe/.test(n)).map(n=>idx[n])), FY=Math.max(bp('LeftFoot').y,bp('RightFoot').y), a=new Float32Array(pos.count), v=new T.Vector3(), q=new T.Vector3(), ab=new T.Vector3(); let n=0;
  for(let i=0;i<pos.count;i++){ v.fromBufferAttribute(pos,i); if(v.y>H.y+.02) continue; let dom=si.getX(i), wm=sw.getX(i); for(const [c,w] of [[si.getY(i),sw.getY(i)],[si.getZ(i),sw.getZ(i)],[si.getW(i),sw.getW(i)]]) if(w>wm){ wm=w; dom=c; } if(armB.has(dom)) continue;
    let d=9; for(const [s0,s1] of segs){ ab.subVectors(s1,s0); const t=clamp(q.subVectors(v,s0).dot(ab)/ab.lengthSq(),0,1); d=Math.min(d,q.copy(s0).addScaledVector(ab,t).distanceTo(v)); }
    const c=smooth(clamp((d-.115)/.06,0,1)), dep=smooth(clamp((H.y-.04-v.y)/.5,0,1)), ft=smooth(clamp((v.y-FY-.03)/.1,0,1)); a[i]=c*(.2+.8*dep)*ft;   /* v23k: his note, his feet went like flippers: shoes and anything at ankle height are never coat */ if(a[i]>.05) n++; }
  g.setAttribute('aCoat',new T.BufferAttribute(a,1)); const U={uSway:{value:new T.Vector3()},uHipI:{value:idx.Hips},uRig:{value:.4}}; P.coat={U,x:new T.Vector3(),v:new T.Vector3(),prev:null,prevYaw:null,n};
  const mat=m.material; mat.onBeforeCompile=sh=>{ Object.assign(sh.uniforms,U); sh.vertexShader='attribute float aCoat; uniform vec3 uSway; uniform float uHipI; uniform float uRig;\n'+sh.vertexShader.replace('#include <skinning_vertex>','#include <skinning_vertex>\n#ifdef USE_SKINNING\n { mat4 bhC=getBoneMatrix(uHipI); vec3 hpC=(bindMatrixInverse*(bhC*(bindMatrix*vec4(position,1.)))).xyz; transformed=mix(transformed,hpC,aCoat*uRig)+uSway*aCoat; }\n#endif'); };
  mat.customProgramCacheKey=()=>'trippcoat'; mat.needsUpdate=true; }
const _cw=new T.Vector3(), _ct=new T.Vector3(), _cy=new T.Vector3(0,1,0);
function coatStep(P,dt){ const C=P.coat; if(!C||!P.B||!P.B.Hips||dt<=0) return; P.m.updateMatrixWorld(); P.B.Hips.getWorldPosition(_cw); _cw.applyMatrix4(P.m.matrixWorld);
  if(!C.prev||dt>.2){ C.prev=_cw.clone(); C.prevYaw=P.yaw; return; } const vel=_ct.subVectors(_cw,C.prev).divideScalar(dt); C.prev.copy(_cw); const w=wrapA(P.yaw-C.prevYaw)/dt; C.prevYaw=P.yaw;
  const tgt=vel.multiplyScalar(-.05); if(tgt.length()>.14) tgt.setLength(.14); tgt.applyAxisAngle(_cy,-P.yaw); tgt.y=Math.min(tgt.y,.01); tgt.x+=clamp(-w*.035,-.07,.07);   /* v23k b: first pass swung out like a cape: half the lag, a third of the turn swing */   // the coat lags behind where he moves, and swings out when he turns
  const K=48, D=7.5, h=Math.min(dt,1/30), steps=Math.ceil(dt/h); for(let k=0;k<steps;k++){ const ax=K*(tgt.x-C.x.x)-D*C.v.x, ay=K*(tgt.y-C.x.y)-D*C.v.y, az=K*(tgt.z-C.x.z)-D*C.v.z; C.v.x+=ax*h; C.v.y+=ay*h; C.v.z+=az*h; C.x.addScaledVector(C.v,h); }
  if(C.x.length()>.16) C.x.setLength(.16); C.U.uSway.value.copy(C.x); }
// head and eyes: after the dance moves are applied, his head turns toward the camera (the house, or the lens on the close-ups), up to 35 degrees, smoothly
const _lh=new T.Vector3(), _lc=new T.Vector3(), _lq=new T.Quaternion(), _lp=new T.Quaternion(), _lf=new T.Vector3(), _ld=new T.Vector3(), _lI=new T.Quaternion();
function trippLook(P,dt,t){ if(!P.B||!P.B.Head||window.__trippLook===false) return; const head=P.B.Head, neck=P.B.neck||null; const on=FILM.on&&t<76.5?1:0; P.lookK=(P.lookK||0)+clamp(on-(P.lookK||0),-dt*2,dt*2); if(P.lookK<.01) return;
  if(!P.headBindQ){ const sk=P.m.skeleton, i=sk.bones.indexOf(head); if(i<0) return; const M=new T.Matrix4().copy(sk.boneInverses[i]).invert(); P.headBindQ=new T.Quaternion().setFromRotationMatrix(M); }
  P.root.updateMatrixWorld(true); P.m.updateMatrixWorld(); head.getWorldPosition(_lh); _lh.applyMatrix4(P.m.matrixWorld); _ld.subVectors(camera.position,_lh); if(_ld.lengthSq()<1e-4) return; _ld.normalize();
  head.getWorldQuaternion(_lq); _lp.setFromRotationMatrix(P.m.matrixWorld).multiply(_lq).multiply(_lI.copy(P.headBindQ).invert()); _lf.set(0,0,1).applyQuaternion(_lp).normalize();   // where his face points now, in the room
  const ang=Math.acos(clamp(_lf.dot(_ld),-1,1)); const lim=35*Math.PI/180, k=(ang>1e-3?Math.min(1,lim/ang):0)*.6*P.lookK; const q=new T.Quaternion().setFromUnitVectors(_lf,_ld); q.slerp(_lI.identity(),1-k).normalize();   // 60% of the way, at most 35 degrees
  P.lookQ=P.lookQ?P.lookQ.slerp(q,Math.min(1,dt*4)):q.clone(); const qq=P.lookQ;
  const apply=(bone,f)=>{ const part=new T.Quaternion().slerp(qq,f); const wq=bone.getWorldQuaternion(new T.Quaternion()); const mw=new T.Quaternion().setFromRotationMatrix(P.m.matrixWorld); const wr=mw.clone().multiply(wq); const nw=part.multiply(wr); const pw=bone.parent.getWorldQuaternion(new T.Quaternion()); const pr=mw.clone().multiply(pw); bone.quaternion.copy(pr.invert().multiply(nw)); bone.updateMatrixWorld(true); };
  if(neck&&neck!==head){ apply(neck,.35); apply(head,.65); } else apply(head,1); }

await __tick();
// ================= THE AISLES: the four teams flood the house for the vote =================
// As the room votes, eighteen dancers in the four team colours (the app's colours) run down Stage 1's thrust stairs and up all three
// aisles and the cross-aisle, and dance among the audience to get the room going. Film only.
const AISLE={ready:false,parts:[]};
const _av=new T.Vector3(), _aw=new T.Vector3();
// [radius from the focus (rho), distance from the centre line (d)] — the centre aisle takes two abreast, the side aisles one
const ASPOTS=[...[22.3,24.2,26.1,28.0,29.9,33.7,35.6,37.5,39.4,41.3].map((r,n)=>[r,n%2?.55:-.55]),   /* v19: ten up the centre aisle, side to side, clear of the cross-aisle */
  ...[1,-1].flatMap(s=>[22.6,25.2,27.6,29.6,34.2,36.8,39.6].map(r=>[r,s*LAY.sideC]))];                  // seven up each side aisle
// more of them turn off the aisles: into the cross-aisle between the blocks, and along the walkway behind the last row
const WALK_RHO=43.05;
const ASPOTS2=[...Array.from({length:20},(_,j)=>{ const d=-11.4+j*1.2; return [LAY.cross.rho+(j%2?.4:-.4),d,Math.abs(d)<2.9?0:Math.sign(d)*LAY.sideC]; }),   /* v19: twenty right across the cross-aisle, staggered front and back */
  ...[1,-1].flatMap(s=>[[WALK_RHO,s*1.5,0],[WALK_RHO,s*(LAY.sideC-1.6),s*LAY.sideC],[WALK_RHO,s*3.1,0]])];
// v19: a fixed colour for every spot, chosen so no two neighbours share a team colour and the four colours come out even
function aisleColours(ALL){ const P=ALL.map(([r,d])=>[r*Math.sin(d/r),r*Math.cos(d/r)]), C=[], n=[0,0,0,0], ord=ALL.map((p,i)=>i).sort((a,b)=>ALL[a][1]-ALL[b][1]||ALL[a][0]-ALL[b][0]);
  for(const i of ord){ let best=0, bs=1e9; for(let k=0;k<4;k++){ let sc=n[k]*2; for(let j=0;j<ALL.length;j++){ if(C[j]!==k) continue; const dd=Math.hypot(P[i][0]-P[j][0],P[i][1]-P[j][1]); sc+=dd<3.4?100:dd<6.5?30:dd<9?5:0; } if(sc<bs){ bs=sc; best=k; } } C[i]=best; n[best]++; }
  return C; }
const aLocal=(rho,d,out)=>{ const psi=d/rho; out.set(rho*Math.sin(psi),0,-SP.fz+rho*Math.cos(psi)); out.y=yAt(out.x,out.z); return out; };
async function loadAisle(){ if(!T.SkeletonUtils) return; const IDENT=new T.Matrix4(), clips={}, mats={}, tex={};
  const ALL0=ASPOTS.concat(ASPOTS2), order=ALL0.map((p,i)=>i).sort((a,b)=>ALL0[b][0]-ALL0[a][0]);          // the furthest go first
  const ALL=ASPOTS.concat(ASPOTS2), COLS=aisleColours(ALL);
  for(let i=0;i<ALL.length;i++){ const [rho,d,via]=ALL[i], k=COLS[i], model=i%2?'dancer-m2':'dancer-f2';
    const gltf=await loadGLB(model+'.glb'); tex[model]=tex[model]||await texP(model+'.jpg');
    const key=model+k; if(!mats[key]){ const m=teamMat(tex[model],TEAMS4[k].hex); m.emissive=new T.Color(TEAMS4[k].hex); m.emissiveIntensity=.22; mats[key]=m; }
    const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm); scene.add(root); root.updateMatrixWorld(true);
    const clip=async n=>clips[model+n]||(clips[model+n]=await motionClip(root,n));
    const run=await clip(['a15','a110','a14'][i%3])   /* v18b: real looping runs (one of them waves as it runs); the old clip was a one-off jump that snapped every two seconds */, dance=await clip(['a49','a301','a66','a64','a84','a70'][i%6]);
    const m=new T.SkinnedMesh(geo,mats[key]); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; m.visible=false; scene.add(m);
    const mixer=new T.AnimationMixer(root), act={run:mixer.clipAction(run),dance:mixer.clipAction(dance)}; act.run.play(); act.dance.play(); act.run.setEffectiveTimeScale(1.0); act.dance.setEffectiveWeight(0); mixer.update(i*.37);
    // the route: the top of the thrust stair in line with the aisle, the foot of it on the apron, then up the aisle
    const aisleX=via!==undefined?via:(Math.abs(d)>2?Math.sign(d)*LAY.sideC:0), side=aisleX?(i%2?.7:-.7):(d>=0?.95:-.95);   // the lit mark at the foot of each stair is stepped round, never run through
    const top=new T.Vector3(aisleX+side*.5,STAGE_H,aisleX?-11.9:-12.7), foot=new T.Vector3(aisleX+side,0,-10.9), pass=new T.Vector3(aisleX+side*.9,0,-9.3), dest=aLocal(rho,d,new T.Vector3());
    const t0=66.4+order.indexOf(i)*.09, t1=t0+.9, t1b=t1+foot.distanceTo(pass)/3.4; let t2=t1b+dest.distanceTo(pass)/3.4, turn=null;
    if(via!==undefined){ const dA=aisleX+(i%2?.4:-.4), len1=rho-(SP.fz+pass.z), len2=Math.abs(d-dA); turn={rho,dA,d,tj:t1b+Math.max(.1,len1)/3.6,rho0:SP.fz+pass.z}; t2=turn.tj+len2/3.2; }   // up the aisle to the junction, then along the cross-aisle or the walkway
    AISLE.parts.push({m,mixer,act,top,foot,pass,dest,t0,t1,t1b,t2,turn,face:(i%3-1)*.75+(d<0?.25:-.25)}); }
  AISLE.ready=true; }
JOBS.push(loadAisle);
function aisleUpdate(dt){ if(!AISLE.ready) return; const t=FILM.on?FILM.t:-1, on=FILM.on&&S.room==='theatre';
  for(const P of AISLE.parts){ const vis=on&&t>=P.t0; P.m.visible=vis; if(!vis) continue;
    let p=_av, moving=true, dir=null;
    if(t<P.t1){ p.copy(P.top).lerp(P.foot,(t-P.t0)/(P.t1-P.t0)); dir=_aw.copy(P.foot).sub(P.top); }
    else if(t<P.t1b){ const u=(t-P.t1)/(P.t1b-P.t1); p.copy(P.foot).lerp(P.pass,u); p.y=yAt(p.x,p.z); dir=_aw.copy(P.pass).sub(P.foot); }
    else if(t<P.t2&&P.turn){ const T_=P.turn; let rho, d; if(t<T_.tj){ const u=(t-P.t1b)/(T_.tj-P.t1b); rho=lerp(T_.rho0,T_.rho,u); d=lerp(P.pass.x,T_.dA,Math.min(1,u*3)); } else { const u=(t-T_.tj)/(P.t2-T_.tj); rho=T_.rho; d=lerp(T_.dA,T_.d,u); }
      aLocal(rho,d,p); P.prev=P.prev||new T.Vector3().copy(p); dir=_aw.copy(p).sub(P.prev); if(dir.lengthSq()<1e-6) dir.set(0,0,1); P.prev.copy(p); }
    else if(t<P.t2){ const u=(t-P.t1b)/(P.t2-P.t1b); p.copy(P.pass).lerp(P.dest,u); p.y=yAt(p.x,p.z); dir=_aw.copy(P.dest).sub(P.pass); }
    else { p.copy(P.dest); moving=false; }
    let yaw=moving?Math.atan2(dir.x,dir.z):P.face; yaw-=S.discA;                                  // standing: they face the house, turned to the seats either side
    P.m.position.copy(p).applyAxisAngle(YAX,-S.discA); P.yaw=P.yaw===undefined?yaw:P.yaw+wrapA(yaw-P.yaw)*Math.min(1,dt*7); P.m.rotation.y=P.yaw;
    const wr=P.act.run.getEffectiveWeight(), tg=moving?1:0; P.act.run.setEffectiveWeight(wr+(tg-wr)*Math.min(1,dt*5)); P.act.dance.setEffectiveWeight(1-P.act.run.getEffectiveWeight());
    P.mixer.update(dt*(REDUCED?0:1)); }
  // as the camera rises to the wide overhead, they fade away and leave the room clean
  const fo=on?1-clamp((t-77.0)/1.6,0,1):1; for(const P of AISLE.parts){ const m=P.m.material; if(m.opacity!==fo){ m.transparent=fo<1; m.opacity=fo; m.depthWrite=fo>=1; } if(fo<=0) P.m.visible=false; } }

await __tick();
// ================= THE RIG, FILLED OUT: a few hundred fixtures with real beams =================
// Spots throw narrow, hard-edged beams; washes throw wide, soft ones. They hang on every ring over the audience, on the throw ring
// and on each stage's truss. The centre rings aim out to the front of the stages, the stage trusses flood their own stage in its
// team colour, and the whole rig is cued to the song: level by section, chases on the beat, everything up on the big hits.
const RIG2={beams:[],ready:false};
{ /* v23 lights (his ask, the beams read as lasers): softer, wider beams with haze drifting through them, pools of colour where they land,
     side and back light on the featured stage's dancers, lens glow, lasers only on the hits. LX_OFF=1 brings back the old rig. */
  const LXOFF=!!window.LX_OFF;
  const BVS='attribute vec3 aCol; attribute float aI, aSoft; varying vec3 vN, vV, vC, vW; varying float vL, vI, vS; void main(){ vec4 w=instanceMatrix*vec4(position,1.0); vW=(modelMatrix*w).xyz; vec4 mv=modelViewMatrix*w; vN=normalize(normalMatrix*mat3(instanceMatrix)*normal); vV=normalize(-mv.xyz); vL=uv.y; vC=aCol; vI=aI; vS=aSoft; gl_Position=projectionMatrix*mv; }';
  const BFS=LXOFF?'precision highp float; uniform float uT; varying vec3 vN, vV, vC, vW; varying float vL, vI, vS; void main(){ float e=abs(dot(normalize(vN),normalize(vV))); e=pow(e,mix(2.6,1.1,vS)); float a=e*pow(vL,mix(1.1,1.8,vS))*vI; gl_FragColor=vec4(vC*a,a); }'
    :'precision highp float; uniform float uT; varying vec3 vN, vV, vC, vW; varying float vL, vI, vS; float h(vec3 p){ return fract(sin(dot(p,vec3(127.1,311.7,74.7)))*43758.5453); } float vn(vec3 p){ vec3 i=floor(p), f=fract(p); f=f*f*(3.-2.*f); return mix(mix(mix(h(i),h(i+vec3(1,0,0)),f.x),mix(h(i+vec3(0,1,0)),h(i+vec3(1,1,0)),f.x),f.y),mix(mix(h(i+vec3(0,0,1)),h(i+vec3(1,0,1)),f.x),mix(h(i+vec3(0,1,1)),h(i+vec3(1,1,1)),f.x),f.y),f.z); } void main(){ bool au=vS>1.5; float e=abs(dot(normalize(vN),normalize(vV))); e=pow(e,au?.8:mix(1.5,.95,vS)); vec3 q=vW*.55+vec3(uT*.07,-uT*.05,uT*.04); float hz=au?.25+.95*vn(q)*.7+.95*vn(q*2.3+7.)*.3:.55+.45*vn(q)*.65+.45*vn(q*2.3+7.)*.35; float a=e*pow(vL,au?.6:mix(1.05,1.6,vS))*vI*hz; gl_FragColor=vec4(vC*a,a); }';
  const geo=new T.CylinderGeometry(.03,1,1,16,1,true); geo.translate(0,-.5,0);
  const src=[];   // [group, local position, kind ('spot'|'wash'), length, radius, role, stage]
  const add=(g,a,r,y,kind,len,rad,role,stage)=>src.push({g,p:pol(a,r,y),a,kind,len,rad,role,stage});
  for(let i=0;i<80;i++){ const a=(i+.25)/80*TAU; add(ringA,a,THROW.r+.15,THROW.y-.55,'spot',15,.55,'throw'); }                 // the throw ring
  for(let i=0;i<48;i++){ const a=(i+.5)/48*TAU; add(ringA,a,RING_A.r+.25,RING_A.y-.5,'wash',12,2.4,'wash'); }                     // ring A washes
  for(let i=0;i<32;i++){ const a=(i+.5)/32*TAU; add(ringB,a,RING_B.r-.2,RING_B.y-.5,i%2?'spot':'wash',16,i%2?.5:1.8,'centre'); } // the centre rings throw out to the stage fronts
  for(let i=0;i<20;i++){ const a=(i+.5)/20*TAU; add(ringC,a,RING_C.r-.17,RING_C.y-.5,'spot',17,.45,'centre'); }
  for(let k=0;k<4;k++) for(let i=0;i<18;i++){ const a=stageAngle(k)+(i/17-.5)*80*D2R; add(scene,a,STAGE_TRUSS.r-.3,STAGE_TRUSS.y-.45,i%3?'spot':'wash',13,i%3?.5:2.2,'stage',k); }
  /* v23c (his note: the most light over the audience, more haze, wider spread, not lasers): 12 wide colour washes that sweep the seating */
  const AUD=LXOFF?0:16; for(let i=0;i<AUD;i++){ const a=(i+.5)/AUD*TAU; add(scene,a,9.6,RING_A.y-.7,'wash',12,3.8,'aud'); }
  /* v23d STORY LIGHTING (his brief): fixtures that only play in the film, before the close (all dark from 76.5 s, so the final overhead is unchanged):
     god = three soft white-gold shafts from the top of the dome onto the angel; rake = four hard cold-white beams that find the demon from low and high;
     blind = eight blinders at the stage fronts that hit the crowd on the circus hits; up = 32 gold uplights round the room base for the sunrise */
  const tag=(role,j)=>{ src[src.length-1].j=j; };
  if(!LXOFF){ for(let j=0;j<3;j++){ add(scene,0,0,0,'wash',13,1.7,'god'); tag('god',j); }
    for(let j=0;j<4;j++){ add(scene,0,0,0,'spot',9,j>1?1.0:.6,'rake'); tag('rake',j); }
    for(let k=0;k<4;k++) for(const d of [-1,1]){ add(scene,stageAngle(k)+d*13*D2R,14.6,STAGE_H+.2,'wash',9,2.3,'blind',k); tag('blind',d); }
    for(let j=0;j<32;j++){ add(scene,(j+.5)/32*TAU,R_OUT-.45,.15,'wash',8,1.1,'up'); tag('up',j); } }
  const n=src.length, im=new T.InstancedMesh(geo,new T.ShaderMaterial({uniforms:{uT:{value:0}},vertexShader:BVS,fragmentShader:BFS,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide}),n);
  const aCol=new Float32Array(n*3), aI=new Float32Array(n), aSoft=new Float32Array(n);
  src.forEach((s,i)=>{ aSoft[i]=(s.role==='aud'||s.role==='god'||s.role==='up')?2:s.role==='rake'?1:s.kind==='wash'?1:0; });   /* 2 = audience wash: soft edge, long reach, thick drifting haze */
  geo.setAttribute('aCol',new T.InstancedBufferAttribute(aCol,3)); geo.setAttribute('aI',new T.InstancedBufferAttribute(aI,1)); geo.setAttribute('aSoft',new T.InstancedBufferAttribute(aSoft,1));
  im.frustumCulled=false; im.renderOrder=3; scene.add(im);
  // the lenses: a glowing point at every fixture, so the rig reads as hundreds of lights
  const PG=new T.BufferGeometry(), pp=new Float32Array(n*3), pc=new Float32Array(n*3); PG.setAttribute('position',new T.BufferAttribute(pp,3)); PG.setAttribute('color',new T.BufferAttribute(pc,3));
  const pts=new T.Points(PG,new T.PointsMaterial({map:flareTex,size:LXOFF?.9:1.5,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); pts.frustumCulled=false; scene.add(pts);
  // a wash light on each stage from the front of house, so every stage is properly lit, not just its beams
  const fronts=[]; for(let k=0;k<4;k++){ const sp=new T.SpotLight(0xffffff,0,40,.55,.6,1.2); sp.position.copy(pol(stageAngle(k),5,RING_B.y)); sp.target.position.copy(pol(stageAngle(k),18.5,STAGE_H+1)); scene.add(sp); scene.add(sp.target); fronts.push(sp); }
  // v23: where a beam meets the stage deck it lands as a soft pool of its colour
  const pc2=document.createElement('canvas'); pc2.width=pc2.height=64; { const x=pc2.getContext('2d'), rg=x.createRadialGradient(32,32,1,32,32,32); rg.addColorStop(0,'rgba(255,255,255,1)'); rg.addColorStop(.5,'rgba(255,255,255,.55)'); rg.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=rg; x.fillRect(0,0,64,64); }
  const pg=new T.CircleGeometry(1,24); pg.rotateX(-Math.PI/2); const pools=new T.InstancedMesh(pg,new T.MeshBasicMaterial({map:new T.CanvasTexture(pc2),blending:T.AdditiveBlending,transparent:true,depthWrite:false,fog:false}),n);
  pools.instanceColor=new T.BufferAttribute(new Float32Array(n*3),3); pools.frustumCulled=false; pools.renderOrder=3; pools.visible=!LXOFF; scene.add(pools);
  // v23: side light from both wings and a back light from upstage, on whichever stage is featured, in the look's colours (dance is lit from the side)
  const sides=LXOFF?[]:[-1,1,0].map(sd=>{ const L=new T.SpotLight(0xffffff,0,34,sd?.62:.5,.85,1.15); scene.add(L); scene.add(L.target); return {L,sd}; });
  const audL=LXOFF?[]:[0,4,8,12].map(j=>{ const L=new T.SpotLight(0xffffff,0,36,.46,.9,1.1); scene.add(L); scene.add(L.target); return {L,j}; });
  const storyL=LXOFF?null:{god:new T.SpotLight(0xfff0d0,0,30,.32,.85,1.1),rk:[0,1].map(()=>new T.SpotLight(0xd8e8ff,0,26,.3,.6,1.1))};
  if(storyL){ scene.add(storyL.god); scene.add(storyL.god.target); storyL.rk.forEach(L=>{ scene.add(L); scene.add(L.target); }); }
  Object.assign(RIG2,{src,im,aCol,aI,aSoft,pp,pc,PG,fronts,pools,sides,audL,storyL,LXOFF,ready:true}); }
const _r2p=new T.Vector3(), _r2iq=new T.Quaternion(), _r2pc=new T.Color(), _r2w=new T.Vector3(), _r2t=new T.Vector3(), _r2d=new T.Vector3(), _r2m=new T.Matrix4(), _r2q=new T.Quaternion(), _r2s=new T.Vector3(), _r2c=new T.Color(), _r2up=new T.Vector3(0,-1,0);
// the level of the whole rig through the film, by section of the song
const RIG2_LEVEL=[[0,0],[13,.05],[22.3,.45],[29.3,1],[36,.8],[44,.35],[52.5,.85],[62.5,1],[70.5,.75],[76.5,1]];
/* v23d the story, act by act (weights cross-fade): we arrive / bread and circus / the blessing / the manipulators brought into light / the golden age / the vote. From 76.5 s (FILM.team) none of this applies. */
const _xS=(ft,a,b)=>smooth(clamp((ft-a)/(b-a),0,1));
function storyW(ft){ return {arrive:1-_xS(ft,13,15.5), circus:_xS(ft,14.5,16.5)*(1-_xS(ft,34.6,36.4)), bless:_xS(ft,34.6,36.4)*(1-_xS(ft,47.0,48.6)), expose:_xS(ft,46.95,47.2)*(1-_xS(ft,55.6,57.2)), gold:_xS(ft,55.6,58.4), vote:0};   /* his note: the multi-colour vote look read as a rainbow; the golden age holds until the cut to the overhead */ }
const STORY_BLIND=[22.5,25.3,30.5,73];   /* the circus hits: the blinders hit the crowd and they applaud the light */
function storyBlind(ft){ let e=0; for(const a of STORY_BLIND){ const q=ft-a; if(q>=-.03&&q<1.5) e=Math.max(e,Math.exp(-Math.max(0,q)*4.2)); } return e; }
const _xA=new T.Vector3(), _xD=new T.Vector3(), _xV=new T.Vector3();
function beingPos(i,v){ if(typeof BEINGS!=='undefined'&&BEINGS[i]&&BEINGS[i].piv){ BEINGS[i].piv.getWorldPosition(v); return v; } return v.copy(pol(stageAngle(3)+(i?-.5:.47),i?18.6:17.3,STAGE_H)); }
function rig2Level(t){ let i=-1; while(i+1<RIG2_LEVEL.length&&RIG2_LEVEL[i+1][0]<=t) i++; if(i<0) return 0; const [a,l]=RIG2_LEVEL[i], p=i?RIG2_LEVEL[i-1][1]:0; return lerp(p,l,clamp((t-a)/1.2,0,1)); }
function updateRig2(t,dt){ if(!RIG2.ready) return; const R=RIG2, film=FILM.on, ft=film?FILM.t:0;
  const on=S.room==='theatre'||S.room==='club', lvl=(film?rig2Level(ft):.55)*(on?1:0)*(1-.8*smooth(S.houseK))*SHOW.dim;
  R.im.visible=lvl>.001; const beat=musicBeat(), bp=film?Math.min(1,musicPulse()*(.4+.6*musicEnergy())+hitPulse()):Math.pow(1-((t*118/60)%1),2), hit=film?hitPulse():0, en=film?musicEnergy():.7;
  const bar=Math.floor(beat/4), look=((bar%4)+4)%4, team=film&&FILM.team;
  ringA.updateMatrixWorld(); ringB.updateMatrixWorld(); ringC.updateMatrixWorld();
  const SW=(film&&!team&&!R.LXOFF&&window.LX_STORY!==0)?storyW(ft):null, BL=SW?storyBlind(ft)*Math.min(1,SW.circus+SW.vote):0, UPK=SW?_xS(ft,62.5,66):0, ROAR=SW&&ft>54.25&&ft<55.4?((Math.floor(ft*15)%2)?1:-.7):0;
  if(SW) R.im.visible=true; if(SW&&SW.expose>0) beingPos(1,_xD); if(SW&&SW.bless>0) beingPos(0,_xA); const PHID=SW?Math.atan2(_xD.x,-_xD.z):0;
  const storyFix=(i,s)=>{ let I=0; _r2w.copy(s.p); _r2t.copy(s.p);
    if(SW){ if(s.role==='god'){ I=SW.bless*(1.25+.12*Math.sin(t*1.3+s.j))*(s.j===1?1:.55); _r2w.set(_xA.x*.96+(s.j-1)*.4,ROOM_H-.6,_xA.z*.96); _r2t.set(_xA.x+(s.j-1)*.6,_xA.y,_xA.z); _r2c.setRGB(1,.92,.74); }
      else if(s.role==='rake'){ const phi=Math.atan2(_xD.x,-_xD.z), hi=s.j>1; I=SW.expose*(1.3+.5*ROAR); if(hi) _r2w.copy(pol(phi+(s.j%2?.05:-.05),17.4,ROOM_H-1.2)); else _r2w.copy(pol(phi+(s.j%2?.2:-.2),16.9,STAGE_H+.4)); _r2t.set(_xD.x+Math.sin(t*2+s.j)*.15,_xD.y+(hi?.2:2.5),_xD.z); _r2c.setRGB(.82,.9,1); }   /* two low rakes from the front corners and two hard searchlights straight down on him */
      else if(s.role==='blind'){ I=BL*1.9; _r2t.copy(pol(s.a,6.5,1.3)); _r2c.setRGB(1,.84,.58); }
      else if(s.role==='up'){ I=SW.gold*_xS(ft,55.8,62.5)*(.8+.2*bp); _r2t.copy(pol(s.a,R_OUT-.95,8.5)); if(s.j%2) _r2c.setRGB(1,.72,.28); else _r2c.setRGB(1,.88,.6); } }
    _r2d.copy(_r2t).sub(_r2w); const L=Math.max(.01,Math.min(_r2d.length(),s.len*1.6)); _r2d.normalize(); _r2q.setFromUnitVectors(_r2up,_r2d); const w=I>.001?s.rad*(L/s.len):0;
    _r2m.compose(_r2w,_r2q,_r2s.set(w,I>.001?L:0,w)); R.im.setMatrixAt(i,_r2m); R.aCol[i*3]=_r2c.r; R.aCol[i*3+1]=_r2c.g; R.aCol[i*3+2]=_r2c.b; R.aI[i]=Math.min(1.6,I);
    if(!R.LXOFF){ _r2m.makeScale(0,0,0); R.pools.setMatrixAt(i,_r2m); } const pk=Math.min(1,I*1.2); R.pp[i*3]=_r2w.x; R.pp[i*3+1]=_r2w.y; R.pp[i*3+2]=_r2w.z; R.pc[i*3]=_r2c.r*pk; R.pc[i*3+1]=_r2c.g*pk; R.pc[i*3+2]=_r2c.b*pk; };
  for(let i=0;i<R.src.length;i++){ const s=R.src[i]; if(s.role==='god'||s.role==='rake'||s.role==='blind'||s.role==='up'){ storyFix(i,s); continue; } _r2w.copy(s.p); if(s.g!==scene) s.g.localToWorld(_r2w);
    const wa=Math.atan2(_r2w.x,-_r2w.z), k=s.stage!==undefined?s.stage:(((Math.round(wa/(TAU/4)))%4)+4)%4, sa=k*TAU/4, ph=i*.37;
    let ta, tr, ty, I=1, fanA=false;
    if(s.role==='stage'){ ta=s.a+Math.sin(t*.5+ph)*.05; tr=17.2+2.4*Math.sin(t*.35+ph*1.3); ty=STAGE_H; }                                   // the stage trusses light their own deck
    else if(s.role==='centre'){ const sw=look===1?Math.sin(beat*Math.PI/2+ph)*.35:look===2?(((i%2)?1:-1)*.25):Math.sin(t*.4+ph)*.18; ta=team?sa+Math.sin(ph*3.1)*.42+Math.sin(t*.22+ph)*.06:wa+sw; tr=team?17.2+2.6*Math.sin(ph*2.3)+.4*Math.sin(t*.2+ph):14.6+1.2*Math.sin(t*.3+ph); ty=STAGE_H+.4+(team?0:1.6*Math.max(0,Math.sin(t*.7+ph))); } // the middle throws to the front of each stage
    else if(s.role==='aud'){ ta=s.a+Math.sin(t*.23+ph)*.55+(team?0:Math.sin(beat*Math.PI/8+ph)*.12); tr=2.5+8.5*(.5+.5*Math.sin(t*.29+ph*1.7)); ty=1.3; }   /* v23c: washes that sweep the seating */
    else if(s.role==='throw'&&!team&&!R.LXOFF&&(look===1||look===3)&&(i%2)){ ta=wa+Math.sin(beat*Math.PI/4+i*.5)*.6; tr=3+7.5*(.5+.5*Math.sin(t*.3+ph)); ty=1.4; fanA=true; }   /* v23c: half the throw ring fans down over the crowd */
    else if(s.role==='throw'){ const fan=look===3?Math.sin(beat*Math.PI/4+i*.5)*.5:0; ta=team?sa+Math.sin(ph*2.7+1.)*.5+Math.sin(t*.2+ph)*.06:wa+fan+Math.sin(t*.25+ph)*.12; tr=team?18.4+2.6*Math.sin(ph*1.9)+.4*Math.sin(t*.18+ph):15.5+2*Math.sin(t*.3+ph); ty=team?STAGE_H:STAGE_H+2.5*Math.max(0,Math.sin(t*.5+ph)); }
    else if(team){ ta=sa+Math.sin(ph*3.7+2.)*.46+Math.sin(t*.2+ph)*.05; tr=16+2.2*Math.sin(ph*1.3)+.3*Math.sin(t*.17+ph); ty=STAGE_H; }   /* v18: in the closing overhead every fixture holds its own place on its own stage, with a small slow drift */                                              // the wash ring joins in: out to the stage fronts
    else { ta=wa+Math.sin(t*.2+ph)*.2; tr=8+4*Math.sin(t*.27+ph); ty=1.2; }                                                                 // washes over the house
    if(SW&&(s.role==='throw'||s.role==='centre')) ty+=6.5*SW.gold*UPK;   /* v23d golden age: the beams lift into the air */
    _r2t.copy(pol(ta,tr,ty)); if(SW&&s.role==='aud'){   /* v23d the audience washes play the story */
      let sx=0,sy=0,sz=0,sw=0; const acc=(v,k)=>{ if(k>0){ sx+=v.x*k; sy+=v.y*k; sz+=v.z*k; sw+=k; } };
      acc(pol(s.a+Math.sin(t*.08+ph)*.3,3+7*(.5+.5*Math.sin(t*.11+ph)),1.3),SW.arrive);
      acc(pol(s.a+Math.sin(beat*Math.PI/2)*.65,3+8*(.5+.5*Math.sin(beat*Math.PI/4+ph*.3)),1.3),SW.circus);
      acc(pol(s.a+Math.sin(t*.1+ph)*.12,4+5*(.5+.5*Math.sin(t*.1+ph)),1.3),SW.bless);
      s.fx=clamp((Math.cos(s.a-PHID)-.35)/.65,0,1); acc(_xV.set(_xD.x+Math.sin(ph*3)*.7,_xD.y+2.3+Math.cos(ph*2)*.7,_xD.z+Math.cos(ph*3)*.7),SW.expose*s.fx); acc(_xV.copy(_r2t),SW.expose*(1-s.fx));
      acc(_xV.copy(_r2t),SW.gold);   /* golden age: the same sweep over the crowd he liked, turned gold */
      acc(pol(s.a+Math.sin(t*.9+ph)*.5,3+8*(.5+.5*Math.sin(t*.7+ph*1.3)),1.3),SW.vote); if(sw>.001) _r2t.set(sx/sw,sy/sw,sz/sw); }   /* v23e the vote: white beams scan the crowd while they decide */
    _r2d.copy(_r2t).sub(_r2w); const L=Math.min(_r2d.length(),s.len*(SW&&s.role==='aud'?1.6+1.4*SW.expose:1.6)); _r2d.normalize();
    _r2q.setFromUnitVectors(_r2up,_r2d); const w=s.rad*(L/s.len)*(SW&&s.role==='aud'?(1-.65*SW.expose*(s.fx||0))*(1-.4*SW.vote):1)*(team&&s.role!=='aud'?1.7:1)*(R.LXOFF?1:(s.kind==='spot'?(window.LX_SPOTW||2.6)*(fanA?2.2:1):1.15)); if(!R.LXOFF){ const sf=s.role==='aud'?2:(s.kind==='wash'||fanA)?1:0; if(R.aSoft[i]!==sf){ R.aSoft[i]=sf; R.softDirty=true; } } _r2m.compose(_r2w,_r2q,_r2s.set(w,L,w)); R.im.setMatrixAt(i,_r2m);
    // colour: the stage trusses carry their team's colour; the rest follow the look, and the team colours at the close
    if(s.role==='aud') _r2c.copy(teamCol((i+Math.floor((team?Math.floor(((86-MUSB.t0)*MUSB.bpm/60)/4):bar)/2))%4));   /* v23d: frozen at the final frame's colours through the close */ else if(s.role==='stage'||team) _r2c.copy(teamCol(k)); else _r2c.copy(((i>>1)%2)?SHOW.c2:SHOW.c).lerp(WARM,.2);
    if(SW){ if(s.role==='aud'){ let r=0,g=0,b=0,sw=0; const ac=(R_,G_,B_,k_)=>{ if(k_>0){ r+=R_*k_; g+=G_*k_; b+=B_*k_; sw+=k_; } }; const c3=i%3;
        ac(.55,.68,1,SW.arrive); ac(1,c3===1?.48:.12,c3===2?.42:.05,SW.circus); ac(1,.9,.66,SW.bless); ac(.85,.93,1,SW.expose); ac(1,i%2?.72:.9,i%2?.28:.64,SW.gold); ac(i%2?.95:.7,i%2?.86:.82,i%2?.72:1,SW.vote); if(sw>.001) _r2c.setRGB(r/sw,g/sw,b/sw); }
      else { if(s.role!=='stage') _r2c.lerp(_r2pc.setRGB(1,(i%3)?.3:.55,.06),.7*SW.circus); if(s.role==='stage'&&k===3) _r2c.lerp(_r2pc.setRGB(.85,.92,1),.8*SW.expose); _r2c.lerp(_r2pc.setRGB(1,(i%2)?.74:.88,(i%2)?.32:.6),(s.role==='stage'?.5:.85)*SW.gold); _r2c.lerp(_r2pc.setRGB(.72,.84,1),(s.role==='stage'?.5:.8)*SW.vote); } }
    if(team&&film&&!R.LXOFF){ const rv=_xS(ft,76.8+((k+2)%4)*.45,77.3+((k+2)%4)*.45); if(rv<1) _r2c.lerp(_r2pc.setRGB(.9,.94,1),1-rv); }   /* v23e the win: from white, the quadrants snap into their colours one after another, Fuego (the winner) first; done by 78.7 s, so the overhead picture is unchanged */
    // intensity: a chase that runs round each ring on the beat, all up on the hits
    const chase=s.role==='stage'?1:.55+.45*Math.pow(Math.max(0,Math.cos((beat*.5-i*.125)*Math.PI)),2), kindK=R.LXOFF?(s.kind==='wash'?.55:1):(s.kind==='wash'?.8:.75);
    I=lvl*kindK*(s.role==='stage'?.55+.25*bp:s.role==='aud'?.6+.35*bp*en:(.35+.4*bp*en)*chase)+(s.role==='aud'?0:hit*.5*lvl);   /* v23c: no hit flash on the audience washes (they went white on the hits) */
    if(SW){ if(s.role==='aud'){ const Iv=I; let a_=0,sw=0; const ai=(v,k_)=>{ if(k_>0){ a_+=v*k_; sw+=k_; } }; ai(.12+.04*Math.sin(t*.5+ph),SW.arrive); ai(Iv,SW.circus); ai(.2+.04*Math.sin(t*.4+ph),SW.bless); ai((.38+.2*ROAR)*(s.fx||0),SW.expose); ai(Iv*.7,SW.gold); ai(Iv*.5,SW.vote); if(sw>.001) I=a_/sw; }
      else { I*=(1-.6*SW.bless)*(s.role==='stage'&&k===3?1+.4*SW.expose:1-.45*SW.expose)*(1-.45*SW.vote); } }
    if(team) I=lvl*(R.LXOFF?(s.kind==='wash'?.8:1.25):s.role==='aud'?.3:(s.kind==='wash'?.5:.7))*(.8+.2*bp);   /* v23b: his note, the finale went white with the new pools and wide beams */   /* the finale: every fixture up, in its stage's colour */ R.aCol[i*3]=_r2c.r; R.aCol[i*3+1]=_r2c.g; R.aCol[i*3+2]=_r2c.b; const overAud=s.role==='aud'||Math.hypot(_r2t.x,_r2t.z)<R_DISC-.5; R.aI[i]=I*.42*HZ()*(overAud&&!R.LXOFF?(s.role==='aud'?(window.LX_AUDHZ||(film?(team?3:7):4.5)):(window.LX_AUDHZ2||2.0)):1); if(s.role==='aud') R.aI[i]=Math.min(R.aI[i],window.LX_AUDMAX||1.4); if(s.role==='aud'){ (s.wp||(s.wp=new T.Vector3())).copy(_r2w); (s.tp||(s.tp=new T.Vector3())).copy(_r2t); s.col=(s.col||new T.Color()).copy(_r2c); s.I=I; } if(!R.LXOFF){ let ps=0; if(_r2d.y<-.15){ const tt=(_r2w.y-(STAGE_H+.025))/-_r2d.y; if(tt>0&&tt<40){ _r2p.copy(_r2w).addScaledVector(_r2d,tt); const rr=Math.hypot(_r2p.x,_r2p.z); if(rr>R_DISC+.25&&rr<R_OUT-.25) ps=Math.max(.35,w*(tt/L)*1.15); } }
      if(ps>0){ _r2m.compose(_r2p,_r2iq,_r2s.set(ps,1,ps)); R.pools.setMatrixAt(i,_r2m); R.pools.setColorAt(i,_r2pc.copy(_r2c).multiplyScalar(Math.min(.75,I*(s.kind==='wash'?1.0:1.4))*(window.LX_POOL||.85)*(team?.3:film?1:.5))); } else { _r2m.makeScale(0,0,0); R.pools.setMatrixAt(i,_r2m); } }
    R.pp[i*3]=_r2w.x; R.pp[i*3+1]=_r2w.y; R.pp[i*3+2]=_r2w.z; let pk=Math.min(1,I*1.6); if(film&&ft<22.6){ const ob=.5*smooth(clamp(ft/2.5,0,1))*(1-smooth(clamp((ft-19.5)/3,0,1)))*(.7+.3*chase); if(ob>pk){ pk=ob; _r2c.setRGB(1,.86,.62); } }   /* v18: every lens glows warm through the opening, so the rings read overhead as the room turns */ R.pc[i*3]=_r2c.r*pk; R.pc[i*3+1]=_r2c.g*pk; R.pc[i*3+2]=_r2c.b*pk; }
  R.im.material.uniforms.uT.value=t; if(!R.LXOFF){ R.pools.visible=lvl>.001; R.pools.instanceMatrix.needsUpdate=true; if(R.pools.instanceColor) R.pools.instanceColor.needsUpdate=true;
    let kb=0, fb=-1; for(let k=0;k<4;k++){ const f=feat(k); if(f>fb){ fb=f; kb=k; } } const sa=stageAngle(kb);
    for(const {L,sd} of R.sides){ if(sd){ L.position.copy(pol(sa+sd*24*D2R,18.2,STAGE_H+2.6)); L.target.position.copy(pol(sa+sd*4*D2R,18.2,STAGE_H+1.1)); L.color.copy(sd<0?SHOW.c:SHOW.c2).lerp(WARM,.12); }
      else { L.position.copy(pol(sa,22.6,STAGE_H+6.2)); L.target.position.copy(pol(sa,17.4,STAGE_H+1.0)); L.color.copy(SHOW.c2).lerp(SHOW.c,.5); }
      L.intensity=(film?1:.6)*lvl*(sd?3.2:2.4)*(.85+.15*bp)*(window.LX_SIDE||1.4)*(team?.4:1)*(SW?1-.5*SW.bless:1); }
    const aud=R.src.filter(s=>s.role==='aud'); for(const {L,j} of R.audL){ const s=aud[j]; if(!s||!s.wp) continue; L.position.copy(s.wp); L.target.position.copy(s.tp); L.color.copy(s.col); L.intensity=(s.I||0)*(window.LX_AUDL||5.5)*(team?.5:1); if(BL>.002){ L.color.lerp(_r2pc.setRGB(1,.86,.62),Math.min(1,BL*1.5)); L.intensity+=BL*16; } }
    if(R.storyL){ const G=R.storyL.god; if(SW&&SW.bless>.001){ G.position.set(_xA.x*.96,ROOM_H-.6,_xA.z*.96); G.target.position.copy(_xA); G.intensity=SW.bless*7; } else G.intensity=0;
      R.storyL.rk.forEach((L,j)=>{ if(SW&&SW.expose>.001){ const phi=Math.atan2(_xD.x,-_xD.z); L.position.copy(pol(phi+(j?.2:-.2),16.9,STAGE_H+.4)); L.target.position.set(_xD.x,_xD.y+1.5,_xD.z); L.intensity=SW.expose*14*(1+.5*ROAR); } else L.intensity=0; }); } }
  R.im.instanceMatrix.needsUpdate=true; R.im.geometry.attributes.aCol.needsUpdate=true; R.im.geometry.attributes.aI.needsUpdate=true; if(R.softDirty){ R.im.geometry.attributes.aSoft.needsUpdate=true; R.softDirty=false; } R.PG.attributes.position.needsUpdate=true; R.PG.attributes.color.needsUpdate=true;
  R.fronts.forEach((sp,k)=>{ sp.color.copy(teamCol(k)).lerp(WARM,team?.2:.55); sp.intensity=(film?1.6:1)*lvl*(.8+.2*bp)*(team?5.5:2.2)*(film&&k===2&&ft>=30.45&&ft<44.2?0:1.3); }); }

await __tick();
// ================= AERIALISTS FOR THE VOTE: three acts at three heights =================
// As the aisles fill, three aerialists fly in, at different heights and spread across the frame: a silk at middle height over the seats,
// a lyra high over the far seats, and one lyra close to the camera that passes across the foreground: the only close-up in the reel.
// Each has a narrow downlight, so colour falls into the house here and there. Film only.
const AER={ready:false,parts:[]};
const _ea=new T.Vector3(), _eb=new T.Vector3(), _ec=new T.Vector3(), _ed=new T.Vector3(), _eq=new T.Quaternion(), _ep=new T.Quaternion();
// [x across the house, z along it, height of the hands, team, shape, fly-in delay]
const AERSPOTS=[[-2.7,3.0,7.6,2,'split',0]];   // the silk, middle height over the seats right of centre (camera's view)
// the lyras: [x at the start, x at the end, z, hoop height, hoop colour, costume colour, fly-in delay]
const LYRAS=[[6.4,6.4,2.2,7.7,0x6fa8ff,0xe8302e,.5,'lyra-t-p17'],   /* v23k: his note, the new Lyra (Tanya HD, team red, seated facing the house) */   /* v23: his note, the draped one in red (was Oro gold), bigger (LYRA_SC) and a touch of tan (LYRA_TAN) */
  [5.4,2.4,-9.6,5.9,0xf0c35a,0xe8302e,1.0,'lyra-t-p13']];   /* v23k: the gold ORO lyra gets the same new Lyra */   /* v22: team colours only: gold for Oro, red for Fuego (the team that wins the vote) */   /* v21: colour costumes, the human confetti of the finale */   /* v20: bought, posed aerialists (Daz LA Aerial Hoop Poses on Genesis 9): the near one in a standing split holding the top of the hoop, the far one seated in an arch */
const LYRA_SC={'lyra-p3':1.4,'lyra-t-p17':1.4}, LYRA_TAN=new T.Color(.95,.82,.7);
const LYRA_RC=1.547;   // the model hangs from the top of its rope: the centre of the ring is this far below it   // +x is the left of the vote shot
const AER_T0=70.0, AER_T1=82.2;   /* no fly-out: they fade where they hang, before the closing picture */
function aerFade(t,mats){ const k=1-smooth(clamp((t-77.0)/1.6,0,1));   /* v23 his note: the aerialists fade out with the dancers (77.0-78.6, r5-aisle) */ for(const m of mats){ if(!m) continue; if(k<1&&!m.transparent){ m.transparent=true; m.needsUpdate=true; } m.opacity=(m.userData.op0===undefined?(m.userData.op0=m.opacity):m.userData.op0)*k; } return k; }
async function loadAerial(){ if(!T.SkeletonUtils) return; const IDENT=new T.Matrix4(), mats={}, tex={}, clips={};
  const silkGeo=new T.PlaneGeometry(.13,1,1,40); silkGeo.translate(0,-.5,0);
  for(let i=0;i<AERSPOTS.length;i++){ const [x,z,hy,k,shape,dl]=AERSPOTS[i], model=i%2?'dancer-m2':'dancer-f2', hex=TEAMS4[k].hex;
    const gltf=await loadGLB(model+'.glb'); tex[model]=tex[model]||await texP(model+'.jpg');
    const key=model+k; if(!mats[key]){ const m=teamMat(tex[model],hex); m.emissive=new T.Color(hex); m.emissiveIntensity=.14; mats[key]=m; }
    const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm); scene.add(root); root.updateMatrixWorld(true);
    const clip=clips[model]||(clips[model]=await motionClip(root,'a301'));
    const m=new T.SkinnedMesh(geo,mats[key]); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; m.visible=false; scene.add(m);
    const mixer=new T.AnimationMixer(root); const act=mixer.clipAction(clip); act.play(); act.setEffectiveTimeScale(.25); mixer.update(i*.8);
    const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; });
    // the silk: two lengths of fabric from the grid, in the team colour, softly lit from inside so it reads against the dark rig
    const col=new T.Color(hex), sMat=new T.MeshStandardMaterial({color:col.clone().multiplyScalar(.8),emissive:col,emissiveIntensity:.2,roughness:.85,side:T.DoubleSide,transparent:true,opacity:.85});
    const silk=new T.Group(); for(const dx of [-.04,.04]){ const s=new T.Mesh(silkGeo,sMat); s.position.x=dx; s.rotation.y=dx*3; silk.add(s); } silk.visible=false; scene.add(silk);
    // a narrow downlight in the team colour: it picks out the aerialist and lays a pool of colour on the seats below
    const sp=new T.SpotLight(col,0,22,.2,.7,1.4); sp.position.set(x*1.08,ROOM_H-1.7,z*1.08); sp.target.position.set(x,0,z); scene.add(sp); scene.add(sp.target);
    AER.parts.push({root,m,mixer,B,silk,sMat,sp,x,z,hy,k,shape,dl,ph:i*1.7,dir:i%2?1:-1}); }
  // the lyras: the dancer sits in the hoop; the near one rides a trolley across the foreground
  AER.lyras=[]; for(const [x0,x1,z,y,hc,cc,dl,mdl] of LYRAS){ let g=null; try{ g=await loadGLB(mdl+'.glb'); }catch(e){ continue; }
    const m=g.scene, mats=[]; m.traverse(o=>{ if(o.isMesh){ o.frustumCulled=false; o.castShadow=false; const mm=o.material; if(mm.map) mm.map.encoding=T.sRGBEncoding; if(mm.name==='unitard'){ mm.color.set(cc); mm.metalness=.55; mm.roughness=.3; if(mm.emissive) mm.emissive.set(cc).multiplyScalar(.28); } if(/^skin_/.test(mm.name)&&!/^lyra-t-/.test(mdl)) mm.color.copy(LYRA_TAN); if(/^(hair1|hairunder)$/.test(mm.name)){ mm.alphaTest=.05; mm.needsUpdate=true; }   /* v23 his note, 'her hair looks bald': the strand cards carry a faint alpha (all under .4), so the export's .4 cut-off threw every strand away and left the cap */   /* the new Lyra's tan is in her own skin */ mats.push(mm); } }); m.visible=false; m.scale.setScalar(LYRA_SC[mdl]||1); scene.add(m);
    const tab=new T.Mesh(new T.CylinderGeometry(.008,.008,1,5),new T.MeshBasicMaterial({color:0x9a9aa8})); tab.geometry.translate(0,.5,0); tab.visible=false; scene.add(tab);
    const sp=new T.SpotLight(new T.Color(cc).lerp(new T.Color(0xffffff),.6),0,18,.26,.6,1.3); scene.add(sp); scene.add(sp.target);
    AER.lyras.push({m,mats,tab,sp,x0,x1,z,y,dl,near:z<-5}); }
  AER.ready=true; }
JOBS.push(loadAerial);
// two-bone reach: turn the upper then the lower bone so the end bone lands on the target (world space)
function aerReach(b1,b2,end,tgt,it){ for(let n=0;n<(it||8);n++) for(const bone of [b2,b1]){ bone.getWorldPosition(_ec); end.getWorldPosition(_ea);
  const a=_ea.sub(_ec).normalize(), b=_eb.copy(tgt).sub(_ec).normalize(); _eq.setFromUnitVectors(a,b); bone.parent.getWorldQuaternion(_ep);
  const inv=_ep.clone().invert(); bone.quaternion.premultiply(inv.multiply(_eq).multiply(_ep)); bone.updateMatrixWorld(true); } }
function aerialUpdate(dt){ if(!AER.ready) return; const t=FILM.on?FILM.t:-1, on=FILM.on&&S.room==='theatre'&&t>=AER_T0&&t<AER_T1;
  for(const P of AER.parts){ P.m.visible=on; P.silk.visible=on; P.sp.intensity=0; if(!on) continue;
    // fly in from the grid over two and a half seconds, breathe on the line, fly out at the end
    const u=smooth(clamp((t-AER_T0-P.dl)/2.6,0,1)), fk=aerFade(t,[P.m.material,P.sMat]), out=0;
    const hy=lerp(lerp(ROOM_H+1.2,P.hy,u),ROOM_H+1.2,out)+Math.sin(t*.7+P.ph)*.12;
    const yaw=P.ph+t*.32*P.dir, sway=Math.sin(t*.55+P.ph)*.06;
    // the pose is solved in the dancer's own frame (bones live at the origin; the mesh carries them into the room)
    P.mixer.update(dt*(REDUCED?0:1)); P.root.updateMatrixWorld(true); const B=P.B; if(!B.Hips) continue;
    B.Hips.getWorldPosition(_ea); const hip=_ea.clone(), br=Math.sin(t*.9+P.ph)*.06;
    const h1=new T.Vector3(hip.x,hip.y+1.2,hip.z+.03), h2=new T.Vector3(hip.x,hip.y+.98,hip.z+.03);
    let fl, fr;
    if(P.shape==='split'){ fl=new T.Vector3(hip.x+.08,hip.y-.12+br,hip.z+.86); fr=new T.Vector3(hip.x-.08,hip.y-.2-br,hip.z-.86); }
    else if(P.shape==='straddle'){ fl=new T.Vector3(hip.x+.78,hip.y-.32+br,hip.z+.18); fr=new T.Vector3(hip.x-.78,hip.y-.32-br,hip.z+.18); }
    else { fl=new T.Vector3(hip.x,hip.y-.92,hip.z+.02); fr=new T.Vector3(hip.x+.22,hip.y-.5+br,hip.z+.58); }
    for(let n=0;n<2;n++){ aerReach(B.RightArm,B.RightForeArm,B.RightHand,h1); aerReach(B.LeftArm,B.LeftForeArm,B.LeftHand,h2); aerReach(B.LeftUpLeg,B.LeftLeg,B.LeftFoot,fl,6); aerReach(B.RightUpLeg,B.RightLeg,B.RightFoot,fr,6); }
    // carry the body into the room so the top hand sits on the silk line at the hang height
    P.m.rotation.set(sway,yaw,0,'YXZ'); P.m.updateMatrix(); _eb.copy(h1).applyQuaternion(P.m.quaternion); P.m.position.set(P.x-_eb.x,hy-_eb.y,P.z-_eb.z);
    // the silk: from the grid, through the hands, a tail below the feet
    const top=ROOM_H-1.5, bot=hy-2.6; P.silk.position.set(P.x,top,P.z); P.silk.scale.set(1,top-bot,1); P.silk.rotation.set(0,yaw,0);
    P.sMat.emissiveIntensity=.14+.12*hitPulse();
    P.sp.intensity=(2.2+1.2*hitPulse())*u*fk*SHOW.dim; P.sp.target.position.set(P.x,0,P.z); }
  for(const L of AER.lyras||[]) lyraUpdate(L,t,on,dt); }
// a lyra: she sits on the bottom of the hoop, one hand on the top, the other arm and one leg reaching out of it
function lyraUpdate(L,t,on,dt){ L.m.visible=on; L.tab.visible=on; L.sp.intensity=0; if(!on) return;   /* v20: a posed aerialist on her hoop, hung from the hoist line */
  const u=smooth(clamp((t-AER_T0-L.dl)/(L.near?2.4:6.0),0,1)), fk=aerFade(t,L.mats.concat([L.tab.material])), pass=smooth(clamp((t-71.2)/5.3,0,1));
  const x=lerp(L.x0,L.x1,pass), cy=lerp(ROOM_H+1.5,L.y,u)+Math.sin(t*.8+L.x0)*.06, yaw=(L.near?3.968:1.278)+(t-76.1)*.1+Math.pow(Math.max(0,t-76.5),2)*.08, top=cy+LYRA_RC;   /* v23 his note: she turns slowly and steadily through her whole stay, about 35 degrees each way of where she faced before, so the pose reads from more than one side */
  L.m.position.set(x,top,L.z); L.m.rotation.set(0,yaw,0);
  L.tab.position.set(x,top,L.z); L.tab.scale.set(1,Math.max(.01,ROOM_H-1.5-top),1);
  L.sp.position.set(x+1.5,ROOM_H-1.8,L.z-(L.near?3.5:-2)); L.sp.target.position.set(x,cy,L.z); L.sp.intensity=(L.near?5:3.5)*(1+.3*hitPulse())*u*fk*SHOW.dim; }

if(ST[0].railJob) JOBS.push(ST[0].railJob);   // Stage 1's balustrade loads with the other models

// ---- lyra pose sheet (a working tool, not part of the show): window.__lyra(spec) builds a hoop and posed dancers in their own scene, __lyraDraw() renders it
window.__lyra=async spec=>{ const sc=new T.Scene(); sc.background=new T.Color(0x0e1016); sc.add(new T.HemisphereLight(0xdfe6ff,0x302830,.7)); const k=new T.DirectionalLight(0xfff2e0,1.5); k.position.set(-4,6,3); sc.add(k); const rim=new T.DirectionalLight(0x9fc0ff,.9); rim.position.set(3,2,-5); sc.add(rim);
  const IDENT=new T.Matrix4(), out=[], v1=new T.Vector3(), v2=new T.Vector3(), v3=new T.Vector3(), q1=new T.Quaternion(), q2=new T.Quaternion();
  const rotWorld=(b,qw)=>{ b.parent.getWorldQuaternion(q2); const inv=q2.clone().invert(); b.quaternion.premultiply(inv.multiply(qw).multiply(q2)); b.updateMatrixWorld(true); };
  const aim=(b,c,t)=>{ b.getWorldPosition(v1); c.getWorldPosition(v2); q1.setFromUnitVectors(v2.sub(v1).normalize(),v3.copy(t).sub(v1).normalize()); rotWorld(b,q1.clone()); };
  { const H=spec.hoop, hg=new T.Group(); const ring=new T.Mesh(new T.TorusGeometry(H.r,.022,16,96),new T.MeshStandardMaterial({color:0xd9b25a,metalness:1,roughness:.22,emissive:0x2a1a04})); hg.add(ring);
    const strap=new T.Mesh(new T.CylinderGeometry(.012,.012,4,8),new T.MeshStandardMaterial({color:0x2a2a30,roughness:.6})); strap.position.y=H.r+2; hg.add(strap);
    hg.position.fromArray(H.c); if(H.axis==='x') hg.rotation.y=Math.PI/2; if(H.yaw) hg.rotation.y+=H.yaw; sc.add(hg); }
  for(const F of spec.figs){ const [gltf,tx]=await Promise.all([loadGLB((F.model||spec.model)+'.glb'),texP((F.model||spec.model)+'.jpg')]); const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; }); const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm); sc.add(root); root.updateMatrixWorld(true);
    const G=new T.Group(); G.position.fromArray(F.off||[0,0,0]); sc.add(G); const mat=new T.MeshStandardMaterial({map:tx,skinning:true,roughness:.62,metalness:.05}); const m=new T.SkinnedMesh(geo,mat); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; G.add(m);
    const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; }); const mixer=new T.AnimationMixer(root); try{ const c=await motionClip(root,F.clip||'a308'); mixer.clipAction(c).play(); mixer.setTime(F.t||0); }catch(e){} root.updateMatrixWorld(true);
    const off=new T.Vector3().fromArray(F.off||[0,0,0]), P=a=>new T.Vector3().fromArray(a).sub(off);
    if(F.rot){ q1.setFromEuler(new T.Euler(F.rot[0],F.rot[1],F.rot[2],'YXZ')); rotWorld(B.Hips,q1.clone()); }
    if(F.arch){ B.LeftUpLeg.getWorldPosition(v1); B.RightUpLeg.getWorldPosition(v2); const lat=v1.sub(v2).normalize().clone(); ['Spine','Spine01','Spine02','neck','Head'].forEach((n,i)=>{ const a=F.arch[i]||0; if(a&&B[n]) rotWorld(B[n],new T.Quaternion().setFromAxisAngle(lat,a)); }); }
    for(const [up,mid,end,pole] of [['LeftUpLeg','LeftLeg','LeftFoot','LeftKnee'],['RightUpLeg','RightLeg','RightFoot','RightKnee'],['LeftArm','LeftForeArm','LeftHand','LeftElbow'],['RightArm','RightForeArm','RightHand','RightElbow']]){ const tg=F.tg&&F.tg[end]; if(!tg) continue; const T_=P(tg);
      if(F.tg[pole]){ aim(B[up],B[mid],P(F.tg[pole])); aim(B[mid],B[end],T_); } else for(let n=0;n<3;n++) aerReach(B[up],B[mid],B[end],T_,8); }
    if(F.point) for(const f of ['LeftFoot','RightFoot']) if(B[f]){ B[f].rotation.x+=F.point; B[f].updateMatrixWorld(true); }
    root.updateMatrixWorld(true); const pos={}; for(const n of ['Hips','Head','LeftArm','RightArm','LeftHand','RightHand','LeftUpLeg','RightUpLeg','LeftLeg','LeftFoot','RightFoot']) if(B[n]){ B[n].getWorldPosition(v1); pos[n]=v1.clone().add(off).toArray().map(x=>+x.toFixed(3)); } out.push(pos); }
  const C=spec.cam, cam=new T.PerspectiveCamera(C.fov||32,innerWidth/innerHeight,.05,100); cam.position.fromArray(C.p); cam.lookAt(new T.Vector3().fromArray(C.l));
  window.__lyraDraw=()=>{ renderer.setRenderTarget(null); renderer.render(sc,cam); }; return out; };

await __tick();
// ================= STAGE 4: the two beings, as holograms at the far sides =================
// v18b. The angel of light stands stage right and the smoke demon stage left, each a moving hologram cut from the same shot so they are cleanly
// separate: her light never lands on his side. They turn to face each other, drift a little toward the middle (enough to read as meant), launch,
// meet in the flash that makes the NOCHE mark, flicker out and reset at their marks. Dim on purpose: a hologram standing in the room, with two
// fainter layers behind each figure for depth and a pool of its own light on the deck.
window.HOLO_POS={angel:{a:27,r:17.3},demon:{a:29,r:18.6}};   /* v23k: his note 13:55, a bit further stage left (about 1.1 m), so he is beside the pyro and cryo as they go */   /* v23d: his notes 13:40. Angel 1.3 m further forward so she reads as mid stage; demon 1.5 m further stage left and 2 m downstage, to see what that does */   /* v23: his notes. The angel comes 2 m downstage so the girls show through her; the demon comes in toward her so he is in the shot */
const BEINGS=[]; const HOLOB={t0:43.4,imp:47.03,win:[[35.4,54.3],[46.1,55.7]]};   /* v20: the angel stays on through the start of shot D, until her side of the stage leaves the picture */   /* v21: when each one's side of Stage 4 is in the picture (angel, demon), measured from the film camera: angel 35.65-53.15, demon 46.4-55.65 */
{ const st=ST[3], g=st.group, Y0=STAGE_H, HG=6.3, RB=20.6, A0=27, A1=23, A2=18.5;   /* in from the wings so the demon is inside the camera's frame too */
  const vid=u=>{ const el=document.createElement('video'); el.src=u; el.muted=true; el.loop=true; el.playsInline=true; el.setAttribute('playsinline',''); el.crossOrigin='anonymous'; el.preload='auto';
    const tx=new T.VideoTexture(el); tx.minFilter=T.LinearFilter; tx.magFilter=T.LinearFilter; tx.generateMipmaps=false; return {el,tx}; };
  const VS='varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.0); }';
  const WV='vec2 gq=vUv*vec2(150.,170.); vec2 gf=abs(fract(gq)-.5); float fw=max(fwidth(gq.x),fwidth(gq.y)); float weave=mix(max(smoothstep(.3,.5,gf.x),smoothstep(.3,.5,gf.y)),.55,smoothstep(.25,.7,fw)); float gz=.74+.26*weave;';   /* v21: the gauze weave shows, but the picture comes first */   /* v20: projection on hologauze, a see-through woven mesh */
  const GL='float sl=(.92+.08*sin(uv.y*300.-uT*3.))*(.94+.14*smoothstep(.82,1.,fract(uv.y*.65-uT*.18)));';   /* v22: no glitch jumps; fine steady lines and a soft band of light that climbs slowly through the figure */
  const FA='precision highp float; uniform sampler2D map; uniform float uT,uOp,uHot,uAdd; varying vec2 vUv; void main(){ vec2 uv=vUv; '+GL+' vec3 c=texture2D(map,uv).rgb; '+WV+' if(uAdd>.5){ gl_FragColor=vec4(c*c*(1.+uHot*.5)*sl*uOp*gz*.6,1.); } else { float l=max(c.r,max(c.g,c.b)), a=smoothstep(.05,.32,l); c=pow(c,vec3(1.12))*.6; gl_FragColor=vec4(c*(.9+.1*sl)*(1.+uHot*.2),a*uOp*gz); } }';   /* t23: his note: at full the angel is barely brighter than in the dimmed entrance (was .9 and hot x.6/x1.5) */   /* v21: the angel as a picture on the gauze (normal blend, alpha from her brightness), not a glow */
  const FD='precision highp float; uniform sampler2D map; uniform float uT,uOp,uHot,uAdd,uRoar,uSolid; varying vec2 vUv; void main(){ vec2 uv=vUv; '+GL+' vec3 c=texture2D(map,vec2(uv.x*.5,uv.y)).rgb; float a0=texture2D(map,vec2(.5+uv.x*.5,uv.y)).r; float a=smoothstep(.08,.8,a0); float rim=a*(1.-a)*4.; vec3 v=vec3(.42,.2,1.); '+WV+' a*=gz; rim*=gz; c*=smoothstep(.0,.2,a0);   /* v23j: clean key from the green screen, so no choke */ if(uAdd>.5){ gl_FragColor=vec4(v*(rim*.5+a*.06)*uOp*sl*(1.+uHot*2.+uRoar*2.),1.); } else { vec3 b=mix(pow(c,vec3(.8)),c*.9,uSolid); float lum=dot(b,vec3(.3,.5,.2)); vec3 em=mix(vec3(.5,.06,1.),vec3(.85,.08,.7),smoothstep(.2,.6,lum)); gl_FragColor=vec4(b*(.95-.25*uRoar)+em*(lum*2.9+.06*a)*uRoar+v*(uHot*.3*a+uRoar*.35*rim),mix(a*(.94+.06*sl),smoothstep(.08,.8,a0),uSolid)*uOp); } }';   /* v23k: his pick, Option 1: the demon is solid. His body is fully opaque (no gauze weave, no scan lines, no lift in his blacks) and only his smoke stays soft, so he reads as a dark figure in front of the light */   /* v23b: his note, the roar was lost in the dark and the white looked wrong: for the roar the smoke itself lights up from inside, deep violet in the shadows, hot magenta where it is thick, never white or pink */   /* v21b: the demon lifted out of the dark so he reads */   /* v21: the demon's own colours, less purple glow */
  /* v23: his note, the stage 4 beings get the tour dancers' hologram look (r3-dance holoDancerMat): the picture kept faintly inside, tinted,
     edges glowing (found from the cut-out's edge, since a flat picture has no surface to catch a rim), fine scan lines, a band of light that
     climbs through, a flicker, and added light so the room shows through them. HOLO_DL=0 brings back the old picture look. */
  const DL=window.HOLO_DL!=null?!!window.HOLO_DL:true;
  const HL='float hy=vUv.y*6.3; float scan=.7+.3*sin(hy*190.-uT*7.); float band=smoothstep(.9,1.,fract(hy*.32-uT*.38))*.8; float flick=.93+.07*sin(uT*29.+hy*2.);';
  const RING='float rg(vec2 uv){ float b=0.; for(int k=0;k<8;k++){ float th=float(k)*.7853982; b+=AR(uv+vec2(cos(th),sin(th))*uR); } return b*.125; }';
  /* the angel: her own picture stays inside (pale, tinted), the rim comes from her body, not from her glow, so the edge follows her */
  const FA_H='precision highp float; uniform sampler2D map; uniform float uT,uOp,uHot,uAdd; uniform vec3 uCol; uniform vec2 uR; varying vec2 vUv; float al(vec2 q){ vec3 c=texture2D(map,q).rgb; return smoothstep(.05,.32,max(c.r,max(c.g,c.b))); } float AR(vec2 q){ vec3 c=texture2D(map,q).rgb; return smoothstep(.55,.75,max(c.r,max(c.g,c.b))); } '+RING+' void main(){ vec2 uv=vUv; '+HL+' vec3 c=texture2D(map,uv).rgb; if(uAdd>.5){ gl_FragColor=vec4(uCol*c*c*(1.+uHot*.5)*scan*uOp*.5,1.); return; } float lum=dot(c,vec3(.299,.587,.114)); float a=al(uv), ar=AR(uv); float fr=clamp(ar*(1.-rg(uv))*1.4,0.,1.); float sc2=mix(1.,scan,.45), fl2=mix(1.,flick,.5); vec3 pic=mix(c,uCol*lum,.25)*(.45+.8*lum)*a; vec3 o=pic+uCol*fr*.5+vec3(.85,.95,1.)*fr*fr*.15+uCol*band*a*.3; float A=clamp((.7*a+.25*lum*a+.45*fr+band*.15*a)*sc2*fl2,0.,1.)*(1.+uHot*.4);   /* v23: his note, turned down so she reads as a figure of light first, hologram second */ gl_FragColor=vec4(o*A*uOp,1.); }';
  /* the demon: a smoke being, so his darkest parts are his densest light; rim from that density, his fur and claws from the picture's fine detail, his sparks in their own colour */
  const FD_H='precision highp float; uniform sampler2D map; uniform float uT,uOp,uHot,uAdd,uRoar,uSolid; uniform vec3 uCol; uniform vec2 uR; varying vec2 vUv; float al(vec2 q){ return smoothstep(.08,.8,texture2D(map,vec2(.5+clamp(q.x,0.,1.)*.5,q.y)).r); } float lm(vec2 q){ return dot(texture2D(map,vec2(clamp(q.x,0.,1.)*.5,q.y)).rgb,vec3(.299,.587,.114)); } float AR(vec2 q){ return al(q)*pow(clamp(1.-lm(q)/.17,0.,1.),.8); } '+RING+' void main(){ vec2 uv=vUv; '+HL+' vec3 c=texture2D(map,vec2(uv.x*.5,uv.y)).rgb; float a=al(uv); if(uAdd>.5){ float rim=a*(1.-a)*4.; gl_FragColor=vec4(uCol*(rim*.5+a*.06)*uOp*scan*(1.+uHot*2.+uRoar*2.),1.); return; } float lum=dot(c,vec3(.299,.587,.114)); vec2 o1=vec2(uR.x*.15,0.), o2=vec2(0.,uR.y*.15); float lb=(lum+lm(uv+o1)+lm(uv-o1)+lm(uv+o2)+lm(uv-o2))*.2; float spark=clamp(max(c.r,max(c.g,c.b))-.25,0.,1.)*a; float dens=a*max(pow(clamp(1.-lb/.17,0.,1.),.8),spark*2.); float fr=clamp(AR(uv)*(1.-rg(uv))*2.,0.,1.); float hp=clamp(abs(lum-lb)*8.,0.,1.)*a; vec3 em=mix(vec3(.5,.06,1.),vec3(.85,.08,.7),smoothstep(.2,.6,lum)); vec3 o=uCol*(.12*a+.35*dens+hp)+c*spark*1.8+uCol*fr*1.2+vec3(.85,.95,1.)*fr*fr*.35+uCol*band*a*.5+em*(lum*1.5+.1)*uRoar*a; float A=clamp((.25*a+.35*dens+.8*hp+.8*fr+spark+band*.3*a)*scan*flick,0.,1.)*(1.+uHot*.4+uRoar*.6); gl_FragColor=vec4(o*A*uOp,1.); }';
  const COL_A=new T.Color(0xffd27f).lerp(new T.Color(0x7fe8ff),.25), COL_D=new T.Color(0x8a3dff).lerp(new T.Color(0x7fe8ff),.3);
  const DLD=window.HOLO_DLD!=null?!!window.HOLO_DLD:false;   /* v23: his note, the demon stays the solid one hiding in the shadows; only the angel gets the hologram look */
  const FAX=DL?FA_H:FA, FDX=DLD?FD_H:FD, BLEND=(add,angel)=>(add||(angel?DL:DLD))?T.AdditiveBlending:T.NormalBlending;
  const glowTex=(()=>{ const c=document.createElement('canvas'); c.width=c.height=128; const x=c.getContext('2d'), gr=x.createRadialGradient(64,64,2,64,64,64); gr.addColorStop(0,'rgba(255,255,255,1)'); gr.addColorStop(.5,'rgba(255,255,255,.35)'); gr.addColorStop(1,'rgba(255,255,255,0)'); x.fillStyle=gr; x.fillRect(0,0,128,128); return new T.CanvasTexture(c); })();
  const mk=(url,side,angel)=>{ const V=vid(url), piv=new T.Group(), HP=HOLO_POS[angel?'angel':'demon']; piv.position.copy(pol(side*HP.a*D2R,HP.r,Y0)); g.add(piv);
    if(angel){ const w0=HG*480/540; AMASK.piv=piv; AMASK.u.uAM0.value=V.tx; AMASK.u.uAR0.value.set(-w0/2,-HG*.085,w0,HG); }   /* 16 Nov: the angel matte (s-show.js AMASK) reads her picture from here */
    const geo=new T.PlaneGeometry(HG*(angel?480:720)/540,HG);   /* v23j: the demon's new green-screen clip is wider (720x540 a side) */ geo.translate(0,HG/2-HG*.085,0); const layers=[];
    for(const [z,sc,op,add] of [[0,1,1,0],[-.4,1.04,.1,1],[-.8,1.08,.04,1]]){   /* v21: the main layer is a picture for both; the glow layers behind are faint */ const U={map:{value:V.tx},uT:{value:0},uOp:{value:0},uHot:{value:0},uAdd:{value:add},uRoar:{value:0},uSolid:{value:angel?0:1},uCol:{value:angel?COL_A:COL_D},uR:{value:angel?new T.Vector2(9/480,9/540):new T.Vector2(8/720,8/540)}};
      const mat=new T.ShaderMaterial({extensions:{derivatives:true},uniforms:U,vertexShader:VS,fragmentShader:angel?FAX:FDX,transparent:true,depthWrite:false,side:T.DoubleSide,fog:false,blending:BLEND(add,angel)});
      const m=new T.Mesh(geo,mat); m.position.z=z; m.scale.setScalar(sc); m.renderOrder=add?(angel?5:3):4;   /* v23k: the demon's faint glow layers draw before him, so his solid body covers them and they only rim him */ m.frustumCulled=false; piv.add(m); layers.push({m,U,op}); }
    const pool=new T.Mesh(new T.CircleGeometry(2.6,40),new T.MeshBasicMaterial({map:glowTex,color:angel?0xffdf9a:0x7a48ff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false})); pool.rotation.x=-Math.PI/2; pool.position.y=.04; pool.renderOrder=3; piv.add(pool);
    const L=new T.PointLight(angel?0xffe2a8:0x7a48ff,0,14,1.6); L.position.set(0,2.6,.8); piv.add(L);
    // v22: each figure's shadow on the back wall, as if the house lights throw it there: the same moving picture, as a soft dark shape
    // v22: the back wall behind each figure is washed with soft light, and the figure's shadow falls on it: a dark copy of the same moving picture
    // inside a pool of light, so the figure reads as standing in front of the wall, apart from the video
    const SU={map:{value:V.tx},uOp:{value:0},uW:{value:new T.Color(angel?0xffd6a0:0x8a3dff)},uBox:{value:new T.Vector4(.18,.18,.82,.82)}}, KS=1.75/1.12, shm=new T.Mesh(new T.PlaneGeometry(HG*480/540*1.75,HG*1.75).translate(0,HG/2-HG*.085,0),new T.ShaderMaterial({uniforms:SU,vertexShader:VS,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
      fragmentShader:'precision highp float; uniform sampler2D map; uniform float uOp; uniform vec3 uW; uniform vec4 uBox; varying vec2 vUv; float m(vec2 q){ if(q.x<0.||q.x>1.||q.y<0.||q.y>1.) return 0.; '+(angel?'vec3 c=texture2D(map,q).rgb; return smoothstep(.05,.3,max(c.r,max(c.g,c.b)));':'return texture2D(map,vec2(.5+q.x*.5,q.y)).r;')+' } void main(){ vec2 q=(vUv-uBox.xy)/(uBox.zw-uBox.xy); float a=0.; for(int i=-2;i<=2;i++) for(int j=-2;j<=2;j++) a+=m(q+vec2(float(i),float(j))*.007); a/=25.; float r=length((vUv-vec2(.5,.47))*vec2(1.25,1.)); float pool=smoothstep(.62,.05,r); gl_FragColor=vec4(uW*pool*.34*(1.-.92*a)*uOp,1.); }'}));
    { const HP=HOLO_POS[angel?'angel':'demon'], p=pol(side*(HP.a+1.4)*D2R,22.85,Y0+.15); shm.position.copy(p); shm.rotation.y=Math.atan2(-p.x,-p.z); shm.renderOrder=3; g.add(shm); }
    let arr=null;
    if(angel){   /* v23: her arrival (his pick, Kling A): she comes down out of a point of light facing Tripp, lands, and turns slowly out to the house, ending on the first frame of her own clip */
      const AV=vid('holo-angel-arrive.mp4'); AV.el.loop=false; const H2=HG*860/540, ag=new T.PlaneGeometry(HG*480/540,H2); ag.translate(0,H2/2-HG*.085,0); AMASK.u.uAM1.value=AV.tx; AMASK.u.uAR1.value.set(-HG*480/540/2,-HG*.085,HG*480/540,H2);
      const AU={map:{value:AV.tx},uT:{value:0},uOp:{value:0},uHot:{value:0},uAdd:{value:0},uCol:{value:COL_A},uR:{value:new T.Vector2(9/480,9/860)}};
      const am=new T.Mesh(ag,new T.ShaderMaterial({extensions:{derivatives:true},uniforms:AU,vertexShader:VS,fragmentShader:FAX,transparent:true,depthWrite:false,side:T.DoubleSide,fog:false,blending:BLEND(0,true)})); am.renderOrder=4; am.frustumCulled=false; am.visible=false; piv.add(am);
      const bc=document.createElement('canvas'); bc.width=4; bc.height=256; const bx=bc.getContext('2d'), bgr=bx.createLinearGradient(0,0,0,256); bgr.addColorStop(0,'rgba(255,255,255,.55)'); bgr.addColorStop(.75,'rgba(255,255,255,.8)'); bgr.addColorStop(.97,'rgba(255,255,255,1)'); bgr.addColorStop(1,'rgba(255,255,255,0)'); bx.fillStyle=bgr; bx.fillRect(0,0,4,256);
      const btx=new T.CanvasTexture(bc); const BU={map:{value:btx},uOp:{value:0},uC:{value:new T.Color(0xffe2b0)},uT:{value:0}};
      const beam=new T.Mesh(new T.CylinderGeometry(.3,1.35,15,48,1,true),new T.ShaderMaterial({uniforms:BU,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,
        vertexShader:'varying vec2 vUv; varying vec3 vN,vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
        fragmentShader:'precision highp float; uniform sampler2D map; uniform float uOp,uT; uniform vec3 uC; varying vec2 vUv; varying vec3 vN,vV; void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float soft=pow(f,2.2); float dust=.85+.15*sin(vUv.y*60.+uT*1.3)*sin(vUv.x*40.-uT*.7); gl_FragColor=vec4(uC*texture2D(map,vUv).a*soft*dust*uOp,1.); }'}));
      beam.position.y=7.5; beam.renderOrder=5; beam.frustumCulled=false; beam.visible=false; piv.add(beam);
      arr={V:AV,m:am,U:AU,beam,started:false};
      /* v23k: his note, after she lands she looks around the room, then turns slowly as Tripp passes: Kling's look-around take (the one he liked), wings wide so its plane is wider, cut and timed in holo-angel-look.mp4 (source 4.0-8.0 at 1.33x, then the turn 8.0-9.96 slowed to 0.7x) */
      { const LV=vid('holo-angel-look3.mp4');   /* v23k c: his go, one Kling take from her exact landing frame to the reach toward NOCHE (keyframes: first = her landing, last = the reach), so it is the same angel with no change at the switch; played at 1.08x so the orb flies on the strike */   /* v23k b: his note, she glitched switching clips: the look-around now runs on (a slow sway on the orb) until the camera cut at 50.2, and the first switch happens under a landing flash */ LV.el.loop=false; const lg=new T.PlaneGeometry(HG*864/540,H2); lg.translate(0,H2/2-HG*.085,0); AMASK.u.uAM2.value=LV.tx; AMASK.u.uAR2.value.set(-HG*864/540/2,-HG*.085,HG*864/540,H2); const LU={map:{value:LV.tx},uT:{value:0},uOp:{value:0},uHot:{value:0},uAdd:{value:0},uCol:{value:COL_A},uR:{value:new T.Vector2(9/864,9/860)}};
        const lm=new T.Mesh(lg,new T.ShaderMaterial({extensions:{derivatives:true},uniforms:LU,vertexShader:VS,fragmentShader:FAX,transparent:true,depthWrite:false,side:T.DoubleSide,fog:false,blending:BLEND(0,true)})); lm.renderOrder=4; lm.frustumCulled=false; lm.visible=false; piv.add(lm); arr.L={V:LV,m:lm,U:LU,started:false}; }
      /* v23h: his go, a projector cone from the front truss onto her, with dust in it, so she reads as light thrown onto gauze */
      const PU={uOp:{value:0},uC:{value:new T.Color(0xffe6c0)},uT:{value:0}};
      const pc=new T.Mesh(new T.CylinderGeometry(.12,3.1,1,40,1,true).translate(0,-.5,0),new T.ShaderMaterial({uniforms:PU,transparent:true,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false,
        vertexShader:'varying vec2 vUv; varying vec3 vN,vV; void main(){ vUv=uv; vec4 mv=modelViewMatrix*vec4(position,1.); vN=normalize(normalMatrix*normal); vV=normalize(-mv.xyz); gl_Position=projectionMatrix*mv; }',
        fragmentShader:'precision highp float; uniform float uOp,uT; uniform vec3 uC; varying vec2 vUv; varying vec3 vN,vV; void main(){ float f=abs(dot(normalize(vN),normalize(vV))); float a=pow(f,1.05)*(.3+.7*vUv.y)*(.85+.15*sin(vUv.y*50.-uT*1.1)*sin(vUv.x*31.+uT*.6)); gl_FragColor=vec4(uC*a*uOp,1.); }'}));
      pc.renderOrder=5; pc.frustumCulled=false; pc.visible=false; g.add(pc);
      const dn=240, dpos=new Float32Array(dn*3); for(let i=0;i<dn;i++){ const s_=.12+.88*Math.random(), rr=3.0*s_*Math.sqrt(Math.random()), th=Math.random()*TAU; dpos[i*3]=Math.cos(th)*rr; dpos[i*3+1]=-s_; dpos[i*3+2]=Math.sin(th)*rr; }
      const dg=new T.BufferGeometry(); dg.setAttribute('position',new T.BufferAttribute(dpos,3)); const dcv=document.createElement('canvas'); dcv.width=dcv.height=32; { const x=dcv.getContext('2d'), gr=x.createRadialGradient(16,16,0,16,16,16); gr.addColorStop(0,'rgba(255,240,215,1)'); gr.addColorStop(1,'rgba(255,240,215,0)'); x.fillStyle=gr; x.fillRect(0,0,32,32); }
      const dust=new T.Points(dg,new T.PointsMaterial({map:new T.CanvasTexture(dcv),size:.1,sizeAttenuation:true,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,color:0xfff0d8,fog:false})); dust.frustumCulled=false; pc.add(dust);
      arr.pc=pc; arr.PU=PU; arr.dust=dust; }
    BEINGS.push({piv,m:layers[0].m,layers,pool,L,V,side,a:side*A0,additive:angel,ph:BEINGS.length*2.1,on:false,lastC:-1,shadow:shm,SU,arr}); };
  window.HOLO_ARR={t0:35.7,len:5.04,x:.35}; window.HOLO_TURN={segs:[[0,1],[40.9,.28],[46.25,.85]]};   /* v23h: his note, still a little fast: a quarter speed and a bit from 40.9 (her turn, clip 1.0-2.0, now runs 42.6-46.2), then near normal so the orb is up in her hand (clip 2.5) for the strike at 46.87 */   /* v23f: his note, still too fast: her loop plays at its own speed until her wings are fully open (clip 0.8 at 41.2), then at about a third of its speed through the turn while she is in frame (41.2-46.3, clip 0.8-2.6), then normal. Times are film seconds; the first rate runs from the hand-off */   /* v23e: his note, the turn was still fast: from her wings opening (40.39) her loop runs at half speed, so the turn (clip 0.8-3.0) runs 42.0-46.4 and ends as Tripp lands; normal speed after */ window.HOLO_LOOK={t1:50.2,x:.04,fl:40.42,flash:0};   /* v23k: the look-around plays from her landing (40.39) to 46.2, then her own clip (turned, orb up) takes over for the strike at 46.87 */ window.HOLO_ALVL=.72; window.HOLO_BEAM=.2;   /* film times: her beam opens at t0; the clip ends at t0+len; the last .35 s crossfades into her own clip */
  mk('holo-angel-pp.mp4',-1,true); mk('holo-demon-pp.mp4',1,false);
  window.HOLO_ROAR={at0:12.35};   /* v23k: his note, he screams right as the pyro (54.4) and the cryo (55.02) go: the lunge hits (clip 6.5) at 54.4 and the roar peaks (clip 7.1) on the cryo */   /* v23j: new green-screen take: he turns (clip 4-5.5), lunges at the angel (6.0) and roars deepest about 6.8; lands 52.6-53.4 as the room turns onto him */   /* v23c: his note, the roar is the lean forward where he taunts the angel (forward clip 5.25-6.5, deepest at 6.0): it starts at film 52.45 as the room turns onto him and is deepest at 53.2 */   // demon clip time at film 0 (pp clip, 20.08 s): peak roar (7.5) at film 53.3   /* v21: each clip played forward then back, so the loop never jumps */   /* both from Kling take 2 */
  const _bw=new T.Vector3(), _bc=new T.Vector3();
  st.anim.push((t,dt,F)=>{ if(!BEINGS.length) return; const ft=FILM.on?FILM.t:-1, k=F*SHOW.dim, hot=FILM.on?Math.max(0,1-Math.abs(ft-HOLOB.imp+.1)/.38):0;
    // v21: no drift, no launch, no flicker. Each plays its clip once, start to finish, slowed so it lasts exactly while its side of the stage is in
    // the picture: it starts just before that side comes into frame and ends as it leaves. Outside the film they simply loop.
    BEINGS.forEach((B,bi)=>{ const el=B.V.el, w=HOLOB.win[bi]; let op, live;
      if(FILM.on){ live=!window.__clash; op=live?1:0;   /* v21: on for the whole film, never switched or faded off in shot */
        /* v23: his note, the demon roars as the room turns past it. The clips had been looping since the page loaded, so where the roar fell was
           chance. At the start of the film the demon's clip is set so its roar (forward clip 6-9.5 s, peak 7.5) peaks at film 53.3 s, as the room
           turns past it (the turn from 52.5). */
        if(!B.synced&&!B.additive&&el.duration>1){ B.synced=true; const x=((HOLO_ROAR.at0+ft)%el.duration+el.duration)%el.duration; try{ el.currentTime=x; if(el.__want!==undefined||window.__vids) el.__vt0=performance.now()-x*1000/(el.playbackRate||1); }catch(e){} }
        if(live&&!B.on){ B.on=true; try{ el.loop=true; el.playbackRate=1;   /* v22: normal speed, the clip runs forward then back */ const p=el.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} }
        else if(!live&&B.on){ B.on=false; try{ el.pause(); }catch(e){} } }
      else { B.synced=false; live=!window.__clash&&F>.05; op=live?1:0; if(live&&!B.on){ B.on=true; try{ el.loop=true; el.playbackRate=1; const p=el.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} } else if(!live&&B.on){ B.on=false; try{ el.pause(); }catch(e){} } }
      let ak=1, ar=null;   /* v23: arrival: ak is how much of her own clip shows */
      if(B.arr){ const A=B.arr, HA=HOLO_ARR, hand=HA.t0+HA.len-HA.x;
        if(FILM.on){
          if(el.duration>1){ const SG=HOLO_TURN.segs; let ph=0, x=0, pt=hand, pr=SG[0][1]; for(let q=1;q<SG.length;q++){ if(ft<SG[q][0]) break; x+=(SG[q][0]-pt)*pr; pt=SG[q][0]; pr=SG[q][1]; ph=q; } x+=(ft-pt)*pr; if(B.aph!==ph){ B.aph=ph; B.syncA=true; x=((x%el.duration)+el.duration)%el.duration; try{ el.playbackRate=pr; el.currentTime=x; if(el.__want!==undefined||window.__vids) el.__vt0=performance.now()-x*1000/pr; }catch(e){} } }   /* v23d: his note, she turns to follow Tripp as he lands, on her own loop at its own speed: after her wings open she holds facing front (her clip barely moving, at a fifth of its speed), and from 44.0, as Tripp starts down the stairs, the clip runs at normal speed, so her turn (clip 0.8-3.0) runs 44.1-46.3 and ends as he lands on his mark */
          const LK=window.HOLO_LOOK, kL=LK?smooth(clamp((ft-LK.fl+.05)/.1,0,1)):0, fl=LK?Math.exp(-Math.pow((ft-LK.fl)/.1,2)):0; ak=LK?smooth(clamp((ft-LK.t1)/LK.x,0,1)):smooth(clamp((ft-hand)/HA.x,0,1));
          const inA=ft>=HA.t0-.05&&ft<HA.t0+HA.len+.1, aop=inA?clamp((ft-HA.t0)/.25,0,1)*(LK?1-kL:1-ak):0;
          let lop=0; if(LK&&A.L){ const L=A.L, inL=ft>=hand-.05&&ft<LK.t1+LK.x+.1; lop=inL?kL*(1-ak):0;
            if(inL&&!L.started){ L.started=true; const x=Math.max(0,ft-hand); try{ L.V.el.currentTime=x; const p=L.V.el.play(); if(p&&p.catch) p.catch(()=>{}); if(L.V.el.__want!==undefined||window.__vids) L.V.el.__vt0=performance.now()-x*1000; }catch(e){} }
            if(!inL&&L.started&&ft>=LK.t1+LK.x+.1){ try{ L.V.el.pause(); }catch(e){} } if(ft<hand-.2) L.started=false; L.m.visible=lop>.004; L.U.uT.value=t; }
          if(inA&&!A.started){ A.started=true; const x=Math.max(0,ft-HA.t0); try{ A.V.el.currentTime=x; const p=A.V.el.play(); if(p&&p.catch) p.catch(()=>{}); if(A.V.el.__want!==undefined||window.__vids) A.V.el.__vt0=performance.now()-x*1000; }catch(e){} }
          if(!inA&&A.started&&ft>=HA.t0+HA.len+.1){ try{ A.V.el.pause(); }catch(e){} }
          if(ft<HA.t0-.2){ A.started=false; }
          const bk=clamp((ft-HA.t0+.15)/.6,0,1)*(1-clamp((ft-hand)/1.6,0,1));
          ar={aop,lop,bk,fl,sh:clamp((ft-HA.t0-.8)/3.2,0,1)};
          A.m.visible=aop>.004; A.U.uT.value=t; A.beam.visible=bk+fl>.004; A.beam.material.uniforms.uOp.value=HOLO_BEAM*(bk+1.4*fl*((window.HOLO_LOOK&&HOLO_LOOK.flash===0)?0:1));   /* v23d: softer, his note: the light bringing her in was too bright */ A.beam.material.uniforms.uT.value=t;   /* v23: a soft shaft of light, bright in its core and fading at its edges */
        } else { if(B.aph!==undefined){ B.aph=undefined; try{ el.playbackRate=1; }catch(e){} } B.syncA=false; A.started=false; A.m.visible=false; A.beam.visible=false; if(A.L){ A.L.started=false; A.L.m.visible=false; } } }
      op*=FILM.on?(1-.62*smooth(clamp((ft-76.5)/1.6,0,1))):Math.min(1,k*1.8); if(window.__trippDim!==false&&FILM.on) op*=B.additive?HOLO_ALVL:1;   /* v23k: the demon stays at full, solid, whatever the room does */   /* v23d: his note, the angel went too dark when she arrived (she was dimmed with the room) and too bright when the lights came back: she now holds one steady level through the whole film */   /* t23 test: the holograms go down with the room for Tripp's entrance */   /* v22: in the film they are there from the first frame to the last, never faded; dimmed for the overhead shot at the end */   /* t22: in the tour they are at full as soon as Stage 4 starts to come round, never half-lit */ for(const Ly of B.layers){ Ly.U.uT.value=t; Ly.U.uHot.value=B.additive?hot:0; Ly.U.uOp.value=op*Ly.op*.96*ak; } if(B.additive&&B.arr){ const A=B.arr, s=(ar&&ar.aop>.5)?0:(ar&&ar.lop>.5&&A.L)?1:2; if(B.shs!==s){ B.shs=s; B.SU.map.value=s===0?A.V.tx:s===1?A.L.V.tx:B.V.tx; if(s===0) B.SU.uBox.value.set(.18,.18,.82,1.2); else if(s===1) B.SU.uBox.value.set(-.076,.18,1.076,1.2); else B.SU.uBox.value.set(.18,.18,.82,.82); } }   /* v23k: his note, her shadow was off: it was cut from her standing loop all through the descent and the look-around; it now comes from whichever picture of her is showing, scaled to its own frame, so it moves with her */
      if(ar){ B.arr.U.uOp.value=op*.96*ar.aop; B.arr.U.uHot.value=(HOLO_LOOK.flash??7)*ar.fl; if(B.arr.L){ B.arr.L.U.uOp.value=op*.96*ar.lop; B.arr.L.U.uHot.value=(HOLO_LOOK.flash??7)*ar.fl; } }   /* the landing flash: she flares as she lands and the switch to the look-around happens inside it */   /* v21: full picture, low glow */
      if(B.additive){ const P=AMASK.u.uAP.value, on=(op>.004&&(!ar||ft>=HOLO_ARR.t0-.2))?1:0; P.set(on*clamp(op*ak*4,0,1),on*(ar?clamp(ar.aop*op*4,0,1):0),on*(ar?clamp(ar.lop*op*4,0,1):0)); if(window.AMASK_OFF) P.set(0,0,0); }   /* the angel matte: how much of each of her three clips is showing */
      const roar=0;   /* v23c: his note, no highlight on the roar: the demon stays in his own colours and in the dark. v23d: the wall light behind him is off too (his note: not working) */ for(const Ly of B.layers) Ly.U.uRoar.value=roar;   /* v23: the demon lives in the dark; his roar lights him and throws his shadow on the wall */
      const hB=B.additive?hot:0; B.pool.material.opacity=op*(B.additive?.24:.05+.3*roar)*(1+hB); B.L.intensity=op*(B.additive?2.2:.15+7.*roar)*(1+2*hB);   /* v23h: her gold spills further onto the girls and the floor near her (was .8) */   /* v23h: his note, the demon looked like a purple smear at the strike: the impact flare no longer washes him violet */ B.SU.uOp.value=window.__holoShadow===false?0:op*(B.additive?(ar?Math.max(ar.sh*(1-ak),ak):1):0.); if(ar){ B.pool.material.opacity+=op*.5*ar.bk; B.L.intensity+=op*2.2*ar.bk; } B.shadow.visible=op>.004&&window.__holoShadow!==false;
      B.piv.visible=op>.004&&(!ar||ft>=HOLO_ARR.t0-.2); if(B.arr&&B.arr.pc){ const A=B.arr, vis=window.HOLO_PROJ_ON&&B.piv.visible?(FILM.on?smooth(clamp((ft-40.6)/1.4,0,1)):1):0;   /* v23i: his note, the spotlight on her looked bad: the projector cone is off (HOLO_PROJ_ON) */ A.pc.visible=vis>.003; if(A.pc.visible){ const HP=HOLO_POS.angel, Pl=pol(B.side*HP.a*D2R,13.6,Y0+9.6), Tl=pol(B.side*HP.a*D2R,HP.r,Y0+3.1), d=Tl.clone().sub(Pl), L=d.length(); A.pc.position.copy(Pl); A.pc.quaternion.setFromUnitVectors(new T.Vector3(0,-1,0),d.normalize()); A.pc.scale.set(1,L,1); A.PU.uOp.value=op*.42*vis; A.PU.uT.value=t; A.dust.material.opacity=Math.min(.9,op*.9*vis); A.dust.rotation.y+=dt*.06; } }   /* v23h: the projector cone and its dust fade in once her wings are open */ if(!B.piv.visible){ if(B.shadow) B.shadow.visible=false; return; }
      { const HP=HOLO_POS[B.additive?'angel':'demon']; B.piv.position.copy(pol(B.side*HP.a*D2R,HP.r,Y0)); B.a=B.side*HP.a; }
      B.piv.getWorldPosition(_bw); camera.getWorldPosition(_bc); B.piv.rotation.y=Math.atan2(_bc.x-_bw.x,_bc.z-_bw.z)-(st.group.rotation.y||0); }); }); }

await __tick();
// ================= THE BACK WALKWAY: behind the last row, outside the platform's edge =================
// A 1.3 m walkway hangs off the back of the turntable at the level of the last row and turns with it. It links the three aisles behind the
// audience, so the company can run round the back of the house. A glass barrier with a brass rail stands on its outer edge: nothing in a sightline.
const WALKB={g:new T.Group()};
{ const g=WALKB.g, y=LAY.rows[LAY.rows.length-1].y, r0=12.96, r1=14.3, th=Math.asin(clamp((LAY.sideC+SP.side/2+1.0)/r0,-1,1)), a0=-Math.PI/2-th, N=64;
  const deck=new T.Mesh(new T.RingGeometry(r0,r1,N,1,a0,th*2),new T.MeshStandardMaterial({color:0x1b1822,roughness:.5,metalness:.3,emissive:0x15121c,emissiveIntensity:1})); deck.rotation.x=-Math.PI/2; deck.position.y=y+.004; deck.receiveShadow=true; g.add(deck);
  const under=new T.Mesh(new T.RingGeometry(r0,r1,N,1,a0,th*2),new T.MeshStandardMaterial({color:0x0b0a10,roughness:.6,metalness:.5,side:T.BackSide})); under.rotation.x=-Math.PI/2; under.position.y=y-.22; g.add(under);
  const cyl=(r,h,yb,mat)=>{ const m=new T.Mesh(new T.CylinderGeometry(r,r,h,N,1,true,-th,th*2),mat); m.position.y=yb+h/2; return m; };   // three.js cylinders start their arc on +z: the back of the house
  g.add(cyl(r1,.22,y-.22,new T.MeshStandardMaterial({color:0x0e0d13,roughness:.5,metalness:.6,side:T.DoubleSide})));
  g.add(cyl(r1-.02,1.08,y,new T.MeshStandardMaterial({color:0xbfe6ff,roughness:.05,metalness:.1,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.6,emissive:0x1a2a36,emissiveIntensity:.6})));   // the glass
  const brass=new T.MeshStandardMaterial({color:0xd9a441,roughness:.25,metalness:1,envMapIntensity:1.3});
  const rail=new T.Mesh(new T.TorusGeometry(r1-.02,.028,8,N,th*2),brass); rail.rotation.x=Math.PI/2; rail.rotation.z=Math.PI/2-th; rail.position.y=y+1.1; g.add(rail);
  const nose=new T.Mesh(new T.TorusGeometry(r1-.06,.012,6,N,th*2),glow(0xffb060,.8)); nose.rotation.x=Math.PI/2; nose.rotation.z=Math.PI/2-th; nose.position.y=y+.03; g.add(nose);   // a lit line along the edge, like the aisles
  const posts=[], brackets=[]; for(let i=0;i<=10;i++){ const a=-th+i/10*th*2, s=Math.sin(a), c=Math.cos(a); const p=new T.CylinderGeometry(.022,.022,1.1,8); p.translate(s*(r1-.02),y+.55,c*(r1-.02)); posts.push(p);
    const b=new T.BoxGeometry(.09,.2,1.5); b.rotateY(a); b.translate(s*(r1-.72),y-.12,c*(r1-.72)); brackets.push(b); }
  g.add(new T.Mesh(mergeGeos(posts),brass)); g.add(new T.Mesh(mergeGeos(brackets),M.steel));
  // glass down both sides of the rake: wherever a tier stands more than a step above the floor at the platform's edge, a 1.1 m glass guard
  // with a brass rail runs along that edge, stepping down with the rows, and meets the walkway's glass at the back. Nobody can step off the side.
  { const Rg=13.46, fz=SP.fz,   /* at the platform's own edge: the end seats of the rows reach to 13.45 m, so the glass stands outside all of them */ phiOf=rho=>{ const c=(rho*rho-Rg*Rg-fz*fz)/(2*fz*Rg); return c>=1?0:c<=-1?Math.PI:Math.acos(c); }, glassM=new T.MeshStandardMaterial({color:0xbfe6ff,roughness:.05,metalness:.1,transparent:true,opacity:.16,side:T.DoubleSide,depthWrite:false,envMapIntensity:1.6,emissive:0x1a2a36,emissiveIntensity:.6});
    const rails=[], posts2=[], panes=[];
    for(let i=0;i<LAY.rows.length;i++){ const yb=LAY.rows[i].y; if(yb<.42) continue; const pa=phiOf(rowStart(i)), pb=i+1<LAY.rows.length?phiOf(rowStart(i+1)):th, lo=Math.max(pb,th), hi=pa; if(hi-lo<.004) continue;
      for(const sgn of [-1,1]){ const t0=sgn>0?lo:-hi, len=hi-lo; const c=new T.CylinderGeometry(Rg,Rg,1.1,Math.max(2,Math.ceil(len*40)),1,true,t0,len); c.translate(0,yb+.55,0); panes.push(c);
        const tr=new T.TorusGeometry(Rg,.026,6,Math.max(2,Math.ceil(len*40)),len); tr.rotateZ(Math.PI/2-(t0+len)); tr.rotateX(Math.PI/2); tr.translate(0,yb+1.1,0); rails.push(tr);
        const a=sgn*hi, pp=new T.CylinderGeometry(.022,.022,1.1+(i?Math.max(0,yb-LAY.rows[i-1].y):0),8); pp.translate(Math.sin(a)*Rg,yb+.55-(i?Math.max(0,yb-LAY.rows[i-1].y)/2:0),Math.cos(a)*Rg); posts2.push(pp); } }
    if(panes.length){ const gm=new T.Mesh(mergeGeos(panes),glassM); gm.renderOrder=3; g.add(gm); g.add(new T.Mesh(mergeGeos(rails),brass)); g.add(new T.Mesh(mergeGeos(posts2),brass)); } }
  disc.add(g); }
function walkUpdate(){ WALKB.g.visible=S.room==='theatre'&&FOLD.k<.02&&(FOLD.rake===undefined||FOLD.rake>.97)&&(!TOUR.on||TOUR.step>=3); }

await __tick();
// ================= LIGHTNING: short forks that travel =================
// A bolt is a short jagged streak that runs from one point to another in a fraction of a second, arcing a little on the way, with a flare at its
// head. The dark act uses them every time a dancer jumps (the bolt runs from where they were to where they land, then forks to the company
// standing nearest), and on the drop five of them run to the team's name and light it. Stage 4's two beings use the same bolts for their strike.
const BOLT={N:120,SEG:7,list:[],g:null};
{ const n=BOLT.N*BOLT.SEG*2*3, pos=new Float32Array(n*3), col=new Float32Array(n*3), geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(pos,3)); geo.setAttribute('color',new T.BufferAttribute(col,3));
  const ln=new T.LineSegments(geo,new T.LineBasicMaterial({vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); ln.frustumCulled=false; ln.renderOrder=6;
  const pg=new T.BufferGeometry(), pp=new Float32Array(BOLT.N*3), pc=new Float32Array(BOLT.N*3); pg.setAttribute('position',new T.BufferAttribute(pp,3)); pg.setAttribute('color',new T.BufferAttribute(pc,3));
  const pts=new T.Points(pg,new T.PointsMaterial({map:flareTex,size:1.5,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); pts.frustumCulled=false; pts.renderOrder=6;
  BOLT.g=new T.Group(); BOLT.g.add(ln); BOLT.g.add(pts); scene.add(BOLT.g); Object.assign(BOLT,{pos,col,geo,pp,pc,pg,pts});
  for(let i=0;i<BOLT.N;i++) BOLT.list.push({t:-9,dur:.2,a:new T.Vector3(),b:new T.Vector3(),c:new T.Color(),lift:.5,len:.3,seed:i,w:.03}); }
let _boltI=0;
function boltFire(a,b,o){ o=o||{}; const B=BOLT.list[_boltI++%BOLT.N]; B.t=performance.now()/1000; B.a.copy(a); B.b.copy(b); B.dur=o.dur||.18; B.c.set(o.color||0xdff6ff); B.lift=o.lift===undefined?Math.min(1.2,a.distanceTo(b)*.12):o.lift; B.len=o.len||.32; B.w=o.w||.03; B.seed=Math.floor(Math.random()*1e4); return B; }
const _b1=new T.Vector3();
function boltsUpdate(){ const now=performance.now()/1000, P=BOLT.pos, C=BOLT.col; let v=0, c=0, any=false; BOLT.list.forEach((B,bi)=>{ const age=now-B.t, live=age>=0&&age<B.dur*(1+B.len)+.03, head=age/B.dur, jit=Math.floor(now*45)+B.seed; if(live) any=true;
    for(let k=0;k<3;k++) for(let sI=0;sI<BOLT.SEG;sI++){ for(const e of [sI,sI+1]){ if(!live){ P[v++]=0; P[v++]=-99; P[v++]=0; C[c++]=0; C[c++]=0; C[c++]=0; continue; }
          const u=clamp(head-B.len*(1-e/BOLT.SEG),0,1), w=Math.sin(Math.PI*e/BOLT.SEG)*.22; _b1.copy(B.a).lerp(B.b,u); _b1.y+=Math.sin(Math.PI*u)*B.lift;
          _b1.x+=(h01(jit+e*11+1)-.5)*w*2+(k-1)*B.w; _b1.y+=(h01(jit+e*11+2)-.5)*w*2+(k-1)*B.w; _b1.z+=(h01(jit+e*11+3)-.5)*w*2; P[v++]=_b1.x; P[v++]=_b1.y; P[v++]=_b1.z; const f=.55+.45*e/BOLT.SEG; C[c++]=B.c.r*f; C[c++]=B.c.g*f; C[c++]=B.c.b*f; } }
    const u=clamp(head,0,1); _b1.copy(B.a).lerp(B.b,u); _b1.y+=Math.sin(Math.PI*u)*B.lift; BOLT.pp[bi*3]=live?_b1.x:0; BOLT.pp[bi*3+1]=live?_b1.y:-99; BOLT.pp[bi*3+2]=live?_b1.z:0; BOLT.pc[bi*3]=B.c.r; BOLT.pc[bi*3+1]=B.c.g; BOLT.pc[bi*3+2]=B.c.b; });
  BOLT.g.visible=any; if(any||BOLT.was){ BOLT.geo.attributes.position.needsUpdate=true; BOLT.geo.attributes.color.needsUpdate=true; BOLT.pg.attributes.position.needsUpdate=true; BOLT.pg.attributes.color.needsUpdate=true; } BOLT.was=any; }
// ---- the dark act: a bolt for every jump, forks to the company it lands beside, and five to the name on the drop ----
const SPK={last:[-9,-9,-9,-9,-9,-9,-9],drop:false,bn:[0,0,0,0,0,0,0],acc:0};
// back in the dark on "bring the energy one more time": bolts run between people all over the set, and each one flashes as it is hit
function dark2Update(dt){ if(!FILM.on||!SUITS.meshes.length) return; const ft=FILM.t, L=SUITS.meshes; SPK.acc+=dt*(13+9*clamp((ft-33.26)/3.4,0,1)); let g=0;
  while(SPK.acc>=1&&g++<8){ SPK.acc-=1; const A=L[Math.floor(Math.random()*L.length)]; let B=null; for(let k=0;k<6&&!B;k++){ const c=L[Math.floor(Math.random()*L.length)]; const d=c.m.position.distanceTo(A.m.position); if(c!==A&&d>2.5&&d<22) B=c; } if(!B) continue;
    _s1.copy(A.m.position); _s1.y+=1.2; _s2.copy(B.m.position); _s2.y+=1.2; const dur=.1+_s1.distanceTo(_s2)*.012; boltFire(_s1,_s2,{dur,len:.5,w:.04,color:[0xfff2c8,0xffc400,0xffb0a8,0xff3a3a,0xffffff][Math.floor(Math.random()*5)]}); A.hit=ft; B.hit=ft+dur; } }
const _s1=new T.Vector3(), _s2=new T.Vector3();
function actWorld(j,wi,out){ if(j===0) return leadWorld(out); const d=wi>=0?ACT.wins[wi].dest:-1, sp=d>=0?TW_OUT[d][j]:TW_IN[j]; return out.copy(pol(stageAngle(2)+sp[0]*D2R,sp[1],STAGE_H+(sp[2]||0)+1.2)); }
function sparksUpdate(t,dt,bt){ if(!FILM.on) return; const ft=FILM.t; if(ft<16||ft>31){ SPK.last.fill(-9); SPK.drop=false; return; }
  for(let j=0;j<7;j++){ const A=actState(j,ft); if(SPK.last[j]===-9){ SPK.last[j]=A.wi; if(A.wi!==0||j!==0||ft>16.4) continue; } else if(A.wi===SPK.last[j]) continue; const from=SPK.last[j]===A.wi?-1:SPK.last[j]; SPK.last[j]=A.wi; if(A.wi<0) continue; if(j>0&&(A.wi===6||A.wi===7)) continue;   /* v18b: no mass jump out to the wings or the towers: the bounce below takes them there one at a time */ actWorld(j,A.wi,_s2);
    if(window.__riseB){ if(j===0&&ft>=24.3) continue; _s1.copy(_s2); _s1.y+=8; _s1.x+=(Math.random()-.5)*1.6; _s1.z+=(Math.random()-.5)*1.6; boltFire(_s1,_s2,{dur:.1,w:j?.024:.06,lift:0,len:.6,color:0xffe9a8}); continue; }   /* option B: each is powered from above, like her, with one thin strike */
    if(j===0){ _s1.copy(_s2); _s1.y+=8.5; _s1.x+=(Math.random()-.5)*2.4; _s1.z+=(Math.random()-.5)*2.4; boltFire(_s1,_s2,{dur:.13,w:.08,lift:0,len:.6,color:0xffffff}); continue; }   // the lead is struck from above
    if(from<0||ACT.wins[from].dest===ACT.wins[A.wi].dest){ leadWorld(_s1); boltFire(_s1,_s2,{dur:.14,w:.05,lift:.5,len:.45,color:0xfff6e0}); }           // lit where they stand: it comes from the lead
    else { actWorld(j,from,_s1); boltFire(_s1,_s2,{dur:.14,w:.055,len:.45,color:[0xfff2c8,0xffc400,0xffb0a8,0xff3a3a][j%4]}); } }                         // the trace of a teleport: from where they were to where they are
  { const COL=[0xfff2c8,0xffc400,0xffb0a8,0xff3a3a]; if(!SPK.bk||ft<ACT.wins[6].t-.3) SPK.bk={};
    const top=side=>{ for(const S_ of SUITS.meshes) if(S_.lv>=0&&!S_.d.ride&&S_.d.y>P4-.2&&(S_.d.a<0?0:1)===side) return S_; return null; };
    const whoPos=(who,wi,side,out)=>{ if(who==='C'){ const S_=top(side); if(!S_) return leadWorld(out); out.copy(S_.m.position); out.y+=1.2; return out; } return actWorld(who,wi,out); };
    for(const wi of [6,7]) for(const side of [0,1]){ const T_=bounceTurn(wi,side,ft); if(!T_) continue; const key=wi*100+side*10+T_.k; if(SPK.bk[key]) continue; SPK.bk[key]=1; if(T_.since>.2) continue;
      const seq=BNC.seq[wi][side]; whoPos(T_.who,wi,side,_s2); if(window.__riseB){ _s1.copy(_s2); _s1.y+=7; _s1.x+=(Math.random()-.5)*1.4; boltFire(_s1,_s2,{dur:.09,w:.022,lift:0,len:.6,color:0xffe9a8}); continue; } if(T_.k===0) leadWorld(_s1); else whoPos(seq[(T_.k-1)%3],wi,side,_s1);
      boltFire(_s1,_s2,{dur:.11,w:T_.k?.05:.065,lift:T_.k?.35:.8,len:.5,color:T_.k?COL[(T_.k+side)%4]:0xffffff});                                  // the bounce: lead to the first, then one to the next
      if(wi===7&&T_.k===2){ actWorld(side?2:1,wi,_s1); boltFire(_s2,_s1,{dur:.11,w:.045,lift:.3,len:.5,color:COL[side]}); } }                        // and a fork down to the one on the high platform
    SUITS.meshes.forEach((S_,i)=>{ if(S_.lv<0) return; if(ft<16.5){ S_.bf=0; return; } const M_=S_.mom||(S_.mom=companyMoments(S_,i));
      M_.forEach(([s_,dd,trio],n)=>{ const bit=1<<n; if(trio||((S_.bf||0)&bit)||ft<s_-.02||ft>s_+.2) return; S_.bf=(S_.bf||0)|bit; _s2.copy(S_.m.position); _s2.y+=1.2; if(window.__riseB){ _s1.copy(_s2); _s1.y+=7; _s1.x+=(Math.random()-.5)*1.4; boltFire(_s1,_s2,{dur:.09,w:.02,lift:0,len:.6,color:0xffe9a8}); return; } leadWorld(_s1); boltFire(_s1,_s2,{dur:.12,w:.04,lift:.9,len:.5,color:n?0xfff2c8:0xdfeaff}); }); }); }   /* v18b: every moment on the levels is struck: the eye is led there */
  if(!SPK.drop&&ft>=30.3){ SPK.drop=true; const sign=pol(stageAngle(2),21.6,STAGE_H+1.9); for(let j=0;j<7;j++){ actWorld(j,ACT.last,_s1); _s2.copy(sign); _s2.x+=(j-3)*.5; boltFire(_s1,_s2,{dur:.22,color:0xffe0d0,w:.05,lift:1.4}).t+=j*.02; } } }

await __tick();
// ================= THE TEAM NAMES: each stage earns its name =================
// Stage 3's name is lit by the dark act's lightning (see the arch). On Stage 4 the angel and the shadow being each throw a strike at the other;
// the two meet in the middle of the stage and the name appears where they hit. Stage 1's name flies in as a gold marquee on the first big hit.
function teamSignTex(name,hex){ const c=document.createElement('canvas'); c.width=1024; c.height=320; const x=c.getContext('2d'); x.textAlign='center'; x.textBaseline='middle';
  x.shadowColor=hex; x.shadowBlur=38; x.fillStyle=hex; x.font='900 190px Outfit, "Arial Black", Arial, sans-serif'; for(let k=0;k<3;k++) x.fillText(name,512,190);
  x.shadowBlur=10; x.fillStyle='#ffffff'; x.fillText(name,512,190); x.shadowBlur=16; x.font='600 44px Outfit, Arial, sans-serif'; x.fillStyle='#ffffff'; x.fillText('T E A M',512,52); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; }
const SIGNS={};
{ const mk=(k,name,w,y,r)=>{ const st=ST[k], m=new T.Mesh(new T.PlaneGeometry(w,w*320/1024),new T.MeshBasicMaterial({map:teamSignTex(name,TEAMS4[k].hex),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false})); m.position.set(0,STAGE_H+y,-r); m.renderOrder=5; st.group.add(m); return m; };
  const s4=mk(3,'NOCHE',9.5,4.5,20.9), s1=mk(0,'ORO',8.5,9.1,20.2); SIGNS.s4=s4; SIGNS.s1=s1; let struck=false, flash4=-9, flash1=-9; const _a=new T.Vector3(), _b=new T.Vector3(), _m=new T.Vector3();
  // NOCHE as a solid thing: extruded letters drawn as a hologram (a depth pass first, so the letters hide their own backs and read as a block)
  const N3={g:new T.Group(),ready:false,U:{uT:{value:0},uK:{value:0},uHot:{value:0},uGl:{value:0},uC:{value:new T.Color(TEAMS4[3].hex)}}}; SIGNS.n3=N3;
  (async()=>{ try{ const font=new T.Font(await (await fetch('font-caps.json')).json()), geo=new T.TextGeometry('NOCHE',{font,size:2,height:.95,curveSegments:5,bevelEnabled:true,bevelThickness:.07,bevelSize:.05,bevelSegments:2});
      geo.computeBoundingBox(); const bb=geo.boundingBox, sc=10.2/(bb.max.x-bb.min.x); geo.translate(-(bb.max.x+bb.min.x)/2,-(bb.max.y+bb.min.y)/2,-(bb.max.z+bb.min.z)/2); geo.scale(sc,sc,sc);
      const dm=new T.Mesh(geo,new T.MeshBasicMaterial({colorWrite:false})); dm.renderOrder=5; N3.g.add(dm);
      const mat=new T.ShaderMaterial({uniforms:N3.U,transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
        vertexShader:'uniform float uT,uGl; varying vec3 vN,vV,vW,vO; void main(){ vec3 q=position; float gb=floor(position.y*2.6+uT*13.); q.x+=step(.9,fract(sin(gb*91.7)*43758.5))*(fract(sin(gb*3.1+floor(uT*22.))*917.)-.5)*1.1*uGl; vec4 w=modelMatrix*vec4(q,1.); vW=w.xyz; vO=normal; vN=normalize(mat3(modelMatrix)*normal); vV=cameraPosition-w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
        fragmentShader:'precision highp float; uniform float uT,uK,uHot; uniform vec3 uC; varying vec3 vN,vV,vW,vO; void main(){ float nv=abs(dot(normalize(vN),normalize(vV))), fr=pow(1.-nv,1.6); float front=step(.6,vO.z); float I=mix(.2+.55*fr,.62+.3*fr,front); float sl=.74+.26*sin(vW.y*30.-uT*7.); float fk=(.86+.14*sin(uT*41.)*sin(uT*13.7))*(fract(sin(floor(uT*12.)*12.9)*43758.5)<.06?.35:1.); vec3 c=mix(uC*1.15+vec3(.06,.03,.1),vec3(1.,.96,.9),uHot); float a=I*sl*fk*uK*(1.+1.6*uHot); gl_FragColor=vec4(c*a,a); }'});
      const m=new T.Mesh(geo,mat); m.renderOrder=6; N3.g.add(m);
      const ed=new T.LineSegments(new T.EdgesGeometry(geo,28),new T.LineBasicMaterial({color:0xffffff,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false})); ed.renderOrder=7; N3.g.add(ed);
      const ring=new T.Mesh(new T.RingGeometry(.86,1,72),new T.MeshBasicMaterial({color:0xfff0d8,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false})); ring.renderOrder=6;
      N3.g.position.set(0,STAGE_H+5.7,-19.1);   /* v23h: 1 m higher (clear of the platform dancers) and 1.5 m forward (in front of the LED rain) */ N3.g.visible=false; ring.position.copy(N3.g.position); ring.visible=false; const core=new T.Sprite(new T.SpriteMaterial({map:flareTex,color:0xfff0d6,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,fog:false})); core.position.copy(N3.g.position); core.renderOrder=7; core.visible=false; ST[3].group.add(core);
      ST[3].group.add(N3.g); ST[3].group.add(ring); Object.assign(N3,{m,ed,ring,dm,core}); N3.ready=true; }catch(e){ console.warn('noche3d',e); } })();
  let boom4=false; const T_IMP=47.03;   /* the impact lands on a hit in the music */
  /* v23g: his note, the beam that makes NOCHE comes from the angel's own glowing orb (in her hand, at her waist in her clip), and the orb powers up for about a second before it fires */
  window.HOLO_ORB={x:.70,y:2.78}; window.NOCHE_BEAM={a:-42,r:22.6,y:3.6};   /* v23h: his note, the orb didn't read: her beam now runs along the back wall behind her, from high on the wall near the stage's edge, to NOCHE */ const _o=new T.Vector3(); const ORBFX=new T.Sprite(new T.SpriteMaterial({map:flareTex,color:0xfff0c8,transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,depthTest:false,fog:false})); ORBFX.renderOrder=8; ORBFX.visible=false; scene.add(ORBFX);
  const orbAt=(A,v)=>{ A.piv.updateWorldMatrix(true,false); return A.piv.localToWorld(v.set(HOLO_ORB.x,HOLO_ORB.y,.08)); };
  ST[3].anim.push((t,dt,F)=>{ if(window.__clashDemo&&!window.__clash){ s4.material.opacity=0; s4.visible=false; return; } if(window.__clash) return; const film=FILM.on, ft=film?FILM.t:0, now=performance.now()/1000; for(const c of CLASH.layers) c.visible=false;
    { let vis=false; if(film&&typeof BEINGS!=='undefined'&&BEINGS.length){ const A=BEINGS[0], c=clamp((ft-(T_IMP-1.3))/1.14,0,1), off=ft>=T_IMP-.16?Math.max(0,1-(ft-(T_IMP-.16))/.22):1, kk=c*c*off; if(false&&kk>.002&&A.piv.visible){ orbAt(A,_o); ORBFX.position.copy(_o); const fl=.82+.18*Math.sin(now*42)*c; ORBFX.material.opacity=Math.min(1,kk*1.15)*fl; ORBFX.scale.setScalar(.25+2.1*kk*fl); vis=true; } } ORBFX.visible=vis; }   /* v23g: the orb charges, flickering faster as it fills, and dies as the beam leaves */
    if(!film){ struck=false; s4.visible=true; s4.material.opacity=.85*F*SHOW.dim; if(SIGNS.n3&&SIGNS.n3.ready){ SIGNS.n3.g.visible=false; SIGNS.n3.ring.visible=false; SIGNS.n3.core.visible=false; } return; }
    const N=SIGNS.n3, q=ft-T_IMP; _m.copy(pol(stageAngle(3),19.1,STAGE_H+5.7));
    if(ft<T_IMP-.4){ struck=false; boom4=false; s4.material.opacity=0; s4.visible=false; if(N.ready){ N.g.visible=false; N.ring.visible=false; N.core.visible=false; } return; }
    // the two beings fire straight at each other: two hard beams, no arc
    if(!struck&&ft>=T_IMP-.16&&typeof BEINGS!=='undefined'&&BEINGS.length>1){ struck=true; ST[3].group.updateWorldMatrix(true,false); ST[3].group.localToWorld(_a.copy(pol(NOCHE_BEAM.a*D2R,NOCHE_BEAM.r,STAGE_H+NOCHE_BEAM.y)));   /* v23h: from the wall behind her */ BEINGS[1].piv.getWorldPosition(_b); _b.y+=3.5;
      for(let k=0;k<5;k++){ boltFire(_a,_m,{dur:.22,color:0xffe7b0,w:.14,lift:0,len:.9}).t+=k*.014; boltFire(_b,_m,{dur:.16,color:0xb07cff,w:.11,lift:0,len:.85}).t+=k*.012; } }
    // where they meet: pyro. A hard white-gold shell, a violet shell behind it, a soft cloud that hangs, sparks thrown straight out, a ring of light
    if(!boom4&&q>=0){ boom4=true; if(q<.6){ pyroBurst(_m,560,12,Math.PI,0xfff2d2,true,1.3); pyroBurst(_m,520,7,Math.PI,0xa66bff,true,1.9); pyroBurst(_m,420,3.4,Math.PI,0xffe9c8,true,2.6);
        for(let i=0;i<22;i++){ const an=Math.random()*TAU, el=(Math.random()-.5)*2.4, d=3+Math.random()*6; _a.set(_m.x+Math.cos(an)*Math.cos(el)*d,_m.y+Math.sin(el)*d*.8,_m.z+Math.sin(an)*Math.cos(el)*d); boltFire(_m,_a,{dur:.12+Math.random()*.1,len:.6,w:.05,lift:0,color:i%2?0xfff0c0:0xb884ff}); }
        PYRO.L.position.copy(_m); PYRO.lt=now; PYRO.lI=16; try{ SND.boom=1; }catch(e){} } }
    s4.material.opacity=0; s4.visible=false;   /* the flat sign is not used in the film any more */
    if(N.ready){ const off=1-smooth(clamp((ft-74.4)/1.0,0,1)), on=q>0&&off>0; N.g.visible=on; N.ring.visible=q>0&&q<.9;
      if(on){ const U=N.U, born=1-Math.exp(-q*8), gl=h01(Math.floor(now*16))<.1?.45:1, tear=h01(Math.floor(now*7)+3)<.1?1:0; U.uT.value=now; U.uHot.value=Math.exp(-q*2.2); U.uGl.value=Math.max(tear,1.4*Math.exp(-q*3));
        U.uK.value=off*Math.max(.35,F)*gl*(.8+.1*Math.sin(now*37)); N.ed.material.opacity=off*gl*(.3+.7*Math.exp(-q*2.5));
        N.g.scale.setScalar(Math.max(.001,born+.3*Math.sin(Math.min(q*7,Math.PI))*Math.exp(-q*3)));   /* it comes out of the burst: small and white-hot, overshoots, settles */
        N.g.rotation.y=1.25*Math.exp(-q*2.4)+.22*Math.sin(ft*.55); N.g.rotation.x=-.5*Math.exp(-q*3)+.04*Math.sin(ft*.8); N.g.position.y=STAGE_H+5.7+.12*Math.sin(ft*.9);   /* it turns to face the house as it forms, then keeps a slow sway so the depth shows */ }
      if(N.ring.visible){ N.ring.scale.setScalar(1+q*22); N.ring.material.opacity=.9*Math.exp(-q*5.5); }
      N.core.visible=q>0&&q<1.2; if(N.core.visible){ N.core.scale.setScalar(7+q*16); N.core.material.opacity=Math.min(1,1.6*Math.exp(-q*4.5)); } } });   /* the white heart of the burst */
  /* v22: ORO is the same logo in the same place, treated as a real light: it hangs dark on two chains, flickers on, and the chain motors lift it
     into its spot. The unlit sign is the logo's own letters with no light in them; lit, the glowing logo is laid over it. */
  const unlitTex=(()=>{ const c=document.createElement('canvas'); c.width=1024; c.height=320; const x=c.getContext('2d'); x.textAlign='center'; x.textBaseline='middle';
    x.font='900 190px Outfit, "Arial Black", Arial, sans-serif'; x.lineWidth=5; x.strokeStyle='rgba(120,104,80,.9)'; x.fillStyle='rgba(30,27,24,.96)'; x.fillText('ORO',512,190); x.strokeText('ORO',512,190);
    x.font='600 44px Outfit, Arial, sans-serif'; x.lineWidth=2; x.fillText('T E A M',512,52); x.strokeText('T E A M',512,52); const t=new T.CanvasTexture(c); t.encoding=T.sRGBEncoding; return t; })();
  const O1={g:new T.Group(),sw:new T.Group(),y0:STAGE_H+6.6,y1:STAGE_H+8.5,z:-20.2,top:STAGE_H+12.6,chains:[]}; SIGNS.o1=O1; ST[0].group.add(O1.g); O1.g.add(O1.sw); O1.g.position.set(0,0,O1.z);
  st1Sign: { s1.parent.remove(s1); s1.position.set(0,0,0); O1.sw.add(s1);
    /* v23c (his note): unlit, ORO is polished gold mirror letters that catch the stage light (bevelled normals from the letter shapes), with a glint
       that slides across them, until its inner light flickers on. unlitTex (the dark letters) is kept for reference. */
    const mirror=(()=>{ const W=1024,H=320, draw=(x,fill)=>{ x.textAlign='center'; x.textBaseline='middle'; x.fillStyle=fill; x.font='900 190px Outfit, "Arial Black", Arial, sans-serif'; x.fillText('ORO',512,190); x.font='600 44px Outfit, Arial, sans-serif'; x.fillText('T E A M',512,52); };
      const c=document.createElement('canvas'); c.width=W; c.height=H; const x=c.getContext('2d'); draw(x,'#e8cf8e'); const col=new T.CanvasTexture(c); col.encoding=T.sRGBEncoding;
      const h=document.createElement('canvas'); h.width=W; h.height=H; const hx=h.getContext('2d'); hx.fillStyle='#000'; hx.fillRect(0,0,W,H); hx.filter='blur(5px)'; draw(hx,'#fff'); const hd=hx.getImageData(0,0,W,H).data;
      const n=document.createElement('canvas'); n.width=W; n.height=H; const nx=n.getContext('2d'), out=nx.createImageData(W,H), o=out.data, at=(i,j)=>hd[(Math.min(H-1,Math.max(0,j))*W+Math.min(W-1,Math.max(0,i)))*4]/255;
      for(let j=0;j<H;j++) for(let i=0;i<W;i++){ let dx=(at(i-1,j)-at(i+1,j))*6, dy=(at(i,j+1)-at(i,j-1))*6, dz=1, L=Math.hypot(dx,dy,dz); const k=(j*W+i)*4; o[k]=(dx/L*.5+.5)*255; o[k+1]=(dy/L*.5+.5)*255; o[k+2]=(dz/L*.5+.5)*255; o[k+3]=255; }
      nx.putImageData(out,0,0); const nrm=new T.CanvasTexture(n);
      return {col,nrm}; })();
    const dark=new T.Mesh(s1.geometry,new T.MeshStandardMaterial({map:mirror.col,normalMap:mirror.nrm,normalScale:new T.Vector2(1.6,1.6),metalness:1,roughness:.16,envMapIntensity:3,transparent:true,depthWrite:false,fog:false})); dark.renderOrder=4; dark.position.z=-.01; O1.sw.add(dark); O1.dark=dark;
    const glint=new T.Mesh(s1.geometry,new T.ShaderMaterial({uniforms:{uMap:{value:mirror.col},uT:{value:0},uK:{value:0}},transparent:true,depthWrite:false,blending:T.AdditiveBlending,fog:false,
      vertexShader:'varying vec2 vU; void main(){ vU=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
      fragmentShader:'precision highp float; uniform sampler2D uMap; uniform float uT,uK; varying vec2 vU; void main(){ float a=texture2D(uMap,vU).a; float p=vU.x*1.25-vU.y*.45-mod(uT*.42,2.6)+.7; float b=exp(-p*p*260.)+.35*exp(-p*p*30.); vec3 c=vec3(1.,.93,.78); gl_FragColor=vec4(c*a*b*uK,a*b*uK); }'}));
    glint.renderOrder=5; O1.sw.add(glint); O1.glint=glint;
    const linkG=new T.TorusGeometry(.026,.0075,6,10); linkG.scale(1,1.6,1); const chainM=new T.MeshStandardMaterial({color:0x6d6d72,metalness:.95,roughness:.35});
    for(const sx of [-2.7,2.7]){ const im=new T.InstancedMesh(linkG,chainM,180); im.frustumCulled=false; O1.g.add(im); O1.chains.push({im,x:sx}); sock('hoist',O1.g,sx,O1.top,0,0,false,.8); } }
  const _om=new T.Matrix4(), _oq=new T.Quaternion(), _oe=new T.Euler(), _ov=new T.Vector3(), _os=new T.Vector3(1,1,1), ATT=1.02;   /* the shackles sit just above the TEAM line */
  const FLK=[[0,.07,1],[.07,.2,0],[.2,.25,.8],[.25,.43,0],[.43,.5,1],[.5,.58,.2],[.58,.66,1],[.66,.74,.45]];   /* on, off, on, off, on, dip, on, dip, then on for good */
  const flick=k=>{ if(k<0) return 0; for(const [a,b,v] of FLK) if(k>=a&&k<b) return v; return 1; };
  ST[0].anim.push((t,dt,F)=>{ const film=FILM.on, ft=film?FILM.t:0; let y, lit, sway=0;
    if(!film){ y=O1.y1; lit=F*SHOW.dim; }
    else { const k=ft-58.5, u=clamp((ft-59.35)/4.2,0,1), e=u*u*(3-2*u), off=1-smooth(clamp((ft-74.4)/1.0,0,1)); y=lerp(O1.y0,O1.y1,e); lit=flick(k)*off*Math.max(.55,F)*SHOW.dim;
      const w=Math.sqrt(9.8/3.5), kick=(t0,a)=>{ const q=ft-t0; return q>0?a*Math.exp(-q*.55)*Math.sin(q*w):0; }; sway=kick(59.35,.016)-kick(63.55,.011); }   /* a heavy thing on chains: a small kick as the motors take it, another as they stop */
    O1.sw.position.set(0,y,0); O1.sw.rotation.set(sway*.35,0,sway); s1.visible=lit>.003; s1.material.opacity=.95*lit; O1.dark.visible=true; O1.dark.material.opacity=1-.5*lit; O1.glint.material.uniforms.uT.value=film?ft:t; O1.glint.material.uniforms.uK.value=(1-Math.min(1,lit*1.4))*.8;
    for(const C of O1.chains){ _ov.set(C.x,ATT,0).applyEuler(O1.sw.rotation); const bx=_ov.x, by=y+_ov.y, bz=_ov.z, len=O1.top-by, n=Math.min(180,Math.floor(len/.07));
      for(let i=0;i<180;i++){ if(i<n){ const f=i/n; _oe.set(0,i%2?Math.PI/2:0,0); _oq.setFromEuler(_oe); _om.compose(_ov.set(lerp(bx,C.x,f),by+i*.07+.035,lerp(bz,0,f)),_oq,_os); } else _om.makeScale(0,0,0); C.im.setMatrixAt(i,_om); } C.im.instanceMatrix.needsUpdate=true; } }); }

await __tick();
// ================= PYRO AND THE BURST =================
// A particle burst that dashes out and hangs: soft, full, warm. One row of them fires across Stage 3's lip on the beat after the first
// "say it louder". Through the dark act a charge crackles on each lit body, a little more every bar; on the drop it lets go: every body throws a
// white burst, the room flashes, and the lights are up on the whole company.
const PYRO={N:2600,i:0,g:null};
{ const n=PYRO.N, pos=new Float32Array(n*3), col=new Float32Array(n*3), geo=new T.BufferGeometry(); for(let i=0;i<n;i++) pos[i*3+1]=-99; geo.setAttribute('position',new T.BufferAttribute(pos,3)); geo.setAttribute('color',new T.BufferAttribute(col,3));
  const pts=new T.Points(geo,new T.PointsMaterial({map:flareTex,size:.34,vertexColors:true,transparent:true,blending:T.AdditiveBlending,depthWrite:false,sizeAttenuation:true})); pts.frustumCulled=false; pts.renderOrder=6; scene.add(pts);
  const L=new T.PointLight(0xffc890,0,40,1.6); scene.add(L); Object.assign(PYRO,{pos,col,geo,pts,vel:new Float32Array(n*3),life:new Float32Array(n),max:new Float32Array(n),base:new Float32Array(n*3),L,lt:-9,lI:0}); }
function pyroBurst(o,cnt,sp,spread,hex,up,lifeS){ const c=new T.Color(hex), P=PYRO; for(let k=0;k<cnt;k++){ const i=P.i++%P.N, a=Math.random()*TAU, s=Math.random()*spread, v=sp*(.45+.55*Math.random());
    P.pos[i*3]=o.x; P.pos[i*3+1]=o.y; P.pos[i*3+2]=o.z; P.vel[i*3]=Math.sin(s)*Math.cos(a)*v; P.vel[i*3+1]=(up?Math.cos(s):Math.sin(a)*Math.sin(s))*v; P.vel[i*3+2]=Math.sin(s)*Math.sin(a)*v*(up?1:.0)+(up?0:Math.cos(s)*v*(Math.random()<.5?1:-1));
    P.max[i]=P.life[i]=(lifeS||1.5)*(.6+.6*Math.random()); const w=.75+.25*Math.random(); P.base[i*3]=c.r*w; P.base[i*3+1]=c.g*w; P.base[i*3+2]=c.b*w; } }
function pyroDash(k){ k=k===undefined?2:k; for(const a of [-32,-19,-6,6,19,32]){ const o=pol(stageAngle(k)+a*D2R,15.1,STAGE_H+.15); pyroBurst(o,230,15,.42,0xffd9a0,true,1.9); pyroBurst(o,90,9,.8,0xfff4e0,true,1.2); }
  PYRO.L.position.copy(pol(stageAngle(k),15.5,STAGE_H+4)); PYRO.lt=performance.now()/1000; PYRO.lI=9; try{ SND.boom=1; }catch(e){} }
let _gerb=0;
let _flashEl=null, _dropDone=false, _drop2=false, _crk=0, _zb=0, _le=0, _la=0;
const _lw=new T.Vector3(), _lb=new T.Vector3();
function burstUpdate(dt){ const P=PYRO, now=performance.now()/1000; let any=false;
  for(let i=0;i<P.N;i++){ if(P.life[i]<=0) continue; any=true; P.life[i]-=dt; const k=Math.max(0,P.life[i]/P.max[i]), dr=Math.exp(-dt*2.9); P.vel[i*3]*=dr; P.vel[i*3+1]=P.vel[i*3+1]*dr-dt*2.4; P.vel[i*3+2]*=dr;
    P.pos[i*3]+=P.vel[i*3]*dt; P.pos[i*3+1]+=P.vel[i*3+1]*dt; P.pos[i*3+2]+=P.vel[i*3+2]*dt; const f=k*k*(.7+.3*Math.sin(now*40+i)); P.col[i*3]=P.base[i*3]*f; P.col[i*3+1]=P.base[i*3+1]*f*(.55+.45*k); P.col[i*3+2]=P.base[i*3+2]*f*k; if(P.life[i]<=0) P.pos[i*3+1]=-99; }
  if(any||P.was){ P.geo.attributes.position.needsUpdate=true; P.geo.attributes.color.needsUpdate=true; } P.was=any; P.L.intensity=P.lI*Math.exp(-(now-P.lt)*4.5); P.L.visible=P.L.intensity>.02;
  if(!FILM.on){ _dropDone=false; ZAP.u.value=0; return; } const ft=FILM.t;
  if(ft>=54.4&&ft<62.4){ _gerb+=dt*28; let g=0; while(_gerb>=1&&g++<8){ _gerb-=1; const a=[-20,-14,-8,8,14,20][Math.floor(Math.random()*6)], o=pol(stageAngle(0)+a*D2R,15.0,STAGE_H+.4); pyroBurst(o,3,7.5,.16,0xffd27a,true,1.15); } }   /* v18: gold fountains along Stage 1's front while the room comes round to ORO */
  ZAP.a.value=stageAngle(2); { const k=ft-30.48, k2=ft-36.75, fl=.6+.4*h01(Math.floor(ft*30)+11); ZAP.u.value=Math.max(k>=0&&k<2.7?smooth(clamp(k/.6,0,1))*Math.exp(-k*1.15)*fl*(k>2.0?(2.7-k)/.7:1):0,k2>=0&&k2<3?.3*Math.exp(-k2*1.3)*fl:0,elecK()*.13); }   /* the burst runs as electricity over the screens, the wall, the name and every facing of the set */
  if(ft>=16.1&&ft<30.45&&SUITS.meshes.length){ const u=(ft-16.1)/14.3; leadWorld(_lw); _le+=dt*0; let g=0; while(_le>=1&&g++<6){ _le-=1; const d=.5+Math.random()*(.8+1.6*u), an=Math.random()*TAU, el=(Math.random()-.35)*1.6; _lb.set(_lw.x+Math.cos(an)*Math.cos(el)*d,_lw.y+Math.sin(el)*d,_lw.z+Math.sin(an)*Math.cos(el)*d); boltFire(_lw,_lb,{dur:.07,len:.9,lift:0,w:.02,color:Math.random()<.5?0xffffff:0xbfe4ff}); }
    _la+=dt*(window.__riseB||ft<22.5?0:1.4+2.2*clamp((ft-22.5)/8,0,1)); if(_la>=1){ _la=0; const LD=SUITS.meshes.find(s=>s.lv<0&&s.d.dx===0), lit=LD&&LD.lit?SUITS.meshes.filter(s=>s.lit&&s.lv<0&&s.d.dx!==0):[]; if(lit.length){ const S_=lit[Math.floor(Math.random()*lit.length)]; _lb.copy(S_.m.position); _lb.y+=1.3; boltFire(_lb,_lw,{dur:.2,len:.5,w:.04,lift:.5,color:0xeaf6ff}); } } }   /* v16: once the wedge of seven is lit, the six feed the lead: their energy runs up into her and she starts to rise */   /* the lead pours energy: forks off her body all the time, and arcs out to whoever is lit */
  { const z0=ft>=36.75?36.75:30.48; if(ft>=z0&&ft<z0+2&&ft>=30.48&&!dark2K()&&SUITS.meshes.length){ _zb+=dt*(z0>31?12:34)*Math.exp(-(ft-z0)*1.4); while(_zb>=1){ _zb-=1; const S_=SUITS.meshes[Math.floor(Math.random()*SUITS.meshes.length)], p=S_.m.position, r=Math.random(), a=new T.Vector3(p.x,p.y+.3+Math.random()*1.5,p.z), b=new T.Vector3();
      if(r<.3) b.copy(pol(stageAngle(2)+(Math.random()-.5)*.36,21.6,STAGE_H+1+Math.random()*3.2));                                   /* to the name on the arch */
      else if(r<.6) b.copy(pol(stageAngle(2)+(Math.random()<.5?-1:1)*(34+Math.random()*9)*D2R,R_SCREEN+.2,STAGE_H+.5+Math.random()*6.5));   /* to the edges of the video screens */
      else if(r<.8) b.copy(pol(stageAngle(2)+(Math.random()-.5)*1.3,19+Math.random()*4,STAGE_H+2+Math.random()*6));                    /* up into the set */
      else { const o=SUITS.meshes[Math.floor(Math.random()*SUITS.meshes.length)].m.position; b.set(o.x,o.y+1.2,o.z); }
      boltFire(a,b,{dur:.1+Math.random()*.1,len:.55,w:.035,lift:Math.random()*1.2,color:Math.random()<.45?0xff5a48:0xffe9e0}); } } }
  // the charge: small forks crackle on the lit bodies, more of them as the drop comes
  if(ft>=28.6&&ft<30.45&&SUITS.meshes.length){ _crk+=dt*(3+14*Math.pow((ft-28.6)/1.9,2))*(window.__riseB?.25:1); while(_crk>=1){ _crk-=1; const lit=SUITS.meshes.filter(s=>s.lit); if(!lit.length) break; const S_=lit[Math.floor(Math.random()*lit.length)], p=S_.m.position;
      const a=new T.Vector3(p.x+(Math.random()-.5)*.5,p.y+.5+Math.random()*1.2,p.z+(Math.random()-.5)*.5), b=new T.Vector3(a.x+(Math.random()-.5)*.9,a.y+(Math.random()-.5)*.9,a.z+(Math.random()-.5)*.9); boltFire(a,b,{dur:.06,len:1,lift:0,w:.012,color:0xcfeaff}); } }
  if(ft<30.2) _dropDone=false; if(ft<36.5) _drop2=false;
  if(false&&!_drop2&&ft>=36.75&&ft<37.6){ _drop2=true; for(const S_ of SUITS.meshes){ const p=S_.m.position; _lb.set(p.x,p.y+1.2,p.z); pyroBurst(_lb,26,6,Math.PI,0xffe2d8,true,.6); } P.L.position.copy(pol(stageAngle(2),17,STAGE_H+5)); P.lt=now; P.lI=9; }
  if(!_dropDone&&ft>=30.48&&ft<31.5){ _dropDone=true; for(const S_ of SUITS.meshes){ const p=S_.m.position, o=new T.Vector3(p.x,p.y+1.2,p.z); pyroBurst(o,46,7,Math.PI,0xeaf6ff,true,.7); }
    P.L.position.copy(pol(stageAngle(2),17,STAGE_H+5)); P.lt=now; P.lI=14; if(!_flashEl){ _flashEl=document.createElement('div'); _flashEl.style.cssText='position:fixed;inset:0;background:#fff;pointer-events:none;z-index:9;opacity:0'; document.body.appendChild(_flashEl); } _flashEl._t=now; }
  if(_flashEl&&_flashEl._t!==undefined){ const k=now-_flashEl._t; _flashEl.style.opacity=k<.8?String(.38*Math.exp(-k*5)):'0'; } }   /* night 15: a softer flash */

await __tick();
// ================= THE STEMS: the lead's riser, lightning in bottles =================
// A small riser stands on five slender glass stems. The glass is all but invisible: what you see is the lightning inside each one. The stems
// fire in turn, on the music: every burst bounces up and down its bottle and kicks its side of the riser up, which tips the riser the other way,
// and the next burst catches it. So the climb is a balancing act, faster and faster, reaching the top as the charge is complete. Around the lead
// a sphere of light builds like the globe of a Tesla coil, with arcs from her body to its skin; on the drop the sphere blows outward into the set.
const STEM={g:new T.Group(),seg:12,N:5,R:.5,times:[],lead:null};
{ // the strikes: on the music, twice as often each phrase, until they run together at the top
  const b=60/117.45; for(const [t0,n,step] of [[22.35,4,2*b],[22.35+8*b,4,b],[22.35+12*b,4,b/2],[22.35+14*b,8,b/4]]){ let t=t0; for(let i=0;i<n;i++){ STEM.times.push(t); t+=step; } } for(let t=30.5+b;t<44.3;t+=b) STEM.times.push(t); }   /* v17: once the lift is revealed the stems keep firing, one a beat: the riser rides them */   /* night 14: three slow strikes through the intro, then it steps up on the vocals (22.35), on 25.3, and runs together into the drop */
const STEM_ORD=[0,2,4,1,3];
{ const g=STEM.g; scene.add(g); g.visible=false; STEM.cols=[];
  for(let i=0;i<STEM.N;i++){ const a=i/STEM.N*TAU+.3, cx=Math.cos(a)*STEM.R, cz=Math.sin(a)*STEM.R;
    const tube=new T.Mesh(new T.CylinderGeometry(.075,.075,1,14,1,true),new T.MeshBasicMaterial({color:0x9fc6ff,transparent:true,opacity:.035,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide})); tube.geometry.translate(0,.5,0); tube.position.set(cx,0,cz); g.add(tube);
    const n=2*STEM.seg*2, pos=new Float32Array(n*3), geo=new T.BufferGeometry(); geo.setAttribute('position',new T.BufferAttribute(pos,3));
    const arc=new T.LineSegments(geo,new T.LineBasicMaterial({color:0xffffff,transparent:true,blending:T.AdditiveBlending,depthWrite:false})); arc.frustumCulled=false; arc.position.set(cx,0,cz); g.add(arc);
    const ball=flare(0xe6f2ff,.5); ball.position.set(cx,0,cz); g.add(ball); const foot=new T.Mesh(new T.TorusGeometry(.085,.008,6,20),new T.MeshBasicMaterial({color:0x9fc6ff,transparent:true,opacity:.5})); foot.rotation.x=Math.PI/2; foot.position.set(cx,.01,cz); g.add(foot);
    STEM.cols.push({a,cx,cz,tube,arc,pos,geo,ball,foot,last:-9}); }
  const plat=new T.Group(); g.add(plat); const top=new T.Mesh(new T.CylinderGeometry(.74,.66,.06,36),new T.MeshStandardMaterial({color:0x0c0c12,roughness:.3,metalness:.8})); top.position.y=-.03; plat.add(top);
  const rim=new T.Mesh(new T.TorusGeometry(.74,.016,8,56),new T.MeshBasicMaterial({color:0xdff0ff})); rim.rotation.x=Math.PI/2; plat.add(rim);
  // the globe
  const SU={uK:{value:0},uC:{value:new T.Color(.42,.86,1)},uT:{value:0}};
  const globe=new T.Mesh(new T.SphereGeometry(1,40,28),new T.ShaderMaterial({uniforms:SU,transparent:true,depthWrite:false,blending:T.AdditiveBlending,side:T.FrontSide,
    vertexShader:'uniform float uT; varying vec3 vN,vV,vP,vW; void main(){ vec3 q=position; float gb=floor(position.y*9.+uT*15.); q.x+=step(.9,fract(sin(gb*91.7)*43758.5))*(fract(sin(gb*3.1+floor(uT*24.))*917.)-.5)*.16; vec4 w=modelMatrix*vec4(q,1.0); vP=position; vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=cameraPosition-w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:'precision highp float; uniform float uK,uT; uniform vec3 uC; varying vec3 vN,vV,vP,vW; void main(){ float fr=pow(1.-abs(dot(normalize(vN),normalize(vV))),2.2); float sl=.5+.5*sin(vW.y*52.-uT*8.); float grid=max(smoothstep(.94,1.,abs(sin(vP.y*9.42))),smoothstep(.955,1.,abs(sin(atan(vP.z,vP.x)*8.)))); float fk=(.82+.18*sin(uT*41.)*sin(uT*13.7))*(fract(sin(floor(uT*13.)*12.9)*43758.5)<.08?.3:1.); float a=(fr*1.15+.03+grid*.2)*(.45+.55*sl)*fk*uK; gl_FragColor=vec4(uC*a,a); }'}));   /* a projected hologram: scan lines, a faint lat-long grid, flicker, dropouts and sideways tears */ globe.renderOrder=6; g.add(globe);
  const L=new T.PointLight(0xbfdcff,0,7.5,2); g.add(L);
  const plexi=new T.MeshStandardMaterial({color:0xd8ecff,roughness:.04,metalness:.15,transparent:true,opacity:.14,depthWrite:false});   /* option B: the disc is clear plexiglass: only its edge catches the light, so she still reads as floating */
  const node=flare(0xd6ecff,1.2); node.visible=false; g.add(node);   /* option B2: the point on the floor under her where the dancers' lightning meets and is fired up into her */
  /* v20: the glass tube. A clear acrylic column in three telescoping sections stands under the disc and the lightning that lifts her runs inside it.
     In the dark it cannot be seen, so she floats; when the lights come on its edges and joints catch the light and the trick is shown. The body of
     the tube is almost clear, so the team logo behind it still reads. */
  const GU={uA:{value:0},uT:{value:0}}, gmat=new T.ShaderMaterial({uniforms:GU,transparent:true,depthWrite:false,side:T.DoubleSide,
    vertexShader:'varying vec3 vN,vV,vW; void main(){ vec4 w=modelMatrix*vec4(position,1.0); vW=w.xyz; vN=normalize(mat3(modelMatrix)*normal); vV=cameraPosition-w.xyz; gl_Position=projectionMatrix*viewMatrix*w; }',
    fragmentShader:'uniform float uA,uT; varying vec3 vN,vV,vW; void main(){ vec3 n=normalize(vN), v=normalize(vV); if(dot(n,v)<0.) n=-n; float c=abs(dot(n,v)), fr=pow(1.-c,3.0); vec3 r=reflect(-v,n); vec3 rt=normalize(cross(vec3(0.,1.,0.),v)), up=cross(v,rt), l1=normalize(v+rt*.55+up*.3), l2=normalize(v-rt*.62+up*.15); float s1=pow(max(dot(n,normalize(l1+v)),0.),70.), s2=pow(max(dot(n,normalize(l2+v)),0.),110.), s3=pow(max(dot(r,normalize(vec3(sin(uT*.7)*.8,.3,.52))),0.),55.); float band=smoothstep(.6,.65,c)*smoothstep(.71,.65,c); float sweep=smoothstep(.07,0.,abs(fract(vW.y*.16-uT*.3)-.5))*fr; vec3 env=mix(vec3(1.,.34,.2),vec3(.9,.95,1.),smoothstep(-.25,.6,r.y)); vec3 col=env*(.3+.9*fr)+vec3(1.,.97,.92)*(1.5*s1+1.3*s2+.9*s3+.8*band+.6*sweep); float a=(.05+.6*fr+.45*band+.95*(s1+s2)+.7*s3+.45*sweep)*uA; gl_FragColor=vec4(col,clamp(a,0.,1.)); }'});   /* v21: glass that catches the light: highlights from the rig, the red of the stage in it, and a glint that runs up it */
  const tubeS=[], tubeR=[]; for(let i=0;i<3;i++){ const r=.42-i*.035, m=new T.Mesh(new T.CylinderGeometry(r,r,1,48,1,true),gmat); m.geometry.translate(0,.5,0); m.renderOrder=5; m.visible=false; g.add(m); tubeS.push(m);
    const ring=new T.Mesh(new T.TorusGeometry(r+.006,.011,8,48),new T.MeshBasicMaterial({color:0xe8f4ff,transparent:true,opacity:0,depthWrite:false})); ring.rotation.x=Math.PI/2; ring.visible=false; g.add(ring); tubeR.push(ring); }
  const tubeB=new T.Mesh(new T.CylinderGeometry(.5,.54,.07,48),new T.MeshStandardMaterial({color:0x15151c,roughness:.35,metalness:.85,transparent:true,opacity:0})); tubeB.position.y=.035; tubeB.visible=false; g.add(tubeB);
  Object.assign(STEM,{plat,top,rim,globe,SU,L,topMat:top.material,plexi,node,GU,tubeS,tubeR,tubeB}); }
// where the riser stands at film time t: its height, and its tilt as two small angles (about x and about z)
function stemState(t){ const T_=STEM.times, o={h:0,ax:0,az:0,k:-1,since:9,rate:0}; if(t<T_[0]) return o; let k=-1; while(k+1<T_.length&&T_[k+1]<=t) k++; o.k=k; o.since=t-T_[k];
  const u=clamp((t-24.39)/6.06,0,1); o.rate=clamp((t-22.35)/8.1,0,1); o.h=3.0*(.5*u+.5*smooth(u));
  if(window.__riseB&&(t<30.45||window.__riseB2)){ const S_=STEM.bst||(STEM.bst=T_.filter(x=>x>=24.3&&x<30.2)), n=S_.length, top=window.__riseB2?2.3:3.0; let f=0, last=-9; const dl=window.__riseB2?.22:0; const tt=window.__riseB2?Math.min(t,30.45):t;   /* B2: she tops out lower, and on the lights she simply stays where the last strike put her: no jump */ for(const x0 of S_){ const x=x0+dl; if(x>tt) break; f+=smooth(clamp((tt-x)/.26,0,1)); last=x; } if(window.__riseB2&&t>=30.2) f=n;   /* option B: every strike that hits her lifts her a step; between strikes she hangs, and sags a little as the charge drains */
    const sg=last<0||t>=30.2?0:.07*smooth(clamp((t-last-.3)/.7,0,1)); o.h=Math.max(0,top*f/n-sg); if(window.__riseB2&&t>=30.45){ const q=t-30.45, e=smooth(clamp(q/1.4,0,1)); o.h+=e*.07*Math.sin(q*1.7); } } if(t>=30.45){ const q=t-30.45, e=smooth(clamp(q/1.4,0,1)); o.h+=e*.07*Math.sin(q*1.7); o.ax=e*(.075*Math.sin(q*1.25)+.025*Math.sin(q*2.3+1.)); o.az=e*(.085*Math.sin(q*.95+.8)+.03*Math.sin(q*1.9)); }   /* v18: revealed, the riser floats: a slow surfing sway and a gentle rise and fall */   /* v16: she only starts to rise when the wedge of seven is lit, slowly at first */
  for(let j=Math.max(0,k-3);j<=k&&t<30.45;j++){ if(t>=30.45&&T_[j]<30.45) continue; const dtj=t-T_[j], c=STEM.cols[STEM_ORD[j%5]], gap=j+1<T_.length?T_[j+1]-T_[j]:.06, amp=t<30.45?0:.13, w=Math.exp(-dtj*(t<30.45?3.2:2.4))*(1-Math.exp(-dtj*26)); o.az+=amp*w*Math.cos(c.a); o.ax-=amp*w*Math.sin(c.a); }
  return o; }

// the vocal, measured from the track (film 22.0 to 32.0, twenty steps a second, 0 to 9): in option B she is the singer, and she is lit by her own voice
const VOX='01100111111124788899999973211123447999999999731111111110000001110000001122100011101111111012344544688998531100124432113689998521110011100000001110000111221000000011100000012233345544433245311232113687';
function voxAt(t){ const x=(t-22.0)*20, i=Math.floor(x); if(i<0||i>=VOX.length-1) return 0; const a=+VOX[i], b=+VOX[i+1]; return (a+(b-a)*(x-i))/9; }
const _stA=new T.Vector3(), _stB=new T.Vector3();
function stemUpdate(){ const on=FILM.on&&FILM.t>=15.9&&FILM.t<44.4, g=STEM.g; STEM.L.intensity=0; if(!on){ g.visible=false; if(STEM.lead) for(const m of STEM.lead){ m.rotation.x=0; m.rotation.z=0; } return; }
  const ft=FILM.t, st=stemState(ft), h=leadY(), rev=smooth(clamp((ft-30.5)/.8,0,1)); g.visible=h>.02; if(!g.visible) return;   /* v16: rev is the reveal. In the dark the lift does not exist for the eye: no stems, no riser, no glass. She floats. When the electricity lights the set the lift is simply there */
  STEM.plat.visible=rev>0; for(const c of STEM.cols) c.tube.visible=c.arc.visible=c.ball.visible=c.foot.visible=rev>0&&!window.__riseB2;   /* B2: no glass stems, the lightning holds her */
  const [a,r]=TW_IN[0], p=pol(stageAngle(2)+a*D2R,r,STAGE_H); g.position.copy(p); const now=performance.now()/1000, jit=Math.floor(now*40), dk=dark2K()?.5:1, charged=ft>=30.45;
  STEM.plat.position.y=h; STEM.plat.rotation.set(st.ax,0,st.az); { const B_=!!window.__riseB; STEM.top.material=B_?STEM.plexi:STEM.topMat; STEM.rim.material.color.setHex(B_?0xeef8ff:0xdff0ff); STEM.rim.scale.setScalar(1); STEM.rim.material.transparent=B_; STEM.rim.material.opacity=B_?.7:1; }
  if(window.__riseB2){ if(ft<30.45&&ft>=24.2) stemPowerB2(ft,p,h); } else if(window.__riseB&&ft<30.45&&ft>=24.2) stemPowerB(ft,p,h);
  if(window.__riseB2&&ft>=30.45) stemHoldB2(ft,p,h);
  { const A=window.__riseB2?rev:0; STEM.GU.uA.value=A; STEM.GU.uT.value=FILM.on?FILM.t:performance.now()/1000; const top=Math.max(.1,h-.04), L3=top/3;   /* v20: the tube stands from the deck to the underside of the disc, in three sections */
    STEM.tubeS.forEach((m,i)=>{ m.visible=A>0; m.position.y=i*L3; m.scale.y=L3+(i<2?.08:0); const R=STEM.tubeR[i]; R.visible=A>0; R.position.y=i*L3+L3+(i<2?.04:0); R.material.opacity=.75*A; });
    STEM.tubeB.visible=A>0; STEM.tubeB.material.opacity=A; }
  STEM.node.visible=!!window.__riseB2&&ft>=24.2&&ft<44.4; if(STEM.node.visible){ const S2=ft<30.45?(STEM.bst||[]):STEM.times; let ls=-9; for(const x of S2){ const xx=ft<30.45?x+.22:x; if(xx<=ft) ls=xx; else break; } const e=Math.exp(-(ft-ls)*6); STEM.node.position.set(0,.06,0); STEM.node.scale.setScalar(.9+1.8*e); STEM.node.material.opacity=.18+.82*e; }
  // the lead leans with the riser
  if(!STEM.lead){ STEM.lead=[]; for(const L_ of DANCE.lines) for(const e of L_.meshes) if(e.k===2&&e.d.ride==='F'&&e.d.dx===0) STEM.lead.push(e.m); for(const S_ of SUITS.meshes) if(S_.lv<0&&S_.d.dx===0) STEM.lead.push(S_.m); }
  for(const m of STEM.lead){ m.rotation.x=st.ax; m.rotation.z=-st.az; }
  STEM.cols.forEach((c,i)=>{ const hi=Math.max(.05,h+c.cx*st.az-c.cz*st.ax-.06); c.tube.scale.y=hi;
    // which strike was this stem's last one
    let since=9; for(let j=st.k;j>=Math.max(0,st.k-9);j--) if(STEM_ORD[j%5]===i){ since=ft-STEM.times[j]; break; }
    const hot=Math.exp(-since*(charged?3.2:5)), lvl=(charged?.3+.7*hot:.16+.84*hot)*dk, wob=.05+.07*hot, P=c.pos; let v=0;
    for(let k=0;k<2;k++){ let px=0,pz=0,py=0; for(let s=0;s<STEM.seg;s++){ const y1=hi*(s+1)/STEM.seg, e=s===STEM.seg-1?0:1, nx=(h01(jit+i*53+k*31+s*7)-.5)*wob*e, nz=(h01(jit+i*29+k*17+s*13+5)-.5)*wob*e; P[v++]=px; P[v++]=py; P[v++]=pz; P[v++]=nx; P[v++]=y1; P[v++]=nz; px=nx; pz=nz; py=y1; } }
    c.geo.attributes.position.needsUpdate=true; c.arc.material.opacity=rev*Math.min(1,lvl*(.75+.25*h01(jit+i)));
    // the burst bounces up and down the bottle, a little lower each time
    const bz=Math.abs(Math.sin(since*Math.PI*3.2))*Math.exp(-since*2.2); c.ball.position.y=hi*(charged?Math.max(bz,.06):bz); c.ball.material.opacity=rev*Math.min(1,(charged?.25:0)+1.5*hot)*dk; c.ball.scale.setScalar(.34+(charged?.6:.3)*hot); });
  // the globe round her: brighter with the charge, a pulse on every strike, and on the drop it blows outward into the set
  const cy=h+1.12, q=ft-30.48; STEM.SU.uT.value=now; if(q<0){ STEM.globe.position.set(0,cy,0); STEM.globe.scale.setScalar(1.28+.05*Math.exp(-st.since*8)); STEM.SU.uK.value=ft<22.35?0:(.12*smooth(clamp((ft-22.35)/1.2,0,1))+.75*st.rate*st.rate+.3*st.rate*Math.exp(-st.since*7))*(.85+.15*h01(jit)); }   /* night 14: no sphere through the intro; it forms with the vocals and grows */
  else if(q<.7){ STEM.globe.position.set(0,cy,0); STEM.globe.scale.setScalar(1.28+q*34); STEM.SU.uK.value=1.3*Math.exp(-q*5.5); } else { STEM.globe.scale.setScalar(1.28); STEM.SU.uK.value=dark2K()?.5*(.7+.3*h01(jit)):.16; }
  STEM.globe.visible=false;   /* v17: the sphere is cut */
  // arcs from her body to the skin of the globe
  if(false&&q<0&&ft>=22.35){ STEM.acc=(STEM.acc||0)+(1/60)*(2+36*st.rate*st.rate); let n=0; while(STEM.acc>=1&&n++<5){ STEM.acc-=1; const an=Math.random()*TAU, el=(Math.random()-.5)*Math.PI; _stA.set(p.x,p.y+cy,p.z); _stB.set(p.x+Math.cos(an)*Math.cos(el)*1.26,p.y+cy+Math.sin(el)*1.26,p.z+Math.sin(an)*Math.cos(el)*1.26); _stA.y+=(Math.random()-.5)*.7; boltFire(_stA,_stB,{dur:.06,len:1,lift:0,w:.014,color:Math.random()<.5?0xffffff:0xbfe4ff}); } }
  STEM.L.position.set(0,h+1.3,0); STEM.L.intensity=(charged?(.7+.5*h01(jit+9)+.8*Math.exp(-st.since*7)):0)*dk*rev; }   /* v17: no lamp at all before the reveal: it was catching the platform beside her and the arch, and read as a platform under her */   /* night 1: the lamp rides at her chest, low until the drop, so the deck under the stems no longer burns out */

// option B: the lightning is what lifts her. A strike from the grid into her on every step, a column of it from her feet down to the deck while
// the charge holds, and between strikes a thin crackle under her soles: she is standing on the electricity.
const _pb1=new T.Vector3(), _pb2=new T.Vector3();
function stemPowerB(ft,p,h){ const S_=STEM.bst||[]; STEM.bk=STEM.bk||{}; if(ft<24.3) STEM.bk={};
  for(let i=0;i<S_.length;i++){ const x=S_[i]; if(STEM.bk[i]||ft<x||ft>x+.25) continue; STEM.bk[i]=1;
    _pb2.set(p.x,p.y+h+1.3,p.z); _pb1.set(p.x+(Math.random()-.5)*1.6,p.y+9.5,p.z+(Math.random()-.5)*1.6); boltFire(_pb1,_pb2,{dur:.14,w:.075,lift:0,len:.7,color:0xffffff});
    for(let k=0;k<2;k++){ _pb1.set(p.x+(Math.random()-.5)*.2,p.y+h+.02,p.z+(Math.random()-.5)*.2); _pb2.set(p.x+(Math.random()-.5)*.5,p.y+.02,p.z+(Math.random()-.5)*.5); boltFire(_pb1,_pb2,{dur:.32,w:.05,lift:0,len:1,color:k?0xbfe4ff:0xffffff}); } }
  const st=stemState(ft), hold=Math.exp(-st.since*1.2); STEM.cr=(STEM.cr||0)+(1/24)*(5+18*st.rate*st.rate)*(.35+.65*hold); let g=0;
  while(STEM.cr>=1&&g++<4){ STEM.cr-=1; const d=.25+Math.random()*Math.min(h,1.4); _pb1.set(p.x+(Math.random()-.5)*.35,p.y+h+.02,p.z+(Math.random()-.5)*.35); _pb2.set(_pb1.x+(Math.random()-.5)*.5,_pb1.y-d,_pb1.z+(Math.random()-.5)*.5); boltFire(_pb1,_pb2,{dur:.07,w:.02,lift:0,len:1,color:Math.random()<.5?0xffffff:0xa9d8ff}); } }

// option B2: the power comes from the dancers on the floor. On every strike some of them light, the charge runs down through their bodies into
// the deck, crawls across the floor to the point under her, and that point fires it up into her: that is what holds her up. Each time she is lit
// she is caught in a new flight pose and facing, so the strobe reads as a run of frozen moments.
const STEM_YAW=[0,.5,-.35,.25,-.55,.15,.6,-.2,.4,-.45,.1,-.6,.3,-.15,.55,-.3];
const _pc1=new T.Vector3(), _pc2=new T.Vector3(), _pc3=new T.Vector3();
function stemPowerB2(ft,p,h){ const S_=STEM.bst||[]; STEM.bk2=STEM.bk2||{}; if(ft<24.3) STEM.bk2={}; const COL=[0xfff2c8,0x9fd0ff,0xffb0a8,0xd9b8ff], now=performance.now()/1000;
  const ground=SUITS.meshes.filter(S2=>(S2.lv<0&&S2.d.dx>0&&(S2.m.position.y-STAGE_H)<.3)||(S2.lv===1&&!S2.d.ride));
  for(let i=0;i<S_.length;i++){ const x=S_[i]; if(STEM.bk2[i]||ft<x||ft>x+.25||!ground.length) continue; STEM.bk2[i]=1;
    const n=1;   /* v20: one feeder per strike, drawn so it reads: down the legs, a clear line across the deck to the point under her, and up into her */
    for(let q=0;q<n;q++){ const F=ground[(i*3+q*5)%ground.length], fp=F.m.position; F.feed=ft;
      _pc1.set(fp.x,fp.y+.95,fp.z); _pc2.set(fp.x,fp.y+.03,fp.z); boltFire(_pc1,_pc2,{dur:.16,w:.024,lift:0,len:1,color:0xf2f8ff});                                   // down through their legs into the deck, from their own feet
      _pc3.set(p.x,p.y+.03,p.z); const B=boltFire(_pc2,_pc3,{dur:.17,w:.03,lift:0,len:.8,color:0xf2f8ff}); B.t+=.05;   /* arrives under her as the up-bolt fires (+.22) */ }                                       // across the floor to the point under her
    _pc1.set(p.x,p.y+.04,p.z); _pc2.set(p.x,p.y+h+.05,p.z); const U=boltFire(_pc1,_pc2,{dur:.24,w:.06,lift:0,len:1,color:0xffffff}); U.t+=.22; } }               // and up into her

// B2 strobe: on the sung lines she is lit in short bursts on the eighth notes; each burst is its own slot, and every slot has its own frozen pose
// and facing, changed while she is dark, so the strobe reads as a run of different moments.
const B2S={b:60/117.45/2,t0:22.35,yaw:[0,.55,-.4,.25,-.6,.15,.65,-.25,.4,-.5,.1,-.65,.3,-.15,.6,-.35,.2,-.45]};
function b2Slot(ft){ return Math.floor((ft-B2S.t0)/B2S.b); }
function b2On(ft){ return window.__riseB2&&ft>=22.35&&ft<30.45; }
function leadYawOff(ft){ return b2On(ft)?B2S.yaw[((b2Slot(ft)%B2S.yaw.length)+B2S.yaw.length)%B2S.yaw.length]:0; }
// B2 after the reveal: the same lightning that lifted her holds the disc up: a white bolt from the point on the floor up to the disc on every
// beat, and a thin crackle between them. The glass stems are not used.
function stemHoldB2(ft,p,h){ const T_=STEM.times; STEM.bk3=STEM.bk3||{}; if(ft<30.4) STEM.bk3={};
  for(let i=0;i<T_.length;i++){ const x=T_[i]; if(x<30.45||STEM.bk3[i]||ft<x||ft>x+.2) continue; STEM.bk3[i]=1; _pc1.set(p.x,p.y+.04,p.z); _pc2.set(p.x+(Math.random()-.5)*.3,p.y+h-.08,p.z+(Math.random()-.5)*.3); boltFire(_pc1,_pc2,{dur:.24,w:.06,lift:0,len:1,color:0xffffff}); }
  STEM.cr2=(STEM.cr2||0)+(1/24)*7; let g=0; while(STEM.cr2>=1&&g++<3){ STEM.cr2-=1; _pc1.set(p.x+(Math.random()-.5)*.15,p.y+.04,p.z+(Math.random()-.5)*.15); _pc2.set(p.x+(Math.random()-.5)*.5,p.y+h-.08,p.z+(Math.random()-.5)*.5); boltFire(_pc1,_pc2,{dur:.1,w:.02,lift:0,len:1,color:Math.random()<.5?0xffffff:0xa9d8ff}); } }

await __tick();
// ================= STAGE 4: THE CLASH =================
// The angel and the shadow being are full 3D holograms. They appear at the two wings, charge each other with swords drawn, and the blades meet
// in the middle of the stage. The clash is what makes the team's name: NOCHE burns in where the swords hit, holds, and fades fast. Then they
// rush again, with different strikes, and it loops. Everything glitches the way a projected hologram does: scan lines, flicker, sideways tears.
const CLASH={ready:false,t:0,on:false,A:null,D:null,U:{uT:{value:0},uGl:{value:0}},L:6.8,hitT:2.9,last:-1,layers:[]};
function strikeTime(root,clip){ const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; }); const H=B.RightHand||B.RightForeArm; if(!H) return clip.duration*.5; const mx=new T.AnimationMixer(root), a=mx.clipAction(clip); a.play();
  const n=Math.max(8,Math.round(clip.duration*30)), P=[]; for(let f=0;f<=n;f++){ mx.setTime(f/30); root.updateMatrixWorld(true); P.push(H.getWorldPosition(new T.Vector3())); } a.stop(); mx.uncacheRoot(root);
  let best=clip.duration*.5, bv=0; for(let f=Math.floor(n*.15);f<n;f++){ const v=P[f+1].distanceTo(P[f]); if(v>bv){ bv=v; best=f/30; } } return best; }
async function loadClash(){ if(!T.SkeletonUtils) return; if(!window.__clash&&!/clash/.test(location.hash+location.search)) return;   /* the two holograms are heavy: they load only when the clash is asked for */
  const IDENT=new T.Matrix4(), U=CLASH.U;
  const holo=(tx,add)=>{ const m=new T.MeshBasicMaterial({map:tx,skinning:true,transparent:true,opacity:1,depthWrite:false,blending:T.AdditiveBlending,fog:false}); const uAdd={value:new T.Vector3(add[0],add[1],add[2])}, uK={value:0}; m.userData.uK=uK;
    m.onBeforeCompile=sh=>{ sh.uniforms.uT=U.uT; sh.uniforms.uGl=U.uGl; sh.uniforms.uAdd=uAdd; sh.uniforms.uK=uK;
      sh.vertexShader='uniform float uT,uGl;\n'+sh.vertexShader.replace('#include <project_vertex>','float gb=floor(transformed.y*9.+uT*17.); transformed.x+=step(.9,fract(sin(gb*91.7)*43758.5))*(fract(sin(gb*3.1+floor(uT*24.))*917.)-.5)*.45*uGl;\n#include <project_vertex>');
      sh.fragmentShader='uniform float uT,uGl,uK; uniform vec3 uAdd;\n'+sh.fragmentShader.replace('#include <dithering_fragment>','#include <dithering_fragment>\n float sl=.6+.4*sin(gl_FragCoord.y*1.7-uT*9.); float fk=(.84+.16*sin(uT*43.)*sin(uT*17.3))*(fract(sin(floor(uT*14.)*12.9)*43758.5)<.07?.3:1.); gl_FragColor.rgb=(gl_FragColor.rgb*1.5+uAdd)*sl*fk*uK; gl_FragColor.a=1.;'); };
    m.customProgramCacheKey=()=>'clash'+add.join(','); return m; };
  const make=async(file,add,blade,glowHex)=>{ const [gltf,tx]=await Promise.all([loadGLB(file+'.glb'),texP(file+'.jpg')]); const root=T.SkeletonUtils.clone(gltf.scene); let sm=null; root.traverse(o=>{ if(o.isSkinnedMesh) sm=o; });
    const skel=sm.skeleton, geo=sm.geometry; sm.parent.remove(sm); scene.add(root); root.updateMatrixWorld(true);
    const m=new T.SkinnedMesh(geo,holo(tx,add)); m.bindMode='detached'; m.bind(skel,IDENT); m.frustumCulled=false; m.visible=false; m.renderOrder=6; scene.add(m);
    const B={}; root.traverse(o=>{ if(o.isBone) B[o.name]=o; });
    // the sword: a long blade of light in the right hand
    const sw=new T.Group(), bl=new T.Mesh(new T.BoxGeometry(.045,1.25,.012),new T.MeshBasicMaterial({color:blade,transparent:true,blending:T.AdditiveBlending,depthWrite:false,fog:false})); bl.position.y=.74; sw.add(bl);
    const halo=new T.Mesh(new T.PlaneGeometry(.3,1.5),new T.MeshBasicMaterial({map:flareTex,color:glowHex,transparent:true,opacity:.55,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide,fog:false})); halo.position.y=.74; sw.add(halo);
    const guard=new T.Mesh(new T.BoxGeometry(.3,.04,.04),bl.material); guard.position.y=.12; sw.add(guard); m.add(sw);
    return {root,m,mixer:new T.AnimationMixer(root),hand:B.RightHand||null,sw,bl,halo,act:{},st:{}}; };
  const A=await make('angel',[.16,.13,.07],0xfff3c8,0xffd27a), D=await make('demon',[.13,.04,.26],0xd9a8ff,0x8a3dff);
  const setup=async(P,run,strikes)=>{ const c=await motionClip(P.root,run); P.act.run=P.mixer.clipAction(c); P.act.run.play(); P.act.run.setEffectiveWeight(1);
    P.strikes=[]; for(const nm of strikes){ try{ const s=await motionClip(P.root,nm), a=P.mixer.clipAction(s); a.setLoop(T.LoopOnce,1); a.clampWhenFinished=true; a.play(); a.setEffectiveWeight(0); P.strikes.push({a,hit:strikeTime(P.root,s),dur:s.duration,nm}); }catch(e){} } };
  await setup(A,'a510',['a242','a221']); await setup(D,'a512',['a240','a99']); CLASH.A=A; CLASH.D=D;
  // the name gains depth: a stack of layers behind the front face, so it reads as a solid hologram as the room turns
  if(typeof SIGNS!=='undefined'&&SIGNS.s4){ const s4=SIGNS.s4; for(let k=1;k<=5;k++){ const c=new T.Mesh(s4.geometry,s4.material.clone()); c.position.copy(s4.position); c.position.z-=k*.07; c.renderOrder=5; s4.parent.add(c); CLASH.layers.push(c); } }
  CLASH.ready=true; window.__clashInfo={a:A.strikes.map(s=>[s.nm,+s.hit.toFixed(2),+s.dur.toFixed(2)]),d:D.strikes.map(s=>[s.nm,+s.hit.toFixed(2),+s.dur.toFixed(2)])}; }
JOBS.push(loadClash);
const _c1=new T.Vector3(), _c2=new T.Vector3(), _c3=new T.Vector3(), _cq=new T.Quaternion(), _cs=new T.Vector3(), _cm=new T.Matrix4(), _cqx=new T.Quaternion().setFromEuler(new T.Euler(Math.PI/2,0,0));
function clashWarp(tau){ const h=CLASH.hitT, a=h-.75, b=h-.12; if(tau<a) return tau; if(tau<b) return a+(tau-a)*.42; const wb=a+(b-a)*.42; return wb+(tau-b)*(h-wb)/(h-b)*1; }   // the last stride before the blades meet runs in slow motion, then it snaps
function clashUpdate(dt){ const C=CLASH, on=!!window.__clash&&C.ready&&S.room==='theatre'; C.on=on; const A=C.A, D=C.D; if(!C.ready) return; if(!on){ A.m.visible=D.m.visible=false; for(const c of C.layers) c.visible=false; C.t=0; C.last=-1; if(typeof SIGNS!=='undefined'&&SIGNS.s4) SIGNS.s4.position.y=STAGE_H+4.5; return; }
  C.t+=dt; const n=Math.floor(C.t/C.L), tau=C.t-n*C.L, v=n%2, h=C.hitT, w=clashWarp(Math.min(tau,h)), now=performance.now()/1000; C.U.uT.value=now;
  const SA=stageAngle(3), Y0=STAGE_H+1.5, SC=3.0,   /* giants, thrown onto the gauze above the company's heads */ appear=smooth(clamp(tau/.45,0,1)), gone=tau>h?smooth(clamp((tau-h-.25)/.7,0,1)):0, k=appear*(1-gone);
  C.U.uGl.value=tau<.5?1.4*(1-tau/.5)+.25:tau>h?.3+1.6*gone:.22+(h01(Math.floor(now*7))<.12?.9:0);
  if(n!==C.last){ C.last=n; for(const P of [A,D]){ P.mixer.setTime(0); P.act.run.reset().play(); P.act.run.setEffectiveWeight(1); P.strikes.forEach(s=>{ s.a.stop(); s.a.reset(); s.a.play(); s.a.paused=true; s.a.setEffectiveWeight(0); }); P.cur=P.strikes.length?P.strikes[v%P.strikes.length]:null; P.started=false; } C.boom=false; }
  const u=clamp((w-.25)/(h-.25),0,1), e=u*u*(3-2*u)*.35+u*.65, rate=tau<h?(clashWarp(Math.min(tau+.016,h))-w)/.016:1;
  [[A,-1],[D,1]].forEach(([P,sg])=>{ const a0=sg*(v?30:35)*D2R, a1=sg*4.2*D2R, an=SA+lerp(a0,a1,e), r=lerp(v?19.8:20.6,20.3,e); _c1.copy(pol(an,r,Y0)); P.m.visible=k>.01; P.m.material.userData.uK.value=k*(P===A?.4:.95); if(!P.m.visible) return;
    P.m.position.copy(_c1); P.m.scale.setScalar(SC); _c2.copy(pol(SA+a1-sg*.2,20.3,Y0)); P.m.rotation.y=Math.atan2(_c2.x-_c1.x,_c2.z-_c1.z);
    // run into the strike so that the fastest moment of the sword arm lands exactly on the hit
    if(P.cur){ const ts=h-P.cur.hit; if(!P.started&&tau>=ts-.02&&tau<h+.1){ P.started=true; P.cur.a.paused=false; P.cur.a.time=Math.max(0,P.cur.hit-(h-tau)); } const x=smooth(clamp((tau-(ts))/.3,0,1)); P.cur.a.setEffectiveWeight(P.started?Math.max(x,.001):0); P.act.run.setEffectiveWeight(P.started?1-x:1); }
    P.mixer.update(dt*(tau<h?clamp(rate,.3,1):1)); P.root.updateMatrixWorld(true);
    if(P.hand){ P.hand.matrixWorld.decompose(_c3,_cq,_cs); P.sw.position.copy(_c3); P.sw.quaternion.copy(_cq).multiply(_cqx); P.sw.scale.setScalar(1); P.bl.material.opacity=k; P.halo.material.opacity=.55*k*(.8+.2*Math.sin(now*31)); } });
  // the hit
  _c1.copy(pol(SA,20.3,Y0+4.3));
  if(!C.boom&&tau>=h){ C.boom=true; for(let i=0;i<16;i++){ const an=Math.random()*TAU, el=(Math.random()-.5)*2.2, d=2.5+Math.random()*4.5; _c2.set(_c1.x+Math.cos(an)*Math.cos(el)*d,_c1.y+Math.sin(el)*d,_c1.z+Math.sin(an)*Math.cos(el)*d*.5); boltFire(_c1,_c2,{dur:.14+Math.random()*.12,len:.6,w:.05,lift:0,color:i%2?0xfff0c0:0xb884ff}); }
    pyroBurst(_c1,220,11,Math.PI,0xfff4dc,true,.9); pyroBurst(_c1,160,8,Math.PI,0xa66bff,true,1.2); PYRO.L.position.copy(_c1); PYRO.lt=now; PYRO.lI=7; try{ SND.boom=1; }catch(e){} }
  // NOCHE: burned in by the clash, held, gone fast
  if(typeof SIGNS!=='undefined'&&SIGNS.s4){ const s4=SIGNS.s4, q=tau-h, up=q>0?Math.min(1,q/.12):0, out=smooth(clamp((q-2.0)/.55,0,1)), gl=h01(Math.floor(now*16))<.13?.3:1, op=up*(1-out)*gl*(.5+.45*Math.exp(-Math.max(0,q)*2.5))*(.88+.12*Math.sin(now*37));
    s4.visible=op>.004; s4.material.opacity=op; s4.position.y=STAGE_H+5.9; s4.scale.setScalar(q>0?1+.35*Math.exp(-q*7):1); s4.position.x=h01(Math.floor(now*9)+7)<.1?(h01(Math.floor(now*30))-.5)*.5:0;
    C.layers.forEach((c,i)=>{ c.visible=s4.visible; c.material.opacity=op*(.5-.08*i); c.scale.copy(s4.scale); c.position.x=s4.position.x+(h01(Math.floor(now*11)+i)<.08?(h01(i+Math.floor(now*40))-.5)*.3:0); c.position.y=s4.position.y; }); } }
// ---- the clash as its own demo: open the page with #clash. One button, then the two giants charge on Stage 4 in a loop, with sound. ----
if(/clash/.test(location.hash)){ window.__clash=false; window.__clashDemo=true; const st=document.createElement('style'); st.textContent='#intro,#choose,.wrap,#ctl,.pills,#caption,#hint,#dial,#show,#tour{display:none!important}'; document.head.appendChild(st);
  const btn=document.createElement('button'); btn.type='button'; btn.textContent='Loading the clash…'; btn.disabled=true; btn.style.cssText='position:fixed;left:50%;top:50%;transform:translate(-50%,-50%);z-index:60;font:500 18px Outfit,system-ui,sans-serif;letter-spacing:.04em;padding:15px 30px;border-radius:999px;border:0;background:#f0c35a;color:#140e05;cursor:pointer;box-shadow:0 10px 40px rgba(0,0,0,.6)'; document.body.appendChild(btn);
  const au=new Audio('clash.mp3'); au.loop=true; au.preload='auto'; CLASH.au=au;
  const stage=()=>{ S.faceT=S.discA=stageAngle(3); setGap(ONE_STAGE); S.gap=S.gapT; S.fxAuto=false; const seat=LAY.seats.filter(s=>s.vip&&s.row===1).sort((a,b)=>Math.abs(a.x)-Math.abs(b.x))[0]; sit(seat); V.zoom=.22; V.pitch=.1; };
  const wait=setInterval(()=>{ if(!CLASH.ready) return; clearInterval(wait); stage(); btn.disabled=false; btn.textContent='Play the clash'; },300);
  btn.addEventListener('click',()=>{ stage(); btn.remove(); CLASH.t=0; CLASH.last=-1; window.__clash=true; try{ au.currentTime=0; const p=au.play(); if(p&&p.catch) p.catch(()=>{}); }catch(e){} });
  // keep the sound on the picture: every second rush is the top of the sound loop
  setInterval(()=>{ if(!window.__clash||au.paused) return; const want=CLASH.t%(CLASH.L*2); if(Math.abs(au.currentTime-want)>.25&&Math.abs(au.currentTime-want)<CLASH.L*2-.25){ try{ au.currentTime=want; }catch(e){} } },1000); }

// ================= A PERSON FOR SCALE: one performer standing downstage centre on every stage =================
async function loadStagePeople(){ const [gltf,tx]=await Promise.all([loadGLB('dancer-m2.glb'),texP('dancer-m2.jpg')]); let sm=null; gltf.scene.traverse(o=>{ if(o.isSkinnedMesh) sm=o; });
  const clip=gltf.animations.find(a=>a.name==='a0')||gltf.animations[0], geo=bakeAt(gltf.scene,sm,clip,.4), mat=new T.MeshStandardMaterial({map:tx,roughness:.75,metalness:0,envMapIntensity:.5});
  geo.computeBoundingBox(); const k=1.78/(geo.boundingBox.max.y-geo.boundingBox.min.y);                 // 1.78 m tall, whatever the model's own scale
  for(let s=0;s<4;s++){ const p=pol(stageAngle(s),14.4,STAGE_H), m=new T.Mesh(geo,mat); m.scale.setScalar(k); m.position.copy(p); m.rotation.y=Math.atan2(-p.x,-p.z); m.castShadow=true; m.userData.cat='stages'; m.userData.scaleMan=true; scene.add(m); } shadowsDirty(); }

// ================= SHOW CONTROL: a switcher with a timecode and a cue list =================
// Each cue sets, from its time onward: the footage on the two LED screens, the stage LED on or off, the lighting look (bright, mid or dark) and
// whether the effects fire in the stages' programmes. Press play and the switcher runs the show; the last cue holds for 20 seconds, then it loops.
const CTL={t:0,playing:false,live:-1,cues:[
  {t:0,foot:'v-gold',led:1,look:'dark',fx:0},{t:15,foot:'v-fire',led:1,look:'bright',fx:1},{t:40,foot:'v-ocean',led:1,look:'mid',fx:0},
  {t:65,foot:'off',led:0,look:'dark',fx:0},{t:85,foot:'v-led',led:1,look:'bright',fx:1},{t:110,foot:'v-gold',led:1,look:'mid',fx:1}]};
const fmt=t=>{ const m=Math.floor(t/60), s=t-m*60; return String(m).padStart(2,'0')+':'+s.toFixed(1).padStart(4,'0'); };
const parseT=v=>{ const m=String(v).split(':'); return m.length>1?(+m[0]||0)*60+(+m[1]||0):(+v||0); };
function syncControls(){ $$('#lookSeg [data-look]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.look===S.look?'true':'false')); $$('#ledSeg [data-led]').forEach(b=>b.setAttribute('aria-pressed',(+b.dataset.led===1)===S.ledOn?'true':'false'));
  $$('#fxSeg [data-fx], #tFx [data-fx]').forEach(b=>b.setAttribute('aria-pressed',(+b.dataset.fx===1)===S.fxAuto?'true':'false')); for(const id of ['#footage','#tFoot']){ const e=$(id); if(e) e.value=S.footage; } }
function applyCue(c){ if(S.footage!==c.foot&&!S.club){ S.footage=c.foot; setFootage(); } S.ledOn=!!c.led; S.look=c.look; S.fxAuto=!!c.fx; syncControls(); }
function drawCues(){ const box=$('#cues'); box.innerHTML=''; CTL.cues.sort((a,b)=>a.t-b.t);
  const hd=document.createElement('div'); hd.className='cue lab'; hd.innerHTML='<span>Time</span><span>Screens</span><span>Stage LED</span><span>Lights</span><span>Effects</span><span></span>'; box.appendChild(hd);
  CTL.cues.forEach((c,i)=>{ const r=document.createElement('div'); r.className='cue'+(i===CTL.live?' live':'');
    const ti=document.createElement('input'); ti.value=fmt(c.t); ti.setAttribute('aria-label','Cue time'); ti.addEventListener('change',()=>{ c.t=Math.max(0,parseT(ti.value)); drawCues(); });
    const sel=(opts,val,on,label)=>{ const e=document.createElement('select'); e.setAttribute('aria-label',label); for(const [v,n] of opts){ const o=document.createElement('option'); o.value=v; o.textContent=n; e.appendChild(o); } e.value=val; e.addEventListener('change',()=>on(e.value)); return e; };
    r.appendChild(ti); r.appendChild(sel(VIDEOS.map(v=>[v.id,v.name]),c.foot,v=>{ c.foot=v; },'Screens'));
    r.appendChild(sel([['1','On'],['0','Off']],String(c.led),v=>{ c.led=+v; },'Stage LED')); r.appendChild(sel([['bright','Bright'],['mid','Mid'],['dark','Dark']],c.look,v=>{ c.look=v; },'Lights'));
    r.appendChild(sel([['1','On'],['0','Off']],String(c.fx),v=>{ c.fx=+v; },'Effects'));
    const d=document.createElement('button'); d.className='del'; d.textContent='×'; d.setAttribute('aria-label','Delete cue'); d.addEventListener('click',()=>{ CTL.cues.splice(i,1); drawCues(); }); r.appendChild(d); box.appendChild(r); }); }
function updateControl(dt){ if(CTL.playing){ CTL.t+=dt; const end=(CTL.cues.length?CTL.cues[CTL.cues.length-1].t:0)+20; if(CTL.t>end) CTL.t=0; }
  let li=-1; CTL.cues.forEach((c,i)=>{ if(c.t<=CTL.t) li=i; }); if(CTL.playing&&li!==CTL.live&&li>=0){ CTL.live=li; applyCue(CTL.cues[li]); drawCues(); }
  const tc=$('#tc'); if(tc) tc.textContent=fmt(CTL.t); }
{ $('#ctlBtn').addEventListener('click',()=>{ const p=$('#ctl'); p.hidden=!p.hidden; document.body.classList.toggle('ctlopen',!p.hidden); if(!p.hidden){ const pl=document.querySelector('.pills'), R=$('#room'); if(pl&&R){ const top=Math.max(70,Math.round(pl.getBoundingClientRect().bottom-R.getBoundingClientRect().top+10)); const Rt=R.getBoundingClientRect().top; let lim=R.getBoundingClientRect().height-16; for(const s of ['.dock','#caption','#hint']){ const e=document.querySelector(s), r=e&&e.getBoundingClientRect(); if(r&&r.height>0&&e.textContent.trim()!==''||s==='.dock'&&r&&r.height>0) lim=Math.min(lim,r.top-Rt-(s==='.dock'?54:10)); }   /* room above the dock for the caption line, which fills in as cues play */ p.style.top=top+'px'; p.style.maxHeight=Math.max(160,lim-top)+'px'; } }   /* QA: on phones the pills wrap and the panel covered them */ $('#ctlBtn').setAttribute('aria-pressed',p.hidden?'false':'true'); });
  $('#ctlX').addEventListener('click',()=>{ $('#ctl').hidden=true; $('#ctlBtn').setAttribute('aria-pressed','false'); });
  $('#tcPlay').addEventListener('click',()=>{ CTL.playing=!CTL.playing; $('#tcPlay').innerHTML=CTL.playing?'&#10074;&#10074;':'&#9654;'; if(CTL.playing) CTL.live=-1; });
  $('#tcRew').addEventListener('click',()=>{ CTL.t=0; CTL.live=-1; });
  $('#cueAdd').addEventListener('click',()=>{ CTL.cues.push({t:+CTL.t.toFixed(1),foot:S.footage,led:S.ledOn?1:0,look:S.look,fx:S.fxAuto?1:0}); drawCues(); });
  $$('#lookSeg [data-look]').forEach(b=>b.addEventListener('click',()=>{ S.look=b.dataset.look; syncControls(); }));
  $$('#ledSeg [data-led]').forEach(b=>b.addEventListener('click',()=>{ S.ledOn=b.dataset.led==='1'; syncControls(); }));
  $$('#fxSeg [data-fx], #tFx [data-fx]').forEach(b=>b.addEventListener('click',()=>{ S.fxAuto=b.dataset.fx==='1'; syncControls(); }));
  for(const id of ['#fx2','#tFire']) if($(id)) $(id).addEventListener('click',()=>{ FXFIRE.t=performance.now()/1000; });
  drawCues(); }


// ================= SOUND: the room's machinery =================
// Metal-on-metal sounds (rolling door, gate, servo, whine) sit almost inaudibly low, at Chad's request (13 Nov): the thumps carry the machinery.
// Recorded effects from Envato carry it: a very large rolling door and a heavy gate for the screens and turntable, a hydraulic lift, a large servo and a pneumatic release. Low thumps are added on top.
const AU={ctx:null,ready:false,buf:{},v:{},prev:{vs:0,vt:0,lift:false}};
async function audioInit(){ const AC=window.AudioContext||window.webkitAudioContext; if(!AC) return false; const c=AU.ctx=new AC();
  AU.master=c.createGain(); AU.master.gain.value=0; const comp=c.createDynamicsCompressor(); AU.master.connect(comp); comp.connect(c.destination);
  const len=Math.floor(c.sampleRate*2.6), ir=c.createBuffer(2,len,c.sampleRate); for(let ch=0;ch<2;ch++){ const d=ir.getChannelData(ch); for(let i=0;i<len;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/len,2.4)*(i<400?i/400:1); }
  AU.rev=c.createConvolver(); AU.rev.buffer=ir; const rg=c.createGain(); rg.gain.value=.34; AU.rev.connect(rg); rg.connect(AU.master);          // a big, soft room around every sound
  AU.bus=c.createGain(); AU.bus.connect(AU.master); AU.bus.connect(AU.rev);
  const nl=c.sampleRate*3; AU.noise=c.createBuffer(1,nl,c.sampleRate); { const d=AU.noise.getChannelData(0); let b=0; for(let i=0;i<nl;i++){ const w=Math.random()*2-1; b=(b+.03*w)/1.03; d[i]=b*3.2+w*.12; } }
  for(const n of ['roll','slide','tail','lift','liftend','servo','air','murmur','ahh','clap','cheer','roar','react','final']){ try{ const r=await fetch('sfx-'+n+'.mp3'); if(r.ok) AU.buf[n]=await c.decodeAudioData(await r.arrayBuffer()); }catch(e){} }
  const loop=(buf,rate,lp)=>{ const s=c.createBufferSource(); s.buffer=buf; s.loop=true; if(buf.duration>1){ s.loopStart=.15; s.loopEnd=buf.duration-.15; } s.playbackRate.value=rate; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=lp; const g=c.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(AU.bus); s.start(); return {s,f,g}; };
  const roll=AU.buf.roll||AU.noise;
  AU.v.screens=loop(roll,.82,900); AU.v.turn=loop(roll,.5,340); AU.v.lift=loop(AU.buf.lift||roll,AU.buf.lift?1:1.3,AU.buf.lift?6000:1600);
  const osc=(type,f,to)=>{ const o=c.createOscillator(); o.type=type; o.frequency.value=f; const g=c.createGain(); g.gain.value=0; o.connect(g); g.connect(to||AU.bus); o.start(); return {o,g}; };
  AU.v.hum=osc('sine',44); AU.v.hum2=osc('triangle',88); const bp=c.createBiquadFilter(); bp.type='bandpass'; bp.frequency.value=700; bp.Q.value=3; bp.connect(AU.bus); AU.v.whine=osc('sawtooth',160,bp); AU.v.srv=osc('sawtooth',118,bp);
  const tone=loop(AU.noise,.6,160); tone.g.gain.value=.05;                                                                                       // room tone: air handling, far off
  AU.ready=true; return true; }
function shot(name,rate,gain,delay){ const c=AU.ctx, b=AU.buf[name]; if(!b) return; const s=c.createBufferSource(); s.buffer=b; s.playbackRate.value=rate; const g=c.createGain(); g.gain.value=gain; s.connect(g); g.connect(AU.bus); s.start(c.currentTime+(delay||0)); }
function thud(f,dur,gain,delay){ const c=AU.ctx, t=c.currentTime+(delay||0), o=c.createOscillator(), g=c.createGain(); o.type='sine'; o.frequency.setValueAtTime(f,t); o.frequency.exponentialRampToValueAtTime(f*.5,t+dur); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.012); g.gain.exponentialRampToValueAtTime(.0001,t+dur); o.connect(g); g.connect(AU.bus); o.start(t); o.stop(t+dur+.05);
  const n=c.createBufferSource(); n.buffer=AU.noise; const nf=c.createBiquadFilter(); nf.type='lowpass'; nf.frequency.value=500; const ng=c.createGain(); ng.gain.setValueAtTime(gain*.5,t); ng.gain.exponentialRampToValueAtTime(.0001,t+.12); n.connect(nf); nf.connect(ng); ng.connect(AU.bus); n.start(t,Math.random()); n.stop(t+.2); }
function hiss(dur,gain,fc,delay){ const c=AU.ctx, t=c.currentTime+(delay||0), n=c.createBufferSource(); n.buffer=AU.noise; n.playbackRate.value=2.5; const f=c.createBiquadFilter(); f.type='bandpass'; f.frequency.setValueAtTime(fc,t); f.frequency.exponentialRampToValueAtTime(fc*.45,t+dur); f.Q.value=.8; const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.03); g.gain.exponentialRampToValueAtTime(.0001,t+dur); n.connect(f); f.connect(g); g.connect(AU.bus); n.start(t,Math.random()); n.stop(t+dur+.05); }
async function setSound(on){ if(window.__quiet) on=false; S.sound=on; if(on&&!AU.ctx){ try{ await audioInit(); }catch(e){ S.sound=false; return; } } if(!AU.ctx) return; if(on) AU.ctx.resume(); AU.master.gain.setTargetAtTime(on?.95:0,AU.ctx.currentTime,.15); }
// vs: how fast the screens are sliding, vt: how fast the turntable is turning (radians a second), lift: whether a stage lift is travelling
function audioUpdate(vs,vt,lift,liftUp){ if(!AU.ready||!S.sound) return; const c=AU.ctx, now=c.currentTime, P=AU.prev, ns=Math.min(1,vs/.4), nt=Math.min(1,vt/.36), set=(p,v,tc)=>p.setTargetAtTime(v,now,tc||.12);
  set(AU.v.screens.g.gain,ns*.05); set(AU.v.screens.s.playbackRate,.7+ns*.2,.3); set(AU.v.srv.g.gain,ns*.003); set(AU.v.srv.o.frequency,100+ns*40,.3);
  if(P.vs<=.004&&vs>.004) shot('slide',.72,.04);
  if(P.vs>.004&&vs<=.004){ if(S.gap<.004){ thud(50,.8,.95); shot('slide',.5,.04); shot('air',.85,.6,.12); hiss(.8,.1,2400,.1); thud(120,.12,.3,.22); }                 // the two screens meet and seal
    else if(S.gap>Math.PI-.004){ thud(62,.5,.6); shot('tail',.8,.05); } else { shot('tail',1,.04); thud(80,.25,.25); } }
  set(AU.v.turn.g.gain,nt*.04); set(AU.v.turn.s.playbackRate,.4+nt*.14,.4); set(AU.v.hum.g.gain,nt*.3); set(AU.v.hum2.g.gain,nt*.08); set(AU.v.hum.o.frequency,38+nt*10,.5); set(AU.v.hum2.o.frequency,76+nt*20,.5);
  if(P.vt<=.004&&vt>.004) shot('servo',.55,.03);                                                                                                  // the drive takes up
  if(P.vt>.004&&vt<=.004){ thud(58,.45,.5); shot('tail',.65,.03); shot('air',1.1,.22,.1); }                                                                               // the turntable docks
  set(AU.v.lift.g.gain,lift?.6:0,.08); set(AU.v.whine.g.gain,lift?.006:0,.1); set(AU.v.whine.o.frequency,lift?(liftUp?230:150):120,.9);
  if(!P.lift&&lift) hiss(.35,.12,1800); if(P.lift&&!lift){ shot('liftend',1,.7); shot('air',1,.3,.15); thud(95,.22,.35,.05); }
  P.vs=vs; P.vt=vt; P.lift=lift; fxSound(); }

// ---- the show's effects, and a club beat for club night
// cryo jets hiss, flame units whoosh, cannons boom, the kinetic rig's motors whine as it changes shape, sparks crackle
function whoosh(dur,gain,delay){ const c=AU.ctx, t=c.currentTime+(delay||0), n=c.createBufferSource(); n.buffer=AU.noise; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.setValueAtTime(300,t); f.frequency.exponentialRampToValueAtTime(1400,t+.15); f.frequency.exponentialRampToValueAtTime(250,t+dur);
  const g=c.createGain(); g.gain.setValueAtTime(0,t); g.gain.linearRampToValueAtTime(gain,t+.05); g.gain.exponentialRampToValueAtTime(.0001,t+dur); n.connect(f); f.connect(g); g.connect(AU.bus); n.start(t,Math.random()); n.stop(t+dur+.05); thud(70,.35,gain*.6,delay); }
const FXS={jets:[],beat:-1,kin:null,crk:null};
function fxSound(){ const c=AU.ctx, now=c.currentTime;
  FX.jets.forEach((j,i)=>{ const was=FXS.jets[i]||0; if(j.tgt>.5&&was<=.5){ const flame=j.m.uniforms.uK.value>.5; if(flame) whoosh(.9,.35); else { hiss(1.1,.16,3200); thud(90,.12,.15); } } FXS.jets[i]=j.tgt; });
  if(SND.cryo){ SND.cryo=0; hiss(1.9,.34,2400); hiss(1.6,.18,6200,.03); shot('air',1.05,.75,0); thud(60,.35,.35); }   /* v22: Tripp's cryo: a hard two-second blast */
  if(SND.boom){ SND.boom=0; thud(42,1.1,1.0); shot('air',.7,.6,.02); hiss(1.6,.08,5200,.05); }
  if(!FXS.kin){ const o=c.createOscillator(), f=c.createBiquadFilter(), g=c.createGain(); o.type='sawtooth'; o.frequency.value=92; f.type='bandpass'; f.frequency.value=420; f.Q.value=4; g.gain.value=0; o.connect(f); f.connect(g); g.connect(AU.bus); o.start(); FXS.kin={o,g};
    const n=c.createBufferSource(); n.buffer=AU.noise; n.loop=true; n.playbackRate.value=3.5; const hp=c.createBiquadFilter(); hp.type='highpass'; hp.frequency.value=4500; const ng=c.createGain(); ng.gain.value=0; n.connect(hp); hp.connect(ng); ng.connect(AU.bus); n.start(); FXS.crk={g:ng}; }
  FXS.kin.g.gain.setTargetAtTime(clamp(SND.kin*.03,0,.006),now,.15); FXS.kin.o.frequency.setTargetAtTime(80+SND.kin*120,now,.3);
  FXS.crk.g.gain.setTargetAtTime(SND.sparks*.07*(.6+.4*Math.random()),now,.05);
  // club night: kick on every beat, open hat on the off-beat, a sub-bass line, all at 118 bpm, scheduled a little ahead
  /* 16 Nov, his call: late night plays the rooftop lounge track (music-lounge.mp3: 8 s loop at 120 bpm, 0.3 s of the same music either side so the join is clean); the synth beat below only covers the moment before it has loaded */
  { const lzOn=S.club&&FOLD.k>.97; if(lzOn&&!FXS.lz&&!FXS.lzLoad){ FXS.lzLoad=true; fetch('music-lounge.mp3').then(r=>r.ok?r.arrayBuffer():null).then(b=>b?c.decodeAudioData(b):null).then(buf=>{ if(!buf) return; const s=c.createBufferSource(); s.buffer=buf; s.loop=true; s.loopStart=.3; s.loopEnd=8.3; const g=c.createGain(); g.gain.value=0; s.connect(g); g.connect(AU.master); s.start(0,.3); FXS.lz={s,g}; }).catch(()=>{}); }
    if(FXS.lz) FXS.lz.g.gain.setTargetAtTime(lzOn?(window.LOUNGE_LV??.5):0,now,lzOn?.7:.3); }
  if(S.club&&FOLD.k>.97&&!FXS.lz){ const spb=60/118, nb=Math.floor(now/spb)+1; if(nb!==FXS.beat){ FXS.beat=nb; const t0=nb*spb-now;
      thud(56,.42,.9,t0); hiss(.09,.05,9000,t0+spb/2); if(nb%2) hiss(.05,.025,11000,t0+spb*.75);
      const o=c.createOscillator(), g=c.createGain(), t=c.currentTime+t0, note=[41.2,41.2,49,36.7][Math.floor(nb/4)%4]; o.type='triangle'; o.frequency.value=note; g.gain.setValueAtTime(0,t+spb*.5); g.gain.linearRampToValueAtTime(.22,t+spb*.52); g.gain.exponentialRampToValueAtTime(.0001,t+spb*.98); o.connect(g); g.connect(AU.bus); o.start(t+spb*.5); o.stop(t+spb); } } }

// ---- the audience (recordings bought from Envato): chatter while the house lights are up, a gasp and applause when the room starts to turn,
// and a full round with cheering when the lights go down. Played dry: these recordings carry their own room.
const CRD={mur:null,fired:{},out:null,live:[]};
// everything the audience does is heard from the house: a little dulled and with the room round it, never close to the ear
function crowdOut(){ const c=AU.ctx; if(!CRD.out){ const lp=c.createBiquadFilter(); lp.type='lowpass'; lp.frequency.value=4200; lp.Q.value=.3; const dry=c.createGain(); dry.gain.value=.8; const wet=c.createGain(); wet.gain.value=.5; const fg=c.createGain(); fg.gain.value=1; lp.connect(fg); fg.connect(dry); dry.connect(AU.master); fg.connect(wet); wet.connect(AU.rev); CRD.out=lp; CRD.fg=fg; } return CRD.out; }
function crowdShot(name,gain){ const c=AU.ctx, b=AU.buf[name]; if(!b) return; const s=c.createBufferSource(); s.buffer=b; const g=c.createGain(); g.gain.value=gain; s.connect(g); g.connect(crowdOut()); s.start(); CRD.live.push(s); }
function crowdStop(){ if(CRD.mur){ try{ CRD.mur.s.stop(); }catch(e){} CRD.mur=null; } for(const s of CRD.live){ try{ s.stop(); }catch(e){} } CRD.live=[]; CRD.fired={}; }
function crowdSound(){ if(!AU.ready||!S.sound) return; const c=AU.ctx, now=c.currentTime; if(typeof FILM==='undefined'||!FILM.on||!FILM.live||FILM.seekTo!=null){ if(CRD.mur||CRD.live.length) crowdStop(); return; } const t=FILM.t;
  if(t<.5&&CRD.fired.any){ crowdStop(); }
  if(!CRD.mur&&AU.buf.murmur&&t<13.5){ const s=c.createBufferSource(); s.buffer=AU.buf.murmur; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=1900; const g=c.createGain(); g.gain.value=0; s.connect(f); f.connect(g); g.connect(crowdOut()); s.start(0,Math.min(t,5)); CRD.mur={s,g}; }
  if(CRD.mur){ const lvl=t<2.8?.26:t<10?.36:t<13?.28:Math.max(0,.28*(1-(t-13)/1.4)); CRD.mur.g.gain.setTargetAtTime(lvl,now,.3); if(t>16.5){ try{ CRD.mur.s.stop(); }catch(e){} CRD.mur=null; } }   /* v18: the chatter sits well back */
  const one=(key,at,name,gain)=>{ if(!CRD.fired[key]&&t>=at&&t<at+1.2&&AU.buf[name]){ CRD.fired[key]=1; CRD.fired.any=1; crowdShot(name,gain); } };
  one('ahh',2.9,'ahh',1.0); one('clap',3.6,'clap',.42); one('cheer',13.0,'cheer',.7);
  // v18: the house reacts to the show: a gasp at the first teleport, a roar when Stage 3 blows and when NOCHE lands, hands for ORO, and the finish
  one('gasp',24.5,'ahh',.6); one('gasp2',26.55,'react',.4); one('roar3',30.6,'roar',.5); one('clap3',31.4,'clap',.26); one('angelA',39.3,'ahh',.45); one('angelC',40.7,'cheer',.55); one('angelK',40.85,'clap',.5); one('react4',47.1,'react',.5); one('roar4',47.25,'roar',.42); one('oro',58.7,'clap',.3); one('final',76.9,'final',.6);
  if(CRD.fg) CRD.fg.gain.setTargetAtTime(t>87.4?0:1,now,t>87.4?.75:.05); }   /* v18b: every reaction sits under the track, and the last applause fades out once the music has gone */

// ================= HOW THE ROOM MOVES =================
// The turntable turns the audience to the stage, or stages, featured at that moment. The two screens stay centred on where the audience faces and slide apart to reveal it.
const norm=a=>((a%TAU)+TAU)%TAU, near=(target,cur)=>{ let d=norm(target-cur); if(d>Math.PI) d-=TAU; return cur+d; };
const MOVE={vt:0,vs:0};
function turnTo(a){ S.faceT=near(a,S.discA); }
function setGap(deg){ S.gapT=clamp(deg,0,180)*D2R; $('#gap').value=Math.round(deg); }
const snapStage=()=>Math.round(S.faceT/(TAU/4))*(TAU/4), snapJoint=()=>(Math.floor(S.faceT/(TAU/4))+.5)*(TAU/4);
const ONE_STAGE=106;      // screens open 106 degrees: the whole quarter of the stage ring is in view from every seat, back row included (90 degrees shows it only from the centre of the turntable)
const SCENES=[
  {id:'closed',name:'Closed',gap:0,ticks:[],go(){ setGap(0); }},
  {id:'one',name:'One stage',gap:106,ticks:[],go(){ S.faceT=snapStage(); setGap(ONE_STAGE); }},
  {id:'two',name:'Two stages',gap:180,ticks:[0],go(){ S.faceT=snapJoint(); setGap(180); }},
  {id:'wide',name:'Wide open',gap:180,ticks:[-45,45],go(){ S.faceT=snapStage(); setGap(180); }}];
function stepMotion(dt){ // both machines accelerate, cruise and brake, the way real ones do
  const dA=S.faceT-S.discA, vT=clamp(dA*1.3,-.36,.36); MOVE.vt+=clamp(vT-MOVE.vt,-.5*dt,.5*dt); if(Math.abs(dA)<.0006&&Math.abs(MOVE.vt)<.01){ MOVE.vt=0; S.discA=S.faceT; } else S.discA+=MOVE.vt*dt;
  const dG=S.gapT-S.gap, vG=clamp(dG*1.6,-.42,.42); MOVE.vs+=clamp(vG-MOVE.vs,-.8*dt,.8*dt); if(Math.abs(dG)<.0006&&Math.abs(MOVE.vs)<.012){ MOVE.vs=0; S.gap=S.gapT; } else S.gap=clamp(S.gap+MOVE.vs*dt,0,Math.PI); }

// ================= THE DIAL: a plan of the room you can turn =================
const SVG='http://www.w3.org/2000/svg', dial=$('#dial');
const pt=(a,r)=>[(Math.sin(a)*r).toFixed(2),(-Math.cos(a)*r).toFixed(2)], arc=(r,a0,a1)=>{ const p0=pt(a0,r), p1=pt(a1,r); return 'M'+p0+'A'+r+' '+r+' 0 '+(Math.abs(a1-a0)>Math.PI?1:0)+' 1 '+p1; };
const el=(tag,attrs,par)=>{ const e=document.createElementNS(SVG,tag); for(const k in attrs) e.setAttribute(k,attrs[k]); (par||dial).appendChild(e); return e; };
el('circle',{r:57,fill:'#07070c',stroke:'#ffffff1f','stroke-width':1});
const dialStages=[0,1,2,3].map(k=>{ const a=stageAngle(k), g=el('g',{}); el('path',{d:arc(47,a-TAU/8+.05,a+TAU/8-.05),fill:'none',stroke:'var(--s'+(k+1)+')','stroke-width':13,'stroke-linecap':'butt',opacity:.9},g);
  const p=pt(a,47); el('text',{x:p[0],y:+p[1]+3.8,'text-anchor':'middle'},g).textContent=k+1; return g; });
for(let k=0;k<4;k++){ const a=JOINT(k), p0=pt(a,41), p1=pt(a,54); el('path',{d:'M'+p0+'L'+p1,stroke:'#fff3d6','stroke-width':2.2,'stroke-linecap':'round'}); }          // the four presentation tunnels
const dialScr=[el('path',{fill:'none',stroke:'#f0c35a','stroke-width':4.5,'stroke-linecap':'round'}),el('path',{fill:'none',stroke:'#f0c35a','stroke-width':4.5,'stroke-linecap':'round'})];
const dialAud=el('g',{}); el('circle',{r:27,fill:'#191923',stroke:'#ffffff26','stroke-width':1},dialAud);
for(let i=0;i<4;i++) el('path',{d:arc(8+i*4.6,-1.05,1.05),fill:'none',stroke:'#c7313f','stroke-width':2.4,'stroke-linecap':'round',opacity:.95,transform:'translate(0 14)'},dialAud);     // rows of seats, facing up the page
el('path',{d:'M0 -24L-4.5 -17H4.5Z',fill:'#f4efe4'},dialAud);
function drawDial(){ const F=S.discA, g=S.gap; dialAud.setAttribute('transform','rotate('+(F/D2R).toFixed(2)+')');
  dialScr[0].setAttribute('d',arc(35,F-g/2-SCREEN_ARC,F-g/2-.02)); dialScr[1].setAttribute('d',arc(35,F+g/2+.02,F+g/2+SCREEN_ARC));
  dialStages.forEach((s,k)=>s.setAttribute('opacity',(.35+.65*stageOpen(k)).toFixed(2))); }
{ let down=false, moved=0, sx=0, sy=0; const ang=e=>{ const r=dial.getBoundingClientRect(); return Math.atan2(e.clientX-(r.left+r.width/2),-(e.clientY-(r.top+r.height/2))); };
  dial.addEventListener('pointerdown',e=>{ try{ dial.setPointerCapture(e.pointerId); }catch(x){} down=true; moved=0; sx=e.clientX; sy=e.clientY; });
  dial.addEventListener('pointermove',e=>{ if(!down) return; moved=Math.max(moved,Math.hypot(e.clientX-sx,e.clientY-sy)); if(moved>6) turnTo(ang(e)); });
  dial.addEventListener('pointerup',e=>{ if(down&&moved<=6){ const a=ang(e); turnTo(Math.round(norm(a)/(TAU/4))*(TAU/4)); } down=false; });
  dial.addEventListener('pointercancel',()=>{ down=false; });
  dial.setAttribute('tabindex','0'); dial.addEventListener('keydown',e=>{ if(e.key==='ArrowLeft'){ S.faceT-=TAU/8; e.preventDefault(); } if(e.key==='ArrowRight'){ S.faceT+=TAU/8; e.preventDefault(); } }); }
// scene buttons, each with a small picture of where the screens end up
SCENES.forEach(sc=>{ const b=document.createElement('button'); b.className='sc'; b.dataset.scene=sc.id; b.setAttribute('aria-pressed','false'); const g=sc.gap*D2R/2;
  const s=document.createElementNS(SVG,'svg'); s.setAttribute('viewBox','-17 -15 34 20'); s.setAttribute('aria-hidden','true');
  const P=(d,st,w)=>{ const p=document.createElementNS(SVG,'path'); p.setAttribute('d',d); p.setAttribute('fill','none'); p.setAttribute('stroke',st); p.setAttribute('stroke-width',w); p.setAttribute('stroke-linecap','round'); s.appendChild(p); };
  P(arc(13,-Math.PI/2,Math.PI/2),'#ffffff2e',1.2); if(sc.gap<180){ P(arc(13,-g-(Math.PI/2-g),-g-.04),'currentColor',2.6); P(arc(13,g+.04,Math.PI/2),'currentColor',2.6); } else { P('M-15 3h4','currentColor',2.6); P('M11 3h4','currentColor',2.6); }
  for(const t of sc.ticks){ const p0=pt(t*D2R,10), p1=pt(t*D2R,15.5); P('M'+p0+'L'+p1,'#fff3d6',1.8); }
  b.appendChild(s); b.appendChild(document.createTextNode(sc.name)); b.addEventListener('click',()=>sc.go()); $('#scenes').appendChild(b); });
$('#gap').addEventListener('input',e=>{ S.gapT=(+e.target.value)*D2R; });

// ================= VIEW: sit in any seat and move closer, or stand back and see the whole room =================
const V={mode:'seat',seat:null,yaw:0,pitch:0,zoom:0,tgt:new T.Vector3(0,1.5,0),r:60,th:.55,ph:.8,fov:42,blend:1};
const _e=new T.Vector3(), _l=new T.Vector3(), _f=new T.Vector3(), _c=new T.Vector3(), camFrom=new T.Vector3(), lookFrom=new T.Vector3(), camTo=new T.Vector3(), lookTo=new T.Vector3(); let fovFrom=60, fovTo=60;
const marker=new T.Mesh(new T.TorusGeometry(.34,.035,8,40),glow(0xf0c35a)); marker.rotation.x=Math.PI/2; seating.add(marker);
function sit(s,keep){ V.seat=s; audSync(); marker.position.set(s.x,s.y+1.3,s.z); if(!keep){ V.yaw=0; V.pitch=0; V.zoom=0; } setView('seat'); }
function setView(m){ V.mode=m; V.blend=0; camFrom.copy(camera.position); camera.getWorldDirection(_f); lookFrom.copy(camera.position).addScaledVector(_f,12); fovFrom=camera.fov;
  $$('[data-view]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.view===m?'true':'false')); marker.visible=m==='room'; }
function viewTarget(){ if(V.mode==='seat'){ const s=V.seat, z=V.zoom;
    _e.set(s.x,s.y+1.2,s.z); _c.set(s.x*.25,2.5,-11.6); _e.lerp(_c,z*.86);                                      // moving closer: straight down the sightline toward the front of the house
    _f.set(-_e.x*.9,2.4-_e.y,-16.5-_e.z).normalize(); const y0=Math.atan2(_f.x,-_f.z), p0=Math.asin(_f.y), y=y0+V.yaw, p=clamp(p0+V.pitch,-1.2,1.3);
    _l.set(Math.sin(y)*Math.cos(p),Math.sin(p),-Math.cos(y)*Math.cos(p)).multiplyScalar(10).add(_e);
    camTo.copy(_e).applyMatrix4(disc.matrixWorld); lookTo.copy(_l).applyMatrix4(disc.matrixWorld); { const hf=lerp(84,44,z)*D2R; fovTo=clamp(2*Math.atan(Math.tan(hf/2)/Math.max(.5,camera.aspect))/D2R,28,78); } }      // field of view set by width: 84 degrees across takes in the whole stage quarter from mid-house, the way your eyes do
  else{ const sp=Math.sin(V.ph); camTo.set(sp*Math.sin(V.th),Math.cos(V.ph),sp*Math.cos(V.th)).multiplyScalar(V.r).add(V.tgt); lookTo.copy(V.tgt); fovTo=V.fov; } }
function applyCamera(dt){ viewTarget(); V.blend=Math.min(1,V.blend+dt/1.6); const e=ease(V.blend);
  if(e<1){ camera.position.lerpVectors(camFrom,camTo,e); _l.lerpVectors(lookFrom,lookTo,e); camera.fov=lerp(fovFrom,fovTo,e); } else { camera.position.copy(camTo); _l.copy(lookTo); camera.fov=fovTo; }
  camera.up.set(0,1,0); camera.lookAt(_l); camera.updateProjectionMatrix(); }
{ const pts=new Map(); let pinch=0, moved=0; const ray=new T.Raycaster(), ndc=new T.Vector2();
  const zoom=f=>{ if(V.mode==='seat') V.zoom=clamp(V.zoom-Math.log(f)*.55,0,1); else V.r=clamp(V.r*f,18,95); nudge(); };
  canvas.addEventListener('pointerdown',e=>{ try{ canvas.setPointerCapture(e.pointerId); }catch(x){} pts.set(e.pointerId,{x:e.clientX,y:e.clientY}); moved=0; if(pts.size===2){ const [a,b]=[...pts.values()]; pinch=Math.hypot(a.x-b.x,a.y-b.y); } });
  canvas.addEventListener('pointermove',e=>{ const p=pts.get(e.pointerId); if(!p) return; const dx=e.clientX-p.x, dy=e.clientY-p.y; p.x=e.clientX; p.y=e.clientY;
    if(pts.size===2){ const [a,b]=[...pts.values()], d=Math.hypot(a.x-b.x,a.y-b.y); if(pinch>0) zoom(pinch/d); pinch=d; moved=99; return; }
    moved+=Math.abs(dx)+Math.abs(dy); if(moved<5) return;
    if(V.mode==='seat'){ V.yaw=clamp(V.yaw-dx*.0034,-2.7,2.7); V.pitch=clamp(V.pitch+dy*.003,-.7,.9); } else { V.th-=dx*.0045; V.ph=clamp(V.ph-dy*.0045,.05,1.5); } nudge(); });
  const up=e=>{ const had=pts.has(e.pointerId); pts.delete(e.pointerId); pinch=0; if(!had||moved>=6||S.club) return;
    const r=canvas.getBoundingClientRect(); ndc.set((e.clientX-r.left)/r.width*2-1,-((e.clientY-r.top)/r.height*2-1)); ray.setFromCamera(ndc,camera); const h=ray.intersectObjects(seatMeshes)[0];
    if(h&&h.instanceId!==undefined){ const s=h.object.userData.list[h.instanceId]; if(s) sit(s); } };
  canvas.addEventListener('pointerup',up); canvas.addEventListener('pointercancel',e=>{ pts.delete(e.pointerId); pinch=0; });
  canvas.addEventListener('wheel',e=>{ e.preventDefault(); zoom(Math.exp(e.deltaY*.0012)); },{passive:false}); }
let hintT=0; function nudge(){ if(!hintT){ hintT=1; setTimeout(()=>{ $('#hint').style.opacity=0; },2500); } }
$$('[data-view]').forEach(b=>b.addEventListener('click',()=>setView(b.dataset.view)));

// ================= LIFT, SOUND, CAPTION =================
$('#fx').addEventListener('click',()=>{ FXFIRE.t=performance.now()/1000; });
$('#lift').addEventListener('click',()=>{ S.lift=!S.lift; S.liftT=performance.now()/1000; if(S.lift) S.liftK=((Math.round(S.faceT/(TAU/4))%4)+4)%4; $('#lift').setAttribute('aria-pressed',S.lift?'true':'false'); $('#lift').textContent=S.lift?'Lower the lifts':'Raise the lifts'; });
$('#aud').addEventListener('click',()=>{ setPeople(!S.people); $('#aud').setAttribute('aria-pressed',S.people?'true':'false'); });
$('#house').addEventListener('click',()=>{ S.house=!S.house; $('#house').setAttribute('aria-pressed',S.house?'true':'false'); });
{ const rs=$('#roomSel'); for(const id in ROOMS){ const o=document.createElement('option'); o.value=id; o.textContent=ROOMS[id].name; rs.appendChild(o); } rs.addEventListener('change',()=>{ setRoom(rs.value); if(S.club) setGap(0); }); }
$('#haze').addEventListener('input',e=>{ S.haze=(+e.target.value)/100; });
$('#snd').addEventListener('click',async()=>{ await setSound(!S.sound); $('#snd').setAttribute('aria-pressed',S.sound?'true':'false'); $('#snd-w').setAttribute('opacity',S.sound?'1':'.3'); });
const words=o=>o>.95?'all of':Math.abs(o-.5)<.07?'half of':Math.abs(o-.25)<.07?'a quarter of':Math.abs(o-.75)<.07?'three quarters of':Math.round(o*100)+'% of';
let lastCap='';
function caption(){ const deg=norm(S.discA)/D2R, nearK=Math.round(deg/90)%4, off=deg-Math.round(deg/90)*90, lo=Math.floor(deg/90)%4;
  const face=Math.abs(off)<5?'Facing <b>stage '+(nearK+1)+'</b>':'Facing between <b>stages '+(lo+1)+' and '+((lo+1)%4+1)+'</b>';
  const g=Math.round(S.gap/D2R), gap=g<1?'screens closed, <b>180&deg; of picture</b>':g>179?'screens <b>fully open</b>':'screens open <b>'+g+'&deg;</b>';
  const parts=[]; for(const i of [0,1,3,2]){ const k=(nearK+i)%4, o=stageOpen(k); if(o>.04) parts.push(words(o)+' stage '+(k+1)); }
  const txt=(S.room!=='theatre'?'<b>'+ROOMS[S.room].name+'</b>':face)+' &middot; '+gap+(parts.length&&!S.club?' &middot; in view: <b>'+parts.join(', ')+'</b>':'')+(g>0?' &middot; look: <b>'+LOOKS[SHOW.cur].name+'</b>':''); if(txt!==lastCap){ lastCap=txt; $('#caption').innerHTML=txt; }
  const moving=Math.abs(S.faceT-S.discA)>.01, fT=norm(S.faceT)/D2R, cen=Math.abs(fT-Math.round(fT/90)*90)<1, jo=Math.abs(fT-(Math.floor(fT/90)+.5)*90)<1, gT=Math.round(S.gapT/D2R);
  const cur=gT===0?'closed':gT===ONE_STAGE&&cen?'one':gT===180&&jo?'two':gT===180&&cen?'wide':''; $$('[data-scene]').forEach(b=>b.setAttribute('aria-pressed',b.dataset.scene===cur?'true':'false')); }

// ================= START =================
resize(); applyContent(screenMat,'bcn',0,false); S.liftK=0;
if(document.readyState==='complete') setTimeout(setFootage,300); else window.addEventListener('load',()=>setTimeout(setFootage,300));      // footage loads after the room, so it never holds up the page
function setFootage(){ const v=VIDEOS.find(x=>x.id===S.footage); if(v&&v.file){ videoTex(v); playOnly(v.id); applyContent(screenMat,v.id,0,true); } else { playOnly(null); applyContent(screenMat,S.footage,0,false); } }
{ const sel=$('#footage'); for(const v of VIDEOS){ const o=document.createElement('option'); o.value=v.id; o.textContent=v.name; sel.appendChild(o); } sel.value=S.footage; sel.addEventListener('change',()=>{ S.footage=sel.value; setFootage(); syncControls(); });
  canvas.addEventListener('pointerdown',()=>{ const v=VID[S.footage]; if(v&&v.el.paused&&!S.club) v.el.play().catch(()=>{}); }); }
{ const c=LAY.seats.reduce((b,s)=>(Math.hypot(s.x,s.z-4.5)<Math.hypot(b.x,b.z-4.5)?s:b),LAY.seats[0]); V.seat=c; marker.position.set(c.x,c.y+1.3,c.z); marker.visible=false; viewTarget(); camFrom.copy(camTo); lookFrom.copy(lookTo); fovFrom=fovTo; V.blend=1; }
if(/[?&]empty/.test(location.search)){ S.people=false; $('#aud').setAttribute('aria-pressed','false'); }
if(S.people) JOBS.push(loadAudience);
JOBS.push(loadSuits); JOBS.push(loadHoloDancer); JOBS.push(loadStagePeople);
{ const elL=$('#loading'); elL.hidden=false; let left=JOBS.length; window.__load={total:JOBS.length,left}; for(const job of JOBS) job().catch(e=>console.info('A model did not load:',e&&e.message)).then(()=>{ window.__load.left=--left; if(left<=0) elL.hidden=true; shadowsDirty(); }); }
let last=performance.now(), slow=0, frameN=0;
function loop(now){ requestAnimationFrame(loop); { const Q=window.__Q||(window.__Q={t:now,n:0,acc:0,qs:1,up:0}); const ft=now-Q.t; Q.t=now; if(!window.__norender&&!document.hidden&&ft>0&&ft<600&&!(FILM.on&&FILM.live)&&(window.__LD||(window.__LD=document.getElementById('loading'))).hidden){ Q.acc+=ft; if(++Q.n>=40||Q.acc>=900){ const av=Q.acc/Q.n; Q.n=0; Q.acc=0; if(av>40&&Q.qs>.4){ Q.qs=Math.max(.4,Q.qs*(av>70?.75:.85)); Q.up=0; window.__QS=Q.qs; try{ resize(); }catch(e){} } else if(av<24&&Q.qs<1){ if(++Q.up>=3){ Q.up=0; Q.qs=Math.min(1,Q.qs*1.15); window.__QS=Q.qs; try{ resize(); }catch(e){} } } else Q.up=0; } } }   /* smoothness watch: slower than 25 frames a second for 40 frames -> draw fewer pixels; comfortably fast for a while -> sharpen again */ const seeking=FILM.on&&FILM.seekTo!=null; const dt=seeking?.1:Math.min(window.__dtmax||(FILM.on&&FILM.live?.25:.05),(now-last)/1000);   /* while the film plays live, a slow device takes bigger steps instead of falling behind the music */ last=now; frameN++; const t=now/1000, beat=t*118/60;
  stepMotion(dt); disc.rotation.y=-S.discA; if(FILM.hold) setScreens(FILM.scrA,FILM.gapH); else setScreens(S.discA,S.gap);
  if(Math.abs(MOVE.vt)>0||frameN<6) shadowsDirty();
  updateShow(t,dt); updateFold(dt); updateControl(dt); tourUpdate(dt); showUpdate(dt); if(FILM.on) filmUpdate(dt,t); trimMat.color.copy(SHOW.c).lerp(CW,.25).multiplyScalar(SHOW.dim); trimLine.color.copy(trimMat.color); updateRig(t,dt); scene.updateMatrixWorld();
  let liftMoving=false, liftUp=false; updateDance(dt); updateRig2(t,dt); aerialUpdate(dt); walkUpdate(); crowdUpdate(t); audClapUpdate(); boltsUpdate(); burstUpdate(dt); stemUpdate(); tripCryoUpdate(); clashUpdate(dt); for(let k=0;k<4;k++){ updateStage(k,dt,t,beat); if(ST[k].lift.moving){ liftMoving=true; liftUp=S.lift&&S.liftK===k; } }
  updateCams(t); updatePortals(t); updateFx(t,dt); for(const m of LEDS) m.uniforms.uT.value=REDUCED?12:t+(window.__tOff||0); if(bloom) bloom.strength=.38+.32*S.haze;
  scene.updateMatrixWorld(); updateGobos(); applyCamera(dt); grid.visible=camera.position.y<ROOM_H-2.6; if(FILM.on) filmCam(); caption(); if(frameN%2===0) drawDial();
  audioUpdate(Math.abs(MOVE.vs),Math.abs(MOVE.vt),liftMoving||FOLD.moving,liftUp||(FOLD.moving&&!S.club));
  if(grade){ grade.uniforms.uT.value=t; grade.uniforms.uExp.value=1+.3*S.houseK; }
  if(window.__norender||seeking){} else if(composer&&S.glow) composer.render(); else renderer.render(scene,camera);
  // if a device cannot keep up, drop the floor reflections first, then the bloom
  if((S.glow||S.reflect)&&!window.__keep){ if(dt>.05) slow++; else slow=Math.max(0,slow-1); if(slow>90){ slow=0; if(S.reflect){ S.reflect=false; setReflect(false); } else if(S.glow) S.glow=false; } }
}
if(/[?&]lite/.test(location.search)){ S.reflect=false; setReflect(false); S.glow=false; }
if(/[?&]norefl/.test(location.search)){ S.reflect=false; setReflect(false); }
drawDial(); requestAnimationFrame(loop);
if(location.hash==='#tour') setTimeout(tourStart,1200);
{ let did=false; const go=()=>{ const m=/^#quiet(?:-(tour|film))?(?:-(\d+))?$/.exec(location.hash); if(!m||did) return; did=true; window.__quiet=true; try{ setSound(false); }catch(e){} const I=$('#intro'); if(m[1]) I.hidden=true; if(m[1]==='tour') setTimeout(()=>{ tourStart(); if(m[2]) setTimeout(()=>tourGo(+m[2]),400); },2500); if(m[1]==='film') setTimeout(()=>filmSeek(+(m[2]||0)),2500); }; go(); addEventListener('hashchange',go); }   // silent test links
window.__arena={scene,renderer,AUD,DANCE,KITS,KITLOAD,FOLD,setRoom,ROOMS,TOUR,tourGo,CTL,ONE_STAGE,FOLD,clubKit,FX,screenMat,applyContent,wallMat,seating,AUD,SUITS,CLUB,setPeople,setClub,SHOW,LOOKS,S,ST,V,MOVE,camera,disc,turnTo,setGap,setView,sit,stageOpen,SCENES,LAY,seatCount:()=>LAY.seats.length,SOCK};

// ================= THE TOUR: a host walks you through the build, one piece at a time =================
// Second page of the model (#tour). The host is a Kling avatar filmed on green: he is keyed out live, shown alone to open, then in a corner
// over the overhead views, and once you are in a seat he stands downstage centre at true size (1.80 m) so the stage reads at its real scale.
// The only directions on screen are Back and Continue.
const HOSTLINES=[   /* v24: the host's original voice is back on every line that has an original take (hostNN.v24.mp4 = the pre-t23 clips); the cloned voice stays only on lines 15 and 17, whose wording he changed (level-matched) */
  'Welcome to the Reverse Arena Theater, in Barcelona. In the next few minutes, I\u2019m going to build it for you, piece by piece. It all starts with one simple idea\u2026 a giant turntable.',
  'Twenty-seven meters across. It carries the entire audience, and turns them to face the show. The stage never moves. You do.',
  '',
  '',
  'We rake the seating\u2026 so every seat has a clear, unobstructed view.',
  'Around you runs one continuous stage. A full ring, divided into four. Four stages, built side by side\u2026 never struck, never dark.',
  'Between you and those stages hang two giant curtains of LED video. Closed, they wrap you in a hundred and eighty degrees of picture. The best ones are in the center premium rows, with extra legroom and a table for your drink.',
  'When the curtains slide open, the picture becomes a window\u2026 and behind it is a real stage, ten meters deep.',
  'Each stage is built for its own kind of show. Risers, lifts, doors, and scenery\u2026 all waiting behind the walls.',
  'Above you, the lighting rig. Its rings turn with the audience\u2026 or spin on their own.',
  'Now, the big moment. The whole audience turns\u2026 and a second stage, already lit and running, opens right in front of you. No set changes. No waiting.',
  'Here\u2019s the twist. Each stage belongs to a team of students from our own school. Four teams. Four stages. Competing live, every night.',
  'And you decide who wins. Through the Reverse Arena app, the whole room votes\u2026 and the vote sends the second half of the show to the winning stage. In this theater, the audience are the producers.',
  'Every night is filmed. Cameras on cranes and on the floor capture the competition for a streaming series\u2026 a whole season of teams, rivalries, and finales.',
  'And when the show needs everything, the curtains open to two stages at once, each with its own unique mechanics and effects.',
  'And on other nights, the seats fold away into the floor. It becomes a dinner theater\u2026',
  '\u2026or late night cultural programming, with shows created by our students. It can change how award shows are made, run a musical with every set standing ready, even stage an opera with each act in its own world. One room, built to work every night. Welcome\u2026 to the Reverse Arena.'];

const HOSTSTART={4:1.08};   // v24: line 5's original take opens with "And of course," (left over from the cut seat lines): start on "we rake"
const HOSTEND=[10.75,8.49,1.76,8.09,5.58,10.19,12.54,7.33,8.3,5.77,9.86,8.66,10.9,9.68,7.11,4.98,18.56];   // where each line's speech ends in its clip (s)
// ---- the host: one video element, keyed two ways (a 2D canvas for the overlay, a shader for the stage) ----
const HOST={el:null,mode:'off',box:null,k:1,stage:0,pend:null,cv:$('#hostCv'),ov:$('#hostOv')};
HOST.ctx=HOST.cv.getContext('2d',{willReadFrequently:true});
{ const v=document.createElement('video'); v.playsInline=true; v.setAttribute('playsinline',''); v.preload='auto'; v.style.display='none'; document.body.appendChild(v); HOST.el=v; }
HOST.tex=new T.VideoTexture(HOST.el); HOST.tex.minFilter=T.LinearFilter; HOST.tex.magFilter=T.LinearFilter;
HOST.mat=new T.ShaderMaterial({transparent:true,depthWrite:false,uniforms:{map:{value:HOST.tex},uDim:{value:.95}},
  vertexShader:'varying vec2 vUv; void main(){ vUv=uv; gl_Position=projectionMatrix*modelViewMatrix*vec4(position,1.); }',
  fragmentShader:`uniform sampler2D map; uniform float uDim; varying vec2 vUv;
    void main(){ vec3 c=texture2D(map,vUv).rgb; float m=max(c.r,c.b), d=c.g-m, a=1.-smoothstep(.035,.105,d); if(a<.03) discard; c.g=min(c.g,m*1.02+.01); gl_FragColor=vec4(c*uDim,a); }`});
HOST.mesh=new T.Mesh(new T.PlaneGeometry(1,1),HOST.mat); HOST.mesh.visible=false; HOST.mesh.renderOrder=5; scene.add(HOST.mesh);
const EV=(k,a)=>{ if(window.__evlog) window.__evlog.push([performance.now(),k,a]); };
const hostSrc=i=>window.__hostTest||('host'+String(i+1).padStart(2,'0')+(i===2||i===3?'':'.v24')+'.mp4');   /* v24: the chosen take per line (lines 3 and 4 are never spoken) */
function hostMode(m){ HOST.mode=m; HOST.ov.hidden=!(m==='full'||m==='pip'); HOST.ov.className=m; HOST.mesh.visible=m==='stage'; }
function hostStop(){ const p=HOST.pend; HOST.pend=null; try{ HOST.el.pause(); }catch(e){} if(p) p(); }
// play one line; resolves when it ends (or, if the clip will not play, after the time it takes to read it)
function say(i,alive){ hostStop(); EV('say',i); $('#tText').textContent=HOSTLINES[i]; return new Promise(res=>{ let done=false; const fin=()=>{ if(done) return; done=true; clearTimeout(to); HOST.el.onended=HOST.el.onerror=HOST.el.ontimeupdate=null; if(HOST.pend===fin) HOST.pend=null; res(); };
    HOST.pend=fin; const to=setTimeout(fin,Math.max(4000,HOSTLINES[i].length*75)+9000); const v=HOST.el; v.onended=fin; const t00=performance.now(); v.ontimeupdate=()=>{ if(!window.__render&&HOSTEND[i]&&v.currentTime>=HOSTEND[i]+.35&&performance.now()-t00>(HOSTEND[i]-(HOSTSTART[i]||0))*750){ v.ontimeupdate=null; try{ v.pause(); }catch(e){} fin(); } }; v.onerror=()=>{ clearTimeout(to); setTimeout(fin,HOSTLINES[i].length*62); };
    v.src=hostSrc(i); v.muted=!!window.__quiet; v.currentTime=HOSTSTART[i]||0; const pr=v.play(); if(pr&&pr.catch) pr.catch(()=>{ v.muted=true; v.play().catch(()=>{ clearTimeout(to); setTimeout(fin,HOSTLINES[i].length*62); }); }); }); }
// key a frame into the overlay canvas; the first frame also measures where the host stands in the picture (head to shoes) for true scale
function hostDraw(){ const v=HOST.el; if(v.readyState<2||!v.videoWidth) return; const cv=HOST.cv; { const ww=Math.round(720*v.videoWidth/v.videoHeight); if(cv.width!==ww){ cv.width=ww; cv.height=720; } } const w=cv.width, h=cv.height, x=HOST.ctx; x.drawImage(v,0,0,w,h);
  const id=x.getImageData(0,0,w,h), d=id.data; for(let p=0;p<d.length;p+=4){ const r=d[p], g=d[p+1], b=d[p+2], m=r>b?r:b, k=g-m; if(k>9){ const a=k>27?0:1-(k-9)/18; d[p+3]=a*255; } if(g>m) d[p+1]=m+2; }
  x.putImageData(id,0,0); }
function hostMeasure(){ const v=HOST.el; if(HOST.box||v.readyState<2||!v.videoWidth) return; const c=document.createElement('canvas'), w=135, h=240; c.width=w; c.height=h; const x=c.getContext('2d',{willReadFrequently:true}); x.drawImage(v,0,0,w,h);
  const d=x.getImageData(0,0,w,h).data; let top=h, bot=0; for(let y=0;y<h;y++){ let n=0; for(let i=0;i<w;i++){ const p=(y*w+i)*4, m=Math.max(d[p],d[p+2]); if(d[p+1]-m<14) n++; } if(n>=3){ top=Math.min(top,y); bot=y; } }
  if(bot>top+40) HOST.box={top:top/h,bot:(bot+1)/h,ar:v.videoWidth/v.videoHeight}; }
const _hp=new T.Vector3();
function hostPlace(){ if(HOST.el.readyState>=2&&HOST.el.videoWidth>0) HOST.seen=true; HOST.mesh.visible=HOST.mode==='stage'&&!!HOST.seen; if(!HOST.mesh.visible) return;   /* v21: while the next line loads he holds his last frame instead of vanishing */ hostMeasure(); const b=HOST.box||{top:.06,bot:.94,ar:9/16}, H=1.80/(b.bot-b.top), W=H*b.ar;                 // the host is 1.80 m from his crown to his shoes
  const p=pol(stageAngle(HOST.stage),14.6,STAGE_H); let fy=STAGE_H; if(HOST.dj&&CLUBH.booth){ CLUBH.booth.updateMatrixWorld(true); CLUBH.booth.localToWorld(p.set(0,.3,-.55)); fy=p.y; } HOST.mesh.scale.set(W,H,1); HOST.mesh.position.set(p.x,fy-H*(1-b.bot)+H/2,p.z);
  camera.getWorldPosition(_hp); HOST.mesh.rotation.set(0,Math.atan2(_hp.x-p.x,_hp.z-p.z),0); HOST.mat.uniforms.uDim.value=.78+.22*Math.min(1.3,S.lookK); }

// ---- markings on the turntable (so it reads as turning) ----
const MARKS=(()=>{ const c=document.createElement('canvas'); c.width=c.height=1024; const x=c.getContext('2d'), C=512, R=500; x.translate(C,C);
  x.strokeStyle='rgba(255,236,200,.85)'; x.fillStyle='rgba(255,236,200,.9)'; x.lineCap='round';
  for(let i=0;i<72;i++){ const a=i/72*Math.PI*2, L=i%9===0?46:i%3===0?28:14; x.lineWidth=i%9===0?5:2.5; x.beginPath(); x.moveTo(Math.sin(a)*(R-6),-Math.cos(a)*(R-6)); x.lineTo(Math.sin(a)*(R-6-L),-Math.cos(a)*(R-6-L)); x.stroke(); }
  x.lineWidth=3; x.beginPath(); x.arc(0,0,R-6,0,Math.PI*2); x.stroke(); x.beginPath(); x.arc(0,0,R*.62,0,Math.PI*2); x.setLineDash([10,14]); x.stroke(); x.setLineDash([]);
  x.font='600 34px system-ui,sans-serif'; x.textAlign='center'; x.textBaseline='middle'; for(let i=0;i<8;i++){ const a=i/8*Math.PI*2; x.save(); x.rotate(a); x.fillText((i*45)+'°',0,-(R-84)); x.restore(); }
  x.strokeStyle='rgba(240,195,90,.95)'; x.fillStyle='rgba(240,195,90,.95)'; x.lineWidth=4; x.beginPath(); x.moveTo(-R+60,0); x.lineTo(R-60,0); x.stroke();
  x.font='600 40px system-ui,sans-serif'; x.fillText('27 m',0,-30); x.beginPath(); x.moveTo(0,-R+130); x.lineTo(-34,-R+190); x.lineTo(34,-R+190); x.closePath(); x.fill();
  const m=new T.Mesh(new T.CircleGeometry(R_DISC-.15,96),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=.035; m.renderOrder=2; m.visible=false; disc.add(m); return m; })();

// ---- the stage ring picked out from above: four gold quarters ----
const RINGHL=(()=>{ const c=document.createElement('canvas'); c.width=c.height=1024; const x=c.getContext('2d'), C=512, k=C/R_OUT, r0=R_DISC*k+2, r1=R_OUT*k-2; x.translate(C,C);
  x.fillStyle='rgba(240,195,90,.16)'; x.beginPath(); x.arc(0,0,r1,0,Math.PI*2); x.arc(0,0,r0,0,Math.PI*2,true); x.fill('evenodd');
  x.strokeStyle='rgba(255,214,120,.95)'; x.lineWidth=6; for(const r of [r0,r1]){ x.beginPath(); x.arc(0,0,r,0,Math.PI*2); x.stroke(); }
  for(let q=0;q<4;q++){ const a=(q+.5)*Math.PI/2; x.beginPath(); x.moveTo(Math.sin(a)*r0,-Math.cos(a)*r0); x.lineTo(Math.sin(a)*r1,-Math.cos(a)*r1); x.stroke(); }
  x.fillStyle='rgba(255,236,200,.95)'; x.font='600 40px system-ui,sans-serif'; x.textAlign='center'; x.textBaseline='middle'; for(let q=0;q<4;q++){ const a=q*Math.PI/2, r=(r0+r1)/2; x.fillText('STAGE '+(q+1),Math.sin(a)*r,-Math.cos(a)*r); }
  const m=new T.Mesh(new T.PlaneGeometry(R_OUT*2,R_OUT*2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=STAGE_H+.04; m.renderOrder=3; m.visible=false; scene.add(m); delete m.userData.cat; return m; })();

// ---- a soft key light for the build-up steps, before the rig exists to light anything ----
const TKEY=new T.DirectionalLight(0xfff0dc,0); TKEY.position.set(8,32,18); scene.add(TKEY); scene.add(TKEY.target);
const TFILL=new T.HemisphereLight(0xcfd8ff,0x241c14,0); scene.add(TFILL); const TSPOT=new T.SpotLight(0xfff0dc,0,14,.5,.6,1.2); TSPOT.position.set(2.2,4.2,3.0); TSPOT.target.position.set(0,.5,0); scene.add(TSPOT); scene.add(TSPOT.target); delete TSPOT.userData.cat; delete TSPOT.target.userData.cat; for(const o of [TKEY,TKEY.target,TFILL]) delete o.userData.cat;

// ---- the best seat: middle row of the three premium rows, beside the centre aisle ----
const BEST=(()=>{ let b=null; for(const s of LAY.seats) if(s.vip&&s.row===1&&(!b||Math.abs(s.x)<Math.abs(b.x))) b=s; return b||LAY.seats[0]; })();
const _bt=new T.Vector3();

// ---- steps ----
// Each step first sets its starting state outright (so Back and Continue always land clean), then plays its moment.
const TW=[]; function tween(o,k,to,dur,del){ TW.push({o,k,from:null,to,dur,t:-(del||0)}); }
const TS={spin:false,drop:null,dropOn:false,marks:0,stUp:0,rigUp:0,pitch:null,tag:false,landed:0,thudT:0,dark:0,cast:0,seq:false};
let RUN=0, tourSaved=null, tourSeat=null;
const lerpA=(a,b,k)=>a+(b-a)*k;
const TSTEPS=[
  {title:'Welcome',host:'full'},
  {title:'The turntable',host:'pip'},
  {title:'The seating',host:'pip'},
  {title:'The stage ring',host:'pip'},
  {title:'The video curtains',host:'stage'},
  {title:'The reveal',host:'stage'},
  {title:'The set',host:'stage'},
  {title:'The lighting rig',host:'stage'},
  {title:'The big turn',host:'stage'},
  {title:'Four teams',host:'pip'},
  {title:'The room votes',host:'stage'},
  {title:'Every night is filmed',host:'stage'},
  {title:'Two stages at once',host:'pip'},
  {title:'Dinner theatre',host:'pip'},
  {title:'Late night cultural programming',host:'pip'}];
function setCats(list){ for(const c of scene.children){ const cat=c.userData.cat; if(!cat||c===HOST.mesh) continue; c.visible=list.includes(cat)&&!c.userData.scaleMan; } }
function camRoom(r,ph,th,tx,ty,tz,fov){ V.r=r; V.ph=ph; V.th=th; V.tgt.set(tx,ty,tz); V.fov=fov||42; setView('room'); }
function jumpRoom(id){ if(S.room===id) return; S.room=id; S.club=id==='club'||id==='pit'; const R=ROOMS[id]; FOLD.k=id==='theatre'?0:1; FOLD.h=id==='theatre'?0:R.lift; FOLD.after=null; FOLD.dirty=true; $('#roomSel').value=id; if(id==='dinner'||id==='trade') loadKit(id).catch(()=>{}); }
function face(k,instant){ if(!instant) EV('turn'); const a=stageAngle(k); S.faceT=near(a,S.discA); if(instant) S.discA=S.faceT; }
function gapNow(deg){ setGap(deg); S.gap=S.gapT; MOVE.vs=0; }
function tourGo(i){ i=clamp(i,0,TSTEPS.length-1); const st=TSTEPS[i]; const seq=TOUR.step===i-1; TOUR.step=i; TS.seq=seq; TS.cast=0; if(APP.on&&!FILM.on) appStop();   /* t22: seq = arrived from the step before, so the room carries on instead of being reset */ const my=++RUN; hostStop(); TW.length=0;
  $('#tStep').textContent=(i+1)+' / '+TSTEPS.length; $('#tTitle').textContent=st.title; $('#tText').textContent='';
  $$('#tDots i').forEach((d,k)=>d.className=k===i?'on':''); $('#tBack').disabled=i===0; $('#tNext').textContent=i===TSTEPS.length-1?'Finish':'Continue';
  // the room as it stands at the start of this step
  if(i<=13) jumpRoom('theatre'); else { TS.dark=1; setRoom('club'); FOLD.k=1; FOLD.h=ROOMS.club.lift; FOLD.after=null; FOLD.dirty=true; }   /* t22: the club opens on a cut from black: we land in it */
  if(i>=9&&S.people) loadCrowd().catch(()=>{});   /* t22: the club crowd is made ahead, while the room is still, so it never pops in */
  const ALL=['disc','deck','room','screens','stages','portals','rig'];
  setCats(i===0?[]:i<=2?['disc']:i===3?['disc','deck','room']:i<=6?ALL.slice(0,6):i===9?['disc','deck','room','stages','portals']:ALL);
  TS.spin=i===1; if(!!S.house!==(i>=1&&i<=3||i===9)) $('#house').click(); TS.marks=i<=2?1:0; MARKS.visible=i>=1&&i<=2; if(i>=3) MARKS.material.opacity=0;
  FOLD.drop=i<=2?0:null; TS.dropOn=false; FOLD.rake=i<=2?0:1; FOLD.dirty=true; TOUR.show.front=i>=3; TOUR.cams=i===11||i===12;
  if(tourSeat) tourSeat.visible=false;
  TS.stUp=i<=6?0:1; TS.rigUp=i<=7?0:1; TS.pitch=null; TS.tag=i===4; TS.drift=0;
  S.ledOn=i===4||i>=8; S.look=i>=5&&i<=7?'bright':'mid'; S.fxAuto=i>=8; if(S.lift) $('#lift').click();
  if(!(seq&&i===13)){ face(i<=8?0:i<=10?3:2,true); gapNow(i<=3||i===9?180:i===4||i===5?0:i<=12?ONE_STAGE:i===13?180:0); }   /* t22: from the two-stage moment the turntable and the walls slide on; nothing snaps */ V.pitch=0; V.yaw=0; V.zoom=0;
  HOST.stage=i<=8?0:i<=10?3:2; hostMode(st.host);
  { const f=i>=5&&i<=7?'off':'v-gold'; if(S.footage!==f&&!S.club){ S.footage=f; setFootage(); } }
  RINGHL.visible=i===3; RINGHL.material.opacity=0; TEAMHL.visible=i===9; TEAMHL.material.opacity=0;
  $('#vote').hidden=true; $('#rec').hidden=i!==11;
  // cameras
  if(i===1) camRoom(40,.06,0,0,0,0,42);
  else if(i===2) camRoom(3.9,1.2,.6,0,.62,0,38);                                              // close on the one seat first
  else if(i===3) camRoom(70,.18,0,0,0,-2,42);
  else if(i===4){ V.seat=BEST; marker.position.set(BEST.x,BEST.y+1.3,BEST.z); camRoom(25,.82,-S.discA+.18,0,1.2,-3,46); marker.visible=true; }
  else if(i===9) camRoom(72,.2,0,0,0,0,42);
  else if(i===11){ const p=pol(stageAngle(2),15,2.2); camRoom(19,1.12,-S.discA+.55,p.x*.55,2.4,p.z*.55,40); }
  else if(i===12){ const a=S.discA, t=pol(a,7,2.4); camRoom(20.6,1.33,-a,t.x,t.y,t.z,70); }
  else if(i>=5&&i<=11){ if(V.mode!=='seat'||!V.seat) sit(V.seat||BEST); }
  else if(i===13){ fromStageView(); V.th=Math.PI-S.discA; }
  else if(i===14){ const e=pol(S.discA+Math.PI,9,0); camRoom(30,.62,Math.PI-S.discA,e.x*.35,STAGE_H+1.2,e.z*.35,50); viewTarget(); camFrom.copy(camTo); lookFrom.copy(lookTo); fovFrom=fovTo; V.blend=1; }   /* t22: high over the floor, the entrance stage ahead */
  const alive=()=>my===RUN&&TOUR.on; runStep(i,alive).then(async()=>{ if(!alive()) return; window.__stepDone=i; if(i===TSTEPS.length-1){ djStart(); return; } if(window.__render) return; await pause(i===13?.15:.9); if(alive()) $('#tNext').click(); }); }   // the tour plays itself; Back and Continue still step by hand
const pause=(s,alive)=>new Promise(r=>setTimeout(r,s*1000));
const CLUBSPOT={x:0,y:.95,z:4.2,psi:0};   /* t22: our place on the club floor (the crowd leaves it clear) */
async function runStep(i,alive){
  if(i===0){ await pause(.6); if(!alive()) return; await say(0,alive); }
  else if(i===1){ await say(1,alive); }
  else if(i===2){ $('#tText').textContent='Six hundred seats fold up out of the floor, row by row\u2026';   /* v21: no single seat: the house itself folds up, slowly enough to see how, close on the front rows first */
    camRoom(11,.62,-.35,0,.2,-6.5,40); TS.dropOn=true; FOLD.drop=0; snd('build'); tween(V,'r',27,7.5,1.6); tween(V,'ph',.9,7.5,1.6); tween(V.tgt,'y',-2.6,7.5,1.6); tween(V.tgt,'z',1.5,7.5,1.6);
    await pause(8.8); if(!alive()) return; const q=say(4,alive); await pause(.25); if(!alive()) return; tween(FOLD,'rake',1,4.5); snd('rake'); await q; await pause(.6); }   /* v24: original voice: the seats fold up under the caption, then his line; the rake starts on his word "rake" */
  else if(i===4){ await say(6,alive); if(window.__render&&alive()){ sit(BEST); EV('sit'); await pause(.4); tween(V,'yaw',.55,2.4); await pause(2.4); tween(V,'yaw',-.45,3.2); await pause(3.2); tween(V,'yaw',0,1.8); await pause(2); } }
  else if(i===3){ tween(RINGHL.material,'opacity',.85,1.6,.3); await say(5,alive); }
  else if(i===4){ await say(6,alive); }
  else if(i===5){ S.ledOn=false; const p=say(7,alive); await pause(1.4); if(!alive()) return; setGap(ONE_STAGE); EV('screens'); snd('rig'); await p; }
  else if(i===6){ const p=say(8,alive); await pause(.6); if(!alive()) return; tween(TS,'stUp',1,6); snd('build'); await p; }
  else if(i===7){ TS.pitch=0; tween(TS,'pitch',.72,2.2); const p=say(9,alive); await pause(.3); if(!alive()) return; tween(TS,'rigUp',1,5); snd('rig'); await p; if(!alive()) return; tween(TS,'pitch',0,1.6); await pause(1.7); }
  else if(i===8){ const p=say(10,alive); await pause(2.6); if(!alive()) return; hostMode('pip'); S.ledOn=true; S.fxAuto=true; face(3);   /* v21: in the corner while the room turns, never gone */ await p; if(!alive()) return; await pause(.8); if(!alive()) return; HOST.stage=3; hostMode('stage'); }
  else if(i===9){ tween(TEAMHL.material,'opacity',.9,1.4,.4); await say(11,alive); }
  else if(i===10){ const p=say(12,alive); await pause(3.2); if(!alive()) return; voteRun(); await pause(7.9); if(!alive()) return; hostMode('pip'); face(2); snd('rig'); await p; if(!alive()) return; await pause(1.6); if(!alive()) return; HOST.stage=2; hostMode('stage'); }
  else if(i===11){ tween(TS,'drift',1,14); await say(13,alive); }
  else if(i===12){ const p=say(14,alive); await pause(.5); if(!alive()) return; S.faceT=near(stageAngle(2)+TAU/8,S.discA); EV('turn'); await pause(.7); if(!alive()) return; setGap(180); EV('screens'); await pause(2.2); if(!alive()) return; if(!S.lift){ $('#lift').click(); EV('lift'); } await pause(1.4); if(!alive()) return; FXFIRE.t=performance.now()/1000; EV('fx'); await p; if(window.__render) await pause(2.5); }
  else if(i===13){ const p=say(15,alive); await pause(.05); if(!alive()) return; face(2); EV('turn'); setRoom('dinner'); EV('fold'); await pause(1.2); if(!alive()) return; setGap(ONE_STAGE); EV('screens'); await p; if(!window.__render){ let n=0; while(alive()&&n<16&&(FOLD.moving||FOLD.k<.999)){ await pause(.25); n++; } } if(window.__render){ let n=0; while(n<80&&(FOLD.moving||FOLD.k<.999)){ await pause(.25); n++; } await pause(1.2); } }
  else if(i===14){   /* t22: we land in the club facing the entrance stage, turn to the DJ, the floor goes down, the screens behind him open on the company working
                        every level of the stages under a low light show, and we push in on him as they open */
    TW.push({o:TS,k:'dark',from:null,to:0,dur:.9,t:0}); const p=say(16,alive); await pause(.5); if(!alive()) return;
    V.yaw=Math.PI; V.pitch=0; V.zoom=0; sit(CLUBSPOT,true); EV('land'); await pause(2.6); if(!alive()) return;
    tween(V,'yaw',0,3.4); EV('turnDJ'); await pause(3.6); if(!alive()) return;
    setRoom('pit'); EV('lift'); snd('rise'); await pause(1.1); if(!alive()) return;
    TS.cast=1; setGap(180); EV('screens'); snd('rig'); tween(V,'zoom',.6,7.5,.4); await pause(8.2); if(!alive()) return;
    await p; if(window.__render){ let n=0; while(n<80&&FOLD.moving){ await pause(.25); n++; } await pause(2.5); } } }
// ---- the app vote: a phone in the corner, the room's vote coming in live ----
const VOTE={teams:[['Team A','#f0c35a'],['Team B','#5aa8ff'],['Team C','#ff5ac8'],['Team D','#4fe0c0']],to:[19,24,38,19],t:0,on:false};
{ const box=$('#voteRows'); VOTE.rows=VOTE.teams.map(([n,c])=>{ const r=document.createElement('div'); r.className='vrow'; r.innerHTML='<span class="vn"></span><span class="vb"><i></i></span><span class="vp">0%</span>'; r.querySelector('.vn').textContent=n; r.querySelector('i').style.background=c; box.appendChild(r); return r; }); }
function voteRun(){ EV('vote'); VOTE.t=0; VOTE.on=true; $('#vote').hidden=true; $('#voteWin').hidden=true; drawVoteWall(0); S.footage='vote'; applyContent(screenMat,'vote',0,false); appStart();   /* t22: the same phone app as the film, and the same live count on the walls */ if(AU.ready&&S.sound) for(let j=0;j<6;j++) thud(600+j*90,.06,.05,j*.9); }
function voteUpdate(dt){ if(!VOTE.on) return; VOTE.t+=dt; const k=ease(clamp(VOTE.t/6,0,1)); VOTE.rows.forEach((r,j)=>{ const w=(25+(VOTE.to[j]-25)*k)+Math.sin(VOTE.t*3+j*2)*(1-k)*6; r.querySelector('i').style.width=w*2.2+'%'; r.querySelector('.vp').textContent=Math.round(w)+'%'; r.classList.toggle('win',k>=1&&j===2); });
  if(VOTE.t>6.3&&$('#voteWin').hidden){ $('#voteWin').hidden=false; EV('win'); if(AU.ready&&S.sound){ whoosh(1.2,.2); thud(80,1,.2); } } if(VOTE.t>7) VOTE.on=false; }
// ---- the four teams, one per stage, picked out from above ----
const TEAMHL=(()=>{ const c=document.createElement('canvas'); c.width=c.height=1024; const x=c.getContext('2d'), C=512, k=C/R_OUT, r0=R_DISC*k+2, r1=R_OUT*k-2; x.translate(C,C);
  VOTE.teams.forEach(([n,col],q)=>{ const a0=(q-.5)*Math.PI/2-Math.PI/2+.02, a1=(q+.5)*Math.PI/2-Math.PI/2-.02; x.fillStyle=col+'55'; x.strokeStyle=col; x.lineWidth=7; x.beginPath(); x.arc(0,0,r1,a0,a1); x.arc(0,0,r0,a1,a0,true); x.closePath(); x.fill(); x.stroke();
    const a=q*Math.PI/2, r=(r0+r1)/2; x.fillStyle='#fff'; x.font='700 44px system-ui,sans-serif'; x.textAlign='center'; x.textBaseline='middle'; x.save(); x.translate(Math.sin(a)*r,-Math.cos(a)*r); x.fillText(n.toUpperCase(),0,-14); x.font='500 28px system-ui,sans-serif'; x.fillStyle='rgba(255,255,255,.8)'; x.fillText('STAGE '+(q+1),0,26); x.restore(); });
  const m=new T.Mesh(new T.PlaneGeometry(R_OUT*2,R_OUT*2),new T.MeshBasicMaterial({map:new T.CanvasTexture(c),transparent:true,opacity:0,depthWrite:false})); m.rotation.x=-Math.PI/2; m.position.y=STAGE_H+.05; m.renderOrder=3; m.visible=false; scene.add(m); delete m.userData.cat; return m; })();
// a soft music bed under the host (an open A chord, slowly filtered), so the tour never plays in dead air
const PAD={g:null,nodes:[]};
function padOn(on){ if(!AU.ready||!AU.ctx) return; const c=AU.ctx, now=c.currentTime;
  if(on&&!PAD.g){ PAD.g=c.createGain(); PAD.g.gain.value=0; const f=c.createBiquadFilter(); f.type='lowpass'; f.frequency.value=700; f.Q.value=.4; const lfo=c.createOscillator(), lg=c.createGain(); lfo.frequency.value=.05; lg.gain.value=260; lfo.connect(lg); lg.connect(f.frequency); lfo.start();
    for(const [hz,dt] of [[110,-6],[110,5],[164.8,-4],[220,3],[277.2,-3],[329.6,4]]){ const o=c.createOscillator(); o.type='sawtooth'; o.frequency.value=hz; o.detune.value=dt; o.connect(f); o.start(); PAD.nodes.push(o); } PAD.nodes.push(lfo); f.connect(PAD.g); PAD.g.connect(AU.bus); }
  if(PAD.g) PAD.g.gain.setTargetAtTime(on?.028:0,now,on?1.5:.4);
  if(!on&&PAD.g){ const g=PAD.g, ns=PAD.nodes; PAD.g=null; PAD.nodes=[]; setTimeout(()=>{ for(const o of ns) try{ o.stop(); }catch(e){} try{ g.disconnect(); }catch(e){} },2500); } }
// short machine sounds for the build moments
function snd(k){ EV('snd',k); if(!AU.ready||!S.sound) return; if(k==='rise'){ whoosh(1.2,.18); } else if(k==='rake'){ thud(70,1.6,.18); hiss(2.5,.05,900); } else if(k==='build'){ for(let j=0;j<5;j++) thud(55+j*6,.9,.16,j*1.1); hiss(5,.05,700); } else if(k==='rig'){ whoosh(2.4,.16); thud(48,2.2,.14,.4); } }
function tourUpdate(dt){ if(!TOUR.on) return;
  for(let j=TW.length-1;j>=0;j--){ const w=TW[j]; w.t+=dt; if(w.t<0) continue; if(w.from===null) w.from=w.o[w.k]; const e=ease(clamp(w.t/w.dur,0,1)); w.o[w.k]=lerpA(w.from,w.to,e); if(w.k==='rake') FOLD.dirty=true; if(w.t>=w.dur) TW.splice(j,1); }
  if(TS.spin) S.faceT=S.discA+.5;
  for(const im of AUD.meshes) im.visible=false;
  { const on=TOUR.step>=1&&TOUR.step<=3||TOUR.step===9?1:0; const kk=TOUR.step===2?1.9:.85, ff=TOUR.step===2?.75:.3; TKEY.intensity+=clamp(on*kk-TKEY.intensity,-dt*6,dt*6); TFILL.intensity+=clamp(on*ff-TFILL.intensity,-dt*6,dt*6); TKEY.color.setHex(TOUR.step===2?0xffdcae:0xfff0dc); }   /* t22: as the seats come up the house lights are full on: warm and bright */
  if(MARKS.visible){ const o=MARKS.material; o.opacity+=clamp(TS.marks*(TOUR.step===2&&FOLD.drop>1.5?.15:.9)-o.opacity,-dt,dt); }
  if(tourSeat&&tourSeat.visible&&TOUR.step===2&&!TS.dropOn&&tourSeat.rotation.x<.01) tourSeat.rotation.y+=dt*.45; if(TOUR.step!==2&&TSPOT.intensity>0) TSPOT.intensity=0;
  if(TS.dropOn&&FOLD.drop!==null){ FOLD.drop+=dt*(FOLD.drop<1.2?.45:1); FOLD.dirty=true; let n=0; for(const d of DROPD) if(d+DROPF<=FOLD.drop) n++;                       // a soft thump as seats land
    if(n>TS.landed&&performance.now()-TS.thudT>45){ EV('land',n-TS.landed); } if(n>TS.landed&&AU.ready&&S.sound&&performance.now()-TS.thudT>45){ TS.thudT=performance.now(); thud(95+Math.random()*70,.16,Math.min(.16,.05+(n-TS.landed)*.012)); } TS.landed=n; if(FOLD.drop>Math.max(...DROPD)+DROPF+.2){ TS.dropOn=false; FOLD.drop=null; FOLD.dirty=true; } }
  else TS.landed=FOLD.drop===null?LAY.seats.length:0;
  for(const c of scene.children){ if(c.userData.scaleMan){ c.visible=false; continue; } const cat=c.userData.cat; if(cat!=='stages'&&cat!=='portals'&&cat!=='rig') continue; if(c.userData.by===undefined) c.userData.by=c.position.y;
    c.position.y=c.userData.by+(cat==='rig'?16*(1-ease(TS.rigUp)):-11*(1-ease(TS.stUp))); }
  if(TS.pitch!==null&&V.mode==='seat') V.pitch=TS.pitch; voteUpdate(dt); if(TOUR.step===11&&V.mode==='room') V.th=-S.discA+.55-.35*TS.drift; if(TOUR.step===12&&V.mode==='room'){ V.th=-S.discA; const t=pol(S.discA,7,2.4); V.tgt.copy(t); }
  if(TS.tag&&V.mode==='room'){ _bt.set(BEST.x,BEST.y+1.6,BEST.z).applyMatrix4(disc.matrixWorld).project(camera); const tg=$('#bestTag'); tg.hidden=_bt.z>1; tg.style.left=((_bt.x+1)/2*100)+'%'; tg.style.top=((1-_bt.y)/2*100)+'%'; } else $('#bestTag').hidden=true;
  if(APP.on&&!FILM.on) appUpdate(dt);
  { const c=renderer.domElement, d=clamp(TS.dark||0,0,1), f=d>.002?'brightness('+(1-d).toFixed(3)+')':''; if(c.style.filter!==f) c.style.filter=f; }
  if(HOST.mode==='full'||HOST.mode==='pip') hostDraw(); hostPlace(); }
function tourRestore(){ for(const c of scene.children){ if(c.userData.by!==undefined){ c.position.y=c.userData.by; } } }
function tourStart(){ if(TOUR.on) return; TOUR.on=true; TS.house0=!!S.house; document.body.classList.add('touring'); $('#tour').hidden=false; tourSaved=scene.children.map(c=>[c,c.visible]);
  const sOn=()=>{ $('#snd').setAttribute('aria-pressed',S.sound?'true':'false'); $('#snd-w').setAttribute('opacity',S.sound?'1':'.3'); padOn(true); }; if(!S.sound) setSound(true).then(sOn); else sOn();
  const dots=$('#tDots'); dots.innerHTML=''; TSTEPS.forEach(()=>dots.appendChild(document.createElement('i')));
  try{ if(location.hash!=='#tour') history.replaceState(null,'','#tour'); }catch(e){} tourGo(0); }
function tourEnd(){ if(!TOUR.on) return; TOUR.on=false; djStop(); padOn(false); if(APP.on&&!FILM.on) appStop(); TS.dark=0; TS.cast=0; renderer.domElement.style.filter=''; RUN++; hostStop(); hostMode('off'); TW.length=0; document.body.classList.remove('touring'); $('#tour').hidden=true; $('#bestTag').hidden=true;
  tourRestore(); TKEY.intensity=0; TFILL.intensity=0; RINGHL.visible=false; TEAMHL.visible=false; $('#vote').hidden=true; $('#rec').hidden=true; TOUR.cams=false; if(tourSaved) for(const [c,v] of tourSaved) if(c!==HOST.mesh) c.visible=v; tourSaved=null; MARKS.visible=false; if(tourSeat) tourSeat.visible=false;
  TOUR.show.front=true; FOLD.rake=1; FOLD.reveal=1; FOLD.drop=null; FOLD.dirty=true; TOUR.step=-1; S.ledOn=true; if(!!S.house!==TS.house0) $('#house').click();
  try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} if(S.room==='theatre'){ S.faceT=Math.round(S.discA/(TAU/4))*(TAU/4); setGap(ONE_STAGE); if(V.seat) sit(V.seat,true); } }
{ $('#tourBtn').addEventListener('click',tourStart); $('#tExit').addEventListener('click',tourEnd);
  $('#tNext').addEventListener('click',()=>{ if(TOUR.step===4&&V.mode!=='seat') sit(V.seat||BEST); if(TOUR.step>=TSTEPS.length-1) tourEnd(); else tourGo(TOUR.step+1); });
  $('#tBack').addEventListener('click',()=>tourGo(TOUR.step-1));
  window.addEventListener('keydown',e=>{ if(!TOUR.on) return; if(e.key==='ArrowRight') $('#tNext').click(); if(e.key==='ArrowLeft') $('#tBack').click(); if(e.key==='Escape') tourEnd(); });
  window.addEventListener('hashchange',()=>{ if(location.hash==='#tour') tourStart(); }); }
// ---- the tour ends in the club: the host takes the booth as the DJ, and the room is yours with four buttons ----
const DJ={on:false};
function djStart(){ if(DJ.on||!TOUR.on) return; DJ.on=true; HOST.dj=false; $('#tour').hidden=true; $('#djCtl').hidden=false; document.body.classList.add('djmode');
  hostStop(); hostMode('off'); djLabels(); }   /* t22: the DJ at the decks dances to his own bought moves; the host no longer stands in for him on a loop, and the shot stays where the push-in ended */
function djStop(){ if(!DJ.on) return; DJ.on=false; HOST.dj=false; HOST.el.ontimeupdate=null; $('#djCtl').hidden=true; document.body.classList.remove('djmode'); }
function djLabels(){ $('#djScr span').textContent=S.gapT>Math.PI/2?'Close screens':'Open screens'; $('#djFloor span').textContent=S.room==='pit'?'Raise floor':'Lower floor'; }
{ $('#djL').addEventListener('click',()=>{ S.faceT=S.faceT-TAU/8; EV('turn'); }); $('#djR').addEventListener('click',()=>{ S.faceT=S.faceT+TAU/8; EV('turn'); });
  $('#djScr').addEventListener('click',()=>{ setGap(S.gapT>Math.PI/2?0:180); EV('screens'); djLabels(); });
  $('#djFloor').addEventListener('click',()=>{ setRoom(S.room==='pit'?'club':'pit'); djLabels(); });
  $('#djX').addEventListener('click',()=>{ tourEnd(); if(typeof chooseShow==='function') chooseShow(); }); }
window.__tour={VOTE,voteRun,TS,HOST,PAD,tourGo,DJ,djStart};

// ================= THE SHOW: one night in the room, as its own demo =================
// It opens with the house as the audience would find it: house lights up, the two screens closed on the house look (BARCELONA across the wall),
// the seats empty, every control hidden. Look around, then Next. From there it plays on its own: the house goes to black and the audience fades in,
// the screens open in gold particles to 89 degrees on Stage 1, the stage lights come up, the effects fire and a performer rides the presenter lift up;
// the screens go black. The room turns to Stage 2 and plays, turns to Stage 3 while the screens open all the way, on to Stage 4, and back round to
// Stage 1, where the screens close on the house look and the house lights come up; stage light and haze go to zero, the audience stays.
// The view then moves to the front of Stage 1, in front of the screens, looking back at the seats, and the room changes: dinner theatre, then the
// late-night club with the DJ on the flat floor, then with the floor sunk.
// For notes while it is being designed: a show clock that can be paused, a jump to any part, and notes saved at a time with the room's settings.
const SHOWD={on:false,run:0,phase:'',saved:null,perf:null,aud:0,audT:0,hazeT:null,gapTw:null,music:null,seat:null,clock:0,paused:false,held:null,part:-1,db:null,notes:[],uid:null};
const sq=k=>$(k);
function showSeat(){ if(SHOWD.seat) return SHOWD.seat; let mx=0; for(const s of LAY.seats) mx=Math.max(mx,s.row||0); const row=Math.round(mx*.55); let b=null;
  for(const s of LAY.seats) if((s.row||0)===row&&(!b||Math.abs(s.x)<Math.abs(b.x))) b=s; return SHOWD.seat=b||LAY.seats[0]; }
function showCard(step,title,text,next){ sq('#sStep').textContent=step; sq('#sTitle').textContent=title; sq('#sText').textContent=text; sq('#sNext').hidden=!next; if(next) sq('#sNext').textContent=next; }
const sTxt=t=>{ sq('#sText').textContent=t; };
function showFoot(id){ if(S.footage!==id&&!S.club){ S.footage=id; setFootage(); } }
function houseTo(on){ if(!!S.house!==on) sq('#house').click(); }
function liftTo(on){ if(!!S.lift!==on) sq('#lift').click(); }
const fmtT=t=>{ t=Math.max(0,t); const m=Math.floor(t/60), s=Math.floor(t%60); return String(m).padStart(2,'0')+':'+String(s).padStart(2,'0'); };
// the performer who rides the Stage 1 presenter lift: a copy of the stage's standing figure, set on the lift platform
function showPerformer(on){ if(on&&!SHOWD.perf){ const src=scene.children.find(c=>c.userData.scaleMan); const L=ST[0]&&ST[0].lifts&&ST[0].lifts[0]; if(!src||!L) return;
    const m=new T.Mesh(src.geometry,src.material); m.scale.copy(src.scale); m.position.set(0,0,0); m.rotation.y=0; m.castShadow=true; L.g.add(m); SHOWD.perf=m; shadowsDirty(); }
  if(SHOWD.perf) SHOWD.perf.visible=on;
  for(const c of scene.children) if(c.userData.scaleMan){ const a=Math.atan2(c.position.x,-c.position.z); if(Math.abs(wrapA(a-stageAngle(0)))<.3) c.visible=!on; } }
// a music bed for the show: kick, bass and hats at 118 bpm, built in the browser
function showMusic(on){ if(!AU.ready||!AU.ctx) return; const c=AU.ctx;
  if(on&&!SHOWD.music){ const g=c.createGain(); g.gain.value=0; g.connect(AU.bus); const M={g,next:c.currentTime+.1,step:0}; SHOWD.music=M; g.gain.setTargetAtTime(.5,c.currentTime,1.2);
    const noise=c.createBuffer(1,c.sampleRate*.2,c.sampleRate); { const d=noise.getChannelData(0); for(let i=0;i<d.length;i++) d[i]=(Math.random()*2-1)*Math.pow(1-i/d.length,3); }
    const bass=[55,55,65.4,49];
    M.iv=setInterval(()=>{ if(SHOWD.paused){ M.next=c.currentTime+.1; return; } const sp=60/118/4; while(M.next<c.currentTime+.25){ const t=M.next, s=M.step%16, bar=Math.floor(M.step/16)%4;
        if(s%4===0){ const o=c.createOscillator(), e=c.createGain(); o.frequency.setValueAtTime(140,t); o.frequency.exponentialRampToValueAtTime(42,t+.18); e.gain.setValueAtTime(.9,t); e.gain.exponentialRampToValueAtTime(.001,t+.32); o.connect(e); e.connect(g); o.start(t); o.stop(t+.35); }
        if(s%4===2){ const b=c.createBufferSource(), f=c.createBiquadFilter(), e=c.createGain(); b.buffer=noise; f.type='highpass'; f.frequency.value=7000; e.gain.value=.16; b.connect(f); f.connect(e); e.connect(g); b.start(t); }
        if(s%2===0){ const o=c.createOscillator(), f=c.createBiquadFilter(), e=c.createGain(); o.type='sawtooth'; o.frequency.value=bass[bar]*(s%8===6?2:1); f.type='lowpass'; f.frequency.value=380; e.gain.setValueAtTime(.0001,t); e.gain.exponentialRampToValueAtTime(.16,t+.01); e.gain.exponentialRampToValueAtTime(.0001,t+sp*1.8); o.connect(f); f.connect(e); e.connect(g); o.start(t); o.stop(t+sp*2); }
        if(s===0&&bar===0){ const b=c.createBufferSource(), f=c.createBiquadFilter(), e=c.createGain(); b.buffer=noise; f.type='bandpass'; f.frequency.value=2400; e.gain.value=.25; b.connect(f); f.connect(e); e.connect(g); b.start(t); }
        M.next+=sp; M.step++; } },60); }
  if(!on&&SHOWD.music){ const M=SHOWD.music; SHOWD.music=null; M.g.gain.setTargetAtTime(0,c.currentTime,.6); setTimeout(()=>{ clearInterval(M.iv); try{ M.g.disconnect(); }catch(e){} },2500); } }
// waits run on the show clock, so a pause holds the whole sequence
const alive=my=>my===SHOWD.run&&SHOWD.on;
function swait(s,my){ const end=SHOWD.clock+s; return new Promise(r=>{ const tick=()=>{ if(!alive(my)) return r(false); if(SHOWD.clock>=end) return r(true); setTimeout(tick,50); }; tick(); }); }
async function untilStill(my,max){ let n=0; while(n++<(max||160)){ if(!(await swait(.25,my))) return false; if(Math.abs(S.faceT-S.discA)<.002&&Math.abs(MOVE.vt)<.01) return true; } return alive(my); }
async function untilFolded(my){ let n=0; while(n++<160){ if(!(await swait(.25,my))) return false; if(!FOLD.moving&&Math.abs(FOLD.k-(S.room==='theatre'?0:1))<.002) return true; } return alive(my); }
function turnNext(){ S.faceT=Math.round(S.discA/(TAU/4))*(TAU/4)+TAU/4; }                       // always onward, round the ring
function faceNow(k){ S.faceT=S.discA=Math.round(S.discA/TAU)*TAU+k*TAU/4; MOVE.vt=0; }
function sGapNow(deg){ setGap(deg); S.gap=S.gapT; MOVE.vs=0; SHOWD.gapTw=null; }
function gapTween(deg,dur){ SHOWD.gapTw={from:S.gapT,to:clamp(deg,0,180)*D2R,t:0,dur,ft0:FILM.on?FILM.t:null}; }
function audNow(k){ SHOWD.aud=SHOWD.audT=k; }
// ---- the parts: each sets its starting state outright (so a jump lands clean), then plays ----
const SPARTS=[
  {name:'House lights down',set(){ jumpRoom('theatre'); houseTo(true); audNow(0); sGapNow(0); faceNow(0); showFoot('house'); S.look='dark'; S.ledOn=false; S.fxAuto=false; S.haze=0; SHOWD.hazeT=null; liftTo(false); showPerformer(false); },
   async run(my){ houseTo(false); SHOWD.audT=1; SHOWD.hazeT=.55; S.look='mid'; showMusic(true); sTxt('House lights down.'); if(!(await swait(2.6,my))) return false;
     showFoot('v-gold'); gapTween(89,4.5); sTxt('The screens open on Stage 1.'); if(!(await swait(2.2,my))) return false; S.ledOn=true; S.look='bright'; return swait(2.4,my); }},
  {name:'Stage 1',set(){ jumpRoom('theatre'); houseTo(false); audNow(1); S.haze=.55; SHOWD.hazeT=null; sGapNow(89); faceNow(0); showFoot('v-gold'); S.look='bright'; S.ledOn=true; showMusic(true); },
   async run(my){ S.fxAuto=true; FXFIRE.t=performance.now()/1000; showPerformer(true); liftTo(true); sTxt('Effects, and the presenter lift.'); if(!(await swait(6,my))) return false;
     showFoot('off'); sTxt('The screens go black: the stage is the show.'); if(!(await swait(4,my))) return false; liftTo(false); if(!(await swait(2.5,my))) return false; showPerformer(false); return true; }},
  {name:'Stage 2',set(){ jumpRoom('theatre'); houseTo(false); audNow(1); S.haze=.55; sGapNow(89); faceNow(0); showFoot('off'); S.look='bright'; S.ledOn=true; S.fxAuto=true; liftTo(false); showPerformer(false); showMusic(true); },
   async run(my){ turnNext(); sTxt('The audience turns to Stage 2.'); if(!(await untilStill(my))) return false; FXFIRE.t=performance.now()/1000; return swait(6,my); }},
  {name:'Stage 3',set(){ jumpRoom('theatre'); houseTo(false); audNow(1); S.haze=.55; sGapNow(89); faceNow(1); showFoot('off'); S.look='bright'; S.ledOn=true; S.fxAuto=true; showMusic(true); },
   async run(my){ turnNext(); sTxt('On to Stage 3, the screens opening all the way.'); gapTween(180,12); if(!(await untilStill(my))) return false; return swait(3,my); }},
  {name:'Stage 4',set(){ jumpRoom('theatre'); houseTo(false); audNow(1); S.haze=.55; sGapNow(180); faceNow(2); showFoot('off'); S.look='bright'; S.ledOn=true; S.fxAuto=true; showMusic(true); },
   async run(my){ turnNext(); sTxt('Stage 4.'); if(!(await untilStill(my))) return false; FXFIRE.t=performance.now()/1000; return swait(4,my); }},
  {name:'Close',set(){ jumpRoom('theatre'); houseTo(false); audNow(1); S.haze=.55; sGapNow(180); faceNow(3); showFoot('off'); S.look='bright'; S.ledOn=true; S.fxAuto=true; showMusic(true); },
   async run(my){ turnNext(); sTxt('Back to Stage 1; the screens close.'); if(!(await swait(2.5,my))) return false; gapTween(0,7); if(!(await untilStill(my))) return false;
     let n=0; while(S.gap>.01&&n++<80){ if(!(await swait(.25,my))) return false; } showFoot('house');
     S.fxAuto=false; S.ledOn=false; S.look='dark'; SHOWD.hazeT=0; houseTo(true); showMusic(false); sTxt('House lights up.'); return swait(4,my); }},
  {name:'Dinner theatre',set(){ jumpRoom('theatre'); houseTo(true); audNow(1); S.haze=0; SHOWD.hazeT=null; sGapNow(0); faceNow(0); showFoot('house'); S.look='dark'; S.ledOn=false; S.fxAuto=false; showMusic(false); },
   async run(my){ sq('#sTitle').textContent='One room, every night'; sTxt('The view from the front of Stage 1.'); fromStageView(); V.th=Math.PI-S.discA; if(!(await swait(3,my))) return false; TOUR.fast=true;
     sq('#sTitle').textContent='Dinner theatre'; sTxt('The seats fold into the floor and the dinner tables come up.'); setRoom('dinner'); if(!(await untilFolded(my))) return false; return swait(4,my); }},
  {name:'Late night',set(){ jumpRoom('dinner'); FOLD.k=1; FOLD.dirty=true; houseTo(true); sGapNow(0); faceNow(0); fromStageView(); V.th=Math.PI-S.discA; TOUR.fast=true; },
   async run(my){ sq('#sTitle').textContent='Late night'; sTxt('Cultural late-night programming: the DJ on the flat floor.'); houseTo(false); setRoom('club'); showMusic(true); if(!(await untilFolded(my))) return false; return swait(5,my); }},
  {name:'Sunken floor',set(){ jumpRoom('club'); houseTo(false); FOLD.k=1; FOLD.h=ROOMS.club.lift; FOLD.dirty=true; sGapNow(0); faceNow(0); fromStageView(); V.th=Math.PI-S.discA; TOUR.fast=true; showMusic(true); },
   async run(my){ sq('#sTitle').textContent='Late night'; sTxt('The same night with the floor sunk.'); setRoom('pit'); if(!(await untilFolded(my))) return false; return swait(5,my); }}];
function partsUI(){ const box=sq('#sParts'); if(box.children.length) return; SPARTS.forEach((p,i)=>{ const b=document.createElement('button'); b.textContent=p.name; b.addEventListener('click',()=>showRun(i)); box.appendChild(b); }); }
function markPart(i){ SHOWD.part=i; [...sq('#sParts').children].forEach((b,k)=>b.classList.toggle('on',k===i)); }
// the house as the audience finds it
function showOpen(){ ++SHOWD.run; TOUR.fast=false; SHOWD.paused=false; SHOWD.clock=0; markPart(-1); SPARTS[0].set(); sit(showSeat()); showMusic(false);
  showCard('Show','Reverse Arena · Barcelona','Have a look around: drag to look, scroll to move closer. Press Next when you’re ready.','Next'); sq('#sAgain').hidden=true; sq('#sPause').textContent='Pause'; sq('#sPause').hidden=true; SHOWD.phase='house'; }   /* QA: Pause did nothing before the show runs */
async function showRun(from){ from=from||0; const my=++SHOWD.run; SHOWD.phase='run'; SHOWD.paused=false; sq('#sPause').textContent='Pause'; sq('#sPause').hidden=false; showCard('Show','Tonight','',null); sq('#sAgain').hidden=true;
  if(from>0){ SPARTS[from].set(); if(from<6&&V.mode!=='seat') sit(showSeat()); SHOWD.clock=SHOWD.partT?SHOWD.partT[from]||SHOWD.clock:SHOWD.clock; } else SHOWD.clock=0;
  SHOWD.partT=SHOWD.partT||[];
  for(let i=from;i<SPARTS.length;i++){ if(!alive(my)) return; markPart(i); SHOWD.partT[i]=SHOWD.clock; if(i>=6) showCard('After the show','One room, every night','',null);
    const ok=await SPARTS[i].run(my); if(!ok||!alive(my)) return; }
  showMusic(false); TOUR.fast=false; SHOWD.phase='end'; sq('#sPause').hidden=true; markPart(-1); showCard('Show','That was one night','Watch it again, or explore the room yourself.','Explore the room'); sq('#sAgain').hidden=false; }
// pause holds the clock, the turn and the screens where they are
function showPause(p){ if(SHOWD.phase!=='run') return; if(p===SHOWD.paused) return; SHOWD.paused=p; sq('#sPause').textContent=p?'Play':'Pause';
  if(p){ SHOWD.held={faceT:S.faceT,gapT:S.gapT}; S.faceT=S.discA; S.gapT=S.gap; MOVE.vt=0; MOVE.vs=0; } else if(SHOWD.held){ S.faceT=SHOWD.held.faceT; S.gapT=SHOWD.held.gapT; SHOWD.held=null; } }
// ---- notes: a time, the part, what to change, and the room's settings at that moment ----
function roomState(){ const r=x=>Math.round(x*1000)/1000; return {room:S.room,facingDeg:Math.round(((S.discA/D2R)%360+360)%360),screensOpenDeg:Math.round(S.gap/D2R),screens:S.footage,stageLED:!!S.ledOn,lights:S.look,effects:!!S.fxAuto,haze:r(S.haze),houseLights:!!S.house,lifts:!!S.lift,
  view:{mode:V.mode,r:r(V.r),ph:r(V.ph),th:r(V.th),fov:r(V.fov||0),yaw:r(V.yaw||0),pitch:r(V.pitch||0),seatRow:V.seat?V.seat.row:null}}; }
function noteOpen(){ showPause(true); sq('#sNote').hidden=false; sq('#sNoteMsg').textContent='At '+fmtT(SHOWD.clock)+(SHOWD.part>=0?' · '+SPARTS[SHOWD.part].name:''); sq('#sNoteText').focus(); }
function noteClose(){ sq('#sNote').hidden=true; sq('#sNoteText').value=''; sq('#sCtl').checked=false; document.body.classList.remove('showctl'); const S_=document.getElementById('show'); if(S_) S_.style.bottom=''; }
async function noteSave(){ const text=sq('#sNoteText').value.trim(); const n={t:Math.round(SHOWD.clock*10)/10,time:fmtT(SHOWD.clock),part:SHOWD.part>=0?SPARTS[SHOWD.part].name:'House',text,settings:roomState(),created:Date.now()};
  if(SHOWD.db){ try{ await SHOWD.db.collection('shownotes').add(n); sq('#sNoteMsg').textContent='Saved.'; noteClose(); }catch(e){ sq('#sNoteMsg').textContent='This note could not be saved here.'; } }
  else { SHOWD.notes.push(Object.assign({id:'local'+Date.now()},n)); renderNotes(); sq('#sNoteMsg').textContent='Kept on this screen only: saving is not available here.'; noteClose(); } }
function renderNotes(){ const box=sq('#sNotes'); box.innerHTML=''; for(const n of SHOWD.notes.slice().sort((a,b)=>a.t-b.t)){ const d=document.createElement('div'); const b=document.createElement('b'); b.textContent=n.time||fmtT(n.t||0);
    const s=document.createElement('span'); s.textContent=(n.part?n.part+': ':'')+(n.text||'(settings only)'); const x=document.createElement('button'); x.textContent='×'; x.setAttribute('aria-label','Delete note');
    x.addEventListener('click',async()=>{ if(SHOWD.db&&!String(n.id).startsWith('local')){ try{ await SHOWD.db.doc('shownotes/'+n.id).delete(); }catch(e){} } else { SHOWD.notes=SHOWD.notes.filter(q=>q!==n); renderNotes(); } });
    d.appendChild(b); d.appendChild(s); d.appendChild(x); box.appendChild(d); } }
function notesConnect(){ if(SHOWD.dbTried) return; SHOWD.dbTried=true; if(!window.claude||!window.claude.use) return;
  window.claude.use('db').then(db=>{ if(!db) return; SHOWD.db=db; db.collection('shownotes').onSnapshot(snap=>{ SHOWD.notes=snap.docs.map(d=>Object.assign({id:d.id},d.data())); renderNotes(); },()=>{}); }).catch(()=>{}); }
function showStart(){ if(SHOWD.on) return; if(TOUR.on) tourEnd(); SHOWD.on=true; SHOWD.saved={house:!!S.house,haze:S.haze,look:S.look,footage:S.footage,gap:S.gapT,led:S.ledOn,fx:S.fxAuto,seat:V.seat,people:S.people};
  document.body.classList.add('showing'); sq('#show').hidden=false; if(!S.people) setPeople(true); partsUI(); notesConnect();
  const sOn=()=>{ sq('#snd').setAttribute('aria-pressed',S.sound?'true':'false'); sq('#snd-w').setAttribute('opacity',S.sound?'1':'.3'); }; if(!S.sound) setSound(true).then(sOn); else sOn();
  try{ if(location.hash!=='#show') history.replaceState(null,'','#show'); }catch(e){} showOpen(); }
function showEnd(){ if(!SHOWD.on) return; SHOWD.on=false; SHOWD.run++; SHOWD.paused=false; showMusic(false); TOUR.fast=false; noteClose(); document.body.classList.remove('showing','showmin'); sq('#show').hidden=true; showPerformer(false); liftTo(false);
  for(const im of AUD.meshes){ im.material.opacity=1; im.material.transparent=false; im.visible=S.people; }
  const v=SHOWD.saved||{}; if(S.room!=='theatre') setRoom('theatre'); houseTo(!!v.house); S.haze=v.haze!==undefined?v.haze:.55; S.look=v.look||'mid'; S.ledOn=v.led!==false; S.fxAuto=v.fx!==false;
  S.footage=v.footage&&v.footage!=='house'?v.footage:'v-gold'; setFootage(); setGap(ONE_STAGE); S.faceT=Math.round(S.discA/(TAU/4))*(TAU/4); SHOWD.hazeT=null; SHOWD.gapTw=null; syncControls();
  if(v.seat) sit(v.seat,true); try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} }
function showUpdate(dt){ if(!SHOWD.on) return;
  if(SHOWD.phase==='run'&&!SHOWD.paused) SHOWD.clock+=dt; sq('#sTime').textContent=fmtT(SHOWD.clock);
  if(SHOWD.paused){ S.faceT=S.discA; S.gapT=S.gap; return; }
  // the audience: hidden for the house, faded in when the show starts
  SHOWD.aud+=clamp(SHOWD.audT-SHOWD.aud,-dt/3,dt/3);
  if((SHOWD.phase==='house'||SHOWD.phase==='run')&&S.room==='theatre') for(const im of AUD.meshes){ const k=SHOWD.aud; im.visible=k>.01; if(k<.999){ im.material.transparent=true; im.material.opacity=k; } else { im.material.transparent=false; im.material.opacity=1; } }
  if(SHOWD.hazeT!==null){ S.haze+=clamp(SHOWD.hazeT-S.haze,-dt/5,dt/5); }
  const g=SHOWD.gapTw; if(g){ g.t+=dt; const e=ease(clamp(g.t/g.dur,0,1)); S.gapT=g.from+(g.to-g.from)*e; if(g.t>=g.dur) SHOWD.gapTw=null; } }
{ sq('#showBtn').addEventListener('click',showStart); sq('#sExit').addEventListener('click',showEnd);
  sq('#sNext').addEventListener('click',()=>{ if(SHOWD.phase==='house') showRun(0); else if(SHOWD.phase==='end') showEnd(); });
  sq('#sAgain').addEventListener('click',()=>{ showOpen(); });
  sq('#sPause').addEventListener('click',()=>showPause(!SHOWD.paused));
  sq('#sNoteBtn').addEventListener('click',noteOpen); sq('#sNoteX').addEventListener('click',()=>{ noteClose(); sq('#sNoteMsg').textContent=''; }); sq('#sNoteSave').addEventListener('click',noteSave);
  const showLift=()=>{ const S_=document.getElementById('show'); if(!S_) return; if(document.body.classList.contains('showctl')&&innerWidth>700&&innerHeight>700){ const w=document.querySelector('.wrap'), R=document.getElementById('room')||document.body; const h=w?Math.round(R.getBoundingClientRect().bottom-w.getBoundingClientRect().top):0; S_.style.bottom=(h>0?h+6:0)+'px'; const pl=document.querySelector('.pills'), c=S_.querySelector('.tcard')||S_; if(pl&&c){ const over=pl.getBoundingClientRect().bottom+8-c.getBoundingClientRect().top; if(over>0) S_.style.bottom=Math.max(0,h+6-over)+'px'; } } else S_.style.bottom=''; };
  sq('#sCtl').addEventListener('change',e=>{ document.body.classList.toggle('showctl',e.target.checked); requestAnimationFrame(showLift); }); addEventListener('resize',showLift);
  window.addEventListener('keydown',e=>{ if(!SHOWD.on) return; if(e.target&&(e.target.tagName==='TEXTAREA'||e.target.tagName==='INPUT')) return; if(e.key==='Escape') showEnd(); if(e.key==='h'||e.key==='H') sq('#sMin').click(); if(e.key===' '){ e.preventDefault(); showPause(!SHOWD.paused); } if(e.key==='ArrowRight'&&!sq('#sNext').hidden) sq('#sNext').click(); });
  sq('#sMin').addEventListener('click',()=>{ document.body.classList.toggle('showmin'); sq('#sMin').innerHTML=document.body.classList.contains('showmin')?'+':'&#8211;'; });
  window.addEventListener('hashchange',()=>{ if(location.hash==='#show') showStart(); });
  if(location.hash==='#show') setTimeout(showStart,600); }
window.__show={SHOWD,showStart,showEnd,showRun,showPause,SPARTS};

// ================= THE APP: a phone running the Reverse Arena app, for the vote in the film =================
// Drawn in the page as a real phone: status bar, the app's header, the live show, the four teams of the Imperio School with the
// live vote, a tap on one team, the result. Every frame is set from the film clock, so it renders exactly frame by frame.
const APP={el:null,t:-1,on:false,pick:2,to:[19,24,38,19]};
const APP_CSS=`
#rapp{position:absolute;right:4.2vw;top:50%;height:84vh;aspect-ratio:9/19.5;transform:translateY(-50%);z-index:8;pointer-events:none;font-family:Outfit,"Helvetica Neue",Arial,sans-serif;color:#f3ede2}
#rapp .body{position:absolute;inset:0;border-radius:6.2vh;background:linear-gradient(135deg,#6b6872,#2b2930 22%,#4a4750 50%,#1d1c21 78%,#5d5a63);padding:.55vh;box-shadow:0 3vh 8vh #000d,0 0 0 .12vh #000}
#rapp .btn{position:absolute;width:.45vh;border-radius:.3vh;background:#3a3840} #rapp .b1{left:-.35vh;top:15%;height:4%} #rapp .b2{left:-.35vh;top:22%;height:7%} #rapp .b3{left:-.35vh;top:30.5%;height:7%} #rapp .b4{right:-.35vh;top:24%;height:10%}
#rapp .scr{position:absolute;inset:.55vh;border-radius:5.7vh;overflow:hidden;background:radial-gradient(120% 60% at 50% 0%,#2a2016 0%,#100d12 45%,#09080b 100%);display:flex;flex-direction:column}
#rapp .island{position:absolute;left:50%;top:1.1vh;width:30%;height:3.1vh;border-radius:2vh;background:#000;transform:translateX(-50%);z-index:3}
#rapp .sb{display:flex;justify-content:space-between;align-items:center;padding:1.5vh 3.4vh 0 3.6vh;height:5vh;font-weight:600;font-size:1.55vh;letter-spacing:.02em}
#rapp .sb svg{height:1.3vh;fill:#f3ede2} #rapp .sb .ic{display:flex;gap:.6vh;align-items:center}
#rapp .hd{padding:1.2vh 2.2vh .6vh;display:flex;align-items:center;gap:1.1vh}
#rapp .logo{width:3.9vh;height:3.9vh;border-radius:1.1vh;background:conic-gradient(from 200deg,#f2b544,#3d7bff,#e8302e,#9a4dff,#f2b544);display:grid;place-items:center}
#rapp .logo i{display:block;width:62%;height:62%;border-radius:50%;background:#0b0a0d;box-shadow:inset 0 0 0 .35vh #f3d28c}
#rapp .ttl{display:flex;flex-direction:column;line-height:1.1} #rapp .ttl b{font-family:Marcellus,Georgia,serif;font-weight:400;font-size:1.75vh;letter-spacing:.18em} #rapp .ttl span{font-size:1.15vh;color:#b4ab9e;letter-spacing:.06em;margin-top:.3vh}
#rapp .live{margin:.6vh 2.2vh 0;display:flex;justify-content:space-between;align-items:center;font-size:1.2vh;color:#b4ab9e}
#rapp .live b{display:inline-flex;align-items:center;gap:.6vh;background:#e8302e;color:#fff;border-radius:.6vh;padding:.35vh .8vh;font-size:1.1vh;letter-spacing:.12em}
#rapp .live b i{width:.7vh;height:.7vh;border-radius:50%;background:#fff;display:block}
#rapp .q{margin:1.6vh 2.2vh .4vh;display:flex;align-items:center;justify-content:space-between;gap:1vh}
#rapp .q h3{margin:0;font-family:"Playfair Display",Georgia,serif;font-weight:500;font-size:2.3vh;line-height:1.15}
#rapp .ring{width:5.4vh;height:5.4vh;flex:none;border-radius:50%;display:grid;place-items:center;font-size:1.35vh;font-weight:600;background:conic-gradient(#f2b544 var(--p),#ffffff18 0)}
#rapp .ring span{width:4.4vh;height:4.4vh;border-radius:50%;background:#110e12;display:grid;place-items:center}
#rapp .sub{margin:0 2.2vh 1.2vh;font-size:1.2vh;color:#b4ab9e}
#rapp .cyv{margin:1vh 2.2vh 0;white-space:nowrap;font-family:Outfit,"Helvetica Neue",Arial,sans-serif;font-weight:800;font-size:3.55vh;line-height:1;letter-spacing:.005em;text-transform:uppercase;color:#fff;text-shadow:0 0 2.2vh #f2b54455}
#rapp .lv{margin:1vh 2.2vh .4vh;display:flex;align-items:center;justify-content:space-between;gap:1.4vh}
#rapp .live2{display:inline-flex;align-items:center;gap:1vh;background:#e8302e;color:#fff;border-radius:1.2vh;padding:.8vh 1.6vh;font-size:2.6vh;font-weight:800;letter-spacing:.14em;box-shadow:0 0 2.6vh #e8302e88}
#rapp .live2 i{width:1.6vh;height:1.6vh;border-radius:50%;background:#fff;display:block;box-shadow:0 0 1vh #fff}
#rapp .lv .ring{width:7.6vh;height:7.6vh;background:conic-gradient(#f2b544 var(--p),#ffffff22 0)}
#rapp .lv .ring span{width:6.3vh;height:6.3vh;font-size:2.8vh;font-weight:700;font-variant-numeric:tabular-nums;color:#fff}
#rapp .meta{margin:0 2.2vh .6vh;font-size:1.15vh;color:#b4ab9e;letter-spacing:.04em}
#rapp .teams{margin:0 1.6vh;display:grid;gap:1vh}
#rapp .tm{position:relative;display:grid;grid-template-columns:5.2vh 1fr auto;gap:1.1vh;align-items:center;padding:1vh 1.2vh;border-radius:1.6vh;background:#ffffff0c;border:.18vh solid #ffffff12;overflow:hidden}
#rapp .tm .av{width:5.2vh;height:5.2vh;border-radius:1.2vh;display:grid;place-items:end center;overflow:hidden}
#rapp .tm .av svg{width:80%;fill:#0b0a0d;opacity:.85}
#rapp .tm .nm{display:flex;flex-direction:column;gap:.35vh;min-width:0} #rapp .tm .nm b{font-size:1.6vh;font-weight:600} #rapp .tm .nm span{font-size:1.05vh;color:#b4ab9e;letter-spacing:.08em;text-transform:uppercase}
#rapp .tm .bar{height:.75vh;border-radius:.5vh;background:#ffffff14;overflow:hidden;margin-top:.3vh} #rapp .tm .bar i{display:block;height:100%;border-radius:.5vh}
#rapp .tm .pc{font-size:1.75vh;font-weight:600;font-variant-numeric:tabular-nums;text-align:right;min-width:4.6vh}
#rapp .tm .vt{position:absolute;right:1.1vh;top:.7vh;font-size:1vh;letter-spacing:.12em;text-transform:uppercase;font-weight:600;padding:.25vh .7vh;border-radius:.5vh}
#rapp .tm.mine{border-color:var(--c);background:linear-gradient(90deg,color-mix(in srgb,var(--c) 22%,transparent),#ffffff08)}
#rapp .tap{position:absolute;width:6vh;height:6vh;border-radius:50%;border:.3vh solid #fff;pointer-events:none;opacity:0;transform:translate(-50%,-50%)}
#rapp .chips{margin:1.4vh 1.6vh 0;display:flex;gap:.8vh} #rapp .chip{flex:1;border-radius:1.2vh;background:#ffffff0c;border:.15vh solid #ffffff12;padding:.9vh 1vh;font-size:1.1vh;color:#d8cfc2;line-height:1.25} #rapp .chip b{display:block;color:#f3d28c;font-size:1.25vh;margin-bottom:.2vh}
#rapp .win{position:absolute;left:1.6vh;right:1.6vh;bottom:10.6vh;border-radius:1.8vh;padding:1.5vh 1.6vh;background:linear-gradient(135deg,#e8302e,#8f1414);box-shadow:0 1vh 4vh #e8302e66;opacity:0}
#rapp .win small{display:block;font-size:1.05vh;letter-spacing:.18em;text-transform:uppercase;opacity:.85} #rapp .win b{display:block;font-family:"Playfair Display",Georgia,serif;font-weight:500;font-size:2.2vh;margin-top:.4vh} #rapp .win span{font-size:1.2vh;opacity:.9}
#rapp .tabs{position:absolute;left:0;right:0;bottom:0;height:8.4vh;padding:1vh 2vh 2.2vh;display:grid;grid-template-columns:repeat(5,1fr);background:#0b0a0dee;border-top:.12vh solid #ffffff14}
#rapp .tabs div{display:flex;flex-direction:column;align-items:center;gap:.4vh;font-size:.95vh;color:#8d857a} #rapp .tabs div.on{color:#f2b544}
#rapp .tabs svg{width:2.3vh;height:2.3vh;fill:none;stroke:currentColor;stroke-width:1.8}
#rapp .home{position:absolute;left:50%;bottom:.9vh;width:34%;height:.5vh;border-radius:.4vh;background:#f3ede2cc;transform:translateX(-50%)}`;
const APP_TEAMS=[['Oro','Stage 1','#f2b544'],['Mar','Stage 2','#3d7bff'],['Fuego','Stage 3','#e8302e'],['Noche','Stage 4','#9a4dff']];
const DANCER_SVG='<svg viewBox="0 0 40 46"><circle cx="20" cy="9" r="5.5"/><path d="M12 46l3-17-7-6 3-3 7 5h4l7-5 3 3-7 6 3 17h-5l-2-12-2 12z"/></svg>';
const TAB_SVG=['<path d="M4 18V8l8-5 8 5v10z"/>','<path d="M6 12l4 4 8-9"/>','<circle cx="8" cy="9" r="3"/><circle cx="16" cy="9" r="3"/><path d="M2 20c1-4 4-5 6-5s5 1 6 5M12 20c1-4 4-5 6-5"/>','<path d="M7 3h10l-2 9a3 3 0 0 1-6 0zM12 15v6M8 21h8"/>','<rect x="3" y="6" width="18" height="12" rx="2"/><path d="M15 6v12"/>'];
function appBuild(){ if(APP.el) return APP.el; const st=document.createElement('style'); st.textContent=APP_CSS; document.head.appendChild(st);
  const d=document.createElement('div'); d.id='rapp'; d.hidden=true;
  d.innerHTML=`<div class="body"><i class="btn b1"></i><i class="btn b2"></i><i class="btn b3"></i><i class="btn b4"></i><div class="scr"><div class="island"></div>
   <div class="sb"><span>21:47</span><span class="ic"><svg viewBox="0 0 18 12"><rect x="0" y="8" width="3" height="4"/><rect x="5" y="5" width="3" height="7"/><rect x="10" y="2" width="3" height="10"/><rect x="15" y="0" width="3" height="12" opacity=".4"/></svg><svg viewBox="0 0 16 12"><path d="M8 11l2.2-2.6a3.3 3.3 0 0 0-4.4 0zM8 1C5 1 2.4 2.2.5 4.2l1.6 1.8A8 8 0 0 1 8 3.4 8 8 0 0 1 13.9 6l1.6-1.8C13.6 2.2 11 1 8 1zm0 4.4c-1.8 0-3.4.7-4.6 1.8L5 9a4.4 4.4 0 0 1 6 0l1.6-1.8A6.7 6.7 0 0 0 8 5.4z"/></svg><svg viewBox="0 0 26 12"><rect x=".5" y=".5" width="22" height="11" rx="3" fill="none" stroke="#f3ede2"/><rect x="2" y="2" width="16" height="8" rx="1.5"/><rect x="24" y="4" width="1.6" height="4" rx=".8"/></svg></span></div>
   <div class="hd"><div class="logo"><i></i></div><div class="ttl"><b>REVERSE ARENA</b><span>Imperio School · Season 1</span></div></div>
   <div class="cyv">Cast your vote</div>
   <div class="lv"><b class="live2"><i></i>LIVE</b><div class="ring" style="--p:0%"><span>0:15</span></div></div>
   <div class="meta">Show 128 · Barcelona · Row 9, seat 14</div>
   <div class="sub">Your vote sends the show to the winning team's stage.</div>
   <div class="teams"></div>
   <div class="chips"><div class="chip"><b>Order to your seat</b>Cava, pinchos, delivered at the turn</div><div class="chip"><b>Tonight's episode</b>Streaming tomorrow, 20:00</div></div>
   <div class="win"><small>The room has voted</small><b>Team Fuego wins</b><span>Turn to Stage 3</span></div>
   <div class="tabs">${['Show','Vote','Teams','Bar','Tickets'].map((n,i)=>`<div class="${i===1?'on':''}"><svg viewBox="0 0 24 24">${TAB_SVG[i]}</svg>${n}</div>`).join('')}</div><div class="home"></div>
   <div class="tap"></div></div></div>`;
  const tw=d.querySelector('.teams'); APP.rows=APP_TEAMS.map(([n,s,c],i)=>{ const r=document.createElement('div'); r.className='tm'; r.style.setProperty('--c',c);
    r.innerHTML=`<div class="av" style="background:linear-gradient(160deg,${c},${c}55)">${DANCER_SVG}</div><div class="nm"><b>Team ${n}</b><span>${s} · 20 dancers</span><div class="bar"><i style="background:${c};width:25%"></i></div></div><div class="pc">25%</div><div class="vt" style="background:${c};color:#0b0a0d;display:none">Your vote</div>`;
    tw.appendChild(r); return r; });
  document.body.appendChild(d); return APP.el=d; }
function appStart(){ appBuild(); APP.t=0; APP.on=true; APP.el.hidden=false; }
function appStop(){ APP.on=false; if(APP.el) APP.el.hidden=true; }
function appUpdate(dt){ if(!APP.on) return; APP.t+=dt; const t=APP.t, d=APP.el;
  const inK=ease(clamp(t/.7,0,1)), outK=ease(clamp((t-7.2)/.6,0,1)); d.style.opacity=inK*(1-outK); d.style.transform=`translateY(${-50+(1-inK)*14}%)`;
  const k=ease(clamp((t-1.6)/4.4,0,1));
  APP.rows.forEach((r,j)=>{ const w=(25+(APP.to[j]-25)*k)+Math.sin(t*3.1+j*2)*(1-k)*5; r.querySelector('.bar i').style.width=(w*2.1)+'%'; r.querySelector('.pc').textContent=Math.round(w)+'%';
    const mine=j===APP.pick&&t>1.25; r.classList.toggle('mine',mine); r.querySelector('.vt').style.display=mine?'block':'none'; });
  { const dot=d.querySelector('.live2 i'); if(dot) dot.style.opacity=(.3+.7*(.5+.5*Math.cos(t*6.3))).toFixed(3); }   /* v23d: the LIVE dot pulses */ const left=Math.max(0,15-Math.floor(t*2.2)); d.querySelector('.ring').style.setProperty('--p',(clamp(t/6.6,0,1)*100)+'%'); d.querySelector('.ring span').textContent='0:'+String(left).padStart(2,'0');
  const tap=d.querySelector('.tap'), tr=APP.rows[APP.pick].getBoundingClientRect(), sr=d.querySelector('.scr').getBoundingClientRect(), tp=clamp((t-1.0)/.6,0,1);
  tap.style.left=(tr.left-sr.left+tr.width*.55)+'px'; tap.style.top=(tr.top-sr.top+tr.height*.5)+'px'; tap.style.opacity=tp>0&&tp<1?(1-tp):0; tap.style.transform=`translate(-50%,-50%) scale(${.4+tp*1.2})`;
  const wk=ease(clamp((t-6.2)/.5,0,1)); const wn=d.querySelector('.win'); wn.style.opacity=wk; wn.style.transform=`translateY(${(1-wk)*3}vh) scale(${.96+.04*wk})`; }

// the vote on the big screens: the same count as the phones, the four teams in their colours, then the winner across the wall
const voteCv=document.createElement('canvas'); voteCv.width=2048; voteCv.height=512; TEX.vote=new T.CanvasTexture(voteCv); TEX.vote.wrapS=T.RepeatWrapping; let voteDrawn=-1;
function drawVoteWall(t){ const g=voteCv.getContext('2d'), w=2048, h=512, k=ease(clamp((t-1.6)/4.4,0,1)), wk=ease(clamp((t-6.2)/.6,0,1));
  const bg=g.createLinearGradient(0,0,0,h); bg.addColorStop(0,'#05050b'); bg.addColorStop(1,'#140d1f'); g.fillStyle=bg; g.fillRect(0,0,w,h);
  g.textAlign='center'; g.textBaseline='middle'; g.fillStyle='#f0c35a'; g.font='500 34px Outfit, Arial, sans-serif'; g.fillText('L I V E   V O T E   ·   W H O   W I N S ?',w/2,58);
  const cw=w/4; APP_TEAMS.forEach(([name,stage,hex],j)=>{ const v=(25+(APP.to[j]-25)*k)+Math.sin(t*3.1+j*2)*(1-k)*5, x=j*cw+cw/2, top=118, bot=430, bh=(bot-top)*v/45;
    g.fillStyle='rgba(255,255,255,.06)'; g.fillRect(x-70,top,140,bot-top); g.fillStyle=hex; g.fillRect(x-70,bot-bh,140,bh);
    g.fillStyle='#f6ecd6'; g.font='600 64px Outfit, Arial, sans-serif'; g.fillText(Math.round(v)+'%',x,Math.max(top+40,bot-bh-44));
    g.font='400 46px "Playfair Display", Georgia, serif'; g.fillText(name,x-260>0?x:x,470); g.fillStyle='rgba(246,236,214,.6)'; g.font='400 24px Outfit, Arial, sans-serif'; g.fillText(stage.toUpperCase(),x,500); });
  if(wk>0){ g.globalAlpha=wk; const rg=g.createLinearGradient(0,0,w,h); rg.addColorStop(0,'#e8302e'); rg.addColorStop(1,'#7a0f10'); g.fillStyle=rg; g.fillRect(0,0,w,h);
    g.fillStyle='#fff'; g.font='500 30px Outfit, Arial, sans-serif'; g.fillText('T H E   R O O M   H A S   V O T E D',w/2,140); g.font='500 112px "Playfair Display", Georgia, serif'; g.fillText('Team Fuego wins',w/2,270);
    g.font='400 40px Outfit, Arial, sans-serif'; g.fillText('T U R N   T O   S T A G E   3',w/2,400); g.globalAlpha=1; }
  TEX.vote.needsUpdate=true; }
const _appU=appUpdate; appUpdate=function(dt){ _appU(dt); if(APP.on){ const f=Math.floor(APP.t*12); if(f!==voteDrawn){ voteDrawn=f; drawVoteWall(APP.t); } } };

// ================= THE FILM: about 80 seconds, frame-exact on the show clock =================
// Open on the Stage 1 platform with the seats facing us and the screens open behind us. The seats turn to Stage 3 while the screens stay
// where they are, so the audience ends up facing the closed screens. We lift over the rake as the screens open on the dark show, the house
// goes down and the music starts. Then the room from the audience's seats: Stage 3, the corner, Stage 4, Stage 1 and wide open, the vote,
// and the screens seal on BARCELONA as we rise to the round from above.
/* 16 Nov, his note: the very last shot shows the video wall closing all the way, with the seal as it shuts. The close now runs the length of the overhead shot (76.5 to 84.0) in place of 5 s under the rising camera; the seal lands at 83.95 and the title comes up after it */
const FILM_END=window.FILM_END||{dur:5,seal:58.9,title:58.9};   /* v30 (17 Nov, his yes): the site film ends before the finale, at 60.5 s, fading to black; the title comes up over the fade */
if(/^#preview/.test(location.hash)){ window.__PREVIEW=true; if(location.hash==='#preview-quiet'){ window.__quiet=true; window.__pvFps=true; } }   /* the private preview link: the film played live, with buttons that jump to each changed moment */
const FILM={on:false,t:0,hold:false,scrA:Math.PI,gapH:0,cam:null,ev:[],acts:[],done:false,len:window.FILM_LEN||60.5,title:null};
const fv=(a,r,y)=>pol(a*D2R,r,y);
const sm=x=>{ x=clamp(x,0,1); return x*x*x*(x*(x*6-15)+10); };
const lerpV=(a,b,u)=>a.clone().lerp(b,u);
function fEv(name){ FILM.ev.push([+FILM.t.toFixed(3),name]); }
function filmSeat(row,x){ let best=null; for(const s of LAY.seats){ const d=Math.abs((s.row||0)-row)*3+Math.abs(s.x-(x||0)); if(!best||d<best.d) best={s,d}; } return best.s; }
function filmSit(s,zoom){ V.seat=s; marker.visible=false; V.yaw=0; V.pitch=0; V.zoom=zoom||0; V.mode='seat'; viewTarget(); camFrom.copy(camTo); lookFrom.copy(lookTo); fovFrom=fovTo; V.blend=1; FILM.cam=null; }
function rigVis(on){ grid.visible=on; ringB.visible=on; ringC.visible=on; }
function turn(a){ S.faceT=a; fEv('turn'); }
function fire(){ FXFIRE.t=performance.now()/1000; fEv('fx'); }
function cueAt(sec){ SHOW.t0=performance.now()/1000-sec; SHOW.mix=1; }

// shots: each sets the camera from its own local time. 'path' shots move a camera through keyframes; 'seat' shots sit in the house.
const _fsp=new T.Vector3();
const SHOTS=[
  {t0:0,t1:22.5,path:u=>{                                        // A: the platform, the turn, the lift over the rake
     const s=u*22.5; let p,l;
     if(s<4.5){ const k=sm(s/4.5); p=lerpV(fv(-2,17.6,2.9),fv(0,17.4,3.3),k); l=new T.Vector3(0,1.7,0); }
     else if(s<12){ const k=sm((s-4.5)/7.5); p=lerpV(fv(0,17.4,3.3),fv(0,19.6,9.6),k); l=lerpV(new T.Vector3(0,1.7,0),new T.Vector3(0,1.2,3),k); }
     else if(s<19){ const k=sm((s-12)/7); p=lerpV(fv(0,19.6,9.6),fv(0,9.4,8.9),k); p.y+=Math.sin(k*Math.PI)*.15; l=lerpV(new T.Vector3(0,1.2,3),new T.Vector3(0,3.0,17),k); }   // over the screen tops and under ring A
     else { const k=sm((s-19)/3.5); p=lerpV(fv(0,9.4,8.9),fv(0,3.0,7.6),k); l=lerpV(new T.Vector3(0,3.0,17),new T.Vector3(0,3.4,18.5),k); }
     return {p,l,fov:52}; }},
  {t0:22.5,t1:50.2,seat:()=>filmSeat(8,0),zoom:.34,zoomF:u=>{ const t=22.5+u*27.7; if(t<34) return t<30.5?lerp(.34,.2,sm(clamp((t-22.5)/3.4,0,1))):lerp(.2,.15,sm(clamp((t-30.5)/2.5,0,1)));
      return t<44?lerp(.15,.44,sm(clamp((t-37.0)/6.9,0,1))):lerp(.44,.34,sm(clamp((t-44)/3,0,1))); },drift:.05,yawF:t=>t<34.55?-(S.discA-Math.PI):0},   /* v19: B runs unbroken from the dark act to his mark: Stage 3, the turn to the tunnel, Tripp coming out of it into the spot, and the turn to Stage 4 with him in front. The camera rides its seat through both turns, so the room moving is what you watch; it only eases closer as he comes down to the stair */
  {t0:50.2,t1:52.6,path:u=>{ const e=new T.Vector3(.7,1.65,-7.6+u*.3).applyAxisAngle(YAX,-S.discA); return {p:e,l:new T.Vector3(SING.pos.x,SING.pos.y+1.45,SING.pos.z),fov:34}; }},   // close: he hits the mark
  {t0:52.6,t1:57.5,path:u=>{ const e=new T.Vector3(.35,1.3,-6.6).applyAxisAngle(YAX,-S.discA), l=new T.Vector3(0,1.9,-16).applyAxisAngle(YAX,-S.discA); return {p:e,l,fov:50}; }},     // D: from the aisle, riding the turntable: the room turns to Stage 1 and he turns with us
  {t0:57.5,t1:60.6,seat:()=>filmSeat(7,-1.5),zoom:.05,drift:.12},  // E: Stage 1, its video panels flying, the singer climbs
  {t0:60.6,t1:62.5,path:u=>({p:lerpV(fv(-9,13.2,2.3),fv(-6,13.0,3.3),sm(u)),l:new T.Vector3(SING.pos.x,SING.pos.y+1.5,SING.pos.z),fov:38})},   // close: he rides the lift up
  {t0:62.5,t1:70.5,path:u=>({p:lerpV(fv(165,12.8,6.4),fv(132,12.4,7.6),sm(u)),l:new T.Vector3(0,2.6,0).lerp(new T.Vector3(SING.pos.x,SING.pos.y+1.5,SING.pos.z),.3),fov:64})},   // the singer on his lift anchors the wide             // R: the screens close round the crowd, then open on every stage
  {t0:70.5,t1:76.5,path:u=>({p:lerpV(fv(0,15.8,6.6),fv(6,15.2,7.4),sm(u)),l:new T.Vector3(0,1.4,2.5),fov:54})},                  // F: the vote, looking back at the house
  {t0:76.5,t1:86.5,path:u=>{ const k=sm(u); return {p:new T.Vector3(0,lerp(22,44,k),lerp(7,.6,k)),l:new T.Vector3(0,0,0),fov:lerp(54,48,k)}; }}];  // G: rise to the round

function filmActs(){ const R=TAU; return [
  [0,()=>{ window.__filmLifts={}; DANCE.off={0:1}; FILM.scrGain=1; jumpRoom('theatre'); FILM.hold=true; FILM.scrA=Math.PI; FILM.gapH=0; S.faceT=S.discA=0; MOVE.vt=0; houseTo(true); S.houseK=1; S.look='dark'; S.ledOn=true; S.fxAuto=false;
           S.haze=.75; S.ringLz=0; showFoot('house'); rigVis(false); fEv('room'); }],
  [2.5,()=>turn(Math.PI)],
  [13,()=>{ houseTo(false); S.look='mid'; fEv('lightsdown'); }],
  [14.5,()=>{ if(FILM.live){ const m=filmMusic(); m.currentTime=0; m.play().catch(()=>{}); } FILM.open={t:0,dur:5.5,from:0,to:89*D2R}; FILM.fade={t0:15.2,t1:19.6}; cueAt(22); fEv('screens'); fEv('music'); }],   // the BARCELONA screens open still lit, and fade to black as they part
  [19.7,()=>{ showFoot('ambient'); applyContent(screenMat,'ambient',2,false); FILM.fade={t0:19.7,t1:23,up:true}; }],
  [22.5,()=>{ DANCE.off={}; FILM.hold=false; S.faceT=S.discA=Math.PI; S.gap=S.gapT=89*D2R; MOVE.vs=0; rigVis(true); S.look='mid'; fEv('hit'); }],
  [25.3,()=>pyroDash()],                                                                 // the beat after the first "say it louder": a full, soft burst across the lip
  [30.5,()=>{ S.fxAuto=true; S.ringLz=0; cueAt(48); window.__filmLifts={2:[1]}; fire(); fEv('hit'); }],   // the dark act holds to the hit, then the company, the lights and the lifts
  [34.55,()=>{ turn(Math.PI+R/8); gapTween(180,3.2); fEv('screens'); }],   /* v19: the audience turns from Stage 3 to the tunnel as the screens open: one continuous view from the seat, so the room's turn is the show; Tripp is already walking in the tunnel and reaches the mouth as the turn ends */   /* v18b: the screens open on the tunnel just before the cut to him, so he is seen coming through it */   /* v17: the room turns on his first line, and the picture cuts to him on the same beat */
  [39.5,()=>fire()],   /* v17: Stage 3 holds to this hit; on it the flames go, the room starts to turn and the picture cuts to Tripp */
  [44,()=>{ S.ringLz=0; turn(Math.PI*1.5); gapTween(106,3); window.__filmLifts={3:1}; window.__holoGiant=true; applyContent(screenMat,'holocam',0,false); S.footage='holocam'; FILM.scrK=.42; fEv('screens'); }],   // the giant on Stage 4, and small on the screens in a lot of dark
  [51,()=>fire()],
  [52.5,()=>{ turn(R); window.__filmLifts={}; }],
  [54.4,()=>pyroDash(0)],[55.6,()=>fire()],[57.02,()=>pyroDash(0)],   /* v18: ORO arrives with pyro and flame in the middle of the picture */
  [62.1,()=>{ window.__filmLifts={0:1}; }],                                                 // the singer is on the centre lift: up he goes
  [58.5,()=>{ cueAt(80); fire(); fEv('hit'); }],
  [62.5,()=>{ FILM.scrK=1; showFoot('v-led'); gapTween(0,3.5); S.ringLz=0; window.__filmLifts={0:1,1:1,2:[1,2],3:1}; fEv('screens'); }],
  [64.5,()=>fire()],
  [66.5,()=>{ gapTween(180,4); fEv('screens'); }],
  [68.5,()=>fire()],
  [70.5,()=>{ drawVoteWall(0); applyContent(screenMat,'vote',0,false); S.footage='vote'; appStart(); fEv('vote'); S.ringLz=0; }],   /* v23c (his note): no ring lasers over the audience in the film; the audience washes carry it (r6-lights) */
  [73,()=>fire()],
  [76.5,()=>{ window.__filmLifts={}; gapTween(0,FILM_END.dur); showFoot('house'); S.ringLz=0; FILM.team=window.__team=true; fEv('screens'); fEv('musicend'); }],   // the closing overhead: every light aims at a stage in its team's colour
  [76.8,()=>fEv('win')],
  [78.5,()=>{ appStop(); }],
  [85.3,()=>{ fEv('lightsup'); }],   // the house lights stay down: the film ends on the colour picture
  [FILM_END.seal,()=>{ fEv('seal'); }]]; }

// v22. Closed captions in Spanish for the song, the way television captions run: white on a dark box, low and centred, with the music marks.
const CC_ES=[[22.1,25.7,'Dilo más fuerte, dilo más fuerte'],[25.7,29.4,'Siente el momento, siente el poder'],[30.4,33.6,'Devuélvele la vida al animal'],[33.6,36.7,'Trae la energía una vez más'],
  [36.7,39.3,'Si sientes que te quieres soltar'],[39.3,41.7,'Puedes tomar el control'],[41.7,45.5,'Puedes convertir todo esto en algo hermoso'],[45.5,51.6,'Cuando sientas que te derrumba, te derrumba'],
  [51.6,54.0,'Te derrumba, te derrumba'],[54.0,56.9,'Dilo más fuerte, dilo más fuerte'],[58.1,60.5,'Siente el momento, siente el poder'],[62.2,64.9,'Devuélvele la vida al animal'],[66.1,68.6,'Trae la energía una vez más'],
  [74.5,79.4,'Trae la energía una vez más'],[79.4,84.3,'Trae la energía una vez más']];
function ccUpdate(t){ let d=FILM.cc; if(!d){ d=document.createElement('div'); d.id='filmCC'; d.setAttribute('aria-live','off'); d.lang='es';
    d.style.cssText='position:absolute;left:50%;bottom:calc(8% + env(safe-area-inset-bottom,0px));transform:translateX(-50%);z-index:9;pointer-events:none;width:max-content;max-width:86vw;text-align:center;font:500 clamp(15px,2.7vh,30px)/1.4 Outfit,Arial,sans-serif;color:#fff;letter-spacing:.01em';
    document.body.appendChild(d); FILM.cc=d; }
  let cur=''; if(FILM.on&&window.__ccES) for(const [a,b,x] of CC_ES)   /* v23: his call, no Spanish captions on the film (kept behind window.__ccES) */ if(t>=a&&t<b){ cur=x; break; }
  if(d.dataset.s!==cur){ d.dataset.s=cur; d.textContent=''; if(cur){ const sp=document.createElement('span'); sp.textContent='♪ '+cur+' ♪'; sp.style.cssText='background:rgba(0,0,0,.74);padding:.14em .55em;border-radius:.15em;-webkit-box-decoration-break:clone;box-decoration-break:clone'; d.appendChild(sp); } }
  d.hidden=!cur; }
function filmTitle(){ if(FILM.title) return FILM.title; const d=document.createElement('div'); d.id='filmTitle';
  d.style.cssText='position:absolute;left:0;right:0;top:50%;transform:translateY(-50%);text-align:center;z-index:9;pointer-events:none;opacity:0;color:#f6ecd6';   /* v23: his note, the closing title sits in the middle of the picture */
  d.innerHTML='<div style="font:400 54px Marcellus,\'Times New Roman\',serif;letter-spacing:.14em">REVERSE ARENA THEATER</div><div style="margin-top:10px;font:400 20px Outfit,Arial,sans-serif;letter-spacing:.6em;color:#f0c35a">BARCELONA</div>';
  document.body.appendChild(d); return FILM.title=d; }

// live playback in the browser: the music file is the clock once it starts, and the room makes its own machine sounds
const FMUS={el:null};
function filmMusic(){ if(!FMUS.el){ const a=new Audio('film-music.mp3'); a.preload='auto'; a.muted=!!window.__quiet; FMUS.el=a; } return FMUS.el; }
function filmLive(){ FILM.live=true; try{ setSound(true); }catch(e){} filmMusic().load(); filmStart();
  if(!FILM.ptrHook){ FILM.ptrHook=true; let to=0; const wake=()=>{ document.body.classList.add('ptr'); clearTimeout(to); to=setTimeout(()=>document.body.classList.remove('ptr'),2200); }; window.addEventListener('pointermove',wake,{passive:true}); window.addEventListener('pointerdown',wake,{passive:true}); }
  let x=document.getElementById('filmX'); if(!x){ x=document.createElement('button'); x.id='filmX'; x.type='button'; x.setAttribute('aria-label','Skip the film'); x.textContent='Skip \u203a'; x.addEventListener('click',filmEnd); document.body.appendChild(x); } x.hidden=false; }
function filmStart(){ FILM.team=window.__team=false; FILM.seekTo=null; if(TOUR.on&&typeof tourEnd==='function') tourEnd(); if(SHOWD.on) showEnd(); FILM.on=true; FILM.t=0; FILM.ev=[]; FILM.done=false; FILM.acts=filmActs().map(a=>({t:a[0],f:a[1],done:false})); FILM.shot=-1; FILM.open=null; FILM.fade=null; FILM.scrGain=1; FILM.scrK=1; window.__holoGiant=false;
  document.body.classList.add('showing','film'); for(const c of scene.children) if(c.userData.scaleMan) c.visible=false; filmTitle().style.opacity=0; filmUpdate(0,0); }
function filmEnd(){ if(!FILM.on) return; if(typeof AUD!=='undefined'){ AUD.noHide=false; audSync(); } for(const c of seating.children) if(c.userData.aisleCam) c.scale.setScalar(1); if(FILM.cc){ FILM.cc.hidden=true; FILM.cc.dataset.s=''; } try{ crowdStop(); }catch(e){} FILM.team=window.__team=false; if(FILM.wash) for(const x of FILM.wash){ x.w.visible=x.e.visible=false; } FILM.seekTo=null; { const sk=document.getElementById('filmSeek'); if(sk) sk.hidden=true; } window.__holoGiant=false; if(FILM.rods) for(const r of FILM.rods) r.visible=true; for(const b of ST[0].beams) b.piv.visible=true; if(FILM.lights) for(const l of FILM.lights) l.visible=true; delete window.__filmLifts; DANCE.off={}; screenMat.uniforms.uGain.value=1; const m=FMUS.el; if(m){ m.pause(); m.currentTime=0; } FILM.live=false; const x=document.getElementById('filmX'); if(x) x.hidden=true; for(const c of scene.children) if(c.userData.scaleMan) c.visible=true; appStop(); FILM.on=false; FILM.hold=false; FILM.cam=null; S.ringLz=0; rigVis(true); document.body.classList.remove('showing','film'); if(FILM.title) FILM.title.style.opacity=0; if(FLOW&&FLOW.intro){ FLOW.intro=false; setTimeout(chooseShow,250); } }


// ---- lighting cues programmed to the music: the beat grid and the big hits come from the track (librosa analysis, film time)
const MUSB={bpm:117.45,t0:25.297,hits:[22.35, 25.3, 29.29, 36.79, 37.3, 40.78, 42.04, 43.01, 44.04, 47.03, 48.03, 49.03, 49.54, 57.02, 58.04, 59.04, 59.52, 61.03, 63.03, 65.03, 66.03, 66.54, 68.53, 72.78, 74.78, 76.29, 78.29, 80.28, 82.28, 83.79],energy:[[22.3,30.5,1],[30.5,54.4,.8],[54.4,68.3,1],[68.3,70.4,.55],[70.4,82.6,1],[82.6,99,.4]]};
function musicBeat(){ return FILM.on?(FILM.t-MUSB.t0)*MUSB.bpm/60:SHOW.t*118/60; }
function musicPulse(){ if(!FILM.on) return Math.pow(1-((SHOW.t*118/60)%1+1)%1,2); const b=musicBeat(); if(b<-14) return 0; const ph=((b%1)+1)%1; return Math.pow(1-ph,2)*(b<0?.45:1); }
function pushK(){ if(typeof FILM==='undefined'||!FILM.on) return 0; const d=FILM.t-55.02; return d>=0&&d<2.2?Math.exp(-d*1.6):0; }   /* t23: the lighting push on Tripp's landing */
function hitPulse(){ if(!FILM.on) return 0; let m=0; for(const h of MUSB.hits){ const d=FILM.t-h; if(d>=0&&d<.6) m=Math.max(m,Math.exp(-d*7)); } { const d=FILM.t-55.02; if(d>=0&&d<1.6) m=Math.max(m,Math.exp(-d*2.4)); }   /* t23: the lighting push on Tripp's landing, on the drop: longer and bigger than the other hits, opening the room back up */ return m; }
function musicEnergy(){ if(!FILM.on) return 1; for(const [a,b,e] of MUSB.energy) if(FILM.t>=a&&FILM.t<b) return e; return .5; }
const HAZE_SHOT=[[0,.75],[30.5,.6],[44,.55],[62.5,.36],[70.5,.5],[76.5,.62]];
// the closing overhead: each stage floods its deck in its team's colour, so the ring seen from above is the four colours of the school
function teamWash(t){ const k=FILM.on?smooth(clamp((t-76.6)/2.4,0,1)):0;
  if(!FILM.wash){ if(k<=0) return; FILM.wash=[0,1,2,3].map(i=>{ const m=new T.MeshBasicMaterial({color:new T.Color(TEAMS4[i].hex),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false,side:T.DoubleSide});
      const w=new T.Mesh(ringSector(13.6,23.2,-44*D2R,44*D2R,STAGE_H+.04),m); w.renderOrder=6; ST[i].group.add(w);
      const e=new T.Mesh(new T.TorusGeometry(13.55,.07,6,64,88*D2R),new T.MeshBasicMaterial({color:new T.Color(TEAMS4[i].hex),transparent:true,opacity:0,blending:T.AdditiveBlending,depthWrite:false})); e.rotation.x=Math.PI/2; e.rotation.z=(-90-44)*D2R; e.position.y=STAGE_H+.06; ST[i].group.add(e);
      return {w,e,m,em:e.material}; }); }
  const pulse=.85+.15*Math.sin(t*2.1); for(const x of FILM.wash){ x.w.visible=x.e.visible=k>0; x.m.opacity=.8*k*pulse; x.em.opacity=.95*k; } }
function filmUpdate(dt){ FILM.t+=dt; for(const c of seating.children) if(c.userData.aisleCam) c.scale.setScalar(1);   /* v23k: his note, the centre camera at the back of the audience is back in the opening shot (V22 had hidden it there because it stood in front of the E of ARENA) */   /* the aisle camera at the back stood in front of the E of ARENA on the venue sign for the whole opening shot */ if(FILM.seekTo!=null){ if(FMUS.el&&!FMUS.el.paused) FMUS.el.pause(); if(FILM.t>=FILM.seekTo){ FILM.seekTo=null; const sk=document.getElementById('filmSeek'); if(sk) sk.hidden=true; if(FILM.live&&FMUS.el&&FILM.t>14.5){ FMUS.el.currentTime=FILM.t-14.5; FMUS.el.play().catch(()=>{}); } } }
  if(FILM.live&&FILM.seekTo==null&&FMUS.el&&!FMUS.el.paused&&FILM.t>14.6&&FILM.t<88){ const mt=14.5+FMUS.el.currentTime; if(Math.abs(mt-FILM.t)>.08) FILM.t=mt; } const t=FILM.t; if(window.__noShadow&&FILM.t>.2) renderer.shadowMap.needsUpdate=false;
  for(const a of FILM.acts) if(!a.done&&t>=a.t){ a.done=true; a.f(); }
  // teamWash(t);  (floor colour taken out: the team colours go on the truss lights instead)
  for(const c of scene.children) if(c.userData.scaleMan) c.visible=false;
  if(S.houseK>.5) S.houseK=.5;
  if(FILM.hold){ const o=FILM.open; if(o){ o.t+=dt; FILM.gapH=o.from+(o.to-o.from)*ease(clamp(o.t/o.dur,0,1)); }
    S.gap=S.gapT=FILM.gapH; MOVE.vs=0; }
  if(!FILM.hold&&SHOWD.gapTw){ const g=SHOWD.gapTw; g.t+=dt; if(g.ft0!=null) g.t=Math.max(g.t,t-g.ft0); const e=ease(clamp(g.t/g.dur,0,1)); S.gapT=g.from+(g.to-g.from)*e; if(g.t>=g.dur) SHOWD.gapTw=null; }
  { const f=FILM.fade; let gn=1; if(f){ const u=clamp((t-f.t0)/(f.t1-f.t0),0,1); gn=f.up?u:1-sm(u); } screenMat.uniforms.uGain.value=gn*(FILM.scrK||1); if(S.footage==='holocam') holoCam(); }
  if(!FILM.lights){ FILM.lights=[]; scene.traverse(o=>{ if(o.isSpotLight||o.isPointLight) FILM.lights.push(o); }); } for(const l of FILM.lights){ const on=l.intensity>.002; if(l.visible!==on) l.visible=on; }   // unlit lamps leave the shader
  if(!FILM.rods){ FILM.rods=[]; scene.traverse(o=>{ if(o.userData.hangRod) FILM.rods.push(o); }); } for(const r of FILM.rods) r.visible=t>=22.5; for(const b of ST[0].beams) b.piv.visible=t>=22.5;   // the camera's opening flight passes through Stage 1's back-light cones   // the ring's hanger rods sit on the opening flight path
  { let hz=.75; for(const [a,h] of HAZE_SHOT) if(t>=a) hz=h; S.haze+=(hz-S.haze)*Math.min(1,dt*1.2);   // lighter haze on the wide shots, so the room reads
    const bar=Math.floor(musicBeat()/4); FILM.swap=musicEnergy()>.9&&bar%2===1; }   // in the big sections the beam colours trade places every bar
  if(t>12.6&&t<15.6){ const f=Math.floor(t*30); if(f!==FILM.hsw){ FILM.hsw=f; drawHouse((t-13.1)/1.9,t); } } else if(FILM.hsw!==undefined&&FILM.hsw!==-1){ FILM.hsw=-1; drawHouse(); }   /* v22: as the house goes dark, a light sweeps the BARCELONA letters and the wall shimmers with the applause */
  ccUpdate(t);
  appUpdate(dt); try{ crowdSound(); }catch(e){}
  let k=-1; for(let i=0;i<SHOTS.length;i++) if(t>=SHOTS[i].t0&&t<SHOTS[i].t1) k=i; if(k<0) k=SHOTS.length-1;
  const sh=SHOTS[k], u=clamp((t-sh.t0)/(sh.t1-sh.t0),0,1);
  if(k!==FILM.shot){ FILM.shot=k; if(sh.seat) filmSit(sh.seat(),sh.zoom); if(typeof AUD!=='undefined'){ AUD.noHide=!sh.seat; audSync(); } }   /* v23k: his note, empty chairs by the aisle: the seat the camera sits in is emptied only while the camera is in it (the film never emptied it, and kept the tour's own seat empty all film) */
  if(sh.path){ FILM.cam=sh.path(u); grid.visible=false; }
  else { FILM.cam=null; V.yaw=Math.sin(t*.21)*sh.drift+(sh.yawF?sh.yawF(t):0); V.pitch=.03+Math.sin(t*.13)*.02; if(sh.zoomF) V.zoom=sh.zoomF(u); }
  if(window.__camF){ const c=window.__camF(t); if(c){ FILM.cam=c; grid.visible=false; } }   /* v23k: a test camera the render driver can set (e.g. a move along the back of the seating) */
  if(FILM.title) FILM.title.style.opacity=clamp((t-FILM_END.title)/1.6,0,1);
  if(t>=FILM.len&&!FILM.done){ FILM.done=true; fEv('end'); }
  if(FILM.live&&t>=FILM.len+1.2) filmEnd(); }

function filmCam(){ const c=FILM.cam; if(!c) return; camera.position.copy(c.p); camera.fov=c.fov; camera.up.set(0,1,0); camera.lookAt(c.l); camera.updateProjectionMatrix(); grid.visible=FILM.hold?false:grid.visible; }
window.__film={FILM,filmStart,filmEnd,filmLive,SHOTS,pol,stageAngle};
$('#filmBtn').addEventListener('click',filmLive);
addEventListener('keydown',e=>{ if(FILM.on&&FILM.live&&e.key==='Escape') filmEnd(); });
if(location.hash==='#film') setTimeout(()=>{ FLOW.intro=true; filmLive(); },1500);   /* QA: a #film link ended on the bare design page; it now ends on the choice screen like the film from the first screen */

// clean view (the default): the room, Watch the film and the tour; Controls brings back every control
function setClean(on){ document.body.classList.toggle('clean',on); if(on){ const P=$('#ctl'); if(P&&!P.hidden){ P.hidden=true; $('#ctlBtn').setAttribute('aria-pressed','false'); document.body.classList.remove('ctlopen'); } }   /* QA: the panel stayed open over the Controls button after Hide controls */ const b=$('#ctlTog'); b.setAttribute('aria-pressed',on?'false':'true'); b.querySelector('span').textContent=on?'Controls':'Hide controls'; try{ localStorage.setItem('ra-clean',on?'1':'0'); }catch(e){} }
{ let on=true; try{ on=localStorage.getItem('ra-clean')!=='0'; }catch(e){} setClean(on); $('#ctlTog').addEventListener('click',()=>setClean(!document.body.classList.contains('clean'))); }

// the giant, filmed for the screens: only the hologram renders (layer 2), small in a dark frame
const HCAM={rt:new T.WebGLRenderTarget(768,384),cam:new T.PerspectiveCamera(34,2,1,90)}; HCAM.cam.layers.set(2); TEX.holocam=HCAM.rt.texture; HCAM.rt.texture.wrapS=T.RepeatWrapping;
function holoCam(){ if(!HOLO.fig) return; const g=HOLO.fig.getWorldPosition(new T.Vector3()); HCAM.cam.position.copy(pol(stageAngle(3),8.5,6.2)); HCAM.cam.lookAt(g.x,g.y+4.6,g.z);
  const on=HOLO.u.uOn.value, vis=HOLO.fig.visible; HOLO.u.uOn.value=1; HOLO.fig.visible=true; const cc=renderer.getClearColor(new T.Color()), ca=renderer.getClearAlpha();
  renderer.setRenderTarget(HCAM.rt); renderer.setClearColor(0x000000,1); renderer.clear(); renderer.render(scene,HCAM.cam); renderer.setRenderTarget(null); renderer.setClearColor(cc,ca); HOLO.u.uOn.value=on; HOLO.fig.visible=vis; }

// the page opens on one button: play. The film plays live in the model (always the newest approved version), with a small Skip in
// the corner; when it ends or is skipped, two choices: the tour, or the design controls.
const FLOW={intro:false};
function menuLabel(){ const m=$('#menuBtn'); if(!m) return; const d=!!FLOW.fromDossier; m.querySelector('b').textContent=d?'Back to the dossier':'Menu'; m.setAttribute('aria-label',d?'Back to the dossier':'Back to the menu'); m.href=d?$('#ezBack').href:'#'; if(d&&$('#ezBack').target){ m.target=$('#ezBack').target; m.rel='noopener'; } else m.removeAttribute('target'); }
function chooseShow(){ const C=$('#choose'); C.hidden=false; requestAnimationFrame(()=>C.classList.add('on')); }
function chooseHide(){ const C=$('#choose'); C.classList.remove('on'); setTimeout(()=>{ if(!C.classList.contains('on')) C.hidden=true; },700); }
/* v23: his note, "the web still plays it with glitches like no sound to start or timeline jumps. I need the first page to be this video filling up the
   screen with a play button. Press play and it plays the video instead of the live render. When it's done it goes to the choice between Design the
   show or Watch the Tour (or replay)." The finished film (1080p, 8 Mbps) streams in 6-second pieces (HLS, hls.js) so it starts at once and never
   stutters; the live 3D loads quietly behind it and stays paused while the film plays. */
/* 17 Nov, his call (phone fix): the film player now lives in the page's own small script (window.__intro, in the page head), so the film plays before any of the 3D
   is even requested; this 3D code loads only after the film ends or is skipped, or when a link goes straight to the room. Here the room just hooks into it. */
const FV=window.FV;
{ const I=$('#intro'); const IN=window.__intro;
  IN.hooks.play=()=>{ window.__norender=true; try{ if(typeof AU!=='undefined'&&AU.ctx) AU.ctx.suspend(); }catch(e){} };
  IN.hooks.done=()=>{ window.__norender=false; try{ if(typeof AU!=='undefined'&&AU.ctx) AU.ctx.resume(); }catch(e){} };
  if(IN.playing) IN.hooks.play();
  $('#menuBtn').addEventListener('click',e=>{ if(FLOW.fromDossier) return; e.preventDefault(); const P=$('#ctl'); if(P&&!P.hidden){ P.hidden=true; $('#ctlBtn').setAttribute('aria-pressed','false'); document.body.classList.remove('ctlopen'); } chooseShow(); });   /* the design page had no way back (QA finding 8) */
  $('#chTour').addEventListener('click',()=>{ chooseHide(); FLOW.tourFromChoice=true; $('#tExit span').textContent='Back to the menu'; tourStart(); });
  $('#tourBtn').addEventListener('click',()=>{ FLOW.tourFromChoice=false; $('#tExit span').textContent='Leave the tour'; });
  $('#tExit').addEventListener('click',()=>{ if(FLOW.tourFromChoice){ FLOW.tourFromChoice=false; chooseShow(); } });   /* QA: the tour's x left a visitor from the choice screen on the design page with no way back */
  $('#chDesign').addEventListener('click',()=>{ chooseHide(); EZ.fromChoice=true; try{ history.replaceState(null,'','#look'); }catch(e){} ezStart(); });   /* 16 Nov, his call: no fourth button. This card opens the simple look-around page; the full design page is one step inside it (All controls) */
  { const cb=$('#chConsorci'); if(cb&&/claude/.test(location.hostname)){ cb.href='https://claude.ai/artifact/U8VdAgg2DDUdW4nThRPCkF'; cb.target='_blank'; cb.rel='noopener'; } }   /* v23f: the Consorci del Besòs dossier: inside the site on reversearena.com (consorci/), the dossier page when the site runs as a Claude link */
  const fb=$('#filmBtn'); fb.replaceWith(fb.cloneNode(true)); $('#filmBtn').addEventListener('click',()=>IN.play());
  if(/[?&]norefl|[?&]nointro/.test(location.search)||location.hash==='#film'||location.hash==='#tour'||/^#(model|look)/.test(location.hash)||window.__PREVIEW) I.hidden=true;
  IN.ready(); }
// ================= THE SIMPLE MODEL PAGE (#model) =================
// For readers of the dossier (his call, 16 Nov): the room seen from above with a handful of easy buttons: rotate left, rotate right, open or close the
// screens, show lights or house lights, and the mode (theater, dinner, late night cultural events). Every other control is hidden.
const EZ={on:false,r:54,ph:.7,rig:true,people0:true,seat0:null,modes:[['theatre','Theater mode'],['dinner','Dinner mode'],['club','Late night cultural events']]};
function ezLabels(){ $('#ezScr span').textContent=S.gapT>.3?'Close the screens':'Open the screens'; const m=EZ.modes.find(x=>x[0]===S.room)||EZ.modes[0]; $('#ezMode b').textContent=m[1];
  $('#ezShowL').setAttribute('aria-pressed',S.house?'false':'true'); $('#ezHouseL').setAttribute('aria-pressed',S.house?'true':'false'); }
function ezView(){ if(window.EZ_ROOMVIEW){ const asp=camera.aspect||1.6, fov=asp<1?58:42; V.fov=fov; V.r=Math.max(EZ.r,26/(Math.tan(fov*D2R/2)*asp)); V.ph=EZ.ph; V.th=Math.PI-S.discA+.4; V.tgt.set(0,1,0); setView('room'); try{ marker.visible=false; }catch(e){} return; }
  /* 16 Nov, his note: this page is seen from a seat, full screen. You look around by dragging and change seats by tapping any chair; the house is empty so every chair is free */
  sit(V.seat||LAY.seats[0]); }   /* the whole room from above and behind the house, far enough back that it fits a phone held upright */
function ezRig(show){ if(show){ for(const c of EZ.hid||[]) c.visible=true; EZ.hid=null; } else if(!EZ.hid){ EZ.hid=scene.children.filter(c=>c.userData.cat==='rig'&&c.visible); for(const c of EZ.hid) c.visible=false; } }   /* the overhead trusses and their lights come out of this view, so the room reads as a model: seats, screens and stages */
function ezSound(){ if(S.sound||window.__quiet) return; setSound(true).then(()=>{ try{ $('#snd').setAttribute('aria-pressed',S.sound?'true':'false'); $('#snd-w').setAttribute('opacity',S.sound?'1':'.3'); }catch(e){} }).catch(()=>{}); }
function ezStart(){ if(EZ.on) return; EZ.on=true;
  try{ if(TOUR.on) tourEnd(); }catch(e){} try{ if(FILM.on) filmEnd(); }catch(e){} try{ if(SHOWD.on) showEnd(); }catch(e){}
  const I=$('#intro'); if(I){ const v=I.querySelector('video'); if(v){ try{ v.pause(); }catch(e){} } I.hidden=true; I.classList.remove('playing'); } const sk=document.getElementById('filmX'); if(sk) sk.hidden=true;
  window.__norender=false; try{ if(typeof AU!=='undefined'&&AU.ctx) AU.ctx.resume(); }catch(e){} chooseHide();
  { const L=$('#loading'); if(L&&!L.hidden){ document.body.classList.add('ezwait'); const iv=setInterval(()=>{ if(L.hidden){ clearInterval(iv); setTimeout(()=>document.body.classList.remove('ezwait'),500); } },200); setTimeout(()=>{ clearInterval(iv); document.body.classList.remove('ezwait'); },60000); } }   /* the room stays covered until it is set: no half-built close-ups while loading */
  window.__VIDGAP=66; if(!window.__QS&&(window.devicePixelRatio||1)>1.3){ window.__QS=Math.min(1,1.3/(window.devicePixelRatio||1)); try{ resize(); }catch(e){} }   /* v28: the look-around starts at a sharpness a laptop can keep smooth; the watch raises it if there is room */
  document.body.classList.add('easy'); $('#ezCtl').hidden=false; $('#ezBack').hidden=false; $('#ezAll').hidden=false; $('#ezBack span').textContent=EZ.fromChoice?'Back to the menu':'Back to the dossier'; $('#ezHint').hidden=false; $('#ezH1').classList.remove('gone'); $('#ezH2').classList.remove('gone');
  if(!EZ.rig) ezRig(false); EZ.people0=!!S.people; EZ.seat0=V.seat; if(S.people) setPeople(false); TOUR.fast=true;   /* the seats fold away in about four seconds here, as in the tour, so a press of Mode shows its result at once */ if(S.house) $('#house').click(); if(S.room!=='theatre'){ setRoom('theatre'); FOLD.after=null; $('#roomSel').value='theatre'; } setGap(ONE_STAGE); ezView(); ezLabels(); }
function ezStop(){ if(!EZ.on) return; EZ.on=false; window.__VIDGAP=0; ezRig(true); TOUR.fast=false; if(EZ.people0&&!S.people) setPeople(true); document.body.classList.remove('easy'); $('#ezCtl').hidden=true; $('#ezBack').hidden=true; $('#ezAll').hidden=true; $('#ezHint').hidden=true; }
{ const clearHash=()=>{ try{ history.replaceState(null,'',location.pathname+location.search); }catch(e){} };
  $('#ezBack').addEventListener('click',e=>{ if(!EZ.fromChoice) return; e.preventDefault(); EZ.fromChoice=false; ezStop(); clearHash(); chooseShow(); });   /* came in from the screen after the film: Back returns there */
  $('#ezAll').addEventListener('click',()=>{ FLOW.fromDossier=!EZ.fromChoice; menuLabel(); EZ.fromChoice=false; ezStop(); clearHash(); setClean(false); });   /* the full design page, with every control */
  const B=$('#ezBack'); if(/claude/.test(location.hostname)){ B.href='https://claude.ai/artifact/U8VdAgg2DDUdW4nThRPCkF#model3d'; B.target='_blank'; B.rel='noopener'; }
  $('#ezL').addEventListener('click',()=>{ ezSound(); S.faceT=S.faceT-TAU/4; EV('turn'); });
  $('#ezR').addEventListener('click',()=>{ ezSound(); S.faceT=S.faceT+TAU/4; EV('turn'); });
  $('#ezScr').addEventListener('click',()=>{ ezSound(); setGap(S.gapT>.3?0:(S.club?180:ONE_STAGE)); EV('screens'); ezLabels(); });
  $('#ezShowL').addEventListener('click',()=>{ ezSound(); if(S.house) $('#house').click(); ezLabels(); });
  $('#ezHouseL').addEventListener('click',()=>{ ezSound(); if(!S.house) $('#house').click(); ezLabels(); });
  $('#ezMode').addEventListener('click',()=>{ ezSound(); const i=EZ.modes.findIndex(x=>x[0]===S.room), nx=EZ.modes[(i+1)%EZ.modes.length][0]; setRoom(nx); $('#roomSel').value=nx;   /* the room's own camera move follows the change: the floor for late night, the room from above for dinner, back to your seat for the theater */
    if(S.club) setGap(0); else if(S.gapT<.3) setGap(ONE_STAGE); EV('fold'); ezLabels(); });
  { let seat0=null; renderer.domElement.addEventListener('pointermove',e=>{ if(EZ.on&&e.buttons) $('#ezH1').classList.add('gone'); },{passive:true}); setInterval(()=>{ if(!EZ.on) return; if(seat0===null) seat0=V.seat; else if(V.seat!==seat0){ seat0=V.seat; $('#ezH2').classList.add('gone'); } },400); }
  const isM=()=>/^#(model|look)(-quiet)?$/.test(location.hash), go=()=>{ if(isM()){ if(/^#look/.test(location.hash)) EZ.fromChoice=true; if(/-quiet$/.test(location.hash)){ window.__quiet=true; try{ setSound(false); }catch(e){} } ezStart(); } else ezStop(); }; addEventListener('hashchange',go); if(isM()) setTimeout(go,300); }   // #model-quiet: the same page with the sound held off, for silent checks
// preview: plays the film live in the browser, from the start or skipped ahead to a moment
function filmSeek(t){ filmLive(); if(t>0){ FILM.seekTo=t; let sk=document.getElementById('filmSeek'); if(!sk){ sk=document.createElement('div'); sk.id='filmSeek'; sk.textContent='Skipping ahead\u2026'; sk.style.cssText='position:fixed;inset:0;display:grid;place-items:center;z-index:30;background:#07060a;color:#f0c35a;font:500 15px Outfit,Arial,sans-serif;letter-spacing:.2em;text-transform:uppercase'; document.body.appendChild(sk); } sk.hidden=false; } }
if(window.__PREVIEW){   /* 16 Nov (his note: the link landed on a page of show controls, a mess in a narrow window): the preview opens on its own clear menu, nothing else on screen */
  const NEW=window.__PV_BTNS||[['The ring lights up','After the opening, the hanging ring glows, then fades',7],['The angel','The wall lines no longer run through her',45.5],['The wall closes all the way','The last shot, with the closing sound',75]], PVN='VERSION 33'.replace(/\D+/,'');
  const st=document.createElement('style'); st.textContent='#pvHome{position:fixed;inset:0;z-index:40;background:#07060bf5;display:flex;align-items:center;justify-content:center;padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) 16px max(16px,env(safe-area-inset-left,0px));overflow:auto;font-family:Outfit,Arial,sans-serif;color:#efe6d4} #pvHome .bx{width:100%;max-width:440px;display:flex;flex-direction:column;gap:10px;margin:auto} #pvHome h2{margin:0;font:600 22px Outfit,Arial,sans-serif;color:#f0c35a} #pvHome p{margin:0 0 6px;font-size:14px;line-height:1.45;opacity:.82} #pvHome button{display:block;width:100%;text-align:left;font:inherit;border-radius:14px;padding:13px 16px;cursor:pointer;border:1px solid #f0c35a66;background:#15121c;color:#efe6d4} #pvHome button b{display:block;font-size:16px;font-weight:600;color:#f6dc9a} #pvHome button span{display:block;font-size:13px;opacity:.75;margin-top:2px} #pvHome button.go{background:#f0c35a;border-color:#f0c35a;color:#140e05} #pvHome button.go b{color:#140e05} #pvHome small{font-size:12px;line-height:1.4;opacity:.6;margin-top:4px} #pvPill{position:fixed;left:max(12px,env(safe-area-inset-left,0px));top:calc(12px + env(safe-area-inset-top,0px));z-index:41;display:flex;gap:10px;align-items:center;padding:7px 12px;border-radius:999px;background:#0b0a10e6;border:1px solid #f0c35a55;color:#efe6d4;font:500 13px Outfit,Arial,sans-serif;cursor:pointer;opacity:.4;transition:opacity .3s} #pvPill:hover{opacity:1} #pvPill i{font-style:normal;color:#f0c35a;font-variant-numeric:tabular-nums} body.pv .wrap,body.pv #ctl,body.pv .pills,body.pv #caption,body.pv #hint,body.pv .top,body.pv #show,body.pv #tour,body.pv #sNotes,body.pv #filmX,body.pv #choose,body.pv #intro{display:none!important}'; document.head.appendChild(st); document.body.classList.add('pv');
  const H=document.createElement('div'); H.id='pvHome'; H.innerHTML='<div class="bx"><h2>Film preview '+PVN+'</h2><p>Private page, only you can open it. The film plays live here, with sound. Pick where to start.</p><button type="button" class="go" data-t="0"><b>▶ Play the whole film</b><span>90 seconds</span></button>'+NEW.map(([n,d,t],i)=>'<button type="button" data-t="'+t+'"><b>'+(i+1)+'. '+n+'</b><span>'+d+'</span></button>').join('')+'<small>New in this preview: the numbered moments. The four opening looks are not in this live version. They return in the final film.</small></div>'; document.body.appendChild(H);
  const pill=document.createElement('button'); pill.id='pvPill'; pill.type='button'; pill.innerHTML='‹ Preview menu <i id="pvT"></i>'; pill.hidden=true; document.body.appendChild(pill); let ran=false;
  const home=()=>{ if(FILM.on) filmEnd(); H.hidden=false; pill.hidden=true; ran=false; }; pill.addEventListener('click',home);
  H.querySelectorAll('button').forEach(b=>b.addEventListener('click',()=>{ H.hidden=true; pill.hidden=false; ran=false; if(FILM.on) filmEnd(); filmSeek(+b.dataset.t); }));
  { const tc=pill.querySelector('#pvT'); let n0=0, t0=performance.now(); setInterval(()=>{ const now=performance.now(), fps=Math.round((frameN-n0)*1000/Math.max(1,now-t0)); n0=frameN; t0=now; tc.textContent=FILM.on?(FILM.seekTo!=null?'skipping':FILM.t.toFixed(1)+' s')+(window.__pvFps?' · '+fps+' fps':''):''; if(FILM.on) ran=true; else if(ran&&H.hidden) home(); },500); } }   /* the film clock, so a note can name its second; when the film ends the menu comes back */


})().catch(e=>{ console.error(e); setTimeout(()=>{ throw e; },0); });