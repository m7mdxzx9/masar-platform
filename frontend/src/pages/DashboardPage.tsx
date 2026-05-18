import { useState, useEffect } from 'react'
import { BookOpen, Activity, BrainCircuit, FlaskConical, Clock, Info, Calendar as CalendarIcon, ChevronLeft, GraduationCap, MapPin, RefreshCw } from 'lucide-react'
import { coursesAPI, healthAPI, agentsAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui'
import { useTheme } from '@/theme/ThemeContext'
import { useCalendarStore } from '@/stores/calendarStore'
import { useScheduleStore } from '@/stores/scheduleStore'
import { useProgressStore } from '@/stores/progressStore'
import { Link } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BarChart, Bar, XAxis, YAxis, CartesianGrid, Tooltip, ResponsiveContainer, RadarChart, Radar, PolarGrid, PolarAngleAxis, PolarRadiusAxis, LineChart, Line } from 'recharts'

interface HealthStatus {
  status: string
}

interface CourseData {
  id: number
  title: string
  description: string
  category: string
  difficulty: number
  modules: number
}

export default function DashboardPage() {
  const { theme } = useTheme()
  const { icalUrl, events } = useCalendarStore()
  const { courses: scheduleCourses, isLoading: scheduleLoading } = useScheduleStore()
  const [courseCount, setCourseCount] = useState<number | null>(null)
  const [agentCount, setAgentCount] = useState<number>(0)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const { stats: progressStats, fetchStats } = useProgressStore()

  const weeklyData = [
    { day: 'السبت', hours: 2.5 }, { day: 'الأحد', hours: 3 },
    { day: 'الإثنين', hours: 1.5 }, { day: 'الثلاثاء', hours: 4 },
    { day: 'الأربعاء', hours: 2 }, { day: 'الخميس', hours: 3.5 },
    { day: 'الجمعة', hours: 1 },
  ]

  const skillsData = [
    { skill: 'Python', mastery: 85 }, { skill: 'SQL', mastery: 60 },
    { skill: 'AI', mastery: 45 }, { skill: 'Web', mastery: 70 },
    { skill: 'Data', mastery: 55 }, { skill: 'DevOps', mastery: 30 },
  ]

  const timelineData = [
    { month: 'يناير', completed: 2, total: 5 },
    { month: 'فبراير', completed: 3, total: 5 },
    { month: 'مارس', completed: 5, total: 5 },
    { month: 'أبريل', completed: 4, total: 6 },
    { month: 'مايو', completed: 6, total: 6 },
    { month: 'يونيو', completed: 3, total: 5 },
  ]

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [coursesRes, healthRes, agentsRes] = await Promise.allSettled([
          coursesAPI.getAll(),
          healthAPI.check(),
          agentsAPI.list(),
        ])
        fetchStats()

        if (coursesRes.status === 'fulfilled') {
          const courses = coursesRes.value.data as unknown as CourseData[]
          setCourseCount(courses.length)
        } else {
          setCourseCount(0)
        }

        if (healthRes.status === 'fulfilled') {
          setHealth(healthRes.value.data as HealthStatus)
        } else {
          setHealth({ status: 'unreachable' })
        }

        if (agentsRes.status === 'fulfilled') {
          const data = agentsRes.value.data as { agents: { id: string }[] }
          setAgentCount(data.agents?.length ?? 0)
        }
      } catch {
        setError('تعذر الاتصال بالخادم')
      } finally {
        setLoading(false)
      }
    }
    fetchData()
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh]">
        <LoadingSpinner size={48} color={theme.colors.accent} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-full min-h-[60vh] flex-col gap-4">
        <Info size={48} style={{ color: theme.colors.error }} />
        <p style={{ color: theme.colors.error }} className="text-xl font-bold">{error}</p>
        <button onClick={() => window.location.reload()} className="px-6 py-2 rounded-xl mt-4 text-white font-bold transition-transform hover:scale-105" style={{ backgroundColor: theme.colors.error }}>
          إعادة المحاولة
        </button>
      </div>
    )
  }

  const isHealthy = health?.status === 'ok' || health?.status === 'healthy'

  const stats = [
    {
      label: 'الدورات المتاحة',
      value: courseCount ?? 0,
      icon: BookOpen,
      color: theme.colors.accent,
    },
    {
      label: 'حالة الخادم',
      value: isHealthy ? 'متصل' : 'غير متصل',
      icon: Activity,
      color: isHealthy ? theme.colors.success : theme.colors.error,
    },
    {
      label: 'المختبر الذكي',
      value: isHealthy ? 'جاهز' : 'غير متاح',
      icon: FlaskConical,
      color: isHealthy ? theme.colors.success : theme.colors.textDark,
    },
    {
      label: 'وكلاء الذكاء الاصطناعي',
      value: agentCount || '—',
      icon: BrainCircuit,
      color: theme.colors.secondary,
    },
  ]

  const dateStr = new Date().toLocaleDateString('ar-SA', {
    weekday: 'long', year: 'numeric', month: 'long', day: 'numeric',
  })

  return (
    <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="space-y-8 relative z-10">

      {/* Welcome Banner */}
      <div 
        className="relative overflow-hidden p-8 rounded-2xl shadow-xl transition-all duration-300 hover:shadow-2xl"
        style={{ background: `linear-gradient(135deg, ${theme.colors.surface}, ${theme.colors.surface}88)`, border: `1px solid ${theme.colors.border}` }}
      >
        <div className="absolute top-0 right-0 w-64 h-64 opacity-20 pointer-events-none" style={{ background: `radial-gradient(circle, ${theme.colors.accent} 0%, transparent 70%)`, filter: 'blur(40px)', transform: 'translate(30%, -30%)' }} />
        <div className="relative z-10 flex flex-col md:flex-row items-center justify-between gap-4">
          <div>
            <h1 className="text-4xl font-bold mb-2 tracking-tight" style={{ color: theme.colors.text }}>أهلاً بك في مسار! 👋</h1>
            <p className="text-lg" style={{ color: theme.colors.textMuted }}>مستعد لتعلم شيء جديد اليوم؟</p>
          </div>
          <div className="px-5 py-3 rounded-xl backdrop-blur-md" style={{ background: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)` }}>
            <div className="flex items-center gap-2">
              <Clock size={20} style={{ color: theme.colors.accent }} />
              <span className="font-medium tracking-wide" style={{ color: theme.colors.text }}>{dateStr}</span>
            </div>
          </div>
        </div>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        {stats.map((stat, i) => {
          const Icon = stat.icon
          return (
            <div
              key={i}
              className="p-6 rounded-2xl backdrop-blur-[20px] transition-all duration-300 hover:-translate-y-1 hover:shadow-lg group"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.02)',
                border: `1px solid rgba(255, 255, 255, 0.06)`,
              }}
            >
              <div className="flex items-center gap-4">
                <div
                  className="w-14 h-14 rounded-2xl flex items-center justify-center shadow-lg transition-transform duration-300 group-hover:scale-110 group-hover:rotate-3"
                  style={{ background: `linear-gradient(135deg, ${stat.color}22, ${stat.color}11)` }}
                >
                  <Icon size={28} style={{ color: stat.color }} />
                </div>
                <div>
                  <motion.p 
                    initial={{ opacity: 0, scale: 0.5 }} 
                    animate={{ opacity: 1, scale: 1 }}
                    transition={{ delay: 0.1 * i, type: "spring" }}
                    className="text-3xl font-black tracking-tight" 
                    style={{ color: theme.colors.text }}
                  >
                    {stat.value}
                  </motion.p>
                  <p className="text-sm font-medium mt-1" style={{ color: theme.colors.textMuted }}>{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Upcoming Events Section */}
      <div className="p-8 rounded-2xl backdrop-blur-[20px] border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <CalendarIcon size={24} style={{ color: theme.colors.accent }} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.colors.text }}>المواعيد القادمة</h2>
          </div>
          <Link to="/calendar" className="text-sm font-bold flex items-center gap-1 transition-colors hover:underline" style={{ color: theme.colors.accent }}>
            عرض الكل
            <ChevronLeft size={16} />
          </Link>
        </div>

        {!icalUrl ? (
          <div className="text-center py-8">
            <p className="mb-4" style={{ color: theme.colors.textMuted }}>قم بربط تقويم Blackboard لمتابعة مواعيدك هنا.</p>
            <Link to="/calendar" className="px-6 py-2 rounded-xl font-bold text-white shadow-lg inline-block" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              ربط التقويم
            </Link>
          </div>
        ) : events.length === 0 ? (
          <div className="text-center py-8 opacity-40">
            <p style={{ color: theme.colors.text }}>لا توجد مواعيد قادمة</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-5 gap-4">
            {events.slice(0, 5).map((event) => (
              <div key={event.id} className="p-4 rounded-xl border bg-white/5 space-y-2 transition-all hover:bg-white/10" style={{ borderColor: theme.colors.border }}>
                <div className="text-[10px] font-bold px-2 py-0.5 rounded bg-accent/10 inline-block truncate max-w-full" style={{ backgroundColor: theme.colors.accent + '15', color: theme.colors.accent, border: `1px solid ${theme.colors.accent}30` }}>
                  {event.course}
                </div>
                <h3 className="font-bold text-sm line-clamp-1" style={{ color: theme.colors.text }}>{event.title}</h3>
                <div className="flex flex-col gap-1 text-[10px]" style={{ color: theme.colors.textMuted }}>
                  <div className="flex items-center gap-1">
                    <Clock size={12} />
                    <span>{event.start.toLocaleDateString('ar-SA', { day: 'numeric', month: 'short' })}</span>
                  </div>
                  <div className="flex items-center gap-1">
                    <Clock size={12} className="opacity-0" />
                    <span>{event.start.toLocaleTimeString('ar-SA', { hour: '2-digit', minute: '2-digit' })}</span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Today's Schedule Section */}
      <div className="p-8 rounded-2xl backdrop-blur-[20px] border" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', borderColor: 'rgba(255, 255, 255, 0.06)' }}>
        <div className="flex justify-between items-center mb-6">
          <div className="flex items-center gap-3">
            <GraduationCap size={24} style={{ color: theme.colors.secondary }} />
            <h2 className="text-2xl font-bold tracking-tight" style={{ color: theme.colors.text }}>جدول اليوم</h2>
          </div>
          <Link to="/schedule" className="text-sm font-bold flex items-center gap-1 transition-colors hover:underline" style={{ color: theme.colors.secondary }}>
            الجدول الكامل
            <ChevronLeft size={16} />
          </Link>
        </div>

        {scheduleLoading ? (
          <div className="flex flex-col items-center justify-center py-12 gap-4">
            <RefreshCw className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
            <p className="text-sm font-bold animate-pulse" style={{ color: theme.colors.textMuted }}>جاري جلب جدولك...</p>
          </div>
        ) : scheduleCourses.length === 0 ? (
          <div className="text-center py-8">
            <p className="mb-4" style={{ color: theme.colors.textMuted }}>لم يتم ربط الجدول الدراسي من البوابة الأكاديمية بعد.</p>
            <Link to="/schedule" className="px-6 py-2 rounded-xl font-bold text-white shadow-lg inline-block" style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}>
              ربط الجدول
            </Link>
          </div>
        ) : (() => {
          const today = new Date().toLocaleDateString('ar-SA', { weekday: 'long' })
          const todayCourses = scheduleCourses.filter(c => c.day.includes(today))
          
          if (todayCourses.length === 0) {
            return (
              <div className="text-center py-8 opacity-40">
                <p style={{ color: theme.colors.text }}>لا توجد محاضرات اليوم</p>
              </div>
            )
          }

          return (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
              {todayCourses.map((course, idx) => (
                <div key={idx} className="p-4 rounded-xl border bg-white/5 space-y-3" style={{ borderColor: theme.colors.border }}>
                  <div className="flex justify-between items-start">
                    <span className="text-[10px] font-bold" style={{ color: theme.colors.secondary }}>{course.code}</span>
                    <div className="flex items-center gap-1 text-[10px]" style={{ color: theme.colors.textMuted }}>
                      <Clock size={12} />
                      <span>{course.time}</span>
                    </div>
                  </div>
                  <h3 className="font-bold text-sm line-clamp-1" style={{ color: theme.colors.text }}>{course.name}</h3>
                  <div className="flex items-center gap-2 text-[10px]" style={{ color: theme.colors.textMuted }}>
                    <MapPin size={12} />
                    <span>{course.room}</span>
                  </div>
                </div>
              ))}
            </div>
          )
        })()}
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
        {/* Weekly Study Time Chart */}
        <div className="lg:col-span-2 rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>ساعات الدراسة الأسبوعية</h2>
            <div className="flex items-center gap-2 text-sm" style={{ color: theme.colors.textMuted }}>
              <span className="w-3 h-3 rounded-sm" style={{ backgroundColor: theme.colors.accent }} />
              <span>ساعات</span>
            </div>
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <BarChart data={weeklyData}>
              <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
              <XAxis dataKey="day" tick={{ fill: theme.colors.textMuted, fontSize: 12 }} />
              <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 12 }} />
              <Tooltip
                contentStyle={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, color: theme.colors.text }}
                labelStyle={{ color: theme.colors.textMuted }}
              />
              <Bar dataKey="hours" radius={[8, 8, 0, 0]} fill={theme.colors.accent} />
            </BarChart>
          </ResponsiveContainer>
        </div>

        {/* Skills Mastery Radar */}
        <div className="rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="flex items-center justify-between mb-6">
            <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>المهارات</h2>
            {progressStats && (
              <span className="text-xs px-3 py-1 rounded-full" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent }}>
                {Math.round(progressStats.average_mastery * 100)}% إتقان
              </span>
            )}
          </div>
          <ResponsiveContainer width="100%" height={280}>
            <RadarChart data={skillsData}>
              <PolarGrid stroke={theme.colors.border} opacity={0.3} />
              <PolarAngleAxis dataKey="skill" tick={{ fill: theme.colors.textMuted, fontSize: 11 }} />
              <PolarRadiusAxis angle={30} domain={[0, 100]} tick={false} axisLine={false} />
              <Radar name="إتقان" dataKey="mastery" stroke={theme.colors.accent} fill={theme.colors.accent} fillOpacity={0.2} strokeWidth={2} />
            </RadarChart>
          </ResponsiveContainer>
        </div>
      </div>

      {/* Course Progress Timeline */}
      <div className="rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex items-center justify-between mb-6">
          <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>تقدم الدورات</h2>
          <Link to="/courses" className="text-sm font-bold flex items-center gap-1 transition-all hover:opacity-70" style={{ color: theme.colors.accent }}>
            عرض الكل<ChevronLeft size={16} />
          </Link>
        </div>
        <ResponsiveContainer width="100%" height={240}>
          <LineChart data={timelineData}>
            <CartesianGrid strokeDasharray="3 3" stroke={theme.colors.border} opacity={0.3} />
            <XAxis dataKey="month" tick={{ fill: theme.colors.textMuted, fontSize: 12 }} />
            <YAxis tick={{ fill: theme.colors.textMuted, fontSize: 12 }} />
            <Tooltip
              contentStyle={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}`, borderRadius: 12, color: theme.colors.text }}
              labelStyle={{ color: theme.colors.textMuted }}
            />
            <Line type="monotone" dataKey="completed" stroke={theme.colors.accent} strokeWidth={2} dot={{ fill: theme.colors.accent, strokeWidth: 0, r: 5 }} name="مكتمل" />
            <Line type="monotone" dataKey="total" stroke={theme.colors.textDark} strokeWidth={2} strokeDasharray="5 5" dot={{ fill: theme.colors.textDark, strokeWidth: 0, r: 4 }} name="إجمالي" />
          </LineChart>
        </ResponsiveContainer>
      </div>
    </motion.div>
  )
}
