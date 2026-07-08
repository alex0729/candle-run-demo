import type { ReactNode } from 'react'
import Mascot, { Mood } from './Mascot'

// 캔들이의 말풍선 — 아바타 + (태그) + 짧은 한마디
export default function SpeechBubble({
  mood = 'idle', name = '캔들이', title, text, size = 40, tone = 'light', className = '',
}: {
  mood?: Mood; name?: string; title?: string; text: ReactNode; size?: number
  tone?: 'light' | 'dark'; className?: string
}) {
  return (
    <div className={`mascot-row ${className}`}>
      <Mascot mood={mood} size={size} />
      <div className={`mascot-bubble ${tone}`}>
        <span className="mascot-name">{name}{title && <b className="mascot-tag">{title}</b>}</span>
        <p className="mascot-text">{text}</p>
      </div>
    </div>
  )
}
