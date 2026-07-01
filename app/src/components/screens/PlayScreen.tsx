import { useStore } from '../../store/store'
import Chart from '../Chart'
import { curPrice, pnlNow, signalAt, SEED_KRW } from '../../game/engine'
import { cls, fmt, fmtPx, pct } from '../../util'

export default function PlayScreen() {
  const s = useStore()
  const g = s.game
  if (!g) return null

  const sig = signalAt(g)
  const used = g.budgetMax - g.budget
  const ratio = g.budgetMax > 0 ? used / g.budgetMax : 0
  const price = curPrice(g)
  const hasPos = !!g.pos
  const r = hasPos ? pnlNow(g) : 0
  const won = SEED_KRW * r
  const pnlCls = r > 0 ? 'gain' : r < 0 ? 'loss' : 'flat'
  const marketCls = g.scenario.market === 'KOSDAQ' ? 'kosdaq' : 'kospi'

  return (
    <div className="screen play">
      <div className="play-top">
        <div className="ticker-row">
          <div className="ticker-left">
            <div className={cls('badge', marketCls)}>{g.scenario.blind_label.replace('종목 ', '')}</div>
            <div>
              <div className="ticker-name">{g.scenario.blind_label}<span className="blind">· 블라인드</span></div>
              <div className="ticker-sub"><span className={cls('mkt', marketCls)}>{g.scenario.market}</span> · {g.scenario.sector} · 일봉</div>
            </div>
          </div>
          <button className="tip-pill" onClick={s.useTip}>Tip <span>{g.tipRemaining}</span></button>
        </div>
        <div className="progress-wrap">
          <div className="progress-meta"><span>진행</span><span><b>{used}</b> / {g.budgetMax}봉</span></div>
          <div className="progress-track"><div className="progress-fill" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
        </div>
      </div>

      <div className={cls('signal-card', sig.className)}>
        <div className="signal-main"><span>Signal {sig.score >= 0 ? '+' : ''}{sig.score}</span><strong>{sig.label}</strong></div>
        <div className="signal-components">{[sig.components.ma.label, sig.components.rsi.label, sig.components.macd.label, sig.components.volume.label].join(' · ')}</div>
      </div>

      <div className="chart-card">
        <Chart game={g} flags={s.settings.ind} mode="play" tick={g.visible + (hasPos ? 1000 : 0)} />
      </div>

      <div className="position-card">
        {hasPos ? (
          <>
            <div className="pos-st">{g.pos!.side === 'long' ? '매수' : '공매도'} 보유 중 · 진입가 {fmtPx(g.pos!.price)}원</div>
            <div className="pos-px">현재가 {fmtPx(price)}원</div>
            <div className={cls('pnl', pnlCls)}><span>{pct(r)}</span><span>{won >= 0 ? '+' : ''}₩{fmt(won)}</span></div>
          </>
        ) : (
          <>
            <div className="pos-st">포지션 없음 · 진입 대기</div>
            <div className="pos-px">현재가 {fmtPx(price)}원</div>
          </>
        )}
      </div>

      <div className="action-bar">
        {!hasPos ? (
          <>
            <button className="btn btn-long" onClick={s.buy}>매수</button>
            {s.settings.difficulty === 'advanced' && <button className="btn btn-short" onClick={s.short}>공매도</button>}
            <button className="btn btn-next" onClick={s.advance}>관망</button>
          </>
        ) : (
          <>
            <button className="btn btn-exit" onClick={s.sell}>청산</button>
            <button className="btn btn-next" onClick={s.advance}>보유</button>
          </>
        )}
      </div>
    </div>
  )
}
