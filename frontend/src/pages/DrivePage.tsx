import { useState, useEffect, useRef, useCallback } from 'react'
import { motion, AnimatePresence } from 'framer-motion'
import { HardDrive, Link2, Unlink, FolderOpen, FileText, Download, Upload, RefreshCw, Loader2, CheckCircle2, AlertCircle, ChevronRight, ChevronDown, FileJson, Brain, GraduationCap, FileAudio, Cloud, ExternalLink, Trash2 } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import { API_BASE_URL } from '@/services/api'

interface DriveFile {
  id: string
  name: string
  mime_type: string
  size: number | null
  modified_time: string | null
  is_folder: boolean
}

interface DriveFolder {
  id: string
  name: string
  parents: string[]
}

export default function DrivePage() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [linked, setLinked] = useState(false)
  const [checking, setChecking] = useState(true)
  const [files, setFiles] = useState<DriveFile[]>([])
  const [folders, setFolders] = useState<DriveFolder[]>([])
  const [currentFolderId, setCurrentFolderId] = useState<string | null>(null)
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [activeTab, setActiveTab] = useState<'browse' | 'backup' | 'ai'>('browse')
  const [aiAction, setAiAction] = useState<string | null>(null)
  const [aiResult, setAiResult] = useState<string | null>(null)

  const [isLinking, setIsLinking] = useState(false)
  const [linkCodeInput, setLinkCodeInput] = useState('')

  useEffect(() => {
    checkStatus()
  }, [])

  useEffect(() => {
    const handleAuthMessage = async (event: MessageEvent) => {
      if (event.origin !== window.location.origin) return
      if (event.data?.type === 'gdrive-auth-success') {
        setIsLinking(false)
        setSuccessMsg('Google Drive linked successfully!')
        await checkStatus()
      }
    }
    window.addEventListener('message', handleAuthMessage)
    
    return () => {
      window.removeEventListener('message', handleAuthMessage)
    }
  }, [])

  const checkStatus = async () => {
    setChecking(true)
    try {
      const res = await fetch(`${API_BASE_URL}/drive/status`)
      const data = await res.json()
      setLinked(data.linked)
      if (data.linked && data.folder_id) {
        setCurrentFolderId(data.folder_id)
        loadFiles(data.folder_id)
      }
    } catch {
      setLinked(false)
    } finally {
      setChecking(false)
    }
  }

  const loadFiles = async (folderId?: string) => {
    setLoading(true)
    try {
      const params = folderId ? `?folder_id=${folderId}` : ''
      const [filesRes, foldersRes] = await Promise.all([
        fetch(`${API_BASE_URL}/drive/files${params}`).then(r => r.json()),
        fetch(`${API_BASE_URL}/drive/folders`).then(r => r.json()),
      ])
      setFiles(filesRes.files || [])
      setFolders(foldersRes.folders || [])
    } catch {
      setError('Failed to load files')
    } finally {
      setLoading(false)
    }
  }

  const handleLink = async () => {
    setError(null)
    setSuccessMsg(null)
    try {
      const redirectUri = window.location.origin + '/drive/callback'
      const res = await fetch(`${API_BASE_URL}/drive/auth-url?redirect_uri=${encodeURIComponent(redirectUri)}`)
      const data = await res.json()
      
      window.open(data.url, '_blank', 'width=600,height=700')
      
      setIsLinking(true)
      setLinkCodeInput('')
    } catch {
      setError('Failed to link Google Drive')
    }
  }

  const completeLink = async (code: string) => {
    setLoading(true)
    setError(null)
    setSuccessMsg(null)
    try {
      const redirectUri = window.location.origin + '/drive/callback'
      const res = await fetch(`${API_BASE_URL}/drive/auth-callback?redirect_uri=${encodeURIComponent(redirectUri)}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ code }),
      })
      if (!res.ok) {
        const errData = await res.json()
        throw new Error(errData.detail || 'Callback failed')
      }
      setSuccessMsg('Google Drive linked successfully!')
      checkStatus()
    } catch (err: any) {
      setError(err.message || 'Failed to link Google Drive')
    } finally {
      setLoading(false)
    }
  }

  const handleManualCodeSubmit = async () => {
    let code = linkCodeInput.trim()
    if (!code) return

    if (code.includes('code=')) {
      try {
        const urlObj = new URL(code.startsWith('http') ? code : `http://${code}`)
        const parsedCode = urlObj.searchParams.get('code')
        if (parsedCode) {
          code = parsedCode
        }
      } catch {
        const match = code.match(/[?&]code=([^&]+)/)
        if (match) {
          code = match[1]
        }
      }
    }

    setIsLinking(false)
    await completeLink(code)
  }

  const handleUnlink = async () => {
    await fetch(`${API_BASE_URL}/drive/unlink`, { method: 'POST' })
    setLinked(false)
    setFiles([])
    setSuccessMsg('Google Drive unlinked')
  }

  const handleBackup = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/drive/backup`, { method: 'POST' })
      const data = await res.json()
      setSuccessMsg(`Backup created: ${data.filename}`)
    } catch {
      setError('Backup failed')
    } finally {
      setLoading(false)
    }
  }

  const handleSyncNotes = async () => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/drive/sync-notes`, { method: 'POST' })
      const data = await res.json()
      setSuccessMsg(`Synced ${data.synced} notes to Drive`)
    } catch {
      setError('Sync failed')
    } finally {
      setLoading(false)
    }
  }

  const handleExport = async (scope: string) => {
    setLoading(true)
    try {
      const res = await fetch(`${API_BASE_URL}/drive/export`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ scope }),
      })
      const data = await res.json()
      setSuccessMsg(`Exported: ${data.filename}`)
    } catch {
      setError('Export failed')
    } finally {
      setLoading(false)
    }
  }

  const handleUpload = async (file: File) => {
    const formData = new FormData()
    formData.append('file', file)
    formData.append('folder', '')
    try {
      const res = await fetch(`${API_BASE_URL}/drive/upload`, { method: 'POST', body: formData })
      await res.json()
      setSuccessMsg(`Uploaded: ${file.name}`)
      if (currentFolderId) loadFiles(currentFolderId)
    } catch {
      setError('Upload failed')
    }
  }

  const handleAiAction = async (fileId: string, action: 'summarize' | 'quiz') => {
    setAiAction(action)
    setAiResult(null)
    try {
      const res = await fetch(`${API_BASE_URL}/drive/ai-${action}/${fileId}`, { method: 'POST' })
      const data = await res.json()
      setAiResult(data[action] || data.summary || 'Done')
      setSuccessMsg(`AI ${action} completed!`)
    } catch {
      setError(`AI ${action} failed`)
    } finally {
      setAiAction(null)
    }
  }

  if (checking) {
    return (
      <div className="flex items-center justify-center h-full">
        <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
      </div>
    )
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <HardDrive size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{t('common.drive', 'Google Drive')}</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{linked ? 'متصل' : 'غير متصل'}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {linked ? (
            <button onClick={handleUnlink} className="flex items-center gap-2 px-4 py-3 rounded-xl font-bold text-sm transition-all hover:bg-red-500/20"
              style={{ color: theme.colors.error, border: `1px solid ${theme.colors.error}40` }}>
              <Unlink size={16} /> {t('common.unlink', 'فصل')}
            </button>
          ) : (
            <button onClick={handleLink} className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <Cloud size={16} /> {t('common.linkDrive', 'ربط Google Drive')}
            </button>
          )}
        </div>
      </div>

      {successMsg && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl" style={{ backgroundColor: `${theme.colors.success}15`, border: `1px solid ${theme.colors.success}30`, color: theme.colors.success }}>
          <CheckCircle2 size={18} />
          <span className="text-sm font-bold">{successMsg}</span>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-3 p-4 mb-6 rounded-xl" style={{ backgroundColor: `${theme.colors.error}15`, border: `1px solid ${theme.colors.error}30`, color: theme.colors.error }}>
          <AlertCircle size={18} />
          <span className="text-sm font-bold">{error}</span>
        </div>
      )}

      {isLinking && (
        <motion.div initial={{ opacity: 0, y: -10 }} animate={{ opacity: 1, y: 0 }}
          className="p-6 mb-6 rounded-2xl backdrop-blur-md space-y-4"
          style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid ${theme.colors.accent}40` }}>
          <div className="flex items-start gap-3">
            <Link2 className="w-5 h-5 mt-1 shrink-0" style={{ color: theme.colors.accent }} />
            <div className="text-right">
              <h3 className="font-bold text-base" style={{ color: theme.colors.text }}>جاري ربط الحساب...</h3>
              <p className="text-xs mt-1 leading-relaxed" style={{ color: theme.colors.textMuted }}>
                تم فتح صفحة تسجيل دخول Google في نافذة جديدة. بعد الموافقة:
                <br />
                • إذا كنت على الكمبيوتر، سيتم ربط الحساب تلقائياً.
                <br />
                • إذا كنت على الهاتف وتوقفت الصفحة، يرجى <strong>نسخ رابط الصفحة بالكامل</strong> (الذي يبدأ بـ localhost) ولصقه في المربع أدناه:
              </p>
            </div>
          </div>
          
          <div className="flex flex-col sm:flex-row gap-2">
            <input
              type="text"
              value={linkCodeInput}
              onChange={e => setLinkCodeInput(e.target.value)}
              placeholder="إلصق رابط callback أو رمز التفويض هنا..."
              className="flex-1 px-4 py-3 rounded-xl text-sm focus:outline-none transition-all text-right"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                border: `1px solid rgba(255,255,255,0.1)`,
                color: theme.colors.text
              }}
            />
            <div className="flex gap-2">
              <button
                onClick={handleManualCodeSubmit}
                className="px-5 py-3 rounded-xl text-sm font-bold text-white transition-all hover:scale-105 shrink-0"
                style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
              >
                تأكيد الربط
              </button>
              <button
                onClick={() => setIsLinking(false)}
                className="px-4 py-3 rounded-xl text-sm font-bold opacity-60 hover:opacity-100 transition-all shrink-0"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', border: `1px solid rgba(255,255,255,0.1)`, color: theme.colors.text }}
              >
                إلغاء
              </button>
            </div>
          </div>
        </motion.div>
      )}

      {!linked ? (
        <div className="flex flex-col items-center justify-center py-20">
          <HardDrive size={80} className="mb-6 opacity-30" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>قم بربط Google Drive</p>
          <p className="text-sm mb-8" style={{ color: theme.colors.textMuted }}>اربط حسابك لمزامنة الملاحظات والنسخ الاحتياطي</p>
          {!isLinking && (
            <button onClick={handleLink} className="flex items-center gap-2 px-6 py-3.5 rounded-xl font-bold text-base text-white transition-all hover:scale-105 shadow-lg"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              <Cloud size={18} /> {t('common.linkDrive', 'ربط Google Drive')}
            </button>
          )}
        </div>
      ) : (
        <>
          <div className="flex gap-2 mb-6">
            {(['browse', 'backup', 'ai'] as const).map(tab => (
              <button key={tab} onClick={() => setActiveTab(tab)}
                className={`px-5 py-2.5 rounded-xl text-sm font-bold transition-all ${activeTab === tab ? 'text-white shadow-lg' : 'opacity-60 hover:opacity-100'}`}
                style={{
                  background: activeTab === tab ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'rgba(255,255,255,0.05)',
                  border: `1px solid ${activeTab === tab ? 'transparent' : 'rgba(255,255,255,0.1)'}`,
                }}>
                {tab === 'browse' ? 'تصفح الملفات' : tab === 'backup' ? 'النسخ الاحتياطي' : 'الذكاء الاصطناعي'}
              </button>
            ))}
          </div>

          {activeTab === 'browse' && (
            <div className="space-y-4">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <FolderOpen size={16} style={{ color: theme.colors.accent }} />
                  <span className="text-sm font-bold" style={{ color: theme.colors.text }}>/ Masar</span>
                </div>
                <div className="flex items-center gap-2">
                  <input ref={fileInputRef} type="file" onChange={e => { if (e.target.files?.[0]) handleUpload(e.target.files[0]); e.target.value = '' }} className="hidden" />
                  <button onClick={() => fileInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-medium transition-all hover:bg-white/10"
                    style={{ color: theme.colors.accent, border: `1px solid ${theme.colors.accent}40` }}>
                    <Upload size={12} /> رفع ملف
                  </button>
                  <button onClick={() => currentFolderId && loadFiles(currentFolderId)} className="p-2 rounded-lg hover:bg-white/10 transition-all" style={{ color: theme.colors.textMuted }}>
                    <RefreshCw size={14} />
                  </button>
                </div>
              </div>

              {loading ? (
                <div className="flex justify-center py-10"><Loader2 className="w-6 h-6 animate-spin" style={{ color: theme.colors.accent }} /></div>
              ) : files.length === 0 ? (
                <div className="text-center py-10 opacity-50">
                  <FolderOpen size={40} className="mx-auto mb-3" style={{ color: theme.colors.textDark }} />
                  <p style={{ color: theme.colors.textMuted }}>المجلد فارغ</p>
                </div>
              ) : (
                <div className="grid gap-2">
                  {files.map(f => (
                    <motion.div key={f.id} initial={{ opacity: 0, y: 5 }} animate={{ opacity: 1, y: 0 }}
                      className="flex items-center gap-3 px-4 py-3 rounded-xl transition-all hover:bg-white/5"
                      style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
                      {f.is_folder ? <FolderOpen size={18} style={{ color: theme.colors.accent }} /> : <FileText size={18} style={{ color: theme.colors.textMuted }} />}
                      <span className="flex-1 text-sm font-medium truncate" style={{ color: theme.colors.text }}>{f.name}</span>
                      {f.size && <span className="text-[10px]" style={{ color: theme.colors.textMuted }}>{(f.size / 1024).toFixed(0)} KB</span>}
                      {!f.is_folder && (
                        <div className="flex items-center gap-1">
                          <button onClick={() => handleAiAction(f.id, 'summarize')} disabled={aiAction !== null}
                            className="p-1.5 rounded-lg hover:bg-white/10" title="تلخيص بالذكاء الاصطناعي" style={{ color: theme.colors.accent }}>
                            <Brain size={12} />
                          </button>
                          <button onClick={() => handleAiAction(f.id, 'quiz')} disabled={aiAction !== null}
                            className="p-1.5 rounded-lg hover:bg-white/10" title="توليد اختبار" style={{ color: theme.colors.warning }}>
                            <GraduationCap size={12} />
                          </button>
                        </div>
                      )}
                    </motion.div>
                  ))}
                </div>
              )}
            </div>
          )}

          {activeTab === 'backup' && (
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
              <button onClick={handleBackup} disabled={loading}
                className="p-6 rounded-2xl text-right transition-all hover:-translate-y-1 backdrop-blur-[20px] shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${theme.colors.accent}20` }}>
                  <Cloud size={20} style={{ color: theme.colors.accent }} />
                </div>
                <p className="text-lg font-bold mb-1" style={{ color: theme.colors.text }}>نسخ احتياطي فوري</p>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>نسخ جميع البيانات إلى Google Drive</p>
              </button>
              <button onClick={() => handleExport('all')} disabled={loading}
                className="p-6 rounded-2xl text-right transition-all hover:-translate-y-1 backdrop-blur-[20px] shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${theme.colors.secondary}20` }}>
                  <FileJson size={20} style={{ color: theme.colors.secondary }} />
                </div>
                <p className="text-lg font-bold mb-1" style={{ color: theme.colors.text }}>تصدير المنصة</p>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>جميع البيانات في ملف تصدير واحد</p>
              </button>
              <button onClick={handleSyncNotes} disabled={loading}
                className="p-6 rounded-2xl text-right transition-all hover:-translate-y-1 backdrop-blur-[20px] shadow-lg"
                style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
                <div className="w-10 h-10 rounded-xl flex items-center justify-center mb-4" style={{ background: `${theme.colors.warning}20` }}>
                  <RefreshCw size={20} style={{ color: theme.colors.warning }} />
                </div>
                <p className="text-lg font-bold mb-1" style={{ color: theme.colors.text }}>مزامنة الملاحظات</p>
                <p className="text-xs" style={{ color: theme.colors.textMuted }}>.md مزامنة جميع الملاحظات كملفات</p>
              </button>
            </div>
          )}

          {activeTab === 'ai' && (
            <div className="space-y-4">
              <p className="text-sm" style={{ color: theme.colors.textMuted }}>اختر ملفاً من تصفح الملفات واستخدم زر الذكاء الاصطناعي للتلخيص أو توليد الاختبارات</p>
              {aiAction && (
                <div className="flex items-center gap-2 p-3 rounded-xl" style={{ backgroundColor: `${theme.colors.accent}15` }}>
                  <Loader2 className="w-4 h-4 animate-spin" style={{ color: theme.colors.accent }} />
                  <span className="text-sm" style={{ color: theme.colors.accent }}>
                    {aiAction === 'summarize' ? 'جاري التلخيص...' : 'جاري توليد الاختبار...'}
                  </span>
                </div>
              )}
              {aiResult && (
                <div className="p-4 rounded-2xl" style={{ backgroundColor: 'rgba(255,255,255,0.03)', border: `1px solid rgba(255,255,255,0.06)` }}>
                  <p className="text-sm whitespace-pre-wrap" style={{ color: theme.colors.text }}>{aiResult}</p>
                </div>
              )}
            </div>
          )}
        </>
      )}
    </div>
  )
}
