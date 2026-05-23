import { create } from 'zustand'
import { api } from '@/services/api'

export interface QuizQuestion {
  question: string
  options: string[]
  correct: string
  explanation: string
}

interface QuizState {
  topic: string
  difficulty: string
  questionCount: number
  questions: QuizQuestion[]
  currentIndex: number
  answers: (string | null)[]
  isLoading: boolean
  error: string | null
  timeLeft: number
  isFinished: boolean
  fileContent: string
  setTopic: (t: string) => void
  setDifficulty: (d: string) => void
  setQuestionCount: (n: number) => void
  setFileContent: (c: string) => void
  generateQuiz: () => Promise<void>
  answerQuestion: (answer: string) => void
  nextQuestion: () => void
  prevQuestion: () => void
  finishQuiz: () => void
  reset: () => void
}

export const useQuizStore = create<QuizState>((set, get) => ({
  topic: '',
  difficulty: 'medium',
  questionCount: 5,
  questions: [],
  currentIndex: 0,
  answers: [],
  isLoading: false,
  error: null,
  timeLeft: 0,
  isFinished: false,
  fileContent: '',

  setTopic: (t) => set({ topic: t }),
  setDifficulty: (d) => set({ difficulty: d }),
  setQuestionCount: (n) => set({ questionCount: n }),
  setFileContent: (c) => set({ fileContent: c }),

  generateQuiz: async () => {
    const { topic, difficulty, questionCount, fileContent } = get()
    if (!topic.trim()) return
    set({ isLoading: true, error: null, questions: [], answers: [], currentIndex: 0, isFinished: false })
    try {
      let response
      if (fileContent.trim()) {
        response = await api.post<{ questions: QuizQuestion[] }>('/study/generate-quiz-from-file', {
          content: fileContent, difficulty, question_count: questionCount,
        })
      } else {
        response = await api.post<{ questions: QuizQuestion[] }>('/study/generate-quiz', {
          topic, difficulty, question_count: questionCount,
        })
      }
      const data = response.data
      set({
        questions: data.questions,
        answers: Array(data.questions.length).fill(null),
        timeLeft: data.questions.length * 60,
        isLoading: false,
      })
    } catch (err: any) {
      set({ error: err.message || 'Failed to generate quiz', isLoading: false })
    }
  },

  answerQuestion: (answer) => {
    const { currentIndex, answers } = get()
    const newAnswers = [...answers]
    newAnswers[currentIndex] = answer
    set({ answers: newAnswers })
  },

  nextQuestion: () => {
    const { currentIndex, questions } = get()
    if (currentIndex < questions.length - 1) {
      set({ currentIndex: currentIndex + 1 })
    }
  },

  prevQuestion: () => {
    const { currentIndex } = get()
    if (currentIndex > 0) {
      set({ currentIndex: currentIndex - 1 })
    }
  },

  finishQuiz: () => set({ isFinished: true }),

  reset: () => set({
    topic: '', difficulty: 'medium', questionCount: 5,
    questions: [], currentIndex: 0, answers: [],
    isLoading: false, error: null, timeLeft: 0, isFinished: false,
    fileContent: '',
  }),
}))
