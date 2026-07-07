import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Side } from '../game/types'
import {
  computeResult, createGame, curPrice, GameState, generateTip,
  pnlNow, signalAt, Tip,
} from '../game/engine'
import { pickScenario, fetchScenario, loadManifest } from '../game/scenarios'
import { emptyStats, SessionStats } from '../game/profile'
import { getDailyScenarioIds } from '../game/daily'
import { DAILY_FREE_PLAYS, dayKey, monthKey, yesterdayKey } from '../game/constants'

export type Screen = 'setup' | 'play' | 'result' | 'leaderboard'
export type PlayKind = 'daily' | 'practice'
export const AD_EVERY = 3   // N판마다 리워드 광고 1회

interface Persisted {
  wallet: number
  lifetime: SessionStats
  adCount: number
  adDay: string
  // 리텐션
  streak: number          // 연속 출석 일수
  lastPlayDay: string     // 마지막 플레이 일자
  dailyDate: string       // 오늘의 종목 기준 일자
  dailyDoneCount: number  // 오늘 진행한 오늘의 종목 판 수(0~2)
  dailyScore: number      // 오늘 획득 페이북겜머니(손익 합) = 일간 랭킹 점수
  monthStr: string        // 이번달 키
  monthlyVisits: number   // 이번달 방문(플레이) 횟수
}

interface StoreState extends Persisted {
  ready: boolean
  loadError: string | null
  loadingRound: boolean
  screen: Screen
  settings: Settings
  game: GameState | null
  session: SessionStats
  walletDelta: number
  lastRet: number
  toast: string | null
  tip: Tip | null
  tipOpen: boolean
  showSettings: boolean
  adOpen: boolean
  roundRanked: boolean
  pendingKind: PlayKind | null

  init: () => Promise<void>
  setSettings: (patch: Partial<Settings>) => void
  toggleInd: (k: keyof Settings['ind']) => void
  startRound: () => Promise<void>       // 스마트: 오늘의 종목 남으면 daily, 아니면 practice
  startDaily: () => Promise<void>
  startPractice: () => Promise<void>
  gatePlay: (kind: PlayKind) => Promise<void>
  beginPlay: (kind: PlayKind) => Promise<void>
  finishAd: () => Promise<void>
  nextRound: () => Promise<void>
  toSetup: () => void
  goHome: () => void
  goLeaderboard: () => void
  openSettings: () => void
  closeSettings: () => void
  buy: () => void
  short: () => void
  advance: () => void
  sell: () => void
  useTip: () => void
  closeTip: () => void
  showToast: (m: string) => void
}

const defaultSettings: Settings = {
  difficulty: 'normal', market: 'ALL', mode: 50, recentOnly: false,
  ind: { ma: true, rsi: true, macd: true, vol: true, bb: false, ichimoku: false },
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

function settle(state: StoreState, g: GameState) {
  computeResult(g)
  const r = g.noTrade ? 0 : g.myRet ?? 0
  const before = state.wallet
  const delta = g.noTrade ? 0 : Math.round(before * r)
  const wallet = Math.max(0, before + delta)
  const acc = (base: SessionStats): SessionStats => {
    const traded = !g.noTrade && !!g.pos
    return {
      rounds: base.rounds + 1,
      trades: base.trades + (traded ? 1 : 0),
      wins: base.wins + (traded && r > 0 ? 1 : 0),
      noTrades: base.noTrades + (g.noTrade ? 1 : 0),
      shorts: base.shorts + (traded && g.pos!.side === 'short' ? 1 : 0),
      totalRet: base.totalRet + r,
      totalHold: base.totalHold + (g.holdBars ?? 0),
      tips: base.tips + tipsUsed(g),
      bestSum: base.bestSum + captureRatio(g),
    }
  }
  return { wallet, session: acc(state.session), lifetime: acc(state.lifetime), walletDelta: delta }
}
function tipsUsed(g: GameState): number { return Object.keys(g.tipUsedByIndex).length }
function captureRatio(g: GameState): number {
  if (g.noTrade || !g.best || g.best.ret <= 0) return 0
  return Math.max(0, Math.min(1.2, (g.myRet ?? 0) / g.best.ret))
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      wallet: 1_000_000,
      lifetime: { ...emptyStats },
      adCount: 0, adDay: '',
      streak: 0, lastPlayDay: '', dailyDate: '', dailyDoneCount: 0, dailyScore: 0, monthStr: '', monthlyVisits: 0,
      ready: false, loadError: null, loadingRound: false,
      screen: 'setup', settings: { ...defaultSettings },
      game: null, session: { ...emptyStats },
      walletDelta: 0, lastRet: 0,
      toast: null, tip: null, tipOpen: false, showSettings: false, adOpen: false,
      roundRanked: false, pendingKind: null,

      init: async () => {
        try { await loadManifest(); set({ ready: true, loadError: null }) }
        catch (e) { set({ loadError: (e as Error).message, ready: false }) }
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleInd: (k) => set((s) => ({ settings: { ...s.settings, ind: { ...s.settings.ind, [k]: !s.settings.ind[k] } } })),

      startRound: async () => {
        rollover(set, get)
        if (get().dailyDoneCount < DAILY_FREE_PLAYS) await get().startDaily()
        else await get().startPractice()
      },
      startDaily: async () => {
        rollover(set, get)
        if (get().dailyDoneCount >= DAILY_FREE_PLAYS) { await get().gatePlay('practice'); return }
        await get().gatePlay('daily')
      },
      startPractice: async () => { await get().gatePlay('practice') },

      // 3판마다 리워드 광고 게이트 → 통과 시 실제 플레이
      gatePlay: async (kind) => {
        const { settings } = get()
        if (!Object.values(settings.ind).some(Boolean)) { get().showToast('지표를 최소 1개 선택하세요'); return }
        rollover(set, get)
        const today = dayKey()
        let { adCount } = get()
        if (get().adDay !== today) { adCount = 0; set({ adCount, adDay: today }) }
        if (adCount >= AD_EVERY) { set({ adOpen: true, showSettings: false, pendingKind: kind }); return }
        await get().beginPlay(kind)
      },

      beginPlay: async (kind) => {
        const { settings } = get()
        set({ loadingRound: true, loadError: null })
        try {
          let scn
          if (kind === 'daily') {
            const m = await loadManifest()
            const ids = getDailyScenarioIds(dayKey(), m)
            const idx = Math.min(get().dailyDoneCount, Math.max(0, ids.length - 1))
            scn = await fetchScenario(ids[idx])
          } else {
            scn = await pickScenario(settings)
          }
          const game = createGame(scn, settings)
          markVisit(set, get)
          set({
            game, screen: 'play', loadingRound: false, showSettings: false, adOpen: false, pendingKind: null,
            roundRanked: kind === 'daily',
            adCount: get().adCount + 1, adDay: dayKey(),
            dailyDoneCount: kind === 'daily' ? Math.min(get().dailyDoneCount + 1, DAILY_FREE_PLAYS) : get().dailyDoneCount,
          })
        } catch (e) {
          set({ loadingRound: false, loadError: (e as Error).message })
          get().showToast('시나리오를 불러오지 못했습니다')
        }
      },

      finishAd: async () => {
        const kind = get().pendingKind ?? 'practice'
        set({ adOpen: false, adCount: 0, adDay: dayKey(), pendingKind: null })
        await get().beginPlay(kind)
      },

      nextRound: async () => { await get().startRound() },
      toSetup: () => set({ screen: 'setup', showSettings: false }),
      goHome: () => set({ screen: 'setup', showSettings: false, tipOpen: false }),
      goLeaderboard: () => set({ screen: 'leaderboard' }),
      openSettings: () => set({ showSettings: true }),
      closeSettings: () => set({ showSettings: false }),

      buy: () => enterPos(set, get, 'long'),
      short: () => enterPos(set, get, 'short'),

      advance: () => {
        const g = get().game
        if (!g || g.budget <= 0) return
        g.visible++; g.budget--
        if (g.budget <= 0) {
          if (g.pos) finishExit(set, get, g); else { g.noTrade = true; g.over = true; finishExit(set, get, g) }
          return
        }
        set({ game: { ...g } })
      },
      sell: () => { const g = get().game; if (!g || !g.pos) return; finishExit(set, get, g) },

      useTip: () => {
        const g = get().game
        if (!g || g.over) return
        if (g.tipRemaining <= 0) { get().showToast('남은 Tip이 없습니다'); return }
        if (g.tipUsedByIndex[g.visible]) { get().showToast('이 봉에서는 이미 Tip을 사용했습니다'); return }
        g.tipRemaining--; g.tipUsedByIndex[g.visible] = true
        set({ game: { ...g }, tip: generateTip(g), tipOpen: true })
      },
      closeTip: () => set({ tipOpen: false }),

      showToast: (m) => {
        set({ toast: m }); clearTimeout(toastTimer)
        toastTimer = setTimeout(() => set({ toast: null }), 2100)
      },
    }),
    {
      name: 'candlerun-v0.9',
      partialize: (s) => ({
        wallet: s.wallet, lifetime: s.lifetime, adCount: s.adCount, adDay: s.adDay,
        streak: s.streak, lastPlayDay: s.lastPlayDay, dailyDate: s.dailyDate, dailyDoneCount: s.dailyDoneCount,
        dailyScore: s.dailyScore, monthStr: s.monthStr, monthlyVisits: s.monthlyVisits,
      }),
    },
  ),
)

type SetFn = (partial: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => void
type GetFn = () => StoreState

// 일/월 롤오버(자정·월초 리셋)
function rollover(set: SetFn, get: GetFn) {
  const s = get()
  const today = dayKey(), mk = monthKey()
  const patch: Partial<StoreState> = {}
  if (s.dailyDate !== today) { patch.dailyDate = today; patch.dailyDoneCount = 0; patch.dailyScore = 0 }
  if (s.monthStr !== mk) { patch.monthStr = mk; patch.monthlyVisits = 0 }
  if (Object.keys(patch).length) set(patch)
}

// 출석/방문 기록(플레이 시작 시)
function markVisit(set: SetFn, get: GetFn) {
  const s = get()
  const today = dayKey()
  let streak = s.streak
  let celebrate = false
  if (s.lastPlayDay === today) { /* 같은 날 추가 플레이 — 유지 */ }
  else if (s.lastPlayDay === yesterdayKey()) { streak = s.streak + 1; celebrate = true }
  else { streak = 1; celebrate = s.streak !== 1 }
  set({ streak, lastPlayDay: today, monthlyVisits: s.monthlyVisits + 1 })
  if (celebrate) get().showToast(`🔥 ${streak}일 연속 출석! 내일도 이어가요`)
}

function enterPos(set: SetFn, get: GetFn, side: Side) {
  const g = get().game
  if (!g || g.pos || g.over) return
  g.pos = { side, price: curPrice(g), at: g.visible }
  g.entrySignal = signalAt(g)
  set({ game: { ...g } })
  get().showToast(side === 'long' ? '매수 진입 — 이후 흐름을 확인하세요' : '공매도 진입 — 가격이 내리면 수익')
  void pnlNow
}

function finishExit(set: SetFn, get: GetFn, g: GameState) {
  if (!g.noTrade) { g.exit = { price: curPrice(g), at: g.visible }; g.exitSignal = signalAt(g) }
  g.over = true
  const s = get()
  const res = settle(s, g)
  const rankedDelta = s.roundRanked ? res.walletDelta : 0
  set({
    game: { ...g }, screen: 'result',
    wallet: res.wallet, session: res.session, lifetime: res.lifetime,
    walletDelta: res.walletDelta, lastRet: g.noTrade ? 0 : (g.myRet ?? 0),
    dailyScore: s.dailyScore + rankedDelta,
  })
}
