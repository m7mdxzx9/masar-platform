import { useState, useEffect, useRef } from 'react'
import { motion } from 'framer-motion'
import { HardDrive, Plus, Download, Upload, RefreshCw, Loader2, Trash2, CheckCircle2, AlertCircle, Clock, FileJson } from 'lucide-react'
import { useTheme } from '@/theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import { backupAPI, setCustomBackendUrl, API_BASE_URL } from '@/services/api'

interface BackupEntry {
  filename: string
  date: string
  size_bytes: number
}

export default function BackupPage() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const fileInputRef = useRef<HTMLInputElement>(null)
  const [backups, setBackups] = useState<BackupEntry[]>([])
  const [loading, setLoading] = useState(true)
  const [creating, setCreating] = useState(false)
  const [error, setError] = useState<string | null>(null)
  const [successMsg, setSuccessMsg] = useState<string | null>(null)
  const [customUrl, setCustomUrl] = useState(localStorage.getItem('masar-backend-url') || API_BASE_URL)

  const handleSaveUrl = () => {
    if (!customUrl.trim()) return
    setCustomBackendUrl(customUrl.trim())
  }

  const handleResetUrl = () => {
    setCustomBackendUrl(null)
  }

  const fetchBackups = async () => {
    setLoading(true)
    setError(null)
    try {
      const { data } = await backupAPI.list()
      setBackups(data as BackupEntry[])
    } catch (err: any) {
      setError(err.message || 'Failed to load backups')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => { fetchBackups() }, [])

  const handleCreate = async () => {
    setCreating(true)
    setError(null)
    setSuccessMsg(null)
    try {
      await backupAPI.create()
      setSuccessMsg(t('common.backupCreated'))
      await fetchBackups()
    } catch (err: any) {
      setError(t('common.backupError', { error: err.message || 'Unknown error' }))
    } finally {
      setCreating(false)
    }
  }

  const handleRestore = async (file: File) => {
    if (!window.confirm(t('common.backupConfirm'))) return
    setError(null)
    setSuccessMsg(null)
    try {
      await backupAPI.restore(file)
      setSuccessMsg(t('common.backupRestored'))
      await fetchBackups()
    } catch (err: any) {
      setError(t('common.backupError', { error: err.message || 'Unknown error' }))
    }
  }

  const handleFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0]
    if (file) handleRestore(file)
    if (fileInputRef.current) fileInputRef.current.value = ''
  }

  const formatSize = (bytes: number) => {
    if (bytes < 1024) return `${bytes} B`
    if (bytes < 1024 * 1024) return `${(bytes / 1024).toFixed(1)} KB`
    return `${(bytes / (1024 * 1024)).toFixed(1)} MB`
  }

  const formatDate = (dateStr: string) => {
    const d = new Date(
      parseInt(dateStr.slice(0, 4)),
      parseInt(dateStr.slice(4, 6)) - 1,
      parseInt(dateStr.slice(6, 8)),
      parseInt(dateStr.slice(9, 11)) || 0,
      parseInt(dateStr.slice(11, 13)) || 0,
      parseInt(dateStr.slice(13, 15)) || 0,
    )
    return d.toLocaleDateString('ar-SA', { year: 'numeric', month: 'short', day: 'numeric', hour: '2-digit', minute: '2-digit' })
  }

  return (
    <div className="h-full overflow-y-auto p-6">
      <div className="flex items-center justify-between mb-8">
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 rounded-2xl flex items-center justify-center" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <HardDrive size={24} className="text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{t('common.backup')}</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{backups.length} {t('common.files')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          <input ref={fileInputRef} type="file" accept=".json" onChange={handleFileSelect} className="hidden" />
          <button onClick={() => fileInputRef.current?.click()}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm transition-all hover:scale-105 shadow-lg"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}50, ${theme.colors.accent}50)`, color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}>
            <Upload size={16} />{t('common.uploadBackup')}
          </button>
          <button onClick={handleCreate} disabled={creating}
            className="flex items-center gap-2 px-5 py-3 rounded-xl font-bold text-sm text-white transition-all hover:scale-105 shadow-lg disabled:opacity-50"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            {creating ? <Loader2 className="w-4 h-4 animate-spin" /> : <Plus size={16} />}
            {t('common.createBackup')}
          </button>
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

      {loading ? (
        <div className="flex items-center justify-center py-20"><Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} /></div>
      ) : backups.length === 0 ? (
        <div className="flex flex-col items-center justify-center py-20 opacity-50">
          <HardDrive size={64} className="mb-4" style={{ color: theme.colors.textDark }} />
          <p className="text-xl font-bold" style={{ color: theme.colors.text }}>{t('common.noBackups')}</p>
          <p className="text-sm mt-2" style={{ color: theme.colors.textMuted }}>{t('common.createBackup')}</p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {backups.map((backup, idx) => (
            <motion.div key={backup.filename} initial={{ opacity: 0, y: 10 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: idx * 0.03 }}
              className="rounded-2xl p-5 backdrop-blur-[20px] shadow-lg hover:-translate-y-1 transition-all duration-300"
              style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
              <div className="flex items-start justify-between mb-4">
                <div className="w-10 h-10 rounded-xl flex items-center justify-center" style={{ background: `${theme.colors.accent}20` }}>
                  <FileJson size={20} style={{ color: theme.colors.accent }} />
                </div>
                <div className="flex gap-1">
                  <a href={backupAPI.downloadUrl(backup.filename)} download
                    className="p-2 rounded-lg hover:bg-white/10 transition-all" title={t('common.download')} style={{ color: theme.colors.accent }}>
                    <Download size={14} />
                  </a>
                </div>
              </div>
              <p className="text-sm font-bold truncate" style={{ color: theme.colors.text }}>{backup.filename}</p>
              <div className="flex items-center gap-3 mt-2 text-[11px]" style={{ color: theme.colors.textMuted }}>
                <span className="flex items-center gap-1"><Clock size={10} />{formatDate(backup.date)}</span>
                <span>{formatSize(backup.size_bytes)}</span>
              </div>
            </motion.div>
          ))}
        </div>
      )}

      {/* Server Configuration Section */}
      <div className="mt-12 p-6 rounded-2xl border transition-all duration-300"
        style={{ backgroundColor: 'rgba(255,255,255,0.01)', borderColor: 'rgba(255,255,255,0.06)' }}>
        <h2 className="text-xl font-bold mb-2" style={{ color: theme.colors.text }}>📡 إعدادات الاتصال بالخادم الرئيسي (Server Connection)</h2>
        <p className="text-xs mb-4" style={{ color: theme.colors.textMuted }}>
          إذا كنت تستخدم أجهزة متعددة وتريد مزامنتها معاً، يرجى كتابة عنوان الـ IP والمنفذ للخادم الرئيسي هنا (مثال: http://192.168.1.100:8000/api/v1).
        </p>
        <div className="flex flex-col sm:flex-row gap-3">
          <input
            type="text"
            placeholder="مثال: http://localhost:8000/api/v1"
            value={customUrl}
            onChange={(e) => setCustomUrl(e.target.value)}
            className="flex-1 px-4 py-3 rounded-xl bg-black/20 border outline-none text-sm font-mono text-left"
            style={{ borderColor: 'rgba(255,255,255,0.1)', color: theme.colors.text, direction: 'ltr' }}
          />
          <div className="flex gap-2">
            <button
              onClick={handleSaveUrl}
              className="px-5 py-3 rounded-xl font-bold text-xs text-white transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}
            >
              حفظ وتحديث
            </button>
            {localStorage.getItem('masar-backend-url') && (
              <button
                onClick={handleResetUrl}
                className="px-5 py-3 rounded-xl font-bold text-xs transition-all hover:scale-105"
                style={{ backgroundColor: 'rgba(255,255,255,0.05)', color: theme.colors.text, border: `1px solid ${theme.colors.border}` }}
              >
                إعادة ضبط
              </button>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
