// Stored economy values are millions of VND; changing display units never changes purchasing power.
export function money(value: number) {
  const millions = Math.round(value * 100) / 100
  return Math.abs(millions) >= 1000
    ? `${(millions / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} tỷ`
    : `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} triệu`
}

export function vnd(value: number) {
  return `${money(value)} VNĐ`
}

export function clock(ms: number) {
  const total = Math.max(0, Math.floor(ms / 1000))
  const minutes = Math.floor(total / 60)
  const seconds = total % 60
  return `${minutes}:${String(seconds).padStart(2, '0')}`
}

export function clamp(value: number, min: number, max: number) {
  return Math.max(min, Math.min(max, value))
}
