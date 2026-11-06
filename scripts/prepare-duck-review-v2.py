"""Assemble the isolated approval canvas; never imported by either game."""
from pathlib import Path
import re

root=Path(__file__).resolve().parents[1]
old=(root/'design-preview/duck-race-eras-v1/index.html').read_text(encoding='utf-8')
css=re.search(r'<style>(.*?)</style>',old,re.S).group(1)
extra='''
.review{height:48px;min-height:48px;max-height:48px}.game{height:calc(100svh - 48px)}
.review strong{font-size:9px}.review button{min-height:34px}.review .tools{margin-left:auto}
.timeline{grid-template-columns:repeat(6,1fr)}.hud .identity{max-width:240px}
.review-note{top:110px;max-width:260px}.caption{bottom:151px}
.chest img{width:100%;height:150px;transition:none}.chest:hover img{transform:none}
.chest{min-height:280px;padding:12px 8px}.chest b{font-size:15px;color:#66471f}
.chest strong{font-size:17px}.chest small{font-size:12px}.chest:focus-visible{outline-offset:2px}
.chests-dialog{width:min(930px,100%)}.chest-list{gap:12px}.chests-dialog .hint{margin:6px 0}
.dialog{background-color:#faedca;background-clip:padding-box}.reward-dialog{width:560px}.reward-dialog h1{font-size:23px;margin:8px 0}
#chestAnimation{width:100%;height:245px;display:block}.reward-copy{margin:12px auto;font-size:14px}
.event-result{border-top:1px solid #b69d6c;padding-top:12px;line-height:1.6;font-size:14px}
.event-result .gain{color:#286439}.event-result .loss{color:#ad352d}.event-result p{margin:6px 0}
.event-result b{display:block}.opening-status{font-size:12px;color:#735b34;min-height:20px}
.target-grid{display:grid;grid-template-columns:1fr 1fr;gap:7px;margin-top:12px}
.target-grid button{font:inherit;font-size:12px;color:#30432c;background:#ffefc7;border:1px solid #b59755;border-radius:5px;min-height:44px;padding:8px;white-space:nowrap;overflow:hidden;text-overflow:ellipsis}
.catalogue-dialog{width:760px}.catalogue-dialog h1{margin-top:24px}.event-item{padding:12px 0;border-bottom:1px solid #c7b280;font-size:13px;line-height:1.6}.event-item strong{font-size:15px}.event-item small{display:block;color:#705b3d}.event-list h2{font-size:18px;margin:22px 0 4px}.review-actions{display:flex;gap:6px;flex-wrap:wrap;justify-content:center;margin:12px 0}.review-actions button{font-size:12px;min-height:44px;color:#3e472c;background:#f5e4b9;border:1px solid #b69b60;padding:7px 10px;border-radius:5px}
.phase-badge{position:absolute;left:50%;top:113px;transform:translateX(-50%);max-width:90%;padding:8px 15px;background:#153e2bec;color:#f9e8b4;font-size:12px;border:1px solid #ad9258;border-radius:4px;pointer-events:none;text-align:center}
.host .phase-badge{top:90px}.host-list{top:115px}.native-note{max-width:340px}.help{right:10px}
@media(max-width:800px){.review{gap:3px;padding:4px 6px}.review strong{font-size:7px}.review button{padding:5px 6px;font-size:10px;min-width:29px}.review .tools{margin-left:0}.review .tools-label{display:none}.review-note{display:none}.phase-badge{top:137px;font-size:10px}.chest-list{grid-template-columns:1fr}.chest{min-height:0;grid-template-columns:95px 1fr;padding:8px 10px}.chest img{width:95px;height:88px;grid-row:1/4}.chest strong{font-size:14px}.chest b{font-size:12px;margin:3px 0}.chest small{font-size:10px}.chest-list{margin:14px 0}.chests-dialog h1{font-size:20px}.reward-dialog{width:100%}#chestAnimation{height:195px}.reward-dialog h1{font-size:21px}.reward-copy,.event-result{font-size:12px}.reward-copy{margin:8px auto}.native-note{max-width:245px;font-size:8px}.host-list{top:175px}.help{bottom:22px;font-size:8px}.bar .clock{font-size:22px}.phase-badge{width:max-content}.dialog{padding:10px;}.chests-dialog .hint{font-size:10px}.review-actions{margin:8px 0}}
@media(max-width:480px){.review strong{max-width:50px;white-space:normal;line-height:1.2}.review button{padding:5px;min-width:26px}.review .skip{display:none}.review .tools{min-width:30px}.review .tools .tools-label{display:none}.chest img{height:86px}.chest{grid-template-columns:92px 1fr}.chest strong{font-size:13px}.chests-dialog{padding:9px 7px}.caption{font-size:11px}.review-actions button{font-size:11px}.reward-dialog h1{font-size:19px}.event-result b{font-size:13px}.native-note{max-width:200px}.help{bottom:6px}}
'''
html='''<!doctype html><html lang="vi"><meta charset="utf-8"><meta name="viewport" content="width=device-width,initial-scale=1"><title>Quiz Duck Race · Canvas V2 · 6 thời đại / 3 rương</title><style>CSS</style>
<div class="review"><strong>CANVAS V2<br>Chưa áp vào game</strong>ERA_BUTTONS<button id="hostMode" aria-pressed="false">Host</button><button class="tools" id="reviewTools">⋯<span class="tools-label"> Bản duyệt</span></button></div>
<main class="game" id="game">
<header class="bar"><img class="logo" src="assets/logo.webp" alt="Quiz Duck Race" draggable="false"><div class="era-title">Thời đại <span id="eraNumber">1.0</span><small id="eraName">Hơi nước & cơ khí</small></div><div class="clock"><span id="clock">12:00</span><small>7 nhóm · 12 phút</small></div></header>
<section class="stage" aria-label="Đường đua ngang không có chướng ngại vật">
<canvas id="world" class="world" aria-label="Bản xem chuyển kiến trúc và mặt đường qua sáu thời đại"></canvas>
<div class="hud"><div class="paint identity">Nhóm Minh Anh<small id="duckStatus">Đang chạy</small></div><div class="paint my-stats"><div class="stat">Điểm di chuyển<b id="points">120 <em>điểm</em></b></div><div class="stat">Quãng đường<b id="progress">23,2 <em>%</em></b></div><div class="stat">Thứ hạng<b>#3 <em>/ 7</em></b></div></div></div>
<div class="review-note">Bản mô phỏng để duyệt hình ảnh và chuyển động. Điểm / tác động là đề xuất, chưa kết nối phòng chơi.</div>
<div id="eraPhase" class="phase-badge hidden" role="status"></div>
<div class="caption" id="caption">Đang tải tài nguyên bản duyệt…</div>
<div class="foot-controls"><div class="fuel"><span id="fuelLabel">120 điểm</span><div class="fuel-meter"><i id="fuelBar"></i></div><span id="fuelMode">Tự chạy</span></div><button class="paint-button" id="questionButton" disabled>Trả lời câu hỏi</button></div>
<aside class="paint host-list"><ol id="ranking"></ol></aside>
<div class="native-note">Vịt gốc duckee · Tư thế đọc sách chưa phải clip hoàn thiện</div><a class="help" href="review.md" target="_blank">Thông tin bản duyệt</a>
<div class="shade" id="questionShade"><section class="dialog" role="dialog" aria-modal="true" aria-labelledby="questionTitle" tabindex="-1"><button class="close" id="closeQuestion">Đóng</button><div class="topline"><b id="questionNo">Câu 1</b><span id="questionTime">00:20</span></div><div class="timer-progress"><i id="questionProgress"></i></div><h1 id="questionTitle">Yếu tố nào giúp doanh nghiệp làm chủ công nghệ nhập khẩu?</h1><div class="answers"><button class="answer" data-answer="0"><b>A</b><span>Chỉ mua thêm nhiều máy móc.</span></button><button class="answer" data-answer="1"><b>B</b><span>Đào tạo nhân lực biết vận hành và cải tiến công nghệ.</span></button><button class="answer" data-answer="2"><b>C</b><span>Chỉ tăng ngân sách quảng cáo.</span></button><button class="answer" data-answer="3"><b>D</b><span>Giảm thời gian bảo trì thiết bị.</span></button></div><p class="hint">Vịt dừng lại để học trong lúc bạn trả lời.</p></section></div>
<div class="shade" id="chestShade"><section class="dialog chests-dialog" role="dialog" aria-modal="true" aria-labelledby="chestTitle" tabindex="-1"><h1 id="chestTitle">Chính xác! Chọn một rương</h1><p class="hint">Chọn đúng một rương. Chỉ phần thưởng của rương đã chọn được áp dụng.</p><div class="chest-list">
<button class="chest" data-chest="safe"><img src="assets/eras-v2/chests/safe/closed.webp" alt="Rương gỗ thường"><strong>Rương an toàn</strong><b>Chỉ có lợi cho bạn</b><small>Điểm di chuyển, tiết kiệm năng lượng hoặc bảo hộ.</small></button>
<button class="chest" data-chest="single"><img src="assets/eras-v2/chests/single/closed.webp" alt="Cùng form rương, bọc dây xích"><strong>Rương bán phẩm</strong><b>Tác động 1 người</b><small>Có lợi hoặc bất lợi, cho bạn hoặc một người khác.</small></button>
<button class="chest" data-chest="explosive"><img src="assets/eras-v2/chests/explosive/closed.webp" alt="Cùng form rương, gắn đầu lâu người"><strong>Rương bùng nổ</strong><b>1 người · vài người · tất cả</b><small>Có lợi hoặc bất lợi. Một số sự kiện cho phép chọn mục tiêu.</small></button>
</div><p class="hint">Ba rương cùng hình dáng, tỷ lệ và kích thước. Khác lớp trang trí bên ngoài.</p></section></div>
<div class="shade" id="rewardShade"><section class="dialog reward-dialog" role="dialog" aria-modal="true" aria-labelledby="rewardTitle" tabindex="-1"><canvas id="chestAnimation" aria-label="Hoạt ảnh rương đang mở"></canvas><div id="openingStatus" class="opening-status" role="status"></div><h1 id="rewardTitle">Rương đang mở…</h1><div class="reward-copy" id="rewardCopy"></div><div class="event-result" id="eventResult"></div><div id="targetGrid" class="target-grid hidden"></div><button class="paint-button compact hidden" id="resumeReward">Tiếp tục đua</button></section></div>
<div class="shade" id="cooldownShade"><section class="dialog cooldown-dialog" role="dialog" aria-modal="true" aria-labelledby="wrongTitle" tabindex="-1"><button class="close" id="closeWrong">Đóng</button><h1 id="wrongTitle">Chưa chính xác</h1><p>Nhân lực có kỹ năng giúp vận hành, tiếp thu và cải tiến công nghệ.</p><div class="countdown"><span id="cooldownTime">10</span>s</div><p>Chờ trước khi trả lời câu tiếp theo. Đóng khung để chạy tiếp nếu còn điểm.</p><button class="paint-button secondary compact" id="backWrong">Về đường đua</button></section></div>
<div class="shade" id="catalogueShade"><section class="dialog catalogue-dialog" role="dialog" aria-modal="true" aria-labelledby="catalogueTitle" tabindex="-1"><button class="close" id="closeCatalogue">Đóng</button><h1 id="catalogueTitle">Xem thử bản thiết kế</h1><p class="hint">Các nút thử bên dưới chỉ thuộc canvas duyệt. Không phải phần giao diện trong trận.</p><div class="review-actions"><button id="tryChests">Thử mở ba rương</button><button id="emptyFuel">Thử hết điểm</button><button id="nextEra">Chuyển thời đại kế</button></div><p class="hint">Mỗi thời đại dài 2 phút. Trong bản xem, bấm 1.0–6.0 để thử chuyển cảnh trong 6,2 giây. 5.0 và 6.0 là kịch bản giả định.</p><div class="event-list" id="eventCatalogue"></div></section></div>
</section><div class="timeline" aria-label="Sáu thời đại"><i class="active"></i><i></i><i></i><i></i><i></i><i></i></div>
</main><script src="era-stage.js"></script><script src="chest-opening.js"></script><script src="chest-events.js"></script><script src="review.js"></script></html>
'''
buttons=''.join(f'<button data-era="{i}" aria-pressed="{str(i==0).lower()}"><span class="era-long">{i+1}.0 · {i*2:02}–{i*2+2:02}′</span><span class="era-short">{i+1}.0</span></button>' for i in range(6))
html=html.replace('CSS',css+extra).replace('ERA_BUTTONS',buttons)
(root/'design-preview/duck-race-eras-v2/index.html').write_text(html,encoding='utf-8')
print('Built isolated V2 approval page')
