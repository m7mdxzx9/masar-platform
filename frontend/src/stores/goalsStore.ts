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
  goals: [
    {
      id: 1,
      title: 'إتقان خوارزميات التعلم العميق',
      description: 'دراسة وتطبيق شبكات PyTorch و Transformer',
      target: 10,
      current: 4,
      target_type: 'ساعات',
      deadline: '2026-08-15',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    },
    {
      id: 2,
      title: 'إنهاء 5 مشاريع تطبيقية',
      description: 'بناء منصات تعتمد على الذكاء الاصطناعي',
      target: 5,
      current: 2,
      target_type: 'مشروع',
      deadline: '2026-09-01',
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
  ],
  isLoading: false,
  error: null,

  fetchGoals: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await goalsAPI.list()
      set({ goals: data as Goal[], isLoading: false })
    } catch (err: any) {
      console.warn('[GoalsStore] Backend fetch error, keeping local goals:', err)
      set({ isLoading: false, error: null })
    }
  },

  createGoal: async (data) => {
    const newGoal: Goal = {
      id: Date.now(),
      title: data.title,
      description: data.description || null,
      target: data.target || 1,
      current: 0,
      target_type: data.target_type || 'ساعات',
      deadline: data.deadline || null,
      completed: false,
      created_at: new Date().toISOString(),
      updated_at: new Date().toISOString()
    }
    set(s => ({ goals: [newGoal, ...s.goals] }))
    try {
      await goalsAPI.create(data)
    } catch (err: any) {
      console.warn('[GoalsStore] Offline create saved locally')
    }
  },

  updateGoal: async (id, data) => {
    set(s => ({
      goals: s.goals.map(g => g.id === id ? { ...g, ...data, updated_at: new Date().toISOString() } : g)
    }))
    try {
      await goalsAPI.update(id, data)
    } catch (err: any) {
      console.warn('[GoalsStore] Offline update saved locally')
    }
  },

  deleteGoal: async (id) => {
    set(s => ({ goals: s.goals.filter((g) => g.id !== id) }))
    try {
      await goalsAPI.delete(id)
    } catch (err: any) {
      console.warn('[GoalsStore] Offline delete processed locally')
    }
  },
}))
