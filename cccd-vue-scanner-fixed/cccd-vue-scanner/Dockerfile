# ---------- Stage 1: Build ứng dụng Vue/Vite ----------
FROM node:20-alpine AS build
WORKDIR /app

# URL của backend API, truyền vào lúc build (Vite nhúng biến VITE_* tại build-time)
ARG VITE_API_URL=http://localhost:3000
ENV VITE_API_URL=$VITE_API_URL

# Cài dependency trước để tận dụng cache layer
COPY package*.json ./
RUN npm ci

# Copy source và build ra thư mục dist/
COPY . .
RUN npm run build

# ---------- Stage 2: Serve bằng Nginx (kèm HTTPS) ----------
FROM nginx:1.27-alpine AS production

# Camera trên trình duyệt chỉ hoạt động ở "secure context":
# localhost luôn được phép, còn truy cập qua IP LAN bắt buộc phải có HTTPS.
# Ở đây tạo sẵn chứng chỉ self-signed để chạy HTTPS ngay khi start container.
RUN apk add --no-cache openssl && \
    mkdir -p /etc/nginx/ssl && \
    openssl req -x509 -nodes -days 3650 \
      -newkey rsa:2048 \
      -keyout /etc/nginx/ssl/selfsigned.key \
      -out /etc/nginx/ssl/selfsigned.crt \
      -subj "/C=VN/ST=HCM/L=HoChiMinh/O=CCCD-Scanner/CN=localhost"

COPY nginx.conf /etc/nginx/conf.d/default.conf
COPY --from=build /app/dist /usr/share/nginx/html

EXPOSE 80 443

HEALTHCHECK --interval=30s --timeout=3s CMD wget -qO- http://localhost/ || exit 1

CMD ["nginx", "-g", "daemon off;"]
