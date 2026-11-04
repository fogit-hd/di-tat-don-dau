/** Economy values are stored in millions of VND, including existing room balances. */
export function money(value: number) {
  const millions = Math.round(value * 100) / 100
  return Math.abs(millions) >= 1000
    ? `${(millions / 1000).toLocaleString('vi-VN', { maximumFractionDigits: 3 })} tỷ`
    : `${millions.toLocaleString('vi-VN', { maximumFractionDigits: 2 })} triệu`
}

/** Compatible with narration templates already stored in the database. */
export function moneyTemplate(template: string, values: Record<string, number>) {
  return template.replace(/\{\{(\w+)\}\}(?:\s+tỷ(?:\s+VNĐ)?)?/g, (match, key: string) =>
    values[key] == null ? match : money(values[key]))
}
