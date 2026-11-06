"""Review-only camera/contact canvas. No runtime art or gameplay is replaced."""
from pathlib import Path
from PIL import Image
import base64, html, json, shutil

ROOT = Path(__file__).resolve().parents[1]
ASSET = ROOT / 'frontend/public/assets/duck-race'
OUT = ROOT / 'design-preview/duck-race-camera-standard'
OUT.mkdir(parents=True, exist_ok=True)
FACES = json.loads((ROOT / 'frontend/src/shared/ui/public-letter-paths.json').read_text())
MANIFEST = json.loads((ASSET / 'manifest-v12.json').read_text())
SOURCE = Path('C:/Users/PHONG/.codex/generated_images/01a169ec-1f26-72e3-bfbb-5f24c3989bbc/exec-a0c232cf-b8d1-4b7b-9be8-62cc5520fed0.png')
ART = OUT / 'crawl-coherent-whole.png'
shutil.copy2(SOURCE, ART)

def data(path):
    path = Path(path)
    mime = 'image/svg+xml' if path.suffix == '.svg' else 'image/webp' if path.suffix == '.webp' else 'image/png'
    return 'data:' + mime + ';base64,' + base64.b64encode(path.read_bytes()).decode()

source = (ROOT / 'scripts/design-duck-canvas-v13.py').read_text(encoding='utf-8-sig')
exec(source[source.index('class Canvas:'):source.index('\ndef header')])

def cached(c, path, x, y, w, h):
    iw, ih = Image.open(path).size
    ident = c.asset(path)
    c.body.append(f'<use href="#{ident}" transform="translate({x} {y}) scale({w/iw} {h/ih})"/>')

def scene(c, ident, x, y, w, h, source_y=0):
    c.defs.append(f'<clipPath id="{ident}"><rect x="{x}" y="{y}" width="{w}" height="{h}"/></clipPath>')
    c.body.append(f'<g clip-path="url(#{ident})">')
    cached(c, ASSET/'side-v10/countryside.webp', x, y-source_y, w, w*900/1600)
    c.body.append('</g>')

def gate(c, ident, x, far, depth):
    """One whole painting, one UNIFORM scale. No slicing, skewing or local stretch.

    Both support centres use the same approximately 0.25 oblique ground axis.
    Registration is review-only and is not an authoritative collision implementation.
    """
    image_id = c.asset(ART)
    scale = depth / (1023-355)
    c.body.append(f'<use data-model="whole-uniform" href="#{image_id}" transform="translate({x-507*scale} {far-355*scale}) scale({scale})"/>')

INK='#193d30'
c=Canvas(1440,1240)
c.body.append('<rect width="1440" height="1240" fill="#12382d"/>')
c.text('GÓC MÁY CHUNG · ĐƯỜNG NGANG, CHIỀU SÂU XIÊN NHẸ',24,18,29,bold=True,maxwidth=1392)
c.text('Canvas sửa · Một model liền khối, hai đầu cùng kết cấu · Dùng nguyên sprite vịt gốc',24,66,19,'#e2d098',maxwidth=1392)

# Background and feet are registered to the very same horizontal road edges.
scene(c,'overview',20,110,1400,570,158)
far=110-158+410*.875
near=110-158+600*.875
c.frame('forest',43,130,484,62,13)
c.text('Vịt chạy từ trái sang phải',65,146,22,bold=True,maxwidth=440)
c.body.append('<path d="M940 172H1260m-16-9 16 9-16 9" stroke="#ffecab" stroke-width="4" fill="none"/>')
c.duck(500,far+98,2.5,marker=True)
gate(c,'overview-gate',680,far,near-far)
c.duck(950,far+111,2.5,color='aqua')
c.frame('forest',43,544,1354,106,15)
c.text('Hai đầu cùng tiết diện gỗ, cùng cặp bu-lông và chân đỡ',66,561,23,bold=True,maxwidth=1290)
c.text('Ghép nguyên model lên đường. Không co từng đoạn, không bóp méo đầu gần hoặc đầu xa.',66,604,19,'#e6d39a',maxwidth=1290)

c.text('BA THỜI ĐIỂM CỦA CÙNG MỘT VỊT',24,702,25,bold=True,maxwidth=1392)
states=[('1 · Tiếp cận','idle',-102,'Đứng, lăn và nhảy đều bị chặn.'),
        ('2 · Giữ Shift + D','crawl',24,'Bò thấp qua khoảng hở dưới thanh.'),
        ('3 · Ra khỏi thanh','idle',112,'Thả Shift để trở lại tư thế đứng.')]
for i,(label,pose,dx,caption) in enumerate(states):
    x=20+i*474
    c.frame('paper',x,754,452,414,16)
    c.text(label,x+22,774,23,INK,True,maxwidth=408)
    # Slice the painted road only for a detailed state view. The road remains horizontal.
    ident=f'panel-{i}'
    c.defs.append(f'<clipPath id="{ident}"><rect x="{x+12}" y="812" width="428" height="267"/></clipPath>')
    c.body.append(f'<g clip-path="url(#{ident})">')
    c.body.append(f'<svg x="{x+12}" y="812" width="428" height="267" viewBox="400 340 520 324" preserveAspectRatio="none"><image href="{data(ASSET/"side-v10/countryside.webp")}" width="1600" height="900"/></svg>')
    gfar=870;gdepth=156;gx=x+210;ground=gfar+102
    actor_x=gx+.25*(ground-gfar)+dx
    if i==1:
        c.duck(actor_x,ground,2.5,pose=pose,f=2)
        gate(c,f'state-{i}',gx,gfar,gdepth)
    else:
        gate(c,f'state-{i}',gx,gfar,gdepth)
        c.duck(actor_x,ground,2.5,pose=pose)
    c.body.append('</g>')
    c.text(caption,x+22,1098,17,INK,True,maxwidth=408)
    c.text('Cùng kích cỡ · bóng ở mặt đất',x+22,1132,15,'#74633c',maxwidth=408)
c.text('Bản thiết kế góc máy và điểm tựa; chưa thay góc máy hoặc asset trong gameplay.',24,1202,18,'#e5d39a',maxwidth=1392)
c.render(OUT/'camera-contact-canvas.svg')

(OUT/'index.html').write_text('''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quiz Duck Race · Canvas sửa kết cấu</title><style>html{background:#102d25;color:#fff0ce;font:16px/1.5 system-ui}body{margin:0}main{max-width:1440px;margin:auto;padding:16px}img{display:block;width:100%;height:auto}h1{font-size:22px;margin:4px 0 12px}p{margin:12px 0}a{color:#ffdc77}.asset{background:#eee1bb;max-height:650px;object-fit:contain;margin:18px auto}summary{cursor:pointer;padding:14px;border:1px solid #8e793e}details{margin-top:20px}small{color:#d7c691}</style><main><h1>Canvas sửa · Thanh chắn liền khối, hai đầu cùng kết cấu</h1><p>Bản trước bị loại: hai đầu khác kết cấu và phần nối bị co riêng. Bản này ghép nguyên model, chỉ phóng/thu đồng đều.</p><img src="camera-contact-canvas.svg" alt="Canvas sửa kết cấu hai đầu thanh chắn; dùng vịt gốc và model nguyên khối; ba thời điểm tiếp cận, bò, đi qua."><p><small>Bản duyệt hình ảnh, chưa áp vào gameplay.</small></p><details><summary>Xem riêng model nguyên khối</summary><img class="asset" src="crawl-coherent-whole.png" alt="Thanh chắn nguyên khối với hai dầm đầu cùng cặp bu-lông và chân đỡ; chân xa lộ một phần."></details></main></html>''',encoding='utf-8')
(OUT/'provenance.json').write_text(json.dumps({'status':'revised review-only; not approved or activated','tool':'built-in imagegen','selected_source':str(SOURCE),'review_asset':ART.name,'superseded_rejected_asset':'crawl-oblique-partial-foot.png','native_duck_source':'manifest-v12.json / duckee; unchanged','registration':{'screen_x':'world_x + approximately 0.25 * ground_y','screen_y':'ground_y - jump_z','source_end_registration':[[507,355],[674,1023]],'model_composition':'single whole painting, uniform scale only; no slices, shear or local stretch'},'far_post':'naturally partly occluded; same support construction as near end'},ensure_ascii=False,indent=2),encoding='utf-8')
print('Review canvas and source saved; no runtime files changed.')
