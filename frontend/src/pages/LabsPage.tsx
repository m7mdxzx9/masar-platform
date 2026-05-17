import { useState } from 'react'
import { Loader2, Play, Trash2, Copy, Check, Terminal, Clock } from 'lucide-react'
import { usePyodide } from '@/hooks/usePyodide'
import { useTheme } from '@/theme/ThemeContext'
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

export default function LabsPage() {
  const { theme } = useTheme()
  const [code, setCode] = useState(INITIAL_CODE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const [isRunning, setIsRunning] = useState(false)
  const [lastExecutionTime, setLastExecutionTime] = useState<number | null>(null)
  const { isLoading, isReady, error: pyodideError, runPython, retry } = usePyodide()

  const handleRun = async () => {
    setOutput('')
    setError('')
    setIsRunning(true)

    try {
      const result = await runPython(code)
      setOutput(result.output)
      if (result.error) setError(result.error)
      setLastExecutionTime(result.duration)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
    } finally {
      setIsRunning(false)
    }
  }

  const handleCopy = () => {
    navigator.clipboard.writeText(code)
    setIsCopied(true)
    setTimeout(() => setIsCopied(false), 2000)
  }

  const handleClear = () => {
    setOutput('')
    setError('')
  }

  const handleReset = () => {
    setCode(INITIAL_CODE)
    setOutput('')
    setError('')
  }

  return (
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-6">
      {/* Header */}
      <div className="flex justify-between items-center bg-white/5 p-6 rounded-2xl backdrop-blur-[20px] shadow-lg" style={{ border: `1px solid rgba(255, 255, 255, 0.05)` }}>
        <div className="flex items-center gap-4">
          <div className="w-12 h-12 flex items-center justify-center rounded-xl shadow-lg" style={{ background: `linear-gradient(135deg, ${theme.colors.secondary}, ${theme.colors.accent})` }}>
            <Terminal className="w-6 h-6 text-white" />
          </div>
          <div>
            <h1 className="text-3xl font-bold" style={{ color: theme.colors.text }}>المختبر الذكي</h1>
            <p className="text-sm mt-1" style={{ color: theme.colors.textMuted }}>اكتب ونفذ كود بايثون مباشرة في المتصفح</p>
          </div>
        </div>
        <div className="flex items-center gap-3">
          {isLoading && !isReady ? (
            <span
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-inner"
              style={{ backgroundColor: theme.colors.warning + '20', color: theme.colors.warning, border: `1px solid ${theme.colors.warning}40` }}
            >
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ تحميل Python... (قد يستغرق 30 ثانية)
            </span>
          ) : isReady ? (
            <span
              className="px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 backdrop-blur-md shadow-inner"
              style={{ backgroundColor: theme.colors.success + '20', color: theme.colors.success, border: `1px solid ${theme.colors.success}40` }}
            >
              <span
                className="w-2.5 h-2.5 rounded-full animate-pulse shadow-[0_0_8px_currentColor]"
                style={{ backgroundColor: theme.colors.success }}
              />
              Python جاهز ✓
            </span>
          ) : (
            <div className="flex items-center gap-2">
              <span
                className="px-4 py-2 rounded-xl text-sm font-bold backdrop-blur-md"
                style={{ backgroundColor: theme.colors.error + '20', color: theme.colors.error, border: `1px solid ${theme.colors.error}40` }}
                title={pyodideError || ''}
              >
                {pyodideError ? `فشل التحميل: ${pyodideError}` : 'فشل التحميل'}
              </span>
              <button
                onClick={() => retry()}
                className="px-3 py-2 rounded-xl text-sm font-bold transition-colors hover:bg-white/10"
                style={{ color: theme.colors.text }}
              >
                إعادة المحاولة
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex-1 grid grid-cols-1 lg:grid-cols-5 gap-6 min-h-0">
        {/* Editor Panel: 60% */}
        <div
          className="col-span-1 lg:col-span-3 flex flex-col rounded-2xl min-h-[400px] lg:min-h-0 backdrop-blur-[20px] shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}
        >
          {/* Editor toolbar */}
          <div
            className="flex justify-between items-center p-4 shrink-0 bg-black/20"
            style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5" style={{ color: theme.colors.accent }} />
              <span className="font-bold text-lg" style={{ color: theme.colors.text }}>محرر الكود</span>
              <span
                className="text-xs px-3 py-1 rounded-lg font-bold"
                style={{ color: '#fff', backgroundColor: theme.colors.accent + '40', border: `1px solid ${theme.colors.accent}60` }}
              >
                Python 3.11
              </span>
            </div>
            <div className="flex gap-2">
              <button
                onClick={handleCopy}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10"
                title="نسخ الكود"
                style={{ color: theme.colors.text }}
              >
                {isCopied ? (
                  <Check className="w-5 h-5" style={{ color: theme.colors.success }} />
                ) : (
                  <Copy className="w-5 h-5" />
                )}
              </button>
              <button
                onClick={handleReset}
                className="p-2.5 rounded-xl transition-all hover:bg-white/10 hover:text-red-400"
                title="إعادة تعيين"
                style={{ color: theme.colors.text }}
              >
                <Trash2 className="w-5 h-5" />
              </button>
            </div>
          </div>

          {/* Code Editor */}
          <div className="flex-1 min-h-[400px] relative">
            <CodeMirrorEditor value={code} onChange={setCode} height="400px" />
          </div>

          {/* Run button */}
          <div className="p-4 shrink-0 bg-black/20" style={{ borderTop: `1px solid rgba(255, 255, 255, 0.05)` }}>
            <button
              onClick={handleRun}
              disabled={!isReady || isRunning}
              className="flex items-center justify-center gap-3 w-full py-4 rounded-xl font-bold text-lg text-white disabled:opacity-50 transition-all hover:scale-[1.01] active:scale-[0.99] shadow-xl"
              style={{
                background: `linear-gradient(135deg, ${theme.colors.secondary} 0%, ${theme.colors.accent} 100%)`,
              }}
            >
              <span className="w-6 h-6 flex items-center justify-center">
                {isRunning ? (
                  <Loader2 className="w-6 h-6 animate-spin" />
                ) : (
                  <Play className="w-6 h-6" fill="currentColor" />
                )}
              </span>
              <span>{isRunning ? 'جارِ التنفيذ...' : 'تشغيل الكود'}</span>
            </button>
          </div>
        </div>

        {/* Output Panel: 40% */}
        <div
          className="col-span-1 lg:col-span-2 flex flex-col rounded-2xl min-h-[300px] lg:min-h-0 backdrop-blur-[20px] shadow-2xl overflow-hidden"
          style={{ backgroundColor: 'rgba(255, 255, 255, 0.02)', border: `1px solid rgba(255, 255, 255, 0.06)` }}
        >
          {/* Output header */}
          <div
            className="flex justify-between items-center p-4 shrink-0 bg-black/20"
            style={{ borderBottom: `1px solid rgba(255, 255, 255, 0.05)` }}
          >
            <div className="flex items-center gap-3">
              <Terminal className="w-5 h-5" style={{ color: theme.colors.success }} />
              <span className="font-bold text-lg" style={{ color: theme.colors.text }}>النتيجة</span>
              {lastExecutionTime !== null && (
                <span className="flex items-center gap-1 text-xs px-2 py-1 rounded-md" style={{ color: theme.colors.textMuted, backgroundColor: 'rgba(255,255,255,0.05)' }}>
                  <Clock className="w-3.5 h-3.5" />
                  {lastExecutionTime} ms
                </span>
              )}
            </div>
            <button
              onClick={handleClear}
              className="p-2 rounded-xl transition-all hover:bg-white/10 flex items-center gap-2"
              style={{ color: theme.colors.text }}
            >
              <Trash2 className="w-4 h-4" />
              <span className="text-sm font-medium">مسح</span>
            </button>
          </div>

          {/* Output content */}
          <div
            className="flex-1 p-6 overflow-auto font-mono text-sm rounded-b-2xl min-h-0"
            style={{ backgroundColor: 'rgba(0, 0, 0, 0.4)', boxShadow: 'inset 0 0 20px rgba(0,0,0,0.5)' }}
          >
            {isRunning && !output && !error && (
              <div className="flex flex-col items-center justify-center h-full gap-3" style={{ color: theme.colors.textMuted }}>
                <Loader2 className="w-8 h-8 animate-spin" style={{ color: theme.colors.accent }} />
                <span className="font-medium text-lg">جارٍ التنفيذ...</span>
              </div>
            )}
            {!isRunning && !output && !error && (
              <div className="h-full flex flex-col items-center justify-center opacity-40" style={{ color: theme.colors.text }}>
                <Terminal className="w-16 h-16 mb-4" />
                <p className="text-lg font-bold">المخرجات فارغة</p>
                <p className="text-sm mt-2 text-center">اضغط "تشغيل الكود" لرؤية النتيجة هنا</p>
              </div>
            )}
            {output && (
              <pre className="whitespace-pre-wrap text-base leading-relaxed" dir="ltr" style={{ color: theme.colors.success }}>
                {output}
              </pre>
            )}
            {error && (
              <pre
                className="whitespace-pre-wrap mt-4 pt-4 text-base leading-relaxed"
                dir="ltr"
                style={{ color: theme.colors.error, borderTop: `1px dashed rgba(255, 255, 255, 0.1)` }}
              >
                {error}
              </pre>
            )}
            {pyodideError && (
              <div className="mt-4 p-4 rounded-xl backdrop-blur-md" style={{ backgroundColor: theme.colors.warning + '20', border: `1px solid ${theme.colors.warning}40` }}>
                <pre className="whitespace-pre-wrap text-sm" dir="ltr" style={{ color: theme.colors.warning }}>{pyodideError}</pre>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
