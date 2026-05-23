import { create } from 'zustand'
import { goalsAPI } from '@/services/api'

export interface Goal {
  id: number
  title: string
  description: string | null
  target: number
  current: number
  target_type: string
  deadline: string | null
  completed: boolean
  created_at: string
  updated_at: string
}

interface GoalsState {
  goals: Goal[]
  isLoading: boolean
  error: string | null
  fetchGoals: () => Promise<void>
  createGoal: (data: { title: string; description?: string; target?: number; target_type?: string; deadline?: string }) => Promise<void>
  updateGoal: (id: number, data: { title?: string; description?: string; target?: number; current?: number; target_type?: string; deadline?: string; completed?: boolean }) => Promise<void>
  deleteGoal: (id: number) => Promise<void>
}

export const useGoalsStore = create<GoalsState>((set, get) => ({
  goals: [],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await goalsAPI.list()
      set({ goals: data as Goal[], isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load goals', isLoading: false })
    }
  },

  createGoal: async (data) => {
    try {
      await goalsAPI.create(data)
      await get().fetchGoals()
    } catch (err: any) {
      set({ error: err.message || 'Failed to create goal' })
    }
  },

  updateGoal: async (id, data: { title?: string; description?: string; target?: number; current?: number; target_type?: string; deadline?: string; completed?: boolean }) => {
    try {
      await goalsAPI.update(id, data)
      await get().fetchGoals()
    } catch (err: any) {
      set({ error: err.message || 'Failed to update goal' })
    }
  },

  deleteGoal: async (id) => {
    try {
      await goalsAPI.delete(id)
      set({ goals: get().goals.filter((g) => g.id !== id) })
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete goal' })
    }
  },
}))
