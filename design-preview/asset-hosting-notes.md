# Lưu ảnh game trên cloud — đề xuất, chưa triển khai dịch vụ ngoài

## Hiện tại

Ảnh runtime ở `frontend/public/assets/`, không nhúng vào JavaScript. Trình duyệt chỉ tải ảnh được màn hình hiện tại dùng (4 ảnh ngành + 1 ảnh công nghệ sạch), không tải cả 256 ảnh cùng lúc.

Lưu vài trăm ảnh WebP tối ưu trong `public` vẫn dùng được. Hạn chế chính là dung lượng và lịch sử Git, thời gian chuyển artifact khi deploy, và việc phải phát hành lại asset cùng frontend. Không phải mọi ảnh trong `public` đều làm tăng dung lượng JavaScript.

## Phương án phù hợp

- Ảnh minh họa, background, texture: Object Storage + CDN. Đề xuất Cloudflare R2 với tên miền asset riêng; AWS S3 + CloudFront cũng đáp ứng mô hình này.
- Icon SVG nhỏ, icon điều khiển: giữ trong code để dễ đổi màu/kích thước và không cần thêm request cho từng icon.
- Bản ảnh gốc: giữ kho lưu trữ riêng; chỉ phát hành WebP đã tối ưu.
- Code giữ đường dẫn hoặc manifest nhỏ. Không cần lưu ảnh dưới dạng base64 hay ghi blob ảnh vào database.

Ví dụ tên miền **chưa được cấu hình**: `assets.neoforcelab.com`. Cấu trúc key có phiên bản: `game/handdrawn-v1/man-hinh/mac.webp`. Khi thay cả phong cách, dùng phiên bản mới để tránh cache ảnh cũ.

Cloudflare xác nhận custom domain cho phép dùng cache của Cloudflare để phân phối R2; `r2.dev` dành cho môi trường không phải production. Nguồn: https://developers.cloudflare.com/r2/buckets/public-buckets/

S3 có thể làm origin cho CloudFront, và origin access control có thể giới hạn việc truy cập S3 trực tiếp. Nguồn: https://docs.aws.amazon.com/AmazonCloudFront/latest/DeveloperGuide/DownloadDistS3AndCustomOrigins.html

## Trước khi chuyển thật

1. Chủ dự án chọn dịch vụ/tài khoản và cho phép tạo bucket, tên miền và upload.
2. Upload bản tối ưu; chỉ bật quyền đọc công khai cho bộ asset cần công khai. Quyền ghi không đưa ra trình duyệt.
3. Cấu hình HTTPS, cache theo phiên bản, kiểm tra URL và ảnh thiếu. Có thể thêm cấu hình asset base URL sau khi đã có endpoint thật.
4. Kiểm thử production, rồi mới cân nhắc đưa các file runtime khỏi Git. Không xóa/ignore bản local trước khi đã upload và kiểm chứng bản cloud.

**Không có tài khoản, bucket, DNS, credential, upload hay cấu hình cloud nào được tạo/thay đổi trong lượt tạo ảnh này.**
