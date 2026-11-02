// yelu_route: 夜路 W1 checks (map, look-back, 念佛, the walk, failing, inputs, nights). Runs inside the page; returns [{name,ok,detail}]
(()=>{const R=[];const T=(name,fn)=>{try{const d=fn();R.push({name,ok:!!(d===true||(d&&d.ok)),detail:d&&d.detail!==undefined?d.detail:d})}catch(e){R.push({name,ok:false,detail:String(e.stack||e)})}};
KT.manual=true;const TS=24,K=KT.keys,F=-Math.PI/2,deg=a=>Math.abs(a*180/Math.PI),f2=v=>Math.round(v*100)/100;
const W2=Object.keys(YL_RULES.DEFS||{}).length>0;   /* the real rules file is in this build */
const up=()=>{for(const k in K)K[k]=false;KT.mouse.active=false};
const fresh=(n,seed)=>{up();YLT.start(n||1,seed||4242,1);YLT.force([]);return KT.G};
const walk=()=>{YL.trip.done.READ=true;YL.trip.phase='walk'};
const walkAll=()=>{walk();YL.trip.done.BOW=YL.trip.done.DELIVER=true};   /* past S3 and S4 with both verbs done, for nights whose calendar needs them */
const P=()=>KT.G.player,step=s=>KT.step(Math.round(s*60));
const tap=c=>{YLT.press(c);YLT.release(c)};
// --- 1. the map
T('場景：MW=21、MH=120，路、貨車、兩棟房子、竹林、邊界都在規格位置',()=>{const G=fresh(),t=(x,y)=>G.map[y][x];let road=true;for(let y=1;y<=117;y++)for(let x=9;x<=11;x++)if(t(x,y)!=='r')road=false;
  const v=[[13,111],[14,111],[13,112],[14,112]].every(([x,y])=>t(x,y)==='V'),wall=t(13,98)==='#'&&t(17,102)==='#'&&t(3,39)==='#'&&t(8,44)==='#',door=t(6,44)==='d'&&t(7,44)==='d'&&t(13,102)==='d',
    yard=t(3,45)==='s'&&t(8,48)==='s',bam=t(3,12)==='b'&&t(17,33)==='b'&&t(13,20)==='.'&&t(16,21)==='.'&&t(17,20)==='b',edge=t(0,50)==='T'&&t(20,50)==='T'&&t(10,0)==='T'&&t(10,119)==='T',shoulder=t(8,90)==='.'&&t(12,90)==='.';
  return{ok:MW===21&&MH===120&&road&&v&&wall&&door&&yard&&bam&&edge&&shoulder&&G.sc.truck[0]===13.5*TS&&G.sc.start[1]===113.5,detail:`MW=${MW} MH=${MH} road=${road} V=${v} walls=${wall} doors=${door} yard=${yard} bamboo=${bam} edge=${edge} shoulder=${shoulder}`}});
T('場景：YL.FIX 每一筆 6.5 ≤ x ≤ 14.5',()=>{fresh();const xs=YL.FIX.map(f=>f.x),bad=YL.FIX.filter(f=>!(f.x>=6.5&&f.x<=14.5));
  const kinds=[...new Set(YL.FIX.map(f=>f.kind))].sort().join(',');return{ok:!bad.length&&YL.FIX.length===17,detail:`${YL.FIX.length} 筆 x∈[${Math.min(...xs)},${Math.max(...xs)}] 超出=${bad.map(f=>f.id)} kinds=${kinds}`}});
T('場景：被不對勁改到的細節，離中心線 ≤2 格或在光源半徑內',()=>{fresh();
  const L=[{n:'油燈',x:12.5,y:64.5,r:2},{n:'蠟燭',x:8.5,y:47.5,r:2.5},{n:'亮的路燈',x:12.5,y:86.5,r:2}];
  const used=new Set(['lamp','shrine','door4','ama','mirror']);for(const d of Object.values(YL_RULES.DEFS||{}))if(d.art&&d.art.fix)used.add(d.art.fix);
  const out=[...used].map(id=>{const f=YL.fix(id);if(!f)return{id,ok:false,why:'missing'};const lat=Math.abs(f.x-YL.X0),l=L.find(s=>Math.hypot(s.x-f.x,s.y-f.y)<=s.r);
    /* the wedding look carries its own lit lanterns (spec §3.2: 燈籠亮的時候自己會發光) */
    const self=id==='door4';return{id,ok:lat<=2||!!l||self,why:lat<=2?`離中心 ${lat}`:l?`${l.n} ${f2(Math.hypot(l.x-f.x,l.y-f.y))}/${l.r}`:self?`離中心 ${lat}，喜事燈籠自己發光`:`離中心 ${lat}，沒有光`}});
  return{ok:out.every(o=>o.ok)&&out.every(o=>YL.fix(o.id).kind===o.id),detail:out.map(o=>`${o.id}:${o.why}`).join('；')}});
// --- 3. looking back
T('回頭：視線轉到背後 0.45 秒是 false、0.55 秒是 true',()=>{fresh();YLT.place(10.5,104);KT.step(2);YLT.view(Math.PI/2);KT.step(27);const a=YL.lookingBack(),fa=P().face;KT.step(6);const b=YL.lookingBack();YLT.view(null);
  return{ok:!a&&b,detail:`0.45s=${a} 0.55s=${b} face=${f2(deg(fa))}°`}});
/* spec change (judge A1): only a deliberate look is looking back; walking backwards keeps the torch on the road ahead */
T('回頭：倒退走 2 秒一直是 false，視線在前方 ±10°',()=>{fresh();YLT.place(10.5,100);KT.step(2);K.KeyS=true;let any=0,worst=0;for(let i=0;i<120;i++){KT.step(1);if(YL.lookingBack())any++;if(i>=30)worst=Math.max(worst,deg(angDiff(P().face,F)))}const sp=YL.speed();K.KeyS=false;
  return{ok:any===0&&worst<=10&&sp>3,detail:`true 的幀數=${any} 0.5 秒後視線最多偏 ${f2(worst)}° 速度=${f2(sp)} 格/秒`}});
T('回頭：往西南斜退 0.6 秒、再停 2 秒，一直是 false',()=>{fresh();YLT.place(10.5,100);KT.step(2);K.KeyS=true;K.KeyA=true;let any=0;for(let i=0;i<36;i++){KT.step(1);if(YL.lookingBack())any++}K.KeyS=false;K.KeyA=false;for(let i=0;i<120;i++){KT.step(1);if(YL.lookingBack())any++}
  return{ok:any===0&&deg(angDiff(P().face,F))<1,detail:`true 的幀數=${any} 停下 2 秒後視線偏 ${f2(deg(angDiff(P().face,F)))}°`}});
T('回頭：滑鼠指向背後 0.6 秒仍然是 true（刻意的回頭照算）',()=>{fresh();YLT.place(10.5,104);KT.step(2);YLT.view(Math.PI/2+.05);KT.step(36);const b=YL.lookingBack();YLT.view(null);return{ok:b,detail:`0.6s=${b}`}});
if(W2)T('背後叫名字在 S4：走過信箱再往西南退 0.6 秒投月曆，不判回頭',()=>{fresh(1,4242);YL_RUN.S.trip=2;YLT.force([{id:'y_call',seg:'S4'}]);const Tr=YL.trip;Tr.done.READ=Tr.done.BOW=true;Tr.phase='walk';YLT.place(10.5,50.5);KT.step(2);
  K.KeyW=true;let n=0;while(P().y/TS>45.3&&n++<400)KT.step(1);K.KeyW=false;KT.step(6);K.KeyS=true;K.KeyA=true;KT.step(36);K.KeyS=false;K.KeyA=false;const it=KT.interactTarget();if(it)it.fn();KT.step(60);
  const s=YLT.state();return{ok:s.phase==='walk'&&!s.fail&&s.done.DELIVER&&it&&it.label==='投月曆',detail:`提示=${it&&it.label} phase=${s.phase} fail=${s.fail&&s.fail.id} 投了=${s.done.DELIVER}`}});
T('互動：只按 W 沿中線走，「拜土地公」「投月曆」提示各出現 ≥ 0.2 秒',()=>{fresh(1,4242);YL_RUN.S.trip=2;YLT.force([]);const Tr=YL.trip;Tr.done.READ=true;Tr.phase='walk';YLT.place(10.5,70);KT.step(2);const t={};K.KeyW=true;
  for(let i=0;i<60*8&&P().y/TS>40;i++){KT.step(1);const it=KT.interactTarget();if(it)t[it.label]=(t[it.label]||0)+1/60;Tr.done.BOW=false;Tr.done.DELIVER=false;if(Tr.phase!=='walk'){Tr.phase='walk';Tr.fail=null;Tr.rules={cut:{BOW:1,DELIVER:1},said:{ama:1},over:false,nfT:-1}}}K.KeyW=false;
  return{ok:(t['拜土地公']||0)>=.2&&(t['投月曆']||0)>=.2,detail:`拜土地公 ${f2(t['拜土地公']||0)} 秒 投月曆 ${f2(t['投月曆']||0)} 秒`}});
T('回頭：側走 3 秒（往東 1.5 秒、往西 1.5 秒）一直是 false',()=>{fresh();YLT.place(4,108);KT.step(2);let any=0,x0=P().x;K.KeyD=true;for(let i=0;i<90;i++){KT.step(1);if(YL.lookingBack())any++}const x1=P().x;K.KeyD=false;K.KeyA=true;for(let i=0;i<90;i++){KT.step(1);if(YL.lookingBack())any++}K.KeyA=false;
  return{ok:any===0&&x1-x0>4.5*TS,detail:`true 的幀數=${any} 往東走了 ${f2((x1-x0)/TS)} 格`}});
T('回頭：滑鼠停在畫面下方 1.3 秒後，P.face 在 0.5 秒內回到前方 ±10°',()=>{fresh();YLT.place(10.5,104);KT.step(2);const m=KT.mouse;m.active=true;m.fx=.5;m.fy=.97;KT.step(1);const fBack=P().face,bk0=YL.lookingBack();KT.step(77);const bk=YL.lookingBack();
  let n=0;while(n<30&&deg(angDiff(P().face,F))>=10){KT.step(1);n++}const off=deg(angDiff(P().face,F));m.active=false;
  return{ok:deg(angDiff(fBack,Math.PI/2))<20&&bk&&n<=30&&off<10,detail:`指著下方時 face=${f2(deg(fBack))}°，1.3 秒時回頭=${bk}；再過 ${f2(n/60)} 秒回到前方，偏 ${f2(off)}°`}});
// --- 4. 念佛
T('念佛：佛珠 3→2；0.8 秒內位移 < 1 px；之後可以走',()=>{fresh();YLT.place(10.5,104);KT.step(2);const b0=YL.trip.beads;K.KeyW=true;const x0=P().x,y0=P().y;YLT.press('Space');const b1=YL.trip.beads,said=KT.G.bubbles.some(b=>b.text==='阿彌陀佛');
  KT.step(48);const d=Math.hypot(P().x-x0,P().y-y0),act=YL.act;KT.step(6);const d2=Math.hypot(P().x-x0,P().y-y0);K.KeyW=false;YLT.release('Space');
  return{ok:b0===3&&b1===2&&said&&d<1&&!act&&d2>3,detail:`佛珠 ${b0}→${b1} 泡泡=${said} 0.8 秒位移=${f2(d)} px 之後 0.1 秒位移=${f2(d2)} px`}});
T('念佛：佛珠 0 顆時按下沒有作用',()=>{fresh();YLT.place(10.5,104);for(let i=0;i<3;i++){tap('Space');step(.85)}const b=YL.trip.beads;tap('Space');const act=YL.act,said=KT.G.bubbles.some(x=>x.text==='（佛珠用完了）');
  K.KeyW=true;const y0=P().y;KT.step(6);const mv=y0-P().y;K.KeyW=false;return{ok:b===0&&YL.trip.beads===0&&!act&&said&&mv>3,detail:`用完後=${b} 再按：佛珠=${YL.trip.beads} 動作=${act&&act.verb} 泡泡=${said} 還能走=${f2(mv)} px`}});
// --- 5. the walk
/* setup only (judge A2): this is the trip that completes the night, so dawn follows it */
T('機器人照日常動作走完第一夜正常趟：G.t 28–45 秒',()=>{fresh(1,777);YL_RUN.S.streak=YL_RUN.need()-1;const G=KT.G,t0=G.t,W=[[12.2,113.5,'READ'],[10.5,70],[11.4,65.8,'BOW'],[10.5,52],[9.6,46.6,'DELIVER'],[10.5,7]];
  let i=0,f=0,labels=[],tInc=null,tEnd=null;
  while(f++<60*90){const Tr=YL.trip;if(YL.card&&YL.card.kind==='dawn'){tEnd=G.t-t0;break}if(Tr.phase==='fail')break;if(Tr.phase==='incense'&&tInc==null)tInc=G.t-t0;
    const w=W[i];if(w&&!YL.act&&Tr.phase!=='incense'){const dx=w[0]-P().x/TS,dy=w[1]-P().y/TS,e=w[2]?.08:.3;K.KeyW=dy<-e;K.KeyS=dy>e;K.KeyA=dx<-e;K.KeyD=dx>e;
      if(Math.abs(dx)<=e&&Math.abs(dy)<=e){up();if(!w[2])i++;else if(Tr.done[w[2]])i++;else{const it=KT.interactTarget();if(it){labels.push(it.label);tap('KeyE')}}}}else up();
    KT.step(1)}up();const d=YL.trip&&YL.trip.done;
  return{ok:tEnd!=null&&tEnd>=28&&tEnd<=45&&labels.join()==='拿月曆,拜土地公,投月曆',detail:`走到靈堂 ${f2(tInc)} 秒，天亮 ${f2(tEnd)} 秒；按過的提示=${labels.join('、')} 完成=${JSON.stringify(d)}`}});
T('日常動作：提示文字每一夜都照樣出現（第二夜也有「拜土地公」「投月曆」）',()=>{fresh(2);walk();const at=(x,y)=>{YLT.place(x,y);KT.step(1);const it=KT.interactTarget();return it&&it.label};
  const a=at(11.4,65.8),b=at(9.6,46.6);fresh(2);YLT.place(12.2,113.5);KT.step(1);const c=(KT.interactTarget()||{}).label;return{ok:a==='拜土地公'&&b==='投月曆'&&c==='拿月曆',detail:`${c}／${a}／${b}`}});
T('讀月曆：放大 2 秒不能動，0.6 秒後再按 E 可以收起；之前按沒用',()=>{fresh();YLT.place(12.2,113.5);KT.step(1);tap('KeyE');KT.step(1);const a=YL.act&&YL.act.verb,on=YL.calOn;K.KeyW=true;const y0=P().y;KT.step(19);tap('KeyE');const still=!!YL.act;KT.step(20);tap('KeyE');KT.step(2);
  const done=YL.trip.done.READ,ph=YL.trip.phase;KT.step(10);const moved=y0-P().y;K.KeyW=false;return{ok:a==='READ'&&on&&still&&done&&ph==='walk'&&moved>3,detail:`動作=${a} 月曆開=${on} 0.33 秒按 E 還開著=${still} 0.7 秒按 E 收起後 READ=${done} phase=${ph} 之後走了 ${f2(moved)} px`}});
T('讀月曆前走到 y<96 被輕輕擋住、冒泡泡，不算錯',()=>{fresh();YLT.place(10.5,97);K.KeyW=true;step(1.5);K.KeyW=false;const y=P().y/TS,said=KT.G.bubbles.some(b=>b.text==='月曆還沒拿。');
  return{ok:y>=96&&said&&YL.trip.phase==='ready'&&!YL.trip.fail,detail:`y=${f2(y)} 泡泡=${said} phase=${YL.trip.phase}`}});
// --- 6. failing
T('失敗演出：判錯到能移動 ≤ 2.5 秒；魄在失敗點 0.5 格內；同一趟只判一次',()=>{fresh();YL.slips.clear();walk();YLT.place(10.5,80);KT.step(2);const G=KT.G,fx=P().x/TS,fy=P().y/TS;
  const ok1=YL.ctx.fail({id:'y_test',reason:'did',style:'quiet',x:fx,y:fy,at:[12.5,79]}),ok2=YL.ctx.fail({id:'y_other'}),t0=G.t,ph=YL.trip.phase,dark=G.darkUntil>G.t;
  KT.step(30);const camOn=Math.abs(YL.cam(BW,BH).x+BW/2-12.5*TS)<1;KT.step(30);const black=YL.blackA();K.KeyW=true;let tm=null;
  for(let i=0;i<60*4&&tm==null;i++){KT.step(1);if(YL.trip.n===2&&P().y<113.5*TS-.1)tm=G.t-t0}K.KeyW=false;const po=YL.po.slice(),d=po[0]?Math.hypot(po[0].x-fx,po[0].y-fy):99,N=YL_RUN.nightRec();
  return{ok:ok1&&!ok2&&ph==='fail'&&dark&&camOn&&black===1&&tm!=null&&tm<=2.5&&po.length===1&&d<=.5&&N.fails.length===1&&N.fails[0].id==='y_test',
    detail:`第二次 fail 被擋=${!ok2} 熄燈=${dark} 0.5 秒鏡頭在出錯處=${camOn} 1.0 秒黑=${black} 能移動=${f2(tm)} 秒 魄=${JSON.stringify(po)} 離失敗點 ${f2(d)} 格 記錄=${JSON.stringify(N.fails)}`}});
T('失敗演出：同一處（1.5 格內）不再放魄；換地方才加；同一句阿嬤的話第二次只停 0.6 秒',()=>{fresh();YL.slips.clear();const G=KT.G,failAt=(x,y)=>{walk();YLT.place(x,y);KT.step(2);const t0=G.t;YL.ctx.fail({id:'y_test',reason:'did',style:'quiet',x,y});let t=null;for(let i=0;i<60*4;i++){KT.step(1);if(YL.trip.fail==null){t=G.t-t0;break}}return t};
  const a=failAt(10.5,80),b=failAt(11.3,80.6),n1=YL.po.length,c=failAt(10.5,74),n2=YL.po.length;
  return{ok:n1===1&&n2===2&&b<a-.3,detail:`第 1 次 ${f2(a)} 秒、第 2 次（同一句）${f2(b)} 秒、魄 ${n1}→${n2}`}});
T('失敗演出：撲臉型設 G.flash、撲臉從出錯的東西那裡來',()=>{fresh();walk();YLT.place(10.5,26);KT.step(2);YL.ctx.fail({id:'y_girl',reason:'moved',style:'lunge',face:'girl',x:10.5,y:26,at:[12.5,22.5]});const G=KT.G,fl=G.flash&&G.flash.type;KT.draw();
  const o=YL.lungeOrigin('girl'),ex=(12.5*TS-CAM.x)*CAM.k;return{ok:fl==='girl'&&Array.isArray(o)&&o.length===3&&Math.abs(o[0]-ex)<1,detail:`flash=${fl} origin=${o&&o.map(Math.round)} 預期 x=${Math.round(ex)}`}});
if(W2)T('失敗演出（接上 W2）：背後型的撲臉從玩家背後 2 格來',()=>{fresh();walk();YLT.place(10.5,88);KT.step(2);YL.ctx.fail({id:'y_call',reason:'looked',style:'lunge',face:'voice',x:10.5,y:88,at:[10.5,90.5]});KT.draw();
  const o=YL.lungeOrigin('voice'),ey=(P().y+2*TS-14-CAM.y)*CAM.k;return{ok:Math.abs(o[1]-ey)<1,detail:`origin y=${Math.round(o[1])} 預期=${Math.round(ey)}`}});
// --- 8. inputs that do nothing on the road
T('夜路裡 F、G、Q、R、1–5、Shift、滑鼠左鍵、滾輪都沒有作用',()=>{fresh();walk();YLT.place(10.5,90);KT.step(2);const G=KT.G,cv=document.getElementById('cv'),sel=G.sel,seed=G.seed;
  for(const c of['KeyF','KeyG','KeyQ','KeyR','Digit1','Digit2','Digit3','Digit4','Digit5']){YLT.press(c);KT.step(2);YLT.release(c);KT.step(1)}
  cv.dispatchEvent(new MouseEvent('mousedown',{button:0,clientX:640,clientY:300,bubbles:true}));KT.step(2);cv.dispatchEvent(new WheelEvent('wheel',{deltaY:120,bubbles:true,cancelable:true}));KT.step(2);
  K.ShiftLeft=true;K.KeyW=true;KT.step(30);const run=P().run,sp=YL.speed();K.ShiftLeft=false;K.KeyW=false;K.Space=true;KT.step(10);const hold=P().holding;K.Space=false;
  const inv=Object.values(G.inv).every(v=>v===0);
  return{ok:KT.G===G&&G.proj.length===0&&inv&&G.sceneId==='yelu'&&G.yelu&&G.over==null&&!run&&!hold&&G.sel===sel&&G.seed===seed&&sp<3.9,
    detail:`proj=${G.proj.length} inv=${JSON.stringify(G.inv)} scene=${G.sceneId} 換局=${KT.G!==G||G.seed!==seed} 跑=${run} 速度=${f2(sp)} 格/秒 屏息=${hold} sel ${sel}→${G.sel}`}});
// --- the rest of W1: camera rules, ctx, nights
T('鏡頭：路中心置中；離中心超過 2 格才跟；站定 0.6 秒後 1 秒內前推 2 格，一走 0.5 秒內收回',()=>{fresh();walk();YLT.place(10.5,90);KT.step(2);const cx=()=>YL.cam(BW,BH).x+BW/2;
  const c0=cx()-10.5*TS;YLT.place(12,90);KT.step(1);const c1=cx()-10.5*TS;YLT.place(14,90);KT.step(1);const c2=(P().x-cx())/TS;
  YLT.place(10.5,90);KT.step(30);const p0=YL.st.push;KT.step(66);const p1=YL.st.push/TS;K.KeyW=true;KT.step(31);const p2=YL.st.push;K.KeyW=false;
  return{ok:Math.abs(c0)<.01&&Math.abs(c1)<.01&&Math.abs(c2-2)<.01&&p0===0&&Math.abs(p1-2)<.01&&p2===0,detail:`置中偏 ${c0} px；離中心 1.5 格時鏡頭偏 ${c1} px；離 3.5 格時玩家離鏡頭中心 ${f2(c2)} 格；站定 0.5 秒推 ${p0}、1.6 秒推 ${f2(p1)} 格、走 0.52 秒後 ${p2}`}});
T('ctx：lateral、onShoulder、crouched、speed、seg、onScreen、rng 決定性',()=>{fresh(1,31);walk();YLT.place(8.5,85.5);KT.step(12);const c=YL.ctx,a=[f2(c.lateral()),c.onShoulder(),c.crouched(),f2(c.speed()),c.seg,c.onScreen(8.5,82),c.onScreen(8.5,60)];
  tap('KeyC');KT.step(1);const cr=c.crouched();tap('KeyC');const r1=[c.rng(),c.rng()];fresh(1,31);const r2=[YL.ctx.rng(),YL.ctx.rng()];
  return{ok:a[0]===-2&&a[1]&&!a[2]&&a[3]===0&&a[4]==='S2'&&a[5]&&!a[6]&&cr&&r1[0]===r2[0]&&r1[1]===r2[1],detail:`${JSON.stringify(a)} 蹲=${cr} rng=${r1.map(f2)}`}});
/* spec change (judge A2): a night needs 3 trips in a row; a cleared trip short of that shows 「天猶未光。」 and starts the next one */
const clearTrip=()=>{walkAll();YLT.place(10.5,10.3);K.KeyW=true;KT.step(20);K.KeyW=false};
T('一趟走完但未滿 3 趟：上香 1.2 秒 →「天猶未光。」1.2 秒 → 同一夜下一趟；存檔 streak+1，不寫試玩紀錄',()=>{fresh(1,55);const n0=JSON.parse(localStorage.getItem('kaidan-plays')||'[]').length;clearTrip();const ph=YL.trip.phase;
  step(1.25);const card=YL.card&&YL.card.kind,txt=document.getElementById('ylcard').textContent,sv=JSON.parse(localStorage.getItem('kaidan-yelu'));step(1.3);const s=YLT.state(),plays=JSON.parse(localStorage.getItem('kaidan-plays')||'[]');
  return{ok:ph==='incense'&&card==='wait'&&txt.includes('天猶未光')&&s.night===1&&s.n===2&&!s.card&&sv.streak===1&&sv.trip===2&&sv.night===1&&plays.length===n0,detail:`${ph}→${card}「${txt}」→第${s.night}夜第${s.n}趟 存檔 streak=${sv.streak} trip=${sv.trip} 紀錄 ${n0}→${plays.length}`}});
T('第 3 趟走完：上香 1.2 秒 → 天亮卡 1.5 秒 → 第二夜第 1 趟；寫一筆 kind:yelu 試玩紀錄；streak、met 歸零',()=>{fresh(1,55);YL_RUN.S.streak=2;YL_RUN.S.met=['y_girl'];const n0=(KT.G&&JSON.parse(localStorage.getItem('kaidan-plays')||'[]').length);clearTrip();const ph=YL.trip.phase;
  step(1.25);const card=YL.card&&YL.card.kind;step(1.6);const s=YLT.state(),plays=JSON.parse(localStorage.getItem('kaidan-plays')||'[]'),last=plays[plays.length-1],sv=JSON.parse(localStorage.getItem('kaidan-yelu'));
  return{ok:ph==='incense'&&card==='dawn'&&s.night===2&&s.n===1&&KT.G.sceneId==='yelu'&&plays.length===n0+1&&last.kind==='yelu'&&last.n===1&&sv.night===2&&sv.trip===1&&sv.streak===0&&sv.met.length===0,detail:`${ph}→${card}→第${s.night}夜第${s.n}趟 紀錄=${JSON.stringify(last)} 存檔 night=${sv.night} streak=${sv.streak} met=${JSON.stringify(sv.met)}`}});
T('連走 3 趟與歸零：走完 2 趟後失敗 → streak 歸 0（失敗當下就存檔）；之後要再連走 3 趟才天亮',()=>{fresh(1,57);const G=KT.G,log=[];
  for(let i=0;i<2;i++){clearTrip();step(2.6)}log.push(YL_RUN.S.streak);walk();YLT.place(10.5,80);KT.step(2);YL.ctx.fail({id:'y_test',reason:'did',style:'quiet',x:10.5,y:80});KT.step(1);const sv=JSON.parse(localStorage.getItem('kaidan-yelu'));log.push(sv.streak);step(2.6);
  const cards=[];for(let i=0;i<3;i++){clearTrip();step(1.25);cards.push(YL.card&&YL.card.kind);step(1.6)}const s=YLT.state();
  return{ok:log[0]===2&&log[1]===0&&sv.trip===4&&cards.join()==='wait,wait,dawn'&&s.night===2,detail:`走 2 趟 streak=${log[0]} 失敗後存檔 streak=${log[1]} trip=${sv.trip}；再走 3 趟的卡=${cards.join()} → 第${s.night}夜`}});
T('一局：第三夜第 3 趟走完是結束卡，存檔 done:true，R 再走一次會開新局',()=>{fresh(3,56);YL_RUN.S.streak=2;walkAll();YLT.place(10.5,10.2);K.KeyW=true;KT.step(20);K.KeyW=false;step(3.4);const card=YL.card&&YL.card.kind,sv=JSON.parse(localStorage.getItem('kaidan-yelu')),G0=KT.G,txt=document.getElementById('ylcard').textContent;
  YLT.press('KeyR');YLT.release('KeyR');KT.step(1);const s=YLT.state(),sv2=JSON.parse(localStorage.getItem('kaidan-yelu'));
  return{ok:card==='end'&&sv.done===true&&txt.includes('頭七還沒到')&&txt.includes('多半是這個遊戲編的')&&KT.G!==G0&&s.night===1&&s.n===1&&sv2.done===false&&sv2.seed!==sv.seed,detail:`card=${card} done=${sv.done} 「${txt.slice(0,40)}」 → 再走一次：第${s.night}夜第${s.n}趟 新種子=${sv2.seed!==sv.seed}`}});
/* judge A3: the night card stays; no close in its first 0.6 s, whatever the input */
T('夜卡：10 秒後還開著；0.5 秒內點兩下、按 Enter 都關不掉；0.6 秒後點一下才關',()=>{fresh();YL.openCard('night',YL_RUN.cardData(1));step(10);const open10=YL.card&&YL.card.kind;
  YL.closeCard();YL.openCard('night',YL_RUN.cardData(1));const c=document.getElementById('ylcard');KT.step(6);c.dispatchEvent(new MouseEvent('click',{bubbles:true}));KT.step(12);c.dispatchEvent(new MouseEvent('click',{bubbles:true}));
  YLT.press('Enter');YLT.release('Enter');const early=YL.card&&YL.card.kind,vis=!c.hidden;KT.step(20);c.dispatchEvent(new MouseEvent('click',{bubbles:true}));const late=YL.card&&YL.card.kind;
  return{ok:open10==='night'&&early==='night'&&vis&&!late&&c.hidden,detail:`10 秒=${open10} 0.3 秒內點兩下＋Enter 後=${early} 卡片顯示=${vis} 0.63 秒點一下=${late}`}});
T('按住空白鍵：自動重複的 keydown 不念佛、不扣佛珠',()=>{fresh();walk();YLT.place(10.5,100);KT.step(2);const b0=YL.trip.beads;for(let i=0;i<5;i++){dispatchEvent(new KeyboardEvent('keydown',{code:'Space',repeat:true,bubbles:true}));KT.step(2)}YLT.release('Space');
  return{ok:b0===3&&YL.trip.beads===3&&!YL.act,detail:`佛珠 ${b0}→${YL.trip.beads} 動作=${YL.act&&YL.act.verb}`}});
T('夜路不用左 Ctrl 蹲（C 照樣蹲）',()=>{fresh();walk();YLT.place(10.5,100);KT.step(2);tap('ControlLeft');KT.step(1);const a=P().crouch;tap('KeyC');KT.step(1);const b=P().crouch;tap('KeyC');return{ok:!a&&b,detail:`Ctrl 後蹲=${a} C 後蹲=${b}`}});
/* judge A7: a save of the wrong shape starts a new run instead of throwing */
T('存檔欄位檢查：缺欄位、型別錯的存檔 load() 都回 null；舊存檔沒有 streak/met 照讀',()=>{const bad=[{v:1,night:2,seed:7},{v:1,night:2,seed:7,trip:3,po:[],nights:null,hist:[]},{v:1,night:1.5,seed:7,trip:1,po:[],nights:[],hist:[]},{v:1,night:1,seed:NaN,trip:1,po:[],nights:[],hist:[]},{v:1,night:1,seed:7,trip:0,po:[],nights:[],hist:[]},{v:1,night:1,seed:7,trip:1,po:[{x:'a'}],nights:[],hist:[]},{v:1,night:1,seed:7,trip:1,po:[],nights:[{n:1}],hist:[]},{v:1,night:4,seed:7,trip:1,po:[],nights:[],hist:[]},{v:1,night:1,seed:7,trip:1,po:[],nights:[],hist:[],met:'x'}];
  const k='kaidan-yelu',keep=localStorage.getItem(k),r=bad.map(b=>{localStorage.setItem(k,JSON.stringify(b));return YL_RUN.load()});localStorage.setItem(k,JSON.stringify({v:1,seed:7,night:2,trip:3,po:[],nights:[{n:1,trips:2,fails:[],secs:9}],hist:[],done:false}));const old=YL_RUN.load();
  if(keep==null)localStorage.removeItem(k);else localStorage.setItem(k,keep);return{ok:r.every(x=>x===null)&&old&&old.streak===0&&Array.isArray(old.met)&&old.met.length===0&&old.night===2,detail:`壞存檔 ${r.map(x=>x===null?'null':'讀進來').join(',')}；舊存檔 streak=${old&&old.streak} met=${old&&JSON.stringify(old.met)}`}});
if(W2)T('主角保證：第二夜第一趟死在土地公（y_jisi）→ 第二趟還是有冥婚',()=>{fresh(2,4242);YL.forced=null;YL.beginTrip();const p1=YL.trip.picks.map(p=>p.id).join();walk();YLT.place(11.4,65.8);KT.step(2);const it=KT.interactTarget();if(it)it.fn();KT.step(80);const f=YL.trip.fail&&YL.trip.fail.id;step(2.6);
  const p2=YL.trip.picks.map(p=>p.id);return{ok:p1==='y_ghostwed'&&f==='y_jisi'&&YL.trip.n===2&&p2.includes('y_ghostwed'),detail:`第 1 趟=${p1} 死於=${f} 第 2 趟=${p2.join()} met=${JSON.stringify(YL_RUN.S.met)}`}});
T('W2/W3 是空殼或接上都不報錯：跑 300 幀＋畫圖，KT.err 是空的',()=>{fresh();walk();K.KeyW=true;for(let i=0;i<300;i++){KT.step(1);if(i%5===0)KT.draw()}K.KeyW=false;return{ok:!KT.err,detail:`err=${KT.err||null} y=${f2(P().y/TS)}`}});
if(W2)T('整合 W2：第一夜第一趟照 pick 抽到紅衣小女孩；站住過關（消音 0.8 秒＋淡入＋靜止 3 秒），之後走到靈堂',()=>{up();YLT.start(1,808,1);YL.forced=null;YL.beginTrip();const picks=YL.trip.picks.map(p=>p.id).join();walk();YL.trip.done.BOW=YL.trip.done.DELIVER=true;
  YLT.place(10.5,30);K.KeyW=true;let f=0;while(f++<600&&!YL.trip.anoms.some(a=>a.state!=='idle'))KT.step(1);K.KeyW=false;step(4.6);const v=YL.trip.anoms[0]&&YL.trip.anoms[0].verdict;
  K.KeyW=true;f=0;while(f++<60*12&&YL.trip.phase==='walk')KT.step(1);K.KeyW=false;return{ok:picks==='y_girl'&&v==='pass'&&YL.trip.phase!=='fail',detail:`picks=${picks} verdict=${v} phase=${YL.trip.phase} fail=${JSON.stringify(YL.trip.fail&&YL.trip.fail.id)}`}});
if(W2)T('整合 W2：紅衣小女孩出現後繼續走 → 撲臉 girl、阿嬤的話、魄留在那裡、第 2 趟',()=>{up();YLT.start(1,809,1);YL.forced=null;YL.beginTrip();walk();YL.trip.done.BOW=YL.trip.done.DELIVER=true;YLT.place(10.5,30);K.KeyW=true;let f=0;
  while(f++<600&&YL.trip.phase==='walk')KT.step(1);const fl=KT.G.flash&&KT.G.flash.type,F0=YL.trip.fail&&{...YL.trip.fail};K.KeyW=false;let slip='';const s0=YL_UI.slip;YL_UI.slip=(zh,tw,ms,d)=>{slip=zh;return s0(zh,tw,ms,d)};step(2.6);YL_UI.slip=s0;
  const po=YL.po[0];return{ok:fl==='girl'&&F0&&F0.id==='y_girl'&&slip.includes('紅衣')&&po&&Math.hypot(po.x-F0.x,po.y-F0.y)<=.5&&YL.trip.n===2,detail:`flash=${fl} fail=${F0&&F0.id}/${F0&&F0.reason} slip=${slip} 魄=${JSON.stringify(po)} 趟=${YL.trip.n}`}});
up();return R})()
