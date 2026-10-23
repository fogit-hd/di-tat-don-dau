import type { AuthoredEffect, SeedVisualEvent } from './event-file'

type IndustryEvent = SeedVisualEvent & { id: string }

type Variant = {
  id: string
  title: string
  body: string
  investmentPct: number
  years: number
}

const VARIANTS: Variant[] = [
  {
    id: 'base',
    title: '',
    body: '',
    investmentPct: 0,
    years: 0,
  },
  {
    id: 'input-shortage',
    title: 'Nguồn đầu vào bị siết',
    body: 'Nhà cung cấp báo thiếu nguyên liệu, phụ tùng và vật tư cho {{industry}}. Mỗi lần đầu tư bị đội giá.',
    investmentPct: 15,
    years: 2,
  },
  {
    id: 'local-supplier',
    title: 'Nhà cung cấp trong nước vào chuỗi',
    body: 'Một nhà cung cấp nội địa đạt chuẩn cho {{industry}}. Chi phí đầu tư giảm trong thời gian ký hợp đồng.',
    investmentPct: -12,
    years: 2,
  },
  {
    id: 'port-delay',
    title: 'Cảng và kho bãi ùn tắc',
    body: 'Thiết bị và vật tư của {{industry}} bị chậm thông quan. Giá đầu tư tăng vì chi phí logistics.',
    investmentPct: 8,
    years: 1,
  },
  {
    id: 'green-support',
    title: 'Gói mua sắm xanh được duyệt',
    body: 'Chương trình hỗ trợ thiết bị tiết kiệm năng lượng mở cho {{industry}}. Giá đầu tư được giảm tạm thời.',
    investmentPct: -10,
    years: 2,
  },
  {
    id: 'credit-tightening',
    title: 'Tín dụng thiết bị bị siết',
    body: 'Ngân hàng tăng điều kiện giải ngân cho {{industry}}. Chi phí mỗi quyết định đầu tư tăng.',
    investmentPct: 6,
    years: 1,
  },
  {
    id: 'tech-transfer',
    title: 'Chuyển giao thiết bị theo lô',
    body: 'Đối tác mở chương trình mua chung thiết bị cho {{industry}}. Giá đầu tư giảm nhờ đặt hàng theo lô.',
    investmentPct: -8,
    years: 1,
  },
  {
    id: 'new-standard',
    title: 'Tiêu chuẩn đầu vào mới',
    body: 'Vật tư và thiết bị cho {{industry}} phải đáp ứng chứng nhận mới. Giá đầu tư tăng trong giai đoạn chuyển đổi.',
    investmentPct: 10,
    years: 2,
  },
]

function withInvestment(effect: AuthoredEffect | undefined, variant: Variant): AuthoredEffect | undefined {
  if (variant.id === 'base') return effect
  // Every generated event always has an explicit, player-visible investment impact.
  return {
    ...(effect ?? { years: variant.years }),
    years: Math.max(effect?.years ?? 0, variant.years),
    investmentPct: variant.investmentPct,
  }
}

/**
 * Eight concrete operating contexts per original industry event.
 * 64 industries × 20 authored events × 8 contexts = 10,240 industry-specific events.
 */
export function expandIndustryEvents(industryName: string, events: SeedVisualEvent[]): IndustryEvent[] {
  return events.flatMap((event, index) => {
    const baseId = event.id || `e${index + 1}`
    return VARIANTS.map((variant, variantIndex) => {
      if (variant.id === 'base') return { ...event, id: baseId }
      return {
        ...event,
        id: `${baseId}--${variant.id}`,
        title: `${event.title} · ${variant.title}`,
        body: `${event.body} ${variant.body.replace('{{industry}}', industryName)}`,
        effect: withInvestment(event.effect, variant),
        // A deterministic sort keeps one original event next to its contextual outcomes.
        severity: event.severity,
        good: variant.investmentPct < 0 ? true : event.good,
        icon: event.icon,
        _sort: index * VARIANTS.length + variantIndex,
      }
    })
  }) as IndustryEvent[]
}
