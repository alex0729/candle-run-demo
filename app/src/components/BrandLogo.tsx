// 캔들런 브랜드 아이덴티티 — 상승하는 캔들 "런"을 형상화한 동적 로고
// 한국식 색상(상승 빨강 / 하락 파랑) + 골드 스파크

interface MarkProps { size?: number; className?: string }

// 캔들 6개가 계단식으로 상승하는 아이콘. 골드 스파크가 정상을 향해 달림.
export function BrandMark({ size = 30, className }: MarkProps) {
  // [x, bodyTop, bodyH, wickTop, wickH, up]
  const candles = [
    { x: 6, bt: 30, bh: 8, wt: 26, wh: 16, up: false },
    { x: 14, bt: 24, bh: 10, wt: 20, wh: 18, up: true },
    { x: 22, bt: 26, bh: 7, wt: 22, wh: 15, up: false },
    { x: 30, bt: 16, bh: 12, wt: 12, wh: 20, up: true },
    { x: 38, bt: 9, bh: 13, wt: 6, wh: 22, up: true },
  ]
  return (
    <svg className={`brand-mark ${className ?? ''}`} width={size} height={size} viewBox="0 0 48 48" fill="none" aria-hidden>
      <defs>
        <linearGradient id="cr-gold" x1="0" y1="0" x2="1" y2="1">
          <stop offset="0" stopColor="#ffd86b" />
          <stop offset="1" stopColor="#e8a300" />
        </linearGradient>
      </defs>
      {candles.map((c, i) => (
        <g key={i} className="cr-candle" style={{ ['--d' as string]: `${i * 0.13}s` }}>
          <rect x={c.x - 0.7} y={c.wt} width={1.4} height={c.wh} rx={0.7} fill={c.up ? 'var(--up)' : 'var(--down)'} opacity={0.85} />
          <rect x={c.x - 3} y={c.bt} width={6} height={c.bh} rx={1.6} fill={c.up ? 'var(--up)' : 'var(--down)'} />
        </g>
      ))}
      <circle className="cr-spark" r={3} fill="url(#cr-gold)" />
    </svg>
  )
}

// 헤더용 소형 로고(마크 + 워드마크)
export function BrandLogoInline() {
  return (
    <span className="brand-inline">
      <BrandMark size={26} />
      <span className="brand-word">캔들<b>런</b></span>
    </span>
  )
}

// 히어로용 대형 애니메이션 로고
export function BrandHero() {
  return (
    <div className="brand-hero">
      <BrandMark size={64} className="brand-mark-lg" />
      <div className="brand-hero-word">캔들<b>런</b></div>
    </div>
  )
}
