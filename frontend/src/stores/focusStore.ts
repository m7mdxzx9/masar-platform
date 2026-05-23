import { create } from 'zustand'
import { focusAPI } from '@/services/api'

interface FocusSession {
  id: number
  duration: number
  session_type: string
  completed: boolean
  created_at: string
}

interface FocusStats {
  today_seconds: number
  today_minutes: number
  week_seconds: number
  week_minutes: number
  session_count_today: number
}

interface FocusState {
  isActive: boolean
  timeLeft: number
  sessionType: 'focus' | 'break'
  stats: FocusStats | null
  sessions: FocusSession[]
  isPaused: boolean
  setTimeLeft: (t: number) => void
  setIsActive: (a: boolean) => void
  setSessionType: (t: 'focus' | 'break') => void
  setIsPaused: (p: boolean) => void
  completeSession: (duration: number) => Promise<void>
  fetchStats: () => Promise<void>
  fetchSessions: () => Promise<void>
}

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: false,
  timeLeft: FOCUS_DURATION,
  sessionType: 'focus',
  stats: null,
  sessions: [],
  isPaused: false,

  setTimeLeft: (t) => set({ timeLeft: t }),
  setIsActive: (a) => set({ isActive: a }),
  setSessionType: (t) => set({ sessionType: t, timeLeft: t === 'focus' ? FOCUS_DURATION : BREAK_DURATION }),
  setIsPaused: (p) => set({ isPaused: p }),

  completeSession: async (duration) => {
    try {
      await focusAPI.createSession({ duration, session_type: get().sessionType, completed: true })
      await get().fetchStats()
    } catch { /* silently fail */ }
  },

  fetchStats: async () => {
    try {
      const { data } = await focusAPI.stats()
      set({ stats: data as FocusStats })
    } catch { /* silently fail */ }
  },

  fetchSessions: async () => {
    try {
      const { data } = await focusAPI.listSessions()
      set({ sessions: data as FocusSession[] })
    } catch { /* silently fail */ }
  },
}))
