import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { FACTORY_NAME_MAX_LENGTH, introFactoryName, introRequestSchema } from './intro'

describe('factory intro names', () => {
  it('accepts the complete CNC factory name that exceeded the old 40-character limit', () => {
    const factoryName = 'Hồng Hà Chế tạo máy công cụ (máy tiện, máy phay CNC)'
    expect(factoryName.length).toBeGreaterThan(40)
    expect(introRequestSchema.parse({ factoryName }).factoryName).toBe(factoryName)
    expect(introFactoryName(factoryName, 'Tên gợi ý')).toBe(factoryName)
  })

  it('accepts every generated name combination from the 64-industry seed', () => {
    const source = JSON.parse(readFileSync(resolve(__dirname, '../../prisma/seed/industries.seed.json'), 'utf8')) as { industries: { name: string }[]; factoryNameParts: string[] }
    expect(source.industries).toHaveLength(64)
    for (const industry of source.industries) for (const part of source.factoryNameParts) {
      const name = `${part} ${industry.name}`
      expect(introRequestSchema.parse({ factoryName: name }).factoryName).toBe(name)
    }
  })

  it('trims whitespace, keeps the blank-name fallback and enforces a meaningful upper bound', () => {
    expect(introFactoryName('  ', 'Nhà máy dự kiến')).toBe('Nhà máy dự kiến')
    expect(introFactoryName('  Nhà máy mới  ', 'Tên cũ')).toBe('Nhà máy mới')
    const invalid = introRequestSchema.safeParse({ factoryName: 'a'.repeat(FACTORY_NAME_MAX_LENGTH + 1) })
    expect(invalid.success).toBe(false)
    if (!invalid.success) expect(invalid.error.issues[0]?.message).toContain('256')
    for (const factoryName of [null, 123, {}, undefined]) expect(introRequestSchema.safeParse({ factoryName }).success).toBe(false)
  })
})
