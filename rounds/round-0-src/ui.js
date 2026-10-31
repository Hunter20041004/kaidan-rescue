/* =====================================================================
   UI: HUD, overlays, tutorial, synthesized audio, input, main loop.
   ===================================================================== */
const $=s=>document.querySelector(s);
function modPool(){const n=+store.get('kaidan-nights',0);const ids=MOD_UNLOCK.slice(0,Math.min(MOD_UNLOCK.length,3+n));return MODS.filter(m=>ids.includes(m.id))}
const store={get(k,d){try{const v=localStorage.getItem(k);return v==null?d:JSON.parse(v)}catch(e){return d}},set(k,v){try{localStorage.setItem(k,JSON.stringify(v))}catch(e){}}};
const IS_TOUCH=('ontouchstart' in window)||navigator.maxTouchPoints>0;
const K=(key,touch)=>IS_TOUCH?`「${touch}」`:`<kbd>${key}</kbd>`;
const CN='〇一二三四五六七八九十';
const cnNum=n=>n<=10?CN[n]:n<20?'十'+(n%10?CN[n%10]:''):CN[Math.floor(n/10)]+'十'+(n%10?CN[n%10]:'');
// game seconds → village clock (night runs 23:00 → 05:00)
function nightHour(t){const n=G.tut?360:G.night;return 23+clamp(t/n,0,1)*6}
function shichen(t){const h=nightHour(t);return h<25?'子時':h<27?'丑時':'寅時'}
function clockCN(t){const h=nightHour(t),hh=Math.floor(h)%24,mm=Math.floor((h%1)*60);const pre=hh>=23?'深夜':'凌晨';return `${pre}${cnNum(hh===0?12:hh>12?hh-12:hh)}點${mm?cnNum(mm)+'分':''}`}

/* ---------------- UI ---------------- */
const UI={touch:IS_TOUCH,joy:null,cache:'',tipT:0,subs:[],
  seenBook:new Set(store.get('kaidan-codex',[])),
  sub(text,kind){const box=$('#sub');const d=document.createElement('div');d.textContent=text;d.className=kind||'';box.appendChild(d);this.subs.push({el:d,t:kind==='death'||kind==='regret'?5.5:4.2});
    while(box.children.length>3){box.firstChild.remove();this.subs.shift()}},
  tickSubs(dt){for(const s of this.subs){s.t-=dt;if(s.t<.6)s.el.style.opacity=Math.max(0,s.t/.6)}const dead=this.subs.filter(s=>s.t<=0);dead.forEach(s=>s.el.remove());this.subs=this.subs.filter(s=>s.t>0)},
  itemTip(show){const k=ITEM_ORDER[G.sel];$('#itname').textContent=ITEMS[k].name+(G.inv[k]?`　×${G.inv[k]}`:'');$('#itdesc').textContent=ITEMS[k].desc;this.tipT=show?3.4:0},
  meet(type){
    if(KT.manual||G.menuMode)return;
    if(this.seenBook.has(type)){UI.sub(`${MONSTERS[type].name}出來了。`,'omen');return}
    this.seenBook.add(type);store.set('kaidan-codex',[...this.seenBook]);
    const d=MONSTERS[type];$('#meeteyebrow').textContent='怪談錄・新的一頁';$('#meetname').textContent=d.name;$('#meetorigin').textContent=d.origin;$('#meetblurb').textContent=d.blurb;
    $('#meetrules').innerHTML=d.rules.map(r=>`<li>${r}</li>`).join('');drawPortrait(type,$('#meetcv').getContext('2d'),380);
    G.paused=true;releaseKeys();$('#meet').hidden=false;SND.sting();setTimeout(()=>$('#meetok').focus({preventScroll:true}),30)},
  closeMeet(){$('#meet').hidden=true;if(G&&!G.over)G.paused=false;cv.focus&&cv.focus({preventScroll:true})},
  rule(type){
    if(KT.manual||G.menuMode)return;const d=APPARITIONS[type];
    if(this.seenBook.has(type)){UI.sub(d.rule,'omen');return}
    this.seenBook.add(type);store.set('kaidan-codex',[...this.seenBook]);
    $('#meeteyebrow').textContent='規矩・新的一頁';$('#meetname').textContent=d.name;$('#meetorigin').textContent=d.origin;$('#meetblurb').textContent=d.blurb;
    $('#meetrules').innerHTML=`<li><b>${d.rule}</b></li>`+d.rules.map(r=>`<li>${r}</li>`).join('');drawPortrait(type,$('#meetcv').getContext('2d'),380);
    G.paused=true;releaseKeys();$('#meet').hidden=false;SND.sting();setTimeout(()=>$('#meetok').focus({preventScroll:true}),30)},
  recordNight(){if(G.recorded||G.tut)return null;G.recorded=true;const before=modPool().map(m=>m.id);const n=+store.get('kaidan-nights',0)+1;store.set('kaidan-nights',n);const after=modPool();return after.find(m=>!before.includes(m.id))||null},
  showDeath(){
    const R=G.result;if(!R)return;const type=(G.scare&&G.scare.type)||'kuchi',name=MONSTERS[type]?MONSTERS[type].name:APPARITIONS[type].name;
    const how=R.kind==='gone'?(type==='funeral'?`你跟著${name}走了`:`你被${name}帶走了`):`你被${name}抓住了`;
    const tips=MONSTERS[type]?MONSTERS[type].rules:[APPARITIONS[type].rule];
    $('#deathwho').textContent=`${G.tut?'教學':shichen(G.t)}・救出 ${G.saved} 人・第 #${G.seed} 夜`;$('#deathline').textContent=how;$('#deathtip').textContent='下次記得：'+pick(tips);
    drawPortrait(type,$('#deathcv').getContext('2d'),320);this.unlocked=this.recordNight();
    $('#hud').hidden=true;$('#touch').hidden=true;$('#death').hidden=false;setTimeout(()=>$('#dretry').focus({preventScroll:true}),40)},
  tutFail(m){TUT.fail=m.def.name},
  showEnd(){
    const R=G.result,P=G.player,sv=G.humans.filter(h=>!h.isPlayer);if(!R)return;$('#death').hidden=true;if(this.unlocked===undefined||!G.recordedShown){this.unlocked=G.recorded?this.unlocked:this.recordNight();G.recordedShown=true}
    const now=new Date();$('#newsdate').textContent=`中華民國${now.getFullYear()-1911}年${now.getMonth()+1}月${now.getDate()}日　星期${'日一二三四五六'[now.getDay()]}　第 ${G.seed%9000+1000} 號`;
    const saved=G.saved,dawn=G.dawnSaved,lost=R.dead+R.gone;let head,bad=false;
    if(R.kind==='dead'){head=`夜入山腳村救人　外地司機遇害`;bad=true}
    else if(R.kind==='gone'){head=`司機深夜走入草叢　僅尋獲鞋一雙`;bad=true}
    else if(R.kind==='dawn'){head=saved+dawn===R.total?`撐到雞啼　全村${cnNum(R.total)}人無一傷亡`:`苦撐至天亮　${cnNum(saved+dawn)}人生還`}
    else if(saved===R.total){head=`一夜救出${cnNum(saved)}人　山腳村全員脫險`}
    else if(saved===0){head=`司機獨自駕車離村　${cnNum(R.left+lost)}人下落未明`;bad=true}
    else{head=`貨車載回${cnNum(saved)}人　仍有${cnNum(R.left+lost)}人未歸`;bad=lost>saved}
    $('#headline').innerHTML=head.split('　').join('<br>');$('#headline').className='headline'+(bad?' bad':'');
    const met=Object.keys(G.seen).map(k=>(MONSTERS[k]||APPARITIONS[k]).name);
    const tellable=G.log.filter(l=>['clutch','regret','absurd','death','save'].includes(l.tag)&&!/^你被|^你跟著/.test(l.text));
    // keep the night's arc: up to seven beats, preferring variety over repetition
    const pickd=[];const byTag={};for(const l of tellable){byTag[l.tag]=(byTag[l.tag]||0)+1;if(pickd.length<7&&byTag[l.tag]<=3)pickd.push(l)}
    const third=s=>s.replace(/你們/g,'他們').replace(/你/g,'司機');
    const paras=[`本報訊　山腳村昨夜全村停電。一名外地貨車司機於${clockCN(0)}停車村口，隻身入村尋找受困村民。當晚${G.mod.name}，${G.mod.desc.replace(/。$/,'')}。`];
    if(pickd.length){let cur='';for(const l of pickd){const line=`${clockCN(l.t)}，${third(l.text).replace(/[。！]$/,'')}。`;if(cur.length+line.length>90){paras.push(cur);cur=''}cur+=line}if(cur)paras.push(cur)}
    else paras.push('據了解，當晚村內一片死寂，司機一路未遇上任何村民。');
    const fate=sv.filter(h=>h.dead||h.gone).map(h=>h.dead?`${h.name}遭${h.killer||'不明之物'}所害`:`${h.name}失蹤`);const stuck=R.kind==='dawn'?0:sv.filter(h=>alive(h)&&!h.saved).length;
    paras.push((met.length?`村民指稱，當晚出沒的有${met.join('、')}。`:'')+(fate.length?`目前確認${fate.join('、')}。`:'')+(stuck?`其餘${cnNum(stuck)}人仍受困村內，下落待查。`:'')+(!fate.length&&!stuck?'本次救援無人傷亡。':'')+(R.kind==='dead'||R.kind==='gone'?'司機本人至今下落不明，警方呼籲民眾入夜勿近山腳村。':'司機天亮前已駕車離開，婉拒受訪。'));
    const st=G.stats||{};if(st.nearMiss||st.closest<2.5)paras.push(`據了解，司機當晚${st.nearMiss?`有 ${cnNum(Math.min(st.nearMiss,99))} 次與怪談擦身而過`:''}${st.nearMiss&&st.closest<2.5?'，':''}${st.closest<2.5?`最近一次只差${st.closest<1.2?'一步':'兩三步'}`:''}。`);
    if(this.unlocked)paras.push(`另據農民曆記載，下一夜可能出現「${this.unlocked.name}」：${this.unlocked.desc}`);
    $('#article').innerHTML=paras.map(p=>`<p>${p}</p>`).join('')+`<p style="text-align:right;color:#5b4a32">本報記者　林振昌／山腳報導</p>`;
    $('#facts').innerHTML=[['上車',saved],['撐到天亮',dawn],['罹難',R.dead],['失蹤',R.gone],[R.isBest?'新紀錄':'分數',R.score]].map(([a,b])=>`<div><span>${a}</span><b>${b}</b></div>`).join('');
    const quote=(pickd.find(l=>l.tag==='absurd')||pickd.find(l=>l.tag==='regret')||pickd.find(l=>l.tag==='clutch')||{text:G.mod.desc}).text;
    G.shareText=`《山腳日報》${head}\n「${third(quote)}」\n——怪談救援　第 #${G.seed} 夜（${G.mod.name}）`;
    $('#sharemsg').textContent='';$('#hud').hidden=true;$('#touch').hidden=true;$('#end').hidden=false;setTimeout(()=>$('#again').focus({preventScroll:true}),40)},
};
function releaseKeys(){for(const k in keys)keys[k]=false;G&&(G.touchRun=G.touchBreath=false);touchVec=null;UI.joy=null}

/* ---------------- HUD ---------------- */
function goalText(){const P=G.player;if(P.lured)return'連按方向鍵掙脫！';if(P.drown)return'連按方向鍵踢開那隻手！';if(P.spot)return`躲著。${K('E','互動')}出來`;
  const sv=G.humans.filter(h=>!h.isPlayer),f=sv.filter(h=>h.state==='follow'&&alive(h)).length;
  if(f)return`把 <em>${f}</em> 人帶回村口的貨車`;if(sv.every(h=>!alive(h)))return'回到貨車，離開這裡';
  const st=sv.filter(h=>alive(h)&&h.met&&h.state!=='follow').length;if(st)return`有 <em>${st}</em> 人在等你回去接（${K('G','喊人')}）`;return'循著「救命」聲找人'}
function hud(dt){
  const P=G.player,n=G.tut?1:G.night,k=G.tut?0:clamp(G.t/n,0,1);
  const sh=G.tut?'教學':shichen(G.t),dawn=G.tut?'不會天亮':`雞啼前 ${clockStr(n-G.t)}`;
  const tags=G.humans.filter(h=>!h.isPlayer).map((h,i)=>{const st=h.saved?'saved':h.dead?'dead':h.gone?'gone':h.state==='follow'?'follow':'';const known=h.met||h.saved||!alive(h);
    return`<div class="tag ${known?'paper':'unk'} ${st}" style="--tilt:${((hash(i,3,1)-.5)*7).toFixed(1)}deg">${known?h.name:'？'}${st?`<i>${{saved:'救',dead:'亡',gone:'失',follow:'跟'}[st]}</i>`:''}</div>`}).join('');
  const tray=ITEM_ORDER.map((t,i)=>`<button class="slot ${G.inv[t]?'has':''} ${G.sel===i?'sel':''}" data-i="${i}" aria-label="${ITEMS[t].name} ${G.inv[t]} 個"><img alt="" src="${ICON_URL[t]||''}"><b>${G.inv[t]}</b>${IS_TOUCH?'':`<u>${i+1}</u>`}</button>`).join('');
  const goal=G.tut||G.over?'':goalText();
  const key=sh+tags+tray+goal;
  if(key!==UI.cache){UI.cache=key;$('#shichen').textContent=sh;$('#tags').innerHTML=tags;$('#tray').innerHTML=tray;$('#goal').innerHTML=goal}
  $('#dawn').textContent=dawn;const sh2=80*(1-k)+4;$('#stick').style.height=sh2+'px';$('#ember').style.bottom=(sh2-3)+'px';
  if(UI.tipT>0){UI.tipT-=dt}$('#itemtip').style.opacity=UI.tipT>0?Math.min(1,UI.tipT/.4):0;
  UI.tickSubs(dt);
}

/* ---------------- codex / pause / title ---------------- */
const CODEX=[...MONSTER_ORDER,...APPARITION_ORDER],lore=t=>MONSTERS[t]||APPARITIONS[t];
function entryHTML(type,known,id){const d=lore(type),isRule=!!APPARITIONS[type];
  return known?`<div class="entry"><canvas width="168" height="168" data-p="${type}" id="${id}"></canvas><div><h4>${d.name}</h4><small>${d.origin}${isRule?'・規矩':''}</small><ul>${isRule?`<li><b>${d.rule}</b></li>`:''}${d.rules.map(r=>`<li>${r}</li>`).join('')}</ul></div></div>`
  :`<div class="entry unk"><canvas width="168" height="168" data-s="${type}" id="${id}"></canvas><div><h4>？？？</h4><small>尚未遇見</small><ul><li>傳聞：「${d.omen==='……'?'有人在背後叫你。':d.omen}」</li></ul></div></div>`}
function paintEntries(root){root.querySelectorAll('canvas').forEach(c=>{const g=c.getContext('2d');if(c.dataset.p)drawPortrait(c.dataset.p,g,168);else drawPortrait(c.dataset.s,g,168,true)})}
function openCodex(){const box=$('#entries');box.innerHTML=CODEX.map((t,i)=>entryHTML(t,UI.seenBook.has(t),'cx'+i)).join('');paintEntries(box);
  $('#codexcount').textContent=`已記下 ${[...UI.seenBook].filter(t=>CODEX.includes(t)).length}／${CODEX.length}`;$('#codex').hidden=false;setTimeout(()=>$('#codexclose').focus({preventScroll:true}),30)}
const KEYS_DESK=[['WASD','移動'],['Shift','奔跑（腳步聲很大）'],['C','蹲下：安靜；草叢裡蹲著看不見'],['Space','按住屏息：殭屍聽不到你'],['E','互動：躲、叫人、關門、敲鐘、回答'],['左鍵／F','使用道具（往滑鼠方向）'],['Q／1–5／滾輪','切換道具'],['G','叫同伴原地等／跟上'],['M','聲音開關'],['R','直接換一夜']];
const KEYS_TOUCH=[['左半邊拖曳','移動'],['跑','按住奔跑'],['蹲','蹲下／站起'],['屏息','按住屏息'],['互動','躲、叫人、關門、敲鐘、回答'],['道具','往面對方向使用；點下方格子切換'],['喊人','叫同伴原地等／跟上']];
function setPause(on){if(!G||G.over||G.menuMode||!$('#meet').hidden)return;G.paused=on;$('#pause').hidden=!on;releaseKeys();
  if(on){$('#pauseinfo').textContent=`${G.tut?'教學':shichen(G.t)}・${G.mod.name}・第 #${G.seed} 夜`;
    const seen=Object.keys(G.seen);const box=$('#pentries');box.innerHTML=seen.length?seen.map((t,i)=>entryHTML(t,true,'pe'+i)).join(''):'<p style="grid-column:1/-1;margin:0;font-size:14px;color:#5b4a32">今夜還沒有怪談出現。最好別等到它們來。</p>';paintEntries(box);
    $('#pkeys').innerHTML=(IS_TOUCH?KEYS_TOUCH:KEYS_DESK).map(([a,b])=>`<div><kbd>${a}</kbd><span>${b}</span></div>`).join('');setTimeout(()=>$('#resume').focus({preventScroll:true}),30)}}
function toTitle(){releaseKeys();newGame(0);G.menuMode=true;G.menuCam={x:41.5*TS,y:21*TS};updCam(true);
  ['#hud','#touch','#pause','#end','#codex','#meet','#death'].forEach(s=>$(s).hidden=true);$('#title').hidden=false;
  const tutDone=store.get('kaidan-tut',0);$('#m-start-sub').textContent=tutDone?`今夜：${G.mod.name}`:'第一次玩，建議先走一遍教學';
  $('#m-codex-sub').textContent=`已記下 ${[...UI.seenBook].filter(t=>CODEX.includes(t)).length}／${CODEX.length} 種怪談與規矩`;
  const now=new Date();$('#almanac').innerHTML=`<div class="h"><span>農民曆・山腳村</span><span>${now.getMonth()+1}月${now.getDate()}日</span></div><b>今夜　${G.mod.name}</b><span class="yi">宜</span><span>${G.mod.yi}</span><span class="ji">忌</span><span>${G.mod.ji}</span><span style="grid-column:1/-1;font-size:13px;color:#5b4a32;margin-top:4px">${G.mod.desc}</span>`;
  const best=+store.get('kaidan-best',0)||bestScore;$('#best').textContent=best?`最高分 ${best}`:''}
function startGame(seed,scene){SND.init();releaseKeys();newGame(seed,scene);G.menuMode=false;updCam(true);UI.cache='';UI.subs=[];$('#sub').innerHTML='';
  ['#title','#pause','#end','#codex','#meet','#death'].forEach(s=>$(s).hidden=true);$('#hud').hidden=false;UI.unlocked=undefined;$('#touch').hidden=!IS_TOUCH;$('#tut').hidden=!G.tut;$('#goal').hidden=G.tut;
  if(G.tut)TUT.start();else UI.sub('天亮前，把村裡的人帶回村口的貨車。','omen');UI.itemTip(true);SND.drone(.4);cv.focus&&cv.focus({preventScroll:true})}

/* ---------------- tutorial ---------------- */
const TUT={i:0,fail:null,t:0,m:null,done:false,
  steps:[
    {h:'走到路上',p:()=>`${IS_TOUCH?'按住畫面左半邊拖曳':'用 <kbd>W</kbd><kbd>A</kbd><kbd>S</kbd><kbd>D</kbd> '}移動，走到上面的石子路。${IS_TOUCH?'':'滑鼠決定手電筒照的方向。'}`,
      at:()=>({x:tc(4),y:tc(12)+12}),done:()=>G.player.y<14*TS},
    {h:'撿起鞭炮',enter(){G.items.push({type:'firecracker',x:tc(11),y:tc(12)+12,bob:0})},p:()=>'路邊有一串鞭炮，走過去就會撿起來。撿到的道具會放進畫面下方的布袋。',
      at:()=>({x:tc(11),y:tc(12)+12}),done:()=>G.inv.firecracker>0},
    {h:'蹲進草叢',p:()=>`有高跟鞋的聲音從東邊過來。走進右邊的草叢，按${K('C','蹲')}蹲下。`,
      at:()=>({x:tc(23),y:tc(17)}),reset:[23.5,17.5],done:()=>onGrass(G.player)&&G.player.crouch},
    {h:'別出聲，等她走過去',enter(){TUT.spawn('kuchi',[34,12],[[20,12.5],[1,12.5]])},p:()=>'裂口女看得最遠、跑得比你快。蹲在草叢裡她就看不見你。站起來，她就會問你漂不漂亮。',
      reset:[23.5,17.5],back:2,done:()=>TUT.m&&TUT.m.done},
    {h:'屏住呼吸',p:()=>`殭屍看不見，只聽呼吸。走到路中間的記號，等牠跳近時，${IS_TOUCH?'按住「屏息」':'按住 <kbd>Space</kbd>'}憋氣，讓牠跳過去。`,
      at:()=>({x:tc(18),y:tc(12)+12}),reset:[18.5,13],done:()=>Math.hypot(G.player.x-tc(18),G.player.y-tc(12)-12)<22},
    {h:'',enter(){TUT.spawn('jiang',[2,12],[[33,12.5]])},p:()=>{const m=TUT.m,P=G.player;if(!m)return'';const d=dist(m,P)/TS;
        return P.holding?`撐住……（剩 ${P.breath.toFixed(1)} 秒的氣）`:d<5&&m.x<P.x?`<b style="color:var(--cinnabar)">就是現在——${IS_TOUCH?'按住「屏息」':'按住 Space'}！</b>`:'牠一跳一跳地過來了。站著別動，等牠靠近再憋氣；氣只有五秒。'},
      title:'讓殭屍跳過去',reset:[18.5,13],back:4,done:()=>TUT.m&&TUT.m.done},
    {h:'用鞭炮嚇跑魔神仔',enter(){if(!G.inv.firecracker)G.inv.firecracker=1;G.sel=0;const P=G.player;TUT.spawn('mosin',[10,16],[[P.x/TS,P.y/TS]])},
      p:()=>`草叢裡有東西在笑。魔神仔怕鞭炮：${IS_TOUCH?'按「道具」往面對的方向丟':'把滑鼠指向牠，按左鍵或 <kbd>F</kbd> 丟出去'}。被牠牽走的人，常常再也找不回來。`,
      reset:[18.5,13],back:6,done:()=>TUT.m&&TUT.m.state==='flee'},
    {h:'去找阿明',p:()=>`屋裡有人喊救命。進屋，走到衣櫃前按${K('E','互動')}，叫他出來跟你走。`,
      at:()=>({x:tc(13),y:tc(5)}),done:()=>G.humans[1].state==='follow'},
    {h:'帶阿明上貨車',p:()=>`阿明會跟著你。帶他走到右下角的貨車旁，他就會上車。想讓同伴原地等，按${K('G','喊人')}。`,
      at:()=>({x:tc(31),y:tc(19)}),done:()=>G.humans[1].saved},
    {h:'你學會怎麼活下來了',enter(){store.set('kaidan-tut',1);SND.bell();setTimeout(()=>{if(G.tut&&TUT.i===TUT.steps.length-1)startGame(0)},4200)},p:()=>'真正的夜裡，五種怪談會輪流出來，道具要省著用。天亮前，把所有人帶上車。第一夜馬上開始……',done:()=>false},
  ],
  start(){this.i=0;this.fail=null;this.m=null;const s=G.humans[1],c=G.spots.find(p=>p.type==='cabinet');if(s&&c){enterSpot(s,c);s.state='hide'}this.enter()},
  enter(){const st=this.steps[this.i];this.t=0;if(st.enter)st.enter();this.panel()},
  panel(){const st=this.steps[this.i];$('#tutn').textContent=`教學　${Math.min(this.i+1,this.steps.length)}／${this.steps.length}`;$('#tuth').textContent=st.title||st.h;$('#tutp').innerHTML=st.p()},
  spawn(type,at,pts){const m=spawnMonster(type,{x:tc(at[0]),y:tc(at[1])});m.tame=true;m.script={pts:pts.map(([x,y])=>({x:x*TS,y:y*TS})),i:0};this.m=m;return m},
  update(dt){
    const P=G.player;this.t+=dt;
    if(this.fail){const who=this.fail;this.fail=null;G.monsters=[];this.m=null;P.lured=null;P.drown=null;P.action=null;P.holding=false;G.proj=[];G.fuses=[];
      for(const h of G.humans)if(!h.isPlayer&&h.lured)h.lured=null;
      const st=this.steps[this.i],back=st.back!=null?st.back:this.i;this.i=back;const r=this.steps[back].reset||st.reset;if(r){P.x=r[0]*TS;P.y=r[1]*TS}P.crouch=back===2;
      UI.sub(`被${who}抓到了。沒關係，再來一次。`,'death');G.shake=.3;this.enter();return}
    const st=this.steps[this.i];if(this.i===5)this.panel();
    if(this.i>=7&&this.m&&this.m.state!=='flee'){this.m.done=true;this.m=null}
    if(this.i===0&&this.t>1&&Math.floor(this.t/9)!==Math.floor((this.t-dt)/9))bubble(G.humans[1],'阿明：有人嗎……救命……','voice',3);
    if(st.done()&&this.i<this.steps.length-1){this.i++;SND.pickup();this.enter()}
  },
  drawWorld(c){const st=this.steps[this.i];if(!st||!st.at)return;const p=st.at(),k=(G.t*1.2)%1;c.save();
    c.strokeStyle=`rgba(201,153,60,${.9*(1-k)})`;c.lineWidth=1.5;c.beginPath();c.ellipse(p.x,p.y,8+k*16,(8+k*16)*.6,0,0,7);c.stroke();
    c.fillStyle='rgba(201,153,60,.9)';c.beginPath();c.ellipse(p.x,p.y,3.5,2.2,0,0,7);c.fill();
    const P=G.player,d=Math.hypot(p.x-P.x,p.y-P.y);if(d>60){const a=Math.atan2(p.y-P.y,p.x-P.x);c.translate(P.x+Math.cos(a)*26,P.y+Math.sin(a)*26);c.rotate(a);c.fillStyle='rgba(201,153,60,.75)';c.beginPath();c.moveTo(6,0);c.lineTo(-3,-4);c.lineTo(-3,4);c.closePath();c.fill()}
    c.restore()},
};

/* ---------------- sound (WebAudio, all synthesized) ----------------
   Layers: night bed (wind, crickets) · music (drone, erhu-like phrases in D minor pentatonic, 木魚, tension strings, drum)
   · positional cues (monsters, props) panned by where they are relative to you · stingers. A low-pass muffles everything while you hide. */
const SND={ac:null,on:store.get('kaidan-sound',1)!==0,_d:null,erT:6,wbT:3,drT:0,
  init(){if(this.ac){if(this.ac.state==='suspended')this.ac.resume();return}try{const A=window.AudioContext||window.webkitAudioContext;const ac=this.ac=new A();
    this.out=ac.createGain();this.out.gain.value=this.on?.62:0;this.lp=ac.createBiquadFilter();this.lp.type='lowpass';this.lp.frequency.value=16000;const comp=ac.createDynamicsCompressor();this.out.connect(this.lp).connect(comp).connect(ac.destination);
    const len=ac.sampleRate*2,b=ac.createBuffer(1,len,ac.sampleRate),d=b.getChannelData(0);for(let i=0;i<len;i++)d[i]=Math.random()*2-1;this.nb=b;
    const n=ac.createBufferSource();n.buffer=b;n.loop=true;const f=ac.createBiquadFilter();f.type='bandpass';f.frequency.value=420;f.Q.value=.6;const wg=ac.createGain();wg.gain.value=.05;n.connect(f).connect(wg).connect(this.out);n.start();
    const lfo=ac.createOscillator();lfo.frequency.value=.07;const lg=ac.createGain();lg.gain.value=220;lfo.connect(lg).connect(f.frequency);lfo.start();this.wind=wg;
    this.mus=ac.createGain();this.mus.gain.value=1;this.mus.connect(this.out);
    const dl=ac.createBiquadFilter();dl.type='lowpass';dl.frequency.value=260;this.droneG=ac.createGain();this.droneG.gain.value=0;dl.connect(this.droneG).connect(this.mus);
    for(const[fq,ty]of[[73.42,'sawtooth'],[110,'triangle'],[73.9,'sawtooth']]){const o=ac.createOscillator();o.type=ty;o.frequency.value=fq;o.connect(dl);o.start()}
    const bp=ac.createBiquadFilter();bp.type='bandpass';bp.frequency.value=620;bp.Q.value=2;const trem=ac.createGain();trem.gain.value=.5;this.tensG=ac.createGain();this.tensG.gain.value=0;bp.connect(trem).connect(this.tensG).connect(this.mus);
    const tl=ac.createOscillator();tl.frequency.value=7;const tlg=ac.createGain();tlg.gain.value=.5;tl.connect(tlg).connect(trem.gain);tl.start();
    for(const fq of[196,207.65,293.66]){const o=ac.createOscillator();o.type='sawtooth';o.frequency.value=fq;o.connect(bp);o.start()}
  }catch(e){this.ac=null}},
  ok(){return this.ac&&this.on&&this.ac.state==='running'},
  dest(){return this._d||this.out},
  env(node,g0,dur,delay){const g=this.ac.createGain(),t=this.ac.currentTime+(delay||0);g.gain.setValueAtTime(.0001,t);g.gain.exponentialRampToValueAtTime(Math.max(.0002,g0),t+.008);g.gain.exponentialRampToValueAtTime(.0001,t+dur);node.connect(g).connect(this.dest());return t},
  noise(dur,freq,q,g0,type,delay){if(!this.ok())return;const s=this.ac.createBufferSource();s.buffer=this.nb;const f=this.ac.createBiquadFilter();f.type=type||'bandpass';f.frequency.value=freq;f.Q.value=q||1;s.connect(f);const t=this.env(f,g0,dur,delay);s.start(t,Math.random());s.stop(t+dur+.05)},
  tone(f0,f1,dur,g0,type,delay){if(!this.ok())return;const o=this.ac.createOscillator();o.type=type||'sine';const t=this.env(o,g0,dur,delay);o.frequency.setValueAtTime(f0,t);o.frequency.exponentialRampToValueAtTime(Math.max(20,f1),t+dur);o.start(t);o.stop(t+dur+.05)},
  // play something as if it came from (x,y): quieter with distance, panned left/right
  at(x,y,fn){if(!this.ok()||!G)return;const P=G.player,dx=x-P.x,d=Math.hypot(dx,y-P.y),g=this.ac.createGain();g.gain.value=Math.pow(clamp(1-d/(17*TS),0,1),1.3);if(g.gain.value<.01)return;
    if(this.ac.createStereoPanner){const p=this.ac.createStereoPanner();p.pan.value=clamp(dx/(7*TS),-1,1);g.connect(p).connect(this.out)}else g.connect(this.out);const prev=this._d;this._d=g;try{fn()}finally{this._d=prev}},
  cue(kind,x,y,chase){this.at(x,y,()=>{switch(kind){
    case 'mosin':(chase?[0,.08,.16,.24]:[0,.14,.3]).forEach((t,i)=>this.tone(1050+i*40,1250+i*30,.06,.07,'square',t));break;
    case 'tiger':if(chase)this.tone(82,58,.55,.22,'sawtooth');else{this.noise(.12,900,1,.18,'lowpass');this.noise(.1,900,1,.15,'lowpass',.2)}break;
    case 'kuchi':(chase?[0,.14,.28,.42]:[0,.42]).forEach(t=>this.noise(.03,3200,4,.22,'bandpass',t));break;
    case 'jiang':this.tone(72,40,.16,.32);break;
    case 'suigui':if(chase)this.noise(.4,1100,.7,.3,'lowpass');else for(let i=0;i<4;i++)this.tone(300+i*70,620,.06,.08,'sine',i*.09);break;
    case 'doorbang':this.noise(.22,380,1,.8,'lowpass');this.tone(92,48,.2,.5);break;
    case 'chime':for(let i=0;i<5;i++)this.tone(2200+Math.random()*1100,2150,.5,.05,'sine',i*.07);break;
    case 'coop':for(let i=0;i<3;i++)this.tone(700,1250,.12,.07,'sawtooth',i*.17);break;
    case 'bigbell':this.tone(110,109,2.8,.32);this.tone(264,262,2.2,.12);this.tone(418,415,1.6,.07);this.tone(640,636,1.1,.035);break;
    case 'glass':this.noise(.25,4200,.8,.3,'highpass');for(let i=0;i<5;i++)this.tone(3000+Math.random()*2000,2900,.08,.03,'sine',.03+i*.05);break;
    case 'scream':this.scream(false);break;
    case 'cry':for(let i=0;i<3;i++){this.tone(440,610,.25,.06,'sawtooth',i*.55);this.tone(610,420,.3,.06,'sawtooth',i*.55+.25)}break;
    case 'meow':this.tone(620,1000,.18,.08,'sawtooth');this.tone(1000,520,.25,.07,'sawtooth',.18);break;
    case 'steps':this.noise(.08,520,1.4,.14);break;
    case 'whisper':this.noise(1,2400,6,.14);break;
    case 'buzz':this.tone(100,100,.3,.05,'square');break;
    case 'bark':this.tone(380,300,.12,.15,'sawtooth');this.noise(.1,900,2,.12);this.tone(380,300,.12,.13,'sawtooth',.2);this.noise(.1,900,2,.1,'bandpass',.2);break;
    case 'echo':this.tone(500,140,.18,.2);[.35,.7,1.05].forEach((t,i)=>this.tone(480,140,.18,.12/(i+1),'sine',t));break;
    case 'fire':this.noise(.7,900,.8,.2);for(let i=0;i<6;i++)this.noise(.03,3000,2,.1,'bandpass',Math.random()*.7);break;
    case 'girl':[1318,1174,1046,988,1046].forEach((f,i)=>this.tone(f,f*.995,.45,.05,'triangle',i*.42));break;
    case 'suona':[523,587,659,587].forEach((f,i)=>{this.tone(f,f*1.01,.32,.05,'sawtooth',i*.3)});this.tone(180,170,1.2,.12,'sine',.2);this.noise(.8,600,.6,.06,'bandpass',.2);break;
    case 'voice':this.tone(190,150,.5,.1,'sawtooth');this.noise(.4,1800,3,.05);break;
    default:if(MONSTERS[kind])this.omenCue(kind)}})},
  step(run){this.noise(.06,run?900:520,1.4,run?.13:.05,'bandpass')},
  wade(){this.noise(.25,700,1,.12,'lowpass')},plop(){this.tone(500,140,.18,.18)},
  fuse(){this.noise(.75,6000,2,.05,'highpass')},paper(){this.noise(.16,3200,1.2,.1)},rustle(){this.noise(.32,2400,.6,.12);this.noise(.2,1600,.6,.08,'bandpass',.12)},
  drown(){for(let i=0;i<7;i++)this.tone(180+Math.random()*120,80,.12,.12,'sine',i*.09)},door(){this.tone(180,110,.14,.2,'triangle');this.noise(.1,800,2,.08)},
  knock(){this.tone(150,90,.08,.45,'triangle');this.tone(150,90,.08,.38,'triangle',.15);this.tone(150,90,.08,.32,'triangle',.3)},
  giggle(){[0,.11,.21,.3,.38].forEach((t,i)=>this.tone(980-i*50,1180-i*50,.06,.06,'square',t))},
  whisper(){this.noise(1,2600,5,.13)},scream(child){this.tone(child?1100:700,child?1700:1100,.18,.11,'sawtooth');this.tone(child?1500:1000,child?600:420,.5,.09,'sawtooth',.17)},
  splash(){this.noise(.5,1100,.7,.4,'lowpass');this.noise(.3,2600,1,.12,'bandpass',.05)},
  bang(){this.noise(.55,1800,.5,.9,'lowpass');this.tone(130,38,.4,.6);this.noise(.18,3000,.7,.4,'bandpass',.09);this.noise(.15,2500,.7,.3,'bandpass',.2);this.noise(.12,2800,.7,.25,'bandpass',.29)},
  bell(){this.tone(880,872,1.8,.16);this.tone(1320,1312,1.3,.07);this.tone(2204,2200,.8,.03)},
  drone(g){this.tone(110,55,2.4,g||.22,'sawtooth');this.tone(164,82,2.4,(g||.22)*.5,'triangle')},
  heart(d){this.tone(70,44,.12,.22+d*.4);this.tone(64,40,.1,.16+d*.34,'sine',.18)},
  sting(){this.tone(740,700,.9,.1,'sawtooth');this.tone(784,760,.9,.08,'sawtooth');this.noise(.5,300,1,.2,'lowpass')},
  scare(type){this.noise(.6,2000,.5,.75,'lowpass');[300,318,452,610].forEach(f=>this.tone(f,f*.9,.8,.12,'sawtooth'));this.scream(type==='girl'||type==='mosin')},
  omen(){this.tone(220,110,1.6,.14,'triangle');this.noise(1.2,300,2,.14)},
  omenCue(type){if(type==='mosin')[0,.5,1.1].forEach(t=>this.tone(1050,1250,.07,.035,'square',t));else if(type==='tiger')this.knock();
    else if(type==='kuchi')[0,.42,.84,1.26].forEach(t=>this.noise(.04,3200,3,.18,'bandpass',t));else if(type==='jiang')[0,.6,1.2].forEach(t=>this.tone(70,40,.16,.35,'sine',t));
    else if(type==='suigui')for(let i=0;i<5;i++)this.tone(260+i*40,120,.1,.08,'sine',i*.12);this.omen()},
  hop(d){const k=clamp(1-d/(12*TS),0,1);if(k>0)this.tone(80,42,.14,.06+k*.3)},
  pickup(){this.tone(660,990,.1,.1,'triangle');this.tone(990,1320,.1,.06,'triangle',.07)},throw(){this.noise(.12,1400,2,.14)},
  erhu(){const scale=[293.66,349.23,392,440,523.25,587.33],n=3+Math.floor(Math.random()*3);let t=0,i=Math.floor(Math.random()*4);
    for(let k=0;k<n;k++){i=clamp(i+(Math.random()<.5?-1:1)*(1+Math.floor(Math.random()*2)),0,scale.length-1);const f=scale[i],dur=.5+Math.random()*.7,ac=this.ac,o=ac.createOscillator(),bp=ac.createBiquadFilter(),lp=ac.createBiquadFilter(),g=ac.createGain(),vib=ac.createOscillator(),vg=ac.createGain();
      o.type='sawtooth';bp.type='bandpass';bp.frequency.value=1100;bp.Q.value=1.2;lp.type='lowpass';lp.frequency.value=2400;vib.frequency.value=5.5;vg.gain.value=0;vib.connect(vg).connect(o.frequency);
      const t0=ac.currentTime+t;o.frequency.setValueAtTime(f*.96,t0);o.frequency.exponentialRampToValueAtTime(f,t0+.14);vg.gain.setValueAtTime(0,t0);vg.gain.linearRampToValueAtTime(5,t0+.3);
      g.gain.setValueAtTime(.0001,t0);g.gain.exponentialRampToValueAtTime(.045,t0+.1);g.gain.setValueAtTime(.045,t0+dur-.15);g.gain.exponentialRampToValueAtTime(.0001,t0+dur);
      o.connect(bp).connect(lp).connect(g).connect(this.mus);o.start(t0);vib.start(t0);o.stop(t0+dur+.05);vib.stop(t0+dur+.05);t+=dur*.92}},
  music(dt){if(!this.ok()||!G)return;const now=this.ac.currentTime,quiet=G.silence>G.t||G.over,dang=G.menuMode?0:G.danger,ph=G.phase||0;
    this.droneG.gain.setTargetAtTime(quiet?0:(G.menuMode?.016:.02+.012*ph+(G.final?.02:0)),now,.6);this.tensG.gain.setTargetAtTime(quiet?0:clamp(dang*.07+(G.final?.025:0),0,.09),now,.3);
    if(this.wind)this.wind.gain.setTargetAtTime(quiet?.008:G.mod.rain?.11:.05,now,.4);
    if(quiet)return;this.erT-=dt;if(this.erT<=0){this.erT=15+Math.random()*16;if(dang<.3)this.erhu()}
    this.wbT-=dt;if(this.wbT<=0){this.wbT=5+Math.random()*7;if(dang<.2&&!G.menuMode){this._d=this.mus;this.tone(820,520,.05,.05,'triangle');this.tone(820,520,.05,.04,'triangle',.28);this._d=null}}
    if(dang>.35||G.final){this.drT-=dt;if(this.drT<=0){this.drT=60/(G.final?132:78+dang*60);this._d=this.mus;this.tone(62,38,.25,.14+dang*.12);this.noise(.08,220,1,.08,'lowpass');this._d=null}}},
  amb(dt){if(!this.ok()||!G||G.silence>G.t)return;if(Math.random()<dt*.5){const f=3900+Math.random()*700;for(let i=0;i<3;i++)this.tone(f,f,.035,.012,'sine',i*.07)}
    if(G.mod.rain&&Math.random()<dt*6)this.noise(.05,5000,.5,.02,'highpass')},
  mix(){if(!this.ac||!G)return;const P=G.player,f=!G.menuMode&&P&&(P.lured||P.drown)?450:!G.menuMode&&P&&P.spot&&P.spot.type!=='tree'?700:16000;this.lp.frequency.setTargetAtTime(f,this.ac.currentTime,.12)},
  toggle(){this.on=!this.on;store.set('kaidan-sound',this.on?1:0);if(this.out)this.out.gain.value=this.on?.62:0;$('#mute').textContent=(this.on?'聲音：開':'聲音：關')+(IS_TOUCH?'':'（M）');UI.sub(this.on?'聲音開啟':'聲音關閉','info')},
};

/* ---------------- input ---------------- */
const MOVE=['KeyW','KeyA','KeyS','KeyD','ArrowUp','ArrowDown','ArrowLeft','ArrowRight'];
function playing(){return G&&!G.menuMode&&!G.over&&!G.paused&&$('#title').hidden}
function cycle(d){for(let i=1;i<=5;i++){const j=(G.sel+d*i+10)%5;if(G.inv[ITEM_ORDER[j]]){G.sel=j;UI.itemTip(true);return}}}
function toggleFollow(){const P=G.player,f=G.humans.filter(h=>!h.isPlayer&&alive(h)&&h.state==='follow');
  if(f.length){f.forEach(h=>{h.state='stay';bubble(h,pick(['好……我在這等你。','你要回來喔。','我躲在這裡。']),'voice',1.6)})}
  else{const s=G.humans.filter(h=>!h.isPlayer&&alive(h)&&!h.lured&&!h.drown&&h.wasFollower&&(h.state==='stay'||h.state==='hide'||h.state==='roam')&&dist(h,P)<(h.quirk==='deaf'?2:8)*TS);s.forEach(h=>{if(h.spot)exitSpot(h);h.state='follow';bubble(h,'來了！','voice',1.2)});if(!s.length)bubble(P,'（附近沒有人）','info',1.2)}}
function interact(){const A=G.apparition;if(A&&A.type==='voice'&&!A.violated&&A.t>.2){A.answered=true;return}const it=interactTarget();if(it&&it.fn)it.fn()}
function crouch(){const P=G.player;if(!P.spot)P.crouch=!P.crouch}
function useSel(){if(!G.inv[ITEM_ORDER[G.sel]])cycle(1);useItem()}
addEventListener('keydown',e=>{
  if(['Space','ArrowUp','ArrowDown','ArrowLeft','ArrowRight','Tab'].includes(e.code)&&e.target.tagName!=='BUTTON')e.preventDefault();
  if(e.code==='Tab'&&!playing())return;if(e.code==='Tab')e.preventDefault();
  SND.init();const first=!keys[e.code];
  if(!$('#meet').hidden){if(e.code==='Enter'||e.code==='Escape'||e.code==='Space'){e.preventDefault();UI.closeMeet()}return}
  if(!$('#codex').hidden){if(e.code==='Escape'){$('#codex').hidden=true;$('#m-codex').focus({preventScroll:true})}return}
  if(!$('#title').hidden){if(e.code==='Enter'&&e.target.tagName!=='BUTTON'){startGame(0)}return}
  if(!$('#death').hidden){if(e.code==='KeyR'){startGame(0)}else if(e.code==='Enter'){e.preventDefault();UI.showEnd()}return}
  if(!$('#end').hidden){if(e.code==='KeyR'){startGame(0)}return}
  if(e.code==='KeyM'){SND.toggle();return}
  if((e.code==='Escape'||e.code==='KeyP')&&!G.over){setPause(!G.paused);return}
  if(G.paused||G.over)return;
  if(e.code==='KeyR'&&!G.tut){startGame(0);return}
  keys[e.code]=true;if(!first)return;const P=G.player;
  if((P.lured||P.drown)&&MOVE.includes(e.code))P.mash=(P.mash||0)+1;
  if(e.code==='KeyE')interact();
  if(e.code==='KeyC'||e.code==='ControlLeft')crouch();
  if(e.code==='KeyF')useSel();
  if(e.code==='KeyG')toggleFollow();
  if(e.code==='KeyQ'||e.code==='Tab')cycle(e.shiftKey?-1:1);
  if(/^Digit[1-5]$/.test(e.code)){G.sel=+e.code[5]-1;UI.itemTip(true)}
});
addEventListener('keyup',e=>{keys[e.code]=false});
addEventListener('blur',()=>{if(playing())setPause(true);releaseKeys()});
document.addEventListener('visibilitychange',()=>{if(document.hidden&&playing())setPause(true)});
function aimAt(e){const r=cv.getBoundingClientRect();mouse.fx=(e.clientX-r.left)/r.width;mouse.fy=(e.clientY-r.top)/r.height;mouse.active=true}
cv.addEventListener('mousemove',e=>{if(!IS_TOUCH||e.pointerType!=='touch')aimAt(e)});
cv.addEventListener('mousedown',e=>{SND.init();if(e.button===0&&playing()&&!IS_TOUCH){aimAt(e);if(G){mouse.x=CAM.x+mouse.fx*SW/CAM.z;mouse.y=CAM.y+mouse.fy*SH/CAM.z}useSel()}});
cv.addEventListener('wheel',e=>{if(playing()){cycle(e.deltaY>0?1:-1);e.preventDefault()}},{passive:false});
cv.addEventListener('contextmenu',e=>e.preventDefault());
$('#tray').addEventListener('click',e=>{const s=e.target.closest('.slot');if(s&&G){G.sel=+s.dataset.i;UI.itemTip(true);UI.cache=''}});
// touch: a floating stick on the left half, buttons on the right
if(IS_TOUCH){let tid=null;
  const pos=t=>{const r=cv.getBoundingClientRect();return[(t.clientX-r.left)/r.width*SW,(t.clientY-r.top)/r.height*SH]};
  cv.addEventListener('touchstart',e=>{SND.init();for(const t of e.changedTouches){const[x,y]=pos(t);if(tid===null&&x<SW*.62&&playing()){tid=t.identifier;UI.joy={ox:x,oy:y,x,y};touchVec={x:0,y:0}}}e.preventDefault()},{passive:false});
  cv.addEventListener('touchmove',e=>{for(const t of e.changedTouches)if(t.identifier===tid&&UI.joy){const[x,y]=pos(t),j=UI.joy;j.x=x;j.y=y;const dx=x-j.ox,dy=y-j.oy,l=Math.hypot(dx,dy),R=Math.min(SW,SH)*.08;
      touchVec=l<6?{x:0,y:0}:{x:dx/Math.max(l,R),y:dy/Math.max(l,R)};const P=G.player;if((P.lured||P.drown)&&l>R*.8&&!j.mashed){P.mash=(P.mash||0)+1;j.mashed=true}if(l<R*.5)j.mashed=false}e.preventDefault()},{passive:false});
  const end=e=>{for(const t of e.changedTouches)if(t.identifier===tid){tid=null;touchVec=null;UI.joy=null}};cv.addEventListener('touchend',end);cv.addEventListener('touchcancel',end);
  const tap=(id,fn)=>$(id).addEventListener('touchstart',e=>{e.preventDefault();SND.init();if(playing())fn()},{passive:false});
  const hold=(id,flag)=>{const b=$(id);b.addEventListener('touchstart',e=>{e.preventDefault();SND.init();if(G){G[flag]=true;b.classList.add('on')}},{passive:false});const up=()=>{if(G)G[flag]=false;b.classList.remove('on')};b.addEventListener('touchend',up);b.addEventListener('touchcancel',up)};
  tap('#t-act',interact);tap('#t-item',useSel);tap('#t-crouch',crouch);tap('#t-follow',toggleFollow);hold('#t-run','touchRun');hold('#t-breath','touchBreath');
  $('#m-start-sub').textContent='開始新的一夜';document.querySelectorAll('.btn').forEach(b=>b.textContent=b.textContent.replace(/（[^）]*）$/,''))}
// buttons
$('#m-start').onclick=()=>startGame(0);$('#m-tut').onclick=()=>startGame(0,'tutorial');$('#m-codex').onclick=openCodex;
$('#codexclose').onclick=()=>{$('#codex').hidden=true;$('#m-codex').focus({preventScroll:true})};$('#meetok').onclick=()=>UI.closeMeet();
$('#pausebtn').onclick=()=>setPause(!(G&&G.paused));$('#resume').onclick=()=>setPause(false);$('#restart').onclick=()=>startGame(G.seed,G.sceneId);$('#totitle').onclick=toTitle;$('#mute').onclick=()=>SND.toggle();
$('#again').onclick=()=>startGame(0);$('#dretry').onclick=()=>startGame(0);$('#dnews').onclick=()=>UI.showEnd();$('#replay').onclick=()=>startGame(G.seed);$('#endtitle').onclick=toTitle;
$('#share').onclick=()=>{const t=G.shareText||'';const ok=()=>$('#sharemsg').textContent='已複製，可以貼給朋友了。';
  const fb=()=>{const ta=document.createElement('textarea');ta.value=t;document.body.appendChild(ta);ta.select();let done=false;try{done=document.execCommand('copy')}catch(e){}ta.remove();$('#sharemsg').textContent=done?'已複製，可以貼給朋友了。':'瀏覽器不讓我複製，請手動選取報導文字。'};
  if(navigator.clipboard&&navigator.clipboard.writeText)navigator.clipboard.writeText(t).then(ok,fb);else fb()};

/* ---------------- layout + loop ---------------- */
function fit(){const st=$('#stage');const w=Math.max(280,st.clientWidth),h=Math.max(240,st.clientHeight);SW=w;SH=h;S=Math.min(2,window.devicePixelRatio||1);cv.width=Math.round(SW*S);cv.height=Math.round(SH*S);
  setupView();if(G)updCam(true)}
addEventListener('resize',fit);
const KT={manual:false};window.KT=KT;let last=performance.now(),acc=0;
function frame(now){const dt=Math.min(.1,(now-last)/1000);last=now;
  try{
    if(G){if(G.menuMode){G.t+=dt;const k=G.t*.035;G.menuCam={x:(41.5+Math.sin(k)*3)*TS,y:(21+Math.sin(k*.7)*1.5)*TS}}
      else if(!KT.manual&&!G.paused&&!G.over){acc+=dt;while(acc>=1/60){update(1/60);acc-=1/60}}else acc=0;
      draw();if(!G.menuMode&&$('#title').hidden)hud(dt);if(!G.paused&&!G.menuMode)SND.amb(dt);if(!G.paused)SND.music(dt);SND.mix()}
  }catch(err){console.error(err);KT.err=(KT.err||[]).concat(String(err&&err.stack||err))}
  requestAnimationFrame(frame)}
buildIcons();fit();
const qs=new URLSearchParams(location.search);
toTitle();if(+qs.get('seed'))startGame(+qs.get('seed'));
if(document.fonts&&document.fonts.ready)document.fonts.ready.then(()=>{if(G&&G.chunks)G.chunks.clear()});
requestAnimationFrame(frame);
Object.defineProperty(KT,'G',{get(){return G}});
Object.assign(KT,{startApparition,answerKuchi,setDoor,landProjectile,fireItem,updNight,falseScare,modPool,update:dt=>update(dt),draw,useItem,useSel,interactTarget,interact,callSurv,spawnMonster,setState,bang,keys,mouse,startGame,toTitle,toggleFollow,hideIn,exitSpot,canSee,catchHuman,setPause,TUT,UI,MONSTERS,ITEMS,
  step(n,dt){dt=dt||1/60;for(let i=0;i<n&&!G.over;i++)update(dt)}});
