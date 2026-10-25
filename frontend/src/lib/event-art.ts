import index from './event-art-index.json'

const ids = new Set<string>(index.ids)
const contexts = new Set<string>(index.contexts)
const root = '/assets/ui/event-scenes-v2/'
export type EventArtwork = { id: string; base: string; context?: string }

/** Only allow audited catalog IDs in local URLs; labels/percent rolls never become filenames. */
export function eventArtwork(eventId?: string, title = '', detail = ''): EventArtwork | undefined {
  if (!eventId) return undefined
  let id = eventId
  if (/^second-life-used-\d+$/.test(id)) id = 'system-support-used'
  else if (/^second-life-\d+$/.test(id)) id = 'system-support-approved'
  else if (/^mortality-\d+$/.test(id)) id = 'system-mortality'
  else if (/^centennial-\d+$/.test(id)) id = 'system-centennial'
  else if (/^succession-\d+$/.test(id)) {
    const copy = `${title} ${detail}`
    const gain = /tăng thêm\s+(\d[\d.,]*)%/.exec(copy)
    id = /mất 100%|còn lại bằng 0|phá sản/.test(copy) ? 'system-succession-bankrupt'
      : /giữ nguyên/.test(copy) ? 'system-succession-steady'
      : /làm mất/.test(copy) ? 'system-succession-loss'
      : gain ? (Number(gain[1].replaceAll('.', '').replace(',', '.')) >= 100 ? 'system-succession-multiply' : 'system-succession-growth')
      : 'system-succession-steady'
  }
  const [original, context, ...extra] = id.split('--')
  if (extra.length || (context && !contexts.has(context))) {
    // A narration can itself be a literal, catalogued ID; no arbitrary suffix is accepted.
    return ids.has(id) ? { id, base: `${root}${id}` } : undefined
  }
  if (!ids.has(original)) return undefined
  const narration = index.narrations.find(row => row.parent === original && row.title === title)
  const resolved = narration && ids.has(narration.id) ? narration.id : original
  return { id: resolved, base: `${root}${resolved}`, context: context ? `${root}context-${context}` : undefined }
}
