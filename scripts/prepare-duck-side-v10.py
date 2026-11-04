"""Prepare the generated side-view painting; no application dependency required."""
from pathlib import Path
from PIL import Image
import json
ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-121d218e-af50-40f0-ac73-6876a0f2659b.png')
OUT=ROOT/'frontend/public/assets/duck-race/side-v10'
OUT.mkdir(parents=True,exist_ok=True)
im=Image.open(SOURCE).convert('RGB')
# Keep a narrow, horizontal grass running strip between y=410 and y=590.
# The far horizon is above it, the cutaway soil below it: never an open RPG floor.
sx=im.width/1774;sy=im.height/887
cut1,cut2=round(600*sy),round(670*sy)
canvas=Image.new('RGB',(1600,900))
for crop,top,height in [((0,0,im.width,cut1),0,410),((0,cut1,im.width,cut2),410,180),((0,cut2,im.width,im.height),590,310)]:
 canvas.paste(im.crop(crop).resize((1600,height),Image.Resampling.LANCZOS),(0,top))
canvas.save(OUT/'countryside.webp',quality=92)
(OUT/'provenance.json').write_text(json.dumps({'source':str(SOURCE),'tool':'image_gen','layout':'side elevation, horizontal bounded running strip','groundCenter':500,'groundBounds':[444,556],'size':[1600,900]},ensure_ascii=False,indent=2),encoding='utf8')
print(OUT/'countryside.webp')
