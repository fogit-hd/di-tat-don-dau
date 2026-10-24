"""Export generated alpha artwork as responsive nine-slice SVG/PNG assets (no vector tracing)."""
from pathlib import Path
from PIL import Image
import base64
import io
import json

ROOT = Path(__file__).resolve().parents[1]
SOURCES = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc')
OUTPUT = ROOT / 'frontend/public/assets/ui/painted-frames-v1'
ITEMS = [
    ('panel', 'exec-61c4b104-db0e-469f-9295-d0dee795c7db.png', 112),
    ('inset', 'exec-984e8847-cf62-4282-8757-0d29ecd4512b.png', 80),
    ('control', 'exec-f5184e7d-38b8-4ad1-9c13-86f82569958b.png', 96),
]

def main():
    OUTPUT.mkdir(parents=True, exist_ok=True)
    manifest = []
    for name, filename, slice_size in ITEMS:
        source = SOURCES / filename
        image = Image.open(source).convert('RGBA')
        # Only crop/resize for export. The visible frame is entirely model-generated.
        bounds = image.getchannel('A').point(lambda a: 255 if a >= 192 else 0).getbbox()
        if not bounds:
            raise ValueError(f'Empty frame: {source}')
        bounds = (max(0, bounds[0]-4), max(0, bounds[1]-4), min(image.width, bounds[2]+4), min(image.height, bounds[3]+4))
        image = image.crop(bounds)
        image.thumbnail((768, 768), Image.Resampling.LANCZOS)
        canvas = Image.new('RGBA', (768, 768))
        canvas.alpha_composite(image, ((768-image.width)//2, (768-image.height)//2))
        if canvas.getpixel((384, 384))[3] != 0:
            raise ValueError(f'Frame center must be transparent: {name}')
        buffer = io.BytesIO()
        canvas.save(buffer, format='PNG', optimize=True)
        png = buffer.getvalue()
        (OUTPUT / f'{name}.png').write_bytes(png)
        encoded = base64.b64encode(png).decode('ascii')
        svg = f'<svg xmlns="http://www.w3.org/2000/svg" width="768" height="768" viewBox="0 0 768 768"><desc>AI-generated painted {name} frame. Embedded raster artwork, not vector paths. Nine-slice: {slice_size}.</desc><image width="768" height="768" href="data:image/png;base64,{encoded}"/></svg>\n'
        (OUTPUT / f'{name}.svg').write_text(svg, encoding='utf-8')
        manifest.append(dict(name=name, source=str(source), sourceBounds=bounds, width=768, height=768, slice=slice_size, svgBytes=len(svg.encode()), pngBytes=len(png), transparentCenter=True, renderer='SVG with embedded generated PNG'))
    public_manifest = [{key: value for key, value in row.items() if key not in ('source', 'sourceBounds')} for row in manifest]
    (OUTPUT / 'manifest.json').write_text(json.dumps(public_manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    (ROOT / 'design-preview/painted-frames-manifest.json').write_text(json.dumps(manifest, ensure_ascii=False, indent=2), encoding='utf-8')
    print(json.dumps(manifest, ensure_ascii=False, indent=2))

if __name__ == '__main__':
    main()
