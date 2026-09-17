-- Chạy 1 lần trên database qraeh
ALTER TABLE citizens
    ADD COLUMN IF NOT EXISTS nghe_nghiep TEXT;

CREATE INDEX IF NOT EXISTS idx_citizens_created_at ON citizens(created_at);
CREATE INDEX IF NOT EXISTS idx_citizens_ho_ten ON citizens(ho_ten);
CREATE INDEX IF NOT EXISTS idx_citizens_sodt ON citizens(sodt);
CREATE INDEX IF NOT EXISTS idx_citizens_cccd ON citizens(cccd);
