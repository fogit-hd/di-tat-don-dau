"""Shared full-sprite alpha packing helpers; never assemble limbs."""
import numpy as np
from PIL import Image, ImageChops, ImageFilter, ImageDraw
CELL, REF, AX, AY = 576, 430, 272, 480

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

