import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import Chart from '../Chart'
import PlayTutorial from '../PlayTutorial'
import SpeechBubble from '../SpeechBubble'
import type { Mood } from '../Mascot'
import { curPrice, GameState, pnlNow, signalAt } from '../../game/engine'
import { cls, fmt, pct } from '../../util'
import type { Score } from '../../game/signal'

// 초보자 코치 — "지금 뭘 눌러야 하는지"를 행동 중심으로(짧게, 친근하게)
function coach(g: GameState): { text: string; mood: Mood } {
  if (!g.pos) {
    const sig = signalAt(g)
    if (sig.score >= 2) return { text: '오를 신호! 매수 눌러볼까? 😊', mood: 'cheer' }
    if (sig.score <= -2) return { text: '내릴 것 같아 — 공매도 or 다음턴!', mood: 'warn' }
    return { text: '오를지 내릴지 정해서 눌러봐! 🤔', mood: 'think' }
  }
  const p = pnlNow(g)
  if (p > 0) return { text: '수익 중! 청산하면 확정돼 😊', mood: 'cheer' }
  if (p < 0) return { text: '손실 중… 청산=손절, 보유=반등 기다리기', mood: 'think' }
  return { text: '흐름 보다가 청산 타이밍 잡자! 🔥', mood: 'idle' }
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
  const beginner = s.settings.difficulty === 'beginner'
  const [tutClosed, setTutClosed] = useState(false)

  const scnId = g?.scenario.id
  useEffect(() => { setTutClosed(false) }, [scnId]) // 새 게임마다 튜토리얼 초기화

  if (!g) return null

  const sig = signalAt(g)
  const used = g.budgetMax - g.budget
  const ratio = g.budgetMax > 0 ? used / g.budgetMax : 0
  const price = curPrice(g)
  const prev = g.scenario.data[g.visible - 1]?.c ?? price
  const chg = (price - prev) / prev
  const hasPos = !!g.pos
  const r = hasPos ? pnlNow(g) : 0
  const coachMsg = beginner && !g.over ? coach(g) : null
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

      {beginner && (
        <div className="flow-steps">
          <span className={cls('fs', !hasPos && 'on', hasPos && 'done')}>① 진입</span>
          <i className="fs-arw">→</i>
          <span className={cls('fs', hasPos && 'on')}>② 보유</span>
          <i className="fs-arw">→</i>
          <span className={cls('fs', hasPos && 'next')}>③ 청산</span>
        </div>
      )}

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
        {coachMsg && (
          <div className="beginner-coach">
            <SpeechBubble mood={coachMsg.mood} text={coachMsg.text} size={40} />
          </div>
        )}
        {!hasPos ? (
          <div className="row">
            <button className={cls('btn btn-red g1 has-sub', beginner && 'pulse')} onClick={s.buy}>
              <span className="btn-lead">매수</span>
              <small className="btn-sub">오를 때 수익</small>
            </button>
            <button className={cls('btn btn-blue g1 has-sub', beginner && 'pulse')} onClick={s.short}>
              <span className="btn-lead">공매도</span>
              <small className="btn-sub">내릴 때 수익</small>
            </button>
            <button className="btn btn-surface g1 has-sub" onClick={s.advance}>
              <span className="btn-lead">다음턴 ▶</span>
              <small className="btn-sub">지켜보기</small>
            </button>
          </div>
        ) : (
          <div className="row">
            <button className={cls('btn btn-dark grow13 has-sub', beginner && 'pulse')} onClick={s.sell}>
              <span className="btn-lead">청산</span>
              <small className="btn-sub">지금 정리</small>
            </button>
            <button className="btn btn-surface g1 has-sub" onClick={s.advance}>
              <span className="btn-lead">보유 ▶</span>
              <small className="btn-sub">더 지켜보기</small>
            </button>
          </div>
        )}
        <div className="home-ind"><i /></div>
      </div>
      {beginner && !tutClosed && <PlayTutorial onDone={() => setTutClosed(true)} />}
    </div>
  )
}
