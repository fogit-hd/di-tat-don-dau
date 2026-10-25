# Bản duyệt: thông số doanh nghiệp, giải trình dòng tiền và chuyển động

**Trạng thái: chỉ thiết kế để duyệt. Chưa sửa code ứng dụng, dữ liệu trận đấu hoặc công thức.**

## Canvas được chọn

1. `01-desktop.png`: nút Thông số trên ảnh và lịch sử tiền có đối soát, bao gồm trường hợp bản ghi cũ đang thiếu giải trình.
2. `02-production.png`: nội dung Sản lượng và cách các hiệu ứng nhân vào công thức.
3. `03-cash-reconciliation.png`: bản ghi mới có đầy đủ sản lượng, doanh thu, chi phí và tiền cuối năm.
4. `04-mobile.png`: trên điện thoại, bảng thông số thay chỗ ảnh, không hiển thị thêm một ảnh lớn phía trên.
5. `05-motion.png`: các trạng thái chuyển động, thời lượng và phản hồi tại chỗ.

Đây là mockup ảnh. Số liệu có nhãn minh họa; không phải dữ liệu được truy xuất từ trận đấu trong ảnh người dùng. HUD, đường đếm thời gian quanh nút Sang năm, giới hạn chữ và cơ chế thao tác hiện hành cần được giữ khi triển khai; tranh không cho phép tự thêm các nút, cấp nâng cấp hoặc số liệu ngoài đặc tả này. Trên màn hình nhỏ ưu tiên chữ và số, giảm trang trí. Tất cả text UI sẽ là text thật để cập nhật, truy cập bàn phím và đọc bằng trình đọc màn hình.

## Vì sao giao diện hiện tại khó hiểu

Đối chiếu code ở thời điểm thiết kế:

- `StatCards.tsx` dùng `scene.output`, là sản phẩm **cộng dồn**. Nó không phải sản lượng của một năm. Backend còn có `lastOutput`, nhưng chưa có bảng giải thích chi tiết cạnh ảnh.
- Nhãn “Sản xuất” trong lịch sử lấy `yearParts.production`: doanh thu − chi phí vận hành − lạm phát. Nó không phải doanh thu gộp, cũng không phải số sản phẩm. Lãi nợ và khoản tiền kéo dài nằm ở các mục khác.
- `lastIncome` dùng ở HUD là tiền từ sản xuất sau lạm phát cộng khoản tiền kéo dài; không phải tổng tiền mặt thay đổi sau đầu tư, lãi nợ và mọi sự kiện.
- Tổng năm ở frontend lấy `cashAfter − cashBefore`, trong khi các mục nhỏ cộng từ danh sách `causes`. Hiện chưa có bước giải trình chênh lệch giữa hai nguồn.
- Đường thưởng câu hỏi đúng trong `answerPrompt` cộng tiền vào state nhưng chưa thêm nguyên nhân thu tiền vào ledger. `resolveChoice` cũng chưa ghi đầy đủ tiền đổi do lựa chọn vào nguyên nhân thu chi. Sự kiện chung áp lên đội khác trả về một nguyên nhân nhưng đoạn gọi chưa đưa nguyên nhân đó vào ledger của đội nhận. Đây là các đường có thể gây chênh, chưa phải kết luận về đúng trận trong screenshot.

Theo các số đang thấy trong ảnh Năm 5: `20,04 − 70,03 = −49,99 triệu`, khác tổng `+384,01 triệu` một khoản khoảng **+434 triệu**. Không được tự gán khoản này cho thưởng, doanh thu hoặc một sự kiện cụ thể khi chưa có bản ghi trận. Canvas desktop minh họa cảnh báo này; cảnh báo không phải một nguồn thu mới.

## Nút Thông số và phân vai với tab Doanh nghiệp

- Nút nhỏ, có icon báo cáo/kính lúp và chữ **Thông số**, nằm trong góc trên trái khung ảnh. Vùng chạm ít nhất 44px; giữ viền khung đứng yên.
- Bấm sẽ chuyển **ảnh ↔ bảng thông số ngay tại khung đó**, có nút **Về ảnh**, không mở popup che gameplay. Trên desktop nhiều thông tin thì chia bằng tab con, không nhét hết vào ảnh. Trên điện thoại dành vùng thông số rõ ràng thay cho ảnh; không giữ cả ảnh lẫn bảng thành hai section chồng dài. Khi vùng quá thấp, ưu tiên kết quả và nút “Chi tiết”, không ép chữ xuống dưới 12px.
- Tab **Doanh nghiệp**: “Đang sở hữu gì?” — kỹ sư, máy, cấp công nghệ/phụ trợ/hạ tầng, tổng sản phẩm, đặc tính và ô nhiễm.
- Bảng **Thông số vận hành**: “Những thứ đang sở hữu tạo ra kết quả thế nào?” — máy thực chạy, thiếu người, phép nhân sản lượng, hiệu ứng đang áp dụng, lượng bán được, giá bán, chi phí, dự báo có điều kiện. Không lặp lại cả sáu ô thống kê.
- Lịch sử **Thay đổi từng năm**: “Năm đã chốt tiền đổi vì những khoản nào?” — dùng dữ liệu tại thời điểm chốt, không dùng doanh nghiệp hiện tại để tính lại năm cũ.

### Tab con Sản lượng

1. Máy chạy = nhỏ hơn giữa số máy sở hữu và số kỹ sư / định mức kỹ sư mỗi máy. Hiện số máy nhàn và số người còn thiếu.
2. Sản lượng nền = máy chạy × năng suất gốc × hệ số công nghệ. Hệ số công nghệ dùng mức tích lũy cho kỳ sản xuất, đúng như engine.
3. Nhân từng hiệu ứng sản lượng đang có hiệu lực. Ví dụ −10% là ×0,90. Hai hiệu ứng −10% và −20% là ×0,90×0,80 = ×0,72, tức giảm tổng 28%.
4. Hiện khoảng dao động sản xuất từ cấu hình thực. Mặc định hiện tại là 97%–103%; không mã hóa cố định con số vào UI nếu cấu hình thay đổi.
5. Hiện riêng **Tạo ra**, **Bán được**, **Cộng dồn**; không dùng chung nhãn “Sản phẩm”. Lượng bán = tạo ra × tỷ lệ giao/bán của hạ tầng. Mô hình hiện không có tồn kho tích lũy.
6. Dự báo luôn ghi “Giữ nguyên đầu tư, hiệu ứng đã biết; chưa tính sự kiện mới”. Khi có mua/sự kiện áp dụng, cập nhật và đánh dấu chỉ số vừa đổi.

### Tab con Thu–chi

- Giá gốc mỗi đơn vị, khoảng dao động giá, từng hệ số giá bán và phần phạt giá do ô nhiễm.
- Doanh thu = lượng bán × giá thực tế × hệ số doanh thu. Hiệu ứng −% doanh thu khác −% sản lượng và phải có nhãn đúng.
- Chi phí: nguyên liệu (có giảm từ phụ trợ), logistics (có giảm từ hạ tầng), phần khác, máy nhàn; hệ số sự kiện tăng/giảm chi phí được chỉ rõ.
- Lãi/lỗ sản xuất = doanh thu − chi phí vận hành. Sau đó mới đến lạm phát, lãi nợ và tiền hỗ trợ/chi hằng năm. Không gộp tất cả vào một chữ “Sản xuất”.
- Với dự báo, chỉ hiện tổng tiền mặt dự kiến nếu tính đủ các khoản đã biết; nếu chỉ hiện biên sản xuất phải ghi rõ phần nào chưa tính. Dự báo min/max là khoảng có điều kiện, không phải cam kết hay khoảng tin cậy thống kê.
- Các chỉ số nâng cao như khấu hao tình trạng máy, phụ thuộc công nghệ và định giá tài sản ở mục Chi tiết, không chen vào kết quả sản xuất chính. Tình trạng máy hiện ảnh hưởng định giá; không tự bịa thêm giảm sản lượng vì mòn máy.

### Tab con Tác động

Mỗi hiệu ứng có tên, icon, năm nhận, trạng thái, thời hạn và trường đích: sản lượng / giá bán / doanh thu / chi phí / giá mua / tiền mặt / tài sản / nhân lực / máy. Chỉ hiện các trường thực sự bị tác động.

- Chưa áp dụng: “Áp dụng từ năm kế tiếp · kéo dài N năm”.
- Đang có hiệu lực: “Còn N năm · đã tính vào dự báo”.
- Đổi chỉ số/cộng trừ tiền ngay: “Đã áp dụng năm N”, số trước → sau và tiền thực tế nếu có.
- Giá đầu tư −10%: hiển thị giá gốc → giá thanh toán trong receipt mua; không tạo thêm một dòng thu tiền riêng. Quy mô gói nâng cấp vẫn tính theo giá trị gốc.
- Giảm sản lượng/giá/doanh thu đã phản ánh trong sản xuất: không trừ thêm số tiền giả định tương đương ở sổ tiền. Có thể cho xem so sánh “nếu không có hiệu ứng”, nhưng phải ghi rõ đó là so sánh giả định, không phải một giao dịch tiền.
- Tử vong/kế nghiệp: liên kết tới tab Rủi ro cho cơ chế đặc biệt; không tính thành hệ số sản xuất thông thường.

## Sổ tiền năm đã chốt

Thu gọn chỉ hiện năm, tổng biến động **có nhãn Tiền mặt**, số khoản và trạng thái đối soát. Mở một năm sẽ có:

1. Tiền mặt đầu năm.
2. Lãi sản xuất, có thể mở để xem sản lượng → lượng bán → giá → doanh thu → từng chi phí.
3. Đầu tư thực chi, gộp tên nhưng mở được từng giao dịch, số gói, giá gốc, ưu đãi, hiệu quả đã bốc.
4. Sự kiện đổi tiền ngay; thưởng câu hỏi/lựa chọn nếu có; khoản kéo dài; lạm phát; lãi nợ; bảo hiểm. Khoản bằng 0 không làm thành dòng chi/thu giả.
5. Tiền cuối năm và kiểm tra: đầu kỳ + tổng biến động thực tế = cuối kỳ.
6. Tác động không đổi tiền ngay ở một nhóm riêng, có liên kết tới bước sản xuất đã dùng hệ số đó.
7. Giá trị công ty mở riêng: tiền mặt + định giá nguồn lực/máy/nâng cấp/thương hiệu − các khoản giảm định giá. Biến động định giá không tự trở thành tiền mặt.

Khi thiếu giải trình, hiển thị phần chênh lệch có cảnh báo, không bù bằng một khoản thu/chi vô danh để tạo dấu xanh. Khi dữ liệu đầy đủ, dấu xanh chỉ xuất hiện sau kiểm tra trên số gốc, với dung sai làm tròn tiền nhỏ. Tiền tính bằng giá trị nội bộ đầy đủ; chỉ làm tròn khi hiển thị. Có thể mở số chính xác hơn để giải thích chênh do làm tròn.

**Năm cũ:** schema hiện mới giữ số dư và nguyên nhân tổng hợp; không giữ đủ hệ số RNG, đầu vào sản xuất và chi tiết chi phí từng năm. Phải ghi “Không có đủ dữ liệu chi tiết của năm này”. Với mục Sản xuất cũ đã chứa lạm phát, giữ nhãn chỉ rõ “đã trừ lạm phát”, không tách ra bằng cách đoán. Không suy ngược bằng trạng thái hiện tại hoặc bốc lại số random.

## Các ví dụ đã đối chiếu với hàm tính hiện tại

Ví dụ minh họa: 2.800 kỹ sư, 2 máy; định mức 1.400 người/máy; năng suất gốc 10 lô/máy; công nghệ đầu kỳ 0,35; các hệ số cơ sở đang seed; chưa có phụ trợ/hạ tầng/công nghệ sạch. Mưa làm sản lượng ×0,90. Các số dưới đây đã chạy bằng `productionPlan`, không phải số tự sinh trong ảnh.

- Hệ số công nghệ kỳ này 1,0696.
- Nền 21,392 lô; sau mưa 19,2528 lô.
- Dao động 97%–103%: tạo ra 18,675216–19,830384 lô → hiển thị **18,68–19,83**.
- Bán được 90%: 16,8076944–17,8473456 lô → **16,81–17,85**.
- Có thêm dao động giá 98%–102%: doanh thu **270,13–298,55 triệu**, biên sản xuất **171,73–200,15 triệu**. Không gồm lạm phát, lãi nợ, sự kiện mới và các khoản cộng/trừ tiền ngoài sản xuất.
- Nếu bốc sản lượng và giá đều 100%: doanh thu 284,171328 triệu; chi phí 98,40 triệu gồm 63,96 nguyên liệu + 19,68 logistics + 14,76 khác + 0 máy nhàn; lãi sản xuất 185,771328 triệu.
- Receipt minh họa: đầu kỳ 719,39; lạm phát đã bốc 1% trên tiền dương = 7,1939; hỗ trợ năm +50; sự kiện trực tiếp −70,03 → biến động +158,547428 và cuối kỳ 877,937428 triệu. Làm tròn hiển thị **+158,55** và **877,94**.

Khoản hỗ trợ +50 và sự kiện −70,03 là dữ liệu tình huống minh họa, không phải khẳng định một sự kiện cụ thể trong trận của người dùng đã phát sinh khoản đó. Con số ở header +384,01 / thiếu +434 của canvas desktop là trường hợp bản ghi cũ chưa khớp, khác với receipt đầy đủ Năm 6.

## Đặc tả chuyển động

| Thao tác | Chuyển động | Điều kiện/UX |
|---|---|---|
| Ảnh ↔ Thông số | 220ms, lật nhẹ/đổi mặt trong khung; mờ nối, không quay cả màn hình | Viền ngoài đứng yên, giữ vùng chạm; bấm Về ảnh quay lại. Trên máy chậm dùng fade đơn giản. |
| Tab chính và tab con | 160ms đổi màu nút, nội dung mờ nối và dịch 6px | Tất cả tab luôn nhìn thấy, 3+2 khi cần để chữ một dòng. Focus bàn phím rõ; không trượt ngang để lộ tab. |
| Sự kiện đến | 240ms, dòng dịch 8px, một lần nét vàng chạy viền | Badge Mới và bộ đếm chưa xem còn lại tới khi được xem; không tự biến mất chỉ vì animation xong. Không popup/toast. |
| Sự kiện hết hiệu lực | 180ms, mờ nhẹ, nhãn Hết hiệu lực rồi khép khoảng trống | Bản ghi vẫn ở Lịch sử; dòng hết không còn ghi Còn 2 năm. Không đổi nhầm số năm theo giây. |
| Bấm mua | Nút lún 2px ngay; trạng thái đang gửi rõ | Chưa sửa số tiền/chỉ số trước phản hồi máy chủ. Request lỗi giữ giá trị cũ, lỗi gắn tại mục mua. |
| Nâng cấp thành công | 320ms, viền mục phản hồi một lần, hiện delta tại mục; đếm số ngắn | Hiện đúng delta server đã xác nhận, không giả +650 cho mọi gói. Hiệu ứng mới thay thế hiệu ứng cũ khi mua nhanh, không xếp hàng chặn thao tác. |
| Chốt năm | 400ms, biểu tượng sản phẩm → tiền → receipt và số đã chốt | Xử lý game/lock hiện hành giữ nguyên. Animation đi sau kết quả, không kéo dài khóa và không dừng countdown. Đặt nút Sang năm luôn truy cập được. |
| Mở giải trình năm | 180ms mở/khép vùng và đổi chevron | Giữ vị trí đọc, không kéo viewport đột ngột; không ép mở mọi năm. |

Sự kiện bốc và hết rất nhanh vẫn được ghi vào lịch sử với đánh dấu chưa xem; người chơi tốc độ cao không bị buộc dừng. Cập nhật đồng hồ/socket lặp không được chạy lại animation; chỉ chạy theo thay đổi thực có định danh. Khi tải lần đầu không làm tất cả sự kiện cũ “bay vào”.

`prefers-reduced-motion`: bỏ lật, dịch và đếm chạy; cập nhật tức thì hoặc fade rất ngắn, giữ nhãn/màu/focus. Không thông báo live từng frame đếm số; chỉ công bố kết quả cuối. Không rung, không nhấp nháy nhanh, không mưa đồng xu, không tooltip chỉ dùng hover. Thông tin quan trọng đọc được bằng chạm và bàn phím.

## Phần cần làm sau khi được duyệt — chưa thực hiện

1. Ghi đủ nguyên nhân mọi lần đổi tiền, đặc biệt thưởng/lựa chọn và sự kiện chung; chống ghi hai lần. Giữ số dư và thứ tự để đối soát.
2. Lưu snapshot giải trình tại lúc chốt: máy chạy, công nghệ, hệ số RNG thực đã bốc, hiệu ứng, lượng tạo/bán, giá, chi phí, lạm phát/lãi nợ và các khoản khác. Không đổi công thức game chỉ để khớp tranh.
3. Dự báo dùng cùng hàm engine, lấy min/max theo cấu hình/hệ số đã biết; không làm lộ kết quả RNG tương lai hoặc cho refresh bốc lại.
4. Xây nút/bảng thông số, lịch sử mới và chuyển động theo các trạng thái đã duyệt. Giữ handler, dữ liệu và hiệu ứng đã áp dụng ổn định khi chuyển tab.
5. Kiểm tra 390/768/1440px, dữ liệu dài/nhiều sự kiện, mua/chốt liên tục, request lỗi, reconnect, giảm chuyển động và đối soát mọi dòng tiền. Năm cũ thiếu snapshot phải có fallback trung thực.

Lượt này chỉ đọc nguồn, đối chiếu công thức bằng lệnh không lưu code và tạo các PNG/Markdown thiết kế. Chưa build lại app hoặc deploy vì chưa triển khai.
