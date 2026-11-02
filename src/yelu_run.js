/* ===================================================================== 夜路 (W1) — nights, the run, saving (kaidan-yelu).
   Interface (see scratchpad spec §9.3). ===================================================================== */
/* YL_RUN— 夜與局（W1）
 YL_RUN.start()              標題「夜路」：讀 kaidan-yelu，開夜卡
 YL_RUN.onStart()            startGame 之後：body 加上 yelu class，開始第 n 趟
 YL_RUN.overlayKey(e) -> bool   夜卡、天亮卡、結束卡、阿嬤的話開著時處理 Enter/Space/Esc/R
 YL_RUN.pauseFill(on)        暫停面板：資訊列「第N夜・第M趟」，藏 #restart，#totitle 改成「回到標題」，按鍵表換夜路版
 YL_RUN.titleFill()          #m-yelu-sub 寫「繼續第N夜」或預設字
 YL_RUN.save() / load()
 測試用 window.YLT = {start(night,seed,trip), force(ids), state(), step(n), place(tx,ty), view(rad), press(code), release(code)}
 W1 補充：
 - 存檔 {v:1,seed,night,trip,streak,met:[id],cold,po:[{x,y}],nights:[{n,trips,fails:[{id,seg,t}],secs}],hist:[{trip,ids:[{id,seg}],failId}],done}；
   hist 是這一夜各趟抽到什麼、哪一個害你輸，pick 要用它，重新整理後才抽得到同一組。
   streak＝這一夜連續走對幾趟（滿 need 趟才天亮，失敗歸 0）；met＝這一夜遇過的不對勁（判定定案或已觸發）；cold＝失敗時熄掉的香有幾根。
   舊存檔缺 streak／met／cold 時當 0／空陣列，不升版號。load() 檢查欄位型別，不合格就開新局。
 - 失敗那一刻就存檔（趟數 +1、streak 歸 0、魄），所以失敗演出中重新整理也算數。
 - YL_UI.card 的 data：night {n,name,cal,zh,tw}；dawn {n,text}；end {text,nights:[{n,trips,fails,secs}],secs}。
   end 的按鈕呼叫 onGo('again'|'title')。夜卡不自動翻走；天亮卡 1.5 秒、wait 卡 1.2 秒由 W1 用 G.t 計時關掉。
   wait {n,text:'天猶未光。',streak,need}：連走未滿 need 趟時，兩趟之間。
*/
const YL_RUN={S:null,noCard:false,bound:false,
  /* used only while the rules file has no NIGHTS yet, so the road still runs */
  CAL:[{yi:['祭祀','嫁娶'],ji:[]},{yi:[],ji:['祭祀','嫁娶']},{yi:['祭祀'],ji:['嫁娶']}],
  nightDef(n){return(YL_RULES.NIGHTS||[]).find(x=>x.n===n)||null},
  cal(n){const N=this.nightDef(n)||this.CAL[n-1]||this.CAL[0];return{n,yi:N.yi.slice(),ji:N.ji.slice()}},
  cardData(n){const N=this.nightDef(n),c=N&&N.card||{};return{n,name:`守靈第${CN[n]}夜`,cal:this.cal(n),zh:c.zh||'',tw:c.tw||''}},
  need(n){const N=this.nightDef(n||(this.S&&this.S.night)||1);return N&&N.need||1},
  NOTE:'人物與習俗取自台灣民間；路上的規矩，多半是這個遊戲編的。',
  fresh(){return{v:1,seed:((Math.random()*1e9)>>>0)||1,night:1,trip:1,streak:0,met:[],cold:0,po:[],nights:[],hist:[],done:false}},
  nightRec(){const S=this.S;let N=S.nights.find(x=>x.n===S.night);if(!N){N={n:S.night,trips:S.trip,fails:[],secs:0};S.nights.push(N)}return N},
  start(){const s=this.load();this.S=s&&!s.done?s:this.fresh();this.noCard=false;startGame(this.S.seed,'yelu',{mod:'calm'})},
  onStart(){document.body.classList.add('yelu');if(!this.S)this.S=this.load()||this.fresh();this.bind();const card=!this.noCard;this.noCard=false;YL.beginNight(card)},
  bind(){if(this.bound)return;this.bound=true;const el=id=>document.getElementById(id),yl=()=>G&&G.yelu&&!G.menuMode;
    const lk=el('t-look');if(lk){lk.addEventListener('touchstart',e=>{e.preventDefault();if(G)G.touchLook=true},{passive:false});const up=()=>{if(G)G.touchLook=false};lk.addEventListener('touchend',up);lk.addEventListener('touchcancel',up)}
    el('ylhud').addEventListener('click',()=>{if(yl())YL.peekToggle()});   /* the small calendar is how a phone gets a closer look */
    el('ylcal').addEventListener('click',()=>{const A=YL.act;if(!yl())return;if(A&&A.verb==='READ'){if(A.t>=.6)A.t=A.dur}else if(YL.peekUntil>G.t)YL.peekToggle()});   /* a tap puts the page away */
    el('ylslip').addEventListener('click',()=>{if(yl())YL.skipSlip()});
    el('ylcard').addEventListener('click',()=>{if(yl()&&YL.card&&YL.card.kind==='night')YL.closeCard(null,true)})},
  /* saved at once: a reload during the failure still counts it, moves on a trip and keeps the 魄 */
  onFail(T){const f=T.fail,S=this.S;this.nightRec().fails.push({id:f.id,seg:f.seg,t:Math.round(f.tt*10)/10});this.hist(T);this.meet(T);
    S.cold=S.streak||0;S.streak=0;S.trip=T.n+1;S.po=YL.poWith(f.x,f.y).map(p=>({x:+p.x.toFixed(2),y:+p.y.toFixed(2)}));this.nightRec().secs=Math.round(YL.secs);this.save()},
  hist(T){const S=this.S;S.hist=(S.hist||[]).concat({trip:T.n,ids:T.picks,failId:T.fail?T.fail.id:null}).slice(-6)},
  /* what you have met tonight: a verdict, or it has started (a skip type only counts once judged) */
  meet(T){const S=this.S,m=new Set(S.met||[]);for(const a of T.anoms||[])if(a&&(a.state!=='idle'||a.verdict!=='pending'))m.add(a.id);S.met=[...m]},
  cleared(T){const S=this.S,N=this.nightRec();this.hist(T);this.meet(T);S.streak=(S.streak||0)+1;S.cold=0;N.trips=T.n;N.secs=Math.round(YL.secs);
    if(S.streak>=this.need())return this.dawn();
    S.trip=T.n+1;this.save();YL.openCard('wait',{n:S.night,text:'天猶未光。',streak:S.streak,need:this.need()})},
  dawn(){const S=this.S,N=this.nightRec();N.secs=Math.round(YL.secs);
    logPlay({kind:'yelu',n:N.n,trips:N.trips,fails:N.fails.map(f=>[f.id,f.seg,f.t]),secs:N.secs});
    S.po=[];S.hist=[];S.met=[];S.streak=0;S.cold=0;if(S.night>=3)S.done=true;else{S.night++;S.trip=1}this.save();YL.openCard('dawn',{n:N.n,text:'天光了。'})},
  afterDawn(){const S=this.S;if(!S.done)return startGame(S.seed,'yelu',{mod:'calm'});
    YL.openCard('end',{text:'第三夜過去了。頭七還沒到。',note:this.NOTE,nights:S.nights.map(N=>({n:N.n,trips:N.trips,fails:N.fails.length,secs:N.secs})),secs:S.nights.reduce((a,N)=>a+N.secs,0)})},
  again(){this.S=this.fresh();this.noCard=false;startGame(this.S.seed,'yelu',{mod:'calm'})},
  overlayKey(e){if(!G||!G.yelu||G.menuMode||G.paused)return false;const C=YL.card,code=e.code;if(code==='KeyM')return false;
    if(C){e.preventDefault();if(e.repeat)return true;
      if(C.kind==='night'){if(code==='Escape')toTitle();else if(code==='Enter'||code==='Space'||code==='KeyE')YL.closeCard(null,true)}
      else if(C.kind==='end'){if(code==='Escape')YL.closeCard('title',true);else if(code==='KeyR'||code==='Enter')YL.closeCard('again',true)}
      return true}
    const f=YL.trip&&YL.trip.fail;if(f&&f.slipAt!=null&&f.home==null){if(code==='Escape')return false;if(code==='Enter'||code==='Space'||code==='KeyE')YL.skipSlip();return true}
    return false},
  pauseFill(on){if(!on)return;const T=YL.trip,$=s=>document.querySelector(s),cal=T?T.cal:this.cal(1),w=a=>a.length?a.join(' '):'—';
    $('#restart').hidden=true;$('#totitle').textContent='回到標題';$('#pauseinfo').textContent=T?`第${cnNum(T.night)}夜・第${cnNum(T.n)}趟`:'';
    /* the rules a card has said out loud so far (the second night's card does not say one) */
    const n=T?T.night:1,rules=[1,3].filter(k=>k<=n).map(k=>this.nightDef(k)).filter(N=>N&&N.card).map(N=>`<li>${N.card.zh}</li>`).join(''),P='grid-column:1/-1;margin:0;';
    $('#pentries').innerHTML=`<p style="${P}font-size:15px;color:var(--ink-2)">今晚的月曆　宜 ${w(cal.yi)}　忌 ${w(cal.ji)}</p>`+(rules?`<ul style="${P}padding-left:1.2em;font-size:15px;line-height:1.6">${rules}</ul>`:'')+
      `<p style="${P}font-size:14px;color:var(--ink-2)">${this.NOTE}</p>`;
    $('#pkeys').innerHTML=(IS_TOUCH?[['左半邊拖曳','走路'],['互動','拿月曆、拜土地公、投月曆'],['蹲','蹲下／站起'],['念佛','念一聲阿彌陀佛（每趟 3 顆佛珠）'],['回頭','按住，手電筒照向背後'],['小月曆','點一下放大']]
      :[['WASD','走路'],['滑鼠','手電筒方向'],['E','互動：拿月曆、拜土地公、投月曆'],['C','蹲下／站起'],['空白鍵','念佛（每趟 3 顆佛珠）'],['Tab','按住看月曆'],['M','聲音開關']]).map(([a,b])=>`<div><kbd>${a}</kbd><span>${b}</span></div>`).join('');
    closeupLabel();setTimeout(()=>{if(!IS_TOUCH)$('#resume').focus({preventScroll:true})},30)},
  titleFill(){for(const id of['ylhud','ylcal','ylslip','ylcard']){const e=document.getElementById(id);if(e)e.hidden=true}
    const s=this.load(),el=document.getElementById('m-yelu-sub');if(el)el.textContent=s&&!s.done?`繼續第${CN[s.night]}夜`:'三個晚上，走同一條路去靈堂'},
  save(){if(this.S)store.set('kaidan-yelu',this.S)},
  /* a save with a field of the wrong shape would throw later and never let you in again, so it starts a new run instead */
  load(){const s=store.get('kaidan-yelu',null),int=v=>Number.isInteger(v)&&v>=1,arr=Array.isArray,num=v=>typeof v==='number'&&Number.isFinite(v);
    if(!s||typeof s!=='object'||s.v!==1||!int(s.night)||s.night>3||!int(s.trip)||!num(s.seed)||!arr(s.po)||!arr(s.nights)||!arr(s.hist))return null;
    if(!s.nights.every(N=>N&&typeof N==='object'&&arr(N.fails))||!s.po.every(p=>p&&num(p.x)&&num(p.y))||!s.hist.every(h=>h&&typeof h==='object'))return null;
    if(s.met!=null&&!arr(s.met))return null;s.met=s.met||[];s.streak=Number.isInteger(s.streak)&&s.streak>=0?s.streak:0;s.cold=Number.isInteger(s.cold)&&s.cold>=0?s.cold:0;return s}};
