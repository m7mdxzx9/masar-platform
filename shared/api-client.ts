/**
 * Shared API client interface for Masar platform.
 * Used by both the Electron desktop app and React Native mobile app.
 *
 * Desktop (Electron): communicates via the web frontend's axios instance.
 * Mobile: communicates via the mobile app's axios instance.
 *
 * Both platforms share the same backend API endpoints and response shapes.
 */

export interface ApiConfig {
  baseUrl: string
  timeout: number
  headers: Record<string, string>
}

export const DEFAULT_API_CONFIG: ApiConfig = {
  baseUrl: 'http://localhost:8000',
  timeout: 30000,
  headers: { 'Content-Type': 'application/json' },
}

export interface ApiResponse<T = any> {
  data: T
  status: number
  ok: boolean
}

export interface ApiError {
  message: string
  status: number
  data?: any
}

export interface IApiClient {
  get<T = any>(path: string, params?: Record<string, any>): Promise<ApiResponse<T>>
  post<T = any>(path: string, body?: any): Promise<ApiResponse<T>>
  put<T = any>(path: string, body?: any): Promise<ApiResponse<T>>
  delete<T = any>(path: string): Promise<ApiResponse<T>>
  upload<T = any>(path: string, formData: FormData): Promise<ApiResponse<T>>
  setBaseUrl(url: string): void
  getBaseUrl(): string
}

export const API_ENDPOINTS = {
  // Dashboard & Analytics
  dashboardStats: '/api/analytics/dashboard-stats',
  focusStats: '/api/analytics/focus-stats',
  progressStats: '/api/analytics/progress-stats',
  activityLog: '/api/analytics/activity-log',

  // AI Tutor
  tutorAsk: '/api/tutor/ask',
  tutorBktPredict: '/api/tutor/bkt-predict',

  // Courses
  courses: '/api/courses',
  courseDetail: (id: string) => `/api/courses/${id}`,

  // Subjects
  subjects: '/api/subjects',
  subjectFiles: (id: string) => `/api/subjects/${id}/files`,

  // Notes
  notes: '/api/notes',
  noteDetail: (id: string) => `/api/notes/${id}`,

  // Labs
  labsRun: '/api/labs/run',
  labsExport: '/api/labs/export',
  labsImport: '/api/labs/import',

  // Study Assistant
  studyQuiz: '/api/study/quiz',
  studySummarize: '/api/study/summarize',
  studyFlashcards: '/api/study/flashcards',

  // Challenges
  challenges: '/api/challenges',
  challengeAnswer: (id: string) => `/api/challenges/${id}/answer`,

  // Google Drive
  gdriveAuth: '/api/gdrive/auth',
  gdriveCallback: '/api/gdrive/callback',
  gdriveBrowse: '/api/gdrive/browse',
  gdriveBackup: '/api/gdrive/backup',
  gdriveRestore: '/api/gdrive/restore',
  gdriveExport: '/api/gdrive/export',
  gdriveUpload: '/api/gdrive/upload',
  gdriveDownload: '/api/gdrive/download',
  gdriveAi: '/api/gdrive/ai',

  // Auth
  authLogin: '/auth/login',
  authRegister: '/auth/register',
  authMe: '/auth/me',
} as const
