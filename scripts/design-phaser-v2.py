"""Approval canvases only. Real native pixels on AI-painted obstacle concepts, not runtime assets."""
from pathlib import Path
from PIL import Image
import json, base64, html, shutil
ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'frontend/public/assets/duck-race'
OUT=ROOT/'design-preview/duck-race-phaser-v2'
OUT.mkdir(parents=True,exist_ok=True)
FACES=json.loads((ROOT/'frontend/src/shared/ui/public-letter-paths.json').read_text())
MANIFEST=json.loads((ASSET/'manifest-v12.json').read_text())
def data(path):
 p=Path(path);mime='image/svg+xml'if p.suffix=='.svg'else'image/webp'if p.suffix=='.webp'else'image/png'
 return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
source=(ROOT/'scripts/design-duck-canvas-v13.py').read_text(encoding='utf-8-sig')
exec(source[source.index('class Canvas:'):source.index('\ndef header')])
generated=Path(r'C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-52f74168-7e0d-43a8-8d8b-7d715510157d.png')
crawl=Path(r'C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-54168afe-af02-48c5-a708-65b46e2feacb.png')
shutil.copy2(generated,OUT/'obstacle-painting.png')
shutil.copy2(crawl,OUT/'crawl-side-entry.png')
sheet=Image.open(generated);sw,sh=sheet.size
c=Canvas(1440,1000)
c.body.append('<rect width="1440" height="1000" fill="#123c2f"/>')
c.text('V2 · VẬT CẢN BÁM ĐÚNG MẶT ĐƯỜNG',24,14,30,bold=True,maxwidth=1392)
c.text('Canvas duyệt · Vịt gốc ghép nguyên frame · Chưa thay bộ vật cản trong gameplay',24,62,18,'#e5cf91',maxwidth=1392)
labels=[
 ('Rào thấp','Nhảy đơn qua · không lăn xuyên','Một chân đế chung với mặt đất'),
 ('Ụ rơm cao','Nhảy đôi hoặc đi vòng','Cao hơn rào thấp, thấp hơn tường'),
 ('Thanh chắn bò sát','Chỉ Shift: bò từ trái sang phải','Đứng / chạy / lăn / nhảy đều bị chặn'),
 ('Tường cao','Phải đi vòng · không thể nhảy qua','Chừa lối theo cạnh đường'),
 ('Hai đầu chắn','Lối trống ở giữa theo độ sâu Y','Cả hai chân trụ đều nằm trên đất'),
 ('Xe hàng','Đi vòng qua cạnh đường còn trống','Bánh xe và bóng cùng điểm tựa'),
]
for i,(name,a,b) in enumerate(labels):
 x=20+(i%3)*474;y=110+(i//3)*430;w=452;ih=226
 c.frame('paper',x,y,w,410,17)
 c.text(name,x+20,y+12,24,'#20422e',True,maxwidth=w-40)
 # Cropping the six-cell approval painting only; no obstacle texture exported for gameplay.
 sx=(i%3)*sw/3;sy=(i//3)*sh/2
 if i==2:c.img(crawl,x+10,y+56,w-20,ih)
 else:c.body.append(f'<svg x="{x+10}" y="{y+56}" width="{w-20}" height="{ih}" viewBox="{sx} {sy} {sw/3} {sh/2}" preserveAspectRatio="none" overflow="hidden"><image href="{data(generated)}" width="{sw}" height="{sh}"/></svg>')
 ground=y+56+ih*(.72 if i==2 else .82)
 c.duck(x+146,ground,3.4,pose='crouch'if i==2 else'idle',marker=True)
 c.text('Chạy từ trái sang phải',x+20,y+288,16,'#825916',True,maxwidth=w-40)
 c.body.append(f'<path d="M{x+22} {y+325}H{x+w-32}m-9-5 9 5-9 5" fill="none" stroke="#9b722d" stroke-width="2"/>')
 c.text(a,x+20,y+338,17,'#21422f',True,maxwidth=w-40)
 c.text(b,x+20,y+369,15,'#5c6143',maxwidth=w-40)
c.text('Cùng góc máy · bóng đổ cùng hướng · điểm chạm khớp chân đế · không dùng sprite kéo ngang',24,966,19,'#f1d387',True,maxwidth=1392)
c.render(OUT/'obstacles-grounded.svg')

c=Canvas(1440,1050)
c.body.append('<rect width="1440" height="1050" fill="#123c2f"/>')
c.text('V2 · KHE BÒ SÁT ĐẤT — CHỈ SHIFT',24,18,32,bold=True,maxwidth=1392)
c.text('Hai trụ cùng vị trí X · thẳng hàng trên–dưới · vịt bò từ trái sang phải',24,70,21,'#e5cf91',maxwidth=1392)
c.img(crawl,0,125,1440,810)
# Three time samples of the same original duck, aligned to one horizontal ground path.
for x,pose,label in [(450,'idle','1 · Đến gần'),(765,'crawl','2 · Giữ Shift + D'),(1100,'idle','3 · Đã qua')]:
 c.duck(x,735,3.2,pose=pose,marker=False)
 if pose=='crawl':
  # The near cap/post is in front of this ground-depth sample. Reuse its exact painted pixels,
  # rather than drawing the native duck over solid timber. Review compositing only.
  c.defs.append('<clipPath id="near-crawl-cap"><path d="M665 694H785V758H665Z"/></clipPath>')
  c.body.append('<g clip-path="url(#near-crawl-cap)">')
  c.img(crawl,0,125,1440,810)
  c.body.append('</g>')
 c.frame('forest',x-104,862,208,42,8)
 c.text(label,x,870,18,'#fff0c6',True,anchor='middle',maxwidth=188)
for a,b in [(510,620),(870,1010)]:
 c.body.append(f'<path d="M{a} 750H{b}m-12-7 12 7-12 7" stroke="#fff1c0" stroke-width="4" fill="none"/>')
c.text('Ba thời điểm của cùng một vịt · Mũi tên chỉ dùng để duyệt hướng, không hiện trong gameplay',24,960,21,'#f1d387',True,maxwidth=1392)
c.text('Chỉ giữ Shift mới qua. Đứng, chạy, lăn và cả hai lần nhảy đều bị chặn.',24,1002,20,'#fff0c6',maxwidth=1392)
c.render(OUT/'crawl-direction.svg')

c=Canvas(1440,1060);c.body.append('<rect width="1440" height="1060" fill="#123c2f"/>')
c.text('V2 · CHẠM, NÉ VÀ PHẢN ĐÒN',24,14,30,bold=True,maxwidth=1392)
c.text('Storyboard dùng đúng frame gốc · Mũi tên / vùng chân là chú giải duyệt, không phải hiệu ứng gameplay',24,62,17,'#e5cf91',maxwidth=1392)
cards=[
 ('Nhảy đơn','jump',0,45,'Thân nhấc lên; bóng ở mặt đất','Không phóng to cơ thể'),
 ('Nhảy đôi','double_jump',0,80,'Dùng đúng pose trên không','Camera bám chân, không bám đầu'),
 ('Cúi / bò','crawl',2,0,'Giữ cúi; vừa đi vừa bò','Không nhún đứng lên lặp lại'),
 ('Lăn gốc','roll',2,0,'Dùng đúng roll_2 gốc','Không lấy pose nhảy làm lăn'),
 ('Đứng đánh','attack_idle',2,0,'Đánh từ tư thế đứng yên','Mỗi đòn dùng đúng chuỗi frame'),
 ('Chạy / nhảy đánh','attack_air',3,40,'Pose đánh đổi theo trạng thái','Không thay kích cỡ thân'),
 ('Đỡ đúng hướng','guard',0,0,'Đứng yên; A/D xoay trái/phải','Đỡ kịp: bên đánh văng, choáng 1,5s'),
 ('Trúng đòn / hồi phục','knockout',0,0,'Bị văng, choáng 1,5 giây','Đụng vật cản: lùi trước vật, chớp trắng'),
]
for i,(title,pose,f,z,a,b)in enumerate(cards):
 x=20+i%4*354;y=112+i//4*430;w=332;h=402
 c.frame('paper',x,y,w,h,16)
 c.text(title,x+18,y+14,22,'#21422f',True,maxwidth=w-36)
 ground=y+244;cx=x+w/2
 c.body.append(f'<path d="M{x+26} {ground}H{x+w-26}" stroke="#aa8d56" stroke-width="2"/>')
 c.img(ASSET/'svg/shadow.svg',cx-44,ground-5,88,16)
 meta=MANIFEST['duckee/yellow/'+pose]
 native=ASSET/meta.get('frameRoot','duckee/yellow/'+pose)/(str(f%meta['frames'])+'.png')
 c.img(native,cx-32*4,ground-z-48*4,64*4,64*4,True)
 c.text(a,x+18,y+278,16,'#21422f',True,maxwidth=w-36)
 c.text(b,x+18,y+317,15,'#5b5e41',maxwidth=w-36)
 c.text('Chân / bóng: mặt đất',x+18,y+360,13,'#8d6c32',maxwidth=w-36)
c.text('Va chạm theo mặt chân + độ cao Z; bóng vẽ không dùng làm hitbox. Chỉ áp dụng sau khi duyệt V2.',24,1014,18,'#f1d387',True,maxwidth=1392)
c.render(OUT/'contact-motion.svg')
print('V2 obstacle and native contact/motion approval canvases written. No runtime assets activated.')
