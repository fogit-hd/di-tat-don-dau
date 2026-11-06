"""Package approved V4 art; mechanically register accessories to native frames."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math, hashlib

ROOT=Path(__file__).resolve().parents[1]
OUT=ROOT/'frontend/public/assets/duck-race/experience-v4'
GEN=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
OUT.mkdir(parents=True,exist_ok=True)
sources={
 'landing':'exec-c0127fb5-32f7-4401-8a76-3a4990847954.png',
 'hero-title':'exec-d1a30904-f96d-4a44-a39b-877905a796a2.png',
 'invite':'exec-90abbb5b-b34a-4d1b-9306-861ff2f4e4ff.png',
 'plates':'exec-f88f8e78-2583-4b44-8b80-0805b661e244.png',
 'cosmetics':'exec-929f6d6a-2434-4ffa-a6a3-8b74e71a8a38.png',
}
def trim(im,threshold=8):
 alpha=im.getchannel('A');box=alpha.point(lambda a:255 if a>threshold else 0).getbbox()
 return im.crop(box) if box else im
for key in ['landing','hero-title','invite']:
 im=Image.open(GEN/sources[key]).convert('RGBA')
 if key!='landing':im=trim(im)
 limit=1920 if key=='landing' else 1600 if key=='hero-title' else 900
 if im.width>limit:im.thumbnail((limit,limit*2),Image.Resampling.LANCZOS)
 im.save(OUT/f'{key}.webp',quality=94,method=6)

sheet=Image.open(GEN/sources['plates']).convert('RGBA')
for i,key in enumerate(['paper','hud','amber','forest']):
 w,h=sheet.width//2,sheet.height//2
 plate=trim(sheet.crop((i%2*w,i//2*h,(i%2+1)*w,(i//2+1)*h)),32)
 plate.resize((512,512),Image.Resampling.LANCZOS).save(OUT/f'{key}.webp',quality=94,method=6)

gear_sheet=Image.open(GEN/sources['cosmetics']).convert('RGBA')
gear={}
for i,key in enumerate(['brass','dark','red','teal']):
 w,h=gear_sheet.width//2,gear_sheet.height//2
 im=gear_sheet.crop((i%2*w,i//2*h,(i%2+1)*w,(i//2+1)*h))
 # Reject the generated soft edge halo; no accessory glow is shipped.
 im.putalpha(im.getchannel('A').point(lambda a:255 if a>=180 else 0))
 im=trim(im,128);gear[key]=im
 preview=im.copy();preview.thumbnail((160,80),Image.Resampling.NEAREST);preview.save(OUT/f'gear-{key}.webp',lossless=True)

poses={'idle':4,'walk_run':4,'take_damage':2,'fall':1,'knockout':2,'land':2}
colors=['yellow','aqua','blue','green','orange','purple','red','tan']
native_root=ROOT/'frontend/public/assets/duck-race/duckee'
native=[];overlays=[];provenance=[]
body_colors={(64,142,47),(21,86,7),(128,197,113)}
beak_colors={(170,127,56),(236,198,135),(103,67,9)}
registrations={}
for pose,count in poses.items():
 for frame in range(count):
  base=Image.open(native_root/'green'/pose/f'{frame}.png').convert('RGBA');px=base.load()
  body=[(x,y)for y in range(64)for x in range(64)if px[x,y][3] and px[x,y][:3] in body_colors]
  cx=sum(x for x,y in body)/len(body);cy=sum(y for x,y in body)/len(body);top=min(y for x,y in body);bw=max(x for x,y in body)-min(x for x,y in body)+1
  beak=[(x,y)for y in range(64)for x in range(64)if px[x,y][3] and px[x,y][:3] in beak_colors and x>=cx and y<cy+6]
  by=sum(y for x,y in beak)/len(beak) if beak else cy+1
  registrations[f'{pose}/{frame}']={'head':[round(cx+2,2),top+2],'neck':[round(cx-1,2),round(by+3,2)],'backFacing':pose=='knockout' and len(beak)<8}
  for key,source in gear.items():
   glass=key in ['brass','dark'];width=round(min(21 if glass else 24,bw*(.78 if glass else .96)))
   height=max(5,round(source.height/source.width*width));item=source.resize((width,height),Image.Resampling.NEAREST)
   overlay=Image.new('RGBA',(64,64));x=round(cx+2-width*.65) if glass else round(cx-1-width*.58);y=round(top+2-height*.55) if glass else round(by+3-height*.45)
   overlay.alpha_composite(item,(x,y))
   op=overlay.load()
   for yy in range(64):
    for xx in range(64):
     # The actual native beak always occludes the collar/lenses.
     if px[xx,yy][3] and px[xx,yy][:3] in beak_colors:op[xx,yy]=(0,0,0,0)
     # Back-facing knockout frames show strap/tails outside the body, not front lenses.
     if pose=='knockout' and len(beak)<8 and glass and px[xx,yy][3]:op[xx,yy]=(0,0,0,0)
   overlays.append((f'{key}/{pose}/{frame}',overlay))
for color in colors:
 for pose,count in poses.items():
  for frame in range(count):
   path=native_root/color/pose/f'{frame}.png'
   native.append((f'{color}/{pose}/{frame}',Image.open(path).convert('RGBA')))
   provenance.append({'file':str(path.relative_to(ROOT)),'sha256':hashlib.sha256(path.read_bytes()).hexdigest()})
def atlas(items,name):
 cell=68;cols=16;im=Image.new('RGBA',(cols*cell,math.ceil(len(items)/cols)*cell));frames={}
 for i,(key,item)in enumerate(items):
  x=i%cols*cell+2;y=i//cols*cell+2;im.alpha_composite(item,(x,y))
  frames[key]={'frame':{'x':x,'y':y,'w':64,'h':64},'sourceSize':{'w':64,'h':64},'spriteSourceSize':{'x':0,'y':0,'w':64,'h':64},'trimmed':False,'rotated':False}
 im.save(OUT/f'{name}.png');(OUT/f'{name}.json').write_text(json.dumps({'frames':frames,'meta':{'image':name+'.png','size':{'w':im.width,'h':im.height},'scale':'1'}}),encoding='utf-8')
atlas(native,'native');atlas(overlays,'cosmetics')
(OUT/'registration.json').write_text(json.dumps(registrations,indent=2),encoding='utf-8')
(OUT/'sources.json').write_text(json.dumps({'sources':sources,'native':provenance,'note':'Native body pixels copied without repainting; fresh AI accessory art registered separately per frame. No equipment stat effects.'},ensure_ascii=False,indent=2),encoding='utf-8')
# QA contact sheet is outside production assets.
qa=ROOT/'design-preview/duck-race-experience-v4/implementation';qa.mkdir(parents=True,exist_ok=True)
board=Image.new('RGB',(900,len(poses)*142),'#203d30');d=ImageDraw.Draw(board);lookup=dict(overlays)
for row,(pose,count)in enumerate(poses.items()):
 d.text((6,row*142+5),pose,fill='#fff0c8')
 for f in range(count):
  base=Image.open(native_root/'green'/pose/f'{f}.png').convert('RGBA')
  base.alpha_composite(lookup[f'red/{pose}/{f}']);base.alpha_composite(lookup[f'brass/{pose}/{f}'])
  sample=base.resize((128,128),Image.Resampling.NEAREST);board.paste(sample,(150+f*150,row*142),sample)
board.save(qa/'cosmetic-registration.png')
print('V4: packaged 4 UI plates, landing/title/invite, 120 unchanged native frames and 60 frame-registered cosmetic overlays.')
