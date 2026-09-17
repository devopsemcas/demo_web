function normalizeDate(value) {
  if (!value) return ''
  const s = String(value).trim()
  if (/^\d{8}$/.test(s)) return `${s.slice(0, 2)}/${s.slice(2, 4)}/${s.slice(4, 8)}`
  if (/^\d{2}\/\d{2}\/\d{4}$/.test(s)) return s
  return s
}

// Cấu trúc mới: CCCD | CMND | Họ tên | Ngày sinh | Giới tính | Địa chỉ | Ngày cấp
export function parseCCCD(raw) {
  const text = String(raw ?? '').replace(/\r\n/g, '\n').trim()
  const parts = text.split('|').map(x => x.trim())

  const out = {
    citizenId: parts[0] || '',     // Số CCCD (12 số)
    oldId: parts[1] || '',         // Số CMND cũ (9 số)
    fullName: parts[2] || '',      // Họ và tên
    dateOfBirth: normalizeDate(parts[3]), // Ngày sinh
    gender: parts[4] || '',        // Giới tính
    address: parts[5] || '',       // Địa chỉ thường trú
    issueDate: normalizeDate(parts[6]),   // Ngày cấp
    raw: text,
    fields: parts
  }

  // Xử lý trường hợp chuỗi bị ngắt dòng thay vì phân tách bằng dấu pipe
  if (parts.length < 3 && text.includes('\n')) {
    const lines = text.split('\n').map(x => x.trim()).filter(Boolean)
    out.citizenId = lines[0] || ''
    out.oldId = lines[1] || ''
    out.fullName = lines[2] || ''
    out.dateOfBirth = normalizeDate(lines[3])
    out.gender = lines[4] || ''
    out.address = lines[5] || ''
    out.issueDate = normalizeDate(lines[6])
  }

  return out
}