#!/bin/bash
# Xin chứng chỉ Let's Encrypt cho MỘT domain.
#
#   ./init-letsencrypt.sh                      -> dùng DOMAIN trong .env
#   ./init-letsencrypt.sh site2.example.com    -> dùng domain truyền vào
#   STAGING=1 ./init-letsencrypt.sh            -> test, không tốn quota cert thật
#
# Lý do cần script: Nginx từ chối khởi động nếu file ssl_certificate chưa tồn tại,
# nhưng Certbot lại cần Nginx đang chạy để phục vụ file xác thực HTTP-01.
# Script phá vòng lặp đó: tạo cert giả -> start Nginx -> xin cert thật -> reload.

set -e

cd "$(dirname "$0")"

if [ ! -f .env ]; then
  echo "Không tìm thấy file .env. Chạy: cp .env.example .env rồi chỉnh lại." >&2
  exit 1
fi

set -a
. ./.env
set +a

TARGET_DOMAIN="${1:-$DOMAIN}"

if [ -z "$TARGET_DOMAIN" ] || [ -z "$ACME_EMAIL" ]; then
  echo "Thiếu domain hoặc ACME_EMAIL. Khai báo trong .env, hoặc truyền domain làm tham số." >&2
  exit 1
fi

DATA_PATH="./certbot"
# Cert staging KHÔNG được trình duyệt tin tưởng, nhưng không dính rate limit
# (bản thật chỉ cho 5 lần/tuần/domain) - rất nên dùng khi thử lần đầu.
STAGING="${STAGING:-0}"

echo "### Domain cần xin cert: $TARGET_DOMAIN"

if [ -d "$DATA_PATH/conf/live/$TARGET_DOMAIN" ]; then
  read -p "Đã tồn tại chứng chỉ cho $TARGET_DOMAIN. Xin lại và ghi đè? (y/N) " decision
  if [ "$decision" != "y" ] && [ "$decision" != "Y" ]; then
    echo "Đã huỷ."
    exit 0
  fi
fi

mkdir -p "$DATA_PATH/conf/live/$TARGET_DOMAIN" "$DATA_PATH/www"

echo "### [1/5] Tạo chứng chỉ tạm để Nginx khởi động được..."
docker compose run --rm --entrypoint "\
  openssl req -x509 -nodes -newkey rsa:2048 -days 1 \
    -keyout '/etc/letsencrypt/live/$TARGET_DOMAIN/privkey.pem' \
    -out '/etc/letsencrypt/live/$TARGET_DOMAIN/fullchain.pem' \
    -subj '/CN=localhost'" certbot

echo "### [2/5] Build và khởi động Nginx cùng các service phía sau..."
docker compose up -d --build proxy

echo "### [3/5] Xoá chứng chỉ tạm..."
docker compose run --rm --entrypoint "\
  rm -rf /etc/letsencrypt/live/$TARGET_DOMAIN \
         /etc/letsencrypt/archive/$TARGET_DOMAIN \
         /etc/letsencrypt/renewal/$TARGET_DOMAIN.conf" certbot

echo "### [4/5] Xin chứng chỉ thật cho $TARGET_DOMAIN..."
STAGING_ARG=""
if [ "$STAGING" != "0" ]; then
  echo "    (đang dùng máy chủ STAGING - cert sẽ KHÔNG được trình duyệt tin tưởng)"
  STAGING_ARG="--staging"
fi

docker compose run --rm --entrypoint "\
  certbot certonly --webroot -w /var/www/certbot \
    $STAGING_ARG \
    --email $ACME_EMAIL \
    -d $TARGET_DOMAIN \
    --rsa-key-size 2048 \
    --agree-tos \
    --no-eff-email \
    --force-renewal" certbot

echo "### [5/5] Reload Nginx để nạp chứng chỉ mới..."
docker compose exec proxy nginx -s reload

echo
echo "Xong. Chạy tiếp: docker compose up -d --build"
echo "Rồi truy cập: https://$TARGET_DOMAIN"
