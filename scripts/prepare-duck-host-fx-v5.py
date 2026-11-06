"""Approval-only package. Never writes production assets or gameplay source."""
from pathlib import Path
from PIL import Image, ImageDraw
import json
import shutil

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'design-preview/duck-race-host-fx-v5'
ASSETS = OUT / 'assets'
PUBLIC = ROOT / 'frontend/public/assets/duck-race'
ASSETS.mkdir(parents=True, exist_ok=True)
manifest = json.loads((OUT / 'sources.json').read_text(encoding='utf-8'))
for kind, source in manifest['acceptedSources'].items():
    image = Image.open(source).convert('RGBA')
    target = ASSETS / 'fx' / kind
    target.mkdir(parents=True, exist_ok=True)
    for i in range(6):
        frame = image.crop((i % 3 * 512, i // 3 * 512, i % 3 * 512 + 512, i // 3 * 512 + 512))
        # Drop invisible matte noise only; keep scale/anchor equal across frames.
        alpha = frame.getchannel('A').point(lambda a: 0 if a < 8 else a)
        frame.putalpha(alpha)
        frame.save(target / f'{i}.webp', quality=95, method=6)
    shutil.copy2(source, target / 'source.png')
for source, dest in [
    ('experience-v4/native.png', 'native.png'),
    ('experience-v4/native.json', 'native.json'),
    ('experience-v4/paper.webp', 'paper.webp'),
    ('experience-v4/hud.webp', 'hud.webp'),
    ('experience-v4/forest.webp', 'forest.webp'),
    ('materials-v4/forest.webp', 'forest-texture.webp'),
    ('experience-v4/amber.webp', 'amber.webp'),
    ('lettering-ai-v5/brand-title.webp', 'brand.webp'),
    ('svg/shadow.svg', 'shadow.svg'),
    ('scroll-v4/2/scene-1.webp', 'road.webp'),
]:
    shutil.copy2(PUBLIC / source, ASSETS / dest)
shutil.copy2(ROOT / 'frontend/public/assets/fonts/public-ui/DejaVuSans.ttf', ASSETS / 'ui.ttf')
for kind in ('safe', 'single', 'explosive'):
    shutil.copytree(PUBLIC / 'eras-v2/chests' / kind, ASSETS / 'chests' / kind, dirs_exist_ok=True)
print('Packaged five six-frame FX sets and original native assets for review only.')
