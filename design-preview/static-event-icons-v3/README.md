# Canvas duyệt icon sự kiện — ảnh tĩnh, đợt 3

**Trạng thái: người dùng đã duyệt; bộ ảnh tĩnh và cách hiển thị đã được áp dụng tại local. Chưa deploy.**

Phong cách chuẩn là bộ icon vẽ tay ở đợt đầu: nét mực có chi tiết, màu nước/gouache, có khối và ánh sáng, nhìn rõ vật liệu gỗ, kim loại, nước, vải và khuôn mặt. Các canvas này được tạo bằng Image Gen, không dùng cách ghép tranh ngành thu nhỏ với biểu tượng SVG của đợt 2.

## Bộ canvas

1. [Thiên nhiên & môi trường](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/01-nature.png) — mưa, bão, nắng, lửa, ngập, rét, cây trồng, mùa vụ, sâu bệnh, hóa chất, động đất, hạn hán.
2. [Máy móc & công nghệ](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/02-technology.png) — phân biệt hỏng máy, mất điện, quá tải làm mát, tự động hóa, tin tặc, mất thiết kế, hỏng wafer, nghiên cứu, thiết bị mới, chữa cháy, đứt kết nối, sáng chế.
3. [Nguyên liệu & logistics](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/03-logistics.png) — thiếu vật tư, nhà cung cấp, cảng, vận tải, thông quan, kho, kho lạnh và giá nguyên liệu.
4. [Thị trường & chính sách](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/04-market-policy.png) — hợp đồng, hủy đơn, phục hồi, giảm giá, thuế, hỗ trợ vốn, tín dụng, liên doanh, tiêu chuẩn, môi trường, mặt bằng.
5. [Nhân lực & gia tộc](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/05-people-family.png) — đào tạo, nghỉ việc, đình công, an toàn, bạo bệnh, trường thọ, nghỉ hưu, chuyển giao, tranh chấp, quỹ, du học, bảo hiểm.
6. [Bối cảnh & kết quả](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/06-contexts-outcomes.png) — bảy bối cảnh kinh tế và các kết quả qua đời, phá sản, giảm/giữ/tăng tài sản.
7. [Ví dụ riêng theo ngành](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/07-industry-examples.png) — cùng là hỏng thiết bị nhưng CNC, wafer, máy cưa, máy sấy, đường ống, cẩu cảng có hình khác nhau; các đơn hàng chip, thuốc, may mặc, cà phê, pin, điện mặt trời cũng có chủ thể riêng.
8. [Cách hiển thị trong game](C:/Users/PHONG/Desktop/Coding_Proj/chip-game/design-preview/static-event-icons-v3/08-in-game-preview.png) — danh sách trên máy tính, khung điện thoại và chi tiết do người chơi chủ động chọn. Đây là mockup, không phải ảnh chụp app đã sửa.

Bảy bảng đầu trình bày các nhóm và tình huống đại diện để duyệt trọn hướng thiết kế. Chúng **chưa phải toàn bộ hàng nghìn ảnh sự kiện độc lập đã hoàn thành**. Chỉ sau khi duyệt mới sản xuất bộ ảnh theo danh mục thực tế và áp dụng.

## Những điểm cần duyệt

- Giữ chất minh họa có khối và chi tiết như đợt đầu, mỗi icon là một hình vẽ hoàn chỉnh. Không lấy một ảnh nhà máy rồi dán biểu tượng nhỏ lên.
- Hình phải chỉ đúng đối tượng, tình trạng và ngành. CNC hỏng khác với hỏng wafer hoặc vỡ ống nước; bạo bệnh khác trường thọ/nghỉ hưu/tử vong; trợ cấp được chấp thuận khác tiền đã giải ngân.
- Chốt dùng **ảnh tĩnh**. Không làm GIF hoặc giả chuyển động bằng mũi tên, chớp sáng, khói phủ.
- Tên, mức phần trăm và thời hạn sẽ là text thật trong game. Số trên mockup chỉ minh họa, không thay đổi logic hoặc xác suất.
- Phần trăm random khác nhau không cần tạo lại hình; tình huống khác bản chất phải có hình tương ứng. Những bối cảnh ghép làm đổi nghĩa sẽ được thiết kế như một minh họa thống nhất, không quay lại lớp SVG dán chồng.
- Sau khi duyệt, ảnh dùng trong app cần được xuất riêng với nền trong suốt, không chứa nhãn, không chứa nền giấy của canvas; giữ toàn bộ silhouette, kiểm tra ở cỡ danh sách và cỡ xem chi tiết. Không cắt toàn bộ ô canvas thành icon đem dùng trực tiếp.

## Ghi nhận để xử lý sau, chưa triển khai

**Số máy chạy và số công nhân luôn là số nguyên, không có số phẩy.** Người dùng yêu cầu tiếp tục canvas trước và để thay đổi này sau; lượt này chưa chỉnh công thức hay cách làm tròn.

## Nguồn và kiểm tra bản duyệt

`provenance.json` ghi các file gốc do công cụ Image Gen tạo; `prompt-brief.md` ghi hướng vẽ và bộ chủ thể. Các ảnh đều là PNG tĩnh. Đã xem lại bố cục, nhãn và hình theo ngành; bản logistics có một lượt chỉnh để máy bay không bị cắt ở mép. Chỉ thêm thư mục bản duyệt này, không ghi vào `frontend/src`, `frontend/public` hay `backend`.
