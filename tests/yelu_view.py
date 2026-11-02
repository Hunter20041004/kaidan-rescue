# 夜路 camera and screens: python3 tests/yelu_view.py <abs html> [screenshot dir]
# Measures how far ahead you see while walking (desk 1280×800, phone 375×812 touch DPR 3), the phone buttons, and saves the W1 screenshots.
import sys,json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1];OUT=sys.argv[2] if len(sys.argv)>2 else 'tests/out';res=[]
def check(n,ok,d=''):res.append((n,bool(ok),d))
SETUP="([n,x,y])=>{KT.manual=true;for(const k in KT.keys)KT.keys[k]=false;KT.mouse.active=false;YLT.start(n,4242,1);YLT.force([]);const T=YL.trip;if(y<113){T.done.READ=T.done.BOW=T.done.DELIVER=true;T.phase='walk'}YLT.place(x,y);KT.step(2);return YLT.state()}"
WALK="""(()=>{const K=KT.keys,P=KT.G.player;let mn=1e9,mx=-1e9,lat=0;K.KeyW=true;
  for(let i=0;i<60*20;i++){KT.step(1);KT.draw();if(i>=60){const r=(P.y-CAM.y)/24;mn=Math.min(mn,r);mx=Math.max(mx,r);lat=Math.max(lat,Math.abs(P.x-CAM.x-BW/2))}}
  K.KeyW=false;return{mn,mx,lat,vw:BW/24,vh:BH/24,k:CAM.k,y:P.y/24,err:KT.err||null}})()"""
OVER="[document.documentElement.scrollWidth,innerWidth]"
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,vp,touch in [('desk',{'width':1280,'height':800},False),('mob',{'width':375,'height':812},True)]:
    pg=b.new_page(viewport=vp,has_touch=touch,is_mobile=touch,device_scale_factor=(3 if touch else 1));errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(URL);pg.wait_for_timeout(900);pg.evaluate("localStorage.removeItem('kaidan-yelu')")
    def shot(f,why):
      pg.wait_for_timeout(500);pg.screenshot(path=f'{OUT}/{f}');o=pg.evaluate(OVER);check(f'{name} 截圖 {f}（{why}）沒有水平溢出',o[0]<=o[1],f'scrollWidth={o[0]} innerWidth={o[1]}')
    # 2. the camera while walking up the middle of the road
    pg.evaluate(SETUP,[1,10.5,112]);r=pg.evaluate(WALK)
    check(f'{name} 鏡頭：路中心往前走，(P.y-CAM.y)/TS ≥ 7.0',r['mn']>=7.0 and r['lat']<1,f"最小 {r['mn']:.2f} 最大 {r['mx']:.2f} 格；畫面 {r['vw']:.1f}×{r['vh']:.1f} 格 k={r['k']}；左右偏 {r['lat']:.2f} px；走到 y={r['y']:.1f}")
    pg.evaluate(SETUP,[1,11.5,113.5]);shot(f'yl-{name}-start.png','貨車旁')
    if not touch:
      pg.evaluate(SETUP,[1,11.4,66.4]);pg.evaluate("YL.trip.done.BOW=false");shot('yl-desk-s3.png','土地公廟前，拜的提示')
      pg.evaluate(SETUP,[1,10.5,80]);pg.evaluate("YL.ctx.fail({id:'y_lamp',reason:'walked',style:'quiet',x:10.5,y:80,at:[12.5,86.5],slip:{zh:'看到怪東西，就念阿彌陀佛。',tw:'看著怪怪的，就念阿彌陀佛。'}});KT.step(66)")
      st=pg.evaluate("[YL.trip.phase,YL.trip.fail&&YL.trip.fail.slipAt!=null,YL.blackA()]");shot('yl-desk-fail-slip.png',f'阿嬤的話期間 phase={st[0]} slip={st[1]} 黑={st[2]}')
    else:
      vis=pg.evaluate("Object.fromEntries(['t-breath','t-act','t-crouch','t-look','t-item','t-run','t-follow'].map(id=>[id,getComputedStyle(document.getElementById(id)).display!=='none']))")
      check('mob「回頭」鍵的字是「回頭」',pg.evaluate("document.getElementById('t-look').textContent")=='回頭',pg.evaluate("document.getElementById('t-look').textContent"))
      check('mob 手機鍵：念佛、互動、蹲、回頭顯示；道具、跑、喊人藏起來',vis['t-breath'] and vis['t-act'] and vis['t-crouch'] and vis['t-look'] and not(vis['t-item'] or vis['t-run'] or vis['t-follow']),vis)
      pg.evaluate(SETUP,[1,10.5,104])
      lk=pg.evaluate("""(()=>{const b=document.getElementById('t-look'),f0=KT.G.player.face;b.dispatchEvent(new Event('touchstart',{cancelable:true}));KT.step(27);const a=YL.lookingBack();KT.step(6);const c=YL.lookingBack(),fb=KT.G.player.face;
        b.dispatchEvent(new Event('touchend'));KT.step(2);return[a,c,fb,f0,KT.G.player.face,YL.lookingBack()]})()""")
      check('mob 按住「回頭」：手電筒朝正後方，0.45 秒 false、0.55 秒 true；放開回到原本方向',(not lk[0]) and lk[1] and abs(lk[2]-lk[3]-3.14159)<.01 and abs(lk[4]-lk[3])<1e-6 and not lk[5],lk)
      nf=pg.evaluate("""(()=>{const b=document.getElementById('t-breath');b.dispatchEvent(new Event('touchstart',{cancelable:true}));KT.step(1);const a=YL.trip.beads;KT.step(10);const c=YL.trip.beads;b.dispatchEvent(new Event('touchend'));KT.step(50);
        b.dispatchEvent(new Event('touchstart',{cancelable:true}));KT.step(1);const d=YL.trip.beads;b.dispatchEvent(new Event('touchend'));return[a,c,d]})()""")
      check('mob「念佛」鍵：按下那一刻扣一顆，按住不連扣，再按一次再扣',nf==[2,2,1],nf)
      pg.evaluate(SETUP,[1,9.6,49.2]);shot('yl-mob-s4.png','阿嬤的三合院前')
      # judge A1: a phone that stops is not looking back; stepping back to the mailbox with 背後叫名字 on is not a failure
      st=pg.evaluate("""(()=>{KT.manual=true;YLT.start(1,4242,2);YLT.force([]);const T=YL.trip;T.done.READ=true;T.phase='walk';YLT.place(10.5,100);KT.step(2);touchVec={x:-.7,y:.7};let any=0;for(let i=0;i<36;i++){KT.step(1);if(YL.lookingBack())any++}
        touchVec=null;for(let i=0;i<120;i++){KT.step(1);if(YL.lookingBack())any++}return[any,Math.abs(angDiff(KT.G.player.face,-Math.PI/2))*180/Math.PI]})()""")
      check('mob 往西南退 0.6 秒再停 2 秒：lookingBack 一直 false，視線回到前方',st[0]==0 and st[1]<1,st)
      dv=pg.evaluate("""(()=>{YLT.start(1,4242,2);YLT.force([{id:'y_call',seg:'S4'}]);const T=YL.trip;T.done.READ=T.done.BOW=true;T.phase='walk';YLT.place(10.5,50.5);KT.step(2);touchVec={x:0,y:-1};let n=0;while(KT.G.player.y/24>45.3&&n++<400)KT.step(1);
        touchVec=null;KT.step(6);touchVec={x:-.7,y:.7};KT.step(36);touchVec=null;const it=KT.interactTarget(),near=document.getElementById('t-act').classList.contains('ylnear');YL.hud(1/60);const near2=document.getElementById('t-act').classList.contains('ylnear');if(it)it.fn();KT.step(60);const s=YLT.state();return[it&&it.label,s.phase,s.fail&&s.fail.id,s.done.DELIVER,near2]})()""")
      check('mob 背後叫名字在 S4：走過信箱再退 0.6 秒投月曆不判回頭；靠近時「互動」鍵發亮',dv[0]=='投月曆' and dv[1]=='walk' and not dv[2] and dv[3] and dv[4],dv)
      hu=pg.evaluate("""(()=>{YLT.start(1,4242,1);YLT.force([]);KT.step(2);YL.hud(1/60);const h=document.querySelector('#ylhud .ylhint'),r=YL.cam(BW,BH),P=KT.G.player;
        YL.trip.hintAt=KT.G.t;YL.hud(1/60);const pulse=document.getElementById('t-breath').classList.contains('ylpulse');return[h&&h.textContent,+((P.y-r.y)/BH).toFixed(3),pulse]})()""")
      check('mob 開局提示「左半邊拖曳走路」、玩家在畫面高度 55%、念佛提示時「念佛」鍵閃',hu[0]=='左半邊拖曳走路' and abs(hu[1]-.55)<.01 and hu[2],hu)
      pg.evaluate("KT.manual=false")
      pg.evaluate("KT.manual=false;KT.toTitle()");pg.wait_for_timeout(300);pg.tap('#m-yelu');pg.wait_for_timeout(600)
      c=pg.evaluate("[YL.card&&YL.card.kind,KT.G.sceneId,document.body.className]");shot('yl-mob-nightcard.png',f'夜卡 card={c[0]}')
      check('mob 標題點「夜路」→ 夜卡開著、場景 yelu、body 有 yelu class',c[0]=='night' and c[1]=='yelu' and 'yelu' in c[2],c)
    check(f'{name} 沒有 pageerror、KT.err',not errs and not pg.evaluate('KT.err||null'),[errs,pg.evaluate('KT.err||null')])
    pg.close()
for n,ok,d in res:print('PASS' if ok else 'FAIL',n,'—',str(d)[:220])
print('PASS:',sum(1 for r in res if r[1]),'FAIL:',sum(1 for r in res if not r[1]))
