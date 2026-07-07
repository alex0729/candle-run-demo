import type { Manifest } from './types'

// 문자열 해시(FNV-1a) — 날짜를 시드로 결정적 선택
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

// 날짜 기준으로 고정된 '오늘의 종목' 실데이터 id 목록(결정적).
// 앞 2개는 무료, 이후는 광고 시청 후 이어하는 본게임에 사용.
// 데이터 소스 = 매니페스트의 real 시나리오(ETF/ETN 제외됨). 추후 서버 큐레이션으로 교체 가능.
export function getDailyScenarioIds(dateKey: string, m: Manifest, count = 12): string[] {
  const reals = m.scenarios.filter((s) => s.source === 'real' && s.play_max >= 20).map((s) => s.id).sort()
  if (!reals.length) return []
  const ids: string[] = []
  const n = reals.length
  for (let k = 0; k < count; k++) {
    let idx = hash(`${dateKey}#${k}`) % n
    while (ids.includes(reals[idx]) && ids.length < n) idx = (idx + 1) % n
    ids.push(reals[idx])
  }
  return ids
}
