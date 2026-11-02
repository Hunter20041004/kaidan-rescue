// 夜路 rules (W2). Runs inside the page against a fake YLCtx, so it needs no road or camera; returns [{name,ok,detail}]
(()=>{const R=[];const T=(name,fn)=>{try{const d=fn();R.push({name,ok:!!(d===true||(d&&d.ok)),detail:d&&d.detail!==undefined?d.detail:d})}catch(e){R.push({name,ok:false,detail:String(e.stack||e)})}};
const Y=YL_RULES,X0=10.5,DT=1/60;
const SEGS=[['S1',96,117],['S2',74,95],['S3',56,73],['S4',34,55],['S5',12,33],['END',0,11]];
const segOf=y=>{for(const[s,a]of SEGS)if(y>=a)return s;return'END'};
const FIXP={shrine:[12.5,64.5],door4:[6.5,44.5],ama:[7.5,47.5],mirror:[12.5,21.5],lamp:[12.5,86.5],mailbox:[8.5,46.5]};
/* the fake world: every method returns what the test set; pass/fail behave as the spec's ctx promises */
function ctx(night,trip,picks){const N=Y.NIGHTS[night-1];const c={night,t:0,dt:DT,TS:24,cal:{yi:N.yi.slice(),ji:N.ji.slice()},seg:'S1',
  x:X0,y:113.5,spd:0,back:false,crouch:false,did:null,nianfoDone:false,fails:[],passes:[],says:[],subs:[],cues:[],hushes:[],vars:{},
  trip:{n:trip,anoms:[],done:{},fail:null},
  tileX(){return this.x},tileY(){return this.y},lateral(){return this.x-X0},speed(){return this.spd},crouched(){return this.crouch},
  onShoulder(){const l=Math.abs(this.x-X0);return l>=1.6&&l<=4},lookingBack(){return this.back},
  fix(id){const p=FIXP[id];return p?{id,kind:id,x:p[0],y:p[1],variant:this.vars[id]}:null},setVariant(id,v){this.vars[id]=v},
  onScreen(x,y){return y>=this.y-7.4&&y<=this.y+3.4&&Math.abs(x-this.x)<=8.9},dist(x,y){return Math.hypot(x-this.x,y-this.y)},
  say(t){this.says.push(t)},sub(t){this.subs.push(t)},cue(k,x,y,o){this.cues.push({k,x,y,o,t:this.t})},hush(s){this.hushes.push(s)},
  pass(i){if(i.verdict!=='pending')return;this.passes.push(i.id);i.verdict='pass'},
  fail(f){if(this.trip.fail)return;this.trip.fail=f;this.fails.push(f)},rng:Math.random};
  c.trip.anoms=(picks||[]).map(p=>Y.begin({id:p[0],seg:p[1]},c));Y.dress(c);return c}
/* one frame: move north at spd, let hook set inputs, then judge */
function frame(c,hook){c.t+=DT;c.y-=c.spd*DT;c.seg=segOf(c.y);c.did=null;c.nianfoDone=false;hook&&hook(c);Y.judge(c,DT)}
function run(c,sec,hook){for(let i=0;i<sec*60&&!c.trip.fail;i++)frame(c,hook)}
function walkTo(c,y,hook,spd){c.spd=spd||3.73;let n=0;while(c.y>y&&!c.trip.fail&&n++<1e5)frame(c,hook);c.spd=0}
/* walk the whole road doing the daily verbs unless told not to */
function road(c,o){o=o||{};let bow=false,mail=false;walkTo(c,9.5,k=>{if(!bow&&k.y<=65.8&&o.bow!==false){bow=true;k.did='BOW'}if(!mail&&k.y<=46.6&&o.mail!==false){mail=true;k.did='DELIVER'}o.hook&&o.hook(k)})}
/* jump straight to y; the daily verbs count as done so the jump does not trip their cutoffs */
const at=(c,y)=>{c.y=y;c.seg=segOf(y);c.trip.done.BOW=c.trip.done.DELIVER=true;return c};
const F=c=>c.fails[0]||null;
const fd=c=>{const f=F(c);return(f?`fail ${f.id}/${f.reason} ${f.style}${f.face?'/'+f.face:''} 「${f.slip.zh}」`:'no fail')+` passes=${c.passes.join(',')}`};
const isFail=(c,id,reason,zh)=>{const f=F(c);return!!f&&f.id===id&&f.reason===reason&&f.slip.zh===zh&&Y.slip(id,reason).zh===zh&&c.fails.length===1};
const clean=(c,id)=>!c.fails.length&&(!id||c.passes.includes(id));

/* ---- 1. DEFS ---- */
T('DEFS 正好 10 筆，欄位齊全，id 是 y_ 開頭且不和 MONSTERS／APPARITIONS／CU_MAP 撞名',()=>{const ids=Object.keys(Y.DEFS),bad=[];
  for(const id of ids){const d=Y.DEFS[id];
    if(!/^y_/.test(id)||d.id!==id)bad.push(id+':id');if(id in MONSTERS||id in APPARITIONS||id in CU_MAP)bad.push(id+':clash');
    if(!Array.isArray(d.segs)||!d.segs.length||!d.segs.every(s=>/^S[1-5]$/.test(s)))bad.push(id+':segs');
    if(!['still','nianfo','skip','yield','noback'].includes(d.kind))bad.push(id+':kind');
    if(!d.fail||!['lunge','quiet'].includes(d.fail.style)||(d.fail.style==='lunge'&&!CPAINT[d.fail.face]))bad.push(id+':fail');
    if(!d.slip||!d.slip.zh||!d.slip.tw)bad.push(id+':slip');if(!['原創','已查證','部分查證'].includes(d.src))bad.push(id+':src')}
  return{ok:ids.length===10&&!bad.length,detail:`${ids.length} 筆 ${ids.join(',')} bad=${bad.join(',')||'none'} src=${ids.map(i=>i.slice(2)+':'+Y.DEFS[i].src).join(' ')}`}});
/* spec change (judge A3/A5): y_girl 台語、y_lords、y_tail、y_mirror 的句子照裁判結論改 */
T('阿嬤的話照規格第 6 節原文（華語與台語各 10 句，加上「宜祭祀卻忘了拜」）',()=>{const W={
  y_jisi:['今天月曆寫忌祭祀，今晚別拜。','今仔日忌祭祀，今暗莫拜。'],y_girl:['看到穿紅衣的小女孩，站著別動。','看著穿紅衫的查某囡仔，毋通振動。'],
  y_turned:['神明背對著路，祂不在，別拜。','神明無佇咧，毋通拜。'],y_call:['背後有人叫你，別回頭。','後壁有人叫，莫越頭。'],
  y_ghostwed:['今天忌嫁娶，半夜還在辦喜事的，不是活人。','今仔日忌嫁娶，半暝咧辦喜事的，毋是人。'],y_lamp:['看到怪東西，就念阿彌陀佛。','看著怪怪的，就念阿彌陀佛。'],
  y_steps:['有腳步跟著你，別回頭看。','有跤步綴你，莫越頭看。'],y_mirror:['鏡子裡你背後多一個人，就念阿彌陀佛。','鏡內你的後壁加一个人，緊念阿彌陀佛。'],
  y_lords:['神明暗訪，蹲到路邊讓祂們過。','神明暗訪，跍去路邊閃一下。'],y_tail:['阿嬤椅子下有尾巴，月曆就別投。','阿嬤椅仔跤有尾溜，月曆莫囥。']};
  const bad=Object.keys(W).filter(id=>{const s=Y.slip(id,'did');return s.zh!==W[id][0]||s.tw!==W[id][1]});
  const f=Y.slip('y_jisi','forgot'),okF=f.zh==='今天宜祭祀，經過土地公要拜。'&&f.tw==='今仔日宜祭祀，經過土地公愛拜。';
  return{ok:!bad.length&&okF,detail:`mismatch=${bad.join(',')||'none'} forgot=${f.zh}／${f.tw}`}});

/* ---- 2. each rule: right answer passes, common mistakes fail with the right reason and slip ---- */
T('y_jisi 第二夜（忌祭祀）：不拜就過；拜了判 did',()=>{const a=ctx(2,2,[]);road(a,{bow:false});const b=ctx(2,2,[]);road(b);
  return{ok:clean(a)&&isFail(b,'y_jisi','did','今天月曆寫忌祭祀，今晚別拜。')&&F(b).style==='quiet',detail:`不拜: ${fd(a)}｜拜: ${fd(b)}`}});
T('y_jisi 第三夜（宜祭祀）：拜了就過；忘了拜在 y<62.5 判 forgot',()=>{const a=ctx(3,2,[]);road(a);const b=ctx(3,2,[]);road(b,{bow:false});
  return{ok:clean(a)&&isFail(b,'y_jisi','forgot','今天宜祭祀，經過土地公要拜。')&&F(b).y<62.5&&F(b).y>62.4,detail:`拜: ${fd(a)}｜忘了拜: ${fd(b)} at y=${F(b)&&F(b).y.toFixed(3)}`}});
T('沒投月曆（第一夜第二趟）：在 y<44.5 判 forgot',()=>{const b=ctx(1,2,[]);road(b,{mail:false});
  return{ok:isFail(b,'DELIVER','forgot','月曆要投進阿嬤的信箱。')&&F(b).y<44.5,detail:`${fd(b)} at y=${F(b)&&F(b).y.toFixed(3)}`}});
/* spec change (judge A5): she is triggered at y≤31 instead of 28; the hooks count from the trigger, as before */
const GY=Y.DEFS.y_girl.trigger.y;
const girl=(night,hook)=>{const c=at(ctx(night,2,[['y_girl','S5']]),GY+4);walkTo(c,GY+.5);c.spd=3.73;run(c,8,hook);return c};
T('y_girl：一進觸發點就停住 3 秒 → 過；hush 0.8 秒',()=>{const c=girl(1,k=>{if(k.y<=GY)k.spd=0});
  return{ok:clean(c,'y_girl')&&c.hushes[0]===.8&&c.trip.anoms[0].data.seen,detail:`${fd(c)} hush=${c.hushes}`}});
T('y_girl：寬限期內還在走（第一夜 1.0 秒後才停）→ 過',()=>{let t0=null;const c=girl(1,k=>{if(k.y<=GY&&t0==null)t0=k.t;if(t0!=null&&k.t-t0>=.8+1.0)k.spd=0});return{ok:clean(c,'y_girl'),detail:fd(c)}});
T('y_girl：寬限期後還在走 → moved（撲臉 girl）',()=>{const c=girl(1);return{ok:isFail(c,'y_girl','moved','看到穿紅衣的小女孩，站著別動。')&&F(c).face==='girl'&&F(c).style==='lunge',detail:fd(c)}});
T('y_girl：第二夜寬限只有 0.9 秒（1.0 秒才停 → moved）',()=>{let t0=null;const c=girl(2,k=>{if(k.y<=GY&&t0==null)t0=k.t;if(t0!=null&&k.t-t0>=.8+1.0)k.spd=0});
  return{ok:isFail(c,'y_girl','moved','看到穿紅衣的小女孩，站著別動。'),detail:fd(c)}});
T('y_girl：她可見時念完佛 → 過（不必等滿 3 秒）',()=>{let t0=null,said=false;const c=girl(1,k=>{if(k.y<=GY&&t0==null){t0=k.t;k.spd=0}if(t0!=null&&!said&&k.t-t0>=1.5){said=true;k.nianfoDone=true}});
  const a=c.trip.anoms[0];return{ok:clean(c,'y_girl')&&a.data.endT-a.data.at<1.6,detail:`${fd(c)} solved after ${(a.data.endT-a.data.at).toFixed(2)}s`}});
T('y_turned：不拜就過；拜了判 did（第一夜宜祭祀也一樣）',()=>{const a=ctx(1,2,[['y_turned','S3']]);road(a,{bow:false});const b=ctx(1,2,[['y_turned','S3']]);road(b);
  return{ok:clean(a,'y_turned')&&isFail(b,'y_turned','did','神明背對著路，祂不在，別拜。')&&a.vars.shrine==='turned',detail:`不拜: ${fd(a)}｜拜: ${fd(b)} shrine=${a.vars.shrine}`}});
const back=(id,seg,hook)=>{const c=ctx(id==='y_call'?1:2,2,[[id,seg]]);road(c,{hook,bow:id==='y_call'?undefined:false});return c};
for(const seg of['S2','S4','S5']){
  T(`y_call ${seg}：一直不回頭 → 過，每 1.4 秒叫一次`,()=>{const c=back('y_call',seg);const n=c.cues.filter(q=>q.k==='call').length;
    return{ok:clean(c,'y_call')&&n===4&&c.cues.every(q=>q.k!=='call'||q.o.behind),detail:`${fd(c)} calls=${n}`}});
  T(`y_call ${seg}：窗口內回頭 → back（撲臉 voice）`,()=>{let t0=null;const c=back('y_call',seg,k=>{const a=k.trip.anoms[0];if(a.state!=='idle'&&t0==null)t0=k.t;if(t0!=null&&k.t-t0>1)k.back=true});
    return{ok:isFail(c,'y_call','back','背後有人叫你，別回頭。')&&F(c).face==='voice'&&F(c).seg===seg,detail:fd(c)}})}
T('y_call：觸發後 0.3 秒內的回頭不算（寬限）',()=>{let t0=null;const c=back('y_call','S2',k=>{const a=k.trip.anoms[0];if(a.state!=='idle'&&t0==null)t0=k.t;k.back=t0!=null&&k.t-t0<.25});return{ok:clean(c,'y_call'),detail:fd(c)}});
T('y_steps：不回頭 → 6 秒後過；走的時候腳步聲在背後慢 0.25 秒跟著',()=>{const c=back('y_steps','S4');
  const st=c.cues.filter(q=>q.k==='stepBehind'),a=c.trip.anoms[0],t0=a.data.at;
  return{ok:clean(c,'y_steps')&&st.length>=5&&st[0].t-t0>=.25-1e-6&&st.every(q=>q.o.behind)&&Math.abs(a.data.endT-t0-6)<.05,detail:`${fd(c)} steps=${st.length} first=${st[0]&&(st[0].t-t0).toFixed(2)}s window=${(a.data.endT-t0).toFixed(2)}s`}});
/* spec change (judge A4): when you stop, the steps stop too, but the last one lands right behind your ear, with a breath */
T('y_steps：停下來，腳步慢 0.25 秒也停；最後一步停在耳後（0.6 格）加一聲喘氣，只一次',()=>{const c=ctx(2,2,[['y_steps','S2']]);walkTo(c,90);c.spd=3.73;run(c,1);c.spd=0;const st=()=>c.cues.filter(q=>q.k==='stepBehind').length,n0=st();run(c,.24);const n1=st();const i0=c.cues.length;run(c,1.5);
  const late=c.cues.slice(i0),ear=late.filter(q=>q.k==='stepEar'),br=late.filter(q=>q.k==='breath');
  return{ok:st()===n1&&!c.trip.anoms[0].data.moving&&ear.length===1&&br.length===1&&Math.abs(ear[0].y-c.y-.6)<1e-6&&ear[0].o.behind&&late.length===2,detail:`走的時候腳步=${n0} 停下 0.24 秒內=+${n1-n0} 之後腳步=+${st()-n1} 之後其他聲音=${late.map(q=>q.k+'@'+(q.y-c.y).toFixed(2)).join(',')}`}});
T('y_steps：窗口內回頭 → back（安靜、stepBehind）',()=>{let t0=null;const c=back('y_steps','S5',k=>{const a=k.trip.anoms[0];if(a.state!=='idle'&&t0==null)t0=k.t;if(t0!=null&&k.t-t0>3)k.back=true});
  return{ok:isFail(c,'y_steps','back','有腳步跟著你，別回頭看。')&&F(c).style==='quiet'&&F(c).sound==='stepBehind',detail:fd(c)}});
T('y_ghostwed 第二夜：不投就過；投了判 did（撲臉 bride）',()=>{const a=ctx(2,1,[['y_ghostwed','S4']]);road(a,{bow:false,mail:false});const b=ctx(2,1,[['y_ghostwed','S4']]);road(b,{bow:false});
  return{ok:clean(a,'y_ghostwed')&&isFail(b,'y_ghostwed','did','今天忌嫁娶，半夜還在辦喜事的，不是活人。')&&F(b).face==='bride',detail:`不投: ${fd(a)}｜投: ${fd(b)}`}});
const nf=(id,seg,at)=>{const c=ctx(id==='y_lamp'?2:3,2,[[id,seg]]);let done=false;road(c,{bow:id==='y_lamp'?false:undefined,hook:k=>{if(at!=null&&!done&&k.y<=at){done=true;k.nianfoDone=true}}});return c};
T('y_lamp：走近念佛 → 過',()=>{const c=nf('y_lamp','S2',89);return{ok:clean(c,'y_lamp')&&c.vars.lamp==='lit',detail:`${fd(c)} lamp=${c.vars.lamp}`}});
T('y_lamp：沒念佛就走過（y<85）→ passed（安靜）',()=>{const c=nf('y_lamp','S2');return{ok:isFail(c,'y_lamp','passed','看到怪東西，就念阿彌陀佛。')&&F(c).y<85&&F(c).style==='quiet',detail:`${fd(c)} y=${F(c)&&F(c).y.toFixed(2)}`}});
T('y_lamp：離太遠（>7 格／不在畫面）念佛沒有用，也不判錯',()=>{const c=ctx(2,2,[['y_lamp','S2']]);c.y=95;c.seg='S2';c.nianfoDone=true;const r=Y.onNianfo(c);
  return{ok:r===null&&!c.fails.length&&c.trip.anoms[0].verdict==='pending',detail:`r=${r} dist=${c.dist(12.5,86.5).toFixed(1)}`}});
/* spec change (judge A5): the mirror shows one more person behind you (variant 'extra'), still answered by 念佛 */
T('y_mirror：念佛 → 過',()=>{const c=nf('y_mirror','S5',25);return{ok:clean(c,'y_mirror')&&c.vars.mirror==='extra',detail:`${fd(c)} mirror=${c.vars.mirror}`}});
T('y_mirror：沒念佛就走過（y<20）→ passed（安靜、crack）',()=>{const c=nf('y_mirror','S5');return{ok:isFail(c,'y_mirror','passed','鏡子裡你背後多一個人，就念阿彌陀佛。')&&F(c).sound==='crack',detail:fd(c)}});
const lords=hook=>{const c=ctx(3,1,[['y_lords','S2']]);walkTo(c,93);c.spd=3.73;let t0=c.t;run(c,25,k=>{hook(k,k.t-t0);if(k.y<10)k.spd=0});return c};
T('y_lords：聽到鑼聲後退到路肩蹲下，等兩位走過 → 過',()=>{const c=lords((k,e)=>{if(e>1){k.spd=0;k.x=12.6;k.crouch=true}});const a=c.trip.anoms[0],m=a.data.members;
  return{ok:clean(c,'y_lords')&&m.length===2&&m[0].kind==='qiye'&&m[1].kind==='baye'&&m.every(q=>q.y>c.y+1.5)&&c.cues.some(q=>q.k==='chain'),detail:`${fd(c)} members=${m.map(q=>q.kind+'@'+q.y.toFixed(1)).join(' ')} you@${c.y.toFixed(1)}`}});
T('y_lords：沒蹲（站在路中間）→ nocrouch（安靜、令牌）',()=>{const c=lords((k,e)=>{if(e>1)k.spd=0});
  return{ok:isFail(c,'y_lords','nocrouch','神明暗訪，蹲到路邊讓祂們過。')&&F(c).style==='quiet'&&F(c).sound==='lingpai',detail:fd(c)}});
T('y_lords：蹲在路中間 → road',()=>{const c=lords((k,e)=>{if(e>1){k.spd=0;k.crouch=true}});return{ok:isFail(c,'y_lords','road','神明暗訪，蹲到路邊讓祂們過。'),detail:fd(c)}});
T('y_lords：站在路肩但沒蹲 → nocrouch',()=>{const c=lords((k,e)=>{if(e>1){k.spd=0;k.x=12.6}});return{ok:isFail(c,'y_lords','nocrouch','神明暗訪，蹲到路邊讓祂們過。'),detail:fd(c)}});
T('y_lords：隊伍經過途中站起來 → nocrouch',()=>{const c=lords((k,e)=>{if(e>1){k.spd=0;k.x=12.6;k.crouch=true}const m=k.trip.anoms[0].data.members;if(m&&Math.abs(m[1].y-k.y)<.5)k.crouch=false});
  return{ok:isFail(c,'y_lords','nocrouch','神明暗訪，蹲到路邊讓祂們過。'),detail:fd(c)}});
T('y_lords：沒有東西經過時蹲在路肩不算錯',()=>{const c=ctx(3,2,[]);walkTo(c,80);c.x=12.6;c.crouch=true;run(c,3);return{ok:!c.fails.length,detail:fd(c)}});
T('y_tail 第三夜：不投就過；投了判 did（撲臉 tiger）',()=>{const a=ctx(3,2,[['y_tail','S4']]);road(a,{mail:false});const b=ctx(3,2,[['y_tail','S4']]);road(b);
  return{ok:clean(a,'y_tail')&&isFail(b,'y_tail','did','阿嬤椅子下有尾巴，月曆就別投。')&&F(b).face==='tiger'&&a.vars.ama==='tail',detail:`不投: ${fd(a)}｜投: ${fd(b)}`}});
T('失敗時給 W1 的資料：玩家格座標、段、時間、出錯的東西',()=>{const c=nf('y_mirror','S5');const f=F(c);
  return{ok:f&&Math.abs(f.x-c.x)<1e-9&&Math.abs(f.y-c.y)<1e-9&&f.seg==='S5'&&f.t===c.t&&f.at[0]===12.5&&f.at[1]===21.5,detail:JSON.stringify(f)}});

/* ---- 3. daily ---- */
T('daily() 6 種組合',()=>{const q=(n,picks,seg)=>{const c=ctx(n,2,picks);const r=Y.daily(seg,c);return`${r.need||'-'}/${r.forbid||'-'}/${r.why||'-'}`};
  const got={宜祭祀:q(1,[],'S3'),忌祭祀:q(2,[],'S3'),宜祭祀加turned:q(1,[['y_turned','S3']],'S3'),宜嫁娶:q(1,[],'S4'),忌嫁娶:q(2,[],'S4'),
    忌嫁娶加ghostwed:q(2,[['y_ghostwed','S4']],'S4'),忌嫁娶加tail:q(3,[['y_tail','S4']],'S4'),其他段:q(1,[['y_call','S2']],'S2')};
  const want={宜祭祀:'BOW/-/y_jisi',忌祭祀:'-/BOW/y_jisi',宜祭祀加turned:'-/BOW/y_turned',宜嫁娶:'DELIVER/-/DELIVER',忌嫁娶:'DELIVER/-/DELIVER',
    忌嫁娶加ghostwed:'-/DELIVER/y_ghostwed',忌嫁娶加tail:'-/DELIVER/y_tail',其他段:'-/-/-'};
  const bad=Object.keys(want).filter(k=>got[k]!==want[k]);return{ok:!bad.length,detail:JSON.stringify(got)}});
T('dress()：宜嫁娶與 y_ghostwed 的門口是同一個 variant；忌嫁娶的正常門口沒有喜事；換一趟會恢復',()=>{const n1=ctx(1,2,[]),n2=ctx(2,1,[['y_ghostwed','S4']]),n2p=ctx(2,2,[]),n3=ctx(3,2,[['y_tail','S4']]);
  const reuse=ctx(3,2,[['y_tail','S4']]);reuse.trip.anoms=[];Y.dress(reuse);
  const ok=n1.vars.door4==='wedding'&&n2.vars.door4==='wedding'&&n2p.vars.door4==='plain'&&n3.vars.ama==='tail'&&reuse.vars.ama==='normal'&&n1.vars.shrine==='normal'&&n1.vars.lamp==='off'&&n1.vars.mirror==='normal';
  return{ok,detail:`n1=${n1.vars.door4} n2 ghostwed=${n2.vars.door4} n2 normal=${n2p.vars.door4} n3 tail ama=${n3.vars.ama} redress=${reuse.vars.ama}`}});
T('阿嬤走近時說的話：宜嫁娶與 y_ghostwed 說「阮孫今仔日娶某」，其他晚上不說',()=>{const l=c=>{at(c,54);walkTo(c,52);return c.says.join('|')};
  const a=l(ctx(1,2,[])),b=l(ctx(2,1,[['y_ghostwed','S4']])),d=l(ctx(2,2,[])),e=l(ctx(3,2,[['y_tail','S4']]));
  const W=Y.LINE.wed,P=Y.LINE.plain;return{ok:a===W&&b===W&&d===P&&e===P,detail:`n1=${a}｜n2 ghostwed=${b}｜n2=${d}｜n3 tail=${e}`}});

/* ---- 4. lenient first trip ---- */
T('第一夜第一趟忘了拜、忘了投都不判錯，只冒阿嬤的提醒',()=>{const c=ctx(1,1,[['y_girl','S5']]);road(c,{bow:false,mail:false,hook:k=>{k.spd=k.y<=28&&k.trip.anoms[0].verdict==='pending'?0:3.73}});
  const ok=!c.fails.length&&c.says.includes(Y.LINE.bow)&&c.says.includes(Y.LINE.mail)&&c.passes.includes('y_girl')&&c.y<10;return{ok,detail:`${fd(c)} says=${c.says.join('|')} y=${c.y.toFixed(1)}`}});
T('第一夜第一趟投了月曆：阿嬤教念佛，字幕跟著出',()=>{const c=ctx(1,1,[]);walkTo(c,46,k=>{if(k.y<=46.6&&!k.trip.done.DELIVER)k.did='DELIVER'});
  return{ok:c.says.includes(Y.LINE.nf)&&c.subs[0]===Y.LINE.nfSub&&!c.fails.length,detail:`says=${c.says.join('|')} subs=${c.subs}`}});
T('第一夜第二趟就會判：忘了拜 → y_jisi/forgot；忘了投 → DELIVER/forgot',()=>{const a=ctx(1,2,[]);road(a,{bow:false});const b=ctx(1,2,[]);road(b,{mail:false});
  return{ok:isFail(a,'y_jisi','forgot','今天宜祭祀，經過土地公要拜。')&&isFail(b,'DELIVER','forgot','月曆要投進阿嬤的信箱。'),detail:`忘了拜: ${fd(a)}｜忘了投: ${fd(b)}`}});

/* ---- 5. pick ---- */
T('pick：每夜第一趟只有代表',()=>{const r=[1,2,3].map(n=>Y.pick(12345,n,1,[]));
  return{ok:r[0].length===1&&r[0][0].id==='y_girl'&&r[0][0].seg==='S5'&&r[1].length===1&&r[1][0].id==='y_ghostwed'&&r[2].length===1&&r[2][0].id==='y_lords',detail:JSON.stringify(r)}});
T('pick：同一組參數結果相同；換趟數或種子會變',()=>{const h=[{trip:1,ids:[{id:'y_girl',seg:'S5'}],failId:'y_girl'}];let same=true,diff=0;
  for(let s=1;s<200;s++)for(let n=1;n<=3;n++){const a=JSON.stringify(Y.pick(s*7919,n,2,h)),b=JSON.stringify(Y.pick(s*7919,n,2,h));if(a!==b)same=false;if(a!==JSON.stringify(Y.pick(s*7919,n,3,h)))diff++}
  return{ok:same&&diff>200,detail:`same=${same} differs across trips in ${diff}/597`}});
/* 1000 trips per night (trips 2–8 after the lead's trip 1): hist is the trips before, met what they showed you, as W1 passes them.
   change (judge A2): pick now takes met, so the sim passes it the way the game does */
const sim=(night,N,failP)=>{const out=[];let s=0;const lead=Y.NIGHTS[night-1].lead;while(out.length<N){s++;const seed=(s*2654435761)>>>0,hist=[{trip:1,ids:[{id:lead,seg:Y.DEFS[lead].segs[0]}],failId:null}],met=new Set([lead]);
  for(let t=2;t<=8&&out.length<N;t++){const m=[...met],p=Y.pick(seed,night,t,hist.slice(-6),m);out.push({t,p,hist:hist.slice(-2),met:m});
    const f=failP&&p.length&&((s*31+t)%10)/10<failP?p[0]:null;hist.push({trip:t,ids:p,failId:f&&f.id});for(const o of p)met.add(o.id)}}return out};
T('pick 1000 趟×3 夜：第 6 節第 3、4 條全部成立',()=>{const bad=[];const UN={1:['y_girl','y_turned','y_call'],2:['y_girl','y_turned','y_call','y_ghostwed','y_lamp','y_steps']};
  for(const n of[1,2,3])for(const r of sim(n,1000,.3)){const p=r.p,ids=p.map(o=>o.id),segs=p.map(o=>o.seg),K=id=>Y.DEFS[id].kind;
    const allowed=n===3?Object.keys(Y.DEFS).filter(i=>i!=='y_jisi'):UN[n];
    if(ids.some(i=>!allowed.includes(i)))bad.push(`n${n}:locked ${ids}`);
    if(ids.includes('y_ghostwed')&&!Y.NIGHTS[n-1].ji.includes('嫁娶'))bad.push(`n${n}:ghostwed on 宜嫁娶`);
    if(p.some(o=>!Y.DEFS[o.id].segs.includes(o.seg)))bad.push(`n${n}:bad seg`);
    if(new Set(segs).size!==segs.length)bad.push(`n${n}:seg twice ${JSON.stringify(p)}`);if(new Set(ids).size!==ids.length)bad.push(`n${n}:id twice`);
    if(ids.filter(i=>K(i)==='yield').length>1)bad.push(`n${n}:yield>1`);if(ids.filter(i=>K(i)==='nianfo').length>2)bad.push(`n${n}:nianfo>2`);
    if(ids.includes('y_call')&&ids.includes('y_steps'))bad.push(`n${n}:call+steps`);
    const k=Y.NIGHTS[n-1].k;if(p.length&&(p.length<k[0]||p.length>k[1]))bad.push(`n${n}:k=${p.length}`)}
  return{ok:!bad.length,detail:`violations=${bad.length} ${bad.slice(0,4).join(' ')}`}});
T('pick：今晚新加入的出現率至少是舊的 2 倍（第二、三夜，含前兩趟 ×0.5）',()=>{const det=[];let ok=true;
  for(const n of[2,3]){const N=Y.NIGHTS[n-1],cnt={};const rs=sim(n,1000,0);for(const r of rs)for(const o of r.p)cnt[o.id]=(cnt[o.id]||0)+1;
    const old=Object.keys(Y.DEFS).filter(i=>i!=='y_jisi'&&!N.fresh.includes(i)&&Y.NIGHTS.slice(0,n-1).some(M=>M.fresh.includes(i))&&(i!=='y_ghostwed'||N.ji.includes('嫁娶')));
    const avg=a=>a.reduce((s,i)=>s+(cnt[i]||0),0)/a.length/rs.length,f=avg(N.fresh),o=avg(old),minF=Math.min(...N.fresh.map(i=>cnt[i]||0))/rs.length;
    if(!(f>=2*o))ok=false;det.push(`n${n}: fresh ${f.toFixed(3)} old ${o.toFixed(3)} ratio ${(f/o).toFixed(2)} (min fresh ${minF.toFixed(3)}) ${JSON.stringify(cnt)}`)}
  return{ok,detail:det.join(' ｜ ')}});
/* spec change (judge A2): the 10% empty road only comes once tonight's new ones have all been met */
T('pick：今晚新的都遇過以後，第二、三夜空路比例 6–14%；還有沒遇過的新條目時從不空路；第一夜沒有空路',()=>{const r={},early={};for(const n of[1,2,3]){const F=Y.NIGHTS[n-1].fresh,rs=sim(n,3000,0),done=rs.filter(x=>F.every(i=>x.met.includes(i))),open=rs.filter(x=>!F.every(i=>x.met.includes(i)));
    r[n]=done.filter(x=>!x.p.length).length/Math.max(1,done.length);early[n]=open.filter(x=>!x.p.length).length}
  return{ok:r[1]===0&&r[2]>=.06&&r[2]<=.14&&r[3]>=.06&&r[3]<=.14&&early[1]+early[2]+early[3]===0,detail:`都遇過後空路 n1 ${(r[1]*100).toFixed(1)}% n2 ${(r[2]*100).toFixed(1)}% n3 ${(r[3]*100).toFixed(1)}%；還有沒遇過的時空路 ${early[1]}/${early[2]}/${early[3]} 趟`}});
/* change (judge A2): met is passed (everything tonight already met), so only the replay rule is measured, as before */
T('pick：上一趟害你輸的那個，下一趟約 60% 再出現在同一段',()=>{let hit=0,tot=0;for(let s=1;s<=1000;s++){const h=[{trip:2,ids:[{id:'y_call',seg:'S4'}],failId:'y_call'}];
  const p=Y.pick(s*104729,1,3,h,Y.NIGHTS[0].fresh);tot++;if(p.some(o=>o.id==='y_call'&&o.seg==='S4'))hit++}
  const h2=[{trip:4,ids:[{id:'y_tail',seg:'S4'},{id:'y_lords',seg:'S2'}],failId:'y_tail'}];let hit2=0;for(let s=1;s<=1000;s++)if(Y.pick(s*7,3,5,h2,Y.NIGHTS[2].fresh).some(o=>o.id==='y_tail'&&o.seg==='S4'))hit2++;
  return{ok:hit/tot>=.55&&hit/tot<=.75&&hit2/1000>=.55&&hit2/1000<=.8,detail:`n1 y_call@S4 ${hit}/${tot}（60% 重現＋40% 裡本來就會抽到的）｜n3 y_tail@S4 ${hit2}/1000`}});

/* judge A2: the lead is guaranteed, tonight's unmet new ones come first, and a perfect player meets all ten */
T('pick：代表沒遇過就一直出（第 2–6 趟、三夜 ×1000 種子都 100%）；遇過就不再保證',()=>{const o=[];let ok=true;for(const n of[1,2,3]){const L=Y.NIGHTS[n-1].lead;let hit=0,tot=0,after=0;
    for(let s=1;s<=1000;s++)for(let t=2;t<=6;t++){tot++;if(Y.pick(s*7919,n,t,[],[]).some(x=>x.id===L))hit++;if(Y.pick(s*7919,n,t,[],[L]).some(x=>x.id===L))after++}
    if(hit!==tot||after===tot)ok=false;o.push(`n${n} ${L} 沒遇過 ${hit}/${tot}、遇過後 ${after}/${tot}`)}return{ok,detail:o.join('｜')}});
T('pick：第 2 趟起，今晚還有沒遇過的新條目時，一定先抽一個（三夜 ×1000）',()=>{const o=[];let ok=true;for(const n of[1,2,3]){const N=Y.NIGHTS[n-1];let hit=0,tot=0;
    for(let s=1;s<=1000;s++){const met=[N.lead],p=Y.pick(s*104729,n,2,[{trip:1,ids:[{id:N.lead,seg:Y.DEFS[N.lead].segs[0]}],failId:null}],met);tot++;if(p.some(x=>N.fresh.includes(x.id)&&!met.includes(x.id)))hit++}
    if(hit!==tot)ok=false;o.push(`n${n} ${hit}/${tot}`)}return{ok,detail:o.join(' ')}});
T('覆蓋率：從不失敗的玩家三夜各 3 趟，10 條每條遇到的比例 ≥ 99%（4000 種子）',()=>{const ALL=Object.keys(Y.DEFS),cnt={};const S=4000;
  for(let s=1;s<=S;s++){const seen=new Set(['y_jisi']);for(const n of[1,2,3]){const hist=[],met=[];for(let t=1;t<=3;t++){const p=Y.pick(s*7919,n,t,hist,met);for(const x of p){seen.add(x.id);if(!met.includes(x.id))met.push(x.id)}hist.push({trip:t,ids:p,failId:null})}}for(const i of seen)cnt[i]=(cnt[i]||0)+1}
  const r=ALL.map(i=>[i,(cnt[i]||0)/S]);return{ok:r.every(([,v])=>v>=.99),detail:r.map(([i,v])=>`${i.slice(2)} ${(v*100).toFixed(1)}%`).join(' ')}});
T('第二夜第一趟死在 y_jisi（冥婚還沒判）→ 下一趟冥婚 100%（1000 種子）',()=>{let hit=0;for(let s=1;s<=1000;s++){const p=Y.pick(s*31337,2,2,[{trip:1,ids:[{id:'y_ghostwed',seg:'S4'}],failId:'y_jisi'}],[]);if(p.some(x=>x.id==='y_ghostwed'))hit++}return{ok:hit===1000,detail:`${hit}/1000`}});
T('y_lords：走到你身旁停 0.6 秒再走（事件比不停多約 0.6 秒）',()=>{const c=lords((k,e)=>{if(e>1){k.spd=0;k.x=12.6;k.crouch=true}});const a=c.trip.anoms[0],d=a.data;
  const dur=d.endT-d.t0,base=(Y.DEFS.y_lords.ahead+Y.DEFS.y_lords.gap+Y.DEFS.y_lords.clear)/Y.DEFS.y_lords.speed;return{ok:clean(c,'y_lords')&&d.halt!=null&&Math.abs(dur-base-.6)<.1,detail:`現身到過關 ${dur.toFixed(2)} 秒，不停的話約 ${base.toFixed(2)} 秒`}});
T('y_call：三聲字幕依序（第二聲提到月曆、背後有翻紙聲），不冒泡泡',()=>{const c=back('y_call','S2');const L=Y.DEFS.y_call.lines;
  return{ok:clean(c,'y_call')&&c.subs.length===4&&c.subs[0]===L[0]&&c.subs[1]===L[1]&&c.subs[2]===L[2]&&c.subs[3]===L[2]&&L[1].includes('月曆')&&!c.says.some(t=>t==='少年仔——'||L.includes(t))&&c.cues.some(q=>q.k==='paper'&&q.o.behind),detail:`subs=${c.subs.join('｜')} says=${c.says.join('|')}`}});

/* ---- 6. a verdict is final ---- */
T('判定只定案一次：fail 之後 pass、fail、念佛、日常動作都不再生效',()=>{const c=ctx(3,2,[['y_lamp','S2'],['y_tail','S4']]);walkTo(c,84.9);
  const f0=c.fails.length,lamp=c.trip.anoms[0],tail=c.trip.anoms[1];c.did='DELIVER';Y.onVerb('DELIVER',c);c.y=47;c.t+=.1;c.nianfoDone=true;const r=Y.onNianfo(c);
  Y.judge(c,DT);c.y=40;Y.judge(c,DT);for(let i=0;i<120;i++){c.t+=DT;c.y-=.05;Y.judge(c,DT)}
  return{ok:f0===1&&c.fails.length===1&&!c.passes.length&&r===null&&lamp.verdict==='fail'&&tail.verdict==='pending'&&c.fails[0].id==='y_lamp',
    detail:`fails=${c.fails.map(f=>f.id+'/'+f.reason)} passes=${c.passes} lamp=${lamp.verdict} tail=${tail.verdict} onNianfo=${r}`}});
T('判定只定案一次：pass 之後回頭再做錯也不改判',()=>{const c=ctx(1,2,[['y_call','S2']]);walkTo(c,90);c.spd=3.73;run(c,5);const v0=c.trip.anoms[0].verdict;c.back=true;run(c,2);
  return{ok:v0==='pass'&&c.trip.anoms[0].verdict==='pass'&&!c.fails.length&&c.passes.length===1,detail:`${v0} → ${c.trip.anoms[0].verdict} ${fd(c)}`}});
T('念錯佛不會判錯：沒有念佛型時、背後型作用中、小女孩還沒出現時念佛',()=>{
  const a=ctx(1,2,[]);a.y=80;a.nianfoDone=true;const ra=Y.onNianfo(a);
  const b=ctx(1,2,[['y_call','S2']]);walkTo(b,90);b.spd=3.73;run(b,.5);b.t+=DT;b.nianfoDone=true;const rb=Y.onNianfo(b);b.nianfoDone=false;run(b,1);
  const c=at(ctx(1,2,[['y_girl','S5']]),GY+1);walkTo(c,GY);c.t+=.3;c.nianfoDone=true;const rc=Y.onNianfo(c);
  return{ok:ra===null&&rb===null&&rc===null&&!a.fails.length&&!b.fails.length&&!c.fails.length&&c.trip.anoms[0].verdict==='pending',detail:`none=${ra} call=${rb} girl-hidden=${rc} fails=${a.fails.length+b.fails.length+c.fails.length}`}});
T('同一幀 judge 與 W1 都呼叫 onNianfo 不會解決兩個；onVerb 重複呼叫也只判一次',()=>{const c=ctx(2,2,[['y_lamp','S2']]);walkTo(c,89);c.t+=DT;c.nianfoDone=true;
  const r1=Y.onNianfo(c),r2=Y.onNianfo(c);const d=ctx(2,2,[]);d.y=65;Y.onVerb('BOW',d);Y.onVerb('BOW',d);d.did='BOW';Y.judge(d,DT);
  return{ok:r1&&r1.id==='y_lamp'&&r2===null&&c.passes.length===1&&d.fails.length===1,detail:`first=${r1&&r1.id} second=${r2} passes=${c.passes.length} bow fails=${d.fails.length}`}});
T('整趟機器人：第一到三夜的代表趟照正確應對都能走到靈堂',()=>{const out=[];
  const g=ctx(1,1,[['y_girl','S5']]);road(g,{hook:k=>{if(k.y<=28&&k.y>20&&!k.passes.length)k.spd=0;else if(k.spd===0)k.spd=3.73}});out.push(['n1',g]);
  const w=ctx(2,1,[['y_ghostwed','S4']]);road(w,{bow:false,mail:false});out.push(['n2',w]);
  let t0=null;const l=ctx(3,1,[['y_lords','S2']]);road(l,{hook:k=>{const a=k.trip.anoms[0];if(a.state==='active'&&t0==null)t0=k.t;if(a.verdict==='pending'&&t0!=null&&k.t-t0>1){k.spd=0;k.x=12.6;k.crouch=true}else if(a.verdict==='pass'&&k.crouch){k.crouch=false;k.x=X0;k.spd=3.73}}});out.push(['n3',l]);
  return{ok:out.every(([,c])=>!c.fails.length&&c.y<10&&c.passes.length===1),detail:out.map(([n,c])=>`${n}: ${fd(c)} y=${c.y.toFixed(1)}`).join(' ｜ ')}});
T('在真的頁面裡：KT.startGame(1,\'yelu\') 之後 YL_RULES 可用，判定不碰遊戲的 RNG',()=>{KT.startGame(1,'yelu',{mod:'calm'});const before=RNG();KT.startGame(1,'yelu',{mod:'calm'});
  for(let i=0;i<50;i++)Y.pick(i,3,4,[]);const after=RNG();return{ok:before===after&&KT.G.sceneId==='yelu',detail:`RNG ${before} vs ${after} scene=${KT.G.sceneId}`}});
return R})()
