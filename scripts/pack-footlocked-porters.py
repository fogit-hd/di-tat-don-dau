"""Pack complete painted poses with a stable torso camera and boot floor.
Sole measurements determine physical stride, never a per-frame camera origin.
Moving a whole standing sprite is not a substitute for a step or turn.
No limbs are separated or interpolated.
"""
from pathlib import Path
import json
import numpy as np
from PIL import Image, ImageDraw
from sprite_pack_utils import components, isolate, hip, brown_box
CELL, REF, AX, AY = 384, 240, 192, 288

def register(im,scale,rx,ground):
    scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    result=Image.new('RGBA',(CELL,CELL));result.alpha_composite(scaled,(round(AX-rx*scale),round(AY-ground*scale)))
    return result

ROOT=Path(__file__).resolve().parents[1]
SOURCE=Path.home()/'.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc'
OUT=ROOT/'frontend/public/assets/living-hero-v4'
QA=ROOT/'design-preview/living-hero-v4'
OUT.mkdir(exist_ok=True);QA.mkdir(exist_ok=True)
IDS={'carry':'7024744b-b82b-48be-ab1e-a957592da4fb','return':'67038f45-331f-46ff-ade5-c5208ce78486','turn':'aecd192d-91b0-44da-9313-0d79518981d6','pivot':'d54cdffc-915b-4a06-9776-52ff0a0938d6','setdown':'769904a9-2adb-4c1b-9fd7-68a2a808825e'}
meta=json.loads((ROOT/'frontend/src/lib/porter-sprites.json').read_text())
meta['sources'].update(IDS)

def sole(im,front):
    a=np.asarray(im);bounds=im.getchannel('A').getbbox();l,t,r,b=bounds;top=int(t+(b-t)*.76)
    # Brown leather separates boots from denim; whole connected boots only.
    rgb=a[:,:,:3].astype(float)
    mask=(rgb[:,:,0]>rgb[:,:,1]*1.10)&(rgb[:,:,1]>rgb[:,:,2]*1.10)&(a[:,:,3]>100)
    mask[:top]=False
    boot=im.copy();boot.putalpha(Image.fromarray((mask*255).astype('uint8')))
    groups=[g for g in components(boot) if g['area']>300]
    if len(groups)>1:
        group=(max if front else min)(groups,key=lambda g:sum(g['bounds'][::2])/2)
        x0,_,x1,_=group['bounds'];x0=max(0,x0-3);x1=min(im.width,x1+3)
    else:
        x0,x1=l,r
    ys,xs=np.where(a[top:b,x0:x1,3]>128)
    low=int(ys.max()+top);contact=xs[ys>=ys.max()-2]+x0
    return float(np.median(contact)),low+1

for name in IDS:
    sheet=Image.open(SOURCE/f'exec-{IDS[name]}.png').convert('RGBA')
    rows=4 if name in ['carry','return'] else 2;count=rows*4
    cells=[sheet.crop((round(i%4*sheet.width/4),round(i//4*sheet.height/rows),round((i%4+1)*sheet.width/4),round((i//4+1)*sheet.height/rows))) for i in range(count)]
    first=components(cells[0])[0]['bounds'];scale=REF/(first[3]-first[1]);static_x=hip(cells[0],first)
    atlas=Image.new('RGBA',(CELL*4,CELL*rows));frames=[];contacts=[];hip_offsets=[];grips=[]
    for i,cell in enumerate(cells):
        parts=components(cell);body=parts[0]['bounds'];ground=max(p['bounds'][3] for p in parts);s=scale;rx=static_x;picture=cell
        if name in ['carry','return']:
            front=i%8<4
            # Measure the stance candidate for stride only. The rendered floor
            # uses the lowest complete boot, never a lifted swing-foot sole.
            rx,_=sole(cell,front)
            hip_offsets.append((static_x-rx)*scale/REF)
            if name=='carry':
                box=brown_box(cell);grips.append([((box[0]+box[2])/2-rx)*scale/REF,(box[3]-ground)*scale/REF])
        elif name in ['turn','pivot']:
            rx=hip(cell,body)
        elif name=='setdown' and i>=6:
            actor=min((p for p in parts if p['area']>2000),key=lambda p:sum(p['bounds'][::2])/2)
            picture=isolate(cell,actor);ground=actor['bounds'][3]
            # One uniform scale for the late-row camera, not per-limb rigging.
            s=REF/(actor['bounds'][3]-actor['bounds'][1])
        # Register the complete walking camera to a fixed torso origin. The
        # sole annotations measure stride; re-centering the camera on whichever
        # boot is lowest would make the torso snap when support changes legs.
        frame=register(picture,s,static_x if name in ['carry','return'] else rx,ground)
        b=frame.getchannel('A').getbbox();assert b and b[0]>0 and b[1]>0 and b[2]<CELL and b[3]<CELL,(name,i,b)
        if name in ['carry','return']:
            solid=frame.getchannel('A').point(lambda a:255 if a>64 else 0).getbbox()
            assert solid and abs(solid[3]-AY)<=2,(name,i,'boot floor',solid)
        atlas.alpha_composite(frame,((i%4)*CELL,(i//4)*CELL))
        frames.append({'rect':[i%4*CELL,i//4*CELL,CELL,CELL]})
        contacts.append([round((rx-static_x)*scale/REF,4),round(ground,2)])
    atlas.save(OUT/f'{name}.webp',quality=93,method=6)
    clip={'src':f'/assets/living-hero-v4/{name}.webp','frames':frames,'sourceScale':scale,'anchor':[AX,AY],'referenceHeight':REF}
    if name in ['carry','return']:
        direction=1 if name=='carry' else -1
        step=abs(float(np.mean([hip_offsets[7]-hip_offsets[0],hip_offsets[15]-hip_offsets[8]])))+.035
        clip.update({'distanceMatched':True,'facing':direction,'mirrorX':name=='return','stepLength':step,'stride':step*2,'hipOffsets':[0]*16,'contacts':contacts})
        if grips:
            box=brown_box(cells[0]);meta['carryGrip']=[((box[0]+box[2])/2-static_x)*scale/REF,(box[3]-first[3])*scale/REF]
            clip['grips']=grips
    meta['clips'][name]=clip
    if name=='setdown':
        box=brown_box(cells[0]);meta['setdownGrip']=[((box[0]+box[2])/2-static_x)*scale/REF,(box[3]-first[3])*scale/REF]
        final=cells[7];parts=components(final)
        actor=min((p for p in parts if p['area']>2000),key=lambda p:sum(p['bounds'][::2])/2)
        parcel=max((p for p in parts if p['area']>1500),key=lambda p:sum(p['bounds'][::2])/2)
        l,t,r,b=parcel['bounds'];pad=3;cut=isolate(final,parcel).crop((l-pad,t-pad,min(final.width,r+pad),min(final.height,b+pad)))
        cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS);cut.save(OUT/'parcel.webp',quality=95,method=6)
        meta['parcel']={'width':cut.width,'height':cut.height,'bottom':cut.height-pad*scale,'hook':[cut.width/2,pad*scale],'bodyTop':.56,'referenceHeight':REF,'offset':[((l+r)/2-static_x)*scale/REF,(b-actor['bounds'][3])*scale/REF]}
        late=REF/(actor['bounds'][3]-actor['bounds'][1]);meta['returnOffset']=(hip(isolate(final,actor),actor['bounds'])-static_x)*late/REF
    review=Image.new('RGBA',atlas.size,'#fff1d6');review.alpha_composite(atlas)
    draw=ImageDraw.Draw(review)
    for i in range(count):
        x=(i%4)*CELL+AX;y=(i//4)*CELL+AY
        draw.line((x-8,y,x+8,y),fill='red',width=2)
    review.thumbnail((1000,1000));review.convert('RGB').save(QA/f'{name}-review.jpg',quality=94)

(ROOT/'frontend/src/lib/porter-sprites-v4.json').write_text(json.dumps(meta,separators=(',',':'))+'\n',encoding='utf-8')
(OUT/'porter.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
print(json.dumps({n:{k:v for k,v in c.items() if k in ['stepLength','hipOffsets','contacts']} for n,c in meta['clips'].items() if n in ['carry','return']}))
