import type { InvestmentPreview, SceneView } from '../api/types.ts'
import { useRef, useState } from 'react'
import { Icon } from './Icons.tsx'
import { investmentArt } from '../lib/art.ts'
import { count as wholeCount } from '../lib/production-format.ts'
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
  onUpgrade,
  tutorialAction,
}: {
  scene: SceneView
  step: number
  prices?: Partial<Record<'eng' | 'mac' | 'sup' | 'inf' | 'grn', number>>
  busy: boolean
  paused: boolean
  onInvest: (line: 'eng' | 'mac' | 'sup' | 'inf' | 'grn', quantity: 1 | 5 | 10 | 'max' | 'crew') => Promise<boolean>
  onUpgrade?: (kind: 'training'|'modernization'|'maintenance')=>Promise<boolean>
  onRestart: () => void
  tutorialAction?: string
}) {
  const modern=scene.economyVersion===3
  const crew=scene.crewRequired??scene.productionForecast?.expected.engineersPerMachine??1
  const [quantity, setQuantity] = useState<1 | 5 | 10 | 'max'>(1)
  const purchaseSequence = useRef(0)
  const [feedback, setFeedback] = useState<{line:string; phase:'sending'|'confirmed'|'failed'; version:number; gain:string} | null>(null)
  async function purchase(line: SceneView['lines'][number]['id'], gain: string, selected: 1|5|10|'max'|'crew' = quantity) {
    const version = ++purchaseSequence.current
    setFeedback({line,phase:'sending',version,gain})
    const ok = await onInvest(line,selected)
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
      {([1, 5, 10, 'max'] as const).map(value => <button key={value} type="button" aria-pressed={quantity === value} disabled={busy || paused || Boolean(tutorialAction)} onClick={() => setQuantity(value)}>{value === 'max' ? 'Tối đa' : `×${value}`}</button>)}
    </div></div>
    {!modern && <p className="canvas-caption">Chọn số gói để xem trước kết quả nhận được.</p>}
    {modern && scene.operating===0 && <div className="investment-start-guide"><b>{scene.machines===0?'Chưa có cụm hoạt động':`Còn thiếu ${Math.max(0,crew-scene.engineers)} công nhân cho tổ đầu tiên`}</b><div className="starter-actions">
      <button type="button" data-guide="starter-cluster" disabled={busy||paused||Boolean(tutorialAction&&tutorialAction!=='cluster')||scene.machines>0||!scene.investmentPreviews?.mac?.[1]||scene.cash<scene.investmentPreviews.mac[1].total} onClick={()=>void purchase('mac','Mở cụm đầu tiên',1)}>{scene.machines>0?'Đã có cụm đầu tiên':`Mở 1 cụm · ${money(scene.investmentPreviews?.mac?.[1]?.total??0)}`}</button>
      <button type="button" data-guide="starter-crew" disabled={busy||paused||Boolean(tutorialAction&&tutorialAction!=='crew')||scene.engineers>=crew||!scene.investmentPreviews?.eng?.crew||scene.cash<scene.investmentPreviews.eng.crew.total} onClick={()=>void purchase('eng','Tổ công nhân đã sẵn sàng','crew')}>{scene.engineers>=crew?'Đã đủ tổ công nhân':`Tuyển ${scene.investmentPreviews?.eng?.crew?.count??crew} người · ${money(scene.investmentPreviews?.eng?.crew?.total??0)}`}</button>
    </div></div>}
    {modern && <p className="investment-help">Đang vận hành: {scene.operating} cụm · Chờ đủ nhân lực: {scene.idle} cụm.</p>}
    {scene.cash <= 0 && <p className="investment-warning">{scene.cash < 0 ? 'Công ty đang có dư nợ; lãi nợ được tính mỗi năm.' : 'Tiền mặt đã hết.'} Bạn vẫn có thể Sang năm để sản xuất; hết tiền mặt chưa phải phá sản.</p>}
    {quantity === 'max' && <p className="investment-help">Mua tối đa số gói đủ tiền, có thể không còn vốn vận hành.</p>}
    <div id="dirs" className="choices">
      {scene.lines.map((line) => {
        const price = prices?.[line.id] ?? step
        const preview = scene.investmentPreviews?.[line.id]?.[quantity]
        const count = preview?.count ?? (quantity === 'max' ? 0 : quantity)
        const total = preview?.total ?? price * count
        const can = !busy && !paused && !tutorialAction && count > 0 && scene.cash + 1e-6 >= total
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
              {!modern && <small>Hiệu quả năm nay: {Math.round((scene.upgradeEfficiency?.[line.id] ?? 1) * 100)}%</small>}
            </div>
            <button type="button" className="choice-price investment-buy" disabled={!can} aria-busy={feedback?.line===line.id&&feedback.phase==='sending'} aria-label={`${line.label}, ${count} gói, ${money(total)}`} onClick={() => void purchase(line.id,benefit?.gain || line.label)}>
              Đầu tư ×{count}<b>{money(total)}</b>
            </button>
            {modern && line.id==='eng' && scene.investmentPreviews?.eng?.crew && <button type="button" className="recruit-crew" disabled={busy||paused||Boolean(tutorialAction)||scene.cash<scene.investmentPreviews.eng.crew.total} onClick={()=>void purchase('eng','Tổ công nhân đã sẵn sàng','crew')}>Tuyển đủ tổ: +{scene.investmentPreviews.eng.crew.count} người · {money(scene.investmentPreviews.eng.crew.total)}</button>}
            {feedback?.line === line.id && feedback.phase!=='sending' && <span key={feedback.version+feedback.phase} className={`purchase-feedback ${feedback.phase}`} role="status">{feedback.phase==='confirmed'?'Đã nâng cấp':'Chưa nâng cấp'}</span>}
            {preview && <details className="investment-projection"><summary>Xem tác động khi Sang năm</summary>
              <dl className="finance-lines"><div><dt>Cụm vận hành dự kiến</dt><dd>{wholeCount(scene.operatingForecast?.operating??scene.operating)} → {wholeCount(preview.operating)}</dd></div><div><dt>Lãi/lỗ sản xuất dự kiến / năm</dt><dd>{money(scene.operatingForecast?.net ?? 0)} → {money(preview.net)}</dd></div><div><dt>Giá gói kế tiếp</dt><dd>{money(preview.nextPrice??price)}</dd></div></dl>
            </details>}
          </article>
        )
      })}
    </div>
    {modern && <details className="company-upgrades-panel" open={scene.operating>=3}><summary>Chất lượng & bảo dưỡng · 3 lựa chọn{(scene.condition??1)<.99?' · Có thể bảo dưỡng':''}</summary>
    <div className="choices company-upgrades">{scene.companyUpgrades?.map(upgrade=>{
      const label={training:'Đào tạo tay nghề',modernization:'Cải tiến thiết bị',maintenance:'Bảo dưỡng thiết bị'}[upgrade.kind]
      return <article className={`btn choice investment-card${feedback?.line===upgrade.kind?` purchase-${feedback.phase}`:''}`} key={upgrade.kind}>
        <PaintedIcon name={upgrade.kind==='training'?'eng':upgrade.kind==='modernization'?'tech':'investment'} className="quality-upgrade-art" />
        <div className="choice-copy"><h4 className="choice-label">{label}</h4><span className="choice-benefit">{upgrade.kind==='maintenance'?'Khôi phục tình trạng thiết bị về 100%':'Tăng năng suất'}</span><small>{upgrade.kind==='maintenance'?`Tình trạng: ${Math.round(upgrade.conditionBefore*100)}%`:`Cấp ${upgrade.level} → ${Math.min(5,upgrade.levelAfter)}`}</small>{upgrade.locked&&<small className="investment-warning">{upgrade.reason}</small>}</div>
        <div className="choice-result"><strong>{wholeCount(upgrade.outputBefore)} → {wholeCount(upgrade.outputAfter)} sản phẩm/năm</strong><small>Lãi sản xuất: {money(upgrade.netBefore)} → {money(upgrade.netAfter)}/năm</small></div>
        <button type="button" className="choice-price investment-buy" disabled={busy||paused||Boolean(tutorialAction)||upgrade.locked||scene.cash<upgrade.price} onClick={async()=>{const version=++purchaseSequence.current;setFeedback({line:upgrade.kind,phase:'sending',version,gain:label});const ok=await onUpgrade?.(upgrade.kind);if(version===purchaseSequence.current)setFeedback({line:upgrade.kind,phase:ok?'confirmed':'failed',version,gain:label})}}>{upgrade.kind==='maintenance'?'Bảo dưỡng':'Nâng 1 cấp'}<b>{money(upgrade.price)}</b></button>
        {feedback?.line===upgrade.kind && feedback.phase!=='sending' && <span className={`purchase-feedback ${feedback.phase}`} role="status">{feedback.phase==='confirmed'?'Đã nâng cấp':'Chưa nâng cấp'}</span>}
      </article>
    })}</div></details>}
    <PollutionDetails scene={scene} />
    </>
  )
}

/** Explanations only: the server remains the authority for investment quantities. */
function upgradeBrief(line: SceneView['lines'][number]['id']) {
  return { eng: 'Bổ sung công nhân vận hành', mac: 'Tăng năng lực sản xuất', sup: 'Giảm chi phí đầu vào · chống thiếu nguồn cung', inf: 'Giảm phí logistics · tăng tỷ lệ hàng bán được', grn: 'Giảm ô nhiễm · bảo vệ giá bán' }[line]
}

function upgradeInfo(scene: SceneView, line: SceneView['lines'][number]['id']) {
  const number = (n: number) => n.toLocaleString('vi-VN', { maximumFractionDigits: 1 })
  switch (line) {
    case 'eng': return { effect: 'Bổ sung công nhân để vận hành cụm sản xuất; giảm phụ thuộc công nghệ.', current: `Hiện có ${wholeCount(scene.engineers)} công nhân · ${wholeCount(scene.idle)} cụm chờ đủ nhân lực` }
    case 'mac': return { effect: 'Thêm cụm sản xuất. Cần đủ công nhân để đưa máy vào vận hành.', current: `Hiện có ${wholeCount(scene.machines)} cụm sản xuất · ${wholeCount(scene.operating)} đang chạy` }
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
    case 'eng': return { gain: `+${wholeCount(p.gain)} công nhân`, change: `${wholeCount(scene.engineers)} → ${wholeCount(p.levelAfter)} người`,
      warning: scene.machines>0 && scene.idle < .01 ? 'Hiện đủ người cho các cụm; tuyển thêm để chuẩn bị mở rộng.' : undefined }
    case 'mac': return { gain: p.gain>0 ? `+${wholeCount(p.gain)} cụm sản xuất` : `Lắp đặt ${Math.floor((p.machineProgress??0)*100)}%`, change: `${wholeCount(scene.machines)} → ${wholeCount(p.levelAfter)} cụm`,
      warning: p.staffMissing > 0 ? `Còn thiếu ${wholeCount(p.staffMissing)} công nhân; ${wholeCount(p.idle)} cụm chờ đủ nhân lực.` : 'Đủ nhân lực vận hành toàn bộ cụm.' }
    case 'sup': return { gain: `Giảm ${percent(p.inputDiscount)} phí đầu vào`, change: `${percent(base?.inputDiscount ?? 0)} → ${percent(p.inputDiscount)}`, warning: undefined }
    case 'inf': return { gain: `Bán được ${percent(p.delivery)} sản lượng`, change: `${percent(base?.delivery ?? .9)} → ${percent(p.delivery)}`, warning: undefined }
    case 'grn': return { gain: scene.pollution > p.pollutionNowAfter ? `−${number(scene.pollution - p.pollutionNowAfter)} ô nhiễm ngay` : `+${number(p.treatment - (base?.treatment ?? 0))} điểm xử lý/năm`, change: `${number(scene.pollution)} → ${number(p.pollutionNowAfter)}/100`,
      warning: p.pricePenalty > 0 ? `Kỳ tới giá bán còn giảm ${percent(p.pricePenalty)} do ô nhiễm.` : 'Kỳ tới chưa bị giảm giá bán vì ô nhiễm.' }
  }
}

export function PollutionDetails({ scene }: { scene: SceneView }) {
  const p = scene.operatingForecast
  if (!p) return null
  return <details className="pollution-explainer"><summary>Ô nhiễm {number(scene.pollution)}/100 · {scene.pollution <= 30 ? 'Thấp' : scene.pollution <= 60 ? 'Cần xử lý' : 'Cao'}</summary>
    <dl className="finance-lines"><div><dt>Ô nhiễm kỳ tới</dt><dd>{number(p.pollution)}/100</dd></div><div><dt>Xử lý / năm</dt><dd>{number(p.treatment)} điểm</dd></div><div><dt>Giảm giá bán kỳ tới</dt><dd>{percent(p.pricePenalty)}</dd></div><div><dt>Giảm giá trị hiện tại</dt><dd>−{money(p.currentValuePenalty)}</dd></div></dl>
  </details>
}

/** All industries have their own art; failed requests fall back to a neutral icon. */
function UpgradeArt({ industry, line }: { industry: string; line: SceneView['lines'][number]['id'] }) {
  const [missing, setMissing] = useState(false)
  const source = investmentArt(industry, line)
  return <span className="upgrade-art">{!missing && source ? <img className="choice-art" src={source} alt="" onError={() => setMissing(true)} /> : <Icon name={{ eng: 'eng', mac: 'line', sup: 'sup', inf: 'inst', grn: 'leaf' }[line]} />}</span>
}
