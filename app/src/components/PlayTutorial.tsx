import { useState } from 'react'

// 초보자 튜토리얼 — 말풍선 코치마크(상단/중단/하단 순차 안내)
const STEPS = [
  { pos: 'top', title: 'SIGNAL 읽기', body: '여러 지표를 종합한 신호예요. + 면 상승 우위, − 면 하락 주의랍니다.' },
  { pos: 'mid', title: '차트만 보고 판단', body: '미래 봉은 가려져 있어요. 지금까지의 흐름과 지표로만 판단해요.' },
  { pos: 'bottom', title: '매수 · 공매도 · 다음턴', body: '오를 것 같으면 매수, 내릴 것 같으면 공매도, 애매하면 다음턴으로 넘겨요!' },
] as const

export default function PlayTutorial({ onDone }: { onDone: () => void }) {
  const [i, setI] = useState(0)
  const step = STEPS[i]
  const last = i === STEPS.length - 1
  return (
    <div className="tut-overlay" onClick={() => (last ? onDone() : setI(i + 1))}>
      <div className={`tut-bubble ${step.pos}`} onClick={(e) => e.stopPropagation()}>
        <div className="tut-kicker">초보자 가이드 {i + 1}/{STEPS.length}</div>
        <div className="tut-title">{step.title}</div>
        <p className="tut-body">{step.body}</p>
        <div className="tut-actions">
          <button className="tut-skip" onClick={onDone}>건너뛰기</button>
          <button className="tut-next" onClick={() => (last ? onDone() : setI(i + 1))}>{last ? '시작하기 ▶' : '다음'}</button>
        </div>
        <div className="tut-dots">{STEPS.map((_, k) => <i key={k} className={k === i ? 'on' : ''} />)}</div>
      </div>
    </div>
  )
}
