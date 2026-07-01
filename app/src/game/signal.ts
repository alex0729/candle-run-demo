import type { Bar } from './types'
import type { Bollinger, Ichimoku, Macd } from './indicators'

export interface IndPack {
  bb: Bollinger
  ma5: number[]
  ma20: number[]
  ma60: number[]
  rsi14: number[]
  macd: Macd
  volRatio20: number[]
  ichi: Ichimoku
}

export interface Score { score: number; label: string; value?: number; ratio?: number }
export interface SignalResult {
  score: number
  label: string
  className: 'bull' | 'bear' | 'neutral'
  components: { ma: Score; rsi: Score; macd: Score; volume: Score }
}

export function getMaScore(d: Bar[], p: IndPack, i: number): Score {
  const close = d[i].c, ma20 = p.ma20[i], ma60 = p.ma60[i]
  if (!isFinite(ma20) || !isFinite(ma60)) return { score: 0, label: 'MA 부족' }
  if (close > ma20 && ma20 > ma60) return { score: 2, label: 'MA 정배열' }
  if (close > ma20 && ma20 <= ma60) return { score: 1, label: '단기 반등' }
  if (close < ma20 && ma20 < ma60) return { score: -2, label: 'MA 역배열' }
  if (close < ma20) return { score: -1, label: '단기 약세' }
  return { score: 0, label: 'MA 중립' }
}

export function getRsiScore(_d: Bar[], p: IndPack, i: number): Score {
  const value = p.rsi14[i]
  if (!isFinite(value)) return { score: 0, label: 'RSI 부족', value }
  if (value >= 70) return { score: -1, label: `RSI 과열 ${value.toFixed(0)}`, value }
  if (value >= 50 && value < 70) return { score: 1, label: `RSI 안정 ${value.toFixed(0)}`, value }
  if (value <= 30) return { score: 1, label: `과매도 반등후보 ${value.toFixed(0)}`, value }
  if (value > 30 && value < 45) return { score: -1, label: `RSI 약세 ${value.toFixed(0)}`, value }
  return { score: 0, label: `RSI 중립 ${value.toFixed(0)}`, value }
}

export function getMacdScore(_d: Bar[], p: IndPack, i: number): Score {
  const line = p.macd.line[i], signal = p.macd.signal[i], hist = p.macd.hist[i], prevHist = p.macd.hist[i - 1]
  if (![line, signal, hist, prevHist].every(isFinite)) return { score: 0, label: 'MACD 부족' }
  let score = 0
  const labels: string[] = []
  if (line > signal) { score += 1; labels.push('MACD 양호') } else { score -= 1; labels.push('MACD 약세') }
  if (hist > prevHist) { score += 1; labels.push('모멘텀 개선') } else if (hist < prevHist) { score -= 1; labels.push('모멘텀 둔화') }
  score = Math.max(-2, Math.min(2, score))
  return { score, label: labels.join(' · ') }
}

export function getVolumeScore(d: Bar[], p: IndPack, i: number): Score {
  const cur = d[i], prev = d[i - 1], ratio = p.volRatio20[i]
  if (!prev || !isFinite(ratio)) return { score: 0, label: '거래량 부족', ratio }
  if (ratio >= 1.5 && cur.c > prev.c) return { score: 1, label: `거래량 급증 ${ratio.toFixed(1)}배`, ratio }
  if (ratio >= 1.5 && cur.c < prev.c) return { score: -1, label: `하락 거래량 ${ratio.toFixed(1)}배`, ratio }
  if (ratio < 0.7) return { score: 0, label: '거래량 위축', ratio }
  return { score: 0, label: '거래량 보통', ratio }
}

function label(score: number): string {
  if (score >= 5) return '강한 상승 후보'
  if (score >= 2) return '상승 우위'
  if (score >= -1) return '중립'
  if (score >= -4) return '하락 주의'
  return '강한 약세'
}
function className(score: number): 'bull' | 'bear' | 'neutral' {
  if (score >= 2) return 'bull'
  if (score <= -2) return 'bear'
  return 'neutral'
}

export function getSignalScore(d: Bar[], p: IndPack, i: number): SignalResult {
  const ma = getMaScore(d, p, i)
  const rsi = getRsiScore(d, p, i)
  const mac = getMacdScore(d, p, i)
  const volume = getVolumeScore(d, p, i)
  const score = ma.score + rsi.score + mac.score + volume.score
  return { score, label: label(score), className: className(score), components: { ma, rsi, macd: mac, volume } }
}
