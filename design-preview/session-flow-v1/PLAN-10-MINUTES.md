# Đề xuất nhịp 10 phút và nhân vật hướng dẫn 2D

Trạng thái: kế hoạch chờ duyệt. Chỉ phần bỏ cấu hình giá toàn phòng đã được áp dụng.

## 1. Vấn đề hiện tại, kiểm tra từ nguồn

- StartScreen/HostScreen mặc định 15 phút, 60 giây/năm, khóa nút 5 giây.
- backend/prisma/seed/balance.ts: questionOpenMs = 50.000, questionResolvedMs = 25.000.
- backend/src/runtime.ts presentYearQuestion: hỏi sau mỗi advanceYear nếu còn chơi, và pauseYearForPrompt dừng đồng hồ năm riêng. Đồng hồ phòng vẫn chạy.
- Năm của mỗi đội chạy độc lập; bấm nhanh có thể tạo thêm lượt sản xuất. Chỉ rút ngắn thời gian phòng không xử lý được chênh lệch này.
- backend/src/game/succession.ts deathStartYear lấy floor(durationSec/cycleSeconds). Đổi chu kỳ mà không tách mốc rủi ro sẽ làm mốc này thay đổi ngoài ý muốn.
- TopBar hiện hiển thị scene.cycles nên đội mới có Năm 0. Thiết kế hướng dẫn mới cần phân biệt “năm đang chơi” với “số năm đã chốt”; không tự sửa cycles để làm đẹp nhãn.

## 2. Timeline đề xuất

Tính từ lúc host bấm Bắt đầu; thời gian đăng nhập, tạo phòng và chờ các đội vào không tính vì phụ thuộc người dùng.

| Mốc | Nội dung |
|---|---|
| 0:00–0:03 | Đếm ngược xuất phát chung |
| 0:03–1:00 | Hướng dẫn thao tác năm 1, tối đa 57 giây theo lịch phòng |
| 1:00–9:00 | 12 vòng × 40 giây, tương ứng năm 2–13 |
| 9:00–10:00 | Chốt kết quả, xem bảng xếp hạng và câu hỏi |
| Sau 10:00 | Báo cáo vẫn xem được; không bắt buộc thảo luận xong hay tự đóng trang |

57 giây là ngân sách mục tiêu của hướng dẫn, không phải bảo đảm mọi người sẽ bấm xong. Không tự mua hộ, không ép hoàn thành giả. Đội chậm vẫn được nhân vật hướng dẫn bước còn thiếu; đồng hồ phòng không bị một đội giữ lại. Đội chưa đủ điều kiện vận hành không nhận sản phẩm giả để bù. Nếu host chọn gia hạn/tạm dừng, thời gian thực tế sẽ vượt 10 phút và cần thể hiện rõ. Cần thử với người mới trước khi chốt ngân sách này.

Chế độ 10 phút là mode riêng. Chưa thay mặc định 60 giây hoặc hành vi các phòng cũ trong đợt canvas.

## 3. Luật vòng chung, tránh thắng bằng spam Sang năm

- Máy chủ có mode, phase, roundId, roundStartsAt, roundEndsAt. Một đội chỉ được quyết toán một lần mỗi roundId.
- Vẫn giữ nút Sang năm. Sau thao tác xác nhận, đội chuyển sang trạng thái đã chốt vòng này; không mở thêm năm để thu lợi nhuận lần nữa.
- Chốt sớm không bỏ qua vòng chung. Các hiệu ứng kết thúc vòng và sản xuất xử lý tại cùng mốc server cho mọi đội.
- Chỉ khóa đầu tư khi đội đã xác nhận chốt vòng; trước đó có thể đầu tư/trả lời. Phải nói rõ trạng thái để không mất quyền thao tác bất ngờ.
- Khi hết vòng, server tự quyết toán đội đã qua hướng dẫn; không tự mua/tuyển cho đội. Riêng đội đang được hướng dẫn phải bấm thật Sang năm mới chốt lần đầu, không để auto timer làm hộ bước này. Lần chốt đó chiếm một slot của roundId hiện tại; tới biên vòng không chốt thêm lần nữa.
- roundId của phòng và số năm đã chốt của đội là hai giá trị khác nhau. Đội chậm còn ở năm 1 có thể hoàn tất sau mốc 1:00 rồi bước vào năm 2 theo tiến trình cá nhân, nhưng không được bù tiền cho các mốc đã bỏ lỡ. Đây là đánh đổi của lịch 10 phút cố định; nếu muốn không phạt tốc độ học, host cần gia hạn hướng dẫn trước khi tiếp tục lịch chung.
- Tải lại/tab nền/reconnect không thêm vòng, không reset lời thoại hay mua lặp. Không dùng setInterval của từng trình duyệt làm nguồn thời gian.
- Nhãn HUD mới: năm đang chơi = số vòng đã hoàn thành + 1; kết quả/lịch sử vẫn giữ số năm đã quyết toán. Audit toàn bộ nhãn năm và thời hạn hiệu ứng trước áp dụng để tránh lệch một năm.
- Vòng hướng dẫn bảo vệ thao tác khỏi câu hỏi/biến cố kết thúc sớm. Kết thúc hướng dẫn tại xác nhận chuyển sang năm 2, không bắt xem lịch sử.

## 4. Câu hỏi trong 10 phút

- Bốn mốc đề xuất: năm 3, 6, 9, 12; không hỏi sau mọi năm.
- Mỗi câu có ngân sách tối đa 20 giây nằm trong vòng 40 giây, không cộng thêm 50 + 25 giây.
- Trả lời sớm hiện kết quả ngắn 2–3 giây rồi trả quyền thao tác; không chặn cả màn 25 giây.
- Câu hết hạn được đóng đúng một lần. Không đè câu mới lên câu cũ; chỉ một pending question/đội/round.
- Cùng mốc và cùng độ khó/chủ đề tương đương; không bắt mọi đội trả lời chung một câu trên máy chiếu.
- Thưởng lấy quy mô kinh tế v3 và kiểm tra lại bằng mô phỏng; không tự tăng thưởng chỉ vì game ngắn.
- Nếu 20 giây không đủ cho prompt dài, ưu tiên rút gọn câu hỏi trong bộ mode hoặc giảm số câu, không âm thầm cắt thời gian đọc của người chơi cần hỗ trợ.
- Host xem thống kê theo lượt đúng/tổng lượt, không tự coi lượt là đội duy nhất.

## 5. Sự kiện và cân bằng

- Bốc sự kiện theo vòng server, không theo số lần người chơi bấm.
- Tối đa một sự kiện kinh tế mới/đội/vòng là cấu hình thử ban đầu; sự kiện chung lớp chỉ bốc một lần/vòng và kiểm tra ngành phù hợp.
- Cooldown theo root sự kiện để 8 biến thể bối cảnh không lặp cùng nội dung liên tiếp.
- Hạn hiệu ứng tiếp tục tính bằng năm. Không dùng giây cho thời hạn kinh tế.
- Không âm thầm xóa hiệu ứng còn hạn để đạt giới hạn số thẻ. Gộp cách trình bày khi nhiều hiệu ứng.
- Giữ ngẫu nhiên kết quả, các % tác động ngẫu nhiên là số nguyên; giữ luật tăng tử vong 0,2 điểm %/năm và kế nghiệp 0,25 điểm %/năm.
- Đề xuất mốc tăng rủi ro riêng cho mode ở năm 10 thay vì duration/cycle. Không ép một người phải chết hoặc chuyển giao để “đủ cốt truyện”; hết giờ vẫn chốt doanh nghiệp bình thường.
- Bảo vệ giai đoạn hướng dẫn khỏi kết thúc sớm là chính sách mode mới cần duyệt, không đổi nghĩa tử vong. Tử vong vẫn kết thúc; tái cơ cấu chỉ đúng nhánh phá sản có hỗ trợ đã được chấp thuận.
- Các lỗi đã audit phải xử lý trước cân bằng mode: quà tiền khi chưa sản xuất, event mô tả nhưng không có tác động, fractional machinesAdd, ngữ nghĩa good/bad, hiệu ứng bị cắt khi quá 12, sự kiện ngành áp sang đội không phù hợp.
- Không đổi đồng loạt giá ngành hoặc công thức thu nhập trong đợt thiết kế này. Mô phỏng 64 ngành trước khi quyết định vốn, giá, tiền thưởng.
- Kiểm tra hoàn vốn của 1 cụm + tổ đủ người, các chiến lược mở rộng/chất lượng/phụ trợ/công nghệ sạch, chứ không cân bằng theo giá một nút đơn lẻ.

## 6. Hướng dẫn tại chỗ — yêu cầu đã chốt

**Nhân vật 2D xuất hiện ngay trên gameplay. Không làm trang hướng dẫn riêng. Chỉ vào nút thật và yêu cầu bấm thật. Kết thúc khi bấm Sang năm thành công để vào năm 2.**

| Bước | Nhân vật nói / chỉ | Điều kiện đi tiếp |
|---|---|---|
| 1 | “Mình sẽ giúp bạn vận hành năm đầu. Bấm Đầu tư.” | Tab Đầu tư được bấm và mở |
| 2 | “Mở một cụm để bắt đầu sản xuất.” | API mua thành công, có ít nhất 1 cụm |
| 3 | “Cụm này cần N người. Tuyển đủ tổ nhé.” | Báo giá ngành được chấp thuận, đủ người cho một cụm |
| 4 | “Đã đủ người. Xem Doanh nghiệp để biết bạn đang có gì.” | Mở tab Doanh nghiệp, thấy số cụm hoạt động và dự kiến sản phẩm |
| 5 | “Bấm Sang năm để hoàn thành năm 1.” | Server xác nhận quyết toán lần đầu, UI bước vào năm 2 |
| Hoàn tất | Nhân vật gật/vẫy tay, “Bạn đã sẵn sàng!” | Lời thoại tự rút, không thêm thao tác bắt buộc |

- Nhập tên trước gameplay vẫn theo flow hiện tại, có bộ đếm ký tự; không đưa thành trang hướng dẫn mới.
- Không yêu cầu mở biên nhận, không nút “Đã hiểu”, không bước thứ 6 sau khi vào năm 2. Người chơi tự xem chi tiết về sau.
- Kiểm tra khả năng mua đủ 1 cụm + tổ theo mọi ngành/quy mô trước bắt đầu. Nếu vốn cấu hình không đủ, báo host trước trận; không tặng tiền âm thầm.
- Nếu người chơi đã làm trước một bước thì nhận biết trạng thái thật và chuyển đến việc còn thiếu, không bắt mua thêm cụm/tuyển dư.
- Định mức, số lượng và giá do server cung cấp, không hardcode 5 người hay 200 triệu cho ngành khác.
- Nếu lời thoại sai vị trí sau resize/scroll, cập nhật anchor theo rect của nút thật; không dùng tọa độ px cố định của canvas.
- Một lời thoại duy nhất. Desktop nhân vật ở vùng trống; mobile thu nhỏ/neo trong vùng ảnh nhà máy, tránh nút dưới cùng. Tất cả tab luôn nhìn thấy, không cuộn ngang.
- Target được focus bàn phím và viền sáng vừa phải. Nền có thể dim nhẹ; không chặn nút đích. Nhân vật/pointer pointer-events:none. Lời thoại đọc được qua screen reader.
- Không cho auto year timer/câu hỏi bỏ qua bước Sang năm của hướng dẫn. Hết ngân sách hướng dẫn thì giữ bước còn thiếu, không tự quyết toán hay đánh dấu hoàn tất. Khi người chơi bấm thành công, ghi nhận slot hiện tại đúng một lần.
- Lưu tutorialStep và tutorialCompleted theo đội/phòng; chỉ cập nhật theo server ack. Mua lỗi, mất mạng, double tap không hoàn thành bước.
- Từ năm 2, không tiếp tục nhân vật chiếm chỗ hay thông báo nổi định kỳ. Hướng dẫn chỉ nằm trong năm đầu.

## 7. Nhân vật 2D có chuyển động — không phải ảnh tĩnh thêm mũi tên

- Người dùng đã chọn 2D. Giữ foreman Việt Nam đội mũ xanh, áo kem, gile xanh, nét gouache vẽ tay như canvas.
- Canvas 08 là các tư thế duyệt; chưa phải sprite sheet hoàn chỉnh, chưa có animation chạy.
- Sau duyệt, tạo asset nhân vật độc lập, tách các bộ phận cần chuyển động hoặc xuất sprite frames đồng nhất. Không cắt nguyên screenshot gameplay làm nhân vật.
- Idle: thở nhẹ ở thân/vai, mắt chớp không đồng bộ cứng 2–3 lần/giây. Chớp mắt cách quãng tự nhiên, không toàn thân nhảy lên xuống.
- Point: vai và khuỷu xoay đưa bàn tay chỉ đúng hướng; giữ tư thế ngắn rồi về idle. Có hướng trái/phải để giảm đường chỉ dài.
- Confirm: đầu thực sự cúi/gật, khóe miệng đổi nhẹ; chạy sau API success, không trước.
- Complete: tay vẫy và nụ cười, rút khỏi màn sau khi vào năm 2.
- Chuyển idle→point→idle có tư thế nối tương thích, không nhảy ngay về frame đầu. Khớp gốc vai/khuỷu/cổ cố định theo thiết kế.
- Web triển khai bằng sprite/canvas hoặc rig 2D nhẹ với asset local; chưa thêm Rive/Spine hay dependency mới. Nếu cần runtime khác, trình bày trước.
- Tạm dừng khi tab ẩn; preload asset trước tutorial; DPR phù hợp, không phóng lớn ảnh nhỏ. prefers-reduced-motion dùng tư thế tĩnh tương ứng và vẫn đủ chỉ dẫn.
- Cần làm một bản motion preview riêng để duyệt độ mượt trước tích hợp production. Không coi ảnh tư thế này là bằng chứng đã có chuyển động.

## 8. Các đợt triển khai sau khi duyệt

1. UI tổng kết + tạo phòng/phòng chờ, tái dùng handlers, data thật, ảnh/icon tách riêng và frame responsive.
2. Asset + motion preview nhân vật 2D; duyệt chuyển động thật.
3. State machine hướng dẫn tại chỗ, đến năm 2, resume/reconnect/keyboard/mobile.
4. Mode vòng chung 10 phút + nhịp câu hỏi + sự kiện theo vòng; giữ chế độ cũ để tránh thay phòng đang chạy.
5. Mô phỏng 64 ngành và chơi thử người mới, rồi hiệu chỉnh vốn/thưởng/nhịp nếu có số liệu.

## 9. Tiêu chí kiểm chứng

### Dữ liệu tổng kết cần nối đúng

- Người chơi có correct/answered và lịch sử của chính đội trong snapshot; không suy đoán số câu từ ảnh.
- Host có bảng xếp hạng và questionStats. team.scene hiện gọi includeHistory=false nên không có yearChanges đầy đủ; không hiển thị tab dòng tiền trống hoặc giả dữ liệu. Nếu mở lịch sử đội cho host cần endpoint đọc có kiểm tra quyền host và dữ liệu được lưu, thực hiện trong đợt triển khai được duyệt.
- Báo cáo đã lưu có số đúng/đã trả lời từng đội; nếu dùng số đó cần lấy từ report đúng phòng. Không mở thêm dữ liệu đội khác cho player.

- 390/768/1440: không tràn ngang, đủ 5 tab, tên dài không đẩy tiền/nút, target44px+.
- Nhân vật/lời thoại không che nút; thao tác đúng mới gật đầu; sai/mạng lỗi không nhảy bước; Sang năm thành công mới hoàn tất ở năm 2.
- Không ép mở lịch sử sau onboarding; không hiện lại sau refresh.
- Hai đội nhanh/chậm có cùng số cơ hội quyết toán trong mode vòng chung; spam không thêm tiền/năm, reconnect không bốc lại RNG.
- Không chồng câu hỏi, không dài hơn deadline vòng, không đóng/mở lặp khi answer tới sát hạn.
- Kết quả sớm: giá trị chốt, hạng tạm. Kết thúc phòng: hạng cuối; không cộng tiền sau khi chốt.
- Câu hỏi/lịch sử/năm/độ dài hiệu ứng không lệch do đổi activeYear.
- Ghi nhận thời gian thực tế hoàn tất tutorial của người mới; không tuyên bố ai cũng xong trong57giây nếu chưa thử.
- Build/lint, test server clocks/round idempotency, UI responsive và chạy thử multi-team trước deploy.

