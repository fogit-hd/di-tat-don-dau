"""Package generated scenery and chest art for the new mode's approval canvas.

No runtime routes, economy, room limits, or existing assets are changed.
"""
from pathlib import Path
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
OUT = ROOT / 'frontend/public/assets/duck-race/eras-v1'
OUT.mkdir(parents=True, exist_ok=True)
files = {
    'era-1': 'exec-35508070-a19c-4504-b664-bcea73fc720e.png',
    'era-2': 'exec-2d419b02-f74b-499c-a1a5-0c075f039d26.png',
    'era-3': 'exec-e1b7444c-b5bc-4c15-9989-3b0390987793.png',
    'era-4': 'exec-2ff98434-77d9-40ef-969a-568638f6bea0.png',
}
for key, filename in files.items():
    Image.open(SOURCE / filename).convert('RGB').save(OUT / f'{key}.webp', quality=92, method=6)

sheet = Image.open(SOURCE / 'exec-83f2fa2a-14e2-4bcb-829a-ac5bc747e93d.png').convert('RGBA')
for index, name in enumerate(['capital', 'knowledge', 'sprint']):
    cell = sheet.crop((index * sheet.width // 3, 0, (index + 1) * sheet.width // 3, sheet.height))
    bounds = cell.getchannel('A').point(lambda value: 255 if value > 32 else 0).getbbox()
    if bounds:
        left, top, right, bottom = bounds
        cell = cell.crop((max(0, left-8), max(0, top-8), min(cell.width, right+8), min(cell.height, bottom+8)))
    cell.save(OUT / f'chest-{name}.webp', lossless=True, method=6)

(OUT / 'provenance.json').write_text(json.dumps({
    'status': 'Review artwork only. Not activated in live rooms.',
    'generator': 'Built-in image_gen',
    'backgrounds': files,
    'chestSheet': 'exec-83f2fa2a-14e2-4bcb-829a-ac5bc747e93d.png',
    'backgroundBrief': 'Same 16:9 countryside side-scroller geometry; empty horizontal ochre running strip; no ducks, text, obstacles or HUD. Era1 steam mills; era2 electric mass production; era3 electronics and automation; era4 connected smart factories.',
    'chestBrief': 'Three separate hand-painted closed wood/gold chests: coin, book and wing emblems. Transparent sheet. No text or characters.',
    'nativeDuckPolicy': 'No duck pixels generated or redrawn. Existing duckee idle, walk and crouch frames only. Book is a separate proposed prop.',
}, ensure_ascii=False, indent=2), encoding='utf-8')
print('Packaged 4 backgrounds and 3 chests:', OUT)
