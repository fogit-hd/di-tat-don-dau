import { useId, useImperativeHandle, useState, type ReactNode, type Ref } from 'react'
import type { ActiveEffectView, EventLogView, TraitView, YearChangeView } from '../api/types.ts'
import { vnd } from '../lib/format.ts'
import { EventIcon } from './EventIcon.tsx'
import { traitDetail } from '../lib/special-status.ts'
import { currentEventEntries, type EventEntry, type EventGroup } from '../lib/ongoing-events.ts'
import { EventRows } from './EventOverview.tsx'

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
  const selectedTrait = traits.find(trait => trait.id === open)
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
      {selectedTrait && <p className="trait-note">{traitDetail(selectedTrait)}</p>}
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
export type GameTabsHandle = { showEvents: (group: EventGroup) => void }

export function GameTabs({ ref, investment, enterprise, risk, riskIncreasing, events, currentEvents, ongoing, changes, finished = false, result }: { ref?: Ref<GameTabsHandle>; investment: ReactNode; enterprise: ReactNode; risk: ReactNode; riskIncreasing: boolean; events: EventLogView[]; currentEvents: EventLogView[]; ongoing: EventEntry[]; changes: YearChangeView[]; finished?: boolean; result?: ReactNode }) {
  const [tab, setTab] = useState(finished ? 'events' : 'investment')
  const [eventGroup, setEventGroup] = useState<EventGroup>('history')
  const uid = useId()
  useImperativeHandle(ref, () => ({ showEvents(group) {
    setTab('events')
    setEventGroup(group)
    requestAnimationFrame(() => document.getElementById(`${uid}-events`)?.focus({ preventScroll: true }))
  } }), [uid])
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
      {tab === 'investment' && (finished ? result : investment)}
      {tab === 'enterprise' && enterprise}
      {tab === 'risk' && risk}
      {tab === 'events' && (
        <div className="tab-panel">
          {finished && result}
          <div className="event-group-controls" aria-label="Nhóm sự kiện">
            <button type="button" aria-pressed={eventGroup === 'current'} onClick={() => setEventGroup('current')}>Năm nay ({currentEvents.length})</button>
            <button type="button" aria-pressed={eventGroup === 'ongoing'} onClick={() => setEventGroup('ongoing')}>Còn hiệu lực ({ongoing.length})</button>
            <button type="button" aria-pressed={eventGroup === 'history'} onClick={() => setEventGroup('history')}>Lịch sử ({events.length})</button>
          </div>
          {eventGroup === 'history' ? <EventCardList events={events} empty="Chưa có sự kiện nào." /> : <EventRows entries={eventGroup === 'current' ? currentEventEntries(currentEvents) : ongoing} />}
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
