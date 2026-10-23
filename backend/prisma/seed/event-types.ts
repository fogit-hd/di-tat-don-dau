import type { Prisma, PrismaClient } from '@prisma/client'
import { EFFECT_CODES, effectPayload } from './effects'
import { loadGeneralEvents, type GeneralEventSeed } from './event-file'
import { loadOfficialFile, slugify } from './official'

export const EVENT_GROUPS = ['nature', 'market', 'policy', 'technology', 'people', 'luck'] as const

export function assertEventTypes(events: GeneralEventSeed[] = loadGeneralEvents()) {
  if (events.length < 80 || events.length > 100) throw new Error(`Cần 80 đến 100 loại sự kiện, đang có ${events.length}`)
  const ids = new Set<string>()
  const groups = new Set<string>()
  const visuals = new Set<string>()
  for (const event of events) {
    if (ids.has(event.id)) throw new Error(`Trùng loại sự kiện ${event.id}`)
    ids.add(event.id)
    if (!(EVENT_GROUPS as readonly string[]).includes(event.group)) throw new Error(`Nhóm ${event.group} không hợp lệ`)
    if (!(EFFECT_CODES as readonly string[]).includes(event.visual)) throw new Error(`Mã visual ${event.visual} không hợp lệ`)
    if (event.severity < 1 || event.severity > 3) throw new Error(`${event.id} có severity ngoài 1-3`)
    if (!event.groups.length) throw new Error(`${event.id} chưa gắn nhóm ngành`)
    groups.add(event.group)
    visuals.add(event.visual)
  }
  for (const group of EVENT_GROUPS) {
    if (!groups.has(group)) throw new Error(`Thiếu nhóm ${group}`)
  }
  for (const code of ['epidemic', 'earthquake', 'cyber', 'scandal', 'market_crash'] as const) {
    if (!visuals.has(code)) throw new Error(`Chưa có sự kiện visual ${code}`)
  }
}

export async function seedEventTypes(prisma: PrismaClient) {
  const events = loadGeneralEvents()
  assertEventTypes(events)
  const source = loadOfficialFile()
  const contexts = await prisma.context.findMany()
  const regions = await prisma.region.findMany()
  const knownGroups = new Set(source.industries.map((industry) => industry.group))
  for (const event of events) {
    for (const group of event.groups) {
      if (!knownGroups.has(group)) throw new Error(`${event.id} gắn nhóm ngành không có: ${group}`)
    }
    const industryIds = source.industries.filter((industry) => event.groups.includes(industry.group)).map((industry) => industry.slug)
    if (!industryIds.length) throw new Error(`${event.id} không khớp ngành nào`)
    const contextIds = matchContexts(event.contexts, contexts, event.id)
    const narrations = dedupeNarrations(event.variants.flatMap((variant) => narrationsFor(variant, regions, contexts, event.id)))
    const data = {
      industryId: null,
      scope: 'team',
      weight: 1,
      visual: event.visual,
      title: event.title,
      body: event.body,
      exposure: 'any',
      effect: effectPayload(event.visual, event.severity) as Prisma.InputJsonValue,
      effectCode: event.visual,
      severity: event.severity,
      good: event.good,
      group: event.group,
      sort: 1000,
      active: true,
    }
    await prisma.gameEvent.upsert({
      where: { id: event.id },
      create: { id: event.id, ...data },
      update: data,
    })
    await prisma.eventIndustryTag.deleteMany({ where: { eventId: event.id } })
    await prisma.eventContextTag.deleteMany({ where: { eventId: event.id } })
    await prisma.eventNarration.deleteMany({ where: { eventId: event.id } })
    if (industryIds.length) {
      await prisma.eventIndustryTag.createMany({ data: industryIds.map((industryId) => ({ eventId: event.id, industryId })) })
    }
    if (contextIds.length) {
      await prisma.eventContextTag.createMany({ data: contextIds.map((contextId) => ({ eventId: event.id, contextId })) })
    }
    if (narrations.length) {
      await prisma.eventNarration.createMany({ data: narrations.map((row) => ({ eventId: event.id, ...row })) })
    }
  }
  return events.length
}

function dedupeNarrations<T extends { regionId: string; contextId: string }>(rows: T[]) {
  const seen = new Set<string>()
  return rows.filter((row) => {
    const key = `${row.regionId}\0${row.contextId}`
    if (seen.has(key)) return false
    seen.add(key)
    return true
  })
}

function matchContexts(needles: string[], contexts: { id: string; name: string }[], label: string) {
  if (!needles.length) return []
  const ids = contexts
    .filter((context) => needles.some((needle) => context.name.toLowerCase().includes(needle.toLowerCase()) || context.id === needle))
    .map((context) => context.id)
  if (!ids.length) throw new Error(`${label} không khớp bối cảnh`)
  return ids
}

function narrationsFor(
  variant: { region?: string; context?: string; title: string; body: string },
  regions: { id: string; name: string }[],
  contexts: { id: string; name: string }[],
  eventId: string,
) {
  const regionId = variant.region ? matchRegion(variant.region, regions, eventId) : ''
  const contextIds = variant.context ? matchContexts([variant.context], contexts, eventId) : ['']
  return contextIds.map((contextId) => ({
    regionId,
    contextId,
    title: variant.title,
    body: variant.body,
  }))
}

function matchRegion(name: string, regions: { id: string; name: string }[], eventId: string) {
  const slug = slugify(name)
  const found = regions.find((region) => region.id === slug || region.name === name)
  if (!found) throw new Error(`${eventId} không thấy vùng ${name}`)
  return found.id
}
