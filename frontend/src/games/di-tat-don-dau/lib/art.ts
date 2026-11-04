export function factoryArt(slug: string) {
  return `/assets/industries/${slug}/factory-1.webp`
}

/** Versioned paths prevent stale photographic artwork from remaining in browser caches. */
export function investmentArt(industry: string, line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn') {
  return `/assets/investments/handdrawn-v1/${line === 'grn' ? 'common' : industry}/${line}.webp`
}
