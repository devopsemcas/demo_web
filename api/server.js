const express = require("express");
const cors = require("cors");
const { Pool } = require("pg");
require("dotenv").config();

const app = express();
const PORT = Number(process.env.PORT || 3000);

// ---- CORS: chỉ cho phép web dashboard (Vue) đã cấu hình trong .env ----
const allowedOrigins = (process.env.WEB_ORIGIN || "*")
    .split(",")
    .map((s) => s.trim())
    .filter(Boolean);

app.use(
    cors({
        origin: allowedOrigins.includes("*") ? true : allowedOrigins,
    })
);
app.use(express.json({ limit: "1mb" }));

const pool = new Pool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT,
    database: process.env.DB_NAME,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
});

function clean(v) {
    if (v === undefined || v === null) return null;
    const s = String(v).trim();
    return s === "" ? null : s;
}

function normalizeDate(v) {
    if (!v) return null;
    const s = String(v).trim();
    return /^\d{4}-\d{2}-\d{2}$/.test(s) ? s : null;
}

const CITIZEN_COLUMNS = `id, cccd, cmnd, ho_ten, gioi_tinh, ngay_sinh, dia_chi, ngay_cap, sodt, nghe_nghiep, created_at`;

// CREATE
app.post("/api/citizens", async (req, res) => {
    try {
        const { cccd, cmnd, ho_ten, gioi_tinh, ngay_sinh, dia_chi, ngay_cap, sodt, nghe_nghiep } = req.body;
        if (!clean(ho_ten)) {
            return res.status(400).json({ success: false, message: "Họ tên là bắt buộc" });
        }

        const sql = `
            INSERT INTO citizens
            (cccd, cmnd, ho_ten, gioi_tinh, ngay_sinh, dia_chi, ngay_cap, sodt, nghe_nghiep)
            VALUES ($1,$2,$3,$4,$5,$6,$7,$8,$9)
            RETURNING ${CITIZEN_COLUMNS}
        `;
        const values = [clean(cccd), clean(cmnd), clean(ho_ten), clean(gioi_tinh), clean(ngay_sinh), clean(dia_chi), clean(ngay_cap), clean(sodt), clean(nghe_nghiep)];
        const result = await pool.query(sql, values);
        res.status(201).json({ success: true, message: "Thêm thông tin công dân thành công", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === "23505") return res.status(409).json({ success: false, message: "CCCD đã tồn tại" });
        if (error.code === "42703") return res.status(500).json({ success: false, message: "Database chưa có cột nghe_nghiep. Hãy chạy migration.sql." });
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// SEARCH / LIST
app.get("/api/citizens", async (req, res) => {
    try {
        const from = normalizeDate(req.query.from);
        const to = normalizeDate(req.query.to);
        const name = clean(req.query.ho_ten);
        const phone = clean(req.query.sodt);
        const page = Math.max(Number.parseInt(req.query.page || "1", 10), 1);
        const limit = Math.min(Math.max(Number.parseInt(req.query.limit || "20", 10), 1), 100);
        const offset = (page - 1) * limit;

        const where = [];
        const values = [];
        let n = 1;
        if (from) { where.push(`created_at >= $${n++}::date`); values.push(from); }
        if (to) { where.push(`created_at < ($${n++}::date + INTERVAL '1 day')`); values.push(to); }
        if (name) { where.push(`ho_ten ILIKE $${n++}`); values.push(`%${name}%`); }
        if (phone) { where.push(`sodt ILIKE $${n++}`); values.push(`%${phone}%`); }

        const condition = where.length ? `WHERE ${where.join(" AND ")}` : "";
        const countResult = await pool.query(`SELECT COUNT(*)::int AS total FROM citizens ${condition}`, values);
        const total = countResult.rows[0].total;

        const dataValues = [...values, limit, offset];
        const result = await pool.query(`
            SELECT ${CITIZEN_COLUMNS}
            FROM citizens
            ${condition}
            ORDER BY created_at DESC, id DESC
            LIMIT $${n++} OFFSET $${n}
        `, dataValues);

        res.json({ success: true, data: result.rows, pagination: { page, limit, total, total_pages: Math.ceil(total / limit) } });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi lấy danh sách khách hàng" });
    }
});

// DETAIL (dùng để lấy dữ liệu fill vào phiếu khám HTML)
app.get("/api/citizens/:id", async (req, res) => {
    try {
        const result = await pool.query(`SELECT ${CITIZEN_COLUMNS} FROM citizens WHERE id=$1`, [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        res.json({ success: true, data: result.rows[0] });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi server" });
    }
});

// UPDATE
app.put("/api/citizens/:id", async (req, res) => {
    try {
        const { cccd, cmnd, ho_ten, gioi_tinh, ngay_sinh, dia_chi, ngay_cap, sodt, nghe_nghiep } = req.body;
        if (!clean(ho_ten)) return res.status(400).json({ success: false, message: "Họ tên là bắt buộc" });

        const result = await pool.query(`
            UPDATE citizens SET
              cccd=$1, cmnd=$2, ho_ten=$3, gioi_tinh=$4, ngay_sinh=$5,
              dia_chi=$6, ngay_cap=$7, sodt=$8, nghe_nghiep=$9
            WHERE id=$10
            RETURNING ${CITIZEN_COLUMNS}
        `, [clean(cccd), clean(cmnd), clean(ho_ten), clean(gioi_tinh), clean(ngay_sinh), clean(dia_chi), clean(ngay_cap), clean(sodt), clean(nghe_nghiep), req.params.id]);

        if (!result.rowCount) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        res.json({ success: true, message: "Cập nhật thông tin thành công", data: result.rows[0] });
    } catch (error) {
        console.error(error);
        if (error.code === "23505") return res.status(409).json({ success: false, message: "CCCD đã tồn tại" });
        res.status(500).json({ success: false, message: "Lỗi cập nhật thông tin" });
    }
});

// DELETE
app.delete("/api/citizens/:id", async (req, res) => {
    try {
        const result = await pool.query(`DELETE FROM citizens WHERE id=$1 RETURNING id`, [req.params.id]);
        if (!result.rowCount) return res.status(404).json({ success: false, message: "Không tìm thấy khách hàng" });
        res.json({ success: true, message: "Đã xóa khách hàng" });
    } catch (error) {
        console.error(error);
        res.status(500).json({ success: false, message: "Lỗi xóa khách hàng" });
    }
});

app.get("/api/health", async (_req, res) => {
    try {
        await pool.query("SELECT 1");
        res.json({ success: true, database: "ok" });
    } catch (e) {
        res.status(500).json({ success: false, database: "error" });
    }
});

app.listen(PORT, () => console.log(`API running at http://localhost:${PORT}`));
