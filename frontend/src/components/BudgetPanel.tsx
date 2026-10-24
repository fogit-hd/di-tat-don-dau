import type { SceneView } from '../api/types.ts'
import { useState } from 'react'
import { Icon } from './Icons.tsx'
import { investmentArt } from '../lib/art.ts'

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
        const info = upgradeInfo(scene, line.id)
        return (
          <button type="button" className="btn choice" key={line.id} disabled={!can} onClick={() => onInvest(line.id)}>
            <UpgradeArt key={`${scene.industryId}-${line.id}`} industry={scene.industryId} line={line.id} />
            <span className="choice-copy">
              <span className="choice-label">{line.label}</span>
              <span className="choice-benefit">{info.effect}</span>
              <small className="choice-current">{info.current}</small>
            </span>
            <span className="choice-price">Đầu tư <b>{Math.round(price).toLocaleString('vi-VN')} tỷ</b></span>
          </button>
        )
      })}
    </div>
  )
}

/** Explanations only: the server remains the authority for investment quantities. */
function upgradeInfo(scene: SceneView, line: SceneView['lines'][number]['id']) {
  const number = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  switch (line) {
    case 'eng': return { effect: 'Bổ sung kỹ sư để vận hành dây chuyền; giảm phụ thuộc công nghệ.', current: `Hiện có ${number(scene.engineers)} kỹ sư · ${number(scene.idle)} dây chuyền nhàn` }
    case 'mac': return { effect: 'Thêm dây chuyền sản xuất. Cần đủ kỹ sư để đưa máy vào vận hành.', current: `Hiện có ${number(scene.machines)} dây chuyền · ${number(scene.operating)} đang chạy` }
    case 'sup': return { effect: 'Nâng cấp công nghiệp phụ trợ, tăng hệ số sản lượng.', current: `Phụ trợ hiện tại: cấp ${number(scene.support)}` }
    case 'inf': return { effect: 'Nâng cấp hạ tầng, hỗ trợ sản xuất và xử lý ô nhiễm.', current: `Hạ tầng hiện tại: cấp ${number(scene.infra)}` }
    case 'grn': return { effect: 'Nâng công nghệ sạch, giảm ô nhiễm và bảo vệ giá bán.', current: `Công nghệ sạch cấp ${number(scene.green)} · Ô nhiễm ${number(scene.pollution)}` }
  }
}

/** All industries have their own art; failed requests fall back to a neutral icon. */
function UpgradeArt({ industry, line }: { industry: string; line: SceneView['lines'][number]['id'] }) {
  const [missing, setMissing] = useState(false)
  const source = investmentArt(industry, line)
  return <span className="upgrade-art">{!missing && source ? <img className="choice-art" src={source} alt="" onError={() => setMissing(true)} /> : <Icon name={{ eng: 'eng', mac: 'line', sup: 'sup', inf: 'inst', grn: 'leaf' }[line]} />}</span>
}
