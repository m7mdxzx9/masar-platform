import { Outlet, Link, useLocation } from 'react-router-dom'
import { useState } from 'react'
import { useThemeStore } from '@/stores/themeStore'

const navItems = [
  { path: '/dashboard', label: 'الرئيسية', icon: '🏠' },
  { path: '/learning', label: 'التعلم', icon: '📚' },
  { path: '/labs', label: 'المختبر', icon: '💻' },
  { path: '/agents', label: 'الوكلاء', icon: '🤖' },
  { path: '/challenges', label: 'التحديات', icon: '🎮' },
  { path: '/kanban', label: 'كانبان', icon: '📋' },
]

export default function PageLayout() {
  const location = useLocation()
  const [sidebarOpen, setSidebarOpen] = useState(true)
  const { mode, toggleMode } = useThemeStore()

  return (
    <div className="flex min-h-screen">
      <aside
        className={`${
          sidebarOpen ? 'w-64' : 'w-20'
        } bg-masar-surface border-l border-masar-border transition-all duration-300 flex flex-col`}
      >
        <div className="p-4 border-b border-masar-border">
          <h1 className={`text-2xl font-bold text-gradient ${!sidebarOpen && 'text-center'}`}>
            {sidebarOpen ? 'مسار' : 'م'}
          </h1>
        </div>

        <nav className="flex-1 p-2">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex items-center gap-3 p-3 rounded-lg mb-1 transition-all ${
                location.pathname === item.path
                  ? 'bg-masar-blue-glow text-masar-cyan border-r-2 border-masar-cyan'
                  : 'text-masar-text-muted hover:bg-masar-surface-hover hover:text-masar-text'
              }`}
            >
              <span className="text-xl">{item.icon}</span>
              {sidebarOpen && <span>{item.label}</span>}
            </Link>
          ))}
        </nav>

        <div className="p-2 border-t border-masar-border">
          <button
            onClick={toggleMode}
            className="w-full flex items-center gap-3 p-3 rounded-lg mb-1 text-masar-text-muted hover:bg-masar-surface-hover transition-all"
          >
            <span className="text-xl">{mode === 'dark' ? '🌙' : '☀️'}</span>
            {sidebarOpen && <span>{mode === 'dark' ? 'الوضع الداكن' : 'الوضع الفاتح'}</span>}
          </button>
        </div>

        <button
          onClick={() => setSidebarOpen(!sidebarOpen)}
          className="p-4 border-t border-masar-border text-masar-text-muted hover:text-masar-cyan transition-colors"
        >
          {sidebarOpen ? '◀' : '▶'}
        </button>
      </aside>

      <main className="flex-1 bg-masar-bg p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
