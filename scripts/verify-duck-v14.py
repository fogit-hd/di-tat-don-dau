from pathlib import Path
from PIL import Image,ImageChops
import json,hashlib
root=Path(__file__).resolve().parents[1];folder=root/'frontend/public/assets/duck-race/v14'
images=[folder/f'frame-{k}.webp'for k in ['hud','question','action','field','lucky','result']]
assert len({hashlib.sha256(p.read_bytes()).digest()for p in images})==6
for p in images:
 im=Image.open(p).convert('RGBA');assert im.getchannel('A').getextrema()==(0,255)
 assert im.getpixel((0,0))[3]==0
 svg=p.with_suffix('.svg').read_text();assert 'data:image/webp;base64,'in svg
sheet=json.loads((folder/'catcher.json').read_text());atlas=Image.open(folder/'catcher.png').convert('RGBA')
def frame(key):
 r=sheet['frames'][key]['frame'];assert r['w']==r['h']==256
 assert atlas.getpixel((r['x']-1,r['y']-1))[3]==0
 return atlas.crop((r['x'],r['y'],r['x']+256,r['y']+256))
assert len(sheet['frames'])==80
for group,keys in sheet['animations'].items():
 assert len(keys)==8
 for key in keys:frame(key)
 if group!='empty':
  for i in range(4,8):
   diff=ImageChops.difference(frame(f'{group}/{i}'),frame(f'empty/{i}')).convert('RGB')
   assert diff.getbbox(),f'Missing baked native duck: {group}/{i}'
for key in ['hop','double','wall','underpass','roots','cart']:
 im=Image.open(folder/f'obstacle-{key}.webp');assert im.height>im.width,'Depth-facing model expected: '+key
print('PASS: six unique transparent frames, six depth-facing models, 80 padded whole-character frames with baked native duck in the net.')
