"""Audit all 64 x 4 industry images and make labeled visual review sheets."""
import argparse
import hashlib
import json
from pathlib import Path
from PIL import Image, ImageDraw, ImageFont

parser = argparse.ArgumentParser()
parser.add_argument('--allow-incomplete', action='store_true')
parser.add_argument('--sheets', action='store_true')
args = parser.parse_args()
repo = Path(__file__).resolve().parents[1]
industries = json.loads((repo / 'backend/prisma/seed/industries.seed.json').read_text(encoding='utf-8'))['industries']
keys = {'eng': 'nhanLuc', 'mac': 'mayMoc', 'sup': 'phuTro', 'inf': 'haTang'}
missing, invalid, present, hashes = [], [], [], {}
for industry in industries:
    for line, label_key in keys.items():
        file = repo / f'frontend/public/assets/investments/handdrawn-v1/{industry["slug"]}/{line}.webp'
        asset = {'industry': industry['slug'], 'line': line, 'label': industry['investLabels'][label_key], 'path': str(file.relative_to(repo)).replace('\\', '/')}
        if not file.is_file():
            missing.append(asset)
            continue
        try:
            with Image.open(file) as image:
                image.load()
                if image.format != 'WEBP' or image.size != (480, 320):
                    raise ValueError(f'Expected 480x320 WebP, found {image.format} {image.size}')
            digest = hashlib.sha256(file.read_bytes()).hexdigest()
            hashes.setdefault(digest, []).append(asset['path'])
            asset['bytes'] = file.stat().st_size
            present.append(asset)
        except Exception as error:
            invalid.append({**asset, 'error': str(error)})
duplicates = [paths for paths in hashes.values() if len(paths) > 1]
common = repo / 'frontend/public/assets/investments/handdrawn-v1/common/grn.webp'
if common.is_file():
    with Image.open(common) as image:
        image.verify()
report = {'required': len(industries) * 4, 'industries': len(industries), 'present': len(present), 'missing': missing, 'invalid': invalid, 'duplicates': duplicates, 'totalBytes': sum(item['bytes'] for item in present), 'sharedCleanTechnology': common.is_file()}
output = repo / '.tmp'
output.mkdir(exist_ok=True)
(output / 'investment-art-audit.json').write_text(json.dumps(report, ensure_ascii=False, indent=2), encoding='utf-8')
if args.sheets:
    font_path = Path('C:/Windows/Fonts/arial.ttf')
    font = ImageFont.truetype(str(font_path), 13) if font_path.exists() else ImageFont.load_default()
    for offset in range(0, len(industries), 8):
        group = industries[offset:offset + 8]
        sheet = Image.new('RGB', (1040, len(group) * 215), '#fff0ce')
        draw = ImageDraw.Draw(sheet)
        for row, industry in enumerate(group):
            for col, (line, label_key) in enumerate(keys.items()):
                x, y = col * 260, row * 215
                file = repo / f'frontend/public/assets/investments/handdrawn-v1/{industry["slug"]}/{line}.webp'
                if file.is_file():
                    with Image.open(file) as image:
                        sheet.paste(image.convert('RGB').resize((252, 168)), (x + 4, y + 20))
                draw.text((x + 5, y + 2), f'{industry["slug"]}/{line}', fill='#35131c', font=font)
                label = industry['investLabels'][label_key]
                while draw.textlength(label, font=font) > 246:
                    label = label[:-2]
                draw.text((x + 5, y + 192), label, fill='#35131c', font=font)
        sheet.save(output / f'investment-art-review-{offset // 8 + 1:02}.jpg', quality=90)
print(json.dumps({key: value if key not in ['missing', 'invalid', 'duplicates'] else len(value) for key, value in report.items()}, ensure_ascii=False))
if invalid or duplicates or ((missing or not common.is_file()) and not args.allow_incomplete):
    raise SystemExit(1)
