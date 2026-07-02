// 리더보드 프로토타입 — 페이북머니 점수 기준. 백엔드 연동 전 목업.
// 주간/월간 TOP 20. 플레이로 쌓은 페이북머니로 순위를 매김.

export interface LbEntry { name: string; tag?: string; money: number }

const WEEKLY: LbEntry[] = [
  { name: '차트도사', tag: '서울', money: 52400 },
  { name: '불꽃매매', tag: '부산', money: 48900 },
  { name: '캔들킬러', money: 45200 },
  { name: '삼전존버', tag: '수원', money: 41800 },
  { name: '골든크로스', money: 38600 },
  { name: '월가의늑대', money: 35900 },
  { name: '단타왕', tag: '대구', money: 33100 },
  { name: '존버는승리', money: 30700 },
  { name: '급등주헌터', money: 28400 },
  { name: '차트읽는남자', money: 26200 },
  { name: '눌림목장인', money: 24300 },
  { name: '수급의신', tag: '인천', money: 22500 },
  { name: '역발상투자', money: 20800 },
  { name: '분할매수', money: 19200 },
  { name: '리스크관리', money: 17700 },
  { name: '우상향believer', money: 16300 },
  { name: '캔들초보', money: 14900 },
  { name: '손절도용기', money: 13600 },
  { name: '관망의미학', money: 12400 },
  { name: '내일은상한가', money: 11200 },
]

const MONTHLY: LbEntry[] = [
  { name: '월가의늑대', tag: '부산', money: 148000 },
  { name: '차트도사', tag: '서울', money: 132000 },
  { name: '연금술사', money: 119000 },
  { name: '캔들킬러', money: 107000 },
  { name: '추세추종자', tag: '대전', money: 96000 },
  { name: '불꽃매매', tag: '부산', money: 86500 },
  { name: '스윙마스터', money: 77800 },
  { name: '삼전존버', tag: '수원', money: 70000 },
  { name: '급등주헌터', money: 63000 },
  { name: '골든크로스', money: 56700 },
  { name: '수급의신', tag: '인천', money: 51000 },
  { name: '단타왕', tag: '대구', money: 45900 },
  { name: '눌림목장인', money: 41300 },
  { name: '차트읽는남자', money: 37100 },
  { name: '역발상투자', money: 33300 },
  { name: '분할매수', money: 29900 },
  { name: '존버는승리', money: 26800 },
  { name: '리스크관리', money: 24000 },
  { name: '우상향believer', money: 21500 },
  { name: '관망의미학', money: 19300 },
]

export type Period = 'weekly' | 'monthly'

export function board(period: Period): LbEntry[] {
  return period === 'weekly' ? WEEKLY : MONTHLY
}

// 내 페이북머니 기준 등수
export function myRank(period: Period, myMoney: number): number {
  let rank = 1
  for (const e of board(period)) if (myMoney < e.money) rank++
  return rank
}
