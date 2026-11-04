"""Native round Ducky in every colour/state; AI art is scenery and inventory artwork only."""
from pathlib import Path
from PIL import Image
import json, base64
ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'frontend/public/assets/duck-race'
SRC=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
NATIVE=Path('C:/Users/PHONG/Downloads/DuckyV2/Ducky/Spritesheets')
art=OUT/'world-v8';art.mkdir(parents=True,exist_ok=True)
sources={'water':'exec-f341c913-4d87-4f97-9dd1-5e1fa8c00b5f.png','mud':'exec-0a66528f-2006-4ae3-bfde-ec7218fdd03a.png','obstacles':'exec-75c527cd-8eaa-4ca1-91b8-e96521536164.png','equipment':'exec-cbc5b82e-eadc-4314-a673-762e7e04308b.png'}
def svg_image(im,name):
 im.save(art/(name+'.webp'),quality=94,method=6)
 data=base64.b64encode((art/(name+'.webp')).read_bytes()).decode();w,h=im.size
 (art/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="data:image/webp;base64,{data}"/></svg>')
for name in ['water','mud']:
 im=Image.open(SRC/sources[name]).convert('RGBA').resize((1200,560),Image.Resampling.LANCZOS);svg_image(im,name)
def cells(file,cols,rows,cut=False):
 im=Image.open(SRC/file).convert('RGBA');result=[]
 for y in range(rows):
  for x in range(cols):
   cell=im.crop((x*im.width//cols,y*im.height//rows,(x+1)*im.width//cols,(y+1)*im.height//rows))
   if cut:cell.putalpha(cell.getchannel('A').point(lambda a:255 if a>210 else 0))
   box=cell.getchannel('A').point(lambda a:255 if a>40 else 0).getbbox()
   assert box,file
   result.append(cell.crop(box))
 return result
for name,im in zip(['hurdle','gate','beam'],cells(sources['obstacles'],3,1)):
 im.thumbnail((500,430),Image.Resampling.LANCZOS);svg_image(im,name)
for name,im in zip(['goggles','leaf','helmet','crown','scarf','fins','boots','feather'],cells(sources['equipment'],4,2)):
 im.thumbnail((180,180),Image.Resampling.LANCZOS);svg_image(im,name)
manifest=json.loads((OUT/'manifest.json').read_text())
def export(key,images,provenance):
 dest=OUT/key;dest.mkdir(parents=True,exist_ok=True)
 for i,im in enumerate(images):im.save(dest/f'{i}.png')
 manifest[key]={'frames':len(images),'width':64,'height':64,'fps':10,'source':provenance}
for state,source in [('attack_idle','f_smash'),('attack_run','left_jab'),('attack_air','down_smash'),('guard','shield'),('knockout','death'),('double_jump','multi_jump')]:
 im=Image.open(NATIVE/(source+'.png')).convert('RGBA');assert im.height==64
 export('ducky/yellow/'+state,[im.crop((i*64,0,(i+1)*64,64)) for i in range(im.width//64)],'DuckyV2/Spritesheets/'+source+'.png')
hues={'yellow':None,'aqua':.48,'blue':.61,'green':.31,'orange':.08,'purple':.77,'red':.99,'tan':.09}
# Final character pass: every colour uses the SAME native round-bodied model.
# Every shipped character clip is native; generated character proposals are not imported.
# Build exact palette correspondences from matching native idle pixels, preserving outlines.
from collections import Counter,defaultdict
source_idle=Image.open(NATIVE/'idle.png').convert('RGBA').crop((0,0,64,64))
for model,color in [('duckee',c) for c in hues]+[('ducky','yellow')]:
 target_idle=Image.open(OUT/model/color/'idle'/'0.png').convert('RGBA')
 votes=defaultdict(Counter)
 for a,b in zip(source_idle.get_flattened_data(),target_idle.get_flattened_data()):
  if a[3] and b[3]:votes[a[:3]][b[:3]]+=1
 palette={a:counts.most_common(1)[0][0] for a,counts in votes.items()}
 states={'idle':'idle','walk_run':'walk','jump':'jump','air':'floating_flap','fall':'floating_fall','roll':'roll_1','take_damage':'hit','land':'land','crouch':'crouch','attack':'right_hook','attack_idle':'f_smash','attack_run':'f_tilt','attack_air':'down_smash','guard':'shield','knockout':'death','double_jump':'multi_jump','crawl':'crawl','swim':'walk','mud_walk':'walk'}
 for state,source in states.items():
  sheet=Image.open(NATIVE/(source+'.png')).convert('RGBA');images=[]
  for i in range(sheet.width//64):
   im=sheet.crop((i*64,0,(i+1)*64,64));pixels=im.load()
   for y in range(64):
    for x in range(64):
     r,g,b,a=pixels[x,y];rgb=palette.get((r,g,b),(r,g,b));pixels[x,y]=(*rgb,a)
   # Swimming preserves the native head/body; the water plane occludes legs.
   if state=='swim':
    from PIL import ImageDraw
    ImageDraw.Draw(im).rectangle((0,45,64,64),fill=(0,0,0,0))
   images.append(im)
  export(f'{model}/{color}/{state}',images,'DuckyV2/Spritesheets/'+source+'.png; exact native palette mapping'+('; waterline occlusion' if state=='swim' else ''))
frames=[];poses={}
for key,meta in manifest.items():
 for i in range(meta['frames']):
  im=Image.open(OUT/key/f'{i}.png').convert('RGBA');frames.append((key+'/'+str(i),im))
  poses.setdefault(key,[]).append(list(im.getbbox() or (16,24,48,48)))
cell,cols=68,16;atlas=Image.new('RGBA',(cols*cell,((len(frames)+cols-1)//cols)*cell))
data={'frames':{},'animations':{},'meta':{'image':'ducks-v8.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}
for i,(key,im) in enumerate(frames):
 x,y=i%cols*cell+2,i//cols*cell+2;atlas.paste(im,(x,y));data['frames'][key]={'frame':{'x':x,'y':y,'w':64,'h':64},'sourceSize':{'w':64,'h':64},'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64},'rotated':False,'trimmed':False};data['animations'].setdefault(key.rsplit('/',1)[0],[]).append(key)
atlas.save(OUT/'ducks-v8.png');(OUT/'ducks-v8.json').write_text(json.dumps(data,separators=(',',':')))
(OUT/'manifest-v8.json').write_text(json.dumps(manifest,indent=2));(ROOT/'frontend/src/games/duck-race/pose-bounds.json').write_text(json.dumps(poses,separators=(',',':')))
(art/'provenance.json').write_text(json.dumps(sources,indent=2));print(len(manifest),'clips',len(frames),'frames',atlas.size)
