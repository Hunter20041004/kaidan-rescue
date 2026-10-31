import sys,json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]; js=open(sys.argv[2]).read()
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800})
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(800)
  res=pg.evaluate(js)
  for r in res: print('PASS' if r['ok'] else 'FAIL',r['name'],'—',str(r['detail'])[:int(__import__('os').environ.get('DETAIL','160'))])
  print('pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
