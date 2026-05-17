import React, { createContext, useContext, useEffect, useState, ReactNode } from 'react';
import { themes, ThemeConfig } from './themes';

interface ThemeContextProps {
  theme: ThemeConfig;
  setThemeByName: (name: string) => void;
}

const ThemeContext = createContext<ThemeContextProps | undefined>(undefined);

export const ThemeProvider = ({ children }: { children: ReactNode }) => {
  const stored = localStorage.getItem('masarTheme');
  const defaultName = stored && themes[stored] ? stored : Object.keys(themes)[0];
  const [themeName, setThemeName] = useState<string>(defaultName);

  const setThemeByName = (name: string) => {
    if (!themes[name]) return;
    setThemeName(name);
    localStorage.setItem('masarTheme', name);
  };

  // Apply CSS variables to :root whenever theme changes
  useEffect(() => {
    const theme = themes[themeName];
    const root = document.documentElement;
    root.style.setProperty('--bg', theme.colors.background);
    root.style.setProperty('--surface', theme.colors.surface);
    root.style.setProperty('--accent', theme.colors.accent);
    root.style.setProperty('--font-family', theme.fontFamily);
    root.style.setProperty('--radius', theme.borderRadius);
    // extra properties if any
    if (theme.extra) {
      Object.entries(theme.extra).forEach(([k, v]) => {
        root.style.setProperty(`--${k}`, v);
      });
    }
  }, [themeName]);

  const value = {
    theme: themes[themeName],
    setThemeByName,
  };

  return <ThemeContext.Provider value={value}>{children}</ThemeContext.Provider>;
};

export const useTheme = () => {
  const ctx = useContext(ThemeContext);
  if (!ctx) throw new Error('useTheme must be used within ThemeProvider');
  return ctx;
};
