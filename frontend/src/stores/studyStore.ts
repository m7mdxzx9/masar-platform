import { create } from 'zustand'
import { studyAPI } from '@/services/api'

export interface FlashCard {
  front: string
  back: string
}

export interface GuideSection {
  heading: string
  points: string[]
}

export interface StudySummary {
  summary: string
  key_points: string[]
  original_length: number
  summary_length: number
}

export interface MindMapTree {
  id: string
  title: string
  children: MindMapTree[]
}

interface StudyState {
  content: string
  summary: StudySummary | null
  answer: string | null
  guide: { title: string; sections: GuideSection[] } | null
  flashcards: FlashCard[]
  mindMap: MindMapTree | null
  isLoading: boolean
  error: string | null
  selectedNoteId: number | null
  selectedSubjectId: number | null
  setContent: (c: string) => void
  summarize: (format?: string, language?: string) => Promise<void>
  askQuestion: (question: string) => Promise<void>
  generateGuide: (subject: string) => Promise<void>
  generateFlashcards: (count?: number) => Promise<void>
  generateMindMap: (content: string, depth?: number) => Promise<void>
  summarizeNote: (noteId: number) => Promise<StudySummary>
  summarizeSubject: (subjectId: number) => Promise<any>
  reset: () => void
}

export const useStudyStore = create<StudyState>((set, get) => ({
  content: '',
  summary: null,
  answer: null,
  guide: null,
  flashcards: [],
  mindMap: null,
  isLoading: false,
  error: null,
  selectedNoteId: null,
  selectedSubjectId: null,

  setContent: (c) => set({ content: c }),

  summarize: async (format = 'bullet', language = 'ar') => {
    const { content } = get()
    if (!content.trim()) return
    set({ isLoading: true, error: null, summary: null, answer: null, guide: null, flashcards: [] })
    try {
      const { data } = await studyAPI.summarize({ content, format, language })
      set({ summary: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Summarization failed', isLoading: false })
    }
  },

  askQuestion: async (question: string) => {
    const { content } = get()
    if (!content.trim() || !question.trim()) return
    set({ isLoading: true, error: null, answer: null })
    try {
      const { data } = await studyAPI.ask({ content, question })
      set({ answer: data.answer, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Question failed', isLoading: false })
    }
  },

  generateGuide: async (subject: string) => {
    const { content } = get()
    if (!content.trim()) return
    set({ isLoading: true, error: null, guide: null })
    try {
      const { data } = await studyAPI.guide({ content, subject })
      set({ guide: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Guide generation failed', isLoading: false })
    }
  },

  generateFlashcards: async (count = 5) => {
    const { content } = get()
    if (!content.trim()) return
    set({ isLoading: true, error: null, flashcards: [] })
    try {
      const { data } = await studyAPI.flashcards({ content, count })
      set({ flashcards: data.cards, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Flashcard generation failed', isLoading: false })
    }
  },

  summarizeNote: async (noteId: number) => {
    const { data } = await studyAPI.summarizeNote(noteId)
    return data
  },

  summarizeSubject: async (subjectId: number) => {
    const { data } = await studyAPI.summarizeSubject(subjectId)
    return data
  },

  generateMindMap: async (content: string, depth = 2) => {
    if (!content.trim()) return
    set({ isLoading: true, error: null, mindMap: null })
    try {
      const { data } = await studyAPI.generateMindMap(content, depth)
      set({ mindMap: data.tree, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Mind map generation failed', isLoading: false })
    }
  },

  reset: () => set({ summary: null, answer: null, guide: null, flashcards: [], mindMap: null, error: null }),
}))
