import { useRef, useCallback } from 'react'
import { useVoiceStore } from '../stores/voiceStore'

const API_BASE = '/api/v1'

export interface VoiceTutorOptions {
  codeContext?: string
  errorContext?: string
}

export function useVoiceTutor() {
  const {
    isListening,
    isSpeaking,
    isProcessing,
    language,
    autoSpeechEnabled,
    setIsListening,
    setIsSpeaking,
    setIsProcessing,
    setTranscript,
    setLastExplanation,
    addLog,
  } = useVoiceStore()

  const mediaRecorderRef = useRef<MediaRecorder | null>(null)
  const audioChunksRef = useRef<Blob[]>([])
  const synthesisRef = useRef<SpeechSynthesisUtterance | null>(null)

  // Speak text aloud using browser SpeechSynthesis
  const speakText = useCallback(
    (text: string, overrideLang?: 'ar' | 'en') => {
      if (!window.speechSynthesis) return

      window.speechSynthesis.cancel()

      const targetLang = overrideLang || language
      const utterance = new SpeechSynthesisUtterance(text)
      utterance.lang = targetLang === 'ar' ? 'ar-SA' : 'en-US'
      utterance.rate = 1.0
      utterance.pitch = 1.0

      // Attempt to pick best neural voice if available
      const voices = window.speechSynthesis.getVoices()
      const matchedVoice = voices.find(
        (v) => v.lang.startsWith(targetLang === 'ar' ? 'ar' : 'en') && (v.name.includes('Neural') || v.name.includes('Natural') || v.name.includes('Google'))
      ) || voices.find((v) => v.lang.startsWith(targetLang === 'ar' ? 'ar' : 'en'))

      if (matchedVoice) {
        utterance.voice = matchedVoice
      }

      utterance.onstart = () => setIsSpeaking(true)
      utterance.onend = () => setIsSpeaking(false)
      utterance.onerror = () => setIsSpeaking(false)

      synthesisRef.current = utterance
      window.speechSynthesis.speak(utterance)
    },
    [language, setIsSpeaking]
  )

  const stopSpeaking = useCallback(() => {
    if (window.speechSynthesis) {
      window.speechSynthesis.cancel()
    }
    setIsSpeaking(false)
  }, [setIsSpeaking])

  // Process text explanation query with code context
  const askTutorWithText = useCallback(
    async (queryText: string, options?: VoiceTutorOptions) => {
      setIsProcessing(true)
      addLog({ role: 'user', text: queryText })

      try {
        const response = await fetch(`${API_BASE}/voice-tutor/explain`, {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            query: queryText,
            code_context: options?.codeContext,
            error_context: options?.errorContext,
            language: language,
          }),
        })

        if (!response.ok) {
          throw new Error(`Voice tutor error: ${response.statusText}`)
        }

        const data = await response.json()
        const explanation = data.explanation || 'عفواً، لم أتمكن من استخراج إجابة مناسبة.'

        setLastExplanation(explanation)
        addLog({ role: 'tutor', text: explanation })

        if (autoSpeechEnabled) {
          speakText(explanation)
        }

        return data
      } catch (err: any) {
        const errorMsg = language === 'ar' ? 'حدث خطأ أثناء التواصل مع المعلم الصوتي.' : 'Error contacting Voice Tutor.'
        setLastExplanation(errorMsg)
        addLog({ role: 'tutor', text: errorMsg })
        console.error(err)
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
          const formData = new FormData()
          formData.append('audio', audioBlob, 'mic_recording.webm')
          if (options?.codeContext) formData.append('code_context', options.codeContext)
          if (options?.errorContext) formData.append('error_context', options.errorContext)
          formData.append('language', language)

          try {
            const response = await fetch(`${API_BASE}/voice-tutor/upload-audio`, {
              method: 'POST',
              body: formData,
            })

            if (!response.ok) {
              throw new Error(`Audio upload failed: ${response.statusText}`)
            }

            const data = await response.json()
            if (data.transcription) {
              setTranscript(data.transcription)
              addLog({ role: 'user', text: data.transcription })
            }

            const explanation = data.explanation || ''
            setLastExplanation(explanation)
            addLog({ role: 'tutor', text: explanation })

            if (autoSpeechEnabled && explanation) {
              speakText(explanation)
            }
          } catch (error) {
            console.error('Audio upload error:', error)
          } finally {
            setIsProcessing(false)
            // Stop mic track streams
            stream.getTracks().forEach((track) => track.stop())
          }
        }

        mediaRecorder.start()
        setIsListening(true)
      } catch (err) {
        console.error('Failed to access microphone:', err)
        setIsListening(false)
      }
    },
    [language, autoSpeechEnabled, setIsListening, setIsProcessing, setTranscript, setLastExplanation, addLog, speakText, stopSpeaking]
  )

  const stopRecording = useCallback(() => {
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop()
    }
  }, [])

  return {
    isListening,
    isSpeaking,
    isProcessing,
    language,
    autoSpeechEnabled,
    startRecording,
    stopRecording,
    speakText,
    stopSpeaking,
    askTutorWithText,
  }
}
