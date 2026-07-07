import { useEffect, useState } from 'react'
import { useStore } from '../store/store'

const AD_SECONDS = 15 // 10~20초 리워드 광고(프로토)

export default function AdModal() {
  const s = useStore()
  const [left, setLeft] = useState(AD_SECONDS)

  useEffect(() => {
    if (!s.adOpen) return
    setLeft(AD_SECONDS)
    const t = setInterval(() => setLeft((x) => (x <= 1 ? 0 : x - 1)), 1000)
    return () => clearInterval(t)
  }, [s.adOpen])

  if (!s.adOpen) return null
  const done = left <= 0
  const pctW = ((AD_SECONDS - left) / AD_SECONDS) * 100

  return (
    <div className="ad-overlay">
      <div className="ad-card">
        <div className="ad-badge">리워드 광고 · 프로토타입</div>
        <div className="ad-creative">
          <div className="ad-visual">📺</div>
          <div className="ad-title">광고 보고 한 판 더</div>
          <div className="ad-desc">오늘 무료 2판을 다 썼어요<br />짧은 광고 시청 후 본게임 1판 이어하기</div>
          <button className="ad-link" onClick={() => s.showToast('데모: 광고 상세 페이지로 이동')}>광고 보러가기 ↗</button>
        </div>
        <div className="ad-progress"><div className="ad-bar" style={{ width: `${pctW}%` }} /></div>
        <button className="ad-cta" disabled={!done} onClick={s.finishAd}>{done ? '게임 이어하기 ▶' : `${left}초 후 이어하기`}</button>
        <div className="ad-note">광고 수익은 리워드 사업에 사용됩니다 (프로토타입 · 실제 광고 미연동)</div>
      </div>
    </div>
  )
}
