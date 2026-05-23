import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BarChart3, BookOpen, StickyNote, Target, BrainCircuit, Clock, TrendingUp, Activity, AlertCircle, Loader2, Timer, FileCode, GraduationCap } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { API_BASE_URL } from '@/services/api'

interface AnalyticsOverview {
  subjects: number
  notes: number
  courses: number
  goals: number
  snippets: number
  recent_notes_7d: number
  focus_minutes_7d: number
  completed_goals: number
}

interface ProgressStats {
  total_skills_tracked: number
  total_attempts: number
  total_correct: number
  accuracy_percent: number
  mastery_distribution: Record<string, number>
}

interface FocusStats {
  total_sessions: number
  total_minutes: number
  avg_session_minutes: number
  daily_minutes: Record<string, number>
  focus_minutes_7d?: number
}

interface ActivityEvent {
  type: string
  action: string
  title: string
  timestamp: string
}

export default function AnalyticsPage() {
  const { theme } = useTheme()
  const [overview, setOverview] = useState<AnalyticsOverview | null>(null)
  const [progress, setProgress] = useState<ProgressStats | null>(null)
  const [focus, setFocus] = useState<FocusStats | null>(null)
  const [activity, setActivity] = useState<ActivityEvent[]>([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    (async () => {
      try {
        const [o, p, f, a] = await Promise.all([
          fetch(`${API_BASE_URL}/analytics/overview`).then(r => r.json()),
          fetch(`${API_BASE_URL}/analytics/progress`).then(r => r.json()),
          fetch(`${API_BASE_URL}/analytics/focus`).then(r => r.json()),
          fetch(`${API_BASE_URL}/analytics/activity`).then(r => r.json()),
        ])
        setOverview(o)
        setProgress(p)
        setFocus(f)
        setActivity(a.events || [])
      } catch { /* ignore */ }
      setLoading(false)
    })()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
      </div>
    )
  }

  const statCards = [
    { label: 'المواد', value: overview?.subjects ?? 0, icon: BookOpen, color: theme.colors.accent },
    { label: 'الملاحظات', value: overview?.notes ?? 0, icon: StickyNote, color: theme.colors.secondary },
    { label: 'الأهداف', value: overview?.goals ?? 0, icon: Target, color: theme.colors.success },
    { label: 'الدورات', value: overview?.courses ?? 0, icon: GraduationCap, color: theme.colors.warning },
    { label: 'مقتطفات برمجية', value: overview?.snippets ?? 0, icon: FileCode, color: '#6366f1' },
    { label: 'أهداف مكتملة', value: overview?.completed_goals ?? 0, icon: TrendingUp, color: theme.colors.success },
  ]

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <BarChart3 size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>لوحة التحليلات</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>إحصائيات شاملة للمنصة</p>
        </div>
      </div>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4 mb-8">
        {statCards.map((card, i) => (
          <motion.div key={card.label} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="p-5 rounded-2xl backdrop-blur-[20px] shadow-lg"
            style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
            <card.icon size={20} className="mb-3" style={{ color: card.color }} />
            <p className="text-3xl font-black mb-1" style={{ color: theme.colors.text }}>{card.value}</p>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>{card.label}</p>
          </motion.div>
        ))}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 mb-8">
        {/* Focus Stats */}
        <div className="p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center gap-3 mb-4">
            <Clock size={20} style={{ color: theme.colors.accent }} />
            <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>التركيز</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>إجمالي الدقائق (7 أيام)</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{focus?.focus_minutes_7d ?? overview?.focus_minutes_7d ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>الجلسات</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{focus?.total_sessions ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>متوسط الجلسة</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{focus?.avg_session_minutes ?? 0} د</span>
            </div>
          </div>
        </div>

        {/* Progress Stats */}
        <div className="p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center gap-3 mb-4">
            <BrainCircuit size={20} style={{ color: theme.colors.accent }} />
            <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>التقدم الأكاديمي</h3>
          </div>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>الدقة</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{progress?.accuracy_percent ?? 0}%</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>المهارات المتعقبة</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{progress?.total_skills_tracked ?? 0}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-sm" style={{ color: theme.colors.textMuted }}>المحاولات</span>
              <span className="text-lg font-bold" style={{ color: theme.colors.text }}>{progress?.total_attempts ?? 0}</span>
            </div>
          </div>
        </div>

        {/* Activity Stats */}
        <div className="p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center gap-3 mb-4">
            <Activity size={20} style={{ color: theme.colors.accent }} />
            <h3 className="text-lg font-bold" style={{ color: theme.colors.text }}>النشاط الأخير</h3>
          </div>
          <div className="space-y-2 max-h-48 overflow-y-auto">
            {activity.length === 0 ? (
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>لا يوجد نشاط</p>
            ) : (
              activity.slice(0, 10).map((ev, i) => (
                <div key={i} className="flex items-center gap-2 text-xs py-1" style={{ borderBottom: `1px solid rgba(255,255,255,0.04)` }}>
                  {ev.type === 'note' ? <StickyNote size={10} style={{ color: theme.colors.accent }} /> : <Target size={10} style={{ color: theme.colors.success }} />}
                  <span style={{ color: theme.colors.textMuted }} className="truncate">{ev.title}</span>
                  <span style={{ color: theme.colors.textDark }}>{ev.action}</span>
                </div>
              ))
            )}
          </div>
        </div>
      </div>

      {/* Mastery Distribution */}
      {progress?.mastery_distribution && (
        <div className="p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <h3 className="text-lg font-bold mb-4" style={{ color: theme.colors.text }}>توزيع الإتقان</h3>
          <div className="flex gap-3">
            {Object.entries(progress.mastery_distribution).map(([level, count]) => {
              const colors: Record<string, string> = {
                beginner: theme.colors.error,
                intermediate: theme.colors.warning,
                advanced: theme.colors.accent,
                mastered: theme.colors.success,
              }
              const total = Object.values(progress.mastery_distribution!).reduce((a, b) => a + b, 0)
              const pct = total > 0 ? (count / total) * 100 : 0
              return (
                <div key={level} className="flex-1">
                  <div className="h-24 rounded-xl relative overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <motion.div initial={{ height: 0 }} animate={{ height: `${pct}%` }}
                      className="absolute bottom-0 w-full rounded-xl transition-all"
                      style={{ backgroundColor: colors[level] || theme.colors.accent }} />
                  </div>
                  <p className="text-center text-xs mt-2 font-bold" style={{ color: colors[level] || theme.colors.text }}>{level}</p>
                  <p className="text-center text-[10px]" style={{ color: theme.colors.textMuted }}>{count}</p>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </div>
  )
}
