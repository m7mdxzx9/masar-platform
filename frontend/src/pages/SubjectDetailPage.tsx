import { useState, useEffect, useRef } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { motion } from 'framer-motion'
import { ArrowRight, Edit3, Trash2, Upload, FileText, Download, Loader2, Clock, User, MapPin, Hash, Sparkles, X, ClipboardList } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useSubjectsStore } from '@/stores/subjectsStore'
import { useStudyStore } from '@/stores/studyStore'
import { subjectsAPI } from '@/services/api'

export default function SubjectDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const { theme } = useTheme()
  const { currentSubject, isLoading, error, fetchSubjectDetails, updateSubject, deleteSubject, uploadFile, deleteFile, clearCurrentSubject } = useSubjectsStore()
  const [editing, setEditing] = useState(false)
  const [editForm, setEditForm] = useState<any>({})
  const [uploading, setUploading] = useState(false)
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [dragging, setDragging] = useState(false)
  const studyStore = useStudyStore()
  const [summarizing, setSummarizing] = useState(false)
  const [summaryModal, setSummaryModal] = useState<{ subject_name: string; overall_summary: string; overall_key_points: string[]; file_summaries: { filename: string; summary: string; key_points: string[] }[] } | null>(null)

  useEffect(() => {
    if (id) {
      fetchSubjectDetails(Number(id))
    }
    return () => clearCurrentSubject()
  }, [id])

  const handleSaveEdit = async () => {
    if (!currentSubject) return
    await updateSubject(currentSubject.id, editForm)
    setEditing(false)
  }

  const handleDelete = async () => {
    if (!currentSubject || !confirm('هل أنت متأكد من حذف هذه المادة؟')) return
    await deleteSubject(currentSubject.id)
    navigate('/subjects')
  }

  const handleFileUpload = async (file: File) => {
    if (!currentSubject) return
    setUploading(true)
    try {
      await uploadFile(currentSubject.id, file)
    } finally {
      setUploading(false)
    }
  }

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault()
    setDragging(false)
    const file = e.dataTransfer.files[0]
    if (file) handleFileUpload(file)
  }

  const handleDragOver = (e: React.DragEvent) => { e.preventDefault(); setDragging(true) }
  const handleDragLeave = () => setDragging(false)

  const handleDeleteFile = async (fileId: number) => {
    if (!currentSubject || !confirm('حذف هذا الملف؟')) return
    await deleteFile(currentSubject.id, fileId)
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  if (isLoading && !currentSubject) {
    return <div className="h-full flex items-center justify-center"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} /></div>
  }

  if (error) {
    return <div className="h-full flex items-center justify-center"><p className="text-lg font-medium" style={{ color: theme.colors.error }}>{error}</p></div>
  }

  if (!currentSubject) {
    return <div className="h-full flex items-center justify-center"><p className="text-lg" style={{ color: theme.colors.textMuted }}>المادة غير موجودة</p></div>
  }

  return (
    <div className="space-y-6">
      <button onClick={() => navigate('/subjects')} className="flex items-center gap-2 mb-6 text-sm font-medium transition-all hover:opacity-70" style={{ color: theme.colors.textMuted }}>
        <ArrowRight size={16} />
        العودة إلى المواد
      </button>

      <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
        className="rounded-2xl p-5 sm:p-8 mb-6 shadow-xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
        <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
          <div className="flex items-start gap-4">
            <div className="w-12 h-12 sm:w-14 sm:h-14 rounded-2xl shrink-0" style={{ backgroundColor: currentSubject.color || theme.colors.accent }} />
            <div className="min-w-0">
              <h1 className="text-xl sm:text-3xl font-extrabold truncate" style={{ color: theme.colors.text }}>{currentSubject.name}</h1>
              <div className="flex flex-wrap gap-x-3 gap-y-1 text-xs mt-2" style={{ color: theme.colors.textMuted }}>
                {currentSubject.code && <span className="flex items-center gap-1"><Hash size={12} />{currentSubject.code}</span>}
                {currentSubject.instructor && <span className="flex items-center gap-1"><User size={12} />{currentSubject.instructor}</span>}
                {currentSubject.schedule_day && <span className="flex items-center gap-1"><Clock size={12} />{currentSubject.schedule_day} {currentSubject.schedule_time}</span>}
                {currentSubject.room && <span className="flex items-center gap-1"><MapPin size={12} />{currentSubject.room}</span>}
              </div>
            </div>
          </div>
          <div className="flex flex-wrap items-center gap-2 mt-2 md:mt-0 justify-start md:justify-end shrink-0">
            <button onClick={async () => { if (!currentSubject) return; setSummarizing(true); try { const r = await studyStore.summarizeSubject(currentSubject.id); setSummaryModal(r) } finally { setSummarizing(false) } }}
              className="flex items-center gap-1.5 px-4 py-2.5 rounded-xl font-bold text-xs transition-all hover:scale-105 text-white shadow-lg shrink-0"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {summarizing ? <Loader2 size={12} className="animate-spin" /> : <Sparkles size={12} />}
              تلخيص المادة
            </button>
            <button onClick={() => { setEditing(true); setEditForm({ name: currentSubject.name, code: currentSubject.code, instructor: currentSubject.instructor, schedule_day: currentSubject.schedule_day, schedule_time: currentSubject.schedule_time, room: currentSubject.room, notes: currentSubject.notes }) }}
              className="p-2.5 rounded-xl border transition-all hover:bg-white/5 shrink-0" style={{ color: theme.colors.textMuted, borderColor: theme.colors.border }}>
              <Edit3 size={15} />
            </button>
            <button onClick={handleDelete} className="p-2.5 rounded-xl border transition-all hover:bg-red-500/10 shrink-0" style={{ color: theme.colors.error, borderColor: theme.colors.border }}>
              <Trash2 size={15} />
            </button>
          </div>
        </div>
        {currentSubject.notes && (
          <p className="mt-4 text-sm leading-relaxed" style={{ color: theme.colors.textMuted }}>{currentSubject.notes}</p>
        )}
      </motion.div>

      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.1 }}
          className="rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>رفع ملف</h2>
          <div
            onDrop={handleDrop} onDragOver={handleDragOver} onDragLeave={handleDragLeave}
            onClick={() => fileInputRef.current?.click()}
            className={`flex flex-col items-center justify-center p-10 rounded-2xl cursor-pointer transition-all ${dragging ? 'scale-105' : ''}`}
            style={{ border: `2px dashed ${dragging ? theme.colors.accent : theme.colors.border}`, backgroundColor: dragging ? `${theme.colors.accent}10` : 'rgba(255,255,255,0.02)' }}>
            {uploading ? <Loader2 className="w-10 h-10 animate-spin mb-4" style={{ color: theme.colors.accent }} />
              : <Upload className="w-10 h-10 mb-4" style={{ color: theme.colors.textMuted }} />}
            <p className="text-sm font-medium" style={{ color: theme.colors.textMuted }}>أسقط الملف هنا أو اضغط للتصفح</p>
            <input ref={fileInputRef} type="file" className="hidden" onChange={(e) => { const f = e.target.files?.[0]; if (f) handleFileUpload(f) }} />
          </div>
        </motion.div>

        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: 0.2 }}
          className="rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: theme.colors.text }}>الملفات ({currentSubject.files?.length || 0})</h2>
          {(currentSubject.files?.length || 0) === 0 ? (
            <div className="flex flex-col items-center justify-center py-10 opacity-50">
              <FileText size={40} className="mb-3" style={{ color: theme.colors.textDark }} />
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>لا توجد ملفات مرفوعة</p>
            </div>
          ) : (
            <div className="space-y-2 max-h-[400px] overflow-y-auto">
              {currentSubject.files.map((file) => (
                <div key={file.id} className="flex items-center justify-between p-3 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                  <div className="flex items-center gap-3 min-w-0">
                    <FileText size={16} style={{ color: theme.colors.accent }} />
                    <div className="min-w-0">
                      <p className="text-sm font-medium truncate" style={{ color: theme.colors.text }}>{file.original_name}</p>
                      <p className="text-xs" style={{ color: theme.colors.textDark }}>{formatSize(file.file_size)}</p>
                    </div>
                  </div>
                  <div className="flex gap-1 shrink-0">
                    <a href={subjectsAPI.downloadUrl(currentSubject.id, file.id)} download
                      className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.textMuted }}>
                      <Download size={16} />
                    </a>
                    <button onClick={() => navigate(`/quiz-generator?file=${file.id}&subject=${currentSubject.id}`)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.accent }} title="اختبار">
                      <ClipboardList size={16} />
                    </button>
                    <button onClick={() => handleDeleteFile(file.id)}
                      className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.error }}>
                      <Trash2 size={16} />
                    </button>
                  </div>
                </div>
              ))}
            </div>
          )}
        </motion.div>
      </div>

      {/* Summary Modal */}
      {summaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSummaryModal(null)}>
          <div className="w-full max-w-3xl mx-4 rounded-2xl p-8 shadow-2xl max-h-[85vh] overflow-y-auto" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-2xl font-bold" style={{ color: theme.colors.text }}>تلخيص: {summaryModal.subject_name}</h2>
              <button onClick={() => setSummaryModal(null)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
                <X size={20} />
              </button>
            </div>

            {/* Overall Summary */}
            <div className="mb-6">
              <h3 className="font-bold text-lg mb-3" style={{ color: theme.colors.text }}>الملخص العام</h3>
              <div className="p-5 rounded-xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}` }}>
                <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.colors.textMuted }}>{summaryModal.overall_summary}</p>
              </div>
              {summaryModal.overall_key_points.length > 0 && (
                <div className="mt-4">
                  <p className="font-bold text-sm mb-2" style={{ color: theme.colors.text }}>النقاط الرئيسية</p>
                  <ul className="space-y-1">
                    {summaryModal.overall_key_points.map((p, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: theme.colors.textMuted }}>
                        <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.accent }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
            </div>

            {/* Per-file Summaries */}
            {summaryModal.file_summaries.length > 0 && (
              <div>
                <h3 className="font-bold text-lg mb-3" style={{ color: theme.colors.text }}>ملخصات الملفات ({summaryModal.file_summaries.length})</h3>
                <div className="space-y-3">
                  {summaryModal.file_summaries.map((fs, idx) => (
                    <details key={idx} className="rounded-xl p-4" style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid ${theme.colors.border}` }}>
                      <summary className="cursor-pointer font-bold text-sm" style={{ color: theme.colors.text }}>{fs.filename}</summary>
                      <div className="mt-3 pr-4">
                        <p className="text-sm mb-2" style={{ color: theme.colors.textMuted }}>{fs.summary}</p>
                        {fs.key_points.length > 0 && (
                          <ul className="space-y-1">
                            {fs.key_points.map((p, i) => (
                              <li key={i} className="text-xs flex items-start gap-2" style={{ color: theme.colors.textDark }}>
                                <span className="mt-1 w-1 h-1 rounded-full shrink-0" style={{ backgroundColor: theme.colors.accent }} />
                                {p}
                              </li>
                            ))}
                          </ul>
                        )}
                      </div>
                    </details>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      )}

      {editing && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setEditing(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>تعديل المادة</h2>
            <div className="space-y-4">
              <input placeholder="اسم المادة" value={editForm.name || ''} onChange={(e) => setEditForm({ ...editForm, name: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="رمز المادة" value={editForm.code || ''} onChange={(e) => setEditForm({ ...editForm, code: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <input placeholder="الدكتور" value={editForm.instructor || ''} onChange={(e) => setEditForm({ ...editForm, instructor: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <input placeholder="اليوم" value={editForm.schedule_day || ''} onChange={(e) => setEditForm({ ...editForm, schedule_day: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <input placeholder="الوقت" value={editForm.schedule_time || ''} onChange={(e) => setEditForm({ ...editForm, schedule_time: e.target.value })}
                  className="px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
              </div>
              <textarea placeholder="ملاحظات" value={editForm.notes || ''} onChange={(e) => setEditForm({ ...editForm, notes: e.target.value })}
                className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} rows={3} />
            </div>
            <div className="flex gap-3 mt-6">
              <button onClick={() => setEditing(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
              <button onClick={handleSaveEdit} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>حفظ</button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
