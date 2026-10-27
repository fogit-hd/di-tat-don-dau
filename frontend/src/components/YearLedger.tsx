import { useId, useState } from 'react'
import type { LineView, YearChangeView } from '../api/types.ts'
import { groupYearCauses, packageCount, summarizeYear, type LedgerGroup } from '../lib/year-ledger.ts'
import { money, vnd } from '../lib/format.ts'
import { CanvasHeading, DisclosureArrow, PaintedIcon, type PaintedIconName } from './PaintedIcon.tsx'
import { investmentArt } from '../lib/art.ts'
import { OperationIcon } from './OperationIcon.tsx'
import { ProductionDetails } from './ProductionDetails.tsx'

const LABELS: Record<string, string> = { production: 'Sản xuất', investment: 'Đầu tư', event: 'Sự kiện', ongoing: 'Khoản kéo dài', interest: 'Lãi nợ', insurance: 'Bảo hiểm', inflation: 'Lạm phát', quiz: 'Thưởng trả lời', centennial: 'Trăm năm' }
const ICONS: Record<string, PaintedIconName> = { production: 'line', investment: 'investment', event: 'history', ongoing: 'coins', interest: 'coins', insurance: 'life_insurance', inflation: 'coins', quiz: 'heir_trained', centennial: 'centennial' }
const signed = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`
const tone = (value: number) => value < -.005 ? 'down' : value > .005 ? 'up' : 'neutral'

export function YearLedger({ changes, lines = [], industryId = '', initialYear = null }: { initialYear?: number | null; changes: YearChangeView[]; lines?: LineView[]; industryId?: string }) {
  const [openYear, setOpenYear] = useState<number | null>(initialYear)
  const [productionYear,setProductionYear]=useState<number | null>(null)
  const uid = useId()
  return <section className="year-canvas">
    <CanvasHeading icon="coins">Dòng tiền từng năm</CanvasHeading>
    {changes.length === 0 && <p className="quiet">Chưa sang năm nào.</p>}
    <div className="year-summary-list">
      {changes.map(row => {
        const open = openYear === row.year
        const categories = summarizeYear(row.causes)
        const groups = groupYearCauses(row.causes)
        const previewCategory = categories.find(category => category.kind === 'investment') ?? categories[0]
        const cashDelta = row.cashAfter - row.cashBefore
        const unexplained = cashDelta - row.causes.reduce((sum,cause) => sum+cause.cash,0)
        const reconciled = Math.abs(unexplained) < .005
        const detailsId = `${uid}-year-${row.year}`
        return <article className={`year-card${open ? ' expanded' : ''}`} key={row.year}>
          <button className="year-toggle" type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => {setProductionYear(null);setOpenYear(open ? null : row.year)}}>
            <b className="year-ribbon">Năm {row.year}</b>
            <span className="year-activities">{!open && previewCategory && <span className="activity-chip"><PaintedIcon name={ICONS[previewCategory.kind] ?? 'history'} /><span>{LABELS[previewCategory.kind] ?? previewCategory.kind}{previewCategory.packages ? ` ×${previewCategory.packages}` : ''}</span></span>}{!open && categories.length > 1 && <small>+{categories.length - 1}</small>}</span>
            <span className={`year-cash-delta ${tone(cashDelta)}`} aria-label={`Biến động tiền mặt ${signed(cashDelta)}`}><PaintedIcon name="coins" /><b>{signed(cashDelta)}</b></span>
            <DisclosureArrow open={open} />
          </button>
          {open && <div className={`year-expanded${productionYear===row.year && row.production ? ' has-production' : ''}`} id={detailsId}><div className="cash-register">
            <div className="cash-opening"><PaintedIcon name="coins" /><span>Tiền đầu năm</span><b>{money(row.cashBefore)}</b></div>
            <ul className="grouped-ledger cash-ledger">{groups.filter(group => group.entries.some(entry => Math.abs(entry.cash) >= .005) || group.kind === 'production').map(group => group.kind==='production' ? <li key={group.key} className="production-ledger-item">
              <details onToggle={event=>{const expanded=event.currentTarget.open;setProductionYear(prev=>expanded?row.year:prev===row.year?null:prev)}}><summary aria-controls={`${detailsId}-production`}><PaintedIcon name="line" /><span><b>Lãi sản xuất</b></span><strong className={tone(group.cash)}>{signed(group.cash)}</strong><DisclosureArrow /></summary>
                {!row.production && <p className="finance-note">Chưa có chi tiết sản xuất của năm này.</p>}
              </details>
            </li> : <GroupedCause key={group.key} group={group} line={lines.find(line => line.label === group.label)} industryId={industryId} />)}</ul>
            {!reconciled && <div className="cash-reconciliation mismatch" role="status"><OperationIcon name="warning" /><b>Chênh lệch số dư: {signed(unexplained)}</b></div>}
            <div className="cash-closing"><PaintedIcon name="coins" /><span>Tiền cuối năm</span><b>{money(row.cashAfter)}</b></div>
            {groups.some(group=>!group.entries.some(e=>Math.abs(e.cash)>=.005)&&group.kind!=='production') && <section className="noncash-effects"><h4>Tác động chỉ số</h4><ul className="grouped-ledger">{groups.filter(group=>!group.entries.some(e=>Math.abs(e.cash)>=.005)&&group.kind!=='production').map(group=><GroupedCause key={group.key} group={group} industryId={industryId} />)}</ul></section>}
            <div className="year-balance-footer"><details><summary>Xem thay đổi giá trị tài sản <DisclosureArrow /></summary><p>{vnd(row.assetsBefore)} → {vnd(row.assetsAfter)}</p><small>Định giá công ty, không cộng trực tiếp vào tiền mặt.</small></details></div>
          </div>{productionYear===row.year && row.production && <aside className="year-production-aside" id={`${detailsId}-production`}><ProductionDetails report={row.production} /></aside>}</div>}
        </article>
      })}
    </div>
    {changes.length > 0 && <p className="canvas-help">Chọn năm để xem chi tiết.</p>}
  </section>
}

function GroupedCause({ group, line, industryId }: { group: LedgerGroup; line?: LineView; industryId: string }) {
  const details = group.entries.filter(entry => entry.cashBefore != null || (entry.detail && entry.detail !== entry.label))
  const canExpand = details.length > 0 || group.entries.length > 1
  const content = <>
    <span className="ledger-item-art"><PaintedIcon name={line ? { eng: 'eng', mac: 'line', sup: 'sup', inf: 'inst', grn: 'environment' }[line.id] as PaintedIconName : ICONS[group.kind] ?? 'history'} />{group.kind === 'investment' && line && industryId && <img src={investmentArt(industryId, line.id)} alt="" width="48" height="48" decoding="async" onError={event => { event.currentTarget.hidden = true }} />}</span>
    <span className="ledger-group-label" title={group.label}><span>{group.label}</span>{canExpand && <DisclosureArrow />}</span>
    {group.packages > 0 && <small className="package-chip">×{group.packages}</small>}
    <b className={tone(group.cash)}>{group.entries.some(entry => Math.abs(entry.cash) >= .005) ? signed(group.cash) : 'Tác động chỉ số'}</b>
  </>
  return <li>{canExpand ? <details className="ledger-entry-details"><summary>{content}</summary><ul><li><strong>{group.label}</strong></li>{group.entries.map((entry, index) => <li key={index}>{entry.detail || (entry.kind === 'investment' ? `${packageCount(entry)} gói` : entry.label)}<span>{Math.abs(entry.cash) >= .005 ? signed(entry.cash) : ''}</span>{entry.cashBefore != null && entry.cashAfter != null && <small className="transaction-balances">Tiền trước tác động {money(entry.cashBefore)} → sau tác động {money(entry.cashAfter)}.</small>}</li>)}</ul></details> : <div className="ledger-group-row">{content}</div>}</li>
}
