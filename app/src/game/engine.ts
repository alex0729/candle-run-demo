import type { Scenario, Settings, Side } from './types'
import { bollinger, ichimoku, macd, rsi, sma, volumeRatio } from './indicators'
import { getSignalScore, IndPack, SignalResult } from './signal'

export const SEED_KRW = 1_000_000       // 페이북겜머니 시작금액 100만원
export const REWARD_BASE = 1_000_000

export interface Position { side: Side; price: number; at: number }
export interface BestTrade { side: Side; ret: number; ei: number; xi: number }

export interface GameState {
  scenario: Scenario
  ind: IndPack
  budgetMax: number
  start: number
  visible: number
  budget: number
  pos: Position | null
  exit: { price: number; at: number } | null
  over: boolean
  noTrade: boolean
  tipRemaining: number
  tipUsedByIndex: Record<number, boolean>
  entrySignal: SignalResult | null
  exitSignal: SignalResult | null
  // benchmark (동일기간 추정)
  bench: number[]
  // filled on result
  best?: BestTrade
  myRet?: number
  holdBars?: number
  bnhRet?: number
  benchRet?: number
}

export function buildIndicators(s: Scenario): IndPack {
  const d = s.data
  return {
    bb: bollinger(d),
    ma5: sma(d, 5), ma20: sma(d, 20), ma60: sma(d, 60),
    rsi14: rsi(d, 14),
    macd: macd(d),
    volRatio20: volumeRatio(d, 20),
    ichi: ichimoku(d),
  }
}

// 동일기간 벤치마크(추정): 종목 수익경로를 완화(β≈0.5)한 시장 추정선
function buildBench(s: Scenario): number[] {
  const d = s.data
  const beta = 0.5
  const out: number[] = []
  let base = 100
  out.push(base)
  for (let i = 1; i < d.length; i++) {
    const r = (d[i].c - d[i - 1].c) / d[i - 1].c
    base *= 1 + r * beta
    out.push(base)
  }
  return out
}

export function createGame(s: Scenario, settings: Settings): GameState {
  const start = s.warmup
  const budgetMax = Math.min(settings.mode, s.play_max)
  const tipRemaining = settings.difficulty === 'beginner' ? 3 : settings.difficulty === 'advanced' ? 1 : 2
  return {
    scenario: s,
    ind: buildIndicators(s),
    budgetMax,
    start,
    visible: start,
    budget: budgetMax,
    pos: null,
    exit: null,
    over: false,
    noTrade: false,
    tipRemaining,
    tipUsedByIndex: {},
    entrySignal: null,
    exitSignal: null,
    bench: buildBench(s),
  }
}

export function curPrice(g: GameState): number {
  return g.scenario.data[g.visible].c
}
export function signalAt(g: GameState, i = g.visible): SignalResult {
  return getSignalScore(g.scenario.data, g.ind, i)
}
export function pnlNow(g: GameState): number {
  if (!g.pos) return 0
  const p = curPrice(g)
  return g.pos.side === 'long' ? (p - g.pos.price) / g.pos.price : (g.pos.price - p) / g.pos.price
}

function bestTrade(g: GameState): BestTrade {
  const d = g.scenario.data
  const a = g.start, b = g.start + g.budgetMax
  let bl = -Infinity, bli = a, blj = a, minI = a
  for (let j = a; j <= b; j++) {
    if (d[j].c < d[minI].c) minI = j
    const r = (d[j].c - d[minI].c) / d[minI].c
    if (r > bl) { bl = r; bli = minI; blj = j }
  }
  let bs = -Infinity, bsi = a, bsj = a, maxI = a
  for (let j = a; j <= b; j++) {
    if (d[j].c > d[maxI].c) maxI = j
    const r = (d[maxI].c - d[j].c) / d[maxI].c
    if (r > bs) { bs = r; bsi = maxI; bsj = j }
  }
  if (bl >= bs) return { side: 'long', ret: bl, ei: bli, xi: blj }
  return { side: 'short', ret: bs, ei: bsi, xi: bsj }
}

export function computeResult(g: GameState): void {
  const d = g.scenario.data
  g.best = bestTrade(g)
  if (g.pos && g.exit) {
    g.myRet = g.pos.side === 'long'
      ? (g.exit.price - g.pos.price) / g.pos.price
      : (g.pos.price - g.exit.price) / g.pos.price
    g.holdBars = g.exit.at - g.pos.at
  } else {
    g.myRet = 0; g.holdBars = 0
  }
  const endIdx = g.visible
  g.bnhRet = (d[endIdx].c - d[g.start].c) / d[g.start].c
  g.benchRet = (g.bench[endIdx] - g.bench[g.start]) / g.bench[g.start]
}

export interface Review { good: string; risk: string }
export function generateReview(g: GameState): Review {
  const bnhRet = g.bnhRet ?? 0
  if (g.noTrade) {
    return bnhRet < 0
      ? { good: '관망은 좋은 선택이었습니다. 이후 가격이 하락했기 때문에 무리하게 진입하지 않은 판단이 손실을 피하는 데 도움이 되었습니다.', risk: '다만 관망만 반복하면 좋은 기회를 놓칠 수 있습니다. 상승 신호가 겹치는 구간에서는 소액 진입을 검토해 보세요.' }
      : { good: '관망으로 손실 리스크는 피했습니다.', risk: '이후 가격이 상승했기 때문에 기회를 놓친 면이 있습니다. MA·MACD·거래량이 함께 개선되고 있었다면 진입 후보로 볼 수 있었습니다.' }
  }
  const entry = g.entrySignal, exit = g.exitSignal, r = g.myRet ?? 0
  if (r > 0 && entry && entry.score >= 2)
    return {
      good: `매수 시점 Signal은 ${entry.score >= 0 ? '+' : ''}${entry.score}, ${entry.label}였습니다. 추세와 모멘텀이 양호해 진입 판단은 지표상 합리적이었습니다.`,
      risk: exit && exit.score >= 2
        ? '청산 시점에도 상승 신호가 일부 남아 있었습니다. 전량 매도보다 분할 매도 전략도 고려할 수 있습니다.'
        : '수익 구간에서 신호가 약해질 때 청산한 점은 리스크 관리 측면에서 긍정적입니다.',
    }
  if (r <= 0 && entry && (entry.components.rsi.value ?? 0) >= 70)
    return {
      good: '결과는 아쉬웠지만, 과열 구간의 리스크를 학습할 수 있는 사례입니다.',
      risk: '매수 시점 RSI가 높아 단기 과열 가능성이 있었습니다. 이런 구간에서는 조정 후 재상승 여부를 확인하는 편이 안정적입니다.',
    }
  if (r <= 0)
    return {
      good: '손실 결과를 통해 약세 신호에서의 진입 리스크를 확인할 수 있었습니다.',
      risk: entry ? `진입 시점 Signal은 ${entry.score >= 0 ? '+' : ''}${entry.score}, ${entry.label}였습니다. 상승 근거가 충분치 않았다면 관망이 더 안정적이었을 수 있습니다.` : '진입 당시 지표 근거가 충분했는지 복기해 보세요.',
    }
  return {
    good: '수익으로 마무리했습니다. 진입과 청산 타이밍이 전반적으로 나쁘지 않았습니다.',
    risk: '다음에는 진입 시점의 거래량과 RSI 과열 여부를 함께 확인해 보세요.',
  }
}

export interface Tip { title: string; reasons: string[]; guide: string }
export function generateTip(g: GameState): Tip {
  const sig = signalAt(g)
  const pnl = g.pos ? pnlNow(g) : 0
  const rsiValue = sig.components.rsi.value ?? NaN
  if (!g.pos && sig.score >= 5)
    return { title: '강한 상승 후보 구간입니다', reasons: ['추세·모멘텀·거래량이 함께 개선되고 있습니다.', sig.components.ma.label, sig.components.macd.label, sig.components.volume.label], guide: '매수를 고려할 수 있는 구간입니다. 다만 이미 많이 오른 직후라면 추격 리스크가 있으니 손절 기준을 함께 정하세요.' }
  if (!g.pos && sig.score >= 2)
    return { title: '상승 우위 구간입니다', reasons: ['가격 흐름이 비교적 양호합니다.', sig.components.ma.label, sig.components.rsi.label, sig.components.macd.label], guide: '매수를 고려할 수 있습니다. 거래량이 부족하면 한 봉 더 확인하는 선택도 가능합니다.' }
  if (!g.pos && sig.score <= -2)
    return { title: '하락 주의 구간입니다', reasons: ['현재 지표는 약세 쪽에 가깝습니다.', sig.components.ma.label, sig.components.macd.label, sig.components.volume.label], guide: '신규 매수보다는 관망이 안정적일 수 있습니다. 반등을 노린다면 거래량 증가와 MA20 회복을 함께 확인하세요.' }
  if (g.pos && pnl > 0 && isFinite(rsiValue) && rsiValue >= 70)
    return { title: '수익 중이지만 과열 신호가 있습니다', reasons: [`RSI가 ${rsiValue.toFixed(0)}로 높은 편입니다.`, '단기 조정 가능성이 커질 수 있습니다.', sig.components.macd.label], guide: '계속 보유할 수 있지만 일부 수익 실현이나 손절 기준 상향을 고려할 수 있습니다.' }
  if (g.pos && pnl > 0 && sig.score >= 2)
    return { title: '수익 중이고 추세도 유지되고 있습니다', reasons: [sig.components.ma.label, sig.components.macd.label, sig.components.rsi.label], guide: '보유를 이어갈 수 있습니다. 다만 MA20 이탈이나 MACD 약화가 나오면 매도를 검토하세요.' }
  if (g.pos && pnl < 0 && sig.score <= -2)
    return { title: '손실 중이고 지표도 약합니다', reasons: [sig.components.ma.label, sig.components.macd.label, sig.components.volume.label], guide: '무작정 버티기보다 매도나 손실 제한 기준을 고려할 수 있습니다.' }
  return { title: '방향성이 뚜렷하지 않은 구간입니다', reasons: [sig.components.ma.label, sig.components.rsi.label, sig.components.macd.label, sig.components.volume.label], guide: '무리하게 판단하기보다 한 봉 더 확인하는 선택이 안정적일 수 있습니다.' }
}

export function verdictOf(g: GameState): string {
  if (g.noTrade) return '노 트레이드'
  const r = g.myRet ?? 0
  if (r > 0.15) return '🔥 대박 청산'
  if (r > 0.02) return '👍 수익 청산'
  if (r > -0.02) return '본전 청산'
  return '😵 손절 청산'
}
