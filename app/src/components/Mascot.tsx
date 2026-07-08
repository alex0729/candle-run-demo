// 캔들이 — 캔들(촛불) 의인화 AI 비서 마스코트 (이모지 기반, 외부 에셋 없음)
export type Mood = 'idle' | 'cheer' | 'think' | 'warn' | 'celebrate'

const MOOD: Record<Mood, { badge: string; ring: string }> = {
  idle: { badge: '✨', ring: 'var(--gold)' },
  cheer: { badge: '😊', ring: 'var(--up)' },
  think: { badge: '🤔', ring: 'var(--ma60)' },
  warn: { badge: '😮', ring: 'var(--down)' },
  celebrate: { badge: '🎉', ring: 'var(--gold)' },
}

export default function Mascot({ mood = 'idle', size = 40 }: { mood?: Mood; size?: number }) {
  const m = MOOD[mood]
  return (
    <div className="mascot" style={{ width: size, height: size, ['--ring' as string]: m.ring }} aria-hidden>
      <span className="mascot-face" style={{ fontSize: Math.round(size * 0.52) }}>🕯️</span>
      <span className="mascot-badge" style={{ fontSize: Math.round(size * 0.36) }}>{m.badge}</span>
    </div>
  )
}
