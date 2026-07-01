import { useMemo } from 'react'
import { useStore } from '../../store/store'
import Chart from '../Chart'
import { generateReview, verdictOf } from '../../game/engine'
import { diagnose } from '../../game/profile'
import { cls, fmt, pct } from '../../util'

export default function ResultScreen() {
  const s = useStore()
  const g = s.game
  if (!g) return null

  const revealGame = useMemo(() => ({ ...g, visible: g.start + g.budgetMax }), [g])
  const r = g.noTrade ? 0 : g.myRet ?? 0
  const won = 10_000_000 * r
  const c0 = r > 0 ? 'gain' : r < 0 ? 'loss' : 'flat'
  const review = generateReview(g)
  const profile = diagnose(s.session)
  const best = g.best!
  const bnh = g.bnhRet ?? 0
  const bench = g.benchRet ?? 0
  const capture = best.ret > 0 ? Math.max(0, Math.min(1, r / best.ret)) : 0

  const maxAbs = Math.max(Math.abs(r), Math.abs(bnh), Math.abs(bench), 0.01)
  const bar = (label: string, val: number) => ({
    label, val: pct(val, 1),
    pct: Math.max(6, (Math.abs(val) / maxAbs) * 100),
    col: val >= 0 ? 'var(--up)' : 'var(--down)',
  })
  const bars = [bar('내 매매', r), bar('그냥 보유 (Buy&Hold)', bnh), bar('시장 벤치마크(추정)', bench)]

  const actual = g.scenario.source === 'real' && g.scenario.name
    ? `${g.scenario.name} (${g.scenario.code}) · ${g.scenario.market} · ${g.scenario.sector}`
    : `연습 시나리오 · ${g.scenario.market} · ${g.scenario.sector}`

  const goInvest = () => s.showToast('데모: 페이북 투자서비스로 연결되는 지점입니다')

  return (
    <div className="screen">
      <div className="scroll">
        <div className="res-top">
          <div className="res-kicker">{g.noTrade ? '노 트레이드 · 복기' : '청산 완료 · 복기'} · {verdictOf(g)}</div>
          <div className={cls('res-big', c0)}>{g.noTrade ? '0.0%' : pct(r)}</div>
          <div className="res-sub">손익 <b>{won >= 0 ? '+' : ''}₩{fmt(won)}</b> · 가상시드 1,000만원</div>
          <div className="reward-pill">₩ 페이북머니 <b>{s.walletDelta >= 0 ? '+' : ''}{fmt(s.walletDelta)}</b> 정산</div>
        </div>

        <div className="card blk" style={{ padding: 8 }}>
          <div style={{ height: 200, position: 'relative' }}>
            <Chart game={revealGame} flags={s.settings.ind} mode="reveal" tick={1} />
          </div>
        </div>

        <div className="card blk">
          <div className="blk-title">성과 비교</div>
          {bars.map((b) => (
            <div key={b.label} className="cmp-row">
              <div className="cmp-meta"><span className="l">{b.label}</span><span className="v" style={{ color: b.col }}>{b.val}</span></div>
              <div className="cmp-bar"><div className="cmp-fill" style={{ width: `${b.pct}%`, background: b.col }} /></div>
            </div>
          ))}
          <div className="cmp-row" style={{ marginTop: 4 }}>
            <div className="cmp-meta"><span className="l">구간 최선 대비 포착률</span><span className="v" style={{ color: 'var(--accent)' }}>{Math.round(capture * 100)}%</span></div>
          </div>
        </div>

        <div className="eval-row">
          <div className="eval good"><div className="h">좋았던 점</div><p>{review.good}</p></div>
          <div className="eval caution"><div className="h">주의할 점</div><p>{review.risk}</p></div>
        </div>

        <div className="card best-card">
          <div className="h"><span>🎯</span>최선의 한 수 (복기)</div>
          <p>{best.ei - g.start}봉 <b>{best.side === 'long' ? 'LONG' : 'SHORT'}</b> → {best.xi - g.start}봉 청산 시 최대 <b>{pct(best.ret)}</b> · 실제 <b>{actual}</b></p>
        </div>

        <div className="card persona">
          <span className="emoji">{profile.emoji}</span>
          <div style={{ flex: 1 }}>
            <div className="type">투자 성향 · {profile.type}</div>
            <div className="ttl">{profile.title}</div>
            <div className="desc">{profile.desc}</div>
          </div>
        </div>

        <button className="cta-invest" onClick={goInvest}>{profile.cta} →</button>
        <button className="btn btn-surface" style={{ width: '100%', marginBottom: 8 }} onClick={s.goLeaderboard}>🏆 내 랭킹 확인하기</button>
        <div className="disclaimer">학습용 복기이며 특정 종목 추천이 아닙니다. 벤치마크는 추정치, 가상 머니로 진행됩니다.</div>
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
