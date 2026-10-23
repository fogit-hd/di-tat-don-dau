# Đi Tắt Đón Đầu

Trò chơi trên lớp về công nghiệp hóa. Nhóm trình chiếu mở phòng, mỗi điện thoại là một đội. Máy chủ giữ đồng hồ phiên (mặc định 15 phút). Mỗi đội sang một năm khi bấm nút chính. Không bấm thì năm của đội đó tự sang sau số giây chủ phòng chọn, mặc định 60. Số này lấy từ bảng cân bằng `yearSeconds` và lưu trên phòng thành `cycleSeconds`.

Bản này chơi được từ đầu đến cuối: tạo phòng, mã và QR, đếm 3 giây, chia chủ đề, nhập vai, đầu tư, nút sang năm, sự kiện trên cảnh nhà máy, bảng xếp hạng và màn kết.

Nội dung chơi (ngành, vùng, quy mô, bối cảnh, kịch bản nhập vai, hướng đầu tư, câu hỏi, sự kiện, kết cục, hệ số cân bằng) nằm trong PostgreSQL. Code chỉ đọc các dòng đó. Thêm ngành hoặc câu hỏi bằng cách thêm dòng, không sửa code máy chơi.

## Chạy bằng Docker

Cần Docker Desktop.

```bash
docker compose up --build
```

Mở http://localhost:4517

Container web là nginx: bản tĩnh, và chuyển `/api` cùng Socket.IO sang API. Điện thoại chỉ cần một địa chỉ.

Postgres local nằm trong compose (cổng `54329`, user/password/db đều là `chip`). Không phải addon Northflank. Lần đầu container backend tự migrate và nạp seed vì `SEED_ON_BOOT=1`.

API: http://localhost:4607/health

## Chạy trên máy khi đang sửa code

Chỉ bật Postgres, rồi chạy API và web bằng npm (Windows không cần bash):

```bash
docker compose up postgres -d
copy backend\.env.example backend\.env
npm install
npm run db:generate
npm run db:migrate
npm run db:seed
npm run dev
```

Trên macOS hoặc Linux, đổi `copy` thành `cp`. Web cổng 4517, API cổng 4607. Khi sửa code bằng `npm run dev`, Vite chuyển `/api` và Socket.IO sang API.

`DATABASE_URL` và `DIRECT_URL` trên máy local trỏ cùng một Postgres. `schema.prisma` dùng URL thứ nhất lúc chạy và URL thứ hai lúc migrate. Addon Northflank chỉ cần `DATABASE_URL`; image backend tự chép sang `DIRECT_URL` nếu biến đó trống. Muốn để bảng trong schema riêng, thêm `?schema=ditatdondau` vào cả hai URL (mục Supabase bên dưới).

## Nội dung trong cơ sở dữ liệu

Seed đọc `backend/prisma/seed/` (file dữ liệu, không được import bởi code đang chạy). `npm run db:seed` chỉ upsert các id có sẵn. Dòng bạn tự thêm với id mới được giữ. Chạy seed lại sẽ ghi đè các id của gói mẫu.

| Bảng | Thêm gì |
| --- | --- |
| `Industry` | Ngành: hệ số, lời nhập vai gốc, đơn vị, slug ảnh `art` |
| `IndustryDirection` | Nhãn 4 hướng `eng`, `mac`, `sup`, `inf` của ngành đó |
| `IndustryNamePattern` | Mẫu tên nhà máy, có `{{region}}` |
| `Region`, `Scale`, `Context` | Vùng, quy mô (kèm `roleTemplate`), bối cảnh và vốn/máy ban đầu |
| `Scenario` | Nhập vai riêng cho một tổ hợp ngành/vùng/quy mô/bối cảnh. Ô để trống nghĩa là “mọi giá trị”. Dòng cụ thể hơn được chọn. |
| `CopyTemplate` | `themeName`, `mission` — mẫu ghép chủ đề |
| `InvestmentLine` | Nhãn, gợi ý và câu nhật ký của `eng` `mac` `sup` `inf` `grn` |
| `QuestionType` | Tiêu đề loại câu (`mc`, `tf`, `match`, `fill`, hoặc loại mới) |
| `Question`, `QuestionOption` | Câu hỏi và mọi cách diễn đạt. `correctOptionId` là `key` của đáp án |
| `GameEvent` | Sự kiện của một ngành, hoặc một loại dùng chung. Trong seed, mã hình là `visual` (`storm`, `rain`, `flood`, `drought`, `heatwave`, `fog`, `pollution`, `fire`, `power_outage`, `strike`, `expansion`, `boom`, `epidemic`, `earthquake`, `cyber`, `scandal`, `market_crash`, `none`), kèm `severity` 1–3 và cờ `good`. Sự kiện riêng từng ngành nằm trong `industries.seed.json`. Khoảng 80 loại chung, có `variants` lời theo vùng hoặc bối cảnh, nằm trong `events.seed.json` |
| `EventIndustryTag`, `EventContextTag` | Ngành và bối cảnh mà một loại sự kiện được rút. Không có dòng bối cảnh nghĩa là mọi bối cảnh |
| `EventVariant` | Lời sự kiện riêng cho một ngành |
| `EventNarration` | Lời theo vùng hoặc bối cảnh (`variants` trong `events.seed.json`). Ô vùng hoặc bối cảnh để trống nghĩa là mọi giá trị của chiều đó |
| `EventChoice` | Phương án, `patch` là JSON hiệu ứng |
| `Ending` | Kết cục và ngưỡng. `sort` nhỏ được xét trước. `isDefault` là kết cục còn lại |
| `BalanceConfig` | Một dòng `id = default`, payload là mọi hệ số |

Sau khi thêm dòng, gọi lại nội dung (không cần sửa code):

```bash
curl -X POST http://localhost:4607/api/content/reload -H "x-reload-token: dev-reload"
```

Khởi động lại API cũng nạp lại. Đặt `CONTENT_RELOAD_TOKEN` trên server. Không đặt thì đường `/api/content/reload` trả 404.

Chủ đề không được ghi thành hàng. Khi một đội vào trận, máy chủ ghép một tổ hợp còn trống: ngành × vùng × quy mô × bối cảnh × một tình huống mở đầu của ngành × một mảnh tên nhà máy. Gói seed hiện có 64 ngành, 16 vùng, 3 quy mô, 12 bối cảnh, 4 tình huống mỗi ngành và 20 mảnh tên, tức 2.949.120 chủ đề. Id dạng `chip-ban-dan.<vùng>.<quy mô>.<bối cảnh>.<tình huống>.<tên>`. Không hai đội trong một phòng trùng chủ đề. Code đang chạy không đọc file JSON. Chỉ `prisma/seed` nạp các phần đó vào Postgres.

Mỗi đội bấm nút để sang một năm. Không bấm thì năm tự sang sau `cycleSeconds` (mặc định 60, chủ phòng chỉnh từ 10 đến 180). Sau mỗi năm, nút khóa `yearMinSeconds` giây (mặc định 10, chủ phòng chỉnh, không dài hơn một năm) để cảnh kịp diễn. Hết `durationSec` của phòng (mặc định 15 phút) thì mọi đội dừng. Xác suất chủ nhà máy qua đời nằm trong `SuccessionOdds`: gần như không xảy ra trước khoảng năm 20, rồi tăng dần. Lý do nằm trong `SuccessionReason`. Năm kết cục `bankrupt`, `squander`, `steady`, `prosper`, `double` nằm trong `HeirOutcome`. Trọng số lúc rút phụ thuộc sức khỏe công ty tại năm đó: `SuccessionGauge` tính tỷ lệ dự trữ (`cash / giá trị`) và tỷ lệ nợ (hệ số phụ thuộc cộng đòn bẩy khi tiền mặt không phủ giá trị); `HeirHealthWeight` cộng trọng số khi dự trữ cao và nợ thấp (nghiêng `prosper`/`double`) hoặc khi vay nặng (nghiêng `bankrupt`). Sự kiện `team:succession` chỉ gửi cho đội đó và chủ phòng, với `teamId`, `year`, `causeText`, `outcome`, `assetsBefore`, `assetsAfter`, `finished: true`. Đội đó chốt tài sản ngay và dừng; các đội khác chơi tiếp đến hết giờ. Mỗi lần sang năm, máy chủ tính kinh tế rồi rút sự kiện. `yearEventChance` mặc định 0.6. `yearExtraChance` mặc định 0.28 cho sự kiện thứ hai, không quá `yearMaxEvents` (2). `yearMinEvents` mặc định 0: năm yên chỉ có mây. Khói chỉ hiện khi `anchors.smoke` có điểm. Xe chỉ chạy khi `anchors.road` khác null. `classEventChance` (0.12) đôi khi áp sự kiện vừa rút cho các đội khác. Túi của mỗi đội gồm sự kiện riêng của ngành và các loại dùng chung khi tag ngành và bối cảnh khớp. Năm mã mới `epidemic`, `earthquake`, `cyber`, `scandal`, `market_crash` có lớp hoạt họa trên hiện trường, không chữ. Trên màn chơi, mỗi năm là một dòng tình huống và các nút hướng đầu tư. Chạm dòng đó mới thấy lời giải thích. Mỗi ngành có 20 sự kiện trong `industries.seed.json`. `title` là dòng ngắn. `description` là lời khi chạm. `tone` là `good` hoặc `bad`.

Khóa JSON của `effect` và `patch` (mảng hai số `[nhỏ, lớn]`): `durationSec`, `outputMul`, `priceMul`, `inflationMul`, `cash`, `cashPct`, `engineersAdd`, `engineersPct`, `machinesAdd`, `machinesPct`, `tech`, `support`, `pollution`, `dependency`. `patch` của lựa chọn thêm `visual`, `title`, `body`, `exposure` (`machines`, `engineers`, `cash`, `pollution`, `any`).

Năm hướng đầu tư cố định về cơ chế: `eng`, `mac`, `sup`, `inf`, `grn`. Bốn hướng đầu lấy nhãn theo ngành. Tên hiển thị nằm trong bảng. Thêm một cơ chế thứ sáu vẫn cần code.

Ảnh nhà máy: `frontend/public/assets/industries/<slug>/factory-1.webp`, khổ 1600×900. Đủ 64 ngành, slug trùng seed. Ngành chip dùng slug `chip-ban-dan` (tên "Sản xuất chip bán dẫn"). `backend/prisma/seed/anchors.json` có 64 mục, ghi vào cột `anchors`: điểm phần trăm từ góc trên trái (`smoke`, `roof`, `door`, `windows`, `ground`, `road`, `skyBottom`). `smoke` rỗng thì không có khói. `road` null thì không có xe: gốm sứ, pin lưu trữ, thực phẩm đóng hộp, in 3D. `skyBottom` nhỏ hơn 10 thì mưa gió phủ cả khung, không chỉ dải trời. Dây cáp điện (`day-cap-dien`) là cảnh trong nhà; `skyBottom` là trần trống, nên mưa gió chỉ phủ dải trần đó. Nước lũ dâng tới đường `ground`. Ngành chưa có ảnh thì `anchors` để trống, sân khấu vẽ SVG và hiệu ứng phủ cả khung.

## Supabase

Có thể trỏ backend vào một project Supabase đang dùng cho việc khác. Thêm cùng một tên schema vào cả hai chuỗi kết nối, ví dụ `schema=ditatdondau`. Bảng, migration và seed của game nằm trong schema đó. Dữ liệu sẵn có ở `public` giữ nguyên.

```
DATABASE_URL=postgresql://postgres.PROJECT:PASSWORD@aws-0-REGION.pooler.supabase.com:6543/postgres?pgbouncer=true&connection_limit=1&schema=ditatdondau
DIRECT_URL=postgresql://postgres:PASSWORD@db.PROJECT.supabase.co:5432/postgres?schema=ditatdondau
```

`DATABASE_URL` là cổng pooler `6543`, có `pgbouncer=true` và `connection_limit=1`. `DIRECT_URL` là cổng trực tiếp `5432`, dùng khi migrate. Hai URL phải cùng giá trị `schema`. Tên schema chỉ gồm chữ thường, số và gạch dưới. Bỏ tham số `schema` thì mọi thứ ở `public`, như Postgres local và addon Northflank.

`npm run db:migrate` tạo schema nếu chưa có, rồi chạy migration trong schema đó. `npm run db:seed` ghi vào cùng schema. Trên Northflank, đặt `schema` vào `DATABASE_URL` trước lần boot đầu tiên: image tự tạo schema và migrate lúc khởi động. Seed một lần trong shell của service backend (`npx tsx prisma/seed.ts`). Đổi tên schema sau đó là một chỗ trống mới: restart để migrate, rồi seed lại.

App gắn `search_path` theo tham số `schema`, kể cả khi đi qua pooler, nên mọi câu lệnh vào đúng schema này.

Project Supabase miễn phí tạm dừng sau khoảng một tuần không có truy vấn. Backend đang chạy gửi `SELECT 1` mỗi 18 giờ để project không ngủ. Chu kỳ đặt bằng `DB_KEEPALIVE_HOURS`, trong khoảng 12 đến 24. `DB_KEEPALIVE=0` tắt bộ đếm. Timer nằm trong process backend, nên service phải luôn bật (Northflank Sandbox hoặc VM Oracle). Mỗi lần khởi động cũng đã đọc cơ sở dữ liệu, và nhịp này giữ project thức giữa các lần đó.

## Triển khai

Đường chính là Northflank Developer Sandbox: luôn bật, không ngủ, đúng 2 service và 1 addon. Đường dự phòng là một VM Oracle Always Free chạy `docker compose`.

Đừng đặt `SEED_ON_BOOT` trên Northflank. Seed một lần. Chạy lại sẽ ghi đè các dòng mẫu.

### Northflank Sandbox

Plan Sandbox gồm 2 service, 2 job, 1 addon, và khoảng 20 USD tài nguyên mỗi tháng trên Northflank Cloud. Chọn plan nhỏ để luôn bật mà vẫn nằm trong hạn:

| Phần | Plan | RAM |
| --- | --- | --- |
| Frontend (nginx) | `nf-compute-10` | 256 MB |
| Backend (Node) | `nf-compute-20` | 512 MB |
| Addon PostgreSQL | plan nhỏ nhất của addon | |

Image backend đặt `NODE_OPTIONS=--max-old-space-size=256` để heap không chiếm hết 512 MB.

1. Tạo tài khoản Northflank và chọn **Developer Sandbox**. Tạo một project. Region gần lớp, ví dụ Singapore nếu có.
2. Nối repo Git (GitHub hoặc GitLab) và chọn nhánh sẽ deploy.
3. Thêm addon **PostgreSQL**. Chọn plan nhỏ nhất. Chưa cần mở cổng ra internet.
4. Service backend, build từ Dockerfile:
   - Build context: `backend`
   - Dockerfile: `backend/Dockerfile`
   - Cổng HTTP nội bộ: `4607`. Biến `PORT=4607`.
   - Health check: đường `/health`, giao thức HTTP.
   - Cùng cổng này phục vụ Socket.IO (`/socket.io`). Để nguyên loại cổng HTTP để Northflank chuyển header `Upgrade`. Đừng chuyển cổng sang TCP thuần.
   - Plan: `nf-compute-20`.
   - Lệnh trong image đã chạy `prisma migrate deploy` rồi mới mở cổng. Nếu `DIRECT_URL` trống, image gán bằng `DATABASE_URL`.
5. Gắn addon vào service backend. Trong Environment, thêm secret từ addon: lấy chuỗi kết nối (thường tên `POSTGRES_URI`) và đặt bí danh **`DATABASE_URL`**. Không thêm Postgres thứ hai.
6. Service frontend, build từ Dockerfile:
   - Build context: `frontend`
   - Dockerfile: `frontend/Dockerfile`
   - Cổng HTTP: `80`
   - Plan: `nf-compute-10`
   - Không đặt `API_UPSTREAM`. Container chỉ phục vụ file tĩnh. nginx trả `index.html` cho `/host/...` và `/play/...`.
7. Tên miền. Thêm domain của bạn, trỏ DNS theo bản ghi Northflank đưa (thường là CNAME). Gắn:
   - `game.<domain>` vào service frontend
   - `api.<domain>` vào service backend
   - Bật TLS cho cả hai.
8. Biến môi trường sau khi có hai URL:
   - Frontend, runtime (đổi xong là có hiệu lực, không cần build lại): `API_URL=https://api.<domain>` và `SOCKET_URL=https://api.<domain>`. `SOCKET_URL` bỏ trống thì lấy `API_URL`. Không có dấu `/` ở cuối.
   - Muốn đóng địa chỉ vào bản build thì thêm build argument `VITE_API_URL` và `VITE_SOCKET_URL` cùng hai giá trị đó. Biến runtime vẫn ghi đè.
   - Backend: `CORS_ORIGINS` là danh sách origin, cách nhau bởi dấu phẩy, không có đường dẫn và không có dấu `/` cuối. Socket.IO dùng cùng danh sách. Mặc định trong code và trong compose là `https://neoforcelab.com` cùng localhost cổng 4517 và 4607. Game chạy ở domain khác thì đặt đúng origin đó, ví dụ `https://game.<domain>`.
9. Seed một lần. Đợi `/health` trả `{"ok":true}`. Mở shell của service backend và chạy `npx tsx prisma/seed.ts`. Không bật `SEED_ON_BOOT`.
10. Mở `https://game.<domain>`. Máy chiếu tạo phòng. Điện thoại vào cùng địa chỉ, hoặc quét QR. Nếu đội không vào được phòng, kiểm tra lại `CORS_ORIGINS` trùng `https://game.<domain>` và `API_URL` trùng `https://api.<domain>`.

### Oracle Cloud Always Free

Một VM Ampere A1 (Ubuntu) chạy `docker-compose.yml`: Postgres trong volume `pgdata`, backend, và nginx phục vụ bản tĩnh. Điện thoại dùng một cổng vì nginx chuyển `/api` và Socket.IO sang API (`API_UPSTREAM`).

1. Tạo VM Always Free `VM.Standard.A1.Flex` (Ubuntu). Region gần lớp, ví dụ Singapore nếu tenancy cho phép.
2. Cài Docker. Mở cổng 4517 trên security list và trên firewall của máy.
3. Clone repo, rồi:

```bash
docker compose up --build -d
```

4. Máy chiếu và điện thoại mở `http://IP-CÔNG-KHAI:4517`. Lần đầu backend tự migrate và nạp seed vì compose đặt `SEED_ON_BOOT=1`.

## Cấu trúc

```
frontend/          React, Vite; image chạy là nginx
backend/           Express, Socket.IO, Prisma
backend/prisma     schema, migration, seed
docker-compose.yml Postgres local + API + nginx
```
