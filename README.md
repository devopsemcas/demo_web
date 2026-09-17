# Hệ thống quản lý khách hàng (đã tách API / Web)

Dự án được tách thành 2 phần độc lập, chạy riêng, giao tiếp qua HTTP (REST + CORS):

```
api/   -> REST API (Node.js + Express + PostgreSQL) — chỉ lo dữ liệu
web/   -> Web dashboard (Vue.js 3 + Vite) — toàn bộ giao diện, kể cả "in phiếu khám"
db/    -> Script khởi tạo schema PostgreSQL (dùng khi deploy bằng Docker)
```

## Cách 1 — Triển khai bằng Docker Compose (khuyên dùng)

Yêu cầu máy chủ đã cài Docker + Docker Compose. Toàn bộ hệ thống (Postgres + API + Web)
sẽ tự dựng và chạy bằng 1 lệnh, không cần cài Node/Postgres thủ công trên máy chủ.

```bash
cp .env.example .env      # chỉnh POSTGRES_PASSWORD, WEB_PORT... cho phù hợp
docker compose up -d --build
```

Sau khi chạy xong:
- Web dashboard: `http://<ip-máy-chủ>:8080` (hoặc port bạn đặt ở `WEB_PORT`)
- Database Postgres tự tạo bảng `citizens` lần đầu (từ `db/init.sql`), dữ liệu được
  lưu bền trong Docker volume `db_data` (không mất khi restart container).
- Web (Nginx) tự động **proxy** `/api/*` sang container `api` — trình duyệt chỉ gọi
  cùng-origin, không cần biết IP/port thật của API, không lo CORS hay mixed-content.

Một số lệnh hữu ích:
```bash
docker compose logs -f api       # xem log API
docker compose exec db psql -U postgres -d qraeh   # vào thẳng database
docker compose down              # dừng (thêm -v nếu muốn xoá luôn dữ liệu)
docker compose up -d --build     # build lại sau khi sửa code
```

> Nếu server đã có Postgres riêng (không dùng service `db` ở trên), có thể xoá phần
> `db` khỏi `docker-compose.yml` và trỏ `DB_HOST`/`DB_PORT`/... của service `api`
> sang database đó, rồi tự chạy `db/init.sql` (hoặc `api/migration.sql` nếu bảng đã có sẵn).

## Cách 2 — Chạy thủ công (dev)

Terminal 1 — API:
```bash
cd api
npm install
cp .env.example .env    # cấu hình DB
npm start                # http://localhost:3000
```

Terminal 2 — Web:
```bash
cd web
npm install
cp .env.example .env    # VITE_API_BASE_URL=http://localhost:3000
npm run dev              # http://localhost:5173
```

Mở `http://localhost:5173` để dùng dashboard.

## Vì sao tách riêng?
- **API** có thể deploy độc lập (VD: server Linux/Docker gần database), không phụ
  thuộc Windows/Word như bản cũ.
- **Web** có thể build tĩnh (`npm run build`) và host trên bất kỳ CDN/static hosting
  nào (Nginx, Netlify, Vercel...), hoặc nhúng vào hệ thống khác.
- Có thể phát triển/scale/đổi công nghệ mỗi phần mà không ảnh hưởng phần còn lại.

## Thay đổi lớn so với bản gốc
| Trước | Sau |
|---|---|
| 1 server Express vừa là API vừa serve HTML tĩnh | API và Web là 2 dự án riêng |
| In phiếu bằng cách sinh `.docx` (python-docx) rồi điều khiển Microsoft Word qua COM (chỉ chạy Windows) | Trang `web/src/views/PrintFormView.vue` dựng lại đúng bố cục phiếu khám bằng HTML/CSS, tự điền dữ liệu khách hàng lấy từ API, rồi in bằng `window.print()` của trình duyệt — chạy mọi hệ điều hành, không cần Word |

Xem chi tiết trong `api/README.md` và `web/README.md`.
