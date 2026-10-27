"""Build frame metadata from complete actor components and stable torso landmarks.
Does not repaint, separate limbs, deform art or alter PNG pixels.
"""
from pathlib import Path
import json
from statistics import median
from PIL import Image

ROOT=Path(__file__).resolve().parent
analysis=json.loads((ROOT/'verification'/'sprite-analysis.json').read_text(encoding='utf-8'))
reference=analysis['talk'][0]
ref_b=reference['buckle']
rw,rh=ref_b[2:]
rl,rt,rr,rb,_=reference['body']
clips={}
report={'reference':{'body':reference['body'],'buckle':ref_b},'frames':[]}
for name in analysis:
 source=Image.open(ROOT/'assets'/f'{name}-safe.png')
 entries=analysis[name]
 if len(entries)!=8:raise ValueError(f'{name}: expected 8 whole actors')
 # New sheets were authored with a fixed camera. Small antialiasing differences
 # in a buckle edge must not create a per-frame zoom or breathing torso.
 clip_w=median(item['buckle'][2] for item in entries)
 clip_h=median(item['buckle'][3] for item in entries)
 fixed_camera=(rw*clip_w+rh*clip_h)/(clip_w*clip_w+clip_h*clip_h)
 frames=[]
 for index,item in enumerate(entries):
  l,t,r,b,area=item['body']
  # Padding only within the actor's real extent plus clear safe gutters.
  x,y=max(0,l-4),max(0,t-4)
  right,bottom=min(source.width,r+4),min(source.height,b+4)
  rect=[x,y,right-x,bottom-y]
  bx,by,bw,bh=item['buckle']
  # Least-squares uniform camera correction from the stable belt buckle.
  # The raised arm and chin never influence the scale.
  camera=(rw*bw+rh*bh)/(bw*bw+bh*bh)
  if name!='point':camera=fixed_camera
  anchor=[bx+bw/2-x,by+bh/2-y]
  margins=[l,t,source.width-r,source.height-b]
  # At least two transparent source columns beyond the opaque actor. Padding is
  # clamped to the atlas only; no opaque arm/finger may touch a source edge.
  if min(margins[:1]+margins[2:3])<2:raise ValueError(f'{name}/{index}: clipped outer actor')
  # Reject a crop that contains any other complete character.
  for other in entries:
   if other is item or other['body']==item['body']:continue
   ol,ot,orr,ob,_=other['body']
   overlap=max(0,min(right,orr)-max(x,ol))*max(0,min(bottom,ob)-max(y,ot))
   if overlap:raise ValueError(f'{name}/{index}: neighbouring frame inside crop')
  frames.append({'rect':rect,'anchor':anchor,'cameraScale':camera,'body':[l-x,t-y,r-x,b-y]})
  report['frames'].append({'clip':name,'frame':index,'rect':rect,'margins':margins,'cameraScale':camera,'normalizedBuckle':[bw*camera,bh*camera]})
 clips[name]={'src':f'./assets/{name}-safe.png','frames':frames}
# Same exact closed-mouth actor for idle, talk boundary and point's first frame.
for name in clips:
 if name not in ['talk','arrive'] and not name.endswith('-talk'):clips[name]['frames'][0]={'shared':'talk:0'}
clips['blink']['frames'][7]={'shared':'talk:0'}
clips['arrive']['frames'][7]={'shared':'talk:0'}
for name in ['point-up','point-steep-right','point-steep-left']:
 clips[name]['frames'][7]={'shared':name+'-talk:0'}
payload={'referenceHeight':rb-rt,'waistFraction':((ref_b[1]+rh/2)-rt)/(rb-rt),
         'pointDuration':0.48,'returnDuration':0.32,'clips':clips}
visible_frames=[f for c in clips.values() for f in c['frames'] if 'shared' not in f]
payload['actorBounds']={
 'above':max(f['anchor'][1]*f['cameraScale']/payload['referenceHeight'] for f in visible_frames),
 'below':max((f['rect'][3]-f['anchor'][1])*f['cameraScale']/payload['referenceHeight'] for f in visible_frames)
}
(ROOT/'sprites.js').write_text('window.MASCOT_SPRITES='+json.dumps(payload,separators=(',',':'))+';\n',encoding='utf-8')
(ROOT/'verification'/'sprite-calibration.json').write_text(json.dumps(report,indent=2),encoding='utf-8')
print(json.dumps({'actors':len(report['frames']),'sharedIdle':True,'pointMs':480,
                  'referenceHeight':payload['referenceHeight'],'noNeighbourIntersections':True}))

