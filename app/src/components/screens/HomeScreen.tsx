import { useMemo, useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { loadManifest } from '../../game/scenarios'
import { getDailyRanking, rankOf } from '../../game/ranking'
import { DAILY_FREE_PLAYS, cycleKey, cyclePhase } from '../../game/constants'
import type { Manifest } from '../../game/types'
import CycleTimer from '../CycleTimer'
import SpeechBubble from '../SpeechBubble'
import { fmt } from '../../util'

function genPreview() {
  let p = 100
  const ups: boolean[] = []
  const vals: number[] = []
  let v = 100, lo = 999, hi = -999
  for (let i = 0; i < 22; i++) { const ch = (Math.random() - 0.42) * 9; ups.push(p + ch >= p); p += ch }
  for (let i = 0; i < 22; i++) { v += (ups[i] ? 1 : -1) * (4 + Math.random() * 7); vals.push(v); lo = Math.min(lo, v); hi = Math.max(hi, v) }
  return ups.map((u, i) => ({ up: u, h: 26 + ((vals[i] - lo) / (hi - lo || 1)) * 74 }))
}

export default function HomeScreen() {
  const s = useStore()
  const bars = useMemo(genPreview, [])
  const [m, setM] = useState<Manifest | null>(null)
  useEffect(() => { loadManifest().then(setM).catch(() => {}) }, [])

  const free = s.dailyDoneCount < DAILY_FREE_PLAYS
  const settling = cyclePhase() === 'settlement'
  const played = s.dailyDoneCount > 0
  const rank = played ? rankOf(getDailyRanking(cycleKey()), s.wallet) : 0

  return (
    <div className="screen">
      <button className="home-gear" onClick={s.openSettings} aria-label="게임 설정">⚙</button>
      <div className="scroll" style={{ paddingBottom: 8 }}>
        <div style={{ padding: '4px 0 16px' }}>
          <span className="eyebrow"><span className="dot" />DAILY CANDLE · 새벽 6시 결산</span>
          <h1 className="hero-title">오늘의 차트<br /><span className="hl">한 판</span>으로 감 잡기</h1>
          {s.streak > 0 && <div className="streak-chip">🔥 {s.streak}일 연속 출석</div>}
        </div>

        <SpeechBubble className="home-greet" mood={settling ? 'idle' : played ? 'cheer' : 'idle'}
          text={settling
            ? '지금은 결산 중! 곧 새 라운드가 열려 🕯️'
            : played
              ? <>지금 <b>{rank}위</b>! 한 판 더 하면 순위가 바뀔지도 👀</>
              : <>오늘도 <b>100만원</b>으로 시작! 상위 3등은 페이북머니 받아 🔥</>} />


        <div className="card daily-card">
          <div className="daily-head">
            <span className="daily-t">오늘의 승부</span>
            <span className="daily-badge">TOP 3 페이북머니</span>
          </div>

          <div className="daily-score">
            <span className="ds-lbl">현재 페이북겜머니</span>
            <span className="ds-amt">₩{fmt(s.wallet)}</span>
            {played && <button className="ds-rank tap" onClick={s.goLeaderboard}>오늘 {rank}위 ›</button>}
          </div>

          {settling ? (
            <>
              <div className="daily-done">🏁 결산 중 · 입상자 발표</div>
              <div className="daily-timer"><CycleTimer /></div>
              <button className="btn btn-dark daily-cta" disabled>결산 시간 · 곧 개장해요</button>
            </>
          ) : free ? (
            <>
              <div className="daily-count"><b>{s.dailyDoneCount}</b> / {DAILY_FREE_PLAYS} 판</div>
              <div className="daily-timer"><CycleTimer /></div>
              <button className="btn btn-red daily-cta" onClick={s.startDaily} disabled={s.loadingRound}>
                {s.loadingRound ? '불러오는 중…' : '오늘의 종목 시작 ▶'}
              </button>
            </>
          ) : (
            <>
              <div className="daily-done">무료 2판 완료 🎉 · 광고로 이어가기</div>
              <div className="daily-timer"><CycleTimer /></div>
              <button className="btn btn-dark daily-cta" onClick={s.startDaily} disabled={s.loadingRound}>
                {s.loadingRound ? '불러오는 중…' : '🎬 광고 보고 한 판 더'}
              </button>
            </>
          )}

          <div className="daily-prize">🥇 3만 · 🥈 2만 · 🥉 1만원 · 매일 100만원으로 시작</div>
        </div>

        <div className="mini-chart">
          {bars.map((b, i) => (
            <div key={i} className="mini-bar" style={{ height: `${b.h}%`, background: b.up ? 'var(--up)' : 'var(--down)', opacity: .9 }} />
          ))}
        </div>

        {m && <div className="home-meta">일반 단일종목 {m.by_source?.real ?? ''} · 블라인드 · ETF/ETN 제외</div>}
        <button className="home-rank-link" onClick={s.goLeaderboard}>🏆 오늘의 랭킹 보기 ›</button>
      </div>

      <div className="actionbar">
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
