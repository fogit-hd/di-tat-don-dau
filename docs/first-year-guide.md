# Cố vấn doanh nghiệp — hướng dẫn năm đầu

Đã tích hợp vào PlayScreen, không còn chỉ là bản xem thử 4519.

## Luồng

19 bước: tên doanh nghiệp → tiền mặt → tài sản → số năm đã chốt → đồng hồ trận → thu nhập → thứ hạng → loa → Đầu tư → Doanh nghiệp → Rủi ro → Lịch sử sự kiện → Thay đổi từng năm → quay lại Đầu tư → mở một cụm → tuyển đủ tổ theo ngành → xem Doanh nghiệp đã cập nhật → chốt năm đầu → phản hồi hoàn tất.

Các tab phải được người chơi bấm thật; không tự mở rồi tính như đã xem. Mọi bước cần thao tác đều chờ vô hạn, không có nút tự bỏ qua. Chạm khi đang nói sẽ hiện hết đoạn hiện tại; chạm sau đó phản hồi để tiếp tục. Đến yêu cầu thao tác, chỉ bấm đúng mục mới chuyển bước.

Lời thoại được chia ở ranh giới câu thành các đoạn ngắn, khoảng 45ms mỗi cụm ký tự tiếng Việt, nghỉ lâu hơn ở dấu câu. Hết một đoạn, miệng khép lại và chờ 3 giây hoặc một lần chạm/Enter/Space. Khoảng nghỉ chỉ tự nối đoạn giải thích tiếp theo, không tự xác nhận thao tác. Có dòng nhắc nhỏ phân biệt đang nói, đang nghỉ và đang chờ bấm đúng mục.

## Thời gian và trạng thái

- Đồng hồ **toàn trận luôn tiếp tục**, không tăng thời hạn phòng hoặc dừng các đội khác.
- Chỉ đồng hồ tự Sang năm của đội đang học được giữ ở 0. Năm đầu không có delay cho nút Sang năm ở bước cuối.
- Tiến độ tutorial lưu trong JSON trạng thái từng participant, được gửi trong snapshot và lưu qua persist hiện có; không cần migration SQL mới.
- Mở phòng mới/bắt đầu lượt chơi mới khởi tạo tutorial. Lượt đang chơi trước bản cập nhật không bị chèn hướng dẫn giữa chừng.
- Bước mua chỉ qua sau đầu tư thật thành công; các gói vẫn theo giá và định mức ngành. Tài nguyên đã được sự kiện tặng có nhánh xác nhận riêng, không ép mua lặp. Vốn không đủ có nhánh tiếp tục xem với vốn hiện có, không cấp tiền miễn phí.
- Sau lần chốt năm đầu, phản hồi của cố vấn hoàn tất rồi máy chủ mới đặt chu kỳ Sang năm tiếp theo. Câu hỏi vẫn áp dụng cơ chế dừng đồng hồ năm riêng đã có; đồng hồ trận không dừng.
- API giữ đúng thứ tự và idempotent với request trùng; token được kiểm tra theo phòng như các thao tác khác.

## Hình ảnh

Nguồn toàn nhân vật từ thiết kế đã duyệt, 20 chuỗi × 8 vị trí frame, bao gồm sáu chuỗi nói khi đang chỉ (một số lặp hình miệng đã vẽ trong các vị trí frame). Ảnh, bảng tên, fade/di chuyển khi xuất hiện, nói, thở, xác nhận, chúc mừng và sáu hướng chỉ đều phát qua Canvas; không dùng khớp cắt rời hay chuyển động CSS. Các frame được tách bitmap để không lấy lẫn hình bên cạnh.

Canvas phủ xám trung tính nhẹ ngoài vùng đang được giải thích. Vùng tập trung có nét vàng và phản hồi hover; tab, chỉ số, khoản đầu tư và Sang năm có điểm nhấn riêng. Hướng tay/ánh mắt theo vị trí mục đang nói đến; lời giải thích tab hiện tại và câu yêu cầu mở tab tiếp theo dùng đúng hai mục khác nhau. Cố vấn và khung thoại giữ sáng, tránh che mục đang chỉ. Giảm chuyển động theo thiết lập hệ điều hành.

Bảng tên được vẽ chồng 3px lên đáy không trong suốt của frame hiện tại, nên không còn khoảng trống do gutter atlas. Chữ tiếng Việt dùng Times New Roman, chuẩn hóa NFC và đánh theo grapheme. Có chế độ reduced-motion và nhánh dự phòng không có ImageBitmap/Segmenter.

Ảnh phục vụ từ `frontend/public/assets/ui/advisor-v1`. Metadata: `frontend/src/lib/advisor-sprites.json`. Giao diện: FirstYearAdvisor, TopBar, GameTabs, BudgetPanel, YearButton. Hướng dẫn không làm reflow grid game; khung thoại tránh nút cần bấm.

## Kiểm tra

- `npm run build -w frontend`
- `npm run lint -w frontend` (cảnh báo đã tồn tại ở các phần khác)
- `npm run build -w backend`
- `npm run test -w backend`
- `node --import tsx scripts/first-year-guide.qa.cjs` với Playwright có sẵn.

QA giao diện dùng production bundle thật, Socket.IO/API mô phỏng cục bộ và công thức đầu tư/sản xuất thật. Kiểm tra 360×800, 390×844, 768×1024, 844×390, 1440×900: hướng dẫn, nhóm công nhân theo ngành, lỗi kết nối/thử lại, reload đúng bước, timer trận tiếp tục, timer năm được giữ, bảng tên sát, không tràn ngang và thoại không che target. Báo cáo ở `design-preview/mascot-guide-v3/verification-production/report.json`.

Kiểm thử backend xác nhận tiến độ khi phòng thật bắt đầu, thứ tự bắt buộc, thao tác kinh tế thật, request lặp, thiếu vốn, tài nguyên đã có và tính độc lập với đồng hồ/đội khác. Kiểm thử DB tích hợp cần DB riêng và đang skip theo cấu hình sẵn có. Không deploy hay ghi dữ liệu lên server công khai trong task này.
