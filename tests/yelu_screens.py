# 夜路 pictures: python3 tests/yelu_screens.py <abs html> <out dir>
# Stages each scene with tests/yelu_art.js (window.YLS), saves the screenshots W3 owes (§9.4), and measures:
#  2 the 第二夜 y_ghostwed doorway is pixel-identical to 第一夜's normal wedding doorway (same camera, same crop)
#  4 everything more than 1.5 tiles south of you is ≤ 6% mean luminance, torch turned round to face it
#  7 on a 375×812 phone the HUD, 阿嬤的話 and the night card neither overflow sideways nor use text under 14 px
# It also lays the new 夜路 props beside the old mode's nearest relatives (yl-art-vs-old.png) and, when tests/screens.py
# has already written its v4-*-girl.png, the old and new red-dress girl side by side.
import sys,os,base64,io
from playwright.sync_api import sync_playwright
from PIL import Image
import numpy as np
HTML=sys.argv[1];URL='file://'+HTML;SP=sys.argv[2];os.makedirs(SP,exist_ok=True)
STAGE=open(os.path.join(os.path.dirname(__file__),'yelu_art.js'),encoding='utf-8').read()
res=[];ok=lambda name,cond,detail:res.append(('PASS' if cond else 'FAIL',name,detail))
def lum(img):a=np.asarray(img.convert('RGB')).astype(float)/255;return float((a[...,0]*.2126+a[...,1]*.7152+a[...,2]*.0722).mean())
def page(b,mob,rm=False):
  vp={'width':375,'height':812} if mob else {'width':1280,'height':800}
  pg=b.new_page(viewport=vp,has_touch=mob,is_mobile=mob,device_scale_factor=(3 if mob else 1),reduced_motion=('reduce' if rm else 'no-preference'))
  errs=[];pg.on('pageerror',lambda e:errs.append(str(e)));pg.goto(URL);pg.wait_for_timeout(900)
  pg.evaluate("window.YL_STAGE_ONLY=true");pg.evaluate(STAGE);return pg,errs
def scene(pg,js):pg.evaluate("(()=>{"+js+";YLS.frames(4)})()");pg.wait_for_timeout(250)
def save(pg,name):pg.screenshot(path=f'{SP}/{name}')
FREEZE="KT.G.t=100;YLS.ctx.t=40;"
with sync_playwright() as p:
  b=p.chromium.launch()
  for tag,mob in(('desk',False),('mob',True)):
    pg,errs=page(b,mob,rm=True)
    # 紅衣小女孩 under the mirror, first night
    scene(pg,"YLS.setup(1);YLS.anom('y_girl',{x:12.5,y:22.5});YLS.place(10.5,26.2);"+FREEZE);save(pg,f'yl-{tag}-girl.png')
    # the wedding doorway: 第一夜 normal vs 第二夜 y_ghostwed, same camera, same moment
    crops=[]
    for n,anom in((1,''),(2,"YLS.anom('y_ghostwed',{x:7,y:44.5,data:{}});")):
      scene(pg,f"YLS.setup({n});YLS.set('door4','wedding');{anom}YLS.place(10.2,50.5,-2.3);"+FREEZE);save(pg,f'yl-{tag}-wedding-n{n}.png')
      box=pg.evaluate("(()=>{const r=cv.getBoundingClientRect(),z=CAM.z,x0=(3*24-Math.round(CAM.x))*z,y0=(41*24-Math.round(CAM.y))*z,x1=(10*24-Math.round(CAM.x))*z,y1=(49.5*24-Math.round(CAM.y))*z;return[r.left+Math.max(0,x0),r.top+Math.max(0,y0),r.left+Math.min(r.width,x1),r.top+Math.min(r.height,y1)]})()")
      pg.evaluate("for(const s of['#hud','#touch','#ylhud'])document.querySelector(s).style.visibility='hidden'");pg.wait_for_timeout(120);pg.screenshot(path=f'{SP}/yl-{tag}-wedding-n{n}-measure.png')
      pg.evaluate("for(const s of['#hud','#touch','#ylhud'])document.querySelector(s).style.visibility=''")
      img=Image.open(f'{SP}/yl-{tag}-wedding-n{n}-measure.png');dpr=3 if mob else 1;crops.append(np.asarray(img.crop(tuple(int(round(v*dpr)) for v in box)).convert('RGB')).astype(int))
    d=int((np.abs(crops[0]-crops[1]).sum(axis=2)>0).sum()) if crops[0].shape==crops[1].shape else -1
    ok(f'驗收2 {tag}：第二夜 y_ghostwed 門口與第一夜正常門口逐像素相同',d==0,f'裁切 {crops[0].shape[1]}×{crops[0].shape[0]} px，差異像素 {d}（HUD 的月曆本來就不同，量的時候先隱藏），平均亮度 {crops[0].mean()/255*100:.1f}%')
    # 七爺八爺 coming down the road; you crouch on the shoulder
    scene(pg,"YLS.setup(3);YLS.anom('y_lords',{data:{alpha:1,members:[{kind:'qiye',x:10.5,y:85.2},{kind:'baye',x:10.5,y:83.7}]}});YLS.place(12.7,88.6);KT.G.player.crouch=true;"+FREEZE);save(pg,f'yl-{tag}-lords.png')
    # the shrine on the first night, the 靈堂 at the end of the road (for the art review)
    if not mob:
      scene(pg,"YLS.setup(1);YLS.place(10.5,69.2);"+FREEZE);save(pg,'yl-desk-shrine.png')
      scene(pg,"YLS.setup(1);YLS.place(10.5,10.4);YLS.push=40;"+FREEZE);save(pg,'yl-desk-tent.png');pg.evaluate("YLS.push=0")
    # the torch turned round: behind you stays black
    scene(pg,"YLS.setup(1);YLS.place(10.5,60.5,Math.PI/2);"+FREEZE);save(pg,f'yl-{tag}-back.png')
    pg.evaluate("for(const s of['#hud','#touch','#ylhud'])document.querySelector(s).style.visibility='hidden'");pg.wait_for_timeout(120)
    y0=pg.evaluate("(()=>{const r=cv.getBoundingClientRect(),P=KT.G.player;return[r.top+(P.y+1.5*24-Math.round(CAM.y))*CAM.z,r.left,r.right,r.bottom]})()")
    pg.screenshot(path=f'{SP}/yl-{tag}-back-measure.png');pg.evaluate("for(const s of['#hud','#touch','#ylhud'])document.querySelector(s).style.visibility=''")
    img=Image.open(f'{SP}/yl-{tag}-back-measure.png');dpr=3 if mob else 1;reg=img.crop((int(y0[1]*dpr),int(np.ceil(y0[0]*dpr)),int(y0[2]*dpr),int(y0[3]*dpr)));m=lum(reg)
    ok(f'驗收4 {tag}：手電筒轉到背後，玩家南方 1.5 格以外平均亮度 ≤ 6%',m<=.06,f'區域 {reg.size[0]}×{reg.size[1]} px（HUD 與觸控鍵暫時隱藏），平均亮度 {m*100:.2f}%')
    # HUD, 阿嬤的話, the night card
    scene(pg,"YLS.setup(1);YLS.hint='first';YLS.place(10.5,112);"+FREEZE+"YL.hud(1/60)");pg.wait_for_timeout(200);save(pg,f'yl-{tag}-hud.png')
    def fit(sel):return pg.evaluate("""(sel=>{const root=document.querySelector(sel),W=innerWidth,bad=[];let minF=99,n=0;if(!root||root.hidden)return{missing:true};
      for(const e of root.querySelectorAll('*')){const cs=getComputedStyle(e);if(cs.display==='none'||cs.visibility==='hidden')continue;const r=e.getBoundingClientRect();if(r.width&&(r.left<-.5||r.right>W+.5))bad.push(e.className||e.tagName);if(e.scrollWidth>e.clientWidth+1&&cs.overflowX!=='visible')bad.push('scroll:'+(e.className||e.tagName));
        if([...e.childNodes].some(t=>t.nodeType===3&&t.textContent.trim())){n++;minF=Math.min(minF,parseFloat(cs.fontSize))}}
      return{bad,minF,n,doc:[document.documentElement.scrollWidth,innerWidth]}})(arguments[0])""".replace('arguments[0]',repr(sel)))
    h=fit('#ylhud')
    scene(pg,"YLS.setup(2);YLS.trip.phase='fail';"+FREEZE+"YL_UI.slip('今天月曆寫忌祭祀，今晚別拜。','今仔日忌祭祀，今暗莫拜。',1000,()=>{})");pg.evaluate("document.querySelector('#hud').hidden=true");pg.wait_for_timeout(600);save(pg,f'yl-{tag}-slip.png');s=fit('#ylslip')
    pg.evaluate("YL_UI.slip()");scene(pg,"YLS.setup(2);YL_UI.card('night',{n:2,cal:{yi:[],ji:['祭祀','嫁娶']}},()=>{})");pg.wait_for_timeout(700);save(pg,f'yl-{tag}-nightcard.png');c=fit('#ylcard')
    pg.evaluate("YL_UI.card()");scene(pg,"YL_UI.card('end',{nights:[{n:1,trips:2,fails:[1],secs:74},{n:2,trips:4,fails:[1,2,3],secs:151},{n:3,trips:3,fails:[1,2],secs:133}]},()=>{})");pg.wait_for_timeout(700);save(pg,f'yl-{tag}-endcard.png');e=fit('#ylcard')
    pg.evaluate("YL_UI.card()");scene(pg,"YL_UI.card('dawn',{n:1},()=>{})");pg.wait_for_timeout(1100);save(pg,f'yl-{tag}-dawn.png');pg.evaluate("YL_UI.card()")
    if mob:
      for nm,r in(('HUD',h),('阿嬤的話',s),('夜卡',c),('結束卡',e)):
        ok(f'驗收7 mob：{nm}沒有水平溢出、文字 ≥ 14 px',not r.get('missing') and not r['bad'] and r['minF']>=14 and r['doc'][0]<=r['doc'][1],str(r))
    print(tag,'pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
    pg.close()
  # close-up lunges for the two faces only 夜路 adds as failures: the bride and the tiger, frozen at 0.3/0.45/0.6 s
  pg,errs=page(b,False)
  scene(pg,"YLS.setup(2);YLS.place(10.5,49);"+FREEZE)
  for face in('bride','tiger'):
    pg.evaluate(f"KT.G.flash={{type:'{face}',at:0}}")
    for a in('0.3','0.45','0.6'):pg.evaluate(f"KT.freezeLunge({a})");pg.wait_for_timeout(250);save(pg,f'yl-desk-lunge-{face}-{a}.png')
    pg.evaluate("KT.freezeLunge(null);KT.G.flash=null")
  # the art sheet: every fixture, normal beside abnormal, at 4×; then the old mode's nearest relatives beside the new ones
  sheet=pg.evaluate("""(()=>{const S=YLS,G=KT.G,K=4,pad=10,cells=[];S.place(10.5,26);G.t=100;
    // frame each drawing by its own painted pixels, two pixels of margin (w,h are only a lower bound)
    const grab=(fn,wx,wy,w,h,lbl)=>{const d=S.solo(fn,wx,wy);let x0=BW,y0=BH,x1=-1,y1=-1;for(let y=0;y<BH;y++)for(let x=0;x<BW;x++)if(d[(y*BW+x)*4+3]){if(x<x0)x0=x;if(x>x1)x1=x;if(y<y0)y0=y;if(y>y1)y1=y}
      if(x1<0){x0=y0=0;x1=y1=1}x0-=2;y0-=2;x1+=2;y1+=2;const cw=Math.max(x1-x0+1,Math.min(w,24)),ch=y1-y0+1,c=document.createElement('canvas');c.width=cw;c.height=ch;const t=document.createElement('canvas');t.width=BW;t.height=BH;t.getContext('2d').putImageData(new ImageData(d,BW,BH),0,0);
      c.getContext('2d').drawImage(t,x0,y0,cw,ch,0,0,cw,ch);cells.push({c,lbl});};
    const F=k=>S.fix.find(f=>f.kind===k),fx=(k,v,w,h,dy)=>{const f=F(k);grab(()=>{const o=f.variant;f.variant=v;YL_ART.fixture(f,S.ctx);f.variant=o},f.x*24,f.y*24+(dy||0),w,h,k+'：'+v)};
    const rows=[[['shrine','normal',40,48],['shrine','turned',40,48],['lamp','off',30,62],['lamp','lit',30,62],['mirror','normal',24,54],['mirror','extra',24,54]],
      [['door4','plain',64,40,-6],['door4','wedding',64,56,4],['ama','normal',26,30],['ama','tail',26,30],['mailbox','normal',16,32],['candle','normal',14,18]],
      [['truckbed','normal',22,30],['sign','normal',32,36],['pole','normal',14,62,8],['pole','transformer',14,62,8],['lintel','redpaper',12,10,-24]]];
    const out=[];for(const r of rows){cells.length=0;for(const[k,v,w,h,dy]of r)fx(k,v,w,h,dy);out.push(cells.slice())}
    cells.length=0;grab(()=>YL_ART.anom({id:'y_girl',x:10.5,y:30,state:'active',verdict:'pending',data:{alpha:1}},S.ctx),10.5*24,30*24,20,26,'y_girl');
    grab(()=>YL_ART.anom({id:'y_lords',state:'active',verdict:'pending',data:{alpha:1,members:[{kind:'qiye',x:10.5,y:31.5},{kind:'baye',x:10.5,y:30}]}},S.ctx),10.5*24,31*24,30,72,'y_lords');
    S.set('lamp','lit');{const f=F('lamp');grab(()=>{YL_ART.fixture(f,S.ctx);YL_ART.anom({id:'y_lamp',x:f.x,y:f.y,state:'active',verdict:'pending',data:{}},S.ctx)},f.x*24,f.y*24,40,62,'y_lamp（燈＋影子）')}S.set('lamp','off');
    grab(()=>YL_ART.po({x:10.5,y:30}),10.5*24,30*24,18,28,'魄');
    {const f=F('shrine');S.trip.phase='fail';S.trip.fail={id:'y_turned',t:0};S.ctx.t=1;grab(()=>YL_ART.fixture(f,S.ctx),f.x*24,f.y*24,40,48,'shrine：背對失敗時（燈熄、神像不轉）');const m=F('mirror');S.trip.fail={id:'y_mirror',t:0};grab(()=>YL_ART.fixture(m,S.ctx),m.x*24,m.y*24,24,50,'mirror：失敗時裂開');S.trip.phase='walk';S.trip.fail=null}
    out.push(cells.slice());cells.length=0;{const f=F('tent');grab(()=>YL_ART.fixture(f,S.ctx),f.x*24,f.y*24-20,224,180,'tent：靈堂')}out.push(cells.slice());
    // old mode, same kind of thing, same scale
    cells.length=0;const at=(spr,lbl,w,h)=>grab(()=>blit(spr,0,0),0,0,w,h,lbl);
    at(PROP.U(),'舊：路邊土地公',40,48);
    grab(()=>drawLampPx({x:-5,y:-18,tx:0,ty:0,broken:false,dead:false,ph:0}),0,0,30,62,'舊：路燈（亮）');
    at(lanternSprite(),'舊：廟燈籠',14,16);at(humanSprite({name:'阿嬤舊',elder:true,shirt:'#7a6a8a',hair:'bun'},'d',0,false),'舊：老村民',18,28);
    {const p=wallParts('D')[1];grab(()=>bx.drawImage(p,-12,-28),0,0,30,34,'舊：門（D）')}at(truckSprite(),'舊：貨車',52,70);at(DSPR.shopsign(),'舊：雜貨店招牌',50,16);at(treeSprite(5),'舊：樹',48,54);
    at(altarSprite(),'舊：神桌',52,34);at(apparitionSprite('mourn',1),'舊：送葬者',16,28);out.push(cells.slice());
    const W=Math.max(...out.map(r=>r.reduce((a,c)=>a+Math.max(c.c.width*K,c.lbl.length*15+6)+pad,pad))),H=out.reduce((a,r)=>a+Math.max(...r.map(c=>c.c.height))*K+pad+26,pad);
    const sh=document.createElement('canvas');sh.width=W;sh.height=H;const g=sh.getContext('2d');g.fillStyle='#1b1e20';g.fillRect(0,0,W,H);g.imageSmoothingEnabled=false;let y=pad;
    for(const r of out){let x=pad;const rh=Math.max(...r.map(c=>c.c.height))*K;for(const{c,lbl}of r){g.fillStyle='#24282b';g.fillRect(x,y,c.width*K,rh);g.drawImage(c,x,y+rh-c.height*K,c.width*K,c.height*K);g.fillStyle='#dcefea';g.font='14px "Noto Sans TC",sans-serif';g.fillText(lbl,x,y+rh+18);x+=Math.max(c.width*K,g.measureText(lbl).width+6)+pad}y+=rh+pad+26}
    return sh.toDataURL()})()""")
  open(f'{SP}/yl-art-sheet.png','wb').write(base64.b64decode(sheet.split(',')[1]))
  print('desk pageerrors',errs,'KT.err',pg.evaluate('KT.err||null'))
  b.close()
# old and new side by side where tests/screens.py left its pictures
for old,new,out in((f'{SP}/v4-desk-girl.png',f'{SP}/yl-desk-girl.png',f'{SP}/yl-cmp-girl.png'),(f'{SP}/v4-desk-funeral.png',f'{SP}/yl-desk-lords.png',f'{SP}/yl-cmp-procession.png')):
  if os.path.exists(old) and os.path.exists(new):
    a,c=Image.open(old),Image.open(new);s=Image.new('RGB',(a.width+c.width+10,max(a.height,c.height)),(20,22,24));s.paste(a,(0,0));s.paste(c,(a.width+10,0));s.save(out)
for r in res:print(*r[:2],'—',r[2])
print('PASS' if all(r[0]=='PASS' for r in res) else 'FAIL','夜路 screens',f'{sum(r[0]=="PASS" for r in res)}/{len(res)}')
