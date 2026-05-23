import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import {
  BookOpen, Activity, BrainCircuit, FlaskConical, Clock, Info,
  Calendar as CalendarIcon, ChevronLeft, GraduationCap, MapPin,
  RefreshCw, Sparkles, Target, TrendingUp, Award, BookMarked,
  Play, Plus, Timer, Zap, ChevronRight, Star, Users, Code2,
  BarChart3, TrendingDown, CheckCircle2, AlertCircle, Sun, GitCommitHorizontal,
} from 'lucide-react'
import { coursesAPI, healthAPI, agentsAPI, notesAPI, focusAPI } from '@/services/api'
import { useTheme } from '@/theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import { useCalendarStore } from '@/stores/calendarStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useProgressStore } from '@/stores/progressStore'
import { useFocusStore } from '@/stores/focusStore'
import { useGoalsStore } from '@/stores/goalsStore'
import { Link, useNavigate } from 'react-router-dom'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis } from 'recharts'

const MOTIVATIONAL_QUOTES = [
  'العلم نور والجهل ظلام',
  'من جد وجد ومن زرع حصد',
  'اصبر على مر الجفا من معلم فإن رسوب العلم في نفراته',
  'طلب العلم فريضة على كل مسلم',
  'العلم ليس مجرد معرفة، بل هو طريق للتغيير',
  'أول العلم الصمت، والثاني الاستماع، والثالث الحفظ، والرابع العمل',
  'بالعلم ترتفع الأمم',
  'خير الناس أنفعهم للناس',
  'ما تعلمنا بقدر ما عشنا',
  'العلم في الصغر كالنقش على الحجر',
]

export default function DashboardPage() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const { icalUrl, events } = useCalendarStore()
  const { courses: scheduleCourses, isLoading: scheduleLoading } = useScheduleStore()
  const { stats: progressStats, fetchStats } = useProgressStore()
  const { stats: focusStats, fetchStats: fetchFocusStats } = useFocusStore()
  const { goals, fetchGoals } = useGoalsStore()

  const [courseData, setCourseData] = useState<any[]>([])
  const [courseCount, setCourseCount] = useState<number | null>(null)
  const [agentCount, setAgentCount] = useState<number>(0)
  const [health, setHealth] = useState<{ status: string } | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [recentActivity, setRecentActivity] = useState<any[]>([])
  const [quoteIndex, setQuoteIndex] = useState(0)
  const [notesCount, setNotesCount] = useState(0)
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({})

  useEffect(() => {
    setQuoteIndex(Math.floor(Math.random() * MOTIVATIONAL_QUOTES.length))
  }, [])

  // Weekly study data
  const dayNames = [t('dashboard.sat'), t('dashboard.sun'), t('dashboard.mon'), t('dashboard.tue'), t('dashboard.wed'), t('dashboard.thu'), t('dashboard.fri')]
  const today = new Date().getDay()
  const startOfWeek = new Date()
  startOfWeek.setDate(startOfWeek.getDate() - ((today + 1) % 7))

  const totalWeeklyMin = focusStats?.week_minutes || 0
  const dayWeights = [0.08, 0.10, 0.12, 0.14, 0.16, 0.20, 0.20]
  const weeklyData = dayNames.map((day, i) => {
    const d = new Date(startOfWeek)
    d.setDate(d.getDate() + i)
    return {
      day,
      hours: totalWeeklyMin > 0 ? +((totalWeeklyMin / 60) * dayWeights[i]).toFixed(1) : 0,
      date: d.toLocaleDateString('ar-SA', { day: 'numeric' }),
    }
  })

  const skillsData = progressStats ? [
    { skill: 'Python', mastery: Math.round((progressStats.average_mastery || 0) * 100) },
    { skill: 'AI', mastery: Math.round(((progressStats.average_mastery || 0) * 0.8) * 100) },
    { skill: 'Data', mastery: Math.round(((progressStats.average_mastery || 0) * 0.6) * 100) },
    { skill: 'Web', mastery: Math.round(((progressStats.average_mastery || 0) * 0.9) * 100) },
    { skill: 'DevOps', mastery: Math.round(((progressStats.average_mastery || 0) * 0.4) * 100) },
  ] : [
    { skill: 'Python', mastery: 75 }, { skill: 'AI', mastery: 60 },
    { skill: 'Data', mastery: 45 }, { skill: 'Web', mastery: 80 },
    { skill: 'DevOps', mastery: 30 },
  ]

  const courseProgress = courseData.map((c: any) => ({
    id: c.id,
    title: c.title,
    progress: c.progress || (progressStats ? Math.round(progressStats.average_mastery * 100) : 0),
    color: c.difficulty === 1 ? theme.colors.success : c.difficulty === 2 ? theme.colors.warning : theme.colors.error,
  }))

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [coursesRes, healthRes, agentsRes, notesRes, heatRes] = await Promise.allSettled([
          coursesAPI.getAll(),
          healthAPI.check(),
          agentsAPI.list(),
          notesAPI.list(),
          focusAPI.heatmap(365),
        ])
        fetchStats()
        fetchFocusStats()
        fetchGoals()

        if (coursesRes.status === 'fulfilled') {
          const courses = coursesRes.value.data as any
          const data = Array.isArray(courses) ? courses : (courses?.courses || [])
          setCourseData(data)
          setCourseCount(data.length)
        } else {
          setCourseCount(0)
        }

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value.data as { status: string })
        } else {
          setHealth({ status: 'unreachable' })
        }

        if (agentsRes.status === 'fulfilled') {
          const data = agentsRes.value.data as { agents: { id: string }[] }
          setAgentCount(data.agents?.length ?? 0)
        }

        if (notesRes.status === 'fulfilled') {
          const data = notesRes.value.data as any
          setNotesCount(data.notes?.length || 0)
        }

        if (heatRes.status === 'fulfilled') {
          setHeatmapData((heatRes.value.data as any).daily || {})
        }
      } catch {
        setError(t('dashboard.serverError'))
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy'

  const quickActions = [
    { label: t('dashboard.startFocus'), icon: Timer, color: theme.colors.accent, action: () => {} },
    { label: t('dashboard.addNote'), icon: Plus, color: theme.colors.secondary, action: () => navigate('/notes') },
    { label: t('dashboard.smartLab'), icon: Code2, color: theme.colors.success, action: () => navigate('/labs') },
    { label: t('dashboard.flashcards'), icon: BrainCircuit, color: theme.colors.warning, action: () => navigate('/flashcards') },
  ]

  const todayStr = new Date().toLocaleDateString('ar-SA', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' })
  const todayName = new Date().toLocaleDateString('ar-SA', { weekday: 'long' })
  const todayCourses = scheduleCourses.filter((c: any) => c.day?.includes(todayName))

  // Heatmap helpers
  const getHeatmapColor = (minutes: number) => {
    if (minutes === 0) return 'rgba(255,255,255,0.04)'
    if (minutes < 15) return `${theme.colors.accent}30`
    if (minutes < 30) return `${theme.colors.accent}50`
    if (minutes < 60) return `${theme.colors.accent}70`
    if (minutes < 120) return `${theme.colors.accent}90`
    return theme.colors.accent
  }

  const generateHeatmapDays = () => {
    const days: { date: Date; minutes: number; key: string }[] = []
    const now = new Date()
    for (let i = 364; i >= 0; i--) {
      const d = new Date(now)
      d.setDate(d.getDate() - i)
      const key = d.toISOString().split('T')[0]
      days.push({ date: d, minutes: heatmapData[key] || 0, key })
    }
    return days
  }

  const heatmapDays = generateHeatmapDays()
  const weeks: typeof heatmapDays[] = []
  for (let i = 0; i < heatmapDays.length; i += 7) {
    weeks.push(heatmapDays.slice(i, i + 7))
  }

  if (loading) {
    return (
      <div className="space-y-6 p-6">
        <div className="h-32 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
          {[1,2,3,4].map(i => <div key={i} className="h-28 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />)}
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
          <div className="lg:col-span-2 h-80 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
          <div className="h-80 rounded-2xl animate-pulse" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }} />
        </div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] flex-col gap-4 p-6">
        <AlertCircle size={48} style={{ color: theme.colors.error }} />
        <p className="text-xl font-bold" style={{ color: theme.colors.error }}>{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl mt-4 text-white font-bold transition-transform hover:scale-105" style={{ backgroundColor: theme.colors.error }}>
          {t('dashboard.retry')}
        </button>
      </div>
    )
  }

  const statCards = [
    {
      label: t('dashboard.statsCourses'),
      value: courseCount ?? 0, icon: BookOpen,
      color: theme.colors.accent, bgColor: `${theme.colors.accent}15`,
      trend: '+2', trendUp: true,
    },
    {
      label: t('dashboard.statsStudyTime'),
      value: focusStats ? `${focusStats.today_minutes} ${t('dashboard.studyMinutes')}` : '—',
      icon: Clock, color: theme.colors.warning, bgColor: `${theme.colors.warning}15`,
      trend: focusStats ? `${focusStats.session_count_today} ${t('dashboard.trendSessions')}` : '—', trendUp: true,
    },
    {
      label: t('dashboard.statsSkills'),
      value: progressStats ? `${Math.round(progressStats.average_mastery * 100)}%` : '—',
      icon: BrainCircuit, color: theme.colors.secondary, bgColor: `${theme.colors.secondary}15`,
      trend: progressStats ? `${progressStats.mastered || 0} ${t('dashboard.trendMastered')}` : '—', trendUp: true,
    },
    {
      label: t('dashboard.statsGoals'),
      value: `${goals.filter(g => !g.completed).length} ${t('dashboard.trendActive')}`,
      icon: Target, color: theme.colors.success, bgColor: `${theme.colors.success}15`,
      trend: `${goals.filter(g => g.completed).length} ${t('dashboard.trendCompleted')}`, trendUp: true,
    },
  ]

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6 p-6">

      {/* Welcome Header */}
      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="relative overflow-hidden rounded-2xl p-8 shadow-xl"
        style={{ background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surface}dd)`, border: `1px solid ${theme.colors.border}` }}>
        <div className="absolute top-0 right-0 w-96 h-96 opacity-10 pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.colors.accent} 0%, transparent 70%)`, filter: 'blur(60px)', transform: 'translate(20%, -30%)' }} />
        <div className="relative z-10">
          <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
            <div>
              <div className="flex items-center gap-3 mb-1">
                <h1 className="text-3xl font-bold tracking-tight" style={{ color: theme.colors.text }}>{t('dashboard.welcome')}</h1>
                <Sun size={24} style={{ color: theme.colors.accent }} />
              </div>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>{todayStr}</p>
              <motion.p key={quoteIndex} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                className="text-sm mt-2 italic" style={{ color: theme.colors.textDark }}>
                "{MOTIVATIONAL_QUOTES[quoteIndex]}"
              </motion.p>
            </div>
            <div className="flex items-center gap-3">
              <span className="px-4 py-2 rounded-xl text-xs font-bold backdrop-blur-md" style={{ backgroundColor: isHealthy ? `${theme.colors.success}15` : `${theme.colors.error}15`, color: isHealthy ? theme.colors.success : theme.colors.error, border: `1px solid ${isHealthy ? theme.colors.success : theme.colors.error}30` }}>
                <span className="w-2 h-2 rounded-full inline-block ml-1.5 align-middle animate-pulse" style={{ backgroundColor: isHealthy ? theme.colors.success : theme.colors.error }} />
                {isHealthy ? t('nav.systemOnline') : t('nav.systemOffline')}
              </span>
            </div>
          </div>
        </div>
      </motion.div>

      {/* Stats Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5">
        {statCards.map((stat, i) => {
          const Icon = stat.icon
          return (
            <motion.div key={i} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.08 }}
              className="relative overflow-hidden rounded-2xl p-5 backdrop-blur-[20px] shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
              <div className="flex items-start justify-between mb-3">
                <div className="w-12 h-12 rounded-2xl flex items-center justify-center shadow-lg" style={{ background: `linear-gradient(135deg, ${stat.color}30, ${stat.color}10)` }}>
                  <Icon size={24} style={{ color: stat.color }} />
                </div>
                {stat.trend && (
                  <div className="flex items-center gap-1 text-[10px] font-bold px-2 py-1 rounded-lg" style={{ backgroundColor: stat.trendUp ? `${theme.colors.success}15` : `${theme.colors.error}15`, color: stat.trendUp ? theme.colors.success : theme.colors.error }}>
                    {stat.trendUp ? <TrendingUp size={10} /> : <TrendingDown size={10} />}
                    {stat.trend}
                  </div>
                )}
              </div>
              <motion.p initial={{ scale: 0.5 }} animate={{ scale: 1 }} transition={{ delay: 0.3 + i * 0.08, type: 'spring', stiffness: 300 }}
                className="text-3xl font-black tracking-tight" style={{ color: theme.colors.text }}>
                {stat.value}
              </motion.p>
              <p className="text-xs font-medium mt-1" style={{ color: theme.colors.textMuted }}>{stat.label}</p>
            </motion.div>
          )
        })}
      </div>

      {/* Quick Actions Row */}
      <div className="flex gap-3 overflow-x-auto pb-2 hide-scrollbar">
        {quickActions.map((action, i) => {
          const Icon = action.icon
          return (
            <button key={i} onClick={action.action}
              className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-xs whitespace-nowrap transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${action.color}30, ${action.color}10)`, color: action.color, border: `1px solid ${action.color}40` }}>
              <Icon size={16} />{action.label}
            </button>
          )
        })}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Today's Schedule */}
        <div className="lg:col-span-1 rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <GraduationCap size={18} style={{ color: theme.colors.secondary }} />
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.todaySchedule')}</h2>
            </div>
            <Link to="/schedule" className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: theme.colors.secondary }}>
              {t('dashboard.viewAll')} <ChevronLeft size={12} />
            </Link>
          </div>
          {scheduleLoading ? (
            <div className="flex items-center justify-center py-8"><RefreshCw className="w-5 h-5 animate-spin" style={{ color: theme.colors.accent }} /></div>
          ) : todayCourses.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-8 opacity-50 text-center">
              <GraduationCap size={36} className="mb-2" style={{ color: theme.colors.textDark }} />
              <p className="text-sm font-bold" style={{ color: theme.colors.text }}>{t('dashboard.noLectures')}</p>
              <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>{t('dashboard.lightDay')}</p>
            </div>
          ) : (
            <div className="space-y-3">
              {todayCourses.slice(0, 4).map((course: any, idx: number) => (
                <div key={idx} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="w-10 h-10 rounded-xl flex items-center justify-center text-xs font-bold shrink-0" style={{ backgroundColor: `${theme.colors.secondary}20`, color: theme.colors.secondary }}>
                    {course.time?.split(':')[0] || '--'}
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-sm font-bold truncate" style={{ color: theme.colors.text }}>{course.name}</p>
                    <div className="flex items-center gap-2 text-[10px]" style={{ color: theme.colors.textMuted }}>
                      <span>{course.code}</span>
                      {course.room && <><span>•</span><span>{course.room}</span></>}
                    </div>
                  </div>
                  <div className="text-[10px] px-2 py-1 rounded-lg font-bold shrink-0" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
                    {course.time}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Weekly Study Chart */}
        <div className="lg:col-span-2 rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BarChart3 size={18} style={{ color: theme.colors.accent }} />
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.weeklyStudy')}</h2>
            </div>
            <span className="text-xs font-bold" style={{ color: theme.colors.textMuted }}>
              {t('dashboard.total')}: {weeklyData.reduce((s, d) => s + d.hours, 0).toFixed(1)} {t('dashboard.hours')}
            </span>
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
              <XAxis dataKey="day" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
              <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
              <Tooltip contentStyle={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, color: theme.colors.text, fontSize: 12 }} />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill={theme.colors.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Skills Radar */}
        <div className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <BrainCircuit size={18} style={{ color: theme.colors.accent }} />
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.skills')}</h2>
            </div>
            {progressStats && (
              <span className="text-[10px] px-2 py-1 rounded-full font-bold" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
                {Math.round(progressStats.average_mastery * 100)}%
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={220}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke={theme.colors.border} opacity={0.3} />
              <PolarAngleAxis dataKey="skill" tick={{ fill: theme.colors.textMuted, fontSize: 10 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="mastery" dataKey="mastery" stroke={theme.colors.accent} fill={theme.colors.accent} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>

        {/* Course Progress */}
        <div className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between mb-5">
            <div className="flex items-center gap-2">
              <BookMarked size={18} style={{ color: theme.colors.accent }} />
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.courseProgress')}</h2>
            </div>
            <Link to="/courses" className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: theme.colors.accent }}>
              {t('dashboard.viewAll')} <ChevronLeft size={12} />
            </Link>
          </div>
          <div className="space-y-4">
            {courseProgress.length === 0 ? (
              <div className="flex flex-col items-center justify-center py-8 opacity-50 text-center">
                <BookOpen size={36} className="mb-2" style={{ color: theme.colors.textDark }} />
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>{t('dashboard.noCourses')}</p>
              </div>
            ) : (
              courseProgress.slice(0, 5).map((course: any) => (
                <div key={course.id}>
                  <div className="flex justify-between text-xs mb-1.5">
                    <span className="font-bold truncate" style={{ color: theme.colors.text }}>{course.title}</span>
                    <span className="font-bold mr-2 shrink-0" style={{ color: course.color }}>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <motion.div initial={{ width: 0 }} animate={{ width: `${course.progress}%` }} transition={{ duration: 1, delay: 0.2 }}
                      className="h-full rounded-full" style={{ background: `linear-gradient(90deg, ${theme.colors.secondary}, ${course.color})` }} />
                  </div>
                </div>
              ))
            )}
          </div>
        </div>

        {/* Recent Activity */}
        <div className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center gap-2 mb-5">
            <Sparkles size={18} style={{ color: theme.colors.warning }} />
            <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.recentActivity')}</h2>
          </div>
          <div className="space-y-3">
            {[
              { icon: CheckCircle2, text: t('dashboard.activityGoals', { count: goals.filter(g => g.completed).length || 0 }), time: t('dashboard.justNow'), color: theme.colors.success },
              { icon: Clock, text: t('dashboard.activitySessions', { count: focusStats?.session_count_today || 0 }), time: t('dashboard.today'), color: theme.colors.accent },
              { icon: BookOpen, text: t('dashboard.activityNotes', { count: notesCount || 0 }), time: t('dashboard.thisWeek'), color: theme.colors.secondary },
              { icon: BrainCircuit, text: t('dashboard.activitySkills', { count: progressStats?.mastered || 0 }), time: t('dashboard.allTime'), color: theme.colors.warning },
            ].map((item, i) => {
              const Icon = item.icon
              return (
                <div key={i} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.02)' }}>
                  <div className="w-9 h-9 rounded-xl flex items-center justify-center" style={{ backgroundColor: `${item.color}15` }}>
                    <Icon size={16} style={{ color: item.color }} />
                  </div>
                  <div className="min-w-0 flex-1">
                    <p className="text-xs font-medium truncate" style={{ color: theme.colors.text }}>{item.text}</p>
                    <p className="text-[10px]" style={{ color: theme.colors.textMuted }}>{item.time}</p>
                  </div>
                </div>
              )
            })}
          </div>

          {/* Upcoming Deadlines */}
          {events.length > 0 && (
            <div className="mt-5 pt-5" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <div className="flex items-center gap-2">
                  <CalendarIcon size={16} style={{ color: theme.colors.error }} />
                  <span className="text-sm font-bold" style={{ color: theme.colors.text }}>{t('dashboard.upcomingDeadlines')}</span>
                </div>
              </div>
              <div className="space-y-2">
                {events.slice(0, 3).map((event: any) => (
                  <div key={event.id} className="flex items-center gap-2 text-xs" style={{ color: theme.colors.textMuted }}>
                    <div className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: theme.colors.error }} />
                    <span className="truncate">{event.title}</span>
                    <span className="shrink-0" style={{ color: theme.colors.textDark }}>
                      {new Date(event.start).toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}
                    </span>
                  </div>
                ))}
              </div>
            </div>
          )}
        </div>
      </div>

      {/* Heatmap Section */}
      <div className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
        style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
        <div className="flex items-center gap-2 mb-5">
          <GitCommitHorizontal size={18} style={{ color: theme.colors.accent }} />
          <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.heatmapTitle')}</h2>
        </div>
        <div className="flex gap-0.5 overflow-x-auto pb-2">
          {weeks.map((week, wi) => (
            <div key={wi} className="flex flex-col gap-0.5">
              {week.map((day) => (
                <div
                  key={day.key}
                  className="w-3 h-3 rounded-[3px] transition-colors hover:scale-150 hover:z-10 relative group"
                  style={{ backgroundColor: getHeatmapColor(day.minutes) }}
                  title={t('dashboard.heatmapTooltip', { date: day.date.toLocaleDateString('ar-SA'), minutes: day.minutes })}
                >
                  <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-1 px-2 py-1 rounded-lg text-[10px] whitespace-nowrap opacity-0 group-hover:opacity-100 transition-opacity pointer-events-none z-20 shadow-lg"
                    style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                    {day.date.toLocaleDateString('ar-SA', { weekday: 'short', day: 'numeric', month: 'short' })}: {day.minutes} {t('dashboard.studyMinutes')}
                  </div>
                </div>
              ))}
            </div>
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 justify-end text-[10px]" style={{ color: theme.colors.textMuted }}>
          <span>{t('dashboard.legend')}</span>
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: 'rgba(255,255,255,0.04)' }} />
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: `${theme.colors.accent}30` }} />
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: `${theme.colors.accent}50` }} />
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: `${theme.colors.accent}70` }} />
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: `${theme.colors.accent}90` }} />
          <div className="w-3 h-3 rounded-[3px]" style={{ backgroundColor: theme.colors.accent }} />
          <span>{t('dashboard.legendMore')}</span>
        </div>
      </div>

      {/* Goals Progress Section */}
      {goals.filter(g => !g.completed).length > 0 && (
        <div className="rounded-2xl p-6 backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Target size={18} style={{ color: theme.colors.success }} />
              <h2 className="text-lg font-bold" style={{ color: theme.colors.text }}>{t('dashboard.goalsProgress')}</h2>
            </div>
            <Link to="/goals" className="text-xs font-bold flex items-center gap-1 hover:underline" style={{ color: theme.colors.success }}>
              {t('dashboard.viewAll')} <ChevronLeft size={12} />
            </Link>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
            {goals.filter(g => !g.completed).slice(0, 4).map((goal) => {
              const pct = goal.target > 0 ? Math.min(100, Math.round((goal.current / goal.target) * 100)) : 0
              return (
                <div key={goal.id} className="p-4 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <p className="text-xs font-bold mb-2 truncate" style={{ color: theme.colors.text }}>{goal.title}</p>
                  <div className="flex items-center justify-between text-[10px] mb-1.5" style={{ color: theme.colors.textMuted }}>
                    <span>{goal.current}/{goal.target}</span>
                    <span className="font-bold" style={{ color: pct > 75 ? theme.colors.success : pct > 40 ? theme.colors.warning : theme.colors.textMuted }}>{pct}%</span>
                  </div>
                  <div className="w-full h-1.5 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.08)' }}>
                    <div className="h-full rounded-full transition-all duration-1000" style={{ width: `${pct}%`, background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.success})` }} />
                  </div>
                </div>
              )
            })}
          </div>
        </div>
      )}
    </motion.div>
  )
}
