import { useEffect, useState } from 'react'
import { useStore } from '../store/store'
import { DAILY_FREE_PLAYS, cyclePhase } from '../game/constants'
import Mascot from './Mascot'

// 결과 도달 시 자동으로 뜨는 '한 판 더?' 팝업 (예/아니오/닫기). 매 결과마다 노출.
export default function PlayMorePrompt() {
  const s = useStore()
  const [open, setOpen] = useState(false)

  // 새 결과가 뜰 때마다(=게임 바뀔 때) 잠깐 뒤 자동 노출
  const key = s.game?.scenario.id
  useEffect(() => {
    setOpen(false)
    if (cyclePhase() === 'settlement') return // 결산 시간엔 권유 안 함
    const t = setTimeout(() => setOpen(true), 900)
    return () => clearTimeout(t)
  }, [key])

  if (!open) return null
  const free = s.dailyDoneCount < DAILY_FREE_PLAYS
  const yes = () => { setOpen(false); void s.startDaily() } // 무료면 다음 판, 소진 시 광고
  const no = () => { setOpen(false); s.goHome() }

  return (
    <div className="more-overlay" onClick={() => setOpen(false)}>
      <div className="more-card" onClick={(e) => e.stopPropagation()}>
        <button className="more-x" onClick={() => setOpen(false)} aria-label="닫기">×</button>
        <Mascot mood="cheer" size={64} />
        <div className="more-title">{free ? '한 판 더 할래?' : '광고 보고 한 판 더?'}</div>
        <div className="more-desc">
          {free
            ? <>오늘 무료 {DAILY_FREE_PLAYS}판 중 이어서 도전!<br />겜머니는 계속 쌓여 🔥</>
            : <>무료 2판을 다 썼어 🎬<br />짧은 광고 보고 한 판 더 이어가자!</>}
        </div>
        <div className="more-actions">
          <button className="btn btn-surface g1" onClick={no}>아니오</button>
          <button className="btn btn-red grow14" onClick={yes} disabled={s.loadingRound}>
            {s.loadingRound ? '불러오는 중…' : (free ? '좋아, 한 판 더 ▶' : '🎬 광고 보고 이어하기')}
          </button>
        </div>
        <div className="more-note">닫으면 이 결과 화면에 머물러요</div>
      </div>
    </div>
  )
}
