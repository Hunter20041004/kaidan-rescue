/* =====================================================================
   Apparition visuals: 紅衣小女孩, 夜半送葬, 叫名字, plus the rule banner
   and the brief flash when a rule is broken. Logic lives in game.js.
   ===================================================================== */
function apparitionSprite(type,scare){
  if(type==='girl')return sprite('girl'+(scare?1:0),10,17,R=>{const RD='#b0171f',RDD='#7a0d12',H='#0e0b10',SK='#e8d8c8';
    R(1,0,8,7,H);R(0,3,1,4,H);R(9,3,1,4,H);R(2,3,6,4,SK);R(2,3,6,2,H);
    if(scare){R(2,4,2,1,'#000');R(6,4,2,1,'#000');R(3,6,4,1,'#6a0a0a');R(2,3,1,1,H)}
    R(2,7,6,1,SK);R(1,8,8,3,RD);R(0,11,10,4,RD);R(7,8,2,7,RDD);R(0,14,10,1,RDD);R(0,8,1,3,SK);R(9,8,1,3,SK);R(3,15,1,1,SK);R(6,15,1,1,SK);R(2,16,2,1,'#151418');R(6,16,2,1,'#151418')});
  if(type==='voice')return sprite('voice',14,24,R=>{R(2,0,10,24,'#0a0a0e');R(4,3,6,8,'#d8d4cc');R(5,5,1,2,'#000');R(8,5,1,2,'#000');R(6,8,2,2,'#000');R(1,10,2,10,'#0a0a0e');R(11,10,2,10,'#0a0a0e')});
  // a mourner in hemp, hood pulled low
  return sprite('mourn'+(scare?1:0),12,22,R=>{const W='#d8d2c0',WD='#a8a090';R(3,0,6,2,W);R(2,2,8,6,W);R(1,8,10,12,W);R(8,8,3,12,WD);R(1,19,10,1,WD);R(4,3,4,4,scare?'#d8d4cc':'#1a1816');
    if(scare){R(4,4,1,2,'#000');R(7,4,1,2,'#000');R(5,6,2,1,'#000')}R(3,20,2,2,'#2a2620');R(7,20,2,2,'#2a2620');R(5,0,2,1,WD)});
}
function drawApparition(A){
  if(A.type==='girl'){const k=Math.min(1,A.t/.4,(A.dur-A.t)/.4),fl=A.violated?0:k*(.85+Math.sin(G.t*23)*.1);if(fl<=0)return;const s=apparitionSprite('girl',false);blit(s,A.x,A.y+2,false,fl);return}
  if(A.type==='funeral'){const kinds=['lantern','m','suona','m','m','m','lantern'];
    for(let i=0;i<A.members;i++){const p=apPos(A,i),bob=Math.round(Math.sin(G.t*4+i))*1;const s=apparitionSprite('mourn',false);shadow(p.x,p.y+1,5,.35);blit(s,p.x,p.y+2+bob,false,.92);
      if(kinds[i]==='lantern'){bx.fillStyle='#2b1f14';bx.fillRect(Math.round(p.x+5),Math.round(p.y-26+bob),1,8);bx.fillStyle='#eeeae0';bx.fillRect(Math.round(p.x+3),Math.round(p.y-20+bob),5,7);bx.fillStyle='#1a1816';bx.fillRect(Math.round(p.x+5),Math.round(p.y-18+bob),1,3)}
      if(kinds[i]==='suona'){bx.fillStyle='#c9993c';bx.fillRect(Math.round(p.x+2),Math.round(p.y-14),5,1);bx.fillRect(Math.round(p.x+6),Math.round(p.y-16),2,4)}}
    const a=apPos(A,3),b=apPos(A,5);const x0=Math.min(a.x,b.x)-6,x1=Math.max(a.x,b.x)+6,y0=Math.min(a.y,b.y)-6,y1=Math.max(a.y,b.y)+6;const hz=A.road.axis==='x';
    bx.fillStyle='#4a140e';if(hz){bx.fillRect(Math.round(x0),Math.round(a.y-30),Math.round(x1-x0),9);bx.fillStyle='#6a1e14';bx.fillRect(Math.round(x0),Math.round(a.y-30),Math.round(x1-x0),2);bx.fillStyle='#c99a3c';bx.fillRect(Math.round((x0+x1)/2-2),Math.round(a.y-27),4,3)}
    else{bx.fillRect(Math.round(a.x-6),Math.round(y0-26),12,Math.round(y1-y0));bx.fillStyle='#6a1e14';bx.fillRect(Math.round(a.x-6),Math.round(y0-26),12,2);bx.fillStyle='#c99a3c';bx.fillRect(Math.round(a.x-2),Math.round((y0+y1)/2-28),4,3)}
    // joss paper drifting behind
    for(let i=0;i<6;i++){const p=apPos(A,A.members-1),k=(G.t*.5+i/6)%1;bx.fillStyle=`rgba(230,215,160,${.7*(1-k)})`;bx.fillRect(Math.round(p.x-A.dir*(k*40)*(hz?1:0)+(hash(i,1,5)-.5)*16),Math.round(p.y-A.dir*(k*40)*(hz?0:1)-10+Math.sin(k*6+i)*6),2,2)}
    return}
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
    ctx.save();ctx.font=`bold 20px ${FONT_D}`;const sw=sub?ctx.measureText(sub).width+14:0;ctx.font=`15px ${FONT_D}`;const w=Math.min(SW-32,ctx.measureText(txt).width+60+sw),h=40,x=(SW-w)/2,y=SW<600?150:58;
    ctx.fillStyle='rgba(231,217,177,.97)';ctx.fillRect(x,y,w,h);ctx.fillStyle=PAL.cin;ctx.fillRect(x+8,y+7,26,26);ctx.fillStyle='#f3e6c3';ctx.font=`bold 16px ${FONT_D}`;ctx.textAlign='center';ctx.textBaseline='middle';ctx.fillText('規',x+21,y+21);
    ctx.fillStyle='#2b1f14';ctx.font=`15px ${FONT_D}`;ctx.textAlign='left';ctx.fillText(txt,x+44,y+21,w-56-sw);if(sub){ctx.fillStyle=PAL.cin;ctx.font=`bold 20px ${FONT_D}`;ctx.textAlign='right';ctx.fillText(sub,x+w-12,y+21)}
    if(A.type==='funeral'&&A.look>0){ctx.fillStyle=PAL.cin;ctx.fillRect(x,y+h-3,w*Math.min(1,A.look/1.1),3)}ctx.restore()}
  // a broken rule: the apparition's face lunges at you, shorter than a capture, then the game goes on in the dark
  const F=G.flash;if(F&&F.at<.9){if(!F.o)F.o=lungeOrigin(F.type);const age=LUNGE_FREEZE!=null?LUNGE_FREEZE:F.at;if(CLOSEUP)drawLunge(F.type,age,F.o,true);else drawRedFade(age,true)}
}
