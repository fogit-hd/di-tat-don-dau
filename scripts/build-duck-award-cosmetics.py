"""Bake frame-registered award accessories from the existing wardrobe artwork.

The native bodies and approved ceremony sheets are never modified. Head turn,
upward gaze, crouch and prop occlusion are sampled at source-pixel resolution.
Run locally when award cels or wardrobe art change. No app dependency is needed.
"""
from pathlib import Path
from PIL import Image
import json
import math
from duck_wardrobe_art import fitted_glasses

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'frontend/public/assets/duck-race'
OUT = ART / 'results-v1/cosmetics'
manifest = json.loads((ART / 'results-v1/manifest.json').read_text(encoding='utf-8'))
atlas = Image.open(ART / 'experience-v4/cosmetics.png').convert('RGBA')
frames = json.loads((ART / 'experience-v4/cosmetics.json').read_text())['frames']
body_colors = {(64, 142, 47), (21, 86, 7), (128, 197, 113)}
beak_colors = {(170, 127, 56), (236, 198, 135), (103, 67, 9)}


def native(pose, frame):
    return Image.open(ART / f'duckee/green/{pose}/{frame}.png').convert('RGBA')


def accessory(item, pose, frame):
    if item in ('brass', 'dark'):
        return fitted_glasses(item, pose, frame, native(pose, frame))
    key = f'{item}/{pose}/{frame}'
    if key in frames:
        f = frames[key]['frame']
        return atlas.crop((f['x'], f['y'], f['x'] + 64, f['y'] + 64))
    # The bow uses original crouch cels, absent from the racing wardrobe atlas.
    body = native(pose, frame)
    pixels = body.load()
    points = [(x, y) for y in range(64) for x in range(64)
              if pixels[x, y][3] and pixels[x, y][:3] in body_colors]
    cx = sum(x for x, y in points) / len(points)
    cy = sum(y for x, y in points) / len(points)
    top = min(y for x, y in points)
    width = max(x for x, y in points) - min(x for x, y in points) + 1
    bill = [(x, y) for y in range(64) for x in range(64)
            if pixels[x, y][3] and pixels[x, y][:3] in beak_colors and x >= cx and y < cy + 6]
    by = sum(y for x, y in bill) / len(bill) if bill else cy + 1
    glasses = item in ('brass', 'dark')
    source = Image.open(ART / f'experience-v4/gear-{item}.webp').convert('RGBA')
    w = round(min(21 if glasses else 24, width * (.78 if glasses else .96)))
    h = max(5, round(source.height / source.width * w))
    x = round(cx + 2 - w * .65) if glasses else round(cx - 1 - w * .58)
    y = round(top + 2 - h * .55) if glasses else round(by + 3 - h * .45)
    result = Image.new('RGBA', (64, 64))
    result.alpha_composite(source.resize((w, h), Image.Resampling.NEAREST), (x, y))
    return result


def cel(item, sheet, frame):
    name, cell = sheet['name'], sheet['cell']
    metadata = sheet.get('cels', [])
    info = metadata[frame] if metadata else {}
    pose = name if name in ('idle', 'land', 'crouch') else 'idle'
    source_frame = frame if pose != 'idle' or name == 'idle' else info.get('nativeFrame', 0)
    if name == 'winner-crowned-idle':
        source_frame = frame
    source = accessory(item, pose, source_frame)
    body = native(pose, source_frame)
    look = info.get('lookUp', 0)
    back = name == 'winner-coronation' and frame < 7
    angle = math.radians(-18 * look)
    co, si = math.cos(angle), math.sin(angle)
    transformed = Image.new('RGBA', (64, 64))
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
                # The beak continues to occlude the glasses and collar.
                if body.getpixel((sx, sy))[:3] not in beak_colors:
                    transformed.putpixel((x, y), source.getpixel((sx, sy)))
    result = Image.new('RGBA', (cell, cell))
    result.alpha_composite(transformed, (16, 40) if cell == 96 else (0, 0))
    if name not in ('idle', 'land', 'crouch'):
        color = 'green'
        prop = Image.open(ART / f'results-v1/{color}/{name}.png').convert('RGBA')
        columns = sheet.get('columns', sheet['frames'])
        x, y = frame % columns * cell, frame // columns * cell
        prop = prop.crop((x, y, x + cell, y + cell))
        palette = set(native('idle', 0).getdata())
        for y in range(cell):
            for x in range(cell):
                pixel = prop.getpixel((x, y))
                if pixel[3] and pixel not in palette:
                    result.putpixel((x, y), (0, 0, 0, 0))
    return result


# Complete new motions own their occlusion-aware overlays in their builders.
sheets = [sheet for sheet in manifest['sheets'] if sheet['name'] not in ('bronze-spring', 'bronze-skate', 'silver-swing', 'winner-coronation', 'winner-crowned-idle')] + [
    {'name': 'idle', 'frames': 4, 'cell': 64},
    {'name': 'land', 'frames': 2, 'cell': 64},
    {'name': 'crouch', 'frames': 2, 'cell': 64},
]
for item in ('brass', 'dark', 'red', 'teal'):
    folder = OUT / item
    folder.mkdir(parents=True, exist_ok=True)
    for sheet in sheets:
        cell = sheet['cell']
        columns = sheet.get('columns', sheet['frames'])
        result = Image.new('RGBA', (columns * cell, math.ceil(sheet['frames'] / columns) * cell))
        for frame in range(sheet['frames']):
            result.alpha_composite(cel(item, sheet, frame), (frame % columns * cell, frame // columns * cell))
        result.save(folder / (sheet['name'] + '.png'), optimize=True)
print(f'Exported {len(sheets) * 4} per-frame accessory sheets for native and parachute poses.')
