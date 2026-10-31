import sys,json,time
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]; SP=sys.argv[2]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(800)
  for l in pg.evaluate(open(__import__('os').path.join(__import__('os').path.dirname(__import__('os').path.abspath(__file__)),'tut.js')).read()):print(' ',l)
  pg.evaluate("KT.manual=false");pg.wait_for_timeout(500);pg.screenshot(path=SP+'/desk-tutend.png')
  # pause
  pg.evaluate("KT.manual=false;KT.startGame(5)");pg.wait_for_timeout(300);pg.keyboard.press('Escape');t1=pg.evaluate("KT.G.t");pg.wait_for_timeout(500);t2=pg.evaluate("KT.G.t");
  pg.screenshot(path=SP+'/desk-pause.png');pg.keyboard.press('Escape');pg.wait_for_timeout(400);t3=pg.evaluate("KT.G.t")
  print('pause holds time:',t1==t2,'resumes:',t3>t2)
  # real keyboard: move & crouch & item cycle
  pg.mouse.move(700,300);pg.keyboard.down('KeyW');pg.wait_for_timeout(600);pg.keyboard.up('KeyW');y=pg.evaluate("KT.G.player.y");pg.keyboard.press('KeyC');c=pg.evaluate("KT.G.player.crouch");pg.keyboard.press('Digit5');s=pg.evaluate("KT.G.sel")
  print('moved y<',y,'crouch',c,'sel',s)
  print('errors',errs,pg.evaluate('KT.err||null'))
