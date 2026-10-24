import type { SceneView, Snapshot } from '../api/types.ts'
import { clock, vnd } from '../lib/format.ts'

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
  const income = scene.lastIncome
  return (
    <div className="top">
      <div className="top-main">
        <div>{scene.factoryName}</div>
        <div className={scene.cash < 0 ? 'debt' : ''}>
          {scene.cash < 0 ? 'Nợ' : 'Vốn'} <b>{vnd(scene.cash)}</b>
        </div>
        <div className="top-tools">
          {scene.finished ? <span className="top-ended">Đã chốt lượt chơi</span> : <span>⏱ {clock(remaining)}</span>}
          <span className={income >= 0 ? 'up' : 'down'}>
            {income >= 0 ? '+' : ''}
            Năm {scene.cycles} · {Math.round(income).toLocaleString('vi-VN')} tỷ/năm
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
