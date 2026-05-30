import React, { createContext, useContext, useState, useEffect, useCallback } from 'react'
import { useColorScheme, I18nManager } from 'react-native'
import AsyncStorage from '../utils/asyncStorage'
import { themes, defaultThemeId, getThemeById } from './themes'
import type { Theme } from './themes'

export type ThemeMode = 'dark' | 'light' | 'neon'

interface ThemeContextType {
  currentTheme: Theme
  themeId: string
  setThemeById: (id: string) => void
  colors: Theme['colors']
}

const ThemeContext = createContext<ThemeContextType>({
  currentTheme: getThemeById(defaultThemeId),
  themeId: defaultThemeId,
  setThemeById: () => {},
  colors: getThemeById(defaultThemeId).colors,
})

const THEME_KEY = 'masar-theme-id'

export const ThemeProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [themeId, setThemeIdState] = useState(defaultThemeId)

  useEffect(() => {
    AsyncStorage.getItem(THEME_KEY).then((stored) => {
      if (stored && themes.some((t) => t.id === stored)) setThemeIdState(stored)
    })
  }, [])

  const setThemeById = useCallback((id: string) => {
    setThemeIdState(id)
    AsyncStorage.setItem(THEME_KEY, id)
  }, [])

  const currentTheme = getThemeById(themeId)

  return (
    <ThemeContext.Provider value={{ currentTheme, themeId, setThemeById, colors: currentTheme.colors }}>
      {children}
    </ThemeContext.Provider>
  )
}

export const useTheme = () => useContext(ThemeContext)
