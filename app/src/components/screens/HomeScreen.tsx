import { useMemo } from 'react'
import { useStore, AD_EVERY } from '../../store/store'
import { loadManifest } from '../../game/scenarios'
import { useEffect, useState } from 'react'
import type { Manifest } from '../../game/types'

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

  const quickStart = () => {
    s.setSettings({ difficulty: 'normal', mode: 50, market: 'ALL', recentOnly: false, ind: { ma: true, rsi: true, macd: true, vol: true, bb: false, ichimoku: false } })
    s.startRound()
  }

  return (
    <div className="screen">
      <div className="scroll" style={{ paddingBottom: 8 }}>
        <div style={{ padding: '4px 0 22px' }}>
          <span className="eyebrow"><span className="dot" />REAL CHART SIMULATION</span>
          <h1 className="hero-title">과거 차트로<br /><span className="hl">매매 타이밍</span> 테스트</h1>
          <p className="hero-sub">100만원으로 시작 · 차트로 판단 · 페이북겜머니 불리기</p>
        </div>

        <div className="mini-chart">
          {bars.map((b, i) => (
            <div key={i} className="mini-bar" style={{ height: `${b.h}%`, background: b.up ? 'var(--up)' : 'var(--down)', opacity: .9 }} />
          ))}
        </div>

        <div className="card rec-card">
          <div className="rec-head">
            <div className="l"><span className="t">추천 설정</span><span className="badge-best">BEST</span></div>
            <span className="r">바로 시작</span>
          </div>
          <div className="rec-row"><span className="rec-num">1</span>기본 지표 4개 · MA·RSI·MACD·거래량</div>
          <div className="rec-row"><span className="rec-num">2</span>50봉 · 종목 블라인드 · 매수·공매도</div>
          <div className="rec-row"><span className="rec-num">3</span>결과에서 판단 근거·복기 제공</div>
          {m && (
            <div className="rec-row" style={{ marginTop: 4 }}><span className="rec-num">✦</span>실전 시나리오 {m.count}개 · KOSPI·KOSDAQ</div>
          )}
        </div>
      </div>

      <div className="actionbar">
        <div className="col">
          <div className="free-hint">{s.adCount >= AD_EVERY ? '다음 시작 시 짧은 광고 ▶' : `무료 플레이 ${AD_EVERY - s.adCount}판 남음 · 3판마다 짧은 광고`}</div>
          <button className="btn btn-red" onClick={quickStart} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '빠른 시작 ▶'}</button>
          <div className="row">
            <button className="btn btn-surface g1" onClick={s.openSettings}>직접 설정</button>
            <button className="btn btn-surface g1" onClick={s.goLeaderboard}>🏆 랭킹</button>
          </div>
        </div>
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
