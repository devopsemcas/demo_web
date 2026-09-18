# Web Dashboard (Vue.js) — Quản lý khách hàng

Giao diện quản lý khách hàng, tách biệt hoàn toàn khỏi API (`../api`), gọi API qua HTTP.

## Cài đặt & chạy
```bash
npm install
cp .env.example .env     # chỉnh VITE_API_BASE_URL trỏ về API đang chạy
npm run dev               # chạy dev server tại http://localhost:5173
```

Build bản production:
```bash
npm run build     # xuất ra thư mục dist/, có thể deploy lên bất kỳ static hosting nào (Nginx, Vercel, Netlify...)
npm run preview   # xem thử bản build
```

## Cấu trúc
```
src/
  api/client.js            # gọi API (fetch), đọc URL từ VITE_API_BASE_URL
  views/
    CitizensListView.vue   # trang danh sách/tìm kiếm/thêm/sửa khách hàng
    PrintFormView.vue      # trang "Phiếu khám tuyến" — HTML mô phỏng file .docx gốc
  components/
    CitizenFormModal.vue   # modal thêm/sửa dùng chung
  router/index.js          # 2 route: "/" (danh sách) và "/print/:id" (phiếu khám)
```

## Chức năng in phiếu khám (thay thế cho Word COM cũ)
Bấm nút **"In phiếu"** ở trang danh sách sẽ mở tab mới `/print/:id`. Trang này:
1. Gọi API `GET /api/citizens/:id` để lấy dữ liệu khách hàng.
2. Tự động điền vào bản HTML mô phỏng lại đúng bố cục file `Phieu Kham Tuyen.docx`
   gốc (họ tên, ngày sinh, giới tính, CCCD, SĐT, nghề nghiệp, địa chỉ...).
3. Các mục do bác sĩ điền tại chỗ (thị lực, kính lỗ, chẩn đoán, chỉ định điều trị,
   bác sĩ chỉ định, mắt điều trị) là các ô nhập liệu trống để điền tay trước khi in.
4. Bấm **"🖨️ In phiếu"** sẽ gọi `window.print()` của trình duyệt — có CSS khổ A4
   riêng cho bản in (ẩn thanh công cụ, ẩn viền ô nhập để nhìn giống bản giấy).

Ưu điểm so với cách cũ (Python + Word COM):
- Không cần cài Microsoft Word, không cần chạy trên Windows.
- Không cần thư viện `python-docx`, không cần gọi tiến trình con từ Node.
- Người dùng có thể chỉnh sửa/điền thêm thông tin ngay trên bản xem trước rồi mới in.
- In được từ mọi trình duyệt, mọi máy in đã cài trên máy tính đó.

> Nếu về sau vẫn cần xuất file `.docx` gốc (ví dụ để lưu trữ), có thể thêm lại một
> service riêng dùng `fill_form.py` — nhưng không bắt buộc cho luồng "điền + in".
