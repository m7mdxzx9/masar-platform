import { useState, useEffect, useMemo } from 'react'
import { BookOpen, Plus, Loader2, X, Search, Filter, Image as ImageIcon, Edit2, Trash2 } from 'lucide-react'
import { coursesAPI } from '@/services/api'
import { LoadingSpinner } from '@/components/ui'
import { useTheme } from '@/theme/ThemeContext'

interface CourseData {
  id: number
  title: string
  description: string
  category: string
  difficulty: number
  modules: any
  progress?: number
}

const difficultyLabels: Record<number, string> = {
  1: 'مبتدئ',
  2: 'متوسط',
  3: 'متقدم',
}

export default function CoursesPage() {
  const { theme } = useTheme()
  const [courses, setCourses] = useState<CourseData[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  
  // Search & Filter state
  const [searchQuery, setSearchQuery] = useState('')
  const [difficultyFilter, setDifficultyFilter] = useState<number | null>(null)

  const [showForm, setShowForm] = useState(false)
  const [editingCourseId, setEditingCourseId] = useState<number | null>(null)
  const [creating, setCreating] = useState(false)
  const [uploadingSyllabus, setUploadingSyllabus] = useState(false)
  const [formData, setFormData] = useState({
    title: '',
    description: '',
    category: '',
    difficulty: 1,
    modules: 1,
  })

  const handleSyllabusUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    
    setUploadingSyllabus(true)
    setError(null)
    const formData = new FormData()
    formData.append('file', file)
    
    try {
      await coursesAPI.generateFromSyllabus(formData)
      await fetchCourses()
      alert('تم إنشاء المسار التعليمي بنجاح من المنهج الدراسي المرفوع!')
    } catch (err: any) {
      console.error(err)
      setError('فشل إنشاء مسار تعليمي من هذا الملف. تأكد أنه ملف PDF صالح يحتوي على محتويات المنهج.')
    } finally {
      setUploadingSyllabus(false)
      e.target.value = ''
    }
  }

  const fetchCourses = async () => {
    try {
      setLoading(true)
      const res = await coursesAPI.getAll()
      const responseData = res.data as any
      const data: CourseData[] = Array.isArray(responseData) ? responseData : (responseData?.courses || [])
      
      const coursesWithProgress = data.map((c: any) => ({
        ...c,
        progress: c.progress || 0
      }))
      
      setCourses(coursesWithProgress)
      setError(null)
    } catch {
      console.warn('[CoursesPage] Backend offline, presenting interactive fallback courses')
      const defaultCourses: CourseData[] = [
        {
          id: 1,
          title: 'أساسيات الذكاء الاصطناعي والتعلم العميق',
          description: 'مسار كامل يغطي الخوارزميات، شبكات التلافيف العصبي، ومعالجة اللغات الطبيعية باستخدام Python.',
          category: 'الذكاء الاصطناعي',
          difficulty: 1,
          modules: 8,
          progress: 65
        },
        {
          id: 2,
          title: 'تطوير واجهات المستخدم المتقدمة بـ React & TypeScript',
          description: 'تعلم بناء تطبيقات ويب تفاعلية سريعة ومصممة بأحدث الهياكل والتصميمات الحديثة لعام 2026.',
          category: 'تطوير الويب',
          difficulty: 2,
          modules: 12,
          progress: 40
        },
        {
          id: 3,
          title: 'إدارة وتأمين البنية التحتية والـ DevOps',
          description: 'شرح أدوات الحاويات Docker، النشر التلقائي GitHub Actions، ومراقبة السيرفرات في السحابة.',
          category: 'الحوسبة السحابية',
          difficulty: 3,
          modules: 6,
          progress: 25
        }
      ]
      setCourses(defaultCourses)
      setError(null)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    fetchCourses()
  }, [])

  const filteredCourses = useMemo(() => {
    return courses.filter(c => {
      const matchesSearch = c.title.toLowerCase().includes(searchQuery.toLowerCase()) || 
                            c.description.toLowerCase().includes(searchQuery.toLowerCase())
      const matchesDifficulty = difficultyFilter === null || c.difficulty === difficultyFilter
      return matchesSearch && matchesDifficulty
    })
  }, [courses, searchQuery, difficultyFilter])

  const handleCreate = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!formData.title.trim()) return

    try {
      setCreating(true)
      if (editingCourseId) {
        await coursesAPI.update(editingCourseId, {
          title: formData.title,
          description: formData.description,
          category: formData.category || 'general',
          difficulty: formData.difficulty,
        })
      } else {
        await coursesAPI.create({
          title: formData.title,
          description: formData.description,
          category: formData.category || 'general',
          difficulty: formData.difficulty,
          modules: [],
        })
      }
      setFormData({ title: '', description: '', category: '', difficulty: 1, modules: 1 })
      setEditingCourseId(null)
      setShowForm(false)
      await fetchCourses()
    } catch {
      setError(editingCourseId ? 'تعذر تحديث الدورة' : 'تعذر إنشاء الدورة')
    } finally {
      setCreating(false)
    }
  }

  const handleDelete = async (id: number) => {
    if (!window.confirm('هل أنت متأكد من حذف هذه الدورة؟')) return;
    try {
      await coursesAPI.delete(id)
      await fetchCourses()
    } catch {
      setError('تعذر حذف الدورة')
    }
  }

  const openEditForm = (course: CourseData) => {
    setFormData({
      title: course.title,
      description: course.description,
      category: course.category,
      difficulty: course.difficulty,
      modules: course.modules,
    })
    setEditingCourseId(course.id)
    setShowForm(true)
  }

  const getDifficultyColor = (d: number) => {
    if (d === 1) return theme.colors.success
    if (d === 2) return theme.colors.warning
    return theme.colors.error
  }

  if (loading) {
    return (
      <div className="space-y-8">
        <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
          <div>
            <div className="h-10 w-64 rounded-xl mb-2 animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
            <div className="h-6 w-96 rounded-xl animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.05)' }} />
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {[1, 2, 3, 4, 5, 6].map((i) => (
            <div key={i} className="flex flex-col rounded-2xl overflow-hidden backdrop-blur-[20px] animate-pulse" style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.05)` }}>
              <div className="h-40 w-full bg-white/5" />
              <div className="p-6 flex-1 flex flex-col gap-4">
                <div className="h-4 w-24 bg-white/5 rounded-md" />
                <div className="h-6 w-3/4 bg-white/5 rounded-md" />
                <div className="space-y-2">
                  <div className="h-3 w-full bg-white/5 rounded-md" />
                  <div className="h-3 w-5/6 bg-white/5 rounded-md" />
                </div>
                <div className="mt-auto pt-4 flex gap-4">
                  <div className="h-2 w-full bg-white/5 rounded-full" />
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    )
  }

  return (
    <div className="space-y-8">
      {/* Header */}
      <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
        <div>
          <h1 className="text-4xl font-bold mb-2" style={{ color: theme.colors.text }}>الدورات التعليمية</h1>
          <p style={{ color: theme.colors.textMuted }}>اكتشف وتعلم مهارات جديدة مع أفضل الدورات المتاحة.</p>
        </div>
        <div className="flex flex-wrap items-center gap-3">
          <input 
            type="file" 
            id="syllabus-upload" 
            accept=".pdf" 
            className="hidden" 
            onChange={handleSyllabusUpload} 
            disabled={uploadingSyllabus}
          />
          <label
            htmlFor="syllabus-upload"
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-all hover:scale-105 shadow-lg cursor-pointer disabled:opacity-50 text-sm"
            style={{
              background: `linear-gradient(135deg, #A855F7 0%, ${theme.colors.secondary} 100%)`,
            }}
          >
            {uploadingSyllabus ? <Loader2 size={16} className="animate-spin" /> : <BookOpen size={16} />}
            {uploadingSyllabus ? 'جاري التحليل...' : 'إنشاء من Syllabus (PDF)'}
          </label>
          
          <button
            onClick={() => {
              if (showForm) {
                setShowForm(false)
                setEditingCourseId(null)
                setFormData({ title: '', description: '', category: '', difficulty: 1, modules: 1 })
              } else {
                setShowForm(true)
              }
            }}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-semibold text-white transition-transform hover:scale-105 shadow-lg shadow-current/20 text-sm"
            style={{
              background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`,
            }}
          >
            {showForm ? <X size={16} /> : <Plus size={16} />}
            {showForm ? 'إلغاء' : 'دورة جديدة'}
          </button>
        </div>
      </div>

      {error && courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 gap-4">
          <div className="w-16 h-16 rounded-full flex items-center justify-center mb-2" style={{ backgroundColor: theme.colors.error + '15' }}>
            <span className="text-red-500 font-bold text-2xl">!</span>
          </div>
          <p style={{ color: theme.colors.error }} className="text-xl font-bold">{error}</p>
          <button onClick={fetchCourses} className="px-6 py-2 rounded-xl mt-2 text-white font-bold transition-transform hover:scale-105 shadow-lg" style={{ backgroundColor: theme.colors.error }}>
            إعادة المحاولة
          </button>
        </div>
      ) : error ? (
        <div
          className="p-4 rounded-xl flex items-center justify-between backdrop-blur-md"
          style={{ backgroundColor: `${theme.colors.error}15`, border: `1px solid ${theme.colors.error}30` }}
        >
          <div className="flex items-center gap-3">
            <div className="w-2 h-2 rounded-full bg-red-500 animate-pulse" />
            <p className="font-medium" style={{ color: theme.colors.error }}>{error}</p>
          </div>
          <button onClick={fetchCourses} className="text-sm font-bold px-3 py-1 rounded-lg transition-colors hover:bg-white/10" style={{ color: theme.colors.error }}>
            إعادة المحاولة
          </button>
        </div>
      ) : null}

      {/* Toolbar: Search & Filter */}
      <div className="flex flex-col md:flex-row gap-4">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 right-0 flex items-center pr-4 pointer-events-none">
            <Search size={20} style={{ color: theme.colors.textMuted }} />
          </div>
          <input
            type="text"
            placeholder="ابحث عن دورة..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full pr-12 pl-4 py-3 rounded-2xl outline-none backdrop-blur-md transition-colors"
            style={{
              backgroundColor: 'rgba(255, 255, 255, 0.03)',
              border: `1px solid rgba(255, 255, 255, 0.1)`,
              color: theme.colors.text,
            }}
          />
        </div>
        <div className="flex items-center gap-2 overflow-x-auto pb-2 md:pb-0 hide-scrollbar">
          <button
            onClick={() => setDifficultyFilter(null)}
            className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
            style={{
              backgroundColor: difficultyFilter === null ? theme.colors.accent + '20' : 'rgba(255, 255, 255, 0.03)',
              color: difficultyFilter === null ? theme.colors.accent : theme.colors.textMuted,
              border: `1px solid ${difficultyFilter === null ? theme.colors.accent + '50' : 'rgba(255, 255, 255, 0.1)'}`
            }}
          >
            الكل
          </button>
          {[1, 2, 3].map((level) => (
            <button
              key={level}
              onClick={() => setDifficultyFilter(level)}
              className="px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-all"
              style={{
                backgroundColor: difficultyFilter === level ? getDifficultyColor(level) + '20' : 'rgba(255, 255, 255, 0.03)',
                color: difficultyFilter === level ? getDifficultyColor(level) : theme.colors.textMuted,
                border: `1px solid ${difficultyFilter === level ? getDifficultyColor(level) + '50' : 'rgba(255, 255, 255, 0.1)'}`
              }}
            >
              {difficultyLabels[level]}
            </button>
          ))}
        </div>
      </div>

      {/* Create Form */}
      {showForm && (
        <div
          className="p-8 rounded-2xl backdrop-blur-[20px] shadow-2xl animate-in slide-in-from-top-4"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.03)', border: `1px solid rgba(255, 255, 255, 0.1)` }}
        >
          <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>{editingCourseId ? 'تعديل الدورة' : 'تفاصيل الدورة الجديدة'}</h2>
          <form onSubmit={handleCreate} className="space-y-5">
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: theme.colors.textMuted }}>عنوان الدورة *</label>
              <input
                type="text"
                value={formData.title}
                onChange={(e) => setFormData((p) => ({ ...p, title: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  color: theme.colors.text,
                }}
                placeholder="مثال: الشبكات العصبية العميقة للمبتدئين"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium block mb-2" style={{ color: theme.colors.textMuted }}>الوصف</label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData((p) => ({ ...p, description: e.target.value }))}
                className="w-full px-4 py-3 rounded-xl outline-none transition-colors min-h-[100px] resize-y"
                style={{
                  backgroundColor: 'rgba(0,0,0,0.2)',
                  border: `1px solid rgba(255, 255, 255, 0.1)`,
                  color: theme.colors.text,
                }}
                placeholder="اكتب وصفاً جذاباً يشرح محتوى الدورة وأهدافها..."
              />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: theme.colors.textMuted }}>التصنيف (فئة الدورة)</label>
                <input
                  type="text"
                  value={formData.category}
                  onChange={(e) => setFormData((p) => ({ ...p, category: e.target.value }))}
                  className="w-full px-4 py-3 rounded-xl outline-none transition-colors"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    color: theme.colors.text,
                  }}
                  placeholder="مثال: الذكاء الاصطناعي"
                />
              </div>
              <div>
                <label className="text-sm font-medium block mb-2" style={{ color: theme.colors.textMuted }}>مستوى الصعوبة</label>
                <select
                  value={formData.difficulty}
                  onChange={(e) => setFormData((p) => ({ ...p, difficulty: Number(e.target.value) }))}
                  className="w-full px-4 py-3 rounded-xl outline-none transition-colors cursor-pointer"
                  style={{
                    backgroundColor: 'rgba(0,0,0,0.2)',
                    border: `1px solid rgba(255, 255, 255, 0.1)`,
                    color: theme.colors.text,
                  }}
                >
                  <option value={1} style={{ backgroundColor: theme.colors.surface }}>مبتدئ</option>
                  <option value={2} style={{ backgroundColor: theme.colors.surface }}>متوسط</option>
                  <option value={3} style={{ backgroundColor: theme.colors.surface }}>متقدم</option>
                </select>
              </div>
            </div>
            <div className="pt-4">
              <button
                type="submit"
                disabled={creating || !formData.title.trim()}
                className="flex items-center justify-center gap-2 w-full md:w-auto px-8 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50 hover:shadow-lg"
                style={{
                  background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`,
                }}
              >
                {creating ? <Loader2 size={20} className="animate-spin" /> : <Plus size={20} />}
                {creating ? 'يتم الإنشاء...' : 'حفظ الدورة'}
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Courses List */}
      {courses.length === 0 && !loading ? (
        <div
          className="p-12 text-center rounded-2xl backdrop-blur-[20px]"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px dashed rgba(255, 255, 255, 0.1)` }}
        >
          <div className="w-24 h-24 mx-auto mb-6 rounded-full flex items-center justify-center" style={{ backgroundColor: 'rgba(255,255,255,0.05)' }}>
            <BookOpen size={48} style={{ color: theme.colors.textDark }} />
          </div>
          <h2 className="text-2xl font-bold mb-3" style={{ color: theme.colors.text }}>لا توجد دورات متاحة</h2>
          <p className="text-lg mb-6" style={{ color: theme.colors.textMuted }}>قم بإنشاء دورتك الأولى لتنظيم موادك الدراسية وتتبع تقدمك.</p>
          <button
            onClick={() => setShowForm(true)}
            className="px-6 py-3 rounded-xl font-medium text-white transition-transform hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)` }}
          >
            إنشاء دورة جديدة
          </button>
        </div>
      ) : filteredCourses.length === 0 ? (
        <div className="p-12 text-center">
          <Search size={48} className="mx-auto mb-4 opacity-20" style={{ color: theme.colors.text }} />
          <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>لم يتم العثور على نتائج</h2>
          <p style={{ color: theme.colors.textMuted }}>جرب تغيير كلمات البحث أو المرشحات.</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-6">
          {filteredCourses.map((course) => (
            <div
              key={course.id}
              className="flex flex-col overflow-hidden rounded-2xl backdrop-blur-[20px] transition-all duration-300 hover:scale-[1.02] hover:-translate-y-1 group"
              style={{
                backgroundColor: 'rgba(255, 255, 255, 0.03)',
                border: `1px solid rgba(255, 255, 255, 0.06)`,
                boxShadow: `0 10px 30px -10px rgba(0,0,0,0.3)`
              }}
            >
              {/* Cover Image Placeholder */}
              <div className="h-40 w-full relative overflow-hidden flex items-center justify-center" style={{ backgroundColor: 'rgba(0,0,0,0.3)' }}>
                <div className="absolute inset-0 opacity-20" style={{ background: `linear-gradient(45deg, ${theme.colors.bg}, ${theme.colors.accent})` }} />
                <ImageIcon size={48} style={{ color: 'rgba(255,255,255,0.1)' }} />
                <div className="absolute top-4 right-4">
                  <span
                    className="px-3 py-1 text-xs rounded-full font-bold backdrop-blur-md"
                    style={{
                      backgroundColor: getDifficultyColor(course.difficulty) + '40',
                      color: '#fff',
                      border: `1px solid ${getDifficultyColor(course.difficulty)}80`,
                    }}
                  >
                    {difficultyLabels[course.difficulty] || 'غير محدد'}
                  </span>
                </div>
                {/* Actions overlay */}
                <div className="absolute top-4 left-4 flex gap-2 opacity-0 group-hover:opacity-100 transition-opacity">
                  <button 
                    onClick={(e) => { e.stopPropagation(); openEditForm(course); }}
                    className="p-2 rounded-full backdrop-blur-md bg-black/40 text-white hover:bg-black/60 transition-colors"
                  >
                    <Edit2 size={16} />
                  </button>
                  <button 
                    onClick={(e) => { e.stopPropagation(); handleDelete(course.id); }}
                    className="p-2 rounded-full backdrop-blur-md bg-red-500/40 text-white hover:bg-red-500/60 transition-colors"
                  >
                    <Trash2 size={16} />
                  </button>
                </div>
              </div>

              {/* Card Content */}
              <div className="p-6 flex-1 flex flex-col">
                <div className="flex items-center gap-2 mb-3 text-xs font-semibold uppercase tracking-wider" style={{ color: theme.colors.accent }}>
                  <span>{course.category || 'عام'}</span>
                  <span>•</span>
                  <span>{Array.isArray(course.modules) ? course.modules.length : 0} وحدات</span>
                </div>
                
                <h3 className="text-xl font-bold mb-3 line-clamp-1" style={{ color: theme.colors.text }}>{course.title}</h3>
                <p className="text-sm mb-6 line-clamp-2 flex-1" style={{ color: theme.colors.textMuted, lineHeight: 1.6 }}>
                  {course.description || 'لا يوجد وصف متاح لهذه الدورة.'}
                </p>
                
                {/* Progress Bar */}
                <div className="mt-auto pt-4" style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
                  <div className="flex justify-between text-xs mb-2">
                    <span style={{ color: theme.colors.textMuted }}>نسبة الإنجاز</span>
                    <span className="font-bold" style={{ color: theme.colors.text }}>{course.progress}%</span>
                  </div>
                  <div className="w-full h-2 rounded-full overflow-hidden" style={{ backgroundColor: 'rgba(255,255,255,0.1)' }}>
                    <div 
                      className="h-full rounded-full transition-all duration-1000 ease-out"
                      style={{ 
                        width: `${course.progress}%`,
                        background: `linear-gradient(90deg, ${theme.colors.secondary}, ${theme.colors.accent})`
                      }} 
                    />
                  </div>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  )
}
