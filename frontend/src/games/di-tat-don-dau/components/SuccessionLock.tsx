import type { Snapshot } from '../api/types.ts'
import { vnd } from '../lib/format.ts'
import { Leaderboard } from './Leaderboard.tsx'

export function SuccessionLock({ snap }: { snap: Snapshot }) {
  const you = snap.you
  const result = you?.succession
  const years = result?.year ?? you?.scene?.cycles ?? 0
  const assets = result?.assetsAfter ?? snap.leaderboard.find((row) => row.teamId === you?.id)?.value ?? 0
  return (
    <section className="card succession-lock">
      <h2>Đã chốt kết quả</h2>
      {result && <p>{result.causeText}</p>}
      {result && (
        <p>
          <b>{result.outcomeLabel}.</b> {result.outcomeDetail}
        </p>
      )}
      <p className="end-sum">
        Tài sản <b>{vnd(assets)}</b> · {years} năm
      </p>
      <Leaderboard rows={snap.leaderboard} meId={you?.id} />
    </section>
  )
}
