import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ClipboardList, HelpCircle, CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw, BarChart3, Clock, Loader2, AlertCircle, FileText } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useQuizStore } from '@/stores/quizStore'
import { studyAPI } from '@/services/api'

const DIFFICULTIES = [
  { id: 'easy', label: 'سهل' },
  { id: 'medium', label: 'متوسط' },
  { id: 'hard', label: 'صعب' },
]

const LABELS = ['أ', 'ب', 'ج', 'د']

export default function QuizGeneratorPage() {
  const { theme } = useTheme()
  const {
    topic, difficulty, questionCount, questions, currentIndex, answers,
    isLoading, error, timeLeft, isFinished, fileContent,
    setTopic, setDifficulty, setQuestionCount, setFileContent, generateQuiz,
    answerQuestion, nextQuestion, prevQuestion, finishQuiz, reset,
  } = useQuizStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)
  const [uploading, setUploading] = useState(false)

  const handleFileUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (!file) return
    setUploading(true)
    try {
      const response = await studyAPI.extractText(file)
      if (response.data?.text) {
        setFileContent(response.data.text)
        setTopic(file.name)
      }
    } catch (err: any) {
      console.error(err)
      alert("فشل استخراج النص من الملف. تأكد من أن الملف غير محمي ويحتوي على نص قابل للقراءة.")
    } finally {
      setUploading(false)
    }
  }

  const handleClearFile = () => {
    setFileContent('')
    setTopic('')
  }

  useEffect(() => {
    if (timeLeft > 0 && !isFinished) {
      timerRef.current = setInterval(() => {
        const { timeLeft: tl, isFinished: fin } = useQuizStore.getState()
        if (tl <= 1 || fin) {
          if (timerRef.current) clearInterval(timerRef.current)
          if (tl <= 1) finishQuiz()
        } else {
          useQuizStore.setState({ timeLeft: tl - 1 })
        }
      }, 1000)
    }
    return () => { if (timerRef.current) clearInterval(timerRef.current) }
  }, [timeLeft, isFinished])

  const score = answers.filter((a, i) => a === questions[i]?.correct?.trim()).length
  const formatTime = (s: number) => `${Math.floor(s / 60)}:${String(s % 60).padStart(2, '0')}`

  return (
    <div className="h-full overflow-y-auto p-6" style={{ direction: 'rtl' }}>
      <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }}
        className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <ClipboardList size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>وكيل توليد الاختبارات</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>أنشئ اختبارات تفاعلية في أي موضوع</p>
        </div>
      </motion.div>

      {questions.length === 0 && !isLoading && !isFinished ? (
        <motion.div initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto rounded-2xl p-8 backdrop-blur-[20px] border shadow-lg"
          style={{ backgroundColor: theme.colors.surface + '70', borderColor: theme.colors.border }}>
          <div className="space-y-5">
            <div>
              <div className="flex items-center justify-between mb-2">
                <label className="block text-sm font-bold" style={{ color: theme.colors.text }}>الموضوع</label>
                {fileContent ? (
                  <button onClick={handleClearFile} className="text-xs px-2.5 py-1 rounded-lg font-medium text-red-400 hover:bg-red-500/10 border border-red-500/30">
                    حذف الملف المرفق
                  </button>
                ) : uploading ? (
                  <span className="text-xs flex items-center gap-1 font-medium animate-pulse" style={{ color: theme.colors.accent }}>
                    <Loader2 size={12} className="animate-spin" />
                    جاري التحميل...
                  </span>
                ) : (
                  <label className="text-xs px-2.5 py-1 rounded-lg font-medium cursor-pointer hover:bg-white/10 border flex items-center gap-1"
                    style={{ color: theme.colors.accent, borderColor: `${theme.colors.accent}40` }}>
                    <FileText size={12} />
                    أو رفع ملف (PDF/TXT)
                    <input type="file" accept=".pdf,.txt" className="hidden" onChange={handleFileUpload} />
                  </label>
                )}
              </div>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                disabled={!!fileContent || uploading}
                placeholder={fileContent ? "تم تحميل محتوى الملف بنجاح" : "مثال: الرياضيات - التفاضل والتكامل"}
                className="w-full px-5 py-4 rounded-2xl text-sm outline-none border transition-all focus:ring-2 disabled:opacity-80"
                style={{ backgroundColor: theme.colors.bg + '50', borderColor: theme.colors.border, color: theme.colors.text }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>المستوى</label>
              <div className="flex gap-3">
                {DIFFICULTIES.map((d) => (
                  <motion.button key={d.id} onClick={() => setDifficulty(d.id)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-bold transition-all ${difficulty === d.id ? 'text-white shadow-lg' : ''}`}
                    style={{
                      background: difficulty === d.id ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : theme.colors.bg + '50',
                      color: difficulty === d.id ? '#fff' : theme.colors.textMuted,
                      border: difficulty === d.id ? 'none' : `1px solid ${theme.colors.border}`,
                    }}>
                    {d.label}
                  </motion.button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>عدد الأسئلة</label>
              <div className="flex gap-3">
                {[3, 5, 10, 15].map((n) => (
                  <motion.button key={n} onClick={() => setQuestionCount(n)}
                    whileHover={{ scale: 1.03 }}
                    whileTap={{ scale: 0.97 }}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${questionCount === n ? 'text-white shadow-lg' : ''}`}
                    style={{
                      background: questionCount === n ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : theme.colors.bg + '50',
                      color: questionCount === n ? '#fff' : theme.colors.textMuted,
                      border: questionCount === n ? 'none' : `1px solid ${theme.colors.border}`,
                    }}>
                    {n}
                  </motion.button>
                ))}
              </div>
            </div>
            <motion.button onClick={generateQuiz} disabled={!topic.trim() || isLoading}
              whileHover={{ scale: 1.02 }}
              whileTap={{ scale: 0.98 }}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white text-lg transition-all disabled:opacity-50 shadow-lg mt-4"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={20} />}
              {isLoading ? 'جارٍ الإنشاء...' : 'أنشئ الاختبار'}
            </motion.button>
          </div>
          <AnimatePresence>
            {error && (
              <motion.div initial={{ opacity: 0, y: -8 }} animate={{ opacity: 1, y: 0 }} exit={{ opacity: 0, y: -8 }}
                className="mt-4 p-4 rounded-xl text-sm flex items-center gap-2 border"
                style={{ backgroundColor: `${theme.colors.error}12`, color: theme.colors.error, borderColor: `${theme.colors.error}25` }}>
                <AlertCircle size={16} className="shrink-0" />
                {error}
              </motion.div>
            )}
          </AnimatePresence>
        </motion.div>
      ) : isLoading ? (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}
          className="flex items-center justify-center py-20">
          <div className="flex flex-col items-center gap-4 p-12 rounded-2xl backdrop-blur-[20px] border shadow-lg"
            style={{ backgroundColor: theme.colors.surface + '60', borderColor: theme.colors.border }}>
            <Loader2 className="w-10 h-10 animate-spin" style={{ color: theme.colors.accent }} />
            <p className="text-sm font-bold" style={{ color: theme.colors.textMuted }}>جارٍ إنشاء الاختبار...</p>
          </div>
        </motion.div>
      ) : isFinished ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto">
          <motion.div initial={{ y: 20, opacity: 0 }} animate={{ y: 0, opacity: 1 }}
            className="text-center rounded-2xl p-8 mb-6 backdrop-blur-[20px] border shadow-lg"
            style={{ backgroundColor: theme.colors.surface + '70', borderColor: theme.colors.border }}>
            <motion.div initial={{ scale: 0 }} animate={{ scale: 1 }} transition={{ type: 'spring', stiffness: 200, damping: 15 }}
              className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <BarChart3 size={36} className="text-white" />
            </motion.div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>النتيجة</h2>
            <p className="text-5xl font-bold mb-2" style={{ color: theme.colors.accent }}>{score}/{questions.length}</p>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {score === questions.length ? 'إجابة صحيحة! 🎉' : `نسبة ${questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%`}
            </p>
            <motion.button onClick={reset} whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}
              className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white mx-auto transition-all shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <RotateCcw size={16} />اختبار جديد
            </motion.button>
          </motion.div>
          <motion.div initial="hidden" animate="visible" variants={{ hidden: {}, visible: { transition: { staggerChildren: 0.06 } } }} className="space-y-4">
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.correct?.trim()
              return (
                <motion.div key={idx}
                  variants={{ hidden: { opacity: 0, y: 16 }, visible: { opacity: 1, y: 0 } }}
                  className="rounded-2xl p-5 backdrop-blur-[20px] border transition-all hover:shadow-lg"
                  style={{ backgroundColor: theme.colors.surface + '60', borderColor: isCorrect ? theme.colors.success + '40' : theme.colors.error + '40' }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="mt-0.5 shrink-0">{isCorrect ? <CheckCircle size={18} style={{ color: theme.colors.success }} /> : <XCircle size={18} style={{ color: theme.colors.error }} />}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: theme.colors.text }}>{q.question}</p>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        إجابتك: <span style={{ color: isCorrect ? theme.colors.success : theme.colors.error }}>{answers[idx] || 'لم تجب'}</span>
                        {!isCorrect && <> • الإجابة الصحيحة: <span style={{ color: theme.colors.success }}>{q.correct}</span></>}
                      </p>
                      {q.explanation && (
                        <p className="text-xs mt-2" style={{ color: theme.colors.textMuted }}>{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </motion.div>
              )
            })}
          </motion.div>
        </motion.div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.colors.accent }}>
                <Clock size={16} />{formatTime(timeLeft)}
              </span>
              <span className="text-sm px-3 py-1 rounded-lg" style={{ color: theme.colors.textMuted, backgroundColor: theme.colors.bg + '50' }}>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex gap-1.5">
              {questions.map((_, idx) => (
                <motion.div
                  key={idx}
                  animate={{ scale: idx === currentIndex ? 1.4 : 1 }}
                  transition={{ type: 'spring', stiffness: 300 }}
                  className="rounded-full transition-all cursor-pointer"
                  style={{
                    width: idx === currentIndex ? '10px' : '8px',
                    height: idx === currentIndex ? '10px' : '8px',
                    backgroundColor: answers[idx] ? theme.colors.accent : idx === currentIndex ? theme.colors.text : theme.colors.border,
                    boxShadow: idx === currentIndex ? `0 0 8px ${theme.colors.accent}60` : 'none',
                  }}
                  onClick={() => {
                    if (idx < currentIndex) prevQuestion()
                    else if (idx > currentIndex) nextQuestion()
                  }}
                />
              ))}
            </div>
          </motion.div>

          {/* Progress bar */}
          <div className="w-full h-2 rounded-full mb-6 overflow-hidden backdrop-blur-[20px]" style={{ backgroundColor: theme.colors.border + '50' }}>
            <motion.div
              className="h-full rounded-full"
              initial={{ width: 0 }}
              animate={{ width: `${((currentIndex + 1) / questions.length) * 100}%` }}
              transition={{ duration: 0.4, ease: 'easeOut' }}
              style={{ background: `linear-gradient(to left, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }}>
              <div className="rounded-2xl p-8 mb-6 backdrop-blur-[20px] border shadow-lg"
                style={{ backgroundColor: theme.colors.surface + '70', borderColor: theme.colors.border }}>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                    {currentIndex + 1}
                  </div>
                  <p className="text-lg font-bold leading-relaxed" style={{ color: theme.colors.text }}>{questions[currentIndex]?.question}</p>
                </div>
                <div className="space-y-3">
                  {questions[currentIndex]?.options.map((opt, oi) => (
                    <motion.button
                      key={oi}
                      initial={{ opacity: 0, x: -20 }}
                      animate={{ opacity: 1, x: 0 }}
                      transition={{ delay: oi * 0.06 }}
                      onClick={() => answerQuestion(LABELS[oi])}
                      whileHover={{ scale: 1.01 }}
                      whileTap={{ scale: 0.98 }}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-medium text-right transition-all ${answers[currentIndex] === LABELS[oi] ? 'text-white shadow-lg' : 'hover:bg-white/5'}`}
                      style={{
                        background: answers[currentIndex] === LABELS[oi] ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : theme.colors.bg + '40',
                        color: answers[currentIndex] === LABELS[oi] ? '#fff' : theme.colors.text,
                        border: `1px solid ${answers[currentIndex] === LABELS[oi] ? 'transparent' : theme.colors.border}`,
                      }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: answers[currentIndex] === LABELS[oi] ? 'rgba(255,255,255,0.2)' : theme.colors.border,
                      }}>
                        {LABELS[oi]}
                      </span>
                      {opt}
                    </motion.button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <motion.button onClick={prevQuestion} disabled={currentIndex === 0}
              whileHover={{ scale: 1.03 }}
              whileTap={{ scale: 0.97 }}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5 disabled:opacity-30"
              style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.bg + '40' }}>
              <ChevronRight size={16} />السابق
            </motion.button>
            {currentIndex === questions.length - 1 ? (
              <motion.button onClick={finishQuiz}
                whileHover={{ scale: 1.05 }}
                whileTap={{ scale: 0.95 }}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                إنهاء الاختبار
              </motion.button>
            ) : (
              <motion.button onClick={nextQuestion}
                whileHover={{ scale: 1.03 }}
                whileTap={{ scale: 0.97 }}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                style={{ color: theme.colors.text, border: `1px solid ${theme.colors.border}`, backgroundColor: theme.colors.bg + '40' }}>
                التالي<ChevronLeft size={16} />
              </motion.button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
