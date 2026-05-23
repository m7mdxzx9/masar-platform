import { useState, useCallback, useRef } from 'react'
import { Loader2, Play, Trash2, Copy, Check, Terminal, Clock, Download, BookmarkPlus, Upload, Sparkles, Lightbulb, Plus, FileCode, LayoutGrid, ChevronUp, ChevronDown } from 'lucide-react'
import { useNavigate } from 'react-router-dom'
import { usePyodide } from '@/hooks/usePyodide'
import { useTheme } from '@/theme/ThemeContext'
import { useTranslation } from 'react-i18next'
import { labsAPI, snippetsAPI, labsEnhancedAPI } from '@/services/api'
import CodeMirrorEditor from '../components/lab/CodeMirrorEditor'

const INITIAL_CODE = `# مرحباً بك في مختبر مسار
import numpy as np
import pandas as pd

# ── مثال 1: إنشاء مصفوفة ──
arr = np.array([1, 2, 3, 4, 5])
print("المصفوفة:", arr)
print("المتوسط:", arr.mean())

# ── مثال 2: DataFrame ──
data = {'name': ['أحمد', 'فاطمة', 'عمر'], 'age': [22, 25, 24]}
df = pd.DataFrame(data)
print("\\nDataFrame:")
print(df)

# ── جرب تعديل الكود وشاهد النتيجة! ──
`

interface NotebookCell {
  id: string
  code: string
  output: string
  error: string
}

let cellCounter = 0
const newCell = (code = ''): NotebookCell => ({ id: `cell-${++cellCounter}`, code, output: '', error: '' })

type TabMode = 'file' | 'notebook'

export default function LabsPage() {
  const { theme } = useTheme()
  const { t } = useTranslation()
  const navigate = useNavigate()
  const [mode, setMode] = useState<TabMode>('file')

  // File mode state
  const [code, setCode] = useState(INITIAL_CODE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null)
  const [aiLoading, setAiLoading] = useState<string | null>(null)
  const [aiSuggestion, setAiSuggestion] = useState('')

  // Notebook mode state
  const [cells, setCells] = useState<NotebookCell[]>([newCell('')])
  const [runningCells, setRunningCells] = useState<Set<string>>(new Set())



  const { isLoading, isReady, error: pyodideError, runPython, retry } = usePyodide()

  // File mode handlers
  const handleRun = async () => {
    setOutput('')
    setError('')
    setAiSuggestion('')
    setIsRunning(true)
    try {
      const result = await runPython(code)
      setOutput(result.output)
      if (result.error) setError(result.error)
      setLastExecutionTime(result.duration)
      parseVariables(code, result.output)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally { setIsRunning(false) }
  }

  const handleCorrectCode = async () => {
    if (!error) return
    setAiLoading('correct')
    setAiSuggestion('')
    try {
      const { data } = await labsAPI.correctCode(code, error)
      setAiSuggestion(data.suggestion)
    } catch (err: any) {
      setAiSuggestion(t('labs.aiFailed', { error: err.message || 'Unknown error' }))
    } finally { setAiLoading(null) }
  }

  const handleCompleteCode = async () => {
    setAiLoading('complete')
    setAiSuggestion('')
    try {
      const { data } = await labsAPI.completeCode(code, code.length)
      setAiSuggestion(data.completion)
    } catch (err: any) {
      setAiSuggestion(t('labs.aiFailed', { error: err.message || 'Unknown error' }))
    } finally { setAiLoading(null) }
  }

  const handleExport = () => {
    const blob = new Blob([code], { type: 'text/plain;charset=utf-8' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url; a.download = 'masar_code.py'
    document.body.appendChild(a); a.click()
    document.body.removeChild(a)
    URL.revokeObjectURL(url)
  }

  const handleSaveToLibrary = async () => {
    const title = prompt(t('labs.saveTitle'))
    if (!title || !title.trim()) return
    try {
      await snippetsAPI.create({ title: title.trim(), code, language: 'python' })
      alert(t('labs.saved'))
    } catch (err: any) {
      alert(t('labs.saveFailed', { error: err.message || 'Unknown error' }))
    }
  }

  const applyAiSuggestion = () => {
    if (aiSuggestion) { setCode(aiSuggestion); setAiSuggestion('') }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => { setOutput(''); setError(''); setAiSuggestion('') }

  const [variables, setVariables] = useState<{ name: string; value: string; type: string }[]>([])
  const [showVariables, setShowVariables] = useState(false)
  const notebookInputRef = useRef<HTMLInputElement>(null)

  // Parse variables from output by looking for assignment patterns
  const parseVariables = (code: string, output: string) => {
    const vars: { name: string; value: string; type: string }[] = []
    const assignRegex = /([a-zA-Z_]\w*)\s*=\s*(.+)/g
    let match
    while ((match = assignRegex.exec(code)) !== null) {
      const name = match[1]
      const val = match[2].trim()
      if (!['import', 'from', 'def ', 'class ', 'if ', 'for ', 'while ', 'with ', 'try:', 'except', 'finally'].some(k => val.startsWith(k))) {
        const typeGuess = val.startsWith('"') || val.startsWith("'") ? 'str' : /^\d+\./.test(val) ? 'float' : /^\d+$/.test(val) ? 'int' : /^(True|False)$/.test(val) ? 'bool' : /^\[/.test(val) ? 'list' : /^\{/.test(val) ? 'dict' : 'unknown'
        vars.push({ name, value: val.length > 60 ? val.slice(0, 60) + '...' : val, type: typeGuess })
      }
    }
    setVariables(vars)
  }

  const handleNotebookExport = async () => {
    try {
      const { data } = await labsEnhancedAPI.exportNotebook(cells)
      const url = URL.createObjectURL(data as Blob)
      const a = document.createElement('a')
      a.href = url; a.download = 'masar-notebook.ipynb'; a.click()
      URL.revokeObjectURL(url)
    } catch { /* ignore */ }
  }

  const handleNotebookImport = async (file: File) => {
    try {
      const { data } = await labsEnhancedAPI.importNotebook(file)
      setCells(data.cells.map(c => newCell(c.code)))
    } catch { /* ignore */ }
  }

  const handleReset = () => {
    setCode(INITIAL_CODE); setOutput(''); setError(''); setAiSuggestion('')
  }

  // Notebook handlers
  const addCellAbove = (id: string) => {
    setCells(prev => {
      const idx = prev.findIndex(c => c.id === id)
      const next = [...prev]
      next.splice(idx, 0, newCell(''))
      return next
    })
  }

  const addCellBelow = (id: string) => {
    setCells(prev => {
      const idx = prev.findIndex(c => c.id === id)
      const next = [...prev]
      next.splice(idx + 1, 0, newCell(''))
      return next
    })
  }

  const deleteCell = (id: string) => {
    setCells(prev => prev.length > 1 ? prev.filter(c => c.id !== id) : prev)
  }

  const moveCell = (id: string, dir: 'up' | 'down') => {
    setCells(prev => {
      const idx = prev.findIndex(c => c.id === id)
      if (dir === 'up' && idx === 0) return prev
      if (dir === 'down' && idx === prev.length - 1) return prev
      const next = [...prev]
      const swapIdx = dir === 'up' ? idx - 1 : idx + 1
      ;[next[idx], next[swapIdx]] = [next[swapIdx], next[idx]]
      return next
    })
  }

  const updateCellCode = (id: string, code: string) => {
    setCells(prev => prev.map(c => c.id === id ? { ...c, code } : c))
  }

  const runCell = async (id: string) => {
    const cell = cells.find(c => c.id === id)
    if (!cell) return
    setRunningCells(prev => new Set(prev).add(id))
    setCells(prev => prev.map(c => c.id === id ? { ...c, output: '', error: '' } : c))
    try {
      const result = await runPython(cell.code)
      setCells(prev => prev.map(c => c.id === id ? { ...c, output: result.output, error: result.error || '' } : c))
    } catch (err: any) {
      setCells(prev => prev.map(c => c.id === id ? { ...c, error: err.message || String(err) } : c))
    } finally {
      setRunningCells(prev => { const next = new Set(prev); next.delete(id); return next })
    }
  }

  const runAllCells = async () => {
    for (const cell of cells) {
      setRunningCells(prev => new Set(prev).add(cell.id))
      setCells(prev => prev.map(c => c.id === cell.id ? { ...c, output: '', error: '' } : c))
      try {
        const result = await runPython(cell.code)
        setCells(prev => prev.map(c => c.id === cell.id ? { ...c, output: result.output, error: result.error || '' } : c))
      } catch (err: any) {
        setCells(prev => prev.map(c => c.id === cell.id ? { ...c, error: err.message || String(err) } : c))
      } finally {
        setRunningCells(prev => { const next = new Set(prev); next.delete(cell.id); return next })
      }
    }
  }



  const tabButton = (tab: TabMode, icon: React.ReactNode, label: string) => (
    <button onClick={() => setMode(tab)}
      className={`flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold transition-all ${mode === tab ? 'text-white shadow-md' : ''}`}
      style={{
        background: mode === tab ? `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` : 'transparent',
        color: mode === tab ? '#fff' : theme.colors.textMuted,
        border: mode === tab ? 'none' : `1px solid ${theme.colors.border}`,
      }}>
      {icon}{label}
    </button>
  )

  const renderEditor = () => (
    <div className="flex-1 min-h-[400px] relative">
      <CodeMirrorEditor value={code} onChange={setCode} height="400px" />
    </div>
  )

  const renderNotebook = () => (
    <div className="flex-1 overflow-y-auto space-y-4 p-4">
      <div className="flex items-center justify-between">
        <span className="text-xs font-bold" style={{ color: theme.colors.textMuted }}>{cells.length} {t('labs.cell')}</span>
        <div className="flex items-center gap-2">
          <input ref={notebookInputRef} type="file" accept=".ipynb" onChange={e => { if (e.target.files?.[0]) handleNotebookImport(e.target.files[0]); e.target.value = '' }} className="hidden" />
          <button onClick={() => notebookInputRef.current?.click()} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-white/10"
            style={{ color: theme.colors.textMuted, border: `1px solid rgba(255,255,255,0.1)` }}>
            <Upload size={12} /> {t('labs.importIpynb', 'استيراد')}
          </button>
          <button onClick={handleNotebookExport} className="flex items-center gap-1 px-3 py-1.5 rounded-xl text-xs font-bold transition-all hover:bg-white/10"
            style={{ color: theme.colors.textMuted, border: `1px solid rgba(255,255,255,0.1)` }}>
            <Download size={12} /> {t('labs.exportIpynb', 'تصدير')}
          </button>
          <button onClick={runAllCells} disabled={!isReady}
            className="flex items-center gap-2 px-4 py-2 rounded-xl text-xs font-bold text-white disabled:opacity-50 transition-all hover:scale-105"
            style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <Play size={12} fill="currentColor" />{t('labs.runAll')}
          </button>
        </div>
      </div>
      {cells.map((cell, idx) => (
        <div key={cell.id} className="rounded-xl overflow-hidden backdrop-blur-[20px] shadow-lg"
          style={{ backgroundColor: 'rgba(255,255,255,0.02)', border: `1px solid rgba(255,255,255,0.06)` }}>
          <div className="flex items-center justify-between px-3 py-2" style={{ backgroundColor: 'rgba(0,0,0,0.3)', borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
            <span className="text-[10px] font-bold" style={{ color: theme.colors.textMuted }}>{t('labs.cell')} {idx + 1}</span>
            <div className="flex gap-1">
              <button onClick={() => moveCell(cell.id, 'up')} className="p-1 rounded hover:bg-white/10" title="Move up"><ChevronUp size={12} style={{ color: theme.colors.textMuted }} /></button>
              <button onClick={() => moveCell(cell.id, 'down')} className="p-1 rounded hover:bg-white/10" title="Move down"><ChevronDown size={12} style={{ color: theme.colors.textMuted }} /></button>
              <button onClick={() => addCellAbove(cell.id)} className="p-1 rounded hover:bg-white/10" title={t('labs.addCellAbove')}><Plus size={12} style={{ color: theme.colors.textMuted }} /></button>
              <button onClick={() => addCellBelow(cell.id)} className="p-1 rounded hover:bg-white/10" title={t('labs.addCellBelow')}><Plus size={12} style={{ color: theme.colors.textMuted }} /></button>
              <button onClick={() => deleteCell(cell.id)} className="p-1 rounded hover:bg-white/10 hover:text-red-400" title={t('labs.deleteCell')} style={{ color: theme.colors.textMuted }}><Trash2 size={12} /></button>
            </div>
          </div>
          <div className="min-h-[100px]">
            <CodeMirrorEditor value={cell.code} onChange={(v) => updateCellCode(cell.id, v)} height="100px" />
          </div>
          <div className="px-3 py-2 flex gap-2" style={{ borderTop: `1px solid rgba(255,255,255,0.05)` }}>
            <button onClick={() => runCell(cell.id)} disabled={!isReady}
              className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-bold text-white disabled:opacity-50 transition-all hover:scale-105"
              style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
              {runningCells.has(cell.id) ? <Loader2 size={10} className="animate-spin" /> : <Play size={10} fill="currentColor" />}
              {t('labs.runCell')}
            </button>
          </div>
          {cell.output && (
            <pre className="px-4 py-3 text-xs font-mono whitespace-pre-wrap" dir="ltr" style={{ color: theme.colors.success, backgroundColor: 'rgba(0,0,0,0.3)', borderTop: `1px solid rgba(255,255,255,0.05)` }}>{cell.output}</pre>
          )}
          {cell.error && (
            <pre className="px-4 py-3 text-xs font-mono whitespace-pre-wrap" dir="ltr" style={{ color: theme.colors.error, backgroundColor: 'rgba(0,0,0,0.3)', borderTop: `1px solid rgba(255,255,255,0.05)` }}>{cell.error}</pre>
          )}
        </div>
      ))}
    </div>
  )



  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ border: `1px solid rgba(255, 255, 255, 0.05)` }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>{t('labs.title')}</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>{t('labs.subtitle')}</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && !isReady ? (
            <span className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-inner"
              style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning, border: `1px solid ${theme.colors.warning}40` }}>
              <Loader2 className="w-4 h-4 animate-spin" />
              {t('labs.loadingPython')}
            </span>
          ) : isReady ? (
            <span className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-inner"
              style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success, border: `1px solid ${theme.colors.success}40` }}>
              <span className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]" style={{ backgroundColor: theme.colors.success }} />
              {t('labs.pythonReady')}
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span className="px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md"
                style={{ backgroundColor: theme.colors.error + '20', color: theme.colors.error, border: `1px solid ${theme.colors.error}40` }}
                title={pyodideError || ''}>
                {pyodideError ? t('labs.loadError', { error: pyodideError }) : t('labs.loadFailed')}
              </span>
              <button onClick={() => retry()}
                className="px-3 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-white/10"
                style={{ color: theme.colors.text }}>
                {t('labs.retry')}
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Tab Bar */}
      <div className="flex gap-2">
        {tabButton('file', <FileCode size={14} />, t('labs.singleFile'))}
        {tabButton('notebook', <LayoutGrid size={14} />, t('labs.notebookMode'))}
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        {/* Editor Panel: 60% */}
        <div className="col-span-1 lg:col-span-3 flex flex-col rounded-2xl min-h-[400px] lg:min-h-0 backdrop-blur-[20px] shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}>
          {/* Toolbar */}
          <div className="flex justify-between items-center p-4 shrink-0 bg-black/20"
            style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}>
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5" style={{ color: theme.colors.accent }} />
              <span className="font-bold text-lg" style={{ color: theme.colors.text }}>
                {mode === 'file' ? t('labs.editor') : t('labs.notebook')}
              </span>
              <span className="text-xs px-3 py-1 rounded-lg font-bold"
                style={{ color: '#fff', backgroundColor: theme.colors.accent + '40', border: `1px solid ${theme.colors.accent}60` }}>
                Python 3.11
              </span>
            </div>
            {mode === 'file' && (
              <div className="flex gap-2">
                <button onClick={handleSaveToLibrary} className="p-2.5 rounded-xl transition-all hover:bg-white/10" title={t('labs.saveLibrary')} style={{ color: theme.colors.text }}>
                  <BookmarkPlus className="w-5 h-5" />
                </button>
                <button onClick={handleExport} className="p-2.5 rounded-xl transition-all hover:bg-white/10" title={t('labs.export')} style={{ color: theme.colors.text }}>
                  <Download className="w-5 h-5" />
                </button>
                <button onClick={() => navigate('/code-library')} className="p-2.5 rounded-xl transition-all hover:bg-white/10" title={t('labs.library')} style={{ color: theme.colors.text }}>
                  <BookmarkPlus className="w-5 h-5" />
                </button>
                <button onClick={handleCopy} className="p-2.5 rounded-xl transition-all hover:bg-white/10" title={t('labs.copy')} style={{ color: theme.colors.text }}>
                  {isCopied ? <Check className="w-5 h-5" style={{ color: theme.colors.success }} /> : <Copy className="w-5 h-5" />}
                </button>
                <button onClick={handleReset} className="p-2.5 rounded-xl transition-all hover:bg-white/10 hover:text-red-400" title={t('labs.reset')} style={{ color: theme.colors.text }}>
                  <Trash2 className="w-5 h-5" />
                </button>
              </div>
            )}
          </div>

          {/* Content */}
          {mode === 'file' && renderEditor()}
          {mode === 'notebook' && renderNotebook()}

          {/* Run + AI buttons (file mode only) */}
          {mode === 'file' && (
            <div className="p-4 shrink-0 bg-black/20 space-y-3" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)` }}>
              <div className="flex gap-3">
                <button onClick={handleRun} disabled={!isReady || isRunning}
                  className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                  style={{ background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)` }}>
                  {isRunning ? <Loader2 className="w-5 h-5 animate-spin" /> : <Play className="w-5 h-5" fill="currentColor" />}
                  {isRunning ? t('labs.running') : t('labs.run')}
                </button>
                <button onClick={handleCompleteCode} disabled={aiLoading !== null}
                  className="flex items-center justify-center gap-2 flex-1 py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                  style={{ background: `linear-gradient(135deg, #6366f1, #8b5cf6)` }}>
                  {aiLoading === 'complete' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Lightbulb className="w-5 h-5" />}
                  {t('labs.suggest')}
                </button>
              </div>
              {error && (
                <button onClick={handleCorrectCode} disabled={aiLoading !== null}
                  className="flex items-center justify-center gap-2 w-full py-3 rounded-xl font-bold text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
                  style={{ background: `linear-gradient(135deg, #ef4444, #f97316)` }}>
                  {aiLoading === 'correct' ? <Loader2 className="w-5 h-5 animate-spin" /> : <Sparkles className="w-5 h-5" />}
                  {t('labs.correct')}
                </button>
              )}
            </div>
          )}
        </div>

        {/* Output Panel: 40% (file mode only) */}
        {mode === 'file' && (
          <div className="col-span-1 lg:col-span-2 flex flex-col rounded-2xl min-h-[300px] lg:min-h-0 backdrop-blur-[20px] shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}>
            <div className="flex justify-between items-center p-4 shrink-0 bg-black/20"
              style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}>
              <div className="flex items-center gap-3">
                <Terminal className="w-5 h-5" style={{ color: theme.colors.success }} />
                <span className="font-bold text-lg" style={{ color: theme.colors.text }}>{t('labs.output')}</span>
                {lastExecutionTime !== null && (
                  <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ color: theme.colors.textMuted, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                    <Clock className="w-3.5 h-3.5" />
                    {lastExecutionTime} ms
                  </span>
                )}
              </div>
                <button onClick={() => setShowVariables(!showVariables)}
                  className={`p-2 rounded-xl transition-all hover:bg-white/10 flex items-center gap-2 ${showVariables ? 'bg-white/10' : ''}`}
                  style={{ color: showVariables ? theme.colors.accent : theme.colors.text }}>
                  <Terminal className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('labs.variables', 'المتغيرات')}</span>
                </button>
                <button onClick={handleClear}
                  className="p-2 rounded-xl transition-all hover:bg-white/10 flex items-center gap-2"
                  style={{ color: theme.colors.text }}>
                  <Trash2 className="w-4 h-4" />
                  <span className="text-sm font-medium">{t('labs.clear')}</span>
                </button>
              </div>
            {showVariables && (
              <div className="shrink-0 p-4 bg-black/20" style={{ borderBottom: `1px solid rgba(255,255,255,0.05)` }}>
                <div className="flex items-center justify-between mb-2">
                  <span className="text-xs font-bold" style={{ color: theme.colors.textMuted }}>المتغيرات ({variables.length})</span>
                  <button onClick={() => setShowVariables(false)} className="text-[10px] p-1 rounded hover:bg-white/10" style={{ color: theme.colors.textMuted }}>إخفاء</button>
                </div>
                <div className="space-y-1 max-h-32 overflow-y-auto">
                  {variables.length === 0 ? (
                    <span className="text-xs" style={{ color: theme.colors.textMuted }}>لا توجد متغيرات</span>
                  ) : (
                    variables.map((v, i) => (
                      <div key={i} className="flex items-center gap-2 text-xs px-2 py-1 rounded" style={{ backgroundColor: 'rgba(255,255,255,0.03)' }}>
                        <span className="font-bold text-[10px] px-1.5 py-0.5 rounded" style={{ backgroundColor: `${theme.colors.accent}20`, color: theme.colors.accent }}>{v.type}</span>
                        <span className="font-bold" style={{ color: theme.colors.text }}>{v.name}</span>
                        <span style={{ color: theme.colors.textMuted }}>=</span>
                        <span className="truncate" style={{ color: theme.colors.success }}>{v.value}</span>
                      </div>
                    ))
                  )}
                </div>
              </div>
            )}
            <div className="flex-1 p-6 overflow-auto font-mono text-sm rounded-b-2xl min-h-0"
              style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}>
              {isRunning && !output && !error && !aiSuggestion && (
                <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: theme.colors.textMuted }}>
                  <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
                  <span className="font-medium text-lg">{t('labs.running')}</span>
                </div>
              )}
              {!isRunning && !output && !error && !aiSuggestion && (
                <div className="h-full flex flex-col items-center justify-center opacity-40" style={{ color: theme.colors.text }}>
                  <Terminal className="w-16 h-16 mb-4" />
                  <p className="text-lg font-bold">{t('labs.emptyOutput')}</p>
                  <p className="text-sm mt-2 text-center">{t('labs.emptyOutputDesc')}</p>
                </div>
              )}
              {output && !aiSuggestion && (
                <pre className="whitespace-pre-wrap text-base leading-relaxed" dir="ltr" style={{ color: theme.colors.success }}>{output}</pre>
              )}
              {error && !aiSuggestion && (
                <pre className="whitespace-pre-wrap mt-4 pt-4 text-base leading-relaxed" dir="ltr"
                  style={{ color: theme.colors.error, borderTop: `1px dashed rgba(255, 255, 255, 0.1)` }}>
                  {error}
                </pre>
              )}
              {aiSuggestion && (
                <div className="flex flex-col h-full">
                  <div className="flex items-center justify-between mb-3 shrink-0">
                    <span className="text-sm font-bold" style={{ color: theme.colors.accent }}>{t('labs.aiSuggestion')}</span>
                    <div className="flex gap-2">
                      <button onClick={() => setAiSuggestion('')}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:bg-white/10"
                        style={{ color: theme.colors.textMuted, border: `1px solid ${theme.colors.border}` }}>
                        {t('labs.dismiss')}
                      </button>
                      <button onClick={applyAiSuggestion}
                        className="text-xs px-3 py-1.5 rounded-lg font-medium transition-all hover:scale-105 text-white"
                        style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
                        {t('labs.apply')}
                      </button>
                    </div>
                  </div>
                  <pre className="whitespace-pre-wrap text-sm leading-relaxed flex-1 overflow-auto" dir="ltr"
                    style={{ color: theme.colors.text, backgroundColor: 'rgba(0,0,0,0.3)', borderRadius: '0.75rem', padding: '1rem' }}>
                    {aiSuggestion}
                  </pre>
                </div>
              )}
              {pyodideError && (
                <div className="mt-4 p-4 rounded-xl backdrop-blur-md" style={{ backgroundColor: theme.colors.warning + '20', border: `1px solid ${theme.colors.warning}40` }}>
                  <pre className="whitespace-pre-wrap text-sm" dir="ltr" style={{ color: theme.colors.warning }}>{pyodideError}</pre>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Empty placeholder for notebook/git modes to use the right side */}
        {mode !== 'file' && (
          <div className="col-span-1 lg:col-span-2 flex flex-col rounded-2xl min-h-[300px] lg:min-h-0 backdrop-blur-[20px] shadow-2xl overflow-hidden"
            style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}>
            <div className="flex items-center justify-center h-full opacity-40" style={{ color: theme.colors.text }}>
              <Terminal className="w-12 h-12 mb-2" />
              <p className="text-sm font-bold">{t('labs.notebook')}</p>
            </div>
          </div>
        )}
      </div>
    </div>
  )
}
