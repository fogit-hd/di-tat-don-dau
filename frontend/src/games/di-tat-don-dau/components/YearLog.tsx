import { useState } from 'react'
import type { SceneView } from '../api/types.ts'

export function YearLog({ scene }: { scene: SceneView }) {
  const [open, setOpen] = useState(false)
  const line = situationLine(scene)
  return (
    <div className="log" id="log">
      <button type="button" className="situation" onClick={() => setOpen((value) => !value)}>
        {line}
      </button>
      {open && <p className="explain">{detailText(scene)}</p>}
    </div>
  )
}

function situationLine(scene: SceneView) {
  const first = scene.effects[0]
  if (!first) {
    if (scene.cycles <= 0) return 'Chọn một hướng, rồi sang năm.'
    return 'Năm yên. Nhà máy chạy bình thường.'
  }
  if (scene.log[0]?.startsWith('Cả lớp')) return `Cả lớp: ${first.title}`
  return first.title
}

function detailText(scene: SceneView) {
  const parts: string[] = []
  for (const effect of scene.effects) {
    parts.push(effect.body && effect.body !== effect.title ? `${effect.title}. ${effect.body}` : effect.title)
  }
  const economy = scene.log.find((line) => line.startsWith('Năm '))
  if (economy) parts.push(economy)
  for (const line of scene.log) {
    if ((line.startsWith('Sự kiện:') || line.startsWith('Cả lớp:')) && !parts.includes(line)) parts.push(line)
  }
  if (!parts.length) return 'Chưa có năm nào.'
  return parts.join('\n')
}
