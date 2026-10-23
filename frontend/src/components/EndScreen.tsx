import { Link } from 'react-router-dom'
import type { Snapshot } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { vnd } from '../lib/format.ts'
import { Leaderboard } from './Leaderboard.tsx'

export function EndScreen({ snap }: { snap: Snapshot }) {
  const you = snap.you
  const ending = you?.scene ? snap.endings[you.scene.trajectory === 'build' ? 'lag' : you.scene.trajectory] : null
  const finalTitle = you ? snap.leaderboard.find((row) => row.teamId === you.id)?.endingTitle : null
  const finalKey = you ? snap.leaderboard.find((row) => row.teamId === you.id)?.ending : null
  const handed = you?.succession
  const text = handed?.outcomeDetail || (finalKey ? snap.endings[finalKey]?.text : ending?.text)
  const title = handed ? 'Đã chốt kết quả' : finalTitle || ending?.title || 'Hết giờ'
  return (
    <div className="modal on">
      <div className="card" id="mbody">
        {you?.theme && (
          <div className="endimg">
            <img
              src={factoryArt(you.theme.industryId)}
              alt=""
              style={finalKey && finalKey !== 'leap' ? { filter: 'grayscale(.75)' } : undefined}
            />
          </div>
        )}
        <h2>{title}</h2>
        <p>{text}</p>
        {you && (
          <p className="end-sum">
            <b>{you.teamName}</b> · Giá trị nhà máy <b>{vnd(snap.leaderboard.find((row) => row.teamId === you.id)?.value ?? 0)}</b>
            {handed ? ` · ${handed.year} năm` : ''} · Đúng {you.correct} câu · Hạng {you.rank}
          </p>
        )}
        <Leaderboard rows={snap.leaderboard} meId={you?.id} />
        <Link className="btn big" to="/">
          Về trang chủ
        </Link>
      </div>
    </div>
  )
}
