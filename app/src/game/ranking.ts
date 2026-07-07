// 랭킹 데이터 소스(프로토타입 mock). 추후 서버 fetch로 교체 가능하도록 순수 함수로 분리.
// 일간 = 오늘 획득 페이북겜머니(손익 합, 원) / 월간 = 이번달 방문횟수(회)

export interface RankEntry { name: string; tag?: string; score: number }

const DAILY_MOCK: RankEntry[] = [
  { name: '차트도사', tag: '서울', score: 384000 },
  { name: '불꽃매매', tag: '부산', score: 331000 },
  { name: '캔들킬러', score: 296000 },
  { name: '오늘의고수', tag: '대전', score: 258000 },
  { name: '골든크로스', score: 221000 },
  { name: '단타왕', tag: '대구', score: 194000 },
  { name: '눌림목장인', score: 167000 },
  { name: '수급의신', tag: '인천', score: 142000 },
  { name: '역발상투자', score: 118000 },
  { name: '분할매수', score: 96000 },
  { name: '리스크관리', score: 77000 },
  { name: '우상향believer', score: 61000 },
  { name: '캔들초보', score: 46000 },
  { name: '존버는승리', score: 33000 },
  { name: '관망의미학', score: 21000 },
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
