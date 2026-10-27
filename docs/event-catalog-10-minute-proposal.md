# Đề xuất danh mục sự kiện cho trận 10 phút

Trạng thái: bản thiết kế, chưa thêm các sự kiện dưới đây vào game. Bộ 72 mẫu ban đầu được rút còn **48 mẫu ưu tiên** sau yêu cầu nhịp chơi 10 phút. Không tính việc đổi tên theo 64 ngành hoặc đổi khoảng % thành một cơ chế mới. Một số chủ đề có thể giống danh mục cũ; khi triển khai phải hợp nhất nếu tác động thực sự trùng, thay vì tạo thêm bản sao.

## Nguyên tắc nhịp độ

- Sự kiện tự xử lý tại lượt chốt năm. Không mở thêm chuỗi đối thoại, thương lượng, ký hợp đồng hay chờ người khác xác nhận.
- Quyết định của người chơi tập trung vào đầu tư, bảo dưỡng và xử lý tình trạng doanh nghiệp trong các tab hiện có.
- Thông tin chính chỉ một dòng: **tên sự kiện · được/mất gì · thời hạn**. Chi tiết và công thức để trong Wiki/lịch sử.
- Danh mục lớn tạo khác biệt giữa các trận; không cố cho mỗi CEO gặp hết danh mục trong một trận.
- Mục tiêu thử UX ban đầu: khoảng 6–10 biến cố chính/CEO trong 10 phút. Đây là mục tiêu quan sát khi thử nhịp độ, chưa phải quota hoặc thay đổi xác suất đã code. Số năm chốt thực tế giữa CEO vẫn khác nhau.
- Mỗi lượt chỉ làm nổi bật một sự kiện chính; nếu có nhiều khoản đến cùng lúc, gom thành một nhóm kết quả năm, vẫn giữ từng chứng từ.
- Thời hạn hiệu ứng là 1–2 năm của CEO chịu tác động, có thể khác nhau giữa hai CEO. Không dùng phút/giây cho thời hạn kinh tế.
- % ngẫu nhiên bốc số nguyên, số công nhân/cụm/sản phẩm luôn nguyên. Mức bốc được lưu, không đổi khi mở xem hoặc tải lại.
- Mất cấp hoặc thông số không làm giảm số lần nâng cấp đã mua và không đặt lại giá nâng cấp.

## A. Máy móc và vận hành — 8 mẫu

| Mã | Sự kiện | Điều kiện và tác động tự động |
| --- | --- | --- |
| A01 | Chạy vượt công suất | Đang chạy đủ tổ: tăng sản lượng năm này, hao mòn thêm; sản phẩm vẫn qua kiểm lỗi. |
| A02 | Chế độ vận hành an toàn | Độ bền thấp: giảm tốc độ tạm thời, đồng thời giảm lỗi và hao mòn so với cùng mốc độ bền. |
| A03 | Cân chỉnh đầu ca | Có thiết bị hoạt động: trả phí nhỏ theo quy mô, giảm tỷ lệ hàng lỗi trong năm. |
| A04 | Bảo dưỡng theo lịch hãng | Một phần công suất dừng trong năm; độ bền được phục hồi, không thêm cụm sở hữu. |
| A05 | Phụ tùng tương thích được giảm giá | Giảm hóa đơn bảo dưỡng kế tiếp; không thay đổi lượng độ bền được hồi phục. |
| A06 | Hãng thu hồi linh kiện lỗi | Được hãng sửa và bồi hoàn một phần chi phí sửa đã thực trả; có trần. |
| A07 | Cảnh báo hao mòn sớm | Chỉ khi có công nghệ phù hợp: giảm hao mòn kỳ tới, không hồi độ bền đã mất. |
| A08 | Thiết bị trôi thông số | Chỉ khi độ bền thấp: tăng tỷ lệ hàng lỗi tạm thời; mức cuối có giới hạn để không nhân phạt vô hạn. |

## B. Chất lượng và thị trường — 8 mẫu

| Mã | Sự kiện | Điều kiện và tác động tự động |
| --- | --- | --- |
| B01 | Khách hàng đánh giá chất lượng tốt | Có đủ sản lượng và tỷ lệ lỗi thấp: giá bán được tăng trong kỳ tới. |
| B02 | Khiếu nại chất lượng sau bán | Trả khoản bảo hành theo doanh thu đã bán của kỳ trước; đây là lỗi sau bán, khác hàng lỗi đã bị loại. |
| B03 | Tái chế phế phẩm | Có hàng lỗi và công nghệ sạch: thu hồi một phần giá trị vật liệu, không bán lại như hàng đạt chất lượng. |
| B04 | Kiểm định tăng cường | Phát sinh chi phí kiểm định, đổi lại giảm số hàng lỗi; lợi ích có thể nhỏ nếu máy vốn đã tốt. |
| B05 | Đơn hàng giao gấp | Giá bán cao hơn nhưng có phí vận hành tăng; không tự tạo thêm cụm hoặc công nhân. |
| B06 | Khách nhận thêm hàng đạt chuẩn | Tăng lượng bán trong giới hạn hàng tốt đã sản xuất; không nhân đôi sản lượng. |
| B07 | Khách ưu tiên nhà cung cấp xanh | Chỉ khi ô nhiễm thấp: được giá bán tốt hơn; không tặng tiền nếu chưa bán được hàng. |
| B08 | Sai quy cách đóng gói | Một phần hàng tốt không đạt quy cách giao; giảm lượng bán, sản lượng chế tạo vẫn được ghi đúng. |

## C. Nhân lực và tổ chức — 8 mẫu

| Mã | Sự kiện | Điều kiện và tác động tự động |
| --- | --- | --- |
| C01 | Luân phiên kèm cặp công nhân | Năng suất giảm nhẹ trong năm đào tạo, tay nghề tăng sau đó; không yêu cầu chờ thao tác. |
| C02 | Chương trình học việc có hỗ trợ | Tuyển được 1–3 người với chi phí hỗ trợ; công nhân được bổ sung thực, giá mua tiếp theo không đặt lại. |
| C03 | Tổ vận hành tự chăm sóc máy | Tổ đủ người và tay nghề tốt giúp giảm hao mòn; không khôi phục máy đã dừng ở 0%. |
| C04 | Thưởng sáng kiến có kết quả | Trả thưởng nhỏ, tăng hiệu quả sản xuất trong thời hạn; tác động cụ thể được ghi rõ. |
| C05 | Chia thưởng theo kết quả năm trước | Chỉ khi có lãi: chi một phần lợi nhuận đã đạt, đổi lấy năng suất tốt hơn ở kỳ tới. |
| C06 | Phụ cấp giữ chân nhân sự | Có chi phí tức thời, ngăn một lần mất nhân sự phù hợp; trạng thái tự hết sau khi dùng hoặc hết hạn. |
| C07 | Kíp mới chưa quen quy trình | Sau đợt tuyển nhiều người khi tay nghề thấp: tỷ lệ lỗi tăng tạm thời. |
| C08 | Mở rộng nhanh, bàn giao lệch nhịp | Vừa mua nhiều cụm nhưng thiếu hạ tầng/tổ vận hành: tăng chi phí phối hợp trong năm. |

## D. Chuỗi cung ứng và môi trường — 8 mẫu

| Mã | Sự kiện | Điều kiện và tác động tự động |
| --- | --- | --- |
| D01 | Luồng bốc xếp được điều phối tốt | Hạ tầng đủ tốt giúp giao thêm hàng tốt đã có; giới hạn bởi sản lượng đạt chuẩn. |
| D02 | Nguyên liệu sai quy cách | Tăng hàng lỗi; phụ trợ đủ mạnh giảm phần tác động này. Không trừ tiền lần hai cho cùng số lỗi. |
| D03 | Đạt định mức tiết kiệm vật tư | Hoàn một phần chi phí nguyên liệu thực tế của kỳ trước, có trần. |
| D04 | Lịch cấp điện theo ca | Chi phí năng lượng giảm nhưng thời gian chạy bị hạn chế trong một kỳ. |
| D05 | Bao bì quay vòng | Có chi phí triển khai, giảm phí đóng gói và phát thải trong thời hạn. |
| D06 | Hệ thống nước tuần hoàn | Yêu cầu công nghệ sạch đủ cấp: giảm chi phí đầu vào và bớt tác động thiếu nước. |
| D07 | Khu dân cư yêu cầu xử lý mùi | Chỉ khi ô nhiễm cao: phát sinh chi phí khắc phục có trần, không dừng trận vì một sự kiện thường. |
| D08 | Thu gom chất thải không đúng quy trình | Xảy ra khi xử lý xanh chưa theo kịp quy mô: ô nhiễm tăng và có khoản thu gom bổ sung. |

## E. Tương tác giữa CEO — 8 mẫu bổ sung

Không tính lại hai mẫu phí bản quyền/hoa hồng đang có. Tất cả theo hàng đợi đã chốt: bên nhận chỉ thấy tác động ở lượt Sang năm kế tiếp; còn chờ khi hết trận thì quyết toán và ghi lịch sử hai bên. Không cần bấm đồng ý/từ chối.

| Mã | Sự kiện | Tác động giữa các CEO |
| --- | --- | --- |
| E01 | Chia sẻ khách hàng dư | Bên có nhu cầu vượt khả năng giới thiệu khách cho bên còn hàng tốt chưa bán; tiền giới thiệu dựa trên doanh thu tăng thực tế. |
| E02 | Ghép chuyến vận chuyển | Hai bên cùng giảm phí logistics; mỗi bên chỉ chịu khoản phí ghép chuyến đã được giới hạn. |
| E03 | Hỗ trợ kỹ thuật bảo dưỡng | CEO có năng lực kỹ thuật nhận phí dịch vụ; đối tác được hồi độ bền. Không phát sinh thêm cụm. |
| E04 | Chia sẻ kinh nghiệm vận hành | Đối tác tay nghề thấp được cải thiện hiệu quả trong thời hạn; bên hỗ trợ nhận phí có trần. |
| E05 | Cạnh tranh gói đặt hàng | Phân bổ nhu cầu khách giữa hai CEO đủ điều kiện. Chỉ đổi lượng hàng bán được, không lấy trực tiếp máy hoặc tiền của đối thủ. |
| E06 | Nhà cung cấp chung gặp trục trặc | Hai doanh nghiệp đã có liên hệ chuỗi cung ứng cùng chịu chi phí đầu vào tăng; mức giảm nhẹ tùy phụ trợ của từng bên. |
| E07 | Kiểm định chéo doanh nghiệp | Hai bên chịu phí kiểm định nhỏ và giảm tỷ lệ lỗi; không tự tăng cấp chất lượng thiết bị vĩnh viễn. |
| E08 | Đối tác mất sức mua | Khi một đối tác từng giao dịch gặp khó khăn, nhu cầu đầu ra liên quan của CEO kia giảm tạm thời; phải hiện tên và mối liên hệ thật. |

Các mẫu E01/E05 cần sổ ghi lượng bán tăng thực tế để không tạo hàng hoặc tiền trùng. E06/E08 chỉ xuất hiện khi có quan hệ đã lưu, không ghép ngẫu nhiên hai CEO không liên quan rồi giải thích là đối tác cũ.

## F. Công nghệ, thành tích và chốt trận — 8 mẫu

| Mã | Sự kiện | Điều kiện và tác động tự động |
| --- | --- | --- |
| F01 | Thử nghiệm quy trình quy mô nhỏ | Giảm sản lượng tạm thời trong 1 năm, sau đó +1 điểm công nghệ; còn đủ chỗ đến trần mới xuất hiện. |
| F02 | Số hóa theo dõi chất lượng | Trả chi phí triển khai theo quy mô; giảm lỗi trong thời hạn, yêu cầu có tổ vận hành. |
| F03 | Thiết bị hết vòng đời công nghệ | Chỉ bốc khi có thiết bị và chất lượng từ cấp 1: giảm 1 cấp, giữ nguyên bậc giá đã mua. Cấp 0 không bị bốc sự kiện này. |
| F04 | Hết hạn bảo hộ — quyền thu phí cuối trận | Bốc ngẫu nhiên: CEO nhận sự kiện được thu % tổng tài sản chốt trận từ CEO có Công nghệ độc quyền. Chỉ chuyển tài sản một lần khi kết thúc, không thu của chính mình; lịch sử cả hai ghi rõ khoản chuyển. |
| F05 | Danh hiệu vận hành bền bỉ | Khi chốt trận, thưởng theo thành tích bảo dưỡng và vận hành thực; không thưởng doanh nghiệp chưa sản xuất. |
| F06 | Thưởng chất lượng ổn định | Khi chốt trận, thưởng nếu giữ tỷ lệ hàng tốt cao qua đủ số năm và đủ sản lượng tối thiểu. |
| F07 | Thu hồi hỗ trợ dùng sai mục tiêu | Chỉ áp dụng khi đã nhận một khoản hỗ trợ có mục tiêu nhưng không đáp ứng điều kiện; tối đa khoản đã nhận. |
| F08 | Giải ngân tài trợ công nghệ | Khi chốt trận, hoàn thành mục tiêu công nghệ đã công bố thì nhận phần tài trợ đã cam kết, có trần. |

## Ưu tiên triển khai

**Đợt 1 — 16 mẫu:** A01–A05, A07–A08, B01, B03–B04, C03, C07–C08, D01–D02, F03. Đây là nhóm tác động trực tiếp vào tốc độ, lỗi, độ bền, lượng bán và chi phí; giúp người chơi thấy ngay lý do đầu tư.

**Đợt 2 — tương tác:** E02–E04 và E07 trước; E01/E05/E06/E08 sau khi có dữ liệu lượng bán hoặc quan hệ làm điều kiện. Sự kiện không cần thêm nút bấm, nhưng tính toán nội bộ vẫn phải bảo toàn tiền, hàng và thời hạn.

**Đợt 3 — phần còn lại:** bổ sung các mẫu cần nhớ hóa đơn, trạng thái một lần hoặc tiêu chí thành tích. Không đưa các khoản hỗ trợ, hoàn phí hay cam kết vào bốc trước khi hệ thống đã lưu đủ dữ liệu để kiểm tra điều kiện.

## Điều kiện nghiệm thu cho mỗi mẫu

1. Có điều kiện để xuất hiện, không tặng lợi ích cho nguồn lực không tồn tại.
2. Một câu ngắn thể hiện được lợi/hại; không đòi người chơi đọc công thức giữa trận.
3. Ghi một lần kết quả đã bốc và nguồn số tiền/số sản phẩm được dùng làm cơ sở.
4. Không cộng lặp hàng lỗi, hàng bán, chi phí hoặc tài sản đã được tính ở cơ chế nền.
5. Có trần tác động và quy tắc cộng dồn; biến cố thường không tự biến thành kết thúc lượt.
6. Nếu liên quan CEO khác, có chứng từ cho cả hai và xử lý đúng lượt độc lập.
7. Có hình riêng theo hệ minh họa nét vẽ tay đã duyệt; không thêm GIF hoặc ghép mũi tên lên ảnh làm hoạt ảnh.
8. Chỉ bật trong game sau khi kiểm thử tính toán, lịch sử, tải lại và chốt trận.


Hiệu ứng định lượng cho cả 48 mẫu: xem `event-effects-10-minute-v1.md` (bản đề xuất, chưa thay cấu hình game).


Chỉnh sửa sau phản hồi: điểm/cấp trong phần thưởng và thiệt hại đề xuất đều nguyên. Theo giải thích mới nhất của người dùng, F04 là sự kiện ngẫu nhiên trao quyền thu phí cuối trận từ tổng tài sản của CEO có Công nghệ độc quyền; không phải quyền độc quyền tự hết hạn. Danh mục giữ 48 mẫu. Chưa thay đổi runtime.


F04 đã được triển khai riêng; xem `patent-expiry-final-transfer.md` để biết cấu hình và kiểm thử. Các mục khác giữ trạng thái đề xuất.
