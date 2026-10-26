# Landing và Wiki — bàn giao ngày 26/10/2026

## Kết quả

- `/`: landing mới theo phong cách đỏ rượu, giấy kem, tranh vẽ tay và ảnh chữ đã duyệt.
- `/wiki`: Wiki riêng, sáu mục theo canvas `design-preview/wiki-v1/01…06`.
- Tạo phòng chỉ có trên navbar, cạnh Đăng nhập/Đăng xuất. Không có section dành riêng cho host bên dưới. Người chưa đăng nhập chọn Tạo phòng phải qua Google trước khi mở cấu hình; chọn Đăng nhập riêng không tự mở cấu hình.
- Form mã phòng luôn hiển thị trong hero; giữ kiểm tra mã → nhập tên đội → vào sảnh, handler/payload cũ. Nhập Enter và bấm nút đều được kiểm tra.
- Logo và tiêu đề hero dùng ảnh chữ tạo bằng Image Gen. Nội dung chữ public được vẽ bằng SVG path; giữ tên truy cập qua aria-label. Các ô nhập/select và nút Google chính thức vẫn là điều khiển native để nhập liệu, chọn mục và đăng nhập.
- Khung public mới `frontend/public/assets/landing-v2/public-frame.webp`, không dùng bộ `ui/painted-frames-v1` của gameplay. Dùng 9-slice để giữ góc khi responsive; style chỉ áp trong public-site.
- Ảnh có draggable=false; chặn drag/contextmenu ở ảnh, SVG và khung public. Các ô nhập vẫn có menu chỉnh sửa. Đây là hạn chế thao tác UI, không phải bảo vệ tài nguyên khỏi DevTools.
- Bỏ caption công thức trên ảnh nhà máy, đoạn giải thích định mức dài và phần dạy công thức sản lượng trong gameplay. Giữ số nhận được, chi phí, số còn thiếu, dự báo và biên nhận tiền. Không sửa công thức backend hay cân bằng sự kiện trong đợt triển khai này.

## Dữ liệu Wiki

`frontend/src/lib/wiki-catalog.json` là snapshot quy tắc mới, tạo bởi `node --import tsx scripts/build-wiki-catalog.mts` từ seed và industry-economy thật. Khi đổi quy tắc phải tạo lại snapshot trước build/commit. Build frontend Linux dùng JSON đã tạo; không cần chạy PowerShell hay có font Windows.

64 ngành; 1.280 sự kiện ngành gốc + 100 chung + 8 gia đình = 1.388 gốc. 8 biến thể mỗi gốc ngành tạo thành 10.348 hàng seed tổng cộng. Các ngữ cảnh được chọn trong chi tiết sự kiện, không ép danh mục thành 10 nghìn thẻ trùng nhau. 8 lời dẫn theo vùng/bối cảnh và các nhánh hệ thống được trình bày riêng. Ảnh sự kiện tái sử dụng bộ 84 tranh tĩnh đã duyệt.

Wiki có định mức, giá từng ngành; công suất, số giao, giá bán; chi phí, ô nhiễm, định giá; tăng giá theo số gói, đào tạo/cải tiến/bảo dưỡng; tác động sự kiện, ngẫu nhiên, thời hạn và cộng dồn; tử vong, chuyển giao, hỗ trợ và câu hỏi. Các ví dụ là mức cơ sở, không thay dữ liệu dự báo thật trong gameplay và không phải số liệu thị trường.

## Hai lỗi đã sửa

1. TS2352: JSON chỉ suy ra mảng `(string|number)[]`, không suy ra tuple. Chuyển qua unknown vào kiểu tuple được kiểm chứng bởi script kiểm tra dữ liệu. TS7006: định kiểu tường minh tham số lời dẫn.
2. Chữ `?`: hashtable PowerShell không phân biệt hoa/thường làm mất a/A và các cặp chữ; thêm vào đó thiếu Ơ/ơ/Ư/ư trong dải xuất. Dùng Dictionary Ordinal, bổ sung đầy đủ tiếng Việt và ký hiệu công thức. `check-public-lettering.cjs` kiểm tra cả dữ liệu Wiki lẫn copy nguồn, không chỉ vài từ mẫu. Đã sửa CSS sr-only bị thiếu để chữ ẩn không chồng lên ảnh tiêu đề.

## Ảnh tạo mới và nguồn

`prompts.json` giữ bộ prompt, `asset-sources.json` giữ nguồn tool, `frontend/public/assets/landing-v2/manifest.json` giữ kích thước/bytes. Dùng built-in image_gen, không gọi API hay thêm dependency.

Các ảnh production: hero-art, brand-logo, hero-title, step-1/2/3, book, public-frame, wine, paper. Nguồn atlas/texture cũng được giữ lại. `scripts/prepare-public-art.py` xuất WebP, tách atlas và tile vật liệu; không cắt ảnh canvas để giả làm UI. Canvas và PNG kiểm thử chỉ ở design-preview.

## Kiểm tra thực tế

- Build frontend: thành công. Còn cảnh báo chunk trên 500 kB, không chặn build.
- Lint frontend: exit 0, còn cảnh báo React có sẵn; không gọi đây là lint sạch cảnh báo.
- `node scripts/check-public-lettering.cjs`: 186 ký tự cần dùng, cả regular/bold, phân biệt chữ hoa và chữ thường, đủ dấu tiếng Việt.
- `node --import tsx scripts/check-public-catalog.mts`: đủ64 profile và giá; đủ1.388 gốc/10.348 mở rộng; mọi ảnh ngành, đầu tư và sự kiện có file.
- `node scripts/public-pages.qa.cjs`: production bundle trong Chromium; 21 màn hình = landing + 6 trang Wiki × 390/768/1440px, thêm chi tiết sự kiện. Kiểm tra không tràn ngang, không control bị cắt, ảnh không lỗi, không public-page runtime error. Auth/join/create dùng API và Google mô phỏng; có kiểm tra header phiên và payload tạo phòng.
- `node --import tsx scripts/intro-flow.qa.cjs`: hồi quy gameplay ba kích thước, intro, mua gói/ưu đãi, số nguyên, nhóm lao động, nâng chất lượng/bảo dưỡng, hiển thị lịch sử, trạng thái kết thúc, chặn kéo ảnh. Đã cập nhật selector logo public mới và kiểm tra menu ô nhập được giữ.
- `git diff --check` phần source đã sửa: không lỗi whitespace.

IAB localhost timeout và Chrome không khả dụng qua công cụ. Chromium dùng route.fulfill phục vụ file production từ dist vì truy cập mạng localhost trong browser sandbox bị chặn; chạy JS/DOM thật, không phải ảnh mock được trình bày như implementation. Nginx hiện có SPA fallback cho /wiki. Chưa chạy Docker build, chưa deploy Render, chưa đăng nhập Google thật hoặc tạo phòng trong DB thật.

## Đối chiếu thiết kế

So sánh bằng view_image giữa canvas cuối `02-landing-final.png`, canvas Wiki và ảnh browser trong verification. Các điểm đối chiếu: cấu trúc navbar/logo/CTA, title và dấu tiếng Việt, màu đỏ–kem–vàng, tranh vẽ tay, hero có form vào phòng, thứ tự các section, mục lục sáu mục, kích thước chữ/khoảng cách và cách xếp một cột trên mobile. Sau override mới của người dùng: bỏ strip host, thêm Đăng nhập/Đăng xuất, dùng khung public riêng. Nội dung phải lấy dữ liệu thật thay cho câu mẫu; các controls nhập liệu/Google được giữ native. Những khác biệt này là chủ đích, không phải cam kết pixel-identical với ảnh raster ban đầu.

Đã sửa mất hoa/thường, thiếu ký tự, chữ ẩn bị lộ, lớp ảnh hero bị chìm và các selector QA cũ. Browser proof cuối kiểm chứng implementation theo cấu trúc và phong cách đã duyệt cùng các override mới; không tuyên bố 100% từng pixel. Chưa kiểm tra thiết bị iOS/iPad thật hoặc trình đọc màn hình thật.

## Rà soát cân bằng

Xem `../wiki-v1/REVIEW.md`, CSV/JSON inventory và probe-results. Nổi bật:13 sự kiện chung trung tính dù kể có tác động;11 sự kiện mở rộng dùng cụm lẻ;1.938 biến thể tốt/hại hỗn hợp bị nhãn tốt; tiền đơn hàng có thể trả khi0cụm; làm tròn tài sản gây đứt tổ; trần12 hiệu ứng xóa hiệu ứng còn hạn; sự kiện riêng ngành có thể lan sang ngành khác; trait kèm payload visual phụ.

Các phát hiện đã được báo cáo, **chưa sửa cân bằng**, chưa mô phỏng nhiều nghìn trận. Giá bán dẫn cơ sở500 triệu/cụm +4×90 triệu người =860 triệu; không phải50 triệu/cụm. Các ngành hiện cùng100 đơn vị đầu ra chuẩn, khác giá và tổ người; mức nền một cụm bán dẫn doanh thu283,8, vận hành94,6, lãi sản xuất189,2 triệu trước các khoản khác.
