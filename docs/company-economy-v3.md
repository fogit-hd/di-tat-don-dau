# Mô hình cụm sản xuất — phiên bản 3

Áp dụng khi bắt đầu lượt chơi mới. Các trận đang dở giữ mô hình cũ để bảo toàn tài sản và báo cáo. Không cần migration database: định mức và giá ngành được chụp vào state JSON của đội để không đổi giữa trận khi cập nhật cấu hình.

## Luật chơi

- Khởi đầu 0 công nhân, 0 cụm, 0 sản phẩm; vẫn giữ vốn theo cấu hình phòng và bối cảnh. Tình trạng thiết bị mới 100%.
- Mỗi lần tuyển nhận đúng 1 người. Mỗi lần mở cụm nhận đúng 1 cụm hoàn chỉnh; không còn mua 20% một máy.
- Cụm đang vận hành = min(cụm sở hữu, floor(công nhân / định mức)). Phần còn lại là **Chờ đủ nhân lực**. Nút Tuyển đủ tổ chỉ mua đúng số người còn thiếu cho tổ tiếp theo.
- Tuyển thêm người và mua cụm là mở rộng quy mô. Đào tạo tay nghề và cải tiến thiết bị là nâng chất lượng, không tự sinh thêm người/cụm.
- Tay nghề tối đa cấp 5, mỗi cấp thưởng 5% năng suất gốc. Thiết bị tối đa cấp 5, mỗi cấp thưởng 8% năng suất gốc. Mở hai mục này khi có 3 cụm đang vận hành.
- Bảo dưỡng đưa tình trạng thiết bị về 100%; chỉ mua được khi tình trạng dưới 99% và đã có thiết bị. Giá phụ thuộc quy mô thiết bị. Tình trạng tham gia năng suất thật, hao mòn chỉ khi vận hành và có sàn 60%.
- Công nghệ tự tích lũy 0,02 cấp mỗi năm có sản xuất, tối đa cấp 3. Công nhân dư không làm tăng công nghệ hay đầu ra.
- Phụ trợ và hạ tầng có lợi ích mạnh hơn ở những cấp đầu nhưng giảm dần về sau; trần giảm phí 30%, trần bảo vệ nguồn cung 50%, tỷ lệ bán hàng không vượt 100%.
- Sản phẩm sản xuất và bán ra là số nguyên. Dao động sản xuất/giá, sự kiện và các rủi ro năm vẫn giữ luồng ngẫu nhiên hiện có.
- Thưởng câu hỏi còn 32–48 triệu, không tự tặng hàng trăm công nhân. Quà nhân lực từ các kịch bản cũ được quy đổi theo định mức tổ mới. Luồng dừng đồng hồ năm khi có câu hỏi được giữ nguyên.

## Cân bằng giá và sản xuất

Bảng sau là **giá trị mô phỏng cho gameplay**, không phải báo giá hay định biên lao động thực tế. Các ngành cùng nhóm có thể dùng chung số người/cụm. Mỗi ngành có bộ giá tuyển dụng, thiết bị, phụ trợ, hạ tầng, công nghệ sạch riêng.

Cụm có năng suất gốc 100 sản phẩm/năm. Giá sản phẩm và chi phí vận hành được hiệu chỉnh theo chi phí mở một cụm + đủ tổ công nhân. Ở điều kiện tham chiếu: đủ người, tình trạng 100%, không ô nhiễm/sự kiện/dao động, không nâng chất lượng, lợi nhuận vận hành khoảng 22% chi phí khởi tạo cụm và tổ mỗi năm. Đây là phép hiệu chỉnh cơ sở; không khẳng định mọi ngành có tỷ suất thực tế bằng nhau sau sự kiện.

Giá mua tăng xấp xỉ 4% giá khởi điểm (bước tăng làm tròn theo triệu) theo cấp mở rộng, cộng mức tăng bậc hai ở mỗi mốc 10 cấp. Tuyển dụng tăng giá theo **tổ** đã tuyển để ngành cần nhiều người không bị tăng giá quá nhanh chỉ do số lượt bấm. Mua nhiều là tổng giá từng nấc; Tối đa tìm đúng số lượng đủ tiền. Hiệu ứng giá chỉ đổi hóa đơn, không đổi số người/cụm nhận được.

Các ô giá ở cấu hình chủ phòng là giá tham chiếu: thay đổi chúng sẽ nhân mức giá ngành tương ứng. Ví dụ tăng giá tham chiếu nhân lực 50 lên 60 triệu áp hệ số 1,2 cho giá tuyển dụng từng ngành.

## Kiểm chứng

132 test backend qua, 1 test database bỏ qua khi không có DB thử nghiệm. Build backend và frontend qua. Chromium Playwright kiểm tra production build tại 390/768/1440px bằng API/Socket.IO mock và công thức backend thật: khởi đầu 0, giá trái cây sấy 40 triệu/người và 220 triệu/cụm, Tuyển đủ tổ, mở 3 cụm, nâng tay nghề/thiết bị/bảo dưỡng; không cuộn ngang. Lint chỉ có warning có sẵn. Chưa deploy Render; chưa playtest toàn bộ sự kiện của 64 ngành trên thiết bị thật.

## Bảng cấu hình 64 ngành

Đơn vị giá: **triệu VNĐ**, trước sự kiện, trước tăng cấp.

| Ngành | Người/cụm | Tuyển 1 người | Mở 1 cụm | Phụ trợ | Hạ tầng | Sạch | Cụm + đủ tổ ban đầu |
|---|---:|---:|---:|---:|---:|---:|---:|
| Sản xuất chip bán dẫn | 4 | 90 | 500 | 140 | 180 | 130 | 860 |
| Sản xuất màn hình điện tử (LCD/OLED) | 4 | 70 | 360 | 110 | 130 | 100 | 640 |
| Sản xuất pin lithium | 5 | 65 | 360 | 110 | 150 | 140 | 685 |
| Sản xuất ô tô điện | 5 | 65 | 420 | 120 | 150 | 100 | 745 |
| Chế tạo robot công nghiệp | 3 | 85 | 420 | 100 | 120 | 80 | 675 |
| Chế tạo drone và thiết bị bay không người lái | 3 | 70 | 280 | 85 | 100 | 65 | 490 |
| Sản xuất thiết bị viễn thông (5G, cáp quang) | 3 | 75 | 320 | 100 | 140 | 65 | 545 |
| Phát triển phần mềm và trí tuệ nhân tạo (AI) | 3 | 100 | 250 | 70 | 100 | 50 | 550 |
| Vận hành trung tâm dữ liệu | 3 | 90 | 450 | 110 | 200 | 130 | 720 |
| Chế tạo và phóng vệ tinh | 4 | 100 | 550 | 140 | 170 | 90 | 950 |
| Sản xuất thiết bị y tế | 4 | 75 | 330 | 100 | 120 | 90 | 630 |
| Sản xuất linh kiện điện tử | 4 | 60 | 280 | 90 | 110 | 85 | 520 |
| Luyện thép | 6 | 55 | 420 | 130 | 160 | 160 | 750 |
| Sản xuất xi măng | 6 | 45 | 360 | 100 | 150 | 160 | 630 |
| Đóng tàu biển | 6 | 60 | 480 | 140 | 200 | 130 | 840 |
| Sản xuất ô tô | 5 | 60 | 380 | 110 | 140 | 100 | 680 |
| Sản xuất xe máy | 5 | 50 | 260 | 85 | 110 | 80 | 510 |
| Chế tạo máy nông nghiệp | 4 | 50 | 260 | 80 | 100 | 75 | 460 |
| Chế tạo máy công cụ (máy tiện, máy phay CNC) | 4 | 65 | 340 | 100 | 120 | 80 | 600 |
| Sản xuất hóa chất cơ bản | 5 | 65 | 380 | 130 | 150 | 170 | 705 |
| Sản xuất phân bón | 5 | 45 | 300 | 100 | 130 | 150 | 525 |
| Lọc dầu và hóa dầu | 6 | 75 | 550 | 170 | 220 | 200 | 1000 |
| Luyện nhôm | 5 | 55 | 350 | 110 | 140 | 150 | 625 |
| Chế tạo đầu máy và toa tàu đường sắt | 6 | 60 | 420 | 120 | 200 | 110 | 780 |
| Điện mặt trời | 3 | 60 | 300 | 90 | 150 | 70 | 480 |
| Điện gió | 4 | 70 | 450 | 110 | 190 | 80 | 730 |
| Thủy điện | 4 | 65 | 420 | 100 | 200 | 110 | 680 |
| Sản xuất hydro xanh | 5 | 85 | 520 | 150 | 200 | 150 | 945 |
| Xây dựng lưới điện thông minh | 4 | 80 | 400 | 120 | 210 | 80 | 720 |
| Sản xuất pin lưu trữ năng lượng | 4 | 65 | 340 | 105 | 150 | 120 | 600 |
| Dệt may | 5 | 35 | 170 | 60 | 80 | 65 | 345 |
| Sản xuất da giày | 5 | 35 | 180 | 65 | 85 | 75 | 355 |
| Sản xuất đồ gỗ nội thất | 5 | 45 | 230 | 75 | 110 | 100 | 455 |
| Sản xuất sản phẩm nhựa | 4 | 40 | 220 | 80 | 90 | 110 | 380 |
| Sản xuất giấy và bao bì | 5 | 40 | 250 | 75 | 110 | 130 | 450 |
| Sản xuất gốm sứ | 5 | 40 | 200 | 65 | 90 | 90 | 400 |
| Sản xuất thủy tinh và kính | 5 | 45 | 240 | 75 | 100 | 100 | 465 |
| Sản xuất đồ chơi | 4 | 35 | 150 | 55 | 75 | 60 | 290 |
| Sản xuất mỹ phẩm | 4 | 55 | 230 | 90 | 90 | 85 | 450 |
| Sản xuất dược phẩm | 5 | 85 | 400 | 130 | 150 | 120 | 825 |
| Sản xuất thiết bị gia dụng (tủ lạnh, máy giặt) | 4 | 50 | 240 | 80 | 100 | 75 | 440 |
| Chế biến cà phê | 4 | 40 | 200 | 70 | 95 | 75 | 360 |
| Chế biến cacao và chocolate | 4 | 45 | 220 | 75 | 100 | 75 | 400 |
| Chế biến chè (trà) | 4 | 35 | 170 | 60 | 85 | 65 | 310 |
| Xay xát và xuất khẩu gạo | 5 | 35 | 200 | 65 | 110 | 70 | 375 |
| Chế biến sữa | 5 | 50 | 280 | 90 | 140 | 100 | 530 |
| Nuôi trồng và chế biến thủy sản | 6 | 40 | 250 | 85 | 160 | 110 | 490 |
| Chế biến trái cây sấy | 5 | 40 | 220 | 75 | 110 | 80 | 420 |
| Chế biến hạt điều | 5 | 35 | 180 | 65 | 95 | 70 | 355 |
| Sản xuất đường mía | 5 | 40 | 260 | 80 | 120 | 100 | 460 |
| Sản xuất nước mắm | 5 | 35 | 170 | 60 | 90 | 80 | 345 |
| Sản xuất bia và nước giải khát | 5 | 50 | 300 | 90 | 130 | 100 | 550 |
| Sản xuất thực phẩm đóng hộp | 5 | 45 | 270 | 85 | 130 | 95 | 495 |
| Nông nghiệp công nghệ cao (nhà kính, thủy canh) | 4 | 55 | 280 | 95 | 140 | 90 | 500 |
| Trồng và chế biến cao su | 5 | 40 | 250 | 80 | 110 | 120 | 450 |
| Khai thác và chế biến đất hiếm | 6 | 65 | 450 | 140 | 180 | 180 | 840 |
| Sản xuất dây và cáp điện | 4 | 50 | 270 | 95 | 110 | 90 | 470 |
| Nhập khẩu và tái hóa khí LNG | 5 | 75 | 480 | 140 | 200 | 160 | 855 |
| Cảng biển và logistics | 6 | 55 | 400 | 110 | 220 | 100 | 730 |
| Sản xuất nhà thép tiền chế | 5 | 50 | 300 | 90 | 150 | 90 | 550 |
| Tái chế rác thải | 5 | 40 | 230 | 75 | 100 | 130 | 430 |
| Xử lý nước sạch và nước thải | 4 | 60 | 320 | 100 | 160 | 140 | 560 |
| In 3D công nghiệp | 3 | 75 | 300 | 90 | 100 | 70 | 525 |
| Bảo dưỡng và chế tạo linh kiện máy bay | 5 | 90 | 550 | 150 | 220 | 120 | 1000 |
