from pathlib import Path
from PIL import Image,ImageDraw
import base64
p=Path(__file__).resolve().parents[1]/'frontend/public/assets/duck-race/world-v8'
base=Image.open(p/'beam.webp').convert('RGBA')
posts=base.copy();ImageDraw.Draw(posts).rectangle((108,60,440,306),fill=(0,0,0,0))
bar=base.crop((108,225,440,305));rope=base.crop((140,60,158,225))
for name,im in [('beam-posts',posts),('beam-log',bar),('beam-rope',rope)]:
 im.save(p/(name+'.webp'),quality=95,method=6)
 data=base64.b64encode((p/(name+'.webp')).read_bytes()).decode();w,h=im.size
 (p/(name+'.svg')).write_text(f'<svg xmlns="http://www.w3.org/2000/svg" width="{w}" height="{h}" viewBox="0 0 {w} {h}"><image width="{w}" height="{h}" href="data:image/webp;base64,{data}"/></svg>')
