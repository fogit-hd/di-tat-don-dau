"""Export generated finite terrain and real frame-by-frame VFX; no CSS drawings."""
from pathlib import Path
from PIL import Image,ImageDraw,ImageFilter,ImageChops
import json,math,base64
import numpy as np
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'frontend/public/assets/duck-race';DEST=OUT/'terrain-v9';DEST.mkdir(exist_ok=True)
SRC=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
sources={'water':'exec-5b67677d-c6e6-43a6-b3d8-302d655a0d2f.png','mud':'exec-1d2eec15-ae7b-4b85-8004-2b5850933656.png','contact':'exec-f28c9c92-c738-4394-84ca-80ad44947b47.png','environment':'exec-7199764d-9201-4923-9c9d-e3fbdf2605e5.png','water-loop':'exec-fe59b6c4-ddbb-49eb-a8e4-799089f89b9e.png'}
polygons={}
for kind in ['water','mud']:
 im=Image.open(SRC/sources[kind]).convert('RGBA');box=im.getchannel('A').point(lambda a:255 if a>25 else 0).getbbox();im=im.crop(box);im.thumbnail((512,768),Image.Resampling.LANCZOS)
 im.save(DEST/(kind+'.webp'),quality=94,method=6)
 arr=np.array(im);r,g,b=arr[:,:,0].astype(float),arr[:,:,1].astype(float),arr[:,:,2].astype(float)
 wet=(g>r*1.12)&(b>r*1.12)&(g>65)&(arr[:,:,3]>120) if kind=='water' else (r>g*1.1)&(g>b*1.02)&(r<145)&(arr[:,:,3]>160)
 # Match physics to the painted inner wet contour, rather than a rectangle.
 rows=[]
 for y in range(0,im.height,12):
  xs=np.flatnonzero(wet[max(0,y-4):min(im.height,y+5)].any(axis=0))
  if len(xs)>im.width*.12:
   left,right=np.quantile(xs,[.055,.945]);rows.append((float(left)/im.width,y/im.height,float(right)/im.width))
 assert len(rows)>15,kind
 points=[(round(l,4),round(y,4))for l,y,r in rows]+[(round(r,4),round(y,4))for l,y,r in reversed(rows)]
 polygons[kind]=points
 mask=Image.new('L',im.size);ImageDraw.Draw(mask).polygon([(round(x*im.width),round(y*im.height))for x,y in points],fill=255)
 mask=mask.filter(ImageFilter.GaussianBlur(.6));rgba=Image.new('RGBA',im.size,'white');rgba.putalpha(mask);rgba.save(DEST/(kind+'-mask.png'))
 bank=im.copy();bank.putalpha(ImageChops.multiply(im.getchannel('A'),ImageChops.invert(mask)));bank.save(DEST/(kind+'-bank.webp'),quality=94,method=6)

shape='// Generated from the actual painted wet contours by scripts/prepare-duck-terrain-v9.py.\n'
for kind,points in polygons.items():shape+=f'export const {kind.upper()}_SHAPE = '+json.dumps(points,separators=(',',':'))+' as const\n'
(ROOT/'shared/duck-terrain-shapes.ts').write_text(shape)

clips={}
for source,names in [('contact',['wake','splash','paddle','mud-pull']),('environment',['wind','rain','dust','boulder'])]:
 im=Image.open(SRC/sources[source]).convert('RGBA');cw,ch=im.width//6,im.height//4
 for row,name in enumerate(names):
  frames=[]
  for f in range(6):
   frame=im.crop((f*cw,row*ch,(f+1)*cw,(row+1)*ch));frame.putalpha(frame.getchannel('A').point(lambda a:0 if a<10 else a));frame=frame.resize((192,192),Image.Resampling.LANCZOS);frames.append(frame)
  clips[name]=frames
im=Image.open(SRC/sources['water-loop']).convert('RGBA');cw,ch=im.width//4,im.height//2
keys=[im.crop((i%4*cw,i//4*ch,(i%4+1)*cw,(i//4+1)*ch)).resize((192,192),Image.Resampling.LANCZOS)for i in range(8)]
clips['water-flow']=[Image.blend(keys[i],keys[(i+1)%8],t/3)for i in range(8)for t in range(3)]
def pack(clips,name):
 allframes=[(f'{name}/{i}',im)for name,images in clips.items()for i,im in enumerate(images)]
 size=196;cols=8;atlas=Image.new('RGBA',(cols*size,math.ceil(len(allframes)/cols)*size));data={'frames':{},'animations':{},'meta':{'image':name+'.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}
 for i,(key,im) in enumerate(allframes):
  x=i%cols*size+2;y=i//cols*size+2;atlas.paste(im,(x,y));data['frames'][key]={'frame':{'x':x,'y':y,'w':192,'h':192},'sourceSize':{'w':192,'h':192},'spriteSourceSize':{'x':0,'y':0,'w':192,'h':192},'rotated':False,'trimmed':False};data['animations'].setdefault(key.rsplit('/',1)[0],[]).append(key)
 atlas.save(DEST/(name+'.png'));(DEST/(name+'.json')).write_text(json.dumps(data,separators=(',',':')))
pack(clips,'effects')
(DEST/'provenance.json').write_text(json.dumps({'tool':'built-in image_gen','sources':sources,'mode':'frame-by-frame animated spritesheets; finite transparent terrain'},indent=2))

# Genuine animated preview files (not a still storyboard). Frame blending is offline.
preview=ROOT/'design-preview/duck-race-v9';preview.mkdir(exist_ok=True)
gif=[]
for tick in range(36):
 canvas=Image.new('RGB',(768,440),'#153e36');draw=ImageDraw.Draw(canvas)
 for i,(name,label) in enumerate([('wake','SWIMMING WAKE'),('splash','WATER IMPACT'),('mud-pull','STICKY MUD'),('dust','DUST DEVIL')]):
  x=i%2*384;y=i//2*220;draw.text((x+18,y+14),label,fill='#ffe5a5')
  phase=(tick*.5)%6;a=int(phase);b=(a+1)%6;im=Image.blend(clips[name][a],clips[name][b],phase-a).resize((210,210),Image.Resampling.LANCZOS)
  canvas.paste(im,(x+85,y+12),im)
 gif.append(canvas)
gif[0].save(preview/'painted-effects.gif',save_all=True,append_images=gif[1:],duration=65,loop=0,disposal=2)
gif[0].save(preview/'painted-effects.webp',save_all=True,append_images=gif[1:],duration=65,loop=0,quality=88,method=4)
print('Exported finite terrain, wet collision contours, 48 painted effect frames, and animated previews.')
