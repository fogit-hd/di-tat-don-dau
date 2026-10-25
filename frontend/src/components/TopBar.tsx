import type { SceneView, Snapshot } from '../api/types.ts'
import { clock, money, vnd } from '../lib/format.ts'
import { AnimatedValue } from './AnimatedValue.tsx'
import { EventIcon } from './EventIcon.tsx'

export function TopBar({
  snap,
  scene,
  now,
  rank,
  muted,
  onMute,
}: {
  snap: Snapshot
  scene: SceneView
  now: number
  rank: number
  muted: boolean
  onMute: () => void
}) {
  const remaining = snap.paused ? (snap.room.remainingMs ?? 0) : (snap.room.endsAt ?? now) - now
  const income = scene.lastProduction?.net ?? scene.lastIncome
  return (
    <div className="top">
      <div className="top-main">
        <details className="company-name">
          <summary title={`${snap.you?.teamName ?? ''} · ${scene.factoryName}`}><span className="company-crest"><EventIcon animated={false} name={scene.industryId === 'trai-cay-say' ? 'leaf' : scene.industryId === 'chip-ban-dan' ? 'chip' : scene.industryId === 'duoc-pham' ? 'flask' : 'factory'} /></span><span className="company-title">{scene.factoryName}</span></summary>
          <div className="company-full"><b>{snap.you?.teamName}</b><span>{scene.factoryName}</span></div>
        </details>
        <div className={`hud-value${scene.cash < 0 ? ' debt' : ''}`}>
          <small>{scene.cash < 0 ? 'Nợ' : 'Tiền mặt'}</small><b><AnimatedValue value={scene.cash} format={vnd} /></b>
        </div>
        <div className="hud-value"><small>Tài sản</small><b><AnimatedValue value={scene.value} format={vnd} /></b></div>
        <div className="top-tools">
          <span className="hud-year">Năm {scene.cycles}</span>
          {scene.finished ? <span className="top-ended">Đã chốt lượt chơi</span> : <span className="hud-clock">⏱ {clock(remaining)}</span>}
          <span className={income >= 0 ? 'up' : 'down'} title={scene.lastProduction ? 'Lãi/lỗ sản xuất năm vừa chốt, trước lạm phát và lãi nợ; không phải tổng biến động tiền mặt.' : 'Thu vận hành đã ghi: sản xuất sau lạm phát và khoản kéo dài; không phải tổng biến động tiền mặt.'}>
            <small>{scene.lastProduction ? 'Lãi SX' : 'Thu vận hành'}</small> {income >= 0 ? '+' : ''}{money(income)}/năm
          </span>
          <span className="rank">Hạng {rank}</span>
          <button type="button" className="btn s" onClick={onMute} aria-label={muted ? 'Bật tiếng' : 'Tắt tiếng'}>
            {muted ? '🔇' : '🔊'}
          </button>
        </div>
      </div>
    </div>
  )
}
