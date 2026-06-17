import { useState } from 'react'
import { 
  BookOpen, 
  Code, 
  Play, 
  RotateCcw, 
  ChevronLeft, 
  AlertCircle, 
  Sparkles, 
  Send,
  Loader2,
  BookMarked,
  CheckCircle2,
  XCircle,
  HelpCircle,
  ArrowLeft,
  Youtube,
  GraduationCap,
  ExternalLink
} from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { lessonsData, Lesson } from '@/data/lessonsData'
import { usePyodide } from '@/hooks/usePyodide'
import { API_BASE_URL } from '@/services/api'

interface MCQQuestion {
  id: number
  question: string
  options: string[]
  correct_index: number
  explanation: string
}

interface BugFixHomework {
  description: string
  buggy_code: string
  target_output: string
}

export default function LessonsPage() {
  const { theme } = useTheme()
  const { runPython, isReady: pyodideReady } = usePyodide()
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessonsData[0])
  const [code, setCode] = useState<string>(lessonsData[0].defaultCode)
  const [output, setOutput] = useState<string>('')
  const [running, setRunning] = useState<boolean>(false)
  
  // Navigation tabs for the current lesson
  const [activeTab, setActiveTab] = useState<'lesson' | 'homework'>('lesson')
  
  // Homework states
  const [homeworkType, setHomeworkType] = useState<'mcq' | 'bug_fix'>('mcq')
  const [hwLoading, setHwLoading] = useState<boolean>(false)
  
  // Generated homework values
  const [mcqQuestions, setMcqQuestions] = useState<MCQQuestion[] | null>(null)
  const [bugFixData, setBugFixData] = useState<BugFixHomework | null>(null)
  
  // Student answers state
  const [selectedOptions, setSelectedOptions] = useState<Record<number, number>>({})
  const [graded, setGraded] = useState<boolean>(false)
  
  // Bug-fix grading state
  const [gradingResponse, setGradingResponse] = useState<{passed: boolean, feedback: string, corrected_code: string} | null>(null)
  const [gradingLoading, setGradingLoading] = useState<boolean>(false)

  // AI assistant panel state
  const [showAIAssistant, setShowAIAssistant] = useState<boolean>(false)
  const [messages, setMessages] = useState<Array<{role: 'user' | 'model', content: string}>>([
    { role: 'model', content: 'مرحباً! أنا مساعدك الذكي لمسار. يمكنني شرح الرياضيات أو الأكواد البرمجية في هذا الدرس ومساعدتك في حل التمارين.' }
  ])
  const [inputMessage, setInputMessage] = useState<string>('')
  const [aiLoading, setAiLoading] = useState<boolean>(false)

  // Handle code change on lesson select
  const handleSelectLesson = (lesson: Lesson) => {
    setSelectedLesson(lesson)
    setCode(lesson.defaultCode)
    setOutput('')
    setActiveTab('lesson')
    // Reset homework
    setMcqQuestions(null)
    setBugFixData(null)
    setSelectedOptions({})
    setGraded(false)
    setGradingResponse(null)
    // Reset AI chat
    setMessages([
      { 
        role: 'model', 
        content: `مرحباً! أنا مساعدك الذكي لمسار. كيف يمكنني مساعدتك في فهم درس "${lesson.title}"؟` 
      }
    ])
  }

  // Run python code via the local Pyodide interpreter
  const handleRunCode = async () => {
    try {
      setRunning(true)
      setOutput('جاري تشغيل الكود في بيئة Python المحلية...\n')
      
      const res = await runPython(code)
      if (res.error) {
        setOutput(res.error)
      } else {
        setOutput(res.output || 'لم يتم إرجاع أي مخرجات من الكود.')
      }
    } catch (err: any) {
      setOutput(`❌ خطأ أثناء تشغيل الكود: ${err.message}`)
    } finally {
      setRunning(false)
    }
  }

  // Reset code to default
  const handleResetCode = () => {
    setCode(selectedLesson.defaultCode)
    setOutput('')
  }

  // Generate dynamic homework via Gemini
  const handleGenerateHomework = async () => {
    try {
      setHwLoading(true)
      setGraded(false)
      setSelectedOptions({})
      setGradingResponse(null)
      setMcqQuestions(null)
      setBugFixData(null)

      const response = await fetch(`${API_BASE_URL}/labs/homework/generate`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          lesson_title: selectedLesson.title,
          lesson_category: selectedLesson.category,
          lesson_content: selectedLesson.content,
          default_code: selectedLesson.defaultCode,
          homework_type: homeworkType
        })
      })

      if (!response.ok) {
        throw new Error('تعذر توليد الواجب من الخادم')
      }

      const data = await response.json()

      if (homeworkType === 'mcq') {
        setMcqQuestions(data.questions || [])
      } else {
        setBugFixData(data)
      }
    } catch (err: any) {
      console.error(err)
      alert(`خطأ في توليد الواجب: ${err.message}`)
    } finally {
      setHwLoading(false)
    }
  }

  // Submit and verify code bug fix
  const handleGradeBugFix = async () => {
    if (!bugFixData) return
    try {
      setGradingLoading(true)
      const response = await fetch(`${API_BASE_URL}/labs/homework/verify`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          lesson_id: selectedLesson.id,
          student_code: code,
          task_description: bugFixData.description
        })
      })

      if (!response.ok) {
        throw new Error('فشل التحقق من الكود')
      }

      const data = await response.json()
      setGradingResponse(data)
    } catch (err: any) {
      alert(`خطأ أثناء تقييم الكود: ${err.message}`)
    } finally {
      setGradingLoading(false)
    }
  }

  // Load buggy code to the editor
  const handleLoadBuggyCode = () => {
    if (bugFixData) {
      setCode(bugFixData.buggy_code)
      setOutput('')
      // Show alert
      alert('تم تحميل كود التمرين في المحرر! قم بمراجعته، وأصلح الأخطاء، ثم انقر على "تشغيل الكود" لتجربته، وعند الانتهاء انقر على "إرسال الكود للتقييم".')
    }
  }

  // Send question to AI Chat Tutor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || aiLoading) return

    const userText = inputMessage
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    setAiLoading(true)

    try {
      // Build context of the current lesson
      const systemPrompt = `أنت معلم ذكاء اصطناعي خبير ومبسط للمفاهيم. المستخدم حالياً يدرس درس "${selectedLesson.title}" في تصنيف ${selectedLesson.category === 'math' ? 'الرياضيات' : 'البرمجة'}.
محتوى الدرس الحالي:
${selectedLesson.content}

الكود الحالي في محرر الدرس:
\`\`\`python
${code}
\`\`\`

الرجاء الإجابة على استفسارات الطالب باللغة العربية بأسلوب مبسط ومحفز، ومساعدته في فهم المعادلات الرياضية أو تصحيح الأكواد إذا كان لديه مشكلة.`

      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      // Call LLM endpoint
      const response = await fetch(`${API_BASE_URL}/study/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          system_instruction: systemPrompt,
          history: history
        })
      })

      if (!response.ok) {
        throw new Error('فشل الرد من الذكاء الاصطناعي')
      }

      const data = await response.json()
      setMessages(prev => [...prev, { role: 'model', content: data.response || 'عذراً، لم أستطع معالجة الطلب.' }])
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `❌ حدث خطأ في الاتصال بالذكاء الاصطناعي: ${err.message}` }])
    } finally {
      setAiLoading(false)
    }
  }

  const programmingLessons = lessonsData.filter(l => l.category === 'programming')
  const mathLessons = lessonsData.filter(l => l.category === 'math')
  const aiLessons = lessonsData.filter(l => l.category === 'ai')

  return (
    <div className="flex flex-col xl:flex-row gap-6 min-h-[calc(100vh-120px)]" style={{ color: theme.colors.text }}>
      
      {/* Main Content Area: Lesson/Homework and Sandbox */}
      <div className="flex-1 flex flex-col gap-6 order-2 xl:order-1">
        
        {/* Navigation Tabs (Lesson vs Homework) */}
        <div className="flex border-b border-white/10 gap-6">
          <button
            onClick={() => setActiveTab('lesson')}
            className="pb-3 text-lg font-bold transition-all relative"
            style={{ 
              color: activeTab === 'lesson' ? theme.colors.accent : theme.colors.textMuted
            }}
          >
            الدرس التعليمي
            {activeTab === 'lesson' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.colors.accent }} />
            )}
          </button>
          
          <button
            onClick={() => setActiveTab('homework')}
            className="pb-3 text-lg font-bold transition-all relative flex items-center gap-2"
            style={{ 
              color: activeTab === 'homework' ? theme.colors.secondary : theme.colors.textMuted
            }}
          >
            <Sparkles size={16} className="text-yellow-400" />
            الواجب الذكي (AI Homework)
            {activeTab === 'homework' && (
              <div className="absolute bottom-0 left-0 right-0 h-0.5" style={{ backgroundColor: theme.colors.secondary }} />
            )}
          </button>
        </div>

        {/* Tab 1: Lesson Content */}
        {activeTab === 'lesson' && (
          <div 
            className="p-6 md:p-8 rounded-2xl backdrop-blur-[20px]"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              border: `1px solid rgba(255, 255, 255, 0.06)`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* Header */}
            <div className="flex flex-wrap items-center justify-between gap-4 mb-6 pb-6 border-b border-white/5">
              <div>
                <span 
                  className="px-3 py-1 text-xs rounded-full font-bold inline-block mb-3"
                  style={{ 
                    backgroundColor: selectedLesson.category === 'math' ? `${theme.colors.secondary}20` : selectedLesson.category === 'programming' ? `${theme.colors.accent}20` : 'rgba(168, 85, 247, 0.2)',
                    color: selectedLesson.category === 'math' ? theme.colors.secondary : selectedLesson.category === 'programming' ? theme.colors.accent : '#c084fc',
                    border: `1px solid ${selectedLesson.category === 'math' ? theme.colors.secondary : selectedLesson.category === 'programming' ? theme.colors.accent : '#a855f7'}50`
                  }}
                >
                  {selectedLesson.category === 'math' ? 'رياضيات الذكاء الاصطناعي' : selectedLesson.category === 'programming' ? 'برمجة بايثون' : 'هندسة الذكاء الاصطناعي'}
                </span>
                <h1 className="text-3xl font-bold">{selectedLesson.title}</h1>
              </div>
              
              <div className="flex items-center gap-3">
                <span className="text-xs" style={{ color: theme.colors.textMuted }}>مستوى الصعوبة:</span>
                <span 
                  className="px-2 py-0.5 text-xs rounded-md font-bold"
                  style={{
                    backgroundColor: selectedLesson.difficulty === 'easy' ? `${theme.colors.success}20` : selectedLesson.difficulty === 'medium' ? `${theme.colors.warning}20` : `${theme.colors.error}20`,
                    color: selectedLesson.difficulty === 'easy' ? theme.colors.success : selectedLesson.difficulty === 'medium' ? theme.colors.warning : theme.colors.error,
                  }}
                >
                  {selectedLesson.difficulty === 'easy' ? 'سهل' : selectedLesson.difficulty === 'medium' ? 'متوسط' : 'متقدم'}
                </span>
              </div>
            </div>

            {/* Lesson Content */}
            <div className="prose prose-invert max-w-none space-y-6 text-right" style={{ direction: 'rtl' }}>
              {selectedLesson.content.split('\n\n').map((paragraph, index) => {
                if (paragraph.startsWith('### ')) {
                  return <h3 key={index} className="text-2xl font-bold text-white mt-8 mb-4">{paragraph.replace('### ', '')}</h3>
                }
                if (paragraph.startsWith('#### ')) {
                  return <h4 key={index} className="text-lg font-bold text-white/90 mt-6 mb-3">{paragraph.replace('#### ', '')}</h4>
                }
                if (paragraph.startsWith('* ')) {
                  return (
                    <ul key={index} className="list-disc pr-6 space-y-2 text-white/80">
                      {paragraph.split('\n').map((li, lIndex) => (
                        <li key={lIndex}>{li.replace('* ', '')}</li>
                      ))}
                    </ul>
                  )
                }
                if (paragraph.startsWith('1. ')) {
                  return (
                    <ol key={index} className="list-decimal pr-6 space-y-2 text-white/80">
                      {paragraph.split('\n').map((li, lIndex) => (
                        <li key={lIndex}>{li.replace(/^\d+\.\s*/, '')}</li>
                      ))}
                    </ol>
                  )
                }
                if (paragraph.includes('$$')) {
                  const match = paragraph.match(/\$\$(.*?)\$\$/s)
                  if (match) {
                    return (
                      <div 
                        key={index} 
                        className="my-6 p-4 rounded-xl text-center overflow-x-auto font-mono text-xl md:text-2xl font-semibold backdrop-blur-md shadow-inner"
                        style={{ 
                          backgroundColor: 'rgba(0, 0, 0, 0.2)',
                          border: '1px solid rgba(255, 255, 255, 0.05)',
                          color: theme.colors.secondary
                        }}
                      >
                        {match[1]}
                      </div>
                    )
                  }
                }
                if (paragraph.startsWith('> ')) {
                  return (
                    <div 
                      key={index}
                      className="p-4 rounded-xl border-r-4 my-4 animate-pulse"
                      style={{ 
                        backgroundColor: 'rgba(255, 255, 255, 0.01)',
                        borderColor: theme.colors.accent,
                        color: theme.colors.textMuted
                      }}
                    >
                      {paragraph.replace('> ', '')}
                    </div>
                  )
                }
                return <p key={index} className="leading-relaxed text-white/80 text-base">{paragraph}</p>
              })}
            </div>

            {selectedLesson.externalResources && selectedLesson.externalResources.length > 0 && (
              <div className="mt-8 pt-6 border-t border-white/5">
                <h3 className="text-xl font-bold text-white mb-4 flex items-center gap-2">
                  <BookMarked size={20} className="text-indigo-400" />
                  مصادر إضافية خارجية للتعلم
                </h3>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  {selectedLesson.externalResources.map((res, i) => (
                    <a
                      key={i}
                      href={res.url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center justify-between p-4 rounded-xl transition-all hover:bg-white/[0.04] border border-white/5 bg-white/[0.01]"
                    >
                      <div className="flex items-center gap-3">
                        <div 
                          className="w-10 h-10 rounded-lg flex items-center justify-center"
                          style={{
                            backgroundColor: res.platform === 'youtube' ? 'rgba(239, 68, 68, 0.1)' : 'rgba(99, 102, 241, 0.1)'
                          }}
                        >
                          {res.platform === 'youtube' ? (
                            <Youtube size={20} className="text-red-500" />
                          ) : (
                            <GraduationCap size={20} className="text-indigo-400" />
                          )}
                        </div>
                        <div className="text-right">
                          <p className="text-sm font-bold text-white/95">{res.title}</p>
                          <p className="text-xs text-white/40 animate-pulse">انقر لزيارة المصدر</p>
                        </div>
                      </div>
                      <ExternalLink size={16} className="text-white/30 hover:text-white" />
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 2: AI Homework Panel */}
        {activeTab === 'homework' && (
          <div 
            className="p-6 md:p-8 rounded-2xl backdrop-blur-[20px]"
            style={{ 
              backgroundColor: 'rgba(255, 255, 255, 0.03)', 
              border: `1px solid rgba(255, 255, 255, 0.06)`,
              boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
            }}
          >
            {/* HW Configuration Header */}
            <div className="pb-6 border-b border-white/5 mb-6">
              <h2 className="text-2xl font-bold flex items-center gap-2 mb-2">
                <Sparkles className="text-yellow-400" /> واجب مخصص بالذكاء الاصطناعي
              </h2>
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>
                قم بتوليد تمارين مخصصة بناءً على سياق الدرس الحالي لقياس مدى تمكنك البرمجي والرياضي.
              </p>

              {/* Selection Options */}
              <div className="flex flex-col sm:flex-row gap-4 mt-6 items-center">
                <div className="flex items-center gap-3">
                  <span className="text-xs font-semibold">نوع الواجب:</span>
                  <div className="flex bg-black/40 rounded-xl p-1 border border-white/5">
                    <button
                      onClick={() => setHomeworkType('mcq')}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: homeworkType === 'mcq' ? theme.colors.secondary : 'transparent',
                        color: homeworkType === 'mcq' ? '#fff' : theme.colors.textMuted
                      }}
                    >
                      خيارات متعددة (MCQ)
                    </button>
                    <button
                      onClick={() => setHomeworkType('bug_fix')}
                      className="px-4 py-2 rounded-lg text-xs font-bold transition-all"
                      style={{
                        backgroundColor: homeworkType === 'bug_fix' ? theme.colors.secondary : 'transparent',
                        color: homeworkType === 'bug_fix' ? '#fff' : theme.colors.textMuted
                      }}
                    >
                      إصلاح خطأ برمجي (Bug-Fix)
                    </button>
                  </div>
                </div>

                <button
                  onClick={handleGenerateHomework}
                  disabled={hwLoading}
                  className="w-full sm:w-auto flex items-center justify-center gap-2 px-6 py-2.5 rounded-xl font-bold text-white transition-transform hover:scale-105"
                  style={{
                    background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`
                  }}
                >
                  {hwLoading ? (
                    <>
                      <Loader2 size={16} className="animate-spin" />
                      جاري التوليد...
                    </>
                  ) : (
                    <>
                      <Sparkles size={16} />
                      توليد الواجب الآن
                    </>
                  )}
                </button>
              </div>
            </div>

            {/* Display loading block */}
            {hwLoading && (
              <div className="flex flex-col items-center justify-center py-20 gap-4">
                <div className="w-12 h-12 border-4 border-t-transparent rounded-full animate-spin" style={{ borderColor: 'rgba(255,255,255,0.05)', borderTopColor: theme.colors.secondary }} />
                <p className="text-sm font-semibold text-white/60 animate-pulse">جاري صياغة واجب مخصص لمستواك بالذكاء الاصطناعي...</p>
              </div>
            )}

            {/* Render Multiple Choice Questions (MCQ) */}
            {!hwLoading && mcqQuestions && (
              <div className="space-y-8" style={{ direction: 'rtl' }}>
                <div className="p-4 rounded-xl flex items-center gap-2.5" style={{ backgroundColor: `${theme.colors.secondary}10` }}>
                  <HelpCircle size={18} className="text-indigo-400" />
                  <span className="text-xs font-bold text-indigo-200">قم بحل الأسئلة واضغط "تسليم الإجابات" للحصول على التقييم المباشر.</span>
                </div>
                
                {mcqQuestions.map((q, idx) => (
                  <div key={q.id || idx} className="p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4">
                    <h3 className="text-lg font-bold text-white/90">{idx + 1}. {q.question}</h3>
                    
                    <div className="grid grid-cols-1 md:grid-cols-2 gap-3 pt-2">
                      {q.options.map((opt, optIdx) => {
                        const isSelected = selectedOptions[q.id] === optIdx
                        const isCorrect = q.correct_index === optIdx
                        
                        let borderStyle = '1px solid rgba(255,255,255,0.06)'
                        let bgStyle = 'rgba(255,255,255,0.02)'
                        let textColor = 'rgba(255,255,255,0.8)'

                        if (isSelected && !graded) {
                          borderStyle = `1px solid ${theme.colors.accent}`
                          bgStyle = `${theme.colors.accent}15`
                          textColor = '#fff'
                        } else if (graded) {
                          if (isCorrect) {
                            borderStyle = '1px solid rgba(34, 197, 94, 0.4)'
                            bgStyle = 'rgba(34, 197, 94, 0.1)'
                            textColor = '#4ade80'
                          } else if (isSelected && !isCorrect) {
                            borderStyle = '1px solid rgba(239, 68, 68, 0.4)'
                            bgStyle = 'rgba(239, 68, 68, 0.1)'
                            textColor = '#f87171'
                          }
                        }

                        return (
                          <button
                            key={optIdx}
                            onClick={() => {
                              if (graded) return
                              setSelectedOptions(prev => ({ ...prev, [q.id]: optIdx }))
                            }}
                            disabled={graded}
                            className="text-right p-4 rounded-xl text-xs font-semibold transition-all hover:bg-white/[0.04] flex items-center justify-between"
                            style={{ border: borderStyle, backgroundColor: bgStyle, color: textColor }}
                          >
                            <span>{opt}</span>
                            {graded && isCorrect && <CheckCircle2 size={16} className="text-green-500 shrink-0" />}
                            {graded && isSelected && !isCorrect && <XCircle size={16} className="text-red-500 shrink-0" />}
                          </button>
                        )
                      })}
                    </div>

                    {graded && (
                      <div 
                        className="p-4 rounded-xl text-xs leading-relaxed mt-4 border border-white/5 bg-black/25"
                        style={{ color: theme.colors.textMuted }}
                      >
                        <strong className="text-white block mb-1">الشرح العلمي:</strong>
                        {q.explanation}
                      </div>
                    )}
                  </div>
                ))}

                <div className="pt-4 flex gap-4">
                  {!graded ? (
                    <button
                      onClick={() => setGraded(true)}
                      disabled={Object.keys(selectedOptions).length < mcqQuestions.length}
                      className="px-8 py-3 rounded-xl font-bold text-white transition-all disabled:opacity-50"
                      style={{ background: theme.colors.accent }}
                    >
                      تسليم الإجابات للتقييم
                    </button>
                  ) : (
                    <button
                      onClick={handleGenerateHomework}
                      className="px-8 py-3 rounded-xl font-bold text-white transition-all"
                      style={{ background: theme.colors.secondary }}
                    >
                      توليد واجب جديد لهذا الدرس
                    </button>
                  )}
                </div>
              </div>
            )}

            {/* Render Coding Bug-Fix Assignment */}
            {!hwLoading && bugFixData && (
              <div className="space-y-6" style={{ direction: 'rtl' }}>
                <div className="p-6 rounded-xl bg-white/[0.01] border border-white/5 space-y-4">
                  <div className="flex items-center justify-between border-b border-white/5 pb-3">
                    <span className="text-sm font-bold text-yellow-400 flex items-center gap-1.5">
                      <Code size={18} /> تمرين إصلاح الكود المبرمج
                    </span>
                    <button
                      onClick={handleLoadBuggyCode}
                      className="px-4 py-2 bg-indigo-600/20 hover:bg-indigo-600/40 text-indigo-200 border border-indigo-500/30 rounded-xl text-xs font-bold transition-all"
                    >
                      تحميل الكود الخاطئ في المحرر 🛠️
                    </button>
                  </div>

                  <h3 className="text-lg font-bold text-white/90">مطلوب منك إصلاح الكود البرمجي ليقوم بالتالي:</h3>
                  <p className="text-sm leading-relaxed text-white/80">{bugFixData.description}</p>
                  
                  <div className="pt-2">
                    <span className="text-xs font-bold text-white/40 block mb-2">المخرجات المستهدفة المتوقعة:</span>
                    <pre className="p-4 rounded-xl bg-black/40 text-xs font-mono text-left text-white/70" style={{ direction: 'ltr' }}>
                      {bugFixData.target_output}
                    </pre>
                  </div>
                </div>

                {/* Grading Action button */}
                <div className="flex items-center gap-4">
                  <button
                    onClick={handleGradeBugFix}
                    disabled={gradingLoading}
                    className="flex items-center gap-2 px-8 py-3 rounded-xl font-bold text-white transition-transform hover:scale-105"
                    style={{ background: theme.colors.accent }}
                  >
                    {gradingLoading ? <Loader2 size={16} className="animate-spin" /> : <Sparkles size={16} />}
                    إرسال كودي للتقييم بالذكاء الاصطناعي
                  </button>

                  <button
                    onClick={() => {
                      if (bugFixData) {
                        setCode(bugFixData.buggy_code)
                      }
                    }}
                    className="px-4 py-3 rounded-xl text-xs font-bold bg-white/5 hover:bg-white/10"
                  >
                    إعادة الكود الخاطئ الأصلي
                  </button>
                </div>

                {/* Verification result output */}
                {gradingResponse && (
                  <div 
                    className="p-6 rounded-xl border space-y-4"
                    style={{ 
                      backgroundColor: gradingResponse.passed ? 'rgba(34, 197, 94, 0.05)' : 'rgba(239, 68, 68, 0.05)',
                      borderColor: gradingResponse.passed ? 'rgba(34, 197, 94, 0.2)' : 'rgba(239, 68, 68, 0.2)'
                    }}
                  >
                    <div className="flex items-center gap-3">
                      {gradingResponse.passed ? (
                        <CheckCircle2 className="text-green-500" size={24} />
                      ) : (
                        <XCircle className="text-red-500" size={24} />
                      )}
                      <h3 className="text-lg font-bold">
                        {gradingResponse.passed ? 'تهانينا! الكود صحيح ومكتمل بنجاح.' : 'كودك يحتاج لبعض التعديل والحل غير متطابق.'}
                      </h3>
                    </div>

                    <p className="text-xs leading-relaxed" style={{ color: theme.colors.textMuted }}>
                      <strong className="text-white block mb-1">التقييم الفني للمعلم المساعد:</strong>
                      {gradingResponse.feedback}
                    </p>

                    <div className="pt-2">
                      <span className="text-xs font-bold text-white/40 block mb-2">الكود النموذجي الصحيح:</span>
                      <pre className="p-4 rounded-xl bg-black/40 text-xs font-mono text-left text-green-300 overflow-x-auto" style={{ direction: 'ltr' }}>
                        {gradingResponse.corrected_code}
                      </pre>
                    </div>
                  </div>
                )}
              </div>
            )}

            {/* Unloaded state */}
            {!hwLoading && !mcqQuestions && !bugFixData && (
              <div className="flex flex-col items-center justify-center py-20 text-center gap-6">
                <div className="w-20 h-20 rounded-full bg-white/5 flex items-center justify-center">
                  <BookOpen size={40} style={{ color: theme.colors.textMuted }} />
                </div>
                <div>
                  <h3 className="text-xl font-bold mb-2">الواجب الذكي غير مولد بعد</h3>
                  <p className="text-sm max-w-md mx-auto" style={{ color: theme.colors.textMuted }}>
                    اضغط على زر التوليد في الأعلى لإنشاء واجب مخصص لدرس **"{selectedLesson.title}"** بناءً على مستواك.
                  </p>
                </div>
              </div>
            )}
          </div>
        )}

        {/* Sandbox Editor & Runner (Always visible at the bottom) */}
        <div 
          className="rounded-2xl overflow-hidden backdrop-blur-[20px]"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.02)', 
            border: `1px solid rgba(255, 255, 255, 0.05)`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Editor Header */}
          <div className="flex items-center justify-between px-6 py-4 bg-black/40 border-b border-white/5">
            <div className="flex items-center gap-3">
              <div className="flex gap-1.5">
                <div className="w-3 h-3 rounded-full bg-red-500/80" />
                <div className="w-3 h-3 rounded-full bg-yellow-500/80" />
                <div className="w-3 h-3 rounded-full bg-green-500/80" />
              </div>
              <span className="text-sm font-mono text-white/60 flex items-center gap-1.5">
                <Code size={16} /> playground.py
              </span>
            </div>
            
            <div className="flex gap-2">
              <button 
                onClick={handleResetCode}
                className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold text-white/70 hover:text-white bg-white/5 hover:bg-white/10 transition-colors"
              >
                <RotateCcw size={14} /> إعادة التعيين
              </button>
              
              <button 
                onClick={handleRunCode}
                disabled={running}
                className="flex items-center gap-1.5 px-4 py-1.5 rounded-lg text-xs font-bold text-white transition-transform hover:scale-105"
                style={{ 
                  background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)` 
                }}
              >
                {running ? <Loader2 size={14} className="animate-spin" /> : <Play size={14} />}
                تشغيل الكود
              </button>
            </div>
          </div>

          {/* Editor Body */}
          <div className="relative">
            <textarea
              value={code}
              onChange={(e) => setCode(e.target.value)}
              className="w-full h-64 p-6 bg-black/30 text-white font-mono text-sm leading-relaxed outline-none resize-none"
              style={{ direction: 'ltr' }}
              placeholder="# اكتب كود بايثون هنا..."
            />
          </div>

          {/* Terminal Output */}
          <div className="bg-black/60 border-t border-white/5 p-5">
            <div className="flex items-center justify-between mb-2">
              <span className="text-xs font-bold text-white/40 uppercase tracking-wider">مخرجات الكود (Output Terminal)</span>
              {running && <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />}
            </div>
            <pre 
              className="font-mono text-xs text-green-400 overflow-x-auto min-h-[80px] max-h-[200px] leading-relaxed select-text text-left" 
              style={{ direction: 'ltr' }}
            >
              {output || '# اكتب الكود الخاص بك وانقر "تشغيل الكود" لمشاهدة المخرجات هنا...'}
            </pre>
          </div>
        </div>

      </div>

      {/* Right Sidebar: Lessons List & AI Tutor Panel Toggle */}
      <div className="w-full xl:w-[320px] shrink-0 flex flex-col gap-6 order-1 xl:order-2">
        
        {/* Quick AI Tutor widget */}
        <div 
          className="p-5 rounded-2xl border transition-all cursor-pointer hover:shadow-lg hover:scale-[1.01]"
          style={{ 
            backgroundColor: showAIAssistant ? 'rgba(99, 102, 241, 0.08)' : 'rgba(255, 255, 255, 0.03)',
            borderColor: showAIAssistant ? `${theme.colors.accent}40` : 'rgba(255, 255, 255, 0.06)'
          }}
          onClick={() => setShowAIAssistant(!showAIAssistant)}
        >
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div 
                className="w-10 h-10 rounded-xl flex items-center justify-center text-white"
                style={{ background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})` }}
              >
                <Sparkles size={20} className={aiLoading ? 'animate-pulse' : ''} />
              </div>
              <div>
                <h3 className="font-bold text-sm">المعلم المساعد الذكي</h3>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>اضغط لمناقشة الدرس الحالي</p>
              </div>
            </div>
            <ChevronLeft size={18} className={`transition-transform duration-300 ${showAIAssistant ? '-rotate-90' : ''}`} />
          </div>
        </div>

        {/* AI Assistant Chat Panel */}
        {showAIAssistant && (
          <div 
            className="flex flex-col h-[400px] rounded-2xl overflow-hidden border animate-in slide-in-from-top-4"
            style={{ 
              backgroundColor: 'rgba(10, 14, 23, 0.6)', 
              borderColor: `${theme.colors.accent}30`
            }}
          >
            <div className="px-4 py-3 bg-black/40 border-b border-white/5 flex items-center justify-between">
              <span className="text-xs font-bold flex items-center gap-1.5">
                <Sparkles size={14} className="text-indigo-400" /> نقاش: {selectedLesson.title}
              </span>
              <button 
                onClick={() => setMessages([{role: 'model', content: `مرحباً! أنا مساعدك الذكي لمسار. كيف يمكنني مساعدتك في فهم درس "${selectedLesson.title}"؟`}])}
                className="text-[10px] text-white/50 hover:text-white"
              >
                مسح المحادثة
              </button>
            </div>

            <div className="flex-1 overflow-y-auto p-4 space-y-3 flex flex-col">
              {messages.map((msg, i) => (
                <div 
                  key={i} 
                  className={`p-3 rounded-xl max-w-[85%] text-xs leading-relaxed ${
                    msg.role === 'user' 
                      ? 'bg-indigo-600 text-white self-start rounded-tl-none' 
                      : 'bg-white/5 text-white/90 self-end rounded-tr-none'
                  }`}
                  style={{ direction: 'rtl' }}
                >
                  {msg.content}
                </div>
              ))}
              {aiLoading && (
                <div className="bg-white/5 text-white/60 p-3 rounded-xl self-end rounded-tr-none text-xs flex items-center gap-2">
                  <Loader2 size={12} className="animate-spin text-indigo-400" />
                  جاري التفكير وصياغة الشرح...
                </div>
              )}
            </div>

            <form onSubmit={handleSendMessage} className="p-3 bg-black/40 border-t border-white/5 flex gap-2">
              <input
                type="text"
                value={inputMessage}
                onChange={(e) => setInputMessage(e.target.value)}
                placeholder="اسألني عن المعادلة أو الكود..."
                className="flex-1 bg-white/5 rounded-lg px-3 py-2 text-xs outline-none text-white focus:bg-white/10 transition-colors"
                style={{ direction: 'rtl' }}
              />
              <button 
                type="submit"
                disabled={aiLoading || !inputMessage.trim()}
                className="p-2 rounded-lg text-white disabled:opacity-50"
                style={{ background: theme.colors.accent }}
              >
                <Send size={14} />
              </button>
            </form>
          </div>
        )}

        {/* Lessons List Navigation */}
        <div 
          className="p-5 rounded-2xl backdrop-blur-[20px] flex-1 flex flex-col gap-6"
          style={{ 
            backgroundColor: 'rgba(255, 255, 255, 0.03)', 
            border: `1px solid rgba(255, 255, 255, 0.06)`,
            boxShadow: '0 8px 32px 0 rgba(0, 0, 0, 0.2)'
          }}
        >
          {/* Programming Category */}
          <div>
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Code size={16} style={{ color: theme.colors.accent }} /> أساسيات البرمجة ببايثون
            </h3>
            <div className="space-y-1">
              {programmingLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all"
                  style={{
                    backgroundColor: selectedLesson.id === lesson.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: selectedLesson.id === lesson.id ? theme.colors.accent : 'rgba(255,255,255,0.7)',
                    border: selectedLesson.id === lesson.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
                  }}
                >
                  <span className="truncate flex-1 pl-2">{lesson.title}</span>
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ 
                      backgroundColor: selectedLesson.id === lesson.id ? theme.colors.accent : 'rgba(255,255,255,0.1)' 
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* Math Category */}
          <div>
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <BookMarked size={16} style={{ color: theme.colors.secondary }} /> رياضيات الذكاء الاصطناعي
            </h3>
            <div className="space-y-1">
              {mathLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all"
                  style={{
                    backgroundColor: selectedLesson.id === lesson.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: selectedLesson.id === lesson.id ? theme.colors.secondary : 'rgba(255,255,255,0.7)',
                    border: selectedLesson.id === lesson.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
                  }}
                >
                  <span className="truncate flex-1 pl-2">{lesson.title}</span>
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ 
                      backgroundColor: selectedLesson.id === lesson.id ? theme.colors.secondary : 'rgba(255,255,255,0.1)' 
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

          {/* AI Category */}
          <div>
            <h3 className="text-sm font-bold text-white/40 uppercase tracking-wider mb-3 flex items-center gap-2">
              <Sparkles size={16} style={{ color: '#c084fc' }} /> هندسة الذكاء الاصطناعي
            </h3>
            <div className="space-y-1">
              {aiLessons.map((lesson) => (
                <button
                  key={lesson.id}
                  onClick={() => handleSelectLesson(lesson)}
                  className="w-full text-right px-3 py-2.5 rounded-xl text-xs font-semibold flex items-center justify-between group transition-all"
                  style={{
                    backgroundColor: selectedLesson.id === lesson.id ? 'rgba(255,255,255,0.06)' : 'transparent',
                    color: selectedLesson.id === lesson.id ? '#c084fc' : 'rgba(255,255,255,0.7)',
                    border: selectedLesson.id === lesson.id ? '1px solid rgba(255,255,255,0.08)' : '1px solid transparent'
                  }}
                >
                  <span className="truncate flex-1 pl-2">{lesson.title}</span>
                  <span 
                    className="w-1.5 h-1.5 rounded-full shrink-0" 
                    style={{ 
                      backgroundColor: selectedLesson.id === lesson.id ? '#c084fc' : 'rgba(255,255,255,0.1)' 
                    }} 
                  />
                </button>
              ))}
            </div>
          </div>

        </div>

      </div>

    </div>
  )
}
