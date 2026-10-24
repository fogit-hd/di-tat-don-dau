"""Optimize a built-in image-generation result; no image API or app dependency."""
import argparse
import re
from pathlib import Path
from PIL import Image

parser = argparse.ArgumentParser()
parser.add_argument('--source', required=True)
parser.add_argument('--industry', required=True)
parser.add_argument('--line', required=True, choices=['eng', 'mac', 'sup', 'inf', 'grn'])
args = parser.parse_args()
if not re.fullmatch(r'[a-z0-9]+(?:-[a-z0-9]+)*', args.industry):
    raise SystemExit('Invalid industry slug')
repo = Path(__file__).resolve().parents[1]
source = Path(args.source).resolve(strict=True)
asset_root = (repo / 'frontend/public/assets/investments/handdrawn-v1').resolve()
target = (asset_root / args.industry / f'{args.line}.webp').resolve()
if not target.is_relative_to(asset_root):
    raise SystemExit('Asset target outside industries directory')
if target.exists():
    raise SystemExit('Refusing to overwrite existing asset')
with Image.open(source) as raw:
    image = raw.convert('RGB')
    image.thumbnail((480, 320), Image.Resampling.LANCZOS)
    if image.width < 240 or image.height < 160:
        raise SystemExit('Generated source too small')
    target.parent.mkdir(parents=True, exist_ok=True)
    image.save(target, 'WEBP', quality=88)
    print(f'{args.industry}/{args.line}: {image.width}x{image.height}, {target.stat().st_size} bytes')
