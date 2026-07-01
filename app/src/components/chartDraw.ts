import type { GameState } from '../game/engine'
import type { IndicatorFlags } from '../game/types'

export interface ChartColors {
  up: string; down: string; gold: string; ma5: string; ma20: string; ma60: string
  tenkan: string; kijun: string; chikou: string; line: string; text: string
  axis: string; volUp: string; volDown: string
}

export function readColors(): ChartColors {
  const cs = getComputedStyle(document.documentElement)
  const v = (n: string, fb: string) => cs.getPropertyValue(n).trim() || fb
  return {
    up: v('--up', '#f0334b'), down: v('--down', '#2f6bff'), gold: v('--gold', '#e8a300'),
    ma5: v('--ma5', '#495168'), ma20: v('--ma20', '#e8a300'), ma60: v('--ma60', '#0891b2'),
    tenkan: v('--tenkan', '#38bdf8'), kijun: v('--kijun', '#fb7185'), chikou: v('--chikou', '#c084fc'),
    line: v('--chart-grid', 'rgba(20,30,50,.07)'),
    text: v('--txt', '#171c26'),
    axis: v('--chart-axis', 'rgba(30,40,60,.5)'),
    volUp: v('--chart-vol-up', 'rgba(240,51,75,.55)'),
    volDown: v('--chart-vol-down', 'rgba(47,107,255,.5)'),
  }
}

const fmtPx = (n: number) => Math.round(n).toLocaleString('ko-KR')

export function drawChart(
  c: CanvasRenderingContext2D,
  g: GameState,
  W: number,
  H: number,
  mode: 'play' | 'reveal',
  COL: ChartColors,
  flags: IndicatorFlags,
) {
  const volOn = flags.vol
  const padL = 6, padR = 6, padT = 8
  const volH = volOn ? Math.min(52, H * 0.18) : 0
  const gap = volOn ? 8 : 0
  const priceH = H - volH - gap - padT - 2
  const d = g.scenario.data
  const I = g.ind

  c.clearRect(0, 0, W, H)
  const L = g.visible
  let drawStart: number, drawEnd: number, proj: number
  if (mode === 'reveal') {
    drawStart = Math.max(0, g.start - 12)
    drawEnd = g.start + g.budgetMax
    proj = 0
  } else {
    const win = Math.max(30, Math.min(90, Math.round((W - padL - padR) / 8)))
    drawStart = Math.max(0, L - win + 1)
    drawEnd = L
    proj = flags.ichimoku ? I.ichi.shift : 1
  }
  const slots = drawEnd - drawStart + 1 + proj
  const sw = (W - padL - padR) / slots
  const xAt = (i: number) => padL + (i - drawStart + 0.5) * sw

  let mn = Infinity, mx = -Infinity
  const inc = (v: number) => { if (isFinite(v)) { if (v < mn) mn = v; if (v > mx) mx = v } }
  for (let i = drawStart; i <= drawEnd && i <= L; i++) {
    inc(d[i].h); inc(d[i].l)
    if (flags.bb) { inc(I.bb.up[i]); inc(I.bb.lo[i]) }
    if (flags.ma) { inc(I.ma5[i]); inc(I.ma20[i]); inc(I.ma60[i]) }
  }
  if (flags.ichimoku) {
    for (let p = drawStart; p <= drawEnd + proj; p++) { const r = p - I.ichi.shift; if (r >= 0 && r <= L) { inc(I.ichi.spanA[r]); inc(I.ichi.spanB[r]) } }
    for (let i = drawStart; i <= Math.min(drawEnd, L); i++) { inc(I.ichi.tenkan[i]); inc(I.ichi.kijun[i]) }
  }
  if (!isFinite(mn)) { mn = 0; mx = 1 }
  const padY = (mx - mn) * 0.08; mn -= padY; mx += padY
  const yAt = (v: number) => padT + priceH - ((v - mn) / (mx - mn)) * priceH

  // grid
  c.strokeStyle = COL.line; c.lineWidth = 1; c.font = '9px JetBrains Mono'
  for (let gr = 0; gr <= 4; gr++) {
    const y = padT + (priceH * gr) / 4
    c.beginPath(); c.moveTo(padL, y); c.lineTo(W - padR, y); c.stroke()
    c.fillStyle = COL.axis; c.textAlign = 'left'
    c.fillText(fmtPx(mx - ((mx - mn) * gr) / 4), padL + 2, y - 3)
  }

  // ichimoku cloud
  if (flags.ichimoku) {
    const top: { x: number; a: number; b: number }[] = []
    for (let p = drawStart; p <= drawEnd + proj; p++) {
      const r = p - I.ichi.shift; if (r < 0 || r > L) continue
      const a = I.ichi.spanA[r], b = I.ichi.spanB[r]; if (!isFinite(a) || !isFinite(b)) continue
      top.push({ x: xAt(p), a, b })
    }
    for (let i = 0; i < top.length - 1; i++) {
      const p0 = top[i], p1 = top[i + 1]; const bull = p0.a >= p0.b
      c.beginPath(); c.moveTo(p0.x, yAt(p0.a)); c.lineTo(p1.x, yAt(p1.a)); c.lineTo(p1.x, yAt(p1.b)); c.lineTo(p0.x, yAt(p0.b)); c.closePath()
      c.fillStyle = bull ? 'rgba(34,211,150,.13)' : 'rgba(255,71,87,.12)'; c.fill()
    }
    const drawSpan = (key: 'spanA' | 'spanB', color: string) => {
      c.strokeStyle = color; c.lineWidth = 1; c.beginPath(); let st = false
      for (let p = drawStart; p <= drawEnd + proj; p++) { const r = p - I.ichi.shift; if (r < 0 || r > L) continue; const v = I.ichi[key][r]; if (!isFinite(v)) continue; const x = xAt(p), y = yAt(v); st ? c.lineTo(x, y) : c.moveTo(x, y); st = true }
      c.stroke()
    }
    drawSpan('spanA', 'rgba(34,211,150,.5)'); drawSpan('spanB', 'rgba(255,71,87,.45)')
  }

  // bollinger
  if (flags.bb) {
    const band = (key: 'up' | 'lo' | 'mid') => { c.beginPath(); let st = false; for (let i = drawStart; i <= Math.min(drawEnd, L); i++) { const v = I.bb[key][i]; if (!isFinite(v)) continue; const x = xAt(i), y = yAt(v); st ? c.lineTo(x, y) : c.moveTo(x, y); st = true } c.stroke() }
    c.strokeStyle = 'rgba(167,139,250,.55)'; c.lineWidth = 1; band('up'); band('lo')
    c.strokeStyle = 'rgba(167,139,250,.28)'; c.setLineDash([3, 3]); band('mid'); c.setLineDash([])
  }

  // moving averages
  if (flags.ma) {
    const mline = (arr: number[], color: string) => { c.strokeStyle = color; c.lineWidth = 1.4; c.beginPath(); let st = false; for (let i = drawStart; i <= Math.min(drawEnd, L); i++) { const v = arr[i]; if (!isFinite(v)) continue; const x = xAt(i), y = yAt(v); st ? c.lineTo(x, y) : c.moveTo(x, y); st = true } c.stroke() }
    mline(I.ma60, COL.ma60); mline(I.ma20, COL.ma20); mline(I.ma5, COL.ma5)
  }

  // chikou
  if (flags.ichimoku) {
    c.strokeStyle = 'rgba(192,132,252,.55)'; c.lineWidth = 1; c.beginPath(); let st = false
    for (let i = drawStart; i <= Math.min(drawEnd, L); i++) { const p = i - I.ichi.shift; if (p < drawStart) continue; const x = xAt(p), y = yAt(d[i].c); st ? c.lineTo(x, y) : c.moveTo(x, y); st = true }
    c.stroke()
  }

  // candles (한국식: 상승 빨강 / 하락 파랑)
  const bw = Math.max(2, sw * 0.62)
  for (let i = drawStart; i <= Math.min(drawEnd, L); i++) {
    const bar = d[i], x = xAt(i), up = bar.c >= bar.o, col = up ? COL.up : COL.down
    c.strokeStyle = col; c.fillStyle = col; c.lineWidth = 1
    c.beginPath(); c.moveTo(x, yAt(bar.h)); c.lineTo(x, yAt(bar.l)); c.stroke()
    const yo = yAt(bar.o), yc = yAt(bar.c), top = Math.min(yo, yc), hgt = Math.max(1.5, Math.abs(yo - yc))
    c.fillRect(x - bw / 2, top, bw, hgt)
  }

  // decision line
  if (g.start >= drawStart && g.start <= drawEnd) {
    const x = xAt(g.start) + sw / 2; c.strokeStyle = 'rgba(245,179,1,.25)'; c.setLineDash([2, 4])
    c.beginPath(); c.moveTo(x, padT); c.lineTo(x, padT + priceH); c.stroke(); c.setLineDash([])
  }

  // markers
  const marker = (idx: number, side: 'long' | 'short', kind: 'entry' | 'exit') => {
    if (idx < drawStart || idx > drawEnd) return
    const x = xAt(idx), y = yAt(d[idx].c)
    c.save(); c.translate(x, y)
    const col = side === 'long' ? COL.up : COL.down
    if (kind === 'entry') {
      c.fillStyle = col; c.beginPath()
      if (side === 'long') { c.moveTo(0, 8); c.lineTo(-6, 18); c.lineTo(6, 18) } else { c.moveTo(0, -8); c.lineTo(-6, -18); c.lineTo(6, -18) }
      c.closePath(); c.fill()
      c.fillStyle = '#fff'; c.font = '900 8px Noto Sans KR'; c.textAlign = 'center'
      c.fillText(side === 'long' ? '매수' : '공매도', 0, side === 'long' ? 30 : -22)
    } else {
      c.strokeStyle = COL.gold; c.fillStyle = 'rgba(245,179,1,.9)'; c.lineWidth = 2
      c.beginPath(); c.arc(0, 0, 5, 0, 7); c.fill()
      c.fillStyle = COL.gold; c.font = '900 8px Noto Sans KR'; c.textAlign = 'center'; c.fillText('청산', 0, -12)
    }
    c.restore()
  }
  if (g.pos) marker(g.pos.at, g.pos.side, 'entry')
  if (g.exit) marker(g.exit.at, g.pos ? g.pos.side : 'long', 'exit')

  // best trade markers (reveal)
  if (mode === 'reveal' && g.best) {
    const dia = (idx: number, col: string) => { const x = xAt(idx), y = yAt(d[idx].c); c.save(); c.translate(x, y); c.rotate(Math.PI / 4); c.strokeStyle = col; c.lineWidth = 1.5; c.strokeRect(-4, -4, 8, 8); c.restore() }
    dia(g.best.ei, 'rgba(255,255,255,.85)'); dia(g.best.xi, 'rgba(255,255,255,.85)')
  }

  // volume subchart
  if (volOn) {
    let vmx = 0; for (let i = drawStart; i <= Math.min(drawEnd, L); i++) vmx = Math.max(vmx, d[i].v)
    const vy0 = H - volH
    c.fillStyle = COL.axis; c.font = '9px JetBrains Mono'; c.textAlign = 'left'; c.fillText('VOL', padL + 2, vy0 + 10)
    for (let i = drawStart; i <= Math.min(drawEnd, L); i++) {
      const bar = d[i], x = xAt(i), up = bar.c >= bar.o, h = Math.max(1, (bar.v / vmx) * (volH - 6))
      c.fillStyle = up ? COL.volUp : COL.volDown
      c.fillRect(x - bw / 2, H - h, bw, h)
    }
  }
}
