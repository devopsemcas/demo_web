# API quản lý khách hàng (REST API thuần)

API này **chỉ** lo phần dữ liệu (CRUD khách hàng). Toàn bộ giao diện, form nhập liệu
và việc "in phiếu khám" nằm ở dự án `web/` (Vue.js) riêng biệt — xem `web/README.md`.

## 1. Database
Chạy `migration.sql` trên database `qraeh` để thêm cột `nghe_nghiep` và các index.

## 2. Cài đặt
```bash
npm install
cp .env.example .env   # rồi chỉnh thông tin DB + WEB_ORIGIN
npm start               # hoặc: npm run dev (tự reload khi sửa code)
```
Mặc định API chạy tại `http://localhost:3000`.

## 3. Biến môi trường (`.env`)
| Biến | Mô tả |
|---|---|
| `PORT` | Cổng chạy API (mặc định 3000) |
| `DB_HOST`, `DB_PORT`, `DB_NAME`, `DB_USER`, `DB_PASSWORD` | Thông tin kết nối PostgreSQL |
| `WEB_ORIGIN` | Domain của web dashboard được phép gọi API (CORS), nhiều domain cách nhau bởi dấu phẩy. Dùng `*` để cho phép tất cả (chỉ dùng khi dev) |

## 4. Danh sách endpoint
| Method | Endpoint | Mô tả |
|---|---|---|
| `POST` | `/api/citizens` | Thêm khách hàng |
| `GET` | `/api/citizens?from=&to=&ho_ten=&sodt=&page=&limit=` | Tìm kiếm / danh sách (có phân trang) |
| `GET` | `/api/citizens/:id` | Xem chi tiết 1 khách hàng (web dùng để lấy dữ liệu fill vào phiếu khám) |
| `PUT` | `/api/citizens/:id` | Cập nhật thông tin |
| `DELETE` | `/api/citizens/:id` | Xóa khách hàng |
| `GET` | `/api/health` | Kiểm tra API + kết nối database |

## 5. Thay đổi so với bản gốc
- Bỏ hoàn toàn phần sinh file `.docx` bằng Python (`fill_form.py`) và in trực tiếp qua
  Microsoft Word COM (chỉ chạy được trên Windows). Việc "in phiếu khám" giờ được xử lý
  **ở trình duyệt** bằng một trang HTML mô phỏng lại mẫu phiếu, tự động điền dữ liệu
  khách hàng rồi gọi lệnh in của trình duyệt (`window.print()`), nên chạy được trên
  mọi hệ điều hành/máy in, không cần cài Word.
- API không còn `express.static` phục vụ giao diện — giao diện là một dự án Vue độc
  lập, gọi API qua HTTP (CORS).
