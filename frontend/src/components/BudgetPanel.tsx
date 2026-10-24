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
    const canRevive = scene.secondLife === 'available' && scene.stateAidEligible
    return (
      <section className="bankrupt-restart" aria-live="polite">
        <h3>Đã hết vốn vận hành</h3>
        <p>
          {canRevive
            ? 'Nhà nước nhận thấy tiềm năng của công ty bạn, đồng ý cấp vốn cho bạn làm lại từ đầu.'
            : scene.secondLife === 'available'
              ? 'Khoản hỗ trợ vốn đã được chấp thuận, nhưng chỉ giải ngân nếu công ty phá sản trong đợt chuyển giao quyền điều hành.'
            : scene.secondLife === 'used'
              ? 'Công ty đã sử dụng khoản hỗ trợ vốn khởi động lại trong lượt chơi này.'
              : 'Công ty chưa nhận được quyết định hỗ trợ vốn từ Nhà nước.'}
        </p>
        {canRevive && (
          <button type="button" className="btn" disabled={busy || paused} onClick={onRestart}>
            Nhận vốn hỗ trợ để làm lại
          </button>
        )}
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
            <img className="choice-art" src={`/assets/investments/${line.id}.png`} alt="" />
            <span className="choice-copy">
              <span className="choice-label">{line.label}</span>
              <small className="choice-price">Đầu tư {Math.round(price).toLocaleString('vi-VN')} tỷ</small>
            </span>
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
