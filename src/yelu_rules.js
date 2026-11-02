/* ===================================================================== 夜路 (W2) — the rules: what is out of place tonight, and judging the player.
   Interface (see scratchpad spec §9.3). ===================================================================== */
/* YL_RULES — 規矩與不對勁（W2）。只透過 YLCtx 讀世界；不畫圖、不發聲（聲音用 ctx.cue）
 YL_RULES.NIGHTS  [{n:1,yi:['祭祀','嫁娶'],ji:[],fresh:['y_girl','y_turned','y_call'],lead:'y_girl',k:[1,1],empty:0,need:3},
                   {n:2,yi:[],ji:['祭祀','嫁娶'],fresh:['y_ghostwed','y_lamp','y_steps'],lead:'y_ghostwed',k:[1,2],empty:.1,need:3},
                   {n:3,yi:['祭祀'],ji:['嫁娶'],fresh:['y_mirror','y_lords','y_tail'],lead:'y_lords',k:[2,2],empty:.1,need:3}]
                  另有 card:{zh,tw}：夜卡上的一句（第 4.2 節）；need：一夜要連續走對幾趟才天亮（失敗歸零）
 YL_RULES.DEFS    {id:{id,name,segs:['S2',…],kind:'still'|'nianfo'|'skip'|'yield'|'noback',
                   need:{cal:{term,side}}?, art, anchor:[x,y]|null, trigger:{y}?, window?, fail:{style,face,sound},
                   slip:{zh,tw}, src:'原創'|'已查證'|'部分查證'}}
                  另有 verb（skip 型擋的日常動作）、slipForgot（y_jisi：宜祭祀卻忘了拜）、srcNote（來源的細分說明）、
                  failSub（y_jisi 拜錯時 W1 在熄燈後出的字幕）、lines（y_call 依序喊的字幕）、halt（y_lords 經過你身旁時停幾秒）、
                  ear/earGap（y_steps：你停下時最後一步踩在背後幾格、最少隔幾秒，加一聲喘氣 'breath'）。
                  art 是 {fix,v}（dress 會 setVariant(fix,v)）或字串（W3 自己畫：'girl'、'lords'）。
                  y_call、y_steps 的 trigger.y 是 {S2:90,S4:50,S5:29}，依抽到的段取值。
 YL_RULES.pick(seed,night,trip,hist,met) -> [{id,seg}]   第 6 節的抽法；hist=[{trip,ids,failId}]；met=今晚已經遇過的 id（判定定案或已觸發）
                  ids 可以是 id 字串或 {id,seg}；要用到第 6 條（同一段再出現）時，給 {id,seg} 或另給 failSeg
                  代表沒遇過就一直出；第 2 趟起先抽一個今晚沒遇過的新條目，再照權重補滿；今晚新的都遇過了才可能空路
 YL_RULES.dress(ctx)                 依月曆設定正常樣子（宜嫁娶→door4:'wedding'），再套用這一趟不對勁的 variant
                  固定細節的 id 要等於 kind：'shrine'、'door4'、'ama'、'mirror'、'lamp'。先 begin 再 dress
 YL_RULES.begin(pick,ctx) -> inst    inst={def,id,seg,x,y,t:0,state:'idle'|'active'|'done',verdict:'pending',data:{}}
                  inst.x,y 為格；有固定細節的取 ctx.fix(fix) 的位置。data 給 W3 讀：alpha（淡入 0..1）、seen、members、endT
 YL_RULES.judge(ctx,dt)              每幀：觸發、推進（隊伍位置寫進 inst.data.members=[{x,y,kind}]）、判定、日常動作截止
                  ctx.did、ctx.nianfoDone 為真時，judge 自己轉呼 onVerb／onNianfo；W1 另外呼叫也不會重複判定
 YL_RULES.daily(segId,ctx) -> {need:verb|null, forbid:verb|null, why:id}   第 4.2 節加上該段不對勁
 YL_RULES.onVerb(verb,ctx)           日常動作完成：forbid 就 ctx.fail；need 就記錄（ctx.trip.done[verb]=true）
 YL_RULES.onNianfo(ctx) -> inst|null 念完佛：解決最近一個作用中的念佛型（含 y_girl）
 YL_RULES.slip(id,reason) -> {zh,tw} 失敗時的阿嬤的話（第 6 節原文）
 YL_RULES.amaLine(ctx) -> text       走近阿嬤時她說的話（judge 走到 y≤53 時自己 ctx.say 一次）
 ctx.trip 要是 YL.trip 物件（n、anoms、done、fail）；規則自己的記憶放在 ctx.trip.rules。
 ctx.fail 的參數另附 seg、t、at（出錯的東西，格）、slip；x,y 是玩家當下的格座標（魄放這裡）。
 reason：'did' 做了不該做的、'forgot' 該做沒做、'moved' 寬限期後動了、'back' 回頭、'passed' 沒念佛就走過、
         'nocrouch' 隊伍經過時沒蹲、'road' 蹲在路中間
*/
const YL_RULES=(()=>{
const X0=10.5,SEGY={S1:[96,117],S2:[74,95],S3:[56,73],S4:[34,55],S5:[12,33],END:[0,11]};
const VERB={BOW:{seg:'S3',cut:62.5},DELIVER:{seg:'S4',cut:44.5}};
const AMA=[7.5,47.5];
const S=(zh,tw)=>({zh,tw});
const LINE={wed:'少年仔，阮孫今仔日娶某，月曆囥批箱就好。',plain:'少年仔，月曆囥批箱就好。',bow:'少年仔，你無拜土地公喔？',
  mail:'月曆囥批箱就好。',nf:'暗暝看著怪怪的，就念阿彌陀佛。',nfSub:'（看到怪怪的東西，就念阿彌陀佛。）'};
const NIGHTS=[
  {n:1,yi:['祭祀','嫁娶'],ji:[],fresh:['y_girl','y_turned','y_call'],lead:'y_girl',k:[1,1],empty:0,need:3,
    card:S('走夜路，背後有人叫你，別回頭。','暗暝行路，啥人叫你攏莫越頭。')},
  {n:2,yi:[],ji:['祭祀','嫁娶'],fresh:['y_ghostwed','y_lamp','y_steps'],lead:'y_ghostwed',k:[1,2],empty:.1,need:3,
    card:S('今晚，月曆翻過來了。','今暗，月曆攏顛倒反矣。')},   /* no answer on the card: the first death and 阿嬤's slip teach it */
  {n:3,yi:['祭祀'],ji:['嫁娶'],fresh:['y_mirror','y_lords','y_tail'],lead:'y_lords',k:[2,2],empty:.1,need:3,
    card:S('夜裡有隊伍要從路上過，就蹲到路邊讓路。','暗暝有陣頭欲過，就跍去路邊閃一下。')}];
const BACK={S2:90,S4:50,S5:29};
const DEFS={
  y_jisi:{name:'忌祭祀',segs:['S3'],kind:'skip',verb:'BOW',need:{cal:{term:'祭祀',side:'ji'}},art:null,anchor:null,
    fail:{style:'quiet',face:null,sound:'pa'},slip:S('今天月曆寫忌祭祀，今晚別拜。','今仔日忌祭祀，今暗莫拜。'),
    slipForgot:S('今天宜祭祀，經過土地公要拜。','今仔日宜祭祀，經過土地公愛拜。'),failSub:'（多謝你的香。）',
    src:'原創',srcNote:'宜、忌、祭祀是真實的農民曆用詞（已查證）；「忌祭祀就不拜」是遊戲規矩（原創）'},
  y_girl:{name:'紅衣小女孩',segs:['S5'],kind:'still',art:'girl',anchor:[12.5,22.5],trigger:{y:31},
    hush:.8,fade:.2,grace:{1:1.2,2:.9,3:.9},hold:3,calm:.2,
    fail:{style:'lunge',face:'girl',sound:null},slip:S('看到穿紅衣的小女孩，站著別動。','看著穿紅衫的查某囡仔，毋通振動。'),
    src:'原創',srcNote:'人物是台灣都市傳說（已查證）；「不准動」是原創'},
  y_turned:{name:'土地公背對',segs:['S3'],kind:'skip',verb:'BOW',art:{fix:'shrine',v:'turned'},anchor:[12.5,64.5],
    fail:{style:'quiet',face:null,sound:null},slip:S('神明背對著路，祂不在，別拜。','神明無佇咧，毋通拜。'),
    src:'原創',srcNote:'原創'},
  y_call:{name:'背後叫名字',segs:['S2','S4','S5'],kind:'noback',art:null,anchor:null,trigger:{y:BACK},
    window:4.5,grace:.3,behind:2.5,every:1.4,cue:'call',lines:['（背後）少年仔——','（背後）少年仔，你的月曆交落矣！','（背後）少年仔……'],
    fail:{style:'lunge',face:'voice',sound:null},slip:S('背後有人叫你，別回頭。','後壁有人叫，莫越頭。'),
    src:'已查證',srcNote:'夜路有人叫名字不回頭、人有三把火（已查證）'},
  y_ghostwed:{name:'半暝的喜事',segs:['S4'],kind:'skip',verb:'DELIVER',need:{cal:{term:'嫁娶',side:'ji'}},
    art:{fix:'door4',v:'wedding'},anchor:[8.5,46.5],
    fail:{style:'lunge',face:'bride',sound:null},slip:S('今天忌嫁娶，半夜還在辦喜事的，不是活人。','今仔日忌嫁娶，半暝咧辦喜事的，毋是人。'),
    src:'原創',srcNote:'冥婚是真實習俗（已查證）；「忌嫁娶夜裡的喜事是冥婚」是原創'},
  y_lamp:{name:'停電的路燈亮了',segs:['S2'],kind:'nianfo',art:{fix:'lamp',v:'lit'},anchor:[12.5,86.5],
    fail:{style:'quiet',face:null,sound:'pa'},slip:S('看到怪東西，就念阿彌陀佛。','看著怪怪的，就念阿彌陀佛。'),
    src:'原創',srcNote:'原創'},
  y_steps:{name:'背後的腳步',segs:['S2','S4','S5'],kind:'noback',art:null,anchor:null,trigger:{y:BACK},
    window:6,grace:.3,behind:2,lag:.25,stride:.45,cue:'stepBehind',ear:.6,earGap:1.5,
    fail:{style:'quiet',face:null,sound:'stepBehind'},slip:S('有腳步跟著你，別回頭看。','有跤步綴你，莫越頭看。'),
    src:'已查證',srcNote:'應對「夜路不回頭」已查證；背後跟著的腳步是原創細節'},
  y_mirror:{name:'反光鏡裡多一個人',segs:['S5'],kind:'nianfo',art:{fix:'mirror',v:'extra'},anchor:[12.5,21.5],
    fail:{style:'quiet',face:null,sound:'crack'},slip:S('鏡子裡你背後多一個人，就念阿彌陀佛。','鏡內你的後壁加一个人，緊念阿彌陀佛。'),
    src:'原創',srcNote:'原創'},
  y_lords:{name:'七爺八爺暗訪',segs:['S2'],kind:'yield',art:'lords',anchor:null,trigger:{y:93},
    herald:2.5,gongEvery:.7,fade:.6,ahead:8,gap:1.5,speed:1.5,near:1.2,clear:1.5,halt:.6,
    fail:{style:'quiet',face:null,sound:'lingpai'},slip:S('神明暗訪，蹲到路邊讓祂們過。','神明暗訪，跍去路邊閃一下。'),
    src:'原創',srcNote:'七爺八爺外型已查證；暗訪是真實的夜間巡境（部分查證）；「蹲到路邊讓路」沒有找到一手來源（原創）'},
  y_tail:{name:'阿嬤椅子下的尾巴',segs:['S4'],kind:'skip',verb:'DELIVER',art:{fix:'ama',v:'tail'},anchor:[7.5,47.5],
    fail:{style:'lunge',face:'tiger',sound:null},slip:S('阿嬤椅子下有尾巴，月曆就別投。','阿嬤椅仔跤有尾溜，月曆莫囥。'),
    src:'原創',srcNote:'虎姑婆是台灣民間故事（已查證）；尾巴與「不投」是原創'}};
for(const id in DEFS)DEFS[id].id=id;
/* forgetting the mailbox is not one of the ten, but it still has to explain itself */
const MISS={DELIVER:{id:'DELIVER',fail:{style:'quiet',face:null,sound:'pa'},slip:S('月曆要投進阿嬤的信箱。','月曆愛囥入去批箱。')}};

const tripOf=c=>c.trip&&typeof c.trip==='object'?c.trip:YL.trip;
const mem=T=>T.rules||(T.rules={cut:{},said:{},over:false,nfT:-1});
const lenient=c=>c.night===1&&tripOf(c).n===1;
const has=(T,id)=>(T.anoms||[]).find(a=>a&&a.id===id);
const calOk=(d,cal)=>!d.need||cal[d.need.cal.side].includes(d.need.cal.term);
const live=(a,c)=>a.x!=null&&c.onScreen(a.x,a.y,0)&&c.dist(a.x,a.y)<=7;
const clamp01=v=>v<0?0:v>1?1:v;
function lose(c,a,id,reason,at){const T=tripOf(c),M=mem(T);if(M.over||T.fail||(a&&a.verdict!=='pending'))return false;
  const d=DEFS[id]||MISS[id];M.over=true;
  if(a){a.verdict='fail';a.state='done';a.data.endT=c.t}
  c.fail({id,reason,style:d.fail.style,face:d.fail.face,sound:d.fail.sound,x:c.tileX(),y:c.tileY(),seg:a?a.seg:c.seg,t:c.t,
    at:at||(a&&a.x!=null?[a.x,a.y]:null),slip:R.slip(id,reason)});return true}
function win(c,a){const T=tripOf(c),M=mem(T);if(M.over||T.fail||a.verdict!=='pending')return false;
  c.pass(a);a.verdict='pass';a.state='done';a.data.endT=c.t;return true}

/* one step per kind; each runs only while its inst is still pending */
const STEP={
  skip(){},
  still(a,c,dt){const D=a.def,d=a.data;
    if(a.state==='idle'){if(c.tileY()<=D.trigger.y){a.state='active';d.at=c.t;c.hush(D.hush)}return}
    const e=c.t-d.at-D.hush;if(e<0)return;
    d.seen=true;d.alpha=clamp01(e/D.fade);const calm=c.speed()<D.calm;
    if(calm)d.still=(d.still||0)+dt;
    if(d.still>=D.hold)return win(c,a);
    if(!calm&&e>(D.grace[c.night]||D.grace[2]))lose(c,a,a.id,'moved')},
  nianfo(a,c){if(a.state==='idle'&&live(a,c))a.state='active';
    const y=c.tileY();if(y<a.y-1.5||y<SEGY[a.seg][0])lose(c,a,a.id,'passed')},
  noback(a,c,dt){const D=a.def,d=a.data;
    if(a.state==='idle'){if(c.tileY()>D.trigger.y[a.seg])return;a.state='active';d.at=c.t;d.n=0;d.acc=0;d.h=[]}
    const e=c.t-d.at;a.x=c.tileX();a.y=c.tileY()+D.behind;
    if(e>=D.grace&&c.lookingBack())return lose(c,a,a.id,'back',[a.x,a.y]);
    if(e>=D.window)return win(c,a);
    /* the voice is only heard: a subtitle, never a bubble you could see in the dark behind you; the second call tempts with the calendar */
    if(D.every){if(e>=d.n*D.every){const i=Math.min(d.n,D.lines.length-1);d.n++;c.cue(D.cue,a.x,a.y,{behind:true});if(i===1)c.cue('paper',a.x,a.y,{behind:true});c.sub(D.lines[i],1.5)}return}
    /* the steps copy your gait a beat late, so standing still makes them stop too: the last one lands right behind your ear, then a breath */
    d.h.push([c.t,c.speed()]);while(d.h.length>1&&d.h[1][0]<=c.t-D.lag)d.h.shift();
    const was=!!d.moving;d.moving=d.h[0][0]<=c.t-D.lag+1e-6&&d.h[0][1]>.3;
    if(d.moving){d.acc+=dt;if(d.acc>=D.stride){d.acc=0;c.cue(D.cue,a.x,a.y,{behind:true})}}
    else{d.acc=D.stride;if(was&&!(c.t-d.earT<D.earGap)){d.earT=c.t;const ex=c.tileX(),ey=c.tileY()+D.ear;c.cue('stepEar',ex,ey,{behind:true});c.cue('breath',ex,ey,{behind:true})}}},
  yield(a,c,dt){const D=a.def,d=a.data,py=c.tileY();
    if(a.state==='idle'){if(py>D.trigger.y)return;a.state='active';d.at=c.t;d.gong=0;c.cue('chain',X0,py-D.ahead,{})}
    const e=c.t-d.at;
    if(e<D.herald){if(e>=d.gong*D.gongEvery){d.gong++;c.cue('gong',X0,py-D.ahead,{})}return}
    if(!d.members){const y0=py-D.ahead;d.members=[{kind:'qiye',x:X0,y:y0},{kind:'baye',x:X0,y:y0-D.gap}];d.t0=c.t}
    d.alpha=clamp01((c.t-d.t0)/D.fade);
    /* level with you, the procession stops for a beat before it walks on */
    if(d.halt==null&&d.members[0].y>=py)d.halt=c.t;
    if(!(d.halt!=null&&c.t-d.halt<D.halt))for(const m of d.members)m.y+=D.speed*dt;
    a.x=X0;a.y=d.members[0].y;
    const m=d.members.find(m=>Math.abs(m.y-py)<=D.near);
    if(m&&!(c.onShoulder()&&c.crouched()))return lose(c,a,a.id,c.crouched()?'road':'nocrouch',[m.x,m.y]);
    if(d.members.every(m=>m.y>py+D.clear))win(c,a)}};

const R={NIGHTS,DEFS,MISS,LINE,
  pick(seed,night,trip,hist,met){const N=NIGHTS[night-1];if(trip<=1)return[{id:N.lead,seg:DEFS[N.lead].segs[0]}];
    /* seed is split so hash() never multiplies past 2^53, which would round away the night and trip */
    seed>>>=0;const r=mulberry32(Math.floor(hash(seed>>>16,(seed&65535)*4+night,trip)*4294967296));
    const cal={yi:N.yi,ji:N.ji},pool=[];for(const M of NIGHTS)if(M.n<=night)for(const id of M.fresh)if(calOk(DEFS[id],cal))pool.push(id);
    hist=hist||[];const seen=new Set((met||[]).map(x=>x&&x.id||x)),recent=new Set(),last=hist.find(h=>h.trip===trip-1),out=[];
    for(const h of hist)if(h.trip<trip&&h.trip>=trip-2)for(const x of h.ids||[])recent.add(x.id||x);
    const fits=(id,seg)=>{const k=DEFS[id].kind;return!out.some(o=>o.id===id||o.seg===seg)&&
      !(k==='yield'&&out.some(o=>DEFS[o.id].kind==='yield'))&&!(k==='nianfo'&&out.filter(o=>DEFS[o.id].kind==='nianfo').length>=2)&&
      !(id==='y_call'&&out.some(o=>o.id==='y_steps'))&&!(id==='y_steps'&&out.some(o=>o.id==='y_call'))};
    const k=N.k[0]+Math.floor(r()*(N.k[1]-N.k[0]+1)),unmet=N.fresh.filter(id=>pool.includes(id)&&!seen.has(id));
    /* the night's lead keeps coming until you have met it */
    if(unmet.includes(N.lead))out.push({id:N.lead,seg:DEFS[N.lead].segs[0]});
    /* replaying what just killed you wins over an empty road: the point is to win it back at once */
    if(out.length<k&&last&&last.failId&&pool.includes(last.failId)){const f=last.failId,o=(last.ids||[]).find(x=>x&&x.id===f),seg=last.failSeg||(o&&o.seg);
      if(seg&&DEFS[f].segs.includes(seg)&&fits(f,seg)&&r()<.6)out.push({id:f,seg})}
    /* an empty road only once tonight's new ones have all been met */
    if(!out.length&&!unmet.length&&r()<N.empty)return[];
    /* then one of tonight's new ones you have not met yet, before the weighted draw */
    if(out.length<k){const c=[];for(const id of unmet){const segs=DEFS[id].segs.filter(s=>fits(id,s));if(segs.length)c.push([id,segs])}
      if(c.length){const x=c[Math.floor(r()*c.length)];out.push({id:x[0],seg:x[1][Math.floor(r()*x[1].length)]})}}
    while(out.length<k){const c=[];
      for(const id of pool){const segs=DEFS[id].segs.filter(s=>fits(id,s));if(segs.length)c.push([id,segs,(N.fresh.includes(id)?3:1)*(recent.has(id)?.5:1)])}
      if(!c.length)break;let w=r()*c.reduce((s,x)=>s+x[2],0),i=0;for(;i<c.length-1;i++){w-=c[i][2];if(w<0)break}
      out.push({id:c[i][0],seg:c[i][1][Math.floor(r()*c[i][1].length)]})}
    return out},
  dress(c){const set=(f,v)=>c.setVariant(f,v);
    set('shrine','normal');set('door4',c.cal.yi.includes('嫁娶')?'wedding':'plain');set('ama','normal');set('mirror','normal');set('lamp','off');
    for(const a of tripOf(c).anoms||[]){const r=a&&a.def.art;if(r&&r.fix)set(r.fix,r.v)}},
  begin(p,c){const def=DEFS[p.id];if(!def)return null;const f=def.art&&def.art.fix&&c.fix&&c.fix(def.art.fix),an=f?[f.x,f.y]:def.anchor;
    return{def,id:p.id,seg:p.seg,x:an?an[0]:null,y:an?an[1]:null,t:0,state:'idle',verdict:'pending',data:{}}},
  judge(c,dt){const T=tripOf(c),M=mem(T);if(M.over||T.fail)return;
    if(c.did)R.onVerb(c.did,c);if(c.nianfoDone)R.onNianfo(c);
    for(const a of T.anoms||[]){if(M.over||T.fail)return;if(!a)continue;a.t+=dt;if(a.verdict==='pending')STEP[a.def.kind](a,c,dt)}
    if(M.over||T.fail)return;const y=c.tileY(),am=(c.fix&&c.fix('ama'))||{x:AMA[0],y:AMA[1]};
    if(!M.said.ama&&y<=53){M.said.ama=1;c.say(R.amaLine(c),am.x,am.y,3)}
    /* on the lenient trip she covers for a missed shrine, once you are close enough to hear her */
    if(M.said.bow===0&&y<=50.5){M.said.bow=1;c.say(LINE.bow,am.x,am.y,2.4)}
    for(const v in VERB){const V=VERB[v];if(M.cut[v]||y>=V.cut)continue;M.cut[v]=1;const r=R.daily(V.seg,c);
      if(r.need===v&&!(T.done&&T.done[v])){
        if(!lenient(c)){lose(c,null,r.why,'forgot');return}
        if(v==='BOW')M.said.bow=M.said.bow||0;else c.say(LINE.mail,am.x,am.y,2.4)}
      else if(r.forbid===v){const a=has(T,r.why);if(a)win(c,a)}}},
  daily(seg,c){const a=(tripOf(c).anoms||[]).find(i=>i&&i.seg===seg&&i.def.kind==='skip');
    if(seg==='S3'){if(a)return{need:null,forbid:'BOW',why:a.id};
      if(c.cal.ji.includes('祭祀'))return{need:null,forbid:'BOW',why:'y_jisi'};
      if(c.cal.yi.includes('祭祀'))return{need:'BOW',forbid:null,why:'y_jisi'}}
    if(seg==='S4')return a?{need:null,forbid:'DELIVER',why:a.id}:{need:'DELIVER',forbid:null,why:'DELIVER'};
    return{need:null,forbid:null,why:null}},
  onVerb(v,c){const T=tripOf(c),M=mem(T);if(M.over||T.fail)return;const V=VERB[v];
    if(V){const r=R.daily(V.seg,c);if(r.forbid===v){lose(c,has(T,r.why)||null,r.why,'did');return}}
    (T.done||(T.done={}))[v]=true;
    if(v==='DELIVER'&&lenient(c)&&!M.said.nf){M.said.nf=1;const am=(c.fix&&c.fix('ama'))||{x:AMA[0],y:AMA[1]};c.say(LINE.nf,am.x,am.y,3);c.sub(LINE.nfSub)}},
  onNianfo(c){const T=tripOf(c),M=mem(T);if(M.over||T.fail||M.nfT===c.t)return null;M.nfT=c.t;let best=null,bd=1e9;
    for(const a of T.anoms||[]){if(!a||a.verdict!=='pending')continue;
      const k=a.def.kind;if(!(k==='nianfo'?live(a,c):k==='still'&&a.data.seen))continue;const d=c.dist(a.x,a.y);if(d<bd){bd=d;best=a}}
    if(best)win(c,best);return best},
  slip(id,reason){const d=DEFS[id]||MISS[id];if(!d)return{zh:'',tw:''};const s=reason==='forgot'&&d.slipForgot||d.slip;return{zh:s.zh,tw:s.tw}},
  amaLine(c){return c.cal.yi.includes('嫁娶')||has(tripOf(c),'y_ghostwed')?LINE.wed:LINE.plain}};
return R})();
