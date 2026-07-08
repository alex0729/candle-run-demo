// 랭킹 데이터 소스(프로토타입 mock). 추후 서버 fetch로 교체 가능하도록 순수 함수로 분리.
// 일간 = 오늘(24h) 누적수익률(소수, 0.184=+18.4%) / 월간 = 이번달 방문횟수(회)
// 페이북겜머니(자산)는 리셋 없이 지속되며, 매 사이클(새벽 6시) 마감 시 24h 수익률 상위 3인이 페이북머니 3·2·1만원 입상.

export interface RankEntry { name: string; tag?: string; score: number }

const DAILY_MOCK: RankEntry[] = [
  { name: '차트도사', tag: '서울', score: 0.223 },
  { name: '불꽃매매', tag: '부산', score: 0.187 },
  { name: '캔들킬러', score: 0.164 },
  { name: '오늘의고수', tag: '대전', score: 0.141 },
  { name: '골든크로스', score: 0.118 },
  { name: '단타왕', tag: '대구', score: 0.097 },
  { name: '눌림목장인', score: 0.079 },
  { name: '수급의신', tag: '인천', score: 0.061 },
  { name: '역발상투자', score: 0.044 },
  { name: '분할매수', score: 0.028 },
  { name: '리스크관리', score: 0.012 },
  { name: '우상향believer', score: -0.006 },
  { name: '캔들초보', score: -0.024 },
  { name: '존버는승리', score: -0.048 },
  { name: '관망의미학', score: -0.071 },
]

const MONTHLY_VISIT_MOCK: RankEntry[] = [
  { name: '개근왕', tag: '서울', score: 62 },
  { name: '데일리러', tag: '부산', score: 55 },
  { name: '출석요정', score: 49 },
  { name: '꾸준함이답', tag: '수원', score: 43 },
  { name: '아침의루틴', score: 38 },
  { name: '차트도사', tag: '서울', score: 34 },
  { name: '불꽃매매', tag: '부산', score: 30 },
  { name: '캔들킬러', score: 27 },
  { name: '단타왕', tag: '대구', score: 23 },
  { name: '눌림목장인', score: 20 },
  { name: '수급의신', tag: '인천', score: 17 },
  { name: '역발상투자', score: 14 },
  { name: '주말전사', score: 11 },
  { name: '가끔접속', score: 8 },
  { name: '탐색중', score: 5 },
]

// dateKey/monthKey는 추후 서버 조회용 파라미터(현재 mock은 동일 반환)
export function getDailyRanking(_dateKey: string): RankEntry[] { return DAILY_MOCK }
export function getMonthlyVisitRanking(_monthKey: string): RankEntry[] { return MONTHLY_VISIT_MOCK }

// 내 점수 기준 등수(공동 목록 삽입)
export function rankOf(list: RankEntry[], myScore: number): number {
  let rank = 1
  for (const e of list) if (myScore < e.score) rank++
  return rank
}
