export interface Course {
  id: number
  title: string
  description: string
  category: string
  difficulty: number
  modules: number
}

export interface Challenge {
  id: string
  title: string
  description: string
  difficulty: string
  points: number
}

export interface AgentInfo {
  id: string
  name: string
  description: string
}

export interface Message {
  role: 'user' | 'assistant'
  content: string
  timestamp: Date
}
