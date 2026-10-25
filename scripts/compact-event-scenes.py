"""Dev-only GIF delta encoding. Preserve all 72 timings and verify decoded appearance.

GIF cannot clear a transparent pixel with retain/disposal=1. A tiny, stationary parchment
backing under the union of the motion silhouette makes delta rectangles safe (no trails).
On the game's parchment, the decoded result must match the source before replacement.
"""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, os
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'frontend/public/assets/ui/event-scenes-v2'
REPORT=ROOT/'design-preview/event-scenes-v2/compression.json'
TEMP=ROOT/'.tmp/event-scenes-compact'
TEMP.mkdir(parents=True,exist_ok=True)
PAPER=np.array([255,241,214],dtype=np.uint8)

def composite(frames):
    a=frames[:,:,:,3:4].astype(np.float32)/255
    return frames[:,:,:,:3]*a+PAPER*(1-a)

def compact(file):
    before=file.stat().st_size
    with Image.open(file) as im:
        count=im.n_frames
        palette=np.array(im.getpalette(),dtype=np.uint8).reshape(-1,3)
        if len(palette)<256:palette=np.pad(palette,((0,256-len(palette)),(0,0)))
        frames=[];duration=[]
        for i in range(count):
            im.seek(i);frames.append(np.array(im.convert('RGBA')));duration.append(im.info['duration'])
    rgba=np.stack(frames)
    opaque=rgba[:,:,:,3]>0
    union=opaque.any(axis=0)
    pixels=rgba[:,:,:,:3].astype(np.uint32)
    packed=pixels[:,:,:,0]*65536+pixels[:,:,:,1]*256+pixels[:,:,:,2]
    unique=np.unique(packed[opaque])
    assert len(unique)<254,(file,'Unexpected per-frame color palettes',len(unique))
    palette=np.zeros((256,3),dtype=np.uint8)
    palette[:len(unique)]=np.stack([unique>>16,(unique>>8)&255,unique&255],axis=1)
    indices=np.searchsorted(unique,packed).astype(np.uint8)
    paper_index=254
    palette[paper_index]=PAPER
    indices[~opaque & union[None,:,:]]=paper_index
    indices[:,~union]=255
    encoded=[]
    for frame in indices:
        image=Image.fromarray(frame).convert('P')
        image.putpalette(palette.reshape(-1).tolist())
        encoded.append(image)
    temp=TEMP/(file.stem+'.gif')
    encoded[0].save(temp,save_all=True,append_images=encoded[1:],duration=duration,
                    loop=0,transparency=255,disposal=1,optimize=True)
    with Image.open(temp) as check:
        assert check.info.get('loop')==0
        encoded_count=check.n_frames
        decoded=[]
        for i in range(encoded_count):
            check.seek(i);ms=check.info['duration'];assert ms%40==0
            decoded.extend([np.array(check.convert('RGBA'))]*(ms//40))
    logical=np.repeat(rgba,[ms//40 for ms in duration],axis=0)
    assert len(decoded)==len(logical)==72,(file,len(decoded),len(logical))
    delta=float(np.abs(composite(np.stack(decoded))-composite(logical)).max())
    assert delta<=1,(file,'Changed decoded picture',delta)
    after=temp.stat().st_size
    if after<before:os.replace(temp,file)
    else:temp.unlink();after=before
    return {'id':file.stem,'before':before,'after':after,'logicalFrames':len(logical),'encodedFrames':encoded_count,'maxParchmentPixelDifference':delta}

if __name__=='__main__':
    selected=os.environ.get('EVENT_SCENE_IDS','')
    files=[FOLDER/(id+'.gif') for id in selected.split(',')] if selected else sorted(FOLDER.glob('*.gif'))
    results=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(compact,files):
            results.append(row)
            if len(results)%100==0:print(f'Compacted {len(results)}/{len(files)}',flush=True)
    previous={row['id']:row for row in json.loads(REPORT.read_text('utf8'))} if REPORT.exists() else {}
    for row in results:
        row['before']=max(row['before'],previous.get(row['id'],{}).get('before',0))
        previous[row['id']]=row
    REPORT.write_text(json.dumps(list(previous.values()),indent=2),encoding='utf8')
    ledger=REPORT.parent/'generated.json'
    if ledger.exists():
        metadata=json.loads(ledger.read_text('utf8'))
        for row in results:metadata[row['id']]['bytes']=row['after']
        ledger.write_text(json.dumps(metadata,indent=2),encoding='utf8')
    print(json.dumps({'gifs':len(results),'before':sum(r['before'] for r in results),'after':sum(r['after'] for r in results),'maxParchmentPixelDifference':max(r['maxParchmentPixelDifference'] for r in results)},indent=2))
