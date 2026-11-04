import type { SceneView, TraitView } from '../api/types.ts'

export function traitDetail(trait: TraitView) {
  if (trait.id === 'illness') return 'Bạo bệnh làm tăng rủi ro tử vong và chuyển giao quyền điều hành. Mức ảnh hưởng được bốc một lần cho CEO; Trường thọ được ưu tiên nếu có. Xem tỷ lệ cụ thể trong tab Rủi ro.'
  if (trait.id === 'longevity') return 'Trường thọ giữ rủi ro tử vong và chuyển giao quyền điều hành ở mức thấp, không tăng theo năm. Xem tỷ lệ cụ thể trong tab Rủi ro.'
  return trait.detail
}

export function traitIsBad(trait: TraitView) {
  return trait.good === false || ['illness', 'inheritance_dispute'].includes(trait.id)
}

export function specialStatuses(scene: SceneView): TraitView[] {
  const traits = scene.traits ?? []
  if (scene.secondLife !== 'available') return traits
  const source = scene.eventLog?.find(event => event.eventId.startsWith('second-life-'))
  return [...traits, {
    id: 'state-aid', label: 'Nhà nước chấp thuận hỗ trợ vốn', good: true, icon: 'heart',
    acquiredYear: source?.year, eventId: source?.eventId,
    detail: 'Nhà nước nhận thấy tiềm năng của công ty bạn, đồng ý cấp vốn cho bạn làm lại từ đầu. Chỉ giải ngân một lần khi công ty phá sản trong đợt chuyển giao quyền điều hành; không áp dụng khi tử vong.',
  }]
}
