// 추후 실제 화면/서버로 교체 가능한 지점을 상수로 분리
export const INVEST_LINK = '#' // TODO: 실제 투자정보 화면 URL로 교체
export const DAILY_FREE_PLAYS = 2 // 하루 오늘의 종목 무료 판수

// 날짜/월 키 유틸 (앱 런타임 전용)
const pad = (n: number) => String(n).padStart(2, '0')
export const dayKey = (d: Date = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}`
export const yesterdayKey = () => { const d = new Date(); d.setDate(d.getDate() - 1); return dayKey(d) }
export function msToMidnight(): number {
  const n = new Date()
  const m = new Date(n.getFullYear(), n.getMonth(), n.getDate() + 1, 0, 0, 0, 0)
  return m.getTime() - n.getTime()
}
