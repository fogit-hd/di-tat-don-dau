"""One-off asset importer. Requires local Pillow, not an application dependency."""
from pathlib import Path
from PIL import Image
import argparse
import json

parser = argparse.ArgumentParser()
parser.add_argument('--duckee', default='C:/Users/PHONG/Downloads/duckee/duckee')
parser.add_argument('--ducky', default='C:/Users/PHONG/Downloads/DuckyV2/Ducky/Spritesheets')
args = parser.parse_args()
root = Path(__file__).resolve().parents[1] / 'frontend/public/assets/duck-race'
root.mkdir(parents=True, exist_ok=True)
manifest, frames = {}, []
for colour in sorted(Path(args.duckee).iterdir()):
    if not colour.is_dir():
        continue
    for state in ['idle', 'walk_run', 'jump', 'fall', 'roll', 'take_damage', 'land', 'crouch']:
        sources = sorted((colour / 'individual_animations' / state / 'png_sequence').glob('*.png'))
        key = f'duckee/{colour.name}/{state}'
        dest = root / key
        dest.mkdir(parents=True, exist_ok=True)
        images = [Image.open(source).convert('RGBA') for source in sources]
        if not images:
            # The supplied purple jump folder contains GIFs despite its name.
            gif = next((colour / 'individual_animations' / state / 'gif').glob('*.gif'), None)
            if gif:
                animation = Image.open(gif)
                for frame_no in range(animation.n_frames):
                    animation.seek(frame_no); images.append(animation.convert('RGBA').copy())
        assert images, f'Missing native clip: {key}'
        for i, im in enumerate(images):
            assert im.size == (64, 64), key
            im.save(dest / f'{i}.png')
            frames.append((f'{key}/{i}', im))
        manifest[key] = {'frames': len(images), 'width': 64, 'height': 64, 'fps': 8 if state == 'idle' else 10}
    # Duckee ships no crawl. Adapt complete native walk frames to a low posture,
    # keeping the original palette and the same 48px ground contact; no limb rig.
    key = f'duckee/{colour.name}/crawl'
    dest = root / key; dest.mkdir(parents=True, exist_ok=True)
    for i, source in enumerate(sorted((root / f'duckee/{colour.name}/walk_run').glob('*.png'))):
        original = Image.open(source).convert('RGBA')
        low = original.crop((0, 0, 64, 48)).resize((64, 29), Image.Resampling.NEAREST)
        frame = Image.new('RGBA', (64, 64)); frame.paste(low, (0, 19))
        frame.save(dest / f'{i}.png'); frames.append((f'{key}/{i}', frame))
    manifest[key] = {'frames': 4, 'width': 64, 'height': 64, 'fps': 9, 'derived': 'whole-frame low-posture native walk; feet stay at y=48'}
    key = f'duckee/{colour.name}/air'
    dest = root / key; dest.mkdir(parents=True, exist_ok=True)
    for i, source in enumerate([root / f'duckee/{colour.name}/jump/1.png', root / f'duckee/{colour.name}/jump/2.png']):
        frame = Image.open(source).convert('RGBA'); frame.save(dest / f'{i}.png'); frames.append((f'{key}/{i}', frame))
    manifest[key] = {'frames': 2, 'width': 64, 'height': 64, 'fps': 7, 'derived': 'native mid-air tumble frames'}
for state, source in [('idle', 'idle'), ('walk_run', 'walk'), ('jump', 'jump'), ('air', 'floating_flap'), ('fall', 'floating_fall'), ('land', 'land'), ('roll', 'roll_1'), ('take_damage', 'hit'), ('crouch', 'crouch'), ('crawl', 'crawl'), ('attack', 'right_hook')]:
    im = Image.open(Path(args.ducky) / f'{source}.png').convert('RGBA')
    assert im.height == 64 and im.width % 64 == 0
    key = f'ducky/yellow/{state}'
    dest = root / key
    dest.mkdir(parents=True, exist_ok=True)
    for i in range(im.width // 64):
        frame = im.crop((i * 64, 0, (i + 1) * 64, 64))
        frame.save(dest / f'{i}.png')
        frames.append((f'{key}/{i}', frame))
    manifest[key] = {'frames': im.width // 64, 'width': 64, 'height': 64, 'fps': 8 if state == 'idle' else 10}
# Atlas padding keeps nearest-neighbour texel sampling from bleeding into adjacent frames.
cell, columns = 68, 16
atlas = Image.new('RGBA', (columns * cell, ((len(frames) + columns - 1) // columns) * cell))
data = {'frames': {}, 'animations': {}, 'meta': {'image': 'ducks.png', 'scale': '1', 'size': {'w': atlas.width, 'h': atlas.height}}}
for i, (key, frame) in enumerate(frames):
    x, y = (i % columns) * cell + 2, (i // columns) * cell + 2
    atlas.paste(frame, (x, y))
    data['frames'][key] = {'frame': {'x': x, 'y': y, 'w': 64, 'h': 64}, 'sourceSize': {'w': 64, 'h': 64}, 'spriteSourceSize': {'x': 0, 'y': 0, 'w': 64, 'h': 64}, 'rotated': False, 'trimmed': False}
    data['animations'].setdefault(key.rsplit('/', 1)[0], []).append(key)
atlas.save(root / 'ducks.png')
(root / 'ducks.json').write_text(json.dumps(data, separators=(',', ':')), encoding='utf-8')
(root / 'manifest.json').write_text(json.dumps(manifest, indent=2), encoding='utf-8')
print(f'{len(manifest)} clips, {len(frames)} frames, atlas {atlas.width}x{atlas.height}')
