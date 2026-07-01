export type Market = 'KOSPI' | 'KOSDAQ'
export type Difficulty = 'beginner' | 'normal' | 'advanced'
export type Pattern = 'uptrend' | 'downtrend' | 'sideways' | 'volatile'
export type Source = 'real' | 'synthetic'
export type Side = 'long' | 'short'

export interface Bar {
  date?: string
  o: number
  h: number
  l: number
  c: number
  v: number
}

export interface ScenarioMeta {
  id: string
  market: Market
  sector: string
  source: Source
  blind_label: string
  warmup: number
  play_max: number
  start_date?: string
  end_date?: string
  pattern: Pattern
  difficulty: Difficulty
  recent: boolean
}

export interface Scenario extends ScenarioMeta {
  name: string | null
  code: string | null
  data: Bar[]
}

export interface Manifest {
  version: string
  generated_at: string
  warmup: number
  markets: Market[]
  count: number
  by_market: Record<string, number>
  by_source: Record<string, number>
  recent_count: number
  scenarios: ScenarioMeta[]
}

export interface IndicatorFlags {
  ma: boolean
  rsi: boolean
  macd: boolean
  vol: boolean
  bb: boolean
  ichimoku: boolean
}

export interface Settings {
  difficulty: Difficulty
  market: 'ALL' | Market
  mode: number // play bars budget
  recentOnly: boolean
  ind: IndicatorFlags
}
