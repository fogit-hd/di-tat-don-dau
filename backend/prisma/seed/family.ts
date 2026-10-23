import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Prisma, PrismaClient } from '@prisma/client'
import { EFFECT_CODES, effectPayload } from './effects'

const TRAITS = [
  { id: 'longevity', label: 'Trường thọ', detail: 'Chủ xưởng sống lâu. Nguy cơ qua đời cố định 1% mỗi năm.', sort: 1 },
  { id: 'illness', label: 'Bạo bệnh', detail: 'Chủ xưởng mang bệnh nặng. Nguy cơ qua đời tăng thêm 10 điểm phần trăm mỗi năm.', sort: 2 },
  { id: 'heir_trained', label: 'Người kế nghiệp được đào tạo', detail: 'Đời sau dễ phát đạt hơn khi nhận xưởng.', sort: 3 },
  { id: 'inheritance_dispute', label: 'Tranh chấp thừa kế', detail: 'Con cháu dễ phá gia chi tử khi chia xưởng.', sort: 4 },
  { id: 'family_fund', label: 'Quỹ gia tộc', detail: 'Gia đình có quỹ dự phòng, nên chuyển giao không còn phá sản.', sort: 5 },
  { id: 'life_insurance', label: 'Bảo hiểm nhân thọ', detail: 'Khi chủ qua đời, xưởng nhận thêm một khoản tiền.', sort: 6 },
  { id: 'heir_abroad', label: 'Con du học về nước', detail: 'Người thừa kế có thêm cơ hội nhân đôi tài sản.', sort: 7 },
]

const POLICY = {
  id: 'default',
  baseChance: 0.03,
  stepPerYear: 0.03,
  maxChance: 0.3,
  longevityChance: 0.01,
  illnessAdd: 0.1,
  traitRules: {
    heir_trained: { outcome: 'prosper', add: 3 },
    inheritance_dispute: { outcome: 'squander', add: 3 },
    family_fund: { outcome: 'bankrupt', set: 0 },
    heir_abroad: { outcome: 'double', add: 3 },
  },
}

type FamilyRow = {
  id: string
  trait: string
  title: string
  body: string
  visual: string
  icon: string
  severity: number
  good: boolean
  weight: number
}

export function loadFamilyEvents() {
  const file = resolve(process.cwd(), 'prisma/seed/family.seed.json')
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { events: FamilyRow[] }
  if (!Array.isArray(raw.events) || raw.events.length < 8) throw new Error('Thiếu sự kiện gia đình')
  return raw.events
}

export async function seedFamily(prisma: PrismaClient) {
  for (const row of TRAITS) {
    await prisma.traitCopy.upsert({ where: { id: row.id }, create: row, update: row })
  }
  await prisma.successionPolicy.upsert({
    where: { id: POLICY.id },
    create: { ...POLICY, traitRules: POLICY.traitRules as Prisma.InputJsonValue },
    update: {
      baseChance: POLICY.baseChance,
      stepPerYear: POLICY.stepPerYear,
      maxChance: POLICY.maxChance,
      longevityChance: POLICY.longevityChance,
      illnessAdd: POLICY.illnessAdd,
      traitRules: POLICY.traitRules as Prisma.InputJsonValue,
    },
  })
  const events = loadFamilyEvents()
  for (const [sort, event] of events.entries()) {
    if (!(EFFECT_CODES as readonly string[]).includes(event.visual)) throw new Error(`${event.id} có visual lạ`)
    const data = {
      industryId: null,
      scope: 'team',
      weight: event.weight,
      visual: event.visual,
      title: event.title,
      body: event.body,
      exposure: 'any',
      effect: effectPayload(event.visual, event.severity as 1 | 2 | 3) as Prisma.InputJsonValue,
      effectCode: event.visual,
      severity: event.severity,
      good: event.good,
      icon: event.icon,
      trait: event.trait,
      group: 'family',
      sort: 2000 + sort,
      active: true,
    }
    await prisma.gameEvent.upsert({ where: { id: event.id }, create: { id: event.id, ...data }, update: data })
    await prisma.eventIndustryTag.deleteMany({ where: { eventId: event.id } })
    await prisma.eventContextTag.deleteMany({ where: { eventId: event.id } })
  }
  return events.length
}
