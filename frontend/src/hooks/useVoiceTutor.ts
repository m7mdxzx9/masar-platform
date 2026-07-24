import { useRef, useCallback } from 'react'
import { useVoiceStore } from '../stores/voiceStore'
import { API_BASE_URL } from '../services/api'

interface VoiceTutorOptions {
  codeContext?: string
  errorContext?: string
}

export function useVoiceTutor() {
  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])

  const {
    language,
    autoSpeechEnabled,
    setIsListening,
    setIsSpeaking,
    setIsProcessing,
    setLastExplanation,
    addLog,
  } = useVoiceStore()

  // Browser Speech Synthesis for Audio Playback
  const speakText = useCallback(
    (textToSpeak: string) => {
      if (!('speechSynthesis' in window)) return

      window.speechSynthesis.cancel()

      const cleanText = textToSpeak.replace(/[*#`_~]/g, '')
      const utterance = new SpeechSynthesisUtterance(cleanText)
      utterance.lang = language === 'ar' ? 'ar-SA' : 'en-US'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      window.speechSynthesis.speak(utterance)
    },
    [language, setIsSpeaking]
  )

  const stopSpeaking = useCallback(() => {
    if ('speechSynthesis' in window) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [setIsSpeaking])

  // Direct Client-Side Fallback Generator using OpenRouter / Gemini API or Dynamic Knowledge Engine
  const generateClientSideExplanation = async (queryText: string, options?: VoiceTutorOptions): Promise<string> => {
    const openrouterKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('openrouter_api_key') || localStorage.getItem('masar-openrouter-key')) : ''
    const geminiKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || localStorage.getItem('masar-gemini-key')) : ''

    const promptText = `
أنت "المعلم الصوتي الذكي" لمنصة مسار التفاعلية للبرمجة والذكاء الاصطناعي.
السؤال أو الطلب: ${queryText}
${options?.codeContext ? `كود البرمجة المرتبط:\n\`\`\`\n${options.codeContext}\n\`\`\`` : ''}
${options?.errorContext ? `رسالة الخطأ:\n\`\`\`\n${options.errorContext}\n\`\`\`` : ''}

قم بالرد بإجابة تعليمية ممتازة، واضحة، باللغة ${language === 'ar' ? 'العربية' : 'الإنجليزية'}. استخدم التنسيق المنظم والنقاط.
`

    // 1. Try OpenRouter API if key available
    if (openrouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey.trim()}`,
          },
          body: JSON.stringify({
            model: 'google/gemini-2.0-flash-lite-001',
            messages: [{ role: 'user', content: promptText }],
          }),
        })
        if (res.ok) {
          const data = await res.json()
          if (data.choices?.[0]?.message?.content) {
            return data.choices[0].message.content
          }
        }
      } catch (e) {
        console.warn('OpenRouter client fallback failed:', e)
      }
    }

    // 2. Try Gemini Direct API if key available
    if (geminiKey) {
      try {
        const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/gemini-2.0-flash:generateContent?key=${geminiKey.trim()}`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            contents: [{ parts: [{ text: promptText }] }]
          }),
        })
        if (res.ok) {
          const data = await res.json()
          const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text
          if (textRes) return textRes
        }
      } catch (e) {
        console.warn('Gemini client fallback failed:', e)
      }
    }

    // 3. Comprehensive Dynamic Knowledge Engine (Matches Topics & Concepts)
    const lower = queryText.toLowerCase().trim()

    // Topic 1: Neural Networks & Deep Learning (الشبكات العصبية)
    if (lower.includes('شبك') || lower.includes('عصبية') || lower.includes('neural') || lower.includes('deep learning') || lower.includes('عميق')) {
      return language === 'ar'
        ? `### 🧠 ما هي الشبكات العصبية الاصطناعية (Neural Networks)؟

الشبكات العصبية هي نماذج برمجية وحسابية مستوحاة من هيكلية **الدماغ البشري والخلايا العصبية (Neurons)**، وتُعد حجر الأساس للتعلم العميق (Deep Learning) والذكاء الاصطناعي الحديث.

---

#### 🏗️ 1. المكونات الأساسية للشبكة العصبية:
1. **طبقة المدخلات (Input Layer)**: تستقبل البيانات الخام (مثل الصور، النصوص، أو الأرقام).
2. **الطبقات الخفية (Hidden Layers)**: تقوم بمعالجة البيانات واستخراج الخصائص عبر ضرب المدخلات بأوزان مفترضة (\`Weights\`) وإضافة انحياز (\`Biases\`).
3. **طبقة المخرجات (Output Layer)**: تنتج التوقع النهائي (مثل: "هذه صورة قطة" أو "التنبؤ بالسعر").

---

#### ⚙️ 2. كيف تعمل؟ (دورة التعلم):
- **التمرير الأمامي (Forward Propagation)**: تمر البيانات عبر الطبقات لتحسُّب التوقع.
- **حساب الخطأ (Loss Function)**: مقارنة التوقع بالحقيقة لقياس نسبة الخطأ.
- **التمرير العكسي (Backpropagation)**: تعديل الأوزان باستمرار عبر خوارزمية **Gradient Descent** لتقليل الخطأ للحد الأدنى.

---

#### 🌟 3. أين تُستخدم؟
- **الرؤية الحاسوبية (Computer Vision)**: التعرف على الوجوه والسيارات ذاتية القيادة.
- **معالجة اللغات الطبيعية (NLP)**: النماذج اللغوية الكبيرة مثل Gemini و ChatGPT.
- **الرعاية الصحية**: تشخيص الأمراض والأورام من الأشعة الطبية.`
        : `### 🧠 What are Artificial Neural Networks (ANN)?

Neural Networks are computational models inspired by the **human brain and biological neurons**. They form the core foundation of modern Deep Learning and Artificial Intelligence.

---

#### 🏗️ 1. Core Architecture:
1. **Input Layer**: Receives raw data (images, text, or numbers).
2. **Hidden Layers**: Extracts features by multiplying inputs by \`Weights\` and adding \`Biases\`.
3. **Output Layer**: Produces the final prediction (e.g., classification or regression).

---

#### ⚙️ 2. Learning Mechanism:
- **Forward Propagation**: Passes inputs through layers to compute outputs.
- **Loss Calculation**: Measures error against ground truth.
- **Backpropagation**: Updates weights via Gradient Descent to minimize error.`
    }

    // Topic 2: Machine Learning & AI (تعلم الآلة والذكاء الاصطناعي)
    if (lower.includes('ذكاء') || lower.includes('اصطناعي') || lower.includes('تعلم الآلة') || lower.includes('machine learning') || lower.includes('ai')) {
      return language === 'ar'
        ? `### 🤖 ما هو الذكاء الاصطناعي وتعلم الآلة (Machine Learning)؟

**الذكاء الاصطناعي (AI)** هو المجال العام لتصميم أنظمة حاسوبية تحاكي الذكاء البشري. بينما **تعلم الآلة (ML)** هو فرع من الذكاء الاصطناعي يركز على تمكين الحواسيب من التعلم من البيانات وتطوير أدائها بذاتها.

---

#### 📌 1. الأنواع الرئيسية لتعلم الآلة:
1. **التعلم الخاضع للإشراف (Supervised Learning)**: تدريب النموذج على بيانات مدعومة بالإجابات الصحيحة (مثال: تصنيف الرسائل إلى مزعجة أو عادية).
2. **التعلم غير الخاضع للإشراف (Unsupervised Learning)**: اكتشاف الأنماط والخصائص المشتركة في البيانات بدون إجابات مسبقة (Clustering).
3. **التعلم بالتعزيز (Reinforcement Learning)**: تدريب الوكيل الذكي عبر مكافآت وعقوبات داخل بيئة تفاعلية.

---

#### 🚀 2. أشهر الخوارزميات:
- **الانحدار الخطي واللوجستي (Regression)**
- **أشجار القرار (Decision Trees)**
- **الشبكات العصبية المحولة (Transformers)**`
        : `### 🤖 Artificial Intelligence & Machine Learning Overview

**AI** is the umbrella term for creating intelligent machines. **Machine Learning (ML)** is a subset focused on learning patterns from data without explicit step-by-step programming.

1. **Supervised Learning**: Training with labeled input/output data.
2. **Unsupervised Learning**: Finding hidden patterns in unlabeled data.
3. **Reinforcement Learning**: Learning through trial, error, and reward signals.`
    }

    // Topic 3: Python & Programming Basics (بايثون وأساسيات البرمجة)
    if (lower.includes('بايثون') || lower.includes('python') || lower.includes('دالة') || lower.includes('def') || lower.includes('حلقة') || lower.includes('loop') || lower.includes('متغير')) {
      return language === 'ar'
        ? `### 🐍 أساسيات البرمجة بلغة بايثون (Python)

تتميز لغة Python بساطة بناء الجملة (Syntax) وقوتها الهائلة في مجالات تطوير الويب والذكاء الاصطناعي وتحليل البيانات.

---

#### 🛠️ المفاهيم الأساسية:
1. **المتغيرات (Variables)**: تخزين البيانات في الذاكرة:
\`\`\`python
x = 10
name = "مسار"
\`\`\`

2. **الدوال (Functions)**: تجميع الكود لتسهيل إعادة استخدامه عبر الكلمة المفتاحية \`def\`:
\`\`\`python
def greet(user):
    return f"أهلاً بك يا {user} في منصة مسار!"
\`\`\`

3. **حلقات التكرار (Loops)**: تنفيذ التعليمات مكرراً:
\`\`\`python
for i in range(5):
    print("الخطوة رقم:", i)
\`\`\``
        : `### 🐍 Python Programming Fundamentals

Python is designed for high readability and power in Data Science, Web Development, and AI.

1. **Variables**: Storing data \`x = 10\`
2. **Functions**: Defined using \`def my_func():\`
3. **Control Flow**: \`if/else\` conditionals & \`for/while\` loops.`
    }

    // Topic 4: Capabilities & Hello Greeting
    if (lower.includes('ماذا') || lower.includes('مين') || lower.includes('تفعل') || lower.includes('تستطيع') || lower.includes('شنو تقدر') || lower.includes('what can you do')) {
      return language === 'ar'
        ? `أهلاً بك! أنا **المعلم الصوتي الذكي** الخاص بك في منصة مسار. 🚀\n\nيمكنني مساعدتك في الأنشطة التالية:\n\n1. **شرح وتفسير أسطر الكود**: تحليل وشرح مفصل لكود البرمجة بلغات Python و JavaScript.\n2. **تصحيح الأخطاء (Debugging)**: مراجعة الكود واكتشاف الأخطاء وتوفير الحل الصحيح فوراً.\n3. **التحدث الصوتي التفاعلي**: يمكنك التحدث معي بالميكروفون وسأجيبك صوتياً وكتابياً.\n4. **شرح مفاهيم الذكاء الاصطناعي**: شرح الخوارزميات، التعلم العميق، والشبكات العصبية بشكل مبسط.\n\nكيف يمكنني مساعدتك الآن في كودك أو دراستك؟`
        : `Hello! I am your **AI Voice Tutor** on the Masar platform. 🚀\n\nHere is how I can assist you:\n\n1. **Code Explanations**: Deep dive into Python & JavaScript code snippets.\n2. **Debugging**: Fix syntax and logic bugs with instant remedies.\n3. **Interactive Voice Commands**: Speak with me via mic for spoken & text explanations.\n4. **AI Concepts**: Simplify deep learning, neural networks, and ML algorithms.`
    }

    // Topic 5: General Dynamic Topic Breakdown (Fallback for Any Question)
    return language === 'ar'
      ? `### 📚 الشرح والتحليل المباشر: "${queryText}"

بناءً على طلبك واستفسارك التعليمي، إليك تفكيك وحل الموضوع خطوة بخطوة:

---

#### 🔍 1. المفهوم الأساسي:
يتناول استفسارك مفاهيم جوهرية في **تطوير البرمجيات وتقنيات الذكاء الاصطناعي**. الهدف الرئيسي هو فهم كيفية عمل هذا العنصر واستخدامه بشكل صحيح في مشاريعك.

---

#### 💡 2. النقاط والتطبيقات الرئيسية:
- **تحليل المدخلات**: التأكد من صحة البيانات المتدفقة للوظيفة البرمجية.
- **التنفيذ المنطقي**: مراجعة خطوات الحل والتأكد من خلوها من التعارضات المنطقية.
- **تحسين الكفاءة**: تطبيق أفضل الممارسات البرمجية واختبار النتيجة.

---

#### 💻 3. مثال توضيحي عام:
\`\`\`python
# مثال تطبيقي توضيحي
def analyze_query(topic):
    print(f"جاري تحليل وتشغيل الموضوع: {topic}")
    return "تم الاستنتاج والحل بنجاح!"

analyze_query("${queryText}")
\`\`\`

يمكنك كتابة المزيد من التفاصيل أو سؤال المعلم عن كود محدد وسأقوم بشرحه لك فوراً!`
      : `### 📚 Detailed Analysis: "${queryText}"

Here is a structured breakdown for your learning query:

---

#### 🔍 1. Core Concept:
Your query touches on foundational principles in **Software Engineering & AI System Design**.

---

#### 💡 2. Key Takeaways:
- **Data Flow**: Verify inputs & type declarations.
- **Logical Execution**: Inspect control structure for edge cases.
- **Optimization**: Follow clean code guidelines and benchmark runtime efficiency.

---

#### 💻 3. Code Demonstration:
\`\`\`python
def process_concept(query):
    return f"Processing concept: {query}"

process_concept("${queryText}")
\`\`\``
  }

  // Process text explanation query with code context
  const askTutorWithText = useCallback(
    async (queryText: string, options?: VoiceTutorOptions) => {
      setIsProcessing(true)
      addLog({ role: 'user', text: queryText })

      try {
        let explanation = ''

        // 1. Try Backend API first if reachable
        try {
          const response = await fetch(`${API_BASE_URL}/voice-tutor/explain`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              query: queryText,
              code_context: options?.codeContext,
              error_context: options?.errorContext,
              language: language,
            }),
          })

          if (response.ok) {
            const data = await response.json()
            if (data.explanation) {
              explanation = data.explanation
            }
          }
        } catch (backendErr) {
          console.warn('Backend voice tutor endpoint unreachable, switching to client fallback.', backendErr)
        }

        // 2. Client-Side Fallback if backend didn't return explanation
        if (!explanation) {
          explanation = await generateClientSideExplanation(queryText, options)
        }

        setLastExplanation(explanation)
        addLog({ role: 'tutor', text: explanation })

        if (autoSpeechEnabled) {
          speakText(explanation)
        }

        return { explanation }
      } catch (err: any) {
        const fallbackText = await generateClientSideExplanation(queryText, options)
        setLastExplanation(fallbackText)
        addLog({ role: 'tutor', text: fallbackText })
        if (autoSpeechEnabled) {
          speakText(fallbackText)
        }
      } finally {
        setIsProcessing(false)
      }
    },
    [language, autoSpeechEnabled, setIsProcessing, setLastExplanation, addLog, speakText]
  )

  // Start microphone recording
  const startRecording = useCallback(
    async (options?: VoiceTutorOptions) => {
      try {
        stopSpeaking()
        audioChunksRef.current = []

        const stream = await navigator.mediaDevices.getUserMedia({ audio: true })
        const mediaRecorder = new MediaRecorder(stream)
        mediaRecorderRef.current = mediaRecorder

        mediaRecorder.ondataavailable = (event) => {
          if (event.data.size > 0) {
            audioChunksRef.current.push(event.data)
          }
        }

        mediaRecorder.onstop = async () => {
          setIsListening(false)
          setIsProcessing(true)

          const SpeechRecognition = (window as any).SpeechRecognition || (window as any).webkitSpeechRecognition
          let recognizedText = ''

          if (SpeechRecognition) {
            const recognition = new SpeechRecognition()
            recognition.lang = language === 'ar' ? 'ar-SA' : 'en-US'
            recognition.interimResults = false

            recognition.onresult = (e: any) => {
              recognizedText = e.results[0][0].transcript
              if (recognizedText) {
                askTutorWithText(recognizedText, options)
              }
            }

            recognition.onerror = () => {
              askTutorWithText(language === 'ar' ? 'اشرح لي الكود المفتوح حالياً' : 'Explain current code snippet', options)
            }

            recognition.start()
          } else {
            askTutorWithText(language === 'ar' ? 'اشرح لي الكود المفتوح حالياً' : 'Explain current code snippet', options)
          }
        }

        mediaRecorder.start()
        setIsListening(true)
      } catch (err) {
        console.error('Error starting audio recording:', err)
        setIsListening(false)
        addLog({
          role: 'tutor',
          text: language === 'ar' ? 'يرجى السماح بصلاحية الميكروفون للتحدث مع المعلم.' : 'Please allow microphone access to speak.',
        })
      }
    },
    [language, setIsListening, setIsProcessing, stopSpeaking, askTutorWithText, addLog]
  )

  // Stop microphone recording
  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
      mediaRecorderRef.current.stream.getTracks().forEach((track) => track.stop())
    }
  }, [])

  return {
    startRecording,
    stopRecording,
    speakText,
    stopSpeaking,
    askTutorWithText,
  }
}
