"""Export independent, alpha-painted sprites from the approved production sheets.

Connected silhouettes, rather than fixed grid rectangles, preserve overhanging props.
No seed illustrations, labels or paper backgrounds are composited into the sprites.
"""
from pathlib import Path
import json
from collections import deque
import numpy as np
from PIL import Image, ImageDraw

ROOT = Path(__file__).resolve().parents[1]
REVIEW = ROOT / 'design-preview/static-event-icons-v3-production'
OUT = ROOT / 'frontend/public/assets/ui/static-events-v3'
SHEETS = {
 '01-nature': 'rain storm sun fire flood snow seedling wheat pest chemical-spill earthquake drought'.split(),
 '02-technology': 'cnc-breakdown power-failure server-overheat robot cyberattack lost-design wafer-defect research new-machinery extinguished-fire network-failure patent'.split(),
 '03-logistics': 'material-shortage supplier-truck port-congestion unloading export-order truck-breakdown bridge cold-storage air-freight customs material-price warehouse'.split(),
 '04-market-policy': 'new-contract cancelled-contract market-recovery price-decline tax-increase tax-relief state-support credit-tightening joint-venture new-standard environment-inspection land-expansion'.split(),
 '05-people-family': 'training departing-engineer strike safety illness longevity retirement handover inheritance-dispute family-fund returning-graduate life-insurance'.split(),
 '06-contexts-outcomes': 'context-input-shortage context-local-supplier context-port-delay context-green-support context-credit-tightening context-tech-transfer context-new-standard mortality bankruptcy inheritance-loss inheritance-steady inheritance-growth'.split(),
 '07-industry-examples': 'industry-cnc industry-wafer industry-wood-saw industry-food-dryer industry-water-pipe industry-port-hook order-auto-chips order-medicine order-garments order-coffee order-batteries order-solar'.split(),
}

def components(alpha):
    # Half resolution is sufficient for grouping. Original alpha is retained on export.
    mask = np.asarray(Image.fromarray(alpha).resize((alpha.shape[1]//2, alpha.shape[0]//2))) > 32
    labels = np.zeros(mask.shape, dtype=np.int32)
    groups = []
    height, width = mask.shape
    for y, x in zip(*np.nonzero(mask)):
        if labels[y,x]: continue
        label = len(groups)+1
        labels[y,x] = label
        queue = deque([(int(x),int(y))]); count=0; x0=x1=int(x); y0=y1=int(y)
        while queue:
            px,py = queue.popleft(); count+=1
            x0=min(x0,px); x1=max(x1,px); y0=min(y0,py); y1=max(y1,py)
            for nx,ny in ((px-1,py),(px+1,py),(px,py-1),(px,py+1)):
                if 0<=nx<width and 0<=ny<height and mask[ny,nx] and not labels[ny,nx]:
                    labels[ny,nx]=label; queue.append((nx,ny))
        groups.append(dict(label=label,count=count,box=(x0,y0,x1+1,y1+1)))
    return labels,groups

def export():
    OUT.mkdir(parents=True,exist_ok=True)
    report=[]; previews=[]
    for sheet,names in SHEETS.items():
        file=REVIEW/'atlases'/f'approved-{sheet}.png'
        source=Image.open(file).convert('RGBA'); rgba=np.asarray(source); alpha=rgba[:,:,3]
        labels,groups=components(alpha)
        main=sorted(groups,key=lambda g:g['count'],reverse=True)[:12]
        if min(g['count'] for g in main)<1000: raise ValueError(f'{sheet}: missing complete silhouettes')
        # Assign each main component to its intended 4x3 position; reject ambiguous merged cells.
        anchors={}
        for g in main:
            x0,y0,x1,y1=g['box']; col=min(3,int((x0+x1)/2/labels.shape[1]*4)); row=min(2,int((y0+y1)/2/labels.shape[0]*3)); slot=row*4+col
            if slot in anchors: raise ValueError(f'{sheet}: silhouettes touch / ambiguous slot {slot}')
            anchors[slot]=g
        owners={g['label']:slot for slot,g in anchors.items()}
        for g in groups:
            if g['label'] in owners or g['count']<2: continue
            x0,y0,x1,y1=g['box']; cx=(x0+x1)/2; cy=(y0+y1)/2
            def distance(slot):
                a,b,c,d=anchors[slot]['box']
                return max(a-cx,0,cx-c)**2+max(b-cy,0,cy-d)**2
            owners[g['label']]=min(anchors,key=distance)
        lut=np.full(len(groups)+1,-1,dtype=np.int16)
        for label,slot in owners.items(): lut[label]=slot
        grouped=lut[labels]
        board=Image.new('RGB',(4*256,3*282),'#fff2d5');draw=ImageDraw.Draw(board)
        for slot,name in enumerate(names):
            ownership=Image.fromarray((grouped==slot).astype('uint8')*255).resize(source.size,Image.Resampling.NEAREST)
            # Grow the ownership mask 3px to keep original antialiased silhouette edges.
            from PIL import ImageFilter
            ownership=ownership.filter(ImageFilter.MaxFilter(7))
            a=np.minimum(alpha,np.asarray(ownership)); sprite=rgba.copy();sprite[:,:,3]=a
            obj=Image.fromarray(sprite).crop(Image.fromarray(a).getbbox())
            obj.thumbnail((240,240),Image.Resampling.LANCZOS)
            final=Image.new('RGBA',(256,256));final.alpha_composite(obj,((256-obj.width)//2,(256-obj.height)//2))
            final.save(OUT/f'{name}.webp','WEBP',quality=92,method=6)
            x=(slot%4)*256; y=(slot//4)*282;board.paste(final,(x,y),final);draw.text((x+8,y+258),name,fill='#4e271e')
            report.append({'id':name,'sheet':sheet,'slot':slot,'file':f'{name}.webp','size':[256,256]})
        board.save(REVIEW/f'export-{sheet}.jpg',quality=90)
        previews.append(board)
    (OUT/'manifest.json').write_text(json.dumps({'version':3,'format':'static WebP','artworks':report},ensure_ascii=False,indent=2),encoding='utf8')
    print(json.dumps({'exported':len(report),'bytes':sum(p.stat().st_size for p in OUT.glob('*.webp'))}))

if __name__=='__main__': export()
