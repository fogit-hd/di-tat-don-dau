export const LIGHTNING_MS = 180

/** The painted bolt starts beyond the viewport and terminates at the duck's feet. */
export function boltGeometry(x: number, y: number, height: number, scale: number) {
  const top = -height * .18
  const width = Math.max(140, Math.min(220, scale * 78))
  return { x: x - (243 - 104) / 288 * width, y: top, width, height: (y - top) * 296 / (395 - 120) }
}
