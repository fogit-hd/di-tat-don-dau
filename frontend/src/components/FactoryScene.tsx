import { useId, useState } from 'react'
import type { SceneView } from '../api/types.ts'
import { factoryArt } from '../lib/art.ts'
import { money } from '../lib/format.ts'
import { count, signedRate, signedMoney } from '../lib/production-format.ts'
import { OperationIcon } from './OperationIcon.tsx'
import { PaintedIcon } from './PaintedIcon.tsx'

function moneyRange(min: number, max: number) {
  const a=money(min), b=money(max)
  if(a===b)return a
  const unit=/ (triệu|tỷ)$/.exec(a)?.[0]
  return unit&&b.endsWith(unit)?`${a.slice(0,-unit.length)}–${b}`:`${a} – ${b}`
}

export function FactoryScene({scene,paused,dim=false,onShowEffects}: {scene:SceneView;paused:boolean;now?:number;dim?:boolean;onShowYear?:(year:number)=>void;onShowEffects?:()=>void}) {
  const [photo,setPhoto]=useState(true),[report,setReport]=useState(false)
  const uid=useId(),forecast=scene.productionForecast,plan=forecast?.expected,range=forecast?.range
  const stopped=(scene.stopped??0)>0 || scene.machines>0&&(scene.condition??1)<=0
  const effects=plan?.appliedEffects.filter(e=>e.outputMul!==1||e.priceMul!==1||e.revenueMul!==1||e.costMul!==1||e.cashPerYear!==0||e.investmentMul!==1)??[]
  const leading=effects[0]
  const impact=leading?[leading.outputMul!==1?`${signedRate(leading.outputMul-1)} sản lượng`:'',leading.priceMul!==1?`${signedRate(leading.priceMul-1)} giá bán`:'',leading.costMul!==1?`${signedRate(leading.costMul-1)} chi phí`:'',leading.revenueMul!==1?`${signedRate(leading.revenueMul-1)} doanh thu`:'',leading.cashPerYear?`${signedMoney(leading.cashPerYear)}/năm`:'',leading.investmentMul!==1?`${signedRate(leading.investmentMul-1)} giá đầu tư`:''].filter(Boolean).join(' · '):''
  return <section className={`card scene factory-scene${report?' report-open compact-report':''}${paused?' is-paused':''}${dim||scene.finished?' is-dim':''}`} aria-label="Ảnh và thông số doanh nghiệp">
    <button className="factory-report-toggle" type="button" aria-expanded={report} aria-controls={`${uid}-body`} onClick={()=>setReport(!report)}><OperationIcon name={report?'back':'report'}/>{report?'Về ảnh':'Thông số'}</button>
    {report?<div className="factory-report" id={`${uid}-body`}>
      <header><h3>Thông số</h3><small>{scene.finished||scene.bankrupt?'Đã dừng vận hành':`Dự kiến năm ${scene.cycles+1}`}</small></header>
      {!forecast||!plan||!range?<p className="finance-note">{scene.finished||scene.bankrupt?'Doanh nghiệp đã dừng sản xuất.':'Chưa có dữ liệu dự báo.'}</p>:<div className="factory-quick-view">
        <div className="factory-key-metrics">
          <article><PaintedIcon name="prod"/><div><span>Sản lượng / năm</span><strong>{range.outputMin===range.outputMax?count(range.outputMin):`${count(range.outputMin)}–${count(range.outputMax)}`}</strong><small>{scene.unit}</small></div></article>
          <article><PaintedIcon name="coins"/><div><span>Lãi/lỗ sản xuất</span><strong className={range.netMax<0?'down':'up'}>{moneyRange(range.netMin,range.netMax)}</strong></div></article>
        </div>
        <div className="factory-cash-forecast"><span>Tiền mặt cuối năm</span><b>{moneyRange(forecast.cashMin,forecast.cashMax)}</b></div>
        <div className="factory-fleet-summary"><span><b>{count(plan.operating)}/{count(plan.machines)}</b> cụm đang chạy</span><span>Độ bền <b>{Math.round((scene.condition??1)*100)}%</b></span></div>
        {plan.defectMin!=null&&scene.machines>0&&<p className="finance-note">Tốc độ {Math.round((plan.conditionFactor??1)*100)}% · Hàng lỗi dự kiến {plan.defectMin}–{plan.defectMax}% · không bán được</p>}
        {stopped?<p className="factory-key-warning">Máy ngừng sản xuất. Bảo dưỡng trong Đầu tư để chạy lại.</p>:plan.staffMissing>0?<p className="factory-key-warning">Thiếu {count(plan.staffMissing)} công nhân để chạy đủ cụm.</p>:(scene.condition??1)<=.25&&scene.machines>0?<p className="factory-key-warning">Độ bền thấp. Nên bảo dưỡng trước khi máy dừng.</p>:null}
        {leading&&<button type="button" className="factory-impact-link" onClick={onShowEffects} disabled={!onShowEffects}><span><b>{leading.title}</b><small>{impact}</small></span><span>{effects.length>1?`+${effects.length-1}`:'Chi tiết'} <OperationIcon name="arrow"/></span></button>}
      </div>}
    </div>:<div className="factory-photo" id={`${uid}-body`}>{photo?<img src={factoryArt(scene.industryId)} alt={scene.factoryName} onError={()=>setPhoto(false)}/>:<p className="scene-fallback">{scene.factoryName}</p>}{stopped&&<p className="factory-photo-health" role="status">Máy dừng · cần bảo dưỡng</p>}</div>}
  </section>
}
