"""Approved source-pixel apparel; native duckee bodies are never replaced."""
from pathlib import Path
from PIL import Image, ImageDraw
import json, math
from duck_wardrobe_art import fitted_glasses
ROOT=Path(__file__).resolve().parents[1]
ART=ROOT/'frontend/public/assets/duck-race'
BODY={(64,142,47),(21,86,7),(128,197,113)}
BILL={(170,127,56),(236,198,135),(103,67,9)}
palette=BODY
registration=json.loads((ART/'experience-v4/registration.json').read_text())
old_wardrobe=Image.open(ART/'experience-v4/cosmetics.png').convert('RGBA')
old_frames=json.loads((ART/'experience-v4/cosmetics.json').read_text())['frames']
def native(pose='idle',frame=0,colour='green'):
 return Image.open(ART/f'duckee/{colour}/{pose}/{frame}.png').convert('RGBA')

def head_fit(body, pose='idle'):
    points = [(x, y) for y in range(43) for x in range(64)
              if body.getpixel((x, y))[3] and body.getpixel((x, y))[:3] in BODY]
    top = min(y for x, y in points)
    crest = [x for x, y in points if y <= top + 1]
    centre = round((min(crest) + max(crest)) / 2)
    if pose == 'crouch':
        centre = 35
    return centre, top

def crown(image, cx, base, width=12, height=6, angle=0):
    """A three-point crown with a curved front band, measured in native pixels."""
    shape = Image.new('RGBA', (64, 64))
    draw = ImageDraw.Draw(shape)

    def point(x, y):
        return round(cx + x * width / 12), round(base + y * height / 6)

    draw.polygon([point(-6, -1), point(-6, -5), point(-3, -3), point(0, -6),
                  point(3, -3), point(6, -5), point(6, -1), point(3, 1),
                  point(-3, 1)], fill='#e6b844', outline='#644219')
    draw.line([point(-5, -3), point(-3, -2), point(0, -4), point(3, -2), point(5, -3)], fill='#ffe8a3')
    draw.line([point(-5, -1), point(-3, 0), point(3, 0), point(5, -1)], fill='#a96d24')
    draw.line([point(-4, -1), point(0, 0), point(4, -1)], fill='#ffdb73')
    draw.point(point(0, -1), fill='#bc4338')
    if angle:
        shape = shape.rotate(angle, Image.Resampling.NEAREST, center=(cx, base))
    image.alpha_composite(shape)

def gear(item, pose, frame, body):
    result = Image.new('RGBA', (64, 64))
    cx, top = head_fit(body, pose)
    base = top + 1
    crouched = pose == 'crouch'
    draw = ImageDraw.Draw(result)
    if item in ['brass', 'dark']:
        return fitted_glasses(item, pose, frame, body), (cx, base)
    if item in ['red', 'teal', 'brass', 'dark']:
        old = old_frames.get(f'{item}/{pose}/{frame}')
        if old:
            f = old['frame']
            return old_wardrobe.crop((f['x'], f['y'], f['x'] + 64, f['y'] + 64)), (cx, base)
        # The original racing atlas omits crouch and air. Bind those pixels to
        # the same native crest/neck landmarks for this comparison preview.
        f = old_frames[f'{item}/idle/0']['frame']
        sample = old_wardrobe.crop((f['x'], f['y'], f['x'] + 64, f['y'] + 64))
        neutral_x, neutral_top = head_fit(native())
        result.alpha_composite(sample, (cx - neutral_x, top - neutral_top))
    elif item == 'beanie':
        h = 3 if crouched else 7
        draw.polygon([(cx - 8, base), (cx - 7, base - h + 3), (cx - 4, base - h),
                      (cx + 4, base - h), (cx + 7, base - h + 3), (cx + 8, base)],
                     fill='#387b81', outline='#173f45')
        draw.rectangle((cx - 8, base - 1, cx + 8, base + 1), fill='#234f59', outline='#173f45')
        draw.line((cx - 6, base, cx + 6, base), fill='#76bab7')
        if not crouched:
            for x in [cx - 4, cx, cx + 4]:
                draw.line((x, base - 5, x, base - 2), fill='#559d9e')
            draw.rectangle((cx - 1, base - 9, cx + 1, base - 7), fill='#9fd2c4', outline='#38676b')
    elif item == 'helmet':
        h = 3 if crouched else 6
        draw.polygon([(cx - 8, base), (cx - 7, base - h + 2), (cx - 4, base - h),
                      (cx + 4, base - h), (cx + 7, base - h + 2), (cx + 8, base)],
                     fill='#d6a13b', outline='#6b4d24')
        draw.line((cx - 4, base - h + 1, cx + 4, base - h + 1), fill='#ffe4a1')
        draw.rectangle((cx - 9, base, cx + 9, base + 1), fill='#a37129', outline='#6b4d24')
        draw.line((cx - 7, base, cx + 7, base), fill='#eec86a')
        if not crouched:
            draw.line((cx, base - 5, cx, base - 1), fill='#ffdd84')
    elif item == 'leaf':
        x, y = cx - 4, base
        h = 3 if crouched else 6
        draw.polygon([(x - 3, y), (x - 4, y - 2), (x - 2, y - h + 1),
                      (x + 4, y - h), (x + 3, y - 2), (x, y)], fill='#779b3d', outline='#334d28')
        draw.line((x - 3, y, x + 2, y - h + 1), fill='#c2d576')
        draw.point((x - 2, y), fill='#d1a85e')
    elif item == 'bow':
        meta = registration.get(f'{pose}/{frame}', {})
        nx, ny = meta.get('neck', (cx - 2, top + (4 if crouched else 12)))
        nx, ny = round(nx + 2), round(ny)
        if meta.get('backFacing'):
            draw.line((nx - 3, ny, nx + 3, ny), fill='#73343a')
        else:
            draw.polygon([(nx - 5, ny - 2), (nx - 1, ny - 1), (nx - 1, ny + 1),
                          (nx - 5, ny + 2)], fill='#a34249', outline='#542b32')
            draw.polygon([(nx + 5, ny - 2), (nx + 1, ny - 1), (nx + 1, ny + 1),
                          (nx + 5, ny + 2)], fill='#c56564', outline='#542b32')
            draw.rectangle((nx - 1, ny - 1, nx + 1, ny + 1), fill='#df9281', outline='#713942')
        cx, base = nx, ny
    elif item == 'crown':
        crown(result, cx, base, height=3 if crouched else 6)
    # The original native bill remains in front of neck and face equipment.
    for y in range(64):
        for x in range(64):
            if body.getpixel((x, y))[3] and body.getpixel((x, y))[:3] in BILL:
                result.putpixel((x, y), (0, 0, 0, 0))
    return result, (cx, base)

def clothing(item,pose,frame):
    b=native(pose,frame)
    im=Image.new('RGBA',(64,64));d=ImageDraw.Draw(im)
    pts=[(x,y) for y in range(64) for x in range(64) if b.getpixel((x,y))[:3] in palette and b.getpixel((x,y))[3]]
    x0=min(x for x,y in pts);x1=max(x for x,y in pts);y0=min(y for x,y in pts);y1=max(y for x,y in pts)
    cx=(x0+x1)//2;ny=y0+round((y1-y0)*.67)
    back=registration.get(f'{pose}/{frame}',{}).get('backFacing',False)
    if item=='tie':
        d.line((x0+2,ny-1,x1-2,ny-1),fill='#eee4cc')
        if not back:
            tx=min(x1-3,cx+2)
            d.polygon([(tx-1,ny-1),(tx+1,ny-1),(tx+2,ny+4),(tx,ny+6),(tx-2,ny+4)],fill='#8e2d28',outline='#481a1c')
            d.point((tx,ny),fill='#eeb08d')
    elif item=='satchel':
        d.line((x0+3,ny-4,x1-3,y1-1),fill='#49321e',width=2)
        bx=x0+2;by=min(ny+1,y1-4)
        d.rectangle((bx,by,bx+7,by+6),fill='#a57036',outline='#4b321f')
        d.rectangle((bx+1,by+1,bx+6,by+2),fill='#c79c5c')
        d.point((bx+4,by+3),fill='#f1d98a')
    else:
        # Replace only the lower native body pixels. Never draw over bill, eyes or feet.
        threshold=y0+round((y1-y0)*.62)
        for x,y in pts:
            if y>=threshold:
                base=b.getpixel((x,y))[:3]
                color=({'suit':('#26333f','#17222d','#506471'),'worker':('#356c91','#1b3e61','#629ab1')}[item])
                shade=0 if base==(64,142,47) else 1 if base==(21,86,7) else 2
                im.putpixel((x,y),tuple(bytes.fromhex(color[shade][1:]))+(255,))
        if item=='suit':
            if not back:
                d.polygon([(cx-3,threshold),(cx+4,threshold),(cx+1,y1-1)],fill='#f2e3be')
                d.line((cx+1,threshold+1,cx+1,y1-2),fill='#9e302d')
                d.line((cx-4,threshold,cx-1,threshold+3),fill='#687781')
                d.line((cx+5,threshold,cx+2,threshold+3),fill='#687781')
        else:
            d.line((x0+4,threshold,x0+5,y1-2),fill='#d9bf7d',width=2)
            d.line((x1-4,threshold,x1-5,y1-2),fill='#d9bf7d',width=2)
            if not back:
                d.rectangle((cx-2,y1-4,cx+3,y1-1),fill='#274d6e',outline='#162f47')
                d.point((cx+2,y1-3),fill='#e3bd63')
        # Small trouser cuffs at the existing leg roots; native webbed feet remain visible.
        if pose in ('idle','walk_run'):
            for y in range(y1+1,min(64,y1+4)):
                for x in range(64):
                    if b.getpixel((x,y))[3] and b.getpixel((x,y))[:3] in {(170,127,56),(103,67,9)}:
                        im.putpixel((x,y),(30,42,52,255) if item=='suit' else (31,68,100,255))
    # Occlude body props behind the duck's native bill.
    for y in range(64):
        for x in range(64):
            if b.getpixel((x,y))[:3] in {(170,127,56),(236,198,135),(103,67,9)} and y<=y1:
                im.putpixel((x,y),(0,0,0,0))
    return im

def apparel(item,pose,frame):
 return clothing(item,pose,frame) if item in ('tie','satchel','suit','worker') else gear(item,pose,frame,native(pose,frame))[0]
