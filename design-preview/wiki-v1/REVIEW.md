# Wiki — bản duyệt giao diện và rà soát quy tắc

Ngày 26/10/2026. Chỉ tạo canvas, công cụ kiểm tra độc lập và báo cáo. Không sửa frontend/backend gameplay, không seed database, không deploy.

## 1. Chốt thông tin chi phí và đầu ra từ source hiện tại

Mô hình mới `productionVersion=3`, lượt chơi mới. Giá cơ sở là đơn vị triệu VNĐ. Những lượt lưu cũ có thể còn dùng mô hình cũ. Chưa xác nhận bản đang chạy trên Render hay dữ liệu quản trị đã sửa trong database.

| Ngành | Người/cụm | Tuyển một người | Mở một cụm | Đủ cụm và tổ đầu tiên | Doanh thu cơ sở/năm | Chi phí vận hành | Lãi sản xuất cơ sở |
|---|---:|---:|---:|---:|---:|---:|---:|
| Bán dẫn | 4 | 90 | **500** | **860** | 283,8 | 94,6 | 189,2 |
| Trái cây sấy | 5 | 40 | 220 | 420 | 138,6 | 46,2 | 92,4 |
| Dệt may | 5 | 35 | 170 | 345 | 113,85 | 37,95 | 75,9 |

Không có giá cụm bán dẫn cơ sở 50 triệu trong bảng hiện tại. Nếu màn hình thật hiển thị 50 triệu cần kiểm tra version của lượt, cấu hình giá phòng và dữ liệu preview; không thể kết luận tình trạng bản deploy từ source local.

Các ví dụ trên: một cụm đủ người, không hiệu ứng, không nâng cấp, tình trạng thiết bị 100%, không bị phạt ô nhiễm, không biến động sản lượng/giá bán. Chưa trừ lạm phát tiền mặt, lãi vay và các khoản sự kiện. Không phải lời hứa lợi nhuận mỗi năm hay số liệu thị trường ngoài đời.

### Công thức đang được thực thi

- Cụm hoạt động = min(số cụm, floor(số người / định mức tổ)).
- Sản lượng = floor(cụm hoạt động × 100 × hệ số công nghệ × tay nghề × chất lượng thiết bị × tình trạng × biến động × hệ số sự kiện).
- Công nghệ tăng 0,02 sau năm có sản xuất, trần 3; hệ số = 1 + công nghệ × 0,1.
- Tay nghề = 1 + cấp × 5%; cải tiến máy = 1 + cấp × 8%; cả hai tối đa cấp 5.
- Biến động mặc định: sản lượng 97–103%, giá bán 98–102%, bốc theo điểm phần trăm nguyên. Khi chưa nâng cấp, một cụm mới cho 97–103 sản phẩm, bán 87–92 sản phẩm theo hai đầu dải.
- Tỷ lệ giao hàng = 90% + 10% × (1 − exp(−0,35 × hạ tầng)). Số bán luôn làm tròn xuống.
- Giá bán cơ sở = (giá cụm + định mức người × giá tuyển) × 33% / 90% / 100.
- Doanh thu = số bán × giá bán × hệ số doanh thu sự kiện.
- Chi phí nền = cụm hoạt động × vốn đủ tổ cơ sở × 11%; chia đầu vào 65%, logistics 20%, khác 15%.
- Phụ trợ giảm phần chi phí đầu vào, hạ tầng giảm phần logistics. Cụm chờ người vẫn có phí 0,5% giá cụm/năm, chịu hệ số chi phí.
- Ô nhiễm = clamp(ô nhiễm cũ × 0,9 + cụm hoạt động × hệ số phát thải × 3 − cấp xanh × 1,7, 0,100). Trên 30 bắt đầu giảm giá bán; mức phạt tối đa 35%. Không trừ sản lượng thêm lần nữa.
- Tiền cuối năm còn chịu lạm phát trên tiền dương, lãi vay khi tiền âm, tiền sự kiện hằng năm và sự kiện tức thời. Lịch sử phải giữ biên nhận tiền thực tế, không thay bằng bài công thức.
- Giá mua tăng theo số lần mua, theo từng ngành; ưu đãi thay hóa đơn, không giảm số đơn vị được nhận. Bảng trên không dùng giá mua tăng dần để tính lại giá bán cơ sở.

`probe-results.json` chứa giá, đầu ra và dải dự báo của đủ **64 ngành**, tính trực tiếp bằng hàm production của dự án.

### Hạn chế cần minh bạch

Hiện 64 ngành đều dùng mốc 100 sản phẩm/cụm/năm và lợi nhuận nền 22% vốn đủ tổ. Seed official còn đặt cùng hệ số phát thải 1 cho mọi ngành. Giá và tổ người khác nhau, nhưng công nghệ sản xuất chưa thật sự đa dạng theo ngành. Chi phí tuyển là gói bổ sung nhân lực, không phải lương tháng; opex hiện được tính gộp, chưa có dòng lương riêng.

Đề xuất vòng cân bằng tiếp theo: quy định đơn vị đầu ra và năng suất theo nhóm ngành (lô hàng, đơn dịch vụ, sản phẩm), ghi rõ vốn mở cụm là gì, tách lương và vận hành trong Wiki. Không tự nhận mô hình này là mô phỏng chi phí thật. Không thay các hệ số trong lượt duyệt này.

## 2. Phạm vi rà soát sự kiện

Đọc pipeline seed.ts → official/event-types/family → catalog → runtime/applyPatch/production/succession. Kiểm kê toàn bộ seed hiện tại:

- 64 ngành × 20 gốc = **1.280 sự kiện ngành**.
- Mỗi gốc có 8 ngữ cảnh (gốc + 7): **10.240 biến thể ngành**. Đây không phải 10.240 cơ chế độc lập.
- **100 sự kiện chung**, thêm **8 lời dẫn theo địa phương/bối cảnh** (không phải thêm lượt bốc).
- **8 sự kiện gia đình**; có trait riêng, không đánh giá chúng là vô tác dụng chỉ vì `visual=none`.
- Tổng **10.348 hàng sự kiện seed** trong CSV/JSON. Ngoài ra xem riêng nhánh hệ thống: tử vong, trăm năm, hỗ trợ được duyệt, giải ngân khởi động lại, 5 kết quả chuyển giao. Không tính những nhánh runtime này như hàng seed.
- Mọi ID gốc/biến thể trong kiểm kê đều tìm được khóa artwork qua gốc. Dùng thư viện 84 ảnh tĩnh vẽ tay đã có; không tuyên bố mỗi biến thể có ảnh độc quyền.
- `pack.ts.EVENTS` là danh sách legacy, seed hiện chỉ lấy QUESTIONS từ pack; không cộng danh sách legacy này vào tổng 10.348. Database cũ có thể vẫn còn hàng khác vì upsert không tự xóa; chưa truy cập DB thật.

Danh sách đầy đủ và cờ kiểm tra: `event-inventory.csv`, `event-inventory.json`. Các con số cộng/trừ trong inventory là **mốc seed**, không phải kết quả đã bốc: runtime bốc quanh mốc khoảng 80–120%, làm tròn %; thời hạn năm cũng được bốc. Ngữ cảnh và scale phòng ảnh hưởng kết quả cuối.

## 3. Lỗi/độ lệch xác nhận từ code và kiểm tra trực tiếp

### A. 13 sự kiện chung có câu chuyện nhưng không có tác động kinh tế

Chúng không có authored effect, visual `none` đi vào payload trung tính: output/price/inflation=1, không cộng/trừ gì. Ví dụ `tec-may-hong` (Một máy chủ lực hỏng giữa ca), `peo-ky-su-nghi`, `pol-thue-tang`, `mkt-tra-cham`.

Đề xuất: khai báo tác động theo nội dung, không dùng visual/ảnh quyết định cơ chế. Máy hỏng nên tác động tình trạng/công suất; thuế tác động chi phí; trả chậm tác động dòng tiền có thời điểm hoàn trả. Đây là đề xuất cần làm sau duyệt.

### B. 11 sự kiện chung mở rộng mang phần thưởng cụm lẻ

Payload expansion cũ có machinesAdd 0,35 × mức nặng/nhẹ và cash âm. Với severity 1 hoặc 2, cụm mới làm tròn thường thành 0; trực tiếp thử severity2/seed1: **mất 126,10 triệu nhưng số cụm vẫn là 1**. Vẫn có giá bán tăng tạm, nên không gọi là hoàn toàn không thưởng; nhưng câu chuyện “dây chuyền mới vào guồng” không đúng với tài sản nhận.

Ví dụ `tec-day-chuyen`, `tec-cong-nghe-moi`, `mkt-mo-xuong`, `pol-quy-hoach`. Danh sách đủ trong CSV. Cần đổi sang tặng cụm nguyên có điều kiện, hoàn tiền, hoặc ưu đãi mua cụm; không cho toàn bộ quà máy miễn phí vô điều kiện.

### C. 1.938 biến thể có tác động hỗn hợp nhưng bị đánh dấu tốt

Generator đặt good=true khi investmentPct<0, dù bản gốc vẫn có doanh thu âm/chi phí tăng/tài sản giảm. Ví dụ `chip-ban-dan-01--local-supplier`: mốc doanh thu −24%, giá đầu tư −12%. Không thể chỉ thông báo lợi ích xanh.

Đề xuất ba trạng thái lợi/hại/hỗn hợp và hiện cả hai kết quả; không đổi nhãn gốc theo riêng phần giảm giá. Cờ này chỉ đếm điều kiện có thể xác định từ số liệu, không khẳng định đã đánh giá toàn bộ tác động gián tiếp.

### D. 193 gốc, tức 1.544 biến thể, có cashPerYear không gắn sản xuất

Ví dụ `chip-ban-dan-02` mốc +150 triệu/năm, 3 năm. Thử state 0 công nhân, 0 cụm, 0 sản phẩm vẫn nhận **163 triệu** sau bốc, khi tắt lạm phát để cô lập kiểm tra. Các mốc ngành toàn bộ từ −200 đến +250 triệu/năm, còn nhân scale mô hình.

Trợ cấp/thừa kế có thể cộng tiền không cần sản xuất; **đơn hàng** thì không nên tự sinh tiền khi chưa có hàng giao. Cần tách đơn hàng tăng nhu cầu/doanh thu từ sản lượng thực, trợ cấp độc lập và chi phí pháp lý. Đây là rủi ro cân bằng, không phải mọi cashPerYear đều sai.

### E. 181 gốc, tức 1.448 biến thể, thay % tài sản bằng co giãn hiện vật

assetsPct đang nhân tiền, người, cụm, phụ trợ, hạ tầng, xanh; người/cụm được làm tròn. Một cụm/4 người, bốc mất32% tài sản → vẫn1 cụm nhưng còn3 người: mất khả năng chạy cả cụm, thiệt hại sản lượng100%, không phải32%. Ở quy mô khác mức tác động lại khác; phần chất lượng/công nghệ không bị co cùng kiểu.

Đề xuất dùng sổ giá trị cho giảm định giá, còn sự kiện mất thiết bị/người phải nêu số nguyên cụ thể; dự báo tác động vận hành trước khi chấp nhận. Giữ các kết quả chuyển giao riêng, không đồng nhất chúng với hiệu ứng kinh tế thông thường.

### F. Hiệu ứng thứ13 đẩy hiệu ứng còn hạn ra khỏi danh sách tính

`applyPatch` dùng slice(0,12). Probe thêm13 hiệu ứng 3 năm xác nhận còn12 và hiệu ứng đầu mất. Đây là trần logic, không chỉ trần hiển thị.

Đề xuất giữ toàn bộ hiệu ứng đang có hiệu lực, gộp phần hiển thị theo nhóm; giới hạn số hiệu ứng mới/chống lặp phải là luật công khai, không xóa ngầm hiệu ứng cũ.

### G. Sự kiện riêng ngành có thể lan cả lớp theo đội chốt năm

`drawYearEvents` bốc cờ classWide; `advanceYear` lấy sự kiện đầu rồi applyEvent cho các đội khác, không xét lại eventApplies/ngành/điều kiện. Sự kiện của bán dẫn có thể áp sang dệt may; đội chốt nhanh phát sinh nhiều lần tung rủi ro chung và làm thay đổi đội chốt chậm theo thời gian thực.

Đề xuất tách bộ sự kiện chung khỏi bộ riêng ngành; sự kiện chung theo một lịch/phút chung của phòng hoặc mốc vòng đồng bộ, mỗi mốc áp một lần, sau đó thời hạn vẫn tính năm. Không cho đội khác tự kích hoạt việc áp thêm sốc cho mình. Chưa thay luật năm hay đồng hồ trong lượt này.

### H. Trait gia đình kèm hiệu ứng visual phụ không đúng nghĩa

seedFamily vẫn dùng effectPayload(visual,severity). `fam-bao-benh` không chỉ tăng rủi ro mà còn nhận payload epidemic (giảm sản lượng, đổi giá, trừ tiền); `fam-dao-tao` nhận expansion trừ tiền + cụm lẻ. Cần chỉ định tác động từng trait và công khai mọi hiệu ứng phụ. `fam-quy` có câu “dù chủ qua đời… không phá sản” dễ hiểu sai: quỹ chặn kết quả bankrupt khi chuyển giao; tử vong vẫn kết thúc lượt. Runtime đã sửa lời dẫn trường thọ/bạo bệnh nhưng copy quỹ/đời sau vẫn cần rà lại khi triển khai.

## 4. Rủi ro cân bằng khác (chưa phải kết luận mô phỏng)

- Hệ số hiệu ứng nhân nhau, không cộng: +20% ba lần = +72,8%; −20% ba lần = −48,8%. Mỗi % bốc vẫn nguyên, nhưng kết quả nhân có số lẻ là bình thường. Cần giới hạn nhóm cộng dồn và hiện tổng tác động; không tự làm tròn lại luật năm 0,2/0,25 điểm%.
- Túi bốc tránh lặp ID nhưng 8 biến thể cùng gốc là 8 ID, vẫn có thể gặp cùng câu chuyện liên tiếp. Cần cooldown theo gốc/nhóm và ngăn hai trạng thái đối nghịch vô nghĩa.
- 7 ngữ cảnh giá đầu tư được nhân chéo mọi gốc, kể cả nội dung ít liên quan; ưu đãi “mua sắm xanh” hiện giảm tất cả 5 hạng mục. Cần phạm vi theo loại đầu tư, không áp giảm giá nhân lực vì giảm thuế máy.
- Lạm phát đang trực tiếp trừ tiền đang giữ; một sự kiện tăng doanh thu có thể vẫn cho tổng tiền năm âm. Wiki phải phân biệt lãi sản xuất và biến động tiền cuối năm.
- Bạo bệnh cộng phần rủi ro mạnh hơn nhiều mức tăng hằng năm; nên có bệnh trạng nhẹ/nặng, thời hạn hoặc cơ hội hồi phục đối ứng. Không tăng/giảm xác suất trước khi mô phỏng.
- Bảo hiểm có mốc2.000 triệu ×scale, có thể lớn hơn nhiều cụm của doanh nghiệp nhỏ, dù chỉ chi khi kết thúc lượt. Cần định phí/giới hạn quyền lợi hoặc tính trên giá trị bảo hiểm.
- 64 ngành có cùng22% suất sinh lời nền và nhiều hệ số giống nhau: giá khác chưa tạo đủ chiến thuật khác. Cần cân bằng theo nhóm đầu ra, không chỉ đổi ảnh/tên.

## 5. Thiếu loại nào, nên thêm gì?

Không thiếu số lượng tổ hợp; thiếu cơ chế phù hợp mô hình cụm/chất lượng mới. EffectPatch hiện không có trường trực tiếp workerSkill, machineQuality hoặc condition. Các đề xuất sau cần mở cơ chế sau duyệt, chưa có trong game:

| Nhóm | Đề xuất có lợi | Đề xuất bất lợi | Điều kiện/cách chống bất công |
|---|---|---|---|
| Tay nghề | Hoàn tất đào tạo, giảm phế phẩm | Nhân sự chủ chốt nghỉ, cần tuyển bù | Chỉ xuất hiện khi có lao động; biến động người nguyên, rõ số thiếu |
| Thiết bị | Hiệu chuẩn tăng chất lượng | Hao mòn, hỏng một cụm | Chỉ khi có cụm; bảo trì tốt giảm mức hại; luôn có phương án sửa |
| Khởi nghiệp | Hợp đồng thử, hỗ trợ tuyển tổ đầu | Chậm giao thiết bị | Không đánh sập đội chưa có nguồn thu; thưởng đơn hàng theo hàng giao |
| Chuỗi cung ứng | Hợp đồng cung ứng dài hạn | Nhà cung cấp giao thiếu | Phụ trợ tốt giảm rủi ro/mức thiệt hại; không triệt tiêu hoàn toàn |
| Logistics | Kho mới giảm thất thoát | Lỡ chuyến, chậm thanh toán | Hạ tầng tốt có tác dụng rõ; tiền chậm có lịch nhận lại |
| Môi trường | Chứng nhận xanh, hoàn phí xử lý | Kiểm tra, yêu cầu khắc phục | Dựa ô nhiễm thực; cảnh báo trước; không phạt doanh nghiệp sạch như nhau |
| Tài chính | Bảo lãnh đơn hàng, giảm lãi | Khoản phải thu, nợ đến hạn | Gắn quy mô tiền thật; cap theo doanh thu/vốn; không tặng tiền vô hạn |
| Sức khỏe/quản trị | Hồi phục, người điều hành dự phòng | Bệnh tạm thời, tranh chấp | Cặp đối ứng với bệnh/trait; giải thích kết thúc lượt trong Wiki |
| Sự kiện lựa chọn | Nhận đơn gấp/thuê ngoài/mua bảo hiểm | Đổi chi phí chắc chắn lấy rủi ro | Lựa chọn không chặn tốc độ vô hạn; không mở chồng câu hỏi |

Đề xuất thứ tự: sửa A–H trước → thêm điều kiện/cooldown/phạm vi → mô phỏng nhiều seed theo cùng ngân sách/chiến lược và độ dài trận → chỉ sau đó thêm nhóm cơ chế mới. Chưa chốt xác suất/mức thưởng mới khi chưa có số liệu cân bằng.

## 6. Canvas và chuyển thông tin khỏi gameplay

Các canvas01–06 là bản duyệt, không phải UI tương tác. Giữ cảm giác game: khung vàng, giấy kem, ảnh vẽ tay. Logo raster hiện có sẽ được tái sử dụng khi code; logo trong canvas chỉ minh họa phong cách, không đề nghị đổi thương hiệu.

- Wiki ở navbar trang chủ; mục lục6 nhóm, tìm theo ngành/nâng cấp/sự kiện.
- Bảng ngành đủ64: định mức,5giá đầu tư, chất lượng, đầu ra, chi phí, sự kiện liên quan. Canvas chỉ minh họa vài hàng; probe có đủ64.
- Mỗi nâng cấp: lợi ích trực tiếp → liên kết với hạng mục khác → điều kiện → công thức gấp gọn → ví dụ.
- Mỗi sự kiện: ảnh tĩnh đã duyệt, phạm vi, điều kiện, tác động ngẫu nhiên trong khoảng, thời hạn năm, thời điểm áp dụng, cộng dồn, tương tác bảo vệ. Quy tắc dự kiến ghi rõ Đề xuất, không trình bày là đã có.
- Gameplay bỏ dải “Xem cách tính…” và đoạn hướng dẫn dài. Chỉ giữ chi phí, số người/cụm/sản phẩm thay đổi, số còn thiếu để hoạt động, tác động tiền/hiệu ứng và biên nhận năm. Không xóa số còn thiếu vì đó là trạng thái cần hành động, không phải bài giảng.
- Mobile dùng tìm kiếm, mục lục thu gọn và bài viết một cột; tránh nhiều khung cuộn lồng nhau. Bài Wiki vẫn được cuộn trang để đọc đầy đủ.

## 7. Đã kiểm tra, chưa kiểm tra

Đã chạy `python design-preview/wiki-v1/audit.py`: quét toàn bộ10.348 hàng, thống kê tác động, flags, artwork. Đã chạy `node --import tsx design-preview/wiki-v1/probe.mts`: công thức64ngành, ví dụ đầu ra, cash0cụm, làm tròn tài sản/cụm, trần12hiệu ứng. Các probe chỉ ghi artifact, không đụng DB/state thật. Xem trực tiếp canvas bằng view_image.

Không chạy build/lint vì không sửa code ứng dụng. Không kiểm thử browserresponsive: chưa có implementationWiki. Mobile là canvas, không phải bằng chứng responsive đã chạy. Chưa kiểm tra DB/Render, chưa mô phỏng hàng nghìn trận/đánh giá thắng thua theo ngành; vì vậy các rủi ro cân bằng ở mục4 là suy luận từ công thức, không phải kết luận thống kê. Chưa xóa hướng dẫn hay áp thay đổi gameplay.
