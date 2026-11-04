"""Review boards use the exported production artwork and original duck pixels, not replacement ducks."""
from pathlib import Path
from PIL import Image
import json,base64,html
ROOT=Path(__file__).resolve().parents[1];ASSET=ROOT/'frontend/public/assets/duck-race';OUT=ROOT/'design-preview/duck-race-v14'
FACES=json.loads((ROOT/'frontend/src/shared/ui/public-letter-paths.json').read_text())
def data(path):
 p=Path(path);mime='image/svg+xml'if p.suffix=='.svg'else'image/webp'if p.suffix=='.webp'else'image/png'
 return 'data:'+mime+';base64,'+base64.b64encode(p.read_bytes()).decode()
source=(ROOT/'scripts/design-duck-canvas-v13.py').read_text(encoding='utf-8-sig')
exec(source[source.index('class Canvas:'):source.index('\ndef header')])
def frame(self,name,x,y,w,h,edge=18):
 path=ASSET/'v14'/('frame-'+name+'.webp');sw,sh=Image.open(path).size;id=self.asset(path);cut=round(min(sw,sh)*.22)
 xs=[0,cut,sw-cut,sw];ys=[0,cut,sh-cut,sh];dx=[x,x+edge,x+w-edge,x+w];dy=[y,y+edge,y+h-edge,y+h]
 for row in range(3):
  for col in range(3):
   self.body.append(f'<svg x="{dx[col]}" y="{dy[row]}" width="{dx[col+1]-dx[col]}" height="{dy[row+1]-dy[row]}" viewBox="{xs[col]} {ys[row]} {xs[col+1]-xs[col]} {ys[row+1]-ys[row]}" preserveAspectRatio="none"><use href="#{id}"/></svg>')
Canvas.frame=frame
board=Canvas(1440,1020);board.body.append('<rect width="1440" height="1020" fill="#122f28"/>')
board.text('QUIZ DUCK RACE · BỘ KHUNG RIÊNG CHO TỪNG VAI TRÒ',24,18,28,bold=True)
roles=[('hud','Thông tin cuộc đua','Men xanh · đồng cũ',320,105),('question','Câu hỏi','Giấy xé · kẹp đồng',320,230),('action','Thao tác','Phím gỗ · lõi hổ phách',290,80),('field','Nhập liệu / đáp án','Gốm xanh · sồi nhạt',310,75),('lucky','Thẻ may mắn','Da đỏ · chỉ khâu',300,220),('result','Kết quả','Giấy ép · huy hiệu lá',320,220)]
for i,(key,title,caption,w,h)in enumerate(roles):
 x=24+i%3*472;y=78+i//3*455
 board.text(title,x+10,y,23,bold=True);board.text(caption,x+10,y+36,17,'#d2c89d')
 board.frame(key,x+25,y+92,w,h,24)
 ink='#f9e4ac'if key in['hud','action','field']else'#29412e'
 board.text('Quiz Duck Race',x+25+w/2,y+92+(h-31)/2,23,ink,True,'middle',maxwidth=w-48)
board.render(OUT/'frames-canvas.svg')

c=Canvas(1440,1100);c.body.append('<rect width="1440" height="1100" fill="#122f28"/>')
c.text('VẬT CẢN CỐ ĐỊNH THEO X · CHIỀU DÀI VÀ VỊ TRÍ Y NGẪU NHIÊN',24,18,26,bold=True,maxwidth=1390)
items=[('hop','Rào thấp','Nhảy đơn qua được','Cúi / lăn không qua'),('double','Ụ rơm cao','Nhảy đôi hoặc đi vòng','Nhảy đơn không đủ cao'),('underpass','Thanh treo','Cúi / lăn dưới thanh','Nhảy sẽ va vào thanh'),('wall','Tường chắn','Bắt buộc đi vòng','Không xuyên bằng nhảy / lăn'),('roots','Rễ gai','Nhảy hoặc đi vòng','Đầu cuối tự nhiên'),('cart','Xe hàng','Bắt buộc đi vòng','Có khoảng trống để né')]
native=ASSET/'duckee/yellow/idle/0.png'
for i,(key,title,a,b)in enumerate(items):
 x=24+i%3*472;y=82+i//3*405
 c.frame('question',x,y,446,380,20);c.text(title,x+23,y+18,22,'#29412e',True)
 c.img(ASSET/'side-v10/countryside.webp',x+20,y+63,405,222)
 c.img(ASSET/'v14'/('obstacle-'+key+'.webp'),x+257,y+106,82,174)
 c.img(native,x+98,y+190,72,72,True)
 c.body.append(f'<path d="M{x+174} {y+230}h56l-10 -7m10 7 -10 7" fill="none" stroke="#ffe69a" stroke-width="4"/>')
 c.text(a,x+24,y+300,18,'#29412e',True,maxwidth=397);c.text(b,x+24,y+334,17,'#52603c',maxwidth=397)
c.text('Chạy trái → phải · Tường không bao giờ bịt kín đường · Có báo trước khi người bắt vung lưới',24,939,20,bold=True,maxwidth=1392)
c.text('Vịt bị bắt: chốt điểm, kết thúc lượt riêng; các vịt khác vẫn tiếp tục.',24,984,21,'#e8c77c',maxwidth=1392)
c.render(OUT/'obstacles-canvas.svg')
print('Review boards exported with the same production textures and native sprite.')

