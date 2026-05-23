import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { StickyNote, Mic, Plus, Search, Play, Square, Trash2, Edit3, Save, Loader2, Clock, Headphones, FileText, Check, Sparkles, X } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useNotesStore } from '@/stores/notesStore'
import { useStudyStore } from '@/stores/studyStore'
import { notesAPI } from '@/services/api'

export default function NotesPage() {
  const { theme } = useTheme()
  const { notes, isLoading, error, fetchNotes, createNote, updateNote, deleteNote, uploadVoiceNote, setSearchQuery, searchQuery } = useNotesStore()
  const [tab, setTab] = useState<'text' | 'voice'>('text')
  const [showAdd, setShowAdd] = useState(false)
  const [newTitle, setNewTitle] = useState('')
  const [newContent, setNewContent] = useState('')
  const [creating, setCreating] = useState(false)
  const [editingId, setEditingId] = useState<number | null>(null)
  const [editTitle, setEditTitle] = useState('')
  const [editContent, setEditContent] = useState('')

  // Voice recording
  const [recording, setRecording] = useState(false)
  const [recordingTitle, setRecordingTitle] = useState('')
  const [audioBlob, setAudioBlob] = useState<Blob | null>(null)
  const [recordingDuration, setRecordingDuration] = useState(0)
  const [playingId, setPlayingId] = useState<number | null>(null)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const chunksRef = useRef<Blob[]>([])
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const audioRef = useRef<HTMLAudioElement | null>(null)
  const searchTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null)

  // Summarize
  const studyStore = useStudyStore()
  const [summarizingId, setSummarizingId] = useState<number | null>(null)
  const [summaryModal, setSummaryModal] = useState<{ title: string; summary: string; key_points: string[] } | null>(null)

  useEffect(() => {
    fetchNotes()
  }, [])

  const handleSearch = (q: string) => {
    setSearchQuery(q)
    if (searchTimerRef.current) clearTimeout(searchTimerRef.current)
    searchTimerRef.current = setTimeout(() => {
      fetchNotes(q || undefined)
    }, 400)
  }

  const handleCreateText = async () => {
    if (!newTitle.trim()) return
    setCreating(true)
    try {
      await createNote({ title: newTitle, content: newContent || undefined, type: 'text' })
      setNewTitle('')
      setNewContent('')
      setShowAdd(false)
    } finally {
      setCreating(false)
    }
  }

  const handleSaveEdit = async (id: number) => {
    await updateNote(id, { title: editTitle, content: editContent || undefined })
    setEditingId(null)
  }

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const recorder = new MediaRecorder(stream, { mimeType: 'audio/webm' })
      chunksRef.current = []
      setRecordingDuration(0)
      recorder.ondataavailable = (e) => { if (e.data.size > 0) chunksRef.current.push(e.data) }
      recorder.onstop = () => {
        const blob = new Blob(chunksRef.current, { type: 'audio/webm' })
        setAudioBlob(blob)
        stream.getTracks().forEach((t) => t.stop())
      }
      recorder.start(100)
      mediaRecorderRef.current = recorder
      setRecording(true)
      const start = Date.now()
      timerRef.current = setInterval(() => setRecordingDuration(Math.floor((Date.now() - start) / 1000)), 200)
    } catch { }
  }

  const stopRecording = () => {
    mediaRecorderRef.current?.stop()
    if (timerRef.current) clearInterval(timerRef.current)
    setRecording(false)
  }

  const uploadRecorded = async () => {
    if (!audioBlob || !recordingTitle.trim()) return
    const file = new File([audioBlob], `${recordingTitle}.webm`, { type: 'audio/webm' })
    await uploadVoiceNote(recordingTitle, file, recordingDuration)
    setAudioBlob(null)
    setRecordingTitle('')
    setRecordingDuration(0)
  }

  const togglePlay = (noteId: number) => {
    if (playingId === noteId) {
      audioRef.current?.pause()
      setPlayingId(null)
    } else {
      if (audioRef.current) { audioRef.current.pause(); audioRef.current = null }
      const audio = new Audio(notesAPI.audioUrl(noteId))
      audio.onended = () => setPlayingId(null)
      audio.play()
      audioRef.current = audio
      setPlayingId(noteId)
    }
  }

  const formatDuration = (sec: number | null) => {
    if (!sec) return '00:00'
    const m = Math.floor(sec / 60)
    const s = Math.floor(sec % 60)
    return `${String(m).padStart(2, '0')}:${String(s).padStart(2, '0')}`
  }

  const formatDate = (d: string | null) => {
    if (!d) return ''
    return new Date(d).toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  const textNotes = notes.filter((n) => n.type !== 'voice')
  const voiceNotes = notes.filter((n) => n.type === 'voice')

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <StickyNote size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>ملاحظاتي</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{notes.length} ملاحظة</p>
          </div>
        </div>
        <button onClick={() => setShowAdd(true)}
          className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-white transition-all hover:scale-105 shadow-lg"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <Plus size={20} />
          إضافة ملاحظة
        </button>
      </div>

      <div className="relative mb-6">
        <Search size={18} className="absolute right-4 top-1/2 -translate-y-1/2" style={{ color: theme.colors.textDark }} />
        <input value={searchQuery} onChange={(e) => handleSearch(e.target.value)} placeholder="ابحث في الملاحظات..."
          className="w-full px-12 py-4 rounded-2xl text-sm outline-none"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        <button onClick={() => setTab('text')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'text' ? 'text-white shadow-lg' : ''}`}
          style={{
            background: tab === 'text' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
            color: tab === 'text' ? '#fff' : theme.colors.textMuted,
            border: tab === 'text' ? 'none' : `1px solid ${theme.colors.border}`,
          }}>
          <FileText size={16} />ملاحظات كتابية
        </button>
        <button onClick={() => setTab('voice')}
          className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${tab === 'voice' ? 'text-white shadow-lg' : ''}`}
          style={{
            background: tab === 'voice' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
            color: tab === 'voice' ? '#fff' : theme.colors.textMuted,
            border: tab === 'voice' ? 'none' : `1px solid ${theme.colors.border}`,
          }}>
          <Headphones size={16} />ملاحظات صوتية
        </button>
      </div>

      {isLoading && notes.length === 0 ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} /></div>
      ) : error ? (
        <div className="flex items-center justify-center py-20"><p className="text-lg" style={{ color: theme.colors.error }}>{error}</p></div>
      ) : tab === 'text' && textNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <StickyNote size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>لا توجد ملاحظات كتابية</p>
        </div>
      ) : tab === 'voice' && voiceNotes.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <Mic size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>لا توجد ملاحظات صوتية</p>
        </div>
      ) : (
        <div className="space-y-3">
          {(tab === 'text' ? textNotes : voiceNotes).map((note, idx) => (
            <motion.div key={note.id} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              {editingId === note.id ? (
                <div className="space-y-3">
                  <input value={editTitle} onChange={(e) => setEditTitle(e.target.value)}
                    className="w-full px-4 py-2 rounded-xl text-sm outline-none font-bold"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                  <textarea value={editContent} onChange={(e) => setEditContent(e.target.value)} rows={3}
                    className="w-full px-4 py-2 rounded-xl text-sm outline-none resize-none"
                    style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.textMuted }} />
                  <div className="flex gap-2">
                    <button onClick={() => handleSaveEdit(note.id)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.success }}><Check size={16} /></button>
                    <button onClick={() => setEditingId(null)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}><X size={16} /></button>
                  </div>
                </div>
              ) : note.type === 'voice' ? (
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-3">
                      <button onClick={() => togglePlay(note.id)} className="p-3 rounded-xl transition-all hover:scale-110"
                        style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>
                        {playingId === note.id ? <Square size={16} /> : <Play size={16} fill="currentColor" />}
                      </button>
                      <div>
                        <p className="font-bold text-sm" style={{ color: theme.colors.text }}>{note.title}</p>
                        <p className="text-xs" style={{ color: theme.colors.textDark }}>
                          <Clock size={12} className="inline ml-1" />{formatDuration(note.duration)}
                        </p>
                      </div>
                    </div>
                    <div className="flex gap-1">
                      <button onClick={async () => { setSummarizingId(note.id); try { const r = await studyStore.summarizeNote(note.id); setSummaryModal({ title: note.title, summary: r.summary, key_points: r.key_points }) } finally { setSummarizingId(null) } }}
                        className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.accent }}>
                        {summarizingId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      </button>
                      <button onClick={() => deleteNote(note.id)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textDark }}>
                        <Trash2 size={16} />
                      </button>
                    </div>
                  </div>
                  <p className="text-xs" style={{ color: theme.colors.textDark }}>{formatDate(note.created_at)}</p>
                </div>
              ) : (
                <div>
                  <div className="flex items-start justify-between gap-2">
                    <div className="min-w-0 flex-1">
                      <p className="font-bold text-sm mb-1" style={{ color: theme.colors.text }}>{note.title}</p>
                      {note.content && <p className="text-sm line-clamp-2" style={{ color: theme.colors.textMuted }}>{note.content}</p>}
                      <p className="text-xs mt-2" style={{ color: theme.colors.textDark }}>{formatDate(note.created_at)}</p>
                    </div>
                    <div className="flex gap-1 shrink-0">
                      <button onClick={async () => { setSummarizingId(note.id); try { const r = await studyStore.summarizeNote(note.id); setSummaryModal({ title: note.title, summary: r.summary, key_points: r.key_points }) } finally { setSummarizingId(null) } }}
                        className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.accent }}>
                        {summarizingId === note.id ? <Loader2 size={14} className="animate-spin" /> : <Sparkles size={14} />}
                      </button>
                      <button onClick={() => { setEditingId(note.id); setEditTitle(note.title); setEditContent(note.content || '') }}
                        className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}><Edit3 size={14} /></button>
                      <button onClick={() => deleteNote(note.id)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.error }}><Trash2 size={14} /></button>
                    </div>
                  </div>
                </div>
              )}
            </motion.div>
          ))}
        </div>
      )}

      {/* Summary Modal */}
      {summaryModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setSummaryModal(null)}>
          <div className="w-full max-w-2xl mx-4 rounded-2xl p-8 shadow-2xl max-h-[80vh] overflow-y-auto" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between mb-4">
              <h2 className="text-xl font-bold" style={{ color: theme.colors.text }}>تلخيص: {summaryModal.title}</h2>
              <button onClick={() => setSummaryModal(null)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
                <X size={18} />
              </button>
            </div>
            <div className="p-5 rounded-xl mb-4" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}` }}>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.colors.textMuted }}>{summaryModal.summary}</p>
            </div>
            {summaryModal.key_points.length > 0 && (
              <div>
                <p className="font-bold text-sm mb-2" style={{ color: theme.colors.text }}>النقاط الرئيسية</p>
                <ul className="space-y-1">
                  {summaryModal.key_points.map((p, i) => (
                    <li key={i} className="text-sm flex items-start gap-2" style={{ color: theme.colors.textMuted }}>
                      <span className="mt-1.5 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.accent }} />
                      {p}
                    </li>
                  ))}
                </ul>
              </div>
            )}
          </div>
        </div>
      )}

      {/* Add Note Modal */}
      {showAdd && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowAdd(false)}>
          <div className="w-full max-w-lg mx-4 rounded-2xl p-8 shadow-2xl" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }} onClick={(e) => e.stopPropagation()}>
            <h2 className="text-2xl font-bold mb-6" style={{ color: theme.colors.text }}>ملاحظة جديدة</h2>

            <div className="flex gap-2 mb-6">
              <button onClick={() => setTab('text')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'text' ? 'text-white' : ''}`}
                style={{ background: tab === 'text' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)', color: tab === 'text' ? '#fff' : theme.colors.textMuted }}>
                <FileText size={16} className="inline ml-2" />نصية
              </button>
              <button onClick={() => setTab('voice')}
                className={`flex-1 py-3 rounded-xl text-sm font-bold transition-all ${tab === 'voice' ? 'text-white' : ''}`}
                style={{ background: tab === 'voice' ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)', color: tab === 'voice' ? '#fff' : theme.colors.textMuted }}>
                <Mic size={16} className="inline ml-2" />صوتية
              </button>
            </div>

            {tab === 'text' ? (
              <div className="space-y-4">
                <input placeholder="عنوان الملاحظة *" value={newTitle} onChange={(e) => setNewTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <textarea placeholder="محتوى الملاحظة" value={newContent} onChange={(e) => setNewContent(e.target.value)} rows={5}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none resize-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                <div className="flex gap-3">
                  <button onClick={() => setShowAdd(false)} className="flex-1 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                    style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
                  <button onClick={handleCreateText} disabled={!newTitle.trim() || creating}
                    className="flex-1 px-4 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50"
                    style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                    {creating ? <Loader2 className="w-5 h-5 animate-spin mx-auto" /> : 'إضافة'}
                  </button>
                </div>
              </div>
            ) : (
              <div className="space-y-4">
                <input placeholder="عنوان التسجيل *" value={recordingTitle} onChange={(e) => setRecordingTitle(e.target.value)}
                  className="w-full px-4 py-3 rounded-xl text-sm outline-none"
                  style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
                {audioBlob ? (
                  <div className="p-4 rounded-xl text-center" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                    <p className="text-sm mb-3" style={{ color: theme.colors.success }}>تم التسجيل ({formatDuration(recordingDuration)})</p>
                    <audio src={URL.createObjectURL(audioBlob)} controls className="w-full mb-3" />
                    <div className="flex gap-3">
                      <button onClick={() => { setAudioBlob(null); setRecordingDuration(0) }}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-bold" style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إعادة</button>
                      <button onClick={uploadRecorded} disabled={!recordingTitle.trim()}
                        className="flex-1 px-4 py-2 rounded-xl text-sm font-bold text-white disabled:opacity-50"
                        style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>حفظ</button>
                    </div>
                  </div>
                ) : recording ? (
                  <div className="p-8 rounded-xl text-center" style={{ backgroundColor: `${theme.colors.error}10` }}>
                    <div className="w-16 h-16 rounded-full mx-auto mb-4 flex items-center justify-center animate-pulse" style={{ backgroundColor: theme.colors.error }}>
                      <Mic size={28} className="text-white" />
                    </div>
                    <p className="text-lg font-bold mb-2" style={{ color: theme.colors.error }}>تسجيل...</p>
                    <p className="text-2xl font-mono mb-4" style={{ color: theme.colors.text }}>{formatDuration(recordingDuration)}</p>
                    <button onClick={stopRecording} className="px-8 py-3 rounded-xl font-bold text-white"
                      style={{ backgroundColor: theme.colors.error }}>
                      <Square size={16} className="inline ml-2" />إيقاف
                    </button>
                  </div>
                ) : (
                  <button onClick={startRecording}
                    className="w-full py-8 rounded-xl text-center transition-all hover:scale-105"
                    style={{ border: `2px dashed ${theme.colors.border}`, color: theme.colors.textMuted }}>
                    <Mic size={40} className="mx-auto mb-3" />
                    <p className="font-bold">اضغط لبدء التسجيل</p>
                  </button>
                )}
                <button onClick={() => setShowAdd(false)} className="w-full px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-white/5"
                  style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>إلغاء</button>
              </div>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
