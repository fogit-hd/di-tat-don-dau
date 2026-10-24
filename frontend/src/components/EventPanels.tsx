import { useId, useRef, useEffect, useState, type ReactNode } from 'react'
import type { ActiveEffectView, EffectView, EventLogView, TraitView, YearChangeView } from '../api/types.ts'
import { vnd } from '../lib/format.ts'
import { EventIcon } from './EventIcon.tsx'

export function EffectBadges({
  effects,
  traits,
  centennial,
  pulse,
}: {
  effects: ActiveEffectView[]
  traits: TraitView[]
  centennial: boolean
  pulse: boolean
}) {
  const [open, setOpen] = useState<string | null>(null)
  if (!effects.length && !traits.length && !centennial) return null
  return (
    <div className="badge-row">
      {centennial && <span className="badge good">Bách niên</span>}
      {effects.map((effect) => {
        const isPriceOnly = effect.cashPerYear === 0 && Boolean(effect.investmentPct)
        const isGood = isPriceOnly ? (effect.investmentPct ?? 0) < 0 : effect.cashPerYear >= 0
        return (
          <span key={effect.eventId} className={`badge${isGood ? ' good' : ' bad'}${pulse && !isGood ? ' pulse' : ''}`}>
            {isPriceOnly
              ? `Giá đầu tư ${effect.investmentPct! > 0 ? '+' : ''}${effect.investmentPct}%, còn ${effect.yearsLeft} năm`
              : `${effect.cashPerYear > 0 ? '+' : ''}${effect.cashPerYear.toLocaleString('vi-VN')} tỷ/năm, còn ${effect.yearsLeft} năm`}
          </span>
        )
      })}
      {traits.map((trait) => (
        <button type="button" key={trait.id} className={`badge trait${open === trait.id ? ' on' : ''}`} onClick={() => setOpen(open === trait.id ? null : trait.id)}>
          {trait.label}
        </button>
      ))}
      {open && <p className="trait-note">{traits.find((trait) => trait.id === open)?.detail}</p>}
    </div>
  )
}

export function EventCardList({
  events,
  empty,
}: {
  events: EventLogView[]
  empty: string
}) {
  const [open, setOpen] = useState<string | null>(null)
  if (!events.length) return <p className="quiet">{empty}</p>
  return (
    <div className="event-list">
      {events.map((event, index) => {
        const key = `${event.eventId}-${event.year}-${index}`
        return (
          <button
            type="button"
            key={key}
            className={`event-card${event.good ? ' good' : ' bad'}${open === key ? ' on' : ''}`}
            onClick={() => setOpen(open === key ? null : key)}
          >
            <EventIcon name={event.icon} />
            <span className="event-copy">
              <b>{event.title}</b>
              <span>
                Năm {event.year} · {event.effect}
              </span>
              {open === key && <span className="event-body">{event.body}</span>}
            </span>
          </button>
        )
      })}
    </div>
  )
}

export function YearTabs({ events, changes }: { events: EventLogView[]; changes: YearChangeView[] }) {
  const [tab, setTab] = useState<'events' | 'years'>('events')
  return (
    <section className="card year-tabs">
      <div className="tablist" role="tablist" aria-label="Nhật ký năm">
        <button type="button" role="tab" aria-selected={tab === 'events'} className={tab === 'events' ? 'on' : ''} onClick={() => setTab('events')}>
          Lịch sử sự kiện
        </button>
        <button type="button" role="tab" aria-selected={tab === 'years'} className={tab === 'years' ? 'on' : ''} onClick={() => setTab('years')}>
          Thay đổi theo năm
        </button>
      </div>
      {tab === 'events' ? (
        <div role="tabpanel">
          <EventCardList events={events} empty="Chưa có sự kiện nào." />
        </div>
      ) : (
        <div role="tabpanel" className="year-ledger">
          {changes.length === 0 && <p className="quiet">Chưa sang năm nào.</p>}
          {changes.map((row) => (
            <article key={row.year} className="year-row">
              <header>
                <b>Năm {row.year}</b>
                <span>
                  Tiền {signed(row.cashBefore)} → {signed(row.cashAfter)}
                </span>
                <span>
                  Tài sản {vnd(row.assetsBefore)} → {vnd(row.assetsAfter)}
                </span>
              </header>
              <ul>
                {row.causes.map((cause, index) => <LedgerCause key={`${row.year}-${cause.kind}-${index}`} cause={cause} />)}
              </ul>
            </article>
          ))}
        </div>
      )}
    </section>
  )
}

/** One predictable place for the player's next decision and the evidence behind it. */
export function GameTabs({ investment, enterprise, risk, riskIncreasing, events, changes }: { investment: ReactNode; enterprise: ReactNode; risk: ReactNode; riskIncreasing: boolean; events: EventLogView[]; changes: YearChangeView[] }) {
  const [tab, setTab] = useState('investment')
  const uid = useId()
  const tabs = [['investment', 'Đầu tư'], ['enterprise', 'Doanh nghiệp'], ['risk', 'Rủi ro'], ['events', 'Lịch sử sự kiện'], ['years', 'Thay đổi từng năm']]
  return (
    <section className="card game-tabs" aria-label="Điều khiển trận chơi">
      <div className="game-tabs-heading">
        <div>
          <h2>Điều hành nhà máy</h2>
        </div>
      </div>
      <div className="tablist game-tablist" role="tablist" aria-label="Điều hành nhà máy">
        {tabs.map(([id, label], index) => <button key={id} id={`${uid}-${id}`} aria-controls={`${uid}-panel`} type="button" role="tab" aria-selected={tab === id} tabIndex={tab === id ? 0 : -1} className={tab === id ? 'on' : ''} onClick={() => setTab(id)} onKeyDown={(event) => {
          const next = event.key === 'ArrowRight' ? (index + 1) % tabs.length : event.key === 'ArrowLeft' ? (index + tabs.length - 1) % tabs.length : event.key === 'Home' ? 0 : event.key === 'End' ? tabs.length - 1 : -1
          if (next < 0) return
          event.preventDefault()
          setTab(tabs[next][0])
          document.getElementById(`${uid}-${tabs[next][0]}`)?.focus()
        }}>{label}{id === 'risk' && riskIncreasing && <span className="risk-dot" aria-label="Rủi ro kỳ sau tăng" />}</button>)}
      </div>
      <div role="tabpanel" id={`${uid}-panel`} aria-labelledby={`${uid}-${tab}`} className="game-panel" tabIndex={0}>
      {tab === 'investment' && investment}
      {tab === 'enterprise' && enterprise}
      {tab === 'risk' && risk}
      {tab === 'events' && (
        <div className="tab-panel">
          <EventCardList events={events} empty="Chưa có sự kiện nào." />
        </div>
      )}
      {tab === 'years' && (
        <div className="year-ledger tab-panel">
          {changes.length === 0 && <p className="quiet">Chưa sang năm nào.</p>}
          {changes.map((row) => (
            <article key={row.year} className="year-row">
              <header>
                <b>Năm {row.year}</b>
                <span>Tiền {signed(row.cashBefore)} → {signed(row.cashAfter)}</span>
                <span>Tài sản {vnd(row.assetsBefore)} → {vnd(row.assetsAfter)}</span>
              </header>
              <ul>
                {row.causes.map((cause, index) => <LedgerCause key={`${row.year}-${cause.kind}-${index}`} cause={cause} />)}
              </ul>
            </article>
          ))}
        </div>
      )}
      </div>
    </section>
  )
}

export function OngoingEvents({ effects, timed, events, now }: { effects: ActiveEffectView[]; timed: EffectView[]; events: EventLogView[]; now: number }) {
  const rail = useRef<HTMLDivElement>(null)
  const [overflow, setOverflow] = useState(false)
  const [expanded, setExpanded] = useState<{ label: string; detail: string; impact: string; remaining: string; bad: boolean } | null>(null)
  const detail = useRef<HTMLDialogElement>(null)
  useEffect(() => {
    if (expanded && !detail.current?.open) detail.current?.showModal()
  }, [expanded])
  useEffect(() => {
    const node = rail.current
    if (!node) return
    const measure = () => setOverflow(node.scrollWidth > node.clientWidth + 2)
    const observer = new ResizeObserver(measure)
    observer.observe(node)
    measure()
    return () => observer.disconnect()
  }, [effects, timed])
  const entries = [
    ...effects.map((effect, index) => {
      const event = events.find((item) => item.eventId === effect.eventId || item.title === effect.label)
      const bad = (effect.investmentPct ?? 0) > 0 || effect.cashPerYear < 0
      return { key: `${effect.eventId}-${index}`, label: effect.label, icon: event?.icon ?? (effect.investmentPct ? 'truck' : bad ? 'coinsDown' : 'coinsUp'), detail: timed.find((item) => item.title === effect.label)?.body ?? event?.body ?? effect.label, bad, impact: [effect.investmentPct ? `Giá đầu tư ${effect.investmentPct > 0 ? '+' : ''}${effect.investmentPct}%` : '', effect.cashPerYear ? `${effect.cashPerYear > 0 ? '+' : ''}${effect.cashPerYear.toLocaleString('vi-VN')} tỷ/năm` : ''].filter(Boolean).join(' · '), remaining: `Còn ${effect.yearsLeft} năm` }
    }),
    ...timed.filter((item) => now > 0 && item.endsAt > now && !effects.some((effect) => effect.label === item.title || effect.eventId === item.id)).map((item) => {
      const event = events.find((event) => event.title === item.title)
      return { key: item.id, label: item.title, icon: event?.icon ?? item.visual, detail: item.body, bad: event ? !event.good : false, impact: event?.effect ?? item.body, remaining: `Còn ${Math.ceil((item.endsAt - now) / 1000)} giây` }
    }),
  ]
  return <section className="ongoing-events" aria-label="Sự kiện đang diễn ra">
    <h2>Sự kiện đang diễn ra <span className="event-count">{entries.length}</span></h2>
    <div className="ongoing-rail" ref={rail} role="region" aria-label="Các tác động còn hiệu lực" tabIndex={0}>
      {!entries.length && <p className="quiet">Chưa có sự kiện nào đang diễn ra.</p>}
      {entries.map((effect) => <button type="button" className="ongoing-card" key={effect.key} aria-haspopup="dialog" onClick={() => setExpanded(effect)}>
        <EventIcon name={effect.icon} />
        <b>{effect.label}</b>
        <span className={effect.bad ? 'down' : 'up'}>{effect.impact}</span>
        <small>{effect.remaining}</small>
      </button>)}
    </div>
    {overflow && <div className="rail-controls"><button type="button" aria-label="Sự kiện trước" onClick={() => rail.current?.scrollBy({ left: -240, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m14 5-7 7 7 7" /></svg></button><button type="button" aria-label="Sự kiện tiếp" onClick={() => rail.current?.scrollBy({ left: 240, behavior: matchMedia('(prefers-reduced-motion: reduce)').matches ? 'instant' : 'smooth' })}><svg viewBox="0 0 24 24" aria-hidden="true"><path d="m10 5 7 7-7 7" /></svg></button></div>}
    <dialog ref={detail} className="event-detail-dialog" aria-label="Chi tiết sự kiện đang diễn ra" onClose={() => setExpanded(null)}>
      {expanded && <div><h2>{expanded.label}</h2><p>{expanded.detail}</p><p className={expanded.bad ? 'down' : 'up'}>{expanded.impact}</p><small>{expanded.remaining}</small></div>}
      <button type="button" className="btn" onClick={() => detail.current?.close()}>Đóng</button>
    </dialog>
  </section>
}

function LedgerCause({ cause }: { cause: YearChangeView['causes'][number] }) {
  const hasImmediateCash = Math.abs(cause.cash) >= 0.5
  const hasNonCashImpact = !hasImmediateCash && (Boolean(cause.detail) || cause.kind === 'event')
  return (
    <li className={hasNonCashImpact ? 'non-cash-cause' : ''}>
      <span>
        <strong>{causeLabel(cause.kind)} · {cause.label}</strong>
        {cause.detail && cause.detail !== cause.label && <small>{cause.detail}</small>}
      </span>
      {hasImmediateCash ? (
        <b className={cause.cash < 0 ? 'down' : 'up'}>{signed(cause.cash)}</b>
      ) : hasNonCashImpact ? (
        <em>{cause.detail ? 'Tác động theo chỉ số' : 'Tác động phi tiền mặt'}</em>
      ) : null}
    </li>
  )
}

function signed(value: number) {
  const rounded = Math.round(value)
  const text = `${rounded > 0 ? '+' : ''}${rounded.toLocaleString('vi-VN')} tỷ`
  return text
}

function causeLabel(kind: string) {
  if (kind === 'production') return 'Sản xuất'
  if (kind === 'investment') return 'Đầu tư'
  if (kind === 'event') return 'Sự kiện'
  if (kind === 'ongoing') return 'Khoản kéo dài'
  if (kind === 'interest') return 'Lãi nợ'
  if (kind === 'insurance') return 'Bảo hiểm'
  if (kind === 'centennial') return 'Trăm năm'
  return kind
}
