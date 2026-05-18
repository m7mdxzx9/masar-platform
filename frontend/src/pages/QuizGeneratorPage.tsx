import { useState, useEffect, useRef } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { Sparkles, ClipboardList, HelpCircle, CheckCircle, XCircle, ChevronRight, ChevronLeft, RotateCcw, BarChart3, Clock, Loader2 } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useQuizStore } from '@/stores/quizStore'

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
    isLoading, error, timeLeft, isFinished,
    setTopic, setDifficulty, setQuestionCount, generateQuiz,
    answerQuestion, nextQuestion, prevQuestion, finishQuiz, reset,
  } = useQuizStore()
  const timerRef = useRef<ReturnType<typeof setInterval> | null>(null)

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
      <div className="flex items-center gap-4 mb-8">
        <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
          <ClipboardList size={24} className="text-white" />
        </div>
        <div>
          <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>وكيل توليد الاختبارات</h1>
          <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>أنشئ اختبارات تفاعلية في أي موضوع</p>
        </div>
      </div>

      {questions.length === 0 && !isLoading && !isFinished ? (
        <motion.div initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }}
          className="max-w-2xl mx-auto rounded-2xl p-8" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
          <div className="space-y-5">
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>الموضوع</label>
              <input value={topic} onChange={(e) => setTopic(e.target.value)}
                placeholder="مثال: الرياضيات - التفاضل والتكامل"
                className="w-full px-5 py-4 rounded-2xl text-sm outline-none"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.border}`, color: theme.colors.text }} />
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>المستوى</label>
              <div className="flex gap-3">
                {DIFFICULTIES.map((d) => (
                  <button key={d.id} onClick={() => setDifficulty(d.id)}
                    className={`flex-1 px-5 py-3 rounded-xl text-sm font-bold transition-all ${difficulty === d.id ? 'text-white shadow-lg' : ''}`}
                    style={{
                      background: difficulty === d.id ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
                      color: difficulty === d.id ? '#fff' : theme.colors.textMuted,
                      border: difficulty === d.id ? 'none' : `1px solid ${theme.colors.border}`,
                    }}>
                    {d.label}
                  </button>
                ))}
              </div>
            </div>
            <div>
              <label className="block text-sm font-bold mb-2" style={{ color: theme.colors.text }}>عدد الأسئلة</label>
              <div className="flex gap-3">
                {[3, 5, 10, 15].map((n) => (
                  <button key={n} onClick={() => setQuestionCount(n)}
                    className={`px-6 py-3 rounded-xl text-sm font-bold transition-all ${questionCount === n ? 'text-white shadow-lg' : ''}`}
                    style={{
                      background: questionCount === n ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
                      color: questionCount === n ? '#fff' : theme.colors.textMuted,
                      border: questionCount === n ? 'none' : `1px solid ${theme.colors.border}`,
                    }}>
                    {n}
                  </button>
                ))}
              </div>
            </div>
            <button onClick={generateQuiz} disabled={!topic.trim() || isLoading}
              className="w-full flex items-center justify-center gap-3 px-6 py-4 rounded-2xl font-bold text-white text-lg transition-all hover:scale-[1.02] disabled:opacity-50 shadow-lg mt-4"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {isLoading ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles size={20} />}
              {isLoading ? 'جارٍ الإنشاء...' : 'أنشئ الاختبار'}
            </button>
          </div>
          {error && (
            <div className="mt-4 p-4 rounded-xl text-sm" style={{ backgroundColor: `${theme.colors.error}15`, color: theme.colors.error, border: `1px solid ${theme.colors.error}30` }}>
              {error}
            </div>
          )}
        </motion.div>
      ) : isLoading ? (
        <div className="flex items-center justify-center py-20">
          <Loader2 className="w-10 h-10 animate-spin" style={{ color: theme.colors.accent }} />
        </div>
      ) : isFinished ? (
        <motion.div initial={{ opacity: 0, scale: 0.95 }} animate={{ opacity: 1, scale: 1 }}
          className="max-w-2xl mx-auto">
          <div className="text-center rounded-2xl p-8 mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
            <div className="w-20 h-20 rounded-full mx-auto mb-4 flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <BarChart3 size={36} className="text-white" />
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: theme.colors.text }}>النتيجة</h2>
            <p className="text-5xl font-bold mb-2" style={{ color: theme.colors.accent }}>{score}/{questions.length}</p>
            <p className="text-sm" style={{ color: theme.colors.textMuted }}>
              {score === questions.length ? 'إجابة صحيحة! 🎉' : `نسبة ${questions.length > 0 ? Math.round((score / questions.length) * 100) : 0}%`}
            </p>
            <button onClick={reset} className="mt-6 flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white mx-auto transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <RotateCcw size={16} />اختبار جديد
            </button>
          </div>
          <div className="space-y-4">
            {questions.map((q, idx) => {
              const isCorrect = answers[idx] === q.correct?.trim()
              return (
                <div key={idx} className="rounded-2xl p-5" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${isCorrect ? theme.colors.success + '30' : theme.colors.error + '30'}` }}>
                  <div className="flex items-start gap-3 mb-3">
                    <span className="mt-0.5">{isCorrect ? <CheckCircle size={18} style={{ color: theme.colors.success }} /> : <XCircle size={18} style={{ color: theme.colors.error }} />}</span>
                    <div>
                      <p className="font-bold text-sm" style={{ color: theme.colors.text }}>{q.question}</p>
                      <p className="text-xs mt-1" style={{ color: theme.colors.textMuted }}>
                        إجابتك: <span style={{ color: isCorrect ? theme.colors.success : theme.colors.error }}>{answers[idx] || 'لم تجب'}</span>
                        {!isCorrect && <> • الإجابة الصحيحة: <span style={{ color: theme.colors.success }}>{q.correct}</span></>}
                      </p>
                      {q.explanation && (
                        <p className="text-xs mt-2" style={{ color: theme.colors.textDark }}>{q.explanation}</p>
                      )}
                    </div>
                  </div>
                </div>
              )
            })}
          </div>
        </motion.div>
      ) : (
        <div className="max-w-3xl mx-auto">
          {/* Header */}
          <div className="flex items-center justify-between mb-6">
            <div className="flex items-center gap-3">
              <span className="flex items-center gap-1.5 text-sm font-bold" style={{ color: theme.colors.accent }}>
                <Clock size={16} />{formatTime(timeLeft)}
              </span>
              <span className="text-sm" style={{ color: theme.colors.textDark }}>
                {currentIndex + 1} / {questions.length}
              </span>
            </div>
            <div className="flex gap-2">
              {questions.map((_, idx) => (
                <div key={idx} className="w-3 h-3 rounded-full transition-all" style={{
                  backgroundColor: answers[idx] ? theme.colors.accent : idx === currentIndex ? theme.colors.textMuted : theme.colors.border,
                  transform: idx === currentIndex ? 'scale(1.3)' : 'scale(1)',
                }} />
              ))}
            </div>
          </div>

          {/* Progress bar */}
          <div className="w-full h-1.5 rounded-full mb-6 overflow-hidden" style={{ backgroundColor: theme.colors.border }}>
            <div className="h-full rounded-full transition-all duration-500" style={{ width: `${((currentIndex + 1) / questions.length) * 100}%`, background: `linear-gradient(to left, ${theme.colors.secondary}, ${theme.colors.accent})` }} />
          </div>

          <AnimatePresence mode="wait">
            <motion.div key={currentIndex} initial={{ opacity: 0, x: 50 }} animate={{ opacity: 1, x: 0 }} exit={{ opacity: 0, x: -50 }} transition={{ duration: 0.2 }}>
              <div className="rounded-2xl p-8 mb-6" style={{ backgroundColor: theme.colors.surface, border: `1px solid ${theme.colors.border}` }}>
                <div className="flex items-start gap-3 mb-6">
                  <div className="w-8 h-8 rounded-xl flex items-center justify-center text-sm font-bold text-white shrink-0" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                    {currentIndex + 1}
                  </div>
                  <p className="text-lg font-bold leading-relaxed" style={{ color: theme.colors.text }}>{questions[currentIndex]?.question}</p>
                </div>
                <div className="space-y-3">
                  {questions[currentIndex]?.options.map((opt, oi) => (
                    <button key={oi} onClick={() => answerQuestion(LABELS[oi])}
                      className={`w-full flex items-center gap-4 p-4 rounded-2xl text-sm font-medium text-right transition-all ${answers[currentIndex] === LABELS[oi] ? 'text-white shadow-lg' : 'hover:bg-white/5'}`}
                      style={{
                        background: answers[currentIndex] === LABELS[oi] ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.03)',
                        color: answers[currentIndex] === LABELS[oi] ? '#fff' : theme.colors.textMuted,
                        border: `1px solid ${answers[currentIndex] === LABELS[oi] ? 'transparent' : theme.colors.border}`,
                      }}>
                      <span className="w-8 h-8 rounded-lg flex items-center justify-center text-xs font-bold" style={{
                        backgroundColor: answers[currentIndex] === LABELS[oi] ? 'rgba(255,255,255,0.2)' : theme.colors.border,
                      }}>
                        {LABELS[oi]}
                      </span>
                      {opt}
                    </button>
                  ))}
                </div>
              </div>
            </motion.div>
          </AnimatePresence>

          {/* Navigation */}
          <div className="flex items-center justify-between">
            <button onClick={prevQuestion} disabled={currentIndex === 0}
              className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5 disabled:opacity-30"
              style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
              <ChevronRight size={16} />السابق
            </button>
            {currentIndex === questions.length - 1 ? (
              <button onClick={finishQuiz}
                className="flex items-center gap-2 px-6 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-lg"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                إنهاء الاختبار
              </button>
            ) : (
              <button onClick={nextQuestion}
                className="flex items-center gap-2 px-5 py-3 rounded-xl text-sm font-bold transition-all hover:bg-white/5"
                style={{ color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
                التالي<ChevronLeft size={16} />
              </button>
            )}
          </div>
        </div>
      )}
    </div>
  )
}
