import { useState, useEffect, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion, AnimatePresence } from 'framer-motion'
import { BookOpen, Plus, Loader2, Clock, User, MapPin, Hash, BookX, GripVertical } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useSubjectsStore, Subject } from '@/stores/subjectsStore'
import {
  DndContext,
  closestCenter,
  PointerSensor,
  useSensor,
  useSensors,
  DragEndEvent,
  DragOverlay,
  DragStartEvent,
  TouchSensor,
} from '@dnd-kit/core'
import {
  SortableContext,
  useSortable,
  verticalListSortingStrategy,
} from '@dnd-kit/sortable'
import { CSS } from '@dnd-kit/utilities'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

function SortableSubjectCard({ subject, onClick }: { subject: Subject; onClick: () => void }) {
  const { theme } = useTheme()
  const { attributes, listeners, setNodeRef, transform, transition, isDragging } = useSortable({ id: subject.id })

  const style: React.CSSProperties = {
    transform: CSS.Transform.toString(transform),
    transition,
    opacity: isDragging ? 0.4 : 1,
    zIndex: isDragging ? 10 : 'auto' as any,
  }

  return (
    <div ref={setNodeRef} style={style} className="group">
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        whileHover={{ y: -2 }}
        className="flex items-center gap-3 rounded-2xl p-5 transition-all shadow-lg backdrop-blur-[20px] cursor-default select-none"
        style={{
          backgroundColor: theme.colors.surface + '70',
          border: `1px solid ${isDragging ? theme.colors.accent : theme.colors.border}`,
          boxShadow: isDragging ? `0 0 30px ${theme.colors.accentGlow}` : 'none',
        }}
      >
        {/* Drag Handle */}
        <button
          {...attributes}
          {...listeners}
          className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0 transition-all hover:bg-white/10 active:cursor-grabbing opacity-40 group-hover:opacity-100"
          style={{ color: theme.colors.textMuted }}
          aria-label="سحب لإعادة الترتيب"
        >
          <GripVertical size={18} />
        </button>

        {/* Content - click navigates */}
        <div onClick={onClick} className="flex-1 min-w-0 cursor-pointer">
          <div className="flex items-center gap-3 mb-3">
            <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: subject.color || theme.colors.accent }} />
            <div className="min-w-0">
              <h3 className="text-lg font-bold truncate" style={{ color: theme.colors.text }}>{subject.name}</h3>
              {subject.code && (
                <span className="text-xs flex items-center gap-1" style={{ color: theme.colors.textMuted }}>
                  <Hash size={10} />{subject.code}
                </span>
              )}
            </div>
          </div>
          <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs" style={{ color: theme.colors.textMuted }}>
            {subject.instructor && <span className="flex items-center gap-1"><User size={11} />{subject.instructor}</span>}
            {subject.schedule_day && <span className="flex items-center gap-1"><Clock size={11} />{subject.schedule_day} {subject.schedule_time}</span>}
            {subject.room && <span className="flex items-center gap-1"><MapPin size={11} />{subject.room}</span>}
          </div>
          <div className="mt-3 pt-3 text-xs" style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}` }}>
            {subject.file_count} ملف
          </div>
        </div>
      </motion.div>
    </div>
  )
}

function DragOverlayContent({ subject, theme }: { subject: Subject; theme: any }) {
  return (
    <div
      className="flex items-center gap-3 rounded-2xl p-5 shadow-2xl"
      style={{
        backgroundColor: theme.colors.surface,
        border: `2px solid ${theme.colors.accent}`,
        boxShadow: `0 0 40px ${theme.colors.accentGlow}`,
        width: '100%',
        maxWidth: '600px',
      }}
    >
      <div className="flex items-center justify-center w-10 h-10 rounded-xl shrink-0" style={{ color: theme.colors.accent }}>
        <GripVertical size={18} />
      </div>
      <div className="flex items-center gap-3 min-w-0 flex-1">
        <div className="w-10 h-10 rounded-xl shrink-0" style={{ backgroundColor: subject.color || theme.colors.accent }} />
        <div className="min-w-0">
          <p className="font-bold truncate" style={{ color: theme.colors.text }}>{subject.name}</p>
          {subject.code && <p className="text-xs" style={{ color: theme.colors.textMuted }}>{subject.code}</p>}
        </div>
      </div>
    </div>
  )
}

export default function SubjectsPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { subjects, subjectOrder, isLoading, error, fetchSubjects, createSubject, setSubjectOrder } = useSubjectsStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', instructor: '', schedule_day: '', schedule_time: '', room: '', color: COLORS[0], notes: '' })
  const [creating, setCreating] = useState(false)
  const [activeDragId, setActiveDragId] = useState<number | null>(null)

  const sensors = useSensors(
    useSensor(PointerSensor, { activationConstraint: { distance: 8 } }),
    useSensor(TouchSensor, { activationConstraint: { delay: 250, tolerance: 5 } })
  )

  useEffect(() => {
    fetchSubjects()
  }, [])

  const handleCreate = async () => {
    if (!form.name.trim()) return
    setCreating(true)
    try {
      const subject = await createSubject({
        name: form.name,
        code: form.code || undefined,
        instructor: form.instructor || undefined,
        schedule_day: form.schedule_day || undefined,
        schedule_time: form.schedule_time || undefined,
        room: form.room || undefined,
        color: form.color || undefined,
        notes: form.notes || undefined,
      })
      setShowModal(false)
      setForm({ name: '', code: '', instructor: '', schedule_day: '', schedule_time: '', room: '', color: COLORS[0], notes: '' })
      navigate(`/subjects/${subject.id}`)
    } catch { } finally {
      setCreating(false)
    }
  }

  const handleDragStart = useCallback((event: DragStartEvent) => {
    setActiveDragId(event.active.id as number)
  }, [])

  const handleDragEnd = useCallback((event: DragEndEvent) => {
    setActiveDragId(null)
    const { active, over } = event
    if (!over || active.id === over.id) return

    const oldIdx = subjectOrder.indexOf(active.id as number)
    const newIdx = subjectOrder.indexOf(over.id as number)
    if (oldIdx === -1 || newIdx === -1) return

    const reordered = [...subjectOrder]
    reordered.splice(oldIdx, 1)
    reordered.splice(newIdx, 0, active.id as number)
    setSubjectOrder(reordered)
  }, [subjectOrder, setSubjectOrder])

  const handleDragCancel = useCallback(() => {
    setActiveDragId(null)
  }, [])

  // Sort subjects by subjectOrder
  const sortedSubjects = subjectOrder
    .map((id) => subjects.find((s) => s.id === id))
    .filter((s): s is Subject => s != null)

  const activeDragSubject = activeDragId ? subjects.find((s) => s.id === activeDragId) : null

  if (isLoading && subjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="flex flex-col items-center gap-4 p-12 rounded-2xl backdrop-blur-[20px] border"
          style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: theme.colors.accent }} />
          <p className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>جاري تحميل المواد...</p>
        </motion.div>
      </div>
    )
  }

  if (error && !error.toLowerCase().includes('network') && !error.toLowerCase().includes('fetch')) {
    return (
      <div className="h-full flex items-center justify-center p-6">
        <motion.div initial={{ opacity: 0, scale: 0.9 }} animate={{ opacity: 1, scale: 1 }}
          className="p-8 rounded-2xl backdrop-blur-[20px] border text-center"
          style={{ backgroundColor: theme.colors.error + '12', borderColor: theme.colors.error + '25' }}>
          <p className="text-lg font-bold" style={{ color: theme.colors.error }}>{error}</p>
        </motion.div>
      </div>
    )
  }

  return (
    <div className="space-y-6">
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex flex-col sm:flex-row gap-4 justify-between items-start sm:items-center mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>موادي الدراسية</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{subjects.length} مادة دراسية • اسحب لإعادة الترتيب</p>
          </div>
        </div>
        <motion.button
          whileHover={{ scale: 1.05 }}
          whileTap={{ scale: 0.95 }}
          onClick={() => setShowModal(true)}
          className="hidden md:flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
        >
          <Plus size={20} />
          إضافة مادة
        </motion.button>
      </motion.div>

      {sortedSubjects.length === 0 ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="h-[60%] flex flex-col items-center justify-center rounded-2xl backdrop-blur-[20px] border p-12"
          style={{ backgroundColor: theme.colors.surface + '40', borderColor: theme.colors.border }}>
          <div className="w-20 h-20 rounded-2xl flex items-center justify-center mb-6 backdrop-blur-[20px] border" style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
            <BookX size={40} style={{ color: theme.colors.textMuted }} />
          </div>
          <p className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>لا توجد مواد دراسية</p>
          <p className="text-sm mb-6" style={{ color: theme.colors.textMuted }}>أضف أول مادة دراسية الآن</p>
          <motion.button
            whileHover={{ scale: 1.05 }}
            whileTap={{ scale: 0.95 }}
            onClick={() => setShowModal(true)}
            className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-white shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
          >
            <Plus size={18} />
            إضافة مادة جديدة
          </motion.button>
        </motion.div>
      ) : (
        <DndContext
          sensors={sensors}
          collisionDetection={closestCenter}
          onDragStart={handleDragStart}
          onDragEnd={handleDragEnd}
          onDragCancel={handleDragCancel}
        >
          <SortableContext items={sortedSubjects.map((s) => s.id)} strategy={verticalListSortingStrategy}>
            <div className="space-y-4 max-w-3xl">
              {sortedSubjects.map((subject) => (
                <SortableSubjectCard
                  key={subject.id}
                  subject={subject}
                  onClick={() => navigate(`/subjects/${subject.id}`)}
                />
              ))}
            </div>
          </SortableContext>
          <DragOverlay>
            {activeDragSubject && <DragOverlayContent subject={activeDragSubject} theme={theme} />}
          </DragOverlay>
        </DndContext>
      )}

      <AnimatePresence>
        {showModal && (
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} exit={{ opacity: 0 }}
            className="fixed inset-0 z-50 flex items-center justify-center p-4"
            style={{ backgroundColor: 'rgba(0,0,0,0.6)', backdropFilter: 'blur(20px)' }}
            onClick={() => setShowModal(false)}>
            <motion.div initial={{ scale: 0.9, opacity: 0 }} animate={{ scale: 1, opacity: 1 }} exit={{ scale: 0.9, opacity: 0 }}
              onClick={(e) => e.stopPropagation()}
              className="w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl border backdrop-blur-[20px]"
              style={{ backgroundColor: theme.colors.surface + 'cc', border: `1px solid ${theme.colors.border}` }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>إضافة مادة جديدة</h2>
              <div className="space-y-4">
                <input
                  placeholder="اسم المادة *"
                  value={form.name}
                  onChange={(e) => setForm({ ...form, name: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }}
                />
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="رمز المادة" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                    className="px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} />
                  <input placeholder="الدكتور" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                    className="px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} />
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <input placeholder="اليوم" value={form.schedule_day} onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                    className="px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} />
                  <input placeholder="الوقت" value={form.schedule_time} onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                    className="px-4 py-3 rounded-xl text-sm outline-none border"
                    style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} />
                </div>
                <input placeholder="القاعة" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border"
                  style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} />
                <div className="flex gap-2">
                  {COLORS.map((c) => (
                    <motion.button key={c} whileHover={{ scale: 1.2 }} whileTap={{ scale: 0.9 }}
                      onClick={() => setForm({ ...form, color: c })}
                      className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                      style={{ backgroundColor: c }} />
                  ))}
                </div>
                <textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none border resize-none"
                  style={{ backgroundColor: theme.colors.bg + '60', borderColor: theme.colors.border, color: theme.colors.text }} rows={3} />
              </div>
              <div className="flex gap-3 mt-6">
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={() => setShowModal(false)}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</motion.button>
                <motion.button whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}
                  onClick={handleCreate} disabled={!form.name.trim() || creating}
                  className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all disabled:opacity-50 shadow-lg"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                  {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إضافة'}
                </motion.button>
              </div>
            </motion.div>
          </motion.div>
        )}
      </AnimatePresence>
      {/* Floating Action Button for Mobile */}
      <button
        onClick={() => setShowModal(true)}
        className="md:hidden fixed bottom-24 left-6 z-40 w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-110 active:scale-95 transition-transform"
        style={{
          background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})`,
          boxShadow: `0 8px 24px ${theme.colors.accent}60`,
        }}
        aria-label="إضافة مادة"
      >
        <Plus size={28} />
      </button>
    </div>
  )
}
