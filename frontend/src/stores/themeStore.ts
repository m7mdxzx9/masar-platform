import { create } from 'zustand'

type ThemeStore = {
  sidebarCollapsed: boolean
  toggleSidebar: () => void
}

export const useThemeStore = create<ThemeStore>((set) => ({
  sidebarCollapsed: false,
  toggleSidebar: () => set((s) => ({ sidebarCollapsed: !s.sidebarCollapsed })),
}))
