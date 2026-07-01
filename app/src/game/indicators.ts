import type { Bar } from './types'

export function sma(d: Bar[], p: number): number[] {
  const o = Array(d.length).fill(NaN)
  let s = 0
  for (let i = 0; i < d.length; i++) {
    s += d[i].c
    if (i >= p) s -= d[i - p].c
    if (i >= p - 1) o[i] = s / p
  }
  return o
}

export interface Bollinger { mid: number[]; up: number[]; lo: number[] }
export function bollinger(d: Bar[], p = 20, k = 2): Bollinger {
  const mid = sma(d, p)
  const up = Array(d.length).fill(NaN)
  const lo = Array(d.length).fill(NaN)
  for (let i = p - 1; i < d.length; i++) {
    const m = mid[i]
    let v = 0
    for (let j = i - p + 1; j <= i; j++) v += (d[j].c - m) ** 2
    const sd = Math.sqrt(v / p)
    up[i] = m + k * sd
    lo[i] = m - k * sd
  }
  return { mid, up, lo }
}

function hh(d: Bar[], i: number, p: number): number {
  let m = -Infinity
  for (let j = i - p + 1; j <= i; j++) if (j >= 0) m = Math.max(m, d[j].h)
  return m
}
function ll(d: Bar[], i: number, p: number): number {
  let m = Infinity
  for (let j = i - p + 1; j <= i; j++) if (j >= 0) m = Math.min(m, d[j].l)
  return m
}

export interface Ichimoku {
  tenkan: number[]; kijun: number[]; spanA: number[]; spanB: number[]; shift: number
}
export function ichimoku(d: Bar[]): Ichimoku {
  const n = d.length
  const tenkan = Array(n).fill(NaN)
  const kijun = Array(n).fill(NaN)
  const spanA = Array(n).fill(NaN)
  const spanB = Array(n).fill(NaN)
  for (let i = 0; i < n; i++) {
    if (i >= 8) tenkan[i] = (hh(d, i, 9) + ll(d, i, 9)) / 2
    if (i >= 25) kijun[i] = (hh(d, i, 26) + ll(d, i, 26)) / 2
    if (i >= 25) spanA[i] = (tenkan[i] + kijun[i]) / 2
    if (i >= 51) spanB[i] = (hh(d, i, 52) + ll(d, i, 52)) / 2
  }
  return { tenkan, kijun, spanA, spanB, shift: 26 }
}

export function rsi(d: Bar[], period = 14): number[] {
  const out = Array(d.length).fill(NaN)
  if (d.length <= period) return out
  let gain = 0, loss = 0
  for (let i = 1; i <= period; i++) {
    const diff = d[i].c - d[i - 1].c
    if (diff >= 0) gain += diff
    else loss -= diff
  }
  gain /= period; loss /= period
  out[period] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)
  for (let i = period + 1; i < d.length; i++) {
    const diff = d[i].c - d[i - 1].c
    const g = diff > 0 ? diff : 0
    const l = diff < 0 ? -diff : 0
    gain = (gain * (period - 1) + g) / period
    loss = (loss * (period - 1) + l) / period
    out[i] = loss === 0 ? 100 : 100 - 100 / (1 + gain / loss)
  }
  return out
}

export function ema(values: number[], period: number): number[] {
  const out = Array(values.length).fill(NaN)
  if (!values.length) return out
  const k = 2 / (period + 1)
  let prev = values[0]
  out[0] = prev
  for (let i = 1; i < values.length; i++) {
    prev = values[i] * k + prev * (1 - k)
    out[i] = prev
  }
  return out
}

export interface Macd { line: number[]; signal: number[]; hist: number[] }
export function macd(d: Bar[], fast = 12, slow = 26, signalPeriod = 9): Macd {
  const closes = d.map((x) => x.c)
  const f = ema(closes, fast)
  const sl = ema(closes, slow)
  const line = closes.map((_, i) => f[i] - sl[i])
  const signal = ema(line, signalPeriod)
  const hist = line.map((v, i) => v - signal[i])
  return { line, signal, hist }
}

export function volumeRatio(d: Bar[], period = 20): number[] {
  const out = Array(d.length).fill(NaN)
  let sum = 0
  for (let i = 0; i < d.length; i++) {
    sum += d[i].v
    if (i >= period) sum -= d[i - period].v
    if (i >= period - 1) {
      const avg = sum / period
      out[i] = avg > 0 ? d[i].v / avg : NaN
    }
  }
  return out
}
