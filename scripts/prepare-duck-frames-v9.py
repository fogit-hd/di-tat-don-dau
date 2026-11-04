"""Fill the actual native frame aperture, preserving its transparent outer contour."""
from PIL import Image,ImageDraw
from pathlib import Path
import base64
p=Path(__file__).resolve().parents[1]/'frontend/public/assets/duck-race';out=p/'frames-v9';out.mkdir(exist_ok=True)
frame=Image.open(p/'painted-frames-v2/panel-normal.webp').convert('RGBA')
region=frame.getchannel('A').point(lambda a:255 if a<80 else 0)
ImageDraw.floodfill(region,(frame.width//2,frame.height//2),128)
mask=region.point(lambda a:255 if a==128 else 0)
assert mask.getbbox() and mask.getpixel((0,0))==0
for name,material,tint in [('paper','parchment',None),('forest','forest',None),('correct','parchment',(75,145,62,65)),('wrong','parchment',(194,66,49,60))]:
 texture=Image.open(p/f'materials-v4/{material}.webp').convert('RGBA');base=Image.new('RGBA',frame.size)
 for y in range(0,frame.height,texture.height):
  for x in range(0,frame.width,texture.width):base.paste(texture,(x,y))
 if tint:base=Image.alpha_composite(base,Image.new('RGBA',base.size,tint))
 base.putalpha(mask);base.alpha_composite(frame);base.save(out/(name+'.webp'),quality=94,method=6)
 data=base64.b64encode((out/(name+'.webp')).read_bytes()).decode();w,h=base.size
 (out/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="data:image/webp;base64,{data}"/></svg>')
print('Painted frame interiors filled; outer corner alpha remains transparent.')
