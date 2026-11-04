import type { RacerView } from './contracts'
export function duckImage(p: Pick<RacerView, 'model' | 'color'>) { return `/assets/duck-race/portraits-v6/${p.model}/${p.model === 'ducky' ? 'yellow' : p.color}.webp` }
