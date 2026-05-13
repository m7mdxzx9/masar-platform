import { Outlet } from 'react-router-dom'
import Sidebar from '@/components/layout/Sidebar'

export default function PageLayout() {
  return (
    <div className="flex min-h-screen bg-masar-bg">
      <Sidebar />
      <main className="flex-1 p-6 overflow-auto">
        <Outlet />
      </main>
    </div>
  )
}
