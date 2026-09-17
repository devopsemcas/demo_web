// Chuyển "DD/MM/YYYY" (định dạng trên QR CCCD) sang "YYYY-MM-DD" (Postgres DATE)
export function toISODate(vnDate) {
  if (!vnDate) return null
  const m = String(vnDate).trim().match(/^(\d{1,2})\/(\d{1,2})\/(\d{4})$/)
  if (!m) return null
  const [, d, mo, y] = m
  return `${y}-${mo.padStart(2, '0')}-${d.padStart(2, '0')}`
}