import { useState } from 'react'
import { useStore } from '../../store/store'
import { getDailyRanking, getMonthlyVisitRanking, RankEntry } from '../../game/ranking'
import { cycleKey, monthKey, cycleReturn, PRIZES } from '../../game/constants'
import CycleTimer from '../CycleTimer'
import { cls, fmt, pct } from '../../util'

const MEDAL = ['🥇', '🥈', '🥉']
type Period = 'daily' | 'monthly'
const prizeOf = (rank: number) => (rank >= 1 && rank <= PRIZES.length ? PRIZES[rank - 1] : 0)

export default function LeaderboardScreen() {
  const s = useStore()
  const [period, setPeriod] = useState<Period>('daily')

  const daily = period === 'daily'
  const list: RankEntry[] = daily ? getDailyRanking(cycleKey()) : getMonthlyVisitRanking(monthKey())
  const myScore = daily ? cycleReturn(s.wallet, s.cycleStartWallet) : s.monthlyVisits
  const played = daily ? (s.dailyDoneCount > 0) : (s.monthlyVisits > 0)
  const fmtScore = (n: number) => daily ? pct(n) : `${fmt(n)}회`
  const subLabel = daily ? '오늘 수익률' : '이번달 방문'

  const base = list.map((e) => ({ ...e, mine: false }))
  const all = played ? [...base, { name: '나', tag: 'YOU', score: myScore, mine: true }] : base
  all.sort((a, b) => b.score - a.score)
  const ranked = all.map((e, i) => ({ ...e, rank: i + 1 }))
  const me = ranked.find((e) => e.mine)
  let shown = ranked.slice(0, 20)
  if (me && me.rank > 20) shown = [...ranked.slice(0, 19), me]
  const myPrize = daily && me ? prizeOf(me.rank) : 0

  return (
    <div className="screen">
      <div className="scroll">
        <div className="lb-head">
          <div className="k">LEADERBOARD</div>
          <div className="t">🏆 {daily ? '오늘의 랭킹' : '월간 방문 랭킹'}</div>
          <div className="lb-sub"><CycleTimer /></div>
        </div>

        {daily && (
          <div className="prize-strip">
            <span>🥇 3만</span><span>🥈 2만</span><span>🥉 1만</span>
            <em>새벽 6시 오늘 수익률 상위 3인 페이북머니 지급</em>
          </div>
        )}

        <div className="lb-toggle">
          <button className={cls(period === 'daily' && 'on')} onClick={() => setPeriod('daily')}>일간 (수익률)</button>
          <button className={cls(period === 'monthly' && 'on')} onClick={() => setPeriod('monthly')}>월간 (방문)</button>
        </div>

        {played && me ? (
          <div className={cls('lb-me', myPrize > 0 && 'win')}>
            <div className="rk">{me.rank}<small>위</small></div>
            <div className="mid">
              <div className="n">나 · YOU</div>
              <div className="s">{myPrize > 0 ? `입상! 페이북머니 ${fmt(myPrize)}원` : subLabel}</div>
            </div>
            <div className="ret">{fmtScore(myScore)}</div>
          </div>
        ) : (
          <div className="lb-me ghost">
            <div className="mid"><div className="n">{daily ? '한 판이면 랭킹 등록' : '방문할수록 순위가 올라가요'}</div><div className="s">{daily ? '오늘의 종목을 플레이해 보세요' : '매일 접속으로 방문 횟수 UP'}</div></div>
            <button className="btn btn-red" style={{ height: 44, padding: '0 18px' }} onClick={() => s.startRound()}>시작 ▶</button>
          </div>
        )}

        <div className="lb-list">
          {shown.map((e) => (
            <div key={e.rank + e.name} className={cls('lb-row', e.mine && 'mine')}>
              <div className={cls('lb-rank', e.rank <= 3 && 'medal')}>{e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}</div>
              <div className="lb-name">{e.mine ? '나' : e.name}{e.tag && <span className="tag">{e.tag}</span>}
                {daily && prizeOf(e.rank) > 0 && <span className="prize-tag">₩{fmt(prizeOf(e.rank))}</span>}
              </div>
              <div className="lb-money" style={daily && e.score < 0 ? { color: 'var(--down)' } : undefined}>{fmtScore(e.score)}</div>
            </div>
          ))}
        </div>
        <div className="disclaimer" style={{ marginTop: 14 }}>랭킹은 프로토타입 예시 데이터입니다 · 일간=오늘 수익률, 월간=방문횟수 기준</div>
      </div>

      <div className="actionbar">
        <div className="row">
          <button className="btn btn-surface g1" onClick={s.goHome}>처음으로</button>
          <button className="btn btn-red grow14" onClick={s.nextRound} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '한 판 더 ▶'}</button>
        </div>
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
