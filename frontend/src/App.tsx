import { Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/CoursesPage'
import LabsPage from '@/pages/LabsPage'
import AgentsPage from '@/pages/AgentsPage'
import ChallengesPage from '@/pages/ChallengesPage'
import CalendarPage from '@/pages/CalendarPage'
import SchedulePage from '@/pages/SchedulePage'
import ProjectsPage from '@/pages/ProjectsPage'
import KanbanPage from '@/pages/KanbanPage'
import SubjectsPage from '@/pages/SubjectsPage'
import SubjectDetailPage from '@/pages/SubjectDetailPage'
import NotesPage from '@/pages/NotesPage'
import StudyAssistantPage from '@/pages/StudyAssistantPage'
import QuizGeneratorPage from '@/pages/QuizGeneratorPage'
import FlashcardsPage from '@/pages/FlashcardsPage'

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
        <Route path="projects" element={<ProjectsPage />} />
        <Route path="subjects" element={<SubjectsPage />} />
        <Route path="subjects/:id" element={<SubjectDetailPage />} />
        <Route path="notes" element={<NotesPage />} />
        <Route path="study-assistant" element={<StudyAssistantPage />} />
        <Route path="quiz-generator" element={<QuizGeneratorPage />} />
        <Route path="flashcards" element={<FlashcardsPage />} />
        <Route path="kanban" element={<KanbanPage />} />
      </Route>
    </Routes>
  )
}
