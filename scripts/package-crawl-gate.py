"""Package the approved ImageGen cutout; no repainting, shape drawing or native-duck edits."""
from pathlib import Path
from PIL import Image
import shutil, json

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'frontend/public/assets/duck-race/phaser-v2'
OUT.mkdir(parents=True, exist_ok=True)
source = Path(r'C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-a1aa6257-92cd-45d3-ac42-1d5c2fb778cd.png')
im = Image.open(source).convert('RGBA')
# Ignore very faint generation residue when measuring padding, preserve actual asset pixels.
box = im.getchannel('A').point(lambda a: 255 if a > 200 else 0).getbbox()
assert box is not None
box = (max(0,box[0]-8),max(0,box[1]-8),min(im.width,box[2]+8),min(im.height,box[3]+8))
asset = im.crop(box)
asset.save(OUT / 'crawl-gate.png')
asset.save(OUT / 'crawl-gate.webp', lossless=True)
shutil.copy2(Path(r'C:/Users/PHONG/AppData/Local/Temp/codex-clipboard-94992c33-8a22-4b0c-af11-679263d18987.png'), OUT / 'approved-reference.png')
(OUT / 'crawl-gate-source.json').write_text(json.dumps({
    'approvedReference': 'approved-reference.png', 'source': source.name,
    'method': 'built-in ImageGen transparent isolation, then alpha-bounds packaging only',
    'crop': box, 'size': asset.size, 'axisX': 228, 'farFootY': 155, 'nearFootY': 1030,
    'approvedScope': 'Only this vertically aligned Shift crawl obstacle; no other V2 silhouettes approved.'
}, ensure_ascii=False, indent=2), encoding='utf-8')
print('Packaged approved crawl gate:', asset.size)
