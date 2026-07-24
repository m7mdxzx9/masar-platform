import { create } from 'zustand'
import { persist, createJSONStorage } from 'zustand/middleware'
import { subjectsAPI } from '@/services/api'
import { indexedDbStorage } from '@/services/indexedDBStorage'


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
  is_local_only?: boolean
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

export const useSubjectsStore = create<SubjectsState>()(
  persist(
    (set, get) => ({
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
          console.warn('[SubjectsStore] Backend offline, keeping real user subjects:', err)
          const currentSubs = get().subjects || []
          set({ subjects: currentSubs, isLoading: false, error: null })
        }
      },

      setSubjectOrder: (ids) => {
        saveOrder(ids)
        set({ subjectOrder: ids })
      },

      createSubject: async (subjectData) => {
        try {
          const { data } = await subjectsAPI.create(subjectData)
          const sub = { ...data, file_count: 0, is_local_only: false } as Subject
          const order = [sub.id, ...get().subjectOrder]
          saveOrder(order)
          set((s) => ({ subjects: [sub, ...s.subjects], subjectOrder: order }))
          return data
        } catch (err) {
          console.warn('[SubjectsStore] Failed to save subject online, saving locally', err)
          const tempId = Math.floor(1000000000 + Math.random() * 1147483647)
          const sub = {
            id: tempId,
            name: subjectData.name,
            code: subjectData.code ?? null,
            instructor: subjectData.instructor ?? null,
            schedule_day: subjectData.schedule_day ?? null,
            schedule_time: subjectData.schedule_time ?? null,
            room: subjectData.room ?? null,
            color: subjectData.color ?? null,
            notes: subjectData.notes ?? null,
            file_count: 0,
            created_at: new Date().toISOString(),
            updated_at: new Date().toISOString(),
            is_local_only: true
          } as Subject
          const order = [sub.id, ...get().subjectOrder]
          saveOrder(order)
          set((s) => ({ subjects: [sub, ...s.subjects], subjectOrder: order }))
          return sub
        }
      },

      updateSubject: async (id, subjectData) => {
        try {
          await subjectsAPI.update(id, subjectData)
        } catch (err) {
          console.warn('[SubjectsStore] Offline update saved locally', err)
        }
        set((s) => ({
          subjects: s.subjects.map((sub) => (sub.id === id ? { ...sub, ...subjectData, updated_at: new Date().toISOString() } : sub)),
          currentSubject: s.currentSubject?.id === id ? { ...s.currentSubject, ...subjectData } : s.currentSubject,
        }))
      },

      deleteSubject: async (id) => {
        const order = get().subjectOrder.filter((oid) => oid !== id)
        saveOrder(order)
        set((s) => ({
          subjects: s.subjects.filter((sub) => sub.id !== id),
          subjectOrder: order,
          currentSubject: s.currentSubject?.id === id ? null : s.currentSubject,
        }))
        try {
          await subjectsAPI.delete(id)
        } catch (err) {
          console.warn('[SubjectsStore] Offline delete queued', err)
        }
      },

      fetchSubjectDetails: async (id) => {
        set({ isLoading: true, error: null })
        try {
          const { data } = await subjectsAPI.get(id)
          set({ currentSubject: data, isLoading: false })
        } catch (err: any) {
          console.warn('[SubjectsStore] Backend detail fetch error, finding local subject:', err)
          const found = get().subjects.find((s) => s.id === Number(id))
          if (found) {
            set({ currentSubject: { ...found, files: [] }, isLoading: false, error: null })
          } else {
            set({ isLoading: false, error: null })
          }
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
    }),
    {
      name: 'masar-subjects-storage',
      storage: createJSONStorage(() => indexedDbStorage),
    }
  )
)
