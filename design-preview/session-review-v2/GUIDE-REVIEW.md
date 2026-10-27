# Bổ sung màn vào phòng và hướng dẫn — 27/10/2026

> Cập nhật: người dùng đã chốt và yêu cầu code. Đã triển khai; xem `docs/approved-session-v2.md` để biết trạng thái và báo cáo kiểm chứng cuối. Phần mô tả bên dưới giữ làm hồ sơ thiết kế.

Đây là phần thiết kế bổ sung. Các canvas đã chốt ở REVIEW.md giữ nguyên; chưa sửa mã ứng dụng trong lượt vẽ này. Các số liệu trên ảnh là ví dụ, không phải thông số cố định cho mọi ngành.

## 07 · Tiêu đề tạo phòng

“Tạo phòng” căn giữa theo chiều ngang của chính dải tiêu đề, trên desktop và mobile. Không đổi bố cục form hay đưa tiêu đề vào giữa toàn viewport.

## 08 · Đang vào phòng…

Nền office/cảng vẽ tay và bộ khung giấy/đỏ rượu/vàng cùng họ với sảnh. Một bảng nhỏ giữa màn: minh họa cửa mở, “Đang vào phòng…”, mã phòng thực và dấu chờ không xác định. Không hiển thị phần trăm giả, không cố kéo dài thời gian chờ để phát hoạt cảnh, không nhầm với countdown ba giây trước trận.

Khi snapshot hợp lệ đến, chuyển ngay sang màn thực tế tương ứng: sảnh, countdown, ngữ cảnh, gameplay hoặc kết quả. Nếu phản hồi nhanh, không buộc người chơi xem hết hiệu ứng. Mất kết nối/lỗi phải thay nội dung trong cùng bảng bằng lỗi thật và Thử lại/Về trang chủ; không giả như vẫn đang tải vô hạn. Khung lỗi nhỏ ở canvas chỉ là minh họa trạng thái thay thế, không xuất hiện cùng lúc với loading.

## 09 · Thực hành trên nút đầu tư thật

Qua đọc BudgetPanel: hai nút starter nằm ở dải riêng phía trên; trong lúc tutorial chạy, các nút mua trên thẻ đều bị khóa. Đây là điểm cần thay đổi. Bản mới bỏ dải starter đó, chỉ mở nút thật được yêu cầu trong danh sách. Không tạo nút mua thay thế trong bong bóng hoặc phía trên bảng đầu tư.

Luồng cần đảm bảo mỗi người được giải thích đúng lợi ích, chi phí hiện tại và kết quả giao dịch:

| Mục | Nội dung cố vấn | Thao tác trực tiếp |
| --- | --- | --- |
| Mở cụm sản xuất | Thêm nơi/năng lực sản xuất; phải đủ tổ công nhân mới chạy. Hiện giá và cụm trước/sau theo quote của CEO | Khoanh nút Đầu tư ×1 trên thẻ Mở cụm sản xuất |
| Tuyển công nhân | Tuyển đủ số người còn thiếu theo định mức ngành; công nhân dư không tự tăng sản lượng khi thiếu cụm | Khoanh hành động tuyển thực trong thẻ Tuyển công nhân; nút Tuyển đủ tổ nếu có, không dùng nút starter phía trên |
| Phụ trợ | Giảm chi phí nguyên liệu; giảm bất lợi khi nguồn cung bị gián đoạn. Không tạo công nhân hoặc cụm | Khoanh nút Đầu tư trên đúng thẻ phụ trợ của ngành |
| Hạ tầng | Giảm phí logistics; tăng tỷ lệ sản phẩm bán được. Không tự tạo sản phẩm khi chưa vận hành | Khoanh nút Đầu tư trên thẻ hạ tầng |
| Công nghệ sạch | Giảm ô nhiễm để bảo vệ giá bán/định giá. Không đồng nghĩa công nghệ năng suất hoặc chất lượng máy | Khoanh nút Đầu tư trên thẻ công nghệ sạch |

Trước mỗi giao dịch, cố vấn nói khoản nhận được và tiền phải chi theo dữ liệu thật. Sau giao dịch, khoanh ngắn giá trị vừa thay đổi và xác nhận kết quả, không lặp lời giải thích dài. Không hứa một lợi nhuận cố định vì sản lượng/giá/sự kiện còn thay đổi. Nếu dùng hành động tuyển tổ, số người và tổng chi phí đều lấy từ quote thực; không cố định 5 người cho mọi ngành.

Các khoản thực hành chỉ thực hiện khi đủ vốn. Không tự mua, không tặng tài nguyên, không ép vay, không bỏ qua giao dịch thành công chỉ bằng chạm hội thoại. Mua lỗi/đang chờ không làm chuyển bước; thử lại không trừ tiền hai lần. Nếu thiếu vốn hoặc nguồn lực đã được sự kiện tặng sẵn, hướng dẫn giải thích đúng trường hợp và cho tiếp tục mà không bắt mua lặp.

## 10 · Sáu chỉ số doanh nghiệp

Bắt buộc người chơi tự bấm tab Doanh nghiệp. Sau đó lần lượt khoanh từng thẻ, cố vấn đổi hướng tay/ánh mắt theo vị trí thẻ. Mỗi lần chỉ một lời thoại; không nhét cả sáu đoạn vào gameplay cùng lúc. Canvas sáu ô là storyboard để duyệt, không phải sáu bảng mới trong sản phẩm.

| Chỉ số | Cần giải thích theo mã hiện tại |
| --- | --- |
| Công nhân | Số người sở hữu; cần đủ định mức người/cụm của ngành để vận hành. Cho biết đang có và còn thiếu bao nhiêu; tuyển dư không tạo thêm cụm |
| Cụm sản xuất | Phân biệt sở hữu, đang vận hành và chờ đủ nhân lực. Cụm không chạy khi thiếu tổ; cụm chờ vẫn có thể phát sinh phí giữ cụm |
| Sản phẩm cộng dồn | Tổng đã sản xuất qua các năm; không phải sản lượng năm tới, số đã bán hoặc tồn kho. Năm đầu chưa chốt có thể bằng 0 |
| Công nghệ | Tích lũy qua vận hành, tham gia tăng năng suất. Khác tay nghề công nhân, chất lượng và tình trạng thiết bị; không gọi nó là toàn bộ ba yếu tố đó |
| Phụ trợ | Giảm chi phí đầu vào và giúp chống bất lợi về nguồn cung. Hiển thị cấp hiện tại và tác động thật nếu backend cung cấp |
| Hạ tầng | Giảm phí logistics và nâng tỷ lệ hàng bán được, không tự làm tăng số cụm hoặc công nhân |

Sau sáu thẻ: giải thích ngắn ô nhiễm/công nghệ sạch và nhóm tay nghề/thiết bị/tình trạng nếu phiên đó có. Khi ô nhiễm vượt ngưỡng, giá bán chịu bất lợi; công nghệ sạch giúp xử lý ô nhiễm. Công thức chi tiết tiếp tục ở Wiki, không đưa phương trình vào lời thoại gameplay. Không đồng nhất “sản phẩm cộng dồn” với doanh thu.

## Hành trình đến hết năm đầu

1. Các phần HUD: tên CEO/doanh nghiệp, tiền mặt, tài sản, năm, đồng hồ trận, thu vận hành, thứ hạng, loa — theo đúng dữ liệu người chơi, có thể chạm hội thoại hoặc phần ngoài để tiếp, không bắt click vào chỉ số.
2. Bắt buộc click tab Đầu tư; giới thiệu ý nghĩa mua rồi thực hành ngay các nút thật như trên.
3. Click tab Doanh nghiệp, lần lượt sáu chỉ số và hai nhóm phụ nếu có.
4. Click lần lượt Rủi ro, Lịch sử sự kiện, Thay đổi từng năm để xem thật. Giải thích rủi ro hiện tại, thời hạn theo năm và nơi xem tiền vào/ra; không mở công thức.
5. Click nút Sang năm thật để chốt năm đầu. Lần này không có delay.
6. Cố vấn chỉ kết quả vừa chốt: sản lượng thực, tiền thu/chi và nơi xem ledger, sau đó khép hướng dẫn. Bắt đầu chu kỳ tự Sang năm từ năm thứ hai.

Đồng hồ cả trận luôn chạy. Chỉ giữ lại đồng hồ tự Sang năm trong tutorial, không cộng thêm thời gian trận. Không tự bấm các tab, mua hàng hoặc Sang năm thay người chơi. Các bước bắt thao tác chỉ được hoàn thành khi đúng thao tác/game state được máy chủ xác nhận. Nếu thêm bước ở backend, cần version hóa tutorial và chuyển đổi phiên đang dở theo action, không đổi mảng chỉ số step của version cũ khiến người chơi mua lặp hoặc mất tiến độ.

## Chữ và chuyển động

Đề xuất tăng từ **45ms xuống 18ms cho mỗi cụm ký tự tiếng Việt** (nhanh khoảng 2,5 lần), ngắt dấu phẩy khoảng 80ms, hết câu khoảng 180ms. Chạm có thể hiện hết đoạn ngay. Vẫn giữ khoảng nghỉ ba giây giữa các lượt lời; hết thoại thì miệng khép lại. Đến bước thao tác, cố vấn chờ nút thật, không tự bỏ qua vì đã đọc xong.

Giữ nguyên sprite nguyên khối đã duyệt, khung và plaque Cố vấn doanh nghiệp sát nhân vật, không ghép khớp hoặc hoạt ảnh nhân vật bằng CSS. Khi khoanh mục, vùng còn lại tối/xám nhẹ. Khung SVG bám đúng button/card hiện tại. Advisor dưới vùng sự kiện khi còn chỗ; bubble ở trên-phải nhưng tự chuyển vị trí khi sắp che target. Canvas 11 mô tả phone/tablet; không thay nhãn hoặc cơ chế các tab giữa thiết bị.

## Dữ liệu và kiểm chứng khi triển khai

Lấy tên CEO, tên ngành, tên thẻ nâng cấp, tiền, quote, số công nhân/cụm, crewRequired, công nghệ, sản phẩm cộng dồn, support/infra/green, dự báo và kết quả năm thực từ snapshot. Trước/sau phải đọc từ giao dịch/ledger thật, không lấy số ví dụ trên canvas.

Kiểm thử các ngành cần 3/4/5/6 người, giá khác nhau, thiếu vốn, tài nguyên được tặng, giao dịch lỗi/retry, reconnect giữa hướng dẫn; đảm bảo nút đúng mở, nút sai không tiến bước, không trừ tiền hai lần, global clock không dừng, timer năm hai bắt đầu đúng lúc. Kiểm tra ở 390/768/1440px và iPad ngang, bubble/frame không che target hoặc Sang năm, sáu thẻ được khoanh theo đúng vị trí. Đây là kế hoạch kiểm chứng, chưa phải kết quả đã chạy.
