"""Split the generated transparent VFX sheet into six source cells; no repainting."""
from pathlib import Path
from PIL import Image
import shutil, json
root=Path(__file__).resolve().parents[1]
out=root/'frontend/public/assets/duck-race/wind-v1'
out.mkdir(parents=True,exist_ok=True)
source=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-8117072f-9250-4fdc-a9e2-58e668639dc0.png')
image=Image.open(source).convert('RGBA')
assert image.getextrema()[3][0]==0, 'True source transparency required'
shutil.copy2(source,out/'source-sheet.png')
for i,name in enumerate(['leaf-green','leaf-amber','dust','ribbon','grass','slash']):
    x=i%3;y=i//3;w,h=image.size
    cell=image.crop((round(x*w/3),round(y*h/2),round((x+1)*w/3),round((y+1)*h/2)))
    cell.save(out/(name+'.webp'),lossless=True)
(out/'provenance.json').write_text(json.dumps({'tool':'built-in imagegen','source':str(source),'processing':'six equal cell crops, lossless WebP, source alpha preserved','animation':'Phaser world-space pooled sprite particles, curved trajectories/rotation/alpha; rooted grass sway; skill bursts','names':['leaf-green','leaf-amber','dust','ribbon','grass','slash']},indent=2),encoding='utf-8')
print('Six transparent WindManager textures packaged.')
