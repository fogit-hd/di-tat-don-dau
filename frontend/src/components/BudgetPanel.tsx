import type { SceneView } from '../api/types.ts'
import { vnd } from '../lib/format.ts'

export function BudgetPanel({
  scene,
  step,
  prices,
  busy,
  paused,
  onInvest,
  onRestart,
}: {
  scene: SceneView
  step: number
  prices?: Partial<Record<'eng' | 'mac' | 'sup' | 'inf' | 'grn', number>>
  busy: boolean
  paused: boolean
  onInvest: (line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn') => void
  onRestart: () => void
}) {
  const bankrupt = scene.cash <= 0
  if (bankrupt) {
    return (
      <section className="bankrupt-restart" aria-live="polite">
        <h3>Đã hết vốn vận hành</h3>
        <p>Nhà máy không thể đầu tư thêm. Bạn có thể khởi động lại từ vốn ban đầu để tiếp tục gỡ vốn trong thời gian còn lại.</p>
        <button type="button" className="btn" disabled={busy || paused} onClick={onRestart}>
          Làm lại từ đầu
        </button>
      </section>
    )
  }
  return (
    <div id="dirs" className="choices">
      {scene.lines.map((line) => {
        const price = prices?.[line.id] ?? step
        const can = !busy && !paused && scene.cash + 1 >= price
        return (
          <button type="button" className="btn choice" key={line.id} disabled={!can} onClick={() => onInvest(line.id)}>
            <span className="choice-label">{line.label}</span>
            <small className="choice-price">Đầu tư {Math.round(price).toLocaleString('vi-VN')} tỷ</small>
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
