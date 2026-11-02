# 夜路 sound: python3 tests/yelu_audio.py <abs html>
# Audio is started the way tests/audio.py does it; createBiquadFilter/createGain are wrapped so the filters YL_SND.at builds can be read back.
#  6a a sound from behind you is low-passed lower than the same sound in front (and 0.7× as loud at the same distance)
#  6b YL_SND.hush(sec) brings the master gain to ≤ 0.001 within 30 ms of audio time, and back after sec
#  every named 夜路 sound plays without throwing
import sys
from playwright.sync_api import sync_playwright
res=[]
with sync_playwright() as p:
  b=p.chromium.launch(args=['--autoplay-policy=no-user-gesture-required']);pg=b.new_page();errs=[];pg.on('pageerror',lambda e:errs.append(str(e)))
  pg.goto('file://'+sys.argv[1]);pg.wait_for_timeout(500);pg.evaluate("KT.startGame(1,'yelu',{mod:'calm'})");pg.wait_for_timeout(1500)
  r=pg.evaluate("""(async()=>{await SND.ac.resume();const ac=SND.ac,log=[],f0=ac.createBiquadFilter.bind(ac),g0=ac.createGain.bind(ac);
    ac.createBiquadFilter=()=>{const n=f0();log.push({k:'f',n});return n};ac.createGain=()=>{const n=g0();log.push({k:'g',n});return n};
    const P=KT.G.player,tx=P.x/24,ty=P.y/24;
    const probe=(dy,o)=>{log.length=0;const played=YL_SND.at('muyu',tx,ty+dy,o);const lp=log.find(e=>e.k==='f'&&e.n.type==='lowpass'),g=log.find(e=>e.k==='g');return{played,freq:lp?lp.n.frequency.value:null,gain:g?+g.n.gain.value.toFixed(3):null}};
    const front=probe(-2.5),back=probe(2.5),backFlag=probe(-2.5,{behind:true}),side=probe(.3);
    ac.createBiquadFilter=f0;ac.createGain=g0;
    const names=['qing','muyu','pa','dong','paper','chain','gong','lingpai','radio','stepBehind','crack','call','puff','ash','creak','approach'],bad=[];
    for(const k of names){try{YL_SND[k]();YL_SND.at(k,tx,ty+2,{behind:true})}catch(e){bad.push(k+':'+e)}}
    for(const k of['girl','voice','step']){try{YL_SND.at(k,tx+3,ty-3)}catch(e){bad.push(k+':'+e)}}
    await new Promise(r=>setTimeout(r,300));
    const g=SND.out.gain,v0=g.value,wait=s=>new Promise(r=>{const t1=ac.currentTime+s;const tick=()=>ac.currentTime>=t1?r():setTimeout(tick,2);tick()});
    const t0=ac.currentTime;YL_SND.hush(.8);const trace=[];await new Promise(r=>{const tick=()=>{const t=ac.currentTime-t0;trace.push([t,g.value]);t>=.03?r():setTimeout(tick,1)};tick()});
    const hit=trace.find(([t,v])=>v<=.001),at30=hit&&hit[0]<=.03?hit[1]:1,dt=hit?hit[0]:-1,sil=KT.G.silence>KT.G.t;await wait(t0+.86-ac.currentTime);const back2=g.value,tb=ac.currentTime-t0;
    return{front,back,backFlag,side,bad,v0,at30,dt,sil,back2,tb}})()""")
  ok=r['front']['played'] and r['back']['played'] and r['back']['freq']<r['front']['freq'] and r['backFlag']['freq']<r['front']['freq'] and abs(r['back']['gain']/r['front']['gain']-.7)<.02
  res.append(('PASS' if ok else 'FAIL','驗收6a：背後的低通頻率 < 前方，音量 ×0.7',f"前方 2.5 格 {r['front']}；背後 2.5 格 {r['back']}；前方但標 behind {r['backFlag']}；側邊 {r['side']}"))
  res.append(('PASS' if r['at30']<=.001 and r['sil'] else 'FAIL','驗收6b：hush 在 30 ms 內把增益降到 ≤ 0.001，並設 G.silence',f"hush 前 {r['v0']:.3f} → 音訊時間 {r['dt']*1000:.1f} ms 時第一次讀到 {r['at30']:.5f}（讀值精度＝128 取樣的渲染區塊，約 2.7 ms）；G.silence>G.t={r['sil']}"))
  res.append(('PASS' if abs(r['back2']-r['v0'])<.01 else 'FAIL','hush 0.8 秒結束後 50 ms 內恢復原本音量',f"{r['tb']*1000:.0f} ms 時 {r['back2']:.3f}（原本 {r['v0']:.3f}）"))
  res.append(('PASS' if not r['bad'] else 'FAIL','夜路的每個聲音（含方位版本）都能播放、不出錯',f"錯誤 {r['bad'] or '無'}"))
  for x in res:print(x[0],x[1],'—',x[2])
  print('pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
