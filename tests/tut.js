(()=>{const TS=24,L=[];KT.manual=true;KT.startGame(1,'tutorial');const G=KT.G,P=G.player,T=KT.TUT;const at=()=>T.i;
const walk=(tx,ty,max)=>{for(let i=0;i<(max||900);i++){const dx=tx*TS-P.x,dy=ty*TS-P.y;KT.keys.KeyD=dx>3;KT.keys.KeyA=dx<-3;KT.keys.KeyS=dy>3;KT.keys.KeyW=dy<-3;if(Math.abs(dx)<4&&Math.abs(dy)<4)break;KT.step(1)}for(const k of['KeyW','KeyA','KeyS','KeyD'])KT.keys[k]=false};
L.push('start '+at());walk(4,13.5);KT.step(2);L.push('road→'+at());
walk(11.5,12.9);KT.step(2);L.push('firecracker→'+at()+' inv='+G.inv.firecracker);
walk(23.5,17.5);P.crouch=true;KT.step(2);L.push('crouch→'+at()+' kuchi='+!!T.m);
// fail path: stand up while she passes
P.crouch=false;KT.step(60*6);L.push('stood up, step='+at()+' log='+G.log.slice(-1)[0]?.text);
// proper: stay crouched
P.crouch=true;KT.step(2);let n=0;while(at()===3&&n<60*40){KT.step(1);n++}L.push('kuchi passed→'+at()+' after '+(n/60).toFixed(1)+'s');
walk(18.5,13);KT.step(2);L.push('marker→'+at());
n=0;while(at()===5&&n<60*40){const m=T.m;KT.keys.Space=!!(m&&Math.abs(m.x-P.x)<4.6*TS);KT.step(1);n++}KT.keys.Space=false;L.push('jiang passed→'+at()+' dead='+!!P.dead+' '+(n/60).toFixed(1)+'s');
if(!T.m){L.push('NO MONSTER at step '+at()+' tut='+G.tut+' P='+P.x.toFixed(0)+','+P.y.toFixed(0));return L}const m=T.m;KT.mouse.active=true;KT.mouse.fx=undefined;KT.mouse.x=m.x;KT.mouse.y=m.y;P.face=Math.atan2(m.y-P.y,m.x-P.x);KT.useSel();n=0;while(at()===6&&n<60*8){KT.step(1);n++}L.push('mosin fled→'+at()+' '+(n/60).toFixed(1)+'s');
KT.mouse.active=false;walk(16.5,10.5);walk(16.5,6.5);walk(13.5,5.5);const it=KT.interactTarget();L.push('prompt: '+(it&&it.label));KT.interact();KT.step(2);L.push('called→'+at());
walk(16.5,6.5);walk(16.5,10.5);walk(25,14);walk(31.5,19.5);KT.step(60);L.push('truck→'+at()+' saved='+G.humans[1].saved);
return L})()
