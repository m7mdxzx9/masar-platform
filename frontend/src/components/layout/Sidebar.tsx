import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext'
import ThemeSwitcher from '../ThemeSwitcher'
import {
  LayoutDashboard,
  Calendar,
  GraduationCap,
  BookOpen,
  FlaskConical,
  BrainCircuit,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

const navLinksGroup1 = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/calendar', label: 'التقويم', icon: Calendar },
  { to: '/schedule', label: 'الجدول الدراسي', icon: GraduationCap },
  { to: '/courses', label: 'الدورات', icon: BookOpen },
  { to: '/labs', label: 'المختبر الذكي', icon: FlaskConical },
]

const navLinksGroup2 = [
  { to: '/agents', label: 'الذكاء الاصطناعي', icon: BrainCircuit, badge: '5+' },
  { to: '/challenges', label: 'التحديات', icon: Trophy, badge: 'جديد' },
]

export default function Sidebar() {
  const location = useLocation()
  const { theme } = useTheme()
  const { sidebarCollapsed, toggleSidebar } = useThemeStore()

  const renderLink = (link: typeof navLinksGroup1[0] & { badge?: string }) => {
    const isActive = location.pathname === link.to
    const Icon = link.icon
    return (
      <Link
        key={link.to}
        to={link.to}
        className={`group relative flex items-center gap-3 px-4 py-3 rounded-2xl text-sm font-semibold transition-all duration-300 ${!isActive && 'hover:bg-white/5'}`}
        style={{
          color: isActive ? theme.colors.accent : theme.colors.textMuted,
          background: isActive ? `linear-gradient(to right, ${theme.colors.accent}15, transparent)` : 'transparent',
          border: isActive ? `1px solid ${theme.colors.accent}30` : '1px solid transparent',
        }}
      >
        {isActive && (
          <div className="absolute right-0 top-1/2 -translate-y-1/2 w-1.5 h-8 rounded-l-full" style={{ background: theme.colors.accent }} />
        )}
        <Icon size={20} className="transition-transform duration-300 group-hover:rotate-6 group-hover:scale-110" style={{ color: isActive ? theme.colors.accent : theme.colors.textDark }} />
        {!sidebarCollapsed && (
          <div className="flex-1 flex items-center justify-between">
            <span className="whitespace-nowrap">{link.label}</span>
            {link.badge && (
              <span className="px-2 py-0.5 rounded-full text-[10px] font-bold" style={{ backgroundColor: theme.colors.accent + '25', color: theme.colors.accent }}>
                {link.badge}
              </span>
            )}
          </div>
        )}
      </Link>
    )
  }

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-[240px]'
      } flex flex-col transition-all duration-300 shrink-0 relative z-20 backdrop-blur-[20px]`}
      style={{
        backgroundColor: 'rgba(15, 23, 42, 0.4)',
        borderLeft: `1px solid rgba(255, 255, 255, 0.05)`,
        boxShadow: `5px 0 30px rgba(0,0,0,0.2)`
      }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-6" style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-10 h-10 rounded-2xl flex items-center justify-center text-lg font-bold text-white shadow-lg shadow-current/20" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            م
          </div>
          {!sidebarCollapsed && (
            <span className="text-2xl font-bold tracking-tight text-transparent bg-clip-text" style={{ backgroundImage: `linear-gradient(to right, ${theme.colors.text}, ${theme.colors.textMuted})` }}>
              مسار
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-xl transition-all hover:bg-white/10"
          style={{ color: theme.colors.textMuted }}
        >
          <ChevronRight
            size={18}
            className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-4 space-y-6">
        <div className="space-y-1">
          {!sidebarCollapsed && <p className="px-4 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textDark }}>الرئيسية</p>}
          {navLinksGroup1.map(renderLink)}
        </div>
        
        <div style={{ borderTop: `1px dashed rgba(255, 255, 255, 0.1)`, margin: '16px 0' }} />
        
        <div className="space-y-1">
          {!sidebarCollapsed && <p className="px-4 text-[11px] font-bold uppercase tracking-wider mb-2" style={{ color: theme.colors.textDark }}>الذكاء الاصطناعي</p>}
          {navLinksGroup2.map(renderLink)}
        </div>
      </nav>

      {/* Footer */}
      <div className="p-4" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)` }}>
        <div className="flex items-center justify-center gap-2 text-xs font-semibold px-4 py-3 rounded-2xl bg-black/20" style={{ color: theme.colors.textMuted }}>
          <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse shadow-[0_0_8px_rgba(34,197,94,0.6)]" />
          {sidebarCollapsed ? '' : 'متصل بالخادم'}
        </div>
      </div>
      <ThemeSwitcher />
    </aside>
  )
}
