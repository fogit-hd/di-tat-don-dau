"""Crop six generated 2x2 boards into 24 independent sequential panoramas."""
from pathlib import Path
from PIL import Image
import json,shutil
root=Path(__file__).resolve().parents[1]
preview=root/'design-preview/duck-race-eras-v3'
spec=json.loads((preview/'scroll-sources-v4.json').read_text(encoding='utf-8'))
source=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
out=root/'frontend/public/assets/duck-race/scroll-v4';out.mkdir(parents=True,exist_ok=True)
for era in spec['eras']:
    atlas=Image.open(source/era['source']).convert('RGB')
    target=out/str(era['id']);target.mkdir(exist_ok=True)
    for i in range(4):
        left=round(i%2*atlas.width/2);top=round(i//2*atlas.height/2)
        right=round((i%2+1)*atlas.width/2);bottom=round((i//2+1)*atlas.height/2)
        # Trim the single grid-divider pixel; do not repaint or invent scenery.
        tile=atlas.crop((left+1,top+1,right-1,bottom-1))
        tile.save(target/f'scene-{i+1}.webp',quality=91,method=6)
    era['files']=[f"{era['id']}/scene-{i+1}.webp" for i in range(4)]
smoke=Image.open(source/spec['smoke']).convert('RGBA')
smoke.save(out/'smoke-atlas.webp',lossless=True,method=6)
(out/'manifest.json').write_text(json.dumps(spec,ensure_ascii=False,indent=2),encoding='utf-8')
shutil.copytree(out,preview/'assets/scroll-v4',dirs_exist_ok=True)
print('Packaged 24 panorama tiles + separate smoke atlas into project and review assets')
