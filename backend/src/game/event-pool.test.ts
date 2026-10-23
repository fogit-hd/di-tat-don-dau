import { describe, expect, it } from 'vitest'
import { loadGeneralEvents, loadIndustriesFile, normalizeIndustryEvent } from '../../prisma/seed/event-file'
import { assertEventTypes, EVENT_GROUPS } from '../../prisma/seed/event-types'
import { classifyEvent, EFFECT_CODES } from '../../prisma/seed/effects'
import { eventCopy } from './engine'
import { eventApplies } from './event-pool'
import type { EventDef, ThemeDef } from './types'

describe('event types', () => {
  it('stays inside 80 to 100 and covers every group and the new effect codes', () => {
    const events = loadGeneralEvents()
    expect(() => assertEventTypes(events)).not.toThrow()
    expect(events.length).toBeGreaterThanOrEqual(80)
    expect(events.length).toBeLessThanOrEqual(100)
    for (const group of EVENT_GROUPS) {
      expect(events.some((event) => event.group === group)).toBe(true)
    }
    for (const code of ['epidemic', 'earthquake', 'cyber', 'scandal', 'market_crash'] as const) {
      expect(events.some((event) => event.visual === code)).toBe(true)
      expect(EFFECT_CODES).toContain(code)
    }
    expect(events.every((event) => typeof event.good === 'boolean' && event.severity >= 1 && event.severity <= 3)).toBe(true)
    expect(events.some((event) => event.variants.length > 0)).toBe(true)
  })
})

describe('normalizeIndustryEvent', () => {
  it('reads visual, severity and the good flag from an object', () => {
    const event = normalizeIndustryEvent({ title: 'Mưa', visual: 'rain', severity: 1, good: false }, 0)
    expect(event.visual).toBe('rain')
    expect(event.good).toBe(false)
  })

  it('still accepts a plain string from an older industry file', () => {
    const event = normalizeIndustryEvent('Mất điện chập chờn', 0)
    expect(event.visual).toBe('power_outage')
    expect(event.good).toBe(false)
  })

  it('maps description to the shown text and tone to the good flag', () => {
    const event = normalizeIndustryEvent(
      {
        id: 'chip-ban-dan-01',
        title: 'Cấm xuất máy quang khắc',
        description: 'Nước ngoài ban hành lệnh hạn chế xuất khẩu máy quang khắc.',
        icon: 'ban',
        tone: 'bad',
        visual: 'market_crash',
        severity: 3,
        effect: { revenuePct: -24, years: 3 },
      },
      0,
    )
    expect(event.id).toBe('chip-ban-dan-01')
    expect(event.title).toBe('Cấm xuất máy quang khắc')
    expect(event.body).toBe('Nước ngoài ban hành lệnh hạn chế xuất khẩu máy quang khắc.')
    expect(event.good).toBe(false)
    expect(event.visual).toBe('market_crash')
  })

  it('loads 20 described events for every industry', () => {
    const file = loadIndustriesFile()
    expect(file.industries).toHaveLength(64)
    const events = file.industries.flatMap((industry) => industry.events.map((raw, index) => normalizeIndustryEvent(raw, index)))
    expect(events).toHaveLength(1280)
    expect(events.every((event) => event.id && event.body.length > event.title.length)).toBe(true)
    expect(events.filter((event) => event.good)).not.toHaveLength(0)
    expect(events.filter((event) => !event.good)).not.toHaveLength(0)
  })
})

describe('eventCopy', () => {
  it('prefers a context narration, then a region narration', () => {
    const event = {
      id: 'nat-bao',
      industryId: null,
      scope: 'team' as const,
      weight: 1,
      visual: 'storm',
      effectCode: 'storm',
      severity: 3,
      good: false,
      title: 'Bão đổ bộ',
      body: 'Gió mạnh.',
      exposure: 'any' as const,
      durationSec: [1, 1] as [number, number],
      outputMul: [1, 1] as [number, number],
      priceMul: [1, 1] as [number, number],
      inflationMul: [1, 1] as [number, number],
      narrations: [
        { regionId: 'can-tho', contextId: '', title: 'Bão miền Tây', body: 'Mái {{factory}} tốc.' },
        { regionId: '', contextId: 'yeu', title: 'Bão nơi hạ tầng yếu', body: 'Đường vào {{factory}} ngập.' },
      ],
    } satisfies EventDef
    const theme = {
      industryId: 'lua',
      regionId: 'can-tho',
      contextId: 'yeu',
      vars: { factory: 'Nhà A' },
    } as unknown as ThemeDef
    expect(eventCopy(event, theme).title).toBe('Bão nơi hạ tầng yếu')
    expect(eventCopy(event, { ...theme, contextId: 'khac' }).title).toBe('Bão miền Tây')
    expect(eventCopy(event, { ...theme, contextId: 'khac' }).body).toBe('Mái Nhà A tốc.')
  })
})

describe('classifyEvent', () => {
  it('maps the new phrases onto the new codes', () => {
    expect(classifyEvent('Động đất rung chuyển mặt bằng').code).toBe('earthquake')
    expect(classifyEvent('Ổ dịch trong ca làm việc').code).toBe('epidemic')
    expect(classifyEvent('Tin tặc khóa hệ thống').code).toBe('cyber')
    expect(classifyEvent('Bê bối lãnh đạo lên mặt báo').code).toBe('scandal')
    expect(classifyEvent('Giá bán lao dốc').code).toBe('market_crash')
  })
})

describe('eventApplies', () => {
  it('keeps an event when the industry and context are tagged', () => {
    const row = { industryIds: ['chip-ban-dan', 'thep'], contextIds: ['vay'] }
    expect(eventApplies(row, 'chip-ban-dan', 'vay')).toBe(true)
    expect(eventApplies(row, 'sua', 'vay')).toBe(false)
    expect(eventApplies(row, 'chip-ban-dan', 'khoi')).toBe(false)
  })

  it('treats an empty context list as every context', () => {
    const row = { industryIds: ['lua'], contextIds: [] }
    expect(eventApplies(row, 'lua', 'bat-ky')).toBe(true)
  })
})
