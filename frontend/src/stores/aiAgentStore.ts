import { create } from 'zustand'

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
  isError?: boolean
  displayContent?: string
}

interface AIAgentStore {
  messages: Message[]
  isLoading: boolean
  currentAgent: string
  addMessage: (m: Message) => void
  setMessages: (messages: Message[]) => void
  clearMessages: () => void
  setIsLoading: (b: boolean) => void
  setCurrentAgent: (a: string) => void
}

export const useAIAgentStore = create<AIAgentStore>((set) => ({
  messages: [],
  isLoading: false,
  currentAgent: 'general',
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  setMessages: (messages) => set({ messages }),
  clearMessages: () => set({ messages: [] }),
  setIsLoading: (b) => set({ isLoading: b }),
  setCurrentAgent: (a) => set({ currentAgent: a }),
}))
