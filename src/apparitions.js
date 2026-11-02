/* =====================================================================
   Apparition visuals: 紅衣小女孩, 夜半送葬, 叫名字, plus the rule banner
   and the brief flash when a rule is broken. Logic lives in game.js.
   ===================================================================== */
function apparitionSprite(type,scare){
  if(type==='girl')return sprite('girl'+(scare?1:0),10,17,R=>{const RD='#b0171f',RDD='#7a0d12',H='#0e0b10',SK='#e8d8c8';
    R(1,0,8,7,H);R(0,3,1,4,H);R(9,3,1,4,H);R(2,3,6,4,SK);R(2,3,6,2,H);
    if(scare){R(2,4,2,1,'#000');R(6,4,2,1,'#000');R(3,6,4,1,'#6a0a0a');R(2,3,1,1,H)}
    R(2,7,6,1,SK);R(1,8,8,3,RD);R(0,11,10,4,RD);R(7,8,2,7,RDD);R(0,14,10,1,RDD);R(0,8,1,3,SK);R(9,8,1,3,SK);R(3,15,1,1,SK);R(6,15,1,1,SK);R(2,16,2,1,'#151418');R(6,16,2,1,'#151418')});
  if(type==='hongbao')return sprite('hongbao',9,7,R=>{R(0,1,9,6,'#a8141a');R(0,1,9,1,'#d8343a');R(0,6,9,1,'#6e0a0e');R(3,3,3,2,'#d8b048');R(4,2,1,1,'#f0d070')});
  if(type==='baby')return sprite('baby',10,8,R=>{R(1,2,8,6,'#cfc6b0');R(0,4,10,3,'#b4ab94');R(3,1,4,3,'#e6d6c4');R(3,2,1,1,'#000');R(6,2,1,1,'#000');R(2,7,6,1,'#8e866e')});
  if(type==='qiye')return sprite('qiye'+(scare?1:0),10,30,R=>{const W='#dcd8ce',WD='#a8a498';R(2,0,6,8,W);R(2,0,6,1,WD);R(4,2,2,4,'#1a1816');R(3,8,4,5,'#e8e0d4');R(3,10,1,1,'#000');R(6,10,1,1,'#000');R(4,12,2,scare?7:5,'#b01818');
    R(1,13,8,15,W);R(7,13,2,15,WD);R(0,15,1,8,W);R(9,15,1,8,W);R(3,28,2,2,'#1a1816');R(6,28,2,2,'#1a1816')});
  if(type==='baye')return sprite('baye'+(scare?1:0),12,19,R=>{const K='#1c1c22',KD='#0c0c10';R(1,0,10,4,K);R(1,3,10,1,'#4a4a52');R(3,4,6,5,'#3a2e2a');R(4,6,1,1,scare?'#e83020':'#e8d8a8');R(7,6,1,1,scare?'#e83020':'#e8d8a8');R(4,8,4,1,'#000');
    R(0,9,12,8,K);R(9,9,3,8,KD);R(2,11,8,1,'#8a7a40');R(2,17,3,2,KD);R(7,17,3,2,KD)});
  if(type==='lords')return apparitionSprite('qiye',scare);
  if(type==='zhizha')return sprite('zhizha'+(scare?1:0),10,20,R=>{const F='#f2ece0',RO=scare?'#3a7a5a':'#5a9a7a',RO2='#c85a7a';R(2,0,6,3,'#141214');R(4,0,2,1,'#2a2228');R(2,3,6,6,F);R(3,6,1,1,'#d84a4a');R(6,6,1,1,'#d84a4a');
    R(3,5,1,1,'#141214');R(6,5,1,1,'#141214');R(4,7,2,1,scare?'#000':'#b01818');if(scare){R(3,7,4,1,'#000')}R(1,9,8,9,RO);R(1,9,8,1,RO2);R(4,10,2,7,RO2);R(0,10,1,5,F);R(9,10,1,5,F);R(2,18,2,2,'#2a2a2a');R(6,18,2,2,'#2a2a2a')});
  if(type==='bamboo'||type==='wall'){if(type==='bamboo')return sprite('bambooP',16,26,R=>{R(2,0,2,26,'#4a5a2a');R(2,0,1,26,'#6a7a3a');[5,11,17,23].forEach(y=>R(1,y,4,1,'#2e3818'));R(4,1,9,2,'#4a5a2a');R(11,3,2,9,'#4a5a2a');R(10,12,4,8,'#cfc8b8');R(10,13,4,3,'#141214');R(11,20,1,5,'#cfc8b8');R(13,20,1,5,'#cfc8b8');R(6,2,3,1,'#5a7a30');R(8,0,3,1,'#5a7a30')});
    type='voice'}
  if(type==='voice')return sprite('voice',14,24,R=>{R(2,0,10,24,'#0a0a0e');R(4,3,6,8,'#d8d4cc');R(5,5,1,2,'#000');R(8,5,1,2,'#000');R(6,8,2,2,'#000');R(1,10,2,10,'#0a0a0e');R(11,10,2,10,'#0a0a0e')});
  // a mourner in hemp, hood pulled low
  const v=typeof scare==='number'?scare:0;if(v)scare=false;   // v: 1–3, mourners of different height and stoop
  return sprite('mourn'+(scare?1:0)+v,12,24,R=>{const W='#d8d2c0',WD='#a8a090',o=v===2?2:v===3?1:0,hn=v===1?1:0;R(3+hn,o,6,2,W);R(2+hn,2+o,8,6,W);R(1,8+o,10,14-o,W);R(8,8+o,3,14-o,WD);R(1,21,10,1,WD);R(4+hn,3+o,4,3,scare?'#d8d4cc':'#1a1816');if(!scare)R(5+hn,6+o,2,1,'#b8b0a2');
    if(scare){R(4,4,1,2,'#000');R(7,4,1,2,'#000');R(5,6,2,1,'#000')}R(3,22,2,2,'#2a2620');R(7,22,2,2,'#2a2620');R(5+hn,o,2,1,WD)});
}
// 棺材: dark red lacquer, a lip on the lid, a gold 壽 on the end
function coffinSprite(hz){return sprite('coffin'+(hz?1:0),hz?22:10,hz?10:20,R=>{if(hz){R(0,2,22,8,'#4a140e');R(0,1,22,2,'#6a1e14');R(0,9,22,1,'#2a0a06');R(1,3,3,5,'#3a0e0a');R(9,4,4,4,'#c99a3c');R(10,5,2,2,'#4a140e')}else{R(1,0,8,20,'#4a140e');R(0,1,10,2,'#6a1e14');R(3,8,4,4,'#c99a3c');R(4,9,2,2,'#4a140e');R(1,19,8,1,'#2a0a06')}})}
function drawApparition(A){
  if(A.type==='girl'){const k=Math.min(1,A.t/.4,(A.dur-A.t)/.4),fl=A.violated?0:k*(.85+Math.sin(G.t*23)*.1);if(fl<=0)return;const s=apparitionSprite('girl',false);blit(s,A.x,A.y+2,false,fl);return}
  if(A.type==='funeral'){const kinds=['lantern','m','suona','m','m','m','lantern'],hz=A.road.axis==='x';
    // each mourner a little apart from the next, out of step, some taller, some stooped
    const pos=i=>{const p=apPos(A,i),j=(hash(i,3,91)-.5)*7;return hz?{x:p.x+j,y:p.y}:{x:p.x,y:p.y+j}};
    for(let i=0;i<A.members;i++){const p=pos(i),bob=Math.round(Math.sin(G.t*(3.4+hash(i,1,92))+i*1.7));const s=apparitionSprite('mourn',1+Math.floor(hash(i,2,93)*3));shadow(p.x,p.y+1,5,.35);blit(s,p.x,p.y+2+bob,false,.92);
      if(kinds[i]==='lantern'){bx.fillStyle='#2b1f14';bx.fillRect(Math.round(p.x+5),Math.round(p.y-28+bob),1,8);bx.fillStyle='#eeeae0';bx.fillRect(Math.round(p.x+3),Math.round(p.y-22+bob),5,7);bx.fillStyle='#1a1816';bx.fillRect(Math.round(p.x+5),Math.round(p.y-20+bob),1,3)}
      if(kinds[i]==='suona'){bx.fillStyle='#c9993c';bx.fillRect(Math.round(p.x+2),Math.round(p.y-16),5,1);bx.fillRect(Math.round(p.x+6),Math.round(p.y-18),2,4)}}
    // the coffin rides on two poles across the shoulders of the middle four
    const a=pos(2),b=pos(5),mx=(a.x+b.x)/2+6,my=(a.y+b.y)/2,sh=-15+Math.round(Math.sin(G.t*3.4)),cf=coffinSprite(hz);
    bx.fillStyle='#2b1f14';if(hz){const x0=Math.round(Math.min(a.x,b.x)),w=Math.round(Math.abs(b.x-a.x))+12;bx.fillRect(x0,Math.round(my+sh-2),w,1);bx.fillRect(x0,Math.round(my+sh+1),w,1)}
    else{const y0=Math.round(Math.min(a.y,b.y)+sh-6),h=Math.round(Math.abs(b.y-a.y))+8;bx.fillRect(Math.round(mx-4),y0,1,h);bx.fillRect(Math.round(mx+4),y0,1,h)}
    bx.drawImage(cf,Math.round(mx-cf.width/2),Math.round(my+sh-cf.height+3));
    // joss paper drifting behind
    for(let i=0;i<6;i++){const p=apPos(A,A.members-1),k=(G.t*.5+i/6)%1;bx.fillStyle=`rgba(230,215,160,${.7*(1-k)})`;bx.fillRect(Math.round(p.x-A.dir*(k*40)*(hz?1:0)+(hash(i,1,5)-.5)*16),Math.round(p.y-A.dir*(k*40)*(hz?0:1)-10+Math.sin(k*6+i)*6),2,2)}
    return}
  if(A.type==='hongbao'){if(A.taken)return;const s=apparitionSprite('hongbao');shadow(A.x,A.y+1,4,.3);blit(s,A.x-4,A.y+2);if(Math.sin(G.t*3)>.6){bx.fillStyle='rgba(255,230,160,.8)';bx.fillRect(Math.round(A.x),Math.round(A.y-3),1,1)}return}
  if(A.type==='baby'){if(A.x<-900)return;const s=apparitionSprite('baby');blit(s,A.x-5,A.y+1,false,.55+Math.sin(G.t*2)*.1);for(let i=0;i<3;i++){const k=(G.t*.7+i/3)%1;bx.fillStyle=`rgba(210,210,200,${.25*(1-k)})`;bx.fillRect(Math.round(A.x+Math.sin(k*6+i)*5),Math.round(A.y-8-k*12),1,1)}return}
  if(A.type==='bamboo'){const ex=A.ux*A.half,ey=A.uy*A.half,sag=Math.max(0,1-(A.t>A.dur?(A.t-A.dur)*3:0));
    for(let i=0;i<=40;i++){const k=i/40,x=A.x-ex+2*ex*k,y=A.y-ey+2*ey*k-14-Math.sin(k*Math.PI)*-6*sag;bx.fillStyle=i%8===0?'#2e3818':'#4a5a2a';bx.fillRect(Math.round(x),Math.round(y),2,2);bx.fillStyle='#6a7a3a';bx.fillRect(Math.round(x),Math.round(y),1,1);if(i%5===0){bx.fillStyle='#3e5a22';bx.fillRect(Math.round(x+(hash(i,3,1)-.5)*6),Math.round(y+2+hash(i,4,1)*4),2,1)}}
    for(let i=0;i<=8;i++){const k=i/8;shadow(A.x-ex+2*ex*k,A.y-ey+2*ey*k+2,3,.25)}
    const P=G.player;if(P.lured===A.pseudo){bx.fillStyle='#6a5a3a';bx.fillRect(Math.round(A.pseudo.x),Math.round(A.pseudo.y-30),1,16)}return}
  if(A.type==='lords'){for(let i=0;i<2;i++){const p=apPos(A,i),bob=Math.round(Math.sin(G.t*3+i*2));const s=apparitionSprite(i?'baye':'qiye',false);shadow(p.x,p.y+1,5,.35);blit(s,p.x-s.width/2,p.y+2+bob,false,.95)}
    const h=apPos(A,0);bx.fillStyle='rgba(150,150,160,.8)';for(let i=0;i<6;i++){const k=i/6;bx.fillRect(Math.round(h.x+Math.cos(A.face+Math.PI)*k*14+Math.sin(G.t*5+i)*1),Math.round(h.y-10+k*8),1,1)}return}
  if(A.type==='wall'){const k=Math.min(1,A.t/1.2);for(let i=0;i<24;i++){const a=i/24*6.283+G.t*.15,r=A.r*(.96+Math.sin(G.t*2+i)*.04);bx.fillStyle=`rgba(190,195,200,${.07*k})`;bx.fillRect(Math.round(A.ox+Math.cos(a)*r)-3,Math.round(A.oy+Math.sin(a)*r*.75)-2,6,3)}return}
  if(A.type==='zhizha'){for(const d of A.dolls){if(d.burn>1.6)continue;const s=apparitionSprite('zhizha',!d.lit&&d.moving);shadow(d.x,d.y+1,4,.35);const flip=Math.cos(d.face)<0;
      if(d.burn>0){const k=Math.min(1,d.burn/1.6);blit(s,d.x-5,d.y+2,flip,1-k);for(let i=0;i<6;i++){bx.fillStyle=i%2?'#ff8a2a':'#ffd27a';bx.fillRect(Math.round(d.x-4+hash(i,5,2)*8),Math.round(d.y-4-hash(i,6,2)*16*(1-k)-Math.sin(G.t*12+i)*2),1,2)}continue}
      blit(s,d.x-5,d.y+2,flip,1)}return}
  if(A.type==='voice'){for(let i=0;i<4;i++){const k=(G.t*.6+i/4)%1;bx.fillStyle=`rgba(200,205,210,${.18*(1-k)})`;bx.fillRect(Math.round(A.x+Math.sin(k*5+i)*4),Math.round(A.y-16-k*12),2,2)}}
}
function drawFirePx(f){const k=Math.min(1,f.t/2);for(let i=0;i<9;i++){const ox=Math.round((hash(i,7,3)-.5)*f.r*1.3),oy=Math.round((hash(i,8,3)-.5)*f.r*.7),h=Math.round((4+hash(i,9,3)*8+Math.sin(G.t*14+i*2)*2)*k);
    bx.fillStyle='#c0391a';bx.fillRect(f.x+ox-1,f.y+oy-h,3,h);bx.fillStyle='#ff8a2a';bx.fillRect(f.x+ox,f.y+oy-h+1,1,h-1);bx.fillStyle='#ffd27a';bx.fillRect(f.x+ox,f.y+oy-2,1,2)}
  bx.fillStyle='rgba(30,20,10,.5)';pdisc(bx,f.x,f.y+2,Math.round(f.r*.7),Math.round(f.r*.3),'rgba(30,20,10,.45)');
  for(let i=0;i<4;i++){const kk=(G.t*.9+i/4)%1;bx.fillStyle=`rgba(255,180,90,${1-kk})`;bx.fillRect(Math.round(f.x+(hash(i,4,4)-.5)*12+Math.sin(kk*7)*3),Math.round(f.y-6-kk*22),1,1)}}
// the rule card that sits on screen while an apparition is present
function drawRuleScreen(){
  const A=G.apparition;
  if(A&&!G.menuMode&&!G.over){const d=APPARITIONS[A.type];let txt=d.rule,sub='';
    if(A.type==='girl')sub=A.violated?'':`${Math.max(0,Math.ceil(A.dur-A.t))}`;
    if(A.type==='voice')sub=A.violated?'':`${Math.max(0,Math.ceil(A.dur-A.t))}`;
    if(A.type==='funeral')sub=A.violated?'':A.look>0?'別看！':'';
    if(A.type==='bamboo'||A.type==='baby'||A.type==='zhizha'||A.type==='hongbao')sub=A.violated?'':`${Math.max(0,Math.ceil((A.dur||0)-A.t))}`;
    if(A.type==='wall')sub=A.violated?'':A.still>0?`靜 ${Math.min(4,A.still).toFixed(0)}／4`:'';
    if(A.type==='lords')sub='';
    ctx.save();ctx.font=`bold 20px ${FONT_D}`;const sw=sub?ctx.measureText(sub).width+14:0;ctx.font=`15px ${FONT_D}`;const w=Math.min(SW-32,ctx.measureText(txt).width+60+sw),h=40,x=(SW-w)/2,y=SW<600?150:58;
    ctx.fillStyle='rgba(231,217,177,.97)';ctx.fillRect(x,y,w,h);ctx.fillStyle=PAL.cin;ctx.fillRect(x+8,y+7,26,26);ctx.fillStyle='#f3e6c3';ctx.font=`bold 16px ${FONT_D}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('規',x+21,y+21);
    ctx.fillStyle='#2b1f14';ctx.font=`15px ${FONT_D}`;ctx.textAlign='left';ctx.fillText(txt,x+44,y+21,w-56-sw);if(sub){ctx.fillStyle=PAL.cin;ctx.font=`bold 20px ${FONT_D}`;ctx.textAlign='right';ctx.fillText(sub,x+w-12,y+21)}
    if(A.type==='funeral'&&A.look>0){ctx.fillStyle=PAL.cin;ctx.fillRect(x,y+h-3,w*Math.min(1,A.look/1.1),3)}ctx.restore()}
  // a broken rule: the apparition's face lunges at you, shorter than a capture, then the game goes on in the dark
  const F=G.flash;if(F&&F.at<.9){if(!F.o)F.o=lungeOrigin(F.type);const age=LUNGE_FREEZE!=null?LUNGE_FREEZE:F.at;if(CLOSEUP)drawLunge(F.type,age,F.o,true);else drawRedFade(age,true)}
}
