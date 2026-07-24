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

  // Direct Client-Side Fallback Generator using OpenRouter / Gemini API or Intelligent Knowledge Engine
  const generateClientSideExplanation = async (queryText: string, options?: VoiceTutorOptions): Promise<string> => {
    const openrouterKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('openrouter_api_key') || localStorage.getItem('masar-openrouter-key')) : ''
    const geminiKey = typeof localStorage !== 'undefined' ? (localStorage.getItem('gemini_api_key') || localStorage.getItem('masar-gemini-key')) : ''

    const promptText = `
أنت "المعلم الصوتي الذكي" لمنصة مسار التفاعلية للبرمجة والذكاء الاصطناعي.
السؤال أو الطلب: ${queryText}
${options?.codeContext ? `كود البرمجة المرتبط:\n\`\`\`\n${options.codeContext}\n\`\`\`` : ''}
${options?.errorContext ? `رسالة الخطأ:\n\`\`\`\n${options.errorContext}\n\`\`\`` : ''}

قم بالرد بإجابة تعليمية ممتازة، واضحة، باللغة ${language === 'ar' ? 'العربية' : 'الإلكترونية الإنجليزية'}. استخدم التنسيق المنظم والنقاط.
`

    // Try OpenRouter API if key available
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

    // Try Gemini Direct API if key available
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

    // Intelligent Offline Arabic/English Tutor Engine Response
    const lower = queryText.toLowerCase()

    if (lower.includes('ماذا') || lower.includes('مين') || lower.includes('مين انت') || lower.includes('تفعل') || lower.includes('تستطيع') || lower.includes('شنو تقدر') || lower.includes('what can you do')) {
      return language === 'ar'
        ? `أهلاً بك! أنا **المعلم الصوتي الذكي** الخاص بك في منصة مسار. 🚀\n\nيمكنني مساعدتك في الأنشطة التالية:\n\n1. **شرح وتفسير أسطر الكود**: تحليل وشرح مفصل لكود البرمجة بلغات Python و JavaScript.\n2. **تصحيح الأخطاء (Debugging)**: مراجعة الكود واكتشاف الأخطاء وتوفير الحل الصحيح فوراً.\n3. **التحدث الصوتي التفاعلي**: يمكنك التحدث معي بالميكروفون وسأجيبك صوتياً وكتابياً.\n4. **شرح مفاهيم الذكاء الاصطناعي**: شرح الخوارزميات، التعلم العميق، والشبكات العصبية بشكل مبسط.\n\nكيف يمكنني مساعدتك الآن في كودك أو دراستك؟`
        : `Hello! I am your **AI Voice Tutor** on the Masar platform. 🚀\n\nHere is how I can assist you:\n\n1. **Code Explanations**: Deep dive into Python & JavaScript code snippets.\n2. **Debugging**: Fix syntax and logic bugs with instant remedies.\n3. **Interactive Voice Commands**: Speak with me via mic for spoken & text explanations.\n4. **AI Concepts**: Simplify deep learning, neural networks, and ML algorithms.`
    }

    if (lower.includes('خطأ') || lower.includes('error') || lower.includes('مشكلة') || lower.includes('fix')) {
      return language === 'ar'
        ? `بناءً على طلبك، سأقوم بمراجعة الخطأ فوراً:\n\n- يُرجى التأكد من تعريف المتغيرات ونوع البيانات المُدخلة.\n- تحقق من عدم وجود أخطاء إملائية في أسماء الدوال والمكتبات المستوردة.\n- إذا كنت تستخدم خادماً خلفياً، تأكد من استجابة المسار المطلوب.`
        : `Let's review the error together:\n\n- Ensure all variables and data types are correctly declared.\n- Verify library imports and function signatures.\n- Double-check API endpoint routes if connecting to backend.`
    }

    return language === 'ar'
      ? `أهلاً بك! إجابةً على طلبك: "${queryText}"\n\nأنا هنا لمساعدتك في استكشاف كود البرمجة ومفاهيم الذكاء الاصطناعي. يمكنك استخدام الميكروفون أو كتابة أي سؤال عن الكود والمختبر الذكي وسأقوم بشرحه وتوضيحه لك خطوة بخطوة!`
      : `Welcome! Regarding your request: "${queryText}"\n\nI am here to guide you through code analysis and AI concepts. Feel free to ask questions or record voice notes for step-by-step assistance!`
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

          const audioBlob = new Blob(audioChunksRef.current, { type: 'audio/webm' })

          // Convert speech to query text using Web Speech API fallback or backend
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
            // Fallback default query
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
