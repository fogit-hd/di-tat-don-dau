import { readFileSync } from 'fs'
import { resolve } from 'path'
import type { Prisma, PrismaClient } from '@prisma/client'
import { normalizeAnchors } from '../../src/game/anchors'
import { balance } from './balance'
import { effectPayload } from './effects'
import { normalizeIndustryEvent } from './event-file'

type OfficialIndustry = {
  slug: string
  name: string
  group: string
  groupName: string
  role: string
  investLabels: { nhanLuc: string; mayMoc: string; phuTro: string; haTang: string }
  startingSituations: string[]
  events: unknown[]
  images: string[]
}

type OfficialFile = {
  industries: OfficialIndustry[]
  regions: string[]
  scales: { key: string; label: string; capitalFactor: number }[]
  contexts: string[]
  factoryNameParts: string[]
}

export function slugify(value: string) {
  return value
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '')
    .replace(/đ/gi, 'd')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-|-$/g, '')
}

function contextStart(text: string) {
  const start = { cashMul: 1, engineers: 80, machines: 0.4, pollution: 4, dependency: 2, condition: 0.92 }
  if (/khủng hoảng/.test(text)) start.cashMul = 0.72
  if (/vay ưu đãi/.test(text)) start.cashMul = 1.15
  if (/thiếu kỹ sư/.test(text)) start.engineers = 18
  if (/nhiều kỹ sư/.test(text)) {
    start.engineers = 240
    start.condition = 0.68
  }
  if (/nhập khẩu|phụ thuộc/.test(text)) start.dependency = 6
  if (/FDI|nước ngoài/.test(text)) start.dependency = 4.2
  if (/trọng điểm/.test(text)) start.cashMul = 1.25
  if (/hạ tầng còn yếu/.test(text)) start.machines = 0.12
  if (/cạnh tranh/.test(text)) start.cashMul = 0.84
  if (/cổ phần/.test(text)) start.condition = 0.78
  if (/công nghệ cao/.test(text)) start.pollution = 2
  if (/khởi nghiệp/.test(text)) {
    start.machines = 0.1
    start.engineers = 28
    start.cashMul = 0.8
    start.dependency = 1
  }
  return start
}

function priceFor(epl: number, baseOutput: number) {
  const capital = balance.priceCapitalBase + epl / balance.engPerTy
  const target = capital * balance.priceRevenueShare
  return {
    basePrice: target / baseOutput,
    opex: target * balance.priceOpexShare,
    idleCost: balance.defaultIdleCost,
  }
}

export function loadOfficialFile(): OfficialFile {
  const file = resolve(process.cwd(), 'prisma/seed/industries.seed.json')
  return JSON.parse(readFileSync(file, 'utf8')) as OfficialFile
}

function loadAnchorMap(): Record<string, Prisma.InputJsonValue> {
  const file = resolve(process.cwd(), 'prisma/seed/anchors.json')
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { images?: Record<string, unknown> }
  const map: Record<string, Prisma.InputJsonValue> = {}
  for (const [slug, row] of Object.entries(raw.images ?? {})) {
    const anchors = normalizeAnchors(row)
    if (anchors) map[slug] = anchors
  }
  return map
}

export async function seedOfficial(prisma: PrismaClient) {
  const source = loadOfficialFile()
  const anchors = loadAnchorMap()
  await prisma.eventChoice.deleteMany()
  await prisma.eventVariant.deleteMany()
  await prisma.gameEvent.deleteMany()
  await prisma.scenario.deleteMany()
  await prisma.industryDirection.deleteMany()
  await prisma.industryNamePattern.deleteMany()
  await prisma.industry.deleteMany()
  await prisma.region.deleteMany()
  await prisma.scale.deleteMany()
  await prisma.context.deleteMany()
  await prisma.factoryNamePart.deleteMany()

  for (const [index, name] of source.regions.entries()) {
    const id = slugify(name)
    await prisma.region.create({ data: { id, name, sort: index + 1, active: true } })
  }
  for (const [index, scale] of source.scales.entries()) {
    await prisma.scale.create({
      data: {
        id: scale.key,
        name: scale.label,
        sort: index + 1,
        roleTemplate: '{{role}}',
        capitalFactor: scale.capitalFactor,
        active: true,
      },
    })
  }
  for (const [index, text] of source.contexts.entries()) {
    const start = contextStart(text)
    await prisma.context.create({
      data: {
        id: slugify(text),
        name: text,
        line: text,
        sort: index + 1,
        active: true,
        ...start,
      },
    })
  }
  for (const [index, name] of source.factoryNameParts.entries()) {
    await prisma.factoryNamePart.create({ data: { id: slugify(name), name, sort: index + 1 } })
  }

  const shared = { epl: 1400, tech: 0.12, support: 0.08, infra: 0.08, emission: 1, baseOutput: 10 }
  const price = priceFor(shared.epl, shared.baseOutput)
  for (const [index, industry] of source.industries.entries()) {
    await prisma.industry.create({
      data: {
        id: industry.slug,
        name: industry.name,
        unit: 'sản phẩm',
        art: industry.slug,
        sort: index + 1,
        active: true,
        role: industry.role,
        mission: industry.startingSituations[0] ?? industry.name,
        worker: 'người làm',
        product: industry.name,
        leap: industry.name,
        weak: industry.groupName,
        ...shared,
        basePrice: price.basePrice,
        opex: price.opex,
        idleCost: price.idleCost,
        group: industry.group,
        groupName: industry.groupName,
        anchors: anchors[industry.slug] ?? undefined,
      },
    })
    const labels = [
      ['eng', industry.investLabels.nhanLuc],
      ['mac', industry.investLabels.mayMoc],
      ['sup', industry.investLabels.phuTro],
      ['inf', industry.investLabels.haTang],
    ] as const
    for (const [sort, [line, label]] of labels.entries()) {
      await prisma.industryDirection.create({ data: { industryId: industry.slug, line, label, sort } })
    }
    for (const [sort, body] of industry.startingSituations.entries()) {
      await prisma.scenario.create({
        data: {
          id: `${industry.slug}.s${sort + 1}`,
          industryId: industry.slug,
          role: industry.role,
          mission: body,
          body,
        },
      })
    }
    for (const [sort, raw] of industry.events.entries()) {
      const event = normalizeIndustryEvent(raw, sort)
      await prisma.gameEvent.create({
        data: {
          id: event.id ?? `${industry.slug}.e${sort + 1}`,
          industryId: industry.slug,
          scope: 'team',
          weight: 1,
          visual: event.visual,
          title: event.title,
          body: event.body,
          exposure: 'any',
          effect: effectPayload(event.visual, event.severity),
          effectCode: event.visual,
          severity: event.severity,
          good: event.good,
          sort,
          active: true,
        },
      })
    }
  }

  return {
    industries: source.industries.length,
    regions: source.regions.length,
    scales: source.scales.length,
    contexts: source.contexts.length,
    nameParts: source.factoryNameParts.length,
    events: source.industries.reduce((sum, item) => sum + item.events.length, 0),
    themes:
      source.industries.length *
      source.regions.length *
      source.scales.length *
      source.contexts.length *
      4 *
      source.factoryNameParts.length,
  }
}
