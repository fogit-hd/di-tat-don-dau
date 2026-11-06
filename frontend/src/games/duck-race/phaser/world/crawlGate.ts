import type { HazardView } from '../../contracts'
import { ROAD_Y, WORLD, STEP_PX } from '../../track'
import { CRAWL_GATE_LAYOUT } from '../../motor'

/** Registration measured on the approved transparent painting. Never rotate it diagonally. */
export const CRAWL_ART = { width: 452, height: 1080, axisX: 228, farFootY: 155, nearFootY: 1030,
  referenceSpan: CRAWL_GATE_LAYOUT.spanY, footDepth: 18 } as const
// The approved source already contains its near/far perspective. Draw it whole at ONE
// uniform scale; cutting and stretching the middle changes that original silhouette.
export const CRAWL_SCALE = (CRAWL_ART.referenceSpan - CRAWL_ART.footDepth) / (CRAWL_ART.nearFootY - CRAWL_ART.farFootY)
export function crawlGateRegistration(h: HazardView) {
  const span = h.spanY ?? CRAWL_ART.referenceSpan
  const scale = (span - CRAWL_ART.footDepth) / (CRAWL_ART.nearFootY - CRAWL_ART.farFootY)
  if (scale <= 0) throw new RangeError('Crawl gate is shorter than its supports')
  const y = h.worldY! - span / 2 + CRAWL_ART.footDepth / 2
  const topY = y - CRAWL_ART.farFootY * scale
  return { x: h.worldX!, y, topY,
    scale, depth: h.worldY! + span / 2, thickness: 430 * scale }
}

/** Isolated approval fixture: ONLY the one selected mandatory-crawl model, at fixed world X.
 * Both ends meet the road banks. No short variant or visual invitation to bypass this gate.
 * End size, height, width and camera angle stay identical.
 * No water/mud, unapproved obstacle paintings, live room writes, or auto-forward motion. */
export function approvedCrawlCourse(seed = 4519): HazardView[] {
  const hazards: HazardView[] = []
  const random = () => { seed = (Math.imul(seed, 1664525) + 1013904223) >>> 0; return seed / 4294967296 }
  for (let x = 640; x < WORLD - 600; x += 320 + random() * 180) {
    const { spanY, worldY } = CRAWL_GATE_LAYOUT
    const h: HazardView = { id: `approved-crawl-${hazards.length}`, kind: 'underpass', category: 'obstacle',
      worldX: x, worldY, spanY, position: x / STEP_PX, offset: worldY - ROAD_Y,
      thicknessX: 1, heightZ: 1000, expiresAt: 8640000000000000 }
    h.thicknessX = crawlGateRegistration(h).thickness
    hazards.push(h)
  }
  return hazards
}
