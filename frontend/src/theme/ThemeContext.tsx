import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'

export type ThemeCategory = 'english' | 'platform' | 'portfolio'

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

export interface ThemeFonts {
  fontFamily: string
  fontHeading: string
  fontMono?: string
}

export interface Theme {
  id: string
  name: string
  nameAr: string
  category: ThemeCategory
  targetLang: 'en' | 'bilingual'
  description: string
  colors: ThemeColors
  fonts: ThemeFonts
  backdropBlur?: string
  cardShadow?: string
}

export const themes: Theme[] = [
  // ==========================================
  // CATEGORY A: ENGLISH UI DIRECTIONS
  // ==========================================
  {
    id: 'en-minimalist-pro',
    name: 'Minimalist & Modern Pro',
    nameAr: 'الإنكليزي الأدنى الاحترافي',
    category: 'english',
    targetLang: 'en',
    description: 'Clean, high-efficiency Stripe-like dashboard layout with generous whitespace.',
    colors: {
      bg: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#334155',
      border: '#334155',
      accent: '#6366F1',
      accentGlow: 'rgba(99, 102, 241, 0.2)',
      secondary: '#38BDF8',
      secondaryGlow: 'rgba(56, 189, 248, 0.2)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
    fonts: {
      fontFamily: "'Inter', system-ui, sans-serif",
      fontHeading: "'Inter', system-ui, sans-serif",
    },
    cardShadow: '0 4px 20px rgba(0, 0, 0, 0.25)',
  },
  {
    id: 'en-bold-dynamic',
    name: 'Bold & Dynamic',
    nameAr: 'الإنكليزي الديناميكي الجريء',
    category: 'english',
    targetLang: 'en',
    description: 'High-contrast bold headings, energetic mint accents, and soft card elevation shadows.',
    colors: {
      bg: '#F1F5F9',
      surface: '#FFFFFF',
      surfaceHover: '#F8FAFC',
      border: '#E2E8F0',
      accent: '#2563EB',
      accentGlow: 'rgba(37, 99, 235, 0.15)',
      secondary: '#10B981',
      secondaryGlow: 'rgba(16, 185, 129, 0.18)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      text: '#0F172A',
      textMuted: '#64748B',
      textDark: '#94A3B8',
    },
    fonts: {
      fontFamily: "'Plus Jakarta Sans', system-ui, sans-serif",
      fontHeading: "'Plus Jakarta Sans', system-ui, sans-serif",
    },
    cardShadow: '0 10px 30px rgba(37, 99, 235, 0.08)',
  },
  {
    id: 'en-tech-dark',
    name: 'Tech-Focused Dark Mode',
    nameAr: 'الإنكليزي الداكن للمطورين',
    category: 'english',
    targetLang: 'en',
    description: 'Pitch dark environment with cyan neon accents and 1px subtle borders.',
    colors: {
      bg: '#090D16',
      surface: '#151C2C',
      surfaceHover: '#1E293B',
      border: '#1E293B',
      accent: '#06B6D4',
      accentGlow: 'rgba(6, 182, 212, 0.25)',
      secondary: '#3B82F6',
      secondaryGlow: 'rgba(59, 130, 246, 0.2)',
      success: '#2DD4BF',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
    fonts: {
      fontFamily: "'JetBrains Mono', monospace",
      fontHeading: "'Outfit', sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
    cardShadow: '0 0 25px rgba(6, 182, 212, 0.08)',
  },

  // ==========================================
  // CATEGORY B: FULL PLATFORM DIRECTIONS (BILINGUAL)
  // ==========================================
  {
    id: 'platform-enterprise-minimal',
    name: 'Enterprise Minimal',
    nameAr: 'المؤسسي الأدنى الشامل',
    category: 'platform',
    targetLang: 'bilingual',
    description: 'Academic and authoritative enterprise structure with deep navy backdrop and clean typography.',
    colors: {
      bg: '#0B192C',
      surface: '#1E3E62',
      surfaceHover: '#2A4E78',
      border: '#2E5B88',
      accent: '#60A5FA',
      accentGlow: 'rgba(96, 165, 250, 0.2)',
      secondary: '#38BDF8',
      secondaryGlow: 'rgba(56, 189, 248, 0.2)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      text: '#F5F5F5',
      textMuted: '#9CA3AF',
      textDark: '#6B7280',
    },
    fonts: {
      fontFamily: "'Cairo', 'Inter', system-ui, sans-serif",
      fontHeading: "'Cairo', 'Inter', system-ui, sans-serif",
    },
    cardShadow: '0 4px 16px rgba(11, 25, 44, 0.4)',
  },
  {
    id: 'platform-vibrant-tech',
    name: 'Vibrant Tech',
    nameAr: 'التقني الحيوي الشامل',
    category: 'platform',
    targetLang: 'bilingual',
    description: 'High interactive energy featuring indigo purple and emerald green highlights.',
    colors: {
      bg: '#0D0B26',
      surface: '#1A1640',
      surfaceHover: '#27225C',
      border: '#3A3380',
      accent: '#4F46E5',
      accentGlow: 'rgba(79, 70, 229, 0.3)',
      secondary: '#10B981',
      secondaryGlow: 'rgba(16, 185, 129, 0.25)',
      success: '#10B981',
      error: '#F43F5E',
      warning: '#F59E0B',
      text: '#FFFFFF',
      textMuted: '#C7D2FE',
      textDark: '#818CF8',
    },
    fonts: {
      fontFamily: "'Readex Pro', 'Plus Jakarta Sans', system-ui, sans-serif",
      fontHeading: "'Readex Pro', 'Plus Jakarta Sans', system-ui, sans-serif",
    },
    cardShadow: '0 8px 32px rgba(79, 70, 229, 0.2)',
  },
  {
    id: 'platform-modern-dark-tech',
    name: 'Modern Dark Tech',
    nameAr: 'التقني الداكن المستقبلي',
    category: 'platform',
    targetLang: 'bilingual',
    description: 'Advanced AI engineering aesthetic with glowing cyan accents over dark slate grid.',
    colors: {
      bg: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#334155',
      border: '#334155',
      accent: '#38BDF8',
      accentGlow: 'rgba(56, 189, 248, 0.25)',
      secondary: '#818CF8',
      secondaryGlow: 'rgba(129, 140, 248, 0.2)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
    fonts: {
      fontFamily: "'Tajawal', 'Outfit', system-ui, sans-serif",
      fontHeading: "'Tajawal', 'Outfit', system-ui, sans-serif",
    },
    cardShadow: '0 0 30px rgba(56, 189, 248, 0.12)',
  },

  // ==========================================
  // CATEGORY C: PERSONAL PORTFOLIO DIRECTIONS
  // ==========================================
  {
    id: 'portfolio-minimal-dev',
    name: 'Minimal Developer Portfolio',
    nameAr: 'معرض المطور الأدنى',
    category: 'portfolio',
    targetLang: 'bilingual',
    description: 'Ultra-light gray monochrome developer portfolio focused on high readability and zero fluff.',
    colors: {
      bg: '#F9FAFB',
      surface: '#FFFFFF',
      surfaceHover: '#F3F4F6',
      border: '#E5E7EB',
      accent: '#0B192C',
      accentGlow: 'rgba(11, 25, 44, 0.12)',
      secondary: '#334155',
      secondaryGlow: 'rgba(51, 65, 85, 0.12)',
      success: '#059669',
      error: '#DC2626',
      warning: '#D97706',
      text: '#0B192C',
      textMuted: '#4B5563',
      textDark: '#9CA3AF',
    },
    fonts: {
      fontFamily: "'Cairo', 'Inter', system-ui, sans-serif",
      fontHeading: "'Cairo', 'Inter', system-ui, sans-serif",
    },
    cardShadow: '0 1px 3px rgba(0, 0, 0, 0.05)',
  },
  {
    id: 'portfolio-clean-glass',
    name: 'Clean Glassmorphism Portfolio',
    nameAr: 'معرض الزجاج العصري',
    category: 'portfolio',
    targetLang: 'bilingual',
    description: 'Soft gradient background with blurred 12px glass cards and translucent borders.',
    colors: {
      bg: '#0A0F1D',
      surface: 'rgba(26, 36, 64, 0.55)',
      surfaceHover: 'rgba(38, 52, 90, 0.75)',
      border: 'rgba(255, 255, 255, 0.15)',
      accent: '#38BDF8',
      accentGlow: 'rgba(56, 189, 248, 0.3)',
      secondary: '#A855F7',
      secondaryGlow: 'rgba(168, 85, 247, 0.3)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#F8FAFC',
      textMuted: '#CBD5E1',
      textDark: '#94A3B8',
    },
    fonts: {
      fontFamily: "'Readex Pro', 'Plus Jakarta Sans', system-ui, sans-serif",
      fontHeading: "'Readex Pro', 'Plus Jakarta Sans', system-ui, sans-serif",
    },
    backdropBlur: 'blur(12px)',
    cardShadow: '0 8px 32px rgba(0, 0, 0, 0.37)',
  },
  {
    id: 'portfolio-dark-dev',
    name: 'Dark Mode Developer Portfolio',
    nameAr: 'معرض المطور الداكن',
    category: 'portfolio',
    targetLang: 'bilingual',
    description: 'Pitch black developer environment with subtle blue glow accents and code-first typography.',
    colors: {
      bg: '#090D16',
      surface: '#1E293B',
      surfaceHover: '#334155',
      border: '#334155',
      accent: '#1D4ED8',
      accentGlow: 'rgba(29, 78, 216, 0.3)',
      secondary: '#3B82F6',
      secondaryGlow: 'rgba(59, 130, 246, 0.25)',
      success: '#10B981',
      error: '#EF4444',
      warning: '#F59E0B',
      text: '#F8FAFC',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
    fonts: {
      fontFamily: "'Tajawal', system-ui, sans-serif",
      fontHeading: "'Tajawal', system-ui, sans-serif",
      fontMono: "'JetBrains Mono', monospace",
    },
    cardShadow: '0 0 20px rgba(29, 78, 216, 0.25)',
  },
]

export type Direction = 'rtl' | 'ltr'

interface ThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
  activeCategory: ThemeCategory
  setActiveCategory: (category: ThemeCategory) => void
  direction: Direction
  setDirection: (dir: Direction) => void
  toggleDirection: () => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_THEME_KEY = 'masar-active-theme-id'
const STORAGE_CATEGORY_KEY = 'masar-active-category'
const STORAGE_DIR_KEY = 'masar-active-dir'

export function ThemeProvider({ children }: { children: React.ReactNode }) {
  const [currentTheme, setCurrentTheme] = useState<Theme>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_THEME_KEY)
      if (stored) {
        const found = themes.find((t) => t.id === stored)
        if (found) return found
      }
    } catch {
      // ignore
    }
    return themes[0]
  })

  const [activeCategory, setActiveCategoryState] = useState<ThemeCategory>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_CATEGORY_KEY)
      if (stored === 'english' || stored === 'platform' || stored === 'portfolio') {
        return stored
      }
    } catch {
      // ignore
    }
    return currentTheme.category
  })

  const [direction, setDirectionState] = useState<Direction>(() => {
    try {
      const stored = localStorage.getItem(STORAGE_DIR_KEY)
      if (stored === 'rtl' || stored === 'ltr') return stored
    } catch {
      // ignore
    }
    return 'rtl'
  })

  const setTheme = useCallback((themeId: string) => {
    const found = themes.find((t) => t.id === themeId)
    if (found) {
      setCurrentTheme(found)
      setActiveCategoryState(found.category)
      try {
        localStorage.setItem(STORAGE_THEME_KEY, themeId)
        localStorage.setItem(STORAGE_CATEGORY_KEY, found.category)
      } catch {
        // ignore
      }
    }
  }, [])

  const setActiveCategory = useCallback((category: ThemeCategory) => {
    setActiveCategoryState(category)
    try {
      localStorage.setItem(STORAGE_CATEGORY_KEY, category)
    } catch {
      // ignore
    }
    // Auto-select first theme in category if current theme is not in it
    const firstInCategory = themes.find((t) => t.category === category)
    if (firstInCategory && currentTheme.category !== category) {
      setTheme(firstInCategory.id)
    }
  }, [currentTheme, setTheme])

  const setDirection = useCallback((dir: Direction) => {
    setDirectionState(dir)
    try {
      localStorage.setItem(STORAGE_DIR_KEY, dir)
    } catch {
      // ignore
    }
  }, [])

  const toggleDirection = useCallback(() => {
    setDirectionState((prev) => {
      const next = prev === 'rtl' ? 'ltr' : 'rtl'
      try {
        localStorage.setItem(STORAGE_DIR_KEY, next)
      } catch {
        // ignore
      }
      return next
    })
  }, [])

  // Inject Theme CSS Custom Properties & Fonts dynamically to Document Root
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-theme', currentTheme.id)
    root.setAttribute('data-category', currentTheme.category)
    root.setAttribute('dir', direction)
    root.setAttribute('lang', direction === 'rtl' ? 'ar' : 'en')

    const c = currentTheme.colors
    const f = currentTheme.fonts

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
    root.style.setProperty('--theme-font-family', f.fontFamily)
    root.style.setProperty('--theme-font-heading', f.fontHeading)
    if (f.fontMono) {
      root.style.setProperty('--theme-font-mono', f.fontMono)
    }
    root.style.setProperty('--theme-backdrop-blur', currentTheme.backdropBlur || 'none')
    root.style.setProperty('--theme-card-shadow', currentTheme.cardShadow || 'none')

    // Apply background and body font
    document.body.style.backgroundColor = c.bg
    document.body.style.color = c.text
    document.body.style.fontFamily = f.fontFamily
  }, [currentTheme, direction])

  return (
    <ThemeContext.Provider
      value={{
        theme: currentTheme,
        setTheme,
        themes,
        activeCategory,
        setActiveCategory,
        direction,
        setDirection,
        toggleDirection,
      }}
    >
      {children}
    </ThemeContext.Provider>
  )
}

export function useTheme() {
  const context = useContext(ThemeContext)
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider')
  }
  return context
}
