import { money } from '../lib/format.ts'
import type { ProductionPlanView, ProductionReportView } from '../api/production.ts'
import { count, figure, rate, signedRate, signedMoney } from '../lib/production-format.ts'
import { PaintedIcon } from './PaintedIcon.tsx'


export function CostRows({ plan }: { plan: ProductionPlanView }) {
  return <dl className="finance-lines cost-lines">
    <div><dt>Nguyên liệu {plan.inputDiscount > 0 && <small>(phụ trợ giảm {rate(plan.inputDiscount)})</small>}</dt><dd>{signedMoney(-plan.inputCost)}</dd></div>
    <div><dt>Logistics {plan.logisticsDiscount > 0 && <small>(hạ tầng giảm {rate(plan.logisticsDiscount)})</small>}</dt><dd>{signedMoney(-plan.logisticsCost)}</dd></div>
    <div><dt>Chi phí khác</dt><dd>{signedMoney(-plan.otherCost)}</dd></div>
    <div><dt>Duy trì cụm chưa chạy · {count(plan.idle+(plan.stopped??0))} cụm</dt><dd>{signedMoney(-plan.idleCost)}</dd></div>
  </dl>
}

/** Reads the immutable settled-year report. Never reconstructs a past year from today's company. */
export function ProductionDetails({ report }: { report: ProductionReportView }) {
  return <div className="production-receipt">
    <h4><PaintedIcon name="line" /> Sản xuất năm {report.year} · Đã chốt</h4>
    <dl className="finance-lines">
      <div><dt>Cụm đang vận hành / sở hữu</dt><dd>{count(report.operating)} / {count(report.machines)}</dd></div>
      {report.workerBonus!=null && <div><dt>Hiệu quả tay nghề</dt><dd>{signedRate(report.workerBonus-1)}</dd></div>}
      {report.machineBonus!=null && <div><dt>Hiệu quả thiết bị</dt><dd>{signedRate(report.machineBonus-1)}</dd></div>}
      {report.conditionWearPct!=null && report.conditionWearPct>0 && <div><dt>Hao mòn sau năm này</dt><dd>−{report.conditionWearPct} điểm % · còn {Math.round((report.conditionAfter??0)*100)}%</dd></div>}
      {report.conditionFactor!=null && <div><dt>Tốc độ theo độ bền</dt><dd>{rate(report.conditionFactor)}</dd></div>}
      {report.appliedEffects.filter(e => e.outputMul !== 1).map(e => <div key={e.id}><dt>{e.title}</dt><dd>{signedRate(e.outputMul - 1)} sản lượng</dd></div>)}
      <div><dt>Biến động sản lượng</dt><dd>{signedRate(report.outputNoise-1)}</dd></div>
      <div className="finance-emphasis"><dt>Sản lượng thực tế</dt><dd>{count(report.output)} {report.unit}</dd></div>
      {report.defective!=null&&<><div><dt>Hàng lỗi · {report.defectRatePct}% · không bán được</dt><dd className="down">{count(report.defective)} {report.unit}</dd></div><div><dt>Đạt chất lượng</dt><dd>{count(report.saleable??report.output)} {report.unit}</dd></div></>}
      <div><dt>Bán được · {rate(report.delivery)}</dt><dd>{count(report.sold)} {report.unit}</dd></div>
      <div><dt>Giá gốc / {report.unit}</dt><dd>{money(report.basePrice)}</dd></div>
      <div><dt>Biến động giá</dt><dd>{signedRate(report.priceNoise-1)}</dd></div>
      {report.priceMul !== 1 && <div><dt>Tác động giá từ sự kiện</dt><dd>{signedRate(report.priceMul-1)}</dd></div>}
      {report.pricePenalty > 0 && <div><dt>Giảm giá vì ô nhiễm {figure(report.pollution)}/100</dt><dd>−{rate(report.pricePenalty)}</dd></div>}
      <div><dt>Giá bán thực tế / {report.unit}</dt><dd>{money(report.price)}</dd></div>
      {report.revenueMul !== 1 && <div><dt>Tác động doanh thu từ sự kiện</dt><dd>{signedRate(report.revenueMul-1)}</dd></div>}
      <div className="finance-emphasis"><dt>Doanh thu</dt><dd className="up">{signedMoney(report.revenue)}</dd></div>
    </dl>
    <h5>Chi phí vận hành</h5>
    <CostRows plan={report} />
    <dl className="finance-lines"><div className="finance-total"><dt>Lãi/lỗ sản xuất</dt><dd className={report.net < 0 ? 'down' : 'up'}>{signedMoney(report.net)}</dd></div></dl>
  </div>
}
