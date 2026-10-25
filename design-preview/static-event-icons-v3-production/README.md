# Bộ ảnh tĩnh đã áp dụng

Người dùng duyệt tám canvas ở `../static-event-icons-v3/`. Bảy bảng minh họa được xuất lại bằng **Image Gen tích hợp** thành production atlas nền alpha, không chứa tiêu đề, nhãn hay nền giấy. Canvas 08 là mẫu cho danh sách và chi tiết sự kiện.

## Tệp và cách dùng

- `atlases/approved-*.png`: bảy nguồn vẽ tay, 12 hình/bảng; provenance ghi file gốc của Image Gen.
- `export-*.jpg`: contact sheet kiểm tra silhouette trên nền kem, không dùng trong app.
- `frontend/public/assets/ui/static-events-v3/`: **84 ảnh WebP 256×256**, tổng khoảng 2,4 MB; mỗi ảnh được tải riêng khi cần, không tải cả atlas trong gameplay.
- `scripts/extract-approved-event-icons.py`: tách silhouette bằng connected components, gom các giọt nước/khói/chi tiết rời về đúng hình; không cắt cứng theo ô, không ghép SVG hay ảnh nhà máy.
- `scripts/map-static-event-art.mjs`: tạo manifest ánh xạ có kiểm tra file tồn tại.
- `frontend/src/lib/static-event-art-index.json`: 1.405 bản ghi gốc (1.280 ngành, 100 chung, 8 gia tộc, 8 lời kể, 9 hệ thống). 1.280 tình huống ngành × 8 bối cảnh = 10.240 trường hợp vẫn được nhận diện.

**84 tranh là một thư viện dùng chung theo bản chất sự kiện, không phải 1.405 hay 10.240 tranh riêng.** Các ví dụ CNC, wafer, máy cưa, máy sấy, đường ống, cẩu cảng và sáu nhóm đơn hàng có hình chuyên biệt. Các ngành/tình huống khác dùng minh họa nhóm tương ứng. Bối cảnh và con số ngẫu nhiên vẫn nằm trong chữ thật; không dán một icon thứ hai lên tranh chính. Chưa sản xuất toàn bộ tranh riêng cho từng tình huống của 64 ngành.

## Giao diện

Danh sách dùng ảnh 64px, tóm tắt 56px (48px trên điện thoại), tên → tác động → năm/thời hạn → nút mở chi tiết. Điện thoại hiển thị hai sự kiện trong tóm tắt và giữ nút Xem tất cả. Chi tiết chỉ mở do người dùng chọn, ảnh 176–192px, nền giấy, nút Đóng cam có viền hiện có. Đặc quyền gia tộc dùng cùng bộ tranh nhân vật/vật phẩm.

Không gọi GIF; không chọn lại nguồn ảnh theo đồng hồ, trạng thái pause, viewport hoặc reduced-motion. Không thêm thông báo tự bật. Hiệu ứng xuất hiện/biến mất của hàng sự kiện và reduced-motion hiện có được giữ nguyên.

## Phạm vi giữ nguyên

Không sửa seed, công thức, xác suất, thời hạn, giá, API, route hay logic mua nâng cấp. Yêu cầu số máy chạy và số công nhân luôn nguyên **được để sau theo chỉ dẫn của người dùng**. Không deploy.

## Kiểm thử

- `node --import tsx scripts/event-art-model.qa.mjs`: kiểm tra ảnh tồn tại, ánh xạ 1.405 bản ghi/10.240 trường hợp ngành, ID không hợp lệ, kế nghiệp và phân biệt các ngành mẫu.
- `npm run build -w frontend` và `npm run lint -w frontend`.
- `node --import tsx scripts/intro-flow.qa.cjs`: Chromium Playwright, app production build, HTTP/Socket.IO được mock; kiểm tra danh sách/chi tiết tại 390×844, 768×1024, 1440×900, focus/submit hiện có, không tự mở dialog, nguồn ảnh tĩnh ổn định, không request GIF hay lớp context cũ. Không phải kiểm tra database/Render thật.
- Ảnh chụp nghiệm thu nằm trong `verification/`.

Trình duyệt IAB localhost đã không ổn định trong phiên làm việc trước; kiểm tra này dùng Playwright Chromium thay thế. Chưa kiểm tra trên thiết bị iOS/Safari hay Android thật. Lint còn các warning có sẵn trong realtime, StartScreen, HostScreen và PlayScreen; không mở rộng phạm vi sửa chúng.
