# Pacing playtest: python3 pace.py <abs html> <nseeds> [mod|any] [bot|idle]
# NIGHT=<0-6> env: play that 七夜 night (its length, villagers, monsters, heat) instead of a single night.
# Runs a careful scripted bot (or an idle player that never moves) for a full night and reports pacing numbers.
import sys,json,time,statistics as st
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]; N=int(sys.argv[2]); MOD=sys.argv[3] if len(sys.argv)>3 else 'any'; MODE=sys.argv[4] if len(sys.argv)>4 else 'bot'
JS=r"""(async([seed,mod,mode])=>{
 if(mod!=='any'){window.__mp=window.__mp||modPool;window.modPool=()=>MODS.filter(m=>m.id===mod)}else if(window.__mp)window.modPool=window.__mp;
 KT.manual=true;const nN=window.__night;KT.startGame(seed,undefined,nN>=0?{cfg:KT.NIGHTS[nN],mod:KT.NIGHTS[nN].mod,heat:KT.NIGHTS[nN].heat}:undefined);const G=KT.G,P=G.player,K=KT.keys;for(const k in K)K[k]=false;
 const R={seed,mod:G.mod.id,omen1:null,spawns:[],contact1:null,chase1:null,apps:[],deaths:[],heat:{},danger:[0,0,0,0,0,0,0],contacts:0,hides:0,saved:0,end:null,endT:null};
 const omens=new Set(Object.values(MONSTERS).map(m=>m.omen));let lastLog=0,prevT=new Set(),seenM=new Set();
 let hideT=0,goal=null,stuck=0,lx=P.x,ly=P.y,mashC=0;
 const near=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
 function steer(tx,ty,run){const st=[Math.floor(P.x/TS),Math.floor(P.y/TS)];const r=findPath(st[0],st[1],Math.floor(tx/TS),Math.floor(ty/TS),humanPass,4000);
  let gx=tx,gy=ty;if(r.path.length>1){const n=r.path[Math.min(1,r.path.length-1)];gx=tc(n%MW);gy=tc((n/MW)|0)}
  const dx=gx-P.x,dy=gy-P.y,d=Math.hypot(dx,dy);K.KeyD=dx>4;K.KeyA=dx<-4;K.KeyS=dy>4;K.KeyW=dy<-4;K.ShiftLeft=!!run;KT.mouse.active=true;KT.mouse.x=P.x+dx;KT.mouse.y=P.y+dy;return d}
 function stop(){K.KeyW=K.KeyA=K.KeyS=K.KeyD=K.ShiftLeft=false}
 function bot(){
  if(mode==='idle'){stop();return}
  if(mode==='hide'){K.Space=false;if(P.spot){stop();if(G.monsters.some(m=>m.type==='tiger'&&m.state==='knock'&&m.spot===P.spot&&near(m,P)<40)&&P.breath>.2&&P.gasp<=0)K.Space=true;return}if(G.apparition){stop();P.crouch=G.apparition.type==='funeral';return}const sp=G.spots.filter(s=>(s.type==='cabinet'||s.type==='hay')&&s.occ.length<s.cap).sort((a,b)=>near(a,P)-near(b,P))[0];if(!sp){stop();return}if(near(sp,P)<34){KT.hideIn(sp);stop();return}steer(sp.x,sp.y,false);return}
  K.Space=false;
  const jiang=G.monsters.find(m=>m.type==='jiang'&&!m.hidden&&near(m,P)<6*TS&&m.state!=='sealed');if(jiang&&P.breath>.2&&P.gasp<=0&&!P.spot&&!indoor(P))K.Space=true;
  if(jiang&&jiang.target!==P&&!P.lured&&!P.drown&&!G.apparition&&!P.spot){if(indoor(P)&&tAtPx(P.x,P.y)!=='d'){stop();return}let bt=null,bd2=1e9;const px=Math.floor(P.x/TS),py=Math.floor(P.y/TS);for(let dy=-7;dy<=7;dy++)for(let dx=-7;dx<=7;dx++){const c=tileAt(px+dx,py+dy);if((c==='h'||c==='p')&&Math.hypot(dx,dy)<bd2&&Math.hypot(tc(px+dx)-jiang.x,tc(py+dy)-jiang.y)>2*TS){bd2=Math.hypot(dx,dy);bt={x:tc(px+dx),y:tc(py+dy)}}}if(bt){steer(bt.x,bt.y,false);return}const a=Math.atan2(P.y-jiang.y,P.x-jiang.x);steer(P.x+Math.cos(a)*4*TS,P.y+Math.sin(a)*4*TS,false);return}
  if(P.lured||P.drown){stop();if(++mashC%6===0)P.mash=(P.mash||0)+1;return}
  const ask=G.monsters.find(m=>m.type==='kuchi'&&m.state==='ask'&&m.target===P);const A=G.apparition;if(ask&&!ask.__d){ask.__d=1;(R.askD=R.askD||[]).push(+(near(ask,P)/TS).toFixed(1))}if(ask&&ask.timer<1.6&&!(A&&A.type==='voice')){const it=KT.interactTarget();if(it&&it.fn)it.fn();return}
  if(A){stop();P.crouch=A.type==='funeral';return}
  const thr=G.monsters.filter(m=>!m.hidden&&(m.type!=='jiang'||m.target===P)&&!['flee','stun','sealed','sated','eat','lead','drag'].includes(m.state)&&(m.type!=='suigui'||inWater(P))&&((m.target===P&&near(m,P)<12*TS)||(m.state==='chase'&&near(m,P)<4*TS)));
  if(P.spot){stop();if(window.__nobreath!==true&&G.monsters.some(m=>m.type==='tiger'&&m.state==='knock'&&m.spot===P.spot&&near(m,P)<40)&&P.breath>.2&&P.gasp<=0)K.Space=true;const danger=G.monsters.some(m=>!m.hidden&&near(m,P)<7*TS&&m.type!=='suigui');hideT=danger?0:hideT+1/60;if(hideT>3){KT.exitSpot(P);hideT=0}return}
  if(thr.length){
   const m=thr.sort((a,b)=>near(a,P)-near(b,P))[0];let best=null,bd=6*TS;for(const s of G.spots){if(s.occ.length>=s.cap)continue;if(m.type==='tiger'&&s.type!=='tree')continue;if(s.type==='well')continue;const d=near(s,P);if(d<bd&&near(s,m)>d*.9){bd=d;best=s}}
   if(best){if(near(best,P)<34){KT.hideIn(best);R.hides++;stop();return}steer(best.x,best.y,true);return}
   if(m.type==='jiang'){if(indoor(P)&&tAtPx(P.x,P.y)!=='d'&&near(m,P)>1.5*TS){stop();return}let bt=null,bd2=1e9;const px=Math.floor(P.x/TS),py=Math.floor(P.y/TS);for(let dy=-8;dy<=8;dy++)for(let dx=-8;dx<=8;dx++){const c=tileAt(px+dx,py+dy);if((c==='h'||c==='p')&&tileAt(px+dx,py+dy-1)!=='d'&&tileAt(px+dx,py+dy+1)!=='d'&&tileAt(px+dx-1,py+dy)!=='d'&&tileAt(px+dx+1,py+dy)!=='d'&&Math.hypot(dx,dy)<bd2){bd2=Math.hypot(dx,dy);bt={x:tc(px+dx),y:tc(py+dy)}}}if(bt){steer(bt.x,bt.y,true);return}}
   if(onGrass(P)&&m.type!=='mosin'&&m.type!=='jiang'&&!(m.target===P&&canSee(m,P)&&near(m,P)<3*TS)){stop();P.crouch=true;return}
   let bp=null,bs=-1e9;const ptx=Math.floor(P.x/TS),pty=Math.floor(P.y/TS);for(let k=0;k<16;k++){const a=k/16*6.283;for(const rr of[3,5]){const tx=Math.round(ptx+Math.cos(a)*rr),ty=Math.round(pty+Math.sin(a)*rr);if(!humanPass(tx,ty)||WATER.has(tileAt(tx,ty)))continue;if(!los(P.x,P.y,tc(tx),tc(ty)))continue;const sc=Math.min(...thr.map(t=>Math.hypot(tc(tx)-t.x,tc(ty)-t.y)))+(tileAt(tx,ty)==='g'?30:0);if(sc>bs){bs=sc;bp={x:tc(tx),y:tc(ty)}}}}
   if(bp)steer(bp.x,bp.y,true);return}
  P.crouch=false;
  const fol=G.humans.filter(h=>!h.isPlayer&&alive(h)&&h.state==='follow');
  const todo=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.lured&&!h.drown&&h.state!=='follow');
  let tgt;if(fol.length>=2||(!todo.length&&fol.length)||(G.night-G.t<70&&fol.length)){tgt={x:G.sc.truck[0],y:G.sc.truck[1]-30}}
  else if(todo.length){tgt=todo.sort((a,b)=>near(a,P)-near(b,P))[0];if(near(tgt,P)<30){stop();const it=KT.interactTarget();if(it&&it.fn&&/叫|拉/.test(it.label))it.fn();return}}
  else {stop();return}
  const d=steer(tgt.x,tgt.y,false);
  if(Math.hypot(P.x-lx,P.y-ly)<.3){if(++stuck>90){K.KeyW=!K.KeyW;stuck=0}}else stuck=0;lx=P.x;ly=P.y;
 }
 const total=G.night*60+60;let i=0;
 for(;i<total&&!G.over;i++){bot();KT.update(1/60);
  for(;lastLog<G.log.length;lastLog++){const l=G.log[lastLog];if(l.tag==='omen'&&R.omen1===null&&omens.has(l.text))R.omen1=+l.t.toFixed(1);if(l.tag==='omen'&&R.anyOmen1===undefined)R.anyOmen1=+l.t.toFixed(1)}
  for(const m of G.monsters)if(!seenM.has(m)){seenM.add(m);R.spawns.push([m.type,+G.t.toFixed(1)])}
  const tgtP=G.monsters.filter(m=>!m.hidden&&m.target===P);for(const m of tgtP)if(!prevT.has(m)){R.contacts++;if(R.contact1===null)R.contact1=+G.t.toFixed(1)}prevT=new Set(tgtP);
  if(R.cryLost==null&&G.flags.cry&&(G.flags.cry.dead||G.flags.cry.gone))R.cryLost=+G.t.toFixed(0);
  if(R.near1==null&&G.monsters.some(m=>!m.hidden&&near(m,P)<8*TS))R.near1=+G.t.toFixed(1);
  if(G.apparition&&!R.apps.some(a=>a[2]===G.apparition))R.apps.push([G.apparition.type,+G.t.toFixed(1),G.apparition]);
  if(i%600===0){const s=Math.floor(G.t/60);R.danger[Math.min(6,s)]+=0;R.heat[s]=+G.heat.toFixed(2)}
  if(G.danger>.5)R.danger[Math.min(6,Math.floor(G.t/60))]+=1/60;
  if(window.__trace&&i%20===0){const j=G.monsters.find(m=>m.type===window.__trace);if(j)(R.tr=R.tr||[]).push([+G.t.toFixed(1),+(near(j,P)/TS).toFixed(1),j.state,j.target===P?'P':j.target?j.target.name:'-',P.holding?'H':'',P.run?'R':'',indoor(P)?'in':'',P.breath.toFixed(1),P.gasp>0?'gasp':'',P.spot?P.spot.type:'']);if(R.tr&&R.tr.length>30)R.tr.shift()}
  if(i%1800===0)await new Promise(r=>setTimeout(r,0));}
 R.apps=R.apps.map(a=>[a[0],a[1],a[2].violated?'X':'ok']);R.end=G.over||'running';R.endT=+G.t.toFixed(0);R.saved=G.saved;
 R.lost=G.humans.filter(h=>!h.isPlayer&&(h.dead||h.gone)).length;R.danger=R.danger.map(x=>+x.toFixed(0));
 R.killer=G.scare&&G.scare.type;R.tail=G.log.slice(-6).map(l=>l.t.toFixed(0)+' '+l.text);for(const k in K)K[k]=false;return R})"""
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(700);pg.evaluate(f"window.__night={int(__import__('os').environ.get('NIGHT','-1'))}");t0=time.time();res=[]
  for s in range(1,N+1):
    r=pg.evaluate(JS,[s*7919+13,MOD,MODE]);res.append(r)
    print(json.dumps({k:r.get(k) for k in ['seed','mod','omen1','contact1','near1','cryLost','spawns','apps','end','endT','killer','saved','lost','contacts','danger']+(['tail','askD','tr'] if '-v' in sys.argv else [])},ensure_ascii=False),flush=True)
  f=lambda k:[r.get(k) for r in res if r.get(k) is not None]
  def ss(x):return f'med {st.median(x):.0f} min {min(x):.0f} max {max(x):.0f}' if x else '-'
  print('first omen',ss(f('omen1')));print('first spawn',ss([r['spawns'][0][1] for r in res if r['spawns']]))
  print('first contact (targets you)',ss(f('contact1')));print('first monster within 8 tiles',ss(f('near1')));print('screamer lost before 2:00',sorted(t for t in f('cryLost') if t<120),'of',N)
  sp=[t for r in res for _,t in r['spawns']];print('spawns by minute',[sum(1 for t in sp if m*60<=t<(m+1)*60) for m in range(7)])
  ap=[t for r in res for _,t,_ in r['apps']];print('apps by minute',[sum(1 for t in ap if m*60<=t<(m+1)*60) for m in range(7)])
  alive=[sum(1 for r in res if r['endT']>m*60) for m in range(7)];print('alive at minute start',alive);print('danger>.5 secs per alive run by minute',[round(sum(r['danger'][m] for r in res)/max(1,alive[m]),1) for m in range(7)])
  dead=[r for r in res if r['end'] in('dead','gone')];print('player died',len(dead),'/',N,' before 2:00',sum(1 for r in dead if r['endT']<120),' times',sorted(r['endT'] for r in dead),' killers',[r['killer'] for r in dead])
  print('ends',{e:sum(1 for r in res if r['end']==e) for e in set(r['end'] for r in res)},'saved avg',round(st.mean(r['saved'] for r in res),1),'errors',errs,'KT.err',pg.evaluate('KT.err||null'),'secs',round(time.time()-t0))
