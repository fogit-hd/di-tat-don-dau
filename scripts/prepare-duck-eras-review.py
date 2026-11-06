"""Copy existing art/sprites into the isolated approval demo, never into live logic."""
from pathlib import Path
import json, shutil

ROOT = Path(__file__).resolve().parents[1]
SRC = ROOT / 'frontend/public/assets/duck-race'
DEST = ROOT / 'design-preview/duck-race-eras-v1/assets'
DEST.mkdir(parents=True, exist_ok=True)
for folder in ['eras-v1', 'frames-v9']:
    for path in (SRC / folder).glob('*.webp'):
        target = DEST / folder / path.name
        target.parent.mkdir(parents=True, exist_ok=True)
        shutil.copy2(path, target)
for name in ['teal', 'amber']:
    target = DEST / 'buttons' / f'{name}.webp'
    target.parent.mkdir(parents=True, exist_ok=True)
    shutil.copy2(SRC / f'painted-frames-v2/button-{name}-normal.webp', target)
shutil.copy2(SRC / 'lettering-ai-v5/brand-title.webp', DEST / 'logo.webp')
shutil.copy2(SRC / 'svg/shadow.svg', DEST / 'shadow.svg')
shutil.copy2(SRC / 'ui-v6/you-marker.svg', DEST / 'marker.svg')
shutil.copy2(ROOT / 'frontend/public/assets/fonts/public-ui/DejaVuSans.ttf', DEST / 'ui.ttf')
manifest = json.loads((SRC / 'manifest-v12.json').read_text())
for color in ['yellow', 'aqua', 'blue', 'green', 'orange', 'purple', 'red']:
    for pose in ['idle', 'walk_run', 'crouch']:
        key = f'duckee/{color}/{pose}'
        for path in (SRC / manifest[key].get('frameRoot', key)).glob('*.png'):
            target = DEST / key / path.name
            target.parent.mkdir(parents=True, exist_ok=True)
            shutil.copy2(path, target)
print('Prepared isolated review art; no game modules changed.')
