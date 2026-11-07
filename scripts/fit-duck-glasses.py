"""Patch only the existing eye-gear atlas cells, preserving scarf/native art."""
from pathlib import Path
from PIL import Image
import json
from duck_wardrobe_art import EYES, fitted_glasses

ROOT = Path(__file__).resolve().parents[1]
ART = ROOT / 'frontend/public/assets/duck-race'
OUT = ART / 'experience-v4'
metadata = json.loads((OUT / 'cosmetics.json').read_text(encoding='utf-8'))
sheet = Image.open(OUT / 'cosmetics.png').convert('RGBA')
registration = json.loads((OUT / 'registration.json').read_text(encoding='utf-8'))
count = 0
for key, entry in metadata['frames'].items():
    item, pose, frame_text = key.split('/')
    if item not in ('brass', 'dark'):
        continue
    frame = int(frame_text)
    body = Image.open(ART / f'duckee/green/{pose}/{frame}.png').convert('RGBA')
    overlay = fitted_glasses(item, pose, frame, body)
    rect = entry['frame']
    sheet.paste(overlay, (rect['x'], rect['y']))
    registration[f'{pose}/{frame}']['eyes'] = EYES[pose][frame]
    count += 1
sheet.save(OUT / 'cosmetics.png', optimize=True)
(OUT / 'registration.json').write_text(json.dumps(registration, ensure_ascii=False, indent=2), encoding='utf-8')
print(f'Updated {count} eye-fitted eyewear cells. Existing atlas coordinates retained.')
