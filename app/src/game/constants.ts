// 추후 실제 화면/서버로 교체 가능한 지점을 상수로 분리
export const INVEST_LINK = '#' // TODO: 실제 투자정보 화면 URL로 교체
export const DAILY_FREE_PLAYS = 2 // 한 사이클 무료 판수(이후 광고 시청 시 이어하기)

export const START_MONEY = 1_000_000 // 매 사이클 시작 페이북겜머니(100만)
export const CYCLE_CLOSE_HOUR = 18 // 마감·결산 시각(저녁 6시)
export const CYCLE_OPEN_HOUR = 19  // 다음 라운드 개장 시각(저녁 7시)
export const PRIZES = [30_000, 20_000, 10_000] // 1·2·3등 페이북머니(원)

// 날짜/월 키 유틸 (앱 런타임 전용)
const pad = (n: number) => String(n).padStart(2, '0')
const ymd = (d: Date) => `${d.getFullYear()}${pad(d.getMonth() + 1)}${pad(d.getDate())}`
export const dayKey = (d: Date = new Date()) => ymd(d)
export const monthKey = (d: Date = new Date()) => `${d.getFullYear()}${pad(d.getMonth() + 1)}`

// 게임 사이클: 매일 19시(개장) → 다음날 18시(마감), 18~19시는 결산(입상 발표) 구간.
// 사이클 키 = 그 사이클이 "개장한 날짜"(19시 이전이면 어제 개장분에 속함).
export function cycleKey(d: Date = new Date()): string {
  const base = new Date(d.getTime())
  if (d.getHours() < CYCLE_OPEN_HOUR) base.setDate(base.getDate() - 1)
  return ymd(base)
}
// 직전 사이클 키(연속 출석 판정용)
export const prevCycleKey = (d: Date = new Date()) => cycleKey(new Date(d.getTime() - 86_400_000))

export type CyclePhase = 'play' | 'settlement'
export function cyclePhase(d: Date = new Date()): CyclePhase {
  const h = d.getHours()
  return h >= CYCLE_CLOSE_HOUR && h < CYCLE_OPEN_HOUR ? 'settlement' : 'play'
}

// 지금부터 다음 특정 시각(hour:00)까지 남은 ms
function msToNextHour(hour: number, d: Date = new Date()): number {
  const t = new Date(d.getFullYear(), d.getMonth(), d.getDate(), hour, 0, 0, 0)
  if (t.getTime() <= d.getTime()) t.setDate(t.getDate() + 1)
  return t.getTime() - d.getTime()
}
export const msToCycleClose = (d: Date = new Date()) => msToNextHour(CYCLE_CLOSE_HOUR, d) // 마감(18시)까지
export const msToCycleOpen = (d: Date = new Date()) => msToNextHour(CYCLE_OPEN_HOUR, d)   // 개장(19시)까지
