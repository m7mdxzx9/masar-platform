import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { progressAPI } from '@/services/api'

interface SkillMastery {
  skill_id: string
  mastery: number
  mastery_level: string
  next_action: string
}

interface ProgressStats {
  total_skills: number
  mastered: number
  average_mastery: number
}

interface ProgressState {
  skills: Record<string, SkillMastery>
  stats: ProgressStats | null
  loading: boolean
  error: string | null

  submitQuiz: (moduleId: string, questionId: string, skillId: string, isCorrect: boolean, timeSpent: number) => Promise<void>
  fetchMastery: (skillId: string) => Promise<void>
  fetchLearningPath: (skillIds: string[]) => Promise<void>
  fetchStats: () => Promise<void>
}

export const useProgressStore = create<ProgressState>()(
  persist(
    (set, get) => ({
      skills: {},
      stats: null,
      loading: false,
      error: null,

      submitQuiz: async (moduleId, questionId, skillId, isCorrect, timeSpent) => {
        set({ loading: true, error: null })
        try {
          const { data } = await progressAPI.submitQuiz(moduleId, questionId, skillId, isCorrect, timeSpent)
          set((s) => ({
            skills: {
              ...s.skills,
              [skillId]: {
                skill_id: skillId,
                mastery: data.mastery,
                mastery_level: (data as any).mastery_level ?? 'beginner',
                next_action: data.next_action,
              },
            },
            loading: false,
          }))
        } catch (e: any) {
          set({ error: e.message || 'Failed to submit quiz', loading: false })
        }
      },

      fetchMastery: async (skillId) => {
        try {
          const { data } = await progressAPI.mastery(skillId)
          set((s) => ({
            skills: {
              ...s.skills,
              [skillId]: {
                skill_id: data.skill_id,
                mastery: data.mastery,
                mastery_level: data.mastery_level,
                next_action: s.skills[skillId]?.next_action ?? 'practice',
              },
            },
          }))
        } catch { /* ignore */ }
      },

      fetchLearningPath: async (skillIds) => {
        try {
          const { data } = await progressAPI.learningPath(skillIds.join(','))
          const updated: Record<string, SkillMastery> = { ...get().skills }
          for (const item of data) {
            updated[item.skill_id] = {
              skill_id: item.skill_id,
              mastery: item.mastery,
              mastery_level: item.mastery_level ?? 'beginner',
              next_action: item.next_action ?? 'practice',
            }
          }
          set({ skills: updated })
        } catch { /* ignore */ }
      },

      fetchStats: async () => {
        try {
          const { data } = await progressAPI.stats()
          set({ stats: data })
        } catch { /* ignore */ }
      },
    }),
    { name: 'masar-progress' }
  )
)
