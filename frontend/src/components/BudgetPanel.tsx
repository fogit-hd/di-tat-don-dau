import type { SceneView } from '../api/types.ts'
import { vnd } from '../lib/format.ts'

export function BudgetPanel({
  scene,
  step,
  busy,
  paused,
  onInvest,
}: {
  scene: SceneView
  step: number
  busy: boolean
  paused: boolean
  onInvest: (line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn') => void
}) {
  const can = !busy && !paused && scene.cash + 1 >= step
  return (
    <div id="dirs" className="choices">
      {scene.lines.map((line) => (
        <button type="button" className="btn choice" key={line.id} disabled={!can} onClick={() => onInvest(line.id)}>
          {line.label}
        </button>
      ))}
      <div className="remain">
        Còn <b>{vnd(scene.cash)}</b>
        {paused ? ' · đang tạm dừng' : ` · mỗi nút ${Math.round(step).toLocaleString('vi-VN')} tỷ`}
      </div>
    </div>
  )
}
