import { useState, useEffect, useRef } from 'react'
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
  ExternalLink,
  Mic,
  MicOff,
  Copy,
  Check
} from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { motion } from 'framer-motion'
import { lessonsData, Lesson } from '@/data/lessonsData'
import { usePyodide } from '@/hooks/usePyodide'
import { API_BASE_URL, studyAPI } from '@/services/api'
import { MarkdownRenderer } from '@/components/MarkdownRenderer'

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

const QUIZZES: Record<number, { question: string, options: string[], correct: string }> = {
  1: {
    question: "في لغة بايثون، لا تحتاج لتحديد نوع المتغير مسبقاً قبل تعريفه. ما هو التسمية العلمية لهذه الميزة؟",
    options: ["الكتابة الديناميكية (Dynamic Typing)", "الكتابة الصارمة (Static Typing)", "البرمجة كائنية التوجه (OOP)", "الجمع التلقائي للمهملات"],
    correct: "الكتابة الديناميكية (Dynamic Typing)"
  },
  2: {
    question: "ما هي الآلية التي تستخدمها لغة بايثون لتحديد الأكواد التابعة لجملة الشرط (if) أو حلقة التكرار (for)؟",
    options: ["الأقواس المتعرجة { }", "المسافات البادئة (Indentation)", "علامات التنصيص المزدوجة", "الفاصلة المنقوطة ;"],
    correct: "المسافات البادئة (Indentation)"
  },
  3: {
    question: "أي الكلمات المفتاحية التالية تُستخدم لتعريف دالة جديدة في لغة بايثون؟",
    options: ["function", "def", "void", "define"],
    correct: "def"
  },
  4: {
    question: "كيف يمكننا تعريف قاموس (Dictionary) فارغ في لغة بايثون؟",
    options: ["d = []", "d = ()", "d = {}", "d = set()"],
    correct: "d = {}"
  },
  5: {
    question: "ما اسم الدالة المخصصة (Constructor) في بايثون لتهيئة قيم الكائن عند إنشائه؟",
    options: ["__init__", "__new__", "constructor", "create"],
    correct: "__init__"
  },
  6: {
    question: "في الجبر الخطي، ماذا ينتج عن حاصل الضرب النقطي لمتجهين متعامدين (أي الزاوية بينهما 90 درجة)؟",
    options: ["1", "-1", "0", "حاصل ضرب طوليهما"],
    correct: "0"
  },
  7: {
    question: "ما هي دالة التنشيط التي تقوم بتحويل أي قيمة مدخلة إلى نطاق يتراوح بين 0 و 1، وتُستخدم بكثرة للتنبؤ بالاحتمالات؟",
    options: ["ReLU", "Sigmoid", "Tanh", "Softmax"],
    correct: "Sigmoid"
  },
  8: {
    question: "إذا كان جيب تمام الزاوية (Cosine Similarity) بين متجهين يساوي 1 تماماً، فماذا يعني ذلك؟",
    options: ["المتجهان متعامدان تماماً ولا تشابه بينهما", "المتجهان لهما نفس الاتجاه تماماً ومتطابقان في المعنى", "المتجهان متعاكسان تماماً في الاتجاه", "أحد المتجهين فارغ"],
    correct: "المتجهان لهما نفس الاتجاه تماماً ومتطابقان في المعنى"
  },
  9: {
    question: "في تعلم الآلة، ماذا يمثل المشتق الأول لدالة التكلفة (Cost Function)؟",
    options: ["القيمة الصغرى المطلقة للدالة", "سرعة تقارب النموذج", "معدل التغير (المنحدر) والاتجاه الذي تزيد فيه الدالة", "دقة النموذج النهائية"],
    correct: "معدل التغير (المنحدر) والاتجاه الذي تزيد فيه الدالة"
  },
  10: {
    question: "ما هي المشكلة التي تحدث عندما يكون معدل التعلم (Learning Rate) كبيراً جداً في خوارزمية الانحدار التدريجي؟",
    options: ["البطء الشديد في الوصول للحل", "تجاوز نقطة النهاية الصغرى والتذبذب أو عدم التقارب (Divergence)", "توقف النموذج عن التعلم تماماً", "تلاشي المشتقات (Vanishing Gradients)"],
    correct: "تجاوز نقطة النهاية الصغرى والتذبذب أو عدم التقارب (Divergence)"
  },
  11: {
    question: "ما هي عملية تحويل البيانات الفئوية (Categorical Data) إلى شكل رقمي ثنائي (0 أو 1)؟",
    options: ["التقييس (Standardization)", "التطبيع (Normalization)", "الترميز بنظام One-Hot Encoding", "معالجة القيم المفقودة"],
    correct: "الترميز بنظام One-Hot Encoding"
  },
  12: {
    question: "ما هي العملية التي يتم فيها حساب الأخطاء وتحديث الأوزان من الطبقة الأخيرة إلى الطبقة الأولى في الشبكة العصبية؟",
    options: ["التمرير الأمامي (Forward Propagation)", "الانتشار الخلفي للأخطاء (Backpropagation)", "التسوية (Regularization)", "التهيئة العشوائية للأوزان"],
    correct: "الانتشار الخلفي للأخطاء (Backpropagation)"
  },
  13: {
    question: "ما هو الاسم المطلق على تقنية كتابة التوجيهات التي نقوم فيها بإعطاء النموذج بضعة أمثلة محلولة قبل السؤال الأساسي؟",
    options: ["Zero-Shot Prompting", "Few-Shot Prompting", "Chain-of-Thought Prompting", "System Prompting"],
    correct: "Few-Shot Prompting"
  },
  14: {
    question: "ما هي الخطوة الأساسية الأولى في معمارية RAG عند قيام المستخدم بطرح سؤال؟",
    options: ["توليد النص مباشرة باستخدام LLM", "استرجاع المستندات ذات الصلة من قاعدة بيانات ناقلات (Vector DB)", "إعادة ترتيب جميع المستندات في النظام يدوياً", "ترجمة السؤال إلى لغة أخرى"],
    correct: "استرجاع المستندات ذات الصلة من قاعدة بيانات ناقلات (Vector DB)"
  },
  15: {
    question: "ما الذي يميز الوكيل الذكي (AI Agent) عن نموذج اللغة الضخم (LLM) البسيط عند حل المشكلات المعقدة؟",
    options: ["القدرة على استخدام الأدوات، والتخطيط المتعدد الخطوات، والعمل التكراري المستقل", "امتلاكه حجماً أكبر من الذاكرة العشوائية", "سرعة المعالجة الفائقة فقط", "قدرته على تخزين الصور بدقة أعلى"],
    correct: "القدرة على استخدام الأدوات، والتخطيط المتعدد الخطوات، والعمل التكراري المستقل"
  }
};

function ComprehensionQuizCard({ lessonId, onPass }: { lessonId: number; onPass: () => void }) {
  const { theme } = useTheme()
  const quiz = QUIZZES[lessonId] || {
    question: "هل قمت بقراءة وفهم المفهومين السابقين للدرس؟",
    options: ["نعم، فهمتهما جيداً ومستعد للمتابعة", "لا، أحتاج لإعادة القراءة"],
    correct: "نعم، فهمتهما جيداً ومستعد للمتابعة"
  }
  const [selectedOption, setSelectedOption] = useState<string | null>(null)
  const [showFeedback, setShowFeedback] = useState(false)
  const [isCorrect, setIsCorrect] = useState(false)

  const handleSubmit = () => {
    if (!selectedOption) return
    const correct = selectedOption === quiz.correct
    setIsCorrect(correct)
    setShowFeedback(true)
    if (correct) {
      setTimeout(() => {
        onPass()
      }, 1200)
    }
  }

  return (
    <div 
      className="p-6 rounded-2xl border transition-all duration-300"
      style={{ 
        backgroundColor: 'rgba(255, 255, 255, 0.02)', 
        borderColor: theme.colors.border,
        boxShadow: `0 0 25px ${theme.colors.accent}10`
      }}
    >
      <h3 className="text-sm font-bold mb-3 text-white flex items-center gap-2">
        <Sparkles size={16} className="text-yellow-400 animate-pulse" />
        سؤال الفهم السريع: تحقق من استيعابك للمتابعة
      </h3>
      <p className="text-xs text-slate-200 mb-4">{quiz.question}</p>
      <div className="space-y-2 mb-4">
        {quiz.options.map((option, idx) => {
          const isSelected = selectedOption === option
          return (
            <button
              key={idx}
              onClick={() => !showFeedback && setSelectedOption(option)}
              disabled={showFeedback}
              className="w-full text-right p-3 rounded-xl text-xs transition-all flex items-center justify-between border"
              style={{
                backgroundColor: isSelected ? `${theme.colors.accent}15` : 'rgba(255,255,255,0.02)',
                borderColor: isSelected ? theme.colors.accent : 'rgba(255,255,255,0.08)',
                color: isSelected ? '#fff' : theme.colors.textMuted
              }}
            >
              <span>{option}</span>
              <div 
                className="w-4 h-4 rounded-full border flex items-center justify-center shrink-0"
                style={{ borderColor: isSelected ? theme.colors.accent : 'rgba(255,255,255,0.3)' }}
              >
                {isSelected && <div className="w-2 h-2 rounded-full" style={{ backgroundColor: theme.colors.accent }} />}
              </div>
            </button>
          )
        })}
      </div>
      
      {!showFeedback ? (
        <button
          onClick={handleSubmit}
          disabled={!selectedOption}
          className="w-full py-2.5 rounded-xl font-bold text-xs text-white transition-all disabled:opacity-50 shadow-md"
          style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
        >
          تحقق من الإجابة
        </button>
      ) : (
        <div 
          className="p-3 rounded-xl text-xs text-center font-semibold transition-all duration-300"
          style={{
            backgroundColor: isCorrect ? 'rgba(34, 197, 94, 0.1)' : 'rgba(239, 68, 68, 0.1)',
            color: isCorrect ? '#4ade80' : '#f87171',
            border: `1px solid ${isCorrect ? 'rgba(34,197,94,0.2)' : 'rgba(239,68,68,0.2)'}`
          }}
        >
          {isCorrect ? '✓ إجابة صحيحة! جاري فتح باقي الدرس...' : '❌ إجابة خاطئة، حاول مرة أخرى.'}
          {!isCorrect && (
            <button 
              onClick={() => { setShowFeedback(false); setSelectedOption(null); }} 
              className="block mx-auto mt-2 text-[10px] underline font-bold"
              style={{ color: theme.colors.text }}
            >
              أعد المحاولة
            </button>
          )}
        </div>
      )}
    </div>
  )
}

export default function LessonsPage() {
  const { theme } = useTheme()
  const { runPython, isReady: pyodideReady } = usePyodide()
  const [selectedLesson, setSelectedLesson] = useState<Lesson>(lessonsData[0])

  // Comprehension check quizzes passed state
  const [completedQuizzes, setCompletedQuizzes] = useState<Record<number, boolean>>(() => {
    try {
      const saved = localStorage.getItem('masar_completed_quizzes')
      return saved ? JSON.parse(saved) : {}
    } catch {
      return {}
    }
  })

  useEffect(() => {
    localStorage.setItem('masar_completed_quizzes', JSON.stringify(completedQuizzes))
  }, [completedQuizzes])

  // Dictation states
  const [isRecording, setIsRecording] = useState(false)
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const startRecording = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
      const mediaRecorder = new MediaRecorder(stream)
      mediaRecorderRef.current = mediaRecorder
      audioChunksRef.current = []

      mediaRecorder.ondataavailable = (event) => {
        if (event.data.size > 0) {
          audioChunksRef.current.push(event.data)
        }
      }

      mediaRecorder.onstop = async () => {
        const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })
        const audioFile = new File([audioBlob], 'dictation.webm', { type: 'audio/webm' })
        
        setIsRecording(false)
        setAiLoading(true)
        setMessages(prev => [...prev, { role: 'user', content: '🎙️ [جاري تفريغ رسالتك الصوتية...]' }])
        
        try {
          const response = await studyAPI.transcribeFile(audioFile)
          const text = response.data?.text || ''
          
          setMessages(prev => {
            const next = [...prev]
            if (next.length > 0) {
              next[next.length - 1] = { role: 'user', content: text }
            }
            return next
          })
          
          if (text.trim()) {
            await handleSendTutorMessage(text)
          } else {
            setMessages(prev => [...prev, { role: 'model', content: '⚠️ عذراً، لم أتمكن من سماع أي صوت واضح. يرجى المحاولة مجدداً.' }])
            setAiLoading(false)
          }
        } catch (err: any) {
          setMessages(prev => {
            const next = [...prev]
            if (next.length > 0) {
              next[next.length - 1] = { role: 'user', content: '🎙️ [فشل تفريغ الصوت]' }
            }
            return next
          })
          setMessages(prev => [...prev, { role: 'model', content: `❌ حدث خطأ أثناء التفريغ الصوتي: ${err.message}` }])
          setAiLoading(false)
        }

        stream.getTracks().forEach(track => track.stop())
      }

      mediaRecorder.start()
      setIsRecording(true)
    } catch (err: any) {
      alert(`عذراً، لم نتمكن من الوصول للميكروفون: ${err.message}`)
    }
  }

  const stopRecording = () => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }
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
  const [copiedMessageIdx, setCopiedMessageIdx] = useState<number | null>(null)
  const chatEndRef = useRef<HTMLDivElement>(null)

  useEffect(() => {
    if (showAIAssistant) {
      setTimeout(() => {
        chatEndRef.current?.scrollIntoView({ behavior: 'smooth' })
      }, 50)
    }
  }, [messages, aiLoading, showAIAssistant])

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

  // Send message helper with streaming support (SSE style)
  const handleSendTutorMessage = async (userText: string) => {
    setAiLoading(true)
    try {
      const systemPrompt = `أنت معلم ذكاء اصطناعي خبير ومحترف للغاية في تبسيط المفاهيم الأكاديمية ومحاكاة المعلمين في الجامعات والمواقع التعليمية الكبرى (مثل ChatGPT وClaude).
المستخدم يدرس درس "${selectedLesson.title}" (${selectedLesson.category === 'math' ? 'رياضيات' : 'برمجة/ذكاء اصطناعي'}).

محتوى الدرس الحالي للرجوع إليه:
${selectedLesson.content}

الكود الحالي في محرر الطالب (إذا وجد):
\`\`\`python
${code}
\`\`\`

قواعد وتوجيهات حرجة للإجابة:
1. **التنسيق الاحترافي**: نسّق إجابتك باستخدام لغة Markdown بشكل ممتاز. استخدم العناوين الفرعية (###)، النقاط، الجداول، والمربعات البرمجية المظللة.
2. **المعادلات الرياضية**: أي معادلات رياضية يجب أن تكتب بصيغة LaTeX باستخدام \\( ... \\) للمعادلات السطرية و \\[ ... \\] للمعادلات المستقلة لتظهر بشكل جميل.
3. **منع التكرار**: تجنب تكرار العبارات والفقرات تماماً، وقدم معلومات غنية دون إعادة صياغة لنفس الفكرة بكلمات أخرى.
4. **الأسلوب**: أسلوبك يجب أن يكون ذكياً، أكاديمياً، واضحاً ومباشراً ومحفزاً باللغة العربية الفصحى.
5. **مساعدة الكود**: إذا سأل الطالب عن خطأ في كوده، اشرح له مكان الخطأ بوضوح وصححه له مع تقديم الكود المصحح في قالب كود برمجية (\`\`\`python ... \`\`\`).`

      const history = messages.map(msg => ({
        role: msg.role === 'model' ? 'model' : 'user',
        parts: [{ text: msg.content }]
      }))

      // Call LLM endpoint with stream: true
      const response = await fetch(`${API_BASE_URL}/study/chat`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          message: userText,
          system_instruction: systemPrompt,
          history: history,
          stream: true
        })
      })

      if (!response.ok) {
        throw new Error('فشل الرد من الذكاء الاصطناعي')
      }

      // Add a placeholder message for the model response
      setMessages(prev => [...prev, { role: 'model', content: '' }])

      const reader = response.body?.getReader()
      const decoder = new TextDecoder('utf-8')
      if (!reader) {
        throw new Error('فشل قراءة الاستجابة كبث تدفقي')
      }

      let done = false
      let accumulatedText = ''

      while (!done) {
        const { value, done: readerDone } = await reader.read()
        done = readerDone
        if (value) {
          const chunk = decoder.decode(value, { stream: !done })
          accumulatedText += chunk
          setMessages(prev => {
            const next = [...prev]
            if (next.length > 0) {
              next[next.length - 1] = { role: 'model', content: accumulatedText }
            }
            return next
          })
        }
      }
    } catch (err: any) {
      setMessages(prev => [...prev, { role: 'model', content: `❌ حدث خطأ في الاتصال بالذكاء الاصطناعي: ${err.message}` }])
    } finally {
      setAiLoading(false)
    }
  }

  // Send question to AI Chat Tutor
  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault()
    if (!inputMessage.trim() || aiLoading) return

    const userText = inputMessage
    setInputMessage('')
    setMessages(prev => [...prev, { role: 'user', content: userText }])
    await handleSendTutorMessage(userText)
  }

  const handleCopyMessage = async (text: string, index: number) => {
    try {
      await navigator.clipboard.writeText(text)
      setCopiedMessageIdx(index)
      setTimeout(() => {
        setCopiedMessageIdx(null)
      }, 2000)
    } catch (err) {
      console.error('Failed to copy text:', err)
    }
  }
  const renderChatPanel = (isMobile = false) => {
    return (
      <div 
        className={`flex flex-col rounded-2xl overflow-hidden border ${
          isMobile 
            ? 'w-full h-full border-0 rounded-none bg-slate-950/80' 
            : 'h-[580px] animate-in slide-in-from-top-4'
        }`}
        style={{ 
          backgroundColor: isMobile ? undefined : 'rgba(10, 14, 23, 0.65)', 
          borderColor: isMobile ? 'transparent' : `${theme.colors.accent}30`
        }}
      >
        <div className="px-4 py-3.5 bg-black/50 border-b border-white/5 flex items-center justify-between">
          <span className="text-xs font-bold flex items-center gap-1.5 text-white/90">
            <Sparkles size={14} className="text-indigo-400" /> نقاش: {selectedLesson.title}
          </span>
          <div className="flex items-center gap-3">
            <button 
              onClick={() => setMessages([{role: 'model', content: `مرحباً! أنا مساعدك الذكي لمسار. كيف يمكنني مساعدتك في فهم درس "${selectedLesson.title}"؟`}])}
              className="text-[10px] text-white/50 hover:text-white transition-colors"
            >
              مسح المحادثة
            </button>
            {isMobile && (
              <button 
                onClick={() => setShowAIAssistant(false)}
                className="text-xs font-bold text-indigo-400 hover:text-indigo-300 px-2 py-1 rounded hover:bg-white/5 transition-colors"
              >
                إغلاق
              </button>
            )}
          </div>
        </div>

        {/* Messages List */}
        <div className="flex-1 overflow-y-auto p-4 space-y-4 flex flex-col">
          {messages.map((msg, i) => {
            const isUser = msg.role === 'user'
            return (
              <div 
                key={i} 
                className={`flex gap-2.5 max-w-[90%] items-start ${
                  isUser 
                    ? 'self-start flex-row-reverse' 
                    : 'self-end flex-row'
                }`}
                style={{ direction: 'rtl' }}
              >
                {/* Avatar */}
                <div 
                  className={`w-7 h-7 rounded-lg flex items-center justify-center shrink-0 text-[10px] font-bold text-white shadow-md ${
                    isUser 
                      ? 'bg-gradient-to-br from-indigo-500 to-purple-600' 
                      : 'bg-gradient-to-br from-teal-500 to-emerald-500'
                  }`}
                >
                  {isUser ? 'طالب' : <Sparkles size={12} />}
                </div>

                {/* Message Bubble */}
                <div 
                  className={`p-3 rounded-xl text-xs leading-relaxed shadow-sm relative group transition-all ${
                    isUser 
                      ? 'bg-indigo-600/35 border border-indigo-500/20 text-white rounded-tr-none' 
                      : 'bg-white/[0.04] border border-white/5 text-white/90 rounded-tl-none'
                  }`}
                >
                  {isUser ? (
                    <span className="whitespace-pre-wrap">{msg.content}</span>
                  ) : (
                    <div className="prose prose-invert prose-xs max-w-full">
                      <MarkdownRenderer content={msg.content} />
                    </div>
                  )}

                  {/* Copy Button for Model Response */}
                  {!isUser && (
                    <div className="flex justify-end gap-2 border-t border-white/5 pt-1.5 mt-2 opacity-0 group-hover:opacity-100 transition-opacity">
                      <button 
                        type="button"
                        onClick={() => handleCopyMessage(msg.content, i)} 
                        className="p-1 rounded text-white/40 hover:text-white hover:bg-white/5 transition-all flex items-center gap-1 text-[9px] font-medium"
                      >
                        {copiedMessageIdx === i ? (
                          <>
                            <Check size={9} className="text-green-400" />
                            <span className="text-green-400 text-[9px]">تم النسخ</span>
                          </>
                        ) : (
                          <>
                            <Copy size={9} />
                            <span>نسخ الإجابة</span>
                          </>
                        )}
                      </button>
                    </div>
                  )}
                </div>
              </div>
            )
          })}
          {aiLoading && (
            <div className="flex gap-2.5 max-w-[90%] items-start self-end flex-row" style={{ direction: 'rtl' }}>
              <div className="w-7 h-7 rounded-lg flex items-center justify-center shrink-0 bg-gradient-to-br from-teal-500 to-emerald-500 text-white shadow-md">
                <Sparkles size={12} className="animate-spin" />
              </div>
              <div className="bg-white/[0.04] border border-white/5 text-white/60 p-3 rounded-xl rounded-tl-none text-xs flex items-center gap-2">
                <Loader2 size={12} className="animate-spin text-indigo-400 shrink-0" />
                جاري التفكير وصياغة الشرح...
              </div>
            </div>
          )}
          <div ref={chatEndRef} />
        </div>

        {/* Input Form */}
        <form onSubmit={handleSendMessage} className="p-3 bg-black/50 border-t border-white/5 flex gap-2 items-center">
          <input
            type="text"
            value={inputMessage}
            onChange={(e) => setInputMessage(e.target.value)}
            placeholder={isRecording ? "جاري الاستماع للتسجيل الصوتي..." : "اسألني عن المعادلة أو الكود..."}
            disabled={isRecording}
            className="flex-1 bg-white/5 rounded-lg px-3 py-2.5 text-xs outline-none text-white focus:bg-white/10 transition-colors placeholder:text-white/30"
            style={{ direction: 'rtl' }}
          />
          
          <button 
            type="button"
            onClick={isRecording ? stopRecording : startRecording}
            className={`p-2 rounded-lg text-white transition-all ${
              isRecording ? 'bg-red-500 animate-pulse' : 'bg-white/5 hover:bg-white/10'
            }`}
            title={isRecording ? "إيقاف التسجيل والإرسال" : "إملاء صوتي"}
          >
            {isRecording ? <MicOff size={14} /> : <Mic size={14} />}
          </button>

          <button 
            type="submit"
            disabled={aiLoading || !inputMessage.trim() || isRecording}
            className="p-2.5 rounded-lg text-white disabled:opacity-40 transition-all hover:scale-105 shrink-0"
            style={{ background: theme.colors.accent }}
          >
            <Send size={12} />
          </button>
        </form>
      </div>
    )
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
              {(() => {
                const paragraphs = selectedLesson.content.split('\n\n')
                const isQuizPassed = completedQuizzes[selectedLesson.id] || false
                const quizIndex = Math.min(1, paragraphs.length - 1)

                const renderParagraphContent = (paragraph: string, idx: number) => {
                  if (paragraph.startsWith('### ')) {
                    return <h3 className="text-2xl font-bold text-white mt-8 mb-4">{paragraph.replace('### ', '')}</h3>
                  }
                  if (paragraph.startsWith('#### ')) {
                    return <h4 className="text-lg font-bold text-white/90 mt-6 mb-3">{paragraph.replace('#### ', '')}</h4>
                  }
                  if (paragraph.startsWith('* ')) {
                    return (
                      <ul className="list-disc pr-6 space-y-2 text-white/80">
                        {paragraph.split('\n').map((li, lIndex) => (
                          <li key={lIndex}>{li.replace('* ', '')}</li>
                        ))}
                      </ul>
                    )
                  }
                  if (paragraph.startsWith('1. ')) {
                    return (
                      <ol className="list-decimal pr-6 space-y-2 text-white/80">
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
                  return <p className="leading-relaxed text-white/80 text-base">{paragraph}</p>
                }

                return paragraphs.map((paragraph, index) => {
                  const isBlurred = !isQuizPassed && index > quizIndex
                  const renderedParagraph = (
                    <div 
                      key={index} 
                      className={`transition-all duration-500 ${
                        isBlurred ? 'blur-[6px] select-none pointer-events-none opacity-25' : ''
                      }`}
                    >
                      {renderParagraphContent(paragraph, index)}
                    </div>
                  )

                  if (index === quizIndex && !isQuizPassed) {
                    return (
                      <div key={`wrapper-${index}`} className="space-y-6">
                        {renderedParagraph}
                        <div className="my-8">
                          <ComprehensionQuizCard 
                            lessonId={selectedLesson.id} 
                            onPass={() => setCompletedQuizzes(prev => ({ ...prev, [selectedLesson.id]: true }))} 
                          />
                        </div>
                      </div>
                    )
                  }

                  if (index === quizIndex && isQuizPassed) {
                    return (
                      <div key={`wrapper-${index}`} className="space-y-6">
                        {renderedParagraph}
                        <div 
                          className="p-3.5 rounded-xl text-xs font-bold text-center border transition-all duration-300"
                          style={{
                            backgroundColor: 'rgba(34, 197, 94, 0.04)',
                            borderColor: 'rgba(34, 197, 94, 0.15)',
                            color: '#4ade80'
                          }}
                        >
                          ✓ لقد اجتزت سؤال الفهم السريع لهذا القسم بنجاح! تم عرض بقية الدرس.
                        </div>
                      </div>
                    )
                  }

                  return renderedParagraph
                })
              })()}
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

        {/* AI Assistant Chat Panel (Desktop Sidebar) */}
        {showAIAssistant && (
          <div className="hidden xl:block">
            {renderChatPanel(false)}
          </div>
        )}

        {/* AI Assistant Chat Panel (Mobile Slide-up Bottom Sheet) */}
        {showAIAssistant && (
          <div className="fixed inset-0 z-50 bg-black/70 backdrop-blur-sm flex items-end justify-center xl:hidden" onClick={() => setShowAIAssistant(false)}>
            <motion.div 
              initial={{ y: '100%' }} 
              animate={{ y: 0 }} 
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="w-full max-h-[85vh] bg-[#0c101b] rounded-t-3xl border-t border-white/10 flex flex-col overflow-hidden"
              onClick={(e: React.MouseEvent) => e.stopPropagation()}
            >
              {/* Swipe/Drag Indicator bar */}
              <div className="w-12 h-1.5 bg-white/10 rounded-full mx-auto my-3 shrink-0" />
              <div className="flex-1 overflow-hidden">
                {renderChatPanel(true)}
              </div>
            </motion.div>
          </div>
        )}

        {/* Floating action button on mobile when chat is closed */}
        {!showAIAssistant && (
          <motion.button 
            initial={{ scale: 0, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            onClick={() => setShowAIAssistant(true)}
            className="fixed bottom-6 right-6 z-40 xl:hidden w-14 h-14 rounded-full flex items-center justify-center text-white shadow-2xl hover:scale-105 active:scale-95 transition-all"
            style={{ 
              background: `linear-gradient(135deg, ${theme.colors.accent}, ${theme.colors.secondary})`,
              boxShadow: `0 8px 30px ${theme.colors.accent}40`
            }}
          >
            <Sparkles size={22} className={aiLoading ? 'animate-pulse' : ''} />
          </motion.button>
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
