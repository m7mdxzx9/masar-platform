import { create } from 'zustand'
import { persist } from 'zustand/middleware'
import ICAL from 'ical.js'
import axios from 'axios'
import { API_BASE_URL } from '@/services/api'

export interface CalendarEvent {
  id: string
  title: string
  course: string
  start: Date
  end: Date
  description?: string
  location?: string
}

interface CalendarState {
  icalUrl: string
  events: CalendarEvent[]
  isLoading: boolean
  error: string | null
  lastFetched: number | null
  setIcalUrl: (url: string) => void
  fetchCalendar: () => Promise<void>
  clearEvents: () => void
}

export const useCalendarStore = create<CalendarState>()(
  persist(
    (set, get) => ({
      icalUrl: '',
      events: [],
      isLoading: false,
      error: null,
      lastFetched: null,

      setIcalUrl: (url) => set({ icalUrl: url }),

      fetchCalendar: async () => {
        const { icalUrl } = get()
        if (!icalUrl) return

        set({ isLoading: true, error: null })
        try {
          // Use the proxy endpoint
          const response = await axios.get(`${API_BASE_URL}/calendar/ical`, {
            params: { url: icalUrl }
          })
          
          const jcalData = ICAL.parse(response.data)
          const comp = new ICAL.Component(jcalData)
          const vevents = comp.getAllSubcomponents('vevent')

          const now = new Date()
          const events: CalendarEvent[] = vevents.map((vevent) => {
            const event = new ICAL.Event(vevent)
            // Extract course from summary or location if available
            // Blackboard summaries often look like "Assignment: [Course Name] - [Assignment Name]"
            let title = event.summary
            let course = 'عام'
            
            if (title.includes(':')) {
              const parts = title.split(':')
              if (parts.length > 1) {
                const coursePart = parts[1].trim()
                if (coursePart.includes('-')) {
                  course = coursePart.split('-')[0].trim()
                  title = coursePart.split('-').slice(1).join('-').trim()
                } else {
                  course = coursePart
                }
              }
            }

            return {
              id: event.uid,
              title: title || event.summary,
              course: course,
              start: event.startDate.toJSDate(),
              end: event.endDate.toJSDate(),
              description: event.description,
              location: event.location,
            }
          })
          .filter(e => e.start >= now)
          .sort((a, b) => a.start.getTime() - b.start.getTime())

          set({ events, isLoading: false, lastFetched: Date.now() })
        } catch (err: any) {
          console.error('Calendar fetch error:', err)
          set({ error: err.response?.data?.detail || err.message || 'فشل تحميل التقويم', isLoading: false })
        }
      },

      clearEvents: () => set({ events: [], icalUrl: '', lastFetched: null }),
    }),
    {
      name: 'masar-calendar-storage',
      partialize: (state) => ({ icalUrl: state.icalUrl, lastFetched: state.lastFetched }),
    }
  )
)
