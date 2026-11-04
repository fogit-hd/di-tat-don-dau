# Kiểm tra tọa độ world và điều khiển thủ công

- Backend: **231 bài qua, 1 bài PostgreSQL được bỏ qua**; Duck Race có 41 bài. Đã kiểm 64 seed: mỗi hàng có 1–2 làn bị chặn, toàn bộ bề rộng làn chừa trống không va chạm.
- Build backend/frontend qua. Lint không có lỗi; còn 12 cảnh báo trước đó thuộc game doanh nghiệp. Vite vẫn cảnh báo một số bundle trên 500 kB.
- API/Socket.io localhost: 50 kết nối; tất cả chờ ở X=0. Mua bứt tốc trừ điểm nhưng không làm vịt tự đi. Nhấn hướng tiến dùng bứt tốc; thả hướng hoặc hết hạn input thì dừng; chỉ đổi Y không tiêu quãng đã mua. Vị trí vật cản không đổi.
- Browser thật: ở phòng kiểm thử, hàng X=900 chặn Y=444 và Y=556, chừa Y=500. Vịt đi qua tại Y≈509,91; worldX vật cản vẫn là 900 trong khi pixel màn hình đổi từ ≈349 xuống ≈123 do camera. Thả phím: X giữ nguyên ≈1123,968, animation chuyển idle. Không có lỗi JavaScript.
- Bằng chứng: `design-preview/duck-race-v11/api-verification.json`, `browser-verification.json`, `before-row.png`, `passed-row.png`.
- Module client/server được đồng bộ và kiểm tra không import chéo hai game. Chưa thử đợt sửa này trên thiết bị di động thật hoặc Redis failover.
