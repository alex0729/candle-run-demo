import { useStore } from '../../store/store'
import Chart from '../Chart'
import { curPrice, pnlNow, signalAt } from '../../game/engine'
import { cls, fmt, pct } from '../../util'
import type { Score } from '../../game/signal'

function indState(sc: Score, kind: 'ma' | 'rsi' | 'macd' | 'vol') {
  const col = sc.score > 0 ? 'var(--up)' : sc.score < 0 ? 'var(--down)' : 'var(--dim)'
  let v = '중립'
  if (kind === 'rsi') v = sc.score > 0 ? '안정' : sc.score < 0 ? '경계' : '중립'
  else if (kind === 'vol') v = sc.score > 0 ? '활발' : sc.score < 0 ? '경계' : '보통'
  else v = sc.score > 0 ? '상승' : sc.score < 0 ? '하락' : '중립'
  return { v, col }
}

export default function PlayScreen() {
  const s = useStore()
  const g = s.game
  if (!g) return null

  const sig = signalAt(g)
  const used = g.budgetMax - g.budget
  const ratio = g.budgetMax > 0 ? used / g.budgetMax : 0
  const price = curPrice(g)
  const prev = g.scenario.data[g.visible - 1]?.c ?? price
  const chg = (price - prev) / prev
  const hasPos = !!g.pos
  const r = hasPos ? pnlNow(g) : 0
  const marketCls = g.scenario.market === 'KOSDAQ' ? 'kosdaq' : 'kospi'
  const sigCol = sig.score > 0 ? 'var(--up)' : sig.score < 0 ? 'var(--down)' : 'var(--dim)'

  const chips: { k: string; v: string; col: string }[] = []
  if (s.settings.ind.ma) chips.push({ k: 'MA', ...indState(sig.components.ma, 'ma') })
  if (s.settings.ind.rsi) chips.push({ k: 'RSI', ...indState(sig.components.rsi, 'rsi') })
  if (s.settings.ind.macd) chips.push({ k: 'MACD', ...indState(sig.components.macd, 'macd') })
  if (s.settings.ind.vol) chips.push({ k: 'VOL', ...indState(sig.components.volume, 'vol') })

  return (
    <div className="screen play">
      <div className="play-top">
        <div className="l">
          <span className="tk-badge">{g.scenario.blind_label.replace('종목 ', '')}</span>
          <div>
            <div className="tk-name">종목 블라인드</div>
            <div className="tk-sub"><span className={cls('mkt', marketCls)}>{g.scenario.market}</span> · {g.scenario.sector} · 일봉</div>
          </div>
        </div>
        <button className="tip-pill" onClick={s.useTip}>💡 캔들 팁 {g.tipRemaining}</button>
      </div>

      <div className="prog-wrap">
        <div className="prog-meta">
          <span className="p">진행 <b>{used}</b> / {g.budgetMax}봉</span>
          <span className="sig" style={{ color: sigCol }}>SIGNAL {sig.score >= 0 ? '+' : ''}{sig.score} · {sig.label}</span>
        </div>
        <div className="prog-track"><div className="prog-fill" style={{ width: `${Math.round(ratio * 100)}%` }} /></div>
      </div>

      <div className="chart-shell">
        <div className="chart-area">
          <Chart game={g} flags={s.settings.ind} mode="play" tick={g.visible + (hasPos ? 5000 : 0)} />
          <div className="ind-legend">
            {chips.map((c) => (
              <div key={c.k} className="ind-chip"><span className="k">{c.k}</span><span className="v" style={{ color: c.col }}>{c.v}</span></div>
            ))}
          </div>
        </div>
      </div>

      <div className="perf-row">
        <div className="perf-card">
          <span className="lbl">현재가</span>
          <div style={{ display: 'flex', alignItems: 'baseline', gap: 7 }}>
            <span className="big">{fmt(price)}</span>
            <span className="chg" style={{ color: chg >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(chg, 2)}</span>
          </div>
        </div>
        <div className="perf-card" style={hasPos ? { background: r >= 0 ? 'var(--up-soft)' : 'var(--down-soft)', borderColor: r >= 0 ? 'var(--up)' : 'var(--down)' } : undefined}>
          <span className="lbl">{hasPos ? `평가손익 · ${g.pos!.side === 'long' ? '매수' : '공매도'} 보유중` : '포지션 없음'}</span>
          <span className="big" style={{ color: hasPos ? (r >= 0 ? 'var(--up)' : 'var(--down)') : 'var(--dim)', fontSize: hasPos ? 21 : 16 }}>
            {hasPos ? pct(r, 2) : '진입 대기'}
          </span>
        </div>
      </div>

      <div className="actionbar">
        {!hasPos ? (
          <div className="row">
            <button className="btn btn-red g1" onClick={s.buy}>매수</button>
            <button className="btn btn-blue g1" onClick={s.short}>공매도</button>
            <button className="btn btn-surface g1" onClick={s.advance}>다음턴 ▶</button>
          </div>
        ) : (
          <div className="row">
            <button className="btn btn-dark grow13" onClick={s.sell}>청산</button>
            <button className="btn btn-surface g1" onClick={s.advance}>보유 ▶</button>
          </div>
        )}
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
