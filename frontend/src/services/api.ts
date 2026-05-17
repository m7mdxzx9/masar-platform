import axios from 'axios'

// eslint-disable-next-line @typescript-eslint/no-explicit-any
const API_BASE_URL = (import.meta as any).env?.VITE_API_URL || '/api/v1'

const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  agent_type: string
  conversation_history: ConversationMessage[]
}

export interface ProjectIdeasRequest {
  interests: string
  skill_level: string
  domain?: string
}

export interface LabExecuteRequest {
  code: string
  language?: string
}

export const api = {
  get: <T>(path: string, params?: Record<string, unknown>, config?: any) =>
    apiClient.get<T>(path, { params, ...config }),

  post: <T>(path: string, data?: unknown, config?: any) =>
    apiClient.post<T>(path, data, config),

  put: <T>(path: string, data?: unknown, config?: any) =>
    apiClient.put<T>(path, data, config),

  delete: <T>(path: string, config?: any) =>
    apiClient.delete<T>(path, config),
}

export const authAPI = {
  login: (username: string, password: string) =>
    api.post<{ access_token: string; token_type: string; user_id: number }>('/auth/login', {
      username,
      password,
    }),

  register: (username: string, email: string, password: string) =>
    api.post<{ id: number; username: string; email: string }>('/auth/register', {
      username,
      email,
      password,
    }),

  me: () => api.get<{ id: number; username: string; email: string }>('/auth/me'),
}

export const coursesAPI = {
  getAll: () => api.get<{ id: number; title: string; description: string; category: string; difficulty: number; modules: number }[]>('/courses/'),

  getById: (id: number) => api.get<{ id: number; title: string; modules: unknown[] }>(`/courses/${id}`),

  create: (data: { title: string; description: string; category: string; difficulty: number; modules: unknown[] }) =>
    api.post<{ id: number }>('/courses/', data),

  update: (id: number, data: { title: string; description: string; category: string; difficulty: number; modules?: unknown[] }) =>
    api.put<{ id: number }>(`/courses/${id}`, data),

  delete: (id: number) =>
    api.delete<{ success: boolean }>(`/courses/${id}`),
}

export const agentsAPI = {
  list: () => api.get<{ agents: { id: string; name: string; description: string }[] }>('/agents/'),

  chat: (data: ChatRequest) =>
    api.post<string>('/agents/chat', data),

  chatStream: (data: ChatRequest) =>
    apiClient.post('/agents/chat', data, {
      responseType: 'stream',
      headers: { 'Content-Type': 'application/json' },
    }),

  projectIdeas: (data: ProjectIdeasRequest) =>
    api.post<{ agent: string; response: string }>('/agents/project-ideas', data),

  config: () => api.get<{ llm_provider: string; llm_model: string; streaming: boolean }>('/agents/config'),
}

export const labsAPI = {
  execute: (data: LabExecuteRequest) =>
    api.post<{ output: string; error: string }>('/labs/execute', data),

  submit: (labId: string, code: string, courseId: number) =>
    apiClient.post<{ submission_id: number; score: number; is_passed: boolean }>('/labs/submit', null, {
      params: { lab_id: labId, code, course_id: courseId },
    }),
  challenges: () =>
    api.get<{ challenges: { id: string; title: string; description: string; difficulty: string; points: number }[] }>(
      '/labs/challenges/',
    ),
}

export const gamesAPI = {
  leaderboard: (limit = 50) =>
    apiClient.get<{ leaderboard: { rank: number; username: string; score: number; achievements: number }[] }>('/games/leaderboard', { params: { limit } }),

  challenges: (category = 'all') =>
    apiClient.get<{ challenges: { id: string; title: string; description: string; difficulty: string; points: number }[] }>('/games/challenges', { params: { category } }),

  submitScore: (challengeId: string, score: number, streakBonus = 0) =>
    apiClient.post<{ final_score: number; new_total_score: number }>('/games/submit-score', null, {
      params: { challenge_id: challengeId, score, streak_bonus: streakBonus },
    }),
}

export const progressAPI = {
  submitQuiz: (moduleId: string, questionId: string, skillId: string, isCorrect: boolean, timeSpent: number) =>
    apiClient.post<{ mastery: number; next_action: string }>('/progress/quiz-submit', null, {
      params: { module_id: moduleId, question_id: questionId, skill_id: skillId, is_correct: isCorrect, time_spent: timeSpent },
    }),

  mastery: (skillId: string) =>
    api.get<{ skill_id: string; mastery: number; mastery_level: string }>(`/progress/mastery/${skillId}`),

  learningPath: (skillIds: string) =>
    apiClient.get<{ learning_path: { skill_id: string; mastery: number }[] }>('/progress/learning-path', { params: { skill_ids: skillIds } }),

  stats: () =>
    api.get<{ total_skills: number; mastered: number; average_mastery: number }>('/progress/stats'),
}

export const projectsAPI = {
  generate: (interests: string, skillLevel: string, domain = 'machine learning') =>
    api.post<{ project_id: string; status: string }>('/projects/generate', { interests, skill_level: skillLevel, domain }),

  status: (projectId: string) =>
    api.get<{ project_id: string; status: string; progress: number }>(`/projects/status/${projectId}`),

  details: (projectId: string) =>
    api.get<{ title: string; description: string; milestones: unknown[] }>(`/projects/${projectId}`),

  submitFeedback: (projectId: string, feedback: string) =>
    api.post<{ status: string }>(`/projects/feedback/${projectId}`, { feedback }),
}

export const healthAPI = {
  check: () => axios.get<{ status: string }>('/health'),
}

export default api
