import sys,json,time
from playwright.sync_api import sync_playwright
URL='file://'+sys.argv[1]; N=int(sys.argv[2]); MIN=float(sys.argv[3])
JS="""(async([seed,minutes])=>{KT.manual=true;KT.startGame(seed);const G=KT.G;window.kill=function(h,m){if(h.isPlayer){h.x=tc(41);h.y=tc(50);return}h.dead=true;h.killer=m.def.name};let r=seed*9301+49297;const R=()=>{r=(r*9301+49297)%233280;return r/233280};
 const K=['KeyW','KeyA','KeyS','KeyD','ShiftLeft','Space'];const total=Math.round(minutes*60*60);let i=0;
 for(;i<total&&!G.over;i++){if(i%30===0){for(const k of K)KT.keys[k]=R()<(k==='Space'?.15:k==='ShiftLeft'?.2:.35);
   const P=G.player;if((P.lured||P.drown))P.mash=(P.mash||0)+(R()<.3?1:0);
   const x=R();if(x<.08&&G.map[Math.floor(P.y/24)][Math.floor(P.x/24)]!=='x')KT.interact();else if(x<.11)KT.useSel();else if(x<.13)KT.toggleFollow();else if(x<.15)P.crouch=!P.crouch;else if(x<.17)G.sel=Math.floor(R()*5);
   KT.mouse.active=R()<.5;KT.mouse.x=P.x+(R()-.5)*300;KT.mouse.y=P.y+(R()-.5)*300;KT.mouse.fx=undefined}
  if(!$('#meet').hidden)KT.UI.closeMeet();KT.update(1/60);if(i%600===0){KT.draw();await new Promise(r=>setTimeout(r,0))}}
 for(const k in KT.keys)KT.keys[k]=false;
 return {seed,over:G.over||'running',t:Math.round(G.t),saved:G.saved,mons:Object.keys(G.seen).join(','),mod:G.mod.id,logs:G.log.length,tags:[...new Set(G.log.map(l=>l.tag))].join(',')}})"""
with sync_playwright() as p:
  b=p.chromium.launch();pg=b.new_page(viewport={'width':1280,'height':800});errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.on('console',lambda m:m.type=='error' and errs.append(m.text))
  pg.goto(URL);pg.wait_for_timeout(700);t0=time.time();res=[]
  for s in range(1,N+1):
    out=pg.evaluate(JS,[s*7919,MIN]);res.append(out);print(json.dumps(out,ensure_ascii=False),flush=True)
  ends={};[ends.__setitem__(r['over'],ends.get(r['over'],0)+1) for r in res]
  print('ENDINGS',ends,'errors',errs,'KT.err',pg.evaluate('KT.err||null'),'secs',round(time.time()-t0))
