"""Export approved award cels in the native duckee palettes. No geometry changes.
Run after exporting the approved design-preview PNG sheets; not part of app build.
"""
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image
import json, shutil

root=Path(__file__).resolve().parents[1]
source=root/'design-preview/duck-race-results-v1/assets'
native=root/'frontend/public/assets/duck-race/duckee'
target=root/'frontend/public/assets/duck-race/results-v1'
colors=['yellow','aqua','blue','green','orange','purple','red','tan']
manifest=json.loads((source/'entrance-manifest.json').read_text(encoding='utf-8'))
for color in colors:
 folder=target/color;folder.mkdir(parents=True,exist_ok=True)
 for sheet in manifest:
  name=sheet['name'];base='yellow' if name=='bronze-climb' else 'purple' if name in ['silver-gift','silver-cheer'] else 'green'
  before=Image.open(native/base/'idle/0.png').convert('RGBA')
  after=Image.open(native/color/'idle/0.png').convert('RGBA')
  pairs=defaultdict(Counter)
  for y in range(64):
   for x in range(64):
    a=before.getpixel((x,y));b=after.getpixel((x,y))
    if a[3] and b[3]:pairs[a[:3]][b[:3]]+=1
  palette={a:counts.most_common(1)[0][0] for a,counts in pairs.items()}
  # Authored wing feathers use the same body's middle shade and outline.
  outline={'yellow':(37,37,0),'purple':(16,1,25),'green':(0,23,20)}[base]
  palette[(0,23,20)]=palette[outline]
  if base=='yellow':palette[(176,178,61)]=palette[(170,170,56)]
  im=Image.open(source/(name+'.png')).convert('RGBA')
  assert im.size==(sheet['frames']*sheet['cell'],sheet['cell'])
  im.putdata([(*palette.get(pixel[:3],pixel[:3]),pixel[3]) for pixel in im.getdata()])
  im.save(folder/(name+'.png'),optimize=True)
shutil.copyfile(source/'trophy-cups.webp',target/'trophy-cups.webp')
shutil.copyfile(root/'design-preview/duck-race-notices-v8/assets/eras/era-1.webp',target/'backdrop.webp')
(target/'manifest.json').write_text(json.dumps({'colors':colors,'sheets':manifest},ensure_ascii=False,indent=2),encoding='utf-8')
print('Exported',len(colors)*len(manifest),'registered PNG sheets; original duck geometry and prop colours preserved.')
