# Hiệu ứng đề xuất cho danh mục sự kiện — trận 10 phút

Đây là **bản cân bằng để duyệt, chưa phải cấu hình đang chạy**. Danh mục có 48 mẫu đề xuất. F04 là một sự kiện quyền thu phí cuối trận được bốc ngẫu nhiên, không phải thông báo quyền lợi tự hết hạn. Khoảng dưới đây dùng để bốc một lần và lưu kết quả. Khi triển khai phải hợp nhất với mẫu cũ nếu cơ chế trùng; không tính đổi tên là thêm cơ chế.

## Cách đọc

- `+8–12% sản lượng` nghĩa là bốc số nguyên 8, 9, 10, 11 hoặc 12 rồi nhân lên sản lượng; không phải tặng thêm cụm.
- `−3–5 điểm % lỗi` nghĩa là tỷ lệ lỗi 15% có thể về 10–12%; khác giảm tương đối 3–5% của 15%.
- Hiệu ứng sản xuất áp dụng **từ kỳ sản xuất kế tiếp**. Không tính lại năm vừa chốt. Tiền hoặc tài nguyên ghi “ngay” thay đổi lúc sự kiện được nhận.
- Thời hạn 1–2 năm tính bằng lượt chốt năm của CEO chịu tác động. Không tính bằng thời gian thực.
- Hàng lỗi và hàng không giao được không bán như hàng tốt. Mọi số người, cụm, hàng được làm tròn về số nguyên ở bước quy định.
- Các phần thưởng/phạt điểm công nghệ và cấp tay nghề/chất lượng trong bản đề xuất chỉ dùng số nguyên: +1, −1…; không bốc 0,2 hoặc 0,4 điểm. Đây là quy tắc đề xuất, chưa sửa cơ chế tích lũy công nghệ trong runtime.
- Độ bền giới hạn 0–100%, ô nhiễm 0–100 điểm, tay nghề/chất lượng 0–5, công nghệ theo trần hiện tại. Tốc độ, tỷ lệ giao và tỷ lệ lỗi phải qua giới hạn hợp lệ; tỷ lệ lỗi do các mẫu thường mới đề xuất không vượt 40%.
- Cùng một mẫu đang có hiệu lực xuất hiện lại thì làm mới thời hạn, không nhân lũy tiến nhiều bản sao của chính nó. Tiền hoàn/bồi hoàn chỉ nhận một lần trên cùng hóa đơn hoặc lô hàng.
- Các khoản phí tùy chọn do sự kiện tự tạo phải xét đủ tiền trước khi đưa vào bốc. Không biến một ưu đãi thành khoản vay tự động ngoài ý người chơi.

## A. Máy móc và vận hành

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| A01 | Chạy vượt công suất | Sản lượng **+8–12%**; hao mòn **thêm 2–3 điểm %**. | 1 năm; có cụm đang chạy, độ bền trên 40%. |
| A02 | Chế độ vận hành an toàn | Sản lượng **−5–8%**; tỷ lệ lỗi **−3–5 điểm %**; hao mòn **bớt 2 điểm %**. | 1 năm; máy còn chạy và độ bền không quá 60%. |
| A03 | Cân chỉnh đầu ca | Chi **5–10 triệu/cụm**, tổng không quá **50 triệu**; lỗi **−2–4 điểm %**. | Trả phí ngay, lợi ích 1 năm; tỷ lệ lỗi cơ sở ít nhất 3%. |
| A04 | Bảo dưỡng theo lịch hãng | Sản lượng **−20–30%** trong kỳ bảo dưỡng; cuối kỳ hồi **20–30 điểm % độ bền**. | 1 năm; độ bền dưới 60%; không thêm cụm. |
| A05 | Phụ tùng tương thích được giảm giá | Hóa đơn bảo dưỡng kế tiếp **giảm 20–30%**; hiệu quả bảo dưỡng giữ nguyên. | Dùng 1 lần trong 2 năm. |
| A06 | Hãng thu hồi linh kiện lỗi | Hồi **10–15 điểm % độ bền**; hoàn **20–40%** chi phí sửa đủ điều kiện đã trả, tối đa **100 triệu**. | Ngay; có hóa đơn sửa liên quan, không hoàn trùng. |
| A07 | Cảnh báo hao mòn sớm | Hao mòn **bớt 2–3 điểm %**, không tự hồi độ bền cũ. | 1 năm; công nghệ ít nhất 1, có máy đang chạy; hao mòn sau giảm tối thiểu 1 điểm %. |
| A08 | Thiết bị trôi thông số | Lỗi **+5–8 điểm %**, không trừ thêm số cụm. | 1 năm; độ bền không quá 40%, còn hoạt động. |

## B. Chất lượng và thị trường

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| B01 | Khách hàng đánh giá chất lượng tốt | Giá bán **+5–8%**. | 1 năm; đã sản xuất ít nhất 100 hàng, lỗi kỳ trước dưới 3%. |
| B02 | Khiếu nại chất lượng sau bán | Chi bảo hành bằng **3–6% doanh thu đã bán kỳ trước**, tối đa **150 triệu**. | Ngay; có hàng từng bán. Lỗi tiềm ẩn sau bán khác hàng lỗi đã bị loại trước bán. |
| B03 | Tái chế phế phẩm | Thu hồi **10–20% chi phí nguyên liệu phân bổ cho hàng lỗi**, tối đa **50 triệu**. | Ngay; có hàng lỗi thực tế và công nghệ sạch ít nhất 1. Không cộng vào doanh thu bán hàng tốt. |
| B04 | Kiểm định tăng cường | Chi phí vận hành **+3–5%**; lỗi **−3–5 điểm %**. | 2 năm; lỗi cơ sở ít nhất 3%. |
| B05 | Đơn hàng giao gấp | Giá bán **+8–12%**; vận hành **+5–8% chi phí**; hao mòn **thêm 1–2 điểm %**. | 1 năm; có công suất đang chạy. |
| B06 | Khách nhận thêm hàng đạt chuẩn | Tỷ lệ hàng tốt bán được **+3–5 điểm %**, không vượt 100%. | 1 năm; đang có hàng tốt chưa bán được. |
| B07 | Khách ưu tiên nhà cung cấp xanh | Giá bán **+5–10%**. | 2 năm; ô nhiễm không quá 20, công nghệ sạch ít nhất 2. |
| B08 | Sai quy cách đóng gói | **3–6% hàng đã đạt chất lượng** bị loại ở khâu giao, làm tròn xuống; số hàng chế tạo không đổi. | 1 năm; áp sau loại hàng lỗi, không loại cùng sản phẩm hai lần. |

## C. Nhân lực và tổ chức

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| C01 | Luân phiên kèm cặp công nhân | Sản lượng **−5–10%** trong năm học; sau đó **+1 cấp tay nghề**. | Học 1 năm; tay nghề dưới 5; có công nhân và cụm chạy. |
| C02 | Chương trình học việc có hỗ trợ | Tuyển **1–3 công nhân**, trả **50–70% hóa đơn tuyển tương ứng**. | Ngay; chỉ bốc số người đủ khả năng trả; giá tuyển của ngành và bậc tăng giá vẫn được giữ đúng. |
| C03 | Tổ vận hành tự chăm sóc máy | Hao mòn **bớt 2–3 điểm %** mỗi năm có chạy. | 2 năm; đủ tổ, tay nghề ít nhất 2; hao mòn sau giảm tối thiểu 1 điểm %. |
| C04 | Thưởng sáng kiến có kết quả | Chi **10–20 triệu**; sản lượng **+5–8%**. | Phí ngay, lợi ích 2 năm; đang sản xuất. |
| C05 | Chia thưởng theo kết quả năm trước | Chi **3–5% lãi sản xuất dương kỳ trước**, tối đa **100 triệu**; sản lượng kỳ tới **+5–8%**. | 1 năm; không áp lên doanh thu hoặc lãi âm. |
| C06 | Phụ cấp giữ chân nhân sự | Chi **10–25 triệu**; bảo vệ tối đa **1–2 công nhân** khỏi một lần mất người. | Dùng 1 lần trong 2 năm; chỉ trừ mức mất thực tế, không sinh người mới. |
| C07 | Kíp mới chưa quen quy trình | Lỗi **+3–5 điểm %**. | 1 năm; vừa tuyển ít nhất 3 người, tay nghề dưới 2. |
| C08 | Mở rộng nhanh, bàn giao lệch nhịp | Chi phí vận hành **+5–10%**. | 1 năm; vừa thêm ít nhất 2 cụm, hạ tầng dưới 2. |

## D. Chuỗi cung ứng và môi trường

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| D01 | Luồng bốc xếp được điều phối tốt | Tỷ lệ hàng tốt bán được **+3–6 điểm %**, trần 100%. | 1 năm; hạ tầng ít nhất 2, có hàng tốt chưa giao được. |
| D02 | Nguyên liệu sai quy cách | Lỗi **+4–8 điểm %** trước bảo vệ phụ trợ. | 1 năm; bảo vệ phụ trợ áp đúng một lần lên tác động sự kiện. |
| D03 | Đạt định mức tiết kiệm vật tư | Hoàn **5–10% chi phí nguyên liệu thực tế kỳ trước**, tối đa **100 triệu**. | Ngay; phụ trợ ít nhất 2, có chi phí nguyên liệu đã ghi. |
| D04 | Lịch cấp điện theo ca | Chi phí vận hành **−5–10%**; sản lượng **−3–5%**. | 1 năm; đang sản xuất. |
| D05 | Bao bì quay vòng | Chi **20–40 triệu**; chi phí nguyên liệu **−3–5%** trong thời hạn; ô nhiễm giảm ngay **3–5 điểm**. | 2 năm cho phần tiết kiệm; cần đang vận hành và đủ tiền. |
| D06 | Hệ thống nước tuần hoàn | Chi phí nguyên liệu **−5–8%**; giảm **30–50% phần thiệt hại sản lượng do thiếu nước** nếu gặp. | 2 năm; ngành dùng nước và công nghệ sạch ít nhất 3. Không giảm tất cả loại rủi ro. |
| D07 | Khu dân cư yêu cầu xử lý mùi | Chi **10–20% chi phí vận hành kỳ trước**, tối đa **150 triệu**; ô nhiễm **−5–10 điểm**. | Ngay; ô nhiễm ít nhất 50, có vận hành. |
| D08 | Thu gom chất thải không đúng quy trình | Ô nhiễm **+5–10 điểm**; phí thu gom **10–30 triệu**. | Ngay; công nghệ sạch chưa theo kịp quy mô; không trừ lại phí này ở một dòng khác. |

## E. Tương tác giữa CEO

Đây là 8 mẫu đề xuất bổ sung, không tính lại hai mẫu phí bản quyền và hoa hồng đã code. Không cần người nhận bấm đồng ý. Sự kiện đi theo hàng đợi của lượt người nhận; hiệu ứng kéo dài dùng năm của từng bên. Phần còn chờ được quyết toán khi hết trận và hiện trong lịch sử cả hai.

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| E01 | Chia sẻ khách hàng dư | B tăng lượng bán tương đương **3–5% hàng tốt**, giới hạn bởi hàng chưa bán; A nhận phí **5–8% doanh thu tăng thực tế**, tối đa **75 triệu**. | 1 kỳ sản xuất của B; có quan hệ khách phù hợp. Phí chỉ tính sau khi có doanh thu tăng, không ứng tiền từ doanh thu chưa tồn tại. |
| E02 | Ghép chuyến vận chuyển | Mỗi bên trả **2–5 triệu**; chi phí logistics mỗi bên **−8–12%**. | 2 năm của từng CEO, chỉ tính từ lượt nhận hiệu lực; có hàng giao và đủ tiền. |
| E03 | Hỗ trợ kỹ thuật bảo dưỡng | B hồi **10–20 điểm % độ bền**; B trả A **3–8 triệu/cụm được hỗ trợ**, tối đa **40 triệu**. | Ngay khi B đến lượt; A có năng lực kỹ thuật, B có máy cần sửa; không tăng cụm. |
| E04 | Chia sẻ kinh nghiệm vận hành | B được hiệu quả tương đương **+1 cấp tay nghề tạm thời**, không vượt cấp 5; B trả A **5–15 triệu**. | 2 năm của B; A tay nghề cao hơn B; không làm thay đổi giá nâng cấp đã mua. |
| E05 | Cạnh tranh gói đặt hàng | Chuyển nhu cầu mua tương đương **3–5% hàng tốt** từ bên mất đơn sang bên thắng. | 1 kỳ mỗi bên; lượng chuyển bị giới hạn bởi nhu cầu đang có và hàng tốt bên thắng chưa bán. Không chuyển máy, hàng sở hữu hoặc tiền trực tiếp. |
| E06 | Nhà cung cấp chung gặp trục trặc | Chi phí nguyên liệu của cả hai **+5–10%**, sau bảo vệ phụ trợ riêng của từng bên. | 1 năm mỗi bên; phải có quan hệ cung ứng đã lưu. |
| E07 | Kiểm định chéo doanh nghiệp | Mỗi bên trả **5–10 triệu**; lỗi của mỗi bên **−2–4 điểm %**. | 1 năm mỗi bên; tỷ lệ lỗi cơ sở ít nhất 3%, không tăng cấp thiết bị vĩnh viễn. |
| E08 | Đối tác mất sức mua | Doanh thu liên quan của A **−5–8%** trong phạm vi quan hệ với B; B không bị trừ tài sản thêm lần nữa. | 1 năm của A; B thật sự vừa ngừng hoạt động/thu hẹp, hai bên đã có giao dịch. |

E01/E05 cần bộ ghi nhận nhu cầu/lượng bán, còn E06/E08 cần dữ liệu quan hệ. Không mô phỏng bằng cách tặng tiền hoặc gán đối tác cũ ngẫu nhiên. Những phần này là cơ chế cần bổ sung trước khi bật sự kiện.

## F. Công nghệ và chốt trận

| Mã | Sự kiện | Hiệu ứng được bốc | Thời hạn / điều kiện |
| --- | --- | --- | --- |
| F01 | Thử nghiệm quy trình quy mô nhỏ | Sản lượng **−5–10%** trong kỳ thử; sau đó công nghệ **+1 điểm**. | Thử 1 năm; còn ít nhất 1 điểm đến trần công nghệ. Vì phần thưởng lớn hơn bản nháp cũ, phải thử lại tần suất trước khi duyệt. |
| F02 | Số hóa theo dõi chất lượng | Chi **20–40 triệu**; lỗi **−3–5 điểm %**. | 2 năm; có tổ đang chạy, lỗi cơ sở ít nhất 3%, đủ tiền. |
| F03 | Thiết bị hết vòng đời công nghệ | Chất lượng thiết bị **−1 cấp**; độ bền không tự giảm thêm. | Thay đổi lâu dài, có thể mua cải tiến để hồi; giữ bậc giá đã mua. Chỉ được bốc khi đã có cụm và chất lượng thiết bị ít nhất cấp 1; cấp 0 không gặp sự kiện này, không đổi sang trừ tiền thay thế. |
| F04 | Hết hạn bảo hộ — quyền thu phí cuối trận | CEO nhận sự kiện được thu một tỷ lệ % **tổng tài sản chốt trận** từ các CEO có Công nghệ độc quyền. Tài sản bên trả giảm đúng khoản bên nhận được cộng; không trừ tiền mặt thêm lần nữa. | Sự kiện được bốc ngẫu nhiên, không tự xuất hiện vì quyền độc quyền đã tồn tại lâu. Chỉ quyết toán cuối trận, không tự thu của mình, mỗi cặp thu một lần; ghi đầy đủ lịch sử cả hai. Mức % và trần tổng thu còn cần cân bằng trước triển khai. |
| F05 | Danh hiệu vận hành bền bỉ | Cuối trận, thưởng **2–4% tài sản trước thưởng/phạt**, tối đa **300 triệu**. | Ít nhất 5 năm vận hành; có bảo dưỡng thật khi độ bền dưới 60%; không thưởng chỉ vì chưa chạy máy. |
| F06 | Thưởng chất lượng ổn định | Cuối trận, thưởng **2–4% tài sản trước thưởng/phạt**, tối đa **300 triệu**. | Ít nhất 3 năm vận hành, 300 sản phẩm đạt chuẩn và tỷ lệ đạt chuẩn cả giai đoạn ít nhất 97%. |
| F07 | Thu hồi hỗ trợ dùng sai mục tiêu | Cuối trận thu hồi **30–50% khoản hỗ trợ có mục tiêu đã nhận**, tối đa **200 triệu** và không vượt khoản được hỗ trợ. | Chỉ khi điều kiện công bố trước không đạt. Không gắn điều kiện hồi tố vào chương trình khởi động lại đang có. |
| F08 | Giải ngân tài trợ công nghệ | Hoàn **10–20% chi phí nâng cấp công nghệ đủ điều kiện đã trả**, tối đa **200 triệu**. | Cuối trận; đạt mục tiêu đã được công bố khi nhận cam kết; không hoàn trùng hóa đơn. |

## Chống cộng trùng và kiểm tra cân bằng

- Các khoản cuối trận dùng cùng một bảng tài sản trước thưởng/phạt; không lấy kết quả vừa cộng của CEO khác làm cơ sở mới.
- Phần thưởng thành tích mới F05/F06 không cộng chồng vô hạn: nếu đồng thời đủ hai điều kiện, đề xuất chỉ nhận khoản cao hơn; vẫn ghi cả hai thành tích đã đạt.
- Không tính cùng một sản phẩm là hàng lỗi máy, hàng tốt bán được và hàng bị loại đóng gói. Các tập hàng phải tách rõ.
- Hàng từ E01/E05 không tăng tổng sản lượng, không bán vượt hàng tốt, không chia phí trên doanh thu không tồn tại.
- Các mức tiền cố định được thử trên vốn mở đầu và giá của từng ngành trước khi duyệt. Hóa đơn theo ngành phải dựa trên quote thật, không dùng lại mức của ngành khác.
- Cần chạy mô phỏng sau khi có dữ liệu: có sự kiện có lợi nhưng không được làm tăng trưởng chỉ dựa vào bốc thưởng tốt hơn đầu tư; thiệt hại thường có thể phục hồi trong nhịp trận.
- Mục tiêu UX khoảng 6–10 biến cố chính trong 10 phút là giả thuyết để thử, không phải quota cứng hoặc xác suất đã thay trong source.

Ưu tiên triển khai và danh sách điều kiện đầy đủ theo nhóm: `event-catalog-10-minute-proposal.md`.


### Quy tắc F04 được người dùng làm rõ

- A có sự kiện Công nghệ độc quyền; B bốc được Hết hạn bảo hộ. Cuối trận B thu phí dựa trên tổng tài sản của A, vì tổng tài sản quyết định thứ hạng. B không cần tự sở hữu Công nghệ độc quyền để nhận quyền thu này.
- Ví dụ minh họa, chưa chốt mức phí: A có 10 tỷ, B có 6 tỷ và tỷ lệ đã bốc là 3%. Chuyển 300 triệu tài sản từ A sang B: A còn 9,7 tỷ, B thành 6,3 tỷ.
- Dùng cùng bảng tài sản cơ sở trước các điều chỉnh cuối trận; không lấy tài sản của người vừa được cộng để tính lặp phí tiếp theo. Không đồng thời trừ cả tiền mặt và điểm tài sản cho một khoản thu.
- Đây là một khoản chuyển giữa CEO, không phải phần thưởng tự sinh thêm tài sản. Tổng tài sản hai bên được bảo toàn bởi riêng giao dịch này.
- Tỷ lệ gặp F04 là ngẫu nhiên. Tỷ lệ thu được bốc một lần theo % nguyên và hiện khi nhận quyền; khoảng bốc, trần theo bên trả và cách phân bổ nếu có nhiều bên thu vẫn phải duyệt/cân bằng trước khi code.
- Khái niệm này không làm mất cấp công nghệ, chất lượng hoặc quyền sản xuất. Chưa thay đổi runtime hiện có.


### Triển khai F04

F04 đã được code riêng theo `patent-expiry-final-transfer.md`: bốc 1–3% nguyên; trần tổng khấu trừ mỗi bên 10% tài sản và 1 tỷ; trần tổng nhận mỗi bên 20% tài sản và 1 tỷ. Quyết toán tài sản, không trừ tiền mặt, có chứng từ hai phía. Các mẫu đề xuất khác chưa được triển khai trong lần cập nhật này.
