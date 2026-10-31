'use strict';
/* =====================================================================
   怪談救援 — engine: math, RNG, tiles, collision, pathfinding.
   ===================================================================== */
const TS=24;
let MW=84,MH=60,WW=MW*TS,WH=MH*TS;
let RNG=Math.random;
function mulberry32(a){return function(){a|=0;a=a+0x6D2B79F5|0;let t=Math.imul(a^a>>>15,1|a);t=t+Math.imul(t^t>>>7,61|t)^t;return((t^t>>>14)>>>0)/4294967296}}
const rnd=()=>RNG(), pick=a=>a[Math.floor(rnd()*a.length)];
function shuffle(a){for(let i=a.length-1;i>0;i--){const j=Math.floor(rnd()*(i+1));[a[i],a[j]]=[a[j],a[i]]}return a}
const dist=(a,b)=>Math.hypot(a.x-b.x,a.y-b.y);
const clamp=(v,a,b)=>v<a?a:v>b?b:v;
const lerp=(a,b,k)=>a+(b-a)*k;
const angDiff=(a,b)=>{let d=a-b;while(d>Math.PI)d-=2*Math.PI;while(d<-Math.PI)d+=2*Math.PI;return d};
const tc=t=>(t+.5)*TS;
// deterministic per-tile hash for decoration (independent of game RNG)
function hash(x,y,k){let h=(x*374761393+y*668265263+(k||0)*2147483647)|0;h=Math.imul(h^(h>>>13),1274126177);h^=h>>>16;return(h>>>0)/4294967296}
function vnoise(x,y,s){const fx=x/s,fy=y/s,ix=Math.floor(fx),iy=Math.floor(fy),tx=fx-ix,ty=fy-iy,sx=tx*tx*(3-2*tx),sy=ty*ty*(3-2*ty);
  return lerp(lerp(hash(ix,iy,7),hash(ix+1,iy,7),sx),lerp(hash(ix,iy+1,7),hash(ix+1,iy+1,7),sx),sy)}

/* ---------------- tiles ----------------
 .  ground      r road        s stone plaza   g tall grass    b bamboo (solid, opaque)
 T  forest      # house wall  h brick floor   d door threshold (殭屍跨不過)
 P  temple wall p temple floor A altar        w shallow water (slow)   W deep water
 G  grave       x exit zone   V truck         C cabinet  H haystack  Y climbable tree
 K  furniture (solid)   L street lamp (breakable)   D closed door (monsters must bash it)
 O well (hide inside)   J wind chime (rings when bumped)   U roadside shrine (ward)   Z bell (lure)
 X chicken coop (squawks)   Q laundry line (passable cover) */
const SOLID=new Set(['T','#','P','C','Y','V','A','b','G','K','W','H','L','O','J','U','Z','X']);
const OPAQUE=new Set(['T','#','P','C','b','H','D','Q','G']);
const WATER=new Set(['w','W']);
let G=null;
const tileAt=(tx,ty)=>(tx<0||ty<0||tx>=MW||ty>=MH)?'T':G.map[ty][tx];
const tAtPx=(x,y)=>tileAt(Math.floor(x/TS),Math.floor(y/TS));
const humanPass=(tx,ty)=>!SOLID.has(tileAt(tx,ty));
function inWard(tx,ty){const x=tc(tx),y=tc(ty);for(const w of G.wards)if(Math.hypot(x-w.x,y-w.y)<w.r)return true;return false}
function canStand(x,y,r,pass){const x0=Math.floor((x-r)/TS),x1=Math.floor((x+r)/TS),y0=Math.floor((y-r)/TS),y1=Math.floor((y+r)/TS);
  for(let ty=y0;ty<=y1;ty++)for(let tx=x0;tx<=x1;tx++)if(!pass(tx,ty))return false;return true}
function moveBy(a,dx,dy,pass){if(dx&&canStand(a.x+dx,a.y,a.r,pass))a.x+=dx;if(dy&&canStand(a.x,a.y+dy,a.r,pass))a.y+=dy}
function los(x0,y0,x1,y1){const d=Math.hypot(x1-x0,y1-y0),n=Math.ceil(d/6);for(let i=1;i<n;i++){if(OPAQUE.has(tAtPx(x0+(x1-x0)*i/n,y0+(y1-y0)*i/n)))return false}return true}

const DIRS8=[[1,0],[-1,0],[0,1],[0,-1],[1,1],[1,-1],[-1,1],[-1,-1]];
let PREV=null,QU=null;
function allocPath(){PREV=new Int32Array(MW*MH);QU=new Int32Array(MW*MH)}
function findPath(sx,sy,tx,ty,pass,maxNodes){
  PREV.fill(-2);const s=sy*MW+sx,t=ty*MW+tx;let qh=0,qt=0;QU[qt++]=s;PREV[s]=-1;let best=s,bestD=Math.abs(sx-tx)+Math.abs(sy-ty),found=s===t;const cap=maxNodes||1e9;
  while(qh<qt&&!found&&qh<cap){const c=QU[qh++],cx=c%MW,cy=(c/MW)|0;
    for(const[dx,dy]of DIRS8){const nx=cx+dx,ny=cy+dy;if(nx<0||ny<0||nx>=MW||ny>=MH)continue;const n=ny*MW+nx;if(PREV[n]!==-2)continue;
      if(!pass(nx,ny))continue;if(dx&&dy&&(!pass(cx+dx,cy)||!pass(cx,cy+dy)))continue;PREV[n]=c;QU[qt++]=n;
      if(n===t){found=true;break}const d=Math.abs(nx-tx)+Math.abs(ny-ty);if(d<bestD){bestD=d;best=n}}}
  const end=found?t:best,path=[];let c=end;while(c!==-1&&c!==s){path.push(c);c=PREV[c]}path.reverse();return{path,reached:found}
}
// steer an agent toward a pixel target along a BFS path; returns true when arrived (or stuck at best reachable spot)
function navTo(a,px,py,speed,dt,pass){
  a.repath=(a.repath||0)-dt;const tx=Math.floor(px/TS),ty=Math.floor(py/TS),gt=ty*MW+tx;
  if(a.repath<=0||!a.path||a.goalT!==gt){const r=findPath(Math.floor(a.x/TS),Math.floor(a.y/TS),tx,ty,pass,2600);a.path=r.path;a.reach=r.reached;a.goalT=gt;a.repath=.35+rnd()*.1}
  let gx,gy;
  if(a.path.length>1||(a.path.length===1&&!a.reach)){const n=a.path[0];gx=tc(n%MW);gy=tc((n/MW)|0);if(Math.hypot(gx-a.x,gy-a.y)<5)a.path.shift()}
  else if(a.reach){gx=px;gy=py}else return true;
  const dx=gx-a.x,dy=gy-a.y,d=Math.hypot(dx,dy);if(d<1.5)return a.path.length===0;
  const st=Math.min(d,speed*dt),ox=a.x,oy=a.y;moveBy(a,dx/d*st,dy/d*st,pass);
  if(a.x===ox&&a.y===oy&&!canStand(ox,oy,a.r,pass)){a.x+=dx/d*st;a.y+=dy/d*st} // overlapping a solid already: slide free instead of freezing
  if(a.x===ox&&a.y===oy){a.repath=0;a.x+=(rnd()-.5)*.6;a.y+=(rnd()-.5)*.6;if(!canStand(a.x,a.y,a.r,pass)){a.x=ox;a.y=oy}}
  a.face=Math.atan2(dy,dx);a.moving=true;return false
}
