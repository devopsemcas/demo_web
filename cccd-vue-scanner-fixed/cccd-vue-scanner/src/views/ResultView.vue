<template>
  <main class="page">
    <header>
      <h1>Kết quả quét</h1>
      <p>Kiểm tra lại thông tin trước khi lưu.</p>
    </header>
    <section class="grid single">
      <section class="card form-card">
        <div class="status" :class="statusType">{{ status }}</div>
        <div class="form-grid">
          <label>
            Số điện thoại
            <input 
              v-model="form.phone" 
              type="tel" 
              placeholder="Nhập số điện thoại" 
              maxlength="10" 
            />
          </label>
          <label>Số định danh cá nhân<input v-model="form.citizenId" maxlength="12" /></label>
          <label>Họ và tên<input v-model="form.fullName" /></label>
          <label>Ngày sinh<input v-model="form.dateOfBirth" placeholder="DD/MM/YYYY" /></label>
          <label>Giới tính<input v-model="form.gender" /></label>
          <label>Nơi cư trú<input v-model="form.address" /></label>
          <label>Ngày cấp<input v-model="form.issueDate" placeholder="DD/MM/YYYY" /></label>
          <label>Số CMND cũ<input v-model="form.oldId" /></label>
        </div>
        <label class="raw">Dữ liệu QR<textarea v-model="form.raw" rows="4"></textarea></label>
        <div class="actions">
          <button class="primary" @click="save":disabled="saving">{{ saving ? 'Đang lưu...' : 'Lưu thông tin' }}</button>
          <button @click="rescan">Quét lại</button>
        </div>
      </section>
    </section>
  </main>
</template>
<!-- <script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { scanResult, clearScanResult } from '../scanStore'

const router = useRouter()
// dùng trực tiếp scanResult (reactive) làm form để chỉnh sửa tại chỗ nếu cần
const form = scanResult
const status = ref('Đã đọc QR thành công')
const statusType = ref('success')

function save() {
  if (!/^\d{12}$/.test(form.citizenId)) {
    status.value = 'Số định danh chưa hợp lệ (cần 12 số)'
    statusType.value = 'error'
    return
  }
  console.log('FORM TO API:', JSON.parse(JSON.stringify(form)))
  status.value = 'Đã kiểm tra dữ liệu. Có thể gọi API để lưu.'
  statusType.value = 'success'
}

function rescan() {
  clearScanResult()
  router.push({ name: 'scan' })
}
</script> -->
<script setup>
import { ref } from 'vue'
import { useRouter } from 'vue-router'
import { scanResult, clearScanResult } from '../scanStore'
import { toISODate } from '../utils/date'

const router = useRouter()
const form = scanResult
const status = ref('Đã đọc QR thành công')
const statusType = ref('success')
const saving = ref(false)

// Gọi qua đường dẫn tương đối "/api/..." để đi qua proxy của Vite (xem vite.config.js).
// Nhờ vậy trình duyệt luôn gọi cùng-origin (https://<host>:5173/api/...) thay vì gọi
// thẳng sang http://<ip>:3000 — tránh bị chặn "mixed content" khi trang đang chạy HTTPS.
const API_URL = ''

async function save() {
  if (!form.fullName) {
    status.value = 'Họ tên là bắt buộc'
    statusType.value = 'error'
    return
  }
  if (form.citizenId && !/^\d{12}$/.test(form.citizenId)) {
    status.value = 'Số CCCD chưa hợp lệ (cần 12 số)'
    statusType.value = 'error'
    return
  }

  const payload = {
    cccd: form.citizenId || null,
    cmnd: form.oldId || null,
    ho_ten: form.fullName,
    gioi_tinh: form.gender || null,
    ngay_sinh: toISODate(form.dateOfBirth),
    dia_chi: form.address || null,
    ngay_cap: toISODate(form.issueDate),
    sodt:form.phone
  }

  saving.value = true
  status.value = 'Đang lưu...'
  statusType.value = ''

  try {
    const res = await fetch(`${API_URL}/api/citizens`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(payload)
    })
    const data = await res.json().catch(() => ({}))

    if (res.status === 201 && data.success) {
      status.value = data.message || 'Đã lưu thông tin công dân'
      statusType.value = 'success'
    } else if (res.status === 409) {
      status.value = data.message || 'CCCD đã tồn tại trong hệ thống'
      statusType.value = 'error'
    } else if (res.status === 400) {
      status.value = data.message || 'Thiếu dữ liệu bắt buộc'
      statusType.value = 'error'
    } else {
      status.value = data.message || 'Lỗi server, thử lại sau'
      statusType.value = 'error'
    }
  } catch (e) {
    console.error(e)
    status.value = 'Không kết nối được API. Kiểm tra server đã chạy và CORS chưa.'
    statusType.value = 'error'
  } finally {
    saving.value = false
  }
}

function rescan() {
  clearScanResult()
  router.push({ name: 'scan' })
}
</script>