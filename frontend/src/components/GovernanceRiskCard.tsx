import type { SceneView } from '../api/types.ts'

function percent(value: number) {
  return `${(Math.max(0, value) * 100).toLocaleString('vi-VN', { maximumFractionDigits: 3 })}%`
}

export function GovernanceRiskCard({ scene }: { scene: SceneView }) {
  const nextRisk = scene.deathChance ?? 0.01
  const followingRisk = scene.nextDeathChance ?? nextRisk
  const nextSuccession = scene.successionChance ?? 0.01
  const followingSuccession = scene.nextSuccessionChance ?? nextSuccession
  const deathChange = followingRisk - nextRisk
  const successionChange = followingSuccession - nextSuccession
  const restructuring = scene.secondLife === 'available'
    ? 'Đã được chấp thuận · chỉ giải ngân khi công ty phá sản trong đợt chuyển giao quyền điều hành.'
    : scene.secondLife === 'used'
      ? 'Đã sử dụng · khoản hỗ trợ vốn khởi động lại đã được cấp trong lượt này.'
      : 'Chưa được chấp thuận · chỉ có thể xuất hiện trước khi rủi ro tăng dần.'

  return (
    <section className="governance-risk" aria-label="Rủi ro chuyển giao quyền điều hành">
      <header>
        <span>Quản trị rủi ro</span>
        <b>Tử vong và chuyển giao quyền điều hành</b>
      </header>
      <div className="governance-metrics">
        <div>
          <span>Tử vong · kỳ chốt tới</span>
          <strong>{percent(nextRisk)}</strong>
          <small>{deathChange > 0 ? `Kỳ sau: ${percent(followingRisk)} (+${percent(deathChange)})` : `Kỳ sau: ${percent(followingRisk)}`}</small>
        </div>
        <div>
          <span>Kế nghiệp · kỳ chốt tới</span>
          <strong>{percent(nextSuccession)}</strong>
          <small>{successionChange > 0 ? `Kỳ sau: ${percent(followingSuccession)} (+${percent(successionChange)})` : `Kỳ sau: ${percent(followingSuccession)}`}</small>
        </div>
      </div>
      {scene.annualConditions && <dl className="finance-lines"><div><dt>Sự kiện kỳ tới</dt><dd>{percent(scene.annualConditions.eventChance)}</dd></div><div><dt>Sự kiện gia đình</dt><dd>{percent(scene.annualConditions.familyChance)}</dd></div><div><dt>Lãi nợ / năm</dt><dd>{percent(scene.annualConditions.interestRate)}</dd></div></dl>}
      <div className={`restructuring-status ${scene.secondLife}`}>
        <b>Chương trình hỗ trợ vốn khởi động lại</b>
        <span>{restructuring}</span>
        {scene.secondLife === 'locked' && (scene.restructuringChance ?? 0) > 0 && (
          <small>Cơ hội Nhà nước chấp thuận ở kỳ chốt năm tới: {percent(scene.restructuringChance ?? 0)}.</small>
        )}
      </div>
    </section>
  )
}
