# Cố vấn doanh nghiệp — hướng dẫn năm đầu

Đã tích hợp vào PlayScreen, không còn chỉ là bản xem thử 4519.

## Luồng

Phiên mới dùng **version 2, 28 bước**: tám mục HUD → tự mở Đầu tư → mua cụm và tổ công nhân trên thẻ thật → thực hành phụ trợ, hạ tầng, công nghệ sạch → tự mở Doanh nghiệp → lần lượt sáu chỉ số → ô nhiễm và chất lượng → tự mở Rủi ro, Lịch sử sự kiện, Thay đổi từng năm → chốt năm đầu → hoàn tất. Version 1 cũ vẫn giữ nguyên 19 bước theo action để phiên đang dở không bị đổi chỉ số bước hoặc mua lặp.

Phần giới thiệu thanh trên (8 mục đầu) cho phép chạm nền, lời thoại hoặc Enter/Space để chuyển ngay, không bắt bấm chỉ số. Sau lời giới thiệu, tab được mở tự động bằng chính nút tab thật, rồi xác nhận tiến độ qua API hiện có. Người chơi vẫn có thể chạm để tiếp tục sớm. Bước thực hành mua và Sang năm vẫn cần thao tác thật. Trong các đoạn thực hành, chạm khi đang nói sẽ hiện hết đoạn hiện tại; chạm sau đó phản hồi để tiếp tục. Đến yêu cầu thao tác, chỉ bấm đúng nút mua hoặc Sang năm mới thực hiện thao tác kinh tế.

Lời thoại được chia ở ranh giới câu thành các đoạn ngắn (tối đa khoảng 110 ký tự), **18ms mỗi cụm ký tự tiếng Việt**, ngắt dấu phẩy 80ms và hết câu 180ms. Hết một đoạn, miệng khép lại và chờ 2,5 giây hoặc một lần chạm/Enter/Space. Khoảng nghỉ tự nối đoạn, chuyển phần giới thiệu và mở tab. Tuyệt đối không tự mua nâng cấp hoặc chốt năm. Khi tab/đoạn cần xác nhận gặp lỗi, tự chuyển dừng để người chơi thử lại. Có dòng nhắc nhỏ phân biệt đang nói, đang nghỉ và đang chờ bấm đúng mục.

## Thời gian và trạng thái

- Đồng hồ **toàn trận luôn tiếp tục**, không tăng thời hạn phòng hoặc dừng các CEO khác.
- Chỉ đồng hồ tự Sang năm của CEO đang học được giữ ở 0. Năm đầu không có delay cho nút Sang năm ở bước cuối.
- Tiến độ tutorial lưu trong JSON trạng thái từng participant, được gửi trong snapshot và lưu qua persist hiện có; không cần migration SQL mới.
- Mở phòng mới/bắt đầu lượt chơi mới khởi tạo tutorial. Lượt đang chơi trước bản cập nhật không bị chèn hướng dẫn giữa chừng.
- Bước mua chỉ qua sau đầu tư thật thành công; các gói vẫn theo giá và định mức ngành. Tài nguyên đã được sự kiện tặng có nhánh xác nhận riêng, không ép mua lặp. Vốn không đủ có nhánh tiếp tục xem với vốn hiện có, không cấp tiền miễn phí.
- Sau lần chốt năm đầu, phản hồi của cố vấn hoàn tất rồi máy chủ mới đặt chu kỳ Sang năm tiếp theo. Câu hỏi vẫn áp dụng cơ chế dừng đồng hồ năm riêng đã có; đồng hồ trận không dừng.
- API giữ đúng thứ tự và idempotent với request trùng; token được kiểm tra theo phòng như các thao tác khác.

## Hình ảnh

Nguồn toàn nhân vật từ thiết kế đã duyệt, 26 chuỗi × 8 vị trí frame, bao gồm chín chuỗi nói khi đang chỉ (một số lặp hình miệng đã vẽ trong các vị trí frame). Ảnh, bảng tên, fade/di chuyển khi xuất hiện, nói, thở, xác nhận, chúc mừng và chín hướng chỉ đều phát qua Canvas; không dùng khớp cắt rời hay chuyển động CSS. Các frame được tách bitmap để không lấy lẫn hình bên cạnh. Có ba hướng mới cho bố cục thấp: chỉ thẳng lên, chếch cao bên trái và bên phải; tư thế cuối dùng cùng frame kín miệng của chuỗi vừa chỉ vừa nói.

Canvas phủ xám trung tính nhẹ ngoài vùng đang được giải thích. Vùng tập trung có nét vàng và phản hồi hover; tab, chỉ số, khoản đầu tư và Sang năm có điểm nhấn riêng. Hướng tay/ánh mắt theo vị trí mục đang nói đến; lời giải thích tab hiện tại và câu yêu cầu mở tab tiếp theo dùng đúng hai mục khác nhau. Cố vấn và khung thoại giữ sáng, tránh che mục đang chỉ. Giảm chuyển động theo thiết lập hệ điều hành.

Khoanh vùng dùng `attention-frame.svg` riêng, cắt 9 phần để giữ góc/độ dày khi co giãn theo chỉ số, tab hoặc nút; tâm trong suốt, không chặn thao tác. Hướng chỉ được chọn từ góc giữa nhân vật và vùng đang giải thích trong viewport, không gắn cố định theo tên bước hoặc loại thiết bị.

Bảng tên được vẽ chồng 3px lên đáy không trong suốt của frame hiện tại, nên không còn khoảng trống do gutter atlas. Chữ tiếng Việt dùng Times New Roman, chuẩn hóa NFC và đánh theo grapheme. Có chế độ reduced-motion và nhánh dự phòng không có ImageBitmap/Segmenter.

Ảnh phục vụ từ `frontend/public/assets/ui/advisor-v1`. Metadata: `frontend/src/lib/advisor-sprites.json`. Giao diện: FirstYearAdvisor, TopBar, GameTabs, BudgetPanel, YearButton. Hướng dẫn không làm reflow grid game; khung thoại tránh nút cần bấm.

Cố vấn neo ở vùng dưới bảng sự kiện bên trái thay vì che ảnh nhà máy. Trên màn hình không có đủ khoảng trống, lớp hướng dẫn tự tránh mục đang chỉ và giữ trong viewport. Lời thoại nằm chếch trên bên phải nhân vật, có khung/tail SVG riêng và nền giấy tạo riêng (`dialogue-frame.svg`, `dialogue-tail.svg`, `dialogue-paper.webp`), không dùng lại khung gameplay. Chữ thoại 20px, màn hình hẹp 18px; dòng nhắc 14px.

Gameplay chỉ giữ số liệu dự báo, kết quả nhận/mất và dòng tiền. Cách tính, quy tắc cộng dồn, định giá và làm tròn đặt trong Wiki. Trạng thái mua không còn lời nhắc máy chủ/xác nhận; nút vẫn khóa lúc đang mua, lỗi thật vẫn được hiển thị.

Người chơi được gọi là CEO trong giao diện, bảng xếp hạng, Wiki và phản hồi lỗi API; tên trường `teamName`/ID đội nội bộ giữ nguyên để không đổi hợp đồng dữ liệu. Chỉ nhập tên CEO khi vào phòng; ThemeIntro hiển thị tên doanh nghiệp phân sẵn, không có ô nhập lại tên công ty. Vẫn gửi tên phân sẵn qua hợp đồng intro hiện có.

Lời cố vấn lấy tên CEO, ngành, vốn, tài sản, hạng, thời lượng phòng, số người/cụm thực có, định mức tổ, giá quote và báo cáo sản xuất từ snapshot hiện tại của CEO. Nội dung nói được chụp khi bắt đầu mỗi bước để đồng hồ hoặc thay đổi hạng trực tiếp không liên tục khởi động lại đoạn thoại. Khi chuyển bước hoặc reload, dùng dữ liệu mới nhất. Không suy giá từ một ngành khác hay cố định cần 4/5 người cho mọi CEO.

## Kiểm tra

- `npm run build -w frontend`
- `npm run lint -w frontend` (cảnh báo đã tồn tại ở các phần khác)
- `npm run build -w backend`
- `npm run test -w backend`
- `node --import tsx scripts/first-year-guide.qa.cjs` với Playwright có sẵn.

QA giao diện dùng production bundle thật, Socket.IO/API mô phỏng cục bộ và công thức đầu tư/sản xuất thật. Kiểm tra 360×800, 390×844, 768×1024, 844×390, 1440×900: hướng dẫn, nhóm công nhân theo ngành, lỗi kết nối/thử lại, reload đúng bước, timer trận tiếp tục, timer năm được giữ, bảng tên sát, không tràn ngang và thoại không che target. Báo cáo cuối ở `design-preview/mascot-guide-v3/verification-ceo-final/report.json`.

Kiểm thử backend xác nhận tiến độ khi phòng thật bắt đầu, thứ tự bắt buộc, thao tác kinh tế thật, request lặp, thiếu vốn, tài nguyên đã có và tính độc lập với đồng hồ/đội khác. Kiểm thử DB tích hợp cần DB riêng và đang skip theo cấu hình sẵn có. Không deploy hay ghi dữ liệu lên server công khai trong task này.

Cập nhật sự kiện, độ bền và thông số rút gọn: xem `company-events-and-guidance.md`.

Cập nhật mới: tab Đầu tư yêu cầu CEO bấm thật; các tab khác mở trước lời giải thích và tự tiếp tục sau 2,5 giây. Lời thoại 24px/21px. Xem `durability-quiz-strategy.md`.
