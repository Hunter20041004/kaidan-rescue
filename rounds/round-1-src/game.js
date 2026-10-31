/* =====================================================================
   Game state and simulation.
   ===================================================================== */
const alive=h=>!(h.dead||h.gone||h.saved||h.escaped);
const onGrass=h=>tAtPx(h.x,h.y)==='g';
const inWater=h=>tAtPx(h.x,h.y)==='w';
const crouched=h=>h.isPlayer?h.crouch:(h.state==='hide'&&!h.spot);
const breathing=h=>!(h.holding&&h.breath>0);
const indoor=h=>{const t=tAtPx(h.x,h.y);return t==='h'||t==='d'||t==='p'};
const spotFree=s=>s.occ.length<s.cap;

function newGame(seed,sceneId){
  sceneId=sceneId||'village';seed=(seed>>>0)||((Math.random()*1e9)>>>0);RNG=mulberry32(seed);
  const sc=SCENES[sceneId];MW=sc.w;MH=sc.h;WW=MW*TS;WH=MH*TS;allocPath();
  const tut=sceneId==='tutorial';const modsOk=typeof modPool==='function'?modPool():MODS;const mod=tut?{id:'tut',name:'教學',yi:'學習',ji:'慌張',light:1.05,speed:1}:pick(modsOk);
  G={seed,sceneId,sc,tut,mod,t:0,over:null,paused:false,map:[],spots:[],humans:[],monsters:[],items:[],candies:[],noises:[],fx:[],decals:[],bubbles:[],wards:[],proj:[],fuses:[],
     log:[],incense:mod.incense||70,inv:{firecracker:tut?0:1,candy:0,incense:0,oil:0,talisman:tut?0:1},sel:0,saved:0,dawnSaved:0,seen:{},schedule:[],flags:{},stepAcc:0,hb:0,shake:0,danger:0,
     night:sc.night,omenQ:[],lamps:[],holy:new Set(),chunkVer:(G&&G.chunkVer||0)+1,
     props:[],dogs:[],clues:[],events:[],fires:[],sealed:new Set(),apps:[],apparition:null,darkUntil:0,flash:null,stats:{nearMiss:0,closest:99,doors:0,bells:0},silence:0,phase:0,heat:PACE.heat[0],final:false,scareT:PACE.firstScare[0]+rnd()*(PACE.firstScare[1]-PACE.firstScare[0]),scareN:0,lonely:0,lampsOff:0,fogUntil:0,scare:null};
  for(let y=0;y<MH;y++)G.map.push(Array(MW).fill('.'));
  const R=(x0,y0,x1,y1,c)=>{for(let y=Math.max(0,y0);y<=Math.min(MH-1,y1);y++)for(let x=Math.max(0,x0);x<=Math.min(MW-1,x1);x++)G.map[y][x]=c};
  const set=(x,y,c)=>{if(x>=0&&y>=0&&x<MW&&y<MH)G.map[y][x]=c};
  sc.build(R,set);
  if(sc.temple){const[x0,y0,x1,y1]=sc.temple;for(let y=y0;y<=y1;y++)for(let x=x0;x<=x1;x++){const c=G.map[y][x];if(c==='p'||c==='d')G.holy.add(y*MW+x)}}
  G.lamps=sc.lamps.map(([x,y],i)=>({tx:x,ty:y,x:tc(x),y:tc(y)-6,broken:hash(x,y,11)>.78,dead:false,ph:hash(x,y,12)*9}));
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++){const c=G.map[y][x];if('JUZX'.includes(c))G.props.push({type:c,tx:x,ty:y,x:tc(x),y:tc(y),cd:0,used:false,ring:0})}
  // hiding spots
  sc.cabinets.forEach((list,hi)=>{const l=shuffle(list.slice());const n=tut?1:1+(rnd()<.55?1:0);for(let i=0;i<Math.min(n,l.length);i++)addSpot('cabinet',l[i][0],l[i][1],hi)});
  shuffle(sc.hays.slice()).slice(0,4).forEach(([x,y])=>addSpot('hay',x,y,-1));
  shuffle(sc.trees.slice()).slice(0,tut?1:8).forEach(([x,y])=>addSpot('tree',x,y,-1));
  for(let y=0;y<MH;y++)for(let x=0;x<MW;x++)if(G.map[y][x]==='O')addSpot('well',x,y,-1);
  // player
  const P={isPlayer:true,name:'你',x:sc.start[0]*TS,y:sc.start[1]*TS,r:7,face:-Math.PI/2,crouch:false,run:false,spot:null,anim:0,shirt:'#33465f',breath:5,maxBreath:5,holding:false,gasp:0,action:null};
  G.player=P;G.humans.push(P);
  // survivors
  let pool=shuffle(NAMES.slice()).slice(0,sc.survivorCount);
  if(!tut&&!pool.some(n=>n.kind==='child'))pool[pool.length-1]=NAMES.find(n=>n.kind==='child'&&!pool.includes(n));
  if(tut)pool=[NAMES[0]];
  const slots=tut?sc.survivors.slice():shuffle(sc.survivors.slice());
  pool.forEach((n,i)=>{const sl=slots[i];const k=KIND[n.kind];
    const s={name:n.name,kind:n.kind,child:n.kind==='child',elder:n.kind==='elder',shirt:n.shirt,x:tc(sl[0]),y:tc(sl[1]),r:k.r,speed:k.speed,breath:k.breath,maxBreath:k.breath,
      holding:false,gasp:0,state:'wait',spot:null,anim:rnd()*9,face:rnd()*6,callT:2+rnd()*7,scream:0,calm:0,wasFollower:false,met:false};
    if(!tut&&sl[2]!==undefined&&rnd()<.4){const c=G.spots.find(p=>p.type==='cabinet'&&p.house===sl[2]&&!p.occ.length);if(c){s.spot=c;c.occ.push(s);s.x=c.x;s.y=c.y;s.state='hide'}}
    if(s.state==='wait'&&tAtPx(s.x,s.y)==='g')s.state='hide';
    G.humans.push(s)});
  if(!tut){const cand=G.humans.filter(h=>!h.isPlayer);shuffle(cand).slice(0,2+(rnd()<.5?1:0)).forEach(h=>{const q=shuffle(Object.keys(QUIRKS)).find(k=>QUIRKS[k].kinds.includes(h.kind));if(q)h.quirk=q})}
  shuffle((sc.dogs||[]).slice()).slice(0,4).forEach(([x,y])=>G.dogs.push({x:tc(x),y:tc(y),face:rnd()<.5?0:Math.PI,bark:0,cd:0,quiet:false,anim:rnd()*9,warn:0}));
  shuffle((sc.clues||[]).slice()).slice(0,3).forEach(([x,y])=>G.clues.push({x:tc(x),y:tc(y),bob:rnd()*6}));
  // items
  if(sc.itemCount){const bag=shuffle(['firecracker','firecracker','firecracker','candy','candy','candy','oil','oil','incense','incense','incense','talisman','talisman','talisman','firecracker','candy']).slice(0,sc.itemCount);
    shuffle(sc.items.slice()).slice(0,bag.length).forEach(([x,y],i)=>G.items.push({type:bag[i],x:tc(x),y:tc(y),bob:rnd()*6}))}
  // monster schedule
  if(!tut){const n=mod.count||PACE.times.length;const order=shuffle(MONSTER_ORDER.slice());const times=mod.times||PACE.times;
    // jitter and the swap below use the seed hash, not the game RNG, so the rest of the night's rolls stay unchanged
    if(order[0]==='suigui'){const j=1+Math.floor(hash(seed&65535,3,41)*(order.length-1));[order[0],order[j]]=[order[j],order[0]]} // the first contact has to be able to leave the water
    order.slice(0,n).forEach((type,i)=>{const t=times[i]+(i?0:hash(seed&65535,5,43)*PACE.jitter);G.schedule.push({t,type,omen:Math.max(0,t-(i?8:PACE.omenLead)),first:!i})});G.reserve=order.slice(n);
    G.events.push({t:11,type:'scream'});scheduleApparitions();shuffle(Object.keys(EVENTS)).slice(0,2).forEach((k,i)=>G.events.push({t:70+i*120+rnd()*80,type:k}))}
  G.chunks=new Map();
  log(tut?'教學開始。':'你停好貨車，熄了引擎。村子裡一盞燈也沒有。','info');
  return G;
}
function addSpot(type,tx,ty,house){G.map[ty][tx]={cabinet:'C',hay:'H',tree:'Y',well:'O'}[type];G.spots.push({id:G.spots.length,type,tx,ty,x:tc(tx),y:tc(ty),cap:HIDES[type].cap,occ:[],house,open:0,knock:0})}
function exitSpot(h){const s=h.spot;if(!s)return;s.occ=s.occ.filter(o=>o!==h);h.spot=null;
  let best=null,bd=1e9;for(const[dx,dy]of DIRS8){const tx=s.tx+dx,ty=s.ty+dy;if(!humanPass(tx,ty))continue;const d=Math.hypot(tc(tx)-G.player.x,tc(ty)-G.player.y)+(dx&&dy?6:0)+(WATER.has(tileAt(tx,ty))?40:0);if(d<bd){bd=d;best=[tx,ty]}}
  if(best){h.x=tc(best[0]);h.y=tc(best[1])}}
function enterSpot(h,s){if(h.spot)exitSpot(h);h.spot=s;s.occ.push(h);h.x=s.x;h.y=s.y;h.holding=false}

/* ---------------- lamps & doors ---------------- */
function lampOn(l){if(l.dead||G.mod.nolamps||G.t<G.lampsOff)return 0;if(!l.broken)return .9+Math.sin(G.t*11+l.ph)*.04;const k=Math.sin(G.t*1.7+l.ph)+Math.sin(G.t*7.3+l.ph*2);return k>.6?.8:k>.3?.25:0}
function inLampLight(h){for(const l of G.lamps)if(lampOn(l)>.3&&Math.hypot(l.x-h.x,l.y+10-h.y)<2.6*TS)return true;return false}
function doorTiles(tx,ty){const out=[[tx,ty]];for(const[dx,dy]of[[1,0],[-1,0],[0,1],[0,-1]]){const c=tileAt(tx+dx,ty+dy);if(c==='d'||c==='D')out.push([tx+dx,ty+dy])}return out}
function setDoor(tx,ty,closed){for(const[x,y]of doorTiles(tx,ty)){G.map[y][x]=closed?'D':'d';if(!closed)G.sealed.delete(x+','+y)}G.chunkVer++;if(G.chunks)G.chunks.clear()}
function doorBlocked(tx,ty){return doorTiles(tx,ty).some(([x,y])=>G.humans.some(h=>alive(h)&&!h.spot&&Math.floor(h.x/TS)===x&&Math.floor(h.y/TS)===y)||G.monsters.some(m=>!m.hidden&&Math.floor(m.x/TS)===x&&Math.floor(m.y/TS)===y))}
function onFire(tx,ty){const x=tc(tx),y=tc(ty);for(const f of G.fires)if(Math.hypot(x-f.x,y-f.y)<f.r)return true;return false}
function inSmoke(h){for(const w of G.wards)if(w.smoke&&Math.hypot(h.x-w.x,h.y-w.y)<w.r)return true;return false}
function puddleAt(tx,ty){return tileAt(tx,ty)==='r'&&hash(tx,ty,5)<.035}

/* ---------------- log / feedback ---------------- */
const clockStr=t=>{const m=Math.max(0,Math.floor(t));return Math.floor(m/60)+':'+String(m%60).padStart(2,'0')};
function log(text,tag){G.log.push({t:G.t,text,tag});if(tag&&tag!=='info')UI.sub(text,tag)}
function bubble(ent,text,kind,life){G.bubbles=G.bubbles.filter(b=>b.ent!==ent);G.bubbles.push({ent,x:ent.x,y:ent.y,text,kind:kind||'voice',t:0,life:life||2.6})}
function noise(x,y,r,kind,src){const n={x,y,r,kind,src,t:0};G.noises.push(n);for(const m of G.monsters)if(!m.hidden&&Math.hypot(m.x-x,m.y-y)<=r)onNoise(m,n);return n}
function fx(type,x,y,o){const f=Object.assign({type,x,y,t:0,life:1},o||{});G.fx.push(f);return f}
function decal(type,x,y,o){G.decals.push(Object.assign({type,x,y,rot:rnd()*6.28,s:.8+rnd()*.4},o||{}));if(G.decals.length>220)G.decals.shift()}

/* ---------------- monsters ---------------- */
function monsterPass(m){
  const t=m.type,holy=MONSTERS[t].holy;
  const base=(tx,ty)=>{const c=tileAt(tx,ty);if(t==='suigui')return WATER.has(c);if(SOLID.has(c)||c==='D')return false;if(G.fires.length&&onFire(tx,ty))return false;if(t==='jiang'&&(c==='d'||c==='h'||c==='p'))return false;return true};
  if(!holy)return base;
  const blocked=(tx,ty)=>(G.incense>0&&G.holy.has(ty*MW+tx))||inWard(tx,ty);
  const here=blocked(Math.floor(m.x/TS),Math.floor(m.y/TS));
  return here?base:(tx,ty)=>base(tx,ty)&&!blocked(tx,ty);
}
function holyBlockedAt(m){return MONSTERS[m.type].holy&&((G.incense>0&&G.holy.has(Math.floor(m.y/TS)*MW+Math.floor(m.x/TS)))||inWard(Math.floor(m.x/TS),Math.floor(m.y/TS)))}
function spawnMonster(type,at){
  const def=MONSTERS[type],P=G.player;let sp;
  if(at)sp=at;else{const list=(G.sc.spawns[def.spawn]||[[2,2]]).map(([x,y])=>({x:tc(x),y:tc(y)})).sort((a,b)=>dist(b,P)-dist(a,P));sp=pick(list.slice(0,2))}
  const m={type,def,x:sp.x,y:sp.y,r:def.r,state:'patrol',face:Math.PI/2,anim:rnd()*9,goal:null,timer:0,cool:{nm:6},target:null,ignore:null,mimic:9+rnd()*8,stepT:0,chaseT:0,hop:0,alertT:0,born:G.t,vis:0,cueT:2+rnd()*3};
  G.monsters.push(m);G.seen[type]=true;
  if(!G.tut){UI.meet(type);log(`${def.name}出現了。`,'info');SND.omen()}
  return m;
}
// the first monster of the night starts within earshot (about PACE.firstNear tiles away, never closer than 11), not across the map;
// it goes where the opening scream came from, so heading for that villager is heading for the first contact
function midSpawn(type){const P=G.player,list=(G.sc.spawns[MONSTERS[type].spawn]||[[2,2]]).map(([x,y])=>({x:tc(x),y:tc(y)}));const k=a=>{const d=dist(a,P)/TS;return Math.abs(d-PACE.firstNear)+(d<11?40:0)};list.sort((a,b)=>k(a)-k(b));return list[0]}
const stalkTime=()=>G.final?PACE.finalStalk:PACE.stalk[G.phase]||PACE.stalk[0];
function setState(m,s,timer){m.state=s;m.timer=timer||0;m.goal=null;m.path=null}
function farPoint(fx,fy,m){let best=null,bd=-1;const pass=monsterPass(m);for(let i=0;i<18;i++){const tx=1+Math.floor(rnd()*(MW-2)),ty=1+Math.floor(rnd()*(MH-2));if(!pass(tx,ty))continue;const d=Math.hypot(tc(tx)-fx,tc(ty)-fy)-Math.hypot(tc(tx)-m.x,tc(ty)-m.y)*.3;if(d>bd){bd=d;best={x:tc(tx),y:tc(ty)}}}return best||{x:m.x,y:m.y}}
function flee(m,fx,fy,time){if(m.led)release(m);if(m.dragging)releaseDrown(m);setState(m,'flee',time);m.target=null;m.goal=farPoint(fx,fy,m);m.fx=fx;m.fy=fy}
function release(m){const h=m.led;if(h){h.lured=null;h.luredT=0;if(!h.isPlayer){h.state='stay';bubble(h,'……我剛剛怎麼了？')}}m.led=null}
function releaseDrown(m){const h=m.dragging;if(h){h.drown=null;if(!h.isPlayer){h.state=h.wasFollower?'follow':'stay';bubble(h,'咳、咳咳……')}}m.dragging=null}
function hiddenFrom(m,h){if(h.spot)return true;if(h.climb)return false;if(onGrass(h)&&crouched(h)&&m.type!=='mosin'&&m.type!=='jiang')return true;return false}
function canSee(m,h){
  if(!alive(h)||h.lured||h.drown||hiddenFrom(m,h))return false;if(m.ignore&&m.ignore.h===h&&G.t<m.ignore.until)return false;
  const d=dist(m,h);
  if(m.type==='jiang'){if(!breathing(h)||inSmoke(h))return false;let r=5.5*TS*(h.isPlayer&&h.run?1.45:1)*(h.gasp>0?1.7:1)*(indoor(h)?.55:1)*(G.mod.noise||1)*(m.tame?.6:1);return d<r}
  if(m.type==='suigui')return inWater(h)&&d<9*TS;
  if(m.type==='mosin'&&onGrass(h))return d<8*TS;
  const range=m.def.sight*TS*(crouched(h)?.6:1)*(h.isPlayer&&h.run?1.25:1)*(G.mod.id==='fog'||G.t<G.fogUntil?.75:1)*(inLampLight(h)?1.5:1)*(inSmoke(h)?.5:1);if(d>range)return false;return los(m.x,m.y,h.x,h.y)}
function smell(m){
  if(m.type!=='tiger')return null;let best=null,bd=7*TS;
  for(const h of G.humans)if(h.child&&alive(h)&&!h.spot&&!h.lured&&!h.drown&&!inSmoke(h)){const d=dist(m,h);if(d<bd&&!(m.ignore&&m.ignore.h===h&&G.t<m.ignore.until)){bd=d;best=h}}return best}
const smellRange=h=>(h.child?7:3.5)*TS;
function onNoise(m,n){
  if(['flee','stun','lead','drag','sealed','sated','eat','ask'].includes(m.state))return;
  if(m.tame&&m.script&&m.state!=='chase'&&n.kind!=='bang')return;
  const d=Math.hypot(m.x-n.x,m.y-n.y);
  if(m.type==='mosin'){if((n.kind==='bang'||n.kind==='bell')&&d<(n.kind==='bell'?5:7)*TS){flee(m,n.x,n.y,9);bubble(m,'嘻——！','monster',1.5);(n.scared=n.scared||[]).push(m)}return}
  if(m.type==='suigui'){if(n.kind==='splash'&&m.state!=='chase'){setState(m,'investigate',7);m.goal={x:n.x,y:n.y};(n.drawn=n.drawn||[]).push(m)}return}
  if(n.kind==='splash')return;
  if((m.state==='chase'||m.state==='stalk')&&n.kind!=='bang')return;
  if(m.state==='chase'&&m.target&&dist(m,m.target)<3*TS)return;
  setState(m,'investigate',9);m.goal={x:n.x,y:n.y};m.target=null;if(n.kind==='bang')(n.drawn=n.drawn||[]).push(m);
}
function catchHuman(m,h){
  if(m.tame){UI.tutFail(m);return}
  if(m.type==='mosin'){
    if(h.spot)exitSpot(h);h.lured=m;h.luredT=0;h.mash=0;m.led=h;setState(m,'lead');m.goal=farGrass(m);
    if(h.isPlayer)log('魔神仔牽起你的手。你忽然很想跟祂走。','death');else{h.state='lured';log(`${h.name}被魔神仔牽走了。`,'death');bubble(h,'……好，我跟你走。')}
    SND.giggle();return}
  if(m.type==='suigui'){h.drown={m,t:0};h.mash=0;m.dragging=h;setState(m,'drag');SND.splash();
    if(h.isPlayer)log('水裡有手抓住你的腳踝！','death');else{h.state='drown';log(`${h.name}被拖進水裡了！`,'death');bubble(h,'救——咕嚕……','scream',1.6)}return}
  kill(h,m);
}
function kill(h,m){
  if(h.spot)exitSpot(h);h.dead=true;h.killer=m.def.name;decal('blood',h.x,h.y,{child:h.child,name:h.name});SND.scream(h.child);G.shake=.45;
  if(h.isPlayer){G.scare={type:m.type,t:0};log(`你被${m.def.name}抓住了。`,'death');return}
  const P=G.player;
  if(P.spot&&dist(P,h)<9*TS)log(`你躲在${HIDES[P.spot.type].name}裡，聽著${h.name}被${m.def.name}抓走。`,'regret');
  else if(h.state==='stay'&&h.wasFollower&&dist(P,h)>10*TS)log(`${h.name}還在原地等你回來，${m.def.name}先到了。`,'regret');
  else log(`${h.name}被${m.def.name}抓住了。`,'death');
  if(m.type==='tiger')bubble(m,'乖孩子……','monster');
}
function seal(m,time){if(m.type!=='jiang')return;setState(m,'sealed',time);m.sealed=true;SND.paper()}
function farGrass(m){let best=null,bd=-1;for(let i=0;i<40;i++){const tx=1+Math.floor(rnd()*(MW-2)),ty=1+Math.floor(rnd()*(MH-2));if(tileAt(tx,ty)!=='g')continue;const d=-Math.abs(Math.hypot(tc(tx)-m.x,tc(ty)-m.y)-9*TS);if(d>bd){bd=d;best={x:tc(tx),y:tc(ty)}}}return best||{x:m.x,y:m.y}}
function patrolGoal(m){
  if(m.script){const p=m.script.pts[m.script.i];if(p)return p;m.done=true;return{x:m.x,y:m.y}}
  const pass=monsterPass(m),P=G.player;
  for(let i=0;i<60;i++){
    // bias patrols toward the player's half of the map so the night keeps moving
    let tx,ty;if(rnd()<(G.final?.85:G.phase>=1?.6:.45)){tx=Math.floor(P.x/TS)+Math.floor((rnd()-.5)*30);ty=Math.floor(P.y/TS)+Math.floor((rnd()-.5)*22)}else{tx=1+Math.floor(rnd()*(MW-2));ty=1+Math.floor(rnd()*(MH-2))}
    if(tx<1||ty<1||tx>=MW-1||ty>=MH-1||!pass(tx,ty))continue;const t=tileAt(tx,ty);
    if(m.type==='mosin'&&t!=='g'&&rnd()<.8)continue;if(m.type==='tiger'&&t!=='h'&&t!=='d'&&rnd()<.55)continue;if(m.type==='jiang'&&t!=='.'&&t!=='r'&&t!=='s'&&rnd()<.5)continue;
    return{x:tc(tx),y:tc(ty)}}return{x:m.x,y:m.y}}
function updMonster(m,dt){
  const def=m.def,spd=G.mod.speed*(m.tame?.85:G.heat);let pass=monsterPass(m);m.anim+=dt;m.moving=false;for(const k in m.cool)m.cool[k]-=dt;m.alertT-=dt;
  if(m.hidden){m.timer-=dt;if(m.timer<=0){m.hidden=false;const w=pick(G.sc.spawns.water);m.x=tc(w[0]);m.y=tc(w[1]);setState(m,'patrol');bubble(m,'……','monster',1.5)}return}
  if(m.state!=='flee'&&holyBlockedAt(m))flee(m,m.x,m.y,2.5);
  const step=(x,y,s)=>{if(m.type==='jiang'){m.hop+=dt*2.2;const ph=m.hop%1;const k=ph<.55?1.9:0.05;return navTo(m,x,y,s*k,dt,pass)}return navTo(m,x,y,s,dt,pass)};
  switch(m.state){
  case 'flee':m.timer-=dt;step(m.goal.x,m.goal.y,def.chase*spd);if(m.timer<=0)setState(m,'patrol');return;
  case 'stun':m.timer-=dt;if(m.timer<=0){setState(m,'patrol');m.cool.acq=1.5}return;
  case 'sealed':m.timer-=dt;if(m.timer<=0){m.sealed=false;setState(m,'patrol');m.cool.acq=2;bubble(m,'（符咒燒成了灰）','monster',1.8);decal('ash',m.x,m.y)}return;
  case 'ask':{const h=m.target;if(!h||!alive(h)){setState(m,'patrol');m.target=null;return}
    // she walks up to you while asking; the countdown only runs once she is close enough to be answered
    const far=!m.tame&&dist(m,h)>3.2*TS;if(far){m.askWalk=(m.askWalk||0)+dt;if(!canSee(m,h)){m.lost=(m.lost||0)+dt;if(m.lost>1.5){setState(m,'search',2.5);m.target=null;return}}else m.lost=0;navTo(m,h.x,h.y,def.speed*spd,dt,pass)}
    if(!far||m.askWalk>7){if(!m.askNear){m.askNear=true;if(m.askWalk>.5)bubble(m,'我……漂亮嗎？','monster',2.4)}m.timer-=dt}
    m.face=Math.atan2(h.y-m.y,h.x-m.x);if(m.timer<=0){m.state='chase';m.chaseT=0;m.askWalk=0;m.askNear=false}return}
  case 'lead':{const h=m.led;if(!h||!alive(h)){m.led=null;setState(m,'patrol');return}
    h.luredT+=dt;navTo(m,m.goal.x,m.goal.y,50*spd,dt,pass);
    if(!h.isPlayer){navTo(h,m.x-Math.cos(m.face)*14,m.y-Math.sin(m.face)*14,58,dt,humanPass);h.moving=true;
      if(h.luredT>11){h.gone=true;h.state='gone';h.lured=null;m.led=null;decal('shoes',h.x,h.y);log(`${h.name}消失在草叢裡，只剩一雙鞋。`,'death');setState(m,'patrol');m.cool.acq=6}}
    else if(h.luredT>8.5){h.gone=true;m.led=null;G.scare={type:'mosin',t:0};log('你跟著魔神仔走進了草叢深處。','death')}
    return}
  case 'drag':{const h=m.dragging;if(!h||!alive(h)){m.dragging=null;setState(m,'patrol');return}
    h.drown.t+=dt;m.x+=(h.x-m.x)*.2;m.y+=(h.y-m.y)*.2;
    // pull the victim toward deep water
    let best=null,bd=1e9;for(let dy=-3;dy<=3;dy++)for(let dx=-3;dx<=3;dx++){const tx=Math.floor(h.x/TS)+dx,ty=Math.floor(h.y/TS)+dy;if(tileAt(tx,ty)==='W'){const d=Math.hypot(tc(tx)-h.x,tc(ty)-h.y);if(d<bd){bd=d;best={x:tc(tx),y:tc(ty)}}}}
    if(best&&bd>10){const a=Math.atan2(best.y-h.y,best.x-h.x);h.x+=Math.cos(a)*22*dt;h.y+=Math.sin(a)*22*dt}
    if(G.t%0.5<dt)fx('ripple',h.x,h.y,{life:1.2});
    if(h.drown.t>(h.isPlayer?3.4:3)){h.dead=true;h.drown=null;h.killer='水鬼';decal('ripplemark',h.x,h.y);m.dragging=null;
      if(h.isPlayer)G.scare={type:'suigui',t:0};log(h.isPlayer?'冰冷的水灌進你的嘴裡。':`${h.name}沉進了水裡。水鬼抓到交替了。`,'death');SND.drown();
      m.hidden=true;m.timer=55;setState(m,'sated')}
    return}
  case 'eat':{const c=m.candy;if(!c||c.gone){setState(m,'patrol');return}
    if(dist(m,c)>8){navTo(m,c.x,c.y,def.chase*.8*spd,dt,pass);m.timer=m.eatFor||6;return}
    m.timer-=dt;if(m.timer<=0){c.gone=true;setState(m,'patrol');m.cool.acq=1}return}
  case 'knock':{const s=m.spot;navTo(m,s.x,s.y,def.speed*1.3*spd,dt,pass);
    if(dist(m,s)<38){m.face=Math.atan2(s.y-m.y,s.x-m.x);m.timer+=dt;s.knock=m.timer;
      if(Math.floor(m.timer/.7)!==Math.floor((m.timer-dt)/.7)){SND.knock();if(m.timer<.8)bubble(m,s.type==='hay'?'嗅、嗅……草裡面有人吧？':'叩、叩、叩……乖孩子，開門，姑婆來了。','monster',2.8)}
      if(m.timer>2.6){s.open=1.2;s.knock=0;m.cool['s'+s.id]=22;const occ=s.occ.slice();
        if(occ.length){log(s.type==='hay'?'虎姑婆扒開了草垛。':'虎姑婆打開了衣櫃。','info');for(const h of occ){exitSpot(h);h.x=s.x;h.y=s.y+4;catchHuman(m,h)}}
        else bubble(m,'嘖，沒人。','monster',1.6);
        if(m.state==='knock')setState(m,'patrol')}}
    else if(m.timer===0&&!m.reach&&m.path&&m.path.length===0){m.cool['s'+s.id]=10;setState(m,'patrol')}
    break}
  case 'camp':{const s=m.spot;m.timer-=dt;navTo(m,s.x,s.y+20,def.speed*spd,dt,pass);m.face=Math.atan2(s.y-m.y,s.x-m.x);
    if(m.timer<=0||!s.occ.length){m.cool['s'+s.id]=25;setState(m,'patrol');if(s.occ.length)bubble(m,'哼，姑婆明天再來。','monster')}
    else if(rnd()<dt*.25)bubble(m,pick(['下來吧，姑婆給你糖吃。','姑婆在樹下等你喔……','腿痠了吧？下來呀。']),'monster',2.6);
    break}
  case 'sated':return;
  case 'bash':{const dt0=m.door;m.timer-=dt;m.face=Math.atan2(tc(dt0[1])-m.y,tc(dt0[0])-m.x);m.bashT=(m.bashT||0)-dt;
    if(m.bashT<=0){m.bashT=.45;SND.cue('doorbang',tc(dt0[0]),tc(dt0[1]));fx('dust',tc(dt0[0]),tc(dt0[1]),{life:.5});if(dist(m,G.player)<6*TS)G.shake=Math.max(G.shake,.12)}
    if(tileAt(dt0[0],dt0[1])!=='D'){setState(m,'chase');return}
    if(G.sealed.has(dt0[0]+','+dt0[1])&&m.timer<(m.sealT0||9)-1.4){bubble(m,'……符？','monster',1.4);m.cool.acq=4;setState(m,'patrol');return}
    if(m.timer<=0){setDoor(dt0[0],dt0[1],false);log(`${def.name}撞開了門！`,'death');noise(tc(dt0[0]),tc(dt0[1]),6*TS,'bang',m);setState(m,'chase');m.target=m.target||G.player}
    return}
  }
  if(['flee','stun','ask','lead','eat','drag','sealed','bash'].includes(m.state))return;
  // perception
  if(!(m.cool.acq>0)){
    let seen=null,bd=1e9;for(const h of G.humans)if(canSee(m,h)){const d=dist(m,h);if(d<bd){bd=d;seen=h}}
    if(!seen)seen=smell(m);
    if(seen){if(m.state!=='chase'&&m.state!=='stalk'){m.target=seen;m.chaseT=0;m.blockT=0;m.alertT=1.2;if(seen.isPlayer)SND.sting();
        if(m.type==='kuchi'){setState(m,'ask',m.tame?.9:2.2);m.askWalk=0;m.askNear=false;m.lost=0;m.target=seen;bubble(m,'我……漂亮嗎？','monster',2.4);SND.whisper();m.lastX=seen.x;m.lastY=seen.y;return}
        const sk=stalkTime();if(!m.tame&&m.type!=='suigui'&&sk>.15&&dist(m,seen)>2*TS){setState(m,'stalk',sk);m.target=seen;m.lost=0}else setState(m,'chase');m.target=seen;
        if(m.type==='tiger'&&seen.child)bubble(m,'好香的孩子……','monster');else if(m.state==='stalk')bubble(m,{tiger:'……嗯？',mosin:'嘻嘻……',jiang:'嗬……'}[m.type]||'……','monster',1.4);if(m.type==='jiang'&&m.state==='chase')bubble(m,'嗬——','monster',1.2)}
      else if(seen!==m.target&&dist(m,seen)<dist(m,m.target)*.6)m.target=seen;
      m.lastX=m.target.x;m.lastY=m.target.y;m.lost=0}
  }
  // near miss: a hidden player right next to a monster that doesn't notice — it lingers, then leaves
  {const P=G.player;if(alive(P)&&!m.tame&&['patrol','investigate','search'].includes(m.state)&&!(m.cool.nm>0)&&m.target!==P&&dist(m,P)<1.8*TS&&(hiddenFrom(m,P)||(m.type==='jiang'&&!breathing(P)))){
    m.cool.nm=22;setState(m,'search',2.2);m.face=Math.atan2(P.y-m.y,P.x-m.x)+(rnd()-.5)*.8;G.stats.nearMiss++;G.flags.nearT=G.t;
    log({mosin:'魔神仔在你旁邊蹲下來，嘻嘻笑了兩聲，又走了。',tiger:'虎姑婆停在你身邊，用力嗅了嗅……然後走開了。',kuchi:'裂口女在你面前停下腳步，左右張望了很久。',jiang:'殭屍的指甲，差一點碰到你的臉。',suigui:'水面下有東西擦過你的腳邊。'}[m.type],'clutch')}}
  // type specials while idle
  if(m.type==='tiger'&&(m.state==='patrol'||m.state==='investigate'||m.state==='search')){
    for(const s of G.spots){if(m.cool['s'+s.id]>0)continue;const d=dist(m,s);if(d>8*TS)continue;
      const smelled=s.occ.some(h=>d<smellRange(h)&&!inSmoke(h));
      if((s.type==='cabinet'||s.type==='hay')&&(smelled||(d<2.2*TS&&!(m.cool.rand>0)&&rnd()<.5))){if(!smelled)m.cool.rand=25;setState(m,'knock');m.spot=s;break}
      if(s.type==='tree'&&smelled){setState(m,'camp',14);m.spot=s;bubble(m,'聞到了……在上面。','monster');log('虎姑婆在樹下停住，抬起了頭。','info');break}}
  }
  if(m.type==='kuchi'&&m.state==='patrol')for(const c of G.candies)if(!c.gone&&dist(m,c)<6*TS){setState(m,'eat');m.candy=c;break}
  if(m.type==='mosin'&&m.state!=='chase'&&!m.tame){m.mimic-=dt;if(m.mimic<=0){m.mimic=13+rnd()*10;const v=G.humans.filter(h=>!h.isPlayer&&alive(h)&&h.state!=='follow');
      if(v.length&&dist(m,G.player)>5*TS&&dist(m,G.player)<18*TS){bubble(m,`${pick(v).name}：救命……`,'voice',3)}}}
  if(m.type==='jiang'&&m.state!=='chase'){const P=G.player;if(P.holding&&dist(m,P)<1.6*TS&&!(G.flags.jclose>G.t)){G.flags.jclose=G.t+25;log('你屏住呼吸。殭屍從你鼻尖前跳了過去。','clutch')}
    const stuck=G.humans.find(h=>alive(h)&&indoor(h)&&dist(m,h)<2.2*TS&&breathing(h));if(stuck&&!(G.flags.jdoor>G.t)){G.flags.jdoor=G.t+40;bubble(m,'嗬……嗬……','monster',2);log('殭屍卡在門檻外，一跳一跳地不肯走。','absurd')}}
  switch(m.state){
  case 'chase':{const h=m.target;
    if(!h||!alive(h)||h.lured||h.drown){setState(m,'patrol');m.target=null;break}
    const vis=canSee(m,h)||smell(m)===h;if(vis){m.lastX=h.x;m.lastY=h.y;m.lost=0}else m.lost=(m.lost||0)+dt;
    m.chaseT+=dt;let sp=def.chase;if(m.type==='kuchi'&&m.chaseT>6)sp=125;if(m.tame)sp*=.85;
    step(vis?h.x:m.lastX,vis?h.y:m.lastY,sp*spd);
    if(!m.reach&&indoor(h)&&m.type!=='jiang'&&m.type!=='suigui'){const mx=Math.floor(m.x/TS),my=Math.floor(m.y/TS);let door=null;for(let dy=-2;dy<=2&&!door;dy++)for(let dx=-2;dx<=2;dx++)if(tileAt(mx+dx,my+dy)==='D'){door=[mx+dx,my+dy];break}
      if(door&&dist(m,h)<9*TS){m.sealT0={tiger:1.6,kuchi:2.6,mosin:3.2}[m.type]||2.5;setState(m,'bash',{tiger:1.6,kuchi:2.6,mosin:3.2}[m.type]||2.5);m.door=door;m.target=h;bubble(m,{tiger:'乖孩子，開門……',kuchi:'……開門。',mosin:'嘻嘻，開門嘛。'}[m.type]||'……','monster',1.6);break}}
    if(!m.reach&&vis){m.blockT+=dt;if(m.blockT>2&&!m.blockLogged&&G.holy.has(Math.floor(h.y/TS)*MW+Math.floor(h.x/TS))){m.blockLogged=true;log(`${def.name}堵在廟門口，盯著裡面。`,'absurd')}
      if(m.blockT>11){m.ignore={h,until:G.t+10};setState(m,'patrol');m.blockLogged=false}}else m.blockT=0;
    if(vis&&dist(m,h)<m.r+h.r+4&&!hiddenFrom(m,h)){catchHuman(m,h);if(m.state==='chase')setState(m,'patrol');m.target=null;if(!m.cool.acq||m.cool.acq<2)m.cool.acq=m.type==='mosin'?0:2}
    else if(!vis&&Math.hypot(m.x-m.lastX,m.y-m.lastY)<12)setState(m,'search',2.5);
    else if(m.lost>6)setState(m,'patrol');
    break}
  case 'stalk':{const h=m.target; // it has seen you: it walks your way, watching, then charges
    if(!h||!alive(h)||h.lured||h.drown){setState(m,'patrol');m.target=null;break}
    const vis=canSee(m,h)||smell(m)===h;if(vis){m.lastX=h.x;m.lastY=h.y;m.lost=0}else m.lost=(m.lost||0)+dt;m.timer-=dt;
    step(m.lastX,m.lastY,def.speed*1.1*spd);
    if(m.lost>1.2){const x=m.lastX,y=m.lastY;setState(m,'investigate',6);m.goal={x,y};m.target=null}
    else if(m.timer<=0||dist(m,h)<2*TS){setState(m,'chase');m.target=h;m.chaseT=0;m.blockT=0;if(h.isPlayer)SND.cue(m.type,m.x,m.y,true);if(m.type==='jiang')bubble(m,'嗬——','monster',1.2)}
    break}
  case 'investigate':m.timer-=dt;if(step(m.goal.x,m.goal.y,def.speed*1.35*spd)||m.timer<=0||Math.hypot(m.x-m.goal.x,m.y-m.goal.y)<14)setState(m,'search',2);break;
  case 'search':m.timer-=dt;m.face+=dt*2.4;if(m.timer<=0)setState(m,'patrol');break;
  case 'patrol':
    if(!m.goal){m.goal=patrolGoal(m);m.timer=16}m.timer-=dt;
    if(step(m.goal.x,m.goal.y,def.speed*spd)||m.timer<=0||Math.hypot(m.x-m.goal.x,m.y-m.goal.y)<12){if(m.script&&m.script.pts[m.script.i]===m.goal)m.script.i++;m.goal=null}
    break;
  }
  if(m.moving){m.stepT-=dt;if(m.stepT<=0){m.stepT=m.state==='chase'?.28:.5;const dP=dist(m,G.player);
    if(dP<12*TS){if(m.type==='suigui')fx('ripple',m.x,m.y,{life:1.2});else if(m.type!=='mosin')fx('step',m.x,m.y,{life:.9,big:m.type==='tiger'||m.type==='jiang'||m.state==='chase'});
      if(m.type==='jiang')SND.hop(dP);}}}
  m.cueT-=dt;if(m.cueT<=0){m.cueT=m.state==='chase'?.9+rnd()*.5:3.5+rnd()*4;if(dist(m,G.player)<16*TS)SND.cue(m.type,m.x,m.y,m.state==='chase')}
}

/* ---------------- survivors ---------------- */
function threatTo(s){let best=null,bd=1e9;for(const m of G.monsters){if(m.hidden||['flee','stun','eat','sealed','sated'].includes(m.state))continue;const d=dist(m,s);
  if(m.type==='suigui'&&!inWater(s))continue;
  // a monster that cannot reach this spot (temple with incense, ward, threshold) is not worth running from
  const stx=Math.floor(s.x/TS),sty=Math.floor(s.y/TS);if(MONSTERS[m.type].holy&&((G.incense>0&&G.holy.has(sty*MW+stx))||inWard(stx,sty)))continue;if(m.type==='jiang'&&indoor(s))continue;
  const R=(s.quirk==='timid'?8:s.quirk==='brave'?4.5:6)*TS;if(d<R&&(m.target===s||(m.type==='jiang'?d<4*TS:los(m.x,m.y,s.x,s.y)))&&d<bd){bd=d;best=m}}return best}
function panic(s,threat,reason){
  const P=G.player;let goal=null,bd=8*TS;
  if(!(threat&&threat.type==='suigui'))for(const sp of G.spots){const free=sp.cap-sp.occ.length-G.humans.filter(h=>h!==s&&h.goalSpot===sp&&h.state==='panic').length;if(free<=0)continue;
    if(threat&&threat.type==='tiger'&&sp.type!=='tree'&&s.child)continue;const d=dist(s,sp);if(d<bd){bd=d;goal=sp}}
  s.goalSpot=goal;s.goalGrass=null;
  const wantLand=threat&&threat.type==='suigui';
  if(!goal){const okT=t=>wantLand?(!WATER.has(t)&&!SOLID.has(t)):(t==='g'&&!(threat&&(threat.type==='mosin'||threat.type==='jiang')));
    for(let r=0;r<6&&!s.goalGrass;r++)for(let dy=-r;dy<=r;dy++)for(let dx=-r;dx<=r;dx++){const tx=Math.floor(s.x/TS)+dx,ty=Math.floor(s.y/TS)+dy;if(okT(tileAt(tx,ty))&&!s.goalGrass)s.goalGrass={x:tc(tx),y:tc(ty),land:wantLand}}}
  s.state='panic';s.panicT=0;s.threat=threat;
  if(reason==='playerHid'&&!goal&&!s.goalGrass&&!G.flags['nohide'+s.name]){G.flags['nohide'+s.name]=1;log(`你躲了起來，${s.name}在外面找不到地方躲。`,'regret')}
  if(threat&&s.scream<=0&&threat.type!=='jiang'&&s.quirk!=='brave'){s.scream=6;bubble(s,s.child?'哇啊啊——！':'有鬼！！','scream',1.6);noise(s.x,s.y,(s.child?9:7)*TS*(s.quirk==='timid'?1.4:1),'scream',s)}
}
function updBreath(h,dt){
  if(h.gasp>0){h.gasp-=dt;h.holding=false}
  if(h.holding&&h.breath>0){h.breath-=dt;if(h.breath<=0){h.breath=0;h.holding=false;h.gasp=1.6;bubble(h,'噗哈——！','scream',1.2);noise(h.x,h.y,5*TS,'gasp',h);
      if(!h.isPlayer&&G.monsters.some(m=>m.type==='jiang'&&dist(m,h)<7*TS)&&!G.flags['gasp'+h.name]){G.flags['gasp'+h.name]=1;log(`${h.name}憋不住氣了。殭屍轉過頭來。`,'regret')}}}
  else if(!h.holding)h.breath=Math.min(h.maxBreath,h.breath+dt*.9);
}
function updSurv(s,dt){
  if(!alive(s)||s.lured||s.drown)return;s.anim+=dt;s.moving=false;if(s.frozen){updBreath(s,dt);return}s.scream-=dt;const P=G.player;const threat=threatTo(s);
  // copy the player's held breath when close
  const copy=P.holding&&!P.spot&&dist(P,s)<5*TS&&(s.state==='follow'||s.state==='stay'||(s.state==='hide'&&!s.spot));
  if(copy&&!s.holding&&s.gasp<=0&&s.breath>.5)s.holding=true;if(!copy)s.holding=false;
  updBreath(s,dt);
  if(s.state==='follow'||s.state==='panic'){if(tAtPx(s.x,s.y)==='x'||(s.state==='follow'&&tAtPx(P.x,P.y)==='x'&&dist(s,P)<2.5*TS)){saveSurv(s);return}}
  const spd=s.speed*(inWater(s)?.6:1)*(s.holding?.6:1);
  switch(s.state){
  case 'wait':case 'stay':
    if(threat&&!(threat.type==='jiang'&&s.holding))panic(s,threat);
    else if(s.state==='wait'&&(s.callT-=dt)<=0){s.callT=8+rnd()*8;if(dist(s,P)<20*TS)bubble(s,`${s.name}：救命……`,'voice',3)}
    else if(s.state==='stay'&&s.quirk==='wander'){s.wanderT=(s.wanderT||0)+dt;if(s.wanderT>16){s.wanderT=0;s.state='roam';s.roam={x:s.x+(rnd()-.5)*8*TS,y:s.y+(rnd()-.5)*8*TS,t:6};bubble(s,pick(['我去那邊看一下下……','有螢火蟲！','我想尿尿……']),'voice',2);if(!G.flags.wander){G.flags.wander=1;log(`${s.name}趁你不注意，自己跑開了。`,'regret')}}}
    break;
  case 'roam':{if(threat){panic(s,threat);break}s.roam.t-=dt;if(navTo(s,s.roam.x,s.roam.y,spd*.8,dt,humanPass)||s.roam.t<=0)s.state='stay';break}
  case 'follow':{
    if(P.spot&&!P.climb){panic(s,threat,'playerHid');break}
    if(threat&&dist(P,s)>5*TS&&!(threat.type==='jiang'&&s.holding)){panic(s,threat);break}
    if(threat&&threat.type!=='jiang'&&s.scream<=0&&s.child){s.scream=5;bubble(s,'怕怕……','scream',1.4);noise(s.x,s.y,6*TS,'scream',s)}
    const d=dist(s,P);if(d>30)navTo(s,P.x,P.y,spd*(d>110?1.12:1)*(threat?1.1:1),dt,humanPass);
    for(const o of G.humans)if(o!==s&&!o.isPlayer&&o.state==='follow'){const dd=dist(s,o);if(dd<13&&dd>0)moveBy(s,(s.x-o.x)/dd*.6,(s.y-o.y)/dd*.6,humanPass)}
    break}
  case 'panic':{s.panicT+=dt;const g=s.goalSpot||s.goalGrass;
    if(g){if(s.goalSpot&&!spotFree(s.goalSpot)){panic(s,threat);break}
      if(navTo(s,g.x,g.y,spd*1.15,dt,humanPass)||dist(s,g)<(s.goalSpot?26:8)){
        if(s.goalSpot){enterSpot(s,s.goalSpot);bubble(s,'（躲好了……）','voice',1.4);s.state='hide'}else if(g.land)s.state=s.wasFollower?'follow':'stay';else s.state='hide';
        s.goalSpot=null;s.goalGrass=null;s.calm=0}}
    else{const t=s.threat||threat;if(t){const a=Math.atan2(s.y-t.y,s.x-t.x);navTo(s,s.x+Math.cos(a)*60,s.y+Math.sin(a)*60,spd*1.15,dt,humanPass)}
      if(s.panicT>3)s.state=s.wasFollower&&!P.spot?'follow':'stay'}
    if(s.panicT>9)s.state=s.wasFollower?'follow':'stay';
    break}
  case 'hide':
    if(threat)s.calm=0;else s.calm+=dt;
    if(s.wasFollower&&s.calm>4&&!P.spot&&alive(P)&&dist(P,s)<8*TS&&!P.lured&&!P.drown){if(s.spot)exitSpot(s);s.state='follow';bubble(s,'等等我！','voice',1.4)}
    break;
  }
  if(s.moving&&inWater(s)){s.wade=(s.wade||0)+dt;if(s.wade>.5){s.wade=0;noise(s.x,s.y,4*TS,'splash',s);fx('ripple',s.x,s.y,{life:1})}}
}
function saveSurv(s){s.saved=true;s.state='saved';G.saved++;SND.bell();
  const near=G.monsters.some(m=>!m.hidden&&dist(m,s)<5*TS&&m.state==='chase');
  log(near?`${s.name}在怪談的追趕下跳上了貨車！`:`${s.name}上了貨車。`,'save')}
function callSurv(s){
  if(s.spot)exitSpot(s);const first=!s.wasFollower;s.state='follow';s.wasFollower=true;s.met=true;s.goalSpot=null;
  const danger=G.monsters.some(m=>!m.hidden&&dist(m,s)<6*TS&&!['flee','stun','sealed','sated'].includes(m.state));
  bubble(s,pick(['謝謝你！','我跟著你！','你終於來了……','拜託帶我走！']),'voice',1.6);
  if(danger&&first)log(`你冒險衝過去，帶走了${s.name}。`,'clutch');else if(first)log(`你找到了${s.name}。`,'info');
  if(first&&s.quirk)setTimeout(()=>{if(alive(s))bubble(s,QUIRKS[s.quirk].hello,'voice',3)},900);
}

/* ---------------- player ---------------- */
const keys={},mouse={x:0,y:0,active:false};let touchVec=null;
function P_action(type,a,instant){const P=G.player;P.action={type,t:instant?.2:0,dur:{throw:.34,incense:.62,talisman:.3}[type==='firecracker'||type==='candy'||type==='oil'?'throw':type]||.3,a,item:type,fired:!!instant}}
function updPlayer(dt){
  const P=G.player;P.anim+=dt;P.moving=false;if(!alive(P))return;
  const wantHold=!!(keys.Space||G.touchBreath)&&!P.spot&&!P.lured&&!P.drown;
  if(wantHold&&!P.holding&&P.gasp<=0&&P.breath>.3)P.holding=true;if(!wantHold)P.holding=false;
  updBreath(P,dt);
  if(P.lured){const m=P.lured;navTo(P,m.x-Math.cos(m.face)*14,m.y-Math.sin(m.face)*14,56,dt,humanPass);P.moving=true;
    const caller=G.humans.find(h=>!h.isPlayer&&alive(h)&&!h.lured&&!h.drown&&['follow','stay','hide'].includes(h.state)&&h.wasFollower&&dist(h,P)<6*TS&&los(h.x,h.y,P.x,P.y));
    if(caller&&P.luredT>2){bubble(caller,'喂！醒醒！','scream',1.8);log(`${caller.name}大喊你的名字，你猛然回過神。`,'clutch');setState(m,'stun',2);release(m);return}
    if(P.mash>=9){log('你咬破舌頭，掙脫了魔神仔的手。','clutch');setState(m,'stun',1.5);release(m);return}
    return}
  if(P.drown){if(P.mash>=10){const m=P.drown.m;log('你拚命踢開那隻手，爬上了岸。','clutch');releaseDrown(m);setState(m,'stun',2.5);return}return}
  if(P.climb){P.climb-=dt;if(P.climb<=0){P.climb=0;if(spotFree(P.climbSpot)){enterSpot(P,P.climbSpot);onHidden(P.climbSpot)}}return}
  // action animation
  const A=P.action;if(A){A.t+=dt;if(!A.fired&&A.t>=A.dur*.5){A.fired=true;fireItem(A.item,A.a)}if(A.t>=A.dur)P.action=null}
  if(P.spot){if(P.spot.type==='tree')P.face=Math.atan2(mouse.y-P.y,mouse.x-P.x);
    if(P.spot.type==='well'){P.wellT=(P.wellT||0)+dt;const sg=G.monsters.find(m=>m.type==='suigui'&&!m.hidden&&!['stun','sated','drag'].includes(m.state));
      if(sg&&P.wellT>9){const s=P.spot;exitSpot(P);P.x=s.x;P.y=s.y+2;sg.x=P.x;sg.y=P.y;P.drown={m:sg,t:0};P.mash=0;sg.dragging=P;setState(sg,'drag');SND.splash();log('井底的水裡，有一隻手抓住了你的腳！','death');G.flags.wellgrab=1}}
    else P.wellT=0;
    return}
  let dx=(keys.KeyD||keys.ArrowRight?1:0)-(keys.KeyA||keys.ArrowLeft?1:0),dy=(keys.KeyS||keys.ArrowDown?1:0)-(keys.KeyW||keys.ArrowUp?1:0);
  if(touchVec){dx=touchVec.x;dy=touchVec.y}
  P.run=!!(keys.ShiftLeft||keys.ShiftRight||G.touchRun)&&!P.crouch&&!P.holding;
  const l=Math.hypot(dx,dy),busy=A&&A.item==='incense';
  if(l>.1&&!busy){dx/=Math.max(1,l);dy/=Math.max(1,l);let sp=P.crouch?52:P.run?152:100;const tt=tAtPx(P.x,P.y);if(tt==='r'||tt==='s'||tt==='x')sp*=1.12;if(onGrass(P))sp*=.86;if(inWater(P))sp*=.58;if(P.holding)sp=Math.min(sp,58);
    const ox=P.x,oy=P.y;moveBy(P,dx*sp*dt,dy*sp*dt,humanPass);const moved=Math.hypot(P.x-ox,P.y-oy);P.moving=moved>.1;
    if(!mouse.active||touchVec)P.face=Math.atan2(dy,dx);
    G.stepAcc+=moved;const every=P.run?30:46;
    if(G.stepAcc>every){G.stepAcc=0;
      if(inWater(P)){noise(P.x,P.y,5*TS,'splash',P);fx('ripple',P.x,P.y,{life:1});SND.wade()}
      if(!P.crouch&&!P.holding){const r=(P.run?7:2.6)*TS*(G.mod.noise||1);noise(P.x,P.y,r,'step',P);fx('ring',P.x,P.y,{life:.6,r});SND.step(P.run)}
      const ptx=Math.floor(P.x/TS),pty=Math.floor(P.y/TS);if(puddleAt(ptx,pty)&&!P.crouch&&G.flags.pud!==ptx+','+pty){G.flags.pud=ptx+','+pty;noise(P.x,P.y,3.5*TS,'splash',P);fx('ripple',P.x,P.y,{life:1});SND.wade()}}}
  if(mouse.active&&!touchVec)P.face=Math.atan2(mouse.y-P.y,mouse.x-P.x);
  // props that react when you brush past them
  if(P.moving&&!P.crouch)for(const p of G.props){if((p.type==='J'||p.type==='X')&&p.cd<=G.t&&Math.hypot(p.x-P.x,p.y-P.y)<1.25*TS){p.cd=G.t+6;p.ring=G.t;
    noise(p.x,p.y,(p.type==='J'?8:7)*TS,'chime',p);SND.cue(p.type==='J'?'chime':'coop',p.x,p.y);bubble(p,p.type==='J'?'叮鈴鈴——':'咯咯咯咯！','info',1.4);
    if(!G.flags['bump'+p.type]){G.flags['bump'+p.type]=1;log(p.type==='J'?'你撞到屋簷下的風鈴，叮叮噹噹響遍了半條街。':'雞籠裡的雞被你驚醒，叫得整個村子都聽得到。','absurd')}}}
  for(const c of G.clues)if(!c.taken&&Math.hypot(c.x-P.x,c.y-P.y)<18){c.taken=true;SND.paper();const hid=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.met&&!h.saved);const h=hid.length?pick(hid):null;
    if(h){h.met=true;h.reveal=G.t+30;log(`撿到一張紙條：「${h.name}躲在${h.spot?HIDES[h.spot.type].name:onGrass(h)?'草叢裡':'附近'}，拜託誰來救他」。`,'info');UI.sub(`紙條上寫著${h.name}的位置。`,'save')}else UI.sub('一張被雨淋濕的紙條，字已經看不清了。','omen')}
  for(const it of G.items)if(!it.taken&&Math.hypot(it.x-P.x,it.y-P.y)<18){it.taken=true;G.inv[it.type]++;SND.pickup();fx('pickup',it.x,it.y,{life:.6,item:it.type});
    if(!G.inv[ITEM_ORDER[G.sel]]||G.inv[it.type]===1)G.sel=ITEM_ORDER.indexOf(it.type);UI.itemTip(true)}
  if(G.holy.has(Math.floor(P.y/TS)*MW+Math.floor(P.x/TS))&&G.incense>0){G.incense-=dt*.85;if(G.incense<=0&&!G.flags.incOut){G.flags.incOut=1;G.incense=0;log('香火熄滅了。土地公的庇護消失。','absurd')}}
}
function onHidden(spot){
  const P=G.player,left=G.humans.filter(h=>!h.isPlayer&&alive(h)&&h.state==='follow'&&dist(h,P)<6*TS);
  if(left.length&&!spotFree(spot)&&G.monsters.some(m=>!m.hidden&&dist(m,P)<10*TS))log(`你搶先躲進${HIDES[spot.type].name}，${left.map(h=>h.name).join('、')}被留在外面。`,'regret');
}
function interactTarget(){
  const P=G.player;if(!alive(P)||P.lured||P.climb||P.drown)return null;
  {const k=G.monsters.find(m=>m.type==='kuchi'&&m.state==='ask'&&m.target===P&&dist(m,P)<5*TS);if(k)return{label:'回答「普通」',x:k.x,y:k.y,fn:()=>answerKuchi(k)}}
  if(P.spot)return{label:P.spot.type==='tree'?'爬下樹':P.spot.type==='hay'?'鑽出草垛':'走出衣櫃',x:P.x,y:P.y,fn:()=>exitSpot(P)};
  if(tAtPx(P.x,P.y)==='x'&&!G.tut){
    const left0=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.saved&&!(h.state==='follow'&&dist(h,P)<3*TS)).length;const armed=G.leaveArm!=null&&G.t-G.leaveArm<3;
    if(left0&&!armed)return{label:`上車離開（還有 ${left0} 人沒救）`,x:P.x,y:P.y,fn:()=>{G.leaveArm=G.t;bubble(P,`真的要丟下 ${left0} 個人？再按一次`,'info',3)}};
    return{label:armed?'確定離開':'上車離開，結束這一夜',x:P.x,y:P.y,fn:()=>{
      for(const h of G.humans.filter(h=>!h.isPlayer&&h.state==='follow'&&alive(h)&&dist(h,P)<3*TS))saveSurv(h);
      const stillLeft=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.saved);
      if(stillLeft.length)log(`你發動貨車離開。${stillLeft.map(h=>h.name).join('、')}被留在村裡。`,'regret');
      P.escaped=true;endGame('escape')}}}
  let best=null,bd=1e9;
  for(const h of G.humans){if(h.isPlayer||!alive(h))continue;const d=dist(h,P);
    if(h.lured&&d<32&&d<bd){bd=d;best={label:`把${h.name}拉回來`,x:h.x,y:h.y,fn:()=>{const m=h.lured;if(m.type){setState(m,'stun',2);release(m)}h.lured=null;h.luredT=0;callSurv(h);log(`你從魔神仔手裡拉回了${h.name}。`,'clutch')}}}
    else if(h.drown&&d<40&&d<bd){bd=d;best={label:`把${h.name}拉上岸`,x:h.x,y:h.y,fn:()=>{const m=h.drown.m;releaseDrown(m);setState(m,'stun',2.5);callSurv(h);log(`你抓住${h.name}的手，把他從水裡拖了出來。`,'clutch')}}}
    else if(!h.lured&&!h.drown&&h.state!=='follow'&&d<(h.spot?36:32)&&d<bd){bd=d;const deaf=h.quirk==='deaf'&&d>22;best={label:deaf?`${h.name}重聽，再靠近一點`:h.spot?`叫${h.name}出來跟你走`:`叫${h.name}跟上`,x:h.x,y:h.y,fn:deaf?null:()=>callSurv(h)}}}
  if(best)return best;
  const ptx=Math.floor(P.x/TS),pty=Math.floor(P.y/TS);
  // doors next to you (not the one you stand on)
  for(let dy=-1;dy<=1;dy++)for(let dx=-1;dx<=1;dx++){const tx=ptx+dx,ty=pty+dy,c=tileAt(tx,ty);if((c!=='d'&&c!=='D')||(dx===0&&dy===0))continue;const d=Math.hypot(tc(tx)-P.x,tc(ty)-P.y);if(d<34&&d<bd){bd=d;
    best=c==='d'?{label:'把門關上',x:tc(tx),y:tc(ty),fn:doorBlocked(tx,ty)?null:()=>{setDoor(tx,ty,true);SND.door();G.stats.doors++;if(!G.flags.door1){G.flags.door1=1;UI.sub('門關上了。怪談得撞一陣子才進得來，但撞門聲很大。','info')}}}
      :{label:'把門打開',x:tc(tx),y:tc(ty),fn:()=>{setDoor(tx,ty,false);SND.door()}}}}
  for(const p of G.props){const d=dist(p,P);if(d>40||d>=bd)continue;
    if(p.type==='Z'){bd=d;best={label:p.cd>G.t?'鐘還在晃':'敲鐘（把怪談引過來）',x:p.x,y:p.y,fn:p.cd>G.t?null:()=>{p.cd=G.t+25;p.ring=G.t;noise(p.x,p.y,16*TS,'bell',p);SND.cue('bigbell',p.x,p.y);G.stats.bells++;
      if(!G.flags.bell1){G.flags.bell1=1;log('你敲響了鐘。整個村子的怪談都轉過頭來。','absurd')}}}}
    if(p.type==='U'){bd=d;best={label:p.used?'土地公已經幫過你了':'向土地公祈求（暫時的結界）',x:p.x,y:p.y,fn:p.used?null:()=>{p.used=true;G.wards.push({x:p.x,y:p.y+14,r:2.8*TS,t:30,max:30});SND.bell();log('你向路邊的土地公拜了三拜，香爐裡的灰亮了起來。','clutch');
      for(const m of G.monsters)if(MONSTERS[m.type].holy&&Math.hypot(m.x-p.x,m.y-p.y)<2.8*TS)flee(m,p.x,p.y,3)}}}}
  for(const l of G.lamps){const d=Math.hypot(l.x-P.x,l.y+6-P.y);if(d<38&&d<bd&&!l.dead&&!G.mod.nolamps){bd=d;best={label:'打破路燈（變暗，但會有聲音）',x:l.x,y:l.y+6,fn:()=>{l.dead=true;noise(l.x,l.y,6*TS,'glass',l);SND.cue('glass',l.x,l.y);fx('glass',l.x,l.y-20,{life:.8});
      if(!G.flags.lamp1){G.flags.lamp1=1;UI.sub('燈滅了。站在燈下的人，怪談看得特別清楚。','info')}}}}}
  if(best)return best;
  const al=G.sc.altar;if(Math.hypot(al.x-P.x,al.y-P.y)<52&&G.inv.incense>0)return{label:'上香（補香火）',x:al.x,y:al.y,fn:()=>useItem('incense')};
  for(const s of G.spots){const d=dist(s,P);if(d<36&&d<bd){bd=d;const nm={tree:'爬上樹',hay:'鑽進草垛',cabinet:'躲進衣櫃'}[s.type];best=spotFree(s)?{label:nm,x:s.x,y:s.y,fn:()=>hideIn(s)}:{label:`${HIDES[s.type].name}已經滿了`,x:s.x,y:s.y,fn:null}}}
  return best;
}
function answerKuchi(m){const P=G.player;setState(m,'stun',4);m.ignore={h:P,until:G.t+12};bubble(m,'……普通？','monster',2);bubble(P,'普、普通。','voice',1.6);
  if(!G.flags.kuchiAns){G.flags.kuchiAns=1;log('裂口女問你漂不漂亮。你說「普通」。她愣在原地，像是不知道該怎麼辦。','clutch')}}
function hideIn(s){const P=G.player;if(!spotFree(s))return;P.holding=false;P.crouch=false;if(s.type==='tree'){P.climb=HIDES.tree.enter;P.climbSpot=s;P.face=Math.atan2(s.y-P.y,s.x-P.x);SND.rustle();return}
  enterSpot(P,s);if(s.type==='well'){P.wellT=0;noise(s.x,s.y,3*TS,'splash',P);SND.wade()}else SND[s.type==='hay'?'rustle':'door']();onHidden(s)}
function useItem(type){
  const P=G.player;type=type||ITEM_ORDER[G.sel];if(!alive(P)||P.climb||P.action||!G.inv[type])return false;
  if(P.spot&&P.spot.type!=='tree')return false;
  if(P.lured||P.drown){if(type==='firecracker'&&P.lured){G.inv.firecracker--;bang(P.x,P.y);return true}return false}
  const a=(mouse.active&&!touchVec)?Math.atan2(mouse.y-P.y,mouse.x-P.x):P.face;P.face=a;
  G.inv[type]--;P_action(type,a);return true;
}
function fireItem(type,a){
  const P=G.player;
  if(type==='talisman'){const tx=Math.floor((P.x+Math.cos(a)*20)/TS),ty=Math.floor((P.y+Math.sin(a)*20)/TS);let door=null;
    for(let dy=-1;dy<=1&&!door;dy++)for(let dx=-1;dx<=1;dx++)if(tileAt(tx+dx,ty+dy)==='D'){door=[tx+dx,ty+dy];break}
    if(door){for(const[x,y]of doorTiles(door[0],door[1]))G.sealed.add(x+','+y);SND.paper();decal('talisman',tc(door[0]),tc(door[1])+6);log('你把符咒貼在門縫上。','clutch');return}}
  if(type==='firecracker'||type==='candy'||type==='oil'){
    const max=(type==='firecracker'?7.5:6.5)*TS,mx=mouse.active&&!touchVec?Math.min(max,Math.hypot(mouse.x-P.x,mouse.y-P.y)):max*.75;
    let lx=P.x,ly=P.y;for(let d=0;d<=mx;d+=4){const x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d,t=tAtPx(x,y);if(t==='O'){lx=x;ly=y;break}if((OPAQUE.has(t)&&t!=='Q'&&t!=='G')||(SOLID.has(t)&&!WATER.has(t)&&t!=='G'&&t!=='K'&&t!=='X'&&t!=='J'&&!(P.spot&&Math.hypot(x-P.x,y-P.y)<TS)))break;lx=x;ly=y}
    G.proj.push({type,sx:P.x+Math.cos(a)*8,sy:P.y+Math.sin(a)*8,x:P.x,y:P.y,tx:lx,ty:ly,t:0,dur:.3+Math.hypot(lx-P.x,ly-P.y)/600,spin:rnd()*6});SND.throw();return}
  if(type==='incense'){
    if(Math.hypot(G.sc.altar.x-P.x,G.sc.altar.y-P.y)<64){const was=G.incense;G.incense=Math.min(100,Math.max(0,G.incense)+55);G.flags.incOut=0;SND.bell();log(was<=0?'你重新點燃了香火，廟裡又亮了起來。':'你在土地公面前插上一炷香。','clutch')}
    else{const x=P.x+Math.cos(a)*10,y=P.y+Math.sin(a)*10;G.wards.push({x,y,r:2.7*TS,t:25*(G.mod.ward||1),max:25*(G.mod.ward||1),smoke:true});SND.bell();
      for(const m of G.monsters)if(MONSTERS[m.type].holy&&Math.hypot(m.x-x,m.y-y)<2.7*TS)flee(m,x,y,3)}
    return}
  if(type==='talisman'){let hit=null;
    for(const m of G.monsters){if(m.hidden)continue;const d=dist(m,P);if(d<2*TS&&Math.abs(angDiff(Math.atan2(m.y-P.y,m.x-P.x),a))<1.1){hit=m;break}}
    if(hit&&hit.type==='jiang'){seal(hit,12);log('你把符咒拍在殭屍額頭上。牠僵住了。','clutch')}
    else if(hit&&MONSTERS[hit.type].holy){flee(hit,P.x,P.y,3);bubble(hit,hit.type==='tiger'?'嘖！':'嘻！','monster')}
    else{if(hit)bubble(hit,'……？','monster',1.2);const x=P.x+Math.cos(a)*30,y=P.y+Math.sin(a)*30;decal('talisman',x,y);SND.paper()}
    return}
}
function bang(x,y){fx('bang',x,y,{life:.9});SND.bang();G.shake=.38;
  for(const m of G.monsters)if(!m.hidden&&m.type!=='mosin'&&Math.hypot(m.x-x,m.y-y)<2.2*TS&&!['drag','lead','sealed'].includes(m.state)){setState(m,'stun',1.3);bubble(m,'！','monster',.8)}for(let i=0;i<14;i++)decal('confetti',x+(rnd()-.5)*44,y+(rnd()-.5)*44);
  const n={x,y,r:12*TS,kind:'bang',t:0};G.noises.push(n);for(const m of G.monsters)if(!m.hidden&&Math.hypot(m.x-x,m.y-y)<=n.r)onNoise(m,n);
  if(n.scared&&n.drawn)log(`鞭炮嚇跑了${n.scared.map(m=>m.def.name).join('')}，卻把${[...new Set(n.drawn.map(m=>m.def.name))].join('和')}引了過來。`,'absurd');
  else if(n.scared)log('鞭炮炸響，魔神仔尖笑著逃開。','clutch');
  for(const h of G.humans)if(!h.isPlayer&&alive(h)&&(h.state==='wait'||h.state==='stay')&&Math.hypot(h.x-x,h.y-y)<3*TS){h.scream=0;bubble(h,'哇！','scream',1)}}
function landProjectile(p){
  const t=tAtPx(p.tx,p.ty);
  if(t==='O'){fx('splash',p.tx,p.ty,{life:.8});SND.cue('echo',p.tx,p.ty);noise(p.tx,p.ty,14*TS,'bell',p);bubble({x:p.tx,y:p.ty},'（咚……咚……咚……）','info',2);if(!G.flags.well1){G.flags.well1=1;log('東西掉進井裡，回聲傳遍了半個村子。','absurd')}return}
  if(p.type==='candy'){const dog=G.dogs.find(d=>!d.quiet&&Math.hypot(d.x-p.tx,d.y-p.ty)<2*TS);if(dog){dog.quiet=true;bubble(dog,'（搖著尾巴舔起糖來）','info',2);log('你丟了一塊麥芽糖給狗，牠安靜下來了。','clutch');return}}
  if(WATER.has(t)){fx('splash',p.tx,p.ty,{life:.8});SND.plop();const n=noise(p.tx,p.ty,12*TS,'splash',p);
    if(n.drawn&&n.drawn.length&&!G.flags.splashlog){G.flags.splashlog=1;log('東西掉進水裡，水面下有什麼游了過去。','info')}
    if(p.type==='firecracker')bubble({x:p.tx,y:p.ty},'（滋……熄了）','info',1.4);return}
  if(p.type==='firecracker'){G.fuses.push({x:p.tx,y:p.ty,t:.75});SND.fuse();return}
  if(p.type==='oil'){G.fires.push({x:p.tx,y:p.ty,r:1.4*TS,t:12,max:12});SND.cue('fire',p.tx,p.ty);noise(p.tx,p.ty,4*TS,'glass',p);
    for(const m of G.monsters)if(!m.hidden&&m.type!=='suigui'&&dist(m,p.tx!==undefined?{x:p.tx,y:p.ty}:p)<1.8*TS){if(m.type==='tiger'){flee(m,p.tx,p.ty,8);bubble(m,'嗷啊——好燙！','monster')}else{setState(m,'stun',2);bubble(m,'……！','monster',1)}}
    if(!G.flags.fire1){G.flags.fire1=1;log('煤油燒了起來。火光裡，怪談都不敢靠近。','clutch')}return}
  const c={x:p.tx,y:p.ty,t:22};G.candies.push(c);
  // a smell lure: anything with a nose comes over to sniff, the masked woman lingers longest
  for(const m of G.monsters)if(['kuchi','tiger','mosin'].includes(m.type)&&!m.hidden&&dist(m,c)<(m.type==='kuchi'?11:8)*TS&&!['flee','stun','lead','drag','sealed','bash'].includes(m.state)){const was=m.state==='chase';setState(m,'eat');m.candy=c;m.target=null;m.eatFor=m.type==='kuchi'?10:5;
    bubble(m,{kuchi:'……是糖？',tiger:'嗅……甜的？',mosin:'嘻？'}[m.type],'monster',1.6);if(was)log(`${m.def.name}停下腳步，轉頭去聞那塊麥芽糖。`,'clutch')}
}

/* ---------------- main update ---------------- */
function update(dt){
  if(G.over)return;G.t+=dt;
  for(const s of G.schedule){if(!s.om&&G.t>=s.omen){s.om=true;log(MONSTERS[s.type].omen,'omen');SND.omenCue(s.type)}if(!s.done&&G.t>=s.t){s.done=true;const m=spawnMonster(s.type,s.first?midSpawn(s.type):null);if(s.first&&m.type!=='suigui'){const c=G.flags.cry&&alive(G.flags.cry)&&!G.flags.cry.saved&&G.flags.cry.state!=='follow'?G.flags.cry:G.player;setState(m,'investigate',24);m.goal={x:c.x+(rnd()-.5)*4*TS,y:c.y+(rnd()-.5)*4*TS}}}}
  if(!G.tut)updNight(dt);
  updPlayer(dt);
  for(const h of G.humans)if(!h.isPlayer)updSurv(h,dt);
  updDogs(dt);
  for(const m of G.monsters)updMonster(m,dt);
  G.monsters=G.monsters.filter(m=>!m.done);
  for(const p of G.proj){p.t+=dt;const k=Math.min(1,p.t/p.dur);p.x=p.sx+(p.tx-p.sx)*k;p.y=p.sy+(p.ty-p.sy)*k;if(k>=1&&!p.done){p.done=true;landProjectile(p)}}
  G.proj=G.proj.filter(p=>!p.done);
  for(const f of G.fuses){f.t-=dt;if(f.t<=0&&!f.done){f.done=true;bang(f.x,f.y)}}G.fuses=G.fuses.filter(f=>!f.done);
  for(const c of G.candies){c.t-=dt;if(c.t<=0)c.gone=true}G.candies=G.candies.filter(c=>!c.gone);
  for(const f of G.fires)f.t-=dt;G.fires=G.fires.filter(f=>f.t>0);
  for(const w of G.wards)w.t-=dt;G.wards=G.wards.filter(w=>w.t>0);
  for(const n of G.noises)n.t+=dt;G.noises=G.noises.filter(n=>n.t<1);
  for(const f of G.fx)f.t+=dt;G.fx=G.fx.filter(f=>f.t<f.life);
  for(const b of G.bubbles){b.t+=dt;if(b.ent&&b.ent.x!==undefined){b.x=b.ent.x;b.y=b.ent.y}}G.bubbles=G.bubbles.filter(b=>b.t<b.life);
  for(const s of G.spots){if(s.open>0)s.open-=dt}
  G.shake=Math.max(0,G.shake-dt);if(G.scare)G.scare.t+=dt;
  const P=G.player;
  if(!G.tut){if(P.dead)endGame('dead');else if(P.gone)endGame('gone');else if(G.t>=G.night)endGame('dawn')}
  let near=1e9;for(const m of G.monsters){if(m.hidden||['flee','stun','sealed','sated'].includes(m.state))continue;if(m.type==='suigui'&&!inWater(P)&&!(P.spot&&P.spot.type==='well'))continue;const d=dist(m,P)/TS;near=Math.min(near,d*(m.target===P?.6:1));if(m.target===P&&alive(P))G.stats.closest=Math.min(G.stats.closest,d)}
  G.danger=clamp(1-(near-2)/7,0,1);G.hb-=dt;if(G.danger>0&&G.hb<=0&&!G.over){SND.heart(G.danger);G.hb=1.1-G.danger*.65}
  if(G.tut)TUT.update(dt);
}

/* ---------------- apparitions: they impose a rule instead of hunting ---------------- */
function scheduleApparitions(){const order=shuffle(APPARITION_ORDER.slice()).slice(0,G.mod.id==='gate'?3:2+(rnd()<.4?1:0));order.forEach((type,i)=>G.apps.push({t:PACE.apps[i]+rnd()*PACE.appJitter,type}))}
function nearestRoad(P){ // pick the straight road the player is closest to, and walk the procession along it
  const opts=[{axis:'x',c:32,a:2,b:81},{axis:'y',c:41.5,a:28,b:57},{axis:'y',c:30,a:8,b:31},{axis:'y',c:53,a:6,b:31}];let best=opts[0],bd=1e9;
  for(const o of opts){const d=o.axis==='x'?Math.abs(P.y/TS-o.c):Math.abs(P.x/TS-o.c)+(P.y/TS<o.a||P.y/TS>o.b?20:0);if(d<bd){bd=d;best=o}}return best}
function startApparition(type){
  const P=G.player,A={type,t:0,done:false,violated:false,who:null};
  if(type==='girl'){let spot=null;for(let i=0;i<30&&!spot;i++){const a=P.face+(rnd()-.5)*.6,d=(3.2+rnd()*1.6)*TS,x=P.x+Math.cos(a)*d,y=P.y+Math.sin(a)*d;if(humanPass(Math.floor(x/TS),Math.floor(y/TS))&&los(P.x,P.y,x,y))spot={x,y}}
    if(!spot)spot={x:P.x+Math.cos(P.face)*2.5*TS,y:P.y+Math.sin(P.face)*2.5*TS};Object.assign(A,spot,{dur:3.6,grace:.5,face:Math.atan2(P.y-spot.y,P.x-spot.x)});
    for(const h of G.humans)if(!h.isPlayer&&alive(h)&&!h.spot&&!h.lured&&dist(h,P)<10*TS){h.frozen=true;if((h.child||h.quirk==='timid'||h.quirk==='wander')&&rnd()<.45)h.fidgetAt=.8+rnd()*2.4}}
  if(type==='funeral'){const r=nearestRoad(P),dir=rnd()<.5?1:-1;A.road=r;A.dir=dir;A.pos=(dir>0?r.a:r.b)*TS;A.end=(dir>0?r.b:r.a)*TS;A.look=0;A.members=7;A.pseudo={x:0,y:0,face:0,def:{name:'送葬隊伍'},state:'lead',cool:{},led:null};
    const p=apPos(A,0);A.x=p.x;A.y=p.y}
  if(type==='voice'){const a=P.face+Math.PI;Object.assign(A,{x:P.x+Math.cos(a)*2.6*TS,y:P.y+Math.sin(a)*2.6*TS,dur:4.5,grace:.6,callT:0,pseudo:{x:0,y:0,face:0,def:{name:'那個聲音'},state:'lead',cool:{},led:null}})}
  G.apparition=A;G.seen[type]=true;UI.rule(type);if(APPARITIONS[type].omen!=='……')log(APPARITIONS[type].omen,'omen');
  SND.cue(type==='girl'?'girl':type==='funeral'?'suona':'voice',A.x,A.y);
}
function apPos(A,i){const k=A.pos-A.dir*i*20;return A.road.axis==='x'?{x:k,y:A.road.c*TS}:{x:A.road.c*TS,y:k}}
function punish(A,msg){A.violated=true;const P=G.player;G.flash={type:A.type,at:0};G.darkUntil=G.t+9;G.shake=.4;SND.scare(A.type);
  log(msg,'death');for(const m of G.monsters)if(!m.hidden&&!['sealed','sated','drag','lead'].includes(m.state)&&dist(m,P)<22*TS){setState(m,'investigate',12);m.goal={x:P.x,y:P.y}}}
function takeAway(h,A,how){h.gone=true;h.frozen=false;h.state='gone';if(h.spot)exitSpot(h);decal('shoes',h.x,h.y);log(how,'death')}
function updApparition(dt){
  const A=G.apparition,P=G.player;if(!A)return;A.t+=dt;
  if(A.type==='girl'){
    if(A.t>A.grace&&A.px===undefined){A.px=P.x;A.py=P.y}
    if(A.px!==undefined&&!A.violated&&alive(P)&&(Math.hypot(P.x-A.px,P.y-A.py)>2.5||(P.action&&!P.action.fired))){
      const f=G.humans.filter(h=>!h.isPlayer&&alive(h)&&h.state==='follow'&&!h.spot).sort((a,b)=>dist(a,P)-dist(b,P))[0];
      punish(A,'你動了。紅衣小女孩不見了，你的手電筒也滅了。');if(f)takeAway(f,A,`${f.name}跟著你動了一步，就再也沒有人看見他。`)}
    for(const h of G.humans)if(h.fidgetAt&&A.t>h.fidgetAt&&alive(h)&&!A.violated){h.fidgetAt=0;takeAway(h,A,`${h.name}忍不住動了一下。原地只剩一雙鞋。`)}
    if(A.t>A.dur){if(!A.violated){log('你一動也不敢動。紅衣小女孩看了你很久，然後不見了。','clutch')}endApparition()}}
  if(A.type==='funeral'){A.pos+=A.dir*34*dt;const head=apPos(A,0),tail=apPos(A,A.members-1);A.x=(head.x+tail.x)/2;A.y=(head.y+tail.y)/2;A.pseudo.x=tail.x;A.pseudo.y=tail.y;A.pseudo.face=A.road.axis==='x'?(A.dir>0?0:Math.PI):(A.dir>0?Math.PI/2:-Math.PI/2);
    if(A.t%1.4<dt)SND.cue('suona',head.x,head.y);
    if(alive(P)&&!P.lured&&!P.spot&&!P.crouch&&G.t>=G.darkUntil){let seen=false;for(let i=0;i<A.members;i++){const p=apPos(A,i),d=Math.hypot(p.x-P.x,p.y-P.y);if(d<230&&Math.abs(angDiff(Math.atan2(p.y-P.y,p.x-P.x),P.face))<.45&&los(P.x,P.y,p.x,p.y)){seen=true;break}}
      A.look=seen?A.look+dt:Math.max(0,A.look-dt*.5);if(A.look>1.1&&!A.violated){A.violated=true;G.flash={type:'funeral',at:0};SND.scare('funeral');P.lured=A.pseudo;P.luredT=0;P.mash=0;A.pseudo.led=P;log('你盯著送葬的隊伍看。隊伍最後面的人轉過頭來，招手要你跟上。','death')}}
    for(const h of G.humans)if(!h.isPlayer&&alive(h)&&!h.lured&&!h.spot&&h.state!=='follow'&&(h.child||h.quirk==='timid')&&Math.hypot(h.x-A.x,h.y-A.y)<6*TS&&!h.funeralChecked){h.funeralChecked=true;if(rnd()<.5){h.lured=A.pseudo;h.luredT=0;h.state='lured';bubble(h,'……他們要去哪裡？','voice',2);log(`${h.name}好奇地看著送葬隊伍，跟著走了過去。`,'regret')}}
    for(const h of G.humans){if(h.lured!==A.pseudo||!alive(h))continue;h.luredT+=dt;if(!h.isPlayer){navTo(h,A.pseudo.x-Math.cos(A.pseudo.face)*14,A.pseudo.y-Math.sin(A.pseudo.face)*14,40,dt,humanPass);h.moving=true;if(h.luredT>11){h.lured=null;takeAway(h,A,`${h.name}跟著送葬隊伍走出村子，沒有再回來。`)}}
      else if(h.luredT>8.5){h.gone=true;h.lured=null;G.scare={type:'funeral',t:0};log('你跟著送葬的隊伍，走進了山裡。','death')}}
    if((A.dir>0&&A.pos-A.dir*A.members*20>A.end)||(A.dir<0&&A.pos-A.dir*A.members*20<A.end)){if(!A.violated)log('你低著頭，等送葬的隊伍走遠了才敢抬頭。','clutch');for(const h of G.humans)if(h.lured===A.pseudo){h.lured=null;if(!h.isPlayer)h.state='stay'}endApparition()}}
  if(A.type==='voice'){const a=P.face+Math.PI;A.x=lerp(A.x,P.x+Math.cos(a)*2.6*TS,.05);A.y=lerp(A.y,P.y+Math.sin(a)*2.6*TS,.05);A.callT-=dt;
    if(A.callT<=0){A.callT=1.4;SND.cue('voice',A.x,A.y);bubble({x:A.x,y:A.y},pick(['喂……','……是你嗎？','回頭看一下嘛……']),'monster',1.3)}
    if(A.t>A.grace&&!A.violated&&alive(P)&&(Math.abs(angDiff(Math.atan2(A.y-P.y,A.x-P.x),P.face))<1.1||A.answered))punish(A,A.answered?'你應了一聲。背後的東西笑了。':'你回頭了。黑暗裡有什麼東西抓住了你的肩膀。');
    if(!A.ans2){A.ans2=true;const t=G.humans.find(h=>!h.isPlayer&&alive(h)&&h.quirk==='timid'&&dist(h,P)<7*TS);if(t&&rnd()<.6){bubble(t,'……誰？我在這裡！','voice',2);t.lured=A.pseudo;t.luredT=0;t.state='lured';A.pseudo.x=A.x;A.pseudo.y=A.y;log(`${t.name}聽到有人叫他，應了一聲。`,'regret')}}
    for(const h of G.humans){if(h.lured!==A.pseudo||h.isPlayer||!alive(h))continue;h.luredT+=dt;navTo(h,A.x,A.y,46,dt,humanPass);h.moving=true;if(h.luredT>8){h.lured=null;takeAway(h,A,`${h.name}朝著聲音走進黑暗裡，不見了。`)}}
    if(A.t>A.dur){if(!A.violated)log('你沒有回頭。叫你名字的聲音，慢慢遠了。','clutch');for(const h of G.humans)if(h.lured===A.pseudo){h.lured=null;if(!h.isPlayer)h.state='stay'}endApparition()}}
}
function endApparition(){for(const h of G.humans){h.frozen=false;h.fidgetAt=0}G.apparition=null}

/* ---------------- night pacing, events, dogs, false scares ---------------- */
function updNight(dt){
  const P=G.player,third=G.night/3,ph=Math.min(2,Math.floor(G.t/third));
  if(ph>G.phase){G.phase=ph;UI.sub(ph===1?'丑時。怪談們走得更快了。':'寅時。夜最深的時候。','omen');SND.omen();
    if(ph>=PACE.reservePhase&&G.reserve&&G.reserve.length&&G.monsters.length<PACE.maxMonsters){const type=G.reserve.shift();G.schedule.push({t:G.t+9,type,omen:G.t+1})}}
  const fin=G.night-G.t<PACE.final;if(fin&&!G.final){G.final=true;SND.sting();lastCall()}
  G.heat=G.final?PACE.finalHeat:PACE.heat[G.phase];
  for(const e of G.events){if(e.done||G.t<e.t)continue;e.done=true;
    if(e.type==='scream'){const s=G.humans.filter(h=>!h.isPlayer&&alive(h)).sort((a,b)=>dist(a,P)-dist(b,P))[0];if(s){G.flags.cry=s;bubble(s,'救命啊——！！','scream',2.4);SND.cue('scream',s.x,s.y);s.met=true;s.reveal=G.t+8;log(`遠處傳來${s.name}的尖叫聲。`,'omen')}}
    else{log(EVENTS[e.type].omen,'omen');
      if(e.type==='blackout')G.lampsOff=G.t+25;
      if(e.type==='fogroll')G.fogUntil=G.t+35;
      if(e.type==='bell'){const b=G.props.find(p=>p.type==='Z');if(b){b.ring=G.t;noise(b.x,b.y,16*TS,'bell',b);SND.cue('bigbell',b.x,b.y)}}
      if(e.type==='cry'){let spot=null;for(let i=0;i<40&&!spot;i++){const tx=Math.floor(P.x/TS)+Math.floor((rnd()-.5)*24),ty=Math.floor(P.y/TS)+Math.floor((rnd()-.5)*18);if(tileAt(tx,ty)==='g')spot={x:tc(tx),y:tc(ty)}}
        if(spot){noise(spot.x,spot.y,10*TS,'cry',spot);SND.cue('cry',spot.x,spot.y);bubble(spot,'（嬰兒的哭聲）','info',3)}}}}
  for(const a of G.apps)if(!a.done&&G.t>=a.t&&!G.apparition&&alive(G.player)&&!G.player.spot&&G.danger<.3&&!G.monsters.some(m=>!m.hidden&&m.type!=='suigui'&&dist(m,G.player)<11*TS)){ // a rule needs its own moment: it waits until no monster is close
    a.done=true;if(!G.final)startApparition(a.type)} // the last minute belongs to the chase
  updApparition(dt);if(G.flash)G.flash.at+=dt;
  // a quiet beat right before something arrives
  for(const s of G.schedule)if(!s.done&&G.t>=s.omen-2.5&&G.t<s.t)G.silence=Math.max(G.silence,s.t);
  // never leave the player alone for long: the nearest idle monster drifts toward them
  const busy=['flee','stun','sealed','sated','lead','drag','eat','bash'];const act=G.monsters.filter(m=>!m.hidden&&!busy.includes(m.state));
  if(act.length&&!act.some(m=>dist(m,P)<14*TS))G.lonely+=dt;else G.lonely=0;
  if(G.lonely>(G.final?PACE.finalLonely:PACE.lonely[G.phase])&&alive(P)){G.lonely=0;const m=act.filter(m=>m.state==='patrol'&&m.type!=='suigui').sort((a,b)=>dist(a,P)-dist(b,P))[0];if(m){setState(m,'investigate',14);const r=G.final?3:5;m.goal={x:P.x+(rnd()-.5)*r*TS,y:P.y+(rnd()-.5)*r*TS}}}
  // false scares when nothing is near (the first one is part of the opening)
  if(G.t>G.scareT&&G.danger<.15&&alive(P)&&!P.spot&&!G.apparition&&!(G.silence>G.t)){G.scareT=G.t+PACE.scareGap[0]+rnd()*PACE.scareGap[1];falseScare(G.scareN++?null:pick(['steps','cat']))}
}
// last minute: everyone still out there cries for you at once — you see where they are, and so do the monsters near them
function lastCall(){
  const left=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.saved&&h.state!=='follow'&&!h.lured&&!h.drown);
  for(const h of left){h.met=true;h.reveal=G.night;bubble(h,`${h.name}：天快亮了，等等我——！`,'scream',2.6);noise(h.x,h.y,9*TS,'scream',h)}
  UI.sub(left.length?`雞快啼了——怪談們急了。${left.map(h=>h.name).join('、')}還在村裡喊你！`:'雞快啼了——怪談們急了，撐住！','death');
}
function falseScare(kind){
  const P=G.player,k=kind||pick(['cat','steps','whisper','lamp']);
  if(k==='cat'){const a=P.face+Math.PI*.6*(rnd()<.5?1:-1),x=P.x+Math.cos(a)*2.2*TS,y=P.y+Math.sin(a)*2.2*TS;fx('cat',x,y,{life:1.1,a:a+Math.PI*.5*(rnd()<.5?1:-1)});SND.cue('meow',x,y);G.shake=.18;bubble({x,y},'喵——！','info',1.2)}
  else if(k==='steps'){const a=P.face+Math.PI,x=P.x+Math.cos(a)*3*TS,y=P.y+Math.sin(a)*3*TS;for(let i=0;i<3;i++)setTimeout(()=>{if(G&&!G.over){fx('step',x+i*6,y,{life:.9,big:true});SND.cue('steps',x,y)}},i*420)}
  else if(k==='whisper'){const a=P.face+Math.PI;SND.cue('whisper',P.x+Math.cos(a)*40,P.y+Math.sin(a)*40);UI.sub('……背後好像有人叫了你的名字？','omen')}
  else{const l=G.lamps.filter(l=>lampOn(l)>0).sort((a,b)=>dist(a,P)-dist(b,P))[0];if(l&&dist(l,P)<9*TS){const keep=l.broken;l.broken=true;SND.cue('buzz',l.x,l.y);setTimeout(()=>{l.broken=keep},2600)}}
}
function updDogs(dt){
  for(const d of G.dogs){d.anim+=dt;d.cd-=dt;d.warn-=dt;if(d.quiet)continue;
    const sens=G.mod.dogs||1;let who=null;
    for(const h of G.humans)if(alive(h)&&!h.spot&&!crouched(h)&&dist(h,d)<3*TS*sens&&(h.isPlayer||h.state!=='follow'||!G.player.crouch)){who=h;break}
    const mon=G.monsters.find(m=>!m.hidden&&m.type!=='suigui'&&dist(m,d)<6*TS);
    if(mon&&d.cd<=0){d.cd=1.3;d.face=Math.atan2(mon.y-d.y,mon.x-d.x);d.bark=.4;SND.cue('bark',d.x,d.y);if(d.warn<=0){d.warn=8;bubble(d,'汪汪汪！嗚……','scream',1.4)}}
    else if(who&&d.cd<=0){d.cd=1.2;d.face=Math.atan2(who.y-d.y,who.x-d.x);d.bark=.4;SND.cue('bark',d.x,d.y);noise(d.x,d.y,10*TS,'bark',d);bubble(d,'汪！汪！','scream',1);
      if(who.isPlayer&&!G.flags.dog1){G.flags.dog1=1;log('你經過時，狗叫了起來。整條街都聽得到。','absurd')}}
    d.bark-=dt}
}

/* ---------------- ending ---------------- */
let bestScore=0;try{bestScore=+localStorage.getItem('kaidan-best')||0}catch(e){}
function endGame(kind){
  if(G.over)return;G.over=kind;const P=G.player;
  const surv=G.humans.filter(h=>!h.isPlayer);
  if(kind==='dawn'){const a=surv.filter(h=>alive(h));G.dawnSaved=a.length;log(`雞啼了。怪談散去${a.length?'，'+a.map(h=>h.name).join('、')+'撐到了天亮':''}。`,'save')}
  const pAlive=kind==='escape'||kind==='dawn';
  const dead=surv.filter(h=>h.dead).length,gone=surv.filter(h=>h.gone).length,left=kind==='dawn'?0:surv.filter(h=>alive(h)&&!h.saved).length;
  const score=G.saved*100+G.dawnSaved*60+(pAlive?80:0)+(kind==='escape'?Math.max(0,Math.floor((G.night-G.t)/4)):0);
  const isBest=score>bestScore;if(isBest){bestScore=score;try{localStorage.setItem('kaidan-best',score)}catch(e){}}
  G.result={kind,pAlive,dead,gone,left,score,isBest,total:surv.length};
  if(pAlive)SND.bell();else SND.scare(G.scare&&G.scare.type);
  if(pAlive)setTimeout(()=>UI.showEnd(),500);else setTimeout(()=>UI.showDeath(),950);
}
