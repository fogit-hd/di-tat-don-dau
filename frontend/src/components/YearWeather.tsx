import type { Anchors, EffectView } from '../api/types.ts'

const W = 1600
const H = 900

export function YearWeather({
  effects,
  anchors,
  onInspect,
}: {
  effects: EffectView[]
  anchors: Anchors | null
  onInspect: (card: { title: string; body: string }) => void
}) {
  const live = effects.filter((effect) => effect.visual)
  const calm = live.length === 0
  const band = skyBand(anchors)
  const flooded = live.some((effect) => effect.visual === 'flood')
  const shake = live.some((effect) => effect.visual === 'none')
  return (
    <g id="year-weather" className={shake ? 'year-shake' : undefined}>
      {calm && <IdleSky band={band} />}
      {anchors && anchors.smoke.length > 0 && !live.some((effect) => effect.visual === 'power_outage') && (
        <SmokePuffs points={anchors.smoke} />
      )}
      {anchors?.road && !flooded && <RoadTruck road={anchors.road} />}
      {live.map((effect) => (
        <g key={effect.id} opacity={0.45 + (effect.severity ?? 2) * 0.15}>
          <EffectArt code={effect.visual} severity={effect.severity ?? 2} anchors={anchors} band={band} />
          <rect
            x={0}
            y={coversScene(effect.visual, band.full) ? 0 : band.y}
            width={W}
            height={coversScene(effect.visual, band.full) || effect.visual === 'flood' ? H : band.h}
            fill="transparent"
            style={{ cursor: 'pointer' }}
            onClick={() => onInspect({ title: effect.title, body: effect.body || effect.title })}
          >
            <title>{effect.title}</title>
          </rect>
          {effect.visual === 'none' && (
            <g className="none-mark" transform="translate(1480 80)">
              <circle r="22" fill="#fff8ec" stroke="#4a3328" strokeWidth="3" />
              <circle r="6" fill="#e7a93b" />
            </g>
          )}
        </g>
      ))}
    </g>
  )
}

function coversScene(code: string, fullSky: boolean) {
  return fullSky || ['flood', 'none', 'power_outage', 'epidemic', 'earthquake', 'cyber', 'scandal', 'market_crash'].includes(code)
}

function skyBand(anchors: Anchors | null) {
  if (!anchors || anchors.skyBottom < 10) return { y: 0, h: H, full: true }
  return { y: 0, h: py(anchors.skyBottom), full: false }
}

function px(percent: number) {
  return (percent / 100) * W
}

function py(percent: number) {
  return (percent / 100) * H
}

function IdleSky({ band }: { band: { h: number } }) {
  const y = Math.max(36, Math.min(140, band.h * 0.45))
  return (
    <g className="idle-sky" opacity="0.55">
      <ellipse className="idle-cloud" cx="280" cy={y} rx="90" ry="22" fill="#fff" />
      <ellipse className="idle-cloud delay" cx="980" cy={Math.max(28, y - 24)} rx="120" ry="26" fill="#fff" />
    </g>
  )
}

function SmokePuffs({ points }: { points: { x: number; y: number }[] }) {
  return (
    <g>
      {points.map((point, index) => (
        <g key={`${point.x}-${point.y}-${index}`} className="smoke" transform={`translate(${px(point.x)} ${py(point.y)})`}>
          <circle cx="0" cy="8" r="10" fill="#efe6d8" />
          <circle cx="14" cy="-6" r="13" fill="#f6efe4" />
        </g>
      ))}
    </g>
  )
}

function RoadTruck({ road }: { road: [number, number, number, number] }) {
  const [x1, y1, x2, y2] = road
  const flip = x2 < x1 ? -1 : 1
  return (
    <g className="road-truck" style={{ offsetPath: `path("M ${px(x1)} ${py(y1)} L ${px(x2)} ${py(y2)}")` }}>
      <g transform={`scale(${flip} 1) translate(-39 -28)`}>
        <rect width="78" height="26" rx="4" fill="#e7a93b" stroke="#4a3328" strokeWidth="3" />
        <circle cx="18" cy="30" r="7" fill="#3b2a22" />
        <circle cx="62" cy="30" r="7" fill="#3b2a22" />
      </g>
    </g>
  )
}

function EffectArt({
  code,
  severity,
  anchors,
  band,
}: {
  code: string
  severity: number
  anchors: Anchors | null
  band: { y: number; h: number; full: boolean }
}) {
  const wash = 0.18 + severity * 0.12
  if (code === 'storm' || code === 'rain') {
    const lines = Math.max(6, Math.round(band.h / 48))
    return (
      <g className="rain">
        <rect width={W} height={band.h} fill="#4d4450" opacity={code === 'storm' ? 0.28 : 0.08} />
        {Array.from({ length: lines }, (_, i) => (
          <line
            key={i}
            x1={40 + (i % 18) * 90}
            y1={8}
            x2={20 + (i % 18) * 90}
            y2={Math.max(24, band.h - 8)}
            stroke="#d7e4ef"
            strokeWidth={code === 'storm' ? 4 : 2}
          />
        ))}
      </g>
    )
  }
  if (code === 'flood') {
    const y = anchors ? py(anchors.ground) : 700
    return <rect y={y} width={W} height={Math.max(0, H - y)} fill="#6aa7c8" opacity={0.45 + severity * 0.1} />
  }
  if (code === 'drought') return <rect width={W} height={band.h} fill="#e2b15a" opacity={wash} />
  if (code === 'heatwave') return <rect width={W} height={band.h} fill="#e8503f" opacity={wash} className="heat" />
  if (code === 'fog') return <rect width={W} height={band.h} fill="#f4f1ea" opacity={0.35 + severity * 0.12} />
  if (code === 'pollution') return <rect width={W} height={band.h} fill="#8d7b62" opacity={0.25 + severity * 0.12} />
  if (code === 'fire') {
    const spot = anchors?.roof[0]
    const cx = spot ? px(spot.x) : 800
    const cy = spot ? py(spot.y) : 620
    return (
      <g className="fire">
        <ellipse cx={cx} cy={cy + 24} rx={80 + severity * 30} ry={40 + severity * 16} fill="#e8503f" opacity="0.85" />
        <ellipse cx={cx} cy={cy} rx={40 + severity * 12} ry="28" fill="#e7a93b" />
      </g>
    )
  }
  if (code === 'power_outage') return <rect width={W} height={H} fill="#1c1418" opacity={0.25 + severity * 0.15} />
  if (code === 'strike') {
    const doors = anchors?.door.length ? anchors.door : [{ x: 40, y: 70 }]
    return (
      <g>
        {doors.map((door, i) => (
          <g key={i} transform={`translate(${px(door.x)} ${py(door.y)})`}>
            <circle cy="-28" r="8" fill="#f2d3b3" stroke="#4a3328" />
            <path d="M-8 -16 H8 L6 8 H-6 Z" fill="#fbf3e4" stroke="#4a3328" />
          </g>
        ))}
      </g>
    )
  }
  if (code === 'expansion') {
    const spot = anchors?.roof[anchors.roof.length - 1]
    const x = spot ? px(spot.x) : 980
    const y = spot ? py(spot.y) : 430
    return <rect x={x} y={y} width="140" height={90 + severity * 16} fill="#efe2cf" stroke="#4a3328" strokeWidth="4" opacity="0.9" />
  }
  if (code === 'boom') {
    return (
      <g fill="#ffe7a8">
        {Array.from({ length: 6 }, (_, i) => (
          <circle key={i} cx={300 + i * 180} cy={Math.min(band.h - 12, 40 + (i % 2) * 28)} r={8 + severity * 3} />
        ))}
      </g>
    )
  }
  if (code === 'epidemic') {
    const spots = anchors?.door.length ? anchors.door : [{ x: 22, y: 62 }, { x: 48, y: 68 }, { x: 74, y: 60 }]
    return (
      <g>
        <rect width={W} height={H} fill="#8fb56a" opacity={0.22 + severity * 0.08} />
        {spots.map((spot, index) => (
          <g key={index} className="mask" transform={`translate(${px(spot.x)} ${py(spot.y)})`}>
            <circle cy="-16" r="9" fill="#f2d3b3" />
            <path d="M-12 -8 H12 Q12 10 0 14 Q-12 10 -12 -8 Z" fill="#d7efe0" stroke="#245c32" strokeWidth="2" />
            <polygon points="18,-28 34,-4 2,-4" fill="none" stroke="#245c32" strokeWidth="3" />
            <circle cx="18" cy="2" r="2" fill="#245c32" />
          </g>
        ))}
      </g>
    )
  }
  if (code === 'earthquake') {
    const ground = anchors ? py(anchors.ground) : 720
    return (
      <g className="crack" stroke="#2a211c" strokeWidth={3 + severity} fill="none" opacity="0.85">
        <polyline points={`180,${ground} 240,${ground - 70} 290,${ground + 10} 360,${ground - 90} 430,${ground}`} />
        <polyline points={`980,${ground - 20} 1040,${ground - 110} 1100,${ground - 30} 1180,${ground - 120} 1260,${ground}`} />
        <polyline points={`640,${ground + 8} 690,${ground - 50} 740,${ground + 16} 800,${ground - 40}`} />
      </g>
    )
  }
  if (code === 'cyber') {
    const windows = anchors?.windows.length
      ? anchors.windows.map((point) => ({ x: px(point.x) - 30, y: py(point.y) - 24, w: 60, h: 48 }))
      : [
          { x: 520, y: 380, w: 80, h: 56 },
          { x: 760, y: 350, w: 80, h: 56 },
          { x: 1040, y: 390, w: 80, h: 56 },
        ]
    return (
      <g>
        {windows.map((box, index) => (
          <g key={index} className="glitch">
            <rect x={box.x} y={box.y} width={box.w} height={box.h} fill="#143028" opacity="0.35" />
            {Array.from({ length: 4 }, (_, line) => (
              <rect key={line} className="scanline" x={box.x} y={box.y + line * (box.h / 4)} width={box.w} height="3" fill="#7dffa8" opacity="0.7" />
            ))}
          </g>
        ))}
      </g>
    )
  }
  if (code === 'scandal') {
    return (
      <g>
        {Array.from({ length: 5 }, (_, index) => (
          <rect key={index} className="cam-flash" x={180 + index * 280} y={120 + (index % 2) * 80} width="90" height="64" fill="#fff" />
        ))}
        <g transform="translate(0 790)">
          <g className="ticker">
            {Array.from({ length: 14 }, (_, index) => (
              <rect key={index} x={index * 70} y="0" width={28 + (index % 3) * 22} height="16" rx="2" fill="#1c1418" />
            ))}
          </g>
        </g>
      </g>
    )
  }
  if (code === 'market_crash') {
    return (
      <g>
        <rect width={W} height={H} fill="#e8503f" opacity={0.16 + severity * 0.06} />
        {Array.from({ length: 8 }, (_, index) => (
          <g key={index} transform={`translate(${140 + index * 180} 0)`}>
            <g className="crash-arrow" style={{ animationDelay: `${index * 0.18}s` }}>
              <polygon points="0,0 22,0 11,28" fill="#e8503f" />
              <rect x="7" y="28" width="8" height="16" fill="#e8503f" />
            </g>
          </g>
        ))}
      </g>
    )
  }
  return null
}
