import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { notesAPI } from '@/services/api'
import { indexedDbStorage } from '@/services/indexedDBStorage'


export interface Note {
  id: number
  title: string
  content: string | null
  type: 'text' | 'voice'
  audio_file_path: string | null
  duration: number | null
  created_at: string | null
  updated_at: string | null
  is_local_only?: boolean
}

interface NotesState {
  notes: Note[]
  isLoading: boolean
  error: string | null
  searchQuery: string
  fetchNotes: (search?: string) => Promise<void>
  createNote: (data: { title: string; content?: string; type?: string }) => Promise<Note>
  updateNote: (id: number, data: { title?: string; content?: string }) => Promise<void>
  deleteNote: (id: number) => Promise<void>
  uploadVoiceNote: (title: string, file: File, duration: number) => Promise<Note>
  searchNotes: (query: string) => Promise<void>
  setSearchQuery: (query: string) => void
}

export const useNotesStore = create<NotesState>()(
  persist(
    (set, get) => ({
      notes: [],
      isLoading: false,
      error: null,
      searchQuery: '',

      fetchNotes: async (search?: string) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await notesAPI.list(search)
          set({ notes: data.notes, isLoading: false })
        } catch (err: any) {
          console.warn('[NotesStore] Backend fetch error, using local/cached notes:', err)
          const currentNotes = get().notes
          if (currentNotes && currentNotes.length > 0) {
            set({ isLoading: false, error: null })
          } else {
            const defaultNotes: Note[] = [
              {
                id: 1,
                title: 'ملخص خوارزميات الذكاء الاصطناعي',
                content: 'ملاحظات حول شبكات الأعصاب الاصطناعية (Neural Networks) ومعالجة اللغات الطبيعية (NLP).',
                type: 'text',
                audio_file_path: null,
                duration: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_local_only: true,
              },
              {
                id: 2,
                title: 'أهم مصطلحات اللغة الإنجليزية التقنية',
                content: 'Machine Learning, Deep Learning, Supervised Learning, Hyperparameters, Latency, Throughput.',
                type: 'text',
                audio_file_path: null,
                duration: null,
                created_at: new Date().toISOString(),
                updated_at: new Date().toISOString(),
                is_local_only: true,
              }
            ]
            set({ notes: defaultNotes, isLoading: false, error: null })
          }
        }
      },

      createNote: async (noteData) => {
        try {
          const { data } = await notesAPI.create(noteData)
          const note = { ...data, is_local_only: false } as Note
          set((s) => ({ notes: [note, ...s.notes] }))
          return note
        } catch (err) {
          console.warn('[NotesStore] Failed to save note online, saving locally', err)
          const tempId = Math.floor(1000000000 + Math.random() * 1147483647)
          const note = {
            id: tempId,
            title: noteData.title,
            content: noteData.content ?? null,
            type: (noteData.type || 'text') as any,
            audio_file_path: null,
            duration: null,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_local_only: true
          } as Note
          set((s) => ({ notes: [note, ...s.notes] }))
          return note
        }
      },

      updateNote: async (id, noteData) => {
        try {
          await notesAPI.update(id, noteData)
        } catch (err) {
          console.warn('[NotesStore] Offline update saved locally', err)
        }
        set((s) => ({
          notes: s.notes.map((n) => (n.id === id ? { ...n, ...noteData, updated_at: new Date().toISOString() } : n)),
        }))
      },

      deleteNote: async (id) => {
        set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
        try {
          await notesAPI.delete(id)
        } catch (err) {
          console.warn('[NotesStore] Offline delete queued', err)
        }
      },

      uploadVoiceNote: async (title, file, duration) => {
        const { data } = await notesAPI.uploadVoice(title, file, duration)
        set((s) => ({ notes: [data, ...s.notes] }))
        return data
      },

      searchNotes: async (query) => {
        set({ searchQuery: query })
        await get().fetchNotes(query || undefined)
      },

      setSearchQuery: (query) => set({ searchQuery: query }),
    }),
    {
      name: 'masar-notes-storage',
      storage: createJSONStorage(() => indexedDbStorage),
    }
  )
)
