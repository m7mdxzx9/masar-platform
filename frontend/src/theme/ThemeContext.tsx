import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export interface ThemeColors {
  bg: string
  surface: string
  surfaceHover: string
  border: string
  accent: string
  accentGlow: string
  secondary: string
  secondaryGlow: string
  success: string
  error: string
  warning: string
  text: string
  textMuted: string
  textDark: string
}

export interface Theme {
  id: string
  name: string
  nameAr: string
  colors: ThemeColors
}

export const themes: Theme[] = [
  {
    id: 'masar-dark',
    name: 'Masar Dark',
    nameAr: 'مسار الداكن',
    colors: {
      bg: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#334155',
      border: '#3B4554',
      accent: '#00FFFF',
      accentGlow: 'rgba(0, 255, 255, 0.1)',
      secondary: '#2400FF',
      secondaryGlow: 'rgba(36, 0, 255, 0.2)',
      success: '#00FF88',
      error: '#FF4466',
      warning: '#FFA500',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    nameAr: 'أزرق منتصف الليل',
    colors: {
      bg: '#0A0E1A',
      surface: '#121830',
      surfaceHover: '#1C2545',
      border: '#2A3560',
      accent: '#4D8EFF',
      accentGlow: 'rgba(77, 142, 255, 0.15)',
      secondary: '#7B61FF',
      secondaryGlow: 'rgba(123, 97, 255, 0.2)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#E8ECF4',
      textMuted: '#8492B4',
      textDark: '#5A6A8A',
    },
  },
  {
    id: 'forest-night',
    name: 'Forest Night',
    nameAr: 'ليل الغابة',
    colors: {
      bg: '#0D1A14',
      surface: '#152A20',
      surfaceHover: '#1E3A2C',
      border: '#2D4F3C',
      accent: '#4ADE80',
      accentGlow: 'rgba(74, 222, 128, 0.12)',
      secondary: '#22D3EE',
      secondaryGlow: 'rgba(34, 211, 238, 0.15)',
      success: '#86EFAC',
      error: '#FCA5A5',
      warning: '#FDE68A',
      text: '#ECFDF5',
      textMuted: '#86EFAC',
      textDark: '#4ADE80',
    },
  },
  {
    id: 'sunset-ember',
    name: 'Sunset Ember',
    nameAr: 'غروب ملتهب',
    colors: {
      bg: '#1A0F0A',
      surface: '#2A1A12',
      surfaceHover: '#3A251C',
      border: '#4A3528',
      accent: '#FB923C',
      accentGlow: 'rgba(251, 146, 60, 0.15)',
      secondary: '#F97316',
      secondaryGlow: 'rgba(249, 115, 22, 0.2)',
      success: '#4ADE80',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#FFF7ED',
      textMuted: '#D4A574',
      textDark: '#A67B52',
    },
  },
  {
    id: 'royal-purple',
    name: 'Royal Purple',
    nameAr: 'بنفسجي ملكي',
    colors: {
      bg: '#13081F',
      surface: '#1E1033',
      surfaceHover: '#2A1A48',
      border: '#3D2660',
      accent: '#A855F7',
      accentGlow: 'rgba(168, 85, 247, 0.15)',
      secondary: '#E879F9',
      secondaryGlow: 'rgba(232, 121, 249, 0.15)',
      success: '#34D399',
      error: '#FB7185',
      warning: '#FBBF24',
      text: '#F5F0FF',
      textMuted: '#B8A2D4',
      textDark: '#8B70AA',
    },
  },
  {
    id: 'ocean-deep',
    name: 'Ocean Deep',
    nameAr: 'أعماق المحيط',
    colors: {
      bg: '#071318',
      surface: '#0E2230',
      surfaceHover: '#153044',
      border: '#1E4058',
      accent: '#06B6D4',
      accentGlow: 'rgba(6, 182, 212, 0.15)',
      secondary: '#0EA5E9',
      secondaryGlow: 'rgba(14, 165, 233, 0.15)',
      success: '#2DD4BF',
      error: '#FB7185',
      warning: '#F59E0B',
      text: '#F0FDFA',
      textMuted: '#7DD3FC',
      textDark: '#38BDF8',
    },
  },
  {
    id: 'rose-gold',
    name: 'Rose Gold',
    nameAr: 'ذهبي وردي',
    colors: {
      bg: '#1A0F14',
      surface: '#2A1820',
      surfaceHover: '#3A222E',
      border: '#4D2E3C',
      accent: '#F472B6',
      accentGlow: 'rgba(244, 114, 182, 0.15)',
      secondary: '#E11D48',
      secondaryGlow: 'rgba(225, 29, 72, 0.15)',
      success: '#4ADE80',
      error: '#FB7185',
      warning: '#FBBF24',
      text: '#FFF1F2',
      textMuted: '#E4A0B5',
      textDark: '#C0728E',
    },
  },
  {
    id: 'arctic-light',
    name: 'Arctic Light',
    nameAr: 'ضوء القطب',
    colors: {
      bg: '#F8FAFC',
      surface: '#FFFFFF',
      surfaceHover: '#F1F5F9',
      border: '#E2E8F0',
      accent: '#0EA5E9',
      accentGlow: 'rgba(14, 165, 233, 0.1)',
      secondary: '#6366F1',
      secondaryGlow: 'rgba(99, 102, 241, 0.1)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      text: '#0F172A',
      textMuted: '#64748B',
      textDark: '#94A3B8',
    },
  },
  {
    id: 'obsidian',
    name: 'Obsidian',
    nameAr: 'سبج',
    colors: {
      bg: '#09090B',
      surface: '#18181B',
      surfaceHover: '#27272A',
      border: '#3F3F46',
      accent: '#EAB308',
      accentGlow: 'rgba(234, 179, 8, 0.12)',
      secondary: '#F59E0B',
      secondaryGlow: 'rgba(245, 158, 11, 0.15)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F97316',
      text: '#FAFAFA',
      textMuted: '#A1A1AA',
      textDark: '#71717A',
    },
  },
  {
    id: 'sakura',
    name: 'Sakura',
    nameAr: 'ساكورا',
    colors: {
      bg: '#1C1016',
      surface: '#2A1820',
      surfaceHover: '#38222E',
      border: '#4A2E3C',
      accent: '#FDA4AF',
      accentGlow: 'rgba(253, 164, 175, 0.12)',
      secondary: '#FB7185',
      secondaryGlow: 'rgba(251, 113, 133, 0.15)',
      success: '#86EFAC',
      error: '#FCA5A5',
      warning: '#FDE68A',
      text: '#FFF1F2',
      textMuted: '#E8B4BC',
      textDark: '#C8909C',
    },
  },
]

interface ThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'masar-theme-id'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_KEY)
      if (stored) {
        const found = themes.find((t) => t.id === stored)
        if (found) return found
      }
    } catch {
      // ignore
    }
    return themes[0]
  })

  const setTheme = useCallback((themeId: string) => {
    const found = themes.find((t) => t.id === themeId)
    if (found) {
      setCurrentTheme(found)
      try {
        localStorage.setItem(STORAGE_KEY, themeId)
      } catch {
        // ignore
      }
    }
  }, [])

  // Apply theme CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement
    const c = currentTheme.colors
    root.style.setProperty('--theme-bg', c.bg)
    root.style.setProperty('--theme-surface', c.surface)
    root.style.setProperty('--theme-surface-hover', c.surfaceHover)
    root.style.setProperty('--theme-border', c.border)
    root.style.setProperty('--theme-accent', c.accent)
    root.style.setProperty('--theme-accent-glow', c.accentGlow)
    root.style.setProperty('--theme-secondary', c.secondary)
    root.style.setProperty('--theme-secondary-glow', c.secondaryGlow)
    root.style.setProperty('--theme-success', c.success)
    root.style.setProperty('--theme-error', c.error)
    root.style.setProperty('--theme-warning', c.warning)
    root.style.setProperty('--theme-text', c.text)
    root.style.setProperty('--theme-text-muted', c.textMuted)
    root.style.setProperty('--theme-text-dark', c.textDark)

    // Update body background and color
    document.body.style.backgroundColor = c.bg
    document.body.style.color = c.text
  }, [currentTheme])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme, themes }}>
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme(): ThemeContextType {
  const ctx = useContext(ThemeContext)
  if (!ctx) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return ctx
}

export default ThemeContext
