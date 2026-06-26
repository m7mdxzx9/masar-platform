import { Suspense, useEffect, useState } from 'react'
import { Routes, Route, Navigate } from 'react-router-dom'
import PageLayout from '@/components/layout/PageLayout'
import DashboardPage from '@/pages/DashboardPage'
import CoursesPage from '@/pages/CoursesPage'
import LabsPage from '@/pages/LabsPage'
import LessonsPage from '@/pages/LessonsPage'
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
import CodeLibraryPage from '@/pages/CodeLibraryPage'
import GoalsPage from '@/pages/GoalsPage'
import BackupPage from '@/pages/BackupPage'
import DrivePage from '@/pages/DrivePage'
import DriveCallbackPage from '@/pages/DriveCallbackPage'
import AnalyticsPage from '@/pages/AnalyticsPage'
import MorePage from '@/pages/MorePage'
import { syncManager } from '@/services/syncManager'
import { agentsAPI, vocabularyAPI } from '@/services/api'
import { Loader2 } from 'lucide-react'

interface TooltipState {
  word: string
  x: number
  y: number
  translation?: string
  meanings?: string[]
  loading: boolean
}

export default function App() {
  const [tooltip, setTooltip] = useState<TooltipState | null>(null)

  useEffect(() => {
    syncManager.initialize();
  }, []);

  useEffect(() => {
    const handleDoubleClick = async (e: MouseEvent) => {
      const selection = window.getSelection()?.toString().trim()
      if (!selection || !/^[a-zA-Z0-9_\-]+$/.test(selection) || selection.length > 30) {
        return
      }

      setTooltip({
        word: selection,
        x: e.clientX,
        y: e.clientY - 40,
        loading: true,
      })

      try {
        const { data } = await agentsAPI.translate(selection, 'en', 'ar')
        const translateData = data as { meanings?: string[]; translated_text: string }
        setTooltip((prev) => {
          if (!prev || prev.word !== selection) return prev
          return {
            ...prev,
            loading: false,
            translation: translateData.translated_text,
            meanings: translateData.meanings || [translateData.translated_text],
          }
        })
      } catch (err) {
        console.error(err)
        setTooltip((prev) => {
          if (!prev || prev.word !== selection) return prev
          return {
            ...prev,
            loading: false,
            translation: 'تعذر الحصول على الترجمة',
          }
        })
      }
    }

    window.addEventListener('dblclick', handleDoubleClick)
    return () => window.removeEventListener('dblclick', handleDoubleClick)
  }, [])

  useEffect(() => {
    if (!tooltip) return
    const handleClickOutside = () => {
      setTooltip(null)
    }
    window.addEventListener('click', handleClickOutside)
    return () => window.removeEventListener('click', handleClickOutside)
  }, [tooltip])

  const handleSaveToVocabulary = async (e: React.MouseEvent) => {
    e.stopPropagation()
    if (!tooltip || !tooltip.word || !tooltip.meanings) return
    try {
      await vocabularyAPI.add(tooltip.word, tooltip.meanings)
      alert(`تمت إضافة "${tooltip.word}" إلى كشكول المصطلحات بنجاح!`)
      setTooltip(null)
    } catch (err) {
      alert('فشل حفظ المصطلح.')
    }
  }

  return (
    <Suspense fallback={
      <div className="flex items-center justify-center min-h-screen" style={{ background: '#0a0e17' }}>
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin mx-auto mb-4" style={{ borderColor: '#ffffff20', borderTopColor: '#6366f1' }} />
          <p className="text-white/60 text-sm font-medium">Loading...</p>
        </div>
      </div>
    }>
      <Routes>
        <Route path="drive/callback" element={<DriveCallbackPage />} />
        <Route path="/" element={<PageLayout />}>
          <Route index element={<Navigate to="/dashboard" replace />} />
          <Route path="dashboard" element={<DashboardPage />} />
          <Route path="calendar" element={<CalendarPage />} />
          <Route path="schedule" element={<SchedulePage />} />
          <Route path="courses" element={<CoursesPage />} />
          <Route path="labs" element={<LabsPage />} />
          <Route path="lessons" element={<LessonsPage />} />
          <Route path="agents" element={<AgentsPage />} />
          <Route path="challenges" element={<ChallengesPage />} />
          <Route path="projects" element={<ProjectsPage />} />
          <Route path="subjects" element={<SubjectsPage />} />
          <Route path="subjects/:id" element={<SubjectDetailPage />} />
          <Route path="notes" element={<NotesPage />} />
          <Route path="study-assistant" element={<StudyAssistantPage />} />
          <Route path="quiz-generator" element={<QuizGeneratorPage />} />
          <Route path="flashcards" element={<FlashcardsPage />} />
          <Route path="code-library" element={<CodeLibraryPage />} />
          <Route path="kanban" element={<KanbanPage />} />
          <Route path="goals" element={<GoalsPage />} />
          <Route path="backup" element={<BackupPage />} />
          <Route path="drive" element={<DrivePage />} />
          <Route path="analytics" element={<AnalyticsPage />} />
          <Route path="more" element={<MorePage />} />
        </Route>
      </Routes>
      
      {tooltip && (
        <div 
          className="fixed z-[9999] p-4 rounded-xl shadow-2xl backdrop-blur-md text-right text-xs max-w-xs transition-all pointer-events-auto"
          style={{ 
            top: tooltip.y, 
            left: Math.max(10, Math.min(window.innerWidth - 300, tooltip.x - 150)), 
            backgroundColor: 'rgba(20, 26, 46, 0.95)',
            border: '1px solid #00FFFF',
            boxShadow: '0 0 15px rgba(0, 255, 255, 0.3)',
            color: '#fff'
          }}
          onClick={e => e.stopPropagation()}
        >
          <div className="flex justify-between items-center mb-2 font-mono" dir="ltr">
            <span className="font-bold text-[#00FFFF]">{tooltip.word}</span>
            <button onClick={() => setTooltip(null)} className="text-gray-400 hover:text-white font-sans text-xs">✕</button>
          </div>
          
          {tooltip.loading ? (
            <div className="flex items-center justify-center py-2 gap-2 text-gray-400">
              <Loader2 className="w-3.5 h-3.5 animate-spin text-[#00FFFF]" />
              <span>جاري جلب الترجمة...</span>
            </div>
          ) : (
            <div className="space-y-3">
              <p className="font-semibold text-white">{tooltip.translation}</p>
              
              {tooltip.meanings && tooltip.meanings.length > 1 && (
                <div className="text-[10px] text-gray-400 space-y-0.5" dir="rtl">
                  <span className="font-bold text-white/60">المعاني البديلة:</span>
                  <p>{tooltip.meanings.slice(1).join('، ')}</p>
                </div>
              )}

              <button 
                onClick={handleSaveToVocabulary}
                className="w-full mt-2 py-1.5 rounded-lg font-bold text-white transition-all text-[10px] flex items-center justify-center gap-1"
                style={{ background: 'linear-gradient(135deg, #2400FF, #00FFFF)', color: '#fff' }}
              >
                <span>💾</span>
                <span>حفظ في كشكول المصطلحات</span>
              </button>
            </div>
          )}
        </div>
      )}
    </Suspense>
  )
}
