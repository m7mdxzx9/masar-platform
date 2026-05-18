import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { Sparkles, MessageSquare, Layers, Copy, Check, Loader2, FileText, BookOpen } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useStudyStore } from '@/stores/studyStore'

const FORMATS = [
  { id: 'bullet', label: 'نقاط' },
  { id: 'paragraph', label: 'فقرة' },
  { id: 'key_points', label: 'نقاط رئيسية' },
]

export default function StudyAssistantPage() {
  const { theme } = useTheme()
  const { content, summary, answer, guide, flashcards, isLoading, error, setContent, summarize, askQuestion, generateGuide, generateFlashcards, reset } = useStudyStore()
  const [tab, setTab] = useState<'summarize' | 'ask' | 'flashcards'>('summarize')
  const [format, setFormat] = useState('bullet')
  const [question, setQuestion] = useState('')
  const [flashCount, setFlashCount] = useState(5)
  const [copied, setCopied] = useState(false)
  const [flippedIdx, setFlippedIdx] = useState<number | null>(null)
  const textareaRef = useRef<HTMLTextAreaElement>(null)

  useEffect(() => {
    reset()
  }, [tab])

  const handlePaste = async () => {
    const text = await navigator.clipboard.readText()
    setContent(text)
  }

  const handleCopy = async (text: string) => {
    await navigator.clipboard.writeText(text)
    setCopied(true)
    setTimeout(() => setCopied(false), 2000)
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <Sparkles size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>مساعد الدراسة</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>تلخيص، أسئلة، وبطاقات تعليمية</p>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 mb-6">
        {[
          { id: 'summarize', label: 'تلخيص', icon: FileText },
          { id: 'ask', label: 'أسئلة', icon: MessageSquare },
          { id: 'flashcards', label: 'بطاقات تعليمية', icon: Layers },
        ].map((t) => {
          const Icon = t.icon
          const isActive = tab === t.id
          return (
            <button key={t.id} onClick={() => setTab(t.id as any)}
              className={`flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm transition-all ${isActive ? 'text-white shadow-lg' : ''}`}
              style={{
                background: isActive ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
                color: isActive ? '#fff' : theme.colors.textMuted,
                border: isActive ? 'none' : `1px solid ${theme.colors.border}`,
              }}>
              <Icon size={16} />{t.label}
            </button>
          )
        })}
      </div>

      {/* Content Input (shared) */}
      {tab !== 'ask' && (
        <div className="mb-6">
          <div className="flex items-center justify-between mb-2">
            <p className="text-sm font-bold" style={{ color: theme.colors.text }}>المحتوى الدراسي</p>
            <button onClick={handlePaste} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-white/10"
              style={{ color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
              لصق
            </button>
          </div>
          <textarea ref={textareaRef} value={content} onChange={(e) => setContent(e.target.value)}
            placeholder="ألصق أو اكتب المحتوى الدراسي هنا..."
            className="w-full p-5 rounded-2xl text-sm outline-none resize-none"
            style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text, minHeight: '160px' }} />
        </div>
      )}

      {/* Tab Content */}
      {tab === 'summarize' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>الصيغة:</span>
            {FORMATS.map((f) => (
              <button key={f.id} onClick={() => setFormat(f.id)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${format === f.id ? 'text-white' : ''}`}
                style={{
                  background: format === f.id ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)',
                  color: format === f.id ? '#fff' : theme.colors.textMuted,
                }}>
                {f.label}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => summarize(format)} disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Sparkles size={16} />}
              لخص
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>
              {error}
            </div>
          )}

          {summary && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
              className="rounded-2xl p-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center justify-between mb-4">
                <h3 className="font-bold text-lg" style={{ color: theme.colors.text }}>الملخص</h3>
                <div className="flex items-center gap-2 text-xs" style={{ color: theme.colors.textDark }}>
                  <span>المحتوى: {summary.original_length} حرف</span>
                  <span>•</span>
                  <span>الملخص: {summary.summary_length} حرف</span>
                </div>
              </div>
              <p className="text-sm leading-relaxed mb-4 whitespace-pre-wrap" style={{ color: theme.colors.textMuted }}>{summary.summary}</p>
              {summary.key_points.length > 0 && (
                <div className="mt-4 pt-4" style={{ borderTop: `1px solid ${theme.colors.border}` }}>
                  <p className="font-bold text-sm mb-2" style={{ color: theme.colors.text }}>النقاط الرئيسية</p>
                  <ul className="space-y-1">
                    {summary.key_points.map((p, i) => (
                      <li key={i} className="text-sm flex items-start gap-2" style={{ color: theme.colors.textMuted }}>
                        <span className="mt-1 w-1.5 h-1.5 rounded-full shrink-0" style={{ backgroundColor: theme.colors.accent }} />
                        {p}
                      </li>
                    ))}
                  </ul>
                </div>
              )}
              <button onClick={() => handleCopy(summary.summary)}
                className="mt-4 flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all hover:bg-white/10"
                style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                {copied ? <Check size={14} style={{ color: theme.colors.success }} /> : <Copy size={14} />}
                {copied ? 'تم النسخ' : 'نسخ'}
              </button>
            </motion.div>
          )}
        </div>
      )}

      {tab === 'ask' && (
        <div>
          <div className="mb-6">
            <div className="flex items-center justify-between mb-2">
              <p className="text-sm font-bold" style={{ color: theme.colors.text }}>المحتوى الدراسي</p>
              <button onClick={handlePaste} className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-white/10"
                style={{ color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
                لصق
              </button>
            </div>
            <textarea value={content} onChange={(e) => setContent(e.target.value)}
              placeholder="ألصق المحتوى الذي تريد السؤال عنه..."
              className="w-full p-5 rounded-2xl text-sm outline-none resize-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text, minHeight: '120px' }} />
          </div>

          <div className="flex gap-3">
            <input value={question} onChange={(e) => setQuestion(e.target.value)}
              onKeyDown={(e) => { if (e.key === 'Enter') askQuestion(question) }}
              placeholder="اكتب سؤالك هنا..."
              className="flex-1 px-5 py-3 rounded-2xl text-sm outline-none"
              style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
            <button onClick={() => askQuestion(question)} disabled={isLoading || !content.trim() || !question.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <MessageSquare size={16} />}
              اسأل
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
            </div>
          )}

          {error && (
            <div className="mt-4 p-4 rounded-xl" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>
              {error}
            </div>
          )}

          {answer && (
            <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} className="mt-6 rounded-2xl p-6"
              style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
              <div className="flex items-center justify-between mb-3">
                <p className="font-bold text-sm" style={{ color: theme.colors.text }}>الإجابة</p>
                <button onClick={() => handleCopy(answer)} className="p-2 rounded-lg hover:bg-white/10" style={{ color: theme.colors.textMuted }}>
                  <Copy size={14} />
                </button>
              </div>
              <p className="text-sm leading-relaxed whitespace-pre-wrap" style={{ color: theme.colors.textMuted }}>{answer}</p>
            </motion.div>
          )}
        </div>
      )}

      {tab === 'flashcards' && (
        <div>
          <div className="flex items-center gap-3 mb-4">
            <span className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>عدد البطاقات:</span>
            {[3, 5, 10].map((n) => (
              <button key={n} onClick={() => setFlashCount(n)}
                className={`px-4 py-2 rounded-xl text-xs font-bold transition-all ${flashCount === n ? 'text-white' : ''}`}
                style={{
                  background: flashCount === n ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)',
                  color: flashCount === n ? '#fff' : theme.colors.textMuted,
                }}>
                {n}
              </button>
            ))}
            <div className="flex-1" />
            <button onClick={() => generateFlashcards(flashCount)} disabled={isLoading || !content.trim()}
              className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 disabled:opacity-50 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {isLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Layers size={16} />}
              أنشئ البطاقات
            </button>
          </div>

          {isLoading && (
            <div className="flex items-center justify-center py-16">
              <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
            </div>
          )}

          {error && (
            <div className="p-4 rounded-xl" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>
              {error}
            </div>
          )}

          {flashcards.length > 0 && (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {flashcards.map((card, idx) => (
                <motion.div key={idx} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.05 }}
                  onClick={() => setFlippedIdx(flippedIdx === idx ? null : idx)}
                  className="rounded-2xl p-6 cursor-pointer transition-all hover:scale-[1.02] min-h-[160px] flex flex-col justify-center"
                  style={{
                    backgroundColor: flippedIdx === idx ? `${theme.colors.accent}15` : theme.colors.surface,
                    border: `1px solid ${flippedIdx === idx ? theme.colors.accent : theme.colors.border}`,
                    transform: flippedIdx === idx ? 'rotateY(180deg)' : '',
                    transformStyle: 'preserve-3d',
                  }}>
                  {flippedIdx === idx ? (
                    <div className="text-center">
                      <p className="text-xs font-bold mb-2" style={{ color: theme.colors.accent }}>الإجابة</p>
                      <p className="text-sm" style={{ color: theme.colors.text }}>{card.back}</p>
                    </div>
                  ) : (
                    <div className="text-center">
                      <p className="text-xs font-bold mb-2" style={{ color: theme.colors.textDark }}>السؤال {idx + 1}</p>
                      <p className="text-sm font-bold" style={{ color: theme.colors.text }}>{card.front}</p>
                      <p className="text-xs mt-4" style={{ color: theme.colors.textMuted }}>اضغط للكشف عن الإجابة</p>
                    </div>
                  )}
                </motion.div>
              ))}
            </div>
          )}

          {flashcards.length === 0 && !isLoading && !error && (
            <div className="flex flex-col items-center justify-center py-20 opacity-50">
              <Layers size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
              <p className="text-xl font-bold" style={{ color: theme.colors.text }}>بطاقات تعليمية</p>
              <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>ألصق محتوى دراسي واضغط على "أنشئ البطاقات"</p>
            </div>
          )}
        </div>
      )}
    </div>
  )
}
