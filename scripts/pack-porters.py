"""Pack complete ImageGen poses and register feet/hips. No limb rig or redrawing.
Connected components separate the already-disconnected whole porter and parcel
in the release poses. All selected production assets remain local.
"""
from pathlib import Path
import json
from statistics import median
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path.home() / '.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc'
OUT = ROOT / 'frontend/public/assets/living-hero-v3'
QA = ROOT / 'design-preview/living-hero-v3'
OUT.mkdir(parents=True, exist_ok=True)
QA.mkdir(parents=True, exist_ok=True)
IDS = {'carry':'d0964230-1eef-42b2-9f6b-dcfa4def16f1','setdown':'5e5d437a-720f-4690-a247-9b4a142ea0ce','return':'2b2efecb-092a-4d1f-a735-5306d804eeb2','receiver':'6d3c1e55-7c07-45d2-acd8-7798d230f05f','scene-desktop':'5c27cd28-551c-4a4e-a569-c31e84552d79','scene-mobile':'c3767483-bfa8-4da0-90e1-991f35edcd56','truck':'812a6ca1-1041-44a5-bf3e-af1797576077'}
CELL, REF, AX, AY = 576, 430, 272, 480

def source(name):
    return Image.open(SOURCE / ('exec-' + IDS[name] + '.png')).convert('RGBA')

def components(im):
    a = np.asarray(im)[:,:,3] > 64
    parents, runs, prev = [], [], []
    def find(i):
        while parents[i] != i:
            parents[i] = parents[parents[i]]
            i = parents[i]
        return i
    for y,row in enumerate(a):
        edges = np.flatnonzero(np.diff(np.r_[False,row,False]))
        now=[]
        for left,right in zip(edges[::2],edges[1::2]):
            n=len(parents);parents.append(n);runs.append((y,int(left),int(right),n));now.append((left,right,n))
            for pl,pr,pn in prev:
                if pr >= left and pl <= right:
                    parents[find(n)] = find(pn)
        prev=now
    groups={}
    for y,l,r,n in runs: groups.setdefault(find(n),[]).append((y,l,r))
    result=[]
    for group in groups.values():
        area=sum(r-l for _,l,r in group)
        if area<300: continue
        result.append({'bounds':[min(l for _,l,_ in group),min(y for y,_,_ in group),max(r for _,_,r in group),max(y for y,_,_ in group)+1], 'area':area,'runs':group})
    return sorted(result,key=lambda g:-g['area'])

def isolate(im, component):
    mask=Image.new('L',im.size);p=ImageDraw.Draw(mask)
    for y,l,r in component['runs']:p.line((l,y,r-1,y),fill=255)
    mask=mask.filter(ImageFilter.MaxFilter(5))
    copy=im.copy();copy.putalpha(ImageChops.multiply(im.getchannel('A'),mask));return copy

def hip(im,bounds):
    x0,y0,x1,y1=bounds;a=np.asarray(im);h=y1-y0
    top,bottom=int(y0+h*.49),int(y0+h*.64)
    rgb=a[top:bottom,:,:3].astype(float);alpha=a[top:bottom,:,3]
    blue=(rgb[:,:,2]>rgb[:,:,0]*1.06)&(rgb[:,:,2]>rgb[:,:,1]*.94)&(rgb[:,:,0]<155)&(alpha>128)
    _,xs=np.where(blue)
    return float(np.median(xs)) if len(xs)>30 else (x0+x1)/2

def brown_box(im):
    a=np.asarray(im);rgb=a[:,:,:3].astype(float);hh,ww=a.shape[:2]
    m=(rgb[:,:,0]>90)&(rgb[:,:,0]>rgb[:,:,1]*1.10)&(rgb[:,:,1]>rgb[:,:,2]*1.25)&(a[:,:,3]>128)
    m[:int(hh*.30),:]=False;m[int(hh*.61):,:]=False;m[:,:int(ww*.43)]=False
    ys,xs=np.where(m)
    return [int(np.percentile(xs,2)),int(np.percentile(ys,2)),int(np.percentile(xs,98)),int(np.percentile(ys,98))]

def placed(im,scale,rx,ground):
    scaled=im.resize((round(im.width*scale),round(im.height*scale)),Image.Resampling.LANCZOS)
    result=Image.new('RGBA',(CELL,CELL))
    result.alpha_composite(scaled,(round(AX-rx*scale),round(AY-ground*scale)))
    return result

meta={'referenceHeight':REF,'anchor':[AX,AY],'cell':CELL,'clips':{},'sources':IDS}
source_cells={}
for name in ['carry','setdown','return','receiver']:
    sheet=source(name);cells=[]
    for i in range(8):
        col,row=i%4,i//4
        cells.append(sheet.crop((round(col*sheet.width/4),round(row*sheet.height/2),round((col+1)*sheet.width/4),round((row+1)*sheet.height/2))))
    source_cells[name]=cells
    first=components(cells[0])[0];b=first['bounds'];scale=REF/(b[3]-b[1]);static_x=hip(cells[0],b)
    atlas=Image.new('RGBA',(CELL*4,CELL*2));frames=[]
    for i,cell in enumerate(cells):
        parts=components(cell);bounds=parts[0]['bounds'];ground=max(p['bounds'][3] for p in parts)
        rx=hip(cell,bounds) if name in ['carry','return'] else static_x
        if name=='setdown' and i>=6:
            # Late release poses already have a clear gap. Register the ENTIRE
            # standing actor to the reference height, without changing limbs.
            actor=min((p for p in parts if p['area']>2000),key=lambda p:(p['bounds'][0]+p['bounds'][2])/2)
            h=actor['bounds'][3]-actor['bounds'][1]
            frame=placed(isolate(cell,actor),REF/h,rx,actor['bounds'][3])
        else:
            frame=placed(cell,scale,rx,ground)
        atlas.alpha_composite(frame,((i%4)*CELL,(i//4)*CELL));frames.append({'rect':[(i%4)*CELL,(i//4)*CELL,CELL,CELL]})
    # Raised receiving arms need extra left padding. Reject any clipped pose,
    # rather than allowing an adjacent atlas frame to bleed into the replay.
    for i in range(8):
        b=atlas.crop(((i%4)*CELL,(i//4)*CELL,(i%4+1)*CELL,(i//4+1)*CELL)).getchannel('A').getbbox()
        assert b and b[0]>0 and b[1]>0 and b[2]<CELL and b[3]<CELL,(name,i,b)
    atlas.save(OUT/(name+'.webp'),quality=93,method=6)
    meta['clips'][name]={'src':'/assets/living-hero-v3/'+name+'.webp','frames':frames,'sourceScale':scale}
    if name=='carry':
        box=brown_box(cells[0]);ground=components(cells[0])[0]['bounds'][3];rx=hip(cells[0],components(cells[0])[0]['bounds'])
        meta['carryGrip']=[((box[0]+box[2])/2-rx)*scale/REF,(box[3]-ground)*scale/REF]
    if name=='setdown':
        box=brown_box(cells[0]);meta['setdownGrip']=[((box[0]+box[2])/2-static_x)*scale/REF,(box[3]-components(cells[0])[0]['bounds'][3])*scale/REF]
        final=source_cells[name][7];parts=components(final)
        parcel=max((p for p in parts if p['area']>1500),key=lambda p:(p['bounds'][0]+p['bounds'][2])/2)
        l,t,r,b=parcel['bounds'];cut=isolate(final,parcel).crop((max(0,l-3),max(0,t-3),min(final.width,r+3),min(final.height,b+3)))
        cut=cut.resize((round(cut.width*scale),round(cut.height*scale)),Image.Resampling.LANCZOS);cut.save(OUT/'parcel.webp',quality=95,method=6)
        meta['parcel']={'width':cut.width,'height':cut.height,'bottom':cut.height-3*scale,'hook':[cut.width/2,3*scale],'bodyTop':.54,'offset':[((l+r)/2-static_x)*scale/REF,0]}
        actor=min((p for p in parts if p['area']>2000),key=lambda p:(p['bounds'][0]+p['bounds'][2])/2)
        endscale=REF/(actor['bounds'][3]-actor['bounds'][1]);endhip=hip(isolate(final,actor),actor['bounds'])
        meta['returnOffset']=(endhip-static_x)*endscale/REF
    if name=='receiver':
        # Contact pose: the leftmost fingertip at the end of the raised arms.
        contact=cells[2];a=np.asarray(contact);alpha=a[:,:,3]>128;hh,ww=alpha.shape
        yy,xx=np.where(alpha[:int(hh*.37),:int(ww*.45)])
        hand_x=float(np.percentile(xx,3));hand_y=float(np.median(yy[xx<hand_x+12]));ground=components(contact)[0]['bounds'][3]
        meta['receiverContact']=[(hand_x-static_x)*scale/REF,(hand_y-ground)*scale/REF]
    # Review all whole-body cells over cream, at real-ish game display size.
    review=Image.new('RGB',(CELL*4,CELL*2),'#fff1d6');review.paste(atlas,mask=atlas.getchannel('A'));review.thumbnail((1024,512));review.save(QA/(name+'-review.jpg'),quality=95)

for name in ['scene-desktop','scene-mobile']:
    source(name).convert('RGB').save(OUT/(name+'.webp'),quality=91,method=6)

truck=source('truck');truck=truck.crop(truck.getchannel('A').getbbox());truck.thumbnail((1000,1000))
padded=Image.new('RGBA',(truck.width+16,truck.height+16));padded.alpha_composite(truck,(8,8));padded.save(OUT/'truck.webp',quality=93,method=6)

# Mechanical hook crop reuses the current painted metal prop, no new design.
hook=Image.open(ROOT/'frontend/public/assets/living-hero-v1/hoist.webp').convert('RGBA')
hook.crop((round(hook.width*.385),0,round(hook.width*.615),round(hook.height*.27))).save(OUT/'hook.webp',quality=95,method=6)
(OUT/'porter.json').write_text(json.dumps(meta,indent=2)+'\n',encoding='utf-8')
(ROOT/'frontend/src/lib/porter-sprites.json').write_text(json.dumps(meta,separators=(',',':'))+'\n',encoding='utf-8')
print(json.dumps({k:v for k,v in meta.items() if k!='clips'}))
