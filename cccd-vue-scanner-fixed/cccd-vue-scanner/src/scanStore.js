import { reactive } from 'vue'

// Store đơn giản dùng chung giữa trang Scan và trang Kết quả.
// Vì đây là SPA (không reload trang) nên không cần localStorage/query string,
// chỉ cần 1 object reactive import ở 2 nơi.
export const scanResult = reactive({
  citizenId: '', fullName: '', dateOfBirth: '', gender: '',
  address: '', issueDate: '', oldId: '', raw: ''
})

export function setScanResult(data) {
  Object.keys(scanResult).forEach(k => { scanResult[k] = data[k] ?? '' })
}

export function clearScanResult() {
  Object.keys(scanResult).forEach(k => { scanResult[k] = '' })
}
