// 리더보드 프로토타입 — 백엔드 연동 전 목업 데이터.
// 주간/월간 TOP 20. 플레이 후 내 수익률을 끼워넣어 등수를 계산.

export interface LbEntry { name: string; tag?: string; ret: number }

const WEEKLY: LbEntry[] = [
  { name: '차트도사', tag: '서울', ret: 0.312 },
  { name: '불꽃매매', tag: '부산', ret: 0.287 },
  { name: '캔들킬러', ret: 0.264 },
  { name: '삼전존버', tag: '수원', ret: 0.241 },
  { name: '골든크로스', ret: 0.223 },
  { name: '월가의늑대', ret: 0.205 },
  { name: '단타왕', tag: '대구', ret: 0.188 },
  { name: '존버는승리', ret: 0.171 },
  { name: '급등주헌터', ret: 0.156 },
  { name: '차트읽는남자', ret: 0.142 },
  { name: '눌림목장인', ret: 0.128 },
  { name: '수급의신', tag: '인천', ret: 0.115 },
  { name: '역발상투자', ret: 0.101 },
  { name: '분할매수', ret: 0.089 },
  { name: '리스크관리', ret: 0.077 },
  { name: '우상향believer', ret: 0.064 },
  { name: '캔들초보', ret: 0.052 },
  { name: '손절도용기', ret: 0.038 },
  { name: '관망의미학', ret: 0.021 },
  { name: '내일은상한가', ret: 0.009 },
]

const MONTHLY: LbEntry[] = [
  { name: '월가의늑대', tag: '부산', ret: 0.642 },
  { name: '차트도사', tag: '서울', ret: 0.588 },
  { name: '연금술사', ret: 0.531 },
  { name: '캔들킬러', ret: 0.497 },
  { name: '추세추종자', tag: '대전', ret: 0.463 },
  { name: '불꽃매매', tag: '부산', ret: 0.428 },
  { name: '스윙마스터', ret: 0.391 },
  { name: '삼전존버', tag: '수원', ret: 0.357 },
  { name: '급등주헌터', ret: 0.322 },
  { name: '골든크로스', ret: 0.298 },
  { name: '수급의신', tag: '인천', ret: 0.271 },
  { name: '단타왕', tag: '대구', ret: 0.244 },
  { name: '눌림목장인', ret: 0.216 },
  { name: '차트읽는남자', ret: 0.189 },
  { name: '역발상투자', ret: 0.162 },
  { name: '분할매수', ret: 0.134 },
  { name: '존버는승리', ret: 0.108 },
  { name: '리스크관리', ret: 0.081 },
  { name: '우상향believer', ret: 0.054 },
  { name: '관망의미학', ret: 0.027 },
]

export type Period = 'weekly' | 'monthly'

export function board(period: Period): LbEntry[] {
  return period === 'weekly' ? WEEKLY : MONTHLY
}

// 내 수익률을 기준으로 등수 계산(공동 목록에 삽입)
export function myRank(period: Period, myRet: number): number {
  const list = board(period)
  let rank = 1
  for (const e of list) if (myRet < e.ret) rank++
  return rank
}
