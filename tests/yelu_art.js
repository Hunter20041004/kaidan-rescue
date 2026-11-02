// yelu_art: W3 picture checks. Runs inside the page; returns [{name,ok,detail}].
// It also installs window.YLS, a self-contained stage for 夜路 scenes; with window.YL_STAGE_ONLY set it stops there (tests/yelu_screens.py uses it).
(()=>{
const TS=24;
// the road as the spec lays it out (§3.1–3.2); used only when W1's scene is not in this build yet
const MYFIX=(()=>{const F=(id,kind,seg,x,y,base,o)=>Object.assign({id,kind,seg,x,y,base,variant:base},o);
  return[F('truckbed','truckbed','S1',13.5,113.2,'normal'),F('sign','sign','S1',8.5,97.5,'normal'),F('ditch','ditch','S2',13.5,84.5,'normal',{y0:74,y1:95,sy:0}),
    ...[93,89,85,81,77].map((y,i)=>F('pole'+(i+1),'pole','S2',8.5,y+.5,i===4?'transformer':'normal')),F('lamp','lamp','S2',12.5,86.5,'off'),
    F('shrine','shrine','S3',12.5,64.5,'normal'),
    F('door4','door4','S4',7,44.5,'plain',{sy:45*TS+.1}),F('lintel','lintel','S4',7,44.2,'redpaper',{sy:45*TS+.2}),
    F('ama','ama','S4',7.5,47.5,'normal'),F('mailbox','mailbox','S4',8.5,46.5,'normal'),F('candle','candle','S4',8.5,47.5,'normal'),
    F('mirror','mirror','S5',12.5,21.5,'normal'),F('tent','tent','END',10.5,5.5,'normal',{sy:9*TS})]})();
const S=window.YLS={fix:null,ctx:null,trip:null,po:[],
  // start the 夜路 scene, our own map and props if W1's are not here, and route the three drawing hooks to YL_ART with our ctx
  setup(night){KT.manual=true;const sc=SCENES.yelu,own=!(typeof YL!=='undefined'&&YL.FIX&&YL.FIX.length);
    if(own){sc.houses=[[13,98,17,102],[3,39,8,44]];sc.truck=[13.5*TS,112*TS];sc.start=[11.5,113.5];
      sc.build=R=>{R(0,0,20,119,'T');R(2,1,18,117,'.');R(9,1,11,117,'r');R(13,98,17,102,'#');R(14,99,16,101,'h');R(3,39,8,44,'#');R(4,40,7,43,'h');R(3,45,8,48,'s');
        R(2,12,7,33,'b');R(13,12,17,33,'b');R(13,20,16,21,'.');R(13,111,14,112,'V')};
      sc.decor=()=>({items:[{x:7.5*TS,y:105*TS-2,spr:DSPR.kiosk(),solid:[13,6]},{x:7.5*TS+14,y:105*TS-3,spr:DSPR.chair(0)},{x:6.5*TS,y:107*TS-2,spr:DSPR.phone()},{x:15.5*TS,y:103*TS-WALLH+2,spr:DSPR.shopsign(),sy:103*TS+.4}],wires:YL_ART.wires(MYFIX)})}
    if(typeof YL_RUN!=='undefined')YL_RUN.noCard=true;   /* the real run opens the night card on start, which would cover every staged shot */
    KT.startGame(1,'yelu',{mod:'calm'});const G=KT.G;G.schedule=[];G.events=[];G.apps=[];
    S.fix=own?MYFIX.map(f=>Object.assign({},f)):YL.FIX;if(own)YL.FIX=S.fix;for(const f of S.fix)f.variant=f.base;
    const cal=[{yi:['祭祀','嫁娶'],ji:[]},{yi:[],ji:['祭祀','嫁娶']},{yi:['祭祀'],ji:['嫁娶']}][(night||1)-1];
    S.trip={phase:'walk',night:night||1,n:1,anoms:[],done:{},fail:null,beads:3,cal,t:0};S.po=[];
    S.ctx={P:G.player,t:0,dt:1/60,TS,night:night||1,trip:S.trip,cal,seg:'S1',did:null,act:null,fix:id=>S.fix.find(f=>f.id===id),setVariant:(id,v)=>{const f=S.fix.find(f=>f.id===id);if(f)f.variant=v}};
    YL.trip=S.trip;YL.ctx=S.ctx;YL.ents=(e,iv)=>YL_ART.ents(e,iv,S.ctx,S.po);YL.light=c=>YL_ART.light(c,S.ctx);YL.over=b=>YL_ART.over(b,S.ctx);
    YL.hud=dt=>{YL_UI.hud({night:S.trip.night,cal:S.trip.cal,beads:S.trip.beads,hint:S.hint||null});UI.tickSubs(dt)};
    YL.cam=(vw,vh)=>{const P=G.player,X0=10.5*TS,lat=P.x-X0,m=2*TS,cx=X0+(lat>m?lat-m:lat<-m?lat+m:0);return{x:clamp(cx-vw/2,P.x+1.5*TS-vw,P.x-1.5*TS),y:P.y-vh*.68-(S.push||0)}};
    YL.update=dt=>{updPlayer(dt);S.ctx.t+=dt};
    document.body.classList.add('yelu');G.darkUntil=0;return G},
  set(id,v){const f=S.fix.find(f=>f.id===id);if(f)f.variant=v},
  anom(id,o){const a=Object.assign({id,state:'active',verdict:'pending',t:0,data:{alpha:1,seen:true}},o||{});S.trip.anoms.push(a);return a},
  place(tx,ty,face){const P=KT.G.player;P.x=tx*TS;P.y=ty*TS;P.face=face==null?-Math.PI/2:face;P.moving=false;KT.mouse.active=false;CAM.init=false},
  frames(n){for(let i=0;i<(n||1);i++){KT.G.t+=1/60;S.ctx.t+=1/60;KT.draw()}},
  // world tile -> device pixel on the main canvas
  scr(tx,ty){return[(tx*TS-Math.round(CAM.x))*CAM.k,(ty*TS-Math.round(CAM.y))*CAM.k]},
  lum(cx,cy,r){const d=ctx.getImageData(0,0,cv.width,cv.height).data;let s=0,n=0;for(let y=Math.max(0,cy-r|0);y<Math.min(cv.height,cy+r);y++)for(let x=Math.max(0,cx-r|0);x<Math.min(cv.width,cx+r);x++){if((x-cx)**2+(y-cy)**2>r*r)continue;const i=(y*cv.width+x)*4;s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];n++}return s/n/255},
  // one fixture or anomaly alone on a transparent art buffer: what it actually puts on screen, before light
  solo(fn,wx,wy){bx.setTransform(1,0,0,1,0,0);bx.clearRect(0,0,BW,BH);bx.setTransform(1,0,0,1,Math.round(BW/2-wx),Math.round(BH/2-wy));fn();bx.setTransform(1,0,0,1,0,0);return bx.getImageData(0,0,BW,BH).data},
  count(d){let n=0;for(let i=3;i<d.length;i+=4)if(d[i]>0)n++;return n},
  diff(a,b){let n=0;for(let i=0;i<a.length;i+=4)if(a[i]!==b[i]||a[i+1]!==b[i+1]||a[i+2]!==b[i+2]||a[i+3]!==b[i+3])n++;return n},
  shot(f,v,extra){const o=f.variant;f.variant=v;const d=S.solo(()=>{YL_ART.fixture(f,S.ctx);extra&&extra()},f.x*TS,f.y*TS);f.variant=o;return d},
  VARIANTS:{truckbed:['normal','glow'],sign:['normal'],ditch:['normal'],pole:['normal','transformer'],lamp:['off','lit'],shrine:['normal','turned'],door4:['plain','wedding'],lintel:['redpaper'],ama:['normal','tail'],mailbox:['normal'],candle:['normal'],mirror:['normal','extra'],tent:['normal']}};
if(window.YL_STAGE_ONLY)return[];

const R=[];const T=(name,fn)=>{try{const d=fn();R.push({name,ok:!!(d===true||(d&&d.ok)),detail:d&&d.detail!==undefined?d.detail:d})}catch(e){R.push({name,ok:false,detail:String(e.stack||e)})}};
const G=S.setup(1);S.place(10.5,70);S.frames(2);

T('驗收1：每個 kind／variant 畫出來的非透明像素都 > 0',()=>{const out=[];let ok=true;const kinds=new Set(S.fix.map(f=>f.kind));
  for(const k of Object.keys(S.VARIANTS)){const f=S.fix.find(f=>f.kind===k);if(!f){ok=false;out.push(k+':缺');continue}for(const v of S.VARIANTS[k]){const n=S.count(S.shot(f,v));out.push(`${k}:${v}=${n}`);if(!(n>0))ok=false}}
  for(const k of['truckbed','sign','ditch','pole','lamp','shrine','door4','lintel','ama','mailbox','candle','mirror','tent'])if(!kinds.has(k)){ok=false;out.push('場景缺 '+k)}
  return{ok,detail:out.join(' ')}});
T('驗收1：每個有畫面的不對勁、魄都畫得出來（y_call、y_steps 依規格沒有畫面）',()=>{const P=G.player;S.place(10.5,26);const out=[];let ok=true;
  const g={id:'y_girl',x:12.5,y:22.5,state:'active',verdict:'pending',data:{alpha:1,seen:true}};let n=S.count(S.solo(()=>YL_ART.anom(g,S.ctx),12.5*TS,22.5*TS));out.push('y_girl='+n);ok=ok&&n>0;
  const l={id:'y_lords',state:'active',verdict:'pending',data:{alpha:1,members:[{kind:'qiye',x:10.5,y:84},{kind:'baye',x:10.5,y:82.5}]}};n=S.count(S.solo(()=>YL_ART.anom(l,S.ctx),10.5*TS,83*TS));out.push('y_lords='+n);ok=ok&&n>0;
  S.set('lamp','lit');const s={id:'y_lamp',x:12.5,y:86.5,state:'active',verdict:'pending',data:{}};n=S.count(S.solo(()=>YL_ART.anom(s,S.ctx),12.5*TS,86.5*TS));S.set('lamp','off');out.push('y_lamp影子='+n);ok=ok&&n>0;
  n=S.count(S.solo(()=>YL_ART.po({x:10.5,y:60}),10.5*TS,60*TS));out.push('魄='+n);ok=ok&&n>0;
  const F=YL_ART.FACE,faces=Object.values(F).every(k=>CPAINT[k]);out.push('FACE都在CPAINT='+faces);ok=ok&&faces&&F.y_girl==='girl'&&F.y_call==='voice'&&F.y_ghostwed==='bride'&&F.y_tail==='tiger';
  return{ok,detail:out.join(' ')}});
T('驗收3：shrine turned 和 normal 至少差 12 美術像素',()=>{const f=S.fix.find(f=>f.kind==='shrine');const n=S.diff(S.shot(f,'normal'),S.shot(f,'turned'));return{ok:n>=12,detail:`差 ${n} px`}});
/* spec change (judge A5): the abnormal mirror is 'extra' (one more person behind you), not 'empty'; same threshold */
T('驗收3：mirror extra 和 normal 至少差 6 美術像素（玩家站在鏡子南方 4 格的路上）',()=>{const f=S.fix.find(f=>f.kind==='mirror');S.place(10.5,25.5);const n=S.diff(S.shot(f,'normal'),S.shot(f,'extra'));return{ok:n>=6,detail:`差 ${n} px`}});
T('驗收3：ama tail 和 normal 至少差 18 美術像素（尾巴捲起與伸直兩個時刻都量）',()=>{const f=S.fix.find(f=>f.kind==='ama');const t0=G.t,res=[];for(const t of[10.2,11.1]){G.t=t;res.push(S.diff(S.shot(f,'normal'),S.shot(f,'tail')))}G.t=t0;return{ok:Math.min(...res)>=18,detail:`差 ${res.join(' / ')} px`}});
T('驗收3：路燈 lit 時燈下 2 格內平均亮度比 off 高至少 40%（玩家在燈南方 5 格的路中央、面向前方）',()=>{const res={};for(const v of['off','lit']){S.set('lamp',v);S.place(10.5,91.5);S.frames(3);const[x,y]=S.scr(12.5,86.5);res[v]=S.lum(x,y,2*TS*CAM.k)}S.set('lamp','off');
  const up=res.lit/res.off-1;return{ok:up>=.4,detail:`off ${(res.off*100).toFixed(2)}% → lit ${(res.lit*100).toFixed(2)}%（+${(up*100).toFixed(0)}%）`}});
T('驗收5：每幀 KT.update＋KT.draw 跑 300 幀後 SPR.size 不再增加（走遍六段、所有變體與不對勁都上場）',()=>{const stops=[[10.5,114],[10.5,92],[10.5,68],[9.5,50],[10.5,26],[10.5,11]];
  const lit=()=>{S.set('lamp','lit');S.set('shrine','turned');S.set('door4','wedding');S.set('ama','tail');S.set('mirror','extra')},plain=()=>{for(const f of S.fix)f.variant=f.base};
  S.trip.anoms=[];S.anom('y_girl',{x:12.5,y:22.5});S.anom('y_lords',{data:{alpha:1,members:[{kind:'qiye',x:10.5,y:84},{kind:'baye',x:10.5,y:82.5}]}});S.anom('y_lamp',{x:12.5,y:86.5,data:{}});S.po=[{x:10.5,y:30}];
  const tour=(n)=>{for(let i=0;i<n;i++){const s=stops[Math.floor(i/n*stops.length)];if(i%(n/stops.length|0)===0){S.place(s[0],s[1]);(i/(n/stops.length|0))%2?lit():plain()}KT.keys.KeyW=i%3!==0;KT.update(1/60);KT.draw()}KT.keys.KeyW=false};
  tour(300);const a=SPR.size;tour(300);const b=SPR.size;tour(300);const c=SPR.size;plain();S.trip.anoms=[];S.po=[];return{ok:a===b&&b===c,detail:`300 幀後 ${a}，600 幀 ${b}，900 幀 ${c}`}});
T('背後全黑畫在最上層：玩家南方 2 格的世界像素被蓋成 ≤3% 亮度（美術緩衝區直接量）',()=>{S.place(10.5,113.5);S.frames(3);const P=G.player,x=Math.round(P.x-CAM.x),y=Math.round(P.y+2*TS-CAM.y),d=bx.getImageData(Math.max(0,x-30),y,60,8).data;let s=0;for(let i=0;i<d.length;i+=4)s+=.2126*d[i]+.7152*d[i+1]+.0722*d[i+2];const m=s/(d.length/4)/255;return{ok:m<=.03,detail:`平均亮度 ${(m*100).toFixed(2)}%`}});
T('YL_SND 與 YL_UI 介面齊全',()=>{const need=['at','hush','qing','muyu','pa','dong','paper','chain','gong','lingpai','radio','stepBehind','crack','call','stepEar','breath'],miss=need.filter(k=>typeof YL_SND[k]!=='function'),ui=['hud','cal','slip','card','go'].filter(k=>typeof YL_UI[k]!=='function');return{ok:!miss.length&&!ui.length,detail:`缺 ${miss.concat(ui).join(',')||'無'}`}});
KT.manual=false;return R})()
