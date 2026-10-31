import sys
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]; SP=sys.argv[2]
with sync_playwright() as p:
  b=p.chromium.launch()
  for name,vp,touch in [('desk',{'width':1280,'height':800},False),('mob',{'width':375,'height':812},True)]:
    pg=b.new_page(viewport=vp,has_touch=touch,is_mobile=touch,device_scale_factor=(3 if touch else 1));errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
    pg.goto(URL);pg.wait_for_timeout(1500);pg.screenshot(path=f'{SP}/v4-{name}-title.png')
    pg.evaluate("""(()=>{KT.startGame(2024);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;G.dogs=[];const P=G.player;P.x=41.5*24;P.y=27*24;P.face=-Math.PI/2;KT.mouse.active=false;
      const t=KT.spawnMonster('tiger',{x:P.x-40,y:P.y-80});KT.UI.closeMeet();KT.setState(t,'chase');t.target=P;t.face=Math.PI/2;
      const k=KT.spawnMonster('kuchi',{x:P.x+44,y:P.y-110});KT.UI.closeMeet();KT.setState(k,'ask',99);k.target=P;k.face=Math.PI/2;
      const j=KT.spawnMonster('jiang',{x:P.x+5,y:P.y-160});KT.UI.closeMeet();j.face=Math.PI/2;KT.manual=true;for(const m of G.monsters)m.vis=1})()""")
    pg.wait_for_timeout(600);pg.screenshot(path=f'{SP}/v4-{name}-monsters.png')
    pg.evaluate("""(()=>{KT.manual=false;KT.startGame(77);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;const P=G.player;P.x=30*24;P.y=40*24;P.face=0;KT.mouse.active=false;KT.startApparition('girl');KT.UI.closeMeet();KT.manual=true;KT.step(30)})()""")
    pg.wait_for_timeout(500);pg.screenshot(path=f'{SP}/v4-{name}-girl.png')
    pg.evaluate("""(()=>{KT.manual=false;KT.startGame(78);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;const P=G.player;P.x=30*24;P.y=34.5*24;P.face=-Math.PI/2;KT.mouse.active=false;KT.startApparition('funeral');KT.UI.closeMeet();const A=G.apparition;A.road={axis:'x',c:32,a:2,b:81};A.dir=1;A.pos=P.x+60;A.end=81*24;KT.manual=true;KT.step(2)})()""")
    pg.wait_for_timeout(500);pg.screenshot(path=f'{SP}/v4-{name}-funeral.png')
    pg.evaluate("""(()=>{KT.manual=false;KT.startGame(91);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];const P=G.player;P.x=41.5*24;P.y=30.5*24;KT.spawnMonster('tiger',{x:P.x+30,y:P.y});KT.UI.closeMeet()})()""")
    pg.wait_for_timeout(3200);pg.screenshot(path=f'{SP}/v4-{name}-death.png')
    # capture lunge, frozen mid-rush / just after the hit / settled (KT.freezeLunge)
    pg.evaluate("""(()=>{KT.manual=false;KT.startGame(93);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;const P=G.player;P.x=41.5*24;P.y=30.5*24;P.face=0;KT.mouse.active=false;
      const t=KT.spawnMonster('tiger',{x:P.x+70,y:P.y});KT.UI.closeMeet();t.face=Math.PI;KT.manual=true;G.scare={type:'tiger',t:0}})()""")
    for a in ('0.3','0.45','0.6'):
      pg.evaluate(f"KT.freezeLunge({a})");pg.wait_for_timeout(250);pg.screenshot(path=f'{SP}/v4-{name}-lunge-{a}.png')
    pg.evaluate("KT.freezeLunge(null);KT.G.scare=null")
    # pause menu with the 驚嚇特寫 toggle; also report horizontal overflow
    pg.evaluate("(()=>{KT.manual=false;KT.startGame(94);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];KT.UI.closeMeet();KT.setPause(true)})()");pg.wait_for_timeout(500);pg.screenshot(path=f'{SP}/v4-{name}-pause.png')
    print(name,'overflow-x',pg.evaluate("[document.documentElement.scrollWidth,innerWidth,(()=>{const b=document.querySelector('#closeup').getBoundingClientRect();return [Math.round(b.left),Math.round(b.right),Math.round(b.top),Math.round(b.bottom),Math.round(b.height)]})()]"))
    pg.evaluate("KT.setPause(false)")
    pg.evaluate("KT.toTitle()");pg.evaluate("document.querySelector('#m-codex').click()");pg.wait_for_timeout(600);pg.screenshot(path=f'{SP}/v4-{name}-codex.png')
    print(name,errs,pg.evaluate('KT.err||null'))
