# Rough performance numbers: python3 tests/perf.py <abs html>
# Headless Chromium has no GPU (software canvas), so compare rounds against each other, not against real devices.
# Each draw() is followed by a 1-pixel getImageData so the deferred canvas work is really done before the clock stops.
import sys,json
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]
INIT="""window.__ft=[];(function r(t){window.__ft.push(t);if(t<4000)requestAnimationFrame(r)})(0);"""
JS="""(async()=>{KT.manual=true;const keep=window.catchHuman;window.catchHuman=function(){};KT.startGame(2024);const G=KT.G;G.schedule=[];G.events=[];G.apps=[];G.scareT=1e9;const P=G.player;P.x=41.5*24;P.y=30.5*24;P.face=-Math.PI/2;KT.mouse.active=false;
 for(const [t,dx,dy] of [['tiger',-60,-90],['kuchi',70,-110],['jiang',10,-170]]){KT.spawnMonster(t,{x:P.x+dx,y:P.y+dy});KT.UI.closeMeet()}
 const C=document.querySelector('canvas').getContext('2d'),FL=()=>C.getImageData(0,0,1,1);const st=a=>{const s=a.slice().sort((x,y)=>x-y);return{n:a.length,p50:+s[Math.floor(s.length*.5)].toFixed(1),p95:+s[Math.floor(s.length*.95)].toFixed(1),max:+s[s.length-1].toFixed(1)}};
 for(let i=0;i<60;i++){KT.update(1/60);KT.draw();FL()}
 const ft=[],ut=[];for(let i=0;i<300;i++){let a=performance.now();KT.update(1/60);ut.push(performance.now()-a);a=performance.now();KT.draw();FL();ft.push(performance.now()-a);if(i%30===0)await new Promise(r=>setTimeout(r,0))}
 G.scare={type:'tiger',t:0};const lt=[];for(let i=0;i<60;i++){KT.freezeLunge(i/60);const a=performance.now();KT.draw();FL();lt.push(performance.now()-a)}KT.freezeLunge(null);G.scare=null;window.catchHuman=keep;
 return {gameplay_draw:st(ft),update:st(ut),lunge_draw:st(lt),errors:(KT.err||[]).length}})()"""
with sync_playwright() as p:
  b=p.chromium.launch();bad=[]
  pg=b.new_page(viewport={'width':1280,'height':800});pg.add_init_script(INIT);errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto(URL);pg.wait_for_timeout(4300)
  w=pg.evaluate("""(()=>{const f=__ft.filter(t=>t>0),d=[];for(let i=1;i<f.length;i++)d.push([f[i],f[i]-f[i-1]]);const a=d.filter(x=>x[0]>=600&&x[0]<=3200).map(x=>x[1]).sort((x,y)=>x-y);
    return{n:a.length,p50:+a[Math.floor(a.length/2)].toFixed(1),max:+a[a.length-1].toFixed(1),over33:a.filter(x=>x>33.4).length}})()""")
  print('first 0.6–3.2 s after load (close-up pre-cache), frame interval ms:',json.dumps(w))
  pg.evaluate(JS);r=pg.evaluate(JS)  # second pass is warm
  print('3 monsters, ms per frame:',json.dumps(r))
  if w['over33']:bad.append('frames over 33 ms during pre-cache')
  print('page errors',errs,'warnings',bad)
