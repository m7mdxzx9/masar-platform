import { useState } from 'react'
import { projectsAPI } from '@/services/api'
import { useTheme } from '@/theme/ThemeContext'
import { Sparkles, Trophy, BookOpen, Layers, Loader2, ArrowLeft } from 'lucide-react'

interface Milestone {
  week: number
  title: string
  tasks: string[]
  status?: string
}

interface Project {
  project_id: string
  title: string
  description: string
  domain: string
  skill_level: string
  milestones: Milestone[]
  created_at: string
  datasets?: string[]
  papers?: string[]
}

export default function ProjectsPage() {
  const { theme } = useTheme()
  const [activeTab, setActiveTab] = useState<'normal' | 'graduation'>('normal')
  
  // Normal project states
  const [interests, setInterests] = useState('')
  const [skillLevel, setSkillLevel] = useState('intermediate')
  const [domain, setDomain] = useState('machine learning')
  const [project, setProject] = useState<Project | null>(null)
  const [feedback, setFeedback] = useState('')
  const [loading, setLoading] = useState(false)
  const [message, setMessage] = useState('')

  // Graduation project states
  const [gradSkills, setGradSkills] = useState('')
  const [gradInterests, setGradInterests] = useState('')
  const [gradProject, setGradProject] = useState<Project | null>(null)
  const [gradLoading, setGradLoading] = useState(false)
  const [gradMessage, setGradMessage] = useState('')

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

  const handleGenerateGraduation = async () => {
    if (!gradSkills.trim() || !gradInterests.trim()) return
    setGradLoading(true)
    setGradMessage('')
    setGradProject(null)
    
    const skillsList = gradSkills.split(',').map(s => s.trim()).filter(s => s.length > 0)
    const interestsList = gradInterests.split(',').map(i => i.trim()).filter(i => i.length > 0)
    
    try {
      const { data } = await projectsAPI.generateGraduation(skillsList, interestsList)
      setGradProject(data as Project)
    } catch (e: any) {
      setGradMessage('حدث خطأ أثناء توليد مقترح مشروع التخرج')
    } finally {
      setGradLoading(false)
    }
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between mb-4">
        <div>
          <h1 className="text-3xl font-black text-white flex items-center gap-2">
            <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-400 to-indigo-400">مولّد المشاريع الذكي</span>
            🚀
          </h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>أنشئ خطط مشاريع مخصصة للتطبيق العملي أو أفكار متميزة لمشاريع التخرج.</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-white/5 pb-2">
        <button
          onClick={() => setActiveTab('normal')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'normal' ? 'text-white' : ''}`}
          style={{
            background: activeTab === 'normal' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
            color: activeTab === 'normal' ? '#fff' : theme.colors.textMuted
          }}
        >
          مشاريع المقررات التعليمية
        </button>
        <button
          onClick={() => setActiveTab('graduation')}
          className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${activeTab === 'graduation' ? 'text-white' : ''}`}
          style={{
            background: activeTab === 'graduation' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
            color: activeTab === 'graduation' ? '#fff' : theme.colors.textMuted
          }}
        >
          🎓 مقترحات مشاريع التخرج (10 أسابيع)
        </button>
      </div>

      {activeTab === 'normal' ? (
        <div className="space-y-6">
          {/* Generation Form */}
          <div className="rounded-2xl p-6 space-y-4 border bg-slate-900/40" style={{ borderColor: theme.colors.border }}>
            <h3 className="text-base font-bold text-white mb-2">مولّد مشاريع المقررات 📝</h3>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">اهتماماتك</label>
              <input
                type="text"
                value={interests}
                onChange={(e) => setInterests(e.target.value)}
                placeholder="مثال: الرؤية الحاسوبية، معالجة اللغات الطبيعية..."
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border focus:border-blue-500 transition-colors"
                style={{ borderColor: theme.colors.border, direction: 'rtl' }}
              />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-300">المستوى</label>
                <select
                  value={skillLevel}
                  onChange={(e) => setSkillLevel(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border"
                  style={{ borderColor: theme.colors.border }}
                >
                  <option value="beginner">مبتدئ</option>
                  <option value="intermediate">متوسط</option>
                  <option value="advanced">متقدم</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1 text-slate-300">المجال</label>
                <input
                  type="text"
                  value={domain}
                  onChange={(e) => setDomain(e.target.value)}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border focus:border-blue-500 transition-colors"
                  style={{ borderColor: theme.colors.border, direction: 'rtl' }}
                />
              </div>
            </div>
            <button
              onClick={handleGenerate}
              disabled={loading || !interests.trim()}
              className="bg-blue-600 hover:bg-blue-700 disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-xs transition-transform hover:scale-105"
            >
              {loading ? 'جارٍ التوليد...' : 'توليد خطة مشروع المقررات'}
            </button>
          </div>

          {message && (
            <div className="rounded-xl p-3 text-center text-xs font-semibold bg-emerald-500/10 border border-emerald-500/20 text-emerald-400">{message}</div>
          )}

          {/* Project Details */}
          {project && (
            <div className="rounded-2xl p-6 space-y-6 border bg-slate-900/40 text-right" style={{ borderColor: theme.colors.border, direction: 'rtl' }}>
              <div>
                <h2 className="text-xl font-black text-white mb-2">{project.title}</h2>
                <p className="text-slate-300 text-xs leading-relaxed">{project.description}</p>
                <div className="flex gap-2 text-xs mt-3 justify-start">
                  <span className="bg-blue-500/10 text-blue-400 px-3 py-1 rounded-full border border-blue-500/20">{project.domain}</span>
                  <span className="bg-purple-500/10 text-purple-400 px-3 py-1 rounded-full border border-purple-500/20">{project.skill_level}</span>
                </div>
              </div>

              {/* Milestones */}
              <div className="space-y-3 mt-4">
                <h3 className="text-base font-bold text-white">📋 مراحل تنفيذ المشروع</h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {project.milestones.map((m, i) => (
                    <div key={i} className="bg-black/20 rounded-xl p-4 border" style={{ borderColor: theme.colors.border }}>
                      <div className="flex justify-between items-center mb-2">
                        <span className="font-bold text-xs text-white">الأسبوع {m.week}: {m.title}</span>
                        <span className="text-[10px] bg-yellow-500/10 text-yellow-400 px-2 py-0.5 rounded border border-yellow-500/20">{m.status || 'معلق'}</span>
                      </div>
                      <ul className="list-disc list-inside text-slate-400 text-xs space-y-1 pr-2">
                        {m.tasks.map((t, j) => (
                          <li key={j}>{t}</li>
                        ))}
                      </ul>
                    </div>
                  ))}
                </div>
              </div>

              {/* Feedback */}
              <div className="mt-4 space-y-2 border-t pt-4" style={{ borderColor: theme.colors.border }}>
                <h3 className="text-base font-bold text-white">💬 تحسين المشروع بالملاحظات</h3>
                <textarea
                  value={feedback}
                  onChange={(e) => setFeedback(e.target.value)}
                  placeholder="أدخل ملاحظاتك (مثال: أريد إضافة واجهة ويب، أو تغيير مكتبة معالجة النصوص) ليتم إعادة توليد خطة المشروع..."
                  rows={3}
                  className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border focus:border-blue-500 transition-colors resize-none"
                  style={{ borderColor: theme.colors.border }}
                />
                <button
                  onClick={handleFeedback}
                  disabled={!feedback.trim()}
                  className="bg-emerald-600 hover:bg-emerald-700 disabled:opacity-50 text-white px-4 py-2 rounded-xl text-xs font-bold transition-colors"
                >
                  إرسال الملاحظات للتحسين
                </button>
              </div>
            </div>
          )}
        </div>
      ) : (
        <div className="space-y-6">
          {/* Graduation Form */}
          <div className="rounded-2xl p-6 space-y-4 border bg-slate-900/40" style={{ borderColor: theme.colors.border }}>
            <h3 className="text-base font-bold text-white mb-2 flex items-center gap-2">
              <Sparkles size={18} className="text-yellow-400 animate-pulse" />
              توليد أفكار مشاريع تخرج إبداعية 🎓
            </h3>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">مهاراتك البرمجية والتقنية (تفصل بفاصلة)</label>
              <input
                type="text"
                value={gradSkills}
                onChange={(e) => setGradSkills(e.target.value)}
                placeholder="مثال: Python, PyTorch, FastAPI, Git, SQL"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border focus:border-cyan-500 transition-colors"
                style={{ borderColor: theme.colors.border }}
              />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1 text-slate-300">اهتماماتك التقنية والبحثية (تفصل بفاصلة)</label>
              <input
                type="text"
                value={gradInterests}
                onChange={(e) => setGradInterests(e.target.value)}
                placeholder="مثال: الرؤية الحاسوبية الطبية، معالجة النصوص العربية، وكلاء الذكاء الاصطناعي"
                className="w-full bg-slate-800 text-white rounded-xl px-4 py-2.5 text-xs outline-none border focus:border-cyan-500 transition-colors"
                style={{ borderColor: theme.colors.border }}
              />
            </div>
            <button
              onClick={handleGenerateGraduation}
              disabled={gradLoading || !gradSkills.trim() || !gradInterests.trim()}
              className="disabled:opacity-50 text-white px-6 py-3 rounded-xl font-bold text-xs transition-transform hover:scale-105 shadow-md"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            >
              {gradLoading ? (
                <span className="flex items-center gap-2">
                  <Loader2 size={14} className="animate-spin" />
                  جاري صياغة مقترح التخرج...
                </span>
              ) : 'توليد مقترح مشروع التخرج'}
            </button>
          </div>

          {gradMessage && (
            <div className="rounded-xl p-3 text-center text-xs font-semibold bg-rose-500/10 border border-rose-500/20 text-rose-400">{gradMessage}</div>
          )}

          {/* Graduation Project Result Details */}
          {gradProject && (
            <div className="rounded-2xl p-6 space-y-6 border bg-slate-900/40 text-right" style={{ borderColor: theme.colors.border, direction: 'rtl' }}>
              <div>
                <h2 className="text-xl font-black text-transparent bg-clip-text bg-gradient-to-r from-cyan-400 to-blue-400 mb-2">{gradProject.title}</h2>
                <p className="text-slate-300 text-xs leading-relaxed">{gradProject.description}</p>
              </div>

              {/* Recommended Datasets & Research Papers */}
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                {gradProject.datasets && gradProject.datasets.length > 0 && (
                  <div className="p-4 rounded-xl bg-black/20 border" style={{ borderColor: theme.colors.border }}>
                    <h4 className="text-xs font-bold text-white mb-2">📊 مجموعات البيانات المقترحة (Datasets)</h4>
                    <ul className="list-disc list-inside text-slate-400 text-xs space-y-1 pr-2">
                      {gradProject.datasets.map((d, i) => (
                        <li key={i}>{d}</li>
                      ))}
                    </ul>
                  </div>
                )}
                {gradProject.papers && gradProject.papers.length > 0 && (
                  <div className="p-4 rounded-xl bg-black/20 border" style={{ borderColor: theme.colors.border }}>
                    <h4 className="text-xs font-bold text-white mb-2">📄 الأوراق البحثية الأساسية للقراءة</h4>
                    <ul className="list-disc list-inside text-slate-400 text-xs space-y-1 pr-2">
                      {gradProject.papers.map((p, i) => (
                        <li key={i}>{p}</li>
                      ))}
                    </ul>
                  </div>
                )}
              </div>

              {/* 10-Week Timeline */}
              <div className="space-y-3 mt-4">
                <h3 className="text-base font-bold text-white">📅 خطة العمل والجدول الزمني (10 أسابيع)</h3>
                <div className="space-y-3">
                  {gradProject.milestones.map((m, i) => (
                    <div key={i} className="bg-black/20 rounded-xl p-4 border flex flex-col md:flex-row md:items-center justify-between gap-4" style={{ borderColor: theme.colors.border }}>
                      <div className="space-y-1">
                        <span className="font-black text-xs block text-cyan-400">الأسبوع {m.week}</span>
                        <span className="font-bold text-xs text-white block">{m.title}</span>
                        <ul className="list-disc list-inside text-slate-400 text-[11px] space-y-0.5 pr-2 mt-1">
                          {m.tasks.map((t, j) => (
                            <li key={j}>{t}</li>
                          ))}
                        </ul>
                      </div>
                      <span className="text-[10px] self-start md:self-center bg-cyan-500/10 text-cyan-400 px-3 py-1 rounded-full border border-cyan-500/20 shrink-0">معلق</span>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
