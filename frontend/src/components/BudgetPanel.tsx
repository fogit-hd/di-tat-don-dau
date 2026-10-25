import type { InvestmentPreview, SceneView } from '../api/types.ts'
import { useRef, useState } from 'react'
import { Icon } from './Icons.tsx'
import { investmentArt } from '../lib/art.ts'
import { money } from '../lib/format.ts'
import { CanvasHeading, PaintedIcon } from './PaintedIcon.tsx'

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
  onInvest: (line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn', quantity: 1 | 5 | 10 | 'max') => Promise<boolean>
  onRestart: () => void
}) {
  const [quantity, setQuantity] = useState<1 | 5 | 10 | 'max'>(1)
  const purchaseSequence = useRef(0)
  const [feedback, setFeedback] = useState<{line:string; phase:'sending'|'confirmed'|'failed'; version:number; gain:string} | null>(null)
  async function purchase(line: SceneView['lines'][number]['id'], gain: string) {
    const version = ++purchaseSequence.current
    setFeedback({line,phase:'sending',version,gain})
    const ok = await onInvest(line,quantity)
    if (version === purchaseSequence.current) setFeedback({line,phase:ok?'confirmed':'failed',version,gain})
  }
  const bankrupt = scene.bankrupt ?? (scene.stateAidEligible && scene.succession?.outcome === 'bankrupt')
  if (bankrupt) {
    const canRevive = scene.secondLife === 'available' && scene.stateAidEligible
    return (
      <section className="bankrupt-restart" aria-live="polite">
        <h3>Công ty đã phá sản</h3>
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
    <>
    <div className="investment-toolbar"><CanvasHeading icon="investment">Đầu tư</CanvasHeading>
    <div className="investment-quantity" role="group" aria-label="Số gói đầu tư">
      {([1, 5, 10, 'max'] as const).map(value => <button key={value} type="button" aria-pressed={quantity === value} disabled={busy || paused} onClick={() => setQuantity(value)}>{value === 'max' ? 'Tối đa' : `×${value}`}</button>)}
    </div></div>
    <p className="canvas-caption">Chọn số gói để xem trước kết quả nhận được.</p>
    {scene.cash <= 0 && <p className="investment-warning">{scene.cash < 0 ? 'Công ty đang có dư nợ; lãi nợ được tính mỗi năm.' : 'Tiền mặt đã hết.'} Bạn vẫn có thể Sang năm để sản xuất; hết tiền mặt chưa phải phá sản.</p>}
    {quantity === 'max' && <p className="investment-help">Mua tối đa số gói đủ tiền, có thể không còn vốn vận hành.</p>}
    <div id="dirs" className="choices">
      {scene.lines.map((line) => {
        const price = prices?.[line.id] ?? step
        const count = quantity === 'max' ? Math.max(0, Math.floor(scene.cash / price)) : quantity
        const preview = scene.investmentPreviews?.[line.id]?.[quantity]
        const total = preview?.total ?? price * count
        const can = !busy && !paused && count > 0 && scene.cash + 1e-6 >= total
        const info = upgradeInfo(scene, line.id)
        const benefit = preview ? previewInfo(scene, line.id, preview) : null
        return (
          <article className={`btn choice investment-card${feedback?.line === line.id ? ` purchase-${feedback.phase}` : ''}`} key={line.id}>
            <UpgradeArt key={`${scene.industryId}-${line.id}`} industry={scene.industryId} line={line.id} />
            <div className="choice-copy">
              <h4 className="choice-label">{line.label}</h4>
              <span className="choice-benefit">{upgradeBrief(line.id)}</span>
              {benefit?.warning && <small className="investment-warning">{benefit.warning}</small>}
            </div>
            <div className="choice-result">
              {benefit ? <><strong>{benefit.gain}</strong><small>{benefit.change}</small></> : <small>{info.current}</small>}
              <small>Hiệu quả năm nay: {Math.round((scene.upgradeEfficiency?.[line.id] ?? 1) * 100)}%</small>
            </div>
            <button type="button" className="choice-price investment-buy" disabled={!can} aria-label={`${line.label}, ${count} gói, ${money(total)}`} onClick={() => void purchase(line.id,benefit?.gain || line.label)}>
              {feedback?.line === line.id && feedback.phase === 'sending' ? 'Đang gửi…' : `Đầu tư ×${count}`}<b>{money(total)}</b>
            </button>
            {feedback?.line === line.id && <span key={feedback.version+feedback.phase} className={`purchase-feedback ${feedback.phase}`} role="status">{feedback.phase==='sending'?'Chờ máy chủ xác nhận':feedback.phase==='confirmed'?'Đã nâng cấp · Máy chủ đã xác nhận':'Chưa nâng cấp · xem lỗi ở trên'}</span>}
            {preview && <details className="investment-projection"><summary>Xem tác động khi Sang năm</summary>
              <p>{benefit?.detail}</p>
              <p>Lãi/lỗ sản xuất ước tính: {money(scene.operatingForecast?.net ?? 0)} → {money(preview.net)}/năm (chưa trừ lạm phát, lãi nợ).</p>
            </details>}
          </article>
        )
      })}
    </div>
    <p className="investment-footnote"><PaintedIcon name="history" /> Chỉ số tăng ngay khi mua · Sản xuất khi Sang năm. Ước tính giữ nguyên các hiệu ứng đã biết; chưa tính sự kiện mới và dao động sản xuất.</p>
    <PollutionDetails scene={scene} />
    </>
  )
}

/** Explanations only: the server remains the authority for investment quantities. */
function upgradeBrief(line: SceneView['lines'][number]['id']) {
  return { eng: 'Bổ sung kỹ sư vận hành', mac: 'Tăng năng lực sản xuất', sup: 'Giảm chi phí đầu vào · chống thiếu nguồn cung', inf: 'Giảm phí logistics · tăng tỷ lệ hàng bán được', grn: 'Giảm ô nhiễm · bảo vệ giá bán' }[line]
}

function upgradeInfo(scene: SceneView, line: SceneView['lines'][number]['id']) {
  const number = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  switch (line) {
    case 'eng': return { effect: 'Bổ sung kỹ sư để vận hành dây chuyền; giảm phụ thuộc công nghệ.', current: `Hiện có ${number(scene.engineers)} kỹ sư · ${number(scene.idle)} dây chuyền nhàn` }
    case 'mac': return { effect: 'Thêm dây chuyền sản xuất. Cần đủ kỹ sư để đưa máy vào vận hành.', current: `Hiện có ${number(scene.machines)} dây chuyền · ${number(scene.operating)} đang chạy` }
    case 'sup': return { effect: 'Giảm chi phí nguyên liệu và mức bất lợi khi nguồn cung bị siết.', current: `Phụ trợ hiện tại: cấp ${number(scene.support)}` }
    case 'inf': return { effect: 'Giảm phí vận chuyển, kho bãi và tăng tỷ lệ hàng bán được.', current: `Hạ tầng hiện tại: cấp ${number(scene.infra)}` }
    case 'grn': return { effect: 'Nâng công nghệ sạch, giảm ô nhiễm và bảo vệ giá bán.', current: `Công nghệ sạch cấp ${number(scene.green)} · Ô nhiễm ${number(scene.pollution)}` }
  }
}

const number = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 2 })
const percent = (n: number) => `${(n * 100).toLocaleString('vi-VN', { maximumFractionDigits: 1 })}%`
function previewInfo(scene: SceneView, line: SceneView['lines'][number]['id'], p: InvestmentPreview) {
  const base = scene.operatingForecast
  switch (line) {
    case 'eng': return { gain: `+${number(p.gain)} kỹ sư`, change: `${number(scene.engineers)} → ${number(p.levelAfter)} người`,
      warning: scene.idle < .01 ? 'Hiện đủ người chạy máy; tuyển thêm chủ yếu chuẩn bị cho máy mới.' : undefined,
      detail: `Máy chạy ${number(base?.operating ?? scene.operating)} → ${number(p.operating)}. Sau mua còn thiếu ${number(p.staffMissing)} kỹ sư để chạy hết máy; nhân lực còn giúp tích lũy công nghệ và giảm phụ thuộc.` }
    case 'mac': return { gain: `+${number(p.gain)} dây chuyền`, change: `${number(scene.machines)} → ${number(p.levelAfter)} dây chuyền`,
      warning: p.staffMissing > 0 ? `Còn thiếu ${number(p.staffMissing)} kỹ sư; ${number(p.idle)} máy nhàn.` : 'Đủ nhân lực vận hành toàn bộ máy.',
      detail: `Máy thực chạy ${number(base?.operating ?? scene.operating)} → ${number(p.operating)}. Chi phí máy nhàn: ${money(p.idleCost)}/năm. Thêm máy không bảo đảm tăng lãi nếu thiếu người.` }
    case 'sup': return { gain: `Giảm ${percent(p.inputDiscount)} phí đầu vào`, change: `${percent(base?.inputDiscount ?? 0)} → ${percent(p.inputDiscount)}`, warning: undefined,
      detail: `Phụ trợ cấp ${number(scene.support)} → ${number(p.levelAfter)}. Chỉ giảm phần chi phí nguyên liệu, không giảm toàn bộ chi phí. Giảm ${percent(p.disruptionProtection)} mức bất lợi của sự kiện thiếu nguồn cung mới (tối đa 50%); không xóa hiệu ứng cũ.` }
    case 'inf': return { gain: `Bán được ${percent(p.delivery)} sản lượng`, change: `${percent(base?.delivery ?? .9)} → ${percent(p.delivery)}`, warning: undefined,
      detail: `Hạ tầng cấp ${number(scene.infra)} → ${number(p.levelAfter)}. Giảm phí logistics ${percent(base?.logisticsDiscount ?? 0)} → ${percent(p.logisticsDiscount)}. Hàng chưa bán không tạo doanh thu; không có tồn kho tích lũy trong mô hình này. Hạ tầng không thay công nghệ sạch.` }
    case 'grn': return { gain: scene.pollution > p.pollutionNowAfter ? `−${number(scene.pollution - p.pollutionNowAfter)} ô nhiễm ngay` : `+${number(p.treatment - (base?.treatment ?? 0))} điểm xử lý/năm`, change: `${number(scene.pollution)} → ${number(p.pollutionNowAfter)}/100`,
      warning: p.pricePenalty > 0 ? `Kỳ tới giá bán còn giảm ${percent(p.pricePenalty)} do ô nhiễm.` : 'Kỳ tới chưa bị giảm giá bán vì ô nhiễm.',
      detail: `Công nghệ sạch cấp ${number(scene.green)} → ${number(p.levelAfter)}. Xử lý ${number(p.treatment)} điểm/năm. Ô nhiễm dự kiến kỳ tới: ${number(base?.pollution ?? scene.pollution)} → ${number(p.pollution)}; phạt giá bán ${percent(base?.pricePenalty ?? 0)} → ${percent(p.pricePenalty)}.` }
  }
}

export function PollutionDetails({ scene }: { scene: SceneView }) {
  const p = scene.operatingForecast
  if (!p) return null
  return <details className="pollution-explainer"><summary>Ô nhiễm {number(scene.pollution)}/100 · {scene.pollution <= 30 ? 'Thấp' : scene.pollution <= 60 ? 'Cần xử lý' : 'Cao'}</summary>
    <p>Đây là điểm ô nhiễm từ 0 đến 100, không phải cấp nâng cấp hay phần trăm. Điểm trên 30 làm giảm giá bán; tối đa giảm 35% ở mức 100. Sản lượng không bị trừ thêm lần nữa.</p>
    <p>Kỳ tới: {number(p.retainedPollution)} ô nhiễm giữ lại + {number(p.emissions)} phát sinh − {number(p.treatment)} xử lý = {number(p.pollution)}/100 (giới hạn 0–100). Giá bán giảm {percent(p.pricePenalty)}.</p>
    <p>Ô nhiễm hiện tại làm giảm {money(p.currentValuePenalty)} giá trị công ty, kể cả khi chưa chạm ngưỡng giảm giá bán. Công nghệ sạch vừa giảm điểm ngay, vừa tăng xử lý mỗi năm.</p>
  </details>
}

/** All industries have their own art; failed requests fall back to a neutral icon. */
function UpgradeArt({ industry, line }: { industry: string; line: SceneView['lines'][number]['id'] }) {
  const [missing, setMissing] = useState(false)
  const source = investmentArt(industry, line)
  return <span className="upgrade-art">{!missing && source ? <img className="choice-art" src={source} alt="" onError={() => setMissing(true)} /> : <Icon name={{ eng: 'eng', mac: 'line', sup: 'sup', inf: 'inst', grn: 'leaf' }[line]} />}</span>
}
