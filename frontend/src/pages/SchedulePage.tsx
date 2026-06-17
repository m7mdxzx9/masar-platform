import React, { useState, useCallback } from 'react'
import { GraduationCap, Trash2, MapPin, User, AlertCircle, Info, FileCode, Upload, GripVertical, X, Pencil, Plus, Save, Clock, Link2, Construction, CalendarX } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useScheduleStore, Course, generateCourseId } from '@/stores/scheduleStore'
import { motion, AnimatePresence } from 'framer-motion'

/* ─── Edit Modal ─── */
function EditModal({ course, onSave, onClose, theme }: {
  course: Course
  onSave: (updates: Partial<Course>) => void
  onClose: () => void
  theme: any
}) {
  const [form, setForm] = useState({
    name: course.name,
    code: course.code,
    time: course.time,
    day: course.day,
    room: course.room,
    instructor: course.instructor,
  })

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  const fields = [
    { key: 'name', label: 'اسم المادة', icon: <GraduationCap size={14} /> },
    { key: 'code', label: 'رمز المادة', icon: <Info size={14} /> },
    { key: 'time', label: 'الوقت', icon: <Clock size={14} /> },
    { key: 'day', label: 'اليوم', icon: <GraduationCap size={14} /> },
    { key: 'room', label: 'القاعة', icon: <MapPin size={14} /> },
    { key: 'instructor', label: 'المحاضر', icon: <User size={14} /> },
  ]

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl backdrop-blur-[20px]"
        style={{ backgroundColor: theme.colors.surface + 'cc', borderColor: theme.colors.border }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Pencil size={18} style={{ color: theme.colors.accent }} />
            تعديل المادة
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} style={{ color: theme.colors.textMuted }} />
          </button>
        </div>

        <div className="space-y-3">
          {fields.map(({ key, label, icon }) => (
            <div key={key}>
              <label className="text-xs font-bold mb-1 flex items-center gap-1.5" style={{ color: theme.colors.textMuted }}>
                {icon} {label}
              </label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={e => update(key, e.target.value)}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border transition-all focus:ring-2"
                style={{
                  backgroundColor: theme.colors.bg + '80',
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                  // @ts-ignore
                  '--tw-ring-color': theme.colors.accent + '50',
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button
            onClick={onClose}
            className="px-5 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-white/10"
            style={{ color: theme.colors.textMuted }}
          >
            إلغاء
          </button>
          <button
            onClick={() => { onSave(form); onClose() }}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2"
            style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
          >
            <Save size={14} />
            حفظ التعديلات
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Add Course Modal ─── */
function AddCourseModal({ onAdd, onClose, theme }: {
  onAdd: (course: Omit<Course, 'id'>) => void
  onClose: () => void
  theme: any
}) {
  const [form, setForm] = useState({
    name: '',
    code: '',
    time: '',
    day: 'غير محدد',
    room: '',
    instructor: '',
  })

  const update = (key: string, value: string) => setForm(prev => ({ ...prev, [key]: value }))

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
      onClick={onClose}
    >
      <motion.div
        initial={{ scale: 0.9, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        exit={{ scale: 0.9, opacity: 0 }}
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl border p-6 space-y-5 shadow-2xl backdrop-blur-[20px]"
        style={{ backgroundColor: theme.colors.surface + 'cc', borderColor: theme.colors.border }}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: theme.colors.text }}>
            <Plus size={18} style={{ color: theme.colors.accent }} />
            إضافة مادة جديدة
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-white/10 transition-colors">
            <X size={18} style={{ color: theme.colors.textMuted }} />
          </button>
        </div>

        <div className="space-y-3">
          {[
            { key: 'name', label: 'اسم المادة', placeholder: 'مثال: رياضيات 101' },
            { key: 'code', label: 'رمز المادة', placeholder: 'مثال: MATH101' },
            { key: 'time', label: 'الوقت', placeholder: 'مثال: 10:00' },
            { key: 'room', label: 'القاعة', placeholder: 'مثال: قاعة 3' },
            { key: 'instructor', label: 'المحاضر', placeholder: 'مثال: د. أحمد' },
          ].map(({ key, label, placeholder }) => (
            <div key={key}>
              <label className="text-xs font-bold mb-1 block" style={{ color: theme.colors.textMuted }}>{label}</label>
              <input
                type="text"
                value={(form as any)[key]}
                onChange={e => update(key, e.target.value)}
                placeholder={placeholder}
                className="w-full px-3 py-2 rounded-xl text-sm outline-none border transition-all focus:ring-2"
                style={{
                  backgroundColor: theme.colors.bg + '80',
                  borderColor: theme.colors.border,
                  color: theme.colors.text,
                }}
              />
            </div>
          ))}
        </div>

        <div className="flex justify-end gap-3 pt-2">
          <button onClick={onClose} className="px-5 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
            إلغاء
          </button>
          <button
            onClick={() => { if (form.name.trim()) { onAdd({ ...form, isTemplate: true } as any); onClose() } }}
            disabled={!form.name.trim()}
            className="px-6 py-2 rounded-xl text-sm font-bold text-white shadow-lg transition-transform hover:scale-105 active:scale-95 flex items-center gap-2 disabled:opacity-40"
            style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
          >
            <Plus size={14} />
            إضافة
          </button>
        </div>
      </motion.div>
    </motion.div>
  )
}

/* ─── Main Page ─── */
export default function SchedulePage() {
  const { theme } = useTheme()
  const {
    courses, gridCourses, isLoading, error,
    uploadSchedule, parseManual, clearSchedule,
    addToGrid, removeFromGrid, editGridCourse, editTemplateCourse,
    addManualCourse, removeTemplateCourse
  } = useScheduleStore()

  const [showManual, setShowManual] = useState(false)
  const [manualHtml, setManualHtml] = useState('')
  const [dropTarget, setDropTarget] = useState<string | null>(null)
  const [editingCourse, setEditingCourse] = useState<{ course: Course, type: 'grid' | 'template' } | null>(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [selectedCourseForTouch, setSelectedCourseForTouch] = useState<Course | null>(null)
  const [selectedMobileDay, setSelectedMobileDay] = useState('الأحد')

  const handleManualSubmit = (e: React.FormEvent) => {
    e.preventDefault()
    if (!manualHtml.trim()) return
    parseManual(manualHtml)
    setShowManual(false)
    setManualHtml('')
  }

  const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) uploadSchedule(file)
  }

  const days = ['الأحد', 'الاثنين', 'الثلاثاء', 'الأربعاء', 'الخميس']
  const times = ['08:00', '09:00', '10:00', '11:00', '12:00', '13:00', '14:00', '15:00', '16:00', '17:00', '18:00', '19:00']

  // ─── Drag & Drop ───
  const handleDragStart = useCallback((e: React.DragEvent, course: Course) => {
    e.dataTransfer.effectAllowed = 'copy'
    e.dataTransfer.setData('application/json', JSON.stringify(course))
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '0.4'
    }
  }, [])

  const handleDragEnd = useCallback((e: React.DragEvent) => {
    setDropTarget(null)
    if (e.currentTarget instanceof HTMLElement) {
      e.currentTarget.style.opacity = '1'
    }
  }, [])

  const handleDragOver = useCallback((e: React.DragEvent, cellId: string) => {
    e.preventDefault()
    e.dataTransfer.dropEffect = 'copy'
    setDropTarget(cellId)
  }, [])

  const handleDragLeave = useCallback(() => {
    setDropTarget(null)
  }, [])

  const handleDrop = useCallback((e: React.DragEvent, day: string, time: string) => {
    e.preventDefault()
    setDropTarget(null)
    try {
      const courseData = JSON.parse(e.dataTransfer.getData('application/json')) as Course
      addToGrid(courseData, day, time)
    } catch { /* ignore */ }
  }, [addToGrid])

  const getGridCourseForSlot = (day: string, time: string): Course | undefined => {
    const hour = time.split(':')[0]
    return gridCourses.find(c => c.day === day && c.time === time)
      || gridCourses.find(c => c.day === day && c.time.includes(hour))
  }

  const containerVariants = {
    hidden: { opacity: 0 },
    visible: { opacity: 1, transition: { staggerChildren: 0.03 } },
  }

  const itemVariants = {
    hidden: { opacity: 0, y: 12 },
    visible: { opacity: 1, y: 0 },
  }

  return (
    <motion.div initial="hidden" animate="visible" variants={containerVariants} className="space-y-6">
      {/* ─── Header ─── */}
      <motion.div variants={itemVariants} className="flex flex-col sm:flex-row justify-between items-start sm:items-center backdrop-blur-[20px] p-5 rounded-2xl border gap-4" style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
        <div className="flex items-center gap-4">
          <div className="w-11 h-11 flex items-center justify-center rounded-xl" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <GraduationCap className="w-5 h-5 text-white" />
          </div>
          <div>
            <h1 className="text-xl font-bold" style={{ color: theme.colors.text }}>الجدول الدراسي</h1>
            <p className="text-xs" style={{ color: theme.colors.textMuted }}>اسحب المواد من الأسفل إلى الجدول • اضغط مرتين للتعديل</p>
          </div>
        </div>
        <div className="flex gap-2 flex-wrap">
          <label className="px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs border cursor-pointer hover:bg-white/10"
            style={{ color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.bg + '40' }}>
            <Upload size={14} />
            رفع ملف
            <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
          </label>
          <button onClick={() => setShowAddModal(true)}
            className="px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs border hover:bg-white/10"
            style={{ color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.bg + '40' }}>
            <Plus size={14} />
            إضافة مادة
          </button>
          <button onClick={() => setShowManual(!showManual)}
            className="px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs border hover:bg-white/10"
            style={{ color: theme.colors.text, borderColor: theme.colors.border, backgroundColor: theme.colors.bg + '40' }}>
            <FileCode size={14} />
            {showManual ? 'إغلاق' : 'إدخال يدوي'}
          </button>
          <button onClick={() => clearSchedule()}
            className="p-2 rounded-xl transition-all hover:bg-red-500/10 text-red-400 border border-transparent hover:border-red-500/30"
            title="مسح الكل">
            <Trash2 className="w-4 h-4" />
          </button>
          <div className="group relative">
            <button
              disabled
              className="px-3 py-2 rounded-xl transition-all flex items-center gap-2 font-bold text-xs border cursor-not-allowed opacity-50"
              style={{ color: theme.colors.textMuted, borderColor: theme.colors.border, backgroundColor: theme.colors.bg + '40' }}
            >
              <Construction size={14} />
              ربط البوابة الأكاديمية
            </button>
            <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 hidden group-hover:block z-50">
              <div className="px-3 py-2 rounded-xl text-xs font-bold whitespace-nowrap shadow-lg backdrop-blur-[20px]"
                style={{ backgroundColor: theme.colors.surface, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                جاري العمل على ربط البوابة الأكاديمية
              </div>
            </div>
          </div>
        </div>
      </motion.div>

      {/* ─── Manual HTML Input ─── */}
      <AnimatePresence>
        {showManual && (
          <motion.div initial={{ opacity: 0, height: 0 }} animate={{ opacity: 1, height: 'auto' }} exit={{ opacity: 0, height: 0 }}
            className="rounded-2xl border shadow-xl overflow-hidden backdrop-blur-[20px]"
            style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
            <div className="p-5 space-y-4">
              <textarea value={manualHtml} onChange={(e) => setManualHtml(e.target.value)}
                placeholder="<html>...</table>"
                className="w-full h-32 p-3 rounded-xl outline-none border text-xs font-mono transition-all"
                style={{ backgroundColor: theme.colors.bg + '80', borderColor: theme.colors.border, color: theme.colors.text }} />
              <div className="flex justify-end gap-3">
                <button onClick={() => setShowManual(false)} className="px-5 py-2 rounded-xl font-bold text-xs" style={{ color: theme.colors.text }}>إلغاء</button>
                <button onClick={handleManualSubmit} disabled={!manualHtml.trim()}
                  className="px-6 py-2 rounded-xl font-bold text-white text-xs shadow-lg disabled:opacity-50"
                  style={{ background: theme.colors.accent }}>تحليل</button>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {/* ─── Error ─── */}
      {error && !isLoading && (
        <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
          className="p-3 rounded-xl border flex items-center gap-3 backdrop-blur-[20px]"
          style={{ backgroundColor: theme.colors.error + '15', borderColor: theme.colors.error + '30' }}>
          <AlertCircle className="w-4 h-4 shrink-0" style={{ color: theme.colors.error }} />
          <p className="font-bold text-xs flex-1" style={{ color: theme.colors.text }}>{error}</p>
        </motion.div>
      )}

      {/* ─── Loading ─── */}
      {isLoading && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex-1 flex flex-col items-center justify-center gap-4 rounded-2xl backdrop-blur-[20px] border"
          style={{ backgroundColor: theme.colors.surface + '40', borderColor: theme.colors.border }}>
          <div className="relative">
            <div className="w-16 h-16 rounded-full border-4 animate-spin" style={{ borderColor: theme.colors.border, borderTopColor: theme.colors.accent }}></div>
            <GraduationCap className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-7 h-7" style={{ color: theme.colors.accent }} />
          </div>
          <p className="text-xs font-bold" style={{ color: theme.colors.textMuted }}>جاري معالجة الملف...</p>
        </motion.div>
      )}

      {/* Mobile Day Selector Tabs */}
      {!isLoading && (
        <div className="flex md:hidden overflow-x-auto gap-1 p-1 rounded-2xl mb-4 shrink-0 hide-scrollbar" style={{ backgroundColor: theme.colors.surface + '60', border: `1px solid ${theme.colors.border}20` }}>
          {days.map(day => {
            const isSelected = selectedMobileDay === day
            return (
              <button
                key={day}
                onClick={() => setSelectedMobileDay(day)}
                className="flex-1 text-center py-2.5 rounded-xl text-xs font-black transition-all shrink-0 relative"
                style={{
                  color: isSelected ? '#000' : theme.colors.textMuted,
                }}
              >
                {isSelected && (
                  <motion.div
                    layoutId="schedule-mobile-day-active"
                    className="absolute inset-0 rounded-xl z-[-1]"
                    style={{
                      background: theme.colors.accent,
                      boxShadow: `0 2px 10px ${theme.colors.accent}40`,
                    }}
                    transition={{ type: 'spring', stiffness: 400, damping: 30 }}
                  />
                )}
                <span className="relative z-10">{day}</span>
              </button>
            )
          })}
        </div>
      )}

      {/* Mobile Timeline View */}
      {!isLoading && (
        <div className="block md:hidden space-y-2">
          {times.map((time) => {
            const course = getGridCourseForSlot(selectedMobileDay, time)
            return (
              <div
                key={time}
                onClick={() => {
                  if (selectedCourseForTouch && !course) {
                    addToGrid(selectedCourseForTouch, selectedMobileDay, time)
                    setSelectedCourseForTouch(null)
                  }
                }}
                className={`flex items-stretch gap-3 rounded-2xl border transition-all ${
                  course ? 'p-4' : 'p-3'
                } ${selectedCourseForTouch && !course ? 'cursor-pointer hover:scale-[1.01] active:scale-98' : ''}`}
                style={{
                  backgroundColor: course ? theme.colors.surface + '80' : 'rgba(255,255,255,0.01)',
                  borderColor: course ? theme.colors.accent + '25' : theme.colors.border + '10',
                  borderStyle: course ? 'solid' : 'dashed',
                  borderRight: course ? `4px solid ${theme.colors.accent}` : undefined,
                }}
              >
                <div className="text-xs font-mono font-bold flex items-center justify-center w-12 shrink-0 opacity-60" style={{ color: theme.colors.textMuted }}>
                  {time}
                </div>
                <div className="flex-1 min-w-0 flex flex-col justify-center">
                  {course ? (
                    <div className="flex justify-between items-start gap-2">
                      <div className="min-w-0 flex-1">
                        <div className="flex flex-wrap items-center gap-1.5 mb-1">
                          <span className="text-[9px] font-black tracking-wider uppercase px-1.5 py-0.5 rounded border" style={{ backgroundColor: `${theme.colors.accent}15`, color: theme.colors.accent, borderColor: `${theme.colors.accent}30` }}>{course.code}</span>
                          {course.room && (
                            <span className="text-[10px] text-white/50 flex items-center gap-0.5"><MapPin size={9} />{course.room}</span>
                          )}
                        </div>
                        <h3 className="text-sm font-extrabold text-white truncate">{course.name}</h3>
                        {course.instructor && (
                          <p className="text-xs text-white/40 mt-0.5 flex items-center gap-1"><User size={9} />{course.instructor}</p>
                        )}
                      </div>
                      <div className="flex gap-0.5 shrink-0 self-center">
                        <button onClick={(e) => { e.stopPropagation(); setEditingCourse({ course, type: 'grid' }) }} className="p-2 rounded-xl hover:bg-white/10 transition-colors">
                          <Pencil size={13} style={{ color: theme.colors.accent }} />
                        </button>
                        <button onClick={(e) => { e.stopPropagation(); removeFromGrid(course.id) }} className="p-2 rounded-xl hover:bg-red-500/10 transition-colors">
                          <X size={13} className="text-red-400" />
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div className="text-[11px] font-bold opacity-30 flex items-center gap-1.5" style={{ color: theme.colors.textMuted }}>
                      {selectedCourseForTouch ? 'اضغط هنا لوضع المادة المحددة' : 'لا توجد محاضرات'}
                    </div>
                  )}
                </div>
              </div>
            )
          })}
        </div>
      )}

      {/* Desktop Schedule Grid */}
      {!isLoading && (
        <motion.div variants={itemVariants}
          className="hidden md:block flex-1 rounded-2xl backdrop-blur-[20px] border overflow-auto"
          style={{ backgroundColor: theme.colors.surface + '30', borderColor: theme.colors.border }}>
          <div className="min-w-[900px] p-5">
            <div className="grid grid-cols-6 gap-2">
              {/* Day Headers */}
              <div className="h-9"></div>
              {days.map(day => (
                <div key={day} className="text-center font-bold text-xs py-2.5 rounded-xl border"
                  style={{ backgroundColor: theme.colors.surface + '80', borderColor: theme.colors.border, color: theme.colors.accent }}>
                  {day}
                </div>
              ))}

              {/* Time Rows */}
              {times.map((time, ti) => (
                <React.Fragment key={time}>
                  <div className="flex items-center justify-center font-bold text-[11px]" style={{ color: theme.colors.textMuted }}>
                    {time}
                  </div>
                  {days.map(day => {
                    const course = getGridCourseForSlot(day, time)
                    const cellId = `${day}-${time}`
                    const isTarget = dropTarget === cellId && !course
                    const isHighlight = selectedCourseForTouch !== null && !course

                    return (
                      <motion.div
                        key={cellId}
                        initial={{ opacity: 0, y: 8 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: ti * 0.02 }}
                        className={`min-h-[90px] rounded-xl border p-2.5 transition-all group relative overflow-hidden ${selectedCourseForTouch && !course ? 'cursor-pointer hover:scale-[1.01]' : ''}`}
                        style={{
                          backgroundColor: course ? theme.colors.bg + '95' : isTarget ? theme.colors.accent + '15' : isHighlight ? theme.colors.accent + '08' : 'transparent',
                          borderColor: course ? theme.colors.accent + '35' : isTarget ? theme.colors.accent + '60' : isHighlight ? theme.colors.accent + '50' : theme.colors.border + '20',
                          borderWidth: (isTarget || isHighlight) ? '2px' : '1px',
                          borderStyle: course ? 'solid' : 'dashed',
                        }}
                        onDragOver={(e) => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; setDropTarget(cellId) }}
                        onDragLeave={() => setDropTarget(null)}
                        onDrop={(e) => handleDrop(e, day, time)}
                        onClick={() => {
                          if (selectedCourseForTouch && !course) {
                            addToGrid(selectedCourseForTouch, day, time)
                            setSelectedCourseForTouch(null)
                          }
                        }}
                      >
                        {course ? (
                          <div className="h-full flex flex-col justify-between relative z-10">
                            <div>
                              <div className="flex justify-between items-center mb-1.5">
                                <span className="text-[9px] font-black tracking-wider uppercase opacity-60" style={{ color: theme.colors.accent }}>{course.code}</span>
                                <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                  <button onClick={() => setEditingCourse({ course, type: 'grid' })}
                                    className="p-0.5 rounded hover:bg-white/15 transition-colors">
                                    <Pencil size={10} style={{ color: theme.colors.accent }} />
                                  </button>
                                  <button onClick={() => removeFromGrid(course.id)}
                                    className="p-0.5 rounded hover:bg-red-500/20 transition-colors">
                                    <X size={10} className="text-red-400" />
                                  </button>
                                </div>
                              </div>
                              <h3 className="text-[11px] font-bold leading-snug line-clamp-2" style={{ color: theme.colors.text }}>{course.name}</h3>
                            </div>
                            <div className="space-y-1 pt-1.5 mt-auto border-t border-white/5">
                              {course.room && (
                                <div className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.colors.textMuted }}>
                                  <MapPin size={10} style={{ color: theme.colors.secondary }} />
                                  <span className="truncate">{course.room}</span>
                                </div>
                              )}
                              {course.instructor && (
                                <div className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.colors.textMuted }}>
                                  <User size={10} style={{ color: theme.colors.accent }} />
                                  <span className="truncate">{course.instructor}</span>
                                </div>
                              )}
                            </div>
                            <div className="absolute -right-3 -bottom-3 w-12 h-12 rounded-full opacity-5 blur-xl group-hover:opacity-15 transition-opacity" style={{ backgroundColor: theme.colors.accent }}></div>
                          </div>
                        ) : (
                          <div className={`h-full w-full flex items-center justify-center rounded-lg transition-all ${isTarget ? '' : 'opacity-0'}`}>
                            {isTarget && <p className="text-[10px] font-bold" style={{ color: theme.colors.accent }}>أفلت هنا</p>}
                          </div>
                        )}
                      </motion.div>
                    )
                  })}
                </React.Fragment>
              ))}
            </div>

            {/* ─── Course Palette (templates) ─── */}
            {courses.length > 0 && (
              <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="mt-6 pt-5 border-t" style={{ borderColor: theme.colors.border + '40' }}>
                <div className="flex items-center justify-between mb-3">
                  <div className="flex items-center gap-2">
                    <GripVertical size={16} style={{ color: theme.colors.accent }} />
                    <h3 className="font-bold text-sm" style={{ color: theme.colors.text }}>
                      المواد المستخرجة
                    </h3>
                    <span className="text-[10px] px-2 py-0.5 rounded-full animate-pulse" style={{ backgroundColor: theme.colors.accent + '20', color: theme.colors.accent }}>
                      {courses.length} مادة — اسحب إلى الجدول أو اضغط على مادة ثم اضغط على خلية في الجدول لوضعها
                    </span>
                  </div>
                </div>

                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-4 xl:grid-cols-5 gap-3">
                  {courses.map((course, idx) => {
                    const isSelected = selectedCourseForTouch?.id === course.id
                    return (
                      <motion.div
                        key={course.id}
                        initial={{ opacity: 0, y: 12 }}
                        animate={{ opacity: 1, y: 0 }}
                        transition={{ delay: idx * 0.04 }}
                      >
                        <div
                          className={`rounded-xl border p-3 transition-all hover:ring-2 hover:shadow-lg group relative overflow-hidden cursor-pointer select-none hover:scale-[1.02] ${isSelected ? 'ring-2' : ''}`}
                          style={{
                            backgroundColor: isSelected ? theme.colors.accent + '15' : theme.colors.surface + '80',
                            borderColor: isSelected ? theme.colors.accent : theme.colors.accent + '30',
                          }}
                          draggable
                          onDragStart={(e) => handleDragStart(e, course)}
                          onDragEnd={handleDragEnd}
                          onClick={() => {
                            setSelectedCourseForTouch(isSelected ? null : course)
                          }}
                        >
                          <div className="flex flex-col gap-2">
                            <div className="flex justify-between items-start">
                              <div className="flex items-center gap-1.5">
                                <GripVertical size={11} style={{ color: theme.colors.textMuted }} className="opacity-40" />
                                <span className="text-[9px] font-black tracking-wider uppercase opacity-60" style={{ color: theme.colors.accent }}>{course.code}</span>
                              </div>
                              <div className="flex gap-0.5 opacity-0 group-hover:opacity-100 transition-opacity">
                                <button onClick={(e) => { e.stopPropagation(); setEditingCourse({ course, type: 'template' }) }}
                                  className="p-0.5 rounded hover:bg-white/15 transition-colors">
                                  <Pencil size={10} style={{ color: theme.colors.accent }} />
                                </button>
                                <button onClick={(e) => { e.stopPropagation(); removeTemplateCourse(course.id) }}
                                  className="p-0.5 rounded hover:bg-red-500/20 transition-colors">
                                  <X size={10} className="text-red-400" />
                                </button>
                              </div>
                            </div>
                            <h3 className="text-[11px] font-bold leading-snug line-clamp-2" style={{ color: theme.colors.text }}>{course.name}</h3>
                            {course.time && (
                              <span className="text-[9px] font-bold" style={{ color: theme.colors.secondary }}>{course.time}</span>
                            )}
                            <div className="space-y-0.5 pt-1.5 border-t border-white/5">
                              {course.room && (
                                <div className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.colors.textMuted }}>
                                  <MapPin size={9} style={{ color: theme.colors.secondary }} />
                                  <span className="truncate">{course.room}</span>
                                </div>
                              )}
                              {course.instructor && (
                                <div className="flex items-center gap-1.5 text-[9px]" style={{ color: theme.colors.textMuted }}>
                                  <User size={9} style={{ color: theme.colors.accent }} />
                                  <span className="truncate">{course.instructor}</span>
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </motion.div>
                    )
                  })}
                </div>
              </motion.div>
            )}

            {/* ─── Empty State ─── */}
            {courses.length === 0 && gridCourses.length === 0 && !error && (
              <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
                className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-20 h-20 rounded-2xl flex items-center justify-center backdrop-blur-[20px] border" style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
                  <CalendarX size={36} style={{ color: theme.colors.textMuted }} />
                </div>
                <h3 className="text-base font-bold" style={{ color: theme.colors.text }}>لم يتم تحميل جدول بعد</h3>
                <p className="text-sm" style={{ color: theme.colors.textMuted }}>ارفع ملف PDF أو استخدم الإدخال اليدوي لإضافة المواد</p>
                <div className="flex gap-3 mt-2">
                  <label className="px-5 py-2.5 rounded-xl font-bold text-xs text-white cursor-pointer transition-all hover:scale-105 shadow-lg flex items-center gap-2"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                    <Upload size={14} />
                    رفع ملف
                    <input type="file" className="hidden" accept=".pdf,.png,.jpg,.jpeg" onChange={handleFileChange} />
                  </label>
                  <button onClick={() => setShowManual(true)}
                    className="px-5 py-2.5 rounded-xl font-bold text-xs transition-all hover:bg-white/10 border flex items-center gap-2"
                    style={{ color: theme.colors.text, borderColor: theme.colors.border }}>
                    <FileCode size={14} />
                    إدخال يدوي
                  </button>
                </div>
              </motion.div>
            )}
          </div>
        </motion.div>
      )}

      {/* ─── Edit Modal ─── */}
      <AnimatePresence>
        {editingCourse && (
          <EditModal
            course={editingCourse.course}
            theme={theme}
            onClose={() => setEditingCourse(null)}
            onSave={(updates) => {
              if (editingCourse.type === 'grid') {
                editGridCourse(editingCourse.course.id, updates)
              } else {
                editTemplateCourse(editingCourse.course.id, updates)
              }
            }}
          />
        )}
      </AnimatePresence>

      {/* ─── Add Course Modal ─── */}
      <AnimatePresence>
        {showAddModal && (
          <AddCourseModal
            theme={theme}
            onClose={() => setShowAddModal(false)}
            onAdd={(course) => addManualCourse(course)}
          />
        )}
      </AnimatePresence>
    </motion.div>
  )
}
