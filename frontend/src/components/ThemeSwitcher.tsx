import { useState } from 'react'
import { useTheme, DesignStyle } from '../theme/ThemeContext'
import { Palette, ChevronDown, Check, Layers, Sliders } from 'lucide-react'

export default function ThemeSwitcher() {
  const { theme, setTheme, themes, designStyle, setDesignStyle } = useTheme()
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
          className="absolute bottom-full right-0 left-0 mx-3 mb-2 rounded-xl overflow-hidden shadow-xl z-50 flex flex-col"
          style={{
            backgroundColor: theme.colors.surface,
            border: `1px solid ${theme.colors.border}`,
          }}
        >
          {/* Design Style Section */}
          <div className="p-3 border-b" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold mb-2 text-right justify-start" style={{ color: theme.colors.textDark }}>
              <Layers size={12} style={{ color: theme.colors.accent }} />
              <span>طراز تصميم الواجهة</span>
            </div>
            <div 
              className="grid grid-cols-3 gap-1 p-1 rounded-lg"
              style={{ backgroundColor: theme.colors.surfaceHover + '40' }}
            >
              {[
                { id: 'classic', name: 'كلاسيك' },
                { id: 'brutalist', name: 'وحشي' },
                { id: 'glass', name: 'زجاجي' }
              ].map((style) => (
                <button
                  key={style.id}
                  onClick={() => setDesignStyle(style.id as DesignStyle)}
                  className="text-[11px] py-1.5 px-1 rounded-md font-medium transition-all cursor-pointer text-center select-none"
                  style={{
                    backgroundColor: designStyle === style.id ? theme.colors.accent : 'transparent',
                    color: designStyle === style.id ? '#ffffff' : theme.colors.textMuted,
                    boxShadow: designStyle === style.id ? `0 2px 8px ${theme.colors.accent}40` : 'none',
                  }}
                >
                  {style.name}
                </button>
              ))}
            </div>
          </div>

          {/* Color Themes Section */}
          <div className="p-2 border-b" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center gap-1.5 text-xs font-semibold px-2 text-right justify-start" style={{ color: theme.colors.textDark }}>
              <Palette size={12} style={{ color: theme.colors.accent }} />
              <span>مظهر الألوان</span>
            </div>
          </div>
          
          <div className="max-h-[220px] overflow-y-auto py-1">
            {themes.map((t) => (
              <button
                key={t.id}
                onClick={() => {
                  setTheme(t.id)
                  setIsOpen(false)
                }}
                className="w-full flex items-center gap-3 px-3 py-2 text-sm transition-all duration-150 cursor-pointer"
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
                  className="w-1.5 h-6 rounded-full shrink-0"
                  style={{
                    backgroundColor: t.colors.accent,
                    boxShadow: `0 0 6px ${t.colors.accent}60`,
                  }}
                />
                <span className="flex-1 text-right text-xs">{t.nameAr}</span>
                {theme.id === t.id && (
                  <Check size={12} style={{ color: theme.colors.accent }} />
                )}
              </button>
            ))}
          </div>
        </div>
      )}
    </div>
  )
}
