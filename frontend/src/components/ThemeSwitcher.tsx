import { useState } from 'react'
import { useTheme, ThemeCategory } from '../theme/ThemeContext'
import { Palette, ChevronDown, Check, Globe, Layout, User, Languages } from 'lucide-react'

export default function ThemeSwitcher() {
  const {
    theme,
    setTheme,
    themes,
    activeCategory,
    setActiveCategory,
    direction,
    toggleDirection,
  } = useTheme()

  const [isOpen, setIsOpen] = useState(false)

  const categories: { id: ThemeCategory; nameEn: string; nameAr: string; icon: any }[] = [
    { id: 'english', nameEn: 'English UI', nameAr: 'واجهات إنكليزية', icon: Globe },
    { id: 'platform', nameEn: 'Full Platform', nameAr: 'المنصة الشاملة', icon: Layout },
    { id: 'portfolio', nameEn: 'Portfolio UI', nameAr: 'معرض المطور', icon: User },
  ]

  const filteredThemes = themes.filter((t) => t.category === activeCategory)

  return (
    <div className="relative px-3 pb-3">
      {/* Master Toggle Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer"
        style={{
          backgroundColor: theme.colors.surface,
          color: theme.colors.text,
          border: `1px solid ${theme.colors.border}`,
        }}
      >
        <span
          className="w-3.5 h-3.5 rounded-md shrink-0 shadow-sm"
          style={{ backgroundColor: theme.colors.accent, boxShadow: `0 0 8px ${theme.colors.accent}80` }}
        />
        <div className="flex-1 text-right truncate">
          <span className="block font-bold text-xs truncate">{theme.nameAr}</span>
          <span className="block text-[10px] opacity-70 truncate">{theme.name}</span>
        </div>
        <ChevronDown
          size={14}
          className={`transition-transform duration-200 shrink-0 ${isOpen ? 'rotate-180' : ''}`}
        />
      </button>

      {/* Dropdown Menu Modal */}
      {isOpen && (
        <div
          className="absolute bottom-full right-0 left-0 mx-3 mb-2 rounded-2xl overflow-hidden shadow-2xl z-50 flex flex-col backdrop-blur-xl transition-all border"
          style={{
            backgroundColor: theme.colors.surface,
            borderColor: theme.colors.border,
            boxShadow: theme.cardShadow || '0 20px 40px rgba(0,0,0,0.5)',
          }}
        >
          {/* Header & Direction Switcher */}
          <div className="p-3 border-b flex items-center justify-between" style={{ borderColor: theme.colors.border }}>
            <div className="flex items-center gap-1.5 text-xs font-extrabold" style={{ color: theme.colors.text }}>
              <Palette size={14} style={{ color: theme.colors.accent }} />
              <span>مبدّل الاتجاهات البصرية الـ 9</span>
            </div>

            {/* Direction Switcher Toggle Button */}
            <button
              onClick={toggleDirection}
              className="flex items-center gap-1 px-2.5 py-1 rounded-lg text-[10px] font-bold border transition-all cursor-pointer"
              style={{
                backgroundColor: theme.colors.surfaceHover,
                color: theme.colors.accent,
                borderColor: theme.colors.border,
              }}
              title="تغيير اتجاه الواجهة LTR / RTL"
            >
              <Languages size={12} />
              <span>{direction.toUpperCase()}</span>
            </button>
          </div>

          {/* Category Tabs (English, Platform, Portfolio) */}
          <div className="p-2 border-b grid grid-cols-3 gap-1" style={{ borderColor: theme.colors.border, backgroundColor: theme.colors.bg + '60' }}>
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className="flex flex-col items-center justify-center py-1.5 px-1 rounded-xl text-[10px] font-bold transition-all cursor-pointer"
                  style={{
                    backgroundColor: isActive ? theme.colors.accent : 'transparent',
                    color: isActive ? '#FFFFFF' : theme.colors.textMuted,
                    boxShadow: isActive ? `0 2px 10px ${theme.colors.accent}50` : 'none',
                  }}
                >
                  <Icon size={12} className="mb-0.5" />
                  <span className="truncate">{direction === 'rtl' ? cat.nameAr : cat.nameEn}</span>
                </button>
              )
            })}
          </div>

          {/* Themes List for Active Category */}
          <div className="max-h-[260px] overflow-y-auto p-2 space-y-1.5 scrollbar-thin">
            {filteredThemes.map((t) => {
              const isSelected = theme.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                    setIsOpen(false)
                  }}
                  className="w-full flex items-start gap-2.5 p-2.5 rounded-xl transition-all duration-150 text-right cursor-pointer border"
                  style={{
                    backgroundColor: isSelected ? `${t.colors.accent}15` : t.colors.surfaceHover + '40',
                    borderColor: isSelected ? t.colors.accent : 'transparent',
                  }}
                >
                  {/* Theme Accent Color Bar */}
                  <div
                    className="w-2 h-10 rounded-full shrink-0 mt-0.5"
                    style={{
                      backgroundColor: t.colors.accent,
                      boxShadow: `0 0 10px ${t.colors.accent}80`,
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-extrabold text-xs truncate" style={{ color: isSelected ? t.colors.accent : t.colors.text }}>
                        {t.nameAr}
                      </span>
                      {isSelected && <Check size={14} className="shrink-0" style={{ color: t.colors.accent }} />}
                    </div>
                    <span className="block text-[10px] font-medium opacity-70 truncate">{t.name}</span>
                    <p className="text-[9px] mt-1 line-clamp-1 opacity-60" style={{ color: t.colors.textMuted }}>
                      {t.description}
                    </p>
                  </div>
                </button>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
