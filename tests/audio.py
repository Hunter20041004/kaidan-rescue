# Recorded sounds: python3 tests/audio.py <abs html> — every clip decodes and plays, the night beds start, nothing throws
import sys
from playwright.sync_api import sync_playwright
with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('file://'+sys.argv[1]);pg.wait_for_timeout(500);pg.evaluate("KT.startGame(5);KT.UI.closeMeet()");pg.wait_for_timeout(2500)
  r=pg.evaluate("""(async()=>{await SND.ac.resume();const names=Object.keys(SFX_DATA);const loaded=names.filter(k=>SND.buf[k]),played=names.filter(k=>SND.sfx(k,{gain:0}));
    SND.bang();SND.step(true,true);SND.heart(.5);SND.knock();SND.door();SND.gasp();for(let i=0;i<120;i++)SND.music(1/60);return {total:names.length,loaded:loaded.length,played:played.length,beds:Object.keys(SND.beds).length}})()""")
  ok=r['total']>=17 and r['loaded']==r['total'] and r['played']==r['total'] and r['beds']==3
  print('PASS' if ok else 'FAIL','錄音全部解碼、可播放，三層環境音啟動 —',r,'pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
