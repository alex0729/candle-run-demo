import { useEffect } from 'react'
import { useStore } from './store/store'
import HomeScreen from './components/screens/HomeScreen'
import PlayScreen from './components/screens/PlayScreen'
import ResultScreen from './components/screens/ResultScreen'
import LeaderboardScreen from './components/screens/LeaderboardScreen'
import SettingsSheet from './components/SettingsSheet'
import AdModal from './components/AdModal'
import { BrandMark } from './components/BrandLogo'
import { fmt } from './util'

export default function App() {
  const s = useStore()
  useEffect(() => { s.init() }, []) // eslint-disable-line

  return (
    <div className="app">
      <header>
        <div style={{ display: 'flex', alignItems: 'center', gap: 9 }}>
          <BrandMark size={26} />
          <div>
            <div className="brand-title">캔들<b>런</b></div>
            <div className="brand-sub">CANDLE RUN</div>
          </div>
        </div>
        <button className="wallet" onClick={s.goLeaderboard} aria-label="랭킹 보기">
          <span className="wallet-coin">₩</span>
          <div className="wallet-meta"><span>페이북겜머니</span><span className="wallet-amt">{fmt(s.wallet)}</span></div>
          <span className="wallet-rank">🏆</span>
        </button>
      </header>

      <main>
        {s.loadError ? (
          <div className="load-error">데이터를 불러오지 못했습니다.<br /><small>{s.loadError}</small><br />
            <button className="btn btn-surface" style={{ marginTop: 16, padding: '0 18px' }} onClick={s.init}>다시 시도</button>
          </div>
        ) : (
          <>
            {s.screen === 'setup' && <HomeScreen />}
            {s.screen === 'play' && <PlayScreen />}
            {s.screen === 'result' && <ResultScreen />}
            {s.screen === 'leaderboard' && <LeaderboardScreen />}
          </>
        )}

        <SettingsSheet />
        <AdModal />

        {s.tipOpen && s.tip && (
          <>
            <div className="sheet-overlay" onClick={s.closeTip} />
            <div className="sheet">
              <div className="sheet-handle" />
              <div className="sheet-head">
                <span className="sheet-title" style={{ fontSize: 19 }}>{s.tip.title}</span>
                <button className="sheet-close" onClick={s.closeTip}>×</button>
              </div>
              <div className="field-label" style={{ marginBottom: 9 }}>핵심 근거</div>
              {s.tip.reasons.map((r, i) => (
                <div key={i} className="tip-item"><span className="ic" style={{ color: 'var(--up)' }}>•</span><p>{r}</p></div>
              ))}
              <div className="tip-guide"><div className="h">판단 가이드</div><p>{s.tip.guide}</p></div>
              <button className="sheet-cta" style={{ background: 'var(--surface2)', color: 'var(--text)', boxShadow: 'none' }} onClick={s.closeTip}>확인</button>
            </div>
          </>
        )}
      </main>

      {s.toast && <div className="toast on">{s.toast}</div>}
    </div>
  )
}
