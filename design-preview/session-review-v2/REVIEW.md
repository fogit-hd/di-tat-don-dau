# Bản duyệt giao diện và chuyển động — 27/10/2026

> Cập nhật: người dùng đã chốt và yêu cầu code. Đã triển khai; xem `docs/approved-session-v2.md` để biết trạng thái và báo cáo kiểm chứng cuối. Phần mô tả bên dưới giữ làm hồ sơ thiết kế.

Trạng thái: **chỉ thiết kế để duyệt**. Không thay đổi mã ứng dụng, CSS đang chạy, API, dữ liệu hay công thức game trong lượt này. Số liệu và tên trên canvas chỉ minh họa bố cục. Avatar thực tế vẫn dùng ảnh vẽ tay nguyên khối đã chọn. Logo thực tế giữ nguyên asset hiện có; không thay theo các biến thể logo mà mô hình có thể vẽ trong bản nháp.

Cập nhật theo phản hồi mới: người dùng đã xác nhận các canvas còn lại ổn. Giữ các thiết kế bảng hạng realtime có cột Trạng thái, tổng kết host/cá nhân, tab Dòng tiền/Sự kiện và hệ khung SVG. Tiêu đề tạo phòng được sửa thành căn giữa trong `07-create-centered.png`. Bổ sung màn Đang vào phòng và hướng dẫn năm đầu chi tiết trong `08`–`11`; đặc tả tại `GUIDE-REVIEW.md`. Không yêu cầu duyệt lại các canvas đã chốt.

## Phân tách màn hình

| Màn | Hiển thị |
| --- | --- |
| Host trong trận | Bảng thường từ hạng 1 trở đi, các hàng đồng đều; không có bục top 3 |
| Host hết trận | Công bố 3 → 2 → 1, bục theo vị trí 2–1–3; bảng phía dưới bắt đầu từ hạng 4 |
| CEO hết trận | Chỉ avatar, hạng và kết quả cá nhân; không có bục hoặc bảng tên CEO khác |

Canvas 01 được chỉnh theo phản hồi mới: dùng `01-host-live-status-v2.png`, bảng realtime rộng hết nội dung, các cột **Hạng / CEO · Ngành / Giá trị / Năm / Trạng thái**. Bỏ chữ “Đang cập nhật”, cột “Biến động” và toàn bộ panel “Đang xem CEO”. `01-host-live.png` chỉ giữ làm lịch sử bản nháp, không còn là thiết kế được đề xuất. Canvas 02: host tổng kết; cột ba hình nhỏ bên phải là **storyboard giải thích chuyển động để duyệt**, không phải một panel sẽ đặt trong sản phẩm. Canvas 03: form tạo phòng gọn. Canvas 04: tổng kết cá nhân desktop/mobile. Canvas 05: hai trạng thái tab Dòng tiền/Sự kiện, không phải hai tab mở đồng thời. Canvas 06 và bộ SVG: hệ khung nhập liệu dùng chung.

### Cột trạng thái realtime

| Nhãn hiển thị | Ý nghĩa |
| --- | --- |
| Đang điều hành | CEO còn vận hành doanh nghiệp |
| Đã chuyển giao | Đã chốt hành trình do chuyển giao quyền điều hành |
| Đã chuyển kiếp | Nhãn theo yêu cầu mới cho sự kiện qua đời; hành trình kết thúc, không có hồi sinh |
| Đã nghỉ hưu | Hành trình kết thúc do nghỉ hưu |
| Chờ tái cơ cấu | Phá sản khi chuyển giao và còn đủ điều kiện nhận hỗ trợ để tiếp tục |
| Đã phá sản | Phá sản và không còn khả năng tiếp tục theo luật hiện tại |
| Đã chốt kết quả | Kết thúc vì nguyên nhân khác hoặc trận đã chốt, khi không có trạng thái cụ thể hơn |

Trạng thái được lấy từ nguyên nhân và trạng thái gameplay thực tế, độc lập với thứ hạng và tình trạng kết nối. Không suy ra từ giá trị tài sản, vị trí bảng hoặc riêng `succession.outcome`: sự kiện qua đời và người kế nghiệp giữ nguyên tài sản có thể cùng mang outcome `steady`. Khi triển khai cần gửi mã trạng thái rõ ràng cho host từ máy chủ, không phân loại mơ hồ bằng câu chữ. Trạng thái kết thúc cụ thể được ưu tiên hơn nhãn chung; doanh nghiệp nhận hỗ trợ và vận hành lại phải trở về “Đang điều hành”.

Badge nhỏ có chữ và biểu tượng, màu xanh/gold/tím xám/đỏ trầm; không dùng màu đơn độc. Cột trạng thái không thay đổi khi chỉ tăng/giảm hạng. Tên dài có vùng riêng, trạng thái và tiền không bị đẩy lệch. Không thêm panel chi tiết hoặc popup thay thế panel đã bỏ. Tab “Từng CEO” ở tổng kết host vẫn thuộc canvas 02, không bị bỏ trong lần chỉnh này.

## Animation dự kiến: đua hạng trên host

- Lần nhận bảng đầu tiên: các hàng hiện nhẹ 180–220ms, không báo tăng/giảm vì chưa có hạng trước đó.
- Khi snapshot làm đổi thứ hạng: giữ định danh bằng ID CEO, lấy vị trí trước/sau rồi di chuyển nguyên hàng theo kỹ thuật FLIP với Web Animations API. Khoảng 480–600ms, giảm tốc cuối nhịp. Avatar là ảnh tĩnh, không ghép khớp hay biến dạng nhân vật.
- Hàng tăng trượt lên, nằm trên lớp chuyển động của hàng bị vượt; các hàng bị đẩy trượt xuống cùng nhịp. Hàng giảm tự trượt xuống, không biến mất rồi xuất hiện ở chỗ mới. Không đổi chiều cao hàng khi chạy animation.
- Tăng hạng: đường viền xanh nhấn 900ms. Giảm hạng: màu hổ phách/đỏ dịu. Giữ chuyển động lên/xuống của nguyên hàng, nhưng không hiện cột, mũi tên hoặc con số biến động. Hiệu ứng dịu lại sau khoảng 1,8 giây. Trình đọc màn hình có thể được thông báo ngắn về hạng trước/sau mà không thêm cột hiển thị.
- Giá trị tài sản chuyển số trong khoảng 300ms; giá trị đích luôn là snapshot thực tế. Rank/tie-break luôn theo máy chủ; không tự sắp xếp hoặc bốc thêm kết quả để làm hiệu ứng.
- Nhiều cập nhật liên tiếp: animation đang chạy được nối từ vị trí hiện tại tới snapshot mới nhất; không xếp hàng phát lại các hạng cũ. Chuyển tab trình duyệt rồi quay lại phải hiển thị ngay dữ liệu mới nhất.
- ID CEO được giữ ổn định khi đổi hàng; không còn trạng thái chọn CEO hoặc panel “Đang xem CEO” trên màn realtime. Nếu có rất nhiều CEO, giữ bảng có header rõ và cuộn danh sách có chủ đích; không thu nhỏ chữ vô hạn chỉ để nhét tất cả trong một màn.

## Animation dự kiến: công bố kết quả host

Chỉ bắt đầu sau khi máy chủ chốt trận và có kết quả cuối. Không chạy trong lobby, countdown hoặc lúc đang chơi.

| Thời điểm | Chuyển động |
| --- | --- |
| 0–0,3s | Chuyển bảng realtime sang sân khấu tổng kết, nền dịu nhẹ; chưa lộ người thắng |
| 0,3–1,1s | Hạng 3 bên phải hiện: avatar + bục cùng trượt lên khoảng 28px và tăng opacity; huy chương hiện sau 100ms |
| 1,4–2,2s | Hạng 2 bên trái xuất hiện tương tự, giữ nguyên hạng 3 |
| 2,6–3,6s | Hạng 1 ở giữa xuất hiện; bục cao hơn, huy chương nhấn một nhịp, hạt giấy vàng ít và chỉ rơi một lượt |
| 3,8–4,2s | Các hàng từ hạng 4 hiện theo nhóm; màn trở thành bảng kết quả có thể thao tác bình thường |

Tên, giá trị và huy chương đi cùng đúng CEO; không đổi kích thước nhân vật trong quá trình chuyển. Tên tối đa hai dòng trong bục, vùng số tiền riêng; tên đầy đủ có trong chi tiết CEO. Không phát lại lễ công bố khi chuyển tab tổng kết hay nhận lại cùng snapshot. Nếu vào lại phòng đã tổng kết trước đó thì hiện kết quả hoàn chỉnh. Chỉ một CEO: chỉ công bố hạng 1; hai CEO: công bố 2 rồi 1; không tạo người thắng giả cho vị trí trống. Với tùy chọn giảm chuyển động của hệ điều hành, giữ thứ tự công bố nhưng chỉ đổi opacity ngắn, bỏ trượt và hạt giấy.

## Animation dự kiến: tổng kết cá nhân

Avatar cá nhân và bảng giấy hiện 220–300ms. Huy hiệu thứ hạng cá nhân hiện sau khoảng 200ms, số giá trị cuối chuyển một lượt ngắn rồi đứng yên. Người chơi chỉ biết hạng của mình, số CEO trong phòng, số năm, số câu đúng và kết thúc thực tế của mình. Không dựng top 3 ở bất kỳ tab cá nhân nào. Kết thúc sớm khi trận chưa chốt vẫn ghi **Hạng tạm thời**, không giả làm hạng cuối.

## Form, khung SVG và chữ tiếng Việt

- Form tạo phòng: nav khoảng 72px, form khoảng 680–740px rộng, một dòng tên chủ phòng, một hàng hai cột thời lượng/vốn, nhóm nâng cao gọn hai cột, nút Mở phòng/Đóng luôn nằm trong form. Mục tiêu laptop 1366×768 ở zoom 100%: thấy trọn form khi không có thông báo lỗi dài. Không ép `overflow:hidden` để giấu nội dung; khi zoom lớn, bàn phím ảo hoặc chiều cao thấp vẫn cho cuộn tự nhiên.
- Không thêm trường cấu hình mới, không đưa lại giá nâng cấp toàn phòng, không thay giá trị mặc định hoặc handler.
- Khung ô nhập/chọn là asset SVG riêng, không lấy khung card lớn thu nhỏ. Có biến thể giấy và đỏ rượu; thường/focus/lỗi/disabled. Góc trang trí cố định bằng nine-slice, vùng giữa giãn theo chiều rộng, không méo góc. Icon/chữ không được vẽ liền vào asset khung.
- Nền giấy dùng màu cát ấm thay ô trắng; nền đỏ dùng đỏ rượu tối và chữ kem. Focus là nét viền rõ, không glow. Input tối thiểu 44px, chữ 16px trên mobile; khoảng trống trên/dưới dấu tiếng Việt đủ rộng.
- Áp dụng cùng hệ khung cho tạo phòng, nhập mã/tên CEO, chọn lọc ở lobby/tổng kết và ô tìm kiếm/chọn lọc Wiki. Không thêm tìm kiếm ngành vào form tạo phòng.
- Chữ tĩnh giữ SVG lettering; nội dung người dùng nhập vẫn là input thực để hỗ trợ IME, caret, chọn/copy và bàn phím. Cần rà Unicode NFC, font nhập liệu có đủ tiếng Việt, line-height/padding và fallback font. Không tách dấu thành phần tử riêng; không chuẩn hóa giữa phiên IME khiến con trỏ nhảy. Chưa kết luận duy nhất một nguyên nhân font từ ảnh.

## Hai lỗi cuối và cách bố trí lại

Qua đọc mã: `PlayerResults` dùng `YearLedger` và `EventCardList`, trong khi kích thước `.painted-icon`, `.disclosure-arrow` và bố cục hàng phần lớn chỉ được khai báo dưới `.gameplay.game-shell`. Khi đưa sang tổng kết, các giới hạn đó không đi cùng, làm SVG tiền và mũi tên phóng lớn, hàng sự kiện trở về kiểu nút mặc định. Sẽ cần style riêng phạm vi tổng kết, không sửa toàn bộ gameplay để chữa lỗi này.

- Dòng tiền: icon đầu mục 32–36px, icon dòng 24–28px, chevron 16px. Mỗi năm là một hàng đóng/mở; khi mở thấy số dư đầu, các khoản cộng/trừ, số dư cuối. Không có ảnh tiền khổng lồ. Số liệu lấy từ ledger thật, kiểm tra tổng khoản bằng chênh lệch số dư.
- Sự kiện: hàng ngang toàn chiều rộng gồm icon 40–48px, tên/effect, năm và chevron 16px. Nội dung mở nằm dưới hàng theo cùng khung, không có nền button xám mặc định hoặc tam giác khổng lồ. Effect lấy từ dữ liệu đã random của trận; không dùng các phần trăm minh họa trên canvas làm hằng số.

## Kiểm chứng sau khi được duyệt

Đối chiếu canvas và browser ở 390, 768, 1366×768 và 1440×900. Kiểm tra tên CEO 24 ký tự gồm chuỗi không có khoảng trắng, thứ hạng đảo nhiều hàng liên tục, hòa điểm, 0/1/2/nhiều CEO, reconnect, giảm chuyển động, focus/IME tiếng Việt, mở tất cả tab tổng kết và Wiki, icon không vượt kích thước, không tràn ngang. Chạy build/lint và test phù hợp. **Chưa chạy các kiểm chứng triển khai này vì lượt hiện tại chỉ tạo bản duyệt.**
