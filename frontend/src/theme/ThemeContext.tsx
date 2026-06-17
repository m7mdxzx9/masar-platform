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
      bg: '#0A0E17',
      surface: '#141A2E',
      surfaceHover: '#1E2740',
      border: '#2A3550',
      accent: '#00FFFF',
      accentGlow: 'rgba(0, 255, 255, 0.12)',
      secondary: '#2400FF',
      secondaryGlow: 'rgba(36, 0, 255, 0.25)',
      success: '#00FF88',
      error: '#FF4466',
      warning: '#FFA500',
      text: '#F1F5F9',
      textMuted: '#94A3B8',
      textDark: '#64748B',
    },
  },
  {
    id: 'midnight-blue',
    name: 'Midnight Blue',
    nameAr: 'أزرق منتصف الليل',
    colors: {
      bg: '#080C18',
      surface: '#10162E',
      surfaceHover: '#182242',
      border: '#253358',
      accent: '#4D8EFF',
      accentGlow: 'rgba(77, 142, 255, 0.18)',
      secondary: '#7B61FF',
      secondaryGlow: 'rgba(123, 97, 255, 0.22)',
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
      bg: '#0A1410',
      surface: '#12241C',
      surfaceHover: '#1A3228',
      border: '#244838',
      accent: '#4ADE80',
      accentGlow: 'rgba(74, 222, 128, 0.15)',
      secondary: '#22D3EE',
      secondaryGlow: 'rgba(34, 211, 238, 0.18)',
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
      bg: '#140C08',
      surface: '#241810',
      surfaceHover: '#34241A',
      border: '#483026',
      accent: '#FB923C',
      accentGlow: 'rgba(251, 146, 60, 0.18)',
      secondary: '#F97316',
      secondaryGlow: 'rgba(249, 115, 22, 0.22)',
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
      bg: '#0E0618',
      surface: '#1A0E2E',
      surfaceHover: '#261842',
      border: '#342258',
      accent: '#A855F7',
      accentGlow: 'rgba(168, 85, 247, 0.18)',
      secondary: '#E879F9',
      secondaryGlow: 'rgba(232, 121, 249, 0.18)',
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
      bg: '#060F14',
      surface: '#0C1E2C',
      surfaceHover: '#142E40',
      border: '#1A3E54',
      accent: '#06B6D4',
      accentGlow: 'rgba(6, 182, 212, 0.18)',
      secondary: '#0EA5E9',
      secondaryGlow: 'rgba(14, 165, 233, 0.18)',
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
      bg: '#140C10',
      surface: '#24161C',
      surfaceHover: '#34222A',
      border: '#462C38',
      accent: '#F472B6',
      accentGlow: 'rgba(244, 114, 182, 0.18)',
      secondary: '#E11D48',
      secondaryGlow: 'rgba(225, 29, 72, 0.18)',
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
      accentGlow: 'rgba(14, 165, 233, 0.12)',
      secondary: '#6366F1',
      secondaryGlow: 'rgba(99, 102, 241, 0.12)',
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
      bg: '#070708',
      surface: '#141416',
      surfaceHover: '#202024',
      border: '#3A3A40',
      accent: '#EAB308',
      accentGlow: 'rgba(234, 179, 8, 0.15)',
      secondary: '#F59E0B',
      secondaryGlow: 'rgba(245, 158, 11, 0.18)',
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
      bg: '#160C10',
      surface: '#24141C',
      surfaceHover: '#341E28',
      border: '#442A36',
      accent: '#FDA4AF',
      accentGlow: 'rgba(253, 164, 175, 0.15)',
      secondary: '#FB7185',
      secondaryGlow: 'rgba(251, 113, 133, 0.18)',
      success: '#86EFAC',
      error: '#FCA5A5',
      warning: '#FDE68A',
      text: '#FFF1F2',
      textMuted: '#E8B4BC',
      textDark: '#C8909C',
    },
  },
  {
    id: 'neo-minimalist',
    name: 'Neo Minimalist',
    nameAr: 'نيو مينيماليست',
    colors: {
      bg: '#0F172A',
      surface: '#1E293B',
      surfaceHover: '#2A3A4B',
      border: '#3A4A5B',
      accent: '#00FFFF',
      accentGlow: 'rgba(0, 255, 255, 0.15)',
      secondary: '#bec6e0',
      secondaryGlow: 'rgba(190, 198, 224, 0.15)',
      success: '#86EFAC',
      error: '#ffb4ab',
      warning: '#FBBF24',
      text: '#e4e2e4',
      textMuted: '#c6c6cd',
      textDark: '#909097',
    },
  },
  {
    id: 'warm-scholar',
    name: 'Warm Scholar',
    nameAr: 'أكاديمي دافئ',
    colors: {
      bg: '#120D0A',
      surface: '#2A1F18',
      surfaceHover: '#3D2E24',
      border: '#4d4540',
      accent: '#F0A500',
      accentGlow: 'rgba(240, 165, 0, 0.2)',
      secondary: '#d1c4bd',
      secondaryGlow: 'rgba(209, 196, 189, 0.15)',
      success: '#86EFAC',
      error: '#ffb4ab',
      warning: '#FBBF24',
      text: '#f4dfcb',
      textMuted: '#d0c4bd',
      textDark: '#998f89',
    },
  },
  {
    id: 'electric-aurora',
    name: 'Electric Aurora',
    nameAr: 'الشفق الكهربائي',
    colors: {
      bg: '#0D0A1A',
      surface: '#1A1530',
      surfaceHover: '#25204A',
      border: '#48464c',
      accent: '#00FF88',
      accentGlow: 'rgba(0, 255, 136, 0.2)',
      secondary: '#00FFFF',
      secondaryGlow: 'rgba(0, 255, 255, 0.2)',
      success: '#00FF88',
      error: '#ffb4ab',
      warning: '#FBBF24',
      text: '#e6e1e3',
      textMuted: '#c9c5cc',
      textDark: '#938f96',
    },
  },
  {
    id: 'nordic-frost',
    name: 'Nordic Frost',
    nameAr: 'صقيع نوردي',
    colors: {
      bg: '#0F1928',
      surface: '#1C2128',
      surfaceHover: '#2D3748',
      border: '#3E4C59',
      accent: '#5B8DEF',
      accentGlow: 'rgba(91, 141, 239, 0.2)',
      secondary: '#aec6ff',
      secondaryGlow: 'rgba(174, 198, 255, 0.15)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#F5F7FA',
      textMuted: '#c3c6d4',
      textDark: '#8d909e',
    },
  },
  {
    id: 'cyberpunk-terminal',
    name: 'Cyberpunk Terminal',
    nameAr: 'طرفية سايبربانك',
    colors: {
      bg: '#000000',
      surface: '#0D0D0D',
      surfaceHover: '#1A1A1A',
      border: '#333333',
      accent: '#FF00FF',
      accentGlow: 'rgba(255, 0, 255, 0.25)',
      secondary: '#00FFFF',
      secondaryGlow: 'rgba(0, 255, 255, 0.25)',
      success: '#00FFFF',
      error: '#FF00FF',
      warning: '#FFA500',
      text: '#e2e2e2',
      textMuted: '#cfc4c5',
      textDark: '#988e90',
    },
  },
  {
    id: 'glass-gradient',
    name: 'Glass & Gradient',
    nameAr: 'زجاج وتدرج',
    colors: {
      bg: '#0A0E27',
      surface: 'rgba(26, 21, 48, 0.6)',
      surfaceHover: 'rgba(37, 32, 74, 0.6)',
      border: '#46464d',
      accent: '#818CF8',
      accentGlow: 'rgba(129, 140, 248, 0.25)',
      secondary: '#A78BFA',
      secondaryGlow: 'rgba(167, 139, 250, 0.2)',
      success: '#34D399',
      error: '#F87171',
      warning: '#FBBF24',
      text: '#e5e1e4',
      textMuted: '#c7c5ce',
      textDark: '#919098',
    },
  },
  {
    id: 'brutalist-tech',
    name: 'Brutalist Tech',
    nameAr: 'تقنية وحشية',
    colors: {
      bg: '#111111',
      surface: '#1A1A1A',
      surfaceHover: '#222222',
      border: '#444748',
      accent: '#FF4400',
      accentGlow: 'rgba(255, 68, 0, 0.25)',
      secondary: '#ffb5a1',
      secondaryGlow: 'rgba(255, 181, 161, 0.15)',
      success: '#22C55E',
      error: '#EF4444',
      warning: '#F97316',
      text: '#FFFFFF',
      textMuted: '#c4c7c7',
      textDark: '#8e9192',
    },
  },
  {
    id: 'zen-garden',
    name: 'Zen Garden',
    nameAr: 'حديقة زن',
    colors: {
      bg: '#0F1A13',
      surface: '#1A2A1F',
      surfaceHover: '#26362C',
      border: '#434844',
      accent: '#4ADE80',
      accentGlow: 'rgba(74, 222, 128, 0.2)',
      secondary: '#22D3EE',
      secondaryGlow: 'rgba(34, 211, 238, 0.15)',
      success: '#86EFAC',
      error: '#FCA5A5',
      warning: '#FDE68A',
      text: '#e4e2e0',
      textMuted: '#c3c8c2',
      textDark: '#8d928d',
    },
  },
  {
    id: 'midnight-blueprint',
    name: 'Midnight Blueprint',
    nameAr: 'مخطط منتصف الليل',
    colors: {
      bg: '#071224',
      surface: '#0B1E3D',
      surfaceHover: '#142B52',
      border: '#44474e',
      accent: '#FFD700',
      accentGlow: 'rgba(255, 215, 0, 0.25)',
      secondary: '#b6c6ee',
      secondaryGlow: 'rgba(182, 198, 238, 0.15)',
      success: '#22D3EE',
      error: '#F472B6',
      warning: '#FFD700',
      text: '#d3e4fc',
      textMuted: '#c5c6cf',
      textDark: '#8f9098',
    },
  },
  {
    id: 'desert-oasis',
    name: 'Desert Oasis',
    nameAr: 'واحة صحراوية',
    colors: {
      bg: '#1A1610',
      surface: '#2A2318',
      surfaceHover: '#3A3025',
      border: '#4b463f',
      accent: '#0D9488',
      accentGlow: 'rgba(13, 148, 136, 0.2)',
      secondary: '#F97316',
      secondaryGlow: 'rgba(249, 115, 22, 0.2)',
      success: '#0D9488',
      error: '#EF4444',
      warning: '#F97316',
      text: '#e6e1e0',
      textMuted: '#cec5bc',
      textDark: '#979087',
    },
  },
]

export type DesignStyle = 'classic' | 'brutalist' | 'glass'

interface ThemeContextType {
  theme: Theme
  setTheme: (themeId: string) => void
  themes: Theme[]
  designStyle: DesignStyle
  setDesignStyle: (style: DesignStyle) => void
}

const ThemeContext = createContext<ThemeContextType | null>(null)

const STORAGE_KEY = 'masar-theme-id'
const DESIGN_STYLE_KEY = 'masar-design-style'

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

  const [designStyle, setDesignStyleState] = useState<DesignStyle>(() => {
    try {
      const stored = localStorage.getItem(DESIGN_STYLE_KEY)
      if (stored === 'brutalist' || stored === 'glass') return stored
    } catch {
      // ignore
    }
    return 'classic'
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

  const setDesignStyle = useCallback((style: DesignStyle) => {
    setDesignStyleState(style)
    try {
      localStorage.setItem(DESIGN_STYLE_KEY, style)
    } catch {
      // ignore
    }
  }, [])

  // Apply theme CSS custom properties to document root
  useEffect(() => {
    const root = document.documentElement
    root.setAttribute('data-design', designStyle)

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
  }, [currentTheme, designStyle])

  return (
    <ThemeContext.Provider value={{ theme: currentTheme, setTheme, themes, designStyle, setDesignStyle }}>
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
