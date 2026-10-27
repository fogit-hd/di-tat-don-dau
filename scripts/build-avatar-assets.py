"""Build the approved whole-illustration avatars after the user's model-rig revert.
Every final avatar is a complete painted character, never assembled from limb layers.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json
from concurrent.futures import ThreadPoolExecutor
ROOT=Path(__file__).resolve().parents[1]
SOURCE=ROOT/'design-preview/avatar-v1'
OUTPUT=ROOT/'frontend/public/assets/avatars/v1'
BODIES=['slim-male','broad-male','slim-female','curvy-female']
SKINS=['ivory','peach','honey','tan','brown','deep']
OUTFITS=['shirt','suit','engineer','jacket','workwear','founder']
manifest=[]
def build_body(body):
    sheet=Image.new('RGB',(6*112,6*170),'#fff1cf')
    draw=ImageDraw.Draw(sheet)
    for row,skin in enumerate(SKINS):
        record=json.loads((SOURCE/f'source-{body}-{skin}.json').read_text(encoding='utf-8-sig'))
        atlas=Image.open(record['path']).convert('RGBA')
        w,h=atlas.size
        for i,outfit in enumerate(OUTFITS):
            col,gridrow=i%3,i//3
            cell=(round(col*w/3),round(gridrow*h/2),round((col+1)*w/3),round((gridrow+1)*h/2))
            sprite=atlas.crop(cell)
            bbox=sprite.getchannel('A').point(lambda a:255 if a>12 else 0).getbbox()
            if not bbox or bbox[3]-bbox[1]<h*.3:raise ValueError(f'Incomplete {body}/{skin}/{outfit}: {bbox}')
            l,t,r,b=bbox
            sprite=sprite.crop((max(0,l-6),max(0,t-6),min(sprite.width,r+6),min(sprite.height,b+6)))
            figure=sprite.copy()
            figure=figure.resize((round(figure.width*600/figure.height),600),Image.Resampling.LANCZOS)
            canvas=Image.new('RGBA',(400,640),(0,0,0,0))
            canvas.alpha_composite(figure,((400-figure.width)//2,28))
            folder=OUTPUT/body/skin;folder.mkdir(parents=True,exist_ok=True)
            canvas.save(folder/f'{outfit}.webp',quality=90,method=3)
            portrait=sprite.crop((0,0,sprite.width,round(sprite.height*.43)))
            portrait.save(folder/f'{outfit}-portrait.webp',quality=91,method=3)
            thumb=canvas.copy();thumb.thumbnail((100,146),Image.Resampling.LANCZOS)
            sheet.paste(thumb,(i*112+(112-thumb.width)//2,row*170+22),thumb)
            draw.text((i*112+3,row*170+4),f'{skin}/{outfit}',fill='#501c12')
            manifest.append({'body':body,'skin':skin,'outfit':outfit,'source':record['path'],'cell':cell,'bbox':bbox,'bytes':(folder/f'{outfit}.webp').stat().st_size})
    sheet.save(SOURCE/f'contact-{body}.jpg',quality=94)
with ThreadPoolExecutor(max_workers=4) as executor:
    list(executor.map(build_body,BODIES))
(SOURCE/'asset-manifest.json').write_text(json.dumps(manifest,indent=2),encoding='utf-8')
print(json.dumps({'characters':len(manifest),'files':len(manifest)*2,'bodyBytes':sum(x['bytes'] for x in manifest),'render':'whole painted images, no rig'}))

