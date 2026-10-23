import { iconKind, type IconKind } from './icon-kind.ts'

export function EventIcon({ name }: { name: string }) {
  const kind = iconKind(name || 'spark')
  return (
    <svg className={`ev-icon kind-${kind}`} viewBox="0 0 32 32" aria-hidden="true">
      {shape(kind)}
    </svg>
  )
}

function shape(kind: IconKind) {
  switch (kind) {
    case 'rain':
      return (
        <>
          <path d="M6 14h16a6 6 0 0 0 0-12 8 8 0 0 0-15 2A5 5 0 0 0 6 14z" />
          <path className="drop d1" d="M8 18v6" />
          <path className="drop d2" d="M14 17v8" />
          <path className="drop d3" d="M20 18v5" />
        </>
      )
    case 'storm':
      return (
        <>
          <path d="M5 16h17a6 6 0 0 0 0-12 8 8 0 0 0-15 2 5 5 0 0 0-2 10z" />
          <path className="bolt" d="M16 14l-4 7h4l-2 7 8-9h-4l3-5z" />
        </>
      )
    case 'sun':
      return (
        <>
          <circle className="spin" cx="16" cy="16" r="6" />
          <path className="spin" d="M16 2v4M16 26v4M2 16h4M26 16h4M6 6l3 3M23 23l3 3M26 6l-3 3M9 23l-3 3" />
        </>
      )
    case 'fire':
      return <path className="flicker" d="M16 3s6 6 6 12a6 6 0 0 1-12 0c0-2 2-3 2-6 2 2 4 2 4 2s0-4 0-8z" />
    case 'coinsUp':
      return (
        <>
          <ellipse cx="12" cy="22" rx="7" ry="3" />
          <ellipse className="coin" cx="12" cy="18" rx="7" ry="3" />
          <path className="rise" d="M22 20V8M18 12l4-4 4 4" />
        </>
      )
    case 'coinsDown':
      return (
        <>
          <ellipse cx="12" cy="10" rx="7" ry="3" />
          <ellipse className="coin" cx="12" cy="14" rx="7" ry="3" />
          <path className="fall" d="M22 8v12M18 16l4 4 4-4" />
        </>
      )
    case 'truck':
      return (
        <g className="drive">
          <path d="M2 20V12h12v8H2zM14 20v-5h6l4 5h-10z" />
          <circle cx="8" cy="22" r="2" />
          <circle cx="20" cy="22" r="2" />
        </g>
      )
    case 'plane':
      return <path className="drive" d="M2 18l20-6-6 4 4 6-4-2-4 3-2-5z" />
    case 'ship':
      return (
        <g className="bob">
          <path d="M6 16l2 8h16l2-8H6z" />
          <path d="M14 16V6h2l6 10" />
        </g>
      )
    case 'factory':
      return (
        <>
          <path d="M4 26V14l6 4V14l6 4V10h8v16H4z" />
          <path className="blink" d="M18 16h2M22 16h2M18 20h2M22 20h2" />
        </>
      )
    case 'bolt':
      return <path className="flicker" d="M18 2L6 18h8l-2 12 14-18h-8l2-10z" />
    case 'people':
      return (
        <g className="bob">
          <circle cx="11" cy="8" r="3" />
          <path d="M5 24c1-5 3-7 6-7s5 2 6 7" />
          <circle cx="21" cy="10" r="2.4" />
          <path d="M17 24c.6-3.5 2.2-5 4-5s3.2 1.5 4 5" />
        </g>
      )
    case 'leaf':
      return <path className="sway" d="M6 26C6 12 16 4 28 4 26 20 16 28 6 26zM8 24C14 16 20 12 26 8" />
    case 'bug':
      return (
        <g className="flicker">
          <ellipse cx="16" cy="18" rx="6" ry="7" />
          <circle cx="16" cy="8" r="3" />
          <path d="M10 14L4 10M22 14l6-4M10 20l-6 4M22 20l6 4" />
        </g>
      )
    case 'shield':
      return <path className="pulse" d="M16 3l10 4v8c0 7-4 11-10 14C10 26 6 22 6 15V7l10-4z" />
    case 'alert':
      return (
        <g className="shake">
          <path d="M16 4l12 22H4L16 4z" />
          <path d="M16 12v7M16 22v1" />
        </g>
      )
    case 'gavel':
      return <path className="knock" d="M6 14l8-8 4 4-8 8zM14 18l8 8M20 26H8" />
    case 'chart':
      return (
        <>
          <path d="M4 26h24" />
          <path className="rise" d="M6 20h4v6H6zM14 14h4v12h-4zM22 8h4v18h-4z" />
        </>
      )
    case 'chip':
      return (
        <g className="pulse">
          <rect x="8" y="8" width="16" height="16" rx="2" />
          <path d="M12 4v4M20 4v4M12 24v4M20 24v4M4 12h4M4 20h4M24 12h4M24 20h4" />
        </g>
      )
    case 'flask':
      return (
        <>
          <path d="M13 4h6M14 4v8L7 26h18L18 12V4" />
          <circle className="bubble d1" cx="13" cy="20" r="1.2" />
          <circle className="bubble d2" cx="18" cy="18" r="1" />
        </>
      )
    case 'heart':
      return <path className="pulse" d="M16 27S4 18 4 11a6 6 0 0 1 12-2 6 6 0 0 1 12 2c0 7-12 16-12 16z" />
    case 'school':
      return (
        <g className="bob">
          <path d="M2 14l14-8 14 8-14 8-14-8z" />
          <path d="M8 16v6c4 3 12 3 16 0v-6" />
        </g>
      )
    case 'box':
      return (
        <g className="bob">
          <path d="M4 10l12-6 12 6-12 6-12-6zM4 10v12l12 6 12-6V10M16 16v12" />
        </g>
      )
    case 'wheat':
      return <path className="sway" d="M16 28V8M16 12c-4-1-6-4-6-4s1 5 6 5M16 16c4-1 6-4 6-4s-1 5-6 5M16 20c-4-1-6-4-6-4s1 5 6 5" />
    case 'snow':
      return (
        <>
          <path className="spin" d="M16 4v24M6 10l20 12M26 10L6 22" />
          <path className="drop d1" d="M6 6v3M24 22v3" />
        </>
      )
    case 'lock':
      return (
        <>
          <rect x="8" y="14" width="16" height="12" rx="2" />
          <path className="shake" d="M11 14V10a5 5 0 0 1 10 0v4" />
        </>
      )
    case 'megaphone':
      return <path className="pulse" d="M6 14h6l12-6v16L12 18H8l-2 6H4v-6a4 4 0 0 1 2-4z" />
    case 'clock':
      return (
        <>
          <circle cx="16" cy="16" r="11" />
          <path className="spin" d="M16 8v8l5 3" />
        </>
      )
    case 'wrench':
      return <path className="knock" d="M14 18l-8 8 4 2 8-8 6 2 4-4-6-2-2-6-4 4 2 6z" />
    case 'globe':
      return (
        <g className="spin">
          <circle cx="16" cy="16" r="11" />
          <path d="M5 16h22M16 5c4 4 4 18 0 22M16 5c-4 4-4 18 0 22" />
        </g>
      )
    case 'home':
      return (
        <>
          <path d="M4 16L16 6l12 10v12H4V16z" />
          <path className="blink" d="M13 28v-7h6v7" />
        </>
      )
    case 'water':
      return <path className="wave" d="M2 18c3 2 5 2 8 0s5-2 8 0 5 2 8 0 5-2 6 0v8H2v-8z" />
    default:
      return (
        <g className="pulse">
          <path d="M16 3l2 7h7l-5.5 4.5L22 22l-6-4-6 4 2.5-7.5L7 10h7z" />
        </g>
      )
  }
}
