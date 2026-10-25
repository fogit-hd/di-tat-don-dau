"""Read-only coverage, timing, actual animation and loop-seam audit of ALL event GIFs."""
from pathlib import Path
from concurrent.futures import ThreadPoolExecutor
import json, hashlib
import numpy as np
from PIL import Image

ROOT=Path(__file__).resolve().parents[1]
FOLDER=ROOT/'frontend/public/assets/ui/event-scenes-v2'
REVIEW=ROOT/'design-preview/event-scenes-v2'
catalog=json.loads((REVIEW/'catalog.json').read_text('utf8'))
ids=[e['id'] for e in catalog['entries']]+['context-'+e['id'] for e in catalog['contexts']]
assert len(ids)==len(set(ids))==1412
paper=np.array([255,241,214],dtype=np.float32)

def audit(id):
    file=FOLDER/(id+'.gif')
    assert file.is_file() and (FOLDER/(id+'-poster.webp')).is_file(),id
    with Image.open(file) as im:
        assert im.size==(96,96) and im.info.get('loop')==0,id
        count=im.n_frames
        frames=[];duration=[]
        for i in range(count):
            im.seek(i);ms=im.info['duration'];assert ms>=40 and ms%40==0,(id,ms)
            duration.append(ms)
            rgba=np.asarray(im.convert('RGBA'),dtype=np.float32)
            a=rgba[:,:,3:4]/255
            rgb=rgba[:,:,:3]*a+paper*(1-a)
            frames.extend([rgb]*(ms//40))
    assert len(frames)==72 and sum(duration)==2880,(id,len(frames),duration)
    steps=[float(np.abs(frames[i+1]-frames[i]).mean()) for i in range(71)]
    seam=float(np.abs(frames[-1]-frames[0]).mean());p90=float(np.percentile(steps,90))
    assert max(steps)>.002,(id,'Static image disguised as a GIF')
    assert seam<=p90*1.8+.04,(id,'Loop seam',seam,p90)
    with Image.open(FOLDER/(id+'-poster.webp')) as poster:assert poster.size==(96,96),id
    return {'id':id,'bytes':file.stat().st_size,'encodedFrames':count,'logicalFrames':72,'periodMs':2880,'seamMAE':round(seam,5),'ordinaryP90':round(p90,5),'sha256':hashlib.sha256(file.read_bytes()).hexdigest(),'passed':True}

if __name__=='__main__':
    results=[]
    with ThreadPoolExecutor(max_workers=4) as pool:
        for row in pool.map(audit,ids):
            results.append(row)
            if len(results)%100==0:print(f'Verified {len(results)}/{len(ids)}',flush=True)
    (REVIEW/'seam-report.json').write_text(json.dumps(results,indent=2),encoding='utf8')
    print(json.dumps({'passed':True,'gifs':len(results),'logicalFramesEach':72,'fps':25,'periodMs':2880,'totalBytes':sum(r['bytes'] for r in results),'maxSeamMAE':max(r['seamMAE'] for r in results)},indent=2))
