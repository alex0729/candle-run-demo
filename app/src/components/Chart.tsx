import { useEffect, useRef } from 'react'
import type { GameState } from '../game/engine'
import type { IndicatorFlags } from '../game/types'
import { ChartColors, drawChart, readColors } from './chartDraw'

interface Props {
  game: GameState
  flags: IndicatorFlags
  mode: 'play' | 'reveal'
  tick?: number
}

export default function Chart({ game, flags, mode, tick }: Props) {
  const wrapRef = useRef<HTMLDivElement>(null)
  const canvasRef = useRef<HTMLCanvasElement>(null)
  const colorsRef = useRef<ChartColors | null>(null)

  useEffect(() => { colorsRef.current = readColors() }, [])

  useEffect(() => {
    const wrap = wrapRef.current
    const canvas = canvasRef.current
    if (!wrap || !canvas) return
    const ctx = canvas.getContext('2d')
    if (!ctx) return

    const render = () => {
      const rect = wrap.getBoundingClientRect()
      const W = Math.max(200, rect.width)
      const H = Math.max(160, rect.height)
      const dpr = window.devicePixelRatio || 1
      canvas.width = Math.round(W * dpr)
      canvas.height = Math.round(H * dpr)
      canvas.style.width = W + 'px'
      canvas.style.height = H + 'px'
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0)
      drawChart(ctx, game, W, H, mode, colorsRef.current ?? readColors(), flags)
    }

    render()
    const ro = new ResizeObserver(render)
    ro.observe(wrap)
    return () => ro.disconnect()
  }, [game, flags, mode, tick])

  return (
    <div ref={wrapRef} className={`chart-wrap ${mode}`}>
      <canvas ref={canvasRef} />
    </div>
  )
}
