import type { Manifest } from './types'
import { DAILY_FREE_PLAYS } from './constants'

// 문자열 해시(FNV-1a) — 날짜를 시드로 결정적 선택
function hash(str: string): number {
  let h = 2166136261
  for (let i = 0; i < str.length; i++) { h ^= str.charCodeAt(i); h = Math.imul(h, 16777619) }
  return h >>> 0
}

// 날짜 기준으로 고정된 '오늘의 종목' 실데이터 id 2개(결정적).
// 데이터 소스 = 매니페스트의 real 시나리오. 추후 서버 큐레이션으로 교체 가능.
export function getDailyScenarioIds(dateKey: string, m: Manifest): string[] {
  const reals = m.scenarios.filter((s) => s.source === 'real' && s.play_max >= 30).map((s) => s.id).sort()
  if (!reals.length) return []
  const ids: string[] = []
  const n = reals.length
  for (let k = 0; k < DAILY_FREE_PLAYS; k++) {
    let idx = hash(`${dateKey}#${k}`) % n
    // 중복 회피
    while (ids.includes(reals[idx])) idx = (idx + 1) % n
    ids.push(reals[idx])
  }
  return ids
}
