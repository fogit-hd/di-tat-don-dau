"""Pixel accessories registered and baked for EVERY native frame, not floating runtime objects."""
from pathlib import Path
from PIL import Image,ImageDraw
import json,math,base64,sys
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'frontend/public/assets/duck-race'
version='v12' if '--v12' in sys.argv else 'v9' if '--v9' in sys.argv else 'v8';suffix='-'+version if version!='v8' else ''
manifest=json.loads((OUT/f'manifest-{version}.json').read_text())
items=['goggles','leaf','helmet','crown','scarf','fins','boots','feather']
def item_art(name):
 im=Image.new('RGBA',(24,20));d=ImageDraw.Draw(im);edge='#1d2518'
 if name=='goggles':
  d.rectangle((4,8,19,9),fill='#b58933');d.rectangle((5,6,10,10),fill=edge);d.rectangle((12,6,17,10),fill=edge)
  d.rectangle((6,7,9,9),fill='#edb845');d.rectangle((13,7,16,9),fill='#edb845');d.rectangle((7,7,9,8),fill='#6db9b7');d.rectangle((14,7,16,8),fill='#6db9b7');d.point((7,7),fill='#d8f6dc');d.point((14,7),fill='#d8f6dc')
 elif name in ['helmet','leaf','crown']:
  if name=='helmet':
   d.polygon([(5,9),(5,6),(8,3),(15,3),(18,6),(18,9)],fill=edge);d.polygon([(6,8),(6,6),(9,4),(14,4),(17,6),(17,8)],fill='#dfac30');d.rectangle((4,9,19,10),fill='#80601e');d.line((11,4,11,8),fill='#ffe095',width=1)
  elif name=='leaf':
   d.polygon([(3,10),(8,4),(18,2),(16,8),(10,11)],fill=edge);d.polygon([(5,9),(9,5),(17,3),(14,8),(10,10)],fill='#7fa63e');d.line((5,10,16,4),fill='#b9cf68')
  else:
   d.polygon([(5,10),(4,3),(8,6),(11,2),(14,6),(18,3),(17,10)],fill=edge);d.polygon([(6,9),(6,5),(8,7),(11,4),(14,7),(16,5),(16,9)],fill='#e6ba42');d.rectangle((6,10,16,11),fill='#a37424');d.point((11,9),fill='#b34a36')
 elif name=='scarf':
  # The collar is LEFT of the beak; the tail trails behind the body.
  d.polygon([(3,9),(10,7),(17,7),(17,10),(10,10),(6,15),(1,13),(6,10)],fill=edge)
  d.rectangle((9,8,16,9),fill='#bd4633');d.polygon([(4,10),(9,9),(8,11),(5,14),(3,12),(6,10)],fill='#ce5c42');d.line((10,8,15,8),fill='#ed9670')
 elif name in ['fins','boots']:
  for x in [5,14]:
   if name=='boots':
    d.rectangle((x,5,x+3,10),fill=edge);d.rectangle((x+1,6,x+2,9),fill='#7c5636');d.rectangle((x-1,10,x+5,12),fill=edge);d.rectangle((x,10,x+4,11),fill='#aa7c43')
   else:
    d.polygon([(x,7),(x+3,7),(x+6,12),(x-2,12)],fill=edge);d.polygon([(x+1,8),(x+2,8),(x+4,11),(x,11)],fill='#c3a845');d.line((x+1,9,x+1,11),fill='#eee1a0')
 else:
  d.line((11,4,10,11),fill='#9d7740');d.polygon([(10,8),(13,6),(15,7),(14,12),(10,15),(9,12)],fill=edge);d.polygon([(11,9),(13,7),(14,8),(13,11),(10,14)],fill='#c9e2b9');d.line((11,12,13,8),fill='#689889')
 return im

ui=OUT/'gear-ui';ui.mkdir(exist_ok=True)
for name in items:
 im=item_art(name).resize((96,80),Image.Resampling.NEAREST);im.save(ui/(name+'.webp'),lossless=True)
 data=base64.b64encode((ui/(name+'.webp')).read_bytes()).decode()
 (ui/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="96" height="80" viewBox="0 0 96 80"><image width="96" height="80" style="image-rendering:pixelated" href="data:image/webp;base64,{data}"/></svg>')

body_colors={(35,107,97),(5,65,57),(85,148,139),(175,213,208)}
beak_colors={(170,127,56),(236,198,135),(103,67,9)}
frames=[];registration={}
for key,meta in manifest.items():
 if not key.startswith('ducky/yellow/'):continue
 pose=key.split('/')[-1]
 for f in range(meta['frames']):
  base=Image.open(OUT/meta.get('frameRoot',key)/f'{f}.png').convert('RGBA');pix=base.load()
  body=[(x,y)for y in range(64)for x in range(64)if pix[x,y][3] and pix[x,y][:3] in body_colors]
  if not body:body=[(28,38)]
  cx=sum(x for x,y in body)/len(body);cy=sum(y for x,y in body)/len(body);height=max(y for x,y in body)-min(y for x,y in body)+1
  beak=[(x,y)for y in range(64)for x in range(64)if pix[x,y][3] and pix[x,y][:3] in beak_colors and y<min(44,cy+5)]
  bx=sum(x for x,y in beak)/len(beak) if beak else cx+8;by=sum(y for x,y in beak)/len(beak) if beak else cy+1
  angle=math.atan2(by-cy,bx-cx)-.12
  # Native rolls have explicit whole-body orientation; do not infer them from the bounding box.
  if pose=='roll':angle=[0,-math.pi/2,-math.pi,-math.pi*1.5][f%4]
  if pose=='jump':angle=0
  if pose=='double_jump':angle=-.35
  if pose=='knockout':angle=math.pi/2
  if pose=='attack_run' and f==3:angle=math.pi
  if pose in ['idle','walk_run','guard','swim','swim_idle','mud_walk','land','crouch','crawl']:angle=0
  registration[f'{pose}/{f}']={'body':[round(cx,2),round(cy,2)],'angle':round(angle,3)}
  for name in items:
   overlay=Image.new('RGBA',(64,64));art=item_art(name)
   if name=='goggles':anchor=(cx+2,cy-min(4,height*.21));origin=(12,8)
   elif name in ['helmet','leaf','crown']:anchor=(cx+2,cy-height*.48);origin=(12,11)
   elif name=='scarf':anchor=(cx-1,cy+min(4,height*.23));origin=(13,8)
   elif name in ['fins','boots']:anchor=(cx+2,max(y for x,y in body)+3);origin=(12,10)
   else:anchor=(cx-5,cy+4);origin=(12,10)
   overlay.alpha_composite(art,(round(anchor[0]-origin[0]),round(anchor[1]-origin[1])))
   if angle:overlay=overlay.rotate(-math.degrees(angle),resample=Image.Resampling.NEAREST,center=(cx,cy))
   # Glasses and collar must be behind the native beak, never pasted across it.
   if name in ['goggles','scarf']:
    op=overlay.load()
    for y in range(64):
     for x in range(64):
      if pix[x,y][3] and pix[x,y][:3] in beak_colors and y<cy+5:op[x,y]=(0,0,0,0)
   if pose in ['swim','swim_idle'] and name in ['boots','fins']:overlay=Image.new('RGBA',(64,64))
   if pose=='attack_run' and f==3 and name=='goggles':overlay=Image.new('RGBA',(64,64))
   frames.append((f'{name}/{pose}/{f}',overlay))
cell=68;cols=16;atlas=Image.new('RGBA',(cols*cell,math.ceil(len(frames)/cols)*cell));data={'frames':{},'meta':{'image':f'gear-poses{suffix}.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}
for i,(key,im) in enumerate(frames):
 x=i%cols*cell+2;y=i//cols*cell+2;atlas.paste(im,(x,y));data['frames'][key]={'frame':{'x':x,'y':y,'w':64,'h':64},'sourceSize':{'w':64,'h':64},'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64},'rotated':False,'trimmed':False}
atlas.save(OUT/f'gear-poses{suffix}.png');(OUT/f'gear-poses{suffix}.json').write_text(json.dumps(data,separators=(',',':')));(OUT/f'gear-registration{suffix}.json').write_text(json.dumps(registration,indent=2))
# Visual inspection sheet: same palette and actual compositing order as the game.
samples=['idle','walk_run','crawl','roll','jump','attack_idle','attack_run','attack_air','guard','swim','mud_walk']
preview=Image.new('RGB',(960,len(samples)*130),'#253a30');d=ImageDraw.Draw(preview)
lookup=dict(frames)
for row,pose in enumerate(samples):
 d.text((4,row*130+8),pose,fill='#fff0bd');count=manifest['ducky/yellow/'+pose]['frames']
 for f in range(count):
  sample_key='duckee/yellow/'+pose
  base=Image.open(OUT/manifest[sample_key].get('frameRoot',sample_key)/f'{f}.png').convert('RGBA')
  for name in ['scarf','goggles']:base.alpha_composite(lookup[f'{name}/{pose}/{f}'])
  preview.paste(base.resize((128,128),Image.Resampling.NEAREST),(120+f*135,row*130),base.resize((128,128),Image.Resampling.NEAREST))
preview.save(ROOT/f'design-preview/duck-race-{version}/native-fitted-equipment.png');print(len(frames),'registered gear frames')
