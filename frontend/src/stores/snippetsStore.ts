import { create } from 'zustand'
import { snippetsAPI } from '@/services/api'

export interface Snippet {
  id: number
  lab_id: string | null
  title: string
  code: string
  language: string
  tags: string[]
  created_at: string
  updated_at: string
}

interface SnippetsState {
  snippets: Snippet[]
  isLoading: boolean
  error: string | null
  fetchSnippets: (params?: { language?: string; search?: string }) => Promise<void>
  deleteSnippet: (id: number) => Promise<void>
}

export const useSnippetsStore = create<SnippetsState>((set, get) => ({
  snippets: [],
  isLoading: false,
  error: null,

  fetchSnippets: async (params?) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await snippetsAPI.list(params)
      set({ snippets: data as Snippet[], isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to load snippets', isLoading: false })
    }
  },

  deleteSnippet: async (id: number) => {
    try {
      await snippetsAPI.delete(id)
      set({ snippets: get().snippets.filter((s) => s.id !== id) })
    } catch (err: any) {
      set({ error: err.message || 'Failed to delete snippet' })
    }
  },
}))
