import api from './client'

// Dashboard
export const getDashboardStats = () => api.get('/api/analytics/dashboard-stats').then(r => r.data)
export const getFocusStats = (days = 7) => api.get(`/api/analytics/focus-stats?days=${days}`).then(r => r.data)
export const getProgressStats = () => api.get('/api/analytics/progress-stats').then(r => r.data)
export const getActivityLog = (limit = 20) => api.get(`/api/analytics/activity-log?limit=${limit}`).then(r => r.data)

// AI Tutor
export const askTutor = (question: string, mode = 'explain', skill?: string) =>
  api.post('/api/tutor/ask', { question, mode, skill }).then(r => r.data)
export const predictBKT = (skillId: string, correctCount: number, totalAttempts: number) =>
  api.post('/api/tutor/bkt-predict', { skill_id: skillId, correct_count: correctCount, total_attempts: totalAttempts }).then(r => r.data)

// Courses
export const getCourses = () => api.get('/api/courses').then(r => r.data)
export const getCourseDetail = (id: string) => api.get(`/api/courses/${id}`).then(r => r.data)

// Subjects
export const getSubjects = () => api.get('/api/subjects').then(r => r.data)
export const getSubjectDetail = (id: string) => api.get(`/api/subjects/${id}`).then(r => r.data)
export const getSubjectFiles = (id: string) => api.get(`/api/subjects/${id}/files`).then(r => r.data)
export const createSubject = (data: any) => api.post('/api/subjects', data).then(r => r.data)
export const updateSubject = (id: string, data: any) => api.put(`/api/subjects/${id}`, data).then(r => r.data)
export const deleteSubject = (id: string) => api.delete(`/api/subjects/${id}`).then(r => r.data)
export const deleteSubjectFile = (subjectId: string, fileId: string) => api.delete(`/api/subjects/${subjectId}/files/${fileId}`).then(r => r.data)
export const uploadSubjectFile = (subjectId: string, formData: any) => api.upload(`/api/subjects/${subjectId}/files`, formData).then(r => r.data)

// Notes
export const getNotes = () => api.get('/api/notes').then(r => r.data)
export const createNote = (data: any) => api.post('/api/notes', data).then(r => r.data)
export const deleteNote = (id: string) => api.delete(`/api/notes/${id}`).then(r => r.data)

// Labs
export const runCode = (code: string, language = 'python') =>
  api.post('/api/labs/run', { code, language }).then(r => r.data)

// Study Assistant / AI Tools
export const generateQuiz = (topic: string, count = 5, difficulty = 'medium') =>
  api.post('/api/study/generate-quiz', { topic, question_count: count, difficulty }).then(r => r.data)
export const generateQuizFromFile = (content: string, count = 5, difficulty = 'medium') =>
  api.post('/api/study/generate-quiz-from-file', { content, question_count: count, difficulty }).then(r => r.data)
export const summarize = (text: string, format = 'bullet', language = 'ar') =>
  api.post('/api/study/summarize', { content: text, format, language }).then(r => r.data)
export const generateFlashcards = (topic: string, count = 5) =>
  api.post('/api/study/flashcards', { content: topic, count }).then(r => r.data)
export const summarizeSubject = (subjectId: string) =>
  api.post(`/api/study/summarize-subject/${subjectId}`).then(r => r.data)
export const generateMindMap = (content: string, depth = 2) =>
  api.post('/api/study/generate-mindmap', { content, depth }).then(r => r.data)

// Goals
export const getGoals = () => api.get('/api/goals').then(r => r.data)
export const createGoal = (data: any) => api.post('/api/goals', data).then(r => r.data)
export const updateGoal = (id: string, data: any) => api.put(`/api/goals/${id}`, data).then(r => r.data)
export const deleteGoal = (id: string) => api.delete(`/api/goals/${id}`).then(r => r.data)

// Google Drive Sync
export const getDriveStatus = () => api.get('/api/drive/status').then(r => r.data)
export const getDriveAuthUrl = () => api.get('/api/drive/auth-url').then(r => r.data)
export const sendDriveAuthCallback = (code: string) => api.post('/api/drive/auth-callback', { code }).then(r => r.data)
export const unlinkDrive = () => api.post('/api/drive/unlink').then(r => r.data)
export const backupToDrive = () => api.post('/api/drive/backup').then(r => r.data)
export const listDriveBackups = () => api.get('/api/drive/backups').then(r => r.data)

// Local Backup
export const getBackupList = () => api.get('/api/backup/list').then(r => r.data)
export const createBackup = () => api.post('/api/backup/create').then(r => r.data)

// Projects (Kanban / Roadmaps)
export const listProjects = () => api.get('/api/projects').then(r => r.data)
export const getProjectDetails = (id: string) => api.get(`/api/projects/${id}`).then(r => r.data)
export const generateProject = (interests: string, skillLevel = 'intermediate', domain = 'machine learning') =>
  api.post('/api/projects/generate', { interests, skill_level: skillLevel, domain }).then(r => r.data)
export const submitProjectFeedback = (id: string, feedback: string) =>
  api.post(`/api/projects/feedback/${id}`, { feedback }).then(r => r.data)

// Challenges
export const getChallenge = (type = 'word-chain') =>
  api.get(`/api/challenges/${type}`).then(r => r.data)
export const submitChallengeAnswer = (challengeId: string, answer: string) =>
  api.post(`/api/challenges/${challengeId}/answer`, { answer }).then(r => r.data)

// Translate
export const translate = (text: string, sourceLang = 'en', targetLang = 'ar') =>
  api.post('/api/translate', { text, source_lang: sourceLang, target_lang: targetLang }).then(r => r.data)
