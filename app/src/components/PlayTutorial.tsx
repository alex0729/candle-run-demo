import { useState } from 'react'
import Mascot, { Mood } from './Mascot'

// 초보자 튜토리얼 — 캔들이가 안내(짧고 크게, 행동 중심)
const STEPS: { pos: 'top' | 'mid' | 'bottom'; mood: Mood; title: string; body: string }[] = [
  { pos: 'top', mood: 'cheer', title: '신호부터 보자', body: '+ 면 오를 신호, − 면 내릴 신호!' },
  { pos: 'mid', mood: 'think', title: '차트만 보고!', body: '미래 봉은 가려져 있어. 흐름으로 골라봐.' },
  { pos: 'bottom', mood: 'idle', title: '진입 → 보유 → 청산', body: '오를 것 같으면 매수! 보다가 청산하면 끝 🔥' },
]

export default function PlayTutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <div className="tut-overlay" onClick={() => (last ? onDone() : setI(i + 1))}>
      <div className={`tut-bubble ${step.pos}`} onClick={(e) => e.stopPropagation()}>
        <div className="tut-head">
          <Mascot mood={step.mood} size={44} />
          <div className="tut-kicker">캔들이 가이드 {i + 1}/{STEPS.length}</div>
        </div>
        <div className="tut-title">{step.title}</div>
        <p className="tut-body">{step.body}</p>
        <div className="tut-actions">
          <button className="tut-skip" onClick={onDone}>건너뛰기</button>
          <button className="tut-next" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? '해볼래! ▶' : '다음'}</button>
        </div>
        <div className="tut-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      </div>
    </div>
  )
}
