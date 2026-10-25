import { money } from '../lib/format.ts'
import type { ProductionPlanView, ProductionReportView } from '../api/production.ts'
import { figure, rate, signedMoney } from '../lib/production-format.ts'
import { PaintedIcon } from './PaintedIcon.tsx'


export function CostRows({ plan }: { plan: ProductionPlanView }) {
  return <dl className="finance-lines cost-lines">
    <div><dt>Nguyên liệu {plan.inputDiscount > 0 && <small>(phụ trợ giảm {rate(plan.inputDiscount)})</small>}</dt><dd>{signedMoney(-plan.inputCost)}</dd></div>
    <div><dt>Logistics {plan.logisticsDiscount > 0 && <small>(hạ tầng giảm {rate(plan.logisticsDiscount)})</small>}</dt><dd>{signedMoney(-plan.logisticsCost)}</dd></div>
    <div><dt>Chi phí khác</dt><dd>{signedMoney(-plan.otherCost)}</dd></div>
    <div><dt>Máy nhàn · {figure(plan.idle)} dây chuyền</dt><dd>{signedMoney(-plan.idleCost)}</dd></div>
  </dl>
}

/** Reads the immutable settled-year report. Never reconstructs a past year from today's company. */
export function ProductionDetails({ report }: { report: ProductionReportView }) {
  return <div className="production-receipt">
    <h4><PaintedIcon name="line" /> Sản xuất năm {report.year} · Đã chốt</h4>
    <dl className="finance-lines">
      <div><dt>Máy thực chạy / sở hữu</dt><dd>{figure(report.operating)} / {figure(report.machines)}</dd></div>
      <div><dt>Sản lượng nền sau công nghệ</dt><dd>{figure(report.theoreticalOutput, 4)} {report.unit}</dd></div>
      {report.appliedEffects.filter(e => e.outputMul !== 1).map(e => <div key={e.id}><dt>{e.title}</dt><dd>×{figure(e.outputMul, 4)} ({rate(e.outputMul - 1)})</dd></div>)}
      <div><dt>Dao động sản xuất đã bốc</dt><dd>{rate(report.outputNoise)}</dd></div>
      <div className="finance-emphasis"><dt>Sản lượng thực tế</dt><dd>{figure(report.output, 4)} {report.unit}</dd></div>
      <div><dt>Bán được · {rate(report.delivery)}</dt><dd>{figure(report.sold, 4)} {report.unit}</dd></div>
      <div><dt>Giá gốc / {report.unit}</dt><dd>{money(report.basePrice)}</dd></div>
      <div><dt>Dao động giá đã bốc</dt><dd>{rate(report.priceNoise)}</dd></div>
      {report.priceMul !== 1 && <div><dt>Hệ số giá từ sự kiện</dt><dd>×{figure(report.priceMul, 4)}</dd></div>}
      {report.pricePenalty > 0 && <div><dt>Giảm giá vì ô nhiễm {figure(report.pollution)}/100</dt><dd>−{rate(report.pricePenalty)}</dd></div>}
      <div><dt>Giá bán thực tế / {report.unit}</dt><dd>{money(report.price)}</dd></div>
      {report.revenueMul !== 1 && <div><dt>Hệ số doanh thu từ sự kiện</dt><dd>×{figure(report.revenueMul, 4)}</dd></div>}
      <div className="finance-emphasis"><dt>Doanh thu = lượng bán × giá × hệ số doanh thu</dt><dd className="up">{signedMoney(report.revenue)}</dd></div>
    </dl>
    <h5>Chi phí vận hành {report.costMul !== 1 && <small>· hệ số sự kiện ×{figure(report.costMul, 4)} đã áp dụng</small>}</h5>
    <CostRows plan={report} />
    <dl className="finance-lines"><div className="finance-total"><dt>Lãi/lỗ sản xuất = doanh thu − chi phí</dt><dd className={report.net < 0 ? 'down' : 'up'}>{signedMoney(report.net)}</dd></div></dl>
    <p className="finance-note">Sản lượng và doanh thu đã tính hiệu ứng có hiệu lực. Không trừ sự kiện lần hai. Lạm phát, lãi nợ và tiền hỗ trợ nằm riêng trong sổ tiền.</p>
  </div>
}
