/* ===================================================================== 夜路 (W1) — the road, the camera, the player's verbs, a trip.
   Interface (see scratchpad spec §9.3). Only the hooks call into YL, and only while G.yelu is true. ===================================================================== */
/* YL — 夜路執行期（W1）。只有掛勾會呼叫，而且只在 G.yelu 為真時。座標：世界像素；「格」= 像素/TS。
 YL.SEG  [{id:'S1',name:'村口',y0:96,y1:117},{id:'S2',name:'電線桿路',y0:74,y1:95},
          {id:'S3',name:'土地公廟',y0:56,y1:73,spot:[12.5,65.8],verb:'BOW',deadline:62.5},
          {id:'S4',name:'阿嬤的三合院',y0:34,y1:55,spot:[8.5,46.6],verb:'DELIVER',deadline:44.5},
          {id:'S5',name:'竹林路口',y0:12,y1:33},{id:'END',name:'靈堂',y0:0,y1:11}]   y0..y1 為格，含端點
 YL.FIX  [{id,kind,seg,x,y,variant,base}]   x,y 為格中心。kind/variant 清單：
          truckbed:normal|glow  sign:normal  ditch:normal  pole:normal|transformer  lamp:off|lit
          shrine:normal|turned  door4:plain|wedding  lintel:redpaper  ama:normal|tail  mailbox:normal
          candle:normal  mirror:normal|empty  tent:normal（遺照、香案、白燭、銀紙桶、嚴制、淑芬）
 YL.update(dt)               取代 update()：讀輸入、updPlayer(dt)、覆寫 P.face、回頭計時、念佛／日常動作計時、
                             建 YL.ctx、呼叫 YL_RULES.judge(ctx,dt)、推進 fx/bubbles/noises/shake/scare/flash、趟狀態機
 YL.cam(vw,vh) -> {x,y}      鏡頭左上角目標（第 3.3 節）
 YL.key(code,e)              KeyE→interact()；KeyC→crouch()（夜路不用左 Ctrl：Windows 上 Ctrl+W 會關分頁）；Space→念佛；Tab→放大月曆；其他忽略
 YL.interact(P) -> {label,x,y,fn}|null   車斗「拿月曆」、廟「拜土地公」、信箱「投月曆」；動作中或演出中回傳 null
 YL.ents(ents,inView)        推入固定細節、作用中的不對勁、魄：{y:排序用的y, d:()=>YL_ART.fixture(f,ctx)…}
 YL.light(c)                 轉呼 YL_ART.light(c,YL.ctx)
 YL.over(bx)                 轉呼 YL_ART.over(bx,YL.ctx)
 YL.lungeOrigin(type) -> [sx,sy,h]|null   失敗點的螢幕座標；背後型回傳玩家背後 2 格
 YL.hud(dt)                  轉呼 YL_UI.hud({night,cal,beads,trip,hint}) 和 UI.tickSubs(dt)
 YL.ctx                      本幀的 YLCtx（見下）
 YL.trip                     {phase:'ready'|'walk'|'fail'|'incense'|'cleared', night, n, seed, anoms:[inst],
                              done:{READ,BOW,DELIVER}, beads, t, fail:null|{id,reason,seg,x,y,t}}
 YL.lookingBack() -> bool    第 5.2 節的回頭判定：只看刻意的視線（滑鼠指向背後、按住「回頭」），連續 0.5 秒；倒退走不算
 W1 補充（實作後的確切行為）：
 - FIX 另有：ditch 的 y0,y1（整條水溝的格範圍）；sy（排序用 y，像素，可省略）。魄 YL.po 與 inst 的 x,y 都是「格」。
 - trip.picks=[{id,seg}]（這一趟抽到的）；trip.bowAt＝拜完的 G.t（油燈亮一下用）；trip.hintAt＝念佛提示開始的 G.t。
 - ctx.act＝進行中的動作 {verb:'READ'|'BOW'|'DELIVER'|'NIANFO',t,dur}|null（W3 畫手上的香、合掌）。
 - hud 的 hint：'first'（第一夜第一趟還沒拿月曆，顯示按鍵提示）|'nianfo'（佛珠和念佛鍵閃 2.5 秒）|null。
 - 動作完成的那一幀只設 ctx.did／ctx.nianfoDone，由 judge 自己轉呼 onVerb／onNianfo（W2 約定）；judge 只在 walk 階段呼叫。
 - fail(f)：f.x,f.y＝玩家當下格座標（魄放這裡），f.at=[x,y]＝出錯的東西（鏡頭停這裡、撲臉從這裡來），f.slip 有給就直接用。
 - 阿嬤走近時的話、第一夜第一趟的兩句提醒、投完月曆後的念佛教學，都由 judge 說；W1 只說「土地公保庇。」、收音機、淑芬、魄。
 - #ylcard、#ylslip 由 W1 在時間到或跳過時設 hidden；YL_UI.card／slip 只要負責顯示內容。
 - 夜卡不自動翻走；任何卡片要開了 0.6 秒（G.t）才收玩家的關卡動作（YL.cardReady）。卡片種類另有 'wait'（「天猶未光。」1.2 秒，連走未滿 need 趟時）。
 - 一夜要連續走對 YL_RUN.need() 趟（3）才天亮；hud 另收 streak、need、near（附近有互動點：手機「互動」鍵發亮）。
*/
/* YLCtx — W1 每幀建立；W2 判定、W3 畫圖只透過它讀世界
 P, t（這一趟的秒數）, dt, TS, night, trip, cal:{yi:[],ji:[]}, seg:'S1'..'END'
 tileX(), tileY()            玩家所在格座標（小數）
 lateral()                   離中心線的格數（東為正）
 speed()                     最近 0.15 秒平均速度（格/秒）
 crouched()  onShoulder()    第 5.2 節
 lookingBack()
 nianfoDone                  這一幀剛念完佛
 did                         這一幀剛完成的日常動作：'READ'|'BOW'|'DELIVER'|'INCENSE'|null
 fix(id) / setVariant(id,v)  讀、改固定細節
 onScreen(x,y,m)  dist(x,y)  格座標的點是否在畫面內、離玩家幾格
 say(text,x,y,life)  sub(text)   泡泡、字幕
 cue(kind,x,y,o)             YL_SND.at(kind,x,y,o)
 hush(sec)                   YL_SND.hush(sec)
 pass(inst)                  只在 pending 時生效：響磬、inst.verdict='pass'
 fail({id,reason,style:'lunge'|'quiet',face,x,y,sound})   只在這一趟還沒失敗時生效；W1 統一演出第 7.1 節
 rng()                       這一趟專用的決定性亂數
*/
SCENES.yelu={name:'夜路',w:21,h:120,night:9999,survivorCount:0,itemCount:0,yelu:true,walkK:.8,viewH:10.5,
  start:[11.5,113.5],altar:{x:-999,y:-999},lanterns:[],lamps:[],houses:[[13,98,17,102],[3,39,8,44]],temple:null,cabinets:[],hays:[],trees:[],survivors:[],items:[],dogs:[],clues:[],spawns:{},truck:[13.5*TS,112*TS],
  build(R,set){const house=houseBuilder(R,set);R(0,0,1,119,'T');R(19,0,20,119,'T');R(0,0,20,0,'T');R(0,118,20,119,'T');R(9,1,11,117,'r');R(13,111,14,112,'V');
    house(13,98,17,102,[[13,102],[14,102]]);house(3,39,8,44,[[6,44],[7,44]]);R(3,45,8,48,'s');
    R(3,12,7,33,'b');R(13,12,17,33,'b');R(13,20,16,21,'.')},   /* the bamboo path is only scenery: x17 stays bamboo */
  /* the village auto-decor would plant a pole every 6 tiles along this road and litter scooters around the houses, so the road brings its own */
  decor(){const items=[],add=(x,y,spr,o)=>items.push(Object.assign({x,y,spr},o)),wires=[];
    add(tc(7),105*TS-2,DSPR.kiosk(),{solid:[13,6]});add(tc(7)-14,105*TS-3,DSPR.chair(0));add(tc(6),107*TS-2,DSPR.phone(),{solid:[4,3]});
    add((13+17+1)*TS/2,103*TS-WALLH+2,DSPR.shopsign(),{sy:103*TS+.4});
    /* wires hang from the cross-arm of a DSPR.pole-sized pole (45 px above its foot), the same sag as the village lines */
    const tops=YL.FIX.filter(f=>f.kind==='pole').map(f=>({x:Math.round(f.x*TS),y:(Math.floor(f.y)+1)*TS-3-45})).sort((a,b)=>a.y-b.y);
    for(let i=1;i<tops.length;i++){const a=tops[i-1],b=tops[i];for(const o of[-4,4]){const ax=a.x+o,ay=a.y,by=b.y,len=by-ay,sag=5+len*.04,c=mk(3,len+sag+4|0),g=c.getContext('2d');g.fillStyle='#0c0c0e';
      for(let k=0;k<=len;k++){const s=k/len;g.fillRect(1,Math.round(len*s+sag*4*s*(1-s))+1,1,1)}wires.push({c,x:ax-1,y:ay-1})}}
    return{items,wires,emit:[]}},
  setup(G,opts){YL.reset()}};
const YL={X0:10.5,BED:[13.5,113.6],
  SEG:[{id:'S1',name:'村口',y0:96,y1:117},{id:'S2',name:'電線桿路',y0:74,y1:95},
    {id:'S3',name:'土地公廟',y0:56,y1:73,spot:[12.5,65.8],verb:'BOW',deadline:62.5},
    {id:'S4',name:'阿嬤的三合院',y0:34,y1:55,spot:[8.5,46.6],verb:'DELIVER',deadline:44.5},
    {id:'S5',name:'竹林路口',y0:12,y1:33},{id:'END',name:'靈堂',y0:0,y1:11}],
  FIX:(()=>{const F=(id,kind,seg,x,y,base,o)=>Object.assign({id,kind,seg,x,y,base,variant:base},o);
    return[F('truckbed','truckbed','S1',13.5,113.2,'normal'),F('sign','sign','S1',8.5,97.5,'normal'),F('ditch','ditch','S2',13.5,84.5,'normal',{y0:74,y1:95,sy:0}),
      ...[93,89,85,81,77].map((y,i)=>F('pole'+(i+1),'pole','S2',8.5,y+.5,i===4?'transformer':'normal')),F('lamp','lamp','S2',12.5,86.5,'off'),
      F('shrine','shrine','S3',12.5,64.5,'normal'),
      F('door4','door4','S4',7,44.5,'plain',{sy:45*TS+.1}),F('lintel','lintel','S4',7,44.2,'redpaper',{sy:45*TS+.2}),   /* drawn on the front wall, so after it */
      F('ama','ama','S4',7.5,47.5,'normal'),F('mailbox','mailbox','S4',8.5,46.5,'normal'),F('candle','candle','S4',8.5,47.5,'normal'),
      F('mirror','mirror','S5',12.5,21.5,'normal'),F('tent','tent','END',10.5,5.5,'normal',{sy:9*TS})]})(),
  ctx:null,trip:null,act:null,card:null,st:null,view:null,po:[],poSaid:false,secs:0,forced:null,calOn:false,peekUntil:0,slips:new Set(),spk:new Map(),
  reset(){Object.assign(YL,{ctx:null,trip:null,act:null,card:null,st:null,calOn:false,peekUntil:0});YL.spk.clear();for(const f of YL.FIX)f.variant=f.base},
  snd(k,...a){const f=YL_SND[k];if(typeof f==='function')f.apply(YL_SND,a)},   /* sound names the rules pass along may not exist yet */
  fix(id){return YL.FIX.find(f=>f.id===id)||null},
  segAt(ty){const y=Math.floor(ty);return(YL.SEG.find(s=>y>=s.y0&&y<=s.y1)||YL.SEG[y>117?0:5]).id},
  speed(){const s=YL.st;if(!s)return 0;let d=0;for(const e of s.h)if(e.t>G.t-.15+1e-6)d+=e.d;return d/.15/TS},
  lookingBack(){return!!(YL.st&&YL.st.back)},
  /* one speaker per spot, so a new line from the same place replaces the old bubble instead of stacking on it */
  speaker(x,y){const k=x+','+y;let e=YL.spk.get(k);if(!e){e={x:x*TS,y:y*TS};YL.spk.set(k,e)}return e},
  mkCtx(T){const P=G.player,X0=YL.X0,c={P,t:0,dt:0,TS,night:T.night,trip:T,cal:T.cal,seg:'S1',nianfoDone:false,did:null,act:null,
    tileX:()=>P.x/TS,tileY:()=>P.y/TS,lateral:()=>P.x/TS-X0,speed:()=>YL.speed(),crouched:()=>!!P.crouch,
    onShoulder:()=>{const l=Math.abs(P.x/TS-X0);return l>=1.6&&l<=4},lookingBack:()=>YL.lookingBack(),
    fix:id=>YL.fix(id),setVariant:(id,v)=>{const f=YL.fix(id);if(f)f.variant=v},
    /* the ideal camera, not CAM: CAM only moves when a frame is drawn, and judging must not depend on drawing */
    onScreen:(x,y,m)=>{const v=YL.view||{x:0,y:0,w:BW,h:BH},k=(m||0)*TS;return x*TS>=v.x-k&&x*TS<=v.x+v.w+k&&y*TS>=v.y-k&&y*TS<=v.y+v.h+k},
    dist:(x,y)=>Math.hypot(x-P.x/TS,y-P.y/TS),
    say:(text,x,y,life)=>bubble(x==null?P:YL.speaker(x,y),text,'voice',life||2.6),sub:text=>UI.sub(text,'omen'),
    cue:(k,x,y,o)=>YL_SND.at(k,x,y,o||{}),hush:s=>YL_SND.hush(s),
    pass:inst=>{if(!inst||inst.verdict!=='pending'||T.fail)return false;inst.verdict='pass';YL.snd('qing');return true},
    fail:f=>YL.fail(f),rng:mulberry32((hash(T.seed&65535,T.night*97+T.n,83)*4294967296)>>>0)};return c},
  beginNight(card){const S=YL_RUN.S;YL.po=(S.po||[]).map(p=>({x:p.x,y:p.y}));YL.poSaid=false;YL.secs=YL_RUN.nightRec().secs||0;YL.beginTrip();if(card)YL.openCard('night',YL_RUN.cardData(S.night))},
  beginTrip(){const S=YL_RUN.S,P=G.player,night=S.night,n=S.trip;
    P.x=G.sc.start[0]*TS;P.y=G.sc.start[1]*TS;P.face=-Math.PI/2;P.crouch=false;P.moving=false;
    Object.assign(G,{bubbles:[],fx:[],noises:[],flash:null,scare:null,darkUntil:0,shake:0});YL.spk.clear();
    for(const f of YL.FIX)f.variant=f.base;
    const T={phase:'ready',night,n,seed:S.seed,anoms:[],done:{READ:false,BOW:false,DELIVER:false},beads:3,t:0,fail:null,cal:YL_RUN.cal(night),picks:[]};
    YL.closeCal();YL.trip=T;YL.act=null;
    YL.st={h:[],face:-Math.PI/2,fx:mouse.fx,fy:mouse.fy,mt:-99,vT:0,back:false,dir:null,push:0,still:0,vy:0,wallT:-99,breath:!!G.touchBreath};
    YL.ctx=YL.mkCtx(T);
    T.picks=(YL.forced||YL_RULES.pick(S.seed,night,n,S.hist||[],S.met||[])||[]).map(p=>({id:p.id,seg:p.seg}));
    T.anoms=T.picks.map(p=>YL_RULES.begin(p,YL.ctx)).filter(Boolean);
    YL_RULES.dress(YL.ctx);
    const N=YL_RUN.nightRec();N.trips=n;N.secs=Math.round(YL.secs);YL_RUN.save();
    const v=YL.cam(BW,BH);YL.view={x:v.x,y:v.y,w:BW,h:BH};CAM.init=false},
  /* the night card stays until you close it; dawn and 天猶未光 close themselves */
  openCard(kind,data){YL.card={kind,t0:G.t,dur:{dawn:1.5,wait:1.2}[kind]||1e9};const go=a=>YL.closeCard(a,true);go.ready=()=>YL.cardReady();YL_UI.card(kind,data,go)},
  /* a card takes no tap, click or key for its first 0.6 s, so a double click on the title or a held key cannot run through it */
  cardReady(){return!!YL.card&&G.t-YL.card.t0>=.6-1e-9},
  closeCard(a,byUser){const C=YL.card;if(!C||(byUser&&!YL.cardReady()))return;YL.card=null;const e=document.getElementById('ylcard');if(e)e.hidden=true;
    if(C.kind==='dawn')YL_RUN.afterDawn();else if(C.kind==='wait')YL.beginTrip();else if(C.kind==='end'){if(a==='title')toTitle();else YL_RUN.again()}},
  closeCal(){if(YL.calOn)YL_UI.cal(false,YL.trip&&YL.trip.cal);YL.calOn=false;YL.peekUntil=0},
  peekToggle(){YL.peekUntil=YL.peekUntil>G.t?0:G.t+3},
  peek(){const T=YL.trip,want=!!((YL.act&&YL.act.verb==='READ')||keys.Tab||YL.peekUntil>G.t);if(want!==YL.calOn){YL.calOn=want;YL_UI.cal(want,T.cal)}},
  /* ---- input ---- */
  key(code,e){const T=YL.trip,A=YL.act;if(!T||YL.card)return;
    if(code==='KeyE')interact();
    else if(code==='KeyC'){if(!A&&(T.phase==='ready'||T.phase==='walk'))crouch()}
    else if(code==='Space'){if(A&&A.verb==='READ'){if(A.t>=.6)A.t=A.dur}else YL.nianfo()}},
  interact(P){const T=YL.trip,A=YL.act;if(!T||YL.card)return null;
    if(A)return A.verb==='READ'&&A.t>=.6?{label:'收起月曆',x:P.x,y:P.y,fn:()=>{A.t=A.dur}}:null;
    if(T.phase!=='ready'&&T.phase!=='walk')return null;
    const px=P.x/TS,py=P.y/TS,near=(s,r)=>Math.hypot(s[0]-px,s[1]-py)<=(r||1.6),go=(label,s,verb,dur)=>({label,x:s[0]*TS,y:s[1]*TS,fn:()=>{YL.act={verb,t:0,dur};if(verb==='READ')YL.snd('paper')}});
    if(!T.done.READ&&near(YL.BED))return go('拿月曆',YL.BED,'READ',2);
    for(const s of YL.SEG)if(s.verb&&!T.done[s.verb]&&near(s.spot,2.2))   /* the shrine and the mailbox sit 2 tiles off the centre line: walking straight up the road still shows the prompt */
      return go(s.verb==='BOW'?'拜土地公':'投月曆',s.spot,s.verb,s.verb==='BOW'?1:.6);
    return null},
  nianfo(){const T=YL.trip,P=G.player;if(!T||YL.card||YL.act||!(T.phase==='ready'||T.phase==='walk'))return;
    if(T.beads<=0){bubble(P,'（佛珠用完了）','info',1.4);return}T.beads--;YL.act={verb:'NIANFO',t:0,dur:.8};bubble(P,'阿彌陀佛','voice',1.2)},
  /* ---- one frame ---- */
  update(dt){const T=YL.trip,P=G.player;YL.tick(dt);if(!T)return;const c=YL.ctx,s=YL.st;c.dt=dt;c.did=null;c.nianfoDone=false;
    if(YL.card){if(G.t-YL.card.t0>=YL.card.dur)YL.closeCard();return}
    YL.secs+=dt;
    const busy=YL.act||!(T.phase==='ready'||T.phase==='walk'),ox=P.x,oy=P.y;if(busy){P.anim+=dt;P.moving=false}else updPlayer(dt);
    if(!T.done.READ&&P.y<96*TS){P.y=96*TS;if(G.t-s.wallT>2.5){s.wallT=G.t;bubble(P,'月曆還沒拿。','info',1.6)}}   /* a soft gate, not a mistake */
    YL.motion(P.x-ox,P.y-oy);YL.updLook(dt);
    if(IS_TOUCH){const b=!!G.touchBreath;if(b&&!s.breath)YL.nianfo();s.breath=b}
    if(!busy||YL.act){T.t+=dt;YL.script(T,c)}
    if(YL.act){const A=YL.act;A.t+=dt;if(A.t>=A.dur){YL.act=null;if(A.verb==='NIANFO')c.nianfoDone=true;else{T.done[A.verb]=true;c.did=A.verb;if(A.verb==='READ'&&T.phase==='ready')T.phase='walk'}}}
    c.t=T.t;c.seg=YL.segAt(P.y/TS);c.act=YL.act;YL.fix('truckbed').variant=T.done.READ?'normal':'glow';
    if(T.phase==='walk'){if(P.y<10*TS&&!c.did)c.did='INCENSE';YL_RULES.judge(c,dt);if(T.phase==='walk')YL.feedback(c.did,T,c);
      if(c.did==='INCENSE'&&T.phase==='walk'){T.phase='incense';T.it=G.t;YL.snd('qing');if((YL_RUN.S.streak||0)+1>=YL_RUN.need())c.say('多謝你，阮爸一直咧等今年的月曆。',12.5,4.5,3)}}
    else if(T.phase==='incense'&&G.t-T.it>=1.2){T.phase='cleared';YL.closeCal();YL_RUN.cleared(T);return}
    else if(T.phase==='fail'){YL.failStep(T);if(YL.trip!==T)return}
    YL.peek();
    const sp=YL.speed();s.still=sp<.2?s.still+dt:0;s.push=s.still>=.6?Math.min(2*TS,s.push+2*TS*dt):sp>=.2?Math.max(0,s.push-4*TS*dt):s.push;
    const v=YL.cam(BW,BH);YL.view={x:v.x,y:v.y,w:BW,h:BH}},
  tick(dt){for(const n of G.noises)n.t+=dt;G.noises=G.noises.filter(n=>n.t<1);for(const f of G.fx)f.t+=dt;G.fx=G.fx.filter(f=>f.t<f.life);
    for(const b of G.bubbles){b.t+=dt;if(b.ent&&b.ent.x!==undefined){b.x=b.ent.x;b.y=b.ent.y}}G.bubbles=G.bubbles.filter(b=>b.t<b.life);
    G.shake=Math.max(0,G.shake-dt);if(G.scare)G.scare.t+=dt;if(G.flash)G.flash.at+=dt},
  motion(dx,dy){const s=YL.st,d=Math.hypot(dx,dy);s.h.push({t:G.t,d,dy});s.h=s.h.filter(e=>e.t>G.t-.3);s.dir=d>.05?Math.atan2(dy,dx):null;
    let sy=0;for(const e of s.h)if(e.t>G.t-.15+1e-6)sy+=e.dy;s.vy=sy/.15},
  /* only a deliberate look is looking back (§5.2): walking backwards, or a phone standing still, eases the torch back to the front */
  updLook(dt){const P=G.player,s=YL.st,F=-Math.PI/2,sp=YL.speed(),bk=a=>Math.abs(angDiff(a,F))>2.094;
    const ease=()=>{const d=angDiff(F,s.face),k=Math.PI/.4*dt;s.face=Math.abs(d)<=k?F:s.face+Math.sign(d)*k};
    /* letting go of 回頭 gives back the direction from before it, or a standing player would keep the torch on their back */
    if(IS_TOUCH){const lk=!!G.touchLook;if(lk&&!s.lk)s.pre=s.face;if(!lk&&s.lk)s.face=s.pre;s.lk=lk;if(lk)s.face=F+Math.PI;else if(sp>.3&&P.moving&&!bk(P.moveFace))s.face=P.moveFace;else ease()}
    else{if(mouse.active&&(mouse.fx!==s.fx||mouse.fy!==s.fy)){s.fx=mouse.fx;s.fy=mouse.fy;s.mt=G.t}   /* mouse.active never turns false again, so "moved lately" is what counts */
      if(mouse.active&&G.t-s.mt<1.2)s.face=Math.atan2(CAM.y+mouse.fy*BH-P.y,CAM.x+mouse.fx*BW-P.x);
      else if(P.moving&&!bk(P.moveFace))s.face=P.moveFace;
      else ease()}
    P.face=s.face;s.vT=bk(s.face)?s.vT+dt:0;s.back=s.vT>=.5},
  /* the sound and the line of a verb that the rules let through (judge may have just failed it) */
  feedback(v,T,c){if(v==='BOW'){T.bowAt=G.t;YL.snd('muyu');c.say('土地公保庇。',12.5,63.6,2)}else if(v==='DELIVER'){YL.snd('dong');if(T.night===1&&T.n===1)T.hintAt=G.t}},
  /* the scripted beats of the walk that are not rules: the radio by the truck, your own 魄 */
  script(T,c){
    if(T.night===1&&T.n===1&&!T.radio&&T.t>=2&&!YL.act){T.radio=true;YL.snd('radio');c.say('……月曆……有紮來無？',13.5,110.6,2)}   /* not while the calendar page covers the screen */
    if(!YL.poSaid)for(const p of YL.po)if(c.dist(p.x,p.y)<5){YL.poSaid=true;c.say('……是我。',p.x,p.y,2.2);break}},
  /* ---- failing: freeze on the thing, 阿嬤's words on black, back at the truck; 2.4 s at most ---- */
  fail(f){const T=YL.trip;if(!T||T.fail||!(T.phase==='walk'||T.phase==='ready'))return false;f=f||{};const P=G.player,px=P.x/TS,py=P.y/TS;
    const at=f.at||[f.x??px,f.y??py];   /* f.x,f.y are where you stood (the 魄 goes there), f.at is the thing that went wrong */
    T.fail={id:f.id||null,reason:f.reason||null,seg:f.seg||YL.segAt(py),x:f.x??px,y:f.y??py,at,px,py,t:G.t,tt:T.t,style:f.style||'quiet',face:f.face||null,slip:f.slip||null};T.phase='fail';
    const inst=T.anoms.find(a=>a.id===f.id&&a.verdict==='pending');if(inst)inst.verdict='fail';
    YL.act=null;YL.closeCal();
    if(f.style==='lunge'&&f.face){G.flash={type:f.face,at:0};G.shake=.3;SND.scare(f.face)}else G.darkUntil=G.t+.9;
    if(f.sound)YL.snd(f.sound,at[0],at[1]);
    YL_RUN.onFail(T);return true},
  failStep(T){const f=T.fail,ft=G.t-f.t,P=G.player;
    /* a few failures say one more thing in the dark before 阿嬤's words (y_jisi: whatever took your incense thanks you) */
    {const d=YL_RULES.DEFS&&YL_RULES.DEFS[f.id];if(d&&d.failSub&&f.reason==='did'&&ft>=.45&&!f.subbed){f.subbed=true;UI.sub(d.failSub,'omen');const q=UI.subs[UI.subs.length-1];if(q)q.t=1.4}}
    if(ft>=.9&&f.slipAt==null){const s=f.slip||YL_RULES.slip(f.id,f.reason)||{},k=s.zh||'',again=YL.slips.has(k);YL.slips.add(k);f.slipAt=G.t;f.slipEnd=ft+(again?.6:1);YL_UI.slip(s.zh||'',s.tw||'',(again?600:1000),()=>YL.skipSlip())}
    if(f.slipEnd!=null&&ft>=f.slipEnd&&f.home==null){f.home=G.t;const e=document.getElementById('ylslip');if(e)e.hidden=true;YL.addPo(f.x,f.y);
      P.x=G.sc.start[0]*TS;P.y=G.sc.start[1]*TS;P.face=-Math.PI/2;P.crouch=false;Object.assign(G,{bubbles:[],fx:[],flash:null,darkUntil:0});CAM.init=false}
    if(f.home!=null&&G.t-f.home>=.5-1e-6)YL.beginTrip()},   /* YL_RUN.onFail already moved the saved trip on */
  skipSlip(){const f=YL.trip&&YL.trip.fail;if(f&&f.slipAt!=null&&f.home==null&&G.t-f.slipAt>=.4)f.slipEnd=G.t-f.t},
  addPo(x,y){YL.po=YL.poWith(x,y);YL_RUN.S.po=YL.po.map(p=>({x:+p.x.toFixed(2),y:+p.y.toFixed(2)}))},
  poWith(x,y){return YL.po.some(p=>Math.hypot(p.x-x,p.y-y)<1.5)?YL.po.slice():YL.po.concat({x,y})},
  blackA(){const f=YL.trip&&YL.trip.fail;if(!f||G.t-f.t<.9)return 0;return f.home==null?1:clamp(1-(G.t-f.home)/.5,0,1)},
  /* ---- camera and drawing hooks ---- */
  cam(vw,vh){const P=G.player,T=YL.trip,s=YL.st,f=T&&T.fail;
    if(f&&f.home==null&&G.t-f.t<.9)return{x:f.at[0]*TS-vw/2,y:f.at[1]*TS-vh*.6};
    const X0=YL.X0*TS,lat=P.x-X0,m=2*TS,cx=X0+(lat>m?lat-m:lat<-m?lat+m:0),x=clamp(cx-vw/2,P.x+1.5*TS-vw,P.x-1.5*TS);
    /* updCam eases 12% a frame, which trails a walking player by ~v*.88/.12; aiming that far ahead keeps them at 68% while they walk.
       On a phone they sit at 55%, above the thumb buttons */
    return{x,y:P.y-vh*(IS_TOUCH?.55:.68)-(s?s.push-s.vy*.88/.12/60:0)}},
  ents(ents,inView){const c=YL.ctx;if(!c)return;
    for(const f of YL.FIX){if(f.y0!=null?!(f.y1*TS>CAM.y-60&&f.y0*TS<CAM.y+BH+60):!inView(f.x*TS,f.y*TS,90))continue;ents.push({y:f.sy??(Math.floor(f.y)+1)*TS-1,d:()=>YL_ART.fixture(f,c)})}
    for(const a of YL.trip.anoms)ents.push({y:(a.y||0)*TS,d:()=>YL_ART.anom(a,c)});
    for(const p of YL.po)if(inView(p.x*TS,p.y*TS,40))ents.push({y:p.y*TS,d:()=>YL_ART.po(p)})},
  light(c){if(YL.ctx)YL_ART.light(c,YL.ctx)},
  over(b){if(!YL.ctx)return;YL_ART.over(b,YL.ctx);const a=YL.blackA();if(a>0){b.save();b.setTransform(1,0,0,1,0,0);b.fillStyle=`rgba(0,0,0,${a.toFixed(3)})`;b.fillRect(0,0,BW,BH);b.restore()}},
  lungeOrigin(type){const f=YL.trip&&YL.trip.fail;if(!f)return null;const P=G.player,d=YL_RULES.DEFS[f.id],behind=!!(d&&d.kind==='noback');
    const x=behind?P.x:f.at[0]*TS,y=(behind?P.y+2*TS:f.at[1]*TS)-14;return[(x-CAM.x)*CAM.k,(y-CAM.y)*CAM.k,22*CAM.k]},
  hud(dt){const T=YL.trip;if(T){const S=YL_RUN.S||{},near=!YL.card&&(T.phase==='ready'||T.phase==='walk')&&!!YL.interact(G.player);
    YL_UI.hud({night:T.night,cal:T.cal,beads:T.beads,trip:T.n,streak:Math.min(YL_RUN.need(),(S.streak||0)+(T.phase==='incense'?1:0)),need:YL_RUN.need(),near,
      hint:T.hintAt&&G.t-T.hintAt<2.5?'nianfo':T.night===1&&T.n===1&&!T.done.READ?'first':null})}UI.tickSubs(dt)}};
window.YLT={
  start(night,seed,trip){YL_RUN.S={v:1,seed:seed||4242,night:night||1,trip:trip||1,streak:0,met:[],po:[],nights:[],hist:[],done:false};YL_RUN.noCard=true;startGame(YL_RUN.S.seed,'yelu',{mod:'calm'});return YLT.state()},
  force(ids){YL.forced=ids==null?null:ids.map(i=>typeof i==='string'?{id:i,seg:(YL_RULES.DEFS[i]&&YL_RULES.DEFS[i].segs[0])||null}:i);YL.beginTrip();return YLT.state()},
  state(){const T=YL.trip,P=G.player;if(!T||!G.yelu)return{};const f=T.fail;
    return{phase:T.phase,night:T.night,n:T.n,beads:T.beads,done:{...T.done},picks:T.picks,fail:f&&{id:f.id,reason:f.reason,x:f.x,y:f.y,at:f.at,t:f.t},po:YL.po.map(p=>({...p})),
      x:P.x/TS,y:P.y/TS,face:P.face,back:YL.lookingBack(),act:YL.act&&YL.act.verb,card:YL.card&&YL.card.kind,t:T.t,gt:G.t}},
  step(n){KT.step(n)},
  place(tx,ty){const P=G.player;P.x=tx*TS;P.y=ty*TS;if(YL.st)YL.st.h=[];CAM.init=false},
  /* points the mouse 3 tiles from the player at that angle, through the same path a real mouse takes; null lets go of it */
  view(rad){if(rad==null){mouse.active=false;return}const P=G.player;mouse.active=true;mouse.fx=(P.x+Math.cos(rad)*3*TS-CAM.x)/BW;mouse.fy=(P.y+Math.sin(rad)*3*TS-CAM.y)/BH},
  press(code){dispatchEvent(new KeyboardEvent('keydown',{code,bubbles:true}))},
  release(code){dispatchEvent(new KeyboardEvent('keyup',{code,bubbles:true}))}};
