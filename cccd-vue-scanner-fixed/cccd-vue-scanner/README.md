# CCCD Vue 3 Camera QR Scanner

## Chạy trên Windows

1. Cài Node.js LTS.
2. Mở CMD/PowerShell tại thư mục project.
3. Chạy:

```bash
npm install
npm run dev
```

4. Mở URL Vite hiển thị, thường là `http://localhost:5173`.

Camera trình duyệt cần secure context: `localhost` được phép; khi triển khai qua IP LAN nên dùng HTTPS.

## Tính năng
- Vue 3 + Vite.
- Quét QR bằng webcam/camera.
- Ưu tiên camera environment.
- Thử bật continuous autofocus nếu webcam hỗ trợ.
- Zoom bằng Camera API nếu thiết bị hỗ trợ.
- Tự dừng sau khi đọc QR.
- Parse chuỗi pipe-separated và mapping vào form.
- Có thể thay `console.log` trong `save()` bằng Axios POST tới backend.

## API sau này
Trong `App.vue`, thay phần `save()` bằng Axios, ví dụ POST `/api/citizens/`.

## Lưu ý
Khả năng autofocus/zoom phụ thuộc webcam, driver và trình duyệt. Không phải webcam Windows nào cũng cho phép điều khiển focus/zoom bằng JavaScript. Với QR rất nhỏ, webcam có autofocus + độ phân giải cao sẽ cho kết quả tốt hơn.

## Vì sao không gọi được API ("Không kết nối được API")?

App này chạy **HTTPS** (do plugin `basicSsl`) để camera hoạt động khi mở qua IP LAN
(`https://10.0.40.120:5173`). Nhưng `.env` lại trỏ API sang **HTTP thường**
(`http://10.0.40.120:3000`). Trình duyệt sẽ **chặn** request kiểu này gọi là
*"mixed content"*: trang HTTPS không được phép tự ý gọi HTTP sang một origin khác —
request sẽ fail ngay ở tầng trình duyệt, trước khi kịp chạm tới CORS hay tới được
server. Đây gần như chắc chắn là lý do bạn không connect được.

**Đã sửa bằng cách thêm dev proxy trong `vite.config.js`:** thay vì gọi thẳng
`http://10.0.40.120:3000/api/...` từ trình duyệt, code trong `ResultView.vue` giờ gọi
đường dẫn tương đối `/api/citizens`. Vite dev server (chạy phía Node, không phải
trình duyệt) sẽ nhận request này và tự chuyển tiếp (proxy) sang API thật lấy từ
`VITE_API_URL` trong `.env`. Vì Vite proxy chạy ở server-side nên không bị giới hạn
mixed-content, và trình duyệt cũng không cần lo CORS vì thấy request là cùng-origin.

➡️ Bạn chỉ cần đảm bảo `.env` có đúng IP:port của API đang chạy, ví dụ:
```
VITE_API_URL=http://10.0.40.120:3000
```
rồi chạy lại `npm run dev` (phải restart để Vite đọc lại `.env`).

### Lưu ý khi build production (`npm run build`)
Proxy ở trên **chỉ hoạt động với `vite dev`**. Khi build ra file tĩnh (`dist/`) và host
ở nơi khác (Nginx, v.v.), sẽ không còn Vite proxy nữa. Khi đó cần 1 trong 2 cách:
1. Cấu hình Nginx/host tĩnh forward `/api/*` sang API backend (giống proxy trên).
2. Hoặc chạy API cũng qua HTTPS (cùng giao thức với web) và cấu hình `WEB_ORIGIN`
   trong `.env` của API đúng bằng origin của web (VD: `https://10.0.40.120:5173`).
