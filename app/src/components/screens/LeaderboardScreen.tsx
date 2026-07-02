import { useState } from 'react'
import { useStore } from '../../store/store'
import { board, myRank, Period } from '../../game/leaderboard'
import { cls, fmt } from '../../util'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen() {
  const s = useStore()
  const [period, setPeriod] = useState<Period>('weekly')
  const played = s.session.rounds > 0
  const myMoney = s.wallet

  const base = board(period).map((e) => ({ ...e, mine: false }))
  const all = played ? [...base, { name: '나', tag: 'YOU', money: myMoney, mine: true }] : base
  all.sort((a, b) => b.money - a.money)
  const ranked = all.map((e, i) => ({ ...e, rank: i + 1 }))
  const me = ranked.find((e) => e.mine)
  let shown = ranked.slice(0, 20)
  if (me && me.rank > 20) shown = [...ranked.slice(0, 19), me]

  return (
    <div className="screen">
      <div className="scroll">
        <div className="lb-head">
          <div className="k">LEADERBOARD</div>
          <div className="t">🏆 페이북머니 랭킹</div>
          <div className="lb-sub">가장 많은 페이북머니를 모은 TOP 20</div>
        </div>

        <div className="lb-toggle">
          <button className={cls(period === 'weekly' && 'on')} onClick={() => setPeriod('weekly')}>주간</button>
          <button className={cls(period === 'monthly' && 'on')} onClick={() => setPeriod('monthly')}>월간</button>
        </div>

        {played && me ? (
          <div className="lb-me">
            <div className="rk">{me.rank}<small>위</small></div>
            <div className="mid">
              <div className="n">나 · YOU</div>
              <div className="s">내 페이북머니</div>
            </div>
            <div className="ret">₩{fmt(myMoney)}</div>
          </div>
        ) : (
          <div className="lb-me ghost">
            <div className="mid"><div className="n">한 판이면 랭킹 등록</div><div className="s">플레이할수록 페이북머니가 쌓여요</div></div>
            <button className="btn btn-red" style={{ height: 44, padding: '0 18px' }} onClick={() => s.startRound()}>시작 ▶</button>
          </div>
        )}

        <div className="lb-list">
          {shown.map((e) => (
            <div key={e.rank + e.name} className={cls('lb-row', e.mine && 'mine')}>
              <div className={cls('lb-rank', e.rank <= 3 && 'medal')}>{e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}</div>
              <div className="lb-name">{e.mine ? '나' : e.name}{e.tag && <span className="tag">{e.tag}</span>}</div>
              <div className="lb-money">₩{fmt(e.money)}</div>
            </div>
          ))}
        </div>
        <div className="disclaimer" style={{ marginTop: 14 }}>랭킹은 프로토타입 예시 · 내 순위는 보유 페이북머니 기준</div>
      </div>

      <div className="actionbar">
        <div className="row">
          <button className="btn btn-surface g1" onClick={s.goHome}>처음으로</button>
          <button className="btn btn-red grow14" onClick={s.nextRound} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '페이북머니 쌓기 ▶'}</button>
        </div>
        <div className="home-ind"><i /></div>
      </div>
    </div>
  )
}
