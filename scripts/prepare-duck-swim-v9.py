"""Author paddle-stroke frames on the exact native round body. Keep head/beak unchanged."""
from pathlib import Path
from PIL import Image,ImageDraw
from collections import Counter,defaultdict
import json,math
ROOT=Path(__file__).resolve().parents[1];OUT=ROOT/'frontend/public/assets/duck-race';manifest=json.loads((OUT/'manifest-v8.json').read_text())
native=Image.open('C:/Users/PHONG/Downloads/DuckyV2/Ducky/Spritesheets/idle.png').convert('RGBA').crop((0,0,64,64))
for model,color in [('duckee',c)for c in ['yellow','aqua','blue','green','orange','purple','red','tan']]+[('ducky','yellow')]:
 target=Image.open(OUT/model/color/'idle/0.png').convert('RGBA');votes=defaultdict(Counter)
 for a,b in zip(native.get_flattened_data(),target.get_flattened_data()):
  if a[3] and b[3]:votes[a[:3]][b[:3]]+=1
 palette={a:counts.most_common(1)[0][0] for a,counts in votes.items()}
 for pose,count in [('swim',8),('swim_idle',4)]:
  key=f'{model}/{color}/{pose}';dest=OUT/key;dest.mkdir(parents=True,exist_ok=True)
  for i in range(count):
   frame=native.copy() if pose=='swim' else Image.open(OUT/'ducky/yellow/idle'/f'{i}.png').convert('RGBA');d=ImageDraw.Draw(frame)
   d.rectangle((0,44,63,63),fill=(0,0,0,0))
   if pose=='swim':
    tip=[(24,40),(21,38),(18,37),(16,39),(17,42),(20,44),(23,43),(24,41)][i]
    d.polygon([(25,38),(28,40),(26,43),tip],fill=(0,23,20,255))
    inner=(tip[0]+1,tip[1]);d.polygon([(25,39),(26,41),(25,42),inner],fill=(85,148,139,255));d.line((24,40,tip[0]+1,tip[1]),fill=(35,107,97,255))
   pix=frame.load()
   for y in range(64):
    for x in range(64):
     r,g,b,a=pix[x,y];pix[x,y]=(*palette.get((r,g,b),(r,g,b)),a)
   frame.save(dest/f'{i}.png')
  manifest[key]={'frames':count,'width':64,'height':64,'fps':10 if pose=='swim' else 5,'source':'DuckyV2 native idle body; authored pixel paddle-stroke sequence; head and beak preserved'}
allframes=[]
for key,m in manifest.items():
 for i in range(m['frames']):allframes.append((f'{key}/{i}',Image.open(OUT/key/f'{i}.png').convert('RGBA')))
cell=68;cols=16;atlas=Image.new('RGBA',(cols*cell,math.ceil(len(allframes)/cols)*cell));data={'frames':{},'animations':{},'meta':{'image':'ducks-v9.png','scale':'1','size':{'w':atlas.width,'h':atlas.height}}}
for i,(key,im) in enumerate(allframes):
 x=i%cols*cell+2;y=i//cols*cell+2;atlas.paste(im,(x,y));data['frames'][key]={'frame':{'x':x,'y':y,'w':64,'h':64},'sourceSize':{'w':64,'h':64},'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64},'rotated':False,'trimmed':False};data['animations'].setdefault(key.rsplit('/',1)[0],[]).append(key)
atlas.save(OUT/'ducks-v9.png');(OUT/'ducks-v9.json').write_text(json.dumps(data,separators=(',',':')));(OUT/'manifest-v9.json').write_text(json.dumps(manifest,indent=2));print(len(allframes),'native-body frames exported')
