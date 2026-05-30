import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { indexedDbStorage } from '@/services/indexedDBStorage'
import { vocabularyAPI } from '@/services/api'

export interface VocabularyWord {
  id?: number
  word: string
  meanings: string[]
  created_at?: string
  updated_at?: string
  is_local_only?: boolean
}

export interface GameMatch {
  id?: number
  score: number
  mode: string
  word_count: number
  words_json: string[]
  created_at?: string
}

interface VocabularyState {
  words: VocabularyWord[]
  matches: GameMatch[]
  isLoading: boolean
  error: string | null
  
  fetchVocabulary: () => Promise<void>
  addWord: (word: string, meanings: string[]) => Promise<void>
  recordMatch: (score: number, mode: string, word_count: number, words: string[]) => Promise<void>
  fetchMatches: () => Promise<void>
  syncLocalWords: () => Promise<void>
}

export const useVocabularyStore = create<VocabularyState>()(
  persist(
    (set, get) => ({
      words: [],
      matches: [],
      isLoading: false,
      error: null,

      fetchVocabulary: async () => {
        set({ isLoading: true, error: null })
        try {
          const words = await vocabularyAPI.list()
          set({ words, isLoading: false })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch vocabulary', isLoading: false })
        }
      },

      addWord: async (word: string, meanings: string[]) => {
        const normalized = word.trim().toLowerCase()
        if (!normalized) return

        // 1. Add locally first (optimistic / offline-first)
        const currentWords = get().words
        const existingIdx = currentWords.findIndex(w => w.word.toLowerCase() === normalized)
        const updatedWords = [...currentWords]

        if (existingIdx !== -1) {
          const currentMeanings = new Set(updatedWords[existingIdx].meanings)
          meanings.forEach(m => { if (m.trim()) currentMeanings.add(m.trim()) })
          updatedWords[existingIdx] = {
            ...updatedWords[existingIdx],
            meanings: Array.from(currentMeanings),
            is_local_only: true, // Mark for sync
            updated_at: new Date().toISOString()
          }
        } else {
          updatedWords.push({
            word: normalized,
            meanings: meanings.filter(m => m.trim()),
            is_local_only: true,
            created_at: new Date().toISOString()
          })
        }
        set({ words: updatedWords })

        // 2. Try to sync in background
        try {
          const serverWord = await vocabularyAPI.add(normalized, meanings)
          // Update local copy with database values and remove local_only flag
          set(state => ({
            words: state.words.map(w => w.word.toLowerCase() === normalized ? { ...serverWord, is_local_only: false } : w)
          }))
        } catch (err) {
          console.warn('[vocabularyStore] Failed to save word online, will sync later.', err)
        }
      },

      recordMatch: async (score, mode, word_count, words) => {
        const newMatch: GameMatch = {
          score,
          mode,
          word_count,
          words_json: words,
          created_at: new Date().toISOString()
        }

        // Add to local matches
        set(state => ({ matches: [newMatch, ...state.matches] }))

        // Save to backend
        try {
          await vocabularyAPI.recordMatch({
            score,
            mode,
            word_count,
            words_json: words
          })
        } catch (err) {
          console.warn('[vocabularyStore] Failed to save match online.', err)
        }
      },

      fetchMatches: async () => {
        set({ isLoading: true })
        try {
          const matches = await vocabularyAPI.listMatches()
          set({ matches, isLoading: false })
        } catch (err: any) {
          set({ error: err.message || 'Failed to fetch matches', isLoading: false })
        }
      },

      syncLocalWords: async () => {
        const localWords = get().words.filter(w => w.is_local_only)
        if (localWords.length === 0) return

        try {
          const payload = localWords.map(w => ({ word: w.word, meanings: w.meanings }))
          await vocabularyAPI.bulkAdd(payload)
          // Clear local_only flag on success
          set(state => ({
            words: state.words.map(w => w.is_local_only ? { ...w, is_local_only: false } : w)
          }))
          console.log('[vocabularyStore] Synced local words successfully.')
        } catch (err) {
          console.warn('[vocabularyStore] Bulk sync failed.', err)
        }
      }
    }),
    {
      name: 'masar-vocabulary-storage',
      storage: createJSONStorage(() => indexedDbStorage),
    }
  )
)
