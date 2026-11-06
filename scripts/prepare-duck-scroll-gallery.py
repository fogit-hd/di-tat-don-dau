"""Generate a local art-review index for the 24 packaged panorama images."""
from pathlib import Path
import json,html
root=Path(__file__).resolve().parents[1]/'design-preview/duck-race-eras-v3'
spec=json.loads((root/'assets/scroll-v4/manifest.json').read_text(encoding='utf-8'))
sections=[]
for i,era in enumerate(spec['eras']):
    images=''.join(f'<figure><img src="assets/scroll-v4/{path}" width="834" height="469" loading="lazy" alt="Thời đại {i+1}.0, cảnh {j+1}"><figcaption>Cảnh {j+1}</figcaption></figure>' for j,path in enumerate(era['files']))
    sections.append(f'<section><div class="row"><h2>{i+1}.0 · {html.escape(era["name"])}</h2><a href="index.html?era={i}">Chạy thử thời đại này</a></div>{"<p>Kịch bản giả định cho phần hình ảnh, không phải phân kỳ lịch sử đã thống nhất.</p>" if era.get("speculative") else ""}<div class="scenes">{images}</div></section>')
page='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>24 cảnh nền · Quiz Duck Race</title><style>
@font-face{font-family:ReviewUI;src:url('../duck-race-eras-v2/assets/ui.ttf')}*{box-sizing:border-box}body{margin:0;background:#112d21;color:#f8ebc8;font-family:ReviewUI,system-ui,sans-serif;padding:24px}main{max-width:1360px;margin:auto}a{color:#f5cd75;text-underline-offset:4px}a:focus-visible{outline:3px solid #ffe49c;outline-offset:5px}h1{font-size:28px;margin:20px 0 12px}h2{font-size:20px;margin:0}p{font-size:14px;line-height:1.7;color:#e1d1a7;max-width:82ch}section{padding:30px 0;border-top:1px solid #5d754b}.row{display:flex;justify-content:space-between;align-items:center;gap:20px;margin-bottom:18px}.row a{font-size:13px;white-space:nowrap}.scenes{display:grid;grid-template-columns:repeat(4,minmax(0,1fr));gap:16px}figure{margin:0;min-width:0}img{width:100%;height:auto;display:block}figcaption{font-size:13px;margin:9px 0;color:#f7d582}@media(max-width:900px){.scenes{grid-template-columns:1fr 1fr}.row{flex-wrap:wrap}}@media(max-width:500px){body{padding:18px}.scenes{grid-template-columns:1fr}h1{font-size:23px}h2{font-size:18px}}
</style><main><a href="index.html">Về bản xem chuyển động V3</a><h1>24 cảnh nền nối tiếp theo đường chạy</h1><p>Mỗi thời đại có bốn bức riêng. Cuộn theo quãng đường: 1 → 2 → 3 → 4 → 1. Đổi thời đại giữ nguyên đoạn đang chạy. Không dùng lại lớp kiến trúc lớn dựng sát đường; khói/bụi là sprite hoạt ảnh riêng.</p>SECTIONS</main></html>'''
(root/'backgrounds.html').write_text(page.replace('SECTIONS',''.join(sections)),encoding='utf-8')
print('Built art-review index: 6 eras × 4 separate panoramas')
