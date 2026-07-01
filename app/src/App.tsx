import { useEffect } from 'react'
import { useStore } from './store/store'
import SetupScreen from './components/screens/SetupScreen'
import PlayScreen from './components/screens/PlayScreen'
import ResultScreen from './components/screens/ResultScreen'
import { BrandLogoInline } from './components/BrandLogo'
import { fmt } from './util'

export default function App() {
  const s = useStore()
  useEffect(() => { s.init() }, []) // eslint-disable-line

  return (
    <div className="app">
      <header>
        <BrandLogoInline />
        <div className="wallet"><span className="coin">₩</span>페이북머니 <b>{fmt(s.wallet)}</b></div>
      </header>

      <main>
        {s.loadError && (
          <div className="load-error">데이터를 불러오지 못했습니다.<br /><small>{s.loadError}</small><br />
            <button className="ghost-cta" onClick={s.init}>다시 시도</button>
          </div>
        )}
        {!s.loadError && s.screen === 'setup' && <SetupScreen />}
        {!s.loadError && s.screen === 'play' && <PlayScreen />}
        {!s.loadError && s.screen === 'result' && <ResultScreen />}
      </main>

      {s.toast && <div className="toast on">{s.toast}</div>}

      {s.tipOpen && s.tip && (
        <>
          <div className="sheet-overlay on" onClick={s.closeTip} />
          <div className="bottom-sheet on">
            <div className="sheet-handle" />
            <div className="sheet-head">
              <div><span className="sheet-kicker">CANDLE TIP</span><h3>{s.tip.title}</h3></div>
              <button className="sheet-close" onClick={s.closeTip}>×</button>
            </div>
            <div className="tip-section"><h4>핵심 근거</h4><ul>{s.tip.reasons.map((r, i) => <li key={i}>{r}</li>)}</ul></div>
            <div className="tip-section"><h4>판단 가이드</h4><p>{s.tip.guide}</p></div>
            <p className="disclaimer">과거 데이터 기반 학습용 해석이며 특정 종목의 매수·매도 추천이 아닙니다.</p>
            <button className="primary-cta" onClick={s.closeTip}>확인</button>
          </div>
        </>
      )}
    </div>
  )
}
