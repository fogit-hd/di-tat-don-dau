import type { AuthoredEffect } from './event-file'

export function authoredEffectDocument(effect: AuthoredEffect) {
  const doc: Record<string, number> = { years: effect.years }
  if (effect.revenuePct != null) doc.revenuePct = effect.revenuePct
  if (effect.costPct != null) doc.costPct = effect.costPct
  if (effect.assetsPct != null) doc.assetsPct = effect.assetsPct
  if (effect.cashPerYear != null) doc.cashPerYear = effect.cashPerYear
  if (effect.investmentPct != null) doc.investmentPct = effect.investmentPct
  return doc
}

export const EFFECT_CODES = [
  'storm',
  'rain',
  'flood',
  'drought',
  'heatwave',
  'fog',
  'pollution',
  'fire',
  'power_outage',
  'strike',
  'expansion',
  'boom',
  'epidemic',
  'earthquake',
  'cyber',
  'scandal',
  'market_crash',
  'none',
] as const

export type EffectCode = (typeof EFFECT_CODES)[number]

const RULES: { test: RegExp; code: EffectCode; severity: 1 | 2 | 3 }[] = [
  { test: /động đất|rung chấn|nứt nền/i, code: 'earthquake', severity: 3 },
  { test: /dịch bệnh|dịch cúm|ổ dịch|phong tỏa y tế|cúm lây/i, code: 'epidemic', severity: 2 },
  { test: /tin tặc|mã độc|tấn công mạng|rò rỉ dữ liệu|mạng bị chiếm/i, code: 'cyber', severity: 2 },
  { test: /bê bối|tai tiếng|bị tố|phóng viên|báo chí khui/i, code: 'scandal', severity: 2 },
  { test: /lao dốc|thị trường sụp|chứng khoán|hủy đơn hàng loạt/i, code: 'market_crash', severity: 3 },
  { test: /cháy|hỏa hoạn|cháy kho/i, code: 'fire', severity: 3 },
  { test: /mất điện|cúp điện|điện chập|sự cố điện/i, code: 'power_outage', severity: 2 },
  { test: /đình công|bãi công|công nhân bỏ|biểu tình/i, code: 'strike', severity: 2 },
  { test: /lũ|ngập|lụt/i, code: 'flood', severity: 3 },
  { test: /hạn hán|khô hạn|thiếu nước/i, code: 'drought', severity: 2 },
  { test: /nắng nóng|sóng nhiệt|nóng kỷ lục/i, code: 'heatwave', severity: 2 },
  { test: /sương mù|mù dày/i, code: 'fog', severity: 1 },
  { test: /bão|giông|lốc|áp thấp/i, code: 'storm', severity: 3 },
  { test: /mưa lớn|mưa/i, code: 'rain', severity: 1 },
  { test: /ô nhiễm|khói|xả thải|bụi|phòng sạch/i, code: 'pollution', severity: 2 },
  { test: /hạn chế xuất|cấm xuất|bị hủy|cắt hợp đồng|lừa đảo|thuế đối ứng/i, code: 'market_crash', severity: 2 },
  { test: /mở rộng|nhà máy mới|xây thêm|tăng công suất|dây chuyền mới/i, code: 'expansion', severity: 2 },
  { test: /đơn hàng|xuất khẩu|hợp đồng|bùng nổ|tăng giá|được chọn|đối tác/i, code: 'boom', severity: 2 },
]

type Impact = {
  outputMul: number
  priceMul: number
  inflationMul: number
  cash?: number
  pollution?: number
  machinesPct?: number
  machinesAdd?: number
}

const BASE: Record<EffectCode, Impact> = {
  storm: { outputMul: 0.7, priceMul: 1, inflationMul: 1, cash: -60 },
  rain: { outputMul: 0.9, priceMul: 1, inflationMul: 1 },
  flood: { outputMul: 0.55, priceMul: 1, inflationMul: 1, machinesPct: -0.06 },
  drought: { outputMul: 0.72, priceMul: 1.04, inflationMul: 1 },
  heatwave: { outputMul: 0.8, priceMul: 1, inflationMul: 1.2 },
  fog: { outputMul: 0.88, priceMul: 1, inflationMul: 1 },
  pollution: { outputMul: 0.92, priceMul: 0.9, inflationMul: 1, pollution: 8 },
  fire: { outputMul: 0.5, priceMul: 1, inflationMul: 1, cash: -220 },
  power_outage: { outputMul: 0.45, priceMul: 1, inflationMul: 1 },
  strike: { outputMul: 0.6, priceMul: 1, inflationMul: 1 },
  expansion: { outputMul: 1, priceMul: 1.05, inflationMul: 1, machinesAdd: 0.35, cash: -120 },
  boom: { outputMul: 1.08, priceMul: 1.12, inflationMul: 1, cash: 180 },
  epidemic: { outputMul: 0.62, priceMul: 1.06, inflationMul: 1, cash: -80 },
  earthquake: { outputMul: 0.5, priceMul: 1, inflationMul: 1, machinesPct: -0.08, cash: -160 },
  cyber: { outputMul: 0.7, priceMul: 1, inflationMul: 1, cash: -140 },
  scandal: { outputMul: 0.85, priceMul: 0.82, inflationMul: 1, cash: -100 },
  market_crash: { outputMul: 0.78, priceMul: 0.7, inflationMul: 1.15, cash: -200 },
  none: { outputMul: 1, priceMul: 1, inflationMul: 1 },
}

export function classifyEvent(text: string): { code: EffectCode; severity: 1 | 2 | 3 } {
  for (const rule of RULES) {
    if (rule.test.test(text)) {
      const severity = /gấp đôi|trầm trọng|sụp|phá hủy|lớn/.test(text) ? 3 : rule.severity
      return { code: rule.code, severity }
    }
  }
  return { code: 'none', severity: 1 }
}

export function effectPayload(code: EffectCode, severity: 1 | 2 | 3) {
  const base = BASE[code]
  const gain = severity === 1 ? 0.65 : severity === 3 ? 1.35 : 1
  const soften = (mul: number) => {
    const delta = (mul - 1) * gain
    return Math.round((1 + delta) * 1000) / 1000
  }
  const amount = (value: number) => Math.round(value * gain)
  const payload: Record<string, [number, number]> = {
    durationSec: [3600, 3600],
    outputMul: [soften(base.outputMul), soften(base.outputMul)],
    priceMul: [soften(base.priceMul), soften(base.priceMul)],
    inflationMul: [soften(base.inflationMul), soften(base.inflationMul)],
  }
  if (base.cash) payload.cash = [amount(base.cash), amount(base.cash)]
  if (base.pollution) payload.pollution = [amount(base.pollution), amount(base.pollution)]
  if (base.machinesPct) payload.machinesPct = [soften(1 + base.machinesPct) - 1, soften(1 + base.machinesPct) - 1]
  if (base.machinesAdd) payload.machinesAdd = [Math.round(base.machinesAdd * gain * 100) / 100, Math.round(base.machinesAdd * gain * 100) / 100]
  return { ...payload, years: 1 }
}
