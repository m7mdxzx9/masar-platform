import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import { api } from '@/services/api'

export interface Course {
  id: string
  name: string
  code: string
  time: string
  day: string
  room: string
  instructor: string
  isTemplate?: boolean // template courses stay in the palette and can be cloned
}

let _idCounter = 0
export function generateCourseId(): string {
  return `course_${Date.now()}_${++_idCounter}`
}

/** Assign unique IDs to raw courses from the API */
function assignIds(courses: Omit<Course, 'id'>[]): Course[] {
  return courses.map(c => ({
    ...c,
    id: generateCourseId(),
    isTemplate: true,
  }))
}

interface ScheduleState {
  courses: Course[]       // template courses from PDF (palette)
  gridCourses: Course[]   // courses placed in the grid (cloned instances)
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  fetchSchedule: () => Promise<void>
  parseManual: (html: string) => Promise<void>
  uploadSchedule: (file: File) => Promise<void>
  clearSchedule: () => void
  addToGrid: (course: Course, day: string, time: string) => void
  removeFromGrid: (id: string) => void
  editGridCourse: (id: string, updates: Partial<Course>) => void
  editTemplateCourse: (id: string, updates: Partial<Course>) => void
  addManualCourse: (course: Omit<Course, 'id'>) => void
  removeTemplateCourse: (id: string) => void
}

export const useScheduleStore = create<ScheduleState>()(
  persist(
    (set, get) => ({
      courses: [],
      gridCourses: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      fetchSchedule: async () => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.get<{ courses: any[] }>('/schedule/fetch')
          set({ 
            courses: assignIds(response.data.courses), 
            isLoading: false, 
            lastFetched: Date.now(),
            error: null
          })
        } catch (err: any) {
          console.error('Schedule fetch error:', err)
          set({ 
            error: err.response?.data?.detail || 'فشل جلب الجدول الدراسي.', 
            isLoading: false 
          })
        }
      },

      parseManual: async (html: string) => {
        set({ isLoading: true, error: null })
        try {
          const response = await api.post<{ courses: any[] }>('/schedule/parse-manual', { html_content: html })
          set({ 
            courses: assignIds(response.data.courses), 
            isLoading: false, 
            lastFetched: Date.now(),
            error: null
          })
        } catch (err: any) {
          set({ 
            error: err.response?.data?.detail || 'فشل تحليل النص المزود', 
            isLoading: false 
          })
        }
      },

      uploadSchedule: async (file: File) => {
        set({ isLoading: true, error: null })
        const formData = new FormData()
        formData.append('file', file)
        try {
          const response = await api.post<{ courses: any[] }>('/schedule/upload', formData, {
            headers: { 'Content-Type': 'multipart/form-data' }
          })
          set({ 
            courses: assignIds(response.data.courses), 
            isLoading: false, 
            lastFetched: Date.now(),
            error: null
          })
        } catch (err: any) {
          set({ 
            error: err.response?.data?.detail || 'فشل معالجة ملف الجدول', 
            isLoading: false 
          })
        }
      },

      clearSchedule: () => set({ courses: [], gridCourses: [], lastFetched: null, error: null }),

      /** Clone a course from the palette and place it in the grid */
      addToGrid: (course: Course, day: string, time: string) => {
        const { gridCourses } = get()
        const newCourse: Course = {
          ...course,
          id: generateCourseId(),
          day,
          time,
          isTemplate: false,
        }
        set({ gridCourses: [...gridCourses, newCourse] })
      },

      /** Remove a specific course instance from the grid */
      removeFromGrid: (id: string) => {
        const { gridCourses } = get()
        set({ gridCourses: gridCourses.filter(c => c.id !== id) })
      },

      /** Edit a grid course's details */
      editGridCourse: (id: string, updates: Partial<Course>) => {
        const { gridCourses } = get()
        set({
          gridCourses: gridCourses.map(c => c.id === id ? { ...c, ...updates } : c)
        })
      },

      /** Edit a template course's details */
      editTemplateCourse: (id: string, updates: Partial<Course>) => {
        const { courses } = get()
        set({
          courses: courses.map(c => c.id === id ? { ...c, ...updates } : c)
        })
      },

      /** Add a completely new manual course to the palette */
      addManualCourse: (course: Omit<Course, 'id'>) => {
        const { courses } = get()
        const newCourse: Course = {
          ...course,
          id: generateCourseId(),
          isTemplate: true,
        }
        set({ courses: [...courses, newCourse] })
      },

      /** Remove a template course from the palette */
      removeTemplateCourse: (id: string) => {
        const { courses } = get()
        set({ courses: courses.filter(c => c.id !== id) })
      },
    }),
    {
      name: 'masar-schedule-storage',
    }
  )
)
