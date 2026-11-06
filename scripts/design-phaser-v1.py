"""Review-only native pose sheet. Does not change any app component or game loop."""
from pathlib import Path
from PIL import Image
import json, base64, html

ROOT=Path(__file__).resolve().parents[1]
ASSET=ROOT/'frontend/public/assets/duck-race'
OUT=ROOT/'design-preview/duck-race-phaser-v1'
OUT.mkdir(parents=True,exist_ok=True)
FACES=json.loads((ROOT/'frontend/src/shared/ui/public-letter-paths.json').read_text())
MANIFEST=json.loads((ASSET/'manifest-v12.json').read_text())
def data(path):
 p=Path(path);mime='image/svg+xml'if p.suffix=='.svg'else'image/webp'if p.suffix=='.webp'else'image/png'
 return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
source=(ROOT/'scripts/design-duck-canvas-v13.py').read_text(encoding='utf-8-sig')
exec(source[source.index('class Canvas:'):source.index('\ndef header')])
def painted(c,name,x,y,w,h):
 p=ASSET/'v14'/('frame-'+name+'.webp');sw,sh=Image.open(p).size;id=c.asset(p)
 cut=round(min(sw,sh)*.22);edge=18
 xs=[0,cut,sw-cut,sw];ys=[0,cut,sh-cut,sh];dx=[x,x+edge,x+w-edge,x+w];dy=[y,y+edge,y+h-edge,y+h]
 for row in range(3):
  for col in range(3):
   c.body.append(f'<svg x="{dx[col]}" y="{dy[row]}" width="{dx[col+1]-dx[col]}" height="{dy[row+1]-dy[row]}" viewBox="{xs[col]} {ys[row]} {xs[col+1]-xs[col]} {ys[row+1]-ys[row]}" preserveAspectRatio="none"><use href="#{id}"/></svg>')

c=Canvas(1440,1110)
c.body.append('<rect width="1440" height="1110" fill="#123c2f"/>')
c.text('PHASER · HỢP ĐỒNG CHUYỂN ĐỘNG CỦA VỊT GỐC',28,18,29,bold=True,maxwidth=1384)
c.text('Frame thật từ asset hiện có · Canvas duyệt, chưa phải bản Phaser đang chạy',28,64,19,'#ebd38e',maxwidth=1384)
items=[
 ('idle','Đứng yên','Thả phím: dừng tại chỗ','Chân và bóng giữ đúng mặt đất',0,0),
 ('walk_run','Đi / chạy','WASD liên tục, không chia làn','Một vòng 4 frame gốc, không trượt chân',1,0),
 ('jump','Nhảy lần 1','Cơ thể lên cao; bóng ở mặt đất','Giữ nguyên kích thước cơ thể',0,36),
 ('air','Nhảy đôi / trên không','Dùng clip bay gốc sau lần nhảy thứ 2','Rơi xuống rồi mới phát clip tiếp đất',1,36),
 ('roll','Lăn','Dùng đúng roll_2, không dùng clip nhảy','Giữ chân / tâm quay theo frame đăng ký',1,0),
 ('crawl','Cúi và di chuyển','Đứng cúi và bò là hai trạng thái','Không lặp động tác nhún khi giữ Shift',1,0),
 ('guard','Đỡ đòn','Đứng tại chỗ; A/D chỉ đổi hướng','Đỡ trái / phải phải khớp hướng tấn công',0,0),
 ('attack_run','Đánh','Tách đứng đánh / chạy đánh / trên không','Ưu tiên pose đúng trạng thái vận động',3,0),
 ('knockout','Choáng / bị hạ','Dừng điều khiển theo kết quả máy chủ','Hồi phục chớp trắng thân, không cả khung',0,0),
]
for i,(pose,title,a,b,f,z)in enumerate(items):
 x=22+i%3*474;y=118+i//3*310;w=448;h=286
 painted(c,'question',x,y,w,h)
 c.text(title,x+22,y+17,24,'#21422f',True,maxwidth=w-44)
 ground=y+183
 c.body.append(f'<path d="M{x+35} {ground}H{x+w-35}" stroke="#b8a270" stroke-width="2"/>')
 c.body.append(f'<ellipse cx="{x+221}" cy="{ground}" rx="39" ry="7" fill="#715b2f" opacity=".28"/>')
 meta=MANIFEST['duckee/yellow/'+pose]
 native=ASSET/meta.get('frameRoot','duckee/yellow/'+pose)/(str(f%meta['frames'])+'.png')
 c.img(native,x+222-32*3.4,ground-z-48*3.4,64*3.4,64*3.4,True)
 c.text(a,x+22,y+213,17,'#23432e',True,maxwidth=w-44)
 c.text(b,x+22,y+244,15,'#5d6144',maxwidth=w-44)
c.text('X: hướng chạy · Y: độ sâu trên đường · Z: độ cao nhảy · Bóng luôn ở (X,Y)',28,1062,22,'#f2d486',True,maxwidth=1384)
c.render(OUT/'native-motion-canvas.svg')
print('Native motion approval sheet exported with the exact registered asset frames.')
