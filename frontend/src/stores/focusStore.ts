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
  activeTaskId: string | null
  activeTaskTitle: string | null
  setTimeLeft: (t: number) => void
  setIsActive: (a: boolean) => void
  setSessionType: (t: 'focus' | 'break') => void
  setIsPaused: (p: boolean) => void
  setActiveTask: (id: string | null, title: string | null) => void
  completeSession: (duration: number) => Promise<void>
  fetchStats: () => Promise<void>
  fetchSessions: () => Promise<void>
}

const FOCUS_DURATION = 25 * 60
const BREAK_DURATION = 5 * 60
const STORAGE_KEY = 'masar-focus-session'

const saveToLocalStorage = (state: Partial<FocusState>) => {
  try {
    const current = useFocusStore.getState()
    const dataToSave = {
      isActive: state.isActive !== undefined ? state.isActive : current.isActive,
      timeLeft: state.timeLeft !== undefined ? state.timeLeft : current.timeLeft,
      sessionType: state.sessionType !== undefined ? state.sessionType : current.sessionType,
      isPaused: state.isPaused !== undefined ? state.isPaused : current.isPaused,
      activeTaskId: state.activeTaskId !== undefined ? state.activeTaskId : current.activeTaskId,
      activeTaskTitle: state.activeTaskTitle !== undefined ? state.activeTaskTitle : current.activeTaskTitle,
      lastSavedTime: Date.now()
    }
    localStorage.setItem(STORAGE_KEY, JSON.stringify(dataToSave))
  } catch (err) {
    console.error('Failed to save focus state:', err)
  }
}

const getInitialState = () => {
  const defaults = {
    isActive: false,
    timeLeft: FOCUS_DURATION,
    sessionType: 'focus' as const,
    isPaused: false,
    activeTaskId: null,
    activeTaskTitle: null,
  }
  try {
    const saved = localStorage.getItem(STORAGE_KEY)
    if (saved) {
      const parsed = JSON.parse(saved)
      let timeLeft = parsed.timeLeft
      let isActive = parsed.isActive
      let isPaused = parsed.isPaused

      if (isActive && !isPaused && parsed.lastSavedTime) {
        const elapsed = Math.floor((Date.now() - parsed.lastSavedTime) / 1000)
        timeLeft = Math.max(0, parsed.timeLeft - elapsed)
        if (timeLeft === 0) {
          isActive = false
        }
      }

      return {
        isActive,
        timeLeft,
        sessionType: parsed.sessionType || 'focus',
        isPaused,
        activeTaskId: parsed.activeTaskId || null,
        activeTaskTitle: parsed.activeTaskTitle || null,
      }
    }
  } catch (err) {
    console.error('Failed to load focus state:', err)
  }
  return defaults
}

const initialState = getInitialState()

export const useFocusStore = create<FocusState>((set, get) => ({
  isActive: initialState.isActive,
  timeLeft: initialState.timeLeft,
  sessionType: initialState.sessionType,
  stats: null,
  sessions: [],
  isPaused: initialState.isPaused,
  activeTaskId: initialState.activeTaskId,
  activeTaskTitle: initialState.activeTaskTitle,

  setTimeLeft: (t) => {
    set({ timeLeft: t })
    saveToLocalStorage({ timeLeft: t })
  },
  setIsActive: (a) => {
    set({ isActive: a })
    saveToLocalStorage({ isActive: a })
  },
  setSessionType: (t) => {
    const duration = t === 'focus' ? FOCUS_DURATION : BREAK_DURATION
    set({ sessionType: t, timeLeft: duration })
    saveToLocalStorage({ sessionType: t, timeLeft: duration })
  },
  setIsPaused: (p) => {
    set({ isPaused: p })
    saveToLocalStorage({ isPaused: p })
  },
  setActiveTask: (id, title) => {
    set({ activeTaskId: id, activeTaskTitle: title })
    saveToLocalStorage({ activeTaskId: id, activeTaskTitle: title })
  },

  completeSession: async (duration) => {
    try {
      await focusAPI.createSession({ duration, session_type: get().sessionType, completed: true })
      const activeTaskId = get().activeTaskId
      if (activeTaskId) {
        const { useKanbanStore } = await import('./kanbanStore')
        useKanbanStore.getState().incrementPomodoroCount(activeTaskId)
      }
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
