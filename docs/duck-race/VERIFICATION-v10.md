# Kiểm tra bản đường chạy ngang — 03/11/2026

- Backend: 223 bài qua, 1 bài tích hợp PostgreSQL được bỏ qua do chưa cấu hình DB kiểm thử. Riêng Duck Race: 33 bài qua.
- `npm run build --workspace backend`: qua.
- `npm run build --workspace frontend`: qua; còn cảnh báo bundle >500 kB của Vite.
- `npm run lint --workspace frontend`: không có lỗi; 12 cảnh báo đã có ở các màn của game doanh nghiệp.
- `node scripts/check-game-boundaries.cjs`: 468 import nội bộ, không có import chéo hai game hoặc renderer singleton trong shared.
- `node scripts/sync-duck-contracts.cjs --check`: các bản geometry/contracts/motor cho hai Docker context khớp nguồn.
- API + Socket.io localhost: 50 kết nối đồng thời; điểm 197 → 47 sau một gói bứt tốc; tự tiến khi không có input; né dọc liên tục; hết hạn input chỉ dừng né; không phát token/deck trong snapshot.
- Browser: tạo phòng, join, bắt đầu, trả lời đúng, mua bứt tốc, giữ nút né, kiểm tra camera giữ nguyên Y. Không có lỗi JavaScript trong console.
- Responsive được đo trong iframe có viewport thật 390×844, 768×1024, 1440×900 qua trình duyệt Chromium của Codex. Cả ba đều không tràn trang và không thiếu chữ SVG. Mobile mở bảng câu hỏi đè lên game, không đổi kích thước đường chạy.
- Chưa kiểm tra trên thiết bị iPhone/iPad/Android thật hoặc Safari/Firefox. Chưa kiểm thử Redis failover trong đợt sửa này.

Minh chứng: `design-preview/duck-race-v10/responsive.json`, `api-verification.json`, `viewport-*.png`, `mobile-question.png`. Các ảnh là screenshot của app đang chạy, không phải canvas thiết kế.

Các vòng lặp nước, quạt cánh, bắn nước, bùn bám và thời tiết dùng frame artwork trong `terrain-v9/effects.json` và `ducks-v9.json`, được phát bởi PixiJS. Không dùng CSS để vẽ hay giả chuyển động các hiệu ứng này.
