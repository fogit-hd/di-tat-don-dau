"""Approved crown choreography, reused without changing body or motion."""
from pathlib import Path
from PIL import Image, ImageDraw
import math
from duck_wardrobe_art import fitted_crown as crown
from duck_apparel_art import native, apparel, BODY
SELECTED_ITEMS=[]
def gear(item,pose,frame,body):
 return apparel(item,pose,frame),None
def transformed(image, look=0, back=False):
    result = Image.new('RGBA', (64, 64))
    angle = math.radians(-18 * look)
    co, si = math.cos(angle), math.sin(angle)
    for y in range(64):
        for x in range(64):
            sx, sy = x, y
            if y < 43:
                if back:
                    sx = 60 - x
                elif look:
                    sx = round(co * (x - 30) + si * (y - 39) + 30)
                    sy = round(-si * (x - 30) + co * (y - 39) + 39)
            if 0 <= sx < 64 and 0 <= sy < 64:
                result.putpixel((x, y), image.getpixel((sx, sy)))
    return result

def wing(image, side, grip):
    sx, sign = (24, -1) if side == 'left' else (38, 1)
    gx, gy = grip
    assert math.hypot(gx - sx, gy - 38) <= 13.2
    elbow_x, elbow_y = sx + sign * 4, (38 + gy) / 2 + 1
    points = [(sx - sign, 38), (elbow_x - sign, elbow_y + 2), (gx - sign * 2, gy + 2),
              (gx - sign * 2, gy), (gx, gy - 1), (gx + sign * 2, gy),
              (gx + sign * 2, gy + 3), (elbow_x + sign * 2, elbow_y + 1),
              (elbow_x + sign * 2, elbow_y + 3), (sx + sign, 41)]
    ImageDraw.Draw(image).polygon([(round(x), round(y)) for x, y in points], fill='#408e2f', outline='#001714')

def coronation(frame, dressed):
    if frame < 12:
        progress, phase, look = frame / 11, 'retrieve', 0
        cx, base = 19 + 6 * progress, 41 - 5 * progress
        width = 3 + 9 * max(0, (progress - .3) / .7)
    elif frame < 24:
        progress, phase = (frame - 12) / 11, 'raise'
        cx, base, width, look = 25 + 6 * progress, 36 - 9 * progress, 12, progress
    else:
        progress, phase = (frame - 24) / 15, 'wear'
        cx, base, width, look = 31, 27 + 4 * progress, 12, 1 - progress
    body = native()
    if dressed:
        for item in SELECTED_ITEMS:
            overlay, _ = gear(item, 'idle', 0, body)
            body.alpha_composite(overlay)
    body = transformed(body, look, frame < 7)
    image = Image.new('RGBA', (64, 64))
    if 4 <= frame < 12:
        crown(image, round(cx), round(base), round(width), 6)
    image.alpha_composite(body)
    if frame < 12:
        wing(image, 'left', (round(18 + 6 * progress), round(40 - 4 * progress)))
    else:
        release = max(0, (progress - .7) / .3) if phase == 'wear' else 0
        left_x = cx - width / 2 + (24 - (cx - width / 2)) * release
        right_x = cx + width / 2 + (38 - (cx + width / 2)) * release
        hand_y = base + (40 - base) * release
        if frame < 39:
            wing(image, 'left', (left_x, hand_y))
            wing(image, 'right', (right_x, hand_y))
        crown(image, round(cx), round(base), 12, 6)
    cel = Image.new('RGBA', (96, 96))
    cel.alpha_composite(image, (16, 40))
    return cel, {'phase': phase, 'crownCentre': [round(cx, 2), round(base, 2)],
                 'width': round(width, 2), 'height': 6, 'lookUp': round(look, 2), 'foot': [48, 88]}

def crowned_idle(frame, dressed):
    raw = native('idle', frame)
    body = raw.copy()
    if dressed:
        for item in SELECTED_ITEMS:
            overlay, _ = gear(item, 'idle', frame, raw)
            body.alpha_composite(overlay)
    points = [(x, y) for y in range(43) for x in range(64)
              if raw.getpixel((x, y))[3] and raw.getpixel((x, y))[:3] in BODY]
    top = min(y for x, y in points)
    crest = [x for x, y in points if y <= top + 1]
    centre = round((min(crest) + max(crest)) / 2)
    crown(body, centre, top + 1)
    cel = Image.new('RGBA', (96, 96))
    cel.alpha_composite(body, (16, 40))
    return cel, {'frame': frame, 'crownBase': [centre, top + 1], 'width': 12, 'height': 6,
                 'foot': [48, 88], 'nativeFrame': frame}
