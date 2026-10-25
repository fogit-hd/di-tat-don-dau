import type { ActiveEffectView, EffectView, EventLogView, TraitView } from '../api/types.ts'
import { traitDetail, traitIsBad } from './special-status.ts'
import { money } from './format.ts'

export type EventEntry = { key: string; label: string; icon: string; detail: string; bad: boolean; impact: string; remaining: string }
export type EventGroup = 'current' | 'ongoing' | 'history'

export function currentEventEntries(events: EventLogView[]): EventEntry[] {
  return events.map((event, index) => ({ key: `current-${event.eventId}-${event.year}-${index}`, label: event.title, icon: event.icon, detail: event.body, bad: !event.good, impact: event.effect, remaining: `Năm ${event.year}` }))
}

export function ongoingEventEntries({ effects, timed, traits, events, now }: { effects: ActiveEffectView[]; timed: EffectView[]; traits: TraitView[]; events: EventLogView[]; now: number }): EventEntry[] {
  const entries = [
    ...traits.map(trait => ({
      key: `trait-${trait.id}`, label: trait.label, icon: trait.icon ?? (traitIsBad(trait) ? 'storm' : 'sun'),
      detail: traitDetail(trait), bad: traitIsBad(trait),
      impact: trait.id === 'illness' ? 'Tăng rủi ro · xem chi tiết' : trait.id === 'longevity' ? 'Giảm và giới hạn rủi ro' : trait.id === 'state-aid' ? 'Đã chấp thuận · chưa giải ngân' : 'Trạng thái đặc biệt · xem chi tiết',
      remaining: `${trait.acquiredYear == null ? '' : `Từ năm ${trait.acquiredYear} · `}${trait.id === 'state-aid' ? 'Chưa sử dụng · một lần' : 'Hiệu lực lâu dài'}`,
    })),
    ...effects.map((effect, index) => {
      const event = events.find((item) => item.eventId === effect.eventId || item.title === effect.label)
      const metadata = timed.find(item => item.eventId === effect.eventId || item.title === effect.label)
      const bad = (effect.investmentPct ?? 0) > 0 || effect.cashPerYear < 0
      return { key: `${effect.eventId}-${index}`, label: effect.label, icon: event?.icon ?? (effect.investmentPct ? 'truck' : bad ? 'coinsDown' : 'coinsUp'), detail: metadata?.body ?? event?.body ?? effect.label, bad: metadata?.good == null ? bad : !metadata.good, impact: metadata?.summary || [effect.investmentPct ? `Giá đầu tư ${effect.investmentPct > 0 ? '+' : ''}${effect.investmentPct}%` : '', effect.cashPerYear ? `${effect.cashPerYear > 0 ? '+' : ''}${money(effect.cashPerYear)}/năm` : ''].filter(Boolean).join(' · '), remaining: `Còn ${effect.yearsLeft} năm` }
    }),
    ...timed.filter((item) => item.economic !== false && ((item.yearsLeft ?? 0) > 0 || (now > 0 && item.endsAt > now)) && !effects.some((effect) => effect.label === item.title || effect.eventId === (item.eventId ?? item.id)) && !traits.some(trait => trait.eventId && (trait.eventId === item.eventId || events.some(event => event.eventId === trait.eventId && event.title === item.title)))).map((item) => {
      const event = events.find(event => event.eventId === item.eventId || event.title === item.title)
      const years = item.yearsLeft ?? 0
      return { key: item.id, label: item.title, icon: item.icon ?? event?.icon ?? item.visual, detail: item.body, bad: item.good == null ? (event ? !event.good : false) : !item.good, impact: item.summary || event?.effect || item.body, remaining: years > 0 ? (item.deferred ? `Áp dụng từ năm kế tiếp · kéo dài ${years} năm` : `Còn ${years} năm`) : 'Đang có hiệu lực' }
    }),
  ]
  return entries
}

