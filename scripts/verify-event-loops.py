"""Read-only QA: decode every GIF and compare the loop seam with ordinary frame steps."""
import json
from pathlib import Path
import numpy as np
from PIL import Image

root=Path(__file__).resolve().parents[1]
folder=root/'frontend/public/assets/ui/event-loops-v1'
manifest=json.loads((folder/'manifest.json').read_text(encoding='utf-8'))
assert len(manifest['icons'])==33
results=[]
for kind,spec in manifest['icons'].items():
    with Image.open(folder/spec['gif']) as im:
        assert im.n_frames==72,(kind,im.n_frames)
        assert im.info.get('loop')==0,(kind,'not infinite')
        frames=[];durations=[]
        for index in range(im.n_frames):
            im.seek(index);durations.append(im.info.get('duration'))
            rgba=np.asarray(im.convert('RGBA'),dtype=np.float32)
            alpha=rgba[:,:,3:4]/255
            # Compare what users see on parchment, not irrelevant RGB hidden behind alpha zero.
            rgb=rgba[:,:,:3]*alpha+np.asarray([255,241,214],dtype=np.float32)*(1-alpha)
            frames.append(rgb)
        assert all(ms==40 for ms in durations),(kind,durations)
        steps=[float(np.abs(frames[i+1]-frames[i]).mean()) for i in range(len(frames)-1)]
        seam=float(np.abs(frames[-1]-frames[0]).mean())
        p90=float(np.percentile(steps,90))
        assert max(steps)>.005,(kind,'static, not animated')
        assert seam<=p90*1.8+.04,(kind,'visible loop seam',seam,p90)
        # Show the check would reject an obvious reset flash, rather than merely counting frames.
        synthetic_bad=float(np.abs(np.zeros_like(frames[0])-frames[0]).mean())
        assert synthetic_bad>p90*1.8+.04
        assert (folder/spec['poster']).is_file()
        assert (folder/spec['master']).is_file()
        results.append({'icon':kind,'frames':len(frames),'durationMs':sum(durations),'seamMAE':round(seam,4),'ordinaryStepP90':round(p90,4),'passed':True})
out=root/'.tmp/event-loops-v1/seam-report.json'
out.parent.mkdir(parents=True,exist_ok=True)
out.write_text(json.dumps(results,indent=2),encoding='utf-8')
print(json.dumps({'passed':True,'icons':len(results),'fps':25,'framesEach':72,'periodMs':2880,'maxSeamMAE':max(row['seamMAE'] for row in results),'totalGifBytes':sum((folder/spec['gif']).stat().st_size for spec in manifest['icons'].values())},indent=2))
