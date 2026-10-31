/* =====================================================================
   Rendering — pixel art, 3/4 view.
   The world is drawn 1:1 (one world unit = one art pixel) into a small
   buffer, then scaled up by a whole number of device pixels so every art
   pixel stays square. Text, labels and arrows are drawn afterwards at full
   resolution so they stay sharp. Game state is only read here.
   ===================================================================== */
const PAL={paper:'#e7d9b1',ink:'#0b0d10',cin:'#b5341d',gold:'#c9993c',jade:'#6e9b6b'};
const FONT_D='"LXGW WenKai TC","Kaiti TC",serif',FONT_B='"Cactus Classical Serif","Noto Serif TC",serif';
const cv=document.getElementById('cv');let ctx=cv.getContext('2d');
let S=Math.min(2,window.devicePixelRatio||1),SW=960,SH=600;
const CAM={z:2,k:3,x:0,y:0,init:false};          // k: device pixels per art pixel, z: css pixels per art pixel
const RM=matchMedia('(prefers-reduced-motion: reduce)').matches;
const buf=document.createElement('canvas'),bx=buf.getContext('2d');let BW=320,BH=200;
const lightCv=document.createElement('canvas'),lctx=lightCv.getContext('2d');
const WALLH=16,CH=10,OUT='#08070b';
function setupView(){const tiles=SW<600?10.5:SW<1000?14:17.5;const k=Math.max(2,Math.round(cv.width/(tiles*TS)));CAM.k=k;CAM.z=k/S;
  BW=Math.ceil(cv.width/k);BH=Math.ceil(cv.height/k);buf.width=BW;buf.height=BH;lightCv.width=BW;lightCv.height=BH}
const mk=(w,h)=>{const c=document.createElement('canvas');c.width=w;c.height=h;return c};
function shadeHex(hex,k){const n=parseInt(hex.slice(1),16);let r=n>>16,g=n>>8&255,b=n&255;r=clamp(r*k,0,255)|0;g=clamp(g*k,0,255)|0;b=clamp(b*k,0,255)|0;return`rgb(${r},${g},${b})`}
const rgb=h=>{const n=parseInt(h.slice(1),16);return[n>>16,n>>8&255,n&255]};
// pixel discs and ellipses without anti-aliasing
function pdisc(g,cx,cy,rx,ry,col){g.fillStyle=col;ry=ry||rx;for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(Math.max(0,1-(dy*dy)/(ry*ry))));g.fillRect(Math.round(cx-w),Math.round(cy+dy),w*2+1,1)}}

/* ---------------- sprites ---------------- */
const SPR=new Map();
function outline(c){const g=c.getContext('2d'),W=c.width,H=c.height,d=g.getImageData(0,0,W,H),a=d.data,src=new Uint8ClampedArray(a),[r,gg,b]=rgb(OUT);
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(src[i+3]>40)continue;
    if((x>0&&src[i-1]>120)||(x<W-1&&src[i+7]>120)||(y>0&&src[i-W*4+3]>120)||(y<H-1&&src[i+W*4+3]>120)){a[i]=r;a[i+1]=gg;a[i+2]=b;a[i+3]=255}}
  g.putImageData(d,0,0)}
// light from the top-left: a one-pixel rim highlight on edges facing it, shade on edges facing away (monsters and close-ups)
function shadePass(c){const g=c.getContext('2d'),W=c.width,H=c.height,d=g.getImageData(0,0,W,H),a=d.data,s=new Uint8ClampedArray(a),op=(x,y)=>x>=0&&y>=0&&x<W&&y<H&&s[(y*W+x)*4+3]>120;
  for(let y=0;y<H;y++)for(let x=0;x<W;x++){const i=(y*W+x)*4;if(s[i+3]<=120)continue;const lit=!op(x-1,y)||!op(x,y-1),dk=!op(x+1,y)||!op(x,y+1);if(lit===dk)continue;
    for(let j=0;j<3;j++)a[i+j]=lit?Math.min(255,s[i+j]*1.2+16):s[i+j]*.66}
  g.putImageData(d,0,0)}
// idle breathing: the upper body sinks one pixel on the out-breath
function breathe(c){const g=c.getContext('2d'),W=c.width,H=c.height,cut=Math.round(H*.58),d=g.getImageData(0,0,W,cut);g.clearRect(0,0,W,cut+1);g.putImageData(d,0,1)}
function sprite(key,w,h,paint,noOutline,post){let c=SPR.get(key);if(c)return c;c=mk(w+2,h+2);const g=c.getContext('2d');
  const R=(x,y,ww,hh,col)=>{if(!col)return;g.fillStyle=col;g.fillRect(x+1,y+1,ww,hh)};paint(R,g);if(post)post(c);if(!noOutline)outline(c);SPR.set(key,c);return c}
const faceDir=a=>{const c=Math.cos(a),s=Math.sin(a);return Math.abs(c)>Math.abs(s)*1.15?(c>0?'r':'l'):(s>0?'d':'u')};

/* humans: adult 12×22, child 10×16 */
function paintAdult(R,o,dir,f){
  const sd=dir==='r'||dir==='l',st=f===1?1:f===3?2:0,skin=o.skin||'#e0b48c',skinD='#b8875f',hair=o.hair||'#1c1820',top=o.top,topD=shadeHex(top,.7),topL=shadeHex(top,1.25),bot=o.bot||'#2a2e3a',botD=shadeHex(bot,.7),shoe='#151418';
  if(!sd){
    const ll=st===1?1:0,rl=st===2?1:0;R(3,16,2,5-ll,bot);R(7,16,2,5-rl,botD);R(5,16,2,2,bot);R(3,21-ll,2,1,shoe);R(7,21-rl,2,1,shoe);
    R(3,8,6,8,top);R(8,9,1,7,topD);R(3,8,6,1,topL);
    const la=st===1?-1:0,ra=st===2?-1:0;R(2,9+la,1,6,top);R(9,9+ra,1,6,topD);R(2,15+la,1,1,skin);R(9,15+ra,1,1,skin);
    if(o.elder){R(10,12,1,10,'#7a5a34')}
    if(o.torch&&dir==='d'){R(9,13+ra,2,3,'#3a3d44');R(9,16+ra,2,1,'#fff2b0')}
    if(dir==='d'){
      R(2,0,8,8,o.style==='bald'?skin:hair);R(3,3,6,5,skin);R(3,7,6,1,skinD);R(4,5,1,1,'#1a1418');R(7,5,1,1,'#1a1418');
      if(o.style==='bald'){R(2,3,1,2,hair);R(9,3,1,2,hair);R(3,0,6,1,skinD)}
      if(o.style==='long'){R(1,3,2,9,hair);R(9,3,2,9,hair)}
      if(o.style==='bun'){R(4,-1,4,2,hair)}
      if(o.elder){R(3,6,1,1,skinD);R(8,6,1,1,skinD)}
      if(o.cap){R(2,0,8,3,o.cap);R(1,3,10,1,shadeHex(o.cap,.6));R(3,4,6,1,skinD)}
      R(5,8,2,1,skinD)}
    else{R(2,0,8,8,o.style==='bald'?skin:hair);R(2,6,8,2,shadeHex(o.style==='bald'?skin:hair,.8));if(o.style==='long')R(2,6,8,6,hair);if(o.style==='bun')R(4,-1,4,3,hair);if(o.style==='bald'){R(2,4,8,3,hair)}
      if(o.cap){R(2,0,8,4,o.cap)}}
  }else{
    if(st===0){R(5,16,3,5,bot);R(5,21,4,1,shoe)}else{R(7,16,2,5,bot);R(7,21,3,1,shoe);R(3,16,2,5,botD);R(2,21,3,1,shoe)}
    R(4,8,5,8,top);R(4,8,5,1,topL);R(8,9,1,7,topD);
    if(st===1){R(7,9,2,5,topD);R(8,14,1,1,skin)}else if(st===2){R(3,9,2,5,topD);R(3,14,1,1,skin)}else{R(5,9,2,6,topD);R(6,15,1,1,skin)}
    if(o.elder){R(10,12,1,10,'#7a5a34');R(9,12,2,1,'#7a5a34')}
    if(o.torch){R(8,11,3,2,'#3a3d44');R(11,11,1,2,'#fff2b0')}
    R(3,0,7,8,o.style==='bald'?skin:hair);R(6,3,4,5,skin);R(10,5,1,1,skin);R(8,5,1,1,'#1a1418');R(6,7,4,1,skinD);
    if(o.style==='long')R(2,3,3,9,hair);if(o.style==='bun')R(2,0,3,3,hair);if(o.style==='bald'){R(3,0,7,3,skinD);R(3,3,3,3,hair)}
    if(o.cap){R(3,0,7,3,o.cap);R(6,3,6,1,shadeHex(o.cap,.6))}
  }
}
function paintChild(R,o,dir,f){
  const sd=dir==='r'||dir==='l',st=f===1?1:f===3?2:0,skin='#e6bb94',skinD='#bd8d66',hair='#1c1820',top=o.top,topD=shadeHex(top,.7),bot='#33405a',shoe='#151418';
  if(!sd){const ll=st===1?1:0,rl=st===2?1:0;R(2,12,2,3-ll,bot);R(6,12,2,3-rl,bot);R(2,15-ll,2,1,shoe);R(6,15-rl,2,1,shoe);
    R(2,7,6,5,top);R(7,8,1,4,topD);R(1,8,1,3,top);R(8,8,1,3,topD);R(1,11,1,1,skin);R(8,11,1,1,skin);
    R(1,0,8,7,hair);if(dir==='d'){R(2,2,6,5,skin);R(2,6,6,1,skinD);R(3,4,1,1,'#1a1418');R(6,4,1,1,'#1a1418')}
    if(o.style==='buns'){R(0,0,2,2,hair);R(8,0,2,2,hair)}}
  else{if(st===0){R(4,12,2,3,bot);R(4,15,3,1,shoe)}else{R(5,12,2,3,bot);R(5,15,3,1,shoe);R(2,12,2,3,bot);R(1,15,3,1,shoe)}
    R(3,7,5,5,top);R(7,8,1,4,topD);R(4,8,2,3,topD);R(5,11,1,1,skin);
    R(2,0,7,7,hair);R(5,2,4,5,skin);R(9,4,1,1,skin);R(7,4,1,1,'#1a1418');if(o.style==='buns')R(1,0,2,2,hair)}
}
function humanSprite(h,dir,f){
  const isP=h.isPlayer,child=h.child,o={top:isP?'#2f4466':h.shirt,cap:isP?'#1d2638':null,torch:isP,elder:h.elder,style:isP?'short':h.hair||'short',hair:h.elder?'#b7b2a8':'#1c1820',bot:isP?'#2c3550':h.elder?'#3a3a3a':'#2a2e3a'};
  const d=dir==='l'?'r':dir;const key=(isP?'P':h.name)+d+f;
  return child?sprite(key,10,16,R=>paintChild(R,o,d,f)):sprite(key,12,22,R=>paintAdult(R,o,d,f))}

/* monsters — each faithful to its folklore look, four directions plus a scare frame */
const MON_SIZE={mosin:[14,18],tiger:[16,24],kuchi:[14,28],jiang:[18,28],suigui:[14,24]};
const MPAINT={
  mosin(R,dir,f,scare){ // small red-faced child-like figure, grass-and-straw hair, straw cape, long arms
    const G1='#2f5226',G2='#4a7a32',G3='#6a9a3e',F='#b8352a',FD='#8a2219',E='#0b0b0b',Y='#f2d04a',C='#6e5e33',CD='#4e4224',L='#7a2f22',LD='#5a2018',st=f===1?1:f===3?2:0;
    if(scare){R(0,1,2,10,L);R(12,1,2,10,L);R(0,0,1,1,LD);R(1,0,1,1,LD);R(12,0,1,1,LD);R(13,0,1,1,LD);
      R(1,0,12,4,G1);R(0,1,1,3,G2);R(13,1,1,3,G2);R(3,-1,1,2,G3);R(7,-1,1,2,G2);R(10,-1,1,2,G3);
      R(2,4,10,7,F);R(11,4,1,7,FD);R(3,5,3,2,Y);R(8,5,3,2,Y);R(4,5,1,2,E);R(9,5,1,2,E);R(3,8,8,3,'#2a0505');[3,5,7,9].forEach(x=>R(x,8,1,1,'#f2ecd8'));[4,6,8].forEach(x=>R(x,10,1,1,'#f2ecd8'));
      R(2,11,10,5,C);R(4,12,1,3,CD);R(8,12,1,3,CD);R(5,16,1,2,L);R(8,16,1,2,L);return}
    if(dir==='u'){R(1,0,12,11,G1);R(3,1,8,8,G2);R(5,0,1,1,G3);R(9,2,1,1,G3);R(0,3,1,4,G1);R(13,3,1,4,G1);R(2,11,10,5,C);R(2,15,10,1,CD);
      R(1,10+(st===1?-1:0),1,6,L);R(12,10+(st===2?-1:0),1,6,L);R(5,16,1,2-(st===1?1:0),L);R(8,16,1,2-(st===2?1:0),L);return}
    if(dir==='r'){R(3,0,9,5,G1);R(4,0,1,1,G3);R(8,-1,1,2,G2);R(11,1,2,2,G2);R(2,3,2,5,G1);R(6,4,6,6,F);R(5,5,1,2,F);R(11,4,1,6,FD);R(8,5,3,2,E);R(9,5,1,1,Y);R(11,8,2,1,'#3a0a08');R(12,6,1,1,FD);
      R(3,10,8,6,C);R(4,11,1,4,CD);R(7,11,1,4,CD);const fw=st===1?2:st===2?-1:0;R(8+fw,10,2,7,L);R(9+fw,16,2,1,LD);
      if(st===0){R(5,16,2,2,L)}else{R(7,16,1,2,L);R(4,16,1,2,LD)}return}
    R(2,1,10,4,G1);R(1,2,12,3,G2);R(3,0,1,2,G2);R(6,-1,1,2,G3);R(9,0,1,2,G2);R(0,4,2,2,G1);R(12,4,2,2,G1);R(4,2,1,1,G3);R(8,3,1,1,G3);
    R(2,5,10,5,F);R(3,10,8,1,FD);R(10,5,1,5,FD);R(1,6,1,2,F);R(12,6,1,2,F);R(3,6,3,2,E);R(8,6,3,2,E);R(4,6,1,1,Y);R(9,6,1,1,Y);R(6,8,2,1,FD);R(5,9,4,1,'#3a0a08');R(5,9,1,1,'#f2ecd8');R(8,9,1,1,'#f2ecd8');
    R(2,11,10,4,C);[2,6,7,11].forEach(x=>R(x,15,1,1,CD));R(4,12,1,3,CD);R(8,12,1,3,CD);
    R(1,11+(st===1?-1:0),1,5,L);R(12,11+(st===2?-1:0),1,5,L);R(0,16+(st===1?-1:0),2,1,LD);R(12,16+(st===2?-1:0),2,1,LD);
    R(5,15,1,3-(st===1?1:0),L);R(8,15,1,3-(st===2?1:0),L)},
  tiger(R,dir,f,scare,reveal){ // a hunched granny in an indigo 大襟衫; the tiger shows through: tail, claws, ears, yellow eyes
    const H='#a9a49a',HD='#7d786f',SK='#d8ae86',SD='#a97d58',T='#3b3561',TD='#28234a',TL='#55508a',TR='#c9993c',PA='#1e1b26',SH='#7a2420',TG='#d7832e',ST='#1a120a',CL='#f0ead8',EY='#ffd23a',st=f===1?1:f===3?2:0;
    const tail=(pts)=>pts.forEach(([x,y],i)=>R(x,y,1,1,i%3===1?ST:TG));
    if(scare){R(2,1,12,10,TG);R(2,0,3,2,TG);R(11,0,3,2,TG);R(3,1,1,1,'#f0b080');R(12,1,1,1,'#f0b080');R(7,1,2,3,ST);R(4,2,1,2,ST);R(11,2,1,2,ST);R(2,6,2,1,ST);R(12,6,2,1,ST);R(13,4,1,1,ST);R(2,4,1,1,ST);
      R(4,4,3,2,EY);R(9,4,3,2,EY);R(5,4,1,2,'#000');R(10,4,1,2,'#000');R(5,7,6,2,'#efe6d2');R(7,7,2,1,'#3a1a10');R(5,9,6,3,'#2a0505');R(5,9,1,2,CL);R(10,9,1,2,CL);R(6,11,1,1,CL);R(9,11,1,1,CL);
      R(6,-1,4,1,H);R(3,12,10,8,T);R(9,12,1,1,TR);R(10,13,1,1,TR);R(11,14,1,1,TR);R(0,5,2,7,TG);R(14,5,2,7,TG);R(0,4,1,1,CL);R(1,3,1,1,CL);R(15,4,1,1,CL);R(14,3,1,1,CL);R(0,7,2,1,ST);R(14,7,2,1,ST);
      R(4,20,3,2,PA);R(9,20,3,2,PA);R(4,22,3,1,SH);R(9,22,3,1,SH);tail([[14,17],[15,16],[15,15],[15,14]]);return}
    const lift=st===1?1:0,lift2=st===2?1:0;
    if(dir==='u'){R(6,0,4,2,H);R(3,2,10,8,H);R(3,8,10,2,HD);R(2,10,12,8,T);R(12,10,2,8,TD);R(4,18,3,3,PA);R(9,18,3,3,PA);R(4,21-lift,3,1,SH);R(9,21-lift2,3,1,SH);
      tail([[8,17],[8,18],[8,19],[9,20],[10,20],[11,20],[12,19],[12,18],[13,17],[13,16]]);R(1,11,1,6,T);R(14,11,1,6,TD);return}
    if(dir==='r'){R(7,1,3,2,H);R(6,3,6,3,H);R(6,5,3,4,HD);R(9,5,5,6,SK);R(14,7,1,1,SK);R(12,6,2,1,reveal?EY:'#2a1a10');R(12,9,2,1,reveal?'#3a0a08':'#5a2a20');R(10,10,4,1,SD);
      if(reveal){R(7,2,2,2,TG);R(8,3,1,1,ST)}
      R(3,11,9,8,T);R(3,11,4,2,TL);R(10,12,1,1,TR);R(11,13,1,1,TR);R(11,11,1,8,TD);
      R(8,12,2,5,TD);R(10,17,2,1,reveal?TG:SK);if(reveal){R(12,17,1,1,CL)}
      tail(reveal?[[2,14],[1,15],[1,16],[1,17],[0,18],[0,19],[1,20],[2,20]]:[[2,17],[1,18],[1,19]]);
      if(st===0){R(5,19,4,3,PA);R(5,22,5,1,SH)}else{R(7,19,3,3,PA);R(7,22,4,1,SH);R(3,19,3,3,PA);R(2,22,4,1,SH)}return}
    R(6,0,4,2,H);R(7,0,2,1,HD);R(3,2,10,3,H);R(3,4,1,3,HD);R(12,4,1,3,HD);R(4,4,8,7,SK);R(4,10,8,1,SD);R(4,8,1,1,SD);R(11,8,1,1,SD);
    if(reveal){R(3,1,2,2,TG);R(11,1,2,2,TG);R(4,1,1,1,ST);R(11,1,1,1,ST);R(5,6,2,1,EY);R(9,6,2,1,EY);R(6,6,1,1,'#000');R(9,6,1,1,'#000');R(6,9,4,1,'#3a0a08');R(6,10,1,1,CL);R(9,10,1,1,CL)}
    else{R(5,6,2,1,'#2a1a10');R(9,6,2,1,'#2a1a10');R(7,9,2,1,'#5a2a20')}
    R(2,11,12,8,T);R(8,11,1,1,TL);R(9,12,1,1,TR);R(10,13,1,1,TR);R(11,14,1,1,TR);R(12,11,2,8,TD);R(2,18,12,1,TD);
    R(1,12+(st===1?-1:0),2,5,T);R(13,12+(st===2?-1:0),2,5,TD);
    if(reveal){R(0,17,3,2,TG);R(13,17,3,2,TG);R(1,17,1,1,ST);R(14,17,1,1,ST);R(0,19,1,1,CL);R(2,19,1,1,CL);R(13,19,1,1,CL);R(15,19,1,1,CL);tail([[14,20],[15,19],[15,18],[15,17]])}
    else{R(1,17,2,1,SK);R(13,17,2,1,SK)}
    R(4,19,3,3,PA);R(9,19,3,3,PA);R(7,19,2,1,PA);R(4,22-lift,3,1,SH);R(9,22-lift2,3,1,SH)},
  kuchi(R,dir,f,scare){ // tall woman, long black hair, white surgical mask, red coat, heels
    const H='#141018',HL='#2e2836',S='#ead9c6',SD='#c4ae96',M='#f2f0ea',MD='#c8c6c0',C='#9b1d1d',CD='#6a1212',CL='#c23a2c',B='#3a0a0a',BK='#c9993c',L='#d8c8b4',HE='#0e0e10',st=f===1?1:f===3?2:0;
    if(dir==='u'){R(3,0,8,4,H);R(2,3,10,16,H);R(5,1,2,1,HL);R(4,5,1,10,HL);R(9,6,1,9,HL);R(3,18,8,4,C);R(2,20,10,2,CD);R(1,12,1,7,C);R(12,12,1,7,CD);
      R(5,22,1,4-(st===1?1:0),L);R(8,22,1,4-(st===2?1:0),L);R(4,26-(st===1?1:0),2,1,HE);R(8,26-(st===2?1:0),2,1,HE);return}
    if(dir==='r'&&!scare){R(4,0,7,4,H);R(3,3,4,16,H);R(4,6,1,10,HL);R(7,3,4,8,S);R(7,3,4,1,H);R(9,6,1,1,'#1a0e10');R(8,8,4,3,M);R(8,10,4,1,MD);R(11,9,1,1,MD);
      R(5,11,6,11,C);R(5,11,2,3,CL);R(5,15,6,1,B);R(9,15,1,1,BK);R(10,11,1,11,CD);R(4,20,8,2,C);R(4,21,8,1,CD);
      if(st===1){R(8,12,2,7,CD);R(9,19,1,1,S)}else if(st===2){R(4,12,2,7,CD);R(4,19,1,1,S)}else{R(6,12,2,8,CD);R(7,20,1,1,S)}
      if(st===0){R(7,22,1,4,L);R(6,26,3,1,HE);R(8,27,1,1,HE)}else{R(9,22,1,4,L);R(8,26,3,1,HE);R(5,22,1,4,L);R(4,26,3,1,HE)}return}
    R(3,0,8,4,H);R(5,1,2,1,HL);R(2,3,2,14,H);R(10,3,2,14,H);R(2,17,1,1,H);R(11,17,1,1,H);R(4,3,6,8,S);R(4,3,6,1,H);R(4,4,2,1,H);R(8,4,2,1,H);
    if(scare){R(4,6,2,1,'#fff');R(8,6,2,1,'#fff');R(5,6,1,1,'#400');R(8,6,1,1,'#400');R(2,9,10,1,'#7a0808');R(2,8,1,1,'#7a0808');R(11,8,1,1,'#7a0808');R(3,10,8,1,'#5a0606');
      [4,6,8].forEach(x=>R(x,9,1,1,'#eee'));[5,7,9].forEach(x=>R(x,10,1,1,'#ddd'));R(3,11,1,1,'#7a0808');
      R(12,5,1,8,C);R(12,4,2,2,S);R(13,0,1,5,'#c8ccd4');R(14,-1,1,4,'#9aa0aa');R(12,6,1,1,'#222')}
    else{R(5,6,1,1,'#1a0e10');R(8,6,1,1,'#1a0e10');R(5,7,1,1,SD);R(8,7,1,1,SD);R(4,8,6,3,M);R(4,10,6,1,MD);R(3,8,1,1,MD);R(10,8,1,1,MD);R(4,9,1,1,'#9a2a2a');R(9,9,1,1,'#9a2a2a')}
    R(6,11,2,1,SD);R(3,11,8,11,C);R(4,11,2,3,CL);R(8,11,2,3,CL);R(6,12,2,1,S);R(3,15,8,1,B);R(6,15,2,1,BK);R(9,11,2,11,CD);R(2,20,10,2,C);R(2,21,10,1,CD);
    R(2,12+(st===1?-1:0),1,8,C);if(!scare)R(11,12+(st===2?-1:0),1,8,CD);R(2,20+(st===1?-1:0),1,1,S);if(!scare)R(11,20+(st===2?-1:0),1,1,S);
    R(5,22,1,4-(st===1?1:0),L);R(8,22,1,4-(st===2?1:0),L);R(4,26-(st===1?1:0),2,1,HE);R(8,26-(st===2?1:0),2,1,HE);R(5,27-(st===1?1:0),1,1,HE);R(8,27-(st===2?1:0),1,1,HE)},
  jiang(R,dir,f,scare,sealed){ // Qing official robe with a 補子 badge, official hat with red tassel, yellow talisman over the face, arms held out
    const HB='#15151b',HL='#2c2c38',FI='#c0392b',TA='#8f2318',TL='#e6c95a',TD='#b89a34',INK='#b8241a',SK='#9fb39a',SD='#768b72',RB='#1c2536',RD='#121827',RL='#2f3c58',BG='#c99a3c',BD='#8a6420',BI='#e8e0c8',SO='#d8d4cc',BO='#101014',NA='#d8e0c8',air=f===1;
    const talis=(x,y)=>{R(x,y,4,10,TL);R(x+3,y,1,10,TD);R(x+1,y+1,2,1,INK);R(x+1,y+3,1,2,INK);R(x+2,y+4,1,1,INK);R(x,y+6,3,1,INK);R(x+1,y+7,1,2,INK)};
    if(dir==='u'){R(8,0,2,1,FI);R(5,1,8,2,TA);R(6,3,6,1,HB);R(3,4,12,2,HB);R(3,4,12,1,HL);R(5,6,8,6,'#14141a');R(8,6,2,11,'#0a0a0e');R(3,13,12,11,RB);R(3,13,12,1,RL);R(6,16,6,5,BG);R(6,16,6,1,BD);R(8,17,2,2,BI);
      R(1,13,2,3,RB);R(15,13,2,3,RB);R(2,23,14,2,RD);R(5,25,3,2,BO);R(10,25,3,2,BO);R(5,27,3,1,SO);R(10,27,3,1,SO);return}
    if(dir==='r'){R(7,0,2,1,FI);R(4,1,8,2,TA);R(5,3,6,1,HB);R(2,4,13,2,HB);R(2,4,13,1,HL);R(6,6,6,7,SK);R(6,12,6,1,SD);R(3,6,2,11,'#0a0a0e');
      if(scare){R(11,1,4,6,TL);R(12,2,2,1,INK);R(9,8,2,1,'#e03a2a');R(9,10,3,2,'#1a0505');R(9,10,1,1,NA);R(11,10,1,1,NA)}else talis(11,5+(air?-1:0));
      R(4,13,9,11,RB);R(4,13,9,1,RL);R(10,13,2,11,RD);R(7,13,10,3,RB);R(7,13,10,1,RL);R(16,13,1,3,RL);R(17,15,1,2,SK);R(16,16,2,1,NA);
      R(3,22+(air?0:1),11,2,RD);R(6,25,4,2,BO);R(6,27,5,1,SO);return}
    R(8,0,2,1,FI);R(5,1,8,2,TA);R(6,3,6,1,HB);R(3,4,12,2,HB);R(3,4,12,1,HL);R(5,6,8,7,SK);R(5,12,8,1,SD);
    if(scare){R(6,8,2,1,'#e03a2a');R(10,8,2,1,'#e03a2a');R(7,10,4,2,'#1a0505');R(7,10,1,1,NA);R(10,10,1,1,NA);R(7,-2,4,6,TL);R(8,-1,2,1,INK);R(8,1,1,2,INK)}
    else talis(7,5);
    R(3,13,12,2,RB);R(4,15,10,9,RB);R(4,13,10,1,RL);R(6,16,6,5,BG);R(6,16,6,1,BD);R(6,20,6,1,BD);R(8,17,2,2,BI);R(12,15,2,9,RD);
    const ay=air?-1:0;R(0,13+ay,4,4,RB);R(14,13+ay,4,4,RB);R(0,13+ay,4,1,RL);R(14,13+ay,4,1,RL);R(1,14+ay,2,2,'#05060a');R(15,14+ay,2,2,'#05060a');
    R(0,17+ay,3,2,SK);R(15,17+ay,3,2,SK);R(0,19+ay,1,1,NA);R(2,19+ay,1,1,NA);R(15,19+ay,1,1,NA);R(17,19+ay,1,1,NA);
    if(air){R(2,23,14,2,RD)}else{R(3,23,12,2,RD)}R(5,25,3,2,BO);R(10,25,3,2,BO);R(5,27,3,1,SO);R(10,27,3,1,SO)},
  suigui(R,dir,f,scare){ // drowned: wet hair hanging over the face, pale grey-green skin, long hands, dripping
    const H='#0d1014',HL='#26323c',DR='#6a9aa6',S='#a9bdb4',SD='#7d9189',C='#8d9894',CD='#5f6a66',st=f===1?1:f===3?2:0;
    if(scare){R(0,-1,2,9,S);R(12,-1,2,9,S);R(0,-2,1,1,SD);R(1,-3,1,2,S);R(13,-2,1,1,SD);R(12,-3,1,2,S);R(3,0,8,3,H);R(2,2,2,12,H);R(10,2,2,12,H);
      R(4,3,6,9,S);R(4,11,6,1,SD);R(5,5,2,2,'#000');R(8,5,2,2,'#000');R(6,9,3,2,'#000');R(4,3,1,4,H);R(9,3,1,3,H);
      R(3,12,8,8,C);R(3,19,1,1,CD);R(6,20,1,1,CD);R(9,19,1,1,CD);R(5,20,1,3,S);R(8,20,1,3,S);R(3,15,1,1,DR);R(10,17,1,1,DR);return}
    if(dir==='u'){R(3,0,8,2,H);R(2,2,10,15,H);R(4,3,1,10,HL);R(9,4,1,10,HL);[2,4,6,8,10].forEach((x,i)=>R(x,17,1,1+(i%2),H));R(1,10,1,9,S);R(12,10,1,9,S);R(5,19,1,4,S);R(8,19,1,4,S);return}
    if(dir==='r'){R(3,0,8,3,H);R(3,2,7,13,H);R(9,4,2,9,H);R(5,4,1,8,HL);R(9,7,1,1,'#e8f4ee');R(9,15,1,1,DR);R(4,15,1,1,DR);
      const ar=st===1?1:0;R(8,11-ar,5,1,S);R(12,11-ar,1,2,SD);R(4,12,6,8,C);R(4,19,1,1,CD);R(7,20,1,1,CD);if(st===0){R(6,20,2,3,S)}else{R(8,20,1,3,S);R(5,20,1,3,S)}return}
    R(3,0,8,2,H);R(2,2,10,12,H);R(4,3,1,8,HL);R(9,4,1,7,HL);R(7,6,2,2,'#e8f4ee');R(8,7,1,1,'#000');[2,4,6,8,10,11].forEach((x,i)=>R(x,14,1,1+(i%3),H));
    R(3,16,1,1,DR);R(9,17,1,1,DR);R(6,16,1,1,DR);R(3,12,8,8,C);R(3,19,1,1,CD);R(5,20,1,1,CD);R(8,19,1,1,CD);R(10,20,1,1,CD);
    R(1,10+(st===1?-1:0),1,10,S);R(12,10+(st===2?-1:0),1,10,S);R(1,20+(st===1?-1:0),1,2,SD);R(12,20+(st===2?-1:0),1,2,SD);R(5,20,1,3-(st===1?1:0),S);R(8,20,1,3-(st===2?1:0),S)},
};
function monSprite(type,dir,f,mode,breath){ // mode: '' | 'scare' | 'reveal' | 'sealed'; breath: idle out-breath frame
  const[w,h]=MON_SIZE[type],d=dir==='l'?'r':dir,ff=type==='jiang'?(f%2):f;const key=type+d+ff+mode+(breath?'b':'');
  return sprite(key,w,h+3,(R)=>{const R2=(x,y,ww,hh,c)=>R(x,y+3,ww,hh,c);MPAINT[type](R2,d,ff,mode==='scare',type==='tiger'?mode==='reveal':undefined)},false,c=>{if(breath)breathe(c);if(mode==='tilt')tiltHead(c);if(mode==='bow'){breathe(c);breathe(c)}shadePass(c)})}
// 'tilt': the head leans one pixel over (top rows sheared), the 魔神仔's curious, wrong little tilt while it watches you
function tiltHead(c){const g=c.getContext('2d'),W=c.width,H=c.height,a=Math.round(H*.2),b=Math.round(H*.42),top=g.getImageData(0,0,W,a),mid=g.getImageData(0,a,W,b-a);g.clearRect(0,0,W,b);g.putImageData(top,2,0);g.putImageData(mid,1,a)}

/* ---------------- close-ups for the capture lunge (v2): 64×64 art pixels, f 0 = face in the dark, 1 = it opens, 2 = it lands ----------------
   Each face is modelled as a little height field: ellipsoids and tapered strokes are raised, carved or painted with a material,
   then lit by a torch held low (light from below-front), quantised to a 5-step ramp per material with 2×2 ordered dither,
   and finished with hand-placed pixels (pupils, glints, veins, teeth, ink). Light from below leaves brows, sockets and crowns in the dark. */
const CU=64,BAYER=[0,.5,.75,.25],LIGHT=(()=>{const v=[-.22,.72,.66],l=Math.hypot(...v);return v.map(a=>a/l)})();
const RAMP={ // dark → light; a limited night palette, saturated only where it matters
  skinOld:['#1a1513','#4c403a','#8a7a6e','#c0ae9c','#ece0ce'],fur:['#100804','#3a1c0a','#7a3e12','#bc6c1e','#e8a440'],stripe:['#040302','#0a0604','#140c06','#20140a','#2e1e10'],
  skinPale:['#0c090b','#2e2529','#605256','#9c8c8c','#d6c8c0'],skinCorpse:['#060a08','#18221c','#34443a','#5c6e5c','#8a9c84'],skinRed:['#120403','#3a0e0a','#6e1c12','#a2301e','#cc5634'],
  skinDrown:['#060a0c','#1a282c','#3a5052','#66807c','#9cb4aa'],skinChild:['#0c0a0a','#2c2424','#5e5250','#9c8c86','#d8cac0'],
  hairBlack:['#020203','#08080b','#121218','#1e1e26','#30303c'],hairGrey:['#1e1e1e','#4c4a48','#84807a','#bcb8b0','#ece8e0'],hairWet:['#020304','#060a0c','#0e161a','#1a2a30','#3a5660'],
  straw:['#0a0804','#2a2210','#544420','#86703a','#b09a5a'],grass:['#040804','#0e1c0c','#1e3618','#345226','#4e6e32'],
  eye:['#140c0a','#4a3632','#8a7268','#c4b0a2','#ece2d8'],eyeMilk:['#101416','#3a4648','#76888a','#aec0bc','#dce8e2'],
  mouthDark:['#000000','#020304','#060a0c','#0c1418','#142026'],
  mouth:['#020000','#0e0202','#220505','#3a0a0a','#561212'],gum:['#140303','#3e0a0a','#6e1414','#9c2222','#c43a36'],lip:['#140606','#3a1210','#6a2420','#8e3a32','#b05a4c'],
  teeth:['#141008','#4a4232','#867a5e','#bcae88','#e6dcbc'],nail:['#16140a','#3e3a22','#6e683e','#a09858','#ccc488'],steel:['#3a4048','#626a76','#8e98a6','#bcc6d2','#eef4fa'],
  indigo:['#040409','#0e0c20','#1c1940','#2e2a5a','#44407a'],redCoat:['#0c0202','#320606','#5e0e0e','#8a1818','#b02a24'],robe:['#030407','#090c14','#121a28','#1c2840','#283a58'],
  hatBlack:['#040406','#10121a','#1e2230','#2e3446','#46506a'],tassel:['#0e0202','#3e0806','#781410','#ae2a1e','#d84a34'],gold:['#120c02','#3e2c08','#7a5a18','#b48a30','#e0bc5a'],
  hemp:['#0c0b09','#2e2b25','#5c574c','#8e887a','#bdb6a4'],rope:['#0c0904','#2e220e','#5a4420','#86683a','#ac8e58'],shadow:['#000000','#020202','#050405','#0a090a','#121012'],
  dress:['#0c0202','#360406','#680a0e','#9a1418','#c42a2a'],collar:['#141212','#46423e','#86807a','#c0bab2','#e8e2da'],rag:['#08090a','#1e2224','#3c4244','#626a6a','#8c9494'],
};
const CU_LIFT={eye:.28,eyeMilk:.34,teeth:.2,steel:.15,skinOld:.24,hairGrey:.26,hatBlack:.12,fur:.06};   // wet things catch the torch even inside a socket
function faceBuild(paint,f){
  const N=CU*CU,H=new Float32Array(N).fill(-1e9),M=new Array(N).fill(null),ops=[],det=[];let ta=0,tx=32,ty=32;
  const k={tilt(a,cx,cy){ta=a;tx=cx;ty=cy},
    E(cx,cy,rx,ry,amp,mat,mode,z){ops.push([0,cx,cy,rx,ry,amp,mat,mode||'base',z||0])},
    L(x0,y0,x1,y1,w0,w1,amp,mat,mode,z){ops.push([1,x0,y0,x1,y1,w0,w1,amp,mat,mode||'base',z||0])},
    D(x,y,col,w,h){det.push([x,y,w||1,h||1,col,0])},S(x,y,col,w,h){det.push([x,y,w||1,h||1,col,1])}};
  paint(k,f);const ca=Math.cos(ta),sa=Math.sin(ta);
  for(let y=0;y<CU;y++)for(let x=0;x<CU;x++){const i=y*CU+x,px=x+.5-tx,py=y+.5-ty,u=px*ca+py*sa+tx,v=-px*sa+py*ca+ty;
    for(const o of ops){let s,amp,mat,mode,z;
      if(o[0]===0){const dx=(u-o[1])/o[3],dy=(v-o[2])/o[4],d2=dx*dx+dy*dy;if(d2>=1)continue;s=Math.sqrt(1-d2);amp=o[5];mat=o[6];mode=o[7];z=o[8]}
      else{const ax=o[1],ay=o[2],bx2=o[3]-ax,by=o[4]-ay,l2=bx2*bx2+by*by||1,t=Math.max(0,Math.min(1,((u-ax)*bx2+(v-ay)*by)/l2)),w=o[5]+(o[6]-o[5])*t,ex=u-ax-bx2*t,ey=v-ay-by*t,d2=(ex*ex+ey*ey)/(w*w);if(d2>=1)continue;s=Math.sqrt(1-d2);amp=o[7];mat=o[8];mode=o[9];z=o[10]}
      if(mode==='base'){const val=z+amp*s;if(val>H[i]){H[i]=val;M[i]=mat}}
      else if(!M[i])continue;else if(mode==='add'){H[i]+=amp*s;if(mat)M[i]=mat}else if(mode==='sub'){H[i]-=amp*s;if(mat)M[i]=mat}else if(mode==='paint'){M[i]=mat}else if(mode==='cut'){H[i]=-1e9;M[i]=null}}}
  // ambient occlusion from a blurred height field: carved sockets and mouths fall into shadow
  const Hb=new Float32Array(N);for(let y=0;y<CU;y++)for(let x=0;x<CU;x++){const i=y*CU+x;if(!M[i])continue;let s=0,n=0;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const xx=x+dx,yy=y+dy;if(xx<0||yy<0||xx>=CU||yy>=CU)continue;const j=yy*CU+xx;s+=M[j]?H[j]:H[i]-4;n++}Hb[i]=s/n}
  const c=mk(CU,CU),g=c.getContext('2d'),img=g.createImageData(CU,CU),a=img.data,hh=(j,i)=>M[j]?H[j]:H[i];
  for(let y=0;y<CU;y++)for(let x=0;x<CU;x++){const i=y*CU+x,m=M[i];if(!m)continue;
    const l=x>0?hh(i-1,i):H[i],r=x<CU-1?hh(i+1,i):H[i],u=y>0?hh(i-CU,i):H[i],d=y<CU-1?hh(i+CU,i):H[i];let nx=-(r-l)*.24,ny=-(d-u)*.24,nz=1;const nl=Math.hypot(nx,ny,nz);nx/=nl;ny/=nl;nz/=nl;
    const dif=Math.max(0,nx*LIGHT[0]+ny*LIGHT[1]+nz*LIGHT[2]),fall=(.3+.8*Math.min(1,Math.max(0,(y-4)/54)))*(1-.4*((x-32)/32)**2),ao=Math.min(.55,Math.max(0,(Hb[i]-H[i])*.06));
    const lvl=.03+Math.pow(dif,1.4)*fall*1.2-ao+(CU_LIFT[m]||0),idx=Math.max(0,Math.min(4,Math.floor(lvl*4.4+BAYER[(x&1)+(y&1)*2]*.6))),col=rgb(RAMP[m][idx]),p=i*4;a[p]=col[0];a[p+1]=col[1];a[p+2]=col[2];a[p+3]=255}
  g.putImageData(img,0,0);
  for(const[x,y,w,h2,col,scr]of det){g.fillStyle=col;if(scr){g.fillRect(x,y,w,h2);continue}
    for(let yy=0;yy<h2;yy++)for(let xx=0;xx<w;xx++){const px=x+xx+.5-tx,py=y+yy+.5-ty;g.fillRect(Math.floor(px*ca-py*sa+tx),Math.floor(px*sa+py*ca+ty),1,1)}}
  return c}
// shared anatomy: a human head with sockets, cheekbones, nose, lips and jaw; o.* bends it (asymmetry is the point)
function headPx(k,o){const{E,L}=k,cx=o.cx,cy=o.cy,S=o.skin;
  E(cx,cy,o.w,o.h,14,S);E(cx+(o.jx||0),cy+o.h*.62,o.jw||o.w*.68,o.h*.4,10,S,'base',1);
  E(cx-8,cy+3,6,4,o.cheek||3,null,'add');E(cx+8,cy+3,6,4,o.cheek||3,null,'add');if(o.hollow){E(cx-8,cy+9,4,5,o.hollow,null,'sub');E(cx+8,cy+9,4,5,o.hollow,null,'sub')}
  E(cx-7,cy-6,7,2.6,3.4,null,'add');E(cx+7,cy-6,7,2.6,3.4,null,'add');
  for(const[s,ex,ey,op]of[[-1,o.eLx||cx-7,o.eLy||cy-1,o.eL],[1,o.eRx||cx+7,o.eRy||cy-1,o.eR]]){E(ex,ey,5.2,3.9,o.sock||6,null,'sub');if(op>0)E(ex,ey,3.6,Math.max(.6,op*2.3),2.4,o.eyeMat||'eye','add')}
  L(cx,cy-4,cx+(o.nx||.6),cy+6,1.6,2.6,4.4,null,'add');E(cx+(o.nx||.6),cy+7,3.2,2,3,null,'add');E(cx-1.4+(o.nx||0),cy+8.2,1,.8,2.4,null,'sub');E(cx+2.2+(o.nx||0),cy+8.2,1,.8,2.4,null,'sub');
  const mx=cx+(o.mx||0),my=cy+13;if(o.mo>0)E(mx,my+o.mo*.4,o.mw,o.mo,9,o.mouthMat||'mouth','sub');else if(o.mo===0){L(mx-o.mw,my+(o.ml||0),mx+o.mw,my-(o.ml||0),.9,.9,1.6,o.lipMat||'lip','sub');E(mx,my+1.6,o.mw*.6,1.2,1.4,o.lipMat||'lip','add')}
  if(o.neck)E(cx,cy+o.h+8,o.w*.66,12,8,S,'base',-6)}
function eyePx(k,x,y,o){const{D}=k; // o: iris colour, pupil size, veins, glint, look offset
  const lx=x+(o.lx||0);if(o.iris){D(lx-1,y-1,o.iris,3,o.ih||2);D(lx-1,y+(o.ih||2)-1,o.iris,3,1)}if(o.pupil)D(lx,y,o.pupil,o.ps||1,o.ps||1);if(o.ring)D(lx-1,y-1,o.ring,1,1);
  (o.veins||[]).forEach(([dx,dy])=>D(x+dx,y+dy,'#8a2a26'));if(o.glint)D(lx+(o.gx||1),y-1,o.glint)}
function handPx(k,x,y,a,len,skin,nail,spread){const{E,L,D}=k,ca=Math.cos(a),sa=Math.sin(a);E(x,y,5.5,4.5,6,skin,'base',22);
  [-1.5,-.5,.5,1.5].forEach((t,i)=>{const fa=a+t*(spread||.22),fl=len*(i===0||i===3?.78:1),bx=x+Math.cos(a+t*.6)*3.5,by=y+Math.sin(a+t*.6)*3.5,ex=bx+Math.cos(fa)*fl,ey=by+Math.sin(fa)*fl;
    L(bx,by,ex,ey,1.6,1.05,3,skin,'base',24);L(bx+Math.cos(fa)*fl*.45,by+Math.sin(fa)*fl*.45,bx+Math.cos(fa)*fl*.5,by+Math.sin(fa)*fl*.5,1.7,1.7,1.2,null,'add');
    if(nail)L(ex,ey,ex+Math.cos(fa)*3.2,ey+Math.sin(fa)*3.2,1,.45,2,nail,'base',26)});
  L(x-Math.sin(a)*4,y+Math.cos(a)*4,x-Math.sin(a)*4+Math.cos(a+.9)*len*.6,y+Math.cos(a)*4+Math.sin(a+.9)*len*.6,1.8,1.2,3,skin,'base',23)}
// 敕令 brushed in cinnabar, 9 px wide, on a yellow paper strip 13 wide
const GL_CHI=['.#...#...','####.#...','.#..#####','###..#.#.','#.#..#.#.','###...#..','.#...#.#.','##..#...#'],GL_LING=['....#....','...#.#...','..#...#..','.#..#..#.','#...#...#','.........','.######..','.#....#..','.#....#..','.#..##...','.#.......'];
function talisman2(k,x0,y0,h,sh,scr){const P=(x,y,c)=>scr?k.S(x,y,c):k.D(x,y,c),o=r=>Math.round(r*sh),TL='#d8bc4a',TD='#a8892a',TH='#f0dc80',INK='#a81c14';
  for(let r=0;r<h;r++){const sh2=r>h*.75?TD:TL;for(let c=0;c<13;c++)P(x0+o(r)+c,y0+r,c===0?TH:c===12?TD:sh2)}
  const gl=(A,gx,gy)=>A.forEach((s,r)=>{if(gy+r>=h)return;for(let c=0;c<s.length;c++)if(s[c]==='#')P(x0+o(gy+r)+gx+c,y0+gy+r,INK)});
  gl(GL_CHI,2,2);gl(GL_LING,2,11);for(let r=23;r<h-7;r++){if(r%4)P(x0+o(r)+6,y0+r,INK);else for(let c=4;c<9;c++)P(x0+o(r)+c,y0+r,INK)}
  if(h>=34)for(let r=h-6;r<h-1;r++)for(let c=3;c<10;c++)P(x0+o(r)+c,y0+r,(r===h-4&&c>4&&c<8)||(c===6&&r>h-6)?TL:INK)}
const CPAINT={
  // 虎姑婆 mid-change: an old woman's left half, the tiger tearing through the right; grey hair in a bun, the indigo 大襟衫 collar
  tiger(k,f){const{E,L,D,tilt}=k;tilt(-.12,32,30);
    E(32,24,22,22,6,'hairGrey','base',-6);E(19,9,7,6,8,'hairGrey','base',2);E(18,8,4,3,2,null,'add');L(12,6,26,12,.8,.8,3,'gold','base',12);
    E(32,60,30,10,8,'indigo','base',-4);L(28,52,44,64,1.2,1.2,2,'gold','base',6);
    headPx(k,{cx:32,cy:29,w:16,h:20,skin:'skinOld',eL:f===2?1:.55,eR:1.15,eRx:40,eRy:27,cheek:2,hollow:2,sock:7,mo:[0,4,9][f],mw:[5,7,10][f],mx:[0,2,3][f],ml:f===0?-1:0,neck:1,jw:12});
    E(41,26,11,17,0,'fur','paint');E(44,36,8,8,0,'fur','paint');E(47,14,4,6,5,'fur','base',10);E(47,15,2,3,2,'skinRed','add');      // fur and an ear tearing through
    [[36,14,46,18],[37,20,49,22],[40,32,50,30],[38,38,48,40],[34,6,38,12]].forEach(([a,b,c,d])=>L(a,b,c,d,.9,.5,1,'stripe','sub'));
    for(const[x0,y0,x1,y1]of[[14,14,20,40],[15,18,11,46],[24,7,19,24]])L(x0,y0,x1,y1,.8,.6,1.2,'hairGrey','base',16);E(22,10,9,4,3,'hairGrey','base',13);   // a few stringy grey strands, hair combed back to the bun
    [[19,22,25,23],[18,35,22,38],[24,44,27,46],[22,18,27,18],[20,40,24,41],[26,13,31,13]].forEach(([a,b,c,d])=>L(a,b,c,d,.6,.6,1.4,null,'sub'));                  // wrinkles on the human half
    if(f===2){E(36,45,12,8,0,'gum','paint');E(36,45,10,6,6,'mouth','sub');}
    eyePx(k,25,f===2?28:29,{iris:'#c8c4bc',ih:2,pupil:'#1a1010',glint:'#ffffff',veins:[[-2,0],[2,1]]});
    eyePx(k,40,27,{iris:'#ffcc28',ih:3,pupil:'#000',ps:1,glint:'#ffffff',gx:-1});D(40,26,'#000');D(40,28,'#000');D(38,26,'#ffe680');D(42,28,'#c88a10');
    if(f===0){D(34,42,'#6a2420');D(35,42,'#3a0a0a');D(36,41,'#3a0a0a')}
    const T='#e6dcbc';if(f===1){D(32,43,T);D(34,43,T);D(36,44,T);D(38,42,T,1,3);D(30,46,T)}
    if(f===2){[26,28,30,32,34,36,38,40,42].forEach((x,i)=>D(x,38+(i===2||i===6?0:1),T,1,i===2||i===6?4:2));D(28,38,T,1,6);D(43,39,T,1,6);[29,33,37,41].forEach(x=>D(x,51,T,1,2));D(36,52,'#7a1a18',2,2);
      [[45,40],[47,44],[44,46]].forEach(([x,y])=>D(x,y,'#140808'));handPx(k,52,56,-2.2,11,'fur','nail',.3);handPx(k,10,58,-1.1,9,'skinOld','nail',.18)}},
  // 裂口女: a real woman's face, wet black hair across it; mask → slit → mouth torn to both ears, scissors
  kuchi(k,f){const{E,L,D,tilt}=k;tilt(.09,32,30);
    E(32,22,17,15,6,'hairBlack','base',-8);for(let i=0;i<9;i++){L(17-i*.4,16,13-i*.9,64,1.6,2.2,4,'hairBlack','base',-8);L(47+i*.4,16,51+i*.9,64,1.6,2.2,4,'hairBlack','base',-8)}E(32,62,30,8,8,'redCoat','base',-2);L(22,56,30,64,1,1,2,'redCoat','sub');
    headPx(k,{cx:32,cy:29,w:14,h:20,skin:'skinPale',eL:f===2?1.25:1.1,eR:.9,cheek:2.6,sock:6.5,mo:f===2?6:0,mw:f===2?12:4,neck:1,jw:10});
    if(f===0){E(32,40,13,9,3,'collar','base',17);L(20,40,44,40,.5,.5,.8,null,'sub');L(21,44,43,44,.5,.5,.8,null,'sub');L(19,36,12,34,.5,.5,1,'collar','base',16);L(45,36,52,33,.5,.5,1,'collar','base',16)}
    if(f===1){L(26,42,15,37,.7,.5,1.6,'gum','sub');L(38,42,49,37,.7,.5,1.6,'gum','sub');L(26,42,38,42,.8,.8,1.4,'gum','sub');E(32,50,11,4,3,'collar','base',16)}
    if(f===2){E(32,44,13,7,0,'gum','paint');E(32,44,11,6,9,'mouth','sub');L(20,42,13,36,1.4,.8,2.5,'gum','sub');L(44,42,51,36,1.4,.8,2.5,'gum','sub')}
    E(32,12,15,6,5,'hairBlack','base',15);for(let x=18;x<47;x+=2)L(x,8,x+(x%3)-1,15+(x*7)%4,.9,.6,2,'hairBlack','base',16);          // heavy straight bangs
    for(const[x0,y0,x1,y1]of[[22,12,30,40],[19,14,17,50],[44,12,47,52],[25,14,33,30],[41,16,44,40]])L(x0,y0,x1,y1,.7,.5,1.5,'hairBlack','base',18);   // wet strands across the face
    eyePx(k,25,28,{pupil:'#1a0505',glint:'#fff',veins:[[-2,0],[-3,1],[2,-1],[2,1]]});eyePx(k,39,28,{pupil:'#1a0505',lx:-1,veins:[[2,0],[3,1]]});
    if(f===1){[[16,37],[17,38],[47,37],[46,38]].forEach(([x,y])=>D(x,y,'#7a0808'))}
    if(f===2){const T='#e6dcbc';for(let x=22;x<43;x+=2){D(x,39+(Math.abs(x-32)>7?1:0),T,1,2);D(x+1,47-(Math.abs(x-32)>7?1:0),T,1,2)}D(14,37,'#9c2222',1,4);D(50,37,'#9c2222',1,4);D(13,41,'#5a0808',1,3);D(51,40,'#5a0808',1,4)}
    if(f>=1){const big=f===2,px=big?50:54,py=big?54:58,len=big?36:18;L(px,py,px-len*.42,py-len,2,.6,2,'steel','base',30);L(px+1,py,px+len*.2,py-len,2,.6,2,'steel','base',31);
      E(px-4,py+5,3.4,3.4,3,'steel','base',29);E(px-4,py+5,1.6,1.6,4,null,'cut');E(px+4,py+5,3.4,3.4,3,'steel','base',29);E(px+4,py+5,1.6,1.6,4,null,'cut');handPx(k,px+1,py+2,-1.5,6,'skinPale','nail',.14)}},
  // 殭屍: gaunt grey-green face under a Qing 暖帽, a proper 敕令 talisman hanging from the brim; it lifts, then the fangs
  jiang(k,f){const{E,L,D,S,tilt}=k;tilt(-.05,32,30);
    E(32,63,30,9,8,'robe','base',-4);L(32,54,26,64,1,1,2,'gold','base',5);E(32,60,8,4,3,'gold','base',4);
    headPx(k,{cx:32,cy:31,w:15,h:20,skin:'skinCorpse',eL:f===2?.9:.2,eR:f===2?1.1:.2,cheek:4,hollow:4,sock:8,mo:[0,2,6][f],mw:[5,5,7][f],neck:1,jw:9});
    [[22,40,24,46],[42,38,40,46],[27,20,30,21]].forEach(([a,b,c,d])=>L(a,b,c,d,.6,.6,1.2,null,'sub'));
    E(32,9,24,4,4,'hatBlack','base',18);L(8,11,56,11,1.2,1.2,1,'hatBlack','add');L(9,12.4,55,12.4,.6,.6,.4,'gold','add');E(32,5,15,5,6,'tassel','base',20);for(let x=19;x<46;x+=2)L(x,1,x+(x-32)*.15,8,.7,.6,1.5,'tassel','base',22);E(32,0,2.4,2,4,'gold','base',27);
    if(f>=1){eyePx(k,25,30,{iris:'#c02a1a',ih:2,pupil:'#000',glint:'#ffc0a0'});eyePx(k,39,30,{iris:'#c02a1a',ih:2,pupil:'#000'})}else{D(22,30,'#1a2a1e',6,1);D(36,30,'#1a2a1e',6,1)}
    if(f===2){const T='#dcdcc0';D(27,44,T,2,6);D(36,44,T,2,6);D(28,50,T);D(37,50,T);[30,32,34].forEach(x=>D(x,44,T,1,2));D(29,52,'#3a0a0a',6,1)}
    if(f===1){D(28,44,'#dcdcc0',1,3);D(36,44,'#dcdcc0',1,3)}
    if(f===2){[[5,54,-1.55],[59,54,-1.6]].forEach(([x,y,a])=>handPx(k,x,y,a+(x<32?.9:-.9),10,'skinCorpse','nail',.2))}
    if(f===0)talisman2(k,26,12,40,0,true);else if(f===1)talisman2(k,27,11,26,.38,true);else talisman2(k,44,10,30,.6,true)},
  // 魔神仔: a small wizened red face, too-wide grin, glinting animal eyes, matted grass and straw for hair
  mosin(k,f){const{E,L,D,tilt}=k;tilt(.26,32,32);
    E(32,64,26,10,6,'straw','base',-4);for(let x=8;x<58;x+=3)L(x,56,x+(x%5)-2,64,.8,.8,1.5,'straw','base',2);
    E(14,30,5,8,6,'skinRed','base',0);E(50,28,5,8,6,'skinRed','base',0);E(14,30,2,4,3,null,'sub');E(50,28,2,4,3,null,'sub');                     // big ears
    headPx(k,{cx:32,cy:32,w:15,h:17,skin:'skinRed',eL:1.3,eR:1.05,eLx:25,eRx:40,eLy:28,eRy:29,cheek:3.5,hollow:1,sock:7,mo:-1,mw:12,jw:11});
    const gw=[13,14,15][f],go=[.9,3,6][f],gy=(x)=>44-6*((x-32)/gw)**2;for(let x=32-gw;x<=32+gw;x+=1)L(x,gy(x)-.3,x,gy(x)+go*(1-((x-32)/gw)**2)+.4,.9,.9,6,'mouth','sub');
    [[20,20,28,22],[36,22,44,20],[22,36,26,40],[42,36,38,40],[30,18,34,18],[18,26,20,32],[46,26,44,32]].forEach(([a,b,c,d])=>L(a,b,c,d,.6,.6,1.6,null,'sub'));
    E(32,14,20,8,6,'grass','base',13);for(let i=0;i<16;i++){const x=12+i*2.6,h=8+((i*7)%6);L(x,16,x+((i*5)%7)-3,16-h,1.2,.4,2,i%4?'grass':'straw','base',16)}
    eyePx(k,25,28,{iris:'#e8d040',ih:3,pupil:'#000',glint:'#ffffe0',gx:-1});eyePx(k,40,29,{iris:'#d8c030',ih:2,pupil:'#000',glint:'#ffffe0'});
    const T='#e6dcbc';for(let x=32-gw+2;x<32+gw-1;x+=2){const y0=Math.round(gy(x)),y1=Math.round(gy(x)+go*(1-((x-32)/gw)**2));D(x,y0,T,1,f?2:1);if(f)D(x+1,y1-1,T,1,2)}
    if(f===2){L(6,64,10,40,1.6,1.2,3,'skinRed','base',24);L(58,64,54,40,1.6,1.2,3,'skinRed','base',24);[[10,40,-1.9],[54,40,-1.3]].forEach(([x,y,a])=>handPx(k,x,y,a,12,'skinRed','nail',.32))}},
  // 水鬼: a bloated drowned face, milky eyes, hair plastered across it; it parts, then the hands come up out of the water
  suigui(k,f){const{E,L,D,tilt}=k;tilt(-.18,32,30);
    E(32,28,24,30,6,'hairWet','base',-8);E(32,62,24,8,6,'rag','base',-2);
    headPx(k,{cx:32,cy:30,w:17,h:20,skin:'skinDrown',eL:1.2,eR:1,cheek:5,sock:5,eyeMat:'eyeMilk',mouthMat:'mouthDark',mo:[2,4,7][f],mw:[3,4,5][f],mx:-1,neck:1,jw:14});
    E(22,40,5,3,0,'skinCorpse','paint');E(43,22,4,3,0,'skinCorpse','paint');E(38,44,3,2,0,'skinCorpse','paint');
    const gap=[1,7,13][f];for(let i=0;i<22;i++){const side=i%2?1:-1,x0=32+side*(gap*.4+(i>>1)*1.9),sway=side*(gap+(i>>1)*.9)*.45;L(x0,4,x0+sway+Math.sin(i*1.7)*2,40+((i*7)%14),1.1,.6,2.2,'hairWet','base',17)}
    eyePx(k,24,29,{pupil:'#aabcb8',glint:'#ffffff'});eyePx(k,40,29,{pupil:'#9fb2ae'});
    [[18,47],[26,52],[37,50],[45,48],[30,24],[42,38]].forEach(([x,y],i)=>D(x,y+(f*2+i)%3,'#9ad0dc',1,2));
    if(f===2){[[8,62,-1.2],[56,62,-1.95]].forEach(([x,y,a])=>handPx(k,x,y,a,13,'skinDrown','nail',.26));D(12,44,'#9ad0dc',1,2);D(52,46,'#9ad0dc',1,2)}},
  // 紅衣小女孩: a very still child; black bob over half the face, one eye showing
  girl(k,f){const{E,L,D}=k;
    E(32,30,22,28,6,'hairBlack','base',-6);E(32,62,22,8,6,'dress','base',-2);E(26,57,6,3,2,'collar','base',2);E(38,57,6,3,2,'collar','base',2);
    headPx(k,{cx:32,cy:31,w:13,h:16,skin:'skinChild',lipMat:'mouthDark',mouthMat:'mouthDark',eL:f===2?1.3:1.05,eR:1,cheek:2,sock:4.5,mo:f===2?2:0,mw:f===0?3:5,ml:f===1?-1:0,neck:0,jw:9});E(32,58,7,6,6,'skinChild','base',-3);
    E(32,14,16,8,6,'hairBlack','base',15);for(let x=17;x<48;x+=2)L(x,10,x,[24,22,23][f]+(x%3),1,.8,2,'hairBlack','base',16);
    E(41,32,10,18,6,'hairBlack','base',16);for(let i=0;i<6;i++)L(34+i*2,14,33+i*2.4,48,.8,.6,1.4,'hairBlack','base',17);   // the bob falls over her right half
    eyePx(k,26,29,f===2?{pupil:'#000',ps:2,iris:'#1a1212',ih:3,glint:'#f4f4f4'}:{iris:'#2a1c18',ih:2,pupil:'#000',glint:'#f4f4f4'})},
  // 夜半送葬: a mourner under a peaked hemp hood; the face is shadow, only a pale chin and mouth in the torchlight
  mourn(k,f){const{E,L,D}=k;
    E(32,64,31,12,8,'hemp','base',-4);E(32,36,21,28,12,'hemp','base',0);L(32,2,32,18,1,9,8,'hemp','base',2);L(30,4,24,40,.6,.6,1.2,null,'sub');L(36,6,44,44,.6,.6,1.2,null,'sub');L(22,20,18,60,.5,.5,1,null,'sub');L(43,22,47,60,.5,.5,1,null,'sub');
    L(13,22,51,20,1.3,1.3,2.5,'rope','add');L(14,22,12,34,.9,.7,2,'rope','base',14);
    E(32,38,12,17,16,'shadow','sub');E(32,36,11,16,0,'shadow','paint');
    E(32,46,10,9,7,'skinPale','base',3);E(26,44,3,3,2,null,'sub');E(38,44,3,3,2,null,'sub');E(32,48,8,6,6,'skinPale','base',4);E(32,46,5,1.2+[0,2,4][f],5,'mouth','sub');E(31,52,4,2,2,null,'add');E(33,40,2,1.6,3,'skinPale','base',5);L(26,50,28,53,.5,.5,1,null,'sub');
    L(12,34,10,46,.7,.5,2,'rope','base',14);L(14,34,15,44,.7,.5,2,'rope','base',14);E(13,33,2.4,2,2,'rope','base',15);
    if(f>0){D(29,45,'#b8b0a8');D(36,46,'#b8b0a8');[30,32,34].forEach(x=>D(x,45+f,'#9a9280'))}
    const eg=['#3a3a3a','#8a8680','#f0e8d8'][f];D(27,31,eg);D(37,32,eg);if(f===2){D(26,31,'#a8a090');D(37,31,'#ffffff')}},
  // 叫名字: the face that was right behind you
  voice(k,f){const{E,L,D,tilt}=k;tilt(.34,32,30);E(32,30,22,30,6,'hairBlack','base',-6);for(let i=0;i<7;i++)L(38+i*2,6,36+i*3,64,1,1.6,3,'hairBlack','base',-6);
    headPx(k,{cx:32,cy:30,w:13,h:[20,22,25][f],skin:'skinPale',eL:.4,eR:0,sock:9,mo:[2,6,12][f],mw:[2,3,3.5][f],mouthMat:'mouthDark',neck:0,jw:8});
    for(let i=0;i<3;i++)L(38+i*2.2,8,40+i*3.4,50,.7,.5,1.6,'hairBlack','base',18);eyePx(k,25,29,{pupil:'#f4f0e8',glint:'#fff'});
    if(f===2)handPx(k,12,60,-1.9,10,'skinPale','nail',.2)},
};
const closeSprite=(type,f)=>{const t=CPAINT[type]?type:type==='funeral'?'mourn':'voice',key='cu2'+t+f;let c=SPR.get(key);if(!c){c=faceBuild(CPAINT[t],f);SPR.set(key,c)}return c};
// build all close-ups in idle slices after load so the capture frame never stalls on modelling
(function warmCloseups(){const q=[];for(const t of Object.keys(CPAINT))for(let f=0;f<3;f++)q.push([t,f]);const tick=()=>{const it=q.shift();if(!it)return;closeSprite(it[0],it[1]);setTimeout(tick,30)};setTimeout(tick,1500)})();

/* ---------------- the lunge: the monster's own close-up rushes from where it stands into the lens ---------------- */
let CLOSEUP=(()=>{try{return localStorage.getItem('kaidan-closeup')!=='0'}catch(e){return true}})();   // pause menu: 驚嚇特寫 on/off
let LUNGE_FREEZE=null;                                                                                    // test hook: KT.freezeLunge(seconds)
function lungeOrigin(type){const P=G.player,A=G.apparition;let x=P.x+Math.cos(P.face)*18,y=P.y-14,h=24,bd=1e9;
  for(const m of G.monsters)if(m.type===type&&!m.hidden){const d=dist(m,P);if(d<bd){bd=d;x=m.x;y=m.y-MON_SIZE[type][1]*.62;h=MON_SIZE[type][1]}}
  if(A&&A.type===type){if(type==='funeral'){for(let i=0;i<A.members;i++){const p=apPos(A,i),d=Math.hypot(p.x-P.x,p.y-P.y);if(d<bd){bd=d;x=p.x;y=p.y-14;h=22}}}else if(type==='girl'){x=A.x;y=A.y-10;h=17}}
  return[(x-CAM.x)*CAM.k,(y-CAM.y)*CAM.k,h*CAM.k]}
// after the hit the darkness behind the face pulses with the monster's colour: blood for most, cold for the drowned, corpse-green for the 殭屍
const LUNGE_BACK={suigui:[8,34,44],jiang:[22,40,24],funeral:[40,38,34],voice:[30,30,38]};
// cached full-screen layers (built at 1/8 size, scaled up smooth): the vignette and the flash ring that hits around the face, never on it
const LV={w:0,h:0};
function lungeLayers(cw,ch){if(LV.w===cw&&LV.h===ch)return LV;LV.w=cw;LV.h=ch;const sw=Math.ceil(cw/8),sh=Math.ceil(ch/8),R0=Math.min(sw,sh),R1=Math.hypot(sw,sh)*.55;
  const lay=(stops)=>{const c=mk(sw,sh),g=c.getContext('2d'),gr=g.createRadialGradient(sw/2,sh*.52,R0*.3,sw/2,sh*.52,R1);stops.forEach(([p,col])=>gr.addColorStop(p,col));g.fillStyle=gr;g.fillRect(0,0,sw,sh);return c};
  LV.vig=lay([[0,'rgba(0,0,0,0)'],[.55,'rgba(0,0,0,.35)'],[1,'rgba(0,0,0,.92)']]);
  // the flash hugs the face (radius from the face size, not the screen), so a tall phone screen gets no flat grey field above and below
  const fr=Math.min(cw*1.35,ch*1.04)/16,hug=(stops)=>{const c=mk(sw,sh),g=c.getContext('2d'),gr=g.createRadialGradient(sw/2,sh/2,0,sw/2,sh/2,fr*1.35);stops.forEach(([p,col])=>gr.addColorStop(p,col));g.fillStyle=gr;g.fillRect(0,0,sw,sh);return c};
  LV.back=hug([[0,'rgba(255,246,236,.95)'],[.6,'rgba(255,240,226,.75)'],[.85,'rgba(200,60,40,.2)'],[1,'rgba(0,0,0,0)']]);
  LV.ring=hug([[0,'rgba(255,244,230,0)'],[.66,'rgba(255,244,230,0)'],[.8,'rgba(255,240,226,.5)'],[.92,'rgba(200,40,28,.3)'],[1,'rgba(0,0,0,0)']]);return LV}
function drawLunge(type,age,o,short){const T=short?[.05,.24,.46,.72]:[.1,.4,.7,.95],cw=cv.width,ch=cv.height;if(age>T[3]+.15)return;const L=lungeLayers(cw,ch);
  ctx.save();ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.globalAlpha=short&&age>T[2]?Math.max(0,1-(age-T[2])/(T[3]-T[2])):1;
  ctx.fillStyle=`rgba(3,0,0,${age<T[0]?age/T[0]*.6:Math.min(.97,.6+(age-T[0])/(T[1]-T[0])*.37)})`;ctx.fillRect(0,0,cw,ch);
  const fl=age>=T[1]-.02&&age<T[1]+.1?1-Math.max(0,age-T[1])/.1:0,bc=LUNGE_BACK[type]||[70,4,2];
  if(fl>0){if(RM){ctx.fillStyle=`rgba(${bc.join(',')},${fl})`;ctx.fillRect(0,0,cw,ch)}else{const a0=ctx.globalAlpha;ctx.globalAlpha=a0*fl;ctx.imageSmoothingEnabled=true;ctx.drawImage(L.back,0,0,cw,ch);ctx.globalAlpha=a0;ctx.imageSmoothingEnabled=false}}/* the flash lands behind the face: a silhouette pop */
  else if(age>=T[1]){const q=(age-T[1])/(T[3]-T[1]),p=RM?.75:.6+.4*Math.sin((age-T[1])*Math.PI*2*2.2);/* ≤2.2 Hz, and none under reduced motion */ctx.fillStyle=`rgba(${bc.join(',')},${Math.max(0,(1-q)*.9*p)})`;ctx.fillRect(0,0,cw,ch)}
  const f=age<T[0]+(T[1]-T[0])*.45?0:age<T[1]-.03?1:2,spr=closeSprite(type,f),sw=spr.width,k1=Math.max(4,Math.round(Math.min(cw*1.35,ch*1.04)/sw*(short?.82:1))),k0=Math.max(1,Math.min(k1,Math.round(o[2]*1.4/sw)));
  const tx=cw/2,ty=ch*.5;let k,cx,cy;
  if(age<T[0]){k=k0;cx=o[0]+(RM?0:(Math.random()<.5?-1:1)*k0);cy=o[1]}
  else if(age<T[1]){const p=(age-T[0])/(T[1]-T[0]),e=p*p*p,pp=1-(1-p)*(1-p);k=Math.max(k0,Math.round(k0*Math.pow(k1/k0,e)));cx=o[0]+(tx-o[0])*pp;cy=o[1]+(ty-o[1])*pp}   // accelerating at the lens
  else{const q=(age-T[1])/(T[3]-T[1]);k=k1+Math.round(k1*.07*Math.max(0,1-q*4));cx=tx;cy=ty;
    if(!RM){const a=Math.pow(1-Math.min(1,(age-T[1])/(T[2]-T[1]+.1)),2)*k*1.4;cx+=Math.round((Math.random()-.5)*2*a);cy+=Math.round((Math.random()-.5)*2*a)}}
  const w=sw*k,h=spr.height*k;ctx.drawImage(spr,Math.round(cx-w/2),Math.round(cy-h/2),w,h);
  ctx.imageSmoothingEnabled=true;ctx.drawImage(L.vig,0,0,cw,ch);if(fl>0&&!RM){ctx.globalAlpha*=fl;ctx.drawImage(L.ring,0,0,cw,ch)}ctx.globalAlpha=short&&age>T[2]?Math.max(0,1-(age-T[2])/(T[3]-T[2])):1;
  if(!short&&age>T[2]){ctx.fillStyle=`rgba(2,0,0,${Math.min(1,(age-T[2])/(T[3]-T[2]))*.94})`;ctx.fillRect(0,0,cw,ch)}
  ctx.restore()}
// close-ups switched off: a short red fade instead
function drawRedFade(age,short){const d=short?.45:.95;if(age>d)return;const a=age<.12?age/.12:1-(age-.12)/(d-.12);ctx.save();ctx.setTransform(1,0,0,1,0,0);
  ctx.fillStyle=`rgba(130,8,4,${.62*a})`;ctx.fillRect(0,0,cv.width,cv.height);if(!short&&age>.5){ctx.fillStyle=`rgba(2,0,0,${Math.min(.9,(age-.5)/.45*.9)})`;ctx.fillRect(0,0,cv.width,cv.height)}ctx.restore()}

/* small animals and props */
function dogSprite(f,bark){return sprite('dog'+f+(bark?1:0),13,10,R=>{const B='#8a5a30',D='#5a3a1c',L='#b07a44';R(3,3,7,4,B);R(3,6,7,1,D);R(4,3,5,1,L);R(9,bark?0:1,4,4,B);R(12,bark?2:3,1,2,D);R(9,bark?-1:0,2,2,D);R(11,bark?1:2,1,1,'#000');if(bark)R(12,4,1,1,'#300');
  R(1,f?0:2,2,2,B);R(4,7,1,3-(f?1:0),D);R(8,7,1,3-(f?0:1),D);R(5,7,1,2,D)})}
function catSprite(){return sprite('cat',10,6,R=>{R(1,2,7,3,'#0c0c10');R(7,0,3,3,'#0c0c10');R(7,-1,1,1,'#0c0c10');R(9,-1,1,1,'#0c0c10');R(8,1,1,1,'#f2d04a');R(0,0,1,3,'#0c0c10');R(2,5,1,1,'#0c0c10');R(6,5,1,1,'#0c0c10')})}
const PROP={
  O:()=>sprite('well',22,26,R=>{const W='#5a3e24';R(2,0,2,18,W);R(18,0,2,18,W);R(1,0,20,2,'#3a2416');R(10,2,1,6,'#b8a070');R(9,8,4,3,'#6a4a2a');R(9,8,4,1,'#8a6a3a');
    R(1,12,20,6,'#6a6862');R(4,13,14,4,'#0b1418');R(5,14,6,1,'#1f3a44');R(1,17,20,8,'#55534d');for(let x=1;x<21;x+=5)R(x,17,1,8,'#3e3c38');R(1,21,20,1,'#3e3c38');R(3,19,2,1,'#6f6c64');R(12,23,3,1,'#6f6c64')}),
  J:()=>sprite('chime',12,32,R=>{R(5,6,2,24,'#4a3420');R(5,6,6,1,'#4a3420');R(4,29,4,2,'#3a2a18');R(8,7,1,2,'#c9a24a');R(10,7,1,3,'#d8b45a');R(9,7,1,1,'#8a6a2a')}),
  U:()=>sprite('shrine',24,28,R=>{R(2,21,20,6,'#5e5a52');R(2,21,20,1,'#7a766c');R(4,10,16,11,'#9b2a1c');R(17,10,3,11,'#741e14');R(8,13,8,8,'#140a08');R(11,15,2,2,'#d8b08a');R(10,14,4,1,'#c9993c');R(11,17,2,2,'#eeeeea');R(10,19,4,2,'#b8862e');
    R(1,6,22,4,'#b04a2a');R(1,9,22,1,'#7a2f1e');R(2,5,20,1,'#5a1a10');R(0,3,2,3,'#b04a2a');R(22,3,2,3,'#b04a2a');R(0,2,1,1,'#5a1a10');R(23,2,1,1,'#5a1a10');for(let x=2;x<22;x+=3)R(x,7,1,2,'#8a3420');
    R(10,22,4,3,'#8a6420');R(11,19,1,3,'#7a2a16');R(12,19,1,3,'#7a2a16')}),
  Z:()=>sprite('bell',24,34,R=>{R(2,4,2,30,'#5a3a22');R(20,4,2,30,'#5a3a22');R(0,2,24,3,'#3a2416');R(0,0,24,2,'#6a2a1a');R(11,5,2,1,'#3a2416');
    R(9,6,6,2,'#8a6a2a');R(8,8,8,9,'#8a6a2a');R(7,17,10,2,'#6e5420');R(9,8,1,8,'#b8923e');R(10,10,4,1,'#6e5420');R(10,13,4,1,'#6e5420');R(4,9,4,2,'#6a4a2a');R(5,5,1,4,'#b8a070')}),
  X:()=>sprite('coop',24,18,R=>{R(1,2,22,2,'#b39a5a');for(let x=1;x<24;x+=4)R(x,4,1,11,'#9a8048');R(1,15,22,3,'#7a6a3a');R(1,8,22,1,'#9a8048');
    R(5,9,5,4,'#eeeeea');R(9,7,2,2,'#eeeeea');R(9,6,2,1,'#c0392b');R(11,8,1,1,'#e0a030');R(14,10,5,4,'#d8d4c8');R(18,8,2,2,'#d8d4c8');R(18,7,2,1,'#c0392b');R(20,9,1,1,'#e0a030')}),
};
function launderSprite(tx,ty){const k=hash(tx,ty,31),key='q'+(k*5|0)+(tileAt(tx-1,ty)==='Q'?1:0)+(tileAt(tx+1,ty)==='Q'?1:0);
  return sprite(key,24,30,R=>{const cols=['#8a7a5a','#5a6a8a','#9a5a4a','#d8d0c0','#6a7a5a'],c=cols[(k*5|0)%5],cd=shadeHex(c,.75);
    if(tileAt(tx-1,ty)!=='Q')R(0,2,2,28,'#4a3420');if(tileAt(tx+1,ty)!=='Q')R(22,2,2,28,'#4a3420');R(0,4,24,1,'#9a9080');
    const v=(k*5|0)%3;if(v===0){R(4,5,14,10,c);R(2,5,2,5,c);R(18,5,2,5,c);R(9,5,4,2,cd);R(15,5,3,10,cd)}else if(v===1){R(6,5,11,4,c);R(6,9,4,10,c);R(13,9,4,10,cd)}else{R(5,5,10,14,c);R(5,8,10,1,cd);R(5,14,10,1,cd);R(12,5,3,14,cd)}},true)}
function cabinetSprite(open){return sprite('cab'+(open?1:0),20,28,R=>{R(0,0,20,4,'#7a5032');R(0,4,20,24,'#5a3820');R(0,4,20,1,'#3a2416');R(18,4,2,24,'#3e2616');
  if(open){R(2,6,16,20,'#0c0705');R(-1,6,3,20,'#6a4228')}else{R(9,6,1,20,'#2a180c');R(2,7,6,8,'#664026');R(11,7,6,8,'#664026');R(2,17,6,8,'#664026');R(11,17,6,8,'#664026');R(7,15,1,2,'#c9993c');R(11,15,1,2,'#c9993c')}
  R(1,26,2,2,'#2a180c');R(17,26,2,2,'#2a180c')})}
function haySprite(){return sprite('hay',26,20,R=>{R(3,2,20,4,'#c9a55a');R(1,5,24,8,'#b8913e');R(0,12,26,6,'#9a7630');R(2,17,22,2,'#6e5424');[[5,3],[11,2],[17,4],[3,8],[9,7],[15,9],[21,7],[6,13],[13,12],[19,14]].forEach(([x,y])=>R(x,y,2,1,'#e0c070'));R(10,5,6,1,'#8a6a28')})}
function graveSprite(v){return sprite('grave'+v,16,18,R=>{R(0,8,16,9,'#3a3426');R(1,8,14,1,'#4a4430');R(5,0,6,1,'#6e6c64');R(4,1,8,1,'#6e6c64');R(3,2,10,12,'#76746b');R(11,2,2,12,'#55534c');R(7,4,2,8,'#3a3934');R(3,14,10,2,'#4e4c45');
  if(v){R(0,12,1,3,'#9a2418');R(15,12,1,3,'#9a2418')}})}
function treeSprite(id){return sprite('tree'+(id%4),44,48,R=>{R(19,30,5,16,'#3a2a1c');R(19,30,1,16,'#4e3a26');R(16,44,11,2,'#2a1e14');
  const g=['#16261a','#1d3322','#25422a','#2f5232'];const blobs=[[22,16,18,14],[12,20,10,8],[32,20,10,8],[22,8,12,8],[16,26,9,6],[29,26,9,6]];
  blobs.forEach(([x,y,rx,ry])=>{for(let dy=-ry;dy<=ry;dy++){const w=Math.round(rx*Math.sqrt(1-dy*dy/(ry*ry)));R(x-w,y+dy,w*2+1,1,g[dy<-ry/3?3:dy<ry/3?2:1])}});
  for(let i=0;i<40;i++){const a=hash(id,i,4)*6.28,r=15*hash(id,i,5);R(Math.round(22+Math.cos(a)*r*1.1),Math.round(16+Math.sin(a)*r*.8),2,1,hash(id,i,6)<.5?'#3f6a3c':'#10200f')}})}
function furnitureSprite(onFloor){return sprite('fur'+onFloor,20,14,R=>{if(onFloor==='p'){R(4,2,12,10,'#8a2418');R(4,2,12,2,'#c99a3c');R(4,10,12,2,'#c99a3c');R(2,12,16,2,'#5a1a10');return}
  R(0,0,20,6,'#6a4a2c');R(0,6,20,4,'#4a3220');R(1,10,2,4,'#3a2416');R(17,10,2,4,'#3a2416');R(5,2,2,2,'#d8cfb8');R(12,3,2,2,'#d8cfb8');R(8,1,3,2,'#b8a888')})}
function altarSprite(){return sprite('altar',48,30,R=>{R(0,14,48,16,'#5a1a10');R(0,14,48,3,'#8a2418');R(0,14,48,1,'#c99a3c');R(0,28,48,1,'#c99a3c');R(4,18,40,8,'#6a1a12');R(6,20,36,4,'#7a2418');
  R(18,10,12,8,'#b8862e');R(18,10,12,1,'#d8a84e');R(20,2,8,7,'#d8b08a');R(19,0,10,3,'#1a1a1a');R(16,1,3,1,'#1a1a1a');R(29,1,3,1,'#1a1a1a');R(21,4,1,1,'#2a1a10');R(26,4,1,1,'#2a1a10');R(21,7,6,6,'#eeeeea');R(22,12,4,2,'#d8d8d0');
  R(20,15,8,3,'#b8862e');R(6,13,6,2,'#d8cfb8');R(7,11,4,2,'#d07a2a');R(36,13,6,2,'#d8cfb8');R(37,11,4,2,'#c0392b')})}
function truckSprite(){return sprite('truck',46,64,R=>{
  R(4,0,38,4,'#9da196');R(3,4,40,18,'#7c8079');R(3,4,40,2,'#a8ac9f');R(6,7,34,8,'#1a272c');R(8,8,10,2,'#4a6a74');R(3,20,40,2,'#5d615b');R(4,1,6,2,'#fff2c2');R(36,1,6,2,'#fff2c2');
  R(2,22,42,36,'#4f534d');R(4,24,38,32,'#3f423e');for(let y=24;y<56;y+=6)R(4,y,38,1,'#2c2e2b');R(2,22,2,36,'#5d615b');R(42,22,2,36,'#5d615b');
  R(2,56,42,7,'#5d615b');R(2,56,42,1,'#7a7e76');R(3,59,5,2,'#8a2418');R(38,59,5,2,'#8a2418');R(18,58,10,3,'#c9b47f');R(19,59,8,1,'#2b1f14')})}
function lanternSprite(){return sprite('lantern',7,10,R=>{R(2,0,3,1,'#2b1f14');R(1,1,5,7,'#d4462a');R(0,2,7,5,'#d4462a');R(3,2,1,5,'#ffcf7a');R(1,8,5,1,'#2b1f14');R(3,9,1,1,'#c99a3c')})}

/* item icons: 16×16 pixel art; the tray uses a nearest-neighbour enlargement */
const ICONPX={
  firecracker:R=>{[[3,9],[6,6],[9,3]].forEach(([x,y])=>{R(x,y,4,5,'#c8341e');R(x,y,4,1,'#e8c060');R(x+3,y,1,5,'#8a1e10');R(x,y+4,4,1,'#e8c060')});R(13,1,1,2,'#3a2a1a');R(14,0,1,1,'#3a2a1a');R(14,-1,2,1,'#ffd46a');R(15,0,1,1,'#fff3c0');R(13,-1,1,1,'#ffb347')},
  candy:R=>{R(3,9,1,6,'#b89260');R(6,10,1,5,'#a07a48');R(5,2,8,7,'#e3a33a');R(4,3,10,5,'#e3a33a');R(6,3,5,2,'#ffe2a0');R(7,4,2,1,'#fff8e0');R(11,6,2,2,'#9a5a14');R(8,7,3,1,'#c07a20')},
  incense:R=>{R(3,12,10,3,'#b8862e');R(3,12,10,1,'#d8a84e');R(5,13,6,1,'#4a3010');[[5,3],[8,2],[11,3]].forEach(([x,y])=>{R(x,y,1,10,'#7a2a16');R(x,y+5,1,3,'#c84a22');R(x,y-1,1,1,'#ffb347')});R(7,0,1,1,'#d8d0c0');R(9,-1,1,1,'#d8d0c0');R(6,-2,1,1,'#a8a090')},
  oil:R=>{R(4,4,8,2,'#5a3418');R(5,3,6,1,'#3a2010');R(6,3,4,1,'#e0a040');R(2,6,12,8,'#8a5228');R(3,14,10,1,'#5a3418');R(3,6,2,7,'#a8683a');R(11,6,2,8,'#6a3a18');R(6,8,4,4,'#c7a46a');R(7,9,2,2,'#8a2418');R(6,0,1,2,'#d8d4cc');R(9,-1,1,2,'#d8d4cc')},
  talisman:R=>{R(5,0,6,15,'#e6c95a');R(10,0,1,15,'#b89a34');R(6,1,4,1,'#b8241a');R(7,2,1,3,'#b8241a');R(6,5,4,1,'#b8241a');R(8,6,1,3,'#b8241a');R(6,9,3,1,'#b8241a');R(7,10,1,2,'#b8241a');R(8,12,2,2,'#b8241a')},
};
const ICON_URL={};
const iconSprite=k=>sprite('icon'+k,16,16,ICONPX[k]);
function buildIcons(){for(const k of ITEM_ORDER){const s=iconSprite(k),c=mk(108,108),g=c.getContext('2d');g.imageSmoothingEnabled=false;g.drawImage(s,0,0,108,108);ICON_URL[k]=c.toDataURL()}}

/* ---------------- ground tiles: generated pixel by pixel, cached per chunk ---------------- */
function underTile(t,x,y){if(t==='C'||t==='K')return tileAt(x,y+1)==='p'||tileAt(x,y-1)==='p'?'p':'h';if('HYLGOJUZXQ'.includes(t))return tileAt(x,y+1)==='g'||tileAt(x-1,y)==='g'?'g':tileAt(x,y+1)==='r'||tileAt(x,y-1)==='r'?'r':tileAt(x,y+1)==='s'||tileAt(x-1,y)==='s'||tileAt(x+1,y)==='s'?'s':'.';
  if(t==='V'||t==='x')return'r';if(t==='A')return'p';if(t==='#'||t==='P'||t==='D')return'h';return t}
const GP={dirt:['#26301f','#2c3724','#323d29'].map(rgb),grass:['#1c2e1f','#21361f','#18291b'].map(rgb),road:['#433a2f','#4a4034','#3d352b'].map(rgb),stone:['#57534c','#4f4b45','#5e5a52'].map(rgb),
  brick:['#6a3427','#5e2e22','#733b2c'].map(rgb),tfloor:['#5e231b','#68271e'].map(rgb),water:['#18292b','#1b2e30'].map(rgb),deep:['#0d1a20','#0f1e25'].map(rgb),forest:['#0f160f','#121a11'].map(rgb),litter:['#1b2419','#202a1c'].map(rgb)};
const C_=Object.create(null);const cc=h=>C_[h]||(C_[h]=rgb(h));
function edgeShore(tx,ty,lx,ly){for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nb=tileAt(tx+dx,ty+dy);if(!WATER.has(nb)&&nb!=='B'&&((dx===1&&lx>21)||(dx===-1&&lx<2)||(dy===1&&ly>21)||(dy===-1&&ly<2)))return true}return false}
function groundPx(t,tx,ty,lx,ly,wx,wy,tn){
  const n=hash(wx,wy,1),pickc=(arr)=>arr[Math.min(arr.length-1,Math.floor((tn*.7+n*.3)*arr.length))];
  switch(t){
  case '.':{if(n<.05)return cc('#3e4a31');if(n>.965)return cc('#1a2117');if(hash(tx,ty,9)<.35){const ax=4+Math.floor(hash(tx,ty,10)*14),ay=8+Math.floor(hash(tx,ty,11)*12);if((lx===ax&&ly<=ay&&ly>ay-4)||(lx===ax+2&&ly<=ay&&ly>ay-3)||(lx===ax-2&&ly<=ay&&ly>ay-2))return cc(ly===ay-3?'#55753e':'#3d5530')}
    if(hash(tx,ty,12)<.12){const ax=3+Math.floor(hash(tx,ty,13)*16),ay=3+Math.floor(hash(tx,ty,14)*16);if(Math.abs(lx-ax)+Math.abs(ly-ay)<=1)return cc(lx<ax||ly<ay?'#6a6a5e':'#45453c')}return pickc(GP.dirt)}
  case 'g':{for(let k=0;k<9;k++){const ax=Math.floor(hash(tx*9+k,ty,15)*24),ay=Math.floor(hash(tx,ty*9+k,16)*24);if(lx===ax&&ly<=ay&&ly>ay-4)return cc(ly===ay-3?'#4f7a3e':'#2f4f2d')}return n<.07?cc('#2a4529'):pickc(GP.grass)}
  case 'b':return n<.08?cc('#5a5228'):n<.12?cc('#3a3a1c'):pickc(GP.litter);
  case 'T':return n<.04?cc('#1b2618'):pickc(GP.forest);
  case 'r':case 'x':{if(puddleAt(tx,ty)){const dx=lx-12,dy=(ly-12)*1.7;const d=dx*dx+dy*dy;if(d<70)return cc(d<20&&lx<12&&ly<11?'#4a6070':'#1e2a33');if(d<90)return cc('#2d2a24')}
    const vert=tileAt(tx,ty-1)==='r'&&tileAt(tx,ty+1)==='r',hor=tileAt(tx-1,ty)==='r'&&tileAt(tx+1,ty)==='r';
    if(vert&&!hor&&(lx===6||lx===7||lx===16||lx===17)&&n<.7)return cc('#352e25');if(hor&&!vert&&(ly===7||ly===8||ly===16||ly===17)&&n<.7)return cc('#352e25');
    for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const nb=tileAt(tx+dx,ty+dy);if((nb==='.'||nb==='g')&&((dx===1&&lx>21)||(dx===-1&&lx<2)||(dy===1&&ly>21)||(dy===-1&&ly<2))&&n<.55)return cc(n<.25?'#3d5530':'#2c3724')}
    if(t==='x'&&((lx+ly)%12===0)&&n<.6)return cc('#5a5242');if(n<.06)return cc('#5a5040');if(n>.95)return cc('#2e281f');return pickc(GP.road)}
  case 's':{const off=(Math.floor(wy/12)%2)*6,bx2=Math.floor((wx+off)/12),by2=Math.floor(wy/12),mx=(wx+off)%12,my=wy%12;if(mx===0||my===0)return cc('#24221f');
    const k=hash(bx2,by2,4);if(k<.15&&my>8&&mx<5)return cc('#3f5a35');if(k>.85&&mx===my)return cc('#2e2c28');return mx===1||my===1?cc('#6a665d'):GP.stone[Math.floor(k*3)]}
  case 'h':case 'd':{if(t==='d'){const hz=['#','P','D'].includes(tileAt(tx,ty-1))||['#','P','D'].includes(tileAt(tx,ty+1));
      if(hz?(ly>=8&&ly<16):(lx>=8&&lx<16))return cc((hz?ly:lx)%4===0?'#4a3220':n<.2?'#7a5434':'#6b4a2c')}
    const row=Math.floor(wy/6),off=(row%2)*6,mx=(wx+off)%12,my=wy%6;if(mx===0||my===0)return cc('#36190f');return GP.brick[Math.floor(hash(Math.floor((wx+off)/12),row,5)*3)]}
  case 'p':{if(G.sc.temple&&(tx===41||tx===42)){const ax=tx===41?lx:lx+24;if(ax===3||ax===44)return cc('#c99a3c');if(ax>3&&ax<44)return cc(n<.1?'#6a1610':'#7a1a14')}
    const mx=wx%12,my=wy%12;if(mx===0||my===0)return cc('#2e110c');return GP.tfloor[(Math.floor(wx/12)+Math.floor(wy/12))%2]}
  case 'w':{const paddy=G.sceneId==='village'&&ty>=16&&ty<=29&&tx>=68;if(paddy){const gx=lx%6,gy=ly%6;if((gx===2&&gy<4&&gy>0)||(gx===1&&gy===1)||(gx===3&&gy===1))return cc(gy===1?'#5a8a48':'#3e6a3a')}
    else if(hash(tx,ty,2)<.25){const ax=6+Math.floor(hash(tx,ty,3)*12),ay=6+Math.floor(hash(tx,ty,4)*12);const dx=lx-ax,dy=ly-ay;if(dx*dx+dy*dy<10&&!(dx>0&&dy===0))return cc('#2f5a30')}
    if(edgeShore(tx,ty,lx,ly))return cc('#3a3226');if(n<.03)return cc('#2c4a4c');return pickc(GP.water)}
  case 'W':{if(n<.012)return cc('#24414a');if(edgeShore(tx,ty,lx,ly))return cc('#3a3226');return GP.deep[ly<12?0:1]}
  case 'B':{if(ly<2||ly>21)return cc('#2a1e14');if(lx%5===0)return cc('#2a1e14');return cc(hash(Math.floor(wx/5),0,3)<.5?'#6a4f34':'#5d452d')}
  }
  return pickc(GP.dirt)
}
function renderGroundChunk(cx,cy){
  const x0=cx*CH,y0=cy*CH,x1=Math.min(MW,x0+CH),y1=Math.min(MH,y0+CH);if(x0>=MW||y0>=MH)return null;
  const w=(x1-x0)*TS,h=(y1-y0)*TS,c=mk(w,h),g=c.getContext('2d'),img=g.createImageData(w,h),a=img.data;
  for(let ty=y0;ty<y1;ty++)for(let tx=x0;tx<x1;tx++){const t=underTile(tileAt(tx,ty),tx,ty),tn=vnoise(tx,ty,4);
    for(let ly=0;ly<TS;ly++)for(let lx=0;lx<TS;lx++){const wx=tx*TS+lx,wy=ty*TS+ly,col=groundPx(t,tx,ty,lx,ly,wx,wy,tn),i=((wy-y0*TS)*w+(wx-x0*TS))*4;a[i]=col[0];a[i+1]=col[1];a[i+2]=col[2];a[i+3]=255}}
  g.putImageData(img,0,0);return c}
// overlay: tall grass tips, bamboo and forest canopy drawn above characters
function renderOverlayChunk(cx,cy){
  const x0=cx*CH,y0=cy*CH,x1=Math.min(MW,x0+CH),y1=Math.min(MH,y0+CH);if(x0>=MW||y0>=MH)return null;
  const w=(x1-x0)*TS,h=(y1-y0)*TS,c=mk(w,h),g=c.getContext('2d');g.translate(-x0*TS,-y0*TS);let any=false;
  const R=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh)};
  for(let ty=y0-1;ty<=y1+2;ty++)for(let tx=x0-1;tx<=x1;tx++){const t=tileAt(tx,ty),px=tx*TS,py=ty*TS;
    if(t==='g'){any=true;for(let k=0;k<7;k++){const bx2=px+Math.floor(hash(tx,ty,200+k)*24),by=py+14+Math.floor(hash(tx,ty,230+k)*10),hh=5+Math.floor(hash(tx,ty,260+k)*6),lean=hash(tx,ty,290+k)<.5?-1:1;
      R(bx2,by-hh,1,hh,'#2c4a2c');R(bx2+lean,by-hh-1,1,2,'#3f6a3a');if(hash(tx,ty,320+k)<.3)R(bx2,by-hh-2,1,1,'#5a8a48')}}
    else if(t==='b'){any=true;for(let k=0;k<3;k++){const bx2=px+3+Math.floor(hash(tx,ty,400+k)*18),top=py-14-Math.floor(hash(tx,ty,410+k)*10),bot=py+20;
      R(bx2,top,2,bot-top,'#4f6c33');R(bx2,top,1,bot-top,'#6d8c44');for(let y=top+5;y<bot;y+=7)R(bx2-1,y,4,1,'#2c3d1c');
      for(let l=0;l<5;l++){const lx=bx2+Math.floor((hash(tx*3+k,ty,420+l)-.5)*12),ly=top+Math.floor(hash(tx,ty*3+k,430+l)*12);R(lx,ly,5,1,l%2?'#3a5a2a':'#2a4a22');R(lx+1,ly+1,3,1,'#24401c')}}}
    else if(t==='T'){any=true;const cxp=px+12+Math.floor((hash(tx,ty,600)-.5)*10),cyp=py+4+Math.floor((hash(tx,ty,601)-.5)*8),r=12+Math.floor(hash(tx,ty,602)*6);
      pdisc(g,cxp+2,cyp+5,r,Math.round(r*.8),'rgba(0,0,0,.35)');pdisc(g,cxp,cyp,r,Math.round(r*.85),'#0d170e');pdisc(g,cxp-2,cyp-3,r-4,Math.round((r-4)*.8),'#132216');pdisc(g,cxp-4,cyp-5,Math.max(2,r-9),Math.max(2,Math.round((r-9)*.8)),'#1b2e1d');
      for(let k=0;k<6;k++)R(cxp+Math.floor((hash(tx,ty,640+k)-.5)*r*1.4),cyp+Math.floor((hash(tx,ty,650+k)-.5)*r),2,1,'#24402a')}}
  return any?c:null}
function getChunk(cx,cy,layer){const k=layer+cx+','+cy;let v=G.chunks.get(k);if(v===undefined){v=layer==='g'?renderGroundChunk(cx,cy):renderOverlayChunk(cx,cy);G.chunks.set(k,v);
  if(G.chunks.size>160){const it=G.chunks.keys();for(let i=0;i<40;i++)G.chunks.delete(it.next().value)}}else{G.chunks.delete(k);G.chunks.set(k,v)}return v}
function drawChunks(layer,cx0,cy0){const cs=CH*TS,ax=Math.floor(cx0/cs),ay=Math.floor((cy0-(layer==='o'?40:0))/cs),bxx=Math.floor((cx0+BW)/cs),byy=Math.floor((cy0+BH+40)/cs);
  for(let cy=ay;cy<=byy;cy++)for(let cx=ax;cx<=bxx;cx++){if(cx<0||cy<0)continue;const c=getChunk(cx,cy,layer);if(c)bx.drawImage(c,cx*cs,cy*cs)}}

/* ---------------- walls, roofs (三合院 red tile with swallowtail ridge) ---------------- */
function wallParts(t){const tem=t==='P',door=t==='D';
  return[sprite('wtop'+t,24,24,R=>{if(door){R(0,0,24,24,'#4a3020');R(0,0,24,2,'#6a4a30');return}R(0,0,24,24,tem?'#8c2a1b':'#6e3a2a');R(0,0,24,2,tem?'#c99a3c':'#8a4a36');R(0,22,24,2,tem?'#6e1f15':'#5b2a1e');for(let i=0;i<24;i+=6)R(i,8,1,1,'#00000033')},true),
    sprite('wface'+t,24,WALLH,R=>{if(door){R(0,0,24,WALLH,'#5a3a22');for(let x=0;x<24;x+=6)R(x,0,1,WALLH,'#3a2416');R(11,0,2,WALLH,'#2a180c');R(9,7,1,2,'#c99a3c');R(14,7,1,2,'#c99a3c');R(0,0,24,1,'#2a180c');return}
      const base=tem?'#7a2418':'#6a3324',mort=tem?'#4a140c':'#3e1a12';R(0,0,24,WALLH,base);for(let y=0;y<WALLH;y+=4){R(0,y,24,1,mort);const off=(y/4)%2?6:0;for(let x=off;x<24;x+=12)R(x,y,1,4,mort)}R(0,WALLH-2,24,2,'#00000055');if(tem){R(0,0,24,1,'#c99a3c')}},true)]}
function drawWall(tx,ty,t){const[top,face]=wallParts(t),x=tx*TS,y=ty*TS,below=tileAt(tx,ty+1);
  bx.drawImage(top,1,1,24,24,x,y-WALLH,24,24);if(!['#','P','D'].includes(below))bx.drawImage(face,1,1,24,WALLH,x,y+TS-WALLH,24,WALLH)}
const roofCache=new Map();
function roofCanvas(hi){const k=G.sceneId+hi;if(roofCache.has(k))return roofCache.get(k);const[x0,y0,x1,y1]=G.sc.houses[hi];
  const w=(x1-x0+1)*TS+8,h=(y1-y0+1)*TS-4,c=mk(w,h+10),g=c.getContext('2d');const R=(x,y,ww,hh,col)=>{g.fillStyle=col;g.fillRect(x,y,ww,hh)};
  const horiz=(x1-x0)>=(y1-y0);R(2,4,w-4,h,'#4b241b');
  if(horiz){const mid=4+Math.floor(h*.42);for(let y=4;y<4+h;y+=4){const up=y<mid;for(let x=2;x<w-2;x+=6){const kk=hash(hi,x*7+y,2);R(x,y,5,3,up?(kk<.5?'#8a3a26':'#7a3222'):(kk<.5?'#6e2c1e':'#62271a'));R(x,y,5,1,up?'#a8503a':'#7e3626');R(x+5,y,1,3,'#3a1a12')}}
    R(0,mid-2,w,4,'#2d1712');R(0,mid-2,w,1,'#7a4a38');R(0,mid-6,3,5,'#2d1712');R(w-3,mid-6,3,5,'#2d1712');R(0,mid-8,2,2,'#2d1712');R(w-2,mid-8,2,2,'#2d1712');
    R(2,3+h-2,w-4,2,'#2a1410');R(2,3+h,w-4,6,'#00000044')}
  else{const mid=Math.floor(w/2);for(let x=2;x<w-2;x+=4){const l=x<mid;for(let y=4;y<4+h;y+=6){R(x,y,3,5,l?'#7a3222':'#62271a');R(x,y,1,5,l?'#a8503a':'#7e3626');R(x,y+5,3,1,'#3a1a12')}}R(mid-2,2,4,h+2,'#2d1712');R(mid-2,2,1,h+2,'#7a4a38');R(2,3+h,w-4,6,'#00000044')}
  roofCache.set(k,c);return c}
function roofAlpha(hi){const[x0,y0,x1,y1]=G.sc.houses[hi],P=G.player;const inside=!G.menuMode&&P.x>x0*TS-6&&P.x<(x1+1)*TS+6&&P.y>y0*TS-6&&P.y<(y1+1)*TS+10;const k='roof'+hi;G.flags[k]=lerp(G.flags[k]===undefined?1:G.flags[k],inside?0:1,.18);return G.flags[k]}

/* ---------------- lighting (art resolution, stepped falloff) ---------------- */
function castLight(cx,cy,ang,cone,rNear,rFar,ignoreWalls){
  const pts=[],N=140;for(let i=0;i<N;i++){const a=i/N*Math.PI*2,d=Math.abs(angDiff(a,ang));let len=d<cone?rFar:d<cone+.24?rNear+(rFar-rNear)*(1-(d-cone)/.24):rNear;
    let l=0;if(ignoreWalls)l=len;else{for(;l<len;l+=4){const t=tAtPx(cx+Math.cos(a)*l,cy+Math.sin(a)*l);if(OPAQUE.has(t)&&t!=='C'&&t!=='H'&&t!=='Q'){l+=10;break}}}pts.push([cx+Math.cos(a)*Math.min(l,len),cy+Math.sin(a)*Math.min(l,len)])}
  return pts}
function stepped(g,cx,cy,r,s){const gr=g.createRadialGradient(cx,cy,0,cx,cy,r);[[0,1],[.42,1],[.43,.78],[.66,.72],[.67,.42],[.86,.36],[.87,.12],[1,0]].forEach(([p,k])=>gr.addColorStop(p,`rgba(0,0,0,${s*k})`));return gr}
function cut(c,pts,cx,cy,r,s){c.beginPath();pts.forEach(([x,y],i)=>i?c.lineTo(x,y):c.moveTo(x,y));c.closePath();c.fillStyle=stepped(c,cx,cy,r,s);c.fill()}
function glow(c,x,y,r,a){c.fillStyle=stepped(c,x,y,r,a);c.beginPath();c.arc(x,y,r,0,7);c.fill()}
const lightK=()=>G.mod.light*(G.t<G.fogUntil?.75:1)*(G.t<G.darkUntil?.14:1);
function drawLight(cx0,cy0){
  const c=lctx,P=G.player,L=lightK();c.setTransform(1,0,0,1,0,0);c.globalCompositeOperation='source-over';
  const amb=G.menuMode?'rgba(4,6,16,.62)':G.over==='dawn'?'rgba(26,30,46,.45)':G.mod.id==='fog'||G.t<G.fogUntil?'rgba(14,16,22,.9)':G.mod.id==='rain'?'rgba(5,8,16,.84)':'rgba(4,6,16,.8)';
  c.clearRect(0,0,BW,BH);c.fillStyle=amb;c.fillRect(0,0,BW,BH);c.setTransform(1,0,0,1,-cx0,-cy0);c.globalCompositeOperation='destination-out';
  if(!G.menuMode&&(alive(P)||P.dead||P.gone)){const oy=P.y-6;let pts;
    if(P.spot&&P.spot.type!=='tree'){pts=castLight(P.x,oy,0,0,34,34,true);cut(c,pts,P.x,oy,34,.8)}
    else if(P.spot){pts=castLight(P.x,oy,P.face,.5,150*L,210*L,false);cut(c,pts,P.x,oy,210*L,1)}
    else{pts=castLight(P.x,oy,P.face,.42,(P.crouch?44:56)*L,250*L,false);cut(c,pts,P.x,oy,250*L,1)}}
  const flick=.86+Math.sin(G.t*13)*.06+Math.sin(G.t*7.3)*.05;
  if(G.sc.temple){if(G.incense>0){for(const[lx,ly]of G.sc.lanterns)glow(c,lx*TS,ly*TS,70*flick,.85);glow(c,G.sc.altar.x,G.sc.altar.y+30,110*flick,.8)}else glow(c,G.sc.altar.x,G.sc.altar.y,30,.5)}
  for(const l of G.lamps){const k=lampOn(l);if(k>0)glow(c,l.x+5,l.y+12,96*k,.9*k)}
  if(G.sc.truck){const[tx,ty]=G.sc.truck;c.beginPath();c.moveTo(tx-16,ty-34);c.lineTo(tx-56,ty-220);c.lineTo(tx+56,ty-220);c.lineTo(tx+16,ty-34);c.closePath();const hg=c.createLinearGradient(0,ty-34,0,ty-220);hg.addColorStop(0,'rgba(0,0,0,.9)');hg.addColorStop(1,'rgba(0,0,0,0)');c.fillStyle=hg;c.fill();glow(c,tx,ty-10,66,.7)}
  for(const w of G.wards)glow(c,w.x,w.y,w.r*1.15,.65*Math.min(1,w.t/3));
  for(const f of G.fx)if(f.type==='bang')glow(c,f.x,f.y,220*(1-f.t/f.life),1-f.t/f.life);
  for(const f of G.fuses)glow(c,f.x,f.y,26,.6);
  for(const p of G.props)if(p.type==='U'&&p.used)glow(c,p.x,p.y,40,.5);
  for(const f of G.fires)glow(c,f.x,f.y-4,64*(.9+Math.sin(G.t*17)*.05),.9);
  const A=G.apparition;if(A&&A.type==='funeral')for(const i of[0,A.members-1]){const p=apPos(A,i);glow(c,p.x+5,p.y-16,34,.6)}
  if(G.sceneId==='village')for(let gx=57;gx<=73;gx+=3)for(let gy=5;gy<=13;gy+=3)if(tileAt(gx,gy)==='G'&&hash(gx,gy,5)<.35)glow(c,tc(gx),tc(gy)-4,22+Math.sin(G.t*9+gx)*3,.55);
  c.globalCompositeOperation='source-over';
}
// is a point lit enough that you would actually see a monster standing there?
function litAt(x,y){const P=G.player,L=lightK(),d=Math.hypot(x-P.x,y-P.y);if(d<34)return 1;
  if(!P.spot||P.spot.type==='tree'){const a=Math.atan2(y-P.y,x-P.x);if(d<(P.crouch?44:56)*L)return los(P.x,P.y,x,y)?1:0;if(d<250*L&&Math.abs(angDiff(a,P.face))<.5&&los(P.x,P.y,x,y))return 1}
  for(const l of G.lamps)if(lampOn(l)>.3&&Math.hypot(l.x+5-x,l.y+12-y)<70)return 1;
  if(G.sc.temple&&G.incense>0&&Math.hypot(G.sc.altar.x-x,G.sc.altar.y+30-y)<100)return 1;
  for(const f of G.fx)if(f.type==='bang'&&Math.hypot(f.x-x,f.y-y)<160)return 1;
  for(const w of G.wards)if(Math.hypot(w.x-x,w.y-y)<w.r)return 1;
  for(const f of G.fires)if(Math.hypot(f.x-x,f.y-y)<56)return 1;
  if(G.over==='dawn')return 1;return 0}

/* ---------------- world drawing ---------------- */
function shadow(x,y,rx,a){pdisc(bx,x,y,rx,Math.max(1,Math.round(rx*.45)),`rgba(0,0,0,${a||.45})`)}
function blit(spr,x,y,flip,alpha){const w=spr.width,h=spr.height;bx.save();if(alpha!==undefined&&alpha<1)bx.globalAlpha=Math.max(0,alpha);if(flip){bx.translate(Math.round(x+w/2),0);bx.scale(-1,1);bx.drawImage(spr,0,Math.round(y-h))}else bx.drawImage(spr,Math.round(x-w/2),Math.round(y-h));bx.restore()}
function lowSprite(spr,key){let s2=SPR.get(key);if(!s2){s2=mk(spr.width,spr.height);const g=s2.getContext('2d');g.drawImage(spr,0,0,spr.width,6,0,4,spr.width,6);g.drawImage(spr,0,10,spr.width,spr.height-10,0,10,spr.width,spr.height-10);SPR.set(key,s2)}return s2}
function drawHumanPx(h){
  if(h.spot&&!(h.isPlayer&&h.spot.type==='tree'))return;
  const A=h.isPlayer?h.action:null,face=A?A.a:h.face,dir=faceDir(face),f=h.moving?Math.floor(h.anim*8)%4:0;let spr=humanSprite(h,dir,f);
  const low=crouched(h)||h.state==='hide'||(A&&A.item==='incense');
  shadow(h.x,h.y+1,h.child?4:5,.45);let y=h.y+2;if(h.drown)y+=6;
  let al=1;if(h.lured)al=.8+Math.sin(G.t*6)*.12;if(h.drown)al=.7;
  if(low)spr=lowSprite(spr,'low|'+(h.isPlayer?'P':h.name)+dir+f);
  if(h.drown){bx.save();bx.beginPath();bx.rect(h.x-20,h.y-40,40,40);bx.clip();blit(spr,h.x,y,dir==='l',al);bx.restore()}else blit(spr,h.x,y,dir==='l',al);
  if(A&&A.t<A.dur*.6){const ic=iconSprite(A.item),hx=h.x+Math.cos(face)*8,hy=h.y-12+Math.sin(face)*4;bx.drawImage(ic,Math.round(hx-ic.width/2),Math.round(hy-ic.height/2))}
}
function monMode(m){if(m.type==='kuchi'&&m.state==='ask')return m.askNear||!m.moving?'scare':'';if(m.type==='mosin'&&m.state==='stalk')return'tilt';if(m.type==='tiger'&&['chase','knock','camp','bash'].includes(m.state))return'reveal';if(m.type==='suigui'&&m.state==='drag')return'scare';if(m.type==='mosin'&&m.state==='lead')return'scare';return''}
function drawMonsterPx(m){
  if(m.hidden)return;const P=G.player;m.vis=lerp(m.vis||0,G.menuMode?0:(litAt(m.x,m.y-8)||(m.state==='bash'&&dist(m,P)<3*TS))?1:0,.18);if(m.vis<.04)return;
  const stalk=m.state==='stalk'&&m.target;let dir=faceDir(stalk?Math.atan2(m.target.y-m.y,m.target.x-m.x):m.face),mode=monMode(m);let f=m.moving?Math.floor(m.anim*(m.state==='chase'?11:stalk?5:7))%4:0;
  const A=G.apparition,held=A&&A.type==='girl'&&!A.violated&&!['drag','lead','sealed'].includes(m.state)&&dist(m,P)<14*TS;/* while 紅衣小女孩 watches: no breath, eyes on her */
  if(held)dir=faceDir(Math.atan2(A.y-m.y,A.x-m.x));
  if(A&&A.type==='funeral'&&m.state==='flee'&&m.type!=='suigui'){for(let i=0;i<A.members;i+=2){const p=apPos(A,i);if(Math.hypot(p.x-m.x,p.y-m.y)<5*TS){mode='bow';break}}}/* stepping aside for the procession, head bowed */
  const br=!held&&!m.moving&&Math.sin(G.t*(m.type==='jiang'?1.4:2.6)+m.type.length*1.7)>0;   // idle: breathing (the 殭屍 only sways)
  // jiang in stalk: it stands rooted (game.js no longer moves it) and trembles before the hop
  if(m.type==='jiang'){const ph=(m.hop||0)%1,air=m.moving&&!stalk&&ph<.55?Math.sin(ph/.55*Math.PI):0;if(stalk){const j=Math.sin(G.t*31)>.6?1:0;shadow(m.x,m.y+1,6,.45);blit(monSprite('jiang',dir,0,mode,false),m.x+j,m.y+2,dir==='l',m.vis);return}shadow(m.x,m.y+1,6-Math.round(air*2),.45-air*.15);const s=monSprite('jiang',dir,air>.3?1:0,mode,br);blit(s,m.x,m.y+2-Math.round(air*8),dir==='l',m.vis);return}
  const s=monSprite(m.type,dir,f,mode,br);let al=m.vis;
  if(m.type==='mosin')al*=(.55+(dist(m,P)<3*TS?.35:0))+Math.sin(G.t*9)*.08;
  if(m.type==='suigui'){const wet=WATER.has(tAtPx(m.x,m.y));const showH=m.state==='drag'||!wet?s.height:m.state==='chase'?17:10;
    bx.save();bx.globalAlpha=al;const dy=Math.round(m.y+2-showH);if(dir==='l'){bx.translate(Math.round(m.x+s.width/2),0);bx.scale(-1,1);bx.drawImage(s,0,0,s.width,showH,0,dy,s.width,showH)}else bx.drawImage(s,0,0,s.width,showH,Math.round(m.x-s.width/2),dy,s.width,showH);bx.restore();
    if(wet){bx.fillStyle='rgba(170,200,205,.4)';bx.fillRect(Math.round(m.x-6),Math.round(m.y+1),12,1)}
    else for(let i=0;i<2;i++){const k=(G.t*1.1+i*.5)%1;bx.fillStyle=`rgba(138,192,204,${al*(1-k)})`;bx.fillRect(Math.round(m.x+(i?3:-4)),Math.round(m.y-9+k*10),1,1+(k<.2?1:0))}return}   // drips off the hair
  if(m.type==='tiger'&&stalk){const ex=dir==='r'?[4]:dir==='l'?[-5]:dir==='d'?[-3,1]:[],k=.6+.4*Math.sin(G.t*7);bx.fillStyle=`rgba(255,214,60,${al*k})`;for(const x of ex)bx.fillRect(Math.round(m.x+x),Math.round(m.y-17),1,1)}   // the granny turns to look at you; her eyes shine like a cat's
  if(m.type==='tiger'&&mode==='reveal'&&Math.sin(G.t*3.1)>.92){bx.fillStyle=`rgba(255,250,220,${al})`;bx.fillRect(Math.round(m.x+(dir==='r'?4:dir==='l'?-5:-3)),Math.round(m.y-17),1,1)}   // eye glint
  shadow(m.x,m.y+1,m.type==='tiger'?7:6,.45);blit(s,m.x,m.y+2,dir==='l',al);
}
function drawSpotPx(s){const P=G.player,jig=s.knock>0&&!(P.holding&&s.occ.includes(P))?Math.round(Math.sin(G.t*40)):0; // holding your breath inside: the door stops rattling
  if(s.type==='cabinet'){const spr=cabinetSprite(s.open>0);bx.drawImage(spr,Math.round(s.x-spr.width/2)+jig,Math.round(s.y+12-spr.height));if(s.occ.includes(P)&&!(s.open>0)){bx.fillStyle='#fff3c8';bx.fillRect(Math.round(s.x)+jig,Math.round(s.y-6),1,1)}}
  else if(s.type==='hay'){const spr=haySprite();bx.drawImage(spr,Math.round(s.x-spr.width/2)+jig,Math.round(s.y+10-spr.height));if(s.open>0){bx.fillStyle='#140c04';bx.fillRect(Math.round(s.x-4),Math.round(s.y-4),8,5)}}
  else if(s.type==='well'){const spr=PROP.O();bx.drawImage(spr,Math.round(s.x-spr.width/2),Math.round(s.y+12-spr.height));if(s.occ.includes(P)){bx.fillStyle='#fff3c8';bx.fillRect(Math.round(s.x+2),Math.round(s.y-2),1,1)}}
  else if(s.type==='tree'){const inside=s.occ.includes(P)||(P.climbSpot===s&&P.climb>0),spr=treeSprite(s.id);blit(spr,s.x,s.y+12,false,inside?.45:dist(P,s)<26?.75:1)}}
function drawPropPx(p){const t=p.type;
  if(t==='J'){const spr=PROP.J();bx.drawImage(spr,Math.round(p.x-spr.width/2),Math.round(p.y+11-spr.height));const sw=G.t-p.ring<2?Math.round(Math.sin(G.t*20)*2):Math.round(Math.sin(G.t*1.5+p.tx));bx.fillStyle='#e8e0c0';bx.fillRect(Math.round(p.x+3+sw),Math.round(p.y-11),1,5);return}
  if(t==='X'){const spr=PROP.X();const j=G.t-p.ring<1.5?-Math.round(Math.abs(Math.sin(G.t*18))*2):0;bx.drawImage(spr,Math.round(p.x-spr.width/2),Math.round(p.y+11-spr.height)+j);return}
  if(t==='Z'){const spr=PROP.Z(),sw=G.t-p.ring<3?Math.round(Math.sin(G.t*12)*2*(1-(G.t-p.ring)/3)):0;bx.drawImage(spr,Math.round(p.x-spr.width/2)+sw,Math.round(p.y+11-spr.height));return}
  if(t==='U'){const spr=PROP.U();bx.drawImage(spr,Math.round(p.x-spr.width/2),Math.round(p.y+11-spr.height))}}
function drawLampPx(l){const x=Math.round(l.x),y=Math.round(l.y+18);bx.fillStyle='rgba(0,0,0,.4)';bx.fillRect(x-2,y,6,2);bx.fillStyle='#3a2e22';bx.fillRect(x,y-36,2,36);bx.fillStyle='#4e3e2c';bx.fillRect(x,y-36,1,36);
  bx.fillStyle='#3a2e22';bx.fillRect(x,y-36,8,1);bx.fillStyle='#24242a';bx.fillRect(x+4,y-35,6,2);const k=lampOn(l);bx.fillStyle=l.dead?'#2a2a2a':k>0?`rgb(255,${200+k*40|0},150)`:'#55524a';bx.fillRect(x+5,y-33,4,2);
  if(l.dead){bx.fillStyle='#8a9aa0';bx.fillRect(x+3,y+1,1,1);bx.fillRect(x+7,y,1,1);bx.fillRect(x-1,y+2,1,1)}}
function drawDogPx(d){if(!litAt(d.x,d.y)&&dist(d,G.player)>4*TS)return;const f=Math.floor(d.anim*(d.quiet?1:3))%2,spr=dogSprite(d.quiet?0:f,d.bark>0);shadow(d.x,d.y+1,5,.4);blit(spr,d.x,d.y+2,Math.cos(d.face)<0)}
function drawGravePx(tx,ty){const spr=graveSprite(hash(tx,ty,5)<.35?1:0);bx.drawImage(spr,tx*TS+3,ty*TS+22-spr.height)}
function drawItemPx(it){const b=Math.round(Math.sin(G.t*3+it.bob)*1.5),ic=iconSprite(it.type);bx.fillStyle='rgba(0,0,0,.4)';bx.fillRect(Math.round(it.x-5),Math.round(it.y+5),10,2);
  if(Math.sin(G.t*2+it.bob)>.7){bx.fillStyle='rgba(255,240,200,.8)';bx.fillRect(Math.round(it.x+5),Math.round(it.y-9),1,1)}bx.drawImage(ic,Math.round(it.x-ic.width/2),Math.round(it.y-12+b))}
function drawCluePx(c){const b=Math.round(Math.sin(G.t*2.4+c.bob));bx.fillStyle='rgba(0,0,0,.35)';bx.fillRect(Math.round(c.x-4),Math.round(c.y+3),8,2);bx.fillStyle='#e8e0c8';bx.fillRect(Math.round(c.x-4),Math.round(c.y-5+b),8,6);bx.fillStyle='#7a6a4a';bx.fillRect(Math.round(c.x-3),Math.round(c.y-3+b),6,1);bx.fillRect(Math.round(c.x-3),Math.round(c.y-1+b),4,1)}
function drawTruckPx(){const[x,y]=G.sc.truck,spr=truckSprite();bx.drawImage(spr,Math.round(x-spr.width/2),Math.round(y+30-spr.height));
  G.humans.filter(h=>h.saved).forEach((h,i)=>{const cx=Math.round(x-12+(i%3)*12),cy=Math.round(y-4+Math.floor(i/3)*10);bx.fillStyle=h.shirt;bx.fillRect(cx-3,cy,7,5);bx.fillStyle=h.elder?'#b7b2a8':'#1c1820';bx.fillRect(cx-2,cy-4,5,4);bx.fillStyle='#e0b48c';bx.fillRect(cx-1,cy-2,3,2)})}
function drawDecalPx(d){const x=Math.round(d.x),y=Math.round(d.y);switch(d.type){
  case 'blood':pdisc(bx,x,y,d.child?6:8,d.child?3:4,'rgba(96,14,10,.8)');bx.fillRect(x+9,y+2,2,1);bx.fillRect(x-8,y-3,1,1);break;
  case 'shoes':bx.fillStyle='#6a5a44';bx.fillRect(x-5,y-2,3,5);bx.fillRect(x+1,y-1,3,5);bx.fillStyle='#3a3024';bx.fillRect(x-5,y-2,3,1);bx.fillRect(x+1,y-1,3,1);break;
  case 'confetti':bx.fillStyle=d.s>1?'#b52a18':'#8a1e12';bx.fillRect(x,y,2,1);break;
  case 'oil':pdisc(bx,x,y,11,5,'rgba(60,40,10,.55)');break;
  case 'ash':pdisc(bx,x,y,5,2,'rgba(30,30,30,.6)');break;
  case 'talisman':bx.fillStyle='#d8bb52';bx.fillRect(x-2,y-4,5,8);bx.fillStyle='#a82018';bx.fillRect(x-1,y-2,3,1);bx.fillRect(x,y-3,1,5);break;
  case 'ripplemark':bx.fillStyle='rgba(150,180,180,.25)';bx.fillRect(x-6,y,12,1);break}}
function drawWardPx(w){const a=Math.min(1,w.t/3);bx.fillStyle=`rgba(201,153,60,${.5*a})`;for(let i=0;i<28;i++){const ang=i/28*6.28+G.t*.3;if(i%2)bx.fillRect(Math.round(w.x+Math.cos(ang)*w.r),Math.round(w.y+Math.sin(ang)*w.r*.6),2,1)}
  bx.fillStyle='#8a6420';bx.fillRect(Math.round(w.x-3),Math.round(w.y),6,2);bx.fillStyle='#7a2a16';[-2,0,2].forEach(dx=>bx.fillRect(Math.round(w.x+dx),Math.round(w.y-8),1,8));bx.fillStyle='#ffb347';[-2,0,2].forEach(dx=>bx.fillRect(Math.round(w.x+dx),Math.round(w.y-9),1,1));
  for(let i=0;i<3;i++){const k=(G.t*.4+i/3)%1;bx.fillStyle=`rgba(220,215,200,${.3*(1-k)})`;bx.fillRect(Math.round(w.x+Math.sin(k*6+i)*3),Math.round(w.y-12-k*20),2,2)}}

/* ---------------- weather ---------------- */
let fogTex=null;
function makeFog(){const c=mk(128,128),g=c.getContext('2d');for(let i=0;i<22;i++){const x=hash(i,1,9)*128,y=hash(i,2,9)*128,r=14+hash(i,3,9)*30;for(const ox of[-128,0,128])for(const oy of[-128,0,128])pdisc(g,x+ox,y+oy,Math.round(r),Math.round(r*.6),'rgba(190,200,210,.07)')}fogTex=c}
function drawFog(cx0,cy0){if(!fogTex)makeFog();const a=G.mod.id==='fog'||G.t<G.fogUntil?.9:G.mod.id==='rain'?.35:.3;bx.save();bx.globalAlpha=a;const s=128,ox=Math.floor(G.t*5)%s,oy=Math.floor(G.t*1.5)%s;
  for(let y=Math.floor((cy0-oy)/s)*s+oy-s;y<cy0+BH;y+=s)for(let x=Math.floor((cx0-ox)/s)*s+ox-s;x<cx0+BW;x+=s)bx.drawImage(fogTex,x,y);bx.restore()}
function drawRain(cx0,cy0){if(G.mod.id!=='rain')return;bx.fillStyle='rgba(170,190,215,.45)';for(let i=0;i<70;i++){const x=Math.floor((hash(i,1,3)*BW+G.t*40*(.8+hash(i,2,3)))%BW),y=Math.floor((hash(i,4,3)*BH+G.t*340*(.8+hash(i,5,3)*.4))%BH);bx.fillRect(cx0+x,cy0+y,1,3)}}

/* ---------------- camera ---------------- */
function updCam(snap){const P=G.player,vw=BW,vh=BH;let tx,ty;
  if(G.menuMode){tx=G.menuCam.x-vw/2;ty=G.menuCam.y-vh/2}else{tx=P.x+Math.cos(P.face)*14-vw/2;ty=P.y-10+Math.sin(P.face)*10-vh/2}
  tx=vw>=WW?(WW-vw)/2:clamp(tx,0,WW-vw);ty=vh>=WH?(WH-vh)/2:clamp(ty,-20,WH-vh);
  if(snap||!CAM.init){CAM.x=tx;CAM.y=ty;CAM.init=true}else{CAM.x+=(tx-CAM.x)*.12;CAM.y+=(ty-CAM.y)*.12}}
const toS=(x,y,cx0,cy0)=>[(x-cx0)*CAM.z,(y-cy0)*CAM.z];

/* ---------------- frame ---------------- */
function draw(){
  updCam();if(mouse.active&&mouse.fx!==undefined){mouse.x=CAM.x+mouse.fx*BW;mouse.y=CAM.y+mouse.fy*BH}
  const sh=RM?0:G.shake*5,cx0=Math.round(CAM.x+Math.sin(G.t*90)*sh),cy0=Math.round(CAM.y+Math.cos(G.t*77)*sh),P=G.player;
  bx.setTransform(1,0,0,1,0,0);bx.imageSmoothingEnabled=false;bx.fillStyle='#07080a';bx.fillRect(0,0,BW,BH);bx.setTransform(1,0,0,1,-cx0,-cy0);
  const inView=(x,y,m)=>x>cx0-m&&x<cx0+BW+m&&y>cy0-m&&y<cy0+BH+m+40;
  drawChunks('g',cx0,cy0);
  for(const d of G.decals)if(inView(d.x,d.y,20))drawDecalPx(d);
  for(const w of G.wards)drawWardPx(w);
  for(const f of G.fires)if(inView(f.x,f.y,30))drawFirePx(f);
  for(const c of G.candies){const ic=iconSprite('candy');bx.drawImage(ic,Math.round(c.x-8),Math.round(c.y-10))}
  for(const f of G.fuses){const ic=iconSprite('firecracker');bx.drawImage(ic,Math.round(f.x-8),Math.round(f.y-12));bx.fillStyle='#ffd46a';for(let i=0;i<3;i++)bx.fillRect(Math.round(f.x+5+(Math.random()-.5)*6),Math.round(f.y-12+(Math.random()-.5)*6),1,1)}
  for(const it of G.items)if(!it.taken&&inView(it.x,it.y,20))drawItemPx(it);
  for(const c of G.clues)if(!c.taken&&inView(c.x,c.y,20))drawCluePx(c);
  for(const f of G.fx){const k=f.t/f.life;if(f.type==='ripple'){bx.fillStyle=`rgba(170,200,205,${.45*(1-k)})`;const r=Math.round(3+k*12);bx.fillRect(Math.round(f.x-r),Math.round(f.y),r*2,1);bx.fillRect(Math.round(f.x-r+2),Math.round(f.y-2),Math.max(1,r*2-4),1)}
    if(f.type==='splash'){bx.fillStyle=`rgba(200,225,230,${.7*(1-k)})`;for(let i=0;i<8;i++){const a=i*.8;bx.fillRect(Math.round(f.x+Math.cos(a)*(3+k*12)),Math.round(f.y+Math.sin(a)*(2+k*5)-Math.sin(k*3)*8),1,1)}}}
  // y-sorted world: walls, roofs, props, hiding spots, people and monsters
  const ents=[],tx0=Math.max(0,Math.floor(cx0/TS)-1),tx1=Math.min(MW-1,Math.ceil((cx0+BW)/TS)+1),ty0=Math.max(0,Math.floor(cy0/TS)-1),ty1=Math.min(MH-1,Math.ceil((cy0+BH)/TS)+2);
  const roofA=G.sc.houses.map((r,hi)=>roofAlpha(hi));const inRoof=(tx,ty)=>G.sc.houses.findIndex(([a,b,c,d])=>tx>=a&&tx<=c&&ty>=b&&ty<=d);
  for(let ty=ty0;ty<=ty1;ty++)for(let tx=tx0;tx<=tx1;tx++){const t=tileAt(tx,ty);
    if(t==='#'||t==='P'||t==='D'){const hi=t==='P'?-1:inRoof(tx,ty);const last=hi>=0&&ty===G.sc.houses[hi][3];if(hi>=0&&roofA[hi]>.97&&!last)continue;ents.push({y:(ty+1)*TS-.5,d:()=>drawWall(tx,ty,t)})}
    else if(t==='G')ents.push({y:(ty+1)*TS-2,d:()=>drawGravePx(tx,ty)});
    else if(t==='Q')ents.push({y:ty*TS+18,d:()=>{const s=launderSprite(tx,ty),sw=Math.round(Math.sin(G.t*1.3+tx)*.6);bx.drawImage(s,tx*TS-1+sw,ty*TS+20-s.height)}});
    else if(t==='K')ents.push({y:(ty+1)*TS-4,d:()=>{const s=furnitureSprite(underTile(t,tx,ty));bx.drawImage(s,tx*TS+1,ty*TS+20-s.height)}});
    else if(t==='A'&&tileAt(tx-1,ty)!=='A')ents.push({y:(ty+1)*TS,d:()=>{const s=altarSprite();bx.drawImage(s,tx*TS-1,ty*TS+22-s.height)}})}
  G.sc.houses.forEach((r,hi)=>{const a=roofA[hi];if(a<.03)return;ents.push({y:(r[3]+1)*TS-1,d:()=>{const c=roofCanvas(hi);bx.save();bx.globalAlpha=a;bx.drawImage(c,r[0]*TS-4,r[1]*TS-WALLH-6);bx.restore()}})});
  for(const p of G.props)if(inView(p.x,p.y,40))ents.push({y:p.y+10,d:()=>drawPropPx(p)});
  for(const l of G.lamps)if(inView(l.x,l.y,40))ents.push({y:l.y+17,d:()=>drawLampPx(l)});
  for(const s of G.spots)if(inView(s.x,s.y,50))ents.push({y:s.y+(s.type==='tree'?11:9),d:()=>drawSpotPx(s)});
  for(const d of G.dogs)if(inView(d.x,d.y,20))ents.push({y:d.y,d:()=>drawDogPx(d)});
  for(const h of G.humans)if(!h.dead&&!h.gone&&!h.saved&&!h.escaped&&!(h.isPlayer&&h.spot)&&inView(h.x,h.y,30))ents.push({y:h.y,d:()=>drawHumanPx(h)});
  for(const m of G.monsters)if(inView(m.x,m.y,40))ents.push({y:m.y,d:()=>drawMonsterPx(m)});
  if(G.apparition)ents.push({y:G.apparition.y||0,d:()=>drawApparition(G.apparition)});
  if(G.sc.truck)ents.push({y:G.sc.truck[1]+30,d:drawTruckPx});
  ents.sort((a,b)=>a.y-b.y).forEach(e=>e.d());
  drawChunks('o',cx0,cy0);
  if(P.spot&&P.spot.type==='tree')drawHumanPx(P);
  for(const p of G.proj){const k=p.t/p.dur,hgt=Math.sin(k*Math.PI)*24;bx.fillStyle='rgba(0,0,0,.4)';bx.fillRect(Math.round(p.x-3),Math.round(p.y+1),6,2);const ic=iconSprite(p.type);bx.drawImage(ic,Math.round(p.x-8),Math.round(p.y-hgt-12));
    if(p.type==='firecracker'){bx.fillStyle='#ffd46a';bx.fillRect(Math.round(p.x+6),Math.round(p.y-hgt-13),1,1)}}
  for(const f of G.fx){const k=f.t/f.life;
    if(f.type==='oil'){for(let i=0;i<18;i++){const a=f.a+(i/18-.5)*1.4,r=8+k*64*(.45+((i*7)%5)/8),hz=Math.sin(Math.min(1,k*1.6)*Math.PI)*10;bx.fillStyle=i%3?`rgba(224,160,64,${1-k})`:`rgba(255,210,122,${1-k})`;bx.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r-hz),2,2)}}
    if(f.type==='bang'){const r=Math.round(8+k*60);bx.fillStyle=`rgba(255,226,150,${1-k})`;for(let i=0;i<24;i++){const a=i/24*6.28;bx.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r*.7),2,2)}
      if(k<.25)pdisc(bx,f.x,f.y-4,Math.max(1,Math.round(14*(1-k*3))),Math.max(1,Math.round(10*(1-k*3))),'rgba(255,240,200,.9)');for(let i=0;i<14;i++){const a=i*.45,rr=6+k*44;bx.fillStyle=i%2?'#c03a22':'#ffd27a';bx.fillRect(Math.round(f.x+Math.cos(a)*rr),Math.round(f.y+Math.sin(a)*rr*.7-Math.sin(k*3)*12),2,1)}}
    if(f.type==='pickup'){const ic=iconSprite(f.item);bx.save();bx.globalAlpha=1-k;bx.drawImage(ic,Math.round(f.x-8),Math.round(f.y-18-k*20));bx.restore()}
    if(f.type==='glass'){bx.fillStyle=`rgba(200,220,230,${1-k})`;for(let i=0;i<8;i++)bx.fillRect(Math.round(f.x+(hash(i,1,7)-.5)*32*k),Math.round(f.y+k*k*30+(hash(i,2,7)-.5)*6),1,1)}
    if(f.type==='dust'){bx.fillStyle=`rgba(160,140,110,${.6*(1-k)})`;for(let i=0;i<6;i++)bx.fillRect(Math.round(f.x+(hash(i,3,7)-.5)*20),Math.round(f.y-k*10-hash(i,4,7)*8),2,2)}
    if(f.type==='cat'){const c=catSprite(),d=k*60;bx.drawImage(c,Math.round(f.x+Math.cos(f.a)*d-6),Math.round(f.y+Math.sin(f.a)*d-6))}}
  drawFog(cx0,cy0);drawRain(cx0,cy0);
  drawLight(cx0,cy0);bx.save();bx.setTransform(1,0,0,1,0,0);bx.drawImage(lightCv,0,0);bx.restore();
  // emissive things that read in the dark
  bx.save();bx.globalCompositeOperation='lighter';
  for(const l of G.lamps){const k=lampOn(l);if(k>0&&inView(l.x,l.y,60))pdisc(bx,l.x+7,l.y-12,Math.max(1,Math.round(18*k)),Math.max(1,Math.round(9*k)),`rgba(230,190,110,${.12*k})`)}
  if(G.sc.temple&&G.incense>0)for(const[lx,ly]of G.sc.lanterns)pdisc(bx,lx*TS,ly*TS,10,10,'rgba(200,70,30,.25)');
  for(const f of G.fuses)pdisc(bx,f.x,f.y-6,5,5,'rgba(255,190,90,.5)');
  const vx0=Math.floor(cx0/TS),vy0=Math.floor(cy0/TS),vx1=Math.ceil((cx0+BW)/TS),vy1=Math.ceil((cy0+BH)/TS);
  for(let y=vy0;y<vy1;y++)for(let x=vx0;x<vx1;x++){const t=tileAt(x,y);if((t==='g'||t==='w'||t==='b')&&hash(x,y,77)<.06){const ph=hash(x,y,78)*9,k=Math.max(0,Math.sin(G.t*1.6+ph));if(k<.2)continue;bx.fillStyle=`rgba(200,240,120,${.8*k})`;bx.fillRect(Math.round(tc(x)+Math.sin(G.t*.7+ph)*9),Math.round(tc(y)-6+Math.cos(G.t*.9+ph)*7),1,1)}}
  bx.restore();
  if(G.sc.temple&&G.incense>0)for(const[lx,ly]of G.sc.lanterns){const s=lanternSprite();bx.drawImage(s,Math.round(lx*TS-4),Math.round(ly*TS-6))}
  if(G.sc.temple&&G.incense>0){const al=G.sc.altar;for(let i=0;i<5;i++){const k=(G.t*.32+i/5)%1;bx.fillStyle=`rgba(220,210,190,${.25*(1-k)})`;bx.fillRect(Math.round(al.x+Math.sin(k*6+i)*4),Math.round(al.y-6-k*26),2,2)}}
  for(const l of G.lamps){const k=lampOn(l);if(k>0){bx.fillStyle=`rgba(255,236,170,${.5+k*.5})`;bx.fillRect(Math.round(l.x+5),Math.round(l.y-15),4,2)}}
  if(G.sceneId==='village')for(let gx=57;gx<=73;gx+=3)for(let gy=5;gy<=13;gy+=3)if(tileAt(gx,gy)==='G'&&hash(gx,gy,5)<.35){bx.fillStyle=Math.sin(G.t*9+gx)>0?'#ffd27a':'#ffb347';bx.fillRect(gx*TS+3,gy*TS+10,1,1);bx.fillRect(gx*TS+18,gy*TS+10,1,1)}
  // eyes in the dark: you notice them before you see them
  for(const m of G.monsters){if(m.hidden||!inView(m.x,m.y,20)||m.vis>.6)continue;const d=dist(m,P),ex=Math.round(m.x),ey=Math.round(m.y);
    if(m.type==='tiger'&&d<9*TS&&m.state!=='flee'){bx.fillStyle='rgba(255,210,60,.95)';bx.fillRect(ex-3,ey-17,2,1);bx.fillRect(ex+1,ey-17,2,1)}
    if(m.type==='kuchi'&&m.state==='chase'){bx.fillStyle='rgba(220,60,40,.85)';bx.fillRect(ex-2,ey-19,4,1)}
    if(m.type==='suigui'&&d<10*TS&&m.state!=='drag'){bx.fillStyle='rgba(220,250,240,.7)';bx.fillRect(ex,ey-6,1,1)}
    if(m.type==='mosin'&&d<6*TS){bx.fillStyle=`rgba(242,208,74,${.6+Math.sin(G.t*8)*.3})`;bx.fillRect(ex-2,ey-12,1,1);bx.fillRect(ex+2,ey-12,1,1)}}
  // sounds made visible
  for(const f of G.fx){const k=f.t/f.life;if(f.type==='step'){bx.fillStyle=`rgba(208,72,44,${(f.big?.7:.45)*(1-k)})`;const r=Math.round(3+k*(f.big?16:10));for(let i=0;i<12;i++){const a=i/12*6.28;bx.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r*.6),1,1)}}
    if(f.type==='ring'){bx.fillStyle=`rgba(231,217,177,${.22*(1-k)})`;const r=Math.round(k*f.r);for(let i=0;i<24;i++){const a=i/24*6.28;bx.fillRect(Math.round(f.x+Math.cos(a)*r),Math.round(f.y+Math.sin(a)*r*.6),1,1)}}}
  if(!G.menuMode){const type=ITEM_ORDER[G.sel];
    if(alive(P)&&mouse.active&&!touchVec&&(type==='firecracker'||type==='candy')&&G.inv[type]&&!(P.spot&&P.spot.type!=='tree')){const max=(type==='firecracker'?7.5:6.5)*TS,d=Math.min(max,Math.hypot(mouse.x-P.x,mouse.y-P.y)),a=Math.atan2(mouse.y-P.y,mouse.x-P.x);
      bx.fillStyle='rgba(231,217,177,.55)';for(let i=1;i<=14;i++){const k=i/14;bx.fillRect(Math.round(P.x+Math.cos(a)*d*k),Math.round(P.y-8+Math.sin(a)*d*k-Math.sin(k*Math.PI)*d*.18),1,1)}
      const lx=P.x+Math.cos(a)*d,ly=P.y+Math.sin(a)*d,r=type==='firecracker'?7:4;for(let i=0;i<12;i++){const aa=i/12*6.28;bx.fillRect(Math.round(lx+Math.cos(aa)*r),Math.round(ly+Math.sin(aa)*r*.6),1,1)}}
    if(G.tut)TUT.drawWorld(bx)}
  // scale the art buffer up to the screen with square pixels
  ctx.setTransform(1,0,0,1,0,0);ctx.imageSmoothingEnabled=false;ctx.fillStyle='#050608';ctx.fillRect(0,0,cv.width,cv.height);ctx.drawImage(buf,0,0,BW*CAM.k,BH*CAM.k);
  drawScreen(cx0,cy0);
}

/* ---------------- screen layer: text and markers at full resolution ---------------- */
function drawBubble(b,cx0,cy0){
  const P=G.player,d=Math.hypot(b.x-P.x,b.y-P.y);if(d>18*TS&&b.kind!=='info')return;
  const a=Math.min(1,(b.life-b.t)/.4,b.t/.12);ctx.save();ctx.globalAlpha=a;const fs=b.kind==='monster'?16:14;ctx.font=`${fs}px ${FONT_D}`;
  const w=ctx.measureText(b.text).width+18,h=fs+12;const[sx,sy]=toS(b.x,b.y-(b.ent&&b.ent.def?34:b.ent&&b.ent.child?22:30),cx0,cy0);
  const x=clamp(sx,w/2+8,SW-w/2-8),y=clamp(sy,h/2+56,SH-h/2-96),off=Math.abs(x-sx)>2||Math.abs(y-sy)>2;
  const col=b.kind==='monster'?'#f06a4e':b.kind==='scream'?'#f6ead0':b.kind==='info'?PAL.gold:PAL.paper;
  if(b.kind==='monster'){ctx.fillStyle='rgba(12,6,6,.9)';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.fillStyle='#8a1e12';ctx.fillRect(x-w/2,y-h/2,3,h);ctx.fillStyle=col}
  else if(b.kind==='info'||b.kind==='scream'){ctx.fillStyle='rgba(10,10,12,.82)';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.fillStyle=col}
  else{ctx.fillStyle='rgba(231,217,177,.95)';ctx.beginPath();ctx.moveTo(x-w/2,y-h/2);ctx.lineTo(x+w/2,y-h/2);ctx.lineTo(x+w/2,y+h/2);ctx.lineTo(x+5,y+h/2);ctx.lineTo(x,y+h/2+6);ctx.lineTo(x-5,y+h/2);ctx.lineTo(x-w/2,y+h/2);ctx.closePath();ctx.fill();ctx.fillStyle='#2b1f14'}
  ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(b.text,x,y+1);
  if(off){const ang=Math.atan2(sy-y,sx-x);ctx.fillStyle=col;ctx.save();ctx.translate(x+Math.cos(ang)*(w/2+8),y+Math.sin(ang)*(h/2+8));ctx.rotate(ang);ctx.beginPath();ctx.moveTo(6,0);ctx.lineTo(-3,-5);ctx.lineTo(-3,5);ctx.fill();ctx.restore()}
  ctx.restore()}
function drawPrompt(it,cx0,cy0){if(!it)return;ctx.save();ctx.font=`14px ${FONT_D}`;const w=ctx.measureText(it.label).width+42,h=28;let[x,y]=toS(it.x,it.y-38,cx0,cy0);x=clamp(x,w/2+8,SW-w/2-8);
  ctx.fillStyle='rgba(231,217,177,.96)';ctx.fillRect(x-w/2,y-h/2,w,h);ctx.fillStyle='#2b1f14';ctx.fillRect(x-w/2+5,y-10,20,20);ctx.fillStyle=PAL.paper;ctx.font=`bold 12px ${FONT_B}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText(UI.touch?'互':'E',x-w/2+15,y+1);
  ctx.fillStyle=it.fn?'#2b1f14':'#8a7a5a';ctx.font=`14px ${FONT_D}`;ctx.fillText(it.label,x+12,y+1);ctx.restore()}
function edgeArrow(wx,wy,label,col,cx0,cy0,urgent){const[sx,sy]=toS(wx,wy,cx0,cy0);if(sx>20&&sx<SW-20&&sy>70&&sy<SH-100)return;const cx=SW/2,cy=SH/2,a=Math.atan2(sy-cy,sx-cx),k=Math.min((SW/2-40)/Math.abs(Math.cos(a)||1e-6),(SH/2-110)/Math.abs(Math.sin(a)||1e-6));
  ctx.save();ctx.translate(cx+Math.cos(a)*k,cy+Math.sin(a)*k);const pu=urgent&&!RM?Math.sin(G.t*Math.PI*2*1.6):0;ctx.globalAlpha=urgent?.7+pu*.3:.8+Math.sin(G.t*4)*.2;ctx.fillStyle=col;ctx.rotate(a);if(urgent){const sc=1.15+pu*.2;ctx.scale(sc,sc)}ctx.beginPath();ctx.moveTo(11,0);ctx.lineTo(-5,-8);ctx.lineTo(-5,8);ctx.closePath();ctx.fill();if(urgent){const sc=1.15+pu*.2;ctx.scale(1/sc,1/sc)}ctx.rotate(-a);ctx.font=`${urgent?'bold 15px':'14px'} ${FONT_D}`;ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=6;ctx.fillText(label,-Math.cos(a)*26,-Math.sin(a)*26+5);ctx.restore()}
function drawScreen(cx0,cy0){
  const P=G.player;ctx.setTransform(S,0,0,S,0,0);
  if(!G.menuMode){
    ctx.font=`13px ${FONT_D}`;ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=4;
    for(const h of G.humans){if(h.isPlayer||!alive(h))continue;const near=dist(h,P)<5*TS;if(!(h.met||near))continue;const lx=h.spot?h.spot.x:h.x,ly=(h.spot?h.spot.y:h.y)-(h.child?24:30);const[sx,sy]=toS(lx,ly,cx0,cy0);if(sx<-40||sx>SW+40||sy<-20||sy>SH+20)continue;
      const tag=h.lured?'被牽走':h.drown?'溺水':h.state==='follow'?'':h.state==='stay'?'等你':h.state==='hide'?'躲著':h.state==='panic'?'！':h.state==='freeze'?'不敢動':'';const q=h.quirk&&h.met?`（${QUIRKS[h.quirk].name}）`:'';
      ctx.fillStyle=(h.lured||h.drown)?'#f06a4e':h.state==='follow'?PAL.gold:'rgba(231,217,177,.85)';ctx.fillText(h.name+q+(tag?'・'+tag:''),sx,sy);
      if(h.holding&&h.breath>0){ctx.strokeStyle='rgba(180,210,230,.85)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(sx,sy+14,7,-Math.PI/2,-Math.PI/2+6.28*h.breath/h.maxBreath);ctx.stroke()}}
    ctx.shadowBlur=0;
    for(const m of G.monsters){if(m.hidden||!(m.alertT>0&&m.target===P))continue;const[sx,sy]=toS(m.x,m.y-36,cx0,cy0);ctx.save();ctx.globalAlpha=Math.min(1,m.alertT*2);ctx.fillStyle='#f06a4e';ctx.font=`bold 24px ${FONT_D}`;ctx.textAlign='center';ctx.fillText('！',sx,sy-(1.2-m.alertT)*10);ctx.restore()}
    if((P.holding||P.breath<P.maxBreath-.05)&&alive(P)){const[sx,sy]=toS(P.x,P.y-12,cx0,cy0);ctx.strokeStyle='rgba(0,0,0,.55)';ctx.lineWidth=5;ctx.beginPath();ctx.arc(sx,sy,24,0,7);ctx.stroke();ctx.strokeStyle=P.gasp>0?'#f06a4e':P.holding?'#a9d0e6':'rgba(169,208,230,.5)';ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,24,-Math.PI/2,-Math.PI/2+6.28*P.breath/P.maxBreath);ctx.stroke()}
    if(P.climb>0){const[sx,sy]=toS(P.x,P.y-30,cx0,cy0);ctx.strokeStyle=PAL.gold;ctx.lineWidth=3;ctx.beginPath();ctx.arc(sx,sy,9,-Math.PI/2,-Math.PI/2+Math.PI*2*(1-P.climb/HIDES.tree.enter));ctx.stroke()}
    drawPrompt(G.over?null:interactTarget(),cx0,cy0);
    if(alive(P)){const f=G.humans.some(h=>!h.isPlayer&&h.state==='follow'&&alive(h));if(G.sc.truck&&(f||G.humans.every(h=>h.isPlayer||!alive(h)||h.saved)))edgeArrow(G.sc.truck[0],G.sc.truck[1]-10,'貨車',PAL.jade,cx0,cy0);
      for(const h of G.humans)if(!h.isPlayer&&alive(h)&&h.reveal>G.t)edgeArrow(h.x,h.y,h.name,PAL.gold,cx0,cy0,G.final)}/* last call: the arrows pulse harder (1.6 Hz) */
  }
  {const said=new Set();for(let i=G.bubbles.length-1;i>=0;i--){const b=G.bubbles[i];if(b.ent){if(said.has(b.ent))continue;said.add(b.ent)}drawBubble(b,cx0,cy0)}}/* one bubble per speaker: the newest wins */
  const vg=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*.32,SW/2,SH/2,Math.max(SW,SH)*.74);vg.addColorStop(0,'rgba(0,0,0,0)');vg.addColorStop(1,'rgba(0,0,0,.6)');ctx.fillStyle=vg;ctx.fillRect(0,0,SW,SH);
  if(G.danger>0&&!G.menuMode){const pulse=.5+.5*Math.sin(G.t*(4+G.danger*7));const g=ctx.createRadialGradient(SW/2,SH/2,Math.min(SW,SH)*.3,SW/2,SH/2,Math.max(SW,SH)*.72);g.addColorStop(0,'rgba(120,10,6,0)');g.addColorStop(1,`rgba(140,10,6,${G.danger*.5*(.55+.45*pulse)})`);ctx.fillStyle=g;ctx.fillRect(0,0,SW,SH)}
  if(G.final&&!G.over&&!G.menuMode){ctx.fillStyle=`rgba(150,20,10,${.06+.04*Math.sin(G.t*6)})`;ctx.fillRect(0,0,SW,SH)}
  drawRuleScreen();
  if(P.lured||P.drown){ctx.fillStyle=P.lured?`rgba(40,70,30,${.25+Math.sin(G.t*5)*.08})`:`rgba(20,40,60,${.3+Math.sin(G.t*5)*.08})`;ctx.fillRect(0,0,SW,SH);ctx.fillStyle=PAL.paper;ctx.font=`22px ${FONT_D}`;ctx.textAlign='center';ctx.shadowColor='#000';ctx.shadowBlur=8;
    ctx.fillText(P.lured?(G.inv.firecracker?'連按方向鍵掙脫，或放鞭炮！':'連按方向鍵掙脫！'):'連按方向鍵踢開水裡的手！',SW/2,SH*.3);ctx.shadowBlur=0}
  if(UI.joy){const j=UI.joy,r=Math.min(SW,SH)*.08;ctx.strokeStyle='rgba(231,217,177,.35)';ctx.lineWidth=2;ctx.beginPath();ctx.arc(j.ox,j.oy,r,0,7);ctx.stroke();const dx=j.x-j.ox,dy=j.y-j.oy,l=Math.hypot(dx,dy),k=l>r?r/l:1;ctx.fillStyle='rgba(231,217,177,.45)';ctx.beginPath();ctx.arc(j.ox+dx*k,j.oy+dy*k,r*.42,0,7);ctx.fill()}
  if(G.over==='dawn'){ctx.fillStyle='rgba(255,200,160,.1)';ctx.fillRect(0,0,SW,SH)}
  drawJumpScare();
}
// the moment you are caught: the monster lunges out of the dark into the lens (~0.95 s), then the death card
const lungeActive=()=>!!(G&&((G.scare&&G.scare.at&&(LUNGE_FREEZE!=null||(performance.now()-G.scare.at)/1000<1.15))||(G.flash&&G.flash.at<.75&&CLOSEUP)));
function drawJumpScare(){const sc=G.scare;if(!sc||!sc.type)return;const now=performance.now();if(!sc.at)sc.at=now;const age=LUNGE_FREEZE!=null?LUNGE_FREEZE:(now-sc.at)/1000;if(age>1.15)return;
  if(!sc.o)sc.o=lungeOrigin(sc.type);if(CLOSEUP)drawLunge(sc.type,age,sc.o,false);else drawRedFade(age,false)}

/* ---------------- portraits for the codex, the encounter card and the death card ---------------- */
function drawPortrait(type,c,w,silhouette,close){
  if(close){c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;const bg=c.createRadialGradient(w/2,w*.55,w*.05,w/2,w/2,w*.75);bg.addColorStop(0,'#3a0c08');bg.addColorStop(1,'#060203');c.fillStyle=bg;c.fillRect(0,0,w,w);
    const spr=closeSprite(type,2),k=Math.max(1,Math.ceil(w/spr.width));c.drawImage(spr,Math.round((w-spr.width*k)/2),Math.round((w-spr.height*k)/2),spr.width*k,spr.height*k);
    const v=c.createRadialGradient(w/2,w/2,w*.32,w/2,w/2,w*.74);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.6)');c.fillStyle=v;c.fillRect(0,0,w,w);c.restore();return}
  c.save();c.setTransform(1,0,0,1,0,0);c.imageSmoothingEnabled=false;const bg=c.createRadialGradient(w/2,w*.62,w*.04,w/2,w*.5,w*.72);bg.addColorStop(0,silhouette?'#22201c':'#3a2c20');bg.addColorStop(.5,'#16161a');bg.addColorStop(1,'#08090b');c.fillStyle=bg;c.fillRect(0,0,w,w);
  let spr=MON_SIZE[type]?monSprite(type,'d',0,silhouette?'':'scare'):apparitionSprite(type==='funeral'?'mourn':type,!silhouette);if(silhouette){const t=mk(spr.width,spr.height),g=t.getContext('2d');g.drawImage(spr,0,0);g.globalCompositeOperation='source-in';g.fillStyle='#050506';g.fillRect(0,0,t.width,t.height);spr=t}
  const k=Math.max(1,Math.floor(w*.84/Math.max(spr.width,spr.height)));c.drawImage(spr,Math.round((w-spr.width*k)/2),Math.round(w-spr.height*k-w*.04),spr.width*k,spr.height*k);
  const v=c.createRadialGradient(w/2,w/2,w*.3,w/2,w/2,w*.72);v.addColorStop(0,'rgba(0,0,0,0)');v.addColorStop(1,'rgba(0,0,0,.55)');c.fillStyle=v;c.fillRect(0,0,w,w);c.restore()}
