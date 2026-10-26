# Linh vật nguyên khung hình — bản thử v3

Chỉ là bản thử để duyệt. Chưa tích hợp vào gameplay production. Không dùng lại bộ nhân vật cắt khớp ở v2.

## Các chuỗi chuyển động

- Nói chuyện: 8 frame, miệng dừng khép khi hết lời.
- Chỉ nút: 6 hướng riêng (lên trái/phải, ngang trái/phải, xuống trái/phải), mỗi hướng 8 frame. Chọn theo vị trí thật của nút so với nhân vật; mắt/đầu theo hướng tay. Đưa tay 480ms, thu tay 320ms trước khi đổi hướng.
- Chào/vẫy tay: 8 frame, vẫy rồi thu tay về.
- Chớp mắt: 8 frame mở–khép–mở.
- Suy nghĩ/chờ: 8 frame đưa tay lên cằm, giữ tư thế đến khi người dùng thao tác.
- Gật đầu xác nhận: 8 frame, ngón cái và gật đầu sau thao tác đúng.
- Chúc mừng: 8 frame nắm tay mừng hoàn tất năm đầu.

Mỗi frame là TOÀN BỘ nhân vật, được Image Gen vẽ riêng. Canvas 2D chỉ phát một ImageBitmap nguyên nhân vật mỗi lượt; không cắt ghép tay/đầu/miệng, không CSS animation, không hòa hai thân hình. 104 frame nguồn; mọi chuỗi mới bắt đầu bằng chính bitmap nghỉ đã duyệt. Nói chuyện và các chuỗi mới có camera cố định suốt clip để sai số viền khóa thắt lưng không gây phóng/thu thân.

Nguồn talk-safe.png và point-safe.png đã duyệt được giữ nguyên. Các PNG talk.png/point.png cũ chỉ còn để đối chiếu.

- Chờ/thở: chuỗi 8 hình nguyên nhân vật, một vòng khoảng 4,2 giây, khép miệng. Không lắc ảnh hoặc scale toàn thân bằng CSS.
- Khi nói dùng các hình khẩu hình nhỏ ở 7fps, bỏ những khẩu hình rộng dễ tạo cảm giác rung.
- Bảng tên “Cố vấn doanh nghiệp” có khung SVG kín bốn phía, nằm dưới nhân vật và không tham gia grid game.

## Tương tác

- Hết lời: khép miệng, chỉ ngắn về nút đang hướng dẫn, rồi thu tay về thở/chờ vô hạn. Động tác không tự nhảy bước. Vị trí bảng tên và thoại tránh vùng bấm của nút.
- Chỉ tiến bước khi bấm đúng nút và thao tác mô phỏng thành công.
- Lớp nhân vật và thoại đè lên game; không reflow hay chặn chuột.
- Năm đầu không có khóa nút theo thời gian. Bấm Sang năm đúng bước sẽ chạy phản hồi chúc mừng ngắn, rồi mới vào năm 2 và bắt đầu chu kỳ 60 giây.
- Các nút thử động tác chỉ dùng để duyệt, không phải UI gameplay cuối.
- Reduced motion giữ nhân vật tĩnh, vẫn cần thao tác đúng.

## Font tiếng Việt

Georgia trên Windows thiếu 92/102 ký tự Việt đã kiểm tra, gây trộn font ở các chữ có dấu. Bản thử dùng Times New Roman (regular/bold đủ 102/102 ký tự), cùng bộ dự phòng serif; không tải mạng hoặc phát hành lại file font Windows. Nội dung thoại chuẩn hóa NFC, đánh chữ theo grapheme, không tách dấu ra khỏi chữ.

## Mở và kiểm tra

`node serve.cjs` → http://127.0.0.1:4519/

- `read-sprite-metadata.py`: nhận diện toàn nhân vật và tạo metadata.
- `check-vietnamese-font.ps1`: kiểm tra glyph font trên Windows.
- `qa-direction.cjs` (hoặc `qa.cjs`): Chromium ở 390/768/1440px; sáu hướng chỉ, chọn hướng theo nút, thở/chờ, khẩu hình nói nhẹ, bảng tên, 5 bước hướng dẫn, timer năm 2 và reduced motion.
- `verification-actions/report.json`: kết quả chức năng.
- `verification-actions/font-coverage.json`: báo cáo glyph.
- `verification-actions/vietnamese-font-*.png`: kiểm tra dấu thường/đậm ở ba kích thước.
- Video 08/09: bản quay đầy đủ/cận cảnh của bảng tên, nhịp thở và sáu hướng chỉ. Video 02–07 thuộc các vòng duyệt trước.
- `verification-direction/report.json`: kết quả đợt hiện tại; các báo cáo trong verification-actions/refined là lịch sử vòng trước.

IAB báo timeout tới localhost trong phiên công cụ. QA dùng Chromium thực và route.fulfill để phục vụ chính các file cục bộ, không mạng ngoài. Không khẳng định đã kiểm thử Safari/iOS hoặc thiết bị thật. Chất lượng nét vẽ/chuyển động cần người dùng duyệt video; kiểm thử hình học không chứng nhận mọi chi tiết mỹ thuật.

`direction-provenance.json` cùng các file correction-provenance lưu nguồn hướng chỉ/nhịp thở; các ảnh draft không được tải ở runtime. `actions-provenance.json` lưu prompt/nguồn của 5 chuỗi trước; `refinement-provenance.json` lưu nguồn hai chuỗi đã duyệt. Không thêm dependency, API key, route hoặc thay đổi server game.
