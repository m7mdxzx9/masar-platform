
export default function DashboardPage() {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      className="space-y-6"
    >
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">مرحباً، الطالب!</h1>
        <span className="text-masar-text-muted">الثلاثاء، 9 يناير 2026</span>
      </div>

      <motion.div
        className="grid grid-cols-4 gap-4"
        variants={containerVariants}
        initial="hidden"
        animate="show"
      >
        {stats.map((stat) => (
          <motion.div
            key={stat.label}
            variants={itemVariants}
            className="card p-4"
          >
            <div className="flex items-center gap-3">
              <span className="text-3xl">{stat.icon}</span>
              <div>
                <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                <p className="text-sm text-masar-text-muted">{stat.label}</p>
              </div>
            </div>
          </motion.div>
        ))}
      </motion.div>

      <div className="grid grid-cols-2 gap-6">
        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.4 }}
        >
          <h2 className="text-xl font-semibold mb-4">الدورات الحالية</h2>
          <div className="space-y-4">
            {recentCourses.map((course) => (
              <div key={course.id} className="space-y-2">
                <div className="flex justify-between text-sm">
                  <span>{course.title}</span>
                  <span className="text-masar-cyan">{course.progress}/{course.total}</span>
                </div>
                <div className="h-2 bg-masar-bg rounded-full overflow-hidden">
                  <div
                    className="h-full bg-gradient-to-r from-masar-blue to-masar-cyan rounded-full transition-all"
                    style={{ width: `${(course.progress / course.total) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        </motion.div>

        <motion.div
          className="card"
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 0.5 }}
        >
          <h2 className="text-xl font-semibold mb-4">النشاط الأخير</h2>
          <div className="space-y-3">
            {recentActivity.map((activity, i) => (
              <div key={i} className="flex items-center gap-3 text-sm">
                <span className="text-lg">
                  {activity.type === 'course' ? '📖' : activity.type === 'lab' ? '💻' : activity.type === 'challenge' ? '🎮' : '🤖'}
                </span>
                <div className="flex-1">
                  <p>{activity.text}</p>
                  <p className="text-masar-text-dark">{activity.time}</p>
                </div>
              </div>
            ))}
          </div>
        </motion.div>
      </div>
    </motion.div>
  )
}
import { useState, useEffect } from 'react'
import { BookOpen, Activity, BrainCircuit, Trophy, FlaskConical } from 'lucide-react'
import { coursesAPI, healthAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui'

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
  const [courseCount, setCourseCount] = useState<number | null>(null)
  const [health, setHealth] = useState<HealthStatus | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    async function fetchData() {
      try {
        setLoading(true)
        const [coursesRes, healthRes] = await Promise.allSettled([
          coursesAPI.getAll(),
          healthAPI.check(),
        ])

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
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex items-center justify-center h-64">
        <p className="text-masar-error text-lg">{error}</p>
      </div>
    )
  }

  const stats = [
    {
      label: 'الدورات',
      value: courseCount ?? 0,
      icon: BookOpen,
      color: 'text-masar-cyan',
    },
    {
      label: 'حالة الخادم',
      value: health?.status === 'ok' ? 'متصل' : 'غير متصل',
      icon: Activity,
      color: health?.status === 'ok' ? 'text-masar-success' : 'text-masar-error',
    },
    {
      label: 'المختبر الذكي',
      value: 'جاهز',
      icon: FlaskConical,
      color: 'text-masar-success',
    },
    {
      label: 'وكلاء AI',
      value: '5+',
      icon: BrainCircuit,
      color: 'text-masar-cyan',
    },
  ]

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">لوحة التحكم</h1>
        <span className="text-masar-text-muted text-sm">
          {new Date().toLocaleDateString('ar-SA', {
            weekday: 'long',
            year: 'numeric',
            month: 'long',
            day: 'numeric',
          })}
        </span>
      </div>

      {/* Stats Grid */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
        {stats.map((stat) => {
          const Icon = stat.icon
          return (
            <div key={stat.label} className="card p-5">
              <div className="flex items-center gap-4">
                <div className="w-12 h-12 rounded-xl bg-masar-bg flex items-center justify-center">
                  <Icon size={24} className={stat.color} />
                </div>
                <div>
                  <p className={`text-2xl font-bold ${stat.color}`}>{stat.value}</p>
                  <p className="text-sm text-masar-text-muted">{stat.label}</p>
                </div>
              </div>
            </div>
          )
        })}
      </div>

      {/* Welcome / Empty State */}
      {courseCount === 0 && (
        <div className="card p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-masar-text-dark" />
          <h2 className="text-xl font-semibold mb-2">مرحباً بك في مسار!</h2>
          <p className="text-masar-text-muted mb-4">
            لم تبدأ أي دورة بعد. انتقل إلى صفحة الدورات لاستكشاف المحتوى المتاح.
          </p>
          <a href="/courses" className="btn-primary inline-block px-6 py-2">
            استعرض الدورات
          </a>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <a
          href="/labs"
          className="card card-glow p-5 block hover:border-masar-cyan/40 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <FlaskConical size={20} className="text-masar-cyan" />
            <h3 className="font-semibold">المختبر الذكي</h3>
          </div>
          <p className="text-sm text-masar-text-muted">اكتب كود Python وشغّله مباشرة في المتصفح</p>
        </a>
        <a
          href="/agents"
          className="card card-glow p-5 block hover:border-masar-cyan/40 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <BrainCircuit size={20} className="text-masar-cyan" />
            <h3 className="font-semibold">الوكلاء الذكيون</h3>
          </div>
          <p className="text-sm text-masar-text-muted">تحدث مع معلم AI متخصص في مجالك</p>
        </a>
        <a
          href="/challenges"
          className="card card-glow p-5 block hover:border-masar-cyan/40 transition-colors"
        >
          <div className="flex items-center gap-3 mb-2">
            <Trophy size={20} className="text-masar-cyan" />
            <h3 className="font-semibold">التحديات</h3>
          </div>
          <p className="text-sm text-masar-text-muted">اختبر مهاراتك في تحديات البرمجة</p>
        </a>
      </div>
    </div>
  )
}
