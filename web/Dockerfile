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

