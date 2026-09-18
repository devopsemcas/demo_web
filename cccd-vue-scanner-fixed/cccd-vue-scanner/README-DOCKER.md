# Triển khai Docker cho CCCD Vue Scanner

## 1. Copy file vào project

Đặt 4 file sau vào **thư mục gốc** của project (`cccd-vue-scanner/`, cùng cấp `package.json`):

- `Dockerfile`
- `nginx.conf`
- `docker-compose.yml`
- `.dockerignore`

## 2. Vì sao cần HTTPS?

Trình duyệt chỉ cho phép truy cập camera (`getUserMedia`) ở "secure context":
- `http://localhost` → OK
- Truy cập qua IP LAN bằng `http://` → camera **sẽ bị chặn**

Vì vậy image Nginx trong `Dockerfile` tự tạo một **chứng chỉ self-signed** khi build, và `nginx.conf` redirect toàn bộ HTTP sang HTTPS. Khi mở bằng IP LAN, trình duyệt sẽ cảnh báo "Not secure/rủi ro" — bấm "Advanced → Proceed" là dùng được. Nếu muốn bỏ cảnh báo này, dùng chứng chỉ thật (xem mục 5).

## 3. Build & chạy

Cách 1 — dùng Docker Compose (khuyến nghị):

```bash
# Chỉnh VITE_API_URL cho đúng backend của bạn, có thể set qua biến môi trường:
export VITE_API_URL=http://10.0.40.120:3000

docker compose up -d --build
```

Cách 2 — dùng Docker thuần:

```bash
docker build -t cccd-vue-scanner \
  --build-arg VITE_API_URL=http://10.0.40.120:3000 .

docker run -d --name cccd-vue-scanner \
  -p 80:80 -p 443:443 \
  cccd-vue-scanner
```

Sau đó truy cập: `https://<ip-may-chu>/`

> Lưu ý: `VITE_API_URL` được Vite nhúng **vào lúc build**, không phải lúc chạy container. Nếu đổi URL backend thì phải build lại image (đổi `--build-arg` / biến `VITE_API_URL` rồi `docker compose up -d --build`).

## 4. Kiểm tra log / dừng container

```bash
docker compose logs -f
docker compose down
```

## 5. (Tuỳ chọn) Dùng chứng chỉ HTTPS thật thay vì self-signed

Nếu server có domain thật, khuyến nghị đặt Nginx này sau một reverse proxy như **Traefik** hoặc **Caddy** để tự động lấy chứng chỉ Let's Encrypt, thay vì tự ký. Khi đó bạn có thể:
- Bỏ phần tạo self-signed cert trong `Dockerfile`
- Cho container chỉ listen port 80 nội bộ
- Để Traefik/Caddy làm TLS termination ở phía trước

Nếu bạn dùng cách này, cho tôi biết bạn định dùng Traefik hay Caddy để tôi viết cấu hình tương ứng.

## 6. Cấu trúc file

```
cccd-vue-scanner/
├── Dockerfile          # build Vue app + serve bằng Nginx/HTTPS
├── nginx.conf          # cấu hình Nginx (SPA fallback, gzip, cache)
├── docker-compose.yml  # chạy 1 lệnh
├── .dockerignore
├── package.json
├── ...
```
