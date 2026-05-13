import { useState, useEffect } from 'react'
import { BookOpen, Plus, Loader2, X } from 'lucide-react'
import { coursesAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui'
import { Badge } from '@/components/ui'

interface CourseData {
  id: number
  title: string
  description: string
  category: string
  difficulty: number
  modules: number
}

const difficultyLabels: Record<number, string> = {
  1: 'مبتدئ',
  2: 'متوسط',
  3: 'متقدم',
}

const difficultyVariants: Record<number, 'success' | 'warning' | 'error'> = {
  1: 'success',
  2: 'warning',
  3: 'error',
}

export default function CoursesPage() {
  const [courses, setCourses] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [showForm, setShowForm] = useState(false)
  const [creating, setCreating] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 1,
    modules: 1,
  })

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await coursesAPI.getAll()
      const data = res.data as unknown as CourseData[]
      setCourses(data)
      setError(null)
    } catch {
      setError('تعذر تحميل الدورات')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      setCreating(true)
      await coursesAPI.create({
        title: formData.title,
        description: formData.description,
        category: formData.category || 'general',
        difficulty: formData.difficulty,
        modules: [],
      })
      setFormData({ title: '', description: '', category: '', difficulty: 1, modules: 1 })
      setShowForm(false)
      await fetchCourses()
    } catch {
      setError('تعذر إنشاء الدورة')
    } finally {
      setCreating(false)
    }
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <LoadingSpinner size={40} />
      </div>
    )
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex justify-between items-center">
        <h1 className="text-3xl font-bold">الدورات</h1>
        <button
          onClick={() => setShowForm(!showForm)}
          className="btn-primary flex items-center gap-2 px-4 py-2"
        >
          {showForm ? <X size={18} /> : <Plus size={18} />}
          {showForm ? 'إلغاء' : 'دورة جديدة'}
        </button>
      </div>

      {error && (
        <div className="card border-masar-error/30 p-4">
          <p className="text-masar-error text-sm">{error}</p>
        </div>
      )}

      {/* Create Form */}
      {showForm && (
        <div className="card p-6">
          <h2 className="text-xl font-semibold mb-4">إنشاء دورة جديدة</h2>
          <form onSubmit={handleCreate} className="space-y-4">
            <div>
              <label className="text-sm text-masar-text-muted block mb-1">عنوان الدورة *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="input"
                placeholder="مثال: الشبكات العصبية العميقة"
                required
              />
            </div>
            <div>
              <label className="text-sm text-masar-text-muted block mb-1">الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="input min-h-[80px] resize-y"
                placeholder="وصف مختصر للدورة..."
              />
            </div>
            <div className="grid grid-cols-2 gap-4">
              <div>
                <label className="text-sm text-masar-text-muted block mb-1">الفئة</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="input"
                  placeholder="مثال: deep-learning"
                />
              </div>
              <div>
                <label className="text-sm text-masar-text-muted block mb-1">الصعوبة</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData((p) => ({ ...p, difficulty: Number(e.target.value) }))}
                  className="input"
                >
                  <option value={1}>مبتدئ</option>
                  <option value={2}>متوسط</option>
                  <option value={3}>متقدم</option>
                </select>
              </div>
            </div>
            <button
              type="submit"
              disabled={creating || !formData.title.trim()}
              className="btn-primary flex items-center gap-2 px-6 py-2 disabled:opacity-50"
            >
              {creating ? <Loader2 size={16} className="animate-spin" /> : <Plus size={16} />}
              {creating ? 'جارٍ الإنشاء...' : 'إنشاء'}
            </button>
          </form>
        </div>
      )}

      {/* Courses List */}
      {courses.length === 0 && !loading ? (
        <div className="card p-8 text-center">
          <BookOpen size={48} className="mx-auto mb-4 text-masar-text-dark" />
          <h2 className="text-xl font-semibold mb-2">لا توجد دورات بعد</h2>
          <p className="text-masar-text-muted">أنشئ أول دورة بالضغط على زر "دورة جديدة"</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <div key={course.id} className="card card-glow p-5">
              <div className="flex justify-between items-start mb-3">
                <h3 className="font-semibold text-masar-text">{course.title}</h3>
                <Badge variant={difficultyVariants[course.difficulty] || 'default'} size="sm">
                  {difficultyLabels[course.difficulty] || 'غير محدد'}
                </Badge>
              </div>
              <p className="text-sm text-masar-text-muted mb-3 line-clamp-2">{course.description}</p>
              <div className="flex items-center justify-between text-xs text-masar-text-dark">
                <span className="bg-masar-bg px-2 py-1 rounded">{course.category}</span>
                <span>{course.modules} وحدة</span>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
