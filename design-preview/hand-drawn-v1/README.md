# 12 bản mẫu vẽ tay — chờ duyệt

Người dùng đã duyệt phong cách vẽ tay và cho phép áp dụng cả bộ. 12 bản mẫu được giữ nguyên để đối chiếu; bản WebP dùng trong game nằm ở `frontend/public/assets/investments/handdrawn-v1/`.

Mỗi ngành có 4 ảnh độc lập, đúng 4 perk trong seed. Các ảnh được tạo bằng công cụ image generation tích hợp, không lấy ảnh chụp rồi phủ bộ lọc vẽ tay.

| Ngành | `eng.webp` | `mac.webp` | `sup.webp` | `inf.webp` |
| --- | --- | --- | --- | --- |
| Trái cây sấy | Kỹ sư thực phẩm | Máy sấy thăng hoa | Liên kết nhà vườn | Kho lạnh nguyên liệu |
| Chip bán dẫn | Kỹ sư thiết kế vi mạch | Quang khắc | Hóa chất siêu sạch | Điện và nước siêu tinh khiết |
| Dược phẩm | Dược sĩ nghiên cứu | Dây chuyền GMP | Nguyên liệu dược nội địa | Phòng sạch và kho lạnh |

Phong cách mới: nét mực nâu và bút chì rõ ràng, gạch bóng thủ công, màu nước/gouache trên giấy ngà, hình khối và gương mặt được cách điệu. Không ảnh chụp, không vật liệu tả thực, không render 3D, không độ sâu trường ảnh kiểu máy ảnh.

`all-12.jpg` là bảng tổng hợp để so sánh. Ba file `*-board.jpg` là bảng 4 ảnh của từng ngành, xem lớn hơn. Ảnh riêng nằm trong ba thư mục ngành. Prompt và nguồn ảnh được lưu trong `review-manifest.json`.
