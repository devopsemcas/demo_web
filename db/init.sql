-- Khởi tạo schema cho database "qraeh" khi container Postgres chạy lần đầu.
-- (Thư mục này được Postgres image tự động chạy 1 lần duy nhất, lúc data
--  directory còn trống — không chạy lại nếu volume dữ liệu đã có sẵn.)

CREATE TABLE IF NOT EXISTS citizens (
    id           SERIAL PRIMARY KEY,
    cccd         TEXT UNIQUE,
    cmnd         TEXT,
    ho_ten       TEXT NOT NULL,
    gioi_tinh    TEXT,
    ngay_sinh    DATE,
    dia_chi      TEXT,
    ngay_cap     DATE,
    sodt         TEXT,
    nghe_nghiep  TEXT,
    created_at   TIMESTAMPTZ NOT NULL DEFAULT now()
);

-- Nội dung migration.sql gốc (idempotent, chạy lại vẫn an toàn)
ALTER TABLE citizens
    ADD COLUMN IF NOT EXISTS nghe_nghiep TEXT;

CREATE INDEX IF NOT EXISTS idx_citizens_created_at ON citizens(created_at);
CREATE INDEX IF NOT EXISTS idx_citizens_ho_ten ON citizens(ho_ten);
CREATE INDEX IF NOT EXISTS idx_citizens_sodt ON citizens(sodt);
CREATE INDEX IF NOT EXISTS idx_citizens_cccd ON citizens(cccd);
