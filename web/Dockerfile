# --- Stage 1: build Vue app ---
FROM node:20-alpine AS build
WORKDIR /app

COPY package*.json ./
RUN npm install

COPY . .

# VITE_API_BASE_URL để trống ("") vì trình duyệt sẽ gọi đường dẫn tương đối
# "/api/..." rồi Nginx (stage 2) proxy sang service "api" - không cần biết
# host/port thật của API, tránh luôn vấn đề mixed-content (http/https).
ENV VITE_API_BASE_URL=""
RUN npm run build

# --- Stage 2: chỉ để đổ dist/ ra volume /output rồi thoát ---
# (Trước đây thiếu stage này -> container "web" chạy xong không copy gì cả,
#  web_dist rỗng, Nginx serve site trống.)
FROM alpine:3.20
COPY --from=build /app/dist /dist
CMD ["sh", "-c", "rm -rf /output/* && cp -r /dist/. /output/ && echo 'Da copy dist sang /output'"]

