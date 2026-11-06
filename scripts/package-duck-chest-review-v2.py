"""Register common-form chest skins against one geometry master.

Packaging only: does not paint pixels or implement game rewards.
"""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SRC = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
manifest = json.loads((ROOT/'design-preview/duck-race-eras-v2/sources.json').read_text(encoding='utf-8'))
OUT = ROOT/'frontend/public/assets/duck-race/eras-v2'
OUT.mkdir(parents=True,exist_ok=True)
master=Image.open(SRC/manifest['chests']['safe']).convert('RGBA')
cw,ch=master.width//3,master.height//2
references=[]
for i in range(6):
    cell=master.crop((i%3*cw,i//3*ch,(i%3+1)*cw,(i//3+1)*ch))
    region=cell.getchannel('A').crop((0,int(ch*.65),cw,ch)).point(lambda a:255 if a>180 else 0)
    box=region.getbbox()
    references.append({'center':(box[0]+box[2])/2,'base':int(ch*.65)+box[3],'width':box[2]-box[0]})
factor=246/references[0]['width']
geometry={'frameWidth':384,'frameHeight':384,'groundAnchor':[192,364], 'reference':'safe master for ALL skins','frames':references,'scale':factor,'skins':{}}
closed_box=None
for name,filename in manifest['chests'].items():
    atlas=Image.open(SRC/filename).convert('RGBA')
    if atlas.size!=master.size:raise ValueError('Common-form edits must preserve master atlas size')
    dest=OUT/'chests'/name;dest.mkdir(parents=True,exist_ok=True)
    for i,ref in enumerate(references):
        cell=atlas.crop((i%3*cw,i//3*ch,(i%3+1)*cw,(i//3+1)*ch))
        scaled=cell.resize((round(cw*factor),round(ch*factor)),Image.Resampling.LANCZOS)
        frame=Image.new('RGBA',(384,384))
        frame.alpha_composite(scaled,(round(192-ref['center']*factor),round(364-ref['base']*factor)))
        frame.save(dest/f'{i}.webp',lossless=True,method=6)
        if i==0:
            if name=='safe':
                x1,y1,x2,y2=frame.getchannel('A').point(lambda a:255 if a>80 else 0).getbbox()
                closed_box=(max(0,x1-14),max(0,y1-14),min(384,x2+14),min(384,y2+14))
            frame.crop(closed_box).save(dest/'closed.webp',lossless=True,method=6)
    geometry['skins'][name]={'source':filename,'frames':6,'closedCrop':closed_box}
for key,name in [('dust','dust-atlas'),('chestFx','chest-fx')]:
    Image.open(SRC/manifest[key]).convert('RGBA').save(OUT/f'{name}.webp',lossless=True,method=6)
(OUT/'chest-registration.json').write_text(json.dumps(geometry,indent=2),encoding='utf-8')

preview=ROOT/'design-preview/duck-race-eras-v2/assets'
preview.mkdir(parents=True,exist_ok=True)
old=ROOT/'design-preview/duck-race-eras-v1/assets'
for path in old.iterdir():
    if path.name=='eras-v1':continue
    if path.is_dir():shutil.copytree(path,preview/path.name,dirs_exist_ok=True)
    else:shutil.copy2(path,preview/path.name)
shutil.copytree(OUT,preview/'eras-v2',dirs_exist_ok=True)
print('Registered3 skins on the same master,18 opening frames, painted dust/FX; copied review-only assets')
