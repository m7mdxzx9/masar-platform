import { useState, useRef, useEffect } from 'react'
import { useTheme, ThemeCategory } from '../theme/ThemeContext'
import { Palette, ChevronDown, Check, Globe, Layout, User, Languages, X } from 'lucide-react'

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
  const menuRef = useRef<HTMLDivElement>(null)

  const categories: { id: ThemeCategory; nameEn: string; nameAr: string; icon: any }[] = [
    { id: 'english', nameEn: 'English UI', nameAr: 'واجهات إنكليزية', icon: Globe },
    { id: 'platform', nameEn: 'Full Platform', nameAr: 'المنصة الشاملة', icon: Layout },
    { id: 'portfolio', nameEn: 'Portfolio UI', nameAr: 'معرض المطور', icon: User },
  ]

  const filteredThemes = themes.filter((t) => t.category === activeCategory)

  // Close when clicking outside
  useEffect(() => {
    const handleClickOutside = (e: MouseEvent) => {
      if (menuRef.current && !menuRef.current.contains(e.target as Node)) {
        setIsOpen(false)
      }
    }
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside)
    }
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [isOpen])

  return (
    <div className="relative px-3 pb-3" ref={menuRef}>
      {/* Master Toggle Trigger */}
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center gap-2.5 px-3 py-2.5 rounded-xl text-xs font-bold transition-all duration-200 shadow-md cursor-pointer hover:brightness-110"
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

      {/* Popover Dropdown Modal */}
      {isOpen && (
        <div
          className="absolute bottom-full right-0 mb-3 w-[320px] sm:w-[340px] rounded-2xl overflow-hidden shadow-2xl z-[100] flex flex-col backdrop-blur-2xl transition-all border"
          style={{
            backgroundColor: 'rgba(15, 23, 42, 0.95)',
            borderColor: 'rgba(99, 102, 241, 0.4)',
            boxShadow: '0 20px 50px rgba(0, 0, 0, 0.6), 0 0 25px rgba(99, 102, 241, 0.2)',
          }}
        >
          {/* Header & Direction Switcher */}
          <div className="p-3.5 border-b border-slate-800 flex items-center justify-between bg-slate-900/80">
            <div className="flex items-center gap-2 text-xs font-extrabold text-white">
              <Palette size={16} className="text-indigo-400" />
              <span>مبدّل الاتجاهات البصرية (9 ثيمات)</span>
            </div>

            <div className="flex items-center gap-2">
              <button
                onClick={toggleDirection}
                className="flex items-center gap-1 px-2 py-1 rounded-lg text-[10px] font-bold bg-slate-800 hover:bg-slate-700 text-indigo-300 border border-slate-700 cursor-pointer"
                title="تغيير اتجاه الواجهة LTR / RTL"
              >
                <Languages size={12} />
                <span>{direction.toUpperCase()}</span>
              </button>

              <button
                onClick={() => setIsOpen(false)}
                className="p-1 rounded-lg text-slate-400 hover:text-white hover:bg-slate-800"
              >
                <X size={16} />
              </button>
            </div>
          </div>

          {/* Category Tabs */}
          <div className="p-2 border-b border-slate-800 grid grid-cols-3 gap-1.5 bg-slate-950/60">
            {categories.map((cat) => {
              const Icon = cat.icon
              const isActive = activeCategory === cat.id
              return (
                <button
                  key={cat.id}
                  onClick={() => setActiveCategory(cat.id)}
                  className={`flex flex-col items-center justify-center py-2 px-1 rounded-xl text-[10px] font-extrabold transition-all cursor-pointer border ${
                    isActive
                      ? 'bg-indigo-600 text-white border-indigo-400 shadow-[0_0_12px_rgba(99,102,241,0.4)]'
                      : 'bg-slate-900/80 text-slate-400 border-slate-800 hover:text-slate-200 hover:bg-slate-800'
                  }`}
                >
                  <Icon size={14} className="mb-1" />
                  <span className="truncate max-w-full">{direction === 'rtl' ? cat.nameAr : cat.nameEn}</span>
                </button>
              )
            })}
          </div>

          {/* Themes List */}
          <div className="max-h-[260px] overflow-y-auto p-2 space-y-1.5 hide-scrollbar">
            {filteredThemes.map((t) => {
              const isSelected = theme.id === t.id
              return (
                <button
                  key={t.id}
                  onClick={() => {
                    setTheme(t.id)
                    setIsOpen(false)
                  }}
                  className={`w-full flex items-start gap-3 p-3 rounded-xl transition-all duration-150 text-right cursor-pointer border ${
                    isSelected
                      ? 'bg-indigo-950/70 border-indigo-500 text-white shadow-md'
                      : 'bg-slate-900/60 border-slate-800/80 text-slate-300 hover:bg-slate-800/80 hover:border-slate-700'
                  }`}
                >
                  <div
                    className="w-2.5 h-9 rounded-full shrink-0 mt-0.5"
                    style={{
                      backgroundColor: t.colors.accent,
                      boxShadow: `0 0 10px ${t.colors.accent}90`,
                    }}
                  />

                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between gap-1 mb-0.5">
                      <span className="font-extrabold text-xs text-white truncate">
                        {t.nameAr}
                      </span>
                      {isSelected && <Check size={14} className="text-indigo-400 shrink-0" />}
                    </div>
                    <span className="block text-[10px] font-medium text-slate-400 truncate">{t.name}</span>
                    <p className="text-[10px] mt-1 text-slate-500 line-clamp-1">
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
