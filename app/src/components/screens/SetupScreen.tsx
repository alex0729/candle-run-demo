import { useEffect, useState } from 'react'
import { useStore } from '../../store/store'
import { loadManifest } from '../../game/scenarios'
import type { Manifest } from '../../game/types'
import { cls, fmt } from '../../util'
import { diagnose } from '../../game/profile'

const DIFFS = [
  { k: 'beginner', label: '초보자', desc: '변동성 낮은 종목 · Tip 3회' },
  { k: 'normal', label: '기본', desc: '균형 잡힌 난이도 · Tip 2회' },
  { k: 'advanced', label: '고급', desc: '고변동 · 공매도 · Tip 1회' },
] as const

const MARKETS = [
  { k: 'ALL', label: '전체' },
  { k: 'KOSPI', label: 'KOSPI' },
  { k: 'KOSDAQ', label: 'KOSDAQ' },
] as const

const MODES = [30, 50, 80]

const INDS: { k: keyof ReturnType<typeof useStore.getState>['settings']['ind']; label: string; sub: string; adv?: boolean }[] = [
  { k: 'ma', label: 'MA', sub: '추세' },
  { k: 'rsi', label: 'RSI', sub: '과열/침체' },
  { k: 'macd', label: 'MACD', sub: '모멘텀' },
  { k: 'vol', label: '거래량', sub: '수급' },
  { k: 'bb', label: '볼린저', sub: '고급', adv: true },
  { k: 'ichimoku', label: '일목', sub: '고급', adv: true },
]

export default function SetupScreen() {
  const s = useStore()
  const [manifest, setManifest] = useState<Manifest | null>(null)
  const [advanced, setAdvanced] = useState(false)

  useEffect(() => { loadManifest().then(setManifest).catch(() => {}) }, [])

  const quickStart = () => {
    s.setSettings({ difficulty: 'normal', mode: 50, market: 'ALL', recentOnly: false, ind: { ma: true, rsi: true, macd: true, vol: true, bb: false, ichimoku: false } })
    s.startRound()
  }

  const profile = diagnose(s.lifetime)
  const winRate = s.lifetime.trades ? Math.round((s.lifetime.wins / s.lifetime.trades) * 100) : 0

  return (
    <div className="screen setup">
      <section className="hero">
        <div className="eyebrow">REAL CHART SIMULATION · v0.4</div>
        <h1>캔들<span className="accent">런</span></h1>
        <p>실제 국내주식 차트로 즐기는 투자 감각 트레이닝.<br />블라인드 차트를 읽고, 매수·관망·청산을 결정하세요.</p>
        {manifest && (
          <div className="data-badges">
            <span className="dbadge">시나리오 {fmt(manifest.count)}개</span>
            <span className="dbadge kospi">KOSPI {fmt(manifest.by_market.KOSPI ?? 0)}</span>
            <span className="dbadge kosdaq">KOSDAQ {fmt(manifest.by_market.KOSDAQ ?? 0)}</span>
            <span className="dbadge">2020년+ {fmt(manifest.recent_count)}</span>
          </div>
        )}
      </section>

      {s.lifetime.rounds > 0 && (
        <div className="card mini-stats">
          <div><b>{s.lifetime.rounds}</b><span>플레이</span></div>
          <div><b>{winRate}%</b><span>승률</span></div>
          <div><b>{profile.emoji}</b><span>{profile.type}</span></div>
        </div>
      )}

      <div className="card setup-card">
        <div className="block">
          <label>난이도</label>
          <div className="segmented">
            {DIFFS.map((d) => (
              <button key={d.k} className={cls('seg', s.settings.difficulty === d.k && 'on')} onClick={() => s.setSettings({ difficulty: d.k })}>
                <b>{d.label}</b><i>{d.desc}</i>
              </button>
            ))}
          </div>
        </div>

        <div className="block">
          <label>시장</label>
          <div className="segmented">
            {MARKETS.map((m) => (
              <button key={m.k} className={cls('seg', s.settings.market === m.k && 'on')} onClick={() => s.setSettings({ market: m.k })}>{m.label}</button>
            ))}
          </div>
        </div>

        <div className="block">
          <label>플레이 봉 수</label>
          <div className="segmented">
            {MODES.map((m) => (
              <button key={m} className={cls('seg', s.settings.mode === m && 'on')} onClick={() => s.setSettings({ mode: m })}>{m}봉</button>
            ))}
          </div>
        </div>

        <div className="block row">
          <label className="grow">최근(2020년+) 데이터 우선</label>
          <button className={cls('switch', s.settings.recentOnly && 'on')} onClick={() => s.setSettings({ recentOnly: !s.settings.recentOnly })} aria-pressed={s.settings.recentOnly}><i /></button>
        </div>

        <div className="block">
          <label>보조지표 <button className="link" onClick={() => setAdvanced((v) => !v)}>{advanced ? '기본만' : '고급 보기'}</button></label>
          <div className="chips">
            {INDS.filter((i) => advanced || !i.adv).map((i) => (
              <button key={i.k} className={cls('chip', s.settings.ind[i.k] && 'on')} onClick={() => s.toggleInd(i.k)}>
                <b>{i.label}</b><span>{i.sub}</span>
              </button>
            ))}
          </div>
        </div>
      </div>

      <div className="cta-stack">
        <button className="primary-cta" onClick={quickStart} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '빠른 시작 ▶'}</button>
        <button className="ghost-cta" onClick={s.startRound} disabled={s.loadingRound}>이 설정으로 시작</button>
      </div>
      <p className="disclaimer">가상 머니로 진행되는 학습용 콘텐츠이며, 특정 종목의 매수·매도 추천이 아닙니다.</p>
    </div>
  )
}
