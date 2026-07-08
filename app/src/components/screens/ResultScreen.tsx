import { useMemo } from 'react'
import { useStore } from '../../store/store'
import Chart from '../Chart'
import Confetti from '../Confetti'
import SpeechBubble from '../SpeechBubble'
import PlayMorePrompt from '../PlayMorePrompt'
import { generateReview, verdictOf } from '../../game/engine'
import { diagnose } from '../../game/profile'
import { getDailyRanking, rankOf } from '../../game/ranking'
import { INVEST_LINK, PRIZES, cycleKey } from '../../game/constants'
import { cls, fmt, pct } from '../../util'

export default function ResultScreen() {
  const s = useStore()
  const g = s.game
  if (!g) return null

  const revealGame = useMemo(() => ({ ...g, visible: g.start + g.budgetMax }), [g])
  const r = g.noTrade ? 0 : g.myRet ?? 0
  const won = s.walletDelta
  const c0 = r > 0 ? 'gain' : r < 0 ? 'loss' : 'flat'
  const review = generateReview(g)
  const profile = diagnose(s.session)
  const best = g.best!
  const bnh = g.bnhRet ?? 0
  const bench = g.benchRet ?? 0

  const maxAbs = Math.max(Math.abs(r), Math.abs(bnh), Math.abs(bench), 0.01)
  const bar = (label: string, val: number) => ({
    label, val: pct(val, 1), pct: Math.max(6, (Math.abs(val) / maxAbs) * 100),
    col: val >= 0 ? 'var(--up)' : 'var(--down)',
  })
  const bars = [bar('내 판단', r), bar('실제 흐름 (보유 시)', bnh)]

  const isReal = g.scenario.source === 'real' && !!g.scenario.name
  const sd = g.scenario.data[g.start]?.date || g.scenario.start_date || ''
  const ed = g.scenario.data[Math.min(g.start + g.budgetMax, g.scenario.data.length - 1)]?.date || g.scenario.end_date || ''
  const period = sd && ed ? `${sd}~${ed}` : ''
  const dailyRank = rankOf(getDailyRanking(cycleKey()), s.wallet)
  const myPrize = dailyRank >= 1 && dailyRank <= PRIZES.length ? PRIZES[dailyRank - 1] : 0

  return (
    <div className="screen">
      {r > 0 && <Confetti />}
      <div className="scroll">
        <div className="res-top">
          <div className="res-kicker">복기 · {verdictOf(g)}</div>
          <div className={cls('res-big', c0)}>{g.noTrade ? '0.0%' : pct(r)}</div>
          <div className="res-sub">{g.noTrade ? '관망 · 손익 없음' : <>이번 판 수익 <b style={{ color: won > 0 ? 'var(--up)' : won < 0 ? 'var(--down)' : 'var(--text)' }}>{won >= 0 ? '+' : ''}₩{fmt(won)}</b></>}</div>
          <button className="reward-pill tap" onClick={s.goLeaderboard}>페이북겜머니 <b>₩{fmt(s.wallet)}</b> · 오늘 {dailyRank}위{myPrize > 0 && <> · 🏆 페이북머니 {fmt(myPrize)}원</>} <span className="tap-hint">랭킹 ›</span></button>
        </div>

        {/* 정답 공개(reveal) */}
        <div className="reveal-banner">
          <span className="rb-eyebrow">이 차트는 사실…</span>
          {isReal
            ? <><b className="rb-name">{g.scenario.name}</b><span className="rb-meta">{g.scenario.code} · {g.scenario.market} · {g.scenario.sector}{period && ` · ${period}`}</span></>
            : <><b className="rb-name">연습용 합성 차트</b><span className="rb-meta">{g.scenario.market} · {g.scenario.sector}</span></>}
        </div>

        <div className="card blk" style={{ padding: 8 }}>
          <div className="reveal-chart">
            <Chart game={revealGame} flags={s.settings.ind} mode="reveal" tick={1} />
          </div>
          <div className="reveal-legend">
            <span><i className="lg-buy" />내 진입</span>
            <span><i className="lg-exit" />청산</span>
            <span><i className="lg-best" />최선의 한 수</span>
          </div>
        </div>

        {/* 내 판단 vs 실제 흐름 */}
        <div className="card blk">
          <div className="blk-title">내 판단 vs 실제 흐름</div>
          {bars.map((b) => (
            <div key={b.label} className="cmp-row">
              <div className="cmp-meta"><span className="l">{b.label}</span><span className="v" style={{ color: b.col }}>{b.val}</span></div>
              <div className="cmp-bar"><div className="cmp-fill" style={{ width: `${b.pct}%`, background: b.col }} /></div>
            </div>
          ))}
        </div>

        {/* 캔들이 코칭 — 크고 짧게 */}
        <div className="coach-stack">
          <SpeechBubble className="coach" mood="cheer" title="좋았던 점" text={review.good} size={44} />
          <SpeechBubble className="coach" mood="warn" title="주의할 점" text={review.risk} size={44} />
          <SpeechBubble className="coach" mood="think" title="최선의 한 수" size={44}
            text={<>{best.ei - g.start}봉 <b>{best.side === 'long' ? '매수' : '공매도'}</b> → {best.xi - g.start}봉 청산이면 최대 <b>{pct(best.ret)}</b>!</>} />
        </div>

        {/* 은근한 탐색 링크(초대형·옵셔널) */}
        {isReal && (
          <a className="explore-link" href={INVEST_LINK}>이 종목, 실제로는 어떻게 됐을까? 👀</a>
        )}

        <div className="persona-mini">
          <span className="pm-emoji">{profile.emoji}</span>
          <span className="pm-text"><b>{profile.type}</b> · {profile.title}</span>
        </div>

        <div className="disclaimer">학습용 복기이며 특정 종목 추천이 아닙니다. 페이북겜머니(가상)로 진행됩니다.</div>
      </div>

      <div className="actionbar">
        <div className="row">
          <button className="btn btn-surface g1" onClick={s.goHome}>🏠 홈</button>
          <button className="btn btn-dark g1" onClick={s.goLeaderboard}>🏆 랭킹</button>
        </div>
        <div className="home-ind"><i /></div>
      </div>

      <PlayMorePrompt />
    </div>
  )
}
