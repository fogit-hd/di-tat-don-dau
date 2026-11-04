import { readFileSync } from 'fs'
import { resolve } from 'path'
import { describe, expect, it } from 'vitest'
import { normalizeAnchors } from './anchors'

describe('normalizeAnchors', () => {
  it('keeps percent points and an empty smoke list', () => {
    const anchors = normalizeAnchors({
      file: 'assets/industries/da-giay/factory-1.webp',
      smoke: [],
      roof: [[10, 20]],
      door: [[30, 40]],
      windows: [[11, 22], [33, 44]],
      ground: 85,
      road: [1, 2, 3, 4],
      skyBottom: 12,
      notes: 'bỏ',
    })
    expect(anchors?.smoke).toEqual([])
    expect(anchors?.roof).toEqual([{ x: 10, y: 20 }])
    expect(anchors?.road).toEqual([1, 2, 3, 4])
    expect(anchors?.skyBottom).toBe(12)
  })

  it('treats a missing road as no vehicle path', () => {
    const anchors = normalizeAnchors({
      smoke: [[1, 2]],
      roof: [],
      door: [],
      windows: [],
      ground: 75,
      road: null,
      skyBottom: 3,
    })
    expect(anchors?.road).toBeNull()
    expect(anchors && anchors.skyBottom < 10).toBe(true)
  })

  it('returns null when the sky line is missing', () => {
    expect(normalizeAnchors({ ground: 70, smoke: [] })).toBeNull()
    expect(normalizeAnchors(null)).toBeNull()
  })

  it('reads one anchor map per industry, including a null road and the cable-hall ceiling', () => {
    const file = JSON.parse(readFileSync(resolve(process.cwd(), 'prisma/seed/anchors.json'), 'utf8')) as {
      images: Record<string, unknown>
    }
    const slugs = Object.keys(file.images)
    expect(slugs).toHaveLength(64)
    const maps = slugs.map((slug) => ({ slug, anchors: normalizeAnchors(file.images[slug]) }))
    expect(maps.every((row) => row.anchors)).toBe(true)
    for (const slug of ['gom-su', 'pin-luu-tru', 'thuc-pham-dong-hop', 'in-3d']) {
      expect(maps.find((row) => row.slug === slug)?.anchors?.road).toBeNull()
    }
    expect(maps.find((row) => row.slug === 'day-cap-dien')?.anchors?.skyBottom).toBe(15)
  })
})
