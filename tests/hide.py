# Hiding as a gamble: python3 tests/hide.py <abs html> [screenshot dir]
# Seen hiding → the monster comes for that spot; unseen → only your breath gives you away.
import sys,json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1];OUT=sys.argv[2] if len(sys.argv)>2 else None;res=[]
def check(name,ok,detail=''):res.append((name,bool(ok),detail))
SETUP="""([type,dx,hold,seen])=>{KT.manual=true;KT.startGame(77);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;G.siegeAt=1e9;G.dogs=[];
  for(const h of G.humans)if(!h.isPlayer){h.saved=true}KT.UI.closeMeet();
  const s=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);const P=G.player;P.x=s.x;P.y=s.y+26;
  let at={x:s.x+dx,y:s.y+26};if(dx<50)for(const[ox,oy]of[[40,0],[-40,0],[0,40],[30,30],[-30,30],[0,-30],[50,10],[-50,10]]){const x=P.x+ox,y=P.y+oy;if(humanPass(Math.floor(x/24),Math.floor(y/24))&&los(x,y,P.x,P.y)){at={x,y};break}}
  const m=KT.spawnMonster(type,at);KT.UI.closeMeet();m.face=Math.atan2(P.y-m.y,P.x-m.x);KT.setState(m,'patrol');m.goal={x:m.x,y:m.y};m.cool.acq=0;
  if(!seen){m.x=s.x+14*24;m.y=s.y}
  KT.step(1);KT.hideIn(s);window.__s=s;window.__m=m;
  for(let i=0;i<60*9&&!G.over;i++){KT.keys.Space=hold&&G.player.breath>.2;KT.update(1/60)}KT.keys.Space=false;
  return {dead:!!G.player.dead,spot:!!G.player.spot,state:m.state,log:G.log.slice(-4).map(l=>l.text)}}"""
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(800)
  r=pg.evaluate(SETUP,['jiang',70,False,True]);check('殭屍看見你躲進衣櫃，在門外聽；你沒屏息就被抓',r['dead'],r)
  r=pg.evaluate(SETUP,['jiang',70,True,True]);check('殭屍在門外聽，你屏住呼吸撐過去就沒事',not r['dead'] and any('跳走' in l for l in r['log']),r)
  r=pg.evaluate(SETUP,['kuchi',40,False,True]);check('裂口女看見你躲進去：打不開，守在外面，你躲著就沒事',not r['dead'] and r['spot'] and any('裂口女看見了' in l for l in r['log']),r)
  r=pg.evaluate(SETUP.replace('for(let i=0;i<60*9','for(let i=0;i<60*3'),['kuchi',40,False,True]);check('裂口女守在門外（camp）',r['state']=='camp',r)
  r=pg.evaluate(SETUP,['tiger',90,True,True]);check('虎姑婆看見你躲進去：嗅很久，屏息也撐不過',r['dead'],r)
  r=pg.evaluate(SETUP,['tiger',90,True,False]);check('沒被看見：虎姑婆路過也不會特地來敲',not r['dead'],r)
  r=pg.evaluate(SETUP,['kuchi',90,False,False]);check('沒被看見：裂口女不會守在外面',not r['dead'] and r['state']!='camp',r)
  # an unseen hider is still checked by a searching zombie that passes close
  r=pg.evaluate("""(()=>{KT.manual=true;KT.startGame(78);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;G.siegeAt=1e9;G.dogs=[];for(const h of G.humans)if(!h.isPlayer)h.saved=true;KT.UI.closeMeet();
    const s=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);const P=G.player;P.x=s.x;P.y=s.y+26;KT.hideIn(s);
    const m=KT.spawnMonster('jiang',{x:s.x+40,y:s.y+26});KT.UI.closeMeet();KT.setState(m,'search',3);KT.step(10);return {state:m.state}})()""")
  check('沒被看見：殭屍搜查時經過衣櫃也會停下來聽',r['state']=='listen',r)
  # the view from inside: the gap in the door closes in as a monster gets near
  if OUT:
    pg.evaluate("""(()=>{KT.manual=true;KT.startGame(77);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;G.siegeAt=1e9;G.dogs=[];KT.UI.closeMeet();
      const s=G.spots.find(s=>s.type==='cabinet'&&!s.occ.length);const P=G.player;P.x=s.x;P.y=s.y+26;KT.hideIn(s);
      const m=KT.spawnMonster('tiger',{x:s.x+50,y:s.y+30});KT.UI.closeMeet();KT.setState(m,'knock');m.spot=s;KT.step(40);KT.draw()})()""")
    pg.wait_for_timeout(300);pg.screenshot(path=OUT+'/hide-knock.png')
  for n,ok,d in res:print('PASS' if ok else 'FAIL',n,'—',json.dumps(d,ensure_ascii=False)[:220])
  print('PASS:',sum(1 for r in res if r[1]),'FAIL:',sum(1 for r in res if not r[1]),'pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
