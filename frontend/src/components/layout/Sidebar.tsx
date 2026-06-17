import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import ThemeSwitcher from '../ThemeSwitcher'
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  BookOpen,
  BookMarked,
  StickyNote,
  FlaskConical,
  BrainCircuit,
  Trophy,
  BookmarkPlus,
  ChevronRight,
  Rocket,
  KanbanSquare,
  Lightbulb,
  ClipboardList,
  Target,
  Globe,
  HardDrive,
  BarChart3,
  Cloud,
  Library,
  ChevronDown,
  LayoutGrid,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'
import { motion } from 'framer-motion'
import { useState } from 'react'

const categorizedLinks = [
  {
    id: 'academic',
    i18nKey: 'nav.catAcademic',
    links: [
      { to: '/dashboard', i18nKey: 'nav.dashboard', icon: LayoutDashboard },
      { to: '/calendar', i18nKey: 'nav.calendar', icon: Calendar },
      { to: '/schedule', i18nKey: 'nav.schedule', icon: GraduationCap },
      { to: '/subjects', i18nKey: 'nav.subjects', icon: BookMarked },
      { to: '/notes', i18nKey: 'nav.notes', icon: StickyNote },
    ]
  },
  {
    id: 'ai',
    i18nKey: 'nav.catAI',
    links: [
      { to: '/study-assistant', i18nKey: 'nav.studyAssistant', icon: Lightbulb },
      { to: '/lessons', i18nKey: 'nav.lessons', icon: Library },
      { to: '/labs', i18nKey: 'nav.labs', icon: FlaskConical },
      { to: '/agents', i18nKey: 'nav.agents', icon: BrainCircuit, badge: '5+' },
      { to: '/quiz-generator', i18nKey: 'nav.quizGenerator', icon: ClipboardList },
      { to: '/flashcards', i18nKey: 'nav.flashcards', icon: BrainCircuit },
    ]
  },
  {
    id: 'productivity',
    i18nKey: 'nav.catProductivity',
    links: [
      { to: '/courses', i18nKey: 'nav.courses', icon: BookOpen },
      { to: '/challenges', i18nKey: 'nav.challenges', icon: Trophy, badge: 'nav.new' },
      { to: '/projects', i18nKey: 'nav.projects', icon: Rocket },
      { to: '/kanban', i18nKey: 'nav.kanban', icon: KanbanSquare },
      { to: '/goals', i18nKey: 'nav.goals', icon: Target },
      { to: '/code-library', i18nKey: 'nav.codeLibrary', icon: BookmarkPlus },
    ]
  },
  {
    id: 'system',
    i18nKey: 'nav.catSystem',
    links: [
      { to: '/backup', i18nKey: 'nav.backup', icon: HardDrive },
      { to: '/drive', i18nKey: 'nav.drive', icon: Cloud },
      { to: '/analytics', i18nKey: 'nav.analytics', icon: BarChart3 },
    ]
  }
]

const navLinks = [
  { to: '/dashboard', i18nKey: 'nav.dashboard', icon: LayoutDashboard },
  { to: '/courses', i18nKey: 'nav.courses', icon: BookOpen },
  { to: '/agents', i18nKey: 'nav.agents', icon: BrainCircuit },
  { to: '/labs', i18nKey: 'nav.labs', icon: FlaskConical },
  { to: '/more', i18nKey: 'nav.more', icon: LayoutGrid },
]

export default function Sidebar() {
  const location = useLocation()
  const { theme } = useTheme()
  const { t, i18n } = useTranslation()
  const { sidebarCollapsed, toggleSidebar } = useThemeStore()

  // Track expanded/collapsed categories
  const [expandedCats, setExpandedCats] = useState<Record<string, boolean>>({
    academic: true,
    ai: true,
    productivity: true,
    system: true,
  })

  const toggleCategory = (catId: string) => {
    setExpandedCats(prev => ({
      ...prev,
      [catId]: !prev[catId]
    }))
  }

  const renderLink = (link: any) => {
    const isActive = location.pathname === link.to
    const Icon = link.icon
    return (
      <Link
        key={link.to}
        to={link.to}
        aria-label={t(link.i18nKey)}
        className={`group relative flex items-center gap-3 px-4 py-1.5 rounded-xl text-[13px] font-semibold transition-all duration-200 ${!isActive && 'hover:bg-white/[0.04]'}`}
        style={{
          color: isActive ? '#fff' : theme.colors.textMuted,
          background: isActive ? `linear-gradient(135deg, ${theme.colors.accent}25, ${theme.colors.secondary}15)` : 'transparent',
          border: isActive ? `1px solid ${theme.colors.accent}25` : '1px solid transparent',
        }}
      >
        {isActive && (
          <motion.div
            layoutId="sidebar-active"
            className="absolute right-0 top-1/2 -translate-y-1/2 w-1 h-6 rounded-l-full"
            style={{ background: theme.colors.accent, boxShadow: `0 0 12px ${theme.colors.accent}` }}
            transition={{ type: 'spring', stiffness: 500, damping: 30 }}
          />
        )}
        <Icon
          size={18}
          className="transition-all duration-200 group-hover:scale-110 group-hover:[filter:drop-shadow(0_0_6px_var(--theme-accent))]"
          style={{
            color: isActive ? theme.colors.accent : theme.colors.textDark,
          }}
        />
        {!sidebarCollapsed && (
          <div className="flex-1 flex items-center justify-between min-w-0">
            <span className="truncate">{t(link.i18nKey)}</span>
            {link.badge && (
              <span
                className="px-2 py-0.5 rounded-full text-[10px] font-bold shrink-0"
                style={{
                  backgroundColor: isActive ? `${theme.colors.accent}25` : theme.colors.border + '50',
                  color: isActive ? theme.colors.accent : theme.colors.textDark,
                }}
              >
                {link.badge.startsWith('nav.') ? t(link.badge) : link.badge}
              </span>
            )}
          </div>
        )}
      </Link>
    )
  }

  const toggleLang = () => {
    const newLang = i18n.language === 'ar' ? 'en' : 'ar'
    i18n.changeLanguage(newLang)
    localStorage.setItem('masar-lang', newLang)
    document.documentElement.dir = newLang === 'ar' ? 'rtl' : 'ltr'
    document.documentElement.lang = newLang
  }

  return (
    <>
      {/* Desktop Sidebar */}
      <aside
        className={`hidden md:flex flex-col transition-all duration-300 shrink-0 relative z-20 backdrop-blur-xl ${
          sidebarCollapsed ? 'w-[72px]' : 'w-[240px]'
        }`}
        style={{
          backgroundColor: 'rgba(10, 14, 23, 0.4)',
          borderLeft: `1px solid rgba(255, 255, 255, 0.03)`,
          boxShadow: `4px 0 32px rgba(0,0,0,0.3)`,
        }}
        aria-label={t('nav.sidebar')}
      >
        {/* Header */}
        <div className="flex items-center justify-between px-5 py-5" style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.04)` }}>
          <Link to="/" className="flex items-center gap-3" aria-label={t('nav.home')}>
            <motion.div
              whileHover={{ scale: 1.05, rotate: -3 }}
              className="w-9 h-9 rounded-xl flex items-center justify-center text-base font-bold text-white shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            >
              م
            </motion.div>
            {!sidebarCollapsed && (
              <motion.span
                initial={false}
                animate={{ opacity: 1 }}
                className="text-xl font-bold tracking-tight text-transparent bg-clip-text"
                style={{ backgroundImage: `linear-gradient(to left, ${theme.colors.text}, ${theme.colors.textMuted})` }}
              >
                {t('app.name')}
              </motion.span>
            )}
          </Link>
          <button
            onClick={toggleSidebar}
            className="p-1.5 rounded-lg transition-all hover:bg-white/10"
            style={{ color: theme.colors.textMuted }}
            aria-label={sidebarCollapsed ? t('nav.expandSidebar') : t('nav.collapseSidebar')}
          >
            <ChevronRight size={16} className={`transition-transform duration-300 ${sidebarCollapsed ? 'rotate-180' : ''}`} />
          </button>
        </div>

        {/* Navigation */}
        <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-3 hide-scrollbar" aria-label={t('nav.navigation')}>
          {sidebarCollapsed ? (
            categorizedLinks.map((cat, catIdx) => (
              <div key={cat.id} className="space-y-1">
                {cat.links.map(renderLink)}
                {catIdx < categorizedLinks.length - 1 && (
                  <div className="h-[1px] bg-white/5 my-3 mx-1" />
                )}
              </div>
            ))
          ) : (
            categorizedLinks.map((cat) => {
              const isExpanded = expandedCats[cat.id] ?? true
              return (
                <div key={cat.id} className="space-y-1">
                  {/* Category Header */}
                  <button
                    onClick={() => toggleCategory(cat.id)}
                    className="w-full flex items-center justify-between px-3 py-1 text-[10px] font-bold tracking-wider text-white/30 uppercase hover:text-white/60 transition-colors"
                  >
                    <span>{t(cat.i18nKey)}</span>
                    <ChevronDown
                      size={10}
                      className={`transition-transform duration-200 ${!isExpanded ? 'rotate-90 rtl:-rotate-90' : ''}`}
                    />
                  </button>
                  
                  {/* Category Links */}
                  {isExpanded && (
                    <div className="space-y-0.5">
                      {cat.links.map(renderLink)}
                    </div>
                  )}
                </div>
              )
            })
          )}
        </nav>

        {/* Footer */}
        <div className="px-3 py-3 space-y-2" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.04)` }}>
          {/* Language Switcher */}
          <button
            onClick={toggleLang}
            className="w-full flex items-center justify-center gap-2 text-[11px] font-semibold px-3 py-2.5 rounded-xl bg-black/20 transition-all hover:bg-white/10"
            style={{ color: theme.colors.textMuted }}
            aria-label={t('nav.language')}
          >
            <Globe size={14} />
            {!sidebarCollapsed && (i18n.language === 'ar' ? 'English' : 'العربية')}
          </button>

          {/* Connection Status */}
          <div className="flex items-center justify-center gap-2 text-[11px] font-semibold px-3 py-2.5 rounded-xl bg-black/20" style={{ color: theme.colors.textMuted }}>
            <motion.span
              animate={{ opacity: [1, 0.4, 1] }}
              transition={{ duration: 2, repeat: Infinity }}
              className="w-1.5 h-1.5 rounded-full bg-green-500 shrink-0"
              style={{ boxShadow: '0 0 6px rgba(34,197,94,0.6)' }}
            />
            {!sidebarCollapsed && t('nav.connected')}
          </div>
        </div>
        <ThemeSwitcher />
      </aside>

      {/* Mobile Bottom Navigation */}
      <nav
        className="md:hidden fixed bottom-0 left-0 right-0 z-30 flex items-center justify-around px-2 py-2 backdrop-blur-xl"
        style={{
          backgroundColor: 'rgba(10, 14, 23, 0.92)',
          borderTop: `1px solid rgba(255, 255, 255, 0.05)`,
        }}
        aria-label={t('nav.mobileNav')}
      >
        {navLinks.slice(0, 5).map((link) => {
          const isActive = location.pathname === link.to
          const Icon = link.icon
          return (
            <Link
              key={link.to}
              to={link.to}
              aria-label={t(link.i18nKey)}
              className="flex flex-col items-center gap-0.5 px-3 py-1.5 rounded-xl transition-all"
              style={{ color: isActive ? theme.colors.accent : theme.colors.textMuted }}
            >
              <Icon size={18} />
              <span className="text-[9px] font-semibold">{t(link.i18nKey)}</span>
            </Link>
          )
        })}
      </nav>
    </>
  )
}
