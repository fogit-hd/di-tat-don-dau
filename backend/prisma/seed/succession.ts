import type { PrismaClient } from '@prisma/client'
import { loadOfficialFile, slugify } from './official'

const ODDS = [
  { minYear: 1, chance: 0 },
  { minYear: 18, chance: 0.03 },
  { minYear: 20, chance: 0.1 },
  { minYear: 23, chance: 0.2 },
  { minYear: 27, chance: 0.36 },
  { minYear: 32, chance: 0.55 },
  { minYear: 40, chance: 0.78 },
  { minYear: 50, chance: 0.9 },
]

const GAUGE = {
  id: 'default',
  debtDependencyWeight: 0.04,
  debtLeverageWeight: 0.55,
  debtCap: 1.5,
  valueFloor: 1,
}

const HEALTH: {
  id: string
  outcome: string
  minReserveRatio?: number
  maxDebtRatio?: number
  minDebtRatio?: number
  weightAdd: number
}[] = [
  { id: 'sound.prosper', outcome: 'prosper', minReserveRatio: 0.2, maxDebtRatio: 0.55, weightAdd: 2.2 },
  { id: 'sound.double', outcome: 'double', minReserveRatio: 0.2, maxDebtRatio: 0.55, weightAdd: 1.8 },
  { id: 'sound.bankrupt', outcome: 'bankrupt', minReserveRatio: 0.2, maxDebtRatio: 0.55, weightAdd: -0.7 },
  { id: 'heavy.bankrupt', outcome: 'bankrupt', minDebtRatio: 0.72, weightAdd: 3 },
  { id: 'heavy.squander', outcome: 'squander', minDebtRatio: 0.72, weightAdd: 0.8 },
  { id: 'heavy.prosper', outcome: 'prosper', minDebtRatio: 0.72, weightAdd: -1 },
  { id: 'heavy.double', outcome: 'double', minDebtRatio: 0.72, weightAdd: -0.7 },
]

const GROUP_REASON: Record<string, string> = {
  'cong-nghiep-nang': 'Tai nạn tại xưởng {{industry}}',
  'nong-san': 'Chủ {{factory}} qua đời sau ca đêm',
  'cong-nghe-cao': 'Chủ {{factory}} đột quỵ giữa ca',
  'tieu-dung': 'Chủ {{factory}} bệnh nặng',
  'nang-luong': 'Tai nạn vận hành tại {{factory}}',
  'ha-tang': 'Tai nạn trên công trường {{factory}}',
}

const GROUP_HEIR: Record<string, string> = {
  'cong-nghiep-nang': 'Xưởng nặng vẫn chạy dưới tay người thừa kế.',
  'nong-san': 'Xưởng {{industry}} sang tay vẫn còn chỗ đứng.',
  'cong-nghe-cao': 'Đội kỹ sư giữ {{factory}} đi tiếp.',
  'tieu-dung': 'Nhãn {{industry}} vẫn bán được sau khi sang tên.',
  'nang-luong': 'Hiện trường {{industry}} còn chạy sau khi giao lại.',
  'ha-tang': 'Công trường {{factory}} được người thừa kế giữ.',
}

const CONTEXT_REASON: { test: RegExp; text: string }[] = [
  { test: /khủng hoảng/, text: 'Kiệt sức sau cuộc khủng hoảng' },
  { test: /FDI|nước ngoài/, text: 'Chủ nhà máy mất khi đang đàm phán với đối tác ngoại' },
  { test: /cổ phần/, text: 'Chủ cũ qua đời giữa lúc chuyển đổi cổ phần' },
  { test: /hạ tầng còn yếu/, text: 'Tai nạn vì hạ tầng xuống cấp' },
]

const CONTEXT_HEIR: { test: RegExp; outcomeType: string; label: string; detail: string; weight: number; multiplier: number }[] = [
  { test: /khủng hoảng/, outcomeType: 'bankrupt', label: 'Phá sản', detail: 'Nợ khủng hoảng nuốt hết tài sản.', weight: 3, multiplier: 0 },
  { test: /khởi nghiệp/, outcomeType: 'squander', label: 'Hoang phí', detail: 'Đời sau tiêu hết vốn tự có.', weight: 2.6, multiplier: 0.75 },
  { test: /FDI|nước ngoài/, outcomeType: 'steady', label: 'Giữ nguyên', detail: 'Đối tác ngoại giữ nhà máy đúng như lúc giao.', weight: 2.4, multiplier: 1 },
  { test: /nhiều kỹ sư/, outcomeType: 'prosper', label: 'Khá giả', detail: 'Đội kỹ sư giúp người thừa kế đi lên.', weight: 2.4, multiplier: 1.5 },
  { test: /trọng điểm/, outcomeType: 'double', label: 'Nhân đôi', detail: 'Dự án trọng điểm làm tài sản tăng gấp đôi.', weight: 1.8, multiplier: 2 },
]

const HEIRS = [
  { outcomeType: 'bankrupt', label: 'Phá sản', detail: 'Người thừa kế làm tan nhà máy.', weight: 1, multiplier: 0, sort: 1 },
  { outcomeType: 'squander', label: 'Hoang phí', detail: 'Người thừa kế tiêu bớt một phần tư tài sản.', weight: 1.4, multiplier: 0.75, sort: 2 },
  { outcomeType: 'steady', label: 'Giữ nguyên', detail: 'Người thừa kế giữ nhà máy như cũ.', weight: 2.2, multiplier: 1, sort: 3 },
  { outcomeType: 'prosper', label: 'Khá giả', detail: 'Người thừa kế làm ăn khấm khá.', weight: 1.4, multiplier: 1.5, sort: 4 },
  { outcomeType: 'double', label: 'Nhân đôi', detail: 'Người thừa kế nhân đôi tài sản.', weight: 0.8, multiplier: 2, sort: 5 },
]

export async function seedSuccession(prisma: PrismaClient) {
  const source = loadOfficialFile()
  await prisma.heirHealthWeight.deleteMany()
  await prisma.successionGauge.deleteMany()
  await prisma.successionReason.deleteMany()
  await prisma.heirOutcome.deleteMany()
  await prisma.successionOdds.deleteMany()

  await prisma.successionOdds.createMany({ data: ODDS })
  await prisma.successionGauge.create({ data: GAUGE })
  await prisma.heirHealthWeight.createMany({ data: HEALTH })

  const reasons: { id: string; industryId: string | null; contextId: string | null; text: string; weight: number; sort: number }[] = [
    { id: 'accident', industryId: null, contextId: null, text: 'Tai nạn tại hiện trường', weight: 1, sort: 1 },
    { id: 'illness', industryId: null, contextId: null, text: 'Bệnh nặng', weight: 1, sort: 2 },
    { id: 'age', industryId: null, contextId: null, text: 'Tuổi già', weight: 1, sort: 3 },
  ]
  source.industries.forEach((industry, index) => {
    const text = GROUP_REASON[industry.group]
    if (!text) return
    reasons.push({
      id: `reason.${industry.slug}`,
      industryId: industry.slug,
      contextId: null,
      text,
      weight: 2.2,
      sort: 10 + index,
    })
  })
  source.contexts.forEach((text, index) => {
    const hit = CONTEXT_REASON.find((row) => row.test.test(text))
    if (!hit) return
    reasons.push({
      id: `reason.ctx.${slugify(text)}`,
      industryId: null,
      contextId: slugify(text),
      text: hit.text,
      weight: 2.4,
      sort: 200 + index,
    })
  })
  await prisma.successionReason.createMany({ data: reasons })

  const heirs: {
    id: string
    outcomeType: string
    industryId: string | null
    contextId: string | null
    label: string
    detail: string
    weight: number
    multiplier: number
    sort: number
  }[] = HEIRS.map((row) => ({
    id: row.outcomeType,
    outcomeType: row.outcomeType,
    industryId: null,
    contextId: null,
    label: row.label,
    detail: row.detail,
    weight: row.weight,
    multiplier: row.multiplier,
    sort: row.sort,
  }))
  source.industries.forEach((industry) => {
    const detail = GROUP_HEIR[industry.group]
    if (!detail) return
    heirs.push({
      id: `prosper.${industry.slug}`,
      outcomeType: 'prosper',
      industryId: industry.slug,
      contextId: null,
      label: 'Khá giả',
      detail,
      weight: 1.4,
      multiplier: 1.5,
      sort: 4,
    })
  })
  source.contexts.forEach((text) => {
    const hit = CONTEXT_HEIR.find((row) => row.test.test(text))
    if (!hit) return
    const id = slugify(text)
    heirs.push({
      id: `${hit.outcomeType}.${id}`,
      outcomeType: hit.outcomeType,
      industryId: null,
      contextId: id,
      label: hit.label,
      detail: hit.detail,
      weight: hit.weight,
      multiplier: hit.multiplier,
      sort: HEIRS.find((row) => row.outcomeType === hit.outcomeType)?.sort ?? 1,
    })
  })
  await prisma.heirOutcome.createMany({ data: heirs })
  return { odds: ODDS.length, reasons: reasons.length, heirs: heirs.length, health: HEALTH.length }
}
