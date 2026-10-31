# Turn the raw CC0 recordings into the game's sound set: python3 tools/make_audio.py <raw dir>
# One-shots are cut into hits (onsets on the loudness curve); beds become fade-in/fade-out loops the game overlaps.
# Writes audio/<name>.mp3 (mono) and audio/sfx.json ({name: {segs:[[start,dur],...], loop:bool}}); build.sh embeds them.
import sys,os,json,subprocess
import numpy as np
RAW=sys.argv[1];OUT=os.path.join(os.path.dirname(__file__),'..','audio');os.makedirs(OUT,exist_ok=True);SR=44100
def load(n):
  pcm=subprocess.run(['ffmpeg','-v','error','-i',f'{RAW}/{n}.mp3','-ac','1','-ar',str(SR),'-f','f32le','-'],capture_output=True,check=True).stdout
  return np.frombuffer(pcm,dtype=np.float32)
def onsets(x,thr=.35,gap=.18,pre=.02,length=.35,maxn=8,t0=0,t1=None):
  hop=int(SR*.01);env=np.sqrt(np.convolve(x**2,np.ones(hop)/hop,'same'))[::hop];a,b=int(t0*100),int((t1 or len(x)/SR)*100);env=env[a:b]
  peaks=[];last=-1e9;lim=thr*env.max()
  for i in range(1,len(env)-1):
    if env[i]>=lim and env[i]>=env[i-1] and env[i]>=env[i+1] and (i-last)*.01>=gap:peaks.append(i);last=i
  return [max(0,(a+p)*.01-pre) for p in peaks][:maxn]
def write(name,x,bitrate):
  p=subprocess.run(['ffmpeg','-v','error','-y','-f','f32le','-ar',str(SR),'-ac','1','-i','-','-c:a','libmp3lame','-b:a',bitrate,f'{OUT}/{name}.mp3'],input=x.astype(np.float32).tobytes(),check=True)
def norm(x,peak=.89):m=np.abs(x).max();return x*(peak/m) if m>0 else x
def fade(x,fi,fo):
  x=x.copy();n,m=int(fi*SR),int(fo*SR)
  if n:x[:n]*=np.linspace(0,1,n)
  if m:x[-m:]*=np.linspace(1,0,m)
  return x
SPEC={}
def hits(name,src,length,**kw):
  x=load(src);st=onsets(x,length=length,**kw);segs=[];parts=[];pos=0
  for s in st:
    c=fade(x[int(s*SR):int((s+length)*SR)],.004,min(.08,length/3));parts.append(c);parts.append(np.zeros(int(.05*SR),np.float32));segs.append([round(pos,3),round(len(c)/SR,3)]);pos+=len(c)/SR+.05
  write(name,norm(np.concatenate(parts)),'64k');SPEC[name]={'segs':segs,'src':src}
def clip(name,src,t0,t1,fi=.005,fo=.15,bitrate='64k'):
  x=load(src)[int(t0*SR):int(t1*SR)];write(name,norm(fade(x,fi,fo)),bitrate);SPEC[name]={'segs':[[0,round(t1-t0,3)]],'src':src}
def bed(name,src,t0,dur,xf=2.0):
  x=load(src)[int(t0*SR):int((t0+dur)*SR)];write(name,norm(fade(x,xf,xf),.7),'40k');SPEC[name]={'segs':[[0,dur]],'loop':True,'xf':xf,'src':src}
hits('bark','2352',.32,thr=.4,gap=.25,maxn=6);clip('bark_far','0288',0,3.2)
hits('step','0510',.22,thr=.3,gap=.3,maxn=8);hits('grass','1024',.3,thr=.45,gap=.35,maxn=8,t0=2,t1=30)
hits('heart','0218',.5,thr=.5,gap=.6,maxn=3)
clip('closet','0305',0,1.6);clip('creak','3205',0,3.2);clip('knock','0374',0,1.05)
hits('cracker','0919',.3,thr=.3,gap=1,maxn=5) # single cracks, 3 s apart in the take; the game fires them as a string
clip('bell','0135',0,7.5,fo=1.5);clip('gasp','1103',.77,2.0);clip('scream','1662',.07,2.4);clip('coop','0282',2,5.2);clip('owl','1764',.15,.98)
bed('insects','1470',20,32);bed('frogs','0998',30,32);bed('wind','0659',10,32)
json.dump(SPEC,open(f'{OUT}/sfx.json','w'),ensure_ascii=False,indent=1)
print({k:(len(v['segs']),round(os.path.getsize(f'{OUT}/{k}.mp3')/1024)) for k,v in SPEC.items()})
print('total KB',round(sum(os.path.getsize(f'{OUT}/{k}.mp3') for k in SPEC)/1024))
