/** Mulberry32 with a saved uint32 so a team's draws stay reproducible. */
export type Rng = {
  next: () => number
  int: (min: number, maxInclusive: number) => number
  pick: <T>(items: readonly T[]) => T
  range: (min: number, max: number) => number
  getState: () => number
  setState: (state: number) => void
}

export function makeRng(seed: number): Rng {
  let a = seed >>> 0 || 1
  const next = () => {
    a |= 0
    a = (a + 0x6d2b79f5) | 0
    let t = Math.imul(a ^ (a >>> 15), 1 | a)
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296
  }
  return {
    next,
    int(min, maxInclusive) {
      return min + Math.floor(next() * (maxInclusive - min + 1))
    },
    pick(items) {
      return items[Math.floor(next() * items.length)]!
    },
    range(min, max) {
      return min + next() * (max - min)
    },
    getState: () => a >>> 0,
    setState(state: number) {
      a = state >>> 0 || 1
    },
  }
}

export function hashString(value: string): number {
  let h = 2166136261
  for (let i = 0; i < value.length; i++) {
    h ^= value.charCodeAt(i)
    h = Math.imul(h, 16777619)
  }
  return h >>> 0
}

export function shuffle<T>(items: readonly T[], rng: Rng): T[] {
  const copy = items.slice()
  for (let i = copy.length - 1; i > 0; i--) {
    const j = Math.floor(rng.next() * (i + 1))
    const tmp = copy[i]!
    copy[i] = copy[j]!
    copy[j] = tmp
  }
  return copy
}
