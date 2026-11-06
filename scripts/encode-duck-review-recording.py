"""Encode one browser-capture pass, preserving real capture intervals."""
from pathlib import Path
import json,subprocess
root=Path(__file__).resolve().parents[1]/'design-preview/duck-race-eras-v3'
frames=root/'recording-frames'
metadata=json.loads((frames/'timing.json').read_text(encoding='utf-8'))
items=metadata['frames'];lines=[]
for i,item in enumerate(items):
    lines.append("file '"+item['file']+"'")
    duration=(items[i+1]['at']-item['at'])/1000 if i+1<len(items) else .6
    lines.append(f'duration {duration:.6f}')
lines.append("file '"+items[-1]['file']+"'")
manifest=frames/'frames.concat';manifest.write_text('\n'.join(lines),encoding='utf-8')
subprocess.run(['ffmpeg','-hide_banner','-loglevel','error','-n','-f','concat','-safe','0','-i',str(manifest),'-vf','fps=30,format=yuv420p','-c:v','libx264','-preset','medium','-crf','20','-movflags','+faststart',str(root/'chest-open-one-pass.mp4')],check=True)
print(json.dumps({'frames':len(items),'captureSeconds':(items[-1]['at']-items[0]['at'])/1000,'file':str(root/'chest-open-one-pass.mp4'),'note':'No interpolated animation frames; timing preserved from browser capture.'}))
