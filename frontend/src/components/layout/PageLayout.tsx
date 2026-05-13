import { Outlet } from 'react-router-dom'
import { Sidebar } from '@/components/layout/Sidebar'
import { useThemeStore } from '@/stores/themeStore'

export default function PageLayout() {
  const { sidebarCollapsed } = useThemeStore()

  return (
    <div className="flex min-h-screen bg-[#0F172A]">
      <Sidebar />
      <main
        className="flex-1 p-6 overflow-auto transition-all duration-300"
        style={{ marginRight: sidebarCollapsed ? 72 : 240 }}
      >
        <Outlet />
      </main>
    </div>
  )
}
