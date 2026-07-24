import { create } from 'zustand'

export interface VoiceLog {
  id: string
  role: 'user' | 'tutor'
  text: string
  timestamp: Date
}

interface VoiceStore {
  isListening: boolean
  isSpeaking: boolean
  isProcessing: boolean
  language: 'ar' | 'en'
  autoSpeechEnabled: boolean
  transcript: string
  lastExplanation: string
  logs: VoiceLog[]

  setIsListening: (val: boolean) => void
  setIsSpeaking: (val: boolean) => void
  setIsProcessing: (val: boolean) => void
  setLanguage: (lang: 'ar' | 'en') => void
  setAutoSpeechEnabled: (enabled: boolean) => void
  setTranscript: (text: string) => void
  setLastExplanation: (text: string) => void
  addLog: (log: Omit<VoiceLog, 'id' | 'timestamp'>) => void
  clearLogs: () => void
}

export const useVoiceStore = create<VoiceStore>((set) => ({
  isListening: false,
  isSpeaking: false,
  isProcessing: false,
  language: 'ar',
  autoSpeechEnabled: true,
  transcript: '',
  lastExplanation: '',
  logs: [],

  setIsListening: (isListening) => set({ isListening }),
  setIsSpeaking: (isSpeaking) => set({ isSpeaking }),
  setIsProcessing: (isProcessing) => set({ isProcessing }),
  setLanguage: (language) => set({ language }),
  setAutoSpeechEnabled: (autoSpeechEnabled) => set({ autoSpeechEnabled }),
  setTranscript: (transcript) => set({ transcript }),
  setLastExplanation: (lastExplanation) => set({ lastExplanation }),
  addLog: (log) =>
    set((state) => ({
      logs: [
        ...state.logs,
        {
          ...log,
          id: Math.random().toString(36).substring(2, 9),
          timestamp: new Date(),
        },
      ],
    })),
  clearLogs: () => set({ logs: [], lastExplanation: '' }),
}))
