import { Outlet, useLocation, Link } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { useTheme } from '../../theme/ThemeContext'
import Sidebar from '@/components/layout/Sidebar'
import { useState, useEffect, useCallback } from 'react'
import { Search, Command, ChevronLeft, Home } from 'lucide-react'
import PomodoroTimer from '@/components/PomodoroTimer'

const ROUTE_LABELS: Record<string, string> = {
  dashboard: 'لوحة التحكم',
  calendar: 'التقويم',
  schedule: 'الجدول الدراسي',
  subjects: 'موادي الدراسية',
  notes: 'ملاحظاتي',
  'study-assistant': 'مساعد الدراسة',
  'quiz-generator': 'توليد الاختبارات',
  flashcards: 'بطاقات تعليمية',
  courses: 'الدورات',
  labs: 'المختبر الذكي',
  agents: 'الذكاء الاصطناعي',
  challenges: 'التحديات',
  projects: 'المشاريع',
  kanban: 'كانبان',
  goals: 'الأهداف',
}

export default function PageLayout() {
  const { theme } = useTheme()
  const location = useLocation()
  const [isNavigating, setIsNavigating] = useState(false)
  const [searchOpen, setSearchOpen] = useState(false)

  useEffect(() => {
    setIsNavigating(true)
    const timer = setTimeout(() => setIsNavigating(false), 600)
    return () => clearTimeout(timer)
  }, [location.pathname])

  const pathSegments = location.pathname.split('/').filter(Boolean)
  const currentLabel = ROUTE_LABELS[pathSegments[0] ?? ''] || ''

  const handleKeyDown = useCallback((e: KeyboardEvent) => {
    if ((e.metaKey || e.ctrlKey) && e.key === 'k') {
      e.preventDefault()
      setSearchOpen((p) => !p)
    }
    if (e.key === 'Escape') setSearchOpen(false)
  }, [])

  useEffect(() => {
    document.addEventListener('keydown', handleKeyDown)
    return () => document.removeEventListener('keydown', handleKeyDown)
  }, [handleKeyDown])

  return (
    <div
      className="flex min-h-screen relative"
      style={{ backgroundColor: theme.colors.bg, color: theme.colors.text }}
    >

      {/* Skip to content link */}
      <a
        href="#main-content"
        className="sr-only focus:not-sr-only focus:fixed focus:top-4 focus:right-4 focus:z-[100] focus:px-6 focus:py-3 focus:rounded-xl focus:font-bold focus:text-white focus:shadow-lg"
        style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
      >
        تخطى إلى المحتوى الرئيسي
      </a>

      {/* Global Loading Bar */}
      <AnimatePresence>
        {isNavigating && (
          <motion.div
            key="loader"
            initial={{ width: 0, opacity: 1 }}
            animate={{ width: '90%', opacity: 1 }}
            exit={{ width: '100%', opacity: 0 }}
            transition={{ duration: 0.6, ease: 'easeInOut' }}
            className="fixed top-0 left-0 h-0.5 z-[100]"
            style={{
              backgroundColor: theme.colors.accent,
              boxShadow: `0 0 24px ${theme.colors.accent}, 0 0 60px ${theme.colors.accent}60`,
            }}
          />
        )}
      </AnimatePresence>

      <Sidebar />

      {/* Main content area */}
      <main
        id="main-content"
        className="flex-1 flex flex-col overflow-hidden"
        style={{ minHeight: '100vh' }}
      >
        {/* Top header bar */}
        <header
          className="flex items-center justify-between px-4 md:px-6 lg:px-8 py-3 shrink-0"
          style={{
            backgroundColor: `${theme.colors.surface}80`,
            borderBottom: `1px solid ${theme.colors.border}40`,
            backdropFilter: 'blur(12px)',
          }}
        >
          {/* Breadcrumbs */}
          <nav aria-label="مسارات التنقل" className="flex items-center gap-2 text-sm">
            <Link to="/dashboard" className="transition-opacity hover:opacity-70" style={{ color: theme.colors.textMuted }}>
              <Home size={15} />
            </Link>
            {pathSegments.length > 0 && (
              <>
                <ChevronLeft size={13} style={{ color: theme.colors.textDark }} />
                <span className="font-semibold" style={{ color: theme.colors.text }}>{currentLabel}</span>
              </>
            )}
          </nav>

          {/* Right side actions */}
          <div className="flex items-center gap-3">
            <button
              onClick={() => setSearchOpen(true)}
              className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-medium transition-all hover:bg-white/5"
              style={{
                color: theme.colors.textMuted,
                border: `1px solid ${theme.colors.border}50`,
              }}
              aria-label="فتح البحث (Ctrl+K)"
            >
              <Search size={14} />
              <span className="hidden sm:inline">بحث...</span>
              <kbd
                className="px-1.5 py-0.5 rounded text-[10px] font-bold"
                style={{
                  backgroundColor: theme.colors.border + '50',
                  color: theme.colors.textDark,
                }}
              >
                {navigator.platform.includes('Mac') ? '⌘K' : 'Ctrl+K'}
              </kbd>
            </button>

            {/* Avatar placeholder */}
            <div
              className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
              aria-label="صورة المستخدم"
            >
              ط
            </div>
          </div>
        </header>

        {/* Page content with transitions */}
        <div className="flex-1 overflow-y-auto p-4 md:p-6 lg:p-8 pb-24 md:pb-8">
          <AnimatePresence mode="wait">
            <motion.div
              key={location.pathname}
              initial={{ opacity: 0, y: 12 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -12 }}
              transition={{ duration: 0.2, ease: 'easeOut' }}
            >
              <Outlet />
            </motion.div>
          </AnimatePresence>
        </div>
      </main>

      {/* Command Palette Modal */}
      <AnimatePresence>
        {searchOpen && (
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[90] flex items-start justify-center pt-[15vh] bg-black/60 backdrop-blur-sm"
            onClick={() => setSearchOpen(false)}
          >
            <motion.div
              initial={{ opacity: 0, scale: 0.95, y: -20 }}
              animate={{ opacity: 1, scale: 1, y: 0 }}
              exit={{ opacity: 0, scale: 0.95, y: -20 }}
              transition={{ duration: 0.15 }}
              className="w-full max-w-lg mx-4 rounded-2xl shadow-2xl overflow-hidden"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
              onClick={(e) => e.stopPropagation()}
              role="dialog"
              aria-label="البحث السريع"
            >
              <div className="flex items-center gap-3 px-5 py-4" style={{ borderBottom: `1px solid ${theme.colors.border}50` }}>
                <Search size={16} style={{ color: theme.colors.textMuted }} />
                <input
                  autoFocus
                  placeholder="ابحث عن صفحة..."
                  className="flex-1 bg-transparent text-sm outline-none"
                  style={{ color: theme.colors.text }}
                  onKeyDown={(e) => { if (e.key === 'Escape') setSearchOpen(false) }}
                />
                <kbd className="px-2 py-0.5 rounded text-[10px] font-bold" style={{ backgroundColor: theme.colors.border + '50', color: theme.colors.textDark }}>
                  ESC
                </kbd>
              </div>
              <div className="py-2 max-h-[300px] overflow-y-auto">
                {Object.entries(ROUTE_LABELS).map(([route, label]) => (
                  <Link
                    key={route}
                    to={`/${route}`}
                    onClick={() => setSearchOpen(false)}
                    className="flex items-center gap-3 px-5 py-3 text-sm transition-all hover:bg-white/5"
                    style={{
                      color: location.pathname === `/${route}` ? theme.colors.accent : theme.colors.textMuted,
                      backgroundColor: location.pathname === `/${route}` ? `${theme.colors.accent}08` : 'transparent',
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full" style={{ backgroundColor: location.pathname === `/${route}` ? theme.colors.accent : theme.colors.textDark }} />
                    {label}
                  </Link>
                ))}
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>

      <PomodoroTimer />
    </div>
  )
}
