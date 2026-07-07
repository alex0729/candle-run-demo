import { useEffect, useState } from 'react'
import { msToMidnight } from '../game/constants'

function fmt(ms: number): string {
  const t = Math.max(0, Math.floor(ms / 1000))
  const h = Math.floor(t / 3600), m = Math.floor((t % 3600) / 60), s = t % 60
  const p = (n: number) => String(n).padStart(2, '0')
  return `${p(h)}:${p(m)}:${p(s)}`
}

export default function MidnightTimer({ prefix = '자정 리셋까지 ' }: { prefix?: string }) {
  const [ms, setMs] = useState(msToMidnight())
  useEffect(() => {
    const t = setInterval(() => setMs(msToMidnight()), 1000)
    return () => clearInterval(t)
  }, [])
  return <span className="midnight-timer">{prefix}<b>{fmt(ms)}</b></span>
}
