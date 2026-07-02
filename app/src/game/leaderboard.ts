// 리더보드 프로토타입 — 페이북겜머니(게임머니) 기준. 백엔드 연동 전 목업.
// 주간/월간 TOP 20. 100만원으로 시작해 매 판 100% 투자·손익 누적된 게임머니로 순위.

export interface LbEntry { name: string; tag?: string; money: number }

const WEEKLY: LbEntry[] = [
  { name: '차트도사', tag: '서울', money: 5240000 },
  { name: '불꽃매매', tag: '부산', money: 4890000 },
  { name: '캔들킬러', money: 4520000 },
  { name: '삼전존버', tag: '수원', money: 4180000 },
  { name: '골든크로스', money: 3860000 },
  { name: '월가의늑대', money: 3590000 },
  { name: '단타왕', tag: '대구', money: 3310000 },
  { name: '존버는승리', money: 3070000 },
  { name: '급등주헌터', money: 2840000 },
  { name: '차트읽는남자', money: 2620000 },
  { name: '눌림목장인', money: 2430000 },
  { name: '수급의신', tag: '인천', money: 2250000 },
  { name: '역발상투자', money: 2080000 },
  { name: '분할매수', money: 1920000 },
  { name: '리스크관리', money: 1770000 },
  { name: '우상향believer', money: 1630000 },
  { name: '캔들초보', money: 1490000 },
  { name: '손절도용기', money: 1360000 },
  { name: '관망의미학', money: 1240000 },
  { name: '내일은상한가', money: 1120000 },
]

const MONTHLY: LbEntry[] = [
  { name: '월가의늑대', tag: '부산', money: 14800000 },
  { name: '차트도사', tag: '서울', money: 13200000 },
  { name: '연금술사', money: 11900000 },
  { name: '캔들킬러', money: 10700000 },
  { name: '추세추종자', tag: '대전', money: 9600000 },
  { name: '불꽃매매', tag: '부산', money: 8650000 },
  { name: '스윙마스터', money: 7780000 },
  { name: '삼전존버', tag: '수원', money: 7000000 },
  { name: '급등주헌터', money: 6300000 },
  { name: '골든크로스', money: 5670000 },
  { name: '수급의신', tag: '인천', money: 5100000 },
  { name: '단타왕', tag: '대구', money: 4590000 },
  { name: '눌림목장인', money: 4130000 },
  { name: '차트읽는남자', money: 3710000 },
  { name: '역발상투자', money: 3330000 },
  { name: '분할매수', money: 2990000 },
  { name: '존버는승리', money: 2680000 },
  { name: '리스크관리', money: 2400000 },
  { name: '우상향believer', money: 2150000 },
  { name: '관망의미학', money: 1930000 },
]

export type Period = 'weekly' | 'monthly'

export function board(period: Period): LbEntry[] {
  return period === 'weekly' ? WEEKLY : MONTHLY
}

// 내 페이북겜머니 기준 등수
export function myRank(period: Period, myMoney: number): number {
  let rank = 1
  for (const e of board(period)) if (myMoney < e.money) rank++
  return rank
}
