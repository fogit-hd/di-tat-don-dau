import { useId, useRef, useState } from 'react'
import type { SceneView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { money } from '../lib/format.ts'
import { CostRows } from './ProductionDetails.tsx'
import { count, rate, signedRate, signedMoney } from '../lib/production-format.ts'
import { OperationIcon } from './OperationIcon.tsx'
import { PaintedIcon } from './PaintedIcon.tsx'

export function FactoryScene({ scene, paused, dim = false, onShowYear }: { scene: SceneView; paused: boolean; now?: number; dim?: boolean; onShowYear?: (year: number) => void }) {
  const [photo, setPhoto] = useState(true)
  const [report, setReport] = useState(false)
  const [tab, setTab] = useState('output')
  const uid = useId()
  const toggle = useRef<HTMLButtonElement>(null)
  const forecast = scene.productionForecast
  const plan = forecast?.expected
  const range = forecast?.range
  const tabs = [['output','Sản lượng'],['finance','Thu–chi'],['effects','Tác động']]
  return <section className={`card scene factory-scene${report ? ' report-open' : ''}${paused ? ' is-paused' : ''}${dim || scene.finished ? ' is-dim' : ''}`} aria-label="Ảnh và thông số doanh nghiệp">
    <button ref={toggle} className="factory-report-toggle" type="button" aria-expanded={report} aria-controls={`${uid}-body`} onClick={() => setReport(!report)}><OperationIcon name={report ? 'back' : 'report'} />{report ? 'Về ảnh' : 'Thông số'}</button>
    {report ? <div className="factory-report" id={`${uid}-body`}>
      <header><h3>Thông số vận hành</h3><small>{scene.finished || scene.bankrupt ? 'Đã dừng vận hành' : 'Dự báo kỳ tới · chưa chốt'}</small></header>
      {!forecast || !plan || !range ? <p className="finance-note">{scene.finished || scene.bankrupt ? 'Doanh nghiệp đã dừng sản xuất.' : 'Chưa có dữ liệu dự báo chi tiết.'}{scene.lastProduction && onShowYear && <button className="report-history-link" onClick={() => onShowYear?.(scene.lastProduction!.year)}>Xem kết quả năm {scene.lastProduction.year}</button>}</p> : <>
        <div className="report-tabs" role="tablist" aria-label="Thông số vận hành">{tabs.map(([id,label], index) => <button id={`${uid}-${id}`} aria-controls={`${uid}-report-panel`} key={id} type="button" role="tab" aria-selected={tab===id} tabIndex={tab===id?0:-1} onClick={() => setTab(id)} onKeyDown={event => {
          const next=event.key==='ArrowRight'?(index+1)%3:event.key==='ArrowLeft'?(index+2)%3:event.key==='Home'?0:event.key==='End'?2:-1
          if(next<0)return;event.preventDefault();setTab(tabs[next][0]);document.getElementById(`${uid}-${tabs[next][0]}`)?.focus()
        }}>{label}</button>)}</div>
        <div className="report-tab-content" key={tab} role="tabpanel" id={`${uid}-report-panel`} aria-labelledby={`${uid}-${tab}`} tabIndex={0}>
          {tab==='output' && <>
            <div className="report-output-result"><PaintedIcon name="prod" /><div><small>Sản lượng tạo ra / năm</small><strong>{count(range.outputMin)}–{count(range.outputMax)} <span>{scene.unit}</span></strong></div></div>
            <div className="report-capacity"><span>{count(plan.engineers)} công nhân</span><OperationIcon name="arrow" /><span>{count(plan.operating)} / {count(plan.machines)} cụm đang vận hành</span></div>
            {plan.staffMissing>0 && <p className="investment-warning">Còn thiếu {count(plan.staffMissing)} công nhân · {count(plan.idle)} cụm chờ đủ nhân lực.</p>}
            {plan.appliedEffects.filter(e=>e.outputMul!==1).map(e=><p className="report-factor" key={e.id}>{e.title}<b>{signedRate(e.outputMul-1)} sản lượng</b></p>)}
            <p className="report-factor">Dao động sản xuất<b>{rate(range.outputNoiseMin)}–{rate(range.outputNoiseMax)}</b></p>
            <p className="report-delivery"><PaintedIcon name="inst" /><span>Bán được {rate(plan.delivery)}: <b>{count(range.soldMin)}–{count(range.soldMax)} {scene.unit}</b></span></p>
          </>}
          {tab==='finance' && <>
            <div className="report-output-result"><PaintedIcon name="coins" /><div><small>Lãi/lỗ sản xuất dự kiến</small><strong>{money(range.netMin)} – {money(range.netMax)}</strong></div></div>
            <dl className="finance-lines"><div><dt>Doanh thu</dt><dd className="up">{money(range.revenueMin)} – {money(range.revenueMax)}</dd></div><div><dt>Chi phí vận hành</dt><dd className="down">{signedMoney(-plan.opex)}</dd></div></dl>
            <details><summary>Chi tiết doanh thu và chi phí</summary><dl className="finance-lines"><div><dt>Giá bán dự kiến / {scene.unit}</dt><dd>{money(range.priceMin)}–{money(range.priceMax)}</dd></div><div><dt>Giảm giá vì ô nhiễm</dt><dd>{rate(plan.pricePenalty)}</dd></div></dl><CostRows plan={plan} /></details>
            <details><summary>Tiền mặt và định giá công ty</summary><dl className="finance-lines"><div><dt>Khoản kéo dài / năm</dt><dd>{signedMoney(forecast.ongoing)}</dd></div><div><dt>Lãi nợ kỳ tới · {rate(forecast.interestRate)}</dt><dd>{signedMoney(forecast.interest)}</dd></div><div><dt>Lạm phát dự kiến</dt><dd>{rate(forecast.inflationMin)}–{rate(forecast.inflationMax)}</dd></div><div><dt>Tiền cuối kỳ dự kiến</dt><dd>{money(forecast.cashMin)}–{money(forecast.cashMax)}</dd></div></dl>
              {scene.companyBooks && <><h4>Giá trị công ty</h4><dl className="finance-lines">{([['Tiền mặt','cash'],['Nhân lực','workforce'],['Máy móc','machines'],['Phụ trợ','support'],['Hạ tầng','infra'],['Công nghệ sạch','green'],['Thương hiệu','brand']] as const).map(([label,key])=><div key={key}><dt>{label}</dt><dd>{money(scene.companyBooks![key])}</dd></div>)}<div><dt>Giảm vì ô nhiễm</dt><dd>{signedMoney(-scene.companyBooks.pollutionPenalty)}</dd></div><div><dt>Giảm vì phụ thuộc</dt><dd>{signedMoney(-scene.companyBooks.dependencyPenalty)}</dd></div><div><dt>Tổng định giá</dt><dd>{money(scene.companyBooks.total)}</dd></div></dl></>}
            </details>
          </>}
          {tab==='effects' && <>
            <p className="report-effects-caption">Các hiệu ứng đã tính vào kỳ tới</p>
            {!plan.appliedEffects.length && <p>Chưa có hiệu ứng kinh tế áp dụng.</p>}
            {plan.appliedEffects.map(effect=><article className="report-effect" key={effect.id}><b>{effect.title}</b><small>{effect.yearsLeft>0?`Còn ${effect.yearsLeft} năm`:'Đang có hiệu lực'}</small><p>{[
              effect.outputMul!==1?`Sản lượng ${signedRate(effect.outputMul-1)}`:'',effect.priceMul!==1?`Giá bán ${signedRate(effect.priceMul-1)}`:'',effect.revenueMul!==1?`Doanh thu ${signedRate(effect.revenueMul-1)}`:'',effect.costMul!==1?`Chi phí ${signedRate(effect.costMul-1)}`:'',effect.cashPerYear?`${signedMoney(effect.cashPerYear)}/năm`:'',effect.investmentMul!==1?`Giá mua ${signedRate(effect.investmentMul-1)}`:'',
            ].filter(Boolean).join(' · ') || 'Không có tác động kinh tế còn hiệu lực.'}</p></article>)}
          </>}
          {scene.cycles>0 && onShowYear && <button type="button" className="report-history-link" onClick={() => onShowYear?.(scene.cycles)}>Xem kết quả năm {scene.cycles} đã chốt <OperationIcon name="arrow" /></button>}
        </div>
      </>}
    </div> : <div className="factory-photo" id={`${uid}-body`}>{photo ? <img src={factoryArt(scene.industryId)} alt={scene.factoryName} onError={() => setPhoto(false)} /> : <p className="scene-fallback">{scene.factoryName}</p>}</div>}
  </section>
}
