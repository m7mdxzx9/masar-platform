import { create } from 'zustand'

interface LabState {
  code: string
  language: string
  output: string
  error: string
  isRunning: boolean
  pyodideReady: boolean

  setCode: (code: string) => void
  setLanguage: (lang: string) => void
  setOutput: (output: string) => void
  setError: (error: string) => void
  setRunning: (running: boolean) => void
  setPyodideReady: (ready: boolean) => void
  reset: () => void
}

export const useLabStore = create<LabState>()((set) => ({
  code: '# اكتب كود Python هنا\nprint("مرحباً بك في مسار!")\n',
  language: 'python',
  output: '',
  error: '',
  isRunning: false,
  pyodideReady: false,

  setCode: (code) => set({ code }),
  setLanguage: (language) => set({ language }),
  setOutput: (output) => set({ output, error: '' }),
  setError: (error) => set({ error }),
  setRunning: (isRunning) => set({ isRunning }),
  setPyodideReady: (pyodideReady) => set({ pyodideReady }),
  reset: () => set({ code: '', output: '', error: '', isRunning: false }),
}))
