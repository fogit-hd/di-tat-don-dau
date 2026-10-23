import type { SceneView } from '../api/types.ts'
import { vnd } from '../lib/format.ts'

export function BudgetPanel({
  scene,
  step,
  prices,
  busy,
  paused,
  onInvest,
}: {
  scene: SceneView
  step: number
  prices?: Partial<Record<'eng' | 'mac' | 'sup' | 'inf' | 'grn', number>>
  busy: boolean
  paused: boolean
  onInvest: (line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn') => void
}) {
  return (
    <div id="dirs" className="choices">
      {scene.lines.map((line) => {
        const price = prices?.[line.id] ?? step
        const can = !busy && !paused && scene.cash + 1 >= price
        return (
          <button type="button" className="btn choice" key={line.id} disabled={!can} onClick={() => onInvest(line.id)}>
            <span>{line.label}</span>
            <small>{Math.round(price).toLocaleString('vi-VN')} tỷ</small>
          </button>
        )
      })}
      <div className={`remain${scene.cash < 0 ? ' debt' : ''}`}>
        {scene.cash < 0 ? 'Nợ' : 'Còn'} <b>{vnd(scene.cash)}</b>
        {paused ? ' · đang tạm dừng' : ''}
      </div>
    </div>
  )
}
