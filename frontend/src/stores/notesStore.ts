import { create } from 'zustand'
import { notesAPI } from '@/services/api'

export interface Note {
  id: number
  title: string
  content: string | null
  type: 'text' | 'voice'
  audio_file_path: string | null
  duration: number | null
  created_at: string | null
  updated_at: string | null
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

export const useNotesStore = create<NotesState>((set, get) => ({
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
      set({ error: err.message || 'Failed to fetch notes', isLoading: false })
    }
  },

  createNote: async (noteData) => {
    const { data } = await notesAPI.create(noteData)
    set((s) => ({ notes: [data, ...s.notes] }))
    return data
  },

  updateNote: async (id, noteData) => {
    const { data } = await notesAPI.update(id, noteData)
    set((s) => ({
      notes: s.notes.map((n) => (n.id === id ? { ...n, ...data } : n)),
    }))
  },

  deleteNote: async (id) => {
    await notesAPI.delete(id)
    set((s) => ({ notes: s.notes.filter((n) => n.id !== id) }))
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
}))
