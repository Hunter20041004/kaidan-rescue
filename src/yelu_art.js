/* ===================================================================== 夜路 (W3) — pictures, sounds and the HUD.
   Interface (see scratchpad spec §9.3). ===================================================================== */
/* YL_ART / YL_SND / YL_UI — 畫面、聲音、介面（W3）。只讀 ctx 和 inst，不改遊戲狀態
 YL_ART.fixture(f,ctx)       用 bx 在世界座標畫一個固定細節（第 3.2 節，依 kind 和 variant）
 YL_ART.anom(inst,ctx)       畫不對勁：girl 用 apparitionSprite('girl')；lords 用 qiye/baye，依 inst.data.members；
                             lamp 的人形影子；call 背後的淡霧（可選）
 YL_ART.po(p)                畫魄 {x,y}
 YL_ART.light(c,ctx)         光層（destination-out，用 render.js 的 glow）：油燈 r2、蠟燭 r2.5、亮著的路燈 r2、
                             點亮的燈籠、靈堂白燭與銀紙桶
 YL_ART.over(bx,ctx)         先畫自發光（lighter）：燈籠、油燈火焰、y_lamp 的光；再畫背後全黑（第 3.3 節）
 YL_ART.FACE                 {y_girl:'girl',y_call:'voice',y_ghostwed:'bride',y_tail:'tiger'}（都是 CPAINT 現成的臉）
 YL_SND.at(kind,x,y,{behind})   方位音：玩家南方的聲音加 900 Hz 低通、音量 ×0.7；左右依 dx
 YL_SND.hush(sec)            SND.out.gain 在 20 ms 內降到 ≤0.001，sec 秒後 50 ms 內恢復，同時設 G.silence
 YL_SND.qing() muyu() pa() dong() paper() chain() gong() lingpai() radio() stepBehind() crack() stepEar() breath()
 YL_UI.hud({night,cal,beads,hint,streak,need,near})   #ylhud：左上小月曆（宜/忌各一行）、佛珠 3 顆、香 need 根（streak 根點著）、第一趟的提示；
                             手機：near 時「互動」鍵發亮，hint 'nianfo' 時「念佛」鍵閃
 YL_UI.cal(show,cal)         #ylcal：月曆整頁放大
 YL_UI.slip(zh,tw,ms,onDone) #ylslip：阿嬤的話紙條
 YL_UI.card(kind,data,onGo)  #ylcard：'night'|'dawn'|'wait'|'end'；onGo.ready() 回 false 時不收點擊（W1 的 0.6 秒防誤觸）
                             高度 ≤500px（手機橫向）時夜卡、結束卡排成兩欄，按鈕留在畫面內
 CSS 用 yelu_art.js 在執行期插入一個 <style>，不改 head.html
*/
/* W3 補充說明（給 W1、W2）
 座標：f.x、f.y、inst.x、inst.y、members[i].x/y、魄 p.x/p.y 都是「格」，可以有小數；世界像素 = 格 × TS。f.x,f.y 是物件中心腳下那一點。
       door4、lintel 貼在牆面：f.x 是門的中心（x 6–7 兩格的門是 7.0），畫在 f.y 所在那一格的南牆面上，排序要用 f.sy（排在牆後面）。
       pole 的腳在 (floor(f.y)+1)*TS-3，橫擔在腳上方 45 px（和村子的電線桿一樣）。ditch 用 y0..y1（格）整段畫，每 3 格一塊水溝蓋。
       tent 的 f.x,f.y 是棚子地面中心（10.5, 5.5）。shrine 也畫廟後那棵掛紅布條的小榕樹（13,62）。
 YL_ART.sortY(f)、reach(f)、ents(ents,inView,ctx,po)、wires(fix)：可選的輔助函式（排序 y、inView 邊界、整批推進 ents、電線）。
 YL_ART.anom：inst.state 為 'active' 才出現；pending 時用 W2 的 inst.data.alpha 淡入；verdict 'pass' 淡出 0.5 秒，'fail' 立刻消失
       （七爺八爺 fail 時留著）；inst.data.fade（0–1）可直接指定。y_lamp 只在 lamp 細節是 'lit' 時才有影子，y_call、y_steps 沒有畫面。
 失敗演出時（ctx.trip.fail.id）：y_jisi 油燈熄（拜錯時，你手上的香被路邊黑暗裡伸出的手接走）、y_turned 只有油燈熄、香爐冷
       （神像不轉、不做成怪）、y_mirror 鏡面裂開、y_lamp 影子消失。mirror 'extra'＝鏡子裡你背後多一個人（臉在暗處微微發白）。
       靈堂香爐的香＝YL_RUN.S.streak（上香那 1.2 秒多一根），失敗熄掉的 S.cold 根畫成冷的短香頭。
 y_ghostwed 答對後依 data.endT，兩盞燈籠間隔 0.4 秒先後熄掉。trip.bowAt（或 ctx.did==='BOW'）時油燈亮一下。
 ctx.act：BOW 時手上一支點著的香，NIANFO 時合掌（畫在 over 裡、背後全黑之前）。
 YL_SND 另有 call()（「少年仔——」）puff()（油燈噗）ash()（香灰沙沙）creak()（神像轉身）approach()（腳步踩到耳邊）；
       at(kind,x,y,o) 的 kind 可以是以上任一個名字，或 SND 現成的 cue（girl、voice…）、'step'。回傳是否真的出聲。
 YL_UI.hud 的 hint：'first'（電腦版顯示按鍵提示，手機寫「左半邊拖曳走路」）、'nianfo'（佛珠與念佛閃一下）、null；也收字串或 [[鍵,說明],…]。
       小月曆可點（點擊由 W1 處理；按下不搶焦點，所以之後的空白鍵、Enter 不會再按到它）。
 YL_UI.card('night',{n,name?,cal,zh?,tw?})（zh/tw 沒給就用第 4.2 節的句子）、('dawn',{text?})、('end',{text?,nights:[{n,trips,fails,secs}],secs?})。
 YL_UI.card／slip 只負責顯示；計時與關閉由 W1 負責。data.ms 有給、或 YL_UI.selfTime=true 時才自己計時。end 卡的按鈕呼叫 onGo('again'|'title')。
 YL_UI.slip()、YL_UI.card()、YL_UI.cal(false) 不帶內容就是關掉（不呼叫 onDone/onGo）。YL_UI.go(v) -> bool：等同點一下開著的卡片或紙條。
*/
const YL_ART=(()=>{
  const W=v=>v*TS,rnd=Math.round,FIXES=()=>(typeof YL!=='undefined'&&YL.FIX)||[],trip=C=>(C&&C.trip)||(typeof YL!=='undefined'&&YL.trip)||null;
  const failId=C=>{const T=trip(C);return T&&T.phase==='fail'&&T.fail?T.fail.id:null};
  const flick=(t,s)=>.86+Math.sin(t*13+s)*.07+Math.sin(t*7.3+s*1.7)*.06;
  const put=(spr,X,Y,a)=>blit(spr,X,Y+1,false,a);   // sprites carry a one-pixel outline margin; this puts their feet on the ground point
  const mem=new WeakMap(),bow={t:-9};
  // fades are kept here, keyed by the instance, so drawing never writes to game state
  // while pending, W2's data.alpha is the fade-in (it stays 0 through the hush); our own clock only runs the fade-out after the verdict
  function fade(inst,target,inT,outT){const d=inst.data||{};if(typeof d.fade==='number')return d.fade;let m=mem.get(inst);if(!m){m={a:0,t:G.t};mem.set(inst,m)}
    const dt=clamp(G.t-m.t,0,.1);m.t=G.t;if(inst.verdict==='pending'&&(typeof d.alpha==='number'||d.at!=null)){m.a=Math.min(target,typeof d.alpha==='number'?d.alpha:0);return m.a}
    m.a=target>m.a?Math.min(target,m.a+dt/inT):Math.max(target,m.a-dt/outT);return m.a}

  /* ---------------- sprites (cached; keys are finite so SPR stops growing) ---------------- */
  const SP={
    box:()=>sprite('ylbox',16,12,R=>{R(0,4,16,8,'#9a7a4c');R(0,4,16,1,'#b8955e');R(13,4,3,8,'#7a5e38');R(0,11,16,1,'#5e4628');   // a carton of 農會 calendars on the tailgate
      R(1,0,5,5,'#efeae0');R(1,0,5,1,'#c8241c');R(2,2,3,1,'#c8241c');R(6,1,5,4,'#e4dfd2');R(6,1,5,1,'#c8241c');R(11,0,2,5,'#efeae0');R(11,0,2,1,'#b5341d');
      R(2,6,4,4,'#2f5a4c');R(3,7,2,1,'#e8e4d8');R(3,8,1,1,'#e8e4d8');R(7,7,5,1,'#4a3a26');R(7,9,4,1,'#4a3a26')}),
    sign:()=>sprite('ylsign',40,34,R=>{R(18,15,2,19,'#8a8a86');R(18,15,1,19,'#b0afa8');R(17,32,4,2,'#4a4844');R(0,0,40,16,'#e8ecee');R(1,1,38,14,'#1f4f8f');R(1,1,38,1,'#2f63a8');R(1,14,38,1,'#173c6e')},true,
      c=>{const t=pxText('山腳村',12,'#f2f4f4'),g=c.getContext('2d');g.drawImage(t,Math.round((c.width-t.width)/2)+1,2);outline(c)}),
    ditch:L=>sprite('ylditch'+L,8,L*TS,R=>{const H=L*TS;R(0,0,1,H,'#5e5b52');R(7,0,1,H,'#38352e');R(1,0,6,H,'#0d1315');for(let y=2;y<H;y+=7)R(2+(y%3),y,2,1,'#1f2c30');   // a concrete drain, black water
      for(let y=TS;y<H;y+=3*TS){R(0,y-5,8,11,'#6c695f');R(0,y-5,8,1,'#8a877c');for(let i=y-3;i<y+5;i+=2)R(1,i,6,1,'#1a1c1c');R(0,y+5,8,1,'#3e3c36')}},true),
    lamp:v=>sprite('yllamp'+v,20,50,R=>{const x=14,L=v==='lit';R(x,4,3,46,'#77746c');R(x,4,1,46,'#9a978e');R(x+2,4,1,46,'#55534d');R(x-3,6,9,2,'#4a4844');R(x-3,5,1,1,'#d8d4c8');R(x+5,5,1,1,'#d8d4c8');
      for(let y=14;y<44;y+=5)R(y%10?x-1:x+3,y,1,1,'#2e2c2a');R(5,10,x-5,1,'#4a4844');R(4,11,1,1,'#4a4844');   // a 水泥電線桿 with the arm reaching out over the road
      R(0,12,8,2,'#24242a');R(0,14,3,1,'#24242a');R(1,14,6,1,L?'#fff1c4':'#4e4b44');R(0,15,3,1,L?'#ffe6a0':'#45433d');   // the shade hangs askew, lower on the road side
      R(x-1,46,5,4,'#5a5852')}),
    shrine:v=>sprite('ylshrine'+v,30,38,R=>{const RD='#9b2a1c',RDD='#741e14',TL='#b04a2a',TLD='#8a3420',SK='#d8b08a',WH='#eeeae0',RB='#c9993c',RBD='#a87a2a';
      R(0,30,30,8,'#5e5a52');R(0,30,30,1,'#7e7a70');R(0,37,30,1,'#3e3a34');for(let x=3;x<30;x+=7)R(x,31,1,6,'#4e4a44');R(9,34,12,4,'#6e6a62');R(9,34,12,1,'#8e8a80');   // granite plinth and step
      R(3,15,24,15,RD);R(3,15,1,15,'#b8402a');R(23,15,4,15,RDD);R(9,17,12,13,'#140a08');R(10,16,10,1,'#140a08');R(9,26,12,4,'#3a1a10');R(9,26,12,1,'#5a2a18');   // red walls, the dark niche, the altar shelf
      R(5,17,2,11,'#d8341e');R(23,17,2,11,'#b8241a');for(let y=19;y<27;y+=3){R(5,y,1,1,'#e8c060');R(24,y,1,1,'#d8a84a')}R(11,15,8,2,'#14181e');R(13,15,1,1,'#c99a3c');R(16,15,1,1,'#c99a3c');   // 春聯 and a 福德 plaque
      if(v==='turned'){R(11,21,9,6,RB);R(11,21,1,6,'#d8ac4c');R(19,21,1,6,RBD);R(13,22,5,5,'#a8281a');R(14,23,3,3,'#c83a24');R(15,22,1,5,'#e0b048');R(13,20,5,1,'#cfcac0');   // 土地公 with his back to the road: broad yellow shoulders, the red panel down his back
        R(13,16,5,5,'#e6e2d8');R(17,17,1,4,'#bcb8ae');R(14,16,3,1,'#ffffff');R(14,14,3,2,WH);R(15,14,1,1,'#ffffff');R(10,17,1,6,'#7a5a34');R(9,16,3,2,'#c99a3c')}   // the back of his white head and bun; the staff now on the other side
      else{R(12,22,7,5,RB);R(12,22,1,5,'#d8ac4c');R(18,22,1,5,RBD);R(13,17,5,5,SK);R(17,18,1,4,'#b8875f');R(13,16,5,1,WH);R(14,14,3,2,WH);
        R(13,18,2,1,WH);R(16,18,2,1,WH);R(13,19,1,1,'#2a1a10');R(16,19,1,1,'#2a1a10');R(14,21,3,1,'#a87050');R(13,21,5,3,WH);R(14,24,3,2,'#e0dcd2');R(15,26,1,1,'#d8d4ca')}   // white brows, a long white beard
      if(v!=='turned'){R(20,18,1,9,'#7a5a34');R(19,17,3,2,'#c99a3c')}   // his staff
      R(10,23,2,3,'#6a5a3a');R(10,23,2,1,'#a89a70');R(10,26,2,1,'#8a6420');   // a little oil lamp in the niche
      R(11,28,8,3,'#8a6420');R(11,28,8,1,'#c99a3c');R(11,31,1,1,'#5a4010');R(18,31,1,1,'#5a4010');R(12,26,1,2,'#7a2a16');R(14,25,1,3,'#7a2a16');R(16,26,1,2,'#7a2a16');R(12,26,1,1,'#8a8478');R(14,25,1,1,'#8a8478');R(16,26,1,1,'#8a8478');   // 香爐, three burnt-out stubs
      R(0,10,30,5,TL);for(let x=1;x<30;x+=3)R(x,11,1,3,TLD);R(0,14,30,1,'#5a1a10');R(0,10,30,1,'#c86040');   // tiled eaves
      R(3,7,24,3,'#8a2a1a');R(3,7,24,1,'#a83a24');R(0,5,3,2,TL);R(27,5,3,2,TL);R(0,3,2,2,TL);R(28,3,2,2,TL);R(0,2,1,1,'#5a1a10');R(29,2,1,1,'#5a1a10');   // 燕尾 ridge sweeping up at both ends
      R(13,3,4,4,'#c99a3c');R(14,2,2,1,'#e8c060');R(14,1,2,1,'#c8302a');R(7,8,3,1,'#3a8a7a');R(20,8,3,1,'#3a8a7a')}),
    banyan:()=>{let c=SPR.get('ylbanyan');if(c)return c;const t=treeSprite(5);c=mk(t.width,t.height);const g=c.getContext('2d');g.drawImage(t,0,0);   // a 榕樹 with aerial roots and a red cloth round the trunk
      const R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)};for(const x of[12,16,27,31,35])R(x,24+(x%3),1,6+(x%4)*2,'#2a2016');
      R(19,35,7,3,'#b8241c');R(19,35,7,1,'#d8463a');R(24,38,2,6,'#a01e16');R(26,38,1,4,'#c8302a');SPR.set('ylbanyan',c);return c},
    door:v=>sprite('yldoor'+v,60,50,R=>{R(6,0,48,28,'#8d8a83');R(6,0,48,1,'#a8a59c');R(9,3,42,25,'#2a1a10');   // the 正廳 door: stone frame, two plank leaves, 春聯 on the jambs
      for(const x0 of[10,31]){R(x0,4,19,24,'#5a3a22');R(x0,4,19,1,'#6e4a2c');for(let x=x0+4;x<x0+19;x+=4)R(x,5,1,23,'#4a2e1a')}R(29,4,2,24,'#2a180c');R(26,15,2,2,'#c99a3c');R(32,15,2,2,'#c99a3c');
      R(6,3,3,22,'#b8241c');R(51,3,3,22,'#a81e16');for(let y=5;y<24;y+=3){R(7,y,1,1,'#e0b84a');R(52,y,1,1,'#d0a840')}
      R(8,26,44,2,'#6a665e');R(8,26,44,1,'#8e8a80');R(10,28,40,3,'#57534c');R(10,28,40,1,'#76736a');
      if(v==='wedding'){for(const cx of[19,40]){for(let d=0;d<5;d++){R(cx-d,8+d,d*2+1,1,'#c8201a');R(cx-d,16-d,d*2+1,1,'#c8201a')}R(cx-4,12,9,1,'#c8201a');   // red 囍 diamonds on both leaves
          R(cx-3,10,2,1,'#f0c850');R(cx+2,10,2,1,'#f0c850');R(cx-3,12,2,1,'#f0c850');R(cx+2,12,2,1,'#f0c850');R(cx-3,14,7,1,'#f0c850');R(cx-2,11,1,1,'#f0c850');R(cx+3,11,1,1,'#f0c850');R(cx-2,13,1,3,'#f0c850');R(cx+2,13,1,3,'#f0c850');R(cx,9,1,6,'#f0c850')}
        for(let i=0;i<46;i++){const x=4+Math.floor(hash(i,1,301)*52),y=30+Math.floor(hash(i,2,301)*19);R(x,y,hash(i,3,301)<.3?2:1,1,hash(i,4,301)<.5?'#b8241c':'#e03a22')}   // 鞭炮屑 on the yard
        R(44,40,6,1,'#8a2a1c');R(45,41,5,1,'#5a1a10');R(49,39,1,1,'#3a2a1a')}},true),
    lantern:on=>on?lanternSprite():sprite('yllant0',7,10,R=>{R(2,0,3,1,'#2b1f14');R(1,1,5,7,'#6a1e14');R(0,2,7,5,'#6a1e14');R(3,2,1,5,'#4a1610');R(1,8,5,1,'#2b1f14');R(3,9,1,1,'#7a6430')}),
    lintel:()=>sprite('yllintel',6,4,R=>{R(0,0,6,4,'#c8241c');R(0,0,6,1,'#e04030');R(5,1,1,3,'#8a1a12')},true),
    ama:(v,fan,curl)=>sprite('ylama'+v+fan+curl,22,26,R=>{const H='#b7b2a8',HL='#d8d4cc',SK='#d8ae86',SKD='#a97d58',SH='#6f86a6',SHD='#556a88',SHL='#8aa0bc',PA='#2e2e36',RC='#b8241c',RCD='#8a1a12';
      R(3,6,10,7,RC);R(3,6,10,1,'#d8463a');R(2,15,12,2,'#c82a22');R(2,15,12,1,'#e8564a');R(2,17,12,1,RCD);R(2,18,1,6,RCD);R(13,18,1,6,'#7a160e');R(4,18,1,5,'#9a1e16');R(11,18,1,5,'#9a1e16');   // her red plastic chair
      if(v==='tail'){const st=(x,y,i)=>R(x,y,1,1,i%3===1?'#1a120a':'#d7832e'),p=curl?[[12,21],[13,22],[14,22],[15,22],[16,22],[17,21],[18,20],[18,19],[17,18],[16,18],[16,19]]:[[12,21],[13,22],[14,22],[15,22],[16,22],[17,22],[18,22],[19,21],[20,20],[20,19],[19,18]];
        p.forEach(([x,y],i)=>{st(x,y,i);st(x,y+1,i+1);if(i<6)st(x,y-1,i+2)})}   // 虎姑婆's tail, striped orange and black, curling out from under the chair
      R(5,2,6,6,H);R(6,3,3,1,HL);R(6,0,4,2,H);R(7,0,2,1,HL);R(6,4,4,4,SK);R(9,5,1,3,SKD);R(6,5,1,1,'#2a1a10');R(8,5,1,1,'#2a1a10');R(6,7,1,1,SKD);R(7,7,2,1,'#8a5a40');   // grey bun, a lined face
      R(4,8,8,7,SH);R(4,9,1,5,SHL);R(11,9,1,6,SHD);R(8,8,1,1,'#3a4a66');R(9,9,1,1,'#3a4a66');R(10,10,1,1,'#3a4a66');R(9,10,1,1,'#e8e0d0');R(5,11,1,1,'#b8c8da');R(7,13,1,1,'#b8c8da');R(10,12,1,1,'#b8c8da');   // 大襟衫 buttoned at the side, a small print
      R(3,10,1,4,SH);R(4,14,2,1,SK);R(4,15,8,2,PA);R(5,17,2,5,PA);R(9,17,2,5,'#26262e');R(4,22,3,1,'#3a5a8a');R(9,22,3,1,'#3a5a8a');
      const fy=fan?4:0;R(12,9+fy,1,3,SH);R(12,12+fy,1,1,SK);R(13,4+fy,1,6,'#8a6a3a');R(13,0+fy,4,5,'#c8b070');R(12,1+fy,1,3,'#c8b070');R(17,1+fy,1,3,'#b09858');R(14,1+fy,1,3,'#a89050');R(16,1+fy,1,3,'#a89050')}),   // 蒲扇
    mailbox:()=>sprite('ylmail',10,26,R=>{R(0,4,6,22,'#7a3d2c');for(let y=6;y<26;y+=3)R(0,y,6,1,'#5e2a1e');R(0,4,1,22,'#8a4a36');R(0,2,7,3,'#9a948a');R(0,2,7,1,'#b8b2a6');   // a brick gate post with its 信箱
      R(3,8,7,6,'#2f6a4a');R(3,8,7,1,'#4a8a64');R(9,9,1,5,'#1f4a34');R(4,10,4,1,'#0c1a12');R(5,12,3,1,'#cfe0d0');R(3,14,7,1,'#1a3a28')}),
    candle:()=>sprite('ylcandle',7,11,R=>{R(0,7,7,2,'#6a4a2c');R(0,7,7,1,'#8a6a3c');R(0,9,1,2,'#4a3220');R(6,9,1,2,'#4a3220');   // a candle in a drinking glass on a little stool
      R(1,1,5,6,'#5e7c84');R(1,1,5,1,'#b8d0d4');R(1,2,1,4,'#9ab8c0');R(2,3,3,4,'#eeeae0');R(3,2,1,1,'#2a2420')}),
    mirror:v=>sprite('ylmirror'+v,20,46,R=>{R(8,17,3,29,'#8a8a86');R(8,17,1,29,'#aaa9a2');for(let y=20;y<44;y+=6)R(8,y,3,2,'#c8a030');R(7,44,5,2,'#4a4844');R(8,15,3,3,'#4a4844');   // 轉角凸面鏡 on its pole, a big one at the bend
      for(let dy=-9;dy<=9;dy++){const w=rnd(8.5*Math.sqrt(1-dy*dy/81));R(9-w,9+dy,w*2+1,1,'#e0702a')}R(3,1,4,2,'#f09048');
      for(let dy=-7;dy<=7;dy++){const w=rnd(6.6*Math.sqrt(1-dy*dy/49));R(9-w,9+dy,w*2+1,1,dy<0?'#1c262c':dy<3?'#5a5446':'#7a705a')}R(5,4,2,1,'#8a9aa6');R(5,5,1,1,'#6a7a86');R(3,9,13,1,'#2e3a34')},false),   // dark bamboo above, the road your torch lights below
    tent:()=>{let c=SPR.get('yltent');if(c)return c;c=mk(220,220);const g=c.getContext('2d'),R=(x,y,w,h,col)=>{g.fillStyle=col;g.fillRect(x,y,w,h)},BL='#2c58a0',WT='#d4d8dc';
      for(let x=6;x<214;x+=8){R(x,24,4,58,BL);R(x+4,24,4,58,WT)}R(6,22,208,3,'#1e3e78');R(6,76,208,6,'rgba(0,0,0,.35)');for(let x=6;x<214;x+=8){R(x,0,4,22,'#24488a');R(x+4,0,4,22,'#aab0b8')}R(6,20,208,2,'#1a305e');   // blue-and-white 帆布: the roof's far slope and the back wall
      R(6,24,2,60,'#9a9c9a');R(212,24,2,60,'#9a9c9a');
      R(66,96,88,6,'#e6e2d6');R(66,96,88,1,'#f4f2ec');R(66,102,88,16,'#d8d4c8');for(let x=70;x<154;x+=8)R(x,102,1,16,'#c2beb2');R(66,118,88,2,'rgba(0,0,0,.4)');   // 香案 in white cloth
      R(104,103,12,3,'#141414');R(102,104,3,3,'#141414');R(115,104,3,3,'#141414');R(108,106,4,4,'#141414');R(106,110,2,6,'#141414');R(112,110,2,6,'#141414');R(109,107,2,1,'#3a3a3a');   // a black silk rosette on the drape
      R(100,66,20,24,'#141414');R(102,68,16,20,'#8a8a86');R(105,70,10,5,'#2a2a2a');R(105,74,10,8,'#c4c4c0');R(105,74,1,8,'#a4a4a0');R(107,77,2,1,'#3a3a3a');R(111,77,2,1,'#3a3a3a');R(108,80,4,1,'#8a8a86');R(103,82,14,6,'#4a4a4a');R(108,82,4,3,'#e8e8e4');   // 遺照, black and white
      R(105,62,10,5,'#0c0c0c');R(108,63,4,3,'#2a2a2a');R(100,66,3,6,'#0c0c0c');R(117,66,3,6,'#0c0c0c');R(108,88,4,8,'#3a3a3a');   // the black rosette
      for(const[cx,cy]of[[90,82],[86,88],[94,88],[130,82],[126,88],[134,88]]){R(cx-2,cy-2,5,5,'#e8e6dc');R(cx-1,cy-1,3,3,'#f4f2ea');R(cx,cy,1,1,'#d8c860')}R(89,90,1,6,'#3a5a2a');R(131,90,1,6,'#3a5a2a');   // white chrysanthemums
      for(const x of[76,140]){R(x-2,92,6,4,'#8a6420');R(x-1,90,4,2,'#c99a3c');R(x,78,2,12,'#eeeae0');R(x,78,1,12,'#ffffff');R(x,77,2,1,'#2a2420')}   // a pair of white candles
      R(104,90,12,6,'#8a6420');R(104,90,12,1,'#c99a3c');   // 香爐: its sticks are drawn per trip walked (DRAW.tent)
      R(54,130,18,3,'rgba(0,0,0,.4)');R(56,118,14,13,'#6a6e70');R(56,118,1,13,'#8a8e90');R(68,118,2,13,'#4e5254');R(55,116,16,3,'#9a9ea0');R(57,117,12,1,'#1a1010');for(const[x,y]of[[59,123],[63,126],[66,122]])R(x,y,1,1,'#2a2a2a');   // 銀紙桶
      R(58,114,3,3,'#c8ccd0');R(64,113,3,4,'#b8bcc0');R(62,115,2,2,'#d8dcdf');
      R(148,128,30,9,'#8a7a4a');for(let x=150;x<178;x+=3)R(x,129,1,7,'#6e6038');R(148,128,30,1,'#a8986a');   // straw mat
      for(const[x,y,k]of[[166,124,0],[171,126,1],[168,128,0],[174,123,1],[163,128,1]]){const C=k?'#c8ccd0':'#d8b04a',D=k?'#9a9ea2':'#a88830';R(x,y,4,2,C);R(x+1,y-1,2,1,C);R(x,y+1,4,1,D)}   // folded paper lotuses
      for(let x=0;x<220;x+=8){R(x,182,4,10,BL);R(x+4,182,4,10,WT);g.fillStyle=BL;g.fillRect(x+1,192,2,2);g.fillStyle=WT;g.fillRect(x+5,192,2,2)}R(0,180,220,3,'#1e3e78');   // front valance, scalloped
      R(3,183,3,37,'#a8aaa8');R(3,183,1,37,'#c8cac8');R(214,183,3,37,'#8a8c8a');
      R(7,194,11,22,'#141414');R(8,195,9,20,'#ece8dc');{const a=pxText('嚴',8,'#141414'),b=pxText('制',8,'#141414');g.drawImage(a,8,195);g.drawImage(b,8,204)}   // 嚴制 pasted on the pole
      SPR.set('yltent',c);return c},
    shufen:f=>sprite('ylsf'+f,14,15,R=>{const HO='#c8bfa0',HD='#a89e80',WH='#e6e2d8',WD='#bcb8ac';R(3,0,8,6,HO);R(2,2,2,8,HO);R(10,2,2,8,HD);R(4,1,6,1,'#d8d0b4');R(5,3,4,3,'#1c1820');R(5,4,4,3,'#e0c4a4');R(5,5,4,1,'#5a4434');   // 淑芬 in a hemp hood, eyes down
      R(2,7,10,6,WH);R(10,8,2,5,WD);R(2,12,11,3,'#d8d4c8');R(2,14,11,1,WD);
      if(f){R(3,10,2,2,'#e0c4a4');R(9,10,2,2,'#e0c4a4');R(5,9,4,2,'#d8b04a');R(6,8,2,1,'#e8c860')}else{R(5,10,4,2,'#e0c4a4');R(5,8,4,2,'#d8b04a');R(4,9,1,1,'#e8c860');R(9,9,1,1,'#e8c860')}}),
    shade:()=>{let c=SPR.get('ylshade');if(c)return c;c=mk(24,12);const g=c.getContext('2d'),a=.42,ca=Math.cos(a),sa=Math.sin(a);g.fillStyle='#000';   // a person's shadow lying on the road, with nobody standing in it
      for(let t=0;t<=19;t+=.5){const w=t<7?(t<5?[-1.6,1.6]:[-1.4,1.4]):t<14?[-2.2,2.2]:t<15?[-.8,.8]:[-2,2];const gap=t<5;for(let s=w[0];s<=w[1];s+=.5){if(gap&&Math.abs(s)<.6)continue;const x=Math.round(2+t*ca-s*sa),y=Math.round(3+t*sa+s*ca);g.fillRect(x,y,1,1)}}
      for(let s=-3;s<=3;s++)g.fillRect(Math.round(2+10*ca-s*sa),Math.round(3+10*sa+s*ca),1,1);SPR.set('ylshade',c);return c},   // arms out a little
    po:()=>{let c=SPR.get('ylpo');if(c)return c;const P=G.player,b=humanSprite(P,'d',0,false),u=humanSprite(P,'u',0,false);c=mk(b.width,b.height);const g=c.getContext('2d');   // you, head bowed: your body, the back of your head dropped low
      g.drawImage(b,0,10,b.width,b.height-10,0,10,b.width,b.height-10);g.drawImage(u,0,0,u.width,10,0,2,u.width,10);g.globalCompositeOperation='source-atop';g.fillStyle='rgba(150,176,196,.38)';g.fillRect(0,0,c.width,c.height);SPR.set('ylpo',c);return c}};

  /* ---------------- where the lights sit (world px), shared by the sprite, the light layer and the glow ---------------- */
  const doorTop=f=>(Math.floor(f.y)+1)*TS-WALLH;
  const PT={shrine:(X,Y)=>[X-4,Y-14],lamp:(X,Y)=>[X-6,Y-36],candle:(X,Y)=>[X,Y-10],lanterns:f=>{const X=W(f.x),y=doorTop(f)+3;return[[X-26,y],[X+26,y]]},
    tentC:f=>{const X=W(f.x)-110,Y=W(f.y)-132;return[[X+77,Y+75],[X+141,Y+75]]},bucket:f=>[W(f.x)-110+63,W(f.y)-132+115],incense:f=>[[W(f.x)-110+107,W(f.y)-132+81],[W(f.x)-110+110,W(f.y)-132+80],[W(f.x)-110+113,W(f.y)-132+81]],mirror:(X,Y)=>[X-1,Y-36]};
  /* how many sticks stand in the 靈堂's 香爐: one per trip walked right tonight, the new one already during the 1.2 s of 上香; the ones a failure put out stay cold */
  const sticks=C=>{const S=(typeof YL_RUN!=='undefined'&&YL_RUN.S)||{},T=trip(C),lit=clamp((S.streak||0)+(T&&T.phase==='incense'?1:0),0,3);return{lit,cold:clamp(S.cold||0,0,3)}};
  /* where your reflection sits in the convex mirror, flipped left-right */
  const refl=(mx,my,P)=>{const dx=clamp(-(P.x-mx)/TS*.9,-4,4),dy=clamp((P.y-my)/TS*.22,0,3);return{x:rnd(mx+dx)-1,y:rnd(my+1+dy),dx}};
  const lanternsOut=(f,C)=>{const T=trip(C),a=T&&(T.anoms||[]).find(i=>i.id==='y_ghostwed');if(!a||a.verdict!=='pass')return[0,0];const t=C&&C.t!=null?C.t:T.t;let k;
    if(a.data&&a.data.endT!=null&&t!=null)k=t-a.data.endT;else{let m=mem.get(a);if(!m||m.passT===undefined){m=m||{};m.passT=G.t;mem.set(a,m)}k=G.t-m.passT}return[k>=0?1:0,k>.4?1:0]};   // one lantern, then the other
  const lampLit=f=>f.kind==='shrine'?true:f.variant==='lit';

  /* ---------------- fixtures ---------------- */
  const DRAW={
    truckbed(f,X,Y){put(SP.box(),X,Y-14);if(G.sc&&G.sc.truck){const[tx,ty]=G.sc.truck,x=rnd(tx)+13,y=rnd(ty)-34;bx.fillStyle='#232624';bx.fillRect(x,y,6,2);bx.fillStyle='#8a9a9a';bx.fillRect(x+1,y,1,1);bx.fillRect(x+2,y+1,1,1);bx.fillRect(x+4,y,1,1)}},   // the right headlight is smashed
    sign(f,X,Y){shadow(X,Y,4,.35);put(SP.sign(),X,Y)},
    ditch(f,X,Y){const y0=f.y0!=null?f.y0:f.y-(f.h||3)/2,L=Math.max(1,Math.round(f.y0!=null?f.y1-f.y0+1:f.h||3)),s=SP.ditch(L);bx.drawImage(s,rnd(X-s.width/2),rnd(W(y0)))},
    pole(f,X){const Y=(Math.floor(f.y)+1)*TS-3;shadow(X,Y,3,.4);bx.drawImage(DSPR.pole(f.variant==='transformer'?2:0),rnd(X-5.5),Y-52)},   // foot where the village's poles stand, so the wires meet the crossarm
    lamp(f,X,Y,C){const lit=f.variant==='lit'&&failId(C)!=='y_lamp';shadow(X+1,Y,3,.4);put(SP.lamp(lit?'lit':'off'),X+5,Y)},
    shrine(f,X,Y,C){const v=f.variant==='turned'?'turned':'normal';   // a failure only puts the lamp out and leaves the 香爐 cold: the god is never made into the scare
      shadow(X+24,Y-48,9,.4);put(SP.banyan(),X+24,Y-46);put(SP.shrine(v),X,Y)},   // the little 榕樹 with its red cloth stands just behind, at (13,62)
    door4(f,X,Y,C){const s=SP.door(f.variant==='wedding'?'wedding':'plain');bx.drawImage(s,rnd(X-s.width/2),doorTop(f)-1);if(f.variant==='wedding'){const out=lanternsOut(f,C);PT.lanterns(f).forEach(([x,y],i)=>{bx.fillStyle='#2b1f14';bx.fillRect(rnd(x),y-4,1,4);const l=SP.lantern(!out[i]);bx.drawImage(l,rnd(x-l.width/2),y-1)})}},
    lintel(f,X){const s=SP.lintel();bx.drawImage(s,rnd(X-s.width/2),doorTop(f)-1)},
    ama(f,X,Y,C){const t=G.t,fan=Math.sin(t*4.2)>0?1:0,curl=(t%2)<.45?1:0,s=SP.ama(f.variant==='tail'?'tail':'normal',fan,f.variant==='tail'?curl:0);shadow(X,Y,7,.4);bx.drawImage(s,rnd(X-9),rnd(Y+1-s.height))},
    mailbox(f,X,Y,C){put(SP.mailbox(),X,Y);const T=trip(C);if(T&&T.done&&T.done.DELIVER){bx.fillStyle='#efeae0';bx.fillRect(rnd(X)+1,rnd(Y)-16,3,1);bx.fillStyle='#c8241c';bx.fillRect(rnd(X)+1,rnd(Y)-17,3,1)}},   // the delivered calendar sticks out of the slot
    candle(f,X,Y){shadow(X,Y,4,.4);put(SP.candle(),X,Y);const k=flick(G.t,3);bx.fillStyle='#ffb347';bx.fillRect(rnd(X),rnd(Y)-11,1,2);if(k>.86){bx.fillStyle='#ffe6a0';bx.fillRect(rnd(X),rnd(Y)-12,1,1)}},
    mirror(f,X,Y,C){const v=f.variant==='extra'?'extra':'normal',s=SP.mirror('normal');put(s,X,Y);const[mx,my]=PT.mirror(X,Y);
      {const P=(C&&C.P)||G.player,{x,y,dx}=refl(mx,my,P);
        if(v==='extra'){const ex=clamp(x+(dx>0?-3:3),rnd(mx)-5,rnd(mx)+2),ey=y-3;   // someone standing right behind you, a head taller: long black hair down to the waist, a white face, white clothes
          bx.fillStyle='#050406';bx.fillRect(ex,ey,4,7);bx.fillStyle='#ece8de';bx.fillRect(ex+1,ey+1,2,3);bx.fillStyle='#3a1010';bx.fillRect(ex+1,ey+2,1,1);bx.fillRect(ex+2,ey+2,1,1);
          bx.fillStyle='#dcdedf';bx.fillRect(ex+1,ey+4,2,3);bx.fillRect(ex,ey+7,4,3)}
        bx.fillStyle='#10141c';bx.fillRect(x,y,3,1);bx.fillStyle='#e0b088';bx.fillRect(x,y+1,3,1);bx.fillStyle='#3e6aa8';bx.fillRect(x,y+2,3,2);bx.fillStyle='#10141c';bx.fillRect(x,y+4,1,1);bx.fillRect(x+2,y+4,1,1)}   // a tiny you, flipped left-right
      if(failId(C)==='y_mirror'){bx.fillStyle='#dfe8ee';for(const[a,b]of[[0,0],[1,-1],[2,-1],[-1,1],[-2,2],[1,1],[2,3],[-1,-2],[-2,-3],[3,0]])bx.fillRect(rnd(mx)+a,rnd(my)+b,1,1)}},   // the glass cracks
    tent(f,X,Y,C){const s=SP.tent(),x0=rnd(X)-110,y0=rnd(Y)-132;bx.drawImage(s,x0,y0);
      {const k=sticks(C);[107,110,113].forEach((x,i)=>{if(i<k.lit){bx.fillStyle='#7a2a16';bx.fillRect(x0+x,y0+82-(i===1?1:0),1,8+(i===1?1:0))}else if(i<k.cold){bx.fillStyle='#3a3632';bx.fillRect(x0+x,y0+86,1,4);bx.fillStyle='#6a6660';bx.fillRect(x0+x,y0+85,1,1)}})}   // 香 in the 香爐: lit ones for tonight's trips, cold stubs where a failure put them out
      const sf=SP.shufen(Math.sin(G.t*2.6)>0?1:0);bx.drawImage(sf,x0+152,y0+114);
      bx.fillStyle='#ffd27a';for(const[x,y]of[[x0+77,y0+76],[x0+141,y0+76]]){bx.fillRect(x,y-1,1,2)}}};
  function fixture(f,ctx){const d=DRAW[f.kind];if(!d)return;d(f,W(f.x),W(f.y),ctx)}
  function sortY(f){const Y=W(f.y);if(f.sy!=null)return f.sy;if(f.kind==='door4')return(Math.floor(f.y)+1)*TS+.1;if(f.kind==='lintel')return(Math.floor(f.y)+1)*TS+.2;if(f.kind==='ditch')return f.y0!=null?W(f.y0):Y-(f.h||3)*TS/2;if(f.kind==='pole')return(Math.floor(f.y)+1)*TS-1;if(f.kind==='tent')return Y+(f.d||7)*TS/2;return Y}
  function reach(f){return f.kind==='tent'?170:f.kind==='ditch'?(f.y0!=null?f.y1-f.y0+1:f.h||3)*TS:f.kind==='door4'?60:60}

  /* ---------------- anomalies with a picture ---------------- */
  const SHOWN={y_girl:1,y_lords:1,y_lamp:1};
  const lampFix=inst=>FIXES().find(f=>f.kind==='lamp')||{x:inst.x,y:inst.y,variant:'lit'};
  function target(inst,keepOnFail){if(inst.verdict==='fail')return keepOnFail?1:0;if(inst.verdict==='pass')return 0;return inst.state==='active'?1:0}
  function girl(inst){const a=fade(inst,inst.verdict==='fail'?0:target(inst),.2,.5);if(a<=.01)return;const s=apparitionSprite('girl',false);blit(s,W(inst.x),W(inst.y)+2,false,a*(.86+Math.sin(G.t*23)*.08))}
  function lordMember(inst,i){const a=fade(inst,target(inst,true),.6,.5),M=(inst.data&&inst.data.members)||[];if(a<=.01||!M[i])return;const m=M[i],X=W(m.x),Y=W(m.y),k=m.kind==='baye'?'baye':'qiye',bob=Math.round(Math.sin(G.t*3.2+i*2)),s=apparitionSprite(k,false);
    shadow(X,Y+1,5,.4*a);
    if(k==='qiye'){bx.fillStyle=`rgba(150,150,160,${.85*a})`;for(let j=0;j<16;j++){const q=j/16,cx=X+4+Math.sin(j*1.3+G.t*6)*.6,cy=j<6?Y-12+j*2:Y+1+(j-6)*1.6;if(j%2===0||j<6)bx.fillRect(rnd(cx+(j>=6?(j-6)*.4:0)),rnd(cy-(j>=6?(j-6)*3.2:0)),1,1)}}   // the iron chain trails behind on the road
    blit(s,X,Y+2+bob,false,.96*a);
    if(k==='baye'){bx.save();bx.globalAlpha=a;bx.fillStyle='#2a1a10';bx.fillRect(rnd(X)+5,rnd(Y)-11+bob,3,6);bx.fillStyle='#c9993c';bx.fillRect(rnd(X)+6,rnd(Y)-10+bob,1,4);bx.restore()}}   // 八爺's 令牌
  function lords(inst){const M=(inst.data&&inst.data.members)||[];for(let i=0;i<M.length;i++)lordMember(inst,i)}
  function lampShade(inst,C){const f=lampFix(inst),lit=f.variant==='lit'&&inst.verdict!=='fail'&&failId(C)!=='y_lamp',m=mem.get(inst)||{a:0,t:G.t},on=lit&&inst.verdict!=='pass';if(on){m.a=1;m.t=G.t;mem.set(inst,m)}const a=on?1:inst.verdict==='fail'||failId(C)==='y_lamp'?0:fade(inst,0,1,.5);if(a<=.01)return;const s=SP.shade(),X=W(f.x),Y=W(f.y);
    bx.save();bx.globalAlpha=.62*a;bx.drawImage(s,rnd(X-7),rnd(Y-6));bx.restore()}
  function anom(inst,ctx){if(inst.id==='y_girl')girl(inst);else if(inst.id==='y_lords')lords(inst);else if(inst.id==='y_lamp')lampShade(inst,ctx)}
  function po(p){put(SP.po(),W(p.x),W(p.y),.35)}
  function ents(list,inView,ctx,poList){const C=ctx||(typeof YL!=='undefined'&&YL.ctx)||null;
    for(const f of FIXES()){if(!inView(W(f.x),f.kind==='ditch'&&f.y0!=null?W(f.y0+f.y1+1)/2:W(f.y),reach(f)))continue;list.push({y:sortY(f),d:()=>fixture(f,C)})}
    const T=trip(C);for(const a of(T&&T.anoms)||[]){if(!SHOWN[a.id])continue;
      if(a.id==='y_lords'){((a.data&&a.data.members)||[]).forEach((m,i)=>list.push({y:W(m.y),d:()=>lordMember(a,i)}));continue}
      if(a.id==='y_lamp'){const f=lampFix(a);list.push({y:W(f.y)-30,d:()=>lampShade(a,C)});continue}   // flat on the ground: under anyone who walks through it
      list.push({y:W(a.y),d:()=>anom(a,C)})}
    for(const p of poList||[])list.push({y:W(p.y),d:()=>po(p)})}
  function wires(fix){const P=(fix||FIXES()).filter(f=>f.kind==='pole').sort((a,b)=>a.y-b.y),out=[];
    for(let i=1;i<P.length;i++){const a=P[i-1],b=P[i];if(Math.abs(b.y-a.y)>8||Math.abs(b.x-a.x)>2)continue;for(const o of[-4,4]){const ax=rnd(W(a.x))+o,bx2=rnd(W(b.x))+o,ay=(Math.floor(a.y)+1)*TS-48,by=(Math.floor(b.y)+1)*TS-48,len=Math.hypot(bx2-ax,by-ay),sag=5+len*.04,n=Math.ceil(Math.max(Math.abs(bx2-ax),Math.abs(by-ay))),x0=Math.min(ax,bx2)-1,y0=Math.min(ay,by)-1,
      c=mk(Math.abs(bx2-ax)+3,Math.abs(by-ay)+sag+4|0),g=c.getContext('2d');g.fillStyle='#0c0c0e';for(let j=0;j<=n;j++){const s=j/n;g.fillRect(Math.round(ax+(bx2-ax)*s-x0),Math.round(ay+(by-ay)*s+sag*4*s*(1-s)*.15-y0),1,1)}out.push({c,x:x0,y:y0})}}
    return out}

  /* ---------------- light layer: holes cut in the dark ---------------- */
  function light(c,ctx){const t=G.t,fid=failId(ctx),T=trip(ctx);if(ctx&&ctx.did==='BOW')bow.t=t;if(T&&T.bowAt!=null)bow.t=Math.max(bow.t,T.bowAt);
    for(const f of FIXES()){const X=W(f.x),Y=W(f.y);switch(f.kind){
      case 'shrine':if(fid!=='y_jisi'&&fid!=='y_turned'){const[x,y]=PT.shrine(X,Y),up=clamp(1-(t-bow.t)/.6,0,1);glow(c,x,y+6,(48+30*up)*flick(t,1),.92)}break;   // after a bow the oil lamp flares
      case 'candle':{const[x,y]=PT.candle(X,Y);glow(c,x,y+4,60*flick(t,3),.9);break}
      case 'lamp':if(f.variant==='lit'&&fid!=='y_lamp'){const[x,y]=PT.lamp(X,Y);glow(c,X-3,Y-5,52,1);glow(c,x,y+2,16,.8)}break;
      case 'door4':if(f.variant==='wedding'){const out=lanternsOut(f,ctx);PT.lanterns(f).forEach(([x,y],i)=>{if(!out[i])glow(c,x,y+8,30*flick(t,i+5),.8)})}break;
      case 'tent':{for(const[x,y]of PT.tentC(f))glow(c,x,y+10,46*flick(t,x),.9);const[bx2,by2]=PT.bucket(f);glow(c,bx2,by2+4,36*flick(t*1.3,9),.75);break}
      case 'truckbed':if(f.variant==='glow')glow(c,X,Y-20,18+Math.sin(t*3)*2,.45);break}}}

  /* ---------------- after the light: things that glow, then the dark behind you ---------------- */
  function over(b,ctx){const t=G.t,fid=failId(ctx),P=(ctx&&ctx.P)||G.player,L=[];
    b.save();b.globalCompositeOperation='lighter';
    for(const f of FIXES()){const X=W(f.x),Y=W(f.y);switch(f.kind){
      case 'shrine':if(fid!=='y_jisi'&&fid!=='y_turned'){const[x,y]=PT.shrine(X,Y),k=flick(t,1);pdisc(b,x,y,4,3,`rgba(255,150,60,${.3*k})`);b.fillStyle='#ffb347';b.fillRect(rnd(x),rnd(y)-1,1,2);b.fillStyle=`rgba(255,230,160,${k})`;b.fillRect(rnd(x),rnd(y)-2,1,1)}break;
      case 'candle':{const[x,y]=PT.candle(X,Y),k=flick(t,3);pdisc(b,x,y,5,4,`rgba(255,160,70,${.28*k})`);b.fillStyle=`rgba(255,200,110,${k})`;b.fillRect(rnd(x),rnd(y)-1,1,2);break}
      case 'lamp':if(f.variant==='lit'&&fid!=='y_lamp'){const[x,y]=PT.lamp(X,Y);pdisc(b,X-3,Y-5,40,18,'rgba(220,200,160,.12)');pdisc(b,X-3,Y-5,22,10,'rgba(235,215,170,.12)');pdisc(b,x,y,10,5,'rgba(240,225,180,.16)');L.push(()=>{b.fillStyle='#fff1c4';b.fillRect(rnd(x)-3,rnd(y),6,1);b.fillRect(rnd(x)-4,rnd(y)+1,3,1)})}break;   // warm-white, not a moth in sight
      case 'door4':if(f.variant==='wedding'){const out=lanternsOut(f,ctx);PT.lanterns(f).forEach(([x,y],i)=>{if(out[i])return;pdisc(b,x,y+4,9,9,`rgba(220,70,30,${.3*flick(t,i+5)})`);L.push(()=>{const l=SP.lantern(true);b.drawImage(l,rnd(x-l.width/2),y-1)})})}break;
      case 'tent':{for(const[x,y]of PT.tentC(f)){const k=flick(t,x);pdisc(b,x,y,4,4,`rgba(255,220,150,${.35*k})`);b.fillStyle=`rgba(255,236,190,${k})`;b.fillRect(x,y-1,1,2)}
        const[ex,ey]=PT.bucket(f),k=flick(t*1.3,9);pdisc(b,ex,ey,6,2,`rgba(240,110,30,${.45*k})`);for(let i=0;i<3;i++){const q=(t*.6+i/3)%1;b.fillStyle=`rgba(255,160,70,${.8*(1-q)})`;b.fillRect(rnd(ex-2+Math.sin(q*8+i)*3),rnd(ey-4-q*20),1,1)}
        {const n=sticks(ctx).lit;PT.incense(f).forEach(([x,y],i)=>{if(i>=n)return;b.fillStyle=`rgba(255,120,50,${.6+.3*Math.sin(t*5+x)})`;b.fillRect(x,y,1,1)})}break}
      case 'mirror':if(f.variant==='extra'){const[mx,my]=PT.mirror(X,Y),{x,y,dx}=refl(mx,my,P),ex=clamp(x+(dx>0?-3:3),rnd(mx)-5,rnd(mx)+2);pdisc(b,ex+1.5,y,3,4,'rgba(150,170,190,.13)');b.fillStyle='rgba(210,214,220,.42)';b.fillRect(ex+1,y-2,2,3)}   // the face behind yours is pale enough to show without the torch
        if(fid!=='y_mirror'){const[mx,my]=PT.mirror(X,Y),a=Math.atan2(my-(P.y-6),mx-P.x),d=Math.hypot(mx-P.x,my-P.y);if(d<250*lightK()&&Math.abs(angDiff(a,P.face))<.45){const r=refl(mx,my,P),gx=r.x+(r.dx>0?-1:3),gy=r.y+2;pdisc(b,gx,gy,1,1,'rgba(255,240,200,.4)');b.fillStyle='#fff6d0';b.fillRect(gx,gy,1,1)}}break;   // your torch caught in the glass, in your reflection's hand
      case 'truckbed':if(f.variant==='glow'){const k=.5+.5*Math.sin(t*3);pdisc(b,X,Y-20,9,5,`rgba(255,230,170,${.12+.1*k})`)}break}}
    b.restore();for(const d of L)d();
    act(b,ctx,P);taken(b,ctx,P);back(b,P)}
  // what your hands are doing: a lit stick of incense while you bow, palms together while you chant
  function act(b,C,P){const A=C&&C.act;if(!A||!P)return;const x=rnd(P.x),y=rnd(P.y);
    if(A.verb==='BOW'){b.fillStyle='#7a2a16';b.fillRect(x+3,y-17,1,6);b.fillStyle='#ffb347';b.fillRect(x+3,y-18,1,1);for(let i=0;i<3;i++){const q=(G.t*.7+i/3)%1;b.fillStyle=`rgba(220,214,200,${.35*(1-q)})`;b.fillRect(x+3+rnd(Math.sin(q*7+i)*2),y-20-rnd(q*12),1,1)}}
    else if(A.verb==='NIANFO'){b.fillStyle='#e0b48c';b.fillRect(x-1,y-13,2,3);b.fillStyle='#5a3a1c';b.fillRect(x-2,y-10,1,1);b.fillRect(x+1,y-10,1,1);b.fillRect(x-1,y-9,2,1)}}
  // y_jisi, bowing when the calendar says 忌祭祀: in the dark a pale hand comes out of the roadside and takes the incense from yours
  function taken(b,C,P){const T=trip(C);if(failId(C)!=='y_jisi'||!T.fail||T.fail.reason!=='did')return;const ft=G.t-T.fail.t;if(ft<0||ft>.9)return;
    const hx=rnd(P.x)+3,hy=rnd(P.y)-12,e=v=>v*v*(3-2*v),reach=e(clamp((ft-.12)/.33,0,1)),away=e(clamp((ft-.5)/.38,0,1)),ox=hx+30,tipX=rnd(ox+(hx+1-ox)*reach+(ox+10-hx)*away),a=1-clamp((ft-.75)/.15,0,1);
    b.save();b.globalAlpha=a;const sx=away>0?tipX-1:hx;   // the stick: in your hand, then in the other one, going away into the dark
    b.fillStyle='#7a2a16';b.fillRect(sx,hy-5,1,6);b.globalCompositeOperation='lighter';pdisc(b,sx,hy-6,2,2,'rgba(255,140,50,.35)');b.fillStyle='#ffb347';b.fillRect(sx,hy-6,1,1);b.globalCompositeOperation='source-over';
    if(reach>0){const L=Math.max(0,ox+14-tipX-4);for(let i=0;i<L;i++){b.globalAlpha=a*.85*(1-i/L);b.fillStyle='#8e897e';b.fillRect(tipX+4+i,hy-1,1,2)}   // a thin grey arm out of the dark, fading into it
      b.globalAlpha=a*.9;b.fillStyle='#cbc5b6';b.fillRect(tipX+1,hy-2,3,4);b.fillStyle='#b4ae9f';b.fillRect(tipX,hy-2,1,1);b.fillRect(tipX,hy,1,1);b.fillRect(tipX+3,hy+2,1,1);b.fillStyle='#e2ddd0';b.fillRect(tipX+1,hy-2,1,1)}   // a pale hand, fingers closing on the stick
    b.restore()}
  // behind you is black: nothing south of your feet reads, so you have to turn round to see it
  function back(b,P){const y0=Math.round(P.y+TS*.5),x0=Math.floor(CAM.x)-60,w=BW+120,y2=Math.ceil(CAM.y+BH)+60;
    for(let i=0;i<6;i++){b.fillStyle=`rgba(1,2,4,${(.97*(i+.5)/6).toFixed(3)})`;b.fillRect(x0,y0+i*4,w,4)}b.fillStyle='rgba(1,2,4,.97)';b.fillRect(x0,y0+24,w,Math.max(0,y2-y0-24))}

  return{FACE:{y_girl:'girl',y_call:'voice',y_ghostwed:'bride',y_tail:'tiger'},fixture,anom,po,light,over,sortY,reach,ents,wires}})();

const YL_SND=(()=>{
  const S=()=>typeof SND!=='undefined'&&SND.ok();
  const T=(...a)=>SND.tone(...a),N=(...a)=>SND.noise(...a);
  const P={
    qing(){T(1046,1043,3.2,.07);T(2794,2788,2.1,.035);T(4210,4200,1.2,.018);T(523,522,2.6,.03)},   // 磬: a struck bowl, inharmonic and long
    muyu(){T(820,690,.08,.34,'triangle');T(410,380,.12,.16,'sine');N(.03,1900,3,.18,'bandpass')},    // 木魚: hollow wood
    pa(){N(.025,4200,1.5,.5,'highpass');T(1700,520,.03,.12,'square')},                               // the torch clicks off
    dong(){T(150,92,.28,.42);N(.09,600,1,.28,'lowpass');T(1240,1232,.35,.025,'sine',.02)},          // a calendar dropped in a tin box
    paper(){N(.14,3400,1.1,.11);N(.12,2600,1,.08,'bandpass',.12)},
    chain(){for(let i=0;i<9;i++){const f=2300+Math.random()*1500;T(f,f*.97,.06,.035,'triangle',i*.13+Math.random()*.04)}N(1.2,1500,.8,.07,'bandpass')},
    gong(){for(const[f,g]of[[196,.16],[289,.1],[411,.07],[538,.05]])T(f,f*.985,2.2,g,'triangle');N(.3,900,.7,.18,'lowpass')},
    lingpai(){N(.05,1300,1.4,.85,'bandpass');T(320,120,.09,.42,'triangle')},
    radio(){N(.02,3000,1,.4,'highpass');N(1.9,2600,.5,.07,'bandpass',.03);[0,.5,.95,1.35].forEach(d=>T(240+Math.random()*90,200,.22,.03,'sawtooth',.3+d));N(.02,3000,1,.3,'highpass',2)},   // the cab radio switching itself on, static, a voice under it, off
    stepBehind(){if(SND.sfx('step',{gain:.5,rate:.86}))return;N(.08,520,1.4,.16)},
    crack(){N(.22,4300,.8,.32,'highpass');for(let i=0;i<5;i++)T(3000+Math.random()*2200,2800,.07,.03,'sine',.02+i*.04);T(160,70,.08,.2,'sine')},
    call(){[[230,205,.22,0],[250,214,.22,.22],[268,170,.7,.44]].forEach(([a,b,d,w])=>T(a,b,d,.07,'sawtooth',w));N(1.1,1400,2.5,.04,'bandpass')},   // 「少年仔——」, the last syllable drawn out
    puff(){N(.12,500,1,.35,'lowpass');T(200,80,.1,.14)},
    ash(){for(let i=0;i<6;i++)N(.08,5400,1,.05,'highpass',i*.09+Math.random()*.04)},
    creak(){T(90,140,.9,.07,'sawtooth');N(.9,700,4,.05)},
    approach(){for(let i=0;i<5;i++){const g=.15+i*.12;if(!SND.sfx('step',{gain:g,rate:.88,delay:i*.42}))N(.08,520,1.4,g*.5,'bandpass',i*.42)}},
    step(){if(SND.sfx('step',{gain:.45,rate:.9}))return;N(.08,520,1.4,.14)},
    stepEar(){if(SND.sfx('step',{gain:.9,rate:.8}))return;N(.09,480,1.4,.3)},   // the last step, right behind your ear
    breath(){N(.6,620,1.3,.11,'bandpass',.22);N(.5,1250,1.1,.05,'bandpass',.26);N(.35,520,1.2,.06,'bandpass',1.05)}};   // a slow breath out at your neck, then in
  // play a sound as if it came from (x,y) in tiles: behind you it is muffled and quieter, left/right follows dx
  function at(kind,x,y,o){o=o||{};if(!S()||!G)return false;const Pl=G.player,ac=SND.ac,dx=x*TS-Pl.x,dy=y*TS-Pl.y,d=Math.hypot(dx,dy),behind=o.behind!=null?!!o.behind:dy>TS*.5;
    const k=Math.pow(clamp(1-d/(17*TS),0,1),1.3)*(behind?.7:1)*(o.gain==null?1:o.gain);if(k<.01)return false;
    const g=ac.createGain();g.gain.value=k;const lp=ac.createBiquadFilter();lp.type='lowpass';lp.frequency.value=behind?900:12000;lp.connect(g);
    if(ac.createStereoPanner){const p=ac.createStereoPanner();p.pan.value=clamp(dx/(7*TS),-1,1);g.connect(p).connect(SND.fx)}else g.connect(SND.fx);
    const prev=SND._d;SND._d=lp;try{play(kind)}finally{SND._d=prev}return true}
  function play(kind){if(P[kind])return P[kind]();if(typeof SND[kind]==='function'&&!['at','cue','init','sfx','mix','music','amb','tone','noise','env'].includes(kind))return SND[kind]();return SND.cue(kind,G.player.x,G.player.y)}
  // the whole world goes quiet at once: master gain to zero in 15 ms, back in 40 ms when the silence ends
  function hush(sec){if(typeof G!=='undefined'&&G)G.silence=Math.max(G.silence||0,G.t+sec);if(typeof SND==='undefined'||!SND.ac||!SND.out)return;const g=SND.out.gain,now=SND.ac.currentTime,v=SND.on?.78*SND.vol.master/100:0;
    g.cancelScheduledValues(now);g.setValueAtTime(g.value,now);g.linearRampToValueAtTime(0,now+.015);g.setValueAtTime(0,now+sec);g.linearRampToValueAtTime(v,now+sec+.04)}
  const out={at,hush};for(const k in P)out[k]=()=>{if(S())P[k]()};return out})();

const YL_UI=(()=>{
  const el=id=>document.getElementById(id),esc=s=>String(s==null?'':s).replace(/[&<>"]/g,c=>({'&':'&amp;','<':'&lt;','>':'&gt;','"':'&quot;'})[c]);
  const NUM='〇一二三四五六七八九',touch=()=>typeof IS_TOUCH!=='undefined'&&IS_TOUCH,kh=s=>touch()?'':s;
  const LINES={1:['走夜路，背後有人叫你，別回頭。','暗暝行路，啥人叫你攏莫越頭。'],2:['今晚，月曆翻過來了。','今暗，月曆攏顛倒反矣。'],3:['夜裡有隊伍要從路上過，就蹲到路邊讓路。','暗暝有陣頭欲過，就跍去路邊閃一下。']};
  const terms=a=>a&&a.length?a.map(esc).join('　'):'—';
  const calRows=(c,cls)=>`<div class="${cls}"><b class="yi">宜</b><span>${terms(c&&c.yi)}</span><b class="ji">忌</b><span>${terms(c&&c.ji)}</span></div>`;
  const FIRST=[['WASD','走路'],['E','拿月曆'],['C','蹲'],['空白鍵','念佛']],FIRST_TOUCH='左半邊拖曳走路';
  const incense=(st,need)=>need?`<span class="ylinc" aria-label="香 ${st}／${need}">${Array.from({length:need},(_,i)=>`<i class="${i<st?'on':''}"></i>`).join('')}</span>`:'';
  const night=n=>`守靈第${NUM[n]||n}夜`,mmss=s=>{s=Math.max(0,Math.round(s||0));return`${Math.floor(s/60)}:${String(s%60).padStart(2,'0')}`};
  // injected once at load: everything the 夜路 screens need, in the same tokens as head.html
  {const st=document.createElement('style');st.id='ylcss';st.textContent=`
body:not(.yelu) #ylhud,body:not(.yelu) #ylcal,body:not(.yelu) #ylslip{display:none!important}
#stage.lunge #ylhud{visibility:hidden}
#ylhud{position:absolute;inset:0;pointer-events:none}
#ylhud .ylmini{position:absolute;top:14px;left:16px;display:grid;grid-template-columns:auto 1fr;gap:4px 8px;align-items:center;padding:0 12px 9px;min-width:132px;box-sizing:border-box;
  background:var(--paper);color:var(--ink);box-shadow:0 10px 30px #000a;opacity:.86;pointer-events:auto;text-align:left;font:500 15px/1.3 var(--f-ui)}
#ylhud .ylmini .h{grid-column:1/-1;margin:0 -12px 3px;padding:5px 12px;background:var(--red);color:var(--paper);font:700 14px/1.2 var(--f-ui);letter-spacing:.1em}
#ylhud .ylmini b,#ylcal b.yi,#ylcal b.ji,.ylalm b{font:900 14px/1 var(--f-head);color:var(--paper);padding:3px 4px;border-radius:2px;justify-self:start}
.yi{background:var(--iron)}.ji{background:var(--red)}
#ylhud .ylbeads{position:absolute;top:118px;left:16px;display:flex;gap:7px;align-items:center;font:500 14px/1 var(--f-ui);color:var(--fluo-2);text-shadow:0 1px 3px #000}
#ylhud .ylbeads i{width:14px;height:14px;border-radius:50%;background:radial-gradient(circle at 35% 30%,#d8a46a,#7a4a24 60%,#4a2a12);box-shadow:0 0 0 1px #2a1a0c,0 1px 6px #000}
#ylhud .ylbeads i.used{background:#1a1612;box-shadow:inset 0 0 0 1px #4a3a2a}
#ylhud .ylbeads span{margin-left:4px;white-space:nowrap}
#ylhud .ylinc,#ylcard .ylinc{display:inline-flex;gap:6px;align-items:flex-end;height:16px;margin-left:12px}
#ylhud .ylinc i,#ylcard .ylinc i{position:relative;width:3px;height:14px;border-radius:0;background:#4a4440;box-shadow:0 1px 3px #000}
#ylhud .ylinc i.on,#ylcard .ylinc i.on{background:#9a3a1a}
#ylhud .ylinc i.on::before,#ylcard .ylinc i.on::before{content:'';position:absolute;left:-1px;top:-3px;width:5px;height:4px;background:#ffa040;box-shadow:0 0 6px 2px #ff7a1cb0}
#ylcard .ylinc{margin:18px 0 0;height:30px;gap:12px}#ylcard .ylinc i{width:4px;height:28px}
body.yelu.touch #t-act.ylnear{background:#3a3210f0;box-shadow:inset 0 0 0 2px var(--fluo),0 0 16px 3px #f0d06a99;animation:ylglow 1.1s ease-in-out infinite}
body.yelu.touch #t-breath.ylpulse{box-shadow:inset 0 0 0 2px var(--fluo),0 0 16px 3px #f0d06a99;animation:tube .6s steps(1,end) 4}
@keyframes ylglow{50%{box-shadow:inset 0 0 0 2px var(--fluo),0 0 6px 1px #f0d06a55}}
#ylhud kbd,#ylcard kbd{font-size:14px;height:24px;min-width:24px}
#ylhud .pulse{animation:tube .6s steps(1,end) 2}
#ylhud .ylhint{position:absolute;left:50%;bottom:22px;transform:translateX(-50%);display:flex;gap:14px;flex-wrap:wrap;justify-content:center;width:max-content;max-width:calc(100% - 32px);font:500 15px/1.4 var(--f-ui);color:var(--fluo);text-shadow:0 1px 3px #000,0 0 10px #000;opacity:.92}
#ylhud .ylhint span{white-space:nowrap}
#ylcal{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;background:#07090ab3;pointer-events:auto;cursor:pointer}   /* a tap puts it away (W1) */
#ylcal .page,#ylcard .page{width:min(440px,100%);box-sizing:border-box;padding:30px clamp(18px,4vw,30px) 20px;background:var(--paper);color:var(--ink);box-shadow:var(--lift);display:flex;flex-direction:column;gap:12px;
  -webkit-mask:radial-gradient(circle 4px at 10px 10px,#0000 98%,#000) -10px -10px/20px 100% repeat-x,linear-gradient(#000,#000) 0 10px/100% calc(100% - 10px) no-repeat;
          mask:radial-gradient(circle 4px at 10px 10px,#0000 98%,#000) -10px -10px/20px 100% repeat-x,linear-gradient(#000,#000) 0 10px/100% calc(100% - 10px) no-repeat}
#ylcal .page{animation:tube .5s steps(1,end) both}
.ylday{display:grid;grid-template-columns:auto minmax(0,1fr);gap:16px;align-items:center;border-bottom:2px solid var(--ink);padding-bottom:12px}
.ylday .num{font:900 clamp(84px,22vw,128px)/.82 var(--f-head);color:var(--red)}
.ylday h2{margin:0;font:900 clamp(26px,6vw,36px)/1.15 var(--f-head);letter-spacing:.02em}
.ylday small{display:block;margin-top:6px;font:500 14px/1.3 var(--f-ui);color:var(--ink-2);letter-spacing:.06em}
.ylalm{display:grid;grid-template-columns:auto minmax(0,1fr);gap:10px 14px;align-items:center;font:900 clamp(24px,6.4vw,34px)/1.2 var(--f-head)}
.ylalm b{font-size:clamp(20px,5vw,26px)!important;padding:5px 7px!important}
.ylalm span{overflow-wrap:anywhere}
.ylline{margin:0;font:700 clamp(18px,4.6vw,22px)/1.55 var(--f-ui);text-wrap:pretty}
.yltw{margin:-6px 0 0;font:400 15px/1.6 var(--f-ui);color:var(--ink-2);text-wrap:pretty}
.ylfoot{margin:0;font:500 14px/1 var(--f-ui);letter-spacing:.3em;color:var(--ink-2);text-align:center;border-top:1px solid #11111122;padding-top:12px}
#ylslip{position:absolute;inset:0;display:flex;align-items:center;justify-content:center;padding:24px;box-sizing:border-box;pointer-events:auto}
#ylslip .slip{width:min(520px,100%);box-sizing:border-box;padding:22px 24px 20px;background:var(--paper);color:var(--ink);box-shadow:var(--lift);border-left:6px solid var(--red);animation:ylin .45s var(--ease) both}
#ylslip .zh{margin:0;font:400 clamp(22px,5.6vw,30px)/1.45 var(--f-hand);text-wrap:balance;line-break:strict}
#ylslip .tw{margin:10px 0 0;font:400 16px/1.6 var(--f-ui);color:var(--ink-2);text-wrap:pretty}
@keyframes ylin{from{opacity:0;transform:translateY(18px)}}
#ylcard .row{margin-top:2px}
#ylcard .c1,#ylcard .c2{display:flex;flex-direction:column;gap:12px;min-width:0}
.ylnote{margin:0;font:400 14px/1.6 var(--f-ui);color:var(--ink-2);text-wrap:pretty}
#ylcard.wait{background:#030405e6}#ylcard.wait .dawnline{color:var(--fluo)}#ylcard .ylwait{display:flex;flex-direction:column;align-items:center}
/* a phone on its side: two columns, so the button stays on screen */
@media (max-height:500px){#ylcard .page{width:min(780px,100%);flex-direction:row;align-items:center;gap:24px;padding:22px 22px 16px}#ylcard .c1,#ylcard .c2{flex:1 1 0}
  #ylcard .ylday .num{font-size:72px}#ylcard .ylday h2{font-size:26px}#ylcard .ylalm{font-size:24px}#ylcard .ylline{font-size:18px;line-height:1.5}#ylcard .ylrows div{padding:6px 0}}
#ylcard.dawn{background:radial-gradient(ellipse at 30% 20%,#eef7f3,#a9c2bb 70%,#7e9890)}
#ylcard .dawnline{font:900 clamp(40px,11vw,64px)/1.1 var(--f-head);color:var(--ink);letter-spacing:.08em;animation:tube 1s steps(1,end) both}
#ylcard .ylrows{display:grid;grid-template-columns:minmax(0,1fr);border-top:2px solid var(--ink)}
#ylcard .ylrows div{display:flex;justify-content:space-between;gap:12px;flex-wrap:wrap;padding:9px 0;border-bottom:1px solid #11111122;font:500 15px/1.4 var(--f-ui)}
#ylcard .ylrows b{font:900 17px/1.4 var(--f-head)}
#ylcard .ylrows .tot{border-bottom:0;font-weight:700}
@media (prefers-reduced-motion:reduce){#ylslip .slip,#ylcal .page,#ylcard .dawnline,#ylhud .pulse,body.yelu.touch #t-act.ylnear,body.yelu.touch #t-breath.ylpulse{animation:none!important}}
`;document.head.appendChild(st)}
  const U={_k:'',_cal:null,_open:null};
  U.hud=o=>{const h=el('ylhud');if(!h)return;if(!o){h.hidden=true;return}const cal=o.cal||{yi:[],ji:[]},b=clamp(o.beads==null?3:o.beads,0,3),need=o.need|0,st=clamp(o.streak|0,0,need);U._cal=Object.assign({n:o.night},cal);
    if(!h._yl){h._yl=1;h.addEventListener('mousedown',e=>{if(e.target.closest&&e.target.closest('.ylmini'))e.preventDefault()})}   // a click must not leave focus on the button, or the next Space/Enter presses it again
    const pulse=o.pulse||o.hint==='nianfo',hs=o.hint==='first'?(touch()?FIRST_TOUCH:FIRST):o.hint==='nianfo'?null:o.hint;
    const hint=!hs?'':typeof hs==='string'?`<span>${esc(hs)}</span>`:hs.map(([k,v])=>`<span><kbd>${esc(k)}</kbd> ${esc(v)}</span>`).join('');
    const key=[o.night,terms(cal.yi),terms(cal.ji),b,hint,!!pulse,touch(),st,need].join('|');if(key!==U._k){U._k=key;
      h.innerHTML=`<button class="ylmini" tabindex="-1" aria-label="今晚的月曆"><span class="h">${night(o.night||1)}</span><b class="yi">宜</b><span>${terms(cal.yi)}</span><b class="ji">忌</b><span>${terms(cal.ji)}</span></button>`+
        `<div class="ylbeads${pulse?' pulse':''}" aria-label="佛珠 ${b} 顆">${[0,1,2].map(i=>`<i class="${i<b?'':'used'}"></i>`).join('')}<span>念佛${kh(' <kbd>空白鍵</kbd>')}</span>${incense(st,need)}</div>`+(hint?`<div class="ylhint">${hint}</div>`:'');
}
    if(touch()){const a=el('t-act'),n=el('t-breath');if(a)a.classList.toggle('ylnear',!!o.near);if(n)n.classList.toggle('ylpulse',!!pulse)}   // the phone's buttons light up when they are the thing to press
    h.hidden=false};
  U.cal=(show,cal)=>{const c=el('ylcal');if(!c)return;if(!show){c.hidden=true;return}cal=cal||U._cal||{};
    c.innerHTML=`<div class="page"><div class="ylday"><b class="num">${cal.n||1}</b><div><h2>${night(cal.n||1)}</h2><small>山腳村農會</small></div></div>${calRows(cal,'ylalm')}</div>`;c.hidden=false};
  U.slip=(zh,tw,ms,onDone)=>{const s=el('ylslip');if(!s)return;clearTimeout(U._slT);if(!zh){s.hidden=true;s.onclick=null;if(U._open==='slip')U._open=null;return}
    s.innerHTML='<div class="slip"><p class="zh"></p><p class="tw"></p></div>';s.querySelector('.zh').textContent=zh;s.querySelector('.tw').textContent=tw||'';s.hidden=false;U._open='slip';
    const t0=performance.now();let done=false;const fin=()=>{if(done)return;done=true;clearTimeout(U._slT);s.hidden=true;s.onclick=null;U._open=null;U._go=null;onDone&&onDone()};
    U._go=()=>{if(performance.now()-t0<400)return false;fin();return true};s.onclick=()=>U._go&&U._go();if(U.selfTime)U._slT=setTimeout(fin,ms==null?1000:ms)};
  U.card=(kind,data,onGo)=>{const c=el('ylcard');if(!c)return;clearTimeout(U._cT);c.classList.remove('dawn','wait');if(!kind){c.hidden=true;c.onclick=null;U._go=null;if(U._open==='card')U._open=null;return}data=data||{};
    let html='';const n=data.n||1;
    if(kind==='night'){const L=LINES[n]||['',''],zh=data.zh||L[0],tw=data.tw||L[1];html=`<div class="page"><div class="c1"><div class="ylday"><b class="num">${n}</b><div><h2>${esc(data.name||night(n))}</h2><small>撕下今晚的一頁</small></div></div>${calRows(data.cal,'ylalm')}</div><div class="c2"><p class="ylline">${esc(zh)}</p><p class="yltw">${esc(tw)}</p><div class="row"><button class="btn red" data-go="go">上路${kh('（Enter）')}</button></div><p class="ylfoot">山腳村農會　敬贈</p></div></div>`}
    else if(kind==='dawn'){c.classList.add('dawn');html=`<b class="dawnline">${esc(data.text||'天光了。')}</b>`}
    else if(kind==='wait'){c.classList.add('wait');html=`<div class="ylwait"><b class="dawnline">${esc(data.text||'天猶未光。')}</b>${incense(data.streak|0,data.need|0)}</div>`}
    else{const N=data.nights||[],tot=data.secs!=null?data.secs:N.reduce((a,x)=>a+(x.secs||0),0),tx=(data.text||'第三夜過去了。頭七還沒到。').split('。').filter(Boolean);
      html=`<div class="page"><div class="c1"><div class="ylday" style="grid-template-columns:minmax(0,1fr)"><div><h2>${esc(tx[0])}。</h2><small>${tx.slice(1).map(x=>esc(x)+'。').join('')}</small></div></div>`+
      (data.note?`<p class="ylnote">${esc(data.note)}</p>`:'')+`</div><div class="c2"><div class="ylrows">${N.map(x=>`<div><b>${night(x.n)}</b><span>走了 ${x.trips||0} 趟・錯 ${(x.fails&&x.fails.length!=null?x.fails.length:x.fails)||0} 次・${mmss(x.secs)}</span></div>`).join('')}<div class="tot"><span>三夜合計</span><span>${mmss(tot)}</span></div></div>`+
      `<div class="row"><button class="btn red" data-go="again">再走一次${kh('（R）')}</button><button class="btn line" data-go="title">回到標題</button></div></div></div>`}
    c.innerHTML=html;c.hidden=false;U._open='card';const t0=performance.now();let done=false;
    const go=v=>{if(done)return true;if(kind!=='end'&&performance.now()-t0<400&&v==='tap')return false;if(onGo&&onGo.ready&&!onGo.ready())return false;done=true;clearTimeout(U._cT);c.hidden=true;c.onclick=null;U._go=null;U._open=null;onGo&&onGo(v==='tap'?'go':v);return true};
    U._go=v=>go(kind==='end'?(v==='title'?'title':'again'):'go');
    c.onclick=e=>{const b=e.target.closest&&e.target.closest('[data-go]');if(b){go(b.dataset.go);return}if(kind!=='end')go('tap')};
    const ms=data.ms!=null?data.ms:0;if(ms)U._cT=setTimeout(()=>go('go'),ms)};
  U.go=v=>U._go?U._go(v)!==false:false;
  return U})();
