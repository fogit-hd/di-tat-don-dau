"""One-off asset packing/encoding. No application or Python dependencies are added.

Art is generated with ImageGen; this only crops transparent margins, registers
whole-character frames at one foot baseline and encodes the runtime WebPs.
"""
import argparse
import json
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('source', type=Path, help='ImageGen output directory')
args = parser.parse_args()
out = Path(__file__).resolve().parents[1] / 'frontend/public/assets/living-hero-v1'
out.mkdir(parents=True, exist_ok=True)
sources = {
    'scene-desktop': '188fd090-df97-4610-b8af-be222c4dc727',
    'scene-mobile': '14a049b7-d4d4-4f0b-aeae-4151a89897ca',
    'truck': 'b4d6dbac-024d-4fa8-bff7-a1f4c5362aca',
    'boat': '94cddade-9579-4463-97f1-e796e9b907db',
    'hoist': 'a1a3114c-b6fa-4a6a-baf7-a78dce16281c',
    'smoke': 'e83f328e-c24d-4669-a948-145806b39e71',
    'workers': '36bbde5a-1b0f-4a74-8fbf-5818f427914a',
    'props-source': '127efa11-65b4-470f-ab9d-d4884e31a508',
}
manifest = {}

def load(key):
    return Image.open(args.source / f'exec-{sources[key]}.png').convert('RGBA')

def trim(image):
    # Ignore near-invisible edge noise when finding the packing rectangle.
    bounds = image.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    return image.crop(bounds) if bounds else image

def save(key, image, max_width=None):
    if max_width and image.width > max_width:
        image = image.resize((max_width, round(image.height * max_width / image.width)), Image.Resampling.LANCZOS)
    image.save(out / f'{key}.webp', quality=90, method=6)
    manifest[key] = {'width': image.width, 'height': image.height, 'bytes': (out / f'{key}.webp').stat().st_size}

for key in ['scene-desktop', 'scene-mobile']:
    save(key, load(key).convert('RGB'))
for key in ['truck', 'boat', 'hoist', 'smoke']:
    save(key, trim(load(key)), 1000 if key == 'truck' else 700)

atlas = load('workers')
packed = Image.new('RGBA', (1920, 960))
for index in range(8):
    col, row = index % 4, index // 4
    cell = atlas.crop((round(col * atlas.width / 4), round(row * atlas.height / 2), round((col + 1) * atlas.width / 4), round((row + 1) * atlas.height / 2)))
    cell = trim(cell)
    # Translate only. Never rescale individual poses to a common height: bending
    # must lower the heads rather than enlarge the entire pair of people.
    packed.alpha_composite(cell, (col * 480 + (480 - cell.width) // 2, row * 480 + 466 - cell.height))
save('workers', packed)
props = load('props-source')
save('crate', trim(props.crop((10, 560, 490, 985))), 360)
save('water', trim(props.crop((1030, 570, 1510, 1000))), 500)
(out / 'manifest.json').write_text(json.dumps({'assets': manifest, 'imagegenSources': sources, 'loopSeconds': 12, 'workerCell': 480}, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest, indent=2))
