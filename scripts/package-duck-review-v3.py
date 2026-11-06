"""Package native/generated review resources, without redrawing the art."""
from pathlib import Path
from PIL import Image
import json,re,shutil
root=Path(__file__).resolve().parents[1]
source=Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-9253cd4b-3b63-4494-9117-a1a649dabe19.png')
out=root/'frontend/public/assets/duck-race/eras-v3';out.mkdir(parents=True,exist_ok=True)
Image.open(source).save(out/'hourglass.webp',lossless=True,method=6)
preview=root/'design-preview/duck-race-eras-v3/assets';preview.mkdir(parents=True,exist_ok=True)
shutil.copy2(out/'hourglass.webp',preview/'hourglass.webp')
bank=(root/'backend/src/shared/questions/bank.ts').read_text(encoding='utf-8')
questions=[]
for identifier in ['q01','q02','q03','q04']:
    match=re.search(r"q\('"+identifier+r"',.*?, 'mc', '(.*?)', \[(.*?)\], '([a-d])', '(.*?)'\)",bank,re.S)
    options=re.findall(r"\['([a-d])', '(.*?)'\]",match[2],re.S)
    questions.append({'id':identifier,'title':match[1],'options':[{'id':key,'text':text} for key,text in options],'correct':match[3],'explanation':match[4]})
(preview/'questions.json').write_text(json.dumps(questions,ensure_ascii=False,indent=2),encoding='utf-8')
(preview/'source.json').write_text(json.dumps({'hourglass':str(source),'frames':[3,2],'questions':'snapshot of q01–q04 from backend/src/shared/questions/bank.ts','unchangedDuck':'Original duckee assets, reused from V2'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Packaged six sand-flow frames and four existing question fixtures')
