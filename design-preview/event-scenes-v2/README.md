# Event artwork v2 — GIF theo từng sự kiện

Đã thay cách chọn hình theo nhóm icon chung bằng ánh xạ **ID sự kiện → GIF của sự kiện đó**. Bộ 33 GIF cũ vẫn là dự phòng cho ID cũ/ID mới do quản trị viên thêm mà chưa có trong seed.

## Phạm vi thực tế

| Loại | Số GIF |
|---|---:|
| Sự kiện gốc của 64 ngành | 1.280 |
| Sự kiện chung | 100 |
| Sự kiện gia tộc | 8 |
| Lời kể khác theo vùng/bối cảnh trong seed | 8 |
| Hỗ trợ vốn, giải ngân, tử vong, trăm năm và các kết quả chuyển giao | 9 |
| Lớp bối cảnh: thiếu đầu vào, nhà cung cấp nội địa, ùn cảng, hỗ trợ xanh, siết tín dụng, chuyển giao theo lô, tiêu chuẩn mới | 7 |
| **Tổng file GIF mới** | **1.412** |

**1.280 × 8 = 10.240 trường hợp ngành** được ghép bằng GIF gốc + lớp bối cảnh thích hợp, không nhân bản cùng một file thành 10.240 tên. Thay đổi phần trăm random giữ nguyên hình; tình huống và ngành khác nhau chọn bố cục khác nhau. Hai bản ghi `tec-bang-sang-che` và `gen-bang-sang-che` có cùng tên/nội dung bằng sáng chế nên có cùng hình; kiểm tra trùng poster chỉ còn cặp này.

## Hình được tạo bằng cách nào

Đây **không phải 1.412 tranh AI mới vẽ độc lập**. Các bố cục được biên soạn từ tranh nâng cấp nét vẽ tay theo đúng ngành đã tạo/duyệt trước đó, tranh gia tộc đã có, cùng các đối tượng SVG và chuyển động mô tả sự kiện. 323 đối tượng SVG thực sự được dùng trong danh mục. Không dùng ảnh chụp đời thật hoặc đánh số ngẫu nhiên để giả thành hình khác nhau.

Ví dụ: lệnh cấm máy quang khắc dùng cảnh máy ngành bán dẫn + wafer/lệnh cấm; đơn chip ô tô có ô tô; thiếu neon có bình khí; mã độc có hồ sơ/dữ liệu bị tấn công; ùn cửa khẩu ngành trái cây dùng kho lạnh cùng hàng chờ thông quan. Quốc kỳ chỉ xuất hiện khi tên sự kiện thực sự nêu nơi đến/nguồn; không suy từ các chuỗi con như “xúc”, “đúc”, “kiến trúc” hoặc “mỹ phẩm”.

Mỗi file có 72 nhịp hình logic, 25 fps, chu kỳ 2,88 giây, lặp vô hạn. Các nhịp liên tiếp có bitmap giống hệt được gộp thời lượng khi nén; số khung GIF vật lý có thể ít hơn 72, nhưng chuỗi hiển thị và thời gian giữ nguyên. Chuyển động theo chu kỳ, các hạt mưa/khói mờ trước khi quay vòng, không đổi ảnh theo đồng hồ.

GIF được nén bằng bảng màu chung và khung chênh lệch. Một lớp giấy đứng yên chỉ nằm trong phần silhouette chuyển động, cho phép xóa hạt cũ mà không để vệt ma. So sánh ảnh giải mã trên nền giấy trước/sau nén có sai lệch tối đa **0**. Tổng GIF hiện tại **58.141.206 byte** (~55,4 MiB), thay vì ~520 MB trước nén; poster khoảng 7,6 MB. Chỉ icon nhìn thấy mới tải GIF; ngoài màn hình, khi phòng tạm dừng hoặc bật giảm chuyển động thì dùng poster. SVG master có nhúng tranh raster làm nguồn, không phải tất cả đều thuần vector.

## Áp dụng và truy xuất

- Runtime: `frontend/public/assets/ui/event-scenes-v2/` chứa GIF, poster WebP, SVG master.
- `catalog.csv`: tra ID, ngành, tiêu đề, đối tượng, chuyển động, URL và tranh nguồn của từng sự kiện.
- `catalog.json`: danh mục và 7 lớp bối cảnh; `generated.json`: fingerprint và số byte.
- `review-contact.png`: một số bố cục; các ảnh `gameplay-*.png`, `dialog-*.png` là ảnh chụp production frontend với dữ liệu kiểm thử.
- `frontend/src/lib/event-art.ts` và `event-art-index.json`: chỉ cho phép các ID đã kiểm kê thành URL; nhận diện ID mở rộng, lời kể vùng và ID hệ thống động.
- `EventIcon.tsx`, `EventOverview.tsx`, `ongoing-events.ts`: truyền ID vào sự kiện năm nay, còn hiệu lực, lịch sử và chi tiết. Chỉ tăng hình trong chi tiết lên 96px; không thay công thức, nội dung sự kiện hay thời gian hiệu lực.
- Đã sửa thêm badge chưa xem: giữ khi hiệu ứng hết hạn nhưng còn trong lịch sử; bỏ khi chính bản ghi bị loại khỏi lịch sử giới hạn để không để số chưa xem không thể mở được.

## Kiểm tra

- `scripts/event-art-model.qa.mjs`: phủ toàn bộ 10.240 trường hợp ngành, 100 sự kiện chung, 8 gia tộc, 8 lời kể và 9 trạng thái hệ thống; đường dẫn file hợp lệ, số random không tạo file mới, ID lạ dùng dự phòng.
- `scripts/verify-event-scenes.py`: giải mã **1.412/1.412 GIF**, đúng kích thước, vô hạn, 72 nhịp/2,88 giây, có chuyển động thật; điểm nối cuối → đầu không vượt bước chuyển bình thường. `seam-report.json` giữ kết quả từng file.
- `scripts/compact-event-scenes.py`: đối chiếu ảnh giải mã trước/sau nén; `compression.json` giữ kết quả.
- Frontend build và lint đạt; lint còn cảnh báo sẵn có ở các phần khác.
- Playwright Chromium production build với HTTP/Socket.IO mô phỏng ở 390, 768, 1440px: kiểm tra GIF riêng và lớp bối cảnh xuất hiện, chạy thật, node/URL không thay khi đồng hồ cập nhật, poster khi pause/reduced motion, và ảnh ngoài vùng nhìn thấy không chạy. Các kiểm thử luồng gameplay trước đó vẫn qua. Dùng Chromium vì trình duyệt tích hợp localhost ở lượt trước không ổn định.

Chưa deploy hoặc kiểm tra trên Render/trận multiplayer thật. Không thêm dependency, không đổi API/handler, không sửa luật hay seed dữ liệu.

## Tái tạo

Với Sharp, FFmpeg, Pillow và NumPy có sẵn trên máy phát triển:

```powershell
node scripts/build-event-scenes.mjs
python scripts/compact-event-scenes.py
python scripts/verify-event-scenes.py
node --import tsx scripts/event-art-model.qa.mjs
```

Có thể đặt `SHARP_MODULE` tới Sharp đã cài sẵn; `EVENT_SCENE_IDS` là danh sách ID phân cách dấu phẩy để xử lý lại riêng các file cần sửa. Các công cụ chỉ dùng khi phát triển, không được nhúng vào ứng dụng.
