import { Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/CoursesPage'
import LabsPage from '@/pages/LabsPage'
import AgentsPage from '@/pages/AgentsPage'
import ChallengesPage from '@/pages/ChallengesPage'
import CalendarPage from '@/pages/CalendarPage'
import SchedulePage from '@/pages/SchedulePage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PageLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="calendar" element={<CalendarPage />} />
        <Route path="schedule" element={<SchedulePage />} />
        <Route path="courses" element={<CoursesPage />} />
        <Route path="labs" element={<LabsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
      </Route>
    </Routes>
  )
}
