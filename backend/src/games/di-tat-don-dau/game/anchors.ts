import type { AnchorPoint, Anchors } from './types'

function num(value: unknown): number | null {
  return typeof value === 'number' && Number.isFinite(value) ? value : null
}

function points(value: unknown): AnchorPoint[] {
  if (!Array.isArray(value)) return []
  const out: AnchorPoint[] = []
  for (const item of value) {
    if (!Array.isArray(item) || item.length < 2) continue
    const x = num(item[0])
    const y = num(item[1])
    if (x == null || y == null) continue
    out.push({ x, y })
  }
  return out
}

function road(value: unknown): Anchors['road'] {
  if (value == null) return null
  if (!Array.isArray(value) || value.length !== 4) return null
  const nums = value.map((item) => num(item))
  if (nums.some((item) => item == null)) return null
  return [nums[0]!, nums[1]!, nums[2]!, nums[3]!]
}

/** Percent anchors from the illustrator file. Null when the industry has no art map. */
export function normalizeAnchors(value: unknown): Anchors | null {
  if (!value || typeof value !== 'object' || Array.isArray(value)) return null
  const row = value as Record<string, unknown>
  const ground = num(row.ground)
  const skyBottom = num(row.skyBottom)
  if (ground == null || skyBottom == null) return null
  return {
    smoke: points(row.smoke),
    roof: points(row.roof),
    door: points(row.door),
    windows: points(row.windows),
    ground,
    road: road(row.road),
    skyBottom,
  }
}
