import { create } from 'zustand'

function getSystemPref(): 'dark' | 'light' {
  if (typeof window === 'undefined') return 'dark'
  return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light'
}

type ThemeStore = {
  mode: 'dark' | 'light'
  sidebarCollapsed: boolean
  aiPanelOpen: boolean
  toggleSidebar: () => void
  toggleAiPanel: () => void
  setMode: (mode: 'dark' | 'light') => void
  toggleMode: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  mode: getSystemPref(),
  sidebarCollapsed: false,
  aiPanelOpen: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
  toggleAiPanel: () => set((s) => ({ aiPanelOpen: !s.aiPanelOpen })),
  setMode: (mode) => set({ mode }),
  toggleMode: () =>
    set((s) => {
      const next = s.mode === 'dark' ? 'light' : 'dark'
      return { mode: next }
    }),
}))

// Subscribe to mode changes and update <html> class
useThemeStore.subscribe((state) => {
  if (typeof window !== 'undefined') {
    const root = document.documentElement
    if (state.mode === 'dark') {
      root.classList.add('dark')
      root.classList.remove('light')
    } else {
      root.classList.remove('dark')
      root.classList.add('light')
    }
  }
})
