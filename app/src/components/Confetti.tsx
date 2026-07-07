import { useMemo } from 'react'

const COLORS = ['#fb2c36', '#1f6bff', '#f0a500', '#22d396', '#a855f7', '#ff8fab']

// 수익 마무리 시 빵빠레 폭죽 (CSS 파티클, 외부 라이브러리 없음)
export default function Confetti() {
  const pieces = useMemo(() => Array.from({ length: 48 }, (_, i) => ({
    left: Math.random() * 100,
    delay: Math.random() * 0.35,
    dur: 1.7 + Math.random() * 1.5,
    rot: (Math.random() * 720 - 360),
    color: COLORS[i % COLORS.length],
    w: 6 + Math.random() * 6,
    drift: (Math.random() - 0.5) * 160,
  })), [])
  return (
    <div className="confetti" aria-hidden>
      {pieces.map((p, i) => (
        <i key={i} style={{
          left: `${p.left}%`, background: p.color, width: p.w, height: p.w * 0.62,
          animationDelay: `${p.delay}s`, animationDuration: `${p.dur}s`,
          ['--drift' as string]: `${p.drift}px`, ['--rot' as string]: `${p.rot}deg`,
        }} />
      ))}
    </div>
  )
}
