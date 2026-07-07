import { useStore } from '../store/store'
import { cls } from '../util'

const DIFFS = [
  { k: 'beginner', label: '초보자' },
  { k: 'normal', label: '기본' },
  { k: 'advanced', label: '고급' },
] as const

const MARKETS = [
  { k: 'ALL', label: '전체' },
  { k: 'KOSPI', label: 'KOSPI' },
  { k: 'KOSDAQ', label: 'KOSDAQ' },
] as const

const MODES = [30, 50, 80]

const INDS: { k: keyof ReturnType<typeof useStore.getState>['settings']['ind']; name: string; desc: string }[] = [
  { k: 'ma', name: 'MA', desc: '추세' },
  { k: 'rsi', name: 'RSI', desc: '과열/침체' },
  { k: 'macd', name: 'MACD', desc: '모멘텀' },
  { k: 'vol', name: '거래량', desc: '수급' },
  { k: 'bb', name: '볼린저', desc: '고급' },
  { k: 'ichimoku', name: '일목', desc: '고급' },
]

export default function SettingsSheet() {
  const s = useStore()
  if (!s.showSettings) return null

  return (
    <>
      <div className="sheet-overlay" onClick={s.closeSettings} />
      <div className="sheet">
        <div className="sheet-handle" />
        <div className="sheet-head">
          <span className="sheet-title">직접 설정</span>
          <button className="sheet-close" onClick={s.closeSettings}>×</button>
        </div>

        <div className="field-label">난이도</div>
        <div className="seg-row">
          {DIFFS.map((d) => (
            <button key={d.k} className={cls('seg', s.settings.difficulty === d.k && 'on')} onClick={() => s.setSettings({ difficulty: d.k })}>{d.label}</button>
          ))}
        </div>

        <div className="field-label">시장</div>
        <div className="seg-row">
          {MARKETS.map((m) => (
            <button key={m.k} className={cls('seg', s.settings.market === m.k && 'on')} onClick={() => s.setSettings({ market: m.k })}>{m.label}</button>
          ))}
        </div>

        <div className="field-label">플레이 봉 수</div>
        <div className="seg-row">
          {MODES.map((m) => (
            <button key={m} className={cls('seg', 'mono', s.settings.mode === m && 'on')} onClick={() => s.setSettings({ mode: m })}>{m}봉</button>
          ))}
        </div>

        <div className="switch-row">
          <span className="l">최근(2020년+) 데이터 우선</span>
          <button className={cls('switch', s.settings.recentOnly && 'on')} onClick={() => s.setSettings({ recentOnly: !s.settings.recentOnly })} aria-pressed={s.settings.recentOnly}><i /></button>
        </div>

        <div className="field-label">지표 선택</div>
        <div className="grid2">
          {INDS.map((i) => (
            <button key={i.k} className={cls('ind-btn', s.settings.ind[i.k] && 'on')} onClick={() => s.toggleInd(i.k)}>
              <div>
                <div className="nm">{i.name}</div>
                <div className="ds">{i.desc}</div>
              </div>
              <span className="mk">{s.settings.ind[i.k] ? '✓' : '+'}</span>
            </button>
          ))}
        </div>

        <button className="sheet-cta" onClick={s.startPractice} disabled={s.loadingRound}>{s.loadingRound ? '불러오는 중…' : '연습 한 판 시작 ▶'}</button>
        <div className="sheet-note">직접 설정은 연습 판이며 랭킹에 반영되지 않아요</div>
      </div>
    </>
  )
}
