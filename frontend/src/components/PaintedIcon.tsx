import type { ReactNode } from 'react'

export type PaintedIconName = 'eng' | 'line' | 'prod' | 'tech' | 'sup' | 'inst' | 'environment' | 'investment' | 'family_fund' | 'heir_abroad' | 'heir_trained' | 'inheritance_dispute' | 'longevity' | 'illness' | 'life_insurance' | 'state-aid' | 'enterprise' | 'coins' | 'centennial' | 'history'

// Bounds keep complete generated silhouettes, including shapes that extend past the atlas grid.
const BOUNDS: Record<PaintedIconName, [number, number, number, number]> = {
  eng: [18, 30, 294, 319], line: [325, 48, 306, 280], prod: [649, 42, 294, 293], tech: [949, 40, 310, 290],
  sup: [14, 350, 303, 298], inst: [316, 349, 340, 297], environment: [654, 350, 294, 299], investment: [950, 350, 308, 298],
  family_fund: [14, 650, 302, 291], heir_abroad: [327, 652, 307, 294], heir_trained: [649, 649, 297, 296], inheritance_dispute: [949, 650, 309, 298],
  longevity: [20, 957, 296, 295], illness: [331, 957, 301, 292], life_insurance: [646, 943, 302, 309], 'state-aid': [948, 943, 310, 310],
  enterprise: [46, 66, 561, 520], coins: [700, 176, 498, 429], centennial: [38, 681, 581, 529], history: [685, 709, 550, 493],
}
const UTILITY = new Set<PaintedIconName>(['enterprise', 'coins', 'centennial', 'history'])

export function PaintedIcon({ name, className = '' }: { name: PaintedIconName; className?: string }) {
  return <svg className={`painted-icon ${className}`} viewBox={BOUNDS[name].join(' ')} aria-hidden="true" focusable="false" data-game-art="true">
    <image href={`/assets/ui/painted-icons-v1/${UTILITY.has(name) ? 'utility' : 'enterprise'}.webp`} x="0" y="0" width="1280" height="1280" />
  </svg>
}

export function TraitIcon({ id }: { id: string }) {
  return <PaintedIcon name={id in BOUNDS ? id as PaintedIconName : 'history'} />
}

export function DisclosureArrow({ open = false }: { open?: boolean }) {
  return <svg className={`disclosure-arrow${open ? ' open' : ''}`} viewBox="0 0 16 16" aria-hidden="true"><path d="m4 6 4 4 4-4" /></svg>
}

export function CanvasHeading({ children, icon = 'enterprise' }: { children: ReactNode; icon?: PaintedIconName }) {
  return <header className="canvas-heading"><PaintedIcon name={icon} /><h3>{children}</h3></header>
}
