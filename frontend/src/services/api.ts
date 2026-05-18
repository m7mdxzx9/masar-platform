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
  challenges: () =>
    api.get<{ id: string; title: string; description: string; difficulty: string; points: number; word_list?: unknown[] }[]>(
      '/labs/challenges/',
    ),
}

export const gamesAPI = {
  leaderboard: (limit = 50) =>
    apiClient.get<{ leaderboard: { rank: number; lab_id: string; attempts: number; avg_score: number; max_score: number }[] }>('/games/leaderboard', { params: { limit } }),

  challenges: (category = 'all') =>
    apiClient.get<{ id: string; title: string; description: string; difficulty: string; points: number }[]>('/games/challenges', { params: { category } }),

  submitScore: (challengeId: string, score: number, streakBonus = 0) =>
    apiClient.post<{ final_score: number; new_total_score: number }>('/games/submit-score', {
      challenge_id: challengeId,
      score,
      streak_bonus: streakBonus,
    }),
}

export const progressAPI = {
  submitQuiz: (moduleId: string, questionId: string, skillId: string, isCorrect: boolean, timeSpent: number) =>
    api.post<{ skill_id: string; mastery: number; mastery_level: string; difficulty: string; next_action: string; attempts: number; correct: number; accuracy: number }>('/progress/quiz-submit', {
      module_id: moduleId,
      question_id: questionId,
      skill_id: skillId,
      is_correct: isCorrect,
      time_spent: timeSpent,
    }),

  mastery: (skillId: string) =>
    api.get<{ skill_id: string; mastery: number; mastery_level: string }>(`/progress/mastery/${skillId}`),

  learningPath: (skillIds: string) =>
    api.get<{ skill_id: string; mastery: number; mastery_level: string; next_action: string }[]>('/progress/learning-path', { skill_ids: skillIds }),

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

export const subjectsAPI = {
  list: () => api.get<{ subjects: any[] }>('/subjects/'),
  get: (id: number) => api.get<any>(`/subjects/${id}`),
  create: (data: any) => api.post<any>('/subjects/', data),
  update: (id: number, data: any) => api.put<any>(`/subjects/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean }>(`/subjects/${id}`),
  uploadFile: (subjectId: number, file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ id: number; filename: string; original_name: string; file_type: string; file_size: number; uploaded_at: string }>(
      `/subjects/${subjectId}/files`,
      formData,
      { headers: { 'Content-Type': 'multipart/form-data' } }
    )
  },
  listFiles: (subjectId: number) =>
    api.get<{ files: any[] }>(`/subjects/${subjectId}/files`),
  deleteFile: (subjectId: number, fileId: number) =>
    api.delete<{ success: boolean }>(`/subjects/${subjectId}/files/${fileId}`),
  downloadUrl: (subjectId: number, fileId: number) =>
    `${apiClient.defaults.baseURL}/subjects/${subjectId}/files/${fileId}/download`,
}

export const notesAPI = {
  list: (search?: string) => {
    const params = search ? { search } : undefined
    return api.get<{ notes: any[] }>('/notes/', params)
  },
  get: (id: number) => api.get<any>(`/notes/${id}`),
  create: (data: { title: string; content?: string; type?: string }) =>
    api.post<any>('/notes/', data),
  update: (id: number, data: { title?: string; content?: string }) =>
    api.put<any>(`/notes/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean }>(`/notes/${id}`),
  uploadVoice: (title: string, file: File, duration: number) => {
    const formData = new FormData()
    formData.append('title', title)
    formData.append('file', file)
    formData.append('duration', String(duration))
    return apiClient.post<any>('/notes/voice', formData, {
      headers: { 'Content-Type': 'multipart/form-data' },
    })
  },
  audioUrl: (noteId: number) =>
    `${apiClient.defaults.baseURL}/notes/audio/${noteId}`,
}

export const studyAPI = {
  summarize: (data: { content: string; format?: string; language?: string }) =>
    api.post<{ summary: string; key_points: string[]; original_length: number; summary_length: number }>('/study/summarize', data),
  ask: (data: { content: string; question: string }) =>
    api.post<{ answer: string }>('/study/ask', data),
  guide: (data: { content: string; subject?: string }) =>
    api.post<{ title: string; sections: { heading: string; points: string[] }[] }>('/study/guide', data),
  flashcards: (data: { content: string; count?: number }) =>
    api.post<{ cards: { front: string; back: string }[] }>('/study/flashcards', data),
  summarizeNote: (noteId: number) =>
    api.post<{ summary: string; key_points: string[]; original_length: number; summary_length: number }>(`/study/summarize-note/${noteId}`),
  summarizeSubject: (subjectId: number) =>
    api.post<{ subject_name: string; file_count: number; file_summaries: { filename: string; summary: string; key_points: string[] }[]; overall_summary: string; overall_key_points: string[] }>(`/study/summarize-subject/${subjectId}`),
}

export const healthAPI = {
  check: () => axios.get<{ status: string }>('/health'),
}

export default api
