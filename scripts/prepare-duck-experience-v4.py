"""Package approval comps and existing native frames. Never changes live assets."""
from pathlib import Path
import json
import shutil
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
OUT = ROOT / 'design-preview/duck-race-experience-v4'
GENERATED = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
SOURCES = {
    'landing': 'exec-eefaae33-11c7-4c5c-88ee-b8e9170627b5.png',
    'join-flow': 'exec-f804d3a3-8c29-4499-b923-b41d47c87bf3.png',
    'gameplay': 'exec-74cf94de-449e-4af1-ac55-71a61a340be3.png',
    'mobile': 'exec-2ecfca0b-d244-43a6-8412-5a4f4f23d148.png',
    'reward': 'exec-ba82a04f-53a8-45c7-90b8-f7ffa428133f.png',
    'cosmetics': 'exec-eb585315-ee9b-429a-8e26-5df0b14c08da.png',
    'transitions': 'exec-639eab37-8c58-4aae-8ac7-2340f4b88d71.png',
}
(OUT / 'comps').mkdir(parents=True, exist_ok=True)
manifest = {'status': 'Approval concepts only; no live implementation', 'sources': []}
for key, filename in SOURCES.items():
    source = GENERATED / filename
    shutil.copy2(source, OUT / 'comps' / f'{key}.png')
    with Image.open(source) as image:
        image.save(OUT / 'comps' / f'{key}.webp', quality=94, method=6)
        manifest['sources'].append({'key': key, 'source': str(source), 'size': image.size})

native = ROOT / 'frontend/public/assets/duck-race/duckee'
for color in ('green', 'yellow', 'aqua', 'purple', 'blue', 'orange', 'red'):
    poses = ('idle', 'walk_run', 'take_damage', 'fall', 'knockout', 'land') if color == 'green' else ('walk_run',)
    for pose in poses:
        shutil.copytree(native / color / pose, OUT / 'assets/duckee' / color / pose, dirs_exist_ok=True)
review_assets = ROOT / 'design-preview/duck-race-eras-v2/assets'
(OUT / 'assets').mkdir(exist_ok=True)
for item in ('shadow.svg', 'marker.svg', 'ui.ttf'):
    shutil.copy2(review_assets / item, OUT / 'assets' / item)
shutil.copy2(ROOT / 'frontend/public/assets/duck-race/scroll-v4/2/scene-1.webp', OUT / 'assets/road.webp')
shutil.copy2(ROOT / 'frontend/public/assets/duck-race/scroll-v4/smoke-atlas.webp', OUT / 'assets/dust.webp')
(OUT / 'sources.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Packaged {len(SOURCES)} comps and original native duck frames into {OUT}')
