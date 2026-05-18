import { useState } from 'react'
import { projectsAPI } from '@/services/api'

interface Milestone {
  week: number
  title: string
  tasks: string[]
  status: string
}

interface Project {
  project_id: string
  title: string
  description: string
  domain: string
  skill_level: string
  milestones: Milestone[]
  created_at: string
}

export default function ProjectsPage() {
  const [interests, setInterests] = useState('')
  const [skillLevel, setSkillLevel] = useState('intermediate')
  const [domain, setDomain] = useState('machine learning')
  const [project, setProject] = useState<Project | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  const handleGenerate = async () => {
    if (!interests.trim()) return
    setLoading(true)
    setMessage('')
    try {
      const { data } = await projectsAPI.generate(interests, skillLevel, domain)
      const details = await projectsAPI.details(data.project_id)
      setProject(details.data as unknown as Project)
    } catch (e: any) {
      setMessage('حدث خطأ أثناء توليد المشروع')
    } finally {
      setLoading(false)
    }
  }

  const handleFeedback = async () => {
    if (!project || !feedback.trim()) return
    try {
      await projectsAPI.submitFeedback(project.project_id, feedback)
      setMessage('تم إرسال الملاحظات بنجاح ✓')
      setFeedback('')
    } catch {
      setMessage('فشل إرسال الملاحظات')
    }
  }

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-white mb-2">🚀 مولّد المشاريع</h1>
        <p className="text-gray-400">أنشئ مشروعاً تعليمياً مخصصاً بناءً على اهتماماتك ومستواك</p>
      </div>

      {/* Generation Form */}
      <div className="bg-gray-800 rounded-xl p-6 space-y-4">
        <div>
          <label className="block text-sm font-medium text-gray-300 mb-1">اهتماماتك</label>
          <input
            type="text"
            value={interests}
            onChange={(e) => setInterests(e.target.value)}
            placeholder="مثال: الرؤية الحاسوبية، معالجة اللغات الطبيعية..."
            className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
          />
        </div>
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">المستوى</label>
            <select
              value={skillLevel}
              onChange={(e) => setSkillLevel(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none"
            >
              <option value="beginner">مبتدئ</option>
              <option value="intermediate">متوسط</option>
              <option value="advanced">متقدم</option>
            </select>
          </div>
          <div>
            <label className="block text-sm font-medium text-gray-300 mb-1">المجال</label>
            <input
              type="text"
              value={domain}
              onChange={(e) => setDomain(e.target.value)}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 focus:ring-2 focus:ring-blue-500 outline-none"
            />
          </div>
        </div>
        <button
          onClick={handleGenerate}
          disabled={loading || !interests.trim()}
          className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-2 rounded-lg font-medium transition-colors"
        >
          {loading ? 'جارٍ التوليد...' : 'توليد مشروع'}
        </button>
      </div>

      {message && (
        <div className="bg-gray-800 rounded-lg p-3 text-center text-sm text-green-400">{message}</div>
      )}

      {/* Project Details */}
      {project && (
        <div className="bg-gray-800 rounded-xl p-6 space-y-4">
          <h2 className="text-xl font-bold text-white">{project.title}</h2>
          <p className="text-gray-300">{project.description}</p>
          <div className="flex gap-3 text-sm">
            <span className="bg-blue-600/20 text-blue-400 px-3 py-1 rounded-full">{project.domain}</span>
            <span className="bg-purple-600/20 text-purple-400 px-3 py-1 rounded-full">{project.skill_level}</span>
          </div>

          {/* Milestones */}
          <div className="space-y-3 mt-4">
            <h3 className="text-lg font-semibold text-white">📋 المراحل</h3>
            {project.milestones.map((m, i) => (
              <div key={i} className="bg-gray-700 rounded-lg p-4">
                <div className="flex justify-between items-center mb-2">
                  <span className="font-medium text-white">الأسبوع {m.week}: {m.title}</span>
                  <span className="text-xs bg-yellow-600/20 text-yellow-400 px-2 py-1 rounded">{m.status}</span>
                </div>
                <ul className="list-disc list-inside text-gray-400 text-sm space-y-1">
                  {m.tasks.map((t, j) => (
                    <li key={j}>{t}</li>
                  ))}
                </ul>
              </div>
            ))}
          </div>

          {/* Feedback */}
          <div className="mt-4 space-y-2">
            <h3 className="text-lg font-semibold text-white">💬 ملاحظاتك</h3>
            <textarea
              value={feedback}
              onChange={(e) => setFeedback(e.target.value)}
              placeholder="اكتب ملاحظاتك لتحسين المشروع..."
              rows={3}
              className="w-full bg-gray-700 text-white rounded-lg px-4 py-2 outline-none resize-none"
            />
            <button
              onClick={handleFeedback}
              disabled={!feedback.trim()}
              className="bg-green-600 hover:bg-green-700 disabled:opacity-50 text-white px-4 py-2 rounded-lg text-sm transition-colors"
            >
              إرسال الملاحظات
            </button>
          </div>
        </div>
      )}
    </div>
  )
}
