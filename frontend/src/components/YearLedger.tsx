import { useId, useState } from 'react'
import type { LineView, YearChangeView } from '../api/types.ts'
import { groupYearCauses, packageCount, summarizeYear, type LedgerGroup } from '../lib/year-ledger.ts'
import { money, vnd } from '../lib/format.ts'
import { CanvasHeading, DisclosureArrow, PaintedIcon, type PaintedIconName } from './PaintedIcon.tsx'
import { investmentArt } from '../lib/art.ts'

const LABELS: Record<string, string> = { production: 'Sản xuất', investment: 'Đầu tư', event: 'Sự kiện', ongoing: 'Khoản kéo dài', interest: 'Lãi nợ', insurance: 'Bảo hiểm', centennial: 'Trăm năm' }
const ICONS: Record<string, PaintedIconName> = { production: 'line', investment: 'investment', event: 'history', ongoing: 'coins', interest: 'coins', insurance: 'life_insurance', centennial: 'centennial' }
const signed = (value: number) => `${value > 0 ? '+' : ''}${money(value)}`
const tone = (value: number) => value < -.005 ? 'down' : value > .005 ? 'up' : 'neutral'

export function YearLedger({ changes, lines = [], industryId = '' }: { changes: YearChangeView[]; lines?: LineView[]; industryId?: string }) {
  const [openYear, setOpenYear] = useState<number | null>(null)
  const uid = useId()
  return <section className="year-canvas">
    <CanvasHeading>Thay đổi từng năm</CanvasHeading>
    <p className="canvas-caption">Biến động tiền mặt sau mỗi năm</p>
    {changes.length === 0 && <p className="quiet">Chưa sang năm nào.</p>}
    <div className="year-summary-list">
      {changes.map(row => {
        const open = openYear === row.year
        const categories = summarizeYear(row.causes)
        const groups = groupYearCauses(row.causes)
        const previewCategory = categories.find(category => category.kind === 'investment') ?? categories[0]
        const cashDelta = row.cashAfter - row.cashBefore
        const detailsId = `${uid}-year-${row.year}`
        return <article className={`year-card${open ? ' expanded' : ''}`} key={row.year}>
          <button className="year-toggle" type="button" aria-expanded={open} aria-controls={detailsId} onClick={() => setOpenYear(open ? null : row.year)}>
            <b className="year-ribbon">Năm {row.year}</b>
            <span className="year-activities">{!open && previewCategory && <span className="activity-chip"><PaintedIcon name={ICONS[previewCategory.kind] ?? 'history'} /><span>{LABELS[previewCategory.kind] ?? previewCategory.kind}{previewCategory.packages ? ` ×${previewCategory.packages}` : ''}</span></span>}{!open && categories.length > 1 && <small>+{categories.length - 1}</small>}</span>
            <span className={`year-cash-delta ${tone(cashDelta)}`} aria-label={`Biến động tiền mặt ${signed(cashDelta)}`}><PaintedIcon name="coins" /><b>{signed(cashDelta)}</b></span>
            <DisclosureArrow open={open} />
          </button>
          {open && <div className="year-expanded" id={detailsId}>
            <div className="year-category-totals">{categories.map(category => <div key={category.kind}><PaintedIcon name={ICONS[category.kind] ?? 'history'} /><span>{LABELS[category.kind] ?? category.kind}{category.packages ? ` ×${category.packages}` : ''}<b className={tone(category.cash)}>{category.hasCash ? signed(category.cash) : 'Tác động chỉ số'}</b></span></div>)}</div>
            <ul className="grouped-ledger">{groups.filter(group => group.kind !== 'production' || group.entries.some(entry => entry.detail)).map(group => <GroupedCause key={group.key} group={group} line={lines.find(line => line.label === group.label)} industryId={industryId} />)}</ul>
            <div className="year-balance-footer"><p><PaintedIcon name="coins" /><span>Tiền mặt {money(row.cashBefore)} → {money(row.cashAfter)}</span></p><details><summary>Xem số dư tài sản <DisclosureArrow /></summary><p>{vnd(row.assetsBefore)} → {vnd(row.assetsAfter)}</p></details></div>
          </div>}
        </article>
      })}
    </div>
    {changes.length > 0 && <p className="canvas-help">Chọn năm để xem chi tiết.</p>}
  </section>
}

function GroupedCause({ group, line, industryId }: { group: LedgerGroup; line?: LineView; industryId: string }) {
  const details = group.entries.filter(entry => entry.detail && entry.detail !== entry.label)
  const canExpand = details.length > 0 || group.entries.length > 1
  const content = <>
    <span className="ledger-item-art"><PaintedIcon name={line ? { eng: 'eng', mac: 'line', sup: 'sup', inf: 'inst', grn: 'environment' }[line.id] as PaintedIconName : ICONS[group.kind] ?? 'history'} />{group.kind === 'investment' && line && industryId && <img src={investmentArt(industryId, line.id)} alt="" width="48" height="48" decoding="async" onError={event => { event.currentTarget.hidden = true }} />}</span>
    <span className="ledger-group-label" title={group.label}><span>{group.label}</span>{canExpand && <DisclosureArrow />}</span>
    {group.packages > 0 && <small className="package-chip">×{group.packages}</small>}
    <b className={tone(group.cash)}>{group.entries.some(entry => Math.abs(entry.cash) >= .005) ? signed(group.cash) : 'Tác động chỉ số'}</b>
  </>
  return <li>{canExpand ? <details className="ledger-entry-details"><summary>{content}</summary><ul><li><strong>{group.label}</strong></li>{group.entries.map((entry, index) => <li key={index}>{entry.detail || (entry.kind === 'investment' ? `${packageCount(entry)} gói` : entry.label)}<span>{Math.abs(entry.cash) >= .005 ? signed(entry.cash) : ''}</span></li>)}</ul></details> : <div className="ledger-group-row">{content}</div>}</li>
}
