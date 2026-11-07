"""Export the approved skateboard/card and rope/medal award cels in every native colour.
Source-pixel body and accessory registration is baked before Phaser playback.
Run locally after changing these authored cels. No app dependencies are added.
"""
from pathlib import Path
from PIL import Image, ImageDraw
import json
import math
from collections import Counter, defaultdict

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'frontend/public/assets/duck-race'
OUT = ART / 'results-v1'
CELL, COLS = 128, 8
ORIGIN = (64, 118)
SELECTED_ITEMS = []
wardrobe = Image.open(ART / 'experience-v4/cosmetics.png').convert('RGBA')
atlas = json.loads((ART / 'experience-v4/cosmetics.json').read_text())['frames']


def smooth(value):
    value = max(0, min(1, value))
    return value * value * (3 - 2 * value)


def palette(color):
    image = Image.open(ART / f'duckee/{color}/idle/0.png').convert('RGBA')
    green = Image.open(ART / 'duckee/green/idle/0.png').convert('RGBA')
    wanted = [(64, 142, 47), (0, 23, 20), (128, 197, 113)]
    result = []
    for rgb in wanted:
        points = [(x, y) for y in range(64) for x in range(64) if green.getpixel((x, y))[:3] == rgb and green.getpixel((x, y))[3]]
        result.append(image.getpixel(points[0]) if points else (18, 32, 19, 255))
    return result


def duck(color, pose='idle', frame=0, dressed=True, airborne=False):
    body = Image.open(ART / f'duckee/{color}/{pose}/{frame}.png').convert('RGBA')
    draw = ImageDraw.Draw(body)
    if airborne:
        # Fold the original feet without enlarging the head/body for flight.
        for y in range(46, 51):
            for x in range(18, 47):
                body.putpixel((x, y), (0, 0, 0, 0))
        draw.line([(25, 44), (23, 45), (26, 45)], fill=(103, 67, 9, 255))
        draw.line([(35, 44), (33, 45), (36, 45)], fill=(103, 67, 9, 255))
    if dressed:
        for item in SELECTED_ITEMS:
            f = atlas[f'{item}/{pose}/{frame}']['frame']
            body.alpha_composite(wardrobe.crop((f['x'], f['y'], f['x'] + 64, f['y'] + 64)))
    return body


def bronze(frame, dressed):
    image = Image.new('RGBA', (CELL, CELL))
    step = smooth((frame - 21) / 11)
    foot_x = round(76 - 12 * step)
    foot_y = round(112 + 6 * step)
    if frame < 21:
        state = 'ride-in'
    elif frame < 33:
        state = 'step-off'
    elif frame < 43:
        state = 'push-board'
    elif frame < 55:
        state = 'retrieve-card'
    elif frame < 67:
        state = 'turn-card'
    else:
        state = 'present-card'
    body = duck('yellow', dressed=dressed)
    # Transfer native walking feet only. The torso, head and wardrobe retain
    # their original silhouette and registration through the dismount.
    if 21 <= frame < 33:
        walking = Image.open(ART / f'duckee/yellow/walk_run/{((frame - 21) // 3) % 4}.png').convert('RGBA')
        for y in range(44, 50):
            for x in range(18, 45):
                body.putpixel((x, y), walking.getpixel((x, y)))
    if 33 <= frame < 43:
        kick = math.sin((frame - 33) / 9 * math.pi)
        draw = ImageDraw.Draw(body)
        for y in range(44, 50):
            for x in range(18, 30):
                body.putpixel((x, y), (0, 0, 0, 0))
        toe_x = round(24 - 7 * kick)
        toe_y = round(47 - 6 * kick)
        draw.line([(26, 44), (toe_x + 1, toe_y - 1), (toe_x - 2, toe_y)], fill='#674309', width=2)
        draw.line((toe_x - 2, toe_y, toe_x + 2, toe_y), fill='#ecbe69')
    original = body.copy()
    fill, outline, light = palette('yellow')
    cx, cy, width = 19, 43, 0
    if 47 <= frame < 55:
        width = 4 + (frame - 47) // 3
        back = Image.new('RGBA', (64, 64))
        copper_card(back, cx, cy, width)
        back.alpha_composite(body)
        body = back
    hands = []
    if frame < 21:
        hands = [(24, 19, 40), (38, 42, 40)]
    elif 43 <= frame < 55:
        reach = smooth((frame - 43) / 11)
        hands = [(24, round(24 - 5 * reach), 42), (38, 39, 42)]
    elif 55 <= frame < 67:
        front = smooth((frame - 55) / 11)
        cx, cy, width = round(19 + 13 * front), round(43 - front), round(4 + 7 * front)
        copper_card(body, cx, cy, width)
        hands = [(24, round(19 + 8 * front), 43), (38, round(39 - 2 * front), 43)]
    elif frame >= 67:
        cx, cy, width = 32, 42, 11
        copper_card(body, cx, cy, width)
        hands = [(24, 27, 43), (38, 37, 43)]
    draw = ImageDraw.Draw(body)
    for shoulder, hx, hy in hands:
        assert math.hypot(hx - shoulder, hy - 40) <= 13
        side = -1 if shoulder < 30 else 1
        draw.polygon([(shoulder, 40), (shoulder + side * 4, 41), (shoulder + side * 5, 38),
                      (hx - 2, hy + 1), (hx - 2, hy - 1), (hx + 1, hy - 2),
                      (hx + 2, hy), (hx + 1, hy + 2), (shoulder - side, 39)], fill=fill, outline=outline)
        draw.point((hx, hy), fill=light)
    for y in range(39):
        for x in range(64):
            pixel = original.getpixel((x, y))
            if pixel[3]:
                body.putpixel((x, y), pixel)
    body = body.transpose(Image.Transpose.FLIP_LEFT_RIGHT)
    if frame >= 55 and width >= 9:
        draw = ImageDraw.Draw(body)
        centre = 63 - cx
        for row, pixels in enumerate(['111', '001', '111', '001', '111']):
            for column, pixel in enumerate(pixels):
                x, y = centre - 1 + column, cy - 2 + row
                if pixel == '1' and body.getpixel((x, y))[:3] in [(185, 115, 66), (211, 155, 101), (237, 188, 141)]:
                    draw.point((x, y), fill='#4f2c1b')
    image.alpha_composite(body, (foot_x - 31, foot_y - 48))
    return image, {'frame': frame, 'state': state, 'foot': [foot_x, foot_y], 'ground': [64, 118],
                   'bodyScale': 1, 'onBoard': frame < 21,
                   'cardFace': frame >= 55 and width >= 9,
                   'cardCentre': [foot_x + 32 - cx, foot_y - 48 + cy],
                   'numeral': '3', 'numeralMirrored': False}


def copper_card(image, cx, cy, width):
    draw = ImageDraw.Draw(image)
    left, right = cx - width // 2, cx - width // 2 + width - 1
    draw.polygon([(left + 1, cy - 5), (right - 1, cy - 5), (right, cy - 4),
                  (right, cy + 4), (right - 1, cy + 5), (left + 1, cy + 5),
                  (left, cy + 4), (left, cy - 4)], fill='#b97342', outline='#6d3f2c')
    if width >= 7:
        draw.rectangle((left + 1, cy - 4, right - 1, cy + 4), fill='#d39b65')
        draw.line((left + 2, cy - 4, right - 2, cy - 4), fill='#edbc8d')


def silver(frame, dressed):
    image = Image.new('RGBA', (CELL, CELL))
    body = duck('purple', dressed=dressed, airborne=frame < 34)
    original = body.copy()
    fill, outline, light = palette('purple')
    prop = Image.new('RGBA', (64, 64))
    prop_draw = ImageDraw.Draw(prop)
    if frame < 38:
        prop_draw.rectangle((20, 25, 44, 28), fill='#a77b45', outline='#493a23')
        prop_draw.line((22, 26, 42, 26), fill='#e4c27d')
        prop_draw.rectangle((30, 24, 34, 26), fill='#c5cfcc', outline='#4f6260')
    if 48 <= frame < 56:
        # The first glimpse is physically occluded behind the original torso.
        medal(prop, 19, 43, 4 + (frame - 48) // 3, False)
    prop.alpha_composite(body)
    body = prop
    draw = ImageDraw.Draw(body)
    if frame < 44:
        grip = 1 if frame < 37 else 1 - smooth((frame - 37) / 7)
        hands = [(24, round(23 + (24 - 23) * (1 - grip)), round(29 + 11 * (1 - grip))),
                 (38, round(42 + (38 - 42) * (1 - grip)), round(29 + 11 * (1 - grip)))]
        state = 'swing' if frame < 36 else 'release'
    elif frame < 56:
        reach = smooth((frame - 44) / 11)
        hands = [(24, round(24 - 5 * reach), 42), (38, 39, 42)]
        state = 'retrieve-medal'
    elif frame < 68:
        front = smooth((frame - 56) / 11)
        cx = round(19 + 13 * front)
        cy = round(43 - front)
        medal(body, cx, cy, round(4 + 7 * front), True)
        hands = [(24, round(19 + 8 * front), 43), (38, round(39 - 2 * front), 43)]
        state = 'turn-medal'
    else:
        medal(body, 32, 42, 11, True)
        hands = [(24, 27, 43), (38, 37, 43)]
        state = 'present-medal'
    for shoulder, hx, hy in hands:
        assert math.hypot(hx - shoulder, hy - 40) <= 13
        side = -1 if shoulder < 30 else 1
        draw.polygon([(shoulder, 40), (shoulder + side * 4, 41),
                      (shoulder + side * 6, 36), (hx - 2, hy + 1), (hx - 2, hy - 1),
                      (hx + 1, hy - 2), (hx + 2, hy), (hx + 1, hy + 2), (shoulder - side, 39)],
                     fill=fill, outline=outline)
        draw.point((hx, hy), fill=light)
    # Head, lenses and native bill occlude the raised wings anatomically.
    for y in range(39):
        for x in range(64):
            pixel = original.getpixel((x, y))
            if pixel[3]:
                body.putpixel((x, y), pixel)
    image.alpha_composite(body, (32, 70))
    return image, {'frame': frame, 'state': state, 'foot': [64, 118], 'ground': [64, 118],
                   'bodyScale': 1, 'ropeAttached': frame < 38, 'ropeSocket': [64, 94]}


def medal(image, cx, cy, width, face):
    draw = ImageDraw.Draw(image)
    left = cx - width // 2
    draw.ellipse((left, cy - 5, left + width - 1, cy + 5), fill='#aebdbb', outline='#3d5356')
    if width > 6:
        draw.ellipse((left + 1, cy - 4, left + width - 2, cy + 3), fill='#dde6dd', outline='#8d9e9d')
    if face and width >= 9:
        for row, pixels in enumerate(['111', '001', '111', '100', '111']):
            for column, pixel in enumerate(pixels):
                if pixel == '1':
                    draw.point((cx - 1 + column, cy - 2 + row), fill='#475b60')




def colour_map(before, after):
    left = Image.open(ART / f'duckee/{before}/idle/0.png').convert('RGBA')
    right = Image.open(ART / f'duckee/{after}/idle/0.png').convert('RGBA')
    pairs = defaultdict(Counter)
    for y in range(64):
        for x in range(64):
            a, b = left.getpixel((x, y)), right.getpixel((x, y))
            if a[3] and b[3]:
                pairs[a[:3]][b[:3]] += 1
    return {rgb: choices.most_common(1)[0][0] for rgb, choices in pairs.items()}


def sheet_from(cels):
    result = Image.new('RGBA', (COLS * CELL, math.ceil(len(cels) / COLS) * CELL))
    for index, image in enumerate(cels):
        result.alpha_composite(image, (index % COLS * CELL, index // COLS * CELL))
    return result


manifest_path = OUT / 'manifest.json'
manifest = json.loads(manifest_path.read_text(encoding='utf-8'))
new_sheets = []
for name, base_colour, count, build in [('bronze-skate', 'yellow', 96, bronze), ('silver-swing', 'purple', 96, silver)]:
    SELECTED_ITEMS = []
    built = [build(frame, True) for frame in range(count)]
    base_cels = [image for image, info in built]
    bare = sheet_from(base_cels)
    for colour in manifest['colors']:
        remap = colour_map(base_colour, colour)
        coloured = bare.copy()
        coloured.putdata([(*remap.get(pixel[:3], pixel[:3]), pixel[3]) for pixel in bare.getdata()])
        folder = OUT / colour
        folder.mkdir(parents=True, exist_ok=True)
        coloured.save(folder / (name + '.png'), optimize=True)
    overlays = {}
    for item in ['brass', 'dark', 'red', 'teal']:
        SELECTED_ITEMS = [item]
        cels = []
        for frame, base in enumerate(base_cels):
            equipped, _ = build(frame, True)
            overlay = Image.new('RGBA', (CELL, CELL))
            for y in range(CELL):
                for x in range(CELL):
                    pixel = equipped.getpixel((x, y))
                    if pixel != base.getpixel((x, y)):
                        overlay.putpixel((x, y), pixel)
            cels.append(overlay)
        overlays[item] = cels
        folder = OUT / 'cosmetics' / item
        folder.mkdir(parents=True, exist_ok=True)
        sheet_from(cels).save(folder / (name + '.png'), optimize=True)
    # Recomposition must exactly reproduce the fully dressed authored character.
    for scarf in ['red', 'teal']:
        for glasses in ['brass', 'dark']:
            SELECTED_ITEMS = [scarf, glasses]
            for frame, base in enumerate(base_cels):
                combined = base.copy()
                combined.alpha_composite(overlays[scarf][frame])
                combined.alpha_composite(overlays[glasses][frame])
                expected, _ = build(frame, True)
                assert combined.tobytes() == expected.tobytes(), (name, frame, scarf, glasses)
    new_sheets.append({'name': name, 'frames': count, 'cell': CELL, 'columns': COLS,
                       'anchor': list(ORIGIN), 'fps': 24, 'cels': [info for image, info in built]})
names = {sheet['name'] for sheet in new_sheets} | {'bronze-spring'}
manifest['sheets'] = [sheet for sheet in manifest['sheets'] if sheet['name'] not in names] + new_sheets
manifest_path.write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
# Props are authored pixel cels with bronze hardware and rotating wheel spokes.
board_sheet = Image.new('RGBA', (64 * 12, 16))
for frame in range(12):
    prop = Image.new('RGBA', (64, 16))
    draw = ImageDraw.Draw(prop)
    draw.polygon([(12, 6), (16, 8), (48, 8), (52, 6), (53, 8), (49, 11),
                  (15, 11), (11, 8)], fill='#bd7a42', outline='#4c3323')
    draw.line((16, 9, 48, 9), fill='#e3b26b')
    for wx in [20, 44]:
        draw.line((wx, 10, wx, 12), fill='#6d513e')
        draw.ellipse((wx - 2, 10, wx + 2, 14), fill='#3c342e', outline='#bd8d54')
        angle = frame / 12 * math.tau
        draw.line((wx, 12, wx + round(math.cos(angle)), 12 + round(math.sin(angle))), fill='#e4bf82')
    board_sheet.alpha_composite(prop, (frame * 64, 0))
board_sheet.save(OUT / 'bronze-board.png', optimize=True)

ramp = Image.new('RGBA', (128, 14))
draw = ImageDraw.Draw(ramp)
draw.rectangle((0, 0, 127, 9), fill='#714a2d', outline='#422e20')
draw.rectangle((0, 0, 127, 3), fill='#b47a43')
draw.line((0, 0, 127, 0), fill='#e6bd7b')
for x in range(0, 128, 16):
    draw.line((x, 1, x, 8), fill='#573b27')
    draw.point((x + 3, 2), fill='#e5bd7c')
    draw.line((x + 4, 6, x + 13, 6), fill='#825736')
ramp.save(OUT / 'bronze-ramp.png', optimize=True)


print('Exported 16 native-colour sheets and 8 registered wardrobe sheets. All wardrobe combinations match authored cels.')
