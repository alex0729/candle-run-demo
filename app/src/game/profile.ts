export interface SessionStats {
  rounds: number
  trades: number
  wins: number
  noTrades: number
  shorts: number
  totalRet: number
  totalHold: number
  tips: number
  bestSum: number // sum of (myRet / bestRet) capture ratio
}

export const emptyStats: SessionStats = {
  rounds: 0, trades: 0, wins: 0, noTrades: 0, shorts: 0,
  totalRet: 0, totalHold: 0, tips: 0, bestSum: 0,
}

export type ProfileType = '안정형' | '균형형' | '공격형' | '학습형'
export interface Profile {
  type: ProfileType
  emoji: string
  title: string
  desc: string
  cta: string
}

export function diagnose(st: SessionStats): Profile {
  if (st.rounds < 1) {
    return { type: '학습형', emoji: '🌱', title: '이제 막 시작한 탐험가', desc: '몇 판 더 플레이하면 당신의 투자 성향을 진단해 드려요.', cta: '차트 감각 익히기' }
  }
  const tradeRate = st.trades / Math.max(1, st.rounds)
  const winRate = st.trades ? st.wins / st.trades : 0
  const avgHold = st.trades ? st.totalHold / st.trades : 0
  const noTradeRate = st.noTrades / Math.max(1, st.rounds)

  // 관망이 많고 진입이 적으면 안정형
  if (noTradeRate >= 0.5 || tradeRate < 0.5) {
    return {
      type: '안정형', emoji: '🛡️',
      title: '신중한 리스크 관리형',
      desc: `진입보다 관망을 선호하고 손실을 잘 피합니다. 승률 ${(winRate * 100).toFixed(0)}%. 원금 보존을 중시하는 투자 스타일에 가까워요.`,
      cta: '안정적인 지수·ETF 투자 살펴보기',
    }
  }
  // 짧게 자주 매매하면 공격형
  if (tradeRate >= 0.9 && avgHold <= 6) {
    return {
      type: '공격형', emoji: '🚀',
      title: '기민한 단기 트레이더형',
      desc: `자주, 빠르게 진입·청산합니다. 승률 ${(winRate * 100).toFixed(0)}%, 평균 보유 ${avgHold.toFixed(1)}봉. 모멘텀을 노리는 스타일이에요.`,
      cta: '실시간 시세로 매매 감각 확인하기',
    }
  }
  return {
    type: '균형형', emoji: '⚖️',
    title: '추세를 타는 밸런스형',
    desc: `근거가 모일 때 진입하고 추세를 따라갑니다. 승률 ${(winRate * 100).toFixed(0)}%, 평균 보유 ${avgHold.toFixed(1)}봉. 안정과 수익의 균형을 추구해요.`,
    cta: '분산 포트폴리오 시작해 보기',
  }
}
