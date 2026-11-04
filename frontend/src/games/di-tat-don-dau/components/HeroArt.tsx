const STACKS = [
  { x: 88, n: 2 },
  { x: 196, n: 3 },
  { x: 312, n: 4 },
  { x: 428, n: 5 },
  { x: 536, n: 6 },
] as const

function Coin({ x, y }: { x: number; y: number }) {
  return (
    <g transform={`translate(${x} ${y})`}>
      <circle r="12" fill="#e7a93b" stroke="#3b2a22" strokeWidth="1.8" />
      <rect x="-3.3" y="-3.3" width="6.6" height="6.6" fill="#fff8ec" stroke="#3b2a22" strokeWidth="1.3" />
    </g>
  )
}

function Windows({ xs, y, w = 18, h = 14 }: { xs: number[]; y: number; w?: number; h?: number }) {
  return (
    <>
      {xs.map((x) => (
        <rect key={`${x}-${y}`} x={x} y={y} width={w} height={h} rx="2" fill="#3f8f86" />
      ))}
    </>
  )
}

export function HeroArt() {
  return (
    <div className="hero-art">
      <svg className="hero-svg" viewBox="0 0 640 440" role="img" aria-label="Sơ đồ các năm: nhà máy, đồng tiền và đời sau">
        <rect x="16" y="256" width="608" height="168" rx="18" fill="#fff8ec" />
        <g fill="#fff" stroke="#3b2a22" strokeWidth="2.4" strokeLinejoin="round">
          <rect x="28" y="160" width="132" height="16" rx="2" />
          <rect x="36" y="174" width="116" height="78" />
          <polygon points="168,132 197,96 227,132 256,96 286,132 315,96 345,132 374,96 404,132 404,150 168,150" />
          <rect x="168" y="132" width="236" height="120" />
          <rect x="192" y="40" width="46" height="12" rx="2" fill="#c7382c" />
          <rect x="200" y="50" width="30" height="52" />
          <rect x="424" y="132" width="62" height="120" rx="31" />
          <rect x="498" y="156" width="54" height="96" rx="27" />
          <rect x="404" y="186" width="24" height="12" />
        </g>
        <g stroke="#3b2a22" strokeWidth="2" fill="none">
          <path d="M430 176h50M430 204h50M430 232h50M504 188h42M504 214h42" />
        </g>
        <Windows xs={[52, 82, 112]} y={188} w={16} h={14} />
        <Windows xs={[52, 82]} y={214} w={16} h={14} />
        <Windows xs={[184, 214, 244, 304, 334, 364]} y={152} />
        <Windows xs={[184, 214, 364]} y={186} />
        <rect x="268" y="196" width="40" height="56" fill="#c7382c" stroke="#3b2a22" strokeWidth="2.4" />
        <circle cx="298" cy="226" r="2.4" fill="#fff8ec" />
        <g className="smoke-puff" fill="#cbb8a6">
          <circle cx="215" cy="34" r="8" />
        </g>
        <g className="smoke-puff d2" fill="#cbb8a6">
          <circle cx="224" cy="30" r="6" />
        </g>
        <g className="smoke-puff d3" fill="#cbb8a6">
          <circle cx="206" cy="28" r="5" />
        </g>
        <g fill="#fff" stroke="#3b2a22" strokeWidth="2">
          <rect x="58" y="228" width="78" height="18" rx="3" />
          <circle cx="76" cy="248" r="7" />
          <circle cx="116" cy="248" r="7" />
        </g>
        <line x1="48" y1="362" x2="592" y2="362" stroke="#3b2a22" strokeWidth="3" strokeLinecap="round" />
        {STACKS.map((stack) => (
          <g key={stack.x}>
            {Array.from({ length: stack.n }, (_, index) => (
              <Coin key={`${stack.x}-${index}`} x={stack.x} y={350 - index * 14} />
            ))}
          </g>
        ))}
        <g className="year-pip">
          <circle cx="88" cy="362" r="9" fill="#c7382c" stroke="#3b2a22" strokeWidth="2" />
          <circle cx="88" cy="362" r="3.2" fill="#fff8ec" />
        </g>
        <text x="88" y="412" textAnchor="middle" fontFamily="Be Vietnam Pro, sans-serif" fontSize="22" fontWeight="800" fill="#3b2a22">
          Năm 1
        </text>
        <text x="536" y="412" textAnchor="middle" fontFamily="Be Vietnam Pro, sans-serif" fontSize="22" fontWeight="800" fill="#3b2a22">
          Đời sau
        </text>
      </svg>
    </div>
  )
}
