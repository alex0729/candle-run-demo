import { useStore } from '../store/store'
import { cls } from '../util'

const DIFFS = [
  { k: 'beginner', label: '초보자', desc: '튜토리얼 · 매턴 팁' },
  { k: 'normal', label: '기본', desc: '균형' },
  { k: 'advanced', label: '고급', desc: '팁 최소' },
] as const

const MODES = [20, 30, 50]

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
          <span className="sheet-title">게임 설정</span>
          <button className="sheet-close" onClick={s.closeSettings}>×</button>
        </div>

        <div className="field-label">난이도</div>
        <div className="seg-row">
          {DIFFS.map((d) => (
            <button key={d.k} className={cls('seg', s.settings.difficulty === d.k && 'on')} onClick={() => s.setSettings({ difficulty: d.k })}>
              <div>{d.label}</div><div className="seg-sub">{d.desc}</div>
            </button>
          ))}
        </div>

        <div className="field-label">플레이 봉 수 (턴)</div>
        <div className="seg-row">
          {MODES.map((m) => (
            <button key={m} className={cls('seg', 'mono', s.settings.mode === m && 'on')} onClick={() => s.setSettings({ mode: m })}>{m}턴</button>
          ))}
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

        <button className="sheet-cta" onClick={s.closeSettings}>적용하기</button>
        <div className="sheet-note">설정은 오늘의 종목에 적용돼요 · 초보자는 튜토리얼과 매턴 팁이 켜집니다</div>
      </div>
    </>
  )
}
