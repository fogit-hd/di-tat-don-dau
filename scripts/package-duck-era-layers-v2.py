"""Package era review layers without altering or activating either game.

Input is a JSON source manifest kept with the review. Only crops/encoding are
performed here; original generated pixels and alpha are preserved.
"""
from pathlib import Path
import argparse
import json
from PIL import Image

ROOT = Path(__file__).resolve().parents[1]
SOURCE = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')

def package(manifest_path):
    manifest = json.loads(Path(manifest_path).read_text(encoding='utf-8-sig'))
    out = ROOT / 'frontend/public/assets/duck-race/eras-v2'
    out.mkdir(parents=True, exist_ok=True)
    for entry in manifest['eras']:
        folder = out / str(entry['id'])
        folder.mkdir(exist_ok=True)
        Image.open(SOURCE / entry['terrain']).convert('RGB').save(folder / 'terrain.webp', quality=91, method=6)
        atlas = Image.open(SOURCE / entry['architecture']).convert('RGBA')
        # Locate the transparent horizontal gutter, rather than cutting a roof
        # or foundation when generated grid proportions differ slightly.
        alpha = atlas.getchannel('A')
        lo, hi = int(atlas.height * .46), int(atlas.height * .55)
        row_coverage = lambda y: sum(v > 160 for v in alpha.crop((0, y, atlas.width, y+1)).get_flattened_data())
        split = min(range(lo, hi), key=row_coverage)
        for index in range(4):
            col, row = index % 2, index // 2
            row_top, row_bottom = (0, split) if row == 0 else (split, atlas.height)
            row_alpha = alpha.crop((0,row_top,atlas.width,row_bottom))
            column_coverage = lambda x: sum(v > 160 for v in row_alpha.crop((x,0,x+1,row_alpha.height)).get_flattened_data())
            # Each atlas row can have a different gutter. Fixed half-width UVs
            # would cut the wide factory or the rear supports of a building.
            column_split = min(range(int(atlas.width*.40),int(atlas.width*.66)),key=lambda x:(column_coverage(x),abs(x-atlas.width/2)))
            if column_coverage(column_split) > row_alpha.height*.035:
                raise ValueError(f'No safe transparent vertical gutter: era {entry["id"]}, row {row}')
            left, right = (0,column_split) if col == 0 else (column_split,atlas.width)
            cell = atlas.crop((left,row_top,right,row_bottom))
            box = cell.getchannel('A').point(lambda v: 255 if v > 28 else 0).getbbox()
            if box is None:
                raise ValueError(f'Empty architecture cell: era {entry["id"]}, cell {index}')
            x1, y1, x2, y2 = box
            cell = cell.crop((max(0,x1-4), max(0,y1-4), min(cell.width,x2+4), min(cell.height,y2+4)))
            cell.save(folder / f'building-{index}.webp', lossless=True, method=6)
    (out / 'manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print('Packaged era layers:', out)

if __name__ == '__main__':
    parser = argparse.ArgumentParser()
    parser.add_argument('manifest')
    package(parser.parse_args().manifest)
