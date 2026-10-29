"""Development-only alpha-margin packing and WebP encoding of ImageGen props.
No art redrawing, body-part rigging or app dependencies.
"""
import json
from pathlib import Path
from PIL import Image

root = Path(__file__).resolve().parents[1]
source = Path.home() / '.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc'
output = root / 'frontend/public/assets/living-hero-v2'
output.mkdir(parents=True, exist_ok=True)
assets = {
    'forklift': ('ac23e709-ec26-4772-8642-632c7bbcf16b', 900),
    'boat-empty': ('0b8c07ab-3bcf-417e-9832-9f8679cb99c4', 900),
}
manifest = {'artSource': 'builtin-imagegen/native-alpha', 'loopSeconds': 24, 'assets': {}}
for name, (image_id, width) in assets.items():
    image = Image.open(source / f'exec-{image_id}.png').convert('RGBA')
    bounds = image.getchannel('A').point(lambda a: 255 if a > 16 else 0).getbbox()
    image = image.crop(bounds)
    image.thumbnail((width, width), Image.Resampling.LANCZOS)
    image.save(output / f'{name}.webp', quality=92, method=6)
    manifest['assets'][name] = {'imagegenSource': image_id, 'width': image.width, 'height': image.height, 'bytes': (output / f'{name}.webp').stat().st_size}
(output / 'manifest.json').write_text(json.dumps(manifest, indent=2) + '\n', encoding='utf-8')
print(json.dumps(manifest))
