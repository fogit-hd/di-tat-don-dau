"""Restore native roll_2 and register airborne frames to the same body size.

Offline sprite packing only; no application dependency or runtime scaling tween.
"""
from pathlib import Path
from collections import Counter, defaultdict
from PIL import Image, ImageDraw
import json, math, shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'frontend/public/assets/duck-race'
NATIVE = Path('C:/Users/PHONG/Downloads/DuckyV2/Ducky/Spritesheets')
PREVIEW = ROOT / 'design-preview/duck-race-v12'
PREVIEW.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT / 'manifest-v9.json').read_text())
native_idle = Image.open(NATIVE / 'idle.png').convert('RGBA').crop((0, 0, 64, 64))
replacement = {'jump': 'jump', 'air': 'floating_flap', 'fall': 'floating_fall',
               'double_jump': 'multi_jump', 'roll': 'roll_2'}
frames, metrics = [], {}
for key, meta in manifest.items():
    model, color, pose = key.split('/')
    if pose in replacement:
        target = Image.open(OUT / model / color / 'idle/0.png').convert('RGBA')
        votes = defaultdict(Counter)
        for source, dest in zip(native_idle.getdata(), target.getdata()):
            if source[3] and dest[3]: votes[source[:3]][dest[:3]] += 1
        palette = {rgb: count.most_common(1)[0][0] for rgb, count in votes.items()}
        source = replacement[pose]
        sheet = Image.open(NATIVE / (source + '.png')).convert('RGBA')
        count = 1 if pose == 'jump' else sheet.width // 64
        root = 'native-v12/' + key
        dest_dir = OUT / root
        dest_dir.mkdir(parents=True, exist_ok=True)
        clip = []
        for i in range(count):
            image = sheet.crop((i * 64, 0, (i + 1) * 64, 64))
            if pose in ['air', 'fall', 'double_jump']:
                # These source clips were authored 34px wide, vs 23px idle.
                # Use ONE transform for the whole clip, not per-frame bbox fitting.
                crop = image.crop((15, 17, 49, 48)).resize((23, 21), Image.Resampling.NEAREST)
                image = Image.new('RGBA', (64, 64))
                image.alpha_composite(crop, (19, 27))
            image.putdata([(*palette.get(p[:3], p[:3]), p[3]) for p in image.getdata()])
            image.save(dest_dir / f'{i}.png')
            clip.append(image)
        meta.update(frames=count, frameRoot=root, source='DuckyV2/Spritesheets/' + source + '.png',
                    registration='64px canvas; ground anchor y=48; airborne width 23px; native roll_2')
    else:
        clip = [Image.open(OUT / key / f'{i}.png').convert('RGBA') for i in range(meta['frames'])]
    for i, image in enumerate(clip):
        frames.append((f'{key}/{i}', image))
        metrics[f'{key}/{i}'] = list(image.getbbox()) if image.getbbox() else None

cell, cols = 68, 16
atlas = Image.new('RGBA', (cols * cell, math.ceil(len(frames) / cols) * cell))
data = {'frames': {}, 'animations': {}, 'meta': {'image': 'ducks-v12.png', 'scale': '1',
        'size': {'w': atlas.width, 'h': atlas.height}}}
for i, (key, image) in enumerate(frames):
    x, y = i % cols * cell + 2, i // cols * cell + 2
    atlas.paste(image, (x, y))
    data['frames'][key] = {'frame': {'x': x, 'y': y, 'w': 64, 'h': 64},
        'sourceSize': {'w': 64, 'h': 64}, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': 64, 'h': 64},
        'rotated': False, 'trimmed': False}
    data['animations'].setdefault(key.rsplit('/', 1)[0], []).append(key)
atlas.save(OUT / 'ducks-v12.png')
(OUT / 'ducks-v12.json').write_text(json.dumps(data, separators=(',', ':')))
(OUT / 'manifest-v12.json').write_text(json.dumps(manifest, indent=2))
(PREVIEW / 'frame-bounds.json').write_text(json.dumps(metrics, indent=2))
shutil.copyfile(Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-42615279-a41b-4746-9f17-09773a19f748.png'), PREVIEW / 'obstacle-canvas.png')

# Actual exported frames, same 3x scale and ground baseline, for visual inspection.
rows = ['idle', 'jump', 'air', 'fall', 'double_jump', 'roll', 'guard']
contact = Image.new('RGB', (900, len(rows) * 200), '#344d3c')
d = ImageDraw.Draw(contact)
lookup = dict(frames)
for row, pose in enumerate(rows):
    key = 'duckee/yellow/' + pose
    d.text((8, row * 200 + 12), pose, fill='#fff0bd')
    d.line((120, row * 200 + 164, 900, row * 200 + 164), fill='#6e8068')
    for i in range(manifest[key]['frames']):
        image = lookup[f'{key}/{i}'].resize((192, 192), Image.Resampling.NEAREST)
        contact.paste(image, (120 + i * 192, row * 200 + 20), image)
contact.save(PREVIEW / 'registered-motion.png')
print(f'{len(frames)} frames packed; native roll_2; airborne body width 23px')
