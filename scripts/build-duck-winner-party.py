"""Review-only complete native-pixel cels. No runtime animation is replaced."""
from pathlib import Path
import sys, math, json
from PIL import Image, ImageDraw, ImageFont

ROOT=Path(__file__).resolve().parents[1]
sys.path.insert(0,str(ROOT/'scripts'))
from duck_apparel_art import native, apparel, gear, BILL
from duck_wardrobe_art import fitted_crown
import duck_crown_apparel_art as awards

OUT=HERE/'assets';OUT.mkdir(exist_ok=True)
PRESETS=[('helmet','Mũ bảo hộ · khăn đỏ',['helmet','red']),
         ('beanie','Mũ len · khăn ngọc',['beanie','teal']),
         ('leaf','Ghim lá · nơ cổ',['leaf','bow']),
         ('glasses','Kính đồng · khăn đỏ',['brass','red']),
         ('worker','Bộ công nhân',['worker']),('suit','Bộ vét',['suit'])]
HATS={'helmet','beanie','leaf'}

def body(items):
    image=native()
    for item in items:image.alpha_composite(apparel(item,'idle',0))
    return image

def cel(image):
    out=Image.new('RGBA',(96,96));out.alpha_composite(image,(16,40));return out

def remove_hat(frame,items):
    hat=next((item for item in items if item in HATS),None)
    if not hat:return cel(body(items))
    image=body([item for item in items if item!=hat])
    overlay,_=gear(hat,'idle',0,native())
    t=frame/35
    # Grip at the left brim, lift a short distance, then stow behind the torso.
    if t<.25:
        p=t/.25;dx=dy=0;grip=(round(23-1*p),round(40-9*p))
    elif t<.55:
        p=(t-.25)/.3;dx=round(-5*p);dy=round(-4*p);grip=(22+dx,31+dy)
    elif t<.87:
        p=(t-.55)/.32;dx=round(-5-5*p);dy=round(-4+15*p);grip=(22+dx,31+dy)
    else:
        p=(t-.87)/.13;dx=-10;dy=11;grip=(round(12+12*p),round(42-2*p))
    if t>=.55:
        behind=Image.new('RGBA',(64,64))
        behind.alpha_composite(overlay,(dx,dy));behind.alpha_composite(image);image=behind
    else:image.alpha_composite(overlay,(dx,dy))
    if t<1:awards.wing(image,'left',grip)
    return cel(image)

def dance(frame,style,items):
    t=frame/95
    envelope=min(1,t*8,(1-t)*8)
    phase=t*math.tau*4
    image=body([item for item in items if item not in HATS])
    # The original head and torso retain their exact size. Feet are redrawn per cel.
    image.paste((0,0,0,0),(0,46,64,64))
    d=ImageDraw.Draw(image)
    if style=='shuffle':
        left=round(3*math.sin(phase)*envelope)
        right=-left
        lift_l=round(3*max(0,math.sin(phase))*envelope)
        lift_r=round(3*max(0,-math.sin(phase))*envelope)
        hands=((22,round(39+2*math.sin(phase)*envelope)),(40,round(39-2*math.sin(phase)*envelope)))
    elif style=='heel-toe':
        left=round(3*math.sin(phase)*envelope);right=round(2*math.sin(phase)*envelope)
        lift_l=round(2*max(0,math.sin(phase))*envelope);lift_r=round(2*max(0,-math.sin(phase))*envelope)
        hands=((round(22-2*math.cos(phase)*envelope),38),(round(40+2*math.cos(phase)*envelope),38))
    else:
        left=round(math.sin(phase)*envelope);right=-left
        lift_l=round(2*max(0,math.sin(phase))*envelope);lift_r=round(2*max(0,-math.sin(phase))*envelope)
        hands=((round(22-3*envelope),round(39-5*max(0,math.sin(phase))*envelope)),
               (round(40+3*envelope),round(39-5*max(0,-math.sin(phase))*envelope)))
    for x,offset,lift in [(26,left,lift_l),(36,right,lift_r)]:
        d.line((x,44,x+offset,47-lift),fill='#674309',width=2)
        d.polygon([(x+offset-2,47-lift),(x+offset+3,47-lift),(x+offset+5,48-lift),(x+offset-3,48-lift)],fill='#aa7f38',outline='#674309')
    if envelope>.01:
        awards.wing(image,'left',hands[0]);awards.wing(image,'right',hands[1])
    # Native bill occludes the near wing, as it does in the original model.
    raw=native()
    for y in range(43):
        for x in range(64):
            if raw.getpixel((x,y))[:3] in BILL:image.putpixel((x,y),raw.getpixel((x,y)))
    fitted_crown(image,31,31,12,6)
    # Endpoints match precisely, with both feet planted, for all three clips.
    return cel(image)


OUT=ROOT/'frontend/public/assets/duck-race/winner-party-v1'
OUT.mkdir(exist_ok=True)
clips={'winner-hat':36,'winner-shuffle':96,'winner-heel-toe':96,'winner-wing-pop':96}
items=['brass','dark','beanie','helmet','leaf','red','teal','bow','tie','satchel','suit','worker']
base={}
for clip,count in clips.items():
    base[clip]=[remove_hat(i,[]) if clip=='winner-hat' else dance(i,clip.removeprefix('winner-'),[]) for i in range(count)]
for colour in ['green','yellow','aqua','blue','orange','purple','red','tan']:
    sample=native(colour=colour);original=native();mapping={}
    for y in range(64):
        for x in range(64):
            a=original.getpixel((x,y));b=sample.getpixel((x,y))
            if a[3] and a!=b:mapping[a]=b
    for clip,frames in base.items():
        sheet=Image.new('RGBA',(1152,math.ceil(len(frames)/12)*96))
        for i,im in enumerate(frames):
            im=im.copy();im.putdata([mapping.get(pixel,pixel) for pixel in im.getdata()]);sheet.alpha_composite(im,(i%12*96,i//12*96))
        folder=OUT/colour;folder.mkdir(exist_ok=True);sheet.save(folder/f'{clip}.png')
for item in items:
    for clip,count in clips.items():
        sheet=Image.new('RGBA',(1152,math.ceil(count/12)*96))
        for i in range(count):
            dressed=remove_hat(i,[item]) if clip=='winner-hat' else dance(i,clip.removeprefix('winner-'),[item])
            raw=base[clip][i];layer=Image.new('RGBA',(96,96))
            layer.putdata([a if a!=b else (0,0,0,0) for a,b in zip(dressed.getdata(),raw.getdata())]);sheet.alpha_composite(layer,(i%12*96,i//12*96))
        folder=OUT/'apparel'/item;folder.mkdir(parents=True,exist_ok=True);sheet.save(folder/f'{clip}.png')
print('Approved winner party runtime sheets exported')

