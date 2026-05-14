import { Link, useLocation } from 'react-router-dom'
import { useTheme } from '../../theme/ThemeContext';
import ThemeSwitcher from '../ThemeSwitcher';
import {
  LayoutDashboard,
  BookOpen,
  FlaskConical,
  BrainCircuit,
  Trophy,
  ChevronRight,
} from 'lucide-react'
import { useThemeStore } from '@/stores/themeStore'

const navLinks = [
  { to: '/dashboard', label: 'لوحة التحكم', icon: LayoutDashboard },
  { to: '/courses', label: 'الدورات', icon: BookOpen },
  { to: '/labs', label: 'المختبر الذكي', icon: FlaskConical },
  { to: '/agents', label: 'الوكلاء الذكيون', icon: BrainCircuit },
  { to: '/challenges', label: 'التحديات', icon: Trophy },
]

export default function Sidebar() {
  const location = useLocation()
  const { theme } = useTheme();
  const { sidebarCollapsed, toggleSidebar } = useThemeStore()

  return (
    <aside
      className={`${
        sidebarCollapsed ? 'w-20' : 'w-64'
      } border-l flex flex-col transition-all duration-300 shrink-0`}
      style={{ backgroundColor: theme.colors.surface, borderColor: theme.colors.accent + '20', transition: 'background-color 0.3s, border-color 0.3s' }}
    >
      {/* Header */}
      <div className="flex items-center justify-between p-4 border-b" style={{ borderColor: theme.colors.accent + '20' }}>
        <Link to="/" className="flex items-center gap-3">
          <div className="w-9 h-9 rounded-xl flex items-center justify-center text-sm font-bold text-white" style={{ background: `linear-gradient(to bottom right, ${theme.colors.accent}, ${theme.colors.accent}88)` }}>
            م
          </div>
          {!sidebarCollapsed && (
            <span className="text-xl font-bold" style={{ color: theme.colors.accent }}>
              مسار
            </span>
          )}
        </Link>
        <button
          onClick={toggleSidebar}
          className="p-2 rounded-lg transition-colors" style={{ color: theme.colors.accent + '99' }}
        >
          <ChevronRight
            size={18}
            className={`transition-transform ${sidebarCollapsed ? 'rotate-180' : ''}`}
          />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto p-3 space-y-1">
        {navLinks.map((link) => {
          const isActive = location.pathname === link.to;
          const Icon = link.icon;
          return (
            <Link
              key={link.to}
              to={link.to}
              className={`flex items-center gap-3 px-3 py-3 rounded-xl text-sm font-medium transition-all duration-200
                ${
                  isActive
                    ? ''
                    : ''
                }`}
            >
              <Icon size={20} style={{ color: isActive ? theme.colors.accent : theme.colors.accent + '99' }} />
              {!sidebarCollapsed && <span className="whitespace-nowrap">{link.label}</span>}
            </Link>
          );
        })}
      </nav>

      {/* Footer */}
      <div className="p-4 border-t" style={{ borderColor: theme.colors.accent + '15' }}>
        <div className="flex items-center justify-center gap-2 text-xs" style={{ color: theme.colors.accent + '99' }}>
          <span className="w-2 h-2 rounded-full bg-masar-success animate-pulse" />
          {sidebarCollapsed ? '' : 'متصل بالخادم'}
        </div>
      </div>
      <ThemeSwitcher />
    </aside>
  );
};
