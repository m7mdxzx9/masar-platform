import { create } from 'zustand'
import { subjectsAPI } from '@/services/api'

export interface Subject {
  id: number
  name: string
  code: string | null
  instructor: string | null
  schedule_day: string | null
  schedule_time: string | null
  room: string | null
  color: string | null
  notes: string | null
  file_count: number
  created_at: string | null
  updated_at: string | null
}

export interface SubjectFile {
  id: number
  filename: string
  original_name: string
  file_type: string
  file_size: number
  uploaded_at: string | null
}

function loadOrder(): number[] {
  try {
    const raw = localStorage.getItem('masar-subject-order')
    return raw ? JSON.parse(raw) : []
  } catch { return [] }
}

function saveOrder(ids: number[]) {
  try { localStorage.setItem('masar-subject-order', JSON.stringify(ids)) } catch {}
}

interface SubjectsState {
  subjects: Subject[]
  subjectOrder: number[]
  currentSubject: (Subject & { files: SubjectFile[] }) | null
  isLoading: boolean
  error: string | null
  fetchSubjects: () => Promise<void>
  setSubjectOrder: (ids: number[]) => void
  createSubject: (data: { name: string; code?: string; instructor?: string; schedule_day?: string; schedule_time?: string; room?: string; color?: string; notes?: string }) => Promise<Subject>
  updateSubject: (id: number, data: any) => Promise<void>
  deleteSubject: (id: number) => Promise<void>
  fetchSubjectDetails: (id: number) => Promise<void>
  uploadFile: (subjectId: number, file: File) => Promise<void>
  deleteFile: (subjectId: number, fileId: number) => Promise<void>
  clearCurrentSubject: () => void
}

export const useSubjectsStore = create<SubjectsState>((set, get) => ({
  subjects: [],
  subjectOrder: loadOrder(),
  currentSubject: null,
  isLoading: false,
  error: null,

  fetchSubjects: async () => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await subjectsAPI.list()
      const subs: Subject[] = data.subjects
      const existingOrder = get().subjectOrder
      const validIds = new Set(subs.map((s: Subject) => s.id))
      const filtered = existingOrder.filter((id) => validIds.has(id))
      const newIds = subs.filter((s: Subject) => !filtered.includes(s.id)).map((s: Subject) => s.id)
      const merged = [...filtered, ...newIds]
      saveOrder(merged)
      set({ subjects: subs, subjectOrder: merged, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch subjects', isLoading: false })
    }
  },

  setSubjectOrder: (ids) => {
    saveOrder(ids)
    set({ subjectOrder: ids })
  },

  createSubject: async (subjectData) => {
    const { data } = await subjectsAPI.create(subjectData)
    const sub = { ...data, file_count: 0 } as Subject
    const order = [sub.id, ...get().subjectOrder]
    saveOrder(order)
    set((s) => ({ subjects: [sub, ...s.subjects], subjectOrder: order }))
    return data
  },

  updateSubject: async (id, subjectData) => {
    const { data } = await subjectsAPI.update(id, subjectData)
    set((s) => ({
      subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...subjectData } : sub)),
      currentSubject: s.currentSubject?.id === id ? { ...s.currentSubject, ...subjectData } : s.currentSubject,
    }))
  },

  deleteSubject: async (id) => {
    await subjectsAPI.delete(id)
    const order = get().subjectOrder.filter((oid) => oid !== id)
    saveOrder(order)
    set((s) => ({
      subjects: s.subjects.filter((sub) => sub.id !== id),
      subjectOrder: order,
      currentSubject: s.currentSubject?.id === id ? null : s.currentSubject,
    }))
  },

  fetchSubjectDetails: async (id) => {
    set({ isLoading: true, error: null })
    try {
      const { data } = await subjectsAPI.get(id)
      set({ currentSubject: data, isLoading: false })
    } catch (err: any) {
      set({ error: err.message || 'Failed to fetch subject details', isLoading: false })
    }
  },

  uploadFile: async (subjectId, file) => {
    await subjectsAPI.uploadFile(subjectId, file)
    await get().fetchSubjectDetails(subjectId)
  },

  deleteFile: async (subjectId, fileId) => {
    await subjectsAPI.deleteFile(subjectId, fileId)
    await get().fetchSubjectDetails(subjectId)
  },

  clearCurrentSubject: () => set({ currentSubject: null }),
}))
