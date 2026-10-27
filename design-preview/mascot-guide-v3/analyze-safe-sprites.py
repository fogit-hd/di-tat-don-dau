"""Inspect complete connected actors; never assume generated sheets have equal cells."""
from pathlib import Path
import json
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parent
def components(mask):
 parent=[];bounds=[];prev=[]
 def find(k):
  while parent[k]!=k:
   parent[k]=parent[parent[k]];k=parent[k]
  return k
 for y,row in enumerate(mask):
  dif=np.diff(np.pad(row.astype(np.int8),(1,1)))
  starts=np.flatnonzero(dif==1);ends=np.flatnonzero(dif==-1)-1;cur=[];p=0
  for a,b in zip(starts,ends):
   a,b=int(a),int(b)
   while p<len(prev) and prev[p][1]<a-1:p+=1
   roots=[];q=p
   while q<len(prev) and prev[q][0]<=b+1:
    roots.append(find(prev[q][2]));q+=1
   if not roots:
    k=len(parent);parent.append(k);bounds.append([a,y,b+1,y+1,b-a+1])
   else:
    k=roots[0]
    for r in roots[1:]:
     r=find(r);k=find(k)
     if r!=k:
      parent[r]=k
      v,w=bounds[k],bounds[r]
      bounds[k]=[min(v[0],w[0]),min(v[1],w[1]),max(v[2],w[2]),max(v[3],w[3]),v[4]+w[4]]
    v=bounds[k];bounds[k]=[min(v[0],a),min(v[1],y),max(v[2],b+1),y+1,v[4]+b-a+1]
   cur.append((a,b,k))
  prev=cur
 return [bounds[k] for k in range(len(parent)) if find(k)==k]

all_data={}
for name in ['talk','point','wave','blink','think','confirm','celebrate','breathe','point-right','point-down-right','point-left','point-up-left','point-down-left','arrive','point-talk','point-right-talk','point-down-right-talk','point-up-left-talk','point-left-talk','point-down-left-talk','point-up','point-up-talk','point-steep-right','point-steep-right-talk','point-steep-left','point-steep-left-talk']:
 im=Image.open(ROOT/'assets'/f'{name}-safe.png').convert('RGBA');data=np.array(im);a=data[:,:,3]
 bodies=[v for v in components(a>110) if v[4]>20000 and v[3]-v[1]>200]
 bodies.sort(key=lambda v:(int((v[1]+v[3])/2>im.height/2),v[0]))
 print(name,im.size,'bodies',len(bodies))
 frames=[]
 for i,b in enumerate(bodies):
  l,t,r,bot,area=b;arr=data[t:bot,l:r];rgb=arr[:,:,:3].astype(np.int16);alpha=arr[:,:,3]
  yy=np.indices(alpha.shape)[0]
  gold=(rgb[:,:,0]>170)&(rgb[:,:,1]>110)&(rgb[:,:,2]<110)&(alpha>180)&(yy<70)
  gs=sorted(components(gold),key=lambda v:v[4],reverse=True)
  g=gs[0] if gs else None;gx=(g[0]+g[2])/2 if g else 0
  steel=(rgb.max(2)-rgb.min(2)<48)&(rgb.min(2)>55)&(rgb.max(2)<235)&(alpha>180)&(yy>arr.shape[0]*.72)
  # The fist can obscure the cap emblem. Match the horizontal steel buckle,
  # never the tall wrench head or a cap-dependent x coordinate.
  candidates=[v for v in components(steel) if v[4]>130 and v[2]-v[0]>24 and 16<v[3]-v[1]<38 and 1.15<(v[2]-v[0])/(v[3]-v[1])<1.65]
  candidates.sort(key=lambda v:abs((v[1]+v[3])/2-arr.shape[0]*.88))
  buckle=candidates[0] if candidates else None
  frame={'body':b,'cap':[l+gx,t+(g[1]+g[3])/2] if g else None,'buckle':None if buckle is None else [l+buckle[0],t+buckle[1],buckle[2]-buckle[0],buckle[3]-buckle[1]],'candidates':candidates[:4]}
  frames.append(frame)
  print(i,frame)
 # Four-mouth sheets repeat complete actors in the eight-slot speech sequence.
 # No detached mouth/arm layers or grid-cell assumptions are introduced.
 if name.endswith('-talk') and len(frames)==4:frames=[frames[i] for i in [0,1,1,2,3,1,0,0]]
 all_data[name]=frames
(ROOT/'verification'/'sprite-analysis.json').write_text(json.dumps(all_data,indent=2),encoding='utf-8')

