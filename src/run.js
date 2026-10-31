/* =====================================================================
   七夜: a run of seven nights. What a night leaves behind is carried into the next one —
   gifts from the people you saved, the names of the people you lost, a blessing, paper stand-ins.
   Lives between ui.js's screens; gameplay only sees the opts it passes to newGame.
   ===================================================================== */
let RUN=null;
const inRun=()=>!!(G&&RUN&&G.runN!=null); // this night was started by the run (G.run is only the opts gameplay reads)
const runSeed=n=>(Math.imul(RUN.seed,2654435761)^Math.imul(n+1,40503))>>>0||1;
// a night left without dawn or death (title, reload, closed tab) still burns a stand-in; a finished run is recorded, then cleared
function loadRun(){RUN=store.get('kaidan-run',null);if(!RUN)return null;
  if(RUN.live!=null&&!RUN.done){RUN.live=null;RUN.lives--;RUN.tries=(RUN.tries||0)+1;RUN.deaths=(RUN.deaths||[]).concat([{n:RUN.night,end:'quit',lives:RUN.lives}]);if(RUN.lives<0){RUN.done=true;RUN.fail={n:RUN.night,by:null}}saveRun()}
  if(RUN.done||!(RUN.night<NIGHTS.length)){finishRun();store.set('kaidan-run',null);RUN=null}return RUN}
function finishRun(){if(RUN.recorded)return;RUN.recorded=true;const total=RUN.nights.reduce((a,n)=>a+n.total,0),best=store.get('kaidan-bestrun',null),score=RUN.saved*10+RUN.nights.length;
  RUN.prevBest=best;RUN.isBest=!best||score>best.score;if(RUN.isBest)store.set('kaidan-bestrun',{score,nights:RUN.nights.length,saved:RUN.saved,won:!!RUN.won});
  logPlay({kind:'run',won:!!RUN.won,nights:RUN.nights.length,saved:RUN.saved,total});saveRun()}
function saveRun(){store.set('kaidan-run',RUN)}
function newRun(){RUN={seed:(Math.random()*1e9)>>>0||1,night:0,lives:RUN_LIVES,bless:[],inv:{},gifts:[],calls:[],exclude:[],nights:[],saved:0,lost:[]};planNight();saveRun();
  $('#title').hidden=true;$('#runend').hidden=true;INTRO.play(OPENING,showNightCard)}
// who you are and why you are here: told once at the start of every run, skippable
const OPENING=['七天前，山腳村的老村長過世了。','出殯那天晚上，村子停電了。從那晚起，一入夜就停電；夜裡，有東西出來找人。','山下的人都不肯上去。只有你，開著替農會送月曆的貨車，答應了。','天亮前，把困在村裡的人帶上車。雞啼了，就走。'];
function startRun(){if(!loadRun())newRun();else if(RUN.offer)showBless();else showNightCard()}
// tonight's 農民曆: the seventh night is always 鬼門開; otherwise any unlocked night, never the same twice in a row
function planNight(){const cfg=NIGHTS[RUN.night];if(cfg.mod){RUN.mod=cfg.mod;return}const r=mulberry32(runSeed(RUN.night*7+3)),prev=RUN.nights.length?RUN.nights[RUN.nights.length-1].mod:null;
  const pool=modPool().filter(m=>m.id!=='gate'&&m.id!==prev);RUN.mod=pool[Math.floor(r()*pool.length)].id}
// everyone lost so far may call your name, and each of them makes the monsters a little faster for the rest of the run
function runOpts(){const cfg=NIGHTS[RUN.night];return{cfg,mod:RUN.mod,bless:RUN.bless,inv:RUN.inv,exclude:RUN.exclude,calls:RUN.lost,charmUsed:RUN.charmUsed,heat:cfg.heat*(1+.03*Math.min(8,RUN.lost.length))}}
function startRunNight(){$('#nightcard').hidden=true;startGame(runSeed(RUN.night),'village',runOpts());G.runN=RUN.night;RUN.live=RUN.night;saveRun();
  if(RUN.calls.length)UI.sub(`${RUN.calls.join('、')}昨夜沒有回來。今晚，小心背後有人叫你。`,'regret');UI.sub('天亮前，至少要帶一個人上車，這一夜才算數。','omen')}

// a night just ended (called once, from the death card or the newspaper)
function endRunNight(){if(!inRun()||G.runEnded)return;G.runEnded=true;RUN.live=null;const R=G.result,sv=G.humans.filter(h=>!h.isPlayer);
  const entry={n:RUN.night,mod:RUN.mod,end:R.kind,t:Math.round(G.t)};
  if(G.charmUsedTonight)RUN.charmUsed=true;
  const saved=sv.filter(h=>h.saved),dawn=sv.filter(h=>R.kind==='dawn'&&alive(h)),lost=sv.filter(h=>!saved.includes(h)&&!dawn.includes(h));
  if(R.pAlive&&!saved.length&&sv.length){G.runFailed=true;entry.end='alone'} // drove off alone, or hid till dawn: the paper stand-in pays for it
  if(!R.pAlive||G.runFailed){RUN.lives--;entry.lives=RUN.lives;RUN.tries=(RUN.tries||0)+1;RUN.deaths=(RUN.deaths||[]).concat([entry]);if(RUN.lives<0){RUN.done=true;RUN.fail={n:RUN.night,by:G.scare&&G.scare.type};finishRun()}saveRun();return}
  Object.assign(entry,{saved:saved.length,dawn:dawn.length,total:sv.length,lost:lost.map(h=>h.name),tries:RUN.tries||0});RUN.tries=0;
  RUN.nights.push(entry);RUN.saved+=saved.length;RUN.lost=RUN.lost.concat(entry.lost);RUN.exclude=RUN.exclude.concat(sv.map(h=>h.name));RUN.calls=entry.lost;
  // what you carry: up to two of each thing you did not use, plus one gift from each person you saved (at most four)
  const r=mulberry32(runSeed(RUN.night*7+5)),inv={};for(const k of ITEM_ORDER)inv[k]=Math.min(2,Math.max(0,G.inv[k]-(k==='firecracker'||k==='talisman'?1:0)));
  RUN.gifts=saved.slice(0,4).map(h=>{const k=GIFT_BAG[Math.floor(r()*GIFT_BAG.length)];inv[k]++;return[h.name,k]});
  if(RUN.bless.includes('bag'))for(let i=0;i<2;i++){const k=GIFT_BAG[Math.floor(r()*GIFT_BAG.length)];inv[k]++;RUN.gifts.push(['布袋',k])}
  RUN.inv=inv;RUN.night++;
  if(RUN.night>=NIGHTS.length){RUN.done=true;RUN.won=true;finishRun()}else{const all=Object.keys(BLESSINGS),key=b=>hash(RUN.seed&65535,RUN.night,all.indexOf(b)+1);
    RUN.offer=all.filter(b=>!RUN.bless.includes(b)).sort((a,b)=>key(a)-key(b)).slice(0,3);planNight()}
  saveRun()}
// R / the red button after a night, in either screen
function runNext(){endRunNight();if(RUN.done)return showRunEnd();if(!G.result.pAlive||G.runFailed)return startRunNight();showBless()}
function runRetryLabel(){return RUN.done?'七夜到此為止':`再來一次${NIGHTS[RUN.night].name}`}

/* ---------------- screens ---------------- */
const ITEM_NAME=k=>ITEMS[k].name;
function livesHTML(n){return Array.from({length:RUN_LIVES},(_,i)=>`<i class="doll${i<n?'':' burnt'}" aria-hidden="true"></i>`).join('')+`<span class="vh">替身剩 ${Math.max(0,n)} 個</span>`}
function showNightCard(){const cfg=NIGHTS[RUN.night],m=MODS.find(x=>x.id===RUN.mod);releaseKeys();
  ['#title','#end','#death','#bless','#runend'].forEach(s=>$(s).hidden=true);
  const lines=[];
  if(RUN.night===0)lines.push(`<p>山腳村要停電七個晚上。每一夜，天亮前把困在村裡的人帶上村口的貨車；一個人都沒帶回來，這一夜就不算數。被抓住時，紙紮的替身會替你死一次，你可以重來那一夜；替身燒完，七夜就結束了。</p>`);
  if(RUN.gifts.length)lines.push(`<p><b>帶在身上</b>${RUN.gifts.map(([n,k])=>n==='布袋'?`布袋裡多了${ITEM_NAME(k)}`:`${n}送你${ITEM_NAME(k)}`).join('；')}。</p>`);
  if(RUN.calls.length)lines.push(`<p class="calls"><b>沒有回來的人</b>${RUN.calls.join('、')}。今晚，${RUN.calls.length>1?'他們':RUN.calls[0]}會在你背後叫你的名字，怪談也會快一些。</p>`);
  if(RUN.night===NIGHTS.length-1)lines.push(`<p class="note">今晚是老村長的頭七。老人家說，頭七這天，回家的不只他一個。</p>`);
  if(RUN.bless.length)lines.push(`<p><b>身上的保佑</b>${RUN.bless.map(b=>`<span class="chip">${BLESSINGS[b].name}</span>`).join('')}</p>`);
  $('#ncnum').textContent=RUN.night+1;$('#ncname').textContent=cfg.name;
  $('#ncalm').innerHTML=`<b>今夜　${m.name}</b><span class="yi">宜</span><span>${m.yi}</span><span class="ji">忌</span><span>${m.ji}</span><span class="d">${m.desc}　村裡還有${cnNum(cfg.surv)}個人。</span>`;
  $('#nclives').innerHTML=livesHTML(RUN.lives);$('#ncbody').innerHTML=lines.join('');
  if(!G||!G.menuMode){toTitleScene()}$('#nightcard').hidden=false;setTimeout(()=>$('#ncgo').focus({preventScroll:true}),40)}
function showBless(){const last=RUN.nights[RUN.nights.length-1];['#end','#death','#title'].forEach(s=>$(s).hidden=true);
  $('#blsum').textContent=`${NIGHTS[last.n].name}過去了。救出 ${last.saved}／${last.total} 人${last.lost.length?`，${last.lost.join('、')}沒有回來`:''}。`;
  $('#blcards').innerHTML=RUN.offer.map((b,i)=>{const d=BLESSINGS[b];return`<button class="bcard" data-b="${b}"><u>第${'一二三'[i]}籤${IS_TOUCH?'':`<kbd>${i+1}</kbd>`}</u><b>${d.name}</b><small>${d.from}</small><span>${d.desc}</span></button>`}).join('');
  $('#blcards').querySelectorAll('.bcard').forEach(el=>el.onclick=()=>pickBless(el.dataset.b));
  $('#bless').hidden=false;setTimeout(()=>$('#blcards .bcard').focus({preventScroll:true}),40)}
function pickBless(b){if(!RUN.offer||!RUN.offer.includes(b))return;RUN.bless.push(b);
  if(b==='bag')for(let i=0;i<2;i++){const k=GIFT_BAG[Math.floor(mulberry32(runSeed(RUN.night*7+9+i))()*GIFT_BAG.length)];RUN.inv[k]=(RUN.inv[k]||0)+1;RUN.gifts.push(['布袋',k])}RUN.offer=null;saveRun();SND.bell();$('#bless').hidden=true;showNightCard()}
function showRunEnd(){['#end','#death','#bless','#nightcard'].forEach(s=>$(s).hidden=true);
  const total=RUN.nights.reduce((a,n)=>a+n.total,0),won=!!RUN.won;
  const head=won?(RUN.lost.length===0?'七夜過去，山腳村一個人都沒少':RUN.saved>=total*.75?'七夜過去，山腳村的燈亮了':RUN.saved>=total*.4?'七夜過去，村子空了一半':'七夜過去，村裡沒剩幾個人'):`${NIGHTS[RUN.fail.n].name}，替身燒完了`;
  $('#rehead').textContent=head;$('#rehead').className=won&&RUN.saved>=total*.75?'':'bad';
  $('#resub').textContent=won?`七夜共救出 ${RUN.saved}／${total} 人。`:`撐過 ${RUN.nights.length} 夜，救出 ${RUN.saved} 人。${RUN.fail.by?`最後抓住你的是${(MONSTERS[RUN.fail.by]||APPARITIONS[RUN.fail.by]).name}。`:''}`;
  $('#rerows').innerHTML=NIGHTS.map((c,i)=>{const n=RUN.nights[i];const m=n&&MODS.find(x=>x.id===n.mod);return`<div class="${n?'':i===(RUN.fail&&RUN.fail.n)?'fail':'unk'}"><b>${c.name}</b><span>${n?m.name:i===(RUN.fail&&RUN.fail.n)?'沒撐過':'—'}</span><span>${n?`救 ${n.saved}／${n.total}`:''}</span></div>`}).join('');
  $('#relost').innerHTML=RUN.lost.length?`<b>沒有回來的人</b>${RUN.lost.join('、')}`:'';
  finishRun();const best=RUN.prevBest;$('#rebest').textContent=RUN.isBest?'新紀錄':`最好的一次：撐過 ${best.nights} 夜、救出 ${best.saved} 人`;store.set('kaidan-run',null);
  $('#hud').hidden=true;$('#touch').hidden=true;$('#runend').hidden=false;SND[won?'bell':'sting']();setTimeout(()=>$('#reagain').focus({preventScroll:true}),40)}
function toTitleScene(){newGame(0);G.menuMode=true;G.menuCam={x:41.5*TS,y:21*TS};updCam(true);['#hud','#touch','#pause'].forEach(s=>$(s).hidden=true)}

/* ---------------- playtest log: kept on this device only; the title screen copies it ---------------- */
function logPlay(e){const L=store.get('kaidan-plays',[]);L.push({d:new Date().toISOString().slice(0,16),...e});store.set('kaidan-plays',L.slice(-300))}
function playsText(){const L=store.get('kaidan-plays',[]),nights=L.filter(e=>e.kind==='night'),deaths=nights.filter(e=>e.end==='dead'||e.end==='gone');
  const by={};for(const e of deaths)by[e.by||'?']=(by[e.by||'?']||0)+1;
  const head=`怪談救援 試玩紀錄（${L.length} 筆）\n夜數 ${nights.length}，死亡 ${deaths.length}，平均存活 ${nights.length?Math.round(nights.reduce((a,e)=>a+e.t,0)/nights.length):0} 秒\n死因 ${Object.entries(by).map(([k,v])=>`${(MONSTERS[k]||APPARITIONS[k]||{name:k}).name}×${v}`).join('、')||'—'}\n`;
  return head+L.map(e=>JSON.stringify(e)).join('\n')}
