# Print the sound set as one JS constant for build.sh: SFX_DATA = {name: {src: data URL, segs, loop, xf}}
import json,base64,os
D=os.path.join(os.path.dirname(__file__),'..','audio');spec=json.load(open(f'{D}/sfx.json'))
out={k:{'src':'data:audio/mpeg;base64,'+base64.b64encode(open(f'{D}/{k}.mp3','rb').read()).decode(),'segs':v['segs'],**({'loop':1,'xf':v['xf']} if v.get('loop') else {})} for k,v in spec.items()}
print('const SFX_DATA='+json.dumps(out,separators=(',',':'))+';')
