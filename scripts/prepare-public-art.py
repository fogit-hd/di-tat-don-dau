"""Export the generated public-page assets; keeps gameplay frames untouched."""
import json
from pathlib import Path
from PIL import Image
ROOT=Path(__file__).resolve().parents[1]
sources=json.loads((ROOT/'design-preview/landing-wiki-v2/asset-sources.json').read_text())
out=ROOT/'frontend/public/assets/landing-v2'
for item in sources:
 im=Image.open(item['source']).convert('RGBA')
 if item['name'] in ['brand-logo','hero-title']:
  mask=im.getchannel('A').point(lambda x:255 if x>24 else 0)
  bbox=mask.getbbox()
  if bbox:
   l,t,r,b=bbox;im=im.crop((max(0,l-10),max(0,t-10),min(im.width,r+10),min(im.height,b+10)))
 im.save(out/(item['name']+'.webp'),quality=92,method=6)
 if item['name']=='public-textures':
  for name,box in [('wine',(0,0,im.width//2,im.height)),('paper',(im.width//2,0,im.width,im.height))]:
   im.crop(box).resize((512,512),Image.Resampling.LANCZOS).convert('RGB').save(out/(name+'.webp'),quality=88,method=6)
 if item['name']=='chapter-art':
  for name,box in [('step-1',(0,0,768,512)),('step-2',(768,0,1536,512)),('step-3',(0,540,768,1024)),('book',(768,540,1536,1024))]:
   im.crop(box).save(out/(name+'.webp'),quality=92,method=6)
metadata={p.name:{'width':Image.open(p).width,'height':Image.open(p).height,'bytes':p.stat().st_size} for p in out.glob('*.webp')}
(out/'manifest.json').write_text(json.dumps(metadata,indent=2),encoding='utf-8')
print(json.dumps(metadata,indent=2))
