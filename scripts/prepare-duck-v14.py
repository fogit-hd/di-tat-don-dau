"""Offline export of distinct painted frames, new obstacle art and complete net-capture frames.
Captured bodies are baked BEHIND the actual rope mesh into a single sprite texture.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math, base64, shutil
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'frontend/public/assets/duck-race/v14';OUT.mkdir(parents=True,exist_ok=True)
SRC=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
PRE=ROOT/'design-preview/duck-race-v14';PRE.mkdir(parents=True,exist_ok=True)
sources={'frames':'exec-19478137-2293-41c8-8d27-f8f423bec679.png','obstacles':'exec-f003bdc2-09fd-4019-bcd6-5c369e8f82e4.png','catcher':'exec-4cdd5f45-ef51-443c-8a46-b86b103e6a62.png','canvas':'exec-27509b1b-4a1f-4e68-929d-05b9c9c52c57.png'}
def export(im,name):
 im.save(OUT/(name+'.webp'),quality=94,method=6)
 w,h=im.size;encoded=base64.b64encode((OUT/(name+'.webp')).read_bytes()).decode()
 (OUT/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="data:image/webp;base64,{encoded}"/></svg>')
def cells(file,cols,rows):
 sheet=Image.open(SRC/file).convert('RGBA');result=[]
 for i in range(cols*rows):
  cell=sheet.crop((i%cols*sheet.width//cols,i//cols*sheet.height//rows,(i%cols+1)*sheet.width//cols,(i//cols+1)*sheet.height//rows))
  cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>=245 else 0))
  result.append(cell)
 return result
frames={}
for name,im in zip(['hud','question','action','field','lucky','result'],cells(sources['frames'],2,3)):
 box=im.getbbox();im=im.crop((max(0,box[0]-3),max(0,box[1]-3),min(im.width,box[2]+3),min(im.height,box[3]+3)))
 export(im,'frame-'+name);frames[name]={'width':im.width,'height':im.height}
for name,im in zip(['hop','double','wall','underpass','roots','cart'],cells(sources['obstacles'],3,2)):
 box=im.getbbox();im=im.crop(box);im.thumbnail((480,480),Image.Resampling.LANCZOS);export(im,'obstacle-'+name)

# Same size/pivot for the entire character sequence. Never fit each frame to its bbox.
raw=cells(sources['catcher'],4,2)
bags=[(100,345,54,60),(85,230,53,75),(325,120,52,65),(65,365,60,30),(85,375,62,25),(100,280,58,70),(100,282,58,85),(120,220,58,90)]
allframes=[]
def capture_frame(cell,i,duck=None):
 frame=cell.copy();cx,cy,rx,ry=bags[i]
 # Clear residual matte inside the net holes while preserving the painted rope itself.
 front=Image.new('RGBA',frame.size);fp=front.load();pix=frame.load()
 for y in range(max(0,cy-ry),min(frame.height,cy+ry)):
  for x in range(max(0,cx-rx),min(frame.width,cx+rx)):
   if ((x-cx)/rx)**2+((y-cy)/ry)**2>1:continue
   r,g,b,a=pix[x,y]
   rope=a>0 and r>g*1.04 and g>b*1.08 and r>65
   if rope:fp[x,y]=(r,g,b,a)
   pix[x,y]=(0,0,0,0)
 if duck is not None:
  d=duck.crop(duck.getbbox()).resize((95,75),Image.Resampling.NEAREST)
  d=d.rotate([0,0,0,-20,-20,-28,-25,-32][i],resample=Image.Resampling.NEAREST,expand=True)
  inside=Image.new('RGBA',frame.size);inside.alpha_composite(d,(cx-d.width//2,cy-d.height//2+8))
  # Crop the curled duck to the actual inside of the sagging mesh bag.
  mask=Image.new('L',frame.size);ImageDraw.Draw(mask).ellipse((cx-rx+8,cy-ry+15,cx+rx-8,cy+ry-7),fill=255)
  alpha=inside.getchannel('A');import PIL.ImageChops
  inside.putalpha(PIL.ImageChops.multiply(alpha,mask));frame.alpha_composite(inside)
 frame.alpha_composite(front)
 if True:
  # Author a complete sagging rope bag in the offline animation, in the same perspective
  # as the hoop. The actual native duck is enclosed by this mesh in the exported pixels.
  mesh=Image.new('RGBA',frame.size);draw=ImageDraw.Draw(mesh)
  left,right=cx-rx+3,cx+rx-3;top,bottom=cy-ry,cy+ry-2
  draw.ellipse((left,top-10,right,top+10),outline=(102,69,30,255),width=5)
  for n in range(8):
   u=n/7;points=[]
   for j in range(33):
    t=j/32;spread=math.sin(t*math.pi/2)*.28
    x=left+(right-left)*(u+(0.5-u)*t*.62)+math.sin(t*math.pi)*(u-.5)*9
    y=top+(bottom-top)*t
    points.append((x,y))
   draw.line(points,fill=(95,64,28,240),width=3)
   draw.line([(x+1,y)for x,y in points],fill=(219,180,102,235),width=1)
  for n in range(1,7):
   t=n/7;half=(right-left)/2*(1-t*.60);y=top+(bottom-top)*t
   points=[(cx-half+2*half*j/32,y+9*math.sin(j/32*math.pi))for j in range(33)]
   draw.line(points,fill=(99,65,28,240),width=3)
   draw.line([(x,y-1)for x,y in points],fill=(221,179,101,235),width=1)
  draw.arc((left,top-10,right,top+10),0,180,fill=(231,191,109,255),width=4)
  frame.alpha_composite(mesh)
 # Fixed native cell canvas, not independently zoomed characters.
 return frame.resize((256,256),Image.Resampling.LANCZOS)
for i,frame in enumerate(raw):allframes.append((f'empty/{i}',capture_frame(frame,i)))
for model,color in [('duckee',c)for c in ['yellow','aqua','blue','green','orange','purple','red','tan']]+[('ducky','yellow')]:
 duck=Image.open(ROOT/f'frontend/public/assets/duck-race/{model}/{color}/idle/0.png').convert('RGBA')
 for i,frame in enumerate(raw):allframes.append((f'{model}/{color}/{i}',capture_frame(frame,i,duck if i>=4 else None)))
cell=260;cols=8;atlas=Image.new('RGBA',(cols*cell,math.ceil(len(allframes)/cols)*cell))
data={'frames':{},'animations':{},'meta':{'image':'catcher.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}
for i,(name,frame)in enumerate(allframes):
 x=i%cols*cell+2;y=i//cols*cell+2;atlas.paste(frame,(x,y))
 data['frames'][name]={'frame':{'x':x,'y':y,'w':256,'h':256},'sourceSize':{'w':256,'h':256},'spriteSourceSize':{'x':0,'y':0,'w':256,'h':256},'trimmed':False,'rotated':False}
 data['animations'].setdefault(name.rsplit('/',1)[0],[]).append(name)
atlas.save(OUT/'catcher.png');(OUT/'catcher.json').write_text(json.dumps(data,separators=(',',':')))
contact=Image.new('RGB',(1024,512),'#2f4938')
for i in range(8):
 im=dict(allframes)[f'duckee/yellow/{i}'];contact.paste(im,(i%4*256,i//4*256),im)
contact.save(PRE/'capture-native-frames.png')
(OUT/'provenance.json').write_text(json.dumps({'generation':'built-in image generation','sources':sources,'frames':frames,'capture':'Native duck colour/pose baked inside an offline-authored sagging rope bag, behind its foreground mesh; one complete RGBA sprite per frame, no runtime duck/net layers.'},indent=2))
shutil.copyfile(SRC/sources['canvas'],PRE/'obstacle-rules-canvas.png')
print('Six distinct frames, six obstacle models,',len(allframes),'complete capture frames exported.')


