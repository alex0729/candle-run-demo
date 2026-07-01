import { useState } from 'react'
import { useStore } from '../../store/store'
import { board, Period } from '../../game/leaderboard'
import { cls, pct } from '../../util'

const MEDAL = ['🥇', '🥈', '🥉']

export default function LeaderboardScreen() {
  const s = useStore()
  const [period, setPeriod] = useState<Period>('weekly')
  const played = s.session.rounds > 0 || s.lastRet !== 0

  const base = board(period).map((e) => ({ ...e, mine: false }))
  const all = played ? [...base, { name: '나', tag: 'YOU', ret: s.lastRet, mine: true }] : base
  all.sort((a, b) => b.ret - a.ret)
  const ranked = all.map((e, i) => ({ ...e, rank: i + 1 }))
  const me = ranked.find((e) => e.mine)
  let shown = ranked.slice(0, 20)
  if (me && me.rank > 20) shown = [...ranked.slice(0, 19), me]

  return (
    <div className="screen">
      <div className="scroll">
        <div className="lb-head">
          <div className="k">LEADERBOARD</div>
          <div className="t">🏆 랭킹 TOP 20</div>
        </div>

        <div className="lb-toggle">
          <button className={cls(period === 'weekly' && 'on')} onClick={() => setPeriod('weekly')}>주간</button>
          <button className={cls(period === 'monthly' && 'on')} onClick={() => setPeriod('monthly')}>월간</button>
        </div>

        {me ? (
          <div className="lb-me">
            <div className="rk">{me.rank}<small>위</small></div>
            <div className="mid">
              <div className="n">나 · YOU</div>
              <div className="s">{played ? '이번 판 기준 순위' : ''}</div>
            </div>
            <div className="ret">{pct(s.lastRet)}</div>
          </div>
        ) : (
          <div className="lb-me" style={{ background: 'var(--surface2)', color: 'var(--text)', boxShadow: 'none' }}>
            <div className="mid"><div className="n">플레이하고 순위에 도전하세요</div><div className="s" style={{ opacity: .7 }}>한 판만 끝내도 랭킹이 매겨져요</div></div>
            <button className="btn btn-red" style={{ height: 40, padding: '0 16px' }} onClick={() => s.startRound()}>시작 ▶</button>
          </div>
        )}

        <div className="lb-list">
          {shown.map((e) => (
            <div key={e.rank + e.name} className={cls('lb-row', e.mine && 'mine')}>
              <div className={cls('lb-rank', e.rank <= 3 && 'medal')}>{e.rank <= 3 ? MEDAL[e.rank - 1] : e.rank}</div>
              <div className="lb-name">{e.mine ? '나' : e.name}{e.tag && <span className="tag">{e.tag}</span>}</div>
              <div className="lb-ret" style={{ color: e.ret >= 0 ? 'var(--up)' : 'var(--down)' }}>{pct(e.ret)}</div>
            </div>
          ))}
        </div>
        <div className="disclaimer" style={{ marginTop: 14 }}>랭킹은 프로토타입용 예시 데이터입니다. 내 순위는 최근 플레이 수익률 기준으로 계산됩니다.</div>
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
