# Bộ ảnh đầu tư vẽ tay — hoàn tất

Người dùng duyệt phong cách nét mực/bút chì và màu nước trong bộ 12 mẫu. Toàn bộ ảnh dưới đây đã dùng đúng phong cách đó, không dùng lại bộ tả thực đã bị loại.

## Kết quả

- 64 ngành × 4 perk = **256 ảnh riêng**.
- Thêm **1 ảnh công nghệ sạch dùng chung**.
- Tất cả ảnh runtime: WebP 480×320, tối ưu quality 88.
- Asset runtime: `frontend/public/assets/investments/handdrawn-v1/<industry>/<line>.webp`; ảnh chung ở `common/grn.webp`.
- Hàm `investmentArt()` trong `frontend/src/lib/art.ts` ánh xạ ảnh theo ngành/perk. Không còn danh sách giới hạn ba ngành. Đường dẫn có phiên bản để không hiển thị ảnh tả thực cũ từ cache.
- 12 mẫu đã duyệt được tái sử dụng nguyên bản; 244 ảnh ngành còn lại và ảnh chung được tạo mới bằng công cụ image generation tích hợp. Prompt và nguồn ảnh đầy đủ: `investment-art-handdrawn-provenance.json`; kế hoạch 257 asset: `investment-art-handdrawn-plan.json`.

## Kiểm tra thực tế

- Audit tất cả 256 file: **0 thiếu, 0 lỗi giải mã/kích thước, 0 file trùng SHA-256**. Ảnh chung cũng giải mã thành công. 257 khóa ngành/perk duy nhất trong provenance.
- Đã xem đủ 8 bảng tổng hợp có nhãn (32 ảnh mỗi bảng), đối chiếu chủ thể/ngành/perk và phong cách với 12 mẫu được duyệt.
- Dung lượng 256 ảnh riêng: **18.275.430 byte** (~18,3 MB), chưa tính ảnh chung. Trình duyệt không tải toàn bộ bộ ảnh một lúc; màn chơi dùng bốn ảnh của ngành hiện tại và một ảnh chung.
- Frontend build: qua. Lint: exit 0, còn các cảnh báo hook/ref có sẵn; không thêm app dependency.
- Playwright Chromium trên production bundle, dữ liệu Socket.IO mô phỏng: qua ở 1600×1000, 1440×900, 1280×720, 1920×1080, 1024×768, 768×1024, 390×844, 360×640, 844×390. Kiểm tra cả 64 ngành: mỗi ngành đủ 5 ảnh tải/giải mã được, đúng nhãn và có file tương ứng.
- Kiểm tra lại tab/bàn phím, sự kiện, tên dài, số tiền lớn, nút Sang năm, khóa năm, tạm dừng, phá sản/nhận hỗ trợ và kết thúc lượt. Request handler và luật chơi không đổi.
- Ảnh chụp giao diện: `implemented-handdrawn-desktop.png`, `implemented-handdrawn-mobile.png`.

Chưa kiểm tra production multiplayer thật, Safari/Firefox hoặc deploy lên website công khai. Không claim pixel-identical với canvas cũ: đây là thay bộ ảnh theo phong cách vẽ tay mới được người dùng duyệt.

## Cloud

Chưa tạo bucket, DNS, tài khoản hay upload ra ngoài. Ảnh hiện ở `public`, không nhúng vào bundle JavaScript. Khuyến nghị tách ảnh/background/texture sang Object Storage + CDN sau khi chủ dự án chọn dịch vụ và cho phép cấu hình. Icon SVG nhỏ giữ trong code. Phương án Cloudflare R2 + custom-domain CDN và các ranh giới quyền truy cập được ghi trong `asset-hosting-notes.md`.
