// runs inside the page; returns [{name,ok,detail}]
(()=>{const R=[];const T=(name,fn)=>{try{const d=fn();R.push({name,ok:!!(d===true||(d&&d.ok)),detail:d&&d.detail!==undefined?d.detail:d})}catch(e){R.push({name,ok:false,detail:String(e.stack||e)})}};
KT.manual=true;const TS=24;
const fresh=(seed)=>{KT.startGame(seed||777);const G=KT.G;G.schedule=[];G.monsters=[];G.events=[];G.apps=[];G.apparition=null;G.dogs=[];G.scareT=1e9;G.reserve=[];return G};
const surv=G=>G.humans.filter(h=>!h.isPlayer);
const put=(e,tx,ty)=>{e.x=(tx+.5)*TS;e.y=(ty+.5)*TS};
const run=(sec)=>KT.step(Math.round(sec*60));
T('虎姑婆打開有人的衣櫃，躲在裡面的人會被抓',()=>{const G=fresh();const P=G.player;const c=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);KT.hideIn(c);put(P,c.tx,c.ty);P.x=c.x;P.y=c.y;
  const m=KT.spawnMonster('tiger',{x:c.x+3*TS,y:c.y+TS});KT.UI.closeMeet();run(15);/* tiger is 0.8x in 子時 */return{ok:P.dead===true,detail:`dead=${P.dead} over=${G.over}`}});
T('裂口女問話時回答「普通」就能脫身',()=>{const G=fresh();const P=G.player;put(P,41,30);const m=KT.spawnMonster('kuchi',{x:P.x+4*TS,y:P.y});KT.UI.closeMeet();let t=0;while(m.state!=='ask'&&t<200){run(.05);t++}
  const it=KT.interactTarget();const lab=it&&it.label;it&&it.fn();run(6);return{ok:lab==='回答「普通」'&&!P.dead,detail:`label=${lab} dead=${P.dead} st=${m.state}`}});
T('裂口女：不回答就會被追上',()=>{const G=fresh();const P=G.player;put(P,41,30);G.inv.candy=0;KT.spawnMonster('kuchi',{x:P.x+4*TS,y:P.y});KT.UI.closeMeet();run(6);return{ok:P.dead===true,detail:`dead=${P.dead}`}});
T('蹲在草叢裡，裂口女看不見',()=>{const G=fresh();const P=G.player;put(P,6,40);P.crouch=true;const m=KT.spawnMonster('kuchi',{x:P.x+3*TS,y:P.y});KT.UI.closeMeet();
  return{ok:!KT.canSee(m,P),detail:`tile=${G.map[40][6]}`}});
T('魔神仔看得到草叢裡的人',()=>{const G=fresh();const P=G.player;put(P,6,40);P.crouch=true;const m=KT.spawnMonster('mosin',{x:P.x+3*TS,y:P.y});KT.UI.closeMeet();return KT.canSee(m,P)});
T('鞭炮：嚇跑魔神仔、引來虎姑婆，寫下荒謬紀錄',()=>{const G=fresh();const P=G.player;put(P,41,30);const a=KT.spawnMonster('mosin',{x:P.x+3*TS,y:P.y});const b=KT.spawnMonster('tiger',{x:P.x-6*TS,y:P.y});KT.UI.closeMeet();
  KT.bang(P.x+TS,P.y);return{ok:a.state==='flee'&&b.state==='investigate'&&G.log.some(l=>l.tag==='absurd'),detail:`${a.state}/${b.state}`}});
T('殭屍：屏息就看不見；不屏息看得見',()=>{const G=fresh();const P=G.player;put(P,41,30);const m=KT.spawnMonster('jiang',{x:P.x+3*TS,y:P.y});KT.UI.closeMeet();const a=KT.canSee(m,P);P.holding=true;P.breath=3;const b=KT.canSee(m,P);P.holding=false;return{ok:a&&!b,detail:`${a}/${b}`}});
T('殭屍跨不過門檻',()=>{const G=fresh();const m=KT.spawnMonster('jiang',{x:30*TS,y:30*TS});KT.UI.closeMeet();const pass=[['d',23,36],['h',23,39]].map(([c,x,y])=>G.map[y][x]);
  const p=(function(){const f=window.eval('monsterPass')(m);return [f(23,36),f(22,38),f(30,30)]})();return{ok:!p[0]&&!p[1]&&p[2],detail:JSON.stringify({pass,p})}});
T('符咒正面拍在殭屍額頭，牠會定住',()=>{const G=fresh();const P=G.player;put(P,41,30);G.inv.talisman=1;const m=KT.spawnMonster('jiang',{x:P.x+34,y:P.y});KT.UI.closeMeet();KT.setState(m,'stun',99);m.x=P.x+34;m.y=P.y;P.face=0;/* pinned: no RNG hop */KT.mouse.active=false;KT.keys.Space=true;P.holding=true;P.breath=5;KT.useItem('talisman');run(.5);KT.keys.Space=false;return{ok:m.sealed===true,detail:m.state}});
T('煤油著火：擋住怪談、燙退虎姑婆',()=>{const G=fresh();const P=G.player;put(P,41,30);const m=KT.spawnMonster('tiger',{x:P.x+4*TS,y:P.y});KT.UI.closeMeet();KT.landProjectile({type:'oil',tx:m.x-6,ty:m.y});
  const blocked=!window.eval('monsterPass')(KT.spawnMonster('kuchi',{x:10*TS,y:10*TS}))(Math.floor(m.x/TS),Math.floor(m.y/TS));return{ok:G.fires.length===1&&m.state==='flee'&&blocked,detail:`${m.state} fires=${G.fires.length} blocked=${blocked}`}});
T('麥芽糖是氣味誘餌：虎姑婆和裂口女都會去聞',()=>{const G=fresh();const P=G.player;put(P,41,40);const a=KT.spawnMonster('tiger',{x:P.x+5*TS,y:P.y});const b=KT.spawnMonster('kuchi',{x:P.x-5*TS,y:P.y});KT.UI.closeMeet();KT.landProjectile({type:'candy',tx:P.x,ty:P.y+3*TS});return{ok:a.state==='eat'&&b.state==='eat',detail:a.state+'/'+b.state}});
T('線香的煙：虎姑婆聞不到煙裡的小孩，殭屍聽不到呼吸',()=>{const G=fresh();const P=G.player;put(P,41,40);const kid=surv(G).find(h=>h.child);if(kid.spot)KT.exitSpot(kid);put(kid,41,41);
  const t=KT.spawnMonster('tiger',{x:P.x+3*TS,y:P.y});const j=KT.spawnMonster('jiang',{x:P.x-3*TS,y:P.y});KT.UI.closeMeet();const before=[KT.canSee(j,P)];G.wards.push({x:P.x,y:P.y+10,r:2.7*TS,t:25,max:25,smoke:true});
  const smell=window.eval('smell')(t);return{ok:before[0]&&!KT.canSee(j,P)&&smell!==kid,detail:`jiangBefore=${before[0]} after=${KT.canSee(j,P)} smell=${smell&&smell.name}`}});
T('鞭炮：附近的怪談會被嚇一跳',()=>{const G=fresh();const P=G.player;put(P,41,30);const m=KT.spawnMonster('kuchi',{x:P.x+3*TS,y:P.y});KT.UI.closeMeet();KT.bang(m.x+10,m.y);return{ok:m.state==='stun',detail:m.state}});
T('土地公廟擋住虎姑婆；香火燒完就擋不住',()=>{const G=fresh();const P=G.player;put(P,41,17);const s=surv(G)[0];s.child=true;put(s,41,18);s.state='stay';
  const m=KT.spawnMonster('tiger',{x:41.5*TS,y:25*TS});KT.UI.closeMeet();G.incense=1e9;run(10);const safe=!P.dead&&!s.dead;G.incense=0;run(15);return{ok:safe&&(P.dead||s.dead),detail:`safe=${safe} after: P=${P.dead} s=${s.dead}`}});
T('裂口女直接進廟',()=>{const G=fresh();const P=G.player;put(P,41,17);G.incense=1e9;G.inv.candy=0;KT.spawnMonster('kuchi',{x:41.5*TS,y:25*TS});KT.UI.closeMeet();run(10);return P.dead});
T('水鬼只抓水裡的人',()=>{const G=fresh();const P=G.player;put(P,72,20);/* dirt ridge */const m=KT.spawnMonster('suigui',{x:72.5*TS,y:18.5*TS});KT.UI.closeMeet();const a=KT.canSee(m,P);put(P,72,18);const b=KT.canSee(m,P);return{ok:!a&&b,detail:`ridge=${G.map[20][72]} ${a}/${b}`}});
T('水鬼把人拖下水，連按方向鍵可掙脫',()=>{const G=fresh();const P=G.player;put(P,67,38);const m=KT.spawnMonster('suigui',{x:68.5*TS,y:37.5*TS});KT.UI.closeMeet();let t=0;while(!P.drown&&t<300){run(.05);t++}
  const grabbed=!!P.drown;P.mash=10;run(.1);return{ok:grabbed&&!P.drown&&!P.dead,detail:`grabbed=${grabbed} dead=${P.dead}`}});
T('魔神仔牽走草叢中的倖存者，最後只剩鞋',()=>{const G=fresh();const P=G.player;put(P,41,52);const s=surv(G)[0];put(s,6,40);s.state='hide';s.spot=null;const m=KT.spawnMonster('mosin',{x:8.5*TS,y:40.5*TS});KT.UI.closeMeet();run(30);
  return{ok:s.gone&&G.decals.some(d=>d.type==='shoes'),detail:`gone=${s.gone} lured=${!!s.lured} st=${m.state}`}});
T('跟隨者走到貨車旁就上車',()=>{const G=fresh();const P=G.player;const s=surv(G)[0];if(s.spot)KT.exitSpot(s);put(P,41,47);put(s,41,46);KT.callSurv(s);for(let i=0;i<40;i++){P.y+=6;run(.1)}return{ok:s.saved&&G.saved===1,detail:`saved=${s.saved} st=${s.state}`}});
T('撤離要按兩次確認',()=>{const G=fresh();const P=G.player;put(P,41,54);const a=KT.interactTarget();a.fn();const b=KT.interactTarget();b.fn();return{ok:/還有/.test(a.label)&&G.over==='escape',detail:a.label+' / '+b.label}});
T('搶先躲進衣櫃寫下懊悔紀錄',()=>{const G=fresh();const P=G.player;const c=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);put(P,c.tx,c.ty+1);const s=surv(G).find(h=>!h.spot);put(s,c.tx+1,c.ty+1);KT.callSurv(s);
  KT.spawnMonster('tiger',{x:P.x+6*TS,y:P.y});KT.UI.closeMeet();KT.hideIn(c);return{ok:G.log.some(l=>l.tag==='regret'),detail:G.log.slice(-2).map(l=>l.text).join('|')}});
T('第一次遇見怪談會暫停並翻開怪談錄',()=>{try{localStorage.removeItem('kaidan-codex')}catch(e){}KT.UI.seenBook.clear();KT.manual=false;KT.startGame(99);const G=KT.G;G.schedule=[];KT.spawnMonster('jiang',{x:41*TS,y:40*TS});
  const ok=G.paused&&!document.querySelector('#meet').hidden&&document.querySelector('#meetname').textContent==='殭屍';KT.UI.closeMeet();const resumed=!G.paused;KT.spawnMonster('jiang',{x:41*TS,y:40*TS});const second=document.querySelector('#meet').hidden;KT.manual=true;return{ok:ok&&resumed&&second,detail:`${ok}/${resumed}/${second}`}});
T('結算報紙：死亡',()=>{const G=fresh(31);const P=G.player;put(P,41,30);G.inv.candy=0;KT.spawnMonster('kuchi',{x:P.x+4*TS,y:P.y});KT.UI.closeMeet();run(6);KT.UI.showEnd();const h=document.querySelector('#headline').textContent;return{ok:G.over==='dead'&&h.length>4&&document.querySelector('#article').textContent.length>60,detail:h}});
T('結算報紙：天亮',()=>{const G=fresh(32);G.t=G.night-.05;run(.2);KT.UI.showEnd();return{ok:G.over==='dawn',detail:document.querySelector('#headline').textContent+' | '+document.querySelector('#article').textContent.slice(0,120)}});

T('開場約 20 秒只有預兆；第一個怪談 28–32 秒出現、不是水鬼、生在 8 格外',()=>{const out=[];let ok=true;
  for(const seed of [4321,1,2,77,2024,9001]){KT.startGame(seed);const G=KT.G;for(const k in KT.keys)KT.keys[k]=false;KT.mouse.active=false;const P=G.player;
    const s0=G.schedule.slice().sort((a,b)=>a.t-b.t)[0];const ev=G.events.find(e=>e.type==='scream');let near=99,early=0;
    while(G.t<20){KT.update(1/60);if(!document.querySelector('#meet').hidden)KT.UI.closeMeet();early+=G.monsters.length;for(const m of G.monsters)near=Math.min(near,Math.hypot(m.x-P.x,m.y-P.y)/TS)}
    let sp=null;while(G.t<34&&!G.monsters.length)KT.update(1/60);const m=G.monsters[0];if(m){KT.UI.closeMeet();sp={t:+G.t.toFixed(1),type:m.type,d:+(Math.hypot(m.x-P.x,m.y-P.y)/TS).toFixed(1)}}
    const good=s0.t>=28&&s0.t<=32&&s0.omen>=17&&s0.type!=='suigui'&&early===0&&near>8&&ev&&ev.t<=15&&G.scareT>0&&m&&sp.d>=8&&Math.min(...G.apps.map(a=>a.t))>=70;ok=ok&&good;
    out.push(`${seed}:${s0.type}@${s0.t.toFixed(1)}(omen ${s0.omen.toFixed(1)}) spawn=${JSON.stringify(sp)} early=${early}${good?'':' ✗'}`)}
  return{ok,detail:out.join(' | ')}});
T('每過一個時辰怪談變快，最後一分鐘更急',()=>{const G=fresh();const h0=G.heat;G.t=G.night/3+1;KT.updNight(.016);const h1=G.heat;G.t=G.night-30;KT.updNight(.016);return{ok:h1>h0&&G.heat>h1&&G.final,detail:`${h0} → ${h1} → ${G.heat}`}});
T('太久沒遇到怪談，最近的那個會往你這邊來',()=>{const G=fresh();const P=G.player;put(P,41,40);const m=KT.spawnMonster('jiang',{x:5*TS,y:5*TS});KT.UI.closeMeet();for(let i=0;i<25*60&&m.state!=='investigate';i++)KT.updNight(1/60);return{ok:m.state==='investigate'&&Math.hypot(m.goal.x-P.x,m.goal.y-P.y)<4*TS,detail:m.state}});
T('關上的門：怪談要撞一陣子才進得來',()=>{const G=fresh();const P=G.player;put(P,23,38);const m=KT.spawnMonster('kuchi',{x:23.5*TS,y:34.5*TS});KT.UI.closeMeet();KT.setDoor(23,36,true);m.target=P;KT.setState(m,'chase');m.target=P;let saw=false;
  for(let i=0;i<60*8;i++){run(1/60);if(m.state==='bash')saw=true;if(G.map[36][23]==='d')break}return{ok:saw&&G.map[36][23]==='d'&&G.log.some(l=>/撞開了門/.test(l.text)),detail:`bash=${saw} tile=${G.map[36][23]}`}});
T('貼了符的門撞不開',()=>{const G=fresh();const P=G.player;put(P,23,38);const m=KT.spawnMonster('kuchi',{x:23.5*TS,y:34.5*TS});KT.UI.closeMeet();KT.setDoor(23,36,true);G.sealed.add('23,36');G.sealed.add('24,36');KT.setState(m,'chase');m.target=P;run(8);return{ok:G.map[36][23]==='D',detail:`tile=${G.map[36][23]} st=${m.state}`}});
T('敲鐘會把怪談引過去',()=>{const G=fresh();const P=G.player;const bell=G.props.find(p=>p.type==='Z');put(P,bell.tx,bell.ty+1);const m=KT.spawnMonster('tiger',{x:bell.x+10*TS,y:bell.y});KT.UI.closeMeet();const it=KT.interactTarget();it.fn();return{ok:/敲鐘/.test(it.label)&&m.state==='investigate',detail:it.label+' / '+m.state}});
T('躲進井裡很安全，但待太久水鬼會從井底抓人',()=>{const G=fresh();const P=G.player;const w=G.spots.find(s=>s.type==='well');KT.hideIn(w);const t=KT.spawnMonster('tiger',{x:w.x+30,y:w.y});KT.UI.closeMeet();const safe=!KT.canSee(t,P);G.monsters=[];const s=KT.spawnMonster('suigui',{x:72.5*TS,y:18.5*TS});KT.UI.closeMeet();run(10);return{ok:safe&&!!P.drown,detail:`safe=${safe} drown=${!!P.drown}`}});
T('站在路燈下，怪談看得比較遠；打破路燈就暗了',()=>{const G=fresh();const P=G.player;const l=G.lamps.find(l=>!l.broken);put(P,l.tx,l.ty+1);G.lampsOff=0;const m=KT.spawnMonster('kuchi',{x:P.x+11*TS,y:P.y});KT.UI.closeMeet();P.crouch=false;const lit=KT.canSee(m,P);l.dead=true;const dark=KT.canSee(m,P);return{ok:lit&&!dark,detail:`lit=${lit} dark=${dark}`}});
T('撞到風鈴會發出聲音，把怪談引過來',()=>{const G=fresh();const P=G.player;const j=G.props.find(p=>p.type==='J');put(P,j.tx,j.ty+1);G.mod=Object.assign({},G.mod,{noise:1});const m=KT.spawnMonster('jiang',{x:j.x+7.5*TS,y:j.y});KT.UI.closeMeet();KT.mouse.active=false;KT.keys.KeyD=true;let st='';for(let i=0;i<30&&!(j.ring>0);i++){run(1/60);st=m.state}KT.keys.KeyD=false;return{ok:j.ring>0&&st==='investigate',detail:`ring=${j.ring} m=${st}`}});
T('狗看到人會叫，叫聲會引來怪談；丟糖牠就安靜',()=>{const G=KT.G;KT.startGame(888);const g=KT.G;g.schedule=[];g.events=[];g.apps=[];const d=g.dogs[0];const P=g.player;P.x=d.x+40;P.y=d.y;const m=KT.spawnMonster('tiger',{x:d.x+8*TS,y:d.y});KT.mouse.active=false;KT.UI.closeMeet();for(let i=0;i<3;i++)KT.update(1/60);
  const barked=m.state==='investigate';KT.landProjectile({type:'candy',tx:d.x,ty:d.y});return{ok:barked&&d.quiet,detail:`barked=${barked} quiet=${d.quiet}`}});
T('撿到紙條會知道一個人的位置',()=>{const G=fresh();const P=G.player;const c=G.clues[0];P.x=c.x;P.y=c.y;run(.05);const h=surv(G).find(h=>h.reveal>G.t);return{ok:c.taken&&!!h,detail:h&&h.name}});
T('紅衣小女孩：三秒不動就沒事',()=>{const G=fresh();const P=G.player;put(P,41,40);KT.startApparition('girl');run(4.2);return{ok:!G.apparition&&G.t>=G.darkUntil&&G.log.some(l=>/一動也不敢動/.test(l.text)),detail:G.log.slice(-1)[0].text}});
T('紅衣小女孩：動了就受罰（燈滅、怪談被引來、帶走同伴）',()=>{const G=fresh();const P=G.player;put(P,41,40);const s=surv(G).find(h=>!h.spot);put(s,41,41);KT.callSurv(s);const m=KT.spawnMonster('jiang',{x:P.x+12*TS,y:P.y});KT.UI.closeMeet();KT.startApparition('girl');run(.7);KT.keys.KeyA=true;run(.4);KT.keys.KeyA=false;
  return{ok:G.darkUntil>G.t&&m.state==='investigate'&&s.gone,detail:`dark=${G.darkUntil>G.t} m=${m.state} taken=${s.gone}`}});
T('夜半送葬：一直用手電筒照它，會被帶進隊伍',()=>{const G=fresh();const P=G.player;KT.mouse.active=false;put(P,41,34);KT.startApparition('funeral');const A=G.apparition;A.pos=P.x+3*TS;A.dir=-1;A.road={axis:'x',c:32,a:2,b:81};A.end=2*TS;P.face=-Math.PI/2+.3;
  for(let i=0;i<120&&!P.lured;i++){const p=window.eval('apPos')(A,2);P.face=Math.atan2(p.y-P.y,p.x-P.x);run(1/60*1)}return{ok:!!P.lured,detail:`lured=${!!P.lured} look=${A.look.toFixed(2)}`}});
T('夜半送葬：蹲下低頭就沒事',()=>{const G=fresh();const P=G.player;KT.mouse.active=false;put(P,41,40);P.face=Math.PI/2;P.crouch=true;KT.startApparition('funeral');const A=G.apparition;let lured=false;for(let i=0;i<60*60&&G.apparition;i++){run(1/60);if(P.lured)lured=true}return{ok:!lured&&!G.apparition,detail:`lured=${lured}`}});
T('叫名字：回頭就受罰',()=>{const G=fresh();const P=G.player;put(P,41,40);P.face=0;KT.startApparition('voice');run(.8);P.face=Math.PI;run(.3);return{ok:G.apparition&&G.apparition.violated||G.darkUntil>G.t,detail:`dark=${G.darkUntil>G.t}`}});
T('叫名字：按互動回答也算違規',()=>{const G=fresh();const P=G.player;put(P,41,40);P.face=0;KT.startApparition('voice');run(.8);KT.interact();run(.1);return{ok:G.darkUntil>G.t,detail:''}});
T('叫名字：不回頭、不回答就沒事',()=>{const G=fresh();const P=G.player;put(P,41,40);P.face=0;KT.mouse.active=false;KT.startApparition('voice');run(5);return{ok:!G.apparition&&G.t>=G.darkUntil,detail:G.log.slice(-1)[0].text}});
T('被抓時出現死亡卡，按 R 立刻再來',()=>{KT.manual=true;const G=fresh(55);const P=G.player;put(P,41,30);KT.spawnMonster('kuchi',{x:P.x+3*TS,y:P.y});KT.UI.closeMeet();run(8);KT.UI.showDeath();const shown=!document.querySelector('#death').hidden&&document.querySelector('#deathline').textContent.includes('裂口女');
  document.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR',bubbles:true}));window.dispatchEvent(new KeyboardEvent('keydown',{code:'KeyR'}));const fresh2=KT.G!==G&&!KT.G.over;return{ok:shown&&fresh2,detail:`shown=${shown} restarted=${fresh2}`}});
T('子時虎姑婆看到你會先盯著走近（stalk），再撲上來（chase）',()=>{const G=fresh(4242);G.mod=Object.assign({},G.mod,{id:'calm',noise:1});G.fogUntil=0;const P=G.player;put(P,41,40);KT.mouse.active=false;
  const m=KT.spawnMonster('tiger',{x:P.x+5*TS,y:P.y});KT.UI.closeMeet();m.face=Math.PI;const seq=[];let t0=null,t1=null;
  for(let i=0;i<60*8&&!P.dead;i++){run(1/60);if(seq[seq.length-1]!==m.state)seq.push(m.state);if(m.state==='stalk'&&t0===null)t0=G.t;if(m.state==='chase'&&t1===null)t1=G.t}
  const si=seq.indexOf('stalk'),ci=seq.indexOf('chase');return{ok:G.phase===0&&si>=0&&ci>si&&t1-t0>.4,detail:`seq=${seq.join('>')} stalk ${t0&&t0.toFixed(2)}→chase ${t1&&t1.toFixed(2)} heat=${G.heat}`}});
T('最後一分鐘：還沒救的村民一起喊你、位置被標出來、附近的怪談被引過去',()=>{const G=fresh(5150);const P=G.player;put(P,41,52);const left=surv(G).filter(h=>!h.saved);const v=left.find(h=>h.spot)||left[0];
  const m=KT.spawnMonster('tiger',{x:v.x+7*TS,y:v.y});KT.UI.closeMeet();KT.setState(m,'patrol');const far=KT.spawnMonster('jiang',{x:v.x+30*TS>80*TS?v.x-30*TS:v.x+30*TS,y:v.y});KT.UI.closeMeet();KT.setState(far,'patrol');
  G.t=G.night-60.5;let st0='';for(let i=0;i<120&&!G.final;i++)run(1/60);st0=m.state;const gd=m.goal?Math.hypot(m.goal.x-v.x,m.goal.y-v.y)/TS:99;run(1);const rev=left.filter(h=>h.reveal>=G.night-1).length,bub=G.bubbles.filter(b=>/天快亮了/.test(b.text||'')).length;
  return{ok:G.final&&rev===left.length&&bub>=1&&st0==='investigate'&&gd<1.5&&far.state!=='investigate'&&G.heat>1.1,detail:`final=${G.final} revealed=${rev}/${left.length} bubbles=${bub} near=${st0}(goal ${gd.toFixed(1)} tiles from villager, 1s later ${m.state}) far=${far.state} heat=${G.heat}`}});
T('裂口女：離你還遠時不會出現「回答」，走到身邊才倒數',()=>{const G=fresh(6060);const P=G.player;put(P,41,40);KT.mouse.active=false;G.inv.candy=0;
  const m=KT.spawnMonster('kuchi',{x:P.x+8*TS,y:P.y});KT.UI.closeMeet();KT.setState(m,'ask',2.2);m.target=P;m.askWalk=0;m.askNear=false;m.lost=0;m.lastX=P.x;m.lastY=P.y;
  const it0=KT.interactTarget(),far0=!(it0&&/回答/.test(it0.label));run(.3);const timerFar=m.timer;let near=null;
  for(let i=0;i<60*8&&m.state==='ask';i++){run(1/60);const it=KT.interactTarget();if(it&&/回答/.test(it.label)){near=Math.hypot(m.x-P.x,m.y-P.y)/TS;break}}
  return{ok:far0&&timerFar>2.19&&near!==null&&near<5.01,detail:`farPrompt=${!far0} timerAfter0.3s=${timerFar.toFixed(2)} promptAt=${near&&near.toFixed(1)}tiles st=${m.state}`}});
T('驚嚇特寫開關：存進 localStorage，關掉時不畫特寫',()=>{const G=fresh(7070);const P=G.player;put(P,41,40);const was=localStorage.getItem('kaidan-closeup');
  const cs=KT.closeSprite('tiger',0),CW=cs.width,CH=cs.height;const proto=CanvasRenderingContext2D.prototype,orig=proto.drawImage;let big=0;proto.drawImage=function(img,...a){if(img&&img.width===CW&&img.height===CH&&a.length>=4&&a[2]>200)big++;return orig.call(this,img,...a)};
  const count=()=>{big=0;G.scare={type:'tiger',t:0};for(const t of[.2,.35,.5,.6]){KT.freezeLunge(t);KT.draw()}return big};let on,off,stored,label;
  try{if(localStorage.getItem('kaidan-closeup')==='0')KT.toggleCloseup();on=count();KT.toggleCloseup();stored=localStorage.getItem('kaidan-closeup');KT.setPause(true);label=document.querySelector('#closeup').textContent;KT.setPause(false);off=count();KT.toggleCloseup()}
  finally{proto.drawImage=orig;KT.freezeLunge(null);G.scare=null}
  return{ok:on>0&&off===0&&stored==='0'&&/關/.test(label)&&localStorage.getItem('kaidan-closeup')==='1',detail:`closeup ${CW}x${CH} on=${on} off=${off} stored=${stored} label=${label} restored=${localStorage.getItem('kaidan-closeup')} before=${was}`}});
T('打破規則的短撲臉不會結束這一夜',()=>{const G=fresh(8080);const P=G.player;put(P,41,40);KT.mouse.active=false;KT.startApparition('girl');run(.7);KT.keys.KeyA=true;run(.4);KT.keys.KeyA=false;const fl=!!G.flash;
  const e0=(KT.err||[]).length;for(const t of[.05,.2,.3,.5,.8]){KT.freezeLunge(t);KT.draw()}KT.freezeLunge(null);run(3);KT.draw();
  return{ok:fl&&!G.over&&!P.dead&&(KT.err||[]).length===e0,detail:`flash=${fl} over=${G.over} dead=${P.dead} errs=${(KT.err||[]).length-e0}`}});
T('第一個怪談生在你周圍 16–22 格、你看不到的地方，0.8 秒內聽得到，先放過尖叫的村民最多 60 秒',()=>{const out=[];let ok=true;const los=window.eval('los');
  for(const seed of [4321,1,2,77,2024,9001,31337,555]){KT.startGame(seed);const G=KT.G;for(const k in KT.keys)KT.keys[k]=false;KT.mouse.active=false;const P=G.player;
    while(!G.monsters.length&&G.t<34){KT.update(1/60);if(!document.querySelector('#meet').hidden)KT.UI.closeMeet()}const m=G.monsters[0];KT.UI.closeMeet();
    const d=Math.hypot(m.x-P.x,m.y-P.y)/TS,seen=los(P.x,P.y,m.x,m.y),c=G.flags.cry,spare=m.ignore&&c&&m.ignore.h===c?m.ignore.until-G.t:null;
    const good=d>=15.5&&d<=22.5&&!seen&&m.cueT<=.81&&(m.type==='suigui'||!c||!(c.dead||c.gone)&&spare!==null&&spare<=60.01&&spare>=59.9);ok=ok&&good;
    out.push(`${seed}:${m.type} d=${d.toFixed(1)} los=${seen} cue=${m.cueT.toFixed(2)} spare=${spare&&spare.toFixed(1)}${good?'':' ✗'}`)}
  return{ok,detail:out.join(' | ')}});
T('被放過的尖叫村民：躲在衣櫃裡，虎姑婆 60 秒內不會開那個衣櫃；過了就會',()=>{const G=fresh(1212);const P=G.player;put(P,41,52);const c=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);const v=surv(G).find(h=>!h.spot);
  v.spot=c;c.occ.push(v);v.x=c.x;v.y=c.y;v.state='hide';G.flags.cry=v;const m=KT.spawnMonster('tiger',{x:c.x+2*TS,y:c.y+TS});KT.UI.closeMeet();m.ignore={h:v,until:G.t+60};
  run(15);const safe=!v.dead&&c.occ.includes(v);G.t=m.ignore.until+.1;m.x=c.x+2*TS;m.y=c.y+TS;KT.setState(m,'patrol');run(15);return{ok:safe&&!!v.dead,detail:`spared=${safe} after60=${v.dead} st=${m.state}`}});
T('兩個規則怪談之間至少隔 35 秒',()=>{const G=fresh(1313);const P=G.player;put(P,41,40);KT.mouse.active=false;P.face=0;G.apps=[{t:1,type:'voice'},{t:2,type:'girl'}];const starts=[],ends=[];let was=null;
  for(let i=0;i<60*60;i++){run(1/60);const a=G.apparition;if(a&&!was)starts.push(+G.t.toFixed(2));if(!a&&was)ends.push(+G.t.toFixed(2));was=a}
  return{ok:starts.length===2&&starts[1]-ends[0]>=35&&G.darkUntil<=G.t,detail:`starts=${starts} ends=${ends}`}});
T('寅時增援：預兆在 272 秒、怪談正好在 280 秒出現',()=>{const G=fresh(1414);G.reserve=['jiang'];G.t=268;let omen=null,at=null;const n0=G.log.length;
  for(let i=0;i<60*15&&at===null;i++){run(1/60);if(omen===null&&G.schedule.length)omen=G.schedule[0].omen;if(G.monsters.length)at=G.t;KT.UI.closeMeet()}
  return{ok:omen!==null&&Math.abs(omen-272)<.05&&at!==null&&at>=280&&at<280.05,detail:`omen=${omen&&omen.toFixed(2)} spawn=${at&&at.toFixed(2)}`}});
T('紅衣小女孩看著你時，14 格內的怪談也定住（位置、狀態、計時都不動）；更遠的照常行動',()=>{const G=fresh(1515);const P=G.player;put(P,41,40);KT.mouse.active=false;
  const a=KT.spawnMonster('tiger',{x:P.x+12*TS,y:P.y});const b=KT.spawnMonster('jiang',{x:P.x-20*TS,y:P.y});KT.UI.closeMeet();KT.setState(a,'investigate',20);a.goal={x:P.x,y:P.y};KT.setState(b,'investigate',20);b.goal={x:P.x,y:P.y};
  KT.startApparition('girl');const a0=[a.x,a.y],b0=[b.x,b.y];const sb=[];for(let i=0;i<150;i++){run(1/60);if(i%30===0)sb.push(b.state)}const da=Math.hypot(a.x-a0[0],a.y-a0[1]),db=Math.hypot(b.x-b0[0],b.y-b0[1]);
  return{ok:da<.5&&a.state==='investigate'&&a.timer===20&&(b.state!=='investigate'||b.timer<19)&&!!G.apparition&&!G.apparition.violated,detail:`near moved ${da.toFixed(1)}px st=${a.state} timer=${a.timer}; far timer=${b.timer.toFixed(1)} moved ${db.toFixed(1)}px (${sb}) log=${G.log.some(l=>/停住了/.test(l.text))}`}});
T('夜半送葬經過時，3 格內的怪談會讓路（逃開），寫下荒謬紀錄',()=>{const G=fresh(1616);const P=G.player;put(P,41,40);P.crouch=true;P.face=Math.PI/2;KT.mouse.active=false;
  KT.startApparition('funeral');const A=G.apparition;A.road={axis:'x',c:32,a:2,b:81};A.dir=1;A.pos=30*TS;A.end=81*TS;const m=KT.spawnMonster('tiger',{x:33*TS,y:33*TS});KT.UI.closeMeet();KT.setState(m,'patrol');
  const far=KT.spawnMonster('kuchi',{x:60*TS,y:45*TS});KT.UI.closeMeet();KT.setState(far,'patrol');let st=null;for(let i=0;i<60*3&&st!=='flee';i++){run(1/60);st=m.state}
  return{ok:st==='flee'&&far.state!=='flee'&&G.log.some(l=>l.tag==='absurd'&&/送葬/.test(l.text)),detail:`near=${st} far=${far.state} log=${G.log.slice(-1)[0].text}`}});
T('守規矩的村民在規則怪談出現時提醒你；用種子分配，不是每夜都有',()=>{let nights=0,has=0;for(let s=1;s<=20;s++){KT.startGame(s*101);nights++;if(KT.G.humans.some(h=>h.quirk==='pious'))has++}
  const G=fresh(1717);const P=G.player;put(P,41,40);P.face=0;KT.mouse.active=false;const v=surv(G).find(h=>h.kind!=='child'&&!h.spot)||surv(G).find(h=>h.kind!=='child');if(v.spot)KT.exitSpot(v);v.quirk='pious';put(v,43,40);
  KT.startApparition('voice');const b=G.bubbles.find(b=>b.text&&/別回頭/.test(b.text));KT.startGame(1717,'tutorial');const tut=KT.G.humans.some(h=>h.quirk==='pious');
  return{ok:!!b&&G.log.some(l=>/守規矩/.test(l.text))&&has>0&&has<nights&&!tut,detail:`bubble=${b&&b.text} piousNights=${has}/${nights} tutorial=${tut}`}});
T('殭屍「盯著你」時完全不動（位移 0），撲過來時才又跳',()=>{const G=fresh(4343);G.mod=Object.assign({},G.mod,{id:'calm',noise:1});G.fogUntil=0;const P=G.player;put(P,41,40);KT.mouse.active=false;
  const m=KT.spawnMonster('jiang',{x:P.x+4.5*TS,y:P.y});KT.UI.closeMeet();m.face=Math.PI;let i=0;while(m.state!=='stalk'&&i<300){run(1/60);i++}
  const x0=m.x,y0=m.y;let maxd=0,n=0;while(m.state==='stalk'&&n<600){run(1/60);n++;maxd=Math.max(maxd,Math.hypot(m.x-x0,m.y-y0))}const st=m.state,x1=m.x;run(1);const after=Math.hypot(m.x-x1,m.y-y0);
  return{ok:n>30&&maxd===0&&st==='chase'&&after>5,detail:`stalk ${(n/60).toFixed(2)}s maxMove=${maxd}px then ${st}, moved ${after.toFixed(1)}px in 1s`}});
const knockRun=(G,m,c,P,spaceFrom)=>{m.cool['s'+c.id]=0;m.cool.acq=1e9;m.target=null;m.x=c.x+20;m.y=c.y;KT.setState(m,'knock');m.spot=c;let k=0;
  for(;k<60*9&&m.state==='knock'&&!P.dead;k++){KT.keys.Space=m.timer>=spaceFrom;run(1/60)}KT.keys.Space=false;return{dead:!!P.dead,st:m.state}};
T('大人躲衣櫃屏住呼吸：第一次敲門撐過去；同一個衣櫃第二次被抓（整段都按住屏息）',()=>{const G=fresh(4444);const P=G.player;const c=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);P.x=c.x;P.y=c.y;KT.hideIn(c);
  const m=KT.spawnMonster('tiger',{x:c.x+20,y:c.y});KT.UI.closeMeet();const r1=knockRun(G,m,c,P,0);const hint=G.log.some(l=>/屏住呼吸/.test(l.text)),sus=c.suspect;
  P.breath=P.maxBreath;P.gasp=0;P.holding=false;run(.1);const r2=knockRun(G,m,c,P,0);
  return{ok:!r1.dead&&hint&&sus===1&&r2.dead,detail:`first: dead=${r1.dead} st=${r1.st} log=${hint} suspect=${sus}; second: dead=${r2.dead}`}});
T('小孩躲衣櫃一定會被虎姑婆聞到（就算憋氣）',()=>{const G=fresh(4545);const P=G.player;put(P,41,52);const kid=surv(G).find(h=>h.child);if(kid.spot)KT.exitSpot(kid);const c=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);
  kid.spot=c;c.occ.push(kid);kid.x=c.x;kid.y=c.y;kid.state='hide';kid.holding=true;kid.breath=99;const m=KT.spawnMonster('tiger',{x:c.x+20,y:c.y});KT.UI.closeMeet();m.cool['s'+c.id]=0;KT.setState(m,'knock');m.spot=c;run(4);
  return{ok:!!kid.dead,detail:`kid dead=${kid.dead} st=${m.state}`}});
T('第一個怪談循著最後的聲音過去；你安靜躲好，牠就不會找到你',()=>{const out=[];let ok=true;for(const seed of [4321,77,9001]){KT.startGame(seed);const G=KT.G;for(const k in KT.keys)KT.keys[k]=false;KT.mouse.active=false;const P=G.player;
    const c=G.spots.filter(s=>s.type==='cabinet'&&!s.occ.length).sort((a,b)=>Math.hypot(a.x-P.x,a.y-P.y)-Math.hypot(b.x-P.x,b.y-P.y))[0];P.x=c.x;P.y=c.y;KT.hideIn(c);
    while(G.t<25){KT.update(1/60);KT.UI.closeMeet()}const sgn={x:P.x+(P.x>40*TS?-12:12)*TS,y:P.y,t:G.t};G.sign=sgn;
    while(!G.monsters.length&&G.t<34){KT.update(1/60);KT.UI.closeMeet()}const m=G.monsters[0];KT.UI.closeMeet();if(!m){ok=false;out.push(seed+':none');continue}
    const toSign=m.type==='suigui'||m.huntT===sgn.t;let hunted=false;
    for(let i=0;i<60*25&&!P.dead;i++){KT.update(1/60);KT.UI.closeMeet();if(G.monsters.some(x=>x.target===P||(['knock','camp'].includes(x.state)&&x.spot===c)))hunted=true}
    const good=toSign&&!hunted&&!P.dead&&P.spot===c&&m.hunt<G.t;ok=ok&&good;out.push(`${seed}:${m.type} followedNoise=${toSign}, found=${hunted} dead=${!!P.dead} huntOver=${m.hunt<G.t}${good?'':' ✗'}`)}
  return{ok,detail:out.join(' | ')}});
T('守規矩的村民在一次規則怪談中提醒至少兩句',()=>{const G=fresh(4646);const P=G.player;put(P,41,40);P.face=0;KT.mouse.active=false;const v=surv(G).find(h=>h.kind!=='child'&&!h.spot)||surv(G).find(h=>h.kind!=='child');if(v.spot)KT.exitSpot(v);v.quirk='pious';put(v,43,40);v.state='stay';
  KT.startApparition('voice');const said=new Set();for(let i=0;i<60*6&&G.apparition;i++){run(1/60);for(const b of G.bubbles)if(b.ent===v)said.add(b.text)}
  return{ok:said.size>=2&&G.t>=G.darkUntil,detail:[...said].join(' / ')}});
return (async()=>{const wait=ms=>new Promise(r=>setTimeout(r,ms));
  // real-time: the capture lunge plays through the frame loop, then the death card
  try{const G=fresh(9090);const P=G.player;put(P,41,30);const e0=(KT.err||[]).length;KT.manual=false;const m=KT.spawnMonster('tiger',{x:P.x+20,y:P.y});KT.UI.closeMeet();KT.setState(m,'chase');m.target=P;
    let lunged=false,t=0;while(!G.over&&t<6000){await wait(30);t+=30}const tOver=t;for(let i=0;i<20;i++){await wait(40);if(document.querySelector('#stage').classList.contains('lunge'))lunged=true}
    await wait(900);const card=!document.querySelector('#death').hidden,cleared=!document.querySelector('#stage').classList.contains('lunge');KT.manual=true;
    R.push({name:'被抓時撲臉特寫跑完不出錯，接著出現死亡卡',ok:G.over==='dead'&&lunged&&card&&cleared&&(KT.err||[]).length===e0,detail:`over=${G.over} after ${tOver}ms lunge=${lunged} card=${card} cleared=${cleared} errs=${(KT.err||[]).length-e0}`})}
  catch(e){KT.manual=true;R.push({name:'被抓時撲臉特寫跑完不出錯，接著出現死亡卡',ok:false,detail:String(e.stack||e)})}
  return R})()})()
