import { create } from 'zustand';

interface Message {
  role: 'user' | 'assistant';
  content: string;
  timestamp: Date;
}

interface AIAgentStore {
  messages: Message[];
  isLoading: boolean;
  currentAgent: string;
  addMessage: (m: Message) => void;
  clearMessages: () => void;
  setIsLoading: (b: boolean) => void;
  setCurrentAgent: (a: string) => void;
}

export const useAIAgentStore = create<AIAgentStore>((set) => ({
  messages: [
    {
      role: 'assistant',
      content: 'مرحباً! أنا مساعدك في مسار الذكاء الاصطناعي. كيف يمكنني مساعدتك اليوم؟',
      timestamp: new Date(),
    },
  ],
  isLoading: false,
  currentAgent: 'general',
  addMessage: (m) => set((s) => ({ messages: [...s.messages, m] })),
  clearMessages: () => set({ messages: [] }),
  setIsLoading: (b) => set({ isLoading: b }),
  setCurrentAgent: (a) => set({ currentAgent: a }),
}));
