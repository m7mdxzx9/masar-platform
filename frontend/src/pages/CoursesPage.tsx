import { useState, useEffect } from 'react'
import { motion } from 'framer-motion'
import { BookOpen, Loader2, AlertCircle } from 'lucide-react'
import { coursesAPI } from '@/services/api'
import type { Course } from '@/types'

export default function CoursesPage() {
  const [courses, setCourses] = useState<Course[]>([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    coursesAPI
      .getAll()
      .then((res) => setCourses(res.data))
      .catch((err) => setError(err.message || 'Failed to load courses'))
      .finally(() => setLoading(false))
  }, [])

  if (loading) {
    return (
      <div className="flex items-center justify-center h-64">
        <Loader2 className="w-8 h-8 animate-spin text-[#00FFFF]" />
      </div>
    )
  }

  if (error) {
    return (
      <div className="flex flex-col items-center justify-center h-64 text-[#FF4466]">
        <AlertCircle className="w-10 h-10 mb-2" />
        <p className="text-sm">{error}</p>
      </div>
    )
  }

  return (
    <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="space-y-6">
      <h1 className="text-3xl font-bold">الدورات</h1>

      {courses.length === 0 ? (
        <div className="flex flex-col items-center justify-center h-64 text-[#64748B]">
          <BookOpen className="w-12 h-12 mb-3 opacity-50" />
          <p>لا توجد دورات متاحة حالياً</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {courses.map((course) => (
            <motion.div
              key={course.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              className="p-5 rounded-xl bg-[#1E293B] border border-[#3B4554] hover:border-[#00FFFF]/30 transition-all"
            >
              <div className="flex items-start justify-between mb-3">
                <span className="px-2 py-1 rounded text-xs bg-[#00FFFF]/10 text-[#00FFFF]">
                  {course.category}
                </span>
                <span className="text-xs text-[#64748B]">
                  {course.modules} وحدة
                </span>
              </div>
              <h3 className="text-lg font-semibold text-[#F8FAFC] mb-2">{course.title}</h3>
              <p className="text-sm text-[#94A3B8] mb-4">{course.description}</p>
              <div className="flex items-center gap-2 text-xs text-[#64748B]">
                <span>المستوى: {course.difficulty}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}
    </motion.div>
  )
}
