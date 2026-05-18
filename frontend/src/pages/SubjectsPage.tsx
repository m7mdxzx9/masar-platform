import { useState, useEffect } from 'react'
import { useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { BookOpen, Plus, Loader2, Clock, User, MapPin, Hash } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useSubjectsStore } from '@/stores/subjectsStore'

const COLORS = ['#FF6B6B', '#4ECDC4', '#45B7D1', '#96CEB4', '#FFEAA7', '#DDA0DD', '#98D8C8', '#F7DC6F']

export default function SubjectsPage() {
  const { theme } = useTheme()
  const navigate = useNavigate()
  const { subjects, isLoading, error, fetchSubjects, createSubject } = useSubjectsStore()
  const [showModal, setShowModal] = useState(false)
  const [form, setForm] = useState({ name: '', code: '', instructor: '', schedule_day: '', schedule_time: '', room: '', color: COLORS[0], notes: '' })
  const [creating, setCreating] = useState(false)

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

  if (isLoading && subjects.length === 0) {
    return (
      <div className="h-full flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
      </div>
    )
  }

  if (error) {
    return (
      <div className="h-full flex items-center justify-center">
        <p className="text-lg font-medium" style={{ color: theme.colors.error }}>{error}</p>
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <BookOpen size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>موادي الدراسية</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{subjects.length} مادة دراسية</p>
          </div>
        </div>
        <button
          onClick={() => setShowModal(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
        >
          <Plus size={20} />
          إضافة مادة
        </button>
      </div>

      {subjects.length === 0 ? (
        <div className="h-[60%] flex flex-col items-center justify-center opacity-50">
          <BookOpen size={80} className="mb-6" style={{ color: theme.colors.textDark }} />
          <p className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>لا توجد مواد دراسية</p>
          <p className="text-sm" style={{ color: theme.colors.textMuted }}>أضف أول مادة دراسية الآن</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {subjects.map((subject, idx) => (
            <motion.button
              key={subject.id}
              initial={{ opacity: 0, y: 20 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: idx * 0.05 }}
              onClick={() => navigate(`/subjects/${subject.id}`)}
              className="text-right rounded-2xl p-6 transition-all hover:scale-[1.02] hover:shadow-xl"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}
            >
              <div className="w-10 h-10 rounded-xl mb-4" style={{ backgroundColor: subject.color || theme.colors.accent }} />
              <h3 className="text-xl font-bold mb-1" style={{ color: theme.colors.text }}>{subject.name}</h3>
              {subject.code && (
                <div className="flex items-center gap-2 text-xs mb-3" style={{ color: theme.colors.textMuted }}>
                  <Hash size={12} />
                  <span>{subject.code}</span>
                </div>
              )}
              <div className="space-y-2 text-xs" style={{ color: theme.colors.textDark }}>
                {subject.instructor && <div className="flex items-center gap-2"><User size={12} />{subject.instructor}</div>}
                {subject.schedule_day && <div className="flex items-center gap-2"><Clock size={12} />{subject.schedule_day} {subject.schedule_time}</div>}
                {subject.room && <div className="flex items-center gap-2"><MapPin size={12} />{subject.room}</div>}
              </div>
              <div className="mt-4 pt-4 text-xs" style={{ color: theme.colors.textMuted, borderTop: `1px solid ${theme.colors.border}` }}>
                {subject.file_count} ملف
              </div>
            </motion.button>
          ))}
        </div>
      )}

      {showModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowModal(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>إضافة مادة جديدة</h2>
            <div className="space-y-4">
              <input
                placeholder="اسم المادة *"
                value={form.name}
                onChange={(e) => setForm({ ...form, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }}
              />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="رمز المادة" value={form.code} onChange={(e) => setForm({ ...form, code: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <input placeholder="الدكتور" value={form.instructor} onChange={(e) => setForm({ ...form, instructor: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="اليوم" value={form.schedule_day} onChange={(e) => setForm({ ...form, schedule_day: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <input placeholder="الوقت" value={form.schedule_time} onChange={(e) => setForm({ ...form, schedule_time: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <input placeholder="القاعة" value={form.room} onChange={(e) => setForm({ ...form, room: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              <div className="flex gap-2">
                {COLORS.map((c) => (
                  <button key={c} onClick={() => setForm({ ...form, color: c })}
                    className={`w-8 h-8 rounded-full transition-all ${form.color === c ? 'ring-2 ring-white scale-110' : ''}`}
                    style={{ backgroundColor: c }} />
                ))}
              </div>
              <textarea placeholder="ملاحظات (اختياري)" value={form.notes} onChange={(e) => setForm({ ...form, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} rows={3} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setShowModal(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
              <button onClick={handleCreate} disabled={!form.name.trim() || creating}
                className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إضافة'}
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
