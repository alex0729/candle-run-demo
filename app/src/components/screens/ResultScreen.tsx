import { useMemo } from 'react'
import { useStore } from '../../store/store'
import Chart from '../Chart'
import { generateReview, REWARD_BASE, SEED_KRW, verdictOf } from '../../game/engine'
import { diagnose } from '../../game/profile'
import { cls, fmt, pct } from '../../util'

export default function ResultScreen() {
  const s = useStore()
  const g = s.game
  if (!g) return null

  // reveal: 전체 포워드 공개
  const revealGame = useMemo(() => ({ ...g, visible: g.start + g.budgetMax }), [g])

  const r = g.noTrade ? 0 : g.myRet ?? 0
  const won = SEED_KRW * r
  const cls0 = r > 0 ? 'gain' : r < 0 ? 'loss' : 'flat'
  const review = generateReview(g)
  const profile = diagnose(s.session)
  const best = g.best!
  const bnh = g.bnhRet ?? 0
  const bench = g.benchRet ?? 0
  const beat = r - bench
  const capture = best.ret > 0 ? Math.max(0, Math.min(1, r / best.ret)) : 0

  const reveal = () => {
    if (g.scenario.source === 'real' && g.scenario.name) {
      const sd = g.scenario.data[g.start]?.date || g.scenario.start_date || '-'
      const ed = g.scenario.data[Math.min(g.start + g.budgetMax, g.scenario.data.length - 1)]?.date || g.scenario.end_date || '-'
      return `${g.scenario.name} (${g.scenario.code}) · ${g.scenario.market} · ${g.scenario.sector} · ${sd}~${ed}`
    }
    return `연습용 합성 시나리오 · ${g.scenario.market} · ${g.scenario.sector} · ${g.scenario.start_date}~${g.scenario.end_date}`
  }

  const share = async () => {
    const text = `[캔들런] ${verdictOf(g)} ${g.noTrade ? '' : pct(r)} · 최선의 한 수 대비 ${Math.round(capture * 100)}% 포착! 페이북 투자서비스에서 캔들런에 도전해보세요.`
    try {
      if (navigator.share) { await navigator.share({ title: '캔들런 결과', text }); return }
      await navigator.clipboard.writeText(text)
      s.showToast('결과 요약을 복사했습니다')
    } catch { s.showToast('공유를 취소했습니다') }
  }

  const goInvest = () => s.showToast('데모: 페이북 투자서비스로 연결되는 지점입니다')

  return (
    <div className="screen result">
      <div className="res-head">
        <div className="verdict">{verdictOf(g)}</div>
        <div className={cls('big', cls0)}>{g.noTrade ? '0.0%' : pct(r)}</div>
        <div className="won">{g.noTrade ? '진입 없이 종료' : `손익 ${won >= 0 ? '+' : ''}₩${fmt(won)}`} · 가상시드 1,000만원</div>
        <div className={cls('wallet-delta', s.walletDelta > 0 ? 'gain' : s.walletDelta < 0 ? 'loss' : 'flat')}>
          페이북머니 {s.walletDelta >= 0 ? '+₩' : '-₩'}{fmt(Math.abs(s.walletDelta))} · 현재 ₩{fmt(s.wallet)}
        </div>
      </div>

      <div className="chart-card reveal-card">
        <Chart game={revealGame} flags={s.settings.ind} mode="reveal" tick={1} />
      </div>

      <div className="card compare">
        <h4>성과 비교</h4>
        <div className="cmp"><span>내 매매</span><b className={cls0}>{g.noTrade ? '미진입 · 0.0%' : `${g.pos!.side === 'long' ? '롱' : '숏'} · ${pct(r)} · ${g.holdBars}봉`}</b></div>
        <div className="cmp"><span>그냥 보유했다면 (Buy&Hold)</span><b className={bnh >= 0 ? 'gain' : 'loss'}>{pct(bnh)}</b></div>
        <div className="cmp"><span>동일기간 벤치마크(추정)</span><b className={beat >= 0 ? 'gain' : 'loss'}>{pct(bench)} · 초과 {pct(beat)}</b></div>
        <div className="cmp"><span>구간 최선 대비 포착률</span><b className="gold">{Math.round(capture * 100)}%</b></div>
      </div>

      <div className="card best">
        <h4>최선의 한 수 (복기)</h4>
        <p>이 구간 최선은 <b>{best.ei - g.start}봉 차 {best.side === 'long' ? '매수' : '공매도'}</b> → <b>{best.xi - g.start}봉 차 청산</b>, 최대 <b>{pct(best.ret)}</b> 가능했어요.
          {g.noTrade ? ' 다음엔 과감하게 들어가 볼까요?' : r >= best.ret * 0.6 ? ' 꽤 잘 잡았네요! 👏' : ' 진입·청산 타이밍을 다듬어 보세요.'}
        </p>
      </div>

      <div className="card review">
        <h4>판단 평가</h4>
        <div className="review-block"><strong>좋았던 점</strong><p>{review.good}</p></div>
        <div className="review-block"><strong>주의할 점</strong><p>{review.risk}</p></div>
      </div>

      <div className="card actual"><h4>실제 시나리오</h4><p>{reveal()}</p></div>

      <div className="card profile-card">
        <div className="profile-emoji">{profile.emoji}</div>
        <div className="profile-body">
          <span className="profile-type">당신의 투자 성향 · {profile.type}</span>
          <strong>{profile.title}</strong>
          <p>{profile.desc}</p>
        </div>
      </div>

      <button className="invest-cta" onClick={goInvest}>{profile.cta} →</button>

      <div className="res-actions">
        <button className="btn" onClick={s.toSetup}>설정 변경</button>
        <button className="btn ghost" onClick={share}>공유</button>
        <button className="btn btn-go grow" onClick={s.nextRound} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '한 판 더 ▶'}</button>
      </div>
      <p className="disclaimer">본 화면은 학습용 복기이며 특정 종목 추천이 아닙니다. 벤치마크는 추정치이며 가상 머니로 진행됩니다.</p>
    </div>
  )
}
