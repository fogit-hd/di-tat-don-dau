import type { Rng } from './rng'

/** Rates are stored as fractions, but all rolled gameplay percentages use whole percentage points. */
export function wholeRate(value: number) {
  return Math.round(value * 100) / 100
}

export function rollWholeRate(value: number, rng: Rng) {
  const points = Math.max(0, Math.min(1, value)) * 100
  const low = Math.floor(points + 1e-9)
  return (low + (rng.next() < points - low ? 1 : 0)) / 100
}

export function rollWholeMultiplier(min: number, max: number, rng: Rng) {
  const low = Math.ceil(min * 100 - 1e-8)
  const high = Math.floor(max * 100 + 1e-8)
  return (high >= low ? low + Math.floor(rng.next() * (high - low + 1)) : Math.round((min + max) * 50)) / 100
}

export function percentText(rate: number) {
  return `${Math.round(rate * 100).toLocaleString('vi-VN')}%`
}
