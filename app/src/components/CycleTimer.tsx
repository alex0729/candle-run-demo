import { useEffect, useState } from 'react'
import { cyclePhase, msToCycleClose, msToCycleOpen } from '../game/constants'

function hms(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

// 사이클(19시 개장 → 18시 마감) 카운트다운. 결산(18~19시) 중엔 개장까지, 아니면 마감까지.
export default function CycleTimer({ prefix }: { prefix?: string }) {
  const [, tick] = useState(0)
  useEffect(() => {
    const t = setInterval(() => tick((x) => x + 1), 1000)
    return () => clearInterval(t)
  }, [])
  const settling = cyclePhase() === 'settlement'
  const ms = settling ? msToCycleOpen() : msToCycleClose()
  const label = prefix ?? (settling ? '새 라운드 개장까지 ' : '오늘의 승부 마감까지 ')
  return <span className="cycle-timer">{label}<b>{hms(ms)}</b></span>
}
