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
      <p>
        Sau năm {scene.successionRiskStartsAt ?? 1}, tử vong tăng 0,2 điểm %/năm, kế nghiệp tăng 0,25 điểm %/năm, đến giới hạn thông thường 2% và 4%. Bạo bệnh có thể vượt giới hạn này. Tử vong luôn thấp hơn kế nghiệp; Trường thọ giữ mức rủi ro thấp.
      </p>
      {scene.annualConditions && <p>Điều kiện kỳ chốt tới: cơ hội bốc sự kiện đầu tiên {percent(scene.annualConditions.eventChance)} · sự kiện gia đình {percent(scene.annualConditions.familyChance)} · lãi nợ {percent(scene.annualConditions.interestRate)}/năm.</p>}
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
