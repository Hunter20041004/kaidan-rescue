# 夜路 saving: python3 tests/yelu_reload.py <abs html>
# A reload (or 回到標題 and 夜路 again) resumes the same night, trip and draw; the road never touches the 七夜 keys.
import sys,json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1];res=[]
def check(n,ok,d=''):res.append((n,bool(ok),d))
FORBID=['kaidan-run','kaidan-best','kaidan-bestrun','kaidan-nights','kaidan-codex']
# every localStorage access, with the call stack that made it
SPY="""(()=>{const L=window.__ls=[];const S=Storage.prototype;for(const m of['getItem','setItem','removeItem']){const o=S[m];S[m]=function(k,...a){L.push({m,k,s:String(new Error().stack).split('\\n').slice(2,7).map(l=>l.trim().split(' ')[1]).join('<')});return o.call(this,k,...a)}}})()"""
# without the rules file the draw is empty; a stand-in that depends on (seed,night,trip,hist) shows whether the same draw comes back
STUB="if(!Object.keys(YL_RULES.DEFS).length)YL_RULES.pick=(s,n,t,h)=>[{id:'y_fake'+((s%89)+n*7+t*13+(h||[]).length),seg:'S2'}]"
STATE="(()=>{const s=YLT.state();return{night:s.night,n:s.n,picks:s.picks,po:s.po,scene:KT.G.sceneId}})()"
FAIL="(()=>{KT.manual=true;const T=YL.trip;T.done.READ=true;T.phase='walk';YLT.place(10.5,80);KT.step(2);YL.ctx.fail({id:'y_test',reason:'did',style:'quiet',x:10.5,y:80});KT.step(160)})()"
CLEAR="(()=>{KT.manual=true;const T=YL.trip;T.done.READ=T.done.BOW=T.done.DELIVER=true;T.phase='walk';YLT.place(10.5,10.2);KT.keys.KeyW=true;KT.step(20);KT.keys.KeyW=false;KT.step(170)})()"
def forbidden(log):return[(e['m'],e['k'],e['s']) for e in log if e['k'] in FORBID]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.add_init_script(SPY);pg.goto(URL);pg.wait_for_timeout(800);pg.evaluate("localStorage.removeItem('kaidan-yelu')");pg.reload();pg.wait_for_timeout(800)
  def enter():
    # change (judge A3): a card ignores input for its first 0.6 s, so wait 0.7 s before Enter
    pg.evaluate(STUB);pg.evaluate("window.__ls.length=0");pg.click('#m-yelu');pg.wait_for_timeout(700)
    card=pg.evaluate("YL.card&&YL.card.kind");pg.keyboard.press('Enter');pg.wait_for_timeout(100);return card
  # night 1: fail once; then clear the night (change, judge A2: three trips in a row); night 2: fail once → 第二夜第 2 趟 with one 魄
  c1=enter();pg.evaluate(FAIL);pg.evaluate(CLEAR);pg.evaluate(CLEAR);pg.evaluate(CLEAR);pg.evaluate("KT.step(40)");pg.keyboard.press('Enter');pg.evaluate(FAIL);pg.evaluate("KT.manual=false")
  a=pg.evaluate(STATE);log1=pg.evaluate("window.__ls");sv=pg.evaluate("JSON.parse(localStorage.getItem('kaidan-yelu'))")
  pg.reload();pg.wait_for_timeout(800);c2=enter();b2=pg.evaluate(STATE);log2=pg.evaluate("window.__ls")
  check('重新整理後：同一夜、同一趟、抽到同一組、魄還在',a['night']==2 and a['n']==2 and a==b2 and c1=='night' and c2=='night',f'前 {a}　後 {b2}　夜卡 {c1}/{c2}')
  check('存檔格式 kaidan-yelu v:1：每夜一筆紀錄，第一夜錯 1 次、走 4 趟（錯 1＋連走 3）；第二夜失敗後 streak 0',sv['v']==1 and sv['night']==2 and sv['trip']==2 and sv['nights'][0]['trips']==4 and len(sv['nights'][0]['fails'])==1 and sv['done']==False and sv.get('streak')==0 and isinstance(sv.get('met'),list),json.dumps(sv,ensure_ascii=False)[:260])
  bad=forbidden(log1)+forbidden(log2);ours=[x for x in bad if 'modPool' not in x[2]];eng=[x for x in bad if 'modPool' in x[2]]
  keys=sorted({e['k'] for e in log1+log2})
  check('夜路自己的程式（yelu*.js）沒有讀寫七夜的五個鍵',not ours,f'夜路期間碰到的鍵 {keys}；W1 路徑違規 {ours}')
  check('夜路期間五個鍵完全沒被讀寫（含引擎 newGame）',not bad,f'違規 {len(bad)} 次：'+'；'.join(sorted({f"{m} {k} ← {s}" for m,k,s in bad}))[:300])
  # 9. pause → 回到標題 → 夜路 comes back to the same night
  pg.keyboard.press('Escape');pg.wait_for_timeout(200)
  pz=pg.evaluate("[!document.querySelector('#pause').hidden,document.querySelector('#pauseinfo').textContent,document.querySelector('#restart').hidden,document.querySelector('#totitle').textContent,document.querySelector('#pkeys').textContent.includes('念佛')]")
  check('暫停面板：第N夜・第M趟、藏「重玩這一夜」、按鈕寫「回到標題」、按鍵表是夜路版',pz[0] and pz[1]=='第二夜・第二趟' and pz[2] and pz[3]=='回到標題' and pz[4],pz)
  pg.click('#totitle');pg.wait_for_timeout(300)
  t=pg.evaluate("[!document.querySelector('#title').hidden,document.body.classList.contains('yelu'),KT.G.sceneId,document.querySelector('#m-yelu-sub').textContent,['ylhud','ylcal','ylslip','ylcard'].every(i=>document.getElementById(i).hidden)]")
  check('「回到標題」回到標題：夜路 class 拿掉、夜路介面藏起來、按鈕寫「繼續第二夜」',t[0] and not t[1] and t[2]=='village' and t[3]=='繼續第二夜' and t[4],t)
  c3=enter();d=pg.evaluate(STATE)
  check('回到標題後按「夜路」回到同一夜同一趟、同一組',d==b2 and c3=='night',f'{d}')
  # a finished run: the title offers a fresh one
  pg.evaluate("localStorage.setItem('kaidan-yelu',JSON.stringify(Object.assign(JSON.parse(localStorage.getItem('kaidan-yelu')),{done:true})))");pg.evaluate("KT.toTitle()")
  sub=pg.evaluate("document.querySelector('#m-yelu-sub').textContent");enter();e=pg.evaluate(STATE)
  check('done:true 之後，標題按「夜路」開新局',sub=='三個晚上，走同一條路去靈堂' and e['night']==1 and e['n']==1 and not e['po'],f'{sub} → {e}')
  # judge A2: a failure is saved the moment it happens, so a reload during the failure scene still counts it
  pg.evaluate("KT.manual=true;YL.trip.done.READ=true;YL.trip.phase='walk';YLT.place(10.5,80);KT.step(2);YL.ctx.fail({id:'y_test',reason:'did',style:'quiet',x:10.5,y:80});KT.step(40)")
  mid=pg.evaluate("[YL.trip.phase,YL.trip.n]");pg.evaluate("KT.manual=false");pg.reload();pg.wait_for_timeout(800);sv2=pg.evaluate("JSON.parse(localStorage.getItem('kaidan-yelu'))")
  check('失敗演出途中（0.67 秒）重新整理：失敗、魄、下一趟都已經存了',mid==['fail',1] and sv2['trip']==2 and len(sv2['nights'][0]['fails'])==1 and len(sv2['po'])==1 and sv2['streak']==0,f'重新整理前 {mid}　存檔 trip={sv2["trip"]} fails={sv2["nights"][0]["fails"]} po={sv2["po"]}')
  check('沒有 pageerror、KT.err',not errs and not pg.evaluate('KT.err||null'),[errs,pg.evaluate('KT.err||null')])
for n,ok,d in res:print('PASS' if ok else 'FAIL',n,'—',str(d)[:400])
print('PASS:',sum(1 for r in res if r[1]),'FAIL:',sum(1 for r in res if not r[1]))
