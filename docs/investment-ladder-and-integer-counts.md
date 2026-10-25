# Giá đầu tư và số lượng nguyên

## Giá mặc định mới (triệu VNĐ)

| Hướng | Gói đầu | Tăng mỗi gói đã mua, khi không có hiệu ứng giá |
|---|---:|---:|
| Nhân lực | 50 | 1 |
| Máy móc | 200 | 4 |
| Phụ trợ | 75 | 2 |
| Hạ tầng | 100 | 2 |
| Công nghệ sạch | 60 | 1 |

Giá mỗi hướng tăng độc lập. Ví dụ nhân lực: 50, 51, 52… triệu; 10 gói đầu là 545 triệu, vì yêu cầu mới là giá tăng theo cấp. Cấu hình giá riêng do chủ phòng đặt vẫn được giữ. Phòng cũ dùng đồng loạt giá mặc định theo vốn sẽ chuyển sang bộ giá mới khi backend nạp lại.

Mỗi lần báo giá: tính giá gốc sau sự kiện, làm tròn theo triệu; bước tăng là khoảng 2% giá này, tối thiểu 1 triệu. Giá gói thứ k = giá sau sự kiện + bước tăng × số gói đã mua của hướng đó. Mua nhiều là tổng cấp số cộng của từng gói. Tối đa tìm đúng số gói đủ tiền, kể cả giá tăng trong cùng giao dịch. Xem trước và mua thật dùng chung `investmentQuote`; không lấy giá gói đầu nhân số lượng.

Giá tăng không tự làm gói mạnh hơn. Hiệu quả vẫn dựa trên giá gốc của hướng, các hệ số cân bằng và hiệu suất ngẫu nhiên của năm; ưu đãi chỉ đổi hóa đơn. Số gói đã mua được lưu trong state JSON, không cần đổi schema database. Tái khởi động được hỗ trợ vốn tạo state mới nên đặt lại thang giá.

## Các nâng cấp hiện có

- Nhân lực tăng số kỹ sư, giảm phụ thuộc; nhân lực và máy chạy giúp tích lũy công nghệ qua năm.
- Máy móc thêm năng lực lắp đặt. Chưa có dòng máy theo hạng chất lượng hoặc nút sửa chữa/bảo dưỡng riêng.
- Phụ trợ giảm chi phí nguyên liệu, giảm tác động một số cú sốc cung ứng.
- Hạ tầng giảm logistics, tăng tỷ lệ sản phẩm bán được.
- Công nghệ sạch giảm ô nhiễm tức thời và tăng xử lý định kỳ, giúp tránh bị giảm giá bán.

Chưa có thuộc tính tay nghề cho từng công nhân. `condition` đang hao mòn theo năm và ảnh hưởng định giá máy; nó chưa phải hệ thống nâng cấp chất lượng sản xuất. Không tự thêm các cơ chế đó trong thay đổi này.

## Máy, người và sản phẩm

Kỹ sư được chốt thành số nguyên khi khởi tạo, đầu tư, thưởng và tác động sự kiện. Máy hoàn chỉnh là số nguyên; phần năng lực còn lẻ được giữ trong `machineProgress` và hiển thị thành phần trăm lắp đặt. Không được làm tròn mỗi gói nhỏ lên thành máy miễn phí. Giá trị dở dang vẫn tham gia định giá công ty.

Máy chạy = min(máy hoàn chỉnh, floor(kỹ sư / kỹ sư cần cho một máy)). Chưa đủ nhân lực cho trọn một máy thì máy đó nhàn. Sản phẩm tạo ra làm tròn xuống sau các hệ số; lượng bán làm tròn xuống sau tỷ lệ giao hàng và không vượt lượng sản xuất. Tiền, cấp công nghệ, cấp phụ trợ/hạ tầng và các hệ số vẫn có thể thập phân. Báo cáo quá khứ được giữ nguyên, nhưng trường số lượng hiển thị bằng số nguyên.

## Câu hỏi và thời gian

Khi câu hỏi mở, dừng đồng hồ Sang năm của riêng đội và khóa Sang năm cả tại UI lẫn API. Đồng hồ trả lời và đồng hồ chung của phòng tiếp tục. Đáp án/hết giờ được chốt cho đúng câu đang mở; phần kết quả được đóng thủ công hoặc hết thời gian hiển thị rồi mới tiếp tục đồng hồ năm với đúng số giây còn lại. Pause của chủ phòng không bị tính hai lần.

Tick xử lý hết giờ câu hỏi trước khi xét tự sang năm. Không được trình câu năm mới khi còn pending. Đáp án quá hạn, đáp án không thuộc câu và `pendingId` cũ bị từ chối; không phát thưởng hai lần.

## Kiểm chứng

Backend: 124 test qua, một test tích hợp schema bỏ qua do không có database kiểm thử. Bao gồm giá riêng từng mục, giá tăng, mua lẻ bằng mua nhiều, Tối đa, ưu đãi/phụ phí, giữ tiến độ, số lượng nguyên và không thay câu sau 60 giây. Build backend/frontend qua; lint frontend không lỗi, còn warning có sẵn.

Playwright Chromium tại 390×844, 768×1024, 1440×900, dùng production build và HTTP/Socket.IO mock, kết hợp công thức backend thật để kiểm tra giá/preview. Đã kiểm tra nút nhân lực 50 → 51 triệu sau một lần mua, máy 200 triệu, đồng hồ Sang năm giữ nguyên trong khi câu hỏi đếm thời gian và gửi đúng pendingId. Chưa triển khai Render, chưa kiểm thử database/thiết bị thật hay đánh giá cân bằng toàn bộ 64 ngành qua nhiều trận.
