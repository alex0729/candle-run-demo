import type { Manifest, Scenario, ScenarioMeta, Settings } from './types'

const DATA_BASE = import.meta.env.BASE_URL + 'data'

let manifestCache: Manifest | null = null
const scenarioCache = new Map<string, Scenario>()

export async function loadManifest(): Promise<Manifest> {
  if (manifestCache) return manifestCache
  // manifest.json은 URL이 고정이라 force-cache 시 배포 후에도 옛 목록(삭제된 종목 포함)을
  // 계속 쓰게 됨 → 반드시 재검증(no-cache)해서 최신 목록을 받는다.
  const res = await fetch(`${DATA_BASE}/manifest.json`, { cache: 'no-cache' })
  if (!res.ok) throw new Error('manifest load failed: ' + res.status)
  manifestCache = (await res.json()) as Manifest
  return manifestCache
}

export function filterScenarios(m: Manifest, s: Settings): ScenarioMeta[] {
  let pool = m.scenarios
  if (s.market !== 'ALL') pool = pool.filter((x) => x.market === s.market)
  if (s.recentOnly) {
    const recent = pool.filter((x) => x.recent)
    if (recent.length >= 10) pool = recent
  }
  // 난이도는 하드 필터 대신 가중치로: 초보는 beginner/normal 우선
  const byMode = pool.filter((x) => x.play_max >= Math.min(s.mode, 30))
  return byMode.length ? byMode : pool
}

function weightedPick(pool: ScenarioMeta[], s: Settings): ScenarioMeta {
  const weight = (x: ScenarioMeta): number => {
    let w = 1
    if (s.difficulty === 'beginner') w *= x.difficulty === 'beginner' ? 3 : x.difficulty === 'normal' ? 1.5 : 0.4
    else if (s.difficulty === 'advanced') w *= x.difficulty === 'advanced' ? 3 : x.difficulty === 'normal' ? 1.5 : 0.5
    if (!s.recentOnly && x.recent) w *= 1.4 // 최근 데이터 소폭 우대
    return w
  }
  const total = pool.reduce((a, x) => a + weight(x), 0)
  let r = Math.random() * total
  for (const x of pool) {
    r -= weight(x)
    if (r <= 0) return x
  }
  return pool[pool.length - 1]
}

export async function pickScenario(s: Settings): Promise<Scenario> {
  const m = await loadManifest()
  const pool = filterScenarios(m, s)
  const meta = weightedPick(pool, s)
  return fetchScenario(meta.id)
}

export async function fetchScenario(id: string): Promise<Scenario> {
  const cached = scenarioCache.get(id)
  if (cached) return cached
  const res = await fetch(`${DATA_BASE}/scenarios/${id}.json`, { cache: 'force-cache' })
  if (!res.ok) throw new Error('scenario load failed: ' + id)
  const scn = (await res.json()) as Scenario
  scenarioCache.set(id, scn)
  return scn
}
