# Đã triển khai bộ canvas được duyệt — 27/10/2026

Nguồn thiết kế: `design-preview/session-review-v2/`, gồm bảng hạng bản có Trạng thái, title tạo phòng căn giữa, màn vào phòng và storyboard hướng dẫn 07–11. Các số trên canvas không được dùng làm hằng số game.

## Thay đổi

- `LiveRanking.tsx`: bảng realtime thường từ hạng 1, rộng toàn phần; bỏ chữ Đang cập nhật, cột Biến động, panel Đang xem CEO. Hàng có ID ổn định di chuyển bằng FLIP/WAAPI khi đổi hạng; hàng tăng/giảm có nhấn màu ngắn và thông báo cho trình đọc màn hình. Số tiền chuyển tới đúng giá trị snapshot. Chế độ giảm chuyển động bỏ trượt.
- Máy chủ gửi `playerStatus` riêng, phân biệt điều hành, chuyển giao, qua đời, nghỉ hưu, tái cơ cấu, phá sản, trăm năm, chốt kết quả. `finishReason` được giữ trong state JSON; không nhầm mortality và heir steady. Không đổi công thức/rủi ro kinh tế.
- `HostSessions`/`SessionRanking`: chỉ host hết trận có bục, công bố 3 → 2 → 1 rồi các hạng từ 4. Nhớ trạng thái lễ công bố theo phòng để chuyển tab/reconnect không phát lại. Phòng 0/1/2 CEO không tạo người thắng giả.
- `PlayerResults`: chỉ kết quả cá nhân, avatar nguyên khối, huy hiệu hạng, năm/câu đúng/kết thúc. Không có top 3 hoặc bảng CEO khác. Kết quả sớm vẫn ghi hạng tạm thời.
- `ResultEvents` và style receipt riêng: sự kiện mở chi tiết ngay trong hàng; ledger giữ số dư đầu/cuối và nguồn thu chi thật, icon/chevron được giới hạn. Không còn phụ thuộc class gameplay để giữ kích thước SVG.
- `session-v2.css`, tám asset field SVG: trường nhập/chọn giấy/vải đỏ, normal/focus/error/disabled, góc nine-slice cố định. Dùng ở các màn session và Wiki. Native input hỗ trợ tiếng Việt/IME; tên chủ phòng NFC sau blur, không sửa text giữa phiên gõ. Tạo phòng có title căn giữa, hai cột gọn và nâng cao vẫn vừa laptop 1366×768.
- `RoomLoading`: hình cửa mở mới từ ImageGen, mã phòng thực và dấu chờ không xác định; lỗi có thử lại/trang chủ. Không giả phần trăm tải hoặc cố giữ loading khi snapshot đã tới. Socket connect_error có trạng thái lỗi thật.
- Tutorial version 2: bỏ starter-action bar; thực hành bằng nút mua thật trên năm nhóm thẻ. Cả frontend lẫn backend giữ đúng bước/loại giao dịch; không mua thay, không mua hai lần vì retry. Có trường hợp tài nguyên được tặng/thiếu vốn. Sáu chỉ số và các nhóm phụ được giải thích theo dữ liệu của CEO. Sprite cố vấn vẫn nguyên khối chạy Canvas, không chuyển sang rig/CSS. Chữ 18ms, miệng khép khi chờ, đồng hồ trận không dừng, timer năm hai chỉ khởi động sau hoàn tất.

## Kiểm chứng thực tế

- Frontend build và lint: thành công; còn các cảnh báo React/chunk-size sẵn có. Backend build: thành công. Backend: **143 tests pass, 1 database integration skipped**. Có test v2 toàn luồng, mua thật/khóa bước/retry, thiếu vốn, tương thích v1 và phân loại trạng thái có cùng heir multiplier.
- `scripts/avatar-sessions.qa.cjs`: 390/768/1366/1440px, production bundle, API/socket mô phỏng cục bộ. Loading/lỗi/thử lại; avatar lưu/tải lại; bảng realtime có hiệu ứng lên/xuống; công bố đúng thứ tự; không phát lại; 0/1/2 CEO; cá nhân không có top; icon không phóng lớn; field SVG trong Wiki; tên dài; không lỗi JS, thiếu media hoặc tràn ngang. Báo cáo: `design-preview/session-flow-v1/verification-approved-final/report.json`.
- Cùng kịch bản ở 768px với reduced motion và trạng thái trăm năm: `verification-approved-reduced/report.json`, đạt.
- `scripts/session-flow.qa.cjs`: 390/768/1366/1440px. Giữ payload/auth/token/QR/link/handler tạo phòng và bắt đầu; Google gate; Escape/focus; form nâng cao vừa chiều cao 768px; câu hỏi/phân trang/mẫu số. Báo cáo: `verification-approved-final-form/report.json`.
- `scripts/approved-guide.qa.cjs`: 360/390/768/844/1440px (844 ngang cao 390px). Cụm/tổ người và giá khác nhau; năm khoản mua thật; sáu chỉ số; click tab bắt buộc; retry/reload; animation nguyên khối; đồng hồ trận giữ nguyên deadline; Sang năm và timer năm hai; không tràn ngang/thiếu media/lỗi JS; bong bóng không che mục đang yêu cầu thao tác. Báo cáo: `design-preview/mascot-guide-v3/verification-approved-final-guide/report.json`.
- Đã xem ảnh browser và so với các canvas đã duyệt cho form, bảng hạng, loading, tổng kết và hướng dẫn. Số liệu test là dữ liệu mô phỏng; công thức giao dịch/sản xuất trong guide QA lấy từ engine thật.

Browser tích hợp timeout localhost; Playwright trực tiếp localhost bị chặn network bởi môi trường. Vì vậy browser QA nạp production bundle và mock transport trong Chromium, không truy cập Internet. Chưa xác minh Google OAuth thật, DB thật/Render hoặc thiết bị iOS vật lý. Không deploy trong task này.

## Xem thử

`node --import tsx scripts/session-preview-server.cjs` phục vụ cổng 4521: `/preview/live`, `/preview/final`, `/preview/player`, `/preview/loading`, `/preview/lobby`, `/preview/guide`. Có banner rõ dữ liệu mô phỏng. Hướng dẫn demo dùng engine thực trong `scripts/guide-preview.cjs`, chỉ dành cho luồng năm đầu, không phải backend production. Script/fixture không nằm trong frontend bundle và không ghi database.
