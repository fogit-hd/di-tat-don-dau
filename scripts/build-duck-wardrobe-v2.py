"""Bake the approved apparel for race, portraits and every podium animation.
Uses source pixel art and original approved motion; no new app dependency.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math
from duck_apparel_art import apparel, native, ART
import duck_award_apparel_art as awards
import duck_crown_apparel_art as winner

OUT=ART/'wardrobe-v2';OUT.mkdir(exist_ok=True)
ITEMS=['beanie','helmet','leaf','bow','tie','satchel','suit','worker']
HATS={'beanie','helmet','leaf'}
poses=sorted({k.rsplit('/',1)[0].split('/',1)[1] for k in json.loads((ART/'experience-v4/native.json').read_text())['frames'] if k.startswith('green/')})
atlas={};cells=[]
for item in ITEMS:
    for pose in poses:
        for frame in range(len(list((ART/f'duckee/green/{pose}').glob('*.png')))):
            im=apparel(item,pose,frame)
            key=f'{item}/{pose}/{frame}';i=len(cells);cells.append(im)
            atlas[key]={'frame':{'x':i%8*64,'y':i//8*64,'w':64,'h':64},'rotated':False,'trimmed':False,'sourceSize':{'w':64,'h':64},'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64}}
sheet=Image.new('RGBA',(512,math.ceil(len(cells)/8)*64))
for i,im in enumerate(cells):sheet.alpha_composite(im,(i%8*64,i//8*64))
sheet.save(OUT/'cosmetics.png',optimize=True)
(OUT/'cosmetics.json').write_text(json.dumps({'frames':atlas,'meta':{'image':'cosmetics.png','size':{'w':sheet.width,'h':sheet.height},'scale':'1'}}))

original_duck=awards.duck
current=''
def dressed_duck(color,pose='idle',frame=0,dressed=True,gesture=None,airborne=False):
    base=original_duck(color,pose,frame,False,gesture,airborne)
    if not dressed:return base
    untouched=native(pose,frame,color)
    result=base.copy();result.alpha_composite(apparel(current,pose,frame))
    # Original wings and tucked feet remain in front of apparel.
    for y in range(64):
        for x in range(64):
            if base.getpixel((x,y))!=untouched.getpixel((x,y)):result.putpixel((x,y),base.getpixel((x,y)))
    return result
awards.duck=dressed_duck
manifest=json.loads((ART/'results-v1/manifest.json').read_text())
specs={s['name']:s for s in manifest['sheets']}
names=['bronze-skate','silver-swing','winner-parachute','winner-stow','winner-coronation','winner-crowned-idle','idle']
def build(item,name,frame,dressed):
    global current
    current=item
    if name=='bronze-skate':return awards.bronze(frame,dressed)[0]
    if name=='silver-swing':return awards.silver(frame,dressed)[0]
    # Crown replaces a hat; fitted glasses are unchanged and still allowed with it.
    winner.SELECTED_ITEMS=[item] if dressed and item not in HATS else []
    if name=='winner-coronation':return winner.coronation(frame,dressed)[0]
    if name=='winner-crowned-idle':return winner.crowned_idle(frame,dressed)[0]
    if name=='idle':
        result=native('idle',frame).copy()
        if dressed:result.alpha_composite(apparel(item,'idle',frame))
        return result
    # These existing parachute/stow poses keep the native body at the same registered offset.
    spec=specs[name];cell=spec['cell'];columns=spec.get('columns',spec['frames'])
    source=Image.open(ART/f'results-v1/green/{name}.png').convert('RGBA')
    x=frame%columns*cell;y=frame//columns*cell
    result=source.crop((x,y,x+cell,y+cell))
    if dressed:
        layer=Image.new('RGBA',(cell,cell));layer.alpha_composite(apparel(item,'idle',0),(16,40))
        allowed=set(native().getdata())
        for y in range(cell):
            for x in range(cell):
                p=result.getpixel((x,y))
                if p[3] and p not in allowed:layer.putpixel((x,y),(0,0,0,0))
        result.alpha_composite(layer)
    return result

checked=0
for item in ITEMS:
    folder=OUT/'awards'/item;folder.mkdir(parents=True,exist_ok=True)
    for name in names:
        spec=specs[name] if name!='idle' else {'frames':4,'cell':64,'columns':4}
        count=spec['frames'];cell=spec['cell'];columns=spec.get('columns',count)
        overlay=Image.new('RGBA',(columns*cell,math.ceil(count/columns)*cell))
        for frame in range(count):
            before=build(item,name,frame,False);after=build(item,name,frame,True)
            layer=Image.new('RGBA',(cell,cell))
            for y in range(cell):
                for x in range(cell):
                    if before.getpixel((x,y))!=after.getpixel((x,y)):layer.putpixel((x,y),after.getpixel((x,y)))
            proof=before.copy();proof.alpha_composite(layer)
            assert proof.tobytes()==after.tobytes(),(item,name,frame,'foreground occlusion')
            overlay.alpha_composite(layer,(frame%columns*cell,frame//columns*cell));checked+=1
        overlay.save(folder/(name+'.png'),optimize=True)

# Registered native portraits used as selection icons, no unrelated stock thumbnails.
for item in ITEMS:
    im=native().copy();im.alpha_composite(apparel(item,'idle',0))
    im.crop((12,12,58,54)).resize((138,126),Image.Resampling.NEAREST).save(OUT/f'item-{item}.webp',lossless=True)
print(f'Baked {len(cells)} native apparel cels and verified {checked} podium cels.')
