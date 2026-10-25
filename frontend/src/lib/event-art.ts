import index from './static-event-art-index.json'

const art: Record<string, string> = index.art
const ids = new Set<string>(Object.keys(art))
const contexts = new Set<string>(index.contexts)
const root = '/assets/ui/static-events-v3/'
const contextTitles: Record<string,string> = {'input-shortage':'Nguồn đầu vào bị siết','local-supplier':'Nhà cung cấp trong nước vào chuỗi','port-delay':'Cảng và kho bãi ùn tắc','green-support':'Gói mua sắm xanh được duyệt','credit-tightening':'Tín dụng thiết bị bị siết','tech-transfer':'Chuyển giao thiết bị theo lô','new-standard':'Tiêu chuẩn đầu vào mới'}
export type EventArtwork = { id: string; base: string }
const resolve = (id: string): EventArtwork => ({ id, base: `${root}${art[id]}` })

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
    return ids.has(id) ? resolve(id) : undefined
  }
  if (!ids.has(original)) return undefined
  const narration = index.narrations.find(row => row.parent === original && row.title === title)
  const resolved = narration && ids.has(narration.id) ? narration.id : original
  // Some summaries show just the context, rather than the compound incident's name.
  // Give that standalone subject its own complete painting, never an overlay.
  if(context && contextTitles[context] === title) return {id:resolved,base:`${root}context-${context}`}
  // Context remains in the event's real text; never paste a second symbol over the painting.
  return resolve(resolved)
}

/** Unknown/admin records still use a complete painting; arbitrary copy never becomes a URL. */
export function fallbackEventArt(kind: string, title = ''): string {
  const label = title.toLowerCase()
  const named = /bạo bệnh|bệnh nặng/.test(label) ? 'illness'
    : /trường thọ/.test(label) ? 'longevity'
    : /nghỉ hưu/.test(label) ? 'retirement'
    : /quỹ gia tộc/.test(label) ? 'family-fund'
    : /du học/.test(label) ? 'returning-graduate'
    : /bảo hiểm/.test(label) ? 'life-insurance'
    : /mua sắm xanh/.test(label) ? 'context-green-support'
    : /hỗ trợ vốn|khởi động lại/.test(label) ? 'state-support' : undefined
  const fallback: Record<string,string> = {alert:'safety',bolt:'power-failure',box:'material-shortage',bug:'pest',chart:'market-recovery',chip:'wafer-defect',clock:'retirement',coinsDown:'price-decline',coinsUp:'market-recovery',factory:'warehouse',fire:'fire',flask:'research',gavel:'inheritance-dispute',globe:'export-order',heart:'illness',home:'warehouse',leaf:'seedling',lock:'cyberattack',megaphone:'strike',people:'training',plane:'air-freight',rain:'rain',school:'training',shield:'life-insurance',ship:'port-congestion',snow:'snow',spark:'patent',storm:'storm',sun:'sun',truck:'supplier-truck',water:'flood',wheat:'wheat',wrench:'cnc-breakdown'}
  return `${root}${named ?? fallback[kind] ?? 'new-standard'}`
}
