import { useEffect, useRef } from 'react'
import * as monaco from 'monaco-editor'

try {
  monaco.editor.defineTheme('masar-dark', {
    base: 'vs-dark',
    inherit: true,
    rules: [
      { token: 'comment', foreground: '6A9955' },
      { token: 'keyword', foreground: '569CD6' },
      { token: 'string', foreground: 'CE9178' },
      { token: 'number', foreground: 'B5CEA8' },
      { token: 'type', foreground: '4EC9B0' },
    ],
    colors: {
      'editor.background': '#0F172A',
      'editor.foreground': '#F8FAFC',
      'editor.lineHighlightBackground': '#1E293B',
      'editor.selectionBackground': '#334155',
      'editorCursor.foreground': '#00FFFF',
      'editorLineNumber.foreground': '#64748B',
      'editorLineNumber.activeForeground': '#00FFFF',
    },
  })
} catch {
  // Theme already defined in another instance (e.g. Strict Mode or HMR)
}

interface CodeEditorProps {
  value: string
  onChange: (value: string) => void
  language?: string
  readOnly?: boolean
  height?: string | number
}

export default function MonacoEditor({
  value,
  onChange,
  language = 'python',
  readOnly = false,
  height,
}: CodeEditorProps) {
  const containerRef = useRef<HTMLDivElement>(null)
  const editorRef = useRef<monaco.editor.IStandaloneCodeEditor | null>(null)

  useEffect(() => {
    if (!containerRef.current) return

    editorRef.current = monaco.editor.create(containerRef.current, {
      value,
      language,
      theme: 'masar-dark',
      readOnly,
      minimap: { enabled: false },
      fontSize: 14,
      fontFamily: "'JetBrains Mono', monospace",
      lineNumbers: 'on',
      scrollBeyondLastLine: false,
      automaticLayout: true,
      padding: { top: 16, bottom: 16 },
      renderLineHighlight: 'line',
      cursorBlinking: 'smooth',
      cursorSmoothCaretAnimation: 'on',
      smoothScrolling: true,
      tabSize: 4,
      insertSpaces: true,
      wordWrap: 'on',
      suggest: {
        showKeywords: true,
        showSnippets: true,
      },
    })

    editorRef.current.onDidChangeModelContent(() => {
      const newValue = editorRef.current?.getValue() || ''
      onChange(newValue)
    })

    return () => {
      editorRef.current?.dispose()
    }
  }, []) // eslint-disable-line react-hooks/exhaustive-deps

  useEffect(() => {
    if (editorRef.current) {
      const currentValue = editorRef.current.getValue()
      if (currentValue !== value) {
        editorRef.current.setValue(value)
      }
    }
  }, [value])

  useEffect(() => {
    if (editorRef.current) {
      const model = editorRef.current.getModel()
      if (model) {
        monaco.editor.setModelLanguage(model, language)
      }
    }
  }, [language])

  // Compute the style for height
  const style: React.CSSProperties = { height: '100%', minHeight: '300px' }
  if (height) {
    style.height = typeof height === 'number' ? `${height}px` : height
    if (typeof height === 'string' && height.endsWith('%')) {
      // If percentage, ensure it fills container
    }
  }

  return (
    <div
      ref={containerRef}
      className="h-full w-full rounded-lg overflow-hidden"
      style={style}
    />
  )
}
