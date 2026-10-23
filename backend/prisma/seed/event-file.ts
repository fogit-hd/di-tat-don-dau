import { readFileSync, existsSync } from 'fs'
import { resolve } from 'path'
import { EFFECT_CODES, classifyEvent, type EffectCode } from './effects'

const GOOD_VISUALS = new Set<EffectCode>(['boom', 'expansion'])

export type SeedVisualEvent = {
  id?: string
  title: string
  body: string
  visual: EffectCode
  severity: 1 | 2 | 3
  good: boolean
}

export type SeedNarration = {
  region?: string
  context?: string
  title: string
  body: string
}

export type GeneralEventSeed = SeedVisualEvent & {
  id: string
  group: string
  groups: string[]
  contexts: string[]
  variants: SeedNarration[]
}

export function loadIndustriesFile() {
  return JSON.parse(readFileSync(resolve(process.cwd(), 'prisma/seed/industries.seed.json'), 'utf8')) as {
    industries: { slug: string; events: unknown[] }[]
  }
}

export function eventsSeedPath() {
  return resolve(process.cwd(), 'prisma/seed/events.seed.json')
}

export function loadGeneralEvents(): GeneralEventSeed[] {
  const file = eventsSeedPath()
  if (!existsSync(file)) return []
  const raw = JSON.parse(readFileSync(file, 'utf8')) as { events?: unknown[] }
  if (!Array.isArray(raw.events)) throw new Error('events.seed.json thiếu mảng events')
  return raw.events.map((row, index) => normalizeGeneralEvent(row, index))
}

export function normalizeIndustryEvent(raw: unknown, index: number): SeedVisualEvent {
  if (typeof raw === 'string') {
    const classified = classifyEvent(raw)
    return {
      title: raw,
      body: raw,
      visual: classified.code,
      severity: classified.severity,
      good: GOOD_VISUALS.has(classified.code),
    }
  }
  if (!raw || typeof raw !== 'object') throw new Error(`Sự kiện ngành thứ ${index + 1} không hợp lệ`)
  return readVisualEvent(raw as Record<string, unknown>, `ngành #${index + 1}`)
}

export function normalizeGeneralEvent(raw: unknown, index: number): GeneralEventSeed {
  if (!raw || typeof raw !== 'object') throw new Error(`Sự kiện chung thứ ${index + 1} không hợp lệ`)
  const row = raw as Record<string, unknown>
  const base = readVisualEvent(row, `chung #${index + 1}`)
  const id = text(row.id, `Sự kiện chung thứ ${index + 1} thiếu id`)
  const group = text(row.group, `${id} thiếu group`)
  const groups = stringList(row.groups)
  const contexts = stringList(row.contexts)
  if (!groups.length) throw new Error(`${id} chưa gắn nhóm ngành`)
  const variants = Array.isArray(row.variants) ? row.variants.map((item, variantIndex) => readNarration(item, `${id} biến thể ${variantIndex + 1}`)) : []
  return { ...base, id, group, groups, contexts, variants }
}

function readVisualEvent(row: Record<string, unknown>, label: string): SeedVisualEvent {
  const visual = text(row.visual, `${label} thiếu visual`)
  if (!(EFFECT_CODES as readonly string[]).includes(visual)) throw new Error(`${label} có visual lạ: ${visual}`)
  const severity = row.severity
  if (severity !== 1 && severity !== 2 && severity !== 3) throw new Error(`${label} cần severity 1, 2 hoặc 3`)
  const title = text(row.title ?? row.text, `${label} thiếu title`)
  const described = optionalText(row.description)
  const legacyBody = optionalText(row.body)
  const body = described ?? legacyBody ?? title
  return {
    id: optionalText(row.id),
    title,
    body,
    visual: visual as EffectCode,
    severity,
    good: readGood(row, label),
  }
}

/** `tone` good/bad is the illustrator flag. Older rows use a boolean `good`. `icon` is accepted and ignored. */
function readGood(row: Record<string, unknown>, label: string) {
  if (typeof row.good === 'boolean') return row.good
  if (row.tone === 'good') return true
  if (row.tone === 'bad') return false
  throw new Error(`${label} cần tone good/bad hoặc cờ good`)
}

function readNarration(raw: unknown, label: string): SeedNarration {
  if (!raw || typeof raw !== 'object') throw new Error(`${label} không hợp lệ`)
  const row = raw as Record<string, unknown>
  const region = optionalText(row.region)
  const context = optionalText(row.context)
  if (!region && !context) throw new Error(`${label} cần region hoặc context`)
  return {
    region,
    context,
    title: text(row.title, `${label} thiếu title`),
    body: text(row.body ?? row.title, `${label} thiếu body`),
  }
}

function text(value: unknown, message: string) {
  if (typeof value !== 'string' || !value.trim()) throw new Error(message)
  return value.trim()
}

function optionalText(value: unknown) {
  if (typeof value !== 'string') return undefined
  const trimmed = value.trim()
  return trimmed || undefined
}

function stringList(value: unknown) {
  if (value == null) return []
  if (!Array.isArray(value) || value.some((item) => typeof item !== 'string')) throw new Error('Danh sách tag phải là mảng chuỗi')
  return value.map((item) => item.trim()).filter(Boolean)
}
