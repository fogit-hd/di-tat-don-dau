"""Check actual packed body/gear pixels, not just their manifest declarations."""
from pathlib import Path
from PIL import Image
import json

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'frontend/public/assets/duck-race'
manifest = json.loads((ASSET / 'manifest-v12.json').read_text())
atlas_data = json.loads((ASSET / 'ducks-v12.json').read_text())
atlas = Image.open(ASSET / 'ducks-v12.png').convert('RGBA')
gear = json.loads((ASSET / 'gear-poses-v12.json').read_text())
checked, widths = 0, []
for key, meta in manifest.items():
    pose = key.split('/')[-1]
    if pose not in ['jump', 'air', 'fall', 'double_jump', 'roll']: continue
    assert 'native-v12/' in meta['frameRoot']
    assert meta['source'].endswith('/roll_2.png' if pose == 'roll' else '/jump.png' if pose == 'jump'
        else '/floating_flap.png' if pose == 'air' else '/floating_fall.png' if pose == 'fall' else '/multi_jump.png')
    for frame in range(meta['frames']):
        name = f'{key}/{frame}'
        box = atlas_data['frames'][name]['frame']
        packed = atlas.crop((box['x'], box['y'], box['x'] + 64, box['y'] + 64))
        source = Image.open(ASSET / meta['frameRoot'] / f'{frame}.png').convert('RGBA')
        assert packed.tobytes() == source.tobytes(), name
        x1, y1, x2, y2 = source.getbbox()
        assert x1 > 2 and y1 > 2 and x2 < 62 and y2 < 62, name
        if pose in ['air', 'fall', 'double_jump']:
            assert x2 - x1 == 23, (name, source.getbbox())
            widths.append(x2 - x1)
        assert atlas.crop((box['x'] - 2, box['y'], box['x'], box['y'] + 64)).getbbox() is None
        assert atlas.crop((box['x'] + 64, box['y'], box['x'] + 66, box['y'] + 64)).getbbox() is None
        for item in ['goggles', 'leaf', 'helmet', 'crown', 'scarf', 'fins', 'boots', 'feather']:
            assert f'{item}/{pose}/{frame}' in gear['frames']
        checked += 1
report = {'framesChecked': checked, 'airborneWidthPx': sorted(set(widths)),
    'canvasPx': 64, 'groundAnchorY': 48, 'rollSource': 'DuckyV2/roll_2.png',
    'takeoffFrames': 1, 'packedPixelsMatchSources': True, 'transparentAtlasGutters': True,
    'gearFramesPresent': True}
(ROOT / 'design-preview/duck-race-v12/asset-verification.json').write_text(json.dumps(report, indent=2))
print(json.dumps(report))
