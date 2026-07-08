import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import Chart from '../Chart'
import PlayTutorial from '../PlayTutorial'
import SpeechBubble from '../SpeechBubble'
import type { Mood } from '../Mascot'
import { curPrice, GameState, pnlNow, signalAt } from '../../game/engine'
import { cls, fmt, pct } from '../../util'
import type { Score } from '../../game/signal'

// 초보자 매턴 팁(캔들이의 짧은 한마디 + 표정)
function turnHint(g: GameState): { text: string; mood: Mood } {
  const sig = signalAt(g)
  if (!g.pos) {
    if (sig.score >= 2) return { text: '상승 우위 신호! 매수 각 볼까? 😊', mood: 'cheer' }
    if (sig.score <= -2) return { text: '하락 주의… 다음턴이 안전해', mood: 'warn' }
    return { text: '방향이 애매해 🤔 한 봉 더 지켜보자', mood: 'think' }
  }
  const p = pnlNow(g)
  if (p > 0 && sig.score <= 0) return { text: '수익 중인데 신호 약해졌어 — 청산도 좋아', mood: 'think' }
  if (p < 0 && sig.score <= -2) return { text: '손실 + 약세 😮 손절 기준 생각해보자', mood: 'warn' }
  return { text: '보유 중! 추세 살아있는지 보자 🔥', mood: 'cheer' }
}

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
  const [info, setInfo] = useState<null | 'long' | 'short'>(null)
  const beginner = s.settings.difficulty === 'beginner'
  const [tutClosed, setTutClosed] = useState(false)
  const [turnTip, setTurnTip] = useState<{ text: string; mood: Mood } | null>(null)

  const scnId = g?.scenario.id
  const visible = g?.visible
  const over = g?.over
  useEffect(() => { setTutClosed(false) }, [scnId]) // 새 게임마다 튜토리얼 초기화

  useEffect(() => {
    if (!beginner || !g || over) { setTurnTip(null); return }
    setTurnTip(turnHint(g))
    const t = setTimeout(() => setTurnTip(null), 2600)
    return () => clearTimeout(t)
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [visible, over, beginner])

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
          {turnTip && (
            <div className="turn-tip" key={g.visible}>
              <SpeechBubble mood={turnTip.mood} text={turnTip.text} size={34} tone="dark" />
            </div>
          )}
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
        {info && (
          <div className="info-pop-wrap" onClick={() => setInfo(null)}>
            <div className={cls('info-pop', info)} onClick={(e) => e.stopPropagation()}>
              <b>{info === 'long' ? '매수 (LONG)' : '공매도 (SHORT)'}</b>
              <p>{info === 'long'
                ? <>가격이 <em className="up">상승</em>하면 수익, 하락하면 손실이에요.</>
                : <>가격이 <em className="down">하락</em>하면 수익, 상승하면 손실이에요.</>}</p>
              <span className="info-close">탭하여 닫기</span>
            </div>
          </div>
        )}
        {!hasPos ? (
          <div className="row">
            <button className="btn btn-red g1" onClick={s.buy}>매수<i className="qmark" onClick={(e) => { e.stopPropagation(); setInfo('long') }}>?</i></button>
            <button className="btn btn-blue g1" onClick={s.short}>공매도<i className="qmark" onClick={(e) => { e.stopPropagation(); setInfo('short') }}>?</i></button>
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
      {beginner && !tutClosed && <PlayTutorial onDone={() => setTutClosed(true)} />}
    </div>
  )
}
