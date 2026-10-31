# 驚嚇特寫 setting survives a page reload: python3 tests/reload.py <abs html>
import sys
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(600);pg.evaluate("localStorage.removeItem('kaidan-closeup')");pg.reload();pg.wait_for_timeout(600)
  lab=lambda:pg.evaluate("(()=>{KT.manual=true;KT.startGame(5);KT.UI.closeMeet();KT.setPause(true);const t=document.querySelector('#closeup').textContent;KT.setPause(false);return t})()")
  a=lab();pg.evaluate("KT.toggleCloseup()");pg.reload();pg.wait_for_timeout(600);b2=lab();pg.evaluate("KT.toggleCloseup()");pg.reload();pg.wait_for_timeout(600);c=lab()
  ok=('開' in a) and ('關' in b2) and ('開' in c) and not errs
  print('PASS' if ok else 'FAIL','驚嚇特寫設定重新整理後仍保留 —',a,'→ toggle+reload →',b2,'→ toggle+reload →',c,'errors',errs)
