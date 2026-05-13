import { Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import DashboardPage from '@/pages/DashboardPage'
import LearningPage from '@/pages/LearningPage'
import LabsPage from '@/pages/LabsPage'
import AgentsPage from '@/pages/AgentsPage'
import ChallengesPage from '@/pages/ChallengesPage'
import KanbanPage from '@/pages/KanbanPage'

export default function App() {
  return (
    <Routes>
      <Route path="/" element={<PageLayout />}>
        <Route index element={<Navigate to="/dashboard" replace />} />
        <Route path="dashboard" element={<DashboardPage />} />
        <Route path="learning" element={<LearningPage />} />
        <Route path="labs" element={<LabsPage />} />
        <Route path="agents" element={<AgentsPage />} />
        <Route path="challenges" element={<ChallengesPage />} />
        <Route path="kanban" element={<KanbanPage />} />
      </Route>
    </Routes>
  )
}