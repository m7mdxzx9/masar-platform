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

  // Helper to scan for Gemini API Key across all possible locations
  const getStoredGeminiKey = (): string => {
    if (typeof localStorage === 'undefined') return ''
    const possibleKeys = [
      'gemini_api_key',
      'GEMINI_API_KEY',
      'google_api_key',
      'GOOGLE_API_KEY',
      'masar-gemini-key',
      'masar_gemini_key',
      'masar-google-key',
      'user_gemini_key',
    ]
    for (const k of possibleKeys) {
      const val = localStorage.getItem(k)
      if (val && val.trim()) return val.trim()
    }
    // Check Vite env
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env) {
      // @ts-ignore
      if (import.meta.env.VITE_GEMINI_API_KEY) return import.meta.env.VITE_GEMINI_API_KEY.trim()
      // @ts-ignore
      if (import.meta.env.VITE_GOOGLE_API_KEY) return import.meta.env.VITE_GOOGLE_API_KEY.trim()
    }
    return ''
  }

  // Helper to scan for OpenRouter Key
  const getStoredOpenRouterKey = (): string => {
    if (typeof localStorage === 'undefined') return ''
    const possibleKeys = [
      'openrouter_api_key',
      'OPENROUTER_API_KEY',
      'masar-openrouter-key',
      'masar_openrouter_key',
    ]
    for (const k of possibleKeys) {
      const val = localStorage.getItem(k)
      if (val && val.trim()) return val.trim()
    }
    // @ts-ignore
    if (typeof import.meta !== 'undefined' && import.meta.env && import.meta.env.VITE_OPENROUTER_API_KEY) {
      // @ts-ignore
      return import.meta.env.VITE_OPENROUTER_API_KEY.trim()
    }
    return ''
  }

  // Direct Client-Side Generator calling Google Gemini API or OpenRouter API directly
  const generateClientSideExplanation = async (queryText: string, options?: VoiceTutorOptions): Promise<string> => {
    const geminiKey = getStoredGeminiKey()
    const openrouterKey = getStoredOpenRouterKey()

    const promptText = `
أنت "المعلم الصوتي الذكي" لمنصة مسار التفاعلية للبرمجة والذكاء الاصطناعي.
السؤال أو الطلب: ${queryText}
${options?.codeContext ? `كود البرمجة المرتبط:\n\`\`\`\n${options.codeContext}\n\`\`\`` : ''}
${options?.errorContext ? `رسالة الخطأ:\n\`\`\`\n${options.errorContext}\n\`\`\`` : ''}

قم بالرد بإجابة تعليمية ممتازة، تفصيلية وشاملة، باللغة ${language === 'ar' ? 'العربية' : 'الإلكترونية الإنجليزية'}. استخدم التنسيق المنظم والنقاط.
`

    // 1. Direct Live Call to Google Gemini REST API if Gemini key exists
    if (geminiKey) {
      const geminiModels = ['gemini-2.0-flash', 'gemini-1.5-flash', 'gemini-1.5-pro', 'gemini-2.5-flash']
      for (const model of geminiModels) {
        try {
          const res = await fetch(`https://generativelanguage.googleapis.com/v1beta/models/${model}:generateContent?key=${geminiKey}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
              contents: [{ parts: [{ text: promptText }] }]
            }),
          })
          if (res.ok) {
            const data = await res.json()
            const textRes = data.candidates?.[0]?.content?.parts?.[0]?.text
            if (textRes && textRes.trim()) {
              console.log(`[VoiceTutor] Responded successfully via Gemini API model (${model})`)
              return textRes
            }
          }
        } catch (e) {
          console.warn(`[VoiceTutor] Gemini API model ${model} fetch failed:`, e)
        }
      }
    }

    // 2. Direct Live Call to OpenRouter API if OpenRouter key exists
    if (openrouterKey) {
      try {
        const res = await fetch('https://openrouter.ai/api/v1/chat/completions', {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json',
            'Authorization': `Bearer ${openrouterKey}`,
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
        console.warn('[VoiceTutor] OpenRouter client fallback failed:', e)
      }
    }

    // 3. Dynamic Topic Knowledge Base Fallback
    const lower = queryText.toLowerCase().trim()

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

Neural Networks are computational models inspired by the **human brain and biological neurons**. They form the core foundation of modern Deep Learning and Artificial Intelligence.`
    }

    if (lower.includes('ذكاء') || lower.includes('اصطناعي') || lower.includes('تعلم الآلة') || lower.includes('machine learning') || lower.includes('ai')) {
      return language === 'ar'
        ? `### 🤖 ما هو الذكاء الاصطناعي وتعلم الآلة (Machine Learning)؟

**الذكاء الاصطناعي (AI)** هو المجال العام لتصميم أنظمة حاسوبية تحاكي الذكاء البشري. بينما **تعلم الآلة (ML)** هو فرع من الذكاء الاصطناعي يركز على تمكين الحواسيب من التعلم من البيانات وتطوير أدائها بذاتها.`
        : `### 🤖 Artificial Intelligence & Machine Learning Overview`
    }

    if (lower.includes('بايثون') || lower.includes('python') || lower.includes('دالة') || lower.includes('def') || lower.includes('حلقة') || lower.includes('loop') || lower.includes('متغير')) {
      return language === 'ar'
        ? `### 🐍 أساسيات البرمجة بلغة بايثون (Python)

تتميز لغة Python بساطة بناء الجملة (Syntax) وقوتها الهائلة في مجالات تطوير الويب والذكاء الاصطناعي وتحليل البيانات.`
        : `### 🐍 Python Programming Fundamentals`
    }

    return language === 'ar'
      ? `### 📚 التحليل والشرح المباشر: "${queryText}"

يتناول استفسارك مفاهيم جوهرية في البرمجة والذكاء الاصطناعي. يمكنك استخدام أيقونة المفتاح (🔑) في الأعلى لإدخال مفتاح Gemini API وتفعيل الرد اللحظي من خوادم Google!`
      : `### 📚 Analysis: "${queryText}"`
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
          console.warn('Backend voice tutor endpoint unreachable, switching to direct client AI call.', backendErr)
        }

        // 2. Direct Gemini / OpenRouter Client Call or Fallback
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
