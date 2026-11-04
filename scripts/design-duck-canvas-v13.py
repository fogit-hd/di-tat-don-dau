"""Review-only SVG compositions. Uses real game background, native duck pixels and painted UI.

Does not change the application routes/components or activate an obstacle set.
"""
from pathlib import Path
from PIL import Image
import json, base64, html, shutil

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'frontend/public/assets/duck-race'
OUT = ROOT / 'design-preview/duck-race-v13'
OUT.mkdir(parents=True, exist_ok=True)
FACES = json.loads((ROOT / 'frontend/src/shared/ui/public-letter-paths.json').read_text())
MANIFEST = json.loads((ASSET / 'manifest-v12.json').read_text())
SOURCE = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
sheet = Image.open(SOURCE / 'exec-16779df5-decc-470d-a948-e720bb00cdd9.png').convert('RGBA')
for i, name in enumerate(['log', 'crates', 'underpass', 'fence']):
    cell = sheet.crop((i % 2 * 768, i // 2 * 512, (i % 2 + 1) * 768, (i // 2 + 1) * 512))
    box = cell.getchannel('A').point(lambda a: 255 if a > 210 else 0).getbbox()
    x1, y1, x2, y2 = box
    cell.crop((max(0,x1-12),max(0,y1-10),min(768,x2+12),min(512,y2+10))).save(OUT / (name + '.png'))

def data(path):
    path = Path(path)
    mime = 'image/svg+xml' if path.suffix == '.svg' else 'image/webp' if path.suffix == '.webp' else 'image/png'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

class Canvas:
    def __init__(self,w,h):
        self.w,self.h=w,h
        self.body=[];self.defs=[];self.loaded={}
    def asset(self,path):
        path=Path(path)
        if path not in self.loaded:
            id='a'+str(len(self.loaded));self.loaded[path]=id
            size=Image.open(path).size if path.suffix!='.svg' else (900,450)
            self.defs.append(f'<image id="{id}" width="{size[0]}" height="{size[1]}" href="{data(path)}"/>')
        return self.loaded[path]
    def img(self,path,x,y,w,h,pixel=False):
        self.body.append(f'<image x="{x}" y="{y}" width="{w}" height="{h}" preserveAspectRatio="none" href="{data(path)}"'+(' style="image-rendering:pixelated"' if pixel else '')+'/>')
    def frame(self,name,x,y,w,h,edge=14):
        path=ASSET/('frames-v9/'+name+'.webp') if name in ['paper','forest'] else ASSET/('painted-frames-v2/button-'+name+'-normal.webp')
        sw,sh=Image.open(path).size;id=self.asset(path)
        # Nine-slice: actual painted corners, no rectangular background behind alpha.
        source=round(min(sw,sh)*.22)
        xs=[0,source,sw-source,sw];ys=[0,source,sh-source,sh]
        dx=[x,x+edge,x+w-edge,x+w];dy=[y,y+edge,y+h-edge,y+h]
        for row in range(3):
            for col in range(3):
                self.body.append(f'<svg x="{dx[col]}" y="{dy[row]}" width="{dx[col+1]-dx[col]}" height="{dy[row+1]-dy[row]}" viewBox="{xs[col]} {ys[row]} {xs[col+1]-xs[col]} {ys[row+1]-ys[row]}" preserveAspectRatio="none" overflow="hidden"><use href="#{id}"/></svg>')
    def text(self,copy,x,y,size=20,color='#fff0c6',bold=False,anchor='start',maxwidth=None):
        face=FACES['bold' if bold else 'regular'];width=0;paths=[]
        for char in copy:
            a,p=face.get(char,face['?'])
            if p:paths.append(f'<path d="{p}" transform="translate({width} 0)"/>')
            width+=a
        scale=size/64
        if maxwidth:scale=min(scale,maxwidth/max(1,width))
        actual=width*scale
        if anchor=='middle':x-=actual/2
        if anchor=='end':x-=actual
        self.body.append(f'<g aria-label="{html.escape(copy,quote=True)}" fill="{color}" transform="translate({x} {y}) scale({scale})">'+''.join(paths)+'</g>')
    def duck(self,x,ground,scale=2.7,color='yellow',pose='idle',f=0,marker=False):
        key=f'duckee/{color}/{pose}';meta=MANIFEST[key]
        path=ASSET/meta.get('frameRoot',key)/(str(f%meta['frames'])+'.png')
        if scale>1.8:self.img(ASSET/'svg/shadow.svg',x-12*scale,ground-3,24*scale,6*scale)
        self.img(path,x-32*scale,ground-48*scale,64*scale,64*scale,True)
        if marker:self.img(ASSET/'ui-v6/you-marker.svg',x-10,ground-26*scale-15,20,25)
    def prop(self,name,x,foot,w,h):self.img(OUT/(name+'.png'),x-w/2,foot-h,w,h)
    def button(self,copy,x,y,w,h,kind='teal',size=18):
        self.frame(kind,x,y,w,h,min(12,h*.23));self.text(copy,x+w/2,y+(h-size*1.34)/2,size,bold=True,anchor='middle',maxwidth=w-20)
    def render(self,path):
        path.write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{self.w}" height="{self.h}" viewBox="0 0 {self.w} {self.h}"><title>Quiz Duck Race — canvas duyệt, sprite gốc</title><defs>'+''.join(self.defs)+'</defs>'+''.join(self.body)+'</svg>',encoding='utf-8')

def header(c,mobile=False):
    h=56 if mobile else 68
    c.frame('forest',0,0,c.w,h,13)
    c.img(ASSET/'lettering-ai-v5/brand-title.webp',14,7,112 if mobile else 145,43 if mobile else 53)
    c.text('D33AD6D',c.w*.54,18 if mobile else 22,13 if mobile else 18,anchor='middle')
    c.text('08:24',c.w-16,10 if mobile else 14,25 if mobile else 30,'#ffdf69',True,'end')

def hud(c,x,y,w,h,mobile=False):
    c.frame('forest',x,y,w,h,13)
    c.duck(x+37,y+48,1.35)
    c.text('Minh Anh',x+66,y+7,16 if mobile else 20,bold=True,maxwidth=w-82)
    c.text('320 điểm',x+66,y+32,13 if mobile else 16,'#ffdf69',True)
    c.text('23,2%',x+w*.58,y+32,13 if mobile else 16,'#ffdf69',True)
    c.text('Hạng 4',x+w-15,y+32,13 if mobile else 16,'#ffdf69',True,'end')

def question(c,x,y,w,h):
    c.frame('paper',x,y,w,h,20)
    ink='#193e34'
    c.text('Câu 9',x+22,y+20,16,ink,True);c.text('00:16',x+w-23,y+20,16,ink,True,'end')
    for i,line in enumerate(['Yếu tố nào giúp','làm chủ công nghệ?']):c.text(line,x+23,y+64+i*30,22,ink,True,maxwidth=w-46)
    for i,lines in enumerate([['Nhân lực có kỹ năng'],['Chỉ nhập thêm máy'],['Tăng quảng cáo'],['Giảm bảo trì']]):
        by=y+155+i*65
        c.frame('paper',x+18,by,w-36,54,10)
        c.text('ABCD'[i],x+31,by+14,18,ink,True)
        c.text(lines[0],x+59,by+16,15,ink,maxwidth=w-95)
    c.text('Trả lời đúng để kiếm điểm.',x+23,y+430,14,'#615c3e',maxwidth=w-46)
    c.text('Dùng điểm để lăn bứt tốc.',x+23,y+455,14,'#615c3e',maxwidth=w-46)

def dpad(c,x,y,size=42,touch=False):
    for copy,dx,dy in [('W',1,0),('A',0,1),('S',1,1),('D',2,1)]:
        bx,by=x+dx*(size+3),y+dy*(size+3)
        c.button('' if touch else copy,bx,by,size,size,size=18)
        if touch:
            turn={'W':0,'D':90,'S':180,'A':270}[copy]
            c.body.append(f'<path d="M -9 5 L 0 -7 L 9 5 Z" fill="#ffe7a3" transform="translate({bx+size/2} {by+size/2}) rotate({turn})"/>')

def action(c,label,key,pose,x,y,w=110,h=102):
    c.frame('teal',x,y,w,h,13)
    # The little action silhouettes are actual native animation frames, too.
    c.duck(x+w/2,y+44,1.45,pose=pose)
    c.text(label,x+w/2,y+49,16,bold=True,anchor='middle',maxwidth=w-14)
    c.text(key,x+w/2,y+74,12,'#dfc88c',anchor='middle',maxwidth=w-14)

def desktop():
    c=Canvas(1440,900)
    c.img(ASSET/'side-v10/countryside.webp',0,68,1440,832)
    header(c);hud(c,18,83,505,67)
    # Continuous random depths: no lane markings. Two opposite ends at X=690 leave a middle gap.
    c.prop('crates',690,480,62,73)
    c.prop('log',690,621,46,68)
    c.prop('fence',925,554,54,132)
    c.duck(220,494,2.5,color='aqua');c.duck(370,548,2.9,marker=True);c.duck(795,594,2.4,color='purple')
    question(c,1090,158,330,507)
    # ALL controls sit on the foreground soil below the grass/road edge (y=623).
    c.frame('forest',24,730,155,125,17)
    dpad(c,40,751,42)
    c.text('Di chuyển',105,716,14,anchor='middle')
    for label,key,pose,x in [('Nhảy','Space','air',202),('Giữ cúi','Shift','crouch',332),('Đánh','Chuột trái','attack_idle',462),('Đỡ đòn','Chuột phải','guard',592),('Lăn','E · 150 điểm','roll',722)]:
        action(c,label,key,pose,x,730,117,125)
    c.button('Thẻ may mắn',862,730,175,58,'amber',18)
    c.text('2 / 3 thẻ',949,804,16,anchor='middle')
    c.render(OUT/'desktop.svg')

def mobile():
    c=Canvas(390,844)
    # Crop horizontally only, preserve the original background's scale and side view.
    c.body.append(f'<svg x="0" y="54" width="390" height="790" viewBox="400 155 444 745" preserveAspectRatio="xMidYMin slice"><image width="1600" height="900" href="{data(ASSET/"side-v10/countryside.webp")}"/></svg>')
    header(c,True);hud(c,9,66,372,65,True)
    c.prop('crates',285,385,46,70);c.prop('log',285,526,38,64)
    c.duck(110,447,2.1,marker=True);c.duck(226,402,1.9,color='aqua')
    # Soil begins at y~526. No controls overlap the traversable ground above it.
    c.button('Trả lời câu hỏi',12,608,366,53,'amber',19)
    dpad(c,14,705,44,True)
    for label,pose,x,y in [('Nhảy','air',168,682),('Cúi','crouch',239,682),('Lăn','roll',310,682),('Đánh','attack_idle',202,761),('Đỡ','guard',273,761)]:
        c.frame('teal',x,y,66,69,12);c.duck(x+33,y+29,1.05,pose=pose)
        c.text(label,x+33,y+37,13,bold=True,anchor='middle',maxwidth=52)
    c.render(OUT/'mobile.svg')

def tablet():
    c=Canvas(768,1024)
    c.body.append(f'<svg x="0" y="68" width="768" height="956" viewBox="260 0 723 900" preserveAspectRatio="none"><image width="1600" height="900" href="{data(ASSET/"side-v10/countryside.webp")}"/></svg>')
    header(c);hud(c,16,84,498,67)
    c.prop('crates',480,585,61,100);c.prop('log',480,699,48,75)
    c.prop('underpass',658,662,49,166)
    c.duck(205,630,2.7,marker=True);c.duck(361,562,2.4,color='aqua')
    c.button('Trả lời câu hỏi',233,754,330,54,'amber',21)
    c.frame('forest',16,830,736,176,20)
    dpad(c,35,878,42)
    for label,key,pose,x in [('Nhảy','Space','air',195),('Cúi','Shift','crouch',303),('Đánh','Chuột trái','attack_idle',411),('Đỡ','Chuột phải','guard',519),('Lăn','150 điểm','roll',627)]:
        action(c,label,key,pose,x,850,103,132)
    c.render(OUT/'tablet.svg')

desktop();mobile();tablet()
board=Canvas(1440,840)
board.body.append('<rect width="1440" height="840" fill="#122f28"/>')
board.text('CANVAS GAMEPLAY · SPRITE GỐC',22,12,25,bold=True)
board.img(OUT/'desktop.svg',12,65,1080,675)
board.img(OUT/'mobile.svg',1112,65,312,675.2)
board.text('Desktop 1440 × 900',24,754,18,bold=True)
board.text('Điện thoại 390 × 844',1120,754,16,bold=True,maxwidth=300)
board.text('Vật cản ngẫu nhiên theo Y · Không chia làn · Thao tác trên nền đất bên dưới',24,795,16,maxwidth=1370)
board.render(OUT/'canvas-board.svg')
shutil.copyfile(SOURCE/'exec-7428bb9a-3541-4a07-bfb7-1392ee1572ea.png',OUT/'random-obstacles-canvas.png')
(OUT/'provenance.json').write_text(json.dumps({'background':'frontend/public/assets/duck-race/side-v10/countryside.webp',
 'ducks':'native Duckee/DuckyV2 frames, same production manifest-v12; no AI-redrawn characters',
 'frames':'existing painted frames-v9 and painted-frames-v2, exported with fixed-size nine-slice corners',
 'copy':'licensed public-letter-paths.json glyph paths; no SVG text/font dependency',
 'obstacles':'AI prop sheet exec-16779df5-decc-470d-a948-e720bb00cdd9.png; concepts only',
 'scope':'preview SVGs only; no application layout changed'},indent=2),encoding='utf-8')
print('Review SVGs saved:',OUT)
