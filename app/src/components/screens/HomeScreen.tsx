import { useMemo, useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { loadManifest } from '../../game/scenarios'
import { DAILY_FREE_PLAYS } from '../../game/constants'
import type { Manifest } from '../../game/types'
import MidnightTimer from '../MidnightTimer'

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

  const remaining = Math.max(0, DAILY_FREE_PLAYS - s.dailyDoneCount)
  const dailyDone = remaining === 0

  return (
    <div className="screen">
      <div className="scroll" style={{ paddingBottom: 8 }}>
        <div style={{ padding: '4px 0 16px' }}>
          <span className="eyebrow"><span className="dot" />DAILY CANDLE</span>
          <h1 className="hero-title">오늘의 차트<br /><span className="hl">한 판</span>으로 감 잡기</h1>
          {s.streak > 0 && <div className="streak-chip">🔥 {s.streak}일 연속 출석</div>}
        </div>

        {/* 오늘의 종목 카드 */}
        <div className="card daily-card">
          <div className="daily-head">
            <span className="daily-t">오늘의 종목</span>
            <span className="daily-badge">하루 {DAILY_FREE_PLAYS}판 무료</span>
          </div>
          {!dailyDone ? (
            <>
              <div className="daily-count"><b>{s.dailyDoneCount}</b> / {DAILY_FREE_PLAYS} 판</div>
              <div className="daily-timer"><MidnightTimer /></div>
              <button className="btn btn-red daily-cta" onClick={s.startDaily} disabled={s.loadingRound}>
                {s.loadingRound ? '불러오는 중…' : '오늘의 종목 시작 ▶'}
              </button>
            </>
          ) : (
            <>
              <div className="daily-done">오늘 완료 🎉 내일 또 만나요</div>
              <div className="daily-timer"><MidnightTimer prefix="다음 종목까지 " /></div>
              <button className="btn btn-surface daily-cta" onClick={s.goLeaderboard}>🏆 오늘 내 랭킹 보기</button>
            </>
          )}
        </div>

        <div className="mini-chart">
          {bars.map((b, i) => (
            <div key={i} className="mini-bar" style={{ height: `${b.h}%`, background: b.up ? 'var(--up)' : 'var(--down)', opacity: .9 }} />
          ))}
        </div>

        {m && <div className="home-meta">실전 시나리오 {m.count}개 · KOSPI·KOSDAQ · 종목 블라인드</div>}
      </div>

      <div className="actionbar">
        <div className="row">
          {dailyDone
            ? <button className="btn btn-surface g1" onClick={s.startPractice} disabled={s.loadingRound}>연습 한 판 <i className="mini-tag">랭킹 X</i></button>
            : <button className="btn btn-surface g1" onClick={s.openSettings}>직접 설정</button>}
          <button className="btn btn-surface g1" onClick={s.goLeaderboard}>🏆 랭킹</button>
        </div>
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
