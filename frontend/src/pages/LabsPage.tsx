import { useState } from 'react'
import { Loader2, Play, Trash2, Copy, Check, Terminal, Clock } from 'lucide-react'
import MonacoEditor from '@/components/lab/MonacoEditor'
import { usePyodide } from '@/hooks/usePyodide'

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
print("\nDataFrame:")
print(df)

# ── جرب تعديل الكود وشاهد النتيجة! ──
`

export default function LabsPage() {
  const [code, setCode] = useState(INITIAL_CODE)
  const [output, setOutput] = useState('')
  const [error, setError] = useState('')
  const [isCopied, setIsCopied] = useState(false)
  const { isLoading, isReady, error: pyodideError, runPython, isRunning, lastExecutionTime } = usePyodide()

  const handleRun = async () => {
    setOutput('')
    setError('')

    try {
      const result = await runPython(code)
      setOutput(result.output)
      if (result.error) setError(result.error)
    } catch (err) {
      setError(err instanceof Error ? err.message : String(err))
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
    <div className="h-[calc(100vh-3rem)] flex flex-col gap-4">
      {/* Header */}
      <div className="flex justify-between items-center">
        <div className="flex items-center gap-3">
          <Terminal className="w-6 h-6 text-masar-cyan" />
          <h1 className="text-3xl font-bold">المختبر الذكي</h1>
        </div>
        <div className="flex items-center gap-2">
          {isLoading && !isReady ? (
            <span className="px-3 py-1 rounded-full bg-masar-warning/20 text-masar-warning text-sm flex items-center gap-2">
              <Loader2 className="w-4 h-4 animate-spin" />
              جارٍ تحميل Python...
            </span>
          ) : isReady ? (
            <span className="px-3 py-1 rounded-full bg-masar-success/20 text-masar-success text-sm flex items-center gap-1">
              <span className="w-2 h-2 rounded-full bg-masar-success animate-pulse" />
              Python جاهز
            </span>
          ) : (
            <span className="px-3 py-1 rounded-full bg-masar-error/20 text-masar-error text-sm">
              فشل التحميل
            </span>
          )}
        </div>
      </div>

      {/* Main content: 60/40 split */}
      <div className="flex-1 grid grid-cols-5 gap-4 min-h-0">
        {/* Editor Panel: 60% */}
        <div className="col-span-3 flex flex-col card min-h-0">
          {/* Editor toolbar */}
          <div className="flex justify-between items-center p-3 border-b border-masar-border shrink-0
">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-masar-cyan" />
              <span className="font-medium">محرر الكود</span>
              <span className="text-xs text-masar-text-dark bg-masar-bg px-2 py-0.5 rounded">Python</span>
            </div>
            <div className="flex gap-1">
              <button
                onClick={handleCopy}
                className="p-2 hover:bg-masar-surface-hover rounded transition-colors"
                title="نسخ"
              >
                {isCopied ? (
                  <Check className="w-4 h-4 text-masar-success" />
                ) : (
                  <Copy className="w-4 h-4" />
                )}
              </button>
              <button
                onClick={handleReset}
                className="p-2 hover:bg-masar-surface-hover rounded transition-colors"
                title="إعادة تعيين"
              >
                <Trash2 className="w-4 h-4" />
              </button>
            </div>
          </div>

          {/* Monaco Editor */}
          <div className="flex-1 min-h-0 overflow-hidden">
            <MonacoEditor
              value={code}
              onChange={setCode}
              language="python"
              // Editor is h-full of this container
            />
          </div>

          {/* Run button */}
          <div className="p-3 border-t border-masar-border shrink-0">
            <button
              onClick={handleRun}
              disabled={!isReady || isRunning}
              className="btn-primary flex items-center justify-center gap-2 w-full py-2.5 shadow-lg shadow-masar-cyan/30 hover:shadow-lg hover:shadow-masar-cyan/50 transition-shadow disabled:opacity-50"
            >
              <span className="w-5 h-5 flex items-center justify-center">
                {isRunning ? (
                  <Loader2 className="w-5 h-5 animate-spin" />
                ) : (
                  <Play className="w-5 h-5" />
                )}
              </span>
              <span className="font-semibold">تشغيل الكود</span>
            </button>
          </div>
        </div>

        {/* Output Panel: 40% */}
        <div className="col-span-2 flex flex-col card min-h-0">
          {/* Output header */}
          <div className="flex justify-between items-center p-3 border-b border-masar-border shrink-0">
            <div className="flex items-center gap-2">
              <Terminal className="w-4 h-4 text-masar-cyan" />
              <span className="font-medium">النتيجة</span>
              {lastExecutionTime !== null && (
                <span className="flex items-center gap-1 text-xs text-masar-text-muted">
                  <Clock className="w-3 h-3" />
                  {lastExecutionTime} ms
                </span>
              )}
            </div>
            <button
              onClick={handleClear}
              className="p-2 hover:bg-masar-surface-hover rounded transition-colors text-sm flex items-center gap-1"
            >
              <Trash2 className="w-3.5 h-3.5" />
              مسح
            </button>
          </div>

          {/* Output content */}
          <div className="flex-1 p-4 overflow-auto font-mono text-sm bg-masar-bg rounded-b-lg min-h-0">
            {isRunning && !output && !error && (
              <div className="flex items-center justify-center h-full text-masar-text-muted">
                <Loader2 className="w-5 h-5 animate-spin mr-2" />
                جارٍ التنفيذ...
              </div>
            )}
            {!isRunning && !output && !error && (
              <div className="h-full flex items-center justify-center text-masar-text-dark">
                <div className="text-center">
                  <Terminal className="w-12 h-12 mx-auto mb-2 opacity-50" />
                  <p className="text-sm">سيظهر الـ Output هنا</p>
                  <p className="text-xs mt-1 opacity-60">اضغط "تشغيل الكود" لرؤية النتيجة</p>
                </div>
              </div>
            )}
            {output && (
              <pre className="text-masar-success whitespace-pre-wrap" dir="ltr">
                {output}
              </pre>
            )}
            {error && (
              <pre className="text-masar-error whitespace-pre-wrap border-t border-masar-border/20 mt-2 pt-2" dir="ltr">{error}</pre>
            )}
            {pyodideError && (
              <pre className="text-masar-warning whitespace-pre-wrap" dir="ltr">{pyodideError}</pre>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}
