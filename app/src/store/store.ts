import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import type { Settings, Side } from '../game/types'
import {
  computeResult, createGame, curPrice, GameState, generateTip,
  pnlNow, REWARD_BASE, signalAt, Tip,
} from '../game/engine'
import { pickScenario, loadManifest } from '../game/scenarios'
import { emptyStats, SessionStats } from '../game/profile'

export type Screen = 'setup' | 'play' | 'result'

interface Persisted {
  wallet: number
  lifetime: SessionStats
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
  toast: string | null
  tip: Tip | null
  tipOpen: boolean

  init: () => Promise<void>
  setSettings: (patch: Partial<Settings>) => void
  toggleInd: (k: keyof Settings['ind']) => void
  startRound: () => Promise<void>
  nextRound: () => Promise<void>
  toSetup: () => void
  buy: () => void
  short: () => void
  advance: () => void
  sell: () => void
  useTip: () => void
  closeTip: () => void
  showToast: (m: string) => void
}

const defaultSettings: Settings = {
  difficulty: 'normal',
  market: 'ALL',
  mode: 50,
  recentOnly: false,
  ind: { ma: true, rsi: true, macd: true, vol: true, bb: false, ichimoku: false },
}

let toastTimer: ReturnType<typeof setTimeout> | undefined

function settle(state: StoreState, g: GameState) {
  computeResult(g)
  const r = g.noTrade ? 0 : g.myRet ?? 0
  const delta = g.noTrade ? 0 : Math.round(REWARD_BASE * r)
  const wallet = Math.max(0, state.wallet + delta)

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

function tipsUsed(g: GameState): number {
  return Object.keys(g.tipUsedByIndex).length
}
function captureRatio(g: GameState): number {
  if (g.noTrade || !g.best || g.best.ret <= 0) return 0
  return Math.max(0, Math.min(1.2, (g.myRet ?? 0) / g.best.ret))
}

export const useStore = create<StoreState>()(
  persist(
    (set, get) => ({
      wallet: 10_000,
      lifetime: { ...emptyStats },
      ready: false,
      loadError: null,
      loadingRound: false,
      screen: 'setup',
      settings: { ...defaultSettings },
      game: null,
      session: { ...emptyStats },
      walletDelta: 0,
      toast: null,
      tip: null,
      tipOpen: false,

      init: async () => {
        try {
          await loadManifest()
          set({ ready: true, loadError: null })
        } catch (e) {
          set({ loadError: (e as Error).message, ready: false })
        }
      },

      setSettings: (patch) => set((s) => ({ settings: { ...s.settings, ...patch } })),
      toggleInd: (k) =>
        set((s) => ({ settings: { ...s.settings, ind: { ...s.settings.ind, [k]: !s.settings.ind[k] } } })),

      startRound: async () => {
        const { settings } = get()
        const anyInd = Object.values(settings.ind).some(Boolean)
        if (!anyInd) { get().showToast('지표를 최소 1개 선택하세요'); return }
        set({ loadingRound: true, loadError: null })
        try {
          const scn = await pickScenario(settings)
          const game = createGame(scn, settings)
          set({ game, screen: 'play', loadingRound: false })
        } catch (e) {
          set({ loadingRound: false, loadError: (e as Error).message })
          get().showToast('시나리오를 불러오지 못했습니다')
        }
      },

      nextRound: async () => { await get().startRound() },
      toSetup: () => set({ screen: 'setup' }),

      buy: () => enterPos(set, get, 'long'),
      short: () => enterPos(set, get, 'short'),

      advance: () => {
        const g = get().game
        if (!g || g.budget <= 0) return
        g.visible++
        g.budget--
        if (g.budget <= 0) {
          if (g.pos) { finishExit(set, get, g) } else { g.noTrade = true; g.over = true; finishExit(set, get, g) }
          return
        }
        set({ game: { ...g } })
      },

      sell: () => {
        const g = get().game
        if (!g || !g.pos) return
        finishExit(set, get, g)
      },

      useTip: () => {
        const g = get().game
        if (!g || g.over) return
        if (g.tipRemaining <= 0) { get().showToast('남은 Tip이 없습니다'); return }
        if (g.tipUsedByIndex[g.visible]) { get().showToast('이 봉에서는 이미 Tip을 사용했습니다'); return }
        g.tipRemaining--
        g.tipUsedByIndex[g.visible] = true
        const tip = generateTip(g)
        set({ game: { ...g }, tip, tipOpen: true })
      },
      closeTip: () => set({ tipOpen: false }),

      showToast: (m) => {
        set({ toast: m })
        clearTimeout(toastTimer)
        toastTimer = setTimeout(() => set({ toast: null }), 1900)
      },
    }),
    {
      name: 'candlerun-v0.4',
      partialize: (s) => ({ wallet: s.wallet, lifetime: s.lifetime }),
    },
  ),
)

type SetFn = (partial: Partial<StoreState> | ((s: StoreState) => Partial<StoreState>)) => void
type GetFn = () => StoreState

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
  if (!g.noTrade) {
    g.exit = { price: curPrice(g), at: g.visible }
    g.exitSignal = signalAt(g)
  }
  g.over = true
  const s = get()
  const res = settle(s, g)
  set({
    game: { ...g },
    screen: 'result',
    wallet: res.wallet,
    session: res.session,
    lifetime: res.lifetime,
    walletDelta: res.walletDelta,
  })
}
