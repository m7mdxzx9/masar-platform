import axios from 'axios'

export let API_BASE_URL = (() => {
  // @ts-expect-error import.meta.env is defined by Vite
  let url = import.meta.env.VITE_API_URL || ''

  // 2. Check localStorage custom URL if we are not forcing the env URL.
  if (!url && typeof window !== 'undefined' && typeof localStorage !== 'undefined') {
    const storedUrl = localStorage.getItem('masar-backend-url')
    if (storedUrl) {
      // If we are on a production domain but the stored URL is localhost, ignore it.
      const isProductionDomain = window.location.hostname.includes('onrender.com')
      const isStoredLocal = storedUrl.includes('localhost') || storedUrl.includes('127.0.0.1')
      if (!(isProductionDomain && isStoredLocal)) {
        url = storedUrl
      }
    }
  }

  // 3. Fallback for local development
  if (!url && typeof window !== 'undefined') {
    const hostname = window.location.hostname
    const isLocal = hostname === 'localhost' || 
                    hostname === '127.0.0.1' || 
                    hostname.startsWith('192.168.') || 
                    hostname.startsWith('10.') || 
                    hostname.startsWith('172.') ||
                    hostname.endsWith('.local')
    if (isLocal) {
      url = `http://${hostname}:8000/api/v1`
    }
  }

  if (!url) {
    url = 'https://masar-backend-v72t.onrender.com/api/v1'
  }

  // Force HTTPS if the frontend is loaded over HTTPS to prevent Mixed Content block
  if (typeof window !== 'undefined' && window.location.protocol === 'https:') {
    url = url.replace(/^http:\/\//i, 'https://')
  }

  console.log('Attempting API connection to:', url)

  return url
})()

export function setCustomBackendUrl(url: string | null) {
  if (typeof localStorage !== 'undefined') {
    if (url) {
      localStorage.setItem('masar-backend-url', url)
    } else {
      localStorage.removeItem('masar-backend-url')
    }
    window.location.reload()
  }
}

export const apiClient = axios.create({
  baseURL: API_BASE_URL,
  headers: { 'Content-Type': 'application/json' },
  timeout: 30000,
})

if (typeof window !== 'undefined' && window.location.protocol === 'file:') {
  // Check if local dev backend is running
  fetch('http://localhost:8000/health')
    .then(res => res.json())
    .then(data => {
      if (data.status === 'healthy') {
        apiClient.defaults.baseURL = 'http://localhost:8000/api/v1'
        API_BASE_URL = 'http://localhost:8000/api/v1'
        console.log('Connected to local backend server at http://localhost:8000/api/v1')
      }
    })
    .catch(() => {
      console.log('Local dev server not detected, falling back to Render.')
    })
}

export interface ConversationMessage {
  role: 'user' | 'assistant'
  content: string
}

export interface ChatRequest {
  message: string
  agent_type: string
  conversation_history: ConversationMessage[]
  provider?: string
  model?: string
}

export interface ProjectIdeasRequest {
  interests: string
  skill_level: string
  domain?: string
  provider?: string
  model?: string
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

  generateFromSyllabus: (formData: FormData) =>
    api.post<any>('/courses/generate-from-syllabus', formData, {
      headers: {
        'Content-Type': 'multipart/form-data',
      },
    }),
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

  translate: (text: string, source_lang: string, target_lang: string) =>
    api.post<{ translated_text: string }>('/translate', { text, source_lang, target_lang }),

  getHistory: (agentId: string) =>
    api.get<{ messages: { role: 'user' | 'assistant'; content: string; displayContent?: string; timestamp?: string }[] }>(`/agents/history/${agentId}`),

  saveMessage: (agentId: string, role: string, content: string, displayContent?: string) =>
    api.post<any>(`/agents/history/${agentId}`, { role, content, displayContent }),

  clearHistory: (agentId: string) =>
    api.delete<any>(`/agents/history/${agentId}`),

  listSessions: (agentId: string) =>
    api.get<{ sessions: { id: number; agent_id: string; title: string; created_at?: string; updated_at?: string }[] }>(`/agents/sessions?agent_id=${agentId}`),

  createSession: (agentId: string, title?: string) =>
    api.post<{ id: number; agent_id: string; title: string }>(`/agents/sessions`, { agent_id: agentId, title }),

  deleteSession: (sessionId: number) =>
    api.delete<{ success: boolean }>(`/agents/sessions/${sessionId}`),

  getSessionMessages: (sessionId: number) =>
    api.get<{ messages: { role: 'user' | 'assistant'; content: string; displayContent?: string; timestamp?: string }[] }>(`/agents/sessions/${sessionId}/messages`),

  saveSessionMessage: (sessionId: number, role: string, content: string, displayContent?: string) =>
    api.post<any>(`/agents/sessions/${sessionId}/messages`, { role, content, displayContent }),

  listLocalModels: () =>
    api.get<{ status: string; installed: string[]; recommended: { id: string; name: string; size: string }[] }>('/agents/local-models'),

  pullModel: (modelName: string) =>
    api.post<{ message: string; model_name: string }>('/agents/pull-model', { model_name: modelName }),

  getPullStatus: (modelName: string) =>
    api.get<{ model_name: string; status: string }>(`/agents/pull-status/${modelName}`),
}

export const labsAPI = {
  challenges: () =>
    api.get<{ id: string; title: string; description: string; difficulty: string; points: number; word_list?: unknown[] }[]>(
      '/labs/challenges/',
    ),
  correctCode: (code: string, error_message: string) =>
    api.post<{ suggestion: string }>('/labs/correct-code', { code, error_message }),
  completeCode: (code: string, cursor_position: number) =>
    api.post<{ completion: string }>('/labs/complete-code', { code, cursor_position }),
}

export const snippetsAPI = {
  list: (params?: { language?: string; search?: string }) =>
    api.get<{ id: number; title: string; code: string; language: string; tags: string[]; created_at: string; updated_at: string }[]>('/snippets', params),
  get: (id: number) => api.get<any>(`/snippets/${id}`),
  create: (data: { title: string; code: string; language?: string; lab_id?: string }) =>
    api.post<any>('/snippets', data),
  update: (id: number, data: { title?: string; code?: string; language?: string }) =>
    api.put<any>(`/snippets/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean }>(`/snippets/${id}`),
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
    api.get<{ project_id: string; title: string; description: string; domain: string; skill_level: string; milestones: unknown[]; created_at: string }>(`/projects/${projectId}`),

  submitFeedback: (projectId: string, feedback: string) =>
    api.post<{ status: string }>(`/projects/feedback/${projectId}`, { feedback }),
  generateGraduation: (skills: string[], interests: string[], provider?: string, model?: string) =>
    api.post<any>('/projects/generate-graduation', { skills, interests, provider, model }),
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
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  audioUrl: (noteId: number) =>
    `${apiClient.defaults.baseURL}/notes/audio/${noteId}`,
}

export const studyAPI = {
  extractText: (file: File, provider?: string, model?: string) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('provider', provider || 'google')
    if (model) formData.append('model', model)
    return apiClient.post<{ filename: string; text: string }>('/study/extract-text', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
  summarize: (data: { content: string; format?: string; language?: string; provider?: string; model?: string }) =>
    api.post<{ summary: string; key_points: string[]; original_length: number; summary_length: number }>('/study/summarize', data),
  ask: (data: { content: string; question: string; provider?: string; model?: string }) =>
    api.post<{ answer: string }>('/study/ask', data),
  guide: (data: { content: string; subject?: string; provider?: string; model?: string }) =>
    api.post<{ title: string; sections: { heading: string; points: string[] }[] }>('/study/guide', data),
  flashcards: (data: { content: string; count?: number; provider?: string; model?: string }) =>
    api.post<{ cards: { front: string; back: string }[] }>('/study/flashcards', data),
  summarizeNote: (noteId: number) =>
    api.post<{ summary: string; key_points: string[]; original_length: number; summary_length: number }>(`/study/summarize-note/${noteId}`),
  summarizeSubject: (subjectId: number) =>
    api.post<{ subject_name: string; file_count: number; file_summaries: { filename: string; summary: string; key_points: string[] }[]; overall_summary: string; overall_key_points: string[] }>(`/study/summarize-subject/${subjectId}`),
  generateMindMap: (content: string, depth: number = 2, provider?: string, model?: string) =>
    api.post<{ tree: { id: string; title: string; children: any[] } }>('/study/generate-mindmap', { content, depth, provider, model }),
  transcribeAudio: (content: string, provider?: string, model?: string) =>
    api.post<{ transcription: string; summary: string; key_points: string[] }>('/study/transcribe-audio', { content, provider, model }),
  quizFromFile: (content: string, difficulty?: string, question_count?: number, provider?: string, model?: string) =>
    api.post<{ questions: { question: string; options: string[]; correct: string; explanation: string }[] }>('/study/generate-quiz-from-file', { content, difficulty, question_count, provider, model }),
  predictGrades: () =>
    api.post<{ predictions: { course: string; predicted_grade: string; confidence: number; recommendation: string }[] }>('/study/predict-grades'),
  youtubeSummarize: (url: string, provider?: string, model?: string) =>
    api.post<{ transcript: string; summary: string }>('/study/youtube-summarize', { url, provider, model }),
  transcribeFile: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ text: string }>('/study/transcribe-file', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export const healthAPI = {
  check: () => {
    try {
      const url = new URL(API_BASE_URL)
      return axios.get<{ status: string }>(`${url.origin}/health`)
    } catch {
      return axios.get<{ status: string }>('/health')
    }
  },
}

export const focusAPI = {
  createSession: (data: { duration: number; session_type: string; completed: boolean }) =>
    api.post<{ id: number; duration: number; session_type: string; completed: boolean; created_at: string }>('/focus/sessions', data),
  listSessions: (limit = 50) =>
    api.get<{ id: number; duration: number; session_type: string; completed: boolean; created_at: string }[]>('/focus/sessions', { limit }),
  stats: () =>
    api.get<{ today_seconds: number; today_minutes: number; week_seconds: number; week_minutes: number; session_count_today: number }>('/focus/stats'),
  heatmap: (days = 365) =>
    api.get<{ daily: Record<string, number> }>('/focus/heatmap', { days }),
}

export const goalsAPI = {
  list: () => api.get<{ id: number; title: string; description: string | null; target: number; current: number; target_type: string; deadline: string | null; completed: boolean; created_at: string; updated_at: string }[]>('/goals'),
  get: (id: number) => api.get<any>(`/goals/${id}`),
  create: (data: { title: string; description?: string; target?: number; target_type?: string; deadline?: string }) =>
    api.post<any>('/goals', data),
  update: (id: number, data: { title?: string; description?: string; target?: number; current?: number; target_type?: string; deadline?: string; completed?: boolean }) =>
    api.put<any>(`/goals/${id}`, data),
  delete: (id: number) => api.delete<{ success: boolean }>(`/goals/${id}`),
}

export const gitAPI = {
  commit: (message: string) =>
    api.post<{ success: boolean; commit_hash: string | null; message: string }>('/git/commit', { message }),
  log: (limit = 20) =>
    api.get<{ commit_hash: string; author: string; date: string; message: string }[]>('/git/log', { limit }),
  status: () =>
    api.get<{ changed_files: string[]; branch: string }>('/git/status'),
  push: () =>
    api.post<{ success: boolean; message: string }>('/git/push'),
}

export const backupAPI = {
  create: () =>
    api.post<{ filename: string; date: string; size_bytes: number }>('/backup/create'),
  list: () =>
    api.get<{ filename: string; date: string; size_bytes: number }[]>('/backup/list'),
  downloadUrl: (filename: string) =>
    `${apiClient.defaults.baseURL}/backup/download/${filename}`,
  restore: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ success: boolean; message: string }>('/backup/restore', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export const driveAPI = {
  status: () => fetch(`${API_BASE_URL}/drive/status`).then(r => r.json()),
  authUrl: (redirectUri?: string) => {
    const url = redirectUri ? `${API_BASE_URL}/drive/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}` : `${API_BASE_URL}/drive/auth-url`
    return fetch(url).then(r => r.json())
  },
  authCallback: (code: string, redirectUri?: string) => {
    const url = redirectUri ? `${API_BASE_URL}/drive/auth-callback?redirect_uri=${encodeURIComponent(redirectUri)}` : `${API_BASE_URL}/drive/auth-callback`
    return fetch(url, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ code }) }).then(r => r.json())
  },
  unlink: () => fetch(`${API_BASE_URL}/drive/unlink`, { method: 'POST' }).then(r => r.json()),
  files: (folderId?: string) => fetch(`${API_BASE_URL}/drive/files${folderId ? `?folder_id=${folderId}` : ''}`).then(r => r.json()),
  folders: () => fetch(`${API_BASE_URL}/drive/folders`).then(r => r.json()),
  backup: () => fetch(`${API_BASE_URL}/drive/backup`, { method: 'POST' }).then(r => r.json()),
  backups: () => fetch(`${API_BASE_URL}/drive/backups`).then(r => r.json()),
  restore: (fileId: string) => fetch(`${API_BASE_URL}/drive/restore/${fileId}`, { method: 'POST' }).then(r => r.json()),
  export: (scope: string) =>
    fetch(`${API_BASE_URL}/drive/export`, { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ scope }) }).then(r => r.json()),
  syncNotes: () => fetch(`${API_BASE_URL}/drive/sync-notes`, { method: 'POST' }).then(r => r.json()),
  upload: (file: File, folder = '') => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', folder)
    return fetch(`${API_BASE_URL}/drive/upload`, { method: 'POST', body: formData }).then(r => r.json())
  },
  aiAction: (fileId: string, action: 'summarize' | 'quiz') =>
    fetch(`${API_BASE_URL}/drive/ai-${action}/${fileId}`, { method: 'POST' }).then(r => r.json()),
}

export const analyticsAPI = {
  overview: () => fetch(`${API_BASE_URL}/analytics/overview`).then(r => r.json()),
  progress: () => fetch(`${API_BASE_URL}/analytics/progress`).then(r => r.json()),
  focus: () => fetch(`${API_BASE_URL}/analytics/focus`).then(r => r.json()),
  activity: (limit = 50) => fetch(`${API_BASE_URL}/analytics/activity?limit=${limit}`).then(r => r.json()),
  dashboardStats: () => fetch(`${API_BASE_URL}/analytics/dashboard-stats`).then(r => r.json()),
  focusStats: () => fetch(`${API_BASE_URL}/analytics/focus-stats`).then(r => r.json()),
}

export const vocabularyAPI = {
  list: () => api.get<any[]>('/vocabulary/').then(r => r.data),
  add: (word: string, meanings: string[]) => api.post<any>('/vocabulary/', { word, meanings }).then(r => r.data),
  bulkAdd: (words: { word: string; meanings: string[] }[]) => api.post<any>('/vocabulary/bulk', words).then(r => r.data),
  recordMatch: (match: { score: number; mode: string; word_count: number; words_json: any }) => api.post<any>('/vocabulary/matches', match).then(r => r.data),
  listMatches: (limit = 50) => api.get<any[]>('/vocabulary/matches', { limit }).then(r => r.data),
}

export const tutorAPI = {
  ask: (data: { query: string; context?: string; mode?: string; subject?: string; skill_id?: string; provider?: string; model?: string }) =>
    api.post<{ response: string; mode: string; suggested_review_hours?: number }>('/tutor/ask', data),
  bktPredict: (data: { query: string; context?: string; subject?: string; skill_id?: string; provider?: string; model?: string }) =>
    api.post<{ mastery: number; review_hours: number; next_concept: string }>('/tutor/bkt-predict', data),
}

export const labsEnhancedAPI = {
  exportNotebook: (cells: { code: string; output: string; error: string }[], title = 'Masar Notebook') =>
    apiClient.post('/labs/export-ipynb', { cells, title }, { responseType: 'blob' }),
  importNotebook: (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    return apiClient.post<{ cells: { code: string; output: string; error: string }[]; title: string; cell_count: number }>('/labs/import-ipynb', formData, {
      headers: { 'Content-Type': 'multipart/form-data' }
    })
  },
}

export default api
