import { useState } from 'react'
import { useTheme } from '../theme/ThemeContext'
import { Palette, ChevronDown, Check } from 'lucide-react'

export default function ThemeSwitcher() {
  const { theme, setTheme, themes } = useTheme()
  const [isOpen, setIsOpen] = useState(false)

  return (
    <div className="relative px-3 pb-3">
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2 px-3 py-2.5 rounded-xl text-sm font-medium transition-all duration-200"
        style={{
          backgroundColor: theme.colors.surfaceHover + '50',
          color: theme.colors.textMuted,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <span
          className="w-4 h-4 rounded-md shrink-0"
          style={{ backgroundColor: theme.colors.accent, boxShadow: `0 0 8px ${theme.colors.accent}60` }}
        />
        <span className="flex-1 text-right">{theme.nameAr}</span>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {isOpen && (
        <div
          className="absolute bottom-full right-0 left-0 mx-3 mb-2 rounded-xl overflow-hidden shadow-xl z-50"
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          <div className="max-h-[320px] overflow-y-auto py-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2.5 text-sm transition-all duration-150"
                style={{
                  color: theme.id === t.id ? theme.colors.accent : theme.colors.textMuted,
                  backgroundColor: theme.id === t.id ? theme.colors.accent + '10' : 'transparent',
                }}
                onMouseEnter={(e) => {
                  if (theme.id !== t.id) {
                    e.currentTarget.style.backgroundColor = theme.colors.surfaceHover + '80'
                  }
                }}
                onMouseLeave={(e) => {
                  if (theme.id !== t.id) {
                    e.currentTarget.style.backgroundColor = 'transparent'
                  }
                }}
              >
                {/* Theme color preview accent bar */}
                <div
                  className="w-1 h-8 rounded-full shrink-0"
                  style={{
                    backgroundColor: t.colors.accent,
                    boxShadow: `0 0 8px ${t.colors.accent}60`,
                  }}
                />
                <span className="flex-1 text-right">{t.nameAr}</span>
                {theme.id === t.id && (
                  <Check size={14} style={{ color: theme.colors.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
