# Backend

API giữ phòng, năm của từng đội, sự kiện và kết quả. Nội dung chơi nằm trong Postgres, nạp bằng seed.

## Biến môi trường

| Biến | Việc |
| --- | --- |
| `DATABASE_URL` | App và Socket.IO. Supabase: transaction pooler cổng **6543**, có `?pgbouncer=true`. |
| `DIRECT_URL` | `prisma migrate deploy` và seed. Supabase: **session pooler** cổng **5432** (cùng host `*.pooler.supabase.com`, user `postgres.PROJECT`). |
| `PORT` | Cổng HTTP. Mặc định `4607`. |
| `CORS_ORIGINS` | Origin được phép, cách nhau bởi dấu phẩy, không có đường dẫn. Socket.IO dùng cùng danh sách. Production: `https://neoforcelab.com`. Dev thêm localhost. |
| `SEED_ON_BOOT` | `1` thì container seed sau migrate, mỗi lần khởi động. Seed upsert, chạy lại không tạo bản ghi trùng. |
| `CONTENT_RELOAD_TOKEN` | Nếu đặt, `POST /api/content/reload` với header `x-reload-token` nạp lại catalog. Trống thì đường đó 404. |
| `DB_KEEPALIVE` | Mặc định bật. `0` tắt `SELECT 1`. |
| `DB_KEEPALIVE_HOURS` | Chu kỳ keep-alive, trong khoảng 12–24. Mặc định 18. |

Hai URL Supabase phải cùng `schema` nếu không dùng `public`. Ví dụ có trong `.env.example`. Addon Postgres của Northflank chỉ cần `DATABASE_URL`; image gán `DIRECT_URL` bằng URL đó khi biến này trống.

## Northflank Sandbox

- Build context: `backend`
- Dockerfile: `backend/Dockerfile`
- Internal port: `4607` (`PORT=4607`)
- Health check: HTTP `GET /health`
- Cùng cổng phục vụ Socket.IO (`/socket.io`). Giữ loại cổng HTTP để proxy chuyển `Upgrade`.
- Lệnh trong image: `prisma migrate deploy`, rồi seed nếu `SEED_ON_BOOT=1`, rồi mở cổng.

`CORS_ORIGINS` phải trùng origin trang game, ví dụ `https://neoforcelab.com`. Không thêm `www` nếu trang không có `www`.
