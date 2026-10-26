# Canvas phiên chơi v1 — bản duyệt

Cập nhật 26/10/2026. Chưa triển khai bố cục mới, nhịp 10 phút hoặc hướng dẫn vào ứng dụng.

## Bộ canvas hiện hành

| Ảnh | Nội dung |
|---|---|
| [01-player-results.png](01-player-results.png) | Tổng kết người chơi: giá trị đã chốt, hạng, số năm, câu đúng; dòng tiền và sự kiện mở theo tab. Có mẫu điện thoại. |
| [02-host-results.png](02-host-results.png) | Tổng kết host: một bảng xếp hạng, không lặp lại toàn bộ thẻ đội bên dưới. |
| [03-host-questions.png](03-host-questions.png) | Tab câu hỏi: từng dòng ngắn, mở câu để đọc đầy đủ; thống kê theo lượt trả lời. |
| [04-create-room.png](04-create-room.png) | Form tạo phòng sau đăng nhập Google, không còn cấu hình giá đầu tư. |
| [05-host-lobby.png](05-host-lobby.png) | Phòng chờ: mã + QR + danh sách đội + Bắt đầu; cấu hình thu gọn. |
| [06-in-game-guide-desktop.png](06-in-game-guide-desktop.png) | Nhân vật xuất hiện trực tiếp trên gameplay và chỉ đúng nút mua cụm. |
| [07-in-game-guide-mobile.png](07-in-game-guide-mobile.png) | Hướng dẫn ngay trong gameplay điện thoại, tuyển người rồi bấm Sang năm, kết thúc khi sang năm 2. |
| [08-guide-character-states.png](08-guide-character-states.png) | Nhân vật 2D và tư thế dùng cho chuyển động. Đây là bản thiết kế tư thế, chưa phải hoạt ảnh. |

Hai storyboard cũ 06-tutorial-start.png và 07-tutorial-year-one.png đã bị thay thế về thiết kế bởi hai canvas in-game-guide ở trên. **Không triển khai màn hướng dẫn riêng; không bắt mở biên nhận hay bấm “Đã hiểu” sau khi sang năm 2.**

## Phần đã sửa trong code

- StartScreen.tsx: bỏ 5 ô giá tham chiếu, state giá và linePrices khỏi POST tạo phòng.
- HostScreen.tsx: bỏ 5 ô giá tham chiếu, state giá và linePrices khỏi PATCH trước khi bắt đầu.
- Phòng mới tiếp tục dùng hồ sơ giá riêng của 64 ngành. Không thay số tiền đầu tư, thang tăng giá hay công thức sản xuất.
- Không sửa ngược dữ liệu các phòng đã lưu; giữ tương thích API cũ.
- Không áp dụng giao diện mới khi chưa được duyệt.

## Quy tắc triển khai từ canvas

- Tổng kết người chơi: giá trị đội đã kết thúc không còn biến động. Nếu phòng còn chơi, chỉ hạng hiển thị là “Hạng tạm”; không ghi giá trị đã chốt là tạm thời.
- Tổng kết host: chỉ một tab nội dung hiện tại. “Từng đội” không được tự xuất hiện dưới bảng xếp hạng; chỉ mở sau lựa chọn.
- Tên đội dài: overview tối đa 1–2 dòng tùy màn hình; nút/đối tượng mở chi tiết cho thấy toàn bộ tên; số tiền không bị tên đội đẩy khỏi khung.
- Ngành và vùng hiển thị gọn; bỏ danh xưng quy mô dài khỏi hàng xếp hạng, giữ trong chi tiết.
- Câu hỏi: mẫu số là lượt trả lời thực tế, không tự gọi là số đội. Tiêu đề ngắn trong ảnh là minh họa; bản thật dùng prompt thật được rút gọn và mở ra xem đủ.
- Không thêm chức năng xuất file, đánh giá chiến thuật bằng văn bản hay trạng thái “Sẵn sàng” giả. Nút sao chép liên kết trong phòng chờ là đề xuất UI mới.
- QR trong canvas là minh họa. Bản thật dùng QRCode hiện có để mã hóa link thật; không cắt QR từ canvas.
- Vốn 10 tỷ trong cấu hình là vốn tham chiếu; vốn thực tế còn theo quy mô/bối cảnh như hệ thống hiện tại. Không cam kết mọi ngành có vốn tuyệt đối bằng nhau.
- “Thiết lập nâng cao” trong ảnh 04 có dòng mô tả AI tự thêm về tương lai; không lấy dòng đó làm spec. Các trường giây/năm và khóa nút hiện đã tồn tại; chỉ thu gọn chúng vào disclosure.
- Biểu tượng hamburger do AI thêm trên hai mẫu điện thoại không là yêu cầu. Giữ các tab thao tác cần thiết hiển thị đủ.
- Màu/khung/nét vẽ theo ảnh; dữ liệu, giá, tác động nâng cấp luôn lấy từ server, không dùng phần trăm do ảnh sinh ra làm luật game.
- Hướng dẫn dùng một nhân vật + một lời thoại neo vào nút thật. Vùng bấm không được nhân vật, bóng thoại hay mũi tên che. Không thay gameplay bằng một trang onboarding.
- Canvas hướng dẫn dùng ví dụ trái cây sấy: cụm 220 triệu, tổ đầu tiên 5 người × 40 triệu = 200 triệu, tổng 420 triệu; chưa tính hiệu ứng. Ngành khác dùng báo giá thật theo profile.
- Giữ đủ 5 tab, có thể chia hai hàng ở điện thoại; không kéo ngang. Không yêu cầu người chơi đọc công thức.
- Lời thoại chuyển khi API thành công; không chuyển chỉ vì đã click. Hoàn tất sau lần chốt đầu tiên được máy chủ xác nhận và UI bước vào năm 2.

## Xác minh đã chạy

- npm run build -w frontend: thành công; còn cảnh báo chunk lớn trên 500 kB.
- npm run lint -w frontend: exit 0; còn các cảnh báo React/effect/ref có sẵn.
- scripts/public-pages.qa.cjs: 21 ảnh tại 390/768/1440, không thiếu ảnh, không lỗi JS; kiểm tra Google giả lập, vào phòng, tạo phòng và payload không còn linePrices.
- git diff --check: không lỗi whitespace.
- Kiểm thử dùng Chromium/Playwright với frontend build được route.fulfill tại game.test và API giả lập: IAB localhost timeout, trình duyệt trực tiếp bị ERR_NETWORK_ACCESS_DENIED.
- Chưa kiểm thử Google thật, Render production, database thật, thiết bị iOS thật.
- Các canvas là ảnh duyệt, không phải UI đã chạy; không coi screenshot kiểm thử landing/Wiki là kiểm thử các màn mới.
- Các ảnh đầu ra được tạo bằng built-in Image Gen. Prompts và nguồn nằm ở prompts.json.

Kế hoạch chi tiết: [PLAN-10-MINUTES.md](PLAN-10-MINUTES.md).

